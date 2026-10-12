#!/usr/bin/env python3
# [INPUT]: 三个平台校验通过的安装器、签名清单与各平台 SHA-256。
# [OUTPUT]: 唯一 latest.json、完整 SHA256SUMS 和公开发布文件列表。
# [POS]: CCBaga 式发布闸门；任何平台缺失、版本不符或字节改变都阻止公开。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'releases'
version = json.loads((ROOT / 'package.json').read_text())['version']
platforms = ['darwin-aarch64', 'darwin-x86_64', 'windows-x86_64']
manifest = {'version': version, 'notes': (ROOT / 'RELEASE_NOTES.md').read_text(), 'platforms': {}}
public = []
for platform in platforms:
    item = json.loads((OUTPUT / f'latest-{platform}.json').read_text())
    if item['version'] != version or set(item['platforms']) != {platform}:
        raise SystemExit(f'Invalid version or target for {platform}')
    suffix = {'darwin-aarch64': 'macos-arm64.app.tar.gz', 'darwin-x86_64': 'macos-x64.app.tar.gz',
              'windows-x86_64': 'windows-x86_64-setup.exe'}[platform]
    archive = f'DeepRant-{version}-{suffix}'
    expected = {archive, archive + '.sig', f'latest-{platform}.json'}
    if platform.startswith('darwin'):
        expected.add(archive.replace('.app.tar.gz', '.dmg'))
    advertised = item['platforms'][platform]
    if advertised['url'] != f'https://github.com/liseami/DeepRant/releases/download/v{version}/{archive}':
        raise SystemExit(f'Invalid archive URL for {platform}')
    if not advertised['signature'] or advertised['signature'] != (OUTPUT / (archive + '.sig')).read_text().strip():
        raise SystemExit(f'Signature mismatch for {platform}')
    manifest['pub_date'] = item['pub_date']
    manifest['platforms'].update(item['platforms'])
    seen = set()
    for line in (OUTPUT / f'SHA256SUMS-{platform}').read_text().splitlines():
        digest, name = line.split('  ', 1)
        if name not in expected or name in seen:
            raise SystemExit(f'Unexpected/duplicate checksum member: {name}')
        seen.add(name)
        path = OUTPUT / name
        if path.name != name or hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise SystemExit(f'Hash mismatch: {name}')
        if name.endswith(('.dmg', '.exe', '.app.tar.gz', '.sig')):
            public.append(path)
    if seen != expected:
        raise SystemExit(f'Missing required assets for {platform}')
(OUTPUT / 'latest.json').write_text(json.dumps(manifest, indent=2) + '\n')
public.append(OUTPUT / 'latest.json')
checksum = OUTPUT / 'SHA256SUMS'
checksum.write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in sorted(public)))
public.append(checksum)
(ROOT / 'release-files.txt').write_text(''.join(str(p.relative_to(ROOT)) + '\n' for p in public))
