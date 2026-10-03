# -*- coding: utf-8 -*-
"""Scenes that came back from the generator with transparent edges (it cut them out like a sticker; the paint under the
transparent pixels is junk): the junk is replaced by the surrounding paint (normalised convolution, coarse to fine).
usage: python tools/bgfill.py raw/bg/bg_x.png [...]   -> raw/bg/bg_x_v2.png (optimize / w2fresh_process prefer _v2)"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage


def blur(x, r):
    if x.ndim == 3:
        return np.dstack([blur(x[..., i], r) for i in range(x.shape[-1])])
    return ndimage.gaussian_filter(x, r / 2.0, mode='nearest')


def fill(path):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    good = (al > 0.85).astype(np.float32)
    out = rgb.copy()
    for r in (4, 10, 24, 60, 140):
        num = blur(rgb * good[..., None], r); den = blur(good, r)[..., None]
        est = num / np.maximum(den, 1e-4)
        miss = (good < 0.5) & (den[..., 0] > 0.02)
        out[miss] = est[miss]
        good = np.maximum(good, miss.astype(np.float32))
        rgb = out
    w = np.clip((al - 0.6) / 0.35, 0, 1)[..., None]      # half-transparent junk is junk too
    res = a[..., :3] * w + out * (1 - w)
    dst = path[:-4] + '_v2.png'
    Image.fromarray((np.clip(res, 0, 1) * 255).astype(np.uint8), 'RGB').save(dst)
    return dst


if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(fill(p))
