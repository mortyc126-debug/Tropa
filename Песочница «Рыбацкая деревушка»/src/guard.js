// =====================================================================================================================
// THE GUARD: an old man in the uniform of the guard firm who stands by the barrier, smokes and looks about.
// His body is a small rig of numbers: the breath, the weight (shifted over one leg), the turn and the nod of the head, how high the right hand is
// with the cigarette, and what the left hand is doing (in the pocket, behind the back, on the belt, at the watch, at the cap, a wave). Each number is cut
// into a few steps, a pose is made from the steps the first time it is needed (a few at a time, so that the frame never stalls) and kept; the day of the guard
// walks the numbers along smooth curves, so every little movement runs through several frames instead of jumping between two pictures.
// =====================================================================================================================
const GST = { br: 3, sh: 2, hy: 4, ar: 8, al: 4 };                                   // the steps of each number
const GKINDS = ['hang', 'pocket', 'back', 'belt', 'watch', 'scratch', 'wave', 'wave2']; // what the left hand can do
const GSIGN = 1;                                                                        // + : a positive turn of the head goes to the clockwise side (bearing grows)
const gkey = g => [g.br, g.sh, g.hy, g.hn, g.ar, g.al, g.alk].join(',');
const gpose = k => { const [br, sh, hy, hn, ar, al, alk] = k.split(',').map(Number); return { br: br / GST.br, sh: sh / GST.sh, hy: hy / GST.hy, hn, ar: ar / GST.ar, al: al / GST.al, alk } };
const gmix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// the left arm's gestures: where the elbow and the hand go at full strength (the arm hangs at zero); s is the side of the arm (-1: the left of the figure)
const GARM = {
  pocket: (s, c) => ({ el: [s * (c.shW + .35), .1, c.shZ - c.H * .2], hd: [s * (c.hipW + .45), -.7, c.hipZ + .9] }),                      // the hand in the jacket's pocket
  back: (s, c) => ({ el: [s * (c.shW - .2), 1.9, c.shZ - c.H * .2], hd: [s * .5, 2.7, c.hipZ + 1.2] }),                                    // behind the back
  belt: (s, c) => ({ el: [s * (c.shW + 1), .3, c.shZ - c.H * .17], hd: [s * (c.hipW + .1), -.3, c.hipZ + 1.5] }),                         // the hand on the belt, the elbow out
  watch: (s, c) => ({ el: [s * (c.shW - .6), -.9, c.shZ - c.H * .2], hd: [s * .3, -c.dep - .9, c.shZ - c.H * .23] }),                      // the wrist before the chest
  scratch: (s, c) => ({ el: [s * (c.shW + .9), -.1, c.shZ + .1], hd: [s * c.r * .95, -.3, c.hz - c.r * .1] }),                            // the hand at the cap
  wave: (s, c) => ({ el: [s * (c.shW + .9), -.4, c.shZ - .4], hd: [s * (c.shW + 1.9), -.9, c.hz - .2] }),                                // the hand raised, out
  wave2: (s, c) => ({ el: [s * (c.shW + .9), -.4, c.shZ - .4], hd: [s * (c.shW + 1.1), -.9, c.hz + .5] })                                 // ... and a little in
};
function guardModel(L, P) { const M = T3(); M.seed = 7; const H = L.h || 17, bd = L.build || 1, skin = SKINS[L.skin || 0], top = L.top || [60, 110, 80], legs = L.legs || [60, 64, 76], boots = L.boots || [52, 44, 40];
  const head = H / 4.5, r = head * .5, legH = H * .42, shZ0 = H - head * 1.05 - .3, hipZ = legH + .2, shW = 2.7 * bd, hipW = 1.95 * bd, dep = 1.35 * bd, hz0 = H - head * .55;
  const bl = P.br * .5, shZ = shZ0 + bl, hz = hz0 + bl, hx = P.sh * .5, lean = -P.sh * .3, nod = Math.max(P.hn, 0), up = Math.max(-P.hn, 0);
  // the legs: the one that carries the weight stands straight, the other rests: the knee forward and a little out
  for (const s of [-1, 1]) { const lo = Math.max(0, -P.sh * s), x = s * hipW * .48, hip = [x + hx, 1, hipZ - lo * .2], knee = [x + hx * .4 + s * lo * .3, 1 - lo * .9, legH * .52 - lo * .1], foot = [x + s * lo * .5, 1 - lo * 1.4, .6];
    t3limb(M, hip, knee, 1.05 * bd, .85, legs); t3limb(M, knee, foot, .85, .65, legs); t3box(M, foot[0] - .75, foot[1] - 1.5, foot[2] - .6, foot[0] + .75, foot[1] + .7, foot[2] + .7, boots, { noAO: true }) }
  // the body: a band of eight sides whose centre may lean as it goes up
  const gband = (z0, z1, hw0, hd0, hw1, hd1, x0, x1, col, o = {}) => { const seg = 8, ctr = [(x0 + x1) / 2, 1, (z0 + z1) / 2], Pt = (z, hw, hd, xo, i) => { const a = i / seg * TAU; return [xo + Math.cos(a) * hw, 1 + Math.sin(a) * hd, z] };
    for (let i = 0; i < seg; i++) t3face(M, [Pt(z0, hw0, hd0, x0, i), Pt(z0, hw0, hd0, x0, i + 1), Pt(z1, hw1, hd1, x1, i + 1), Pt(z1, hw1, hd1, x1, i)], col, ctr, o);
    const tp = [], bt = []; for (let i = 0; i < seg; i++) { tp.push(Pt(z1, hw1, hd1, x1, i)); bt.push(Pt(z0, hw0, hd0, x0, i)) } t3face(M, tp, col, ctr, o); t3face(M, bt, col, ctr, o) };
  const tt = (z0, z1, x0, x1) => { const f = torsoTex(L, z0, z1); return (x, n, z, col) => f(x - (x0 + (x1 - x0) * clamp((z - z0) / (z1 - z0 || 1), 0, 1)), n, z, col) };
  const waistZ = hipZ + (shZ0 - hipZ) * .38, xw = hx * .6 + lean * .2, xs = lean * .9;
  gband(hipZ - .3, waistZ, hipW * 1.06, dep, hipW * .96, dep * .95, hx, xw, top, { clean: true, tex: tt(0, 0, hx, xw) });             // the jacket's skirt, a little wider at the hem (the pressed uniform: no moss on it)
  gband(waistZ, shZ, hipW * .96, dep * .95, shW, dep * (1.05 + .03 * P.br), xw, xs, top, { clean: true, tex: tt(waistZ, shZ, xw, xs) });
  gband(waistZ - .65, waistZ + .1, hipW * 1.01, dep, hipW * 1.01, dep, xw, xw, [18, 18, 20], { clean: true });                          // the belt
  M.dots.push([[xw, 1 - dep - .05, waistZ - .3], [204, 198, 172]]);                                                                     // its buckle
  gband(shZ - .6, shZ + .3, shW * .6, dep * .78, shW * .48, dep * .7, xs, xs, gmix(top, [196, 202, 216], .22), { clean: true });        // the collar
  // the arms
  const c0 = { shW, hipW, dep, shZ, hipZ, H, hz, r }, shj = s => [s * (shW - .15) + xs, 1, shZ - .5];
  { // the right hand holds the cigarette: down by the hip, or up at the mouth; the elbow leads and the hand follows on a small arc
    const e = P.ar, sh = shj(1), dn = { el: [shW + .1 + xs, -.6, shZ - H * .17], hd: [shW + .1 + xs, -1.8, shZ - H * .3] }, uk = { el: [shW - .35 + xs, -dep - .5, shZ - H * .1], hd: [.75 + xs * .5, -dep - .7, hz - head * .3 - nod * .3] };
    const el = gmix(dn.el, uk.el, Math.min(1, e * 1.25)), h0 = gmix(dn.hd, uk.hd, e), arc = Math.sin(e * Math.PI), hd = [h0[0] + arc * .45, h0[1] - arc * .35, h0[2]];
    t3limb(M, sh, el, .7 * bd, .6, top, { clean: true }); t3limb(M, el, hd, .6, .5, top, { clean: true }); t3ball(M, hd, .6, .6, .65, skin, { seg: 6 });
    const cz = hd[2] + .3 - .2 * e, cz2 = hd[2] - .4 + .6 * e, c1 = hd[1] - .3 + .4 * e, c2 = hd[1] - 1.9 - .2 * e;
    t3line(M, [hd[0] - .3, c1, cz], [hd[0] - .35, c2, cz2], [238, 234, 224]); M.dots.push([[hd[0] - .35, c2 - .2, cz2], [236, 110, 40]]) }
  { // the left hand: hanging, or one of its gestures
    const s = -1, kind = GKINDS[P.alk], u = P.al, sh = shj(s), hang = { el: [s * (shW + .05) + xs, 1, shZ - H * .17], hd: [s * (shW + .1) + xs, .8, shZ - H * .33] }, g = kind && GARM[kind] ? GARM[kind](s, c0) : hang;
    const g2 = { el: [g.el[0] + xs, g.el[1], g.el[2]], hd: [g.hd[0] + xs, g.hd[1], g.hd[2]] }, el = gmix(hang.el, g2.el, u), hd = gmix(hang.hd, g2.hd, u);
    t3limb(M, sh, el, .7 * bd, .6, top, { clean: true }); t3limb(M, el, hd, .6, .5, top, { clean: true }); t3ball(M, hd, .6, .6, .65, kind === 'pocket' && u > .6 ? top : skin, { seg: 6 }) }
  // the neck and the head (it turns, nods or lifts its chin), the peaked cap with its band, its badge and its visor
  const hc = [xs * .8 - P.sh * .05, 1.05 - nod * .25 + up * .1, hz - nod * .35 + up * .15], look = P.hy * 2.2;
  t3limb(M, [xs, 1, shZ - .2], [hc[0], 1, shZ + .8], .65, .6, skin);
  headModel(M, Object.assign({}, L, { hat: null }), hc, head, skin, look);
  { const rot = look * .45, cs = Math.cos(rot), sn = Math.sin(rot), fx = (x, n) => [x * cs - n * sn, x * sn + n * cs], hcol = L.hatCol || [28, 34, 48], band = cmul(hcol, .55), badge = [226, 190, 58], cz = hc[2] + .55;
    t3ball(M, [hc[0], hc[1] + .2, cz], r * 1.08, r * 1.08, r * .95, hcol, { from: .5, clean: true, tex: (x, n, z) => { const [a, b] = fx(x - hc[0], n - hc[1] - .2); if (z < cz + .5) return b < -r * .7 && Math.abs(a) < r * .3 ? badge : band; return hcol } });
    const vz = cz + .3, quad = [[-.8, -.9], [.8, -.9], [.66, -1.22], [-.66, -1.22]].map(([a, b]) => { const [x, n] = fx(a * r, b * r); return [hc[0] + x, hc[1] + .2 + n, vz - (b < -1.1 ? .25 : 0)] }); // (a short visor: it must not cover the eyes in the slanting view)
    t3face(M, quad, cmul(hcol, .7), null, { both: true, zb: .15, clean: true }) }
  { const rot = look * .45, a = [0, -r * .95], cs = Math.cos(rot), sn = Math.sin(rot); M.mouth = [hc[0] + a[0] * cs - a[1] * sn, hc[1] + a[0] * sn + a[1] * cs, hc[2] - r * .45] } // (where the smoke comes from: kept in the model's own frame, turned and scaled with the sprite by the caller)
  return M }
