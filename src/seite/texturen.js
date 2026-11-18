// Prozedurale Texturen (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { renderer } from './szene.js';
import { mulberry32 } from '../zufall.js';
import { BRETT_DATEN } from '../brettdaten.js';

/* =====================================================================
   PROZEDURALE TEXTUREN
   ===================================================================== */

/**
 * Texturen eines Bretts, im Spiel berechnet: in einem Worker (eigenes Modul src/brettdaten-worker.ts, seit Ticket 05
 * des Umbaus; bis dahin ein Blob aus dem Text der Funktion). Im Hauptthread kostete das Steinbrett gut die Hälfte des
 * Hängers beim Laden der Seite (Ticket 03 der Leistung; 1024² Pixel mit je 16 Oktaven Rauschen). Bis die Daten da
 * sind, sind die Texturen leer (nie hochgeladen). Hochgeladen werden sie danach in Häppchen an ruhigen Stellen
 * (boardTheme.load, boardTextureUpload). Ohne Worker wie früher im Hauptthread.
 * specs: { name: [Breite, Höhe, sRGB, wiederholt] } der RGBA-Texturen (Mipmaps, Zeile 0 bei uv.y = 0); art: Name der
 * Rechnung in BRETT_DATEN (src/brettdaten.js), die aus arg { name: Uint8ClampedArray } rechnet.
 * Rückgabe: { name: DataTexture, …, computed (Promise: erfüllt, sobald die Daten da sind; abgelehnt, wenn das Rechnen
 * scheitert) }.
 */
function boardTextures(specs, art, arg) {
  const compute = BRETT_DATEN[art];
  if (!compute) throw new Error(`boardTextures: keine Rechnung ${art} in BRETT_DATEN`);
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
    // eigenes Modul src/brettdaten-worker.ts (im Build eine Datei unter assets/), rechnet mit BRETT_DATEN[art]
    const worker = new Worker(new URL('../brettdaten-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => { worker.terminate(); sicher(() => fill(data)); };
    worker.onerror = () => { worker.terminate(); hier(); }; // Worker nicht ladbar (CSP, alter Browser): im Hauptthread
    worker.postMessage({ art, arg });
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
    'stoneData', size);
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

export { boardTextures, createBrushedTexture, createStoneTextures, makeMirrorStreakTexture };
