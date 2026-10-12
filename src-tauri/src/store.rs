/**
 * [INPUT]: 依赖 tauri_plugin_store 的 JSON 持久化；依赖 serde 反序列化旧版 store.json
 * [OUTPUT]: 提供 AppSettings / Phrase / HotkeyConfig / ModelConfig，以及字段级更新与常用语 CRUD
 * [POS]: 设置的唯一写入口。shortcut 与 ai_translator 只读这里。旧字段缺失时用默认值，禁止因升级崩盘。
 * [PROTOCOL]: Update this header on change, then check CLAUDE.md
 */

use serde_json::{json, Value};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILENAME: &str = "store.json";

fn default_true() -> bool {
    true
}

fn default_ui_language() -> String {
    "zh".to_string()
}

fn default_model_type() -> String {
    "custom".to_string()
}

// ---------------------------------------------------------------------------
// 模型
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ModelConfig {
    pub auth: String,
    pub api_url: String,
    pub model_name: String,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            auth: String::new(),
            api_url: "https://api.deepseek.com/v1/chat/completions".to_string(),
            model_name: "deepseek-chat".to_string(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Phrase {
    pub id: i32,
    pub phrase: String,
    pub hotkey: HotkeyConfig,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HotkeyConfig {
    pub modifiers: Vec<String>,
    pub key: String,
    pub shortcut: String,
}

impl HotkeyConfig {
    pub fn new_platform_specific(key: &str) -> Self {
        #[cfg(target_os = "macos")]
        let (modifier, symbol) = ("Meta", "⌘");
        #[cfg(not(target_os = "macos"))]
        let (modifier, symbol) = ("Alt", "Alt");

        Self {
            modifiers: vec![modifier.to_string()],
            key: key.to_string(),
            shortcut: format!("{}+{}", symbol, display_key(key)),
        }
    }
}

pub fn display_key(key: &str) -> String {
    if let Some(rest) = key.strip_prefix("Key") {
        return rest.to_string();
    }
    if let Some(rest) = key.strip_prefix("Digit") {
        return rest.to_string();
    }
    if let Some(rest) = key.strip_prefix("Numpad") {
        return format!("Num{}", rest);
    }
    match key {
        "Space" => "空格".to_string(),
        "Tab" => "Tab".to_string(),
        "Enter" => "↵".to_string(),
        "NumpadEnter" => "Num↵".to_string(),
        "Backspace" => "⌫".to_string(),
        "Delete" => "Del".to_string(),
        "Escape" => "Esc".to_string(),
        "ArrowUp" => "↑".to_string(),
        "ArrowDown" => "↓".to_string(),
        "ArrowLeft" => "←".to_string(),
        "ArrowRight" => "→".to_string(),
        _ => key.to_string(),
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppSettings {
    pub trans_hotkey: HotkeyConfig,
    pub translation_from: String,
    pub translation_to: String,
    pub game_scene: String,
    pub translation_mode: String,
    pub daily_mode: bool,
    #[serde(default = "default_model_type")]
    pub model_type: String,
    #[serde(default)]
    pub custom_model: ModelConfig,
    pub phrases: Vec<Phrase>,
    #[serde(default = "default_true")]
    pub phrases_enabled: bool,
    #[serde(default)]
    pub custom_scene_name: String,
    #[serde(default)]
    pub custom_scene_prompt: String,
    #[serde(default)]
    pub custom_glossary: String,
    #[serde(default = "default_ui_language")]
    pub ui_language: String,
}

// ---------------------------------------------------------------------------
// 默认值
// ---------------------------------------------------------------------------

fn default_phrases() -> Vec<Phrase> {
    (1..=8)
        .map(|id| {
            let phrase = match id {
                1 => "已使自身本场比赛的积分得失加倍！",
                2 => "由于挂机行为已经被系统从游戏中踢出...",
                3 => "已经放弃了游戏，这场比赛不计入天梯积分，剩余玩家可以自由退出。",
                4 => "由于长时间没有重连至游戏，系统判定他为逃跑。玩家现在离开该场比赛将不会被判定为放弃！",
                5 => "已经放弃了游戏，系统判定他为逃跑。玩家现在离开该场比赛将不会被判定为放弃。",
                6 => "检测到网络的连接情况非常糟糕，本场比赛将不会计入数据。现在可以安全离开比赛。",
                7 => "已经连续258次预测他们队伍将取得胜利！",
                8 => "经系统检测：玩家XXXXXX存在代练或共享账号嫌疑，遵守社区游戏规范，再次违反将进行封禁处理。",
                _ => unreachable!(),
            };
            Phrase {
                id,
                phrase: phrase.to_string(),
                hotkey: HotkeyConfig::new_platform_specific(&format!("Digit{}", id)),
                enabled: true,
            }
        })
        .collect()
}

fn default_settings_value() -> Value {
    json!({
        "trans_hotkey": HotkeyConfig::new_platform_specific("KeyT"),
        "translation_from": "zh",
        "translation_to": "en",
        "game_scene": "dota2",
        "translation_mode": "toxic",
        "daily_mode": false,
        "model_type": "custom",
        "custom_model": ModelConfig::default(),
        "phrases": default_phrases(),
        "phrases_enabled": true,
        "custom_scene_name": "",
        "custom_scene_prompt": "",
        "custom_glossary": "",
        "ui_language": "zh"
    })
}

pub fn initialize_settings(app: &AppHandle) -> Result<(), anyhow::Error> {
    let store = app.store(STORE_FILENAME)?;
    if store.get("settings").is_none() {
        store.set("settings", default_settings_value());
        store.save()?;
    }
    store.close_resource();
    Ok(())
}

pub fn get_settings(app: &AppHandle) -> Result<AppSettings, anyhow::Error> {
    let store = app.store(STORE_FILENAME)?;
    let raw = store
        .get("settings")
        .unwrap_or_else(default_settings_value);
    let settings: AppSettings = serde_json::from_value(raw)?;
    Ok(settings)
}

pub fn update_settings_field<T: serde::Serialize>(
    app: &AppHandle,
    field_updater: impl FnOnce(&mut AppSettings) -> T,
) -> Result<T, anyhow::Error> {
    let store = app.store(STORE_FILENAME)?;
    let mut settings = get_settings(app)?;
    let result = field_updater(&mut settings);
    store.set("settings", json!(settings));
    store.save()?;
    Ok(result)
}

pub fn update_phrase_text(app: &AppHandle, id: i32, phrase: String) -> Result<(), anyhow::Error> {
    update_settings_field(app, |settings| {
        if let Some(item) = settings.phrases.iter_mut().find(|p| p.id == id) {
            item.phrase = phrase;
        }
    })
}

pub fn update_phrase_hotkey(
    app: &AppHandle,
    id: i32,
    hotkey: HotkeyConfig,
) -> Result<(), anyhow::Error> {
    update_settings_field(app, |settings| {
        if let Some(item) = settings.phrases.iter_mut().find(|p| p.id == id) {
            item.hotkey = hotkey;
        }
    })
}

pub fn set_phrase_enabled(app: &AppHandle, id: i32, enabled: bool) -> Result<(), anyhow::Error> {
    update_settings_field(app, |settings| {
        if let Some(item) = settings.phrases.iter_mut().find(|p| p.id == id) {
            item.enabled = enabled;
        }
    })
}

pub fn set_phrases_enabled(app: &AppHandle, enabled: bool) -> Result<(), anyhow::Error> {
    update_settings_field(app, |settings| {
        settings.phrases_enabled = enabled;
    })
}
