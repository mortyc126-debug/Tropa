"""Build the sandbox «Рыбацкая деревушка» from the main game: python3 build.py   (writes ../index.html)
The sandbox's own work is in pf.js (the village's prefabs) and place.js (PLACES.buhta): edit those and build again. Everything else is
the main game (Осенняя тропа (2)/index.html) with the small engine changes listed below.
Takes the main game (Осенняя тропа (2)/index.html), switches it to the one-place sandbox mode, adds the engine bits the village
needs (a sandy beach, the open water of a bay, glints, the sound of water), and injects pf.js (prefabs) and place.js (PLACES.buhta).
Every replacement must match exactly once (or nothing is written)."""
import os, sys, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'Осенняя тропа (2)', 'index.html')
out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..')

s = open(SRC, encoding='utf-8').read()
PF = open(os.path.join(HERE, 'pf.js'), encoding='utf-8').read()
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
    "      else { const st = h2(x, y, SEED + 583); if (st < .01) c = GW.pebble[3]; else if (st < .02) c = GW.pebble[1]; else if (vn(x * .1 + y * .03, y * .55, SEED + 585) > .8) c = cmix(c, BEACHP[0], .3) } } }\n"
    "  else if (mat === 'lake' && L.pal === 'bay') c = bayColor(x, y, d); // the bay of a big lake\n"
    "  else if (mat === 'dam') c = damColor(L, x, y, d); // an embankment across the water\n"
    "  else if (mat === 'lake') { // a lake: like the pond, deeper and darker further out, sedge and reeds at the shore")
rep("    else c = biomeGround('oak', x, y) }", "    else c = biomeGround(S && S.id === 'bor' ? 'bor' : 'oak', x, y) }")
rep("bog: { v: 16, snd: 'grass' }, lake:", "bog: { v: 16, snd: 'grass' }, beach: { v: 31, snd: 'gravel' }, dam: { v: 42, snd: 'gravel' }, lake:")
rep("function layerAt(x, y) { const A = layersNear(x, y); for (let i = 0; i < A.length; i++) { const d = layerD(A[i], x, y); if (d < 0) {", "function layerAt(x, y) { const A = layersNear(x, y); for (let i = 0; i < A.length; i++) { if (A[i] === SKIPL) continue; const d = layerD(A[i], x, y); if (d < 0) {")
rep("if (l.y >= l.gy) { l.state = 1; l.y = l.gy } }", "if (l.y >= l.gy) { l.state = 1; l.y = l.gy; const mm = matAt(l.x, l.y); if (mm === 'lake' || mm === 'pond') l.life = Math.min(l.life, 3 + Math.random() * 9) } } // (a leaf that lands on the water soon sinks)")

# ---- fallen leaves are baked into the ground by material: few on the open water, fewer on the sand and the dam ----
rep("mat === 'pond' ? .05 : mat === 'forest' ? .7 : .34", "mat === 'pond' ? .05 : mat === 'lake' ? .02 : mat === 'beach' ? .1 : mat === 'dam' ? .05 : mat === 'forest' ? .7 : .34")

# ---- glints on the open water, and the sound of it near the shore ----
rep("drawBrooks(cx0, cy0); drawPuddles(cx0, cy0);", "drawBrooks(cx0, cy0); drawLakeGlints(cx0, cy0); drawPuddles(cx0, cy0);")
rep("  lvl(SND.stream, .32 * Math.max(prox * prox, Math.min(1.4, fl * fl)), 1.2);",
    "  { let lk = 1e9; for (const L of layersNear(R.x, R.y)) if (L.mat === 'lake') lk = Math.min(lk, layerD(L, R.x, R.y)); const wl = clamp(1 - Math.max(0, lk) / 90, 0, 1) * (.35 + .4 * Math.min(1, WIND.s * 1.5)); // (the water of a big lake lapping, near its shore)\n"
    "    lvl(SND.stream, .32 * Math.max(prox * prox, Math.min(1.4, fl * fl), wl * wl), 1.2) }")

# ---- the prefabs and the place ----
banner = "// =====================================================================================================================\n// PLACE: Турбаза «Студёный ключ» — the start of the game and the player's base."
rep(banner, PF + "\n" + banner)
anchor = "// =====================================================================================================================\n// THE OPEN WORLD:"
rep(anchor, PLACE + "\n\n" + anchor)

os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(s)
print('built', out_dir, len(s), 'bytes')
