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
PF = ''.join(open(os.path.join(HERE, f), encoding='utf-8').read() + '\n' for f in ('pf.js', 'terrain.js', 'water.js', 'extras.js', 'guard.js', 'birds_art.js', 'birds_kinds.js', 'birds.js', 'flora.js', 'night.js', 'gulls.js'))
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
    "if (!scatterOK(S, L, t, x, y)) continue; if (nearPath(x, y, S.clear) || nearObj(x, y, 14)) continue;")

# ---- the ground: a sandy beach, the open water of a bay ----
rep("  else if (mat === 'lake') { // a lake: like the pond, deeper and darker further out, sedge and reeds at the shore",
    "  else if (mat === 'beach') { // a sandy beach: pale dry sand, darker damp sand at the water's edge, stones, ripple marks\n"
    "    const dw = bayDist(x, y);\n"
    "    if (dw < 2.5) c = GW.wetsand[quant(vn(x * .3, y * .3, SEED + 581), x, y, 2)];\n"
    "    else { c = BEACHP[quant(clamp(.3 + fbm(x * .06, y * .06, SEED + 580) * .75 + (vn(x * .25, y * .25, SEED + 582) - .5) * .25, 0, 1), x, y, 5, .7)];\n"
    "      if (dw < 8) c = cmix(c, GW.wetsand[1], clamp(1 - (dw - 2.5) / 5.5, 0, 1) * .75);\n"
    "      else { const st = h2(x, y, SEED + 583); if (st < .01) c = GW.pebble[3]; else if (st < .02) c = GW.pebble[1]; else if (vn(x * .1 + y * .03, y * .55, SEED + 585) > .8) c = cmix(c, BEACHP[0], .3) }\n"
    "      { const clump = clamp((vn(x * .09, y * .12, SEED + 586) - .42) * 3, 0, 1), wr = ssm(5.5, 7.5, dw) * (1 - ssm(9.5, 12, dw)) * clump; if (wr > .05 && h2(x, y, SEED + 587) < wr * .5) { const q = h2(x * 3, y * 5, SEED + 588); c = q < .2 ? [176, 92, 44] : q < .34 ? [196, 148, 58] : q < .5 ? [138, 70, 40] : q < .75 ? [112, 88, 56] : [74, 64, 46] } } // (the wrack: a line of leaves and twigs at the high-water mark)\n } }\n"
    "  else if (mat === 'lake' && L.pal === 'bay') c = bayColor(x, y, bayDist(x, y)); // the bay of a big lake\n"
    "  else if (mat === 'rut' || mat === 'hump') c = rutColor(L, x, y, d); // old wheel tracks, overgrown\n"
    "  else if (mat === 'dam') c = damColor(L, x, y, d); // an embankment across the water\n"
    "  else if (mat === 'lake') { // a lake: like the pond, deeper and darker further out, sedge and reeds at the shore")
rep("    else c = biomeGround('oak', x, y) }", "    else c = biomeGround(S && S.id === 'bor' ? 'bor' : 'oak', x, y) }")
rep("bog: { v: 16, snd: 'grass' }, lake:", "bog: { v: 16, snd: 'grass' }, beach: { v: 31, snd: 'gravel' }, dam: { v: 42, snd: 'gravel' }, rut: { v: 33, snd: 'gravel' }, hump: { v: 27, snd: 'grass' }, lake:")
rep("function layerAt(x, y) { const A = layersNear(x, y); for (let i = 0; i < A.length; i++) { const d = layerD(A[i], x, y); if (d < 0) {", "function layerAt(x, y) { const A = layersNear(x, y); for (let i = 0; i < A.length; i++) { if (SKIPS.length && SKIPS.includes(A[i])) continue; const d = layerD(A[i], x, y); if (d < 0) { if (A[i].mat === 'dam' && damPart(A[i], x, y) === 0) continue;")
rep("const x = L.bb[0] + r() * (L.bb[2] - L.bb[0]), y = L.bb[1] + r() * (L.bb[3] - L.bb[1]), t = wpick(r, S.kinds)", "const BB = S.box ? [...toW(S.box[0], S.box[1]), ...toW(S.box[2], S.box[3])] : L.bb, x = BB[0] + r() * (BB[2] - BB[0]), y = BB[1] + r() * (BB[3] - BB[1]), t = wpick(r, S.kinds)")
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
rep("function drawSmoke() { worldT();", "function drawSmoke() { worldT(); drawGuardSmoke();")
rep("drawFoxDots(); for (const m of MOTHS)", "drawFoxDots(); drawGuardGlow(); for (const m of MOTHS)")
rep("const pose = kind === 'walk' ? { walk: frame / 4 }", "const pose = kind === 'guard' ? gpose(frame) : kind === 'walk' ? { walk: frame / 4 }")
rep("const sp = t3sprite(() => { const M = personModel(look, pose); t3rot(M, dir * 45); t3scale(M, NPC_K); return M }, [0])[0]; r = { cv: sp.s.canvas(), ax: sp.ax, ay: sp.ay, w: sp.s.w, h: sp.s.h };",
    "let MM = null; const sp = t3sprite(() => { const M = (kind === 'guard' ? guardModel : personModel)(look, pose); t3rot(M, dir * 45); t3scale(M, NPC_K); MM = M; return M }, [0])[0]; r = { cv: sp.s.canvas(), ax: sp.ax, ay: sp.ay, w: sp.s.w, h: sp.s.h }; if (kind === 'guard') { const td = MM.dots.find(d => d[1][0] === 236 && d[1][1] === 110 && d[1][2] === 40); if (td) r.tip = t3p(td[0]); r.mouth = guardMarkMouth(MM.mouth, dir) };")
