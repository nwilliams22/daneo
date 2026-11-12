#!/usr/bin/env bash
# Copy the installers Tauri produced into a flat directory for upload.
#
# Usage: stage-installers.sh <dest-dir> <bundle-dir>
#
# upload-artifact keeps paths relative to the common root of everything it
# uploads, so an installer uploaded beside a file from the repo root arrives as
# src-tauri/target/release/bundle/<kind>/<installer>. Staging the installers
# alone puts them at the top of the downloaded zip.
#
# Fails when the bundle directory holds no installer, or when an installer is
# not named for the product ("Daneo"), so a productName regression shows up in
# CI rather than in a user's Downloads folder.
set -euo pipefail

dest=${1:?usage: stage-installers.sh <dest-dir> <bundle-dir>}
src=${2:?usage: stage-installers.sh <dest-dir> <bundle-dir>}

mkdir -p "$dest"
found=0
while IFS= read -r -d '' file; do
  name=$(basename "$file")
  case "$name" in
    Daneo[-_]*) ;;
    *) echo "::error::installer '$name' is not named for the product 'Daneo'" >&2; exit 1 ;;
  esac
  cp "$file" "$dest/"
  found=$((found + 1))
  echo "staged $name"
done < <(find "$src" -maxdepth 1 -type f \( -name '*.dmg' -o -name '*.exe' -o -name '*.rpm' -o -name '*.AppImage' \) -print0)

if [ "$found" -eq 0 ]; then
  echo "::error::no installer found in $src" >&2
  exit 1
fi
