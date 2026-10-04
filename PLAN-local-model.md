# PLAN — Daneo local AI (translator + tutor, offline-first)

> Owner: Nick. Design refresh: **2026-10-03**. Owner constraint added **2026-10-04**.
> Implementation has not started.
> PROJECT.md governs pedagogy; TASKS.md is the app checklist/session record.
> Desktop comes first. **The local model is the engine, not an option**; mobile is a
> separate v3 release.
>
> Revision: replaces the 2026-08-24 plan after the six content-review passes
> reported. Nick's 2026-09-30 order is content review → local AI → sharing.
> The dates are about six weeks apart, not thirteen months. Model age is checked
> against publisher records, not inferred from the date of the old plan.

## Owner constraint — free to use, local by default (2026-10-04)

Nick's instruction: *"I do not want a paid model to be the one used in Daneo. I
want a free, local model such as qwen to be the one used so that it's free to use
the app as a whole. we can train the model on daneo specific things or whatever is
needed to make it the best possible model for the app."*

This is a product constraint, and it changes four things the rest of this plan
assumed. Where the text below still reads as though the cloud path were the
baseline, this section governs.

1. **Local is the default and the shipped path.** The Qwen GGUF engine is what
   Explore and the tutor use. A user who installs Daneo and never signs up for
   anything gets the full feature set. No API key, no account, no network.
2. **The cloud adapter is a developer comparison tool, not a product feature.**
   It stays in the tree because a second opinion is useful while qualifying local
   output, and because deleting a working typed adapter mid-spike loses the only
   reference implementation of the contract. It is **off by default, absent from
   any build given to another person, and never a fallback.** Automatic
   cloud fallback and an "Auto" engine policy are **cancelled**, not deferred —
   a silent fallback is exactly the paid dependency this constraint removes.
3. **No hosted paid proxy.** Phase B cannot be "deploy the static build plus the
   Claude proxy": that is a monthly bill and Nick's key in front of other people's
   usage. What sharing becomes instead is an open owner decision (BAD-194).
4. **Training is authorized and it is free on this hardware.** Verified on the
   build host 2026-10-04: **NVIDIA RTX 5090, 32,607 MiB VRAM**, Ryzen 7 9850X3D,
   60 GB system RAM. A QLoRA fine-tune of a 4B model fits in that VRAM with room
   to spare, so v1 training needs no cloud GPU and no spend. The old "hardware,
   cost and schedule require a separate decision" line is answered for 4B-class
   work: the decision is evidence (does error analysis justify it), not money.

**The consequence for the acceptance gate is the part worth reading twice.** The
v0 gate was written when a paid model was available as a fallback, so "model
unsuitable" was a survivable outcome. It is not any more — there is nothing behind
it. A failing gate now escalates **inside** the local track: a larger quantization,
the runner-up model, a larger parameter class for desktop, then prompt work, then
training. "Ship the cloud model instead" is no longer an option, and
"stop Phase D" would mean shipping Daneo with no translator at all. The gate's
thresholds do not relax to accommodate this — a local model that reverses meaning
still fails. The response to failure changes, not the bar.

The same logic retires the "acceptable vs Claude" framing. The rubric in
*Exit evidence* is linguistic and absolute: correct meaning, correct particles,
correct register, honest literal-gap claims, judged against the curriculum and
dictionary references. Cloud output may be recorded alongside as a convenience.
Where a stronger second opinion is wanted, this box can run a much larger GGUF
locally than the one being shipped — the 32 GB card comfortably holds a
30B-class Q4 reference model — so even the reference baseline costs nothing.

## Decision audit

Every prior commitment is classified below. “Needs re-picking” records both the
old assumption and its replacement; it does not imply implementation approval.