rep("idleT: Math.random() * 3 } });", "idleT: Math.random() * 3, smoker: !!n.smoker, sf: 0, st: Math.random() * 17 } });")
rep("dir: 4, dist: 0,", "dir: n.dir ?? 4, dist: 0,")
rep("function stepNpcs(dt) { for (const P of NPCS) { P.idleT += dt;", "function stepNpcs(dt) { stepGSM(dt); GBUILD = 0; for (const P of NPCS) { P.idleT += dt; if (P.smoker) { guardStep(P, dt); continue }")
rep("function npcSpr(P) { if (P.sit)", "function npcSpr(P) { if (P.smoker) return P.gspr || npcSprite(P.look, 'guard', P.dir, '0,0,0,0,0,0,0'); if (P.sit)")

# ---- the guard's uniform: the firm's patch on the chest (and on the sleeve) ----
rep("  if (L.topKind === 'fleece' && z > z1 - 1.4) return cmul(c, .78);", "  if (L.topKind === 'fleece' && z > z1 - 1.4) return cmul(c, .78);\n  if (L.badge && z1 > 0 && ((z > z1 - 4.4 && z < z1 - 2.8 && x > .6 && x < 2.6) || (z > z1 - 3 && z < z1 - 1.8 && x < -.6 && x > -2.4))) return L.badge; // (the firm's patch and a pocket flap)")

# ---- the night's moths come to the lights and the foxfire sits on the wood (night.js replaces the old ones) ----
NIGHTOLD = open(os.path.join(HERE, 'nightold.txt'), encoding='utf-8').read().rstrip('\n')
rep(NIGHTOLD, "// (the moths and the foxfire: night.js)")
rep("for (const m of MOTHS) { ctx.fillStyle = `rgb(${m.c})`; ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); if (Math.sin(t * 60 + m.ph) > 0) { ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y), 1, 1); ctx.fillRect(Math.round(m.x) + 1, Math.round(m.y), 1, 1) } }", "drawMoths();")

# ---- the black dashes over the canopy are gone: the birds are real ones now (birds.js) ----
FLYOLD = open(os.path.join(HERE, 'flyold.txt'), encoding='utf-8').read().rstrip('\n')
rep(FLYOLD, "// (the birds of the place: birds.js)")
rep("  scrT(); ctx.fillStyle = 'rgba(38,30,28,.9)'; for (const f of FLY) { const x = Math.round(f.x), y = Math.round(f.y), up = Math.sin(f.ph) > 0; ctx.fillRect(x, y, 1, 1);\n    if (up) { ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); ctx.fillRect(x - 2, y - 1, 1, 1); ctx.fillRect(x + 2, y - 1, 1, 1) } else { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x - 2, y + 1, 1, 1); ctx.fillRect(x + 2, y + 1, 1, 1) } } }",
    "  drawBirdsHigh(); }")
# birds in the draw list among the people (the flying ones over everything: drawBirdsHigh)
rep("  for (const P of NPCS.concat(SITS)) if (P.x > cx0 - 20", "  for (const B of BIRDS) if (B.x > cx0 - 20 && B.x < cx0 + W + 20 && B.y - B.z > cy0 - 20 && B.y < cy0 + H + 30) { if ((B.st === 'fly' || B.st === 'flit') && B.z >= 2.5) { list.push([B.y - .2, { bsh: B }]); if (B.z < BHIGH) list.push([B.y + .3, { bird: B }]) } else list.push([B.y + (B.st === 'perch' ? .6 : 0), { bird: B }]) }\n  for (const P of NPCS.concat(SITS)) if (P.x > cx0 - 20")
rep("    if (o && o.cow) { drawCow(o.cow); continue }", "    if (o && o.cow) { drawCow(o.cow); continue }\n    if (o && o.bird) { drawBird(o.bird); continue }\n    if (o && o.bsh) { drawBirdShadow(o.bsh); continue }")

