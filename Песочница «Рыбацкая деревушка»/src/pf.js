// =====================================================================================================================
// THE FISHING VILLAGE: its palettes, the glints of the open water and the prefabs (houses, boats, nets, racks...).
// =====================================================================================================================
const BAYP = P(['#22394a', '#284456', '#2e4e60', '#36596b', '#466a7a', '#5f8090']), BEACHP = P(['#8d7d5a', '#9d8d68', '#ae9e78', '#bfb088', '#cfc29a']);
// the distance to the SHORE OF THE WATER, whatever layers it is made of: the bays are ellipses that overlap (the edge of one may lie out in the open water of
// the other, where there is no shore at all), and a layer with `carve` (a headland, a spit) is land laid over the water. Negative inside the water, as layerD.
function bayDist(x, y) { let d = 1e9, c = 1e9; for (const B of layersNear(x, y)) { if (B.mat === 'lake') { const e = layerD(B, x, y); if (e < d) d = e } else if (B.carve) { const e = layerD(B, x, y); if (e < c) c = e } }
  return c < 1e8 ? Math.max(d, -c) : d }
// the colour of the open water of a bay at distance d (negative: inside) from its shore
function bayColor(x, y, d) {
  if (d > -1.3) return GW.wetsand[quant(vn(x * .3, y * .3, SEED + 590), x, y, 2)];
  if (d > -9) return cmix(BAYP[5], BEACHP[1], clamp(.55 - (-d - 3.4) * .09, 0, .55)); // sand showing through the shallows
  const dep = clamp(-d / 110, 0, 1), nn = vn(x * .05, y * .12, SEED + 593) * .6 + vn(x * .16, y * .5, SEED + 594) * .4; let c = BAYP[quant(.18 + dep * .24 + nn * .5, x, y, 6, .5)];
  return c } // (no streaks of light baked in: the glints and the ripples are the water's own, drawn moving)
// jagged stones on a jittered grid, lit from the upper left: how far from the gap between stones, the stone's tone and where on it
function stoneCell(x, y, S, sd) { const gx = x / S, gy = y / S, ix = Math.floor(gx), iy = Math.floor(gy); let d1 = 9, d2 = 9, id = 0, ox = 0, oy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const a = ix + i, b = iy + j, cx = a + .15 + .7 * h2(a, b, sd), cy = b + .15 + .7 * h2(a, b, sd + 1), dx = gx - cx, dy = (gy - cy) * 1.25, d = dx * dx + dy * dy;
    if (d < d1) { d2 = d1; d1 = d; id = h2(a, b, sd + 2); ox = dx; oy = dy } else if (d < d2) d2 = d }
  return { gap: Math.sqrt(d2) - Math.sqrt(d1), id, ox, oy } }
// an embankment across the water, rising out of the ground: where the street comes onto it the gravel is spread over the dirt road bit by bit and the
// slopes grow out of nothing; across the water it has a gravel top with two ruts, dry sedge verges and rough stone riprap on both slopes (the
// south slope, turned to us, is the broader), waves breaking on it. A layby (L.pad, on L.side) is a short second embankment beside the first.
const SKIPS = []; // (the layers asked for the ground that lies below them)
const DAM = { top: 11, vg: 13.4, ns: 17, st: 24 }; // the half-widths: the gravel top, the verge, the north riprap's end, the south stone face's end
const DAMG = { best: 0, sd: 1, rim: 0, u: 0, tot: 0, e: 0 }; // the distance to the line, which side, where the water begins on the north side, how far along it, how long it is
const ssm = (a, b, v) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u) };
function damGeom(L, x, y) { let best = 1e9, sd = 1, u = 0; const P = L.line; if (!L._cum) { L._cum = [0]; for (let i = 1; i < P.length; i++) L._cum.push(L._cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])) }
  for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, v = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1), dd = Math.hypot(x - ax - dx * v, y - ay - dy * v); if (dd < best) { best = dd; sd = dx * (y - ay) - dy * (x - ax) >= 0 ? 1 : -1; u = L._cum[i] + v * Math.sqrt(l2) } }
  const K = L.dam || DAM, tot = L._cum[L._cum.length - 1], e = (vn(x * .2, 1, SEED + 51) - .5) * 1.6, sw = L.pad ? ssm(0, 14, u) * ssm(0, 14, tot - u) : ssm(0, 130, u);
  DAMG.best = best; DAMG.sd = sd; DAMG.u = u; DAMG.tot = tot; DAMG.e = e; DAMG.sw = sw; DAMG.rim = K.top + (K.ns - K.top) * sw + e; return DAMG }
// which part of it a point is: 1 the gravel top, 2 the verge, 3 the north riprap, 4 the south stone face, 0 none (the ground below shows: the road under the
// thin gravel, the water beyond the slope); DAMG.edge: how far beyond the slope's end (the water's edge) it is
const DP = { part: 0, edge: 0, gf: 1 };
function damPart(L, x, y) { const g = damGeom(L, x, y), K = L.dam || DAM, best = g.best, sd = g.sd, e = g.e, sw = g.sw, side = L.side || 0, pad = !!L.pad; DP.part = 0; DP.gf = pad ? 1 : ssm(8, 110, g.u);
  const TOP = K.top, VG = TOP + (K.vg - TOP) * sw, NS = TOP + (K.ns - TOP) * sw, ST = TOP + (K.st - TOP) * sw, lim = sd < 0 ? NS : ST; DP.edge = best - lim - e;
  if (pad && side && sd !== side) { DP.edge = -1; return 0 }
  if (best < TOP * (pad ? sw : 1) + e * .5) { if (!pad && (vn(x * .12, y * .12, SEED + 60) * .6 + h2(x, y, SEED + 61) * .4) > DP.gf) return 0; DP.part = 1; return 1 }
  if (best < VG + e) { if (sw < .14) return 0; DP.part = 2; return 2 }
  if (best < lim + e) { if (sw < .5 && h2(x, y, SEED + 62) > sw * 2) return 0; DP.part = sd < 0 ? 3 : 4; return DP.part }
  return 0 }
function damColor(L, x, y, d) { const part = damPart(L, x, y), g = DAMG, best = g.best, sd = g.sd, e = g.e, sw = g.sw, K = L.dam || DAM, TOP = K.top, VG = TOP + (K.vg - TOP) * sw, ST = TOP + (K.st - TOP) * sw, gf = DP.gf;
  if (part === 0) { SKIPS.push(L); const c = groundColor(x, y); SKIPS.pop(); return c }
  if (part === 1) { if (Math.abs(best - 5.4) < 1 && gf > .6) return G.rut; const v = .55 + (fbm(x * .05, y * .05, SEED + 9) - .5) * .3 + (vn(x * .18, y * .18, SEED + 12) - .5) * .1; let c = PAL.stone[quant(clamp(v, 0, 1), x, y, 5, .35)]; const st = h2(x, y, SEED + 10); if (st < .012) c = PAL.stone[4]; else if (st < .03) c = PAL.stone[2]; return c }
  if (part === 2) return K_sedge(x, y);
  if (part === 3) { const s = stoneCell(x, y, 3.4, 61); if (s.gap < .12) return [52, 50, 46]; return PAL.stone[quant(.5 + (-s.oy * .8 - s.ox * .5 + (s.id - .5) * .4), x, y, 5, .4)] }
  const t = clamp((best - VG - e) / Math.max(4, ST - VG), 0, 1), s = stoneCell(x, y * 1.15, 4.2, 72); // the broad stone face on the south
  if (t < .1) return PAL.stone[3]; if (s.gap < .1) return [40, 38, 36];
  let c = PAL.stone[quant(clamp(.55 - s.oy * .5 - s.ox * .3 + (s.id - .5) * .5 - t * .55, 0, 1), x, y, 5, .45)];
  if (t > .8 && vn(x * .3, y, SEED + 74) > .45) c = PAL.moss[1 + (h2(x, y, SEED + 75) < .5 ? 1 : 0)]; return c }
