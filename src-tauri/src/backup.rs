use std::{fs::File, io::Write, path::Path};
use tauri_plugin_dialog::DialogExt;

fn write_backup(path: &Path, text: &str) -> std::io::Result<()> {
    let mut file = File::create(path)?;
    file.write_all(text.as_bytes())?;
    file.sync_all()
}

/// Only the native picker chooses the destination; callers cannot write an
/// arbitrary path. None means the user cancelled, not a successful save.
#[tauri::command]
pub async fn export_backup(
    app: tauri::AppHandle,
    text: String,
    filename: String,
) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(selected) = app
            .dialog()
            .file()
            .set_title("Export Daneo backup")
            .set_file_name(filename)
            .add_filter("Daneo backup", &["json"])
            .blocking_save_file()
        else {
            return Ok(None);
        };
        let path = selected.into_path().map_err(|e| e.to_string())?;
        write_backup(&path, &text).map_err(|e| format!("Could not save backup: {e}"))?;
        Ok(Some(path.to_string_lossy().into_owned()))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn writes_exact_json_and_reports_io_failure() {
        let root = std::env::temp_dir().join(format!("daneo-backup-test-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        let path = root.join("backup.json");
        let text = r#"{"word":"물"}"#;
        write_backup(&path, text).unwrap();
        assert_eq!(std::fs::read_to_string(&path).unwrap(), text);
        assert!(write_backup(&root, text).is_err());
        assert!(write_backup(&root.join("missing/backup.json"), text).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }
}
