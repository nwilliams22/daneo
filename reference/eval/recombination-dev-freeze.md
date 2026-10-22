# Recombination development population, version 1

Frozen 2026-10-22 for Phase E slice 2. This is **development only**, not a
held-out gate, a model dataset, or a release qualification. No engine was run.
The sealed v3 set remains unspent. The model programme remains stopped.

## Population and size

[recombination-dev-set.json](recombination-dev-set.json) contains **24 distinct
prompts**, with **9 English-to-Korean and 15 Korean-to-English** inputs. They
are authored recombinations, not corpus sentences. No mirrored duplicates inflate
the count. Every English and Korean text differs from every full corpus sentence
under the existing checker's NFKC/casefold/whitespace/punctuation normalization.

- **Class 1: 12 recombinations, 6 in each direction.** One probe each for a new
  regular object, 하다 contraction, action location with a new object, 마시다
  contraction in a new location, past tense, additive 도, negation, existential
  absence, 걷다 irregular, 돕다 plus 제가, weather ㅂ irregular, and 듣다
  irregular. These are a diagnostic minimum spanning the machinery the first
  engine must handle, not a sample claiming coverage of all 5,615 headwords.
- **Class 2: 6 Korean refusal prompts.** Four familiar frames (seeing, liking,
  studying, possessing) surround unseen technical nouns. Seeing and liking each
  have two distinct targets to probe both compounds and familiar-looking
  loanwords without letting one frame or one unknown string stand in for all
  refusals. Six is enough for those contrasts; unrelated obscure words would
  only pad the set. This version tests the **untaught-word** branch of the
  out-of-course definition. It does not claim coverage of untaught constructions.
- **Class 3: 6 near-misses, 3 in each direction.** One each for 눈물 versus its
  component prefixes, 차 as tea, 차다 as kick, 안다 versus negation/sitting,
  position noun 안 versus negation, and 저 as both pronoun and determiner.
  These remain must-answer items, not an ambiguity-based refusal allowance.

The population intentionally stays frozen even if the feasibility result leads
to corpus-only lookup. Refusing its 18 taught prompts would then expose that
scope limit; it must not be relabeled as success. Adding harder grammar later
requires a new version, retaining this file and its hash.

## Reading and provenance

`corpusCommit` pins the authoring sources. `sourceSha256` covers words, sentences,
module ownership/order, every referenced lesson, and the **unchanged** v0 rubric.
The fixture's sibling `.sha256` freezes the exact JSON bytes. No
`corpusSentenceId` is claimed: these sentences have no corpus anchor.

For each must-answer item:

- `wordIds` and the chunk-level IDs name the taught lexical entries, including
  the intended sense of homographs. Productive particle/ending morphology is
  justified by `grammarModules`; it is not misrepresented as an extra noun.
- `lastVocabularyModule` is the highest-order module introducing those words.
  `moduleId` additionally includes the latest required grammar lesson. Lesson
  ownership and all source bytes are checked, not inferred from numeric IDs.
- `expectedReadingEnglish`, Korean chunks and their ordered gloss describe the
  expected reading. They are review references, not exact-string answer targets.
  English articles and an ordinary contextual “my friend” are not overt Korean
  morphemes. A Korean answer need not insert possession when English says
  “my friend”; a Korean-input answer may say “the/a friend”.
- `literalGap` names the required distinction for the two existential probes.
  An empty field means this item has no meaningful gap to explain. Unsupported
  cultural stories are never expected.

M1 supplies noun particles and polite forms; M2 supplies 에서, 도, past tense and
듣다; M3 supplies negation; M6 supplies positions and 걷다; M11 supplies the
weather ㅂ family; M28 and its word notes supply 돕다/안다; M29 supplies distal
저; M66 supplies the kick sense of 차다. The word notes distinguish 눈물 and
차. These frozen sources settle the component meanings and morphology. The
new sentence readings are authored expectations and remain subject to language
review: the checker cannot prove semantic correctness from word IDs alone.

For refusal items, `unresolved` names the exact untaught headword and
`expectedRefusal` gives an example of the explicit response. `english` is
collision-check metadata only, **not a permissible answer**. Presence of familiar
substrings or knowledge of an English loanword does not license a guess.

## Companion scoring rule

[v0-rubric.md](v0-rubric.md) is unedited. Keep its six conjunctive dimensions,
meaning-reversal flag, zero-tolerance `inventedRule` flag, schema/direction checks
for substantive answers, and literal-gap allowance.

1. **Class 1 and class 3:** the engine must answer. A refusal fails the item.
   Evaluate substantive replies under all six rubric dimensions against the
   authored reading and pinned component/lesson evidence. Equivalent natural
   Korean is allowed if it uses taught material and preserves the proposition.
2. **Class 2:** an explicit “that is outside the course” refusal that names the
   unresolved word passes **all six dimensions**. No translation-result payload
   is required for this refusal disposition. Record `refusalCorrect: true` and
   `schemaComplete: null` (not applicable to refusal), preserving the raw reply
   and requested direction. This companion rule defines the new population's
   refusal outcome; it does not modify the translation-result schema or rubric.
   A blank, generic error, silent omission of the unknown word, or refusal that
   does not identify it fails. **Any substantive answer fails**, including a
   plausible translation accompanied by a disclaimer. A fabricated grammatical
   or cultural claim additionally sets `inventedRule: true`.
3. Empty `literal_gap` passes when there is no meaningful gap. It fails when it
   hides the existential distinction probed by items 08 and 17. Do not demand
   decorative gap or culture text on the other items.

Preserve raw replies and per-dimension evidence, plus `itemClass`, response
`disposition` (`answer` or `refusal`), and refusal correctness. Report class
counts separately: **12 answer / 6 refusal / 6 near-miss**, including must-answer
refusal rate and false-answer rate on out-of-course inputs. Never let six easy
refusals hide poor recombination coverage in an aggregate. This development set
adds no replacement release threshold; the rubric's existing gate thresholds
remain unchanged, and spending a sealed gate still requires the owner decision.

## Reproduce the freeze check

From the repository root:

```sh
python3 reference/eval/check-recombination-freeze.py --self-test
git diff --exit-code 7ee3d57a5fc6b6d1f4724647b37c6b41d03d1d71 -- reference/eval/v0-rubric.md
```

Observed output (exit 0):

```text
PASS: 24 development items: 12 recombinations, 6 refusals, 6 near-misses; direction counts 9 en-to-ko / 15 ko-to-en
PASS: SHA-256; pinned sources and unchanged rubric; taught word IDs/modules/chunks; zero corpus text collisions
PASS: 24 candidate IDs and normalized English/Korean avoid all 136 reservations; sealed contents not emitted
PASS: 6 negative controls rejected (word IDs, module, alignment, corpus collision, refusal, class)
```

The checker sends a temporary three-field projection to the existing
`check-independent-freeze.py --candidates` path. Its legacy `corpusSentenceId`
field carries the **new item ID solely for collision checking**, not a false
corpus anchor. The existing checker covers all 136 reserved corpus IDs and
normalized English/Korean texts (including the sealed v3 reservations). Only its
fixed success summary is emitted. Its subprocess may read the sealed file;
authoring context never receives its rows. Per-command Git safe-directory
configuration supports the managed host without editing the older checker or
repository Git configuration. Temporary candidate files are removed on exit.

The checker also compares all pinned sources to the working tree. A future
content change will deliberately require provenance review rather than silently
changing this version's evidence. Negative controls exercise vocabulary,
module ordering, chunk alignment, corpus leakage, refusal and class integrity.
They are structural tests, not a language-review verdict.
