# src-tauri/
> L2 | 父级: ../CLAUDE.md
成员清单
Cargo.toml: 原生运行时与插件依赖，版本由主 Agent 锁定。
Cargo.lock: 可复现 Rust 依赖解析。
build.rs: Tauri 构建上下文与 MSVC manifest 链接参数，程序/单测共用运行时依赖。
windows-app-manifest.xml: Tauri 默认 Common Controls v6 声明，防止库单测加载旧 comctl32。
tauri.conf.json: 桌面窗口、CSP、包标识与签名更新端点。
Info.plist: macOS 应用信息。
entitlements.plist: macOS hardened runtime 权限。
src/: 设置、输入、模型和快捷键边界，详见 src/CLAUDE.md。
capabilities/: WebView 命令权限白名单。
icons/: 各平台安装器图标。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
