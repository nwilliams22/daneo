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
pub(super) fn acceptance_prompt_sha256() -> String {
    format!("{:x}", Sha256::digest(include_bytes!("../../../src/lib/translation-prompt.json")))
}

pub(super) struct Loaded {
    model: LlamaModel,
    backend: LlamaBackend,
}

#[cfg(feature = "acceptance")]
fn retain_raw(request: &Request, text: &str, complete: bool, prompt: &str) {
    use std::io::Write;
    if let Some(path) = std::env::var_os("DANEO_ACCEPTANCE_RAW") {
        let (model_bytes, model_sha256) = artifact_identity().expect("verified acceptance identity");
        let provenance = serde_json::json!({
            "renderedPromptSha256": format!("{:x}", Sha256::digest(prompt.as_bytes())),
            "modelBytes": model_bytes,
            "modelSha256": model_sha256,
            "head": std::env::var("DANEO_ACCEPTANCE_HEAD").expect("acceptance HEAD"),
            "promptSha256": std::env::var("DANEO_ACCEPTANCE_PROMPT_SHA256").expect("acceptance prompt hash"),
            "rubricSha256": std::env::var("DANEO_ACCEPTANCE_RUBRIC_SHA256").expect("acceptance rubric hash"),
            "itemSetSha256": std::env::var("DANEO_ACCEPTANCE_SET_SHA256").expect("acceptance set hash"),
            "itemSetPath": std::env::var("DANEO_ACCEPTANCE_SET_PATH").expect("acceptance set path"),
        });
        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .expect("open acceptance raw output");
        writeln!(
            file,
            "{}",
            serde_json::json!({
                "requestId": request.request_id, "rawReply": text, "complete": complete,
                "provenance": provenance
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

#[cfg(feature = "acceptance")]
fn probe_identity(bytes: Option<&str>, digest: Option<&str>) -> Result<(u64, String), TranslateError> {
    match (bytes, digest) {
        (None, None) => Ok((MODEL_BYTES, MODEL_SHA256.into())),
        (Some(bytes), Some(digest)) => {
            let bytes = bytes.parse::<u64>().map_err(|_| corrupt())?;
            if bytes == 0 || digest.len() != 64 || !digest.bytes().all(|b| b.is_ascii_hexdigit()) {
                return Err(corrupt());
            }
            Ok((bytes, digest.to_ascii_lowercase()))
        }
        _ => Err(corrupt()),
    }
}

fn artifact_identity() -> Result<(u64, String), TranslateError> {
    #[cfg(feature = "acceptance")]
    {
        let bytes = std::env::var_os("DANEO_ACCEPTANCE_MODEL_BYTES");
        let digest = std::env::var_os("DANEO_ACCEPTANCE_MODEL_SHA256");
        probe_identity(
            bytes.as_ref().map(|v| v.to_str().unwrap_or("")),
            digest.as_ref().map(|v| v.to_str().unwrap_or("")),
        )
    }
    #[cfg(not(feature = "acceptance"))]
    Ok((MODEL_BYTES, MODEL_SHA256.into()))
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

// Validate the rendered contract without selecting vendors or generation-prefix spellings.
fn render_chat_prompt(template: &str, instruction: &str, bos_token: &str, eos_token: &str) -> Result<String, TranslateError> {
    let messages = vec![serde_json::json!({"role": "user", "content": instruction})];
    let mut environment = minijinja::Environment::new();
    environment.set_trim_blocks(true);
    environment.set_lstrip_blocks(true);
    // Match Jinja's iterable test: None is not an iterable tools collection.
    environment.add_test("iterable", |value: minijinja::Value| {
        !value.is_none() && !value.is_undefined() && value.try_iter().is_ok()
    });
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
            template,
        )
        .map_err(|_| TranslateError::generation())?;
    let prompt = environment
        .get_template("chat")
        .and_then(|template| {
            template.render(minijinja::context! {
                messages => messages,
                bos_token => bos_token, eos_token => eos_token, tools => serde_json::Value::Null,
                add_generation_prompt => true, enable_thinking => false,
            })
        })
        .map_err(|_| TranslateError::generation())?;
    let input_end = prompt.rfind(instruction)
        .filter(|_| !instruction.is_empty())
        .map(|start| start + instruction.len())
        .ok_or_else(TranslateError::generation)?;
    // Only inspect the template's continuation, not literal text inside the request.
    let continuation = &prompt[input_end..];
    for (open, close) in [("<think>", "</think>"), ("<analysis>", "</analysis>")] {
        if continuation.rfind(open).is_some_and(|start| {
            continuation.rfind(close).map_or(true, |end| end < start)
        }) {
            return Err(TranslateError::generation());
        }
    }
    Ok(prompt)
}

pub(super) fn generate(
    request: &Request,
    emit: &dyn Fn(Progress),
    fail_allocation: bool,
) -> Result<Value, TranslateError> {
    let mut resident = lock(&request.owner.loaded);
    if resident.is_none() {
        let (bytes, digest) = artifact_identity()?;
        verify(&request.owner.path, bytes, &digest, || {
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
        *resident = Some(Loaded { backend, model });
        request.owner.is_resident.store(true, Ordering::SeqCst);
    }
    let loaded = resident.as_ref().expect("model loaded");
    let backend = &loaded.backend;
    let model = &loaded.model;
    request.progress(Phase::Ready, 0, emit)?;
    let instruction = if request.direction == "tutor" {
        format!("You are Daneo's local study tutor. Use only the supplied learner context and curriculum references. Answer in English. If the answer is not supported, say you cannot establish it from the lessons. Do not invent Korean examples. Return only JSON: {{\"answer\":\"brief English explanation\",\"sentenceIds\":[\"up to three IDs from supplied sentences\"]}}. Learner request and context: {}", request.input)
    } else {
        let contract: String =
            serde_json::from_str(include_str!("../../../src/lib/translation-prompt.json"))
                .map_err(|_| TranslateError::generation())?;
        contract
            .replace("{{DIRECTION}}", &request.direction)
            .replacen("{{INPUT}}", &request.input, 1)
    };
    let template = model
        .chat_template(None)
        .map_err(|_| TranslateError::generation())?;
    let vocab = model.vocab();
    let template = template.to_str().map_err(|_| TranslateError::generation())?;
    let special_text = |token: llama_cpp_2::token::LlamaToken| {
        if token.0 < 0 {
            Ok(String::new())
        } else {
            String::from_utf8(vocab.token_to_piece(token, true, None))
                .map_err(|_| TranslateError::generation())
        }
    };
    let prompt = render_chat_prompt(template, &instruction,
        &special_text(vocab.bos())?, &special_text(vocab.eos())?)?;
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
            backend,
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
            retain_raw(request, &text, true, &prompt);
            // Match the shared parser's fence tolerance; zod validates at the client boundary.
            return serde_json::from_str::<Value>(
                text.replace("```json", "").replace("```", "").trim(),
            )
            .map(|mut result| {
                if request.direction != "tutor" {
                    if let Some(object) = result.as_object_mut() {
                        object.insert("direction".into(), request.direction.clone().into());
                    }
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
        &prompt,
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
    fn publisher_templates_render_nonthinking_generation_prefixes() {
        let midm = include_str!("../../../reference/eval/fixtures/v3-midm-chat-template.jinja");
        let ax = include_str!("../../../reference/eval/fixtures/v3-ax-chat-template.jinja");
        let prompt = render_chat_prompt(midm, "Translate this.", "<|begin_of_text|>", "<|end_of_text|>").unwrap();
        assert!(prompt.starts_with("<|begin_of_text|>"));
        assert!(prompt.contains("<|start_header_id|>user<|end_header_id|>\n\nTranslate this.<|eot_id|>"));
        assert!(prompt.ends_with("<|start_header_id|>assistant<|end_header_id|>\n\n"));
        let prompt = render_chat_prompt(ax, "Translate this.", "<|endoftext|>", "<|im_end|>").unwrap();
        assert_eq!(prompt, "<|im_start|><|user|>Translate this.<|im_end|><|im_start|><|assistant|>");
    }
    #[test]
    fn template_contract_accepts_new_prefixes_but_rejects_open_thinking() {
        let prefix = "{{ messages[0].content }}";
        let closed = "<|im_start|>assistant\n<think>\n\n</think>\n\n";
        let template = format!("{prefix}{{{{ {} }}}}", serde_json::to_string(closed).unwrap());
        assert!(render_chat_prompt(&template, "Input", "", "").unwrap().ends_with(closed));
        let third = "{{ bos_token }}[USER]{{ messages[0].content }}[/USER][BOT]";
        assert_eq!(render_chat_prompt(third, "Input", "<bos>", "<eos>").unwrap(),
                   "<bos>[USER]Input[/USER][BOT]");
        for tail in ["<think>", "<analysis>", "<think></think><think>"] {
            assert!(render_chat_prompt(&format!("{prefix}{tail}"), "Input", "", "").is_err());
        }
        for bad in ["", "template discarded the user request"] {
            assert!(render_chat_prompt(bad, "Input", "", "").is_err());
        }
        assert!(render_chat_prompt(third, "A literal <think> tag", "", "").is_ok());
    }
    #[test]
    fn generic_renderer_preserves_every_recorded_screen_prompt() {
        let fixture: Value = serde_json::from_str(include_str!("../../../reference/eval/v3-dev-set.json")).unwrap();
        let contract: String = serde_json::from_str(include_str!("../../../src/lib/translation-prompt.json")).unwrap();
        for (template, raw, bos, eos) in [
            (include_str!("../../../reference/eval/fixtures/v3-midm-chat-template.jinja"),
             include_str!("../../../reference/eval/raw/v3-midm-raw.jsonl"), "<|begin_of_text|>", "<|end_of_text|>"),
            (include_str!("../../../reference/eval/fixtures/v3-ax-chat-template.jinja"),
             include_str!("../../../reference/eval/raw/v3-ax-raw.jsonl"), "<|endoftext|>", "<|im_end|>"),
        ] {
            for line in raw.lines() {
                let row: Value = serde_json::from_str(line).unwrap();
                let (input, direction) = if row["requestId"] == "warmup" {
                    ("Hello.", "en-to-ko")
                } else {
                    let item = fixture["items"].as_array().unwrap().iter()
                        .find(|item| item["id"] == row["requestId"]).unwrap();
                    (item["input"].as_str().unwrap(), item["direction"].as_str().unwrap())
                };
                let instruction = contract.replace("{{DIRECTION}}", direction).replacen("{{INPUT}}", input, 1);
                let prompt = render_chat_prompt(template, &instruction, bos, eos).unwrap();
                assert_eq!(format!("{:x}", Sha256::digest(prompt.as_bytes())),
                           row["provenance"]["renderedPromptSha256"].as_str().unwrap(), "{}", row["requestId"]);
            }
        }
    }
    #[cfg(feature = "acceptance")]
    #[test]
    fn acceptance_identity_requires_a_complete_valid_pair() {
        assert_eq!(probe_identity(None, None).unwrap(), (MODEL_BYTES, MODEL_SHA256.into()));
        assert_eq!(probe_identity(Some("4"), Some(MODEL_SHA256)).unwrap().0, 4);
        for (bytes, hash) in [
            (Some("4"), None), (None, Some(MODEL_SHA256)),
            (Some("0"), Some(MODEL_SHA256)), (Some("bad"), Some(MODEL_SHA256)),
            (Some("4"), Some("bad")), (Some("4"), Some("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")),
        ] {
            assert_eq!(probe_identity(bytes, hash).unwrap_err().code, ErrorCode::ModelCorrupt);
        }
    }
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
