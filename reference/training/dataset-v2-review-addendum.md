# Dataset v2 review addendum

- Candidate: `reference/training/dataset-v2-candidates.json`
- Candidate SHA-256: `e5f20abb43dfa55066ba23a1a41a3907964a7dc9194d59e32727b895dc290147`
- Scope: all 28 target patches in `dataset-v2-corrections.json`, register class, and training/development cross-row independence. No reserved fixture was opened; no inference or training was run.
- Verdict: **fail for approval**. The patched row targets pass this follow-up review, but candidate 062 remains too close to training weather examples for the requested source-derived variant independence check. Do not train or publish this split as approved until that issue is resolved and reviewed against a new candidate hash.

## Changed-row review

I checked each patch ID against the candidate row, including the target and matching outer `english`/`korean` field where applicable. All 28 patches are present. The Korean/copula and aligned-gloss repairs (004, 005, 032, 033, 095) are consistent; literal-gap/context edits and construction findings are represented in the target fields. Candidate 086, 101, 137, 160, 204, 208, 213, 242, 267, 286 and 290 also have their corrected natural English propagated to the outer `english` field. Korean input/target propagation is consistent for the corrected Korean rows.

The contextual treatment for 079, 139 and 154 is appropriate: the notes clarify ondol, 혼밥, and casual 반말 without asserting that the sentence itself is an idiom. Candidate 204 explicitly selects the listener-directed request reading of 가세요 and records the honorific-statement ambiguity. That is a valid target for this chosen reading, but the bare Korean input is intrinsically ambiguous; the literal-gap and cultural notes correctly avoid presenting the request as the only possible reading.

After applying the first report's row verdicts, the corrections file addresses all 25 rows previously marked “correction required” (24 training, 1 development). Its remaining three patches are construction/context findings. This reconciles the table discrepancy: the row verdicts count 7 training literal-gap corrections, not 13; the summary table's 13 is inconsistent. Total applied patches are 28, not 28 correction-required verdicts.

## Cross-row and class audit

All 60 training register rows, IDs 001–060, use polite speech: they end in polite declarative/interrogative forms such as 요/예요/이에요/해요/어요, or polite requests/imperatives such as 주세요, 주세요, 갈아타세요, and 나가세요. The 10 development register items likewise use polite forms. The register class is defensible as target-register coverage, though these are not minimal pairs and do not alone establish register discrimination.

The primary classes are defensible for the reviewed targets: the gap rows express literal/ordinary or lexicalized-meaning differences; gloss rows expose sentence structure; semantic-fidelity rows target sentence meaning; register rows consistently use polite forms. These labels describe the primary review/training lens and do not establish that each row tests only that dimension.

The candidate sequence has source families adjacent across the split. Most apparent commonality is shared grammar or topic, not a duplicate target: e.g. existential/location forms, plans, and movement sentences have different propositions. One cross-split pair needs treatment before calling development independent: training 044 `지금 비가 와요` (“It's raining right now”) and development 062 `눈이 오니까 조심하세요` (“It's snowing, so be careful”) reuse the same source-derived weather-subject + 오다 construction and lexicalized “rain/snow comes” mapping. Candidate 045 (`어제 눈이 왔어요`) adds another training snow/오다 example. This is more than Korean grammar alone: the held-out item directly rehearses the same weather predicate and literal-to-natural mapping used in training. The distinction in caution vs. report and snow vs. rain makes the sentences non-identical, but does not remove this shared source-derived variant. Remove/replace development 062 with a reviewed independent target or remove the overlapping training weather item, then rerun the review on the regenerated file.

The mechanical checker establishes exclusion from the reserved anchors and v1 rows and distinct normalized candidate keys. It cannot establish semantic independence from unseen sealed material; no such claim is made here.

## Evidence

From the repository root:

