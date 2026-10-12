# src/
> L2 | 父级: ../CLAUDE.md
成员清单
main.jsx: React 挂载入口，主导航与游戏输入浮窗共用主题、独立页面生命周期。
App.jsx: 游戏页面导航，主页常驻以复用录屏播放器，其余页面按需加载；没有登录或额度路由。
index.css: Tailwind 4 与 Cromma UI 主题入口，复用 CCBaga 墨色令牌、全宽 Key 横幅、斜纹外框和点阵标题；控件几何留在组件库。
types.d.ts: 静态资源类型声明。
components/: 页面共享交互和设置读取入口。
pages/: 游戏内翻译主页、表达模式、常用语、模型与关于流程；手动输入是折叠辅助。
data/: 场景、语言与界面文案目录。
utils/: Toast 和更新请求的共享边界。
assets/: 静态媒体。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
