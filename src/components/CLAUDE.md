# components/
> L2 | 父级: ../CLAUDE.md
成员清单
StoreProvider.jsx: IPC 设置缓存，串行提交变更并接收 Rust 的最终状态，不持有凭据。
Layout.jsx: 原版 200px 侧栏和白色内容容器，设置读取完成后挂载业务页面，常驻桌面通知与更新入口。
Sidebar.jsx: 原版图标、导航标签与滑动高亮动画，原版未登录入口保留为本地页面导航，界面语言作为底部辅助入口。
DropdownMenu.jsx: 原版浮动选项菜单，被语言与游戏卡片消费，长目录在菜单内滚动。
HotkeyRecorder.jsx: KeyboardEvent.code 录制边界，暂停已有快捷键，注册交给后端。
BackgroundStatus.jsx: Tauri 输入事件桥，在全部页面展示统一进度和启动注册错误。
UpdateManager.jsx: 常驻更新流程，先检查并展示版本，用户点击后安装，释放未使用资源。
DeveloperNote.jsx: 原开发者社交/课程区，沿同款组件保留准确产品说明。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
