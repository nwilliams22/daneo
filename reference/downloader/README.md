# Model downloader contract

`reference/model-pin.json` is compiled into the desktop app. Its `pin` is deliberately
`null`: no production model has been selected. `download_model` refuses that value
with `invalid-pin`, before filesystem or network work. A future selection supplies
all five fields (`repoId`, resolved 40-character lowercase commit `revision`, safe
single-component `filename`, positive `bytes`, lowercase 64-character `sha256`).
The HTTPS URL is derived from those fields; IPC accepts no URL or pin override.
The historical `model_artifact.rs` identity is for the existing evaluation runtime,
not the downloader's configuration. Selecting and integrating the shipping model
and its real transfer remain separate work.

## Native and frontend boundary

- `download_model({requestId})` returns `{ok:true,result:{path}}` only for a verified
  file, or `{ok:false,error:{code,message}}`.
- `model-download-progress` emits `{requestId,bytes,total,bytesPerSecond}`; rate is
  the average since request start. Subscribe before invocation. Progress is not a
  completion signal; only the command response supplies a verified path.
- `cancel_model_download({requestId})` signals the matching active request. The
  download command settles after the socket is dropped and the temporary file is
  removed. Cancellation while connecting or waiting for a body chunk is immediate.
- `model_cache_state()` rehashes the selected cache and returns `{path:null}` after
  deleting a corrupt file. An unset pin returns `invalid-pin`.
- `src/lib/model-download.ts` handles subscription lifetime, request IDs and early
  cancellation races. Storage controls can consume this adapter. This slice adds
  commands, not a new settings screen or a selected-model loader.

Errors: `invalid-pin`, `no-network` (including interrupted transfer/timeouts),
`http-error`, `hash-mismatch` (including wrong length), `disk-full`,
`permission-denied`, `cancelled`, `busy`, `io-error`.

## Cache and recovery

Storage is Tauri's platform app-data directory under `models/`. Names are derived
from the pinned hash: `<sha256>.part` becomes `<sha256>.gguf` only after byte-count
and SHA-256 checks, flushing and syncing. The move stays within one filesystem;
Unix additionally syncs the parent directory. A failed transfer closes and removes
its partial. Startup removes stale hash-named partials, even with the pin unset.
A crash is recovered by restarting, not by resuming untrusted bytes.

A process-local reservation plus an OS file lock protects transfers, inspections
and recovery from each other and from another running app instance. The lock file
is kept in place; process death releases the lock. Free space must cover the full
artifact plus 16 MiB before HTTP starts; actual write/sync failures are still
classified because another process can consume disk space after that check.

Dependencies added: `reqwest` with Rustls for HTTPS and cancellable streamed HTTP,
`tokio` for async file IO and cancellation signals, and `fs2` for cross-platform
free-space checks and process locks. SHA-256 uses the existing `sha2` dependency.

## Reproduce without a model

```sh
python3 reference/downloader/generate.py /path/to/disposable-output
cargo test --locked --manifest-path src-tauri/Cargo.toml --lib model_download
npm test
npm run validate:content
```

The fixture pin's revision is the commit that introduced `generate.py`. Only the
generator and pin are committed; tests generate the same bytes in memory and serve
them on ephemeral loopback sockets. The correct and wrong files both have 1,048,576
bytes. Tests cover successful atomic publication and progress, same-length hash
mismatch, socket interruption and retry, cancellation of a stalled body (including
server-observed socket close), stale partial recovery, corrupt cache rejection,
missing pin fields, disk-space refusal, HTTP/network errors and concurrent locks.

On this host, native builds need `BINDGEN_EXTRA_CLANG_ARGS=-I/usr/lib/clang/22/include`
and a CMake executable on PATH (or `CMAKE` pointing to it). These are host toolchain
settings, not source changes. No model transfer or desktop UI observation is
claimed by these fixture tests.
