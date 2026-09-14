#!/bin/sh
# Non-blocking lifecycle bridge shared by supported coding-agent adapters.
# Usage: agent-hook.sh <source> <event>; the harness JSON payload is read on stdin.
set -u

SOURCE=${1:-}
EVENT=${2:-}
[ -n "$SOURCE" ] && [ -n "$EVENT" ] || exit 0

PLUGIN_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if [ -n "${PET_VILLAGE_BINARY:-}" ] && [ -x "$PET_VILLAGE_BINARY" ]; then
  BINARY=$PET_VILLAGE_BINARY
else
  case "$(uname -s):$(uname -m)" in
  Darwin:arm64) BINARY="$PLUGIN_ROOT/bin/macos-arm64/pet-village" ;;
  Darwin:x86_64) BINARY="$PLUGIN_ROOT/bin/macos-x64/pet-village" ;;
  Linux:x86_64) BINARY="$PLUGIN_ROOT/bin/linux-x64/pet-village" ;;
  Linux:aarch64) BINARY="$PLUGIN_ROOT/bin/linux-arm64/pet-village" ;;
  *) exit 0 ;;
  esac
fi

[ -x "$BINARY" ] || exit 0
PET_VILLAGE_HOOK_GENERATION=$PPID "$BINARY" --adapter-relay "$SOURCE" "$EVENT" >/dev/null 2>&1 || true
exit 0
