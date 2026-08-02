# TASKS.md — Daneo build checklist

> Companion to PROJECT.md. Check items off as completed; add discovered work under the matching phase with a date stamp. Append a session log entry at the bottom after each Claude Code session.

## Phase A.0 — Scaffold
- [x] `npm create vite@latest` (react-ts), add Tailwind, Zustand, Dexie, Vitest, zod
- [x] Theme tokens from PROJECT.md §2 palette (Tailwind config) + font loading (Noto Sans KR / Noto Serif KR / Nanum Pen Script, OS fallbacks)
- [x] App shell + routing: **Learn / Drill / Explore** + Review entry point (stub)
- [x] `/src/types.ts` per PROJECT.md §4
- [x] Content pipeline: typed JSON in `/src/content/` + markdown modules in `/src/content/modules/`
- [x] `npm run validate:content` script (word-gating + chunk-alignment checks, §6.1)
- [x] Port Module 1 content → `words.json`, `sentences.json`, `module-1.md`
- [x] Port Hangul history → `module-hangul-history.md`
- [x] Dexie schema: `knownWords`, `drillResults`, `srsCards`, `savedTranslations`
- [x] Known-word gating: module vocab checklist → unlocks sentences/drill content

## Phase A.1 — Port the four drills *(a fifth, the typing drill, shipped alongside — see Discovered work)*
- [x] Shared `DrillSession` component (item source, answer handler, results logging, missed-items strip)
- [x] Confusables drill (flashcard + quiz; same-group distractors — test §6.2)
- [x] Cross-font reader (legend, per-letter notes, whole-word comparison)
- [x] Sentence anatomy (3-layer tap-to-trace study mode + arrange mode)
- [x] Literal-vs-real (browse by category + guess-the-meaning quiz)
- [x] Unified "Review these" area (union of missed items across drills)

## Phase A.2 — Spaced repetition
- [x] ~~SM-2~~ **FSRS** scheduler over `SrsCard` (+ tests §6.4) — `ts-fsrs`, per Nick's 2026-08-01 note; chosen 2026-08-02
- [x] Daily Review queue mixing due items across drill kinds (`/review/session` — one pass, all kinds)
- [x] Wrong answers enter SRS at shortened interval (wrong → `Again` → due within minutes)

## Phase A.3 — Translator + audio
- [x] `/server` proxy (Hono): `.env` key, `/api/translate`, zod-validated JSON contract (§3)
- [x] Explore UI port from `korean-curiosity-translator.jsx`
- [x] Save-to-deck (auto-file into Gap deck when `literal_gap` non-empty)
- [x] Audio v1: `speechSynthesis` ko-KR play buttons on words/sentences *(pulled forward — shipped in Session 1 with the A.0/A.1 build)*
- [x] Cross-font difficulty toggle on drills + per-face accuracy stat ("Mixed fonts" chip on confusables + gap quiz)

## Phase A.4 — Module 2 content
- [x] Author Module 2 (numbers, time, past tense, 도/에서/하고) in content format — 32 words + 3 particles, 12 sentences, module-2.md
- [x] Validator proves gating across modules (real-m2 test cases added to content.validate.test.ts)
- [x] New confusable/gap items introduced by Module 2 vocab (cf_i ㅣ for the 일/이 pair; 4 gap items: 도, 에/에서, 하고, 잘 지냈어요?)

## Phase B — Sharing (do not start without explicit decision)
- [ ] Deploy static build + proxy; simple auth; per-user state sync

