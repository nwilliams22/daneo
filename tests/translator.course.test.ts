import { afterEach, describe, expect, it, vi } from "vitest";
import { translateCourse } from "../src/features/explore/course-api";
import { translateOutcomeSchema } from "../src/features/explore/translation-contract";

afterEach(() => vi.unstubAllGlobals());

describe("course adapter", () => {
  it("returns the shared contract and reviewed gap without network access", () => {
    const fetch = vi.fn(() => { throw new Error("Network forbidden"); });
    vi.stubGlobal("fetch", fetch);
    const outcome = translateCourse("친구가 학교에 가요");
    expect(translateOutcomeSchema.parse(outcome)).toEqual(outcome);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("Expected reviewed translation");
    expect(outcome.result.natural_english).toBe("My friend goes to school");
    expect(outcome.result.literal_gap).not.toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["quantum spaceship", "저는 물을 마셔요 ", "저는 물을 마셔요!"])("refuses %s without guessing or normalizing", input => {
    const outcome = translateCourse(input);
    expect(translateOutcomeSchema.parse(outcome)).toEqual(outcome);
    expect(outcome).toMatchObject({ ok: false, error: { code: "outside-course" } });
  });
});
