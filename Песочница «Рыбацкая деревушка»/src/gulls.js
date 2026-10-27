// =====================================================================================================================
// GULLS: the white birds of the bay. They sit on the pilings, the cleats of the jetty, the boats afloat, the lantern posts and the rocks of the shallows and walk
// about on the wet sand; every so often one is up and circles over the water, and now and then it folds its wings and drops to the surface (a ring spreads).
// Come near and they go up with a cry. By day only: at dusk they leave to roost, in rain and fog there are few.
// =====================================================================================================================
// the end of October: most are the large grey-backed gulls (herring, Caspian), many of them this year's young in their brown plumage, and a few lake gulls that have not left yet
// (the winter plumage: a white head, a red bill and red legs); the lake gulls go in September, the others stay on the open water till the ice
const GPAL = {
  adult: { W: [244, 244, 240], G: [188, 196, 206], B: [150, 160, 178], K: [36, 36, 42], Y: [238, 176, 52], O: [226, 126, 52] },
  juv: { W: [196, 178, 156], G: [138, 118, 98], B: [112, 94, 78], K: [48, 40, 36], Y: [58, 50, 46], O: [200, 140, 126] },
  lake: { W: [248, 248, 246], G: [200, 208, 218], B: [176, 186, 200], K: [40, 40, 48], Y: [206, 58, 48], O: [206, 66, 54] }
};
const GCOL = GPAL.adult;
// (all heading right; the beak is the Y; flipped for the other way)
const GART = {
  fup: ["K...........K", "WK.........KW", ".WW.......WW.", "..GWW.WWWWG..", "...GWWWWWWY..", "....GWWWW....", "............."],
  fmid: [".............", "..K.......K..", "WWWWW...WWWWW", "..GGWWWWWGG..", ".....WWWWWY..", "......WWW....", "............."],
  fdn: [".............", ".............", "....WWWWW....", "..WWGWWWWWY..", ".WWGG.WWW.GG.", "WKG.......GKW", "K...........K"],
  stand: ["......WW..", ".....WWWY.", "BBBBBWWW..", "KBBBWWWWW.", "KWWWWWWWW.", ".WWWWWWW..", "...O..O...", "...O..O..."],
  walk: ["......WW..", ".....WWWY.", "BBBBBWWW..", "KBBBWWWWW.", "KWWWWWWWW.", ".WWWWWWW..", "..O....O..", "..O....O.."],
  peck: ["..........", "..........", "BBBBBWW...", "KBBBWWWW..", "KWWWWWWWW.", ".WWWWWWWWW", "...O..O.WY", "...O..O..."],
};
const GAN = { fup: [6, 4], fmid: [6, 4], fdn: [6, 3], stand: [4, 8], walk: [4, 8], peck: [4, 8] }; // anchors: the body's middle in flight, the feet on a perch
const GSPR = new Map();
function gullSpr(name, flip, gk) { const key = name + (flip ? 'L' : 'R') + (gk || 'adult'); let r = GSPR.get(key); if (r) return r; const PAL = GPAL[gk || 'adult'], art = GART[name], h = art.length, w = art[0].length, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = art[y][x]; if (ch === '.') continue; const c = PAL[ch], xx = flip ? w - 1 - x : x, i = (y * w + xx) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255 }
  g.putImageData(img, 0, 0); r = { cv, w, h, ax: flip ? w - 1 - GAN[name][0] : GAN[name][0], ay: GAN[name][1] }; GSPR.set(key, r); return r }
