/**
 * [INPUT]: 依赖 store 的 daily_mode 与翻译设置；依赖 clipboard 读写；依赖 enigo 0.3 注入组合键
 * [OUTPUT]: 提供 trans_and_replace_text、has_text_selection、send_phrase
 * [POS]: 剪贴板翻译与常用语粘贴的唯一入口。shortcut 只调用这里。按键走 enigo 的 SendInput / CGEvent，禁止再调 PowerShell / osascript。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

use crate::ai_translator;
use anyhow::{anyhow, Result};
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};
use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

pub async fn trans_and_replace_text(app: &AppHandle) -> Result<()> {
    let settings = crate::store::get_settings(app)?;

    // 1. 复制选中文本：游戏模式先全选，日常模式只复制
    if !settings.daily_mode {
        simulate_keyboard_shortcut("a")?;
    }
    simulate_keyboard_shortcut("c")?;
    // 2. 读取剪贴板内容
    let original_text = app.clipboard().read_text()?;
    println!("原始文本: {:?}", original_text);

    if !settings.daily_mode {
        // 3. 游戏模式：写入状态文本，全选后粘贴
        let status_text = format!(
            "DeepRant翻译中... ({}→{} | 场景:{} | 模式:{})",
            settings.translation_from,
            settings.translation_to,
            settings.game_scene,
            settings.translation_mode
        );
        app.clipboard().write_text(&status_text)?;

        simulate_keyboard_shortcut("a")?;
        simulate_keyboard_shortcut("v")?;
    }

    // 4. 调用AI翻译
    let translated = ai_translator::translate_with_gpt(app, &original_text).await?;
    println!("翻译结果: {:?}", translated);

    // 5. 写入译文：游戏模式先全选，再粘贴
    app.clipboard().write_text(translated)?;
    if !settings.daily_mode {
        simulate_keyboard_shortcut("a")?;
    }
    simulate_keyboard_shortcut("v")?;

    Ok(())
}

pub async fn has_text_selection(app: &AppHandle) -> Result<bool> {
    simulate_keyboard_shortcut("c")?;

    let new_clipboard = app.clipboard().read_text().unwrap_or_default();
    let has_selection = !new_clipboard.is_empty();

    Ok(has_selection)
}

// ---------------------------------------------------------------------------
// 原生按键模拟（enigo SendInput / CGEvent）
// ---------------------------------------------------------------------------
// macOS 修饰键是 Meta（Command）；Windows 是 Control。
// 独占全屏游戏仍可能吞掉注入事件，须窗口模式。

fn simulate_keyboard_shortcut(key: &str) -> Result<()> {
    let letter = key.chars().next().ok_or_else(|| anyhow!("按键为空"))?;

    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| {
        anyhow!(
            "无法创建输入模拟：请在系统设置中授予辅助功能权限（macOS），或改用窗口模式后重试。({})",
            e
        )
    })?;

    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control;

    enigo.key(modifier, Press)?;
    enigo.key(Key::Unicode(letter), Click)?;
    enigo.key(modifier, Release)?;

    std::thread::sleep(Duration::from_millis(80));
    if key == "c" {
        std::thread::sleep(Duration::from_millis(120));
    }

    Ok(())
}

pub async fn send_phrase(app: &AppHandle, phrase: &str) -> Result<()> {
    app.clipboard().write_text(phrase)?;
    simulate_keyboard_shortcut("v")?;

    Ok(())
}
