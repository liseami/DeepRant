use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};
use tauri::AppHandle;

fn get_system_prompt(from: &str, to: &str, scene: &str, mode: &str, daily_mode: bool) -> String {
    if daily_mode {
        return format!(
            r#"你是一个专业的翻译，请将用户输入从 语言代号：{} 翻译到 语言代号：{}。

<requirements>
- 直接输出翻译结果，不要解释
- 保持翻译的准确性和自然度
- 一句话表达核心含义
- 禁止重复内容</requirements>"#,
            from, to
        );
    }

    let base = format!(
        r#"<task>你是一个游戏玩家在游戏中进行文字交流的AI翻译家，现在，需要你将用户的输入从 语言代号：{} 翻译到语言代号： {}</task>

<output_format>
- 最大长度: 100个字符
- 最小长度: 20个字符
- 标点符号: 最多使用2个
- 换行符: 禁止使用
</output_format>"#,
        from, to
    );

    let mode_desc = match mode {
        "toxic" => {
            r#"<translate_style>
- 完成毒舌翻译
- 基于玩家的原文，进行3句以上的美国本土骂人俚语的扩写
- 用一些巧妙的形容，描述被骂的人的玩游戏玩得像什么...
- 深深地击碎对方的心灵，并且能够用象征符号来代替某些敏感词，以巧妙规避游戏内语言系统审核的屏蔽
- 保持游戏用语的准确性
- 用标点符号替代敏感词，但不要过度使用
- 优先使用经典的游戏圈嘲讽语录
</translate_style>"#
        }

        "pro" => {
            r#"<translate_style>
- 使用职业选手和解说员的表达方式
- 优先使用英文术语(roam而不是游走)
- 保持简短有力的15字句式
- 适当添加战术标记</translate_style>"#
        }

        "auto" => match scene {
            "dota2" | "lol" => {
                r#"<translate_style>
- 保留英文技能和装备缩写
- 使用MOBA游戏特有黑话
- 转换为选手间的简短指令
- 保持游戏中的交流节奏</translate_style>"#
            }

            "csgo" => {
                r#"<translate_style>
- 使用FPS战术简称(A1、B2等)
- 转换为标准报点格式
- 保留英文武器代号
- 使用经济术语(eco、force等)</translate_style>"#
            }

            _ => {
                r#"<translate_style>
- 识别并保留游戏术语
- 转换为玩家间常用表达
- 保持游戏交流的简洁性</translate_style>"#
            }
        },
        _ => "",
    };

    let scene_desc = match scene {
        "dota2" => {
            r#"<context>
- DOTA2游戏环境
- 保留英雄和物品简称
- 使用解说常用术语</context>"#
        }

        "lol" => {
            r#"<context>
- 英雄联盟游戏环境
- 保留技能和装备简称
- 使用赛事解说术语</context>"#
        }

        "csgo" => {
            r#"<context>
- CS:GO游戏环境
- 保留武器和位置代号
- 使用标准战术用语</context>"#
        }

        _ => {
            r#"<context>
- 通用游戏环境
- 识别常见游戏用语
- 保持游戏交流特点</context>"#
        }
    };

    format!(
        r#"{}

{}

{}

<requirements>
- 严格遵守output_format中的长度限制
- 直接输出翻译结果，不要解释
- 输出必须简短有力，禁止冗长
- 一句话表达核心含义
- 保持游戏术语准确性
- 禁止重复内容和无意义符号</requirements>"#,
        base, mode_desc, scene_desc
    )
}

