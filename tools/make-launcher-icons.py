#!/usr/bin/env python3
"""
Генерация иконок CakeCost (вариант D «Итог») без внешних зависимостей:
в системе нет ни Pillow, ни pip, поэтому PNG пишется вручную через zlib,
а сглаживание даётся суперсэмплингом 4x.

Композиция задана в системе координат 512x512 и переносится в любой размер.
"""
import os
import struct
import zlib

# ── палитра ────────────────────────────────────────────────────────────────
COCOA = (0x2b, 0x21, 0x1c, 255)      # фон: тёмный шоколад
LAYER_1 = (0x8c, 0x4f, 0x1c, 255)    # слои себестоимости, сверху вниз
LAYER_2 = (0xb9, 0x6a, 0x25, 255)
LAYER_3 = (0xd9, 0x9a, 0x55, 255)
EQUALS = (0x7a, 0x64, 0x55, 255)     # знак «равно»
TOTAL = (0xf0, 0xb3, 0x57, 255)      # итоговая сумма: золото

# ── композиция варианта D в координатах 512 ────────────────────────────────
# (x, y, w, h, r, color)
SHAPES = [
    (112, 128, 288, 40, 10, LAYER_1),
    (112, 180, 232, 40, 10, LAYER_2),
    (112, 232, 176, 40, 10, LAYER_3),
    (112, 306, 52, 14, 7, EQUALS),
    (112, 336, 52, 14, 7, EQUALS),
    (192, 300, 208, 56, 14, TOTAL),
]
CONTENT_BOX = (112, 128, 400, 356)   # bbox рисунка: x0, y0, x1, y1

SS = 4  # суперсэмплинг


def in_rounded_rect(px, py, x, y, w, h, r):
    if px < x or py < y or px >= x + w or py >= y + h:
        return False
    if r <= 0:
        return True
    # углы
    for cx, cy in ((x + r, y + r), (x + w - r, y + r), (x + r, y + h - r), (x + w - r, y + h - r)):
        if (px < x + r or px > x + w - r) and (py < y + r or py > y + h - r):
            near_x = x + r if px < x + r else x + w - r
            near_y = y + r if py < y + r else y + h - r
            return (px - near_x) ** 2 + (py - near_y) ** 2 <= r * r
    return True


def render(size, scale, offset_x, offset_y, background, mask):
    """background: цвет фона или None (прозрачный); mask: 'square'|'rounded'|'circle'"""
    big = size * SS
    buf = bytearray(big * big * 4)

    bg_radius = 0.227 * big  # как у Android-иконок
    center = big / 2.0
    circle_r = big / 2.0

    shapes = [
        (x * scale * SS + offset_x * SS, y * scale * SS + offset_y * SS,
         w * scale * SS, h * scale * SS, r * scale * SS, color)
        for (x, y, w, h, r, color) in SHAPES
    ]

    for py in range(big):
        row = py * big * 4
        fy = py + 0.5
        for px in range(big):
            fx = px + 0.5

            # маска подложки
            inside = True
            if mask == 'rounded':
                inside = in_rounded_rect(fx, fy, 0, 0, big, big, bg_radius)
            elif mask == 'circle':
                inside = (fx - center) ** 2 + (fy - center) ** 2 <= circle_r * circle_r

            color = None
            if background is not None and inside:
                color = background

            # фигуры поверх фона
            for (x, y, w, h, r, c) in shapes:
                if in_rounded_rect(fx, fy, x, y, w, h, r):
                    if background is None or inside:
                        color = c
                    break

            if color is not None:
                i = row + px * 4
                buf[i] = color[0]
                buf[i + 1] = color[1]
                buf[i + 2] = color[2]
                buf[i + 3] = color[3]

    # даунсэмплинг усреднением
    out = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            r = g = b = a = 0
            for sy in range(SS):
                base = ((y * SS + sy) * big + x * SS) * 4
                for sx in range(SS):
                    i = base + sx * 4
                    alpha = buf[i + 3]
                    r += buf[i] * alpha
                    g += buf[i + 1] * alpha
                    b += buf[i + 2] * alpha
                    a += alpha
            o = (y * size + x) * 4
            if a:
                out[o] = min(255, r // a)
                out[o + 1] = min(255, g // a)
                out[o + 2] = min(255, b // a)
                out[o + 3] = a // (SS * SS)
    return out


def write_png(path, size, pixels):
    raw = b''.join(b'\x00' + bytes(pixels[y * size * 4:(y + 1) * size * 4]) for y in range(size))

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(png)
    return len(png)


RES = '/projects/CakeCalk/android/app/src/main/res'

LEGACY = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
FOREGROUND = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}

total_bytes = 0

# 1. Legacy: квадрат со скруглением и круглая версия
for density, size in LEGACY.items():
    scale = size / 512.0
    for name, mask in (('ic_launcher', 'rounded'), ('ic_launcher_round', 'circle')):
        px = render(size, scale, 0, 0, COCOA, mask)
        path = f'{RES}/mipmap-{density}/{name}.png'
        total_bytes += write_png(path, size, px)
    print(f'mipmap-{density}: {size}px legacy + round')

# 2. Adaptive foreground: прозрачный фон, рисунок вписан в безопасную зону 66%
x0, y0, x1, y1 = CONTENT_BOX
content_w, content_h = x1 - x0, y1 - y0
for density, size in FOREGROUND.items():
    safe = size * 0.62                      # чуть уже 66%: край маски срезает
    scale = safe / max(content_w, content_h)
    offset_x = (size - content_w * scale) / 2.0 - x0 * scale
    offset_y = (size - content_h * scale) / 2.0 - y0 * scale
    px = render(size, scale, offset_x, offset_y, None, 'square')
    path = f'{RES}/mipmap-{density}/ic_launcher_foreground.png'
    total_bytes += write_png(path, size, px)
    print(f'mipmap-{density}: {size}px adaptive foreground')

# 3. Иконка для Play Console: полный квадрат, маску накладывает сам Play
px = render(512, 1.0, 0, 0, COCOA, 'square')
play_path = '/projects/CakeCalk/play-store-icon-512.png'
total_bytes += write_png(play_path, 512, px)
print('play-store-icon-512.png')

print(f'\nвсего {total_bytes / 1024:.0f} KB')