const GULLS = []; let GPERCH = [], GBEACH = [];
function gullsInit() {
  for (const o of OBJS) { if (o.kind !== 'prefab') continue; const q = o.params || {};
    if (o.p === 'piling') GPERCH.push({ x: o.x + .5, y: o.y, z: (q.h || 16) + 1, g: null });
    else if (o.p === 'bollard' && /^bollard-\d/.test(o.id)) GPERCH.push({ x: o.x, y: o.y, z: PIER.H + 4.8, g: null });
    else if (o.p === 'lantern') GPERCH.push({ x: o.x, y: o.y, z: (q.h || 24) + 7.5, g: null });
    else if (o.p === 'boat' && q.water) GPERCH.push({ x: o.x + (q.flip ? -9 : 9), y: o.y + 1, z: 6.5, g: null, boat: o }) }
  for (const o of OBJS) if (o.t === 'rock' && matAt(o.x, o.y) === 'lake') GPERCH.push({ x: o.x, y: o.y - 1, z: 3.5, g: null });
}
// the sand by the water where they walk: every so many px along the beaches near the village (found when the place is running: it asks what stands where)
function gullsBeach() { for (let x = 20; x < 1260; x += 14) for (let y = 180; y < 300; y += 5) { const [wx, wy] = toW(x, y), d = bayDist(wx, wy); if (d > 4 && d < 20 && matAt(wx, wy) === 'beach' && !blocked(wx, wy, 3)) GBEACH.push([wx, wy]) } }
function gullFree(P) { return !P.g && Math.hypot(R.x - P.x, R.y - P.y) > 40 }
function gullOver(g) { // a point over the water, not far from the gull, to circle round
  for (let k = 0; k < 14; k++) { const a = Math.random() * TAU, r = 40 + Math.random() * 70, x = g.x + Math.cos(a) * r, y = g.y + Math.sin(a) * r * .7; if (bayDist(x, y) < -14 && matAt(x, y) === 'lake') return [x, y] } return [g.x, g.y - 70] }
function gullUp(g, from) { // takes off: a climb, away from what scared it
  if (g.perch) { g.perch.g = null; g.perch = null } if (g.target && g.target.g === g) g.target.g = null; g.target = null; g.st = 'fly'; g.t = 10 + Math.random() * 14; const aw = from ? Math.atan2(g.y - from[1], g.x - from[0]) : Math.random() * TAU; g.vx = Math.cos(aw) * 20; g.vy = Math.sin(aw) * 12; g.vz = 16 + Math.random() * 6; g.gl = false; g.ph = Math.random();
  const [cx, cy] = gullOver(g); g.cx = cx; g.cy = cy; g.rad = 36 + Math.random() * 40; g.ang = Math.atan2(g.y - cy, g.x - cx); g.dir = Math.random() < .5 ? 1 : -1; g.spd = 22 + Math.random() * 10; g.f = g.vx >= 0 ? 1 : -1; g.call = Math.random() < .6 ? .2 : 5 + Math.random() * 10; g.wz = 12 + Math.random() * 8; g.mv = false }
function gullSet(g, P) { g.st = 'perch'; g.perch = P; P.g = g; g.x = P.x; g.y = P.y; g.z = P.z; g.vx = g.vy = g.vz = 0; g.t = 3 + Math.random() * 8; g.pk = 0; g.f = Math.random() < .5 ? 1 : -1 }
function gullsSpawn(n) { for (let i = 0; i < n; i++) { const free = GPERCH.filter(P => !P.g); const q = Math.random(), g = { id: GULLS.length, gk: q < .45 ? 'adult' : q < .8 ? 'juv' : 'lake', x: 0, y: 0, z: 0, st: 'perch', f: 1, t: 0, ph: Math.random(), pk: 0, vx: 0, vy: 0, vz: 0, perch: null, call: 8 };
    if (free.length && Math.random() < .75) gullSet(g, free[Math.floor(Math.random() * free.length)]); else if (GBEACH.length) { const [x, y] = GBEACH[Math.floor(Math.random() * GBEACH.length)]; g.st = 'walk'; g.x = x; g.y = y; g.z = 0; g.t = 2 + Math.random() * 5; g.f = Math.random() < .5 ? 1 : -1; g.mv = false }
    else continue; GULLS.push(g) } }
