# Scaled QLoRA candidate — 2026-10-05

Expected result: one selected Q8_0 candidate with a measured identity and an
actual response from the unchanged native worker. This report does not score
language quality or enable the AI. The production model pin remains null.

## Inputs and selection

Frozen training: 250 rows, SHA-256
`0e4509055cf8074676505af1068b460726d35154b75c896edefccb2a8704f57e`.
Frozen development: 40 rows, SHA-256
`f9b83bd52dce8a3f4c557af27ea94c4fe4226b41d796ebc566b0d1a8337e343d`.
Both pass strict target validation and the mechanical 96-reservation exclusion
check. No sealed answer was inspected or used for training or selection.

The predeclared comparison and commands are in `README.md`, “Scaled v2
development selection”; configurations are `v2-lr1-config.json` and
`v2-lr2-config.json`. Base, prompt, environment and LoRA shape remain as in
`v1-results.md`. The v1 Q8_0 compatibility probe is reused; there is no native
worker change. The code/configuration hashes are in
`evidence/v2/runner-manifest.json`.

## First completed run

Rate 0.0001: 1,000 optimizer steps; selected epoch 2 (500 updates) by development
response-token loss, 0.210299619. Baseline: 0.657473800; epochs 1–4:
0.218592826, 0.210299619, 0.250007556, 0.265336828. The selected adapter is restored
before merge. Later-epoch overfitting is observed on development only.
Training plus development evaluation: 185.394 seconds; load through merge:
234.020 seconds (excludes initial base hashing/imports). Peak CUDA allocator
allocated/reserved: 4,330,988,544 / 4,450,156,544 bytes. These are process allocator
peaks, not whole-card measurements. All step losses and rates are preserved in
`evidence/v2-lr1/training-result.json`.

## Remaining work

The second predeclared rate, 0.0002, is running. Select by development loss,
export only the selected adapter using the matched converter, and check one
non-held-out smoke response in the pinned worker. No export or runtime success
is claimed yet. The binary weights follow the existing ignored local-artifact
convention; commit hashes and the eventual issue work product bind their
identity instead of placing multi-gigabyte weights in ordinary git.
