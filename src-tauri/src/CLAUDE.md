# src-tauri/src/
> L2 | 父级: ../CLAUDE.md
成员清单
lib.rs: Tauri 生命周期与 IPC 入口；设置和注册事务移至 blocking 线程，单例与托盘管理窗口。
main.rs: 桌面程序入口，只调用库运行函数。
credentials.rs: 系统钥匙串凭据唯一边界，以协议及端点隔离 Key，WebView 无明文读权限。
store.rs: 原子 JSON 持久化与升级迁移；读取失败保留磁盘原文件，凭据迁移先验证再清明文。
ai_translator.rs: 模型请求与最终文本解析；测试和翻译共用 R1 兼容预算，风格及全局要求适用于游戏与日常。
model_presets.rs: 供应商起始配置与旧标签迁移；腾讯分区、硅基、302 和本地 R1 使用官方端点及精确模型 ID。
scenes.rs: 游戏语境与地区提示词；模型请求读取设置后组合提示词。
shortcut.rs: 规范按键、系统注册及持久化事务；IPC 共享锁避免覆盖，释放事件调度输入，录制使旧周期失效。
shell_helper.rs: 原生输入、焦点监视及剪贴板恢复；复制无新文本或焦点/原文变化时拒绝粘贴。
tray.rs: 托盘菜单与窗口可见性。
updater_tests.rs: 官方 updater 签名信任边界；校验真实发布字节、篡改拒绝和版本绑定。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
