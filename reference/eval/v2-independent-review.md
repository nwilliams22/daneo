# Independent re-score — sealed v2 gate

Reviewed 2026-10-05 from the committed raw replies. No inference was rerun.
The unchanged [`v0-rubric.md`](v0-rubric.md) is the scoring authority.

## Verdict

**FAIL: neither engine meets the ≥9/10 fully-correct threshold.** Independent
counts match the original judgments: prompted base **2/10** and scaled Q8_0
fine-tune **3/10**. The base also has one meaning reversal and three invented
rules; the fine-tune has no reversal and one invented rule. The v2 set remains
spent as a gate. `reference/model-pin.json` remains null.

## Provenance

- The sealed fixture has 10 items and SHA-256
  `81e06f6cd27740c194d643fa710fc2c75d3028e3fc626316566f35ee8af5d9f7`.
- The v2 run manifest and each raw row bind both streams to that fixture, the
  unchanged prompt (`81f525b2…43e669`), unchanged rubric
  (`a73523d3…113550`), and pre-run harness commit `8d413ac`.
- Base artifact: 2,740,937,888 bytes,
  `00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4`.
  Fine-tune: 4,610,579,744 bytes,
  `025935d6c8477d70946b0e97fddcac318ddbd04630a496bd011f488ef39020c5`.
  The fine-tune identity matches `reference/training/v2-results.md` and its
  export evidence.
- The exact frozen training file has 250 rows. The exclusion checker confirms
  zero intersection with the 96 reserved rows (including all 10 v2 items),
  zero v1 overlap, and zero training/development overlap.

Commands, from `/mnt/t7/Projects/daneo`:

```sh
python3 reference/eval/check-head-to-head-provenance.py --report-commit HEAD --item-set v2
python3 reference/eval/check-provenance.py reference/eval/raw/head-to-head-base-v2-raw.jsonl --report-commit HEAD --item-set reference/eval/v2-translation-set.json
python3 reference/eval/check-provenance.py reference/eval/raw/head-to-head-fine-tune-v2-raw.jsonl --report-commit HEAD --item-set reference/eval/v2-translation-set.json
python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v2.json
```

All four commands exited 0. Output, in order: sealed v2 source and both
10-item streams passed; each raw stream reported `PROVENANCE PASS: 11 raw rows`
(ten scored replies plus warmup); frozen manifest/hash/source checks passed;
250 training rows avoided all 96 reservations and internal duplicates, and the
40 development rows also passed. Thus no contamination was found.

## Independent per-item verdict

Each cell lists `meaning / gloss / particles / polite register / romanization /
literal gap`; **P** means pass and **F** means fail. Reversal and invented-rule
flags are separate zero-tolerance rubric flags.

| Item | Prompted base | Q8_0 fine-tune |
| --- | --- | --- |
| DAN-V2-EK-01 | P/F/P/P/P/F | P/P/P/P/P/F |
| DAN-V2-EK-02 | P/F/P/P/P/F | P/P/P/P/P/F |
| DAN-V2-EK-03 | P/P/P/P/P/F | P/P/P/P/P/F |
| DAN-V2-EK-04 | F/F/F/F/F/F | P/P/P/P/P/F |
| DAN-V2-EK-05 | P/F/P/P/P/F | P/P/P/P/P/P |
| DAN-V2-KE-01 | P/F/P/P/P/F | P/P/P/P/P/F |
| DAN-V2-KE-02 | P/F/F/P/P/P | P/P/P/P/P/P |
| DAN-V2-KE-03 | P/P/P/P/P/P | P/P/P/P/P/F |
| DAN-V2-KE-04 | F/P/P/F/P/F | P/F/P/P/P/F |
| DAN-V2-KE-05 | P/P/P/P/P/P | P/P/P/P/P/P |

| Measure | Prompted base | Q8_0 fine-tune |
| --- | ---: | ---: |
| Complete schema | 9/10 | 10/10 |
| Correct direction | 10/10 | 10/10 |
| Thinking leaks | 0 | 0 |
| Meaning | 8/10 | 10/10 |
| Korean-order gloss | 4/10 | 9/10 |
| Particle roles | 8/10 | 10/10 |
| Polite register | 8/10 | 10/10 |
| Romanization | 9/10 | 10/10 |
| Literal-gap dimension | 3/10 | 3/10 |
| Fully correct | **2/10** | **3/10** |
| Meaning reversals | 1 | 0 |
| Invented-rule flags | 3 | 1 |

## Disagreements with first-pass judgments

**None.** I independently read the retained raw replies against the frozen
fixtures, rubric, corpus notes and lesson scope. Every per-item dimension and
flag agrees with `raw/head-to-head-{base,fine-tune}-v2-judgments.json`; therefore
the full counts also agree. The matching outcome is not based on copying the
scored summaries.

Adjudication points that determine the counts:

- Base EK-04 is schema-invalid: its gloss contains an empty gloss and role, and
  the Korean has malformed `고프요`. It fails all dimensions and cannot receive
  credit for the otherwise correct English meaning.
- Base KE-04 says “Let’s meet my friend tomorrow,” changing the fixture’s
  planned-meeting statement into a suggestion; this is the one meaning reversal.
- Base EK-05 claims the Korean omits `거` although `거` is in the reply, and
  calls subject marker `가` a topic marker. Base KE-01 assigns “exist” to `이`
  rather than `있`; base KE-02 calls subject `이` a topic marker. These are the
  three invented-rule flags. The postprocessor fixes particle metadata in some
  items but cannot repair false model-authored gloss explanations.
- Fine-tune KE-04 labels 해요-style `만나요` as formal in its gloss. Module 4
  distinguishes this from formal 합니다-style `입니다`; the gloss fails and
  the confidently false label is the fine-tune’s one invented-rule flag.
- Fine-tune emits an empty literal-gap field on all ten items. Only three items
  need no gap explanation, and those three pass that dimension. It passes **0/7**
  items requiring a gap explanation; the base passes **1/7**. The dimension
  totals are 3/10 each because the remaining two passes per engine are
  no-gap items.

## Did the larger training set meet its target?

On this ten-item gate, register rises from 8/10 to 10/10, while literal-gap
dimension correctness stays 3/10; the fine-tune gives a needed gap explanation
on 0/7 applicable items. This is a mixed result on a small sealed set, not
evidence that literal-gap training worked.

The separate 60-item fresh evaluation in `engine-decision.md` is the broader
check: literal gap is **1/15 for both engines**, unchanged; polite register is
**6/15 base to 5/15 fine-tune**, down one. Against the stated 1/15 literal-gap
and 5–6/15 register baseline, the larger training set did not demonstrate
generalized improvement on those target dimensions. It improved register on
the ten-item v2 pair but not on the fresh set, and it left literal-gap behavior
effectively unchanged. Neither engine qualifies.
