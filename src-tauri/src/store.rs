/**
 * [INPUT]: 依赖 std::fs 读取应用数据目录 JSON、tempfile 同目录原子替换与 credentials 的系统凭据
 * [OUTPUT]: 提供 AppSettings、模型配置、校验、设置 patch 与快捷键事务持久化入口
 * [POS]: 设置的唯一写边界；无缓存或自动保存旁路，读错保留原文件，凭据迁移验证后才原子清除旧明文
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use anyhow::{anyhow, bail, Result};
use reqwest::Url;
use serde_json::{json, Value};
use std::collections::HashSet;
use std::fs;
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tempfile::NamedTempFile;

const STORE_FILENAME: &str = "store.json";
const MAX_TEXT_BYTES: usize = 32 * 1024;
static SETTINGS_LOCK: Mutex<()> = Mutex::new(());

// ---------------------------------------------------------------------------
// 模型配置不携带凭据，端点同时决定请求地址与系统凭据账户
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct ModelConfig {
    pub api_url: String,
    pub model_name: String,
    pub protocol: String,
    #[serde(skip_deserializing)]
    pub has_api_key: bool,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.deepseek.com/chat/completions".into(),
            model_name: "deepseek-flash".into(),
            protocol: "openai".into(),
            has_api_key: false,
        }
    }
}

pub fn model_preset(provider: &str) -> Option<ModelConfig> {
    let (api_url, model_name, protocol) = match provider {
        "deepseek" => ("https://api.deepseek.com", "deepseek-flash", "openai"),
        "deepseek-pro" | "deepseek-R1" => ("https://api.deepseek.com", "deepseek-v4-pro", "openai"),
        "openai" => ("https://api.openai.com/v1", "gpt-4.1-mini", "openai"),
        "anthropic" => (
            "https://api.anthropic.com/v1",
            "claude-haiku-5-5",
            "anthropic",
        ),
        "ollama" => ("http://localhost:11434/v1", "qwen3:8b", "openai"),
        "stepfun" => ("https://api.stepfun.com/v1", "step-2-16k", "openai"),
        "siliconflow" => (
            "https://api.siliconflow.cn/v1",
            "deepseek-ai/DeepSeek-V3.2",
            "openai",
        ),
        "custom" => return None,
        _ => return None,
    };
    Some(ModelConfig {
        api_url: api_url.into(),
        model_name: model_name.into(),
        protocol: protocol.into(),
        has_api_key: false,
    })
}

pub fn normalize_api_url(raw: &str, protocol: &str) -> Result<String> {
    if !matches!(protocol, "openai" | "anthropic") {
        bail!("API 协议仅支持 openai 或 anthropic");
    }
    if raw.len() > 2048 {
        bail!("API 地址过长，请填写服务端点");
    }
    let mut url =
        Url::parse(raw.trim()).map_err(|_| anyhow!("API 地址无效，请填写完整 http(s) 地址"))?;
    if !matches!(url.scheme(), "https" | "http") || url.host_str().is_none() {
        bail!("API 地址必须使用 http 或 https");
    }
    if !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        bail!("API 地址不能包含用户名、密码、查询参数或片段；Key 请单独保存");
    }
    if url.scheme() == "http" && !is_loopback(&url) {
        bail!("远程 API 请使用 HTTPS；本地服务可使用 localhost 或回环地址");
    }
    let path = url.path().trim_end_matches('/');
    if (protocol == "openai" && path.ends_with("/messages"))
        || (protocol == "anthropic" && path.ends_with("/chat/completions"))
    {
        bail!("API 端点与协议不匹配，请选择对应的 OpenAI 或 Anthropic 协议");
    }
    let endpoint = if protocol == "anthropic" {
        "/messages"
    } else {
        "/chat/completions"
    };
    let path = if path.ends_with(endpoint) {
        path.to_string()
    } else if path.is_empty() {
        let prefix = if protocol == "openai" && url.host_str() == Some("api.deepseek.com") {
            ""
        } else {
            "/v1"
        };
        format!("{prefix}{endpoint}")
    } else if protocol == "anthropic" && path.ends_with("/anthropic") {
        format!("{path}/v1{endpoint}")
    } else {
        format!("{path}{endpoint}")
    };
    url.set_path(&path);
    Ok(url.to_string())
}

pub fn is_loopback(url: &Url) -> bool {
    let host = url.host_str().unwrap_or_default().trim_matches(['[', ']']);
    host.eq_ignore_ascii_case("localhost")
        || host
            .parse::<std::net::IpAddr>()
            .map(|ip| ip.is_loopback())
            .unwrap_or(false)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Phrase {
    pub id: i32,
    pub phrase: String,
    pub hotkey: HotkeyConfig,
    #[serde(default = "default_true")]
    pub enabled: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
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
            modifiers: vec![modifier.into()],
            key: key.into(),
            shortcut: format!("{}+{}", symbol, display_key(key)),
        }
    }
}

pub fn display_key(key: &str) -> String {
    if key == "NumpadEnter" {
        return "Num↵".to_string();
    }
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
#[serde(default, deny_unknown_fields)]
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
    pub phrases_enabled: bool,
    pub custom_scene_name: String,
    pub custom_scene_prompt: String,
    pub custom_glossary: String,
    pub ui_language: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            trans_hotkey: HotkeyConfig::new_platform_specific("KeyT"),
            translation_from: "zh".into(),
            translation_to: "en".into(),
            game_scene: "dota2".into(),
            translation_mode: "toxic".into(),
            daily_mode: false,
            model_type: "deepseek".into(),
            custom_model: ModelConfig::default(),
            phrases: default_phrases(),
            phrases_enabled: false,
            custom_scene_name: String::new(),
            custom_scene_prompt: String::new(),
            custom_glossary: String::new(),
            ui_language: "zh".into(),
        }
    }
}

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

// ---------------------------------------------------------------------------
// 校验与旧设置迁移：成功写入并读回凭据后才清除旧明文
// ---------------------------------------------------------------------------

pub fn validate_settings(settings: &AppSettings) -> Result<()> {
    if settings.model_type != "custom" && model_preset(&settings.model_type).is_none() {
        bail!("不支持的模型供应商，请选择预设或自定义模型");
    }
    normalize_api_url(
        &settings.custom_model.api_url,
        &settings.custom_model.protocol,
    )?;
    if settings.custom_model.model_name.trim().is_empty()
        || settings.custom_model.model_name.len() > 256
    {
        bail!("模型名称不能为空且不能超过 256 字节");
    }
    for language in [&settings.translation_from, &settings.translation_to] {
        if language.is_empty()
            || language.len() > 32
            || !language
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || c == b'-')
        {
            bail!("翻译语言代码无效，请重新选择语言");
        }
    }
    if !matches!(settings.ui_language.as_str(), "zh" | "en") {
        bail!("界面语言仅支持中文或英文");
    }
    if !matches!(settings.translation_mode.as_str(), "toxic" | "pro" | "auto") {
        bail!("翻译风格无效，请重新选择");
    }
    if settings.game_scene != "custom"
        && !crate::scenes::SCENES
            .iter()
            .any(|scene| scene.id == settings.game_scene)
    {
        bail!("游戏场景无效，请选择预设或自定义场景");
    }
    if settings.custom_scene_name.len() > 256
        || settings.custom_scene_prompt.len() > MAX_TEXT_BYTES
        || settings.custom_glossary.len() > MAX_TEXT_BYTES
    {
        bail!("自定义场景名称或词库过长，请缩短后保存");
    }
    if settings.phrases.len() > 100 {
        bail!("常用语不能超过 100 条");
    }
    let mut ids = HashSet::new();
    for phrase in &settings.phrases {
        if phrase.id < 1 || !ids.insert(phrase.id) {
            bail!("常用语 ID 必须为互不重复的正整数");
        }
        if phrase.phrase.len() > MAX_TEXT_BYTES {
            bail!("常用语过长，请缩短后保存");
        }
    }
    Ok(())
}

fn serialized_settings(settings: &AppSettings) -> Value {
    let mut value = json!(settings);
    if let Some(model) = value.get_mut("custom_model").and_then(Value::as_object_mut) {
        model.remove("has_api_key");
    }
    value
}

fn save_unlocked(app: &AppHandle, settings: &AppSettings) -> Result<()> {
    validate_settings(settings)?;
    let path = settings_path(app)?;
    let mut root = read_settings_file(&path)?;
    root["settings"] = serialized_settings(settings);
    atomic_write_settings_file(&path, &root)
}

fn settings_path(app: &AppHandle) -> Result<PathBuf> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join(STORE_FILENAME))
        .map_err(|_| anyhow!("无法定位应用数据目录，请检查系统用户目录配置"))
}

fn read_settings_file(path: &Path) -> Result<Value> {
    let bytes = match fs::read(path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(json!({})),
        Err(_) => bail!("无法读取设置文件，原文件已保留；请检查应用数据目录权限"),
    };
    let root: Value = serde_json::from_slice(&bytes)
        .map_err(|_| anyhow!("设置文件 JSON 无效，原文件已保留；请备份 store.json 后修复"))?;
    if !root.is_object() {
        bail!("设置文件根节点必须是对象，原文件已保留；请备份 store.json 后修复");
    }
    Ok(root)
}

fn atomic_write_settings_file(path: &Path, root: &Value) -> Result<()> {
    let directory = path.parent().ok_or_else(|| anyhow!("设置文件目录无效"))?;
    let bytes = serde_json::to_vec(root).map_err(|_| anyhow!("无法编码设置，原文件已保留"))?;
    // 临时文件必须与目标同目录；写入与同步失败时不接触旧文件，跨平台 persist 原子覆盖。
    let persist = || -> std::io::Result<()> {
        fs::create_dir_all(directory)?;
        let mut temporary = NamedTempFile::new_in(directory)?;
        temporary.write_all(&bytes)?;
        temporary.as_file().sync_all()?;
        temporary.persist(path).map_err(|error| error.error)?;
        Ok(())
    };
    persist()
        .map_err(|_| anyhow!("设置保存失败，原文件已保留；请检查磁盘空间与应用数据目录权限"))?;
    Ok(())
}

fn refresh_key_state(settings: &mut AppSettings) -> Result<()> {
    let key = crate::credentials::read(
        &settings.custom_model.api_url,
        &settings.custom_model.protocol,
    );
    let local = Url::parse(&settings.custom_model.api_url)
        .map(|url| is_loopback(&url))
        .unwrap_or(false);
    settings.custom_model.has_api_key = match key {
        Ok(key) => key.is_some_and(|key| !key.trim().is_empty()),
        // 无 Key 的本地 Ollama 不依赖用户是否启用 Secret Service。
        Err(_) if local => false,
        Err(error) => return Err(error),
    };
    Ok(())
}

fn load_unlocked(app: &AppHandle) -> Result<AppSettings> {
    let root = read_settings_file(&settings_path(app)?)?;
    let existing = root.get("settings").cloned();
    let mut raw = existing.clone().unwrap_or_else(|| json!({}));
    let legacy_key = raw
        .get_mut("custom_model")
        .and_then(Value::as_object_mut)
        .and_then(|model| model.remove("auth"));
    if legacy_key
        .as_ref()
        .is_some_and(|key| !key.is_string() && !key.is_null())
    {
        bail!("旧 API Key 格式无效，原设置已保留，请先备份 store.json 后修复凭据字段");
    }
    let mut settings: AppSettings = serde_json::from_value(raw)
        .map_err(|_| anyhow!("设置文件格式无效，请备份 store.json 后重新配置"))?;
    settings.custom_model.api_url = normalize_api_url(
        &settings.custom_model.api_url,
        &settings.custom_model.protocol,
    )?;
    // 先记住旧 auth 对应端点，再选择当前供应商；迁移不能把凭据发配到另一家。
    let legacy_endpoint = settings.custom_model.api_url.clone();
    let legacy_protocol = settings.custom_model.protocol.clone();
    if legacy_key.is_some() && settings.model_type != "custom" {
        if let Some(mut preset) = model_preset(&settings.model_type) {
            preset.api_url = normalize_api_url(&preset.api_url, &preset.protocol)?;
            settings.custom_model = preset;
        }
    }
    if settings
        .custom_model
        .api_url
        .starts_with("https://api.deepseek.com/")
        && matches!(
            settings.custom_model.model_name.as_str(),
            "deepseek-chat" | "deepseek-reasoner"
        )
    {
        settings.custom_model.model_name =
            if settings.custom_model.model_name == "deepseek-reasoner" {
                "deepseek-v4-pro"
            } else {
                "deepseek-flash"
            }
            .into();
    }
    validate_settings(&settings)?;
    // 全部设置校验通过之后才修改钥匙串；已有不同凭据时绝不隐式覆盖。
    if let Some(secret) = legacy_key
        .as_ref()
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|key| !key.is_empty())
    {
        match crate::credentials::read(&legacy_endpoint, &legacy_protocol)? {
            Some(existing) if existing != secret => {
                bail!("旧设置与系统凭据库的 API Key 不一致，两者均已保留；请先备份 store.json 并明确选择要使用的凭据");
            }
            Some(_) => {}
            None => crate::credentials::write(&legacy_endpoint, &legacy_protocol, secret)?,
        }
        if crate::credentials::read(&legacy_endpoint, &legacy_protocol)?.as_deref() != Some(secret)
        {
            bail!("旧 API Key 迁移未能验证，原明文设置已保留，请解锁系统凭据库后重试");
        }
    }
    let sanitized = serialized_settings(&settings);
    if existing.as_ref() != Some(&sanitized) {
        save_unlocked(app, &settings)?;
    }
    refresh_key_state(&mut settings)?;
    Ok(settings)
}

pub fn initialize_settings(app: &AppHandle) -> Result<()> {
    get_settings(app).map(|_| ())
}

pub fn get_settings(app: &AppHandle) -> Result<AppSettings> {
    let _guard = SETTINGS_LOCK
        .lock()
        .map_err(|_| anyhow!("设置操作被中断，请重启应用"))?;
    load_unlocked(app)
}

// ---------------------------------------------------------------------------
// 通用 patch 只处理翻译与模型；快捷键字段由注册事务提交
// ---------------------------------------------------------------------------

fn apply_patch(current: &AppSettings, patch: Value) -> Result<(AppSettings, Option<String>)> {
    let object = patch
        .as_object()
        .ok_or_else(|| anyhow!("设置更新必须是对象"))?;
    let mut value = serialized_settings(current);
    let mut secret = None;
    if object.contains_key("model_type") && !object.contains_key("custom_model") {
        if let Some(provider) = object.get("model_type").and_then(Value::as_str) {
            if let Some(preset) = model_preset(provider) {
                value["custom_model"] = serialized_settings(&AppSettings {
                    custom_model: preset,
                    ..current.clone()
                })["custom_model"]
                    .clone();
            }
        }
    }
    for (field, incoming) in object {
        match field.as_str() {
            "translation_from"
            | "translation_to"
            | "game_scene"
            | "translation_mode"
            | "daily_mode"
            | "model_type"
            | "custom_scene_name"
            | "custom_scene_prompt"
            | "custom_glossary"
            | "ui_language" => {
                value[field] = incoming.clone();
            }
            "custom_model" => {
                let model = incoming
                    .as_object()
                    .ok_or_else(|| anyhow!("模型配置必须是对象"))?;
                for (key, setting) in model {
                    match key.as_str() {
                        "auth" => {
                            let key = setting
                                .as_str()
                                .ok_or_else(|| anyhow!("API Key 必须是文本"))?
                                .trim();
                            if key.len() > 8192 || key.contains(['\r', '\n']) {
                                bail!("API Key 格式无效，请填写单行凭据");
                            }
                            if !key.is_empty() {
                                secret = Some(key.to_string());
                            }
                        }
                        "api_url" | "model_name" | "protocol" => {
                            value["custom_model"][key] = setting.clone();
                        }
                        "has_api_key" => {
                            if !setting.is_boolean() {
                                bail!("has_api_key 必须是布尔值");
                            }
                        }
                        _ => bail!("模型配置含不支持的字段"),
                    }
                }
            }
            "trans_hotkey" | "phrases" | "phrases_enabled" => {
                bail!("快捷键与常用语请使用专用命令更新")
            }
            _ => bail!("设置更新含不支持的字段"),
        }
    }
    let mut next: AppSettings =
        serde_json::from_value(value).map_err(|_| anyhow!("设置字段类型无效"))?;
    next.custom_model.api_url =
        normalize_api_url(&next.custom_model.api_url, &next.custom_model.protocol)?;
    next.custom_model.model_name = next.custom_model.model_name.trim().to_string();
    validate_settings(&next)?;
    Ok((next, secret))
}

pub fn update_settings(app: &AppHandle, patch: Value) -> Result<AppSettings> {
    let _guard = SETTINGS_LOCK
        .lock()
        .map_err(|_| anyhow!("设置操作被中断，请重启应用"))?;
    let current = load_unlocked(app)?;
    let (mut next, secret) = apply_patch(&current, patch)?;
    let endpoint = &next.custom_model.api_url;
    let protocol = &next.custom_model.protocol;
    let previous_key = if secret.is_some() {
        crate::credentials::read(endpoint, protocol)?
    } else {
        None
    };
    if let Some(key) = &secret {
        crate::credentials::write(endpoint, protocol, key)?;
    }
    if let Err(error) = save_unlocked(app, &next) {
        if secret.is_some() {
            let rollback = match previous_key {
                Some(key) => crate::credentials::write(endpoint, protocol, &key),
                None => crate::credentials::remove(endpoint, protocol),
            };
            if rollback.is_err() {
                bail!("设置保存失败，凭据回退也失败；请重新保存所需 Key，旧设置已保留");
            }
        }
        return Err(error);
    }
    refresh_key_state(&mut next)?;
    Ok(next)
}

pub fn clear_api_key(app: &AppHandle) -> Result<AppSettings> {
    let _guard = SETTINGS_LOCK
        .lock()
        .map_err(|_| anyhow!("设置操作被中断，请重启应用"))?;
    let mut settings = load_unlocked(app)?;
    crate::credentials::remove(
        &settings.custom_model.api_url,
        &settings.custom_model.protocol,
    )?;
    settings.custom_model.has_api_key = false;
    Ok(settings)
}

/// 快捷键事务专用：仅替换其职责字段，保留其他并发完成的设置更新。
pub fn replace_settings(app: &AppHandle, settings: &AppSettings) -> Result<()> {
    let _guard = SETTINGS_LOCK
        .lock()
        .map_err(|_| anyhow!("设置操作被中断，请重启应用"))?;
    let mut latest = load_unlocked(app)?;
    latest.trans_hotkey = settings.trans_hotkey.clone();
    latest.phrases = settings.phrases.clone();
    latest.phrases_enabled = settings.phrases_enabled;
    save_unlocked(app, &latest)
}

pub fn update_settings_field<T>(
    app: &AppHandle,
    update: impl FnOnce(&mut AppSettings) -> T,
) -> Result<T> {
    let _guard = SETTINGS_LOCK
        .lock()
        .map_err(|_| anyhow!("设置操作被中断，请重启应用"))?;
    let mut settings = load_unlocked(app)?;
    let result = update(&mut settings);
    save_unlocked(app, &settings)?;
    Ok(result)
}

pub fn update_phrase_text(app: &AppHandle, id: i32, phrase: String) -> Result<()> {
    update_settings_field(app, |settings| {
        let item = settings
            .phrases
            .iter_mut()
            .find(|item| item.id == id)
            .ok_or_else(|| anyhow!("常用语不存在，请刷新后重试"))?;
        item.phrase = phrase;
        Ok(())
    })?
}

pub fn update_phrase_hotkey(app: &AppHandle, id: i32, hotkey: HotkeyConfig) -> Result<()> {
    update_settings_field(app, |settings| {
        let item = settings
            .phrases
            .iter_mut()
            .find(|item| item.id == id)
            .ok_or_else(|| anyhow!("常用语不存在，请刷新后重试"))?;
        item.hotkey = hotkey;
        Ok(())
    })?
}

pub fn set_phrase_enabled(app: &AppHandle, id: i32, enabled: bool) -> Result<()> {
    update_settings_field(app, |settings| {
        let item = settings
            .phrases
            .iter_mut()
            .find(|item| item.id == id)
            .ok_or_else(|| anyhow!("常用语不存在，请刷新后重试"))?;
        item.enabled = enabled;
        Ok(())
    })?
}

pub fn set_phrases_enabled(app: &AppHandle, enabled: bool) -> Result<()> {
    update_settings_field(app, |settings| {
        settings.phrases_enabled = enabled;
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn atomic_settings_replace_preserves_other_keys_and_failed_targets() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join(STORE_FILENAME);
        assert_eq!(read_settings_file(&path).unwrap(), json!({}));
        let mut root = json!({"settings": {}, "other": {"retained": true}});
        atomic_write_settings_file(&path, &root).unwrap();
        root["settings"] = serialized_settings(&AppSettings::default());
        atomic_write_settings_file(&path, &root).unwrap();
        assert_eq!(read_settings_file(&path).unwrap(), root);
        assert!(!root["settings"]["phrases_enabled"].as_bool().unwrap());
        let blocked = directory.path().join("directory-target");
        fs::create_dir(&blocked).unwrap();
        fs::write(blocked.join("old-data"), b"retained").unwrap();
        assert!(atomic_write_settings_file(&blocked, &root).is_err());
        assert_eq!(fs::read(blocked.join("old-data")).unwrap(), b"retained");
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 2);
        fs::write(&path, b"{invalid-json").unwrap();
        assert!(read_settings_file(&path).is_err());
        assert_eq!(fs::read(&path).unwrap(), b"{invalid-json");
    }

    #[test]
    fn patch_rejects_invalid_fields_and_never_serializes_credentials() {
        let current = AppSettings::default();
        assert!(apply_patch(&current, json!({"trans_hotkey": {}})).is_err());
        assert!(apply_patch(&current, json!({"unknown": true})).is_err());
        assert!(apply_patch(&current, json!({"daily_mode": "yes"})).is_err());
        let (next, secret) =
            apply_patch(&current, json!({"custom_model": {"auth": "test-secret"}})).unwrap();
        assert_eq!(secret.as_deref(), Some("test-secret"));
        assert!(!serialized_settings(&next)
            .to_string()
            .contains("test-secret"));
        assert!(
            apply_patch(&current, json!({"custom_model": {"auth": " "}}))
                .unwrap()
                .1
                .is_none()
        );
        let defaults: AppSettings = serde_json::from_value(json!({"daily_mode": true})).unwrap();
        assert!(defaults.daily_mode);
        assert_eq!(defaults.custom_model.model_name, "deepseek-flash");
    }

    #[test]
    fn endpoints_are_idempotent_and_disallow_embedded_credentials() {
        for (input, protocol, expected) in [
            (
                "https://api.deepseek.com",
                "openai",
                "https://api.deepseek.com/chat/completions",
            ),
            (
                "https://example.com/v1/",
                "openai",
                "https://example.com/v1/chat/completions",
            ),
            (
                "http://localhost:11434",
                "openai",
                "http://localhost:11434/v1/chat/completions",
            ),
            (
                "https://api.anthropic.com",
                "anthropic",
                "https://api.anthropic.com/v1/messages",
            ),
        ] {
            assert_eq!(normalize_api_url(input, protocol).unwrap(), expected);
            assert_eq!(normalize_api_url(expected, protocol).unwrap(), expected);
        }
        assert!(normalize_api_url("https://key@example.com", "openai").is_err());
        assert!(normalize_api_url("https://example.com?key=secret", "openai").is_err());
        assert!(normalize_api_url("http://example.com", "openai").is_err());
        assert!(normalize_api_url("http://[::1]:11434", "openai").is_ok());
    }
}
