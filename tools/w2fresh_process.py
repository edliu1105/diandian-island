# -*- coding: utf-8 -*-
"""Process the world-2 pictures of tools/w2fresh_batches.py (only those; the first world's files are not touched):
props / islands -> cut out (a transparent generator background is first laid on white) -> matte -> assets/props|isl;
colour families (umbrella, energy) by hue like the boots; backgrounds -> assets/bg (1280) + assets/bgthumb (160)."""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import optimize
from cutout import cutout
from w2fresh_batches import W2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
BIG = {'schoolbag', 'bamboobasket'}
FAMILIES = {'umbrella': (('umbrella_blue', 0.60, 1.0, 1.0), ('umbrella_yellow', 0.13, 1.0, 1.3)),
            'energy': (('energy_blue', 0.58, 1.0, 1.05), ('energy_green', 0.33, 0.95, 1.0))}


def on_white(src):
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        if min(im.getpixel((2, 2))[3], im.getpixel((im.width - 3, im.height - 3))[3]) < 128:   # transparent background
            w = Image.new('RGBA', im.size, (255, 255, 255, 255)); w.alpha_composite(im); im = w
            fixed = src[:-4] + '_white.png'; im.convert('RGB').save(fixed); return fixed
    return src


def main(only=None):
    for aid, kind, world, subject in W2:
        if only and aid not in only:
            continue
        sub = {'bg': 'bg', 'island': 'islands'}.get(kind, 'props')
        src = os.path.join(ROOT, 'raw', sub, aid + '.png')
        for v in ('_v3', '_v2'):                    # a regenerated (_v3) or repaired (_v2, tools/bgfill.py) version wins
            if os.path.exists(src[:-4] + v + '.png'):
                src = src[:-4] + v + '.png'; break
        if not os.path.exists(src):
            print('MISSING', aid); continue
        if kind == 'bg':
            im = Image.open(src).convert('RGB').resize((1280, 1280), Image.LANCZOS)
            short = aid[3:]
            im.save(os.path.join(A, 'bg', short + '.jpg'), quality=80, optimize=True, progressive=True)
            im.resize((160, 160), Image.LANCZOS).save(os.path.join(A, 'bgthumb', short + '.jpg'), quality=55, optimize=True)
            print(short, os.path.getsize(os.path.join(A, 'bg', short + '.jpg')) // 1024, 'KB')
            continue
        cut = os.path.join(ROOT, 'raw', 'cut', aid + '.png')
        cutout(on_white(src), cut)
        im = Image.open(cut).convert('RGBA')
        if kind == 'island':
            print(aid, optimize.save_png(im, os.path.join(A, 'isl', aid[4:] + '.png'), 512))
            continue
        short = aid[5:]
        im = optimize.matte(im, 0.12 if world in optimize.FLAT_WORLDS else 0.4)
        print(short, optimize.save_png(im, os.path.join(A, 'props', short + '.png'), 512 if short in BIG else 400))
        for name, hue, sm, vm in FAMILIES.get(short, ()):
            base = im.copy(); base.thumbnail((400, 400), Image.LANCZOS)
            print(name, optimize.save_png(optimize.hue_variant(base, hue, sm, vm), os.path.join(A, 'props', name + '.png'), 400))


if __name__ == '__main__':
    main(set(sys.argv[1:]) or None)
