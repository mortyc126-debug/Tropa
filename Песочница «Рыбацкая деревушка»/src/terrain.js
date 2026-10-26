// =====================================================================================================================
// THE LIE OF THE LAND. The ground is not a plain: broad swells 40–80 m across and 1–2 m high with hollows between them, on them mounds and dips
// of a few metres, down to the humps of an old wheel track. It shows as the light on the slopes (the lit side warm, the shaded one cool, the water
// level and the beach by it flat) and it works on the bike: a climb slows it, a descent lets it run, on the side of a slope it is carried a
// little downhill. Roads, yards, the dam and the jetty are levelled (they keep only the broad swell: a road climbs a hill, it does not hop over
// each mound); layers may carry a `relief` of their own (the ruts and the hump between them, a heap).
// =====================================================================================================================
const TERR_FLAT = new Set(['road', 'path', 'dirt', 'gravel', 'track', 'trodden', 'bridge', 'dam']);
const tLarge = (x, y) => 8.5 * (vn(x * .0023, y * .0029, SEED + 900) * 2 - 1);
const tMid = (x, y) => 4.4 * (vn(x * .0085, y * .0105, SEED + 901) * 2 - 1);
const tSmall = (x, y) => 2.4 * (vn(x * .024, y * .022, SEED + 902) * 2 - 1) + .8 * (vn(x * .07, y * .065, SEED + 903) * 2 - 1);
function terrRelief(L, x, y) { const R = L.relief, dd = layerD(L, x, y); if (dd >= 0) return 0; const half = L.w || (L.ellipse ? Math.min(L.ellipse[2], L.ellipse[3]) : 6), t = clamp(-dd / half, 0, 1);
  return R.h * ssm(0, 1, t) * (R.lump ? .55 + .9 * vn(x * .13, y * .13, SEED + 905) : 1) }
// the height at a point (px; 10 px a metre), 0 at the water; `full` false: the swells only, without the mounds and the relief of the tracks (what the bike feels)
function terrH(x, y, full = true) { let flat = 0, d = 1e9, rel = 0;
  for (const L of layersNear(x, y)) { const m = L.mat; if (m === 'lake') { const dd = layerD(L, x, y); if (dd < d) d = dd } else { if (TERR_FLAT.has(m)) flat = Math.max(flat, 1 - ssm(-3, 12, layerD(L, x, y))); if (full && L.relief) rel += terrRelief(L, x, y) } }
  if (d < 0) return 0; return (tLarge(x, y) + (tMid(x, y) + (full ? tSmall(x, y) : 0)) * (1 - flat)) * ssm(6, 150, d) + rel }
// a chunk's heights on a grid (every 4 px; every 2 where a layer has a relief of its own), and from them the slope at each node
const TGRIDS = new Map(); let TG = null;
function terrGrid(ci, cj) { const key = ci + ',' + cj; let G = TGRIDS.get(key); if (G) return G;
  const x0 = ci * CK, y0 = cj * CK, rel = LAYERS.some(L => L.relief && !(L.bb[2] < x0 || L.bb[0] > x0 + CK || L.bb[3] < y0 || L.bb[1] > y0 + CK)), st = rel ? 2 : 4, N = CK / st + 3, H = new Float32Array(N * N), GX = new Float32Array(N * N), GY = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j * N + i] = terrH(x0 + (i - 1) * st, y0 + (j - 1) * st);
  for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { GX[j * N + i] = (H[j * N + i + 1] - H[j * N + i - 1]) / (2 * st); GY[j * N + i] = (H[(j + 1) * N + i] - H[(j - 1) * N + i]) / (2 * st) }
  G = { x0, y0, st, N, H, GX, GY }; TGRIDS.set(key, G); return G }
