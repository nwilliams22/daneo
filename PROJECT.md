# PROJECT.md — 단어 (Daneo) · A Word-First Korean Learning App

> **Working name:** Daneo (단어, "word") — rename freely.
> **Owner:** Nick · **Status:** Phase A feature-complete — A.0–A.4 built (2026-08-01 → 2026-08-02) as a Tauri 2 desktop app; see §7 roadmap and TASKS.md session log. Next: polish pass (TASKS.md future work) or the Phase B decision.
> **This document is the source of truth for Claude Code sessions. Read fully before writing code.**

---

## 1. Vision & product thesis

Mainstream language apps (Duolingo, Memrise) throw learners into full sentences before teaching the words in them. This app inverts that: **words first → minimal grammatical "glue" → sentences built only from known words.** The learner should never be shown a sentence containing a word they haven't already learned.

**Phase A (now):** personal tool for one user (Nick — knows Hangul at an elementary level, confuses compound vowels/aspirated-tense consonants and non-Gothic fonts).
**Phase B (later):** shareable with friends.
**Phase C (maybe):** public/commercial. Architectural decisions should not block B/C, but never slow A down for their sake.

### Non-negotiable pedagogy rules (enforce in code, not just content)
1. **Word-first sequencing.** Sentences may only use vocabulary the learner has marked as learned. The sentence engine must validate this against the learner's known-word set.
2. **Confusables are trained as contrasts.** Drill distractors come from the same confusable group (e.g. ㅘ vs ㅝ), never random.
3. **Structure is taught via interlinear gloss.** Every sentence has three aligned layers: natural English → English-in-Korean-order (particles written as suffixes: "store-to", "water-[obj]") → Korean. Chunks are aligned by ID across layers.
4. **The literal/real gap is a first-class concept.** Any item where word-for-word meaning diverges from actual meaning (있다="exists"→have, 밥 먹었어요?="did you eat rice?"→greeting) carries a `literal_gap` field and is surfaced in a dedicated study area.
5. **Romanization is training wheels.** Always present but visually secondary; a global setting hides it entirely.
6. **Cross-font fluency is trained deliberately.** Content renders in Gothic by default; drills can render prompts in Myeongjo/handwriting faces as an unlockable difficulty.

---

## 2. Existing prototypes (reference implementations)

These six artifacts define the intended UX and visual language. Port their logic; improve their code (they use inline styles and local state only). *(Status: all ported 2026-08-01 — the .jsx files remain at the repo root purely as reference; the live implementations are under `/src/features/`.)*

| Prototype file | Feature | Key mechanics to preserve |
|---|---|---|
| `korean-word-first-module-1.md` | Course module content | Hangul → 35 words → particles+요 form → sentences → practice |
| `hangul-confusables-drill.jsx` | Confusable drill | Flashcard + quiz modes; same-group distractors; missed-item review strip |
| `hangul-across-fonts.jsx` | Cross-font reader | Same char/word in Gothic·Myeongjo·handwriting; per-letter "what changes" notes |
| `korean-sentence-anatomy.jsx` | Sentence structure | 3-layer aligned gloss; tap-to-trace chunks across layers; arrange-the-tiles mode |
| `korean-lost-in-translation.jsx` | Literal-vs-real study | 3 categories (grammar mismatch / set phrase / untranslatable); browse + guess-the-meaning quiz |
| `korean-curiosity-translator.jsx` | AI translator | Claude API returns structured JSON: korean, romanization, natural_english, gloss[], particles[], literal_gap, cultural_note |
| `korean-module-hangul-history.md` | History module | Featural-design story doubles as mnemonics for confusables |

### Design system (from prototypes — keep consistent)
- Palette: paper `#E7E4DA`, panel `#F3F1EA`, ink `#23262C`, muted `#8A8578`, teal `#2C6E63` (subject/success), clay `#B4573D` (object/error), gold `#8A6D2F` (place/culture), hairlines `rgba(35,38,44,0.10)`.
- Role color-coding is semantic and app-wide: subject=teal, object=clay, place=gold, verb=ink/bold.
- Korean type: Noto Sans KR (default) / Noto Serif KR (Myeongjo) / Nanum Pen Script (handwriting), with OS fallbacks. UI type: Inter.
- Tone: calm, paper-like, minimal chrome; one accent moment per screen.

