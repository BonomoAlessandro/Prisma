// Texturen der Bretter rechnen (Ticket 05 von .scratch/umbau/, bis dahin in src/seite/texturen.js und
// src/seite/brett/brett.js): je Art eines Bretts eine Funktion, die aus ihren Angaben die Pixel der Texturen rechnet
// ({ name: Uint8ClampedArray }), ohne Bezug auf die Seite. Der Worker src/brettdaten-worker.ts importiert sie, und
// boardTextures (src/seite/texturen.js) rechnet damit im Hauptthread, wo es keinen Worker gibt. BRETT_DATEN nennt sie
// unter einem festen Namen, über den Seite und Worker sich verständigen. Bis Ticket 05 bekam der Worker den Text dieser
// Funktionen (Blob), darum durfte das Verkleinern die Namen nicht ändern.
import { mulberry32 } from './zufall.js';

// Deterministischer Zufall (mulberry32), damit das Steinbrett bei jedem Laden gleich aussieht.
function makeNoise2D(seed) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const grad = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; grad[i] = rand(); }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const fade = t => t * t * (3 - 2 * t);
  // Value-Noise im Bereich [0,1]
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const a = grad[perm[perm[X] + Y]], b = grad[perm[perm[X + 1] + Y]];
    const c = grad[perm[perm[X] + Y + 1]], d = grad[perm[perm[X + 1] + Y + 1]];
    const u = fade(xf), v = fade(yf);
    return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
  };
}

/** Farbe, Rauheit und Normalen des Steinbretts (createStoneTextures), ohne Bezug auf das übrige Spiel (Worker). */
function stoneData(size) {
  const noise = makeNoise2D(7);
  // Jede Oktave gedreht (~37°) und versetzt, damit sich Strukturen nicht in mehreren Grössen wiederholen
  const ROT_C = Math.cos(0.65), ROT_S = Math.sin(0.65);
  const fbm = (x, y, oct) => {
    let s = 0, a = 0.5;
    for (let i = 0; i < oct; i++) {
      s += a * noise(x, y);
      const nx = (x * ROT_C - y * ROT_S) * 2.03 + 17.1;
      y = (x * ROT_S + y * ROT_C) * 2.03 + 5.3;
      x = nx;
      a *= 0.5;
    }
    return s;
  };

  const n = size * size;
  const height = new Float32Array(n);
  const color = new Uint8ClampedArray(n * 4);
  const rough = new Uint8ClampedArray(n * 4); // three.js liest die Rauheit aus dem G-Kanal

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const u = x / size * 6, v = y / size * 6;

      const base = fbm(u, v, 5);
      const warp = fbm(u * 0.6 + 11.3, v * 0.6 + 4.1, 4);
      // Adern als Höhenlinie eines verzerrten Rauschfelds: organisches, nicht periodisches Netz
      const rn = fbm(u * 0.7 + warp * 2.2 + 3.1, v * 0.7 - warp * 1.7 + 8.4, 4);
      const vein = Math.pow(Math.max(0, 1 - Math.abs(rn * 2 - 1) * 9), 2.2);
      const cloud = fbm(u * 0.35 + 3.7, v * 0.35 + 9.2, 3);

      height[i] = base * 0.5 + vein * 0.08;

      // Farbe (sRGB): tiefes Schiefer mit leichtem Blaustich und grossen, ruhigen Wolken
      const tone = 0.85 + cloud * 0.3;
      color[i * 4] = (13 + base * 11 + vein * 15) * tone;
      color[i * 4 + 1] = (13 + base * 11 + vein * 15) * tone;
      color[i * 4 + 2] = (17 + base * 14 + vein * 20) * tone;
      color[i * 4 + 3] = 255;

      // Rauheit: poliert, Adern noch etwas glatter
      const ro = Math.max(0, Math.min(1, 0.30 + (base - 0.5) * 0.25 - vein * 0.12));
      rough[i * 4] = 255; rough[i * 4 + 1] = ro * 255; rough[i * 4 + 2] = 255; rough[i * 4 + 3] = 255;
    }
  }

  // Normal-Map aus der Höhenkarte (Sobel) – bewusst sanft
  const normal = new Uint8ClampedArray(n * 4);
  const strength = 1.4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xm = Math.max(0, x - 1), xp = Math.min(size - 1, x + 1);
      const ym = Math.max(0, y - 1), yp = Math.min(size - 1, y + 1);
      const dx = (height[y * size + xp] - height[y * size + xm]) * strength;
      const dy = (height[yp * size + x] - height[ym * size + x]) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      normal[i] = (-dx / len * 0.5 + 0.5) * 255;
      normal[i + 1] = (dy / len * 0.5 + 0.5) * 255;
      normal[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;
    }
  }

  return { map: color, roughnessMap: rough, normalMap: normal };
}

