# assets/
> L2 | 父级: ../CLAUDE.md
成员清单
app-icon.png: generate-icons.py 派生的 256px 压缩 RGBA 展示副本，圆角透明度内嵌于图片；保留原品牌内容，源图在 ../../app-icon.png。
preview.png: 原版游戏内翻译界面截图，保留原字节，供演示视频未播放时展示和项目文档使用。
demovideo.mp4: 原版游戏录屏，保留原字节；映射为随包 media/demovideo.mp4，首页经窄 scope 的 asset 协议按 Range 读取，不重复嵌入 JavaScript 资产。
media.sha256: 演示截图与录屏的原始 SHA-256 清单，用于资源清理与发布时核对保留状态。
dmg-background.png: CCBaga 原字节的 800×500 小像素安装盘背景，仅发布 DMG 使用，不加载到游戏首页。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
