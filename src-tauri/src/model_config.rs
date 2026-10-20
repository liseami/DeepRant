/**
 * [INPUT]: reqwest URL 解析与序列化契约；store 和模型管道复用同一端点规范。
 * [OUTPUT]: ModelConfig、端点归一、回环 / 私有网络分类与仅供界面渲染的服务属性。
 * [POS]: 模型配置和 URL 策略的原生唯一边界；前端不维护供应商地址或安全判断。
 *        回环与私有网络由用户自管：允许 HTTP、Key 可选；公网只接受 HTTPS 且必须有 Key。
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
    if url.scheme() == "http" && !key_optional(&url) {
        bail!("公网 API 请使用 HTTPS；本机或局域网服务（localhost、192.168.x.x、10.x.x.x、*.local 等）可使用 HTTP");
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

/// 私有网络：RFC 1918、链路本地、CGNAT 共享段（Tailscale 等虚拟局域网）、IPv6 ULA 与 mDNS `.local`。
/// 只认 IP 字面量和 mDNS 后缀；普通域名的解析结果不参与判断。
pub fn is_private_network(url: &Url) -> bool {
    let host = url.host_str().unwrap_or_default().trim_matches(['[', ']']);
    if host.to_ascii_lowercase().ends_with(".local") {
        return true;
    }
    match host.parse::<std::net::IpAddr>() {
        Ok(std::net::IpAddr::V4(ip)) => {
            let [first, second, ..] = ip.octets();
            ip.is_private() || ip.is_link_local() || (first == 100 && second & 0xc0 == 64)
        }
        Ok(std::net::IpAddr::V6(ip)) => ip.is_unique_local() || ip.is_unicast_link_local(),
        Err(_) => false,
    }
}

/// 用户自管的服务：可用 HTTP，Key 按服务需要填写。
pub fn key_optional(url: &Url) -> bool {
    is_loopback(url) || is_private_network(url)
}

#[derive(serde::Serialize)]
pub struct EndpointInfo {
    pub is_local: bool,
    pub private_network: bool,
    pub official_deepseek: bool,
}

pub fn inspect(raw: &str, protocol: &str) -> Result<EndpointInfo> {
    let endpoint = normalize_api_url(raw, protocol)?;
    let url = Url::parse(&endpoint)?;
    Ok(EndpointInfo {
        is_local: is_loopback(&url),
        private_network: is_private_network(&url),
        official_deepseek: url.scheme() == "https" && url.host_str() == Some("api.deepseek.com"),
    })
}

#[tauri::command]
pub fn inspect_model_endpoint(api_url: String, protocol: String) -> Result<EndpointInfo, String> {
    inspect(&api_url, &protocol).map_err(|error| error.to_string())
}
