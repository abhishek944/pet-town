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

register_session() {
  socket=${HERDR_SOCKET_PATH:-}
  [ -n "$socket" ] || return 0
  key=$(printf '%s' "$socket" | cksum | awk '{print $1 "-" $2}')
  tmp="$SESSIONS_DIR/$key.tmp.$$"
  printf '%s\n' "$socket" >"$tmp"
  mv "$tmp" "$SESSIONS_DIR/$key"

  for record in "$SESSIONS_DIR"/*; do
    [ -f "$record" ] || continue
    registered=$(cat "$record" 2>/dev/null || true)
    if [ -z "$registered" ] || [ ! -e "$registered" ]; then
      rm -f "$record"
    fi
  done
}

read_pid() {
  [ -f "$PID_FILE" ] || return 1
  pid=$(cat "$PID_FILE" 2>/dev/null || true)
  case "$pid" in
  '' | *[!0-9]*) return 1 ;;
  esac
  printf '%s\n' "$pid"
}

process_executable() {
  LC_ALL=C TZ=UTC ps -ww -p "$1" -o comm= 2>/dev/null | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

process_started() {
  LC_ALL=C TZ=UTC ps -ww -p "$1" -o lstart= 2>/dev/null | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

process_matches_expected() {
  pid=$1
  expected_binary=$2
  expected_start=$3
  [ "$(process_executable "$pid")" = "$expected_binary" ] || return 1
  [ "$(process_started "$pid")" = "$expected_start" ] || return 1
}

pid_matches_identity() {
  pid=$1
  [ -f "$BINARY_FILE" ] && [ -f "$START_FILE" ] || return 1
  expected_binary=$(cat "$BINARY_FILE" 2>/dev/null || true)
  expected_start=$(cat "$START_FILE" 2>/dev/null || true)
  [ -n "$expected_binary" ] && [ -n "$expected_start" ] || return 1
  [ "$(process_executable "$pid")" = "$expected_binary" ] || return 1
  [ "$(process_started "$pid")" = "$expected_start" ] || return 1
}

running_pid() {
  pid=$(read_pid) || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  pid_matches_identity "$pid" || return 1
  printf '%s\n' "$pid"
}

existing_renderer() {
  [ -f "$APP_LOCK_FILE" ] || return 1
  candidate=$(cat "$APP_LOCK_FILE" 2>/dev/null || true)
  case "$candidate" in
  '' | *[!0-9]*) return 1 ;;
  esac
  kill -0 "$candidate" 2>/dev/null || return 1
  lsof -t -- "$APP_LOCK_FILE" 2>/dev/null | grep -qx "$candidate" || return 1
  [ "$(ps -p "$candidate" -o uid= | tr -d ' ')" = "$(id -u)" ] || return 1
  executable=$(process_executable "$candidate")
  [ "$(basename "$executable")" = pet-town ] || return 1
  printf '%s\n' "$candidate"
}

adopt_renderer() {
  pid=$1
  binary=$(process_executable "$pid")
  started=$(process_started "$pid")
  [ -n "$binary" ] && [ -n "$started" ] || return 1
  printf '%s\n' "$binary" >"$BINARY_FILE.tmp"
  printf '%s\n' "$started" >"$START_FILE.tmp"
  printf '%s\n' "$(binary_digest "$binary")" >"$DIGEST_FILE.tmp"
  printf '%s\n' "$pid" >"$PID_FILE.tmp"
  mv "$BINARY_FILE.tmp" "$BINARY_FILE"
  mv "$START_FILE.tmp" "$START_FILE"
  mv "$DIGEST_FILE.tmp" "$DIGEST_FILE"
  mv "$PID_FILE.tmp" "$PID_FILE"
}

clear_process_state() {
  rm -f "$PID_FILE" "$BINARY_FILE" "$START_FILE" "$DIGEST_FILE"
}

binary_digest() {
  shasum -a 256 "$1" | awk '{print $1}'
}

renderer_matches_binary() {
  candidate=$1
  [ -f "$DIGEST_FILE" ] || return 1
  expected_digest=$(cat "$DIGEST_FILE" 2>/dev/null || true)
  [ -n "$expected_digest" ] || return 1
  [ "$(binary_digest "$candidate")" = "$expected_digest" ]
}

inherit_openai_key() {
  [ -z "${OPENAI_API_KEY:-}" ] || return 0
  [ "$(uname -s)" = Darwin ] || return 0
  [ -x /bin/launchctl ] || return 0
  launchd_key=$(/bin/launchctl getenv OPENAI_API_KEY 2>/dev/null || true)
  [ -n "$launchd_key" ] || return 0
  OPENAI_API_KEY=$launchd_key
  export OPENAI_API_KEY
  unset launchd_key
}

absolute_executable() {
  candidate=$1
  [ -x "$candidate" ] || return 1
  directory=$(CDPATH= cd -- "$(dirname -- "$candidate")" && pwd -P)
  printf '%s/%s\n' "$directory" "$(basename -- "$candidate")"
}

resolve_binary() {
  if [ -n "${PET_TOWN_BINARY:-}" ]; then
    absolute_executable "$PET_TOWN_BINARY" && return 0
  fi

  system=$(uname -s)
  machine=$(uname -m)
  case "$system:$machine" in
  Darwin:arm64) packaged="$PLUGIN_ROOT/bin/macos-arm64/pet-town" ;;
  Darwin:x86_64) packaged="$PLUGIN_ROOT/bin/macos-x64/pet-town" ;;
  Linux:x86_64) packaged="$PLUGIN_ROOT/bin/linux-x64/pet-town" ;;
  Linux:aarch64) packaged="$PLUGIN_ROOT/bin/linux-arm64/pet-town" ;;
  *) packaged="$PLUGIN_ROOT/bin/unsupported/pet-town" ;;
  esac

  for candidate in \
    "$HOME/Applications/Pet Town.app/Contents/MacOS/pet-town" \
    "/Applications/Pet Town.app/Contents/MacOS/pet-town" \
    "$packaged" \
    "$PLUGIN_ROOT/apps/pet-town/src-tauri/target/release/pet-town" \
    "$PLUGIN_ROOT/apps/pet-town/src-tauri/target/release/bundle/macos/Pet Town.app/Contents/MacOS/pet-town"; do
    if absolute_executable "$candidate"; then
      return 0
    fi
  done
  return 1
}

start_renderer() {
  binary=$(resolve_binary) || {
    echo "pet-town: renderer binary is missing" >&2
    return 1
  }

  if pid=$(running_pid); then
    if renderer_matches_binary "$binary"; then
      echo "pet-town: running (pid $pid)"
      return 0
    fi
    stop_renderer >/dev/null
  fi
  if existing=$(existing_renderer) && [ -n "$existing" ]; then
    adopt_renderer "$existing"
    echo "pet-town: running (pid $existing)"
    return 0
  fi
  clear_process_state

  # The renderer is intentionally quiet; discarding output prevents a faulty
  # WebView process from filling the plugin state directory indefinitely.
  inherit_openai_key
  PET_TOWN_SESSION_REGISTRY="$SESSIONS_DIR" \
    PET_TOWN_RELOAD_RESULT="$RELOAD_RESULT_FILE" \
    nohup "$binary" >/dev/null 2>&1 &
  pid=$!

  attempts=0
  started=
  while kill -0 "$pid" 2>/dev/null && [ "$attempts" -lt 10 ]; do
    if [ "$(process_executable "$pid")" = "$binary" ]; then
      started=$(process_started "$pid")
      [ -n "$started" ] && break
    fi
    attempts=$((attempts + 1))
    sleep 0.05
  done
  if [ -z "$started" ]; then
    if existing=$(existing_renderer) && [ -n "$existing" ]; then
      adopt_renderer "$existing"
      echo "pet-town: running (pid $existing)"
      return 0
    fi
    echo "pet-town: could not verify renderer startup" >&2
    return 1
  fi

  sleep 0.5
  if ! process_matches_expected "$pid" "$binary" "$started"; then
    # A concurrent app launch may have won the application lock.
    if existing=$(existing_renderer) && [ -n "$existing" ]; then
      adopt_renderer "$existing"
      echo "pet-town: running (pid $existing)"
      return 0
    fi
    echo "pet-town: renderer identity changed during startup" >&2
    return 1
  fi

  printf '%s\n' "$binary" >"$BINARY_FILE.tmp"
  printf '%s\n' "$started" >"$START_FILE.tmp"
  printf '%s\n' "$(binary_digest "$binary")" >"$DIGEST_FILE.tmp"
  printf '%s\n' "$pid" >"$PID_FILE.tmp"
  mv "$BINARY_FILE.tmp" "$BINARY_FILE"
  mv "$START_FILE.tmp" "$START_FILE"
  mv "$DIGEST_FILE.tmp" "$DIGEST_FILE"
  mv "$PID_FILE.tmp" "$PID_FILE"

  if ! running_pid >/dev/null; then
    clear_process_state
    echo "pet-town: renderer identity changed during startup" >&2
    return 1
  fi
  echo "pet-town: started (pid $pid)"
}

show_renderer() {
  start_renderer
  pid=$(running_pid) || return 1
  kill -CONT "$pid"
  echo "pet-town: visible (pid $pid)"
}

hide_renderer() {
  if ! pid=$(running_pid); then
    if existing=$(existing_renderer) && [ -n "$existing" ]; then
      adopt_renderer "$existing"
      pid=$existing
    else
      echo "pet-town: stopped"
      return 0
    fi
  fi
  kill -HUP "$pid"
  echo "pet-town: hidden (pid $pid)"
}

stop_renderer() {
  if ! pid=$(running_pid); then
    clear_process_state
    echo "pet-town: stopped"
    return 0
  fi

  if pid_matches_identity "$pid"; then
    kill "$pid" 2>/dev/null || true
  fi
  attempts=0
  while pid_matches_identity "$pid" && kill -0 "$pid" 2>/dev/null && [ "$attempts" -lt 50 ]; do
    attempts=$((attempts + 1))
    sleep 0.1
  done
  if pid_matches_identity "$pid" && kill -0 "$pid" 2>/dev/null; then
    echo "pet-town: shutdown is waiting for assistant cleanup" >&2
    return 1
  fi
  clear_process_state
  echo "pet-town: stopped"
}

show_status() {
  if pid=$(running_pid); then
    echo "pet-town: running (pid $pid)"
  else
    clear_process_state
    echo "pet-town: stopped"
  fi
}

start_from_preferences() {
  binary=$(resolve_binary) || {
    echo "pet-town: renderer binary is missing" >&2
    return 1
  }
  if "$binary" --startup-enabled; then
    start_renderer
  else
    echo "pet-town: startup disabled in preferences"
  fi
}

open_preferences() {
  start_renderer >/dev/null
  pid=$(running_pid) || return 1
  kill -USR1 "$pid"
  echo "pet-town: preferences opened"
}

reload_preferences() {
  start_renderer >/dev/null
  pid=$(running_pid) || return 1
  rm -f "$RELOAD_RESULT_FILE"
  kill -USR2 "$pid"
  attempts=0
  while [ ! -f "$RELOAD_RESULT_FILE" ] && [ "$attempts" -lt 40 ]; do
    attempts=$((attempts + 1))
    sleep 0.05
  done
  [ -f "$RELOAD_RESULT_FILE" ] || {
    echo "pet-town: preference reload timed out" >&2
    return 1
  }
  result=$(cat "$RELOAD_RESULT_FILE")
  rm -f "$RELOAD_RESULT_FILE"
  [ "$result" = ok ] || {
    echo "pet-town: ${result#error: }" >&2
    return 1
  }
  echo "pet-town: preferences reloaded"
}

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
