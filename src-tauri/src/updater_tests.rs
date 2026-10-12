// [INPUT]: 官方 updater 的公开测试向量，以及发布脚本提供的实际清单与签名归档。
// [OUTPUT]: 验证有效签名可用，篡改字节和冒用版本被拒绝；不安装、不联网、不接触用户应用。
// [POS]: 更新信任边界回归；发布后以同一官方校验器核验真正上传的字节，而非重复实现密码学。
// [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
use serde_json::{json, Value};
use std::{
    io::{Read, Write},
    net::TcpListener,
    time::Duration,
};
use tauri_plugin_updater::UpdaterExt;
fn verify(mut manifest: Value, key: &str, bytes: &[u8]) -> Result<(), String> {
    // ----- 仅测试允许本机 HTTP；生产仍使用配置中的公开 HTTPS -----
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    let target = manifest["platforms"]
        .as_object()
        .unwrap()
        .keys()
        .next()
        .unwrap()
        .clone();
    manifest["platforms"][&target]["url"] = json!(format!("http://{address}/archive"));
    let responses = [serde_json::to_vec(&manifest).unwrap(), bytes.to_vec()];
    let server = std::thread::spawn(move || {
        for body in responses {
            let (mut stream, _) = listener.accept().unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(30)))
                .unwrap();
            let mut request = [0; 4096];
            assert!(stream.read(&mut request).unwrap() > 0);
            write!(
                stream,
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                body.len()
            )
            .unwrap();
            stream.write_all(&body).unwrap();
        }
    });
    let mut context = tauri::test::mock_context(tauri::test::noop_assets());
    context.config_mut().plugins.0.insert(
        "updater".into(),
        json!({"pubkey":key,"requireSignedVersion":true,"dangerousInsecureTransportProtocol":true}),
    );
    let app = tauri::test::mock_builder()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .build(context)
        .unwrap();
    let updater = app
        .updater_builder()
        .target(&target)
        .executable_path("/tmp/deeprant-test.app/Contents/MacOS/app")
        .version_comparator(|_, _| true)
        .timeout(Duration::from_secs(30))
        .no_proxy()
        .endpoints(vec![format!("http://{address}/latest.json")
            .parse()
            .unwrap()])
        .unwrap()
        .build()
        .unwrap();
    let result = tauri::async_runtime::block_on(async {
        let update = updater
            .check()
            .await
            .map_err(|e| e.to_string())?
            .ok_or("No update")?;
        update
            .download(|_, _| {}, || {})
            .await
            .map(|_| ())
            .map_err(|e| e.to_string())
    });
    server.join().unwrap();
    result
}
#[test]
fn official_signature_rejects_tampered_bytes_and_announced_version() {
    // ----- Tauri plugins-workspace 公开向量：只有公钥和签名，没有私钥 -----
    let key = "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEE0OUVGNDc0NkZBNkU2RDcKUldUWDVxWnZkUFNlcERHV2cyYno4bjZBclFuQk13Z1FLMWdlVm9zb3JjYkx6Y3VuRCtLSitjWWU=";
    let signature = "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVUWDVxWnZkUFNlcFBGMnpzanZQL0wvVFF0QkxSbldSdmFxKzRvbUsxVUV1Z3RRcC9VU3JHaUkxdjc2MnNEeTNpZDNhb3I3YlJDOUVUeWVvdDZsTUhIcldvWjVoalVNMVFjPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzkxNjQ5MDUxCWZpbGU6cGF5bG9hZAl2ZXJzaW9uOjIuMC4wCkREcTJDTE9FbDVjUW1DMmVKUkhsblpQVlZpT1pzdTFDanBQS1FvZWk0QS9YQmZrRHFHTzBCK1FNcmNySGdFUTVxVjNtbmU3NXRkRldoSnBxVVhoOUFBPT0=";
    let manifest = json!({"version":"2.0.0","platforms":{"darwin-aarch64":{"url":"https://example.invalid/app.tar.gz","signature":signature}}});
    verify(manifest.clone(), key, b"test").unwrap();
    assert!(verify(manifest.clone(), key, b"tampered").is_err());
    let mut forged = manifest;
    forged["version"] = json!("9.9.9");
    assert!(verify(forged, key, b"test").is_err());
}
#[test]
#[ignore = "发布脚本提供真实签名包后显式执行"]
fn published_archive_matches_embedded_key_and_signed_version() {
    let path = std::env::var("DR_UPDATE_MANIFEST").expect("DR_UPDATE_MANIFEST");
    let manifest: Value = serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
    let bytes =
        std::fs::read(std::env::var("DR_UPDATE_ARCHIVE").expect("DR_UPDATE_ARCHIVE")).unwrap();
    let config: Value = serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
    let key = config["plugins"]["updater"]["pubkey"].as_str().unwrap();
    verify(manifest.clone(), key, &bytes).unwrap();
    let mut forged = manifest.clone();
    forged["version"] = json!("9999.0.0");
    assert!(verify(forged, key, &bytes).is_err());
    let mut tampered = bytes;
    tampered[0] ^= 1;
    assert!(verify(manifest, key, &tampered).is_err());
}
