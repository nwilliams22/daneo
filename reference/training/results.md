# Compatibility proof — 2026-10-04

**Disposition: Q4_K_M schema gate failed; BF16 GGUF is a tested local alternative.
Full training stays blocked.**

Expected result: the authorized local 4B base can update BF16 LoRA weights,
merge, export Q4_K_M, and produce one schema-valid production-path reply without
using held-out inputs. This is not artifact qualification or full training.

## Training and merge: passed

- Python 3.12.13; exact 101-package environment: `requirements.lock`.
- Unsloth 2026.9.14, Zoo 2026.9.9, Transformers 5.5.0, PEFT 0.21.2,
  PyTorch 2.12.1+cu130, Triton 3.7.1; RTX 5090, 32,607 MiB physical VRAM.
- Base: `Qwen/Qwen3.5-4B`, Apache-2.0, revision
  `851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a`.
  `evidence/base-manifest.json` records all 13 downloaded files with hashes/bytes.
- `python3 reference/training/prepare-smoke.py`: PASS, four candidates avoid
  all 96 reserved IDs and normalized English/Korean texts; pinned corpus
  provenance and reservation SHA-256 pass. No learner data accessed.
- `node --import tsx reference/training/validate-smoke.mjs`: PASS, four strict
  model-owned targets, with no romanization or particles labels.
- `.local-models/compatibility/venv/bin/python reference/training/compatibility-probe.py`:
  four finite losses **0.493317, 0.274542, 0.384078, 0.345357**;
  **256 changed adapter tensors**, 10,616,832 trainable parameters.
- Training wall time **48.317 s** including first-use compilation;
  **60.103 input tokens/s** over 2904 tokens.
  Peak allocated **10,125,327,872 bytes**, reserved **10,229,907,456 bytes**.
  These are process allocator peaks, not sampled whole-card usage.
- BF16 merge completed. Total successful run through merge **142.576 s**
  with already downloaded weights. The initial model download took 88 seconds.
- Rank 8, alpha 16, dropout 0, seed 3407, context 1024, batch/accumulation 1/1,
  AdamW learning rate 0.0002, four steps, response-only loss. Exact settings and
  resolved adapter targets: `probe-config.json`, `evidence/adapter-config.json`.
  The archived adapter config replaces only the machine-local base path with
  its public model ID; the actual local config remains beside the adapter.

## Diagnosed failures and remedies

1. Initial tokenization failed before any optimizer step: the multimodal
   processor treated a positional prompt as an image and raised
   `Invalid base64-encoded string`. Using its underlying text tokenizer and
   explicitly disabling vision adapters passed on retry (numbers above).
2. Optional FLA/causal-conv1d kernels are absent. The available PyTorch fallback
   completed the bounded training; no speed claim about optimized kernels.
3. The converter packaged inside the Cargo registry lacks `conversion/`.
   Export uses official llama.cpp commit
   `d89651a7b205c03c4a0b13cd0646d400dc929f79`; the load check retains the
   pinned `llama-cpp-2 = 0.1.158`. The quantizer compiled successfully.
4. Elevated shells did not include local tool binaries on PATH. Retrying with
   their absolute paths resolved `uv`/`cmake` lookup; no system install needed.

## Scope and next gate

The examples and adapter are disposable compatibility artifacts. The unchanged
production prompt still requests particles as context, but particles are absent
from target labels and masked context cannot contribute to the loss. No prompt
was tuned; explanatory target fields are empty and are not curated full-training
labels. No v1/v2 run, cloud call, production model pin, release, or UI verification.
The production worker test is headless; this does not establish desktop UX.

## Export: passed

`.local-models/compatibility/venv/bin/python reference/training/export-smoke.py`
completed BF16 GGUF conversion in **37.542 s**, then Q4_K_M
quantization in **27.932 s**. Exported 441 language tensors.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `llama.cpp.tar.gz` | 37863878 | `8c938b796c065ce8e3cbdb2e367b08b8aa266113aeca3df8502e14abc33348f1` |
| `smoke-BF16.gguf` | 8665619808 | `dfc4258ca545fbe637063420f7d96fe913319ba992f5459ff56de501026af0fd` |
| `smoke-Q4_K_M.gguf` | 2783446368 | `b63827c5af2870185d7cf5889151972ffc40fdf2caea8b695ac25eee62406fbd` |
| `adapter/adapter_model.safetensors` | 42504600 | `56b8f6af80012dd9d7f1ba41f14bc18a6fee653a95eb685f1b35b706ce5e3b88` |

