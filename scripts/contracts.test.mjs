/**
 * [INPUT]: 场景 / 语言目录、发布及权限配置、原录屏字节与实际浮窗会话守卫。
 * [OUTPUT]: Node 检查目录 / 版本 / 凭据边界、单文件视频 scope 与迟到会话响应。
 * [POS]: 跨边界契约检查；业务行为另由 Rust 单元测试和平台安装验收覆盖。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { GAMES } from '../src/data/scenes.js';
import { LANGUAGES } from '../src/data/languages.js';
import { ComposerSession } from '../src/utils/composer-session.js';
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

test('desktop services are available only through native application commands', () => {
  assert.deepEqual(json('src-tauri/capabilities/default.json').permissions, ['core:default']);
  assert.deepEqual(json('src-tauri/capabilities/composer.json').permissions, ['core:default']);
  const root = new URL('../src/', import.meta.url);
  for (const path of readdirSync(root, { recursive: true }).filter(path => /\.(jsx|js)$/.test(path))) {
    const source = readFileSync(new URL(path, root), 'utf8');
    assert.doesNotMatch(source, /@tauri-apps\/(plugin-|api\/path)/, path);
    assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest)\s*\(/, path);
  }
});

test('original game recording and preview remain byte-for-byte intact', () => {
  for (const line of read('src/assets/media.sha256').trim().split('\n')) {
    const [expected, path] = line.split('  ');
    const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected);
  }
});

test('late composer events and cancellation cannot replace a newer session', () => {
  const session = new ComposerSession();
  assert.equal(session.accept(1), true);
  assert.equal(session.accept(1), false);
  session.beginCancel(1);
  assert.equal(session.owns(1), false);
  assert.equal(session.accept(1), false);
  assert.equal(session.accept(2), true);
  session.finish(1);
  assert.equal(session.owns(2), true);
  assert.equal(session.accept(1), false);
  session.beginCancel(2);
  session.cancelFailed(2);
  assert.equal(session.owns(2), true);
  session.finish(2);
  assert.equal(session.accept(2), false);
  assert.equal(session.accept(3), true);
});

test('game video file access is limited to the shipped recording', () => {
  const config = json('src-tauri/tauri.conf.json');
  assert.deepEqual(config.bundle.resources, { '../src/assets/demovideo.mp4': 'media/demovideo.mp4' });
  assert.deepEqual(config.app.security.assetProtocol.scope, ['$RESOURCE/media/demovideo.mp4']);
  assert.ok(config.app.security.assetProtocol.enable);
});
