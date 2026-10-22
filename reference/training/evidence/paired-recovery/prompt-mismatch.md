# Paired recovery stopped: inherited prompt mismatch

The local GPU connection and retained training stack work. The experiment is
**not a valid isolated supervision comparison**: the paired freeze inherited a
different product prompt from the incumbent v2 artifact and unchanged native
worker. This mismatch was discovered after the first recovered training run
completed. It should have been checked before training, not at export/replay.

## Identities and scope

- Incumbent v2 training / preserved worker prompt: `81f525b2fb54ac5b1a16d3cfb7ba2fc28ed88db156156cff5fbddb9ff043e669`.
- Product prompt at paired freeze `176c46c` and recovery source `5a156a1`:
  `636e7b0c6ead6fd6dbd37d2ec581e2af70df5d5142de801b77cf89211327a6a0`.
- The decoded strings differ, not just JSON serialization. Commit `2677b7c`
  replaced the prior prompt with a field-contract teacher prompt before the
  paired freeze. The new wording changes gloss and literal-gap instructions.
- The dataset, frozen development split, base revision, seed, two learning rates,
  epoch limit and selection rule were not changed during recovery.
- The remote receipt bound the current prompt but did not assert its identity
  against the incumbent. The runner now rejects this mismatch before issuing a
  receipt or loading a model. The product prompt itself remains unchanged.

The unchanged worker must not silently receive an adapter trained on a different
prompt and be reported as a controlled supervision comparison. Switching workers
would also depart from the fixed comparison. No export or native inference ran.
No reserved input or freeze document was opened in the operator context; only
the approved checker subprocess read reservation data. No gate score, rubric
change or model pin occurred.

## Preserved runs

The original interrupted `paired-lr1` files remain untouched. The recovery used
`paired-lr1-recovery` with the frozen 0.0001 config and a copied retained Python
3.12.13 / Torch 2.12.1+cu130 environment on the local RTX 5090. It completed 1,624
updates and merged its epoch-1 adapter. Development loss was 0.746235 at baseline,
then 0.361530, 0.383316, 0.422017 and 0.451612. Training including development
measurement took 282.252 seconds; through merge, 295.097 seconds. These are loss
observations under the mismatched protocol, **not language correctness results**.

The second fixed rate began before the prompt comparison was inspected. It was
stopped after logged update 204; its atomic checkpoint is at update 200. No
trained-epoch development score or merged artifact exists for it. The checkpoint
contains baseline development loss, adapter/optimizer/RNG state and input identity.
`lr2-stopped.json` binds that checkpoint; no training process remains.

Numeric evidence is in `lr1-training-result.json`, `lr2-stopped.json`, and
`recovery-manifest.json`. Large weights/checkpoints and original logs remain in
ignored local storage and the dedicated GPU account. No output is discarded or
relabelled as a completed candidate comparison.

## Verification and next decision

The recovery regression executed the actual optimizer loop on a small CPU model
in the retained Torch environment: interruption at update 28, resumption from
checkpoint 25, exact equality with uninterrupted loss history, development
scores, selected epoch and final adapter. A changed config was rejected. The
receipt regression rejects changed inputs and overwrites. Existing preflight
regressions passed, and the added mismatch regression confirms the current
product prompt stops before model import. Build/typecheck and content validation
passed (16/16); exact-commit CI is recorded in the task.

Before further training, a scope decision must choose whether to authorize
corrected reruns of the same two rates with the incumbent prompt isolated in the
training workspace, or stop this comparison as inconclusive. The no-extra-retry
constraint prevents treating correction as an automatic new experiment. The
completed diagnostic and approved 406-row dataset remain valid; the development
correctness comparison and export/runtime deliverable remain incomplete.