| Prior decision or assumption | Disposition | Refreshed decision |
|---|---|---|
| Optional offline translator, then a Daneo tutor | **Still stands** | Translator proves the runtime before tutor work. |
| Desktop is the final feature and must wait for all core/sharing work (decision 3) | **Dead** | The review-report gate is met; scope the v0 implementation next. |
| Re-evaluate the base at start (decision 3) | **Still stands** | This revision performs the source review; v0 decides fitness from actual output. |
| In-process Rust + llama.cpp, no sidecar (decision 1) | **Still stands** | Use the `llama-cpp-2` binding candidate; pin/test its bundled llama.cpp in v0. |
| Candle or an HTTP sidecar as interchangeable spike alternatives | **Dead** | Do not introduce a second engine or local server in this spike. |
| GGUF and Hugging Face distribution (decision 2) | **Still stands** | Pin repository revision, filename, bytes and SHA-256 before any future download. |
| Qwen3-4B standard / Llama-3.2-3B Lite | **Needs re-picking** | Qwen3.5-4B standard / Qwen3.5-2B Lite candidate; see evidence below. |
| Q4_K_M, approximately 2.5–3 GB | **Still stands** for standard | Selected 4B file is 2.74 GB; Lite is 1.28 GB. Disk bytes are not RAM requirements. |
| 4B is fine on phones, 15–30 tokens/s; 3B fits low-end Android | **Dead** | No device or speed evidence exists here. Measure desktop first; no mobile minimum promised. |
| Optional post-install model in app storage, never in installer | **Still stands** | v0 uses a developer-provisioned verified file; production downloader belongs to v2. |
| Model-neutral frontend contract, LocalLlama / CloudClaude | **Still stands** | Preserve existing typed translation result and errors; refine lifecycle below. |
| v0 streaming, cancel, OOM, prompt parity and Explore toggle | **Still stands** | Local default, Cloud as a developer comparison; **Auto is cancelled** (owner constraint). |
| “Acceptable vs Claude” on ten held-out sentences | **Dead as a comparison** | Fixed inputs, an **absolute** linguistic rubric and explicit pass counts below. There is no paid baseline to be acceptable against. |
| Corpus is already sufficient to self-distill an in-character tutor | **Dead** | Content is source material, not evidence of training quality or reliable behavior. |
| v1 dataset extraction, 500–5000 synthetic examples, ~60 held-out items | **Needs re-picking** | Freeze held-out data before training; synthetic volume follows error analysis, not a quota. |
| QLoRA on the same 4B, one GPU, hours; Unsloth/LLaMA-Factory | **Still stands** | Authorized by Nick 2026-10-04 and free here: RTX 5090, 32 GB VRAM. Tool choice and schedule follow the v0 error analysis; **no spend decision is outstanding**. |
| Compare fine-tuned and prompted base; retain the better | **Still stands** | No training if prompting already clears the acceptance gate — an evidence test, not a budget one. |
| v2 commands, download/progress/hash/cache/idle unload, settings, docs, no-network tests | **Still stands** | Translation and cancellation first; chat/lifecycle commands follow in their own slices. |
| Automatic cloud fallback and “local = fast / cloud = deep” | **Dead** | Cancelled by the owner constraint. No automatic fallback, no Auto policy, consent-gated or otherwise. |
| Tutor reads known words, due cards, progress and misses | **Still stands** | Read-only learning/app context first. Validate any generated drill vocabulary in code. |
| Preserve existing Claude proxy, no port on local path | **Still stands, demoted** | Kept as a developer comparison tool only. The cloud upgrade below is **parked** — see the note there. |
| Mobile v3, Swift first/Kotlin second, native inference, stores/signing, real-device heat tests | **Needs re-picking** | Keep separate-release boundary; choose platform order and native bridge when devices exist. |
| “Tauri mobile via Capacitor” and ANE/Metal as one backend | **Dead** | These are separate integration/backend choices, not an established architecture in this repo. |
| Same model pair/prompt/UI on mobile | **Needs re-picking** | Reuse the result contract; decide mobile model, RAM cutoff and UI after device measurements. |

## Model choice and evidence

**Select Qwen3.5-4B for the desktop spike; select Qwen3.5-2B as the Lite
candidate, with promotion conditional on the same Korean evaluation.** This is
an engineering selection, not a claim that either outperforms the alternatives
on Daneo. No weights were downloaded and no inference was run for this refresh.

Qwen's [4B card](https://huggingface.co/Qwen/Qwen3.5-4B) identifies a post-trained
4B language model, Apache-2.0 weights, hybrid attention/DeltaNet architecture and
thinking enabled by default. Use text only and explicitly disable thinking via
the model's chat template for JSON translation. The [2B card](https://huggingface.co/Qwen/Qwen3.5-2B)
provides the smaller same-family candidate. Qwen's [language coverage](https://qwen.ai/blog?id=qwen3.5)
explicitly includes Korean. Coverage is a reason to test, not proof of correct
particles, romanization or gloss alignment.

