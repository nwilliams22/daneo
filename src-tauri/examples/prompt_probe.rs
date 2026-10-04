//! Opt-in local prompt evaluation without a display server. Inputs are selected by fixture path.
use app_lib::local_translation::{LocalTranslator, Phase};
use serde_json::{json, Value};
use std::{
    cell::Cell,
    fs::File,
    io::{BufWriter, Write},
    path::PathBuf,
    sync::Arc,
    time::Instant,
};

fn main() {
    let fixture_path = std::env::args().nth(1).expect("fixture path");
    let output_path = std::env::args().nth(2).expect("output path");
    let fixture: Value = serde_json::from_reader(File::open(fixture_path).unwrap()).unwrap();
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
}
