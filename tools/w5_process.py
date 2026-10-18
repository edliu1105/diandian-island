# -*- coding: utf-8 -*-
"""Process the 积木城 pictures of tools/w5_batches.py (only those): props / islands -> cut out -> matte -> assets/props|isl;
backgrounds -> assets/bg (1280, JPEG q80) + assets/bgthumb (160); the block-town map -> assets/bg/map_blocks.jpg (no thumb);
a contact sheet of everything -> raw/w5_sheet.png (looked at by eye: a background must not show what its game asks about,
no character may be drawn). A picture redone as raw/<dir>/<id>_v2.png (or _v3) wins.
After this: git add the new files, then python raw/js/build_w5.py (it switches every game / island to its new picture when
the file is there) and python tools/gen_sw_list.py.   usage: python tools/w5_process.py [ids...]"""
import os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import optimize
from cutout import cutout
from w5_batches import W5
from w2fresh_process import on_white

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')


def main(only=None):
    tiles = []
    for aid, kind, world, subject in W5:
        if only and aid not in only:
            continue
        sub = {'bg': 'bg', 'island': 'islands'}.get(kind, 'props')
        src = os.path.join(ROOT, 'raw', sub, aid + '.png')
        for v in ('_v3', '_v2'):
            if os.path.exists(src[:-4] + v + '.png'):
                src = src[:-4] + v + '.png'; break
        if not os.path.exists(src):
            print('MISSING', aid); continue
        if kind == 'bg':
            im = Image.open(src).convert('RGB').resize((1280, 1280), Image.LANCZOS)
            short = aid[3:]
            im.save(os.path.join(A, 'bg', short + '.jpg'), quality=80, optimize=True, progressive=True)
            if short != 'map_blocks':
                im.resize((160, 160), Image.LANCZOS).save(os.path.join(A, 'bgthumb', short + '.jpg'), quality=55, optimize=True)
            print(short, os.path.getsize(os.path.join(A, 'bg', short + '.jpg')) // 1024, 'KB')
            tiles.append((short, im.resize((256, 256))))
            continue
        cut = os.path.join(ROOT, 'raw', 'cut', aid + '.png')
        os.makedirs(os.path.dirname(cut), exist_ok=True)
        cutout(on_white(src), cut)
        im = Image.open(cut).convert('RGBA')
        if kind == 'island':
            out = os.path.join(A, 'isl', aid[4:] + '.png')
            print(aid, optimize.save_png(im, out, 512))
        else:
            short = aid[5:]
            im = optimize.matte(im, 0.12 if world in optimize.FLAT_WORLDS else 0.4)
            out = os.path.join(A, 'props', short + '.png')
            print(short, optimize.save_png(im, out, 400))
        t = Image.new('RGBA', (256, 256), (200, 230, 255, 255)); s = Image.open(out).convert('RGBA'); s.thumbnail((240, 240)); t.alpha_composite(s, ((256 - s.width) // 2, (256 - s.height) // 2))
        tiles.append((aid, t.convert('RGB')))
    if tiles:
        cols = 8; rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * 260, rows * 280), (255, 255, 255)); d = ImageDraw.Draw(sheet)
        for i, (n, t) in enumerate(tiles):
            x, y = (i % cols) * 260, (i // cols) * 280
            sheet.paste(t, (x + 2, y + 2)); d.text((x + 4, y + 262), n, fill=(0, 0, 0))
        sheet.save(os.path.join(ROOT, 'raw', 'w5_sheet.png'))
        print('sheet', len(tiles))


if __name__ == '__main__':
    main(set(sys.argv[1:]) or None)
