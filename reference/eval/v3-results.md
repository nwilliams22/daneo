# v3 gate disposition — not run

2026-10-05. **No candidate was shortlisted, so the reserved gate was not run.**
This is the explicit no-candidate branch of
[BAD-246](/BAD/issues/BAD-246), following the completed
[BAD-245](/BAD/issues/BAD-245) development screen. It is not a gate score.

The source of truth is [v3-screen-results.md](v3-screen-results.md), committed
at `01b89eb078fb7b03cce6b3be529d6f840a5e737b`, with retained raw replies,
artifact identities, prompt hashes and item-level judgments.

| Development measure, out of 30 | Mi:dm 2.0 Mini | A.X 4.0 Light |
| --- | ---: | ---: |
| Fully correct | 0 | 0 |
| Meaning | 26 | 29 |
| Korean word-order gloss | 0 | 5 |
| Particle roles | 23 | 25 |
| Polite register | 22 | 25 |
| Romanization | 30 | 30 |
| Literal-gap claims | 0 | 3 |
| Schema-valid | 26 | 11 |
| Meaning reversals | 1 | 0 |
| Invented-rule items | 15 | 15 |

These are development counts, not results on the ten reserved gate items.
Neither candidate justifies spending the sealed set against the unchanged
≥9/10 fully-correct bar with zero meaning reversals and zero invented rules.

No candidate or paired-incumbent gate inference was performed. No gate replies,
resource logs or independent gate re-score exist; the inference and re-score
requirements do not apply to this no-candidate branch. The reserved fixture was
not opened in this closeout and remains unused. No prompt, rubric, model pin or
release artifact was changed. No model service, proxy or API key was used for
inference because no inference occurred.

Verification from the repository root:

```sh
python3 reference/eval/check-v3-screen.py --report-commit 01b89eb
```

Result: `PROVENANCE PASS` for each family, **31 raw rows each**, validating the
committed development fixture and artifact identity without opening the gate.
The prerequisite commit's Actions run `37304361085` concluded `success`.
This documentation commit's own Actions result is recorded on BAD-246.

The next action belongs to [BAD-247](/BAD/issues/BAD-247): use the measured
**none** shortlist for the engine verdict. Any future candidate needs its own
authorized development screen before the still-unused reserved gate is spent.
