/**
 * [INPUT]: 依赖 store::ModelConfig；供应商文档仅决定可编辑的起始地址与模型 ID
 * [OUTPUT]: 提供 model_preset，覆盖远程供应商、腾讯分区与 Ollama R1 兼容配置
 * [POS]: 原生预设的单一目录；store 消费它做旧配置迁移与 provider 校验，凭据不在此存放
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::store::ModelConfig;

// ---------------------------------------------------------------------------
// 2026-10-12 核对官方文档；所有预设可编辑，不承诺供应商额度或模型长期在线
// DeepSeek: https://api-docs.deepseek.com/
// Tencent: https://cloud.tencent.com/document/product/1823/130079
// SiliconFlow: https://api-docs.siliconflow.cn/docs/api/chat-completions-post
// 302.AI: https://doc.302.ai/171145944e0
// Ollama R1: https://ollama.com/library/deepseek-r1:8b
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
        "openai" => ("https://api.openai.com/v1", "gpt-4.1-mini", "openai", false),
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
        "ollama" => ("http://localhost:11434/v1", "qwen3:8b", "openai", false),
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
    Some(ModelConfig {
        api_url: api_url.into(),
        model_name: model_name.into(),
        protocol: protocol.into(),
        reasoning_model,
        has_api_key: false,
    })
}
