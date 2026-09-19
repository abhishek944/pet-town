use super::generated_frame_validation;
use crc32fast::Hasher;
use flate2::{write::ZlibEncoder, Compression};
use image::{imageops::FilterType, DynamicImage, GenericImageView, ImageFormat, RgbaImage};
use std::io::Write;

const SIZE: u32 = 320;
const GENERATED_FRAMES: usize = 6;
type Bounds = (u32, u32, u32, u32);

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

fn normalize(frame: &RgbaImage, shared: Bounds) -> RgbaImage {
    let cropped = image::imageops::crop_imm(
        frame,
        shared.0,
        shared.1,
        shared.2 - shared.0 + 1,
        shared.3 - shared.1 + 1,
    )
    .to_image();
    let scale = (280.0 / cropped.width() as f32).min(280.0 / cropped.height() as f32);
    let width = (cropped.width() as f32 * scale).round().max(1.0) as u32;
    let height = (cropped.height() as f32 * scale).round().max(1.0) as u32;
    let resized = image::imageops::resize(&cropped, width, height, FilterType::Lanczos3);
    let mut canvas = RgbaImage::new(SIZE, SIZE);
    image::imageops::overlay(
        &mut canvas,
        &resized,
        i64::from((SIZE - width) / 2),
        i64::from(300u32.saturating_sub(height)),
    );
    canvas
}

pub fn prepare_frames(inputs: &[Vec<u8>]) -> Result<Vec<RgbaImage>, String> {
    if inputs.len() != GENERATED_FRAMES {
        return Err("Generate all six animation frames first.".into());
    }
    let frames = inputs
        .iter()
        .map(|bytes| validate_png(bytes).map(|image| image.to_rgba8()))
        .collect::<Result<Vec<_>, _>>()?;
    let dimensions = frames[0].dimensions();
    if frames.iter().any(|frame| frame.dimensions() != dimensions) {
        return Err("All generated frames must use the same image size.".into());
    }
    let bounds = frames
        .iter()
        .map(generated_frame_validation::bounds)
        .collect::<Result<Vec<_>, _>>()?;
    let shared = bounds
        .iter()
        .fold((dimensions.0, dimensions.1, 0, 0), |all, frame| {
            (
                all.0.min(frame.0),
                all.1.min(frame.1),
                all.2.max(frame.2),
                all.3.max(frame.3),
            )
        });
    let normalized = frames
        .iter()
        .map(|frame| normalize(frame, shared))
        .collect::<Vec<_>>();
    for index in 0..normalized.len() {
        let next = (index + 1) % normalized.len();
        let changed = normalized[index]
            .pixels()
            .zip(normalized[next].pixels())
            .filter(|(left, right)| left != right)
            .count();
        if changed < 64 {
            return Err("Two neighboring animation frames have too little visible change.".into());
        }
    }
    Ok(normalized)
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
    if frames.len() != GENERATED_FRAMES || !(128..=60_000).contains(&total_ms) {
        return Err("Animation must contain six frames and a safe duration.".into());
    }
    let mut output = b"\x89PNG\r\n\x1a\n".to_vec();
    let mut ihdr = Vec::new();
    ihdr.extend_from_slice(&SIZE.to_be_bytes());
    ihdr.extend_from_slice(&SIZE.to_be_bytes());
    ihdr.extend_from_slice(&[8, 6, 0, 0, 0]);
    chunk(&mut output, b"IHDR", &ihdr);
    let mut actl = Vec::new();
    actl.extend_from_slice(&(frames.len() as u32).to_be_bytes());
    actl.extend_from_slice(&0u32.to_be_bytes());
    chunk(&mut output, b"acTL", &actl);
    let base = total_ms / frames.len() as u32;
    let remainder = total_ms % frames.len() as u32;
    let mut sequence = 0u32;
    for (index, frame) in frames.iter().enumerate() {
        let delay = base + u32::from((index as u32) < remainder);
        let mut control = Vec::new();
        control.extend_from_slice(&sequence.to_be_bytes());
        sequence += 1;
        control.extend_from_slice(&SIZE.to_be_bytes());
        control.extend_from_slice(&SIZE.to_be_bytes());
        control.extend_from_slice(&0u32.to_be_bytes());
        control.extend_from_slice(&0u32.to_be_bytes());
        control.extend_from_slice(&(delay as u16).to_be_bytes());
        control.extend_from_slice(&1000u16.to_be_bytes());
        control.extend_from_slice(&[0, 0]);
        chunk(&mut output, b"fcTL", &control);
        let data = compressed(frame)?;
        if index == 0 {
            chunk(&mut output, b"IDAT", &data);
        } else {
            let mut frame_data = sequence.to_be_bytes().to_vec();
            sequence += 1;
            frame_data.extend_from_slice(&data);
            chunk(&mut output, b"fdAT", &frame_data);
        }
    }
    chunk(&mut output, b"IEND", &[]);
    Ok(output)
}
