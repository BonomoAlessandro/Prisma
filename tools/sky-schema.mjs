// Register der Skyboxen aus Blender (backgrounds/skies.js) und seine Teile prüfen; genutzt von
// tools/blender/pack.mjs (vor dem Schreiben) und tests/logic.test.mjs. Das Spiel liest dasselbe Register (skyTheme).
// Ein Eintrag (format 1):
//   { format, id, name, order, rev,
//     parts: [{ role: 'base' | 'bands', file: '<id>/<name>.<rev>.js', device: 'all' | 'desktop', precache, bytes, gpuMB }],
//     panorama: { center, depth: { log }, bands: [{ u, v }], peak },
//     light: { dir }, fog?: { top, soft, core }, air?: { haze, lit, density },
//     brush?: { size?, uniformity?, sharpness?, eccentricity?, mobile? },
//     sky: { stars?, starsAboveHorizon?, milkyWay?, rings }, layers?: [{ type, brush?, … }] }
// brush: Pinselstriche über 3D-Ebenen wie Blenders Kuwahara-Filter in anime.py (createBrushPass in index.html), für
// jede Ebene mit brush: true (Standard aus). size Radius in Grad (anime.py: px_per_deg × 0.28), uniformity, sharpness
// (0 … 1), eccentricity (0 … 2) wie der Knoten im Kompositor; mobile: Stufe auf dem Handy (2 oder 3 Bildpixel je
// Filterpixel, 0 aus; sonst QUALITY.brush). Fehlende Felder: BRUSH_DEFAULT.
// Ein Teil setzt globalThis.PRISMA_SKY_PARTS['<id>/<role>'] = { rev, … }; base: full, depth, data, watermask?
// (Wassermaske für waterSurface); bands: bands, data? (ersetzt im Spiel gleichnamige Felder der Daten aus base).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

export const SKY_FORMAT = 1;
export const BUDGET = {
  registryBytes: 30e3,       // backgrounds/skies.js
  baseBytes: 2e6, baseGpuMB: 64,     // was jedes Gerät lädt
  totalBytes: 8e6, totalGpuMB: 300,  // alle Teile einer Skybox
  // alle vorab gespeicherten Teile zusammen (sw.js); mit den Felsen des Strands (PLAN 2.36) und dem Vulkan (PLAN 1.2).
  // Jede weitere Skybox kostet rund 1–2 MB: vor der nächsten entscheiden, ob base aller Skyboxen vorab kommen muss
  precacheBytes: 4.5e6,
};
export const BLOOM_THRESHOLD = 1.0; // LOOK.bloomThreshold mit HDR: hellere Werte leuchten auf

/** Skript wie im Browser ausführen; liefert das globale Objekt danach */
export function runCode(code, file = 'skript', global = {}) {
  vm.runInNewContext(code, global, { filename: file });
  return global;
}

export function loadSkies(root) {
  const file = join(root, 'backgrounds', 'skies.js');
  return existsSync(file) ? runCode(readFileSync(file, 'utf8'), file).PRISMA_SKIES ?? [] : [];
}

/** Ebenentypen, die index.html kennt (Schlüssel von SKY_LAYERS) */
export function layerTypes(html) {
  const m = html.match(/^const SKY_LAYERS = \{([^}]*)\};/m);
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
}

