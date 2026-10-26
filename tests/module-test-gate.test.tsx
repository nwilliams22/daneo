// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/db/db";
import {
  allSentences,
  allWords,
  moduleById,
  sentenceById,
  wordById,
} from "../src/content";
import { buildModuleTest } from "../src/lib/moduleTest";
import ModulePage from "../src/features/learn/ModulePage";
import ModuleTestRoute from "../src/features/learn/ModuleTest";
import { autoColumns } from "../src/features/drills/engine/QuizOptions";
import { sentenceEnglish } from "../src/lib/distractors";

// Nick, 2026-10-26: he reached a module test "without checking off any words"
// and was asked to translate a sentence built from words he had never marked
// as learned. PROJECT.md §1 rule 1 and §"Known-word gating" both forbid that,
// and SentenceList / VocabChecklist / LearnPage all already assume it — the
// test route was the one path that did not enforce it.

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", enabled: false }),
}));

let root: Root;
let container: HTMLDivElement;
const module1 = moduleById.get("m1")!;

async function mount(path: string) {
  root = createRoot(container);
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/learn/:moduleId" element={<ModulePage />} />
          <Route path="/learn/:moduleId/test" element={<ModuleTestRoute />} />
        </Routes>
      </MemoryRouter>,
    ),
  );
}

/** The route's own first render returns null while Dexie's first query is in
 *  flight, so every assertion here has to settle first. */
async function settled() {
  await vi.waitFor(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(container.textContent).not.toBe("");
  });
}

const markAllKnown = () =>
  db.knownWords.bulkPut(
    module1.wordIds.map((wordId) => ({ wordId, learnedAt: 1 })),
  );

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await Promise.all([db.knownWords.clear(), db.moduleTests.clear()]);
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
});

describe("the module test is gated on the vocabulary checklist", () => {
  it("bounces the test route back to the module when nothing is checked off", async () => {
    await mount(`/learn/${module1.id}/test`);
    await settled();
    // Landed on the module page, not on a question.
    expect(container.textContent).not.toContain("Module Test");
    expect(container.textContent).toContain("Module test"); // the rail card
  });

  it("asks no question at all when nothing is checked off", async () => {
    // The gate matters because this module's test really does sample
    // sentences — the thing word-first gating exists to withhold. (The lesson
    // prose on the module page teaches those sentences and is not gated, so
    // the assertion is on the test's own chrome, not on the Korean text.)
    const built = buildModuleTest(
      module1,
      wordById,
      sentenceById,
      allWords,
      allSentences,
    );
    expect(built.some((q) => q.kind === "sentence" || q.kind === "role")).toBe(
      true,
    );

    await mount(`/learn/${module1.id}/test`);
    await settled();
    for (const chrome of [
      "What does it mean?",
      "Pick the Korean",
      "Type this word",
      "See results",
    ])
      expect(container.textContent).not.toContain(chrome);
  });

  it("runs the test once every word is checked off", async () => {
    await markAllKnown();
    await mount(`/learn/${module1.id}/test`);
    await settled();
    expect(container.textContent).toContain("Module Test");
    expect(container.textContent).toContain(`of `);
  });

  it("locks the module page's test card until the checklist is done", async () => {
    await mount(`/learn/${module1.id}`);
    await settled();
    expect(container.textContent).toContain("Locked");
    expect(container.textContent).not.toContain("Take the test");
    expect(
      container.querySelector(`a[href="/learn/${module1.id}/test"]`),
    ).toBeNull();
  });

  it("unlocks that card once the checklist is done", async () => {
    await markAllKnown();
    await mount(`/learn/${module1.id}`);
    await settled();
    await vi.waitFor(async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(container.textContent).toContain("Take the test");
    });
    expect(container.textContent).not.toContain("Locked");
  });
});

describe("answer options take two columns when they are short", () => {
  const opts = (...labels: string[]) =>
    labels.map((label, i) => ({ id: `o${i}`, label }));

  it("pairs up four short readings", () => {
    expect(
      autoColumns(
        opts(
          "I listened to music",
          "I am working at the office now",
          "I study Korean at the library",
          "I watched a movie with my friend",
        ),
      ),
    ).toBe(2);
  });

  it("keeps one column when any reading is long", () => {
    expect(
      autoColumns(
        opts(
          "I listened to music",
          "According to a newspaper survey, the popularity of Korean pop culture is reportedly rising in countries around the world",
          "I study Korean at the library",
          "I watched a movie with my friend",
        ),
      ),
    ).toBe(1);
  });

  it("pairs up the short half of the shipped corpus and not the long tail", () => {
    // Guards the threshold against drifting to "always 1" (the bug Nick saw)
    // or "always 2" (which would cram the 143-character readings).
    const counts = { 1: 0, 2: 0 };
    for (const s of sentenceById.values())
      counts[autoColumns(opts(sentenceEnglish(s)))] += 1;
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(counts[1]).toBeGreaterThan(0);
  });
});
