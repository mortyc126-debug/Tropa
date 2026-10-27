// =====================================================================================================================
// BIRDS, THE LIFE: the ordinary birds of the end of October, each where it belongs. Sparrows about the yards, crows on the shore and on the roofs and the poles,
// jackdaws on the chimneys; tits, a jay or a bullfinch in the trees at the edge of the forest, a woodpecker on a trunk; fieldfares and siskins over the glade;
// mallards in the bay; and high up now and then a skein of geese going south. (The gulls are in gulls.js.)
// A flock is the unit: it sits, feeds and moves as one. It stays where it is for minutes: the ground birds walk along as they feed, the tits and the finches flit
// about their tree, the woodpecker climbs its trunk. When the rider comes near it goes up all together, away from him and from the way he is going, to a place of
// its own kind a little way off, and comes down there in a glide. Now and then a flock moves on by itself, or one comes in from outside; new flocks are found out
// of sight, ahead, so the sky is not always full of arrivals. Small birds beat their wings fast and dip as they go (the finches, the tits and the sparrows bound),
// crows row slowly and glide. By day only: at dusk the flocks leave to roost (the crows in a stream over the sky); in rain and fog there are few.
// =====================================================================================================================
const BIRDS = [], BFL = [], BSPR = new Map(), BNODES = new WeakMap(), BTRUNK = new WeakMap(), BLDS = [], BOCC = new Set(), BSKY = [];
let BTEST = false, BFIRST = false, BSPAWNT = 3, BAIRT = 30, BSKYT = 90 + Math.random() * 120, BDUSKT = 10, BZONE = { v: .3, g: .3, s: .1, f: .3, w: .1 }, BZT = 0, BSTART = false, BID = 1, BFID = 1, BCNT = 0;
const BDBG = { rest: 0, air: 0, flush: 0, move: 0, leave: 0, cull: 0, flit: 0 }; // (what has happened, for the tests)
const BHIGH = 26; // (a bird flying higher than this is over the roofs and is drawn over everything; lower, it goes behind what stands in front of it)
const BTREE = new Set(['pine', 'spruce', 'birch', 'aspen', 'decid', 'bare', 'rowan', 'oak', 'larch', 'linden', 'maple']);
const BBUSH = new Set(['bush', 'barebush', 'juniper', 'sapling']); // (the small birds sit in the bushes too)
const BPROP = new Set(['house', 'smokehouse', 'boatshed', 'cowshed', 'haystack', 'bales', 'logpile', 'fishrack', 'netrack', 'boat', 'pole', 'signpost', 'oldcar', 'fence', 'well', 'barrels', 'crates', 'booth']);
// how each size of bird flies: wingbeats a second and how much it glides (the small ones bound instead: a burst of beats, then the wings shut and a dip)
const BFLY = { T: { beat: 11, glide: 0 }, M: { beat: 6.5, glide: .1 }, C: { beat: 3.6, glide: .3 }, D: { beat: 6, glide: 0 }, G: { beat: 2.6, glide: 0 } };
const bsprite = (id, pose, flip) => { const key = id + '/' + pose + (flip ? 'L' : 'R'); let r = BSPR.get(key); if (!r) { r = birdArt(BKIND[id], pose, flip); BSPR.set(key, r) } return r };
const bAct = () => clamp(1.25 - LT.dark * 1.7, 0, 1) * (1 - .5 * WX.rain) * (1 - .45 * WX.fog);
const bRand = (a, b) => a + Math.random() * (b - a), bPick = a => a[Math.floor(Math.random() * a.length)];
// the pictures a kind will need, made one a frame in the quiet moments (a new kind arriving with several of them at once would be a hitch)
const BWARM = [];
function bWarmInit() { for (const id in BKIND) { const K = BKIND[id], fl = K.bound ? ['fup', 'fmid', 'fdn', 'fold'] : ['fup', 'fmid', 'fdn']; const poses = K.feet === 'trunk' ? ['cling', 'hammer'].concat(fl) : K.feet === 'water' ? ['swim', 'dabble'].concat(fl) : K.feet === 'air' ? fl : K.feet === 'tree' ? ['stand', 'hop'].concat(fl) : ['stand', 'hop', 'peck'].concat(fl);
    for (const po of poses) for (const f of [false, true]) BWARM.push([id, po, f]) } BWARM.reverse() }
function bInit() { BSTART = true; bWarmInit(); for (const o of OBJS) { if (o.kind !== 'prefab') continue; if (o.p === 'house' || o.p === 'smokehouse' || o.p === 'boatshed' || o.p === 'cowshed' || o.p === 'booth') BLDS.push([o.x, o.y - 10, (o.params && o.params.w ? o.params.w / 2 : 22) + 6]) } }
// the ground a bird may stand on
const bGround = (x, y) => { const m = matAt(x, y); return m !== 'lake' && m !== 'bridge' && !blocked(x, y, 1.6) };
// open water a duck may swim on: lake, a little off the shore, clear of the boats, the piles and the rocks of the shallows
const bWater = (x, y) => { if (matAt(x, y) !== 'lake' || bayDist(x, y) > -12) return false; for (const o of objsIn(x - 8, y - 8, x + 8, y + 8)) if ((o.kind === 'prefab' || o.t === 'rock') && Math.hypot(o.x - x, o.y - y) < 8 + (o.p === 'boat' ? 6 : 0)) return false; return true };
// what is round a point: the village, the shore, the open glade, the forest by its stand, the water
function bctx(x, y) { const m = matAt(x, y), c = { v: 0, g: 0, h: 0, s: 0, w: 0, fb: 0, fs: 0, fm: 0, fh: 0 }; if (m === 'lake') { c.w = 1; return c } if (m === 'bridge') return c;
  let vd = 1e9; for (const b of BLDS) vd = Math.min(vd, Math.hypot(b[0] - x, b[1] - y) - b[2]); c.v = clamp(1 - vd / 70, 0, 1); c.s = clamp(1 - bayDist(x, y) / 45, 0, 1) * .8;
  if (m === 'forest') { const id = standAt(x, y).id; c[id === 'bor' ? 'fb' : id === 'spruce' ? 'fs' : id === 'hazel' ? 'fh' : 'fm'] = 1 } else if (m === 'glade') c.g = 1; else if (m === 'beach') c.g = .3; else c.h = 1; return c }
function bKindAt(c, per) { let tot = 0; const w = []; for (const id in BKIND) { const K = BKIND[id]; let s = 0; for (const k in K.hab) s += K.hab[k] * (c[k] || 0); if (id === 'goose' || id === 'mallardF' || id === 'crossbillF') s = 0; s /= 1 + 1.6 * ((per && per[id]) || 0) / Math.max(1, K.flock[1]); w.push([id, s]); tot += s } if (tot <= 0) return null; let r = Math.random() * tot; for (const [id, s] of w) { r -= s; if (r <= 0) return id } return null }
// where a bird can sit on a thing (found from the object's own mask), each place [x, y, room above it]. On the works of men: the points along the top edge of the
// picture where the edge is flat or a peak. In a tree or a bush: every flat stretch of an upper edge with room above it: the tops of the branches all through
// the crown, the edges of the gaps in it, the twigs at its rim, and its outline at the top; not down by the foot, where the trunk is
function bPerches(o) { let L = BNODES.get(o); if (L) return L; L = []; BNODES.set(o, L); const m = o.mask, w = o.mw, h = o.mh; if (!m || !w) return L;
  if (o.kind === 'gen' && (BTREE.has(o.t) || BBUSH.has(o.t))) { const yMax = Math.min(h - 1, Math.round(o.ay) - (BBUSH.has(o.t) ? 3 : 12));
    for (let y = 2; y < yMax; y++) for (let x = 2; x < w - 2; x++) { const i = y * w + x; if (!m[i] || m[i - w] || !(m[i - 1] || m[i + 1])) continue; // (an upper edge with a pixel of wood or leaf beside it to take the feet)
      let c = 0; while (c < 9 && y - 1 - c >= 0) { const r = (y - 1 - c) * w + x; if (m[r] || m[r - 1] || m[r + 1]) break; c++ } if (c >= 4) L.push([x, y, c]) }
    return L }
  const top = new Int16Array(w).fill(-1); for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (m[y * w + x]) { top[x] = y; break }
  for (let x = 2; x < w - 2; x++) { const t = top[x]; if (t < 0) continue; let ok = true, flat = 0; for (let d = -2; d <= 2; d++) { const q = top[x + d]; if (q >= 0 && q < t - 1) ok = false; if (q >= 0 && q <= t + 3) flat++ } if (ok && flat >= 4) L.push([x, t, 9]) }
  return L }
