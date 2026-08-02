# CURRICULUM.md — the Daneo content map

> Companion to PROJECT.md (rules) and TASKS.md (log). This file defines the
> **content ceiling** and the **full module skeleton** so every authoring
> session knows exactly what "done" means. Decided with Nick 2026-08-02.

## 1. The ceiling — beginner to full fluency, still finite

Korean splits into closed and open inventories. We finish the closed ones and
anchor the open one to a **fixed, published list** so "full fluency" is still
a finishable target:

| Inventory | Size | Status |
|---|---|---|
| **Hangul letters** | 40 jamo, 11,172 possible blocks — fixed for decades | ✅ **Closed & done** — 38 confusables, full 2-beolsik keymap, composer handles all blocks |
| **Glue (particles + patterns)** | ~25 particles; ~90 patterns to TOPIK-I level, ~300 to full learner competency | Finite — Ring 1 completes the beginner set; Rings 2–3 the rest |
| **Vocabulary** | Open-ended (500k+ dictionary entries) — but the **NIKL learner list is a fixed 5,965 words** graded beginner/intermediate/advanced (stable since 2003) | Ceiling = the full NIKL list, reached in three rings (below) |
| **Slang / loanwords** | Drifts with the culture | Deliberately OUTSIDE the rings — one "living" appendix module, allowed to date itself |

### The three rings (Nick, 2026-08-02: aim for beginner → full fluency)

| Ring | Target | Words (cumulative) | Coverage | How it's authored |
|---|---|---|---|---|
| **1 — Beginner** | ≈ NIKL grade A / TOPIK I | ~1,000 | ~75% of everyday speech | Hand-authored modules M1–M26 below — richest treatment (full glue payloads, interlinear sentences) |
| **2 — Intermediate** | + NIKL grade B | ~3,100 | ~90%+ everyday, most media with effort | Pipeline-assisted: NIKL slice → drafted module → curated. Leaner format decided when Ring 1 nears done |
| **3 — Advanced** | + NIKL grade C | ~6,000 (the full list) | "Educated fluency" — native media, abstract topics | Same pipeline; glue by then is mostly done, vocabulary is the whole payload |

Beyond 6,000 is native-speaker tail — that's permanently the Explore
translator + discovered deck's job, not module content. **No constant
updates at any ring:** the source list is frozen, so each ring is done when
its last module ships.

### Source lists & licensing (verified 2026-08-02)

- **한국어 학습용 어휘** (NIKL 2003, 5,965 words, 3 grades) — free Excel/text
  download from korean.go.kr, **KOGL Type 1** (attribution; commercial OK, so
  Phase C safe). This is the rings' source of truth.
- **한국어기초사전 / Korean Learners' Dictionary** (krdict.korean.go.kr) —
  CC BY-SA, free open API (key registration), per-word level grades +
  example sentences; Python wrappers exist (`krdict.py`). The Ring 2–3
  pipeline's raw material for glosses/examples.
- Plan: when Ring 2 starts, import the NIKL list as a **reference data file**
  (not app content) + a coverage script that reports which list words the
  authored modules have shipped — progress toward the ring becomes
  measurable.

**Ring 1 budget:** M1+M2 hold 69 words. 24 more vocab modules averaging ~38
words ≈ 912 → **~980 Ring 1 words**, plus 3 vocab-free interludes and the
slang appendix. (Rings 2–3 at this density would be ~130 more modules — the
leaner format/pipeline decision is deliberately deferred until Ring 1 is
nearly done and we know what module authoring actually costs.)

## 2. Module map — Ring 1

Interludes (~) are readings with no vocab checklist, like the Hangul history
module. Grammar listed per module is the *new* glue it introduces; sentences
may only use same-or-earlier vocabulary (validator-enforced, as always).

### Band 0 — shipped
| # | Module | Words | Glue |
|---|---|---|---|
| M1 | From Letters to Your First Sentences | 37 | 은/는, 이/가, 을/를, 에 · -아/어/해요 |
| ~ | The Story of Hangul | — | — |
| M2 | Numbers, Time, and Talking About Yesterday | 32 | 도, 에서, 하고 · past -았/었어요 |

### Band 1 — the grammar engine (M3–M10)
One substantial grammar payload each; themes chosen so the new glue has
natural sentences.

