// =====================================================================================================================
// THE FISHING VILLAGE: its palettes, the glints of the open water and the prefabs (houses, boats, nets, racks...).
// =====================================================================================================================
const BAYP = P(['#22394a', '#284456', '#2e4e60', '#36596b', '#466a7a', '#5f8090']), BEACHP = P(['#8d7d5a', '#9d8d68', '#ae9e78', '#bfb088', '#cfc29a']);
// the colour of the open water of a bay at distance d (negative: inside) from its shore
function bayColor(x, y, d) {
  if (d > -1.3) return GW.wetsand[quant(vn(x * .3, y * .3, SEED + 590), x, y, 2)];
  if (d > -3.4 && vn(x * .35 - y * .1, y * .5, SEED + 591) > .42) return [214, 226, 228]; // foam
  if (d > -9) return cmix(BAYP[5], BEACHP[1], clamp(.55 - (-d - 3.4) * .09, 0, .55)); // sand showing through the shallows
  const dep = clamp(-d / 110, 0, 1), nn = vn(x * .05, y * .12, SEED + 593) * .6 + vn(x * .16, y * .5, SEED + 594) * .4; let c = BAYP[quant(.18 + dep * .24 + nn * .5, x, y, 6, .5)];
  const st = vn(x * .05 + y * .01, y * .75, SEED + 595); if (st > .8) c = BAYP[4]; if (st > .9) c = [150, 176, 186]; return c }
// jagged stones on a jittered grid, lit from the upper left: how far from the gap between stones, the stone's tone and where on it
function stoneCell(x, y, S, sd) { const gx = x / S, gy = y / S, ix = Math.floor(gx), iy = Math.floor(gy); let d1 = 9, d2 = 9, id = 0, ox = 0, oy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const a = ix + i, b = iy + j, cx = a + .15 + .7 * h2(a, b, sd), cy = b + .15 + .7 * h2(a, b, sd + 1), dx = gx - cx, dy = (gy - cy) * 1.25, d = dx * dx + dy * dy;
    if (d < d1) { d2 = d1; d1 = d; id = h2(a, b, sd + 2); ox = dx; oy = dy } else if (d < d2) d2 = d }
  return { gap: Math.sqrt(d2) - Math.sqrt(d1), id, ox, oy } }
// an embankment across the water: a gravel top with two ruts and dry sedge verges, rough stone riprap on both slopes (the south slope,
// turned to us, is the broader), waves breaking white on the north side. L.w is the whole width from the middle to the south toe.
let SKIPL = null; // (a layer asked for the ground that lies below it)
function damColor(L, x, y, d) {
  let best = 1e9, sd = 1; const P = L.line; for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, u = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1), dd = Math.hypot(x - ax - dx * u, y - ay - dy * u); if (dd < best) { best = dd; sd = dx * (y - ay) - dy * (x - ax) >= 0 ? 1 : -1 } }
  const TOP = 9, VG = 12, NS = 14.5, e = (vn(x * .2, 1, SEED + 51) - .5) * 1.6;
  if (best < TOP + e * .5) { if (Math.abs(best - 4.8) < 1) return G.rut; const v = .55 + (fbm(x * .05, y * .05, SEED + 9) - .5) * .3 + (vn(x * .18, y * .18, SEED + 12) - .5) * .1; let c = PAL.stone[quant(clamp(v, 0, 1), x, y, 5, .35)]; const st = h2(x, y, SEED + 10); if (st < .012) c = PAL.stone[4]; else if (st < .03) c = PAL.stone[2]; return c }
  if (best < VG + e) return K_sedge(x, y);
  if (sd < 0) { if (best < NS + e) { const s = stoneCell(x, y, 3.4, 61); if (s.gap < .12) return [52, 50, 46]; return PAL.stone[quant(.5 + (-s.oy * .8 - s.ox * .5 + (s.id - .5) * .4), x, y, 5, .4)] }
    SKIPL = L; const c = groundColor(x, y); SKIPL = null; const lk = layersNear(x, y).some(B => B.mat === 'lake' && layerD(B, x, y) < 0); if (lk && best < NS + e + 2.4 && vn(x * .3 - 2, y * .4, SEED + 53) > .5) return [214, 226, 228]; return c }
  const t = clamp((best - VG - e) / Math.max(4, L.w - VG - 3), 0, 1), s = stoneCell(x, y * 1.15, 4.2, 72); // the broad stone face on the south
  if (t < .1) return PAL.stone[3]; if (s.gap < .1) return [40, 38, 36];
  let c = PAL.stone[quant(clamp(.55 - s.oy * .5 - s.ox * .3 + (s.id - .5) * .5 - t * .55, 0, 1), x, y, 5, .45)];
  if (t > .8 && vn(x * .3, y, SEED + 74) > .45) c = PAL.moss[1 + (h2(x, y, SEED + 75) < .5 ? 1 : 0)]; return c }
