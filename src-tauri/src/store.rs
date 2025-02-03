use serde_json::{json, Value};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILENAME: &str = "store.json";

// 添加模型配置结构体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ModelConfig {
    pub auth: String,
    pub api_url: String,
    pub model_name: String,
}

// 添加常用语结构体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Phrase {
    pub id: i32,
    pub phrase: String,
    pub hotkey: HotkeyConfig,
}

// 新增 HotkeyConfig 结构体
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HotkeyConfig {
    pub modifiers: Vec<String>,
    pub key: String,
    pub shortcut: String,
}

impl HotkeyConfig {
    // 创建平台特定的快捷键配置
    fn new_platform_specific(key: &str) -> Self {
        #[cfg(target_os = "macos")]
        let (modifier, symbol) = ("Meta", "⌘");
        #[cfg(not(target_os = "macos"))]
        let (modifier, symbol) = ("Alt", "Alt");

        Self {
            modifiers: vec![modifier.to_string()],
            key: key.to_string(),
            shortcut: format!("{}+{}", symbol, key.replace("Key", "").replace("Digit", "")),
        }
    }
}

// 应用设置结构体
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AppSettings {
    pub trans_hotkey: HotkeyConfig,
    pub translation_from: String,
    pub translation_to: String,
    pub game_scene: String,
    pub translation_mode: String,
    pub daily_mode: bool,
    pub model_type: String,
    pub custom_model: ModelConfig,
    pub phrases: Vec<Phrase>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            trans_hotkey: HotkeyConfig::new_platform_specific("KeyT"),
            translation_from: "zh".to_string(),
            translation_to: "en".to_string(),
            game_scene: "dota2".to_string(),
            translation_mode: "toxic".to_string(),
            daily_mode: false,
            model_type: "deepseek".to_string(),
            custom_model: ModelConfig {
                auth: "".to_string(),
                api_url: "https://api.openai.com/v1/chat/completions".to_string(),
                model_name: "gpt-3.5-turbo".to_string(),
            },
            phrases: [
                "已使自身本场比赛的积分得失加倍！",
                "由于挂机行为已经被系统从游戏中踢出...",
                "已经放弃了游戏，这场比赛不计入天梯积分，剩余玩家可以自由退出。",
                "由于长时间没有重连至游戏，系统判定他为逃跑。玩家现在离开该场比赛将不会被判定为放弃！",
                "已经放弃了游戏，系统判定他为逃跑。玩家现在离开该场比赛将不会被判定为放弃。",
                "检测到网络的连接情况非常糟糕，本场比赛将不会计入数据。现在可以安全离开比赛。",
                "已经连续258次预测他们队伍将取得胜利！",
                "经系统检测：玩家XXXXXX存在代练或共享账号嫌疑，遵守社区游戏规范，再次违反将进行封禁处理。",
            ]
            .into_iter()
            .enumerate()
            .map(|(idx, phrase)| {
                let id = idx as i32 +1;
                Phrase {
                    id,
                    phrase: phrase.to_string(),
                    hotkey: HotkeyConfig::new_platform_specific(&format!("Digit{}", id)),
                }
            })
            .collect()
        }
    }
}

// 初始化默认设置
pub fn initialize_settings(app: &AppHandle) -> Result<(), anyhow::Error> {
    let store = app.store(STORE_FILENAME)?;

    // 检查settings是否已存在
    if store.get("settings").is_some() {
        store.close_resource();
        return Ok(());
    }

    store.set("settings", json!(AppSettings::default()));
    store.save()?;
    store.close_resource();

    Ok(())
}

// 获取设置
pub fn get_settings(app: &AppHandle) -> Result<AppSettings, anyhow::Error> {
    let store = app.store(STORE_FILENAME)?;
    let settings: Value = store
        .get("settings")
        .expect("Failed to get value from store");

    Ok(serde_json::from_value(settings)?)
}

// 更新设置中的特定字段
pub fn update_settings_field<T: serde::Serialize>(
    app: &AppHandle,
    field_updater: impl FnOnce(&mut AppSettings) -> T,
) -> Result<T, anyhow::Error> {
    let store = app.store(STORE_FILENAME)?;
    let mut settings = get_settings(app)?;

    // 更新字段
    let result = field_updater(&mut settings);

    // 保存更新后的设置
    store.set("settings", json!(settings));
    store.save()?;

    Ok(result)
}
