//! Serialized in-process inference. Only final JSON crosses the result boundary;
//! the frontend applies translationResultSchema before exposing a result.
use serde::Serialize;
use serde_json::Value;
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex, MutexGuard,
    },
    time::{Duration, Instant},
};

mod native;
#[cfg(feature = "acceptance")]
pub fn acceptance_prompt_sha256() -> String {
    native::acceptance_prompt_sha256()
}
#[cfg(test)]
mod tests;

#[derive(Clone, Debug, Serialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ErrorCode {
    ModelMissing,
    ModelCorrupt,
    AllocationFailed,
    GenerationFailed,
    Cancelled,
    InvalidInput,
    Busy,
    BadJson,
}
#[derive(Clone, Debug, Serialize)]
pub struct TranslateError {
    pub code: ErrorCode,
    pub message: String,
}
impl TranslateError {
    fn new(code: ErrorCode, message: &str) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
    fn cancelled() -> Self {
        Self::new(ErrorCode::Cancelled, "Translation cancelled.")
    }
    fn generation() -> Self {
        Self::new(ErrorCode::GenerationFailed, "Local generation failed.")
    }
}

// Same {ok,result}/{ok,error:{code,message}} envelope as TranslateOutcome.
// Value is deliberately not a second hand-maintained translation schema.
#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum Outcome {
    Success { ok: bool, result: Value },
    Failure { ok: bool, error: TranslateError },
}
impl From<Result<Value, TranslateError>> for Outcome {
    fn from(result: Result<Value, TranslateError>) -> Self {
        match result {
            Ok(result) => Self::Success { ok: true, result },
            Err(error) => Self::Failure { ok: false, error },
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    Absent,
    Loading,
    Ready,
    Generating,
    Error,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub request_id: String,
    pub state: Phase,
    pub output_tokens: usize,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub state: Phase,
    pub request_id: Option<String>,
    pub error: Option<TranslateError>,
    pub resident: bool,
}

// Recover bookkeeping after an unwound worker. No poisoned-lock panic at IPC.
fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(|poison| poison.into_inner())
}

pub struct LocalTranslator {
    path: PathBuf,
    serial: Mutex<()>,
    loaded: Mutex<Option<native::Loaded>>,
    is_resident: AtomicBool,
    idle_seconds: AtomicU64,
    last_used: Mutex<Instant>,
    verified: AtomicBool,
    pending: Mutex<HashMap<String, Arc<AtomicBool>>>,
    snapshot: Mutex<Snapshot>,
}
impl LocalTranslator {
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            serial: Mutex::new(()),
            loaded: Mutex::new(None),
            is_resident: AtomicBool::new(false),
            idle_seconds: AtomicU64::new(300),
            last_used: Mutex::new(Instant::now()),
            verified: AtomicBool::new(false),
            pending: Mutex::new(HashMap::new()),
            snapshot: Mutex::new(Snapshot {
                state: Phase::Absent,
                request_id: None,
                error: None,
                resident: false,
            }),
        }
    }
    pub fn snapshot(&self) -> Snapshot {
        let mut snapshot = lock(&self.snapshot).clone();
        snapshot.resident = self.is_resident.load(Ordering::SeqCst);
        snapshot
    }
    pub fn set_idle_seconds(&self, seconds: u64) -> Result<(), TranslateError> {
        if !(30..=3600).contains(&seconds) {
            return Err(TranslateError::new(
                ErrorCode::InvalidInput,
                "Choose 30–3600 seconds.",
            ));
        }
        self.idle_seconds.store(seconds, Ordering::SeqCst);
        Ok(())
    }
    pub fn unload_if_idle(&self) -> bool {
        let Ok(_serial) = self.serial.try_lock() else {
            return false;
        };
        if !lock(&self.pending).is_empty()
            || lock(&self.last_used).elapsed()
                < Duration::from_secs(self.idle_seconds.load(Ordering::SeqCst))
        {
            return false;
        }
        let unloaded = lock(&self.loaded).take().is_some();
        if unloaded {
            self.is_resident.store(false, Ordering::SeqCst);
            // The verified file is still available; the next request enters Loading.
            let mut snapshot = lock(&self.snapshot);
            snapshot.resident = false;
        }
        unloaded
    }
    pub fn with_unloaded<T>(&self, operation: impl FnOnce() -> T) -> T {
        let _serial = lock(&self.serial);
        lock(&self.loaded).take();
        self.is_resident.store(false, Ordering::SeqCst);
        let mut snapshot = lock(&self.snapshot);
        *snapshot = Snapshot {
            state: Phase::Absent,
            request_id: None,
            error: None,
            resident: false,
        };
        drop(snapshot);
        operation()
    }
    pub fn cancel(&self, request_id: &str) -> bool {
        let pending = lock(&self.pending);
        if let Some(cancelled) = pending.get(request_id) {
            cancelled.store(true, Ordering::SeqCst);
            true
        } else {
            false
        }
    }
    pub fn reserve(
        self: &Arc<Self>,
        request_id: String,
        input: String,
        direction: String,
    ) -> Result<Request, TranslateError> {
        if request_id.is_empty()
            || request_id.len() > 128
            || input.trim().is_empty()
            || input.len() > 4096
            || !matches!(direction.as_str(), "en-to-ko" | "ko-to-en" | "tutor")
        {
            return Err(TranslateError::new(
                ErrorCode::InvalidInput,
                "Use a unique request ID and 1–4096 bytes of input.",
            ));
        }
        let mut pending = lock(&self.pending);
        if pending.contains_key(&request_id) || pending.len() >= 8 {
            return Err(TranslateError::new(
                ErrorCode::Busy,
                "Request ID is active or the local queue is full.",
            ));
        }
        let cancelled = Arc::new(AtomicBool::new(false));
        pending.insert(request_id.clone(), cancelled.clone());
        Ok(Request {
            owner: self.clone(),
            request_id,
            input,
            direction,
            cancelled,
        })
    }
}

