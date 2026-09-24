# -*- coding: utf-8 -*-
"""Write Codex ImageGen batch instruction files (2-3 images each) from assets_manifest.

usage: python tools/gen_batches.py [--only id1,id2] [--suffix v2] [--note "extra instruction"]
Outputs batches/<batch>.md and batches/index.tsv  (batch \t refs \t targets)
"""
import os, sys, argparse
sys.path.insert(0, os.path.dirname(__file__))
from assets_manifest import ASSETS, PROP_STYLE, BG_STYLE, REFS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BATCH_DIR = os.path.join(ROOT, 'batches')

HEADER = """You are an asset-generation worker for a toddler math picture-book app.
Use the built-in image_gen tool (imagegen skill, default built-in mode). For EACH image below make ONE separate image_gen call (never use n>1), square 1024x1024.
After each generation, copy the generated PNG from $CODEX_HOME/generated_images/... to the exact target path in this workspace (create the folder if needed; overwrite if it exists).
Do not modify any other files, do not write code, do not create extra images.

The attached images are STYLE REFERENCES ONLY (official character stickers of the same app). Match their line weight, dark outline, soft cel shading, saturation and overall picture-book look, so the new picture looks drawn by the same artist.
NEVER draw those characters, and never draw any people or characters unless the prompt explicitly asks for an animal object.
"""

FOOTER = """
When all images are saved, print exactly one line per image: SAVED <target path>
"""


def prompt_for(kind, subject):
    if kind == 'bg':
        return subject + ', ' + BG_STYLE
    if kind == 'icon':
        return subject + ', cute chibi 2D cartoon picture-book style, bold clean dark outlines, flat vibrant saturated colors with soft cel shading, full-bleed square app icon artwork, no text, no letters, no watermark, no border'
    return subject + ', ' + PROP_STYLE


def target_for(aid, kind, suffix=''):
    sub = {'bg': 'bg', 'island': 'islands', 'icon': 'icon'}.get(kind, 'props')
    return 'raw/%s/%s%s.png' % (sub, aid, ('_' + suffix) if suffix else '')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--suffix', default='')
    ap.add_argument('--note', default='')
    ap.add_argument('--per', type=int, default=3)
    a = ap.parse_args()
    only = set(x for x in a.only.split(',') if x)
    items = [x for x in ASSETS if (not only or x[0] in only)]
    # group by (world, kind-class) so each batch shares style refs
    groups = {}
    for aid, kind, world, subject in items:
        key = (world, 'bg' if kind == 'bg' else 'obj')
        groups.setdefault(key, []).append((aid, kind, world, subject))
    os.makedirs(BATCH_DIR, exist_ok=True)
    idx_lines = []
    n = 0
    for (world, cls), lst in groups.items():
        for i in range(0, len(lst), a.per):
            chunk = lst[i:i + a.per]
            n += 1
            bid = '%s_%s_%02d%s' % (world, cls, i // a.per + 1, ('_' + a.suffix) if a.suffix else '')
            body = [HEADER]
            if a.note:
                body.append('EXTRA NOTE: ' + a.note + '\n')
            targets = []
            for k, (aid, kind, w, subject) in enumerate(chunk, 1):
                t = target_for(aid, kind, a.suffix)
                targets.append(t)
                body.append('Image %d\nTarget path: %s\nPrompt: %s\n' % (k, t, prompt_for(kind, subject)))
            body.append(FOOTER)
            with open(os.path.join(BATCH_DIR, bid + '.md'), 'w', encoding='utf-8') as f:
                f.write('\n'.join(body))
            refs = ['incoming/chars_orig/' + r for r in REFS[world]]
            idx_lines.append('%s\t%s\t%s' % (bid, ','.join(refs), ','.join(targets)))
    with open(os.path.join(BATCH_DIR, 'index%s.tsv' % (('_' + a.suffix) if a.suffix else '')), 'w', encoding='utf-8') as f:
        f.write('\n'.join(idx_lines) + '\n')
    print('batches:', n, 'images:', len(items))


if __name__ == '__main__':
    main()
