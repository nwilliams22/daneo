# Reference data (not app content)

## nikl-5965.tsv — 한국어 학습용 어휘 목록

The National Institute of Korean Language's learner vocabulary list:
**5,965 words** in three grades (A = 982 beginner, B = 2,111 intermediate,
C = 2,872 advanced). Frozen since publication (file dated 2003-05-19) —
this is the fixed ceiling CURRICULUM.md's three rings are measured against.

- **Source:** korean.go.kr → 자료 → 연구 조사 자료 —
  <https://www.korean.go.kr/front/etcData/etcDataView.do?mn_id=46&etc_seq=71>
  (attachment 한국어 학습용 어휘 목록.xls, converted to TSV verbatim)
- **Downloaded:** 2026-08-10
- **License:** KOGL Type 1 (공공누리 제1유형) — free use including commercial,
  with attribution to the National Institute of Korean Language (국립국어원).

Columns: `rank` (frequency rank), `word` (headword; trailing two digits are
homograph indices, e.g. 가다01), `pos` (품사: 명/동/형/부/대/관/감/의/보/수/고/불),
`hanja` (etymological hanja where applicable), `grade` (A/B/C).

This directory is **reference data for tooling** (`npm run coverage:nikl`),
not learner-facing content — nothing here is imported by the app bundle.
