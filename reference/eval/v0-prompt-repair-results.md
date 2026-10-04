# Phase D v0 prompt repair — 2026-10-04

**Verdict: language gate fails; 1/10 fully correct versus ≥9/10 required.** The app now determines direction from the input script and sends it to both prompt consumers. The shared prompt states the closed role set, noun-particle identity/exclusions, romanization dependency, literal-gap triggers, and polite conjugation check. The selected prompt was tested against a separate six-item [development set](dev-translation-set.json), with [iteration evidence](dev-prompt-iterations.md), before this **single frozen-set pass**. No held-out item was used to revise the prompt after this result.

**Recommendation: next rung is a larger quantization of the same local 4B model**, because deterministic metadata errors remain in romanization and particle identity even with explicit prompt rules; compare it on a newly frozen gate and the unchanged rubric. This is a testable hypothesis, not a claim that precision will cure them. No paid/cloud fallback, runner-up model, fine-tune, sampler, artifact, context or output-cap change was made here.

## Procedure and scope

The ten exact inputs and rubric are unchanged: `v0-translation-set.json` SHA-256 `345d55365b66b537dc04ba7306f93d795cd1186805741230734bd4d9dd584645`; `v0-rubric.md` SHA-256 `92bcdae7295c94c56901de586e20ed8068446e29fd948833afa7e3d8cf574cf4`. Prompt SHA-256 `b274d374c30f459700bdc37e805dbf44c55542b5cc951264b9d605c398358ccb` was fixed before the run. Pinned Qwen3.5-4B Q4_K_M GGUF, `llama-cpp-2 0.1.158`, CPU/8 threads, greedy sampler, thinking disabled, 4,096-token context and 1,024-token output cap match baseline. A fresh native process warmed on unscored `Hello.`, submitted each held-out item **once**, and cancelled a separate `Hello.` after one token. `unshare --user --map-root-user --net` removed network access; no proxy or key was used.

The earlier [baseline](v0-results.md) ran through a real Tauri WebKit window. The first attempt here failed at GTK/Wayland initialization (Wayland protocol error). Setting the documented `WEBKIT_DISABLE_DMABUF_RENDERER=1` host workaround later allowed a separate **development-input** Explore smoke, described below. The frozen pass had already run through the same production `LocalTranslator` and prompt inside [`prompt_probe.rs`](../../src-tauri/examples/prompt_probe.rs), without the UI/IPC adapter. The raw model reply was retained before native JSON parsing and the requested direction override. `validate-prompt-repair.ts` applied the same `translationResultSchema` used by Explore to every native result. The native frozen run is language evidence; its RSS and latency are not directly comparable with the WebKit process-tree measurement.

## Gate counts

| Rubric threshold | Prompt repair | Verdict |
|---|---:|---|
| Schema-valid and complete | 10/10 | Pass |
| Correct app-facing direction | 10/10 | Pass |
| Fully correct | 1/10 (requires ≥9) | **Fail** |
| Meaning reversals | 0 | Pass |
| Invented grammatical/cultural rules | 3 (requires 0) | **Fail** |
| Thinking leaks | 0 | Pass |

All ten raw model labels also match the requested direction. The app no longer depends on those labels: `directionForInput` supplies the request, native response, and comparison-path response. The fully correct item EK-05 used `음식`, which maps directly to “food”; its empty `literal_gap` is valid **for that wording**, but it does not demonstrate that the model learned the 밥 rice/meal distinction. No item failed zod's role enum, but semantic role and particle descriptions still fail below.

## Per-item defects against the seven original findings

Numbers refer to the issue's seven defects: **1** direction, **2** role enum, **3** verbal ending/free adverb as particle, **4** noun-particle identity, **5** romanization, **6** literal gap, **7** conjugation/register. Defects 1 and 2 are fixed at the contract level on all ten; no verbal ending or free negation adverb was listed in `particles[]` (3). A missing or wrong noun particle still fails dimension 4. The [review JSON](v0-prompt-repair-review.json) records six pass/fail dimensions, evidence, reversals and invented rules for every item; the [scored join](raw/v0-prompt-repair-scored.json) retains raw and parsed replies.