const K_sedge = (x, y) => K_q(h2(x, y, SEED + 67) < .45 ? PAL.straw : PAL.sedge, .4 + vn(x * .3, y * .3, SEED + 68) * .5, x, y);
const K_q = (pal, v, x, y) => pal[quant(v, x, y, pal.length, .7)];
// glints on the open water: small bright flecks that come and go, more of them in wind and sun
function drawLakeGlints(cx0, cy0) { const sun = (.25 + .75 * LT.day) * (.5 + .5 * Math.min(1, WIND.s * 1.6 + .25)); if (sun < .05) return;
  const n = 90, tt = Math.floor(t * 2.2);
  for (let k = 0; k < n; k++) { const ph = (t * 2.2 + h2(k, 3, 7) * 9) % 3, a = Math.sin(Math.min(1, ph / 3) * Math.PI); if (a < .15) continue; const g = Math.floor(t * 2.2 / 3 + h2(k, 4, 8) * 9);
    const x = Math.floor(cx0 + h2(k, g, 11) * W), y = Math.floor(cy0 + h2(k, g, 12) * H), h = layerAt(x, y); if (!h.L || h.L.mat !== 'lake' || h.L.pal !== 'bay' || h.d > -6) continue;
    ctx.fillStyle = `rgba(214,232,238,${(a * .75 * sun).toFixed(2)})`; ctx.fillRect(x, y, h2(k, g, 13) < .3 ? 2 : 1, 1) } }

// ---- the village's own colours and textures ----
const FV = { glass: [52, 64, 74], door: [112, 78, 52], plinth: [124, 120, 110], brick: [150, 70, 52], tar: [40, 36, 32], wood: [150, 114, 76], woodD: [100, 72, 48], woodL: [186, 152, 108] };
// painted upright boards: a seam every few pixels, the paint faded and peeling in patches
const fvBoards = (c, step = 3.4, seed = 1) => (x, n, z) => { const u = x / step, k = Math.floor(u); let m = u - k < .2 ? .8 : 1; const v = h2(k, 3, seed); if (v < .22) m *= .93; else if (v > .86) m *= 1.06;
  if (vn(x * .11 + n * .11, z * .2, seed + 5) > .72) m *= .9; if (z < 2.5) m *= .84; return cmul(c, m) };
// log walls: rows of rounded logs with a dark seam between them
const fvLogs = (c, LOGH = 3.2, seed = 1) => (x, n, z) => { const r = ((z % LOGH) + LOGH) % LOGH / LOGH; if (r < .15) return cmul(c, .58); const g = vn(x * .3, Math.floor(z / LOGH) * 3.1, seed + 4); return cmul(c, (r > .6 ? 1.18 : 1) * (g > .7 ? .9 : 1)) };
// roofs: standing-seam tin (rusting in patches) or rows of shingles
const fvTin = (c, seed = 1) => (x, n, z) => { let k = (((Math.round(x) % 5) + 5) % 5 === 0) ? .8 : 1; const r = vn(x * .07, n * .09, seed + 9); if (r > .68) return cmix(cmul(c, k), [150, 78, 44], .45); if (r < .22) k *= .9; return cmul(c, k) };
const fvShingle = (c, seed = 1) => (x, n, z) => { const row = Math.floor(n / 2.4), col = Math.floor(x / 4 + (row % 2) * .5); let k = h2(col, row, seed) < .3 ? .86 : 1; if ((n / 2.4) % 1 < .22) k *= .78; return cmul(c, k) };

