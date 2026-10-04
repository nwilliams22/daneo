# Phase D v0 translation evaluation rubric

Frozen on 2026-10-04, before prompt tuning. Use [`v0-translation-set.json`](v0-translation-set.json) as the ten exact inputs. **All ten items are held out and excluded from any future training data**, including synthetic examples, fine-tuning, prompt examples, and prompt tuning. If the fixture must change, make a new version and retain this one; do not silently edit a scored set.

## Provenance rule for future held-out runs

This rubric is deliberately reused unchanged for every replacement held-out set, including v1 and
v2. Do not create a version-specific rubric or alter its thresholds, dimensions, or zero-tolerance
rules; the replacement set path is supplied to the checker for each run.

Every raw output row must record the runner's `git rev-parse HEAD`, the SHA-256 of
`src/lib/translation-prompt.json`, this rubric, and the frozen item set. A held-out run is
**void** if its recorded HEAD is not an ancestor of the commit containing its own report, or if
its recorded prompt hash does not match the prompt at that HEAD. The rubric and set hashes must
also match the files at that HEAD, and the set hash must match its committed manifest. Run
`python3 reference/eval/check-provenance.py RAW.jsonl --report-commit REPORT_COMMIT --item-set reference/eval/v1-translation-set.json`
to check these conditions; use the selected frozen set path for each rung. Commit `017eb4e` is the
worked example of the failure: the prompt change, dev set, and held-out outputs first appeared
together, so their order could not be proved.

The replacement frozen gates are [`v1-translation-set.json`](v1-translation-set.json) for the
deterministic rung and [`v2-translation-set.json`](v2-translation-set.json) for the fine-tune; the burned
v0 items remain excluded from all future gates and training data.

## Sources and procedure

The fixture's `corpusCommit` is the output of `git log -1 --format=%H` when this set was frozen. At that commit, `src/content/sentences.json` supplies each `corpusSentenceId`'s English, Korean, interlinear gloss, romanization, and note. `src/content/modules.json` assigns the sentence to `moduleId`; `moduleContent` names that module's own lesson in `src/content/modules/`. **The sentence and its owning module settle meaning.** The `corpusAnchor` is a quick reference, not an exact-match gold answer. Cloud output is comparison evidence only.

For each item, send `input` exactly as stored, with `direction` as the requested direction. Do not add punctuation or whitespace. The input text joins nonempty source-language chunks with one ordinary space; empty alignment chunks represent understood words and are not printed. Record the model/runtime version, prompt revision, raw final reply, parsed reply, and a per-item verdict. Preserve raw replies even on failure. Score the final reply under the existing `translationResultSchema` in `src/lib/schemas.ts`; progress tokens are not a final reply. Do not use this set to choose or rewrite a prompt before recording the first baseline verdict.

## Proposed v0 acceptance thresholds (not observed results)

- **10/10 schema-valid and complete replies**, correct direction, no leaked thinking text.
- **≥9/10 fully correct** on meaning / Korean word-order gloss / particle roles / polite register / romanization / literal-gap claims.
- **Zero meaning reversals or invented grammatical or cultural rules.**

These are proposed acceptance thresholds from `PLAN-local-model.md` v0 exit evidence, not measured outcomes. A schema failure, incomplete reply, wrong direction, or leaked thinking text fails the gate even if the language looks sound. Count an item as fully correct only when every applicable dimension below passes. The zero-tolerance rule applies to all ten replies, including the one item the 9/10 allowance might otherwise permit.

## Scoring an item

First check that the final reply is complete JSON accepted by `translationResultSchema`: `direction`, `korean`, `romanization`, `natural_english`, `gloss[]`, `particles[]`, `literal_gap`, and `cultural_note` are present with their required types. Nonempty strings are required where the schema requires them; empty strings or arrays are allowed only where the schema allows them and where the sentence warrants no content. `direction` must match the fixture direction. There must be no text outside the JSON that exposes reasoning or thinking, and no such text hidden inside its fields. A partial, cut-off, or internally contradictory reply is incomplete even if a permissive parser accepts it.

Then mark each of these dimensions pass or fail:

1. **Meaning:** `natural_english` conveys `expectedReadingEnglish`; `korean` expresses the same proposition or request. Preserve the actor, action, object, time, polarity, and speech act where present. For Korean inputs, understood subjects can vary with context: `s2_yesterday_friend` supports an omitted first person in the lesson, but a reply must not claim Korean explicitly names “I.” For English inputs, accept the `acceptableAnswerNote`'s natural alternatives; the anchor Korean is illustrative, not the only valid translation. Do not infer extra events or preferences from the text.
2. **Korean word-order gloss:** `gloss[]` follows the Korean phrase in `korean` from left to right, identifies its meaningful chunks, and gives an English-in-Korean-order reading. An understood subject may be marked as omitted, but must not be claimed as an overt Korean word. The gloss must keep the action and negation on the correct verb and cannot rearrange chunks into ordinary English order while presenting that as Korean order. Equivalent chunk boundaries are acceptable when the same roles and order remain clear.
3. **Particle roles:** `particles[]` describes every meaning-bearing particle actually used in `korean` and does not invent one. Topic 은/는 marks a topic or contrast, subject 이/가 a grammatical subject, and object 을/를 the thing acted on. A reviewer checks the actual chosen wording, including permissible omissions; an empty list is valid only if that wording has no particle to explain. Do not count a verbal ending as a noun particle.
4. **Polite register:** The Korean line must fit the polite 해요 register used by these lessons, including a respectful subject marker for `s4_teacher_comes` and a request, not a report about an honored subject, for `s9_sit_here`. A variant polite form may pass if it preserves the speech act and social relation. Casual 반말, an accidental command, or honorifics aimed at the speaker fail.
5. **Romanization:** `romanization` must track the `korean` line the reply actually gives, in order and without omitted, added, or wrong lexical syllables. Accept consistent conventional spellings and pronunciation-oriented variants; do not exact-match the corpus anchor when the Korean answer is a valid variant. An empty romanization for a nonempty Korean line fails.
6. **Literal-gap claims:** `literal_gap` must distinguish word-for-word structure from the real reading when the item tests one: `s_eat` permits 밥 “cooked rice” but means food/a meal in ordinary use; `s_food_delicious` has the taste-exists construction yet means “the food is delicious”; `s3_no_sugar` uses “sugar not-exists” for no sugar; `s8_wash_hands` and `s2_yesterday_friend` leave a subject or possessor understood. A concise correct explanation passes; an empty field fails when it hides the probed gap. On an item without a meaningful literal gap, an empty field passes. An unsupported cultural story or grammatical generalization in either `literal_gap` or `cultural_note` fails.

The dimension list is conjunctive: a failure in one makes the item not fully correct. Record a separate **meaning reversal** flag for a reply that flips polarity, agent/patient, time, or request versus statement. Record an **invented rule** flag for a confidently stated false grammatical or cultural rule, even if its translation happens to be good. A merely awkward but valid phrasing is not an invented rule.

Use a per-item record with `id`, `rawReply`, `schemaComplete`, `directionCorrect`, `thinkingLeak`, six dimension verdicts with short evidence, `meaningReversal`, `inventedRule`, and `fullyCorrect`. The overall record reports each count and whether every proposed threshold passes. If two reviewers disagree, cite the fixture item, corpus note, and owning module passage, then resolve the disputed dimension before recording the final count. Keep both initial verdicts with the resolution.