// how much room a bird needs over its branch
const bNeed = K => ({ T: 5, M: 6, C: 8, D: 8 }[K.cls] || 6);
const bPerchable = (o, tree, prop, bush) => o.ready && o.mask && ((tree && o.kind === 'gen' && BTREE.has(o.t)) || (bush && o.kind === 'gen' && BBUSH.has(o.t)) || (prop && o.kind === 'prefab' && BPROP.has(o.p) && !(o.p === 'pole' && o.params && o.params.bird)));
// a free sitting place on a thing: one of its perches nobody holds and the rider is not right by
function bNodeOn(o, px0, need = 5) { const L0 = bPerches(o), L = need > 4 ? L0.filter(p => p[2] >= need) : L0; if (!L.length) return null; const ox = Math.round(o.x - o.ax), oy = Math.round(o.y - o.ay), C = px0 === undefined ? L : L.slice().sort((a, b) => Math.abs(ox + a[0] - px0) - Math.abs(ox + b[0] - px0)).slice(0, 6);
  for (let n = 0; n < 5; n++) { const p = bPick(C), key = (o.id || o.x + ',' + o.y) + ':' + p[0] + '/' + p[1]; if (BOCC.has(key)) continue; const px = ox + p[0] + .5, py = oy + p[1]; if (Math.hypot(px - R.x, o.y - R.y) < 24) continue; return { x: px, y: o.y + .6, z: o.y + .6 - py, key, o, px: p[0], py: p[1] } } return null }
// a bird on a branch of a crown that sways in the wind: its feet go with the branch in the picture of the moment (the nearest upper edge within two pixels
// of the place it sat at rest), so it is not left hanging in the air beside it. (The pictures' masks are made once each, as they are needed.)
const BFM = new WeakMap();
function bFrameMask(cv) { let m = BFM.get(cv); if (m) return m; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; m = new Uint8Array(cv.width * cv.height); for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 0 ? 1 : 0; BFM.set(cv, m); return m }
function bOnBranch(B) { const nd = B.node; B.sx = 0; B.sy = 0; if (!nd || nd.px === undefined || !nd.o.fcv || nd.o.fi === undefined) return; const cv = nd.o.fcv[nd.o.fi]; if (!cv || cv.width !== nd.o.mw) return;
  const m = bFrameMask(cv), w = cv.width, h = cv.height; let bd = 99; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = nd.px + dx, y = nd.py + dy; if (x < 1 || y < 1 || x >= w - 1 || y >= h) continue; const i = y * w + x; if (m[i] && !m[i - w]) { const d = dx * dx + dy * dy * 1.2; if (d < bd) { bd = d; B.sx = dx; B.sy = dy } } } }
// a free sitting place on some thing near (x, y), of the kind the bird likes: trees, bushes or the works of men
function bNodeNear(x, y, r, wantTree, wantProp, wantBush, need) { const cand = []; for (const o of objsIn(x - r, y - r, x + r, y + r)) if (bPerchable(o, wantTree, wantProp, wantBush) && Math.hypot(o.x - x, o.y - y) < r) cand.push(o);
  for (let n = 0; n < 6 && cand.length; n++) { const nd = bNodeOn(bPick(cand), undefined, need); if (nd) return nd } return null }
// where a bird can cling to a tree: the trunk, found as the rows above the foot where the picture is only a few pixels wide
function bTrunks(o) { let L = BTRUNK.get(o); if (L) return L; L = []; BTRUNK.set(o, L); const m = o.mask, w = o.mw, h = o.mh; if (!m || !w || !BTREE.has(o.t)) return L; const cx = Math.round(o.ax);
  for (let y = Math.round(o.ay) - 7; y > Math.max(2, Math.round(o.ay) - 40); y -= 2) { if (!m[y * w + cx]) continue; let x0 = cx, x1 = cx; while (x0 > 0 && m[y * w + x0 - 1]) x0--; while (x1 < w - 1 && m[y * w + x1 + 1]) x1++; const wd = x1 - x0 + 1; if (wd >= 2 && wd <= 6) L.push([(x0 + x1) / 2 + .5, y, wd / 2]) }
  return L }
function bTrunkOn(o, near) { const L = bTrunks(o); if (!L.length) return null; const ox = Math.round(o.x - o.ax), oy = Math.round(o.y - o.ay);
  for (let n = 0; n < 5; n++) { const p = near ? bPick(L.filter(q => Math.abs(q[1] - near) <= 6)) || bPick(L) : bPick(L), key = (o.id || o.x + ',' + o.y) + ':t' + p[1]; if (BOCC.has(key)) continue;
    const px = ox + p[0], py = oy + p[1]; if (Math.hypot(px - R.x, py - R.y) < 26) continue; return { x: px, y: o.y + .6, z: o.y + .6 - py, key, o, cling: 1, hw: p[2], L, ox, oy, row: p[1] } } return null }
function bTrunkNear(x, y, r) { const cand = []; for (const o of objsIn(x - r, y - r, x + r, y + r)) if (o.ready && o.mask && o.kind === 'gen' && BTREE.has(o.t) && Math.hypot(o.x - x, o.y - y) < r) cand.push(o);
  for (let n = 0; n < 6 && cand.length; n++) { const nd = bTrunkOn(bPick(cand)); if (nd) return nd } return null }
// ---- the wires of the power line: sparrows (or jackdaws, pigeons, a crow or two) sit along a span in a row, spaced along it, and sway with it. Where a
// bird sits is found the way drawWire draws the cable (the same sag, the same sway, the same pixels), so its feet are on the wire and not beside it ----
const bWireLen = Wr => Math.hypot(Wr.b[0] - Wr.a[0], Wr.b[1] - Wr.a[1]);
const bWireOK = Wr => !Wr.thin && bWireLen(Wr) > 40;
function bWireAt(Wr, u) { const [ax, ay] = Wr.a, [bx, by] = Wr.b, len = bWireLen(Wr), g = gustNow(), sway = (WINDX * WIND.s * (.5 + g) * 1.6 + Math.sin(t * 1.3 + Wr.ph) * .35 * (.3 + WIND.s)) * Math.min(1, len / 80), n = Math.max(6, Math.round(len / 5));
  const P = i => { const v = i / n, q = 4 * v * (1 - v); return [Math.round(ax + (bx - ax) * v + sway * q), Math.round(ay + (by - ay) * v + Wr.sag * q)] }, f = u * n, i = Math.min(n - 1, Math.floor(f)), p0 = P(i), p1 = P(i + 1);
  const X = Math.round(p0[0] + (p1[0] - p0[0]) * (f - i)), Y = p1[0] !== p0[0] && Math.abs(p1[0] - p0[0]) >= Math.abs(p1[1] - p0[1]) ? Math.round(p0[1] + (p1[1] - p0[1]) * (X - p0[0]) / (p1[0] - p0[0])) : Math.round(p0[1] + (p1[1] - p0[1]) * (f - i));
  return [X, Y, Wr.ga[1] + (Wr.gb[1] - Wr.ga[1]) * u] }
