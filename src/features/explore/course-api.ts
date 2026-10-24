import { lookupSubmittedSentence } from "../../lib/corpus-translator";
import { hasNoHangul, type UntaughtWord } from "../../lib/course-input";
import type { TranslateOutcome } from "./translation-contract";

/** List words for a sentence of prose without inventing a conjunction. */
function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

/**
 * A refusal that names what was not found. Which of the three it is follows
 * from the lookup alone: a submission with no Hangul, a submission containing
 * a word the course has nowhere, or a submission whose every word is taught
 * but whose sentence is not one of the reviewed ones. None of them guesses a
 * meaning, and the third states plainly that a new combination is not covered.
 */
function refusalMessage(submitted: string, untaught: readonly UntaughtWord[]): string {
  if (hasNoHangul(submitted)) {
    return "Type a Korean sentence from a lesson. English input is not supported here.";
  }
  if (untaught.length > 0) {
    // Scoped to the lookup on purpose: the claim is that no course word
    // matches this form, not that the word is unteachable or not Korean.
    const named = joinWords(untaught.map(word => word.word));
    return `No course word matches ${named}. Only sentences built from the course's own words can be broken down here — nothing is guessed. Browse the lesson sentences below to see what is covered.`;
  }
  return "Every word here is taught, but this is not one of the lesson sentences. Only the sentences the lessons actually use can be broken down — a new combination of taught words is not covered, and nothing is guessed. Browse the lesson sentences below to find a close one.";
}

// Same typed result/error boundary as the development Local/Cloud adapters.
// This path reads bundled course data only: no transport or model lifecycle.
export function translateCourse(input: string): TranslateOutcome {
  const outcome = lookupSubmittedSentence(input);
  if (outcome.status === "translated") return { ok: true, result: outcome.result };
  if (outcome.reason === "no-exact-match") {
    return {
      ok: false,
      error: {
        code: "outside-course",
        message: refusalMessage(outcome.submitted, outcome.untaught),
        submitted: outcome.submitted,
        untaught: outcome.untaught,
      },
    };
  }
  const messages = {
    "ambiguous-match": {
      code: "ambiguous-course",
      message: "The course has more than one sentence written this way, so a single meaning cannot be chosen safely. Add the sentence's own punctuation and spacing, or pick it from the lesson sentences below.",
    },
    "invalid-source": {
      code: "invalid-course",
      message: "The course entry for this sentence cannot be displayed safely. Try another lesson sentence.",
    },
  } as const;
  return {
    ok: false,
    error: { ...messages[outcome.reason], submitted: outcome.submitted, untaught: [] },
  };
}
