# Independent evaluation reservation freeze

Frozen 2026-10-04, before the compatibility smoke or full adapter training. This
is a reservation only. It does not authorize scoring, replace the frozen v2 ten,
or set an acceptance threshold.

## Source and scope

- Source corpus commit: `6587c1f9ef471eb9e50b7059fd99ee745d4c2a64`.
- Source files at that commit: `src/content/sentences.json` and
  `src/content/modules.json`. Each row's English and Korean strings join its
  nonempty `en` and `ko` chunk texts with one ASCII space, preserving source
  punctuation. `moduleId` comes from the module's `sentenceIds` membership.
- Frozen file: `training-independent-set.json`; its exact bytes are pinned in
  `training-independent-set.sha256`. The checker reads the source at the pinned
  commit, so later corpus edits cannot silently rewrite this reservation.
- These 60 rows are **additional** to the 10 v0, 10 v1, 6 dev and 10 v2
  reservations. All 96 IDs, English texts and Korean texts must be disjoint.
  Do not train on, self-distill from, paraphrase as training targets, tune on,
  or expose answers from any of these rows. Exclude all 96 before constructing
  smoke or full training examples.

## Exclusion rule

For text comparisons, apply Unicode NFKC, Unicode casefold, then remove all
Unicode whitespace and punctuation characters. Keep letters, numbers, symbols
and combining marks. This intentionally catches capitalization, width,
spacing and punctuation variants. Compare English only to English and Korean
only to Korean; compare `corpusSentenceId` exactly. A candidate is excluded if
**any one** of its three keys matches any reservation. The fixture stores exact
source text; the checker computes normalization at comparison time.

Run from the repository root:

```sh
python3 reference/eval/check-independent-freeze.py
python3 reference/eval/check-independent-freeze.py --candidates path/to/candidates.json
```

The optional candidate file is a JSON array or an object with an `items` array.
Each row supplies `corpusSentenceId`, `english` and `korean`. The second command
is a required preflight for any later training dataset generator. The checker
first validates the frozen manifest, pinned source text and all 96 exclusions.
It then rejects a candidate on any reserved key. This check does not construct
training examples or perform inference.

## Coverage review

The four `coverageClass` values mark a primary review lens, 15 rows each.
Several sentences exercise more than one lens. Every row was checked against
its corpus sentence and module at the pinned commit; the checker makes this
review reproducible.

| Class | Corpus examples and review focus |
| --- | --- |
| `gloss` | `s6_go_left` distinguishes heading `(으)로` from destination `에`; `s6_take_bus` treats the ridden vehicle as object; `s13_party_clean` keeps the before-clause order. Review chunk order and particle role. |
| `semantic-fidelity` | `s8_usually_subway` contrasts usual and today; `s10_must_study` preserves obligation; `s_m53_medicine_but` preserves the still-unrecovered contrast. Review actor, polarity, time, clause relation and speech act. |
| `register` | `s4_grandpa_home` uses honorific `계시다`; `s19_party_come` is a casual command; `s27_nice_meet` uses formal introduction style. Review honorific target and speech level, not just polite endings. |
| `literal-gap` | `s12_traffic_bad` says the road is blocked; `s18_cheers` literally dries the glass; `s_m61_going_crazy` is an imminent figurative complaint. Review whether a literal explanation accurately distinguishes the intended meaning. |

The freeze includes no learner records. It contains corpus-derived source strings
only. Review or scoring of model replies is a later, separate action.