const bWireSp = K => ({ T: 3.4, M: 5.2, C: 7.5 }[K.cls] || 5);
function bWireNode(Wr, u, K) { if (Wr._i === undefined) Wr._i = WIRES.indexOf(Wr); const len = bWireLen(Wr), sp = bWireSp(K), slot = Math.round(clamp(u, .1, .9) * len / sp), key = 'w' + Wr._i + ':' + slot; if (BOCC.has(key)) return null;
  const uu = slot * sp / len, [X, Y, gy] = bWireAt(Wr, uu), y = gy + .4; if (Math.hypot(X - R.x, gy - R.y) < 20) return null; return { x: X, y, z: y - Y + .5, key, wire: Wr, u: uu, slot } }
// the span of the line nearest a point, within r (along its ground), and where along it
function bWireNear(x, y, r) { let best = null, bd = r; for (const Wr of WIRES) { if (!bWireOK(Wr)) continue; const [x0, y0] = Wr.ga, [x1, y1] = Wr.gb, dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, u = clamp(((x - x0) * dx + (y - y0) * dy) / l2, .15, .85), d = Math.hypot(x - x0 - dx * u, y - y0 - dy * u); if (d < bd) { bd = d; best = { Wr, u, d, gx: x0 + dx * u, gy: y0 + dy * u } } } return best }
// the bird takes its place on a trunk: on the side the sprite's body hangs to
function bCling(B, nd) { B.node = nd; B.cling = 1; B.x = nd.x + (B.f > 0 ? -nd.hw : nd.hw); B.y = nd.y; B.z = nd.z }
function bFree(B) { B.dk = undefined; if (B.node) { BOCC.delete(B.node.key); B.node = null } if (B.tnode) { BOCC.delete(B.tnode.key); B.tnode = null } } // (the place it sits on, and the one it is flying to)
function bMake(id, x, y, z) { const K = BKIND[id], B = { id: BID++, kind: id, K, x, y, z: z || 0, vx: 0, vy: 0, vz: 0, st: 'ground', f: Math.random() < .5 ? 1 : -1, t: bRand(1, 4), ph: Math.random() * 6, wp: Math.random(), bnd: Math.random(), boff: 0, spd: bRand(.9, 1.1), pk: 0, hop: 0,
    call: bRand(4, 20), fl: null, node: null, tnode: null, T: null, delay: 0, zc: bRand(-2, 4), alert: 0, gl: false }; BIRDS.push(B); return B }
const bRest = F => F.mode === 'ground' ? bRand(80, 220) : F.mode === 'water' ? bRand(120, 300) : F.mode === 'trunk' ? bRand(50, 140) : bRand(60, 180); // (how long a flock stays before it moves on by itself)
// the way a flock of a kind sits at a place: on the ground (or, the crows, the jackdaws, the pigeons and the sparrows of the village, on the roofs), in the trees, on a trunk, on the water
function bModeAt(K, x, y, fleeing) { if (K.feet !== 'ground') return K.feet; const wire = () => K.wire && Math.random() < K.wire && bWireNear(x, y, fleeing ? 170 : 70);
  if (fleeing) { if (Math.random() < (K.cls === 'T' ? .55 : K.roof || .35)) return wire() ? 'wire' : K.cls === 'T' ? 'tree' : 'roof'; return 'ground' }
  if (K.wire && Math.random() < K.wire * .6 && bWireNear(x, y, 60)) return 'wire'; // (the line runs along the street: where it is near, a good many sit on it)
  return bctx(x, y).v > .3 && Math.random() < (K.roof || 0) ? (wire() ? 'wire' : 'roof') : 'ground' }
// one member's place in its flock's spot: a ground place spaced from the others, a perch on the flock's tree or roof (or one near), a trunk, a patch of water
function bSpot(F, x, y, obj, taken, pref) { const K = F.K, mode = F.mode;
  if (mode === 'water') { for (let k = 0; k < 10; k++) { const a = Math.random() * TAU, r = Math.random() * (pref && k < 5 ? 5 : 20), px = (pref && k < 5 ? pref.x : x) + Math.cos(a) * r, py = (pref && k < 5 ? pref.y : y) + Math.sin(a) * r * .6; if (bWater(px, py) && !taken.some(q => Math.hypot(q.x - px, q.y - py) < 6)) return { x: px, y: py, z: 0, kind: 'water' } } return null }
  if (mode === 'ground') { const sep = { T: 5, M: 7.5, C: 9, D: 12 }[K.cls] || 7, rr = sep * (1.4 + 1.1 * Math.sqrt(F.n || 3)); for (let k = 0; k < 16; k++) { const near = pref && k < 6, a = Math.random() * TAU, r = near ? Math.random() * sep * .8 : Math.sqrt(Math.random()) * rr, px = (near ? pref.x : x) + Math.cos(a) * r, py = (near ? pref.y : y) + Math.sin(a) * r * .7; if (taken.some(q => Math.hypot(q.x - px, (q.y - py) * 1.4) < sep)) continue; if (bGround(px, py)) return { x: px, y: py, z: 0, kind: 'ground' } } return null }
  if (mode === 'trunk') { const nd = (obj && bTrunkOn(obj)) || bTrunkNear(x, y, 50); return nd ? { x: nd.x, y: nd.y, z: nd.z, kind: 'node', node: nd } : null }
  if (mode === 'wire') { const Wr = F.wire; if (!Wr) return null; const len = bWireLen(Wr), u0 = clamp((F.uc ?? .5) + (pref ? ((pref.x - x) * (Wr.gb[0] - Wr.ga[0]) + (pref.y - y) * (Wr.gb[1] - Wr.ga[1])) / (len * len) : 0), .12, .88), sp = bWireSp(K) / len;
    for (let k = 0; k < 12; k++) { const nd = bWireNode(Wr, u0 + (k ? (k % 2 ? 1 : -1) * Math.ceil(k / 2) * sp : 0) + (Math.random() - .5) * sp * .3, K); if (nd) return { x: nd.x, y: nd.y, z: nd.z, kind: 'node', node: nd } } return null }
  const tree = mode === 'tree' || mode === 'roof', prop = mode === 'roof', bush = mode === 'tree' && K.cls === 'T'; let nd = obj && bPerchable(obj, tree, prop, bush) ? bNodeOn(obj, pref ? pref.x : undefined, bNeed(K)) : null; if (!nd) nd = bNodeNear(x, y, 40, tree, prop, bush, bNeed(K));
  return nd ? { x: nd.x, y: nd.y, z: nd.z, kind: 'node', node: nd } : null }
