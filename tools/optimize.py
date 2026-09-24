# -*- coding: utf-8 -*-
"""Optimise generated level assets into assets/.

props   raw/cut/prop_*.png  -> assets/props/<name>.png   (<=512 px, 256-colour palette PNG with alpha)
islands raw/cut/isl_*.png   -> assets/isl/<world>.png     (512 px)
ui      raw/cut/ui_*.png    -> assets/props/ui_*.png
bg      raw/bg/bg_*.png     -> assets/bg/<name>.jpg (1280 px) + assets/bgthumb/<name>.jpg (160 px)
icon    raw/icon/icon_app   -> assets/icon-180/192/512.png + icon-maskable-512.png + startup images
props are also given a "matte" pass (R3 open item 3, same-artist look): the glossy white specular streaks of the
generated props are filled with their own surrounding colour (Peppa / Bluey props nearly flat, like those two families
of character stickers; the other worlds keep a soft sheen). Outlines, shapes, sizes and every detail stay as generated.
usage: python tools/optimize.py [--props-only]
"""
import os, glob, colorsys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from assets_manifest import ASSETS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
BIG = {'cake', 'toybox', 'bench', 'pen', 'hovercraft', 'helicopter', 'firetruck', 'policecar', 'jet', 'crate',
       'basket', 'rescuebasket', 'chest', 'coinjar', 'cookiejar', 'puddle', 'cloud', 'candlebox', 'plate', 'magicgourd'}


def save_png(im, path, maxs):
    if max(im.size) > maxs:
        k = maxs / max(im.size)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    q = im.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.NONE)
    q.save(path, optimize=True)
    return im.size


def hue_variant(im, target_hue, sat_mul=1.0, val_mul=1.0):
    """recolour the saturated red parts of an RGBA sticker to another hue (outline/highlights untouched)."""
    a = np.array(im).astype(np.float32) / 255.0
    rgb = a[..., :3]
    mx = rgb.max(-1); mn = rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    out = rgb.copy()
    H, W = mx.shape
    flat = rgb.reshape(-1, 3)
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in flat]).reshape(H, W, 3)
    mask = (hsv[..., 1] > 0.35) & ((hsv[..., 0] < 0.08) | (hsv[..., 0] > 0.92))
    hsv2 = hsv.copy()
    hsv2[..., 0] = np.where(mask, target_hue, hsv[..., 0])
    hsv2[..., 1] = np.where(mask, np.clip(hsv[..., 1] * sat_mul, 0, 1), hsv[..., 1])
    hsv2[..., 2] = np.where(mask, np.clip(hsv[..., 2] * val_mul, 0, 1), hsv[..., 2])
    rgb2 = np.array([colorsys.hsv_to_rgb(*p) for p in hsv2.reshape(-1, 3)]).reshape(H, W, 3)
    out = np.dstack([rgb2, a[..., 3:]])
    return Image.fromarray((out * 255).astype(np.uint8), 'RGBA')


PROP_WORLD = {aid[5:]: world for aid, kind, world, subj in ASSETS if aid.startswith('prop_')}
FLAT_WORLDS = {'peppa', 'bluey'}       # the two flat-painted character families
# designed white parts next to colour (stripes, doors, cloud, rocket body, white muzzles, cream) and glass / ice, whose shine IS the
# material: no matte pass for these (checked on the before/after sheet)
NO_MATTE = {'candle', 'candlebox', 'cloud', 'policecar', 'firetruck', 'rocket', 'plate', 'bunny', 'kitten', 'teddy', 'cake', 'coinjar', 'cookiejar', 'crate', 'cube'}


def _sat(x):
    mx = x.max(-1); mn = x.min(-1)
    return np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0), mx


def _blur(x, r):
    if x.ndim == 3:
        return np.dstack([_blur(x[..., i], r) for i in range(x.shape[-1])])
    return np.asarray(Image.fromarray(np.clip(x * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def matte(im, white):
    """fill glossy specular highlights (near-white paint inside a strongly coloured region, away from the ink lines)
    with the colour around them, lightened by `white` (0 = flat, 1 = unchanged). Normalised convolution: only
    non-highlight, non-ink pixels contribute to the fill colour."""
    a = np.asarray(im.convert('RGBA')).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    R = max(im.size) / 1100.0
    s, v = _sat(rgb)
    ink = (v < 0.3) & (al > 0.3)
    inkd = np.asarray(Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(int(9 * R) | 1))) > 0
    cand = (s < 0.4) & (v > 0.78) & (al > 0.5)
    valid = ((~cand) & (~ink) & (al > 0.5)).astype(np.float32)
    num = _blur(rgb * valid[..., None], 28 * R); den = _blur(valid, 28 * R)[..., None]
    fill = np.clip(num / np.maximum(den, 1e-3), 0, 1)
    fs, _ = _sat(fill)
    m = cand * np.clip((fs - 0.38) / 0.2, 0, 1) * (~inkd) * (den[..., 0] > 0.05)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(2 * R))).astype(np.float32) / 255
    tint = fill * (1 - white) + white
    out = rgb * (1 - m[..., None]) + tint * m[..., None]
    return Image.fromarray((np.clip(np.dstack([out, al]), 0, 1) * 255).astype(np.uint8), 'RGBA')


