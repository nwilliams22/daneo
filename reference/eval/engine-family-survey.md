# Engine family survey — the licence question, answered first

Written 2026-10-05, immediately after Nick chose option **C — a different model
family** from the four unspent options in
[`engine-decision.md`](engine-decision.md) §*Option A measured and declined*.

This document does not score anything, does not select an artifact and does not
write a pin. `reference/model-pin.json` stays null. It does one job: it settles
the precondition that option C was always written with — *"a different family,
licence question answered **first**"* — and it names the candidates the next
rung is allowed to spend a gate on.

## The licence question, and why it needs no decision from Nick

Option C recorded the problem as a tradeoff: EXAONE is the strongest
Korean-oriented bet at this size, its weights are non-commercially licensed,
and that is *"fine if Daneo is never sold, a dead end if it might be."* Reading
it that way makes the engine choice wait on a business decision about a product
that has only just shipped.

It does not have to. **Two Korean-specialised families publish weights under
licences that permit commercial use**, so the shortlist below can be run without
anyone deciding whether Daneo will ever be sold, and without foreclosing it:

- **Mi:dm 2.0** (KT, published as `K-intelligence`) — **MIT**. The card states
  *"Mi:dm 2.0 is licensed under the MIT License."*
- **A.X 4.0 Light** (SK Telecom) — **Apache-2.0**. The card states *"The
  `A.X 4.0 Light` model is licensed under `Apache License 2.0`."*

That is the answer. The licence question is closed in the only direction that
costs nothing: **the sale option stays open, and no non-commercial weights are
needed to try option C.** The non-commercially licensed families are not
rejected on their merits and are not gone — they are simply unnecessary while
two permissive Korean-first candidates are unspent. If both decline *and* Nick
says Daneo will never be sold, EXAONE returns as a live candidate. That is a
future decision with a measured trigger, not an open question today.

## Nick's clarification — 2026-10-05: free and small are the constraints; the family is not

Posted on [BAD-240](/BAD/issues/BAD-240) after this survey was written: *"I do
want to clarify that the model itself doesn't necessarily matter. I just want it
to be free and small enough to make sense for a language app like this. ZDR and
stuff like that is also important but I think if we're using local models that
part shouldn't really matter too much."*

It is recorded in full in `PLAN-local-model.md` §*Clarification — 2026-10-05*,
which governs. What it changes **here**:

- **The shortlist is not privileged by being Korean-specialised.** Korean-first
  training is this survey's *reason to expect* a gain on literal gap — the
  dimension four rungs died on — and it stays the reason Mi:dm Mini is first. It
  is not an eligibility rule. The eligibility rule is: free, local, in the size
  envelope. A later rung may put a general multilingual model back on the table
  without asking Nick, provided its licence is read into this document first.
- **A.X 4.0 Light is demoted, not cancelled.** 7 B at roughly 4.7 GB is outside
  the *"approximately 2.5–3 GB"* envelope Nick has now restated in his own words.
  It is screened only if **Mi:dm Mini declines**, and an in-envelope free
  candidate — read into this table first — is preferred over it even then.
  Acquiring and running a 4.7 GB artifact before the 2.3 B one is measured spends
  the studio's time on the option its owner has argued against.
- **Nothing here reopens EXAONE or Kanana.** "The model itself doesn't matter" is
  about family reputation, not about licences; a non-commercial licence is still a
  decision about whether Daneo can be sold, and that decision is still untaken and
  still unnecessary.
- **ZDR needs no work.** His reading is correct and verified in code: a production
  build has no path that sends learner text off the device. The evidence is in
  `PLAN-local-model.md` §*Clarification* item 3. **This is a reason to keep the
  engine local, not a new requirement on any candidate** — it is satisfied
  identically by every row in the table below.

## The candidates, with licence, architecture and download cost

Every row is free to download and runs locally. No paid or cloud engine appears
here; the constraint in §*Owner constraint* of `PLAN-local-model.md` is
unchanged.

