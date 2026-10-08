# -*- coding: utf-8 -*-
"""Split raw/js/v2.js (one source) for the first-screen budget (tests/test_boot.py: <= 450 KB):
 - raw/js/v2core.js (inlined into index.html by v2_patch.py): the island's place, memory, the migration, the probe, the
   gems' state, and stand-ins for the planner / the map's corner / the 15-minute ritual (they do nothing until the rest
   arrives, a second after the entry tap);
 - assets/js/v2games.js (loaded with the sky's games by W3.load): the question types, the planner, the arithmetic
   island's games, the gem screens, the map's corner, the report, the monthly test, the parent tools.
usage: python raw/js/v2_split.py"""
import io, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
s = io.open(os.path.join(ROOT, 'raw', 'js', 'v2.js'), encoding='utf-8').read()
H = '/* ---------------------------------------------------------------- '
cut = lambda name: s.index(H + name)
a_draw, a_plan, a_games, a_gems, a_map, a_mig, a_rep, a_month = (cut('drawing helpers'), cut('the planner'), cut('the four games'), cut('the daily key'),
                                                                   cut('the map: the gem chest'), cut('once, for every save'), cut('the report for Opus'), cut('the monthly test'))
end = s.index('/*@@V2END@@*/')


def block(src, name):
    """the text of `const name = { ... };` (to the first line that is exactly '};')"""
    i = src.index('const ' + name + ' = {'); j = src.index('\n};\n', i) + 4
    return i, j


def to_assign(src, name):
    i, j = block(src, name)
    b = src[i:j]
    return src[:i] + b.replace('const ' + name + ' = {', 'Object.assign(' + name + ', {', 1)[:-3] + '});\n' + src[j:]


plan = s[a_plan:a_games]
helped = [ln for ln in plan.split('\n') if ln.startswith('const helped')][0]
plan = to_assign(plan.replace(helped + '\n', ''), 'V2D')
gems = s[a_gems:a_map]
i, j = block(gems, 'Gems')
methods = gems[i:j]
keep = []                                            # only the screens go to the lazy file; the state stays in the page
for m in re.finditer(r'\n  (gemSvg|reveal|album)\(.*?(?=\n  [a-zA-Z]+\(|\n};)', methods, re.S):
    keep.append(m.group(0))
gems = gems[:i] + 'Object.assign(Gems, {' + ''.join(keep) + '\n});\n' + gems[j:]
mapsec = to_assign(to_assign(s[a_map:a_mig], 'MapV2'), 'StopGo')
report = s[a_rep:a_month]
probe = [ln for ln in report.split('\n') if ln.startswith('const Probe')][0]
report = report.replace(probe + '\n', '')
lazy = s[a_draw:a_plan] + plan + s[a_games:a_gems] + gems + mapsec + report + s[a_month:end]
core = s[:a_draw] + helped + '\n' + '''/* stand-ins until assets/js/v2games.js arrives (a second after the entry tap): no review card, no corner, no ritual */
const V2D = { plan: () => ({ pos: [] }), slot: () => null, remember() {}, starTo: () => 'game', quit() {} };
const MapV2 = { update() {}, hello() {} };
const StopGo = { maybe: () => false };
/* the gems' state (keys, flags and extra review stars turn gems even before the screens are in) */
const Gems = {
  avail() { return Store.s.key.day !== DAY(); },
  island() { const all = ORDER.concat(ORDER2, ORDER3).filter(w => Store.w(w).unlocked && GAMES[WORLDS[w].games[0]]); return all.slice(-1)[0] || 'peppa'; },
  start() {
    const due = Mem.due(), n = Math.min(Store.s.key.short ? 3 : 5, due.length), gap = Store.s.lastDay ? DAY() - Store.s.lastDay : 0;
    if (!n || gap > 7) { this.grant('free'); return; }
    const isl = this.island(), g = WORLDS[isl].games[0];
    Mem.today().keyGo++; Store.save();
    W3.load().then(() => Session.start(isl, g, { key: true, keyItems: due.slice(0, n), noDemo: true }));
  },
  grant(why) { const k = Store.s.key; k.day = DAY(); k.got = (k.got || 0) + 1; Store.save(); this.turn(why || 'key'); },
  turn(src) { const a = Store.s.gems; if (a.n >= 360) return; a.n++; a.src.push(src); Store.save(); if (!fast() && this.reveal) this.reveal(a.n); },
  album() {},
};
''' + s[a_mig:a_rep] + probe + '\n'
# the first screen's budget (tests/test_boot.py, 450 KB): the inlined copy goes without comments (raw/js/v2.js keeps them)
core = re.sub(r'/\*(?!@@)[\s\S]*?\*/', '', core); core = re.sub(r'[ \t]+\n', '\n', core); core = re.sub(r'\n{2,}', '\n', core)
io.open(os.path.join(ROOT, 'raw', 'js', 'v2core.js'), 'w', encoding='utf-8', newline='\n').write(core.rstrip('\n') + '\n/*@@V2END@@*/\n')
head = '/* 点点岛 v2 (docs/PLAN-v2.md): the review question types, the planner, the arithmetic island\'s games, the gem screens, the\n   map\'s corner, the parent tools. Loaded after the entry tap with the sky\'s games (W3.load). Source: raw/js/v2.js (split by\n   raw/js/v2_split.py). */\n"use strict";\n'
io.open(os.path.join(ROOT, 'assets', 'js', 'v2games.js'), 'w', encoding='utf-8', newline='\n').write(head + lazy + "\nW3.loaded = true;          /* the sky's games and v2's are both in */\n")
print('core', len(core.encode()) // 1024, 'KB, lazy', len(lazy.encode()) // 1024, 'KB')
