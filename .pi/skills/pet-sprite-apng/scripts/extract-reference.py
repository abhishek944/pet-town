#!/usr/bin/env python3
"""Extract one composited RGBA frame from an APNG for image-model reference."""
from pathlib import Path
import argparse
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("source")
parser.add_argument("output")
parser.add_argument("--frame", type=int, default=0)
args = parser.parse_args()

source = Image.open(args.source)
if args.frame < 0 or args.frame >= getattr(source, "n_frames", 1):
    raise SystemExit(f"frame {args.frame} is outside 0..{source.n_frames - 1}")
source.seek(args.frame)
frame = source.convert("RGBA")
output = Path(args.output)
output.parent.mkdir(parents=True, exist_ok=True)
frame.save(output)
print(output)
