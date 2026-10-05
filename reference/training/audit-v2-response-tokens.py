"""Check v2 response-only labels locally, including every literal-gap token."""
import hashlib
import json
import os
from pathlib import Path

os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
from transformers import AutoTokenizer

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'reference/training/evidence/v2-gap-replay'
tokenizer = AutoTokenizer.from_pretrained(ROOT/'.local-models/v2-lr1/merged', local_files_only=True)
prompt = json.loads((OUT/'embedded-prompt.json').read_text())
counts = []
for name in ['dataset-v2', 'development-v2']:
    for row in json.loads((ROOT/f'reference/training/{name}.json').read_text())['items']:
        content = prompt.replace('{{DIRECTION}}', row['target']['direction']).replace('{{INPUT}}', row['input'])
        prefix = tokenizer.apply_chat_template([dict(role='user', content=content)], tokenize=False, add_generation_prompt=True, enable_thinking=False)
        prefix_ids = tokenizer(prefix, add_special_tokens=False)['input_ids']
        response = json.dumps(row['target'], ensure_ascii=False)+tokenizer.eos_token
        encoded = tokenizer(response, add_special_tokens=False, return_offsets_mapping=True)
        response_ids = encoded['input_ids']
        labels = [-100]*len(prefix_ids)+response_ids
        assert len(labels) <= 1024
        start = response.index('"literal_gap":')
        end = response.index(', "cultural_note":', start)
        positions = [i for i, (a,b) in enumerate(encoded['offset_mapping']) if a < end and b > start]
        assert positions and all(labels[len(prefix_ids)+i] != -100 for i in positions)
        counts.append(dict(id=row['id'], split=row['split'], inputTokens=len(labels),
                           responseTokens=len(response_ids), supervisedGapFieldTokens=len(positions),
                           nonempty=bool(row['target']['literal_gap'].strip())))
historical = json.loads((ROOT/'reference/training/evidence/v2-lr1/training-result.json').read_text())
by_id = {r['id']: r for r in counts}
assert all(r['input_tokens'] == by_id[r['id']]['inputTokens'] for r in historical['losses'])
assert sum(r['responseTokens'] for r in counts if r['split'] == 'development') == historical['development_losses'][0]['response_tokens']
report = dict(historicalTrainingTokenLengthsMatch=True, historicalDevelopmentTokenTotalMatches=True,
              tokenizerWarning='Transformers warns about the tokenizer regex; no tokenizer change was applied. Reproduced token counts match every historical training step and the historical development total.', method='Reproduce train-v1.py encode/label construction with retained merged tokenizer, original v2 prompt, and frozen v2 splits; no model load or optimization',
              limitation='Verifies current reproduction of label construction, not historical gradients or learned capability',
              rows=len(counts), maxInputTokens=max(r['inputTokens'] for r in counts), maxSeqLength=1024,
              allGapFieldTokensSupervised=True, truncation=False, items=counts)
(OUT/'response-token-audit.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='items'}, indent=2))
