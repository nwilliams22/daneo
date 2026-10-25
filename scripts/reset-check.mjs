// Browser check for Settings → "Reset all progress" (BAD-280). Drives the real
// app in a real Chrome: seeds a learner with progress, clicks through the
// two-step confirmation, and reads Learn, Review and Stats after the app's own
// reload. Exits non-zero if any of it is wrong.
//
//   npm run check:reset
//   npm run check:reset -- --origin http://localhost:5173   (reuse a server)
//
// CDP plumbing follows scripts/visual-pass.mjs. Two traps it has already paid
// for, both marked below: the chrome profile must live OUTSIDE the repo (vite
// watches the tree and reloads the page forever otherwise), and the dev server
// must be warm before the browser asks for the page.

import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2).filter((a) => a !== "--");
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const port = Number(flag("port", "5179"));
const origin = flag("origin", `http://localhost:${port}`);
// Outside the repo on purpose: a chrome profile under the project makes vite's
// watcher fire on every SessionStorage write, which reloads the page forever.
const outDir = path.join(tmpdir(), "daneo-reset-check");
mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const modules = JSON.parse(readFileSync(path.join(repoRoot, "src/content/modules.json"), "utf8"));
const firstModule = modules[0];

async function waitFor(check, timeoutMs = 240000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  do {
    last = await check();
    if (last.ready) return last;
    await sleep(250);
  } while (Date.now() < deadline);
  return last;
}

async function waitForHttp(url, timeoutMs = 60000) {
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
        this.consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "));
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

  waitForEvent(method, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.ws.removeEventListener("message", onMessage);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
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
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails)
      throw new Error(`page threw: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
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
process.on("exit", () => {
  for (const c of children) {
    try {
      process.kill(-c.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130));

let serverRunning = false;
try {
  await fetch(`${origin}/`);
  serverRunning = true;
  console.log(`[step] reusing the dev server already on ${origin}`);
} catch {
  /* start one below */
}
if (!serverRunning) {
  const vite = spawn("npm", ["run", "dev", "--", "--port", String(port), "--strictPort"], {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore",
  });
  children.push(vite);
  if (!(await waitForHttp(`${origin}/`))) {
    console.error("dev server did not come up");
    process.exit(1);
  }
}

const browserBin = findBrowser();
if (!browserBin) {
  console.error("no browser found — set CHROME_PATH");
  process.exit(1);
}
const cdpPort = 9311;
const chrome = spawn(
  browserBin,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${path.join(outDir, ".chrome-profile")}`,
    "about:blank",
  ],
  { detached: true, stdio: "ignore" },
);
children.push(chrome);
const cdp = `http://127.0.0.1:${cdpPort}`;
if (!(await waitForHttp(`${cdp}/json/version`))) {
  console.error("browser did not expose CDP");
  process.exit(1);
}

// Warm the dev server before the browser asks: a cold vite optimises deps on
// the first request, and a page that arrives mid-optimisation never mounts.
await fetch(`${origin}/`);
await fetch(`${origin}/src/main.tsx`);
const target = await (await fetch(`${cdp}/json/new?about:blank`, { method: "PUT" })).json();
const sess = await connect(target.webSocketDebuggerUrl);
await sess.send("Page.enable");
await sess.send("Runtime.enable");
await sess.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1400, deviceScaleFactor: 1, mobile: false });
await sess.send("Page.navigate", { url: `${origin}/` });

// Page.loadEventFired does not arrive on this Chrome build, so reloads are
// detected with a window marker instead of a CDP event.
async function markPage() {
  await sess.evaluate(`(window.__resetCheck = 'here'), 'ok'`);
}

async function waitForFreshPage(label) {
  const fresh = await waitFor(async () =>
    sess.evaluate(`(() => ({ ready: document.readyState === 'complete'
      && typeof window.__resetCheck === 'undefined' && !!document.querySelector('#root') }))()`),
  );
  if (!fresh.ready) {
    console.error(`page did not come back after ${label}`);
    process.exit(1);
  }
}

async function reloadPage(label) {
  await markPage();
  await sess.send("Page.reload");
  await waitForFreshPage(`reload ${label}`);
}

const seedSettings = `localStorage.setItem('daneo-settings', JSON.stringify({
  state: { romanizationVisible: true, theme: 'light', audioEnabled: false,
           speechRate: 0.9, onboardingDone: true, hangulDone: true },
  version: 0,
})), 'ok'`;

