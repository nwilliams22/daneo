mod backup;
pub mod local_translation;
pub mod model_artifact;
pub mod model_download;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            backup::export_backup,
            local_translation::translate_local,
            local_translation::ask_tutor_local,
            local_translation::cancel_local,
            local_translation::local_translation_state,
            local_translation::set_model_idle_seconds,
            model_download::download_model,
            model_download::cancel_model_download,
            model_download::model_cache_state,
            model_download::model_storage_details,
            model_download::delete_model,
        ])
        .setup(|app| {
            model_download::setup(app)?;
            use tauri::Manager;
            let root = app.path().app_data_dir()?.join("models");
            let path = std::env::var_os("DANEO_MODEL_PATH")
                .map(std::path::PathBuf::from)
                .or_else(|| model_download::selected_path(&root))
                .unwrap_or_else(|| {
                    std::path::PathBuf::from(".local-models").join(model_artifact::MODEL_FILENAME)
                });
            let translator = Arc::new(local_translation::LocalTranslator::new(path));
            let idle = Arc::downgrade(&translator);
            std::thread::spawn(move || {
                while let Some(translator) = idle.upgrade() {
                    std::thread::sleep(std::time::Duration::from_secs(1));
                    translator.unload_if_idle();
                }
            });
            app.manage(translator);
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