/**
 * Farbe, Rauheit, Normalen und Seiten des Gezeitenbeckens (tidePoolBoard), ohne Bezug auf das übrige Spiel (Worker).
 * Formeln und Farben aus Karte 6 des Skizzenkatalogs (.scratch/brett-je-himmel/katalog/bretter/varianten/6-wasserrand.js):
 * Feld aus hellem Sandstein in Schichten, am Rand zum Wasser dunkel und nass; in der Rinne klares Wasser über Sand mit
 * Lichtnetz, Schaum an beiden Kanten und leichten Wellen; aussen eine Felslippe. Seiten: nasser Fels mit Rinnsalen,
 * unten Algen. a: { size (Oberfläche size², Seiten size × sideH), sideH, plate (Umriss, m), stone, water, rock (je zwei
 * Farben, sRGB 0 … 1), channel ([innen, aussen], Kastenabstand von der Mitte in m) }.
 */
function tidePoolData(a) {
  // Wertrauschen wie im Katalog: Gitter aus Hash-Werten, je Oktave mit eigenem Samen
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const p = hash(xi, yi, s), q = hash(xi + 1, yi, s), r = hash(xi, yi + 1, s), t = hash(xi + 1, yi + 1, s);
    return p + (q - p) * u + (r - p) * v + (p - q - r + t) * u * v;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const mix = (p, q, t) => p + (q - p) * t;
  const mix3 = (p, q, t) => [mix(p[0], q[0], t), mix(p[1], q[1], t), mix(p[2], q[2], t)];
  const N = a.size, P = a.plate, [IN, OUT] = a.channel, [stone, stone2] = a.stone;
  const [water, water2] = a.water, [lip, lip2] = a.rock;

  const map = new Uint8ClampedArray(N * N * 4), roughnessMap = new Uint8ClampedArray(N * N * 4);
  const height = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    const z = (0.5 - (j + 0.5) / N) * P; // Zeile 0 bei uv.y = 0, also vorn (z = +P / 2)
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N - 0.5) * P, k = j * N + i;
      const box = Math.max(Math.abs(x), Math.abs(z));
      const g = fbm(x * 0.5, z * 0.5, 5, 81), layer = fbm(x * 0.15 + g, z * 2.5, 3, 82), fine = noise(x * 150, z * 150, 83);
      let c, r, h;
      if (box < IN) {
        // Sandstein in Schichten, feines Korn; zum Wasser hin dunkel und nass
        c = mix3(stone, stone2, smooth(0.3, 0.75, layer));
        c = mix3(c, [c[0] * 0.92, c[1] * 0.9, c[2] * 0.9], fine * 0.5);
        const wetEdge = smooth(IN - 0.12, IN, box);
        c = mix3(c, [c[0] * 0.72, c[1] * 0.7, c[2] * 0.7], wetEdge);
        r = 0.86 - wetEdge * 0.4;
        h = (layer - 0.5) * 0.002 + (fine - 0.5) * 0.0005;
      } else if (box < OUT) {
        // Wasser: Grund (Sand, Kiesel) türkis getönt, Lichtnetz (Kaustik), Schaum an den Kanten
        const cx = Math.abs(fbm(x * 2.2 + 3, z * 2.2, 3, 84) - 0.5), cz = Math.abs(fbm(x * 2.2, z * 2.2 + 7, 3, 85) - 0.5);
        const caustic = Math.pow(Math.max(0, 1 - Math.min(cx, cz) * 4.2), 6);
        c = mix3(water, water2, g);
        c = mix3(c, [0.86, 0.97, 0.92], clamp(caustic) * 0.55);
        const foamIn = smooth(IN + 0.07 + (noise(x * 9, z * 9, 86) - 0.5) * 0.06, IN, box);
        const foamOut = smooth(OUT - 0.05 + (noise(x * 11, z * 11, 87) - 0.5) * 0.04, OUT, box) * 0.6;
        const foam = clamp(foamIn + foamOut) * (0.6 + 0.4 * noise(x * 40, z * 40, 88));
        c = mix3(c, [0.95, 0.97, 0.95], foam);
        r = mix(0.03, 0.7, foam);
        h = -0.004 + Math.sin((x * 0.7 + z * 0.7) * 22 + fbm(x, z, 2, 89) * 6) * 0.0012
          + (noise(x * 30, z * 30, 90) - 0.5) * 0.0008;
      } else {
        c = mix3(lip, lip2, fbm(x * 3, z * 3, 3, 91)); // Felslippe
        r = 0.7;
        h = 0.006 + (fine - 0.5) * 0.002;
      }
      map[k * 4] = c[0] * 255; map[k * 4 + 1] = c[1] * 255; map[k * 4 + 2] = c[2] * 255; map[k * 4 + 3] = 255;
      roughnessMap[k * 4] = roughnessMap[k * 4 + 1] = roughnessMap[k * 4 + 2] = r * 255; // three liest G
      roughnessMap[k * 4 + 3] = 255;
      height[k] = h;
    }
  }
  // Normalen aus den Höhen (Tangentenraum: x nach rechts, uv.y nach hinten)
  const normalMap = new Uint8ClampedArray(N * N * 4), texel = P / N;
  const H = (i, j) => height[Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const dx = (H(i + 1, j) - H(i - 1, j)) / (2 * texel), dv = (H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(dx, dv, 1), k = (j * N + i) * 4;
      normalMap[k] = (-dx / l * 0.5 + 0.5) * 255;
      normalMap[k + 1] = (-dv / l * 0.5 + 0.5) * 255;
      normalMap[k + 2] = (1 / l * 0.5 + 0.5) * 255;
      normalMap[k + 3] = 255;
    }
  }
  // Seiten (Box-UV, je Seite u über die ganze Länge, v 0 oben … 1 unten): nasser Fels, dunkle Rinnsale, unten Algen
  const SH = a.sideH, side = new Uint8ClampedArray(N * SH * 4);
  for (let j = 0; j < SH; j++) {
    const v = 1 - (j + 0.5) / SH;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N * P, k = (j * N + i) * 4;
      const g = fbm(u * 1.4, v * 3, 4, 92), streak = fbm(u * 18, v * 0.6, 3, 93);
      let c = mix3(lip, lip2, smooth(0.3, 0.7, g));
      c = mix3(c, [0.22, 0.20, 0.22], smooth(0.55, 0.75, streak) * 0.7);
      c = mix3(c, [0.28, 0.34, 0.22], smooth(0.7, 1, v) * 0.6);
      side[k] = c[0] * 255; side[k + 1] = c[1] * 255; side[k + 2] = c[2] * 255; side[k + 3] = 255;
    }
  }
  return { map, roughnessMap, normalMap, side };
}

