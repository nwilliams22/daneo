import wordsJson from "./words.json";
import sentencesJson from "./sentences.json";
import confusablesJson from "./confusables.json";
import fontfacesJson from "./fontfaces.json";
import gapJson from "./gap.json";
import modulesJson from "./modules.json";
import module1Md from "./modules/module-1.md?raw";
import module2Md from "./modules/module-2.md?raw";
import module3Md from "./modules/module-3.md?raw";
import module4Md from "./modules/module-4.md?raw";
import module5Md from "./modules/module-5.md?raw";
import module6Md from "./modules/module-6.md?raw";
import module7Md from "./modules/module-7.md?raw";
import module8Md from "./modules/module-8.md?raw";
import module9Md from "./modules/module-9.md?raw";
import module10Md from "./modules/module-10.md?raw";
import moduleSpacingMd from "./modules/module-spacing.md?raw";
import moduleSoundMd from "./modules/module-sound.md?raw";
import hangulHistoryMd from "./modules/module-hangul-history.md?raw";
import { contentBundleSchema, type ContentBundle } from "../lib/schemas";

// Parsed once at module load — malformed content crashes dev immediately
// with a readable zod error. Cross-reference rules (word gating, chunk
// alignment) are enforced by validateContent() via `npm run validate:content`.
export const content: ContentBundle = contentBundleSchema.parse({
  words: wordsJson,
  sentences: sentencesJson,
  confusables: confusablesJson,
  gap: gapJson,
  modules: modulesJson,
  fontFaces: fontfacesJson,
});

export const allWords = content.words;
export const wordById = new Map(content.words.map((w) => [w.id, w]));

export const allSentences = content.sentences;
export const sentenceById = new Map(content.sentences.map((s) => [s.id, s]));

export const confusables = content.confusables;
export const confusableById = new Map(content.confusables.map((c) => [c.id, c]));
export const confusableGroups = ["compound", "vowel", "consonant", "tense"] as const;
export const confusablesByGroup = (group: string) =>
  content.confusables.filter((c) => c.group === group);

export const gapItems = content.gap;
export const gapById = new Map(content.gap.map((g) => [g.id, g]));
export const gapCats = ["structure", "phrase", "concept"] as const;
export const gapByCat = (cat: string) => content.gap.filter((g) => g.cat === cat);

export const modulesOrdered = [...content.modules].sort(
  (a, b) => a.order - b.order,
);
export const moduleById = new Map(content.modules.map((m) => [m.id, m]));

export const fontFaces = content.fontFaces;
export const fontLetterById = new Map(
  content.fontFaces.letters.map((l) => [l.id, l]),
);

/** Raw markdown bodies keyed by Module.contentMd. */
export const moduleMarkdown: Record<string, string> = {
  "modules/module-1.md": module1Md,
  "modules/module-2.md": module2Md,
  "modules/module-3.md": module3Md,
  "modules/module-4.md": module4Md,
  "modules/module-5.md": module5Md,
  "modules/module-6.md": module6Md,
  "modules/module-7.md": module7Md,
  "modules/module-8.md": module8Md,
  "modules/module-9.md": module9Md,
  "modules/module-10.md": module10Md,
  "modules/module-spacing.md": moduleSpacingMd,
  "modules/module-sound.md": moduleSoundMd,
  "modules/module-hangul-history.md": hangulHistoryMd,
};