# ---- the gulls: stepped with the rest of the life of the place, drawn among the things by their place on the ground ----
rep("const SITS = []; cowsInit();", "const SITS = []; cowsInit(); gullsInit();")
rep("function stepLife(dt) { stepMoths(dt); stepFlyers(dt); stepRings(dt) }", "function stepLife(dt) { stepMoths(dt); stepRings(dt); stepGulls(dt); stepBirds(dt) }")
rep("  for (const P of NPCS.concat(SITS)) if (P.x > cx0 - 20", "  for (const G of GULLS) if (G.x > cx0 - 20 && G.x < cx0 + W + 20 && G.y - G.z > cy0 - 20 && G.y < cy0 + H + 30) list.push([G.y + (G.st === 'perch' || G.st === 'walk' ? .4 : 0), { gull: G }]);\n  for (const P of NPCS.concat(SITS)) if (P.x > cx0 - 20")
rep("    if (o && o.cow) { drawCow(o.cow); continue }", "    if (o && o.cow) { drawCow(o.cow); continue }\n    if (o && o.gull) { drawGull(o.gull); continue }")

# ---- the forest's low growth (grass, ferns, shrubs...) does not stand on the sand of the beach: only trees, logs, branches and stones do ----
rep("  FMEMO.set(key, c); return c }", "  if (c && !c.tree && BEACHLESS.has(c.t) && matAt(x, y) === 'beach') c = null;\n  FMEMO.set(key, c); return c }")

rep("t = wpick(r, c.S.under); sz = 1 }\n    list.push(addGen(`f${ci}_${cj}`,", "t = wpick(r, c.S.under); sz = 1 }\n    if (BEACHLESS.has(t) && matAt(c.x, c.y) === 'beach') continue; // (a crowded tree turned into low growth: not on the sand)\n    list.push(addGen(`f${ci}_${cj}`,")
rep("if (!nearPath(x2, y2, 14) && !inPlace(x2, y2, 8) && !nearPlaceThing(x2, y2, 10)) list.push(", "if (!nearPath(x2, y2, 14) && !inPlace(x2, y2, 8) && !nearPlaceThing(x2, y2, 10) && matAt(x2, y2) !== 'beach') list.push(")

# ---- a rock standing in the water has no contact shadow on it (it stands in the water) ----
rep("ctx.fillStyle = 'rgba(10,14,8,.2)'; for (const o of VIS) { if (o.flat) continue;", "ctx.fillStyle = 'rgba(10,14,8,.2)'; for (const o of VIS) { if (o.flat || o._wk === 3) continue;")

# ---- boats afloat rock on the water (an object's own offset, set by the water's code) ----
rep("const x = Math.round(o.x - o.ax + (o.kx || 0)), y = Math.round(o.y - o.ay + (o.ky || 0));", "const x = Math.round(o.x - o.ax + (o.kx || 0)), y = Math.round(o.y - o.ay + (o.ky || 0) + (o.wob || 0) - objLift(o));")

# ---- the game clock and the pause, for the debug hooks (a still frame at a given moment of the waves) ----
rep('window.__SB = { WLAY:', 'window.__SB = { get t() { return t }, set t(v) { t = v }, get paused() { return paused }, set paused(v) { paused = v }, NPC_SPR, VIS, standAt, objsIn, get BTEST() { return BTEST }, set BTEST(v) { BTEST = v }, bReset: () => { for (const B of BIRDS) bFree(B); BIRDS.length = 0; BFL.length = 0; BFIRST = false }, get MOTHS() { return MOTHS }, foxSpots, isFox, mothSpots, bVoice, BIRDS, BSKY, BFL, BDBG, BKIND, bMake, BOCC, bsprite, bSpawnGroup, bctx, bKindAt, bFlee, bGo, bPlan, bPerches, bNodeNear, skySpawn, SND, WS, terrH, SLOPE, deckLift, cowSpr, COWS, GULLS, GPERCH, gullCall, get leaves() { return leaves }, layerD, layersNear, bayDist, PLW, WLAY:')

# ---- the prefabs and the place ----
banner = "// =====================================================================================================================\n// PLACE: Турбаза «Студёный ключ» — the start of the game and the player's base."
rep(banner, PF + "\n" + banner)
anchor = "// =====================================================================================================================\n// THE OPEN WORLD:"
rep(anchor, PLACE + "\n\n" + anchor)

os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(s)
print('built', out_dir, len(s), 'bytes')
