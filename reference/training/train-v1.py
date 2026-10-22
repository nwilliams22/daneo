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
parser.add_argument('--config', default='v1-config.json')
parser.add_argument('--name')
parser.add_argument('--write-preflight', type=Path, help='Validate locally and write a hash-bound receipt, without loading a model')
parser.add_argument('--preflight-receipt', type=Path, help='Use a trusted local preflight receipt on a remote GPU without sealed fixtures')
parser.add_argument('--resume', action='store_true', help='Resume an atomic checkpoint in the same output directory')
args = parser.parse_args()
WORK = ROOT / '.local-models' / (args.name or ('v1-probe' if args.probe else 'v1'))
for key, folder in [('HF_HOME', 'hf'), ('TRITON_CACHE_DIR', 'triton'), ('TORCHINDUCTOR_CACHE_DIR', 'inductor'), ('UNSLOTH_COMPILE_LOCATION', 'unsloth-cache')]:
    os.environ[key] = str(CACHE / folder)
os.environ.update(HF_HUB_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1', HF_HUB_DISABLE_IMPLICIT_TOKEN='1')

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

cfg = json.loads((ROOT/'reference/training'/args.config).read_text())
dataset = ROOT/'reference/training'/cfg.get('dataset', 'dataset-v1.json')
development = ROOT/'reference/training'/cfg['development'] if 'development' in cfg else None
if development:
    assert sha(development) == cfg['development_sha256']
assert sha(dataset) == cfg['dataset_sha256']
dataset_document = json.loads(dataset.read_text())
if dataset.name != 'dataset-v1.json':
    assert dataset_document.get('trainingAllowed') is True, 'dataset is not approved for training'
    assert all(row.get('reviewStatus') == 'approved' for row in dataset_document['items']), 'unreviewed targets'
# The incumbent experiments and preserved worker use this exact prompt.
# Do not silently train on a later product-prompt revision.
assert sha(ROOT/'src/lib/translation-prompt.json') == '81f525b2fb54ac5b1a16d3cfb7ba2fc28ed88db156156cff5fbddb9ff043e669', 'Incumbent prompt mismatch: stop before training or issuing a preflight receipt'
from training_preflight import identities, read_receipt, write_receipt
bound_paths = [Path(__file__), ROOT/'reference/training/training_preflight.py',
               ROOT/'reference/training'/args.config, dataset,
               ROOT/'src/lib/translation-prompt.json', ROOT/'reference/training/evidence/base-manifest.json']
if not args.probe:
    bound_paths.append(ROOT/'.local-models/v1-probe/schema-result.json')
if development:
    bound_paths.append(development)
bound = identities(ROOT, bound_paths)
if args.preflight_receipt:
    assert not args.write_preflight, 'Choose local validation or remote receipt'
    receipt = read_receipt(args.preflight_receipt, bound)
    source_commit = receipt['source_commit']
else:
    # The assigned checkout can be mounted with a different filesystem owner.
    # Scope Git trust to this command, without changing global configuration.
    checker = """import runpy, subprocess, sys
original = subprocess.check_output
def scoped_git(argv, **kwargs):
    if argv[0] == 'git':
        argv = ['git', '-c', 'safe.directory=' + str(__import__('pathlib').Path.cwd()), *argv[1:]]
    return original(argv, **kwargs)
subprocess.check_output = scoped_git
sys.argv = ['reference/eval/check-independent-freeze.py', '--candidates', sys.argv[1]]
runpy.run_path(sys.argv[0], run_name='__main__')
"""
    subprocess.run(['python3', '-c', checker, str(dataset)], cwd=ROOT, check=True)
    subprocess.run(['node', '--import', 'tsx', 'reference/training/validate-v1.mjs', '--dataset-path', str(dataset), *(['--development-path', str(development)] if development else [])], cwd=ROOT, check=True)
    source_commit = subprocess.check_output(['git', '-c', f'safe.directory={ROOT}', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if not args.probe:
    gate = json.loads((ROOT/'.local-models/v1-probe/schema-result.json').read_text())
    assert gate['passed'], 'QLoRA export/runtime probe must pass first'
if args.write_preflight:
    write_receipt(args.write_preflight, bound, source_commit)
    print('PASS: wrote hash-bound local preflight receipt; no model loaded')
    raise SystemExit(0)
if args.resume:
    assert (WORK/'checkpoint.pt').is_file(), 'No resumable checkpoint'
    assert not (WORK/'training-result.json').exists(), 'Training already finished; do not replay'
else:
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
def encode(rows):
    encoded = []
    for row in rows:
        content = prompt.replace('{{DIRECTION}}', row['target']['direction']).replace('{{INPUT}}', row['input'])
        prefix = tokenizer.apply_chat_template([dict(role='user', content=content)], tokenize=False, add_generation_prompt=True, enable_thinking=False)
        prefix_ids = text_tokenizer(prefix, add_special_tokens=False)['input_ids']
        response_ids = text_tokenizer(json.dumps(row['target'], ensure_ascii=False)+text_tokenizer.eos_token, add_special_tokens=False)['input_ids']
        assert len(prefix_ids)+len(response_ids) <= cfg['max_seq_length'], row['id']
        encoded.append((row['id'], prefix_ids, response_ids))
    return encoded

encoded = encode(rows)
dev_encoded = encode(json.loads(development.read_text())['items']) if development else []

def development_loss(step, epoch):
    model.eval()
    total, tokens = 0.0, 0
    with torch.no_grad():
        for _, prefix_ids, response_ids in dev_encoded:
            ids = torch.tensor([prefix_ids+response_ids], device='cuda')
            labels = torch.tensor([[-100]*len(prefix_ids)+response_ids], device='cuda')
            value = model(input_ids=ids, attention_mask=torch.ones_like(ids), labels=labels).loss.item()
            assert math.isfinite(value)
            total += value * len(response_ids)
            tokens += len(response_ids)
    model.train()
    result = dict(step=step, epoch=epoch, response_token_mean_loss=total/tokens, response_tokens=tokens)
    print(json.dumps(dict(development=result)), flush=True)
    return result

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
dev_losses = [development_loss(0, 0)] if dev_encoded and not args.resume else []
best_loss = float('inf')
best_state = None
selected_epoch = None
completed_steps = 0
prior_train_seconds = 0.0
checkpoint_identity = dict(config=cfg, prompt_sha256=sha(ROOT/'src/lib/translation-prompt.json'),
                           runner_sha256=sha(Path(__file__)), probe=args.probe)
if args.resume:
    saved = torch.load(WORK/'checkpoint.pt', map_location='cpu', weights_only=False)
    assert saved['identity'] == checkpoint_identity, 'Checkpoint input/runner identity mismatch'
    with torch.no_grad():
        for n,p in params:
            p.copy_(saved['adapter'][n])
    optimizer.load_state_dict(saved['optimizer'])
    losses, dev_losses = saved['losses'], saved['dev_losses']
    best_loss, best_state, selected_epoch = saved['best_loss'], saved['best_state'], saved['selected_epoch']
    completed_steps = saved['step']
    prior_train_seconds = saved['train_seconds']
    random.setstate(saved['python_rng'])
    torch.set_rng_state(saved['torch_rng'])
    torch.cuda.set_rng_state_all(saved['cuda_rng'])

def checkpoint(step):
    saved = dict(identity=checkpoint_identity, step=step,
                 train_seconds=prior_train_seconds + time.monotonic()-train_start,
                 adapter={n:p.detach().cpu().clone() for n,p in params},
                 optimizer=optimizer.state_dict(), losses=losses, dev_losses=dev_losses,
                 best_loss=best_loss, best_state=best_state, selected_epoch=selected_epoch,
                 python_rng=random.getstate(), torch_rng=torch.get_rng_state(),
                 cuda_rng=torch.cuda.get_rng_state_all())
    temporary = WORK/'checkpoint.pt.tmp'
    with temporary.open('wb') as stream:
        torch.save(saved, stream)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, WORK/'checkpoint.pt')

if not args.resume:
    checkpoint(0)
for step,(epoch,i) in enumerate(order, 1):
    if step <= completed_steps:
        continue
    rid,prefix_ids,response_ids = encoded[i]
    ids = torch.tensor([prefix_ids+response_ids], device='cuda')
    labels = torch.tensor([[-100]*len(prefix_ids)+response_ids], device='cuda')
    if cfg.get('schedule') == 'cosine':
        warmup = cfg['warmup_steps']
        factor = step/warmup if step <= warmup else 0.5*(1+math.cos(math.pi*(step-warmup)/(len(order)-warmup)))
        for group in optimizer.param_groups:
            group['lr'] = cfg['learning_rate']*factor
    optimizer.zero_grad(set_to_none=True)
    loss = model(input_ids=ids, attention_mask=torch.ones_like(ids), labels=labels).loss
    value = loss.item()
    assert math.isfinite(value)
    loss.backward()
    norm = torch.nn.utils.clip_grad_norm_([p for _,p in params], cfg['max_grad_norm'])
    assert math.isfinite(norm.item())
    optimizer.step()
    torch.cuda.synchronize()
    record = dict(step=step, epoch=epoch, id=rid, loss=value, input_tokens=ids.numel(), grad_norm=norm.item(), learning_rate=optimizer.param_groups[0]['lr'])
    losses.append(record)
    print(json.dumps(record), flush=True)
    if dev_encoded and step % len(rows) == 0:
        measured = development_loss(step, epoch)
        dev_losses.append(measured)
        if measured['response_token_mean_loss'] < best_loss:
            best_loss = measured['response_token_mean_loss']
            selected_epoch = epoch
            best_state = {n:p.detach().cpu().clone() for n,p in params}
        (WORK/'development-losses.json').write_text(json.dumps(dev_losses, indent=2)+'\n')
    if step % 25 == 0 or step % len(rows) == 0 or step == len(order):
        checkpoint(step)
if best_state is not None:
    with torch.no_grad():
        for n,p in params:
            p.copy_(best_state[n])
changed = sum(not torch.equal(before[n],p.detach().cpu()) for n,p in params)
assert changed
report = dict(development_losses=dev_losses, selected_epoch=selected_epoch, selected_development_loss=best_loss if dev_encoded else None, quantization_config=quantization_config, versions={name: importlib.metadata.version(name) for name in ['unsloth', 'unsloth_zoo', 'transformers', 'peft', 'torch', 'bitsandbytes']}, config=cfg, probe=args.probe, steps=len(order), losses=losses, changed_adapter_tensors=changed, trainable_parameters=sum(p.numel() for _,p in params), train_seconds=prior_train_seconds+time.monotonic()-train_start, peak_allocated_bytes=torch.cuda.max_memory_allocated(), peak_reserved_bytes=torch.cuda.max_memory_reserved(), prompt_sha256=sha(ROOT/'src/lib/translation-prompt.json'), source_commit=source_commit, resumed_from_step=completed_steps)
(WORK/'training-result.json').write_text(json.dumps(report, indent=2, default=str)+'\n')
model.save_pretrained(str(WORK/'adapter'))
tokenizer.save_pretrained(str(WORK/'adapter'))
model.save_pretrained_merged(str(WORK/'merged'), tokenizer, save_method='merged_16bit')
report.update(total_seconds_through_merge=time.monotonic()-start, merge_complete=True)
(WORK/'training-result.json').write_text(json.dumps(report, indent=2, default=str)+'\n')
print(json.dumps({k:v for k,v in report.items() if k != 'losses'}, default=str), flush=True)
