# Local compatibility probe

This is a four-step numerical smoke test, not the training dataset or a language
quality result. It uses four corpus-derived examples selected only after the
independent evaluation freeze passes. Do not use these throwaway targets for full
training: explanatory fields are deliberately empty. No evaluation inference is
performed and `reference/model-pin.json` is not changed.

The model targets exclude romanization and `particles[]`; `validate-smoke.mjs`
validates the smaller strict shape separately from the assembled app result.
The unchanged production prompt remains context and is masked from training loss.
Only response tokens receive labels. The Qwen chat template disables thinking as
the production runtime does. Vision adapters are disabled.

## Reproduce from the repository root

Use Python 3.12.13 and the exact packages in `requirements.lock`. `uv` and `cmake`
must be on PATH. All large/generated artifacts remain in the git-ignored
`.local-models/compatibility/` directory. No credentials are needed.

```sh
export UV_CACHE_DIR="$PWD/.local-models/compatibility/uv-cache"
export UV_PYTHON_INSTALL_DIR="$PWD/.local-models/compatibility/python"
uv venv --python 3.12.13 .local-models/compatibility/venv
uv pip sync --python .local-models/compatibility/venv/bin/python reference/training/requirements.lock
python3 reference/training/prepare-smoke.py
node --import tsx reference/training/validate-smoke.mjs
.local-models/compatibility/venv/bin/python reference/training/compatibility-probe.py
```

The probe pins the Apache-2.0 `Qwen/Qwen3.5-4B` base revision in
`probe-config.json`, records every downloaded file's SHA-256 and byte count,
asserts finite loss and changed adapter tensors, saves the adapter, then merges.
Peak allocated/reserved GPU memory is PyTorch process memory, not total card
occupancy. Token throughput counts all input tokens, including masked context.
Training time includes first-use kernel compilation; download/hash/load time is
reported separately in the total through merge.

