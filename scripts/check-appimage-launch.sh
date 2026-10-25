#!/usr/bin/env bash
# Ordinary FUSE launch with an empty learner profile and no developer environment.
set -euo pipefail
image=$1
evidence=$2
profile=$(mktemp -d)
mkdir -p "$profile"/{data,config,cache,runtime}
chmod 700 "$profile/runtime"
pid=
cleanup() {
  local status=$?
  if [[ -n "$pid" ]]; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
  # WebKit's helper processes outlive the main pid by a moment and keep writing
  # into the isolated profile, so `rm -rf` races them and reports "Directory not
  # empty". Under `set -e` that made the EXIT trap the job's verdict: on
  # 2026-10-25 the launch passed — right window, right geometry, no missing
  # libraries — and the run went red on the tidy-up. Retry once, and never let
  # the cleanup decide the result.
  rm -rf "$profile" 2>/dev/null || {
    sleep 2
    rm -rf "$profile" 2>/dev/null || true
  }
  exit "$status"
}
trap cleanup EXIT
printf 'env -i [isolated profile and X display] %q\n' "$image" > "$evidence/command.txt"
env -i PATH=/usr/bin:/bin HOME="$profile" XDG_DATA_HOME="$profile/data" \
  XDG_CONFIG_HOME="$profile/config" XDG_CACHE_HOME="$profile/cache" \
  XDG_RUNTIME_DIR="$profile/runtime" DISPLAY="$DISPLAY" XAUTHORITY="$XAUTHORITY" \
  LANG=C.UTF-8 LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe \
  "$image" > "$evidence/app.log" 2>&1 &
pid=$!
window=
for attempt in $(seq 1 30); do
  kill -0 "$pid"
  window=$(xdotool search --onlyvisible --name 'Daneo' 2>/dev/null | head -1 || true)
  [[ -n "$window" ]] && break
  sleep 1
done
test -n "$window"
sleep 10
kill -0 "$pid"
xdotool getwindowname "$window" > "$evidence/window.txt"
xdotool getwindowgeometry "$window" >> "$evidence/window.txt"
grep 'fuse.*[Aa]pp[Ii]mage' /proc/mounts > "$evidence/fuse-mount.txt"
import -window "$window" "$evidence/first-launch.png"
if grep -Ei 'error while loading shared libraries|version .* not found|symbol lookup error' "$evidence/app.log"; then
  exit 1
fi
cat "$evidence/window.txt"
