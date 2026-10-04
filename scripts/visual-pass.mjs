// Visual pass for module pages — renders them in a real browser and screenshots them.
//
//   npm run visual:pass -- m124 m125 m126
//
// Starts the dev server and a headless Chrome, seeds the two things a module page
// is gated behind (the onboarding flags in localStorage and the module's words in
// IndexedDB), then writes one PNG per module plus a report.json to
// `.visual-pass/`. Exits non-zero if a page renders empty or logs a console error.
//
// Options:
//   --origin <url>   use an already-running server instead of starting one
//   --out <dir>      output directory (default `.visual-pass`)
//   --port <n>       dev server port when this script starts one (default 5177)
//   --keep-known     do not wipe existing knownWords rows before seeding
//
// Written because the browser check kept being handed back as "no desktop access
// in this workspace". There is a browser on the box; this is the whole recipe.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2).filter((a) => a !== "--");
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);
const moduleIds = argv.filter((a) => /^m\d+$/.test(a));
const outDir = path.resolve(repoRoot, flag("out", ".visual-pass"));
const port = Number(flag("port", "5177"));
let origin = flag("origin", null);

if (moduleIds.length === 0) {
  console.error("usage: npm run visual:pass -- m124 m125 m126");
  process.exit(2);
}

const modules = JSON.parse(readFileSync(path.join(repoRoot, "src/content/modules.json"), "utf8"));
const byId = new Map(modules.map((m) => [m.id, m]));
const sentences = JSON.parse(readFileSync(path.join(repoRoot, "src/content/sentences.json"), "utf8"));
const sentenceById = new Map(sentences.map((s) => [s.id, s]));
for (const id of moduleIds) {
  if (!byId.has(id)) {
    console.error(`unknown module: ${id}`);
    process.exit(2);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(check, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  do {
    last = await check();
    if (last.ready) return last;
    await sleep(250);
  } while (Date.now() < deadline);
  return last;
}

async function waitForHttp(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return true;
    } catch {
      await sleep(250);
    }
  }
  return false;
}

// Playwright's download is the browser we have here; CHROME_PATH wins if set.
function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = path.join(homedir(), ".cache/ms-playwright");
  if (!existsSync(cache)) return null;
  const candidates = [];
  for (const dir of readdirSync(cache)) {
    for (const rel of [
      "chrome-linux64/chrome",
      "chrome-linux/chrome",
      "chrome-headless-shell-linux64/chrome-headless-shell",
    ]) {
      const p = path.join(cache, dir, rel);
      if (existsSync(p)) candidates.push(p);
    }
  }
  // A full chrome beats the headless shell: same rendering, more of the API.
  candidates.sort((a, b) => Number(a.includes("headless-shell")) - Number(b.includes("headless-shell")));
  return candidates[0] ?? null;
}

class Session {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.consoleErrors = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        this.consoleErrors.push(
          msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "),
        );
      } else if (msg.method === "Runtime.exceptionThrown") {
        this.consoleErrors.push(
          msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text,
        );
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 30000);
    });
  }

  waitForEvent(method) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.ws.removeEventListener("message", onMessage);
        reject(new Error(`CDP timeout: ${method}`));
      }, 30000);
      const onMessage = (event) => {
        if (JSON.parse(event.data).method !== method) return;
        clearTimeout(timer);
        this.ws.removeEventListener("message", onMessage);
        resolve();
      };
      this.ws.addEventListener("message", onMessage);
    });
  }

  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) {
      throw new Error(
        `page threw: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`,
      );
    }
    return r.result.value;
  }
}

const connect = (wsUrl) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("open", () => resolve(new Session(ws)));
    ws.addEventListener("error", () => reject(new Error(`cannot connect to ${wsUrl}`)));
  });

