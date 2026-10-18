# -*- coding: utf-8 -*-
"""World 5 - 积木城 (docs/W5-DESIGN.md §9.6): the toy-block town map, seven block-town blocks for the seven families,
the gate on its block base, the block castle at the end of the path, its party background, one new background for each
of the 28 games and five new things. Same pipeline and style rules as worlds 3 and 4 (tools/w4_batches.py); a background
never shows the things its game asks about (the list per game is in §5 of the design).
usage: python tools/w5_batches.py  ->  batches/w5_*.md + batches/index_w5.tsv;  bash tools/run_batches.sh batches/index_w5.tsv 6
       then python tools/w5_process.py (cut out, sizes, raw/w5_sheet.png to look at)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from gen_batches import HEADER, FOOTER, prompt_for, target_for, BATCH_DIR

OPAQUE = 'EXTRA NOTE: this is a full-bleed OPAQUE scene painting: paint every pixel right up to all four edges, NO transparency, NO cut-out, NO vignette, NO dark or white border.\n'
BLOCK = ('a small square platform made of big colorful toy building blocks (red, yellow, blue, green plastic bricks with round studs on top) '
         'standing on a patch of green grass, drawn with a bold dark outline, seen from a slightly high three-quarter angle, on it: ')
FLOOR = ', plain flat empty ground in the whole lower half, nothing standing on it'
TOP = ', seen straight from above like a flat play mat'
PEP = 'simple flat shapes like a preschool TV cartoon, '
W5 = [
    # ---------------- the block-town map and its blocks
    ('bg_map_blocks', 'bg', 'common', 'a big friendly toy town built from colorful toy building blocks, seen from high above at a slant: bright green grass, little houses made of red yellow blue and green plastic bricks, roads made of grey flat bricks, a small blue river with a toy-brick bridge, a short toy train track running alongside, a little park with round trees, the middle of the picture is open green grass with nothing on it, no people, no characters, no text'),
    ('isl_peppa5', 'island', 'peppa', BLOCK + 'a little hill with a small house built of red and yellow toy bricks with a red brick roof and a round window, a tiny muddy puddle, a flower'),
    ('isl_bluey5', 'island', 'bluey', BLOCK + 'a small blue house on short stilts built of blue and orange toy bricks with a veranda, a backyard with a little tree, a swing'),
    ('isl_pjmasks5', 'island', 'common', BLOCK + 'a tall round tree-shaped tower built of dark blue, green and red toy bricks with a round window at the top, like a hero headquarters in a big tree, night-blue colors'),
    ('isl_paw5', 'island', 'paw', BLOCK + 'a tall lookout tower built of red, white and blue toy bricks with a round top and a small flag pole, a little path of grey bricks leading to it'),
    ('isl_huluwa5', 'island', 'huluwa', BLOCK + 'a little green mountain built of green and brown toy bricks with a curly gourd vine growing on it, seven little gourds on the vine in rainbow colors red orange yellow green cyan blue purple'),
    ('isl_xiyou5', 'island', 'xiyou', BLOCK + 'a small Chinese temple built of red and golden toy bricks with a curved golden roof, on a little mountain of green bricks, a peach tree with pink blossoms'),
    ('isl_avengers5', 'island', 'avengers', BLOCK + 'a tall modern tower built of silver, blue and red toy bricks with a small round helicopter landing pad on its roof marked with a big letter-free circle'),
    ('isl_gate_blocks', 'island', 'common', 'the round grey stone ring magic gate with swirling purple and blue light inside, standing on a small square base of big colorful toy building blocks with round studs, on a patch of green grass, bold dark outline, seen from a slightly high angle'),
    ('isl_blockcastle', 'island', 'common', 'a small fairy-tale castle built entirely of big colorful toy building blocks: red, yellow, blue and green plastic bricks with round studs, square towers with square block tips, colorful little pennants on top, on a patch of green grass, bold dark outline'),
    ('bg_finale_blocks', 'bg', 'common', 'a festive party in a toy-block town: a big castle built of colorful toy bricks with square towers far at the back, strings of colorful pennants, big fireworks in a bright evening sky, a wide plain flat empty stage of smooth green grass in the whole lower half, no people, no characters'),
    # ---------------- ① peppa (P5-P8): hide and seek, the little theatre, the peg board, the zoo
    ('bg_peppa_blockroom', 'bg', 'peppa', PEP + 'inside a bright playroom whose walls are built of big colorful toy bricks, a window with a blue sky at the back' + FLOOR + ', no toys, no furniture, no boxes, no tables'),
    ('bg_peppa_stage', 'bg', 'peppa', PEP + 'a garden with green bushes and a blue sky far at the back, an empty little wooden stage platform made of toy bricks in the middle distance' + FLOOR + ', no animals, no ducks, no chicks, no rabbits, no cookies'),
    ('bg_peppa_easel', 'bg', 'peppa', PEP + 'a cosy craft corner inside a toy-brick house: plain pastel walls, a window with a blue sky, a small shelf with paint pots far at the side' + FLOOR + ', no shapes drawn anywhere, no pictures on the walls, no boards'),
    ('bg_peppa_zoo', 'bg', 'peppa', PEP + 'a sunny park with green hills, round trees and a low wooden fence far at the back, a blue sky with soft clouds' + FLOOR + ', no animals, no cages, no enclosures'),
    # ---------------- ② bluey (B5-B8): left and right, what happened, the kite strings, spot the difference
    ('bg_bluey_blockyard', 'bg', 'bluey', 'a sunny Australian backyard: a tall wooden fence and a gum tree far at the back, a few big toy bricks far at the sides' + FLOOR + ', no people, no balloons, no flowers in front, no toys in front'),
    ('bg_bluey_pool', 'bg', 'bluey', 'a backyard with green grass and a gum tree far at the back, a fence, a blue sky' + FLOOR + ', no ducks, no birds, no animals, no water pool in the lower half'),
    ('bg_bluey_kitepark', 'bg', 'bluey', 'a wide open grassy hill under a big clear blue sky with a few soft clouds, gum trees far away' + FLOOR + ', no kites, no animals, no strings'),
    ('bg_bluey_candyshop', 'bg', 'bluey', 'inside a little sweet shop: pastel pink and mint walls, an empty wooden counter far at the back, empty glass jars on a high shelf' + FLOOR + ', no candies anywhere, no sweets, nothing drawn on the walls'),
    # ---------------- ③ pj masks (J5-J8): triangle puzzle, count the shapes, all the splits, sort the toys
    ('bg_pj_workshop', 'bg', 'common', 'inside a hero headquarters at night: a workbench made of dark blue toy bricks far at the back, soft blue glowing lights, a round window with the moon' + FLOOR + ', no shapes drawn on the walls, no triangles, no tools in front'),
    ('bg_pj_robotlab', 'bg', 'common', 'a quiet laboratory at night: smooth dark blue walls with glowing round lights far at the sides, a big round window with stars' + FLOOR + ', no shapes drawn on the walls, no robots, no screens with pictures'),
    ('bg_pj_canteen', 'bg', 'common', 'a small cosy canteen inside a hero headquarters at night: a long empty table far at the back, soft yellow lights, a round window with the moon' + FLOOR + ', no food, no buns, no plates, no lunch boxes'),
    ('bg_pj_toyroom', 'bg', 'common', 'a toy room at night with dark blue walls, shelves far at the back that are EMPTY, a soft round rug' + FLOOR + ', no toys, no boxes, no blocks on the floor'),
    # ---------------- ④ paw patrol (A5-A8): draw a route, follow the arrows, the story becomes a sentence, seats on the bus
    ('bg_paw_mapmat', 'bg', 'paw', 'one big plain green play mat with a thin darker green border' + TOP + ', nothing on it, completely empty, no roads, no walls, no paths, no animals, no vehicles'),
    ('bg_paw_townmat', 'bg', 'paw', 'a plain light green play mat with a few straight grey roads in a simple grid' + TOP + ', no houses, no buildings, no cars, no arrows, no animals, no people'),
    ('bg_paw_classroom', 'bg', 'paw', 'a training room inside a lookout tower: a big EMPTY plain white screen on the back wall, red and blue panels at the sides' + FLOOR + ', no numbers, no signs, no animals, no food'),
    ('bg_paw_busstop', 'bg', 'paw', 'a little bus stop in a toy-brick town: a small roofed shelter far at the side, a road, houses far away, a blue sky' + FLOOR + ', no bus, no vehicles, no dogs, no people'),
    # ---------------- ⑤ huluwa (H5-H8): paper cut folding, circle in groups, which field is bigger, find all treasures
    ('bg_huluwa_papercut', 'bg', 'huluwa', 'inside a small Chinese mountain cottage: a big wooden window with a plain light paper pane in the middle of the back wall, a windowsill, warm light' + FLOOR + ', nothing stuck on the window, no paper cuts, no red paper'),
    ('bg_huluwa_orchard', 'bg', 'huluwa', 'under a big gourd vine trellis with green leaves at the top of the picture, soft green hills far away' + FLOOR + ', no gourds on the ground, no fruit, no peaches'),
    ('bg_huluwa_fields', 'bg', 'huluwa', 'an empty light-brown soil hillside with a few tufts of grass at the edges' + TOP + ', no fields, no vegetables, no fences, no plants in the middle'),
    ('bg_huluwa_treasure5', 'bg', 'huluwa', 'a magical mountain cave treasure room: purple rock walls with soft glowing crystals far at the back, EMPTY stone shelves' + FLOOR + ', no treasures, no gems, no gourds, no cups, nothing on the shelves'),
    # ---------------- ⑥ xiyou (X5-X8): where was the photo taken, straighten the ropes, the queue, measure with blocks
    ('bg_xiyou_courtyard', 'bg', 'xiyou', 'the courtyard of a small Chinese temple built of red and golden toy bricks: red pillars and a curved golden roof far at the back, pine trees' + FLOOR + ', no tables, no objects, no vases'),
    ('bg_xiyou_vinegrove', 'bg', 'xiyou', 'a clearing in a mountain forest: green trees and misty peaks far at the back, soft sunlight' + FLOOR + ', no vines, no ropes, no lines on the ground'),
    ('bg_xiyou_mountainroad', 'bg', 'xiyou', 'misty green mountains and a blue sky with soft clouds, a few pine trees at the far sides' + FLOOR + ', no road, no people, no flags'),
    ('bg_xiyou_templehall', 'bg', 'xiyou', 'inside a grand Chinese temple hall: red pillars, a golden ceiling, warm lantern light far at the back' + FLOOR + ', no rulers, no marks on the walls, no blocks, no screens'),
    # ---------------- ⑦ avengers (V5-V8): plus plane, minus plane, cut the same, turn the blocks, through the wall
    ('bg_avengers_hangar5', 'bg', 'avengers', 'a big airplane hangar built of grey and blue toy bricks with a wide open door showing a blue sky at the back, blue light strips' + FLOOR + ', no planes, no vehicles, no boxes'),
    ('bg_avengers_workshop', 'bg', 'avengers', 'a high-tech workshop with blue glowing light strips and robot arms far at the sides, a long EMPTY metal workbench' + FLOOR + ', no metal plates, no tools on the bench'),
    ('bg_avengers_tilehall', 'bg', 'avengers', 'a grand African-futuristic hall with purple and gold pillars far at the back, warm light' + FLOOR + ', the floor is one plain smooth colour with no pattern, no tiles, no blocks'),
    ('bg_avengers_yard', 'bg', 'avengers', 'an outdoor hero training ground: a tall building far at the back, green trees, a blue sky' + FLOOR + ', no walls, no blocks, no obstacles'),
    # ---------------- the new things (single objects on white)
    ('prop_bush', 'prop', 'common', 'one round green garden bush with a few small leaves, simple shape, front view'),
    ('prop_balloon', 'prop', 'common', 'one round shiny red balloon with a short white string, simple shape'),
    ('prop_flower', 'prop', 'common', 'one single flower with five yellow petals, an orange centre and a short green stem with one leaf, simple shape, a plain flower with NO face'),
    ('prop_bone', 'prop', 'paw', 'one white cartoon dog bone treat, simple classic bone shape, side view'),
    ('prop_fish', 'prop', 'common', 'one small cute orange fish with a round body and a little tail fin, side view, a plain toy fish with a simple dot eye'),
]


def main():
    groups = {}
    for aid, kind, world, subject in W5:
        groups.setdefault((world, 'bg' if kind == 'bg' else 'obj'), []).append((aid, kind, world, subject))
    refs_of = {'peppa': ['peppa.png', 'george.png'], 'bluey': ['bluey.png', 'bingo.png'], 'huluwa': ['gourd3.png', 'grandpa.png'],
               'paw': ['chase.png', 'marshall.png'], 'xiyou': ['wukong.png', 'bajie.png'], 'avengers': ['ironman.png', 'hulk.png'], 'common': ['wukong.png', 'peppa.png']}
    idx = []
    for (world, cls), lst in groups.items():
        for i in range(0, len(lst), 3):
            chunk = lst[i:i + 3]
            bid = 'w5_%s_%s_%02d' % (world, cls, i // 3 + 1)
            body = [HEADER]
            if cls == 'bg': body.append(OPAQUE)
            if any(k == 'island' for _, k, _, _ in chunk):
                body.append('EXTRA NOTE: the islands also have two island pictures of the same app attached (raw island art): match their look, line weight and their round compact shape; '
                            'these ones stand on a square toy-brick platform on grass instead of floating in the sea. NEVER draw any character or person on them.\n')
            targets = []
            for k, (aid, kind, w, subject) in enumerate(chunk, 1):
                t = target_for(aid, kind)
                targets.append(t)
                body.append('Image %d\nTarget path: %s\nPrompt: %s\n' % (k, t, prompt_for(kind, subject)))
            body.append(FOOTER)
            open(os.path.join(BATCH_DIR, bid + '.md'), 'w', encoding='utf-8').write('\n'.join(body))
            refs = ['incoming/chars_orig/' + r for r in refs_of[world]]
            if any(k == 'island' for _, k, _, _ in chunk):
                refs += ['assets/isl/peppa2.png', 'assets/isl/xiyou2.png']
            idx.append('%s\t%s\t%s' % (bid, ','.join(refs), ','.join(targets)))
    open(os.path.join(BATCH_DIR, 'index_w5.tsv'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')
    print('batches', len(idx), 'images', len(W5))


if __name__ == '__main__':
    main()
