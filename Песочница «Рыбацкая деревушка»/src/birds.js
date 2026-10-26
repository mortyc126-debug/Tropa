// =====================================================================================================================
// BIRDS, THE LIFE: the ordinary birds of the end of October, each where it belongs. Sparrows hop about the yards and the crows walk the shore and sit on the roofs and
// the poles; jackdaws gather on the chimneys; tits, a jay or a bullfinch work through the trees at the edge of the forest; flocks of fieldfares and siskins go over the
// glade; mallards swim in the bay; and high up a skein of geese goes south. They live on the ground and in the trees and on the roofs and the water by the
// place they are over (the forest's stand, the village, the shore), sit tight while the rider is far, hop off as he comes and go up all together when he is close.
// By day only: at dusk they leave to roost (the crows in a stream over the sky), in rain and fog there are few. (The gulls are in gulls.js.)
// =====================================================================================================================
const BIRDS = [], BSPR = new Map(), BNODES = new WeakMap(), BTRUNK = new WeakMap(), BLDS = [], BOCC = new Set(), BSKY = [];
let BTEST = false, BFIRST = false, BSPAWNT = 1, BSKYT = 45 + Math.random() * 60, BDUSKT = 5, BZONE = { v: .3, g: .3, s: .1, f: .3, w: .1 }, BZT = 0, BSTART = false, BID = 1, BFID = 1, BCNT = 0;
const BTREE = new Set(['pine', 'spruce', 'birch', 'aspen', 'decid', 'bare', 'rowan', 'oak', 'larch', 'linden', 'maple']);
const BPROP = new Set(['house', 'smokehouse', 'boatshed', 'cowshed', 'haystack', 'bales', 'logpile', 'fishrack', 'netrack', 'boat', 'pole', 'signpost', 'oldcar', 'fence', 'well', 'barrels', 'crates', 'booth']);
const bsprite = (id, pose, flip) => { const key = id + '/' + pose + (flip ? 'L' : 'R'); let r = BSPR.get(key); if (!r) { r = birdArt(BKIND[id], pose, flip); BSPR.set(key, r) } return r };
const bAct = () => clamp(1.25 - LT.dark * 1.7, 0, 1) * (1 - .5 * WX.rain) * (1 - .45 * WX.fog);
const bRand = (a, b) => a + Math.random() * (b - a), bPick = a => a[Math.floor(Math.random() * a.length)];
// the pictures a kind will need, made one a frame in the quiet moments (a new kind arriving with several of them at once would be a hitch)
const BWARM = [];
function bWarmInit() { for (const id in BKIND) { const K = BKIND[id], fl = K.bound ? ['fup', 'fdn', 'fold'] : ['fup', 'fmid', 'fdn']; const poses = K.feet === 'trunk' ? ['cling', 'hammer', 'fup', 'fmid', 'fdn'] : K.feet === 'water' ? ['swim', 'dabble', 'fup', 'fmid', 'fdn'] : K.feet === 'air' ? ['fup', 'fmid', 'fdn'] : K.feet === 'tree' ? ['stand', 'hop'].concat(fl) : ['stand', 'hop', 'peck'].concat(fl);
    for (const po of poses) for (const f of [false, true]) BWARM.push([id, po, f]) } BWARM.reverse() }
function bInit() { BSTART = true; bWarmInit(); for (const o of OBJS) { if (o.kind !== 'prefab') continue; if (o.p === 'house' || o.p === 'smokehouse' || o.p === 'boatshed' || o.p === 'cowshed' || o.p === 'booth') BLDS.push([o.x, o.y - 10, (o.params && o.params.w ? o.params.w / 2 : 22) + 6]) } }
// the ground a bird may stand on
const bGround = (x, y) => matAt(x, y) !== 'lake' && !blocked(x, y, 1.6);
// open water a duck may swim on: lake, a little off the shore, clear of the boats, the piles and the rocks of the shallows
const bWater = (x, y) => { if (matAt(x, y) !== 'lake' || bayDist(x, y) > -12) return false; for (const o of objsIn(x - 8, y - 8, x + 8, y + 8)) if ((o.kind === 'prefab' || o.t === 'rock') && Math.hypot(o.x - x, o.y - y) < 8 + (o.p === 'boat' ? 6 : 0)) return false; return true };
// what is round a point: the village, the shore, the open glade, the forest by its stand, the water
function bctx(x, y) { const m = matAt(x, y), c = { v: 0, g: 0, h: 0, s: 0, w: 0, fb: 0, fs: 0, fm: 0, fh: 0 }; if (m === 'lake') { c.w = 1; return c } if (m === 'bridge') return c;
  let vd = 1e9; for (const b of BLDS) vd = Math.min(vd, Math.hypot(b[0] - x, b[1] - y) - b[2]); c.v = clamp(1 - vd / 70, 0, 1); c.s = clamp(1 - bayDist(x, y) / 45, 0, 1) * .8;
  if (m === 'forest') { const id = standAt(x, y).id; c[id === 'bor' ? 'fb' : id === 'spruce' ? 'fs' : id === 'hazel' ? 'fh' : 'fm'] = 1 } else if (m === 'glade') c.g = 1; else if (m === 'beach') c.g = .3; else c.h = 1; return c }