// ---- a fisherman's house: a plank or log box under a gabled roof, windows (lit at night), a door with a small porch, a chimney ----
// w, d, h: width, depth, wall height; wall: 'board' or 'log'; col: the paint of the boards (the logs' own colour); roof: 'tin' or 'shingle';
// wins: the x of the front windows; door: its x; shut: the colour of shutters; deco: things about it
PF.house = ({ w = 56, d = 44, h = 24, wall = 'board', col = [118, 150, 168], trim = [236, 232, 216], roof = 'tin', roofCol = [120, 74, 56], porch = true, pw = 10, chim = 'brick', chimX = -16,
    wins = [-18, 18], door = 0, shut = null, deco = [], seed = 3, sideWin = true, gate = 0 } = {}) => {
  const HW = w / 2, D = d, WALL = h, OVR = 3, RISE = Math.round(d * .3), RIDGE = WALL + RISE, eave = WALL - OVR * RISE / (D / 2), PD = 14, PZ = 4;
  const wallC = wall === 'log' ? col : col, wallT = wall === 'log' ? fvLogs(col, 3.2, seed) : fvBoards(col, 3.4, seed), roofT = roof === 'tin' ? fvTin(roofCol, seed) : fvShingle(roofCol, seed);
  const winZ0 = 9, winH = 11, winW = 9;
  const build = () => { const M = T3(), ctr = [0, D / 2, WALL / 2], rnd = mulberry(seed + 77);
    // the walls
    t3face(M, [[-HW, 0, 3], [HW, 0, 3], [HW, 0, WALL], [-HW, 0, WALL]], wallC, ctr, { tex: wallT });
    t3face(M, [[-HW, D, 3], [HW, D, 3], [HW, D, WALL], [-HW, D, WALL]], wallC, ctr, { tex: wallT });
    t3face(M, [[-HW, 0, 3], [-HW, D, 3], [-HW, D, WALL], [-HW, 0, WALL]], wallC, ctr, { tex: wall === 'log' ? wallT : fvBoards(col, 3.4, seed + 1) });
    t3face(M, [[HW, 0, 3], [HW, D, 3], [HW, D, WALL], [HW, 0, WALL]], wallC, ctr, { tex: wall === 'log' ? wallT : fvBoards(col, 3.4, seed + 1) });
    // the plinth of field stone, the corner boards (or the log ends)
    t3box(M, -HW - 1, -1, 0, HW + 1, D + 1, 3, FV.plinth, { tex: (x, n, z) => h2(Math.floor(x / 4), Math.floor(z / 1.5), seed) < .3 ? cmul(FV.plinth, .82) : FV.plinth });
    if (wall === 'log') for (let z = 3; z < WALL - 1; z += 3.2) for (const sx of [-1, 1]) t3box(M, sx * HW - (sx < 0 ? 3 : 1), -2.4, z, sx * HW + (sx < 0 ? 1 : 3), 1, z + 2.8, wallC, { zb: .3 });
    else for (const sx of [-1, 1]) t3box(M, sx * HW - 1, -.8, 3, sx * HW + 1, .4, WALL, trim, { zb: .3 });
    // the roof: two slopes, a ridge, the gables
    t3face(M, [[-HW - OVR, -OVR, eave], [HW + OVR, -OVR, eave], [HW + OVR, D / 2, RIDGE], [-HW - OVR, D / 2, RIDGE]], roofCol, [0, D / 2, 0], { tex: roofT });
    t3face(M, [[-HW - OVR, D + OVR, eave], [HW + OVR, D + OVR, eave], [HW + OVR, D / 2, RIDGE], [-HW - OVR, D / 2, RIDGE]], roofCol, [0, D / 2, 0], { tex: roofT });
    for (const x of [-HW, HW]) t3face(M, [[x, 0, WALL], [x, D, WALL], [x, D / 2, RIDGE]], wallC, ctr, { tex: wall === 'log' ? fvLogs(col, 3.2, seed + 2) : (X, N, Z) => ((Math.round(N) % 3) + 3) % 3 === 0 ? cmul(col, .82) : col });
    t3line(M, [-HW - OVR, D / 2, RIDGE + .4], [HW + OVR, D / 2, RIDGE + .4], cmul(roofCol, .65));
    t3line(M, [-HW - OVR, -OVR, eave - .3], [HW + OVR, -OVR, eave - .3], cmul(roofCol, .6));
    // the attic window in the east gable
    t3face(M, [[HW + .3, D / 2 - 3, WALL + 2], [HW + .3, D / 2 + 3, WALL + 2], [HW + .3, D / 2 + 3, WALL + 7], [HW + .3, D / 2 - 3, WALL + 7]], FV.glass, null, { both: true, inside: true, zb: .4, tex: (x, n, z) => Math.abs(n - D / 2) < .4 ? trim : null });
    // the chimney: brick, or a tin pipe with a cap
    const cn = D * .55, cz0 = RIDGE - 9;
    if (chim === 'brick') { t3box(M, chimX - 3.5, cn - 3, cz0, chimX + 3.5, cn + 3, RIDGE + 9, FV.brick, { tex: (x, n, z) => (((Math.floor(z / 1.6) % 2) ? Math.floor(x + .8) : Math.floor(x)) % 3 === 0 || Math.floor(z * 10) % 16 === 0) ? cmul(FV.brick, .78) : FV.brick });
      t3box(M, chimX - 4.2, cn - 3.7, RIDGE + 9, chimX + 4.2, cn + 3.7, RIDGE + 10.6, [96, 92, 88]) }
    else { t3cyl(M, chimX, cn, 2, cz0, RIDGE + 12, [118, 110, 104], { topCol: [60, 56, 54] }); t3cyl(M, chimX, cn, 3.4, RIDGE + 12, RIDGE + 13.4, [88, 84, 82], { topCol: [60, 56, 54] }) }
    // the windows: frames, dark glass with a cross (lit by the engine at night), shutters, a flower box
    const win = cx => { const fx0 = cx - winW / 2 - 1.4, fx1 = cx + winW / 2 + 1.4;
      t3face(M, [[fx0, -.3, winZ0 - 1.6], [fx1, -.3, winZ0 - 1.6], [fx1, -.3, winZ0 + winH + 1.6], [fx0, -.3, winZ0 + winH + 1.6]], trim, null, { both: true, zb: .2 });
      t3face(M, [[cx - winW / 2, -.5, winZ0], [cx + winW / 2, -.5, winZ0], [cx + winW / 2, -.5, winZ0 + winH], [cx - winW / 2, -.5, winZ0 + winH]], FV.glass, null, { both: true, inside: true, zb: .4, tex: (x, n, z) => (Math.abs(x - cx) < .5 || Math.abs(z - winZ0 - winH * .62) < .5) ? trim : null });
      if (shut) for (const sd of [-1, 1]) { const x0 = cx + sd * (winW / 2 + 1.6), x1 = cx + sd * (winW / 2 + 5.4); t3face(M, [[Math.min(x0, x1), -.8, winZ0 - .6], [Math.max(x0, x1), -.8, winZ0 - .6], [Math.max(x0, x1), -.8, winZ0 + winH + .6], [Math.min(x0, x1), -.8, winZ0 + winH + .6]], shut, null, { both: true, zb: .6, tex: (x, n, z) => Math.abs(z - winZ0 - winH / 2) < .4 ? cmul(shut, .72) : shut }) } };
    wins.forEach(win);
    if (gate) { // wide double gates thrown open: the dark inside between the leaves, the planks of the floor
      const gw = gate / 2, gh = Math.min(WALL - 3, 19); t3face(M, [[door - gw, -.4, 3], [door + gw, -.4, 3], [door + gw, -.4, gh], [door - gw, -.4, gh]], [36, 30, 26], null, { both: true, inside: true, zb: .3 });
      t3face(M, [[door - gw, 0, 3], [door + gw, 0, 3], [door + gw, 12, 3], [door - gw, 12, 3]], [66, 54, 42], null, { both: true, zb: .2 });
      for (const sx of [-1, 1]) t3face(M, [[door + sx * gw, -.5, 3], [door + sx * (gw + 4), -9, 3], [door + sx * (gw + 4), -9, gh], [door + sx * gw, -.5, gh]], FV.door, null, { both: true, zb: .5, tex: (x, n, z) => ((Math.round(n * 1.3) % 3) === 0) ? cmul(FV.door, .78) : FV.door }) }
    else { t3face(M, [[door - 4.5, -.4, 3], [door + 4.5, -.4, 3], [door + 4.5, -.4, 22], [door - 4.5, -.4, 22]], FV.door, null, { both: true, zb: .3, tex: x => (((Math.floor(x + 5) % 3) + 3) % 3 === 0 ? cmul(FV.door, .82) : FV.door) });
      t3box(M, door + 2.4, -1, 12, door + 3.4, -.4, 13, [200, 190, 150], { clean: true }) }
    // the east wall's window and the downpipe
    if (sideWin) t3face(M, [[HW + .5, D * .45, winZ0], [HW + .5, D * .45 + winW, winZ0], [HW + .5, D * .45 + winW, winZ0 + winH], [HW + .5, D * .45, winZ0 + winH]], FV.glass, null, { both: true, inside: true, zb: .4, tex: (x, n, z) => (Math.abs(n - D * .45 - winW / 2) < .5 || Math.abs(z - winZ0 - winH * .62) < .5) ? trim : null });
    t3box(M, -HW - 2, -OVR - 1.2, eave - 1.4, HW + 2, -OVR, eave - .3, [116, 120, 122]);
    // a porch: a deck, steps, two posts and a lean-to roof
    if (porch) { const PW = pw, rz = 23;
      t3box(M, door - PW, -PD, 0, door + PW, 0, PZ, FV.wood, { tex: (x, n, z) => z > PZ - .2 ? ((((Math.floor(n) % 2) + 2) % 2) ? FV.wood : cmul(FV.wood, .86)) : cmul(FV.wood, .7) });
      t3box(M, door - 5, -PD - 3, 0, door + 5, -PD, 2, cmul(FV.wood, .95));
      for (const sx of [-1, 1]) t3box(M, door + sx * (PW - 1.2) - 1, -PD + .6, PZ, door + sx * (PW - 1.2) + 1, -PD + 2.6, rz + 1, FV.woodD);
      t3face(M, [[door - PW - 2, -PD - 1.5, rz], [door + PW + 2, -PD - 1.5, rz], [door + PW + 2, 0, WALL - 2], [door - PW - 2, 0, WALL - 2]], roofCol, [0, -PD / 2, 0], { tex: roofT, zb: .3 }) }
    // things about the house
    for (const k of deco) {
      if (k === 'logs') for (let r = 0; r < 3; r++) for (let q = 0; q < 4 - r; q++) t3roll(M, -HW - 10, -HW - 1.5, 2 + q * 3.2 + r * 1.6, 1.5, [128, 96, 62], { z0: 3 + r * 2.6, endCol: [196, 164, 116] });
      if (k === 'bench') { t3box(M, HW - 20, -5, 4, HW - 4, -1.6, 5.2, FV.wood); for (const x of [HW - 18.5, HW - 5.5]) t3box(M, x - .6, -4.6, 0, x + .6, -2, 4, FV.woodD) }
      if (k === 'barrel') t3cyl(M, -HW + 4.5, -4.5, 3.6, 0, 9.5, [70, 84, 110], { topCol: [36, 44, 58] });
      if (k === 'buoys') for (let q = 0; q < 3; q++) { const bx = HW - 16 + q * 3.6, bz = 14 + (q % 2) * 2.4; t3box(M, bx - 1.4, -2.6, bz, bx + 1.4, -.5, bz + 3.2, q === 1 ? [236, 232, 220] : [222, 104, 40], { clean: true, zb: .5 }); t3line(M, [bx, -.5, bz + 3.2], [bx, -.5, bz + 6], [60, 50, 40]) }
      if (k === 'net') t3face(M, [[-HW + 3, -1, 20], [-HW + 16, -1, 20], [-HW + 15, -1, 9], [-HW + 4, -1, 11]], [78, 74, 52], null, { both: true, zb: .55, tex: (x, n, z) => ((Math.round(x + z) % 3 === 0) || (Math.round(x - z) % 3 === 0)) ? [90, 86, 60] : null });
      if (k === 'oars') for (const ox of [HW - 7, HW - 4.5]) { t3line(M, [ox, -1.4, 3], [ox + 1.4, -1.4, 26], FV.woodL); t3line(M, [ox + .5, -1.4, 3], [ox + 1.9, -1.4, 26], FV.woodD); t3box(M, ox - .4, -2.2, 2, ox + 1.4, -1, 8, FV.woodL) }
      if (k === 'aerial') { t3line(M, [HW - 10, D / 2, RIDGE], [HW - 10, D / 2, RIDGE + 14], [80, 82, 86]); for (let q = 0; q < 4; q++) t3line(M, [HW - 10 - 5 + q * .8, D / 2, RIDGE + 8 + q * 1.6], [HW - 10 + 5 - q * .8, D / 2, RIDGE + 8 + q * 1.6], [80, 82, 86]) }
      if (k === 'lamp') { t3line(M, [door + 8, -1.2, 22], [door + 8, -4, 22], [64, 64, 68]); t3box(M, door + 7, -5.2, 19.6, door + 9, -3.4, 21.8, [255, 236, 190], { clean: true }) }
    }
    return M };
  const sp = t3sprite(build, [0]), ax = sp[0].ax, ay = sp[0].ay;
  const P = (x, n, z) => t3p([x, n, z]);
  const L = [], WINS = []; wins.forEach((cx, i) => { const q = P(cx, 0, winZ0 + winH / 2); L.push({ x: q[0], y: q[1], r: 12, c: '255,206,128', a: .6, k: 'window', win: i }); L.push({ x: q[0], y: 2, r: 26, sy: .5, c: '255,196,120', a: .32, k: 'window', win: i });
    const a = P(cx - winW / 2, -.5, winZ0 + winH), b = P(cx + winW / 2, -.5, winZ0); WINS.push({ x0: Math.round(a[0]), y0: Math.round(a[1]), x1: Math.round(b[0]), y1: Math.round(b[1]), cx: Math.round(P(cx, -.5, 0)[0]), cz: Math.round(P(cx, -.5, winZ0 + winH * .62)[1]) }) });
  if (deco.includes('lamp')) { const q = P(door + 8, -4.4, 20.6); L.push({ x: q[0], y: q[1], r: 8, c: '255,214,160', a: .9, k: 'lamp', glare: true }); L.push({ x: 0, y: 14, r: 44, sy: .6, c: '255,190,120', a: .6, k: 'lamp', fall: 'sq' }) }
  const ch = P(chimX, D * .55, RIDGE + (chim === 'brick' ? 11 : 14)), e0 = P(-HW - 3, -OVR, eave), e1 = P(HW + 3, -OVR, eave);
  const solids = [[-HW - 2, -D - 1, HW + 2, 0]]; if (porch && !gate) solids.push([door - pw, 0, door + pw, PD + 3]);
  return { s: sp[0].s, ax, ay, night: null, lights: L, wins: WINS, drip: [[e0[0], e0[1], e1[0], e1[1], eave]], smoke: [[ch[0], ch[1]]], attach: P(HW - 2, 0, WALL), solids: solids.map(t3w) } };

