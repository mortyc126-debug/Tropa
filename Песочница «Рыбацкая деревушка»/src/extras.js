// =====================================================================================================================
// THE VILLAGE'S EXTRAS: what stands on the jetty, the guard's booth and the barrier at the end of the dam, the haystack and the cows,
// the electric boxes and lamps of the houses, the transformer.
// =====================================================================================================================
// ---- on the jetty: a bollard for the mooring ropes, a coil of rope, a lantern on a post ----
PF.bollard = ({ seed = 1 } = {}) => { const sp = t3sprite(() => { const M = T3(); M.seed = seed; t3cyl(M, 0, 0, 2.1, 0, 4.4, [58, 56, 54], { topCol: [92, 90, 86] }); t3cyl(M, 0, 0, 3, 0, 1.2, [50, 48, 46], { topCol: [74, 72, 68] }); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-2.6, -2.6, 2.6, 2.6]].map(t3w) } };
PF.coil = ({ seed = 1, col = [176, 150, 104] } = {}) => { const sp = t3sprite(() => { const M = T3(); M.seed = seed; const rings = (x, n) => { const r = Math.hypot(x, n); return r < 1.3 ? null : (Math.round(r * 1.6) % 2 ? col : cmul(col, .78)) };
    t3cyl(M, 0, 0, 4.2, 0, 2.2, col, { topCol: col, topTex: rings }); t3cyl(M, 0, 0, 1.5, 2.2, 3.4, cmul(col, .8), { topCol: cmul(col, .6) }); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [] } };
// a post with a lantern on the top: the glass lights at night; c the colour of its light, flick: a worn lantern that flickers
PF.lantern = ({ h = 24, c = '255,200,120', flick = false, seed = 1 } = {}) => { const sp = t3sprite(() => { const M = T3(); M.seed = seed;
    t3cyl(M, 0, 0, 1.3, 0, h, [92, 70, 50], { topCol: [140, 112, 84] }); t3box(M, -2.6, -2.6, h, 2.6, 2.6, h + .8, [60, 60, 64]);
    for (const [a, b, c2, d] of [[-2.2, -2.2, 2.2, -2.2], [-2.2, 2.2, 2.2, 2.2], [-2.2, -2.2, -2.2, 2.2], [2.2, -2.2, 2.2, 2.2]]) t3face(M, [[a, b, h + .8], [c2, d, h + .8], [c2, d, h + 5], [a, b, h + 5]], [176, 196, 190], [0, 0, h + 3], { inside: true, fabric: true, clean: true });
    t3face(M, [[-2.8, -2.8, h + 5], [2.8, -2.8, h + 5], [2.8, 2.8, h + 5], [-2.8, 2.8, h + 5]], [60, 60, 64], [0, 0, h + 3]); t3line(M, [0, 0, h + 5], [0, 0, h + 6.6], [60, 60, 64]); return M }, [0, 1]);
  const [rr, gg, bb] = c.split(',').map(Number);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, night: sp[1].s, solids: [[-1.6, -1.6, 1.6, 1.6]].map(t3w),
    lights: [{ x: 0, y: -(h + 3), r: 8, c, a: .9, k: 'lamp', glare: true, flick }, { x: 0, y: 0, r: 70, sy: .62, c, a: .85, k: 'lamp', fall: 'sq', tint: `${Math.min(255, rr + 20)},${Math.min(255, gg + 24)},${Math.min(255, bb + 30)}`, flick }] } };

