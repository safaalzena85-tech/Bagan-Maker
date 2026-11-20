// ============================================================
// STROKE PROFILE — Lebar garis variabel (seperti Adobe Illustrator)
// ------------------------------------------------------------
// Setiap profil didefinisikan sebagai fungsi w(t) dengan t dari 0..1
// sepanjang path, mengembalikan pengali lebar (0..1) terhadap lebar
// stroke dasar. Untuk menambah preset baru cukup menambah satu entri
// pada array STROKE_PROFILES di bawah.
// ============================================================

export interface StrokeProfile {
  id: string;
  nama: string;
  fn: (t: number) => number;
}

export interface Pt {
  x: number;
  y: number;
}

const POINT = (x: number, y: number): Pt => ({ x, y });

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// ------------------------------------------------------------
// PRESET PROFIL
// ------------------------------------------------------------
export const STROKE_PROFILES: StrokeProfile[] = [
  {
    id: 'uniform',
    nama: 'Uniform (Garis Biasa)',
    fn: () => 1,
  },
  {
    id: 'lensa',
    nama: 'Taper Kedua Ujung (Lensa)',
    fn: (t) => Math.sin(Math.PI * t),
  },
  {
    id: 'taper-awal',
    nama: 'Taper Awal',
    fn: (t) => t,
  },
  {
    id: 'taper-akhir',
    nama: 'Taper Akhir',
    fn: (t) => 1 - t,
  },
  {
    id: 'tonjolan-tengah',
    nama: 'Tonjolan Tengah',
    fn: (t) => Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.5),
  },
  {
    id: 'pinch-tengah',
    nama: 'Pinch Tengah',
    fn: (t) => 0.3 + 0.7 * Math.abs(Math.cos(Math.PI * t)),
  },
  {
    id: 'dua-tonjolan',
    nama: 'Dua Tonjolan',
    fn: (t) =>
      Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.7) *
      (1 - 0.4 * Math.exp(-Math.pow((t - 0.5) / 0.1, 2))),
  },
  {
    id: 'bergelombang',
    nama: 'Bergelombang',
    fn: (t) => 0.6 + 0.4 * Math.sin(4 * Math.PI * t),
  },
];

export const DEFAULT_STROKE_PROFILE_ID = 'uniform';

export function getStrokeProfile(id?: string | null): StrokeProfile {
  if (!id) return STROKE_PROFILES[0];
  return STROKE_PROFILES.find((p) => p.id === id) || STROKE_PROFILES[0];
}

export function isUniformProfile(id?: string | null): boolean {
  return !id || id === DEFAULT_STROKE_PROFILE_ID;
}