// the layer under the dams that show nothing here (their thin gravel, the water beyond their slopes)
function underLayer(x, y) { return layerAt(x, y) }
// a point of a dam's layer where there is no slope any more but the water below: the bike may not go there
function damWater(x, y) { for (const L of layersNear(x, y)) { if (L.mat !== 'dam' || layerD(L, x, y) >= 0) continue; if (damPart(L, x, y) !== 0) return false; if (L.pad && L.side && DAMG.sd !== L.side) continue;
    const h = underLayer(x, y); if (h.L && h.L.mat === 'lake') return true } return false }
const K_sedge = (x, y) => K_q(h2(x, y, SEED + 67) < .45 ? PAL.straw : PAL.sedge, .4 + vn(x * .3, y * .3, SEED + 68) * .5, x, y);
const K_q = (pal, v, x, y) => pal[quant(v, x, y, pal.length, .7)];
// ---- the jetty: a plank pier 2.8 m wide (a village jetty: a cart can go out on it, a house is wider) standing 60 cm above the water, with a ramp up to it
// across its whole south end. It is drawn into the ground like the rest of the plan (as the roads are: the ground is the map, it does not lean), but as the
// eye sees a raised deck: its top lies H px up from the plan footprint (the rider riding on it is drawn lifted by as much), the ramp running up to it from
// the sand, the east side a little thick, a hard dark outline all round. Its sides are kerbs the bike cannot cross: it is got onto by the ramp only, and left
// by it. (Coordinates: the place's own.)
const PIER = { x: 640, w: 14, y0: 100, y1: 244, ramp: 22, H: 6, bm: 3.5 };
const PIERC = { gap: [40, 31, 24], line: [26, 19, 14], plank: [140, 115, 84], beam: [122, 98, 70], dark: [84, 66, 46] };
// the decking: boards across the deck (one board across, a joint now and then over the middle joist), one weathered tone with only a faint difference from
// board to board, a very few replaced ones a shade lighter, the grain along each; a nail at each end of every board and one at the joist on every other row
function pierBoard(lx, n, k) { const P = PIER, X0 = P.x - P.w + P.bm, X1 = P.x + P.w - P.bm, row = Math.floor(n / 3), f = n / 3 - row, sd = SEED + 810; if (f < .15) return cmul(PIERC.gap, k);
  const cj = (X0 + X1) / 2 + (h2(row, 2, sd) - .5) * 6, jn = h2(row, 5, sd) < .24, left = lx < cj;
  if (jn && Math.abs(lx - cj) < .5) return cmul(PIERC.gap, k);
  const pc = h2(row, jn ? (left ? 3 : 4) : 3, sd); let m = .97 + .06 * pc; if (pc > .95) m *= 1.09; else if (pc < .04) m *= .9;
  m *= .96 + .08 * vn(lx * .22, row * 2.3 + (left ? 0 : 5), sd + 7); if (vn(lx * .05 + row * .06, n * .03, sd + 9) > .62) m *= .94; // (the damp patches of an old deck)
  m *= f < .4 ? 1.05 : f > .92 ? .93 : 1; // the board's bevel
  if (f > .45 && f < .64) { const nl = jn ? (left ? [X0 + 1.4, cj - 1.4] : [cj + 1.4, X1 - 1.4]) : [X0 + 1.4, X1 - 1.4]; if (Math.abs(lx - nl[0]) < .5 || Math.abs(lx - nl[1]) < .5 || (row % 2 && Math.abs(lx - (X0 + X1) / 2) < .5)) m *= .55 }
  return cmul(PIERC.plank, k * m) }
function pierColor(L, x, y) { const lx = x - OX, ly = y - OY, P = PIER, H = P.H, X0 = P.x - P.w, X1 = P.x + P.w, yt0 = P.y0 - H, yt1 = P.y1 - H, yb = P.y1 + P.ramp, LN = PIERC.line, sd = SEED + 810, B = P.bm;
  const under = () => { SKIPS.push(L); const c = groundColor(x, y); SKIPS.pop(); return c };
  if (ly >= yt0 && ly < P.y1 && lx >= X1 && lx < X1 + 3.5) { // the east face of the deck, seen edge-on: the fascia board and the shadow under it
    if (lx >= X1 + 2.5 || ly < yt0 + 1) return LN; const k = ly > yt1 ? .6 : 1; if (lx < X1 + .8) return cmul(PIERC.plank, .92 * k); return cmul(Math.floor((ly - yt0) / 6) % 2 ? PIERC.dark : cmul(PIERC.dark, .86), k) }
  if (ly >= yt0 && ly < yt1 && lx >= X0 && lx < X1) { // the top of the deck
    if (lx < X0 + 1 || ly < yt0 + 1) return LN; const n = yt1 - ly;
    if (n > P.y1 - P.y0 - 4) return cmul(PIERC.beam, (n > P.y1 - P.y0 - 1 ? .78 : 1.08) * (.96 + .08 * vn(lx * .3, n * .2, sd + 4))); // the head beam across the far end
    if (lx < X0 + B || lx >= X1 - B) { // the long beams along each side: one timber, a shade darker than the boards, a joint every so often
      const e = lx < X0 + B ? lx - X0 : X1 - lx; if (e >= B - .8 && e < B) return cmul(PIERC.gap, 1.15); const off = lx < P.x ? 17 : 41; if (((n + off) % 62) < .6) return PIERC.gap;
      return cmul(PIERC.beam, (e < 1.8 ? 1.08 : 1) * (.94 + .1 * vn(n * .06, lx * .4, sd + 3))) }
    return pierBoard(lx, n, 1) }
  if (ly >= yt1 && ly < yb && lx >= X0 && lx < X1) { // the ramp across the whole end: the same boards, the long timbers each side running down, a cross-beam where it meets the deck, a threshold beam at the foot, sand blown on the boards
    const n = (yb - ly) / (1 + H / P.ramp);
    if (lx < X0 + 1 || ly >= yb - 1) return LN; if (ly >= yb - 3) return cmul(PIERC.dark, ly >= yb - 2 ? .9 : 1.12); // the threshold
    if (ly < yt1 + 1.4) return ly < yt1 + .5 ? cmul(PIERC.beam, 1.1) : cmul(PIERC.gap, 1.2);
    if (lx < X0 + B || lx >= X1 - B) { const e = lx < X0 + B ? lx - X0 : X1 - lx; if (e >= B - .8) return cmul(PIERC.gap, 1.15); return cmul(PIERC.beam, (e < 1.8 ? 1.08 : 1) * (.94 + .1 * vn(n * .06, lx * .4, sd + 3))) }
    let c = pierBoard(lx, n + 3, 1.03); if (n < 9 && h2(x, y, sd + 21) < .5 * (1 - n / 9) * (.5 + vn(x * .3, y * .5, sd + 22))) c = cmix(c, [178, 160, 118], .75); return c }
  if (ly >= yt1 && ly < yb && lx >= X1 && lx < X1 + 3.4 * (yb - ly) / (yb - yt1)) return lx >= X1 + 3.4 * (yb - ly) / (yb - yt1) - 1 ? LN : cmul(PIERC.dark, .9); // (the side of the ramp, a wedge)
  return under() }
