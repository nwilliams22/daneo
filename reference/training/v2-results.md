# Scaled QLoRA candidate — 2026-10-05

Expected result: one selected Q8_0 candidate with measured identity and an actual
response from the unchanged native worker. **Training/export/runtime result:
PASS.** This is a load/response-contract result, not a language-quality score.
The production model pin remains null; release one keeps AI off.

## Frozen inputs and bounded selection

Training: 250 rows, SHA-256
`0e4509055cf8074676505af1068b460726d35154b75c896edefccb2a8704f57e`.
Development: 40 rows, SHA-256
`f9b83bd52dce8a3f4c557af27ea94c4fe4226b41d796ebc566b0d1a8337e343d`.
Strict schema validation passes 250/250 and 40/40. Mechanical exclusion verifies
all 96 reservations, v1 and cross-split independence. The sealed set was read
only internally by the existing exclusion checker; no held-out answer was
inspected, inferred on, or used as supervision or for checkpoint selection.

Reused `train-v1.py` and `export-v1.py`; base revision, production prompt,
NF4/BF16 settings, rank 8 / alpha 16 LoRA and locked environment remain as in
`v1-results.md`. Base files were rehashed before both runs. The verified v1
Q8_0 probe supplies the existing compatibility prerequisite.

The predeclared protocol is in `README.md`, “Scaled v2 development selection”.
Configurations are `v2-lr1-config.json` and `v2-lr2-config.json`. Compared peak
rates 0.0001 and v1's 0.0002 with 25 warmup updates and cosine decay over four
epochs (1,000 updates each). The smaller rate tests conservative updates on a
larger corpus. Warmup covers 10% of the first epoch; it is a fixed choice, not
a separately optimized hyperparameter. Development-only response-token loss
selects the rate and trained epoch; later epochs are restored away before merge.
No development gradients enter training. No smoke-answer-driven selection.

| Development loss | LR 0.0001 | LR 0.0002 |
| --- | ---: | ---: |
| Baseline | 0.657473800 | 0.657473800 |
| Epoch 1 | 0.218592826 | 0.212900347 |
| Epoch 2 | 0.210299619 | 0.221530631 |
| Epoch 3 | 0.250007556 | 0.239774283 |
| Epoch 4 | 0.265336828 | 0.267924437 |

**Selected: `v2-lr1`, epoch 2 (500 updates), development loss 0.210299619.**
Both runs overfit after their best epoch; this is why v1's fixed final checkpoint
was not reused as a selection rule. `evidence/v2/selection.json` was committed
before export. This comparison does not establish the model's language quality.

## Measured cost

RTX 5090, 32,607 MiB physical VRAM. Each run executes 1,000 finite-loss optimizer
steps and changes 256 adapter tensors (10,616,832 trainable parameters).

| Run | Training + development seconds | Load through merge seconds | Selected epoch |
| --- | ---: | ---: | ---: |
| v2-lr1 | 185.394 | 234.020 | 2 |
| v2-lr2 | 182.969 | 227.331 | 1 |

Total comparison cost: **368.364 seconds**
including baseline/epoch development evaluation, **2,000 optimizer steps**;
load through both merges: **461.351
seconds**. These timers exclude initial base hashing and Python imports.
Both runs peaked at 4,330,988,544 CUDA allocated / 4,450,156,544 reserved bytes.
These are process allocator peaks before merge, not whole-card samples.
Compilation caches were already populated by prior work. Every training loss,
learning rate, development loss, configuration and library version is retained
under `evidence/v2-lr1/` and `evidence/v2-lr2/`; runner/config hashes are in
`evidence/v2/runner-manifest.json`. Run reports record HEAD at report creation;
the executed runner bytes are from `2a9ff8a`, unchanged during both runs.

## Export identity

