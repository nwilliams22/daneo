# 단어 Daneo — word-first Korean learning

A desktop app (Tauri 2 + React) that teaches Korean the opposite way from Duolingo: **words first → minimal grammatical "glue" → sentences built only from words you already know.** You are never shown a sentence containing a word you haven't marked as learned — that rule is enforced in code, not just content.

**Docs:** [`PROJECT.md`](PROJECT.md) is the source of truth (vision, pedagogy rules, data model, roadmap). [`TASKS.md`](TASKS.md) is the build checklist, discovered-work log, and per-session log. The `*.jsx` / extra `*.md` files at the repo root are the original design prototypes, kept as reference only.

## Status (2026-08-01)

Phases **A.0 (scaffold) and A.1 (drills)** are complete, plus several extras. Working today:

- **Learn** — Module 1 (37-word interactive checklist, grammar, 14 three-layer sentences that unlock when the checklist is done) and the Hangul history reading. Collapsible alphabet section based on onboarding placement.
- **Drill** — five drills: confusables (same-group distractors), cross-font reading (Gothic/Myeongjo/handwriting), sentence anatomy (tap-to-trace + arrange), literal-vs-real, and typing on an **in-app 2-beolsik keyboard** with a fully tested Hangul composition engine (no OS Korean IME needed).
- **Review** — union of everything whose latest answer was wrong, re-drillable per kind; items clear when answered correctly.
- **Stats** — words learned, accuracy (all-time/7-day), per-confusable-group bars, weakest items.
- **Settings** — romanization hide (global), light/dark "paper" themes, Korean TTS voice status + rate, JSON backup/restore.

Not built yet: spaced repetition (A.2), the AI curiosity translator + cross-font difficulty toggle (A.3), Module 2 content (A.4). The Explore tab is a stub until A.3.

## Commands

```bash
npm install            # once; desktop shell also needs Rust (rustup) + WebKitGTK dev libs
npm run dev            # browser dev server (fast iteration)
npm run tauri dev      # the real desktop window (WebKitGTK)
npm test               # full Vitest suite (62 tests)
npm run validate:content  # pedagogy-rule content validator (also runs inside `build`)
npm run build          # validate + typecheck + production bundle
npm run tauri:build    # desktop bundles (AppImage + rpm) — wraps NO_STRIP=true, see below
```

## Project layout

```
src/content/    words/sentences/confusables/gap/modules JSON + module markdown (::vocab:: / ::sentences:: markers)
src/lib/        pure logic, no DOM: schemas, content validator, gating, distractors, stats, hangul/ (composition engine)
src/db/         Dexie (IndexedDB) learner state + repo — knownWords, drillResults, srsCards*, savedTranslations*  (*reserved)
src/features/   learn / drills (engine + 5 drills) / review / dashboard / explore / settings / onboarding
src/theme/      design tokens (paper + night-paper palettes), theme hook
src/audio/      ko-KR speechSynthesis singleton + hook (no-voice is a designed state)
src-tauri/      Tauri 2 shell (no custom Rust beyond a Linux webview workaround)
tests/          content validation entry (backs validate:content)
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
