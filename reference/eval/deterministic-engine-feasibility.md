# Deterministic translator feasibility — 2026-10-22

**Recommendation: A's browser-compatible, closed-data architecture, narrowed to
exact corpus-sentence lookup and refusal. NO-GO for novel-sentence translation.**
The bounded A probe recovers the exact stored word-ID set in **407/1,439 (28.28%)**
sentences. B recovers **410/1,439 (28.49%)** with a minimal dictionary-to-course
adapter. Neither earns implementation of a general translator. This is a
feasibility finding, not a translation-rubric pass or a proof that morphology
cannot eventually be engineered. No rules were added to rescue these scores.

## Reproduce and provenance

Run from the repository, with Node 22 or later:

```sh
node reference/eval/measure-segmentation.mjs
node reference/eval/measure-segmentation.mjs --failures
```

The second command prints every failed sentence's ID, surface, expected and
predicted chunks, missing/extra word IDs, unresolved tokens and ambiguous IDs.
There are no dependencies, downloads, app imports or generated files. The
lexicon is constructed from `words.json` before the script loads sentence labels.
Each predictor receives only the joined Korean surface. No sentence lookup,
chunk dictionary, gold-ID tie breaking, notes-to-form extraction, training or
parameter fitting is used. `en`, `gloss`, `rom`, sentence notes and module IDs
are not predictor inputs. This diagnostic is not the novel recombination gate.

Data of record: commit `aacf191e16ab6513075530c2cbfc896a62191203`:

| File | SHA-256 |
| --- | --- |
| `src/content/words.json` | `6ff00bb0276172523851781d41f70d04e9fb93e087f422af636c296f5f6e372d` |
| `src/content/sentences.json` | `de6425ee0426b0f8adfa0bc908159054b1ea3f3743016ae14295a3df40069957` |