## Production-path result: Q4 failed, BF16 remedy passed

`cargo build --locked --release --manifest-path src-tauri/Cargo.toml --features
acceptance --example prompt_probe` passed. The first launch rejected the new
artifact against the base pin before loading; an acceptance-only exact
bytes/SHA-256 override now allows the probe artifact through the same verifier.
Normal production builds do not read these variables. Tests:

- `cargo test --locked --release --manifest-path src-tauri/Cargo.toml --features acceptance --lib local_translation::native::tests`: **3 passed**.
- Same test without `--features acceptance`: **2 passed**.
- Builds used `BINDGEN_EXTRA_CLANG_ARGS='-isystem /usr/lib/gcc/x86_64-redhat-linux/16/include'`.

The Q4 artifact was then run offline with
`python3 reference/training/run-runtime-smoke.py` at source commit `5cfb786`.
It loaded in **1.518 s**, produced valid JSON on the fixed non-held-out input
“Korean is hard. But it's fun.” in **7.675 s** (first token **4.918 s**), and
acknowledged cancellation in **0 ms**. But its reply **omitted `gloss`**.
`node --import tsx reference/training/validate-runtime.mjs` exited **1**:
the production postprocessor returned null and the assembled schema rejected it.
The native probe's exit 0 only proves it ran; it does not establish schema success.
Total process wall time was **22.18 s**, max RSS **2,975,616 KiB**.
`evidence/runtime-results.jsonl` and `runtime-raw.jsonl` are the deciding evidence.

Two diagnostics used the **same input, same prompt, same merged weights**, with
no retraining, prompt edit or held-out input:

1. `.local-models/compatibility/venv/bin/python reference/training/diagnose-merged.py`:
   merged Hugging Face BF16 greedy generation completed in **9.998 s** and
   returned `gloss`. Both the strict model-owned and assembled schemas passed.
   Evidence: `evidence/merged-hf-reply.json`.
2. `python3 reference/training/run-runtime-smoke.py --bf16`:
   the already-exported BF16 GGUF loaded and produced a reply with `gloss` through
   **the same pinned llama-cpp-2 0.1.158 worker**. Smoke completion **20.013 s**,
   first token **5.350 s**; cancellation **0 ms**.
   `node --import tsx reference/training/validate-runtime.mjs --bf16`: **PASS**.
   Evidence: `evidence/runtime-bf16-{raw,results}.jsonl`,
   `runtime-bf16-schema-result.json`, and `runtime-bf16-resources.txt`.

This isolates the observed schema regression to the Q4 artifact/path on this
input; it does **not** prove a universal quantizer defect or translation quality.
The BF16 output has one whole-sentence gloss chunk: schema-valid does not mean a
language-quality pass. The practical tested alternative is the 8,665,619,808-byte
BF16 GGUF on this local host; no production pin or shipping choice was made.
No Q8 or matched-converter inference was performed. Full training must not start
on an assumption that the Q4 export preserves the response contract.

## Closure and ownership

Duncan owns this proof. Its failure-path finish condition is an independently
reviewed record of the exact failing Q4 schema stage and the tested BF16
alternative, with reproducible commands and preserved hashes/output. Thufir
reviews this record; Duncan fixes any reproducibility defects. The source of
truth is this report plus `evidence/`, not a zero exit from the native launcher.
After review, the parent must explicitly resolve the Q4 response-contract gate
or adopt a newly authorized export path before full training is unblocked.
No production engine/artifact choice is implied by this compatibility result.

## Matched-toolchain follow-up — 2026-10-04

**Result: matching the converter/quantizer to the pinned runtime does not restore
`gloss`. The Q4 compatibility gate remains failed.** The baseline/control artifacts
above and every previously committed evidence file are retained unchanged.

### Exact match and supported conversion

The `llama-cpp-sys-2 0.1.158` crate records Rust binding revision
`3b17d1f160f0e9cfcf95948954cefc967f8f92f2`. Its upstream `llama.cpp` gitlink is
`26394b4e6749a41c3633db040e0987500a5f7013`, verified through the GitHub contents API
linked in `README.md`. Every one of the crate's **1,865 vendored files** matches
that archive byte-for-byte; all **3,612 archive files** match the local extracted
source. The complete archive includes `conversion/qwen.py:Qwen3_5TextModel`, which
supports `Qwen3_5ForConditionalGeneration`; the crate's omission of `conversion/`
is packaging, not lack of matched converter support.

