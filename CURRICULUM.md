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

## 2b. Ring 2 — the intermediate ring *(scoped with Nick 2026-08-10)*

**Target:** the 1,735 remaining NIKL grade-B headwords (58% Sino — S3's
decoder pays compound interest) + the intermediate glue (~40 patterns,
TOPIK II-low). ≈ **40 modules** at the trimmed contract below. Module ids
continue m31+ (Learn labels them Module 31+; a Ring 2 divider on the Learn
page is a small pending app task).

### The trimmed contract (Ring 2 modules)

Everything Ring 1 proved essential stays; the ceremony goes:

1. **Words** — ~44 (40–48 ok), full decode/cross-reference notes REQUIRED
   (the app's soul is non-negotiable).
2. **Sentences** — **8** three-layer entries (module tests need ≥4); ≥1 per
   glue point; blocks-never-assemblies + the dup-sentence validator remain
   course-wide law. No warm-up box, no practice-8 section.
3. **Markdown** — slim: intro → one concept part → `::vocab::` → glue →
   `::sentences::` → short what's-next.
4. **Gap items** — 0–3, only when genuine.
5. **Registration + green + TASKS log** — unchanged.

### Band 4 — the grammar engine II (M31–M39, ordered)

Built on the B-list's abstract core (사회/경제/관계/경우/정도/방법 + the
grammar-verbs 대하다/위하다/통하다 + dependent nouns 데/뿐/가지).