let GSTART = false;
function gullCall(g) { if (!SND.on || !SND.ctx || !SND.ready || paused) return; const d = Math.hypot(g.x - R.x, g.y - R.y); if (d > 300) return; const A = SND.ctx, T = A.currentTime + .03, n = 2 + (Math.random() * 3 | 0), base = 1500 + Math.random() * 420, vol = .055 / (1 + (d / 110) * (d / 110));
  const out = A.createGain(); out.gain.value = vol; const pn = A.createStereoPanner ? A.createStereoPanner() : null; if (pn) { pn.pan.value = clamp((g.x - R.x) / 90, -.9, .9); out.connect(pn); pn.connect(SND.master); if (SND.rev) { const w = A.createGain(); w.gain.value = .35 + clamp(d / 400, 0, .5); pn.connect(w); w.connect(SND.rev) } } else out.connect(SND.master);
  for (let i = 0; i < n; i++) { const t0 = T + i * (.25 + Math.random() * .06), o = A.createOscillator(), gn = A.createGain(), f = A.createBiquadFilter(), lf = A.createOscillator(), lg = A.createGain(); o.type = 'sawtooth'; lf.frequency.value = 38 + Math.random() * 12; lg.gain.value = 55; lf.connect(lg); lg.connect(o.frequency);
    o.frequency.setValueAtTime(base * (1.05 - .02 * i), t0); o.frequency.linearRampToValueAtTime(base * 1.55, t0 + .075); o.frequency.exponentialRampToValueAtTime(base * (1 - .03 * i), t0 + .23); f.type = 'bandpass'; f.frequency.value = base * 1.9; f.Q.value = 2.4;
    gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(.55 - .08 * i, t0 + .025); gn.gain.exponentialRampToValueAtTime(.001, t0 + .26); o.connect(f); f.connect(gn); gn.connect(out); o.start(t0); lf.start(t0); o.stop(t0 + .3); lf.stop(t0 + .3) } }