Matched llama.cpp converter: `26394b4e6749a41c3633db040e0987500a5f7013`,
1,865 vendored files checked against pinned `llama-cpp-2 0.1.158`, plus retained
conversion archive and quantizer identity checks. Conversion:
**54.138 seconds**; Q8_0 quantization:
**30.361 seconds**. Q8_0 reuses the precision that
passed the prior runtime/response-contract probe; no lower-precision attempt
or post-smoke export retry was made here.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `candidate-BF16.gguf` | 8665619744 | `7445fab663c62e9b94c2dc4e6f375ad30b99f4220d12b5d0337189c6884e873e` |
| `candidate-Q8_0.gguf` | 4610579744 | `025935d6c8477d70946b0e97fddcac318ddbd04630a496bd011f488ef39020c5` |
| `adapter/adapter_model.safetensors` | 42504600 | `0f3c5d6f4e99c179c18e34359e06ab882eb1ffb6c985b9759802b453a52967e2` |
| `merged/model.safetensors-00001-of-00002.safetensors` | 5329398688 | `f6c13998a90cc940e8b3dbd6a6cb898fe874f4ca210b515d5c44cb2c6d5af4e2` |
| `merged/model.safetensors-00002-of-00002.safetensors` | 3990429408 | `15785c28c4f882e44a8ab99bd788e12ebb4b0e226d83339637fdce524d209f14` |

All merged files total **9339921127 bytes**;
every file's size/hash is in `evidence/v2-lr1/export-result.json`. The selected
artifact is `.local-models/v2-lr1/candidate-Q8_0.gguf`. As in v1, multi-gigabyte
weights stay in ignored local storage: the binary itself is **not committed to
git**. The committed manifest and issue workspace work product bind the actual
file for independent scoring. No model distribution or release is claimed.

## Actual worker result

The existing `prompt_probe` binary matched the retained binary SHA-256 manifest;
no native rebuild or worker edit was made. Acceptance-only identity overrides
admit the candidate to the unchanged worker integrity verifier. It ran with an
isolated network namespace using its existing CPU backend. The fixed,
non-held-out input was “Korean is hard. But it's fun.”

```json
{"cultural_note":"","direction":"en-to-ko","gloss":[{"chunk":"한국어는","gloss":"Korean-[as for]","role":"subject"},{"chunk":"어렵지만","gloss":"is-difficult-but","role":"other"},{"chunk":"재미있어요","gloss":"is-fun","role":"verb"}],"korean":"한국어는 어렵지만 재미있어요","literal_gap":"","natural_english":"Korean is hard. But it's fun."}
```

Strict model-owned schema, production postprocessor, assembled schema and
direction all passed; raw reply equality and loaded model bytes/hash passed.
Completion: **15.982 seconds**, first token **5.122 seconds**. The unchanged
unscored greeting and cancellation probes also ran; cancellation took 0 ms.
Raw replies and process resource measurements are retained in `evidence/v2-lr1/`.
No desktop UI was run; this proves headless native load/response behavior only.

## Recheck and handoff

From `/mnt/t7/Projects/daneo`:

```sh
python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v2.json
node --import tsx reference/training/validate-v1.mjs --dataset --v2
node --import tsx reference/training/validate-v1.mjs --name v2-lr1 --evidence
npm run build
npm run validate:content
npm test -- --run
```

Observed: exclusion/freeze PASS; strict targets 250/250 + 40/40; retained native
schema evidence PASS; production build PASS (including TypeScript); content
16/16; tests 242/242 in 21 files. Python syntax compilation also passed.
The actual export command, including the native load and validation, exited 0:
`.local-models/compatibility/venv/bin/python reference/training/export-v1.py --name v2-lr1`.
Do not rerun training/export in an existing output directory; use retained
evidence for review and the exact artifact for the independent gate.

Owner: Duncan. Next: independent verification of the recorded identity and
native evidence, followed by the separate once-only sealed gate. Closure:
configuration/losses and this report pushed with green CI, artifact identity
verified, and native reply proof accepted. No gate scoring occurs on this task.
