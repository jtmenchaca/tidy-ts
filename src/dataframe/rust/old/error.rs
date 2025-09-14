//! Error ↔ Status mapping (adds boxed messages for nested context).

#![deny(unsafe_op_in_unsafe_fn)]

#[repr(i32)]
#[derive(Copy, Clone)]
pub enum Status {
    Ok = 0,
    IncompatibleSize = 1,
    MixedNull = 2,
    NotVector = 3,
    Other = 255,
}

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
    IncompatibleSize {
        #[allow(dead_code)]
        size: usize,
        #[allow(dead_code)]
        expected: usize,
    },
    MixedNull,
    #[allow(dead_code)]
    NotVector,
    #[allow(dead_code)]
    Other(&'static str),
    /// Allows tagging an inner error with extra context.
    #[allow(dead_code)]
    OtherBoxed(String, Box<Error>),
}

impl Error {
    #[allow(dead_code)]
    pub fn boxed<M: Into<String>>(msg: M, err: Error) -> Self {
        Error::OtherBoxed(msg.into(), Box::new(err))
    }
}

impl From<&str> for Error {
    fn from(s: &str) -> Self {
        Error::OtherBoxed(s.to_string(), Box::new(Error::Other("")))
    }
}

impl From<String> for Error {
    fn from(s: String) -> Self {
        Error::OtherBoxed(s, Box::new(Error::Other("")))
    }
}

pub fn to_status<F>(f: F) -> Status
where
    F: FnOnce() -> Result<()>,
{
    match f() {
        Ok(()) => Status::Ok,
        Err(Error::IncompatibleSize { .. }) => Status::IncompatibleSize,
        Err(Error::MixedNull) => Status::MixedNull,
        Err(Error::NotVector) => Status::NotVector,
        Err(_) => Status::Other,
    }
}
