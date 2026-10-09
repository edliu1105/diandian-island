# -*- coding: utf-8 -*-
"""World 4 - the stars (PLAN-v2 A.2: 10 以内加减; seven islands: 零与符号, 5 以内加, 5 以内减, 6-10 分合, 10 以内加,
10 以内减, 加减关系): the space map, seven little planets for the seven families + the star castle at the end of the path,
one new background for each of the 28 games and the new things in them. Same pipeline and style rules as world 3
(tools/w3_batches.py); a background never shows the things its game asks about.
usage: python tools/w4_batches.py  ->  batches/w4_*.md + batches/index_w4.tsv;  bash tools/run_batches.sh batches/index_w4.tsv"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from gen_batches import HEADER, FOOTER, prompt_for, target_for, BATCH_DIR

OPAQUE = 'EXTRA NOTE: this is a full-bleed OPAQUE scene painting: paint every pixel right up to all four edges, NO transparency, NO cut-out, NO vignette, NO dark or white border.\n'
PLANET = ('a small round cartoon planet floating in dark blue space, a soft glowing atmosphere ring around it, drawn with a bold dark outline, seen from '
          'a slightly high angle so its top surface is a little round world, a few tiny stars around: ')
FLOOR = ', plain flat empty ground in the whole lower half, nothing standing on it'
PEP = 'simple flat shapes like a preschool TV cartoon, '
W4 = [
    # ---------------- the star map and its planets
    ('bg_map_space', 'bg', 'common', 'a huge friendly outer space seen from far away: deep blue and soft violet space, many twinkling stars of different sizes, a pastel pink and teal nebula cloud, a big yellow comet with NO face with a long tail at the top left, a ringed planet far away at the top right, a few tiny shooting stars, the middle of the picture is open dark-blue space with nothing in it'),
    ('isl_peppa4', 'island', 'peppa', PLANET + 'a pink planet with soft pink grass, a little round house shaped like a red rocket with a round window, a muddy-puddle crater, a small flower'),
    ('isl_bluey4', 'island', 'bluey', PLANET + 'a pale blue planet with blue grass, a small blue timber house on stilts with a veranda and a homemade cardboard rocket next to it, a gum tree'),
    ('isl_pjmasks4', 'island', 'common', PLANET + 'the grey moon with round craters, a small round moon base dome with a glowing blue window, a little flag pole, the earth far behind'),
    ('isl_paw4', 'island', 'paw', PLANET + 'a red Mars planet with orange rocks and a small red canyon, a red and blue rescue rover with big wheels parked next to a small round rescue base'),
    ('isl_huluwa4', 'island', 'huluwa', PLANET + 'a jade-green planet with a big curly gourd vine growing around it, seven little gourds on the vine in rainbow colors red orange yellow green cyan blue purple, a tiny stone pavilion'),
    ('isl_xiyou4', 'island', 'xiyou', PLANET + 'a golden planet with a Chinese star palace: red pillars and a curved golden roof, a peach tree with pink blossoms, golden railings, soft clouds around it'),
    ('isl_avengers4', 'island', 'avengers', 'a round silver space station floating in dark blue space with glowing blue ring corridors around it, solar panel wings, a tall antenna and a small docking port, drawn with a bold dark outline, seen from a slightly high angle'),
    ('isl_gate_space', 'island', 'common', 'the round golden stone ring magic gate with swirling purple and blue light inside, standing on a small round floating asteroid rock with a bold dark outline, a few tiny stars around it, seen from a slightly high angle'),
    ('isl_starcastle', 'island', 'common', 'a small fairy-tale castle made of glowing pale blue and gold crystal with star-shaped tips on its towers, standing on a small round floating asteroid with a bold dark outline, a big golden star shining above the castle, tiny stars around'),
    ('bg_finale_space', 'bg', 'common', 'a festive party in outer space: a crystal castle with star-shaped tower tips far at the back, big colorful fireworks and planets in a deep blue starry sky, strings of little star lanterns, a wide plain flat empty stage of smooth pale moon rock in the whole lower half'),
    # ---------------- peppa (F): >/<, + or -, build a sentence, symbols for numbers
    ('bg_peppa_crater', 'bg', 'peppa', PEP + 'a soft pink planet landscape with a few round craters far behind, a pink and purple sky with stars and a ringed planet' + FLOOR),
    ('bg_peppa_launchpad', 'bg', 'peppa', PEP + 'a small rocket launch pad far at the back with an empty scaffold tower, a starry purple evening sky' + FLOOR + ', no rockets'),
    ('bg_peppa_galley', 'bg', 'peppa', PEP + 'inside a round cosy spaceship kitchen: round windows with stars outside at the back, pastel pink walls, empty shelves far behind' + FLOOR),
    ('bg_peppa_dome', 'bg', 'peppa', PEP + 'inside a glass observatory dome at night: a big telescope at the far left, stars through the glass, a soft rug' + FLOOR),
    # ---------------- bluey (I): stars into a jar, fingers, a two-picture story, count the shapes
    ('bg_bluey_meteorhill', 'bg', 'bluey', 'a grassy hill under a deep blue night sky full of stars, a gum tree as a dark silhouette at the far right, a few fireflies' + FLOOR + ', no jars, no shooting stars'),
    ('bg_bluey_cockpit', 'bg', 'bluey', 'inside a homemade cardboard rocket cockpit: cardboard walls with drawn-on buttons, a round porthole showing stars at the back' + FLOOR),
    ('bg_bluey_moonpark', 'bg', 'bluey', 'a playground on a moon base: a small slide and swings far at the back, a glass dome over everything, stars outside' + FLOOR + ', no birds, no animals'),
    ('bg_bluey_planetarium', 'bg', 'bluey', 'inside a planetarium: a dark round ceiling with soft projected constellations, rows of seats far at the back' + FLOOR),
    # ---------------- pj masks (M): sentence -> picture, empty seats, who has more left, fold and punch
    ('bg_pj_moonsurface', 'bg', 'common', 'the grey surface of the moon with soft craters far behind, the blue earth rising in a black starry sky' + FLOOR),
    ('bg_pj_shuttlecabin', 'bg', 'common', 'inside a spaceship cabin at night: smooth blue walls, round portholes with stars, soft ceiling lights' + FLOOR + ', no seats, no people'),
    ('bg_pj_mooncity', 'bg', 'common', 'a little moon city at night: round dome houses with tiny yellow windows far at the back, a purple starry sky with a big moon' + FLOOR + ', no balloons'),
    ('bg_pj_moonlab', 'bg', 'common', 'a quiet moon laboratory at night: round blue walls, glowing screens at the far sides, a big round window with stars' + FLOOR),
    # ---------------- paw (N): all the ways to split, two that make N, the pattern of splits, the mini sudoku
    ('bg_paw_marsdesert', 'bg', 'paw', 'a red Mars desert: orange rocky hills and red canyons far at the back, a pink sky with two small moons' + FLOOR + ', no rovers'),
    ('bg_paw_rovergarage', 'bg', 'paw', 'inside a rescue base garage on Mars: red and blue walls, a big round door with a red planet view, tool panels far behind' + FLOOR + ', no vehicles'),
    ('bg_paw_greenhouse', 'bg', 'paw', 'inside a glass dome greenhouse on Mars: green plants in pots along the far back, the red planet outside the glass' + FLOOR),
    ('bg_paw_controlroom', 'bg', 'paw', 'a rescue control room: a big round screen with a planet map at the back, red and blue panels at the sides' + FLOOR),
    # ---------------- huluwa (O): three gourds into one bowl, the path whose numbers make N, the number pyramid, number patterns
    ('bg_huluwa_vinegarden', 'bg', 'huluwa', 'a magical gourd vine garden on a green planet under a starry sky, curly vines with big leaves far at the back, a stone lantern' + FLOOR + ', no gourds'),
    ('bg_huluwa_rocks', 'bg', 'huluwa', 'misty floating mountain peaks in a starry sky far at the back, soft green and blue colors' + FLOOR),
    ('bg_huluwa_courtyard', 'bg', 'huluwa', 'a Chinese stone courtyard at night under stars: red lanterns, a moon gate far at the back' + FLOOR + ', no bricks, no blocks'),
    ('bg_huluwa_crystalcave', 'bg', 'huluwa', 'a cave with soft glowing green and blue crystals on its walls far at the back' + FLOOR),
    # ---------------- xiyou (F5-F8): eaten twice, how many at first, the key for the door, the maze
    ('bg_xiyou_peachgarden', 'bg', 'xiyou', 'a heavenly star palace garden: golden railings and a jade arched bridge far at the back, pink clouds, a starry golden sky' + FLOOR + ', no peaches, no fruit'),
    ('bg_xiyou_cloudterrace', 'bg', 'xiyou', 'a cloud terrace of the star palace: red pillars at the far sides, soft golden light, stars in the sky' + FLOOR),
    ('bg_xiyou_palacedoors', 'bg', 'xiyou', 'a long wall of the star palace with red pillars and a golden curved roof far at the back, warm lantern light' + FLOOR + ', no doors, no keys'),
    ('bg_xiyou_starmaze', 'bg', 'xiyou', 'a starry heavenly garden seen from above at night, soft clouds at the corners, golden sparkles' + FLOOR),
    # ---------------- avengers (I5-I8): think addition for subtraction, the space shuttle stops, more than / fewer than, guess the number
    ('bg_avengers_commanddeck', 'bg', 'avengers', 'the command deck of a space station: a huge curved window with stars and a planet at the back, blue light strips' + FLOOR),
    ('bg_avengers_shuttleline', 'bg', 'avengers', 'a space station transport tube: a long glass tunnel with stars outside curving into the distance, blue lights' + FLOOR + ', no vehicles'),
    ('bg_avengers_gym', 'bg', 'avengers', 'a hero training gym on a space station: padded blue walls, a round window with stars' + FLOOR),
    ('bg_avengers_screens', 'bg', 'avengers', 'a space station control room with many glowing screens far at the back and blue light' + FLOOR),
    # ---------------- the new things
    ('prop_jar', 'prop', 'bluey', 'one empty clear glass jar with a round opening and a cork lid next to it, simple shape, three-quarter view'),
    ('prop_shootingstar', 'prop', 'bluey', 'one bright yellow five-pointed star with a short sparkly tail, a plain star with NO face'),
    ('prop_astronaut', 'prop', 'common', 'one cute small toy astronaut in a white space suit with a round helmet and a blue visor, standing, a toy figure, no face visible'),
    ('prop_alien', 'prop', 'common', 'one cute small round green alien toy with three little antennae and big round eyes, friendly, a toy object'),
    ('prop_spacebus', 'prop', 'avengers', 'one cute rounded space shuttle bus, white and blue, with a row of round windows that are dark and opaque so nobody inside can be seen, side view'),
    ('prop_key', 'prop', 'xiyou', 'one golden ancient Chinese key with a round handle with a little red tassel, side view'),
]


def main():
    groups = {}
    for aid, kind, world, subject in W4:
        groups.setdefault((world, 'bg' if kind == 'bg' else 'obj'), []).append((aid, kind, world, subject))
    refs_of = {'peppa': ['peppa.png', 'george.png'], 'bluey': ['bluey.png', 'bingo.png'], 'huluwa': ['gourd3.png', 'grandpa.png'],
               'paw': ['chase.png', 'marshall.png'], 'xiyou': ['wukong.png', 'bajie.png'], 'avengers': ['ironman.png', 'hulk.png'], 'common': ['wukong.png', 'peppa.png']}
    idx = []
    for (world, cls), lst in groups.items():
        for i in range(0, len(lst), 3):
            chunk = lst[i:i + 3]
            bid = 'w4_%s_%s_%02d' % (world, cls, i // 3 + 1)
            body = [HEADER]
            if cls == 'bg': body.append(OPAQUE)
            if any(k == 'island' for _, k, _, _ in chunk):
                body.append('EXTRA NOTE: the islands also have two island pictures of the same app attached (raw island art): match their look and their round floating shape; these ones float in space.\n')
            targets = []
            for k, (aid, kind, w, subject) in enumerate(chunk, 1):
                t = target_for(aid, kind)
                targets.append(t)
                body.append('Image %d\nTarget path: %s\nPrompt: %s\n' % (k, t, prompt_for(kind, subject)))
            body.append(FOOTER)
            open(os.path.join(BATCH_DIR, bid + '.md'), 'w', encoding='utf-8').write('\n'.join(body))
            refs = ['incoming/chars_orig/' + r for r in refs_of[world]]
            if any(k == 'island' for _, k, _, _ in chunk):
                refs += ['assets/isl/peppa3.png', 'assets/isl/xiyou3.png']
            idx.append('%s\t%s\t%s' % (bid, ','.join(refs), ','.join(targets)))
    open(os.path.join(BATCH_DIR, 'index_w4.tsv'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')
    print('batches', len(idx), 'images', len(W4))


if __name__ == '__main__':
    main()
