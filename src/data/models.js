/**
 * [INPUT]: 依赖后端 model_type 标签与 OpenAI / Anthropic 协议契约
 * [OUTPUT]: 提供可编辑的供应商预设，所有请求仍由 Rust 执行
 * [POS]: 模型设置的起始配置，模型 ID 与地址不会在前端调用中硬编码
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const MODELS = {
  deepseek: { name: 'DeepSeek Flash', api_url: 'https://api.deepseek.com', model_name: 'deepseek-flash', protocol: 'openai' },
  'deepseek-pro': { name: 'DeepSeek Pro', api_url: 'https://api.deepseek.com', model_name: 'deepseek-v4-pro', protocol: 'openai' },
  openai: { name: 'OpenAI', api_url: 'https://api.openai.com/v1', model_name: 'gpt-4.1-mini', protocol: 'openai' },
  anthropic: { name: 'Anthropic', api_url: 'https://api.anthropic.com/v1', model_name: 'claude-haiku-5-5', protocol: 'anthropic' },
  ollama: { name: 'Ollama', api_url: 'http://localhost:11434/v1', model_name: 'qwen3:8b', protocol: 'openai' },
  custom: { name: 'customProvider', api_url: '', model_name: '', protocol: 'openai' },
};
