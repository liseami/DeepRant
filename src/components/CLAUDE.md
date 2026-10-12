# components/
> L2 | 父级: ../CLAUDE.md
成员清单
StoreProvider.jsx: IPC 设置缓存，串行提交变更并接收 Rust 的最终状态，不持有凭据。
Layout.jsx: CCBaga 同款 240px 侧栏与 Panel frame 工作面，设置读取完成后挂载原游戏业务，常驻桌面通知与更新入口。
Sidebar.jsx: Cromma NavButton 与 Pika 图标的五项游戏业务导航及界面语言入口，不设登录或额度入口。
AppDialog.jsx: CCBaga Radix + ModalShell 受控模态，调用方持有编辑草稿，关闭后恢复先前焦点。
HotkeyRecorder.jsx: KeyboardEvent.code 录制边界，暂停已有快捷键，注册交给后端。
BackgroundStatus.jsx: Tauri 输入事件桥，在全部页面展示统一进度和启动注册错误。
UpdateManager.jsx: 常驻更新流程，先检查并展示版本，用户点击后安装，释放未使用资源。
DeveloperNote.jsx: 原开发者社交/课程区，沿同款组件保留准确产品说明。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
