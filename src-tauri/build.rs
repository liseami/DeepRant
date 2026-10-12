// [INPUT]: Tauri 配置与 capabilities。
// [OUTPUT]: 生成原生构建上下文。
// [POS]: Rust 构建脚本，业务逻辑不得进入此处。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
fn main() {
    tauri_build::build()
}
