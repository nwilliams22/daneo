// Renders the BAD-281 direction sheets to PNG.
//
//   node reference/design/bad281/shot.mjs            # all six sheets
//   node reference/design/bad281/shot.mjs hanji      # one direction
//
// Serves the repo root over HTTP (the mockups pull the app's own self-hosted
// fonts out of node_modules), drives the same headless Chrome that
// scripts/visual-pass.mjs finds, and writes one full-page PNG per direction per
// mode to .visual-pass/bad281/. Exits non-zero on a console error or an empty
// render.

import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const outDir = path.join(repoRoot, ".visual-pass/bad281");
const DIRECTIONS = ["hanji", "slate", "dancheong"];
const MODES = [
  { key: "light", query: "" },
  { key: "dark", query: "?dark" },
];

const only = process.argv.slice(2).filter((a) => DIRECTIONS.includes(a));
const wanted = only.length ? only : DIRECTIONS;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
};

// Static server over the repo root. Read-only, loopback, and it refuses any
// path that escapes the root.
const server = createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
  const file = path.join(repoRoot, rel);
  if (!file.startsWith(repoRoot) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = path.join(homedir(), ".cache/ms-playwright");
  if (!existsSync(cache)) return null;
  const found = [];
  for (const dir of readdirSync(cache)) {
    for (const rel of [
      "chrome-linux64/chrome",
      "chrome-linux/chrome",
      "chrome-headless-shell-linux64/chrome-headless-shell",
    ]) {
      const p = path.join(cache, dir, rel);
      if (existsSync(p)) found.push(p);
    }
  }
  found.sort((a, b) => Number(a.includes("headless-shell")) - Number(b.includes("headless-shell")));
  return found[0] ?? null;
}

const browserBin = findBrowser();
if (!browserBin) {
  console.error("no browser found — set CHROME_PATH or `npx playwright install chromium`");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const cdpPort = 9411;
const chrome = spawn(
  browserBin,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${path.join(outDir, ".chrome-profile")}`,
    "about:blank",
  ],
  { detached: true, stdio: "ignore" },
);
process.on("exit", () => {
  try {
    process.kill(-chrome.pid, "SIGTERM");
  } catch {
    /* already gone */
  }
  server.close();
});

const cdp = `http://127.0.0.1:${cdpPort}`;
for (let i = 0; i < 120; i++) {
  try {
    await fetch(`${cdp}/json/version`);
    break;
  } catch {
    await sleep(250);
  }
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
        this.consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(" "));
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
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    }
    return r.result.value;
  }
  waitForEvent(method) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 30000);
      const onMessage = (event) => {
        if (JSON.parse(event.data).method !== method) return;
        clearTimeout(timer);
        this.ws.removeEventListener("message", onMessage);
        resolve();
      };
      this.ws.addEventListener("message", onMessage);
    });
  }
}

const target = await (await fetch(`${cdp}/json/new?about:blank`, { method: "PUT" })).json();
const sess = await new Promise((resolve, reject) => {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  ws.addEventListener("open", () => resolve(new Session(ws)));
  ws.addEventListener("error", () => reject(new Error("cannot open CDP socket")));
});
await sess.send("Page.enable");
await sess.send("Runtime.enable");

const report = [];
for (const dir of wanted) {
  for (const mode of MODES) {
    const url = `${origin}/reference/design/bad281/${dir}.html${mode.query}`;
    // Measure at a short viewport: scrollHeight never drops below the viewport,
    // so a tall one would pad every sheet with empty canvas.
    await sess.send("Emulation.setDeviceMetricsOverride", {
      width: 2420,
      height: 400,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const loaded = sess.waitForEvent("Page.loadEventFired");
    await sess.send("Page.navigate", { url });
    await loaded;
    await sess.evaluate("document.fonts.ready.then(() => 'ok')");
    await sleep(250);

    const size = await sess.evaluate(`(() => {
      const d = document.documentElement;
      return { w: Math.ceil(d.scrollWidth), h: Math.ceil(d.scrollHeight),
               chars: document.body.innerText.length };
    })()`);
    if (size.chars < 400) {
      console.error(`${dir}/${mode.key}: page rendered empty (${size.chars} chars)`);
      process.exit(1);
    }
    await sess.send("Emulation.setDeviceMetricsOverride", {
      width: size.w,
      height: size.h,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(120);
    const shot = await sess.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    const file = path.join(outDir, `${dir}-${mode.key}.png`);
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    const bytes = statSync(file).size;
    report.push({ dir, mode: mode.key, file, px: `${size.w}×${size.h}`, bytes });
    console.log(`${file}  ${size.w}×${size.h}  ${(bytes / 1024).toFixed(0)} kB`);
  }
}

if (sess.consoleErrors.length) {
  for (const e of sess.consoleErrors) console.error(`console error: ${e}`);
  process.exit(1);
}
writeFileSync(path.join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`\n${report.length} sheets written to ${outDir}`);
process.exit(0);
