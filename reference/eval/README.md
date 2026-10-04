# Desktop acceptance runner

This opt-in runner embeds the app assets in a real Tauri WebKit window, registers
its production translation commands, and injects `acceptance.ts` bundled with the
production `localTranslator` and zod schema. No mocked transport, HTTP proxy or
cloud model is used. The ordinary app build has no acceptance recorder. Never
ship the `acceptance` Cargo feature: it records raw model replies to the explicitly
selected evidence file. Only use synthetic, nonpersonal evaluation inputs.

Run from the repository root on a Linux Wayland host with the native prerequisites
in `src-tauri/examples/README.md`. Build the frontend first (`npm run build`), then:

```sh
node --input-type=module - <<'JS'
import { build } from 'vite';
await build({configFile:false, build:{lib:{entry:'reference/eval/acceptance.ts',name:'DaneoAcceptance',formats:['iife'],fileName:()=> 'acceptance.js'},outDir:process.env.PAPERCLIP_RUN_SCRATCH_DIR+'/acceptance-js',emptyOutDir:true}});
JS
cargo build --locked --release --manifest-path src-tauri/Cargo.toml \
  --features acceptance,tauri/custom-protocol --example acceptance
```

Set `DANEO_MODEL_PATH` to the verified GGUF, `DANEO_ACCEPTANCE_SCRIPT` to the bundled
JS, `DANEO_ACCEPTANCE_DATA` to a fresh scratch directory (never your learner
profile), `DANEO_ACCEPTANCE_RESULTS` to a new JSONL file, `DANEO_ACCEPTANCE_RAW` to
a new raw-output JSONL file, and `DANEO_ACCEPTANCE_LOG` to a scratch log. The raw
recorder appends; do not reuse a previous evidence path. Set `XDG_RUNTIME_DIR`,
`WAYLAND_DISPLAY`, and `GDK_BACKEND=wayland` for your desktop session. Then run:

```sh
python3 reference/eval/run-desktop.py
```

The launcher isolates networking with `unshare --user --map-root-user --net`.
The namespace contains no running proxy and no configured network interface;
it does not disable the host's networking. RSS sampling includes WebKit child
processes and may double-count shared pages or miss sub-20ms peaks. Raw final
model text is retained before fence handling/JSON parsing, including token-limit
failures. Cancellation progress is retained in the command evidence.

The fixture supplies exact input bytes and expected direction; the current app
command infers direction from input and has no explicit direction argument.
One fresh-process request precedes three rounds of all ten held-out items.
“Warm” means a repeated request in the same process with warmed OS file cache;
the production v0 worker reloads and re-verifies weights on every request.
Cold here means process-cold, not disk-cold: hash verification warms the file
cache. Completion includes listener setup, hash, model load, prefill, generation,
IPC and schema validation. Ready progress measures combined verification/load;
first generating token measures user-visible TTFT. Do not call generating/0 TTFT.

A direct adapter request proves the real WebKit IPC/inference path, not visual
interaction with Explore controls. Keep those claims separate in the report.
The language verdicts use the frozen corpus/module references, never a paid API.

For the Explore demonstrations, bundle `reference/eval/demonstrations.ts` instead
of `acceptance.ts`, with a different output directory, and reuse the same runner.
The driver sets onboarding complete only inside its scratch profile, navigates to
Explore, submits `Hello.`, saves the valid result, cancels another request after
its first token, and submits `Hello.` again. It records rendered text, UI cancel
latency and database counts proving no extra saved result. It does not click Save
on the recovery reply. Run it twice more with a nonexistent model path and a
small deliberately corrupt file; each error run exits after recording both the
rendered error and native typed state. Do not overwrite an installed model.

For controlled allocation failure and cleanup, run the existing opt-in native
test from `src-tauri/LOCAL-TRANSLATION.md`, retaining its stdout and result envelope.
This injection returns an allocation error at context creation after real weights
load; it does not simulate an OS OOM kill or claim process isolation from one.

After reviewing the first baseline, record all six linguistic dimensions in
`v0-language-review.json`. `python3 reference/eval/summarize-v0.py` joins those
judgments with every raw reply, asserts that repeated text really is identical,
and computes nearest-rank p95. If any repeat differs, it stops: review that output
separately rather than inheriting a verdict. The JSON parser/schema decision is
from the actual frontend adapter, not this summarizer. No thinking markers or
reasoning prose were found in the manual raw-text review for this baseline.
