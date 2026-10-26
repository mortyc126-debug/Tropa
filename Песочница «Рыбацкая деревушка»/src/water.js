// =====================================================================================================================
// THE LIVING WATER of the bay. The ground under it is baked once (the sand showing through the shallows, the depth); what
// moves is laid over it every frame as a layer of translucent pixels, worked out per pixel from how far the pixel is from the
// shore (the field of each chunk, built once):
//   · ripples: two tiles of noise drifting with the wind at different speeds, and patches of gust, which roughen the water;
//   · the swell: long crests parallel to the shore, running in;
//   · the surf: a crest steepens and breaks into white lace, a sheet of foam runs up the beach, slides back and leaves wet sand;
//   · glints of the sun (or the moon), the colours of dawn and dusk; still water in a calm with only the faint swell and
//     the odd ring of a fish.
// The calmer the wind, the less of all of it: «штиль» is nearly a mirror and the waves only lap.
// =====================================================================================================================
const WSN = new Float32Array(512); for (let i = 0; i < 512; i++) WSN[i] = Math.sin(i / 512 * Math.PI * 2); // (a sine table)
const WNONE = -32768, WS = { ph: 0, x1: 0, y1: 0, x2: 0, y2: 0, gx: 0, gy: 0, tile: null, ov: null, QL: null };
// a tileable noise: value noise on a periodic lattice, summed over octaves [cells across, cells down, weight], stretched to 0..255
function wTile(w, h, oct, seed) { const T = new Float32Array(w * h), sm = u => u * u * (3 - 2 * u); let lo = 9, hi = -9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0, ws = 0;
    for (let k = 0; k < oct.length; k++) { const [gx, gy, wt] = oct[k], u = x / w * gx, q = y / h * gy, ix = Math.floor(u), iy = Math.floor(q), fx = sm(u - ix), fy = sm(q - iy), sd = seed + k * 7,
        a = h2(ix % gx, iy % gy, sd), b = h2((ix + 1) % gx, iy % gy, sd), c = h2(ix % gx, (iy + 1) % gy, sd), d = h2((ix + 1) % gx, (iy + 1) % gy, sd);
      v += (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * wt; ws += wt }
    v /= ws; T[y * w + x] = v; if (v < lo) lo = v; if (v > hi) hi = v }
  const B = new Uint8Array(w * h); for (let i = 0; i < B.length; i++) B[i] = Math.round((T[i] - lo) / (hi - lo) * 255); return B }
function wInit() { WS.tile = { a: wTile(128, 64, [[6, 16, .62], [12, 32, .38]], SEED + 700), b: wTile(128, 64, [[3, 9, .6], [6, 18, .4]], SEED + 720), g: wTile(256, 256, [[5, 5, .65], [10, 10, .35]], SEED + 740) };
  // how far up the beach the water has come, over one wave: it rushes up fast, then slides back, slower at first, then quicker
  WS.QL = new Float32Array(256); for (let i = 0; i < 256; i++) { const u = i / 256; WS.QL[i] = u < .333 ? 0 : u < .42 ? 1 - Math.pow(1 - (u - .333) / .087, 2) : 1 - Math.pow((u - .42) / .58, 1.5) } }
// the field of a chunk: per pixel how far into the water it is (px, ×8; negative: up the beach), and two fixed noises (where along the shore the
// waves arrive earlier or later, and the grain of the lace). Built a few rows at a time, within a little time each frame, like the ground itself:
// far from the shore (a block of 8×8 well inland, or deep in the open water with no jetty or dam about) it costs next to nothing.
const WJOBS = new Map();
function wJob(ci, cj) { const x0 = ci * CK, y0 = cj * CK, M = 44, near = L => !(L.bb[2] < x0 - M || L.bb[0] > x0 + CK + M || L.bb[3] < y0 - M || L.bb[1] > y0 + CK + M);
  const Ls = LAYERS.filter(L => L.mat === 'lake' && L.pal === 'bay' && near(L));
  if (!Ls.length) return { done: true, f: null };
  return { done: false, f: null, x0, y0, Ls, Ds: LAYERS.filter(L => L.mat === 'dam' && near(L)), Bs: LAYERS.filter(L => (L.mat === 'bridge' || L.mat === 'dam') && near(L)), r: 0, any: 0, blk: new Int8Array(CK / 8),
    F: new Int16Array(CK * CK).fill(WNONE), PN: new Uint8Array(CK * CK), ZN: new Uint8Array(CK * CK) } }
