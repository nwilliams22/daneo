import type { ContentBundle } from "./schemas";

// Pure content validator — enforces the pedagogy rules that make this app
// what it is (PROJECT.md §1, §6.1). Runs via `npm run validate:content`;
// the build fails if any rule is violated.

export interface ContentError {
  code:
    | "dup-id"
    | "dup-module-order"
    | "missing-word"
    | "missing-sentence"
    | "orphan-word"
    | "orphan-sentence"
    | "multi-module-word"
    | "multi-module-sentence"
    | "word-from-later-module"
    | "particle-in-word-ids"
    | "chunk-mismatch"
    | "chunk-role-mismatch"
    | "confusable-group-too-small"
    | "gap-too-few-meanings"
    | "word-not-typeable"
    | "dup-sentence-text";
  message: string;
}

const HANGUL_ONLY = /^[가-힣ㄱ-ㆎ\s]+$/;

export function validateContent(bundle: ContentBundle): ContentError[] {
  const errors: ContentError[] = [];
  const err = (code: ContentError["code"], message: string) =>
    errors.push({ code, message });

  // ---- unique ids everywhere ----
  const checkUnique = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) err("dup-id", `Duplicate ${kind} id "${id}"`);
      seen.add(id);
    }
  };
  checkUnique("word", bundle.words.map((w) => w.id));
  checkUnique("sentence", bundle.sentences.map((s) => s.id));
  checkUnique("confusable", bundle.confusables.map((c) => c.id));
  checkUnique("gap", bundle.gap.map((g) => g.id));
  checkUnique("module", bundle.modules.map((m) => m.id));

  const wordById = new Map(bundle.words.map((w) => [w.id, w]));
  const sentenceIds = new Set(bundle.sentences.map((s) => s.id));
  const moduleById = new Map(bundle.modules.map((m) => [m.id, m]));

  // ---- module orders unique ----
  const orders = new Set<number>();
  for (const m of bundle.modules) {
    if (orders.has(m.order))
      err("dup-module-order", `Module order ${m.order} used more than once`);
    orders.add(m.order);
  }

  // ---- module references exist ----
  for (const m of bundle.modules) {
    for (const wid of m.wordIds)
      if (!wordById.has(wid))
        err("missing-word", `Module ${m.id} lists unknown word "${wid}"`);
    for (const sid of m.sentenceIds)
      if (!sentenceIds.has(sid))
        err("missing-sentence", `Module ${m.id} lists unknown sentence "${sid}"`);
  }

  // ---- every non-particle word belongs to exactly one module checklist ----
  const wordToModule = new Map<string, string>();
  for (const m of bundle.modules) {
    for (const wid of m.wordIds) {
      if (wordToModule.has(wid))
        err(
          "multi-module-word",
          `Word "${wid}" appears in module ${wordToModule.get(wid)} and ${m.id}`,
        );
      wordToModule.set(wid, m.id);
    }
  }
  for (const w of bundle.words) {
    if (w.pos !== "particle" && !wordToModule.has(w.id))
      err(
        "orphan-word",
        `Word "${w.id}" (${w.ko}) is in no module checklist — it can never be learned`,
      );
  }

  // ---- every sentence belongs to exactly one module ----
  const sentenceToModule = new Map<string, string>();
  for (const m of bundle.modules) {
    for (const sid of m.sentenceIds) {
      if (sentenceToModule.has(sid))
        err(
          "multi-module-sentence",
          `Sentence "${sid}" appears in module ${sentenceToModule.get(sid)} and ${m.id}`,
        );
      sentenceToModule.set(sid, m.id);
    }
  }
  for (const s of bundle.sentences) {
    if (!sentenceToModule.has(s.id))
      err("orphan-sentence", `Sentence "${s.id}" is in no module`);
  }

  // ---- word-first gating (§6.1): sentences may only use same-or-earlier-module words ----
  for (const s of bundle.sentences) {
    const moduleId = sentenceToModule.get(s.id);
    const sentenceModule = moduleId ? moduleById.get(moduleId) : undefined;
    for (const wid of s.wordIds) {
      const w = wordById.get(wid);
      if (!w) {
        err("missing-word", `Sentence ${s.id} references unknown word "${wid}"`);
        continue;
      }
      if (w.pos === "particle") {
        err(
          "particle-in-word-ids",
          `Sentence ${s.id} lists particle "${wid}" in wordIds — wordIds are gated content words only`,
        );
        continue;
      }
      if (sentenceModule) {
        const wordModule = moduleById.get(w.moduleId);
        if (wordModule && wordModule.order > sentenceModule.order)
          err(
            "word-from-later-module",
            `Sentence ${s.id} (module ${sentenceModule.id}, order ${sentenceModule.order}) uses word "${wid}" from later module ${wordModule.id} (order ${wordModule.order})`,
          );
      }
    }
  }

  // ---- chunk alignment: identical id sets and consistent roles across layers ----
  for (const s of bundle.sentences) {
    const layers = { en: s.en, gloss: s.gloss, ko: s.ko } as const;
    const idSets = Object.entries(layers).map(([name, chunks]) => ({
      name,
      ids: new Set(chunks.map((c) => c.id)),
      chunks,
    }));
    for (const layer of idSets) {
      if (layer.ids.size !== layer.chunks.length)
        err("chunk-mismatch", `Sentence ${s.id}: duplicate chunk ids in ${layer.name}`);
    }
    const [enSet, glossSet, koSet] = idSets;
    for (const id of enSet.ids) {
      if (!glossSet.ids.has(id))
        err("chunk-mismatch", `Sentence ${s.id}: chunk "${id}" present in en but missing from gloss`);
      if (!koSet.ids.has(id))
        err("chunk-mismatch", `Sentence ${s.id}: chunk "${id}" present in en but missing from ko`);
    }
    for (const id of glossSet.ids)
      if (!enSet.ids.has(id))
        err("chunk-mismatch", `Sentence ${s.id}: chunk "${id}" present in gloss but missing from en`);
    for (const id of koSet.ids)
      if (!enSet.ids.has(id))
        err("chunk-mismatch", `Sentence ${s.id}: chunk "${id}" present in ko but missing from en`);

    const roleOf = new Map<string, string>();
    for (const { name, chunks } of idSets) {
      for (const c of chunks) {
        const prior = roleOf.get(c.id);
        if (prior === undefined) roleOf.set(c.id, c.role);
        else if (prior !== c.role)
          err(
            "chunk-role-mismatch",
            `Sentence ${s.id}: chunk "${c.id}" has role "${c.role}" in ${name} but "${prior}" elsewhere`,
          );
      }
    }
  }

  // ---- confusable groups must support a 4-option same-group quiz (§6.2) ----
  const groups = new Map<string, Set<string>>();
  for (const c of bundle.confusables) {
    if (!groups.has(c.group)) groups.set(c.group, new Set());
    groups.get(c.group)!.add(c.r);
  }
  for (const [group, roms] of groups) {
    if (roms.size < 4)
      err(
        "confusable-group-too-small",
        `Confusable group "${group}" has only ${roms.size} distinct roman values — a 4-option same-group quiz is impossible`,
      );
  }

  // ---- gap quiz needs 4 distinct real meanings overall ----
  const reals = new Set(bundle.gap.map((g) => g.real));
  if (bundle.gap.length > 0 && reals.size < 4)
    err(
      "gap-too-few-meanings",
      `Only ${reals.size} distinct gap "real" meanings — the guess-the-meaning quiz needs at least 4`,
    );

  // ---- recycling rule (CURRICULUM.md §4): blocks repeat, assemblies don't —
  // no two sentences may render identical Korean text ----
  const koTexts = new Map<string, string>();
  for (const s of bundle.sentences) {
    const text = s.ko.map((c) => c.t).filter(Boolean).join(" ");
    const prior = koTexts.get(text);
    if (prior)
      err(
        "dup-sentence-text",
        `Sentence ${s.id} renders the same Korean as ${prior} ("${text}") — every sentence must be a fresh combination`,
      );
    else koTexts.set(text, s.id);
  }

  // ---- typing drill: word Korean must be modern Hangul (composable) ----
  for (const w of bundle.words) {
    if (!HANGUL_ONLY.test(w.ko))
      err(
        "word-not-typeable",
        `Word "${w.id}" ko "${w.ko}" contains non-Hangul characters`,
      );
  }

  return errors;
}