function bKindAt(c, per) { let tot = 0; const w = []; for (const id in BKIND) { const K = BKIND[id]; let s = 0; for (const k in K.hab) s += K.hab[k] * (c[k] || 0); if (id === 'goose' || id === 'mallardF') s = 0; s /= 1 + 1.6 * ((per && per[id]) || 0) / Math.max(1, K.flock[1]); w.push([id, s]); tot += s } if (tot <= 0) return null; let r = Math.random() * tot; for (const [id, s] of w) { r -= s; if (r <= 0) return id } return null }
// where a bird can sit on a thing: the points along the top edge of its picture where the edge is flat or a peak (found from the object's own mask)
function bPerches(o) { let L = BNODES.get(o); if (L) return L; L = []; BNODES.set(o, L); const m = o.mask, w = o.mw, h = o.mh; if (!m || !w) return L; const top = new Int16Array(w).fill(-1);
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (m[y * w + x]) { top[x] = y; break }
  const tree = BTREE.has(o.t); for (let x = 2; x < w - 2; x++) { const t = top[x]; if (t < 0 || (tree && t > h * .62)) continue; let ok = true, flat = 0; for (let d = -2; d <= 2; d++) { const q = top[x + d]; if (q >= 0 && q < t - 1) ok = false; if (q >= 0 && q <= t + 3) flat++ } if (ok && flat >= 4) L.push([x, t]) }
  return L }
// a free sitting place on some thing near (x, y), of the kind the bird likes: trees or the works of men
function bNodeNear(x, y, r, wantTree, wantProp) { const cand = []; for (const o of objsIn(x - r, y - r, x + r, y + r)) { if (!o.ready || !o.mask) continue; const tree = o.kind === 'gen' && BTREE.has(o.t), prop = o.kind === 'prefab' && BPROP.has(o.p); if (!(tree && wantTree) && !(prop && wantProp)) continue; if (o.p === 'pole' && o.params && o.params.bird) continue; cand.push(o) }
  for (let n = 0; n < 6 && cand.length; n++) { const o = bPick(cand), L = bPerches(o); if (!L.length) continue; const p = bPick(L), ox = Math.round(o.x - o.ax), oy = Math.round(o.y - o.ay), key = (o.id || o.x + ',' + o.y) + ':' + p[0]; if (BOCC.has(key)) continue;
    const px = ox + p[0] + .5, py = oy + p[1]; if (Math.hypot(px - R.x, py - R.y) < 24) continue; return { x: px, y: o.y + .6, z: o.y + .6 - py, key, o } } return null }
// where a bird can cling to a tree: the trunk, found as the rows above the foot where the picture is only a few pixels wide
function bTrunks(o) { let L = BTRUNK.get(o); if (L) return L; L = []; BTRUNK.set(o, L); const m = o.mask, w = o.mw, h = o.mh; if (!m || !w || !BTREE.has(o.t)) return L; const cx = Math.round(o.ax);
  for (let y = Math.round(o.ay) - 7; y > Math.max(2, Math.round(o.ay) - 40); y -= 2) { if (!m[y * w + cx]) continue; let x0 = cx, x1 = cx; while (x0 > 0 && m[y * w + x0 - 1]) x0--; while (x1 < w - 1 && m[y * w + x1 + 1]) x1++; const wd = x1 - x0 + 1; if (wd >= 2 && wd <= 6) L.push([(x0 + x1) / 2 + .5, y, wd / 2]) }
  return L }