function wStep(J, limit) { const { x0, y0, Ls, Ds, Bs, F, PN, ZN, blk } = J;
  while (J.r < CK && performance.now() < limit) { const r = J.r, y = y0 + r;
    if ((r & 7) === 0) for (let b = 0; b < CK / 8; b++) { // what kind of block: 0 far from the water (inland), 1 deep in the open water, 2 anything else
      const cx = x0 + b * 8 + 4, cy = y + 4; let d = 1e9; for (const B of Ls) d = Math.min(d, layerD(B, cx, cy));
      const bx0 = cx - 8, bx1 = cx + 8, by0 = cy - 8, by1 = cy + 8, special = Bs.some(L => !(L.bb[2] < bx0 || L.bb[0] > bx1 || L.bb[3] < by0 || L.bb[1] > by1));
      blk[b] = d > 30 ? 0 : (d < -30 && !special) ? 1 : 2 }
    for (let c = 0; c < CK; c++) { const k = blk[c >> 3]; if (!k) continue; const x = x0 + c, i = r * CK + c; let w;
      if (k === 1) { let d = 1e9; for (const B of Ls) d = Math.min(d, layerD(B, x, y)); w = -d }
      else { const h = layerAt(x, y), top = h.L, isW = top && top.mat === 'lake' && top.pal === 'bay';
        if (isW) w = -h.d; else { let d = 1e9; for (const B of Ls) d = Math.min(d, layerD(B, x, y)); if (d < 0) { w = -1e9; if (!(top && top.mat === 'dam')) continue } else w = -d }
        for (const D of Ds) { const g = damGeom(D, x, y), dd = g.sd < 0 ? g.best - g.rim : layerD(D, x, y); if (top === D) { w = g.sd < 0 ? dd : -1e9 } else if (w > 0 && dd < 1e8) w = Math.min(w, dd) } }
      if (w < -16) continue; F[i] = clamp(Math.round(w * 8), -128, 32000); J.any++;
      PN[i] = Math.floor((vn(x * .016, y * .021, SEED + 760) * .72 + Math.abs(((x + y * .35) / 300) % 2 - 1) * .28) * 255); ZN[i] = Math.floor((h2(x, y, SEED + 761) * .55 + h2(x >> 2, y >> 1, SEED + 762) * .45) * 255) }
    J.r++ }
  if (J.r >= CK) { J.done = true; J.f = J.any ? { x0, y0, F, PN, ZN } : null } }
// (the fields in view and round it are built a little each frame, the nearest first; a little more while the place is just opening)
function wFields(cx0, cy0) { const ci0 = Math.floor(cx0 / CK) - 1, ci1 = Math.floor((cx0 + W) / CK) + 1, cj0 = Math.floor(cy0 / CK) - 1, cj1 = Math.floor((cy0 + H) / CK) + 1, FS = [], todo = [], mx = cx0 + W / 2, my = cy0 + H / 2;
  for (let cj = cj0; cj <= cj1; cj++) for (let ci = ci0; ci <= ci1; ci++) { const key = ci + ',' + cj; let J = WJOBS.get(key); if (!J) { J = wJob(ci, cj); WJOBS.set(key, J) }
    if (J.done) { if (J.f && ci >= ci0 + 1 && ci <= ci1 - 1 && cj >= cj0 + 1 && cj <= cj1 - 1) FS.push(J.f) } else todo.push([Math.hypot(ci * CK + CK / 2 - mx, cj * CK + CK / 2 - my), J]) }
  if (todo.length) { todo.sort((a, b) => a[0] - b[0]); const limit = performance.now() + (t < 4 ? 14 : 3); for (const [, J] of todo) { wStep(J, limit); if (performance.now() >= limit) break } }
  return FS }
