/**
 * [INPUT]: 依赖 rusqlite 的事务、serde_json 的设置文档与 tempfile 的旧文件原子替换
 * [OUTPUT]: 提供设置快照、事务提交与旧 JSON 清理；数据库不存在记录时才读取迁移来源
 * [POS]: store 的磁盘边界；单行文档保留未知根字段，提交后才清理旧明文，错误不覆盖可恢复数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
use anyhow::{anyhow, bail, Result};
use rusqlite::{Connection, OptionalExtension};
use serde_json::{json, Value};
use std::fs;
use std::io::{ErrorKind, Write};
use std::path::Path;
use std::time::Duration;
use tempfile::NamedTempFile;

const DATABASE_FILENAME: &str = "settings.sqlite3";
const LEGACY_FILENAME: &str = "store.json";

pub struct Snapshot {
    pub root: Value,
    pub from_legacy: bool,
    pub legacy_cleanup_pending: bool,
}

fn connect(directory: &Path) -> Result<Connection> {
    fs::create_dir_all(directory)
        .map_err(|_| anyhow!("无法创建设置目录，请检查系统用户目录权限"))?;
    let connection = Connection::open(directory.join(DATABASE_FILENAME))
        .map_err(|_| anyhow!("无法打开设置数据库，原数据已保留；请检查磁盘空间与目录权限"))?;
    connection
        .busy_timeout(Duration::from_secs(5))
        .and_then(|_| {
            connection.execute_batch(
                "PRAGMA synchronous = FULL;
                 CREATE TABLE IF NOT EXISTS settings_document (
                     id INTEGER PRIMARY KEY CHECK (id = 1),
                     document TEXT NOT NULL,
                     legacy_cleanup_pending INTEGER NOT NULL CHECK (legacy_cleanup_pending IN (0, 1))
                 );",
            )
        })
        .map_err(|_| anyhow!("设置数据库无法初始化，原数据已保留；请检查磁盘空间与目录权限"))?;
    Ok(connection)
}

fn read_document(connection: &Connection) -> Result<Option<(Value, bool)>> {
    let stored: Option<(String, bool)> = connection
        .query_row(
            "SELECT document, legacy_cleanup_pending FROM settings_document WHERE id = 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|_| anyhow!("无法读取设置数据库，原数据已保留；请备份 settings.sqlite3 后修复"))?;
    stored
        .map(|(document, pending)| {
            let root: Value = serde_json::from_str(&document).map_err(|_| {
                anyhow!("设置数据库文档无效，原数据已保留；请备份 settings.sqlite3 后修复")
            })?;
            validate_document(&root)?;
            Ok((root, pending))
        })
        .transpose()
}

fn validate_document(root: &Value) -> Result<()> {
    if !root.is_object() || !root.get("settings").is_some_and(Value::is_object) {
        bail!("设置文档必须包含 settings 对象，原数据已保留");
    }
    reject_plaintext_key(root)
}

fn reject_plaintext_key(root: &Value) -> Result<()> {
    if root.pointer("/settings/custom_model/auth").is_some()
        || root.pointer("/custom_model/auth").is_some()
    {
        bail!("设置数据库不能保存明文 API Key，请先完成系统凭据库迁移");
    }
    Ok(())
}

pub fn read(directory: &Path) -> Result<Snapshot> {
    let connection = connect(directory)?;
    if let Some((root, legacy_cleanup_pending)) = read_document(&connection)? {
        return Ok(Snapshot {
            root,
            from_legacy: false,
            legacy_cleanup_pending,
        });
    }
    let legacy = read_legacy(directory)?;
    Ok(Snapshot {
        legacy_cleanup_pending: legacy.is_some(),
        root: legacy.unwrap_or_else(|| json!({})),
        from_legacy: true,
    })
}

fn write_document(connection: &mut Connection, root: &Value, pending: bool) -> Result<()> {
    validate_document(root)?;
    let document =
        serde_json::to_string(root).map_err(|_| anyhow!("无法编码设置，原数据已保留"))?;
    let transaction = connection
        .transaction()
        .map_err(|_| anyhow!("无法开始设置事务，原数据已保留"))?;
    transaction
        .execute(
            "INSERT INTO settings_document (id, document, legacy_cleanup_pending) VALUES (1, ?1, ?2)
             ON CONFLICT(id) DO UPDATE SET document = excluded.document,
                 legacy_cleanup_pending = excluded.legacy_cleanup_pending",
            (&document, pending),
        )
        .and_then(|_| transaction.commit())
        .map_err(|_| anyhow!("设置保存失败，原数据已保留；请检查磁盘空间与目录权限"))?;
    Ok(())
}

pub fn write(directory: &Path, root: &Value, pending: bool) -> Result<()> {
    write_document(&mut connect(directory)?, root, pending)
}

pub fn read_legacy(directory: &Path) -> Result<Option<Value>> {
    let bytes = match fs::read(directory.join(LEGACY_FILENAME)) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(_) => bail!("无法读取旧设置文件，原文件已保留；请检查应用数据目录权限"),
    };
    let root: Value = serde_json::from_slice(&bytes)
        .map_err(|_| anyhow!("旧设置 JSON 无效，原文件已保留；请备份 store.json 后修复"))?;
    if !root.is_object() {
        bail!("旧设置根节点必须是对象，原文件已保留；请备份 store.json 后修复");
    }
    Ok(Some(root))
}

pub fn finish_legacy_cleanup(directory: &Path, legacy: Option<(&Value, &Value)>) -> Result<()> {
    let mut connection = connect(directory)?;
    let Some((_, pending)) = read_document(&connection)? else {
        bail!("设置尚未提交到 SQLite，旧文件明文已保留，请重试迁移");
    };
    if !pending {
        return Ok(());
    }
    // 数据库已经提交，清理失败仍保留待办标记；重启后仅重试清理，绝不重新导入。
    if let Some((original, sanitized)) = legacy {
        reject_plaintext_key(sanitized)?;
        if read_legacy(directory)?.as_ref() != Some(original) {
            bail!("旧设置在迁移期间发生变化，文件已保留；请重试以完成明文清理");
        }
        if original != sanitized {
            let bytes = serde_json::to_vec(sanitized)
                .map_err(|_| anyhow!("无法编码旧设置，原文件已保留"))?;
            let persist = || -> std::io::Result<()> {
                let mut temporary = NamedTempFile::new_in(directory)?;
                temporary.write_all(&bytes)?;
                temporary.as_file().sync_all()?;
                temporary
                    .persist(directory.join(LEGACY_FILENAME))
                    .map_err(|error| error.error)?;
                Ok(())
            };
            persist().map_err(|_| {
                anyhow!("设置已保存到 SQLite，旧文件明文清理失败；请检查目录权限后重试")
            })?;
        }
    }
    let transaction = connection
        .transaction()
        .map_err(|_| anyhow!("无法完成设置迁移，数据库设置已保留，请重试"))?;
    transaction
        .execute(
            "UPDATE settings_document SET legacy_cleanup_pending = 0 WHERE id = 1",
            [],
        )
        .and_then(|_| transaction.commit())
        .map_err(|_| anyhow!("无法完成设置迁移，数据库设置已保留，请重试"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migration_commits_before_scrubbing_and_database_remains_authoritative() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path();
        let legacy = json!({"settings": {"custom_model": {"auth": "migration-test"}},
            "other": {"retained": true}});
        fs::write(
            path.join(LEGACY_FILENAME),
            serde_json::to_vec(&legacy).unwrap(),
        )
        .unwrap();
        let snapshot = read(path).unwrap();
        assert!(snapshot.from_legacy && snapshot.legacy_cleanup_pending);
        assert_eq!(snapshot.root, legacy);
        assert!(write(path, &legacy, true).is_err());
        let sanitized = json!({"settings": {"custom_model": {}}, "other": {"retained": true}});
        assert!(finish_legacy_cleanup(path, Some((&legacy, &sanitized))).is_err());
        assert_eq!(read_legacy(path).unwrap(), Some(legacy.clone()));
        write(path, &sanitized, true).unwrap();
        assert_eq!(read_legacy(path).unwrap(), Some(legacy.clone()));
        let snapshot = read(path).unwrap();
        assert!(!snapshot.from_legacy && snapshot.legacy_cleanup_pending);
        assert_eq!(snapshot.root, sanitized);
        finish_legacy_cleanup(path, Some((&legacy, &sanitized))).unwrap();
        assert_eq!(read_legacy(path).unwrap(), Some(sanitized.clone()));
        fs::write(path.join(LEGACY_FILENAME), b"{old-file-is-invalid").unwrap();
        let snapshot = read(path).unwrap();
        assert_eq!(snapshot.root, sanitized);
        assert!(!snapshot.legacy_cleanup_pending);
    }

    #[test]
    fn failed_updates_and_changed_legacy_sources_keep_recoverable_data() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path();
        let original = json!({"settings": {}, "other": true});
        write(path, &original, true).unwrap();
        let mut connection = connect(path).unwrap();
        connection
            .execute_batch(
                "CREATE TRIGGER reject_update BEFORE UPDATE ON settings_document
            BEGIN SELECT RAISE(ABORT, 'test rollback'); END;",
            )
            .unwrap();
        assert!(write_document(
            &mut connection,
            &json!({"settings": {"daily_mode": true}}),
            false
        )
        .is_err());
        assert_eq!(
            read_document(&connection).unwrap(),
            Some((original.clone(), true))
        );
        let changed = json!({"settings": {}, "other": "newer edit"});
        fs::write(
            path.join(LEGACY_FILENAME),
            serde_json::to_vec(&changed).unwrap(),
        )
        .unwrap();
        assert!(finish_legacy_cleanup(path, Some((&original, &original))).is_err());
        assert_eq!(read_legacy(path).unwrap(), Some(changed));
        assert_eq!(read(path).unwrap().root, original);
    }

    #[test]
    fn corrupt_database_never_falls_back_to_legacy_defaults() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path();
        write(path, &json!({"settings": {"daily_mode": true}}), false).unwrap();
        connect(path)
            .unwrap()
            .execute(
                "UPDATE settings_document SET document = ?1 WHERE id = 1",
                ["{broken-document"],
            )
            .unwrap();
        fs::write(path.join(LEGACY_FILENAME), b"{\"settings\":{}}").unwrap();
        assert!(read(path).is_err());
        assert_eq!(
            fs::read(path.join(LEGACY_FILENAME)).unwrap(),
            b"{\"settings\":{}}"
        );
    }

    #[test]
    fn direct_root_legacy_file_can_be_scrubbed_after_wrapped_database_commit() {
        let directory = tempfile::tempdir().unwrap();
        let legacy =
            json!({"daily_mode": true, "custom_model": {"auth": "migration-test"}, "metadata": 42});
        fs::write(
            directory.path().join(LEGACY_FILENAME),
            serde_json::to_vec(&legacy).unwrap(),
        )
        .unwrap();
        let sanitized = json!({"daily_mode": true, "custom_model": {}, "metadata": 42});
        let document =
            json!({"settings": {"daily_mode": true, "custom_model": {}}, "metadata": 42});
        write(directory.path(), &document, true).unwrap();
        finish_legacy_cleanup(directory.path(), Some((&legacy, &sanitized))).unwrap();
        assert_eq!(read_legacy(directory.path()).unwrap(), Some(sanitized));
        assert_eq!(read(directory.path()).unwrap().root, document);
    }
}
