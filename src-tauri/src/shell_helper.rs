use crate::ai_translator;
use anyhow::Result;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_shell::ShellExt;

pub async fn trans_and_replace_text(app: &AppHandle) -> Result<()> {
    let settings = crate::store::get_settings(app)?;

    // 1. 复制选中文本
    if !settings.daily_mode {
        simulate_keyboard_shortcut(app, "a").await?;
    }
    simulate_keyboard_shortcut(app, "c").await?;
    // 2. 读取剪贴板内容
    let original_text = app.clipboard().read_text()?;
    println!("原始文本: {:?}", original_text);

    if !settings.daily_mode {
        // 3. 如果是游戏模式 -> 显示翻译状态
        let status_text = format!(
            "DeepRant翻译中... ({}→{} | 场景:{} | 模式:{})",
            settings.translation_from,
            settings.translation_to,
            settings.game_scene,
            settings.translation_mode
        );
        app.clipboard().write_text(&status_text)?;

        // 4. 粘贴状态文本
        simulate_keyboard_shortcut(app, "a").await?;
        simulate_keyboard_shortcut(app, "v").await?;
    }

    // 5. 调用AI翻译
    let translated = ai_translator::translate_with_gpt(app, &original_text).await?;
    println!("翻译结果: {:?}", translated);

    // 6. 粘贴翻译结果
    app.clipboard().write_text(translated)?;
    if !settings.daily_mode {
        simulate_keyboard_shortcut(app, "a").await?;
    }
    simulate_keyboard_shortcut(app, "v").await?;

    Ok(())
}

pub async fn has_text_selection(app: &AppHandle) -> Result<bool> {
    // 模拟 Cmd+C/Ctrl+C
    simulate_keyboard_shortcut(app, "c").await?;

    // 读取复制后的剪贴板内容
    let new_clipboard = app.clipboard().read_text().unwrap_or_default();

    // 如果新的剪贴板内容不为空，说明有选中的文本
    let has_selection = !new_clipboard.is_empty();

    Ok(has_selection)
}

/// 模拟键盘组合键按下
async fn simulate_keyboard_shortcut(app: &AppHandle, key: &str) -> Result<()> {
    #[cfg(target_os = "macos")]
    {
        let shell = app.shell();
        let script = format!(
            r#"
            tell application "System Events"
                keystroke "{}" using command down
                delay 0.1
            end tell
            "#,
            key
        );

        let output = shell
            .command("osascript")
            .args(["-e", &script])
            .output()
            .await?;

        if !output.status.success() {
            println!("按键模拟失败: {:?}", String::from_utf8(output.stderr)?);
            return Ok(());
        }
    }

    #[cfg(target_os = "windows")]
    {
        let shell = app.shell();
        let script = format!(
            r#"
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.SendKeys]::SendWait("^{}")
            Start-Sleep -Milliseconds 100
            "#,
            key
        );

        let output = shell
            .command("powershell")
            .args(["-Command", &script])
            .output()
            .await?;

        if !output.status.success() {
            println!("按键模拟失败: {:?}", String::from_utf8(output.stderr)?);
            return Ok(());
        }
    }

    Ok(())
}

pub async fn send_phrase(app: &AppHandle, phrase: &str) -> Result<()> {
    // 将短语写入剪贴板
    app.clipboard().write_text(phrase)?;

    // 模拟粘贴操作
    simulate_keyboard_shortcut(app, "v").await?;

    Ok(())
}