// how high above the ground a figure stands at (x, y) (world coordinates): on the deck, H; up the ramp, from 0 to H
function deckLift(x, y) { const P = PIER, lx = x - OX, ly = y - OY; if (lx < P.x - P.w || lx > P.x + P.w || ly < P.y0 - 4 || ly > P.y1 + P.ramp) return 0;
  return ly <= P.y1 ? P.H : P.H * (1 - (ly - P.y1) / P.ramp) }
const objLift = o => o._lf === undefined ? (o._lf = deckLift(o.x, o.y)) : o._lf;
// the kerbs: along the sides of the deck and of the ramp, across its end and under its front face, nothing for a bike to cross
const DECKO = { id: 'jetty', type: 'jetty' };
function deckBlocked(x, y, rad) { const P = PIER, lx = x - OX, ly = y - OY; if (lx < P.x - P.w - 4 - rad || lx > P.x + P.w + 4 + rad || ly < P.y0 - 5 - rad || ly > P.y1 + P.ramp + rad) return false;
  const X0 = P.x - P.w, X1 = P.x + P.w, hit = (a, b, c, d) => lx > a - rad && lx < c + rad && ly > b - rad && ly < d + rad;
  return (hit(X0 - 2, P.y0 - 4, X0 + 1.6, P.y1 + P.ramp - 1) || hit(X1 - 1.6, P.y0 - 4, X1 + 3, P.y1 + P.ramp - 1) || hit(X0 - 2, P.y0 - 4, X1 + 3, P.y0 + 1.6)) ? DECKO : false }
