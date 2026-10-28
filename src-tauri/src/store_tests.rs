/**
 * [INPUT]: 依赖 store 的设置解码、补丁校验、持久化形状与端点规范，以及 settings_db 的临时目录事务
 * [OUTPUT]: 提供旧设置迁移、严格校验及数据库往返的回归测试
 * [POS]: store 的单元测试边界；隔离磁盘与解析验证，不访问系统凭据或桌面运行时
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use super::*;

#[test]
fn legacy_runtime_fields_are_discarded_without_losing_saved_configuration() {
    let configured = AppSettings {
        trans_hotkey: HotkeyConfig::new_platform_specific("F8"),
        translation_from: "ja".into(),
        translation_to: "zh".into(),
        model_type: "custom".into(),
        custom_model: ModelConfig {
            api_url: "https://example.com/v1/chat/completions".into(),
            model_name: "retained-model".into(),
            reasoning_model: true,
            ..ModelConfig::default()
        },
        phrases: vec![Phrase {
            id: 42,
            phrase: "保留用户常用语".into(),
            hotkey: HotkeyConfig::new_platform_specific("F7"),
            enabled: false,
        }],
        phrases_enabled: true,
        ..AppSettings::default()
    };
    let expected = serialized_settings(&configured);
    let mut legacy = expected.clone();
    legacy["custom_model"]["has_api_key"] = json!(true);
    legacy["custom_model"]["is_local"] = json!(true);
    legacy["custom_model"]["official_deepseek"] = json!(false);
    legacy["custom_model"]["auth"] = json!("legacy-migration-secret");

    let (restored, key) = decode_settings(legacy).unwrap();
    assert_eq!(key, Some(json!("legacy-migration-secret")));
    assert!(!restored.custom_model.has_api_key);
    assert!(!restored.custom_model.is_local);
    assert_eq!(
        restored.custom_model.official_deepseek,
        ModelConfig::default().official_deepseek
    );
    let persisted = serialized_settings(&restored);
    assert_eq!(persisted, expected);
    for field in ["auth", "has_api_key", "is_local", "official_deepseek"] {
        assert!(persisted["custom_model"].get(field).is_none(), "{field}");
    }
}

#[test]
fn version_1_1_7_settings_keep_user_values_and_fill_new_defaults() {
    let hotkey = json!({"modifiers": ["Alt"], "key": "KeyQ", "shortcut": "Alt+Q"});
    let legacy = json!({
        "trans_hotkey": hotkey,
        "translation_from": "zh",
        "translation_to": "en",
        "game_scene": "dota2",
        "translation_mode": "toxic",
        "daily_mode": true,
        "model_type": "custom",
        "custom_model": {
            "auth": "version-1-1-7-secret",
            "api_url": "https://example.com/v1/chat/completions",
            "model_name": "user-model"
        },
        "phrases": [{"id": 7, "phrase": "保留旧版短语", "hotkey": hotkey}],
        "phrases_enabled": true
    });

    let (restored, key) = decode_settings(legacy.clone()).unwrap();
    assert_eq!(key, Some(json!("version-1-1-7-secret")));
    let persisted = serialized_settings(&restored);
    assert_eq!(persisted["trans_hotkey"], legacy["trans_hotkey"]);
    assert_eq!(
        persisted["phrases"][0]["hotkey"],
        legacy["phrases"][0]["hotkey"]
    );
    assert_eq!(restored.phrases[0].phrase, "保留旧版短语");
    assert!(restored.phrases[0].enabled && restored.phrases_enabled && restored.daily_mode);
    assert_eq!(
        restored.custom_model.api_url,
        legacy["custom_model"]["api_url"].as_str().unwrap()
    );
    assert_eq!(restored.custom_model.model_name, "user-model");
    assert_eq!(restored.custom_model.protocol, "openai");
    assert_eq!(restored.input_mode, "auto");
    assert_eq!(restored.ui_language, "zh");
    assert_eq!(restored.appearance, "system");
    assert!(persisted["custom_model"].get("auth").is_none());
    assert!(!persisted.to_string().contains("version-1-1-7-secret"));
    assert_eq!(decode_settings(json!({})).unwrap().1, None);
    assert_eq!(
        decode_settings(json!({"custom_model": {"auth": null}}))
            .unwrap()
            .1,
        Some(Value::Null)
    );
}

#[test]
fn settings_decode_rejects_corrupt_fields_without_exposing_values() {
    let private_value = "private-value-must-never-appear-in-errors";
    for raw in [
        json!({"unknown": private_value}),
        json!({"custom_model": {"unknown": private_value}}),
        json!({"custom_model": null}),
        json!({"trans_hotkey": null}),
        json!({"phrases": null}),
        json!({"phrases": [{"id": 1, "phrase": private_value, "hotkey": null}]}),
        json!({"daily_mode": private_value}),
        json!({"custom_model": {"model_name": [private_value]}}),
        json!({"custom_model": {"auth": true}}),
        json!({"custom_model": {"auth": 782347928}}),
        json!({"custom_model": {"auth": [private_value]}}),
        json!({"custom_model": {"auth": {"value": private_value}}}),
    ] {
        let error = decode_settings(raw).unwrap_err().to_string();
        assert!(!error.contains(private_value));
        assert!(!error.contains("782347928"));
    }
}

#[test]
fn legacy_root_layout_keeps_unknown_metadata_and_every_setting() {
    let mut configured = AppSettings {
        trans_hotkey: HotkeyConfig::new_platform_specific("NumpadEnter"),
        phrases_enabled: true,
        ui_language: "en".into(),
        appearance: "dark".into(),
        custom_instructions: "保持原意".into(),
        ..AppSettings::default()
    };
    configured.phrases[0].phrase = "保留常用语和快捷键".into();
    configured.phrases[0].hotkey = HotkeyConfig::new_platform_specific("F7");
    configured.phrases[0].enabled = false;
    let settings = serialized_settings(&configured);
    let mut direct = settings.clone();
    direct["other"] = json!({"retained": true});
    let canonical = canonical_root(direct);
    assert_eq!(canonical["settings"], settings);
    assert_eq!(canonical["other"], json!({"retained": true}));
    assert_eq!(canonical_root(canonical.clone()), canonical);
    let directory = tempfile::tempdir().unwrap();
    crate::settings_db::write(directory.path(), &canonical, false).unwrap();
    let persisted = crate::settings_db::read(directory.path()).unwrap().root;
    assert_eq!(persisted, canonical);
    let restored: AppSettings = serde_json::from_value(persisted["settings"].clone()).unwrap();
    assert_eq!(serialized_settings(&restored), settings);
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
    assert_eq!(defaults.input_mode, "auto");
    assert!(apply_patch(&current, json!({"input_mode": "hook"})).is_err());
    assert_eq!(defaults.appearance, "system");
    assert!(apply_patch(&current, json!({"appearance": "sepia"})).is_err());
    assert_eq!(
        apply_patch(&current, json!({"appearance": "dark"}))
            .unwrap()
            .0
            .appearance,
        "dark"
    );
    assert_eq!(
        apply_patch(&current, json!({"input_mode": "compose"}))
            .unwrap()
            .0
            .input_mode,
        "compose"
    );
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

#[test]
fn private_network_endpoints_accept_http_but_public_hosts_require_https() {
    for host in [
        "192.168.1.20:3000",
        "10.0.0.8",
        "172.31.255.1",
        "169.254.10.2",
        "100.101.102.103",
        "[fd12:3456::1]",
        "[fe80::1]",
        "relay.local:8080",
    ] {
        let endpoint = normalize_api_url(&format!("http://{host}"), "openai").unwrap();
        assert_eq!(endpoint, format!("http://{host}/v1/chat/completions"));
        let url = reqwest::Url::parse(&endpoint).unwrap();
        assert!(key_optional(&url) && !is_loopback(&url), "{host}");
    }
    for host in [
        "8.8.8.8",
        "172.32.0.1",
        "100.128.0.1",
        "192.169.0.1",
        "[2001:db8::1]",
        "local",
        "relay.local.example.com",
        "nas",
    ] {
        assert!(
            normalize_api_url(&format!("http://{host}"), "openai").is_err(),
            "{host}"
        );
    }
    let public = reqwest::Url::parse("https://192.168.1.20.nip.io/v1").unwrap();
    assert!(!key_optional(&public));
}