// ---- the guard's booth at the end of the dam: a green board cabin, a sliding window onto the road, a door in the east wall, a tar-paper shed roof
// with a stovepipe, a sign, a lamp over the door; the window is lit at night ----
PF.booth = ({ w = 22, d = 13, h = 23, col = [88, 122, 100], seed = 4, sign = 'ОХРАНА', K = 1.16 } = {}) => {
  const HW = w / 2, WALL = h, winW = 13, winZ0 = 9.5, winH = 7.6, TRIM = [214, 210, 192], CON = [130, 128, 122], roofC = [66, 68, 72];
  const wallT = (x, n, z) => { const row = Math.floor(z / 2.2), f = z / 2.2 - row; if (f < .12) return cmul(col, .62); let c = cmul(col, .94 + .12 * h2(row, 3, seed));
    if (z > WALL - 4.5 && vn(x * .25, z * .1, seed + 3) > .55) c = cmix(c, [150, 84, 52], .5); // rust running down from the roof edge
    if (z < 7 && vn(x * .3, n * .3 + z * .4, seed + 5) > .5) c = cmix(c, [124, 114, 94], .55); // the paint dried and flaked off at the foot
    if (h2(Math.floor(x), Math.floor(z), seed + 9) < .012) c = cmul(c, .6); return c };
  const build = () => { const M = T3(), ctr = [0, d / 2, WALL / 2]; M.seed = seed;
    t3box(M, -HW - 1, -1, 0, HW + 1, d + 1, 2.5, CON, { tex: (x, n, z) => h2(Math.floor(x / 4), Math.floor(n / 4), seed) < .25 ? cmul(CON, .8) : CON });
    t3face(M, [[-HW, 0, 2.5], [HW, 0, 2.5], [HW, 0, WALL], [-HW, 0, WALL]], col, ctr, { tex: wallT });
    t3face(M, [[-HW, d, 2.5], [HW, d, 2.5], [HW, d, WALL], [-HW, d, WALL]], col, ctr, { tex: wallT });
    t3face(M, [[-HW, 0, 2.5], [-HW, d, 2.5], [-HW, d, WALL], [-HW, 0, WALL]], col, ctr, { tex: wallT });
    t3face(M, [[HW, 0, 2.5], [HW, d, 2.5], [HW, d, WALL], [HW, 0, WALL]], col, ctr, { tex: (x, n, z) => wallT(n, x, z) });
    for (const sx of [-1, 1]) t3box(M, sx * HW - 1, -.8, 2.5, sx * HW + 1, .4, WALL, TRIM, { zb: .3 });
    // the roof: one slope, falling to the road (the south), a lip all round, the tar paper patched
    const rz0 = WALL + 3.6, rz1 = WALL + 1.4;
    t3face(M, [[-HW - 2.4, -3, rz1], [HW + 2.4, -3, rz1], [HW + 2.4, d + 2, rz0], [-HW - 2.4, d + 2, rz0]], roofC, [0, d / 2, 0], { tex: (x, n, z) => { const sh = Math.floor((x + HW) / 4.6); let c = cmul(roofC, .92 + .12 * h2(sh, 1, seed + 7)); if (vn(x * .3, n * .3, seed + 8) > .72) c = cmix(c, [112, 104, 84], .5); if (h2(sh, Math.floor(n / 3), seed + 12) < .06) c = cmix(c, [150, 84, 52], .5); return c } });
    t3box(M, -HW - 2.4, -3.4, rz1 - .6, HW + 2.4, -2.6, rz1 + .4, [150, 150, 144]); // the front edge
    t3face(M, [[HW + 2.4, -3, rz1], [HW + 2.4, d + 2, rz0], [HW + 2.4, d + 2, rz0 - 1], [HW + 2.4, -3, rz1 - 1]], [128, 126, 120], null, { both: true, zb: .2 });
    t3cyl(M, HW - 5.5, d - 4, 1.5, WALL, WALL + 13, [112, 106, 100], { topCol: [60, 56, 54] }); t3cyl(M, HW - 5.5, d - 4, 2.6, WALL + 13, WALL + 14.2, [86, 82, 80], { topCol: [60, 56, 54] });
    t3line(M, [-HW + 4, d - 3, WALL + 3], [-HW + 4, d - 3, WALL + 15], [70, 72, 76]); for (let q = 0; q < 3; q++) t3line(M, [-HW + 1.5 + q * .8, d - 3, WALL + 9 + q * 2], [-HW + 6.5 - q * .8, d - 3, WALL + 9 + q * 2], [70, 72, 76]);
    // the window onto the road: a frame, two sliding sashes, a counter inside; the sign over it
    const cx = -2, fx0 = cx - winW / 2 - 1.2, fx1 = cx + winW / 2 + 1.2;
    t3face(M, [[fx0, -.3, winZ0 - 1.2], [fx1, -.3, winZ0 - 1.2], [fx1, -.3, winZ0 + winH + 1.2], [fx0, -.3, winZ0 + winH + 1.2]], TRIM, null, { both: true, zb: .2 });
    t3face(M, [[cx - winW / 2, -.5, winZ0], [cx + winW / 2, -.5, winZ0], [cx + winW / 2, -.5, winZ0 + winH], [cx - winW / 2, -.5, winZ0 + winH]], [52, 66, 76], null, { both: true, inside: true, zb: .4,
      tex: (x, n, z) => (Math.abs(x - cx) < .5 || Math.abs(z - winZ0 - winH * .5) < .35 && false) ? TRIM : ((x - z * .6) % 7 < 1.1 ? [132, 156, 168] : null) });
    t3box(M, fx0 - .6, -2.6, winZ0 - 2.4, fx1 + .6, -.3, winZ0 - 1.2, [186, 156, 112]); // the sill, a board
    t3face(M, [[-HW + 1.5, -.35, WALL - 4.2], [HW - 5.5, -.35, WALL - 4.2], [HW - 5.5, -.35, WALL - 1.2], [-HW + 1.5, -.35, WALL - 1.2]], [214, 214, 206], null, { both: true, zb: .3 }); // the sign board
    // the door in the east wall: boards, a small window, a handle, a concrete step; over it a small caged lamp on a bracket
    t3face(M, [[HW + .3, 2.2, 2.5], [HW + .3, 8.6, 2.5], [HW + .3, 8.6, 17.4], [HW + .3, 2.2, 17.4]], [112, 78, 52], null, { both: true, zb: .3, tex: (x, n, z) => (z > 11 && z < 15.6 && n > 3.6 && n < 7.2) ? [52, 66, 76] : ((Math.floor(n * 1.5) % 3) === 0 ? [88, 60, 40] : [112, 78, 52]) });
    t3face(M, [[HW + .2, 1.6, 2.5], [HW + .2, 9.2, 2.5], [HW + .2, 9.2, 18], [HW + .2, 1.6, 18]], TRIM, null, { both: true, zb: .1 });
    t3box(M, HW + .5, 7.6, 8.6, HW + 1.1, 8.3, 10.2, [200, 190, 150], { clean: true });
    t3box(M, HW, .8, 0, HW + 5, 10.4, 1.8, CON);
    t3line(M, [HW + .4, 5.4, 20.6], [HW + 3.4, 5.4, 20.6], [64, 64, 68]); t3line(M, [HW + 1.6, 5.4, 18.2], [HW + 3.4, 5.4, 20.4], [64, 64, 68]); // the bracket
    t3box(M, HW + 2.6, 4.6, 19.2, HW + 4.6, 6.2, 21.4, [255, 232, 180], { clean: true }); for (const q of [4.6, 6.2]) t3line(M, [HW + 2.4, q, 19.2], [HW + 4.8, q, 21.6], [60, 60, 64]); t3box(M, HW + 2.4, 4.4, 21.4, HW + 4.8, 6.4, 22, [60, 60, 64], { clean: true }); // (a lamp in a wire cage)
    // the electricity: a small grey panel on the front wall by the east corner, a conduit up from it to the insulator under the eave, a black cable down from it
    // to the ground, which runs on over the ground to the barrier (the cable on the ground is another object: cable)
    const px0 = HW - 4.6, px1 = HW - 1.2;
    t3box(M, px0, -2.3, 7.4, px1, -.3, 14.6, [152, 156, 154], { tex: (x, n, z) => (n < -2.1 && z > 8.6 && z < 13.4 && x > px0 + .6 && x < px1 - .6) ? ((Math.abs(z - 11) < .35 || Math.abs(x - (px0 + px1) / 2) < .25) ? [128, 132, 130] : [166, 170, 168]) : [152, 156, 154] });
    t3box(M, px0 + 1.2, -2.7, 12.4, px0 + 2.6, -2.3, 13.4, [64, 64, 68], { clean: true }); // the handle
    t3line(M, [(px0 + px1) / 2, -1.2, 14.6], [(px0 + px1) / 2, -1.2, WALL - .8], [26, 26, 30]); t3line(M, [(px0 + px1) / 2 + .6, -1.2, 14.6], [(px0 + px1) / 2 + .6, -1.2, WALL - .8], [26, 26, 30]);
    t3box(M, (px0 + px1) / 2 - .9, -1.7, WALL - 1.9, (px0 + px1) / 2 + 1.5, -.2, WALL - .3, [236, 232, 220], { clean: true }); // the insulator
    t3line(M, [px1 - .8, -1.3, 7.4], [px1 - .8, -2.4, 3], [24, 24, 28]); t3line(M, [px1 - .8, -2.4, 3], [px1 + 1.4, -3.4, .4], [24, 24, 28]);
    // a stack of tyres, a bucket by the wall
    for (let q = 0; q < 3; q++) t3cyl(M, -HW + 4.2, -3.6, 3, q * 2.2, q * 2.2 + 2, [38, 38, 40], { topCol: [58, 58, 60] });
    t3cyl(M, -HW + 11, -3.2, 1.8, 0, 3.6, [186, 56, 44], { topCol: [90, 30, 26] });
    t3scale(M, K); return M };
  const sp = t3sprite(build, [0]), ax = sp[0].ax, ay = sp[0].ay, P = (x, n, z) => t3p([x * K, n * K, z * K]);
  t3text(sp, sign, [(-HW + 1.5 + HW - 5.5) / 2 * K, -.45 * K, (WALL - 3.5) * K], [44, 70, 54]);
  const q = P(-2, 0, winZ0 + winH / 2), a = P(-2 - winW / 2, -.5, winZ0 + winH), b = P(-2 + winW / 2, -.5, winZ0), lq = P(HW + 3.6, 5.4, 20.2);
  const WINS = [{ x0: Math.round(a[0]), y0: Math.round(a[1]), x1: Math.round(b[0]), y1: Math.round(b[1]), cx: Math.round(P(-2, -.5, 0)[0]), cz: Math.round(P(-2, -.5, winZ0 + winH * .62)[1]) }];
  const ch = P(HW - 5.5, d - 4, WALL + 15), e0 = P(-HW - 2.4, -3, WALL + 1.4), e1 = P(HW + 2.4, -3, WALL + 1.4);
  return { s: sp[0].s, ax, ay, night: null, wins: WINS, attach: P(HW - 2.9 + .3, -1, WALL - .5), smoke: [[ch[0], ch[1]]], drip: [[e0[0], e0[1], e1[0], e1[1], WALL + 1.4]],
    lights: [{ x: q[0], y: q[1], r: 14, c: '255,214,140', a: .7, k: 'window', win: 0 }, { x: q[0], y: 4, r: 38, sy: .5, c: '255,200,130', a: .4, k: 'window', win: 0 }, { x: lq[0], y: lq[1], r: 6, c: '255,226,170', a: .9, k: 'lamp', glare: true, flick: true }, { x: lq[0], y: 10, r: 34, sy: .6, c: '255,214,150', a: .55, k: 'lamp', fall: 'sq', flick: true }],
    solids: [[(-HW - 2) * K, (-d - 1) * K, (HW + 2) * K, K]].map(t3w) } };

