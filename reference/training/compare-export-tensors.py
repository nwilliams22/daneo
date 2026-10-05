"""Compare baseline and matched GGUF tensor bytes without inference."""
import hashlib
import argparse
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.local-models/compatibility'
sys.path.insert(0, str(WORK / 'llama-matched/gguf-py'))
from gguf import GGUFReader
parser = argparse.ArgumentParser()
parser.add_argument('--q8', action='store_true', help='Verify retained Q8 source derivation without exporting or inference')
args = parser.parse_args()
evidence = ROOT / 'reference/training/evidence'
derivation = None
if args.q8:
    exported = json.loads((evidence / 'q8-export-result.json').read_text())
    expected_bf16 = '5c407dc7aa856faa14fde45e5f837066719c5aad75115e6afc39bbeb2e77a88c'
    identities = []
    for name, size, digest in [
        ('matched-BF16.gguf', 8665619744, expected_bf16),
        ('q8-BF16.gguf', 8665619744, expected_bf16),
        ('llama-matched/build/bin/llama-quantize', 12576,
         '398b543d82be71fc61f7190c87f6bd13772cb89dd630f72f57b2bb0ff2200f42'),
        ('q8-Q8_0.gguf', 4610579744,
         '26e1c9db711b5fc43dc2b373bae825e506d55129b735a1bfe2bafce732e5fd4d'),
    ]:
        path = WORK / name
        with path.open('rb') as source:
            actual = hashlib.file_digest(source, 'sha256').hexdigest()
        assert path.stat().st_size == size and actual == digest, name
        identities.append(dict(path=name, bytes=size, sha256=actual))
    quantize = next(step['command'] for step in exported['steps'] if step['stage'] == 'quantize')
    assert quantize == [str(WORK / 'llama-matched/build/bin/llama-quantize'),
                        str(WORK / 'q8-BF16.gguf'), str(WORK / 'q8-Q8_0.gguf'), 'Q8_0', '8']
    derivation = dict(identities=identities, recorded_quantize_command=quantize,
                      source_byte_identical=True, existing_bf16_reused=False,
                      limitation='Recorded command links the Q8 artifact to a reconverted, byte-identical BF16 source; tensor equality alone does not prove a quantization operation.')
reports = []
for suffix in (['BF16'] if args.q8 else ['BF16', 'Q4_K_M']):
    before = GGUFReader(str(WORK / f'{"matched" if args.q8 else "smoke"}-{suffix}.gguf'))
    after = GGUFReader(str(WORK / f'{"q8" if args.q8 else "matched"}-{suffix}.gguf'))
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
out = evidence / ('q8-tensor-comparison.json' if args.q8 else 'matched-tensor-comparison.json')
if args.q8:
    assert not reports[0]['differing_tensors'] and not reports[0]['differing_metadata']
    derivation['comparisons'] = reports
out.write_text(json.dumps(derivation if args.q8 else reports, indent=2) + '\n')
for row in reports:
    print({k:v for k,v in row.items() if k != 'tensor_sha256'})
