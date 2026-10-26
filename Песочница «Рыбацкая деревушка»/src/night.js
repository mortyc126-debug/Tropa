// =====================================================================================================================
// THE NIGHT'S SMALL LIVES. Moths: at the end of October what flies at night is the winter moths and their like (the fireflies are long over, in July): they come out of the dark to
// the lights, the bulbs over the porches and the lanterns, the lit windows, the campfire, the bike's lamp when it stands still; they come in a zigzag, go round the light in
// loops that tighten and loosen, knock against it, now and then settle on the wall beside it for a while, and fly off into the dark.
// Foxfire: the honey fungus glows a faint green in rotten wood; the specks lie on the wood itself (on the pixels of the log or the stump), not in the air beside it.
// =====================================================================================================================
let MOTHS = [], mothAcc = 0; const MCNT = new Map();
// what a moth is drawn to now: the bulbs, the fire's core, the small window glows (each as bright as its light is), and the bike's lamp when he is nearly still
function mothSpots() { const out = [], cx = CAM.x + W / 2, cy = CAM.y + H / 2;
  for (const S of LIGHTS) { if (Math.abs(S.x - cx) > W * .75 || Math.abs(S.y - cy) > H * .8) continue; const lv = lightLevel(S, LT.dark); if (lv < .25) continue;
    if (S.k === 'lamp' && S.glare) out.push({ k: S, x: S.x, y: S.y, w: lv, kind: 'bulb' }); else if (S.k === 'fire' && S.r <= 14) out.push({ k: S, x: S.x, y: S.y, w: lv * .8, kind: 'fire' }); else if (S.k === 'window' && S.r <= 14) out.push({ k: S, x: S.x, y: S.y, w: lv * .45, kind: 'window' }) }
  if (LT.lamp * LT.dark > .05 && Math.abs(R.v) < 16) out.push({ k: 'bike', x: R.x + Math.sin(R.psi) * 30, y: R.y - 14 - Math.cos(R.psi) * 30, w: .5 * LT.lamp, kind: 'bike' });
  return out }
function stepMoths(dt) { const act = clamp((LT.dark - .3) / .25, 0, 1) * (1 - clamp((WX.rain - .15) / .3, 0, 1)) * (1 - clamp((WIND.s - .45) / .3, 0, 1)) * (1 - .6 * FROST), spots = act > 0 ? mothSpots() : [];
  MCNT.clear(); for (const m of MOTHS) if (m.st !== 'out') MCNT.set(m.k, (MCNT.get(m.k) || 0) + 1); mothAcc = Math.min(3, mothAcc + dt * act * (.5 + spots.length * .22));
  while (mothAcc >= 1 && MOTHS.length < 16 && spots.length) { mothAcc--; let best = null, bs = 0; // (the light with the most room for one more)
    for (const sp of spots) { const room = Math.round(1 + 3 * sp.w) - (MCNT.get(sp.k) || 0); if (room <= 0) continue; const sc = sp.w * (room + Math.random()); if (sc > bs) { bs = sc; best = sp } } if (!best) break;
    const a = Math.random() * TAU, d = 70 + Math.random() * 40; MOTHS.push({ k: best.k, sp: best, x: best.x + Math.cos(a) * d, y: best.y + Math.sin(a) * d * .7, vx: -Math.cos(a) * 20, vy: -Math.sin(a) * 14, st: 'in', t: 0, dur: 4 + Math.random() * 10, r: 4 + Math.random() * 6, ang: 0, dir: Math.random() < .5 ? 1 : -1, ph: Math.random() * 6, zz: Math.random() * 6, c: Math.random() < .55 ? [236, 228, 204] : [220, 206, 176], a: 0, bump: 0 }) }
  const wx = WINDX * WIND.s * 6, wy = WINDY * WIND.s * 4;
  for (const m of MOTHS) { m.t += dt; m.a = Math.min(1, m.a + dt * .7); const live = spots.find(q => q.k === m.k); if (live) m.sp = live;
    if (!live && m.st !== 'out' && m.st !== 'land') { m.st = 'out'; m.t = 0; m.out = Math.random() * TAU } // (the light went out: it goes)
    const sp = m.sp;
    if (m.st === 'in') { // towards the light in a zigzag: it steers, it does not run straight
      const dx = sp.x - m.x, dy = sp.y - m.y, l = Math.hypot(dx, dy) || 1, v0 = 26 + 8 * Math.sin(m.t * 3 + m.ph), nx = -dy / l, ny = dx / l, z = Math.sin(m.zz) * 14 * Math.min(1, l / 40), k = Math.min(1, dt * 3); m.zz += dt * 7;
      m.vx += (dx / l * v0 + nx * z - m.vx) * k; m.vy += (dy / l * v0 + ny * z - m.vy) * k; m.x += (m.vx + wx) * dt; m.y += (m.vy + wy) * dt;
      if (l < m.r + 4) { m.st = 'orbit'; m.t = 0; m.ang = Math.atan2((m.y - sp.y) / .72, m.x - sp.x) } else if (m.t > 12) { m.st = 'out'; m.t = 0; m.out = Math.random() * TAU } }
    else if (m.st === 'orbit') { m.ang += (4.2 + 1.6 * Math.sin(m.t * .9 + m.ph)) * m.dir * Math.sqrt(6 / Math.max(3, m.r)) * dt; if (Math.random() < dt * .35) m.dir = -m.dir; if (m.bump > 0) m.bump -= dt; else if (Math.random() < dt * .5) m.bump = .35; // (now and then it knocks against the lamp)
      const rr = m.bump > 0 ? 1.4 : m.r * (1 + .35 * Math.sin(m.t * 1.7 + m.ph)), tx = sp.x + Math.cos(m.ang) * rr + Math.sin(m.t * 7 + m.ph) * .9, ty = sp.y + Math.sin(m.ang) * rr * .72 + Math.cos(m.t * 5.3 + m.ph) * .8, k = Math.min(1, dt * 9);
      m.x += (tx - m.x) * k + wx * dt; m.y += (ty - m.y) * k + wy * dt;
      if (m.t > m.dur) { if (sp.kind !== 'fire' && sp.kind !== 'bike' && Math.random() < .35) { m.st = 'land'; m.t = 0; m.dur = 3 + Math.random() * 7; m.lx = sp.x + (Math.random() - .5) * 8; m.ly = sp.y + 1 + Math.random() * 5 } else { m.st = 'out'; m.t = 0; m.out = Math.random() * TAU } } }
    else if (m.st === 'land') { const k = Math.min(1, dt * 6); m.x += (m.lx - m.x) * k; m.y += (m.ly - m.y) * k; if (m.t > m.dur || act < .05) { m.st = 'out'; m.t = 0; m.out = Math.random() * TAU } }
    else { const k = Math.min(1, dt * 2); m.vx += (Math.cos(m.out) * 34 - m.vx) * k; m.vy += (Math.sin(m.out) * 22 - m.vy) * k; m.x += m.vx * dt; m.y += m.vy * dt; m.a = Math.max(0, m.a - dt * .5) } }
  MOTHS = MOTHS.filter(m => !(m.st === 'out' && (m.t > 3 || m.a <= 0))) }
