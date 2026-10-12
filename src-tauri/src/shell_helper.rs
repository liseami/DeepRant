/**
 * [INPUT]: store / game_composer / inline_translation、clipboard-manager 与 native_keyboard 主线程注入；平台 API 提供权限、焦点和修饰键状态。
 * [OUTPUT]: 原位翻译/常用语、共享 BusyGuard、有限选区与 Unicode 回填；诊断事件只含阶段和原文恢复可用标志。
 * [POS]: 串行原生输入边界；占位提交/回滚交给 inline_translation，日常只处理原选区，游戏向当前行首选取而不全选文档。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use anyhow::{anyhow, bail, Context, Result};
use enigo::{
    Direction::{Click, Press, Release},
    Key, Keyboard,
};
use std::{
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Mutex,
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
    crate::input_diagnostics::record(state, message);
    let _ = app.emit(
        "deeprant://input-status",
        serde_json::json!({"state": state, "message": message,
            "accessibility_required": state == "error" && accessibility_granted() == Some(false),
            "recovery_available": crate::inline_translation::recovery_available()}),
    );
    // 正在进行的事务被重复热键拒绝时，保留诊断但不抢焦点、不打断原事务。
    if state == "error" && !INPUT_BUSY.load(Ordering::Acquire) {
        log::warn!("输入事务失败：{message}");
        crate::show_main(app);
    }
}

pub(crate) fn accessibility_granted() -> Option<bool> {
    #[cfg(target_os = "macos")]
    {
        Some(platform::accessibility_granted())
    }
    #[cfg(not(target_os = "macos"))]
    {
        None
    }
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

pub(crate) struct InputTransaction {
    pub(crate) app: AppHandle,
    focus: FocusWatch,
    _busy: BusyGuard,
}
impl InputTransaction {
    pub(crate) fn new(app: AppHandle, busy: BusyGuard) -> Result<Self> {
        report_status(&app, "focus", "正在确认前台输入焦点与系统权限");
        let focus = FocusWatch::start()?;
        report_status(&app, "waiting_modifiers", "焦点已确认，等待物理修饰键释放");
        wait_for_modifiers(&focus)?;
        Ok(Self {
            app,
            focus,
            _busy: busy,
        })
    }

    pub(crate) fn copy_text(&self, select_current_line: bool) -> Result<String> {
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
        if select_current_line {
            report_status(
                &self.app,
                "copy_current_line",
                "正在从光标向前选到当前发言行首",
            );
            #[cfg(target_os = "macos")]
            modified_key(
                &self.app,
                &self.focus,
                vec![Key::Meta, Key::Shift],
                Key::LeftArrow,
                1,
            )?;
            #[cfg(not(target_os = "macos"))]
            modified_key(&self.app, &self.focus, vec![Key::Shift], Key::Home, 1)?;
        }
        shortcut(&self.app, &self.focus, 'c')?;
        report_status(
            &self.app,
            "copy_requested",
            "复制按键已发送，等待新的剪贴板文本",
        );
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
                        report_status(
                            &self.app,
                            "copy_observed",
                            "已收到新的复制文本，内容不记录到诊断",
                        );
                        return Ok(text);
                    }
                }
            }
            std::thread::sleep(POLL_INTERVAL);
        }
        bail!("当前输入框没有复制出文本。请先选中文本；游戏若禁用复制，请在首页切换游戏输入浮窗。Windows 还需检查双方权限级别是否一致，macOS 需授予辅助功能权限。")
    }

    pub(crate) fn paste(&self, text: &str) -> Result<()> {
        self.focus.check()?;
        wait_for_modifiers(&self.focus)?;
        let mut clipboard = ClipboardRestore::new(&self.app)?;
        clipboard.write(text)?;
        report_status(&self.app, "pasting", "正在替换已选中的输入文本");
        shortcut(&self.app, &self.focus, 'v')?;
        // 给目标程序处理粘贴的机会；剪贴板若被用户改写，恢复器会保留用户的新内容。
        std::thread::sleep(PASTE_SETTLE);
        Ok(())
    }

    /// 仅重新选中固定 BMP 占位；原文中的 emoji、组合字符或多行不参与长度计算。
    pub(crate) fn select_previous_chars(&self, count: usize) -> Result<()> {
        wait_for_modifiers(&self.focus)?;
        modified_key(
            &self.app,
            &self.focus,
            vec![Key::Shift],
            Key::LeftArrow,
            count,
        )
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
    crate::inline_translation::replace(app, !settings.daily_mode, &settings.ui_language).await
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

fn shortcut(app: &AppHandle, focus: &FocusWatch, letter: char) -> Result<()> {
    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control;
    modified_key(app, focus, vec![modifier], Key::Unicode(letter), 1)
}

fn modified_key(
    app: &AppHandle,
    focus: &FocusWatch,
    modifiers: Vec<Key>,
    key: Key,
    count: usize,
) -> Result<()> {
    focus.check()?;
    let snapshot = focus.snapshot.clone();
    let failure = focus.failure.clone();
    crate::native_keyboard::run(app, move |keyboard| {
        if failure
            .lock()
            .map_err(|_| anyhow!("焦点监视已中断"))?
            .is_some()
            || !snapshot.is_current()?
        {
            bail!("发送按键前焦点已改变，未继续输入");
        }
        let mut pressed = Vec::new();
        let action = (|| -> Result<()> {
            for modifier in modifiers {
                keyboard.key(modifier, Press)?;
                pressed.push(modifier);
            }
            for _ in 0..count {
                keyboard.key(key, Click)?;
            }
            Ok(())
        })();
        // 部分按键失败时仍释放全部已注入修饰键，不让 Shift / Command 卡住。
        let mut release_error = None;
        for modifier in pressed.into_iter().rev() {
            if let Err(error) = keyboard.key(modifier, Release) {
                release_error.get_or_insert(error);
            }
        }
        action.context("目标程序拒绝按键输入")?;
        if let Some(error) = release_error {
            return Err(error).context("释放注入的修饰键失败");
        }
        Ok(())
    })?;
    std::thread::sleep(Duration::from_millis(50));
    focus.check()
}

/// 浮窗只写 Unicode 文本，不修改剪贴板、不选择原文、不发送回车。
pub(crate) fn type_composed_text(
    app: &AppHandle,
    text: &str,
    check_focus: impl Fn() -> Result<()> + Send + Sync + 'static,
) -> Result<()> {
    let check_focus = Arc::new(check_focus);
    let deadline = Instant::now() + RELEASE_TIMEOUT;
    while platform::modifiers_down() {
        check_focus()?;
        if Instant::now() >= deadline {
            bail!("请松开修饰键后再次填入译文");
        }
        std::thread::sleep(POLL_INTERVAL);
    }
    check_focus()?;
    // CGEvent 的文本载荷以 UTF-16 计数；不拆代理对，短片段之间重新确认目标。
    for chunk in unicode_chunks(text) {
        check_focus().context("焦点已改变，可能已输入部分文字；请检查聊天框后再决定是否重试")?;
        let chunk = chunk.to_string();
        let check_focus = check_focus.clone();
        crate::native_keyboard::run(app, move |keyboard| {
            check_focus()?;
            keyboard
                .text(&chunk)
                .context("系统拒绝文本输入，可能已输入部分文字；请检查游戏聊天框再决定是否重试")
        })?;
    }
    Ok(())
}

fn unicode_chunks(text: &str) -> impl Iterator<Item = &str> {
    let mut chars = text.char_indices().peekable();
    std::iter::from_fn(move || {
        let (start, first) = chars.next()?;
        let mut units = first.len_utf16();
        while let Some((_, next)) = chars.peek() {
            if units + next.len_utf16() > 16 {
                break;
            }
            units += next.len_utf16();
            chars.next();
        }
        let end = chars.peek().map_or(text.len(), |(index, _)| *index);
        Some(&text[start..end])
    })
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
// 焦点监视：离开后返回也取消；AX 读取错误保持阶段码，不伪装成用户切换窗口
// ---------------------------------------------------------------------------

struct FocusWatch {
    snapshot: Arc<platform::Focus>,
    failure: Arc<Mutex<Option<String>>>,
    stop: Arc<AtomicBool>,
    worker: Option<std::thread::JoinHandle<()>>,
}

fn focus_failure(result: Result<bool>) -> Option<String> {
    match result {
        Ok(true) => None,
        Ok(false) => Some("焦点在操作期间发生变化，已取消自动粘贴；请回到原输入框重试".into()),
        Err(error) => Some(format!("无法继续核验输入焦点，已取消自动粘贴：{error:#}")),
    }
}

impl FocusWatch {
    fn start() -> Result<Self> {
        let snapshot = Arc::new(platform::Focus::capture()?);
        let failure = Arc::new(Mutex::new(None));
        let stop = Arc::new(AtomicBool::new(false));
        let (target, failed, finished) = (snapshot.clone(), failure.clone(), stop.clone());
        // ponytail: 40ms 原生焦点轮询；若需要捕获更短的窗口切换，改用平台焦点事件订阅。
        let worker = std::thread::Builder::new()
            .name("deeprant-focus".into())
            .spawn(move || {
                while !finished.load(Ordering::Acquire) {
                    if let Some(message) = focus_failure(target.is_current()) {
                        if let Ok(mut failure) = failed.lock() {
                            failure.get_or_insert(message);
                        }
                        break;
                    }
                    std::thread::sleep(POLL_INTERVAL);
                }
            })?;
        Ok(Self {
            snapshot,
            failure,
            stop,
            worker: Some(worker),
        })
    }
    fn check(&self) -> Result<()> {
        if let Some(message) = self
            .failure
            .lock()
            .map_err(|_| anyhow!("输入焦点监视被中断，已取消自动粘贴"))?
            .as_ref()
        {
            bail!("{message}");
        }
        if let Some(message) = focus_failure(self.snapshot.is_current()) {
            let mut failure = self
                .failure
                .lock()
                .map_err(|_| anyhow!("输入焦点监视被中断，已取消自动粘贴"))?;
            bail!("{}", failure.get_or_insert(message));
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
        pub fn is_current(&self) -> Result<bool> {
            Self::capture().map(|now| now == *self)
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
    fn attribute(element: Ref, name: &[u8], stage: &str) -> Result<Option<Owned>> {
        unsafe {
            let name = Owned(CFStringCreateWithCString(
                std::ptr::null(),
                name.as_ptr().cast(),
                0x08000100,
            ) as usize);
            if name.0 == 0 {
                bail!("macOS 辅助功能读取{stage}失败：无法创建属性名");
            }
            let mut value = std::ptr::null();
            let code = AXUIElementCopyAttributeValue(element, name.0 as Ref, &mut value);
            if code == 0 && !value.is_null() {
                return Ok(Some(Owned(value as usize)));
            }
            // 不支持属性/没有值才允许用窗口作目标；权限、超时与其他错误保留阶段码。
            if matches!(code, -25205 | -25212) {
                return Ok(None);
            }
            bail!(
                "macOS 辅助功能读取{stage}失败（AXError {code}）；请检查此版本的辅助功能授权并重试"
            );
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
                if !accessibility_granted() {
                    bail!("此版本 DeepRant 尚未获得辅助功能授权；请在 macOS 系统设置 → 隐私与安全性 → 辅助功能中重新添加或启用 /Applications/DeepRant.app，然后重试");
                }
                let system = Owned(AXUIElementCreateSystemWide() as usize);
                if system.0 == 0 {
                    bail!("无法读取 macOS 输入焦点");
                }
                let code = AXUIElementSetMessagingTimeout(system.0 as Ref, 0.25);
                if code != 0 {
                    bail!("macOS 辅助功能设置焦点查询超时失败（AXError {code}）");
                }
                let application =
                    attribute(system.0 as Ref, b"AXFocusedApplication\0", "前台应用")?.ok_or_else(
                        || anyhow!("macOS 辅助功能没有返回前台应用（AXFocusedApplication）"),
                    )?;
                let target = match attribute(application.0 as Ref, b"AXFocusedUIElement\0", "输入控件")? {
                    Some(target) => target,
                    None => attribute(application.0 as Ref, b"AXFocusedWindow\0", "前台窗口")?
                        .ok_or_else(|| anyhow!("当前程序未提供可确认的输入控件或窗口（AXFocusedUIElement / AXFocusedWindow）"))?,
                };
                let mut pid = 0;
                let code = AXUIElementGetPid(application.0 as Ref, &mut pid);
                if code != 0 {
                    bail!("macOS 辅助功能读取前台进程身份失败（AXError {code}）");
                }
                Ok(Self {
                    application,
                    target,
                    pid,
                })
            }
        }
        pub fn is_current(&self) -> Result<bool> {
            Self::capture().map(|now| unsafe {
                self.pid == now.pid
                    && CFEqual(self.application.0 as Ref, now.application.0 as Ref) != 0
                    && CFEqual(self.target.0 as Ref, now.target.0 as Ref) != 0
            })
        }
    }
    pub fn accessibility_granted() -> bool {
        // SAFETY: 只查询本进程当前授权，不显示授权提示，不读取任何文档属性。
        unsafe { AXIsProcessTrusted() != 0 }
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
        pub fn is_current(&self) -> Result<bool> {
            Ok(false)
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
    fn focus_failures_keep_ax_errors_distinct_from_real_focus_changes() {
        assert!(focus_failure(Ok(true)).is_none());
        assert!(focus_failure(Ok(false)).unwrap().contains("发生变化"));
        let failure = focus_failure(Err(anyhow!("读取输入控件失败（AXError -25204）"))).unwrap();
        assert!(failure.contains("AXError -25204"));
        assert!(!failure.contains("发生变化"));
    }
    #[test]
    fn unicode_input_preserves_surrogate_pairs_and_bounded_event_payloads() {
        let text = "🙂😀😅😉😊😂😍😎🤓🥳你好 team — go mid";
        let chunks: Vec<_> = unicode_chunks(text).collect();
        assert_eq!(chunks.concat(), text);
        assert!(chunks
            .iter()
            .all(|chunk| chunk.encode_utf16().count() <= 16));
        assert!(unicode_chunks("").next().is_none());
    }
    #[test]
    fn input_transactions_reject_reentry_and_release_after_drop() {
        let first = BusyGuard::acquire().unwrap();
        assert!(BusyGuard::acquire().is_err());
        drop(first);
        assert!(BusyGuard::acquire().is_ok());
    }
}