| Item | Full | Fixed or improved | Survived |
|---|---:|---|---|
| EK-01 drink water | No | Direction 1, closed role 2, particle exclusion 3; malformed `마시요` gone | 7: `마십니다` uses 합니다, not 해요; 5: `mas-im-ni-da` mis-segments the word |
| EK-02 do not eat meat | No | 1–3: 안 is no longer called a particle; meaning stays non-eating | 4: lists 을 where the line has 를; 5: `go-gi-reuk`/`an-jayo`; gloss splits a nonexistent marker |
| EK-03 teacher coming | No | 1–3; teacher still honored | 4: calls subject 이 “topic”; 7: `오십니다` misses 해요 register; false rule |
| EK-04 wash hands | No | 1–4: actual 을 is correct; polite 씻어요 | 5: `ssit-seo-yo` does not track 씻어요; 6: no omitted-subject/possessor explanation |
| EK-05 eat food | **Yes** | 1–5, 7: direct `음식` wording, correct object marker and polite form | 6 remains **untested** for 밥 because the model chose 음식; no false gap was asserted |
| KE-01 friend likes coffee | No | 1–3, 6: implied “my” explained | 4: lists nonexistent 을, omits 가/를; 5: `joha-hayo`; gloss omits particle meaning |
| KE-02 no sugar | No | 1–3; existential negation preserved | 4: 이 falsely called topic; 5: `seontang`; 6: explains an omitted “there” instead of sugar-not-exists; false rule |
| KE-03 sit here | No | 1–4: request preserved, no noun particle invented | 5: `anseuseyo` does not track 앉으세요 |
| KE-04 met friend yesterday | No | 1–4, 6: subject omission explained; no enum rejection | 5: `eojje`/`mannat-eoyo`; gloss omits 를 |
| KE-05 food delicious | No | 1–3, 7: valid shape and polite Korean retained | Meaning narrows to rice; 4: 이 falsely called topic; 5: `matiss-eoyo`; 6: taste-exists gap empty; false rule |

A segmented gloss can pass when it keeps every meaningful chunk, role, and Korean order. EK-01/04/05 passed that dimension despite splitting a suffix; EK-02 and KE-04 did not because their gloss lost or invented a marker. The per-item `meaningReversal` flag is false throughout. KE-05 narrows “food” to “rice,” so its meaning dimension fails without flipping actor, polarity, time or speech act.

## Runtime and artifacts

| Measure | This native pass | Original desktop baseline |
|---|---:|---:|
| Warm completion p95 | **73.568 s** (nearest rank of 10; min 16.432 s, max 73.568 s) | 18.922 s (nearest rank of 30) |
| Fresh-process verified-load readiness | 1.465 s, from unscored greeting | 1.820 s |
| Fresh-process first token | 7.296 s, from unscored greeting | 5.425 s |
| Fresh-process greeting completion | 12.680 s | 17.093 s for baseline cold item |
| Peak RSS | **3,009,504 KiB**, GNU time, native process | 3,617,072 KiB, sampled WebKit process tree |
| Cancel acknowledgment | **<1 ms** at integer millisecond resolution, native `cancel` call | 1 ms native acknowledgment; 28 ms UI busy-state clear |

The native p95 includes a 73.568-second KE-05 completion and is above the desktop baseline's 18.922 seconds, but host/process/sample differences prevent attribution of the increase to the prompt alone. The runtime remains a qualification concern and needs a matched desktop rerun on a usable display. Peak RSS excludes WebKit here and must not be presented as a memory improvement. The cancellation reply was typed `cancelled`; it was followed by no recovery request in this native runner.

## Real Explore smoke on development inputs

After the frozen run, `prompt-repair-ui.ts` exercised real Explore controls in an isolated, offline Tauri WebKit profile using only non-held-out development inputs. With `WEBKIT_DISABLE_DMABUF_RENDERER=1`, the run exited 0. Hangul input `친구가 학교에 가요` rendered a saved-eligible result with the English reading “My friend is going to school”; Save to deck raised the count from 0 to 1. Cancelling `I study Korean` after the first token cleared the UI busy state in **43 ms**; a subsequent greeting rendered successfully, with saved count still 1. The WebKit process-tree peak was **3,716,796 KiB**. This proves the changed Local adapter and Explore interaction path can run offline, but the frozen language scores and native p95 above are unchanged. The rendered result still mislabeled subject 가 as “topic or contrastive subject”; UI success is not language qualification. Evidence: [rendered UI records](raw/v0-prompt-repair-ui.jsonl), [raw completions](raw/v0-prompt-repair-ui-raw.jsonl), [process memory](raw/v0-prompt-repair-ui-memory.json).

Files: [native outcome rows](raw/v0-prompt-repair-native.jsonl), [raw model replies](raw/v0-prompt-repair-raw.jsonl), [zod results](raw/v0-prompt-repair-schema.json), [scored join](raw/v0-prompt-repair-scored.json), [native memory](raw/v0-prompt-repair-memory.json), [development evidence](dev-prompt-iterations.md). Recompute the counts with `python3 reference/eval/summarize-prompt-repair.py`; the script fails if the ten ids, review dimensions or run shape do not match.
