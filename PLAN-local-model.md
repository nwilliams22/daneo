# PLAN — Daneo local AI model (translator + tutor, offline-first)

> Final-feature plan. Companion to PROJECT.md (source of truth for pedagogy) and
> TASKS.md (build checklist). Owner: Nick. Status: design, not yet started.
>
> **One-line decision:** desktop local model = the shipped "final feature";
> mobile = v3 (a separate Capacitor/native workstream, different release).
> The model is **optional in every install** — app works fully without it.

## Why
- Explore/translator currently needs network + Anthropic key (server/ proxy :8787).
- A local model removes that dependency for the daily path and (later) ships a
  Daneo-specific tutor that is *in-character by construction*, not by prompt.
- Daneo already has a genuine dataset: 1400+ words, 360+ sentences, gap/confusable
  content — rich enough to self-distill a small model.

## Model & size (mobile-informed decisions)
- **Primary: open-weights Qwen3-4B** (or Llama-3.2-3B as Lite). Q4_K_M GGUF ≈ 2.5–3 GB.
- **Fine-tune** (v1) targets the same 4B so a small model *narrows to the Daneo task*.
- **4B is fine on modern phones** (8–16 GB RAM, Apple A15+/M, Snapdragon 8 Gen),
  ~15–30 tok/s — acceptable for 100–300 token glosses/drill prompts.
- **Low-end Android** (4–6 GB RAM) → ship a **3B Lite** option.
- **Packaging (all platforms): model is an optional post-install download into
  app storage — never bundled in the installer/App Store.**
- **Engine: llama.cpp (GGUF)** primary on desktop; on mobile a native plugin
  (Swift/iOS first for ANE/Metal + one test platform, Kotlin/Android after).
  Fallback engine: the existing Claude proxy (CloudClaude).

## LocalEngine contract (frontend-agnostic)
```
trait LocalEngine {
  translate(TranslateRequest) -> TranslateResult      // zod contract from server/
  chat(ChatRequest, onToken: callback)                 // streaming (Tauri events)
  state() -> ModelState                                 // not-loaded|downloading|ready|error
  ensureModel(quant: "q4_k_m"|"lite") -> Promise<ModelState>   // optional download
}
implementations: LocalLlama (llama.cpp)              | CloudClaude (existing server/ proxy)
```
Frontend never knows which engine is active. Settings picks one.

## Phases

### v0 — Local engine, off-the-shelf model (proves pipe, days, no training)
- [ ] Spike: get llama.cpp generating from Qwen3-4B GGUF inside Tauri backend
      (Rust crate `llama-cpp-rs`/`candle`, or sidecar binary speaking HTTP).
- [ ] Verify streaming over IPC (Tauri events) + cancel + OOM path (low-RAM host).
- [ ] Reuse the exact zod gloss contract from `server/prompts/translate.ts` as prompt.
- [ ] Explore UI: engine toggle (Local / Cloud / Auto), model load state, offline note.
- [ ] **Exit criterion:** gloss quality on 10 held-out Daneo sentences acceptable vs Claude.
  → de-risks engine+IPC+UI before any training spend.

### v1 — Daneo fine-tune (differentiator; one-time dev cost)
- [ ] Dataset builder: mine `src/content/` (words/sentences/gap/confusables) →
      (instruction→response) SFT JSONL pairs.
- [ ] Self-distill remainder: pipe 500–5000 KO sentences through Claude/27B with the
      translator prompt; save outputs; filter with `validate:content`.
- [ ] Held-out eval set (~60 Daneo sentences) + scorer.
- [ ] QLoRA fine-tune Qwen3-4B (Unsloth/LLaMA-Factory), one GPU, hours. Export GGUF Q4_K_M.
- [ ] Eval before/after; keep the better of {open-weights+prompt, fine-tuned}.
- **Exit criterion:** fine-tuned 4B gloss format/pedagogy matches Claude within margin
  on the eval set; no regressions (no memorized-wrapper-only behavior).

### v2 — Ship the feature (desktop)
- [ ] Tauri command surface: `daneo_translate`, `daneo_chat` (streaming),
      `daneo_model_state`, `daneo_model_ensure`.
- [ ] Model lifecycle: download (progress) → verify sha256 → cache in app data dir →
      load → release on idle. Re-download on version bump.
- [ ] Settings: engine (Auto/Local/Cloud), model size (std/lite), storage used,
      clear/cache, "you're offline — local only" state.
- [ ] Explore: route glosses per engine; auto-fallback Cloud if local model not loaded.
- [ ] Assistant: "Ask Daneo" tutor — inject context (knownWords, SRS due, module
      progress, latest missed items). Scope: learning help + app help + Korean Q&A.
      Honest UX: **local = fast glosses/drills; cloud = open deep-questions.**
- [ ] Keep server/ Claude proxy as the Cloud engine (no rewrite) — it just becomes one
      engine behind LocalEngine, no local port required for the local path.
- [ ] Tests: contract parity Local vs Cloud on eval set; no-network smoke (kill proxy).
- [ ] Docs: README "Local model" section; PROJECT.md feature note; TASKS.md phase.

### v3 — Mobile (separate release; NOT part of v2)
- [ ] Tauri mobile via Capacitor wrapper (confirm build/config vs current Linux-only).
- [ ] Native inference plugin: **Swift/iOS first** (llama.cpp arm64, ANE/Metal),
      Kotlin/Android second. (No trusted off-the-shelf plugin — budget plugin work.)
- [ ] Optional model download to app storage; min-device/RAM cutoff; battery+heat test
      on real iPhone + Android.
- [ ] Code signing, App Store + Play Store listings, review.
- [ ] Mobile model: 4B std / 3B Lite; same GGUF, same prompt contract, same UI.

## Risks / honest limits
- **4B won't beat Claude on open-ended Korean.** Scope it to the narrow Daneo task
  (gloss, tutor, drill gen). Don't market as "offline Claude."
- **Training quality risk:** mitigate with v0 (off-the-shelf first) + eval gate in v1.
- **Mobile plugin maturity:** the real cost of v3 is writing/maintaining the native
  plugin, stores, and signing — not the model.
- **App size/distribution:** model is always optional download; installer stays small.

## Decisions (2026-08-24, Nick)
1. **Engine:** in-process Rust crate (llama-cpp-rs/candle) — not a sidecar binary.
2. **Model distribution:** HuggingFace (CDN), not self-hosted.
3. **Timing:** DEFERRED — this entire feature (v0–v3) is the final feature and waits
   until Daneo's core features are complete. Do not start v0 early. Base model choice
   (Qwen3-4B vs alternate/Llama-3.2-3B Lite) re-evaluated at start, since options move.

## Next action
**BLOCKED until Daneo core features are complete.** When unblocked: start the v0
spike (in-process llama.cpp crate + streamed `daneo_translate`) — that slice proves
the whole pipeline before any training cost is spent.
