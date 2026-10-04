import { describe, expect, it } from "vitest";
import {
  buildTranslatePrompt,
  parseTranslationText,
} from "../server/prompts/translate.ts";

// §6.3 — the translator contract: zod rejects malformed API output with a
// typed error; well-formed output (fenced or not) parses to the exact shape
// the client renders.

const GOOD = {
  direction: "en-to-ko",
  korean: "친구가 보고 싶어요",
  romanization: "chinguga bogo sipeoyo",
  natural_english: "I miss my friend",
  gloss: [
    { chunk: "친구가", gloss: "friend-[subj]", role: "subject" },
    { chunk: "보고 싶어요", gloss: "see-want", role: "verb" },
  ],
  particles: [{ particle: "가", job: "Marks 친구 as the subject." }],
  literal_gap:
    "Korean says 'I want to see my friend' — missing someone is expressed through seeing.",
  cultural_note: "",
};

describe("translator contract (§6.3)", () => {
  it("accepts a well-formed reply", () => {
    const r = parseTranslationText(JSON.stringify(GOOD));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.result.korean).toBe(GOOD.korean);
  });

  it("keeps romanization in the default model contract while the lever is undecided", () => {
    const { romanization: _missing, ...reply } = GOOD;
    expect(parseTranslationText(JSON.stringify(reply)).ok).toBe(false);
    expect(buildTranslatePrompt("friend")).toContain('"romanization"');
  });

  it("strips markdown fences before parsing", () => {
    const r = parseTranslationText(
      "```json\n" + JSON.stringify(GOOD) + "\n```",
    );
    expect(r.ok).toBe(true);
  });

  it("rejects non-JSON with a typed error, never throws", () => {
    const r = parseTranslationText("Sorry, I can't help with that.");
    expect(r).toEqual({
      ok: false,
      code: "bad-json",
      message: expect.any(String),
    });
  });

  it("rejects a wrong shape (bad role enum)", () => {
    const bad = {
      ...GOOD,
      gloss: [{ chunk: "친구가", gloss: "friend", role: "topic" }],
    };
    const r = parseTranslationText(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("invalid-shape");
  });

  it("rejects missing required fields", () => {
    const rest: Record<string, unknown> = { ...GOOD };
    delete rest.korean;
    const r = parseTranslationText(JSON.stringify(rest));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("invalid-shape");
  });

  it("uses the requested direction over a model label", () => {
    const r = parseTranslationText(JSON.stringify({ ...GOOD, direction: "ko-to-en" }), "en-to-ko");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.result.direction).toBe("en-to-ko");
  });

  it("prompt embeds the input and demands bare JSON", () => {
    const p = buildTranslatePrompt("수고하셨습니다");
    expect(p).toContain("수고하셨습니다");
    expect(p).toContain('"ko-to-en"');
    expect(p).toContain("no markdown fences");
    expect(p).toContain('"literal_gap"');
  });

  it("selects direction by Hangul script and closes the role set", () => {
    expect(buildTranslatePrompt("I study Korean")).toContain('"en-to-ko"');
    expect(buildTranslatePrompt("한글 공부해요")).toContain('"ko-to-en"');
    expect(buildTranslatePrompt("I study Korean")).toContain("CLOSED SET");
  });
});