// the ground's colour lit by the lie of the land (light from the north-west, low: a slope facing it is bright, the far side dark)
function groundShade(c, x, y) { const ci = Math.floor(x / CK), cj = Math.floor(y / CK); if (!TG || TG.x0 !== ci * CK || TG.y0 !== cj * CK) TG = terrGrid(ci, cj);
  const G = TG, u = (x - G.x0) / G.st + 1, v = (y - G.y0) / G.st + 1, i = Math.min(G.N - 2, Math.floor(u)), j = Math.min(G.N - 2, Math.floor(v)), fx = u - i, fy = v - j, N = G.N, k = j * N + i;
  const gx = (G.GX[k] * (1 - fx) + G.GX[k + 1] * fx) * (1 - fy) + (G.GX[k + N] * (1 - fx) + G.GX[k + N + 1] * fx) * fy, gy = (G.GY[k] * (1 - fx) + G.GY[k + 1] * fx) * (1 - fy) + (G.GY[k + N] * (1 - fx) + G.GY[k + N + 1] * fx) * fy;
  const s = .55 * gx + .83 * gy, f = clamp(1 + 3.4 * s, .64, 1.36), w = clamp(s * .9, -.05, .05);
  return [clamp(Math.round(c[0] * f * (1 + w)), 0, 255), clamp(Math.round(c[1] * f), 0, 255), clamp(Math.round(c[2] * f * (1 - w)), 0, 255)] }
// the slope under the rider: along the way he is heading (+ uphill), across it (+ to his right), as a fraction; and what it does to his speed
const SLOPE = { f: 0, l: 0, k: 1, a: 0, dx: 0, dy: 0 };
function slopeStep(dt) { const e = 5, x = R.x, y = R.y, hx = (terrH(x + e, y, false) - terrH(x - e, y, false)) / (2 * e), hy = (terrH(x, y + e, false) - terrH(x, y - e, false)) / (2 * e), sx = Math.sin(R.psi), sy = -Math.cos(R.psi);
  const f = hx * sx + hy * sy, l = hx * -sy + hy * sx; SLOPE.f += (f - SLOPE.f) * Math.min(1, dt * 5); SLOPE.l += (l - SLOPE.l) * Math.min(1, dt * 5);
  SLOPE.k = clamp(1 - 3.2 * SLOPE.f, .45, 1.4); SLOPE.a = R.v > 2 ? -62 * SLOPE.f : 0;
  const sp = Math.min(1, Math.abs(R.v) / 24), drift = Math.abs(SLOPE.l) > .05 ? -(SLOPE.l - Math.sign(SLOPE.l) * .05) * 14 * sp : 0; SLOPE.dx = drift * -sy; SLOPE.dy = drift * sx }
function slopeText() { const p = Math.round(SLOPE.f * 100); return Math.abs(p) < 3 ? '' : p > 0 ? ' · ↗ подъём ' + p + '%' : ' · ↘ спуск ' + -p + '%' }

// ---- old wheel tracks: two ruts of dark soil and puddle, the earth thrown up along their edges, grass and weeds growing in them, and between them a hump
// of tall dry grass. L.grow: how much of the ruts is overgrown. (Their relief — grooves, a lumpy hump — is in the layers; the light on it is the land's.) ----
function rutColor(L, x, y, d) { const sd = L.sd || 0, hump = L.mat === 'hump';
  const nz = vn(x * .22, y * .26, SEED + 920 + sd % 7) * .6 + h2(x, y, SEED + 921) * .4;
  if (hump) { const dry = vn(x * .1, y * .1, SEED + 922) > .55, c = G.grass[quant(.15 + vn(x * .3, y * .3, SEED + 923) * .55, x, y, 5, .7)]; return h2(x, y, SEED + 924) < .06 ? [150, 128, 72] : dry ? cmix(c, [140, 120, 70], .45) : c } // (a dull hump of last year's grass)
  if (nz < (L.grow ?? .5) - .12 * (d < -1.3 ? 0 : -1)) return G.grass[quant(.1 + vn(x * .4, y * .4, SEED + 925) * .6, x, y, 5, .7)]; // grass in the rut
  if (vn(x * .09, y * .09, SEED + 926) > .8 && d < -.8) return [64, 70, 70]; // dark standing water
  if (d > -.9) return cmix([112, 90, 62], [136, 112, 76], h2(x, y, SEED + 927)); // the earth thrown up along the edge
  return cmix([66, 50, 36], [88, 68, 48], vn(x * .3, y * .3, SEED + 928)) }