The recipe follows the upstream [Qwen3.5 BF16 guidance](https://unsloth.ai/docs/models/qwen3.5/fine-tune).
The installed processor is multimodal; tokenization uses its text tokenizer.
The optional FLA/causal-conv1d kernels are absent; the observed run uses the
available PyTorch fallback. See `results.md` for actual outcomes and limitations.

## Export and runtime

The Cargo-vendored converter lacks the Python `conversion` package. Use this
pinned official source archive for export; the load test still uses Daneo's
`llama-cpp-2 = 0.1.158` and its production worker.

```sh
curl -fL https://codeload.github.com/ggml-org/llama.cpp/tar.gz/d89651a7b205c03c4a0b13cd0646d400dc929f79 -o .local-models/compatibility/llama.cpp.tar.gz
mkdir -p .local-models/compatibility/llama.cpp
tar -xzf .local-models/compatibility/llama.cpp.tar.gz --strip-components=1 -C .local-models/compatibility/llama.cpp
cmake -S .local-models/compatibility/llama.cpp -B .local-models/compatibility/llama.cpp/build -DGGML_CUDA=OFF -DLLAMA_CURL=OFF -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_SERVER=OFF
cmake --build .local-models/compatibility/llama.cpp/build --target llama-quantize -j 8
.local-models/compatibility/venv/bin/python reference/training/export-smoke.py
cargo build --locked --release --manifest-path src-tauri/Cargo.toml --features acceptance --example prompt_probe
python3 reference/training/run-runtime-smoke.py
node --import tsx reference/training/validate-runtime.mjs
```

The native probe also runs its built-in unscored greeting and cancellation check.
It never opens a learner profile. Its network namespace is offline. Retain old
runtime output before an intentional rerun; the launcher refuses to overwrite it.
This proves the production worker and app schema path, not a desktop UI run.

The acceptance feature alone reads `DANEO_ACCEPTANCE_MODEL_BYTES` and
`DANEO_ACCEPTANCE_MODEL_SHA256`. The launcher sets both from `export-result.json`;
normal production builds ignore them. Missing both retains the base identity;
a partial/invalid pair fails closed. The exact file is still checked before
loading, and raw acceptance provenance includes its identity.

## Observed failure and bounded diagnostic

The recorded Q4 runtime schema check **fails** because `gloss` is missing.
Do not interpret the native launcher exit 0 as a pass. The tested BF16 alternative:

```sh
.local-models/compatibility/venv/bin/python reference/training/diagnose-merged.py
python3 reference/training/run-runtime-smoke.py --bf16
node --import tsx reference/training/validate-runtime.mjs --bf16
```

These use the same non-held-out input. BF16 passes the app schema; full training
remains blocked on resolving the Q4 gate or authorizing a different export path.
The diagnostic does not evaluate language quality or change the production pin.

## Matched-runtime Q4 diagnosis

Reuse the existing environment and merged weights; do not repeat training. The
pinned crate's VCS revision is `3b17d1f160f0e9cfcf95948954cefc967f8f92f2`.
Its `llama-cpp-sys-2/llama.cpp` gitlink identifies the matched revision below
([upstream gitlink](https://api.github.com/repos/utilityai/llama-cpp-rs/contents/llama-cpp-sys-2/llama.cpp?ref=3b17d1f160f0e9cfcf95948954cefc967f8f92f2)).
`evidence/matched-toolchain.json` records the archive identity and byte-for-byte
comparison of all 1,865 crate-vendored files and all 3,612 archive files. The
crate omits `conversion/`, but the complete matched archive has Qwen3.5 support.

If the matched archive/source is already present, verify/reuse it. For a fresh
checkout, fetch/extract it once:

```sh
curl -fL https://codeload.github.com/ggml-org/llama.cpp/tar.gz/26394b4e6749a41c3633db040e0987500a5f7013 -o .local-models/compatibility/llama-matched.tar.gz
printf '%s  %s\n' 1d0fcd22eb0fb31b1f75de2cc9e585a3338b8937043662a0c222a1e9261fed29 .local-models/compatibility/llama-matched.tar.gz | sha256sum -c -
mkdir -p .local-models/compatibility/llama-matched
tar -xzf .local-models/compatibility/llama-matched.tar.gz --strip-components=1 -C .local-models/compatibility/llama-matched
cmake -S .local-models/compatibility/llama-matched -B .local-models/compatibility/llama-matched/build -DGGML_CUDA=OFF -DLLAMA_CURL=OFF -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_SERVER=OFF
cmake --build .local-models/compatibility/llama-matched/build --target llama-quantize -j 8
.local-models/compatibility/venv/bin/python reference/training/export-matched.py > .local-models/compatibility/matched-export.log 2>&1
python3 reference/training/run-runtime-smoke.py --matched > .local-models/compatibility/runtime-matched.log 2>&1
cp .local-models/compatibility/matched-export-result.json reference/training/evidence/
cp .local-models/compatibility/runtime-matched-{raw,results}.jsonl reference/training/evidence/
node --import tsx reference/training/validate-matched.mjs
```

On this host `cmake` was invoked as `/home/baddong/.local/bin/cmake`.
Both export and runtime launchers refuse to replace their matched outputs.
No native rebuild or runtime change was needed: the existing production worker
binary uses the same pinned source and prompt as the baseline. A fresh checkout
must build the acceptance example with the command above before inference.
`export-matched.py` records per-stage `/usr/bin/time -v` measurements and artifact
hashes. The native launcher records its own `/usr/bin/time -v` output in the log.

`validate-matched.mjs` checks the preserved raw JSON against parsed results and
requires identical input/prompt/fixture/rubric identities across all three runs.
It removes only deterministic `romanization` and `particles` fields before
strict model-owned validation, then independently runs the unchanged production
postprocessor and complete app schema. It writes
`evidence/matched-schema-comparison.json`; **exit 1 means the matched Q4 failed**.
A native exit 0 is never the contract verdict. Baseline/control inference is
not repeated: their already-preserved evidence is the comparison control.

To reproduce the tensor comparison without inference:

```sh
.local-models/compatibility/venv/bin/python reference/training/compare-export-tensors.py
```

This hashes each tensor's raw payload and checks its name/order/type/shape, then
compares metadata field bytes. `evidence/matched-tensor-comparison.json` preserves
all 441 tensor hash pairs at each precision.

## Bounded matched Q8_0 probe

The following records the completed probe, not instructions to repeat it.
The decision addendum requires reusing `matched-BF16.gguf`; the completed run
instead reconverted a byte-identical `q8-BF16.gguf`. Do not rerun the export or
inference to repair that procedural deviation. `--q8` verifies the
merged-input and unchanged native-worker manifest before conversion, and refuses
to overwrite its separate artifacts. Historical commands:

```sh
.local-models/compatibility/venv/bin/python reference/training/export-matched.py --q8 > .local-models/compatibility/q8-export.log 2>&1
python3 reference/training/run-runtime-smoke.py --q8 > .local-models/compatibility/runtime-q8.log 2>&1
cp .local-models/compatibility/q8-export-result.json reference/training/evidence/
cp .local-models/compatibility/runtime-q8-{raw,results}.jsonl reference/training/evidence/
node --import tsx reference/training/validate-matched.mjs
node --import tsx reference/training/validate-runtime.mjs --q8
python3 reference/eval/check-independent-freeze.py --candidates reference/training/smoke-examples.json
```

The extended comparison now prints baseline Q4, baseline BF16, matched Q4 and
matched Q8_0 verdicts separately; its exit status is the **Q8_0** strict,
postprocessor, assembled and direction verdict. Earlier negative Q4 rows remain
negative. No baseline/control inference is repeated. A Q8 contract pass is not
language qualification, production selection, or permission to run the frozen v2.

Read-only artifact verification (writes only new Q8 comparison evidence):

```sh
.local-models/compatibility/venv/bin/python reference/training/compare-export-tensors.py --q8
```

This asserts full-file identities for both BF16 files, the matched quantizer and
Q8 output, compares all BF16 tensor payloads and metadata, and checks the recorded
quantization command. It writes `evidence/q8-tensor-comparison.json` and leaves
the retained baseline/matched comparison untouched. It establishes an identical
source plus recorded derivation, not independent reproduction of quantization.

## Reviewed v1 QLoRA candidate

`v1-config.json` fixes a single three-epoch run on the reviewed 27-row dataset,
with no held-out tuning or checkpoint selection. `train-v1.py --probe` first
trains two steps from the original base. Its merged Q8 export must pass the
same native worker and strict/postprocessed schema checks before the full run.
The full run starts fresh from the original base, not the probe adapter.
Response-only loss masks the unchanged production prompt. Batch and gradient
accumulation are both one; row order is shuffled deterministically per epoch.
The constant learning rate and three epochs are fixed before any inference.

From the repository root, with local GPU access:

```sh
.local-models/compatibility/venv/bin/python reference/training/train-v1.py --probe
.local-models/compatibility/venv/bin/python reference/training/export-v1.py --probe
.local-models/compatibility/venv/bin/python reference/training/train-v1.py
.local-models/compatibility/venv/bin/python reference/training/export-v1.py
```

All weights stay in ignored `.local-models/v1-probe/` and `.local-models/v1/`.
The scripts refuse to overwrite artifacts. Do not delete prior evidence to
rerun; an intentional new experiment needs its own directory and authorization.
The existing pinned environment (`requirements.lock`), base manifest and
matched converter are reused offline. The native binary must retain the hash
from `evidence/matched-input-manifest.json`. It runs in an isolated network
namespace using the same non-held-out smoke fixture as the compatibility proof,
plus its built-in greeting/cancellation checks. This is a headless worker test,
not desktop UI verification or language scoring. The resulting candidate is
for independent scoring; it does not alter `reference/model-pin.json`.

## Scaled v2 development selection

Use the same offline environment, base revision, prompt, LoRA shape and matched
exporter as v1. The frozen 250-row training and 40-row development identities
are in `development-v2-freeze.md`. Development rows are evaluated with gradients
disabled and never enter the optimizer. The sealed final set is only consumed
internally by the pre-existing mechanical exclusion checker, never inspected
or used for selection.

The bounded comparison uses peak learning rates 0.0001 and 0.0002, a four-epoch
maximum (1,000 updates each), and 25 warmup updates followed by cosine decay.
The smaller rate tests a conservative update against v1's rate on the much
larger corpus. Warmup covers the first tenth of the first epoch; decay permits
settling without maintaining v1's constant rate over 1,000 updates. This is a
fixed warmup choice, not a separately optimized claim. Compare token-weighted
response-only development loss at baseline and after each epoch. Restore each
run's lowest-loss trained epoch before merge; select the run with the lowest
development loss (earlier epoch, then smaller rate, on a tie). Do not retry or
change selection based on the native smoke answer or the sealed gate.

```sh
.local-models/compatibility/venv/bin/python reference/training/train-v1.py --config v2-lr1-config.json --name v2-lr1
.local-models/compatibility/venv/bin/python reference/training/train-v1.py --config v2-lr2-config.json --name v2-lr2
# Replace SELECTED with v2-lr1 or v2-lr2 after comparing development losses.
.local-models/compatibility/venv/bin/python reference/training/export-v1.py --name SELECTED
node --import tsx reference/training/validate-v1.mjs --name SELECTED
```

Output directories refuse overwrite. `training-result.json` preserves every
training loss and learning rate, development losses, selected epoch, elapsed
time including development evaluation, allocator memory peaks and source
identity. `export-result.json` preserves all merged file hashes and export
identities. Large weights remain in ignored `.local-models/`, as in v1; the
committed evidence and issue work product bind the selected local artifact.
A worker smoke pass establishes the load/response contract only. The next
independent gate decides language quality; `model-pin.json` remains null.
