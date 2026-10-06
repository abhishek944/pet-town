#!/usr/bin/env python3
"""Stop only this checkout's Pet Town desktop and frontend processes before a clean build/run."""

import contextlib
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

root = Path(__file__).resolve().parent.parent
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


def is_our_frontend_supervisor(pid: int) -> bool:
    try:
        output = subprocess.check_output(
            ["lsof", "-a", "-p", str(pid), "-d", "cwd", "-Fn"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.CalledProcessError):
        return False
    return any(
        line.startswith("n") and Path(line[1:]) in (root, root / "apps/pet-town")
        for line in output.splitlines()
    )


def matches(pid: int, command: str) -> bool:
    # Include this app's main executable and focus helper, whether ps
    # renders its executable path absolute or relative. Consult lsof only for
    # processes whose command could be this binary.
    executable = command.split(" --", 1)[0]
    if Path(executable).name == "pet-town" and is_our_pet_town_binary(pid):
        return True
    if is_our_native_town(executable, command):
        return True
    # Match explicit checkout paths; never stop servers just because they use our ports.
    frontend_apps = ("pet-town", "pet-town-3d", "pokopia")
    if "/vite/bin/vite.js" in command and any(
        str(root / "apps" / name / "node_modules") in command for name in frontend_apps
    ):
        return True
    desktop = root / "apps/pet-town/node_modules"
    if str(desktop) in command and "/@tauri-apps/cli/tauri.js dev" in command:
        return True
    supervisor = str(root / "scripts/dev-town-frontends.py")
    return supervisor in command or (
        "dev-town-frontends.py" in command and is_our_frontend_supervisor(pid)
    )


def is_our_native_town(executable: str, command: str) -> bool:
    if any(flag in command for flag in ("--editor", "--script", "--headless")):
        return False
    runtimes = (
        root / "var/godot-runtime/Pet Town.app/Contents/MacOS/Godot",
        root / "apps/pet-town/src-tauri/resources/godot/Pet Town.app/Contents/MacOS/Godot",
        # Also clean up runtimes launched before the branding migration.
        root / "var/godot-runtime/Godot.app/Contents/MacOS/Godot",
        root / "apps/pet-town/src-tauri/resources/godot/Godot.app/Contents/MacOS/Godot",
    )
    if Path(executable).resolve() not in runtimes:
        return False
    for flag, expected in (
        ("--path ", root / "apps/pet-town-godot-sample"),
        ("--main-pack ", root / "apps/pet-town/src-tauri/resources/godot/world/PetTown.pck"),
    ):
        if flag in command:
            argument = command.split(flag, 1)[1].split(" --", 1)[0]
            if Path(argument).resolve() == expected:
                return True
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
        f"Stopping {len(processes)} Pet Street/Pet Town process(es) from this checkout...",
        flush=True,
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
