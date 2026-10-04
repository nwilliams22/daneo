# Phase D v0 acceptance — 2026-10-04

**Verdict: proceed with conditions — local remediation only; this baseline fails acceptance.** The pinned
Qwen3.5-4B Q4_K_M CPU baseline is not ready to qualify the shipped translator.
The unchanged prompt produces elementary conjugation,
particle, romanization and literal-gap errors; two Korean requests are labelled
English→Korean. The next experiment should compare the same model at a larger
quantization against the recorded baseline, without tuning on these held-out
items. If errors persist, evaluate the plan's non-thinking runner-up before
investing in a Daneo fine-tune. This is a local-engine escalation, never a paid
fallback. No cloud call was made or needed.

## Method and source of truth

The frozen inputs/rubric and corpus commit are in
[`v0-translation-set.json`](v0-translation-set.json) and
[`v0-rubric.md`](v0-rubric.md). Sentence notes and owning curriculum modules
settle meaning; no cloud answer is ground truth. All ten inputs remain held out.
No prompt, sampler, artifact, output cap or template was tuned during this run.

The acceptance example creates the configured real Tauri WebKit main window
with production translation commands and the production frontend adapter/zod
parser. Its only additions are an injected driver and opt-in evidence recording.
The baseline calls the adapter directly, while the separate demonstrations drive
the rendered Explore controls. See [reproduction instructions](README.md).

All inference processes run under `unshare --user --map-root-user --net`: the
process namespace has no configured network and no proxy process. Host services
are left untouched. An isolated WebKit data directory protects learner data.
The first launch lacked embedded assets and produced no inference; its stopped
process timing is retained separately and excluded from all reported metrics.

## Host and artifact

See [`raw/v0-host.json`](raw/v0-host.json) for exact hashes, revisions and runtime
settings. Host: `nobara-pc`, Nobara Linux, Ryzen 7 9850X3D (8 cores/16 threads),
63,295,824 KiB physical RAM. RTX 5090 (32,607 MiB) is present but **unused** by this
CPU-only build. Runtime: `llama-cpp-2` 0.1.158, llama.cpp
`26394b4e6749a41c3633db040e0987500a5f7013`, Tauri 2.11.5. Eight inference threads,
4,096 context tokens, 1,024 output-token cap, greedy sampling, thinking disabled.
Artifact: `Qwen3.5-4B-Q4_K_M.gguf`, 2,740,937,888 bytes, measured SHA-256
`00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4`.

Base app commit: `e4e40dcd8e85367c39b30f734232dec4b38c61a5`. The accompanying
commit contains the instrumentation; raw text is captured before fence removal
and JSON parsing. Ordinary builds cannot record it unless the explicit
`acceptance` feature is enabled and its output path is set.

## Measurements and gate

The [complete scored records](raw/v0-scored.json) retain 31 raw replies and
verdicts: one process-cold request plus three warm runs of each item. All repeated
raw texts are byte-identical. Counts below are per ten unique items; the 30 warm
requests give 27 schema-valid outcomes, 24 correct directions and zero fully
correct replies. Every reply reached end-of-generation with complete JSON; the
schema rejects KE-04's invented role values. The native JSON parser itself did
not reject any of these 31 replies.

| Gate or measurement | Observed | Verdict |
|---|---|---|
| Schema valid and complete: 10/10 | 9/10; KE-04 rejected in every run | **Fail** |
| Correct direction: 10/10 | 8/10; KE-03 and KE-04 wrong in every run | **Fail** |
| No leaked thinking | 0/31 raw replies with markers or reasoning prose | Pass |
| Fully correct: ≥9/10 | 0/10 | **Fail** |
| Zero meaning reversals | 0/10 | Pass |
| Zero invented rules | 4/10 items (EK-02, EK-03, KE-02, KE-05) | **Fail** |
| Warm completion p95 ≤30 s | **18.922 s**, 30 observations | Pass |
| Warm completion range | 12.415–21.824 s | Measured |
| Process-cold verified load readiness | **1.820 s** from adapter start | Measured |
| Process-cold first generated token | **5.425 s** | Measured |
| Process-cold completion | **17.093 s** | Measured |
| Warm first-token p95 / range | 5.410 s / 4.355–5.436 s | Measured |
| Warm verified-load readiness p95 | 1.787 s | Measured |
| Baseline peak sampled process-tree RSS | **3,617,072 KiB (3.450 GiB)** | Measured |
| Native cancel acknowledgment ≤1 s | **1 ms**, followed by successful greeting | Pass |

