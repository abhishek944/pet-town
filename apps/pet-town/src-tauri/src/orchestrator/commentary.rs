pub fn bounded(value: &str) -> String {
    let mut bytes = 0usize;
    value
        .chars()
        .take_while(|character| {
            bytes += character.len_utf8();
            bytes <= 480
        })
        .collect()
}