| Candidate | Available artifact / evidence checked 2026-10-03 | Decision and tradeoff |
|---|---|---|
| Qwen3.5-4B | [Unsloth file listing](https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/tree/main): `Qwen3.5-4B-Q4_K_M.gguf`, 2.74 GB | Primary: fits the intended standard download envelope and shares a runtime/template family with Lite. Unsloth is the quantization publisher, not Qwen; pin and verify its artifact. |
| Qwen3.5-2B | [Unsloth file listing](https://huggingface.co/unsloth/Qwen3.5-2B-GGUF/tree/main): `Qwen3.5-2B-Q4_K_M.gguf`, 1.28 GB | Lite candidate: smaller download than the old 3B proposal; Korean quality and working RAM remain open. |
| Qwen3-4B-Instruct-2507 | [Publisher card](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507); [GGUF publisher](https://huggingface.co/mradermacher/Qwen3-4B-Instruct-2507-GGUF) lists Q4_K_M | Standard runner-up and compatibility fallback: non-thinking text model is simpler. Loses the first slot to the newer same-family standard/Lite pair; this is integration judgment, not a measured quality win. If hybrid-model binding support fails, evaluate this before changing engines. |
| Gemma 4 E2B / E4B | [Google card](https://huggingface.co/google/gemma-4-E2B-it) distinguishes effective from total parameters: E2B 5.1B including embeddings, E4B 8B. [Official E2B GGUF](https://huggingface.co/google/gemma-4-E2B-it-qat-q4_0-gguf/tree/main): `gemma-4-E2B_q4_0-it.gguf`, 3.35 GB without projector | Current multilingual alternative, but effective parameter labels do not mean a 2B/4B download. E2B alone exceeds the selected standard file; neither wins the small-download objective. |
| EXAONE 3.5 2.4B / EXAONE 4.0 1.2B | [2.4B card](https://huggingface.co/LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct), [official 2.4B GGUF](https://huggingface.co/LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct-GGUF/tree/main), [official 1.2B GGUF/card](https://huggingface.co/LGAI-EXAONE/EXAONE-4.0-1.2B-GGUF) | Explicit Korean-oriented alternatives. Cards carry EXAONE NC licenses, unlike the selected Apache-2.0 pair. Keep as eval alternatives; do not make a restricted-license family the default distribution/training path. |
| Llama-3.2-3B-Instruct | [Meta card](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct) lists eight officially supported languages; Korean is absent | Retire as Lite default. This does not mean it cannot produce Korean; it lacks the publisher support signal wanted for this task. |

The [Qwen catalog](https://huggingface.co/Qwen/collections) and current model
listings also contain later large families. A model with 3B active experts is
not a 3B total-weight download. No later small general-purpose replacement was
verified in this review; do not invent a 3.8-4B identifier from the family name.

The [Rust binding repository](https://github.com/utilityai/llama-cpp-rs) publishes
`llama-cpp-2` and warns that its versioning does not meaningfully follow semver.
Keep the in-process decision, but confirm actual GGUF architecture, template,
non-thinking mode, sampler and cancellation support in the pinned build. GGUF
availability alone does not establish compatibility with any older binding.

## Cloud engine check (parked 2026-10-04)

**The upgrade described here is parked and nobody should perform it.** The owner
constraint above makes the cloud adapter a developer tool, so moving its pin is
work on a path the product does not ship. The analysis stays on record because it
is correct and because it documents why the pin must not be changed casually.
`server/index.ts` keeps `claude-sonnet-4-6`.

The current published Sonnet identifier is **`claude-sonnet-5-5`** in
[Anthropic's model overview](https://platform.claude.com/docs/en/models/overview).
It is the proposed upgrade target. **Keep `claude-sonnet-4-6` in
`server/index.ts` in this ticket.** A one-line replacement is not established as
safe: the [migration guide](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide)
says requests without a thinking field now enable thinking, and `max_tokens`
covers thinking plus text. It also reports a tokenizer change. The current
request omits thinking and caps output at 1,024 tokens, so a swap risks truncating
the JSON. Its text-block filtering already handles mixed block types correctly.

A subsequent upgrade must test the documented `thinking: {type: "between_tools"}`
setting for this no-tools request, review the token cap and installed SDK types,
and run the fixed translation set through the real API with zero truncations
and schema failures. No live cloud call or paid evaluation occurred here.
This check is complete; keeping the pin is intentional, not a claim it is latest.

## Contract and lifecycle

The existing contract lives in `src/lib/schemas.ts`, `src/types.ts`,
`server/prompts/translate.ts` and `src/features/explore/api.ts`. The plan's old
Rust/TypeScript mixed trait was conceptual, not compilable code. Keep one typed
translation result and error envelope across engines. Final local JSON must pass
the same parser/schema before rendering or saving; partial token events are
progress only. No learner database migration is required for v0.

Local state must distinguish absent, loading, ready, generating and error;
downloading arrives with v2. Identify requests so cancel and late events cannot
complete the next request. Serialize inference off the UI thread and release
resources after cancellation/error. **Local is the default engine and stays
local.** Cloud uses the existing proxy, is selected only by an explicit
developer action, and never receives a request because Local failed. There is no
Auto setting.

## v0 — One desktop translation spike

Build one Linux Tauri path that loads a developer-provisioned, hash-verified
Qwen3.5-4B Q4_K_M file in process through a pinned `llama-cpp-2`, translates a
short English or Korean input using the existing prompt/result contract, streams
request-scoped progress, supports cancel, and renders only validated final JSON
in Explore behind a Local/Cloud switch with load/error state. Start with a bounded
4,096-token context and 1,024-token output cap as test settings, not proven limits.
Record hardware, versions, artifact hash, peak RAM, cold load, time to first token
and completion time; run the ten-item Korean gate below, plus missing/corrupt
file, cancellation, controlled allocation failure and proxy-offline cases.
The switch defaults to Local. The spike excludes a production downloader,
chat/tutor, fine-tuning, mobile and a sidecar; Auto no longer exists to exclude.
It may conclude “this model/runtime is unsuitable” with measured evidence — which
under the owner constraint means escalating within the local track (larger quant,
runner-up model, larger parameter class, prompt work, training), not reaching for
the cloud.

### Exit evidence

- Freeze ten corpus sentence IDs and exact inputs before prompt tuning: five
  English→Korean and five Korean→English, spanning particles, polite endings,
  negation, omitted subjects and literal gaps. Keep them out of future training.
  Record the corpus commit; curriculum examples and dictionary references settle
  meaning. Cloud responses are a comparison, not ground truth.
- Require **10/10 schema-valid, complete replies**, correct direction, and no
  leaked thinking text. A linguistic reviewer scores meaning, Korean word-order
  gloss, particle roles, polite register, romanization and literal-gap claims.
  Require **at least 9/10 fully correct items and zero meaning reversals or
  invented grammatical/cultural rules**. These are proposed acceptance thresholds,
  not observed results. Keep every raw result and per-item verdict.
- Record three warm runs per item plus one cold start on a named desktop.
  Proposed usability gate: warm p95 completion ≤30 seconds, cancel acknowledged
  ≤1 second with no late saved result, and no process crash on controlled failure.
  Report measured peak RAM before setting any supported-memory minimum.
- Demonstrate a real Tauri translation with the proxy stopped/network unavailable,
  a cancel followed by a successful request, and a typed missing/corrupt-model
  error. Allocation fault injection proves error handling, not survival of an OS
  OOM kill. In-process inference cannot promise isolation from that kill.
- Re-run `npm test -- tests/translator.contract.test.ts`, add focused native/IPC
  tests during implementation, and run `npm run validate:content`. Browser mocks
  alone do not establish native inference. If no usable desktop session exists,
  runtime acceptance remains unverified and needs a named person with that host.

### Estimate and next scope

Scope analysis: `src-tauri/src/lib.rs` currently only initializes Tauri/logging;
`Cargo.toml` has no inference dependency or custom commands. The frontend has one
HTTP translation adapter and Explore page, a shared schema/type surface, one
prompt/parser and a six-test translator contract suite. The native runtime,
request lifecycle and frontend IPC adapter are new work, not wiring an existing
engine. Expected footprint: roughly 8–12 implementation/test/config files, plus
evaluation fixtures and documentation; no stored data-shape change.

**Planning estimate: 4–7 engineering days**, conditional on a compatible binding
and an available Linux desktop, plus an independent Korean/runtime review slot.
Allow 1–2 days for pinned build/model load, 1–2 for IPC/cancel/errors, 1 for Explore
integration, and 1–2 for evaluation and fixes. This is a scope-based estimate, not
a measured throughput promise. Stop after the first compatibility slice if it
cannot load/generate; report the exact failure and reassess the runner-up. Lite
qualification adds approximately 1–2 days after standard passes; production
lifecycle, training and mobile are excluded. No GPU or cloud spend is assumed.

Next: review this design and scope the v0 implementation from the paragraph and
exit evidence above. This refresh does not create or authorize implementation
children.

## Later phases and limits

**v1 (conditional on evidence, authorized on cost):** build a versioned dataset
from reviewed content, reserve ~60 independent evaluation items, compare prompting
with a fine-tune when v0 errors justify training. `validate:content` validates
shipped content, not arbitrary synthetic translations: use the translator schema
and linguistic review for those. Training runs on the build host's RTX 5090, so
confirm tool support for the chosen architecture and a GGUF export/requantization
path — those are the compatibility risks, not the budget. The trained artifact must
ship the same way the base does: a verified GGUF a user downloads once.

**v2 (desktop shipping):** model download/progress/hash verification, atomic cache
and recovery, idle unload, settings/storage controls, contract parity and
no-network tests, then read-only “Ask Daneo” context and tutor UI. There is no
fallback-consent surface to build; the engine is local.
Enforce known-word gating in code for generated drills; Explore remains the
unrestricted curiosity path. Update README, PROJECT and TASKS when shipped.

**v3 (separate mobile decision):** choose Tauri mobile or another wrapper,
inference bridge and platform order based on actual build/device evidence.
Measure memory, heat, battery and latency on real devices before promising a
model tier; signing and store publication need their own approval and scope.

Small models may hallucinate. Training does not guarantee an in-character tutor;
local inference does not guarantee speed. Download integrity, app responsiveness
and correct Korean all remain acceptance work, not benefits established by this
plan refresh.
