/**
 * [INPUT]: reqwest URL 解析与序列化契约；store 和模型管道复用同一端点规范。
 * [OUTPUT]: ModelConfig、端点归一、回环分类与仅供界面渲染的服务属性。
 * [POS]: 模型配置和 URL 策略的原生唯一边界；前端不维护供应商地址或安全判断。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use anyhow::{anyhow, bail, Result};
use reqwest::Url;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct ModelConfig {
    pub api_url: String,
    pub model_name: String,
    pub protocol: String,
    pub reasoning_model: bool,
    #[serde(skip_deserializing)]
    pub has_api_key: bool,
    #[serde(skip_deserializing)]
    pub is_local: bool,
    #[serde(skip_deserializing)]
    pub official_deepseek: bool,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.deepseek.com/chat/completions".into(),
            model_name: "deepseek-flash".into(),
            protocol: "openai".into(),
            reasoning_model: false,
            has_api_key: false,
            is_local: false,
            official_deepseek: true,
        }
    }
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

#[derive(serde::Serialize)]
pub struct EndpointInfo {
    pub is_local: bool,
    pub official_deepseek: bool,
}

pub fn inspect(raw: &str, protocol: &str) -> Result<EndpointInfo> {
    let endpoint = normalize_api_url(raw, protocol)?;
    let url = Url::parse(&endpoint)?;
    Ok(EndpointInfo {
        is_local: is_loopback(&url),
        official_deepseek: url.scheme() == "https" && url.host_str() == Some("api.deepseek.com"),
    })
}

#[tauri::command]
pub fn inspect_model_endpoint(api_url: String, protocol: String) -> Result<EndpointInfo, String> {
    inspect(&api_url, &protocol).map_err(|error| error.to_string())
}
