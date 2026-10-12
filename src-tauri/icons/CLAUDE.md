# icons/
> L2 | 父级: ../CLAUDE.md
桌面品牌资源由 scripts/generate-icons.py 读取根目录原图派生。ICNS 复用 CCBaga 的 1024px 网格：100px 透明边距、824px 主体、185px 圆角和轻投影；Windows 与界面副本只裁圆角，避免小尺寸主体过小。源图始终不改写。
成员清单
32x32.png: 小尺寸 RGBA 桌面图标，透明圆角由资源本身提供，满足 Tauri 原生读取。
128x128.png: 标准 RGBA 桌面图标，与其他尺寸同源同形。
128x128@2x.png: 256px 高分屏 RGBA 桌面图标，保留原图内容并裁透明圆角。
icon.icns: macOS 16–1024px 多分辨率资源，AppKit 绘制、可选现有压缩工具减小体积，iconutil 归档。
icon.ico: Windows 16/24/32/48/64/128/256px PNG 载荷，透明圆角与桌面 PNG 一致。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
