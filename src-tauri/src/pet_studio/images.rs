use crc32fast::Hasher;
use flate2::{write::ZlibEncoder, Compression};
use image::{imageops::FilterType, DynamicImage, GenericImageView, ImageFormat, RgbaImage};
use std::io::Write;

const SIZE: u32 = 320;

pub fn validate_png(bytes: &[u8]) -> Result<DynamicImage, String> {
    if !bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        return Err("The generated file is not a PNG image.".into());
    }
    let image = image::load_from_memory_with_format(bytes, ImageFormat::Png)
        .map_err(|_| "The generated PNG could not be decoded.".to_string())?;
    let (width, height) = image.dimensions();
    if width < 512 || height < 512 || width > 4096 || height > 4096 {
        return Err("Generated image dimensions are outside the safe range.".into());
    }
    let rgba = image.to_rgba8();
    let transparent = rgba.pixels().filter(|pixel| pixel.0[3] == 0).count();
    if transparent < (width * height / 100) as usize {
        return Err("Generated image needs a genuinely transparent background.".into());
    }
    Ok(DynamicImage::ImageRgba8(rgba))
}

type Bounds = (u32, u32, u32, u32);

fn frame_bounds(cell: &RgbaImage) -> Result<Bounds, String> {
    let (width, height) = cell.dimensions();
    let mut bounds = (width, height, 0, 0);
    let mut visible = 0usize;
    for (x, y, pixel) in cell.enumerate_pixels() {
        if pixel.0[3] > 8 {
            bounds = (
                bounds.0.min(x),
                bounds.1.min(y),
                bounds.2.max(x),
                bounds.3.max(y),
            );
            visible += 1;
        }
    }
    if visible < 512 || bounds.2 <= bounds.0 || bounds.3 <= bounds.1 {
        return Err("A sprite-sheet cell is blank or too faint.".into());
    }
    Ok(bounds)
}

fn normalize(cell: &RgbaImage, bounds: Bounds) -> RgbaImage {
    let cropped = image::imageops::crop_imm(
        cell,
        bounds.0,
        bounds.1,
        bounds.2 - bounds.0 + 1,
        bounds.3 - bounds.1 + 1,
    )
    .to_image();
    let scale = (280.0 / cropped.width() as f32).min(280.0 / cropped.height() as f32);
    let new_width = (cropped.width() as f32 * scale).round().max(1.0) as u32;
    let new_height = (cropped.height() as f32 * scale).round().max(1.0) as u32;
    let resized = image::imageops::resize(&cropped, new_width, new_height, FilterType::Lanczos3);
    let mut canvas = RgbaImage::new(SIZE, SIZE);
    let x = (SIZE - new_width) / 2;
    let y = 300u32.saturating_sub(new_height);
    image::imageops::overlay(&mut canvas, &resized, i64::from(x), i64::from(y));
    canvas
}

pub fn split_sheet(bytes: &[u8]) -> Result<Vec<RgbaImage>, String> {
    let image = validate_png(bytes)?.to_rgba8();
    let (width, height) = image.dimensions();
    if width % 2 != 0 || height % 4 != 0 {
        return Err("Sprite sheet must divide evenly into 2 columns and 4 rows.".into());
    }
    let cell_width = width / 2;
    let cell_height = height / 4;
    let mut cells = Vec::with_capacity(8);
    for row in 0..4 {
        for column in 0..2 {
            cells.push(
                image::imageops::crop_imm(
                    &image,
                    column * cell_width,
                    row * cell_height,
                    cell_width,
                    cell_height,
                )
                .to_image(),
            );
        }
    }
    let bounds = cells
        .iter()
        .map(frame_bounds)
        .collect::<Result<Vec<_>, _>>()?;
    let shared = bounds
        .iter()
        .fold((cell_width, cell_height, 0, 0), |all, frame| {
            (
                all.0.min(frame.0),
                all.1.min(frame.1),
                all.2.max(frame.2),
                all.3.max(frame.3),
            )
        });
    let frames = cells
        .iter()
        .map(|cell| normalize(cell, shared))
        .collect::<Vec<_>>();
    for pair in frames.windows(2) {
        let changed = pair[0]
            .pixels()
            .zip(pair[1].pixels())
            .filter(|(left, right)| left != right)
            .count();
        if changed < 64 {
            return Err("Two neighboring animation frames have too little visible change.".into());
        }
    }
    Ok(frames)
}

fn chunk(output: &mut Vec<u8>, kind: &[u8; 4], data: &[u8]) {
    output.extend_from_slice(&(data.len() as u32).to_be_bytes());
    output.extend_from_slice(kind);
    output.extend_from_slice(data);
    let mut hasher = Hasher::new();
    hasher.update(kind);
    hasher.update(data);
    output.extend_from_slice(&hasher.finalize().to_be_bytes());
}

fn compressed(frame: &RgbaImage) -> Result<Vec<u8>, String> {
    let mut raw = Vec::with_capacity((SIZE * SIZE * 4 + SIZE) as usize);
    for row in frame.rows() {
        raw.push(0);
        for pixel in row {
            raw.extend_from_slice(&pixel.0);
        }
    }
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    encoder
        .write_all(&raw)
        .map_err(|_| "Could not encode an animation frame.".to_string())?;
    encoder
        .finish()
        .map_err(|_| "Could not finish the animation.".to_string())
}

pub fn encode_apng(frames: &[RgbaImage], total_ms: u32) -> Result<Vec<u8>, String> {
    if frames.len() != 8 || !(128..=60_000).contains(&total_ms) {
        return Err("Animation must contain eight frames and a safe duration.".into());
    }
    let mut output = b"\x89PNG\r\n\x1a\n".to_vec();
    let mut ihdr = Vec::new();
    ihdr.extend_from_slice(&SIZE.to_be_bytes());
    ihdr.extend_from_slice(&SIZE.to_be_bytes());
    ihdr.extend_from_slice(&[8, 6, 0, 0, 0]);
    chunk(&mut output, b"IHDR", &ihdr);
    let mut actl = Vec::new();
    actl.extend_from_slice(&8u32.to_be_bytes());
    actl.extend_from_slice(&0u32.to_be_bytes());
    chunk(&mut output, b"acTL", &actl);
    let base = total_ms / 8;
    let remainder = total_ms % 8;
    let mut sequence = 0u32;
    for (index, frame) in frames.iter().enumerate() {
        let delay = base + u32::from((index as u32) < remainder);
        let mut fctl = Vec::new();
        fctl.extend_from_slice(&sequence.to_be_bytes());
        sequence += 1;
        fctl.extend_from_slice(&SIZE.to_be_bytes());
        fctl.extend_from_slice(&SIZE.to_be_bytes());
        fctl.extend_from_slice(&0u32.to_be_bytes());
        fctl.extend_from_slice(&0u32.to_be_bytes());
        fctl.extend_from_slice(&(delay as u16).to_be_bytes());
        fctl.extend_from_slice(&1000u16.to_be_bytes());
        fctl.extend_from_slice(&[0, 0]);
        chunk(&mut output, b"fcTL", &fctl);
        let data = compressed(frame)?;
        if index == 0 {
            chunk(&mut output, b"IDAT", &data);
        } else {
            let mut fdat = sequence.to_be_bytes().to_vec();
            sequence += 1;
            fdat.extend_from_slice(&data);
            chunk(&mut output, b"fdAT", &fdat);
        }
    }
    chunk(&mut output, b"IEND", &[]);
    Ok(output)
}
