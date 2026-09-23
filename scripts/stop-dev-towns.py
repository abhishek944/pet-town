#!/usr/bin/env python3
"""Stop only this checkout's Pet Town and Godot processes before a clean build/run."""

import contextlib
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
project = root / "apps/pet-town-godot"
target = root / "apps/pet-town/src-tauri/target"


def is_our_pet_town_binary(pid: int) -> bool:
    # ps may display target/debug/pet-town relative to its working directory;
    # confirm the actual executable through lsof before signaling it.
    try:
        output = subprocess.check_output(
            ["lsof", "-a", "-p", str(pid), "-d", "txt", "-Fn"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.CalledProcessError):
        return False
    return any(
        line.startswith("n")
        and line[1:].startswith(str(target) + "/")
        and Path(line[1:]).name == "pet-town"
        for line in output.splitlines()
    )


def matches(pid: int, command: str) -> bool:
    # Include this app's main executable and --town-bridge helper, whether ps
    # renders its executable path absolute or relative. Consult lsof only for
    # processes whose command could be this binary.
    executable = command.split(" --", 1)[0]
    if Path(executable).name == "pet-town" and is_our_pet_town_binary(pid):
        return True
    # Stop only this checkout's Vite and Tauri CLI, not other Node/Godot
    # development servers that may be using other projects or ports.
    desktop = root / "apps/pet-town/node_modules"
    if str(desktop) in command and "/vite/bin/vite.js" in command:
        return True
    if str(desktop) in command and "/@tauri-apps/cli/tauri.js dev" in command:
        return True
    if " --path " in command:
        executable, args = command.split(" --path ", 1)
        if Path(executable).name.lower() == "godot":
            return args == str(project) or args.startswith(str(project) + " ")
    return False


def running() -> dict[int, str]:
    output = subprocess.check_output(["ps", "-axo", "pid=,command="], text=True)
    processes = {}
    for line in output.splitlines():
        parts = line.strip().split(maxsplit=1)
        if len(parts) == 2 and parts[0].isdigit() and matches(int(parts[0]), parts[1]):
            processes[int(parts[0])] = parts[1]
    return processes


processes = running()
if processes:
    print(
        f"Stopping {len(processes)} Pet Town/3D town process(es) from this checkout...", flush=True
    )
    for pid, command in processes.items():
        if running().get(pid) != command:
            continue
        with contextlib.suppress(ProcessLookupError):
            os.kill(pid, signal.SIGTERM)
    # Give the apps a short chance to close their own child processes.
    deadline = time.monotonic() + 3
    while time.monotonic() < deadline and any(
        running().get(pid) == command for pid, command in processes.items()
    ):
        time.sleep(0.1)
    for pid, command in processes.items():
        if running().get(pid) != command:
            continue
        print(f"Force closing process {pid}...", flush=True)
        with contextlib.suppress(ProcessLookupError):
            os.kill(pid, signal.SIGKILL)
    time.sleep(0.1)
    if any(running().get(pid) == command for pid, command in processes.items()):
        sys.exit("Could not close the previous Pet Town processes; build caches were not removed.")
