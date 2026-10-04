use super::*;
use std::{
    io::{Read, Write},
    net::TcpListener,
    sync::atomic::{AtomicUsize, Ordering},
};

static NEXT: AtomicUsize = AtomicUsize::new(0);
struct Dir(PathBuf);
impl Dir {
    fn new() -> Self {
        let root = std::env::var_os("PAPERCLIP_RUN_SCRATCH_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(std::env::temp_dir);
        let dir = root.join(format!(
            "daneo-download-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::SeqCst)
        ));
        std::fs::create_dir_all(&dir).unwrap();
        Self(dir)
    }
}
impl Drop for Dir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
fn pin() -> ModelPin {
    serde_json::from_str(include_str!(
        "../../../reference/downloader/fixture-pin.json"
    ))
    .unwrap()
}
fn fixture(wrong: bool) -> Vec<u8> {
    (0..1048576)
        .map(|n| {
            if wrong {
                255 - (n % 256) as u8
            } else {
                (n % 256) as u8
            }
        })
        .collect()
}
// A real socket exercises reqwest framing, premature EOF and connection cancellation.
fn server(mode: &'static str) -> (String, std::thread::JoinHandle<()>) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let url = format!("http://{}/fixture", listener.local_addr().unwrap());
    let thread = std::thread::spawn(move || {
        let (mut stream, _) = listener.accept().unwrap();
        stream
            .set_read_timeout(Some(Duration::from_secs(3)))
            .unwrap();
        let mut request = [0; 4096];
        stream.read(&mut request).unwrap();
        if mode == "http" {
            stream
                .write_all(b"HTTP/1.1 503 Unavailable\r\nContent-Length: 0\r\n\r\n")
                .unwrap();
            return;
        }
        stream
            .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 1048576\r\nConnection: close\r\n\r\n")
            .unwrap();
        let data = fixture(mode == "wrong");
        if mode == "interrupt" {
            stream.write_all(&data[..4096]).unwrap();
            return;
        }
        if mode == "stall" {
            stream.write_all(&data[..4096]).unwrap();
            // Cancellation must close the connection, not merely suppress progress.
            assert_eq!(stream.read(&mut request).unwrap(), 0);
            return;
        }
        for chunk in data.chunks(65536) {
            if stream.write_all(chunk).is_err() {
                return;
            }
            if mode == "slow" {
                std::thread::sleep(Duration::from_millis(25));
            }
        }
    });
    (url, thread)
}
async fn fetch(d: &Downloader, endpoint: &str) -> Result<Cache, DownloadError> {
    d.download("test", Ok(pin()), |_| {}, Some(endpoint), Some(u64::MAX))
        .await
}
fn assert_absent(d: &Downloader) {
    let (final_path, temp) = d.paths(&pin());
    assert!(!final_path.exists());
    assert!(!temp.exists());
}
#[tokio::test]
async fn unset_and_every_incomplete_pin_refuse_before_any_io() {
    assert_eq!(production_pin().unwrap_err().code, Code::InvalidPin);
    let fixture = serde_json::to_value(pin()).unwrap();
    for field in ["repoId", "revision", "filename", "bytes", "sha256"] {
        let mut value = fixture.clone();
        value.as_object_mut().unwrap().remove(field);
        let dir = Dir::new();
        let root = dir.0.join("must-not-be-created");
        let d = Downloader::new(root.clone());
        let failure = d
            .download(
                "test",
                parse_pin(value),
                |_| panic!("unexpected progress"),
                Some("http://127.0.0.1:1"),
                None,
            )
            .await
            .unwrap_err();
        assert_eq!(failure.code, Code::InvalidPin);
        assert!(!root.exists());
    }
    for (field, value) in [
        ("repoId", ""),
        ("filename", "../escape"),
        ("revision", "main"),
        ("sha256", "abc"),
    ] {
        let mut v = fixture.clone();
        v[field] = value.into();
        assert_eq!(parse_pin(v).unwrap_err().code, Code::InvalidPin);
    }
}
#[tokio::test]
async fn verified_download_reports_progress_and_publishes_atomically() {
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    let (url, server) = server("slow");
    let events = Mutex::new(Vec::new());
    let (final_path, _) = d.paths(&pin());
    let cache = d
        .download(
            "test",
            Ok(pin()),
            |p| {
                if p.bytes < p.total {
                    assert!(!final_path.exists());
                }
                events.lock().unwrap().push(p);
            },
            Some(&url),
            Some(u64::MAX),
        )
        .await
        .unwrap();
    server.join().unwrap();
    assert_eq!(cache.path, Some(final_path.clone()));
    assert_eq!(std::fs::read(final_path).unwrap(), fixture(false));
    assert!(!d.paths(&pin()).1.exists());
    let events = events.lock().unwrap();
    assert!(events.len() > 2);
    assert_eq!(events.first().unwrap().bytes, 0);
    assert_eq!(events.last().unwrap().bytes, pin().bytes);
    assert!(events.iter().all(|p| p.request_id == "test"
        && p.total == pin().bytes
        && p.bytes_per_second.is_finite()));
    assert!(events.windows(2).all(|pair| pair[0].bytes <= pair[1].bytes));
    // A verified cache is reused without a server or any free space.
    assert!(d
        .download(
            "cached",
            Ok(pin()),
            |_| {},
            Some("http://127.0.0.1:1"),
            Some(0)
        )
        .await
        .is_ok());
}
#[tokio::test]
async fn same_length_wrong_hash_is_discarded() {
    assert_eq!(
        format!("{:x}", Sha256::digest(fixture(true))),
        "eaeaa7acca0afcaee85d7abae4d8e5033652991ea19df161cc90ceec2803342c"
    );
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    let (url, server) = server("wrong");
    assert_eq!(fetch(&d, &url).await.unwrap_err().code, Code::HashMismatch);
    server.join().unwrap();
    assert_absent(&d);
}
#[tokio::test]
async fn interrupted_transfer_cleans_up_and_can_retry() {
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    let (url, server) = server("interrupt");
    assert_eq!(fetch(&d, &url).await.unwrap_err().code, Code::NoNetwork);
    server.join().unwrap();
    assert_absent(&d);
    let (url, server) = self::server("good");
    assert!(fetch(&d, &url).await.is_ok());
    server.join().unwrap();
}
#[tokio::test]
async fn cancel_stalled_body_stops_socket_and_cleans_up() {
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    let (url, server) = server("stall");
    let download = fetch(&d, &url);
    let cancel = async {
        for _ in 0..200 {
            if std::fs::metadata(d.paths(&pin()).1).is_ok_and(|m| m.len() > 0) {
                break;
            }
            tokio::time::sleep(Duration::from_millis(5)).await;
        }
        assert!(!d.cancel("different-request"));
        assert!(d.cancel("test"));
    };
    let (result, _) = tokio::time::timeout(Duration::from_secs(2), async {
        tokio::join!(download, cancel)
    })
    .await
    .unwrap();
    assert_eq!(result.unwrap_err().code, Code::Cancelled);
    server.join().unwrap();
    assert_absent(&d);
    assert!(!d.cancel("test"));
}
#[tokio::test]
async fn restart_removes_stale_partial_and_rejects_corrupt_cache() {
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    let (path, temp) = d.paths(&pin());
    std::fs::write(&temp, b"killed process left this").unwrap();
    std::fs::write(&path, fixture(true)).unwrap();
    d.recover().unwrap();
    assert!(!temp.exists());
    assert!(d.inspect(Ok(pin())).await.unwrap().path.is_none());
    assert!(!path.exists());
    let (url, server) = server("good");
    fetch(&d, &url).await.unwrap();
    server.join().unwrap();
    assert!(d.inspect(Ok(pin())).await.unwrap().path.is_some());
}
#[tokio::test]
async fn disk_full_is_refused_before_network_or_temp_file() {
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    assert_eq!(
        d.download(
            "test",
            Ok(pin()),
            |_| {},
            Some("http://127.0.0.1:1"),
            Some(pin().bytes - 1)
        )
        .await
        .unwrap_err()
        .code,
        Code::DiskFull
    );
    assert_absent(&d);
    #[cfg(unix)]
    {
        assert_eq!(
            io_error(std::io::Error::from_raw_os_error(28)).code,
            Code::DiskFull
        );
        assert_eq!(
            io_error(std::io::Error::from_raw_os_error(13)).code,
            Code::PermissionDenied
        );
    }
}
#[tokio::test]
async fn http_and_connection_errors_are_typed() {
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    let (url, server) = server("http");
    assert_eq!(fetch(&d, &url).await.unwrap_err().code, Code::HttpError);
    server.join().unwrap();
    assert_absent(&d);
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    drop(listener);
    assert_eq!(fetch(&d, &url).await.unwrap_err().code, Code::NoNetwork);
    assert_absent(&d);
}
#[test]
fn concurrent_operations_cannot_remove_an_active_partial() {
    let dir = Dir::new();
    let d = Downloader::new(dir.0.clone());
    let _reservation = d.reserve("first").unwrap();
    assert!(matches!(
        d.reserve("second"),
        Err(DownloadError {
            code: Code::Busy,
            ..
        })
    ));
    let _lock = d.storage_lock().unwrap();
    let temp = d.paths(&pin()).1;
    std::fs::write(&temp, b"active").unwrap();
    let other = Downloader::new(dir.0.clone());
    assert_eq!(other.recover().unwrap_err().code, Code::Busy);
    assert!(temp.exists());
}

#[test]
fn native_ipc_returns_the_same_error_envelope_for_unset_pin() {
    let dir = Dir::new();
    let root = dir.0.join("untouched");
    let app = tauri::test::mock_builder()
        .manage(Arc::new(Downloader::new(root.clone())))
        .invoke_handler(tauri::generate_handler![download_model])
        .build(tauri::test::mock_context(tauri::test::noop_assets()))
        .unwrap();
    let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap();
    let response = tauri::test::get_ipc_response(
        &webview,
        tauri::webview::InvokeRequest {
            cmd: "download_model".into(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            url: if cfg!(windows) {
                "http://tauri.localhost"
            } else {
                "tauri://localhost"
            }
            .parse()
            .unwrap(),
            body: tauri::ipc::InvokeBody::Json(serde_json::json!({"requestId":"ipc-refusal"})),
            headers: Default::default(),
            invoke_key: tauri::test::INVOKE_KEY.into(),
        },
    )
    .unwrap()
    .deserialize::<serde_json::Value>()
    .unwrap();
    assert_eq!(response["ok"], false);
    assert_eq!(response["error"]["code"], "invalid-pin");
    assert!(!root.exists());
}
