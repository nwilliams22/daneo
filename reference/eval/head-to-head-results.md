# Phase D head-to-head: prompted base and Q8_0 fine-tune

First-pass score, 2026-10-05. Independent language re-score is pending. The
absolute v0 rubric in `v0-rubric.md` governs selection; a relative gain alone
does not clear that bar. No production model is pinned in `reference/model-pin.json`.

## Fixed comparison

The two engines ran sequentially on the same Linux host through the unchanged
`llama-cpp-2 0.1.158` CPU worker, the same embedded prompt and greedy sampler.
The prompted base was the 2,740,937,888-byte Q4_K_M artifact with SHA-256
`00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4`.
The reviewed fine-tune was its 4,610,579,744-byte Q8_0 export with SHA-256
`1b6a3bf392e872eede021b70294b8611ea82743412a0215807f4f55d8d64e0d7`.
Both were measured through the worker that would load them; export formats and
weights differ by design. The 60 independent English inputs were derived
unchanged from the frozen 60-item reservation. Both engines also received the
unchanged ten v0 inputs. Each held-out input was submitted once per engine.
An unscored `Hello.` warmup and a final cancellation probe are separate rows.

`run-head-to-head.py` verifies both model hashes and committed prompt/fixture
bytes before inference. `assemble-head-to-head.ts` applies the production
postprocessor and final app schema to the native replies. `score-head-to-head.py`
joins the frozen inputs, raw replies, assembled results and first-pass language
judgments. The 60-item set uses its four primary coverage classes, 15 items each;
v0 uses all six dimensions and the absolute acceptance threshold. The raw,
native parsed, assembled, judgment and scored files are retained separately
under `raw/head-to-head-*`. `check-head-to-head-provenance.py` passed against
report commit `643c6a1`: all 140 held-out raw rows match pre-run prompt, rubric,
fixture and artifact identities; all 60 derived inputs match the source freeze.

## Measured results

| Set and engine | Final schema | Direction | Thinking leaks | First-pass language result | Warm completion p95 | Cold load/ready | Cold first token | Peak process RSS |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| 60, base | 57/60 | 60/60 | 0 | Primary passes: gloss 9/15; semantic fidelity 9/15; register 6/15; literal gap 1/15 | 24,083 ms | 1,546 ms | 6,424 ms | 3,004,100 KiB |
| 60, fine-tune | 60/60 | 60/60 | 0 | Primary passes: gloss 11/15; semantic fidelity 10/15; register 5/15; literal gap 1/15 | 20,509 ms | 2,238 ms | 7,141 ms | 4,708,140 KiB |
| v0, base | 10/10 | 10/10 | 0 | **3/10 fully correct**; 0 meaning reversals; 0 invented rules | 15,353 ms | 1,501 ms | 6,785 ms | 3,007,476 KiB |
| v0, fine-tune | 10/10 | 10/10 | 0 | **4/10 fully correct**; 1 meaning reversal; 0 invented rules | 14,721 ms | 2,220 ms | 7,224 ms | 4,707,652 KiB |

`/usr/bin/time -v` measured maximum RSS for the whole native probe process.
Cold means process-cold warmup, not disk-cold; hash verification warms the file
cache. `ready` is model verification/load progress, and `first token` is the
first generation token. Warm p95 is nearest-rank over held-out completion times;
the worker reloads and re-verifies weights on each request. The fine-tune
reduced completion p95 on the 60-item set but increased process RSS by about
1.70 million KiB. The raw process logs and per-item timings settle these values.

## First-pass language verdict and recommendation

The fine-tune is a relative improvement in schema completion, gloss and semantic
coverage. It does not clear the absolute v0 rubric: **4/10 fully correct versus
the required ≥9/10**, and one item reverses the actor (`친구가 커피를 좋아해요` becomes
“I like coffee”). The base also fails at **3/10**. Both have literal-gap failures;
the fine-tune's register primary score is one item lower. The 60-item score
documents where they differ, not a second acceptance threshold.

**Recommendation: ship neither artifact.** Keep `reference/model-pin.json` null.
The fine-tune is a measured candidate that failed qualification, not a production
selection; the prompted base also has not qualified. The model pin and any
engine-path decision belong to the separate selection task. Independent review
of the item judgments may revise exact dimension counts; it cannot turn either
first-pass v0 count into a passing ≥9/10 result without resolving several
specific recorded failures.

The headless worker runs do not establish desktop UI behavior. The app-schema
check used the exact production postprocessor; no learner profile or paid
model was involved. The output weights remain in ignored `.local-models/` and
are identified here by full hashes, not committed into git.
