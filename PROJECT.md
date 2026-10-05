# PROJECT.md — 단어 (Daneo) · A Word-First Korean Learning App

> **Working name:** Daneo (단어, "word") — rename freely.
> **Owner:** Nick · **Status:** the app is Phase A feature-complete — A.0–A.4 built (2026-08-01 → 2026-08-02) as a Tauri 2 desktop app. **The content is finished — see the end of this line for what is live now.** Ring 1 (M1–M30 + readings + appendices) and Ring 2 (M31–M84) are shipped in full; Ring 3 (M85–M155) is shipped in full — **164 modules**, NIKL grades A, B and C all **100.0%** *(grade C 2,655/2,655, 0 missing; verified 2026-09-30 via `npm run coverage:nikl`)*. **CURRICULUM.md is the live content tracker** (§2 Ring 1, §2b Ring 2, §2c Ring 3); TASKS.md holds the app checklist and the session log. **Ring 3 is complete**, and so is the **six-pass independent content review** Nick put ahead of everything else on 2026-09-30 — all six passes reported by 2026-10-04 and their 66 correction tickets carried out *(re-verified 2026-10-04 on the corrected tree: `coverage:nikl` still 100.0% in all three grades, `validate:content` 15/15, `lint:lang` 0 FAIL / 0 WARN across 5,615 words, 1,439 sentences, 420 gaps)*. **Phase D is implemented, measured and not shipped; its documentation closeout is recorded in `reference/desktop-closeout.md`.** The later 2026-10-05 decision below supersedes the 2026-09-30 phase order (§7). **Nick fixed Phase D's scope on 2026-10-04: a free local model is the engine Daneo ships, a paid model is not to be the one it uses, and the app must be free to use as a whole — see §3 and `PLAN-local-model.md`.** He also settled what sharing means, the same day: **Phase B is desktop installers for Linux, Windows and macOS, and nothing else** — no hosted web build, no server, no accounts, no sync, and mobile v3 stays closed (§7). **Nick's 2026-10-05 decision reorders the remaining work: no local engine has passed the language gate after four measured declines, so Daneo ships with the AI features OFF while training continues in parallel.** Phase B no longer waits for Phase D; the AI turns on in a later release only if a retrained model clears the unburned v2 gate. Measured basis and every option considered: [`reference/eval/engine-decision.md`](reference/eval/engine-decision.md). **No decision is outstanding with him.**
> **This document is the source of truth for Claude Code sessions. Read fully before writing code.**

---

## 1. Vision & product thesis

Mainstream language apps (Duolingo, Memrise) throw learners into full sentences before teaching the words in them. This app inverts that: **words first → minimal grammatical "glue" → sentences built only from known words.** The learner should never be shown a sentence containing a word they haven't already learned.

**Phase A (now):** personal tool for one user (Nick — knows Hangul at an elementary level, confuses compound vowels/aspirated-tense consonants and non-Gothic fonts).
**Phase B (later):** shareable with friends — and free for them too, which rules out a hosted paid translator (§3, §7). Nick's choice, 2026-10-04: sharing means **desktop installers** they download and run, not a hosted service.
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
> **Direction change (2026-08-01, Nick):** Daneo ships as a **desktop app first (Tauri 2)**, with any mobile target now subject to the separate v3 decision. The core remains the plain Vite+React SPA below — Tauri wraps it (`src-tauri/`, now including the in-process Rust model runtime). Browser `npm run dev` stays the fast iteration loop; `npm run tauri dev` runs the real WebKitGTK shell; `npm run tauri build` produces AppImage/rpm. Everything in `/src/lib` stays pure (no DOM) so the mobile wrap stays cheap.

