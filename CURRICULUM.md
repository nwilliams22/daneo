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
| ~ | The Story of Hangul | — | — *(moved to the front 2026-08-02 — read the design story, then learn the letters)* |
| M1 | From Letters to Your First Sentences | 37 | 은/는, 이/가, 을/를, 에 · -아/어/해요 |
| M2 | Numbers, Time, and Talking About Yesterday | 32 | 도, 에서, 하고 · past -았/었어요 |

### Band 1 — the grammar engine (M3–M10) — ✅ shipped in full 2026-08-02
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

### Band 3 — the Ring 1 sweep (M27–M30) *(added 2026-08-10)*

Driven by data, not themes-first: the NIKL coverage report (`npm run
coverage:nikl`) surfaced 307 grade-A headwords the thematic modules never
had a home for, and a howtostudykorean.com survey confirmed several **glue
debts** — high-frequency machinery their beginner unit teaches that Ring 1
skipped. Each sweep module clears one coherent cluster of both. Same
authoring contract as Band 2.

| # | Theme | Payload (words) | New glue |
|---|---|---|---|
| M27 | The World and Its People | countries (미국/일본/중국/영국/독일/프랑스/러시아/캐나다/호주), compass 동/서/남/북쪽, 고향, spouses 남편/아내 + 부모님, street titles 아저씨/아줌마, roles 교수/환자/군인/경찰/주인, buildings 교회/극장/서점/우체국/대사관/기숙사, 여러분/말씀/분, 키/편지/반갑다/오랜만 | **에게/한테/께** (to-a-person — pays M8's 전화하다 IOU) · **-들** (plural) · the 어느-나라 kit |
| M28 | In and Out, Up and Down | the 가다/오다 compound-motion system (들어가다/들어오다/나오다/올라가다/내려가다/내려오다/다녀오다/가져오다/걸어가다…), hands verbs (들다/내다/가지다/잡다/넣다/놓다/팔다/안다/묻다/잃다/뛰다/날다/생기다/돕다/나다), inside-words 속/밑/가운데/끝, 잠/낮 | **-지 않다** (long negation — the missing third negation) |
| M29 | The 그렇다 Machine and the Little Words | bare determiners 이/그/저 + 모든/여러/아무/다른, adverbs 가장/매우/모두/함께/또/꼭/계속/갑자기/바로/언제나/참/잠깐, interjections 아/그래/아니/참, 나쁘다(!)/즐겁다, 걱정/생활 | **그렇다** + its connective children (그러나/그러면/그럼/그러니까/그렇지만/왜냐하면) · **때문에** |
| M30 | Counting II and the Household | native tens 서른–아흔 (ages 30+!), ordinals 첫째–, units 미터/센티미터/퍼센트/달러/개월/일주일 + counter 장, household 칼/식탁/수건/비누/치약/칫솔/휴지, fruit basket 수박/딸기/포도/오렌지, animals 닭/돼지, foods 갈비/냉면/사탕/초콜릿 + Konglish batch (샌드위치/햄버거/피자/콜라/테이블/라디오/슈퍼마켓), 흰색/장미/잎/가슴/손가락 | **만** (only) · **(이)랑 / 와·과** (and-with, casual + formal registers of M2's 하고) |

Remaining A-gaps after the sweep are pattern-artifacts (months, -어
languages, Sino tens, 하다-noun halves) tracked in the taught-as allowlist,
plus a small dated tail (공중전화, 볼펜) left to Ring 2.

### Appendix — living content (outside the core ceiling)
| # | Module | Notes |
|---|---|---|
| S1 | Slang & Texting *(Nick's flagged idea — ✅ shipped 2026-08-10, order 36, "Last refreshed: August 2026")* | 27 items + 5 gap items, 8 반말 sentences. The one module ALLOWED to date itself; refresh from translator discoveries (the md tells learners to run the three machines — 준말 / Konglish / compound — then confirm in Explore). Labeled "Appendix S1" in Learn (ids starting with s- get appendix labels, outside the Module/Reading numbering). |
| ~ | Interlude: 준말 — Korean Shrinks *(Nick, 2026-08-10, via HTSK — ✅ shipped 2026-08-10, order 34)* | The contraction system as a system: 것→거, 저는→전, 나는→난, 이것이→이게, 무엇→뭐, 요즈음→요즘, 그러면→그럼, 오래간만→오랜만 — the learner has met a dozen of these as one-off notes; this reading unifies the rule (Korean shrinks what it says often). Texting clips (ㅋㅋ/ㅇㅇ/ㄱㅅ) hand off to S1. |
| ~ | Interlude: Konglish — the Adaptation Machine *(Nick, 2026-08-10, via HTSK — ✅ shipped 2026-08-10, order 35)* | The scattered loanword notes, systematized: how English maps into Hangul phonology (f→ㅍ, z→ㅈ, th→ㅅ, final consonants get 으/이), clipped compounds (셀카, 에어컨, 아파트), made-in-Korea English (핸드폰, 원피스, 서비스), false friends (미팅, 컨닝, 화이팅). After this, new Konglish is decodable on sight. |
| S2 | The Written Register *(Nick's "archaic connectors" idea — ✅ shipped 2026-08-10, order 37: 15-word sign-decoding kit + 6 sign/headline sentences + 2 gap items)* | The connectives you READ but rarely say: 및, 또는, 즉, 그러므로, ~(으)며, ~고자 — signs, forms, news headlines, exam instructions. Ties to M29's 그러나 (the spoken/written register table). Old forms still alive in fixed phrases get a corner (하오체 on elevator buttons: 미시오/당기시오). |
| S3 | Hanja, the Cheat Code *(✅ shipped 2026-08-10, order 38, wordless decoder reading)* | The course teaches ~60 Sino roots by stealth (학/국/어/원/실/장/관/식/전/화/일/생…) — this appendix formalizes the decoder table: recognize the root, guess the word. Recognition only, no writing. HTSK runs a full hanja track; ours stays a lens on vocabulary already owned. |

**Ring 2 glue notes (HTSK survey, 2026-08-10):** their lower-intermediate
unit slots these before we do — passive/causative pairs (보이다/들리다 are
already vocab; the SYSTEM is Ring 2 glue), -아/어지다 (become), ~적/~스럽다
word-builders (자랑스럽다 already models the latter), indefinite compounds
(아무도/누구나/뭔가), quoting -다고. All noted for the Ring 2 format
decision — none block Ring 1.

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
4. **Recycling — blocks, never assemblies** *(Nick, 2026-08-02)* — each
   module reinforces its predecessor, but always in NOVEL surface forms, so
   recall is generative rather than recitation:
   - the markdown opens with a **Warm-up box**: 3 prompts buildable from
     the previous module's blocks — but combinations the learner has
     **never seen written**, proving transfer, not memory;
   - **≥3 sentences** carry the *previous* module's glue or signature vocab
     as their visible payload — again in fresh combinations;
   - **no sentence appears twice anywhere in the course** — enforced by the
     validator (`dup-sentence-text`). Phrase-level overlap between sentences
     is acceptable when the natural sentence wants it (Nick, 2026-08-09) —
     the more unique the better, but don't contort content to dodge a shared
     phrase. Fixed formulas (잘 먹겠습니다, 어서 오세요…) are exempt
     entirely: those are memorized verbatim by design;
   - practice keeps 1–2 cumulative items; vocab notes cross-reference
     decomposable earlier parts (the standing convention, now required).
   The FSRS queue handles item-level retention; this keeps the content
   itself spiraling — same machinery, never the same sentence.
5. **Gap items** — 2–5 where the theme genuinely produces literal/real gaps
   (don't force it).
6. **Confusables** — only if a truly new letter contrast appears (the set is
   essentially complete; expect ~zero).
7. **Registration** — modules.json (next `order`), content/index.ts markdown
   map.
8. **Green** — `validate:content`, full test suite, build; TASKS.md log
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