function stepGulls(dt) { if (!GPERCH.length && !GBEACH.length) return;
  const act = clamp(1.25 - LT.dark * 1.7, 0, 1) * (1 - .55 * WX.rain) * (1 - .5 * WX.fog), want = Math.round(5 * act);
  if (!GSTART) { GSTART = true; gullsBeach(); gullsSpawn(want) }
  const live = GULLS.filter(g => !g.leave).length; GSPAWNT = (typeof GSPAWNT === 'undefined' ? 0 : GSPAWNT) - dt;
  if (live < want && GSPAWNT <= 0) { GSPAWNT = 2 + Math.random() * 4; gullsSpawn(1); const g = GULLS[GULLS.length - 1]; if (g && Math.random() < .5) { g.x = CAM.x + (Math.random() < .5 ? -30 : W + 30); g.y = CAM.y + Math.random() * H * .6; if (g.perch) { g.perch.g = null; g.perch = null } g.st = 'fly'; gullUp(g, [g.x + (g.x < CAM.x ? -50 : 50), g.y]); g.z = 18; g.vz = 0; const P = GPERCH.find(gullFree); if (P) { g.st = 'land'; g.target = P; P.g = g } } }
  else if (live > want && GULLS.some(g => !g.leave && g.st !== 'off')) { const g = GULLS.find(q => !q.leave && (q.st === 'perch' || q.st === 'walk') && Math.hypot(q.x - R.x, q.y - R.y) > 60) || GULLS.find(q => !q.leave); if (g) { g.leave = true; gullUp(g, null); g.f = g.x >= R.x ? 1 : -1; g.vx = g.f * 20; g.vy = -6; g.t = 99 } }
  // now and then one is up: when none of them is flying, after a while one near the view goes up and circles
  GUPT = (typeof GUPT === 'undefined' ? 6 : GUPT) - dt; const flying = GULLS.filter(g => g.st === 'fly' || g.st === 'dive' || g.st === 'land').length;
  if (GUPT <= 0 && flying < Math.min(1, want)) { GUPT = 14 + Math.random() * 26; const c = GULLS.filter(g => (g.st === 'perch' || g.st === 'walk') && Math.abs(g.x - R.x) < 380 && Math.abs(g.y - R.y) < 260); if (c.length) { const g = c[Math.floor(Math.random() * c.length)]; gullUp(g, null); if (Math.random() < .5) gullCall(g) } }
  const rv = Math.abs(R.v);
  for (const g of GULLS) { g.ph += dt * (g.st === 'perch' || g.st === 'walk' ? 2.4 : g.st === 'land' ? 5 : 3.6);
    if (g.st === 'perch' || g.st === 'walk') { g.t -= dt; const d = Math.hypot(R.x - g.x, R.y - g.y); if (d < (g.st === 'walk' ? 24 : 20) + rv * .7 && !(rv < 1 && d > 11)) { gullUp(g, [R.x, R.y]); if (Math.random() < .55) gullCall(g); continue }
      if (g.pk > 0) g.pk -= dt;
      if (g.st === 'perch') { if (g.t <= 0) { g.t = 3 + Math.random() * 9; const r = Math.random(); if (r < .3) g.f = -g.f; else if (r < .55) g.pk = .7; else if (r < .6) { gullUp(g, null); gullCall(g) } }
        if (g.perch && g.perch.boat) g.z = g.perch.z + (g.perch.boat.wob || 0) * -1 }
      else { // on the sand: stands, pecks, takes a few steps
        if (g.mv) { const sp = 5 * dt, dx = g.tx - g.x, dy = g.ty - g.y, l = Math.hypot(dx, dy); if (l < sp) { g.mv = false; g.t = 2 + Math.random() * 5 } else { const nx = g.x + dx / l * sp, ny = g.y + dy / l * sp; if (!blocked(nx, ny, 2.5)) { g.x = nx; g.y = ny; g.f = dx >= 0 ? 1 : -1 } else { g.mv = false; g.t = 1 } } }
        else if (g.t <= 0) { const r = Math.random(); if (r < .45) { const a = Math.random() * TAU, l = 4 + Math.random() * 9, tx = g.x + Math.cos(a) * l, ty = g.y + Math.sin(a) * l * .6, db = bayDist(tx, ty); if (db > 2 && db < 22 && matAt(tx, ty) === 'beach') { g.tx = tx; g.ty = ty; g.mv = true } else g.t = 1 } else if (r < .8) { g.pk = .8; g.t = 1.4 + Math.random() * 2 } else { g.f = -g.f; g.t = 1.5 + Math.random() * 3 } } } }
    else if (g.st === 'fly' && g.leave) { g.vx += (g.f * 30 - g.vx) * dt * .8; g.vy += (-8 - g.vy) * dt * .5; g.x += g.vx * dt; g.y += g.vy * dt; g.z += (28 - g.z) * dt * .5; if (Math.abs(g.x - R.x) > 520 || Math.abs(g.y - R.y) > 420) g.st = 'off' }
    else if (g.st === 'fly') { g.t -= dt; g.call -= dt; if (g.call <= 0) { gullCall(g); g.call = 7 + Math.random() * 14 }
      // the climb away, then the circle round its centre: a bird in a wind glides more than it flaps
      g.vz += ((g.wz + 5 * Math.sin(t * .7 + g.id) - g.z) * 1.1 - g.vz * 1.4) * dt; g.z = Math.max(0, g.z + g.vz * dt);
      g.cx += WINDX * WIND.s * 6 * dt; g.cy += WINDY * WIND.s * 4 * dt; g.ang += g.dir * g.spd / g.rad * dt; const tx = g.cx + Math.cos(g.ang) * g.rad, ty = g.cy + Math.sin(g.ang) * g.rad * .62, k = Math.min(1, dt * 1.5);
      const nx = g.x + (tx - g.x) * k + g.vx * dt * Math.max(0, 1 - g.t * 0 - .0), ny = g.y + (ty - g.y) * k + g.vy * dt; g.vx *= Math.max(0, 1 - dt * 1.2); g.vy *= Math.max(0, 1 - dt * 1.2); g.f = nx - g.x > .02 ? 1 : nx - g.x < -.02 ? -1 : g.f; g.x = nx; g.y = ny;
      g.gl = Math.sin(t * .45 + g.id * 2.1) > .15 - .5 * WIND.s; // (glides in stretches)
      if (g.t <= 0) { const P = GPERCH.find(gullFree), r = Math.random(); if (P && r < .7) { g.st = 'land'; g.target = P; P.g = g } else if (GBEACH.length) { const [x, y] = GBEACH[Math.floor(Math.random() * GBEACH.length)]; g.st = 'land'; g.target = { x, y, z: 0, sand: true } } else g.t = 10 }
      else if (g.z > 8 && g.z < 30 && Math.random() < dt * .045 && bayDist(g.x, g.y) < -10 && matAt(g.x, g.y) === 'lake' && Math.hypot(g.x - R.x, g.y - R.y) < 260) { g.st = 'dive'; g.vz = -24 } }
    else if (g.st === 'dive') { g.z += g.vz * dt; if (g.z <= 0 && g.vz < 0) { g.z = 0; g.vz = 20; RINGS.push({ x: g.x, y: g.y, t: 0, life: .9 }, { x: g.x + .5, y: g.y, t: -.12, life: .9 }); g.hold = .25 } if (g.hold > 0) { g.hold -= dt; g.vz = 0 } else if (g.z > 10) { g.st = 'fly'; g.vz = 4 } else if (g.vz > 0 || g.z < 10) { if (g.vz === 0) g.vz = 20 }
      g.x += (g.f * 14) * dt; }
    else if (g.st === 'land') { const P = g.target; if (!P || (P.g && P.g !== g)) { g.st = 'fly'; g.t = 8; continue } const dx = P.x - g.x, dy = P.y - g.y, l = Math.hypot(dx, dy), sp = Math.max(8, Math.min(30, l * .9 + 6));
      if (l > .8) { g.x += dx / l * sp * dt; g.y += dy / l * sp * dt; g.f = dx >= 0 ? 1 : -1 } const dz = P.z + Math.min(14, l * .35) - g.z; g.z += clamp(dz, -18 * dt, 18 * dt);
      if (l < 1.2 && Math.abs(g.z - P.z) < 1.2) { if (P.sand) { g.st = 'walk'; g.z = 0; g.t = 1 + Math.random() * 3; g.mv = false; g.pk = 0 } else gullSet(g, P) } } }
  for (let i = GULLS.length - 1; i >= 0; i--) if (GULLS[i].st === 'off') { if (GULLS[i].perch) GULLS[i].perch.g = null; GULLS.splice(i, 1) } }