def props():
    os.makedirs(os.path.join(A, 'props'), exist_ok=True)
    os.makedirs(os.path.join(A, 'isl'), exist_ok=True)
    for f in sorted(glob.glob(os.path.join(ROOT, 'raw', 'cut', '*.png'))):
        n = os.path.basename(f)[:-4]
        im = Image.open(f).convert('RGBA')
        if n.startswith('isl_'):
            print(n, save_png(im, os.path.join(A, 'isl', n[4:] + '.png'), 512))
        elif n.startswith('ui_'):
            print(n, save_png(im, os.path.join(A, 'props', n + '.png'), 320))
        else:
            short = n[5:]
            if short not in NO_MATTE:
                im = matte(im, 0.12 if PROP_WORLD.get(short) in FLAT_WORLDS else 0.4)
            print(n, save_png(im, os.path.join(A, 'props', short + '.png'), 512 if short in BIG else 400))
    # boots colour family (the one generated pair re-coloured; outline untouched)
    boots = matte(Image.open(os.path.join(ROOT, 'raw', 'cut', 'prop_boots.png')).convert('RGBA'), 0.12)
    boots.thumbnail((400, 400), Image.LANCZOS)
    for name, hue, sm, vm in (('boots_blue', 0.60, 1.0, 1.0), ('boots_yellow', 0.13, 1.0, 1.25), ('boots_green', 0.33, 0.9, 0.95), ('boots_pink', 0.93, 0.55, 1.2)):
        v = hue_variant(boots, hue, sm, vm)
        print(name, save_png(v, os.path.join(A, 'props', name + '.png'), 400))


def backgrounds():
    os.makedirs(os.path.join(A, 'bg'), exist_ok=True)
    os.makedirs(os.path.join(A, 'bgthumb'), exist_ok=True)
    ids = sorted(set(os.path.basename(f)[:-4].replace('_v2', '') for f in glob.glob(os.path.join(ROOT, 'raw', 'bg', 'bg_*.png'))))
    for i in ids:
        src = os.path.join(ROOT, 'raw', 'bg', i + '_v2.png')
        if not os.path.exists(src):
            src = os.path.join(ROOT, 'raw', 'bg', i + '.png')
        im = Image.open(src)
        if im.mode == 'RGBA':
            r, g, b, _ = im.split(); im = Image.merge('RGB', (r, g, b))   # generator alpha is meaningless for scenes
        im = im.convert('RGB').resize((1280, 1280), Image.LANCZOS)
        short = i[3:]
        im.save(os.path.join(A, 'bg', short + '.jpg'), quality=80, optimize=True, progressive=True)
        t = im.resize((160, 160), Image.LANCZOS)
        t.save(os.path.join(A, 'bgthumb', short + '.jpg'), quality=55, optimize=True)
        print(short, os.path.getsize(os.path.join(A, 'bg', short + '.jpg')) // 1024, 'KB', '(v2)' if src.endswith('_v2.png') else '')


def icons():
    src = Image.open(os.path.join(ROOT, 'raw', 'icon', 'icon_app.png')).convert('RGB')
    # square crop is already full-bleed
    for s in (180, 192, 512):
        src.resize((s, s), Image.LANCZOS).save(os.path.join(A, 'icon-%d.png' % s), optimize=True)
    # maskable: keep the art inside the 80% safe circle
    bgc = src.getpixel((6, 6))
    m = Image.new('RGB', (512, 512), bgc)
    inner = src.resize((420, 420), Image.LANCZOS)
    mask = Image.new('L', (420, 420), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 419, 419), radius=90, fill=255)
    m.paste(inner, (46, 46), mask)
    m.save(os.path.join(A, 'icon-maskable-512.png'), optimize=True)
    # iPad startup images (portrait + landscape) - brand colour, app icon, wordmark
    fontp = 'C:/Windows/Fonts/msyhbd.ttc'
    sizes = [(1536, 2048), (1620, 2160), (1640, 2360), (1668, 2224), (1668, 2388), (2048, 2732), (1488, 2266)]
    os.makedirs(os.path.join(A, 'splash'), exist_ok=True)
    for (w, h) in sizes:
        for (W, H) in ((w, h), (h, w)):
            img = Image.new('RGB', (W, H), (255, 244, 214))
            d = ImageDraw.Draw(img)
            # soft sea band at the bottom
            d.rectangle((0, int(H * 0.78), W, H), fill=(78, 198, 240))
            s = int(min(W, H) * 0.34)
            ic = src.resize((s, s), Image.LANCZOS)
            mk = Image.new('L', (s, s), 0)
            ImageDraw.Draw(mk).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.22), fill=255)
            img.paste(ic, ((W - s) // 2, int(H * 0.40) - s // 2), mk)
            try:
                f = ImageFont.truetype(fontp, int(s * 0.28))
                txt = '点点岛'
                tw = d.textlength(txt, font=f)
                d.text(((W - tw) / 2, int(H * 0.40) + s // 2 + int(s * 0.12)), txt, font=f, fill=(43, 33, 24))
            except Exception as e:
                print('font', e)
            img.save(os.path.join(A, 'splash', 'splash-%dx%d.png' % (W, H)), optimize=True)
    print('icons + splash done')


if __name__ == '__main__':
    props()
    if '--props-only' not in sys.argv:
        backgrounds()
        icons()
