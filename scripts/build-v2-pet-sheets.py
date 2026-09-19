"""Convert v1 APNG pets into v2 horizontal PNG sprite strips plus a roster.

Reads apps/pet-town/src/pets/*/flow.json and walk/wave/done APNGs,
extracts frames, normalizes frame height, and writes strips plus
apps/pet-town-v2/public/pets/roster.json. Deterministic: same inputs
always produce the same outputs. Idempotent: safe to rerun.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import PIL
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
V1_PETS = ROOT / "apps" / "pet-town" / "src" / "pets"
OUT = ROOT / "apps" / "pet-town-v2" / "public" / "pets"
TARGET_HEIGHT = 224


def display_name(pet_id: str) -> str:
    return " ".join(part[:1].upper() + part[1:] for part in pet_id.split("-"))


def frames_of(path: Path) -> list[Image.Image]:
    with Image.open(path) as source:
        count = getattr(source, "n_frames", 1)
        return [source.seek(i) or source.copy() for i in range(count)]


def strip(frames: list[Image.Image]) -> Image.Image:
    fw, fh = frames[0].size
    sheet = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame.convert("RGBA"), (index * fw, 0))
    return sheet


def normalize(sheet: Image.Image, frame_count: int) -> Image.Image:
    fw = sheet.width // frame_count
    scale = TARGET_HEIGHT / sheet.height
    return sheet.resize((round(fw * scale) * frame_count, TARGET_HEIGHT), Image.LANCZOS)


def convert(pet_dir: Path, out_dir: Path, manifest: dict) -> dict:
    flow = json.loads((pet_dir / "flow.json").read_text())
    clips = flow.get("clips", {})
    actions = list(flow.get("actions", {}).keys())
    assets: dict[str, dict[str, object]] = {}
    for capability, filename in (("walk", "walk.png"), ("wave", "wave.png"), ("done", "done.png")):
        frames = frames_of(pet_dir / filename)
        sheet = normalize(strip(frames), len(frames))
        sheet.save(out_dir / filename, optimize=True)
        clip_ms = next(
            (clip.get("durationMs", 0) for clip in clips.values() if clip.get("asset") == filename),
            0,
        )
        per_frame = max(1, int(clip_ms / len(frames))) if clip_ms else 120
        assets[capability] = {
            "path": f"/pets/{pet_dir.name}/{filename}",
            "frames": len(frames),
            "frameWidth": sheet.width // len(frames),
            "frameHeight": sheet.height,
            "frameDuration": per_frame,
        }
    return {
        "id": pet_dir.name,
        "name": display_name(pet_dir.name),
        "capabilities": ["walk", *[a for a in actions if a != "walk"]],
        "assets": assets,
    }


def main() -> int:
    pets = sorted(p for p in V1_PETS.iterdir() if p.is_dir() and (p / "flow.json").exists())
    if not pets:
        print("no v1 pets found", file=sys.stderr)
        return 1
    wanted = {pet_dir.name for pet_dir in pets}
    for child in OUT.iterdir():
        if child.is_dir() and child.name not in wanted:
            shutil.rmtree(child)
    manifest: dict[str, object] = {"pets": [], "generator": {"pillow": PIL.__version__}}
    roster = manifest["pets"]
    assert isinstance(roster, list)
    for pet_dir in pets:
        out_dir = OUT / pet_dir.name
        out_dir.mkdir(parents=True, exist_ok=True)
        roster.append(convert(pet_dir, out_dir, manifest))
    (OUT / "roster.json").write_text(json.dumps(manifest, indent=2) + "\n")
    total = sum(p.stat().st_size for p in OUT.rglob("*.png"))
    print(f"converted {len(manifest['pets'])} pets, {total // 1024} KiB of sheets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
