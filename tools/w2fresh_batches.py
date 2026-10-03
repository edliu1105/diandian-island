# -*- coding: utf-8 -*-
"""World 2 gets its own look (client: the second world must not just repeat the first one's pictures): a new island
picture for each of the six returning families, a new background for each of their 18 games and new things to count.
Same pipeline and style rules as the first world (tools/gen_batches.py, assets_manifest.PROP_STYLE / BG_STYLE).
usage: python tools/w2fresh_batches.py  ->  batches/w2f_*.md + batches/index_w2f.tsv"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from assets_manifest import REFS
from gen_batches import HEADER, FOOTER, prompt_for, target_for, BATCH_DIR

PEP = 'simple flat shapes like a preschool TV cartoon, '
W2 = [
    # ---------------- peppa (new island: the seaside)
    ('isl_peppa2', 'island', 'peppa', 'a small round cartoon island floating in the sea, seen from a slightly high angle: a sandy beach side with a red and white striped beach hut, a tiny red slide and a sandpit with a yellow bucket on a round green hill'),
    ('bg_peppa_playground', 'bg', 'peppa', PEP + 'a small playground on a round green hill: a little red slide at the far left, two swings at the far right, plain flat green grass in the whole lower half, soft blue sky with round white clouds'),
    ('bg_peppa_beach', 'bg', 'peppa', PEP + 'a sunny seaside beach: calm blue sea along the top third with a tiny sailboat far away, plain flat yellow sand in the whole lower half, a striped beach hut at the far left edge'),
    ('bg_peppa_school', 'bg', 'peppa', PEP + 'a bright playgroup classroom: a cream wall with a few simple children paintings and a round clock, a low shelf with toys at the far left, plain wooden floor in the whole lower half'),
    ('prop_umbrella', 'prop', 'peppa', 'one small open red umbrella with a curved handle, standing upright, simple round canopy'),
    ('prop_shell', 'prop', 'peppa', 'one pink scallop seashell, front view, simple ribbed fan shape'),
    ('prop_block', 'prop', 'peppa', 'one wooden toy building block cube painted bright green with a small yellow star on its front face, three-quarter view'),
    ('prop_schoolbag', 'prop', 'peppa', 'one small red children school backpack with the flap open and room inside, front view'),
    # ---------------- bluey (new island: picnic and creek)
    ('isl_bluey2', 'island', 'bluey', 'a small round cartoon island floating in the sea, seen from a slightly high angle: a big Australian gum tree, a red and white checkered picnic blanket and a little creek with flat stepping stones'),
    ('bg_bluey_picnic', 'bg', 'bluey', 'a sunny park picnic spot under a big gum tree at the far right, a red and white checkered picnic blanket spread over the lower half, soft green grass, warm blue sky, Australian suburban park'),
    ('bg_bluey_market', 'bg', 'bluey', 'a cheerful outdoor fruit market: striped awnings and empty wooden crates along the back, plain paved ground in the whole lower half, warm sunny blue sky'),
    ('bg_bluey_creek', 'bg', 'bluey', 'a shady creek in the Australian bush: a shallow clear creek across the back with a few flat rocks, tall gum trees at the sides, plain grassy bank in the whole lower half'),
    ('prop_sandwich', 'prop', 'bluey', 'one triangle sandwich with lettuce cheese and tomato, simple soft bread, three-quarter view'),
    ('prop_orange', 'prop', 'bluey', 'one round orange fruit with a small green leaf'),
    ('prop_pear', 'prop', 'bluey', 'one green pear fruit with a small brown stem and a leaf'),
    ('prop_lemon', 'prop', 'bluey', 'one yellow lemon fruit with a small green leaf'),
    ('prop_ladybug', 'prop', 'bluey', 'one cute red ladybug with black spots seen from above, simple round shape, friendly'),
    # ---------------- paw (new island: the farm)
    ('isl_paw2', 'island', 'paw', 'a small round cartoon island floating in the sea, seen from a slightly high angle: a little red farm barn with a white roof trim, a small windmill and a vegetable patch with a wooden fence'),
    ('bg_paw_city', 'bg', 'paw', 'the main street of a small cheerful seaside town: colorful shop fronts along the back, a wide empty grey road and pavement in the whole lower half, blue sky'),
    ('bg_paw_farm', 'bg', 'paw', 'a sunny farm: a red barn and a yellow haystack at the far left, a white wooden fence across the back, green fields and hills, plain flat grass yard in the whole lower half'),
    ('bg_paw_snow', 'bg', 'paw', 'a snowy mountain slope: snowy pine trees at the sides, white peaks against a pale blue sky, plain smooth snow field in the whole lower half'),
    ('prop_egg', 'prop', 'paw', 'one white chicken egg standing upright, smooth oval'),
    # ---------------- huluwa (new island: the lotus pond)
    ('isl_huluwa2', 'island', 'huluwa', 'a small round cartoon island floating in the sea, seen from a slightly high angle: a lotus pond with pink lotus flowers and big round green leaves, a little thatched Chinese country cottage and a few bamboo stalks'),
    ('bg_huluwa_village', 'bg', 'huluwa', 'a quiet Chinese countryside courtyard: a thatched mud-brick cottage at the far left, strings of red chili and yellow corn hanging under the eaves, misty green mountains far behind, plain flat earth yard in the whole lower half'),
    ('bg_huluwa_lotus', 'bg', 'huluwa', 'a calm lotus pond: pink lotus flowers and big round green leaves along the back and the sides, a little stone bridge far away, misty green mountains, plain calm green-blue water in the whole lower half'),
    ('bg_huluwa_bamboo', 'bg', 'huluwa', 'a sunny bamboo forest clearing: tall green bamboo stalks at both sides and in the back, soft light rays, plain flat mossy ground in the whole lower half'),
    ('prop_corn', 'prop', 'huluwa', 'one yellow corn cob with green husk leaves'),
    ('prop_radish', 'prop', 'huluwa', 'one white radish with green leaves on top'),
    ('prop_chili', 'prop', 'huluwa', 'one shiny red chili pepper with a green stem'),
    ('prop_mushroom', 'prop', 'huluwa', 'one cute brown mushroom with a round cap and a thick cream stem'),
    ('prop_bamboobasket', 'prop', 'huluwa', 'one round woven bamboo basket, empty and open at the top, light yellow-brown weave, three-quarter view'),
    # ---------------- xiyou (new island: the temple and the dragon palace)
    ('isl_xiyou2', 'island', 'xiyou', 'a small round cartoon island floating in the sea, seen from a slightly high angle: a little red Chinese temple hall with a curved golden roof, a big bronze bell under a small roof and a peach tree, soft white clouds at the edges'),
    ('bg_xiyou_palace', 'bg', 'xiyou', 'an underwater dragon palace: red and gold Chinese palace pillars and a curved roof in the back, pink coral and green seaweed at the sides, soft blue water light, plain smooth sandy floor in the whole lower half'),
    ('bg_xiyou_temple', 'bg', 'xiyou', 'a peaceful Chinese temple courtyard: a red temple hall with a curved golden roof in the back, a bronze incense burner at the far left, a pine tree at the far right, plain stone-paved yard in the whole lower half'),
    ('bg_xiyou_river', 'bg', 'xiyou', 'a wide calm river bank in ancient China: a small wooden raft tied at the far left, willow trees, misty mountains across the river, plain flat sandy bank in the whole lower half'),
    ('prop_bun', 'prop', 'xiyou', 'one white Chinese steamed bun with pleated top, soft and round'),
    ('prop_grapes', 'prop', 'xiyou', 'one bunch of purple grapes with a green leaf'),
    # ---------------- avengers (new island: the jet hangar)
    ('isl_avengers2', 'island', 'avengers', 'a small round cartoon island floating in the sea, seen from a slightly high angle: a round futuristic jet hangar with a blue glass roof, a landing pad with a small sleek grey jet and a glowing beacon tower'),
    ('bg_avengers_hangar', 'bg', 'avengers', 'a big bright futuristic jet hangar: a sleek grey jet parked far in the back, blue light stripes on the metal walls, plain smooth grey floor in the whole lower half'),
    ('bg_avengers_space', 'bg', 'avengers', 'inside a friendly space station: a huge round window in the back showing the blue Earth, stars and a ringed planet, white and blue panels at the sides, plain smooth floor in the whole lower half'),
    ('bg_avengers_park', 'bg', 'avengers', 'a futuristic city park at sunset: tall glass towers far behind, round green trees and a fountain at the sides, plain flat green lawn in the whole lower half'),
    ('prop_bolt', 'prop', 'avengers', 'one bright yellow lightning bolt shape, thick and chunky'),
    ('prop_shield', 'prop', 'avengers', 'one round superhero shield with red and white rings and a blue centre with a white star, front view'),
    ('prop_battery', 'prop', 'avengers', 'one chunky green battery with a glowing plus sign and a silver top, upright'),
    ('prop_energy', 'prop', 'avengers', 'one glowing red energy capsule: a short rounded glass cylinder with silver metal caps and a bright glowing core'),
]


def main():
    groups = {}
    for aid, kind, world, subject in W2:
        groups.setdefault((world, 'bg' if kind == 'bg' else 'obj'), []).append((aid, kind, world, subject))
    idx = []
    for (world, cls), lst in groups.items():
        for i in range(0, len(lst), 3):
            chunk = lst[i:i + 3]
            bid = 'w2f_%s_%s_%02d' % (world, cls, i // 3 + 1)
            body = [HEADER]
            targets = []
            for k, (aid, kind, w, subject) in enumerate(chunk, 1):
                t = target_for(aid, kind)
                targets.append(t)
                body.append('Image %d\nTarget path: %s\nPrompt: %s\n' % (k, t, prompt_for(kind, subject)))
            body.append(FOOTER)
            open(os.path.join(BATCH_DIR, bid + '.md'), 'w', encoding='utf-8').write('\n'.join(body))
            idx.append('%s\t%s\t%s' % (bid, ','.join('incoming/chars_orig/' + r for r in REFS[world]), ','.join(targets)))
    open(os.path.join(BATCH_DIR, 'index_w2f.tsv'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')
    print('batches', len(idx), 'images', len(W2))


if __name__ == '__main__':
    main()
