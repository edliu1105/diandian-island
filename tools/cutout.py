# -*- coding: utf-8 -*-
"""White-background -> transparent cutout for generated props/islands.

1. flood-fill the near-white background from the image border (only border-connected white is removed,
   so white areas inside the sticker - eyes, plates, clouds - survive)
2. dehalo: boundary pixels are un-blended against white (alpha from lightness, colour pushed to the ink)
3. auto-crop to the alpha bbox + margin
usage: python tools/cutout.py <in.png> <out.png>   |   python tools/cutout.py --all
"""
import os, sys, glob
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WHITE_T = 232      # min channel value to count as background white
MARGIN = 6
# props whose enclosed gaps (handle loops, fence interiors, bench gaps) show pure background white
HOLES = {'prop_bench', 'prop_pen', 'prop_rescuebasket', 'prop_basket', 'prop_kitten', 'prop_helicopter', 'prop_firetruck'}


def cutout(src, dst):
    raw = Image.open(src)
    if raw.mode == 'RGBA':
        al0 = np.array(raw.getchannel('A'))
        if (al0 < 10).mean() > 0.05:
            # the generator already returned a transparent background: keep its alpha, just trim
            img = raw.copy()
            ys, xs = np.where(al0 > 10)
            H, W = al0.shape
            x0, x1 = max(0, xs.min() - MARGIN), min(W, xs.max() + 1 + MARGIN)
            y0, y1 = max(0, ys.min() - MARGIN), min(H, ys.max() + 1 + MARGIN)
            img = img.crop((x0, y0, x1, y1))
            px = img.load()
            for (x, y) in ((0, 0), (img.width - 1, 0), (0, img.height - 1), (img.width - 1, img.height - 1)):
                r, g, b, _ = px[x, y]; px[x, y] = (r, g, b, 0)
            img.save(dst)
            return img.size
        r, g, b, _ = raw.split()
        im = Image.merge('RGB', (r, g, b))
    else:
        im = raw.convert('RGB')
    a = np.array(im).astype(np.int32)
    H, W = a.shape[:2]
    mn = a.min(axis=2)
    spread = a.max(axis=2) - mn
    near_white = (mn >= WHITE_T) & (spread <= 18)
    lab, n = ndimage.label(near_white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    if os.path.basename(src)[:-4] in HOLES:
        pure = (mn >= 248) & (spread <= 6)
        for i in range(1, n + 1):
            if i in border:
                continue
            comp = lab == i
            area = comp.sum()
            if area > 300 and (pure & comp).sum() > 0.85 * area:
                bg |= comp
    # close tiny holes in bg along edges (jpeg-ish noise)
    bg = ndimage.binary_opening(bg, iterations=1) | (bg & ~ndimage.binary_erosion(bg, iterations=1))
    fg = ~bg
    alpha = np.where(fg, 255, 0).astype(np.float32)
    # dehalo band: foreground pixels within 2px of background
    near_bg = ndimage.binary_dilation(bg, iterations=2) & fg
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2])
    ink = 30.0
    est = np.clip((255.0 - lum) / (255.0 - ink), 0, 1)
    # only un-blend light-ish edge pixels (real dark outline stays opaque)
    band = near_bg & (lum > 110)
    alpha[band] = np.clip(est[band] * 255.0 * 1.15, 0, 255)
    rgb = a.astype(np.float32)
    # decontaminate colour of semi-transparent edge pixels: c = al*C + (1-al)*255  ->  C = (c - (1-al)*255)/al
    al = np.clip(alpha / 255.0, 1e-3, 1)[..., None]
    fix = band[..., None]
    rgb = np.where(fix, np.clip((rgb - (1 - al) * 255.0) / al, 0, 255), rgb)
    # 1px feather on the outer edge
    alpha = ndimage.uniform_filter(alpha, size=2) * 0.5 + alpha * 0.5
    alpha[bg & ~ndimage.binary_dilation(fg, iterations=1)] = 0
    out = np.dstack([rgb, alpha]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA')
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0:
        raise SystemExit('empty cutout: ' + src)
    x0, x1 = max(0, xs.min() - MARGIN), min(W, xs.max() + 1 + MARGIN)
    y0, y1 = max(0, ys.min() - MARGIN), min(H, ys.max() + 1 + MARGIN)
    img = img.crop((x0, y0, x1, y1))
    # guarantee transparent corners
    px = img.load()
    for (x, y) in ((0, 0), (img.width - 1, 0), (0, img.height - 1), (img.width - 1, img.height - 1)):
        r, g, b, _ = px[x, y]; px[x, y] = (r, g, b, 0)
    img.save(dst)
    return img.size


def main():
    if len(sys.argv) == 3:
        print(cutout(sys.argv[1], sys.argv[2]))
        return
    os.makedirs(os.path.join(ROOT, 'raw', 'cut'), exist_ok=True)
    srcs = sorted(glob.glob(os.path.join(ROOT, 'raw', 'props', '*.png')) + glob.glob(os.path.join(ROOT, 'raw', 'islands', '*.png')))
    for s in srcs:
        name = os.path.basename(s)
        if name.endswith('_v1.png'):
            continue
        d = os.path.join(ROOT, 'raw', 'cut', name)
        print(name, cutout(s, d))


if __name__ == '__main__':
    main()
