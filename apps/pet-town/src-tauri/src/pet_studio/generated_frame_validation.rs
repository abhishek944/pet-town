use super::images;

type Bounds = (u32, u32, u32, u32);

fn overlap(left: impl Iterator<Item = bool>, right: impl Iterator<Item = bool>) -> (u64, u64) {
    left.zip(right)
        .fold((0, 0), |(intersection, union), (left, right)| {
            (
                intersection + u64::from(left && right),
                union + u64::from(left || right),
            )
        })
}

fn registered_mask(image: &image::RgbaImage, area: Bounds, shared_extent: u32) -> Vec<bool> {
    const SIDE: u32 = 64;
    const INNER: u32 = 60;
    let width = area.2 - area.0 + 1;
    let height = area.3 - area.1 + 1;
    let fitted_width = (width * INNER / shared_extent).max(1);
    let fitted_height = (height * INNER / shared_extent).max(1);
    let left = (SIDE - fitted_width) / 2;
    let top = (SIDE - fitted_height) / 2;
    (0..SIDE)
        .flat_map(|y| {
            (0..SIDE).map(move |x| {
                if x < left || x >= left + fitted_width || y < top || y >= top + fitted_height {
                    return false;
                }
                let source_x = area.0 + (x - left) * width / fitted_width;
                let source_y = area.1 + (y - top) * height / fitted_height;
                image
                    .get_pixel(source_x.min(area.2), source_y.min(area.3))
                    .0[3]
                    > 8
            })
        })
        .collect()
}

fn near_duplicate(
    left: &image::RgbaImage,
    right: &image::RgbaImage,
    left_bounds: Bounds,
    right_bounds: Bounds,
) -> bool {
    let (raw_intersection, raw_union) = overlap(
        left.pixels().map(|pixel| pixel.0[3] > 8),
        right.pixels().map(|pixel| pixel.0[3] > 8),
    );
    let shared_extent = [left_bounds, right_bounds]
        .iter()
        .map(|area| (area.2 - area.0 + 1).max(area.3 - area.1 + 1))
        .max()
        .unwrap_or(1);
    let left_mask = registered_mask(left, left_bounds, shared_extent);
    let right_mask = registered_mask(right, right_bounds, shared_extent);
    let (shape_intersection, shape_union) = overlap(left_mask.into_iter(), right_mask.into_iter());
    (raw_union > 0 && raw_intersection * 1_000 >= raw_union * 975)
        || (shape_union > 0 && shape_intersection * 1_000 >= shape_union * 920)
}

pub(crate) fn bounds(image: &image::RgbaImage) -> Result<Bounds, String> {
    let (width, height) = image.dimensions();
    let mut result = (width, height, 0, 0);
    let mut visible = 0usize;
    for (x, y, pixel) in image.enumerate_pixels() {
        if pixel.0[3] > 8 {
            result = (
                result.0.min(x),
                result.1.min(y),
                result.2.max(x),
                result.3.max(y),
            );
            visible += 1;
        }
    }
    if visible < 512 || result.2 <= result.0 || result.3 <= result.1 {
        return Err("A generated animation frame is blank or too faint.".into());
    }
    let horizontal = (width / 100).max(4);
    let vertical = (height / 100).max(4);
    if result.0 < horizontal
        || result.1 < vertical
        || result.2 >= width.saturating_sub(horizontal)
        || result.3 >= height.saturating_sub(vertical)
    {
        return Err("A generated character is clipped or too close to the image edge. Regenerate with a small transparent margin around the pet.".into());
    }
    Ok(result)
}

pub fn validate(inputs: &[Vec<u8>], close_loop: bool) -> Result<(), String> {
    let frames = inputs
        .iter()
        .map(|bytes| images::validate_png(bytes).map(|image| image.to_rgba8()))
        .collect::<Result<Vec<_>, _>>()?;
    let dimensions = frames[0].dimensions();
    if frames.iter().any(|frame| frame.dimensions() != dimensions) {
        return Err("All generated frames must use the same image size.".into());
    }
    let frame_bounds = frames.iter().map(bounds).collect::<Result<Vec<_>, _>>()?;
    for left in 0..frames.len() {
        for right in left + 1..frames.len() {
            if near_duplicate(
                &frames[left],
                &frames[right],
                frame_bounds[left],
                frame_bounds[right],
            ) {
                return Err(format!(
                    "Frames {} and {} repeat nearly the same pose. Regenerate with six distinct motion phases.",
                    left + 1,
                    right + 1
                ));
            }
        }
    }
    let comparisons = frames.len().saturating_sub(1) + usize::from(close_loop);
    for index in 0..comparisons {
        let next = (index + 1) % frames.len();
        let changed = frames[index]
            .pixels()
            .zip(frames[next].pixels())
            .filter(|(left, right)| left != right)
            .take(64)
            .count();
        if changed < 64 {
            return Err("Two neighboring animation frames have too little visible change.".into());
        }
    }
    Ok(())
}