console.log("[step] waiting for first load");
const ready = await waitFor(async () =>
  sess.evaluate(`(() => ({ ready: document.readyState === 'complete' && (document.getElementById('root')?.childElementCount ?? 0) > 0,
    kids: document.getElementById('root')?.childElementCount ?? -1, state: document.readyState,
    text: (document.body?.textContent || '').slice(0, 120) }))()`),
);
if (!ready.ready) {
  console.error("app did not load:", JSON.stringify(ready));
  console.error("console errors:", JSON.stringify(sess.consoleErrors));
  const dump = await sess.evaluate(`(() => ({ url: location.href, html: document.documentElement.outerHTML.slice(0, 600),
    res: performance.getEntriesByType('resource').map((e) => e.name.replace(location.origin, '')).slice(-8) }))()`);
  console.error("dump:", JSON.stringify(dump, null, 2));
  process.exit(1);
}

// 1. Become a learner with progress: onboarding done, then seed Dexie AFTER
//    the app has opened the database itself (never open it cold).
console.log("[step] app loaded:", JSON.stringify(ready));
await sess.evaluate(seedSettings);
await sess.evaluate(`(location.hash = '#/learn/${firstModule.id}'), 'ok'`);
await reloadPage("onboarding seeded");
const moduleReady = await waitFor(async () =>
  sess.evaluate(`(() => ({ ready: (document.body?.innerText || '').includes(${JSON.stringify(firstModule.title)}) }))()`),
);
if (!moduleReady.ready) {
  const dump = await sess.evaluate(`(() => ({ url: location.href, text: (document.body?.innerText || '').slice(0, 300),
    textContent: (document.body?.textContent || '').slice(0, 300), rootKids: document.getElementById('root')?.childElementCount ?? -1,
    title: document.title, ls: localStorage.getItem('daneo-settings') }))()`);
  console.error("console errors:", JSON.stringify(sess.consoleErrors, null, 2));
  console.error("module page did not render before seeding", JSON.stringify(dump, null, 2));
  for (const e of sess.consoleErrors) console.error(`console error: ${e}`);
  process.exit(1);
}

const seeded = await sess.evaluate(`(async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('daneo');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const wordIds = ${JSON.stringify(firstModule.wordIds)};
  const put = (store, rows) => new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const row of rows) os.put(row);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
  await put('knownWords', wordIds.map((wordId) => ({ wordId, learnedAt: Date.now() })));
  await put('drillResults', [{ kind: 'word', itemId: wordIds[0], correct: false, at: Date.now() }]);
  await put('srsCards', [{ kind: 'word', itemId: wordIds[0], due: Date.now() - 1000, stability: 1,
    difficulty: 5, elapsedDays: 0, scheduledDays: 0, reps: 1, lapses: 1, state: 1, lastReview: Date.now() }]);
  await put('moduleTests', [{ moduleId: ${JSON.stringify(firstModule.id)}, bestPct: 40, lastPct: 40, attempts: 1, at: Date.now(), misses: [] }]);
  await put('savedTranslations', [{ savedAt: Date.now(), result: { korean: '물', romanization: 'mul',
    natural_english: 'water', literal_gap: '', gloss: [], particles: [], cultural_note: '' } }]);
  const counts = {};
  for (const name of [...db.objectStoreNames]) {
    counts[name] = await new Promise((res, rej) => {
      const r = db.transaction(name, 'readonly').objectStore(name).count();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  db.close();
  return { stores: [...Object.keys(counts)], counts };
})()`);
console.log("seeded:", JSON.stringify(seeded.counts));

// Learn page before the reset — progress is non-zero.
await sess.evaluate(`(location.hash = '#/learn'), 'ok'`);
await reloadPage("learn, before the reset");
const before = await waitFor(async () =>
  sess.evaluate(`(() => { const t = document.body?.innerText || '';
    return { ready: t.includes('/'), progress: (t.match(/\\b\\d+\\/\\d+\\b/g) || []).slice(0, 4) }; })()`),
);
console.log("learn progress before reset:", JSON.stringify(before.progress));

// 2. Settings → Reset all progress: two steps.
await sess.evaluate(`(location.hash = '#/settings'), 'ok'`);
await reloadPage("settings");
const settings = await waitFor(async () =>
  sess.evaluate(`(() => ({ ready: (document.body?.innerText || '').includes('Reset all progress') }))()`),
);
if (!settings.ready) {
  console.error("settings page has no reset action");
  process.exit(1);
}