// a flock of one kind put at its place; `fromAir`: it comes flying in to it from the edge of the view
function bSpawnGroup(id, x, y, fromAir) { const K = BKIND[id], n = K.flock[0] + Math.floor(Math.random() * (K.flock[1] - K.flock[0] + 1)), F = { id: BFID++, kind: id, K, n, members: [], home: { x, y }, mode: bModeAt(K, x, y, false), obj: null, rest: 0, calm: 0, dx: 0, dy: 0 };
  if (F.mode === 'wire') { const W0 = bWireNear(x, y, 70); if (W0) { F.wire = W0.Wr; F.uc = W0.u; x = W0.gx; y = W0.gy } else F.mode = 'roof' }
  if (F.mode === 'trunk' || F.mode === 'tree' || F.mode === 'roof') { const r = 70, cand = []; for (const o of objsIn(x - r, y - r, x + r, y + r)) if (F.mode === 'trunk' ? (o.ready && o.mask && o.kind === 'gen' && BTREE.has(o.t)) : bPerchable(o, true, F.mode === 'roof', F.mode === 'tree' && K.cls === 'T')) cand.push(o); if (!cand.length) { if (K.feet !== 'ground') return null; F.mode = 'ground' } else F.obj = bPick(cand) }
  const taken = [];
  for (let i = 0; i < n; i++) { const sp = bSpot(F, F.obj ? F.obj.x : x, F.obj ? F.obj.y : y, F.obj, taken, F.mode === 'wire' ? { x: x + (i - (n - 1) / 2) * bWireSp(K) * (F.wire.gb[0] - F.wire.ga[0]) / bWireLen(F.wire), y: y + (i - (n - 1) / 2) * bWireSp(K) * (F.wire.gb[1] - F.wire.ga[1]) / bWireLen(F.wire) } : undefined); if (!sp) continue; taken.push(sp); const B = bMake(K.mate && i > 0 && Math.random() < (K.matep || .5) ? K.mate : id, sp.x, sp.y, sp.z); B.fl = F; F.members.push(B);
    if (sp.kind === 'water') { B.st = 'swim'; B.hd = Math.random() * TAU } else if (sp.node) { B.st = 'perch'; BOCC.add(sp.node.key); if (sp.node.cling) bCling(B, sp.node); else B.node = sp.node } else B.st = 'ground' }
  if (!F.members.length) return null; F.rest = bRest(F); BFL.push(F);
  if (fromAir) { const cx = CAM.x + W / 2, cy = CAM.y + H / 2, a = Math.atan2(F.home.y - cy, F.home.x - cx) + bRand(-.6, .6), ex = cx + Math.cos(a) * (W * .5 + 40), ey = cy + Math.sin(a) * (H * .5 + 40);
    for (const B of F.members) { const T = { x: B.x, y: B.y, z: B.z, kind: B.st === 'swim' ? 'water' : B.node ? 'node' : 'ground', node: B.node, f: B.f }; B.tnode = B.node; B.node = null; B.T = T; B.x = ex + bRand(-10, 10); B.y = ey + bRand(-8, 8); B.z = bRand(24, 34); bFlyStart(B, 0); B.vx = (T.x - B.x) * .2; B.vy = (T.y - B.y) * .2; B.cz = Math.max(B.z, T.z + 8) } }
  return F }
// where a flock goes: a place of its kind a little way off, away from `from` (the rider) and from the way he is going. null: nowhere to go near
function bPlan(F, from, dmin, dmax) { const K = F.K; let cx = 0, cy = 0, n = 0; for (const B of F.members) { cx += B.x; cy += B.y; n++ } if (!n) return null; cx /= n; cy /= n;
  const sp = Math.abs(R.v), path = [[R.x, R.y], [R.x + Math.sin(R.psi) * sp * 2.5, R.y - Math.cos(R.psi) * sp * 2.5]], away = from ? Math.atan2(cy - from[1], cx - from[0]) : Math.random() * TAU, spread = from ? 1.2 : Math.PI;
  const score = (x, y) => Math.min(Math.hypot(x - R.x, y - R.y), segD(path, x, y) * 1.3) + (bInZone(x, y) ? 0 : -300) + Math.random() * 16; let mode = bModeAt(K, cx, cy, !!from);
  let best = null, bs = -1e9;
  if (mode === 'wire') { for (const Wr of WIRES) { if (!bWireOK(Wr)) continue; for (const u of [.2, .35, .5, .65, .8]) { const gx = Wr.ga[0] + (Wr.gb[0] - Wr.ga[0]) * u, gy = Wr.ga[1] + (Wr.gb[1] - Wr.ga[1]) * u, d = Math.hypot(gx - cx, gy - cy); if (d < dmin || d > dmax || (Wr === F.wire && Math.abs(u - F.uc) < .2)) continue; if (from && Math.cos(Math.atan2(gy - cy, gx - cx) - away) < -.15) continue; const s = score(gx, gy); if (s > bs) { bs = s; best = { x: gx, y: gy, mode, obj: null, wire: Wr, uc: u } } } } if (!best) mode = 'roof' }
  if (!best && mode !== 'ground' && mode !== 'water') { for (const o of objsIn(cx - dmax, cy - dmax, cx + dmax, cy + dmax)) { if (o === F.obj) continue; const ok = mode === 'trunk' ? (o.ready && o.mask && o.kind === 'gen' && BTREE.has(o.t)) : bPerchable(o, true, mode === 'roof', mode === 'tree' && K.cls === 'T'); if (!ok) continue;
      const d = Math.hypot(o.x - cx, o.y - cy); if (d < dmin || d > dmax) continue; if (from && Math.cos(Math.atan2(o.y - cy, o.x - cx) - away) < -.15) continue; const s = score(o.x, o.y); if (s > bs) { bs = s; best = { x: o.x, y: o.y, mode, obj: o } } } }
  if (!best) { const m2 = mode === 'water' ? 'water' : K.feet === 'ground' ? 'ground' : null; if (!m2) return null;
    for (let k = 0; k < 18; k++) { const a = away + (Math.random() - .5) * 2 * spread, d = bRand(dmin, dmax), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * .8; if (m2 === 'water' ? !bWater(x, y) : !bGround(x, y)) continue; const s = score(x, y); if (s > bs) { bs = s; best = { x, y, mode: m2, obj: null } } } }
  return best }
const bInZone = (x, y) => x > CAM.x - 150 && x < CAM.x + W + 150 && y > CAM.y - 120 && y < CAM.y + H + 150;
// the flock goes up for `D`: all together, the one nearest the fright first (`from`: what scared them; none: they move on by themselves, one after another)
function bGo(F, D, from) { F.mode = D.mode; F.obj = D.obj; F.wire = D.wire || null; F.uc = D.uc; F.home = { x: D.x, y: D.y }; F.rest = bRest(F); F.calm = 6; F.taken = []; F.D = D;
  let cx = 0, cy = 0; for (const m of F.members) { cx += m.x / F.members.length; cy += m.y / F.members.length } for (const m of F.members) m.off = [(m.x - cx) * .8, (m.y - cy) * .8];
  const list = F.members.slice().sort((a, b) => from ? Math.hypot(a.x - from[0], a.y - from[1]) - Math.hypot(b.x - from[0], b.y - from[1]) : 0);
  list.forEach((m, i) => { bFree(m); m.mv = false; m.from = from || [m.x - (D.x - m.x), m.y - (D.y - m.y)]; m.alert = 1; if (m.st === 'fly' || m.st === 'flit') { bTakeoff(m, true); return } m.st = 'up'; m.upT = from ? i * bRand(.03, .1) : .15 + i * bRand(.15, .45) });
  if (from && F.K.call) { const m = list[0]; if (m && Math.random() < .6) m.call = Math.min(m.call, bRand(.05, .4)) } }
function bFlee(F) { const K = F.K, r = K.cls === 'T' ? [36, 110] : K.cls === 'D' ? [90, 200] : [60, 170], D = bPlan(F, [R.x, R.y], r[0], r[1]); BDBG.flush++; if (D) bGo(F, D, [R.x, R.y]); else for (const m of F.members.slice()) bLeave(m) }
// a member leaves the ground for the flock's spot: its own place there, then the flight
function bTakeoff(B, inAir) { const F = B.fl, D = F && F.D, pref = D && B.off ? { x: D.x + B.off[0], y: D.y + B.off[1] } : null; let T = D ? bSpot(F, D.obj ? D.obj.x : D.x, D.obj ? D.obj.y : D.y, D.obj, F.taken, pref) : null;
  if (!T && D && B.K.feet === 'ground') { const F2 = { K: B.K, mode: 'ground', n: F.n }; T = bSpot(F2, D.x, D.y, null, F.taken) }
  if (!T) { bLeave(B); return } F.taken.push(T); if (T.node) { BOCC.add(T.node.key); B.tnode = T.node; if (T.node.cling) T.f = Math.random() < .5 ? 1 : -1 }
  if (B.st === 'up' && B.was === 'swim') RINGS.push({ x: B.x, y: B.y, t: 0, life: .9 }, { x: B.x + 1, y: B.y, t: -.1, life: .9 });
  B.T = T; if (inAir) { const z = B.z, vx = B.vx, vy = B.vy, vz = B.vz; bFlyStart(B, 0); B.z = z; B.vx = vx; B.vy = vy; B.vz = vz; B.ft = 1; B.cz = Math.max(B.cz, z); return }
  bFlyStart(B, 1); const away = Math.atan2(B.y - B.from[1], B.x - B.from[0]); B.vx = Math.cos(away) * 12; B.vy = Math.sin(away) * 9 }
