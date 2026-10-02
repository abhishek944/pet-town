#[cfg(unix)]
pub(crate) fn connect(path: &str) -> std::io::Result<std::os::unix::net::UnixStream> {
    use std::io::{Error, ErrorKind};
    use std::os::fd::{AsRawFd, FromRawFd};
    use std::time::{Duration, Instant};
    let mut address: libc::sockaddr_un = unsafe { std::mem::zeroed() };
    address.sun_family = libc::AF_UNIX as _;
    #[cfg(target_os = "macos")]
    {
        address.sun_len = std::mem::size_of_val(&address) as u8;
    }
    if path.is_empty() || path.as_bytes().contains(&0) || path.len() >= address.sun_path.len() {
        return Err(Error::new(
            ErrorKind::InvalidInput,
            "invalid local socket path",
        ));
    }
    for (target, byte) in address.sun_path.iter_mut().zip(path.bytes()) {
        *target = byte as _;
    }
    let raw = unsafe { libc::socket(libc::AF_UNIX, libc::SOCK_STREAM, 0) };
    if raw < 0 {
        return Err(Error::last_os_error());
    }
    let stream = unsafe { std::os::unix::net::UnixStream::from_raw_fd(raw) };
    if unsafe { libc::fcntl(raw, libc::F_SETFD, libc::FD_CLOEXEC) } < 0 {
        return Err(Error::last_os_error());
    }
    stream.set_nonblocking(true)?;
    let deadline = Instant::now() + Duration::from_secs(2);
    loop {
        let result = unsafe {
            libc::connect(
                stream.as_raw_fd(),
                &address as *const _ as *const libc::sockaddr,
                std::mem::size_of_val(&address) as libc::socklen_t,
            )
        };
        if result == 0 {
            break;
        }
        let error = Error::last_os_error();
        if error.raw_os_error() == Some(libc::EISCONN) {
            break;
        }
        if !matches!(
            error.raw_os_error(),
            Some(libc::EINPROGRESS | libc::EALREADY | libc::EAGAIN | libc::EINTR)
        ) {
            return Err(error);
        }
        if Instant::now() >= deadline {
            return Err(Error::new(ErrorKind::TimedOut, "local socket timed out"));
        }
        std::thread::sleep(Duration::from_millis(5));
    }
    stream.set_nonblocking(false)?;
    Ok(stream)
}
