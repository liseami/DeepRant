// [INPUT]: Tauri 配置、capabilities 与 Windows Common Controls v6 manifest。
// [OUTPUT]: 原生构建上下文；MSVC 的程序和库单测 EXE 共用显式嵌入的 manifest。
// [POS]: 构建边界，防止 Windows 单测加载旧 comctl32；链接参数覆盖全部 artifact。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
fn main() {
    let mut attributes = tauri_build::Attributes::new();
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows")
        && std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc")
    {
        let manifest = std::path::PathBuf::from(std::env::var_os("CARGO_MANIFEST_DIR").unwrap())
            .join("windows-app-manifest.xml");
        println!("cargo:rerun-if-changed={}", manifest.display());
        attributes = attributes
            .windows_attributes(tauri_build::WindowsAttributes::new_without_app_manifest());
        println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
        println!("cargo:rustc-link-arg=/MANIFESTINPUT:{}", manifest.display());
    }
    tauri_build::try_build(attributes).expect("Tauri native build context failed");
}
