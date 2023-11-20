use tauri::command;

use tracing::Level;

fn parse_level(level: u8) -> Level {
    match level {
        1 => Level::TRACE,
        2 => Level::DEBUG,
        3 => Level::INFO,
        4 => Level::WARN,
        5 => Level::ERROR,
        _ => unreachable!(),
    }
}

#[command]
pub async fn log(
    level: u8,
    message: String,
    location: String,
    file: Option<String>,
    line: Option<u32>,
) {
    match parse_level(level) {
        Level::TRACE => {
            trace!(target: "tauri", location = location.as_str(), file = file.as_deref(), line = line, message)
        }
        Level::DEBUG => {
            debug!(target: "tauri", location = location.as_str(), file = file.as_deref(), line = line, message)
        }
        Level::INFO => {
            info!(target: "tauri", location = location.as_str(), file = file.as_deref(), line = line, message)
        }
        Level::WARN => {
            warn!(target: "tauri", location = location.as_str(), file = file.as_deref(), line = line, message)
        }
        Level::ERROR => {
            error!(target: "tauri", location = location.as_str(), file = file.as_deref(), line = line, message)
        }
    }
}
