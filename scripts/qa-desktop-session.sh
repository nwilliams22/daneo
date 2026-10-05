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
#   scripts/qa-desktop-session.sh fit      # resize the app window to fill the screen
#   scripts/qa-desktop-session.sh shot FILE# screenshot the app window (--root for the screen)
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
#
# No window manager also means nothing maximizes the window: Tauri opens it at the
# 1100x800 configured in tauri.conf.json and it sits in the top-left of the larger
# nested screen, leaving dead black to the right and below. `start` now fits the
# window to the screen itself (QA_FIT_WINDOW=0 to keep the shipped 1100x800), and
# `shot` captures the window rather than the root so a screenshot is all app.
#
# The nested window does NOT need host focus, and does not need to be visible.
# Measured 2026-10-04: xdotool/import here are clients of :7, so input and capture
# never touch the host. With the host pointer on another monitor and the Xephyr
# window *minimized*, a nested click+type still landed in the app and the capture
# came back complete with 0.0% black. Use the monitor for anything; the only way to
# disturb a run is to focus the Xephyr window and type, which forwards your real
# keystrokes into the app under test.
#
# The one thing that does break it: resizing the Xephyr window. `-resizeable` means
# the host window size *is* the nested screen size (measured: host 1400x900 ->
# `xdpyinfo` 1400x900), and the app window does not follow, so it ends up clipped.
# `fit` reads the live screen size, so run it after any resize.

set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QA_DISPLAY="${QA_DISPLAY:-:7}"
QA_GEOMETRY="${QA_GEOMETRY:-1600x1000}"
QA_FIT_WINDOW="${QA_FIT_WINDOW:-1}"
VITE_PORT="${VITE_PORT:-5173}"
RUNDIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/daneo-qa"
mkdir -p "$RUNDIR"

APP_BIN="$REPO/src-tauri/target/debug/daneo"

nested() { env -u XAUTHORITY -u WAYLAND_DISPLAY DISPLAY="$QA_DISPLAY" "$@"; }

host_xauth() { ls "${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"/xauth_* 2>/dev/null | head -1; }

vite_up() { curl -sf -o /dev/null "http://localhost:$VITE_PORT/"; }

xserver_up() { nested xdpyinfo >/dev/null 2>&1; }

app_window() { nested xdotool search --name '단어 Daneo' 2>/dev/null | tail -1; }

# The live screen size, not QA_GEOMETRY: Xephyr is -resizeable, so dragging the host
# window changes the nested screen out from under us.
screen_size() { nested xdpyinfo 2>/dev/null | awk '/dimensions:/ {print $2; exit}'; }

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

fit_window() {
  WID="${1:-$(app_window)}"
  [ -n "$WID" ] || { echo "fit: no app window on $QA_DISPLAY" >&2; return 1; }
  DIM="$(screen_size)"; [ -n "$DIM" ] || DIM="$QA_GEOMETRY"
  W="${DIM%x*}"; H="${DIM#*x}"
  nested xdotool windowmove "$WID" 0 0 windowsize "$WID" "$W" "$H" || return 1
  # The WebKit view relays out on the X resize; give it a beat before a screenshot.
  sleep 0.5
  echo "fit: window $WID resized to ${W}x${H}"
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
      echo "app: window $WID focused on $QA_DISPLAY"
      [ "$QA_FIT_WINDOW" = "1" ] && fit_window "$WID"
      return 0
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
  fit)
    fit_window || exit 1
    ;;
  shot)
    TARGET=root
    if [ "${2:-}" = "--root" ]; then shift; else TARGET="$(app_window)"; [ -n "$TARGET" ] || TARGET=root; fi
    OUT="${2:-$RUNDIR/shot.png}"
    nested import -window "$TARGET" "$OUT" && echo "wrote $OUT (window $TARGET)"
    ;;
  stop)
    pkill -f "$APP_BIN" 2>/dev/null
    pkill -f "Xephyr $QA_DISPLAY" 2>/dev/null
    echo "stopped app and $QA_DISPLAY (vite left running)"
    ;;
  *)
    echo "usage: $0 {start|status|fit|shot [--root] [FILE]|stop}" >&2; exit 2
    ;;
esac
