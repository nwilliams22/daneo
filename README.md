# 단어 Daneo — word-first Korean learning

A desktop app (Tauri 2 + React) that teaches Korean the opposite way from Duolingo: **words first → minimal grammatical "glue" → sentences built only from words you already know.** You are never shown a sentence containing a word you haven't marked as learned — that rule is enforced in code, not just content.

**Docs:** [`PROJECT.md`](PROJECT.md) is the source of truth (vision, pedagogy rules, data model, roadmap). [`TASKS.md`](TASKS.md) is the build checklist, discovered-work log, and per-session log. The `*.jsx` / extra `*.md` files at the repo root are the original design prototypes, kept as reference only.

## Status (2026-10-04)

Phase A and all 164 curriculum modules are complete. The content review is closed; local AI (Phase D) is implemented but not qualified for shipment. Working today:

- **Onboarding** — an adaptive **placement quiz** (letters → Module 1 words → sentences, early stop on a failed stage) that pre-checks whatever you prove: alphabet collapsed, Module 1 vocab marked known, romanization hidden. "Brand new" and "skip the quiz" paths remain.
- **Learn** — 164 modules and readings across three rings, word checklists, aligned sentences and module tests, gated by the known-word rule.
- **Drill** — five drills with study and quiz modes as separate routes: confusables **flashcards / quiz** (same-group distractors), cross-font reading (Gothic/Myeongjo/handwriting), sentence anatomy (tap-to-trace + arrange), literal-vs-real **browse / quiz**, and typing on an **in-app 2-beolsik keyboard** with a fully tested Hangul composition engine (no OS Korean IME needed). The quizzes have a **"Mixed fonts"** difficulty toggle with per-face accuracy tracking.
- **Review** — a spaced-repetition queue (**FSRS** via `ts-fsrs`): every graded answer anywhere feeds the scheduler, wrong answers come back within minutes, and the daily queue mixes due items from all drill kinds into one session. The missed-items strip from A.1 lives on the same page.
- **Explore** — the unrestricted curiosity translator uses the local model in the desktop app. A developer-only cloud comparison path remains off by default. Results save into a "Discovered" deck.
- **Ask Daneo** — a local tutor reads known words, due cards, progress and misses without writing learner state. Generated Korean is removed from the answer; cited Korean examples come only from unlocked curriculum sentences.
- **Stats** — words learned per module, review-queue counts, accuracy (all-time/7-day), per-confusable-group bars, weakest items, font fluency.
- **Settings** — local-model download/cache controls and idle unload (production download awaits a qualified pin), romanization hide (global), light/dark "paper" themes, Korean TTS voice status + rate, JSON backup/restore.

Phase D local-model qualification is active. The production model pin is still unset; see `PLAN-local-model.md` and `TASKS.md`. Desktop installers follow in Phase B.

## Commands

```bash
npm install            # once; desktop shell also needs Rust (rustup) + WebKitGTK dev libs
npm run dev            # browser dev server (fast iteration)
npm run server         # developer-only comparison proxy on :8787
npm run tauri dev      # the real desktop window (WebKitGTK)
npm test               # full Vitest suite
npm run validate:content  # pedagogy-rule content validator (also runs inside `build`)
npm run build          # validate + typecheck + production bundle
npm run tauri:build    # desktop bundles (AppImage + rpm) — wraps NO_STRIP=true, see below
```

**Local model setup:** Explore and Ask Daneo require the Tauri desktop app and a verified local GGUF. The production model artifact is not pinned yet, so the public download path remains unavailable until qualification. The optional `server/.env` proxy is only for development comparisons; it is never a shipped fallback.

**Offline boundary:** curriculum, drills, review and saved learner state are local. Explore and Ask Daneo need a verified model installed first; after that they use in-process inference without the proxy. The intended one-time download is in Settings, but is currently blocked by the unset production pin. Speech playback also needs an installed Korean system voice. No shipped feature is intended to require the developer proxy, an account or a paid API key. Packaged offline execution is still unverified; the latest build attempt and remaining gates are recorded in [`reference/desktop-closeout.md`](reference/desktop-closeout.md).

## Project layout

```
src/content/    words/sentences/confusables/gap/modules JSON + module markdown (::vocab:: / ::sentences:: markers)
src/lib/        pure logic, no DOM: schemas, content validator, gating, distractors, stats, srs (FSRS), discovered, hangul/
src/db/         Dexie (IndexedDB) learner state + repo — knownWords, drillResults, srsCards, savedTranslations
src/features/   learn / drills / review / dashboard / explore / tutor / settings / onboarding
src/theme/      design tokens (paper + night-paper palettes), theme hook
src/audio/      ko-KR speechSynthesis singleton + hook (no-voice is a designed state)
server/         developer-only comparison proxy (Hono + Anthropic SDK)
src-tauri/      Tauri 2 shell and in-process local-model runtime
tests/          content validation entry (backs validate:content) + translator contract tests
```

Everything in `src/lib/` is framework-free on purpose — it ports unchanged to Tauri's mobile targets later.

## The rules that make it different (PROJECT.md §1)

1. Sentences may only use learned words (validated at build time, gated at runtime).
2. Confusable drills draw distractors from the same confusable group — contrasts, never random.
3. Structure is taught via a 3-layer aligned gloss (English → English-in-Korean-order → Korean).
4. The literal/real meaning gap is a first-class concept.
5. Romanization is training wheels: always secondary, globally hideable.
6. Cross-font reading fluency is trained deliberately.

## Linux notes

- **AppImage packaging** requires `NO_STRIP=true` (linuxdeploy's bundled `strip` predates `.relr.dyn` ELF sections). `npm run tauri:build` sets it for you.
- **NVIDIA + Wayland**: WebKitGTK's DMA-BUF renderer crashes ("Error 71"); the app sets `WEBKIT_DISABLE_DMABUF_RENDERER=1` at startup automatically (your own env value wins if set).
- **Audio**: play buttons appear only if the system has a Korean speech voice; without one the app degrades gracefully (Settings shows the status).
