/**
 * [INPUT]: 依赖 model_presets.rs 的 provider 标签、官方端点和通用推理预算配置
 * [OUTPUT]: 提供当前轻量模型的可编辑预设；腾讯分区凭据分开，请求仍由 Rust 执行
 * [POS]: 模型设置的起始配置，模型 ID 与地址不会在前端调用中硬编码
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const MODELS = {
  deepseek: { name: 'DeepSeek Flash', api_url: 'https://api.deepseek.com', model_name: 'deepseek-flash', protocol: 'openai', reasoning_model: false },
  'deepseek-pro': { name: 'DeepSeek Pro', api_url: 'https://api.deepseek.com', model_name: 'deepseek-v4-pro', protocol: 'openai', reasoning_model: false },
  openai: { name: 'OpenAI · GPT-6 Luna', api_url: 'https://api.openai.com/v1', model_name: 'gpt-6-luna', protocol: 'openai', reasoning_model: false },
  anthropic: { name: 'Anthropic', api_url: 'https://api.anthropic.com/v1', model_name: 'claude-haiku-5-5', protocol: 'anthropic', reasoning_model: false },
  tencent: { name: 'Tencent TokenHub · Guangzhou', api_url: 'https://tokenhub.tencentmaas.com/v1', model_name: 'deepseek/deepseek-flash', protocol: 'openai', reasoning_model: false },
  'tencent-intl': { name: 'Tencent TokenHub · Singapore', api_url: 'https://tokenhub-intl.tencentmaas.com/v1', model_name: 'deepseek/deepseek-flash', protocol: 'openai', reasoning_model: false },
  siliconflow: { name: 'SiliconFlow', api_url: 'https://api.siliconflow.cn/v1', model_name: 'deepseek-ai/DeepSeek-V4-Flash', protocol: 'openai', reasoning_model: false },
  '302ai': { name: '302.AI', api_url: 'https://api.302.ai/v1', model_name: 'deepseek-v4-flash', protocol: 'openai', reasoning_model: false },
  ollama: { name: 'Ollama · Qwen3.5 4B', api_url: 'http://localhost:11434/v1', model_name: 'qwen3.5:4b', protocol: 'openai', reasoning_model: false },
  custom: { name: 'customProvider', api_url: '', model_name: '', protocol: 'openai', reasoning_model: false },
};
