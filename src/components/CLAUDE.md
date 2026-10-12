# components/
> L2 | 父级: ../CLAUDE.md
成员清单
StoreProvider.jsx: IPC 设置缓存，串行提交变更并接收 Rust 的最终状态，不持有凭据。
Layout.jsx: 桌面布局与设置恢复边界，挂载全局通知和导航。
Sidebar.jsx: 真实功能导航与中英界面切换。
HotkeyRecorder.jsx: KeyboardEvent.code 录制边界，暂停已有快捷键，注册交给后端。
BackgroundStatus.jsx: Tauri 输入事件桥，在全部页面展示统一进度和启动注册错误。
UpdateManager.jsx: 常驻更新流程，先检查并展示版本，用户点击后安装，释放未使用资源。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
