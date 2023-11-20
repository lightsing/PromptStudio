use std::error::Error as StdError;
use thiserror::Error;

#[allow(clippy::enum_variant_names)]
#[derive(Error, Debug)]
pub enum Error {
    #[error("Failed to open config file")]
    FailToOpenConfigFile(std::io::Error),
    #[error("Failed to read config file")]
    InvalidConfigFile(serde_json::Error),
    #[error("Failed to write config file")]
    FailToWriteConfigFile(serde_json::Error),
}

pub trait LogError<T, E> {
    fn log_err(self, message: &str, f: fn(E) -> Error) -> Result<T, Error>;
}

impl<T, E> LogError<T, E> for Result<T, E>
where
    E: StdError + 'static,
{
    fn log_err(self, message: &str, f: fn(E) -> Error) -> Result<T, Error> {
        self.map_err(|e| {
            error!("{}: {:?}", message, e);
            f(e)
        })
    }
}