function bFlyStart(B, jump) { const T = B.T, d0 = Math.hypot(T.x - B.x, T.y - B.y); B.st = 'fly'; B.ft = 0; B.d0 = d0; B.vz = jump ? bRand(16, 24) : 0; B.f = T.x >= B.x ? 1 : -1; B.cling = 0;
  B.cz = T.z + (B.K.feet === 'water' ? clamp(d0 * .07, 3, 12) : clamp(d0 * .15, 5, 30)) + B.zc; if (T.kind === 'node') B.cz = Math.max(B.cz, T.z + 4); B.cz = Math.max(B.cz, B.z + (jump ? 3 : 0)) }
function bLeave(B) { const a = Math.atan2(B.y - R.y, B.x - R.x) + bRand(-.8, .8), d = 420; bFree(B); B.T = { x: B.x + Math.cos(a) * d, y: B.y + Math.sin(a) * d * .7, z: 36, kind: 'leave' }; B.st = 'fly'; B.leave = true; B.ft = 1; B.cz = 34 + B.zc * 2; B.vz = Math.max(B.vz, 10); B.cling = 0;
  if (B.fl) { const i = B.fl.members.indexOf(B); if (i >= 0) B.fl.members.splice(i, 1); B.fl = null } BDBG.leave++ }
function bCall(B) { if (!B.K.call) return; bVoice(B.K.call, B.x, B.y - B.z) }
function stepBirds(dt) { if (!BSTART) bInit(); const act = bAct(), rv = Math.abs(R.v), zx0 = CAM.x - 150, zy0 = CAM.y - 120, zx1 = CAM.x + W + 150, zy1 = CAM.y + H + 150;
  const inV = (x, y, m) => x > CAM.x - m && x < CAM.x + W + m && y > CAM.y - m && y < CAM.y + H + m;
  // how many flocks there should be: by what the zone is made of (sampled a few points at a time) and by the weather and the light
  BZT -= dt; if (BZT <= 0) { BZT = 2.5; const a = { v: 0, g: 0, s: 0, f: 0, w: 0 }; for (let i = 0; i < 14; i++) { const c = bctx(zx0 + Math.random() * (zx1 - zx0), zy0 + Math.random() * (zy1 - zy0)); a.v += c.v; a.g += c.g * (1 - c.v); a.s += c.s * (1 - c.w); a.f += c.fb + c.fs + c.fm + c.fh; a.w += c.w } for (const k in a) BZONE[k] = a[k] / 14 }
  const wantF = Math.round((1.8 + 4 * BZONE.v + 3 * BZONE.g + 1.5 * BZONE.s + 2.6 * BZONE.f + 1.8 * BZONE.w) * act);
  BCNT = 0; const per = {}; for (const b of BIRDS) { if (b.leave) continue; BCNT++; per[b.kind] = (per[b.kind] || 0) + 1 }
  let nF = 0, nFV = 0; for (const F of BFL) { if (!F.members.length) continue; nF++; if (F.members.some(b => inV(b.x, b.y - b.z, 0))) nFV++ }
  const capped = id => (per[id] || 0) >= (BKIND[id].cap || Math.ceil(BKIND[id].flock[1] * 1.6)), pickAt = (x, y) => { const c = bctx(x, y); for (let k = 0; k < 6; k++) { const id = bKindAt(c, per); if (id && !capped(id)) return id } return null };
  // the first look: the flocks that are there already, in sight and round about
  if (!BFIRST) { BFIRST = true; if (!BTEST) for (let i = 0, k = 0, nS = Math.max(2, Math.round(wantF * .5)); i < wantF && k < 60; k++) { const inS = i < nS, x = inS ? CAM.x + 20 + Math.random() * (W - 40) : zx0 + Math.random() * (zx1 - zx0), y = inS ? CAM.y + 30 + Math.random() * (H - 50) : zy0 + Math.random() * (zy1 - zy0), id = pickAt(x, y); if (inS && Math.hypot(x - R.x, y - R.y) < 50) continue; if (id && bSpawnGroup(id, x, y, false)) { i++; BDBG.rest++ } } }
  // new flocks are found out of sight (ahead of the rider, if he is going), now and then one comes flying in
  BSPAWNT -= dt; BAIRT -= dt;
  if (BSPAWNT <= 0 && act > .25 && !BTEST) { BSPAWNT = bRand(3, 6);
    if (nF < wantF) { let best = null, bs = -1e9; for (let k = 0; k < 10; k++) { const x = zx0 + Math.random() * (zx1 - zx0), y = zy0 + Math.random() * (zy1 - zy0); if (inV(x, y, 16)) continue; const s = rv > 4 ? (Math.sin(R.psi) * (x - R.x) - Math.cos(R.psi) * (y - R.y)) : Math.random(); if (s > bs) { bs = s; best = [x, y] } }
      if (best) { const id = pickAt(best[0], best[1]); if (id && bSpawnGroup(id, best[0], best[1], false)) BDBG.rest++ } }
    else if (nF > wantF + 1) { let far = null, fd = 0; for (const F of BFL) { if (!F.members.length || F.members.some(b => inV(b.x, b.y - b.z, 30))) continue; const d = Math.hypot(F.home.x - R.x, F.home.y - R.y); if (d > fd) { fd = d; far = F } } if (far) { for (const B of far.members) { bFree(B); B.st = 'off' } BDBG.cull++ } } }
  if (BAIRT <= 0) { BAIRT = 6; if (act > .4 && !BTEST && nFV < Math.min(2, wantF) && nF <= wantF + 1) { for (let k = 0; k < 6; k++) { const x = CAM.x + 20 + Math.random() * (W - 40), y = CAM.y + 30 + Math.random() * (H - 50), id = pickAt(x, y); if (id && Math.hypot(x - R.x, y - R.y) > 60 && bSpawnGroup(id, x, y, true)) { BDBG.air++; BAIRT = bRand(45, 100); break } } } }
  // the flocks: moving on by themselves now and then (or, at dusk, leaving for the night); the ground birds' feeding place drifts as they feed
  for (const F of BFL) { if (!F.members.length) continue; F.rest -= dt; F.calm -= dt; const rest = F.members.every(b => b.st === 'ground' || b.st === 'perch' || b.st === 'swim');
    if (!rest || BTEST) continue;
    if (act < .15 && Math.random() < dt * .3) { for (const B of F.members.slice()) bLeave(B); continue }
    if (F.rest <= 0) { F.rest = bRest(F); if (F.members.some(b => inV(b.x, b.y - b.z, 0))) { if (Math.random() < .25) { for (const B of F.members.slice()) bLeave(B) } else { const D = bPlan(F, null, 30, 120); if (D) { bGo(F, D, null); BDBG.move++ } } } continue }
    if (F.mode === 'ground') { if (Math.random() < dt * .1) { const a = Math.random() * TAU; F.dx = Math.cos(a) * 1.2; F.dy = Math.sin(a) * .8 } const nx = F.home.x + F.dx * dt, ny = F.home.y + F.dy * dt; if (bGround(nx, ny)) { F.home.x = nx; F.home.y = ny } else { F.dx = -F.dx; F.dy = -F.dy } } }
  for (let i = BFL.length - 1; i >= 0; i--) if (!BFL[i].members.length) BFL.splice(i, 1);
  // the birds
  for (let i = BIRDS.length - 1; i >= 0; i--) { const B = BIRDS[i], K = B.K; B.ph += dt * 6; const d = Math.hypot(B.x - R.x, B.y - R.y);
    // far out of the zone (or culled): gone
    if (B.x < zx0 - 140 || B.x > zx1 + 140 || B.y < zy0 - 140 || B.y > zy1 + 140 || B.st === 'off') { bFree(B); if (B.fl) { const j = B.fl.members.indexOf(B); if (j >= 0) B.fl.members.splice(j, 1) } BIRDS.splice(i, 1); continue }
    B.call -= dt; if (B.call <= 0) { B.call = K.cls === 'C' ? bRand(10, 30) : bRand(6, 22); if (d < 260 && (B.st !== 'swim' || Math.random() < .5)) bCall(B) }
    if (B.st === 'up') { B.upT -= dt; if (B.upT <= 0) { B.was = B.was || 'ground'; bTakeoff(B) } continue }
    if (B.st === 'perch' || B.st === 'ground' || B.st === 'swim') { B.t -= dt; const flee = K.flee * (B.st === 'perch' && B.z > 8 ? .62 : 1) * (.55 + .45 * Math.min(1, rv / 40)); B.alert = d < flee * 1.6 ? 1 : 0; B.was = B.st;
      if (d < flee && K.flee > 0 && B.fl) { bFlee(B.fl); continue }
      if (d < flee && K.flee > 0 && !B.fl) { bLeave(B); continue } }
    if (B.st === 'perch' && B.cling) { // on a trunk: climbs a little up or down it, turns, drums (the woodpecker)
      if (B.hop > 0) B.hop -= dt; if (B.pk > 0) B.pk -= dt; if (B.t <= 0) { B.t = bRand(.6, 2); const r = Math.random(), nd = B.node;
        if (r < .5 && nd && nd.L) { const q = bPick(nd.L.filter(p => p[1] !== nd.row && Math.abs(p[1] - nd.row) <= 6)); if (q) { const key = (nd.o.id || nd.o.x + ',' + nd.o.y) + ':t' + q[1]; if (!BOCC.has(key)) { BOCC.delete(nd.key); const n2 = { x: nd.ox + q[0], y: nd.y, z: nd.o.y + .6 - (nd.oy + q[1]), key, o: nd.o, cling: 1, hw: q[2], L: nd.L, ox: nd.ox, oy: nd.oy, row: q[1] }; BOCC.add(key); bCling(B, n2); B.hop = .16 } } }
        else if (r < .75 && K.drum) { B.pk = bRand(.5, 1.1); B.t = B.pk + bRand(.6, 1.6); if (d < 260) bVoice('drum', B.x, B.y - B.z) } else if (r < .85 && nd) { B.f = -B.f; bCling(B, nd) } } }
    else if (B.st === 'perch' && B.node && B.node.wire) { // on a wire: sways with it, turns, shuffles a step along it now and then
      const nd = B.node, [X, Y] = bWireAt(nd.wire, nd.u); B.x = X; B.z = B.y - Y + .5; B.dk = nd.wire.key + .05; if (B.hop > 0) B.hop -= dt;
      if (B.t <= 0) { B.t = bRand(2, 7); const r = Math.random(); if (r < .3) B.f = -B.f; else if (r < .45) { const n2 = bWireNode(nd.wire, nd.u + (Math.random() < .5 ? 1 : -1) * bWireSp(K) / bWireLen(nd.wire), K); if (n2) { BOCC.delete(nd.key); BOCC.add(n2.key); B.node = n2; B.hop = .16 } } } }
    else if (B.st === 'perch') { // on a branch or a roof: turns, shifts its feet; the small birds of the trees flit to a twig near by now and then
      if (B.hop > 0) B.hop -= dt; bOnBranch(B); if (B.t <= 0) { const treeBird = K.feet === 'tree'; B.t = treeBird ? bRand(1.5, 5) : bRand(2, 7); const r = Math.random();
        if (treeBird && r < .32 && !B.alert && B.node) { const nd = Math.random() < .7 && B.node.o ? bNodeOn(B.node.o, B.x + bRand(-14, 14), bNeed(K)) : bNodeNear(B.x, B.y, 22, true, false, K.cls === 'T', bNeed(K)); if (nd && nd.key !== B.node.key && Math.hypot(nd.x - B.x, nd.z - B.z) > 2 && Math.hypot(nd.x - B.x, nd.z - B.z) < 30) { bFlit(B, nd); continue } }
        if (r < .7) B.f = -B.f; else if (r < .85) B.hop = .16 } }
    else if (B.st === 'ground') { // feeding: pecks, hops a step or two, turns; keeps near the flock's feeding place; looks at the rider when he is near
      if (B.pk > 0) B.pk -= dt; if (B.hop > 0) B.hop -= dt;
      if (B.mv) { const sp = (K.cls === 'C' || K.cls === 'M' ? 9 : 13) * dt, dx = B.tx - B.x, dy = B.ty - B.y, l = Math.hypot(dx, dy); if (l < sp) { B.mv = false; B.t = bRand(.5, 2.5) } else { const nx = B.x + dx / l * sp, ny = B.y + dy / l * sp; if (bGround(nx, ny)) { B.x = nx; B.y = ny; B.f = dx >= 0 ? 1 : -1; if (K.cls === 'T' || K.cls === 'M') B.hop = .12 } else { B.mv = false; B.t = .6 } } }
      else if (B.alert) { B.pk = 0; if (B.t <= 0) { B.t = bRand(.6, 1.8); B.f = R.x >= B.x ? 1 : -1 } }
      else if (B.t <= 0) { const r = Math.random(); if (r < .5) { B.pk = bRand(.4, 1); B.t = B.pk + bRand(.1, .8) } else if (r < .85) { const h = B.fl ? B.fl.home : { x: B.x, y: B.y }, tx = h.x + bRand(-12, 12), ty = h.y + bRand(-9, 9); if (bGround(tx, ty) && Math.hypot(tx - B.x, ty - B.y) < 16) { B.tx = tx; B.ty = ty; B.mv = true } else B.t = .5 } else { B.f = -B.f; B.t = bRand(.8, 2.4) } } }
    else if (B.st === 'swim') { B.hd += (Math.sin(t * .3 + B.id) * .5) * dt; const sp = 1.6 + .6 * Math.sin(t * .2 + B.id), nx = B.x + Math.cos(B.hd) * sp * dt, ny = B.y + Math.sin(B.hd) * sp * dt * .6;
      if (bWater(nx, ny)) { B.x = nx; B.y = ny; B.f = Math.cos(B.hd) >= 0 ? 1 : -1 } else B.hd += 2.2 + Math.random();
      if (B.fl && B.fl.members.length > 1) { const c = B.fl.members[0]; if (c !== B) { const dx = c.x - B.x, dy = c.y - B.y, l = Math.hypot(dx, dy); if (l > 16) B.hd += (Math.atan2(dy, dx) - B.hd) * dt * .6 } }
      if (B.pk > 0) B.pk -= dt; else if (B.t <= 0) { B.t = bRand(6, 18); B.pk = Math.random() < .5 ? 1.4 : 0 } }
    else if (B.st === 'flit') bStepFlit(B, dt);
    else if (B.st === 'fly') bStepFly(B, dt) }
  stepBirdsSky(dt, act); if (BWARM.length && dt < .04) { const q = BWARM.pop(); bsprite(q[0], q[1], q[2]) } }
