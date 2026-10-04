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