- **Vite + React + TypeScript** — SPA, no SSR needed.
- **Tailwind** for styling (port the palette to theme tokens; replace prototypes' inline styles).
- **Dexie (IndexedDB)** for learner state (known words, drill stats, SRS scheduling, missed items). Content itself ships as static typed JSON in `/src/content/`.
- **Zustand** for app state.
- **Vitest** for the pedagogy-rule tests (see §6).
- Runs entirely local (`npm run dev` / static build). The development local engine runs in the desktop process; the separate proxy below is development-only.

### Translator model access — free local AI, excluded from release one

**When enabled in a future release, the translator and tutor must run on a qualified free local model. Daneo must be free to use as a whole: no API key, no account, no subscription and no network for any shipped feature.** Nick's instruction, 2026-10-04: *"I do not want a paid model to be the one used in Daneo. I want a free, local model such as qwen to be the one used."* Training that model on Daneo's own content is authorized if it makes it better.

- **Release one (2026-10-05):** production frontend gates exclude translation, tutor route/navigation and model settings; Explore retains saved discoveries and the absence notice. Native commands remain compiled, but no AI UI or frontend adapter ships. Packaged offline/no-paid-model verification is a Phase B gate, not a claim made by this document.
- **The intended future engine** is the implemented in-process `llama.cpp` runtime in the Tauri shell; selecting and qualifying its verified Qwen GGUF remains open in **Phase D** — the design lives in [`PLAN-local-model.md`](PLAN-local-model.md), whose *Owner constraint* section governs the whole phase.
- **The result contract does not change.** One typed translation result and error envelope, whichever engine produced it; the final JSON passes the same zod schema before it renders or saves. The contract lives in `src/lib/schemas.ts`, `src/types.ts`, `server/prompts/translate.ts` and `src/features/explore/api.ts`.
- **Phase A's Hono proxy in `/server` survives as a developer comparison tool, not a feature.** It holds `ANTHROPIC_API_KEY` in `.env`, forwards to the Messages API on `claude-sonnet-4-6`, and is **off by default, excluded from any build handed to another person, and never a fallback when the local engine fails.** There is no "Auto" engine setting. The key never ships in client code — that rule still holds for the dev path.
- **No hosted paid proxy, ever, as the product's translator.** That rules out the old "Phase B/C: the same proxy grows auth + rate limiting" plan, which assumed other people's usage billed to Nick's key. Sharing means desktop installers for Linux, Windows and macOS — see §7 Phase B.

### App structure — four areas
1. **Learn** — sequential modules (Module 1, Hangul history, Module 2+). Markdown-driven content rendered in-app; completing a module's vocab adds words to the known set.
2. **Drill** — confusables, cross-font, sentence anatomy (study/arrange), literal-vs-real quiz. All drills log results per item to Dexie.
3. **Explore** — saved discoveries in release one; the curiosity translator remains development-only. Any translator result can be saved as a card into a personal "discovered" deck (this is the curiosity→collection loop).
4. **Ask Daneo (development only)** — the local tutor reads learner state and cites only unlocked curriculum sentences. Generated Korean is removed before rendering; a reply with no usable English is rejected. The tutor does not write learner state.

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
  pos: "noun" | "pronoun" | "determiner" | "verb" | "adj" | "adverb" | "connective" | "particle" | "phrase";
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
> **Order after Ring 3 (Nick, 2026-09-30).** Ring 3 closed with all three NIKL grades at 100.0%.
> Asked what came next, Nick chose **an independent review of the shipped content first**, then
> *"the local in-app AI agent, and then the shareable feature"* — so the queue is **content review
> → Phase D → Phase B**. This reverses the earlier rule below that kept Phase D behind Phase B.
> Historical order, superseded on 2026-10-05: the review is complete, Phase B proceeds with AI off, and retraining runs in parallel; `TASKS.md` tracks both.

- **Phase B — Share: desktop installers (live release path; decided by Nick 2026-10-04/05):** the old design — deploy the static build plus the Claude proxy to Fly/Railway, household auth, per-user Dexie→server sync — **is dead, not deferred.** It billed Nick monthly and put his API key in front of other people's usage, which the free-and-local constraint (§3) forbids. Asked what sharing should be instead, Nick chose **desktop installers for Linux, Windows and macOS**, and did not choose the AI-less web build or a phone app. So Phase B is a **packaging and release** phase: cross-platform Tauri bundles, a first run on a clean machine that needs no key, no account and no network or model download for release one, release artifacts with checksums, and an honest account of the unsigned-installer warnings. **There is no server, so there is nothing to deploy, no auth to build, no sync, and no hosting bill — ever.** The only money in reach is an optional code-signing certificate, which is Nick's call when a release is imminent and is not assumed. Mobile v3 stays closed (`PLAN-local-model.md` §*What Nick chose*). **Phase B no longer waits for Phase D (Nick, 2026-10-05):** no engine qualified, so the first release ships with the AI features off and needs no model at all. The release chain is the live work.
- **Phase C — Commercial (decide later):** real accounts, paid TTS, content CMS. Out of scope for all current sessions. Note that a free local engine is what makes any of this affordable, not an obstacle to it.
- **Phase D — Local AI (implementation present; no engine qualified, so it does not ship in the first release — Nick, 2026-10-05).** Four candidates have been measured against the unchanged `reference/eval/v0-rubric.md` and all four declined: 0/10, 1/10, 2/10, and a prompted base and a 27-row Q8_0 fine-tune both at 4/10 against a ≥9/10 bar. Nick's decision is to **ship with the AI off and retrain in parallel** on a much larger Daneo-specific dataset, scored once against the still-sealed `reference/eval/v2-translation-set.json`. The rest of this entry is the standing design and is unchanged. An in-process `llama.cpp` runtime for the translator and a Daneo-specific tutor, on a verified Qwen GGUF the app downloads once after install. **It is not an optional extra — it is how the app's AI works at all**, per §3. Standard and Lite candidates are Qwen3.5-4B / Qwen3.5-2B; a Daneo-specific fine-tune is authorized and runs free on the build host's RTX 5090 if the v0 error analysis justifies it. **Full plan and the gate it must pass: [`PLAN-local-model.md`](PLAN-local-model.md).** The cloud pin in `server/index.ts` stays at `claude-sonnet-4-6` and is not to be upgraded; it is a developer comparison tool.

**Phase D documentation closeout (2026-10-05):** implemented, measured and not shipped. The component inventory, evidence, unresolved activation gates and cloud-adapter recommendation are in [`reference/desktop-closeout.md`](reference/desktop-closeout.md). The earlier Cargo-discovery failure is historical; subsequent Linux packaging succeeded (TASKS.md, “Prepare three-platform desktop bundles”), without establishing packaged launch. Release packaging/install proof belongs to BAD-234 → BAD-204 → BAD-205; future offline AI proof returns with the trained-engine verdict on BAD-240. The v1 training pipeline completed and its candidate declined; scaled training continues separately. Mobile v3 requires a separate decision and Phase C remains out of scope.

## 8. Working agreements for Claude Code sessions
- Keep `TASKS.md` current: check items off, add discovered work with date stamps.
- Never violate §1 pedagogy rules for implementation convenience; if a rule blocks you, stop and surface it.
- Prefer boring tech; no new dependencies without a note in TASKS.md explaining why.
- Each session ends with: tests green, `validate:content` green, one-paragraph session log appended to TASKS.md.
