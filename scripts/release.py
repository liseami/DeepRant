#!/usr/bin/env python3
# [INPUT]: 锁定源码、release 版本、哈希锁定 dmgbuild、Developer ID / Apple 公证凭据和更新签名私钥。
# [OUTPUT]: 最终公证 DMG / 更新归档或 Windows 安装器，以及平台更新清单和 SHA-256。
# [POS]: 沿用 CCBaga 无头 Finder 安装盘与先公证装订、再签最终更新字节顺序；所有打包子进程隔离签名凭据。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'releases'
SIGN_KEYS = ['TAURI_SIGNING_PRIVATE_KEY', 'TAURI_SIGNING_PRIVATE_KEY_PATH', 'TAURI_SIGNING_PRIVATE_KEY_PASSWORD']
SAFE_ENV = {key: value for key, value in os.environ.items()
            if key not in SIGN_KEYS and not key.startswith('APPLE_')}


def run(*args, env=None, capture=False):
    command = [str(x) for x in args]
    command[0] = shutil.which(command[0]) or command[0]
    return subprocess.run(command, cwd=ROOT, check=True,
                          env=SAFE_ENV if env is None else env,
                          capture_output=capture, text=capture)


def staple(artifact):
    # ----- 仅 Accepted 后的票据服务错误可短暂重试；损坏/撤销/写盘错误直接失败 -----
    for attempt in range(3):
        try:
            run('xcrun', 'stapler', 'staple', artifact)
            return
        except subprocess.CalledProcessError as error:
            if error.returncode != 68 or attempt == 2:
                raise
            print(f'Apple ticket service unavailable; retrying staple ({attempt + 2}/3)', flush=True)
            time.sleep(15 * (attempt + 1))