pub struct Request {
    owner: Arc<LocalTranslator>,
    request_id: String,
    input: String,
    direction: String,
    cancelled: Arc<AtomicBool>,
}
impl Drop for Request {
    fn drop(&mut self) {
        let mut pending = lock(&self.owner.pending);
        if pending
            .get(&self.request_id)
            .is_some_and(|flag| Arc::ptr_eq(flag, &self.cancelled))
        {
            pending.remove(&self.request_id);
        }
    }
}
impl Request {
    fn check(&self) -> Result<(), TranslateError> {
        if self.cancelled.load(Ordering::SeqCst) {
            Err(TranslateError::cancelled())
        } else {
            Ok(())
        }
    }
    fn progress(
        &self,
        state: Phase,
        output_tokens: usize,
        emit: &dyn Fn(Progress),
    ) -> Result<(), TranslateError> {
        self.check()?;
        if state == Phase::Loading {
            self.owner.verified.store(false, Ordering::SeqCst);
        }
        if state == Phase::Ready {
            self.owner.verified.store(true, Ordering::SeqCst);
        }
        *lock(&self.owner.snapshot) = Snapshot {
            state,
            request_id: Some(self.request_id.clone()),
            error: None,
            resident: self.owner.is_resident.load(Ordering::SeqCst),
        };
        emit(Progress {
            request_id: self.request_id.clone(),
            state,
            output_tokens,
        });
        self.check()
    }
    pub fn run(self, emit: impl Fn(Progress)) -> Outcome {
        self.run_with(&emit, |request, emit| {
            native::generate(request, emit, false)
        })
    }
    fn run_with(
        self,
        emit: &dyn Fn(Progress),
        generate: impl FnOnce(&Request, &dyn Fn(Progress)) -> Result<Value, TranslateError>,
    ) -> Outcome {
        // The entire model/backend/context lifetime is inside this guard.
        let _serial = lock(&self.owner.serial);
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            self.check()?;
            self.progress(Phase::Loading, 0, emit)?;
            let value = generate(&self, emit)?;
            self.check()?;
            Ok(value)
        }))
        .unwrap_or_else(|_| Err(TranslateError::generation()));
        // Linearize completion with cancel; once removed, cancellation is too late.
        let mut pending = lock(&self.owner.pending);
        let result = if self.cancelled.load(Ordering::SeqCst) {
            Err(TranslateError::cancelled())
        } else {
            result
        };
        if result.is_err() {
            lock(&self.owner.loaded).take();
            self.owner.is_resident.store(false, Ordering::SeqCst);
        }
        pending.remove(&self.request_id);
        let (state, error) = match &result {
            Ok(_) => (Phase::Ready, None),
            Err(error) if error.code == ErrorCode::Cancelled => (
                if self.owner.verified.load(Ordering::SeqCst) {
                    Phase::Ready
                } else {
                    Phase::Absent
                },
                None,
            ),
            Err(error) if error.code == ErrorCode::ModelMissing => {
                (Phase::Absent, Some(error.clone()))
            }
            Err(error) => (Phase::Error, Some(error.clone())),
        };
        *lock(&self.owner.snapshot) = Snapshot {
            state,
            request_id: None,
            error,
            resident: self.owner.is_resident.load(Ordering::SeqCst),
        };
        *lock(&self.owner.last_used) = Instant::now();
        // No terminal events: command replies are the only completion mechanism.
        result.into()
    }
}

#[tauri::command]
pub async fn translate_local<R: tauri::Runtime>(
    request_id: String,
    input: String,
    direction: String,
    app: tauri::AppHandle<R>,
    translator: tauri::State<'_, Arc<LocalTranslator>>,
) -> Result<Outcome, ()> {
    use tauri::Emitter;
    let request = match translator.reserve(request_id, input, direction) {
        Ok(request) => request,
        Err(error) => return Ok(Err(error).into()),
    };
    match tauri::async_runtime::spawn_blocking(move || {
        request.run(|event| {
            let _ = app.emit("local-translation-progress", event);
        })
    })
    .await
    {
        Ok(outcome) => Ok(outcome),
        Err(_) => Ok(Err(TranslateError::generation()).into()),
    }
}
#[tauri::command]
pub async fn ask_tutor_local<R: tauri::Runtime>(
    request_id: String,
    input: String,
    app: tauri::AppHandle<R>,
    translator: tauri::State<'_, Arc<LocalTranslator>>,
) -> Result<Outcome, ()> {
    use tauri::Emitter;
    let request = match translator.reserve(request_id, input, "tutor".into()) {
        Ok(request) => request,
        Err(error) => return Ok(Err(error).into()),
    };
    match tauri::async_runtime::spawn_blocking(move || {
        request.run(|event| {
            let _ = app.emit("local-translation-progress", event);
        })
    })
    .await
    {
        Ok(outcome) => Ok(outcome),
        Err(_) => Ok(Err(TranslateError::generation()).into()),
    }
}
#[tauri::command]
pub fn cancel_local(
    request_id: String,
    translator: tauri::State<'_, Arc<LocalTranslator>>,
) -> bool {
    translator.cancel(&request_id)
}
#[tauri::command]
pub fn local_translation_state(translator: tauri::State<'_, Arc<LocalTranslator>>) -> Snapshot {
    translator.snapshot()
}
#[tauri::command]
pub fn set_model_idle_seconds(
    seconds: u64,
    translator: tauri::State<'_, Arc<LocalTranslator>>,
) -> Result<(), String> {
    translator
        .set_idle_seconds(seconds)
        .map_err(|error| error.message)
}
