/**
 * [INPUT]: store 的已校验模型设置、ai_translator 共用测连与原生剪贴板。
 * [OUTPUT]: 带服务/协议/模型/耗时的安全诊断，以及用户显式复制最近诊断的命令。
 * [POS]: 模型编辑的原生业务边界；WebView 只展示报告，不生成诊断、不读取系统剪贴板。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use std::{sync::Mutex, time::Instant};
use tauri::{AppHandle, WebviewWindow};
use tauri_plugin_clipboard_manager::ClipboardExt;

#[derive(Clone, serde::Serialize)]
pub struct ConnectionReport {
    ok: bool,
    message: String,
    server: String,
    protocol: String,
    model: String,
    seconds: f64,
}

static LAST_REPORT: Mutex<Option<ConnectionReport>> = Mutex::new(None);

pub async fn test(app: &AppHandle) -> Result<ConnectionReport, String> {
    let app_copy = app.clone();
    let settings =
        tauri::async_runtime::spawn_blocking(move || crate::store::get_settings(&app_copy))
            .await
            .map_err(|_| "设置读取任务被中断".to_string())?
            .map_err(|error| error.to_string())?;
    let started = Instant::now();
    let outcome = crate::ai_translator::test_model_connection(app).await;
    let report = ConnectionReport {
        ok: outcome.is_ok(),
        message: outcome.unwrap_or_else(|error| error.to_string()),
        server: reqwest::Url::parse(&settings.custom_model.api_url)
            .ok()
            .and_then(|url| url.host_str().map(str::to_string))
            .unwrap_or_default(),
        protocol: settings.custom_model.protocol,
        model: settings.custom_model.model_name,
        seconds: (started.elapsed().as_secs_f64() * 10.0).round() / 10.0,
    };
    *LAST_REPORT
        .lock()
        .map_err(|_| "连接诊断暂不可用".to_string())? = Some(report.clone());
    Ok(report)
}

#[tauri::command]
pub fn copy_connection_diagnostic(window: WebviewWindow, app: AppHandle) -> Result<(), String> {
    if window.label() != "main" {
        return Err("只有主窗口可以复制连接诊断".into());
    }
    let report = LAST_REPORT
        .lock()
        .map_err(|_| "连接诊断暂不可用".to_string())?
        .clone()
        .ok_or("请先测试模型连接")?;
    let text = format!(
        "DeepRant connection {}\nServer: {}\nProtocol: {}\nModel: {}\nElapsed: {}s\n{}",
        if report.ok { "OK" } else { "failed" },
        report.server,
        report.protocol,
        report.model,
        report.seconds,
        report.message
    );
    app.clipboard()
        .write_text(text)
        .map_err(|_| "系统拒绝复制连接诊断".to_string())
}
