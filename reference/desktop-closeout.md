# Phase D documentation closeout — 2026-10-05

**Implemented, measured and not shipped.** Nick chose release one with AI off
while training continues. No candidate cleared the unchanged language gate and
[`model-pin.json`](model-pin.json) remains null. This closes the documentation
inventory, not the AI programme or the desktop release.

## What exists and what would turn it on

“Implemented” below means the component exists with the stated evidence; it does
not imply an accepted production model or packaged learner interaction. All AI
surfaces are excluded from the release-one frontend. The native runtime and
commands remain compiled; no claim of their removal from the binary is made.

| Component | Real state, value and source of truth | Remaining activation condition |
| --- | --- | --- |
| Native runtime | Implemented: in-process `llama-cpp-2` worker, verified model load, embedded template and typed errors in `src-tauri/src/local_translation/native.rs`. Real inference is recorded in [v0 results](eval/v0-results.md) and [head-to-head results](eval/head-to-head-results.md). Compatibility works; Korean quality has not qualified. | A trained artifact must clear the language/runtime gate, receive a complete production pin and pass packaged offline checks. |
| Request lifecycle and cancel | Implemented: serialized requests, request-scoped progress/cancellation and state in `src-tauri/src/local_translation.rs`, with frontend subscription cleanup in `src/features/explore/local-api.ts`. [v0 results](eval/v0-results.md) record real lifecycle/error/cancel observations. | Recheck with the selected artifact and packaged translator/tutor; prior candidate measurements do not establish future performance. |
| Downloader | Infrastructure implemented: immutable manifest identity, length/hash verification, atomic cache publication, space checks, cancellation and partial recovery. [Contract and fixture evidence](downloader/README.md), `src-tauri/src/model_download.rs` and its tests are authoritative. The null production pin refuses before IO. | Qualified pin plus a real measured hash-matching transfer and first-run verification; fixture transport is not that proof. No model download is needed for release one. |
| Storage and idle unload | Implemented: cache details/delete/download controls in `src/features/settings/ModelPanel.tsx`; idle unload/reload in `local_translation.rs`. Fixture/recovery checks live in `model_download/tests.rs`; frontend coverage in `tests/model-download.test.ts`. | Selected-model cache/lifecycle and delete/re-download checks in the packaged app. DEV-gated model settings must only return after qualification. |
| Explore switch and adapters | Implemented: Local default, explicit DEV-only Cloud comparison, shared schema, typed errors/cancel and save-to-deck in `src/features/explore/TranslatorPage.tsx`. Adapter parity coverage is in `tests/translator.parity.test.tsx`. Release `ExplorePage.tsx` shows saved discoveries and the absence notice. | Qualified local model, verified download and packaged offline translation with no fallback; release gate must be deliberately changed later. A populated pin cannot enable the current production UI. |
| Ask Daneo tutor | Implemented: read-only learner context, local requests/cancel, generated-Korean removal and gated curriculum citations under `src/features/tutor/`, covered by `tests/tutor.test.tsx`. Production route/navigation are omitted. | Qualified engine plus real packaged offline tutor/citation/cancel evidence on BAD-240; schema/render tests are not a quality or desktop sign-off. |
| Deterministic postprocessor | Implemented: romanization, noun-particle identity and gloss particle repair in `src/lib/translation-postprocess.ts`, shared by both adapters. [Romanization audit](eval/romanization-audit.md) and [development results](eval/deterministic-dev-after.md) retain the limits. | Retain and revalidate with the selected model; deterministic fields do not repair all model-owned meaning, gloss, register or literal-gap failures. |
| Evaluation harness | Implemented and exercised: native/desktop acceptance, raw replies, identity stamps, assembly, scoring and provenance checks under `reference/eval/`. [Engine decision](eval/engine-decision.md) settles the corrected language verdict. | Use the separate development split for iteration; keep v2 sealed for the final single gate run. Native probe RSS and timings are not packaged UI measurements. |
| Training pipeline | Implemented and run end to end: corpus-derived reviewed targets, QLoRA, merge, matched Q8_0 export and pinned-worker smoke in [v1 results](training/v1-results.md), backed by `training/evidence/v1/`. That candidate declined. Scaled data work is tracked in [dataset v2 review](training/dataset-v2-review.md) and [row verdicts](training/dataset-v2-review-report.md); candidates are not a frozen training authorization. | Finish reviewed dataset/manifest and frozen development split, retrain/export, then the sealed verdict and runtime checks on BAD-240. Pipeline success alone cannot enable AI. |

