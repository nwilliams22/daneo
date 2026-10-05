# v3 development family screen — shortlist none

2026-10-05. **Neither candidate is shortlisted.** On the 30-item development
split, Mi:dm scores **0/30 fully correct**, **0/30 literal-gap** and **22/30 polite
register**; A.X scores **0/30**, **3/30** and **25/30** respectively. A.X demonstrates
some real literal-gap ability, but only **11/30** replies pass the app schema and
both candidates produce invented grammatical explanations. Mi:dm has one time
reversal. These results give no basis for spending the sealed gate on either
artifact. A.X also takes **34.803 s warm p95** and **4,435,826,208 download bytes**;
even a qualifying future score would reopen Nick's download-budget decision
against the approximately 2.5–3 GB standard envelope. This is a development screen,
not a gate verdict or a rejection of every possible prompt/quantization in either
family. No production artifact is selected.

## Artifact identity and acquisition

Both artifacts were converted locally from immutable publisher weights, not
community GGUFs. The publisher LFS SHA-256 of every safetensors shard was checked
against the actual downloaded bytes; see
[`raw/v3-source-verification.json`](raw/v3-source-verification.json).

| Field | Mi:dm 2.0 Mini | A.X 4.0 Light |
| --- | --- | --- |
| Source repoId | `K-intelligence/Midm-2.0-Mini-Instruct` | `skt/A.X-4.0-Light` |
| Source revision | `383eb221c52a32278f1985257b264ade8d982e60` | `ba21c20ea1b31ded1ec3e2fb432335077dc4be98` |
| Local filename | `midm-Q4_K_M.gguf` | `ax-Q4_K_M.gguf` |
| Measured bytes | 1,426,272,480 | 4,435,826,208 |
| Measured SHA-256 | `8d7e709b681d5b84a847cfd9ce54072b1f6363bc01b74c8f6b3d3cb001aea435` | `8c667c4451ac7608899cbe358a205f3354869a1f4928ccbb6c060351ddd77a70` |
| Quantization | Q4_K_M | Q4_K_M |
| Distribution status | Local-only | Local-only |

The repoId/revision identify **source weights**; the local GGUF filenames do not
exist at those publisher URLs. Neither output can be pinned as shipped without
hosting the exact bytes at a stable public download location. Full artifact
records are [`raw/v3-midm-artifact.json`](raw/v3-midm-artifact.json) and
[`raw/v3-ax-artifact.json`](raw/v3-ax-artifact.json). The publisher licenses remain
MIT and Apache-2.0 as established by the family survey; copies accompany the chat
fixtures. The vocabulary-only preflight artifacts are **not** these models.

Both used the existing matched llama.cpp converter at
`26394b4e6749a41c3633db040e0987500a5f7013`: BF16 export, then
`llama-quantize INPUT OUTPUT Q4_K_M 8`. All **1,865** vendored files were compared
with the pinned runtime source and matched. The quantizer executable hash is
retained in the source-verification record. Acquisition files and full weights
remain under ignored `.local-models/v3-screen/`.

## Runtime compatibility and prompt adaptation

`llama-cpp-2 =0.1.158` and its lockfile were unchanged. Both full GGUFs loaded and
completed the run on CPU, eight generation/prefill threads, greedy sampling,
4,096 context tokens, 1,024 output tokens, mmap disabled, and thinking disabled.
No training, GPU inference, paid service or cloud engine was used.

**The worker could not run these templates entirely unchanged.** Preflight found
its exact Qwen-only thinking-suffix guard. The scope question on
[BAD-245](/BAD/issues/BAD-245) was answered `adapt`; commit `5c782a8` then added only
family template inputs/validation and evidence capture. Mi:dm receives its BOS
from model metadata and its required empty system entry. A.X receives an empty
tools list. Jinja whitespace settings follow the publisher tooling; Mi:dm's
unchanged template uses its deterministic fallback date. Only the incumbent
closed-thinking prefix and the two tested non-thinking family prefixes are
accepted. The incumbent unfinished-thinking-prefix rejection remains tested.
This was **not** a runtime-version bump. The original preflight is preserved at
`7d5e3a3` and in [`raw/v3-screen-preflight.json`](raw/v3-screen-preflight.json).

A Mi:dm pilot on the original instruction stopped after two development items
both hit the output limit, copying placeholder text and repeating particles.
Its warmup and two complete recorded attempts remain under `raw/v3-midm-pilot-*`;
the interrupted next request is not a scored item. The pilot was terminated
intentionally (exit -15). The instruction was replaced with a concise field
contract with no demonstrations or example translations, based only on that
**development** evidence. The final instruction was then fixed for both full
runs, wrapped in each family's own publisher chat template.

| Prompt evidence | SHA-256 |
| --- | --- |
| Final `src/lib/translation-prompt.json`, both families | `636e7b0c6ead6fd6dbd37d2ec581e2af70df5d5142de801b77cf89211327a6a0` |
| Mi:dm publisher chat template | `af6fe088a0d58f0b6ba00143fa9e6f639a4456d88fa978fe8a58a5d1bba70138` |
| A.X publisher chat template | `15f2d4a602c42c90a1f03e13fe353510d745422a5c61b9abdefe47d5b77b5113` |
| Development split | `41c3b4c83ead4b9edc181e798f73ace160b63f29455c41af9e3ac719c3e1aab5` |
| Unchanged v0 rubric | `a73523d34276b81d31341846acc1d8e9d1b3833aedcdcf5838caec6368113550` |

Every raw row also records the SHA-256 of its **exact rendered prompt**, including
the family wrapper and input. Mi:dm ran at `2677b7ce84f02232e45dca5cd0675624970fa630`;
A.X at `49dcc01b6244b232a27c5de116be7d95c8f77f58`. Both use the same final prompt
bytes. Each full run contains one warmup plus **30 development replies**, all
complete before the output limit; cancellation is a separate probe row.
The gate fixture was never read or run, and `reference/model-pin.json` was not
edited.