// the moths shine in the lamplight: the nearer the light, the brighter; a wing flicker as it flies, still as it sits
function drawMoths() { for (const m of MOTHS) { const x = Math.round(m.x), y = Math.round(m.y), near = m.sp ? clamp(1 - Math.hypot(m.x - m.sp.x, m.y - m.sp.y) / 40, 0, 1) : .5, a = (.4 + .6 * near) * m.a;
    ctx.fillStyle = `rgba(${m.c[0]},${m.c[1]},${m.c[2]},${a.toFixed(2)})`; ctx.fillRect(x, y, 1, 1); ctx.fillStyle = `rgba(${m.c[0]},${m.c[1]},${m.c[2]},${(a * .6).toFixed(2)})`;
    if (m.st === 'land') { if (Math.sin(t * 9 + m.ph * 3) > .8) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1) } }
    else { const f = Math.floor(t * 9 + m.ph) % 3; if (f === 0) { ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1) } else if (f === 1) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1) } else { ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1) } } } }
// ---- foxfire ----
const FOXS = new WeakMap(), isFox = o => (o.t === 'log' || o.t === 'stump' || o.t === 'snag') && (o.seed % 10) < 4;
// the specks on one thing: pixels of its own picture that have wood to the left, right and below (not the rim), a few chosen by its seed; kept as places in the picture
function foxSpots(o) { let L = FOXS.get(o); if (L) return L; L = []; FOXS.set(o, L); const m = o.mask, w = o.mw, h = o.mh; if (!m || !w) return L; const c = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (m[y * w + x] && m[y * w + x - 1] && m[y * w + x + 1] && m[(y + 1) * w + x]) c.push([x, y]);
  const r = mulberry(o.seed + 99); for (let k = 0; k < 9 && c.length; k++) L.push(c.splice(Math.floor(r() * c.length), 1)[0]); return L }
const foxAt = (o, q) => [(o._dx !== undefined ? o._dx : Math.round(o.x - o.ax)) + q[0] + .5, (o._dy !== undefined ? o._dy : Math.round(o.y - o.ay)) + q[1] + .5];
function foxfire(L, dark) { if (dark < .45) return; const a = .16 * clamp((dark - .45) / .3, 0, 1) * (1 + .2 * WET);
  for (const o of VIS) { if (!isFox(o)) continue; const S = foxSpots(o), fl = .8 + .2 * Math.sin(t * .7 + o.seed % 31); for (let k = 0; k < Math.min(3, S.length); k++) { const [px, py] = foxAt(o, S[k]), g = L.createRadialGradient(px, py, 0, px, py, 5);
      g.addColorStop(0, `rgba(120,255,150,${a * fl})`); g.addColorStop(1, 'rgba(120,255,150,0)'); L.fillStyle = g; L.fillRect(px - 5, py - 5, 10, 10) } } }
function drawFoxDots() { if (LT.dark < .45) return; const a = clamp((LT.dark - .45) / .3, 0, 1); for (const o of VIS) { if (!isFox(o)) continue; const S = foxSpots(o);
    for (let k = 0; k < S.length; k++) { if (h2(o.seed, k, 73 + Math.floor(t * .5)) < .3) continue; const [px, py] = foxAt(o, S[k]); ctx.fillStyle = `rgba(150,255,170,${.55 * a})`; ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1) } } }
