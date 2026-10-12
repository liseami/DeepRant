# scripts/
> L2 | 父级: ../CLAUDE.md
成员清单
dev-install.py: release 分支 debug/custom-protocol 本机交付；优先同团队 Developer ID，避免每次重签改变辅助功能授权身份；无证书时临时签名。
install-apps.py: 固定路径及身份核验后正常退出、事务安装与失败回滚；开发签名仅临时或指定团队，正式盘强制 Gatekeeper，不改资料。
generate-icons.py: AppKit 从保留原图派生透明圆角 PNG/ICO/ICNS，复用 CCBaga 图标网格，临时目录自动清理；现有压缩器可选。
release.py: macOS / Windows 最终产物签名和平台清单；app 公证装订→更新签名→无头 DMG 公证装订，Accepted 后仅票据服务错误有限重试，最终验收不跳过，打包子进程隔离私钥。
dmg-settings.py: CCBaga 同源 800×500 背景与单 DeepRant.app→Applications 固定拖拽布局，不依赖 Finder 自动化。
verify-dmg.py: 只读挂载真实安装盘，验收身份/版本/架构与背景布局；票据调用同源有限重试，正式盘严格签名和 Gatekeeper。
notarization.py: 固定 stapler 装订/校验操作的共享票据边界，68 有界退避，其余错误立即拒绝并显示安全诊断，不接触认证凭据。
release-requirements.txt: 与 CCBaga 相同的 dmgbuild / ds-store / mac-alias 版本与 wheel SHA-256，仅发布 CI 安装。
assemble-release.py: 校验平台齐全、固定字节哈希与公开更新清单，再生成发布文件列表。
verify-windows.ps1: 真实当前用户安装、启动及卸载，兼容性失败阻止发布。
contracts.test.mjs: 设置 / 视频访问边界、场景 / 版本一致性、原录屏字节保真与旧会话响应拒绝检查。
test-release.py: 真实产物汇总/环境隔离回归，加上票据服务暂态重试与损坏/撤销错误立即拒绝，均不访问真实私钥。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