fn get_model_config(settings: &crate::store::AppSettings) -> crate::store::ModelConfig {
    match settings.model_type.as_str() {
        "deepseek" => crate::store::ModelConfig {
            auth: "sk-jleighwqdtyssxeycgmwxqrhbofpsbkhtobofxhbeyebupyh".to_string(),
            api_url: "https://api.siliconflow.cn/v1/chat/completions".to_string(),
            model_name: "deepseek-ai/DeepSeek-V3".to_string(),
        },
        "deepseek-R1" => crate::store::ModelConfig {
            auth: "sk-jleighwqdtyssxeycgmwxqrhbofpsbkhtobofxhbeyebupyh".to_string(),
            api_url: "https://api.siliconflow.cn/v1/chat/completions".to_string(),
            model_name: "deepseek-ai/DeepSeek-R1".to_string(),
        },
        "stepfun" => crate::store::ModelConfig {
            auth: "605JU1zU7cGmFp0ibbZlZZ3Qra3lRH7FDtpvICyf2pTrRrUaO6CQgW8p3sQatd5Wh".to_string(),
            api_url: "https://api.stepfun.com/v1/chat/completions".to_string(),
            model_name: "step-2-16k".to_string(),
        },
        "custom" => settings.custom_model.clone(),
        _ => settings.custom_model.clone(),
    }
}

pub async fn translate_with_gpt(app: &AppHandle, original: &str) -> Result<String> {
    let settings = crate::store::get_settings(app)?;
    println!("当前翻译设置:");
    println!("- 源语言: {}", settings.translation_from);
    println!("- 目标语言: {}", settings.translation_to);
    println!("- 游戏场景: {}", settings.game_scene);
    println!("- 翻译模式: {}", settings.translation_mode);
    println!("- 日常模式: {}", settings.daily_mode);
    println!("- 模型类型: {}", settings.model_type);

    let model_config = get_model_config(&settings);

    println!("正在发送请求到: {}", model_config.api_url);
    println!("使用的模型: {}", model_config.model_name);
    println!("API密钥前缀: {}", &model_config.auth[..6]);

    let system_prompt = get_system_prompt(
        &settings.translation_from,
        &settings.translation_to,
        &settings.game_scene,
        &settings.translation_mode,
        settings.daily_mode,
    );

    let client = Client::new();

    let max_tokens = if settings.model_type == "deepseek-R1" {
        800
    } else {
        300
    };

    let request_body = json!({
        "model": model_config.model_name,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": original
            }
        ],
        "max_tokens": max_tokens,
        "temperature": 0.9,
        "top_p": 0.7,
        "n": 1,
        "stream": false,
        "presence_penalty": 0.3,
        "frequency_penalty": -0.3
    });

    let response = match client
        .post(&model_config.api_url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", model_config.auth))
        .json(&request_body)
        .send()
        .await
    {
        Ok(resp) => match resp.json::<Value>().await {
            Ok(json) => {
                // 先检查是否有错误信息
                if let Some(error) = json.get("error_msg").and_then(|msg| msg.as_str()) {
                    println!("API返回错误: {}", error);
                    return Ok(format!("[错误] {}", error));
                }
                json
            }
            Err(e) => {
                println!("解析响应JSON失败: {}", e);
                return Ok(format!("[错误] 服务器响应格式异常: {}", e));
            }
        },
        Err(e) => {
            let error_msg = match e.to_string().as_str() {
                msg if msg.contains("connection refused") => "无法连接到API服务器，请检查网络设置",
                msg if msg.contains("timeout") => "请求超时，请检查网络连接",
                msg if msg.contains("certificate") => "SSL证书验证失败，请检查网络设置",
                _ => "网络请求失败",
            };
            println!("请求失败: {}", e);
            return Ok(format!("[错误] {}", error_msg));
        }
    };

    // 解析响应
    let translated = match response
        .get("choices")
        .and_then(|choices| choices.as_array())
        .and_then(|choices| choices.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(|content| content.as_str())
    {
        Some(text) => {
            let text = text.trim();
            // 如果找到</think>标签，只保留其后内容
            if let Some(end_pos) = text.find("</think>") {
                text[(end_pos + 8)..].trim().to_string()
            } else {
                text.to_string()
            }
        }
        None => {
            println!("无法从响应中提取翻译结果: {:?}", response);
            return Ok("[错误] 服务器返回的数据格式异常".to_string());
        }
    };

    Ok(translated)
}
