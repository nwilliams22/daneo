"""Bounded BF16 adapter/merge proof. Outputs stay under ignored .local-models."""
import os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.local-models/compatibility'
for key, folder in [('HF_HOME', 'hf'), ('TRITON_CACHE_DIR', 'triton'), ('TORCHINDUCTOR_CACHE_DIR', 'inductor'), ('UNSLOTH_COMPILE_LOCATION', 'unsloth-cache')]:
    os.environ[key] = str(WORK / folder)
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
os.environ['HF_HUB_DISABLE_IMPLICIT_TOKEN'] = '1'
import hashlib
import json
import math
import subprocess
import time

subprocess.run(['python3', str(ROOT/'reference/eval/check-independent-freeze.py'), '--candidates', str(ROOT/'reference/training/smoke-examples.json')], check=True)
subprocess.run(['node', '--import', 'tsx', 'reference/training/validate-smoke.mjs'], cwd=ROOT, check=True)
from unsloth import FastLanguageModel
import torch
from huggingface_hub import snapshot_download

cfg = json.loads((ROOT/'reference/training/probe-config.json').read_text())
rows = json.loads((ROOT/'reference/training/smoke-examples.json').read_text())['items']
start = time.monotonic()
base = snapshot_download(cfg['model'], revision=cfg['revision'], token=False,
                         allow_patterns=['*.json', '*.safetensors', '*.txt', '*.model', '*.jinja', 'LICENSE*', 'README.md'])
manifest = []
for path in sorted(Path(base).rglob('*')):
    if path.is_file():
        digest = hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()
        manifest.append(dict(path=str(path.relative_to(base)), bytes=path.stat().st_size, sha256=digest))
(WORK/'base-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print('BASE VERIFIED', cfg['revision'], flush=True)
model, tokenizer = FastLanguageModel.from_pretrained(model_name=base,
    max_seq_length=cfg['max_seq_length'], dtype=torch.bfloat16,
    load_in_4bit=False, load_in_16bit=True, full_finetuning=False)
model = FastLanguageModel.get_peft_model(model, r=cfg['rank'], target_modules=cfg['target_modules'],
    lora_alpha=cfg['alpha'], lora_dropout=0, bias='none', use_gradient_checkpointing='unsloth', random_state=cfg['seed'], finetune_vision_layers=False)
text_tokenizer = getattr(tokenizer, 'tokenizer', tokenizer)
FastLanguageModel.for_training(model)
params = [(name, p) for name, p in model.named_parameters() if p.requires_grad]
assert params and all('lora_' in name for name, p in params)
before = {name: p.detach().cpu().clone() for name, p in params}
optimizer = torch.optim.AdamW([p for _, p in params], lr=cfg['learning_rate'])
torch.cuda.reset_peak_memory_stats()
losses = []
tokens = 0
train_start = time.monotonic()
for step in range(cfg['max_steps']):
    row = rows[step % len(rows)]
    messages = [dict(role='user', content=row['prompt'])]
    prefix = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
    # Response-only labels; the unchanged app prompt is context, never a label.
    response = json.dumps(row['target'], ensure_ascii=False) + text_tokenizer.eos_token
    prefix_ids = text_tokenizer(prefix, add_special_tokens=False)['input_ids']
    response_ids = text_tokenizer(response, add_special_tokens=False)['input_ids']
    ids = prefix_ids + response_ids
    assert len(ids) <= cfg['max_seq_length'], f'example has {len(ids)} tokens'
    input_ids = torch.tensor([ids], device='cuda')
    labels = torch.tensor([[-100]*len(prefix_ids)+response_ids], device='cuda')
    optimizer.zero_grad(set_to_none=True)
    loss = model(input_ids=input_ids, attention_mask=torch.ones_like(input_ids), labels=labels).loss
    value = loss.item()
    assert math.isfinite(value), f'nonfinite loss at {step}'
    loss.backward()
    optimizer.step()
    torch.cuda.synchronize()
    losses.append(value)
    tokens += len(ids)
    print(json.dumps(dict(step=step+1, loss=value, tokens=len(ids))), flush=True)
train_seconds = time.monotonic()-train_start
changed = [name for name,p in params if not torch.equal(before[name], p.detach().cpu())]
assert changed, 'no adapter parameter changed'
report = dict(config=cfg, losses=losses, changed_adapter_tensors=len(changed),
    trainable_parameters=sum(p.numel() for _,p in params), train_seconds=train_seconds,
    training_input_tokens=tokens, input_tokens_per_second=tokens/train_seconds,
    peak_allocated_bytes=torch.cuda.max_memory_allocated(), peak_reserved_bytes=torch.cuda.max_memory_reserved())
(WORK/'training-result.json').write_text(json.dumps(report, indent=2)+'\n')
model.save_pretrained(str(WORK/'adapter'))
tokenizer.save_pretrained(str(WORK/'adapter'))
model.save_pretrained_merged(str(WORK/'merged'), tokenizer, save_method='merged_16bit')
report['total_seconds_through_merge'] = time.monotonic()-start
report['merge_complete'] = True
(WORK/'training-result.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report), flush=True)
