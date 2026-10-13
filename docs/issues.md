<!--
[INPUT]: GitHub issue / PR 原始诉求、独立实现与主 Agent 技术验收证据。
[OUTPUT]: 逐条需求覆盖、公开交付证据，以及现场验收和历史凭据的处理边界。
[POS]: README 与发布决策的证据台账，历史模型诉求保留原名，当前产品能力按通用实现记录。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# DeepRant 2.0 需求与验收记录

调查日期：2026-10-12。调查时的 39 个开放 issue、2 个开放 PR，正文和评论已逐条阅读；需求由本项目独立实现，没有合并外部 PR。[2.0.0](https://github.com/liseami/DeepRant/releases/tag/v2.0.0) 已公开，41 项均已逐条回复并关闭：37 个 issue 按 completed，#29 手机客户端和 #54 连续频道读取 / OCR 按 not_planned，两个 PR 的可行诉求独立吸收后关闭。游戏现场与视觉验收仍由用户完成。

## 架构落点

Rust 统一持有 SQLite 设置、系统凭据和模型请求。普通输入框使用原位事务：游戏向前选中当前发言，日常只处理原选区；确认复制后显示翻译占位，完成或失败时核对占位与焦点再替换/恢复，不覆盖用户新编辑。禁止复制的游戏使用独立输入浮窗：先打开空聊天框，快捷键唤起浮窗，写消息、翻译、预览、确认后 Unicode 回填，不发送回车。LoL 与星际公民的自动输入方式默认走浮窗，其他游戏也可选择；没有键盘监听、游戏 hook 或进程白名单。

所有输入方式共用语言、表达风格、通用提示词和术语表。API 连接测试与翻译共用原生请求，凭据存入系统凭据库；诊断只含服务名、协议、模型、耗时与脱敏错误。普通模型预算 2048 token / 60 秒，通用推理兼容预算 16384 token / 120 秒，仅解析最终文本；轻量预设为官方 OpenAI `gpt-6-luna` 与本地 Qwen3.5 4B，不再展示专用 R1 入口。官方 OpenAI 默认禁用思考、兼容开启使用低推理强度，非官方兼容端点保留单 user 回合以支持旧本地模型；Anthropic 请求不受这些扩展字段影响。

模型预设、端点策略、系统剪贴板、固定外链、随包录屏路径和更新生命周期全部由 Rust 执行；前端已移除系统插件依赖及权限，仅渲染原生快照与编辑草稿。SQLite 迁移包含事务失败、损坏数据与直接根节点旧配置的回归检查，全部设置往返无丢失。

嘴臭模式采用西海岸 battle / diss / punchline 和自然粗口，允许同对象的创造性措辞；全局自定义提示词优先决定语气和长度。模型请求、界面完整生效预览和显式复制均消费 Rust 同一个生成函数，保存后立即用于全部输入方式。

## 逐条覆盖

| Issue | 独立实现与产品取舍 | 验收边界 |
| --- | --- | --- |
| [#5](https://github.com/liseami/DeepRant/issues/5) | 原生按键代替脚本，释放修饰键后调度；翻译占位有核验与失败恢复，重复触发拒绝；可选浮窗输入。 | Windows / Dota 现场待验收。 |
| [#10](https://github.com/liseami/DeepRant/issues/10) | 五个主页面与浮窗可切换中文 / English；README 中文默认、独立英文入口。 | 原生系统诊断当前仍以中文呈现。 |
| [#17](https://github.com/liseami/DeepRant/issues/17) | 彩虹六号与全境封锁2的独立术语语境。 | 不等于实测反作弊兼容。 |
| [#20](https://github.com/liseami/DeepRant/issues/20) | 漫威争锋语境。 | 游戏现场待验收。 |
| [#21](https://github.com/liseami/DeepRant/issues/21) | Windows 原生输入与权限 / 焦点诊断，不再依赖 PowerShell 执行策略。 | Windows 原生检查与双 runner 安装验证通过；游戏现场待验收。 |
| [#24](https://github.com/liseami/DeepRant/issues/24) | 永劫无间语境。 | 游戏现场待验收。 |
| [#26](https://github.com/liseami/DeepRant/issues/26) | 战舰世界与评论中的坦克世界均有独立语境；可用术语对照表纠正船名和车型。 | 未内置完整船名 / 车型数据库。 |
| [#28](https://github.com/liseami/DeepRant/issues/28) | 原文决定队友 / 对手对象，不添 ES / NA / 河南等对象或地区；共享输入锁防止翻译状态成为下一次原文。 | 模型输出质量需真实服务验收。 |
| [#29](https://github.com/liseami/DeepRant/issues/29) | 王者荣耀黑话已有桌面语境；沿原作者回复保留桌面产品边界，本轮不发布手机客户端。 | 手机客户端需求未采纳。 |
| [#32](https://github.com/liseami/DeepRant/issues/32) | 英式英语明确采用英国拼写和措辞；禁止依据语言虚构玩家地区。 | 模型表达质量待验收。 |
| [#33](https://github.com/liseami/DeepRant/issues/33) | 日常模式保留犀利 / 专业 / 自然风格，通用提示词可配置社区回复偏好。 | 不自动抓取社交账号或评论。 |
| [#34](https://github.com/liseami/DeepRant/issues/34) | 删除现行共享 Key，个人 Key 进系统凭据库；仅主窗口模型编辑允许查看自己的 Key，不进入共享设置/日志；依赖日志限警告。 | 历史泄露凭据仍需供应商后台撤销。 |
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
| [#47](https://github.com/liseami/DeepRant/issues/47) | 当前用户 NSIS，安装 / 启动 / 卸载脚本及 Windows Common Controls manifest 修复。 | Windows 2025 / 2022 实际安装、启动、卸载均通过。 |
| [#48](https://github.com/liseami/DeepRant/issues/48) | 风暴英雄语境。 | 游戏现场待验收。 |
| [#49](https://github.com/liseami/DeepRant/issues/49) | 常用语整体 / 逐条开关及自定义快捷键，默认整体关闭。 | 注册事务有原生单测。 |
| [#50](https://github.com/liseami/DeepRant/issues/50) | 维护升级、本机公证包交付和 2.0.0 正式发布。 | 三平台公开安装包已发布；游戏与视觉由用户验收。 |
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
| [#64](https://github.com/liseami/DeepRant/issues/64) | 2.0.1 为星际公民的自动游戏输入默认选择原生浮窗，不依赖聊天框复制；保留船名 / 航点语境，确认后核验原窗口与焦点再回填，消息由用户发送。 | 12 组路由回归覆盖星际公民 / LoL、日常及显式模式覆盖；游戏现场与 EAC 兼容由用户验收，不声称已获白名单或认证。 |

## PR 诉求独立吸收

- [#38](https://github.com/liseami/DeepRant/pull/38)：历史诉求是本地 DeepSeek-R1。独立实现吸收的是本地模型与推理能力：Ollama 无需 Key 的回环端点、可编辑模型、通用推理预算 / 超时、think 块剥离，过滤不再丢掉有效前文。当前轻量起始配置使用 Qwen3.5 4B，不再展示专用 R1 预设；仍可按服务能力自行配置历史模型。原 PR 未合并。
- [#59](https://github.com/liseami/DeepRant/pull/59)：Anthropic Messages、原生测连、Base URL 归一和详细诊断均已独立实现；可复制诊断只包含安全字段。没有吸收 Key 前缀日志、原始响应、重复请求管道或更换更新信任根。原 PR 未合并。

## 验证与交付

本机 Pages 现场反馈暴露了原生键盘线程错误：2026-10-12 崩溃堆栈显示后台 worker 经 Enigo 调用 Carbon / TIS 布局查询，触发系统主线程断言。现在创建 / 注入 / 释放统一派发至主线程，后台误调用在访问系统键盘前拒绝；权限错误附设置按钮，辅助功能状态来自当前签名进程。修复后仍由用户重试实际输入，不把回归单测等同于 Pages 现场通过。

主 Agent 执行前端构建、契约检查、原生单测、clippy 与本机包技术核验。用户负责全部视觉与游戏现场验收。子 Agent 不运行 build / test / typecheck，整合后清理 worktree 与中间产物。

开发交付沿 CCBaga 的 debug / custom-protocol / 事务重装流程，优先采用同组织稳定 Developer ID，无证书才回退临时签名。正式交付采用 release 分支、最终字节签名、同款 DMG 布局与安装验收门禁；[发布流水线 38261863210](https://github.com/liseami/DeepRant/actions/runs/38261863210) 的五个 job 全部成功，v2.0.0 固定在实际受测提交 `94434ff31d4f5313fa66f79dff024ca5992b693c`。

三平台前端构建、契约检查、Rust 单测、fmt 与 clippy 均通过。macOS ARM / Intel 应用及 DMG 的 Developer ID 签名、公证装订、票据和 Gatekeeper 验收通过；票据服务暂态错误仅有限退避，最终验收没有跳过。三平台最终更新归档通过官方 updater 的真实字节验证；同一 Windows 安装器在 Windows 2025 / 2022 实际安装、启动与卸载均成功。

主 Agent 下载了全部 10 个公开资产，逐一核对 SHA-256、三平台更新 URL / 签名与五个二进制的 GitHub 来源证明；来源限定本仓库 release 工作流及上述提交。本机已事务安装并启动同字节的 ARM 公证正式版，团队为 `6UB6WM6VQR`，安装前后 SQLite 文档逐字段一致、完整性检查通过，原版录屏与预览图哈希保真。上述技术证据不替代用户的 Pages、游戏和视觉现场验收。

发布后已删除 8 个历史 Release 及其 41 个资产、14 个历史标签和临时 Actions 产物；默认及唯一开发分支为 release，v2.0.0 的 10 个公开资产保留。子 Agent 的任务分支与 worktree 已清理，开发过程的中间编译产物也已移除。

2026-10-13 追加 #64：RSI 的 [EAC 官方说明](https://support.robertsspaceindustries.com/hc/en-us/articles/4412282759191-Easy-Anti-Cheat)明确描述了游戏文件修改与第三方软件限制。这里复用独立浮窗和操作系统输入，不改变游戏文件或 EAC 设置；若游戏拒绝模拟输入，保留可编辑译文供手动复制。[2.0.1](https://github.com/liseami/DeepRant/releases/tag/v2.0.1) 已通过 [Actions 38346898018](https://github.com/liseami/DeepRant/actions/runs/38346898018) 发布，标签固定受测提交 `5ef17c46351234094d9a0e44ee750dc7bf4a0b15`。原生 24 项测试通过；10 个公开资产的哈希、三平台更新清单及 5 个二进制来源证明均已核验，本机已安装并启动同字节 ARM 正式包，签名团队不变，SQLite 设置和原录屏完整保留。[#64](https://github.com/liseami/DeepRant/issues/64) 已说明操作步骤及现场验收边界后回复关闭。

该发布从首次启动到最终公开共 24 分 15 秒；Intel job 为 16 分 28 秒，ARM 因 Apple 票据网络错误仅重跑失败平台，复用 Windows / Intel 产物。对照 CCBaga 补齐 `cache-on-failure: true`，使失败后仍保存 Rust 编译缓存；修改已通过 actionlint，不为同版本缓存配置重跑整套发布。后续耗时仍取决于编译缓存命中、runner 排队与公证服务。

供应商资料：[DeepSeek](https://api-docs.deepseek.com/)、[OpenAI GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)、[Ollama Qwen3.5 4B](https://ollama.com/library/qwen3.5:4b)、[腾讯 TokenHub](https://cloud.tencent.com/document/product/1823/130079)、[腾讯旧 R1 下线](https://cloud.tencent.com/announce/detail/2258)、[硅基](https://api-docs.siliconflow.cn/docs/api/chat-completions-post)、[302.AI](https://doc.302.ai/171145944e0)、[R1 历史兼容建议](https://github.com/deepseek-ai/DeepSeek-R1#usage-recommendations)。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
