/**
 * [INPUT]: 依赖 keyring 的平台原生凭据库；账户由已归一的模型端点与协议确定
 * [OUTPUT]: 提供 API Key 的读取、写入与明确删除；缺失凭据返回 None
 * [POS]: 明文凭据的唯一持久化边界；store 负责迁移，模型管道和主窗口 Key 编辑控件按端点读取，不进入公开设置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use anyhow::{anyhow, Result};
use keyring::{Entry, Error};
use std::sync::Mutex;

const SERVICE: &str = "com.deeprant.api-key";
static CREDENTIAL_LOCK: Mutex<()> = Mutex::new(());

fn entry(endpoint: &str, protocol: &str) -> Result<Entry> {
    Entry::new(SERVICE, &format!("{protocol}:{endpoint}"))
        .map_err(|_| anyhow!("无法初始化系统凭据库，请解锁系统钥匙串后重试"))
}

pub fn read(endpoint: &str, protocol: &str) -> Result<Option<String>> {
    let _guard = CREDENTIAL_LOCK
        .lock()
        .map_err(|_| anyhow!("凭据操作被中断，请重启应用"))?;
    match entry(endpoint, protocol)?.get_password() {
        Ok(secret) => Ok(Some(secret)),
        Err(Error::NoEntry) => Ok(None),
        Err(_) => Err(anyhow!("无法读取系统凭据库，请解锁系统钥匙串后重试")),
    }
}

pub fn write(endpoint: &str, protocol: &str, secret: &str) -> Result<()> {
    let _guard = CREDENTIAL_LOCK
        .lock()
        .map_err(|_| anyhow!("凭据操作被中断，请重启应用"))?;
    entry(endpoint, protocol)?
        .set_password(secret)
        .map_err(|_| anyhow!("无法保存 API Key，请解锁系统钥匙串后重试"))
}

pub fn remove(endpoint: &str, protocol: &str) -> Result<()> {
    let _guard = CREDENTIAL_LOCK
        .lock()
        .map_err(|_| anyhow!("凭据操作被中断，请重启应用"))?;
    match entry(endpoint, protocol)?.delete_credential() {
        Ok(()) | Err(Error::NoEntry) => Ok(()),
        Err(_) => Err(anyhow!("无法删除 API Key，请解锁系统钥匙串后重试")),
    }
}
