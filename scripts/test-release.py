#!/usr/bin/env python3
# [INPUT]: 发布脚本与临时平台产物，凭据只使用测试字符串。
# [OUTPUT]: 验证产物缺失、哈希篡改、签名/URL 错配被闸门拒绝，构建环境没有签名变量。
# [POS]: 发布信任边界回归；使用独立临时目录，不修改用户产物或读取真实私钥。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parent


class ReleaseContracts(unittest.TestCase):
    def fixture(self, root):
        (root / 'scripts').mkdir()
        output = root / 'releases'
        output.mkdir()
        shutil.copy2(SOURCE / 'assemble-release.py', root / 'scripts/assemble-release.py')
        (root / 'package.json').write_text('{"version":"2.0.0"}')
        (root / 'RELEASE_NOTES.md').write_text('Release fixture')
        for platform, suffix in [('darwin-aarch64', 'macos-arm64.app.tar.gz'),
                                 ('darwin-x86_64', 'macos-x64.app.tar.gz'),
                                 ('windows-x86_64', 'windows-x86_64-setup.exe')]:
            archive = output / f'DeepRant-2.0.0-{suffix}'
            archive.write_bytes(b'fixture-package')
            signature = output / (archive.name + '.sig')
            signature.write_text('fixture-signature')
            manifest = output / f'latest-{platform}.json'
            manifest.write_text(json.dumps({'version': '2.0.0', 'pub_date': '2026-10-12T00:00:00Z',
                'platforms': {platform: {'url': f'https://github.com/liseami/DeepRant/releases/download/v2.0.0/{archive.name}',
                                          'signature': signature.read_text()}}}))
            assets = [archive, signature, manifest]
            if platform.startswith('darwin'):
                dmg = output / archive.name.replace('.app.tar.gz', '.dmg')
                dmg.write_bytes(b'fixture-dmg')
                assets.append(dmg)
            (output / f'SHA256SUMS-{platform}').write_text(''.join(
                f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in assets))
        return output

    def assemble(self, root):
        return subprocess.run([sys.executable, str(root / 'scripts/assemble-release.py')],
                              cwd=root, capture_output=True).returncode

    def test_complete_set_publishes_only_expected_assets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = self.fixture(root)
            self.assertEqual(self.assemble(root), 0)
            manifest = json.loads((output / 'latest.json').read_text())
            self.assertEqual(len(manifest['platforms']), 3)
            self.assertEqual(len((root / 'release-files.txt').read_text().splitlines()), 10)

    def test_missing_tampered_or_misdirected_artifacts_are_rejected(self):
        for kind in ['empty-checksum', 'tampered', 'signature', 'url', 'missing']:
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                output = self.fixture(root)
                archive = output / 'DeepRant-2.0.0-windows-x86_64-setup.exe'
                if kind == 'empty-checksum':
                    (output / 'SHA256SUMS-windows-x86_64').write_text('')
                elif kind == 'tampered':
                    archive.write_bytes(b'changed-bytes')
                elif kind == 'missing':
                    archive.unlink()
                else:
                    path = output / 'latest-windows-x86_64.json'
                    manifest = json.loads(path.read_text())
                    manifest['platforms']['windows-x86_64'][kind] = 'incorrect'
                    path.write_text(json.dumps(manifest))
                self.assertNotEqual(self.assemble(root), 0)
                self.assertFalse((root / 'release-files.txt').exists())

    def test_build_environment_never_inherits_signing_variables(self):
        keys = ['TAURI_SIGNING_PRIVATE_KEY', 'TAURI_SIGNING_PRIVATE_KEY_PATH',
                'TAURI_SIGNING_PRIVATE_KEY_PASSWORD', 'APPLE_API_PRIVATE_KEY']
        with patch.dict(os.environ, {key: 'fixture-only' for key in keys}):
            spec = importlib.util.spec_from_file_location('release_contract', SOURCE / 'release.py')
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.assertFalse(any(key in module.SAFE_ENV for key in keys))

    def test_local_delivery_filters_release_credentials(self):
        keys = ['APPLE_CERTIFICATE', 'APPLE_API_PRIVATE_KEY', 'TAURI_SIGNING_PRIVATE_KEY',
                'TAURI_SIGNING_PRIVATE_KEY_PATH', 'TAURI_SIGNING_PRIVATE_KEY_PASSWORD']
        with patch.dict(os.environ, {key: 'fixture-only' for key in keys}):
            spec = importlib.util.spec_from_file_location('local_delivery_contract', SOURCE / 'dev-install.py')
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            env = module.development_env()
            self.assertFalse(any(key in env for key in keys))
            self.assertEqual(env['CC_SIGN_IDENTITY'], '-')


if __name__ == '__main__':
    unittest.main()