## First language review under the unchanged six dimensions

| Measure, out of 30 | Mi:dm | A.X |
| --- | ---: | ---: |
| Fully correct | **0** | **0** |
| Schema-valid final app reply | 26 | 11 |
| Correct raw direction | 30 | 30 |
| Meaning | 26 | 29 |
| Korean word-order gloss | 0 | 5 |
| Particle roles | 23 | 25 |
| Polite register | **22** | **25** |
| Romanization | 30 | 30 |
| Literal-gap claims | **0** | **3** |
| Thinking leaks | 0 | 0 |
| Meaning reversals | **1** | 0 |
| Invented-rule items | **15** | **15** |

On the **ten literal-gap focus items**, passes are **0/10 vs 2/10**. On the **six
register focus items**, passes are **4/6 vs 4/6**. These focus groups are not new
rubrics; all six dimensions are judged on every item.

Schema and language are separate judgments. Accepted replies are scored after
the existing deterministic romanization/particle processing. For rejected
replies, visible language can still pass a dimension: the retained `diagnostic`
field shows raw wording and gloss roles with the same romanizer and base particle
extractor, **without repairing the invalid roles or granting schema validity**.
Those diagnostic particle jobs are the extractor defaults, not a newly accepted
app response. Raw claims remain available and are included in invented-rule and
reversal review. A schema failure can never count as fully correct. Raw direction
is checked before the native adapter overwrites the direction label; the number
of usable final replies with that direction is 26 and 11, respectively.

Early partial scoring conservatively withheld every dimension from schema-invalid
replies. The final table above corrects that coupling and grades their readable
language separately, as the rubric requires. It does not change either
fully-correct count or either literal-gap count.

Examples that settle the decision:

- Mi:dm DEV-26 changes airport advice from two hours **before** to two hours **ago**.
- Mi:dm DEV-25 invents a possessive relationship inside `걱정하지`.
- A.X DEV-01 correctly explains stomach-full versus “I am full,” but uses plain
  `부르다` rather than polite `불러요` and does not gloss the subject marker.
- A.X DEV-04 explains existential “thing exists” versus English “have a question,”
  but mislabels the Korean gloss roles. DEV-12 explains birthday-congratulate
  versus Happy birthday, but retains casual speech.
- A.X DEV-06 falsely derives `돼요` from `이다`; DEV-20 calls subject-marked
  `생각이` a topic. Many other A.X replies invent role enum values such as `time`,
  `adverb`, `negation`, or `question`, so the app rejects them.

Item-level judgments and aggregation are in
[`raw/v3-midm-scored.json`](raw/v3-midm-scored.json) and
[`raw/v3-ax-scored.json`](raw/v3-ax-scored.json), backed by separate review notes,
assembled/diagnostic fields and unchanged raw replies. This is the first review,
not an independent gate re-score. No ambiguity in these low totals could justify
claiming the ≥9/10 gate bar was met.

## Measured runtime

Host: Linux, AMD Ryzen 7 9850X3D, 16 logical CPUs; worker fixed at eight threads.
Runs were sequential, in `unshare --user --map-root-user --net`, with no network
interface available to the probe. Neither inference run used a browser, proxy
or UI automation.

| Measure | Mi:dm | A.X |
| --- | ---: | ---: |
| Artifact bytes | 1,426,272,480 | 4,435,826,208 |
| Cold ready/load, including native artifact verification | 0.995 s | 12.575 s |
| Cold first generated token, from request start | 5.315 s | 17.995 s |
| Cold completion | 12.346 s | 30.232 s |
| Warm completion p95 | **18.808 s** | **34.803 s** |
| Peak sampled native-process RSS | 2,258,232 KiB | 4,685,860 KiB |

Cold means a new process/model load, **not flushed OS caches**. Warm p95 is nearest
rank, the 29th ascending completion time among all 30 development requests after
the warmup. RSS is the native process's VmRSS sampled every 20 ms, including its
threads; shorter peaks can be missed. The host is a shared development machine,
not a dedicated benchmark system; brief verification commands ran during Mi:dm's
screen. These are observed host timings, not a laptop guarantee. The two memory
JSON files retain sampling counts, elapsed time and exit 0. No desktop UI or
packaged application launch was tested; this proves native-probe execution only.

## Reproduction and checks

The evidence, not a rerun of any sealed set, decides this screen:

```sh
node --import tsx reference/eval/assemble-v3-screen.mjs midm
node --import tsx reference/eval/assemble-v3-screen.mjs ax
python3 reference/eval/score-v3-screen.py midm
python3 reference/eval/score-v3-screen.py ax
python3 reference/eval/check-v3-screen.py --report-commit REPORT_COMMIT
```

`run-v3-screen.py midm|ax` records fresh native inference from only the development
fixture and refuses to overwrite existing run evidence. Rebuilding the opt-in
probe requires the host's established
`BINDGEN_EXTRA_CLANG_ARGS=-I/usr/lib/clang/22/include`; the first unconfigured
attempt failed to find `stdbool.h`, and the configured build passed.

Verification: five focused native tests passed, including both publisher
templates and the incumbent thinking guard; 21 focused translator contract/local
tests passed; `npm run build` passed, including content validation and TypeScript.
The implementation commit `49dcc01` passed all four Actions jobs in run
`37300167464`. The report commit's own CI result is recorded on the issue after
push. The next action belongs to the existing verdict ticket
[BAD-247](/BAD/issues/BAD-247): use this measured **none** shortlist; do not spend
a sealed gate on either screened artifact.