function bTrunkNear(x, y, r) { const cand = []; for (const o of objsIn(x - r, y - r, x + r, y + r)) if (o.ready && o.mask && o.kind === 'gen' && BTREE.has(o.t)) cand.push(o);
  for (let n = 0; n < 6 && cand.length; n++) { const o = bPick(cand), L = bTrunks(o); if (!L.length) continue; const p = bPick(L), ox = Math.round(o.x - o.ax), oy = Math.round(o.y - o.ay), key = (o.id || o.x + ',' + o.y) + ':t' + p[1]; if (BOCC.has(key)) continue;
    const px = ox + p[0], py = oy + p[1]; if (Math.hypot(px - R.x, py - R.y) < 26) continue; return { x: px, y: o.y + .6, z: o.y + .6 - py, key, o, cling: 1, hw: p[2], L, ox, oy } } return null }
// the bird takes its place on a trunk: on the side the sprite's body hangs to
function bCling(B, nd) { B.node = nd; B.cling = 1; B.x = nd.x + (B.f > 0 ? -nd.hw : nd.hw); B.y = nd.y; B.z = nd.z }
function bFree(B) { if (B.node) { BOCC.delete(B.node.key); B.node = null } if (B.tnode) { BOCC.delete(B.tnode.key); B.tnode = null } if (B.T && B.T.node) { BOCC.delete(B.T.node.key); B.T.node = null } } // (the place it sits on, and the one it was flying to)
function bMake(id, x, y, z) { const K = BKIND[id], B = { id: BID++, kind: id, K, x, y, z: z || 0, vx: 0, vy: 0, vz: 0, st: 'ground', f: Math.random() < .5 ? 1 : -1, t: bRand(1, 4), ph: Math.random() * 6, spd: bRand(.88, 1.12), pk: 0, hop: 0, call: bRand(3, 14), fl: null, node: null, T: null, delay: 0, zc: bRand(-3, 5), life: bRand(14, 50), hd: Math.random() * 6.28, alert: 0 }; BIRDS.push(B); return B }
// a group of one kind placed by the way of life: on the ground, in the trees (or on the roofs), on the water; `fromAir`: they come flying in from the edge of the zone
function bSpawnGroup(id, x, y, fromAir) { const K = BKIND[id], n = K.flock[0] + Math.floor(Math.random() * (K.flock[1] - K.flock[0] + 1)), F = { id: BFID++, kind: id, members: [], home: { x, y }, t: bRand(20, 60) }, out = [];
  let mode = K.feet; if (mode === 'trunk' && Math.random() < .08) mode = 'tree'; if (mode === 'ground' && bctx(x, y).v > .3 && Math.random() < .55 && id !== 'fieldfare') mode = 'roof'; if (mode === 'tree' && Math.random() < .04) mode = 'ground';
  for (let i = 0; i < n; i++) { let B = null;
    if (mode === 'water') { for (let k = 0; k < 8 && !B; k++) { const a = Math.random() * 6.28, r = Math.random() * 18, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .6; if (bWater(px, py)) { B = bMake(K.mate && i > 0 && Math.random() < (K.matep || .5) ? K.mate : id, px, py, 0); B.st = 'swim'; B.hd = Math.random() * 6.28 } } }
    else if (mode === 'ground') { const sep = { T: 5, M: 7.5, C: 9, D: 12 }[K.cls] || 7, rr = sep * (1.5 + 1.1 * Math.sqrt(n)); for (let k = 0; k < 16 && !B; k++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * rr, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .7; if (out.some(q => Math.hypot(q.x - px, (q.y - py) * 1.4) < sep)) continue; if (bGround(px, py)) { B = bMake(K.mate && Math.random() < (K.matep || .5) ? K.mate : id, px, py, 0); B.st = 'ground' } } }
    else if (mode === 'trunk') { const nd = bTrunkNear(x, y, 70); if (nd) { B = bMake(id, nd.x, nd.y, nd.z); B.st = 'perch'; B.f = Math.random() < .5 ? 1 : -1; bCling(B, nd); BOCC.add(nd.key) } }
    else { const nd = bNodeNear(x, y, 70, mode === 'tree' || mode === 'roof', mode !== 'tree'); if (nd) { B = bMake(K.mate && Math.random() < (K.matep || .5) ? K.mate : id, nd.x, nd.y, nd.z); B.st = 'perch'; B.node = nd; BOCC.add(nd.key) } }
    if (B) { B.fl = F; F.members.push(B); out.push(B) } }
  if (!out.length) return null; if (fromAir) { for (const B of out) { const T = { x: B.x, y: B.y, z: B.z, kind: B.st === 'perch' ? 'node' : B.st === 'swim' ? 'water' : 'ground', node: B.node }, a = Math.random() * 6.28, d = bRand(250, 320);
      B.x = CAM.x + W / 2 + Math.cos(a) * d; B.y = CAM.y + H / 2 + Math.sin(a) * d * .7; B.z = bRand(18, 34); B.T = T; B.arrive = B.st === 'swim' ? 'swim' : B.st; B.st = 'fly'; B.vx = (T.x - B.x) / 7; B.vy = (T.y - B.y) / 7; B.f = B.vx >= 0 ? 1 : -1; B.ft = 1; B.tnode = T.node; B.node = null } }
  return F }