let RLIFT = 0; // (how high the rider is just now: eased, so the ramp is climbed and not jumped)

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
    wins = [-18, 18], door = 0, shut = null, deco = [], seed = 3, sideWin = true, gate = 0, decay = .5, shutBad = [], fallen = 0, lampC = '255,214,160', lampFlick = false, tarp = null, dishAt = null, meter = null, lampX = null } = {}) => {
  const HW = w / 2, D = d, WALL = h, OVR = 3, RISE = Math.round(d * .3), RIDGE = WALL + RISE, eave = WALL - OVR * RISE / (D / 2), PD = 14, PZ = 4;
  const wallC = wall === 'log' ? col : col, wallT = wall === 'log' ? fvLogs(col, 3.2, seed) : fvBoards(col, 3.4, seed), roofT = roof === 'tin' ? fvTin(roofCol, seed) : fvShingle(roofCol, seed);
  const winZ0 = 9, winH = 11, winW = 9;
  // the weather and the years on the walls: paint peeled to grey wood (mostly at the foot and under the eaves), boards gone soft and dark, a board missing, stains under the windows, damp green at the ground
  const wearW = (base, sw) => (x0, n0, z) => { const x = sw ? n0 : x0, n = sw ? x0 : n0; let c = base(x0, n0, z), sd = seed + 40;
    if (vn(x * .16 + n * .12, z * .3, sd) + (z < 9 ? .12 : 0) + (z > WALL - 4 ? .08 : 0) - decay * .2 > .78 - decay * .12) c = cmix(c, [146, 134, 116], .72);
    if (z < 13 && vn(x * .35, z * .45, sd + 1) > .92 - decay * .08) c = cmix(c, [62, 48, 36], .75);
    const bc = Math.floor(x / 3.4); if (z < 16 && h2(bc, 9, sd) < decay * .06 && ((z + h2(bc, 10, sd) * 9) % 12) < 6.5) c = [30, 26, 22];
    for (const cx of sw ? [] : wins) if (Math.abs(x - cx) < winW / 2 + 1.2 && z < winZ0 && z > winZ0 - 8 && vn(x * .6, z * .25, sd + 2) > .35) c = cmul(c, .84);
    if (z < 3.6 && vn(x * .4, n * .4 + z, sd + 3) > .5) c = cmix(c, [74, 92, 52], .4); return c };
  const wallW = wearW(wallT);
  // patches on the roof: a new sheet of bright tin, a repainted one, a square of tar paper, here and there a shingle gone
  const roofP = (x, n, z) => { let c = roofT(x, n, z); const cx = Math.floor(x / 7), cn = Math.floor(n / 5), r = h2(cx, cn, seed + 60), sd = seed + 61;
    if (r < decay * .24) { const q = h2(cx, cn, sd); const base = q < .4 ? [176, 176, 170] : q < .7 ? [92, 70, 62] : [44, 40, 36]; const fx = x - cx * 7, fn = n - cn * 5; if (fx < .5 || fn < .5) return cmul(base, .66); if (q < .4 && Math.abs(fx - 3.5) < .4) return cmul(base, .84); c = cmix(base, c, .12) }
    else if (roof === 'shingle' && h2(Math.floor(x / 3), Math.floor(n / 2.4), seed + 62) < decay * .05) c = [38, 34, 30]; return c };
  const build = () => { const M = T3(), ctr = [0, D / 2, WALL / 2], rnd = mulberry(seed + 77);
    // the walls
    t3face(M, [[-HW, 0, 3], [HW, 0, 3], [HW, 0, WALL], [-HW, 0, WALL]], wallC, ctr, { tex: wallW });
    t3face(M, [[-HW, D, 3], [HW, D, 3], [HW, D, WALL], [-HW, D, WALL]], wallC, ctr, { tex: wallW });
    t3face(M, [[-HW, 0, 3], [-HW, D, 3], [-HW, D, WALL], [-HW, 0, WALL]], wallC, ctr, { tex: wall === 'log' ? wearW(wallT, true) : wearW((x, n, z) => fvBoards(col, 3.4, seed + 1)(n, x, z), true) });
    t3face(M, [[HW, 0, 3], [HW, D, 3], [HW, D, WALL], [HW, 0, WALL]], wallC, ctr, { tex: wall === 'log' ? wearW(wallT, true) : wearW((x, n, z) => fvBoards(col, 3.4, seed + 1)(n, x, z), true) });
    // the plinth of field stone, the corner boards (or the log ends)
    t3box(M, -HW - 1, -1, 0, HW + 1, D + 1, 3, FV.plinth, { tex: (x, n, z) => h2(Math.floor(x / 4), Math.floor(z / 1.5), seed) < .3 ? cmul(FV.plinth, .82) : FV.plinth });
    if (wall === 'log') for (let z = 3; z < WALL - 1; z += 3.2) for (const sx of [-1, 1]) t3box(M, sx * HW - (sx < 0 ? 3 : 1), -2.4, z, sx * HW + (sx < 0 ? 1 : 3), 1, z + 2.8, wallC, { zb: .3 });
    else for (const sx of [-1, 1]) t3box(M, sx * HW - 1, -.8, 3, sx * HW + 1, .4, WALL, trim, { zb: .3 });
    // the roof: two slopes, a ridge, the gables
    t3face(M, [[-HW - OVR, -OVR, eave], [HW + OVR, -OVR, eave], [HW + OVR, D / 2, RIDGE], [-HW - OVR, D / 2, RIDGE]], roofCol, [0, D / 2, 0], { tex: roofP });
    t3face(M, [[-HW - OVR, D + OVR, eave], [HW + OVR, D + OVR, eave], [HW + OVR, D / 2, RIDGE], [-HW - OVR, D / 2, RIDGE]], roofCol, [0, D / 2, 0], { tex: roofP });
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
    const win = (cx, wi) => { const fx0 = cx - winW / 2 - 1.4, fx1 = cx + winW / 2 + 1.4;
      t3face(M, [[fx0, -.3, winZ0 - 1.6], [fx1, -.3, winZ0 - 1.6], [fx1, -.3, winZ0 + winH + 1.6], [fx0, -.3, winZ0 + winH + 1.6]], trim, null, { both: true, zb: .2 });
      t3face(M, [[cx - winW / 2, -.5, winZ0], [cx + winW / 2, -.5, winZ0], [cx + winW / 2, -.5, winZ0 + winH], [cx - winW / 2, -.5, winZ0 + winH]], FV.glass, null, { both: true, inside: true, zb: .4, tex: (x, n, z) => (Math.abs(x - cx) < .5 || Math.abs(z - winZ0 - winH * .62) < .5) ? trim : null });
      if (shut) for (const sd of [-1, 1]) { const st = shutBad[wi * 2 + (sd < 0 ? 0 : 1)] || 0; if (st === 2) continue; // (0: in its place, 1: hanging by one hinge, 2: gone)
        const x0 = cx + sd * (winW / 2 + 1.6), x1 = cx + sd * (winW / 2 + 5.4), xa = Math.min(x0, x1), xb = Math.max(x0, x1), z0 = winZ0 - .6, z1 = winZ0 + winH + .6;
        const stx = (x, n, z) => Math.abs(z - winZ0 - winH / 2) < .4 ? cmul(shut, .72) : (vn(x * .5, z * .3, seed + 44) > .8 - decay * .1 ? cmix(shut, [150, 140, 120], .6) : shut);
        if (st === 1) { const hx = sd < 0 ? xb : xa, fx = sd < 0 ? xa : xb; t3face(M, [[hx, -.8, z0], [hx, -.8, z1], [fx - sd * -.6, -2.6, z1 - 4.4], [fx - sd * -.6, -2.6, z0 - 4.4]], shut, null, { both: true, zb: .6, tex: stx }) }
        else t3face(M, [[xa, -.8, z0], [xb, -.8, z0], [xb, -.8, z1], [xa, -.8, z1]], shut, null, { both: true, zb: .6, tex: stx }) } };
    wins.forEach(win);
    if (shut && fallen) { const fx = (fallen < 0 ? wins[0] - 14 : wins[wins.length - 1] + 14); t3box(M, fx, -17, 0, fx + 3.8, -5.5, 1.1, shut, { tex: (x, n, z) => (Math.round(n * 1.1) % 3) === 0 ? cmul(shut, .72) : shut }); t3box(M, fx + 4.4, -12, 0, fx + 7, -6, 1, cmul(shut, .86)) } // (a shutter that fell off lies where it fell)
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
      if (k === 'dish') { const dx = HW - 15, dn = D * .62, dz = RIDGE + 3, pts = []; for (let q = 0; q < 12; q++) { const a = q / 12 * TAU; pts.push([dx + Math.cos(a) * 3.6, dn - 1.4 + Math.sin(a) * 1.5, dz + 2.2 + Math.sin(a) * 3.1]) }
        t3face(M, pts, [196, 198, 194], [dx, dn + 3, dz], { both: true, zb: .5, tex: (x, n, z) => Math.hypot(x - dx, z - dz - 2.2) < 1 ? [90, 92, 96] : null }); t3line(M, [dx, dn + 1, RIDGE], [dx, dn - 1, dz + 2], [90, 92, 96]); t3line(M, [dx, dn - 1.4, dz + 2.2], [dx + 1, dn - 4.6, dz + 4.4], [70, 70, 74]) }
      if (k === 'laundry') { const lx0 = -HW - 6, lx1 = -HW - 36, ln = D * .3, lz = 21, rnd2 = mulberry(seed + 91); t3post(M, lx0, ln, 1, lz + 1, FV.wood); t3post(M, lx1, ln, 1, lz + 1, FV.wood);
        let prev = [lx0, ln, lz]; for (let i = 1; i <= 10; i++) { const u = i / 10, p2 = [lx0 + (lx1 - lx0) * u, ln, lz - 2.2 * Math.sin(u * Math.PI)]; t3line(M, prev, p2, [186, 180, 164]); prev = p2 }
        for (const [u, c, wdt, hh] of [[.2, [226, 226, 214], 5, 8], [.42, [196, 70, 58], 4, 6], [.64, [84, 112, 150], 5, 9], [.84, [226, 206, 130], 4, 5]]) { const x = lx0 + (lx1 - lx0) * u, z = lz - 2.2 * Math.sin(u * Math.PI); t3face(M, [[x - wdt / 2, ln - .3, z], [x + wdt / 2, ln - .3, z], [x + wdt / 2 + rnd2() * .6, ln - .3, z - hh], [x - wdt / 2, ln - .3, z - hh + rnd2() * .8]], c, null, { both: true, fabric: true, zb: .4, clean: true }) } }
      if (k === 'planter') for (const cx of wins.slice(0, 1)) { t3box(M, cx - 5.4, -3.2, 5.2, cx + 5.4, -.4, 8.2, [96, 70, 48]); for (let q = 0; q < 9; q++) M.dots.push([[cx - 4.6 + q * 1.15, -2, 8.6 + h2(q, 3, seed) * 2.4], q % 3 === 0 ? [164, 52, 46] : q % 3 === 1 ? [118, 98, 52] : [86, 110, 56]]) }
      if (k === 'bucket') { t3cyl(M, door - pw - 6, -5, 2.2, 0, 5, [124, 128, 130], { topCol: [40, 44, 48] }); t3box(M, door - pw - 12, -7, 0, door - pw - 8, -3, 4.4, FV.wood) }
      if (k === 'ladder') { const lx = HW + 2.4; for (const n of [10, 14.4]) t3line(M, [lx, n, 0], [lx - 1.2, n - 1.2, 25], FV.woodL); for (let z = 3; z < 24; z += 3.4) t3line(M, [lx - z * .05, 10, z], [lx - z * .05 - .3, 14.4 - z * .05, z], FV.woodD) }
      if (k === 'tarp' && tarp) { const [tx0, tx1, tn0, tn1] = tarp, rz = n => eave + (n + OVR) * (RIDGE - eave) / (D / 2 + OVR) + .45, tc = [64, 112, 150];
        t3face(M, [[tx0, tn0, rz(tn0)], [tx1, tn0, rz(tn0)], [tx1, tn1, rz(tn1)], [tx0, tn1, rz(tn1)]], tc, [0, D / 2, 0], { clean: true, tex: (x, n, z) => { const f = vn(x * .35, n * .5, seed + 70); const c = cmul(tc, .86 + .3 * f); return (Math.abs(x - (tx0 + tx1) / 2) < .35 || Math.abs(n - (tn0 + tn1) / 2) < .35) ? cmul(c, .8) : c } });
        for (const [x, n] of [[tx0 + 3, tn0 + 2], [tx1 - 3, tn0 + 2.4], [(tx0 + tx1) / 2, tn1 - 2], [tx0 + 2, tn1 - 3.5], [tx1 - 2, tn1 - 3]]) t3box(M, x - 1.2, n - 1, rz(n), x + 1.2, n + 1, rz(n) + 1.8, [112, 108, 100], { clean: true }) }
      if (k === 'kennel') { const kx = door + pw + 10; t3box(M, kx, -12, 0, kx + 10, -4, 6, [118, 82, 54], { tex: (x, n, z) => z > 5 ? [88, 62, 42] : ((Math.round(x * 1.2) % 3) === 0 ? [96, 66, 44] : [118, 82, 54]) }); t3face(M, [[kx - 1, -13, 6], [kx + 11, -13, 6], [kx + 11, -8, 9], [kx - 1, -8, 9]], [84, 78, 74], [kx + 5, -8, 0], { both: true }); t3face(M, [[kx + 3, -12.2, 0], [kx + 7, -12.2, 0], [kx + 7, -12.2, 4.4], [kx + 3, -12.2, 4.4]], [26, 22, 20], null, { both: true, inside: true, zb: .3 }) }
      if (k === 'lamp') { const lx = lampX ?? door + 8; t3line(M, [lx, -1.2, 22], [lx, -4, 22], [64, 64, 68]); const lc = lampC.split(',').map(Number); t3box(M, lx - 1, -5.2, 19.6, lx + 1, -3.4, 21.8, lc.map(v => Math.min(255, v + 18)), { clean: true }) }
    }
    // the electricity: a meter box on the front wall (glass, a turning disc, seals), a little switch box beside it, the cable up to the insulator under the eave
    if (meter !== null) { const mx = meter, GL = [40, 50, 56];
      t3box(M, mx - 2.8, -2.1, 12.2, mx + 2.8, -.3, 19.2, [160, 162, 158], { tex: (x, n, z) => (n < -1.9 && Math.abs(x - mx) < 2 && z > 14 && z < 18) ? (Math.abs(x - mx - .6) < .5 && Math.abs(z - 16) < .4 ? [214, 64, 52] : GL) : [160, 162, 158] });
      t3box(M, mx + 3.6, -1.7, 14, mx + 5.8, -.3, 17.2, [118, 120, 120]); t3box(M, mx - .6, -2.5, 19.2, mx + .6, -2.1, 19.8, [64, 64, 68], { clean: true });
      t3line(M, [mx, -1, 19.2], [mx, -1, WALL - 1.6], [30, 30, 32]); t3line(M, [mx + 4.7, -1, 17.2], [mx + 4.7, -1, 20.5], [30, 30, 32]); t3line(M, [mx + 4.7, -1, 20.5], [mx + 9, -1, 21.5], [30, 30, 32]);
      t3box(M, mx - .8, -1.5, WALL - 2.8, mx + .8, -.2, WALL - 1.2, [236, 232, 220], { clean: true }) }
    return M };
  const sp = t3sprite(build, [0]), ax = sp[0].ax, ay = sp[0].ay;
  const P = (x, n, z) => t3p([x, n, z]);
  const L = [], WINS = []; wins.forEach((cx, i) => { const q = P(cx, 0, winZ0 + winH / 2); L.push({ x: q[0], y: q[1], r: 12, c: '255,206,128', a: .6, k: 'window', win: i }); L.push({ x: q[0], y: 2, r: 26, sy: .5, c: '255,196,120', a: .32, k: 'window', win: i });
    const a = P(cx - winW / 2, -.5, winZ0 + winH), b = P(cx + winW / 2, -.5, winZ0); WINS.push({ x0: Math.round(a[0]), y0: Math.round(a[1]), x1: Math.round(b[0]), y1: Math.round(b[1]), cx: Math.round(P(cx, -.5, 0)[0]), cz: Math.round(P(cx, -.5, winZ0 + winH * .62)[1]) }) });
  if (deco.includes('lamp')) { const q = P(lampX ?? door + 8, -4.4, 20.6); L.push({ x: q[0], y: q[1], r: 8, c: lampC, a: .9, k: 'lamp', glare: true, flick: lampFlick }); L.push({ x: q[0] - 8, y: 14, r: 44, sy: .6, c: lampC, a: .6, k: 'lamp', fall: 'sq', flick: lampFlick }) }
  const ch = P(chimX, D * .55, RIDGE + (chim === 'brick' ? 11 : 14)), e0 = P(-HW - 3, -OVR, eave), e1 = P(HW + 3, -OVR, eave);
  const solids = [[-HW - 2, -D - 1, HW + 2, 0]]; if (porch && !gate) solids.push([door - pw, 0, door + pw, PD + 3]);
  // the things set about it are in the way too (plan y = -n: in front of the wall is +y)
  if (deco.includes('barrel')) solids.push([-HW + .9, .9, -HW + 8.1, 8.1]);
  if (deco.includes('logs')) solids.push([-HW - 10.5, -11.5, -HW - 1, -.5]);
  if (deco.includes('bench')) solids.push([HW - 20, 1.6, HW - 4, 5]);
  if (deco.includes('bucket')) solids.push([door - pw - 12.2, 2.8, door - pw - 3.8, 7.2]);
  if (deco.includes('kennel')) solids.push([door + pw + 9, 4, door + pw + 21, 12.5]);
  return { s: sp[0].s, ax, ay, night: null, lights: L, wins: WINS, drip: [[e0[0], e0[1], e1[0], e1[1], eave]], smoke: [[ch[0], ch[1]]], attach: P(meter ?? HW - 2, 0, WALL - 1.4), solids: solids.map(t3w) } };