// ------------------------------------------------------------
// UTILITAS GEOMETRI
// ------------------------------------------------------------
function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function polylineLength(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

/** Radius lingkaran luar melalui 3 titik (Infinity bila kolinear). */
function circumRadius(p0: Pt, p1: Pt, p2: Pt): number {
  const a = dist(p0, p1);
  const b = dist(p1, p2);
  const c = dist(p2, p0);
  if (a < 1e-9 || b < 1e-9 || c < 1e-9) return Infinity;
  const area2 = Math.abs((p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x));
  if (area2 < 1e-12) return Infinity;
  return (a * b * c) / (2 * area2);
}

// ------------------------------------------------------------
// TOKENIZER PATH SVG (M L H V Q T C S A Z, absolut maupun relatif)
// ------------------------------------------------------------
type PathToken = { kind: 'cmd'; value: string } | { kind: 'num'; value: number };

function tokenizePath(d: string): PathToken[] {
  const toks: PathToken[] = [];
  let i = 0;
  const numRe = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/;
  while (i < d.length) {
    const ch = d[i];
    if (/[a-zA-Z]/.test(ch)) {
      toks.push({ kind: 'cmd', value: ch });
      i++;
      continue;
    }
    if (ch === ',' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f') {
      i++;
      continue;
    }
    const m = numRe.exec(d.slice(i));
    if (m && m[0].length > 0) {
      toks.push({ kind: 'num', value: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    // karakter tak dikenal → lewati
    i++;
  }
  return toks;
}

function angleBetween(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  const cos = len === 0 ? 1 : Math.max(-1, Math.min(1, dot / len));
  const ang = Math.acos(cos);
  const cross = ux * vy - uy * vx;
  return cross < 0 ? -ang : ang;
}

/** Endpoint → center parameterization arc SVG, dikembalikan sebagai titik-titik. */
function arcToPoints(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  largeArc: number,
  sweep: number,
  x2: number,
  y2: number
): Pt[] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx < 1e-9 || ry < 1e-9) {
    return [POINT(x1, y1), POINT(x2, y2)];
  }
  if (Math.abs(x1 - x2) < 1e-9 && Math.abs(y1 - y2) < 1e-9) {
    return [POINT(x1, y1)];
  }
  const phi = (phiDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  const rx2 = rx * rx;
  const ry2 = ry * ry;
  const x1p2 = x1p * x1p;
  const y1p2 = y1p * y1p;

  const denom = rx2 * y1p2 + ry2 * x1p2;
  let radicand = denom === 0 ? 0 : (rx2 * ry2 - denom) / denom;
  if (radicand < 0) radicand = 0;
  let coef = Math.sqrt(radicand);
  const largeArcFlag = largeArc ? 1 : 0;
  const sweepFlag = sweep ? 1 : 0;
  if (largeArcFlag === sweepFlag) coef = -coef;

  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * (-(ry * x1p) / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;

  const theta1 = angleBetween(1, 0, ux, uy);
  let dTheta = angleBetween(ux, uy, vx, vy);
  if (!sweepFlag && dTheta > 0) dTheta -= 2 * Math.PI;
  else if (sweepFlag && dTheta < 0) dTheta += 2 * Math.PI;

  const steps = Math.max(8, Math.round((Math.abs(dTheta) / (Math.PI / 2)) * 12));
  const out: Pt[] = [];
  for (let k = 0; k <= steps; k++) {
    const th = theta1 + (k / steps) * dTheta;
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);
    out.push(
      POINT(
        cx + rx * cosT * cosPhi - ry * sinT * sinPhi,
        cy + rx * cosT * sinPhi + ry * sinT * cosPhi
      )
    );
  }
  return out;
}

const QUAD_STEPS = 24;
const CUBIC_STEPS = 32;

function appendQuadratic(pts: Pt[], p0: Pt, p1: Pt, p2: Pt): void {
  for (let k = 1; k <= QUAD_STEPS; k++) {
    const t = k / QUAD_STEPS;
    const u = 1 - t;
    pts.push(
      POINT(
        u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
      )
    );
  }
}

function appendCubic(pts: Pt[], p0: Pt, p1: Pt, p2: Pt, p3: Pt): void {
  for (let k = 1; k <= CUBIC_STEPS; k++) {
    const t = k / CUBIC_STEPS;
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    pts.push(
      POINT(
        uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
        uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
      )
    );
  }
}

/** Mengubah string path SVG menjadi satu polyline (array titik). */
export function flattenPathToPoints(d: string): Pt[] {
  const toks = tokenizePath(d);
  if (toks.length === 0) return [];

  const pts: Pt[] = [];
  let cur = POINT(0, 0);
  let subStart = POINT(0, 0);
  let lastQuadCtl: Pt | null = null;
  let lastCubicCtl: Pt | null = null;
  let i = 0;

  const readNums = (n: number): number[] => {
    const out: number[] = [];
    while (out.length < n && i < toks.length && toks[i].kind === 'num') {
      out.push((toks[i] as { kind: 'num'; value: number }).value);
      i++;
    }
    while (out.length < n) out.push(0);
    return out;
  };

  while (i < toks.length) {
    const tok = toks[i];
    if (tok.kind !== 'cmd') {
      i++;
      continue;
    }
    const raw = tok.value;
    const isRel = raw >= 'a' && raw <= 'z';
    const cmd = raw.toUpperCase();
    i++;

    switch (cmd) {
      case 'M': {
        const [x, y] = readNums(2);
        cur = isRel ? POINT(cur.x + x, cur.y + y) : POINT(x, y);
        pts.push(cur);
        subStart = cur;
        lastQuadCtl = null;
        lastCubicCtl = null;
        // pasangan berikutnya = implicit lineto
        while (i < toks.length && toks[i].kind === 'num') {
          const [lx, ly] = readNums(2);
          cur = isRel ? POINT(cur.x + lx, cur.y + ly) : POINT(lx, ly);
          pts.push(cur);
          lastQuadCtl = null;
          lastCubicCtl = null;
        }
        break;
      }
      case 'L': {
        const [x, y] = readNums(2);
        cur = isRel ? POINT(cur.x + x, cur.y + y) : POINT(x, y);
        pts.push(cur);
        lastQuadCtl = null;
        lastCubicCtl = null;
        break;
      }
      case 'H': {
        const [x] = readNums(1);
        cur = isRel ? POINT(cur.x + x, cur.y) : POINT(x, cur.y);
        pts.push(cur);
        lastQuadCtl = null;
        lastCubicCtl = null;
        break;
      }
      case 'V': {
        const [y] = readNums(1);
        cur = isRel ? POINT(cur.x, cur.y + y) : POINT(cur.x, y);
        pts.push(cur);
        lastQuadCtl = null;
        lastCubicCtl = null;
        break;
      }
      case 'Q': {
        const [c1x, c1y, x, y] = readNums(4);
        const ctl = isRel ? POINT(cur.x + c1x, cur.y + c1y) : POINT(c1x, c1y);
        const end = isRel ? POINT(cur.x + x, cur.y + y) : POINT(x, y);
        appendQuadratic(pts, cur, ctl, end);
        cur = end;
        lastQuadCtl = ctl;
        lastCubicCtl = null;
        break;
      }
      case 'T': {
        const [x, y] = readNums(2);
        const ctl: Pt = lastQuadCtl
          ? POINT(2 * cur.x - lastQuadCtl.x, 2 * cur.y - lastQuadCtl.y)
          : cur;
        const end = isRel ? POINT(cur.x + x, cur.y + y) : POINT(x, y);
        appendQuadratic(pts, cur, ctl, end);
        cur = end;
        lastQuadCtl = ctl;
        lastCubicCtl = null;
        break;
      }
      case 'C': {
        const [c1x, c1y, c2x, c2y, x, y] = readNums(6);
        const c1 = isRel ? POINT(cur.x + c1x, cur.y + c1y) : POINT(c1x, c1y);
        const c2 = isRel ? POINT(cur.x + c2x, cur.y + c2y) : POINT(c2x, c2y);
        const end = isRel ? POINT(cur.x + x, cur.y + y) : POINT(x, y);
        appendCubic(pts, cur, c1, c2, end);
        cur = end;
        lastCubicCtl = c2;
        lastQuadCtl = null;
        break;
      }
      case 'S': {
        const [c2x, c2y, x, y] = readNums(4);
        const c1 = lastCubicCtl
          ? POINT(2 * cur.x - lastCubicCtl.x, 2 * cur.y - lastCubicCtl.y)
          : cur;
        const c2 = isRel ? POINT(cur.x + c2x, cur.y + c2y) : POINT(c2x, c2y);
        const end = isRel ? POINT(cur.x + x, cur.y + y) : POINT(x, y);
        appendCubic(pts, cur, c1, c2, end);
        cur = end;
        lastCubicCtl = c2;
        lastQuadCtl = null;
        break;
      }
      case 'A': {
        const [rx, ry, rot, laf, sf, x, y] = readNums(7);
        const end = isRel ? POINT(cur.x + x, cur.y + y) : POINT(x, y);
        const arcPts = arcToPoints(cur.x, cur.y, rx, ry, rot, laf, sf, end.x, end.y);
        if (arcPts.length > 1) {
          for (let k = 1; k < arcPts.length; k++) pts.push(arcPts[k]);
        } else if (arcPts.length === 1) {
          pts.push(arcPts[0]);
        }
        cur = end;
        lastQuadCtl = null;
        lastCubicCtl = null;
        break;
      }
      case 'Z': {
        if (dist(cur, subStart) > 1e-6) pts.push(subStart);
        cur = subStart;
        lastQuadCtl = null;
        lastCubicCtl = null;
        break;
      }
      default:
        break;
    }
  }
  return pts;
}

// ------------------------------------------------------------
// RESAMPLING BERDASARKAN PANJANG BUSUR
// ------------------------------------------------------------
function resampleByArcLength(pts: Pt[], sampleCount: number): Pt[] {
  if (pts.length < 2) return pts.slice();
  const lens: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += dist(pts[i - 1], pts[i]);
    lens.push(total);
  }
  if (total < 1e-9) return [pts[0], pts[pts.length - 1]];

  // Menghasilkan tepat `n` titik: titik awal, n-2 titik tengah berjarak
  // seragam menurut panjang busur, lalu titik akhir TANPA duplikasi
  // (duplikat membuat normal di ujung path salah arah).
  const n = Math.max(2, Math.round(sampleCount));
  const out: Pt[] = [pts[0]];
  const midCount = Math.max(0, n - 2);
  let seg = 0;
  for (let k = 1; k <= midCount; k++) {
    const target = (k / (n - 1)) * total;
    while (seg < lens.length - 2 && lens[seg + 1] < target) seg++;
    const segLen = lens[seg + 1] - lens[seg];
    const f = segLen > 0 ? (target - lens[seg]) / segLen : 0;
    const a = pts[seg];
    const b = pts[seg + 1];
    out.push(POINT(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// ------------------------------------------------------------
// PEMBENTUK POLYGON OUTLINE STROKE
// ------------------------------------------------------------
export interface OutlineOptions {
  /** Jumlah titik sampling setelah resampling. Default adaptif sesuai panjang. */
  samples?: number;
  /** Tutup ujung membulat bila lebar ujung > 0 (mengikuti strokeLinecap round). */
  caps?: boolean;
  /** Cegah self-intersection di tikungan tajam dengan membatasi offset. */
  curveGuard?: boolean;
}

/**
 * Membentuk string path SVG berupa polygon tertutup untuk stroke dengan
 * lebar variabel w(t). Titik path akan disampling, digeser ke kiri & kanan
 * sejauh (lebarDasar * w(t) / 2), lalu kedua sisi digabung menjadi satu
 * polygon tertutup dan diisi (fill).
 */
export function buildOutlinePath(
  pts: Pt[],
  baseWidth: number,
  wFn: (t: number) => number,
  options: OutlineOptions = {}
): string {
  if (!pts || pts.length < 2) return '';
  const total = polylineLength(pts);
  if (total < 1e-6) return '';

  const samples =
    options.samples !== undefined && options.samples > 0
      ? Math.max(2, Math.round(options.samples))
      : Math.max(32, Math.min(600, Math.round(total / 2)));
  const caps = options.caps !== false;
  const guard = options.curveGuard !== false;

  const poly = resampleByArcLength(pts, samples);
  const n = poly.length;
  if (n < 2) return '';

  const cum: number[] = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + dist(poly[i - 1], poly[i]));

  const normals: Pt[] = new Array(n);
  const tangents: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = poly[Math.max(0, i - 1)];
    const b = poly[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const l = Math.hypot(dx, dy);
    if (l < 1e-9) {
      dx = 1;
      dy = 0;
    } else {
      dx /= l;
      dy /= l;
    }
    tangents[i] = POINT(dx, dy);
    normals[i] = POINT(-dy, dx);
  }

  const lefts: Pt[] = new Array(n);
  const rights: Pt[] = new Array(n);
  const halves: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    let w = wFn(clamp01(cum[i] / total));
    if (!isFinite(w) || w < 0) w = 0;
    const half = (baseWidth * w) / 2;
    halves[i] = half;

    // Penjaga self-intersection: offset sisi DALAM tikungan tajam dibatasi
    // radius kelengkungan, agar tidak berpotongan sendiri. Sisi luar
    // dibiarkan utuh agar tidak muncul lekukan.
    let leftHalf = half;
    let rightHalf = half;
    if (guard && half > 0) {
      const r = circumRadius(
        poly[i > 0 ? i - 1 : i],
        poly[i],
        poly[i < n - 1 ? i + 1 : i]
      );
      if (isFinite(r) && r * 0.85 < half) {
        const capped = r * 0.85;
        const tPrev = tangents[i > 0 ? i - 1 : i];
        const tNext = tangents[i < n - 1 ? i + 1 : i];
        const cross = tPrev.x * tNext.y - tPrev.y * tNext.x;
        if (cross > 0) leftHalf = capped;
        else if (cross < 0) rightHalf = capped;
        else {
          leftHalf = capped;
          rightHalf = capped;
        }
      }
    }

    lefts[i] = POINT(
      poly[i].x + normals[i].x * leftHalf,
      poly[i].y + normals[i].y * leftHalf
    );
    rights[i] = POINT(
      poly[i].x - normals[i].x * rightHalf,
      poly[i].y - normals[i].y * rightHalf
    );
  }

  const chain: Pt[] = [];
  // Sisi kiri maju (A0 → A(n-1))
  for (let i = 0; i < n; i++) chain.push(lefts[i]);

  // Tutup ujung depan: A(n-1) → B(n-1)
  const sEnd = poly[n - 1];
  const nEnd = normals[n - 1];
  const tEnd = tangents[n - 1];
  const hEnd = halves[n - 1];
  if (caps && hEnd > 0.05) {
    const steps = 6;
    for (let k = 0; k <= steps; k++) {
      const th = (k / steps) * Math.PI;
      chain.push(
        POINT(
          sEnd.x + nEnd.x * hEnd * Math.cos(th) + tEnd.x * hEnd * Math.sin(th),
          sEnd.y + nEnd.y * hEnd * Math.cos(th) + tEnd.y * hEnd * Math.sin(th)
        )
      );
    }
  }

  // Sisi kanan mundur (B(n-1) → B0)
  for (let i = n - 1; i >= 0; i--) chain.push(rights[i]);

  // Tutup ujung belakang: B0 → A0
  const sStart = poly[0];
  const nStart = normals[0];
  const tStart = tangents[0];
  const hStart = halves[0];
  if (caps && hStart > 0.05) {
    const steps = 6;
    for (let k = steps; k >= 0; k--) {
      const th = (k / steps) * Math.PI;
      chain.push(
        POINT(
          sStart.x + nStart.x * hStart * Math.cos(th) - tStart.x * hStart * Math.sin(th),
          sStart.y + nStart.y * hStart * Math.cos(th) - tStart.y * hStart * Math.sin(th)
        )
      );
    }
  }

  if (chain.length < 3) return '';
  const r2 = (v: number) => Math.round(v * 100) / 100;
  let d = `M ${r2(chain[0].x)} ${r2(chain[0].y)}`;
  for (let i = 1; i < chain.length; i++) {
    d += ` L ${r2(chain[i].x)} ${r2(chain[i].y)}`;
  }
  d += ' Z';
  return d;
}

// ------------------------------------------------------------
// CACHE (dipakai canvas agar tidak menghitung ulang tiap render)
// ------------------------------------------------------------
const outlineCache = new Map<string, string>();
const CACHE_LIMIT = 500;

/**
 * Mengubah path SVG (garis/path connector) menjadi polygon outline
 * ber-lebar variabel sesuai profil.
 */
export function outlineFromSvgPath(
  d: string,
  baseWidth: number,
  profile: StrokeProfile,
  samples?: number
): string {
  const key = `${d}\u0001${baseWidth}\u0001${profile.id}\u0001${samples ?? ''}`;
  const cached = outlineCache.get(key);
  if (cached !== undefined) return cached;

  const pts = flattenPathToPoints(d);
  const outline = buildOutlinePath(pts, baseWidth, profile.fn, { samples });

  if (outlineCache.size >= CACHE_LIMIT) {
    const oldest = outlineCache.keys().next();
    if (!oldest.done) outlineCache.delete(oldest.value);
  }
  outlineCache.set(key, outline);
  return outline;
}

// ------------------------------------------------------------
// BENTUK TERTUTUP (kotak/pill/lingkaran) — bingkai profil stroke
// ------------------------------------------------------------
/** Path rounded-rect (px). r=0 → sudut tajam. */
export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return roundedRectPath4(x, y, w, h, rr, rr, rr, rr);
}

/**
 * Path rounded-rect dengan radius sudut berbeda: [tl, tr, br, bl].
 * r=0 untuk sudut tajam.
 */
export function roundedRectPath4(
  x: number,
  y: number,
  w: number,
  h: number,
  r1: number,
  r2: number,
  r3: number,
  r4: number
): string {
  const cap = Math.min(w / 2, h / 2);
  const R = (v: number) => Math.max(0, Math.min(v, cap));
  const a = R(r1);
  const b = R(r2);
  const c = R(r3);
  const d = R(r4);
  const n = (v: number) => Math.round(v * 100) / 100;
  if (a + b + c + d <= 0.01) {
    return `M ${n(x)} ${n(y)} L ${n(x + w)} ${n(y)} L ${n(x + w)} ${n(
      y + h
    )} L ${n(x)} ${n(y + h)} Z`;
  }
  return (
    `M ${n(x + a)} ${n(y)}` +
    ` L ${n(x + w - b)} ${n(y)}` +
    ` Q ${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + b)}` +
    ` L ${n(x + w)} ${n(y + h - c)}` +
    ` Q ${n(x + w)} ${n(y + h)} ${n(x + w - c)} ${n(y + h)}` +
    ` L ${n(x + d)} ${n(y + h)}` +
    ` Q ${n(x)} ${n(y + h)} ${n(x)} ${n(y + h - d)}` +
    ` L ${n(x)} ${n(y + a)}` +
    ` Q ${n(x)} ${n(y)} ${n(x + a)} ${n(y)} Z`
  );
}

/** Path lingkaran (px). */
export function circlePath(cx: number, cy: number, r: number): string {
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return (
    `M ${r2(cx - r)} ${r2(cy)}` +
    ` A ${r2(r)} ${r2(r)} 0 1 0 ${r2(cx + r)} ${r2(cy)}` +
    ` A ${r2(r)} ${r2(r)} 0 1 0 ${r2(cx - r)} ${r2(cy)} Z`
  );
}

/**
 * Polygon "pita" (band) lebar variabel untuk bentuk TERTUTUP. Menghasilkan
 * dua sub-loop (sisi luar & dalam) yang diisi dengan aturan even-odd,
 * sehingga terbentuk bingkai dengan ketebalan mengikuti w(t) di sekeliling
 * keliling bentuk. Titik masukan adalah loop tertutup (titik awal = akhir).
 */
export function buildClosedOutlinePath(
  pts: Pt[],
  baseWidth: number,
  wFn: (t: number) => number,
  options: OutlineOptions = {}
): string {
  if (!pts || pts.length < 3) return '';
  let loop = pts.slice();
  if (dist(loop[0], loop[loop.length - 1]) < 1e-6) loop = loop.slice(0, -1);
  const n0 = loop.length;
  if (n0 < 3) return '';

  const segLen: number[] = [];
  let total = 0;
  for (let i = 0; i < n0; i++) {
    const l = dist(loop[i], loop[(i + 1) % n0]);
    segLen.push(l);
    total += l;
  }
  if (total < 1e-6) return '';

  const samples =
    options.samples !== undefined && options.samples > 0
      ? Math.max(8, Math.round(options.samples))
      : Math.max(48, Math.min(800, Math.round(total / 2)));
  const guard = options.curveGuard !== false;

  const cum: number[] = [0];
  for (let i = 0; i < n0; i++) cum.push(cum[i] + segLen[i]);

  const poly: Pt[] = new Array(samples);
  let seg = 0;
  for (let k = 0; k < samples; k++) {
    const target = (k / samples) * total;
    while (seg < n0 - 1 && cum[seg + 1] < target) seg++;
    const sl = cum[seg + 1] - cum[seg];
    const f = sl > 0 ? (target - cum[seg]) / sl : 0;
    const a = loop[seg];
    const b = loop[(seg + 1) % n0];
    poly[k] = POINT(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
  }

  const n = poly.length;
  const tangents: Pt[] = new Array(n);
  const normals: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = poly[(i - 1 + n) % n];
    const b = poly[(i + 1) % n];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const l = Math.hypot(dx, dy);
    if (l < 1e-9) {
      dx = 1;
      dy = 0;
    } else {
      dx /= l;
      dy /= l;
    }
    tangents[i] = POINT(dx, dy);
    normals[i] = POINT(-dy, dx);
  }

  const lefts: Pt[] = new Array(n);
  const rights: Pt[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let w = wFn(clamp01(i / n));
    if (!isFinite(w) || w < 0) w = 0;
    const half = (baseWidth * w) / 2;
    let leftHalf = half;
    let rightHalf = half;
    if (guard && half > 0) {
      const r = circumRadius(
        poly[(i - 1 + n) % n],
        poly[i],
        poly[(i + 1) % n]
      );
      if (isFinite(r) && r * 0.85 < half) {
        const capped = r * 0.85;
        const tp = tangents[(i - 1 + n) % n];
        const tn = tangents[(i + 1) % n];
        const cross = tp.x * tn.y - tp.y * tn.x;
        if (cross > 0) leftHalf = capped;
        else if (cross < 0) rightHalf = capped;
        else {
          leftHalf = capped;
          rightHalf = capped;
        }
      }
    }
    lefts[i] = POINT(
      poly[i].x + normals[i].x * leftHalf,
      poly[i].y + normals[i].y * leftHalf
    );
    rights[i] = POINT(
      poly[i].x - normals[i].x * rightHalf,
      poly[i].y - normals[i].y * rightHalf
    );
  }

  const r2 = (v: number) => Math.round(v * 100) / 100;
  const loopPath = (arr: Pt[]): string => {
    let d = `M ${r2(arr[0].x)} ${r2(arr[0].y)}`;
    for (let i = 1; i < n; i++) d += ` L ${r2(arr[i].x)} ${r2(arr[i].y)}`;
    return d + ' Z';
  };
  return `${loopPath(lefts)} ${loopPath(rights)}`;
}

const closedCache = new Map<string, string>();

/**
 * Versi cache dari buildClosedOutlinePath untuk sebuah path SVG bentuk
 * tertutup (rounded-rect / lingkaran).
 */
export function closedOutlineFromSvgPath(
  d: string,
  baseWidth: number,
  profile: StrokeProfile,
  samples?: number
): string {
  const key = `C\u0001${d}\u0001${baseWidth}\u0001${profile.id}\u0001${samples ?? ''}`;
  const cached = closedCache.get(key);
  if (cached !== undefined) return cached;

  const pts = flattenPathToPoints(d);
  const outline = buildClosedOutlinePath(pts, baseWidth, profile.fn, { samples });

  if (closedCache.size >= CACHE_LIMIT) {
    const oldest = closedCache.keys().next();
    if (!oldest.done) closedCache.delete(oldest.value);
  }
  closedCache.set(key, outline);
  return outline;
}

// ------------------------------------------------------------
// PREVIEW SILUET UNTUK DROPDOWN
// ------------------------------------------------------------
const previewCache = new Map<string, string>();

/**
 * Path SVG siluet profil pada garis lurus horizontal, untuk pratinjau
 * di dropdown. Koordinat memakai viewBox yang sama dengan ukuran kotak.
 */
export function profilePreviewPath(
  profileId: string,
  width = 70,
  height = 25
): string {
  const key = `${profileId}:${width}:${height}`;
  const cached = previewCache.get(key);
  if (cached !== undefined) return cached;

  const profile = getStrokeProfile(profileId);
  const x0 = 9;
  const x1 = width - 9;
  const base = Math.min(height - 8, 16);
  const pts = [POINT(x0, height / 2), POINT(x1, height / 2)];
  const d = buildOutlinePath(pts, base, profile.fn, { samples: 56, caps: true });
  previewCache.set(key, d);
  return d;
}
