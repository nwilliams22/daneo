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
