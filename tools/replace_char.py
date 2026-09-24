# -*- coding: utf-8 -*-
"""IP safety valve - replace one character sticker, or switch a whole world off (and back on).

  python tools/replace_char.py list
  python tools/replace_char.py replace <char_id> <new_sticker.png>   # e.g. replace spiderman my_hero.png
  python tools/replace_char.py takedown <world>                      # peppa bluey huluwa paw xiyou avengers
  python tools/replace_char.py restore <world>

replace : the original goes to incoming/replaced/, the new picture is imported with the same rules as all characters
          (trim transparent margins, scale, head thumbnail - never redrawn); it does not blink (eyes unknown);
          META in index.html and the service-worker list are regenerated.
takedown: the world disappears from the map and the finale (TAKEDOWN list in index.html), its character pictures are
          moved out of assets/ (to incoming/takedown/<world>/) so they are no longer served; restore undoes it.
After any command: run the tests (tests/test_flow.py, tests/test_layout.py), commit and push (see docs/DEPLOY.md).
"""
import os, sys, json, re, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'index.html')
SRC = os.path.join(ROOT, 'incoming', 'chars_orig')
WORLD_CHARS = {
    'peppa': ['peppa', 'george', 'daddy_pig', 'mummy_pig'],
    'bluey': ['bluey', 'bingo', 'bandit', 'chilli'],
    'huluwa': ['gourd1', 'gourd2', 'gourd3', 'gourd4', 'gourd5', 'gourd6', 'gourd7', 'grandpa', 'snake', 'scorpion'],
    'paw': ['ryder', 'chase', 'marshall', 'skye', 'rocky', 'zuma', 'rubble'],
    'xiyou': ['wukong', 'bajie', 'shaseng', 'tangseng', 'dragon_horse'],
    'avengers': ['ironman', 'captain', 'thor', 'hulk', 'widow', 'hawkeye', 'spiderman', 'miles', 'panther'],
}


def read():
    return open(HTML, encoding='utf-8').read()


def write(s):
    open(HTML, 'w', encoding='utf-8', newline='\n').write(s)


def takedown_list(s):
    m = re.search(r'const TAKEDOWN = (\[[^\]]*\]);', s)
    return json.loads(m.group(1).replace("'", '"'))


def set_takedown(s, lst):
    return re.sub(r'const TAKEDOWN = \[[^\]]*\];', 'const TAKEDOWN = ' + json.dumps(lst) + ';', s)


def rebuild_meta(no_blink=()):
    subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'import_chars.py')])
    meta = json.load(open(os.path.join(ROOT, 'assets', 'chars', 'meta.json'), encoding='utf-8'))
    compact = {}
    for k in sorted(meta):
        m = meta[k]
        eyes = [] if k in no_blink else [[e['x'], e['y'], e['rx'], e['ry'], e['c']] for e in m['eyes']]
        compact[k] = [m['w'], m['h'], eyes]
    s = read()
    s = re.sub(r'const META = \{.*?\};\n', lambda _: 'const META = ' + json.dumps(compact, separators=(',', ':')) + ';\n', s, count=1, flags=re.S)
    write(s)


def sw_list():
    subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools', 'gen_sw_list.py')])


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ('list', 'replace', 'takedown', 'restore'):
        print(__doc__); sys.exit(1)
    cmd = sys.argv[1]
    s = read()
    if cmd == 'list':
        td = takedown_list(s)
        for w, cs in WORLD_CHARS.items():
            print('%-9s %-9s %s' % (w, 'OFF' if w in td else 'on', ' '.join(cs)))
        return
    if cmd == 'replace':
        cid, new = sys.argv[2], sys.argv[3]
        if not any(cid in cs for cs in WORLD_CHARS.values()):
            sys.exit('unknown character id ' + cid)
        os.makedirs(os.path.join(ROOT, 'incoming', 'replaced'), exist_ok=True)
        orig = os.path.join(SRC, cid + '.png')
        keep = os.path.join(ROOT, 'incoming', 'replaced', cid + '.png')
        if os.path.exists(orig) and not os.path.exists(keep):
            shutil.copy2(orig, keep)
        shutil.copy2(new, orig)
        replaced = sorted(f[:-4] for f in os.listdir(os.path.join(ROOT, 'incoming', 'replaced')) if f.endswith('.png'))
        rebuild_meta(no_blink=replaced)
        sw_list()
        print('replaced', cid, '- original kept in incoming/replaced/')
        return
    w = sys.argv[2]
    if w not in WORLD_CHARS:
        sys.exit('unknown world ' + w)
    td = takedown_list(s)
    park = os.path.join(ROOT, 'incoming', 'takedown', w)
    if cmd == 'takedown':
        if w not in td:
            td.append(w)
        os.makedirs(park, exist_ok=True)
        for c in WORLD_CHARS[w]:
            for sub in ('chars', 'thumbs'):
                f = os.path.join(ROOT, 'assets', sub, c + '.png')
                if os.path.exists(f):
                    os.makedirs(os.path.join(park, sub), exist_ok=True)
                    shutil.move(f, os.path.join(park, sub, c + '.png'))
        write(set_takedown(read(), td))
        sw_list()
        print('world', w, 'switched off; pictures parked in', park)
    else:
        td = [x for x in td if x != w]
        for sub in ('chars', 'thumbs'):
            d = os.path.join(park, sub)
            if os.path.isdir(d):
                for f in os.listdir(d):
                    shutil.move(os.path.join(d, f), os.path.join(ROOT, 'assets', sub, f))
        write(set_takedown(read(), td))
        sw_list()
        print('world', w, 'restored')


if __name__ == '__main__':
    main()