| Family | Licence | Commercial | Params | Architecture | Status |
| --- | --- | --- | --- | --- | --- |
| **Mi:dm 2.0 Mini** (KT) | MIT | **Yes** | 2.3 B | `LlamaForCausalLM`, 48 layers, hidden 1792, vocab 131,392, 32,768 ctx | **Primary candidate** |
| **A.X 4.0 Light** (SKT) | Apache-2.0 | **Yes** | 7 B | Qwen2.5 derivative, 16,384 ctx | **Demoted 2026-10-05** — outside the size envelope Nick restated; screened only if Mi:dm Mini declines, and after any in-envelope alternative |
| Mi:dm 2.0 Base (KT) | MIT | Yes | 11.5 B | same family as Mini | Out of scope — this is option **B**, a larger parameter class |
| EXAONE 4.0 (LG) | EXAONE AI Model License 1.2 **-NC** | **No** | 1.2 B / 32 B | own architecture, official GGUF published | Held — unnecessary while the permissive two are unspent |
| Kanana (Kakao) | **CC-BY-NC-4.0** | **No** | 2.1 B – 32.5 B | — | Held, same reason |
| HyperCLOVA X SEED (NAVER) | bespoke `hyperclovax-seed`, **gated download** | unreviewed | 0.5 / 1.5 / 3 B | dense transformer | Excluded for now — see below |

**Why Mi:dm 2.0 Mini is the primary candidate, in the order the reasons
matter.**

1. **Korea-centric by construction, not by multilingual coverage.** Its card
   describes a model that *"deeply internalizes the unique values, cognitive
   frameworks, and commonsense reasoning inherent to Korean society"*, and it
   reports Korean-specific benchmarks (HAERAE, KMMLU, K-Refer, Ko-IFEval,
   LogicKor, Ko-MTBench). The incumbent Qwen3.5-4B is a general multilingual
   model. The dimension five rungs failed on — explaining why a Korean sentence
   does not mean what its words literally say — is a Korean-pragmatics task, not
   a general-capability task. This is the first candidate whose training aim is
   that language.
2. **The download gets smaller, not bigger.** 2.3 B against the incumbent's
   4 B. `PLAN-local-model.md` holds the standard envelope at *"Q4_K_M,
   approximately 2.5–3 GB"* and the shipped candidate measured 2,740,937,888 B.
   A 2.3 B Q4_K_M should land near 1.5 GB — **to be measured on the artifact,
   not asserted from the parameter count.** Unlike option B, this candidate can
   clear the bar and still be shippable.
3. **The runtime already supports it.** `config.json` reports
   `"architectures": ["LlamaForCausalLM"]`, `"model_type": "llama"`. That is the
   oldest and best-supported architecture in `llama.cpp`, so the pinned
   `llama-cpp-2 0.1.158` worker needs no version change — the risk that killed a
   Qwen3.5 conversion path (`reference/training/results.md`) does not apply.
4. **MIT is the least restrictive licence any candidate here carries** — no
   acceptable-use annex, no user-count ceiling, no redistribution gate.

**Why A.X 4.0 Light is second, not first.** Its Korean gains over its own base
are large and measured — KMMLU 64.15 against Qwen2.5-7B's 49.56, CLIcK 68.05
against 60.56, KoBALT 30.29 against 21.57 — which is direct evidence that
Korean-targeted continued pretraining moves Korean ability within one
architecture. But it is **7 B**, so a Q4_K_M file is roughly 4.7 GB: well
outside the standard envelope and nearly double the shipped 2.74 GB. It carries
option B's cost — the learner's download and working memory — without being
option B's stated candidate. A qualifying score on A.X reopens a download-budget
decision for Nick rather than closing one — and after his 2026-10-05
clarification that decision starts from *"small enough to make sense for a
language app"*, which is an argument against it. **So it is not screened in
parallel with Mi:dm Mini and not screened before it**: it is the fallback if the
2.3 B candidate declines, and an in-envelope alternative read into this table
outranks it even then.

**Why HyperCLOVA X SEED is excluded for now.** Its weights sit behind a gate
that requires agreeing to share contact information before the files are
visible, under a bespoke `hyperclovax-seed` licence that has not been read. The
shipping downloader fetches an artifact by `repoId`, `revision`, `filename` and
hash with no interactive consent step, so a click-through gate is a product
problem before it is a licence problem. It returns only if both permissive
candidates decline, and then the licence has to be read before any gate run.

## Neither shortlisted family has an official GGUF

Both publish weights only; the GGUF files on the Hub for both are
community-published (for Mi:dm Mini: `mykor`, `DevQuasar`, `yasserrmd` and
others). Two consequences for the next rung:

- **A community quantization is usable as a candidate but is not automatically
  pinnable.** The incumbent has the same shape — `unsloth` is the quantization
  publisher, not Qwen, and `PLAN-local-model.md` already says *"pin and verify
  its artifact"*. Any pin still needs `repoId`, `revision`, `filename`, `bytes`
  and `sha256` of the exact file the gate scored.