/**
 * Farbe und Normalen der Lehmterrasse (createClayTextures), ohne Bezug auf das übrige Spiel (Worker). Formeln und Farben
 * aus dem Katalog (katalog-wueste, 2-lehm.js), die Höhen ungerundet. Feld size² über das ganze Brett (Zeile j bei
 * uv.y = (j + ½) / size, also z von +plate/2 nach −plate/2): glatter Lehmputz in zwei Tönen (plaster) mit Kellenstrichen
 * und Strohhalmen (straw), im Rand (ab half + 0,26 m) stellenweise abgeplatzt, dort Ziegel (brick, zwei Töne) mit Fugen
 * (joint). Wand wallW × wallH: Putz mit Regenrinnen (gully). Farben sRGB 0 … 1 (v: Werte der Brett-Angabe).
 */
function clayData({ size, plate, half, wallW, wallH, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const put = (out, k, c) => { out[k] = c[0] * 255; out[k + 1] = c[1] * 255; out[k + 2] = c[2] * 255; out[k + 3] = 255; };

  const n = size * size, texel = plate / size;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = j * size + i, box = Math.max(Math.abs(x), Math.abs(z));
      const g = fbm(x * 0.4, z * 0.4, 4, 82), straw = noise(x * 160, z * 160, 83);
      // Kellenstriche: flache Bögen
      const sw = Math.sin(Math.hypot(x - Math.round(x / 0.9) * 0.9, z - Math.round(z / 0.9) * 0.9 + 0.4) * 22 + g * 4);
      let c = mix(v.plaster[0], v.plaster[1], smooth(0.3, 0.75, g));
      if (straw > 0.9) c = mix(c, v.straw, 0.5);
      let h = sw * 0.0004 + (straw - 0.5) * 0.0004;
      if (box > half + 0.26) { // Rand: Putz stellenweise abgeplatzt, Ziegel sichtbar
        const off = smooth(0.52, 0.56, fbm(x * 1.6, z * 1.6, 3, 84));
        const bx = (Math.abs(x) > Math.abs(z) ? z : x) / 0.32, by = box / 0.12, row = Math.floor(by);
        const joint = Math.abs(by - row - 0.5) > 0.42 || Math.abs((((bx + row * 0.5) % 1) + 1) % 1 - 0.5) > 0.45;
        const brick = mix(v.brick[0], v.brick[1], noise(Math.floor(bx + row * 0.5), row, 85));
        c = mix(c, joint ? v.joint : brick, off);
        h -= off * 0.004 + (joint ? off * 0.002 : 0);
      }
      put(color, k * 4, c);
      height[k] = h;
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1);
      put(normal, (j * size + i) * 4, [(nx / l) * 0.5 + 0.5, (ny / l) * 0.5 + 0.5, (1 / l) * 0.5 + 0.5]);
    }
  }
  const wall = new Uint8ClampedArray(wallW * wallH * 4);
  for (let j = 0; j < wallH; j++) {
    const y = 1 - (j + 0.5) / wallH; // 0 oben … 1 unten (Zeile 0 liegt unten)
    for (let i = 0; i < wallW; i++) {
      const u = ((i + 0.5) / wallW) * plate;
      const g = fbm(u * 1.5, y * 2, 3, 86), gully = smooth(0.62, 0.8, fbm(u * 9, y * 0.5, 2, 87));
      put(wall, (j * wallW + i) * 4, mix(mix(v.plaster[0], v.plaster[1], g), v.gully, gully * 0.6));
    }
  }
  return { map: color, normalMap: normal, wallMap: wall };
}