p95 is nearest rank (29th of 30 ascending completion observations), including
all terminal outcomes rather than excluding the schema failures. Completion
includes hash verification, weight load, prefill, generation, IPC and validation.
The load-readiness measure includes verification and IPC; it is **not** an
isolated weight-load timer. First-token timing uses outputTokens=1, not the
start-of-prefill event. Warm requests reuse the process/OS cache, but the v0
runtime reloads weights each time. Process-cold is not disk-cold: verification
itself reads the entire artifact. No cache-dropping operation was performed.

[Memory evidence](raw/v0-desktop-memory.json) samples the app and its WebKit
children every 20 ms, sums RSS (shared pages can count twice), and records
24,524 samples over 500.850 s, exit 0. This is an observed sampled peak, not an
exact instantaneous peak or a supported-memory minimum. **No supported-memory
minimum is established by this single-host run.** The separate Explore UI run
peaked higher at **3,744,856 KiB (3.571 GiB)**; use that as the highest observed
sampled total across these desktop demonstrations, not the smaller baseline value.

## Language findings

Detailed dimension verdicts are retained in
[`v0-language-review.json`](v0-language-review.json); the joined scored records
retain each raw reply alongside the parsed reply, frontend outcome and verdict.
An item passes only if every applicable dimension and structural gate passes.
These are initial verdicts for independent re-scoring, not a substitute for it.

| Item | Fully correct | Decisive evidence |
|---|---|---|
| EK-01, drink water | Fail | `마시요` instead of polite `마셔요`; module 1's verb table settles it. |
| EK-02, not eat meat | Fail | `어요` glossed “I do”; wrong particle allomorph, 안 listed as a particle, `gogigeo` romanization. |
| EK-03, teacher coming | Fail | 이 explicitly labelled a topic marker rather than grammatical subject. |
| EK-04, wash hands | Fail | `ssigeoyo` does not track 씻어요; omitted subject/possessor gap unexplained. |
| EK-05, eat food | Fail | Empty literal gap hides 밥's rice/meal distinction; object marker glossed “to.” |
| KE-01, friend likes coffee | Fail | `joha-hayo` does not track 좋아해요's 해 (`hae`). |
| KE-02, no sugar | Fail | `seontang` does not track 설탕; no existential gap explanation; subject/topic conflated. |
| KE-03, sit here | Fail | Wrong `en-to-ko` label; verbal ending listed as particle; `anseuseyo` romanization. |
| KE-04, met friend yesterday | Fail | Wrong direction; invalid `time`/`particle` gloss roles rejected by zod; romanization and omitted-subject gap fail. |
| KE-05, food delicious | Fail | 이 called topic marker; empty gap omits the taste-exists construction. |

The English meanings preserve polarity, participants, time and speech act:
no meaning reversal is claimed. A false grammatical explanation still fails the
separate zero-invented-rules threshold. Optional cloud comparison was omitted
under the owner's local-only constraint; no key or paid baseline is a blocker.

## Recommended next local experiment

