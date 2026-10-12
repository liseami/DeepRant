#!/usr/bin/env python3
# [INPUT]: 实际 DMG、发布版本与架构、macOS 只读挂载工具、ds-store 与 mac-alias 元数据解析。
# [OUTPUT]: 单应用身份/版本/架构、严格签名与票据、安装链接和实际背景/拖拽布局验收；失败退出。
# [POS]: 验收用户下载的盘内载荷；公证后模式额外强制容器票据与 Gatekeeper，不移除隔离属性。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import struct
import subprocess
import tempfile
from ds_store import DSStore
from mac_alias import Alias

ROOT = Path(__file__).resolve().parent.parent
SAFE_ENV = {key: value for key, value in os.environ.items()
            if not key.startswith(('APPLE_', 'TAURI_SIGNING_PRIVATE_KEY'))}


def run(*args):
    return subprocess.run([str(arg) for arg in args], check=True,
                          capture_output=True, text=True, env=SAFE_ENV)


def verify_payload(mount, version, architecture):
    if {path.name for path in mount.glob('*.app')} != {'DeepRant.app'}:
        raise SystemExit('DMG must contain exactly one DeepRant.app')
    link = mount / 'Applications'
    if not link.is_symlink() or os.readlink(link) != '/Applications':
        raise SystemExit('DMG Applications install link is invalid')
    background = mount / '.background.png'
    source = ROOT / 'src/assets/dmg-background.png'
    if background.is_symlink() or not background.is_file():
        raise SystemExit('DMG pixel background is missing or linked externally')
    data = background.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', data[16:24]) != (800, 500):
        raise SystemExit('DMG pixel background must be an 800x500 PNG')
    if hashlib.sha256(data).digest() != hashlib.sha256(source.read_bytes()).digest():
        raise SystemExit('DMG pixel background differs from the release asset')
    with DSStore.open(str(mount / '.DS_Store'), 'r') as store:
        view = store['.']['icvp']
        if view['backgroundType'] != 2 or view['iconSize'] != 112 or view['textSize'] != 16:
            raise SystemExit('Finder image background or icon sizes are invalid')
        alias = Alias.from_bytes(view['backgroundImageAlias'])
        if alias.volume.name != 'DeepRant' or alias.target.filename != '.background.png':
            raise SystemExit('Finder background alias points to an unexpected asset')
        if (alias.target.posix_path or '').strip('/') != '.background.png':
            raise SystemExit('Finder background must resolve within the installation volume')
        if store['.']['bwsp']['WindowBounds'] != '{{100, 100}, {800, 500}}':
            raise SystemExit('Finder installation window bounds are invalid')
        for name, position in [('DeepRant.app', (200, 275)), ('Applications', (600, 275))]:
            if tuple(store[name]['Iloc']) != position:
                raise SystemExit(f'Finder drag-and-drop position mismatch: {name}')
    app = mount / 'DeepRant.app'
    if app.is_symlink() or not app.is_dir():
        raise SystemExit('DMG application must be a local bundle')
    with (app / 'Contents/Info.plist').open('rb') as stream:
        info = plistlib.load(stream)
    config = json.loads((ROOT / 'src-tauri/tauri.conf.json').read_text())
    if info.get('CFBundleIdentifier') != config['identifier']:
        raise SystemExit('DMG application identifier mismatch')
    if info.get('CFBundleShortVersionString') != version:
        raise SystemExit('DMG application version mismatch')
    if info.get('CFBundleName') != 'DeepRant' or info.get('CFBundleExecutable') != 'DeepRant':
        raise SystemExit('DMG application name or launch executable mismatch')
    executable = app / 'Contents/MacOS/DeepRant'
    if not executable.is_file() or not os.access(executable, os.X_OK):
        raise SystemExit('DMG application launch executable is missing')
    if run('lipo', '-archs', executable).stdout.split() != [architecture]:
        raise SystemExit('DMG application architecture mismatch')
    run('codesign', '--verify', '--deep', '--strict', app)
    run('xcrun', 'stapler', 'validate', app)
    run('spctl', '--assess', '--type', 'execute', '--verbose=2', app)


def main():
    parser = argparse.ArgumentParser(description='Verify the actual DeepRant installation disk')
    parser.add_argument('dmg', type=Path)
    parser.add_argument('--version', required=True)
    parser.add_argument('--arch', required=True, choices=['arm64', 'x86_64'])
    parser.add_argument('--notarized', action='store_true',
                        help='Require final DMG signature, stapled ticket and Gatekeeper acceptance')
    args = parser.parse_args()
    image = args.dmg.resolve()
    if args.notarized:
        run('codesign', '--verify', '--strict', image)
        run('xcrun', 'stapler', 'validate', image)
        run('spctl', '--assess', '--type', 'open', '--context',
            'context:primary-signature', '--verbose=2', image)
    with tempfile.TemporaryDirectory(prefix='deeprant-dmg-verify-') as directory:
        mount = Path(directory) / 'mount'
        mount.mkdir()
        run('hdiutil', 'attach', '-readonly', '-nobrowse', '-mountpoint', mount, image)
        try:
            verify_payload(mount, args.version, args.arch)
            print(f'DMG payload verified: DeepRant.app {args.version} {args.arch}', flush=True)
        finally:
            run('hdiutil', 'detach', mount)


if __name__ == '__main__':
    main()
