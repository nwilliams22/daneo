use super::*;
use std::{sync::mpsc, thread, time::Duration};

fn translator() -> Arc<LocalTranslator> {
    Arc::new(LocalTranslator::new(PathBuf::from(
        "missing-model-for-lifecycle-tests",
    )))
}
fn error_code(outcome: Outcome) -> ErrorCode {
    match outcome {
        Outcome::Failure { ok, error } => {
            assert!(!ok);
            error.code
        }
        _ => panic!("expected typed failure"),
    }
}

#[test]
fn cancel_then_immediate_request_is_serialized_and_isolated() {
    let service = translator();
    let first = service
        .reserve("first".into(), "first input".into())
        .unwrap();
    let (started_tx, started_rx) = mpsc::channel();
    let (release_tx, release_rx) = mpsc::channel();
    let (events_tx, events_rx) = mpsc::channel();
    let worker = thread::spawn(move || {
        first.run_with(
            &|event| {
                events_tx.send(event).unwrap();
            },
            |request, emit| {
                request.progress(Phase::Generating, 1, emit)?;
                started_tx.send(()).unwrap();
                release_rx.recv_timeout(Duration::from_secs(5)).unwrap();
                // A delayed backend attempts progress AND success after cancellation.
                assert_eq!(
                    request
                        .progress(Phase::Generating, 2, emit)
                        .unwrap_err()
                        .code,
                    ErrorCode::Cancelled
                );
                Ok(serde_json::json!({"korean": "first result must never escape"}))
            },
        )
    });
    started_rx.recv_timeout(Duration::from_secs(5)).unwrap();
    assert!(service.cancel("first"));
    let second = service
        .reserve("second".into(), "second input".into())
        .unwrap();
    let (second_tx, second_rx) = mpsc::channel();
    let second_worker = thread::spawn(move || {
        second.run_with(&|_| {}, |request, _| {
            second_tx.send(()).unwrap();
            assert_eq!(request.input, "second input");
            Ok(serde_json::json!({"korean": "second result"}))
        })
    });
    assert!(second_rx.recv_timeout(Duration::from_millis(30)).is_err());
    release_tx.send(()).unwrap();
    assert_eq!(error_code(worker.join().unwrap()), ErrorCode::Cancelled);
    match second_worker.join().unwrap() {
        Outcome::Success { result, .. } => assert_eq!(result["korean"], "second result"),
        _ => panic!("second request failed"),
    }
    let events: Vec<_> = events_rx.iter().collect();
    assert!(events
        .iter()
        .all(|e| e.request_id == "first" && e.output_tokens <= 1));
    assert!(lock(&service.pending).is_empty());
    assert!(!service.cancel("first"));
}

#[test]
fn queued_cancel_never_runs_backend_and_duplicate_ids_are_rejected() {
    let service = translator();
    let request = service.reserve("queued".into(), "input".into()).unwrap();
    assert!(matches!(
        service.reserve("queued".into(), "other".into()),
        Err(TranslateError {
            code: ErrorCode::Busy,
            ..
        })
    ));
    assert!(service.cancel("queued"));
    assert_eq!(
        error_code(request.run_with(&|_| panic!("no events"), |_, _| panic!("no backend"))),
        ErrorCode::Cancelled
    );
    assert!(lock(&service.pending).is_empty());
}

#[test]
fn all_failures_release_resources_and_allow_next_request() {
    for code in [
        ErrorCode::ModelMissing,
        ErrorCode::ModelCorrupt,
        ErrorCode::AllocationFailed,
        ErrorCode::GenerationFailed,
    ] {
        let service = translator();
        let released = Arc::new(AtomicBool::new(false));
        struct Resource(Arc<AtomicBool>);
        impl Drop for Resource {
            fn drop(&mut self) {
                self.0.store(true, Ordering::SeqCst);
            }
        }
        let request = service.reserve("failed".into(), "input".into()).unwrap();
        let outcome = request.run_with(&|_| {}, |_, _| {
            let _resource = Resource(released.clone());
            Err(TranslateError::new(code.clone(), "controlled failure"))
        });
        assert_eq!(error_code(outcome), code);
        assert!(released.load(Ordering::SeqCst));
        assert_eq!(
            service.snapshot().state,
            if code == ErrorCode::ModelMissing {
                Phase::Absent
            } else {
                Phase::Error
            }
        );
        assert!(lock(&service.pending).is_empty());
        let next = service.reserve("next".into(), "input".into()).unwrap();
        assert!(matches!(
            next.run_with(&|_| {}, |_, _| Ok(serde_json::json!({}))),
            Outcome::Success { .. }
        ));
        assert_eq!(service.snapshot().state, Phase::Ready);
    }
}