// the whole flock goes up: away from what startled it, then on to a place of its own (a new feeding ground, new trees)
function bFlush(B, from) { const F = B.fl, list = F ? F.members.filter(m => m.st === 'ground' || m.st === 'perch' || m.st === 'swim') : [B]; if (!list.includes(B)) list.push(B); const away = Math.atan2(B.y - from[1], B.x - from[0]), K = B.K;
  const D = (() => { for (let k = 0; k < 10; k++) { const a = away + bRand(-1, 1), d = bRand(70, 170), x = B.x + Math.cos(a) * d, y = B.y + Math.sin(a) * d * .8; if (K.feet === 'water') { if (bWater(x, y)) return { x, y } } else if (bGround(x, y)) return { x, y } } return { x: B.x + Math.cos(away) * 150, y: B.y + Math.sin(away) * 120 } })();
  list.forEach((m, i) => { bFree(m); m.delay = i * bRand(.03, .12); m.was = m.st; m.st = 'up'; m.upT = m.delay; m.from = from; m.D = D; m.zc = bRand(-3, 6); if (K.call && Math.random() < .5) m.call = Math.min(m.call, bRand(.1, .9)) }); if (F) { F.home = D; F.t = bRand(25, 70) } }
function bTakeoff(B) { const K = B.K, D = B.D || { x: B.x + 80, y: B.y }, T = { x: D.x + bRand(-8, 8), y: D.y + bRand(-6, 6), z: 0, kind: 'ground' };
  if (K.feet === 'trunk') { const f = Math.random() < .5 ? 1 : -1, nd = bTrunkNear(D.x, D.y, 80); if (nd) { T.x = nd.x + (f > 0 ? -nd.hw : nd.hw); T.y = nd.y; T.z = nd.z; T.kind = 'node'; T.node = nd; T.f = f; BOCC.add(nd.key) } else { bLeave(B); return } }
  else if (K.feet === 'tree' || (K.feet === 'ground' && Math.random() < .3)) { const nd = bNodeNear(D.x, D.y, 60, K.feet === 'tree' || Math.random() < .5, K.feet !== 'tree'); if (nd) { T.x = nd.x; T.y = nd.y; T.z = nd.z; T.kind = 'node'; T.node = nd; BOCC.add(nd.key) } else if (K.feet === 'tree') { bLeave(B); return } }
  if (K.feet === 'water') { T.kind = 'water'; if (B.was === 'swim') RINGS.push({ x: B.x, y: B.y, t: 0, life: .9 }, { x: B.x + 1, y: B.y, t: -.1, life: .9 }) }
  B.T = T; B.st = 'fly'; const away = Math.atan2(B.y - B.from[1], B.x - B.from[0]); B.vx = Math.cos(away) * 16; B.vy = Math.sin(away) * 10; B.vz = bRand(14, 22); B.f = B.vx >= 0 ? 1 : -1; B.ft = 0; B.arrive = K.feet === 'water' ? 'swim' : T.kind === 'node' ? 'perch' : 'ground'; B.tnode = T.node || null }
