// 导入所需的 Tauri 相关模块
use crate::shell_helper::{send_phrase, trans_and_replace_text};
use crate::store::{get_settings, update_settings_field, HotkeyConfig};
use serde_json::json;
use std::str::FromStr;
use std::sync::Arc;
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutEvent, ShortcutState,
};
use tauri_plugin_store::StoreExt;

/// 从字符串转换为修饰键
fn parse_modifiers(modifiers: &[String]) -> Modifiers {
    let mut result = Modifiers::empty();
    for modifier in modifiers {
        match modifier.as_str() {
            "Control" | "ControlLeft" | "ControlRight" => result |= Modifiers::CONTROL,
            "Alt" | "AltLeft" | "AltRight" => result |= Modifiers::ALT,
            "Shift" | "ShiftLeft" | "ShiftRight" => result |= Modifiers::SHIFT,
            "Meta" | "MetaLeft" | "MetaRight" => result |= Modifiers::META,
            _ => {}
        }
    }
    result
}

/// 注册单个快捷键
fn register_shortcut<F>(
    app: &AppHandle,
    modifiers: &[String],
    key: &str,
    handler: F,
) -> Result<(), String>
where
    F: Fn(&AppHandle, &Shortcut, ShortcutEvent) + Send + Sync + 'static,
{
    println!("开始注册快捷键...");
    println!("修饰键: {:?}", modifiers);
    println!("主键: {}", key);

    let code = match Code::from_str(key) {
        Ok(c) => {
            println!("成功解析按键代码");
            c
        }
        Err(_) => {
            let err = format!("无效的按键代码: {}", key);
            println!("错误: {}", err);
            return Err(err);
        }
    };

    let parsed_modifiers = parse_modifiers(modifiers);
    println!("解析后的修饰键: {:?}", parsed_modifiers);

    let shortcut = Shortcut::new(Some(parsed_modifiers), code);
    println!("创建快捷键组合: {:?}", shortcut);

    let global_shortcut = app.global_shortcut();
    match global_shortcut.on_shortcut(shortcut, handler) {
        Ok(_) => {
            println!("快捷键注册成功");
            Ok(())
        }
        Err(e) => {
            let err = format!("注册快捷键失败: {}", e);
            println!("错误: {}", err);
            Err(err)
        }
    }
}

/// 更新快捷键
///
/// # 参数
/// * `app` - Tauri应用句柄
/// * `old_modifiers` - 旧的修饰键列表
/// * `old_key` - 旧的主键
/// * `new_modifiers` - 新的修饰键列表
/// * `new_key` - 新的主键
/// * `handler` - 快捷键触发时的处理函数
///
/// # 返回值
/// * `Result<(), String>` - 成功返回 Ok(()), 失败返回错误信息
fn update_shortcut<F>(
    app: &AppHandle,
    old_modifiers: &[String],
    old_key: &str,
    new_modifiers: &[String],
    new_key: &str,
    handler: F,
) -> Result<(), String>
where
    F: Fn(&AppHandle, &Shortcut, ShortcutEvent) + Send + Sync + 'static,
{
    println!("开始更新快捷键...");
    println!("旧快捷键: 修饰键={:?}, 主键={}", old_modifiers, old_key);
    println!("新快捷键: 修饰键={:?}, 主键={}", new_modifiers, new_key);

    let global_shortcut = app.global_shortcut();

    // 注销旧快捷键
    if let Ok(old_code) = Code::from_str(old_key) {
        println!("正在注销旧快捷键...");
        let old_shortcut = Shortcut::new(Some(parse_modifiers(old_modifiers)), old_code);
        match global_shortcut.unregister(old_shortcut) {
            Ok(_) => println!("成功注销旧快捷键"),
            Err(e) => {
                println!("注销现有快捷键失败: {}", e);
                // 继续执行,因为旧快捷键可能本来就不存在
            }
        }
    } else {
        println!("旧快捷键格式无效,跳过注销步骤");
    }

    // 注册新快捷键
    println!("正在注册新快捷键...");
    match register_shortcut(app, new_modifiers, new_key, handler) {
        Ok(_) => {
            println!("新快捷键注册成功");
            Ok(())
        }
        Err(e) => {
            println!("新快捷键注册失败: {}", e);
            Err(e)
        }
    }
}

/// 初始化所有快捷键
pub fn init_shortcuts(app: &AppHandle) -> Result<(), String> {
    let settings = get_settings(app).map_err(|e| e.to_string())?;

    // 注册翻译快捷键
    register_shortcut(
        app,
        &settings.trans_hotkey.modifiers,
        &settings.trans_hotkey.key,
        create_trans_handler(app.clone()),
    )?;

    // 注册常用语快捷键
    for phrase in settings.phrases {
        let phrase_text = phrase.phrase.clone();
        let app_handle = app.clone();

        register_shortcut(
            app,
            &phrase.hotkey.modifiers,
            &phrase.hotkey.key,
            move |_app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let app_handle = app_handle.clone();
                    let phrase_text = phrase_text.clone();
                    tauri::async_runtime::spawn(async move {
                        if let Err(e) = send_phrase(&app_handle, &phrase_text).await {
                            println!("发送常用语失败: {:?}", e);
                        }
                    });
                }
            },
        )?;
    }

    Ok(())
}