#[test]
fn unwind_is_typed_and_does_not_poison_the_next_request() {
    let service = translator();
    let first = service.reserve("panic".into(), "input".into()).unwrap();
    assert_eq!(
        error_code(first.run_with(&|_| {}, |_, _| panic!("injected worker unwind"))),
        ErrorCode::GenerationFailed
    );
    let next = service.reserve("next".into(), "input".into()).unwrap();
    assert!(matches!(
        next.run_with(&|_| {}, |_, _| Ok(serde_json::json!({}))),
        Outcome::Success { .. }
    ));
}

#[test]
fn native_missing_model_uses_the_wire_error_envelope() {
    let service = translator();
    let result = service
        .reserve("missing".into(), "input".into())
        .unwrap()
        .run(|_| {});
    let wire = serde_json::to_value(result).unwrap();
    assert_eq!(wire["ok"], false);
    assert_eq!(wire["error"]["code"], "model-missing");
}

// Real model test is opt-in locally; deterministic failure/lifecycle tests above run in CI.
#[test]
#[ignore = "requires the manually provisioned pinned GGUF"]
fn real_model_cancel_allocation_failure_then_success() {
    let service = Arc::new(LocalTranslator::new(PathBuf::from(
        std::env::var_os("DANEO_MODEL_PATH").expect("DANEO_MODEL_PATH"),
    )));
    let allocation_request = service.reserve("allocation".into(), "물".into()).unwrap();
    assert_eq!(
        error_code(allocation_request.run_with(&|_| {}, |r, emit| native::generate(r, emit, true))),
        ErrorCode::AllocationFailed
    );
    let first = service
        .reserve("real-cancel".into(), "I drink water.".into())
        .unwrap();
    let (started_tx, started_rx) = mpsc::channel();
    let copy = service.clone();
    let worker = thread::spawn(move || {
        first.run(|event| {
            if event.state == Phase::Generating && event.output_tokens == 1 {
                copy.cancel("real-cancel");
                let _ = started_tx.send(());
            }
        })
    });
    started_rx.recv_timeout(Duration::from_secs(120)).unwrap();
    // Reserve before waiting for the cancelled worker to terminate.
    let next = service
        .reserve("real-success".into(), "Hello.".into())
        .unwrap();
    assert_eq!(error_code(worker.join().unwrap()), ErrorCode::Cancelled);
    let result = next.run(|_| {});
    if let Outcome::Success { result, .. } = &result {
        assert!(result["korean"].as_str().unwrap().contains("안녕"));
        assert!(result["natural_english"]
            .as_str()
            .unwrap()
            .to_lowercase()
            .contains("hello"));
    }
    let json = serde_json::to_string(&result).unwrap();
    println!("REAL_TRANSLATION={json}");
    if let Ok(path) = std::env::var("DANEO_TEST_RESULT_PATH") {
        std::fs::write(path, &json).unwrap();
    }
    assert!(matches!(result, Outcome::Success { .. }), "{json}");
}

#[test]
fn registered_commands_accept_camel_case_arguments_and_return_envelopes() {
    let service = translator();
    let app = tauri::test::mock_builder()
        .manage(service.clone())
        .invoke_handler(tauri::generate_handler![
            translate_local,
            cancel_local,
            local_translation_state
        ])
        .build(tauri::test::mock_context(tauri::test::noop_assets()))
        .unwrap();
    let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
        .build()
        .unwrap();
    let invoke = |cmd: &str, body: Value| {
        tauri::test::get_ipc_response(
            &webview,
            tauri::webview::InvokeRequest {
                cmd: cmd.into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: "tauri://localhost".parse().unwrap(),
                body: tauri::ipc::InvokeBody::Json(body),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.to_string(),
            },
        )
        .unwrap()
        .deserialize::<Value>()
        .unwrap()
    };
    let result = invoke(
        "translate_local",
        serde_json::json!({"requestId":"ipc", "input":"water"}),
    );
    assert_eq!(result["ok"], false);
    assert_eq!(result["error"]["code"], "model-missing");
    let queued = service
        .reserve("ipc-cancel".into(), "water".into())
        .unwrap();
    assert_eq!(
        invoke(
            "cancel_local",
            serde_json::json!({"requestId":"ipc-cancel"})
        ),
        true
    );
    assert_eq!(error_code(queued.run(|_| {})), ErrorCode::Cancelled);
    assert_eq!(
        invoke("local_translation_state", serde_json::json!({}))["state"],
        "absent"
    );
}
