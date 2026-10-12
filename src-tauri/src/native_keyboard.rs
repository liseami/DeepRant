#[cfg(target_os = "macos")]
use anyhow::Context;
/**
 * [INPUT]: 依赖 Tauri 主线程派发、Enigo 与平台线程检查，不接触模型或剪贴板。
 * [OUTPUT]: 提供 run，完成短暂的键盘创建 / 注入 / 释放；macOS 在主线程执行布局查询。
 * [POS]: 原生键盘唯一执行边界；网络、等待和复制留在 worker，避免 Carbon 主线程断言终止整个进程。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use anyhow::{anyhow, Result};
use enigo::{Enigo, Settings};
use tauri::AppHandle;

#[cfg(target_os = "macos")]
fn require_main_thread() -> Result<()> {
    extern "C" {
        fn pthread_main_np() -> i32;
    }
    // SAFETY: 系统只读线程查询，无对象指针或线程状态修改。
    if unsafe { pthread_main_np() } != 1 {
        return Err(anyhow!("macOS 键盘任务未到主线程，已拒绝执行"));
    }
    Ok(())
}

fn execute(operation: impl FnOnce(&mut Enigo) -> Result<()>) -> Result<()> {
    #[cfg(target_os = "macos")]
    require_main_thread()?;
    let mut keyboard = Enigo::new(&Settings {
        open_prompt_to_get_permissions: false,
        ..Settings::default()
    })
    .map_err(|_| anyhow!("无法创建键盘输入，请检查辅助功能或目标权限级别"))?;
    operation(&mut keyboard)
}

pub(crate) fn run(
    app: &AppHandle,
    operation: impl FnOnce(&mut Enigo) -> Result<()> + Send + 'static,
) -> Result<()> {
    #[cfg(target_os = "macos")]
    {
        let (send, receive) = std::sync::mpsc::sync_channel(1);
        app.run_on_main_thread(move || {
            let _ = send.send(execute(operation));
        })
        .context("无法调度系统键盘任务，未发送按键")?;
        // 不设超时：排队中的输入不能在 worker 超时退出后继续执行。
        receive.recv().context("主线程键盘任务被中断")?
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        execute(operation)
    }
}

#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::*;
    #[test]
    fn worker_rejects_keyboard_before_entering_carbon() {
        std::thread::spawn(|| {
            assert!(execute(|_| panic!("worker must never enter the keyboard operation")).is_err());
        })
        .join()
        .unwrap();
    }
}