const step1 = await sess.evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Reset all progress');
  if (!b) return { clicked: false };
  b.click();
  return { clicked: true };
})()`);
if (!step1.clicked) {
  console.error("no 'Reset all progress' button");
  process.exit(1);
}
const panel = await waitFor(async () =>
  sess.evaluate(`(() => { const t = document.body?.innerText || '';
    return { ready: t.includes('Erase all progress on this device?'), text: t.slice(t.indexOf('Erase all progress')), }; })()`),
);
console.log("\n--- confirm panel ---\n" + (panel.text || "(not shown)").trim() + "\n---------------------\n");

const stillThere = await sess.evaluate(`(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('daneo'); r.onsuccess = () => res(r.result); });
  const n = await new Promise((res) => { const r = db.transaction('knownWords').objectStore('knownWords').count(); r.onsuccess = () => res(r.result); });
  db.close();
  return n;
})()`);
console.log("knownWords after step 1 (must be unchanged):", stillThere);

await markPage();
await sess.evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Erase everything');
  b.click();
  return 'ok';
})()`);
await waitForFreshPage("the app's own reload");

// 3. After the reset + the app's own reload.
const after = await waitFor(async () =>
  sess.evaluate(`(() => ({ ready: (document.body?.innerText || '').includes('Where should you start?'),
    heading: (document.body?.innerText || '').split('\\n').slice(0, 4).join(' / '),
    settingsKey: localStorage.getItem('daneo-settings') }))()`),
);
console.log("onboarding shown after reset:", after.ready, "| first lines:", after.heading);
console.log("persisted settings key:", after.settingsKey);

const counts = await sess.evaluate(`(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('daneo'); r.onsuccess = () => res(r.result); });
  const out = { version: db.version, counts: {} };
  for (const name of [...db.objectStoreNames])
    out.counts[name] = await new Promise((res) => {
      const r = db.transaction(name).objectStore(name).count();
      r.onsuccess = () => res(r.result);
    });
  db.close();
  return out;
})()`);
console.log("db version after reset (Dexie v2 == IndexedDB 20):", counts.version, "| counts:", JSON.stringify(counts.counts));

// 4. Finish onboarding as a fresh learner and read the three screens.
await sess.evaluate(seedSettings);
await sess.evaluate(`(location.hash = '#/learn'), 'ok'`);
await reloadPage("learn, after the reset");
const learn = await waitFor(async () =>
  sess.evaluate(`(() => { const t = document.body?.innerText || '';
    const m = t.match(/\\b\\d+\\/\\d+\\b/g) || [];
    return { ready: m.length > 0, progress: m.slice(0, 6), allZero: m.every((x) => x.startsWith('0/')) }; })()`),
);
console.log("learn progress after reset:", JSON.stringify(learn.progress), "all zero:", learn.allZero);

await sess.evaluate(`(location.hash = '#/review'), 'ok'`);
await reloadPage("review");
const review = await waitFor(async () =>
  sess.evaluate(`(() => { const t = document.body?.innerText || '';
    return { ready: t.includes('Nothing to review') || t.includes('Retake test') || t.includes('due now'),
      empty: t.includes('Nothing to review'), text: t.slice(t.indexOf('Review') >= 0 ? t.indexOf('Review') : 0, 600) }; })()`),
);
console.log("review empty:", review.empty);
console.log("--- review page ---\n" + (review.text || "").trim() + "\n-------------------");

await sess.evaluate(`(location.hash = '#/dashboard'), 'ok'`);
await reloadPage("stats");
const dash = await waitFor(async () =>
  sess.evaluate(`(() => { const t = document.body?.innerText || '';
    const i = t.indexOf('Progress');
    return { ready: i >= 0 && t.includes('Review queue'), zeroWords: t.includes('Nothing scheduled yet'),
      text: t.slice(i, i + 700) }; })()`),
);
console.log("stats: 'Nothing scheduled yet' present:", dash.zeroWords);
console.log("\n--- stats page ---\n" + (dash.text || "").trim() + "\n------------------");

for (const e of sess.consoleErrors) console.error(`console error: ${e}`);

const ok =
  after.ready &&
  after.settingsKey === null &&
  counts.version === 20 &&
  Object.values(counts.counts).every((n) => n === 0) &&
  learn.allZero &&
  review.empty &&
  dash.zeroWords &&
  stillThere > 0 &&
  sess.consoleErrors.length === 0;
console.log(`\nRESULT: ${ok ? "PASS" : "FAIL"}`);
process.exit(ok ? 0 : 1);
