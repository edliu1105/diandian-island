# -*- coding: utf-8 -*-
"""Asset sheets of the props (for reviewers; not used by the app).

docs/assets_sheets/A2_props.jpg        every prop with its file name
docs/assets_sheets/A5_props_matte.jpg  before / after of the props changed since a git revision (default HEAD):
                                       left = before, right = now
usage: python tools/props_sheet.py [--since <rev>]
"""
import os, sys, glob, subprocess, io
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'assets_sheets')
BG = (250, 246, 238)
INK = (43, 33, 24)


def font(sz):
    for f in ('C:/Windows/Fonts/arial.ttf', '/System/Library/Fonts/Helvetica.ttc', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except Exception:
            pass
    return ImageFont.load_default()


def cell(im, s):
    im = im.convert('RGBA'); im.thumbnail((s - 8, s - 8), Image.LANCZOS)
    c = Image.new('RGB', (s, s), (255, 255, 255))
    c.paste(im, ((s - im.width) // 2, (s - im.height) // 2), im)
    ImageDraw.Draw(c).rectangle((0, 0, s - 1, s - 1), outline=(60, 60, 60))
    return c


def all_props():
    files = sorted(glob.glob(os.path.join(ROOT, 'assets', 'props', '*.png')))
    s, cols, lab = 150, 10, 34
    rows = (len(files) + cols - 1) // cols
    S = Image.new('RGB', (cols * (s + 12) + 12, rows * (s + lab) + 12), BG)
    d = ImageDraw.Draw(S); f = font(17)
    for i, p in enumerate(files):
        r, c = divmod(i, cols)
        x, y = 12 + c * (s + 12), 12 + r * (s + lab)
        S.paste(cell(Image.open(p), s), (x, y))
        d.text((x + 2, y + s + 6), os.path.basename(p), fill=INK, font=f)
    S.save(os.path.join(OUT, 'A2_props.jpg'), quality=86)
    print('A2_props.jpg', len(files))


def before_after(rev):
    out = subprocess.run(['git', 'diff', '--name-only', rev, '--', 'assets/props'], cwd=ROOT, capture_output=True, text=True).stdout.split()
    if not out:
        print('no prop changed since', rev)
        return
    s, cols, lab = 150, 4, 34
    rows = (len(out) + cols - 1) // cols
    S = Image.new('RGB', (cols * (2 * s + 30) + 12, rows * (s + lab) + 12), BG)
    d = ImageDraw.Draw(S); f = font(17)
    for i, rel in enumerate(sorted(out)):
        old = Image.open(io.BytesIO(subprocess.run(['git', 'show', rev + ':' + rel], cwd=ROOT, capture_output=True).stdout))
        new = Image.open(os.path.join(ROOT, rel))
        r, c = divmod(i, cols)
        x, y = 12 + c * (2 * s + 30), 12 + r * (s + lab)
        S.paste(cell(old, s), (x, y)); S.paste(cell(new, s), (x + s + 4, y))
        d.text((x + 2, y + s + 6), os.path.basename(rel) + '  before | after', fill=INK, font=f)
    S.save(os.path.join(OUT, 'A5_props_matte.jpg'), quality=84)
    print('A5_props_matte.jpg', len(out))


if __name__ == '__main__':
    all_props()
    before_after(sys.argv[sys.argv.index('--since') + 1] if '--since' in sys.argv else 'HEAD')