---

## 3. Architecture

### Stack (Phase A)
> **Direction change (2026-08-01, Nick):** Daneo ships as a **desktop app first (Tauri 2)**, with mobile second (Tauri's iOS/Android targets) once desktop is stable. The core remains the plain Vite+React SPA below — Tauri wraps it (`src-tauri/`, no custom Rust). Browser `npm run dev` stays the fast iteration loop; `npm run tauri dev` runs the real WebKitGTK shell; `npm run tauri build` produces AppImage/rpm. Everything in `/src/lib` stays pure (no DOM) so the mobile wrap stays cheap.

- **Vite + React + TypeScript** — SPA, no SSR needed.
- **Tailwind** for styling (port the palette to theme tokens; replace prototypes' inline styles).
- **Dexie (IndexedDB)** for learner state (known words, drill stats, SRS scheduling, missed items). Content itself ships as static typed JSON in `/src/content/`.
- **Zustand** for app state.
- **Vitest** for the pedagogy-rule tests (see §6).
- Runs entirely local (`npm run dev` / static build). No backend in Phase A **except**:

### Translator API access
- Phase A: a ~40-line Node/Express (or Hono) proxy in `/server` that holds `ANTHROPIC_API_KEY` in `.env` and forwards translator requests to the Messages API (`claude-sonnet-4-6`). Never put the key in client code — this habit is what makes Phase B/C possible.
- The translator prompt contract lives in `/server/prompts/translate.ts` and must return the exact JSON schema used by `korean-curiosity-translator.jsx` (§2). Strip markdown fences, validate with zod, return typed errors.
- Phase B/C: same proxy grows auth + rate limiting; client code unchanged.

### App structure — three areas
1. **Learn** — sequential modules (Module 1, Hangul history, Module 2+). Markdown-driven content rendered in-app; completing a module's vocab adds words to the known set.
2. **Drill** — confusables, cross-font, sentence anatomy (study/arrange), literal-vs-real quiz. All drills log results per item to Dexie.
3. **Explore** — the curiosity translator. Any translator result can be saved as a card into a personal "discovered" deck (this is the curiosity→collection loop).

---

## 4. Data model (TypeScript, `/src/types.ts`)

```ts
// Shared primitives
type Role = "subject" | "object" | "place" | "verb" | "other";
type FontFace = "gothic" | "myeongjo" | "hand";

interface Word {
  id: string;            // "w_mul"
  ko: string;            // 물
  rom: string;           // mul
  en: string;            // water
  pos: "noun" | "verb" | "adj" | "particle" | "phrase";
  moduleId: string;      // which module introduces it
  notes?: string;
}

interface Chunk { id: string; t: string; role: Role; }

interface Sentence {
  id: string;
  en: Chunk[];           // natural English order
  gloss: Chunk[];        // Korean order, particles as suffixes
  ko: Chunk[];           // Korean, aligned by chunk id
  wordIds: string[];     // MUST all be in learner's known set to be shown
  note: string;
}

interface ConfusableItem {
  id: string; c: string; r: string;
  group: "compound" | "vowel" | "consonant" | "tense";
  note: string;          // the distinguishing feature
}

interface GapItem {                  // literal-vs-real
  id: string; ko: string; rom: string;
  lit: string; real: string; note: string;
  cat: "structure" | "phrase" | "concept";
}

interface Module {
  id: string; title: string; order: number;
  contentMd: string;     // path to markdown
  wordIds: string[];     // vocab unlocked on completion
  sentenceIds: string[];
}

// Learner state (Dexie)
interface KnownWord { wordId: string; learnedAt: number; }
interface DrillResult { itemId: string; kind: "confusable"|"anatomy"|"gap"|"font"; correct: boolean; at: number; }
interface SrsCard {    // Phase A.2 — see roadmap
  itemId: string; kind: string;
  interval: number; ease: number; due: number; lapses: number;
}
interface SavedTranslation { /* translator JSON result + savedAt */ }
```

Content validation script (`npm run validate:content`) must fail the build if any `Sentence.wordIds` references a word from a later module than the sentence's own module.

---

## 5. Feature specs (beyond straight ports)

- **Known-word gating:** Learn area shows a module's sentences only after its vocab checklist is done. Drills draw only from unlocked content. The translator is always unrestricted (it's the curiosity valve).
- **Spaced repetition (Phase A.2):** FSRS (`ts-fsrs`) over `SrsCard` — *(built 2026-08-02; chosen over the originally-specced SM-2, see TASKS.md)*. A single daily "Review" queue mixes due items from all drill kinds. Don't build a settings jungle; defaults only.
- **Audio (Phase A.3):** start with browser `speechSynthesis` (ko-KR voice) behind a play button on words/sentences — zero-cost, works offline. Upgrade path: pre-generated TTS files. Note limitation: quality varies by OS voice.
- **Cross-font difficulty:** a per-drill toggle that renders prompts in a random face; track accuracy per face to show a "font fluency" stat.
- **Missed-items loop:** anything answered wrong in any drill appears in a unified "Review these" area (union of the prototypes' per-tool strips) and feeds SRS at a shortened interval.
- **Translator save-to-deck:** saved discoveries become reviewable cards; if the result had a non-empty `literal_gap`, it files into the Gap deck automatically.

---

## 6. Testing the pedagogy (this is what makes the app different — test it)

Vitest suites, minimum:
1. Content validation: every sentence uses only same-or-earlier-module words; every chunk id in `en` exists in `gloss` and `ko` (except explicitly droppable subjects, marked `t: ""`).
2. Drill distractor generator: confusable quiz options always share the target's `group` when ≥3 same-group items exist; no duplicate roman values among options.
3. Translator response: zod schema rejects malformed API output; UI renders a typed error, never a crash.
4. SRS: due-date math produces monotonically growing intervals on success, reset on lapse.

---

## 7. Roadmap

> **Content expansion has its own map:** [`CURRICULUM.md`](CURRICULUM.md) —
> the beginner→fluency ring structure (ceiling: the fixed NIKL 5,965-word
> learner list), the full Ring 1 module skeleton (M3–M26), and the
> per-module authoring contract. Decided 2026-08-02.

- ✅ **Phase A.0 — Scaffold** *(done 2026-08-01)*: Vite+TS+Tailwind+Dexie skeleton, theme tokens, routing (Learn/Drill/Explore), content pipeline + validator, port Module 1 + history module content.
- ✅ **Phase A.1 — Port drills** *(done 2026-08-01)*: confusables, cross-font, sentence anatomy, gap study — sharing one drill-session component and unified results logging. Shipped with extras beyond spec: a fifth typing drill (in-app 2-beolsik keyboard + Hangul composition engine), audio v1 pulled forward from A.3, dark theme, onboarding placement, dashboard, backup/restore, keyboard shortcuts. See TASKS.md Discovered work.
- ✅ **Phase A.2 — SRS + daily review queue** *(done 2026-08-02)*: FSRS via `ts-fsrs` (chosen over SM-2 — TASKS.md 2026-08-02); every drill answer feeds the scheduler through one funnel; `/review/session` mixes due items across all drill kinds; wrong answers return at a shortened interval.
- ✅ **Phase A.3 — Translator (with proxy) + save-to-deck + cross-font difficulty toggle** *(done 2026-08-02)*: Hono proxy in `/server` holding the key, zod-validated contract both sides, Explore UI port, discoveries with a literal gap auto-file into the Gap deck + SRS, "Mixed fonts" toggle on confusables/gap quizzes with per-face stats. *(Audio v1 had shipped in A.1.)*
- ✅ **Phase A.4 — Module 2 content** *(done 2026-08-02)*: numbers, time, past tense, 도/에서/하고 in the content format (32 words, 12 sentences, new confusable + gap items); validator proves cross-module gating.
- **Phase B — Share:** deploy static build + proxy (Fly/Railway), household auth, per-user Dexie→server sync (only if actually sharing).
- **Phase C — Commercial (decide later):** real accounts, paid TTS, content CMS. Out of scope for all current sessions.

## 8. Working agreements for Claude Code sessions
- Keep `TASKS.md` current: check items off, add discovered work with date stamps.
- Never violate §1 pedagogy rules for implementation convenience; if a rule blocks you, stop and surface it.
- Prefer boring tech; no new dependencies without a note in TASKS.md explaining why.
- Each session ends with: tests green, `validate:content` green, one-paragraph session log appended to TASKS.md.
