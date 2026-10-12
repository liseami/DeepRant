/**
 * [INPUT]: 依赖 AppSettings 的 game_scene / custom_scene_* / custom_glossary
 * [OUTPUT]: 提供场景提示词片段与场景目录；ai_translator 只消费这里，不内嵌游戏名单
 * [POS]: 游戏语境的单一数据源。新增游戏只改此文件与前端 scenes 表。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

pub struct SceneDef {
    pub id: &'static str,
    pub context: &'static str,
}

pub const SCENES: &[SceneDef] = &[
    SceneDef {
        id: "dota2",
        context: r#"<context>
• 环境: DOTA2
• 英雄简称（如ES=撼地神牛）
• 物品缩写（如BKB）
• 使用赛事解说术语
• 保持团战节奏感
</context>"#,
    },
    SceneDef {
        id: "lol",
        context: r#"<context>
• 环境: 英雄联盟
• 保留技能和装备简称
• 使用赛事解说术语
• 分路用语：上中下野辅
</context>"#,
    },
    SceneDef {
        id: "csgo",
        context: r#"<context>
• 环境: CS2 / CS:GO
• 保留武器和位置代号
• 使用标准战术用语
</context>"#,
    },
    SceneDef {
        id: "valorant",
        context: r#"<context>
• 环境: 无畏契约
• 保留特工名与技能简称
• 报点用站点与包点
</context>"#,
    },
    SceneDef {
        id: "overwatch",
        context: r#"<context>
• 环境: 守望先锋
• 保留英雄与终极技能名
• 分组用语：坦克/输出/支援
</context>"#,
    },
    SceneDef {
        id: "apex",
        context: r#"<context>
• 环境: Apex Legends
• 保留传奇名与武器简称
• 环圈、重生信标、撤离
</context>"#,
    },
    SceneDef {
        id: "pubg",
        context: r#"<context>
• 环境: PUBG
• 保留枪械与防具等级
• 圈、载具、空投
</context>"#,
    },
    SceneDef {
        id: "fortnite",
        context: r#"<context>
• 环境: Fortnite
• 建造、材料、风暴圈
</context>"#,
    },
    SceneDef {
        id: "minecraft",
        context: r#"<context>
• 环境: Minecraft
• 保留方块与生物英文名
</context>"#,
    },
    SceneDef {
        id: "warzone",
        context: r#"<context>
• 环境: Call of Duty Warzone
• 保留武器改装与买活
</context>"#,
    },
    SceneDef {
        id: "wow",
        context: r#"<context>
• 环境: 魔兽世界
• 保留职业、技能与副本简称
</context>"#,
    },
    SceneDef {
        id: "marvel_rivals",
        context: r#"<context>
• 环境: 漫威争锋
• 保留英雄与团队技能名
• 6v6 目标点与推车
</context>"#,
    },
    SceneDef {
        id: "hots",
        context: r#"<context>
• 环境: 风暴英雄
• 保留英雄与天赋名
• 地图目标与经验兵线
</context>"#,
    },
    SceneDef {
        id: "star_citizen",
        context: r#"<context>
• 环境: 星际公民
• 保留船名、航点与职业用语
• 聊天频道用语保持简短
</context>"#,
    },
    SceneDef {
        id: "wows",
        context: r#"<context>
• 环境: 战舰世界
• 船名用官方或玩家通用译名
• 保留口径、隐蔽、点烟等术语
</context>"#,
    },
    SceneDef {
        id: "naraka",
        context: r#"<context>
• 环境: 永劫无间
• 保留英雄与魂玉名
• 近战连招与振刀用语
</context>"#,
    },
    SceneDef {
        id: "r6",
        context: r#"<context>
• 环境: 彩虹六号围攻
• 保留干员与地图点位
• 拆包、reinforce、竖井
</context>"#,
    },
    SceneDef {
        id: "the_division_2",
        context: r#"<context>
• 环境: 全境封锁2
• 保留装备品牌与技能名
</context>"#,
    },
    SceneDef {
        id: "mengsanguo",
        context: r#"<context>
• 环境: 梦三国
• 保留武将与装备简称
• MOBA 分路与团战节奏
</context>"#,
    },
    SceneDef {
        id: "wot",
        context: "<context>环境: 坦克世界。保留坦克型号、穿深、装填、装甲角度与地图点位的通用译名。</context>",
    },
    SceneDef {
        id: "honor_of_kings",
        context: "<context>环境: 王者荣耀 / Honor of Kings。保留英雄、装备、分路与团战用语；这里只提供桌面翻译语境。</context>",
    },
    SceneDef {
        id: "yanyun",
        context: r#"<context>
• 环境: 燕云十六声
• 保留门派、轻功与装备用语
</context>"#,
    },
];

const GENERAL_CONTEXT: &str = r#"<context>
• 通用游戏环境
• 识别常见游戏用语
• 保持游戏交流特点
</context>"#;

pub fn scene_context(scene: &str, custom_name: &str, custom_prompt: &str) -> String {
    if scene == "custom" {
        let name = if custom_name.trim().is_empty() {
            "自定义场景"
        } else {
            custom_name.trim()
        };
        let extra = custom_prompt.trim();
        return format!(
            "<context>\n• 环境: {}\n• {}\n</context>",
            name,
            if extra.is_empty() {
                "按用户自定义语境翻译"
            } else {
                extra
            }
        );
    }
    SCENES
        .iter()
        .find(|item| item.id == scene)
        .map(|item| item.context.to_string())
        .unwrap_or_else(|| GENERAL_CONTEXT.to_string())
}

pub fn glossary_block(glossary: &str) -> String {
    let glossary = glossary.trim();
    if glossary.is_empty() {
        return String::new();
    }
    format!("<glossary>\n按对照表优先：\n{}\n</glossary>", glossary)
}
