"""Build the sandbox «Рыбацкая деревушка» from the main game: python3 build.py   (writes ../index.html)
The sandbox's own work is in pf.js (the village's prefabs), water.js (the living water), terrain.js (the lie of the land), extras.js (the booth, the barrier, the cows, the transformer...) and place.js (PLACES.buhta): edit those and build again. Everything else is
the main game (Осенняя тропа (2)/index.html) with the small engine changes listed below.
Takes the main game (Осенняя тропа (2)/index.html), switches it to the one-place sandbox mode, adds the engine bits the village
needs (a sandy beach, the open water of a bay, its waves and surf, the sound of water), and injects pf.js (prefabs), water.js and place.js (PLACES.buhta).
Every replacement must match exactly once (or nothing is written)."""
import os, sys, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'Осенняя тропа (2)', 'index.html')
out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..')

s = open(SRC, encoding='utf-8').read()
PF = ''.join(open(os.path.join(HERE, f), encoding='utf-8').read() + '\n' for f in ('pf.js', 'terrain.js', 'water.js', 'extras.js'))
PLACE = open(os.path.join(HERE, 'place.js'), encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    if c != n:
        sys.exit(f'expected {n} match(es), found {c} for: {old[:100]!r}')
    s = s.replace(old, new)


# ---- the page: a sandbox of one place (no endless trail, no map, no new-forest button) ----
rep('<title>Осенняя тропа</title>', '<title>Песочница «Рыбацкая деревушка»</title>')
rep('aria-label="Осенняя тропа: езда по лесу"', 'aria-label="Песочница: свободная езда по месту карты"')
rep('<canvas id="map" width="96" height="128" aria-label="карта"></canvas>\n', '')
rep('<button id="bSeed" type="button" title="другой лес и другая тропа (турбаза остаётся)">Новый лес</button><button id="bDev" type="button" hidden>Сетка: <b>выкл</b></button>',
    '<button id="bDev" type="button">Сетка: <b>выкл</b></button>')
rep('<div id="loading"><div class="plate" id="loadTxt">Строю лес…</div></div>', '<div id="loading"><div class="plate" id="loadTxt">Строю место…</div></div>')
rep('const GAMEMODE = true;', 'const GAMEMODE = false; // (the sandbox: one fixed forest, the place looks the same every time it is opened)')
rep("const PL = PLACES[(new URLSearchParams(location.search)).get('place') || 'kluchi'] || PLACES.kluchi;",
    "const PL = PLACES[(new URLSearchParams(location.search)).get('place') || 'buhta'] || PLACES.buhta;")

# ---- a place without the endless trail: its own roads, and the forest round it ----
rep("let regT = -9;", "let regT = -9;\n// (a place made with no trail of its own `out`: nothing is laid north of it, the world is the place and the forest round it)")
rep("  const T = PL.trail || {}, out = LAYER[T.out || 'trail-east'], end = out.line[out.line.length - 1], prev = out.line[out.line.length - 2];\n"
    "  // the trail starts some way north of the exit and the road from the exit swings round to meet it\n"
    "  TRLY = end[1] - 260; TRLX = end[0] + 140 - midX(0);\n"
    "  const s0 = trW(midX(0), 0); bendRoad('to-trail', end, [end[0] - prev[0], end[1] - prev[1]], s0, [0, -1], 16);\n",
    "  const T = PL.trail || {}, out = T.out ? LAYER[T.out] : null; NOTRAIL = !out;\n"
    "  if (out) { const end = out.line[out.line.length - 1], prev = out.line[out.line.length - 2];\n"
    "    // the trail starts some way north of the exit and the road from the exit swings round to meet it\n"
    "    TRLY = end[1] - 260; TRLX = end[0] + 140 - midX(0);\n"
    "    const s0 = trW(midX(0), 0); bendRoad('to-trail', end, [end[0] - prev[0], end[1] - prev[1]], s0, [0, -1], 16) }\n")
rep("const TRAIL = { wy: 0", "let NOTRAIL = false; const TRAIL = { wy: 0")
rep("ensureTrail(y0 - 200);", "if (!NOTRAIL) ensureTrail(y0 - 200);")

# ---- scatter: a band along the edge of a layer (reeds in the shallows, stones at the water's edge) ----
rep("if (layerD(L, x, y) > -6 || nearPath(x, y, S.clear) || nearObj(x, y, 14)) continue;",
    "const dL = layerD(L, x, y); if (S.band ? dL < S.band[0] || dL > S.band[1] : dL > -6 || inPond(x, y, 4)) continue; if (nearPath(x, y, S.clear) || nearObj(x, y, 14)) continue;")

# ---- the ground: a sandy beach, the open water of a bay ----
rep("  else if (mat === 'lake') { // a lake: like the pond, deeper and darker further out, sedge and reeds at the shore",
    "  else if (mat === 'beach') { // a sandy beach: pale dry sand, darker damp sand at the water's edge, stones, ripple marks\n"
    "    let dw = 1e9; for (const B of layersNear(x, y)) if (B.mat === 'lake') dw = Math.min(dw, layerD(B, x, y));\n"
    "    if (dw < 2.5) c = GW.wetsand[quant(vn(x * .3, y * .3, SEED + 581), x, y, 2)];\n"
    "    else { c = BEACHP[quant(clamp(.3 + fbm(x * .06, y * .06, SEED + 580) * .75 + (vn(x * .25, y * .25, SEED + 582) - .5) * .25, 0, 1), x, y, 5, .7)];\n"
    "      if (dw < 8) c = cmix(c, GW.wetsand[1], clamp(1 - (dw - 2.5) / 5.5, 0, 1) * .75);\n"
    "      else { const st = h2(x, y, SEED + 583); if (st < .01) c = GW.pebble[3]; else if (st < .02) c = GW.pebble[1]; else if (vn(x * .1 + y * .03, y * .55, SEED + 585) > .8) c = cmix(c, BEACHP[0], .3) }\n"
    "      { const clump = clamp((vn(x * .09, y * .12, SEED + 586) - .42) * 3, 0, 1), wr = ssm(5.5, 7.5, dw) * (1 - ssm(9.5, 12, dw)) * clump; if (wr > .05 && h2(x, y, SEED + 587) < wr * .5) { const q = h2(x * 3, y * 5, SEED + 588); c = q < .2 ? [176, 92, 44] : q < .34 ? [196, 148, 58] : q < .5 ? [138, 70, 40] : q < .75 ? [112, 88, 56] : [74, 64, 46] } } // (the wrack: a line of leaves and twigs at the high-water mark)\n } }\n"
    "  else if (mat === 'lake' && L.pal === 'bay') c = bayColor(x, y, d); // the bay of a big lake\n"
    "  else if (mat === 'rut' || mat === 'hump') c = rutColor(L, x, y, d); // old wheel tracks, overgrown\n"
    "  else if (mat === 'dam') c = damColor(L, x, y, d); // an embankment across the water\n"
    "  else if (mat === 'lake') { // a lake: like the pond, deeper and darker further out, sedge and reeds at the shore")
rep("    else c = biomeGround('oak', x, y) }", "    else c = biomeGround(S && S.id === 'bor' ? 'bor' : 'oak', x, y) }")
rep("bog: { v: 16, snd: 'grass' }, lake:", "bog: { v: 16, snd: 'grass' }, beach: { v: 31, snd: 'gravel' }, dam: { v: 42, snd: 'gravel' }, rut: { v: 33, snd: 'gravel' }, hump: { v: 27, snd: 'grass' }, lake:")
rep("function layerAt(x, y) { const A = layersNear(x, y); for (let i = 0; i < A.length; i++) { const d = layerD(A[i], x, y); if (d < 0) {", "function layerAt(x, y) { const A = layersNear(x, y); for (let i = 0; i < A.length; i++) { if (SKIPS.length && SKIPS.includes(A[i])) continue; const d = layerD(A[i], x, y); if (d < 0) {")
rep("if (l.y >= l.gy) { l.state = 1; l.y = l.gy } }", "if (l.y >= l.gy) { l.state = 1; l.y = l.gy; const mm = matAt(l.x, l.y); if (mm === 'pond') l.life = Math.min(l.life, 3 + Math.random() * 9); else if (mm === 'lake' && leafToWater(l)) l.state = 3; else if (mm === 'beach') l.sh = true } } // (a leaf that lands on the pond soon sinks; on the bay it floats; on the beach a surge may reach it)")
# ---- leaves afloat and leaves on the shore, the drift of them in from the open water ----
rep("    else { l.life -= dt; // lying: a gust or the wheels lift it again", "    else if (l.state === 3) leafAfloat(l, dt);\n    else { l.life -= dt; if (l.sh) leafShore(l, dt); // lying: a gust or the wheels lift it again")
rep("  if (leafAcc > 3) leafAcc = 0;", "  driftLeaves(dt); if (leafAcc > 3) leafAcc = 0;")
rep("ctx.globalAlpha = l.state ? clamp(l.life / 3, 0, 1) : 1;", "ctx.globalAlpha = l.state ? clamp(l.life / 3, 0, 1) * (l.fi === undefined ? 1 : l.fi) : 1;")

# ---- fallen leaves are baked into the ground by material: few on the open water, fewer on the sand and the dam ----
rep("mat === 'pond' ? .05 : mat === 'forest' ? .7 : .34", "mat === 'pond' ? .05 : mat === 'lake' ? 0 : mat === 'beach' ? .1 : mat === 'dam' ? .05 : mat === 'forest' ? .7 : .34")

# ---- glints on the open water, and the sound of it near the shore ----
rep("drawBrooks(cx0, cy0); drawPuddles(cx0, cy0);", "drawBrooks(cx0, cy0); drawWater(cx0, cy0); drawPuddles(cx0, cy0);")
rep("  lvl(SND.stream, .32 * Math.max(prox * prox, Math.min(1.4, fl * fl)), 1.2);",
    "  { let lk = 1e9; for (const L of layersNear(R.x, R.y)) if (L.mat === 'lake') lk = Math.min(lk, layerD(L, R.x, R.y)); const wl = clamp(1 - Math.max(0, lk) / 90, 0, 1) * (.35 + .4 * Math.min(1, WIND.s * 1.5)); // (the water of a big lake lapping, near its shore)\n"
    "    lvl(SND.stream, .32 * Math.max(prox * prox, Math.min(1.4, fl * fl), wl * wl * (.72 + .28 * Math.sin(WS.ph * TAU))), 1.2) }") # (the lapping swells and ebbs with the waves)

# ---- the jetty stands above the ground: kerbs the bike cannot cross, whatever stands on it (the rider, the people, things) drawn lifted ----
rep("  const h = layerAt(x, y), L = h.L, mat = L ? L.mat : PL.base, d = h.d; let c;\n", "  const h = layerAt(x, y), L = h.L, mat = L ? L.mat : PL.base, d = h.d; let c;\n  if (L && L.pier) return pierColor(L, x, y);\n")
rep("function blocked(x, y, rad) { if (inPond(x, y, -7)) return true;", "function blocked(x, y, rad) { if (inPond(x, y, -7) || damWater(x, y)) return true; { const k = deckBlocked(x, y, rad); if (k) return k }")
rep("function drawWorld() {\n  worldT();", "function drawWorld() {\n  RLIFT += (deckLift(R.x, R.y) - RLIFT) * Math.min(1, LASTDT * 14); worldT();")
rep("ctx.drawImage(c, Math.round(R.x) - ROXS, Math.round(R.y) - ROYS); RF.img = c; RF.rx = Math.round(R.x) - ROXS; RF.ry = Math.round(R.y) - ROYS }", "ctx.drawImage(c, Math.round(R.x) - ROXS, Math.round(R.y - RLIFT) - ROYS); RF.img = c; RF.rx = Math.round(R.x) - ROXS; RF.ry = Math.round(R.y - RLIFT) - ROYS }")
rep("ctx.beginPath(); ctx.ellipse(R.x + .5, R.y + .5, 4.8, 2.1, 0, 0, TAU); ctx.fill();", "ctx.beginPath(); ctx.ellipse(R.x + .5, R.y + .5 - RLIFT, 4.8, 2.1, 0, 0, TAU); ctx.fill();")
rep("shCtx.drawImage(s.cv, Math.round(R.x) + s.dx - cx0 + 2, Math.round(R.y) + s.dy - cy0 + 2)", "shCtx.drawImage(s.cv, Math.round(R.x) + s.dx - cx0 + 2, Math.round(R.y - RLIFT) + s.dy - cy0 + 2)")
rep("ctx.beginPath(); ctx.ellipse(P.x + .5, P.y + .5, 3.9, 1.7, 0, 0, TAU); ctx.fill(); ctx.drawImage(S.cv, Math.round(P.x) - S.ax, Math.round(P.y) - S.ay); continue }", "const pl = deckLift(P.x, P.y); ctx.beginPath(); ctx.ellipse(P.x + .5, P.y + .5 - pl, 3.9, 1.7, 0, 0, TAU); ctx.fill(); ctx.drawImage(S.cv, Math.round(P.x) - S.ax, Math.round(P.y - pl) - S.ay); continue }")
rep("ctx.beginPath(); ctx.ellipse(o.x + .5, o.y + .5, rx, ry, 0, 0, TAU); ctx.fill() }", "ctx.beginPath(); ctx.ellipse(o.x + .5, o.y + .5 - objLift(o), rx, ry, 0, 0, TAU); ctx.fill() }")
rep("mat === 'pond' ? .05 : mat === 'lake' ? 0", "mat === 'pond' ? .05 : mat === 'bridge' ? .07 : mat === 'lake' ? 0")

# ---- the bike does not ride onto the water beside the dam; the barrier raises its arm for the rider ----
rep("else if (o.pfr) { const k = flapIdx(o),", "else if (o.pfr) { const k = o.p === 'gate' ? gateIdx(o) : flapIdx(o),")

# ---- the lie of the land: the light on the slopes in the ground, a climb or a descent for the bike ----
rep("const col = groundColor(x0 + c, y0 + r), i = (r * CK + c) * 4;", "const col = groundShade(groundColor(x0 + c, y0 + r), x0 + c, y0 + r), i = (r * CK + c) * 4;", 2)
rep("function stepRider(dt) {\n  const want", "function stepRider(dt) {\n  slopeStep(dt);\n  const want")
rep("vt = want[2] * surf.v * (Math.abs(da) > 1.4 ? .55 : 1);", "vt = want[2] * surf.v * (Math.abs(da) > 1.4 ? .55 : 1) * SLOPE.k;")
rep("R.v += clamp(vt - R.v, -acc * dt, acc * dt);", "R.v += SLOPE.a * dt; R.v += clamp(vt - R.v, -acc * dt, acc * dt);")
rep("nx = R.x + Math.sin(npsi) * ds, ny = R.y - Math.cos(npsi) * ds;", "nx = R.x + Math.sin(npsi) * ds + SLOPE.dx * dt, ny = R.y - Math.cos(npsi) * ds + SLOPE.dy * dt;")
rep("elClock.textContent = clockText() + ' · ' + partOfDay(DAY.h);", "elClock.textContent = clockText() + ' · ' + partOfDay(DAY.h) + slopeText();")

# ---- the cows: in the draw list among the people, moved with them ----
rep("const SITS = []; const dirOf =", "const SITS = []; cowsInit(); const dirOf =")
rep("stepNpcs(dt); stepSparks(dt);", "stepNpcs(dt); stepCows(dt); stepSparks(dt);")
rep("  for (const P of NPCS.concat(SITS)) if (P.x > cx0 - 20", "  for (const C of COWS) if (C.x > cx0 - 30 && C.x < cx0 + W + 30 && C.y > cy0 - 10 && C.y < cy0 + H + 40) list.push([C.y, { cow: C }]);\n  for (const P of NPCS.concat(SITS)) if (P.x > cx0 - 20")
rep("    if (o && o.leaf) { drawLeafK(", "    if (o && o.cow) { drawCow(o.cow); continue }\n    if (o && o.leaf) { drawLeafK(")

# ---- the hum of the transformer: the village's (the camp's kiosk is not here) ----
rep("const K = OBJ.ktp;", "const K = OBJ.ktp || OBJ.mtp;")

# ---- the guard who smokes: a person with a cigarette in his hand, who stands where he is put ----
rep("  for (const [x, y] of SMOKERS) em.push([x, y, 7, .36, 2.6, 'c' + x]);", "  for (const [x, y] of SMOKERS) em.push([x, y, 7, .36, 2.6, 'c' + x]);\n  for (const P of NPCS) if (P.smoker) em.push([P.x + 2, P.y - (P.sf ? 17 : 9), 1.3, .13, .9, 'g' + P.id]);")
rep("  for (const s of [-1, 1]) { const ph = -s * sw, carrying", "  for (const s of [-1, 1]) { if (pose.smoke !== undefined && s > 0) { const up = pose.smoke, sh = [s * (shW - .15), 1, lift(shZ) - .5], el = up ? [s * (shW - .35), -dep - .5, lift(shZ) - H * .1] : [s * (shW + .1), -.6, lift(shZ) - H * .17], hd = up ? [s * .75, -dep - .7, lift(hz) - head * .3] : [s * (shW + .1), -1.8, lift(shZ) - H * .3];\n      t3limb(M, sh, el, .7 * bd, .6, top); t3limb(M, el, hd, .6, .5, top); t3ball(M, hd, .6, .6, .65, skin, { seg: 6 }); const cz = hd[2] + (up ? .1 : .3), cz2 = hd[2] + (up ? .2 : -.4), c1 = hd[1] + (up ? .1 : -.3), c2 = hd[1] - (up ? 2.1 : 1.9); t3line(M, [hd[0] - .3, c1, cz], [hd[0] - .35, c2, cz2], [238, 234, 224]); M.dots.push([[hd[0] - .35, c2 - .2, cz2], [236, 110, 40]]); continue }\n    const ph = -s * sw, carrying")
rep("const pose = kind === 'walk' ? { walk: frame / 4 }", "const pose = kind === 'smoke' ? { smoke: frame } : kind === 'walk' ? { walk: frame / 4 }")
rep("idleT: Math.random() * 3 } });", "idleT: Math.random() * 3, smoker: !!n.smoker, sf: 0, st: Math.random() * 17 } });")
rep("dir: 4, dist: 0,", "dir: n.dir ?? 4, dist: 0,")
rep("function stepNpcs(dt) { for (const P of NPCS) { P.idleT += dt;", "function stepNpcs(dt) { for (const P of NPCS) { P.idleT += dt; if (P.smoker) { guardStep(P, dt); continue }")
rep("function npcSpr(P) { if (P.sit)", "function npcSpr(P) { if (P.smoker) return npcSprite(P.look, 'smoke', P.dir, P.sf); if (P.sit)")

# ---- the guard's uniform: the firm's patch on the chest (and on the sleeve) ----
rep("  if (L.topKind === 'fleece' && z > z1 - 1.4) return cmul(c, .78);", "  if (L.topKind === 'fleece' && z > z1 - 1.4) return cmul(c, .78);\n  if (L.badge && z1 > 0 && ((z > z1 - 4.4 && z < z1 - 2.8 && x > .6 && x < 2.6) || (z > z1 - 3 && z < z1 - 1.8 && x < -.6 && x > -2.4))) return L.badge; // (the firm's patch and a pocket flap)")

# ---- boats afloat rock on the water (an object's own offset, set by the water's code) ----
rep("const x = Math.round(o.x - o.ax + (o.kx || 0)), y = Math.round(o.y - o.ay + (o.ky || 0));", "const x = Math.round(o.x - o.ax + (o.kx || 0)), y = Math.round(o.y - o.ay + (o.ky || 0) + (o.wob || 0) - objLift(o));")

# ---- the game clock and the pause, for the debug hooks (a still frame at a given moment of the waves) ----
rep('window.__SB = { WLAY:', 'window.__SB = { get t() { return t }, set t(v) { t = v }, get paused() { return paused }, set paused(v) { paused = v }, SND, WS, terrH, SLOPE, deckLift, cowSpr, COWS, get leaves() { return leaves }, WLAY:')

# ---- the prefabs and the place ----
banner = "// =====================================================================================================================\n// PLACE: Турбаза «Студёный ключ» — the start of the game and the player's base."
rep(banner, PF + "\n" + banner)
anchor = "// =====================================================================================================================\n// THE OPEN WORLD:"
rep(anchor, PLACE + "\n\n" + anchor)

os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(s)
print('built', out_dir, len(s), 'bytes')
