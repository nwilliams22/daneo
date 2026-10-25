// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { db } from "../src/db/db";
import { allWords } from "../src/content";
import TypingDrillRoute from "../src/features/drills/typing/TypingDrill";

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", enabled: false }),
}));

let root: Root;
let container: HTMLDivElement;
const words = allWords.filter((w) => ["w_jeo", "w_mul", "w_masida"].includes(w.id));
const keys: Record<string, string[]> = {
  저: ["KeyW", "KeyJ"],
  물: ["KeyA", "KeyN", "KeyF"],
  마시다: ["KeyA", "KeyK", "KeyT", "KeyL", "KeyE", "KeyK"],
};

async function mount(path = "/drill/typing") {
  root = createRoot(container);
  await act(async () => root.render(
    <MemoryRouter initialEntries={[path]}><TypingDrillRoute /></MemoryRouter>,
  ));
}

async function waitForText(text: string) {
  await vi.waitFor(async () => {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
    expect(container.textContent).toContain(text);
  });
}

async function learn() {
  expect(words).toHaveLength(3);
  await act(async () => {
    await db.knownWords.bulkPut(words.map((w) => ({ wordId: w.id, learnedAt: 1 })));
  });
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await db.knownWords.clear();
  await db.drillResults.clear();
  await db.srsCards.clear();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
});

it("loads learned words asynchronously, composes and scores input, and survives remount", async () => {
  await learn();
  for (let pass = 0; pass < 2; pass++) {
    await mount();
    await waitForText("Type the Korean");
    const prompt = container.querySelector(".text-xl.font-bold")!.textContent!;
    const word = words.find((w) => prompt === w.en)!;
    expect(word).toBeDefined();
    for (const code of keys[word.ko]) {
      await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { code, key: code.slice(-1).toLowerCase(), bubbles: true })));
    }
    expect(container.textContent).toContain(word.ko);
    await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    // The scoreboard moved into the page rail and reads "1 of 1 correct"
    // rather than "1/1 correct" (BAD-281).
    await waitForText("of 1 correct · 100%");
    await vi.waitFor(async () => {
      expect(await db.drillResults.where("kind").equals("typing").count()).toBe(pass + 1);
    });
    expect((await db.drillResults.toArray()).every((row) => row.correct)).toBe(true);
    if (pass === 0) await act(async () => root.unmount());
  }
});

it("starts from the empty state when words are learned while mounted", async () => {
  await mount();
  await waitForText("No words to type yet");
  await learn();
  await waitForText("Type the Korean");
});

it("renders the empty review state when no typing mistakes exist", async () => {
  await learn();
  await mount("/drill/typing?review=1");
  await waitForText("Nothing left to review");
});