// ---- the barrier at the entrance of the dam: a housing on the north verge and a red and white arm that crosses the road. Shut, the arm lies down across the
// road toward us (it runs down the picture); open, it stands up (it runs up the picture): the post is on the far side of the road for this, so the two
// can never be mistaken. The lamp on the housing is red when it is shut and green when it is open. It is open unless `shut` is set on the object.
// (hx, hn: the way the arm points when it is down, in the model's x and n: across the road.) ----
PF.gate = ({ len = 30, seed = 1, hx = .33, hn = -.94 } = {}) => {
  const build = k => { const M = T3(), th = (k + 1) / 2 * 1.43, sn = Math.sin(th), c = Math.cos(th), back = 6, ZP = 10.5, open = k > 0; M.seed = seed;
    t3box(M, -3, -3, 0, 3, 3, .8, [118, 116, 110]);
    t3box(M, -2.4, -2.4, .8, 2.4, 2.4, 12, [76, 86, 96], { tex: (x, n, z) => z < 6.4 ? ((Math.floor((x + n + z) / 2) % 2) ? [212, 182, 44] : [44, 44, 48]) : (h2(Math.floor(x), Math.floor(z), seed) < .05 ? [124, 70, 48] : [76, 86, 96]) });
    t3box(M, -1, -2.6, 8.6, 1, -2.4, 10.4, open ? [64, 206, 92] : [210, 40, 34], { clean: true }); // the lamp: green open, red shut
    t3cyl(M, 0, 0, 1.3, 12, ZP + 1.2, [60, 62, 66], { topCol: [90, 92, 96] }); // the pivot
    // the arm: the point at distance s along it, and a ribbon seen from above and an upright one, striped red and white, a dark counterweight end behind the pivot
    const P = s2 => [s2 * c * hx, s2 * c * hn, ZP + s2 * sn], px = -hn, pn = hx, qx = -sn * hx, qn = -sn * hn, qz = c, hw = 1.3;
    const R = (s2, a, bx, bn, bz) => { const p = P(s2); return [p[0] + a * bx, p[1] + a * bn, p[2] + a * bz] };
    const tex = (x, n, z) => { const s2 = (x * hx + n * hn) * c + (z - ZP) * sn; return s2 < 0 ? [54, 56, 60] : (Math.floor(s2 / 3.6) % 2 ? [236, 234, 226] : [202, 42, 36]) };
    t3face(M, [R(-back, -hw, px, pn, 0), R(len, -hw, px, pn, 0), R(len, hw, px, pn, 0), R(-back, hw, px, pn, 0)], [200, 40, 34], null, { both: true, tex, zb: .5, clean: true });
    t3face(M, [R(-back, -hw, qx, qn, qz), R(len, -hw, qx, qn, qz), R(len, hw, qx, qn, qz), R(-back, hw, qx, qn, qz)], [200, 40, 34], null, { both: true, tex, zb: .5, clean: true });
    const bk = P(-back); t3box(M, bk[0] - 1.6, bk[1] - 1.6, bk[2] - 1.8, bk[0] + 1.6, bk[1] + 1.6, bk[2] + 1.8, [60, 62, 66], { clean: true });
    const tip = P(len); t3box(M, tip[0] - .9, tip[1] - .9, tip[2] - 1.3, tip[0] + .9, tip[1] + .9, tip[2] + 1.3, [236, 234, 226], { clean: true }); // a white end
    return M };
  const FR = fvFrames(build);
  return { s: FR[FR.length - 1].s, ax: FR[FR.length - 1].ax, ay: FR[FR.length - 1].ay, frames: FR.map(g => ({ s: g.s, night: null })), solids: [[-3, -3, 3, 3]].map(t3w) } };
