#!/usr/bin/env bash
# Fail unless a macOS .app bundle carries a valid ad-hoc bundle signature.
#
# A Mach-O binary that only has the arm64 linker's automatic signature
# (flags=adhoc,linker-signed; Info.plist not bound; no sealed resources) runs
# when launched from a shell, but a quarantined copy is reported by Gatekeeper
# as "damaged and can't be opened", with no Open Anyway path. That is the
# defect this gate exists to catch: the bundle must be signed as a whole.
#
# Usage: check-macos-signature.sh <path/to/daneo.app> [expected-identifier]
set -euo pipefail

app=${1:?usage: check-macos-signature.sh <app> [identifier]}
expected_id=${2:-app.daneo.desktop}
fail=0

note() { printf '%s\n' "$*"; }
bad() { printf 'FAIL: %s\n' "$*" >&2; fail=1; }

test -d "$app" || { bad "$app is not a directory"; exit 1; }

note "== codesign --verify --deep --strict --verbose=2 $app"
if ! codesign --verify --deep --strict --verbose=2 "$app"; then
  bad "bundle signature does not verify"
fi

details=$(codesign -dv --verbose=4 "$app" 2>&1) || { printf '%s\n' "$details" >&2; bad "codesign -dv failed"; exit 1; }
note "== codesign -dv --verbose=4"
printf '%s\n' "$details"

grep -qx "Identifier=$expected_id" <<<"$details" \
  || bad "Identifier is not $expected_id (an identifier like daneo-<hash> means only the linker signed the binary)"
grep -q '^Sealed Resources version=' <<<"$details" \
  || bad "no sealed resources"
grep -q '^Info.plist entries=' <<<"$details" \
  || bad "Info.plist is not bound to the signature"
if grep -q 'linker-signed' <<<"$details"; then
  bad "signature is still the linker's automatic one"
fi
test -f "$app/Contents/_CodeSignature/CodeResources" \
  || bad "missing Contents/_CodeSignature/CodeResources"

if [ "$fail" -ne 0 ]; then
  echo "macOS bundle signature check FAILED for $app" >&2
  exit 1
fi
echo "macOS bundle signature check passed for $app"