- **Local conversion is the safer path and is available.** Mi:dm Mini is a
  `llama`-architecture model under MIT, so `llama.cpp`'s converter handles it
  directly and the studio can produce its own Q4_K_M from the MIT weights. That
  removes a dependency on a third party's quantization choices. It does not
  remove the hosting question: whatever file ships must be downloadable from a
  stable public URL, which is a selection question for the verdict ticket and
  not for the screen.

## What the next rung has to respect

These are not new rules. They are the ones this programme has already paid for.

- **All 96 reserved rows are burned.** 10 v0, 10 v1, 6 dev, 10 v2 and the 60
  independent items have every one been run and read.
  [`training-independent-freeze.md`](training-independent-freeze.md) reserved
  them; nothing in that reservation is unspent. **A gate score is not possible
  until a new set is authored and frozen**, excluded against all 96 by
  `check-independent-freeze.py`.
- **A new family needs its own prompt, and that prompt is tuned on a
  development split — never on the gate.** The incumbent's prompt was repaired
  against a separate dev set (BAD-206) and that discipline is why the v0 and v2
  numbers mean anything. Mi:dm and A.X have their own chat templates and will
  not inherit the Qwen-shaped prompt unchanged.
- **The rubric does not move.** [`v0-rubric.md`](v0-rubric.md) is unedited:
  ≥9/10 fully correct across six conjunctive dimensions, zero meaning reversals,
  zero invented rules. Option F stays measured-closed.
- **The worker must stop being family-locked, and that is authorized.**
  `src-tauri/src/local_translation/native.rs` renders the model's own chat
  template and then requires a **Qwen-shaped suffix** before tokenizing; both
  shortlisted families fail that check before generation
  ([`v3-screen-results.md`](v3-screen-results.md)). Nick answered Duncan's scope
  question on BAD-245 at 10:36 on 2026-10-05 — *allow the narrow template change*
  — with crate `llama-cpp-2 0.1.158`, CPU, greedy sampling and thinking-off all
  held fixed. His later clarification makes this more than a screening unblock: if
  the model itself does not matter, a worker that only accepts one vendor's
  template is a **product defect**, not a screening inconvenience. Make validation
  family-aware with tests and record the rendered prompt hash. **Do not disguise a
  family template with a Qwen suffix**, and a crate bump is still not authorized by
  this.
- **Screen before spending a gate.** Five rungs have now declined, four of them
  on the literal-gap dimension, and the 250-row fine-tune emitted an empty gap
  field on all ten items. The cheap question — *does this family produce a
  usable literal-gap explanation at all?* — can be answered on a development
  split for the cost of one inference run. A fresh sealed set is the scarcest
  thing this programme has left; it is spent on a candidate that has already
  shown it can clear the dimension that killed the others, or not at all.

## The chain this document scopes

| Ticket | Work | Owner |
| --- | --- | --- |
| BAD-244 | Author and freeze a new reserved gate set and a separate development split | Chani |
| BAD-245 | Screen Mi:dm 2.0 Mini, then A.X 4.0 Light, on the development split; shortlist at most one | Duncan |
| BAD-246 | One gate run on the shortlisted candidate, independently re-scored | Duncan, re-score by Thufir |
| BAD-247 | Verdict — write the pin, or take the remaining options back to Nick | Bad Dong |

BAD-244 and BAD-245 are independent and run in parallel. BAD-247 is the
terminus and is what [BAD-213](/BAD/issues/BAD-213) and
[BAD-188](/BAD/issues/BAD-188) now wait on. A screen that shortlists **no**
candidate skips BAD-246 and lands on BAD-247 directly.

## Evidence and source of truth

Licence, architecture and parameter facts above were read from the publishers'
own model cards and config files on 2026-10-05:

- [`K-intelligence/Midm-2.0-Mini-Instruct`](https://huggingface.co/K-intelligence/Midm-2.0-Mini-Instruct)
  and its [`config.json`](https://huggingface.co/K-intelligence/Midm-2.0-Mini-Instruct/raw/main/config.json)
- [`skt/A.X-4.0-Light`](https://huggingface.co/skt/A.X-4.0-Light)
- [`LGAI-EXAONE/EXAONE-4.0-32B`](https://huggingface.co/LGAI-EXAONE/EXAONE-4.0-32B) — the `-NC` licence
- [`kakaocorp/kanana-nano-2.1b-instruct`](https://huggingface.co/kakaocorp/kanana-nano-2.1b-instruct) — CC-BY-NC-4.0
- [`naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-1.5B`](https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Text-Instruct-1.5B) — gated, bespoke licence

A published card is a claim by its publisher. Every size, hash and quality
number that decides anything in this programme is measured on this hardware
against the unchanged rubric; nothing above is a score and nothing above
qualifies a model.