// a short flit from twig to twig (the tits, the finches): a little hop of a flight, a second or less, the wings going all the while
function bFlit(B, nd) { bFree(B); BOCC.add(nd.key); B.tnode = nd; B.fx = B.x; B.fy = B.y; B.fz = B.z; B.T = { x: nd.x, y: nd.y, z: nd.z, kind: 'node', node: nd }; B.st = 'flit'; B.fu = 0; const dd = Math.hypot(nd.x - B.x, nd.y - B.y, nd.z - B.z); B.fdur = .25 + dd * .022; B.fh = 2 + dd * .12; B.f = nd.x >= B.x ? 1 : -1; BDBG.flit++ }
function bStepFlit(B, dt) { const T = B.T; B.fu = Math.min(1, B.fu + dt / B.fdur); const u = B.fu, e = u * u * (3 - 2 * u); B.x = B.fx + (T.x - B.fx) * e; B.y = B.fy + (T.y - B.fy) * e; B.z = B.fz + (T.z - B.fz) * e + Math.sin(Math.PI * u) * B.fh; B.wp += dt * BFLY.T.beat; B.boff = 0;
  if (u >= 1) { B.node = T.node; B.tnode = null; B.x = T.x; B.y = T.y; B.z = T.z; B.st = 'perch'; B.t = bRand(1, 3.5); B.hop = .14 } }
