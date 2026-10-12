/**
 * [INPUT]: 依赖 store 输入方式、game_composer 游戏浮窗、ai_translator 模型请求、clipboard-manager 与 enigo 原生输入；平台 API 提供焦点及修饰键状态
 * [OUTPUT]: 提供 trans_and_replace_text、send_phrase、共享 BusyGuard、Unicode 填入及 deeprant://input-status 事件
 * [POS]: 快捷键共享的串行输入事务。复制必须产生新文本，原文未变且焦点未离开才粘贴；状态和错误只进入 WebView。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use crate::ai_translator;
use anyhow::{anyhow, bail, Context, Result};
use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Settings,
};
use std::{
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter};
use tauri_plugin_clipboard_manager::ClipboardExt;

const POLL_INTERVAL: Duration = Duration::from_millis(40);
const COPY_TIMEOUT: Duration = Duration::from_millis(900);
const RELEASE_TIMEOUT: Duration = Duration::from_secs(2);
const PASTE_SETTLE: Duration = Duration::from_millis(200);
static INPUT_BUSY: AtomicBool = AtomicBool::new(false);
static COPY_SEQUENCE: AtomicU64 = AtomicU64::new(0);

pub fn report_status(app: &AppHandle, state: &str, message: &str) {
    let _ = app.emit(
        "deeprant://input-status",
        serde_json::json!({"state": state, "message": message}),
    );
}

// ---------------------------------------------------------------------------
// 事务：拒绝重复触发，不排队积累过期的输入意图
// ---------------------------------------------------------------------------

pub(crate) struct BusyGuard;
impl BusyGuard {
    pub(crate) fn acquire() -> Result<Self> {
        INPUT_BUSY
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .map_err(|_| anyhow!("输入事务正在进行，请等待完成后再触发快捷键"))?;
        Ok(Self)
    }
}
impl Drop for BusyGuard {
    fn drop(&mut self) {
        INPUT_BUSY.store(false, Ordering::Release);
    }
}

struct InputTransaction {
    app: AppHandle,
    focus: FocusWatch,
    _busy: BusyGuard,
}
impl InputTransaction {
    fn new(app: AppHandle, busy: BusyGuard) -> Result<Self> {
        let focus = FocusWatch::start()?;
        wait_for_modifiers(&focus)?;
        Ok(Self {
            app,
            focus,
            _busy: busy,
        })
    }

    fn copy_text(&self, select_all: bool) -> Result<String> {
        self.focus.check()?;
        wait_for_modifiers(&self.focus)?;
        let mut clipboard = ClipboardRestore::new(&self.app)?;
        let marker = format!(
            "DeepRant-copy-{}-{}",
            std::process::id(),
            COPY_SEQUENCE.fetch_add(1, Ordering::Relaxed)
        );
        clipboard.write(&marker)?;
        let revision = platform::clipboard_revision();
        if select_all {
            shortcut(&self.focus, 'a')?;
        }
        shortcut(&self.focus, 'c')?;
        let deadline = Instant::now() + COPY_TIMEOUT;
        while Instant::now() < deadline {
            self.focus.check()?;
            if platform::clipboard_revision() != revision {
                if let Ok(text) = self.app.clipboard().read_text() {
                    if text != marker {
                        clipboard.claim(&text);
                        if text.trim().is_empty() {
                            bail!("未复制到文本，请先选中需要翻译的内容");
                        }
                        return Ok(text);
                    }
                }
            }
            std::thread::sleep(POLL_INTERVAL);
        }
        bail!("当前输入框没有复制出文本。请先选中文本；游戏若禁用复制，请在首页切换游戏输入浮窗。Windows 还需检查双方权限级别是否一致，macOS 需授予辅助功能权限。")
    }

    fn paste(&self, text: &str) -> Result<()> {
        self.focus.check()?;
        wait_for_modifiers(&self.focus)?;
        let mut clipboard = ClipboardRestore::new(&self.app)?;
        clipboard.write(text)?;
        report_status(&self.app, "pasting", "正在粘贴译文");
        shortcut(&self.focus, 'v')?;
        // 给目标程序处理粘贴的机会；剪贴板若被用户改写，恢复器会保留用户的新内容。
        std::thread::sleep(PASTE_SETTLE);
        Ok(())
    }
}

pub async fn trans_and_replace_text(app: &AppHandle) -> Result<()> {
    if crate::game_composer::focus_existing(app)? {
        return Ok(());
    }
    let settings = crate::store::get_settings(app)?;
    if crate::game_composer::should_compose(&settings) {
        return crate::game_composer::open(app).await;
    }
    let busy = BusyGuard::acquire()?;
    let app = app.clone();
    let select_all = !settings.daily_mode;
    let (transaction, original) = tauri::async_runtime::spawn_blocking(move || {
        let transaction = InputTransaction::new(app, busy)?;
        report_status(&transaction.app, "copying", "正在读取输入框文本");
        let original = transaction.copy_text(select_all)?;
        Ok::<_, anyhow::Error>((transaction, original))
    })
    .await
    .context("输入任务被中断")??;
    report_status(&transaction.app, "translating", "正在翻译，原文保持不变");
    let translated = ai_translator::translate_with_gpt(&transaction.app, &original).await?;
    if translated.trim().is_empty() {
        bail!("模型返回空译文，原文保持不变");
    }
    tauri::async_runtime::spawn_blocking(move || {
        transaction.focus.check()?;
        // 网络等待期间用户可能继续编辑；重新复制并核对，避免覆盖新的文字或选区。
        if transaction.copy_text(select_all)? != original {
            bail!("翻译期间输入内容或选区发生变化，已取消自动粘贴。请在手动翻译页继续。");
        }
        transaction.paste(&translated)?;
        report_status(&transaction.app, "done", "粘贴操作已发送，请确认目标输入框");
        Ok(())
    })
    .await
    .context("粘贴任务被中断")?
}

pub async fn send_phrase(app: &AppHandle, phrase: &str) -> Result<()> {
    if phrase.trim().is_empty() {
        bail!("常用语内容为空");
    }
    let busy = BusyGuard::acquire()?;
    let app = app.clone();
    let phrase = phrase.to_string();
    tauri::async_runtime::spawn_blocking(move || {
        let transaction = InputTransaction::new(app, busy)?;
        transaction.paste(&phrase)?;
        report_status(
            &transaction.app,
            "done",
            "常用语粘贴操作已发送，请确认目标输入框",
        );
        Ok(())
    })
    .await
    .context("常用语任务被中断")?
}

// ---------------------------------------------------------------------------
// 原生输入：先等待物理修饰键释放，每一步都验证焦点，异常仍释放注入的修饰键
// ---------------------------------------------------------------------------

fn wait_for_modifiers(focus: &FocusWatch) -> Result<()> {
    let deadline = Instant::now() + RELEASE_TIMEOUT;
    while platform::modifiers_down() {
        focus.check()?;
        if Instant::now() >= deadline {
            bail!("请松开 Control / Alt / Shift / Command / Windows 键后重试");
        }
        std::thread::sleep(POLL_INTERVAL);
    }
    focus.check()
}

fn shortcut(focus: &FocusWatch, letter: char) -> Result<()> {
    focus.check()?;
    let settings = Settings {
        open_prompt_to_get_permissions: false,
        ..Settings::default()
    };
    let mut enigo = Enigo::new(&settings).map_err(|e| anyhow!("无法注入按键：macOS 请授予辅助功能权限；Windows 请确认目标与 DeepRant 的权限级别一致。{e}"))?;
    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control;
    enigo.key(modifier, Press)?;
    let click = enigo.key(Key::Unicode(letter), Click);
    let release = enigo.key(modifier, Release);
    click.context("目标程序拒绝按键输入；请改用手动翻译")?;
    release.context("释放注入的修饰键失败")?;
    std::thread::sleep(Duration::from_millis(50));
    focus.check()
}

/// 浮窗只写 Unicode 文本，不修改剪贴板、不选择原文、不发送回车。
pub(crate) fn type_composed_text(text: &str, check_focus: impl Fn() -> Result<()>) -> Result<()> {
    let deadline = Instant::now() + RELEASE_TIMEOUT;
    while platform::modifiers_down() {
        check_focus()?;
        if Instant::now() >= deadline {
            bail!("请松开修饰键后再次填入译文");
        }
        std::thread::sleep(POLL_INTERVAL);
    }
    check_focus()?;
    let mut enigo = Enigo::new(&Settings {
        open_prompt_to_get_permissions: false,
        ..Settings::default()
    })
    .map_err(|_| anyhow!("无法输入译文：请检查 macOS 辅助功能权限或 Windows 双方权限级别"))?;
    check_focus()?;
    enigo
        .text(text)
        .context("系统拒绝文本输入，可能已输入部分文字；请检查游戏聊天框再决定是否重试")
}

// ---------------------------------------------------------------------------
// 剪贴板：支持纯文本、图片及空剪贴板；其他格式不覆盖。只恢复本事务仍拥有的内容。
// ---------------------------------------------------------------------------

enum ClipboardBackup {
    Text(String),
    Image(tauri::image::Image<'static>),
    Empty,
}
struct ClipboardRestore {
    app: AppHandle,
    backup: ClipboardBackup,
    owned: Option<(String, u64)>,
}
impl ClipboardRestore {
    fn new(app: &AppHandle) -> Result<Self> {
        let backup = if let Ok(text) = app.clipboard().read_text() {
            ClipboardBackup::Text(text)
        } else if let Ok(image) = app.clipboard().read_image() {
            ClipboardBackup::Image(tauri::image::Image::new_owned(
                image.rgba().to_vec(),
                image.width(),
                image.height(),
            ))
        } else if platform::clipboard_empty() {
            ClipboardBackup::Empty
        } else {
            bail!("剪贴板包含无法安全恢复的格式，请先复制一段纯文本或使用手动翻译页");
        };
        Ok(Self {
            app: app.clone(),
            backup,
            owned: None,
        })
    }
    fn write(&mut self, text: &str) -> Result<()> {
        self.app.clipboard().write_text(text)?;
        self.claim(text);
        Ok(())
    }
    fn claim(&mut self, text: &str) {
        self.owned = Some((text.to_string(), platform::clipboard_revision()));
    }
}
impl Drop for ClipboardRestore {
    fn drop(&mut self) {
        let Some((text, revision)) = &self.owned else {
            return;
        };
        if platform::clipboard_revision() != *revision
            || self.app.clipboard().read_text().ok().as_ref() != Some(text)
        {
            return;
        }
        let restored = match &self.backup {
            ClipboardBackup::Text(text) => self.app.clipboard().write_text(text),
            ClipboardBackup::Image(image) => self.app.clipboard().write_image(image),
            ClipboardBackup::Empty => self.app.clipboard().clear(),
        };
        if restored.is_err() {
            report_status(
                &self.app,
                "error",
                "操作结束，但系统拒绝恢复剪贴板；当前复制内容已保留",
            );
        }
    }
}

// ---------------------------------------------------------------------------
// 焦点监视：离开后返回原窗口也取消；一个事务只使用一个短生命周期监视线程
// ---------------------------------------------------------------------------

struct FocusWatch {
    snapshot: Arc<platform::Focus>,
    changed: Arc<AtomicBool>,
    stop: Arc<AtomicBool>,
    worker: Option<std::thread::JoinHandle<()>>,
}
impl FocusWatch {
    fn start() -> Result<Self> {
        let snapshot = Arc::new(platform::Focus::capture()?);
        let changed = Arc::new(AtomicBool::new(false));
        let stop = Arc::new(AtomicBool::new(false));
        let (target, was_changed, finished) = (snapshot.clone(), changed.clone(), stop.clone());
        // ponytail: 40ms 原生焦点轮询；若需要捕获更短的窗口切换，改用平台焦点事件订阅。
        let worker = std::thread::Builder::new()
            .name("deeprant-focus".into())
            .spawn(move || {
                while !finished.load(Ordering::Acquire) {
                    if !target.is_current() {
                        was_changed.store(true, Ordering::Release);
                        break;
                    }
                    std::thread::sleep(POLL_INTERVAL);
                }
            })?;
        Ok(Self {
            snapshot,
            changed,
            stop,
            worker: Some(worker),
        })
    }
    fn check(&self) -> Result<()> {
        if self.changed.load(Ordering::Acquire) || !self.snapshot.is_current() {
            self.changed.store(true, Ordering::Release);
            bail!("焦点在操作期间发生变化，已取消自动粘贴。请回到原输入框重试或使用手动翻译页。");
        }
        Ok(())
    }
}
impl Drop for FocusWatch {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Release);
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use super::*;
    #[repr(C)]
    struct GuiThreadInfo {
        size: u32,
        flags: u32,
        active: isize,
        focus: isize,
        capture: isize,
        menu: isize,
        move_size: isize,
        caret: isize,
        rect: [i32; 4],
    }
    #[link(name = "user32")]
    extern "system" {
        fn GetForegroundWindow() -> isize;
        fn GetWindowThreadProcessId(window: isize, pid: *mut u32) -> u32;
        fn GetGUIThreadInfo(thread: u32, info: *mut GuiThreadInfo) -> i32;
        fn GetAsyncKeyState(key: i32) -> i16;
        fn GetClipboardSequenceNumber() -> u32;
        fn CountClipboardFormats() -> i32;
    }
    #[derive(PartialEq)]
    pub struct Focus {
        window: isize,
        control: isize,
        pid: u32,
    }
    impl Focus {
        pub fn capture() -> Result<Self> {
            // SAFETY: 系统 API 写入初始化过的 POD 结构，无窗口消息或跨进程内存操作。
            unsafe {
                let window = GetForegroundWindow();
                if window == 0 {
                    bail!("没有可用的前台输入窗口，请使用手动翻译页");
                }
                let mut pid = 0;
                let thread = GetWindowThreadProcessId(window, &mut pid);
                let mut info: GuiThreadInfo = std::mem::zeroed();
                info.size = std::mem::size_of::<GuiThreadInfo>() as u32;
                if thread == 0 || GetGUIThreadInfo(thread, &mut info) == 0 || info.focus == 0 {
                    bail!("无法确认目标输入焦点，请在普通输入框中重试或切换游戏输入浮窗");
                }
                Ok(Self {
                    window,
                    control: info.focus,
                    pid,
                })
            }
        }
        pub fn is_current(&self) -> bool {
            Self::capture().map(|now| now == *self).unwrap_or(false)
        }
    }
    pub fn modifiers_down() -> bool {
        unsafe {
            [0x10, 0x11, 0x12, 0x5b, 0x5c]
                .iter()
                .any(|key| GetAsyncKeyState(*key) < 0)
        }
    }
    pub fn clipboard_revision() -> u64 {
        unsafe { GetClipboardSequenceNumber() as u64 }
    }
    pub fn clipboard_empty() -> bool {
        unsafe { CountClipboardFormats() == 0 }
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use super::*;
    use std::ffi::{c_char, c_void};
    type Ref = *const c_void;
    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXIsProcessTrusted() -> u8;
        fn AXUIElementCreateSystemWide() -> Ref;
        fn AXUIElementCopyAttributeValue(element: Ref, attribute: Ref, value: *mut Ref) -> i32;
        fn AXUIElementGetPid(element: Ref, pid: *mut i32) -> i32;
        fn AXUIElementSetMessagingTimeout(element: Ref, timeout: f32) -> i32;
        fn CGEventSourceFlagsState(state: i32) -> u64;
    }
    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFStringCreateWithCString(allocator: Ref, value: *const c_char, encoding: u32) -> Ref;
        fn CFRelease(value: Ref);
        fn CFEqual(left: Ref, right: Ref) -> u8;
    }
    #[link(name = "objc")]
    extern "C" {
        fn objc_getClass(name: *const c_char) -> Ref;
        fn sel_registerName(name: *const c_char) -> Ref;
        fn objc_msgSend();
    }
    struct Owned(usize);
    impl Drop for Owned {
        fn drop(&mut self) {
            if self.0 != 0 {
                unsafe {
                    CFRelease(self.0 as Ref);
                }
            }
        }
    }
    fn attribute(element: Ref, name: &[u8]) -> Option<Owned> {
        unsafe {
            let name = Owned(CFStringCreateWithCString(
                std::ptr::null(),
                name.as_ptr().cast(),
                0x08000100,
            ) as usize);
            if name.0 == 0 {
                return None;
            }
            let mut value = std::ptr::null();
            if AXUIElementCopyAttributeValue(element, name.0 as Ref, &mut value) == 0
                && !value.is_null()
            {
                Some(Owned(value as usize))
            } else {
                None
            }
        }
    }
    pub struct Focus {
        application: Owned,
        target: Owned,
        pid: i32,
    }
    impl Focus {
        pub fn capture() -> Result<Self> {
            // SAFETY: AX Copy/Create 的引用由 Owned 释放；存储整数句柄便于只读跨线程比较。
            unsafe {
                if AXIsProcessTrusted() == 0 {
                    bail!("请在 macOS 系统设置 → 隐私与安全性 → 辅助功能中启用 DeepRant，然后重启应用");
                }
                let system = Owned(AXUIElementCreateSystemWide() as usize);
                if system.0 == 0 {
                    bail!("无法读取 macOS 输入焦点");
                }
                AXUIElementSetMessagingTimeout(system.0 as Ref, 0.25);
                let application = attribute(system.0 as Ref, b"AXFocusedApplication\0")
                    .ok_or_else(|| anyhow!("无法读取前台应用，请使用手动翻译页"))?;
                let target = attribute(application.0 as Ref, b"AXFocusedUIElement\0")
                    .or_else(|| attribute(application.0 as Ref, b"AXFocusedWindow\0"))
                    .ok_or_else(|| anyhow!("当前程序未提供可确认的输入焦点，请切换游戏输入浮窗"))?;
                let mut pid = 0;
                if AXUIElementGetPid(application.0 as Ref, &mut pid) != 0 {
                    bail!("无法确认前台应用身份");
                }
                Ok(Self {
                    application,
                    target,
                    pid,
                })
            }
        }
        pub fn is_current(&self) -> bool {
            Self::capture()
                .map(|now| unsafe {
                    self.pid == now.pid
                        && CFEqual(self.application.0 as Ref, now.application.0 as Ref) != 0
                        && CFEqual(self.target.0 as Ref, now.target.0 as Ref) != 0
                })
                .unwrap_or(false)
        }
    }
    pub fn modifiers_down() -> bool {
        unsafe { CGEventSourceFlagsState(1) & ((1 << 17) | (1 << 18) | (1 << 19) | (1 << 20)) != 0 }
    }
    fn pasteboard() -> Ref {
        unsafe {
            let send: unsafe extern "C" fn(Ref, Ref) -> Ref =
                std::mem::transmute(objc_msgSend as *const ());
            send(
                objc_getClass(c"NSPasteboard".as_ptr()),
                sel_registerName(c"generalPasteboard".as_ptr()),
            )
        }
    }
    pub fn clipboard_revision() -> u64 {
        unsafe {
            let send: unsafe extern "C" fn(Ref, Ref) -> isize =
                std::mem::transmute(objc_msgSend as *const ());
            send(pasteboard(), sel_registerName(c"changeCount".as_ptr())) as u64
        }
    }
    pub fn clipboard_empty() -> bool {
        unsafe {
            let send: unsafe extern "C" fn(Ref, Ref) -> Ref =
                std::mem::transmute(objc_msgSend as *const ());
            let count: unsafe extern "C" fn(Ref, Ref) -> usize =
                std::mem::transmute(objc_msgSend as *const ());
            count(
                send(pasteboard(), sel_registerName(c"types".as_ptr())),
                sel_registerName(c"count".as_ptr()),
            ) == 0
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod platform {
    use super::*;
    pub struct Focus;
    impl Focus {
        pub fn capture() -> Result<Self> {
            bail!("此平台尚未提供安全的原生焦点校验，请使用手动翻译页");
        }
        pub fn is_current(&self) -> bool {
            false
        }
    }
    pub fn modifiers_down() -> bool {
        false
    }
    pub fn clipboard_revision() -> u64 {
        0
    }
    pub fn clipboard_empty() -> bool {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn input_transactions_reject_reentry_and_release_after_drop() {
        let first = BusyGuard::acquire().unwrap();
        assert!(BusyGuard::acquire().is_err());
        drop(first);
        assert!(BusyGuard::acquire().is_ok());
    }
}
