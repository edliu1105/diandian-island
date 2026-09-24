# -*- coding: utf-8 -*-
"""Import the client's 39 character stickers WITHOUT redrawing them.

Allowed processing only: trim transparent margins, scale, crop a small head thumbnail.
Also measures (does not modify) eye positions so the app can overlay blinking eyelids,
and writes assets/chars/meta.json.

usage: python tools/import_chars.py [src_dir]
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'incoming', 'chars_orig')
OUT = os.path.join(ROOT, 'assets', 'chars')
THUMBS = os.path.join(ROOT, 'assets', 'thumbs')
DEBUG = os.path.join(ROOT, 'raw', 'debug')
PAD = 6
MAXS = 512
THUMB = 160

# eyes are measured automatically; characters whose eyes are hidden by masks/visors never blink
NO_BLINK = {'ironman', 'spiderman', 'miles', 'panther', 'captain', 'hawkeye', 'snake'}

# lid colour overrides where the fur around the eye changes colour (white-oval eyes on dark masks)
LID_OVERRIDE = {'bingo': ['#f0934a', '#f0934a'], 'bandit': ['#2f3753', '#2f3753'], 'bluey': ['#353a5c', '#353a5c'], 'chilli': ['#e0914c', '#e0914c']}

# Hand-measured eye centres/radii in trimmed-sticker pixels (x, y, rx, ry), refined automatically below.
# Characters that wink or whose eyes are hidden by masks never blink.
EYES_MANUAL = {
    'wukong': [(144, 151, 20, 22), (221, 151, 21, 22)],
    'bajie': [(217, 121, 15, 17), (297, 132, 16, 17)],
    'shaseng': [(187, 111, 20, 24), (276, 125, 19, 23)],
    'tangseng': [(80, 175, 15, 18), (147, 175, 15, 18)],
    'dragon_horse': [(80, 183, 20, 26), (174, 183, 19, 26)],
    'grandpa': [(121, 107, 16, 17), (192, 107, 17, 17)],
    'gourd1': [(101, 208, 19, 26), (182, 208, 20, 26)],
    'gourd2': [(104, 208, 19, 26), (186, 208, 19, 26)],
    'gourd3': [(120, 190, 16, 23), (200, 205, 20, 25)],
    'gourd4': [(143, 210, 19, 26), (220, 197, 20, 25)],
    'gourd5': [(93, 218, 19, 26), (174, 208, 19, 26)],
    'gourd6': [(142, 192, 20, 25), (225, 206, 20, 24)],
    'gourd7': [(61, 193, 19, 27), (137, 196, 20, 26)],
    'scorpion': [(130, 184, 20, 24), (211, 177, 21, 25)],
    'peppa': [(150, 133, 17, 17), (205, 106, 17, 17)],
    'george': [(151, 130, 19, 19), (224, 151, 19, 19)],
    'daddy_pig': [(150, 66, 12, 12), (200, 78, 12, 12)],
    'mummy_pig': [(168, 95, 13, 15)],
    'bluey': [(164, 165, 30, 40), (239, 155, 30, 40)],
    'bingo': [(131, 160, 20, 23), (208, 180, 21, 23)],
    'bandit': [(125, 140, 25, 38), (186, 131, 26, 38)],
    'chilli': [(119, 150, 30, 42), (181, 148, 28, 40)],
    'ryder': [(106, 185, 15, 18), (166, 183, 15, 18)],
    'chase': [(100, 160, 18, 20), (182, 150, 18, 20)],
    'marshall': [(127, 182, 17, 20), (204, 170, 17, 20)],
    'skye': [(143, 170, 22, 25), (243, 150, 22, 25)],
    'rocky': [(120, 143, 18, 22), (205, 153, 18, 22)],
    'zuma': [(109, 143, 20, 22), (201, 143, 20, 22)],
    'rubble': [(118, 178, 20, 22), (213, 163, 20, 22)],
    'thor': [(175, 150, 15, 20), (252, 170, 15, 20)],
    'hulk': [(181, 125, 15, 15), (266, 125, 15, 15)],
    'widow': [(92, 135, 15, 18), (160, 130, 15, 18)],
}



def trim(im):
    a = np.array(im.getchannel('A'))
    ys, xs = np.where(a > 8)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    x0 = max(0, x0 - PAD); y0 = max(0, y0 - PAD)
    x1 = min(im.width - 1, x1 + PAD); y1 = min(im.height - 1, y1 + PAD)
    return im.crop((x0, y0, x1 + 1, y1 + 1))


def find_eyes(im):
    """dark filled blobs (pupils) in the upper part of the sticker, returned as ellipses."""
    rgba = np.array(im).astype(np.int32)
    a = rgba[..., 3]
    lum = 0.299 * rgba[..., 0] + 0.587 * rgba[..., 1] + 0.114 * rgba[..., 2]
    dark = (lum < 70) & (a > 200)
    # remove thin outlines: opening with a disk
    r = 4
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    disk = (xx * xx + yy * yy) <= r * r
    core = ndimage.binary_opening(dark, structure=disk)
    lab, n = ndimage.label(core)
    H, W = a.shape
    cands = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        area = len(xs)
        if area < 60 or area > 4000:
            continue
        cy, cx = ys.mean(), xs.mean()
        if cy > H * 0.62:
            continue
        w = xs.max() - xs.min() + 1
        h = ys.max() - ys.min() + 1
        if w > W * 0.3 or h > H * 0.25:
            continue
        ar = w / h
        if ar < 0.35 or ar > 2.2:
            continue
        cands.append(dict(cx=float(cx), cy=float(cy), w=int(w), h=int(h), area=area,
                          x0=int(xs.min()), y0=int(ys.min()), x1=int(xs.max()), y1=int(ys.max())))
    # best horizontal pair with similar size and y
    best = None
    for i in range(len(cands)):
        for j in range(i + 1, len(cands)):
            p, q = cands[i], cands[j]
            dy = abs(p['cy'] - q['cy'])
            dx = abs(p['cx'] - q['cx'])
            size = max(p['area'], q['area']) / max(1, min(p['area'], q['area']))
            if dy > 0.08 * H or dx < 0.05 * W or dx > 0.45 * W or size > 2.6:
                continue
            score = (p['area'] + q['area']) - dy * 20 - size * 50 - p['cy'] * 0.5
            if best is None or score > best[0]:
                best = (score, p, q)
    if not best:
        return []
    eyes = []
    for e in sorted([best[1], best[2]], key=lambda e: e['cx']):
        # grow to include the white of the eye / highlight: dilate region box a little
        rx = e['w'] / 2 + 5
        ry = e['h'] / 2 + 5
        # lid colour: median of opaque, non-dark pixels in a band just above the eye
        y_top = int(max(0, e['y0'] - ry * 0.9)); y_bot = int(max(0, e['y0'] - 2))
        x_l = int(max(0, e['cx'] - rx)); x_r = int(min(W - 1, e['cx'] + rx))
        band = rgba[y_top:y_bot, x_l:x_r].reshape(-1, 4) if y_bot > y_top else np.zeros((0, 4))
        band = band[(band[:, 3] > 200)]
        if len(band):
            bl = 0.299 * band[:, 0] + 0.587 * band[:, 1] + 0.114 * band[:, 2]
            band = band[(bl > 90) & (bl < 250)]
        if len(band) < 10:
            col = None
        else:
            m = np.median(band[:, :3], axis=0)
            col = '#%02x%02x%02x' % tuple(int(v) for v in m)
        eyes.append(dict(x=round(e['cx'] / W, 4), y=round(e['cy'] / H, 4),
                         rx=round(rx / W, 4), ry=round(ry / H, 4), c=col))
    if any(e['c'] is None for e in eyes):
        return []
    return eyes



def refine_eye(rgba, cx, cy, rx, ry):
    """snap a hand-measured eye to the actual eye blob: pixels that differ from the surrounding skin."""
    H, W = rgba.shape[:2]
    # skin = most common opaque colour in a band just above the eye
    y0 = int(max(0, cy - ry - 16)); y1 = int(max(1, cy - ry - 5))
    x0 = int(max(0, cx - rx)); x1 = int(min(W, cx + rx))
    band = rgba[y0:y1, x0:x1].reshape(-1, 4)
    band = band[band[:, 3] > 200]
    if len(band) < 8:
        return None
    q = (band[:, :3] // 12).astype(np.int32)
    keys = q[:, 0] * 10000 + q[:, 1] * 100 + q[:, 2]
    vals, counts = np.unique(keys, return_counts=True)
    k = vals[counts.argmax()]
    skin = band[keys == k][:, :3].mean(axis=0)
    wx0 = int(max(0, cx - 1.8 * rx)); wx1 = int(min(W, cx + 1.8 * rx))
    wy0 = int(max(0, cy - 1.8 * ry)); wy1 = int(min(H, cy + 1.8 * ry))
    win = rgba[wy0:wy1, wx0:wx1].astype(np.int32)
    dist = np.sqrt(((win[..., :3] - skin) ** 2).sum(axis=-1))
    mask = (dist > 70) & (win[..., 3] > 200)
    lab, n = ndimage.label(mask)
    ly, lx = int(cy - wy0), int(cx - wx0)
    lid = lab[min(max(ly, 0), lab.shape[0] - 1), min(max(lx, 0), lab.shape[1] - 1)]
    if lid == 0:
        return None
    ys, xs = np.where(lab == lid)
    ex0, ex1, ey0, ey1 = xs.min() + wx0, xs.max() + wx0, ys.min() + wy0, ys.max() + wy0
    nrx, nry = (ex1 - ex0) / 2 + 2, (ey1 - ey0) / 2 + 2
    if not (0.6 * rx <= nrx <= 1.5 * rx and 0.6 * ry <= nry <= 1.5 * ry):
        return None
    col = '#%02x%02x%02x' % tuple(int(v) for v in skin)
    return ((ex0 + ex1) / 2, (ey0 + ey1) / 2, nrx, nry, col)



def ring_colour(rgba, cx, cy, rx, ry):
    """lid colour = most common opaque colour on a ring around the eye (skipping the brow sector above)."""
    H, W = rgba.shape[:2]
    pts = []
    for k in (1.25, 1.4, 1.55):
        for a in np.linspace(0, 2 * np.pi, 72, endpoint=False):
            if np.sin(a) < -0.5:      # skip the top sector (screen y up = negative sin)
                continue
            x = int(round(cx + k * rx * np.cos(a))); y = int(round(cy + k * ry * np.sin(a)))
            if 0 <= x < W and 0 <= y < H and rgba[y, x, 3] > 200:
                pts.append(rgba[y, x, :3])
    if len(pts) < 10:
        return None
    pts = np.array(pts)
    lum = 0.299 * pts[:, 0] + 0.587 * pts[:, 1] + 0.114 * pts[:, 2]
    keep = pts[lum > 45] if (lum > 45).sum() > 8 else pts
    q = (keep // 14).astype(np.int32)
    keys = q[:, 0] * 10000 + q[:, 1] * 100 + q[:, 2]
    vals, counts = np.unique(keys, return_counts=True)
    sel = keep[keys == vals[counts.argmax()]]
    return '#%02x%02x%02x' % tuple(int(v) for v in sel.mean(axis=0))


def head_box(im):
    """square around the head: top part of the alpha bbox."""
    a = np.array(im.getchannel('A')) > 8
    H, W = a.shape
    top = int(H * 0.5)
    ys, xs = np.where(a[:top])
    if len(xs) == 0:
        return (0, 0, W, W)
    x0, x1 = xs.min(), xs.max()
    cx = (x0 + x1) / 2
    s = int(min(max(x1 - x0, H * 0.34), H * 0.55, W))
    y0 = max(0, ys.min() - 4)
    x = int(max(0, min(W - s, cx - s / 2)))
    return (x, int(y0), x + s, int(y0) + s)


def main():
    os.makedirs(OUT, exist_ok=True); os.makedirs(THUMBS, exist_ok=True); os.makedirs(DEBUG, exist_ok=True)
    meta = {}
    names = sorted(f[:-4] for f in os.listdir(SRC) if f.lower().endswith('.png'))
    dbg_tiles = []
    for name in names:
        im = Image.open(os.path.join(SRC, name + '.png')).convert('RGBA')
        im = trim(im)
        if max(im.size) > MAXS:
            k = MAXS / max(im.size)
            im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        # keep the palette look of the originals: quantize to 256 colours with alpha
        out = im.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.NONE)
        out.save(os.path.join(OUT, name + '.png'), optimize=True)
        hb = head_box(im)
        th = im.crop(hb).resize((THUMB, THUMB), Image.LANCZOS)
        th.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.NONE).save(os.path.join(THUMBS, name + '.png'), optimize=True)
        eyes = []
        if name not in NO_BLINK and name in EYES_MANUAL:
            rgba = np.array(im).astype(np.int32)
            for (cx, cy, rx, ry) in EYES_MANUAL[name]:
                r = refine_eye(rgba, cx, cy, rx, ry)
                if r is None:
                    # keep the hand measurement; colour from a band above
                    y0 = int(max(0, cy - ry - 14)); y1 = int(max(1, cy - ry - 5))
                    band = rgba[y0:y1, int(cx - rx):int(cx + rx)].reshape(-1, 4)
                    band = band[band[:, 3] > 200]
                    m = np.median(band[:, :3], axis=0) if len(band) else np.array([200, 160, 140])
                    r = (cx, cy, rx + 3, ry + 3, '#%02x%02x%02x' % tuple(int(v) for v in m))
                    tag = 'manual'
                else:
                    tag = 'snap'
                ex, ey, erx, ery, col = r
                rc = ring_colour(rgba, ex, ey, erx, ery)
                if rc:
                    col = rc
                if name in LID_OVERRIDE:
                    col = LID_OVERRIDE[name][len(eyes)]
                eyes.append(dict(x=round(ex / im.width, 4), y=round(ey / im.height, 4),
                                 rx=round(erx / im.width, 4), ry=round(ery / im.height, 4), c=col, t=tag))
        meta[name] = dict(w=im.width, h=im.height, eyes=eyes)
        # debug tile with eye ellipses
        dbg = Image.new('RGBA', im.size, (225, 225, 225, 255)); dbg.alpha_composite(im)
        from PIL import ImageDraw
        d = ImageDraw.Draw(dbg)
        closed = dbg.copy(); dc = ImageDraw.Draw(closed)
        for e in eyes:
            cx, cy, rx, ry = e['x'] * im.width, e['y'] * im.height, e['rx'] * im.width, e['ry'] * im.height
            d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=(255, 0, 0, 255), width=1)
            c = tuple(int(e['c'][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
            dc.ellipse((cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1), fill=c)
            dc.arc((cx - rx * 0.95, cy - ry * 0.7, cx + rx * 0.95, cy + ry * 0.55), 20, 160, fill=(43, 33, 24, 255), width=4)
        if eyes:
            both = Image.new('RGBA', (dbg.width * 2 + 4, dbg.height), (255, 255, 255, 255))
            both.paste(dbg, (0, 0)); both.paste(closed, (dbg.width + 4, 0))
            dbg = both
        d.rectangle(hb, outline=(0, 120, 255, 255), width=2)
        d.text((4, 4), name, fill=(0, 0, 0, 255))
        if eyes:
            ys_ = [e['y'] * im.height for e in eyes]
            cyc = int(sum(ys_) / len(ys_))
            dbg = dbg.crop((0, max(0, cyc - 70), dbg.width, min(im.height, cyc + 50)))
        dbg.thumbnail((560, 200))
        dbg_tiles.append(dbg)
    with open(os.path.join(OUT, 'meta.json'), 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, separators=(',', ':'))
    # debug contact sheet
    cols = 3
    rows = (len(dbg_tiles) + cols - 1) // cols
    dbg_tiles = [t for t in dbg_tiles if t.width > 300]
    rows = (len(dbg_tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * 560, rows * 200), (255, 255, 255))
    for i, t in enumerate(dbg_tiles):
        sheet.paste(t.convert('RGB'), ((i % cols) * 560, (i // cols) * 200))
    sheet.save(os.path.join(DEBUG, 'chars_eyes.jpg'), quality=85)
    total = sum(os.path.getsize(os.path.join(OUT, n + '.png')) for n in names)
    print('imported', len(names), 'chars, total bytes', total)
    print('with eyes:', sum(1 for m in meta.values() if m['eyes']), '/', len(meta))
    print('no eyes:', [n for n, m in meta.items() if not m['eyes']])


if __name__ == '__main__':
    main()
