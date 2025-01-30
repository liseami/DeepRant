// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // 在 Rust 中,双冒号 :: 用于:
    // 1. 命名空间分隔符,类似其他语言的点号,用来访问模块/crate中的内容
    // 2. 关联函数(类似静态方法)的调用
    // 这里 golingo_lib::run() 表示调用 golingo_lib crate/模块中的 run 函数
    deep_rant_lib::run()
}
