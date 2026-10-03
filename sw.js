/* 点点岛 service worker - one release = one version: the page (index.html, manifest) and every asset belong together
   - install: EVERY core file and EVERY asset must land in the new caches (each fetch retried 3x), otherwise the install
     fails and the previous version keeps serving - a half-filled cache can never replace a working one
   - unchanged assets (same content hash) are copied from the previous version's cache instead of downloaded again
   - a fully installed new version WAITS; the page switches to it only at a safe moment (entry screen or the app going
     to the background): it asks the waiting worker to take over and reloads at once - page and assets change together
   - activate: the old caches are deleted
   - page / manifest: from THIS version's cache (never refreshed from the network behind the version's back);
     network only when this version has nothing (first visit)
   - assets: cache first, then network (and cached)
   VERSION is a hash over index.html, manifest and every asset: tools/gen_sw_list.py rewrites it for every release
   (tests/test_offline.py fails when it is stale). */
const VERSION = 'v785bdf11';
const CORE = 'ddi-core-' + VERSION;
const ASSETS = 'ddi-assets-' + VERSION;
const CORE_FILES = ['./', './index.html', './manifest.webmanifest'];
/*@@ASSET_LIST@@*/
const ASSET_FILES = [["./assets/bg/avengers_gym.jpg","3473c4ae4f"],["./assets/bg/avengers_hangar.jpg","7bafc5c5c2"],["./assets/bg/avengers_lab.jpg","bf6c15b0d8"],["./assets/bg/avengers_park.jpg","733e1f7362"],["./assets/bg/avengers_rooftop.jpg","74074f02fc"],["./assets/bg/avengers_space.jpg","59f1669470"],["./assets/bg/avengers_track.jpg","a5b20203f7"],["./assets/bg/avengers_vault.jpg","130c28e8aa"],["./assets/bg/bluey_bedroom.jpg","b8fbb80c08"],["./assets/bg/bluey_creek.jpg","86592f5c33"],["./assets/bg/bluey_kitchen.jpg","303bab23e6"],["./assets/bg/bluey_market.jpg","10d8350700"],["./assets/bg/bluey_picnic.jpg","9bdef51a8c"],["./assets/bg/bluey_playroom.jpg","a525c3f140"],["./assets/bg/bluey_shop.jpg","29abb5970a"],["./assets/bg/bluey_yard.jpg","fd070c388e"],["./assets/bg/finale.jpg","5b1c6eaa4c"],["./assets/bg/huluwa_bamboo.jpg","52398e133f"],["./assets/bg/huluwa_cave.jpg","a26f893f58"],["./assets/bg/huluwa_lotus.jpg","c29a900e45"],["./assets/bg/huluwa_meadow.jpg","7dcbad8989"],["./assets/bg/huluwa_mountain.jpg","2b500874dc"],["./assets/bg/huluwa_treasure.jpg","2d3343fcf8"],["./assets/bg/huluwa_village.jpg","a26ee57571"],["./assets/bg/huluwa_vine.jpg","3f83cef4f8"],["./assets/bg/map_sea.jpg","b61f7f288a"],["./assets/bg/paw_beach.jpg","9fb390c998"],["./assets/bg/paw_city.jpg","4227b05cc2"],["./assets/bg/paw_control.jpg","50e6bc9c8c"],["./assets/bg/paw_farm.jpg","97e3eda83f"],["./assets/bg/paw_lookout.jpg","c31abf60bc"],["./assets/bg/paw_rooftops.jpg","5d70d58bd1"],["./assets/bg/paw_snow.jpg","08a8b7514b"],["./assets/bg/paw_tower.jpg","431864b37b"],["./assets/bg/peppa_beach.jpg","44ea63d874"],["./assets/bg/peppa_bedroom.jpg","9b80ede19b"],["./assets/bg/peppa_garden.jpg","851dcbed42"],["./assets/bg/peppa_hill.jpg","1e8430d0c8"],["./assets/bg/peppa_kitchen.jpg","64ad7bd62f"],["./assets/bg/peppa_playground.jpg","5e5c29fab2"],["./assets/bg/peppa_porch.jpg","da33b115dd"],["./assets/bg/peppa_school.jpg","3f9ee7a29a"],["./assets/bg/pj_city.jpg","79a785664c"],["./assets/bg/pj_hq.jpg","6af6fe861c"],["./assets/bg/pj_park.jpg","634c5efe7e"],["./assets/bg/pj_rooftop.jpg","3a298bfb60"],["./assets/bg/xiyou_clouds.jpg","a15562bf4c"],["./assets/bg/xiyou_palace.jpg","ce57099896"],["./assets/bg/xiyou_peachgarden.jpg","5550fc0a51"],["./assets/bg/xiyou_peak.jpg","221440b8ed"],["./assets/bg/xiyou_river.jpg","537d9a5229"],["./assets/bg/xiyou_sky.jpg","c09ff1fb4a"],["./assets/bg/xiyou_temple.jpg","ee1f085f0a"],["./assets/bg/xiyou_waterfall.jpg","d6c049bcc4"],["./assets/bgthumb/avengers_gym.jpg","25b3326b48"],["./assets/bgthumb/avengers_hangar.jpg","b86b45aaeb"],["./assets/bgthumb/avengers_lab.jpg","e1a44e4ad7"],["./assets/bgthumb/avengers_park.jpg","467c7a0aae"],["./assets/bgthumb/avengers_rooftop.jpg","fcd649afd1"],["./assets/bgthumb/avengers_space.jpg","9a4a2adbd4"],["./assets/bgthumb/avengers_track.jpg","d56b1ddb85"],["./assets/bgthumb/avengers_vault.jpg","e5bdf0a589"],["./assets/bgthumb/bluey_bedroom.jpg","6c10bf0bdd"],["./assets/bgthumb/bluey_creek.jpg","c8f1598adb"],["./assets/bgthumb/bluey_kitchen.jpg","0fb0a28b8e"],["./assets/bgthumb/bluey_market.jpg","a506435bd5"],["./assets/bgthumb/bluey_picnic.jpg","cb354a8fb9"],["./assets/bgthumb/bluey_playroom.jpg","9873008abc"],["./assets/bgthumb/bluey_shop.jpg","b52fae21d8"],["./assets/bgthumb/bluey_yard.jpg","d7e75742c0"],["./assets/bgthumb/finale.jpg","fb5f035c27"],["./assets/bgthumb/huluwa_bamboo.jpg","2bba4ed3bc"],["./assets/bgthumb/huluwa_cave.jpg","d05da60adc"],["./assets/bgthumb/huluwa_lotus.jpg","0c9e183a6a"],["./assets/bgthumb/huluwa_meadow.jpg","08c3e48efe"],["./assets/bgthumb/huluwa_mountain.jpg","258f1dea68"],["./assets/bgthumb/huluwa_treasure.jpg","bdc2e51404"],["./assets/bgthumb/huluwa_village.jpg","0b73448744"],["./assets/bgthumb/huluwa_vine.jpg","d6ceb4e55b"],["./assets/bgthumb/map_sea.jpg","5407d44a14"],["./assets/bgthumb/paw_beach.jpg","e44e8d20f2"],["./assets/bgthumb/paw_city.jpg","0280494bd6"],["./assets/bgthumb/paw_control.jpg","51c8515a98"],["./assets/bgthumb/paw_farm.jpg","1f20fa6155"],["./assets/bgthumb/paw_lookout.jpg","e5669d76be"],["./assets/bgthumb/paw_rooftops.jpg","3dd1f79ddb"],["./assets/bgthumb/paw_snow.jpg","974100f040"],["./assets/bgthumb/paw_tower.jpg","3f48e40a6b"],["./assets/bgthumb/peppa_beach.jpg","b03181450b"],["./assets/bgthumb/peppa_bedroom.jpg","7f913748de"],["./assets/bgthumb/peppa_garden.jpg","4e6da5f3fd"],["./assets/bgthumb/peppa_hill.jpg","6c2f5d9d49"],["./assets/bgthumb/peppa_kitchen.jpg","20f90f70f5"],["./assets/bgthumb/peppa_playground.jpg","45000a3c25"],["./assets/bgthumb/peppa_porch.jpg","b3f665b871"],["./assets/bgthumb/peppa_school.jpg","0ced9aeedf"],["./assets/bgthumb/pj_city.jpg","9a43dc7100"],["./assets/bgthumb/pj_hq.jpg","2c350c4458"],["./assets/bgthumb/pj_park.jpg","4a987c4b46"],["./assets/bgthumb/pj_rooftop.jpg","b961f722cb"],["./assets/bgthumb/xiyou_clouds.jpg","8bce70a1c0"],["./assets/bgthumb/xiyou_palace.jpg","1c4ba0448b"],["./assets/bgthumb/xiyou_peachgarden.jpg","5015e7349d"],["./assets/bgthumb/xiyou_peak.jpg","dd535edea6"],["./assets/bgthumb/xiyou_river.jpg","b61d1c84ae"],["./assets/bgthumb/xiyou_sky.jpg","ad1ae54e11"],["./assets/bgthumb/xiyou_temple.jpg","5844ca5067"],["./assets/bgthumb/xiyou_waterfall.jpg","82f257d7ab"],["./assets/chars/bajie.png","6b483abef1"],["./assets/chars/bandit.png","de31411465"],["./assets/chars/bingo.png","974443eb7c"],["./assets/chars/bluey.png","12996f3df2"],["./assets/chars/captain.png","5d06f69faa"],["./assets/chars/catboy.png","6e417844e1"],["./assets/chars/chase.png","8c8fd391c6"],["./assets/chars/chilli.png","dc3c80458b"],["./assets/chars/daddy_pig.png","a1240be87e"],["./assets/chars/dragon_horse.png","8567ac105c"],["./assets/chars/gekko.png","7523e125bf"],["./assets/chars/george.png","7df46f98d6"],["./assets/chars/gourd1.png","020c37f162"],["./assets/chars/gourd2.png","3210835cd2"],["./assets/chars/gourd3.png","1cdd755c11"],["./assets/chars/gourd4.png","7666fe738d"],["./assets/chars/gourd5.png","0cf7b6faa4"],["./assets/chars/gourd6.png","7335f0db61"],["./assets/chars/gourd7.png","de12d9fb85"],["./assets/chars/grandpa.png","fab5cef8cb"],["./assets/chars/hawkeye.png","4b3ba1fb5b"],["./assets/chars/hulk.png","7e37279d97"],["./assets/chars/ironman.png","b12b62d8a9"],["./assets/chars/luna_girl.png","117cb2c9ed"],["./assets/chars/marshall.png","861f254231"],["./assets/chars/miles.png","74d90ba3d6"],["./assets/chars/mummy_pig.png","74e019a61a"],["./assets/chars/owlette.png","7b14fec82c"],["./assets/chars/panther.png","54f055741b"],["./assets/chars/peppa.png","f4d95d4cdb"],["./assets/chars/pj_robot.png","3da0c32c1f"],["./assets/chars/rocky.png","3350c0696d"],["./assets/chars/romeo.png","913183cc8c"],["./assets/chars/rubble.png","d2e304e0c8"],["./assets/chars/ryder.png","d07a317f9e"],["./assets/chars/scorpion.png","17de9620db"],["./assets/chars/shaseng.png","45eca05862"],["./assets/chars/skye.png","bd7ec068ca"],["./assets/chars/snake.png","57dec457e6"],["./assets/chars/spiderman.png","fb07472df2"],["./assets/chars/tangseng.png","b10ee9d00b"],["./assets/chars/thor.png","3e9771d754"],["./assets/chars/widow.png","15cacd8cd4"],["./assets/chars/wukong.png","6c1bc5e861"],["./assets/chars/zuma.png","3b7f884abd"],["./assets/icon-180.png","781cb3cbb5"],["./assets/icon-192.png","58232f00df"],["./assets/icon-512.png","0d929bcfa7"],["./assets/icon-maskable-512.png","3d03107d7e"],["./assets/isl/avengers.png","57df3f2ff7"],["./assets/isl/avengers2.png","0a1b77b8ed"],["./assets/isl/bluey.png","15849b8093"],["./assets/isl/bluey2.png","c628c6e69c"],["./assets/isl/festival.png","adac199afb"],["./assets/isl/gate.png","3ee3697a69"],["./assets/isl/huluwa.png","b9c2f257f1"],["./assets/isl/huluwa2.png","4fa1872c86"],["./assets/isl/paw.png","5ecca64949"],["./assets/isl/paw2.png","7c067a0337"],["./assets/isl/peppa.png","30a3ee92f3"],["./assets/isl/peppa2.png","2f14c61add"],["./assets/isl/pjmasks.png","46007ba5c0"],["./assets/isl/xiyou.png","f75494364b"],["./assets/isl/xiyou2.png","ecd1bd8b3e"],["./assets/logo.jpg","4479ea469a"],["./assets/props/apple.png","94a7f01f58"],["./assets/props/bag.png","3e5e3b4722"],["./assets/props/ball.png","d403625779"],["./assets/props/bamboobasket.png","38cbff2e44"],["./assets/props/banana.png","e75c717bf4"],["./assets/props/basket.png","848144b545"],["./assets/props/battery.png","18f3fd2c66"],["./assets/props/bell.png","368a4e2086"],["./assets/props/bench.png","3dba2b9ea1"],["./assets/props/block.png","3d419ed6cd"],["./assets/props/bolt.png","3215e0b721"],["./assets/props/boots.png","195585100b"],["./assets/props/boots_blue.png","019bcfcbf5"],["./assets/props/boots_green.png","77d2c9defe"],["./assets/props/boots_pink.png","a53b3a4f0d"],["./assets/props/boots_yellow.png","9714534161"],["./assets/props/branch.png","1b2df18beb"],["./assets/props/bun.png","2dc68a15af"],["./assets/props/bunny.png","f336d1777a"],["./assets/props/cake.png","bd9ea1e5d1"],["./assets/props/candle.png","db5a39eb3f"],["./assets/props/candlebox.png","e6a1c6f86d"],["./assets/props/car.png","b59b085e96"],["./assets/props/carrot.png","e54b1fa64d"],["./assets/props/cherry.png","c31f8f71ca"],["./assets/props/chest.png","779003e215"],["./assets/props/chick.png","da8e3ea9db"],["./assets/props/chili.png","e521372455"],["./assets/props/cloud.png","48b1385c90"],["./assets/props/coin.png","2fc636e24b"],["./assets/props/coinjar.png","cbcb5dc859"],["./assets/props/cookie.png","b787501f35"],["./assets/props/cookiejar.png","e9547adbca"],["./assets/props/corn.png","ad7b56c80b"],["./assets/props/crate.png","0b0c552acc"],["./assets/props/crystal.png","6784ea28ba"],["./assets/props/cube.png","2027fa172d"],["./assets/props/dino.png","5c19de6d1a"],["./assets/props/duck.png","86dae8f2f0"],["./assets/props/egg.png","aa598171db"],["./assets/props/energy.png","e04372cd76"],["./assets/props/energy_blue.png","a805d7fb7d"],["./assets/props/energy_green.png","107e8583ab"],["./assets/props/firetruck.png","9017723a24"],["./assets/props/gem.png","46b4f3d8c5"],["./assets/props/gourd.png","18296b2910"],["./assets/props/grapes.png","6bbe97eab4"],["./assets/props/hat.png","cf42ccaf64"],["./assets/props/helicopter.png","e5b6bd99d3"],["./assets/props/hovercraft.png","62ffd11456"],["./assets/props/jet.png","83ccd4b40b"],["./assets/props/kitten.png","ee3bd025f0"],["./assets/props/ladybug.png","bdf4d04771"],["./assets/props/lemon.png","55e116f08b"],["./assets/props/magicgourd.png","5a34d09b29"],["./assets/props/mushroom.png","2f7058a7b6"],["./assets/props/orange.png","a746201bfa"],["./assets/props/peach.png","f1debeddda"],["./assets/props/pear.png","16f5aa954b"],["./assets/props/pen.png","c7d498a51b"],["./assets/props/plate.png","be06415cd8"],["./assets/props/policecar.png","1ce08b74e7"],["./assets/props/puddle.png","94c635b203"],["./assets/props/radish.png","cea23676f6"],["./assets/props/rescuebasket.png","8046f179a5"],["./assets/props/rocket.png","d6f92a07f3"],["./assets/props/sandwich.png","7028db6665"],["./assets/props/schoolbag.png","4e74152162"],["./assets/props/shell.png","996750a0eb"],["./assets/props/shield.png","5fe3e8ef2a"],["./assets/props/strawberry.png","e577de5256"],["./assets/props/teddy.png","3a256cd7fa"],["./assets/props/toybox.png","ad39b1291d"],["./assets/props/turtle.png","b574c965e5"],["./assets/props/ui_home.png","13f402843c"],["./assets/props/ui_star.png","edd6ae29a1"],["./assets/props/umbrella.png","7683c546f6"],["./assets/props/umbrella_blue.png","f330873ea6"],["./assets/props/umbrella_yellow.png","a598ec349d"],["./assets/props/watermelon.png","27d8e70173"],["./assets/thumbs/bajie.png","6a06cd6306"],["./assets/thumbs/bandit.png","67fd657efc"],["./assets/thumbs/bingo.png","fd08f82b2e"],["./assets/thumbs/bluey.png","cd0e842710"],["./assets/thumbs/captain.png","14accfff91"],["./assets/thumbs/catboy.png","e93f7478ac"],["./assets/thumbs/chase.png","daa94ca601"],["./assets/thumbs/chilli.png","2f0eaf250b"],["./assets/thumbs/daddy_pig.png","9a560988de"],["./assets/thumbs/dragon_horse.png","932b2f2bca"],["./assets/thumbs/gekko.png","73f1d690ab"],["./assets/thumbs/george.png","81bdc8eb73"],["./assets/thumbs/gourd1.png","dadc626359"],["./assets/thumbs/gourd2.png","a97e4bbb3d"],["./assets/thumbs/gourd3.png","b8f06151b1"],["./assets/thumbs/gourd4.png","dcd43035b2"],["./assets/thumbs/gourd5.png","f4bc733e9b"],["./assets/thumbs/gourd6.png","4fbdd71f64"],["./assets/thumbs/gourd7.png","0a61546bca"],["./assets/thumbs/grandpa.png","329b89a1b3"],["./assets/thumbs/hawkeye.png","4fea85899c"],["./assets/thumbs/hulk.png","5214dbbe99"],["./assets/thumbs/ironman.png","9942eddcc8"],["./assets/thumbs/luna_girl.png","bbec003500"],["./assets/thumbs/marshall.png","668b92630e"],["./assets/thumbs/miles.png","6c74bbb35a"],["./assets/thumbs/mummy_pig.png","5effa29de6"],["./assets/thumbs/owlette.png","fb711b5441"],["./assets/thumbs/panther.png","db97ab10eb"],["./assets/thumbs/peppa.png","b7943eceb2"],["./assets/thumbs/pj_robot.png","6b3b9040d5"],["./assets/thumbs/rocky.png","e03d14261a"],["./assets/thumbs/romeo.png","1d5ba40b7a"],["./assets/thumbs/rubble.png","5a620ded1c"],["./assets/thumbs/ryder.png","93845fd757"],["./assets/thumbs/scorpion.png","b21fae6948"],["./assets/thumbs/shaseng.png","61e9e9fcc6"],["./assets/thumbs/skye.png","6ba69b5a08"],["./assets/thumbs/snake.png","f847904c6d"],["./assets/thumbs/spiderman.png","061dec962b"],["./assets/thumbs/tangseng.png","bf510182f3"],["./assets/thumbs/thor.png","9a592284f6"],["./assets/thumbs/widow.png","916dd56ccf"],["./assets/thumbs/wukong.png","9c64d2823c"],["./assets/thumbs/zuma.png","e94ecbfac8"],["./assets/voice/bank.json","48999815b7"],["./assets/voice/n1.mp3","584b4abb07"],["./assets/voice/n10.mp3","9fc81169ee"],["./assets/voice/n11.mp3","a4646d0e2a"],["./assets/voice/n12.mp3","3ca8b89ac1"],["./assets/voice/n13.mp3","87a7a11cbc"],["./assets/voice/n14.mp3","5003dd97ea"],["./assets/voice/n15.mp3","06006f123a"],["./assets/voice/n16.mp3","54a5caca4d"],["./assets/voice/n17.mp3","6bcc6d1c7b"],["./assets/voice/n18.mp3","b64fcd19ef"],["./assets/voice/n19.mp3","bb0d942ab3"],["./assets/voice/n2.mp3","f3e38a7bdc"],["./assets/voice/n20.mp3","9f9c0b161b"],["./assets/voice/n3.mp3","d4c42fb28d"],["./assets/voice/n4.mp3","dc5f1d31b8"],["./assets/voice/n5.mp3","e719db6344"],["./assets/voice/n6.mp3","1f28127947"],["./assets/voice/n7.mp3","74e1af957c"],["./assets/voice/n8.mp3","0ece47e0b2"],["./assets/voice/n9.mp3","3579105ed8"],["./assets/voice/o1.mp3","cac538eafa"],["./assets/voice/o10.mp3","7311dbcb4f"],["./assets/voice/o2.mp3","e0bf780fd0"],["./assets/voice/o3.mp3","f627841177"],["./assets/voice/o4.mp3","58e2f7707c"],["./assets/voice/o5.mp3","a8c80f031f"],["./assets/voice/o6.mp3","bba98dd4e2"],["./assets/voice/o7.mp3","9db0641500"],["./assets/voice/o8.mp3","119864662b"],["./assets/voice/o9.mp3","eef6c1eaa6"],["./assets/voice/silence.mp3","66f7c59e20"],["./assets/voice/v/1119321f.mp3","d679a519d7"],["./assets/voice/v/383906a7.mp3","425bc354d1"],["./assets/voice/v/3dacd277.mp3","f84c4b8e04"]];
/*@@END_ASSET_LIST@@*/
const META = './__ddi_meta.json';

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchOk(url, tries) {
  let last = null;
  for (let i = 0; i < (tries || 3); i++) {
    try {
      const r = await fetch(new Request(url, { cache: 'reload' }));
      if (r && r.ok && r.status === 200) return r;
      last = new Error('http ' + (r ? r.status : '?') + ' ' + url);
    } catch (e) { last = e; }
    await sleep(500 * (i + 1));
  }
  throw last || new Error('fetch failed ' + url);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const core = await caches.open(CORE);
    for (const u of CORE_FILES) await core.put(u, await fetchOk(u));
    const assets = await caches.open(ASSETS);
    /* what the previous version already has (url -> hash) */
    const olds = [];
    for (const k of await caches.keys()) {
      if (!k.startsWith('ddi-assets-') || k === ASSETS) continue;
      const c = await caches.open(k), m = await c.match(META);
      let map = {};
      if (m) { try { map = await m.json(); } catch (e) { map = {}; } }
      olds.push({ c, map });
    }
    const meta = {};
    for (let i = 0; i < ASSET_FILES.length; i += 6) {
      await Promise.all(ASSET_FILES.slice(i, i + 6).map(async ([u, h]) => {
        meta[u] = h;
        if (await assets.match(u)) return;
        for (const o of olds) { if (o.map[u] === h) { const hit = await o.c.match(u); if (hit) { await assets.put(u, hit); return; } } }
        await assets.put(u, await fetchOk(u));     /* throws -> the whole install fails -> old version stays */
      }));
    }
    await assets.put(META, new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } }));
    /* no skipWaiting here: an open page keeps its own version until it asks for the switch (message 'skip') */
  })());
});

self.addEventListener('message', event => { if (event.data === 'skip') self.skipWaiting(); });

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('ddi-') && k !== CORE && k !== ASSETS).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function fromCore(req) {
  const cache = await caches.open(CORE);
  return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname) ? await cache.match('./index.html') : null);
}

/* the page of THIS version; the network only when this version has none (never mixes a newer page with older assets) */
async function versionPage(req) {
  const hit = await fromCore(req);
  if (hit) return hit;
  try { return await fetch(req); } catch (e) { return new Response('offline', { status: 503, headers: { 'content-type': 'text/plain' } }); }
}

async function cacheFirst(req) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok && res.status === 200) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/assets/')) { event.respondWith(cacheFirst(req)); return; }
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || url.pathname.endsWith('.webmanifest')) {
    event.respondWith(versionPage(req));
  }
});
