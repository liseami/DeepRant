<!--
[INPUT]: GitHub issue / PR 原始诉求、独立实现与主 Agent 技术验收证据。
[OUTPUT]: 逐条需求覆盖、历史背景及未完成的现场/凭据/公开交付边界。
[POS]: README 与发布决策的证据台账，历史模型诉求保留原名，当前产品能力按通用实现记录。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# DeepRant 2.0 需求与验收记录

调查日期：2026-10-12。39 个开放 issue、2 个开放 PR，正文和评论已逐条阅读。需求由本项目独立实现，没有合并外部 PR。这里记录代码与验证证据；GitHub 尚未关闭问题，2.0 尚未公开发布。

## 架构落点

Rust 统一持有设置、系统凭据和模型请求。普通输入框使用原位事务，先确认复制成功，翻译后再次核对原文与焦点。禁止复制的游戏使用独立输入浮窗：先打开空聊天框，快捷键唤起浮窗，写消息、翻译、预览、确认后 Unicode 回填，不发送回车。LoL 的自动输入方式默认走浮窗，其他游戏也可选择；没有键盘监听、游戏 hook 或进程白名单。

所有输入方式共用语言、表达风格、通用提示词和术语表。API 连接测试与翻译共用原生请求，凭据存入系统凭据库；诊断只含服务名、协议、模型、耗时与脱敏错误。普通模型预算 2048 token / 60 秒，通用推理兼容预算 16384 token / 120 秒，仅解析最终文本；轻量预设为官方 OpenAI `gpt-6-luna` 与本地 Qwen3.5 4B，不再展示专用 R1 入口。官方 OpenAI 默认禁用思考、兼容开启使用低推理强度，非官方兼容端点保留单 user 回合以支持旧本地模型；Anthropic 请求不受这些扩展字段影响。

## 逐条覆盖