// the flight: toward its place at the speed of its kind, braking in the last stretch; up to a height for the distance, and down to the place in a glide as it nears
function bStepFly(B, dt) { const T = B.T, K = B.K, FL = BFLY[K.cls] || BFLY.M; B.ft += dt; const dx = T.x - B.x, dy = T.y - B.y, dist = Math.hypot(dx, dy) || 1e-3;
  const leave = T.kind === 'leave', s = leave ? 1 : clamp(dist / 34, 0, 1), sm = s * s * (3 - 2 * s), zt = leave ? B.cz : T.z + (B.cz - T.z) * sm, w = 4.2;
  B.vz += ((zt - B.z) * w * w - 2 * w * B.vz) * dt; B.z = Math.max(0, B.z + B.vz * dt);
  const cruise = K.speed * B.spd * Math.min(1, .5 + B.ft * 1.1), sp = leave ? cruise : Math.min(cruise, 2.5 + dist * 2.4), side = leave ? 0 : Math.sin(B.ft * 1.4 + B.id) * 2.2 * s;
  const ux = dx / dist, uy = dy / dist, k = Math.min(1, dt * 4.5); B.vx += (ux * sp - uy * side - B.vx) * k; B.vy += (uy * sp + ux * side - B.vy) * k; B.x += B.vx * dt; B.y += B.vy * dt; if (Math.abs(B.vx) > 1.5) B.f = B.vx >= 0 ? 1 : -1;
  // the wings: a bounding flight for the small ones (beats, then shut), a glide now and then for the big ones, and down the last stretch
  if (K.bound) { B.bnd = (B.bnd + dt / .46) % 1; const flap = B.bnd < .55 || dist < 10; if (flap) B.wp += dt * FL.beat; B.boff = leave || dist > 10 ? 1.3 * Math.sin(B.bnd * TAU) : 0; B.gl = !flap }
  else { B.gl = FL.glide > 0 && B.ft > .8 && ((Math.sin(t * .8 + B.id * 1.9) > 1 - FL.glide * 2.2 && B.vz < 2) || (!leave && dist < 26 && B.vz < -1)); if (!B.gl) B.wp += dt * FL.beat; B.boff = 0 }
  if (leave) { if (Math.abs(B.x - CAM.x - W / 2) > W * .5 + 330 || Math.abs(B.y - CAM.y - H / 2) > H * .5 + 280) B.st = 'off'; return }
  if (dist < 1.1 && Math.abs(B.z - T.z) < 1.2) { B.vx = B.vy = B.vz = 0; B.boff = 0; B.x = T.x; B.y = T.y; B.z = T.z; B.t = bRand(1, 3);
    if (T.kind === 'node' && T.node) { B.node = T.node; B.tnode = null; B.st = 'perch'; if (T.node.cling) { B.f = T.f || B.f; bCling(B, T.node) } else B.cling = 0 }
    else if (T.kind === 'water' && matAt(B.x, B.y) === 'lake') { B.z = 0; B.st = 'swim'; B.hd = Math.random() * TAU; B.t = bRand(2, 8); RINGS.push({ x: B.x, y: B.y, t: 0, life: .9 }) }
    else { B.z = 0; B.st = 'ground'; B.cling = 0 } B.leave = false } }
// ---- the sky: a skein of geese in a wedge far up; at dusk a long straggling line of crows going to roost ----
function stepBirdsSky(dt, act) { BSKYT -= dt; BDUSKT -= dt; const eve = DAY.h > 14 && LT.dark > .08 && LT.dark < .7 && WX.rain < .4;
  if (BSKYT <= 0) { BSKYT = bRand(160, 320); if (act > .6) skySpawn('goose') }
  if (BDUSKT <= 0) { BDUSKT = bRand(28, 60); if (eve) skySpawn('crow') }
  for (let i = BSKY.length - 1; i >= 0; i--) { const G = BSKY[i]; G.x += G.vx * dt; G.y += G.vy * dt; G.ph += dt; G.call -= dt; if (G.call <= 0) { G.call = bRand(1.4, 3.2); const m = bPick(G.m); bVoice(G.kind === 'goose' ? 'honk' : 'caw', G.x + m[0], G.y + m[1], G.kind === 'goose' ? .55 : .5) }
    if ((G.vx > 0 ? G.x - CAM.x > W + 420 : G.x - CAM.x < -420) || Math.abs(G.y - G.z - CAM.y - H / 2) > H + 300) BSKY.splice(i, 1) } }
function skySpawn(kind) { const goose = kind === 'goose', dirx = goose ? -1 : (Math.random() < .5 ? -1 : 1), sp = goose ? bRand(20, 27) : bRand(30, 40), ang = goose ? bRand(.5, .85) : bRand(-.25, .25), vx = dirx * sp * Math.cos(ang), vy = sp * Math.sin(ang) * (goose ? 1 : bPick([-1, 1])), n = goose ? 7 + Math.floor(Math.random() * 9) : 5 + Math.floor(Math.random() * 9), z = goose ? bRand(120, 160) : bRand(60, 95), m = [];
  const ux = vx / sp, uy = vy / sp, nx = -uy, ny = ux;                                               // along the flight and across it
  for (let i = 0; i < n; i++) { if (goose) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, bk = row * 6.6 + Math.random() * 1.2, sd = side * row * 4.6 + (Math.random() - .5) * 1.2; m.push([-ux * bk + nx * sd, -uy * bk + ny * sd, (Math.random() - .5) * 2, Math.random()]) }
    else { const bk = i * bRand(8, 15), sd = bRand(-12, 12); m.push([-ux * bk + nx * sd, -uy * bk + ny * sd, (Math.random() - .5) * 8, Math.random()]) } }
  const dy0 = CAM.y + H * (goose ? bRand(.04, .3) : bRand(.25, .55)) + z; BSKY.push({ kind, x: CAM.x + W / 2 - dirx * (W / 2 + 260), y: dy0, vx, vy, z, m, ph: Math.random() * 3, call: bRand(.5, 2), id: BID++ }) }