## Discovered work
- (add items here with dates)
- 2026-08-01 · Future module idea (Nick): slang section.
- 2026-08-01 · Future module idea (Nick): formal vs casual register — e.g. 안녕하세요 ↔ 안녕 between friends; pairs with the politeness-levels module already sketched for Module 4.
- 2026-08-01 · Future module idea (Nick): Korean spacing (띄어쓰기) and punctuation — when to add spaces, what punctuation exists; could live inside sentence-structure content.
- 2026-08-01 · Direction change (Nick): desktop app first via **Tauri 2** (`src-tauri/`, AppImage+rpm), mobile second via Tauri's iOS/Android targets once desktop is stable. PROJECT.md §3 updated. The earlier PWA idea is dropped — offline is inherent in a desktop app.
- 2026-08-01 · Built beyond the A.0/A.1 checklist (user-approved scope): audio from day one (ko-KR speechSynthesis, graceful no-voice state), onboarding Hangul placement, dark "night paper" theme (system-following + manual toggle), drill keyboard shortcuts (1–4/Space/Enter/Backspace), progress dashboard, JSON export/import backup, and a fifth **typing drill** with an in-app 2-beolsik keyboard backed by a pure Hangul composition engine (`src/lib/hangul/` — 23 tests incl. batchim migration and jamo-level backspace).
- 2026-08-01 · New deps (why): `dexie-react-hooks` (reactive Dexie queries), `react-markdown`+`remark-gfm` (module markdown with tables, no unsafe HTML), `@fontsource/*` (self-hosted Korean fonts — required offline; never the prototypes' Google Fonts link), `fake-indexeddb` (dev; Dexie round-trip tests), `@tauri-apps/cli` (desktop shell), Tailwind v4 via `@tailwindcss/vite` (CSS-variable theming for light/dark).
- 2026-08-01 · Additive type fields vs §4: `Sentence.rom?`, `DrillResult.face?` (per-face accuracy groundwork), drill kinds `"typing"`/`"font"`, `PersistedSettings`, `ExportSnapshot`, `TranslationResult` (typed early for A.3).
- 2026-08-01 · Content decisions: added 가게 to Module 1 vocab so the anatomy "store" sentence passes word-gating; kept 학교에서 sentence with its note explicitly framing 에서 as a Module-2 preview.
- 2026-08-01 · Upgrade note: if the export anchor-download misbehaves inside the WebKitGTK webview, add `tauri-plugin-dialog` for a native save dialog (a Copy-JSON clipboard fallback ships already).
- 2026-08-01 · A.2 note: consider FSRS (`ts-fsrs`, Anki's modern scheduler) instead of SM-2 when building spaced repetition; `srsCards` table + types already exist.
- 2026-08-01 · Linux build quirk: AppImage bundling needs `NO_STRIP=true` (linuxdeploy's bundled strip can't read Fedora 44's `.relr.dyn` ELF sections) — use `npm run tauri:build`, which sets it.
- 2026-08-01 · Linux runtime quirk: WebKitGTK's DMA-BUF renderer crashes on NVIDIA+Wayland ("Error 71 dispatching to Wayland display"). Fixed in `src-tauri/src/main.rs` by setting `WEBKIT_DISABLE_DMABUF_RENDERER=1` at startup (respects an explicit user override).
- 2026-08-01 · Future work (Nick): **placement quiz onboarding** — replace the yes/no "can you read Hangul?" with a short adaptive quiz; based on performance, pre-mark words/glue/alphabet sections as completed so experienced learners don't start from scratch.
- 2026-08-01 · Future work (Nick): **separate flashcards and quiz** — make them distinct sections/routes in the drill area rather than a mode toggle inside one drill.
- 2026-08-02 · A.2 decision (Nick): **FSRS over SM-2** via `ts-fsrs` — Anki's modern scheduler, no hand-rolled math. Binary drills map wrong→`Again`, correct→`Good`. `SrsCard` extended additively (stability/reps/state/lastReview…); legacy `interval`/`ease` now mirror FSRS scheduled-days/difficulty. Pre-A.2 backups still import (new zod fields optional).
- 2026-08-02 · A.2 design: **one grading funnel** — `repo.logDrillResult` writes the result row AND upserts the FSRS card in one Dexie transaction, so all five drills and the Review session feed the schedule with zero per-drill code.
- 2026-08-02 · A.2 design: the Review session renders kind-appropriate questions (confusable/font → glyph→sound quiz; gap → guess-the-meaning; anatomy → pick-the-translation w/ new `generateSentenceOptions`; typing → full composer + in-app keyboard). Queue is frozen at session start; oldest-due first.
- 2026-08-02 · New deps (why): `ts-fsrs` (FSRS scheduler — don't hand-roll SRS math), `hono`+`@hono/node-server` (the §3 proxy; PROJECT.md blessed it, ~100 lines), `@anthropic-ai/sdk` (official client instead of raw fetch — typed errors, retries), `tsx` (dev; run the TS server with zero build step).
- 2026-08-02 · A.3 note: proxy model is `claude-sonnet-4-6` per PROJECT.md §3. The prompt contract + fence-strip/zod parse live in `server/prompts/translate.ts` (pure, tested in tests/translator.contract.test.ts). Client re-validates responses (§6.3 both sides). In-browser dev goes through a Vite `/api` proxy; the Tauri build calls `127.0.0.1:8787` directly (CORS open on the proxy).
- 2026-08-02 · A.3 design: discovered deck — saved translations with a non-empty `literal_gap` become `GapItem`s with `disc_<id>` ids (`src/lib/discovered.ts`), merged into the gap drill pool, browse list, distractors, review resolution, and SRS. Deleting a discovery leaves orphan cards; the review session silently skips unresolvable items by design.
- 2026-08-02 · A.4 content decisions: Module 2 is order 3 (the Hangul-history reading sits at order 2). Sino-Korean numbers only (native 하나/둘 deferred to the counting-words module); time-telling sentences avoided since 시 needs native numbers. 식당/차/배우다 ship as vocab without sentences. Several m2 sentences use the dropped-subject pattern (`t: ""`) introduced by s_no_time.

## Session log
- (append one paragraph per session: what changed, test status, next step)
- **2026-08-01 · Session 1 (Claude Code):** Built Phase A.0 + A.1 end to end as a Tauri 2 desktop app: scaffold (Vite 8/React 19/TS/Tailwind v4 tokens in light + dark), full content port (37-word Module 1 checklist incl. 가게, 14 three-layer sentences, 37 confusables, 16 gap items, both markdown modules with `::vocab::`/`::sentences::` mount markers), `validate:content` enforcing word-gating/chunk-alignment/quiz-constructibility, Dexie learner state + repo, onboarding, Learn area with gated sentences, shared drill engine, all five drills (confusables, cross-font, anatomy, gap, typing with in-app 2-beolsik keyboard + pure composition engine), unified Review with `?review=1` re-drill pools, dashboard, JSON backup. **62 tests green, `validate:content` green, `npm run build` green**; `tauri build` produces AppImage/rpm. Next step: Phase A.2 (SRS over the reserved `srsCards` table — evaluate FSRS) or Module 2 content.
- **2026-08-01 · Session 2 (Claude Code):** Docs-and-planning session, paused by request before starting A.2. Recorded Nick's design feedback as future work (placement-quiz onboarding; separate flashcards/quiz sections), brought all docs up to date (README added; PROJECT.md roadmap status; this file), verified the tree clean with all checks green. Next step unchanged: Phase A.2 → A.3 → A.4, then a polish pass that folds in the future-work list.
- **2026-08-02 · Session 3 (Claude Code):** Built Phases A.2–A.4 end to end. **A.2:** FSRS spaced repetition (`ts-fsrs`, Nick's pick over SM-2) behind the single `logDrillResult` funnel — every drill answer creates/moves a card; wrong answers return within minutes; new `/review/session` runs the daily queue as one mixed-kind pass (glyph quiz, gap quiz, translation pick, full typing composer); Review page gained the due-queue banner and Stats a queue panel; §6.4 tests cover interval growth, lapse reset, and queue mixing. **A.3:** Hono+Anthropic-SDK proxy in `/server` (`npm run server`, key in gitignored `server/.env`, typed error envelope, smoke-tested), Explore UI ported with role-colored gloss chips and save-to-deck, discoveries with a literal gap auto-filing into the gap drill + SRS as `disc_*` items, and the "Mixed fonts" cross-font difficulty toggle on the confusables and gap quizzes feeding the per-face accuracy stat. **A.4:** Module 2 authored (Sino-Korean numbers, time words, places, 6 verbs incl. ㄷ-irregular 듣다, particles 도/에서/하고, past tense; 12 three-layer sentences), plus cf_i and 4 new gap items; validator test now proves cross-module gating against the real m2. **83 tests green, `validate:content` green, `npm run build` green.** Phase A feature-complete. Next: the polish pass over TASKS.md future-work (placement quiz, flashcards/quiz split), live end-to-end translator test with a real API key, or the Phase B go/no-go.
