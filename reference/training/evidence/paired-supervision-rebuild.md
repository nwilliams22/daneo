# Paired supervision rebuild checkpoint — 2026-10-05

The prior diagnostic slice remains at `b58d710`. This is a candidate-data
checkpoint, **not an approved dataset, trained artifact or language result**.
The reserved gate and its freeze document were not opened in this rebuild
context. Only the approved builder/checker subprocesses read reservation files;
they print totals, not reserved text. The earlier description-exposure incident
is closed under the custodian's ruling; the gate stays eligible and sealed.

## Construction and measurable result

`build-dataset.mjs --paired-candidates` now excludes all 136 reservation anchors
by ID and normalized English/Korean, verifies the v3 checksum manifests inside
the process, and additionally excludes the frozen 40-row v2 development split.
Existing v1/v2 training, development, review and manifest files are unchanged.

The new candidate file has **406 rows / 203 distinct sentence anchors**:

- **160 rows** carry a non-empty literal gap and a corpus-aligned multi-chunk
  gloss: **80 en-to-ko and 80 ko-to-en (50%)**.
- **246 rows** retain previously reviewed empty-gap targets, mirrored in both
  directions, so training would not teach unconditional gap emission.
- No gap target has a single-chunk gloss. Korean chunks align by source ID.
- The manifest cross-tabulates split, direction, error class, gap presence and
  gloss shape. It records source/development hashes and candidate identity.

Pattern matching is a deterministic whitespace-normalized substring floor,
with the longest available match selected before shorter ones. Reservations,
frozen development anchors, duplicate texts and single-chunk controls are
excluded. An initial punctuation-stripped matcher overmatched; it was corrected
before this checkpoint. Ordinary 친구 examples were removed because their
ordinary reading does not establish a literal/real contrast.

The first checkpoint (`a356a8d`, all CI jobs passed) contained 500 candidates,
including 127 gap anchors mirrored into 254 rows. Independent review rejected
all 127 new gap explanations: they echoed the human gloss and translation, and
substring matching admitted unrelated constructions. No training followed.

`paired-target-decisions.json` now records a decision for each of those 127
anchors: **80 retained with explicitly authored contextual explanations; 47
removed**. For example, possession explains why an existence subject becomes an
English owner with “have”; prohibition distinguishes “will not do” from physical
inability; compounds explain why a literal component is not a restriction on the
word's conventional meaning. Ability constructions now cite `g10_su_itda`, and
재미있어요 cites `g7_itda_factory`, rather than generic possession. The room-301
substring of 백일 is removed, along with unsupported location/aspect matches and
other contexts that do not exhibit the proposed contrast. The builder cannot
invent new explanations from a substring: it requires an explicit retain entry
and a pattern present in the pinned sentence. Both directions share one target.

The manifest binds the decisions file by hash. Source pattern notes, sentence
notes and alternate matches remain review evidence. No outside translations or
learner records were introduced. The 123 inherited no-gap anchors remain intact.

The corrected targets still require independent review; this is not a language
pass. Candidate and manifest retain `trainingAllowed: false`, with every row
`reviewStatus: pending`. The review must assess all 80 explanations and the
retained controls, not infer adequacy from passing mechanical checks. No model
was trained or inferred on during either candidate build.

## Verification from the repository root

- `node --import tsx reference/training/build-dataset.mjs --check-exclusions`:
  PASS, 136 unique ID and normalized English/Korean exclusion keys.
- `node --import tsx reference/training/build-dataset.mjs --paired-candidates`:
  PASS, 406 candidates / 203 anchors, training forbidden.
- `node reference/training/audit-gap-supervision.mjs reference/training/dataset-paired-candidates.json`:
  160/406 paired gap/multi-chunk rows; 80 in each direction; zero single-chunk
  gap rows. These are supervision counts, not language scores.
- `python3 reference/eval/check-independent-freeze.py` and its
  `--candidates reference/training/dataset-paired-candidates.json` form:
  PASS, all 136 reservations; existing v1/v2 files pass; rebuilt candidates
  avoid all reservations and the frozen v2 development split.
- `node reference/training/test_paired_dataset.mjs`: 7 tests passed, including
  regressions for one-direction gaps, single-chunk gaps and misaligned chunks.
- `python3 -m unittest discover -s reference/training -p test_paired_exclusions.py`:
  7 tests passed, including reserved keys, exact mirror checking, duplicate
  directions, changed targets and crossing splits.
- `npm run build`: passed, including typecheck and content validation.
- `npm run validate:content`: 16/16 passed.

The checker admits duplicate source keys only in this explicit paired candidate
format, and only for an exact two-direction pair with matching targets and
training split. Anchor uniqueness and exclusion checks still apply. Existing
formats keep their former uniqueness rules.

## Remaining result and closure

The next step is independent target review, then corrections and a hash-bound
approved artifact. After approval, reuse the incumbent base and bounded
selection protocol, compare correct development explanations and gap-plus-
multi-chunk replies against the preserved v2 baseline on the same inputs, and
report export/native-runtime evidence. Non-empty-field counts alone are not a
success criterion. No seventh candidate; no gate inference, rubric or pin change.

This checkpoint does not satisfy the parent task's retraining/comparison finish
condition. Closure requires the committed approved data and development-only
comparison (or the authorized stop branch), required checks, successful own-
commit CI, and the development result on the gate-decision issue. The dataset
manifest and this report are the source of truth for the current review slice.
