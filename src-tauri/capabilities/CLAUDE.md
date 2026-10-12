# src-tauri/capabilities/
> L2 | 父级: ../CLAUDE.md
成员清单
default.json: main 窗口仅核心事件；剪贴板、外链、文件路径与更新只能通过 Rust 命令，不暴露前端系统插件。
composer.json: 浮窗仅核心事件；Rust 校验会话与显式文本复制，不能查看 Key 或打开外链。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
