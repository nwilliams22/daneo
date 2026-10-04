use super::*;
use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, LlamaModel},
    sampling::LlamaSampler,
};
use sha2::{Digest, Sha256};
use std::{
    fs::File,
    io::{BufReader, Read},
    num::NonZeroU32,
    path::Path,
};

use crate::model_artifact::{MODEL_BYTES, MODEL_SHA256};
const CONTEXT_TOKENS: u32 = 4096;
const OUTPUT_TOKENS: usize = 1024;

#[cfg(feature = "acceptance")]
fn retain_raw(request: &Request, text: &str, complete: bool) {
    use std::io::Write;
    if let Some(path) = std::env::var_os("DANEO_ACCEPTANCE_RAW") {
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .expect("open acceptance raw output");
        writeln!(
            file,
            "{}",
            serde_json::json!({
                "requestId": request.request_id, "rawReply": text, "complete": complete
            })
        )
        .expect("retain acceptance raw output");
    }
}

fn corrupt() -> TranslateError {
    TranslateError::new(
        ErrorCode::ModelCorrupt,
        "Model is unreadable or does not match the pinned artifact.",
    )
}
fn allocation() -> TranslateError {
    TranslateError::new(
        ErrorCode::AllocationFailed,
        "Could not allocate the local inference context.",
    )
}

fn verify(
    path: &Path,
    bytes: u64,
    digest: &str,
    check: impl Fn() -> Result<(), TranslateError>,
) -> Result<(), TranslateError> {
    check()?;
    let file = File::open(path).map_err(|error| {
        if error.kind() == std::io::ErrorKind::NotFound {
            TranslateError::new(ErrorCode::ModelMissing, "The local model file is missing.")
        } else {
            corrupt()
        }
    })?;
    if file.metadata().map_err(|_| corrupt())?.len() != bytes {
        return Err(corrupt());
    }
    let mut reader = BufReader::new(file);
    let mut hash = Sha256::new();
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        check()?;
        let count = reader.read(&mut buffer).map_err(|_| corrupt())?;
        if count == 0 {
            break;
        }
        hash.update(&buffer[..count]);
    }
    if format!("{:x}", hash.finalize()) != digest {
        return Err(corrupt());
    }
    check()
}

fn context_result<T, E>(result: Result<T, E>) -> Result<T, TranslateError> {
    result.map_err(|_| allocation())
}
fn decode_result<T, E>(result: Result<T, E>) -> Result<T, TranslateError> {
    result.map_err(|_| TranslateError::generation())
}