/**
 * Farbe und Normalen des Hochbeets (raisedBedBoard), ohne Bezug auf das übrige Spiel (Worker). Formeln aus dem Katalog
 * (katalog-dorf, 4-hochbeet.js), die Wiese aus der Vorschau vom 10.11.2026 (PLAN). Feld size² über das ganze Brett
 * (Zeile j bei uv.y = (j + ½) / size, also z von +plate/2 nach −plate/2): im Feld eine Wiese aus Grasbüscheln (grass
 * [dunkel, hell], Spitzen grassTip) mit dunklen Lücken, Gänseblümchen und Klee in Grüppchen; im Rand dunkle Erde in
 * zwei Tönen (soil) mit Krumen und Mulch (mulch), da und dort ein Steinchen. Seiten sideW × sideH: Lärchenbohlen
 * (larch, zwei Töne) mit Fugen und Schrauben, das Abdeckbrett capW × capH ebenso. Farben sRGB 0 … 1 (v: Werte der
 * Brett-Angabe).
 */
function raisedBedData({ size, plate, half, rim, sideW, sideH, capW, capH, depth, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const put = (out, k, c) => { out[k] = c[0] * 255; out[k + 1] = c[1] * 255; out[k + 2] = c[2] * 255; out[k + 3] = 255; };

  const n = size * size, texel = plate / size, grit = mix(v.soil[0], v.pebble, 0.25), field = half + 0.02;
  const ground = [v.grass[0].map((x) => x * 0.35), v.grass[0].map((x) => x * 0.7)]; // Grund der Wiese
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = j * size + i, box = Math.max(Math.abs(x), Math.abs(z));
      const clod = fbm(x * 9, z * 9, 3, 413);
      if (box < field) { // Wiese: Grund zwischen den Grasbüscheln (dunkles Gras), die Büschel folgen unten
        put(color, k * 4, mix(ground[0], ground[1], clod));
        height[k] = (clod - 0.5) * 0.002;
        continue;
      }
      const crumb = noise(x * 70, z * 70, 412);
      let c = mix(v.soil[1], v.soil[0], clod * 0.7 + crumb * 0.5);
      let h = (crumb - 0.5) * 0.002 + (clod - 0.5) * 0.004;
      if (box < rim) { // Mulch, Stroh zwischen den Kräutern
        c = mix(c, v.mulch, smooth(0.55, 0.8, noise(x * 30, z * 30, 415)) * 0.6);
      }
      if (crumb > 0.93) c = grit; // Steinchen
      put(color, k * 4, c);
      height[k] = h;
    }
  }
  // Grasbüschel etwa alle 4,5 cm: Halme strahlen von einer Mitte aus und werden zur Spitze heller (grassTip); grosse
  // Flecken heller und dunkler, jedes Büschel etwas anders. Die Mitten liegen im Feld, an seinem Rand reichen Halme bis
  // 6 cm auf die Erde
  let seed = 977;
  const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const at = (x, z) => [Math.round((x + plate / 2) / texel - 0.5), Math.round((plate / 2 - z) / texel - 0.5)];
  const gap = 0.045;
  for (let gz = -field; gz < field; gz += gap) {
    for (let gx = -field; gx < field; gx += gap) {
      const x0 = gx + r() * gap, z0 = gz + r() * gap;
      if (Math.max(Math.abs(x0), Math.abs(z0)) > field) continue;
      const patch = fbm(x0 * 0.9, z0 * 0.9, 3, 416), q = (0.7 + patch * 0.6) * (0.85 + r() * 0.3) * 255;
      const base = mix(v.grass[0], v.grass[1], smooth(0.3, 0.75, patch) * 0.8 + r() * 0.2);
      const blades = 9 + Math.floor(r() * 8), reach = 0.02 + r() * 0.035, [i0, j0] = at(x0, z0);
      for (let b = 0; b < blades; b++) {
        const lay = r() * 6.283, len = (reach * (0.5 + r() * 0.7)) / texel, dx = Math.cos(lay), dz = Math.sin(lay);
        for (let t = 0; t <= len; t++) { // ohne Arrays je Pixel (mit ihnen dauerte es doppelt so lange)
          const i = Math.round(i0 + dx * t), j = Math.round(j0 - dz * t);
          if (i < 0 || j < 0 || i >= size || j >= size) break;
          const f = t / len, k = j * size + i, dark = 0.75 + f * 0.25, w = f * f * 0.7;
          for (let ch = 0; ch < 3; ch++) color[k * 4 + ch] = (base[ch] * dark * (1 - w) + v.grassTip[ch] * w) * q;
          height[k] = Math.max(height[k], 0.004 * (1 - f * 0.5));
        }
      }
    }
  }
  // Blumen, 14 je m²: Gänseblümchen (daisy, Mitte daisyHeart) und Klee (clover), je ein kleiner Tupfer, in Grüppchen um
  // wenige Mitten verstreut, dazwischen einzelne
  const flowers = Math.round((2 * field) ** 2 * 14);
  const groups = Array.from({ length: Math.round(flowers / 25) }, () => [(r() * 2 - 1) * field, (r() * 2 - 1) * field]);
  for (let b = 0; b < flowers; b++) {
    const g = groups[Math.floor(r() * groups.length)], lone = r() < 0.2, sp = 0.05 + r() * 0.2, a = r() * 6.283;
    const x0 = lone ? (r() * 2 - 1) * field : g[0] + Math.cos(a) * sp, z0 = lone ? (r() * 2 - 1) * field : g[1] + Math.sin(a) * sp;
    if (Math.max(Math.abs(x0), Math.abs(z0)) > field) continue;
    const [i0, j0] = at(x0, z0), clover = r() < 0.35, rad = (clover ? 0.006 : 0.008) / texel + 0.5;
    for (let dj = -Math.ceil(rad); dj <= Math.ceil(rad); dj++) {
      for (let di = -Math.ceil(rad); di <= Math.ceil(rad); di++) {
        const d = Math.hypot(di, dj), i = i0 + di, j = j0 + dj;
        if (d > rad || i < 0 || j < 0 || i >= size || j >= size) continue;
        put(color, (j * size + i) * 4, clover ? v.clover : d < rad * 0.4 ? v.daisyHeart : v.daisy);
        height[j * size + i] = 0.002;
      }
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1);
      put(normal, (j * size + i) * 4, [(nx / l) * 0.5 + 0.5, (ny / l) * 0.5 + 0.5, (1 / l) * 0.5 + 0.5]);
    }
  }
  // Lärchenbohlen: Maserung längs, jede Bohle (id) etwas anders
  const plank = (u, w, id) => mix(v.larch[1], v.larch[0], fbm(u * 0.7 + id * 3.3, w * 30, 3, 416) * 0.8
    + noise(id, 0.5, 417) * 0.3);
  const side = new Uint8ClampedArray(sideW * sideH * 4);
  for (let j = 0; j < sideH; j++) {
    const y = (1 - (j + 0.5) / sideH) * depth / 0.2, b = Math.floor(y), fb = y - b; // Zeile 0 liegt unten
    for (let i = 0; i < sideW; i++) {
      const u = ((i + 0.5) / sideW) * plate, sx = (u % 1.4) / 1.4;
      let c = plank(u, fb, b + Math.floor(u / 3.3) * 7);
      if (fb < 0.03 || fb > 0.97) c = c.map((x) => x * 0.35); // Fugen
      if (Math.abs(sx - 0.5) < 0.004 && Math.abs(fb - 0.5) < 0.05) c = [0.1, 0.1, 0.1]; // Schrauben
      put(side, (j * sideW + i) * 4, c);
    }
  }
  const cap = new Uint8ClampedArray(capW * capH * 4);
  for (let j = 0; j < capH; j++) {
    const w = (j + 0.5) / capH, edge = w < 0.08 || w > 0.92 ? 0.7 : 1;
    for (let i = 0; i < capW; i++) {
      put(cap, (j * capW + i) * 4, plank(((i + 0.5) / capW) * plate, w, 31).map((x) => x * edge));
    }
  }
  return { map: color, normalMap: normal, side, cap };
}

