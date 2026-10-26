// =====================================================================================================================
// PLACE: Рыбацкая деревушка — houses on the sandy shore of a bay, boats, nets and drying racks, a jetty. The street comes
// in from the forest road from Студёный ключ in the west and runs out onto the dam across the bay in the east.
// Frame as the other place: game pixels, 1 px = 10 cm, x east, y south, the origin the place's north-west corner.
// The water is to the north (the bay, its shore at about y 190) and, beyond the neck the street runs out on, to the east.
// =====================================================================================================================
{
  // the power: a line of wooden poles along the street, a street lamp on some of them
  const POLES = [{ n: 1, x: 60, y: 448, strut: 1, sign: true }, { n: 2, x: 330, y: 404, lamp: true, dir: 1 }, { n: 3, x: 620, y: 384, lamp: true, dir: -1, bird: true },
    { n: 4, x: 900, y: 348, lamp: true, dir: 1, lean: 2 }, { n: 5, x: 1100, y: 266, strut: -1 }];
  const objects = [
    // the houses along the street, their fronts to it: each its own paint, roof and things about it
    { id: 'house-1', p: 'house', x: 250, y: 372, w: 60, d: 46, wall: 'board', col: [112, 146, 166], roof: 'tin', roofCol: [112, 74, 58], shut: [66, 108, 94], wins: [-19, 19], deco: ['logs', 'bench', 'barrel', 'oars', 'aerial', 'lamp'], seed: 3 },
    { id: 'house-2', p: 'house', x: 480, y: 352, w: 52, d: 40, wall: 'log', col: [150, 112, 74], roof: 'shingle', roofCol: [96, 98, 100], chim: 'pipe', chimX: 14, wins: [-17, 17], deco: ['buoys', 'net', 'barrel'], seed: 5 },
    { id: 'house-3', p: 'house', x: 760, y: 338, w: 50, d: 40, wall: 'board', col: [204, 172, 98], roof: 'tin', roofCol: [138, 62, 48], shut: [176, 70, 52], wins: [-16, 16], deco: ['buoys', 'barrel', 'aerial', 'logs'], seed: 8 },
    { id: 'smokehouse', p: 'smokehouse', x: 600, y: 282 },
    { id: 'boatshed', p: 'boatshed', x: 968, y: 306 },
    { id: 'well', p: 'well', x: 386, y: 360 },
    { id: 'logpile', p: 'logpile', x: 168, y: 340, seed: 11 },
    // nets and fish drying on the shore side
    { id: 'netrack-1', p: 'netrack', x: 142, y: 300, len: 58, nets: 2, seed: 7 }, { id: 'netrack-2', p: 'netrack', x: 706, y: 254, len: 50, nets: 2, seed: 17, col: [70, 92, 84] },
    { id: 'fishrack-1', p: 'fishrack', x: 372, y: 272, len: 46, rows: 3, seed: 11 }, { id: 'fishrack-2', p: 'fishrack', x: 864, y: 262, len: 40, rows: 3, seed: 23, gold: .3 },
    { id: 'crates-1', p: 'crates', x: 540, y: 298, seed: 4 }, { id: 'barrels-1', p: 'barrels', x: 640, y: 292, seed: 3, n: 3 }, { id: 'barrels-2', p: 'barrels', x: 1004, y: 324, seed: 9, n: 2 },
    // boats: two turned over on the sand, one on its keel, two afloat by the jetty
    { id: 'boat-1', p: 'boat', x: 318, y: 224, col: [66, 112, 150], seed: 2 }, { id: 'boat-2', p: 'boat', x: 410, y: 232, col: [168, 60, 48], up: true, seed: 3 },
    { id: 'boat-5', p: 'boat', x: 905, y: 228, col: [60, 120, 104], up: true, flip: true, seed: 5 },
    { id: 'boat-3', p: 'boat', x: 676, y: 132, col: [214, 210, 196], kind: 'motor', water: true, seed: 4 }, { id: 'boat-4', p: 'boat', x: 598, y: 140, col: [60, 120, 104], water: true, flip: true, seed: 6 },
    // the jetty's pilings, both sides
    ...[222, 184, 146, 108].flatMap((y, i) => [-1, 1].map(s => ({ id: `piling-${i}${s > 0 ? 'e' : 'w'}`, p: 'piling', x: 640 + s * 11, y, h: 15 + (i % 2) * 2, tire: i === 3, seed: 5 + i }))),
    // by the fire on the beach
    { id: 'fire-1', p: 'fire', kind: 'ring', x: 792, y: 216 }, { id: 'bench-1', p: 'bench', x: 764, y: 230 }, { id: 'bench-2', p: 'bench', x: 822, y: 232 },
    // cars, the power, the signposts, the end of the dam
    { id: 'car-niva', p: 'car', kind: 'niva', x: 662, y: 456, flip: true }, { id: 'car-lada', p: 'car', kind: 'lada', x: 150, y: 482 },
    ...POLES.map(P => Object.assign({ id: 'pole-' + P.n, p: 'pole', seed: 60 + P.n }, P)),
    { id: 'sign-west', p: 'signpost', dir: -1, text: 'КЛЮЧ 1,7', x: 112, y: 480 }, { id: 'sign-east', p: 'signpost', dir: 1, text: 'ДАМБА 2,0', x: 1112, y: 296 },
    { id: 'barrier', p: 'barrier', x: 1438, y: 156, dir: 1 },
  ];
  PLACES.buhta = {
    id: 'buhta', name: 'Рыбацкая деревушка', mapAt: [450, 222],
    size: [1280, 720], margin: [240, 220], base: 'forest',
    trail: { side: ['road-west'] },
    ground: [
      { id: 'clearing', mat: 'glade', ellipse: [640, 330, 760, 270], rough: .3 },
      // the sand and the water of the bay to the north and, past the neck the street runs out on, to the east
      { id: 'beach-a', mat: 'beach', ellipse: [700, -300, 1040, 540], rough: .1 },
      { id: 'beach-c', mat: 'beach', ellipse: [1900, 150, 740, 370], rough: .1 },
      { id: 'bay-a', mat: 'lake', pal: 'bay', ellipse: [700, -300, 1000, 500], rough: .1 },
      { id: 'bay-c', mat: 'lake', pal: 'bay', ellipse: [1900, 150, 700, 330], rough: .1 },
      // the yards, trodden bare, and the paths to the doors and down to the jetty
      { id: 'yard-1', mat: 'trodden', ellipse: [252, 392, 70, 34], rough: .2 }, { id: 'yard-2', mat: 'trodden', ellipse: [482, 372, 66, 32], rough: .2 }, { id: 'yard-3', mat: 'trodden', ellipse: [762, 358, 62, 30], rough: .2 },
      { id: 'yard-shed', mat: 'trodden', ellipse: [968, 332, 74, 30], rough: .2 }, { id: 'yard-fish', mat: 'trodden', ellipse: [620, 268, 120, 30], rough: .3 },
      { id: 'path-1', mat: 'path', line: [[252, 392], [254, 428]], w: 6 }, { id: 'path-2', mat: 'path', line: [[482, 374], [482, 414]], w: 6 }, { id: 'path-3', mat: 'path', line: [[762, 358], [764, 396]], w: 6 },
      { id: 'path-jetty', mat: 'path', line: [[596, 408], [612, 340], [630, 286], [640, 246]], w: 7 }, { id: 'path-shed', mat: 'path', line: [[968, 336], [964, 366]], w: 7 },
      { id: 'path-beach', mat: 'path', line: [[250, 300], [330, 258], [420, 252], [560, 262], [640, 246], [760, 232], [900, 250]], w: 5 },
      { id: 'dirt-1', mat: 'dirt', ellipse: [252, 394, 14, 6], rough: .4 }, { id: 'dirt-2', mat: 'dirt', ellipse: [482, 375, 14, 6], rough: .4 }, { id: 'dirt-3', mat: 'dirt', ellipse: [762, 359, 14, 6], rough: .4 },
      { id: 'dirt-well', mat: 'dirt', ellipse: [386, 372, 16, 6], rough: .4 },
      // the way into the village from the forest, the street and the embankment out over the bay
      { id: 'road-west', mat: 'road', line: [[-100, 492], [120, 456]], w: 13 },
      { id: 'street', mat: 'road', line: [[120, 456], [330, 428], [560, 410], [800, 392], [1010, 345], [1130, 275], [1200, 220]], w: 13 },
      { id: 'dam', mat: 'dam', line: [[1170, 238], [1250, 200], [1400, 160], [1560, 140], [1760, 135]], w: 22, rough: .4 },
      // the jetty: planks over the sand and out into the water
      { id: 'jetty', mat: 'bridge', line: [[640, 252], [640, 100]], w: 8.5, rough: 0, bridge: { ux: 0, uy: -1 } },
      // wheel tracks to the shed, the boats' way down to the water
      ...[[[968, 336], [960, 300]], [[480, 232], [490, 205]], [[330, 240], [326, 214]]].flatMap((L, i) => [-3, 3].map(o => ({ id: `track-${i}${o < 0 ? 'a' : 'b'}`, mat: 'track', line: L.map(([x, y]) => [x + o, y]), w: 1.5, rough: .4 }))),
    ],
    objects,
    scatter: [
      { id: 'scatter', n: 170, seed: 12, in: 'clearing', clear: 9, kinds: [['grass', 3], ['juniper', .6], ['lowshrub', .8], ['fern', .4], ['mush', .4], ['rock', .8], ['bush', .5], ['branch', 1.2]] },
      { id: 'reeds', n: 90, seed: 21, in: 'bay-a', band: [-9, -3], clear: 14, kinds: [['reed', 1]] },
      { id: 'shoals', n: 30, seed: 22, in: 'bay-a', band: [-16, -5], clear: 14, kinds: [['rock', 1]] },
      { id: 'drift', n: 120, seed: 23, in: 'beach-a', clear: 10, kinds: [['log', .8], ['branch', 2], ['rock', 1.4], ['grass', 1]] },
    ],
    forest: { clearing: 'clearing', cell: 22, zone: .005, stands: [
      { id: 'bor', share: .42, keep: .55, size: 1.05, kinds: [['pine', 6], ['birch', 1.2], ['spruce', .8], ['decid', .25]], underKeep: .5,
        under: [['juniper', 1.6], ['lowshrub', 2], ['branch', 1.4], ['grass', 1.2], ['mush', .8], ['log', .5], ['stump', .4], ['rock', .3]] },
      { id: 'mixed', share: .28, keep: .5, kinds: [['decid', 2], ['bare', 1.4], ['birch', 2.4], ['pine', 1.2], ['aspen', 1], ['rowan', .7]], bt: 'oak',
        under: [['bush', 1.6], ['barebush', 1.2], ['fern', .8], ['branch', 1.2], ['log', .8], ['snag', .35], ['grass', .6], ['sapling', .6], ['mush', .5]] },
      { id: 'spruce', share: .18, keep: .6, size: 1.1, kinds: [['spruce', 7], ['birch', .5], ['decid', .35]], underKeep: .35,
        under: [['lowshrub', 2], ['fern', 1.2], ['branch', 1.6], ['log', 1], ['stump', .8], ['snag', .5], ['mush', 1]] },
      { id: 'hazel', share: .12, keep: .32, kinds: [['bare', 3], ['decid', 1], ['aspen', .6], ['birch', .5]], bt: 'oak', underKeep: .8,
        under: [['barebush', 4], ['bush', 1.6], ['log', 1.2], ['branch', 1.4], ['sapling', .5], ['stump', .5]], extra: { p: .55, kinds: [['barebush', 3], ['bush', 1]] } } ] },
    // the people: an old fisherman between the boats and the jetty, a man mending a net by the first house, a woman with a bucket to the well
    npcs: [
      { id: 'fisher-1', look: { id: 'fisher-1', sex: 'm', age: 'old', h: 17.2, build: 1.1, skin: 1, hair: [150, 148, 142], cut: 'short', beard: [150, 148, 142], hat: 'cap', hatCol: [70, 70, 64], top: [58, 84, 74], topKind: 'jacket', legs: [78, 84, 70], boots: [40, 52, 40], carry: 'bucket' },
        route: [[560, 246, 20], [636, 242, 0], [660, 242, 0], [660, 170, 35], [660, 242, 0], [420, 250, 25], [330, 252, 0], [420, 250, 0], [560, 246, 0]] },
      { id: 'fisher-2', look: { id: 'fisher-2', sex: 'm', h: 18.6, build: 1.0, skin: 2, hair: [60, 44, 32], cut: 'short', hat: 'hood', top: [96, 110, 140], topKind: 'hoodie', legs: [70, 74, 86], boots: [40, 36, 34] },
        route: [[250, 400, 30], [196, 396, 0], [170, 326, 55], [196, 396, 0]] },
      { id: 'woman', look: { id: 'woman', sex: 'f', h: 16.4, build: .9, skin: 1, hair: [170, 120, 70], cut: 'tail', top: [180, 80, 60], topKind: 'fleece', legs: [60, 64, 90], boots: [60, 50, 44], carry: 'bucket' },
        route: [[386, 378, 22], [440, 398, 0], [482, 392, 40], [440, 398, 0]] },
    ],
    sitters: { 'fire-1': [[-18, 6, 90], [16, 8, 270]] },
    poi: [
      { id: 'jetty', name: 'Мостки', hint: 'отсюда уходят на лодках', x: 640, y: 206, r: 34 },
      { id: 'smoke', name: 'Коптильня', hint: 'пахнет ольхой и рыбой', x: 600, y: 292, r: 30 },
      { id: 'shed', name: 'Лодочный сарай', hint: 'вёсла, сети, лодочный мотор', x: 968, y: 318, r: 40 },
      { id: 'fire', name: 'Костровище', hint: 'вечерами здесь сидят у воды', x: 792, y: 226, r: 28 },
      { id: 'well', name: 'Колодец', hint: 'вода из ключа, ледяная', x: 386, y: 374, r: 24 },
    ],
    exits: [
      { id: 'west', x: -240, y: 500, to: 'Студёный ключ', km: 1.7 },
      { id: 'dam', x: 1330, y: 175, to: 'Дамба через залив', km: 2 },
    ],
    power: { spans: [['pole-1', 'pole-2'], ['pole-2', 'pole-3'], ['pole-3', 'pole-4'], ['pole-4', 'pole-5']], drops: [], exits: [{ from: 'pole-1', dx: -300, dy: 60, to: 'линия от Студёного ключа' }] },
    sounds: [],
    spawn: { x: 70, y: 470, heading: 90 },
  };
}
