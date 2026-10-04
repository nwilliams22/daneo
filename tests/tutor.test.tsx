import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { db } from "../src/db/db";
import { allSentences } from "../src/content";
import { readTutorContext, safeTutorReply } from "../src/features/tutor/tutor";
import TutorAnswer from "../src/features/tutor/TutorAnswer";

afterEach(async () => {
  await Promise.all([db.knownWords.clear(), db.srsCards.clear(), db.drillResults.clear(), db.moduleTests.clear()]);
});

describe("Ask Daneo safety boundary", () => {
  it("does not render model Korean or an unknown-word curriculum sentence", () => {
    const candidate = allSentences.find((sentence) => sentence.wordIds.length > 1)!;
    const known = new Set(candidate.wordIds.slice(0, -1));
    expect(safeTutorReply({ answer: "Try 새로운 words", sentenceIds: [candidate.id] }, known)).toBeNull();
    const reply = safeTutorReply({ answer: "Review the subject marker.", sentenceIds: [candidate.id] }, known)!;
    const html = renderToStaticMarkup(<MemoryRouter><TutorAnswer reply={reply} /></MemoryRouter>);
    expect(html).toContain("Review the subject marker.");
    expect(html).not.toContain(candidate.ko.map((chunk) => chunk.t).join(" "));
    expect(reply.examples).toHaveLength(0);
  });

  it("reads learner context without changing any Dexie table", async () => {
    await db.knownWords.put({ wordId: "w_mul", learnedAt: 1 });
    await db.srsCards.put({ kind: "word", itemId: "w_mul", due: 1, interval: 1, ease: 1, lapses: 0 });
    await db.drillResults.add({ kind: "word", itemId: "w_mul", correct: false, at: 1 });
    await db.moduleTests.put({ moduleId: "m1", bestPct: 80, lastPct: 80, attempts: 1, at: 1 });
    const tables = [db.knownWords, db.srsCards, db.drillResults, db.moduleTests, db.savedTranslations];
    const before = await Promise.all(tables.map((table) => table.toArray()));
    const context = await readTutorContext(2);
    const after = await Promise.all(tables.map((table) => table.toArray()));
    expect(context.known.has("w_mul")).toBe(true);
    expect(context.due).toBe(1);
    expect(context.misses).toHaveLength(1);
    expect(context.progress).toHaveLength(1);
    expect(after).toEqual(before);
  });
});
