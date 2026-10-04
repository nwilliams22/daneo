# Deterministic fields on the six development replies — 2026-10-04

Source: `reference/eval/raw/dev-prompt-first-raw.jsonl`, selected first candidate in `dev-prompt-iterations.md`. Each of its six JSON replies was passed through the same `postprocessTranslation` function used by both Explore adapters. The exact before/after fields are in `raw/dev-deterministic-replay.json`. This is a replay of retained development output; it does not measure a new model reply or the shortened prompt.

| Dimension in `v0-rubric.md` | Before | After replay |
| --- | --- | --- |
| Meaning | Item 05 turned an honorific statement into a request | Unchanged; item 05 still fails |
| Korean word-order gloss | Item 01 split and mislabeled the object marker; item 06 split the location gloss | Unchanged |
| Noun particles | Item 01 claimed absent 을, item 03 omitted 도, item 04 called subject 가 a topic; item 05 mixed topic and subject wording | All six replies now list the noun particles actually present, with code-assigned roles. Those four defects are removed. |
| Polite register | Item 05's speech act failed | Unchanged |
| Romanization | 1/6 tracked its own Korean line; five malformed | 6/6 tracked the emitted Korean line under the corpus-based transliterator |
| Literal-gap claims | Existing claims retained | Unchanged |

The corrected fields do not repair the model's remaining meaning, gloss, register or literal-gap errors. The native follow-up with the shorter prompt, including warm latency, is still required before this becomes an observed after-run comparison.

## Gloss overlap audit — 2026-10-04

The source of truth is `reference/eval/v0-prompt-repair-review.json`. Of the six
frozen replies with a failed gloss dimension, five also fail the particle
dimension: EK-02, EK-03, KE-01, KE-02 and KE-05. KE-04 has a correct particle
list but omits 를 from the gloss. EK-02 also double-glosses negation, and KE-05
splits a predicate ending. These are distinct gloss defects that a corrected
`particles[]` field cannot by itself remove.

The retained development replay has two gloss failures (items 01 and 06).
Both remain after offline post-processing because that function leaves
`gloss[]` unchanged. Thus the measured gloss improvement from the current
particle pass is **0/2 on development replies**; the frozen overlap is
diagnostic evidence only, not a new scored gate run. Aligning gloss chunks to
computed particles would require a separate implementation and its own test.
