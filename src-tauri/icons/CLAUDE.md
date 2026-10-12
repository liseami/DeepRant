# icons/
> L2 | 父级: ../CLAUDE.md
桌面安装器与运行窗口使用同一品牌源图；由根目录 app-icon.png 通过 Tauri icon 工具生成，只保留 tauri.conf.json 引用的桌面规格。
成员清单
32x32.png: 小尺寸桌面图标，保留 Tauri 所需 RGBA 编码。
128x128.png: 标准桌面图标，保留 Tauri 所需 RGBA 编码。
128x128@2x.png: 256px 高分屏桌面图标，保留 Tauri 所需 RGBA 编码。
icon.icns: macOS 多分辨率应用图标，由 Tauri 生成，再对派生 PNG 以 90–100 品质压缩并经系统 iconutil 归档；根目录源图保持无损。
icon.ico: Windows 多分辨率应用图标，由 Tauri 原生资源工具生成。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
