# Sealed v2 gate — paired native measurement, 2026-10-05

**DECLINE: prompted base 2/10; scaled Q8_0 fine-tune 3/10 fully correct, against
an unchanged ≥9/10 bar.** These are first-pass judgments; independent re-score
is the next gate and must read the retained replies, never rerun inference.
Neither engine qualifies. The production model pin remains null and release
one keeps AI off. No prompt, training, postprocessor or rubric iteration was
performed against v2. This set is now spent as an unseen gate.

## Fixed protocol and evidence

Both engines received the ten exact frozen v2 inputs once, sequentially (base,
then fine-tune), on the same Linux host, through the unchanged shipping native
CPU worker (`llama-cpp-2 0.1.158`). The shared prompt and deterministic
postprocessor are unchanged. The harness admission was committed as `8d413ac`
before either run; both raw streams record that HEAD. Artifact hashes were
verified before inference. The worker binary matches the retained matched-input
manifest, SHA-256 `98e7b0ef14e0ce1776556bc0250d46ceab495cadb2173d583aac6248c8fa368d`.
`raw/v2-run-manifest.json` records host, runtime settings and file hashes.

- Base Q4_K_M: 2,740,937,888 bytes, SHA-256
  `00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4`.
- Selected scaled fine-tune Q8_0: 4,610,579,744 bytes, SHA-256
  `025935d6c8477d70946b0e97fddcac318ddbd04630a496bd011f488ef39020c5`.
  Development-only selection and export evidence: [training report](../training/v2-results.md).

Each process ran in `unshare --user --map-root-user --net`, with an unscored
`Hello.` warmup and a final cancellation probe. Native runs both exited 0.
There were no retries, and v0 was not submitted again. The harness refuses to
overwrite existing raw/results/resource evidence. CPU: Ryzen 7 9850X3D;
eight inference threads, 4,096-token context, 1,024-token output cap, greedy
sampling, zero GPU layers. No desktop UI was exercised.

The committed `raw/head-to-head-{base,fine-tune}-v2-*` files retain raw replies,
native parsed results, production-assembled results, judgments with evidence
for every dimension, scored joins and process resource logs. Meaning is settled
by each fixture’s corpus sentence and owning module at its `corpusCommit`;
[the frozen rubric](v0-rubric.md) supplies all thresholds and scoring rules.
No exact-match gold answer or cloud judge is used.

## Counts

| Measure | Prompted base | Scaled fine-tune |
| --- | ---: | ---: |
| Complete final schema | 9/10 | 10/10 |
| Native direction | 10/10 | 10/10 |
| Fully correct | 2/10 | 3/10 |
| Thinking leaks | 0 | 0 |
| Meaning reversals | 1 | 0 |
| Invented-rule flags | 3 | 1 |

| Dimension | Prompted base | Scaled fine-tune |
| --- | ---: | ---: |
| meaning | 8/10 | 10/10 |
| gloss | 4/10 | 9/10 |
| particles | 8/10 | 10/10 |
| politeRegister | 8/10 | 10/10 |
| romanization | 9/10 | 10/10 |
| literalGap | 3/10 | 3/10 |

**Literal gap did not improve: 3/10 for each.** The fine-tune emits an empty
literal-gap field for all ten items; its three passes are sentences where no
explanation is required. It passes **0/7** items requiring a gap explanation
(omitted actor/possessor, stomach-hunger or existence/possession). The base
passes 1/7 of those, the omitted first person in the music sentence, but loses
one no-gap item by inventing an explanation about kimchi. Its total is also 3.

**Polite register improves from 8/10 to 10/10.** The base has malformed 고프요
and turns a planned-meeting statement into a suggestion. Formal-polite
맵습니다 and the fixture’s 입니다 are accepted under the rubric’s explicit
polite-variant allowance. This does not excuse labeling informal-polite 만나요
as formal in the fine-tune’s gloss: that is a separate gloss/rule failure.

Particle and romanization scores include deterministic code, not only model
ability. The base’s spaced `국 이 짜요` defeats particle extraction and yields
an empty list; its invalid empty gloss role on EK-04 prevents any assembled
result. Every dimension for that schema-rejected item is recorded fail, rather
than crediting fields the learner cannot receive. Native direction is still
10/10 even though only nine base results pass the final contract.

## Per-item first-pass verdicts

P = pass, F = fail. Columns are meaning, gloss, particles, polite register,
romanization, literal gap. The JSON judgments retain the full rationale.

### base

| Item | Meaning | Gloss | Particles | Polite | Romanization | Gap | Fully correct | Reversal | Invented rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DAN-V2-EK-01 | P | F | P | P | P | F | no | no | no |
| DAN-V2-EK-02 | P | F | P | P | P | F | no | no | no |
| DAN-V2-EK-03 | P | P | P | P | P | F | no | no | no |
| DAN-V2-EK-04 | F | F | F | F | F | F | no | no | no |
| DAN-V2-EK-05 | P | F | P | P | P | F | no | no | yes |
| DAN-V2-KE-01 | P | F | P | P | P | F | no | no | yes |
| DAN-V2-KE-02 | P | F | F | P | P | P | no | no | yes |
| DAN-V2-KE-03 | P | P | P | P | P | P | yes | no | no |
| DAN-V2-KE-04 | F | P | P | F | P | F | no | yes | no |
| DAN-V2-KE-05 | P | P | P | P | P | P | yes | no | no |

### fine-tune