pub(super) fn generate(
    request: &Request,
    emit: &dyn Fn(Progress),
    fail_allocation: bool,
) -> Result<Value, TranslateError> {
    verify(&request.owner.path, MODEL_BYTES, MODEL_SHA256, || {
        request.check()
    })?;
    let backend = LlamaBackend::init().map_err(|_| TranslateError::generation())?;
    let model = LlamaModel::load_from_file(
        &backend,
        &request.owner.path,
        &LlamaModelParams::default()
            .with_n_gpu_layers(0)
            .with_use_mmap(false),
    )
    .map_err(|_| corrupt())?;
    request.progress(Phase::Ready, 0, emit)?;
    let contract: String =
        serde_json::from_str(include_str!("../../../src/lib/translation-prompt.json"))
            .map_err(|_| TranslateError::generation())?;
    let instruction = contract
        .replace("{{DIRECTION}}", &request.direction)
        .replacen("{{INPUT}}", &request.input, 1);
    let template = model
        .chat_template(None)
        .map_err(|_| TranslateError::generation())?;
    let mut environment = minijinja::Environment::new();
    environment.set_unknown_method_callback(minijinja_contrib::pycompat::unknown_method_callback);
    environment.add_function(
        "raise_exception",
        |message: String| -> Result<String, minijinja::Error> {
            Err(minijinja::Error::new(
                minijinja::ErrorKind::InvalidOperation,
                message,
            ))
        },
    );
    environment
        .add_template(
            "chat",
            template
                .to_str()
                .map_err(|_| TranslateError::generation())?,
        )
        .map_err(|_| TranslateError::generation())?;
    let prompt = environment
        .get_template("chat")
        .and_then(|template| {
            template.render(minijinja::context! {
                messages => vec![serde_json::json!({"role": "user", "content": instruction})],
                add_generation_prompt => true, enable_thinking => false,
            })
        })
        .map_err(|_| TranslateError::generation())?;
    if !prompt.ends_with("<|im_start|>assistant\n<think>\n\n</think>\n\n") {
        return Err(TranslateError::generation());
    }
    let vocab = model.vocab();
    let tokens = vocab.tokenize(prompt.as_bytes(), false, true);
    if tokens.is_empty() || tokens.len() + OUTPUT_TOKENS > CONTEXT_TOKENS as usize {
        return Err(TranslateError::new(
            ErrorCode::InvalidInput,
            "Input exceeds the local context allowance.",
        ));
    }
    request.check()?;
    // Only tests supply true; no environment flag or IPC fault-injection surface.
    if fail_allocation {
        return context_result::<Value, ()>(Err(()));
    }
    let mut context = context_result(
        model.new_context(
            &backend,
            LlamaContextParams::default()
                .with_n_ctx(NonZeroU32::new(CONTEXT_TOKENS))
                .with_n_batch(CONTEXT_TOKENS)
                // Bounded prompt chunks provide cancellation checkpoints during prefill.
                .with_n_ubatch(256)
                .with_n_threads(8)
                .with_n_threads_batch(8),
        ),
    )?;
    let mut batch = LlamaBatch::new(256, 1);
    request.progress(Phase::Generating, 0, emit)?;
    for (chunk_index, chunk) in tokens.chunks(256).enumerate() {
        request.check()?;
        batch.clear();
        for (index, token) in chunk.iter().enumerate() {
            let position = chunk_index * 256 + index;
            decode_result(batch.add(*token, position as i32, &[0], position == tokens.len() - 1))?;
        }
        decode_result(context.decode(&mut batch))?;
    }
    let mut sampler = LlamaSampler::greedy();
    let mut output = Vec::new();
    output
        .try_reserve(OUTPUT_TOKENS)
        .map_err(|_| allocation())?;
    for position in tokens.len()..tokens.len() + OUTPUT_TOKENS {
        request.check()?;
        let token = sampler.sample(&context, -1);
        sampler.accept(token);
        if vocab.is_eog(token) {
            let text = String::from_utf8(vocab.detokenize(&output, false, true))
                .map_err(|_| TranslateError::generation())?;
            #[cfg(feature = "acceptance")]
            retain_raw(request, &text, true);
            // Match the shared parser's fence tolerance; zod validates at the client boundary.
            return serde_json::from_str::<Value>(
                text.replace("```json", "").replace("```", "").trim(),
            )
            .map(|mut result| {
                if let Some(object) = result.as_object_mut() {
                    object.insert("direction".into(), request.direction.clone().into());
                }
                result
            })
            .map_err(|_| {
                TranslateError::new(ErrorCode::BadJson, "The model reply was not valid JSON.")
            });
        }
        output.push(token);
        request.progress(Phase::Generating, output.len(), emit)?;
        batch.clear();
        decode_result(batch.add(token, position as i32, &[0], true))?;
        decode_result(context.decode(&mut batch))?;
    }
    #[cfg(feature = "acceptance")]
    retain_raw(
        request,
        &String::from_utf8_lossy(vocab.detokenize(&output, false, true).as_slice()),
        false,
    );
    Err(TranslateError::new(
        ErrorCode::GenerationFailed,
        "Local output reached the token limit before completion.",
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn missing_and_corrupt_files_are_typed() {
        let path = std::env::temp_dir().join(format!("daneo-model-test-{}", std::process::id()));
        let _ = std::fs::remove_file(&path);
        assert_eq!(
            verify(&path, 4, "wrong", || Ok(())).unwrap_err().code,
            ErrorCode::ModelMissing
        );
        std::fs::write(&path, b"bad").unwrap();
        assert_eq!(
            verify(&path, 4, "wrong", || Ok(())).unwrap_err().code,
            ErrorCode::ModelCorrupt
        );
        std::fs::write(&path, b"bad!").unwrap();
        assert_eq!(
            verify(&path, 4, "wrong", || Ok(())).unwrap_err().code,
            ErrorCode::ModelCorrupt
        );
        std::fs::remove_file(path).unwrap();
    }
    #[test]
    fn controlled_allocation_and_decode_failure_are_typed() {
        assert_eq!(
            context_result::<(), _>(Err("injected allocation failure"))
                .unwrap_err()
                .code,
            ErrorCode::AllocationFailed
        );
        assert_eq!(
            decode_result::<(), _>(Err("injected decode failure"))
                .unwrap_err()
                .code,
            ErrorCode::GenerationFailed
        );
    }
}
