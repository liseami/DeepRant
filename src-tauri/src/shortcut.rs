/**
 * [INPUT]: 依赖 store 的设置校验与持久化、global-shortcut 的系统注册、shell_helper 的输入事务及状态事件
 * [OUTPUT]: 提供 init_shortcuts、keys_to_hotkey、commit_shortcut_settings、change_shortcut_settings、get_shortcut_status、set_shortcuts_paused
 * [POS]: 全局快捷键的唯一注册边界。设置与回调完整切换，注册或保存失败恢复旧表；释放事件才调度输入，录制期间暂停回调。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::shell_helper::{report_status, send_phrase, trans_and_replace_text};
use crate::store::{display_key, get_settings, AppSettings, HotkeyConfig};
use std::{
    collections::HashMap,
    str::FromStr,
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex,
    },
};
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// 最低位表示录制暂停，其余位标识按键周期；跨录制边界的 Released 一律作废。
static SHORTCUT_MODE: AtomicU64 = AtomicU64::new(0);
static REGISTRY: Mutex<Registry> = Mutex::new(Registry {
    bindings: Vec::new(),
    last_error: None,
});
const MODIFIER_ORDER: [&str; 4] = ["Control", "Alt", "Shift", "Meta"];

#[derive(Clone, PartialEq)]
enum Action {
    Translate,
    Phrase(String),
}
#[derive(Clone)]
struct Binding {
    shortcut: Shortcut,
    action: Action,
    label: String,
}
struct Registry {
    bindings: Vec<Binding>,
    last_error: Option<String>,
}

// ---------------------------------------------------------------------------
// 契约：KeyboardEvent.code，规范化 modifier；数字小键盘及 F1..F24 可单键
// ---------------------------------------------------------------------------

fn modifier_name(key: &str) -> Option<&'static str> {
    match key {
        "Control" | "ControlLeft" | "ControlRight" => Some("Control"),
        "Alt" | "AltLeft" | "AltRight" => Some("Alt"),
        "Shift" | "ShiftLeft" | "ShiftRight" => Some("Shift"),
        "Meta" | "MetaLeft" | "MetaRight" => Some("Meta"),
        _ => None,
    }
}
fn standalone_key(key: &str) -> bool {
    key.starts_with("Numpad")
        || key
            .strip_prefix('F')
            .and_then(|n| n.parse::<u8>().ok())
            .map(|n| (1..=24).contains(&n))
            .unwrap_or(false)
}

pub fn keys_to_hotkey(keys: Vec<String>) -> Result<HotkeyConfig, String> {
    let mut modifiers = Vec::new();
    let mut primary = None;
    for key in &keys {
        if let Some(modifier) = modifier_name(key) {
            if !modifiers.contains(&modifier) {
                modifiers.push(modifier);
            }
        } else if primary.replace(key.clone()).is_some() {
            return Err("快捷键必须恰好包含一个主键，不能同时录入多个普通按键".into());
        }
    }
    let key = primary.ok_or_else(|| "快捷键缺少主键".to_string())?;
    Code::from_str(&key).map_err(|_| format!("当前系统不支持按键代码 {key}"))?;
    #[cfg(target_os = "windows")]
    if matches!(key.as_str(), "NumpadEnter" | "NumpadEqual") {
        return Err(
            "Windows 的全局快捷键接口无法独立区分这个小键盘键，请改用小键盘数字键或 F 键".into(),
        );
    }
    if modifiers.is_empty() && !standalone_key(&key) {
        return Err(
            "普通按键需搭配 Control / Alt / Shift / Command；F1–F24 或数字小键盘可单独使用".into(),
        );
    }
    let modifiers: Vec<String> = MODIFIER_ORDER
        .iter()
        .filter(|m| modifiers.contains(m))
        .map(|m| (*m).to_string())
        .collect();
    let mut display: Vec<String> = modifiers
        .iter()
        .map(|m| {
            match m.as_str() {
                "Control" => {
                    if cfg!(target_os = "macos") {
                        "⌃"
                    } else {
                        "Ctrl"
                    }
                }
                "Alt" => {
                    if cfg!(target_os = "macos") {
                        "⌥"
                    } else {
                        "Alt"
                    }
                }
                "Shift" => "⇧",
                "Meta" => {
                    if cfg!(target_os = "macos") {
                        "⌘"
                    } else {
                        "Win"
                    }
                }
                _ => unreachable!(),
            }
            .to_string()
        })
        .collect();
    display.push(display_key(&key));
    Ok(HotkeyConfig {
        modifiers,
        key,
        shortcut: display.join("+"),
    })
}

fn normalize_hotkey(hotkey: &HotkeyConfig) -> Result<HotkeyConfig, String> {
    if hotkey
        .modifiers
        .iter()
        .any(|key| modifier_name(key).is_none())
    {
        return Err("快捷键含有未知修饰键".into());
    }
    let mut keys = hotkey.modifiers.clone();
    keys.push(hotkey.key.clone());
    keys_to_hotkey(keys)
}

fn parse_shortcut(hotkey: &HotkeyConfig) -> Result<Shortcut, String> {
    let mut modifiers = Modifiers::empty();
    for key in &hotkey.modifiers {
        modifiers |= match key.as_str() {
            "Control" => Modifiers::CONTROL,
            "Alt" => Modifiers::ALT,
            "Shift" => Modifiers::SHIFT,
            "Meta" => Modifiers::META,
            _ => return Err("快捷键含有未知修饰键".into()),
        };
    }
    let code = Code::from_str(&hotkey.key).map_err(|_| format!("无效的主键 {}", hotkey.key))?;
    Ok(Shortcut::new(Some(modifiers), code))
}

fn normalize_settings(mut next: AppSettings) -> Result<AppSettings, String> {
    next.trans_hotkey = normalize_hotkey(&next.trans_hotkey)?;
    for phrase in &mut next.phrases {
        if !phrase.enabled && phrase.hotkey.key.is_empty() && phrase.hotkey.modifiers.is_empty() {
            phrase.hotkey.shortcut.clear();
            continue;
        }
        phrase.hotkey =
            normalize_hotkey(&phrase.hotkey).map_err(|e| format!("常用语 #{}：{e}", phrase.id))?;
    }
    crate::store::validate_settings(&next).map_err(|e| e.to_string())?;
    Ok(next)
}

fn distinct_bindings(bindings: &[Binding]) -> Result<(), String> {
    let mut seen = HashMap::new();
    for binding in bindings {
        if let Some(previous) = seen.insert(binding.shortcut.id(), &binding.label) {
            return Err(format!(
                "快捷键冲突：{previous} 与 {} 使用了同一组合，请修改或关闭其中一个",
                binding.label
            ));
        }
    }
    Ok(())
}
fn bindings_for(settings: &AppSettings) -> Result<Vec<Binding>, String> {
    let mut bindings = vec![Binding {
        shortcut: parse_shortcut(&settings.trans_hotkey)?,
        action: Action::Translate,
        label: "翻译快捷键".into(),
    }];
    if settings.phrases_enabled {
        for phrase in settings.phrases.iter().filter(|p| p.enabled) {
            bindings.push(Binding {
                shortcut: parse_shortcut(&phrase.hotkey)?,
                action: Action::Phrase(phrase.phrase.clone()),
                label: format!("常用语 #{}", phrase.id),
            });
        }
    }
    distinct_bindings(&bindings)?;
    Ok(bindings)
}

// ---------------------------------------------------------------------------
// 注册事务：保留真实已安装表，任何失败均尽力回滚；不使用丢弃内部状态的 unregister_all
// ---------------------------------------------------------------------------

fn register_binding(app: &AppHandle, binding: &Binding) -> Result<(), String> {
    let action = binding.action.clone();
    let armed = AtomicU64::new(0);
    app.global_shortcut()
        .on_shortcut(binding.shortcut, move |app, _, event| {
            if event.state() == ShortcutState::Pressed {
                let mode = SHORTCUT_MODE.load(Ordering::Acquire);
                armed.store(
                    if mode & 1 == 0 {
                        mode.wrapping_add(1)
                    } else {
                        0
                    },
                    Ordering::Release,
                );
                return;
            }
            let mode = SHORTCUT_MODE.load(Ordering::Acquire);
            if event.state() != ShortcutState::Released
                || mode & 1 != 0
                || armed.swap(0, Ordering::AcqRel) != mode.wrapping_add(1)
            {
                return;
            }
            let app = app.clone();
            let action = action.clone();
            tauri::async_runtime::spawn(async move {
                let result = match action {
                    Action::Translate => trans_and_replace_text(&app).await,
                    Action::Phrase(text) => send_phrase(&app, &text).await,
                };
                if let Err(error) = result {
                    report_status(&app, "error", &format!("{error:#}"));
                }
            });
        })
        .map_err(|e| {
            format!(
                "{} 注册失败，组合可能被其他应用占用或系统不支持：{e}",
                binding.label
            )
        })
}

fn remove_bindings(app: &AppHandle, registry: &mut Registry) -> Result<(), String> {
    let mut errors = Vec::new();
    for index in (0..registry.bindings.len()).rev() {
        let binding = &registry.bindings[index];
        match app.global_shortcut().unregister(binding.shortcut) {
            Ok(()) => {
                registry.bindings.remove(index);
            }
            Err(error) => errors.push(format!("{} 注销失败：{error}", binding.label)),
        }
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors.join("；"))
    }
}

fn restore_bindings(
    app: &AppHandle,
    registry: &mut Registry,
    previous: &[Binding],
) -> Result<(), String> {
    let mut errors = Vec::new();
    if let Err(error) = remove_bindings(app, registry) {
        errors.push(error);
    }
    for binding in previous {
        if let Some(installed) = registry
            .bindings
            .iter()
            .find(|b| b.shortcut.id() == binding.shortcut.id())
        {
            if installed.action != binding.action {
                errors.push(format!("{} 无法恢复旧回调", binding.label));
            }
            continue;
        }
        match register_binding(app, binding) {
            Ok(()) => registry.bindings.push(binding.clone()),
            Err(error) => errors.push(error),
        }
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(format!(
            "恢复旧快捷键失败，请重启 DeepRant：{}",
            errors.join("；")
        ))
    }
}

fn switch_bindings(
    app: &AppHandle,
    registry: &mut Registry,
    next: &[Binding],
) -> Result<(), String> {
    remove_bindings(app, registry)?;
    for binding in next {
        register_binding(app, binding)?;
        registry.bindings.push(binding.clone());
    }
    Ok(())
}

fn commit_with_registry(
    app: &AppHandle,
    registry: &mut Registry,
    next: AppSettings,
) -> Result<AppSettings, String> {
    let next = normalize_settings(next)?;
    let bindings = bindings_for(&next)?;
    let previous = registry.bindings.clone();
    let result = switch_bindings(app, registry, &bindings).and_then(|_| {
        crate::store::replace_settings(app, &next).map_err(|e| format!("保存设置失败：{e}"))
    });
    if let Err(error) = result {
        let error = match restore_bindings(app, registry, &previous) {
            Ok(()) => error,
            Err(rollback) => format!("{error}；{rollback}"),
        };
        registry.last_error = Some(error.clone());
        return Err(error);
    }
    registry.last_error = None;
    // store 只合并快捷键职责字段；返回最新模型/翻译配置，避免 UI 覆盖其他已完成的修改。
    get_settings(app).map_err(|e| format!("快捷键已保存，但读取设置失败：{e}"))
}

pub fn commit_shortcut_settings(app: &AppHandle, next: AppSettings) -> Result<AppSettings, String> {
    let mut registry = REGISTRY
        .lock()
        .map_err(|_| "快捷键状态异常，请重启 DeepRant".to_string())?;
    commit_with_registry(app, &mut registry, next)
}

pub fn change_shortcut_settings(
    app: &AppHandle,
    update: impl FnOnce(&mut AppSettings) -> Result<(), String>,
) -> Result<AppSettings, String> {
    let mut registry = REGISTRY
        .lock()
        .map_err(|_| "快捷键状态异常，请重启 DeepRant".to_string())?;
    let mut next = get_settings(app).map_err(|e| e.to_string())?;
    update(&mut next)?;
    commit_with_registry(app, &mut registry, next)
}

pub fn init_shortcuts(app: &AppHandle) -> Result<(), String> {
    let result = get_settings(app)
        .map_err(|e| e.to_string())
        .and_then(|settings| commit_shortcut_settings(app, settings).map(|_| ()));
    if let Err(error) = &result {
        if let Ok(mut registry) = REGISTRY.lock() {
            registry.last_error = Some(error.clone());
        }
    }
    result
}

pub fn get_shortcut_status() -> Option<String> {
    REGISTRY
        .lock()
        .map(|registry| registry.last_error.clone())
        .unwrap_or_else(|_| Some("快捷键状态异常，请重启 DeepRant".into()))
}

pub fn set_shortcuts_paused(paused: bool) {
    let _ = SHORTCUT_MODE.fetch_update(Ordering::AcqRel, Ordering::Acquire, |mode| {
        Some((mode & !1).wrapping_add(2) | u64::from(paused))
    });
}

pub fn update_translator_shortcut(app: &AppHandle, keys: Vec<String>) -> Result<(), String> {
    let hotkey = keys_to_hotkey(keys)?;
    change_shortcut_settings(app, |next| {
        next.trans_hotkey = hotkey;
        Ok(())
    })
    .map(|_| ())
}

pub fn reload_shortcuts(app: &AppHandle) -> Result<(), String> {
    init_shortcuts(app)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn keys(input: &[&str]) -> Vec<String> {
        input.iter().map(|k| (*k).to_string()).collect()
    }
    #[test]
    fn recording_contract_normalizes_keys_and_rejects_internal_conflicts() {
        let hotkey =
            keys_to_hotkey(keys(&["ShiftRight", "ControlLeft", "ControlRight", "KeyT"])).unwrap();
        assert_eq!(hotkey.modifiers, keys(&["Control", "Shift"]));
        for key in ["Numpad0", "F13", "F24"] {
            assert!(keys_to_hotkey(keys(&[key])).is_ok());
        }
        #[cfg(target_os = "windows")]
        for key in ["NumpadEnter", "NumpadEqual"] {
            assert!(keys_to_hotkey(keys(&[key])).is_err());
        }
        for combination in [
            &["KeyT"][..],
            &["Control"],
            &["Control", "KeyT", "KeyA"],
            &["NotAKey"],
        ] {
            assert!(keys_to_hotkey(keys(combination)).is_err());
        }
        let binding = Binding {
            shortcut: parse_shortcut(&hotkey).unwrap(),
            action: Action::Translate,
            label: "翻译".into(),
        };
        assert!(distinct_bindings(&[
            binding.clone(),
            Binding {
                label: "常用语".into(),
                ..binding
            }
        ])
        .is_err());
    }
}