## What was measured, and why nothing ships

The successive language rungs declined: initial v0 **0/10**, prompt repair
**1/10**, deterministic v1 **2/10**, and the final prompted base and reviewed
fine-tune both **4/10**, against the unchanged **≥9/10** bar. The fine-tune had
one actor reversal. Sources: [v0](eval/v0-results.md),
[prompt repair](eval/v0-prompt-repair-results.md), [v1](eval/v1-results.md), and
[engine decision](eval/engine-decision.md), which incorporates the independent
re-score of the head-to-head report. The earlier base **3/10** in the first-pass
report is superseded by that corrected **4/10** verdict.

The training run used **27 reviewed rows** and **17.579 s** of training time;
its Q8_0 export was **4,610,579,744 bytes**. Those are recorded in
[training/v1-results.md](training/v1-results.md) and its linked machine evidence.
They prove a working training/export path, not a useful learner-facing engine.
The installer must carry no weights; a future model remains a separate verified
download. Release one needs neither a model nor a production pin.

## Build history and transferred verification

The 2026-10-04 closeout at `ef4e0cd` failed before compilation at Cargo metadata
discovery. That is historical, not the current packaging blocker: the later
[2026-10-05 TASKS session entry](../TASKS.md#2026-10-05--prepare-three-platform-desktop-bundles)
records successful Linux AppImage/rpm creation and the host wrapper/include-path
workaround. It explicitly does not establish installation or a running packaged
UI. No new package, screenshot, installed footprint or launch is claimed here.

- **BAD-234 → BAD-204 → BAD-205:** Phase B builds, installs and releases the AI-off
  desktop artifact. BAD-204 owns clean-machine offline use and the proof that the
  shipped build cannot reach a paid model. Retain artifact identity/size, resource
  inventory, launch evidence and network isolation there.
- **BAD-240:** the retrained-engine verdict owns future packaged Explore/tutor
  offline evidence, including no fallback and cancellation. Model selection and
  a real verified download must also finish before AI is enabled. Record cache
  bytes separately from installer/installed-app bytes, not as a weights-bundled
  installer.
- **BAD-191:** this documentation closeout requires reconciled documents, green
  content/build checks and successful CI for its pushed commit. It has no packaged
  build prerequisite and does not block Phase B on a model that has not qualified.

Production frontend exclusions are implemented by `import.meta.env.DEV` in
`src/App.tsx`, `src/components/AppShell.tsx`, Explore and Settings. The actual
production-bundle regression in `tests/release-features.test.tsx` checks that AI
modules/transports are omitted and non-AI modules remain. This is static/rendered
release evidence; it is not BAD-204's packaged network-isolation proof.

## Scope and cloud-adapter recommendation

Keep `server/` and the Cloud adapter as a DEV-gated comparison implementation of
the result contract: off by default, absent from the production frontend, never
a fallback. Keep `claude-sonnet-4-6` unchanged. Deleting it is Nick's decision.
No Phase D code is removed by this closeout.

v1 training is no longer merely conditional: it ran and its candidate declined;
scaled retraining remains separate work. Mobile v3 needs a separate decision and
device evidence. Phase C remains out of scope. See [PLAN-local-model.md](../PLAN-local-model.md)
for settled and still-open design decisions.
