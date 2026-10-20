#[cfg(feature = "custom-protocol")]
use tauri::{path::BaseDirectory, Manager};
/**
 * [INPUT]: 依赖 Tauri 窗口身份、应用主题、资源目录和原生剪贴板 / 浏览器插件。
 * [OUTPUT]: 提供 copy_plain_text、open_external_link、get_demo_video_url 三个桌面命令与 apply_appearance。
 * [POS]: 页面只提交复制文本或固定外链 ID；路径、平台协议、应用外观与系统交互由 Rust 决定，不扩展任意文件访问。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use tauri::{AppHandle, Theme, WebviewWindow};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_opener::OpenerExt;

const MAX_COPY_BYTES: usize = 64 * 1024;

fn require_main(window: &WebviewWindow) -> Result<(), String> {
    if window.label() == "main" {
        Ok(())
    } else {
        Err("此操作只能从主窗口发起".to_string())
    }
}

#[tauri::command]
pub fn copy_plain_text(app: AppHandle, window: WebviewWindow, text: String) -> Result<(), String> {
    if !matches!(window.label(), "main" | "composer") {
        return Err("此窗口不能复制文本".to_string());
    }
    if text.len() > MAX_COPY_BYTES {
        return Err("复制文本不能超过 64 KiB".to_string());
    }
    app.clipboard()
        .write_text(text)
        .map_err(|_| "系统拒绝复制文本，请重试".to_string())
}

fn external_link(id: &str) -> Result<&'static str, String> {
    match id {
        "deepseek-platform" => Ok("https://platform.deepseek.com/api_keys"),
        "releases" => Ok("https://github.com/liseami/DeepRant/releases"),
        "developer-x" => Ok("https://x.com/liseami1"),
        "developer-xiaohongshu" => {
            Ok("https://www.xiaohongshu.com/user/profile/597898e15e87e727f19b1003")
        }
        "developer-course" => Ok("https://chunxiang.space"),
        _ => Err("没有这个外部链接入口".to_string()),
    }
}

#[tauri::command]
pub fn open_external_link(app: AppHandle, window: WebviewWindow, id: String) -> Result<(), String> {
    require_main(&window)?;
    app.opener()
        .open_url(external_link(&id)?, None::<&str>)
        .map_err(|_| "无法打开系统浏览器，请重试".to_string())
}

// -------- 应用级主题同时驱动原生标题栏与全部 WebView 的 prefers-color-scheme --------
pub fn apply_appearance(app: &AppHandle, appearance: &str) {
    app.set_theme(match appearance {
        "light" => Some(Theme::Light),
        "dark" => Some(Theme::Dark),
        _ => None,
    });
}

#[cfg(any(feature = "custom-protocol", test))]
fn asset_video_url(path: &str) -> String {
    // -------- URI 单段编码与 Tauri asset 解码对应，保留空格、中文和 Windows 路径 --------
    const HEX: &[u8; 16] = b"0123456789ABCDEF";
    let mut encoded = String::with_capacity(path.len());
    for byte in path.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'.' | b'_' | b'~') {
            encoded.push(char::from(byte));
        } else {
            encoded.push('%');
            encoded.push(char::from(HEX[usize::from(byte >> 4)]));
            encoded.push(char::from(HEX[usize::from(byte & 15)]));
        }
    }
    if cfg!(any(target_os = "windows", target_os = "android")) {
        format!("http://asset.localhost/{encoded}")
    } else {
        format!("asset://localhost/{encoded}")
    }
}

#[tauri::command]
pub fn get_demo_video_url(app: AppHandle, window: WebviewWindow) -> Result<String, String> {
    require_main(&window)?;
    #[cfg(feature = "custom-protocol")]
    {
        let path = app
            .path()
            .resolve("media/demovideo.mp4", BaseDirectory::Resource)
            .map_err(|_| "无法解析随包演示视频".to_string())?;
        let path = path
            .to_str()
            .ok_or_else(|| "演示视频路径编码无效".to_string())?;
        Ok(asset_video_url(path))
    }
    #[cfg(not(feature = "custom-protocol"))]
    {
        let _ = app;
        // -------- 开发服务器提供同一源文件，不扫描目录或复制第二份视频 --------
        Ok("/src/assets/demovideo.mp4".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::{asset_video_url, external_link};

    #[test]
    fn fixed_links_and_asset_component_stay_inside_the_native_boundary() {
        assert!(external_link("https://example.com").is_err());
        assert_eq!(
            external_link("deepseek-platform").unwrap(),
            "https://platform.deepseek.com/api_keys"
        );
        assert!(asset_video_url("C:\\游戏 demo\\demovideo.mp4")
            .ends_with("C%3A%5C%E6%B8%B8%E6%88%8F%20demo%5Cdemovideo.mp4"));
    }
}
