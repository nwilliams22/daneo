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
#[tauri::command]
fn verify_acceptance_identity(
    prompt_sha256: String,
    item_set_path: String,
    item_set_sha256: String,
) -> Result<(), String> {
    let expected_prompt = std::env::var("DANEO_ACCEPTANCE_PROMPT_SHA256")
        .map_err(|_| "acceptance prompt hash is missing".to_string())?;
    let expected_set_path = std::env::var("DANEO_ACCEPTANCE_SET_PATH")
        .map_err(|_| "acceptance set path is missing".to_string())?;
    let expected_set = std::env::var("DANEO_ACCEPTANCE_SET_SHA256")
        .map_err(|_| "acceptance set hash is missing".to_string())?;
    validate_acceptance_identity(
        &app_lib::local_translation::acceptance_prompt_sha256(),
        &expected_prompt,
        &prompt_sha256,
        &expected_set_path,
        &expected_set,
        &item_set_path,
        &item_set_sha256,
    )
}

fn validate_acceptance_identity(
    embedded_prompt: &str,
    launcher_prompt: &str,
    bundle_prompt: &str,
    launcher_set_path: &str,
    launcher_set_hash: &str,
    bundle_set_path: &str,
    bundle_set_hash: &str,
) -> Result<(), String> {
    if bundle_prompt != launcher_prompt || embedded_prompt != launcher_prompt {
        return Err("acceptance prompt does not match the launcher and running binary".into());
    }
    if bundle_set_path != launcher_set_path || bundle_set_hash != launcher_set_hash {
        return Err("acceptance fixture does not match the launcher selection".into());
    }
    Ok(())
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
            finish_acceptance,
            verify_acceptance_identity
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

#[cfg(test)]
mod tests {
    use super::validate_acceptance_identity;

    fn valid() -> Result<(), String> {
        validate_acceptance_identity("prompt-a", "prompt-a", "prompt-a", "v1.json", "set-a", "v1.json", "set-a")
    }

    #[test]
    fn rejects_stale_binary_prompt_before_acceptance_can_start() {
        let error = validate_acceptance_identity("stale-prompt", "prompt-a", "prompt-a", "v1.json", "set-a", "v1.json", "set-a").unwrap_err();
        assert!(error.contains("prompt"));
    }

    #[test]
    fn rejects_mismatched_bundle_fixture_before_acceptance_can_start() {
        let error = validate_acceptance_identity("prompt-a", "prompt-a", "prompt-a", "v1.json", "set-a", "v2.json", "set-b").unwrap_err();
        assert!(error.contains("fixture"));
    }

    #[test]
    fn accepts_matching_binary_and_bundle() {
        assert!(valid().is_ok());
    }
}
