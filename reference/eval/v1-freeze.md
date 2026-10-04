# Phase D v1 translation gate freeze

Frozen on 2026-10-04 before any prompt or model change judged by this gate. This note and `v1-translation-set.json` are the complete freeze commit; it contains no prompt change, model change, or model-run output.

## Provenance

- Corpus commit: `59751c5f31a93e774324621fd08d6f2f77555443` (`git log -1 --format=%H` at freeze)
- Corpus sources at that commit: `src/content/sentences.json` and `src/content/modules.json`
- Fixture: [`v1-translation-set.json`](v1-translation-set.json)
- Fixture SHA-256: `186c59f618dea37307f745837fb72818e1d6cf4da430280b8299af158c31c983`
- Scoring rubric: [`v0-rubric.md`](v0-rubric.md), reused unchanged

The ten corpus sentence IDs below are absent from both the v0 and development fixtures. English-to-Korean uses five items and Korean-to-English uses five items.

## Frozen items and coverage

| Fixture ID | Corpus ID | Direction | Probed dimension |
| --- | --- | --- | --- |
| `DAN-V1-EK-01` | `s_friend_water` | English → Korean | Subject `가` versus object `을`; actor and object roles |
| `DAN-V1-EK-02` | `s_store` | English → Korean | Destination `에`; polite present ending |
| `DAN-V1-EK-03` | `s_school_study` | English → Korean | Action location `에서` versus destination `에`; object `를` |
| `DAN-V1-EK-04` | `s4_mother_teacher` | English → Korean | Topic `는`; polite copula `이에요` |
| `DAN-V1-EK-05` | `s4_sibling_no_korean` | English → Korean | Topic `은`, object `를`, and negation `몰라요` |
| `DAN-V1-KE-01` | `s_no_time` | Korean → English | Corpus-documented “time not-exists” literal structure and omitted possessor |
| `DAN-V1-KE-02` | `s2_now_work` | Korean → English | Corpus-documented literal `회사` (“company”) versus “office/work”; omitted subject and `에서` |
| `DAN-V1-KE-03` | `s2_music_too` | Korean → English | Non-obvious additive `도`, which replaces rather than stacks on the object particle |
| `DAN-V1-KE-04` | `s2_yesterday_school` | Korean → English | Omitted subject, past tense, and destination `에` |
| `DAN-V1-KE-05` | `s4_family_korea` | Korean → English | Topic `은`; living location `에` versus action location `에서` |

The two explicit literal-gap probes (`s_no_time` and `s2_now_work`) are documented in the sentence notes in `sentences.json`; their owning modules are `modules/module-1.md` and `modules/module-2.md`, respectively. The fixture points to those modules through `moduleId` and `moduleContent`.

## Scoring responsibility

Use the six dimensions and thresholds in `v0-rubric.md` without edits: all 10 replies must be schema-valid and have the correct direction; at least 9 must be fully correct; there must be zero meaning reversals and zero invented rules. Score the reply the user sees, including deterministic fields.

The deterministic-field change assigns romanization and particle identity/roles to application code computed from the Korean line. The model remains responsible for meaning, Korean word-order gloss, register, and literal-gap claims. The rubric still scores romanization and particle roles in the final assembled reply, regardless of which component computed them. No model was run against these ten items during the freeze.
