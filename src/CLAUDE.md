# src/
> L2 | 父级: ../CLAUDE.md
成员清单
main.jsx: React 挂载入口。
App.jsx: 游戏页面导航，首页即时挂载，其他页面按需加载以减少启动资源。
index.css: Tailwind 4 与 Cromma UI 主题入口，复用 CCBaga 墨色令牌、斜纹外框和点阵标题；控件几何留在组件库。
types.d.ts: 静态资源类型声明。
components/: 页面共享交互和设置读取入口。
pages/: 游戏内翻译主页、表达模式、常用语、模型、能量与关于流程；手动输入是折叠辅助。
data/: 场景、语言与界面文案目录。
utils/: Toast 和更新请求的共享边界。
assets/: 静态媒体。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
