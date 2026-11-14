// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TypingQuestion } from "../src/features/drills/engine/questions";
import { composerReduce, EMPTY_COMPOSER, renderComposer } from "../src/lib/hangul/composer";
import { allWords } from "../src/content";

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", enabled: false }),
}));
let root: Root;
let container: HTMLDivElement;
const word = allWords.find((w) => w.ko === "좋아하다")!;
const onAnswer = vi.fn();

function paste(text: string, target: EventTarget = window) {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", { value: {
    getData: (format: string) => format === "text/plain" ? text : "",
  } });
  target.dispatchEvent(event);
  return event;
}
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  onAnswer.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<TypingQuestion word={word} onAnswer={onAnswer} onNext={() => {}} />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
it("accepts clipboard Hangul and submits it correctly, then locks the answer", async () => {
  await act(async () => { expect(paste(word.ko.normalize("NFD")).defaultPrevented).toBe(true); });
  expect(container.textContent).toContain("좋아하다");
  await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })));
  expect(onAnswer).toHaveBeenCalledExactlyOnceWith(true);
  expect(container.textContent).toContain("Correct!");
  await act(async () => { paste("물"); });
  expect(container.textContent).not.toContain("좋아하다물");
});
it("does not intercept paste into other editable fields or empty clipboard data", async () => {
  const input = document.createElement("input");
  container.append(input);
  await act(async () => {
    expect(paste("좋아하다", input).defaultPrevented).toBe(false);
    expect(paste("").defaultPrevented).toBe(false);
  });
  expect(container.querySelector<HTMLButtonElement>("button.bg-teal\\/35")?.disabled).toBe(true);
  expect(onAnswer).not.toHaveBeenCalled();
});
it("commits an active syllable before paste and supports jamo backspace afterward", () => {
  let state = composerReduce(EMPTY_COMPOSER, { type: "jamo", jamo: "ㄴ" });
  state = composerReduce(state, { type: "jamo", jamo: "ㅏ" });
  state = composerReduce(state, { type: "paste", text: " 좋아하다" });
  expect(renderComposer(state)).toBe("나 좋아하다");
  state = composerReduce(state, { type: "backspace" });
  expect(renderComposer(state)).toBe("나 좋아핟");
  state = composerReduce(state, { type: "jamo", jamo: "ㅏ" });
  expect(renderComposer(state)).toBe("나 좋아하다");
});

it("scores a wrong pasted answer as wrong and removes the handler on unmount", async () => {
  await act(async () => { paste("물"); });
  await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })));
  expect(onAnswer).toHaveBeenCalledExactlyOnceWith(false);
  await act(async () => root.unmount());
  expect(paste(word.ko).defaultPrevented).toBe(false);
});