const children = [];
function cleanup() {
  for (const c of children) {
    try {
      process.kill(-c.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
}
process.on("exit", cleanup);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130));

mkdirSync(outDir, { recursive: true });

if (!origin) {
  origin = `http://localhost:${port}`;
  const vite = spawn("npm", ["run", "dev", "--", "--port", String(port), "--strictPort"], {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore",
  });
  children.push(vite);
  if (!(await waitForHttp(`${origin}/`))) {
    console.error(`dev server did not come up on ${origin}`);
    process.exit(1);
  }
}

const browserBin = findBrowser();
if (!browserBin) {
  console.error(
    "no browser found — set CHROME_PATH, or install one with `npx playwright install chromium`",
  );
  process.exit(1);
}
const cdpPort = 9222 + (port % 100);
const profileDir = path.join(outDir, ".chrome-profile");
const chrome = spawn(
  browserBin,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ],
  { detached: true, stdio: "ignore" },
);
children.push(chrome);
const cdp = `http://127.0.0.1:${cdpPort}`;
if (!(await waitForHttp(`${cdp}/json/version`))) {
  console.error(`browser did not expose CDP on ${cdp}`);
  process.exit(1);
}
console.log(`browser: ${browserBin}\norigin:  ${origin}\n`);

const target = await (
  await fetch(`${cdp}/json/new?${encodeURIComponent(`${origin}/`)}`, { method: "PUT" })
).json();
const sess = await connect(target.webSocketDebuggerUrl);
await sess.send("Page.enable");
await sess.send("Runtime.enable");
await sess.send("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 1400,
  deviceScaleFactor: 1,
  mobile: false,
});
const initialPage = await waitFor(async () => sess.evaluate(`(() => ({
  ready: location.origin === ${JSON.stringify(origin)}
    && document.readyState === 'complete' && !!document.querySelector('#root'),
  url: location.href,
  state: document.readyState,
}))()`));
if (!initialPage.ready) {
  console.error(`browser did not load the app: ${JSON.stringify(initialPage)}`);
  process.exit(1);
}

async function reloadPage() {
  const loaded = sess.waitForEvent("Page.loadEventFired");
  await sess.send("Page.reload");
  await loaded;
}

// Gate 1 — onboarding. Without this every route renders the "where should you
// start?" screen instead of the module.
await sess.evaluate(`localStorage.setItem('daneo-settings', JSON.stringify({
  state: { romanizationVisible: true, theme: 'light', audioEnabled: false,
           speechRate: 0.9, onboardingDone: true, hangulDone: true },
  version: 0,
})), 'ok'`);

// The flags only apply on a reload, and Dexie creates the `daneo` database the
// first time a page that reads it mounts. Opening the database by name before
// Dexie does would create an empty version-1 copy and break its upgrade path —
// so load a module page first, then seed, and never open the db cold.
await sess.evaluate(`(location.hash = '#/learn/${moduleIds[0]}'), 'ok'`);
await reloadPage();
const firstPage = await waitFor(async () => sess.evaluate(`(() => ({
  ready: document.querySelector('h1')?.innerText.includes(${JSON.stringify(byId.get(moduleIds[0]).title)}) ?? false,
  url: location.href,
  state: document.readyState,
  bodyChars: document.body?.innerText.length ?? 0,
}))()`));
if (!firstPage.ready) {
  console.error(`module page did not render before seeding: ${JSON.stringify(firstPage)}`);
  for (const error of sess.consoleErrors) console.error(`console error: ${error}`);
  process.exit(1);
}

// Gate 2 — known words. The sentence layer only shows what the learner has
// checked off, so an unseeded page renders the vocabulary and nothing under it.
const wordIds = [...new Set(moduleIds.flatMap((id) => byId.get(id).wordIds))];
const database = await waitFor(async () => sess.evaluate(`(async () => {
  if (!(await indexedDB.databases()).some((db) => db.name === 'daneo')) {
    return { ready: false, error: 'daneo database missing' };
  }
  const db = await new Promise((res, rej) => {
    const request = indexedDB.open('daneo');
    request.onsuccess = () => res(request.result);
    request.onerror = () => rej(request.error);
  });
  const state = {
    ready: db.objectStoreNames.contains('knownWords'),
    error: 'knownWords object store missing',
    version: db.version,
    stores: [...db.objectStoreNames],
  };
  db.close();
  return state;
})()`));
if (!database.ready) {
  console.error(`seeding failed after 60s of rendered module page: ${JSON.stringify(database)}`);
  for (const error of sess.consoleErrors) console.error(`console error: ${error}`);
  process.exit(1);
}
const seeded = await sess.evaluate(`(async () => {
  const wipe = ${has("keep-known") ? "false" : "true"};
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('daneo');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  if (!db.objectStoreNames.contains('knownWords')) {
    const stores = [...db.objectStoreNames];
    db.close();
    return { error: 'knownWords object store missing', version: db.version, stores };
  }
  await new Promise((res, rej) => {
    const tx = db.transaction('knownWords', 'readwrite');
    const os = tx.objectStore('knownWords');
    if (wipe) os.clear();
    for (const wordId of ${JSON.stringify(wordIds)}) os.put({ wordId, learnedAt: Date.now() });
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
  const rows = await new Promise((res, rej) => {
    const q = db.transaction('knownWords', 'readonly').objectStore('knownWords').count();
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
  db.close();
  return { rows };
})()`);
if (seeded.error) {
  console.error(`seeding failed: ${JSON.stringify(seeded)}`);
  for (const error of sess.consoleErrors) console.error(`console error: ${error}`);
  process.exit(1);
}
console.log(`seeded ${wordIds.length} words · knownWords rows: ${seeded.rows}\n`);