// the rest the shut arm falls on, across the road: a post with a fork
PF.gaterest = ({ seed = 2 } = {}) => { const sp = t3sprite(() => { const M = T3(); M.seed = seed; t3cyl(M, 0, 0, 1.4, 0, 9.4, [92, 70, 50], { topCol: [140, 112, 84] }); t3box(M, -1.8, -1.2, 9.4, -.9, 1.2, 12.2, [92, 70, 50]); t3box(M, .9, -1.2, 9.4, 1.8, 1.2, 12.2, [92, 70, 50]); t3box(M, -2.4, -.8, 0, 2.4, .8, .8, [118, 116, 110]); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-1.6, -1.6, 1.6, 1.6]].map(t3w) } };
// which frame the barrier shows: open (the last) unless the object is told to be shut, and swung to as it is changed
function gateIdx(o) { const n = o.pfr.length, tgt = o.shut ? 0 : 1; if (o.gv === undefined) o.gv = tgt; o.gv += (tgt - o.gv) * Math.min(1, LASTDT * 1.7); return clamp(Math.round(o.gv * (n - 1)), 0, n - 1) }

// ---- the cowshed, its paddock, the hay ----
// the cowshed is the house's own model with the gates thrown open and the years on it
PF.cowshed = (o = {}) => PF.house(Object.assign({ w: 64, d: 40, h: 24, wall: 'board', col: [124, 98, 70], roof: 'tin', roofCol: [112, 100, 92], porch: false, wins: [], door: 0, gate: 30, chim: 'pipe', chimX: 22, sideWin: false, decay: .85, deco: ['ladder'], seed: 31 }, o));
// a fence: posts and two rails along x (axis 'x') or away from us (axis 'n'); some posts lean, a rail has broken. The view leans everything that runs away from
// us up and to the right (T3S a pixel for each); the ground it stands on is drawn upright, so a fence that runs away from us is sheared back by as much and
// stands upright on the screen (and its solid is the upright strip it shows).
PF.fence = ({ len = 60, axis = 'x', seed = 1 } = {}) => { const r = mulberry(seed), sp = t3sprite(() => { const M = T3(); M.seed = seed; const P = u => axis === 'x' ? [u, 0] : [-T3S * u, u], at = (u, z, o = 0) => { const [x, n] = P(u); return axis === 'x' ? [x, n + o, z] : [x + o, n, z] };
    const posts = Math.max(2, Math.round(len / 15) + 1), step = len / (posts - 1), W = [[124, 98, 70], [108, 84, 60], [138, 112, 82]];
    for (let i = 0; i < posts; i++) { const u = i * step, lean = (r() - .5) * 1.6, c = W[i % 3]; const [x, n] = P(u); t3cyl(M, x, n, 1.25, 0, 13, c, { topCol: [170, 142, 104] }); if (Math.abs(lean) > .6) t3line(M, [x, n, 13], [x + (axis === 'x' ? lean : 0), n + (axis === 'x' ? 0 : lean), 14], c) }
    for (const [z, th] of [[10.4, 1], [6, 0]]) for (let i = 0; i < posts - 1; i++) { if (r() < .1 && z > 8) continue; const a = at(i * step, z), b = at((i + 1) * step, z + (r() - .5) * .8); const c = W[(i + (z > 8 ? 1 : 0)) % 3];
      for (const o of [-.6, .6]) t3line(M, [a[0] + (axis === 'x' ? 0 : o), a[1] + (axis === 'x' ? o : 0), a[2]], [b[0] + (axis === 'x' ? 0 : o), b[1] + (axis === 'x' ? o : 0), b[2]], c) }
    return M }, [0]);
  const solids = axis === 'x' ? [[-1.4, -1.4, len + 1.4, 1.4]] : [[-1.4, -len - 1.4, 1.4, 1.4]];
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: solids.map(q => q) } };
// a haystack: a pole with the hay stacked round it, its rings combed down; a round bale or two
PF.haystack = ({ R = 14, H = 28, seed = 2 } = {}) => { const sp = t3sprite(() => { const M = T3(), N = 12, rings = [], prof = u => R * Math.pow(Math.max(0, 1 - Math.pow(u, 2.2)), .62) * (u < .1 ? .85 + u * 1.5 : 1); M.seed = seed;
    for (let k = 0; k <= 9; k++) { const u = k / 9, z = 1 + u * (H - 1), rr = prof(u) + .6 * Math.sin(k * 2.1 + seed), ring = []; for (let i = 0; i < N; i++) { const a = i / N * TAU; ring.push([Math.cos(a) * rr, Math.sin(a) * rr * .92, z]) } rings.push(ring) }
    const hay = (x, n, z) => { const g = vn(x * .4 + z * .5, n * .4 + z * .9, seed + 3), f = h2(Math.round(x * 1.3), Math.round(z * 1.1), seed + 4); const c = [[190, 160, 84], [172, 142, 70], [206, 178, 100]][f < .3 ? 1 : f > .8 ? 2 : 0]; return cmul(c, .82 + g * .3) };
    for (let k = 0; k < 9; k++) for (let i = 0; i < N; i++) t3face(M, [rings[k][i], rings[k][(i + 1) % N], rings[k + 1][(i + 1) % N], rings[k + 1][i]], [186, 156, 82], [0, 0, H / 2], { tex: hay, clean: true });
    t3face(M, rings[9], [186, 156, 82], [0, 0, 4], { tex: hay, clean: true }); t3line(M, [0, 0, H], [0, 0, H + 6], [96, 74, 52]); t3line(M, [.5, 0, H], [.5, 0, H + 6], [120, 92, 64]);
    t3box(M, -R - 1, -R - 1, 0, R + 1, R + 1, 1.2, [96, 74, 52], { tex: (x, n, z) => h2(Math.floor(x * 2), Math.floor(n * 2), seed) < .5 ? [96, 74, 52] : [120, 92, 64] }); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-R, -R * .9, R, R * .9]].map(t3w) } };
