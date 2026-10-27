// =====================================================================================================================
// THE BIKE'S TRACKS: the two tyres leave their lines on the ground behind them: a groove in the sand (its lit side a shade lighter), a dark line in the dirt
// of the roads and the paths (darker in the wet), a faint flattened line through the grass and the leaves, hardly anything on the gravel, none on the boards
// of the jetty or in the water. In a turn the front wheel runs wide of the rear: two lines. Out of a puddle the tyres print wet for a few metres on anything.
// They fade as the ground recovers: the grass springs back in a minute or two, the dirt keeps them some minutes, the sand longer (the rain smooths them all).
// Kept per square of the ground (CK px) as a picture of its own with a brightness and a kind per pixel. The squares in view are brought up to date twice a
// second; one out of view is brought up to date (all its fading at once) when it comes back into view, and a few of those are swept now and then, so that
// a long ride does not leave a trail of work behind it; a square with nothing left on it is dropped.
// =====================================================================================================================
const TRK = new Map(); let TRKT = 0, TRKWET = 0, TRKP = null;
// the kinds of mark: colour and how fast it goes (per second); a mark's kind is kept with each pixel
const TRKC = [null,
  { c: [88, 70, 44], k: .008 },  // 1 the groove in the sand
  { c: [240, 228, 198], k: .008 }, // 2 its lit rim
  { c: [36, 24, 16], k: .012 },  // 3 the line in the dirt
  { c: [170, 142, 104], k: .012 }, // 4 the soil pushed up beside it
  { c: [50, 42, 24], k: .03 },   // 5 the grass pressed down
  { c: [44, 42, 40], k: .05 },   // 6 the gravel scuffed
  { c: [30, 26, 22], k: .05 }];  // 7 wet tyres
// per kind of ground: the mark of the groove (code, strength) and of its rim
const TRKS = { sand: { m: 1, a: .78, rim: 2, ra: .55 }, dirt: { m: 3, a: .8, rim: 4, ra: .4 }, grass: { m: 5, a: .62 }, hard: { m: 6, a: .2 } };
const TRKM = { beach: 'sand', road: 'dirt', path: 'dirt', dirt: 'dirt', track: 'dirt', trodden: 'dirt', rut: 'dirt', bog: 'dirt', gravel: 'hard', dam: 'hard', bridge: null, lake: null, river: null, pond: null, brook: null };
function trkChunk(ci, cj) { const key = ci + ',' + cj; let C = TRK.get(key); if (C) return C; const cv = document.createElement('canvas'); cv.width = cv.height = CK; const g = cv.getContext('2d');
  C = { ci, cj, a: new Float32Array(CK * CK), m: new Uint8Array(CK * CK), cv, g, img: g.createImageData(CK, CK), tu: t }; TRK.set(key, C); return C }
