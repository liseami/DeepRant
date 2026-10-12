/**
 * [INPUT]: Vite 官方静态资源声明；Tauri 插件使用各自的真实类型。
 * [OUTPUT]: 项目资源导入类型，不覆盖新版插件接口。
 * [POS]: 构建声明边界，避免旧 updater 假类型遮蔽下载与安装能力。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
/// <reference types="vite/client" />
