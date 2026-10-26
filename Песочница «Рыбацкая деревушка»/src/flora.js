// =====================================================================================================================
// LOW GROWTH THAT SITS IN THE GROUND: the tufts of grass and the mushrooms. The old ones were as tall as a man (a tuft: a metre and a half) with a hard dark outline, a solid dark
// block at the foot and a bright straw yellow, the mushrooms a handful of pixels across with white stalks and scarlet caps: against the soft autumn ground they stood out like
// stickers. These are smaller, thinner, in the colours of the ground (dull olive, dried grass, brown), without the block at the foot, with a faint outline only.
// =====================================================================================================================
const FL_GRASS = {
  olive: [[58, 62, 32], [80, 86, 42], [104, 110, 54], [132, 132, 70]],
  dry: [[84, 70, 38], [112, 96, 52], [140, 122, 68], [166, 146, 88]],
  sedge: [[44, 54, 28], [64, 78, 38], [88, 102, 50], [114, 124, 66]],
  rust: [[84, 56, 34], [110, 76, 44], [136, 98, 58], [160, 122, 76]]
};
function genGrassSoft(r, seed, hint, sw = 0) {
  const w = 11, h = 11, s = new PSpr(w, h, 5, 3), q = r(), pal = q < .5 ? FL_GRASS.olive : q < .78 ? FL_GRASS.dry : q < .92 ? FL_GRASS.sedge : FL_GRASS.rust, n = 5 + Math.floor(r() * 4), lo = r() < .3;
  for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) : .5, mid = 1 - Math.abs(f - .5) * 2, bx = 2.2 + f * (w - 5.4) + (r() - .5) * 1.4, hh = Math.max(2, Math.round((lo ? 2.6 : 3.6) + mid * (lo ? 2.2 : 4.2) + r() * 2.2)), bend = (r() - .5) * 3.2 + (f - .5) * 3.4, shade = (i & 1) ? 1 : 2;
    for (let t = 0; t <= hh; t++) { const u = t / hh, x = bx + (bend + sw * 2.2 * (.8 + .4 * ((i * 7) % 5) / 4)) * u * u, y = h - 1 - t; s.set(x, y, pal[t < 1 ? 1 : u > .8 ? 3 : u > .45 ? Math.min(3, shade + 1) : shade]) }
    if (r() < .25 && hh >= 5) { const x = bx + bend + sw * 2.2, y = h - 1 - hh; s.set(x + (bend > 0 ? 1 : -1) * .7, y + 1, pal[3]) } } // (a few have a seed head leaning a little)
  for (let k = 0; k < 3; k++) { const x = 3 + Math.floor(r() * (w - 6)); if (s.has(x, h - 1)) s.set(x, h - 1, pal[0]) }
  return { s, ax: 5 + s.ox, ay: h - 1 + s.oy, shadowR: 2 };
}
// the caps in colours that have gone dull in the damp: nothing scarlet or white
const FL_CAP = {
  fly: [[96, 30, 26], [134, 44, 34], [166, 68, 46]], porcini: [[76, 48, 28], [104, 68, 38], [132, 92, 54]], porcini2: [[92, 60, 34], [124, 86, 48], [156, 116, 70]],
  russR: [[92, 34, 42], [124, 50, 58], [156, 84, 88]], russV: [[66, 46, 72], [92, 64, 100], [122, 94, 128]], russY: [[110, 98, 46], [144, 130, 62], [172, 158, 92]],
  chant: [[160, 102, 34], [188, 128, 46], [208, 154, 76]], honey: [[96, 70, 38], [128, 96, 52], [158, 124, 74]], parasol: [[112, 94, 72], [150, 130, 102], [184, 166, 138]]
};
const FL_STEM = { cream: [[116, 108, 94], [142, 134, 116], [160, 152, 132]], tan: [[110, 92, 66], [134, 114, 84], [154, 132, 100]], chant: [[150, 102, 38], [172, 122, 48], [190, 142, 70]] };
function genMushSoft(r, seed, hint) {
  const W_ = { birch: [['fly', 2.2], ['chant', 1.4], ['russula', 1], ['porcini', .5]], conif: [['fly', 1.6], ['porcini', 1.6], ['chant', 1.2], ['russula', .8]], decid: [['porcini', 1.6], ['russula', 1], ['honey', 1], ['parasol', .6], ['puff', .6]], russula: [['russula', 3], ['puff', .8], ['parasol', .5]] };
  const kind = wpick(r, W_[hint] || [['fly', 1.3], ['porcini', 1.1], ['russula', 1], ['chant', .8], ['puff', .6], ['honey', .8], ['parasol', .4]]), s = new PSpr(14, 10, 3, 3), bY = 8;
  const n = kind === 'honey' ? 3 + Math.floor(r() * 3) : kind === 'chant' ? 2 + Math.floor(r() * 2) : kind === 'puff' ? 1 + Math.floor(r() * 2) : 1 + (r() < .3 ? 1 : 0);
  for (let i = 0; i < n; i++) { const sc = .5 + r() * .4, x = 7 + (i - (n - 1) / 2) * (kind === 'honey' ? 1.8 : kind === 'chant' ? 2.6 : 4) + (r() - .5) * 1.4, yb = bY - (r() < .3 ? 1 : 0), age = r();
    if (kind === 'fly') mushCap(r, s, x, yb, { stemH: Math.max(1, Math.round((1.4 + age * 1.8) * sc)), stemW: 1.2 * sc + .3, bulb: .5, rx: (1.2 + age * 1.0) * sc + .3, ry: (1.3 - age * .4) * sc + .2, cap: FL_CAP.fly, stem: FL_STEM.cream, spots: Math.round(1 + age * 2), gills: [190, 182, 160], flat: age > .6 });
    else if (kind === 'porcini') mushCap(r, s, x, yb, { stemH: Math.max(1, Math.round(1.6 * sc)), stemW: 1.8 * sc + .3, bulb: .5, rx: 1.7 * sc + .3, ry: 1.2 * sc + .2, cap: r() < .5 ? FL_CAP.porcini : FL_CAP.porcini2, stem: FL_STEM.tan, gills: [160, 148, 96] });
    else if (kind === 'russula') mushCap(r, s, x, yb, { stemH: Math.max(1, Math.round(1.6 * sc)), stemW: 1.1 * sc + .3, rx: 1.5 * sc + .3, ry: .9 * sc + .2, cap: pick(r, [FL_CAP.russR, FL_CAP.russV, FL_CAP.russY]), stem: FL_STEM.cream, gills: [196, 188, 170], flat: true });
    else if (kind === 'chant') mushCap(r, s, x, yb, { stemH: 1, stemW: 1, rx: 1.2 * sc + .2, ry: 1.2 * sc + .2, cap: FL_CAP.chant, stem: FL_STEM.chant, funnel: true });
    else if (kind === 'puff') { const rr = (.9 + r() * .8) * sc + .2; for (let y = -Math.ceil(rr * 2); y <= 0; y++) for (let xx = -Math.ceil(rr); xx <= rr; xx++) { const dx = xx / rr, dy = (y + rr) / rr; if (dx * dx + dy * dy > 1) continue; s.set(x + xx, yb + y, FL_STEM.cream[dx < -.2 && dy < 0 ? 2 : dy > .4 ? 0 : 1]) } }
    else if (kind === 'honey') { const lean = (i - (n - 1) / 2) * .5; mushCap(r, s, x + lean, yb, { stemH: Math.max(1, Math.round((1.4 + r() * 1.4) * sc)), stemW: 1, rx: 1.1 * sc + .2, ry: .8 * sc + .2, cap: FL_CAP.honey, stem: FL_STEM.tan, flat: true }) }
    else mushCap(r, s, x, yb, { stemH: Math.max(2, Math.round(3 * sc)), stemW: 1, bulb: 1, rx: 2 * sc + .3, ry: .9 * sc + .2, cap: FL_CAP.parasol, stem: FL_STEM.tan, gills: [190, 182, 164], flat: true, spots: 1 }) }
  s.outline(.66, .82); return { s, ax: 7 + s.ox, ay: bY + s.oy, shadowR: 2 };
}
MAKERS.grass = genGrassSoft; MAKERS.mush = genMushSoft;