The matched quantizer was built with CMake **4.4.4**, GCC **16.2.1 20260819
(Red Hat 16.2.1-2)**, CUDA off and eight build threads. It has no `--version`
command (that argument prints usage); source identity and executable SHA-256 are
recorded instead. The Python environment remains the existing `requirements.lock`.
No runtime, prompt, merged weight, or production pin change was made.

`export-matched.py` verifies the vendored match, reuses the existing merged weights,
and writes separate `matched-*` artifacts. `matched-input-manifest.json` records
merged-file identities and the reused native binary. The exact commands are in
`README.md` and `evidence/matched-export-result.json`.

| New artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `llama-matched.tar.gz` | 37535360 | `1d0fcd22eb0fb31b1f75de2cc9e585a3338b8937043662a0c222a1e9261fed29` |
| `matched-BF16.gguf` | 8665619744 | `5c407dc7aa856faa14fde45e5f837066719c5aad75115e6afc39bbeb2e77a88c` |
| `matched-Q4_K_M.gguf` | 2783446304 | `d1588703074943b31c817e7bc9e6c1864ab79a9c6823ba019e19b0246652dc9c` |
| `llama-matched/build/bin/llama-quantize` | 12576 | `398b543d82be71fc61f7190c87f6bd13772cb89dd630f72f57b2bb0ff2200f42` |

Conversion took **40.175 s**, max RSS **5,770,480 KiB**; quantization took
**35.071 s**, max RSS **4,300,028 KiB**. These are per-stage process measurements
from `/usr/bin/time -v`, not GPU allocator/card measurements. All export stages
exited 0. No new training or HF inference was performed.

### Production contract comparison

Ran exactly one new `python3 reference/training/run-runtime-smoke.py --matched`
using the unchanged worker binary, greedy sampling, prompt and fixed non-held-out
input, at diagnostic source commit `0b2bf2cd71e69949e733d49900960897553b0eaf`.
The existing launcher also performs its same unscored greeting and cancellation.
The exclusion preflight again passed all **96 reservations** for the four smoke
examples. Baseline Q4 and BF16 are retained controls, not new inference runs.

| Artifact | Strict model-owned | Production postprocessor | Assembled schema | Smoke completion | Process wall / max RSS |
| --- | --- | --- | --- | ---: | --- |
| Baseline Q4 | FAIL: missing `gloss` | null | FAIL | 7.675 s | 22.18 s / 2,975,616 KiB |
| Baseline BF16 | PASS | accepted | PASS | 20.013 s | 54.62 s / 8,559,260 KiB |
| Matched Q4 | FAIL: missing `gloss` | null | FAIL | 7.721 s | 21.17 s / 2,975,516 KiB |

Matched load/ready **1.588 s**, smoke first token **4.984 s**, cancellation **0 ms**.
The native run exited 0, but `node --import tsx reference/training/validate-matched.mjs`
exited **1**. This is the expected diagnostic failure, not a passing contract.
The strict check omits only deterministic `romanization`/`particles` fields and
rejects other extras; full assembly is independently validated. It also verifies
raw JSON equals parsed output and that prompt/fixture/rubric hashes match the
controls. Exact issues and postprocessor nulls are in
`evidence/matched-schema-comparison.json`.

The new smoke raw reply is byte-for-byte equal to the baseline Q4 reply:

```json
{"direction": "en-to-ko", "korean": "한국어는 어렵습니다. 하지만 재미있습니다.", "natural_english": "Korean is hard. But it's fun.", "literal_gap": "", "cultural_note": ""}
```

### Tensor-level comparison

`.local-models/compatibility/venv/bin/python reference/training/compare-export-tensors.py`
passed: **441/441 tensors identical** in name, order, shape, type and SHA-256
payload for both baseline/matched BF16 and baseline/matched Q4. The only differing
metadata fields are the key count and `tokenizer.ggml.add_bos_token` /
`tokenizer.ggml.add_eos_token` (both explicitly false in the baseline, absent
in the matched export). The new archives' 64-byte size difference is not
a weight change. All paired hashes are retained in
`evidence/matched-tensor-comparison.json`; no additional inference was needed.

### What this settles and what it does not

The hypothesis that this missing field is fixed merely by matching the export
revision is rejected on this input. It does not establish a universal quantizer
bug, diagnose why these quantized weights omit the field, or measure language
quality. BF16 remains a schema-tested alternative with a one-chunk gloss, not a
selected production artifact. There was no UI run, dataset construction, held-out
inference, prompt tuning, cloud use or spend. Full training remains gated.