function guardMarkMouth(m, dir) { const T = T3(); T.dots.push([m.slice(), [0, 0, 0]]); t3rot(T, dir * 45); t3scale(T, NPC_K); return t3p(T.dots[0][0]) }

// ---- the day of the guard ----
const gease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u), gwrap = a => ((a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
let GBUILD = 0;                                                       // sprites made in this frame (the number is kept low: the rest wait a frame)
const GWARM = [];                                                     // the poses he is likely to need, made one by one in the quiet frames
function guardInit(P) { P.g = { t: Math.random() * 40, brC: 0, sh: 0, shT: 0, shW: 5 + Math.random() * 6, hy: 0, hyT: 0, hq: [], hW: 2 + Math.random() * 3, hTau: .2, hn: 0, hnT: 0, ar: 0, sm: 'low', smT: 3 + Math.random() * 4, smD: 1,
    al: 0, alk: 0, alS: 'idle', alT: 0, alW: 5 + Math.random() * 6, alD: 0, alK: 0, fl: 0, fW: 6 + Math.random() * 6, far: 99, turn: 0, home: P.dir, greet: 0, ash: false, wv: 0 };
  P.wa = 0; P.ba = 0; P.ember = .3 }
function guardWarm(P) { if (!GWARM.length) { for (let b = 0; b <= GST.br; b++) { for (let h = -GST.hy; h <= GST.hy; h++) GWARM.push([b, 0, h, 0, 0, 0, 0]); for (let a = 0; a <= GST.ar; a++) GWARM.push([b, 0, 0, 0, a, 0, 0]); for (let s = -GST.sh; s <= GST.sh; s++) GWARM.push([b, s, 0, 0, 0, 0, 0]);
      for (let k = 1; k < GKINDS.length; k++) for (let l = 1; l <= GST.al; l++) GWARM.push([b, 0, 0, k === 4 ? 1 : 0, 0, l, k]) } GWARM.reverse() }
  if (GBUILD > 0 || !GWARM.length) return; npcSprite(P.look, 'guard', P.dir, GWARM.pop().join(',')); GBUILD++ }
function guardStep(P, dt) { if (!P.g) guardInit(P); const G = P.g; P.st += dt; P.moving = false; G.t += dt;
  const near = Math.abs(P.x - CAM.x - W / 2) < W * .9 && Math.abs(P.y - CAM.y - H / 2) < H * .9;
  // --- the smoke: the cigarette hangs low and wisps; he lifts it, draws, lowers it and breathes the smoke out
  G.smT -= dt; if (G.smT <= 0) { const s = G.sm; if (s === 'low') { G.sm = 'raise'; G.smD = .95 } else if (s === 'raise') { G.sm = 'drag'; G.smD = 1.25 } else if (s === 'drag') { G.sm = 'lower'; G.smD = .9 } else if (s === 'lower') { G.sm = 'exhale'; G.smD = 2.4; G.exs = Math.random() < .5 ? 1 : -1 } else { G.sm = 'low'; G.smD = 6 + Math.random() * 6 } G.smT = G.smD }
  const su = 1 - G.smT / G.smD, sm = G.sm;
  G.ar = sm === 'raise' ? gease(su) : sm === 'drag' ? 1 : sm === 'lower' ? 1 - gease(su) : 0;
  if (sm === 'low') { G.fW -= dt; if (G.fW <= 0 && G.smT > 2.5 && G.fl <= 0) { G.fl = .6; G.fW = 9 + Math.random() * 9; G.ash = false } } // (now and then he taps the ash off)
  if (G.fl > 0) { G.fl -= dt; const fu = 1 - Math.max(0, G.fl) / .6; G.ar = Math.max(G.ar, .25 * Math.sin(fu * Math.PI)); if (fu > .5 && !G.ash) { G.ash = true; G.pashT = true } }
  P.ember = (sm === 'low' ? .3 : sm === 'raise' ? .3 + .25 * su : sm === 'drag' ? .55 + .45 * gease(su) : sm === 'lower' ? 1 - .2 * su : .8 - .5 * su) * (.92 + .08 * Math.sin(P.st * 3.3));
  // --- the breath: slow and even, held in while he draws, let out with the smoke
  const brT = sm === 'drag' ? .35 + .65 * gease(su * 1.4) : sm === 'lower' ? 1 : sm === 'exhale' ? Math.max(0, 1 - su * 1.5) : .5 - .5 * Math.cos(G.t / 4.3 * Math.PI * 2);
  G.brC += (brT - G.brC) * (1 - Math.exp(-dt / .18));
  // --- the weight: now and again he goes over to the other leg
  G.shW -= dt; if (G.shW <= 0) { const o = [-1, 0, 1].filter(v => v !== G.shT); G.shT = o[Math.floor(Math.random() * 2)]; G.shW = 7 + Math.random() * 10 }
  G.sh += (G.shT - G.sh) * (1 - Math.exp(-dt / .45));
  // --- the head: looks about in glances (a quick turn and a pause), follows the rider when he comes near, tips back with the smoke, down at the watch
  const dx = R.x - P.x, dy = R.y - P.y, dist = Math.hypot(dx, dy), rel = gwrap(Math.atan2(dx, -dy) - P.dir * Math.PI / 4), seen = dist < 120 && near && !G.calm, busy = sm === 'raise' || sm === 'drag' || sm === 'lower';
  let hyT, tau;
  if (seen && !G.wasSeen) { G.wLook = true; G.wT = 3 + Math.random() * 3 } G.wasSeen = seen;
  if (seen) { G.far = 0; G.wT -= dt; if (G.wT <= 0) { G.wLook = !G.wLook; G.wT = G.wLook ? 2.5 + Math.random() * 3 : 4 + Math.random() * 5 } // (he looks at the rider for a few seconds, then back to his own things, then at him again)
    if (dist < 55 && G.greet <= 0 && !busy) { if (G.alS === 'idle') { G.greet = 45; G.alS = 'in'; G.alT = .55; G.alK = 6; G.alD = 2.6; G.wv = 0; G.wLook = true; G.wT = 3.5 } else if (G.alS === 'hold' && G.alK <= 3) G.alT = Math.min(G.alT, .01) } } // (a wave for the rider who comes close: whatever the free hand was doing, it first comes back)
  else { G.far += dt; G.greet -= dt; G.turn = 0;
    if (G.far > 4 && P.dir !== G.home) { const d = (G.home - P.dir + 8) % 8 > 4 ? -1 : 1; if (G.far > 4.6) { P.dir = (P.dir + d + 8) % 8; G.hy -= GSIGN * d * .79; G.far = 4 } } } // (the rider is gone: the body goes back to its old place, a step at a time)
  if (seen && G.wLook) { hyT = clamp(GSIGN * rel / 1.0, -1, 1); tau = .17; G.hq.length = 0; G.hW = 2;
    if (Math.abs(rel) > .85) { G.turn += dt; if (G.turn > .7) { const st = rel > 0 ? 1 : -1; P.dir = (P.dir + st + 8) % 8; G.hy -= GSIGN * st * .79; G.turn = 0 } } else G.turn = 0 } // (the body follows the head one step at a time, the head keeps looking)
  else { G.hW -= dt;
    if (!G.hq.length && G.hW <= 0 && !busy && sm !== 'exhale') { const a = (Math.random() < .5 ? -1 : 1) * (.4 + Math.random() * .6), q = Math.random();
      G.hq = q < .4 ? [[a, 1.3 + Math.random() * 1.8, .13], [0, 1, .2]] : q < .65 ? [[a, 1, .13], [-a * .7, 1.3, .13], [0, 1, .2]] : q < .8 ? [[a, 2.5 + Math.random() * 2, .4], [0, 1, .4]] : [[a, .6, .12], [0, .3, .12], [a * .8, .8, .12], [0, 1, .2]]; G.hW = 3 + Math.random() * 7 }
    if (G.hq.length) { const q = G.hq[0]; G.hyT = q[0]; G.hTau = q[2]; q[1] -= dt; if (q[1] <= 0) G.hq.shift() } else { G.hyT = 0; G.hTau = .22 }
    hyT = G.hyT; tau = G.hTau; if (sm === 'exhale') { hyT = G.exs * .5; tau = .3 } else if (busy) { hyT = 0; tau = .25 } }
  G.hy += (hyT - G.hy) * (1 - Math.exp(-dt / tau));
  G.hnT = sm === 'exhale' && su > .05 && su < .7 ? -1 : (G.alS === 'hold' && G.alK === 4 && G.alT > .5 && G.alT < G.alD - .4) ? 1 : 0; G.hn += (G.hnT - G.hn) * (1 - Math.exp(-dt / .2));
  // --- the left hand: from time to time it does something, goes there in half a second, stays, comes back
  G.alT -= dt;
  if (G.alS === 'idle') { G.al = 0; G.alW -= dt; if (G.alW <= 0) { const q = Math.random(), k = q < .28 ? 1 : q < .4 ? 2 : q < .65 ? 3 : q < .8 ? 4 : 5; G.alK = k; G.alD = k === 1 ? 9 + Math.random() * 13 : k === 2 ? 7 + Math.random() * 9 : k === 3 ? 6 + Math.random() * 6 : k === 4 ? 3.6 : 2.6; G.alS = 'in'; G.alT = .55 } }
  else if (G.alS === 'in') { G.alk = G.alK; G.al = gease(1 - G.alT / .55); if (G.alT <= 0) { G.alS = 'hold'; G.alT = G.alD } }
  else if (G.alS === 'hold') { G.al = 1; if (G.alK === 6) { G.wv += dt; G.alk = Math.floor(G.wv * 3.2) % 2 ? 7 : 6 } if (G.alT <= 0) { G.alS = 'out'; G.alT = .55 } }
  else { G.al = 1 - gease(1 - G.alT / .55); if (G.alT <= 0) { G.alS = 'idle'; G.al = 0; G.alk = 0; G.alW = 4 + Math.random() * 9 } }
  // --- the pose: the numbers cut into steps; the picture is made if there is a moment, otherwise the last one stays a frame longer
  const q = { br: Math.round(clamp(G.brC, 0, 1) * GST.br), sh: Math.round(clamp(G.sh, -1, 1) * GST.sh), hy: Math.round(clamp(G.hy, -1, 1) * GST.hy), hn: Math.round(clamp(G.hn, -1, 1)), ar: Math.round(clamp(G.ar, 0, 1) * GST.ar), al: Math.round(clamp(G.al, 0, 1) * GST.al), alk: 0 };
  if (q.al > 0) q.alk = G.alk; const key = gkey(q), id = (P.look.id || '') + 'guard' + P.dir + '/' + key;
  if (!P.gspr || near && (NPC_SPR.has(id) || GBUILD < 2)) { if (!NPC_SPR.has(id)) GBUILD++; P.gspr = npcSprite(P.look, 'guard', P.dir, key) }  // (off the screen nothing new is made)
  if (near) guardWarm(P);
  // --- the ember, the wisp that rises from it, the breath of smoke, the ash that falls
  const S = P.gspr; if (near && S.tip) { P.tx = Math.round(P.x) + S.tip[0]; P.ty = Math.round(P.y) + S.tip[1];
    if (G.ar < .12) { P.wa = (P.wa || 0) + dt * 9; while (P.wa >= 1) { P.wa--; GSM.push({ k: 0, x: P.tx + (Math.random() - .5) * .4, y: P.ty - .5, vx: 0, vy: -(6 + Math.random() * 3), age: 0, life: 3.2 + Math.random() * 1.8, ph: Math.random() * 6.28, a0: .7, c: 0 }) } }
    if (G.pashT) { G.pashT = false; GSM.push({ k: 2, x: P.tx, y: P.ty + .5, vx: (Math.random() - .5) * 2, vy: 2, age: 0, life: .75, ph: 0, a0: .9 }) } }
  if (near && sm === 'exhale' && su > .12 && su < .62 && S.mouth) { P.ba = (P.ba || 0) + dt * 15; const th = P.dir * Math.PI / 4 + GSIGN * G.hy * .99, fx = Math.sin(th), fy = -Math.cos(th);
    while (P.ba >= 1) { P.ba--; const sp = 16 + Math.random() * 9; GSM.push({ k: 1, x: Math.round(P.x) + S.mouth[0] + fx * 2.2, y: Math.round(P.y) + S.mouth[1] + fy * 1.6, vx: fx * sp + (Math.random() - .5) * 3.5, vy: fy * sp * .5 - 3 + (Math.random() - .5) * 3, age: 0, life: 3.2 + Math.random() * 1.6, ph: Math.random() * 6.28, a0: .48, r0: .8 + Math.random() * .5 }) } } else P.ba = 0 }
