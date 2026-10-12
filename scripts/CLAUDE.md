# scripts/
> L2 | 父级: ../CLAUDE.md
成员清单
dev-install.py: CCBaga 同款 debug/custom-protocol 本机打包，临时签名，视觉由用户验收。
install-apps.py: 固定身份核验后事务安装，正常退出、失败回滚和刷新相关 Dock；不改用户资料。
generate-icons.py: AppKit 从保留原图派生透明圆角 PNG/ICO/ICNS，复用 CCBaga 图标网格，临时目录自动清理；现有压缩器可选。
release.py: macOS / Windows 最终产物签名和平台清单；app 公证装订→更新归档版本签名→无头 DMG 公证装订，打包子进程不继承签名私钥。
dmg-settings.py: CCBaga 同源 800×500 背景与单 DeepRant.app→Applications 固定拖拽布局，不依赖 Finder 自动化。
verify-dmg.py: 只读挂载真实安装盘，校验唯一应用身份/版本/架构、链接与背景布局；正式盘强制严格签名、票据和 Gatekeeper。
release-requirements.txt: 与 CCBaga 相同的 dmgbuild / ds-store / mac-alias 版本与 wheel SHA-256，仅发布 CI 安装。
assemble-release.py: 校验平台齐全、固定字节哈希与公开更新清单，再生成发布文件列表。
verify-windows.ps1: 真实当前用户安装、启动及卸载，兼容性失败阻止发布。
contracts.test.mjs: 设置安全边界、场景目录/版本一致性与原录屏字节保真检查。
test-release.py: 对真实汇总脚本施加缺失/篡改/错配产物，并验证构建环境隔离私钥。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
