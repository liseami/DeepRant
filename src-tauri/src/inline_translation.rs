/**
 * [INPUT]: shell_helper 的有限选区 / 剪贴板 / 焦点事务，ai_translator 的最终译文，界面语言决定固定占位。
 * [OUTPUT]: 原位 copy → 占位 → 核验提交 / 回滚；只内存原文恢复的可用查询与用户显式复制。
 * [POS]: 可见翻译生命周期；只替换精确匹配的当前占位选区，焦点或编辑变化后保存原文、不追逐光标覆盖新内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::shell_helper::{report_status, BusyGuard, InputTransaction};
use anyhow::{anyhow, bail, Context, Result};
use std::sync::Mutex;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

static RECOVERY: Mutex<Option<String>> = Mutex::new(None);

pub(crate) fn recovery_available() -> bool {
    RECOVERY.lock().is_ok_and(|recovery| recovery.is_some())
}

/// 用户明确点击“复制原文”才写剪贴板；写入失败保留草稿，原文不进入日志、事件或持久化。
pub(crate) fn copy_recovery(app: &AppHandle) -> Result<()> {
    let mut recovery = RECOVERY.lock().map_err(|_| anyhow!("原文恢复暂不可用"))?;
    let text = recovery.as_ref().ok_or_else(|| anyhow!("没有需要恢复的原文"))?;
    app.clipboard().write_text(text).context("系统拒绝复制原文，恢复草稿仍然保留")?;
    *recovery = None;
    Ok(())
}

fn remember_original(original: &str) -> Result<()> {
    *RECOVERY.lock().map_err(|_| anyhow!("无法保存原文恢复草稿"))? = Some(original.to_string());
    Ok(())
}

fn progress_text(language: &str) -> &'static str {
    if language == "en" { "Translating..." } else { "翻译中..." }
}

fn require_progress_selection(selected: &str, progress: &str) -> Result<()> {
    if selected != progress {
        bail!("翻译期间文字或选区已改变，未覆盖当前内容；可在 DeepRant 中复制原文恢复");
    }
    Ok(())
}

fn verify_progress(transaction: &InputTransaction, progress: &str) -> Result<()> {
    // 不移动光标、不重新选行或全文：用户编辑 / 切换选区后，复制结果无法再证明占位所有权。
    require_progress_selection(&transaction.copy_text(false)?, progress)
}

fn restore_original(transaction: &InputTransaction, original: &str, progress: &str) -> Result<()> {
    verify_progress(transaction, progress)?;
    transaction.paste(original)?;
    report_status(&transaction.app, "restored", "翻译未完成，已发送原文恢复粘贴");
    Ok(())
}

fn fail_with_recovery(
    transaction: &InputTransaction,
    original: &str,
    progress: &str,
    error: anyhow::Error,
) -> anyhow::Error {
    match restore_original(transaction, original, progress) {
        Ok(()) => error.context("翻译未完成，原文恢复粘贴已发送，请确认输入框"),
        Err(restore_error) => match remember_original(original) {
            Ok(()) => error.context(format!(
                "未继续覆盖输入框，原文已暂存在 DeepRant，可点击“复制原文”恢复；安全回滚未完成：{restore_error:#}"
            )),
            Err(recovery_error) => error.context(format!(
                "未继续覆盖输入框，安全回滚和原文暂存未完成：{restore_error:#}；{recovery_error:#}"
            )),
        },
    }
}

pub(crate) async fn replace(app: &AppHandle, select_current_line: bool, language: &str) -> Result<()> {
    let busy = BusyGuard::acquire()?;
    let app = app.clone();
    let progress = progress_text(language);
    let (transaction, original) = tauri::async_runtime::spawn_blocking(move || {
        let transaction = InputTransaction::new(app, busy)?;
        report_status(&transaction.app, "copying", "正在读取要翻译的选区");
        let original = transaction.copy_text(select_current_line)?;
        let prepare = (|| -> Result<()> {
            transaction.paste(progress)?;
            // 占位全部是独立 BMP 字符，Shift 左的次数不涉及原文中的 emoji 或组合字符。
            transaction.select_previous_chars(progress.chars().count())?;
            verify_progress(&transaction, progress)
        })();
        if let Err(error) = prepare {
            return Err(fail_with_recovery(&transaction, &original, progress, error));
        }
        Ok::<_, anyhow::Error>((transaction, original))
    })
    .await
    .context("输入任务被中断")??;
    report_status(&transaction.app, "translating", "输入框已显示翻译中，正在请求模型");
    let outcome = crate::ai_translator::translate_with_gpt(&transaction.app, &original).await;
    tauri::async_runtime::spawn_blocking(move || {
        let translated = match outcome {
            Ok(translated) if !translated.trim().is_empty() => translated,
            Ok(_) => return Err(fail_with_recovery(&transaction, &original, progress, anyhow!("模型返回空译文"))),
            Err(error) => return Err(fail_with_recovery(&transaction, &original, progress, error)),
        };
        let commit = verify_progress(&transaction, progress).and_then(|_| transaction.paste(&translated));
        if let Err(error) = commit {
            return Err(fail_with_recovery(&transaction, &original, progress, error));
        }
        report_status(&transaction.app, "done", "译文替换粘贴已发送，请确认目标输入框");
        Ok(())
    })
    .await
    .context("粘贴任务被中断")?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn placeholder_selection_is_bounded_and_requires_exact_ownership() {
        for language in ["zh", "en"] {
            let progress = progress_text(language);
            assert_eq!(progress.chars().count(), progress.encode_utf16().count());
            assert!(!progress.contains(['\n', '\r']));
            assert!(require_progress_selection(progress, progress).is_ok());
            assert!(require_progress_selection(&format!("{progress}新编辑"), progress).is_err());
            assert!(require_progress_selection("用户自己的选区", progress).is_err());
        }
    }
}