/** Hintergründe aus dem Code (SKY_ENTRIES in index.html): ihre id und order darf keine Skybox haben */
export function codeSkies(html) {
  const block = html.match(/^const SKY_ENTRIES = [\s\S]*?^\}\)\(\);/m)?.[0] ?? '';
  return [...block.matchAll(/\{ id: '([a-z0-9-]+)', name: '[^']*', order: (\d+)/g)].map((m) => ({ id: m[1], order: +m[2] }));
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec = (v, n = 3) => Array.isArray(v) && v.length === n && v.every(isNum);
const isColor = (v) => isVec(v) && v.every((x) => x >= 0);
/** Licht der nahen Pflanzen (plant_light im Export des Strands): Lichtsonde, Grundlicht, Malen wie anime.py */
const isPlantLight = (v) => Array.isArray(v?.sh) && v.sh.length === 9 && v.sh.every((c) => isVec(c)) && isColor(v.sun)
  && isColor(v.emit) && isNum(v.translucent) && v.airDist > 0 && isNum(v.paint?.exposure) && isNum(v.paint?.saturation)
  && isColor(v.paint?.shadow) && isColor(v.paint?.light);
const isInt = (v) => Number.isInteger(v) && v > 0;
const isPos = (v) => isNum(v) && v > 0;
/** [von, bis] mit 0 < von <= bis */
const isRange = (v) => isVec(v, 2) && v[0] > 0 && v[1] >= v[0];
/** Farbe, die nicht aufblüht (jeder Kanal unter der Bloom-Schwelle); isGlow(n): n solche */
const isBright = (v) => isColor(v) && Math.max(...v) < BLOOM_THRESHOLD;
const isGlow = (n) => (v) => Array.isArray(v) && v.length === n && v.every(isBright);
/** Pinsel der Skybox (createBrushPass): Felder optional, in ihrem Bereich */
const BRUSH_RANGES = { size: [0.01, 2], uniformity: [0, 50], sharpness: [0, 1], eccentricity: [0, 2] };
const isBrush = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
  && Object.keys(v).every((k) => k in BRUSH_RANGES || k === 'mobile')
  && Object.entries(BRUSH_RANGES).every(([k, [lo, hi]]) => v[k] === undefined
    || (isNum(v[k]) && v[k] >= lo && v[k] <= hi))
  && (v.mobile === undefined || [0, 2, 3].includes(v.mobile));

// Parameter der Ebenentypen (SKY_LAYERS in index.html): Feld -> Prüfung
const LAYER_PARAMS = {
  toonInstances: {
    data: (v) => typeof v === 'string',
    palette: (v) => ['shadow', 'mid', 'lit', 'rim'].every((k) => isColor(v?.[k])),
    soft: (v) => v === undefined || (isNum(v) && v >= 0 && v <= 1),
  },
  paintedInstances: {
    data: (v) => typeof v === 'string',
  },
  glowParticles: {
    data: (v) => typeof v === 'string', count: isInt, seed: isNum, ring: (v) => isVec(v, 2), aboveFog: isNum,
    spread: isNum, lift: (v) => isVec(v, 2), yMax: isNum, ceiling: isNum, size: isNum, color: isColor, halo: isColor,
  },
  waterSurface: {
    data: (v) => typeof v === 'string', wave: (v) => isVec(v, 2), height: isNum, reach: isNum, lift: isNum,
    sun: isColor, foam: isColor, sediment: isColor, lip: isColor, crest: isColor,
  },
  fishSchools: {
    // Halbachsen von area, length, speed, depth > 0: createFishSim teilt durch sie oder rechnet mit ihnen weiter (ein
    // fehlender Wert machte den Schwarm still unsichtbar, NaN)
    data: (v) => typeof v === 'string', seed: isNum, area: (v) => isVec(v, 4) && v[2] > 0 && v[3] > 0, minDepth: isNum,
    shadow: isNum,
    schools: (v) => Array.isArray(v) && v.length > 0 && v.every((s) => isInt(s.count) && isNum(s.length) && s.length > 0
      && isVec(s.shape, 2) && isNum(s.speed) && s.speed > 0 && isNum(s.depth) && s.depth > 0
      && ['tang', 'bands', 'plain'].includes(s.pattern) && Array.isArray(s.colors) && s.colors.length === 3
      && s.colors.every(isColor)),
  },
  bakedMesh: {
    data: (v) => typeof v === 'string',
  },
  // Vulkan: Lavasee. Grössen > 0, Bereiche aufsteigend; leuchtende Farben unter der Bloom-Schwelle: Die Lava
  // liegt hinter den Strahlen, ein Schleier darüber verdeckte sie
  lavaPool: {
    level: isNum, lift: (v) => isNum(v) && v >= 0, radius: isPos, fade: isPos, seed: isNum,
    calm: (v) => isVec(v) && v[0] >= 0 && v[1] > v[0] && v[2] >= 0 && v[2] <= 1,
    plates: (v) => isPos(v?.scale) && isVec(v.drift, 2) && isNum(v.churn) && isNum(v.crack) && v.crack > 0
      && v.crack < 0.5 && isNum(v.fine) && v.fine >= 0 && v.fine <= 1,
    heat: isGlow(3), crust: (v) => Array.isArray(v) && v.length === 2 && v.every(isColor),
    bursts: (v) => isInt(v?.count) && v.count <= 32 && isRange(v.ring) && isRange(v.size) && isRange(v.period),
    spatter: (v) => Number.isInteger(v?.count) && v.count >= 0 && isPos(v.height) && isPos(v.size) && isBright(v.color),
    sparks: (v) => Number.isInteger(v?.count) && v.count >= 0 && isPos(v.height) && isPos(v.size) && isBright(v.color),
  },
  mistSheets: {
    sheets: (v) => Array.isArray(v) && v.length > 0 && v.every((s) => isVec(s)), radius: isNum, wind: (v) => isVec(v, 2),
    speed: isNum, scale: isNum, stretch: isNum, cover: (v) => isVec(v, 2), fade: (v) => isVec(v, 2),
  },
};

/**
 * Fehler als Liste von Texten (leer = in Ordnung). root: Projektordner (Dateien prüfen); types: Ebenentypen des Spiels;
 * reserved: Hintergründe aus dem Code ({ id, order }); pending: Inhalt noch nicht geschriebener Teile (Datei -> Text)
 */
export function checkSkies(skies, { root, types, reserved = [], pending = {} } = {}) {
  const errors = [];
  const ids = new Set(reserved.map((r) => r.id)), orders = new Set(reserved.map((r) => r.order));
  let precache = 0;
  const partCode = (file) => {
    if (file in pending) return pending[file];
    const path = join(root, 'backgrounds', file);
    return existsSync(path) ? readFileSync(path, 'utf8') : null;
  };
  for (const s of skies) {
    const at = `Skybox ${s?.id ?? '?'}`;
    const err = (msg) => errors.push(`${at}: ${msg}`);
    if (s?.format !== SKY_FORMAT) { err(`format ${s?.format}, erwartet ${SKY_FORMAT}`); continue; }
    if (!/^[a-z0-9-]+$/.test(s.id ?? '')) err('id nur aus a–z, 0–9 und -');
    if (ids.has(s.id)) err('id doppelt oder schon im Code vergeben');
    ids.add(s.id);
    if (typeof s.name !== 'string' || !s.name) err('name fehlt');
    if (!isNum(s.order) || orders.has(s.order)) err('order fehlt, doppelt oder schon im Code vergeben');
    orders.add(s.order);
    if (!/^[0-9a-f]{8}$/.test(s.rev ?? '')) err('rev: 8 Hex-Zeichen');

    const parts = Array.isArray(s.parts) ? s.parts : [];
    const base = parts.find((p) => p.role === 'base');
    if (!base) err('Teil base fehlt');
    let bytes = 0, gpu = 0, baseData = null;
    for (const p of parts) {
      const pat = `Teil ${p.role}`;
      if (!['base', 'bands'].includes(p.role)) err(`${pat}: unbekannte Rolle`);
      if (!['all', 'desktop'].includes(p.device)) err(`${pat}: device all oder desktop`);
      if (typeof p.precache !== 'boolean') err(`${pat}: precache fehlt`);
      if (typeof p.file !== 'string' || !p.file.startsWith(`${s.id}/`) || !p.file.endsWith(`.${s.rev}.js`)) err(`${pat}: Datei ${p.file} passt nicht zu id und rev`);
      if (!isNum(p.bytes) || !isNum(p.gpuMB)) err(`${pat}: bytes und gpuMB fehlen`);
      bytes += p.bytes || 0; gpu += p.gpuMB || 0;
      if (p.precache) precache += p.bytes || 0;
      if (root && typeof p.file === 'string') {
        const code = partCode(p.file);
        if (code === null) { err(`${pat}: ${p.file} fehlt`); continue; }
        if (Buffer.byteLength(code) !== p.bytes) err(`${pat}: ${p.file} hat ${Buffer.byteLength(code)} Bytes, im Register ${p.bytes}`);
        const got = runCode(code, p.file).PRISMA_SKY_PARTS?.[`${s.id}/${p.role}`];
        if (!got) err(`${pat}: ${p.file} setzt PRISMA_SKY_PARTS['${s.id}/${p.role}'] nicht`);
        else if (got.rev !== s.rev) err(`${pat}: Stand ${got.rev} statt ${s.rev}`);
        else if (p.role === 'base') {
          baseData = got.data ?? {};
          if (typeof got.full !== 'string' || typeof got.depth !== 'string') err('base: full oder depth fehlt');
        } else if (p.role === 'bands' && got.bands?.length !== s.panorama?.bands?.length) err('bands: Anzahl passt nicht zum Register');
      }
    }
    if (base && base.device !== 'all') err('base muss auf jedem Gerät laden');
    if (base && base.bytes > BUDGET.baseBytes) err(`base ${base.bytes} Bytes > ${BUDGET.baseBytes}`);
    if (base && base.gpuMB > BUDGET.baseGpuMB) err(`base ${base.gpuMB} MB Grafikspeicher > ${BUDGET.baseGpuMB}`);
    if (bytes > BUDGET.totalBytes) err(`zusammen ${bytes} Bytes > ${BUDGET.totalBytes}`);
    if (gpu > BUDGET.totalGpuMB) err(`zusammen ${gpu} MB Grafikspeicher > ${BUDGET.totalGpuMB}`);

    const pano = s.panorama ?? {};
    if (!isVec(pano.center)) err('panorama.center');
    if (!isVec(pano.depth?.log, 2) || !(pano.depth.log[0] > 0 && pano.depth.log[1] > pano.depth.log[0])) err('panorama.depth.log');
    for (const b of pano.bands ?? []) {
      if (!isVec(b.u, 2) || !isVec(b.v, 2) || ![...b.u, ...b.v].every((x) => x >= 0 && x <= 1)) err('panorama.bands: u und v in 0 … 1');
    }
    if (!isNum(pano.peak) || pano.peak >= BLOOM_THRESHOLD) err(`panorama.peak ${pano.peak}: muss unter der Bloom-Schwelle ${BLOOM_THRESHOLD} liegen`);
    if (!isVec(s.light?.dir) || Math.abs(Math.hypot(...s.light.dir) - 1) > 1e-3) err('light.dir: Einheitsvektor zum Licht');
    if (s.fog && !(isNum(s.fog.top) && isVec(s.fog.soft) && isVec(s.fog.core))) err('fog: top, soft, core');
    if (s.air && !(isColor(s.air.haze) && isColor(s.air.lit) && isNum(s.air.density))) err('air: haze, lit, density');
    if (s.brush !== undefined && !isBrush(s.brush)) {
      err('brush: { size 0.01 … 2, uniformity 0 … 50, sharpness 0 … 1, eccentricity 0 … 2, mobile 0 | 2 | 3 }, '
        + 'alle optional');
    }
    const painted = (s.layers ?? []).filter((l) => l.brush !== undefined);
    if (painted.some((l) => typeof l.brush !== 'boolean')) err('Ebene: brush nur true oder false');
    if (painted.some((l) => l.brush === true) !== (s.brush !== undefined)) {
      err('brush: Einstellungen der Skybox und Ebenen mit brush: true gehören zusammen');
    }
    const sky = s.sky ?? {};
    if (!Array.isArray(sky.rings) || sky.rings.length !== 9 || !sky.rings.every(isColor)) err('sky.rings: 9 Farben');
    for (const k of ['stars', 'milkyWay']) if (k in sky && !(isNum(sky[k]) && sky[k] >= 0 && sky[k] <= 1)) err(`sky.${k}: 0 … 1`);

    for (const l of s.layers ?? []) {
      if (types && !types.includes(l.type)) err(`Ebene ${l.type}: im Spiel unbekannt`);
      for (const [key, ok] of Object.entries(LAYER_PARAMS[l.type] ?? {})) if (!ok(l[key])) err(`Ebene ${l.type}: ${key} fehlt oder ungültig`);
      if (l.data && baseData && !(l.data in baseData)) err(`Ebene ${l.type}: Daten ${l.data} fehlen in base`);
      const airy = ['toonInstances', 'paintedInstances', 'mistSheets'];
      if (airy.includes(l.type) && !s.air) err(`Ebene ${l.type}: braucht air`);
      if (l.type === 'paintedInstances' && baseData && !isPlantLight(baseData[l.data]?.light)) {
        err(`Ebene paintedInstances: Daten ${l.data} ohne light (sh, sun, emit, translucent, airDist, paint)`);
      }
      if (l.type === 'mistSheets' && !s.fog) err('Ebene mistSheets: braucht fog');
      if (l.type === 'lavaPool' && !(l.fade < l.radius)) err('Ebene lavaPool: fade muss kleiner sein als radius');
      if (l.type === 'fishSchools' && !s.layers.slice(0, s.layers.indexOf(l)).some((x) => x.type === 'waterSurface')) {
        err('Ebene fishSchools: braucht davor waterSurface');
      }
    }
  }
  if (precache > BUDGET.precacheBytes) errors.push(`vorab gespeichert ${precache} Bytes > ${BUDGET.precacheBytes}`);
  return errors;
}

/** Dateien unter backgrounds/, die weder Register noch ein Teil davon sind */
export function orphans(root, skies) {
  const dir = join(root, 'backgrounds');
  if (!existsSync(dir)) return [];
  const known = new Set(['skies.js', ...skies.flatMap((s) => (s.parts ?? []).map((p) => p.file))]);
  const all = [];
  const walk = (rel) => {
    for (const f of readdirSync(join(dir, rel))) {
      const r = rel ? `${rel}/${f}` : f;
      if (statSync(join(dir, r)).isDirectory()) walk(r); else all.push(r);
    }
  };
  walk('');
  return all.filter((f) => !known.has(f));
}
