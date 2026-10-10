#!/usr/bin/env python3
"""Validate bundled pet WebP assets (animated clips + still holds) without dependencies."""

from __future__ import annotations

import json
import struct
import sys
import tempfile
from pathlib import Path

from apng_core import PETS, fail
from apng_fixtures import (
    expect_rejected,
    insert_chunk_after,
    mutate_chunk,
    write_fixture_apng,
)
from webp_validation import validate_animated_webp, validate_still_webp


def self_test(source: Path) -> None:
    with tempfile.TemporaryDirectory(prefix="pet-town-webp-") as directory:
        temp = Path(directory)
        garbage = temp / "garbage.webp"
        garbage.write_bytes(b"not a webp file at all............")
        expect_webp_rejected(garbage, animated=True)
        truncated = temp / "truncated.webp"
        truncated.write_bytes(source.read_bytes()[:64])
        expect_webp_rejected(truncated, animated=True)
        mismatch = temp / "mismatch.webp"
        mismatch.write_bytes(source.read_bytes())
        try:
            validate_animated_webp(mismatch, 1)
        except ValueError:
            pass
        else:
            raise ValueError("WebP duration mismatch was accepted")
        still = temp / "still.webp"
        still.write_bytes(source.read_bytes())
        # A still used as an animated clip is covered by the loop/frame rules only
        # when the container lacks animation; craft one from the VP8X header.
        data = bytearray(source.read_bytes())
        data[20] &= ~0x02  # clear animation flag; ANIM/ANMF remain -> must reject
        still.write_bytes(bytes(data))
        expect_webp_rejected(still, animated=True)


def expect_webp_rejected(path: Path, animated: bool) -> None:
    try:
        if animated:
            validate_animated_webp(path)
        else:
            validate_still_webp(path)
    except ValueError:
        return
    raise ValueError(f"negative WebP fixture was accepted: {path.name}")


def self_test_apng_validator() -> None:
    """Keep coverage of the APNG validator used by resize-ocean-assets.py."""
    with tempfile.TemporaryDirectory(prefix="pet-town-apng-") as directory:
        temp = Path(directory)
        base = temp / "base.png"
        write_fixture_apng(base, lambda x, y: (255, 0, 0, 255), lambda x, y: (0, 0, 255, 255))
        payload = base.read_bytes()
        unknown = temp / "unknown-critical.png"
        unknown.write_bytes(insert_chunk_after(payload, b"IHDR", b"ABCD"))
        expect_rejected(unknown)
        bad_sequence = temp / "bad-sequence.png"
        bad_sequence.write_bytes(
            mutate_chunk(payload, b"fcTL", lambda data: struct.pack(">I", 99) + data[4:])
        )
        expect_rejected(bad_sequence)
        try:
            from apng_validation import validate_apng

            validate_apng(base, 1)
        except ValueError:
            pass
        else:
            raise ValueError("APNG duration mismatch was accepted")


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
                    validate_animated_webp(path, duration)
                    animations[path] = duration
            hold_asset = clip.get("holdAsset")
            if hold_asset:
                path = (manifest_path.parent / hold_asset).resolve()
                if manifest_path.parent.resolve() not in path.parents:
                    fail(manifest_path, f"unsafe hold asset path {hold_asset}")
                if path not in stills:
                    validate_still_webp(path)
                    stills.add(path)
    self_test(next(iter(animations)))
    self_test_apng_validator()
    ocean = sorted(PETS.glob("*/ocean-*.webp"))
    if not ocean:
        raise ValueError("no Ocean theme assets found")
    for path in ocean:
        validate_animated_webp(path)
    print(
        f"Pet asset checks: pass ({len(animations)} animations, "
        f"{len(stills)} hold stills, {len(ocean)} ocean animations, "
        f"negative fixtures rejected)"
    )


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, struct.error, json.JSONDecodeError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from None
