# Reviewed-dataset QLoRA candidate — 2026-10-05

Expected result: a merged Q8_0 candidate that loads in the pinned production
worker and yields one schema-valid response, with reproducible training and
export identities. This report does not score or select a production artifact.

## Inputs and fixed run

- Dataset: `dataset-v1.json`, 27 reviewed corpus-derived rows; SHA-256
  `1645184e5bc7dafb0359937104dd338b2e8b5de386d1d0ccf4de3740422b5f3d`.
  Corpus commit `6587c1f9ef471eb9e50b7059fd99ee745d4c2a64`.
  All 27 passed strict target validation and the 96-reservation exclusion check.
- Base: `Qwen/Qwen3.5-4B`, Apache-2.0, revision
  `851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a`. All 13 files were verified against
  `evidence/base-manifest.json` before training. Weight-shard SHA-256 values:
  `26a93f066e1916adb13453dae5a0c707c0fbc71299ed98779571a907b8e74c61`
  and `cb544bd9bfae93dc59b0f22b292f5933573854a7f9b97835c67060d7d910e188`.
- Environment reused from `requirements.lock`: Python 3.12.13, Unsloth
  2026.9.14, Zoo 2026.9.9, Transformers 5.5.0, PEFT 0.21.2,
  PyTorch 2.12.1+cu130, bitsandbytes 0.50.2. RTX 5090, 32,607 MiB physical VRAM.
- `v1-config.json`: NF4 four-bit base with double quantization, BF16 compute;
  LoRA rank 8, alpha 16, dropout 0; target modules `q_proj`, `k_proj`, `v_proj`,
  `o_proj`, `gate_proj`, `up_proj`, `down_proj`. Resolved adapter configuration
  and quantization exceptions are in `evidence/v1/`.
- AdamW, learning rate 0.0002, constant schedule, weight decay 0.01, gradient
  norm limit 1.0, three epochs (81 optimizer steps), sequence limit 1024,
  batch 1, accumulation 1, seed 3407. Epoch row order is seeded and shuffled.
  The final adapter is used without checkpoint selection or held-out tuning.
  Only response tokens contribute to loss; the production prompt is unchanged.

## Compatibility before the full run

A fresh two-step QLoRA adapter passed merge, matched Q8_0 conversion and the
unchanged pinned `llama-cpp-2 0.1.158` worker before the full run began.
`evidence/v1-probe/` retains its settings, losses, artifact hashes, raw replies,
resource measurements and validator output. Training: 7.128 s; total through
merge: 49.670 s; peak allocated/reserved: 4,258,996,736 / 4,406,116,352 bytes.
The strict model-owned, production postprocessor, assembled schema and direction
checks all passed. Smoke completion: 18.247 s; first token: 5.085 s.
This disposable adapter was not used to initialize the full candidate.

## Training result and repaired attempt

The successful run at source `1414fe374a1721e81c5330ee478dc5b8bcfd6c2a`
completed 81 finite-loss updates, changing 256 adapter tensors with 10,616,832
trainable parameters. Training: **17.579 s**; total load/training/save/merge:
**58.514 s**, excluding initial base hash verification and imports. Peak CUDA
allocated **4,277,922,816 bytes**, reserved **4,429,185,024 bytes**. These are
process allocator peaks, not whole-card samples. First-use compilation was
already cached by the probe. Optional FLA/causal-conv1d kernels were absent;
the installed PyTorch fallback was used.

| Epoch | Mean training loss |
| --- | ---: |
| 1 | 0.209269 |
| 2 | 0.039239 |
| 3 | 0.017200 |

Every step, row ID, token count and gradient norm is recorded in
`evidence/v1/training-result.json`. Decreasing training loss is not a
language-quality result, especially on 27 rows.

