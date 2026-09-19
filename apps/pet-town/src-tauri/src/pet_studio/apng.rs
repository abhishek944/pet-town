use crc32fast::Hasher;
use image::codecs::png::PngDecoder;
use image::{AnimationDecoder, GenericImageView, ImageFormat};
use std::io::{BufReader, Cursor};

const MAX_BYTES: usize = 20 * 1024 * 1024;

pub fn validate(bytes: &[u8]) -> Result<u32, String> {
    if bytes.len() > MAX_BYTES || !bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        return Err("Choose a valid APNG no larger than 20 MB.".into());
    }
    let image = image::load_from_memory_with_format(bytes, ImageFormat::Png)
        .map_err(|_| "The APNG could not be decoded.".to_string())?;
    let (width, height) = image.dimensions();
    if !(64..=1024).contains(&width) || !(64..=1024).contains(&height) {
        return Err("APNG dimensions must be between 64 and 1024 pixels.".into());
    }
    let rgba = image.to_rgba8();
    if rgba.pixels().filter(|pixel| pixel.0[3] < 255).count() < (width * height / 100) as usize {
        return Err("The APNG needs a transparent background.".into());
    }
    let mut offset = 8usize;
    let mut declared = None;
    let mut controls = 0u32;
    let mut duration = 0f64;
    let mut ended = false;
    while offset + 12 <= bytes.len() {
        let length = u32::from_be_bytes(bytes[offset..offset + 4].try_into().unwrap()) as usize;
        let end = offset
            .checked_add(12 + length)
            .filter(|end| *end <= bytes.len())
            .ok_or_else(|| "The APNG has an invalid chunk length.".to_string())?;
        let kind: [u8; 4] = bytes[offset + 4..offset + 8].try_into().unwrap();
        let data = &bytes[offset + 8..offset + 8 + length];
        let mut crc = Hasher::new();
        crc.update(&kind);
        crc.update(data);
        let expected = u32::from_be_bytes(bytes[offset + 8 + length..end].try_into().unwrap());
        if crc.finalize() != expected {
            return Err("The APNG has a damaged chunk.".into());
        }
        match &kind {
            b"acTL" if length == 8 && declared.is_none() => {
                declared = Some(u32::from_be_bytes(data[..4].try_into().unwrap()));
            }
            b"fcTL" if length == 26 => {
                controls += 1;
                let numerator = u16::from_be_bytes(data[20..22].try_into().unwrap()) as f64;
                let denominator = u16::from_be_bytes(data[22..24].try_into().unwrap()) as f64;
                duration += numerator * 1000.0
                    / if denominator == 0.0 {
                        100.0
                    } else {
                        denominator
                    };
            }
            b"IEND" if length == 0 => {
                ended = true;
                offset = end;
                break;
            }
            _ => {}
        }
        offset = end;
    }
    let frames = declared.ok_or_else(|| "The selected PNG is not animated.".to_string())?;
    if !ended || offset != bytes.len() || !(2..=64).contains(&frames) || controls != frames {
        return Err("The APNG frame structure is invalid.".into());
    }
    if !(128.0..=60_000.0).contains(&duration) {
        return Err("The APNG cycle must last between 128 ms and 60 seconds.".into());
    }
    decode_frames(bytes, frames, width, height)?;
    Ok(duration.round() as u32)
}

fn decode_frames(bytes: &[u8], expected: u32, width: u32, height: u32) -> Result<(), String> {
    let decoder = PngDecoder::new(BufReader::new(Cursor::new(bytes)))
        .map_err(|_| "The APNG decoder rejected the file.".to_string())?;
    if !decoder.is_apng().unwrap_or(false) {
        return Err("The selected PNG is not animated.".into());
    }
    let mut count = 0u32;
    for frame in decoder
        .apng()
        .map_err(|_| "The APNG is invalid.".to_string())?
        .into_frames()
    {
        let buffer = frame
            .map_err(|_| "An APNG frame could not be decoded.".to_string())?
            .into_buffer();
        if buffer.dimensions() != (width, height) {
            return Err("Every APNG frame must use the same canvas size.".into());
        }
        count += 1;
        if count > 64 {
            return Err("The APNG has too many frames.".into());
        }
    }
    if count != expected {
        return Err("The APNG frame count is inconsistent.".into());
    }
    Ok(())
}
