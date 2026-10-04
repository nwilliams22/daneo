//! Opt-in real WebKit/Tauri command acceptance runner. See reference/eval/README.md.
use app_lib::local_translation::{self, LocalTranslator};
use std::{
    io::Write,
    sync::{Arc, Mutex},
};

struct Evidence(Mutex<std::fs::File>);
#[tauri::command]
fn record_acceptance(value: serde_json::Value, evidence: tauri::State<'_, Evidence>) {
    let mut file = evidence.0.lock().unwrap();
    writeln!(file, "{value}").unwrap();
    file.flush().unwrap();
    println!("acceptance: {}", value["requestId"]);
}
#[tauri::command]
fn finish_acceptance(app: tauri::AppHandle) {
    app.exit(0);
}
fn main() {
    let path = std::env::var_os("DANEO_ACCEPTANCE_RESULTS").expect("DANEO_ACCEPTANCE_RESULTS");
    let script = std::fs::read_to_string(
        std::env::var_os("DANEO_ACCEPTANCE_SCRIPT").expect("DANEO_ACCEPTANCE_SCRIPT"),
    )
    .unwrap();
    let model = std::env::var_os("DANEO_MODEL_PATH").expect("DANEO_MODEL_PATH");
    let mut context = tauri::generate_context!();
    // Create the same configured main window with evidence automation injected.
    let windows = std::mem::take(&mut context.config_mut().app.windows);
    tauri::Builder::default()
        .manage(Arc::new(LocalTranslator::new(model.into())))
        .manage(Evidence(Mutex::new(std::fs::File::create(path).unwrap())))
        .invoke_handler(tauri::generate_handler![
            local_translation::translate_local,
            local_translation::cancel_local,
            local_translation::local_translation_state,
            record_acceptance,
            finish_acceptance
        ])
        .setup(move |app| {
            let mut config = windows[0].clone();
            config.title = "Daneo acceptance (isolated data)".into();
            tauri::WebviewWindowBuilder::from_config(app, &config)?
                .data_directory(std::path::PathBuf::from(
                    std::env::var_os("DANEO_ACCEPTANCE_DATA").expect("DANEO_ACCEPTANCE_DATA"),
                ))
                .initialization_script(&script)
                .build()?;
            Ok(())
        })
        .run(context)
        .expect("acceptance desktop runtime");
}
