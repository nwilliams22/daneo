"""Compare baseline and matched GGUF tensor bytes without inference."""
import hashlib
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.local-models/compatibility'
sys.path.insert(0, str(WORK / 'llama-matched/gguf-py'))
from gguf import GGUFReader
reports = []
for suffix in ['BF16', 'Q4_K_M']:
    before = GGUFReader(str(WORK / f'smoke-{suffix}.gguf'))
    after = GGUFReader(str(WORK / f'matched-{suffix}.gguf'))
    assert [t.name for t in before.tensors] == [t.name for t in after.tensors]
    differing = []
    hashes = []
    for left, right in zip(before.tensors, after.tensors):
        a = hashlib.sha256(left.data).hexdigest()
        b = hashlib.sha256(right.data).hexdigest()
        equal = a == b and left.tensor_type == right.tensor_type and (left.shape == right.shape).all()
        if not equal:
            differing.append(left.name)
        hashes.append(dict(name=left.name, before=a, after=b))
    # Each metadata field consists of raw parts, including its key and value.
    def field_hash(field):
        h = hashlib.sha256()
        for part in field.parts:
            h.update(part)
        return h.hexdigest()
    metadata_changed = [key for key in sorted(before.fields.keys() | after.fields.keys())
                        if key not in before.fields or key not in after.fields
                        or field_hash(before.fields[key]) != field_hash(after.fields[key])]
    reports.append(dict(precision=suffix, tensors=len(hashes), differing_tensors=differing,
                        differing_metadata=metadata_changed, tensor_sha256=hashes))
out = ROOT / 'reference/training/evidence/matched-tensor-comparison.json'
out.write_text(json.dumps(reports, indent=2) + '\n')
for row in reports:
    print({k:v for k,v in row.items() if k != 'tensor_sha256'})
