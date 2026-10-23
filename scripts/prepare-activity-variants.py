#!/usr/bin/env python3
"""Prepare verified small-display activity loops without changing source artwork."""

import argparse
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SIZE = 128


def frames_and_timing(image):
    frames, durations = [], []
    for index in range(image.n_frames):
        image.seek(index)
        image.load()
        frames.append(image.convert("RGBA").copy())
        durations.append(image.info["duration"])
    return frames, durations


def same_visible_pixels(left, right):
    alpha = left.getchannel("A")
    if alpha.tobytes() != right.getchannel("A").tobytes():
        return False
    # Animated WebP may discard RGB beneath fully transparent pixels.
    mask = alpha.point(lambda value: 255 if value else 0)
    return Image.composite(left, right, mask).tobytes() == right.tobytes()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument(
        "--theme", choices=("goldmine", "railway", "rollercoaster", "ocean"), default="goldmine"
    )
    args = parser.parse_args()
    count = 0
    ocean = args.theme == "ocean"
    pattern = "*/ocean-rowing.webp" if ocean else f"*/activity-{args.theme}-*.webp"
    for source in sorted((ROOT / "apps/pet-town/src/pets").glob(pattern)):
        if not ocean and source.stem.rsplit("-", 1)[-1] not in ("working", "blocked", "done"):
            continue
        with Image.open(source) as original:
            if original.size != ((384, 384) if ocean else (512, 512)):
                raise ValueError(f"Unexpected source size: {source}")
            loop = original.info.get("loop", 0)
            frames, durations = frames_and_timing(original)
        scaled = [frame.resize((SIZE, SIZE), Image.Resampling.LANCZOS) for frame in frames]
        destination = args.output_dir / source.parent.name / f"{source.stem}-{SIZE}.webp"
        destination.parent.mkdir(parents=True, exist_ok=True)
        scaled[0].save(
            destination,
            save_all=True,
            append_images=scaled[1:],
            duration=durations,
            loop=loop,
            lossless=True,
            exact=True,
            method=4,
        )
        with Image.open(destination) as result:
            actual, timing = frames_and_timing(result)
            if (
                result.size != (SIZE, SIZE)
                or timing != durations
                or result.info.get("loop", 0) != loop
                or len(actual) != len(scaled)
            ):
                raise ValueError(f"Derivative timing or geometry changed: {destination}")
            if any(not same_visible_pixels(a, b) for a, b in zip(actual, scaled, strict=True)):
                raise ValueError(f"Derivative pixels were not encoded losslessly: {destination}")
        count += 1
        print(f"Prepared {destination.relative_to(args.output_dir)}", flush=True)
    print(f"Prepared {count} verified {SIZE}-pixel {args.theme} loops.", flush=True)


if __name__ == "__main__":
    main()