// ---- a boat, seen from the south: a lofted hull (bow pointed, stern blunt), the outside painted, the inside bare wood, thwarts, oars.
// kind: 'row' or 'motor' (an outboard on the stern); up: turned over on the beach; water: afloat (the ripples round it and its rocking are the water's: water.js) ----
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
PF.well = ({ seed = 6 } = {}) => { const sp = t3sprite(() => { const M = T3(), W = 6.4, D = 12.4, r = 1.1; M.seed = seed;
    const LG = [[142, 108, 72], [158, 122, 82]], LGE = [196, 164, 118], IRON = [70, 70, 76], ROPE = [186, 160, 116], mixc = (a, b, k) => cmix(a, b, clamp(k, 0, 1));
    // a log lying along n (the sides of the curb): t3roll goes along x only
    const rolln = (x, n0, n1, rad, col, o = {}) => { const seg = 8, zc = (o.z0 || 0) + rad, ctr = [x, (n0 + n1) / 2, zc];
      for (let i = 0; i < seg; i++) { const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, p = (n, a) => [x + Math.cos(a) * rad, n, zc + Math.sin(a) * rad]; t3face(M, [p(n0, a0), p(n1, a0), p(n1, a1), p(n0, a1)], col, ctr, o) }
      for (const n of [n0, n1]) { const pts = []; for (let i = 0; i < seg; i++) { const a = i / seg * Math.PI * 2; pts.push([x + Math.cos(a) * rad, n, zc + Math.sin(a) * rad]) } t3face(M, pts, o.endCol || cmul(col, 1.15), ctr, o) } };
    // the curb: four courses of notched logs; the logs of one course run along x and stick out at the corners, the next run along n and stick out the other way.
    // The far wall of the shaft (what shows over the near rim) goes dark, deeper the lower it is
    for (let c = 0; c < 4; c++) { const z0 = c * 2.2, col = LG[c % 2], far = (X, N, Z) => mixc([30, 26, 24], cmul(col, .75), (Z - 1.5) / 7);
      if (c % 2 === 0) { t3roll(M, -W - 1.4, W + 1.4, r, r, col, { z0, endCol: LGE }); t3roll(M, -W - 1.4, W + 1.4, D - r, r, col, { z0, endCol: LGE, tex: far });
        for (const x of [-(W - r), W - r]) rolln(x, r * 2, D - r * 2, r, col, { z0, endCol: LGE }) }
      else { for (const x of [-(W - r), W - r]) rolln(x, -1.4, D + 1.4, r, col, { z0, endCol: LGE });
        t3roll(M, -W + r * 2, W - r * 2, r, r, col, { z0, endCol: LGE }); t3roll(M, -W + r * 2, W - r * 2, D - r, r, col, { z0, endCol: LGE, tex: far }) } }
    t3box(M, -W + 2, 2.2, 0, W - 2, D - 2.2, 4, [10, 10, 12]); // (the dark of the shaft, where the logs leave a gap)
    // the sweep: a tall post behind the curb, a long pole on a fork at its top, a heavy stone on the short end, a thin rod and the bucket on the long end
    const px = 10.2, pn = 6.6, zp = 25, tip = [-2.2, pn, zp + 4.6], butt = [px + 6.4, pn, zp - 2.4];
    t3limb(M, [px, pn, 0], [px, pn, zp + .8], 1.5, 1.2, [132, 102, 70], { capCol: [196, 164, 118] });
    t3box(M, px - 1.8, pn - .9, zp - 1.4, px + 1.8, pn + .9, zp - .6, [96, 72, 48]); // the cross-pin of the fork
    t3limb(M, tip, butt, .7, 1.15, [150, 116, 78], { capCol: LGE });
    t3line(M, [butt[0] - .6, pn, butt[2] - .8], [butt[0] - .6, pn, butt[2] - 4.4], ROPE); t3box(M, butt[0] - 2.4, pn - 1.5, butt[2] - 8, butt[0] + 1.2, pn + 1.5, butt[2] - 4.4, [128, 124, 116]);
    // the rod down to the bucket's bail, the bucket (dark wet staves, two iron hoops, an iron handle) hanging just over the rim
    const bz = 10.6, bt = 14.2; t3line(M, [tip[0], pn, tip[2] - .6], [tip[0], pn, bt + 1.7], [124, 96, 66]);
    t3line(M, [tip[0] - 1.9, pn, bt], [tip[0], pn, bt + 1.7], IRON); t3line(M, [tip[0] + 1.9, pn, bt], [tip[0], pn, bt + 1.7], IRON);
    t3cyl(M, tip[0], pn, 2.2, bz, bt, [120, 94, 64], { topCol: [18, 14, 12], tex: (X, N, Z) => Z > bt - .1 ? [18, 14, 12] : (Z > bz + .8 && Z < bz + 1.5 || Z > bt - 1.5 && Z < bt - .7) ? [92, 94, 102] : (Math.round(X * 2.4) % 3 === 0 ? [96, 72, 50] : [128, 100, 68]) });
    // a zinc pail on the ground by the curb: wider at the mouth, a bail over it
    t3limb(M, [-W - 3.8, 2.2, 0], [-W - 3.8, 2.2, 4.4], 1.7, 2.2, [164, 170, 174], { capCol: [40, 44, 50] }); t3line(M, [-W - 5.8, 2.2, 4.3], [-W - 3.8, 2.2, 6.3], [92, 94, 100]); t3line(M, [-W - 1.8, 2.2, 4.3], [-W - 3.8, 2.2, 6.3], [92, 94, 100]);
    return M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-8.8, -14, 8.8, 1.6], [-12.4, -4.4, -8.2, .4], [8.4, -8.4, 12, -4.8], [14.2, -8.4, 17.8, -4.8]].map(t3w) } };

