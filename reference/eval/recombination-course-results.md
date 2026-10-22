# Course translator: frozen recombination measurement

Measured 2026-10-22 through `translateCourse` in `src/features/explore/course-api.ts`, the exact adapter called by `ExplorePage.run`. **Score: 0/24 fully correct. Independent re-score agrees on all 24 items.** This is a development measurement, not a release decision or a spent sealed gate.

| Population | Fully correct | Refusals | Substantive answers |
| --- | ---: | ---: | ---: |
| Class 1: recombinations | 0/12 | 12/12 | 0/12 |
| Class 2: out-of-course | 0/6 | 6/6 | 0/6 |
| Class 3: near-misses | 0/6 | 6/6 | 0/6 |
| Total | 0/24 | 24/24 | 0/24 |

Must-answer refusal rate: **18/18 (100%)**. Out-of-course false-answer rate: **0/6 (0%)**; correct word-identifying refusal rate: **0/6 (0%)**, failure rate **6/6 (100%)**. All six refusals omit the required unknown-word identification. No observed meaning reversals, invented rules or thinking leaks (0/24 each). Zero substantive answers means this is no evidence of translation quality or a universal guarantee against invented claims.

## Why these results fail

The engine is intentionally exact Korean course-sentence lookup after the feasibility finding. The frozen population intentionally contains novel sentences, including nine English inputs; none may be replaced by a supported example. The adapter has no direction argument. The runner preserves each requested direction and sends input bytes unchanged, exactly as Explore does. All 24 results are the same typed `outside-course` error.

Classes 1 and 3 must answer under companion rule 1, so each refusal fails all six required dimensions by absence. `schemaComplete` is false for these 18; no translation direction was returned (`directionCorrect: null`, not credited). For class 2, schema and direction checks for substantive answers are not applicable (`null`). Rule 2 permits six-dimension passes only for a refusal that identifies the unknown word. The error names no word. Explore displays the submitted whole sentence separately, but neither selects nor identifies its untaught word. Echoing input is not a diagnosis. The engine’s internal `unresolvedInput` is not returned by this adapter and cannot be credited as an answer. Thus all six dimensions fail the companion refusal criterion on those six items too; that does not allege six false linguistic claims.

Items 08 and 17 also lack the required existential gap explanation; no decorative notes are required on the other must-answer items. Module ownership and grammar evidence below come from the frozen fixture; there is no corpusSentenceId because these are recombinations. A refusal needs no linguistic inference to establish the missing answer.

Romanization and particle identity are computed, not evidence of reasoning: the assembly path calls `romanize()` and `particlesIn()` (the latter in `src/lib/translation-postprocess.ts`, which also contains shared postprocessing). This run produced no translated lines, so it establishes no romanization or particle accuracy percentage.

The unchanged rubric requires complete substantive replies and ≥9/10 fully correct, with zero reversals or invented rules. This population creates no new release threshold. Its observed 0/24 (0%) fails the correctness bar and supplies no complete must-answer replies; the zero-tolerance flags alone remain clear. A narrower lookup product may still be useful, but shipping it is the next owner decision, not this report’s verdict.

## Per-item initial verdicts

