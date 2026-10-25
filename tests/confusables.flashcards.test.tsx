// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { db } from "../src/db/db";
import { confusables } from "../src/content";
import ConfusablesDrillRoute from "../src/features/drills/confusables/ConfusablesDrill";

// BAD-279: the flashcards are app-graded. Every logged result must follow from
// the true/false call against the shown sound, never from a self-report.

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", enabled: false, speak: vi.fn(), stop: vi.fn() }),
}));

let root: Root;
let container: HTMLDivElement;

async function mount(path = "/drill/confusables/flashcards") {
  root = createRoot(container);
  await act(async () => root.render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/drill/confusables/:mode" element={<ConfusablesDrillRoute />} />
      </Routes>
    </MemoryRouter>,
  ));
}

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
}

function button(label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll("button")].find((b) =>
    (b.textContent ?? "").trim().startsWith(label),
  );
  if (!found) throw new Error(`No "${label}" button: ${container.textContent}`);
  return found as HTMLButtonElement;
}

async function click(label: string) {
  const target = button(label);
  await act(async () => target.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

/** The letter on the card and the one sound the prompt asserts about it. */
function prompt(): { glyph: string; sound: string } {
  const glyph = container.querySelector(".text-8xl")?.textContent?.trim();
  const sound = (container.textContent ?? "").match(
    /This letter is\s*(\S+)\s*—\s*true or false\?/,
  )?.[1];
  if (!glyph || !sound) throw new Error(`No flashcard prompt: ${container.textContent}`);
  return { glyph, sound };
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await db.drillResults.clear();
  await db.srsCards.clear();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
});

it("grades the true/false call itself and logs that result, with no self-grade path", async () => {
  await mount();
  await settle();

  // Answer 12 cards, alternating between the honest call and the wrong one, so
  // both outcomes are exercised whichever way the item generator lands.
  for (let i = 0; i < 12; i++) {
    const { glyph, sound } = prompt();
    const item = confusables.find((c) => c.c === glyph);
    expect(item, `unknown glyph ${glyph}`).toBeDefined();

    // The sound is this letter's own or another confusable's — never a second
    // letter's reading of the same sound, which would make "false" wrong.
    const shownIsTrue = sound === item!.r;
    if (!shownIsTrue)
      expect(confusables.some((c) => c.r === sound && c.id !== item!.id)).toBe(true);

    // Nothing on the card lets the learner report their own correctness.
    expect(container.textContent).not.toMatch(/Got it|Missed it|Tap to reveal/);

    const call = i % 2 === 0 ? shownIsTrue : !shownIsTrue;
    await click(call ? "True" : "False");
    await settle();

    expect(container.textContent).toContain(i % 2 === 0 ? "Correct" : "Not quite");
    // The reveal card still teaches: the letter's real sound and its note.
    expect(container.textContent).toContain(item!.r);
    expect(container.textContent).toContain(item!.note);

    const logged = await db.drillResults.orderBy("at").last();
    expect(logged?.kind).toBe("confusable");
    expect(logged?.itemId).toBe(item!.id);
    expect(logged?.correct).toBe(call === shownIsTrue);

    await click("Next");
    await settle();
  }

  expect(await db.drillResults.count()).toBe(12);
  const correct = await db.drillResults.filter((r) => r.correct).count();
  expect(correct).toBe(6);
});

it("keeps dealing answerable cards when the review pool holds a single item", async () => {
  const item = confusables.find((c) => c.group === "compound")!;
  await act(async () => {
    await db.drillResults.add({
      kind: "confusable", itemId: item.id, correct: false, at: 1,
    });
  });
  await mount("/drill/confusables/flashcards?review=1");
  await settle();

  // Same letter every time, so the true/false case — not the item key — is
  // what has to be redrawn for the next card to be answerable.
  const sounds = new Set<string>();
  for (let i = 0; i < 12; i++) {
    const { glyph, sound } = prompt();
    expect(glyph).toBe(item.c);
    sounds.add(sound);
    // Answer wrong on purpose: a correct answer would clear the only item and
    // end the review session before the repeat is exercised.
    await click(sound === item.r ? "False" : "True");
    await settle();
    expect(container.textContent).toContain("Not quite");
    await click("Next");
    await settle();
  }
  expect(await db.drillResults.where("kind").equals("confusable").count()).toBe(13);
  // The case is redrawn per card, so the repeat is not the same question twice.
  expect(sounds.size).toBeGreaterThan(1);
});

it("accepts 1 = False and 2 = True from the keyboard and Enter to advance", async () => {
  await mount();
  await settle();

  const { glyph, sound } = prompt();
  const item = confusables.find((c) => c.c === glyph)!;
  const key = async (k: string) => {
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    });
    await settle();
  };

  await key("1"); // False
  expect((await db.drillResults.orderBy("at").last())?.correct).toBe(sound !== item.r);

  await key("Enter"); // advance to the next card
  expect(container.textContent).toContain("true or false?");

  const next = prompt();
  const nextItem = confusables.find((c) => c.c === next.glyph)!;
  await key("2"); // True
  expect((await db.drillResults.orderBy("at").last())?.correct).toBe(
    next.sound === nextItem.r,
  );
  expect(await db.drillResults.count()).toBe(2);
});
