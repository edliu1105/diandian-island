# -*- coding: utf-8 -*-
"""World 3 - the sky (client: a new world after world 2, same rules, its own map, its own things, the same friends):
the sky map, seven floating islands + the rainbow castle at the end of the path, one new background for each of the 28
games and the new things in them. Same pipeline and style rules as before (tools/gen_batches.py); backgrounds are
full-bleed opaque paintings (the "OPAQUE" note), and a background never shows the things its game asks about (R6-3).
usage: python tools/w3_batches.py  ->  batches/w3_*.md + batches/index_w3.tsv"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from gen_batches import HEADER, FOOTER, prompt_for, target_for, BATCH_DIR

OPAQUE = 'EXTRA NOTE: this is a full-bleed OPAQUE scene painting: paint every pixel right up to all four edges, NO transparency, NO cut-out, NO vignette, NO dark or white border.\n'
SKY = ('a small round cartoon island floating high in a bright blue sky, resting on a soft fluffy pale blue-white cloud drawn with a bold dark outline, seen from '
       'a slightly high angle, little rocks hanging under the cloud: ')
PEP = 'simple flat shapes like a preschool TV cartoon, '
W3 = [
    # ---------------- the sky map and its islands
    ('bg_map_sky', 'bg', 'common', 'a huge bright open sky seen from high up: soft pastel blue sky, many fluffy white and pale pink clouds at different heights, gentle golden sun rays from the top left corner, a faint rainbow arc along the far top right edge, a few tiny birds far away, the middle of the picture is open sky with small soft clouds, dreamy and cheerful, no islands, no land, no buildings'),
    ('isl_peppa3', 'island', 'peppa', SKY + 'a little pink bakery cottage with a round roof that looks like a cream cake, a red and yellow striped hot-air balloon tied next to it, a small flower garden'),
    ('isl_bluey3', 'island', 'bluey', SKY + 'a grassy kite hill with a small blue timber house on stilts with a veranda, an orange and blue kite flying from a post, a gum tree'),
    ('isl_pjmasks3', 'island', 'common', SKY + 'at dusk, a tall round blue observatory tower with a big brass telescope pointing up, a glowing crescent moon lamp on a pole, tiny yellow windows'),
    ('isl_paw3', 'island', 'paw', SKY + 'a red and blue rescue airship docked at a small round control tower, a helicopter landing pad with a big H, a lifebuoy'),
    ('isl_huluwa3', 'island', 'huluwa', SKY + 'a tall misty green cloud mountain with a big curly gourd vine climbing it, seven small gourds on the vine in rainbow colors red orange yellow green cyan blue purple, a tiny stone pavilion'),
    ('isl_xiyou3', 'island', 'xiyou', SKY + 'a heavenly Chinese palace gate with red pillars and a curved golden roof standing on the clouds, a peach tree with pink blossoms, golden railings'),
    ('isl_avengers3', 'island', 'avengers', SKY + 'a round silver futuristic flying base with glowing blue rings around its edge, a tall antenna tower and a small landing pad'),
    ('isl_gate_sky', 'island', 'common', 'the round golden stone ring magic gate with swirling purple and blue light inside, standing on a small round floating island made of a soft fluffy pale blue-white cloud drawn with a bold dark outline, a few little rocks hanging under the cloud, tiny golden sparkles, NO water, NO sea'),
    ('isl_rainbow', 'island', 'common', SKY + 'a small fairy-tale castle with pastel towers and colorful pennant flags, a big bright rainbow arching over the castle'),
    ('bg_finale_sky', 'bg', 'common', 'a festive party high on the clouds at golden sunset: a small fairy-tale castle with pastel towers and a big bright rainbow far at the back, colorful fireworks and stars in the sky, strings of bunting and lanterns between the clouds, a wide plain flat stage of soft white clouds in the whole lower half'),
    # ---------------- peppa (E): cake halves, what happens first, party shapes, what is missing
    ('bg_peppa_bakery', 'bg', 'peppa', PEP + 'a cosy kitchen with pastel pink walls, a window with blue sky at the back, empty shelves with a few jars far behind, a big plain empty wooden table top across the whole lower half, nothing on the table'),
    ('bg_peppa_attic', 'bg', 'peppa', PEP + 'a cosy attic playroom under a sloping roof, a round window at the back with blue sky, a closed toy chest at the far left, a plain wooden floor in the whole lower half'),
    ('bg_peppa_party', 'bg', 'peppa', PEP + 'a sunny garden party: colorful paper bunting across the top, a long table with a white cloth far at the back with nothing on it, a few balloons at the far sides, plain flat green lawn in the whole lower half, no hats, no presents, no toys'),
    ('bg_peppa_artroom', 'bg', 'peppa', PEP + 'a bright children art corner: an empty wooden easel at the far left, a low shelf with paint pots at the far right, sunny window, a plain light floor in the whole lower half'),
    # ---------------- bluey (U): equal boxes, the garden grid, the magic cups, the see-through cards
    ('bg_bluey_cafe', 'bg', 'bluey', 'a sunny Australian cafe terrace: a striped awning and a few empty round tables far at the back, potted palms at the sides, plain light paved terrace in the whole lower half'),
    ('bg_bluey_garden', 'bg', 'bluey', 'a community garden: a small green garden shed at the far left, tall sunflowers along the back wooden fence, a water tank at the far right, plain flat lawn in the whole lower half, no vegetables'),
    ('bg_bluey_stage', 'bg', 'bluey', 'a backyard show stage at dusk: a homemade curtain from a striped bedsheet hung between two posts at the back, strings of warm fairy lights, a plain wooden deck floor in the whole lower half, no cups'),
    ('bg_bluey_sunroom', 'bg', 'bluey', 'a bright sunroom with big glass windows showing green trees, potted plants at the far sides, plain light floorboards in the whole lower half'),
    # ---------------- pj masks (K): lit windows, two cards, three in a row, seen from above
    ('bg_pj_skyline', 'bg', 'common', 'a city rooftop at night under a big glowing moon: dark blue and purple sky with a few stars, far away buildings as dark silhouettes with only a few tiny lights, plain flat rooftop floor in the whole lower half'),
    ('bg_pj_hqlab', 'bg', 'common', 'inside a cosy secret superhero headquarters at night: round deep-blue walls, a big round window with stars, soft glowing blue panels at the sides, plain smooth floor in the whole lower half'),
    ('bg_pj_nightpark', 'bg', 'common', 'a city playground at night under a big moon: a small slide as a dark silhouette at the far left, glowing street lamps, purple sky with stars, plain flat soft ground in the whole lower half'),
    ('bg_pj_museum', 'bg', 'common', 'a quiet museum hall at night: tall stone columns at the sides, moonlight through big arched windows at the back, plain polished floor in the whole lower half, nothing on display'),
    # ---------------- paw (R): the harbour sums, badges, the fence, the pipes
    ('bg_paw_harbor', 'bg', 'paw', 'a sunny little harbour: a red and white lighthouse at the far right, colorful fishing huts far behind, calm blue sea across the back, a plain wooden pier floor in the whole lower half, no animals'),
    ('bg_paw_townpark', 'bg', 'paw', 'a sunny town park: a white gazebo at the far left, flower beds far behind, round green trees, plain flat green lawn in the whole lower half'),
    ('bg_paw_meadow', 'bg', 'paw', 'a wide green meadow on a gentle hill: tiny wildflowers, distant blue mountains, soft clouds, plain flat light green grass in the whole lower half, no fences, no animals'),
    ('bg_paw_nursery', 'bg', 'paw', 'a garden nursery yard: a glass greenhouse far at the back, empty wooden plant tables at the far sides, sunny blue sky, plain light gravel ground in the whole lower half, no pipes'),
    # ---------------- huluwa (L): the colored hills, one stroke, the abacus, the cloth
    ('bg_huluwa_terraces', 'bg', 'huluwa', 'green terraced rice fields on misty mountains far at the back, a small waterfall, soft sky, plain flat earth ground in the whole lower half'),
    ('bg_huluwa_study', 'bg', 'huluwa', 'a Chinese country study room: a low wooden desk with brush holders far at the left, a paper window with bamboo shadows, red paper lanterns, plain wooden floor in the whole lower half'),
    ('bg_huluwa_fair', 'bg', 'huluwa', 'a Chinese country fair street: wooden stalls with cloth awnings far behind, red lanterns on strings, a big old tree at the far right, plain stone-paved ground in the whole lower half'),
    ('bg_huluwa_loom', 'bg', 'huluwa', 'a weaving room in a Chinese cottage: a wooden loom at the far left, rolls of plain colored cloth on shelves far behind, a paper window, plain wooden floor in the whole lower half'),
    # ---------------- xiyou (S): the heavenly orchard, the cave doors, the flaming mountains, the furnace hall
    ('bg_xiyou_heaven', 'bg', 'xiyou', 'a heavenly garden on the clouds: golden railings and a jade arched bridge far at the back, pink blossom trees at the far sides, soft golden light, plain smooth white cloud ground in the whole lower half, no fruit'),
    ('bg_xiyou_cliffs', 'bg', 'xiyou', 'a rocky mountain pass in ancient China: tall reddish cliffs at both far sides, a winding path disappearing far behind, pine trees on the cliffs, plain flat sandy ground in the whole lower half, no doors'),
    ('bg_xiyou_flame', 'bg', 'xiyou', 'the Flaming Mountains: red and orange rocky mountains with little cartoon flames far at the back, a warm orange sky, plain flat dry yellow ground in the whole lower half'),
    ('bg_xiyou_alchemy', 'bg', 'xiyou', 'an ancient Chinese immortal hall: red pillars at the far sides, shelves of jars and scrolls far behind, soft smoke clouds, plain stone floor in the whole lower half, no furnace'),
    # ---------------- avengers (T): the sorting machine, the suits, the archery field, the gears
    ('bg_avengers_factory', 'bg', 'avengers', 'a clean futuristic robot workshop: a rail track high along the back wall, blue light strips, big round window, plain smooth light grey floor in the whole lower half'),
    ('bg_avengers_armory', 'bg', 'avengers', 'a futuristic hall with empty tall glass display cases along the back wall, soft blue light, plain smooth floor in the whole lower half'),
    ('bg_avengers_field', 'bg', 'avengers', 'an outdoor hero training field: a tall stone wall with a few banners far at the back, blue sky, plain flat green grass in the whole lower half, no targets'),
    ('bg_avengers_garage', 'bg', 'avengers', 'a warm tinkering garage: a big workbench at the far left, tool panels on the back wall, warm hanging lamps, plain smooth floor in the whole lower half, no gears'),
    # ---------------- the new things
    ('prop_giftbox', 'prop', 'peppa', 'one cube-shaped gift box, all sides the same size, wrapped in blue paper with a red ribbon and bow, three-quarter view from slightly above'),
    ('prop_dice', 'prop', 'peppa', 'one big soft toy dice cube, white with round red dots, three-quarter view from slightly above'),
    ('prop_drum', 'prop', 'peppa', 'one round toy drum shaped like a short cylinder, red sides with yellow zigzag, white top, standing upright, three-quarter view'),
    ('prop_tincan', 'prop', 'peppa', 'one tin can shaped like a cylinder standing upright, silver with a plain green label band, three-quarter view'),
    ('prop_beachball', 'prop', 'peppa', 'one round beach ball with red, yellow, blue and white stripes, perfectly round sphere'),
    ('prop_yarnball', 'prop', 'peppa', 'one round ball of pink wool yarn, perfectly round sphere, a short loose thread'),
    ('prop_partyhat', 'prop', 'peppa', 'one pointed cone-shaped party hat standing upright, purple with yellow dots, a small pompom on the tip'),
    ('prop_trafficcone', 'prop', 'peppa', 'one orange traffic cone with white stripes standing upright, simple pointed cone shape, small square base'),
    ('prop_donut', 'prop', 'bluey', 'one round donut with pink icing and rainbow sprinkles, seen from the top at a slight angle'),
    ('prop_cupcake', 'prop', 'bluey', 'one cupcake in a blue paper cup with white frosting and a red cherry on top'),
    ('prop_icecream', 'prop', 'bluey', 'one ice cream cone with a single round mint-green scoop'),
    ('prop_sprout', 'prop', 'bluey', 'one small green seedling sprout with two round leaves growing from a little mound of brown soil'),
    ('prop_tomato', 'prop', 'bluey', 'one round shiny red tomato with a green star-shaped stem'),
    ('prop_eggplant', 'prop', 'bluey', 'one purple eggplant with a green cap'),
    ('prop_pumpkin', 'prop', 'bluey', 'one small round orange pumpkin with a short brown stem'),
    ('prop_broccoli', 'prop', 'bluey', 'one green broccoli floret with a thick light green stalk'),
    ('prop_pompom', 'prop', 'bluey', 'one fluffy round yellow pompom ball'),
    ('prop_seal', 'prop', 'paw', 'one cute small grey baby seal lying down, friendly face, simple shape, an animal object'),
    ('prop_starfish', 'prop', 'paw', 'one orange five-armed starfish, front view'),
    ('prop_sheep', 'prop', 'paw', 'one cute fluffy white sheep with a black face and black legs standing, side view, an animal object'),
    ('prop_flowerpot', 'prop', 'paw', 'one small terracotta flower pot with a single bright red tulip, upright'),
    ('prop_persimmon', 'prop', 'xiyou', 'one round orange persimmon fruit with a green four-leaf cap'),
    ('prop_pomegranate', 'prop', 'xiyou', 'one red pomegranate fruit with a small crown on top'),
    ('prop_starfruit', 'prop', 'xiyou', 'one whole yellow-green star fruit (carambola) lying on its side so its five ridges show, a plain fruit with NO face, NO eyes, NO mouth'),
    ('prop_furnace', 'prop', 'xiyou', 'one ancient Chinese bronze alchemy furnace: a round three-legged cauldron with two handles, a domed lid with a knob, a little orange glow at the open door in its belly, front view'),
]


def main():
    groups = {}
    for aid, kind, world, subject in W3:
        groups.setdefault((world, 'bg' if kind == 'bg' else 'obj'), []).append((aid, kind, world, subject))
    refs_of = {'peppa': ['peppa.png', 'george.png'], 'bluey': ['bluey.png', 'bingo.png'], 'huluwa': ['gourd3.png', 'grandpa.png'],
               'paw': ['chase.png', 'marshall.png'], 'xiyou': ['wukong.png', 'bajie.png'], 'avengers': ['ironman.png', 'hulk.png'], 'common': ['wukong.png', 'peppa.png']}
    idx = []
    for (world, cls), lst in groups.items():
        for i in range(0, len(lst), 3):
            chunk = lst[i:i + 3]
            bid = 'w3_%s_%s_%02d' % (world, cls, i // 3 + 1)
            body = [HEADER]
            if cls == 'bg': body.append(OPAQUE)
            if any(k == 'island' for _, k, _, _ in chunk):
                body.append('EXTRA NOTE: the islands also have two island pictures of the same app attached (raw island art): match their look and their round floating shape.\n')
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
    open(os.path.join(BATCH_DIR, 'index_w3.tsv'), 'w', encoding='utf-8').write('\n'.join(idx) + '\n')
    print('batches', len(idx), 'images', len(W3))


if __name__ == '__main__':
    main()
