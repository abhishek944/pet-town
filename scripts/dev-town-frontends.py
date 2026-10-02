#!/usr/bin/env python3
"""Own both checkout-local Vite servers for the lifetime of Tauri's dev hook."""

import contextlib
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# Start the town first: Tauri sees desktop readiness only after the town is ready.
FRONTENDS = (("pet-town-3d", 1422), ("pet-town", 1420))


def require_free_port(port: int) -> None:
    try:
        connection = socket.create_connection(("127.0.0.1", port), timeout=0.3)
    except OSError:
        return
    connection.close()
    raise RuntimeError(f"Port {port} is already in use; stop that server before starting Pet Town.")


def wait_until_ready(process: subprocess.Popen, port: int, parent_pid: int) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"Pet Town frontend on {port} exited during startup.")
        if os.getppid() != parent_pid:
            raise RuntimeError("The desktop dev hook stopped during frontend startup.")
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1) as response:
                if response.status == 200:
                    return
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(0.1)
    raise RuntimeError(f"Pet Town frontend on {port} did not become ready within 30 seconds.")


def stop_children(children: list[subprocess.Popen]) -> None:
    # Each process group is created by this supervisor; never signal unrelated servers.
    for child in children:
        with contextlib.suppress(ProcessLookupError):
            os.killpg(child.pid, signal.SIGTERM)
    for child in children:
        with contextlib.suppress(subprocess.TimeoutExpired):
            child.wait(timeout=3)
        with contextlib.suppress(ProcessLookupError):
            os.killpg(child.pid, signal.SIGKILL)
        child.wait()


def handle_signal(_signal: int, _frame: object) -> None:
    raise SystemExit(0)


def main() -> int:
    children = []
    parent_pid = os.getppid()
    for event in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(event, handle_signal)
    try:
        for _, port in FRONTENDS:
            require_free_port(port)
        for name, port in FRONTENDS:
            app = ROOT / "apps" / name
            command = ["node", str(app / "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1"]
            children.append(subprocess.Popen(command, cwd=app, start_new_session=True))
            wait_until_ready(children[-1], port, parent_pid)
        print("Pet Town frontends ready: desktop 1420, Three.js town 1422", flush=True)
        while os.getppid() == parent_pid:
            for child in children:
                if child.poll() is not None:
                    raise RuntimeError("A Pet Town frontend stopped; shutting down its companion.")
            time.sleep(0.2)
        return 0
    except (OSError, RuntimeError) as error:
        print(error, file=sys.stderr)
        return 1
    finally:
        for event in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
            signal.signal(event, signal.SIG_IGN)
        stop_children(children)


if __name__ == "__main__":
    sys.exit(main())
