// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[macro_use]
extern crate tracing;

use crate::config::PROJECT_DIR;
use std::sync::{Arc, Mutex};
use tauri::{Manager, Window, WindowEvent};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::layer::SubscriberExt;

use tracing_subscriber::Layer;

mod commands;
mod config;
mod error;
mod logger;

pub(crate) type Result<T> = std::result::Result<T, error::Error>;

fn init_tracing() -> WorkerGuard {
    let appender = tracing_appender::rolling::hourly(PROJECT_DIR.cache_dir(), "tauri.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(appender);
    let filter = || {
        tracing_subscriber::EnvFilter::from_default_env()
            .add_directive("h2=warn".parse().unwrap())
            .add_directive("hyper=warn".parse().unwrap())
            .add_directive("rustls=warn".parse().unwrap())
            .add_directive("sled=warn".parse().unwrap())
    };
    tracing::subscriber::set_global_default(
        tracing_subscriber::Registry::default()
            .with(
                tracing_subscriber::fmt::layer()
                    .with_ansi(false)
                    .with_writer(non_blocking)
                    .with_filter(filter()),
            )
            .with(
                tracing_subscriber::fmt::layer()
                    .with_writer(std::io::stdout)
                    .with_filter(filter()),
            ),
    )
    .unwrap();
    guard
}

#[tauri::command]
async fn close_splash_screen(window: Window) {
    info!("closing splash screen");
    if let Some(window) = window.get_window("splash") {
        window.close().unwrap();
    }
    let main = window
        .get_window("main")
        .expect("no window labeled 'main' found");
    main.show().unwrap();
    main.set_focus().unwrap();
}

fn main() {
    let guard = Arc::new(Mutex::new(Some(init_tracing())));

    {
        let guard = guard.clone();
        std::panic::set_hook(Box::new(move |info| {
            error!("panic: {}", info);
            let backtrace = backtrace::Backtrace::new();
            error!("backtrace: {:?}", backtrace);
            drop(guard.lock().unwrap().take());
            std::process::exit(1);
        }));
    }

    if let Err(e) = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}))
        .invoke_handler(tauri::generate_handler![
            logger::log,
            close_splash_screen,
            commands::get_app_config,
            commands::update_app_config,
            commands::get_available_models,
            commands::create_chat_config,
            commands::get_chat_config,
            commands::update_chat_config,
            commands::delete_chat_config,
            commands::list_chat_configs,
            commands::chat_use_config,
            commands::get_chat_history,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::Destroyed if event.window().label() == "main" => {
                event.window().app_handle().exit(0);
            }
            _ => {}
        })
        .run(tauri::generate_context!())
    {
        error!("error: {}", e);
        drop(guard.lock().unwrap().take());
        std::process::exit(1);
    }
}