// ---- the pictures ----
function drawBirdShadow(B) { const z = B.z; if (z < 1.5) return; ctx.fillStyle = `rgba(8,14,8,${clamp(.2 - z * .004, .04, .18).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(B.x + z * .22, B.y + .5, Math.max(1.6, (B.K.k || 1) * (B.K.cls === 'C' ? 3.6 : B.K.cls === 'M' ? 3 : 2.2) - z * .03), .9, 0, 0, TAU); ctx.fill() }
function bPose(B) { const K = B.K; if (B.st === 'up') return 'fup';
  if (B.st === 'fly' || B.st === 'flit') { if (B.gl) return K.bound ? 'fold' : 'fmid'; const p = B.wp % 1; return p < .25 ? 'fup' : p < .5 ? 'fmid' : p < .75 ? 'fdn' : 'fmid' }
  if (B.st === 'swim') return B.pk > 0 ? 'dabble' : 'swim'; if (B.st === 'perch') return B.cling ? (B.pk > 0 ? 'hammer' : 'cling') : B.hop > 0 ? 'hop' : 'stand'; if (B.pk > 0) return 'peck'; if (B.hop > 0) return 'hop'; return 'stand' }
function drawBird(B) { const S = bsprite(B.kind, bPose(B), B.f < 0), sw = B.st === 'perch' && !B.cling, gz = B.z + (B.boff || 0) - (sw ? B.sy || 0 : 0); if (B.st === 'ground') { ctx.fillStyle = 'rgba(8,14,8,.16)'; ctx.fillRect(Math.round(B.x) - 1, Math.round(B.y), 3, 1) } else if (B.st === 'swim') { ctx.fillStyle = 'rgba(210,225,232,.16)'; ctx.fillRect(Math.round(B.x) - 4, Math.round(B.y), 8, 1) }
  ctx.drawImage(S.cv, Math.round(B.x + (sw ? B.sx || 0 : 0)) - S.ax, Math.round(B.y - gz) - S.ay) }
// over everything: the birds that fly over the roofs, and the geese and the crows high up
function drawBirdsHigh() { for (const B of BIRDS) if ((B.st === 'fly' || B.st === 'flit') && B.z >= BHIGH && B.x > CAM.x - 24 && B.x < CAM.x + W + 24 && B.y - B.z > CAM.y - 30 && B.y - B.z < CAM.y + H + 30) drawBird(B);
  for (const G of BSKY) { const goose = G.kind === 'goose', haze = goose ? .78 : .86; ctx.globalAlpha = haze * (1 - .5 * WX.fog); for (const m of G.m) { const x = G.x + m[0], y = G.y + m[1] - G.z + m[2]; if (x < CAM.x - 16 || x > CAM.x + W + 16 || y < CAM.y - 16 || y > CAM.y + H + 16) continue;
      const p = (G.ph * (goose ? 1.1 : 1.9) + m[3]) % 1, pose = !goose && Math.sin(G.ph * .7 + m[3] * 6) > .5 ? 'fmid' : p < .25 ? 'fup' : p < .5 ? 'fmid' : p < .75 ? 'fdn' : 'fmid', S = bsprite(goose ? 'goose' : 'crow', pose, G.vx < 0); ctx.drawImage(S.cv, Math.round(x) - S.ax, Math.round(y) - S.ay) } ctx.globalAlpha = 1 } }
// ---- the voices ----
function bnote(A, dst, t0, o) { const osc = A.createOscillator(), g = A.createGain(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f[0], t0); for (let i = 1; i < o.f.length; i++) osc.frequency.linearRampToValueAtTime(o.f[i], t0 + o.d * i / (o.f.length - 1)); let last = osc;
  if (o.bp) { const f = A.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.q || 1.5; osc.connect(f); last = f }
  if (o.vib) { const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + o.d + .05) }
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(o.v, t0 + Math.min(.02, o.d * .3)); g.gain.exponentialRampToValueAtTime(.001, t0 + o.d); last.connect(g); g.connect(dst); osc.start(t0); osc.stop(t0 + o.d + .03) }
const BVOICE = {
  caw: (A, o, T) => { const n = 1 + (Math.random() * 3 | 0), b = bRand(560, 680); for (let i = 0; i < n; i++) bnote(A, o, T + i * .42, { type: 'sawtooth', f: [b, b * .95, b * .72], d: .3, v: .6 - i * .1, bp: 1150, q: 1.1, vib: [38, 24] }) },
  jack: (A, o, T) => { const n = 2 + (Math.random() * 4 | 0), b = bRand(1250, 1500); for (let i = 0; i < n; i++) bnote(A, o, T + i * .17, { type: 'sawtooth', f: [b, b * .72], d: .1, v: .5, bp: 2100, q: 1.5 }) },
  rattle: (A, o, T) => { for (let i = 0; i < 12; i++) bnote(A, o, T + i * .036, { type: 'square', f: [2100 + (i % 2) * 260, 1900], d: .03, v: .22, bp: 2600, q: 1.8 }) },
  chirp: (A, o, T) => { const n = 3 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) { const f = bRand(3000, 4300); bnote(A, o, T + i * bRand(.07, .12), { f: [f, f * bRand(.85, 1.18)], d: .05, v: .35 }) } },
  tit: (A, o, T) => { const n = 2 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) { bnote(A, o, T + i * .26, { f: [3900, 3700], d: .09, v: .4 }); bnote(A, o, T + i * .26 + .12, { f: [3400, 3300], d: .09, v: .34 }) } },
  bluetit: (A, o, T) => { for (let i = 0; i < 7; i++) bnote(A, o, T + i * .045, { f: [5600 + i * 60, 5900], d: .035, v: .28 }); bnote(A, o, T + .4, { f: [4600, 3900], d: .12, v: .3 }) },
  twitter: (A, o, T) => { const n = 7 + (Math.random() * 6 | 0); for (let i = 0; i < n; i++) { const f = bRand(4300, 6200); bnote(A, o, T + i * .05, { f: [f, f * 1.1], d: .035, v: .26 }) } },
  pipe: (A, o, T) => { bnote(A, o, T, { f: [980, 860], d: .34, v: .22, vib: [6, 14] }) },
  chack: (A, o, T) => { const n = 3 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) bnote(A, o, T + i * .13, { type: 'sawtooth', f: [2500, 1700], d: .07, v: .36, bp: 2800, q: 1.6 }) },
  screech: (A, o, T) => { bnote(A, o, T, { type: 'sawtooth', f: [1500, 1250, 900], d: .5, v: .5, bp: 1700, q: .9, vib: [55, 70] }) },
  coo: (A, o, T) => { bnote(A, o, T, { f: [440, 470, 430], d: .5, v: .35, vib: [7, 12] }); bnote(A, o, T + .55, { f: [400, 430, 380], d: .6, v: .3, vib: [7, 10] }) },
  quack: (A, o, T) => { const n = 3 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) bnote(A, o, T + i * .22, { type: 'sawtooth', f: [540 - i * 20, 340], d: .2, v: .5 - i * .06, bp: 950, q: 2 }) },
  kick: (A, o, T) => { bnote(A, o, T, { type: 'square', f: [2600, 1900], d: .05, v: .5, bp: 2300, q: 1.4 }); if (Math.random() < .6) bnote(A, o, T + .32, { type: 'square', f: [2500, 1800], d: .05, v: .4, bp: 2300, q: 1.4 }) },
  drum: (A, o, T) => { for (let i = 0; i < 18; i++) bnote(A, o, T + i * .045, { type: 'square', f: [1000, 640], d: .02, v: .5 * (1 - i / 26), bp: 1700, q: .8 }) },
  nut: (A, o, T) => { for (let i = 0; i < 3; i++) bnote(A, o, T + i * .12, { f: [3300, 3050], d: .06, v: .34 }); if (Math.random() < .5) bnote(A, o, T + .5, { f: [2200, 1700], d: .26, v: .24, vib: [8, 40] }) },
  chip: (A, o, T) => { const n = 3 + (Math.random() * 3 | 0); for (let i = 0; i < n; i++) bnote(A, o, T + i * .1, { type: 'square', f: [3400, 2500], d: .05, v: .26, bp: 3000, q: 1.5 }) },
  honk: (A, o, T) => { bnote(A, o, T, { type: 'sawtooth', f: [640, 760, 560], d: .38, v: .5, bp: 1100, q: 1.2 }); bnote(A, o, T + .46, { type: 'sawtooth', f: [600, 720, 520], d: .34, v: .42, bp: 1050, q: 1.2 }) }
};
function bVoice(kind, x, y, gain) { if (!SND.on || !SND.ctx || !SND.ready || paused) return; const d = Math.hypot(x - R.x, y - R.y); if (d > 340) return; const A = SND.ctx, T = A.currentTime + .03, vol = (gain || 1) * .055 / (1 + (d / 120) * (d / 120)), out = A.createGain(); out.gain.value = vol; const pn = A.createStereoPanner ? A.createStereoPanner() : null;
  if (pn) { pn.pan.value = clamp((x - R.x) / 100, -.9, .9); out.connect(pn); pn.connect(SND.master); if (SND.rev) { const w = A.createGain(); w.gain.value = .3 + clamp(d / 420, 0, .5); pn.connect(w); w.connect(SND.rev) } } else out.connect(SND.master); if (BVOICE[kind]) BVOICE[kind](A, out, T) }