// ---- a boat, seen from the south: a lofted hull (bow pointed, stern blunt), the outside painted, the inside bare wood, thwarts, oars.
// kind: 'row' or 'motor' (an outboard on the stern); up: turned over on the beach; water: afloat, with the ripples round it ----
PF.boat = ({ kind = 'row', col = [66, 112, 150], L = 46, up = false, water = false, flip = false, seed = 1 } = {}) => {
  const B = kind === 'motor' ? 9.2 : 7.6, H = kind === 'motor' ? 8 : 6.8, N = 18, ZM = H + 2.4, sg = flip ? -1 : 1, inner = [176, 142, 94], rim = [214, 186, 136];
  const beam = t => { const u = 2 * t - 1, a = Math.abs(u); return B * (u > 0 ? Math.pow(Math.max(0, 1 - Math.pow(a, 2.2)), .8) : Math.pow(Math.max(0, 1 - Math.pow(a, 4)), .55)) };
  const sheer = t => H + 1.9 * Math.pow(Math.max(0, 2 * t - 1), 2.4) + .5 * Math.pow(Math.max(0, 1 - 2 * t), 2);
  const Z = z => up ? ZM - z : z, X = t => (t - .5) * L * sg;
  const strake = (c, seed) => (x, n, z) => (Math.round(z * (up ? -1 : 1) / 1.3) % 2 === 0 ? c : cmul(c, .9)) ;
  const sp = t3sprite(() => { const M = T3(), K = t => [X(t), 0, Z(0)], C = (t, s) => [X(t), s * beam(t) * .6, Z(sheer(t) * .36)], G = (t, s) => [X(t), s * beam(t), Z(sheer(t))], ctr = [0, 0, Z(H * .5)];
    const lower = cmul(col, .5);
    for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; for (const s of [-1, 1]) {
      t3face(M, [K(t0), K(t1), C(t1, s), C(t0, s)], lower, ctr, { tex: (x, n, z) => h2(Math.floor(x / 3), Math.floor(z), seed) < .2 ? cmul(FV.tar, 1.3) : FV.tar });
      t3face(M, [C(t0, s), C(t1, s), G(t1, s), G(t0, s)], col, ctr, { tex: strake(col, seed) }) } }
    if (!up) { const IN = (t, s, k) => [X(t), s * Math.max(0, beam(t) - .8) * k, Z(sheer(t) * (k === 1 ? 1 : .3) - (k === 1 ? .2 : 0))];
      for (let i = 0; i < N; i++) { const t0 = i / N, t1 = (i + 1) / N; for (const s of [-1, 1]) t3face(M, [IN(t0, s, 1), IN(t1, s, 1), IN(t1, s, .02), IN(t0, s, .02)], inner, null, { both: true, tex: (x, n, z) => z > sheer(.5) - 1.5 ? cmul(col, 1.1) : z < 1.6 ? [112, 86, 58] : (Math.round(n / 1.5) % 2 === 0) ? inner : cmul(inner, .86) }) }
      for (let i = 0; i < N; i++) for (const s of [-1, 1]) { const t0 = i / N, t1 = (i + 1) / N; t3face(M, [G(t0, s), G(t1, s), IN(t1, s, 1), IN(t0, s, 1)], rim, null, { both: true, zb: .4 }) }
      for (const t of [.3, .52, .72]) { const x = X(t), bw = beam(t) - .8; t3box(M, x - 1.5, -bw, Z(sheer(t) * .62), x + 1.5, bw, Z(sheer(t) * .62) + .8, [214, 182, 128]); t3box(M, x - 1.5, -bw, Z(sheer(t) * .62) - .8, x + 1.5, -bw + .8, Z(sheer(t) * .62), cmul(inner, .8)) }
      if (kind === 'row') for (const s of [-1, 1]) { t3line(M, [X(.34), s * 1, Z(sheer(.4) * .6)], [X(.78) + 0, s * (beam(.5) + 1), Z(sheer(.5))], FV.woodL); t3box(M, X(.78) - 2.6, s * (beam(.5) + 1) - .8, Z(sheer(.5)) - .4, X(.78), s * (beam(.5) + 1) + .8, Z(sheer(.5)) + .4, FV.woodL) } }
    // the stern: a transom, and an outboard motor on it
    const tr = X(0); t3face(M, [G(0, -1), G(0, 1), C(0, 1), K(0), C(0, -1)], col, [X(.3), 0, Z(H * .5)], { tex: strake(col, seed), both: false });
    if (kind === 'motor' && !up) { t3box(M, tr - 3.4 * sg, -2.4, Z(H - 4), tr + .4 * sg, 2.4, Z(H + 4.6), [186, 56, 44]); t3box(M, tr - 3.4 * sg, -2.4, Z(H + 4.6), tr + .4 * sg, 2.4, Z(H + 5.4), [60, 60, 64]); t3line(M, [tr - 2 * sg, 0, Z(H - 4)], [tr - 2.6 * sg, 0, Z(-3)], [70, 70, 74]); t3cyl(M, X(.18), 3, 2.8, Z(H * .6), Z(H * .6 + 5), [196, 70, 52], { topCol: [60, 56, 54] }) }
    // the stem post
    t3line(M, G(1, 0), [X(1), 0, Z(sheer(1) + 1.4)], rim);
    if (up) for (const t of [.3, .7]) t3box(M, X(t) - 1.2, -beam(t) * .5, 0, X(t) + 1.2, beam(t) * .5, Z(sheer(t) * .34), cmul(FV.wood, .8)); // (rests under a turned-over boat)
    if (water) t3face(M, Array.from({ length: 20 }, (_, i) => [Math.cos(i / 20 * TAU) * (L / 2 + 5), Math.sin(i / 20 * TAU) * (B + 3.4), .2]), [150, 190, 204], null, { both: true, flat: true, z: -50, tex: (x, n) => { const rr = Math.hypot(x / (L / 2 + 5), n / (B + 3.4)); if (rr > 1 || rr < .82) return null; return h2(Math.round(x), Math.round(n), seed) < .5 ? [150, 190, 204] : null } });
    return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, flat: false, solids: water ? [] : [[-L / 2 - 1, -B - 1.5, L / 2 + 1, B + 1.5]].map(t3w) } };


