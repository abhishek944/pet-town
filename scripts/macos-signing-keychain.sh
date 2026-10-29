#!/bin/sh
# Sourced by packaging scripts. Caller owns WORK and its cleanup trap.
setup_signing_keychain() {
  SIGN_KEYCHAIN=""
  ORIGINAL_KEYCHAINS="$WORK/original-keychains.txt"
  [ -n "${APPLE_SIGNING_IDENTITY:-}" ] || {
    echo "APPLE_SIGNING_IDENTITY is required" >&2
    return 1
  }
  if security find-identity -v -p codesigning 2>/dev/null | grep -qF "$APPLE_SIGNING_IDENTITY"; then
    return 0
  fi
  [ -n "${APPLE_CERTIFICATE:-}" ] && [ -n "${APPLE_CERTIFICATE_PASSWORD:-}" ] || {
    echo "Signing identity unavailable; certificate and password required" >&2
    return 1
  }
  SIGN_KEYCHAIN="$WORK/signing.keychain-db"
  sign_keychain_password=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
  sign_p12="$WORK/signing.p12"
  printf '%s' "$APPLE_CERTIFICATE" | base64 -d >"$sign_p12"
  chmod 600 "$sign_p12"
  security create-keychain -p "$sign_keychain_password" "$SIGN_KEYCHAIN"
  security set-keychain-settings -lut 21600 "$SIGN_KEYCHAIN"
  security unlock-keychain -p "$sign_keychain_password" "$SIGN_KEYCHAIN"
  security import "$sign_p12" -k "$SIGN_KEYCHAIN" \
    -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s \
    -k "$sign_keychain_password" "$SIGN_KEYCHAIN" >/dev/null
  security list-keychains -d user >"$ORIGINAL_KEYCHAINS"
  python3 - "$ORIGINAL_KEYCHAINS" "$SIGN_KEYCHAIN" <<'PY'
import shlex, subprocess, sys
keychains = shlex.split(open(sys.argv[1], encoding="utf-8").read())
subprocess.run(["security", "list-keychains", "-d", "user", "-s", sys.argv[2], *keychains], check=True)
PY
  rm -f "$sign_p12"
  security find-identity -v -p codesigning "$SIGN_KEYCHAIN" | grep -qF "$APPLE_SIGNING_IDENTITY"
}

cleanup_signing_keychain() {
  if [ -n "${SIGN_KEYCHAIN:-}" ]; then
    if [ -f "$ORIGINAL_KEYCHAINS" ]; then
      python3 - "$ORIGINAL_KEYCHAINS" <<'PY' || true
import shlex, subprocess, sys
keychains = shlex.split(open(sys.argv[1], encoding="utf-8").read())
subprocess.run(["security", "list-keychains", "-d", "user", "-s", *keychains], check=False)
PY
    fi
    security delete-keychain "$SIGN_KEYCHAIN" >/dev/null 2>&1 || true
  fi
}
