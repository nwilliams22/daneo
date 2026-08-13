# Daneo module-draft brief — shared contract

You are drafting ONE Ring 2 / Band 5 module for Daneo, a word-first Korean-learning
app at `/mnt/t7/Projects/daneo`. Your module brief file names the module id, order,
title theme, glue point(s), and the exact word slice.

**You must NOT edit any repo files.** All output goes to NEW files in
`/tmp/claude-1000/-mnt-t7-Projects-daneo/b958afff-5c30-4173-948e-1c90e25d9af9/scratchpad/`.
Do not commit anything.

## Read these first (mandatory, in this order)

1. `CURRICULUM.md` — §2b (the trimmed contract + Band 5) and §4 (content principles).
2. `src/content/modules/module-40.md` and `module-42.md` — the slim-md exemplars.
3. In `src/content/words.json`: every entry with `"moduleId": "m40"` or `"m42"` —
   this is the note voice you are imitating.
4. In `src/content/sentences.json`: all `s_m40_*` and `s_m42_*` entries — the
   three-layer format and note voice.
5. Last ~10 entries of `src/content/gap.json`.

## Hard rules learned from the last batch (violations broke the build)

- **Sentence chunk roles** are ONLY `subject`, `object`, `place`, `verb`, `other`
  (zod enum). There is NO `time` role — time expressions use `other`.
- **Particle word entries** (pos `particle`) must NEVER appear in any sentence's
  `wordIds` (validator rule particle-in-word-ids). The particle still gets its
  word entry; sentences just don't list it.
- **Attribution canon** (grep-verified, use these): verb--고 = M10 · -(으)면 = M20 ·
  -(으)면 돼요 = M23 · -는 것 = M17 · -기 nominalizer = M13 · 르-family table = M7 ·
  ㅅ-irregular (낫다) = M14, second member 젓다 = M40 · -지 마세요 = M14 ·
  -아/어 보다 try-machine = M16 · badge -(으)ㄴ/-는 = M24 · -(으)ㄹ 때 = M25 ·
  passive party = M36 · causative party = M37 · 것 같다 = M34 · -아/어도/-아/어야/밖에 = M39 ·
  -잖아요/-거든요 = M42 · 처럼 = M41 · -아/어 놓다/두다 = M40 · 마다 = M31.
- **NIKL sense collapse:** the ledger tracks base strings, so if your slice word's
  NIKL entry is a different sense than your primary teaching sense (check
  `reference/nikl-5965.tsv` — the 4th column hints hanja/sense), your note MUST
  cover the listed sense too, radar-style.

## The soul of the app (non-negotiable)

Every word gets a real note: hanja root decodes, compound splits (X = A + B where A
and B are already-taught words), "radar" catches (this 정 ≠ that 정), and IOU
payoffs (this word completes something an earlier module promised).

**VERIFY every cross-module claim.** Before writing "M12's 걸리다" you must grep
`src/content/words.json` for `"ko": "걸리다"` and read its `moduleId` and note.
Never cite a module or an earlier word's note from memory — check every single one.
If a word you want to lean on isn't taught, don't reference it as taught.
Module numbers: word `moduleId` fields map m1→Module 1 etc. Words with moduleId
m31–m39 are Ring 2 Band 4; everything lower is Ring 1.

## Output files (all in the scratchpad dir; NN = your module number)

1. `draft-mNN.words.json` — JSON array, teaching order. Each entry exactly:
   `{"id": "w_...", "ko": "...", "rom": "...", "en": "...", "pos": "...", "moduleId": "mNN", "notes": "..."}`
   - pos ∈ {noun, verb, adj, particle, phrase}; adverbs are tagged `noun` (house rule).
   - id = `w_` + Revised Romanization, no hyphens/spaces. Grep words.json to confirm
     the id is UNUSED; on collision disambiguate meaningfully (e.g. `w_gamda_eyes`).
   - rom: Revised Romanization matching the style of existing entries.
   - notes: 1–4 sentences, the house voice. Korean words inside notes are fine.
2. `draft-mNN.sentences.json` — JSON array of exactly 8 entries:
   `{"id": "s_mNN_slug", "en": [...], "gloss": [...], "ko": [...], "rom": "...", "wordIds": [...], "note": "..."}`
   - en/gloss/ko are parallel chunk arrays: `{"t": "...", "role": "...", "id": "a|b|v|..."}`;
     chunk ids must correspond across the three layers. Copy role vocabulary from
     existing sentences (subject/object/verb/other/place/time...).
   - gloss = word-for-word Korean-order gloss with `-[topic]`/`-[obj]`-style particle tags,
     exactly like existing entries.
   - wordIds: only ids that exist in words.json OR in your own draft words — verify each.
   - ≥1 sentence per glue point; ≥3 sentences must recycle machinery from recent
     modules (M31–M39 glue or Ring 1 patterns) in FRESH surface forms.
   - **Dup law:** no ko chunk-joined sentence text may equal any existing sentence.
     Grep `src/content/sentences.json` for your key ko strings before finalizing.
   - Keep sentences at the difficulty of the m38/m39 exemplars: every grammar element
     either already taught or taught in YOUR module.
3. `draft-mNN.gap.json` — JSON array, 0–3 entries, only genuinely idiomatic/cultural:
   `{"id": "g_mNN_slug", "cat": "phrase|concept|structure", "ko": "...", "rom": "...", "lit": "...", "real": "...", "note": "..."}`
4. `draft-mNN.md` — the slim markdown, exactly the module-39.md shape:
   `# Korean, Word-First — Module NN: <Title>` · intro para · `**How to use this:**`
   line · `## Part 1 —` one concept part · `::vocab::` (with 1–2 organizing
   paragraphs around it) · glue part(s) · `## Part N — Building sentences` with a
   `**Spot the recycling:**` line, then `::sentences::`, then a `**Gap deck:**` line ·
   short `## What's next`. Target 55–65 lines.
5. `draft-mNN.meta.json`:
   `{"titleOptions": ["...", "...", "..."], "ledgerRows": ["word\tmNN\t5\tshort-en-gloss", ...], "notes": "..."}`
   - ledgerRows: ONE row per slice word you used (tab-separated literally). Grade-C
     slice words get `(C)` appended to the gloss. Beyond-list garnish words and any
     already-taught words get NO ledger row.

## Word slice rules

- Use ALL words in your brief's slice. If one truly cannot fit the module, drop it
  and say so in meta notes (it returns to the pool) — but try hard first.
- You may ADD up to 3 beyond-list garnish words (not on the NIKL list) when genuinely
  earned; mark them in meta notes. Check they're not already taught.
- Do NOT add other NIKL words beyond your slice (they may be reserved for other modules
  being drafted in parallel).

## Final report (your return text)

One paragraph: what you built, the organizing ideas, which slice words you dropped
(if any), garnish words added, and anything the reviewer should double-check.