PF.bales = ({ n = 3, seed = 5 } = {}) => { const r = mulberry(seed), sp = t3sprite(() => { const M = T3(); M.seed = seed;
    const bale = (x, nn, z) => { t3roll(M, x - 4.4, x + 4.4, nn, 4.4, [196, 166, 88], { z0: z, endCol: [158, 128, 66], tex: (X, N, Z) => (Math.abs(((X - x + 4.4) % 4.4) - 2.2) < .35 ? [92, 84, 60] : cmul([196, 166, 88], .84 + .3 * vn(X * .5, Z * .6 + N * .4, seed + 6))), endTex: (rr) => (Math.round(rr * 5) % 2 ? [176, 146, 74] : [150, 120, 60]) }) };
    bale(-5, 0, 0); if (n > 1) bale(5, 0, 0); if (n > 2) bale(0, 1, 8.8); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-9.6, -5.4, 9.6, 4]].map(t3w) } };
PF.trough = ({ len = 26, seed = 3 } = {}) => { const sp = t3sprite(() => { const M = T3(); M.seed = seed; t3box(M, -len / 2, -2.6, 0, len / 2, 2.6, 4.4, [110, 86, 60], { tex: (x, n, z) => z > 4.2 ? [60, 92, 112] : ((Math.floor(x / 3.2) % 2) ? [110, 86, 60] : [96, 74, 52]) });
    t3face(M, [[-len / 2 + 1, -1.6, 4.1], [len / 2 - 1, -1.6, 4.1], [len / 2 - 1, 1.6, 4.1], [-len / 2 + 1, 1.6, 4.1]], [58, 98, 118], [0, 0, 0], { flat: true, zb: .2, tex: (x, n) => h2(Math.round(x), Math.round(n), seed) < .1 ? [150, 190, 204] : null }); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-len / 2 - 1, -3, len / 2 + 1, 3]].map(t3w) } };
// trampled straw before the gates: a flat patch, lighter where it is fresh
PF.strawpad = ({ w = 40, d = 18, seed = 7 } = {}) => { const sp = t3sprite(() => { const M = T3(), pts = []; M.seed = seed; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, nn = Math.sin(a) * d / 2 * (.9 + .1 * Math.cos(a * 4)) + d / 2; pts.push([Math.cos(a) * w / 2 * (.9 + .1 * Math.sin(a * 3 + seed)) - T3S * nn, nn, .1]) }
    t3face(M, pts, [176, 148, 84], [0, d / 2, -1], { flat: true, z: -55, clean: true, tex: (x, n) => { const v = vn(x * .5, n * .6, seed + 1), f = h2(Math.round(x), Math.round(n), seed + 2); return f < .06 ? [214, 188, 110] : v > .62 ? [158, 130, 70] : v < .3 ? [146, 120, 66] : null } }); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, flat: true, noShadow: true } };

// ---- cows: two or three in the paddock, walking about, grazing, standing and chewing, a tail flicking at flies ----
// seen from the south the cow is in profile, facing east or west; the model (facing east) is built for each pose and kept
const COWPOSES = ['st0', 'st1', 'w0', 'w1', 'w2', 'w3', 'g0', 'g1'], COWS = [], COWSPR = new Map();
const COWCOAT = { holstein: { base: [236, 232, 222], patch: [34, 34, 38], mix: .55 }, red: { base: [150, 88, 56], patch: [226, 218, 204], mix: .22 }, buff: { base: [196, 160, 110], patch: [236, 226, 206], mix: .25 } };
function cowModel(M, coat, pose) { const C = COWCOAT[coat] || COWCOAT.holstein, sd = coat.length * 7 + 3, ph = pose[0] === 'w' ? +pose[1] / 4 * TAU : 0, walk = pose[0] === 'w', graze = pose[0] === 'g', tail = pose === 'st1' ? 1 : pose === 'w1' || pose === 'w3' ? .5 : 0;
  const hide = (x, n, z) => { const v = vn(x * .16 + n * .13, z * .22 + n * .1, sd); return v > C.mix ? C.patch : C.base };
  const rings = []; for (let i = 0; i <= 9; i++) { const x = -11 + 22 * i / 9, u = x / 11.5, w = 4.3 * Math.pow(Math.max(.05, 1 - u * u), .35), top = 12.4 - .8 * u * u + (i > 6 ? 0 : .3), bot = 5.4 + 1.6 * Math.abs(u) * Math.abs(u); rings.push([[x, -w * .55, bot], [x, -w, (bot + top) / 2], [x, -w * .6, top], [x, w * .6, top], [x, w, (bot + top) / 2], [x, w * .55, bot]]) }
  for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) t3face(M, [rings[i][j], rings[i][(j + 1) % 6], rings[i + 1][(j + 1) % 6], rings[i + 1][j]], C.base, [0, 0, 8], { tex: hide, clean: true });
  for (const k of [0, 9]) t3face(M, rings[k], C.base, [k ? -4 : 4, 0, 8], { tex: hide, clean: true });
  t3box(M, -4.2, -1.7, 4, -.8, 1.7, 5.8, [226, 168, 160], { clean: true }); // the udder
  // the legs: the pairs swing against each other
  for (const [lx, side, off] of [[7.4, -1, 0], [7.4, 1, Math.PI], [-7.2, -1, Math.PI], [-7.2, 1, 0]]) { const sw = walk ? Math.sin(ph + off) * 2.2 : 0, lift = walk ? Math.max(0, Math.cos(ph + off)) * 1.1 : 0, n0 = side * 2.5;
    t3box(M, lx - .9 + sw * .5, n0 - .8, lift, lx + .9 + sw * .5, n0 + .8, 6.2, C.base === COWCOAT.holstein.base ? [226, 222, 212] : cmul(C.base, .92), { clean: true }); t3box(M, lx - 1 + sw * .6, n0 - .9, lift, lx + 1 + sw * .6, n0 + .9, lift + 1.1, [44, 38, 34], { clean: true }) }
  // the neck and the head: up, or down to the grass
  if (graze) { t3box(M, 9.5, -2.2, 6.5, 13, 2.2, 11.6, C.base === COWCOAT.holstein.base ? [60, 60, 64] : cmul(C.base, .9), { clean: true }); t3box(M, 13, -2.1, 1.4, 17.2, 2.1, 7, cmul(C.base, .96), { clean: true, tex: (x, n, z) => z < 3.2 ? [226, 168, 160] : C.base }); t3box(M, 16.6, -1.7, 0, 18.6, 1.7, 3, [226, 168, 160], { clean: true }) }
  else { t3box(M, 9.5, -2.2, 7.5, 13.4, 2.2, 13, C.base === COWCOAT.holstein.base ? [60, 60, 64] : cmul(C.base, .9), { clean: true }); t3box(M, 12.6, -2.1, 9.2, 17, 2.1, 14.2, cmul(C.base, .96), { clean: true, tex: (x, n, z) => x > 16 ? [226, 168, 160] : hide(x, n, z) }); t3box(M, 16.6, -1.7, 9, 18.4, 1.7, 11.4, [226, 168, 160], { clean: true }); M.dots.push([[17.6, -1.8, 11.8], [30, 24, 22]], [[17.6, 1.8, 11.8], [30, 24, 22]]) }
  const hz = graze ? 7 : 14.2; M.dots.push([[14.4, -2.2, hz - 1.2], [30, 24, 22]]); t3box(M, 13.2, -3.4, hz - .6, 14.2, -2.1, hz + .6, cmul(C.base, .9), { clean: true }); t3box(M, 13.2, 2.1, hz - .6, 14.2, 3.4, hz + .6, cmul(C.base, .9), { clean: true }); // the ears
  t3line(M, [13.4, -1.4, hz + 1], [13.6, -2.4, hz + 2.6], [226, 220, 200]); t3line(M, [13.4, 1.4, hz + 1], [13.6, 2.4, hz + 2.6], [226, 220, 200]); // the horns
  const ta = tail * 1.8; t3line(M, [-11, 0, 11.4], [-12.4 - ta, 0, 7], [60, 56, 54]); t3line(M, [-12.4 - ta, 0, 7], [-12.8 - ta * 1.5, 0, 3.6], [60, 56, 54]); t3box(M, -13.6 - ta * 1.5, -.6, 2.4, -12, .6, 4.2, [44, 40, 38], { clean: true }) }
