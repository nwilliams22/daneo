# TASKS.md — Daneo build checklist

> Companion to PROJECT.md. Check items off as completed; add discovered work under the matching phase with a date stamp. Append a session log entry at the bottom after each Claude Code session.

## Phase A.0 — Scaffold
- [ ] `npm create vite@latest` (react-ts), add Tailwind, Zustand, Dexie, Vitest, zod
- [ ] Theme tokens from PROJECT.md §2 palette (Tailwind config) + font loading (Noto Sans KR / Noto Serif KR / Nanum Pen Script, OS fallbacks)
- [ ] App shell + routing: **Learn / Drill / Explore** + Review entry point (stub)
- [ ] `/src/types.ts` per PROJECT.md §4
- [ ] Content pipeline: typed JSON in `/src/content/` + markdown modules in `/src/content/modules/`
- [ ] `npm run validate:content` script (word-gating + chunk-alignment checks, §6.1)
- [ ] Port Module 1 content → `words.json`, `sentences.json`, `module-1.md`
- [ ] Port Hangul history → `module-hangul-history.md`
- [ ] Dexie schema: `knownWords`, `drillResults`, `srsCards`, `savedTranslations`
- [ ] Known-word gating: module vocab checklist → unlocks sentences/drill content

## Phase A.1 — Port the four drills
- [ ] Shared `DrillSession` component (item source, answer handler, results logging, missed-items strip)
- [ ] Confusables drill (flashcard + quiz; same-group distractors — test §6.2)
- [ ] Cross-font reader (legend, per-letter notes, whole-word comparison)
- [ ] Sentence anatomy (3-layer tap-to-trace study mode + arrange mode)
- [ ] Literal-vs-real (browse by category + guess-the-meaning quiz)
- [ ] Unified "Review these" area (union of missed items across drills)

## Phase A.2 — Spaced repetition
- [ ] SM-2 scheduler over `SrsCard` (+ tests §6.4)
- [ ] Daily Review queue mixing due items across drill kinds
- [ ] Wrong answers enter SRS at shortened interval

## Phase A.3 — Translator + audio
- [ ] `/server` proxy (Hono or Express): `.env` key, `/api/translate`, zod-validated JSON contract (§3)
- [ ] Explore UI port from `korean-curiosity-translator.jsx`
- [ ] Save-to-deck (auto-file into Gap deck when `literal_gap` non-empty)
- [ ] Audio v1: `speechSynthesis` ko-KR play buttons on words/sentences
- [ ] Cross-font difficulty toggle on drills + per-face accuracy stat

## Phase A.4 — Module 2 content
- [ ] Author Module 2 (numbers, time, past tense, 도/에서/하고) in content format
- [ ] Validator proves gating across modules
- [ ] New confusable/gap items introduced by Module 2 vocab

## Phase B — Sharing (do not start without explicit decision)
- [ ] Deploy static build + proxy; simple auth; per-user state sync

## Discovered work
- (add items here with dates)

## Session log
- (append one paragraph per session: what changed, test status, next step)
