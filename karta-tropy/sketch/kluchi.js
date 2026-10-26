// Студёный ключ — старт. Поляна в ельнике с берёзами: родник в срубе под навесом, жёлоб, ручей через тропу
// по камушкам, колодец с воротом, стенд с картой троп, указатель, скамья. День и холодное утро (пар, иней).
window.SCENE = () => { const out = {}; for (const mode of ['day', 'morning']) { build(mode); out['kluchi_' + mode] = K.out() } return out };
function build(mode) {
  K.init(400, 260); const g = K.g, G = g.G, GW = g.GW, PAL = g.PAL, BG = g.BG;
  if (mode === 'morning') K.sun = [1.25, .17]; // low sun from the east: long shadows to the right
  // ---- the lay of the place ----
  const seg = (P, x, y) => { let best = 1e9, k = 0; for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))), d = Math.hypot(x - ax - dx * t, y - ay - dy * t); if (d < best) { best = d; k = i + t } } return [best, k] };
  const TR = [[[140, 268], [168, 222], [188, 186], [204, 152]], [[204, 152], [236, 142], [300, 136], [410, 124]], [[204, 152], [210, 112], [216, 60], [226, -8]]];
  const trailD = (x, y) => Math.min(...TR.map(P => seg(P, x, y)[0]));
  const SPR = [116, 118]; // the spring's basin (centre of its log frame)
  const ST = [[150, 132], [168, 154], [182, 176], [190, 192], [214, 208], [252, 222], [300, 238], [346, 252], [400, 262]]; // the brook
  const brook = (x, y) => seg(ST, x, y)[0] + (K.n(x * .2, y * .2, 5) - .5) * 1.2;
  const glade = (x, y) => ((x - 205) / 175) ** 2 + ((y - 150) / 112) ** 2 + (K.n(x * .025, y * .025, 7) - .5) * .5;
  const frost = mode === 'morning';
  const FROSTC = [[206, 216, 222], [226, 232, 236]], mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  K.ground((x, y) => {
    const td = trailD(x, y) + (K.n(x * .3, y * .3, 9) - .5) * 1.6, bd = brook(x, y), gl = glade(x, y);
    // the brook: clear and quick, its sandy bed showing, streaks running with it; pebbles laid where the path crosses
    if (bd < 2.6) { if (td < 8.5) { const p = g.pebAt(x, y, 77, .3); if (!p) return GW.str[1]; const pal = GW.pebbleW, lit = p.oy - p.ox * .6 + (p.id - .5) * .3; return pal[lit > .3 ? 3 : lit > 0 ? 2 : lit > -.35 ? 1 : 0] }
      const s = K.n(x * .5 - y * .3, y * .4 + x * .1, 11); return s > .78 ? [168, 196, 204] : K.q(GW.str, .35 + (2.6 - bd) * .18 + (s - .5) * .4, x, y, .5) }
    if (bd < 4) { if (td < 8.5) { const p = g.pebAt(x, y, 77, .22); if (p) return GW.pebble[p.oy - p.ox * .6 > .1 ? 3 : 2] } return K.q(GW.mud, K.n(x * .3, y * .3, 12), x, y) }
    // the path: trodden earth, a paler line worn in its middle, needles and leaves at its edges
    if (td < 8) { let c = K.q(G.road, K.f(x * .1, y * .1, 13) * .9 + (td < 2.5 ? .12 : 0) - (td > 6 ? .15 : 0), x, y); if (frost && td > 5 && K.h2(x, y, 14) < .3) c = mixc(c, FROSTC[0], .5); return K.grain(c, x, y) }
    if (td < 9.2) return G.edge[K.h2(x, y, 15) < .5 ? 0 : 1];
    // under the spruces: deep moss, drifts of brown needles; out on the glade: grass, dry at its edges
    if (gl > 1) { const nd = K.n(x * .06, y * .06, 16); let c = nd > .66 ? K.q(BG.spruceN, K.n(x * .3, y * .3, 17), x, y) : K.q(BG.spruce, K.f(x * .08, y * .08, 18) * .85 + .05, x, y); return K.grain(c, x, y) } // (no frost under the spruces: their crowns keep the night's warmth in)
    let c = K.n(x * .07, y * .07, 20) > .76 ? BG.gladeS[K.h2(x, y, 21) < .5 ? 0 : 1] : K.q(G.grass, K.f(x * .06, y * .06, 22) * .85 + .08, x, y);
    // hoar frost on the open grass after a clear night, never near the warm spring water
    if (frost) { const away = Math.min(bd, Math.hypot(x - SPR[0], (y - SPR[1]) * 1.3)) > 9, cover = (K.n(x * .07, y * .07, 23) * .6 + .55) * Math.min(1, (gl < .7 ? 1 : (1 - gl) * 3.3));
      if (away && cover > .5 + .5 * g.bay(x, y)) c = K.h2(x, y, 24) < .04 ? [244, 248, 252] : mixc(c, FROSTC[K.h2(x, y, 25) < .5 ? 0 : 1], .55) }
    return K.grain(c, x, y);
  });
  // leaves fallen from the birches, needles under the spruces
  { const r = g.mulberry(3); for (let i = 0; i < 140; i++) { const x = r() * 400, y = r() * 260; if (brook(x, y) < 4) continue; K.leaf(x, y, glade(x, y) > 1 ? (r() < .7 ? 'needle' : 'birch') : (r() < .7 ? 'birch' : 'aspen'), .2 + r() * .4, r) } }
  // ---- the spring: a low log frame round the basin, clear water welling up through sand, a gabled shelter
  // behind it with a dipper on a nail, a hollowed log trough carrying the overflow down to the brook ----
  const LOG = [[70, 50, 36], [104, 78, 54], [134, 104, 72], [160, 130, 92]], END = [[180, 150, 104], [140, 108, 72]], WAT = [[40, 76, 86], [58, 100, 110], [92, 140, 146], [150, 190, 192]];
  const spring = K.make(30, 22, 15, 18, s => {
    // back and side logs seen from above, the water inside, the front log toward us
    for (let x = 2; x < 28; x++) { s.set(x, 4, LOG[2]); s.set(x, 5, LOG[1]) }
    for (let y = 5; y < 16; y++) { s.set(2, y, LOG[2]); s.set(3, y, LOG[1]); s.set(26, y, LOG[2]); s.set(27, y, LOG[0]) }
    for (let y = 6; y < 15; y++) for (let x = 4; x < 26; x++) { const dx = (x - 15) / 6, dy = (y - 10) / 3.4, r = dx * dx + dy * dy; let c = r < 1 ? WAT[1] : WAT[0]; if (r < .35) c = [168, 154, 112]; if (Math.abs(r - .35) < .12 || (Math.abs(r - .9) < .1 && (x + y) % 2)) c = WAT[3]; if (y === 6) c = WAT[0]; s.set(x, y, c) }
    for (let x = 1; x < 29; x++) { s.set(x, 15, LOG[3]); s.set(x, 16, LOG[2]); s.set(x, 17, LOG[1]); s.set(x, 18, LOG[0]) }
    for (const ex of [1, 28]) { s.set(ex, 16, END[0]); s.set(ex, 17, END[1]) }
  });
  const shelter = K.make(36, 34, 18, 31, s => { // two posts behind the frame, a little gable roof of boards
    const P = [[86, 64, 44], [118, 90, 62]], R = [[62, 46, 34], [92, 70, 48], [122, 94, 64], [150, 120, 84]];
    for (const px of [5, 30]) for (let y = 12; y <= 31; y++) { s.set(px, y, P[1]); s.set(px + 1, y, P[0]) }
    for (let y = 0; y < 13; y++) { const half = 3 + y * 1.3; for (let x = Math.round(18 - half); x <= Math.round(18 + half); x++) { const left = x < 18; s.set(x, y + 2, R[(x + y) % 4 === 0 ? 0 : left ? 3 - (y > 9 ? 1 : 0) : 1 + (y > 9 ? 0 : 1)]) } }
    for (let x = 1; x < 36; x++) s.set(x, 15, R[0]);
    s.set(18, 18, [180, 186, 190]); s.set(19, 18, [140, 146, 150]); s.set(18, 19, [120, 126, 130]); // the dipper on its nail
  });
  const trough = K.make(34, 14, 2, 4, s => { // a split log with a channel cut in it, sloping down to the right
    for (let i = 0; i < 32; i++) { const y = 2 + Math.round(i * .3); s.set(i + 1, y, LOG[3]); s.set(i + 1, y + 1, i % 3 ? WAT[2] : WAT[3]); s.set(i + 1, y + 2, LOG[1]); s.set(i + 1, y + 3, LOG[0]) }
    for (const [x, y] of [[33, 13], [32, 12], [33, 11]]) s.set(x, y, [210, 228, 230]); // the overflow spilling into the brook
    s.set(8, 6, LOG[0]); s.set(8, 7, LOG[0]); s.set(24, 11, LOG[0]); // the little props under it
  }, [.4, .6]);
  K.put(shelter, SPR[0], SPR[1] - 9, { z: SPR[1] - 9 });
  K.put(spring, SPR[0], SPR[1] + 6, { shadow: false, z: SPR[1] + 6 });
  K.put(trough, SPR[0] + 13, SPR[1] + 4, { shadow: false, blob: false, z: SPR[1] + 7 });
  // ---- the well: a log frame, a windlass drum with its crank, a gable roof on two posts, a bucket on the rim ----
  const well = K.make(28, 40, 14, 37, s => {
    for (let c = 0; c < 6; c++) { const y = 27 + c * 2 - 0; for (let x = 3; x < 25; x++) { s.set(x, y, LOG[3 - (c === 5 ? 2 : 0)]); s.set(x, y + 1, LOG[1]) } s.set(2, y, END[0]); s.set(25, y, END[0]); s.set(2, y + 1, END[1]); s.set(25, y + 1, END[1]) }
    for (let x = 5; x < 23; x++) { s.set(x, 25, LOG[2]); s.set(x, 26, [20, 18, 16]) } // the dark mouth
    for (const px of [4, 22]) for (let y = 6; y < 26; y++) { s.set(px, y, LOG[2]); s.set(px + 1, y, LOG[0]) }
    for (let x = 5; x < 22; x++) { s.set(x, 15, LOG[3]); s.set(x, 16, LOG[1]) } // the drum
    for (let x = 6; x < 20; x += 3) s.set(x, 17, [90, 90, 96]); s.set(13, 18, [90, 90, 96]); s.set(13, 19, [90, 90, 96]); // chain wound on it
    s.set(24, 15, [80, 80, 86]); s.set(25, 15, [80, 80, 86]); s.set(25, 16, [80, 80, 86]); s.set(25, 17, [80, 80, 86]); s.set(26, 17, [100, 100, 106]); // the crank
    const R = [[58, 44, 34], [88, 66, 46], [116, 88, 60], [142, 112, 78]];
    for (let y = 0; y < 9; y++) { const half = 3 + y * 1.4; for (let x = Math.round(14 - half); x <= Math.round(14 + half); x++) s.set(x, y + 1, R[(x + y) % 5 === 0 ? 0 : x < 14 ? 3 : 1]) }
    for (let x = 18; x < 23; x++) s.set(x, 23, [96, 98, 104]); for (let x = 18; x < 23; x++) s.set(x, 24, [70, 72, 78]); // the bucket
  });
  K.put(well, 308, 92);
  // ---- the map board: a roofed stand with the trail map under glass, and a signpost at the fork ----
  const board = K.make(30, 30, 15, 28, s => {
    const P = [[86, 64, 44], [118, 90, 62]]; for (const px of [5, 23]) for (let y = 6; y <= 28; y++) { s.set(px, y, P[1]); s.set(px + 1, y, P[0]) }
    for (let x = 1; x < 29; x++) { s.set(x, 3, [70, 52, 38]); s.set(x, 4, [112, 86, 60]); s.set(x, 5, [92, 70, 48]) } // the little roof
    for (let y = 7; y < 20; y++) for (let x = 4; x < 26; x++) { const b = y === 7 || y === 19 || x === 4 || x === 25; s.set(x, y, b ? [96, 72, 50] : [212, 200, 160]) }
    // a tiny map: forest, the bay, the trails in orange, a red "you are here"
    for (let y = 8; y < 19; y++) for (let x = 5; x < 25; x++) { const n = K.n(x * .5, y * .5, 99); let c = n > .55 ? [86, 120, 74] : n > .4 ? [176, 168, 112] : [200, 140, 70]; if (y < 11 && x > 12) c = [96, 140, 176]; if ((x + 2 * y) % 9 === 0) c = [212, 120, 50]; s.set(x, y, c) }
    s.set(10, 15, [220, 40, 34]); s.set(11, 15, [220, 40, 34]);
  });
  K.put(board, 246, 172);
  const sign = K.make(30, 32, 15, 30, s => { // a post with three arrow boards: to the bay, north, back south to the forester's
    const P = [[86, 64, 44], [118, 90, 62]], B = [[106, 82, 54], [154, 126, 86], [194, 166, 120], [214, 190, 146]];
    for (let y = 2; y <= 30; y++) { s.set(14, y, P[1]); s.set(15, y, P[0]) }
    const brd = (x0, x1, y, dir) => { for (let x = x0; x <= x1; x++) { s.set(x, y, B[3]); s.set(x, y + 1, B[2]); s.set(x, y + 2, B[1]) } const t = dir > 0 ? x1 + 1 : x0 - 1; s.set(t, y + 1, B[2]); s.set(t + dir, y + 1, B[1]); s.set(t, y, B[1]); s.set(t, y + 2, B[0]); for (let x = x0 + 2; x <= x1 - 2; x += 2) s.set(x, y + 1, [74, 54, 36]) };
    brd(16, 27, 4, 1); brd(3, 13, 9, -1); brd(16, 25, 14, 1);
  });
  K.put(sign, 222, 140);
  // ---- a bench by the spring: a split-log seat on two stumps ----
  const bench = K.make(24, 9, 12, 8, s => { for (let x = 1; x < 23; x++) { s.set(x, 2, LOG[3]); s.set(x, 3, LOG[2]); s.set(x, 4, LOG[0]) } for (const px of [4, 18]) for (let y = 5; y < 9; y++) { s.set(px, y, LOG[1]); s.set(px + 1, y, LOG[0]) } });
  K.put(bench, 84, 142);
  // ---- trees: spruces close round the glade, birches at its edge, a rowan with berries ----
  const r = g.mulberry(mode === 'day' ? 41 : 41);
  const spruces = [[18, 40, 1.15], [52, 18, 1.05], [10, 110, 1.2], [34, 86, 1], [380, 46, 1.2], [352, 20, 1.05], [392, 160, .95], [16, 214, 1.1], [48, 252, 1.15], [372, 228, .9], [110, 18, 1], [270, 26, .95], [160, 40, .7]];
  spruces.forEach(([x, y, sz], i) => K.put(K.spr('spruce', 300 + i * 7, { sz }), x, y));
  [[68, 186, 1], [86, 64, .95], [338, 176, 1], [360, 104, .9], [290, 40, .85], [150, 228, .8]].forEach(([x, y, sz], i) => K.put(K.spr('birch', 500 + i * 11, { sz }), x, y));
  K.put(K.spr('rowan', 707, { sz: .9 }), 64, 120);
  // undergrowth: ferns and bilberry under the spruces, grass tufts and a juniper on the glade, mushrooms
  const ug = [['fern', 30, 64], ['fern', 380, 130], ['fern', 24, 160], ['lowshrub', 60, 96], ['lowshrub', 330, 64], ['juniper', 282, 196], ['bush', 112, 214], ['mush', 40, 132], ['mush', 362, 196], ['stump', 160, 64], ['rock', 92, 100], ['log', 330, 132]];
  ug.forEach(([t, x, y], i) => K.put(K.spr(t, 900 + i * 13, t === 'mush' ? 'conif' : null), x, y));
  for (let i = 0; i < 30; i++) { const x = 20 + r() * 360, y = 20 + r() * 230; if (trailD(x, y) < 11 || brook(x, y) < 6 || Math.hypot(x - SPR[0], y - SPR[1]) < 24 || Math.hypot(x - 308, y - 84) < 18 || Math.hypot(x - 246, y - 166) < 16) continue; K.put(K.spr('grass', 1000 + i), x, y) }
  K.put(K.rider(0, 2), 214, 180);
  K.shadowA = mode === 'morning' ? .34 : .3;
  K.render(ctx => {
    if (mode === 'day') { K.grade(); return }
    // a cold clear morning: low warm light, the frost, steam rising off the spring and the brook (the water is
    // warmer than the frozen air), a thin mist lying in the spruces
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(214,206,214)'; ctx.fillRect(0, 0, 400, 260); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const gr = ctx.createLinearGradient(0, 0, 400, 0); gr.addColorStop(0, 'rgba(255,170,96,.22)'); gr.addColorStop(.6, 'rgba(255,160,90,.05)'); gr.addColorStop(1, 'rgba(255,160,90,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, 400, 260); ctx.restore();
    const puff = (x, y, rad, a) => { const r = ctx.createRadialGradient(x, y, 0, x, y, rad); r.addColorStop(0, `rgba(240,242,246,${a})`); r.addColorStop(1, 'rgba(240,242,246,0)'); ctx.fillStyle = r; ctx.save(); ctx.translate(x, y); ctx.scale(1.4, 1); ctx.translate(-x, -y); ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); ctx.restore() };
    for (let k = 0; k < 7; k++) puff(SPR[0] + 2 + k * 2.2 + Math.sin(k) * 2, SPR[1] - 2 - k * 5, 7 + k * 1.3, .3 - k * .035);
    for (let i = 1; i < ST.length - 1; i++) for (let k = 0; k < 3; k++) puff(ST[i][0] + k * 3, ST[i][1] - 3 - k * 5, 6 + k * 2, .16 - k * .04);
    const wisp = (x, y, h, a) => { for (let k = 0; k < h; k++) { const t = k / h, wx = x + Math.sin(k * .35 + x) * 2.2 + t * 6, al = a * (1 - t) * (k < 2 ? k / 2 : 1); ctx.fillStyle = `rgba(236,240,244,${al})`; ctx.fillRect(Math.round(wx) - 1, Math.round(y - k), 3, 1); if (k % 3 === 0) ctx.fillRect(Math.round(wx) - 2, Math.round(y - k), 5, 1) } };
    for (const [x, y, h] of [[108, 122, 24], [114, 124, 30], [120, 123, 28], [127, 122, 20], [150, 134, 16]]) wisp(x, y, h, .4);
    for (let i = 1; i < ST.length - 1; i++) { const [x, y] = ST[i]; wisp(x, y, 12, .22); wisp((x + ST[i + 1][0]) / 2, (y + ST[i + 1][1]) / 2, 10, .18) }
    // mist among the spruces, thinning over the glade
    for (let y = 0; y < 260; y++) for (let x = 0; x < 400; x += 2) { const gl = glade(x, y); if (gl < .8) continue; const n = K.n(x * .02 + 3, y * .05, 61), a = Math.min(.22, (n - .45) * .8) * Math.min(1, (gl - .8) * 3); if (a > 0) { ctx.fillStyle = `rgba(226,230,236,${a})`; ctx.fillRect(x, y, 2, 1) } }
  });
}