| Item | Meaning | Gloss | Particles | Polite | Romanization | Gap | Fully correct | Reversal | Invented rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DAN-V2-EK-01 | P | P | P | P | P | F | no | no | no |
| DAN-V2-EK-02 | P | P | P | P | P | F | no | no | no |
| DAN-V2-EK-03 | P | P | P | P | P | F | no | no | no |
| DAN-V2-EK-04 | P | P | P | P | P | F | no | no | no |
| DAN-V2-EK-05 | P | P | P | P | P | P | yes | no | no |
| DAN-V2-KE-01 | P | P | P | P | P | F | no | no | no |
| DAN-V2-KE-02 | P | P | P | P | P | P | yes | no | no |
| DAN-V2-KE-03 | P | P | P | P | P | F | no | no | no |
| DAN-V2-KE-04 | P | F | P | P | P | F | no | no | yes |
| DAN-V2-KE-05 | P | P | P | P | P | P | yes | no | no |

Hard-rule evidence is explicit, and remains subject to independent re-score:

- Base KE-04: “Let’s meet my friend tomorrow” replaces the corpus’s planned
  meeting statement with a suggestion: one speech-act reversal.
- Base EK-05: says Korean omits 거 while its Korean contains 거, falsely
  attributes “thing” to the English line, and calls subject 가 a topic marker.
- Base KE-01: calls 이 “exist” in the gloss and describes English dummy “there”
  as a subject implied and omitted in Korean. The first-pass rule flag concerns
  that unsupported grammatical explanation; it is not a claim of reversal.
- Base KE-02: explicitly calls subject 이 a topic marker in the gloss. The
  postprocessor cannot repair a false rule inside gloss text.
- Fine-tune KE-04: “meet-[formal]” labels 만나요 formal, contrary to module 4’s
  explicit 해요체/합니다체 distinction. Its meaning and actual polite form pass.

These flags are not needed to establish decline: both fully-correct counts
remain far below nine even if a reviewer disputes a hard-rule label.

## Measured runtime

| Measure | Prompted base | Scaled fine-tune |
| --- | ---: | ---: |
| Warm completion p95 | 18,743 ms | 14,926 ms |
| Cold load/ready | 1,709 ms | 2,730 ms |
| Cold first token | 6,846 ms | 7,817 ms |
| Peak process RSS | 3,003,344 KiB | 4,707,536 KiB |
| Whole native process | 175.45 s | 155.62 s |
| Artifact/download payload | 2,740,937,888 bytes | 4,610,579,744 bytes |

Warm p95 uses nearest rank over ten once-only held-out completions, so it is
the maximum of this small sample. The worker retains weights between requests;
all ten warm ready times are 0 ms. Each request still evaluates its prompt and
creates its inference context. Cold means a fresh worker process, **not** cold
disk cache: pre-run artifact hashing warms the cache. First-token time includes
load and prompt prefill. RSS is `/usr/bin/time -v` maximum for the native
process, not GPU memory. Download size is the actual GGUF payload size; no
network download or hosted distribution was performed. Cancellation: 0 ms for
both probes. Runtime remains a product concern even apart from language quality;
this measurement does not establish UI latency or packaged behavior.

The pair is an artifact comparison: Q4 base versus Q8 trained weights, as in
the previous head-to-head. Training and quantization are not independently
controlled here, so a gain cannot be attributed solely to training. Nor should
2/10 or 3/10 on fresh v2 be called a regression from 4/10 on burned v0: the sets
differ. The only fresh paired difference is one additional fully-correct item.

## Verification and next action

From `/mnt/t7/Projects/daneo`, executed once for each engine:

```sh
python3 reference/eval/run-head-to-head.py base v2
python3 reference/eval/run-head-to-head.py fine-tune v2
node --import tsx reference/eval/assemble-head-to-head.ts base v2
node --import tsx reference/eval/assemble-head-to-head.ts fine-tune v2
python3 reference/eval/score-head-to-head.py base v2 reference/eval/raw/head-to-head-base-v2-judgments.json
python3 reference/eval/score-head-to-head.py fine-tune v2 reference/eval/raw/head-to-head-fine-tune-v2-judgments.json
```

**Do not rerun the inference commands.** Independent review reads these files.
Recheck provenance without inference at the commit containing this report:

```sh
python3 reference/eval/check-head-to-head-provenance.py --report-commit HEAD --item-set v2
python3 reference/eval/check-provenance.py reference/eval/raw/head-to-head-base-v2-raw.jsonl --report-commit HEAD --item-set reference/eval/v2-translation-set.json
python3 reference/eval/check-provenance.py reference/eval/raw/head-to-head-fine-tune-v2-raw.jsonl --report-commit HEAD --item-set reference/eval/v2-translation-set.json
```

Build including typecheck: `npm run build` PASS (content 16/16).
`npm test -- --run`: 242/242 in 21 files. Python runner/scorer/checker syntax and
`git diff --check` pass. Post-commit provenance and remote CI outcomes are
recorded on the issue so they name the exact published revision.

Expected result: paired measurement with raw evidence, all six dimensions and
runtime, whether the candidate passes or declines. Closure:
report/evidence pushed, both counts reported against ≥9/10, provenance exit 0
and own-commit CI success. Independent re-score of the saved replies is BAD-239;
BAD-240 carries the subsequent engine decision and routes the remaining
free-local choices to Nick after a confirmed decline.
No new training, alternate engine selection or repeat v2 run is authorized by
this measurement. Release-one packaging continues with AI off.
