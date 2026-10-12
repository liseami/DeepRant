#!/usr/bin/env python3
# [INPUT]: 本机开发/正式 DeepRant 构建，或参数指定的已挂载 DMG；固定包标识与 macOS 签名/注册工具。
# [OUTPUT]: 核验后事务替换 /Applications 中的 DeepRant，移除同标识旧名副本，启动新版游戏翻译应用；失败恢复应用包。
# [POS]: 安装唯一执行层；保留隔离与用户资料；开发仅接受本机临时签名 debug 包，正式/DMG 保持 Gatekeeper 强验收。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
from pathlib import Path
import os
import argparse
import plistlib
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from urllib.parse import unquote, urlparse
ROOT = Path(__file__).resolve().parent.parent
APPS = [('DeepRant.app', 'com.DeepRant.app', 'DeepRant 鲸喷.app')]
REGISTER = '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister'
def run(*args):
    return subprocess.run([str(value) for value in args], check=True, capture_output=True, text=True)
def identity(app):
    with (app / 'Contents/Info.plist').open('rb') as stream:
        return plistlib.load(stream)['CFBundleIdentifier']
def verify(app, development=False):
    run('codesign', '--verify', '--deep', '--strict', app)
    if development:
        if 'Signature=adhoc' not in run('codesign', '--display', '--verbose=2', app).stderr.splitlines():
            raise RuntimeError('Development installation requires local ad-hoc signed debug apps')
    else:
        run('spctl', '--assess', '--type', 'execute', app)

def arguments(argv=None):
    parser = argparse.ArgumentParser(description='Install local debug apps or verified release apps')
    parser.add_argument('folder', nargs='?', help='Mounted official DMG folder')
    parser.add_argument('--development', action='store_true', help='Only local ad-hoc debug builds; no DMG input')
    args = parser.parse_args(argv)
    if args.development and args.folder:
        parser.error('--development cannot install a downloaded or mounted installer')
    return args
def refresh_dock():
    data = plistlib.loads(run('defaults', 'export', 'com.apple.dock', '-').stdout.encode())
    tiles = data.get('persistent-apps', [])
    changed = False
    for index, tile in enumerate(tiles):
        details = tile.get('tile-data', {})
        path = Path(unquote(urlparse(details.get('file-data', {}).get('_CFURLString', '')).path))
        for name, bundle_id, old_name in APPS:
            if details.get('bundle-identifier') == bundle_id or path in [Path('/Applications') / old_name, Path('/Applications') / name]:
                tiles[index] = {'tile-type': 'file-tile', 'tile-data': {'file-data': {'_CFURLString': (Path('/Applications') / name).as_uri() + '/', '_CFURLStringType': 15}}}
                changed = True
    if changed:
        values = [plistlib.dumps(tile).decode().split('<plist version="1.0">', 1)[1].rsplit('</plist>', 1)[0].strip() for tile in tiles]
        run('defaults', 'write', 'com.apple.dock', 'persistent-apps', '-array', *values)
        run('killall', 'Dock')
def main():
    args = arguments()
    folder = Path(args.folder) if args.folder else None
    build = 'debug' if args.development else 'release'
    sources = [folder / name for name, _, _ in APPS] if folder else [ROOT / f'src-tauri/target/{build}/bundle/macos/DeepRant.app']
    with tempfile.TemporaryDirectory(prefix='.deeprant-install-', dir='/Applications') as temporary:
        stage = Path(temporary)
        removals = []
        for index, (source, (name, bundle_id, old_name)) in enumerate(zip(sources, APPS)):
            if identity(source) != bundle_id:
                raise RuntimeError(f'Unexpected bundle identity: {source}')
            pending = stage / name
            run('ditto', source, pending)
            verify(pending, args.development)
            for base in [Path('/Applications'), Path.home() / 'Applications']:
                for candidate in [base / name, base / old_name]:
                    if candidate.exists():
                        if identity(candidate) != bundle_id:
                            raise RuntimeError(f'Conflicting application: {candidate}')
                        removals.append((candidate, stage / f'previous-{len(removals)}.app'))
        # ----- 只退出这些固定身份应用，等待正常结束后才改变磁盘 -----
        prefixes = [str(path / 'Contents/MacOS') + '/' for path, _ in removals]
        pids = []
        for line in run('ps', '-ww', '-axo', 'pid=,comm=').stdout.splitlines():
            parts = line.strip().split(None, 1)
            if len(parts) == 2 and any(parts[1].startswith(prefix) for prefix in prefixes):
                pids.append(int(parts[0]))
        for pid in pids:
            try: os.kill(pid, signal.SIGTERM)
            except ProcessLookupError: pass
        deadline = time.monotonic() + 15
        for pid in pids:
            while True:
                try: os.kill(pid, 0)
                except ProcessLookupError: break
                if time.monotonic() > deadline:
                    raise RuntimeError('Application did not quit; installation left unchanged')
                time.sleep(.1)
        moved, installed = [], []
        try:
            for old, backup in removals:
                run(REGISTER, '-u', old)
                old.rename(backup); moved.append((old, backup))
            for name, _, _ in APPS:
                target = Path('/Applications') / name
                (stage / name).rename(target); installed.append(target)
                verify(target, args.development); run(REGISTER, '-f', target)
        except BaseException:
            for target in installed: shutil.rmtree(target)
            for old, backup in reversed(moved):
                backup.rename(old); run(REGISTER, '-f', old)
            raise
    try: refresh_dock()
    except subprocess.CalledProcessError: print('Applications installed; Dock refresh could not complete.', file=sys.stderr)
    run('open', '-a', '/Applications/DeepRant.app')
    print('Installed fresh DeepRant; ' + ('local development ad-hoc signatures verified.' if args.development else 'strict signatures and Gatekeeper passed.'))
if __name__ == '__main__':
    main()