For B, obtain the two research assets from the upstream
[v6.2.0 release](https://github.com/lindera/lindera/releases/tag/v6.2.0), verify
these hashes, and extract them **outside the repository**. These are developer
research inputs, not product downloads or new repository dependencies.

| Asset | SHA-256 |
| --- | --- |
| `lindera-ko-dic-6.2.0.zip` | `3458c54ce21618693221ad9af2a49f547b40f0e50a7e19ca20cfa781673f3ed0` |
| `lindera-x86_64-unknown-linux-musl-6.2.0.zip` | `9046785476faeee4c2a9d3799b123b7307bdd186356c919ad955183042461d43` |

```sh
LINDERA_BIN=/tmp/daneo-lindera/cli/lindera \
LINDERA_DICT=/tmp/daneo-lindera/dict/lindera-ko-dic \
node reference/eval/measure-segmentation.mjs --failures
```

Both paths are required. No implicit dictionary name or downloader is used.
The probe prints the size and hash of every local dictionary file. The CLI
runs once over all inputs, producing one JSON token array per sentence.

## What the candidates actually do

**A:** a standalone JavaScript measurement of the proposed TypeScript approach,
using the same ordinary string/Map operations available in the webview.
Longest lexical prefix per whitespace-delimited eojeol, with the whole remainder
required to match the script's explicit particle/copula table. Inflected forms
are generated from dictionary headwords with a deliberately bounded table:
common consonant endings, modifiers, ordinary vowel contraction, 하다→해,
and polite present/past. Unknowns and equal-length homographs remain unresolved.
Particles are grammar, not lexical IDs. No irregular-class parser or broad
morphology engine is hidden in this script. Multiword dictionary expressions
are not joined across spaces; that is a measured limitation.

**B:** Lindera 6.2.0, normal mode and default ko-dic spacing settings. The adapter
reads `Inflect` expressions, appends 다 to verb/adjective/auxiliary/copula stems,
and resolves exact headwords against Daneo. It ignores J/E/S POS tags (particles,
endings and symbols), leaves unknowns/homographs unresolved, and does not compose
noun + derivational suffix into course 하다 compounds. Other token classes use
literal surface lookup. That simple mapping can misread suffixes as standalone
headwords; it is not a production linguistic adapter. Lindera's numeric word ID
is **not** a Daneo ID. B's number measures this stated integration baseline,
not an upper bound on Lindera's potential.

For authored chunk recovery, both probes retain eojeols as chunks, attaching
morphology inside each space-delimited unit. Neither contains a syntactic phrase
parser. This is why their boundary rates are identical; **it is not a claim that
Lindera produces the same morpheme boundaries as A**. The measured result exposes
that morphology alone does not recover Daneo's semantic teaching chunks.

## Scoring and results

Exact chunk success means the entire ordered list of nonempty, NFC-normalized
`ko[].t` chunks matches (internal whitespace normalized). Punctuation remains in
chunk scoring but is stripped for A's lexical lookup. The 64 sentences with an
empty Korean chunk retain their denominator but omit the invisible chunk from
surface-boundary scoring; reconstructing dropped subjects/roles is not tested.
Exact ID success means equal **sets** of predicted and stored IDs, with no
missing or extra IDs. All 1,439 sentences are included, with no abstention filter.
Micro recall/precision count sentence-ID incidences, not distinct vocabulary.
An exact ID match can still have unknown surface tokens because labels can be
incomplete; it is not a safe-to-answer signal.

Output (audit ID lists and per-file hashes omitted here; the script prints them):

```text
WORDS 5615 verbs 1286 adjectives 360 predicates 1646
IRREGULAR prose keyword mentions 53 own irregular descriptions after exclusions 43 structured conjugation fields 0
IRREGULAR labelled-note occurrences {"ㄷ":7,"ㅂ":47,"ㅅ":6,"르":36,"러":1,"ㅡ":19,"ㅎ":8,"우":0,"여":0,"ㄹ":18}
IRREGULAR broad markers 136 own-inflection descriptions 120 engineering cases 10
LABELS multiword-chunk sentences 1162 empty-ko-chunk sentences 64
A exact chunk boundaries 277/1439 (19.25%)
A exact wordId sets 407/1439 (28.28%)
A both 119/1439 (8.27%)
A wordId micro recall 5319/6583 (80.80%) precision 5319/5857 (90.81%)
A failure breakdown {"boundaryOnly":288,"idsOnly":158,"both":874,"unknownSentences":807,"ambiguousSentences":297,"missingIds":1264,"extraIds":538} missing by POS {"noun":536,"verb":539,"adj":172,"phrase":17}
A failure rows 1320 (all emitted with --failures)
B payload installed bytes 85610469 per-file gzip-9 bytes (installer proxy) 22305216
B exact chunk boundaries 277/1439 (19.25%)
B exact wordId sets 410/1439 (28.49%)
B both 124/1439 (8.62%)
B wordId micro recall 5403/6583 (82.08%) precision 5403/7163 (75.43%)
B failure breakdown {"boundaryOnly":286,"idsOnly":153,"both":876,"unknownSentences":644,"ambiguousSentences":161,"missingIds":1180,"extraIds":1760} missing by POS {"noun":407,"verb":618,"adj":135,"phrase":19,"adverb":1}
B failure rows 1315 (all emitted with --failures)
```

Boundary-only, IDs-only and both-failed counts are disjoint. Unknown/ambiguous
counts overlap those categories and each other. Missing/extra counts are ID
incidences. The complete per-failure breakdown is reproducible with `--failures`;
no large generated failure file needs to drift out of sync with the corpus.

Two label limitations prevent attributing every miss to conjugation:

- **1,162 sentences have a multiword teaching chunk.** For example,
  `s_m155_mountains` groups `금강산 사진을 보다가` as one chunk. Whitespace or
  morpheme segmentation cannot choose that semantic boundary without a parser.
- **Some stored word-ID lists are not exhaustive lexical inventories.**
  `s_m155_clinic` contains `소아과에 비해 외과는 수술을 더 많이 해요.` but records only
  `w_soagwa` and `w_oegwa`. Correctly recognizing 비하다, 수술, 더, 많이 and 하다
  produces extras under the requested exact-set metric. No labels were repaired
  and no gold-ID filter was added. The new recombination set needs an explicit
  distinction between a vocabulary checklist and exhaustive lexical annotation.

There is nevertheless substantial missing-lemma risk: A misses 539 verb and
172 adjective incidences, B 618 and 135. These are POS buckets, **not** a claim
that all 711/753 misses are irregular conjugation errors. Compounds, homographs,
limited endings and the ID inventory also contribute. A maps 마셔요 back to
`w_masida` (checked by an assertion); solving that example does not solve the
corpus. B's three additional exact-set successes do not establish a useful
advantage, especially with 1,760 extras versus A's 538.

## Conjugation inventory: prose is not an executable specification

Of **1,646 predicates**, **53** notes contain the literal word `irregular`.
After reviewing the ten explicit exclusions in the script, **43** describe the
entry itself rather than another headword, a frozen compound component, a
negation or the English meaning “irregular.” Searching also for named
`-family`, `-drop` and `-rule` markers finds **136** notes; excluding sixteen
cross-reference/frozen-component/non-own descriptions leaves **120** notes
about the entry's own inflection. **All 120 are prose only; zero entries have
structured conjugation fields.** These are reproducible marker-audit counts,
not a claim that only 120 predicates need special handling or that every prose
claim is linguistically correct. Bare example forms without these markers are
not counted. The script emits both inclusion and exclusion ID lists.

For example, 춥다 gives 추워요 without naming a class; 예쁘다 gives 예뻐요 without
naming ㅡ-drop. 떠올리다's note says “르-family” even though the headword ends in
리다: importing labels blindly would introduce a false rule. No content edits
were made as part of this measurement.

Budget **ten engineering cases** for a full conjugator: **eight named irregular
families** (ㄷ, ㅂ, ㅅ, ㅎ, 르, 러, 우, 여), plus **two predictable deletion cases**
(ㅡ and ㄹ). This is an implementation inventory, not a claim that all ten are
linguistically irregular. [NIKL's explanation](https://korean.go.kr/front/onlineQna/onlineQnaView.do?mn_id=98&pageIndex=1&qna_seq=323729)
distinguishes the predictable deletions from other irregular behavior.

| Case | Evidence and missing information |
| --- | --- |
| ㄷ | 듣다→들어요, but regular ㄷ stems must not change; seven labelled-note occurrences include a derivative reference. |
| ㅂ | Forty-seven labelled notes, with compounds/references mixed in; 돕다 and 곱다 need the 와 variant. |
| ㅅ | Six labelled notes; 낫다 describes disappearance without the `ㅅ-irregular` spelling. Regular stems need exclusion. |
| ㅎ | Eight labelled notes; bare examples and cross-references are not complete membership data. |
| 르 | Thirty-six labelled notes; derivatives and misleading labels require human review. |
| 러 | One explicit label, 푸르다. Sense-dependent 이르다 cannot be classified from its spelling alone. |
| 우 | Zero labels; `w_puda` gives a meaning, but no 퍼 form or conjugation rule. This is an uncovered case. |
| 여/하다 | Zero labels under that name; `w_hada` explicitly supplies 해요 and the 하다-family rule. The baseline handles the contraction, not the full ending inventory. |
| ㅡ deletion | Nineteen labelled notes, but examples-only entries are missed by the label audit. |
| ㄹ deletion | Eighteen labelled notes; endings and lexical distinctions still need explicit encoding. |

Occurrence counts overlap: they describe notes, not disjoint class populations.
[NIKL confirms 푸다→퍼](https://www.korean.go.kr/front/onlineQna/onlineQnaView.do?mn_id=&pageIndex=1&qna_seq=277706)
and [하다's 여 irregular family](https://korean.go.kr/front/onlineQna/onlineQnaView.do?mn_id=98&pageIndex=1&qna_seq=327030).
These external references explain the audit gap; they were not used to expand
the probe after seeing its score. Honorific lexical replacements, pronoun
contractions, copulas and ending chains are additional work, not “one more
irregular class.” None of this work is authorized as an implementation rescue.

## B's price and no-download constraint

**B can bundle its dictionary; it is not disqualified.** Lindera's
[versioned loader](https://github.com/lindera/lindera/blob/v6.2.0/lindera/src/dictionary.rs)
supports filesystem and embedded dictionaries. Its
[ko-dic build script](https://github.com/lindera/lindera/blob/v6.2.0/lindera-ko-dic/build.rs)
fetches `mecab-ko-dic-2.1.1-20180720.tar.gz` at build time for embedding. A build
pipeline can vendor/cache it or package the prebuilt local dictionary. Runtime
must select that local resource and fail closed if absent, never call the CLI's
download command. The probe used a local absolute path. This is a source-level
bundling finding, not a network-traced test of a future Tauri application.

Lindera code is [MIT](https://github.com/lindera/lindera/blob/v6.2.0/LICENSE).
The dictionary's actual bundled `NOTICE.txt` identifies mecab-ko-dic
2.1.1-20180720 and contains its Apache-2.0 license. Preserve both licenses and
applicable notices in any future distribution; do not mistake the wrapper's
MIT badge for the dictionary license.

| Measurement | Bytes | Interpretation |
| --- | ---: | --- |
| Official dictionary ZIP | 19,876,022 | 18.96 MiB archive, including notices/metadata |
| Unpacked dictionary | 85,610,469 | **81.64 MiB added installed resources** |
| Per-file gzip level 9 sum | 22,305,216 | **21.27 MiB compressed resource delta proxy**, before container overhead |
| Research Linux musl CLI | 8,434,128 | Standalone executable; **not** the linked Rust-library delta |
| CLI ZIP | 3,523,368 | Research tool distribution, not required in a Tauri library integration |

The script reproduces installed bytes and the gzip resource proxy. The official
ZIP supplies a second measured compression reference. **Actual AppImage/RPM/NSIS/
DMG installer delta is unmeasured**: compression, linking and platform overhead
change it. Price planning at roughly **19–22 MB of compressed dictionary payload
plus native code and container overhead**, and 85.61 MB of installed dictionary.
That is an estimate for later-version installers, not a fabricated before/after
installer measurement. No native app was modified or rebuilt, and no staged
0.1.0 installer or release checksum was accessed. A future decision to pursue B
would still require measured later-version packaging deltas on its targets.

B additionally needs a Tauri command, packaged resource resolution, a course-ID
adapter, phrase grouping and refusal policy. Its general lexicon is not a source
of reviewed glosses or cultural explanations. The dependency and shell-only
execution buy no demonstrated sentence-level recovery advantage here.

## Verification and disposition

`node reference/eval/measure-segmentation.mjs` and the local B command above
complete successfully. `--failures` accounts for all 1,320 A and 1,315 B failed
rows. Script assertions check 마셔요 recovery and refusal of an unknown token.
The required repository gates are recorded in the task log and issue closeout;
this report makes no UI, packaged-offline or translation-quality claim.

Owner: Duncan. This slice closes when this report and script are committed and
pushed and their exact commit's Actions run concludes success. The named next
action is Bad Dong's scope decision for the next slice: carry forward the
narrower lookup/refusal design rather than start the planned novel-input engine.
The recombination test population must continue to count novel-input refusals
honestly; lookup-only coverage cannot be presented as passing the unchanged
translation rubric. The model programme stays stopped and the sealed v3 set
stays unopened.

**Single recommendation: A, restricted to exact corpus-sentence lookup with a
refusal for everything else. NO-GO for the proposed novel-sentence translator;
stop before app implementation.**