function bLeave(B) { const a = Math.random() * 6.28, d = 380; bFree(B); B.T = { x: B.x + Math.cos(a) * d, y: B.y + Math.sin(a) * d * .7, z: 30, kind: 'leave' }; B.st = 'fly'; B.leave = true; B.vx = Math.cos(a) * 20; B.vy = Math.sin(a) * 12; B.vz = 14; B.f = B.vx >= 0 ? 1 : -1; B.arrive = null; if (B.fl) { const i = B.fl.members.indexOf(B); if (i >= 0) B.fl.members.splice(i, 1); B.fl = null } }
function bCall(B) { if (!B.K.call) return; bVoice(B.K.call, B.x, B.y - B.z) }
function stepBirds(dt) { if (!BSTART) bInit(); const act = bAct(), rv = Math.abs(R.v), zx0 = CAM.x - 150, zy0 = CAM.y - 120, zx1 = CAM.x + W + 150, zy1 = CAM.y + H + 150;
  // how many there should be: by what the zone is made of (sampled a few at a time) and by the weather and the light
  BZT -= dt; if (BZT <= 0) { BZT = 2.5; const a = { v: 0, g: 0, s: 0, f: 0, w: 0 }; for (let i = 0; i < 14; i++) { const c = bctx(zx0 + Math.random() * (zx1 - zx0), zy0 + Math.random() * (zy1 - zy0)); a.v += c.v; a.g += c.g * (1 - c.v); a.s += c.s * (1 - c.w); a.f += c.fb + c.fs + c.fm + c.fh; a.w += c.w } for (const k in a) BZONE[k] = a[k] / 14 }
  const inV = (x, y, m) => x > CAM.x - m && x < CAM.x + W + m && y > CAM.y - m && y < CAM.y + H + m, want = Math.round((2 + 14 * BZONE.v + 8 * BZONE.g + 3 * BZONE.s + 5 * BZONE.f + 4 * BZONE.w) * act), wantG = Math.round((1.4 + 3.4 * BZONE.v + 2.4 * BZONE.g + 1.2 * BZONE.s + 1.6 * BZONE.f + 1.4 * BZONE.w) * act);
  BCNT = 0; const per = {}, gv = new Set(); for (const b of BIRDS) { if (b.leave) continue; BCNT++; per[b.kind] = (per[b.kind] || 0) + 1; if (inV(b.x, b.y - b.z, 30)) gv.add(b.fl ? b.fl.id : -b.id) }
  const visG = gv.size, capped = id => (per[id] || 0) >= (BKIND[id].cap || Math.ceil(BKIND[id].flock[1] * 1.2)), pickAt = (x, y) => { const c = bctx(x, y); for (let k = 0; k < 6; k++) { const id = bKindAt(c, per); if (id && !capped(id)) return id } return null };
  if (!BFIRST) { BFIRST = true; if (!BTEST) for (let i = 0; i < wantG && i < 8; i++) { const x = CAM.x + 14 + Math.random() * (W - 28), y = CAM.y + 24 + Math.random() * (H - 40), id = pickAt(x, y); if (id) bSpawnGroup(id, x, y, false) } }
  BSPAWNT -= dt;
  if (BSPAWNT <= 0 && act > .25 && !BTEST) { BSPAWNT = bRand(1, 3);
    if (visG < wantG) { for (let tries = 0; tries < 6; tries++) { const x = CAM.x + 14 + Math.random() * (W - 28), y = CAM.y + 24 + Math.random() * (H - 40), id = pickAt(x, y); if (id && bSpawnGroup(id, x, y, true)) break } }
    else if (BCNT < want) { for (let tries = 0; tries < 6; tries++) { const x = zx0 + Math.random() * (zx1 - zx0), y = zy0 + Math.random() * (zy1 - zy0); if (inV(x, y, 24)) continue; const id = pickAt(x, y); if (id && bSpawnGroup(id, x, y, false)) break } }
    else if (BCNT > want + 3 && act < .6) { const B = BIRDS.find(b => !b.leave && (b.st === 'ground' || b.st === 'perch') && Math.hypot(b.x - R.x, b.y - R.y) > 90); if (B) bLeave(B) } }
  if (act <= 0 && !BTEST) for (const B of BIRDS) if (!B.leave && B.st !== 'fly') if (Math.random() < dt * 1.2) bLeave(B);
  for (let i = BIRDS.length - 1; i >= 0; i--) { const B = BIRDS[i], K = B.K; B.ph += dt * 6; const d = Math.hypot(B.x - R.x, B.y - R.y);
    // far out of the zone: gone
    if (B.x < zx0 - 140 || B.x > zx1 + 140 || B.y < zy0 - 140 || B.y > zy1 + 140 || B.st === 'off') { bFree(B); if (B.fl) { const j = B.fl.members.indexOf(B); if (j >= 0) B.fl.members.splice(j, 1) } BIRDS.splice(i, 1); continue }
    B.call -= dt; if (B.call <= 0) { B.call = bRand(K.call === 'caw' ? 8 : 5, K.call === 'caw' ? 24 : 16); if (B.st !== 'swim' || Math.random() < .5) bCall(B) }
    if (B.st === 'up') { B.upT -= dt; B.alert = 1; if (B.upT <= 0) { bTakeoff(B) } continue }
    if (B.st === 'perch' || B.st === 'ground' || B.st === 'swim') { B.t -= dt; B.life -= dt; const flee = K.flee * (B.st === 'perch' ? .62 : 1) * (.55 + .45 * Math.min(1, rv / 40)); B.alert = d < K.flee * 1.7 ? 1 : 0;
      if (d < flee && K.flee > 0) { bFlush(B, [R.x, R.y]); continue }
      if (B.life <= 0 && B.fl && B.fl.members[0] === B) { bFlush(B, [B.x + bRand(-30, 30), B.y + bRand(-30, 30)]); continue } }
    if (B.st === 'perch' && B.cling) { if (B.hop > 0) B.hop -= dt; if (B.pk > 0) B.pk -= dt; if (B.t <= 0) { B.t = bRand(.5, 1.8); const r = Math.random(), nd = B.node;
        if (r < .55 && nd.L) { const q = bPick(nd.L), key = (nd.o.id || nd.o.x + ',' + nd.o.y) + ':t' + q[1]; if (!BOCC.has(key)) { BOCC.delete(nd.key); const n2 = { x: nd.ox + q[0], y: nd.y, z: nd.o.y + .6 - (nd.oy + q[1]), key, o: nd.o, cling: 1, hw: q[2], L: nd.L, ox: nd.ox, oy: nd.oy }; BOCC.add(key); bCling(B, n2); B.hop = .18 } }
        else if (r < .8 && K.drum) { B.pk = bRand(.5, 1.1); B.t = B.pk + bRand(.4, 1); bVoice('drum', B.x, B.y - B.z) } else if (r < .9) B.f = -B.f, bCling(B, B.node) } }
    else if (B.st === 'perch') { if (B.hop > 0) B.hop -= dt; if (B.t <= 0) { B.t = K.feet === 'tree' ? bRand(.5, 2.2) : bRand(1.2, 5); const r = Math.random(); if (r < .3) B.f = -B.f; else if (r < .45) B.hop = .16; else if (r < (K.feet === 'tree' ? .85 : .5) && K.feet === 'tree') { const nd = bNodeNear(B.x, B.y, 18, true, false); if (nd) { bFree(B); B.node = nd; BOCC.add(nd.key); B.x = nd.x; B.y = nd.y; B.z = nd.z; B.hop = .2 } } } }
    else if (B.st === 'ground') { if (B.pk > 0) B.pk -= dt; if (B.hop > 0) B.hop -= dt;
      if (B.mv) { const sp = (K.cls === 'C' || K.cls === 'M' ? 9 : 13) * dt, dx = B.tx - B.x, dy = B.ty - B.y, l = Math.hypot(dx, dy); if (l < sp) { B.mv = false; B.t = bRand(.5, 2.5) } else { const nx = B.x + dx / l * sp, ny = B.y + dy / l * sp; if (bGround(nx, ny)) { B.x = nx; B.y = ny; B.f = dx >= 0 ? 1 : -1; B.hop = .12 } else { B.mv = false; B.t = .6 } } }
      else if (B.alert) { B.pk = 0; if (B.t <= 0) { B.t = bRand(.6, 1.8); B.f = R.x >= B.x ? 1 : -1 } }
      else if (B.t <= 0) { const r = Math.random(); if (r < .5) { B.pk = bRand(.4, 1); B.t = B.pk + bRand(.1, .8) } else if (r < .85) { const h = B.fl ? B.fl.home : { x: B.x, y: B.y }, a = Math.random() * 6.28, l = bRand(3, 10), tx = h.x + Math.cos(a) * bRand(0, 12), ty = h.y + Math.sin(a) * bRand(0, 9); if (bGround(tx, ty)) { B.tx = tx; B.ty = ty; B.mv = true } else B.t = .5 } else { B.f = -B.f; B.t = bRand(.8, 2.4) } } }
    else if (B.st === 'swim') { B.hd += (Math.sin(t * .3 + B.id) * .5) * dt; const sp = 1.6 + .6 * Math.sin(t * .2 + B.id), nx = B.x + Math.cos(B.hd) * sp * dt, ny = B.y + Math.sin(B.hd) * sp * dt * .6;
      if (bWater(nx, ny)) { B.x = nx; B.y = ny; B.f = Math.cos(B.hd) >= 0 ? 1 : -1 } else B.hd += 2.2 + Math.random();
      if (B.fl && B.fl.members.length > 1) { const c = B.fl.members[0]; if (c !== B) { const dx = c.x - B.x, dy = c.y - B.y, l = Math.hypot(dx, dy); if (l > 16) B.hd += (Math.atan2(dy, dx) - B.hd) * dt * .6 } }
      if (B.pk > 0) B.pk -= dt; else if (B.t <= 0) { B.t = bRand(6, 18); B.pk = Math.random() < .5 ? 1.4 : 0 } }
    else if (B.st === 'fly') { bStepFly(B, dt, d) } }
  stepBirdsSky(dt, act); if (BWARM.length && dt < .04) { const q = BWARM.pop(); bsprite(q[0], q[1], q[2]) } }
