// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { allWords, wordById } from "../src/content";
import { db } from "../src/db/db";
import ReviewSessionRoute, { buildQuestion } from "../src/features/review/ReviewSession";
import { mulberry32 } from "../src/lib/rng";

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", enabled: false }),
}));

const originalRandom = Math.random;
let root: Root | undefined;
let container: HTMLDivElement;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  // A plain seeded RNG avoids retaining millions of shuffle calls in a spy.
  Math.random = mulberry32(404);
  await Promise.all([
    db.srsCards.clear(),
    db.drillResults.clear(),
    db.savedTranslations.clear(),
  ]);
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container.remove();
  Math.random = originalRandom;
});

it("includes exactly one correct meaning in every vocabulary review question", () => {
  const gapPool = { items: [], byId: new Map() };
  for (const word of allWords) {
    const question = buildQuestion("word", word.id, gapPool);
    expect(question?.kind).toBe("word");
    if (question?.kind !== "word") throw new Error(`Missing question: ${word.id}`);
    expect(question.item).toEqual(word);
    expect(question.options).toHaveLength(4);
    expect(question.options.filter((option) => option.id === word.id)).toEqual([word]);
    expect(question.options.filter((option) => option.en === word.en)).toEqual([word]);
    expect(new Set(question.options.map((option) => option.en)).size).toBe(4);
  }
});

it.each([
  ["w_jada", "자다", "to sleep"],
  ["w_jakda", "작다", "to be small"],
])("renders and accepts the answer for due %s on repeated visits", async (id, ko, en) => {
  expect(wordById.get(id)).toMatchObject({ ko, en });
  // The reported screenshots show 작다, not 자다. Exercise both through the
  // actual due-card route, including leaving and starting the session again.
  await db.srsCards.put({ kind: "word", itemId: id, due: 0, interval: 0, ease: 0, lapses: 0 });
  for (let visit = 0; visit < 2; visit++) {
    root = createRoot(container);
    await act(async () => {
      root!.render(<MemoryRouter><ReviewSessionRoute /></MemoryRouter>);
    });
    await vi.waitFor(async () => {
      await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
      expect(container.textContent).toContain(ko);
      const choices = Array.from(container.querySelectorAll("button"));
      expect(choices.filter((button) => button.textContent === en)).toHaveLength(1);
    });
    if (visit === 1) {
      const answer = Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === en)!;
      await act(async () => answer.click());
      await vi.waitFor(async () => {
        expect(await db.drillResults.toArray()).toEqual([
          expect.objectContaining({ kind: "word", itemId: id, correct: true }),
        ]);
      });
    }
    await act(async () => root!.unmount());
    root = undefined;
  }
});
