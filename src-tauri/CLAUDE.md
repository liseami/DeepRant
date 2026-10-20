# src-tauri/
> L2 | 父级: ../CLAUDE.md
成员清单
Cargo.toml: 原生运行时与插件依赖，版本由主 Agent 锁定。
Cargo.lock: 可复现 Rust 依赖解析。
build.rs: Tauri 构建上下文与 MSVC manifest 链接参数，程序/单测共用运行时依赖。
windows-app-manifest.xml: Tauri 默认 Common Controls v6 声明，防止库单测加载旧 comctl32。
tauri.conf.json: 桌面窗口、CSP、包标识与签名更新；窗口不固定主题，深浅色由 Rust 应用级主题下发；原录屏作为单文件资源，asset scope 只允许该文件按 Range 流式读取。
Info.plist: macOS 应用信息。
entitlements.plist: macOS hardened runtime 权限。
src/: SQLite 设置、模型、快捷键、原位输入与游戏浮窗；权限/阶段诊断只在内存，凭据初始化不阻塞主窗口，详见 src/CLAUDE.md。
capabilities/: WebView 命令权限白名单。
icons/: 各平台安装器图标。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
