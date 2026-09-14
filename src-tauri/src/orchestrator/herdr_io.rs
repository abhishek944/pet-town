use std::io::Read;

pub fn read_stream(
    stream: impl Read + Send + 'static,
    limit: u64,
) -> std::thread::JoinHandle<std::io::Result<Vec<u8>>> {
    std::thread::spawn(move || {
        let mut bytes = Vec::new();
        stream
            .take(limit + 1)
            .read_to_end(&mut bytes)
            .map(|_| bytes)
    })
}
