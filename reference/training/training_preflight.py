"""Transfer a trusted local preflight result without transferring reserved fixtures."""
import hashlib
import json
from pathlib import Path


def identities(root, paths):
    return {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in paths}


def write_receipt(path, bound, source_commit):
    with Path(path).open('x') as stream:
        json.dump(dict(version=1, passed=True, identities=bound, source_commit=source_commit), stream, indent=2)
        stream.write('\n')


def read_receipt(path, bound):
    receipt = json.loads(Path(path).read_text())
    if receipt.get('version') != 1 or receipt.get('passed') is not True:
        raise ValueError('Invalid preflight receipt')
    if receipt.get('identities') != bound:
        raise ValueError('Preflight input/runner identity mismatch')
    if not isinstance(receipt.get('source_commit'), str) or len(receipt['source_commit']) != 40:
        raise ValueError('Missing source commit')
    return receipt