An earlier attempt completed 81 updates but failed while serializing a PyTorch
dtype in the report, before adapter saving. It produced no export or inference.
`evidence/v1-report-failure.json` retains the losses and error. The repair only
serializes dtype metadata as strings; the same seed/config was repeated from
the original base. This is not selection between trained candidates. Seeded
runs are not promised bitwise deterministic; the two recorded loss sequences
differ numerically. The initial probe ran from uncommitted script bytes later
committed in `c9a0a53`; its HEAD field therefore names the preceding dataset
commit. Later metadata-only changes and the serialization repair are in git.

## Commands and scope

Run from `/mnt/t7/Projects/daneo`; the four sequential commands are in
`README.md` under “Reviewed v1 QLoRA candidate”. Existing output directories
are protected against overwrite. Evidence-only checks need no retraining:

```sh
python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v1.json
node --import tsx reference/training/validate-v1.mjs --dataset
node --import tsx reference/training/validate-v1.mjs --probe --evidence
node --import tsx reference/training/validate-v1.mjs --evidence
npx vitest run src/lib/translation-postprocess.test.ts
npm run validate:content
```

The exclusion check passes 96 reservations / 27 candidates; strict targets
pass 27/27; postprocessor tests pass 45/45 and content validation 16/16.
No held-out inference, scoring, model pin, prompt, runtime, UI, or packaging
change is part of this run. The worker uses its existing CPU backend; training
uses CUDA. Headless native success does not establish desktop UI behavior.

## Final export and runtime result: PASS

Matched converter: llama.cpp `26394b4e6749a41c3633db040e0987500a5f7013`;
1,865 vendored files checked, conversion modules compared to the retained
matched archive, and quantizer identity checked before export. Conversion
**32.110 s**, Q8_0 quantization **23.335 s**. Full stage commands and resource
records are in `evidence/v1/export-result.json` and `*-resources.txt`.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `candidate-Q8_0.gguf` | 4610579744 | `1b6a3bf392e872eede021b70294b8611ea82743412a0215807f4f55d8d64e0d7` |
| `candidate-BF16.gguf` | 8665619744 | `b760cb416eb462f76e379393928eac60b607b7031eec609f4fa465bdb6c3f1f1` |
| `adapter/adapter_model.safetensors` | 42504600 | `1f7b404792e754042763ebc10e273a23952c1601fa6c3dad1131d119c004fad3` |

The deliverable remains in `.local-models/v1/candidate-Q8_0.gguf` for local
independent scoring; large weights are intentionally excluded from git.
The native binary hash was checked against the prior matched-input manifest;
no native rebuild was performed. Acceptance-only identity overrides admit this
candidate through the same worker integrity verifier. Normal production pin
and runtime remain unchanged.

`export-v1.py` and `validate-v1.mjs` both exited **0**. Strict model-owned,
production-postprocessor, assembled-schema and direction checks are all **true**.
Raw JSON equality and the actual loaded model's bytes/hash are also checked.
The fixed non-held-out input was “Korean is hard. But it's fun.”; completion
**15.553 s**, first token **5.017 s**, cancellation **0 ms**. The complete native
process took **32.75 s**, with maximum RSS **4,707,224 KiB**. Its output was:

```json
{"cultural_note":"","direction":"en-to-ko","gloss":[{"chunk":"한국어는","gloss":"Korean-[as for]","role":"other"},{"chunk":"어렵지만","gloss":"hard-but","role":"verb"},{"chunk":"재미있어요","gloss":"is-fun","role":"verb"}],"korean":"한국어는 어렵지만 재미있어요","literal_gap":"","natural_english":"Korean is hard. But it's fun."}
```

This proves the load/response contract only. It does not certify the gloss
roles or language quality. No UI was run. The worker also ran its unchanged
unscored greeting and cancellation checks; their raw evidence is retained.

Closure condition: independent verification of this candidate's
identity, training/export measurements, exclusion checks and one passing
production-worker contract result. Independent QA reviews the committed evidence before closure. After that review, the frozen
scoring task can consume the exact Q8_0 hash above, without retraining or
selecting a different checkpoint. Production artifact selection remains separate.