| # | Theme | New glue |
|---|---|---|
| M31 | Korea on the Map (provinces, cities, 남산/한라산/덕수궁, world places — the B-list's own opener) | 마다 (every) |
| M32 | Society & the News | quoting -다고 하다 (+ 라고) |
| M33 | Saying & Asking II | -냐고/-자고/-아 달라고 · indirect -는지 |
| M34 | Thoughts & Seemings | -(으)ㄹ 것 같다 · -나 보다 |
| M35 | Becoming | -아/어지다 · -게 되다 |
| M36 | Done-To (the passive party: 보이다/들리다/열리다/닫히다) | passive 이/히/리/기 |
| M37 | Making-Do | causative 이/히/리/기/우 · -게 하다 |
| M38 | While & As Soon As | -(으)면서 · -자마자 · -는 동안 |
| M39 | Even If, Only If | -아/어도 · -아/어야 · 밖에+negative |

### Band 5 — themes II (~20 modules, order-free, one light glue each)

The concrete tail, revisiting Ring 1 territory a register deeper: Kitchen &
Cooking II (삶다/간장/-아 놓다), Body & Senses II (눈썹/털/처럼), Family &
Life II (손자/신랑/께서), Money & Work II ((이)나, 씩), Emotions II
(-잖아요/-거든요), School & Learning II (-기 위해), Media & Books, Nature &
Weather II, Health II, City & Streets II, Time II (-(으)ㄴ 지), Character
(-답다/-스럽다/-적), Sound & Music, Travel II, House II (대로)… — final
menu emerges from the slice file as authoring proceeds.

### Band 6 — the long tail (~10 packs)

Whatever resists theming, sliced by frequency rank with root-flavored
grouping where S3's tables apply. Garnish-free; notes still required.

### Ring 2 glue checklist (~40 patterns)

Quoting -다고/-라고/-냐고/-자고/-달라고 · indirect -는지 · **-는데/-(으)ㄴ데**
· -아/어지다 · -게 되다 · passive/causative 이/히/리/기(/우) · -게 하다 ·
-(으)ㄹ 것 같다 · -나/-(으)ㄴ가 보다 · -겠- (full nuances) · -(으)려고 (하다)
· -기로 하다 · -기 위해(서) · -(으)면서 · -자마자 · -는 동안 · -(으)ㄴ 지 ·
-아/어도 · -아/어야 · -아/어 놓다/두다 · -아/어 버리다 (formalized) · 처럼 ·
만큼 · 마다 · 씩 · (이)나 · 밖에 · 대로 · 께서 · -잖아요 · -거든요 · -죠 ·
word-builders -적/-스럽다/-답다. (-는데 is deliberately in Band 4's M33–M34
territory — it garnishes wherever it first fits naturally.)

### Pipeline (decided: slice script + hand-author)

`npm run ring2:plan` (scripts/ring2-plan.ts) validates
`reference/ring2-slices.tsv` — the word→module assignment ledger, filled in
per-module at authoring time. The script reports: assigned/shipped/remaining
counts per band, the unassigned B-gap pool by rank, and errors (word
assigned twice, word already taught, word not on the list). Authoring flow
per module = the Band 3 sweep flow: pick ~44 from the pool (script shows
candidates), dup-grep, author at trimmed depth, validate, ship, log. No
external APIs; 기초사전 stays a human reference only (CC BY-SA — never copy
its examples).

## 2c. Ring 3 — the advanced ring *(scoped with Nick 2026-09-19)*

**Target:** the ~2,500 remaining NIKL grade-C headwords (72% carry hanja;
1,476 nouns / 625 verbs / 164 adverbs / 156 adjectives / 27 dependent
nouns) + the advanced glue (~55 patterns, TOPIK II-high) that Ring 2 never
touched — a grep of every shipped md found only 듯이, 만하다 and 덕분에
mentioned, and only as word notes. The top of the C-list is the written
register (과정/현실/구조/가치/기업/선거…) and its own dependent nouns
(채/듯/바/셈/나름/마련) and grammar-verbs (인하다/비하다/불구하다/당하다)
ARE the glue, so Ring 3 opens with a grammar band the way Ring 2 did.
Module ids continue m85+.

### The contract (decided: Band 6 as-is)

Same pack contract as Band 6 — ~34 words (30–38 ok), 8 sentences, full
house-depth notes, garnish-free, 0–3 gap items, slim md — for both bands.
No new tooling: `verify-draft.py`, `lint_language.py`, `tools/`,
`merge-draft.py` and SHARED-BRIEF all apply unchanged. Band 7 modules
carry 3–5 glue parts each (the Band 4 shape); Band 8 packs carry none.

### Band 7 — the grammar engine III (M85–M96, ordered)

Twelve ordered modules on the top ~400 C-words by rank (the essay and
newsroom core). Themes and glue are the working plan; exact slices are cut
at reserve time into `reference/ring3-slices.tsv`.

| # | Theme (word seeds) | New glue |
|---|---|---|
| M85 | The Written Voice — the prose adverbs and connectors (따라서 그리하여 더욱 다만 일단 달리 결코 실제로 과연 아울러 앞서 널리 아예 비로소 그야말로 참으로 워낙 문득 다소 대체로 대개 상당히 사실상 서서히) + prose pronouns 그녀/그이/자네 | -(으)며 · -(으)므로 · -(으)나 · -고서/-고도 |
| M86 | Cause & Grounds (원인 근거 탓 바탕 영향 작용 인하다 비하다 불구하다 비롯하다 대책 방안 여건 사정 형편 처지 실정 반응 요구) | -(으)로 인해 · 에 비해 · 에도 불구하고 · -는 바람에 · -느라고 · -(으)ㄴ 탓에/덕분에 · -(으)ㄴ 나머지 |
| M87 | Seeming & Worth — the dependent nouns (듯 듯하다 만하다 셈 나름 마련 바 여기다 여겨지다 뜻하다 판단하다 평가 인식하다 의식 관점 시각 견해 논리 상식 의문 진실 진리) | -(으)ㄹ 듯하다/-듯이 · -(으)ㄹ 만하다 · -(으)ㄴ/는 셈이다 · -(으)ㄹ 법하다 · -기 마련이다 · -(으)ㄹ 리가 없다 |
| M88 | The Retrospective — time lived through (겪다 거치다 깨닫다 살아오다 살아가다 이래 직후 시기 시점 초기 중세 흐름 과정 단계 전환 회복 위기 운명 인연 삶) | -던 · -더니 · -았/었더니 · -더라고요 · -던데 |
| M89 | Degree & Extent (수준 규모 범위 평균 단위 대형 대규모 상당하다 엄청나다 거대하다 위대하다 뛰어나다 못지않다 불과하다 드물다 흔하다 풍부하다 증가하다 줄어들다 균형) | -(으)ㄹ수록 · -(으)ㄹ 정도로/-(으)ㄹ 만큼 · -(으)ㄹ 뿐(만 아니라) · 조차/마저 · -(이)야말로 |
| M90 | State & Society (기업 선거 의원 국회 장관 정당 후보 위원 위원장 주민 집단 조직 기관 기구 민주주의 민주화 민간 법률 법원 판결 재판 규정 권리 통제 지배하다 시위 범죄 폭력) | -고자 · -에 따라 · -에 의해 · -(으)ㄴ 결과 · 당하다-passives |
| M91 | Process & Structure (과정 구조 형태 형식 방식 구성 구성하다 구성되다 형성 형성되다 기능 절차 틀 토대 핵심 초점 본질 근본 근본적 기본적 요소 체계 영역 부문 분야) | -(으)ㄴ/는 바 · -다시피 · -(으)ㄹ 겸 · -는 김에 |
| M92 | Existence & Matter (삶 생명 존재 존재하다 우주 인류 물질 물체 목숨 현실 현상 정신 육체 심장 호흡 대기 기후 자원 태아 출산 자녀 신경 감각) | -(으)ㄹ 따름이다 · -기는 하다 · -기는커녕 · -(으)ㄴ/는 데다가 |
| M93 | The Analyst's Verbs (드러나다 지니다 갖추다 다루다 이끌다 파악하다 제시하다 지적하다 인정하다 분석 밝혀지다 살피다 지켜보다 알아보다 주장 비판 우려 전망 예상되다 강조) | -(으)ㄹ 테니까/-(으)ㄹ 텐데 · -(으)ㄹ걸요 · -길래 · -(으)ㄹ까 봐 |
| M94 | Motion & Mishap — the native verb shelf (잇다 걸치다 대다 삼다 두르다 감추다 매달리다 무너지다 흩어지다 흔들리다 빠져나가다 퍼지다 넘기다 거두다 저지르다 때리다 치르다 익히다 들이다 덧붙이다 둘러싸다 외치다 비치다 비추다 띄다 빛나다 실리다 이러다 그러다 일어서다) | -(으)ㄴ 채 · -다가 · -다 보니/-다 보면 · -(으)ㄹ 뻔하다 · -고 말다 · -아/어 대다 · -기 일쑤다 |
| M95 | Concession & Choice (반면 갈등 경쟁 경쟁력 협력 대응 극복하다 거부하다 제외하다 통합 개선 개방 공개 참여 지원 투자 부담 아무런 온갖 어찌 도대체) | -더라도 · -(으)ㄹ지라도/-(으)ㄹ망정 · -든지 · 대신에/반면에 · -는 한 · -기만 하면 |
| M96 | Culture, Stage & Press (연극 극 희곡 신화 철학 문화재 감독 연기자 매체 보도 화제 기록 비극 소재 제작 출신 학자 지식인 필자 스승 제자 용어 미 신분 세계관 이데올로기) | glue-light closer: whatever the checklist still owes |

### Band 8 — the long tail (~60 packs, M97+, order-free)

Everything left after Band 7, sliced by frequency rank with root-flavored
grouping (S3's tables), exactly Band 6: garnish-free, no glue parts, notes
still required. Batches of 2–3 packs via the drafter pipeline. The
unranked proper nouns (고구려/금강산/대학로…, POS 고) sort last and are
decided at the end — taught-as rows or a places pack.

### Ring 3 glue checklist (~55 patterns)

-(으)며 · -(으)므로 · -(으)나 · -고서/-고도 · -(으)로 인해 · 에 비해 ·
에도 불구하고 · -는 바람에 · -느라고 · -(으)ㄴ 탓에/덕분에 · -(으)ㄴ 나머지
· -(으)ㄹ 듯하다/-듯이 · -(으)ㄹ 만하다 · -(으)ㄴ/는 셈이다 · -(으)ㄹ 법하다
· -기 마련이다 · -(으)ㄹ 리가 없다 · -던 · -더니 · -았/었더니 · -더라고요 ·
-던데 · -(으)ㄹ수록 · -(으)ㄹ 정도로 · -(으)ㄹ 만큼 · -(으)ㄹ 뿐(만 아니라)
· 조차 · 마저 · -(이)야말로 · -고자 · -에 따라 · -에 의해 · -(으)ㄴ 결과 ·
당하다 · -(으)ㄴ/는 바 · -다시피 · -(으)ㄹ 겸 · -는 김에 · -(으)ㄹ 따름이다
· -기는 하다 · -기는커녕 · -(으)ㄴ/는 데다가 · -(으)ㄹ 테니까/텐데 ·
-(으)ㄹ걸요 · -길래 · -(으)ㄹ까 봐 · -(으)ㄴ 채 · -다가 · -다 보니/-다 보면
· -(으)ㄹ 뻔하다 · -고 말다 · -아/어 대다 · -기 일쑤다 · -더라도 ·
-(으)ㄹ지라도/-(으)ㄹ망정 · -든지 · 대신에/반면에 · -는 한 · -기만 하면.

### Pipeline (unchanged, new ledger)

`npm run ring3:plan` (the same scripts/ring2-plan.ts with `--ring 3`)
validates `reference/ring3-slices.tsv` and reports the grade-C pool; grade
A/B rows are flagged as lower-ring debt. Flow per batch = Band 6's:
reserve slices + write `brief-mNN.md` (owners verified with `tools/lookup.py`
and `tools/iou.py`, quotes checked) → commit → parallel drafters → review
(`verify-draft.py`, `tools/quotes.py`) → `merge-draft.py` → index.ts →
validate → one commit per module → push → delete drafts.

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
