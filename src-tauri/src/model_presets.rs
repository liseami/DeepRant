/**
 * [INPUT]: 依赖 store::ModelConfig；供应商文档仅决定可编辑的起始地址与模型 ID
 * [OUTPUT]: 提供 model_preset 与 get_model_presets，覆盖轻量供应商、腾讯分区及旧标签兼容
 * [POS]: store 与界面的唯一供应商目录；前端仅展示此处返回的预设，已有自定义配置不会在升级时被重置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::store::ModelConfig;

// ---------------------------------------------------------------------------
// 2026-10-12 核对官方文档；所有预设可编辑，不承诺供应商额度或模型长期在线
// OpenAI: https://developers.openai.com/api/docs/models/gpt-6-luna
// DeepSeek: https://api-docs.deepseek.com/
// Tencent: https://cloud.tencent.com/document/product/1823/130079
// SiliconFlow: https://api-docs.siliconflow.cn/docs/api/chat-completions-post
// 302.AI: https://doc.302.ai/171145944e0
// Ollama: https://ollama.com/library/qwen3.5:4b
// ---------------------------------------------------------------------------

pub fn model_preset(provider: &str) -> Option<ModelConfig> {
    let (api_url, model_name, protocol, reasoning_model) = match provider {
        "deepseek" => (
            "https://api.deepseek.com",
            "deepseek-flash",
            "openai",
            false,
        ),
        "deepseek-pro" | "deepseek-R1" => (
            "https://api.deepseek.com",
            "deepseek-v4-pro",
            "openai",
            false,
        ),
        "openai" => ("https://api.openai.com/v1", "gpt-6-luna", "openai", false),
        "anthropic" => (
            "https://api.anthropic.com/v1",
            "claude-haiku-5-5",
            "anthropic",
            false,
        ),
        "tencent" => (
            "https://tokenhub.tencentmaas.com/v1",
            "deepseek/deepseek-flash",
            "openai",
            false,
        ),
        "tencent-intl" => (
            "https://tokenhub-intl.tencentmaas.com/v1",
            "deepseek/deepseek-flash",
            "openai",
            false,
        ),
        "siliconflow" => (
            "https://api.siliconflow.cn/v1",
            "deepseek-ai/DeepSeek-V4-Flash",
            "openai",
            false,
        ),
        "302ai" => (
            "https://api.302.ai/v1",
            "deepseek-v4-flash",
            "openai",
            false,
        ),
        "ollama" => ("http://localhost:11434/v1", "qwen3.5:4b", "openai", false),
        // 旧标签仅供升级迁移；前端不再推荐，已有可编辑配置不会在读取时被覆盖。
        "ollama-r1" => (
            "http://localhost:11434/v1",
            "deepseek-r1:8b",
            "openai",
            true,
        ),
        // 保留旧版 provider 标签的迁移能力，不重新暴露未经本轮核准的预设。
        "stepfun" => ("https://api.stepfun.com/v1", "step-2-16k", "openai", false),
        _ => return None,
    };
    let service = crate::model_config::inspect(api_url, protocol).ok()?;
    Some(ModelConfig {
        api_url: api_url.into(),
        model_name: model_name.into(),
        protocol: protocol.into(),
        reasoning_model,
        has_api_key: false,
        is_local: service.is_local,
        official_deepseek: service.official_deepseek,
    })
}

#[derive(serde::Serialize)]
pub struct ModelChoice {
    id: &'static str,
    name: &'static str,
    #[serde(flatten)]
    config: ModelConfig,
}

#[tauri::command]
pub fn get_model_presets() -> Vec<ModelChoice> {
    [
        ("deepseek", "DeepSeek Flash"),
        ("deepseek-pro", "DeepSeek Pro"),
        ("openai", "OpenAI · GPT-6 Luna"),
        ("anthropic", "Anthropic"),
        ("tencent", "Tencent TokenHub · Guangzhou"),
        ("tencent-intl", "Tencent TokenHub · Singapore"),
        ("siliconflow", "SiliconFlow"),
        ("302ai", "302.AI"),
        ("ollama", "Ollama · Qwen3.5 4B"),
        ("custom", "Custom"),
    ]
    .into_iter()
    .map(|(id, name)| ModelChoice {
        id,
        name,
        config: model_preset(id).unwrap_or_else(|| ModelConfig {
            api_url: String::new(),
            model_name: String::new(),
            ..ModelConfig::default()
        }),
    })
    .collect()
}
