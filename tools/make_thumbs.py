# -*- coding: utf-8 -*-
"""Avatar thumbnails (the round "listen again" button, 96 px on screen, a small speaker badge at its lower right).

The face is found from the measured eye centres (META in index.html, the same data the blinking eyelids use); the
seven characters without eye data (masks, winks) have a hand-set face centre. The face is placed a little up and
left of the middle of the circle (the badge sits at the lower right) at a size where eyes, nose and mouth all show.
Nothing in the picture is redrawn: crop and scale only.
usage: python tools/make_thumbs.py [--sheet out.jpg]
"""
import os, re, sys, json
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHARS = os.path.join(ROOT, 'assets', 'chars')
THUMBS = os.path.join(ROOT, 'assets', 'thumbs')
T = 160                                   # thumbnail pixels
AT = (0.47, 0.45)                         # where the face centre goes in the thumbnail (badge at the lower right)
K = 3.1                                   # crop size = K x eye distance (by default)

# faces without eye data: (face centre x, y as fractions of the sticker, crop size as a fraction of its height)
MANUAL = {
    'captain': (0.55, 0.30, 0.52), 'hawkeye': (0.50, 0.31, 0.48), 'ironman': (0.46, 0.32, 0.50),
    'miles': (0.42, 0.19, 0.34), 'panther': (0.50, 0.33, 0.52), 'spiderman': (0.47, 0.19, 0.38), 'snake': (0.50, 0.31, 0.44),
    'mummy_pig': (0.43, 0.20, 0.34),                                         # one eye in profile
    'george': (0.55, 0.32, 0.50), 'chilli': (0.55, 0.30, 0.50),              # big heads: whole face with ears / snout
}
# per character: (dx, dy in eye distances, size factor) - pigs have close-set eyes on a big head, dogs long muzzles
TUNE = {
    'peppa': (0.5, 0.5, 1.9), 'daddy_pig': (0.4, 0.4, 1.7),
    'bluey': (0, 0.55, 1.25), 'bingo': (0, 0.55, 1.25), 'bandit': (0, 0.55, 1.3),
    'chase': (0, 0.35, 1.1), 'marshall': (0, 0.35, 1.1), 'skye': (0, 0.35, 1.1), 'rocky': (0, 0.35, 1.1), 'zuma': (0, 0.35, 1.1), 'rubble': (0, 0.35, 1.1),
    'dragon_horse': (0, 0.3, 1.1), 'grandpa': (0, 0.55, 1.1), 'hulk': (0, 0.3, 1.05),
}


def meta():
    s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    m = re.search(r'const META = (\{.*?\});', s)
    return json.loads(m.group(1))


def box_for(name, im, M):
    W, H = im.size
    if name in MANUAL:
        fx, fy, fs = MANUAL[name]
        return fx * W, fy * H, fs * H
    eyes = (M.get(name) or [0, 0, []])[2]
    if len(eyes) < 2:
        raise SystemExit('no eyes for ' + name)
    (x1, y1), (x2, y2) = [(e[0] * W, e[1] * H) for e in eyes[:2]]
    d = max(8.0, ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5)
    tx, ty, tk = TUNE.get(name, (0, 0.3, 1.0))
    cx = (x1 + x2) / 2 + tx * d
    cy = (y1 + y2) / 2 + ty * d
    return cx, cy, K * d * tk


def make(name, M):
    im = Image.open(os.path.join(CHARS, name + '.png')).convert('RGBA')
    cx, cy, s = box_for(name, im, M)
    x0, y0 = cx - AT[0] * s, cy - AT[1] * s
    # paste with an offset that may be negative (the crop may reach past the sticker's edge)
    big = Image.new('RGBA', (im.width + 2 * int(s), im.height + 2 * int(s)), (0, 0, 0, 0))
    big.alpha_composite(im, (int(s), int(s)))
    crop = big.crop((int(round(x0 + s)), int(round(y0 + s)), int(round(x0 + 2 * s)), int(round(y0 + 2 * s))))
    th = crop.resize((T, T), Image.LANCZOS)
    th.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.NONE).save(os.path.join(THUMBS, name + '.png'), optimize=True)
    return th


def sheet(out, thumbs):
    s, pad = 150, 14
    cols = 8; rows = (len(thumbs) + cols - 1) // cols
    S = Image.new('RGB', (cols * (s + pad) + pad, rows * (s + pad + 20) + pad), (250, 246, 238)); d = ImageDraw.Draw(S)
    for k, (name, th) in enumerate(thumbs):
        r, c = divmod(k, cols); x, y = pad + c * (s + pad), pad + r * (s + pad + 20)
        bg = Image.new('RGBA', (s, s), (232, 85, 74, 255)); bg.alpha_composite(th.resize((s, s), Image.LANCZOS))
        m = Image.new('L', (s, s), 0); ImageDraw.Draw(m).ellipse((0, 0, s - 1, s - 1), fill=255)
        S.paste(bg.convert('RGB'), (x, y), m)
        d.ellipse((x, y, x + s - 1, y + s - 1), outline=(43, 33, 24), width=5)
        e = int(s * 34 / 96); o = int(s * 10 / 96); ex, ey = x + s - e + o, y + s - e + o          # the badge as in the app
        d.ellipse((ex, ey, ex + e, ey + e), fill=(255, 255, 255), outline=(43, 33, 24), width=3)
        d.text((x, y + s + 2), name, fill=(43, 33, 24))
    S.save(out, quality=86)


if __name__ == '__main__':
    M = meta()
    names = sorted(f[:-4] for f in os.listdir(CHARS) if f.endswith('.png'))
    thumbs = [(n, make(n, M)) for n in names]
    if '--sheet' in sys.argv:
        sheet(sys.argv[sys.argv.index('--sheet') + 1], thumbs)
    print(len(thumbs), 'thumbnails')