function bStepFly(B, dt, d) { const T = B.T, K = B.K, dx = T.x - B.x, dy = T.y - B.y, dist = Math.hypot(dx, dy) || 1; let sp = K.speed * B.spd; B.ft = (B.ft || 0) + dt;
  const near = dist < 28 && T.kind !== 'leave', zt = T.kind === 'leave' ? 30 + B.zc : near ? T.z + 1.2 + Math.max(0, dist - 6) * .2 : Math.min(54, Math.max(T.z + 6, 8 + dist * .1 + B.zc));
  B.vz += ((zt - B.z) * 2.4 - B.vz * 1.7) * dt; B.z = Math.max(0, B.z + B.vz * dt); if (near) sp *= .5 + .5 * dist / 28; if (B.ft < .45) sp *= .55 + B.ft; // (the first moments are a scramble, not yet at speed)
  const k = Math.min(1, dt * 2.6); B.vx += (dx / dist * sp - B.vx) * k; B.vy += (dy / dist * sp - B.vy) * k; B.vy += Math.sin(t * 2.7 + B.id * 1.7) * 5 * dt; B.x += B.vx * dt; B.y += B.vy * dt; if (Math.abs(B.vx) > 2) B.f = B.vx >= 0 ? 1 : -1;
  if (K.bound) B.z += Math.sin(B.ph * 1.5) * .35; if (T.kind === 'leave') { if (Math.abs(B.x - CAM.x - W / 2) > W * .5 + 330 || Math.abs(B.y - CAM.y - H / 2) > H * .5 + 280) B.st = 'off'; return }
  if (dist < 2.4 && B.z <= T.z + 1.8) { B.vx = B.vy = B.vz = 0; B.f = B.arrive === 'swim' ? B.f : B.f; if (T.kind === 'node' && T.node) { const nd = T.node; B.node = nd; BOCC.add(nd.key); B.tnode = null; T.node = null; B.x = T.x; B.y = T.y; B.z = T.z; B.st = 'perch'; B.t = bRand(1, 3); B.cling = nd.cling ? 1 : 0; if (T.f) B.f = T.f } else if (B.arrive === 'swim' || T.kind === 'water') { if (matAt(B.x, B.y) === 'lake') { B.z = 0; B.st = 'swim'; B.t = bRand(2, 8); RINGS.push({ x: B.x, y: B.y, t: 0, life: .9 }) } else B.st = 'ground' } else { B.z = 0; B.st = 'ground'; B.t = bRand(.5, 2) } B.life = bRand(14, 50); B.leave = false; if (T.kind !== 'node') B.cling = 0 } }
