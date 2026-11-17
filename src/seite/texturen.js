// Prozedurale Texturen (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { renderer } from './szene.js';
import { mulberry32 } from '../zufall.js';

/* =====================================================================
   PROZEDURALE TEXTUREN
   ===================================================================== */

// Deterministischer Zufall (mulberry32, oben bei FIXED_TIME), damit das Steinbrett bei jedem Laden gleich aussieht.

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

/**
 * Texturen eines Bretts, im Spiel berechnet: in einem Worker (Blob wie beim Dekodieren der Skybox). Im Hauptthread
 * kostete das Steinbrett gut die Hälfte des Hängers beim Laden der Seite (Ticket 03 der Leistung; 1024² Pixel mit je 16
 * Oktaven Rauschen). Bis die Daten da sind, sind die Texturen leer (nie hochgeladen). Hochgeladen werden sie danach in
 * Häppchen an ruhigen Stellen (boardTheme.load, boardTextureUpload). Ohne Worker wie früher im Hauptthread.
 * specs: { name: [Breite, Höhe, sRGB, wiederholt] } der RGBA-Texturen (Mipmaps, Zeile 0 bei uv.y = 0); compute(arg) rechnet
 * { name: Uint8ClampedArray } und kennt nur sich selbst und helpers (Funktionen, die mit in den Worker kommen).
 * Rückgabe: { name: DataTexture, …, computed (Promise: erfüllt, sobald die Daten da sind; abgelehnt, wenn das Rechnen
 * scheitert) }.
 */
function boardTextures(specs, compute, arg, helpers = []) {
  const out = {};
  for (const [name, [w, h, srgb, repeat]] of Object.entries(specs)) {
    const tex = out[name] = new THREE.DataTexture(new Uint8ClampedArray(w * h * 4), w, h, THREE.RGBAFormat);
    tex.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.flipY = false;
    if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  }
  let done = false, fertig, gescheitert;
  out.computed = new Promise((ja, nein) => { fertig = ja; gescheitert = nein; });
  const fill = (d) => {
    if (done) return;
    done = true;
    for (const name of Object.keys(specs)) {
      out[name].image.data.set(d[name]);
      out[name].needsUpdate = true;
    }
    fertig();
  };
  const sicher = (f) => { try { f(); } catch (e) { gescheitert(e); } }; // gescheitert: das Steinbrett als Notfall
  const hier = () => sicher(() => fill(compute(arg))); // im Hauptthread
  try {
    const url = URL.createObjectURL(new Blob([`${helpers.join('\n')}\n${compute}
      onmessage = ({ data }) => { const d = ${compute.name}(data); postMessage(d, Object.values(d).map((a) => a.buffer)); };`],
    { type: 'text/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = ({ data }) => { worker.terminate(); sicher(() => fill(data)); };
    worker.onerror = () => { worker.terminate(); hier(); }; // Worker nicht ladbar (CSP): im Hauptthread
    worker.postMessage(arg);
  } catch { hier(); }
  return out;
}

/**
 * Erzeugt Farb-, Rauheits- und Normal-Map des Steinbretts: dunkler, fein
 * geäderter Schiefer. Nur die weichen, grossflächigen Strukturen stecken in
 * der Textur – scharfe Details (Rasterlinien, Intarsie, Mikrokörnung) rechnet
 * der Boden-Shader analytisch, damit sie in jeder Auflösung scharf bleiben.
 * Rückgabe: { map, roughnessMap, normalMap, computed } (boardTextures, stoneBoard).
 */
function createStoneTextures(size) {
  return boardTextures({ map: [size, size, true], roughnessMap: [size, size, false], normalMap: [size, size, false] },
    stoneData, size, [mulberry32, makeNoise2D]);
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


/** Gebürstetes Metall: feine horizontale Riefen als Rauheits-Map. */
function createBrushedTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const rand = mulberry32(3);
  ctx.fillStyle = 'rgb(110,110,110)';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 3; i++) {
    const y = rand() * size;
    const v = 80 + rand() * 90;
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fillRect(0, y, size, rand() * 1.2 + 0.3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Spiegelglas: zwei schräge Lichtstreifen (breit und schmal) als Leucht-Map – das vertraute Zeichen für Spiegel.
 * Ohne sie liest sich die dunkle Fläche im schwarzen Rahmen wie ein Bildschirm.
 */
function makeMirrorStreakTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#fff';
  ctx.filter = 'blur(1.5px)';
  for (const [x, w] of [[30, 22], [64, 8]]) {
    ctx.beginPath();
    ctx.moveTo(x, -4); ctx.lineTo(x + w, -4); ctx.lineTo(x + w - 70, 132); ctx.lineTo(x - 70, 132);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

export { boardTextures, createBrushedTexture, createStoneTextures, makeMirrorStreakTexture, tidePoolData };
