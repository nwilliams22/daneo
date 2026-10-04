//! CPU-only compatibility gate; provision weights manually, then set DANEO_MODEL_PATH.
//! Run with `cargo run --locked --release --example verified_completion`.
use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, LlamaModel},
    sampling::LlamaSampler,
};
use sha2::{Digest, Sha256};
use std::{
    error::Error,
    fs::File,
    io::{BufReader, Read},
    num::NonZeroU32,
    time::Instant,
};

const MODEL_REPOSITORY: &str = "unsloth/Qwen3.5-4B-GGUF";
const MODEL_REVISION: &str = "e87f176479d0855a907a41277aca2f8ee7a09523";
const MODEL_FILENAME: &str = "Qwen3.5-4B-Q4_K_M.gguf";
const MODEL_BYTES: u64 = 2_740_937_888;
const MODEL_SHA256: &str = "00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4";
// Published llama-cpp-sys-2 0.1.158, wrapper commit 3b17d1f160f0e9cfcf95948954cefc967f8f92f2.
const LLAMA_CPP_REVISION: &str = "26394b4e6749a41c3633db040e0987500a5f7013";
// Spike settings, not qualified product limits.
const CONTEXT_TOKENS: u32 = 4096;
const OUTPUT_TOKENS: usize = 1024;

fn main() -> Result<(), Box<dyn Error>> {
    let path = std::env::var_os("DANEO_MODEL_PATH")
        .ok_or("set DANEO_MODEL_PATH to the manually provisioned GGUF")?;
    let verification_start = Instant::now();
    let file = File::open(&path)?;
    if file.metadata()?.len() != MODEL_BYTES {
        return Err("model byte count does not match the pinned artifact".into());
    }
    let mut reader = BufReader::new(file);
    let mut hash = Sha256::new();
    let mut buffer = [0_u8; 1024 * 1024];
    loop {
        let count = reader.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        hash.update(&buffer[..count]);
    }
    let digest = format!("{:x}", hash.finalize());
    if digest != MODEL_SHA256 {
        return Err("model SHA-256 does not match the pinned artifact".into());
    }
    println!("verified: {MODEL_REPOSITORY}@{MODEL_REVISION}/{MODEL_FILENAME} bytes={MODEL_BYTES} sha256={digest}");
    println!(
        "verification_seconds={:.3}",
        verification_start.elapsed().as_secs_f64()
    );
    println!("llama-cpp-2=0.1.158 llama.cpp={LLAMA_CPP_REVISION} backend=CPU threads=8");

    let backend = LlamaBackend::init()?;
    // Eager loading makes load time include weights, rather than deferring page faults to decode.
    // This is a fresh-process load; the hash pass has warmed the OS file cache.
    let load_start = Instant::now();
    let model = LlamaModel::load_from_file(
        &backend,
        &path,
        &LlamaModelParams::default()
            .with_n_gpu_layers(0)
            .with_use_mmap(false),
    )?;
    println!(
        "cold_process_load_seconds={:.3} file_cache=warm_after_hash mmap=false",
        load_start.elapsed().as_secs_f64()
    );

    // The binding's legacy template API has no enable_thinking argument. Render the
    // actual embedded Jinja template, preserving its explicit non-thinking branch.
    let template = model.chat_template(None)?;
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
    environment.add_template("chat", template.to_str()?)?;
    let prompt = environment.get_template("chat")?.render(minijinja::context! {
        messages => vec![serde_json::json!({"role": "user", "content": "Translate the Korean word 물 into English. Reply with only the English word."})],
        add_generation_prompt => true,
        enable_thinking => false,
    })?;
    if !prompt.ends_with("<|im_start|>assistant\n<think>\n\n</think>\n\n") {
        return Err("embedded template did not emit the expected non-thinking prefix".into());
    }
    println!("template: enable_thinking=false; closed empty thinking prefix verified");
    let vocab = model.vocab();
    let tokens = vocab.tokenize(prompt.as_bytes(), false, true);
    if tokens.is_empty() || tokens.len() + OUTPUT_TOKENS > CONTEXT_TOKENS as usize {
        return Err("prompt cannot fit with the bounded output allowance".into());
    }
    let context_start = Instant::now();
    let mut context = model.new_context(
        &backend,
        LlamaContextParams::default()
            .with_n_ctx(NonZeroU32::new(CONTEXT_TOKENS))
            .with_n_batch(CONTEXT_TOKENS)
            .with_n_ubatch(CONTEXT_TOKENS)
            .with_n_threads(8)
            .with_n_threads_batch(8),
    )?;
    println!(
        "context_seconds={:.3} context_tokens={CONTEXT_TOKENS} output_cap={OUTPUT_TOKENS}",
        context_start.elapsed().as_secs_f64()
    );
    let mut batch = LlamaBatch::new(CONTEXT_TOKENS as usize, 1);
    batch.add_sequence(&tokens, 0, false)?;
    let generation_start = Instant::now();
    context.decode(&mut batch)?;
    let mut sampler = LlamaSampler::greedy();
    let mut output = Vec::new();
    let mut ended = false;
    for position in tokens.len()..tokens.len() + OUTPUT_TOKENS {
        let token = sampler.sample(&context, -1);
        sampler.accept(token);
        if vocab.is_eog(token) {
            ended = true;
            break;
        }
        output.push(token);
        batch.clear();
        batch.add(token, position.try_into()?, &[0], true)?;
        context.decode(&mut batch)?;
    }
    let completion = String::from_utf8(vocab.detokenize(&output, false, true))?;
    println!("completion={completion:?}");
    println!(
        "output_tokens={} generation_seconds={:.3} ended={ended}",
        output.len(),
        generation_start.elapsed().as_secs_f64()
    );
    if !ended {
        return Err("completion reached the output cap without end-of-generation".into());
    }
    if completion.trim().is_empty()
        || completion.contains("<think>")
        || completion.contains("</think>")
    {
        return Err("empty completion or leaked thinking marker".into());
    }
    if completion.trim().to_lowercase() != "water" {
        return Err("smoke completion was not the expected single English word".into());
    }
    println!("PASS: verified in-process non-thinking completion");
    Ok(())
}
