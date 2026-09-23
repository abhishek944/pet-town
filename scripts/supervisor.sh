#!/bin/sh
set -eu

PLUGIN_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
STATE_DIR=${HERDR_PLUGIN_STATE_DIR:-"${HOME}/.local/state/herdr/plugins/pet-town"}
PID_FILE="$STATE_DIR/renderer.pid"
BINARY_FILE="$STATE_DIR/renderer.binary"
START_FILE="$STATE_DIR/renderer.started"
DIGEST_FILE="$STATE_DIR/renderer.sha256"
LOCK_FILE="$STATE_DIR/control.lock"
SESSIONS_DIR="$STATE_DIR/sessions"
RELOAD_RESULT_FILE="$STATE_DIR/preferences.reload-result"
BRIDGE_DIR="${HOME}/.local/state/pet-town"
BRIDGE_POINTER="$BRIDGE_DIR/herdr-state-dir"
APP_LOCK_FILE="$BRIDGE_DIR/app.lock"

mkdir -p "$STATE_DIR" "$SESSIONS_DIR" "$BRIDGE_DIR"
printf '%s\n' "$STATE_DIR" >"$BRIDGE_POINTER.tmp.$$"
mv "$BRIDGE_POINTER.tmp.$$" "$BRIDGE_POINTER"

# lockf holds a kernel-backed lock for the lifetime of the nested process. It has
# no stale-PID or partially-written lock-file race after a crash.
if [ "${PET_TOWN_LOCKED:-0}" != 1 ]; then
  PET_TOWN_LOCKED=1 lockf -t 15 "$LOCK_FILE" sh "$0" "$@"
  exit $?
fi

. "$PLUGIN_ROOT/scripts/supervisor/processes.sh"
. "$PLUGIN_ROOT/scripts/supervisor/renderer.sh"

register_session
case "${1:-}" in
startup) start_from_preferences ;;
on) show_renderer ;;
start) start_renderer ;;
off) hide_renderer ;;
stop) stop_renderer ;;
preferences) open_preferences ;;
reload-preferences) reload_preferences ;;
status) show_status ;;
*)
  echo "usage: $0 startup|on|off|preferences|reload-preferences|status" >&2
  exit 2
  ;;
esac
