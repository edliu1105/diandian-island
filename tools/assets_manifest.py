# -*- coding: utf-8 -*-
"""Level-asset manifest for Codex ImageGen.

Every entry: (id, kind, world, subject).  kind in {bg, prop, island, icon}.
Character stickers are NOT generated - they come from the client's folder.
"""

PROP_STYLE = (
    "cute chibi 2D cartoon sticker illustration for a toddler learning app, bold clean uniform black outlines, "
    "flat vibrant saturated colors with soft cel shading, rounded child-safe shapes, high-quality children "
    "picture-book style, matching the line weight and cel-shading of the provided character stickers, the object "
    "fills about 85% of the frame and is centered with a small even margin, SOLID PURE WHITE background (#FFFFFF), "
    "no ground shadow, no gradient background, no text, no letters, no watermark, no border, no frame"
)

BG_STYLE = (
    "bright cheerful 2D cartoon background illustration for a toddler learning app, flat vibrant saturated colors "
    "with soft cel shading, clean simple shapes, children picture-book style, wide open uncluttered composition with "
    "plenty of empty space in the middle and lower area so that characters can be placed on top later, no text, "
    "no letters, no watermark, no border, no frame, NO characters, NO people, NO animals"
)

# style references per world (character stickers, style only)
REFS = {
    "peppa":    ["peppa.png", "george.png"],
    "bluey":    ["bluey.png", "bingo.png"],
    "huluwa":   ["gourd3.png", "grandpa.png"],
    "paw":      ["chase.png", "marshall.png"],
    "xiyou":    ["wukong.png", "bajie.png"],
    "avengers": ["ironman.png", "hulk.png"],
    "common":   ["wukong.png", "peppa.png"],
}

