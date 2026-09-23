#!/usr/bin/env python3
"""Validate bundled pet APNG structure and frame payloads without dependencies."""

from __future__ import annotations

import json
import struct
import sys
import tempfile
from pathlib import Path

from apng_core import PETS, fail
from apng_fixtures import (
    expect_rejected,
    expect_still_rejected,
    insert_chunk_after,
    mutate_chunk,
    mutate_chunk_kind,
    write_fixture_apng,
    write_fixture_still,
)
from apng_validation import validate_apng, validate_still_png


def self_test(source: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="pet-town-apng-") as directory:
        temp = Path(directory)
        payload = source.read_bytes()
        unknown_critical = temp / "unknown-critical.png"
        unknown_critical.write_bytes(insert_chunk_after(payload, b"IHDR", b"ABCD"))
        expect_rejected(unknown_critical)

        split_still = temp / "split-static-idat.png"
        write_fixture_still(split_still, split_idat=True)
        expect_still_rejected(split_still)

        missing_iend = temp / "missing-iend.png"
        missing_iend.write_bytes(payload[:-12])
        expect_rejected(missing_iend)

        bad_sequence = temp / "bad-sequence.png"
        bad_sequence.write_bytes(
            mutate_chunk(payload, b"fcTL", lambda data: struct.pack(">I", 99) + data[4:])
        )
        expect_rejected(bad_sequence)

        partial_first = temp / "partial-first-frame.png"
        partial_first.write_bytes(
            mutate_chunk(payload, b"fcTL", lambda data: data[:4] + struct.pack(">I", 1) + data[8:])
        )
        expect_rejected(partial_first)

        bad_disposal = temp / "bad-disposal.png"
        bad_disposal.write_bytes(
            mutate_chunk(payload, b"fcTL", lambda data: data[:-2] + bytes((9, data[-1])))
        )
        expect_rejected(bad_disposal)

        bad_filter = temp / "bad-filter.png"
        bad_filter.write_bytes(
            mutate_chunk(payload, b"IHDR", lambda data: data[:11] + b"\1" + data[12:])
        )
        expect_rejected(bad_filter)

        bad_interlace = temp / "bad-interlace.png"
        bad_interlace.write_bytes(mutate_chunk(payload, b"IHDR", lambda data: data[:12] + b"\1"))
        expect_rejected(bad_interlace)

        later_idat = temp / "later-frame-idat.png"
        later_idat.write_bytes(mutate_chunk_kind(payload, b"fdAT", b"IDAT"))
        expect_rejected(later_idat)

        try:
            validate_apng(source, 1)
        except ValueError:
            pass
        else:
            raise ValueError("APNG duration mismatch was accepted")

        opaque = temp / "opaque.png"
        write_fixture_apng(opaque, lambda x, y: (255, 0, 0, 255), lambda x, y: (0, 0, 255, 255))
        expect_rejected(opaque)

        near_opaque = temp / "near-opaque.png"
        almost_red = lambda x, y: (255, 0, 0, 254 if x == 0 and y == 0 else 255)
        almost_blue = lambda x, y: (0, 0, 255, 254 if x == 0 and y == 0 else 255)
        write_fixture_apng(near_opaque, almost_red, almost_blue)
        expect_rejected(near_opaque)

        nonconsecutive = temp / "nonconsecutive-idat.png"
        write_fixture_apng(nonconsecutive, almost_red, almost_blue, split_idat=True)
        expect_rejected(nonconsecutive)

        hidden_rgb = temp / "hidden-rgb-only.png"
        first = lambda x, y: (255, 0, 0, 255) if y == 0 else (0, 0, 0, 0)
        second = lambda x, y: (255, 0, 0, 255) if y == 0 else (0, 255, 0, 0)
        write_fixture_apng(hidden_rgb, first, second)
        expect_rejected(hidden_rgb)

        one_pixel = temp / "one-pixel-change.png"
        changed = lambda x, y: (0, 0, 255, 255) if x == 0 and y == 0 else first(x, y)
        write_fixture_apng(one_pixel, first, changed)
        expect_rejected(one_pixel)


def main() -> None:
    manifests = sorted(PETS.glob("*/flow.json"))
    if not manifests:
        raise ValueError("apps/pet-town/src/pets must contain at least one flow.json")
    animations: dict[Path, int] = {}
    stills: set[Path] = set()
    for manifest_path in manifests:
        manifest = json.loads(manifest_path.read_text())
        for clip in manifest.get("clips", {}).values():
            asset = clip.get("asset")
            if asset:
                path = (manifest_path.parent / asset).resolve()
                if manifest_path.parent.resolve() not in path.parents:
                    fail(manifest_path, f"unsafe asset path {asset}")
                duration = clip.get("durationMs")
                if path in animations and animations[path] != duration:
                    fail(manifest_path, f"shared asset {asset} has conflicting clip durations")
                if path not in animations:
                    validate_apng(path, duration, require_sleep_z_trail=path.name == "sleep.png")
                    animations[path] = duration
            hold_asset = clip.get("holdAsset")
            if hold_asset:
                path = (manifest_path.parent / hold_asset).resolve()
                if manifest_path.parent.resolve() not in path.parents:
                    fail(manifest_path, f"unsafe hold asset path {hold_asset}")
                if path not in stills:
                    validate_still_png(path)
                    stills.add(path)
    self_test(next(iter(animations)))
    print(
        f"APNG asset checks: pass ({len(animations)} animations, {len(stills)} hold stills, negative fixtures rejected)"
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, struct.error, json.JSONDecodeError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from None