/**
 * Farbe und Normalen des Moospolsters, die Erdscholle und das Moos der Polster (mossBoard), ohne Bezug auf das übrige
 * Spiel (Worker). Formeln und Farben aus dem Katalog (katalog-wald, 2-moos.js), die Höhen ungerundet. Feld size² über das
 * ganze Brett (Zeile j bei z = plate/2 − (j + ½) · plate/size): kurzes Samtmoos in zwei Tönen (moss) mit hellen Spitzen
 * (tip) und Flecken (gold, im Katalog golden), im Feld ruhiger; im Rand unter den Polstern Nadelstreu (litter). Seiten
 * sideW × sideH: Humus (soil) mit Steinen (pebble) und Wurzelfäden (thread), oben hängt Moos über die Kante. Polster
 * cushion²: Moos, nahtlos wiederholbar. v: Werte der Brett-Angabe.
 */
function mossData({ size, plate, half, sideW, sideH, cushion, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  // Wertrauschen; mit p periodisch (Gitter modulo p), für das wiederholte Moos der Polster
  const noise = (x, y, s, p = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const X = (i) => (p ? ((i % p) + p) % p : i);
    const a = hash(X(xi), X(yi), s), b = hash(X(xi + 1), X(yi), s), c = hash(X(xi), X(yi + 1), s);
    const d = hash(X(xi + 1), X(yi + 1), s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const put = (out, k, c) => { out[k] = c[0] * 255; out[k + 1] = c[1] * 255; out[k + 2] = c[2] * 255; out[k + 3] = 255; };

  const n = size * size, texel = plate / size;
  const color = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = j * size + i, box = Math.max(Math.abs(x), Math.abs(z));
      const clump = fbm(x * 14, z * 14, 3, 302), tip = noise(x * 150, z * 150, 303), patch = fbm(x * 0.55, z * 0.55, 3, 304);
      const inF = 1 - smooth(half, half + 0.12, box), a = smooth(0.28, 0.72, clump);
      let c = mix(v.moss[0], v.moss[1], a + (0.55 + (clump - 0.5) * 0.5 - a) * inF); // im Feld ruhiger
      c = mix(c, v.tip, tip * 0.35 * smooth(0.3, 0.8, clump));
      c = mix(c, v.gold, smooth(0.5, 0.8, patch) * 0.3);
      if (box > half + 0.12) { // Rand: unter den Polstern Nadelstreu
        const nd = Math.abs(Math.sin(x * 60 + noise(x * 3, z * 3, 305) * 9) * Math.sin(z * 55 + noise(z * 3, x * 3, 306) * 9)) ** 8;
        c = mix(c, v.litter, smooth(half + 0.12, half + 0.3, box) * (0.4 + nd * 0.5));
      }
      put(color, k * 4, c);
      height[k] = (clump - 0.5) * 0.008 + (tip - 0.5) * 0.0015;
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1);
      put(normal, (j * size + i) * 4, [(nx / l) * 0.5 + 0.5, (ny / l) * 0.5 + 0.5, (1 / l) * 0.5 + 0.5]);
    }
  }
  // Erdscholle: oben Moos, das über die Kante hängt, darunter Humus mit Steinen und Wurzelfäden
  const side = new Uint8ClampedArray(sideW * sideH * 4);
  for (let j = 0; j < sideH; j++) {
    const y = 1 - (j + 0.5) / sideH; // 0 oben … 1 unten (Zeile 0 liegt unten)
    for (let i = 0; i < sideW; i++) {
      const u = ((i + 0.5) / sideW) * plate;
      const drip = 0.18 + fbm(u * 3, 0.5, 3, 307) * 0.22 + noise(u * 9, 1, 308) ** 4 * 0.25;
      const stone = smooth(0.66, 0.72, fbm(u * 6, y * 2.2, 3, 309)), soil = fbm(u * 20, y * 6, 4, 310);
      let c = mix(v.soil[0], v.soil[1], soil);
      c = mix(c, v.pebble, stone * (0.7 + noise(u * 40, y * 10, 311) * 0.3));
      const thread = 1 - smooth(0, 0.04, Math.abs(Math.sin(u * 7 + y * 3 + fbm(u * 2, y, 2, 312) * 6)));
      c = mix(c, v.thread, thread * smooth(0.3, 0.5, y) * 0.5);
      put(side, (j * sideW + i) * 4, mix(c, mix(v.moss[0], v.moss[1], noise(u * 30, y * 8, 313)),
        1 - smooth(drip - 0.03, drip + 0.03, y)));
    }
  }
  // Moos der Polster: grob und fein, im Gitter periodisch (nahtlos über die Kugel wiederholt)
  const cush = new Uint8ClampedArray(cushion * cushion * 4), f1 = 180, f2 = 41; // Zellen über die Breite
  for (let j = 0; j < cushion; j++) {
    for (let i = 0; i < cushion; i++) {
      const t = noise(i * f1 / cushion, j * f1 / cushion, 314, f1) * 0.6 + noise(i * f2 / cushion, j * f2 / cushion, 315, f2) * 0.4;
      put(cush, (j * cushion + i) * 4, mix(v.moss[0], v.tip, t));
    }
  }
  return { map: color, normalMap: normal, side, cushion: cush };
}

