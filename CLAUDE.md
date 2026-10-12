# DeepRant - 桌面游戏与日常聊天翻译工具
Tauri 2.12.3 + Rust 1.98.1 + React 18 + Vite 8.3.4 + Tailwind CSS 4.3.3
<directory>
src/ - WebView 交互、设置缓存与手动翻译 (5 子目录: components、pages、data、utils、assets)
public/ - 浏览器入口的轻量品牌图标，与 src/assets/ 展示副本同源
src-tauri/ - 原生输入、设置、模型请求与桌面生命周期 (3 子目录: src、capabilities、icons)
docs/ - issue / PR 的架构归类和处理落点
scripts/ - 平台打包、签名验收和发布汇总
.github/ - 校验与 release 分支发布 (1 子目录: workflows)
</directory>
<config>
app-icon.png - 根目录品牌源图；保留原尺寸和像素，桌面安装图标与界面展示副本从此生成
package.json / package-lock.json - 前端依赖与构建命令
src-tauri/Cargo.toml / Cargo.lock - Rust 依赖与锁定版本
rust-toolchain.toml - 固定 Rust 编译器和质量检查工具
src-tauri/tauri.conf.json - 窗口、安全策略、安装器和更新签名
</config>
边界: Rust 是设置、凭据与模型请求的唯一权威；WebView 仅通过命令提交更改。全局快捷键只调度输入事务，模型返回失败不得改写用户输入。release 只有全部平台验证后才发布。
法则: 极简·稳定·导航·版本精确
