# 단어 Daneo — word-first Korean learning

A desktop app (Tauri 2 + React) that teaches Korean the opposite way from Duolingo: **words first → minimal grammatical "glue" → sentences built only from words you already know.** You are never shown a sentence containing a word you haven't marked as learned — that rule is enforced in code, not just content.

**Docs:** [`PROJECT.md`](PROJECT.md) is the source of truth (vision, pedagogy rules, data model, roadmap). [`TASKS.md`](TASKS.md) is the build checklist, discovered-work log, and per-session log. The `*.jsx` / extra `*.md` files at the repo root are the original design prototypes, kept as reference only.

## Status (2026-08-02)

Phases **A.0 through A.4** are complete — the full Phase A feature set. Working today:

- **Onboarding** — an adaptive **placement quiz** (letters → Module 1 words → sentences, early stop on a failed stage) that pre-checks whatever you prove: alphabet collapsed, Module 1 vocab marked known, romanization hidden. "Brand new" and "skip the quiz" paths remain.
- **Learn** — Module 1 (37-word checklist, grammar, 14 three-layer sentences), the Hangul history reading, and **Module 2** (numbers, time words, 도/에서/하고, past tense — 32 words, 12 sentences), all gated by the known-word rule.
- **Drill** — five drills with study and quiz modes as separate routes: confusables **flashcards / quiz** (same-group distractors), cross-font reading (Gothic/Myeongjo/handwriting), sentence anatomy (tap-to-trace + arrange), literal-vs-real **browse / quiz**, and typing on an **in-app 2-beolsik keyboard** with a fully tested Hangul composition engine (no OS Korean IME needed). The quizzes have a **"Mixed fonts"** difficulty toggle with per-face accuracy tracking.
- **Review** — a spaced-repetition queue (**FSRS** via `ts-fsrs`): every graded answer anywhere feeds the scheduler, wrong answers come back within minutes, and the daily queue mixes due items from all drill kinds into one session. The missed-items strip from A.1 lives on the same page.
- **Explore** — the **curiosity translator** (Claude via a local key-holding proxy): Korean-order gloss with role colors, particle jobs, literal-vs-real gap, cultural notes. Results save into a "Discovered" deck; anything with a literal gap auto-files into the Gap drill and the review schedule.
- **Stats** — words learned per module, review-queue counts, accuracy (all-time/7-day), per-confusable-group bars, weakest items, font fluency.
- **Settings** — romanization hide (global), light/dark "paper" themes, Korean TTS voice status + rate, JSON backup/restore.

Next: Phase B (sharing) is explicitly gated on a go decision; nearer-term polish ideas live in TASKS.md → Discovered work.

## Commands

```bash
npm install            # once; desktop shell also needs Rust (rustup) + WebKitGTK dev libs
npm run dev            # browser dev server (fast iteration)
npm run server         # translator proxy on :8787 — needs server/.env (copy server/.env.example)
npm run tauri dev      # the real desktop window (WebKitGTK)
npm test               # full Vitest suite (83 tests)
npm run validate:content  # pedagogy-rule content validator (also runs inside `build`)
npm run build          # validate + typecheck + production bundle
npm run tauri:build    # desktop bundles (AppImage + rpm) — wraps NO_STRIP=true, see below
```

**Translator setup:** copy `server/.env.example` to `server/.env`, add your Anthropic API key, run `npm run server` alongside the app. The key never enters client code — the browser dev server proxies `/api` to it, and the packaged desktop app calls `http://127.0.0.1:8787` directly. Without the server running, Explore shows a friendly typed error and everything else works offline.

## Project layout

```
src/content/    words/sentences/confusables/gap/modules JSON + module markdown (::vocab:: / ::sentences:: markers)
src/lib/        pure logic, no DOM: schemas, content validator, gating, distractors, stats, srs (FSRS), discovered, hangul/
src/db/         Dexie (IndexedDB) learner state + repo — knownWords, drillResults, srsCards, savedTranslations
src/features/   learn / drills (engine + 5 drills) / review (queue + session) / dashboard / explore / settings / onboarding
src/theme/      design tokens (paper + night-paper palettes), theme hook
src/audio/      ko-KR speechSynthesis singleton + hook (no-voice is a designed state)
server/         translator proxy (Hono + Anthropic SDK) — holds ANTHROPIC_API_KEY, zod-validates the contract
src-tauri/      Tauri 2 shell (no custom Rust beyond a Linux webview workaround)
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
