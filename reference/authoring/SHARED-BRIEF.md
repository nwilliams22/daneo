# Daneo module-draft brief — shared contract

You are drafting ONE Ring 2 module for Daneo, a word-first Korean-learning
app at `/mnt/t7/Projects/daneo`. Your module brief file names the module id, order,
title theme, glue point(s) or organizing machines, and the exact word slice.
Band 6 packs (m55+) are frequency-sliced with root-flavored grouping and are
GARNISH-FREE: zero beyond-list words — if a note needs an untaught word, it
rides frozen and glossed.

**You must NOT edit any repo files.** All output goes to NEW files in
`/tmp/claude-1000/-mnt-t7-Projects-daneo/8e786894-3743-45eb-a53e-6bb563981039/scratchpad/`.
Do not commit anything.

## Read these first (mandatory, in this order)

1. `CURRICULUM.md` — §2b (the trimmed contract + Band 5) and §4 (content principles).
2. `src/content/modules/module-40.md` and `module-44.md` — the slim-md exemplars.
3. In `src/content/words.json`: every entry with `"moduleId": "m40"` or `"m44"` —
   this is the note voice you are imitating.
4. In `src/content/sentences.json`: all `s_m40_*` and `s_m44_*` entries — the
   three-layer format and note voice.
5. Last ~10 entries of `src/content/gap.json`.

## Hard rules learned from the last batch (violations broke the build)

- **Sentence chunk roles** are ONLY `subject`, `object`, `place`, `verb`, `other`
  (zod enum). There is NO `time` role — time expressions use `other`.
  Roles are GRADED by the Sentence Roles drill (learners label them), so tag
  by Korean grammar, not by the English: the predicate that closes a sentence
  is `verb` (auxiliaries too — 차려 | 놓았어요 both `verb`; in a two-sentence
  item the first closer `피곤해요.` is `verb`); any bare 이/가 noun is `subject`
  even where English says "have" (시간이 없어요 → 시간이 subject) or in a
  double subject (한식은 반찬이 많아요 → both subject); the 되다 complement
  (의사가 됐어요) is `other`; subordinate clauses and connective verb forms
  (늦어서, 모르면, 친구가 문을 열자마자), adverbs, and time words are `other`.
  `lint_language.py` FAILs on the violations it can see.
- **Particle word entries** (pos `particle`) must NEVER appear in any sentence's
  `wordIds` (validator rule particle-in-word-ids). The particle still gets its
  word entry; sentences just don't list it.
- **Attribution canon** (grep-verified, use these): verb--고 = M10 · -(으)면 = M20 ·
  -(으)면 돼요 = M23 · -는 것 = M17 · -기 nominalizer = M13 · 르-family table = M7 ·
  ㅅ-irregular (낫다) = M14, second member 젓다 = M40 · -지 마세요 = M14 ·
  -아/어 보다 try-machine = M16 · badge -(으)ㄴ/-는 = M24 · -(으)ㄹ 때 = M25 ·
  passive party = M36 · causative party = M37 · 것 같다 = M34 · -아/어도/-아/어야/밖에 = M39 ·
  -잖아요/-거든요 = M42 · 처럼 = M41 · -아/어 놓다/두다 = M40 · 마다 = M31 ·
  (이)나 = M43 · 씩 = M43 · -기 위해(서) = M44 · 위한+noun = M44 ·
  -적/-스럽다/-답다/-롭다 factories = M45 · -(으)ㄴ 지 time-since = M46 ·
  께서 = M47 · 만큼 = M47 · -기로 하다 = M48 · -겠- full nuances = M49 ·
  -(으)려고 (하다) = M50 · -죠 = M51 · -아/어 버리다 = M52 ·
  -는데/-(으)ㄴ데 = M53 · 대로 = M54 · -게 adverbializer = M33 ·
  -자마자/-(으)면서/-는 동안 = M38 · -아/어지다/-게 되다 = M35.
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
m31–m39 are Ring 2 Band 4, m40–m54 are shipped Band 5 (complete); everything
lower is Ring 1. Band 6 opens at m55.

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