// ---- a rack of nets drying: two posts, a rail, nets hanging from it that sway in the wind (their lower edge most) ----
const fvFrames = build => { const Ms = T3LEANS.map(build); let x0 = 0, y0 = 0, x1 = 0, y1 = 0; const grow = p => { const q = t3p(p); x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]) };
  for (const M of Ms) { for (const f of M.faces) f.pts.forEach(grow); for (const L of M.lines) { grow(L.a); grow(L.b) } for (const [p] of M.dots) grow(p) }
  const ax = Math.ceil(-x0) + 2, ay = Math.ceil(-y0) + 2, w = Math.ceil(x1 - x0) + 5, h = Math.ceil(y1 - y0) + 5;
  return Ms.map(M => { const s = new Spr(w, h); t3draw(s, M, ax, ay, 0, M.seed || 1); s.outline(.36, .58); rimSpr(s); dnFill(s); return { s, ax, ay } }) };
PF.netrack = ({ len = 56, nets = 2, seed = 7, col = [84, 82, 54], hang = 15 } = {}) => {
  const HL = len / 2, TOP = 29, build = k => { const M = T3(), rnd = mulberry(seed); M.seed = seed;
    for (const x of [-HL, HL]) { t3post(M, x, 0, 1.2, TOP + 1, FV.wood); t3line(M, [x, -6, 0], [x, 0, TOP - 6], FV.woodD); t3line(M, [x + .6, -6, 0], [x + .6, 0, TOP - 6], FV.wood) }
    t3roll(M, -HL - 3, HL + 3, 0, 1, FV.wood, { z0: TOP - 1, endCol: FV.woodL });
    const sw = k * 2.4, nw = len / nets;
    for (let q = 0; q < nets; q++) { const x0 = -HL + q * nw + 1.5, x1 = -HL + (q + 1) * nw - 1.5, pts = [[x0, -.9, TOP - 1.5], [x1, -.9, TOP - 1.5]], steps = 9;
      for (let i = steps; i >= 0; i--) { const u = i / steps, x = x0 + (x1 - x0) * u, z = TOP - 1.5 - hang * (.75 + .25 * Math.sin(u * 7 + q * 2 + rnd() * .4)) * (1 - .16 * Math.abs(2 * u - 1)); pts.push([x + sw * (TOP - z) / hang, -.9 - (TOP - z) * .03, z]) }
      t3face(M, pts, col, null, { both: true, fabric: true, zb: .4, tex: (x, n, z) => { const g = ((Math.round(x * .75 + z * .75) % 3 === 0) || (Math.round(x * .75 - z * .75) % 3 === 0)); return g ? (h2(Math.round(x), Math.round(z), seed) < .12 ? cmul(col, 1.5) : col) : null } });
      for (let x = x0 + 1; x < x1; x += 3.4) M.dots.push([[x, -1.1, TOP - 2.4], [214, 172, 112]]);
      for (let i = 0; i <= steps; i += 2) { const u = i / steps, x = x0 + (x1 - x0) * u, z = TOP - 1.5 - hang * (.75 + .25 * Math.sin(u * 7 + q * 2)) * (1 - .16 * Math.abs(2 * u - 1)); M.dots.push([[x + sw * (TOP - z) / hang, -1.1, z + .6], [112, 116, 120]]) } }
    return M };
  const FR = fvFrames(build), sp = FR[2];
  return { s: sp.s, ax: sp.ax, ay: sp.ay, frames: FR.map(g => ({ s: g.s, night: null })), solids: [[-HL - 1.6, -1.8, -HL + 1.6, 1.8], [HL - 1.6, -1.8, HL + 1.6, 1.8]].map(t3w) } };