ASSETS = [
    # ---------------- backgrounds (square, cover-cropped for both orientations) ----------------
    ("bg_peppa_garden", "bg", "peppa", "a sunny back garden on top of a round green hill, a simple washing line strung between two short wooden posts across the upper right, plain flat green grass in the whole lower half, soft blue sky with a few round white clouds, gentle rolling green hills in the distance, simple flat shapes like a preschool TV cartoon"),
    ("bg_peppa_porch", "bg", "peppa", "the front of a small cosy yellow house with a red roof and a wooden front door on top of a green hill, a flat stone path and wide green lawn across the lower half, flower pots beside the door, soft blue sky, simple flat shapes like a preschool TV cartoon"),
    ("bg_peppa_bedroom", "bg", "peppa", "a cosy children's bedroom interior with pale pink walls, a window showing blue sky, two small beds against the back wall, a round rug on a wooden floor, lots of empty floor space in the lower half, simple flat shapes like a preschool TV cartoon"),
    ("bg_peppa_kitchen", "bg", "peppa", "a bright family kitchen interior decorated for a birthday party, colorful paper bunting and balloons on the wall, a sunny window, simple cupboards, a big round wooden table in the lower middle whose top is completely empty, simple flat shapes like a preschool TV cartoon"),
    ("bg_bluey_yard", "bg", "bluey", "a sunny Australian backyard, a big shady tree with red flowers on the left edge, a checked picnic blanket on the green lawn in the lower middle, a wooden fence and a raised timber Queenslander house with a veranda in the background, warm afternoon light, flat pastel style like a preschool TV cartoon"),
    ("bg_bluey_shop", "bg", "bluey", "the back veranda of a raised timber house with white wooden railings, potted plants, and a long empty pretend-play shop counter made from a cardboard box with a little striped awning across the lower middle, warm afternoon light, flat pastel style like a preschool TV cartoon"),
    ("bg_bluey_playroom", "bg", "bluey", "a children's playroom interior, a big soft blue rug covering the floor, low toy shelves with soft toys along the back wall, a window with a leafy tree outside, warm pastel colors, lots of empty floor space in the lower half, flat pastel style like a preschool TV cartoon"),
    ("bg_bluey_kitchen", "bg", "bluey", "a warm family kitchen interior with a long empty wooden kitchen bench across the lower part, hanging plants, a window with a sunny garden view, simple cupboards, flat pastel style like a preschool TV cartoon"),
    ("bg_huluwa_vine", "bg", "huluwa", "a sunny Chinese fairy-tale mountain hillside, a long simple bamboo trellis frame spanning across the upper middle of the picture (empty, no plants on it), soft green terraced hills, misty blue mountains far away, a small thatched cottage at the far left edge, open grass in the lower half"),
    ("bg_huluwa_meadow", "bg", "huluwa", "a flowery mountain meadow in a Chinese fairy-tale landscape, a large flat round grey stone platform in the lower middle, pine trees and misty green mountains in the background, bright blue sky"),
    ("bg_huluwa_cave", "bg", "huluwa", "inside a magical mountain cave with softly glowing purple and green crystals on the rocky walls, a large bronze ancient Chinese alchemy cauldron with three legs in the background center, smooth stone floor with open space in the front half"),
    ("bg_huluwa_treasure", "bg", "huluwa", "a magical treasure cave in a Chinese fairy tale, small piles of gold coins and jewels along the left and right edges, a green jade throne in the far background, warm glowing paper lanterns, open empty stone floor in the middle and lower half"),
    ("bg_paw_control", "bg", "paw", "inside a round high-tech lookout tower control room for rescue puppies, a huge blank light-blue screen on the back wall, round porthole windows showing sea and sky, red and blue trim, a wide empty round floor in the lower half"),
    ("bg_paw_beach", "bg", "paw", "a sunny seaside bay, gentle turquoise waves on the right, wide empty sandy beach across the lower half, a small wooden rescue hut on the far left, a lighthouse on a distant cliff, blue sky with fluffy clouds"),
    ("bg_paw_tower", "bg", "paw", "a tall cartoon lookout tower with a round glass top standing on a grassy hill by the sea on the right side, a vertical glass elevator tube running up the front of the tower, blue sky, wide open grass in the lower half, no logos"),
    ("bg_paw_rooftops", "bg", "paw", "colorful rooftops of a small seaside town seen from above, a wide flat empty rooftop terrace in the lower half, blue sky with fluffy clouds, the sea in the distance"),
    ("bg_xiyou_peak", "bg", "xiyou", "the rocky peak of a magical Chinese mountain, pink peach blossom trees at the edges, a wide flat rock ledge across the lower half, swirling golden auspicious clouds and misty mountains in the background"),
    ("bg_xiyou_sky", "bg", "xiyou", "a wide open magical sky high above Chinese mountain peaks, soft pastel sunrise colors, a few small swirly auspicious clouds only near the edges, the middle of the sky completely empty"),
    ("bg_xiyou_peachgarden", "bg", "xiyou", "a heavenly peach orchard, peach trees full of pink peaches on the far left and far right edges, a winding stone path, golden clouds and a small red Chinese pavilion far away, open green grass in the middle and lower half"),
    ("bg_xiyou_waterfall", "bg", "xiyou", "a magical waterfall pouring down a green mountain cliff on the right side into a round clear pool, lush tropical plants and rocks, wide open flat rocky ground in the lower left and middle"),
    ("bg_avengers_rooftop", "bg", "avengers", "the top landing pad of a tall futuristic superhero skyscraper at sunset, a big round helipad with glowing edge lights across the lower half, city skyline behind, orange and purple sky, no logos"),
    ("bg_avengers_gym", "bg", "avengers", "a futuristic superhero training hall interior, blue and grey metal walls, big windows showing a city skyline, a large empty training floor with a low round weightlifting platform in the lower middle, no logos"),
    ("bg_avengers_lab", "bg", "avengers", "a futuristic hi-tech engineering lab interior, softly glowing blue hologram panels on the back wall, workbenches with tools at the left and right edges, clean empty floor in the middle and lower half, no logos"),
    ("bg_avengers_vault", "bg", "avengers", "a futuristic high-tech vault chamber glowing with purple light, geometric tribal patterns on the walls, a low round stone pedestal in the lower middle, sleek architecture, no logos"),
    ("bg_map_sea", "bg", "common", "a top-down view of a bright cheerful turquoise sea for a game map, gentle stylised wave swirls and sparkles, soft lighter shallow patches, completely empty with no islands, no boats, no land"),
    ("bg_finale", "bg", "common", "a magical night festival on a small island, strings of warm glowing colorful lanterns, a wide wooden stage across the lower half, a deep blue starry night sky with lots of empty space above for fireworks, the calm sea around"),

    # ---------------- map islands (props on white, cut out) ----------------
    ("isl_peppa", "island", "peppa", "a small round cartoon island floating in the sea, seen from a slightly high angle: a round green grassy hill with a little yellow house with a red roof on top and a big brown muddy puddle in front"),
    ("isl_bluey", "island", "bluey", "a small round cartoon island seen from a slightly high angle: green lawn with a raised timber house with a veranda and a big shady tree with red flowers"),
    ("isl_huluwa", "island", "huluwa", "a small round cartoon island seen from a slightly high angle: a green Chinese mountain with a big climbing gourd vine and seven gourds hanging in rainbow colors red orange yellow green cyan blue purple"),
    ("isl_paw", "island", "paw", "a small round cartoon island seen from a slightly high angle: a tall lookout tower with a round glass top, a small sandy beach and a little dock, no logos"),
    ("isl_xiyou", "island", "xiyou", "a small round cartoon island seen from a slightly high angle: a magical rocky Chinese mountain with pink peach trees and a small waterfall"),
    ("isl_avengers", "island", "avengers", "a small round cartoon island seen from a slightly high angle: a tall futuristic skyscraper tower with a landing pad on top and glowing windows, no logos"),
    ("isl_festival", "island", "common", "a small round cartoon island seen from a slightly high angle: a little festival stage with strings of colorful lanterns and a cute striped lighthouse"),

    # ---------------- W1 Peppa props ----------------
    ("prop_puddle", "prop", "peppa", "one big muddy brown puddle on the ground, a wide flat oval seen from a low angle, glossy wet highlights, a few small mud drops around the rim"),
    ("prop_boots", "prop", "peppa", "a pair of shiny red rubber rain boots standing side by side, front three-quarter view"),
    ("prop_bench", "prop", "peppa", "a small low wooden bench for shoes, long and empty, front view"),
    ("prop_teddy", "prop", "peppa", "a cute brown teddy bear toy sitting, front view"),
    ("prop_dino", "prop", "peppa", "a cute green toy dinosaur plush standing, side view, friendly smile"),
    ("prop_toybox", "prop", "peppa", "an open empty wooden toy chest seen from the front, lid open and tilted back, painted red and yellow"),
    ("prop_ball", "prop", "peppa", "a colorful striped toy ball"),
    ("prop_car", "prop", "peppa", "a small shiny red toy car, side view"),
    ("prop_rocket", "prop", "peppa", "a small toy rocket standing upright, red and white"),
    ("prop_duck", "prop", "peppa", "a yellow rubber duck toy, side view"),
    ("prop_cake", "prop", "peppa", "a big round two-layer birthday cake with pink icing and colorful sprinkles, perfectly flat empty top with NO candles, front view"),
    ("prop_candle", "prop", "peppa", "a single tall thin birthday candle with blue and white spiral stripes, standing perfectly upright, NO flame, unlit"),
    ("prop_candlebox", "prop", "peppa", "a small open cardboard box full of striped birthday candles lying inside, front view"),
    ("prop_hat", "prop", "peppa", "a cone-shaped party hat with colorful stripes and a pompom on top"),
    # ---------------- W2 Bluey props ----------------
    ("prop_plate", "prop", "bluey", "an empty round white plate with a blue rim, seen from a high front angle"),
    ("prop_cookie", "prop", "bluey", "one round chocolate chip cookie, top view"),
    ("prop_strawberry", "prop", "bluey", "one ripe red strawberry with green leaves"),
    ("prop_watermelon", "prop", "bluey", "one big triangle slice of watermelon"),
    ("prop_cherry", "prop", "bluey", "one small red cherry with a short stem"),
    ("prop_coin", "prop", "bluey", "one shiny round golden play coin seen from the front with a simple embossed star in the middle, no letters, no numbers"),
    ("prop_coinjar", "prop", "bluey", "a glass jar filled with shiny golden coins, front view"),
    ("prop_bell", "prop", "bluey", "a small silver shop counter service bell, front view"),
    ("prop_apple", "prop", "bluey", "one shiny red apple with a leaf"),
    ("prop_banana", "prop", "bluey", "one yellow banana"),
    ("prop_carrot", "prop", "bluey", "one orange carrot with green leaves"),
    ("prop_cookiejar", "prop", "bluey", "a round glass cookie jar with a lid full of round cookies, front view"),
    ("prop_bag", "prop", "bluey", "a small brown paper snack bag with the top folded open, front view, empty"),
    # ---------------- W3 Huluwa props ----------------
    ("prop_gourd", "prop", "huluwa", "one plump green unripe calabash gourd hanging from a short curly vine stem with one leaf"),
    ("prop_magicgourd", "prop", "huluwa", "one shiny purple magic calabash gourd with swirling golden patterns and a soft glow, standing upright"),
    ("prop_gem", "prop", "huluwa", "one glowing jade-green magic gemstone crystal with facets and sparkles"),
    ("prop_chest", "prop", "huluwa", "an open ancient Chinese treasure chest, red lacquer with gold trim, a few gold coins inside, front view"),
    # ---------------- W4 PAW props ----------------
    ("prop_pen", "prop", "paw", "a small round wooden animal rescue pen fence with a little gate, seen from a slightly high angle, empty inside"),
    ("prop_kitten", "prop", "paw", "one cute little orange kitten sitting, front view"),
    ("prop_chick", "prop", "paw", "one cute fluffy yellow baby chick, front view"),
    ("prop_bunny", "prop", "paw", "one cute little white bunny sitting, front view"),
    ("prop_turtle", "prop", "paw", "one cute little green sea turtle, side view"),
    ("prop_hovercraft", "prop", "paw", "a cute chunky orange rescue hovercraft vehicle for a preschool cartoon, side view, no logos, no letters, empty driver seat"),
    ("prop_helicopter", "prop", "paw", "a cute chunky pink rescue helicopter for a preschool cartoon, side view, no logos, no letters, empty cockpit"),
    ("prop_firetruck", "prop", "paw", "a cute chunky red fire truck with a ladder for a preschool cartoon, side view, no logos, no letters, empty driver seat"),
    ("prop_policecar", "prop", "paw", "a cute chunky blue police car for a preschool cartoon, side view, no logos, no letters, empty driver seat"),
    ("prop_rescuebasket", "prop", "paw", "a round woven rescue basket hanging from a rope, front view, empty"),
    # ---------------- W5 Xiyou props ----------------
    ("prop_cloud", "prop", "xiyou", "one fluffy magic flying cloud platform in Chinese mythology style, white with swirling golden edges, flat top, side view"),
    ("prop_peach", "prop", "xiyou", "one ripe pink-and-yellow peach with two small green leaves"),
    ("prop_branch", "prop", "xiyou", "one short peach tree branch with green leaves and no fruit, horizontal"),
    ("prop_basket", "prop", "xiyou", "a wide woven bamboo basket, front view, empty"),
    # ---------------- W6 Avengers props ----------------
    ("prop_jet", "prop", "avengers", "a sleek futuristic superhero jet aircraft, dark grey with blue glowing lights, side view, no logos, no letters"),
    ("prop_crate", "prop", "avengers", "a sturdy futuristic metal crate, front view, the front face is one big flat empty glass window, no logos, no letters"),
    ("prop_cube", "prop", "avengers", "one small glowing blue energy cube with rounded edges"),
    ("prop_crystal", "prop", "avengers", "one glowing purple crystal shard with facets"),
    # ---------------- UI ----------------
    ("ui_home", "prop", "common", "a cute little house icon with a red roof, a yellow wall and a round door, chunky rounded shape, front view"),
    ("ui_star", "prop", "common", "one glossy chunky five-pointed golden star with rounded tips"),
    ("icon_app", "icon", "common", "an app icon illustration: a small round tropical island with one palm tree in the lower middle, a big glowing golden star above it surrounded by five colorful round dots, on a bright turquoise sea background filling the whole square edge to edge, bold outlines, no text"),
]