// ---- old cars for the village: a «копейка» (VAZ-2101, the Russian Fiat 124) with fishing rods on the roof, and a VW «жук» ----
// Parked nose to the east like the car park's cars; x along the car, n from its near side (0) to the far side (W), z up.
const CARC = { glass: [54, 68, 80], glassL: [124, 144, 156], dark: [36, 36, 38], chrome: [200, 202, 198], rust: [150, 86, 52] };
// the weather on an old body: rust blooming from the sills, wheel arches and roof edges, primer and bare metal where the paint has gone, streaks of dirt
// from the glass, green damp at the foot. Only the paint is worn (what the model gives back as the body's own colour).
function carWear(c, x, n, z, sd, o = {}) { const lowZ = z < (o.low ?? 6), edge = z > (o.top ?? 99); let k = vn(x * .27 + n * .21, z * .42 + n * .15, sd + 30), thr = .7 - (lowZ ? .12 : 0) - (edge ? .08 : 0) - (o.age || 0) * .05;
  if (k > thr + .1) return cmix(c, [118, 64, 40], .8); if (k > thr) return cmix(c, [158, 92, 56], .68);
  if (vn(x * .5 + n * .3, z * .7, sd + 31) > .9 - (o.age || 0) * .02) return cmix(c, [124, 116, 108], .7); // primer
  if (vn(x * .55, z * .05 + n * .4, sd + 32) > .66) c = cmul(c, .86); if (lowZ && z < 3.8 && vn(x * .35, z * .6, sd + 33) > .5) return cmix(c, [76, 92, 52], .45); return c }
function oldCarWheels(M, hl, WHx, kind) { const rim = kind === 'beetle' ? [206, 206, 200] : [186, 190, 186];
  for (const [wx, wz] of WHx) { const tyre = [], hub = [], cap = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; tyre.push([wx + Math.cos(a) * 3.2, -.5, wz + Math.sin(a) * 3.2]); hub.push([wx + Math.cos(a) * 1.9, -.7, wz + Math.sin(a) * 1.9]); cap.push([wx + Math.cos(a) * .8, -.8, wz + Math.sin(a) * .8]) }
    t3face(M, tyre, [30, 30, 32], null, { both: true, zb: .6, clean: true }); t3face(M, hub, rim, null, { both: true, zb: .8, clean: true }); t3face(M, cap, [150, 154, 150], null, { both: true, zb: .9, clean: true }) } }
