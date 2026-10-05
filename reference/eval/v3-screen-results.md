# v3 family screen — preflight, not a selection verdict

2026-10-05. **Screen incomplete: no candidate has been scored or shortlisted.**
Neither model has a measured full-weight artifact, runtime row or six-dimension
score yet. This is not a quality decline and must not authorize a gate run.

## Publisher identity and converter check

| Candidate | Publisher repository | Immutable revision | Vocabulary-only conversion |
| --- | --- | --- | --- |
| Mi:dm 2.0 Mini | `K-intelligence/Midm-2.0-Mini-Instruct` | `383eb221c52a32278f1985257b264ade8d982e60` | Pass |
| A.X 4.0 Light | `skt/A.X-4.0-Light` | `ba21c20ea1b31ded1ec3e2fb432335077dc4be98` | Pass |

Downloaded each publisher's config, tokenizer, tokenizer config, special-token
map and generation config at the revision above. Their measured bytes and SHA-256
values, template hashes and vocabulary-only GGUF identities are retained in
[`raw/v3-screen-preflight.json`](raw/v3-screen-preflight.json). These local GGUFs
have **zero weight tensors**, cannot run inference, and cannot be shipped as model
artifacts. No community quantization or full publisher weights have been run.

The existing matched converter is llama.cpp
`26394b4e6749a41c3633db040e0987500a5f7013`, used by `llama-cpp-sys-2 0.1.158`.
For each local directory (`midm`, then `ax`), this command exited 0:

```sh
HF_HUB_OFFLINE=1 .local-models/compatibility/venv/bin/python \
  .local-models/compatibility/llama-matched/convert_hf_to_gguf.py \
  .local-models/v3-screen/midm --vocab-only \
  --outfile .local-models/v3-screen/midm-vocab.gguf
```

Substitute `ax` for `midm` for the second check. The converter recognizes both
pre-tokenizers. Initial incomplete tokenizer downloads caused failed probes;
after completing the downloads, both offline exports passed. No converter or
crate changes were made. This test does not establish weight-loading support.

## Unchanged-worker conflict

`src-tauri/src/local_translation/native.rs` renders the model's chat template,
then requires exactly this suffix before tokenization:

```text
<|im_start|>assistant\n<think>\n\n</think>\n\n
```

Failure returns `TranslateError::generation()`. The publisher Mi:dm template
ends its generation prefix with
`<|start_header_id|>assistant<|end_header_id|>\n\n`; A.X uses
`<|im_start|><|assistant|>`. Neither passes the existing check. Changing only the
user instruction cannot change those fixed template endings. The worker also
supplies no `bos_token` or system message; those inputs need checking for Mi:dm
when family rendering is authorized.

The assignment requires both an unchanged worker and family-native prompting.
Resolve that conflict before spending a full screening run. Proposed narrow
scope: retain crate 0.1.158, CPU, thread count, greedy sampling and thinking off;
make template validation family-aware with focused tests, and record the exact
rendered prompt hash. Do not disguise a family template with a Qwen suffix.
This is not evidence that a crate-version bump is necessary.

## Remaining finish condition

Owner: Duncan. After the scope decision, acquire full weights, convert and hash
both artifacts, prove native loading, adapt prompts only on the committed dev
split, and record all six dimensions, literal-gap and polite-register counts,
schema/direction/thinking/reversal/rule flags, download bytes, cold load, cold
first token, warm p95 and peak RSS. Shortlist at most one or none **from those
measurements**. A qualifying A.X score reopens Nick's download-budget decision.

No gate inputs were read, no training ran and the model pin was not edited.
`npm run build` passed, including content validation and TypeScript. Closure
still requires the completed measured report and raw replies at a named commit,
plus success of that commit's Actions run; this preflight does not close it.
