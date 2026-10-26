// Sketch kit: scenes at game scale (1 px = 10 cm), built from the game's own generators.
// A scene is W×H game pixels; it is exported ×2 (pixelated), like the earlier sketches.
const K = {};
(function () {
  const g = window.G;
  K.g = g;
  K.init = (w, h) => {
    K.w = w; K.h = h;
    K.cv = document.createElement('canvas'); K.cv.width = w; K.cv.height = h;
    K.ctx = K.cv.getContext('2d'); K.ctx.imageSmoothingEnabled = false;
    K.img = K.ctx.createImageData(w, h);
    K.items = [];
    K.sun = [.62, .2]; // shadow: sideways and down per pixel of height (sun from the upper left)
  };
  // ---- ground, pixel by pixel ----
  K.px = (x, y, c, a = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= K.w || y >= K.h) return;
    const i = (y * K.w + x) * 4, d = K.img.data;
    if (a >= 255) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return }
    const f = a / 255; d[i] = d[i] * (1 - f) + c[0] * f; d[i + 1] = d[i + 1] * (1 - f) + c[1] * f; d[i + 2] = d[i + 2] * (1 - f) + c[2] * f; d[i + 3] = 255;
  };
  K.get = (x, y) => { const i = (y * K.w + x) * 4, d = K.img.data; return [d[i], d[i + 1], d[i + 2]] };
  K.mulPx = (x, y, f) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= K.w || y >= K.h) return; const i = (y * K.w + x) * 4, d = K.img.data; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f };
  K.ground = fn => { for (let y = 0; y < K.h; y++) for (let x = 0; x < K.w; x++) { const c = fn(x, y); if (c) K.px(x, y, c) } };
  K.q = (pal, v, x, y, dz = .7) => pal[g.quant(v, x, y, pal.length, dz)];
  K.n = (x, y, s) => g.vn(x, y, s); K.f = (x, y, s) => g.fbm(x, y, s); K.h2 = (x, y, s) => g.h2(x, y, s);
  // a little grain, as on the game's baked ground
  K.grain = (c, x, y) => { const h = g.h2(x, y, 2001); const f = h < .11 ? .93 : h > .89 ? 1.07 : 1; return f === 1 ? c : c.map(v => Math.min(255, v * f)) };
  // a fallen leaf stamped into the ground
  K.leaf = (x, y, sp, age = .3, rnd = Math.random) => { const L = g.lkPick(sp, rnd); g.lkStamp((xx, yy, c) => K.px(xx, yy, c), Math.round(x), Math.round(y), L, Math.floor(rnd() * 8), age) };
  // ---- sprites from the game ----
  K.spr = (type, seed, hint) => {
    const o = g.MAKERS[type](g.mulberry(seed), seed, hint); let s;
    if (o.cs) { o.cs.layers = g.crownLayers(o.cs.clumps, o.cs.r); g.prepCrown(o); s = g.crownFrame(o.cs, g.REST) } else s = o.s;
    const cr = s.crop(); s = cr.s; if (g.RIMT.has(type)) g.rimSpr(s);
    return { s, cv: s.canvas(), ax: o.ax - cr.dx, ay: o.ay - cr.dy, type };
  };
  // a hand-drawn sprite: draw(s) paints into a Spr of w×h, anchor at (ax, ay); outlined like the game's
  K.make = (w, h, ax, ay, draw, ol = [.36, .58], rim = true) => {
    const s = new g.Spr(w, h); draw(s); if (ol) s.outline(ol[0], ol[1]); if (rim) g.rimSpr(s);
    return { s, cv: s.canvas(), ax, ay };
  };
  K.rider = (yaw = 0, fr = 3) => { const cv = g.genRider3(fr, yaw, yaw * .2, 0); const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; c2.getContext('2d').drawImage(cv, 0, 0); const d = c2.getContext('2d').getImageData(0, 0, cv.width, cv.height); const s = new g.Spr(cv.width, cv.height); s.d.set(d.data); return { s, cv, ax: 16 + g.ROX, ay: 32 } };
  // place a sprite with its foot at (x, y); depth = y unless given
  K.put = (o, x, y, opt = {}) => { if (!o.cv) o.cv = o.s.canvas(); K.items.push({ o, x: Math.round(x), y: Math.round(y), z: opt.z ?? y, shadow: opt.shadow ?? true, blob: opt.blob ?? true, alpha: opt.alpha ?? 1 }); return o };
  // something drawn straight on the canvas at a depth (wires, glows...)
  K.draw = (z, fn) => K.items.push({ z, fn });
  // ---- render: ground, cast shadows, contact shadows, sprites by depth ----
  K.render = (post) => {
    const ctx = K.ctx; ctx.putImageData(K.img, 0, 0);
    // cast shadows of everything, on one layer, soft-edged
    const sh = document.createElement('canvas'); sh.width = K.w; sh.height = K.h; const sg = sh.getContext('2d'), sd = sg.createImageData(K.w, K.h);
    for (const it of K.items) { if (!it.o || !it.shadow) continue; const s = it.o.s, x0 = it.x - it.o.ax, y0 = it.y - it.o.ay;
      for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { if (!s.d[(y * s.w + x) * 4 + 3]) continue; const hg = Math.max(0, it.o.ay - y);
        const sx = Math.round(x0 + x + hg * K.sun[0]), sy = Math.round(it.y + (y > it.o.ay ? y - it.o.ay : hg * K.sun[1]));
        for (const dx of [0, 1]) { const X = sx + dx; if (X < 0 || sy < 0 || X >= K.w || sy >= K.h) continue; sd.data[(sy * K.w + X) * 4 + 3] = 255 } } }
    sg.putImageData(sd, 0, 0);
    const sb = document.createElement('canvas'); sb.width = K.w; sb.height = K.h; const sbg = sb.getContext('2d'); sbg.filter = 'blur(1.1px)'; sbg.drawImage(sh, 0, 0); sbg.filter = 'none'; sbg.globalAlpha = .55; sbg.drawImage(sh, 0, 0);
    ctx.globalAlpha = K.shadowA ?? .3; ctx.drawImage(sb, 0, 0); ctx.globalAlpha = 1;
    // contact shadows
    for (const it of K.items) { if (!it.o || !it.blob) continue; const rx = Math.max(2.5, Math.min(9, it.o.s.w * .2)), ry = Math.max(1.4, rx * .4);
      ctx.fillStyle = 'rgba(10,14,8,.22)'; ctx.beginPath(); ctx.ellipse(it.x + .5, it.y + .5, rx, ry, 0, 0, Math.PI * 2); ctx.fill() }
    K.items.sort((a, b) => a.z - b.z);
    for (const it of K.items) { if (it.fn) { it.fn(ctx); continue } ctx.globalAlpha = it.alpha; ctx.drawImage(it.o.cv, it.x - it.o.ax, it.y - it.o.ay); ctx.globalAlpha = 1 }
    if (post) post(ctx);
  };
  // warm afternoon grade, as the game's colour wash
  K.grade = (a = .07) => { const c = K.ctx; c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = `rgba(255,200,150,${a * 3})`; c.fillRect(0, 0, K.w, K.h); c.restore() };
  // dusk: a multiply of the evening light, then warm lamp pools added
  K.dusk = (amb, lights) => { const c = K.ctx; c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${amb})`; c.fillRect(0, 0, K.w, K.h);
    c.globalCompositeOperation = 'lighter'; for (const L of lights) { const r = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r); r.addColorStop(0, `rgba(${L.c},${L.a})`); r.addColorStop(1, `rgba(${L.c},0)`); c.fillStyle = r; c.save(); c.translate(L.x, L.y); c.scale(1, L.sy || 1); c.translate(-L.x, -L.y); c.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2); c.restore() } c.restore() };
  K.out = (scale = 2) => { const o = document.createElement('canvas'); o.width = K.w * scale; o.height = K.h * scale; const c = o.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(K.cv, 0, 0, o.width, o.height); return o.toDataURL('image/png') };
})();
