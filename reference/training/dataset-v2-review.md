# Dataset v2 candidate review

Status: **approved and finalized, 2026-10-05**. The 290-row review, target
corrections and replacement review are complete. `dataset-v2.json` contains 250
reviewed training rows; `development-v2.json` contains 40 separately frozen
reviewed rows. `dataset-v2-manifest.json` records counts, both hashes, source
pins and exact approval linkage. No training has run on this dataset.

The pinned corpus snapshot is `5f5bef477b19eb4799d247352930589542a256a8`.
The original v1 builder mode and artifacts remain reproducible.

Generate with `node --import tsx reference/training/build-dataset.mjs --v2-candidates`.
This extends the existing builder, retains both SHA-256 source assertions and
strict model-owned schema checks, and additionally compares source bytes with
the pinned Git objects. The corpus bytes have not changed since v1.

Approved training allocation: 250 rows, comprising 100 literal-gap, 60 polite
register, 45 gloss and 45 semantic-fidelity; 76 en-to-ko / 174 ko-to-en.
Frozen development allocation: 40 rows, 10 per class; 15 en-to-ko / 25 ko-to-en.
These counts are independently reviewed and recorded in the final manifest. Gap inputs remain Korean
because their literal wording can be ambiguous when reconstructed from English.
Sentence directions alternate. Register selection checks a polite 요 ending;
that check alone cannot establish the correct speech act or honorific target.
The independent class audit accepts these as primary review lenses, not isolated tests of each dimension.

All 290 rows are distinct by ID, normalized English and normalized Korean.
They also exclude every v1 training row so the new development split cannot
contain previously trained material. Mechanical checks read the reserved sets
internally without printing their contents. No reserved fixture was opened for
target selection or linguistic review.

## Review procedure and evidence

Read every candidate's Korean, natural English, input direction, aligned gloss,
literal gap and sourceNote. Record a verdict for each stable candidate ID and
bind the report to the file SHA-256. Check actor, polarity, tense, speech act,
register, chunk roles and attached grammatical relations. Inspect blank gap
fields too: sentence notes can describe a gap that must not be taught as empty.
For gap rows, check that the literal/ordinary distinction is accurate and
context-qualified; a whole-phrase gloss copied from a teaching item may be
insufficient for model supervision. Check semantic duplication/paraphrases that
exact normalization cannot detect, especially across training and development.

Record pass, correction required or reject for every row; give exact corrected
fields or a reason for rejection. Sampling does not approve this dataset.
The review must not read the sealed v2 evaluation file or derive examples from
reserved sets. It performs no training or inference.

After verdicts, integrate corrections into explicit builder inputs, replace
rejected rows with reviewed independent items, regenerate, and verify the
250/100/60 floors. Only then emit `dataset-v2.json`, a separate frozen development
file and `dataset-v2-manifest.json` with both hashes, source hashes, class counts,
direction counts and complete review evidence. Freeze before training begins.

## Verification of this candidate slice

From the repository root:

- `node --import tsx reference/training/build-dataset.mjs --v2-candidates`:
  290 strict model-owned targets; every row pending review.
- `python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v2-candidates.json`:
  zero overlap with all 96 reservations, v1 training or the other candidate split.
- `npm run build`: content validation 16/16, TypeScript and Vite pass.

The candidate hash binds the review inputs. The separate final development hash
and freeze protocol are recorded in `development-v2-freeze.md`.

## Finalization gate

`node --import tsx reference/training/build-dataset.mjs --v2-final` requires
`dataset-v2-approval.json` with an approved verdict, all 290 rows reviewed and
the exact candidate SHA-256. It reruns exclusions before writing final files.
The final dataset contains 250 approved rows and excludes source teaching notes
from the model target; explicit target corrections remain in
`dataset-v2-corrections.json`. Development contains 40 reviewed rows and is never
a training input. Existing development bytes cannot be silently replaced.

After finalization, bare `python3 reference/eval/check-independent-freeze.py`
also verifies both final hashes, manifest class/direction counts, approval and
candidate hashes, exact approved target contents, proper split placement and
training permissions, source commit hashes, and zero overlap among both splits,
v1 training and all 96 reservations. It does not claim semantic independence
from sealed content that nobody reviewed for this task.

The reports `dataset-v2-review-report.md` and `dataset-v2-review-addendum.md`
record the row audit and correction review. The addendum reconciles the original
summary-table error: 25 rows needed correction, including seven training gap
rows; 28 patches also included three construction findings. The weather
replacement supersedes the former patch for candidate 062.
