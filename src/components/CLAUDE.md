# components/
> L2 | 父级: ../CLAUDE.md
成员清单
StoreProvider.jsx: IPC 设置与模型目录视图，串行提交变更并接收 Rust 最终状态，不持有凭据。
Layout.jsx: CCBaga 同款外框，先放全宽 Key 横幅，再排列 240px 侧栏与 Panel frame 工作面；常驻桌面通知与更新入口。
ApiKeyBanner.jsx: 官方 DeepSeek 当前配置缺 Key 时直接输入保存，固定官方申请入口交给 Rust 打开；不重置游戏设置。
ApiKeyField.jsx: Key 真值只在字段局部状态，显隐、读取重试、晚到响应保护与服务隔离共用一个入口；原值对照避免重复写凭据，共享缓存只持有是否已保存。
Sidebar.jsx: Cromma NavButton 与 Pika 图标的五项游戏业务导航及界面语言入口，不设登录或额度入口。
AppDialog.jsx: CCBaga Radix + ModalShell 受控模态，调用方持有编辑草稿，关闭后恢复先前焦点。
HotkeyRecorder.jsx: KeyboardEvent.code 录制边界，暂停已有快捷键，注册交给后端。
BackgroundStatus.jsx: 原生输入事件桥；权限错误打开系统设置，无法回滚时显式复制内存原文，不通过事件传递聊天文本。
UpdateManager.jsx: 常驻更新流程，先检查并展示版本，用户点击后安装，释放未使用资源。
DeveloperNote.jsx: 原开发者社交/课程区，沿同款组件保留准确产品说明；只传固定外链 ID，系统浏览器由 Rust 打开。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