function cowSpr(coat, dir, pose) { const key = coat + dir + pose; let r = COWSPR.get(key); if (r) return r; const sp = t3sprite(() => { const M = T3(); cowModel(M, coat, pose); return dir < 0 ? t3flipX(M) : M }, [0])[0]; r = { cv: sp.s.canvas(), ax: sp.ax, ay: sp.ay }; COWSPR.set(key, r); return r }
function cowsInit() { for (const c of (PL.cows || [])) { const [x, y] = toW(c.x, c.y), [x0, y0] = toW(c.box[0], c.box[1]), [x1, y1] = toW(c.box[2], c.box[3]); COWS.push({ id: c.id, coat: c.coat, x, y, box: [x0, y0, x1, y1], dir: c.dir || 1, state: 'stand', t: Math.random() * 3, ph: 0, tx: x, ty: y, blink: Math.random() * 9 }) } }
function stepCows(dt) { for (const C of COWS) { C.t -= dt;
    if (C.state === 'walk') { const dx = C.tx - C.x, dy = C.ty - C.y, d = Math.hypot(dx, dy), sp = 6.5 * dt;
      if (d <= sp || C.t < -12) { C.state = Math.random() < .6 ? 'graze' : 'stand'; C.t = 3 + Math.random() * 6 } else { const nx = C.x + dx / d * sp, ny = C.y + dy / d * sp; if (COWS.some(O => O !== C && Math.hypot(O.x - nx, (O.y - ny) * 1.4) < 15 && Math.hypot(O.x - nx, O.y - ny) < Math.hypot(O.x - C.x, O.y - C.y))) { C.state = 'stand'; C.t = 1.2 } else { C.x = nx; C.y = ny; C.ph += dt * 5.2; if (Math.abs(dx) > 1.5) C.dir = dx > 0 ? 1 : -1 } } }
    else if (C.t <= 0) { const r = Math.random(); if (r < .5) { C.state = 'graze'; C.t = 3 + Math.random() * 7 } else if (r < .72) { C.state = 'stand'; C.t = 2 + Math.random() * 4 } else { const [x0, y0, x1, y1] = C.box; C.state = 'walk'; C.t = 0; C.tx = x0 + 6 + Math.random() * (x1 - x0 - 12); C.ty = y0 + 6 + Math.random() * (y1 - y0 - 12); if (Math.hypot(C.tx - C.x, C.ty - C.y) < 14) { C.state = 'stand'; C.t = 1.5 } else C.t = 0 } } } }
function drawCow(C) { const w = C.state === 'walk', g = C.state === 'graze', k = w ? 'w' + (Math.floor(C.ph) % 4) : g ? 'g' + (Math.floor(t * .9 + C.blink) % 2) : 'st' + (Math.floor(t * .6 + C.blink) % 3 === 2 ? 1 : 0), S = cowSpr(C.coat, C.dir, k);
  ctx.fillStyle = 'rgba(10,14,8,.24)'; ctx.beginPath(); ctx.ellipse(C.x + .5, C.y + .5, 11, 3.6, 0, 0, TAU); ctx.fill(); ctx.drawImage(S.cv, Math.round(C.x) - S.ax, Math.round(C.y) - S.ay) }

