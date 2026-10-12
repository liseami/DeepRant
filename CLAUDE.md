# DeepRant - 桌面游戏与日常聊天翻译工具
Tauri 2.12.3 + Rust 1.98.1 + React 19.3.0 + Cromma UI / Laper App + Pika + Vite 8.3.4 + Tailwind CSS 4.3.3
<directory>
vendor/ - CCBaga 同款 Cromma UI / Laper App 控件、主题与 Pika 图标的本地依赖
src/ - 游戏内翻译、独立输入浮窗、表达模式与设置交互 (5 子目录: components、pages、data、utils、assets)
public/ - 浏览器入口的轻量品牌图标，与 src/assets/ 展示副本同源
src-tauri/ - 原生输入、设置、模型请求与桌面生命周期 (3 子目录: src、capabilities、icons)
docs/ - issue / PR 的实现与验收记录，以及可切换的独立英文产品说明
scripts/ - 平台打包、签名验收和发布汇总
.github/ - 校验与 release 分支发布 (1 子目录: workflows)
</directory>
<config>
app-icon.png - 保留原尺寸与像素的品牌源图；本机 generate-icons.py 派生透明圆角安装图标与界面副本
package.json / package-lock.json - 前端依赖与构建命令
src-tauri/Cargo.toml / Cargo.lock - Rust 依赖与锁定版本
rust-toolchain.toml - 固定 Rust 编译器和质量检查工具
README.md / docs/README.en.md - 中文默认与英文独立产品入口，下载、游戏工作流、配置、架构和开发说明互相对应
src-tauri/tauri.conf.json - 窗口、安全策略、安装器和更新签名
</config>
边界: Rust 是设置、凭据与模型请求的唯一权威；WebView 仅通过命令提交更改。macOS 键盘创建、布局查询与短注入只在主线程，网络、等待与剪贴板留在后台；原位核验原文与焦点，浮窗确认回填、不自动发送。录屏只通过单文件 asset scope 按需读取，视觉由用户验收；release 全部平台验证后才发布。
法则: 极简·稳定·导航·版本精确