// ---- the sky: a skein of geese in a wedge far up; at dusk a long straggling line of crows going to roost ----
function stepBirdsSky(dt, act) { BSKYT -= dt; BDUSKT -= dt; const eve = DAY.h > 14 && LT.dark > .08 && LT.dark < .7 && WX.rain < .4;
  if (BSKYT <= 0 && act > .5) { BSKYT = bRand(110, 260); skySpawn('goose') }
  if (eve && BDUSKT <= 0) { BDUSKT = bRand(14, 34); skySpawn('crow') }
  for (let i = BSKY.length - 1; i >= 0; i--) { const G = BSKY[i]; G.x += G.vx * dt; G.y += G.vy * dt; G.ph += dt; G.call -= dt; if (G.call <= 0) { G.call = bRand(1.4, 3.2); const m = bPick(G.m); bVoice(G.kind === 'goose' ? 'honk' : 'caw', G.x + m[0], G.y + m[1], G.kind === 'goose' ? .55 : .5) }
    if ((G.vx > 0 ? G.x - CAM.x > W + 420 : G.x - CAM.x < -420) || Math.abs(G.y - G.z - CAM.y - H / 2) > H + 300) BSKY.splice(i, 1) } }
function skySpawn(kind) { const goose = kind === 'goose', dirx = goose ? -1 : (Math.random() < .5 ? -1 : 1), sp = goose ? bRand(20, 27) : bRand(42, 54), ang = goose ? bRand(.5, .85) : bRand(-.25, .25), vx = dirx * sp * Math.cos(ang), vy = sp * Math.sin(ang) * (goose ? 1 : bPick([-1, 1])), n = goose ? 7 + Math.floor(Math.random() * 9) : 5 + Math.floor(Math.random() * 9), z = goose ? bRand(120, 160) : bRand(60, 95), m = [];
  const ux = vx / sp, uy = vy / sp, nx = -uy, ny = ux;                                               // along the flight and across it
  for (let i = 0; i < n; i++) { if (goose) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, bk = row * 6.6 + Math.random() * 1.2, sd = side * row * 4.6 + (Math.random() - .5) * 1.2; m.push([-ux * bk + nx * sd, -uy * bk + ny * sd, (Math.random() - .5) * 2]) }
    else { const bk = i * bRand(8, 15), sd = bRand(-12, 12); m.push([-ux * bk + nx * sd, -uy * bk + ny * sd, (Math.random() - .5) * 8]) } }
  const dy0 = CAM.y + H * (goose ? bRand(.04, .3) : bRand(.25, .55)) + z; BSKY.push({ kind, x: CAM.x + W / 2 - dirx * (W / 2 + 260), y: dy0, vx, vy, z, m, ph: Math.random() * 3, call: bRand(.5, 2), id: BID++ }) }
