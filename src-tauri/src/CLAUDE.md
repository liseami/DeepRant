# src-tauri/src/
> L2 | 父级: ../CLAUDE.md
成员清单
lib.rs: Tauri 生命周期与 IPC 入口；命令实现委派给边界模块。
main.rs: 桌面程序入口，只调用库运行函数。
store.rs: 设置默认值、升级迁移与唯一持久化入口；快捷键及模型只消费已校验设置。
ai_translator.rs: 模型协议请求与响应解析；系统输入和连接测试共用请求路径。
scenes.rs: 游戏语境与地区提示词；模型请求读取设置后组合提示词。
shortcut.rs: 全局按键注册和设置切换；回调只调度输入事务。
shell_helper.rs: 原生输入与剪贴板事务；避免平台脚本和失败时修改输入。
tray.rs: 托盘菜单与窗口可见性。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
