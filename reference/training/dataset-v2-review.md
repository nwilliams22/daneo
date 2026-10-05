# Dataset v2 candidate review

Status: **not approved for training**. No final dataset, manifest or development
freeze exists yet. `dataset-v2-candidates.json` contains 290 pending targets at
corpus commit `5f5bef477b19eb4799d247352930589542a256a8`. The original v1
builder mode and artifacts remain reproducible.

Generate with `node --import tsx reference/training/build-dataset.mjs --v2-candidates`.
This extends the existing builder, retains both SHA-256 source assertions and
strict model-owned schema checks, and additionally compares source bytes with
the pinned Git objects. The corpus bytes have not changed since v1.

Proposed training allocation: 250 rows, comprising 100 literal-gap, 60 polite
register, 45 gloss and 45 semantic-fidelity; 76 en-to-ko / 174 ko-to-en.
Proposed development allocation: 40 rows, 10 per class; 15 en-to-ko / 25 ko-to-en.
These are candidate counts, **not reviewed counts**. Gap inputs remain Korean
because their literal wording can be ambiguous when reconstructed from English.
Sentence directions alternate. Register selection checks a polite 요 ending;
that check alone cannot establish the correct speech act or honorific target.
Other class assignments are provisional review lenses, not proven labels.

All 290 rows are distinct by ID, normalized English and normalized Korean.
They also exclude every v1 training row so the new development split cannot
contain previously trained material. Mechanical checks read the reserved sets
internally without printing their contents. No reserved fixture was opened for
target selection or linguistic review.

## Required row review

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

The candidate hash is recorded in the review issue; it is not a development
freeze. The final freeze and parent closure remain pending the full row review.
