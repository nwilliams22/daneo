"""Generate the two reproducible 1 MiB downloader fixtures outside the repository."""
import hashlib
from pathlib import Path
import sys

FIXTURES = {
    "downloader-fixture-1mib.bin": (bytes(range(256)), "fbbab289f7f94b25736c58be46a994c441fd02552cc6022352e3d86d2fab7c83"),
    "downloader-fixture-1mib-mismatch.bin": (bytes(range(255, -1, -1)), "eaeaa7acca0afcaee85d7abae4d8e5033652991ea19df161cc90ceec2803342c"),
}

if __name__ == "__main__":
    output = Path(sys.argv[1])
    output.mkdir(parents=True, exist_ok=True)
    for name, (pattern, expected) in FIXTURES.items():
        data = pattern * 4096
        digest = hashlib.sha256(data).hexdigest()
        assert digest == expected
        (output / name).write_bytes(data)
        print(f"{name}: {len(data)} bytes sha256={digest}")
