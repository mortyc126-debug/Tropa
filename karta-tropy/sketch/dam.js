// Дамба через залив: насыпь с водопропуском и фонарными столбами (без перил). День и вечер.
window.SCENE = () => {
  const out = {};
  for (const mode of ['day', 'dusk']) { build(mode); out['dam_culvert_' + mode] = K.out() }
  return out;
};
function build(mode) {
  K.init(400, 260); const g = K.g, GW = g.GW, G = g.G, PAL = g.PAL;
  const cy = x => 126 + 3 * Math.sin(x * .011 + .6) + 2 * Math.sin(x * .027);
  const CUL = 262; // the culvert
  const N_EDGE = -20, N_VERGE = -17, ROAD0 = -12, ROAD1 = 10, S_VERGE = 15, WALL = 32;
  // jagged stones: a jittered grid, shaded from the upper left
  const stone = (x, y, S, sd) => { const gx = x / S, gy = y / S, ix = Math.floor(gx), iy = Math.floor(gy); let d1 = 9, d2 = 9, id = 0, ox = 0, oy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const a = ix + i, b = iy + j, cx = a + .15 + .7 * K.h2(a, b, sd), cy2 = b + .15 + .7 * K.h2(a, b, sd + 1), dx = gx - cx, dy = (gy - cy2) * 1.25, d = dx * dx + dy * dy;
      if (d < d1) { d2 = d1; d1 = d; id = K.h2(a, b, sd + 2); ox = dx; oy = dy } else if (d < d2) d2 = d }
    return { gap: Math.sqrt(d2) - Math.sqrt(d1), id, ox, oy } };
  const BAY = g.P(['#22394a', '#284456', '#2e4e60', '#36596b', '#466a7a', '#5f8090']), BAYS = g.P(['#2c4a5a', '#335465', '#3a5e6e', '#446878', '#557888']);
  const lakeN = (x, y) => { // the open bay: darker, choppy, wind streaks and white horses
    const n = K.n(x * .05, y * .12, 31) * .6 + K.n(x * .16, y * .5, 32) * .4; let c = K.q(BAY, .25 + n * .5, x, y, .5);
    const st = K.n(x * .05 + y * .01, y * .75, 33); if (st > .76) c = BAY[4]; if (st > .87) c = [150, 176, 186];
    return c };
  const lakeS = (x, y) => { // the inner bay: calm, the sky lying on it in long slow bands
    const n = K.n(x * .03, y * .09, 41); let c = K.q(BAYS, .25 + n * .45, x, y, .5);
    if (K.n(x * .025, y * .55, 42) > .8) c = BAYS[3]; return c };
  K.ground((x, y) => {
    const d = y - cy(x), e1 = K.n(x * .2, 1, 51) * 2 - 1, e2 = K.n(x * .17, 2, 52) * 2 - 1;
    if (d < N_EDGE + e1) { // north water; foam where the waves hit the stones
      if (d > N_EDGE + e1 - 3 && K.n(x * .3 - 2, y * .4, 53) > .5 - (d - N_EDGE) * .06) return [214, 226, 228];
      // the culvert's intake: water drawn in, a dark eddy with a ring of foam
      const ix = x - CUL, iy = d - N_EDGE; if (ix * ix / 90 + iy * iy / 20 < 1) return K.n(x * .4, y * .4, 54) > .62 ? [170, 192, 200] : BAY[0];
      return lakeN(x, y) }
    if (d < N_VERGE + e1) { const s = stone(x, y, 3.6, 61); if (s.gap < .12) return [52, 50, 46]; const lit = s.oy * -.8 - s.ox * .5 + (s.id - .5) * .4; return K.q(PAL.stone, .5 + lit, x, y, .4) }
    if (d < ROAD0 + e1 * .6) return K.grain(K.q(K.h2(x, y, 62) < .4 ? PAL.straw : PAL.sedge, .4 + K.n(x * .3, y * .3, 63) * .5, x, y), x, y);
    if (d < ROAD1 + e2 * .6) { // the road: packed gravel, two ruts, a crown in the middle
      const rr = Math.min(Math.abs(d + 6), Math.abs(d - 4)); if (rr < 1) return G.rut;
      if (d < ROAD0 + 1.5 + e1 || d > ROAD1 - 1.5 + e2) return G.edge[K.h2(x, y, 64) < .5 ? 0 : 1];
      let c = K.q(G.road, K.f(x * .09, y * .09, 65) + (Math.abs(d + 1) < 2 ? .08 : 0), x, y); if (K.h2(x, y, 66) < .05) c = PAL.stone[3]; return K.grain(c, x, y) }
    if (d < S_VERGE + e2) return K.grain(K.q(K.h2(x, y, 67) < .45 ? PAL.straw : PAL.sedge, .4 + K.n(x * .3, y * .3, 68) * .5, x, y), x, y);
    const wb = WALL + K.n(x * .15, 3, 69) * 1.6;
    if (d < wb) { // the stone face turned toward us: a lit lip, rough blocks below, darker toward the water
      const t = (d - S_VERGE - e2) / (wb - S_VERGE - e2);
      if (Math.abs(x - CUL) < 8) { // the culvert's arch
        const ax = (x - CUL) / 7, ay = (d - (wb - 1)) / 11, r = ax * ax + ay * ay;
        if (r < 1) { if (r > .62) { const s = stone(x, y, 2.4, 71); return s.gap < .14 ? [60, 58, 54] : K.q(PAL.stone, .78 - ay * .1 - r * .3, x, y, .4) } return [18 + 10 * (1 + ay), 22 + 10 * (1 + ay), 26 + 12 * (1 + ay)] } }
      if (t < .12) return PAL.stone[3];
      const s = stone(x, y * 1.15, 4.4, 72); if (s.gap < .1) return [40, 38, 36];
      const lit = -s.oy * .9 - s.ox * .5 + (s.id - .5) * .5 - t * .55; let c = K.q(K.h2(Math.floor(x / 5), Math.floor(y / 4), 73) < .25 ? PAL.stoneW : PAL.stone, .45 + lit * .6, x, y, .45);
      if (t > .8 && K.n(x * .3, y, 74) > .45) c = PAL.moss[1 + (K.h2(x, y, 75) < .5 ? 1 : 0)]; // a green wet band at the waterline
      return c }
    // south water: calm; the wall's dark reflection; the culvert's outflow fanning out with streaks and foam
    let c = lakeS(x, y); const r = d - wb;
    if (r < 6 && Math.abs(x - CUL) > 9) c = c.map(v => v * (.72 + .045 * r));
    if (r < 1.2) c = [34, 40, 44];
    // the outflow: a narrow tongue of quicker, lighter water with streaks running out of it, foam only at the mouth
    const fx = x - CUL, fan = Math.abs(fx) - 3 - r * .32, k = 1 - r / 38;
    if (fan < 0 && r < 38) { const s = K.n(fx * .7 + 9, r * .3, 76); c = BAYS[2]; if (s > .62 - .12 * k) c = BAYS[4]; if (r < 5 && s > .55) c = [196, 212, 216] }
    else if (fan < 3 && r < 30 && K.n(fx * .7 + 9, r * .3, 77) > .7) c = BAYS[3];
    return c;
  });
  // leaves blown onto the road and the verges
  { const r = g.mulberry(9); for (let i = 0; i < 70; i++) { const x = r() * 400, d = -16 + r() * 30; K.leaf(x, cy(x) + d, ['birch', 'aspen', 'maple', 'curl'][Math.floor(r() * 4)], .25 + r() * .4, r) } }
  // the culvert's concrete headwalls on both verges, with striped marker posts at their ends
  const head = (side) => { const w = 20, s = new g.Spr(w + 4, 12); for (let x = 2; x < w + 2; x++) { s.set(x, 8, [138, 136, 128]); s.set(x, 9, [104, 102, 96]); s.set(x, 10, [88, 86, 80]); if (K.h2(x, side, 81) < .2) s.set(x, 8, [120, 118, 110]) }
    for (const px of [1, w + 2]) for (let y = 0; y < 10; y++) s.set(px, y, y < 2 ? [236, 234, 226] : (y >> 1) % 2 ? [44, 40, 38] : [236, 234, 226]);
    s.outline(.4, .6); return { s, cv: s.canvas(), ax: 2 + w / 2, ay: 10 } };
  K.put(head(1), CUL, cy(CUL) + S_VERGE - 2, { z: cy(CUL) + 13 });
  K.put(head(-1), CUL, cy(CUL) + N_VERGE + 3, { z: cy(CUL) - 15 });
  // lamp posts: tarred wooden poles on the north verge, a cross-arm with two white insulators for the wires,
  // and a curved iron arm holding a dish lamp out over the road
  const poles = [64, 338], lamps = [];
  const pole = (seed) => { const H = 46, s = new g.Spr(24, H + 4), bx = 6; const wd = [[74, 56, 42], [96, 74, 54], [58, 44, 34]];
    for (let y = 4; y <= H; y++) { const lean = y < 20 ? 1 : 0; s.set(bx + lean, y, wd[1]); s.set(bx + 1 + lean, y, wd[2]); if (K.h2(y, 3, seed) < .15) s.set(bx + lean, y, wd[0]) }
    for (let x = 0; x <= 12; x++) s.set(x, 7, [70, 56, 44]); for (const ix of [1, 11]) { s.set(ix, 6, [232, 232, 226]); s.set(ix, 5, [232, 232, 226]) }
    // the iron arm and the lamp
    for (let x = bx + 2; x <= 19; x++) s.set(x, 12 - (x > 15 ? 1 : 0), [62, 64, 66]); s.set(20, 12, [62, 64, 66]); s.set(20, 13, [62, 64, 66]);
    for (let x = 17; x <= 23; x++) s.set(x, 14, [52, 56, 58]); for (let x = 18; x <= 22; x++) s.set(x, 15, [84, 88, 90]); s.set(20, 16, mode === 'dusk' ? [255, 236, 170] : [196, 196, 180]);
    s.set(bx - 1, H, wd[2]); s.set(bx + 3, H, wd[2]); s.outline(.4, .6); return { s, cv: s.canvas(), ax: bx + 1, ay: H } };
  for (const px of poles) { const y = cy(px) + N_VERGE + 2, o = K.put(pole(px), px, y); lamps.push({ x: px + 13, y: y - 46 + 16, gy: cy(px) - 1 }); o.wires = [[px - 6, y - 46 + 5], [px + 4, y - 46 + 5]] }
  // wires, sagging from pole to pole and on out of the picture
  K.draw(1e4, ctx => { ctx.fillStyle = 'rgba(28,24,22,.8)';
    for (const k of [0, 1]) { const pts = [[-20, null]]; const A = [poles[0] - 6 + k * 10, cy(poles[0]) + N_VERGE + 2 - 41], B = [poles[1] - 6 + k * 10, cy(poles[1]) + N_VERGE + 2 - 41];
      const span = (a, b, sag) => { const n = Math.ceil(Math.abs(b[0] - a[0])); for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t + sag * 4 * t * (1 - t); ctx.fillRect(Math.round(x), Math.round(y), 1, 1) } };
      span([A[0] - 274, A[1] - 2], A, 9); span(A, B, 9); span(B, [B[0] + 274, B[1] + 1], 9) } });
  // the old wooden marker posts along the south verge
  for (let x = 20; x < 400; x += 46) if (Math.abs(x - CUL) > 16) K.put(g.MAKERS.post(g.mulberry(x), x), x, cy(x) + S_VERGE - 2, { blob: false });
  // dry grass, willow bushes, a rosehip on the verges; reeds in the calm water at the foot of the wall
  const r = g.mulberry(5);
  for (let i = 0; i < 26; i++) { const x = 8 + r() * 384, side = r() < .5; if (Math.abs(x - CUL) < 14) continue; K.put(K.spr('grass', 100 + i), x, cy(x) + (side ? N_VERGE + 2 + r() * 2 : ROAD1 + 2 + r() * 2)) }
  K.put(K.spr('bush', 7), 120, cy(120) + N_VERGE + 3); K.put(K.spr('bush', 31), 300, cy(300) + S_VERGE - 1); K.put(K.spr('rosehip', 12), 214, cy(214) + S_VERGE - 1);
  for (let i = 0; i < 16; i++) { const x = 6 + r() * 388; if (Math.abs(x - CUL) < 26) continue; K.put(K.spr('reed', 200 + i), x, cy(x) + WALL + 6 + r() * 26, { shadow: false }) }
  K.put(K.rider(90, 5), 156, cy(156) - 1);
  K.shadowA = mode === 'dusk' ? .12 : .3;
  K.render(ctx => {
    if (mode === 'day') { K.grade(); return }
    // dusk: the light of 19:00 with low cloud; the lamps lit, a warm pool under each on the road and the verge
    const L = []; for (const l of lamps) { L.push({ x: l.x, y: l.gy, r: 34, sy: .55, c: '255,214,150', a: .5 }); L.push({ x: l.x, y: l.y + 1, r: 8, c: '255,236,190', a: .7 }) }
    L.push({ x: 156 + 14, y: cy(156) - 8, r: 18, c: '255,226,180', a: .18 }); // the bicycle's own lamp
    K.dusk([96, 98, 142], L);
    ctx.fillStyle = 'rgb(255,244,210)'; for (const l of lamps) ctx.fillRect(l.x - 1, l.y, 3, 1);
  });
}
