import { describe, expect, it } from "vitest";
import { romanize } from "./romanize";
import { particlesIn, postprocessTranslation } from "./translation-postprocess";

const base = (korean: string) => ({ direction: "en-to-ko", korean, natural_english: "test", gloss: [], particles: [], literal_gap: "", cultural_note: "" });

describe("Revised Romanization", () => {
  it.each([
    ["물을", "mureul"], ["한국어", "hangugeo"], ["좋아해요", "joahaeyo"],
    ["친구가 학교에 가요", "chinguga hakgyoe gayo"], ["음악도", "eumakdo"],
    ["같이", "gachi"], ["설날", "seollal"], ["국립", "gungnip"],
    ["싫어해요", "sireohaeyo"],
    ["왔는데", "wanneunde"], ["없는", "eomneun"], ["많더라고요", "manteoragoyo"],
    ["밝혀요", "balkyeoyo"], ["축하해요", "chukahaeyo"], ["ㅋㅋㅋ", "kkk"],
    ["분 이에요", "bunieyo"], ["칫솔", "chissol"],
    ["나뭇잎이", "namunnipi"], ["묻히기", "muchigi"], ["갇혔어요", "gachyeosseoyo"],
  ])("romanizes %s as %s", (ko, rom) => expect(romanize(ko)).toBe(rom));
});

describe("particle postprocessing", () => {
  it.each([
    ["책은", "은", "topic"], ["저는", "는", "topic"], ["물이", "이", "subject"],
    ["친구가", "가", "subject"], ["밥을", "을", "object"], ["커피를", "를", "object"],
    ["학교에", "에", "destination"], ["학교에서", "에서", "place"],
    ["친구에게", "에게", "recipient"], ["친구한테", "한테", "recipient"],
    ["물도", "도", "also"], ["친구와", "와", "links"], ["물과", "과", "links"],
    ["친구랑", "랑", "links"], ["친구이랑", "이랑", "links"],
    ["집으로", "으로", "direction"], ["학교로", "로", "direction"],
    ["친구의", "의", "possession"], ["집부터", "부터", "starting"],
    ["집까지", "까지", "endpoint"], ["물만", "만", "only"],
  ])("finds %s as %s", (ko, particle, label) => {
    expect(particlesIn(ko)).toEqual([{ particle, job: expect.stringContaining(label) }]);
  });
  it("excludes verbal endings and invented particles", () => {
    const result = postprocessTranslation({ ...base("친구가 공부해요"), particles: [
      { particle: "가", job: "이 is a topic marker" },
      { particle: "이", job: "marks the topic" },
      { particle: "요", job: "polite ending" },
    ] });
    expect(result?.particles).toEqual([{ particle: "가", job: "marks the subject" }]);
    expect(result?.romanization).toBe("chinguga gongbuhaeyo");
    expect(particlesIn("공부해요 먹어요 가요 먹을 하는 좋은 할")).toEqual([]);
  });
  it("accepts model output without romanization", () => {
    expect(postprocessTranslation(base("물을 마셔요"))).toMatchObject({ romanization: "mureul masyeoyo", particles: [{ particle: "을" }] });
  });
  it("shows the Korean line's object marker in a split gloss chip", () => {
    const result = postprocessTranslation({ ...base("한국어를 공부해요"), gloss: [
      { chunk: "한국어", gloss: "Korean", role: "object" },
      { chunk: "을", gloss: "object marker 을", role: "other" },
      { chunk: "공부해요", gloss: "study", role: "verb" },
    ] });
    expect(result?.gloss[1]).toEqual({ chunk: "를", gloss: "object marker 를", role: "other" });
    expect(result?.particles).toEqual([{ particle: "를", job: "marks the object" }]);
  });
  it("leaves an unaligned or already correct gloss particle unchanged", () => {
    const gloss = [
      { chunk: "한국어", gloss: "Korean", role: "object" as const },
      { chunk: "를", gloss: "object marker", role: "other" as const },
      { chunk: "을", gloss: "object marker", role: "other" as const },
    ];
    expect(postprocessTranslation({ ...base("한국어를 공부해요"), gloss })?.gloss).toEqual(gloss);
  });
});