// ---- a rack of drying fish: posts, rails, fish hung by the tail in pairs (golden smoked ones and silver salted ones) ----
PF.fishrack = ({ len = 44, rows = 3, seed = 11, gold = .55 } = {}) => { const HL = len / 2, r = mulberry(seed);
  const sp = t3sprite(() => { const M = T3(); M.seed = seed;
    for (const x of [-HL, HL]) { t3post(M, x, 0, 1.1, 30, FV.wood); t3line(M, [x, -5, 0], [x, 0, 24], FV.woodD) }
    for (let k = 0; k < rows; k++) { const z = 14 + k * 6.5; t3roll(M, -HL - 2, HL + 2, 0, .7, FV.woodL, { z0: z, endCol: FV.woodL });
      for (let x = -HL + 2; x < HL - 1; x += 2.6) { const g = r() < gold, c = g ? [188 + r() * 20, 128 + r() * 20, 56] : [168 + r() * 14, 174 + r() * 10, 180], f = 2.4 + r() * .8;
        t3box(M, x, -1.8, z - f, x + 1.5, -.6, z - .3, c, { clean: true, zb: .4 }); t3box(M, x + .3, -.9, z - f - .6, x + 1.2, -.6, z - f, cmul(c, .8), { clean: true, zb: .4 }) } }
    t3box(M, HL + 4, -2, 0, HL + 9, 2, 3, [196, 70, 52]); t3box(M, HL + 4, -2, 3, HL + 9, 2, 3.8, [226, 120, 84]); // a crate beneath
    return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-HL - 1.6, -1.8, -HL + 1.6, 1.8], [HL - 1.6, -1.8, HL + 1.6, 1.8], [HL + 3.6, -2.4, HL + 9.4, 2.4]].map(t3w) } };

