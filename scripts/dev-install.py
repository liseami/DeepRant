#!/usr/bin/env python3
# [INPUT]: 本机源码、锁定依赖与 Tauri debug/custom-protocol 构建工具。
# [OUTPUT]: 内嵌 UI 的本机包，优先同团队稳定 Developer ID 保留输入权限身份；事务重装、启动、记录产物。
# [POS]: release 分支本机交付入口；过滤签名凭据，只调用系统钥匙串签名，不发布，视觉由用户验收。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
import json
import hashlib
from datetime import datetime, timezone
import os
from pathlib import Path
import platform
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent

def development_env(identity='-'):
    return {key: value for key, value in os.environ.items()
            if not key.startswith(('APPLE_', 'TAURI_SIGNING_PRIVATE_KEY'))} | {
                'CC_SIGN_IDENTITY': identity, 'MACOSX_DEPLOYMENT_TARGET': '12.0'}

def local_identity():
    expected = json.loads((ROOT / 'src-tauri/tauri.conf.json').read_text())['bundle']['macOS']['signingIdentity']
    result = subprocess.run(['security', 'find-identity', '-v', '-p', 'codesigning'], capture_output=True, text=True, check=True)
    for fingerprint, name in re.findall(r'([A-F0-9]{40}) "([^"]+)"', result.stdout):
        if name == expected:
            return fingerprint
    return '-'

def main():
    if platform.system() != 'Darwin' or platform.machine() != 'arm64':
        raise SystemExit('This local development installer requires macOS Apple Silicon')
    if subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip() != 'release':
        raise SystemExit('Package only from the release branch')
    signing = local_identity()
    config = json.dumps({'bundle': {'createUpdaterArtifacts': False, 'macOS': {'signingIdentity': signing}}})
    env = development_env(signing)
    cargo = subprocess.check_output(['rustup', 'which', 'cargo'], text=True).strip()
    env['PATH'] = str(Path(cargo).parent) + os.pathsep + env['PATH']
    subprocess.run(['npm', 'run', 'tauri', '--', 'build', '--debug', '--bundles', 'app', '--features', 'custom-protocol', '--config', config, '--', '--locked'], cwd=ROOT, env=env, check=True)
    subprocess.run([sys.executable, 'scripts/install-apps.py', '--development'], cwd=ROOT, env=env, check=True)
    # ----- 固定本次源码 commit，保留可交付的新包；视觉验收由用户进行 -----
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    version = json.loads((ROOT / 'package.json').read_text())['version']
    output = ROOT / 'releases'
    output.mkdir(exist_ok=True)
    archive = output / f'DeepRant-{version}-local-arm64-{commit[:8]}.app.zip'
    subprocess.run(['ditto', '-c', '-k', '--keepParent', '/Applications/DeepRant.app', str(archive)], check=True)
    record = {'commit': commit, 'built_at': datetime.now(timezone.utc).isoformat(), 'version': version,
              'signature': 'local development ad-hoc' if signing == '-' else 'Developer ID Application / 6UB6WM6VQR', 'archive': archive.name,
              'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()}
    (output / 'local-build.json').write_text(json.dumps(record, indent=2) + '\n')
    print(f'Fresh local package: {archive}', flush=True)

if __name__ == '__main__':
    main()
