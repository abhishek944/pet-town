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