// ---- the pictures ----
function drawBirdShadow(B) { const z = B.z; if (z < 1.5) return; ctx.fillStyle = `rgba(8,14,8,${clamp(.2 - z * .004, .04, .18).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(B.x + z * .22, B.y + .5, Math.max(1.6, (B.K.k || 1) * (B.K.cls === 'C' ? 3.6 : B.K.cls === 'M' ? 3 : 2.2) - z * .03), .9, 0, 0, TAU); ctx.fill() }
function bPose(B) { const K = B.K; if (B.st === 'fly' || B.st === 'up') { if (B.st === 'up') return B.K.cls === 'T' ? 'hop' : 'stand'; const p = (B.ph * (K.bound ? 1.2 : .62)) % 1, ff = K.bound ? (p < .2 ? 'fup' : p < .4 ? 'fdn' : p < .6 ? 'fup' : p < .8 ? 'fdn' : 'fold') : (p < .25 ? 'fup' : p < .5 ? 'fmid' : p < .75 ? 'fdn' : 'fmid'); return B.vz > 2 && !K.bound && B.z < 4 ? 'fup' : ff }
  if (B.st === 'swim') return B.pk > 0 ? 'dabble' : 'swim'; if (B.st === 'perch') return B.cling ? (B.pk > 0 ? 'hammer' : 'cling') : B.hop > 0 ? 'hop' : 'stand'; if (B.pk > 0) return 'peck'; if (B.hop > 0) return 'hop'; return 'stand' }
function drawBird(B) { const S = bsprite(B.kind, bPose(B), B.f < 0), gz = B.z; if (B.st === 'ground' || B.st === 'perch') { if (B.st === 'ground') { ctx.fillStyle = 'rgba(8,14,8,.16)'; ctx.fillRect(Math.round(B.x) - 1, Math.round(B.y), 3, 1) } } else if (B.st === 'swim') { ctx.fillStyle = 'rgba(210,225,232,.16)'; ctx.fillRect(Math.round(B.x) - 4, Math.round(B.y), 8, 1) }
  ctx.drawImage(S.cv, Math.round(B.x) - S.ax, Math.round(B.y - gz) - S.ay) }
// over everything: the birds that are flying, and the geese and the crows high up
function drawBirdsHigh() { for (const B of BIRDS) if ((B.st === 'fly') && B.z >= 2.5 && B.x > CAM.x - 24 && B.x < CAM.x + W + 24 && B.y - B.z > CAM.y - 30 && B.y - B.z < CAM.y + H + 30) drawBird(B);
  for (const G of BSKY) { const goose = G.kind === 'goose', haze = goose ? .78 : .86; ctx.globalAlpha = haze * (1 - .5 * WX.fog); for (const m of G.m) { const x = G.x + m[0], y = G.y + m[1] - G.z + m[2]; if (x < CAM.x - 16 || x > CAM.x + W + 16 || y < CAM.y - 16 || y > CAM.y + H + 16) continue; const p = ((G.ph + m[2] * .13) * (goose ? 1.4 : 2.6)) % 1, pose = p < .25 ? 'fup' : p < .5 ? 'fmid' : p < .75 ? 'fdn' : 'fmid', S = bsprite(goose ? 'goose' : 'crow', pose, G.vx < 0); ctx.drawImage(S.cv, Math.round(x) - S.ax, Math.round(y) - S.ay) } ctx.globalAlpha = 1 } }
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
