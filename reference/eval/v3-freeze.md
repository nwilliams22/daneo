# Phase D v3 translation gate and development freeze

Frozen on 2026-10-05. This is a **reservation only and authorizes no scoring**.
No inference was run and no model replies were read for these items. Gate inputs
must remain unused by prompt development, candidate screening and training.
The separate development split is for candidate screening and prompt tuning;
it is not a gate and is expected to be burned. Neither split is training data.

**Operator note, added 2026-10-05.** Exclusion work needs only §Provenance,
§Exclusion rule and §Verification and next use. §Frozen gate items and coverage and
§Development split carry **per-item descriptions of reserved rows**: do not open them
to run the preflight, and do not quote, summarise or commit anything from them. The
preflight needs nothing from those two sections.

## Provenance

- Corpus commit: `bcd70d8dd1e46a9b6f94c9d7bc092a0b29b8fac1`.
- Source files at that commit: `src/content/sentences.json` and
  `src/content/modules.json`; each row records the owning module content path.
- Gate: [`v3-translation-set.json`](v3-translation-set.json), exactly ten rows;
  exact bytes pinned in [`v3-translation-set.sha256`](v3-translation-set.sha256).
- Development: [`v3-dev-set.json`](v3-dev-set.json), thirty rows; exact bytes
  pinned in [`v3-dev-set.sha256`](v3-dev-set.sha256).
- Inputs, expected English, Korean, gloss, romanization and sentence notes come
  directly from that commit. Join nonempty chunks with one U+0020 space and
  strip outer whitespace; retain punctuation. Module ownership is checked too.
- Rubric: [`v0-rubric.md`](v0-rubric.md), unchanged. This freeze sets no new bar.

## Exclusion rule

Reject on **any one** matching key: exact `corpusSentenceId`, normalized English
against English, or normalized Korean against Korean. Normalization is NFKC,
casefold, then removal of whitespace and Unicode punctuation. No paraphrases or
retranslations of the 96 prior reservations were used. Both new splits are
mutually disjoint and avoid v0 (10), v1 (10), old development (6), v2 (10), and
independent-1 (60): **136 total reserved rows**. They also avoid the 27 finalized
v1 training rows and the 250 training / 40 development v2 rows, including v2
source-text aliases. No previous reserved or training artifact is changed.

Required preflight from the repository root:

```sh
python3 reference/eval/check-independent-freeze.py
python3 reference/eval/check-independent-freeze.py --candidates path/to/candidates.json
```

The second form is required before using any future generated training dataset.
Candidates use `corpusSentenceId`, `english`, and `korean`; optional
`sourceEnglish` / `sourceKorean` aliases are also excluded so rewriting a target
cannot hide a reserved source. A match to either v3
split fails just as a match to an old reservation does. The default check also
verifies prior training manifests, approvals, and cross-split exclusions.

## Frozen gate items and coverage

The gate has five items in each direction. Its four coverage lenses follow the
independent reservation's vocabulary (v2 used prose features without a
`coverageClass` field). Four literal-gap probes receive explicit explanations
below; the remaining six cover embedded clauses, completed loss, conditional
requests, humble offers and formal negative notices. These preserve v2's
polarity, time, roles and register demands while increasing real gap coverage.

| ID (DAN-V3-GATE-) | Corpus sentence ID | Direction | Coverage / reason |
| --- | --- | --- | --- |
| 01 | `s9_togo` | English → Korean | **Literal gap:** wrapping is a conventional takeout request; explain the speech act rather than a gift or packaging definition. |
| 02 | `s10_can_swim` | Korean → English | **Literal gap:** a way/possibility to swim exists expresses ability, not existence of an object. |
| 03 | `s23_lost` | English → Korean | **Literal gap:** losing the road means being lost, not misplacing a physical road; explain that mapping. |
| 04 | `s18_formula_after` | Korean → English | **Literal gap:** the literal past report “ate well” functions as post-meal gratitude; distinguish it from the before-meal formula. |
| 05 | `s24_kind_best` | English → Korean | Gloss: embedded heart-subject clause modifying people, then the outer superlative predicate. |
| 06 | `s24_souvenir_bought` | Korean → English | Gloss: past relative modifier and copula; do not misread 산 as mountain. |
| 07 | `s20_lost_phone` | English → Korean | Semantic fidelity: completed accidental phone loss, not future loss or a prohibition. |
| 08 | `s22_climb_sneakers` | Korean → English | Semantic fidelity: climbing condition and request to wear footwear; preserve their relationship. |
| 09 | `s9_shall_i_give` | English → Korean | Register: humble giving upward and a tentative offer, not a command to the listener. |
| 10 | `s_s2_closed_sunday` | Korean → English | Register: formal negative business notice, recurring Sundays and contrastive time topic. |

Gate distribution: literal-gap 4, gloss 2, semantic-fidelity 2, register 2.
Every reply remains subject to every dimension of the unchanged rubric; the
coverage class identifies the primary probe, not an exemption from other checks.

## Development split

Thirty separately frozen items, fifteen per direction: literal-gap 10, gloss 7,
semantic-fidelity 7, register 6. The same JSON shape and corpus construction apply,
with `heldOut: false`, `reservationOnly: false`, `split: development`, and
`trainingAllowed: false`. Development probes include body-state wording,
benefactive giving, sufficiency, permission, resignation, memory, building
metaphor, differences, relative clauses, negatives and varied source registers.
Its IDs and answers must never migrate into training targets or the gate.

## Verification and next use

`python3 reference/eval/check-independent-freeze.py` validates hashes, provenance,
coverage, directions and zero intersections across all 136 reservations and
existing training artifacts. `npm run build` passes including TypeScript and
16 content validation tests. Focused checker regression tests exercise tampering,
corpus mismatches, duplicate reservations and normalized candidate collisions.

### Custodian ruling, 2026-10-05 — a description exposure did not spend the gate

A run that opened this file for its exclusion rule took §Frozen gate items and
coverage into its context. **The gate stays eligible; it is not replaced or
re-drawn, and `v3-translation-set.json` is still unspent.** What entered that
context was per-item *descriptions* and coverage classes — not inputs, expected
readings or Korean source — and the per-class counts are printed by the checker on
every CI run anyway. The sealed JSON was not opened, no inference, screening, prompt
tuning or training followed, and the diagnostic inputs were fixed before the read.
No committed file outside this one carries that text. **A gate is spent when an
artifact is shaped against reserved content, not when a description is read.**

Three rules this sets, for every later run:

- **A subprocess may read the sealed sets; a context may not.**
  `check-independent-freeze.py` opens them internally and prints only aggregate
  lines — row counts, coverage dicts, reservation totals — with no item text and no
  reserved id. Running it is the required preflight and is **not** a reserved read.
  Note an incident only if it ever fails with a reserved id in its message.
- **The exposed context does not author the rebuild.** Candidate selection, prompt
  text and training start from a fresh context that does not open this file at all.
- `build-dataset.mjs` asserts **96** reservations in process and predates both v3
  splits, so a rebuild can still *select* a reserved row and fail only at preflight.
  Extend it to all 136 before rebuilding; until then the `--candidates` form is the
  only thing between a rebuilt dataset and a burned gate.

The candidate-screening task may consume **only the development split**. A later
explicitly authorized qualification task may open the reserved gate once; this
freeze does not grant that authorization or change the rubric. Release one,
production model pin, prompts and engine settings are unchanged.
