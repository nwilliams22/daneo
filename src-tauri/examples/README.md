# Verified completion compatibility gate

This developer example runs the pinned Qwen3.5-4B artifact in process on the CPU.
It does not wire inference into the app, download weights, or qualify translation
quality. The 4,096-token context and 1,024-token output cap are spike settings.

Manually provision `Qwen3.5-4B-Q4_K_M.gguf` from
[the immutable repository revision](https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/tree/e87f176479d0855a907a41277aca2f8ee7a09523).
The example pins repository, revision, filename, byte count and SHA-256, and
rejects a size or hash mismatch before initializing inference. Keep weights in
the ignored `.local-models/` directory or outside the repository.

From the repo root:

```sh
cargo build --locked --release --manifest-path src-tauri/Cargo.toml --example verified_completion
DANEO_MODEL_PATH="$PWD/.local-models/Qwen3.5-4B-Q4_K_M.gguf" \
  /usr/bin/time -v src-tauri/target/release/examples/verified_completion
```

Native prerequisites include a C/C++ compiler, CMake, libclang and its resource
headers, plus the existing Tauri Linux development libraries. On the measured
Nobara host, Cargo is in `$HOME/.cargo/bin`; libclang 22 needed
`BINDGEN_EXTRA_CLANG_ARGS='-isystem /usr/lib/clang/22/include'`. CMake 4.4.3 was
provisioned in a temporary Python venv and its `bin` directory added to `PATH`.
Set these for the build if the host has the same missing-tool/path conditions.

`llama-cpp-2` is exactly `0.1.158`, with default features disabled for a CPU-only
baseline. The lockfile pins `llama-cpp-sys-2` to `0.1.158`. Its published
`.cargo_vcs_info.json` names wrapper commit
`3b17d1f160f0e9cfcf95948954cefc967f8f92f2`; the
[submodule at that commit](https://github.com/utilityai/llama-cpp-rs/tree/3b17d1f160f0e9cfcf95948954cefc967f8f92f2/llama-cpp-sys-2)
is llama.cpp `26394b4e6749a41c3633db040e0987500a5f7013`.

The binding's legacy template API does not accept `enable_thinking`. The example
uses MiniJinja with Python-method compatibility to render the actual embedded
GGUF template with `enable_thinking=false`. It checks the closed empty thinking
prefix, samples greedily, requires end-of-generation within the cap, and rejects
empty output, thinking markers, or an answer other than `water` for the fixed
Korean word `물`. No generated output is stripped to hide reasoning.

`cold_process_load_seconds` measures eager model loading in a fresh process
(mmap disabled). It is **not a disk-cold measurement**: the required hash pass
has already read the entire file into the OS cache. Verification, context
creation and generation are timed separately. GNU time's maximum resident set
size measures the entire example process, excluding compilation. This CPU
baseline makes no GPU, UI, mobile, or ten-sentence quality claim.
