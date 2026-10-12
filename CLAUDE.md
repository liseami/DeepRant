# DeepRant - 桌面游戏与日常聊天翻译工具
Tauri 2 + Rust + React 18 + Vite + Tailwind CSS
<directory>
src/ - WebView 交互、设置缓存与手动翻译 (6 子目录: components、pages、data、utils、icons、lib)
src-tauri/ - 原生输入、设置、模型请求与桌面生命周期 (3 子目录: src、capabilities、icons)
.github/ - 校验与 release 分支发布 (1 子目录: workflows)
</directory>
<config>
package.json / package-lock.json - 前端依赖与构建命令
src-tauri/Cargo.toml / Cargo.lock - Rust 依赖与锁定版本
src-tauri/tauri.conf.json - 窗口、安全策略、安装器和更新签名
</config>
边界: Rust 是设置、凭据与模型请求的唯一权威；WebView 仅通过命令提交更改。全局快捷键只调度输入事务，模型返回失败不得改写用户输入。release 只有全部平台验证后才发布。
法则: 极简·稳定·导航·版本精确
