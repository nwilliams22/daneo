// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { db } from "../src/db/db";
import { logDrillResult, recordModuleTest } from "../src/db/repo";
import { moduleById, wordById } from "../src/content";
import ModulePage from "../src/features/learn/ModulePage";
import MissedPracticeRoute from "../src/features/learn/MissedPractice";

// BAD-278: after a bad module test the learner must be able to SEE what was
// missed and practise exactly those, from the module page, in one click.

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", enabled: false }),
}));

let root: Root;
let container: HTMLDivElement;
const module1 = moduleById.get("m1")!;
const missedWord = wordById.get("w_mul")!;

async function mount(path: string) {
  root = createRoot(container);
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/learn/:moduleId" element={<ModulePage />} />
          <Route
            path="/learn/:moduleId/practice"
            element={<MissedPracticeRoute />}
          />
        </Routes>
      </MemoryRouter>,
    ),
  );
}

async function waitForText(text: string) {
  await vi.waitFor(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(container.textContent).toContain(text);
  });
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await Promise.all([
    db.knownWords.clear(),
    db.drillResults.clear(),
    db.srsCards.clear(),
    db.moduleTests.clear(),
  ]);
  // Nick's run: the module's words are all ticked off before the test.
  await db.knownWords.bulkPut(
    module1.wordIds.map((wordId) => ({ wordId, learnedAt: 1 })),
  );
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
});

it("records a failed attempt's misses and clears them as they come back right", async () => {
  await recordModuleTest("m1", 40, [
    { kind: "word", itemId: "w_mul" },
    { kind: "word", itemId: "w_mul" }, // same card twice in one attempt
    { kind: "anatomy", itemId: "s_water" },
  ]);
  expect((await db.moduleTests.get("m1"))?.misses).toEqual([
    { kind: "word", itemId: "w_mul" },
    { kind: "anatomy", itemId: "s_water" },
  ]);

  // A wrong answer leaves the list alone; a right one takes the item off it.
  await logDrillResult({ kind: "word", itemId: "w_mul", correct: false });
  expect((await db.moduleTests.get("m1"))?.misses).toHaveLength(2);
  await logDrillResult({ kind: "word", itemId: "w_mul", correct: true });
  expect((await db.moduleTests.get("m1"))?.misses).toEqual([
    { kind: "anatomy", itemId: "s_water" },
  ]);

  // A later attempt replaces the list rather than appending to it.
  await recordModuleTest("m1", 90, [{ kind: "typing", itemId: "w_mul" }]);
  const after = await db.moduleTests.get("m1");
  expect(after?.misses).toEqual([{ kind: "typing", itemId: "w_mul" }]);
  expect(after?.bestPct).toBe(90);
  expect(after?.attempts).toBe(2);
});

it("shows the misses on the module page and flags the word in the checklist", async () => {
  await recordModuleTest("m1", 40, [
    { kind: "word", itemId: "w_mul" },
    { kind: "anatomy", itemId: "s_water" },
  ]);
  await mount("/learn/m1");

  await waitForText("Missed on your last test · 2");
  expect(container.textContent).toContain("Practice these");
  // The word itself, not just a count.
  expect(container.textContent).toContain(missedWord.ko);
  // Nick's option 1 answered: the tick stays, a "practice" flag appears.
  expect(container.textContent).toContain("practice");
  expect(container.textContent).toContain(
    "came back wrong on your last module test",
  );
  const practice = [...container.querySelectorAll("a")].find(
    (a) => a.getAttribute("href") === "/learn/m1/practice",
  );
  expect(practice).toBeDefined();
});

it("practises only the misses, and empties as they are cleared", async () => {
  await recordModuleTest("m1", 40, [{ kind: "word", itemId: "w_mul" }]);
  await mount("/learn/m1/practice");

  await waitForText("Practice Misses");
  await waitForText("1 of 1");
  expect(container.textContent).toContain(missedWord.ko);

  // Answer it right: the session grades through the normal funnel, so the
  // card is scheduled AND the module's missed list loses the item.
  const option = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === missedWord.en,
  )!;
  expect(option).toBeDefined();
  await act(async () => option.click());
  await vi.waitFor(async () => {
    expect((await db.moduleTests.get("m1"))?.misses).toEqual([]);
    expect(
      await db.srsCards.get(["word", "w_mul"] as [string, string]),
    ).toBeDefined();
  });

  await act(async () => root.unmount());
  await mount("/learn/m1/practice");
  await waitForText("Nothing left to practice here");

  await act(async () => root.unmount());
  await mount("/learn/m1");
  await waitForText("Module test");
  expect(container.textContent).not.toContain("Missed on your last test");
});