const report = [];
let failures = 0;
for (const moduleId of moduleIds) {
  const mod = byId.get(moduleId);
  sess.consoleErrors.length = 0;
  await sess.evaluate(`(location.hash = '#/learn/${moduleId}'), 'ok'`);
  await reloadPage();
  const page = await waitFor(async () => sess.evaluate(`(() => ({
    ready: (document.querySelector('h1')?.innerText.includes(${JSON.stringify(mod.title)}) ?? false)
      && document.body.innerText.includes(${JSON.stringify(`${mod.wordIds.length}/${mod.wordIds.length}`)}),
    url: location.href,
    state: document.readyState,
    bodyChars: document.body?.innerText.length ?? 0,
  }))()`));
  if (!page.ready) sess.consoleErrors.push(`module page did not render after 60s: ${JSON.stringify(page)}`);

  // Checked against the content rather than the markup: the sentence cards carry
  // no test hook, and the point is that the authored sentence reached the screen.
  const expected = mod.sentenceIds.map((id) =>
    sentenceById
      .get(id)
      .ko.map((c) => c.t)
      .join(" "),
  );
  const probe = await sess.evaluate(`(() => {
    const text = document.body.innerText;
    const normalise = (s) => s.replace(/\\s+/g, ' ').trim();
    const body = normalise(text);
    return {
      hash: location.hash,
      heading: document.querySelector('h1')?.innerText ?? null,
      chars: text.length,
      hangul: (text.match(/[\\uac00-\\ud7a3]/g) || []).length,
      scrollHeight: document.documentElement.scrollHeight,
      checklist: text.match(/(\\d+)\\s*\\/\\s*(\\d+)/)?.[0] ?? null,
      missingSentences: ${JSON.stringify(expected)}.filter((s) => !body.includes(normalise(s))),
      onboarding: /where should you start/i.test(text),
    };
  })()`);

  const shot = await sess.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  const file = path.join(outDir, `${moduleId}.png`);
  writeFileSync(file, Buffer.from(shot.data, "base64"));

  const problems = [];
  if (probe.onboarding) problems.push("onboarding screen — the settings seed did not take");
  if (probe.chars < 1500) problems.push(`page is nearly empty (${probe.chars} chars)`);
  if (probe.hangul < 100) problems.push(`almost no Korean on the page (${probe.hangul})`);
  if (!probe.heading?.includes(mod.title)) {
    problems.push(`heading does not name the module: ${JSON.stringify(probe.heading)}`);
  }
  if (probe.checklist !== `${mod.wordIds.length}/${mod.wordIds.length}`) {
    problems.push(`checklist reads ${probe.checklist}, expected ${mod.wordIds.length}/${mod.wordIds.length}`);
  }
  for (const s of probe.missingSentences) problems.push(`sentence missing from the page: ${s}`);
  for (const e of sess.consoleErrors) problems.push(`console error: ${e}`);
  if (problems.length > 0) failures += 1;

  report.push({ moduleId, title: mod.title, ...probe, problems, screenshot: file });
  console.log(
    `${problems.length === 0 ? "ok  " : "FAIL"} ${moduleId} · ${probe.chars} chars · ${probe.hangul} hangul · checklist ${probe.checklist} · ${probe.scrollHeight}px`,
  );
  for (const p of problems) console.log(`       ${p}`);
}

writeFileSync(path.join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${report.length - failures}/${report.length} pages rendered · ${outDir}`);
console.log("Look at the PNGs — this script proves the page rendered, not that it reads well.");
process.exit(failures > 0 ? 1 : 0);
