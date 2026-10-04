//! Manifest-driven transport. A path is returned only after size and SHA-256 verification.
use fs2::FileExt;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::OpenOptions,
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tauri::{Emitter, Manager};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    sync::watch,
};

#[cfg(test)]
mod tests;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ModelPin {
    pub repo_id: String,
    pub revision: String,
    pub filename: String,
    pub bytes: u64,
    pub sha256: String,
}
impl ModelPin {
    fn validate(&self) -> Result<(), DownloadError> {
        let component = |s: &str| {
            !s.is_empty()
                && s != "."
                && s != ".."
                && s.bytes()
                    .all(|c| c.is_ascii_alphanumeric() || b"-_.".contains(&c))
        };
        if !self.repo_id.split('/').all(component)
            || !component(&self.filename)
            || self.bytes == 0
            || !hex(&self.revision, 40)
            || !hex(&self.sha256, 64)
        {
            return Err(error(
                Code::InvalidPin,
                "A complete immutable model pin is required.",
            ));
        }
        Ok(())
    }
    fn url(&self) -> String {
        format!(
            "https://huggingface.co/{}/resolve/{}/{}",
            self.repo_id, self.revision, self.filename
        )
    }
}
fn hex(s: &str, n: usize) -> bool {
    s.len() == n
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn production_pin() -> Result<ModelPin, DownloadError> {
    let manifest: serde_json::Value =
        serde_json::from_str(include_str!("../../reference/model-pin.json"))
            .map_err(|_| error(Code::InvalidPin, "Invalid model manifest."))?;
    parse_pin(manifest.get("pin").cloned().unwrap_or_default())
}
fn parse_pin(value: serde_json::Value) -> Result<ModelPin, DownloadError> {
    let pin: ModelPin = serde_json::from_value(value)
        .map_err(|_| error(Code::InvalidPin, "No complete model pin has been selected."))?;
    pin.validate()?;
    Ok(pin)
}
#[derive(Clone, Debug, Serialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum Code {
    InvalidPin,
    NoNetwork,
    HttpError,
    HashMismatch,
    DiskFull,
    PermissionDenied,
    Cancelled,
    Busy,
    IoError,
}
#[derive(Clone, Debug, Serialize)]
pub struct DownloadError {
    pub code: Code,
    pub message: String,
}
fn error(code: Code, message: &str) -> DownloadError {
    DownloadError {
        code,
        message: message.into(),
    }
}
fn io_error(e: std::io::Error) -> DownloadError {
    // ENOSPC/EDQUOT on Unix; ERROR_DISK_FULL/HANDLE_DISK_FULL on Windows.
    #[cfg(unix)]
    let full = matches!(e.raw_os_error(), Some(28) | Some(122) | Some(69));
    #[cfg(windows)]
    let full = matches!(e.raw_os_error(), Some(112) | Some(39));
    #[cfg(not(any(unix, windows)))]
    let full = false;
    if full {
        error(Code::DiskFull, "Not enough disk space for the model.")
    } else if e.kind() == std::io::ErrorKind::PermissionDenied {
        error(Code::PermissionDenied, "Cannot write model storage.")
    } else {
        error(Code::IoError, "Model storage operation failed.")
    }
}
fn network_error(_: reqwest::Error) -> DownloadError {
    error(
        Code::NoNetwork,
        "Model transfer failed. Check the connection and retry.",
    )
}
#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum Outcome<T: Serialize> {
    Success { ok: bool, result: T },
    Failure { ok: bool, error: DownloadError },
}
impl<T: Serialize> From<Result<T, DownloadError>> for Outcome<T> {
    fn from(r: Result<T, DownloadError>) -> Self {
        match r {
            Ok(result) => Self::Success { ok: true, result },
            Err(error) => Self::Failure { ok: false, error },
        }
    }
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub request_id: String,
    pub bytes: u64,
    pub total: u64,
    pub bytes_per_second: f64,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cache {
    pub path: Option<PathBuf>,
}

pub struct Downloader {
    root: PathBuf,
    active: Mutex<Option<(String, watch::Sender<bool>)>>,
}
impl Downloader {
    pub fn new(root: PathBuf) -> Self {
        Self {
            root,
            active: Mutex::new(None),
        }
    }
    pub fn cancel(&self, id: &str) -> bool {
        let active = self.active.lock().unwrap_or_else(|e| e.into_inner());
        active
            .as_ref()
            .is_some_and(|(request, sender)| request == id && sender.send(true).is_ok())
    }
    fn reserve(&self, id: &str) -> Result<Reservation<'_>, DownloadError> {
        if id.is_empty() || id.len() > 128 {
            return Err(error(Code::InvalidPin, "A request ID is required."));
        }
        let mut active = self.active.lock().unwrap_or_else(|e| e.into_inner());
        if active.is_some() {
            return Err(error(Code::Busy, "A model operation is already active."));
        }
        let (sender, receiver) = watch::channel(false);
        *active = Some((id.into(), sender));
        Ok(Reservation {
            owner: self,
            receiver,
        })
    }
    // The OS lock also protects separate app processes. Never unlink its inode.
    fn storage_lock(&self) -> Result<std::fs::File, DownloadError> {
        std::fs::create_dir_all(&self.root).map_err(io_error)?;
        let file = OpenOptions::new()
            .create(true)
            .truncate(false)
            .read(true)
            .write(true)
            .open(self.root.join("download.lock"))
            .map_err(io_error)?;
        file.try_lock_exclusive().map_err(|e| {
            if e.kind() == std::io::ErrorKind::WouldBlock {
                error(Code::Busy, "Another app process is using model storage.")
            } else {
                io_error(e)
            }
        })?;
        Ok(file)
    }
    fn remove_stale(&self) -> Result<(), DownloadError> {
        for entry in std::fs::read_dir(&self.root).map_err(io_error)? {
            let entry = entry.map_err(io_error)?;
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if name.strip_suffix(".part").is_some_and(|stem| hex(stem, 64)) {
                std::fs::remove_file(entry.path()).map_err(io_error)?;
            }
        }
        Ok(())
    }
    pub fn recover(&self) -> Result<(), DownloadError> {
        let _lock = self.storage_lock()?;
        self.remove_stale()
    }
    fn paths(&self, pin: &ModelPin) -> (PathBuf, PathBuf) {
        (
            self.root.join(format!("{}.gguf", pin.sha256)),
            self.root.join(format!("{}.part", pin.sha256)),
        )
    }
    async fn cached(
        &self,
        pin: &ModelPin,
        cancel: &mut watch::Receiver<bool>,
    ) -> Result<Option<PathBuf>, DownloadError> {
        let (path, _) = self.paths(pin);
        let mut file = match tokio::fs::File::open(&path).await {
            Ok(f) => f,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(io_error(e)),
        };
        let mut valid = file.metadata().await.map_err(io_error)?.len() == pin.bytes;
        if valid {
            let mut hash = Sha256::new();
            let mut buffer = vec![0; 64 * 1024];
            loop {
                check_cancel(cancel)?;
                let n = file.read(&mut buffer).await.map_err(io_error)?;
                if n == 0 {
                    break;
                }
                hash.update(&buffer[..n]);
            }
            valid = format!("{:x}", hash.finalize()) == pin.sha256;
        }
        drop(file);
        if valid {
            Ok(Some(path))
        } else {
            tokio::fs::remove_file(path).await.map_err(io_error)?;
            Ok(None)
        }
    }
    async fn inspect(&self, pin: Result<ModelPin, DownloadError>) -> Result<Cache, DownloadError> {
        let mut reservation = self.reserve("cache-inspection")?;
        let _lock = self.storage_lock()?;
        self.remove_stale()?;
        let pin = pin?;
        pin.validate()?;
        Ok(Cache {
            path: self.cached(&pin, &mut reservation.receiver).await?,
        })
    }
    async fn download(
        &self,
        id: &str,
        pin: Result<ModelPin, DownloadError>,
        emit: impl Fn(Progress),
        endpoint: Option<&str>,
        available: Option<u64>,
    ) -> Result<Cache, DownloadError> {
        // Validate before filesystem or network side effects; IPC never supplies a pin or URL.
        let pin = pin?;
        pin.validate()?;
        let mut reservation = self.reserve(id)?;
        let _lock = self.storage_lock()?;
        self.remove_stale()?;
        let started = Instant::now();
        let progress = |bytes| {
            emit(Progress {
                request_id: id.into(),
                bytes,
                total: pin.bytes,
                bytes_per_second: bytes as f64 / started.elapsed().as_secs_f64().max(0.001),
            })
        };
        progress(0);
        if let Some(path) = self.cached(&pin, &mut reservation.receiver).await? {
            check_cancel(&reservation.receiver)?;
            progress(pin.bytes);
            return Ok(Cache { path: Some(path) });
        }
        let free = match available {
            Some(n) => n,
            None => fs2::available_space(&self.root).map_err(io_error)?,
        };
        if free < pin.bytes.saturating_add(16 * 1024 * 1024) {
            return Err(error(
                Code::DiskFull,
                "Free disk space must cover the model plus 16 MiB.",
            ));
        }
        let (path, temp) = self.paths(&pin);
        let result = self
            .transfer(
                &pin,
                endpoint,
                &temp,
                &path,
                &mut reservation.receiver,
                progress,
            )
            .await;
        // File handle is closed by transfer before removal (including on Windows).
        if result.is_err() {
            match tokio::fs::remove_file(&temp).await {
                Ok(()) => (),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(e) => return Err(io_error(e)),
            }
        }
        result.map(|()| Cache { path: Some(path) })
    }
    async fn transfer(
        &self,
        pin: &ModelPin,
        endpoint: Option<&str>,
        temp: &Path,
        path: &Path,
        cancel: &mut watch::Receiver<bool>,
        progress: impl Fn(u64),
    ) -> Result<(), DownloadError> {
        let client = reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(15))
            .read_timeout(Duration::from_secs(30))
            .https_only(endpoint.is_none())
            .build()
            .map_err(network_error)?;
        let url = pin.url();
        let request = client
            .get(endpoint.unwrap_or(&url))
            .header("Accept-Encoding", "identity")
            .send();
        let mut response = tokio::select! {
            biased;
            _ = cancelled(cancel) => return Err(error(Code::Cancelled, "Model download cancelled.")),
            r = request => r.map_err(network_error)?,
        };
        if response.status() != reqwest::StatusCode::OK {
            return Err(error(
                Code::HttpError,
                &format!("Model server returned HTTP {}.", response.status().as_u16()),
            ));
        }
        if response.content_length().is_some_and(|n| n != pin.bytes) {
            return Err(error(
                Code::HashMismatch,
                "Model byte count does not match the pin.",
            ));
        }
        let mut file = tokio::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(temp)
            .await
            .map_err(io_error)?;
        let mut hash = Sha256::new();
        let mut bytes = 0;
        let mut last_event = Instant::now();
        loop {
            let chunk = tokio::select! {
                biased;
                _ = cancelled(cancel) => return Err(error(Code::Cancelled, "Model download cancelled.")),
                c = response.chunk() => c.map_err(network_error)?,
            };
            let Some(chunk) = chunk else {
                break;
            };
            bytes += chunk.len() as u64;
            if bytes > pin.bytes {
                return Err(error(
                    Code::HashMismatch,
                    "Model exceeds the pinned byte count.",
                ));
            }
            file.write_all(&chunk).await.map_err(io_error)?;
            hash.update(&chunk);
            if last_event.elapsed() >= Duration::from_millis(100) {
                progress(bytes);
                last_event = Instant::now();
            }
        }
        check_cancel(cancel)?;
        if bytes != pin.bytes || format!("{:x}", hash.finalize()) != pin.sha256 {
            return Err(error(
                Code::HashMismatch,
                "Model SHA-256 or byte count does not match the pin.",
            ));
        }
        file.flush().await.map_err(io_error)?;
        file.sync_all().await.map_err(io_error)?;
        drop(file);
        check_cancel(cancel)?;
        tokio::fs::rename(temp, path).await.map_err(io_error)?;
        #[cfg(unix)]
        std::fs::File::open(&self.root)
            .and_then(|f| f.sync_all())
            .map_err(io_error)?;
        progress(bytes);
        Ok(())
    }
}
struct Reservation<'a> {
    owner: &'a Downloader,
    receiver: watch::Receiver<bool>,
}
impl Drop for Reservation<'_> {
    fn drop(&mut self) {
        *self.owner.active.lock().unwrap_or_else(|e| e.into_inner()) = None;
    }
}
fn check_cancel(receiver: &watch::Receiver<bool>) -> Result<(), DownloadError> {
    if *receiver.borrow() {
        Err(error(Code::Cancelled, "Model download cancelled."))
    } else {
        Ok(())
    }
}
async fn cancelled(receiver: &mut watch::Receiver<bool>) {
    loop {
        if *receiver.borrow_and_update() {
            return;
        }
        if receiver.changed().await.is_err() {
            return;
        }
    }
}

#[tauri::command]
pub async fn download_model<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: tauri::State<'_, Arc<Downloader>>,
    request_id: String,
) -> Result<Outcome<Cache>, ()> {
    Ok(state
        .download(
            &request_id,
            production_pin(),
            |p| {
                let _ = app.emit("model-download-progress", p);
            },
            None,
            None,
        )
        .await
        .into())
}
#[tauri::command]
pub fn cancel_model_download(state: tauri::State<'_, Arc<Downloader>>, request_id: String) -> bool {
    state.cancel(&request_id)
}
#[tauri::command]
pub async fn model_cache_state(
    state: tauri::State<'_, Arc<Downloader>>,
) -> Result<Outcome<Cache>, ()> {
    Ok(state.inspect(production_pin()).await.into())
}

pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let service = Arc::new(Downloader::new(app.path().app_data_dir()?.join("models")));
    // Recovery needs no selected artifact. A locked cache belongs to another live process.
    if let Err(e) = service.recover() {
        log::warn!("Model recovery: {:?}", e.code);
    }
    app.manage(service);
    Ok(())
}