Next: independent review of the retained negative result and an export-path
scope decision. The bounded next experiment to consider is **one matched Q8_0
export of the same merged weights on the same input**, with the same strict and
assembled contract checks before any training. It is a proposed experiment,
not authorization to run it. A decision may instead authorize continued work
using the tested BF16 path, explicitly accepting its measured memory/disk cost;
neither choice selects a shipping model or waives the frozen v2 quality gate.


## Matched Q8_0 bounded probe — 2026-10-04

**Result: Q8_0 passes the strict model-owned schema, production postprocessor,
and assembled app schema on the fixed non-held-out smoke input, with `gloss`
present.** A contract-compatible quantized export path exists for this probe.
Independent review remains required before resolving this gate. This does not
select a production artifact or qualify language quality; no full training ran.

Used the same merged weights, matched llama.cpp
`26394b4e6749a41c3633db040e0987500a5f7013`, pinned `llama-cpp-2 0.1.158`
worker and unchanged production prompt. The exporter verified every merged input
and native binary against `evidence/matched-input-manifest.json` before running.
The new BF16 intermediate is byte-identical to the prior matched BF16, SHA-256
`5c407dc7aa856faa14fde45e5f837066719c5aad75115e6afc39bbeb2e77a88c`.
The native worker remains the existing CPU-backend build on the 5090 host;
these are not GPU inference measurements. No rebuild or runtime change occurred.

| Artifact | Exact bytes | SHA-256 |
| --- | ---: | --- |
| `q8-Q8_0.gguf` | 4610579744 | `26e1c9db711b5fc43dc2b373bae825e506d55129b735a1bfe2bafce732e5fd4d` |

| Stage | Wall seconds | Max RSS (KiB) |
| --- | ---: | ---: |
| Conversion | 30.294 | 5769112 |
| Q8_0 quantization | 43.039 | 4452380 |
| Native process (load, warmup, smoke, cancellation) | 34.78 | 4707140 |
| Fixed smoke completion | 14.102 | included in process peak above |

The native run at source `18fa8ff57e4902b480c8012277abf83cfdedbf57` exited 0;
first-process ready was 6.967 s, smoke first token 5.562 s, cancellation 0 ms.
All commands are under the bounded Q8 section in `README.md`; exact export
commands, artifact hashes and resource records are retained in `evidence/q8-*`
and `evidence/runtime-q8-*`. One new smoke inference was run offline, plus the
launcher's unchanged unscored greeting/cancellation checks. No controls or
held-out inputs were rerun. The greeting omits `gloss` and is not a contract
pass; the success claim is limited to the specified smoke input.

Raw fixed-input reply, verbatim:

```json
{"direction": "en-to-ko", "korean": "한국어는 어려워요. 하지만 재미있어요.", "natural_english": "Korean is hard. But it's fun.", "gloss": [{"chunk": "한국어는 어려워요. 하지만 재미있어요.", "gloss": "Korean-[topic] is-hard-[verb] but is-fun-[verb]", "role": "verb"}], "literal_gap": "", "cultural_note": ""}
```

| Retained artifact | Strict | Production postprocessor | Assembled |
| --- | --- | --- | --- |
| Baseline Q4 | FAIL (missing gloss) | rejected | FAIL |
| Baseline BF16 | PASS | accepted | PASS |
| Matched Q4 | FAIL (missing gloss) | rejected | FAIL |
| Matched Q8_0 | PASS | accepted | PASS |

From `/mnt/t7/Projects/daneo`, both
`node --import tsx reference/training/validate-matched.mjs` and
`node --import tsx reference/training/validate-runtime.mjs --q8` exit **0**.
The former preserves the earlier verdicts, verifies raw/parsed equality and
matching prompt/fixture/rubric identities, and records all four rows in
`evidence/matched-schema-comparison.json`. The latter validates the production
postprocessor and complete app schema for Q8. Schema success does not establish
that this single-chunk gloss is pedagogically adequate.

`python3 reference/eval/check-independent-freeze.py --candidates reference/training/smoke-examples.json`
passes **96 reservations / 4 clear candidates**. All **13 baseline evidence files**
remain byte-identical to `d90317c`; hashes and sizes are recorded in
`evidence/q8-baseline-preservation.json`. Python compilation and
`git diff --check` pass. No UI was run or changed, no dataset was constructed,
no prompt/pin changed, and no cloud service or spending was used.

Next: independent review of this committed evidence. The gate closes only when
that verdict is recorded; production artifact selection and the frozen v2 quality
gate remain separate. This task stops at the bounded export/contract result.