def main():
    target = sys.argv[1]
    config = json.loads((ROOT / 'src-tauri/tauri.conf.json').read_text())
    version = config['version']
    updater_env = SAFE_ENV | {k: os.environ[k] for k in SIGN_KEYS if k in os.environ}
    if not any(updater_env.get(key) for key in SIGN_KEYS[:2]):
        raise SystemExit('Missing TAURI_SIGNING_PRIVATE_KEY')
    OUTPUT.mkdir(exist_ok=True)
    # ----- 私钥只给 signer；编译器、打包器和公证客户端均看不到它 -----
    override = {'bundle': {'createUpdaterArtifacts': False}}
    if target.endswith('apple-darwin'):
        identity = os.environ.get('CC_SIGN_IDENTITY', config['bundle']['macOS']['signingIdentity'])
        if not identity or identity == '-':
            raise SystemExit('A Developer ID Application identity is required')
        override['bundle']['macOS'] = {'signingIdentity': identity}
        run('npm', 'run', 'tauri', '--', 'build', '--ci', '--target', target,
            '--bundles', 'app', '--features', 'custom-protocol', '--config', json.dumps(override), '--', '--locked')
        host = ROOT / f'src-tauri/target/{target}/release/bundle/macos/DeepRant.app'
        arch = 'arm64' if target.startswith('aarch64') else 'x64'
        platform = 'darwin-aarch64' if arch == 'arm64' else 'darwin-x86_64'
        auth = ['--key', os.environ['APPLE_API_KEY_PATH'], '--key-id', os.environ['APPLE_API_KEY'],
                '--issuer', os.environ['APPLE_API_ISSUER']]
        records = []

        def notarize(archive, ticket_target):
            result = run('xcrun', 'notarytool', 'submit', archive, *auth,
                         '--no-s3-acceleration', '--wait', '--output-format', 'json', capture=True)
            record = json.loads(result.stdout)
            records.append({'artifact': archive.name, 'id': record['id'], 'status': record.get('status')})
            (OUTPUT / f'notarization-{platform}.json').write_text(json.dumps(records, indent=2) + '\n')
            if record.get('status') != 'Accepted':
                run('xcrun', 'notarytool', 'log', record['id'], *auth,
                    OUTPUT / f"notary-{record['id']}.json")
                raise SystemExit('Apple rejected the artifact; inspect the notarization log')
            staple(ticket_target)
            run('xcrun', 'stapler', 'validate', ticket_target)

        with tempfile.TemporaryDirectory(prefix='deeprant-package-') as directory:
            work = Path(directory)
            archive = work / 'DeepRant.zip'
            run('codesign', '--verify', '--deep', '--strict', host)
            run('ditto', '-c', '-k', '--keepParent', host, archive)
            notarize(archive, host)
            run('spctl', '--assess', '--type', 'execute', host)
            # ----- 更新归档必须包含已经装订的应用，生成后不再改写 -----
            update = OUTPUT / f'DeepRant-{version}-macos-{arch}.app.tar.gz'
            with tarfile.open(update, 'w:gz', dereference=False) as bundle:
                bundle.add(host, arcname=host.name)
            # ----- 先验最终更新归档，再以版本签名；安装盘布局不改应用内部 -----
            verify = work / 'verify'
            verify.mkdir()
            with tarfile.open(update) as bundle:
                bundle.extractall(verify, filter='tar')
            run('codesign', '--verify', '--deep', '--strict', verify / host.name)
            run('xcrun', 'stapler', 'validate', verify / host.name)
            run('spctl', '--assess', '--type', 'execute', verify / host.name)
            run('npm', 'run', 'tauri', '--', 'signer', 'sign', '--app-version', version,
                update, env=updater_env, capture=True)
            stage = work / 'stage'
            stage.mkdir()
            run('ditto', host, stage / host.name)
            dmg = OUTPUT / f'DeepRant-{version}-macos-{arch}.dmg'
            # ----- 独立安全环境运行 dmgbuild，连它内部的 hdiutil 也没有 Apple / 更新私钥 -----
            run(sys.executable, '-m', 'dmgbuild', '-s', ROOT / 'scripts/dmg-settings.py',
                '-D', f'stage={stage}', '-D', f'root={ROOT}', '--no-hidpi', 'DeepRant', dmg)
            expected_arch = 'arm64' if arch == 'arm64' else 'x86_64'
            run(sys.executable, 'scripts/verify-dmg.py', dmg, '--version', version, '--arch', expected_arch)
            run('codesign', '--force', '--sign', identity, '--timestamp', dmg)
            notarize(dmg, dmg)
            run(sys.executable, 'scripts/verify-dmg.py', dmg, '--version', version,
                '--arch', expected_arch, '--notarized')
    elif target == 'x86_64-pc-windows-msvc':
        platform = 'windows-x86_64'
        run('npm', 'run', 'tauri', '--', 'build', '--ci', '--target', target,
            '--bundles', 'nsis', '--features', 'custom-protocol', '--config', json.dumps(override), '--', '--locked')
        installers = list((ROOT / f'src-tauri/target/{target}/release/bundle/nsis').glob('*-setup.exe'))
        if len(installers) != 1:
            raise SystemExit('Expected one Windows installer')
        update = OUTPUT / f'DeepRant-{version}-windows-x86_64-setup.exe'
        shutil.copy2(installers[0], update)
        run('npm', 'run', 'tauri', '--', 'signer', 'sign', '--app-version', version,
            update, env=updater_env, capture=True)
    else:
        raise SystemExit('Unsupported release target')
    signature = Path(str(update) + '.sig')
    repository = config['plugins']['updater']['endpoints'][0].split('/releases/')[0]
    manifest = {
        'version': version,
        'notes': 'See the GitHub release notes for migration and compatibility details.',
        'pub_date': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'platforms': {platform: {
            'url': f'{repository}/releases/download/v{version}/{update.name}',
            'signature': signature.read_text().strip()}}
    }
    manifest_path = OUTPUT / f'latest-{platform}.json'
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
    # ----- 用官方 updater 下载校验最终签名，篡改内容和冒用版本都必须失败 -----
    run('cargo', 'test', '--locked', '--manifest-path', 'src-tauri/Cargo.toml', '--features', 'custom-protocol',
        'updater_tests::published_archive_matches_embedded_key_and_signed_version', '--', '--ignored',
        env=SAFE_ENV | {'DR_UPDATE_MANIFEST': str(manifest_path), 'DR_UPDATE_ARCHIVE': str(update)})
    artifacts = [update, signature, manifest_path]
    if platform.startswith('darwin'):
        artifacts.append(dmg)
    hashes = [f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in artifacts]
    (OUTPUT / f'SHA256SUMS-{platform}').write_text(''.join(hashes))


if __name__ == '__main__':
    main()