// ---- the transformer of the village: not a kiosk but a pole-mounted one, a grey-green oil tank on a platform between two concrete poles, the line
// coming down to it from an arm above, the low-voltage cable leaving from the platform; a ladder of steps up one pole ----
PF.mtp = ({ seed = 3 } = {}) => { const PH = 60, CON = [138, 136, 128], steel = [84, 90, 96];
  const sp = t3sprite(() => { const M = T3(); M.seed = seed;
    for (const sx of [-1, 1]) { t3box(M, sx * 5.5 - 2.4, -2.4, 0, sx * 5.5 + 2.4, 2.4, 1.6, [112, 110, 104]); t3cyl(M, sx * 5.5, 0, 1.7, 1.6, PH, CON, { topCol: [160, 158, 150] }); for (let z = 6; z < PH - 8; z += 9) t3line(M, [sx * 5.5 - 1.7, -.2, z], [sx * 5.5 + 1.7, -.2, z], [92, 90, 86]) }
    // the platform: a steel frame and plate, braced to the poles
    t3box(M, -9.5, -3.8, 20, 9.5, 3.8, 21.4, steel, { tex: (x, n, z) => z > 21.2 && (Math.floor(x / 3) + Math.floor(n / 3)) % 2 ? [74, 80, 86] : steel }); for (const sx of [-1, 1]) { t3line(M, [sx * 5.5, -2, 20], [sx * 8.6, -3, 15], [70, 74, 78]); t3line(M, [sx * 5.5, 2, 20], [sx * 8.6, 3, 15], [70, 74, 78]) }
    // the tank: a drum with ribs, a conservator on top, three bushings up and four low-voltage bushings along the front
    const tank = [96, 114, 102]; t3cyl(M, 0, 0, 4.6, 21.4, 33, tank, { topCol: [74, 90, 80] }); for (let a = 0; a < 12; a++) { const an = a / 12 * TAU; t3line(M, [Math.cos(an) * 4.7, Math.sin(an) * 4.2, 22.4], [Math.cos(an) * 4.7, Math.sin(an) * 4.2, 32.2], [70, 84, 76]) }
    t3roll(M, -4, 4, 0, 1.5, [88, 104, 92], { z0: 33.5, endCol: [70, 84, 76] });
    for (const x of [-3, 0, 3]) { t3cyl(M, x, 0, .9, 35, 40, [236, 230, 214], { topCol: [200, 196, 184], clean: true }); t3cyl(M, x, 0, 1.3, 35, 36, [210, 204, 190], { clean: true }) }
    for (const x of [-4.8, -1.6, 1.6, 4.8]) t3cyl(M, x, -4.2, .8, 24.6, 27.4, [236, 230, 214], { clean: true });
    t3face(M, [[-2.6, -4.65, 27.4], [2.6, -4.65, 27.4], [2.6, -4.65, 30.4], [-2.6, -4.65, 30.4]], [212, 188, 52], null, { both: true, zb: .4, clean: true, tex: (x, n, z) => (Math.abs(x) < .4 && z > 28 && z < 29.6) ? [36, 36, 38] : [212, 188, 52] }); // the plate: a lightning bolt
    // the line's arm above, three insulators, the jumpers down to the bushings
    t3box(M, -11, -1, PH - 3, 11, 1, PH - 1.6, [96, 78, 58]); for (const x of [-8, 0, 8]) { t3cyl(M, x, 0, .9, PH - 1.6, PH + 2, [236, 230, 214], { topCol: [210, 204, 190], clean: true }); t3line(M, [x, 0, PH - 2], [x * .35, 0, 40], [40, 40, 42]) }
    // the ladder of steps and a danger plate on the other pole; the earth strap
    for (let z = 4; z < 20; z += 3.6) t3box(M, -5.5 - 2.6, -2.6, z, -5.5 - .6, -.4, z + .8, [70, 74, 78], { clean: true });
    t3face(M, [[5.5 - 2, -1.9, 12], [5.5 + 2, -1.9, 12], [5.5 + 2, -1.9, 16], [5.5 - 2, -1.9, 16]], [236, 196, 40], null, { both: true, zb: .4, clean: true, tex: (x, n, z) => Math.abs(x - 5.5) < .4 && z > 12.8 && z < 15 ? [30, 30, 30] : [236, 196, 40] });
    t3line(M, [-6.4, -2.6, 2], [-9, -4, 0], [150, 100, 60]); t3line(M, [-5.5, -1.7, 20], [-6.4, -2.6, 2], [150, 100, 60]);
    return M }, [0]);
  const A = (x, n, z) => t3p([x, n, z]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-8, -2.6, -3, 2.6], [3, -2.6, 8, 2.6]].map(t3w), tops: [A(-8, 0, PH + 2), A(0, 0, PH + 2), A(8, 0, PH + 2)], top: A(0, 0, PH + 2), outs: [A(9.5, 0, 21)] } };

// ---- a cable lying on the ground (flat): rubber, black, with a sheen along it, held down with a clip here and there; the points are relative to the object ----
PF.cable = ({ pts = [[0, 0], [12, -5]], seed = 1 } = {}) => { const sp = t3sprite(() => { const M = T3(); M.seed = seed; const P = pts.map(([x, y]) => [x + T3S * y, -y]); // (flat on the ground: the lean of the view is taken out, so it lies where its points say)
    for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; t3line(M, [a[0], a[1], .1], [b[0], b[1], .1], [20, 20, 24], { over: true }); t3line(M, [a[0], a[1] + 1, .1], [b[0], b[1] + 1, .1], [20, 20, 24], { over: true }); t3line(M, [a[0], a[1] + .5, .1], [b[0], b[1] + .5, .1], [58, 58, 64], { over: true }) }
    for (let i = 1; i < P.length - 1; i++) M.dots.push([[P[i][0], P[i][1] + .5, .3], [150, 150, 146]]);
    return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, flat: true, noShadow: true } };

