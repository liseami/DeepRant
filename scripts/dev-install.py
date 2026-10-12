#!/usr/bin/env python3
# [INPUT]: 本机源码、锁定依赖与 Tauri debug/custom-protocol 构建工具。
# [OUTPUT]: 临时签名、内嵌 UI 的 DeepRant 开发包，事务重装并启动；用户负责视觉验收。
# [POS]: 沿 CCBaga 的本机交付入口；过滤签名凭据，不发布，每次重新打包。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
import json
import os
from pathlib import Path
import platform
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent

def development_env():
    return {key: value for key, value in os.environ.items()
            if not key.startswith(('APPLE_', 'TAURI_SIGNING_PRIVATE_KEY'))} | {
                'CC_SIGN_IDENTITY': '-', 'MACOSX_DEPLOYMENT_TARGET': '12.0'}

def main():
    if platform.system() != 'Darwin' or platform.machine() != 'arm64':
        raise SystemExit('This fast debug installer is for macOS Apple Silicon; use docs/linux.md on Linux')
    config = json.dumps({'bundle': {'createUpdaterArtifacts': False, 'macOS': {'signingIdentity': '-'}}})
    env = development_env()
    cargo = subprocess.check_output(['rustup', 'which', 'cargo'], text=True).strip()
    env['PATH'] = str(Path(cargo).parent) + os.pathsep + env['PATH']
    subprocess.run(['npm', 'run', 'tauri', '--', 'build', '--debug', '--bundles', 'app', '--features', 'custom-protocol', '--config', config, '--', '--locked], cwd=ROOT, env=env, check=True)
    subprocess.run([sys.executable, 'scripts/install-apps.py', '--development'], cwd=ROOT, env=env, check=True)

if __name__ == '__main__':
    main()
