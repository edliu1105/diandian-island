# -*- coding: utf-8 -*-
"""点点岛 v2 (docs/PLAN-v2.md): the Transformers arithmetic island at the start of the sky - its floating island and the
backgrounds of its four games. Same pipeline and style rules as tools/w3_batches.py.
usage: python tools/v2_batches.py  ->  batches/v2_*.md + batches/index_v2.tsv"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from gen_batches import HEADER, FOOTER, prompt_for, target_for, BATCH_DIR
from w3_batches import OPAQUE, SKY

V2 = [
    ('isl_trans3', 'island', SKY + 'a small futuristic robot base made of red, blue and silver metal platforms, a round tower holding a big glowing blue energy cube crystal on top, a little ramp and a landing pad, no logos'),
    ('bg_trans_vault', 'bg', 'inside a friendly robot base energy vault high in the clouds: a big round metal vault door far at the back, glowing blue light strips on red and silver walls, a big window with blue sky and clouds at the far right, plain smooth light grey floor in the whole lower half, no cubes, no robots'),
    ('bg_trans_hangar', 'bg', 'a bright robot assembly hangar: tall yellow crane arms at the far sides, big windows with blue sky and fluffy clouds at the back, red and blue metal walls, plain smooth light floor in the whole lower half, no robots'),
    ('bg_trans_dock', 'bg', 'a cargo loading dock on a cloud base: a big open cargo bay door far at the back showing blue sky, yellow and black safety stripes along the far edges, plain flat light concrete floor in the whole lower half, no boxes, no trucks'),
    ('bg_trans_control', 'bg', 'a robot base control room: big round blank screens glowing soft blue at the back wall (no writing), control panels with colorful buttons at the far sides, plain smooth floor in the whole lower half, no robots'),
]


def main():
    idx = []
    for i in range(0, len(V2), 3):
        chunk = V2[i:i + 3]
        bid = 'v2_%02d' % (i // 3 + 1)
        body = [HEADER, OPAQUE.replace('this is a', 'the backgrounds are') if any(k == 'bg' for _, k, _ in chunk) else '']
        if any(k == 'island' for _, k, _ in chunk):
            body.append('EXTRA NOTE: the island also has two island pictures of the same app attached (raw island art): match their look and their round floating cloud shape.\n')
        targets = []
        for k, (aid, kind, subject) in enumerate(chunk, 1):
            t = target_for(aid, kind); targets.append(t)
            body.append('Image %d\nTarget path: %s\nPrompt: %s\n' % (k, t, prompt_for(kind, subject)))
        body.append(FOOTER)
        open(os.path.join(BATCH_DIR, bid + '.md'), 'w', encoding='utf-8').write('\n'.join(body))
        refs = ['incoming/chars_orig/ironman.png', 'incoming/chars_orig/hulk.png']
        if any(k == 'island' for _, k, _ in chunk): refs += ['assets/isl/avengers3.png', 'assets/isl/peppa3.png']
        idx.append('%s\t%s\t%s' % (bid, ','.join(refs), ','.join(targets)))
    open(os.path.join(BATCH_DIR, 'index_v2.tsv'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')
    print('batches', len(idx), 'images', len(V2))


if __name__ == '__main__':
    main()
