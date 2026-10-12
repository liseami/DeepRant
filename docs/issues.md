# DeepRant 2.0 问题覆盖记录

调查截点：2026-10-12。开放 issue 39 个，PR 2 个。关闭表示此轮实现、替代流程或明确产品边界已有落点；不等同于逐款游戏、杀毒产品或第三方模型均做过现场验证。

## 根因与架构

设置只有 Rust 一个写入口，凭据与普通配置分离；模型协议集中在请求边界，语境集中在数据目录；快捷键注册和持久化一起提交；输入事务先取证再改写。移除默认共享 Key、平台脚本和虚构额度；保留原页面入口、原游戏演示与三卡操作骨架，以 CCBaga 同源 Laper App / Pika 体系提升视觉。发布采用 CCBaga 的最终字节签名和统一验收。

## 完整覆盖

| Issue | 分类 | 处理落点 |
| --- | --- | --- |
| [#5](https://github.com/liseami/DeepRant/issues/5) 为什么我按快捷键没反应啊 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#10](https://github.com/liseami/DeepRant/issues/10) GUI是否可以加入英文支持，歪果朋友也想用！ | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#17](https://github.com/liseami/DeepRant/issues/17) 请求支持游戏：彩虹六号：围攻和全境封锁2 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#20](https://github.com/liseami/DeepRant/issues/20) 请求支持游戏：漫威争锋 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#21](https://github.com/liseami/DeepRant/issues/21) windos环境用不了 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#24](https://github.com/liseami/DeepRant/issues/24) 请求支持游戏永劫无间 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#26](https://github.com/liseami/DeepRant/issues/26) 请求增加新游戏环境：战舰世界 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#28](https://github.com/liseami/DeepRant/issues/28) 骂人语言有点匮乏了 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#29](https://github.com/liseami/DeepRant/issues/29) 能否支持手机端游戏 | 产品边界 | 自定义兼容端点满足 API 接入；不接受商务合作、不发布手机客户端。王者荣耀桌面语境已加入。 |
| [#32](https://github.com/liseami/DeepRant/issues/32) 只会喷美国人不会喷英国人 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#33](https://github.com/liseami/DeepRant/issues/33) 能不能开一个网络嘴替功能，针对dy，xhs等活跃网民聚集地 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#34](https://github.com/liseami/DeepRant/issues/34) 硅基流动的 API Key 泄露了 | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#35](https://github.com/liseami/DeepRant/issues/35) windows下英雄联盟理论上用不成 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#36](https://github.com/liseami/DeepRant/issues/36) 不知是我的电脑的问题还是1.1.9有问题，win下载后显示有病毒 | 交付与社区反馈 | 重建用户流程和安装发布；源码固定、哈希和签名更新。安全软件误报仍由供应商判定，不承诺零误报。 |
| [#37](https://github.com/liseami/DeepRant/issues/37) 请求支持游戏燕云十六声 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#39](https://github.com/liseami/DeepRant/issues/39) windows环境下需修复和建议 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#40](https://github.com/liseami/DeepRant/issues/40) API以及windows问题 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#41](https://github.com/liseami/DeepRant/issues/41) 可以支持下腾讯云的 DeepSeekr1 吗 | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#42](https://github.com/liseami/DeepRant/issues/42) 请求添加游戏漫威争锋 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#43](https://github.com/liseami/DeepRant/issues/43) 请求支持游戏：梦三国 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#44](https://github.com/liseami/DeepRant/issues/44) windows下英雄联盟游戏不生效 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#45](https://github.com/liseami/DeepRant/issues/45) 我自己的硅基流动api可以怎么用不了啊 | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#46](https://github.com/liseami/DeepRant/issues/46) 一直提示 [错误] 服务器返回的数据格式异常 | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#47](https://github.com/liseami/DeepRant/issues/47) window这个包为什么打不开 | 交付与社区反馈 | 重建用户流程和安装发布；源码固定、哈希和签名更新。安全软件误报仍由供应商判定，不承诺零误报。 |
| [#48](https://github.com/liseami/DeepRant/issues/48) 请求支持游戏《风暴英雄》 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#49](https://github.com/liseami/DeepRant/issues/49) 请求给常用语添加一个开关 | 快捷键与常用语 | 可配置、小键盘/F 键、冲突回滚、逐条/整体开关；默认关闭。 |
| [#50](https://github.com/liseami/DeepRant/issues/50) 开发者这是弃坑了？ | 交付与社区反馈 | 重建用户流程和安装发布；源码固定、哈希和签名更新。安全软件误报仍由供应商判定，不承诺零误报。 |
| [#51](https://github.com/liseami/DeepRant/issues/51) API测试失败：Failed to featch | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#52](https://github.com/liseami/DeepRant/issues/52) Windows英雄联盟无法在游戏内使用 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#53](https://github.com/liseami/DeepRant/issues/53) 申请将302.AI添加至DeepRant的模型供应商板块 -- 来自302.AI | 产品边界 | 自定义兼容端点满足 API 接入；不接受商务合作、不发布手机客户端。王者荣耀桌面语境已加入。 |
| [#54](https://github.com/liseami/DeepRant/issues/54) 请求增加《星际公民》 聊天频道翻译的支持 | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#55](https://github.com/liseami/DeepRant/issues/55) 希望添加更改常用语快捷键的功能 | 快捷键与常用语 | 可配置、小键盘/F 键、冲突回滚、逐条/整体开关；默认关闭。 |
| [#56](https://github.com/liseami/DeepRant/issues/56) 用不了吗，翻译不行了 | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#57](https://github.com/liseami/DeepRant/issues/57) 用不了的兄弟自己注册个大模型的key就行了 | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#58](https://github.com/liseami/DeepRant/issues/58) 我更新了下这个项目 | 交付与社区反馈 | 重建用户流程和安装发布；源码固定、哈希和签名更新。安全软件误报仍由供应商判定，不承诺零误报。 |
| [#60](https://github.com/liseami/DeepRant/issues/60) 游戏模式可以增加一个自定义？ | 游戏、自定义语境与语言 | 场景目录覆盖游戏请求，自定义提示词与术语表；英式英语、中文直出与中英界面。 |
| [#61](https://github.com/liseami/DeepRant/issues/61) MAC的英雄联盟游戏作战内部快捷键无反应 | 系统输入与权限 | 原生输入事务、释放修饰键、复制成功核验、焦点与原文保护；受限输入框使用手动翻译，未声称实测所有游戏。 |
| [#62](https://github.com/liseami/DeepRant/issues/62) json输入报错 | 凭据与模型请求 | 自用 Key → 系统凭据库；测试与翻译同一原生请求管道；端点归一和响应诊断。 |
| [#63](https://github.com/liseami/DeepRant/issues/63) 按键设置问题 | 快捷键与常用语 | 可配置、小键盘/F 键、冲突回滚、逐条/整体开关；默认关闭。 |

## PR 请求与处理

- [#38](https://github.com/liseami/DeepRant/pull/38)：希望本地 DeepSeek-R1 可用。旧改动依赖名称前缀判断、仍使用旧共享请求路径。本轮实现可编辑本地端点、无 Key 的回环服务，以及隔离最终文本和 `<think>` 输出；不合并原 diff。
- [#59](https://github.com/liseami/DeepRant/pull/59)：希望 Anthropic、原生测连、Base URL 与错误诊断。方向被本轮独立实现吸收；原 diff 仍输出 Key 前缀并保留双请求路径与旧发布流程，不合并原 diff。

## 验证与限制

主 Agent 负责本机契约检查、前端构建、原生单测、clippy 和 UI 验收；CI 负责 Windows 原生检查、安装/启动/卸载及 macOS 双架构最终产物验收。子 Agent 未运行 build/test/typecheck，交付即清理 worktree。

LoL 等游戏限制复制或不公开焦点时，自动翻译明确失败并保留输入，使用手动翻译作为可用路径。未声称绕过游戏反作弊、UIPI 或全部杀毒产品信誉判定。历史源码共享 Key 的撤销必须在供应商后台完成；当前项目没有可以代表供应商撤销凭据的授权会话。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
