# src-tauri/src/
> L2 | 父级: ../CLAUDE.md
成员清单
lib.rs: Tauri 生命周期与 IPC 入口；设置、注册及浮窗输入事务移至 blocking 线程，主窗口关闭隐藏、浮窗关闭取消。
main.rs: 桌面程序入口，只调用库运行函数。
credentials.rs: 系统钥匙串凭据唯一边界，以协议及端点隔离 Key，WebView 无明文读权限。
store.rs: 原子 JSON 持久化与升级迁移；校验输入方式/自定义指令/模型推理开关，读错保留原文件，凭据迁移先验证再清明文。
model_presets.rs: 模型供应商默认端点与名称，配置契约由 store 统一校验。
ai_translator.rs: 模型协议请求与响应解析；系统输入和连接测试共用请求路径。
scenes.rs: 游戏语境与地区提示词；模型请求读取设置后组合提示词。
shortcut.rs: 规范按键、系统注册及持久化事务；IPC 共享锁避免覆盖，释放事件调度输入，录制使旧周期失效。
shell_helper.rs: 原位输入、焦点监视及剪贴板恢复；共享输入锁阻止并发，按输入方式分流，浮窗仅注入 Unicode 文本。
game_composer.rs: 独立游戏输入浮窗与 token 会话；重复快捷键只聚焦，提交失败保留草稿，取消释放输入锁。
composer_target.rs: 原游戏应用/窗口生命周期与焦点确认；无游戏 hook 或键盘监听，恢复真实焦点后允许写入。
tray.rs: 托盘菜单与窗口可见性。
updater_tests.rs: 官方 updater 签名信任边界；校验真实发布字节、篡改拒绝和版本绑定。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
