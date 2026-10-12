# DeepRant 2.0.0

- 升级至 Tauri 2.12.3 / CLI 2.12.2，Vite 8.3.4 和 Tailwind CSS 4.3.3；移除脚本注入、账号及订阅空壳。
- DeepSeek Flash (`deepseek-flash`) / Pro (`deepseek-v4-pro`)、OpenAI 兼容 API、Anthropic Messages 与本地 Ollama 共用原生请求管道。支持 Base URL 自动归一，超时与 HTTP/空响应/解析失败诊断，仅输出最终文本。
- 自用 Key 存入系统凭据库，前端不读回密钥。旧配置安全迁移；不再提供内置共享 Key。
- 原生输入等待修饰键释放，检测复制成功、焦点和原文变化，拒绝并发触发；翻译失败保留原文，状态不污染聊天。部分游戏阻止复制或模拟输入时，请使用新增手动翻译页。
- 常用语可编辑、增删、改键、逐条开关及整体关闭。默认关闭，避免占用游戏键位。支持 F 键与小键盘数字，Windows 拒绝不能独立区分的小键盘 Enter / Equal。
- 新增各 issue 请求的游戏语境、自定义提示词与术语对照表，支持英式英语、中文直出和完整中英文主要界面。
- 沿用 CCBaga 发布验收链：macOS 双架构签名、公证及装订，Windows 当前用户安装、启动与卸载验证；最终更新包绑定版本签名，全部平台验收后发布。

升级提示：常用语需主动启用；API 服务费用由供应商收取。历史泄露共享 Key 应在供应商后台撤销。Windows 安装器的 updater 签名不等同于 Authenticode；本工具不保证绕过游戏输入限制，也不应关闭安全软件或改变 PowerShell 执行策略。

English: This release modernizes the desktop runtime, moves credentials to the OS vault, unifies model requests, and rebuilds safe input transactions. It adds editable phrase shortcuts, manual translation, custom game contexts and bilingual UI. Games that prohibit copying require manual translation. Phrase shortcuts start disabled. macOS packages are notarized; updates verify signatures bound to their announced version.
