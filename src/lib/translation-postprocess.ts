import { romanize } from "./romanize.ts";
import words from "../content/words.json" with { type: "json" };
import { translationResultSchema } from "./schemas.ts";
import type { TranslationResult } from "../types.ts";

const particles: [string, string][] = [
  ["에서", "marks the place where an action happens"], ["에게", "marks a recipient"],
  ["한테", "marks a recipient"], ["이랑", "links companions or nouns"],
  ["으로", "marks a direction, means, or method"], ["부터", "marks a starting point"],
  ["까지", "marks an endpoint or limit"], ["은", "marks a topic or contrast"],
  ["는", "marks a topic or contrast"], ["이", "marks the subject"],
  ["가", "marks the subject"], ["을", "marks the object"], ["를", "marks the object"],
  ["에", "marks a destination, location, or time"], ["도", "adds 'also' or 'too'"],
  ["와", "links companions or nouns"], ["과", "links companions or nouns"],
  ["랑", "links companions or nouns"], ["로", "marks a direction, means, or method"],
  ["의", "marks possession or association"], ["만", "limits the noun to 'only'"],
];
const verbEnding = /(?:해요|하세요|했어요|합니다|습니다|ㅂ니다|이에요|예요|어요|아요|였어요|았어요|었어요|겠어요|세요|네요|죠|지만|면서|니까|려고|러|고|면|니|다|요)$/;
const predicateStems = new Set(words.filter(w => (w.pos === "verb" || w.pos === "adj") && w.ko.endsWith("다"))
  .map(w => w.ko.slice(0, -1)));
const nominalStems = new Set(words.filter(w => ["noun", "pronoun", "determiner"].includes(w.pos)).map(w => w.ko));
const nonNouns = new Set(["안", "못", "또", "아주", "너무", "같이", "많이", "빨리", "다시", "여기", "거기", "저기"]);

/** Extract only surface suffixes attached to a nominal token. */
export function particlesIn(korean: string): { particle: string; job: string }[] {
  const found: { particle: string; job: string }[] = [];
  for (const word of korean.match(/[가-힣]+/g) ?? []) {
    if (nonNouns.has(word) || verbEnding.test(word)) continue;
    if (/[은는을]$/.test(word) && predicateStems.has(word.slice(0, -1)) && !nominalStems.has(word.slice(0, -1))) continue;
    if (word === "할" || word === "될" || word === "갈" || word === "올" || word === "하는") continue;
    const entry = particles.find(([particle]) => word.length > particle.length && word.endsWith(particle));
    if (entry) found.push({ particle: entry[0], job: entry[1] });
  }
  return found;
}

/** Model output is deliberately a smaller shape than the saved learner contract. */
export function postprocessTranslation(raw: unknown): TranslationResult | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.korean !== "string") return null;
  const computed = particlesIn(candidate.korean);
  const claims = Array.isArray(candidate.particles) ? candidate.particles : [];
  const result = translationResultSchema.safeParse({
    ...candidate,
    romanization: romanize(candidate.korean),
    particles: computed.map(({ particle, job }) => {
      const claim = claims.find((item): item is { particle: string; job: string } =>
        item && typeof item === "object" && item.particle === particle && typeof item.job === "string");
      // Only preserve prose if it describes the same coded role, never a false role.
      const roleWords: Record<string, RegExp> = {
        "marks the subject": /subject/i,
        "marks the object": /object/i,
        "marks a topic or contrast": /topic|contrast/i,
        "marks the place where an action happens": /action|at|location|place/i,
        "marks a recipient": /recipient|to (a |the )?person/i,
        "links companions or nouns": /with|and|companion|connect/i,
        "marks a direction, means, or method": /direction|toward|means|method|by|with/i,
        "marks a starting point": /from|start/i,
        "marks an endpoint or limit": /until|up to|end|limit/i,
        "marks a destination, location, or time": /destination|location|place|time|to|at|in/i,
        "adds 'also' or 'too'": /also|too|additive/i,
        "marks possession or association": /possess|belong|of|association/i,
        "limits the noun to 'only'": /only|just|limit/i,
      };
      const agrees = claim && roleWords[job]?.test(claim.job) &&
        !(/topic/i.test(claim.job) && job === "marks the subject") &&
        !(/subject/i.test(claim.job) && job === "marks a topic or contrast");
      return { particle, job: agrees ? claim.job : job };
    }),
  });
  return result.success ? result.data : null;
}
