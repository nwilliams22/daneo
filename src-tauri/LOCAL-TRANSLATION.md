# Local translation command contract

`translate_local({ requestId, input })`, `cancel_local({ requestId })`, and
`local_translation_state()` are registered Tauri commands. Frontend callers use
`localTranslator` in `src/features/explore/local-api.ts`, which returns the existing
`TranslateOutcome` and validates every success using `translationResultSchema`.
The raw native envelope contains JSON, not a second Rust translation schema.
Do not render or save raw `invoke` output without the adapter's zod validation.
Explore controls are a separate slice; the current screen still calls HTTP.

Set `DANEO_MODEL_PATH` to the developer-provisioned GGUF before starting Tauri.
The fallback is `.local-models/<pinned filename>` relative to the process working
directory. Artifact identity is shared with the compatibility example in
`src/model_artifact.rs`. No model download or HTTP fallback occurs here.

Give every request a fresh UUID. Up to eight requests may be outstanding; duplicate
active IDs and a full queue return `busy`. The blocking pool holds at most eight
jobs, and a mutex serializes the complete backend/model/context lifetime.
Cancellation flags belong to individual requests, including queued requests.
The adapter suppresses cancelled replies and unrelated events. Its cancellation
retry on a late progress event covers cancel arriving before native registration.

`local-translation-progress` carries `{requestId,state,outputTokens}`. There is no
partial text and no completion event. Only the command reply can complete a
request. Resources drop before the next worker gets the mutex, including after
errors, cancellation, or a caught Rust unwind. Native aborts and OS kills cannot
be caught. Cancellation checkpoints run during hash reads, between 256-token
prefill batches, and between generated tokens; a model-load call or single decode
must return before the worker can release resources.

State starts `absent` (no verified model yet), then `loading`, `ready` after verified
load, and `generating`. After success it returns to `ready`; after cancellation it
returns to `ready` only if that load completed, otherwise `absent`. Missing files
set `absent`; other failures set `error` with a typed error. `ready` means the
artifact was usable, not that weights remain resident: this v0 frees weights on
every request and re-verifies on the next load. There is no downloading state.

The prompt string in `src/lib/translation-prompt.json` is the single source read
by `server/prompts/translate.ts` and Rust. Wording is unchanged. The only local
rendering difference is wrapping it in the GGUF's embedded chat template with
`enable_thinking=false` through MiniJinja, as in the compatibility gate.
`@tauri-apps/api` provides the official IPC client; the existing MiniJinja crates
move from development to runtime dependencies. No learner-data shape changes.

## Verification

From the repo root, with native prerequisites from `examples/README.md`:

```sh
npm test
npm run validate:content
npm run build
cargo test --locked --release --manifest-path src-tauri/Cargo.toml --lib local_translation
DANEO_MODEL_PATH="$PWD/.local-models/Qwen3.5-4B-Q4_K_M.gguf" \
  cargo test --locked --release --manifest-path src-tauri/Cargo.toml --lib \
  real_model_cancel_allocation_failure_then_success -- --ignored --nocapture
```

CI runs the deterministic native tests, registered Tauri IPC handler test, and
frontend tests without weights. The opt-in real-model test injects an allocation
failure at context creation after loading actual weights, then cancels a water
request at its first output token and immediately reserves a greeting request.
It asserts that the second result contains `안녕` and `hello`, rather than a water
translation. Set `DANEO_TEST_RESULT_PATH` to capture its final JSON envelope for
an additional run through the shared zod parser.

Allocation fault injection proves error handling and cleanup, **not survival of
an OS OOM kill**. The binding exposes generic null failures, not a reliable cause
for every native allocation; context creation failures use `allocation-failed`,
while model loading failures use `model-corrupt`. These are recoverable returned
errors, not a promise that all native or allocator failures can be intercepted.
The small greeting is a lifecycle check, not the ten-item language qualification.
No browser or device UI verification is claimed.
