# Prompt repair development set — 2026-10-04

`dev-translation-set.json` contains six curriculum sentences absent from the frozen
`v0-translation-set.json`. All six have the same fixture shape and were reviewed
under the six dimensions in `v0-rubric.md`. The first prompt candidate is the
committed `src/lib/translation-prompt.json` (SHA-256 `b274d374c30f459700bdc37e805dbf44c55542b5cc951264b9d605c398358ccb`). The second candidate added longer instructions to preserve Korean source spelling, keep particles attached to gloss chunks, use Revised Romanization, and distinguish honorific statements from requests. It was rejected and the first candidate restored **before the single frozen run**.

Both runs used the native production worker, pinned Qwen3.5-4B Q4_K_M artifact,
greedy sampling, thinking disabled, 4,096-token context, 1,024-token output cap,
and an offline network namespace. The first candidate submitted each item once. An interrupted development attempt
overlapped briefly with the second pass; the retained second-pass rows and raw
replies are the final complete occurrence per id, and its timing is not used
for a candidate comparison. Raw replies and outcomes are in `raw/dev-prompt-{first,second}-{raw,native}.jsonl`.
They are development evidence and do not contain frozen-set inputs.

| Dev item | First candidate | Second candidate |
|---|---|---|
| 01, study Korean | Meaning right; object marker and gloss segmentation wrong; romanization tracks broadly | Same gloss split; `Hangugeogeul` wrong romanization |
| 02, past drink at cafe | Meaning and particles right; romanization malformed | Meaning and particles right; romanization still malformed |
| 03, cannot drink | Meaning right; omits additive 도 particle | Same omitted particle; subject gap appears |
| 04, friend goes to school | Subject 가 mislabeled as topic; romanization malformed | Same false 가 topic claim; romanization malformed |
| 05, grandmother eats | Honorific statement rendered as a request | Still a request; romanization also malformed |
| 06, bank next to hospital | Meaning right; romanization malformed | Same romanization and split gloss errors |

The longer candidate did not cure the systematic errors. Its latency cannot be
compared cleanly because of the interrupted overlap. The selected first candidate
was already exercised on all six dev items.
No frozen item was used to choose a prompt wording. See the sibling
`v0-prompt-repair-results.md` for the single final gate.
