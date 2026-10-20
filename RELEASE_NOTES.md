<!--
[INPUT]: GitHub #66 深色模式、#67 局域网 HTTP 模型地址，与 2.0.2 版本契约。
[OUTPUT]: 发布工作流使用的本次更新说明、玩家操作步骤与现场验收边界。
[POS]: 当前版本交付说明；操作入口交给 README，完整需求与历史验收交给 docs/issues.md。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# DeepRant 2.0.2

游戏内嘴臭交流，自动翻译多语言。

- 处理 [#66：深色模式](https://github.com/liseami/DeepRant/issues/66)。侧栏底部新增外观切换：系统 / 浅色 / 深色。默认跟随系统。主窗口、游戏输入浮窗与原生标题栏同时切换，选择保存在本机设置中。
- 处理 [#67：局域网 http 模型地址](https://github.com/liseami/DeepRant/issues/67)。AI 模型页的 Base URL 现在接受本机与私有网络的 http 地址，例如 `http://192.168.1.20:3000`，也接受 10.x、172.16–31.x、Tailscale 100.64–127.x、IPv6 ULA 与 `*.local`。局域网服务的 Key 按需填写。
- 公网服务仍然只接受 https；http 不加密，请只在可信网络中使用局域网中转。不跟随重定向，Key 依旧只保存在系统凭据库。
- 三平台安装包与签名更新归档重新生成，沿用 CCBaga 的发布验收链；macOS 使用同组织 Developer ID 签名、公证与装订，全部平台校验后公开。

原有设置、个人 Key、自定义提示词、快捷键与原版游戏录屏保留。首次使用请填写自己的模型 Key；macOS 需允许辅助功能输入。深色视觉与局域网服务现场由玩家验收。
