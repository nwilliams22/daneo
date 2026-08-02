import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTranslatePrompt, parseTranslationText } from "./prompts/translate.ts";

// The Phase A translator proxy (PROJECT.md §3): holds ANTHROPIC_API_KEY so
// the key never ships in client code. Run with `npm run server`.
// CORS is open because the desktop app calls from a tauri:// origin.

const here = dirname(fileURLToPath(import.meta.url));

/** Minimal .env loader (server/.env) — real env vars take precedence. */
function loadDotEnv() {
  let text: string;
  try {
    text = readFileSync(join(here, ".env"), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m && m[1] && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2]!.replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv();

const MODEL = "claude-sonnet-4-6"; // per PROJECT.md §3
const PORT = Number(process.env.PORT ?? 8787);

const app = new Hono();
app.use("*", cors());

app.get("/api/health", (c) => c.json({ ok: true }));

app.post("/api/translate", async (c) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return c.json(
      { error: { code: "no-key", message: "ANTHROPIC_API_KEY is not set — copy server/.env.example to server/.env and add your key." } },
      503,
    );
  }

  let input: string;
  try {
    const body = await c.req.json();
    input = String(body?.input ?? "").trim();
  } catch {
    input = "";
  }
  if (!input || input.length > 500) {
    return c.json(
      { error: { code: "bad-input", message: "Send JSON like {\"input\": \"a short phrase\"} (max 500 chars)." } },
      400,
    );
  }

  const client = new Anthropic();
  let text: string;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: buildTranslatePrompt(input) }],
    });
    text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  } catch (err) {
    const message =
      err instanceof Anthropic.APIError
        ? `Upstream API error (${err.status ?? "?"}): ${err.message}`
        : "Could not reach the Anthropic API.";
    return c.json({ error: { code: "upstream", message } }, 502);
  }

  const parsed = parseTranslationText(text);
  if (!parsed.ok) {
    return c.json({ error: { code: parsed.code, message: parsed.message } }, 502);
  }
  return c.json({ result: parsed.result });
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`daneo translator proxy → http://127.0.0.1:${info.port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠ ANTHROPIC_API_KEY not set — /api/translate will return 503.");
  }
});
