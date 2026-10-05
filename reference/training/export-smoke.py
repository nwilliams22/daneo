"""Export the merged adapter using an explicitly pinned converter/quantizer."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT/'.local-models/compatibility'
LLAMA_COMMIT = 'd89651a7b205c03c4a0b13cd0646d400dc929f79'
assert json.loads((WORK/'training-result.json').read_text())['merge_complete']
start = time.monotonic()
subprocess.run([sys.executable, str(WORK/'llama.cpp/convert_hf_to_gguf.py'), str(WORK/'merged'),
    '--outfile', str(WORK/'smoke-BF16.gguf'), '--outtype', 'bf16'], check=True)
converted = time.monotonic()
subprocess.run([str(WORK/'llama.cpp/build/bin/llama-quantize'),str(WORK/'smoke-BF16.gguf'),
    str(WORK/'smoke-Q4_K_M.gguf'), 'Q4_K_M', '8'], check=True)
quantized = time.monotonic()
files = []
for name in ['llama.cpp.tar.gz', 'smoke-BF16.gguf', 'smoke-Q4_K_M.gguf', 'adapter/adapter_model.safetensors']:
    path = WORK/name
    with path.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    files.append(dict(path=name, bytes=path.stat().st_size, sha256=digest))
report = dict(converter_commit=LLAMA_COMMIT, convert_seconds=converted-start,
    quantize_seconds=quantized-converted, artifacts=files)
(WORK/'export-result.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report),flush=True)