| Issue | 独立实现与产品取舍 | 验收边界 |
| --- | --- | --- |
| [#5](https://github.com/liseami/DeepRant/issues/5) | 原生按键代替脚本，释放修饰键后调度；状态不再写进聊天，重复触发拒绝；可选浮窗输入。 | Windows / Dota 现场待验收。 |
| [#10](https://github.com/liseami/DeepRant/issues/10) | 五个主页面与浮窗可切换中文 / English；README 中文默认、独立英文入口。 | 原生系统诊断当前仍以中文呈现。 |
| [#17](https://github.com/liseami/DeepRant/issues/17) | 彩虹六号与全境封锁2的独立术语语境。 | 不等于实测反作弊兼容。 |
| [#20](https://github.com/liseami/DeepRant/issues/20) | 漫威争锋语境。 | 游戏现场待验收。 |
| [#21](https://github.com/liseami/DeepRant/issues/21) | Windows 原生输入与权限 / 焦点诊断，不再依赖 PowerShell 执行策略。 | Windows 本轮代码尚未运行。 |
| [#24](https://github.com/liseami/DeepRant/issues/24) | 永劫无间语境。 | 游戏现场待验收。 |
| [#26](https://github.com/liseami/DeepRant/issues/26) | 战舰世界与评论中的坦克世界均有独立语境；可用术语对照表纠正船名和车型。 | 未内置完整船名 / 车型数据库。 |
| [#28](https://github.com/liseami/DeepRant/issues/28) | 原文决定队友 / 对手对象，不添 ES / NA / 河南等对象或地区；共享输入锁防止翻译状态成为下一次原文。 | 模型输出质量需真实服务验收。 |
| [#29](https://github.com/liseami/DeepRant/issues/29) | 王者荣耀黑话已有桌面语境；沿原作者回复保留桌面产品边界，本轮不发布手机客户端。 | 手机客户端需求未采纳。 |
| [#32](https://github.com/liseami/DeepRant/issues/32) | 英式英语明确采用英国拼写和措辞；禁止依据语言虚构玩家地区。 | 模型表达质量待验收。 |
| [#33](https://github.com/liseami/DeepRant/issues/33) | 日常模式保留犀利 / 专业 / 自然风格，通用提示词可配置社区回复偏好。 | 不自动抓取社交账号或评论。 |
| [#34](https://github.com/liseami/DeepRant/issues/34) | 删除现行共享 Key，个人 Key 进系统凭据库，不回传 WebView；依赖日志限警告，聊天不进调试日志。 | 历史泄露凭据仍需供应商后台撤销。 |
| [#35](https://github.com/liseami/DeepRant/issues/35) | LoL 默认热键输入浮窗，不再要求聊天框能复制，确认后回填 Unicode。 | 浮窗写新消息；不声称读取游戏已有聊天内容，游戏现场待验收。 |
| [#36](https://github.com/liseami/DeepRant/issues/36) | 去除脚本注入、锁定依赖、安装器与更新签名验收链。 | 未配置 Windows Authenticode 证书，杀软信誉不能由代码保证。 |
| [#37](https://github.com/liseami/DeepRant/issues/37) | 燕云十六声语境。 | 游戏现场待验收。 |
| [#39](https://github.com/liseami/DeepRant/issues/39) | 中文同语种润色、复制结果、QQ / 微信日常输入、通用提示词、可编辑短语与浮窗。 | QQ / 微信和 Windows 游戏现场待验收。 |
| [#40](https://github.com/liseami/DeepRant/issues/40) | 系统凭据、原生输入、修饰键释放和请求超时；无需放宽 PowerShell 策略。 | Win10 现场待验收；历史 Key 撤销独立处理。 |
| [#41](https://github.com/liseami/DeepRant/issues/41) | 当前腾讯 TokenHub 广州 / 新加坡预设，支持 DeepSeek；历史 R1 诉求归入可自定义模型与通用推理兼容配置。 | 腾讯旧 R1 已下线，不承诺免费；地区 Key 需对应服务。 |
| [#42](https://github.com/liseami/DeepRant/issues/42) | 漫威争锋语境，不用 Steam / 网易进程名单限制调用。 | 两发行版本现场待验收。 |
| [#43](https://github.com/liseami/DeepRant/issues/43) | 梦三国语境。 | 游戏现场待验收。 |
| [#44](https://github.com/liseami/DeepRant/issues/44) | LoL 输入浮窗与原窗口身份恢复，避开复制限制。 | Windows 游戏现场待验收。 |
| [#45](https://github.com/liseami/DeepRant/issues/45) | 硅基预设，根地址 / v1 / 完整请求地址幂等归一，解析最终 content。 | 需要用户有效 Key 与供应商模型权限。 |
| [#46](https://github.com/liseami/DeepRant/issues/46) | 原诉求针对 R1；现使用通用推理兼容开关、中文直出、仅思考 / 截断 / 空内容明确诊断；错误不粘贴进聊天。 | 真实推理服务 / QQ / Dota 现场待验收。 |
| [#47](https://github.com/liseami/DeepRant/issues/47) | 当前用户 NSIS，安装 / 启动 / 卸载脚本及 Windows Common Controls manifest 修复。 | 本轮 Windows 原生检查和安装器验收待运行。 |
| [#48](https://github.com/liseami/DeepRant/issues/48) | 风暴英雄语境。 | 游戏现场待验收。 |
| [#49](https://github.com/liseami/DeepRant/issues/49) | 常用语整体 / 逐条开关及自定义快捷键，默认整体关闭。 | 注册事务有原生单测。 |
| [#50](https://github.com/liseami/DeepRant/issues/50) | 维护升级和本机新包交付，发布分支验收流程已准备。 | 公开 2.0 尚未发布。 |
| [#51](https://github.com/liseami/DeepRant/issues/51) | 测连改 Rust 请求，移除前端 fetch / CORS 故障路径；保留可复制安全诊断。 | 真实供应商连接需有效 Key。 |
| [#52](https://github.com/liseami/DeepRant/issues/52) | LoL 浮窗不依赖 Client / Game 进程白名单；完整 DeepSeek endpoint 可用。 | Windows 游戏现场待验收。 |
| [#53](https://github.com/liseami/DeepRant/issues/53) | 302.AI OpenAI 兼容预设，技术接入独立实现。 | 不代表接受商务合作。 |
| [#54](https://github.com/liseami/DeepRant/issues/54) | 星际公民术语语境、消息浮窗与当前选中文字翻译。 | 未实现连续频道读取 / OCR；没有测试账号会话。 |
| [#55](https://github.com/liseami/DeepRant/issues/55) | 常用语默认不占 Dota 的 Alt / 数字键，逐条开关、录制改键与冲突回滚。 | 系统注册冲突有原生单测。 |
| [#56](https://github.com/liseami/DeepRant/issues/56) | 个人 Key 配置、OS 凭据状态和测连，取消过期共享 Key。 | 供应商余额和权限由用户账户决定。 |
| [#57](https://github.com/liseami/DeepRant/issues/57) | 最新官方 DeepSeek ID / 根地址预设，兼容完整地址，清晰配置与连接诊断。 | 官方服务仍需用户 Key。 |
| [#58](https://github.com/liseami/DeepRant/issues/58) | 独立实现自定义场景与短语 CRUD，没有合并 fork。 | 本机代码检查覆盖基础契约。 |
| [#60](https://github.com/liseami/DeepRant/issues/60) | 自定义游戏名称 / 场景提示词、全场景术语表，以及日常可用的通用提示词。 | 词表解释效果依赖所选模型。 |
| [#61](https://github.com/liseami/DeepRant/issues/61) | macOS LoL 浮窗用原应用 / 窗口身份恢复，可缺少 AX 聊天控件，辅助功能权限仍必要。 | 用户负责游戏与视觉现场验收。 |
| [#62](https://github.com/liseami/DeepRant/issues/62) | Rust 明确区分空响应 / 非 JSON / 无最终文本，不再直接调用前端 Response.json。 | 响应解析有原生单测。 |
| [#63](https://github.com/liseami/DeepRant/issues/63) | 物理 code 录制，小键盘数字 / F 键单键，释放修饰键后执行，应用内冲突回滚。 | NumLock 必须开启；Windows 无法区分 NumpadEnter / Equal，明确拒绝。 |

## PR 诉求独立吸收

- [#38](https://github.com/liseami/DeepRant/pull/38)：历史诉求是本地 DeepSeek-R1。独立实现吸收的是本地模型与推理能力：Ollama 无需 Key 的回环端点、可编辑模型、通用推理预算 / 超时、think 块剥离，过滤不再丢掉有效前文。当前轻量起始配置使用 Qwen3.5 4B，不再展示专用 R1 预设；仍可按服务能力自行配置历史模型。原 PR 未合并。
- [#59](https://github.com/liseami/DeepRant/pull/59)：Anthropic Messages、原生测连、Base URL 归一和详细诊断均已独立实现；可复制诊断只包含安全字段。没有吸收 Key 前缀日志、原始响应、重复请求管道或更换更新信任根。原 PR 未合并。

## 验证与交付

主 Agent 执行前端构建、契约检查、原生单测、clippy 与本机包技术核验。用户负责全部视觉与游戏现场验收。子 Agent 不运行 build / test / typecheck，整合后清理 worktree 与中间产物。

本机包沿 CCBaga 的 debug / custom-protocol / 临时签名 / 事务重装流程，每次重新生成。公开发布由本次用户授权的 release 分支流程触发，沿 CCBaga 的最终字节签名、DMG 布局和安装验收门禁。Windows 原生与安装检查、真实供应商和游戏验收尚未完成，不能提前把这些条目按已验证 bug 修复关闭。

供应商资料：[DeepSeek](https://api-docs.deepseek.com/)、[OpenAI GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)、[Ollama Qwen3.5 4B](https://ollama.com/library/qwen3.5:4b)、[腾讯 TokenHub](https://cloud.tencent.com/document/product/1823/130079)、[腾讯旧 R1 下线](https://cloud.tencent.com/announce/detail/2258)、[硅基](https://api-docs.siliconflow.cn/docs/api/chat-completions-post)、[302.AI](https://doc.302.ai/171145944e0)、[R1 历史兼容建议](https://github.com/deepseek-ai/DeepSeek-R1#usage-recommendations)。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
