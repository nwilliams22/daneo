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
