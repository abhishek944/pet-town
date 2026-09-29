# Pet Town logo kit

The approved direction pairs an orange kitten and teal dragon with the words **Pet Town** inside a curved grassy base. This kit is ready for digital previews and icon use. It is **not a fully vectorized print identity**: the approved character art and display lettering are PNG illustrations. The small-size icon is a separate editable SVG.

## Pick a file

| Use | File |
|---|---|
| Main logo on a light background | `digital/pet-town-stacked-color.png` |
| Wide header / README | `digital/pet-town-horizontal-color.png` |
| Name alone | `digital/pet-town-wordmark-color.png` |
| Characters alone, at larger sizes | `digital/pet-town-companions-color.png` |
| One-colour, where colour printing is unavailable | `digital/pet-town-horizontal-black.png` or `digital/pet-town-horizontal-white.png` |
| Editable small-size symbol | `source/pet-town-small-symbol.svg` |
| Single-ink symbol | `source/pet-town-small-symbol-mono.svg` |
| macOS dock source | `app/pet-town-app-icon-1024.png` / `app/pet-town-app-icon.icns` |
| Tauri icon replacements, **if explicitly chosen later** | `app/32x32.png`, `app/128x128.png`, `app/128x128@2x.png`, `app/pet-town-app-icon.icns` |
| Browser tab | `web/favicon.ico` or `web/pet-town-32.png` |
| Website / PWA assets | `web/pet-town-{16,32,48,64,180,192,512}.png`, `web/site.webmanifest` |
| Profile/avatar | `social/pet-town-avatar-1024.png` |
| Original approved raster source | `source/pet-town-approved-raster-master.png` |

No existing application or website files were replaced. The `web/head-snippet.html` is an example, not an applied change. Run `python3 art/logo-kit/build_kit.py` from the repo root to regenerate the raster exports (macOS `iconutil` is required for `.icns`).

## Palette

| Role | HEX | RGB | Approx. CMYK* | Use |
|---|---|---|---|---|
| Night ink | `#082149` | 8, 33, 73 | 89, 55, 0, 71 | Outlines, dark surfaces |
| Dragon teal | `#23C8CD` | 35, 200, 205 | 83, 2, 0, 20 | Main character |
| Kitten orange | `#FF932C` | 255, 147, 44 | 0, 42, 83, 0 | Warm accent |
| Sunflower | `#FFDE54` | 255, 222, 84 | 0, 13, 67, 0 | Name face |
| Meadow | `#689A38` | 104, 154, 56 | 32, 0, 64, 40 | Curved base |
| Soft cream | `#FFF4DA` | 255, 244, 218 | 0, 4, 15, 0 | Icon tile / calm background |

*Screen-to-process approximations only. These have not been proofed in print and are not Pantone matches. The illustration itself has extra shades beyond the palette; the table defines the identity's principal colours.

## Usage

- Leave at least **one eighth of the logo's height** free on every side. Do not stretch or rotate a file.
- Use the detailed stacked logo at **300 px wide or larger**, the horizontal version at **400 px wide or larger**, and the isolated colourful wordmark at **180 px wide or larger**. These are visual recommendations, not print specifications.
- For **16–64 px**, use the simplified SVG or exported web icon, not the detailed kitten-and-dragon scene. The icon is a small-size interpretation, not a trace of the illustration.
- Put the full-colour logo on cream, white, or another quiet light background. On navy or busy imagery, add a cream panel/tile rather than letting the dark outline disappear.
- `digital/*-black.png` and `digital/*-white.png` are **readability-first fallback lockups**: they pair the mono vector symbol with a plain rendered rounded wordmark; they are not one-ink conversions of the detailed illustration. The fallback lettering was rendered with the system's Arial Rounded Bold; verify font/licensing policy before commercial distribution of any editable typography.
- Keep the lower-case **t** in “Pet” plain, with one normal crossbar. Do not reintroduce the former coral pennant.
- `web/site.webmanifest` uses paths relative to itself. Copy it and its referenced PNGs together into a site's public root before linking it.

## Handover and limits

The full illustrated composition cannot be represented as a native editable SVG merely by embedding a PNG inside an SVG wrapper; no such file is labeled as a vector master here. For large-format print, embroidery, cutting, or full one-colour reproduction of the detailed logo, commission a careful vector redraw of the approved character and lettering shapes, then proof the result at size. The compact icon is native vector but retains strokes; expand them to outlines for cutters. Original concept art is image-generated and should be reviewed for originality; a professional trademark and reverse-image search is still required before launch. No trademark clearance, print proof, or Pantone match was performed.
