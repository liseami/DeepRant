#!/usr/bin/env python3
# [INPUT]: 根目录 app-icon.png、macOS AppKit/iconutil；可选现有 pngquant/optipng 压缩器。
# [OUTPUT]: 带透明圆角的桌面 PNG/ICO/ICNS 及 256px 界面品牌副本，源图不变。
# [POS]: 复用 CCBaga 的原生图标网格；独立派生、临时目录自动清理，不触碰录屏。
# [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
import platform
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent

# ----- CCBaga 的 1024px 网格：四边 100px、主体 824px、圆角 185px -----
DRAW = r'''
import AppKit
let args = CommandLine.arguments
guard let image = NSImage(contentsOfFile: args[1]) else {
    fputs("无法读取品牌源图\n", stderr)
    exit(1)
}
let backing = NSBitmapImageRep(data: image.tiffRepresentation!)!.colorAt(x: 0, y: 0)!
for (mode, sizes) in [("mac", [16, 32, 64, 128, 256, 512, 1024]),
                      ("full", [16, 24, 32, 48, 64, 128, 256])] {
    for pixels in sizes {
        let size = CGFloat(pixels), scale = size / 1024
        let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels,
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
        bitmap.size = NSSize(width: size, height: size)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
        NSGraphicsContext.current?.imageInterpolation = .high
        NSGraphicsContext.current?.cgContext.clear(CGRect(x: 0, y: 0, width: size, height: size))
        let inset = mode == "mac" ? 100 * scale : 0
        let rect = NSRect(x: inset, y: inset, width: size - inset * 2, height: size - inset * 2)
        let radius = rect.width * 185 / 824
        let rounded = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
        if mode == "mac" {
            NSGraphicsContext.saveGraphicsState()
            let shadow = NSShadow()
            shadow.shadowColor = NSColor(white: 0, alpha: 0.25)
            shadow.shadowOffset = NSSize(width: 0, height: -10 * scale)
            shadow.shadowBlurRadius = 24 * scale
            shadow.set()
            backing.setFill()
            rounded.fill()
            NSGraphicsContext.restoreGraphicsState()
        }
        NSGraphicsContext.saveGraphicsState()
        rounded.addClip()
        image.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1)
        NSGraphicsContext.restoreGraphicsState()
        NSGraphicsContext.restoreGraphicsState()
        guard let data = bitmap.representation(using: .png, properties: [:]) else { exit(1) }
        try data.write(to: URL(fileURLWithPath: "\(args[2])/\(mode)-\(pixels).png"))
    }
}
'''


def run(*args):
    subprocess.run([str(arg) for arg in args], check=True)


def compress(path, *, palette=False):
    # ----- 界面与 ICNS 接受调色板；Tauri 直接读取的 PNG 必须保留 RGBA -----
    if palette and (pngquant := shutil.which('pngquant')):
        run(pngquant, '--force', '--strip', '--quality', '90-100', '--speed', '1',
            '--output', path, '--', path)
    elif optipng := shutil.which('optipng'):
        run(optipng, '-quiet', '-o2', '-nx', '-nb', '-nc', '-np', path)


def main():
    if platform.system() != 'Darwin':
        raise SystemExit('图标生成需要 macOS AppKit 和 iconutil；无需安装 Python 图像依赖。')
    icons = ROOT / 'src-tauri/icons'
    with tempfile.TemporaryDirectory(prefix='deeprant-icons-') as temporary:
        work = Path(temporary)
        script = work / 'draw.swift'
        script.write_text(DRAW)
        run('/usr/bin/swift', script, ROOT / 'app-icon.png', work)
        iconset = work / 'DeepRant.iconset'
        iconset.mkdir()
        for size in (16, 32, 128, 256, 512):
            for retina in (False, True):
                pixels = size * (2 if retina else 1)
                suffix = '@2x' if retina else ''
                output = iconset / f'icon_{size}x{size}{suffix}.png'
                shutil.copyfile(work / f'mac-{pixels}.png', output)
        run('/usr/bin/iconutil', '-c', 'icns', iconset, '-o', icons / 'icon.icns')
        # ----- iconutil 会重新编码 PNG；在归档后压缩各 PNG 载荷，保留非 PNG 块 -----
        archive = (icons / 'icon.icns').read_bytes()
        cursor, chunks = 8, []
        while cursor < len(archive):
            kind, length = struct.unpack('>4sI', archive[cursor:cursor + 8])
            data = archive[cursor + 8:cursor + length]
            if data.startswith(b'\x89PNG'):
                output = work / f'{kind.decode()}.png'
                output.write_bytes(data)
                compress(output, palette=True)
                data = output.read_bytes()
            chunks.append(kind + struct.pack('>I', len(data) + 8) + data)
            cursor += length
        payload = b''.join(chunks)
        (icons / 'icon.icns').write_bytes(b'icns' + struct.pack('>I', len(payload) + 8) + payload)
        for name, size in [('32x32.png', 32), ('128x128.png', 128), ('128x128@2x.png', 256)]:
            output = icons / name
            shutil.copyfile(work / f'full-{size}.png', output)
            compress(output)
        # ----- ICO 使用 PNG 载荷，保留各尺寸 alpha；不添加图像处理依赖 -----
        payloads = []
        for size in (16, 24, 32, 48, 64, 128, 256):
            output = work / f'ico-{size}.png'
            shutil.copyfile(work / f'full-{size}.png', output)
            compress(output, palette=True)
            payloads.append((size, output.read_bytes()))
        offset = 6 + 16 * len(payloads)
        entries = []
        for size, data in payloads:
            entries.append(struct.pack('<BBBBHHII', size % 256, size % 256, 0, 0,
                                       1, 32, len(data), offset))
            offset += len(data)
        (icons / 'icon.ico').write_bytes(struct.pack('<HHH', 0, 1, len(payloads))
                                        + b''.join(entries) + b''.join(data for _, data in payloads))
        display = work / 'display.png'
        shutil.copyfile(work / 'full-256.png', display)
        compress(display, palette=True)
        for output in (ROOT / 'src/assets/app-icon.png', ROOT / 'public/app-icon.png'):
            shutil.copyfile(display, output)
    print('图标已从原图派生；macOS 透明边距与圆角已嵌入，源图和录屏保持不变。')


if __name__ == '__main__':
    main()