| Item | Class | Input | Owning module / grammar, or required unknown word | Verdict |
| --- | --- | --- | --- | --- |
| recombination-dev-01 | recombination | I eat an apple. | m3 / m1 | Fail: required answer refused |
| recombination-dev-02 | recombination | 친구는 우유를 좋아해요 | m2 / m1 | Fail: required answer refused |
| recombination-dev-03 | recombination | I eat bread at school. | m2 / m1, m2 | Fail: required answer refused |
| recombination-dev-04 | recombination | 친구는 집에서 커피를 마셔요 | m2 / m1, m2 | Fail: required answer refused |
| recombination-dev-05 | recombination | I ate an apple yesterday. | m3 / m1, m2 | Fail: required answer refused |
| recombination-dev-06 | recombination | 친구도 학교에 가요 | m2 / m1, m2 | Fail: required answer refused |
| recombination-dev-07 | recombination | I do not eat bread. | m3 / m1, m3 | Fail: required answer refused |
| recombination-dev-08 | recombination | 오늘은 우유가 없어요 | m2 / m1 | Fail: required answer refused |
| recombination-dev-09 | recombination | My friend walks today. | m6 / m1, m6 | Fail: required answer refused |
| recombination-dev-10 | recombination | 제가 친구를 도와요 | m28 / m1, m28 | Fail: required answer refused |
| recombination-dev-11 | recombination | It is cold in Seoul today. | m12 / m1, m11 | Fail: required answer refused |
| recombination-dev-12 | recombination | 저는 집에서 음악을 들어요 | m2 / m1, m2 | Fail: required answer refused |
| recombination-dev-13 | near-miss | 저는 눈물을 봐요 | m14 / m1 | Fail: required answer refused |
| recombination-dev-14 | near-miss | My friend drank tea yesterday. | m2 / m1, m2 | Fail: required answer refused |
| recombination-dev-15 | near-miss | 저는 공을 차요 | m66 / m1 | Fail: required answer refused |
| recombination-dev-16 | near-miss | I hug my friend. | m28 / m1 | Fail: required answer refused |
| recombination-dev-17 | near-miss | 저는 집 안에 있어요 | m6 / m1, m6 | Fail: required answer refused |
| recombination-dev-18 | near-miss | I eat that apple over there. | m29 / m1, m29 | Fail: required answer refused |
| recombination-dev-19 | out-of-course | 저는 양자컴퓨터를 봐요 | 양자컴퓨터 | Fail: unknown word not identified |
| recombination-dev-20 | out-of-course | 저는 블록체인을 공부해요 | 블록체인 | Fail: unknown word not identified |
| recombination-dev-21 | out-of-course | 친구는 홀로그램을 봐요 | 홀로그램 | Fail: unknown word not identified |
| recombination-dev-22 | out-of-course | 저는 메타버스를 좋아해요 | 메타버스 | Fail: unknown word not identified |
| recombination-dev-23 | out-of-course | 저는 스마트워치가 있어요 | 스마트워치 | Fail: unknown word not identified |
| recombination-dev-24 | out-of-course | 친구는 텔레포트를 좋아해요 | 텔레포트 | Fail: unknown word not identified |

## Provenance and reproduction

- Recorded engine HEAD: `671db30c3c6db2ae1e31ec3535dfec6174b4cc4a` (ancestor of the report commit).
- Set SHA-256: `a97f2c4d0177389b42f1486c90536fa74634c2faa5f44a7b34a7ebb4d405a58d`.
- Unedited rubric SHA-256: `a73523d34276b81d31341846acc1d8e9d1b3833aedcdcf5838caec6368113550`.
- Prompt SHA-256: `636e7b0c6ead6fd6dbd37d2ec581e2af70df5d5142de801b77cf89211327a6a0` (recorded for rubric compatibility; not used by this engine).
- Runtime: `v26.3.1`; `node --import tsx reference/eval/run-recombination.mjs OUTPUT.jsonl`.
- [Raw adapter output](raw/recombination-course.jsonl): every item, complete errors, parsed replies and repeated provenance.
- [Initial per-dimension verdicts](raw/recombination-course-verdicts.json): all six dimensions, evidence, flags and requested direction.

Run from the repository root (use an untracked temporary output for replay):

```sh
node --import tsx reference/eval/run-recombination.mjs /tmp/recombination-replay.jsonl
python3 reference/eval/check-provenance.py reference/eval/raw/recombination-course.jsonl --report-commit HEAD --item-set reference/eval/recombination-dev-set.json
python3 reference/eval/test_provenance.py
git diff --exit-code 671db30 -- reference/eval/v0-rubric.md reference/eval/recombination-dev-set.json reference/eval/recombination-dev-set.sha256
```

The provenance checker now accepts this exact additional frozen-set path while retaining ancestry, prompt/rubric/set hashes, committed raw bytes and manifest verification. Its new regression exercises the development path and rejects a tampered manifest. No engine tuning, rubric edits, fixture edits, model run, release rebuild or sealed-set access occurred.

## Independent re-score

The [independent re-score on BAD-266](/BAD/issues/BAD-266#comment-ec787539-ac92-4d1f-9c43-4efc8e10c84b) agrees on every item: class 1 **0/12**, class 2 **0/6**, class 3 **0/6**, total **0/24**. There are no disputed dimensions or resolutions to apply. In particular, the independent review rejects whole-input echo as identification of an untaught word and confirms no reversals, invented rules or thinking leaks.

The initial verdict file remains unchanged, including its snapshot label that review was pending when it was written. The independent initial verdicts are retained in the linked task comment, including all 24 item failures and the six expected unknown words. Independent provenance verification reports 24 rows passing; all four provenance regression tests pass. The task thread records final CI confirmation and owns the later shipping decision handoff. This report is a measurement, not release authorization.
