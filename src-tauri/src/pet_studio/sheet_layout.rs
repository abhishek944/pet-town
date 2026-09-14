use image::{DynamicImage, ImageFormat, Rgba, RgbaImage};
use std::io::Cursor;

const WIDTH: u32 = 1024;
const HEIGHT: u32 = 1536;
const COLUMNS: u32 = 2;
const ROWS: u32 = 4;
const GUIDE_INSET: u32 = 28;
const GUIDE_THICKNESS: u32 = 4;

pub fn template_png() -> Result<Vec<u8>, String> {
    let mut canvas = RgbaImage::new(WIDTH, HEIGHT);
    let cell_width = WIDTH / COLUMNS;
    let cell_height = HEIGHT / ROWS;
    let guide = Rgba([65, 220, 235, 190]);
    for row in 0..ROWS {
        for column in 0..COLUMNS {
            let left = column * cell_width + GUIDE_INSET;
            let right = (column + 1) * cell_width - GUIDE_INSET - 1;
            let top = row * cell_height + GUIDE_INSET;
            let bottom = (row + 1) * cell_height - GUIDE_INSET - 1;
            for offset in 0..GUIDE_THICKNESS {
                for x in left..=right {
                    canvas.put_pixel(x, top + offset, guide);
                    canvas.put_pixel(x, bottom - offset, guide);
                }
                for y in top..=bottom {
                    canvas.put_pixel(left + offset, y, guide);
                    canvas.put_pixel(right - offset, y, guide);
                }
            }
        }
    }
    let mut output = Cursor::new(Vec::new());
    DynamicImage::ImageRgba8(canvas)
        .write_to(&mut output, ImageFormat::Png)
        .map_err(|_| "Could not create the eight-cell sprite template.".to_string())?;
    Ok(output.into_inner())
}

pub fn validate_dimensions(width: u32, height: u32) -> Result<(), String> {
    if (width, height) != (WIDTH, HEIGHT) {
        return Err(
            "Sprite sheet must be exactly 1024x1536 to match the eight-cell template.".into(),
        );
    }
    Ok(())
}

pub fn validate_clearance(
    bounds: (u32, u32, u32, u32),
    width: u32,
    height: u32,
) -> Result<(), String> {
    let horizontal = (width / 12).max(16);
    let vertical = (height / 12).max(16);
    if bounds.0 < horizontal
        || bounds.1 < vertical
        || bounds.2 >= width.saturating_sub(horizontal)
        || bounds.3 >= height.saturating_sub(vertical)
    {
        return Err("A sprite crosses a cell safety edge. Regenerate the sheet so each frame stays inside its own box.".into());
    }
    Ok(())
}