// the «копейка»: a three-box saloon: a long low bonnet, a short cabin with sloping screens, a boot; round headlamps, a chrome grille and bumpers
function copeikaModel(M, o) { const { body, rods = true } = o, L = 41, W = 15, H = 14.2, BH = 8.4, hl = L / 2, G = 2.6, ch = 2, c0 = -9.5, c1 = 6.5, bodyD = cmul(body, .78), ctr = [0, W / 2, BH / 2];
  const plan = [[-hl + ch, 0], [hl - ch, 0], [hl, ch], [hl, W - ch], [hl - ch, W], [-hl + ch, W], [-hl, W - ch], [-hl, ch]], WHx = [[-hl + 7.2, 3.2], [hl - 7, 3.2]];
  const side = (x, n, z) => {
    if (n < .5) { for (const [wx, wz] of WHx) { const r = Math.hypot(x - wx, z - wz); if (r < 4.2 && z < 5.4) return CARC.dark; if (r < 5 && z < 6.2) return bodyD }
      if (z < 5 + 1.4 * vn(x * .3, 2, 5)) return cmix(body, [96, 74, 54], .5);
      if (vn(x * .35, z * .6, 17) > .8 && z < 6.6) return CARC.rust; if (z > BH - 1.2 && z < BH - .5) return bodyD; // the sill's rust, the swage line
      for (const dx of [c0 + 4.2, c0 + 10.4]) if (Math.abs(x - dx) < .28 && z > 3.4) return bodyD; // door seams
      for (const dx of [c0 + 9.4, c0 + 15.6]) if (Math.abs(x - dx) < .9 && Math.abs(z - (BH - 2)) < .35) return CARC.chrome } // handles
    if (x > hl - .5) { if (Math.hypot(n - 3.1, z - (BH - 3.2)) < 1.5 || Math.hypot(n - (W - 3.1), z - (BH - 3.2)) < 1.5) return [246, 242, 216]; if (Math.hypot(n - 3.1, z - (BH - 3.2)) < 1.9 || Math.hypot(n - (W - 3.1), z - (BH - 3.2)) < 1.9) return CARC.chrome;
      if (n > 5.4 && n < W - 5.4 && z > BH - 4.6 && z < BH - 1.8) return Math.round(z * 2) % 2 ? CARC.dark : CARC.chrome; if (z > BH - 6.2 && z < BH - 5.2) return CARC.chrome }
    if (x < -hl + .5) { if ((n < 4.2 || n > W - 4.2) && z > BH - 3.6 && z < BH - 1.8) return [196, 44, 36]; if (Math.abs(n - W / 2) < 2.4 && z > BH - 4.2 && z < BH - 2.8) return [236, 236, 228] }
    return null };
  for (let i = 0; i < plan.length; i++) { const [x0, n0] = plan[i], [x1, n1] = plan[(i + 1) % plan.length]; t3face(M, [[x0, n0, G], [x1, n1, G], [x1, n1, BH], [x0, n0, BH]], body, ctr, { tex: (x, n, z) => side(x, n, z) || carWear(body, x, n, z, 40, { low: 6.2, top: BH - 2.4, age: 1 }) }) }
  t3face(M, plan.map(([x, n]) => [x, n, BH]), body, ctr, { clean: true, tex: (x, n, z) => { if ((x > c1 + 1 && Math.abs(n - W / 2) < .4) || (x < c0 - 1 && Math.abs(n - W / 2) < .3)) return bodyD; return carWear(body, x * 1.4, n, 1 + (n < 3 || n > W - 3 ? 7 : 0) + (x > hl - 4 || x < -hl + 4 ? 0 : 4), 41, { low: 6, age: 1 }) } }); // (the bonnet and the boot lid)
  // the cabin: a short trapezoid, the screens sloping, the side glass split by a pillar
  const t0 = c0 + 4, t1 = c1 - 5, i0 = 1.2, i1 = W - 1.2, gctr = [(c0 + c1) / 2, W / 2, BH + 2];
  const glassT = (x, n, z) => (Math.abs(x - (c0 + c1) / 2 + 1.6) < .5 || z > H - .5) ? body : ((x - z * .5) % 6 < .9 ? CARC.glassL : CARC.glass);
  t3face(M, [[c0, i0, BH], [c1, i0, BH], [t1, i0 + .8, H], [t0, i0 + .8, H]], CARC.glass, gctr, { tex: glassT }); t3face(M, [[c0, i1, BH], [c1, i1, BH], [t1, i1 - .8, H], [t0, i1 - .8, H]], CARC.glass, gctr);
  t3face(M, [[c1, i0, BH], [c1, i1, BH], [t1, i1 - .8, H], [t1, i0 + .8, H]], CARC.glass, gctr, { tex: (x, n, z) => (n - z * .5) % 7 < .9 ? CARC.glassL : CARC.glass });
  t3face(M, [[c0, i0, BH], [c0, i1, BH], [t0, i1 - .8, H], [t0, i0 + .8, H]], CARC.glass, gctr);
  t3face(M, [[t0, i0 + .8, H], [t1, i0 + .8, H], [t1, i1 - .8, H], [t0, i1 - .8, H]], body, gctr, { clean: true, tex: (x, n) => carWear(body, x * 1.2, n, 3, 42, { low: 6, age: 1 }) });
  oldCarWheels(M, hl, WHx, 'copeika');
  for (const sx of [-1, 1]) { t3box(M, sx * (hl + .4) - .9, -.4, 3, sx * (hl + .4) + .9, W + .4, 4.4, CARC.chrome); t3box(M, sx * (hl + .4) - .5, 2.4, 2.4, sx * (hl + .4) + .5, 3.6, 4.4, [150, 152, 148]); t3box(M, sx * (hl + .4) - .5, W - 3.6, 2.4, sx * (hl + .4) + .5, W - 2.4, 4.4, [150, 152, 148]) }
  t3line(M, [c1 + .6, -.2, BH + 1.4], [c1 + 1.3, -1.8, BH + 2], [30, 30, 32]); t3box(M, c1 + .9, -2.6, BH + 1.4, c1 + 2.3, -1.6, BH + 2.6, [60, 60, 64]); // the driver's mirror
  t3line(M, [c0 + 4, W - 1.4, H], [c0 + 3.4, W - 1.4, H + 4], [60, 60, 64]); // the aerial
  if (rods) { for (const x of [c0 + 3, c1 - 6]) t3line(M, [x, 1.8, H + .4], [x, W - 1.8, H + .4], [40, 40, 42]); // a rack of two bars, three fishing rods lashed on it pointing back, a tackle box
    for (const [n, dz, c] of [[4.4, .9, [118, 96, 60]], [7.5, 1.3, [70, 58, 40]], [10.4, .9, [150, 120, 70]]]) t3line(M, [-hl - 6, n, H + .6 + dz], [c1 - 2, n - .4, H + .6 + dz + .2], c);
    t3box(M, c0 + 6, 9.4, H + .4, c0 + 11.5, 12.6, H + 2.2, [64, 88, 66], { clean: true }) }
}
// the «жук»: a low round tub with a bulge at each wheel, an egg-shaped cabin on it, the headlamps on the front fenders, chrome bumpers, the engine lid
function beetleModel(M, o) { const { body } = o, L = 40, W = 15, hl = L / 2, nc = W / 2, G = 2.8, bodyD = cmul(body, .8), N = 22, K = 8, GL = [44, 62, 78], GLL = [118, 142, 158];
  const interp = (T, u) => { for (let i = 0; i < T.length - 1; i++) if (u <= T[i + 1][0]) { const f = (u - T[i][0]) / (T[i + 1][0] - T[i][0]), s = f * f * (3 - 2 * f); return T[i][1] + (T[i + 1][1] - T[i][1]) * s } return T[T.length - 1][1] };
  const tubT = [[-1, 6.6], [-.8, 8.2], [-.5, 8.6], [0, 8.6], [.5, 8.8], [.8, 8.6], [1, 7.2]], wT = [[-1, 10.4], [-.85, 13], [-.6, 14.4], [-.2, 14], [.3, 14], [.6, 14.4], [.85, 13.2], [1, 10.6]];
  const tub = x => interp(tubT, x / hl), wid = x => interp(wT, x / hl) + 1.4 * Math.exp(-(((x - 12.4) / 4) ** 2)) + 1.3 * Math.exp(-(((x + 12.6) / 4.2) ** 2));
  // the tub: from the ground up the sides, over a low arch (the bonnet and the engine lid)
  const rings = []; for (let i = 0; i <= N; i++) { const x = -hl + L * i / N, w = wid(x), t = tub(x), zs = t - 1.7, R = [[x, nc - w / 2 * .93, G], [x, nc - w / 2, zs - .8]];
    for (let k = 0; k <= K; k++) { const th = Math.PI - k * Math.PI / K; R.push([x, nc + w / 2 * Math.cos(th) * (1 - .1 * Math.sin(th)), zs + 1.7 * Math.pow(Math.sin(th), .7)]) } R.push([x, nc + w / 2, zs - .8], [x, nc + w / 2 * .93, G]); rings.push(R) }
  const tubTex = (x, n, z) => { const dn = Math.abs(n - nc);
    if (x > hl - 7.4 && x < hl - 2.4 && Math.abs(dn - 5) < 1.7 && z > 6) { const d = Math.hypot(x - (hl - 4.8), dn - 5); return d < 1.2 ? [250, 246, 220] : d < 1.65 ? CARC.chrome : null } // the headlamps, set on the fenders
    if (x < -hl + 8 && x > -hl + 2.2 && dn < 4.6 && z > 7 && Math.round(x * 1.2) % 2 === 0) return bodyD; // the engine lid's louvres
    if (n < nc) { for (const wx of [-12.6, 12.2]) { const r = Math.hypot(x - wx, z - 3.2); if (r < 4.2 && z < 5.6) return CARC.dark }
      if (z < G + 1.8 + 1.4 * vn(x * .3, 2, 5)) return cmix(body, [92, 76, 56], .5); if (vn(x * .4, z * .5, 19) > .8 && z < 6.4) return CARC.rust }
    return null };
  for (let i = 0; i < N; i++) for (let j = 0; j < rings[i].length - 1; j++) t3face(M, [rings[i][j], rings[i][j + 1], rings[i + 1][j + 1], rings[i + 1][j]], body, [rings[i][0][0], nc, G + 2], { clean: true, tex: (x, n, z) => tubTex(x, n, z) || carWear(body, x, n, z, 50, { low: 6, top: 7.8, age: .6 }) });
  for (const i of [0, N]) t3face(M, rings[i], body, [rings[i][0][0] + (i ? -4 : 4), nc, G + 3], { clean: true, tex: (x, n, z) => tubTex(x, n, z) || carWear(body, x, n, z, 50, { low: 6, top: 7.8, age: .6 }) });
  // the cabin: an egg, narrower than the tub: a band of glass under a body-coloured roof, a pillar behind the doors, the windscreen split, a small rear window
  const xm = -1.6, hx = 11.2, roofT = [[-1, 8.8], [-.55, 12.6], [-.15, 15], [.2, 15], [.6, 13.2], [1, 9.2]], cw = x => 6.1 * Math.pow(Math.max(0, 1 - ((x - xm) / hx) ** 2), .36), roof = x => interp(roofT, (x - xm) / hx);
  const cab = []; for (let i = 0; i <= 16; i++) { const x = xm - hx + 2 * hx * i / 16, w = cw(x), t = roof(x), z0 = tub(x) - .6, R = []; for (let k = 0; k <= 8; k++) { const th = Math.PI - k * Math.PI / 8; R.push([x, nc + w * Math.cos(th), z0 + Math.max(.3, t - z0) * Math.pow(Math.sin(th), .8)]) } cab.push(R) }
  const cabTex = (x, n, z) => { const dn = Math.abs(n - nc), t = roof(x);
    if (x > 3.6) return dn < .4 ? bodyD : (((x - z * .4 + dn) % 5 < .9) ? GLL : GL); // the windscreen: it climbs over the front of the roof
    if (x < -8.6) return dn < cw(x) * .8 ? GL : null; // the rear window
    if (z > t - 1.3 && dn < cw(x) * .62) return null; // the roof
    if (Math.abs(x + 2.9) < .6) return null; return ((x - z * .5) % 6 < .9) ? GLL : GL };
  for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) t3face(M, [cab[i][j], cab[i][j + 1], cab[i + 1][j + 1], cab[i + 1][j]], body, [xm, nc, G + 5], { clean: true, tex: (x, n, z) => cabTex(x, n, z) || carWear(body, x, n, z * .7, 51, { low: 3, age: .6 }) });
  oldCarWheels(M, hl, [[-12.6, 3.2], [12.2, 3.2]], 'beetle');
  t3box(M, -12.6 - 5, -.2, G - .4, 12.2 + 5, 1.6, G + .8, CARC.dark); // the running board
  for (const sx of [-1, 1]) { const x = sx * (hl + .9); t3box(M, x - .8, nc - 5.8, 3, x + .8, nc + 5.8, 4.3, CARC.chrome); t3box(M, x - .5, nc - 4.2, 2.4, x + .5, nc - 3.2, 4.3, [150, 152, 148]); t3box(M, x - .5, nc + 3.2, 2.4, x + .5, nc + 4.2, 4.3, [150, 152, 148]) }
}
PF.oldcar = ({ kind = 'copeika', color = null, flip = false, rods = true } = {}) => { const sp = t3sprite(() => { const M = T3();
    if (kind === 'beetle') beetleModel(M, { body: color || [118, 158, 190] }); else copeikaModel(M, { body: color || [210, 190, 130], rods });
    return flip ? t3flipX(M) : M }, [0]);
  return { s: sp[0].s, ax: sp[0].ax, ay: sp[0].ay, solids: [[-21.5, -16.5, 21.5, 1]].map(t3w) } };
