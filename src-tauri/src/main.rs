// [INPUT]: deep_rant_lib 桌面运行入口。
// [OUTPUT]: 启动原生进程。
// [POS]: 仅承接平台二进制，不维护业务状态。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    deep_rant_lib::run()
}