```text
$ sha256sum reference/training/dataset-v2-candidates.json
e5f20abb43dfa55066ba23a1a41a3907964a7dc9194d59e32727b895dc290147  reference/training/dataset-v2-candidates.json

$ python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v2-candidates.json
PASS: 60 independent anchors; 36 prior reservations; 96 unique IDs, normalized English and Korean texts
PASS: pinned corpus text/module provenance; 15 each gloss, semantic-fidelity, register, literal-gap; SHA-256 manifest
PASS: training/development disjoint by ID and normalized texts; all candidates avoid v1 training
PASS: 290 candidate rows avoid all 96 reservations; no internal duplicate keys
```

Checker exit code: **0**. This is a mechanical pass, not a semantic-independence pass.

## Closure

- Expected result: the final 290-row candidate has no shared source-derived semantic variant across training and development, and all row/class reviews pass.
- Evidence/source of truth: regenerated candidate JSON and its SHA-256; this report plus the 290 row verdicts in `dataset-v2-review-report.md`; `python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v2-candidates.json` for mechanical exclusions.
- Owner: Chani, who retains the parent dataset task.
- Closure condition: replace or otherwise resolve the 044/045/062 weather overlap, regenerate and hash the candidate, and obtain a follow-up review that passes the cross-row audit. This child review is complete with the failing verdict recorded.


## Follow-up review: replacement for development 062

- Candidate SHA-256: `dbe19f9cd6ed255d3794cd2ec49b34a8821044300b57f6a8c08e8c50600f90f1`
- Verdict: **pass for approval**.
- `DAN-V2-CANDIDATE-062` now cites pinned corpus sentence `s_m153_art`: `전시된 그림은 현대적일 뿐만 아니라 예술적이에요.` / “The exhibited picture is not only modern but also artistic.” Its source-note grammar and `전시되다` modifier are consistent with this sentence. It contains no weather predicate, 오다 mapping, or rain/snow subject. The specific overlap previously identified with training 044/045 is removed.
- Compared with the reviewed candidate bytes at commit `f2d3fc2` (SHA-256 `e5f20abb43dfa55066ba23a1a41a3907964a7dc9194d59e32727b895dc290147`), all 290 rows remain present and only row 062 changed. The other 289 rows are carried forward from the prior row-level review and this addendum's earlier register/class audit. The replacement correction is recorded in `dataset-v2-corrections.json` as `s12_snow_careful` → `s_m153_art`.
- The prior review's conclusions remain: all 28 target patches passed; all 60 training register rows use polite speech; assigned primary classes are defensible; the summary discrepancy reconciles to 7 training literal-gap corrections in row verdicts (not 13), with 24 training + 1 development correction-required rows and 3 construction findings addressed. The earlier addendum records the detailed findings.
- This resolves the only cross-split semantic overlap identified by this audit. It does not prove independence from unseen sealed material; the checker below establishes mechanical exclusion only. No reserved fixture was opened and no inference or training was run.

Evidence from the repository root:

```text
$ sha256sum reference/training/dataset-v2-candidates.json
dbe19f9cd6ed255d3794cd2ec49b34a8821044300b57f6a8c08e8c50600f90f1  reference/training/dataset-v2-candidates.json

$ python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v2-candidates.json
PASS: 60 independent anchors; 36 prior reservations; 96 unique IDs, normalized English and Korean texts
PASS: pinned corpus text/module provenance; 15 each gloss, semantic-fidelity, register, literal-gap; SHA-256 manifest
PASS: training/development disjoint by ID and normalized texts; all candidates avoid v1 training
PASS: 290 candidate rows avoid all 96 reservations; no internal duplicate keys
```

Checker exit code: **0**. Replacement and cross-split verdict: **pass**. Hash-bound approval: `dataset-v2-approval.json`.

Closure: expected result is the 290-row reviewed candidate with no identified shared source-derived semantic variant across training and development. Evidence/source of truth is the candidate hash, the 290-row report and addendum, and the mechanical checker command above. Owner of final dataset manifest and development freeze: Chani. This review child closes when this follow-up verdict and hash-bound approval are committed; the checker does not certify semantic independence from unseen sealed content.
