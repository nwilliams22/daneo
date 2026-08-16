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
import module11Md from "./modules/module-11.md?raw";
import module12Md from "./modules/module-12.md?raw";
import module13Md from "./modules/module-13.md?raw";
import module14Md from "./modules/module-14.md?raw";
import module15Md from "./modules/module-15.md?raw";
import module16Md from "./modules/module-16.md?raw";
import module17Md from "./modules/module-17.md?raw";
import module18Md from "./modules/module-18.md?raw";
import module19Md from "./modules/module-19.md?raw";
import module20Md from "./modules/module-20.md?raw";
import module21Md from "./modules/module-21.md?raw";
import module22Md from "./modules/module-22.md?raw";
import module23Md from "./modules/module-23.md?raw";
import module24Md from "./modules/module-24.md?raw";
import module25Md from "./modules/module-25.md?raw";
import module26Md from "./modules/module-26.md?raw";
import module27Md from "./modules/module-27.md?raw";
import module28Md from "./modules/module-28.md?raw";
import module29Md from "./modules/module-29.md?raw";
import module30Md from "./modules/module-30.md?raw";
import module31Md from "./modules/module-31.md?raw";
import module32Md from "./modules/module-32.md?raw";
import module33Md from "./modules/module-33.md?raw";
import module34Md from "./modules/module-34.md?raw";
import module35Md from "./modules/module-35.md?raw";
import module36Md from "./modules/module-36.md?raw";
import module37Md from "./modules/module-37.md?raw";
import module38Md from "./modules/module-38.md?raw";
import module39Md from "./modules/module-39.md?raw";
import module40Md from "./modules/module-40.md?raw";
import module41Md from "./modules/module-41.md?raw";
import module42Md from "./modules/module-42.md?raw";
import module43Md from "./modules/module-43.md?raw";
import moduleJunmalMd from "./modules/module-junmal.md?raw";
import moduleKonglishMd from "./modules/module-konglish.md?raw";
import moduleS1Md from "./modules/module-s1.md?raw";
import moduleS2Md from "./modules/module-s2.md?raw";
import moduleS3Md from "./modules/module-s3.md?raw";
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
  "modules/module-11.md": module11Md,
  "modules/module-12.md": module12Md,
  "modules/module-13.md": module13Md,
  "modules/module-14.md": module14Md,
  "modules/module-15.md": module15Md,
  "modules/module-16.md": module16Md,
  "modules/module-17.md": module17Md,
  "modules/module-18.md": module18Md,
  "modules/module-19.md": module19Md,
  "modules/module-20.md": module20Md,
  "modules/module-21.md": module21Md,
  "modules/module-22.md": module22Md,
  "modules/module-23.md": module23Md,
  "modules/module-24.md": module24Md,
  "modules/module-25.md": module25Md,
  "modules/module-26.md": module26Md,
  "modules/module-27.md": module27Md,
  "modules/module-28.md": module28Md,
  "modules/module-29.md": module29Md,
  "modules/module-30.md": module30Md,
  "modules/module-31.md": module31Md,
  "modules/module-32.md": module32Md,
  "modules/module-33.md": module33Md,
  "modules/module-34.md": module34Md,
  "modules/module-35.md": module35Md,
  "modules/module-36.md": module36Md,
  "modules/module-37.md": module37Md,
  "modules/module-38.md": module38Md,
  "modules/module-39.md": module39Md,
  "modules/module-40.md": module40Md,
  "modules/module-41.md": module41Md,
  "modules/module-42.md": module42Md,
  "modules/module-43.md": module43Md,
  "modules/module-junmal.md": moduleJunmalMd,
  "modules/module-konglish.md": moduleKonglishMd,
  "modules/module-s1.md": moduleS1Md,
  "modules/module-s2.md": moduleS2Md,
  "modules/module-s3.md": moduleS3Md,
  "modules/module-spacing.md": moduleSpacingMd,
  "modules/module-sound.md": moduleSoundMd,
  "modules/module-hangul-history.md": hangulHistoryMd,
};
