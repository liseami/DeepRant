# src-tauri/src/
> L2 | 父级: ../CLAUDE.md
成员清单
lib.rs: Tauri 生命周期与 IPC；Ready 先显示主窗口再异步初始化凭据/快捷键，macOS Reopen 激活；主窗口关闭隐藏、浮窗取消，警告日志不记录原文。
desktop_services.rs: Rust 桌面服务边界，按窗口身份限制文本复制、固定外链 ID 和单录屏 URL；前端不获得通用系统或路径插件能力，asset 仍按 Range 读取原资源。
input_diagnostics.rs: 实时权限与真实注册状态、最近输入的只内存快照；固定系统设置入口不代替用户授权，热键和复制阶段不进磁盘日志。
main.rs: 桌面程序入口，只调用库运行函数。
credentials.rs: 系统钥匙串凭据唯一边界，以协议及端点隔离 Key；仅主窗口模型编辑可按服务查看，不进入公开设置或诊断。
store.rs: 设置校验与升级迁移；所有设置经单一锁写入 SQLite，凭据先迁移验证、数据库提交后才清除旧 JSON 明文。
settings_db.rs: 单行 JSON 文档的 SQLite 事务，保留未知根字段；首次读取旧文件，之后数据库唯一权威，待办标记让明文清理可重试。
ai_translator.rs: 模型请求与最终文本解析；现代 OpenAI 使用 developer/完成预算，已核准本地 Qwen 默认关闭思考，旧模型兼容不污染其他协议。
model_presets.rs: 当前轻量模型与旧标签迁移；OpenAI Luna、本地 Qwen3.5、腾讯分区、硅基与302使用官方端点和精确 ID。
native_keyboard.rs: macOS 键盘创建、布局查询及事件注入只在主线程；后台误调用先拒绝，网络和等待不占主线程。
scenes.rs: 游戏语境与地区提示词；模型请求读取设置后组合提示词。
shortcut.rs: 规范按键、注册及持久化事务；Pressed/Released/过期周期进入诊断，真实绑定状态可查询，录制使旧周期失效。
shell_helper.rs: 有限选区、焦点与剪贴板恢复；游戏从光标到行首，日常保留原选区，每次短注入交给 native_keyboard，AX 错误保留阶段码。
inline_translation.rs: 可见占位的原位生命周期；当前占位选区精确核验后粘贴一次，模型失败安全回滚，无法回滚的原文只存内存供用户显式复制。
game_composer.rs: 独立游戏输入浮窗与 token 会话；重复快捷键只聚焦，提交失败保留草稿，取消释放输入锁。
composer_target.rs: 原游戏应用/窗口生命周期与焦点确认；无游戏 hook 或键盘监听，恢复真实焦点后允许写入。
tray.rs: 托盘菜单与窗口可见性。
updater_tests.rs: 官方 updater 签名信任边界；校验真实发布字节、篡改拒绝和版本绑定。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
