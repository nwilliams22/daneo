// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/db/db";
import { moduleById } from "../src/content";
import ExplorePage from "../src/features/explore/ExplorePage";

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", enabled: false, speak: vi.fn(), stop: vi.fn() }),
}));

let root: Root;
let container: HTMLDivElement;

async function mount() {
  root = createRoot(container);
  await act(async () => root.render(<MemoryRouter><ExplorePage /></MemoryRouter>));
}

async function settle() {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
}

function field(): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[aria-label="Korean course sentence"]');
  if (!input) throw new Error("No submission field");
  return input;
}

/** Type into a React-controlled field: the value must go through the native
 *  setter, or React's value tracking swallows the change event. */
async function type(input: HTMLInputElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit(text: string) {
  const input = field();
  await type(input, text);
  const button = [...container.querySelectorAll("button")]
    .find(candidate => candidate.textContent?.trim() === "Break it down");
  if (!button) throw new Error("No submit button");
  expect(button.hasAttribute("disabled"), `submit disabled for ${JSON.stringify(text)}`).toBe(false);
  await act(async () => button.click());
  await settle();
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await db.knownWords.clear();
  await db.savedTranslations.clear();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  container.remove();
});

describe("lesson sentence breakdown", () => {
  it("calls itself a breakdown, and the only translator left is the dev toggle", async () => {
    await mount();
    await settle();
    expect(container.textContent).toContain("Lesson sentence breakdown");
    // This suite runs with DEV true, so the gated-out model toggle renders.
    // Everything else on the surface must be free of the word; the production
    // render is asserted in release-features.test.tsx with DEV stubbed false.
    const shipped = (container.textContent ?? "")
      .replace("Model translator · development only", "");
    expect(shipped).not.toMatch(/translat/i);
  });

  // BAD-274 defect 1
  it("names the untaught word on a refusal instead of echoing the sentence", async () => {
    await mount();
    await submit("저는 양자컴퓨터를 봐요");
    const refusal = container.querySelector('[role="status"]');
    expect(refusal).not.toBeNull();
    const text = refusal!.textContent ?? "";
    expect(text).toContain("양자컴퓨터");
    expect(text).toContain("No course word matches");
    // The submitted sentence is no longer presented as the diagnosis.
    expect(text).not.toContain("저는 양자컴퓨터를 봐요");
  });

  it("says plainly that a recombination of taught words is not a lesson sentence", async () => {
    await mount();
    await submit("친구는 우유를 좋아해요");
    const text = container.querySelector('[role="status"]')?.textContent ?? "";
    expect(text).toContain("Every word here is taught");
    expect(text).toContain("친구는 우유를 좋아해요");
  });

  // BAD-274 defect 2
  it.each([
    ["a trailing space", "저는 물을 마셔요 "],
    ["a doubled space", "저는  물을 마셔요"],
    ["a non-breaking space", "저는 물을 마셔요"],
    ["an added terminal mark", "저는 물을 마셔요!"],
  ])("breaks down a lesson sentence submitted with %s", async (_label, input) => {
    await mount();
    await submit(input);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.textContent).toContain("I drink water");
    expect(container.textContent).toContain("Save to deck");
  });

  it("breaks down a lesson sentence whose terminal mark was left off", async () => {
    await mount();
    await submit("지금 몇 시예요");
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.textContent).toContain("지금 몇 시예요?");
  });

  // BAD-274 defect 3
  describe("browse path", () => {
    it("offers the sentences it can answer, and says how many are locked", async () => {
      const module1 = moduleById.get("m1");
      if (!module1) throw new Error("Module 1 is missing");
      await act(async () => {
        await db.knownWords.bulkPut(module1.wordIds.map(wordId => ({ wordId, learnedAt: 1 })));
      });
      await mount();
      await settle();

      const toggle = [...container.querySelectorAll("button")]
        .find(button => button.textContent?.includes("Browse the lesson sentences"));
      expect(toggle, "no browse control on the page").toBeDefined();
      expect(toggle!.textContent).toMatch(/of 1,?439 unlocked/);

      await act(async () => toggle!.click());
      await settle();
      const list = container.querySelector("#lesson-sentence-list");
      expect(list).not.toBeNull();
      expect(list!.textContent).toContain(module1.title);
      expect(list!.textContent).toContain("저는 물을 마셔요");

      // Picking one submits it, so a learner never retypes Korean.
      const pick = [...list!.querySelectorAll("button")]
        .find(button => button.textContent?.includes("저는 물을 마셔요"));
      expect(pick, "no pickable sentence in the list").toBeDefined();
      await act(async () => pick!.click());
      await settle();
      expect(container.textContent).toContain("I drink water");
      expect(field().value).toBe("저는 물을 마셔요");
    });

    it("explains an empty list rather than showing nothing", async () => {
      await mount();
      await settle();
      const toggle = [...container.querySelectorAll("button")]
        .find(button => button.textContent?.includes("Browse the lesson sentences"));
      await act(async () => toggle!.click());
      await settle();
      expect(container.querySelector("#lesson-sentence-list")!.textContent)
        .toContain("No sentences are unlocked yet");
    });
  });
});
