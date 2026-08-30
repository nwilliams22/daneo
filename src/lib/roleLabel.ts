import type { Chunk, Role, Sentence } from "../types";

// Sentence-roles drill (2026-08-29, Nick's tutor exercise): the learner
// labels the subject / object / place / verb of a Korean sentence, using
// the roles every chunk already carries. Pure grading lives here; the UI
// is features/drills/anatomy/RoleLabelQuestion.tsx.
//
// Corpus conventions this grading respects:
// - Time words, adverbs, and linking clauses (늦어서, 모르면, 친구가 문을
//   열자마자 …) are tagged "other" — labelling one is a miss.
// - A chunk tagged "verb" that merely links clauses ("소파가 있고," — the
//   M65/M66 style) is OPTIONAL: labelling it verb is fine, so is leaving it.
//   The verb that ends a sentence (last chunk, or one ending in . ! ?) is
//   required — Korean's predicate closes the clause, and that's the lesson.

export type CoreRole = Exclude<Role, "other">;
export const CORE_ROLES: readonly CoreRole[] = [
  "subject",
  "object",
  "place",
  "verb",
];

export interface RoleTarget {
  chunk: Chunk;
  expected: Role;
  /** Must the learner label this chunk? (false for "other" and for
   *  clause-linking verbs — see the module comment.) */
  required: boolean;
}

const endsSentence = (t: string) => /[.!?]$/.test(t);

/** The visible Korean chunks with what each one should be labelled. */
export function roleTargets(s: Sentence): RoleTarget[] {
  const visible = s.ko.filter((c) => c.t);
  return visible.map((chunk, i) => {
    const last = i === visible.length - 1;
    const required =
      chunk.role === "verb"
        ? last || endsSentence(chunk.t)
        : chunk.role !== "other";
    return { chunk, expected: chunk.role, required };
  });
}

/** True when the subject is understood from context (an empty chunk). */
export function hasDroppedSubject(s: Sentence): boolean {
  return s.ko.some((c) => !c.t && c.role === "subject");
}

/** Worth labelling: at least two visible pieces and something to find. */
export function labelable(s: Sentence): boolean {
  const targets = roleTargets(s);
  return targets.length >= 2 && targets.some((t) => t.required);
}

export interface GradedChunk {
  chunk: Chunk;
  expected: Role;
  given: CoreRole | undefined;
  ok: boolean;
}

export interface RoleGrade {
  correct: boolean;
  chunks: GradedChunk[];
}

/** Grade a labelling. `labels` maps chunk id → the learner's role; chunks
 *  left unlabelled are implicitly "other". */
export function gradeRoleLabels(
  s: Sentence,
  labels: ReadonlyMap<string, CoreRole>,
): RoleGrade {
  const chunks = roleTargets(s).map(({ chunk, expected, required }) => {
    const given = labels.get(chunk.id);
    const ok =
      expected === "other"
        ? given === undefined
        : required
          ? given === expected
          : given === undefined || given === expected;
    return { chunk, expected, given, ok };
  });
  return { correct: chunks.every((c) => c.ok), chunks };
}