/// 更新翻译快捷键
pub fn update_translator_shortcut(
    app: &AppHandle,
    keys: Vec<String>, // 直接接收按键数组
) -> Result<(), String> {
    println!("正在更新翻译快捷键...");
    println!("接收到的按键数组: {:?}", keys);

    // 验证快捷键组合
    let has_modifier = keys.iter().any(|k| {
        k.contains("Control") || k.contains("Alt") || k.contains("Shift") || k.contains("Meta")
    });

    let has_non_modifier = keys.iter().any(|k| {
        !k.contains("Control") && !k.contains("Alt") && !k.contains("Shift") && !k.contains("Meta")
    });

    if !has_modifier || !has_non_modifier || keys.len() < 2 {
        return Err(
            "快捷键必须包含至少一个修饰键(Control/Alt/Shift/Command)和一个其他按键".to_string(),
        );
    }

    let settings = get_settings(app).map_err(|e| {
        println!("获取设置失败: {}", e);
        e.to_string()
    })?;

    // 分离修饰键和主键
    let (modifiers, key) = if keys.is_empty() {
        (Vec::new(), String::new())
    } else {
        let mut mods: Vec<String> = keys[..keys.len() - 1]
            .iter()
            .map(|k| k.replace("Left", "").replace("Right", ""))
            .collect();
        let k = keys.last().unwrap_or(&String::new()).to_string();
        (mods, k)
    };

    println!("解析后的按键: {}", key);
    println!("解析后的修饰键: {:?}", modifiers);

    // 更新快捷键
    let result = update_shortcut(
        app,
        &settings.trans_hotkey.modifiers,
        &settings.trans_hotkey.key,
        &modifiers,
        &key,
        create_trans_handler(app.clone()),
    );

    // 如果快捷键更新成功，则更新存储
    if result.is_ok() {
        // 创建新的快捷键配置
        let shortcut_text = format!(
            "{}+{}",
            modifiers
                .iter()
                .map(|m| match m.as_str() {
                    "Control" =>
                        if cfg!(target_os = "macos") {
                            "⌃"
                        } else {
                            "Ctrl"
                        },
                    "Alt" =>
                        if cfg!(target_os = "macos") {
                            "⌥"
                        } else {
                            "Alt"
                        },
                    "Shift" => "⇧",
                    "Meta" =>
                        if cfg!(target_os = "macos") {
                            "⌘"
                        } else {
                            "Win"
                        },
                    _ => m,
                })
                .collect::<Vec<_>>()
                .join("+"),
            format_key_display(&key)
        );

        let new_hotkey = HotkeyConfig {
            modifiers,
            key,
            shortcut: shortcut_text,
        };

        // 更新存储
        if let Err(e) = update_settings_field(app, |settings| {
            settings.trans_hotkey = new_hotkey;
        }) {
            println!("保存设置失败: {}", e);
            return Err(format!("快捷键已更新，但保存设置失败: {}", e));
        }
        println!("快捷键设置已保存到存储");
    }

    match &result {
        Ok(_) => println!("翻译快捷键更新成功"),
        Err(e) => println!("翻译快捷键更新失败: {}", e),
    }

    result
}

/// 创建翻译快捷键处理函数
fn create_trans_handler(
    app: AppHandle,
) -> impl Fn(&AppHandle, &Shortcut, ShortcutEvent) + Send + Sync + 'static {
    let app = Arc::new(app);
    move |_app, _shortcut, event| {
        if event.state() == ShortcutState::Pressed {
            let app_clone = Arc::clone(&app);
            tauri::async_runtime::spawn(async move {
                if let Err(e) = trans_and_replace_text(app_clone.as_ref()).await {
                    println!("翻译替换失败: {:?}", e);
                }
            });
        }
    }
}

/// 格式化键盘代码为用户友好的显示文本
fn format_key_display(key: &str) -> String {
    if key.starts_with("Key") {
        key[3..].to_string()
    } else if key.starts_with("Digit") {
        key[5..].to_string()
    } else if key.starts_with("Arrow") {
        match key {
            "ArrowUp" => "↑".to_string(),
            "ArrowDown" => "↓".to_string(),
            "ArrowLeft" => "←".to_string(),
            "ArrowRight" => "→".to_string(),
            _ => key.to_string(),
        }
    } else {
        match key {
            "Space" => "空格".to_string(),
            "Tab" => "Tab".to_string(),
            "Enter" => "↵".to_string(),
            "Backspace" => "⌫".to_string(),
            "Delete" => "Del".to_string(),
            "Escape" => "Esc".to_string(),
            "CapsLock" => "⇪".to_string(),
            _ => key.to_string(),
        }
    }
}
