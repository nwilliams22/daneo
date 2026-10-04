# Computed fields: six development inputs — 2026-10-04

This is a development run, not a frozen gate. The production `LocalTranslator`
in `prompt_probe` used the shorter shared prompt and the same local 4B GGUF as
the earlier first-candidate run. The native worker returned model JSON without
`romanization`; the shared `postprocessTranslation` pass supplied it and the
particle list. Source rows: `raw/dev-computed-native.jsonl` (after) and
`raw/dev-prompt-first-native.jsonl` (before). No v0, v1, or v2 item was run.

| Rubric dimension | Before | After | Evidence |
| --- | ---: | ---: | --- |
| Meaning | 5/6 | 5/6 | Item 05 remains a request instead of an honorific statement. |
| Korean word-order gloss | 4/6 | 2/6 | New replies for 01, 04, 05, 06 have split, omitted, or misidentified markers; the post-processor leaves `gloss[]` unchanged. |
| Noun-particle roles | 2/6 | 6/6 | The shared pass supplies the roles from the Korean line, including omitted 도 in 03 and subject 가 in 04 and 05. |
| Polite register and speech act | 5/6 | 5/6 | Item 05 still renders a statement as a request. |
| Romanization of the returned Korean | 1/6 | 6/6 | Code supplies all six strings; the model emits none. |
| Literal-gap claim | 5/6 | 5/6 | Item 05 still omits the meal/rice gap. |

The new run has **2/6 fully correct development items (02 and 03)** under
these item-level judgments. Computed fields do not repair meaning, gloss,
register, or literal-gap defects. The frozen v0 counterfactual remains **2/10**
fully correct, far below the ≥9/10 bar; this run does not rescore that gate.

Six after completions were 14,668, 15,672, 17,812, 14,742, 14,573 and
17,285 ms. The interpolated six-sample p95 is **17,680.2 ms**, compared with
**21,838.8 ms** for the earlier six-item native first candidate (18,004,
19,638, 22,179, 18,792, 18,155 and 20,818 ms): **4,158.6 ms lower**.
These are native probe timings on development inputs, not a desktop p95 or
the prior ten-item 73.568 s WebKit measurement. The desktop display socket
was unavailable in this run, so Explore rendering and saved-card behavior
were not observed.