const wFrac = u => u - Math.floor(u);
const wHash = (x, y, k) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(k, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 24 }; // (a cheap hash, 0..255)
let WRING = []; // (rings spreading on the water: a fish rising, a fly landing)
function drawWater(cx0, cy0) {
  if (!WS.tile) wInit();
  const FS = wFields(cx0, cy0);
  if (!FS.length) return;
  if (!WS.ov || WS.ov.w !== W || WS.ov.h !== H) { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), img = g.createImageData(W, H); WS.ov = { cv, g, img, buf: new Uint32Array(img.data.buffer), w: W, h: H } }
  const O = WS.ov, buf = O.buf; buf.fill(0);
  // the state of the sea: the wind, and what it makes of the waves
  const dt = LASTDT, wnd = WIND.s, rain = WX.rain, gn = gustNow(), A = clamp(.16 + wnd * 1.2 + rain * .12, .16, 1), lowGfx = typeof GFXLOW !== 'undefined' && GFXLOW;
  const Tw = 8.2 - 4.2 * A, SW = 7.5 + 6 * A, Lw = SW * 3, RU = .9 + 6.2 * Math.pow(A, 1.4) * (.8 + .4 * gn), foamK = clamp((A - .12) * 2.3, 0, 1);
  WS.ph += dt / Tw; const v1 = 4 + 16 * wnd, v2 = 2.5 + 9 * wnd, vg = 6 + 40 * wnd;
  WS.x1 += WINDX * v1 * dt; WS.y1 += WINDY * v1 * .5 * dt; WS.x2 += (WINDX * .5 - WINDY * .8) * v2 * dt; WS.y2 += (WINDY * .5 + WINDX * .8) * v2 * .5 * dt; WS.gx += WINDX * vg * dt; WS.gy += WINDY * vg * .7 * dt;
  const ox1 = Math.floor(WS.x1), oy1 = Math.floor(WS.y1), ox2 = Math.floor(WS.x2), oy2 = Math.floor(WS.y2), gox = Math.floor(WS.gx), goy = Math.floor(WS.gy);
  const TA = WS.tile.a, TB = WS.tile.b, TG = WS.tile.g, QL = WS.QL, tick = Math.floor(t * 3.2);
  // light: sun by day, the moon at night, gold and rose at dawn and dusk
  const sunK = clamp(LT.day * (.45 + .55 * LT.sunUp) * (1 - .7 * WX.cloud) + LT.moon * .3 * (1 - .6 * WX.cloud), 0, 1), rf = clamp(LT.refl * 1.2, 0, .85), HL = cmix([206, 230, 238], [255, 204, 148], rf), FM = cmix([230, 242, 242], [255, 226, 196], rf * .6);
  const pk = (c, a) => ((a * 255 + .5) << 24) | (c[2] << 16) | (c[1] << 8) | c[0], HLc = HL, DKc = [10, 32, 46], SHc = [92, 124, 130], WTc = [44, 36, 28];
  const rough0 = clamp((A - .14) * 1.6, 0, 1.5) * (.7 + .6 * gn);
  for (const f of FS) { const F = f.F, PN = f.PN, ZN = f.ZN, fx0 = f.x0, fy0 = f.y0, xa = Math.max(cx0, fx0), xb = Math.min(cx0 + W, fx0 + CK), ya = Math.max(cy0, fy0), yb = Math.min(cy0 + H, fy0 + CK);
    for (let y = ya; y < yb; y++) { const row = (y - fy0) * CK - fx0, orow = (y - cy0) * W - cx0;
      for (let x = xa; x < xb; x++) { const k = row + x, v = F[k]; if (v === WNONE) continue;
        const dw = v * .125, z = ZN[k] * .003922, u = wFrac(WS.ph + PN[k] * .003922 * .55); let col = 0;
        // where the water's edge is now on the beach, and how far into the water this pixel is from it
        const q = QL[(u * 255) | 0], r = dw + RU * q;
        if (r <= 0) { // dry or wet sand above the edge: the damp left where the water has been
          const wet = dw + RU * 1.05 + .5 + (z - .5) * 1.6; if (wet > 0) col = pk(WTc, Math.min(.26, wet * .13)) }
        else {
          const LF = .7 + A * .5 + (.5 + .8 * A) * q, act = .3 + .7 * q;
          if (r < LF) { if (z < .9) col = pk(FM, (.45 + .45 * act) * (1 - .25 * z)) } // the front of the water running up the sand
          else if (dw < 0 || (q > .02 && r < LF + 3 + 2.5 * A)) { const e = 1 - (r - LF) / (3 + 2.5 * A); if (dw < 0 ? true : z < (.18 + .5 * e * e) * act) col = dw < 0 ? (z < (.34 * e + .05) * act ? pk(FM, (.4 * e + .15) * act) : pk(SHc, .26 * act)) : pk(FM, (.45 * e + .1) * act) } // the lace behind it / a thin sheet over the sand
          if (!col && dw < SW + 7) { // the crest, steepening and breaking, the white wash behind it, the foam left on the shallows
            const pc = SW - Lw * u, dc = dw - pc;
            if (foamK > 0 && pc > -1 && dc < 1.5 && dc > -(2.2 + 3.2 * A)) { const tr = 2.2 + 3.2 * A, ka = dc > 0 ? 1 - dc / 1.5 : (1 - -dc / tr) * .75; if (z < ka * 1.05 + .06) col = pk(FM, ka * .9 * foamK + .1) }
            else if (foamK > 0 && u > .333) { const fr = 1 - (u - .333) / .667, lim = 3.5 + 2 * A; if (dw < lim) { const a = .5 * fr * fr * (1 - dw / lim); if (z < a * 1.4) col = pk(FM, a * foamK + .08) } } }
          if (!col && !lowGfx && dw > SW - 1 && dw < 150) { // the swell: a bright thread on each crest, the trough behind it a little darker
            const cp = (dw - SW) / Lw + u, ff = (cp - Math.floor(cp + .5)) * Lw, af = Math.abs(ff), att = (1 - dw / 150) * (1 - dw / 150) * (.35 + .65 * A);
            const gi = (((y - goy) & 255) << 8) | ((x - gox) & 255), gg = TG[gi] * .003922, br = clamp((gg - .25) * 2.2, 0, 1);
            if (af < 1.5) { const a = (1 - af / 1.5) * .55 * att * (.2 + .8 * br); if (a > .02) col = pk(HLc, a * sunK + .03); if (A > .5 && br > .45 && z < (A - .45) * .9 * br && dw < 110) col = pk(FM, .55 + .3 * z) }
            else if (ff > 1.6 && ff < 7.5) { const a = .34 * att * (.2 + .8 * br) * (1 - (ff - 1.6) / 6); if (a > .03) col = pk(DKc, a) } }
          if (!col && !lowGfx && dw > 2.5) { // the ripples
            const gi = (((y - goy) & 255) << 8) | ((x - gox) & 255), gg = TG[gi] * .003922, rg = clamp(rough0 * (.2 + 1.3 * gg * gg) + rain * .25, 0, 1.4),
              s = (TA[(((y - oy1) & 63) << 7) | ((x - ox1) & 127)] * .55 + TB[(((y - oy2) & 63) << 7) | ((x - ox2) & 127)] * .45 - 128) * .0078 * (.1 + 2 * rg);
            if (s > .34) { col = pk(HLc, (.27 + .25 * (s - .34)) * (.78 + .22 * WSN[((tick + (gg * 40 | 0)) & 7) << 6]) * sunK + .04); if (rg > .2 && sunK > .25 && wHash(x, y, tick) < 22 * rg) col = pk([255, 255, 250], .9 * sunK) }
            else if (s > .2) col = pk(HLc, .1 * sunK + .02); else if (s < -.42) col = pk(DKc, .28); else if (s < -.24) col = pk(DKc, .15) } }
        buf[orow + x] = col } } }
  // rings: round the boats afloat and the jetty's pilings, and (in a calm) where a fish has risen
  const put = (x, y, c, a) => { x = Math.round(x) - cx0; y = Math.round(y) - cy0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x, a8 = (a * 255 + .5) | 0; if (a8 > (buf[i] >>> 24)) buf[i] = (a8 << 24) | (c[2] << 16) | (c[1] << 8) | c[0] };
  const ring = (cx, cy, rx, ry, c, a, sd, gap) => { const n = Math.max(12, Math.ceil(TAU * Math.sqrt((rx * rx + ry * ry) / 2) / 1.15)); for (let i = 0; i < n; i++) { if (gap && h2(i, sd, 91) < gap) continue; const an = i / n * TAU; put(cx + Math.cos(an) * rx, cy + Math.sin(an) * ry, c, a) } };
  for (const o of objsIn(cx0 - 40, cy0 - 30, cx0 + W + 40, cy0 + H + 30)) { if (o.p !== 'boat' && o.p !== 'piling') continue;
    if (o._wk === undefined) { const m = matAt(o.x, o.y); o._wk = (m === 'lake' && o.p === 'boat') ? 2 : (o.p === 'piling' && (m === 'lake' || m === 'bridge')) ? 1 : 0 }
    if (!o._wk) continue; const sd = (Math.round(o.x * 7 + o.y * 3) % 17) + 1;
    if (o._wk === 2) { for (let yy = -4; yy <= 5; yy++) { const hw = 19 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - .5) / 5.5, 2))); for (let xx = -hw; xx <= hw; xx++) put(o.x + xx, o.y + 2 + yy, DKc, .26 * (1 - Math.abs(xx) / (hw + 1) * .6)) } // (the dark of the hull on the water)
      o.wob = Math.round(Math.sin(t * 1.15 + sd * 1.9) * (.55 + .7 * A)); const rx0 = 19, ry0 = 6.6;
      for (let k = 0; k < 2; k++) { const ph = wFrac(WS.ph * .5 + k * .5 + sd * .13); ring(o.x, o.y + 1, rx0 + ph * 9, ry0 + ph * 5, FM, (1 - ph) * (.55 + .25 * A) * (.55 + .45 * sunK), sd + k, .3) }
      const bw = .5 + .5 * Math.sin(t * 2.2 + sd); for (let i = -1; i <= 1; i += 2) put(o.x + i * (rx0 - 1) + (i > 0 ? 1 : -1) * bw, o.y + 1, FM, .4 + .3 * bw) }
    else for (let k = 0; k < 2; k++) { const ph = wFrac(WS.ph * .45 + k * .5 + sd * .21); ring(o.x, o.y + 1, 2.5 + ph * 6, 1.3 + ph * 3, FM, (1 - ph) * (.5 + .25 * A), sd + k, .2) } }
  if (!lowGfx) { const slot = Math.floor(t / 1.3);
    for (let j = slot - 2; j <= slot; j++) { for (let m = 0; m < 2; m++) { if (h2(j, m, 95) > .7 * (1 - clamp(wnd / .2, 0, 1)) + .05 * rain) continue; const age = t - j * 1.3 - m * .4; if (age < 0 || age > 2.6) continue;
      const fx = cx0 + 20 + h2(j, m, 96) * (W - 40), fy = cy0 + 20 + h2(j, m, 97) * (H - 40), c = Math.floor(fx / CK), r = Math.floor(fy / CK), J = WJOBS.get(c + ',' + r), f = J && J.f; if (!f) continue; const dwv = f.F[(Math.floor(fy) - f.y0) * CK + Math.floor(fx) - f.x0]; if (dwv === WNONE || dwv < 120) continue;
      for (let k = 0; k < 3; k++) { const ph = age * .55 - k * .16; if (ph < 0 || ph > 1) continue; ring(fx, fy, 1 + ph * 9, .5 + ph * 4.5, HL, (1 - ph) * .42 * (.4 + .6 * sunK), j * 7 + m, .2) } } } }
  O.g.putImageData(O.img, 0, 0); ctx.drawImage(O.cv, cx0, cy0) }
