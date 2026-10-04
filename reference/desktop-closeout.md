# Desktop closeout checkpoint — 2026-10-04

**Not shipped.** This checkpoint records the tree at `ef4e0cd`; it is not a release
or a substitute for running the packaged application.

## Evidence recorded in this attempt

From the repository root:

| Check | Observed result |
| --- | --- |
| `npm test` | 236 passed, 20 test files |
| `npm run validate:content` | 15 passed |
| `npm run build` | Exit 0; existing large-chunk warning |
| `npm run tauri:build` | Exit 1 before compilation; unable to launch `cargo metadata --no-deps --format-version 1`, os error 2 |
| Direct installed Cargo with `metadata --no-deps --format-version 1 --manifest-path src-tauri/Cargo.toml` | Exit 0; toolchain exists |
| `DISPLAY`, `WAYLAND_DISPLAY`, `command -v Xvfb` | No display variables or Xvfb available |
| `reference/model-pin.json` | `pin: null`; no production model selected |

The build failure persisted with the installed stable Rust toolchain explicitly on
PATH and `BINDGEN_EXTRA_CLANG_ARGS=-I/usr/lib/clang/22/include`. It also persisted
outside the initial restricted execution. Its cause is not established; do not
patch application code merely to suppress it.

The generated `dist/assets/index-BrF6yHLU.js` contains **zero** occurrences of each
of `127.0.0.1:8787`, `/api/translate`, `claude-sonnet`, and `Cloud · dev`. Recheck the
current `index-*.js` after each build. `ExplorePage.tsx` gates both cloud selection
and cloud invocation with `import.meta.env.DEV`; Local is the initial engine.
These observations support the production gate but do **not** prove packaged
no-network execution. No server was started for these checks.

## Artifact and model sizes

No AppImage/rpm was produced by this attempt, so installer bytes, installed bytes,
launch screenshot and packaged inference measurements are **unavailable**.
The compatibility candidate's declared size is **2,740,937,888 bytes** in
`src-tauri/src/model_artifact.rs`; it is not a production selection or a measurement
of an installer. Weights must remain a post-install download. Do not build a second
installer containing the weights just to report a “with model” size: report the
installer, installed app, verified cache and their combined disk footprint separately.

## Required completion evidence

1. Complete independent model selection and set all production pin fields; perform
   the real hash-verified download. A developer-provisioned candidate alone does
   not prove the installer's first-run path.
2. Run `npm run tauri:build` successfully with no acceptance feature and retain the
   command log, source commit, artifact SHA-256, path and byte count. Inspect the
   archive to confirm that no GGUF, proxy or credentials are bundled.
3. On a usable Linux desktop, launch that exact AppImage/rpm in an isolated network
   namespace with a fresh synthetic learner profile and the verified model cache.
   Keep `server/` stopped; confirm no external interface/route is available. Do not
   disable the host's network or use personal learner data.
4. Inspect the engine controls, translate in both directions and save a result;
   ask the tutor a curriculum question, verify gated citations, and cancel a
   request. Capture the packaged window translating and answering. Confirm local
   failure reports an error without HTTP or cloud fallback.
5. Record model-cache bytes and combined installed footprint, then re-run the three
   green commands above. Update README, PROJECT status/architecture/Phase D, TASKS
   header/checklist/session log, PLAN-local-model, this report and the evaluation
   README against the final tree before marking Phase D shipped.

## Scope and recommendation

Retain `server/` and the Cloud adapter as a developer-only result-contract
comparison tool, off by default and absent from the production path. Keep the
`claude-sonnet-4-6` pin and never fall back to it. Deletion needs the owner's decision.

v1 training remains conditional on language evidence and is not completed by this
v2 checkpoint. Mobile v3 is a separate decision requiring devices; Phase C is out
of scope. Windows/macOS distribution remains Phase B, after these desktop gates.