// ---- a smokehouse: a small sooty hut with a pipe that smokes; a gate for the boats' shed: both are houses with other numbers ----
PF.smokehouse = (o = {}) => PF.house(Object.assign({ w: 30, d: 26, h: 20, wall: 'board', col: [96, 76, 60], roof: 'tin', roofCol: [78, 72, 68], porch: false, wins: [], door: -3, chim: 'pipe', chimX: 8, sideWin: false, deco: ['logs', 'barrel'], seed: 9 }, o));
PF.boatshed = (o = {}) => PF.house(Object.assign({ w: 86, d: 48, h: 27, wall: 'board', col: [132, 120, 104], roof: 'tin', roofCol: [92, 84, 76], porch: false, wins: [], door: 0, gate: 34, chim: 'pipe', chimX: 30, sideWin: false, deco: ['oars', 'net', 'buoys'], seed: 13 }, o));

// ---- barrels, crates, a well, a piling ----
PF.barrels = ({ seed = 3, n = 3 } = {}) => { const r = mulberry(seed), C = [[70, 84, 110], [150, 76, 54], [58, 104, 96], [196, 170, 60]];
  const sp = t3sprite(() => { const M = T3(); M.seed = seed; for (let i = 0; i < n; i++) t3cyl(M, i * 8.4 - (n - 1) * 4.2, (i % 2) * 2.4, 3.6, 0, 9.6 + r() * 1.5, C[Math.floor(r() * C.length)], { topCol: [44, 46, 52] });
    t3box(M, -(n - 1) * 4.2 - 5, -9, 0, -(n - 1) * 4.2 + 3, -4, 2.2, FV.woodD); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-(n - 1) * 4.2 - 4.8, -6.2, (n - 1) * 4.2 + 4.8, 3.8]].map(t3w) } };
