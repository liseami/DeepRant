/**
 * [INPUT]: 前后端场景与语言目录、发布配置以及权限白名单。
 * [OUTPUT]: Node 内置测试，防止目录漂移、版本错配和 WebView 再次获得凭据持久化权限。
 * [POS]: 跨边界契约检查；业务行为另由 Rust 单元测试和平台安装验收覆盖。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { GAMES } from '../src/data/scenes.js';
import { LANGUAGES } from '../src/data/languages.js';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const json = (path) => JSON.parse(read(path));

test('frontend and native scene identifiers stay aligned', () => {
  const native = [...read('src-tauri/src/scenes.rs').matchAll(/id:\s*"([\w-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(Object.keys(GAMES).filter((id) => id !== 'custom').sort(), native.sort());
  assert.ok(LANGUAGES['en-GB']);
  assert.ok(LANGUAGES.zh);
});

test('release version and signing trust are consistent', () => {
  const pkg = json('package.json');
  const config = json('src-tauri/tauri.conf.json');
  const lock = json('package-lock.json');
  assert.equal(pkg.version, config.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.ok(read('src-tauri/Cargo.toml').includes(`version = "${pkg.version}"`));
  assert.equal(config.plugins.updater.requireSignedVersion, true);
  assert.match(config.plugins.updater.endpoints[0], /^https:\/\/github.com\/liseami\/DeepRant\//);
  assert.ok(config.app.security.csp.includes("object-src 'none'"));
});

test('webview cannot persist keys or execute platform scripts', () => {
  const permissions = json('src-tauri/capabilities/default.json').permissions;
  assert.ok(!permissions.some((p) => typeof p === 'string' && /^(shell|store|global-shortcut):/.test(p)));
  assert.ok(!read('src/components/StoreProvider.jsx').includes('@tauri-apps/plugin-store'));
  assert.ok(!read('src/pages/Settings.jsx').includes('fetch('));
});

test('original game recording and preview remain byte-for-byte intact', () => {
  for (const line of read('src/assets/media.sha256').trim().split('\n')) {
    const [expected, path] = line.split('  ');
    const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected);
  }
});