// ---- the guard: stands by the barrier and smokes. A cycle of seventeen seconds: the cigarette hangs at his hip and a thin wisp rises from it; then he lifts it to his
// lips and draws on it (the ember brightens and glows); lowers it and breathes the smoke out in a stream that the wind takes; the ember dims again ----
const GSM = []; // the guard's smoke: kind 0 a wisp (single pixels rising and wavering), kind 1 a breath (soft puffs that spread)
// where the mouth is, as an offset from the anchor of the figure's sprite (the same turn and scale as the sprite's model)
function guardMouth(look, dir) { const H = look.h || 17.6, head = H / 4.5, r = head * .5, hz = H - head * .55, T = T3(); T.dots.push([[0, 1.05 - r * .95, hz - r * .45], [0, 0, 0]]); t3rot(T, dir * 45); t3scale(T, NPC_K); return t3p(T.dots[0][0]) }
function guardStep(P, dt) { P.st += dt; P.moving = false; const T = P.st % 17, up = (T > 8.2 && T < 10.4) ? 1 : 0, S = npcSprite(P.look, 'smoke', P.dir, up); P.sf = up;
  // the ember: dim while held, glowing while he draws, a slow fade after
  P.ember = (T < 8.2 ? .3 : T < 9.5 ? .3 + .7 * (T - 8.2) / 1.3 : T < 10.4 ? 1 : T < 12.4 ? 1 - .7 * (T - 10.4) / 2 : .3) * (.92 + .08 * Math.sin(P.st * 3.3));
  if (S.tip) { P.tx = Math.round(P.x) + S.tip[0]; P.ty = Math.round(P.y) + S.tip[1];
    if (!up) { P.wa = (P.wa || 0) + dt * 9; while (P.wa >= 1) { P.wa--; GSM.push({ k: 0, x: P.tx + (Math.random() - .5) * .4, y: P.ty - .5, vx: 0, vy: -(6 + Math.random() * 3), age: 0, life: 3.2 + Math.random() * 1.8, ph: Math.random() * 6.28, a0: .7, c: 0 }) } } }
  if (T > 10.5 && T < 12.0 && S.mouth) { P.ba = (P.ba || 0) + dt * 15; const th = P.dir * Math.PI / 4, fx = Math.sin(th), fy = -Math.cos(th);
    while (P.ba >= 1) { P.ba--; const sp = 16 + Math.random() * 9; GSM.push({ k: 1, x: Math.round(P.x) + S.mouth[0] + fx * 2.2, y: Math.round(P.y) + S.mouth[1] + fy * 1.6, vx: fx * sp + (Math.random() - .5) * 3.5, vy: fy * sp * .5 - 3 + (Math.random() - .5) * 3, age: 0, life: 3.2 + Math.random() * 1.6, ph: Math.random() * 6.28, a0: .48, r0: .8 + Math.random() * .5 }) } } else P.ba = 0 }
function stepGSM(dt) { const g = gustNow(), wv = 3 + 26 * WIND.s * (.55 + .7 * g);
  for (const p of GSM) { p.age += dt; const k = Math.min(1, dt * (p.k ? 1.7 : .8)), tx = WINDX * wv + Math.sin(p.age * 2.6 + p.ph) * (p.k ? 1.5 : 3.2) * (1 + WIND.s), ty = (p.k ? -7 : -Math.max(1.5, 6 - p.age * 1.2)) + WINDY * wv * .4;
    p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k; p.x += p.vx * dt; p.y += p.vy * dt }
  for (let i = GSM.length - 1; i >= 0; i--) if (GSM[i].age > GSM[i].life) GSM.splice(i, 1) }
// the smoke is drawn under the light (dimmer at night, like the rest of the smoke)
function drawGuardSmoke() { const dim = 1 - LT.dark * .55;
  for (const p of GSM) { if (p.x < CAM.x - 20 || p.x > CAM.x + W + 20 || p.y < CAM.y - 20 || p.y > CAM.y + H + 20) continue; const u = p.age / p.life, fade = (1 - u) * (u < .12 ? u / .12 : 1);
    if (p.k) puff(p.x, p.y, Math.min(4.6, p.r0 + p.age * 1.5), p.a0 * fade * dim, '224,228,236'); else { ctx.fillStyle = `rgba(178,184,198,${(p.a0 * fade * dim).toFixed(3)})`; const x = Math.round(p.x), y = Math.round(p.y); ctx.fillRect(x, y, 1, 1); if (u > .3) ctx.fillRect(x + (p.ph > 3.14 ? 1 : -1), y, 1, 1); if (u > .6) ctx.fillRect(x, y - 1, 1, 1) } } }
// the ember and its small light, over the lit picture: a pixel of orange by day, a warm glow in the dark that swells when he draws
function drawGuardGlow() { for (const P of NPCS) { if (!P.smoker || P.tx === undefined || Math.abs(P.x - CAM.x - W / 2) > W) continue; const e = P.ember, nt = clamp(LT.dark * 1.25, 0, 1);
    if (nt > .04) { puff(P.tx, P.ty, 7 + 6 * e, (.08 + .3 * e) * nt, '255,150,70'); puff(P.tx, P.ty, 3, (.22 + .5 * e) * nt, '255,205,130') }
    ctx.fillStyle = `rgba(255,${150 + Math.round(80 * e)},90,${(.6 + .4 * e).toFixed(2)})`; ctx.fillRect(P.tx, P.ty, 1, 1) } }

// ---- where a thing sown by a scatter may stand: the distance of a layer's edge (the band), and on top of that: `shore` (the band counted from the real shore of the
// water, not from the edge of one of the ellipses it is made of, which lies in the open water where two of them overlap), `box` and `avoid` (rectangles of the
// place), `upland` (kinds that belong to dry ground: never on the dam, never on the sand within `dry` px of the water) ----
const visMat = (x, y) => { const h = layerAt(x, y); if (h.L && h.L.mat === 'dam' && damPart(h.L, x, y) === 0) { const u = underLayer(x, y); return u.L ? u.L.mat : PL.base } return h.L ? h.L.mat : PL.base };
const lakeDist = (x, y) => bayDist(x, y);
function scatterOK(S, L, t, x, y) { const dL = layerD(L, x, y);
  if (S.band ? dL < S.band[0] || dL > S.band[1] : dL > -6 || inPond(x, y, 4)) return false;
  const [lx, ly] = toL(x, y);
  if (S.box && !(lx >= S.box[0] && lx <= S.box[2] && ly >= S.box[1] && ly <= S.box[3])) return false;
  if (S.avoid && S.avoid.some(b => lx >= b[0] && lx <= b[2] && ly >= b[1] && ly <= b[3])) return false;
  if (S.shore) { const d = lakeDist(x, y); if (d < S.band[0] || d > S.band[1]) return false }
  if (S.upland && S.upland.includes(t)) { const m = visMat(x, y); if (m === 'dam') return false; if (m === 'beach' && lakeDist(x, y) < (S.dry ?? 24)) return false }
  return true }
