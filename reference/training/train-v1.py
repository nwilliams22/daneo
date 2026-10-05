"""Offline QLoRA, with a separate two-step export gate before the fixed v1 run."""
import argparse
import hashlib
import json
import importlib.metadata
import math
import os
from pathlib import Path
import random
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / '.local-models/compatibility'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--probe', action='store_true')
args = parser.parse_args()
WORK = ROOT / '.local-models' / ('v1-probe' if args.probe else 'v1')
for key, folder in [('HF_HOME', 'hf'), ('TRITON_CACHE_DIR', 'triton'), ('TORCHINDUCTOR_CACHE_DIR', 'inductor'), ('UNSLOTH_COMPILE_LOCATION', 'unsloth-cache')]:
    os.environ[key] = str(CACHE / folder)
os.environ.update(HF_HUB_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1', HF_HUB_DISABLE_IMPLICIT_TOKEN='1')

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

cfg = json.loads((ROOT/'reference/training/v1-config.json').read_text())
dataset = ROOT/'reference/training/dataset-v1.json'
assert sha(dataset) == cfg['dataset_sha256']
subprocess.run(['python3', 'reference/eval/check-independent-freeze.py', '--candidates', str(dataset)], cwd=ROOT, check=True)
subprocess.run(['node', '--import', 'tsx', 'reference/training/validate-v1.mjs', '--dataset'], cwd=ROOT, check=True)
if not args.probe:
    gate = json.loads((ROOT/'.local-models/v1-probe/schema-result.json').read_text())
    assert gate['passed'], 'QLoRA export/runtime probe must pass first'
assert not WORK.exists(), f'Refuse to overwrite {WORK}'
WORK.mkdir()
base = CACHE/'hf/hub/models--Qwen--Qwen3.5-4B/snapshots'/cfg['revision']
for entry in json.loads((ROOT/'reference/training/evidence/base-manifest.json').read_text()):
    path = base/entry['path']
    assert path.stat().st_size == entry['bytes'] and sha(path) == entry['sha256'], str(path)
from unsloth import FastLanguageModel
import torch
random.seed(cfg['seed'])
torch.manual_seed(cfg['seed'])
start = time.monotonic()
model, tokenizer = FastLanguageModel.from_pretrained(model_name=str(base), max_seq_length=cfg['max_seq_length'], dtype=torch.bfloat16, load_in_4bit=True, full_finetuning=False)
model = FastLanguageModel.get_peft_model(model, r=cfg['rank'], target_modules=cfg['target_modules'], lora_alpha=cfg['alpha'], lora_dropout=0, bias='none', use_gradient_checkpointing='unsloth', random_state=cfg['seed'], finetune_vision_layers=False)
quantization_config = model.config.quantization_config.to_dict() if hasattr(model.config.quantization_config, 'to_dict') else model.config.quantization_config
text_tokenizer = getattr(tokenizer, 'tokenizer', tokenizer)
FastLanguageModel.for_training(model)
rows = json.loads(dataset.read_text())['items']
prompt = json.loads((ROOT/'src/lib/translation-prompt.json').read_text())
encoded = []
for row in rows:
    content = prompt.replace('{{DIRECTION}}', row['target']['direction']).replace('{{INPUT}}', row['input'])
    prefix = tokenizer.apply_chat_template([dict(role='user', content=content)], tokenize=False, add_generation_prompt=True, enable_thinking=False)
    prefix_ids = text_tokenizer(prefix, add_special_tokens=False)['input_ids']
    response_ids = text_tokenizer(json.dumps(row['target'], ensure_ascii=False)+text_tokenizer.eos_token, add_special_tokens=False)['input_ids']
    assert len(prefix_ids)+len(response_ids) <= cfg['max_seq_length'], row['id']
    encoded.append((row['id'], prefix_ids, response_ids))
params = [(n,p) for n,p in model.named_parameters() if p.requires_grad]
assert params and all('lora_' in n for n,p in params)
before = {n:p.detach().cpu().clone() for n,p in params}
optimizer = torch.optim.AdamW([p for _,p in params], lr=cfg['learning_rate'], weight_decay=cfg['weight_decay'])
order = []
rng = random.Random(cfg['seed'])
for epoch in range(cfg['epochs']):
    indices = list(range(len(rows)))
    rng.shuffle(indices)
    order.extend((epoch+1,i) for i in indices)
if args.probe:
    order = order[:2]
torch.cuda.reset_peak_memory_stats()
losses = []
train_start = time.monotonic()
for step,(epoch,i) in enumerate(order, 1):
    rid,prefix_ids,response_ids = encoded[i]
    ids = torch.tensor([prefix_ids+response_ids], device='cuda')
    labels = torch.tensor([[-100]*len(prefix_ids)+response_ids], device='cuda')
    optimizer.zero_grad(set_to_none=True)
    loss = model(input_ids=ids, attention_mask=torch.ones_like(ids), labels=labels).loss
    value = loss.item()
    assert math.isfinite(value)
    loss.backward()
    norm = torch.nn.utils.clip_grad_norm_([p for _,p in params], cfg['max_grad_norm'])
    assert math.isfinite(norm.item())
    optimizer.step()
    torch.cuda.synchronize()
    record = dict(step=step, epoch=epoch, id=rid, loss=value, input_tokens=ids.numel(), grad_norm=norm.item())
    losses.append(record)
    print(json.dumps(record), flush=True)
changed = sum(not torch.equal(before[n],p.detach().cpu()) for n,p in params)
assert changed
report = dict(quantization_config=quantization_config, versions={name: importlib.metadata.version(name) for name in ['unsloth', 'unsloth_zoo', 'transformers', 'peft', 'torch', 'bitsandbytes']}, config=cfg, probe=args.probe, steps=len(order), losses=losses, changed_adapter_tensors=changed, trainable_parameters=sum(p.numel() for _,p in params), train_seconds=time.monotonic()-train_start, peak_allocated_bytes=torch.cuda.max_memory_allocated(), peak_reserved_bytes=torch.cuda.max_memory_reserved(), prompt_sha256=sha(ROOT/'src/lib/translation-prompt.json'), source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip())
(WORK/'training-result.json').write_text(json.dumps(report, indent=2, default=str)+'\n')
model.save_pretrained(str(WORK/'adapter'))
tokenizer.save_pretrained(str(WORK/'adapter'))
model.save_pretrained_merged(str(WORK/'merged'), tokenizer, save_method='merged_16bit')
report.update(total_seconds_through_merge=time.monotonic()-start, merge_complete=True)
(WORK/'training-result.json').write_text(json.dumps(report, indent=2, default=str)+'\n')
print(json.dumps({k:v for k,v in report.items() if k != 'losses'}, default=str), flush=True)
