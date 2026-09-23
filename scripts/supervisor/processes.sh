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