First compare a larger quantization of the same 4B model using this unchanged
harness/prompt; the reproducible elementary errors justify testing whether weight
precision contributes before starting a fine-tune. This is a hypothesis, not a
promise of improvement. If it remains below the absolute rubric, test the plan's
non-thinking Qwen3-4B-Instruct-2507 runner-up, then a larger desktop parameter
class or the authorized v1 fine-tune. Develop any prompt/training changes on
separate development examples, never these ten held-out items. Do not relax the
rubric or reintroduce cloud fallback. The CPU timings qualify only this measured
host/configuration; GPU acceleration and other models require their own numbers.


## Real-world demonstrations

All desktop launches used the same network isolation as the baseline and exited
0. These are real WebKit DOM interactions and native results; no browser mock
was used. Rendered text was inspected in the retained records; no visual
screenshot review is claimed.

| Demonstration | Actual result | Evidence |
|---|---|---|
| Offline Tauri translation, proxy unavailable | Explore displayed `안녕하세요.` / `Hello.` and Save to deck; save count 0 → 1 | [UI records](raw/v0-ui.jsonl) |
| Cancel, then successful request | Cancel after first token; busy state removed in **28 ms** (25 ms observation interval); next greeting rendered successfully | [UI records](raw/v0-ui.jsonl) |
| No late saved result | Saved count **1 before cancellation, 1 after the next completed request** | [UI records](raw/v0-ui.jsonl) |
| Native acknowledgment | **1 ms**, `cancelled` outcome, followed by a schema-valid greeting | [Command records](raw/v0-desktop.jsonl) |
| Missing model | `model-missing`, state `absent`; Explore rendered “Local model absent”; exit **0** | [Missing record](raw/v0-missing.jsonl), [process](raw/v0-missing-memory.json) |
| Corrupt model | `model-corrupt`, state `error`; Explore rendered pinned-artifact error; exit **0** | [Corrupt record](raw/v0-corrupt.jsonl), [process](raw/v0-corrupt-memory.json) |
| Controlled allocation failure, no crash | **1 passed, 0 failed, exit 0, 16.48 s**; allocation error after real weight load, then cancel and successful greeting | [Native test evidence](raw/v0-allocation-test.txt), [recovery reply](raw/v0-allocation-recovery.json) |

The corrupt demonstration uses a disposable short file and does not alter the
real GGUF. Existing native tests also cover same-size wrong-hash rejection.
The successful greeting proves lifecycle/transport, not linguistic acceptance:
only the ten frozen sentences decide the language gate.


The allocation demonstration is a native controlled-failure test, not a UI OOM
simulation: it injects context creation failure after loading actual weights.
Its assertions require `allocation-failed`, cleanup, cancellation and a successful
next request. No claim is made about surviving an operating-system OOM kill.

## Validation and disposition

- `npm test`: **148/148 passed**, 16 files (1.23 s).
- `npm run validate:content`: **15/15 passed** (985 ms).
- `cargo test --locked --release --manifest-path src-tauri/Cargo.toml --lib local_translation`:
  **8 passed, 1 opt-in test ignored**, 0 failed (0.03 s); the opt-in test was run
  separately above, not left unverified.
- `npx tsc --ignoreConfig --strict --noEmit --target es2022 --module esnext --moduleResolution bundler --resolveJsonModule --allowSyntheticDefaultImports --types vite/client --skipLibCheck reference/eval/acceptance.ts reference/eval/demonstrations.ts`: passed.
- `python3 reference/eval/summarize-v0.py`: passed; 31 scored records, identical
  repeat texts, p95 18.922 s. The scorer fails if a repetition needs a new review.
- `git diff --check`: passed.

The acceptance run is complete, but model qualification **fails**; the thresholds
have not been relaxed. Every required runtime gate has measured evidence. No
paid comparison, device/browser mock or invented memory minimum is used to fill
a gap. Default app behavior, the shared prompt, model pins and stored learner
data shapes are unchanged. Evidence capture is opt-in developer tooling.

Next action: independently re-score these retained outputs and confirm the
runtime arithmetic, then select the next local experiment described above.
