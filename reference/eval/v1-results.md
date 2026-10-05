# Frozen v1 artifact-selection gate — first score

Run date: 2026-10-04. The ten exact inputs in `v1-translation-set.json` were submitted once, in order, through the opt-in Tauri WebKit acceptance example. Its injected script uses the production `localTranslator` adapter, native `translate_local` command, model worker, and result schema. The process ran inside `unshare --user --map-root-user --net` on the nested `:7` X display. No proxy or network interface was available in that namespace. The run exited 0; the ten held-out requests, cancel check, and recovery request are in [`raw/v1-results.jsonl`](raw/v1-results.jsonl). Every completed raw model reply was recorded before parsing in [`raw/v1-raw.jsonl`](raw/v1-raw.jsonl). The raw file has ten held-out rows and one recovery row; a cancelled request has no final raw reply.

The run stamped HEAD `da957d4836f77487169f5b75251baddec9a607a9`. The fixture SHA-256 is `186c59f618dea37307f745837fb72818e1d6cf4da430280b8299af158c31c983`; prompt SHA-256 is `81f525b2fb54ac5b1a16d3cfb7ba2fc28ed88db156156cff5fbddb9ff043e669`; unchanged rubric SHA-256 is `a73523d34276b81d31341846acc1d8e9d1b3833aedcdcf5838caec6368113550`. `git fetch origin main` confirmed this HEAD was `origin/main` before the run. The native acceptance example and v1 JS bundle were rebuilt from that tree before inference. The existing locally verified GGUF matches `src-tauri/src/model_artifact.rs`: `unsloth/Qwen3.5-4B-GGUF`, revision `e87f176479d0855a907a41277aca2f8ee7a09523`, `Qwen3.5-4B-Q4_K_M.gguf`, 2,740,937,888 bytes, SHA-256 `00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4`. **This is the candidate used in the run; no production artifact is selected.** `reference/model-pin.json` remains `null`.

## First rubric score

My item-level judgments and their evidence are in [`raw/v1-scored.json`](raw/v1-scored.json). The final app result is scored after deterministic romanization and particle extraction; the raw model reply remains available separately. This is the first score, pending independent review.

| Measure | First score | Gate |
| --- | ---: | ---: |
| Schema-complete / correct direction | 10/10 / 10/10 | 10/10 each |
| Fully correct | **2/10** (`KE-03`, `KE-04`) | ≥9/10 |
| Meaning / gloss / particles | 8/10 / **2/10** / 9/10 | all applicable dimensions |
| Polite register / romanization / literal gap | 8/10 / 10/10 / 7/10 | all applicable dimensions |
| Meaning reversals / invented-rule items / thinking leaks | 0 / **1** / 0 | zero each |

The false rule is `KE-01`'s gloss calling subject marker `이` a topic marker, although the deterministic `particles[]` field correctly labels it subject. `EK-01` and `EK-02` use deferential `합니다` instead of the lesson's `해요` register. `EK-05` adds `도` (“also”) and writes an unnatural slash-form sibling. The binding residual is the model's Korean word-order gloss (2/10); mechanical field correction cannot repair it. The next authorized rung is the fine-tune on the post-extraction errors under [BAD-193](/BAD/issues/BAD-193). A larger-quantization probe can be evaluated separately against this clean baseline, but it is not the selected rung here.

## Runtime and verification

| Measure | Observed |
| --- | ---: |
| Warm completion p95, nearest rank of the nine requests after the first | **17.544 s** (range 13.888–17.544 s) |
| First process request: ready / first generated token / completion | **1.531 / 6.980 / 16.318 s** |
| Peak sampled process-tree RSS | **3,561,956 KiB** (20 ms samples; shared pages may be double counted) |
| Native cancel acknowledgment | **1 ms**, followed by a successful recovery reply |
| Offline run elapsed / exit | **173.547 s / 0** |

The measured warm p95 is below the proposed **30 s** usability gate on this host. The prior **73.568 s native p95** remains a separate qualification concern; its process path and sample differ from this WebKit run, so this result does not prove a prompt-only speedup. This is a developer acceptance window, not a packaged app launch or an Explore DOM check. The process-tree memory record and sampling limits are in [`raw/v1-memory.json`](raw/v1-memory.json).

`npm run build` passed (including `validate:content`, 15/15, and TypeScript); `npm test` passed 238/238 in 20 files. The report commit must be checked with `python3 reference/eval/check-provenance.py reference/eval/raw/v1-raw.jsonl --report-commit REPORT_COMMIT --item-set reference/eval/v1-translation-set.json` after commit. Independent rubric scoring and the final ticket verdict remain with Thufir's comment; no second v1 run is permitted.