| # | Module (theme) | ~Words | New glue |
|---|---|---|---|
| M3 | Food & Eating | 38 | negation 안 / 못 · -고 싶어요 (want to) |
| M4 | People, Family & Being Polite | 39 | copula 이에요/예요/입니다 · 합니다-style · honorific -(으)시- (+ swap verbs 드시다/계시다) · 반말 preview *(Nick's register idea starts here)* |
| ~ | Spacing & Punctuation (띄어쓰기) | — | *(Nick's flagged idea — reading interlude)* |
| M5 | Counting Things & Telling Time | 36 | native numbers 하나–스물 · counters 개/명/마리/살 · 시/분 time |
| M6 | Places & Directions | 38 | position nouns 위/아래/앞/뒤/옆/안/밖 · (으)로 · 부터/까지 · 여기/거기/저기 |
| M7 | Describing Things & Feelings | 40 | connectives 그리고/그런데/하지만 · -지만 · 그래서 |
| M8 | Routines & the Future | 38 | future -(으)ㄹ 거예요 · progressive -고 있어요 |
| ~ | Why Korean Sounds Different Than It Reads | — | sound-change rules (연음, nasalization) — reading interlude |
| M9 | Requests, Offers & Shopping | 38 | -(으)세요 · -아/어 주세요 · -(으)ㄹ까요? · -(으)ㅂ시다 · 원/얼마 |
| M10 | Can, Must & Because | 36 | -(으)ㄹ 수 있다/없다 · -아/어야 돼요 · -(으)니까 / -아서 |

### Band 2 — thematic expansion (M11–M26)
~38–40 words each, exactly **one** light grammar point each — vocabulary is
the payload now.

| # | Theme | New glue |
|---|---|---|
| M11 | Weather & Seasons | ㅂ-irregular (덥다/춥다/맵다) |
| M12 | Getting Around (transport) | -(으)러 가다 (go in order to) |
| M13 | Home & Rooms | -기 전에 / -(으)ㄴ 후에 (before/after) |
| M14 | Body & Health | -지 마세요 (don't) |
| M15 | School & Studying | -기 시작하다 (start to) |
| M16 | Work & the Office | -아/어 보다 (try) |
| M17 | Hobbies & Sports | -는 것 (nominalizer) |
| M18 | Restaurants & Ordering | meal formulas (잘 먹겠습니다 family) as grammar-in-culture |
| M19 | Friends & Casual Speech | **반말 in full** — 안녕하세요 ↔ 안녕 pairs *(completes Nick's register idea)* |
| M20 | Phones, Internet & Messages | -(으)면 (if/when) |
| M21 | Clothes & Shopping II | -아/어 보이다 (looks/seems) |
| M22 | City & Nature | comparatives 더 / 제일 |
| M23 | Travel & Asking the Way | -(으)면 돼요 (it's fine if / just do X) |
| M24 | Opinions & Modifiers | noun-modifying -(으)ㄴ / -는 |
| M25 | Dates & Life Events | 년/월/일 dates · -(으)ㄹ 때 (when) |
| M26 | Korea & Culture (capstone) | -네요 (noticing) — and sentences that mine every prior module |

### Appendix — living content (outside the core ceiling)
| # | Module | Notes |
|---|---|---|
| S1 | Slang & Texting *(Nick's flagged idea)* | ~25 items. The one module that's ALLOWED to date itself; refresh occasionally or feed it from translator discoveries. Gap-item heavy by nature. |

## 3. Glue coverage checklist — Ring 1 (the beginner set)

Complete when the map above ships: all case/topic particles (은/는, 이/가,
을/를, 에, 에서, 도, 하고, (이)랑*, 와/과*, 의*, (으)로, 부터, 까지, 만*, 보다*
— *introduced inside Band 2 themes where natural); the noun copula
(이에요/예요/입니다 — landed in M4, an addition to the original map);
politeness registers
(해요체 ✅, 합니다체, 반말); tenses (present ✅, past ✅, future, progressive);
negation (안, 못, -지 마세요); desire/ability/obligation (-고 싶다, -(으)ㄹ 수
있다, -아/어야 되다); connectives & clause linkers (그리고, 그런데, 하지만,
그래서, -지만, -(으)니까, -아서, -(으)면, -(으)ㄹ 때); requests (-(으)세요,
-아/어 주세요, -(으)ㄹ까요?, -(으)ㅂ시다); irregulars (ㄷ ✅, ㅂ, 르 — 르 lands
in Band 2 where a 르-verb first appears); modifiers (-(으)ㄴ/-는) and the
nominalizer (-는 것). ≈ 90 patterns — TOPIK-I-level competency.

## 4. Per-module authoring contract

Every vocab module ships, in one session-sized unit:

1. **Words** — ~36–40 in `words.json` (`moduleId` set; particles as
   `pos: "particle"` outside the checklist), all typeable Hangul.
2. **Sentences** — 10–14 three-layer entries using only same-or-earlier
   vocab; at least one per new grammar point; dropped-subject `t: ""` where
   natural Korean drops it.
3. **Markdown** — module-N.md in the M1/M2 voice: intro → Part 1 concept →
   `::vocab::` → glue → `::sentences::` → practice 8 → what's-next.
4. **Gap items** — 2–5 where the theme genuinely produces literal/real gaps
   (don't force it).
5. **Confusables** — only if a truly new letter contrast appears (the set is
   essentially complete; expect ~zero).
6. **Registration** — modules.json (next `order`), content/index.ts markdown
   map.
7. **Green** — `validate:content`, full test suite, build; TASKS.md log
   entry.

Interludes are the same minus words/sentences/gap items.

## 5. Sequencing rules

- A module may assume ALL earlier modules (the validator enforces the word
  half of this; the author enforces the glue half — don't use a pattern
  before its module).
- Band 1 order is load-bearing (grammar builds on grammar). Band 2 modules
  are deliberately independent — they can ship in any order after M10, so
  authoring sessions can follow interest.
- The slang appendix can ship anytime after M19 (it leans on 반말).
