/**
 * [INPUT]: 依赖 macOS NSWorkspace/AX/CGWindow 或 Windows 前台窗口与进程生命周期 API
 * [OUTPUT]: 提供 ComposerTarget 的捕获、身份校验、恢复及真实焦点确认
 * [POS]: 游戏浮窗的原生目标边界；无游戏进程名单、键盘监听或游戏 hook，缺少 AX 控件时仍可确认原应用实例
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use anyhow::{bail, Result};
use std::time::{Duration, Instant};

pub(crate) use platform::ComposerTarget;

pub(crate) fn restore(target: &ComposerTarget) -> Result<()> {
    target.activate()?;
    let deadline = Instant::now() + Duration::from_secs(2);
    while Instant::now() < deadline {
        if target.is_current() {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(40));
    }
    bail!("系统未将焦点交还原游戏窗口，译文仍保留在浮窗；请确认原聊天框后重试")
}

#[cfg(target_os = "windows")]
mod platform {
    use super::*;
    use anyhow::anyhow;
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
        fn IsWindow(window: isize) -> i32;
        fn SetForegroundWindow(window: isize) -> i32;
    }
    #[link(name = "kernel32")]
    extern "system" {
        fn OpenProcess(access: u32, inherit: i32, pid: u32) -> isize;
        fn GetProcessTimes(
            process: isize,
            created: *mut u64,
            exited: *mut u64,
            kernel: *mut u64,
            user: *mut u64,
        ) -> i32;
        fn CloseHandle(handle: isize) -> i32;
    }
    fn process_created(pid: u32) -> Option<u64> {
        // SAFETY: 只查询生命周期，无目标进程读写；每个成功打开的句柄都关闭。
        unsafe {
            let process = OpenProcess(0x1000, 0, pid);
            if process == 0 {
                return None;
            }
            let (mut created, mut exited, mut kernel, mut user) = (0, 0, 0, 0);
            let valid =
                GetProcessTimes(process, &mut created, &mut exited, &mut kernel, &mut user) != 0;
            CloseHandle(process);
            valid.then_some(created)
        }
    }
    fn focused_control(thread: u32) -> Option<isize> {
        unsafe {
            let mut info: GuiThreadInfo = std::mem::zeroed();
            info.size = std::mem::size_of::<GuiThreadInfo>() as u32;
            (GetGUIThreadInfo(thread, &mut info) != 0 && info.focus != 0).then_some(info.focus)
        }
    }
    pub(crate) struct ComposerTarget {
        window: isize,
        pid: u32,
        created: u64,
        control: Option<isize>,
    }
    impl ComposerTarget {
        pub(crate) fn capture() -> Result<Self> {
            unsafe {
                let window = GetForegroundWindow();
                let mut pid = 0;
                let thread = GetWindowThreadProcessId(window, &mut pid);
                if window == 0 || thread == 0 || pid == std::process::id() {
                    bail!("请先回到游戏、打开空聊天框，再触发翻译快捷键");
                }
                Ok(Self {
                    window,
                    pid,
                    created: process_created(pid)
                        .ok_or_else(|| anyhow!("无法确认游戏进程身份，请检查双方权限级别"))?,
                    control: focused_control(thread),
                })
            }
        }
        fn alive(&self) -> bool {
            unsafe {
                let mut pid = 0;
                IsWindow(self.window) != 0
                    && GetWindowThreadProcessId(self.window, &mut pid) != 0
                    && pid == self.pid
                    && process_created(pid) == Some(self.created)
            }
        }
        pub(crate) fn activate(&self) -> Result<()> {
            if !self.alive() {
                bail!("原游戏窗口已关闭或更换，译文仍保留；请取消后从当前游戏重新打开浮窗");
            }
            unsafe {
                SetForegroundWindow(self.window);
            }
            Ok(())
        }
        pub(crate) fn is_current(&self) -> bool {
            unsafe {
                let mut pid = 0;
                let thread = GetWindowThreadProcessId(self.window, &mut pid);
                self.alive()
                    && GetForegroundWindow() == self.window
                    && self
                        .control
                        .is_none_or(|control| focused_control(thread) == Some(control))
            }
        }
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use super::*;
    use anyhow::anyhow;
    use std::ffi::{c_char, c_void};
    type Ref = *const c_void;
    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXIsProcessTrusted() -> u8;
        fn AXUIElementCreateApplication(pid: i32) -> Ref;
        fn AXUIElementCopyAttributeValue(element: Ref, attribute: Ref, value: *mut Ref) -> i32;
        fn AXUIElementSetMessagingTimeout(element: Ref, timeout: f32) -> i32;
        fn CGWindowListCopyWindowInfo(options: u32, relative: u32) -> Ref;
    }
    #[link(name = "CoreFoundation", kind = "framework")]
    extern "C" {
        fn CFStringCreateWithCString(allocator: Ref, value: *const c_char, encoding: u32) -> Ref;
        fn CFRelease(value: Ref);
        fn CFEqual(left: Ref, right: Ref) -> u8;
        fn CFArrayGetCount(array: Ref) -> isize;
        fn CFArrayGetValueAtIndex(array: Ref, index: isize) -> Ref;
        fn CFDictionaryGetValue(dictionary: Ref, key: Ref) -> Ref;
        fn CFNumberGetValue(number: Ref, kind: i32, value: *mut i64) -> u8;
    }
    #[link(name = "objc")]
    extern "C" {
        fn objc_getClass(name: *const c_char) -> Ref;
        fn sel_registerName(name: *const c_char) -> Ref;
        fn objc_msgSend();
        fn objc_autoreleasePoolPush() -> *mut c_void;
        fn objc_autoreleasePoolPop(pool: *mut c_void);
    }
    struct AutoreleasePool(*mut c_void);
    impl AutoreleasePool {
        fn new() -> Self {
            Self(unsafe { objc_autoreleasePoolPush() })
        }
    }
    impl Drop for AutoreleasePool {
        fn drop(&mut self) {
            unsafe {
                objc_autoreleasePoolPop(self.0);
            }
        }
    }
    struct OwnedCf(usize);
    impl Drop for OwnedCf {
        fn drop(&mut self) {
            if self.0 != 0 {
                unsafe {
                    CFRelease(self.0 as Ref);
                }
            }
        }
    }
    struct Application(usize);
    impl Drop for Application {
        fn drop(&mut self) {
            unsafe {
                object(self.0 as Ref, c"release".as_ptr());
            }
        }
    }
    unsafe fn object(receiver: Ref, selector: *const c_char) -> Ref {
        let send: unsafe extern "C" fn(Ref, Ref) -> Ref =
            std::mem::transmute(objc_msgSend as *const ());
        send(receiver, sel_registerName(selector))
    }
    unsafe fn number(receiver: Ref, selector: *const c_char) -> i32 {
        let send: unsafe extern "C" fn(Ref, Ref) -> i32 =
            std::mem::transmute(objc_msgSend as *const ());
        send(receiver, sel_registerName(selector))
    }
    unsafe fn boolean(receiver: Ref, selector: *const c_char) -> bool {
        let send: unsafe extern "C" fn(Ref, Ref) -> i8 =
            std::mem::transmute(objc_msgSend as *const ());
        send(receiver, sel_registerName(selector)) != 0
    }
    fn frontmost() -> Ref {
        unsafe {
            let workspace = object(
                objc_getClass(c"NSWorkspace".as_ptr()),
                c"sharedWorkspace".as_ptr(),
            );
            object(workspace, c"frontmostApplication".as_ptr())
        }
    }
    fn string(name: &[u8]) -> OwnedCf {
        OwnedCf(unsafe {
            CFStringCreateWithCString(std::ptr::null(), name.as_ptr().cast(), 0x08000100)
        } as usize)
    }
    fn attribute(element: Ref, name: &[u8]) -> Option<OwnedCf> {
        let name = string(name);
        if name.0 == 0 {
            return None;
        }
        let mut value = std::ptr::null();
        unsafe {
            (AXUIElementCopyAttributeValue(element, name.0 as Ref, &mut value) == 0
                && !value.is_null())
            .then_some(OwnedCf(value as usize))
        }
    }
    fn dictionary_number(dictionary: Ref, name: &[u8]) -> Option<i64> {
        let name = string(name);
        if name.0 == 0 {
            return None;
        }
        unsafe {
            let value = CFDictionaryGetValue(dictionary, name.0 as Ref);
            let mut result = 0;
            (!value.is_null() && CFNumberGetValue(value, 4, &mut result) != 0).then_some(result)
        }
    }
    fn window_identity(pid: i32, only: Option<u32>) -> Option<u32> {
        // CGWindow 的窗口编号不依赖 AX 控件；无屏幕内容读取或录屏权限请求。
        let windows = OwnedCf(unsafe {
            CGWindowListCopyWindowInfo(if only.is_some() { 8 } else { 1 | 16 }, only.unwrap_or(0))
        } as usize);
        if windows.0 == 0 {
            return None;
        }
        unsafe {
            for index in 0..CFArrayGetCount(windows.0 as Ref) {
                let entry = CFArrayGetValueAtIndex(windows.0 as Ref, index);
                if dictionary_number(entry, b"kCGWindowOwnerPID\0") != Some(pid as i64)
                    || dictionary_number(entry, b"kCGWindowLayer\0") != Some(0)
                {
                    continue;
                }
                let id = dictionary_number(entry, b"kCGWindowNumber\0")? as u32;
                if only.is_none_or(|expected| expected == id) {
                    return Some(id);
                }
            }
        }
        None
    }
    pub(crate) struct ComposerTarget {
        application: Application,
        pid: i32,
        ax_application: OwnedCf,
        ax_target: Option<OwnedCf>,
        ax_window: Option<OwnedCf>,
        window: Option<u32>,
    }
    impl ComposerTarget {
        pub(crate) fn capture() -> Result<Self> {
            let _pool = AutoreleasePool::new();
            // SAFETY: 保留 NSRunningApplication 实例而非仅 PID；游戏退出后原实例不会变成重用 PID 的进程。
            unsafe {
                if AXIsProcessTrusted() == 0 {
                    bail!("请先在 macOS 系统设置 → 隐私与安全性 → 辅助功能中启用 DeepRant，并重启应用");
                }
                let running = frontmost();
                if running.is_null() {
                    bail!("无法确认前台游戏，请回到游戏聊天框后重试");
                }
                let pid = number(running, c"processIdentifier".as_ptr());
                if pid <= 0 || pid as u32 == std::process::id() {
                    bail!("请先回到游戏、打开空聊天框，再触发翻译快捷键");
                }
                let application = Application(object(running, c"retain".as_ptr()) as usize);
                let ax_application = OwnedCf(AXUIElementCreateApplication(pid) as usize);
                if ax_application.0 == 0 {
                    return Err(anyhow!("无法确认原游戏应用身份"));
                }
                AXUIElementSetMessagingTimeout(ax_application.0 as Ref, 0.2);
                let ax_target = attribute(ax_application.0 as Ref, b"AXFocusedUIElement\0");
                let ax_window = attribute(ax_application.0 as Ref, b"AXFocusedWindow\0");
                Ok(Self {
                    application,
                    pid,
                    ax_application,
                    ax_target,
                    ax_window,
                    window: window_identity(pid, None),
                })
            }
        }
        fn alive(&self) -> bool {
            unsafe {
                !boolean(self.application.0 as Ref, c"isTerminated".as_ptr())
                    && number(self.application.0 as Ref, c"processIdentifier".as_ptr()) == self.pid
                    && self
                        .window
                        .is_none_or(|id| window_identity(self.pid, Some(id)) == Some(id))
            }
        }
        pub(crate) fn activate(&self) -> Result<()> {
            let _pool = AutoreleasePool::new();
            if !self.alive() {
                bail!("原游戏窗口已关闭或更换，译文仍保留；请取消后从当前游戏重新打开浮窗");
            }
            unsafe {
                let send: unsafe extern "C" fn(Ref, Ref, usize) -> i8 =
                    std::mem::transmute(objc_msgSend as *const ());
                send(
                    self.application.0 as Ref,
                    sel_registerName(c"activateWithOptions:".as_ptr()),
                    2,
                );
            }
            Ok(())
        }
        pub(crate) fn is_current(&self) -> bool {
            let _pool = AutoreleasePool::new();
            let current = frontmost();
            if current.is_null()
                || !self.alive()
                || unsafe { number(current, c"processIdentifier".as_ptr()) } != self.pid
            {
                return false;
            }
            if self
                .window
                .is_some_and(|id| window_identity(self.pid, None) != Some(id))
            {
                return false;
            }
            for (stored, name) in [
                (&self.ax_target, b"AXFocusedUIElement\0".as_slice()),
                (&self.ax_window, b"AXFocusedWindow\0".as_slice()),
            ] {
                if let Some(stored) = stored {
                    let Some(now) = attribute(self.ax_application.0 as Ref, name) else {
                        return false;
                    };
                    if unsafe { CFEqual(stored.0 as Ref, now.0 as Ref) } == 0 {
                        return false;
                    }
                }
            }
            true
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod platform {
    use super::*;
    pub(crate) struct ComposerTarget;
    impl ComposerTarget {
        pub(crate) fn capture() -> Result<Self> {
            bail!("游戏输入浮窗目前支持 macOS 和 Windows");
        }
        pub(crate) fn activate(&self) -> Result<()> {
            bail!("此平台无法安全恢复游戏焦点");
        }
        pub(crate) fn is_current(&self) -> bool {
            false
        }
    }
}