PF.crates = ({ seed = 4 } = {}) => { const r = mulberry(seed);
  const sp = t3sprite(() => { const M = T3(); M.seed = seed; for (const [x, z] of [[-6, 0], [6, 0], [0, 6.4]]) { const c = r() < .5 ? [58, 104, 150] : [214, 118, 48];
      t3box(M, x - 5.4, -3.6, z, x + 5.4, 3.6, z + 6.2, c, { tex: (X, N, Z) => (Z > z + 5.2 && N > -3 && N < 3 && Math.abs(X - x) < 4.8) ? [160 + r() * 20, 166, 172] : (Math.round(Z * 1.4) % 3 === 0 ? cmul(c, .82) : c) }) }
    return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-11.5, -4, 11.5, 4]].map(t3w) } };
PF.piling = ({ h = 16, tire = false, seed = 5 } = {}) => { const sp = t3sprite(() => { const M = T3(); M.seed = seed; t3cyl(M, 0, 0, 1.7, 0, h, [96, 76, 56], { topCol: [150, 126, 94] }); t3line(M, [-1.7, -.2, h - 2], [1.7, -.2, h - 2], [60, 56, 50]);
    if (tire) t3cyl(M, 0, -1.4, 2.8, h * .55, h * .55 + 2.4, [34, 34, 36], { topCol: [40, 40, 42] }); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-2.4, -2.4, 2.4, 2.4]].map(t3w) } };
PF.well = ({ seed = 6 } = {}) => { const sp = t3sprite(() => { const M = T3(), W = 8, D = 8, R = [96, 72, 52], RL = [150, 116, 78]; M.seed = seed;
    for (let c = 0; c < 6; c++) { const z = c * 2.2; t3roll(M, -W - 1, W + 1, 0, 1.15, c % 2 ? RL : [140, 106, 70], { z0: z, endCol: FV.woodL }); t3roll(M, -W - 1, W + 1, D, 1.15, c % 2 ? [140, 106, 70] : RL, { z0: z, endCol: FV.woodL }) }
    t3box(M, -W + 1, 1, 12.6, W - 1, D - 1, 13.2, [14, 12, 10]); // the dark mouth
    for (const x of [-W + 1, W - 1]) t3box(M, x - .9, D / 2 - .9, 13, x + .9, D / 2 + .9, 34, FV.woodD);
    t3roll(M, -W + 1, W - 1, D / 2, 1.3, FV.woodL, { z0: 21, endCol: FV.woodL }); t3line(M, [W, D / 2 - 1, 22.5], [W + 3, D / 2 - 1, 22.5], [90, 90, 96]); t3line(M, [W + 3, D / 2 - 1, 22.5], [W + 3, D / 2 - 1, 19], [90, 90, 96]);
    t3line(M, [2, D / 2, 21.6], [2, D / 2, 14.5], [80, 80, 86]); t3cyl(M, 2, D / 2, 1.9, 12.8, 15.4, [96, 98, 104], { topCol: [60, 60, 66] });
    const rz = 34; t3face(M, [[-W - 2, -2, rz - 5], [0, -2, rz + 4], [0, D + 2, rz + 4], [-W - 2, D + 2, rz - 5]], [96, 70, 48], [0, D / 2, 14], { tex: x => ((Math.round(x) % 3) + 3) % 3 === 0 ? [72, 52, 36] : [102, 76, 52] });
    t3face(M, [[W + 2, -2, rz - 5], [0, -2, rz + 4], [0, D + 2, rz + 4], [W + 2, D + 2, rz - 5]], [96, 70, 48], [0, D / 2, 14], { tex: x => ((Math.round(x) % 3) + 3) % 3 === 0 ? [72, 52, 36] : [102, 76, 52] });
    t3face(M, [[-W - 2, -2.2, rz - 5], [W + 2, -2.2, rz - 5], [0, -2.2, rz + 4]], FV.wood, null, { both: true, zb: .2 }); return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-9.5, -10, 9.5, 2]].map(t3w) } };
