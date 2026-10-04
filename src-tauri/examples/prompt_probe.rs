//! Opt-in local prompt evaluation without a display server. Inputs are selected by fixture path.
use app_lib::local_translation::{LocalTranslator, Phase};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    cell::Cell,
    io::{BufWriter, Write},
    path::PathBuf,
    sync::Arc,
    time::Instant,
};

fn verify_probe_identity(
    embedded_prompt_sha256: &str,
    launcher_prompt_sha256: &str,
    fixture_path: &str,
    fixture_sha256: &str,
    launcher_fixture_path: &str,
    launcher_fixture_sha256: &str,
) -> Result<(), String> {
    if embedded_prompt_sha256 != launcher_prompt_sha256 {
        return Err("prompt_probe binary prompt does not match launcher prompt".into());
    }
    if fixture_path != launcher_fixture_path || fixture_sha256 != launcher_fixture_sha256 {
        return Err("prompt_probe fixture does not match launcher selection".into());
    }
    Ok(())
}

fn main() {
    if let Err(error) = run() {
        eprintln!("prompt_probe: {error}");
        std::process::exit(2);
    }
}

fn run() -> Result<(), String> {
    let fixture_path = std::env::args().nth(1).expect("fixture path");
    let output_path = std::env::args().nth(2).expect("output path");
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf();
    let fixture_file = PathBuf::from(&fixture_path);
    let fixture_file = if fixture_file.is_absolute() { fixture_file } else { root.join(fixture_file) };
    let fixture_bytes = std::fs::read(&fixture_file).map_err(|error| format!("read fixture: {error}"))?;
    let fixture_sha256 = format!("{:x}", Sha256::digest(&fixture_bytes));
    let relative_fixture = fixture_file.strip_prefix(&root)
        .map_err(|_| "fixture must be inside the repository".to_string())?
        .to_string_lossy().replace('\\', "/");
    let launcher_prompt = std::env::var("DANEO_ACCEPTANCE_PROMPT_SHA256")
        .map_err(|_| "DANEO_ACCEPTANCE_PROMPT_SHA256 is required".to_string())?;
    let launcher_fixture_path = std::env::var("DANEO_ACCEPTANCE_SET_PATH")
        .map_err(|_| "DANEO_ACCEPTANCE_SET_PATH is required".to_string())?;
    let launcher_fixture_hash = std::env::var("DANEO_ACCEPTANCE_SET_SHA256")
        .map_err(|_| "DANEO_ACCEPTANCE_SET_SHA256 is required".to_string())?;
    verify_probe_identity(
        &app_lib::local_translation::acceptance_prompt_sha256(),
        &launcher_prompt,
        &relative_fixture,
        &fixture_sha256,
        &launcher_fixture_path,
        &launcher_fixture_hash,
    )?;
    let fixture: Value = serde_json::from_slice(&fixture_bytes).map_err(|error| format!("parse fixture: {error}"))?;
    let items = fixture["items"].as_array().unwrap();
    let model = PathBuf::from(std::env::var_os("DANEO_MODEL_PATH").expect("DANEO_MODEL_PATH"));
    let translator = Arc::new(LocalTranslator::new(model));
    let mut output = BufWriter::new(File::create(output_path).unwrap());
    let sequence = std::iter::once((
        "warmup".to_string(),
        "Hello.".to_string(),
        "en-to-ko".to_string(),
    ))
    .chain(items.iter().map(|item| {
        (
            item["id"].as_str().unwrap().to_string(),
            item["input"].as_str().unwrap().to_string(),
            item["direction"].as_str().unwrap().to_string(),
        )
    }));
    for (id, input, direction) in sequence {
        let start = Instant::now();
        let request = translator
            .reserve(id.clone(), input.clone(), direction.clone())
            .unwrap();
        let ready_ms = Cell::new(None);
        let first_token_ms = Cell::new(None);
        let outcome = request.run(|event| {
            if event.state == Phase::Ready && ready_ms.get().is_none() {
                ready_ms.set(Some(start.elapsed().as_millis()));
            }
            if event.state == Phase::Generating
                && event.output_tokens == 1
                && first_token_ms.get().is_none()
            {
                first_token_ms.set(Some(start.elapsed().as_millis()));
            }
        });
        writeln!(output, "{}", json!({"id":id,"input":input,"direction":direction,
            "readyMs":ready_ms.get(),"firstTokenMs":first_token_ms.get(),"completionMs":start.elapsed().as_millis(),
            "outcome":outcome})).unwrap();
        output.flush().unwrap();
    }
    let id = "cancel-demo";
    let request = translator
        .reserve(id.into(), "Hello.".into(), "en-to-ko".into())
        .unwrap();
    let cancel_ms = Cell::new(None);
    let outcome = request.run(|event| {
        if event.state == Phase::Generating && event.output_tokens == 1 && cancel_ms.get().is_none()
        {
            let start = Instant::now();
            translator.cancel(id);
            cancel_ms.set(Some(start.elapsed().as_millis()));
        }
    });
    writeln!(
        output,
        "{}",
        json!({"id":id,"cancelMs":cancel_ms.get(),"outcome":outcome})
    )
    .unwrap();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::verify_probe_identity;

    #[test]
    fn matching_prompt_and_fixture_are_accepted() {
        assert!(verify_probe_identity("prompt", "prompt", "reference/eval/v1.json", "set", "reference/eval/v1.json", "set").is_ok());
    }

    #[test]
    fn stale_embedded_prompt_is_rejected() {
        let error = verify_probe_identity("stale", "current", "reference/eval/v1.json", "set", "reference/eval/v1.json", "set").unwrap_err();
        assert!(error.contains("prompt"));
    }

    #[test]
    fn mismatched_fixture_hash_is_rejected() {
        let error = verify_probe_identity("prompt", "prompt", "reference/eval/v1.json", "wrong", "reference/eval/v1.json", "set").unwrap_err();
        assert!(error.contains("fixture"));
    }
}
