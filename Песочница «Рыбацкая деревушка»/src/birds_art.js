// =====================================================================================================================
// BIRDS, THE DRAWING: every bird is drawn from a handful of numbers (the body, the head, the tail, the wing) and painted with the colours of its kind,
// at the size of its class: T (tits, sparrows, finches), M (thrushes, jays, jackdaws), C (crows, magpies, pigeons), D (ducks), G (geese, far up).
// A pose is a side view facing right (flipped for the other way): stand, hop, peck (head down), swim, dabble; in flight the wings are spread across the heading
// as the gulls' are: up, level, down, or folded (the finches' bounding flight). The shapes are laid down back to front (tail, far wing, body, near wing, head,
// bill, legs, eye); a pixel is painted when a shape covers half of it.
// =====================================================================================================================
const BSCALE = .8;   // (birds are drawn a little over life size, not as much as their classes' numbers say)
const BCLS = {
  T: { rx: 2.5, ry: 1.7, pitch: 34, hr: 1.45, bill: 1.1, tail: 3.0, tw: 1.5, leg: 1.2, wl: 4.2 },
  M: { rx: 3.3, ry: 2.2, pitch: 30, hr: 1.8, bill: 1.5, tail: 3.6, tw: 1.9, leg: 1.8, wl: 5.6 },
  C: { rx: 4.1, ry: 2.5, pitch: 18, hr: 2.0, bill: 2.3, tail: 4.6, tw: 2.3, leg: 2.3, wl: 7.0 },
  D: { rx: 4.6, ry: 2.3, pitch: 6, hr: 1.7, bill: 2.2, tail: 2.2, tw: 2.0, leg: 1.2, wl: 6.8 },
  G: { rx: 2.6, ry: 1.1, pitch: 0, hr: 0.9, bill: 1.0, tail: 1.3, tw: 1.1, leg: 0, wl: 5.0 }
};
const bmix = (a, b, k) => [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)];
const bdark = (c, k) => [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k)];
function bpaint(buf, w, h, test, colorAt, thr = .5) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let n = 0; for (const sy of [.17, .5, .83]) for (const sx of [.17, .5, .83]) if (test(x + sx, y + sy)) n++; if (n / 9 >= thr) { const c = colorAt(x + .5, y + .5); if (!c) continue; const i = (y * w + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255 } } }
const bell = (cx, cy, rx, ry, rot) => { const c = Math.cos(rot), s = Math.sin(rot); return (x, y) => { const dx = x - cx, dy = y - cy, u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry; return u * u + v * v <= 1 } };
const bpoly = P => (x, y) => { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins } return ins };
const bseg = (x0, y0, x1, y1, wd) => (x, y) => { const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2)), px = x0 + dx * t, py = y0 + dy * t; return Math.hypot(x - px, y - py) <= wd / 2 };
// kind: { cls, k (size), pal: {crown, face, cheek, throat, bib, back, back2, rump, wing, wing2, wbar, breast, belly, tail, bill, leg, eye, spot, crest}, spots, longtail, tailk, billk }
// pose: 'stand' | 'hop' | 'peck' | 'swim' | 'dabble' | 'cling' (up a trunk) | 'hammer' (the head thrown back to strike) | 'fup' | 'fmid' | 'fdn' | 'fold'; flip: facing left
function birdArt(kind, pose, flip) {
  const C = BCLS[kind.cls], k = (kind.k || 1) * (typeof BSCALE === 'number' ? BSCALE : 1), P = kind.pal, rx = C.rx * k, ry = C.ry * k, hr = C.hr * k, bill = C.bill * k * (kind.billk || 1), tail = C.tail * k * (kind.tailk || 1), tw = C.tw * k, leg = C.leg * k, wl = C.wl * k;
  const flying = pose === 'fup' || pose === 'fmid' || pose === 'fdn' || pose === 'fold', water = pose === 'swim' || pose === 'dabble', rad = a => a * Math.PI / 180, long = kind.cls === 'D' || kind.cls === 'G';
  const W = Math.ceil((rx + tail + hr * 2 + bill + (flying ? wl : 0)) * 2 + 8), H = Math.ceil((ry * 2 + leg + hr * 3 + (flying ? wl : 0)) * 1.3 + 8), buf = new Uint8ClampedArray(W * H * 4), ox = Math.floor(W / 2) + .5, oy = H - 3;
  const clingy = pose === 'cling' || pose === 'hammer'; let pitch = rad(C.pitch); if (flying) pitch = 0; if (pose === 'peck') pitch = rad(-20); if (pose === 'swim') pitch = rad(4); if (pose === 'dabble') pitch = rad(-48); if (clingy) pitch = rad(pose === 'hammer' ? 62 : 80);
  const ang = -pitch, ax_ = Math.cos(ang), ay_ = Math.sin(ang), nx = -ay_, ny = ax_;               // the body's axis (tail to head) and its normal (to the belly)
  let bcx = ox, bcy = oy - leg - ry * (pose === 'peck' ? .8 : 1.15) - (pose === 'hop' ? 1.1 : 0); if (clingy) { bcx = ox - ry * .9; bcy = oy - rx * .55 } if (flying) { bcy = oy - Math.ceil(H * .45) } if (water) bcy = oy - ry * .45;
  let hcx = bcx + ax_ * rx * .78 - nx * ry * (long ? .1 : .5), hcy = bcy + ay_ * rx * .78 - ny * ry * (long ? .1 : .5);
  if (pose === 'peck') { hcx = bcx + ax_ * rx * .95 + nx * ry * .1; hcy = bcy + ay_ * rx * .95 + ny * ry * .1 + ry * .55 }
  if (clingy) { hcx = bcx + ax_ * rx * .8 + nx * ry * .1 + (pose === 'hammer' ? -ry * .3 : 0); hcy = bcy + ay_ * rx * .8 + ny * ry * .1 }
  if (pose === 'swim') { hcx = bcx + rx * .8; hcy = bcy - ry * 1.5 } if (pose === 'dabble') { hcx = bcx + rx * 1.0; hcy = bcy + ry * 1.2 }
  if (flying && long) { hcx = bcx + rx * 1.25; hcy = bcy - ry * .15 }
  const rearx = bcx - ax_ * rx * .85, reary = bcy - ay_ * rx * .85, tdir = flying ? Math.PI : pose === 'dabble' ? ang + Math.PI + rad(8) : water ? Math.PI + rad(14) : ang + Math.PI + rad(10);
  const tex = rearx + Math.cos(tdir) * tail * (kind.longtail && !flying ? 1.5 : 1), tey = reary + Math.sin(tdir) * tail * (kind.longtail && !flying ? 1.5 : 1), tnx = -Math.sin(tdir), tny = Math.cos(tdir);
  const tpts = [[rearx + tnx * tw * .3, reary + tny * tw * .3], [tex + tnx * tw * .5, tey + tny * tw * .5], [tex - tnx * tw * .5, tey - tny * tw * .5], [rearx - tnx * tw * .3, reary - tny * tw * .3]];
  const body = bell(bcx, bcy, rx, ry, ang), head = bell(hcx, hcy, hr, hr, 0);
  const wcx = bcx - ax_ * rx * .12 - nx * ry * .28, wcy = bcy - ay_ * rx * .12 - ny * ry * .28, wing = flying ? null : bell(wcx, wcy, rx * .74, ry * .58, ang + rad(6));
  const bodyCol = (x, y) => { const dx = x - bcx, dy = y - bcy, u = (dx * ax_ + dy * ay_) / rx, v = (dx * nx + dy * ny) / ry;   // u: -1 tail .. 1 head; v: -1 back .. 1 belly
    if (u < -.5 && v < .35 && P.rump) return P.rump; if (v < -.3) return P.back; if (u > .3 && v > -.1 && v < .95 && P.bib && !water) return P.bib; if (v > .1) { if (kind.spots && u > -.15 && h2(Math.floor(x * 1.4), Math.floor(y * 1.4), 7) < kind.spots) return P.spot || bdark(P.breast, .6); return u > .05 ? P.breast : (P.belly || P.breast) } return u > .25 ? P.breast : (P.back2 || bmix(P.back, P.breast, .45)) };
  const headCol = (x, y) => { const dx = x - hcx, dy = y - hcy; if (dy < -hr * .3) return P.crown; if (P.cheek && dy > -hr * .2 && dy < hr * .5 && dx < hr * .3) return P.cheek; if (dy > hr * .4) return P.throat || P.face; return P.face };
  const wingCol = (x, y) => { const dx = x - wcx, dyv = y - wcy; if (P.wbar && dyv > -ry * .3 && dyv < ry * .15 && dx > -rx * .1 && dx < rx * .4) return P.wbar; return dx < -rx * .3 ? (P.wing2 || P.wing) : P.wing };
  // legs first (behind the body): two thin lines to the ground
  if (!flying && !water && !clingy && leg > .5) { const lx = Math.floor(bcx + rx * .02) + .5; for (const dx of [0, k > 1.4 ? 2 : 1.4]) bpaint(buf, W, H, bseg(lx + dx, bcy + ry * .5, lx + dx - (pose === 'hop' ? .5 : 0), oy, .9), () => P.leg || [60, 50, 44], .5) }
  // the tail
  bpaint(buf, W, H, bpoly(tpts), () => P.tail, .35);
  // the wings in flight: across the heading from the shoulders, the tips up, level or down
  const wcol = (x, y) => (P.wing2 && Math.abs(x - bcx) > wl * .55 ? P.wing2 : P.wing);
  if (flying && pose !== 'fold') { const sy = bcy - ry * 1.0, wb = Math.max(1.5, ry * .95), up = pose === 'fup', dn = pose === 'fdn';
    for (const s of [-1, 1]) { const tipx = bcx + s * wl * (up ? .74 : dn ? .72 : 1), tipy = sy + (up ? -wl * .78 : dn ? wl * .42 : -wl * .06), rt = bcx + s * rx * .05;
      bpaint(buf, W, H, bpoly([[rt, sy - wb * .5], [rt + s * rx * .7, sy + wb * .9], [tipx, tipy + (dn ? 0 : wb * .15)], [tipx, tipy - wb * .2]]), wcol, .3) } }
  bpaint(buf, W, H, body, bodyCol, .5);
  if (long) { // a neck: from the front of the body to the head
    bpaint(buf, W, H, bseg(bcx + rx * .55, bcy - ry * .15 + (pose === 'dabble' ? ry * .6 : 0), hcx - hr * .3, hcy + hr * .2, Math.max(1.2, hr * 1.1)), (x, y) => (pose === 'swim' || flying) ? P.throat : P.face, .4) }
  if (wing) bpaint(buf, W, H, wing, wingCol, .5);
  if (flying && pose === 'fold') bpaint(buf, W, H, bell(bcx - rx * .1, bcy - ry * .05, rx * .8, ry * .62, 0), wingCol, .5);
  bpaint(buf, W, H, head, headCol, .5);
  if (P.crest) bpaint(buf, W, H, bpoly([[hcx - hr * .2, hcy - hr * .7], [hcx - hr * 1.5, hcy - hr * 1.4], [hcx + hr * .1, hcy]]), () => P.crest, .35);
  // the bill and the eye
  const bd = pose === 'peck' ? rad(62) : pose === 'dabble' ? rad(75) : pose === 'hammer' ? rad(20) : pose === 'cling' ? rad(-6) : rad(8), bx0 = hcx + hr * .5, by0 = hcy + hr * .12;
  bpaint(buf, W, H, bseg(bx0, by0, bx0 + Math.cos(bd) * bill, by0 + Math.sin(bd) * bill, Math.max(.9, hr * .55)), () => P.bill, .3);
  const ex = Math.floor(hcx + hr * .3), ey = Math.floor(hcy - hr * .2); if (hr > 1.2 && ex >= 0 && ey >= 0 && ex < W && ey < H) { const i = (ey * W + ex) * 4; if (buf[i + 3]) { const c = P.eye || [20, 18, 18]; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2] } }
  if (water) { for (let y = Math.round(oy - ry * .05); y < H; y++) for (let x = 0; x < W; x++) buf[(y * W + x) * 4 + 3] = 0 }
  // crop to what was drawn; the feet's place is the anchor
  let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (buf[(y * W + x) * 4 + 3]) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y } if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0 }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), img = g.createImageData(w, h), fx = Math.floor(ox);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const sx = flip ? x1 - x : x0 + x, i = ((y0 + y) * W + sx) * 4, j = (y * w + x) * 4; img.data[j] = buf[i]; img.data[j + 1] = buf[i + 1]; img.data[j + 2] = buf[i + 2]; img.data[j + 3] = buf[i + 3] }
  g.putImageData(img, 0, 0); return { cv, w, h, ax: flip ? x1 - fx : fx - x0, ay: (flying || clingy ? Math.round(bcy) : oy) - y0 }
}
