#!/usr/bin/env bash
# Start a nested desktop session for Daneo that accepts automated input.
#
# Why this exists: on the Plasma Wayland host, XTEST (xdotool) against the real
# display :0 is gated by KWin's Remote Control prompt, which no headless agent can
# answer. A nested X server has no such gate -- XTEST goes straight to that server,
# so input works unattended and cannot reach the host desktop.
#
#   scripts/qa-desktop-session.sh start    # bring the session up (idempotent)
#   scripts/qa-desktop-session.sh status   # show display, window id, pids
#   scripts/qa-desktop-session.sh shot FILE# screenshot the nested root window
#   scripts/qa-desktop-session.sh stop     # tear it all down
#
# Driving the app once it is up:
#   export DISPLAY=:7; unset XAUTHORITY WAYLAND_DISPLAY
#   xdotool mousemove X Y click 1
#   xdotool type --delay 25 '친구가 학교에 가요'      # Korean types fine
#   import -window root /tmp/shot.png
#
# There is no window manager inside, so nothing steals focus; set it once with
# `xdotool windowfocus "$(xdotool search --name '단어 Daneo' | tail -1)"` and
# keyboard events land in the app.

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QA_DISPLAY="${QA_DISPLAY:-:7}"
QA_GEOMETRY="${QA_GEOMETRY:-1600x1000}"
VITE_PORT="${VITE_PORT:-5173}"
RUNDIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/daneo-qa"
mkdir -p "$RUNDIR"

APP_BIN="$REPO/src-tauri/target/debug/daneo"

nested() { env -u XAUTHORITY -u WAYLAND_DISPLAY DISPLAY="$QA_DISPLAY" "$@"; }

host_xauth() { ls "${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"/xauth_* 2>/dev/null | head -1; }

vite_up() { curl -sf -o /dev/null "http://localhost:$VITE_PORT/"; }

xserver_up() { nested xdpyinfo >/dev/null 2>&1; }

app_window() { nested xdotool search --name '단어 Daneo' 2>/dev/null | tail -1; }

start_vite() {
  if vite_up; then echo "vite: already on :$VITE_PORT"; return 0; fi
  # The Tauri debug build loads devUrl http://localhost:5173, so the dev server
  # has to be up before the binary starts.
  ( cd "$REPO" && setsid nohup npm run dev >"$RUNDIR/vite.log" 2>&1 & )
  for _ in $(seq 1 40); do vite_up && { echo "vite: started on :$VITE_PORT"; return 0; }; sleep 0.5; done
  echo "vite: FAILED to come up -- see $RUNDIR/vite.log" >&2; return 1
}

start_xserver() {
  if xserver_up; then echo "xserver: $QA_DISPLAY already running"; return 0; fi
  # -ac drops access control so the app and xdotool connect without an auth file.
  # The server is nested inside the host session, so this is not reachable off-box.
  DISPLAY=:0 XAUTHORITY="$(host_xauth)" \
    setsid nohup Xephyr "$QA_DISPLAY" -screen "$QA_GEOMETRY" -ac -resizeable \
      -title "Daneo QA nested session" >"$RUNDIR/xephyr.log" 2>&1 &
  for _ in $(seq 1 30); do xserver_up && { echo "xserver: $QA_DISPLAY up ($QA_GEOMETRY)"; return 0; }; sleep 0.5; done
  echo "xserver: FAILED to come up -- see $RUNDIR/xephyr.log" >&2; return 1
}

start_app() {
  if [ -n "$(app_window)" ]; then echo "app: already running on $QA_DISPLAY"; return 0; fi
  [ -x "$APP_BIN" ] || { echo "app: $APP_BIN missing -- build it first, see BAD-219 for the cargo env" >&2; return 1; }
  # Xephyr has no DRI3, so webkit needs its accelerated paths off or it renders blank.
  ( cd "$REPO" && env -u WAYLAND_DISPLAY -u XAUTHORITY \
      DISPLAY="$QA_DISPLAY" GDK_BACKEND=x11 \
      WEBKIT_DISABLE_DMABUF_RENDERER=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 \
      setsid nohup "$APP_BIN" >"$RUNDIR/app.log" 2>&1 & )
  for _ in $(seq 1 60); do
    WID="$(app_window)"
    if [ -n "$WID" ]; then
      nested xdotool windowfocus "$WID"
      echo "app: window $WID focused on $QA_DISPLAY"; return 0
    fi
    sleep 1
  done
  echo "app: window never appeared -- see $RUNDIR/app.log" >&2; return 1
}

case "${1:-start}" in
  start)
    start_vite && start_xserver && start_app || exit 1
    echo
    echo "Ready. Drive it with:  export DISPLAY=$QA_DISPLAY; unset XAUTHORITY WAYLAND_DISPLAY"
    echo "Logs: $RUNDIR/{vite,xephyr,app}.log"
    ;;
  status)
    vite_up && echo "vite:    up on :$VITE_PORT" || echo "vite:    down"
    xserver_up && echo "xserver: up on $QA_DISPLAY" || echo "xserver: down"
    WID="$(app_window)"
    [ -n "$WID" ] && echo "app:     window $WID" || echo "app:     down"
    ;;
  shot)
    OUT="${2:-$RUNDIR/shot.png}"
    nested import -window root "$OUT" && echo "wrote $OUT"
    ;;
  stop)
    pkill -f "$APP_BIN" 2>/dev/null
    pkill -f "Xephyr $QA_DISPLAY" 2>/dev/null
    echo "stopped app and $QA_DISPLAY (vite left running)"
    ;;
  *)
    echo "usage: $0 {start|status|shot [FILE]|stop}" >&2; exit 2
    ;;
esac