/**
 * Farbe, Rauheit und Normalen der Oberfläche der Basaltsäulen (basaltBoard), ohne Bezug auf das übrige Spiel (Worker).
 * Formeln und Farben aus dem Katalog (katalog-vulkan, 2-basalt.js), die Höhen ungerundet. size² über das ganze Brett
 * (Zeile j bei uv.y = (j + ½) / size, also z von +plate/2 nach −plate/2): je Säule ein Ton zwischen basalt[1] und
 * basalt[0], wolkig getönt (tint), ihr Rand etwas heller geschliffen (lip), die Fugen dunkel (joint) und vertieft.
 * Ausserhalb der Säulen des Felds (field, Kastenabstand ihrer Mitte) ist sie durchsichtig (Alpha 0): Dort stehen die
 * Säulen des Rands als Körper. Rauheit im G-Kanal wie bei three, im R-Kanal die Fugen für die Glut der Lichtwelle.
 * a: { size, plate, field, r (Umkreis einer Säule), v (Werte der Brett-Angabe) }.
 */
function basaltData({ size, plate, field, r: R, v }) {
  const hash = (x, y, s) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  const fbm = (x, y, oct, s) => {
    let sum = 0, amp = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { sum += amp * noise(x * f, y * f, s + i * 17); n += amp; amp *= 0.5; f *= 2.03; }
    return sum / n;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // Wabe unter (x, z): Mitte (cx, cz), Nummer, Abstand zur Kante (kubische Koordinaten, gerundet)
  const S3 = Math.sqrt(3), AP = R * S3 / 2, CS = Math.cos(Math.PI / 3), SN = Math.sin(Math.PI / 3);
  const hexAt = (x, z) => {
    const qf = (S3 / 3 * x - z / 3) / R, rf = (2 / 3 * z) / R, sf = -qf - rf;
    let q = Math.round(qf), rr = Math.round(rf);
    const s = Math.round(sf), dq = Math.abs(q - qf), dr = Math.abs(rr - rf), ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -rr - s; else if (dr > ds) rr = -q - s;
    const cx = R * S3 * (q + rr / 2), cz = R * 1.5 * rr, px = x - cx, pz = z - cz;
    const m = Math.max(Math.abs(px), Math.abs(px * CS + pz * SN), Math.abs(px * CS - pz * SN));
    return { cx, cz, id: q * 1000 + rr, edge: AP - m };
  };

  const n = size * size, texel = plate / size;
  const color = new Uint8ClampedArray(n * 4), rough = new Uint8ClampedArray(n * 4), height = new Float32Array(n);
  for (let j = 0; j < size; j++) {
    const z = plate / 2 - (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = -plate / 2 + (i + 0.5) * texel, k = (j * size + i) * 4, h = hexAt(x, z);
      if (Math.max(Math.abs(h.cx), Math.abs(h.cz)) >= field) { height[j * size + i] = -0.004; continue; } // Alpha 0
      const t = noise(h.id * 0.137, h.id * 0.071, 302);
      let c = mix(v.basalt[1], v.basalt[0], t);
      c = mix(c, v.tint, fbm(x * 2, z * 2, 3, 303) * 0.4);
      const joint = smooth(0.012, 0.004, h.edge), lip = smooth(0.045, 0.012, h.edge) * (1 - joint);
      c = mix(c, v.lip, lip * 0.5);
      c = mix(c, v.joint, joint);
      color[k] = c[0] * 255; color[k + 1] = c[1] * 255; color[k + 2] = c[2] * 255; color[k + 3] = 255;
      rough[k] = smooth(0.02, 0.004, h.edge) * 255; rough[k + 1] = (0.5 + 0.35 * joint) * 255; rough[k + 3] = 255;
      height[j * size + i] = -joint * 0.004 - lip * 0.0012 + (fbm(x * 9, z * 9, 2, 304) - 0.5) * 0.0004;
    }
  }
  // Normalen im Raum der Textur (+u = +x, +v = −z): (−∂h/∂u, −∂h/∂v, 1)
  const normal = new Uint8ClampedArray(n * 4);
  const H = (i, j) => height[Math.min(size - 1, Math.max(0, j)) * size + Math.min(size - 1, Math.max(0, i))];
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const nx = -(H(i + 1, j) - H(i - 1, j)) / (2 * texel), ny = -(H(i, j + 1) - H(i, j - 1)) / (2 * texel);
      const l = Math.hypot(nx, ny, 1), k = (j * size + i) * 4;
      normal[k] = ((nx / l) * 0.5 + 0.5) * 255; normal[k + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      normal[k + 2] = ((1 / l) * 0.5 + 0.5) * 255; normal[k + 3] = 255;
    }
  }
  return { map: color, roughnessMap: rough, normalMap: normal };
}

/** Die Rechnungen je Art unter festem Namen (boardTextures(specs, art, arg); Nachricht an den Worker: { art, arg }). */
const BRETT_DATEN = { stoneData, tidePoolData, clayData, raisedBedData, mossData, basaltData };

export { BRETT_DATEN };
