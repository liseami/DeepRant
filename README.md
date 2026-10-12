# DeepRant

游戏内聊天翻译工具。打开聊天框，输入内容并触发全局快捷键；沿用 CCBaga 的 Laper App 组件、Pika 图标与动效。使用自己的云模型 Key 或本地 Ollama，支持中英界面。

[下载正式版](https://github.com/liseami/DeepRant/releases/latest) · [架构地图](CLAUDE.md) · [问题处理记录](docs/issues.md)

## 安装与配置

- macOS 12+：按 Apple Silicon / Intel 选择 DMG，将 DeepRant 拖入 Applications。正式包使用与 CCBaga 相同的 Developer ID 团队签名、公证并装订票据。
- Windows 10/11 x64：下载 `*-setup.exe`，安装到当前用户目录。无需更改 PowerShell 执行策略。更新包有密码学签名；这与 Windows Authenticode 代码签名不同，系统信誉提示仍可能出现。
- 在“模型设置”选择 DeepSeek Flash / Pro，填入自己申请的 Key，然后“保存并测试连接”。当前官方推荐 Flash ID 是 `deepseek-flash`，Pro 是 `deepseek-v4-pro`。
- OpenAI 兼容 API 可填域名、`/v1` 或完整 `/chat/completions` 端点；Anthropic 使用 Messages 协议。302.AI、硅基流动、腾讯云等在兼容 Chat Completions 时可使用自定义配置，模型 ID 以供应商文档为准。
- 本地 Ollama 使用 `http://localhost:11434/v1`，模型名须与本地已安装模型一致，无需 Key。

## 翻译与输入

主页保留原版游戏演示横幅与翻译方向、游戏场景、快捷键三张卡；表达风格仍在“模式”页。相同语言也可润色，支持中文直出；自定义场景说明与术语表可覆盖其他游戏、网页聊天和社区用语。

游戏模式：打开聊天框并输入内容后触发快捷键，DeepRant 尝试全选复制、翻译、核对原文后粘贴。日常模式：先选中文字再触发。状态和错误只在应用中显示，不写进聊天框。重复触发、焦点离开、原文变化或没有复制出新文本时取消自动粘贴。

系统输入不是游戏兼容性保证。部分 LoL 等游戏输入框无法复制，或不公开可验证焦点；此时使用“手动翻译”，复制结果后在目标程序粘贴。DeepRant 不修改游戏文件，也不绕过反作弊。

macOS 需在系统设置 → 隐私与安全性 → 辅助功能中允许 DeepRant。Windows 中目标程序与 DeepRant 的权限级别必须兼容；优先让双方以普通用户运行。不要为本工具关闭系统安全策略。

常用语快捷键默认关闭；可以编辑、新增、删除，并设置每条开关和整体开关。普通键需修饰键，F1–F24 和小键盘数字可单键使用。小键盘数字需 NumLock；Windows 无法独立区分小键盘 Enter / Equal，因此不允许这两个别名。应用内重复绑定和系统注册失败会回滚。

## 数据与升级

Key 保存到系统凭据库，以协议和最终端点隔离；前端只获得“已保存”状态。旧 `store.json` 的自定义 Key 验证迁移成功后才清除明文。设置解析失败不会覆盖原文件；可先备份应用数据目录中的 `store.json` 再修复配置。曾公开在历史源码中的共享 Key 必须在供应商后台撤销，删除现行代码不会让历史泄露失效。

翻译文本会发送给你配置的服务。DeepRant 没有账号、订阅、内置共享 Key 或遥测。剪贴板事务恢复文本、图片或空剪贴板；富文本恢复为纯文本，无法安全恢复的其他格式会拒绝自动操作。

关于页或托盘可检查更新，只有明确点击“安装并重启”才安装。正式更新校验签名和版本绑定；安装器、更新归档与 SHA-256 汇总一起发布。

## 开发

Node 22.12+；仓库锁定 Rust 1.98.1。macOS / Windows 是正式发布目标，移动客户端未列入本版本范围。

```sh
npm ci
npm run tauri dev
npm run check
cargo test --locked --manifest-path src-tauri/Cargo.toml --features custom-protocol
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets --features custom-protocol -- -D warnings
```

release 分支由仓库所有者触发发布，普通 PR 检查不接触签名凭据。构建通过后应用签名、公证、装订，再对最终更新字节签名；所有平台与 Windows 安装验证通过后，固定源码 commit 的 tag 并公开 Release。详见 [.github/workflows/release.yml](.github/workflows/release.yml)。

## English

DeepRant translates and rewrites desktop chat using your own model API key or local Ollama. Switch the interface to English from the sidebar. Choose languages, tone and context on Home, configure and test your model, then use a shortcut in a supported text field or translate manually and copy the result.

macOS requires Accessibility permission. Windows input must run at compatible privilege levels. Games may block copying or simulated input; manual translation remains available. Phrase shortcuts start disabled. Keys stay in the OS credential vault. Only an explicit update installation action installs a signed update. Download the appropriate DMG or current-user Windows installer from GitHub Releases.