// one pixel of a line: as strong as it is now or as the new mark, whichever is the more; drawn into the square's picture at once (the fading redraws it later)
function trkPut(x, y, m, a) { x = Math.floor(x); y = Math.floor(y); const ci = Math.floor(x / CK), cj = Math.floor(y / CK), C = trkChunk(ci, cj), lx = x - ci * CK, ly = y - cj * CK, i = ly * CK + lx; if (C.a[i] >= a) return;
  C.a[i] = a; C.m[i] = m; const c = TRKC[m].c; C.g.clearRect(lx, ly, 1, 1); C.g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`; C.g.fillRect(lx, ly, 1, 1) }
// a tyre's mark at a point (dx, dy: the way it is going): what the ground there takes, how strong in the wet
function trkMark(x, y, dx, dy) { if (deckLift(x, y) > 0) return; const sk = TRKM[matAt(x, y)]; if (sk === null) return; const S = TRKS[sk || 'grass'];
  if (S === TRKS.sand) { const L = typeof wLocal === 'function' ? wLocal(x, y) : null; if (L && L.dw > -(WS.RU || 2) * 1.1) return } // (where the waves run up, the sand is smoothed again at once)
  let m = S.m, a = S.a * (S === TRKS.dirt ? Math.min(1.2, 1 + .5 * WET) : 1); if (TRKWET > 0 && .7 * Math.min(1, TRKWET / 2.5) > a * .6) { m = 7; a = .7 * Math.min(1, TRKWET / 2.5) }
  const l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, sd = nx + ny > 0 ? -1 : 1, tr = (Math.floor(x) + Math.floor(y)) & 1 ? 1 : .8; // (sd: the side toward the light, up and to the left; tr: the tread)
  trkPut(x, y, m, a * tr); trkPut(x - nx * sd, y - ny * sd, m, a * .62 * tr); // (a line two pixels wide: the groove and its shoulder)
  if (S.rim && m !== 7) trkPut(x + nx * sd, y + ny * sd, S.rim, S.ra) }
// a square brought up to date: all the fading since it was last looked at, and its picture made again from what is left
function trkUpdate(key, C) { const dt = t - C.tu; if (dt < .25) return; C.tu = t; const A = C.a, M = C.m, d = C.img.data, rain = 1 + WX.rain, F = TRKC.map(q => q ? Math.exp(-q.k * dt * rain) : 1); let live = 0;
  for (let i = 0; i < A.length; i++) { let a = A[i]; if (!(a > 0)) { d[i * 4 + 3] = 0; continue } const q = TRKC[M[i]]; a *= F[M[i]]; if (a < .03) { a = 0; d[i * 4 + 3] = 0 } else { live++; d[i * 4] = q.c[0]; d[i * 4 + 1] = q.c[1]; d[i * 4 + 2] = q.c[2]; d[i * 4 + 3] = a * 255 } A[i] = a }
  if (!live) { TRK.delete(key); return } C.g.putImageData(C.img, 0, 0) }
function stepTracks(dt) { TRKWET = INPUD ? 2.5 : Math.max(0, TRKWET - dt);
  // the contact points of the two tyres: the rear 6 px behind the bottom bracket, the front 12.4 px ahead of it, the tyres' bottoms 1.5 px below its point
  // (the model's 8 and 16.5, the sprite being drawn at three quarters of the model); the front wheel wanders a little about the rear's line
  const sx = Math.sin(R.psi), sy = -Math.cos(R.psi), rear = [R.x - sx * 6, R.y - sy * 6 + 1.5], wv = Math.sin(t * 1.9) * .55 + Math.sin(t * 4.7 + 1) * .3, front = [R.x + sx * 12.4 - sy * wv, R.y + sy * 12.4 + sx * wv + 1.5];
  if (Math.abs(R.v) > .6 && TRKP) { for (const [P, Q] of [[TRKP[0], rear], [TRKP[1], front]]) { const dx = Q[0] - P[0], dy = Q[1] - P[1], m = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))); if (m > 40) continue; for (let s = 1; s <= m; s++) trkMark(P[0] + dx * s / m, P[1] + dy * s / m, dx, dy) } }
  TRKP = [rear, front];
  // twice a second: the squares in view (and next to it) brought up to date, and two of the others that have waited longest; never more than a hundred kept
  TRKT -= dt; if (TRKT > 0) return; TRKT = .5;
  const ci0 = Math.floor(CAM.x / CK) - 1, ci1 = Math.floor((CAM.x + W) / CK) + 1, cj0 = Math.floor(CAM.y / CK) - 1, cj1 = Math.floor((CAM.y + H) / CK) + 1, far = [];
  for (const [key, C] of TRK) { if (C.ci >= ci0 && C.ci <= ci1 && C.cj >= cj0 && C.cj <= cj1) trkUpdate(key, C); else far.push([C.tu, key, C]) }
  far.sort((a, b) => a[0] - b[0]); for (let i = 0; i < Math.min(2, far.length); i++) trkUpdate(far[i][1], far[i][2]); for (let i = 0; i < far.length - 100; i++) TRK.delete(far[i][1]) }
// drawn on the ground, under the water's wash, the puddles and the shadows (a square that comes back into view is brought up to date first)
function drawTracks(cx0, cy0) { if (!TRK.size) return; for (let cj = Math.floor(cy0 / CK); cj <= Math.floor((cy0 + H) / CK); cj++) for (let ci = Math.floor(cx0 / CK); ci <= Math.floor((cx0 + W) / CK); ci++) { const key = ci + ',' + cj, C = TRK.get(key); if (!C) continue; if (t - C.tu > 1) trkUpdate(key, C); if (TRK.has(key)) ctx.drawImage(C.cv, ci * CK, cj * CK) } }
