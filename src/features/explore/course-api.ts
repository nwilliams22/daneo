import { translateCorpusSentence } from "../../lib/corpus-translator";
import type { TranslateOutcome } from "./translation-contract";

// Same typed result/error boundary as the development Local/Cloud adapters.
// This path reads bundled course data only: no transport or model lifecycle.
export function translateCourse(input: string): TranslateOutcome {
  const outcome = translateCorpusSentence(input);
  if (outcome.status === "translated") return { ok: true, result: outcome.result };
  const messages = {
    "no-exact-match": {
      code: "outside-course",
      message: "This sentence is outside the course translator’s reviewed examples. Even familiar words in a new combination cannot be translated here. Copy a complete Korean sentence from a lesson, including its spacing and punctuation, or try an example below.",
    },
    "ambiguous-match": {
      code: "ambiguous-course",
      message: "The course has more than one match for this sentence. I cannot choose a meaning safely. Try another course sentence.",
    },
    "invalid-source": {
      code: "invalid-course",
      message: "The course entry for this sentence cannot be displayed safely. Try another course sentence.",
    },
  } as const;
  return { ok: false, error: messages[outcome.reason] };
}
