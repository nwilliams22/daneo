pub mod local_translation;
pub mod model_artifact;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Arc::new(local_translation::LocalTranslator::new(
            std::env::var_os("DANEO_MODEL_PATH")
                .map(std::path::PathBuf::from)
                .unwrap_or_else(|| {
                    std::path::PathBuf::from(".local-models").join(model_artifact::MODEL_FILENAME)
                }),
        )))
        .invoke_handler(tauri::generate_handler![
            local_translation::translate_local,
            local_translation::cancel_local,
            local_translation::local_translation_state,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
