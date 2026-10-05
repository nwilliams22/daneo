# Training v2 development freeze

Frozen 2026-10-05, after complete row review and before any v2 training.
This split is for iteration on epochs, learning rate, prompt format and row mix.
It is never training data and never substitutes for the sealed final gate.

- File: `development-v2.json`; 40 reviewed targets, 10 per primary class.
- SHA-256: `f9b83bd52dce8a3f4c557af27ea94c4fe4226b41d796ebc566b0d1a8337e343d`.
- Directions: 15 en-to-ko and 25 ko-to-en.
- Separate training file: `dataset-v2.json`; 250 reviewed targets.
- Training SHA-256: `0e4509055cf8074676505af1068b460726d35154b75c896edefccb2a8704f57e`.
- Corpus snapshot: `5f5bef477b19eb4799d247352930589542a256a8`. Source byte hashes and per-class counts
  live in `dataset-v2-manifest.json`.
- Review: `dataset-v2-review-report.md`, its addendum and
  `dataset-v2-approval.json`, bound to candidate SHA-256
  `dbe19f9cd6ed255d3794cd2ec49b34a8821044300b57f6a8c08e8c50600f90f1`.

The reviewed development weather item was replaced with `s_m153_art` to remove
an identified source-family overlap with training weather examples. The other
289 reviewed rows were preserved. Every target passed the strict model-owned
translation schema; romanization and particles remain application-owned.

From the repository root, regenerate with:

```sh
node --import tsx reference/training/build-dataset.mjs --v2-final
python3 reference/eval/check-independent-freeze.py
```

The builder requires approval of the exact candidate bytes and refuses to change
an existing development file. The checker verifies final bytes, approval linkage,
counts, source pins, split placement, and zero overlap by ID and normalized
English/Korean against all 96 reservations (including sealed v2 and the 60-item
independent set), v1 training, and the other split. The sealed fixture is read
only internally by mechanical exclusion tooling, never printed or inspected
for target construction. The review found no remaining cross-split source-derived
variant; mechanical matching cannot prove semantic independence from unseen
sealed content. No reserved answer or diagnostic reply was used as supervision.

All iteration belongs on this development split. Keep the final gate sealed
until the chosen engine is scored once under its unchanged rubric. This freeze
does not select a model or turn on AI features; `reference/model-pin.json` stays
null. The next task owns training and export, using these exact manifest hashes.