let GSPAWNT, GUPT;
function drawGull(g) { const flip = g.f < 0, perched = g.st === 'perch', walking = g.st === 'walk';
  let name; if (perched) name = g.pk > 0 ? 'peck' : 'stand'; else if (walking) name = g.pk > 0 ? 'peck' : g.mv ? (Math.floor(g.ph) % 2 ? 'walk' : 'stand') : 'stand';
  else if (g.st === 'dive') name = 'fdn'; else if (g.gl && g.st === 'fly') name = 'fmid'; else { const p = g.ph % 1; name = p < .25 ? 'fup' : p < .5 ? 'fmid' : p < .75 ? 'fdn' : 'fmid' }
  const S = gullSpr(name, flip, g.gk), lift = deckLift(g.x, g.y), gz = g.z; // (the shadow lies on the ground, or on the deck when it is over the jetty)
  if (gz > .5 || perched) { ctx.fillStyle = `rgba(8,16,20,${clamp(.24 - gz * .004, .05, .22).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(g.x + .5 + gz * .25, g.y + .5 - (perched && g.perch && g.perch.z > 10 ? 0 : lift) , Math.max(2, 4 - gz * .05), 1.3, 0, 0, TAU); ctx.fill() }
  ctx.drawImage(S.cv, Math.round(g.x) - S.ax, Math.round(g.y - gz) - S.ay) }
