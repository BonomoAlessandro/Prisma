// Skyboxen aus Blender: Register, Laden, Ebenen, Himmel je Welt (skyTheme) (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { solar } from './sonnensystem.js';
import { FIXED_TIME, IS_MOBILE, PLATE } from '../konfiguration.ts';
import {
  arbeit, camera, compileParallel, discardDepth, freigabe, HDR_TYPE, LAYER_NO_REFLECT, NEXT_FRAME, nextFrame,
  renderer, ruhe, RUHIG, RUHIG_KLEIN, scene, SCENE_PREPASSES, sceneLoop, sceneReady, sliced,
} from '../szene.js';
import { background, GLSL_NOISE, SKY, stars } from './sterne.js';
import { boardReflection, boardTheme, shockUniforms } from '../brett/brett.js';
import { BRUSH_DEFAULT, brushPass, composer } from '../bildschritte.js';
import { celebration } from '../levelfluss.js';
import { story } from '../geschichte/geschichte.js';
import { adaptiveResolution, clock } from '../aufloesung.js';
import { mulberry32 } from '../../zufall.js';
import { alsGlobal } from '../testschnittstelle.ts';

/* =====================================================================
   SKYBOX AUS BLENDER — Hintergründe, die in Blender (Cycles) als Panorama entstehen (tools/blender/; welchen das Spiel
   zeigt, bestimmt die Welt, siehe skyTheme). Jede steht mit einem Manifest im Register backgrounds/skies.js (erzeugt
   von tools/blender/pack.mjs, Felder in tools/sky-schema.mjs). Ihre Bilder liegen als Skripte mit Data-URLs in
   backgrounds/<id>/, weil Chrome Bilder aus file:// nicht in WebGL-Texturen lässt, und laden erst bei der Wahl: base
   (ganzes Equirect, Tiefe, Daten der Ebenen, jedes Gerät) und auf dem Desktop bands (hoch aufgelöste Streifen für den
   Blick nach unten).
   Parallaxe: Das Panorama ist von einem Punkt über dem Brett aus gerendert (center). Es liegt nicht auf einer Kugel um
   die Kamera, sondern auf einem Netz um diesen Punkt, jede Ecke so weit draussen wie die Szene in Blender (Tiefe im
   Log-Raum geglättet, sonst rissen Kanten auf). Der Shader rechnet die Richtung vom Mittelpunkt zum Punkt auf dem Netz
   und tastet damit einen Streifen oder das ganze Bild ab. Das Netz schreibt Tiefe, so verdecken Kämme, was dahinter
   liegt (etwa Nebellagen). Grenze des Verfahrens: Dinge nahe am Brett sähe die Kamera aus einem anderen Winkel als der
   Mittelpunkt, sie stünden schräg. Darum fehlen sie im Panorama (nur ihre Schatten sind drin), und das Spiel zeichnet
   sie selbst (Ebenen, SKY_LAYERS).
   Pinsel: Ebenen mit brush: true bekommen Pinselstriche wie das Panorama (anisotroper Kuwahara-Filter wie anime.py,
   createBrushPass); Grösse und Regler im Feld brush der Skybox (size in Grad wie px_per_deg × 0.28, uniformity,
   sharpness, eccentricity, mobile: Stufe auf dem Handy). Ohne brush bleibt alles ungemalt.
   Farben: lineare Szenenwerte, sRGB-kodiert, unter der Bloom-Schwelle (panorama.peak); ACES, Vignette und Korn macht der
   letzte Bildschritt wie bei allem. Ausgeblendet und nicht gewählt, gibt eine Skybox ihren Grafikspeicher frei
   (skyTheme.keep).
   Wald (forest): Mondnacht über einem Nebelmeer, nahe Fichten als 3D-Modelle (toonInstances), ein ziehender
   Nebelschleier (mistSheets) und Glühwürmchen (glowParticles).
   Strand (beach): Abend am Meer, das Brett über einer türkisen Lagune vor dem Strand; nahe Palmen, Bäume und Büsche
   als 3D-Modelle, beleuchtet und gemalt wie im Panorama (paintedInstances, mit Pinsel), Wellen, Schaum und Glitzern
   ums Brett (waterSurface), Fische (fishSchools), nahe Felsen (bakedMesh).
   Vulkan (volcano): Nacht in einem Trichter aus Sand wie dem Gaskrater Darvaza; der Lavasee unter dem Brett (lavaPool),
   Felsbrocken darin (bakedMesh) und die Flammen der Feuernester auf der Böschung (fireNests) zeichnet das Spiel bewegt.
   ===================================================================== */

const SKY_FORMAT = 1; // Fassung des Registers, die das Spiel versteht (tools/sky-schema.mjs)
const PANO = {
  dMin: 6, dMax: 88, // Abstand der Netzecken vom Mittelpunkt: auch im Hochformat (Kamera bis ~40 entfernt) vor camera.far
  blurDeg: 1,        // Glättung der Tiefe (Sigma in Grad); je Skybox panorama.depth.blur
  segU: 512, segV: 256, // Netz; je Skybox panorama.depth.mesh (Wüste: nahe Dünenkämme schärfer)
  appear: 0.6,       // s: Einblenden, wenn die Daten erst nach der Wahl ankommen
  // Streifen nur auf dem Desktop: zusammen mit dem ganzen Bild rund 260 MB Grafikspeicher (ohne: rund 45 MB)
  hd: !IS_MOBILE && renderer.capabilities.maxTextureSize >= 4096,
};

/**
 * Höhe der Texturen für die Streifen (Desktop, Ticket 11): Die Streifen der Welten sind verschieden hoch (Wüste 3823,
 * die übrigen 3413 Zeilen bei 4096 Breite). Das erste Schreiben in eine Textur einer neuen Grösse hielt den
 * Grafikprozess 105–142 ms an, mitten im Spiel. In einer Höhe für alle nimmt der Vorrat (skyTexPool) beim nächsten Himmel
 * die Texturen des vorigen. Der Worker füllt Stufe 0 jedes Streifens mit der wiederholten Kante auf diese Höhe auf
 * (skyBitmaps, pad), dann gehen alle Stufen genau auf; der Shader liest nur den Anteil des Bilds (uKl). Rund 10–20 % mehr
 * Grafikspeicher und Zeilen beim Hochladen für die Streifen.
 */
const BAND_HOEHE = 4096;

/** Zahl als GLSL-Fliesskommazahl (1 -> 1.0), Liste als vec2/vec3 */
const glf = (v) => { const s = String(v); return /[.e]/.test(s) ? s : `${s}.0`; };
const glv = (a) => `vec${a.length}(${a.map(glf).join(', ')})`;

function loadSkyScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { s.remove(); resolve(); };
    s.onerror = () => { s.remove(); reject(new Error(`${src} nicht geladen`)); };
    document.head.appendChild(s);
  });
}

/**
 * Daten-PNG (Data-URL) ohne Farbangaben. Die PNGs der Skyboxen (Tiefe, Karten) tragen sRGB, gAMA und cHRM; Firefox
 * rechnet solche Bilder ins Farbprofil des Bildschirms um, beim Zeichnen ins Canvas (skyLogDepth, groundShift; three
 * lädt nach WebGL ohne Umrechnung hoch): schon ohne eigenes Profil um ±1, mit dem eines Notebooks bis 36 Stufen je
 * Kanal. Mit 16 Bit in Rot und Grün lagen Tiefe und Wasser dann falsch. Bilder ohne Angaben lässt er, wie sie sind
 * (geprüft mit Firefox 158, Chrome wie vorher). Die Angaben stehen vor den Bilddaten (IDAT), der Rest bleibt unverändert.
 */
const PNG_COLOR_CHUNKS = new Set(['sRGB', 'gAMA', 'cHRM', 'iCCP', 'cICP', 'mDCV', 'cLLI']);
function plainPng(url) {
  const head = 'data:image/png;base64,';
  if (!url.startsWith(head)) return url;
  const bin = atob(url.slice(head.length));
  if (!bin.startsWith('\x89PNG\r\n\x1a\n')) return url;
  const u32 = (p) => ((bin.charCodeAt(p) << 24) | (bin.charCodeAt(p + 1) << 16) | (bin.charCodeAt(p + 2) << 8) | bin.charCodeAt(p + 3)) >>> 0;
  let out = bin.slice(0, 8), p = 8, dropped = false;
  while (p + 8 <= bin.length && bin.slice(p + 4, p + 8) !== 'IDAT') {
    const end = p + 12 + u32(p);
    if (PNG_COLOR_CHUNKS.has(bin.slice(p + 4, p + 8))) dropped = true;
    else out += bin.slice(p, end);
    p = end;
  }
  return dropped ? head + btoa(out + bin.slice(p)) : url;
}
/** Alle PNG-Data-URLs in einem Teil einer Skybox ohne Farbangaben (plainPng), an Ort und Stelle. Listen aus Zahlen
 * (Geometrie der Ebenen, im Wald rund 30 000 Werte) übergeht es: Mit ihnen hielt es den Hauptthread doppelt so lang an
 * (Wald, Chrome mit vierfach gedrosselter CPU: rund 21 statt 10 ms). */
function plainPngs(o) {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') o[k] = plainPng(v);
    else if (v && typeof v === 'object' && typeof v[0] !== 'number') plainPngs(v);
  }
  return o;
}
/**
 * Farbbilder der Skyboxen dekodieren, für WebGL kippen, Mipmaps rechnen und alles in Streifen zu STRIP_ROWS Zeilen
 * schneiden – in einem Worker: Kippen kostete im Hauptthread selbst mit createImageBitmap rund 25 ms je 4096×3413-Bild,
 * ein Stück hochladen rund 110 ms und generateMipmap im Grafikprozess 35–50 ms (Streifen: je ein paar ms, siehe
 * skyUpload). Ergebnis { width, height, strips: [{ level, y, bitmap }] }; ohne WebGL2 ein einziger Streifen ohne Mipmaps
 * (die macht dann three). null, wo das nicht geht (kein Worker und kein createImageBitmap, oder es kippt nicht – ältere
 * Browser übergehen die Option still; geprüft einmal mit einem 1×2-Bild): dann ein Bild wie bisher.
 */
const STRIP_ROWS = 256; // 4096 × 256 × 4 Byte = 4 MB je Streifen
const skyBitmaps = (() => {
  const OPT = { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
  async function decode(url, rows, pad = 0) {
    let bmp = await createImageBitmap(await (await fetch(url)).blob(), OPT);
    const inhalt = bmp.height;
    // pad: Stufe 0 auf so viele Zeilen auffüllen, mit der letzten Zeile (gekippt: der oberen Kante des Bilds) wiederholt,
    // erst dann die Mipmaps: So geht jede Stufe genau auf (Streifen in einer Höhe, BAND_HOEHE), und keine Stufe liest an
    // der Kante Zeilen, die nicht zum Bild gehören (im Vorrat die eines früheren Himmels)
    if (pad > inhalt && rows < Infinity && typeof OffscreenCanvas === 'function') {
      // willReadFrequently: Leinwand im Hauptspeicher (wie cut); sonst lag sie im Grafikprozess, und das Auffüllen und die
      // Mipmaps daraus hielten ihn mitten im Überblenden an (Bilder bis 200 ms, --wagen)
      const c = new OffscreenCanvas(bmp.width, pad), g = c.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingEnabled = false;
      g.drawImage(bmp, 0, 0);
      g.drawImage(bmp, 0, inhalt - 1, bmp.width, 1, 0, inhalt, bmp.width, pad - inhalt);
      bmp.close();
      bmp = c.transferToImageBitmap();
    }
    const { width, height } = bmp, levels = [bmp];
    // Für das eigene Hochladen (rows endlich) auch die Mipmaps, je Stufe halbiert: generateMipmap hielt den Grafikprozess
    // je grosse Textur 35–50 ms an
    for (let w = width, h = height; rows < Infinity && (w > 1 || h > 1);) {
      w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
      const next = await createImageBitmap(levels[levels.length - 1], { resizeWidth: w, resizeHeight: h, resizeQuality: 'medium' });
      // Übergeht ein Browser die Grösse still, scheiterte texSubImage2D (Stufe schwarz): dann ein Bild wie bisher
      if (next.width !== w || next.height !== h) throw new Error('Grösse übergangen');
      levels.push(next);
    }
    // Streifen über ein OffscreenCanvas als eigenes Bild: Einen mit createImageBitmap(lv, 0, y, …) zugeschnittenen lädt
    // Firefox ohne den Zuschnitt in WebGL (jeder Streifen zeigte die obersten Zeilen, der Grund lag in Ringen); so
    // bitgenau und je Streifen in 1–2 statt bis 25 ms hochgeladen. willReadFrequently: Canvas im Hauptspeicher, Chrome
    // wie vorher (sonst lagen die wartenden Streifen im Grafikprozess, an der Spitze rund 180 MB mehr). Vormultipliziert
    // (das Canvas): gleich für die deckenden JPEGs, nicht für ein Farbbild mit Alpha.
    const cut = (lv, y, h) => {
      const c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(lv.width, h) : null;
      const g = c?.getContext('2d', { willReadFrequently: true });
      if (!g) return createImageBitmap(lv, 0, y, lv.width, h);
      g.drawImage(lv, 0, -y);
      return c.transferToImageBitmap();
    };
    const strips = [];
    for (const [level, lv] of levels.entries()) {
      if (lv.height <= rows) { strips.push({ level, y: 0, bitmap: lv }); continue; }
      for (let y = 0; y < lv.height; y += rows) {
        strips.push({ level, y, bitmap: await cut(lv, y, Math.min(rows, lv.height - y)) });
      }
      lv.close();
    }
    return { width, height, inhalt, strips };
  }
  // Bilder nacheinander, nicht alle zugleich (jedes belegt dekodiert samt Mipmaps und Streifen bis 150 MB), und jedes
  // erst, wenn es dran ist: Wer schnell durchschaltet, wartet so nicht auf die Bilder einer schon freigegebenen Skybox
  // (alive false: der Auftrag fällt weg)
  let worker = null, nextId = 0, flips = null, queue = Promise.resolve();
  const waiting = new Map();
  const once = (url, rows, pad) => (worker
    ? new Promise((resolve, reject) => {
      const id = nextId++;
      waiting.set(id, (d) => (d.r ? resolve(d.r) : reject(new Error(d.err))));
      worker.postMessage({ id, url, rows, pad });
    })
    : decode(url, rows, pad));
  const run = (url, rows, alive = () => true, pad = 0) => (queue = queue.catch(() => {}).then(() => {
    if (!alive()) throw new Error('nicht mehr gebraucht');
    return once(url, rows, pad);
  }));
  // Worker und Test erst beim ersten Bild (mit einem Hintergrund aus dem Code braucht es beides nie)
  function start() {
    try {
      worker = new Worker(URL.createObjectURL(new Blob([`const OPT = ${JSON.stringify(OPT)};\n${decode};
        onmessage = async ({ data: { id, url, rows, pad } }) => {
          try { const r = await decode(url, rows, pad); postMessage({ id, r }, r.strips.map((s) => s.bitmap)); }
          catch (e) { postMessage({ id, err: String(e) }); }
        };`], { type: 'text/javascript' })));
      worker.onmessage = ({ data }) => { waiting.get(data.id)?.(data); waiting.delete(data.id); };
      worker.onerror = () => { // Worker nicht ladbar: offene Anfragen scheitern, ab jetzt ohne
        worker = null;
        for (const answer of waiting.values()) answer({ err: 'Worker nicht verfügbar' });
        waiting.clear();
      };
    } catch { /* ohne Worker */ }
    return Promise.race([(async () => {
      // 1 × 2 Pixel, oben rot, unten blau, als fertiges PNG: Mit einer Leinwand und toDataURL las der Browser sie aus
      // dem Grafikprozess zurück und wartete dabei, bis dieser die Shader des Seitenstarts übersetzt hatte (Hauptthread
      // bis 2 s angehalten, ohne Script; Ticket 10 der Leistung)
      const { strips } = await run('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAIAAAAW4yFwAAAADUlEQVR4nGP4zwAC/wEIAAH/2ZC7NQAAAABJRU5ErkJggg==', 2);
      const d = Object.assign(document.createElement('canvas'), { width: 1, height: 2 }).getContext('2d', { willReadFrequently: true });
      d.drawImage(strips[0].bitmap, 0, 0);
      for (const s of strips) s.bitmap.close();
      return d.getImageData(0, 0, 1, 1).data[2] > 128; // oben jetzt blau
    })().catch(() => false), new Promise((resolve) => setTimeout(resolve, 10000, null))]);
  }
  /** kippt createImageBitmap mit imageOrientation 'flipY' wirklich (ältere Browser übergehen die Option still) */
  const flipsOk = async () => {
    const ok = await (flips ??= start());
    if (ok === null) flips = null; // keine Antwort in 10 s: die nächste Skybox prüft neu
    return !!ok;
  };
  return Object.assign(async (url, alive, pad = 0) => {
    const ok = await flipsOk();
    if (!ok) return null;
    const r = await run(url, renderer.capabilities.isWebGL2 ? STRIP_ROWS : Infinity, alive, pad);
    if (Math.max(r.width, r.height) <= renderer.capabilities.maxTextureSize) return r;
    for (const s of r.strips) s.bitmap.close(); // zu gross für diese Grafik: ein Bild, three verkleinert es
    return null;
  }, { flipsOk });
})();

/** bitmap: dekodiert und in Streifen (skyBitmaps), sonst oder wo das nicht geht ein Bild (schon dekodiert: sonst täte es
 * das erste drawImage im Hauptthread, beim Tiefenbild gemessen bis 170 ms) */
async function loadSkyImage(url, bitmap = false, alive = () => true, pad = 0) {
  if (bitmap) {
    try {
      const strips = await skyBitmaps(url, alive, pad);
      if (strips) return strips;
    } catch (e) { if (!alive()) throw e; /* sonst wie ohne */ }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Bild nicht lesbar'));
    img.src = url;
    img.decode().then(() => resolve(img), () => { img.onload = () => resolve(img); if (img.complete && img.naturalWidth) resolve(img); });
  });
}

/**
 * Das erste Zeichnen einer Skybox vorwegnehmen (Generator für sliced): Beim ersten Bild, in dem sie einblendet, lud
 * three die Netze hoch und richtete die Programme ein; das hielt dieses Bild 50–120 ms an, mitten in der Reise oder an
 * einer Weltgrenze (Review Ticket 06). Hier zeichnet jedes Teil einmal unsichtbar in ein Ziel von 1 × 1 Pixel, je in
 * einem eigenen Bild, das Panorama durchsichtig wie beim Einblenden. Eine eigene Ebene (SKY_WARM_LAYER) für die Teile,
 * die Lichter der Szene und die Kamera: Mit denselben Lichtern und in ein Ziel wie beim Composer trifft es dieselben
 * Programme (sonst übersetzte three neue). Schatten werden dabei nicht neu gezeichnet.
 */
const SKY_WARM_LAYER = 30;
function* skyWarmDraw(staging, parts, sky, alive) {
  const target = new THREE.WebGLRenderTarget(1, 1), cam = camera.clone(), lights = [];
  target.prismaWarm = true; // eigene Ziele (SCENE_PREPASSES) schon in der Grösse des Spiels anlegen (waterSurface)
  cam.layers.set(SKY_WARM_LAYER);
  scene.traverse((o) => { if (o.isLight) { lights.push(o); o.layers.enable(SKY_WARM_LAYER); } });
  const draw = (part) => {
    const touched = [];
    part.traverse((o) => {
      touched.push([o, o.frustumCulled]);
      o.frustumCulled = false;
      o.layers.enable(SKY_WARM_LAYER);
    });
    const before = renderer.getRenderTarget(), shadows = renderer.shadowMap.needsUpdate;
    staging.visible = true;
    renderer.shadowMap.needsUpdate = false;
    try {
      renderer.setRenderTarget(target);
      renderer.render(scene, cam);
    } finally {
      renderer.setRenderTarget(before);
      renderer.shadowMap.needsUpdate = shadows;
      staging.visible = false;
      for (const [o, culled] of touched) { o.frustumCulled = culled; o.layers.disable(SKY_WARM_LAYER); }
    }
  };
  try {
    for (const part of parts) {
      yield RUHIG;
      if (!alive()) return;
      if (part === sky) { // beim Einblenden durchsichtig (applyFade), danach nicht: beide Fassungen
        for (const transparent of [true, false]) {
          sky.material.transparent = transparent;
          sky.material.needsUpdate = true;
          draw(sky);
        }
      } else draw(part);
      yield NEXT_FRAME;
    }
  } finally {
    for (const l of lights) l.layers.disable(SKY_WARM_LAYER);
    target.dispose();
  }
}

/** Dekodierte Bilder einer Textur schliessen (nach dem Hochladen oder bei Abbruch); ein Bild sammelt die GC ein */
function closeSkyImage(t) {
  for (const s of t.userData.strips ?? []) s.bitmap.close();
  t.userData.strips = null;
}

/** img: Bild oder Streifen aus skyBitmaps (WebGL2: dann lädt skyUpload hoch, nicht three; schon gekippt) */
function skyTexture(img, wrapU) {
  const own = img.strips && renderer.capabilities.isWebGL2;
  const t = new THREE.Texture(own ? { width: img.width, height: img.height } : img.strips?.[0].bitmap ?? img);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = wrapU ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  // Streifen sind schon gekippt. Ein ImageBitmap kippt WebGL nie, wohl aber das Canvas, über das three es in WebGL1
  // verkleinert (NPOT mit Mipmaps) oder nach linear umrechnet (ohne EXT_sRGB)
  t.flipY = !img.strips;
  t.userData.strips = img.strips ?? null;
  if (!own) t.needsUpdate = true;
  return t;
}

/**
 * Textur in Häppchen hochladen (Generator für sliced). Mit Streifen aus skyBitmaps an three vorbei: eigene WebGL-Textur
 * mit fester Grösse (texStorage2D), je Häppchen ein Streifen einer Stufe (Mipmaps aus dem Worker), am Schluss die
 * Einstellungen wie three; three bindet sie dann nur noch (properties.__webglTexture; needsUpdate nie gesetzt, also lädt
 * three selbst nichts hoch). Sonst renderer.initTexture in einem Stück.
 */
function* skyUpload(t, klein = false) {
  const strips = t.userData.strips, ruhig = klein ? RUHIG_KLEIN : RUHIG; // jedes Stück an einer ruhigen Stelle (ruhe)
  yield ruhig;
  if (!strips || !renderer.capabilities.isWebGL2) {
    const img = t.image;
    // Ein Bild (Tiefe, Wassermaske, Karten des Wassers) dekodierte der Browser beim Hochladen noch einmal im Hauptthread,
    // weil three die Farbumrechnung abschaltet: die Tiefe des Strands hielt so ein Bild auf dem gedrosselten Handy
    // 50 ms an (Ticket 09). Darum aus denselben Daten als ImageBitmap ohne Umrechnung (im Hintergrund dekodiert, gekippt
    // wie three es täte) und das hochladen; danach gilt wieder das Bild (für ein späteres Neuladen durch three).
    if (!strips && renderer.capabilities.isWebGL2 && img instanceof HTMLImageElement && img.complete && img.naturalWidth
      && img.src.startsWith('data:') && typeof createImageBitmap === 'function') {
      // gekippt nur, wo der Browser die Option wirklich anwendet (skyBitmaps prüft es; sonst stünde die Tiefe Kopf)
      let bitmap = null, done = false, gone = false;
      const drop = () => { gone = true; }; // inzwischen freigegeben (Abbruch des Aufbaus): nicht mehr hochladen
      t.addEventListener('dispose', drop);
      (t.flipY ? skyBitmaps.flipsOk() : Promise.resolve(true)).then((ok) => (!ok ? null
        : fetch(img.src).then((r) => r.blob()).then((blob) => createImageBitmap(blob, {
          imageOrientation: t.flipY ? 'flipY' : 'from-image',
          premultiplyAlpha: t.premultiplyAlpha ? 'premultiply' : 'none', colorSpaceConversion: 'none',
        })))).then((b) => { bitmap = b; }, () => {}).finally(() => { done = true; });
      let waited = false;
      try {
        while (!done) yield NEXT_FRAME;
        yield ruhig;
        waited = true;
      } finally {
        t.removeEventListener('dispose', drop);
        if (gone || !waited) bitmap?.close(); // !waited: der Aufbau gab den Generator auf
      }
      if (gone) return;
      if (bitmap) {
        const flipY = t.flipY;
        t.image = bitmap;
        t.flipY = false;
        try { renderer.initTexture(t); } finally { t.image = img; t.flipY = flipY; bitmap.close(); }
        return;
      }
    }
    renderer.initTexture(t);
    if (strips) closeSkyImage(t);
    return;
  }
  const gl = renderer.getContext(), { width: w, height: h } = t.image;
  // ganze Kette aus dem Worker, Vorschau nur Stufe 0; mipmaps (Bilder der Felsen): nur Stufe 0, die übrigen erzeugt
  // danach die Grafikkarte wie bei three (generateMipmap)
  const levels = t.userData.mipmaps ? Math.floor(Math.log2(Math.max(w, h))) + 1
    : Math.max(...strips.map((s) => s.level)) + 1;
  // aus dem Vorrat (skyTexPool), sonst neu: jeder Streifen jeder Stufe überschreibt sie ganz
  const pooled = skyTexPool.take(w, h, levels), tex = pooled ?? gl.createTexture();
  const bind = () => renderer.state.bindTexture(gl.TEXTURE_2D, tex); // über three, damit es weiss, was gebunden ist
  const weg = () => skyTexPool.give(w, h, levels, tex); // abgebrochen: zurück in den Vorrat
  bind();
  if (!pooled) gl.texStorage2D(gl.TEXTURE_2D, levels, gl.SRGB8_ALPHA8, w, h);
  arbeit.merke(`Textur ${w}×${h}: ${pooled ? 'aus dem Vorrat' : 'neu'}`);
  // Grosse Streifen je in einem eigenen Bild, gleich abgeschickt: Schneller, als der Grafikprozess sie abnimmt, liefe
  // sein Puffer voll, und der nächste wartete (gemessen bis 100 ms)
  for (const { level, y, bitmap } of strips) {
    // inzwischen freigegeben: release hat die Bilder geschlossen (das Panorama liest auch eine Szene in offscreen)
    if (t.userData.strips !== strips) { weg(); return; }
    yield ruhig;
    if (t.userData.strips !== strips) { weg(); return; }
    bind();
    gl.texSubImage2D(gl.TEXTURE_2D, level, 0, y, bitmap.width, bitmap.height, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    gl.flush();
    yield bitmap.width * bitmap.height >= 1 << 19 ? NEXT_FRAME : undefined;
  }
  bind();
  if (t.userData.mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, t.wrapS === THREE.RepeatWrapping ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, levels > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  const aniso = renderer.extensions.get('EXT_texture_filter_anisotropic');
  if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, t.anisotropy);
  closeSkyImage(t);
  renderer.properties.get(t).__webglTexture = tex;
  t.userData.vorrat = true; // freigeben kostet nichts (zurück in den Vorrat): sofort (releaseTree)
  // nur einmal: dispose kommt öfter (die Vorschau hängt auch in den Uniforms), zweimal im Vorrat nähmen sie zwei Himmel
  t.addEventListener('dispose', function zu() {
    t.removeEventListener('dispose', zu);
    weg();
    renderer.properties.remove(t);
  });
}

/**
 * Vorrat an Texturen der Himmel (Ticket 11 von .scratch/brett-je-himmel/): Eine Textur, die skyUpload angelegt hat
 * (ganzes Bild, Vorschau, Streifen; feste Grösse über texStorage2D), wird beim Freigeben nicht gelöscht, sondern hier
 * aufgehoben, und der nächste Himmel mit gleicher Grösse lädt hinein. Löschen und neu Anlegen grosser Texturen hielten den
 * Grafikprozess sonst an: das Löschen im ersten Bild des neuen Himmels (70–125 ms, auch in Häppchen noch je 53–106 ms),
 * das erste Schreiben in eine neue grosse Textur mitten im Spiel (die Streifen am Desktop, 105–142 ms). Was KEEP_MS
 * niemand mehr nimmt, löscht freigabe an einem stillen Bild (Handy kürzer: weniger Grafikspeicher).
 */
const skyTexPool = {
  KEEP_MS: IS_MOBILE ? 10000 : 30000,
  frei: new Map(), // Schlüssel w×h×Stufen -> [{ tex, seit }]
  take(w, h, levels) {
    const list = this.frei.get(`${w}x${h}x${levels}`);
    return list?.pop()?.tex ?? null;
  },
  give(w, h, levels, tex) {
    const key = `${w}x${h}x${levels}`, eintrag = { tex, seit: performance.now() };
    if (!this.frei.has(key)) this.frei.set(key, []);
    if (this.frei.get(key).some((e) => e.tex === tex)) return; // schon da
    this.frei.get(key).push(eintrag);
    // nach KEEP_MS löschen, falls ihn bis dahin niemand genommen hat (an einem stillen Bild, freigabe)
    setTimeout(() => {
      const list = this.frei.get(key);
      if (!list?.includes(eintrag)) return;
      freigabe.add(() => {
        const i = list.indexOf(eintrag);
        if (i < 0) return; // inzwischen genommen
        list.splice(i, 1);
        renderer.getContext().deleteTexture(tex);
      }, w * h >= 1 << 20, `Vorrat: Textur ${w}×${h} löschen`);
    }, this.KEEP_MS);
  },
  /** im Vorrat: Zahl und Grafikspeicher (MB, mit Mipmaps), für Proben */
  get stand() {
    let n = 0, mb = 0;
    for (const [key, list] of this.frei) {
      const [w, h, l] = key.split('x').map(Number);
      n += list.length;
      mb += list.length * w * h * 4 * (l > 1 ? 4 / 3 : 1) / 1e6;
    }
    return { n, mb: Math.round(mb) };
  },
};

/** Tiefenkarte (16 Bit log in Rot und Grün, 65535 = Himmel) -> geglätteter Log-Abstand (Sigma blurDeg in Grad, 0:
 * ungeglättet), Ferne auf dMax begrenzt. Generator für sliced (Häppchen je Spalte bzw. Zeile). */
function* skyLogDepth(img, depthLog, blurDeg = PANO.blurDeg) {
  const w = img.width, h = img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  yield;
  // in Streifen auslesen (in einem Stück hielt das ein Bild auf dem gedrosselten Handy 40–60 ms an, Ticket 09)
  const px = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y += 64) {
    px.set(ctx.getImageData(0, y, w, Math.min(64, h - y)).data, y * w * 4);
    yield;
  }
  const la = Math.log(depthLog[0]), lb = Math.log(depthLog[1]), lmin = Math.log(PANO.dMin), lmax = Math.log(PANO.dMax);
  let src = new Float32Array(w * h);
  for (let x = 0; x < w; x++) {
    let last = lmax;
    for (let y = 0; y < h; y++) {
      const i = y * w + x, code = px[i * 4] * 256 + px[i * 4 + 1];
      // ohne Treffer: über dem Horizont Himmel, darunter das Loch im Gelände unter dem Brett – dort den letzten Wert
      // darüber nehmen, sonst zöge die Glättung den Boden an den Brettkanten in die Ferne
      if (code === 65535) src[i] = y < h / 2 ? lmax : last;
      else src[i] = last = Math.min(lmax, Math.max(lmin, la + code / 65535 * (lb - la)));
    }
    yield;
  }
  if (!(blurDeg > 0)) return { w, h, data: src };
  // Gauss, getrennt: waagrecht über die Naht hinweg, senkrecht am Rand festgehalten
  const sigma = blurDeg * w / 360, r = Math.ceil(sigma * 3), k = [];
  for (let i = -r; i <= r; i++) k.push(Math.exp(-i * i / (2 * sigma * sigma)));
  const ks = k.reduce((s, v) => s + v, 0);
  const pass = function* (from, horizontal) {
    const to = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let i = -r; i <= r; i++) {
          const xx = horizontal ? (x + i + w) % w : x, yy = horizontal ? y : Math.min(h - 1, Math.max(0, y + i));
          s += from[yy * w + xx] * k[i + r];
        }
        to[y * w + x] = s / ks;
      }
      yield;
    }
    return to;
  };
  return { w, h, data: yield* pass(yield* pass(src, true), false) };
}

/** Kugelnetz um den Mittelpunkt (mesh: Felder waagrecht und senkrecht), Ecken im Abstand der Szene (bilinear aus der
 * Tiefe). Generator für sliced. */
function* skyProxyGeometry(depth, center, [segU, segV] = [PANO.segU, PANO.segV]) {
  const pos = new Float32Array((segU + 1) * (segV + 1) * 3);
  const sample = (u, v) => {
    const { w, h, data } = depth;
    const x = u * w - 0.5, y = Math.min(h - 1, Math.max(0, v * h - 0.5));
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const X0 = (x0 % w + w) % w, X1 = (X0 + 1) % w, Y1 = Math.min(h - 1, y0 + 1);
    return (data[y0 * w + X0] * (1 - fx) + data[y0 * w + X1] * fx) * (1 - fy) + (data[Y1 * w + X0] * (1 - fx) + data[Y1 * w + X1] * fx) * fy;
  };
  let p = 0;
  for (let i = 0; i <= segV; i++) {
    const v = i / segV, th = v * Math.PI;
    for (let j = 0; j <= segU; j++) {
      const u = j / segU, ph = (u - 0.5) * 2 * Math.PI;
      // Richtung in Blender (bx, by, bz) -> Spiel (bx, bz, −by)
      const bx = Math.sin(th) * Math.sin(ph), by = Math.sin(th) * Math.cos(ph), bz = Math.cos(th);
      const d = Math.exp(sample(u, v));
      pos[p++] = center.x + bx * d; pos[p++] = center.y + bz * d; pos[p++] = center.z - by * d;
    }
    yield;
  }
  const index = new Uint32Array(segU * segV * 6);
  for (let i = 0, n = 0; i < segV; i++) {
    for (let j = 0; j < segU; j++) {
      const a = i * (segU + 1) + j, b = a + 1, c = a + segU + 1, d = c + 1;
      index[n++] = a; index[n++] = c; index[n++] = b; index[n++] = b; index[n++] = c; index[n++] = d;
    }
    yield; // je Zeile (Wüste 1024 × 512: in einem Stück 54 ms auf dem gedrosselten Handy, Ticket 09)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

/**
 * Ecken und Dreiecke des Kugelnetzes in Stücken hochladen (Generator für sliced), je Stück ein Bild: Beim ersten
 * Zeichnen lud three sie in einem Stück hoch; beim feinen Netz der Wüste (1024 × 512: 6,3 MB Ecken, 12,6 MB Dreiecke)
 * hielt das ein Bild 70–105 ms an (der Puffer zum Grafikprozess lief voll und wartete), gleich nach «Weiter» auf der
 * Reise dorthin. Danach je ein eigener WebGL-Puffer (GLBufferAttribute: three bindet ihn nur und gibt ihn mit dem Netz
 * frei; die Hüllkugel vorher, sie liesse sich daraus nicht mehr rechnen). Puffer bis 4 MB (die Netze 512 × 256 der
 * übrigen Skyboxen) und ohne WebGL2 wie bisher: In Stücken war beim Wald das erste Bild des Angebots nach dem Prolog
 * länger (gemessen bis 88 statt 53 ms).
 */
const SKY_BUFFER_CHUNK = 1 << 21, SKY_BUFFER_WHOLE = 1 << 22; // 2 MB je Bild, ab über 4 MB
/** Hüllkugel von Ecken (x, y, z je Ecke) wie BufferGeometry.computeBoundingSphere, Generator (yield je 64k Ecken) */
function* boundingSphereSteps(a, per = 1 << 16) {
  const box = new THREE.Box3();
  for (let s = 0; s < a.length; s += per * 3) {
    for (let i = s, e = Math.min(a.length, s + per * 3); i < e; i += 3) {
      const x = a[i], y = a[i + 1], z = a[i + 2];
      if (x < box.min.x) box.min.x = x; if (y < box.min.y) box.min.y = y; if (z < box.min.z) box.min.z = z;
      if (x > box.max.x) box.max.x = x; if (y > box.max.y) box.max.y = y; if (z > box.max.z) box.max.z = z;
    }
    yield;
  }
  const c = box.getCenter(new THREE.Vector3());
  let maxSq = 0;
  for (let s = 0; s < a.length; s += per * 3) {
    for (let i = s, e = Math.min(a.length, s + per * 3); i < e; i += 3) {
      const dx = a[i] - c.x, dy = a[i + 1] - c.y, dz = a[i + 2] - c.z;
      maxSq = Math.max(maxSq, dx * dx + dy * dy + dz * dz);
    }
    yield;
  }
  return new THREE.Sphere(c, Math.sqrt(maxSq));
}
function* skyBufferUpload(geo) {
  if (!renderer.capabilities.isWebGL2) return;
  const gl = renderer.getContext();
  for (const name of ['position', 'index']) {
    const attr = name === 'index' ? geo.index : geo.getAttribute(name), array = attr?.array;
    if (!array || array.byteLength <= SKY_BUFFER_WHOLE) continue;
    // aus einem eigenen Puffer rechnete three sie nicht mehr; wie computeBoundingSphere, aber in Häppchen (in einem
    // Stück beim Netz der Wüste 75 ms auf dem gedrosselten Handy, Ticket 09)
    if (name === 'position') geo.boundingSphere = yield* boundingSphereSteps(array);
    const target = name === 'index' ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER, buffer = gl.createBuffer();
    geo.addEventListener('dispose', () => gl.deleteBuffer(buffer)); // auch, wenn three das Netz nie gezeichnet hat
    // ohne das Vertex Array Objekt, das three gerade gebunden hat (es merkte sich sonst diesen Puffer der Dreiecke)
    const upload = (fn) => {
      const vao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
      gl.bindVertexArray(null);
      gl.bindBuffer(target, buffer);
      fn();
      gl.bindBuffer(target, null);
      gl.bindVertexArray(vao);
      gl.flush();
    };
    yield RUHIG;
    upload(() => gl.bufferData(target, array.byteLength, gl.STATIC_DRAW));
    const per = SKY_BUFFER_CHUNK / array.BYTES_PER_ELEMENT, bytes = array.BYTES_PER_ELEMENT;
    for (let at = 0; at < array.length; at += per) {
      yield NEXT_FRAME;
      yield RUHIG;
      upload(() => gl.bufferSubData(target, at * bytes, array, at, Math.min(per, array.length - at)));
    }
    const type = array instanceof Float32Array ? gl.FLOAT : array instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    const own = new THREE.GLBufferAttribute(buffer, type, attr.itemSize, bytes, attr.count);
    if (name === 'index') geo.setIndex(own); else geo.setAttribute(name, own);
  }
}

/**
 * Plattentest im Panorama (skyPanoramaMaterial): der Kernquader des gezeigten Bretts, je 1 cm kleiner, während eines
 * Überblendens der Schnitt der Kernquader aller gezeigten Bretter (boardBlend). Dort ist jedes Pixel von einem deckend gezeichnet,
 * dahinter zeichnet der Himmel nichts. Ohne gezeigtes Brett liegt er weit unter der Szene, wo ihn kein Blick trifft.
 * Gemeinsam für alle Panoramen; boardTheme setzt ihn (die Kernquader der Arten stehen bei BOARD_TYPES).
 */
const boardCoreUniforms = { uCoreLo: { value: new THREE.Vector3() }, uCoreHi: { value: new THREE.Vector3() } };

/**
 * bands: [{ u, v, tex, on }] – on: Anteil des Streifens (0 = noch nicht geladen, das ganze Bild zeigt sich; Uniform
 * uOn). material.userData.setDepthRule({ uniforms, glsl }): Das Netz schreibt dann als Tiefe skyDepth(vWorld) (glsl
 * definiert sie; für eine Ebene, die das Netz anders als nach seiner Lage verdecken soll, siehe waterSurface).
 */
function skyPanoramaMaterial(uniforms, center, full, bands) {
  const u = { ...uniforms, ...boardCoreUniforms, uFull: { value: full }, uCenter: { value: center } };
  u.uSoft = { value: null }; // Vorschau, über die das scharfe Bild einblendet (uSoftOn 1 → 0, createPanoramaSky)
  u.uSoftOn = { value: 0 };
  bands.forEach((b, i) => {
    u[`uBand${i}`] = { value: b.tex };
    u[`uRect${i}`] = { value: new THREE.Vector4(b.u[0], b.u[1], b.v[0], b.v[1]) };
    u[`uOn${i}`] = { value: b.on ?? 1 };
    u[`uKl${i}`] = { value: 1 }; // Anteil der Zeilen des Streifens an seiner Textur (BAND_HOEHE, skyUpload)
  });
  const decl = bands.map((_, i) => `uniform sampler2D uBand${i}; uniform vec4 uRect${i}; uniform float uOn${i}; uniform float uKl${i};`).join('\n');
  // Streifen: Rechteck (u0, u1, v0, v1) im ganzen Equirect; Bildzeile 0 oben (Textur mit flipY: t = 1 − v). Kommt er
  // erst nach dem Einblenden (uOn < 1), mischt er sich über das ganze Bild. Aufgefüllt auf BAND_HOEHE (skyBitmaps, pad)
  // liegt das Bild in den unteren Zeilen (Anteil uKl), darüber die wiederholte Kante.
  const pick = bands.map((_, i) => `
        if (!hit && uOn${i} > 0.0 && u >= uRect${i}.x && u <= uRect${i}.y && v >= uRect${i}.z && v <= uRect${i}.w) {
          vec2 s = 1.0 / vec2(uRect${i}.y - uRect${i}.x, uRect${i}.w - uRect${i}.z);
          vec2 k = vec2(1.0, uKl${i});
          col = SAMPLE(uBand${i}, vec2((u - uRect${i}.x) * s.x, 1.0 - (v - uRect${i}.z) * s.y) * k, gx * s * k, gy * s * k);
          if (uOn${i} < 1.0) col = mix(SAMPLE(uFull, vec2(u, 1.0 - v), gx, gy), col, uOn${i});
          hit = true;
        }`).join('');
  const fragment = (rule) => `
        #if __VERSION__ >= 300
          #define SAMPLE(t, p, gx, gy) textureGrad(t, p, gx, gy).rgb
        #elif defined(GL_EXT_shader_texture_lod)
          #define SAMPLE(t, p, gx, gy) texture2DGradEXT(t, p, gx, gy).rgb
        #else
          #define SAMPLE(t, p, gx, gy) texture2D(t, p).rgb
        #endif
        uniform sampler2D uFull, uSoft;
        uniform float uSoftOn;
        uniform vec3 uCenter;
        uniform float uFade, uReady;
        ${decl}
        varying vec3 vWorld;
        const float PI = 3.141592653589793;
        uniform vec3 uCoreLo, uCoreHi; // Kernquader des gezeigten Bretts, je 1 cm kleiner (boardCoreUniforms)
        ${rule?.glsl ?? ''}
        void main() {
          vec3 g = normalize(vWorld - uCenter);
          vec3 b = vec3(g.x, -g.z, g.y); // Spiel -> Blender
          float u = 0.5 + atan(b.x, b.y) / (2.0 * PI);
          float v = acos(clamp(b.z, -1.0, 1.0)) / PI;
          // Ableitungen vor jeder Verzweigung; an der Naht (u springt 1 -> 0) den Sprung herausnehmen, sonst wählte die
          // Grafikkarte dort die kleinste Mipmap-Stufe (eine Linie aus Mittelwerten)
          vec2 dx = dFdx(vec2(u, v)), dy = dFdy(vec2(u, v));
          dx.x -= floor(dx.x + 0.5); dy.x -= floor(dy.x + 0.5);
          vec2 gx = vec2(dx.x, -dx.y), gy = vec2(dy.x, -dy.y);
          // Hinter dem Kernquader des Bretts (undurchsichtig, steht fest, wird danach gezeichnet und deckt das Netz dort
          // zu): nichts weiter rechnen. Im Level deckt das Brett gut ein Drittel des Bilds; das Netz schreibt am Strand
          // seine Tiefe selbst, der Tiefentest kann es dort also nicht vorher verwerfen (Ticket 11). Quader um 1 cm
          // kleiner, damit am Rand kein Pixel ohne Netz und ohne Brett bleibt.
          {
            vec3 eye = vWorld - cameraPosition, inv = 1.0 / eye;
            vec3 t0 = (uCoreLo - cameraPosition) * inv, t1 = (uCoreHi - cameraPosition) * inv;
            vec3 tn = min(t0, t1), tf = max(t0, t1);
            float tIn = max(max(tn.x, tn.y), tn.z), tOut = min(min(tf.x, tf.y), tf.z);
            if (tIn <= tOut && tIn > 0.0 && tIn < 1.0) discard; // eye läuft bis zum Netz: t = 1 dort
          }
          vec3 col = vec3(0.0);
          bool hit = false;
          ${pick}
          if (!hit) col = SAMPLE(uFull, vec2(u, 1.0 - v), gx, gy);
          if (uSoftOn > 0.0) col = mix(col, texture2D(uSoft, vec2(u, 1.0 - v)).rgb, uSoftOn);
          gl_FragColor = vec4(col, uFade * uReady);${rule ? `
          gl_FragDepthEXT = skyDepth(vWorld);` : ''}
        }`;
  const material = new THREE.ShaderMaterial({
    uniforms: u,
    side: THREE.DoubleSide,
    extensions: { derivatives: true, shaderTextureLOD: true },
    vertexShader: `
        varying vec3 vWorld;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: fragment(null),
  });
  material.userData.setDepthRule = (rule) => {
    Object.assign(material.uniforms, rule.uniforms);
    material.extensions.fragDepth = true;
    material.fragmentShader = fragment(rule);
    material.needsUpdate = true;
  };
  return material;
}

/**
 * Ebenen: was das Spiel zu einem Panorama selbst zeichnet, je Typ mit Parametern aus dem Manifest (layers). Jeder Typ
 * ist eine Funktion (ctx, opt) -> Object3D; ctx = { uniforms (uFade, uReady, uTime), pointUniforms (dazu uPixelRatio),
 * data (Daten aus base), light (Richtung zum Hauptlicht), lightGLSL (const vec3 SKY_LIGHT), fog, air, pano (full:
 * Textur des ganzen Panoramas, center: sein Mittelpunkt, depth: ungeglättete Tiefe { tex, size, log, image },
 * waterMask: Wassermaske oder null, siehe maskTexture; eine Ebene darf depthRule setzen: die Tiefe, die das Netz
 * schreibt, siehe skyPanoramaMaterial), offscreen (Szenen, die eine Ebene selbst zeichnet: werden mit übersetzt und
 * freigegeben), later (Arbeit, die warten kann: async (alive) =>, läuft, sobald die Skybox ganz eingeblendet ist;
 * alive() ist falsch, sobald sie freigegeben ist), under (von waterSurface: Szene unter der Wasseroberfläche) }. Am
 * Object3D optional userData.update(t, dt) (jedes Bild, solange sichtbar) und userData.dispose() (beim Freigeben).
 * Jede Ebene kann brush: true tragen (Pinselstriche über ihren undurchsichtigen Materialien, createBrushPass; die
 * Einstellungen stehen im Feld brush der Skybox); das gilt für jeden Typ und braucht dort keinen Code.
 * Neues kommt als weiterer Typ dazu; tools/sky-schema.mjs liest die Namen aus der Zeile `const SKY_LAYERS = { … }`.
 */

/**
 * Base64 zu Bytes (ArrayBuffer), Generator für sliced: in Stücken von B64_CHUNK Zeichen, yield nach jedem. Mit
 * Uint8Array.fromBase64, wo es das gibt, sonst atob und eine Schleife (Uint8Array.from mit Rückruf je Zeichen war
 * mehrfach langsamer; ein grosses Feld hielt auf dem gedrosselten Handy ein Bild 50–60 ms an, Ticket 09 der Leistung).
 */
const B64_CHUNK = 1 << 18; // Zeichen, durch 4 teilbar
function* b64Bytes(s) {
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  const out = new Uint8Array(Math.floor((s.length * 3) / 4) - pad);
  let o = 0;
  for (let i = 0; i < s.length; i += B64_CHUNK) {
    const part = s.slice(i, i + B64_CHUNK);
    if (Uint8Array.fromBase64) {
      const b = Uint8Array.fromBase64(part);
      out.set(b, o);
      o += b.length;
    } else {
      const bin = atob(part);
      for (let k = 0; k < bin.length; k++) out[o + k] = bin.charCodeAt(k);
      o += bin.length;
    }
    yield;
  }
  return o === out.length ? out.buffer : out.slice(0, o).buffer;
}

/** Float32Array.from(src, fn) in Häppchen (Generator für sliced, yield je per Werte), dasselbe Ergebnis */
function* mappedFloats(src, fn, per = 1 << 16) {
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += per) {
    for (let k = i, e = Math.min(src.length, i + per); k < e; k++) out[k] = fn(src[k]);
    yield;
  }
  return out;
}

/** BufferGeometry.computeVertexNormals (three 0.147, mit Index) in Häppchen: Generator für sliced, dasselbe Ergebnis;
 *  ein Baum am Strand brauchte in einem Stück auf dem gedrosselten Handy 40 ms (Ticket 09) */
function* vertexNormalsSteps(geo, per = 1 << 13) {
  const index = geo.index, pos = geo.getAttribute('position');
  if (!index || !pos) { geo.computeVertexNormals(); return; }
  const normal = new THREE.Float32BufferAttribute(new Float32Array(3 * pos.count), 3);
  geo.setAttribute('normal', normal);
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3();
  const nA = new THREE.Vector3(), nB = new THREE.Vector3(), nC = new THREE.Vector3();
  const cb = new THREE.Vector3(), ab = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
    pA.fromBufferAttribute(pos, a); pB.fromBufferAttribute(pos, b); pC.fromBufferAttribute(pos, c);
    cb.subVectors(pC, pB); ab.subVectors(pA, pB); cb.cross(ab);
    nA.fromBufferAttribute(normal, a); nB.fromBufferAttribute(normal, b); nC.fromBufferAttribute(normal, c);
    nA.add(cb); nB.add(cb); nC.add(cb);
    normal.setXYZ(a, nA.x, nA.y, nA.z); normal.setXYZ(b, nB.x, nB.y, nB.z); normal.setXYZ(c, nC.x, nC.y, nC.z);
    if (i % (per * 3) === per * 3 - 3) yield;
  }
  yield;
  for (let i = 0; i < normal.count; i++) {
    nA.fromBufferAttribute(normal, i).normalize();
    normal.setXYZ(i, nA.x, nA.y, nA.z);
    if (i % (per * 4) === per * 4 - 1) yield;
  }
  normal.needsUpdate = true;
}

/** Modell als Felder: unverändert (pos, nrm, col, idx) oder kompakt aus Base64 (pos16: Int16 / 8192, col8: Uint8,
 *  Wurzel der Farbe; idx16: Uint16; ohne Normalen), wie es der Export des Strands schreibt. Dazu dort (game_models):
 *  prims: Blätter und Fiedern je Form noch kompakter (pack_prims): je Blatt erste Ecke base16 (Int16 / 8192), die
 *  übrigen k − 1 als d8 (Int8 × dscale) relativ dazu, Farbe col8, Dreiecke nach tri (Ecken 0 … k − 1); leaf ist 1 für
 *  ihre Ecken (Laub scheint durch, paintedInstances). tubes: Röhren (pack_tubes): je Röhre Ringe n8 und Ecken je Ring
 *  s8, je Ring Mitte c16 (Int16 / 8192), Radius r16 (Uint16 / 2¹⁸), Farbe col8; die Ringe wie tube() in pflanzen.py
 *  (Querachse mitgeführt, Anfang senkrecht zu oben bzw. zu x, wenn die Röhre senkrecht beginnt). self8 je Ecke, Blatt
 *  bzw. Ring: Licht durch die eigene Krone (self_light), entpackt als self [Himmel, a0, a1, b1] je Ecke.
 *  Generator (sliced): yield je Feld und alle paar Röhren bzw. Blätter – in einem Stück hielt ein Baum ein Bild auf dem
 *  gedrosselten Handy bis 90 ms an (Ticket 09 der Leistung). */
function* unpackModel(m) {
  if (m.pos16 === undefined) return m; // leer ('') bei Bäumen ohne Früchte: alles in prims und tubes
  const bytes = b64Bytes;
  const pos = yield* mappedFloats(new Int16Array(yield* bytes(m.pos16)), (v) => v / 8192);
  const col = yield* mappedFloats(new Uint8Array(yield* bytes(m.col8)), (v) => (v / 255) ** 2);
  const idx = new Uint16Array(yield* bytes(m.idx16));
  if (!m.prims && !m.tubes) return { pos, col, idx };
  const prims = m.prims ?? [], t = m.tubes;
  const rings = t ? new Uint8Array(yield* bytes(t.n8)) : [], sides = t ? new Uint8Array(yield* bytes(t.s8)) : [];
  let nv = pos.length / 3, ni = idx.length;
  for (const p of prims) { nv += p.count * p.k; ni += p.count * p.tri.length; }
  rings.forEach((n, j) => { nv += n * sides[j]; ni += (n - 1) * sides[j] * 6; });
  const P = new Float32Array(nv * 3), C = new Float32Array(nv * 3), leaf = new Float32Array(nv);
  const S = new Float32Array(nv * 4).fill(1); // ohne self8: frei
  // Lage im Blatt (entlang 0 … 1, quer in Blattbreiten): die Ecken des Sechsecks wie leaf() in pflanzen.py; alles
  // andere in der Mitte (paintedInstances schneidet daraus eine runde Blattform)
  const shape = new Float32Array(nv * 2).fill(0.5);
  for (let e = 1; e < nv * 2; e += 2) shape[e] = 0;
  const HEX = [0, 0, 0.3, 0.5, 0.72, 0.42, 1, 0, 0.72, -0.42, 0.3, -0.5];
  const I = nv > 65536 ? new Uint32Array(ni) : new Uint16Array(ni);
  P.set(pos); C.set(col); I.set(idx);
  // self8 der Gruppe g (Blatt, Ring, Ecke) auf die Ecken v0 … v0 + k − 1
  const setSelf = (s8, g, v0, k) => {
    if (!s8) return;
    const q = [s8[g * 4] / 255, s8[g * 4 + 1] / 255, (s8[g * 4 + 2] - 128) / 127, (s8[g * 4 + 3] - 128) / 127];
    for (let e = 0; e < k; e++) S.set(q, (v0 + e) * 4);
  };
  const s8 = m.self8 ? new Uint8Array(yield* bytes(m.self8)) : null;
  for (let e = 0; e < pos.length / 3; e++) setSelf(s8, e, e, 1);
  let v = pos.length / 3, i = idx.length;
  if (t) {
    const c = yield* mappedFloats(new Int16Array(yield* bytes(t.c16)), (x) => x / 8192);
    const r = yield* mappedFloats(new Uint16Array(yield* bytes(t.r16)), (x) => x / 2 ** 18);
    const rc = new Uint8Array(yield* bytes(t.col8)), rs = t.self8 ? new Uint8Array(yield* bytes(t.self8)) : null;
    const at = (k) => new THREE.Vector3(c[k * 3], c[k * 3 + 1], c[k * 3 + 2]);
    const tan = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3();
    let k0 = 0;
    for (let j = 0; j < rings.length; j++) {
      const n = rings[j], s = sides[j];
      if (j % 64 === 63) yield;
      for (let k = 0; k < n; k++) {
        // Richtung wie np.gradient: in der Mitte zentral, an den Enden einseitig
        tan.subVectors(at(k0 + Math.min(k + 1, n - 1)), at(k0 + Math.max(k - 1, 0))).normalize();
        if (k === 0) u.crossVectors(tan, new THREE.Vector3(Math.abs(tan.y) > 0.9 ? 1 : 0, Math.abs(tan.y) > 0.9 ? 0 : 1, 0));
        else u.addScaledVector(tan, -tan.dot(u));
        u.normalize();
        w.crossVectors(tan, u);
        const q = k0 + k, cen = at(q);
        for (let e = 0; e < s; e++) {
          const a = (e * 2 * Math.PI) / s, o = (v + k * s + e) * 3;
          for (let x = 0; x < 3; x++) {
            P[o + x] = cen.getComponent(x) + r[q] * (Math.cos(a) * u.getComponent(x) + Math.sin(a) * w.getComponent(x));
            C[o + x] = (rc[q * 3 + x] / 255) ** 2;
          }
        }
        setSelf(rs, q, v + k * s, s);
        if (k < n - 1) {
          for (let e = 0; e < s; e++) {
            const a = v + k * s + e, b = v + k * s + ((e + 1) % s);
            I.set([a, b, b + s, a, b + s, a + s], i);
            i += 6;
          }
        }
      }
      v += n * s;
      k0 += n;
    }
  }
  for (const p of prims) {
    const base = new Int16Array(yield* bytes(p.base16)), d = new Int8Array(yield* bytes(p.d8));
    const c = new Uint8Array(yield* bytes(p.col8));
    const ps = p.self8 ? new Uint8Array(yield* bytes(p.self8)) : null;
    for (let j = 0; j < p.count; j++, v += p.k) {
      if (j % 1024 === 1023) yield;
      for (let e = 0; e < p.k; e++) {
        for (let a = 0; a < 3; a++) {
          P[(v + e) * 3 + a] = base[j * 3 + a] / 8192 + (e ? d[(j * (p.k - 1) + e - 1) * 3 + a] * p.dscale : 0);
          C[(v + e) * 3 + a] = (c[j * 3 + a] / 255) ** 2;
        }
        leaf[v + e] = 1;
      }
      if (p.form === 'blatt') shape.set(HEX, v * 2);
      setSelf(ps, j, v, p.k);
      for (const e of p.tri) I[i++] = v + e;
    }
  }
  return { pos: P, col: C, idx: I, leaf, self: S, shape };
}

/** Je Modell ein InstancedMesh mit material (Daten wie bei toonInstances; die Drehung auch als [x, y, z] wie in
 *  Blender, Euler XYZ um dessen Achsen: Palmen lehnen); aInfo je Instanz: Licht unten, oben, Helligkeit,
 *  Nebel-Oberkante; aCol, aLeaf, aSelf und aShape, wenn das Modell sie hat. Jedes Bild bekommt die Grafikkarte nur die
 *  Instanzen, deren Hüllquader im Bild liegt (cullInstances; three.js zeichnete sonst alle: Eine Hülle um alle
 *  Standorte enthielte immer das Brett). In der Standardansicht sind das von 188 Pflanzen am Strand gut ein Dutzend.
 *  userData.instances: alle Matrizen (für den Pinsel). Generator (sliced: yield je Modell). */
function* instancedModels(set, material, colored) {
  const out = new THREE.Group(), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const meshes = [];
  for (const [k, packed] of set.models.entries()) {
    const model = yield* unpackModel(packed);
    yield;
    const list = set.instances.filter((t) => t[6] === k);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(model.pos, 3));
    if (colored) geo.setAttribute('aCol', new THREE.Float32BufferAttribute(model.col, 3));
    if (model.leaf) geo.setAttribute('aLeaf', new THREE.Float32BufferAttribute(model.leaf, 1));
    if (model.self) geo.setAttribute('aSelf', new THREE.Float32BufferAttribute(model.self, 4));
    if (model.shape) geo.setAttribute('aShape', new THREE.Float32BufferAttribute(model.shape, 2));
    geo.setIndex(ArrayBuffer.isView(model.idx) ? new THREE.BufferAttribute(model.idx, 1) : model.idx);
    if (model.nrm) geo.setAttribute('normal', new THREE.Float32BufferAttribute(model.nrm, 3));
    else yield* vertexNormalsSteps(geo);
    yield;
    geo.computeBoundingBox();
    const info = new Float32Array(list.length * 4), all = new Float32Array(list.length * 16);
    const mesh = new THREE.InstancedMesh(geo, material, list.length);
    list.forEach(([x, y, z, h, w, turn, , lo, hi, shade, top = 0], i) => {
      // Blender Rz·Ry·Rx in Spielachsen (x, z, −y): Ry·R(−z)·Rx, three.js-Reihenfolge 'YZX'
      const [rx, ry, rz] = Array.isArray(turn) ? turn : [0, 0, turn];
      q.setFromEuler(e.set(rx, rz, -ry, 'YZX'));
      mtx.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, w)).toArray(all, i * 16);
      info.set([lo, hi, shade, top], i * 4);
    });
    mesh.instanceMatrix.array.set(all);
    geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info.slice(), 4));
    mesh.frustumCulled = false; // selbst je Instanz (cullInstances)
    mesh.userData.instances = all;
    meshes.push({ mesh, all, info, boxes: null, shown: null });
    out.add(mesh);
    yield;
  }
  out.userData.update = () => cullInstances(meshes);
  return out;
}

/** Nur die Instanzen im Bild der Kamera an die Grafikkarte (vorne in instanceMatrix und aInfo, count); hochgeladen nur,
 *  wenn sich die Auswahl ändert. Hüllquader in der Welt einmal (die Ebenen stehen still). Ohne neue Arrays je Bild:
 *  Die Auswahl steht in einem festen Feld je Mesh (shown). */
const cullInstances = (() => {
  const frustum = new THREE.Frustum(), viewProj = new THREE.Matrix4(), m = new THREE.Matrix4();
  return (meshes) => {
    camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    for (const g of meshes) {
      const { mesh, all, info } = g, n = all.length / 16;
      g.boxes ??= Array.from({ length: n }, (_, i) =>
        mesh.geometry.boundingBox.clone().applyMatrix4(m.fromArray(all, i * 16).premultiply(mesh.matrixWorld)));
      let changed = !g.shown;
      g.shown ??= new Uint8Array(n);
      const shown = g.shown;
      for (let i = 0; i < n; i++) {
        const v = frustum.intersectsBox(g.boxes[i]) ? 1 : 0;
        if (v !== shown[i]) { shown[i] = v; changed = true; }
      }
      if (!changed) continue;
      const mat = mesh.instanceMatrix.array, attr = mesh.geometry.getAttribute('aInfo');
      let c = 0;
      for (let i = 0; i < n; i++) {
        if (!shown[i]) continue;
        mat.set(all.subarray(i * 16, i * 16 + 16), c * 16);
        attr.array.set(info.subarray(i * 4, i * 4 + 4), c * 4);
        c++;
      }
      mesh.count = c;
      mesh.visible = c > 0;
      mesh.instanceMatrix.needsUpdate = attr.needsUpdate = true;
    }
  };
})();

/**
 * Nahe Objekte (Daten: models {pos, nrm, idx} in Spielkoordinaten oder kompakt, siehe unpackModel; Fuss im Ursprung,
 * Höhe und Breite 1; instances [x, y, z, Höhe, Breite, Drehung um die Hochachse (oder [x, y, z], instancedModels),
 * Modell, Licht unten, Licht oben, Helligkeit, Nebel-Oberkante]):
 * Das Panorama zeigt sie nicht, aus seinem Mittelpunkt gesehen lägen sie schräg. Farben (palette) wie die gemalten
 * Objekte im Panorama: zwei Stufen im Hauptlicht (Toon; soft 0 … 1 macht sie weich), heller Rand an den Kanten zum
 * Licht, unten dunkler, etwas Dunst mit dem Abstand (air). Wie viel Licht ein Objekt unten und oben trifft (Schatten von
 * Kämmen und Nachbarn), hat Blender je Instanz ausgerechnet; ihre Schatten auf dem Boden stecken im Panorama (Wald:
 * wald_spielbaum.py).
 * Nebel wie in der Szene (fog): Die Dichte hängt nur von der Höhe über der Nebel-Oberkante an der Instanz ab (weicher
 * Saum, darunter der Kern, je eine Rampe). Entlang des Blicks bis zur Kamera (über dem Nebel) zählt also nur ihr
 * Integral von der Höhe des Punkts aufwärts, mal Weg je Höhe – so versinken Objekte am Rand des Nebelmeers darin wie
 * im Panorama. Ohne fog oder ohne Oberkante je Instanz: kein Nebel. Generator (sliced: yield je Modell).
 */
function* toonInstances(ctx, opt) {
  const set = ctx.data[opt.data], pal = opt.palette, air = ctx.air;
  const fog = ctx.fog && set.instances.every((t) => t.length > 10) ? ctx.fog : null;
  const fogRamp = ([a, b, d]) => `${d.toFixed(4)} * ramp(dz, ${a.toFixed(2)}, ${b.toFixed(2)})`;
  // Modelle mit Farbe je Ecke (col): Die Palette gibt dann Faktoren auf diese Farbe (Stamm braun, Laub grün)
  const colored = set.models.every((m) => m.col || m.col8);
  const material = new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    defines: colored ? { USE_COL: '' } : {},
    side: colored ? THREE.DoubleSide : THREE.FrontSide, // offene Flächen (Palmwedel) von beiden Seiten
    vertexShader: `
        attribute vec4 aInfo; // Licht unten, oben; Helligkeit; Oberkante des Nebels
        varying vec4 vInfo;
        varying vec3 vN, vPos;
        varying float vH;
        #ifdef USE_COL
          attribute vec3 aCol;
          varying vec3 vCol;
        #endif
        void main() {
          #ifdef USE_COL
            vCol = aCol;
          #endif
          mat4 m = modelMatrix * instanceMatrix;
          vec4 wp = m * vec4(position, 1.0);
          vec3 sc = vec3(length(m[0].xyz), length(m[1].xyz), length(m[2].xyz));
          vN = normalize(mat3(m) * (normal / (sc * sc)));
          vPos = wp.xyz;
          vInfo = aInfo;
          vH = position.y;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `
        uniform float uFade, uReady;
        varying vec4 vInfo;
        varying vec3 vN, vPos;
        varying float vH;
        ${ctx.lightGLSL}
        // Farben der gemalten Objekte und des Nebels (Anzeige), zurückgerechnet auf Szenenwerte vor ACES
        const vec3 SHADOW = ${glv(pal.shadow)}, MID = ${glv(pal.mid)};
        const vec3 LIT = ${glv(pal.lit)}, RIM = ${glv(pal.rim)}, HAZE = ${glv(air.haze)};
        const vec3 FOG_LIT = ${glv(air.lit)};
        const float SOFT = ${glf(opt.soft ?? 0)};
        #ifdef USE_COL
          varying vec3 vCol;
          #define BASE(c) (c * vCol)
        #else
          #define BASE(c) (c)
        #endif
        // Integral einer Rampe (0 bei Höhe a, 1 ab Höhe b < a) von dz aufwärts
        float ramp(float dz, float a, float b) {
          float w = a - b;
          if (dz >= a) return 0.0;
          if (dz > b) return (a - dz) * (a - dz) / (2.0 * w);
          return 0.5 * w + (b - dz);
        }
        void main() {
          vec3 N = normalize(vN);
          if (!gl_FrontFacing) N = -N;
          vec3 toCam = cameraPosition - vPos;
          float dist = length(toCam);
          float l = dot(N, SKY_LIGHT);
          float moon = mix(vInfo.x, vInfo.y, smoothstep(0.2, 0.8, vH));
          // Stufen: hart wie gemalt (soft 0) bis weich verlaufend (soft 1, natürlicher für Laub)
          vec3 col = mix(BASE(SHADOW), BASE(MID), smoothstep(-0.5 - 0.4 * SOFT, -0.3 + 0.2 * SOFT, l));
          col = mix(col, BASE(LIT), smoothstep(-0.05 * SOFT, 0.12 + 0.45 * SOFT, l) * moon);
          col *= mix(0.6, 1.0, smoothstep(0.0, 0.45, vH));
          float rim = pow(1.0 - max(dot(N, toCam / dist), 0.0), 3.0) * smoothstep(-0.1, 0.4, l) * moon;
          col = mix(col, BASE(RIM), rim * 0.6) * vInfo.z;
          col = mix(col, HAZE, 1.0 - exp(-dist * ${glf(air.density)}));${fog ? `
          // Nebel: Integral der Dichte über dem Punkt mal Weg je Höhe; zum Licht hin heller (Vorwärtsstreuung)
          float dz = vPos.y - vInfo.w;
          float tau = (${fogRamp(fog.soft)} + ${fogRamp(fog.core)}) * min(dist / max(cameraPosition.y - vPos.y, 0.1), 8.0);
          vec2 h = normalize(-toCam.xz + vec2(1e-4)), m = normalize(SKY_LIGHT.xz);
          col = mix(mix(HAZE, FOG_LIT, pow(max(dot(h, m), 0.0), 2.0)), col, exp(-tau));` : ''}
          gl_FragColor = vec4(col * uFade * uReady, 1.0);
        }`,
  });
  return yield* instancedModels(set, material, colored);
}

/** GLSL-mat3 aus einer Matrix in Zeilen [[a, b, c], …] (GLSL füllt Spalten) */
const glm3 = (rows) => `mat3(${[0, 1, 2].map((c) => glv(rows.map((r) => r[c]))).join(', ')})`;

/**
 * Nahe Pflanzen wie im Panorama gemalt (Daten wie toonInstances mit Farbe je Ecke, Drehung [x, y, z] wie in Blender,
 * dazu light aus dem Export des Strands, plant_light; Helligkeit je Instanz bleibt unbenutzt, Blender kennt sie
 * nicht): Das Spiel rechnet, was Blender und anime.py für sie rechnen würden. Licht wie in Blender: Himmel und Boden
 * aus einer Lichtsonde (sh: Kugelfunktionen bis Grad 2 in Blender-Achsen, Beleuchtungsstärke je Normale), Sonne (sun)
 * × max(N·L, 0) mal Sonne an der Instanz (unten, oben: Schatten von Gelände und Nachbarn), beides durch die eigene
 * Krone (aSelf aus self_light: Himmel; Sonne nach ihrem Azimut in den Achsen der Vorlage), Grundlicht (emit, wie
 * mat_plant), Laub scheint zu translucent durch (Licht von hinten), Glanz wie die Principled BSDF; Luftperspektive
 * nach airDist.
 * Dann gemalt wie anime.grade: Belichtung, ACES und sRGB (so sähe es im Spiel aus), satter, bläuliche Schatten, warme
 * Lichter (paint), zurück auf Szenenwerte vor ACES (wie die Textur des Panoramas, höchstens TEX_MAX). Pinselstriche mit
 * brush (createBrushPass); ihr Runden der Blätter macht aShape nach (Sechseck -> runde Blattform). Generator (sliced:
 * yield je Modell).
 */
function* paintedInstances(ctx, opt) {
  const set = ctx.data[opt.data], L = set.light, P = L.paint, air = ctx.air;
  const IN = [[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]];
  const OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
  const inverse = (rows) => {
    const m = new THREE.Matrix3().set(...rows.flat()).invert().elements; // spaltenweise
    return [0, 1, 2].map((r) => [0, 1, 2].map((c) => m[c * 3 + r]));
  };
  const T = glf(L.translucent);
  const material = new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    side: THREE.DoubleSide, // offene Flächen (Blätter, Fiedern) von beiden Seiten
    // Licht und Malen je Ecke, für Vorder- und Rückseite (gl_FrontFacing wählt im Pixel): Die Blätter sind klein, und
    // gemalt ist das Licht ohnehin flächig – je Pixel kostete der Shader auf dem Handy ein Vielfaches
    vertexShader: `
        attribute vec4 aInfo; // Licht unten, oben; Helligkeit; Oberkante des Nebels
        attribute vec3 aCol;
        attribute float aLeaf; // 0 Holz, 1 Laub (scheint durch)
        attribute vec4 aSelf; // durch die eigene Krone: Himmel; Sonne a0 + a1 cos φ + b1 sin φ
        attribute vec2 aShape;
        varying vec3 vFront, vBack;
        varying vec2 vShape;
        ${ctx.lightGLSL}
        const vec3 SUN = ${glv(L.sun)}, EMIT = ${glv(L.emit)}, HAZE = ${glv(air.haze)};
        const vec3 GLOSS_SUN = ${glv(L.gloss?.sun ?? L.sun)};
        const float GLOSS_SKY = ${glf(L.gloss?.sky ?? 1 / Math.PI)};
        const vec3 SHADOW = ${glv(P.shadow)}, WARM = ${glv(P.light)};
        const mat3 IN_INV = ${glm3(inverse(IN))}, OUT_INV = ${glm3(inverse(OUT))};
        const mat3 IN_M = ${glm3(IN)}, OUT_M = ${glm3(OUT)};
        // Himmel und Boden der Lichtsonde (Blender-Achsen)
        vec3 sky(vec3 n) {
          return ${L.sh.map((c, i) => `${glv(c)} * ${['1.0', 'n.x', 'n.y', 'n.z', 'n.x * n.y', 'n.y * n.z',
            '(3.0 * n.z * n.z - 1.0)', 'n.x * n.z', '(n.x * n.x - n.y * n.y)'][i]}`).join(' + ')};
        }
        // ACES wie der letzte Bildschritt (Belichtung 1) und zurück (anime.aces_inverse)
        vec3 aces(vec3 c) {
          vec3 v = IN_M * (c / 0.6);
          v = (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
          return clamp(OUT_M * v, 0.0, 1.0);
        }
        vec3 acesInverse(vec3 d) {
          vec3 y = clamp(OUT_INV * d, 0.0, 1.0);
          vec3 a = 1.0 - 0.983729 * y, b = 0.0245786 - 0.4329510 * y, c = -0.000090537 - 0.238081 * y;
          vec3 x = (-b + sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * max(a, 1e-4));
          return max(IN_INV * x, 0.0) * 0.6;
        }
        vec3 encode(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        vec3 decode(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }
        // Farbe einer Seite mit Normale N: Licht wie in Blender, gemalt wie anime.grade, als Szenenwert vor ACES
        vec3 shade(vec3 N, vec3 V, float dist, float sun, float sky0, float leaf) {
          vec3 nb = vec3(N.x, -N.z, N.y);
          float nl = dot(N, SKY_LIGHT);
          vec3 front = max(sky(nb), 0.0) * sky0 + SUN * max(nl, 0.0) * sun;
          vec3 back = max(sky(-nb), 0.0) * sky0 + SUN * max(-nl, 0.0) * sun;
          // das Grundlicht steckt in Blender in der Principled BSDF: beim Laub nur ihr Anteil (1 − translucent)
          vec3 lin = aCol * (mix(front, back, ${T} * leaf) + EMIT * (1.0 - ${T} * leaf));
          // Glanz wie die Principled BSDF in Blender (Rauheit Laub 0.55, Holz 0.85; ohne ihn fehlte dem Laub der
          // bläuliche Schimmer des Himmels): Himmel in Spiegelrichtung nach Fresnel, Sonne nach GGX
          float nv = max(dot(N, V), 1e-3), rough = mix(0.85, 0.55, leaf), a2 = pow(rough, 4.0);
          vec3 R = reflect(-V, N);
          // sky() ist Beleuchtung eines weissen, matten Körpers (Pixelwert), Glanzstrahlen sehen den Himmel mit GLOSS_SKY
          vec3 spec = (0.04 + (1.0 - rough - 0.04) * pow(1.0 - nv, 5.0)) * max(sky(vec3(R.x, -R.z, R.y)), 0.0) * GLOSS_SKY * sky0;
          vec3 H = normalize(V + SKY_LIGHT);
          float nh = max(dot(N, H), 0.0), k = rough * rough * 0.5, nlp = max(nl, 0.0);
          float ggx = a2 / (3.14159 * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
          float fs = 0.04 + 0.96 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
          spec += GLOSS_SUN * sun * ggx * fs * nlp / (4.0 * mix(nlp, 1.0, k) * mix(nv, 1.0, k));
          lin += spec * (1.0 - ${T} * leaf);
          lin = mix(lin, HAZE, 1.0 - exp(-dist / ${glf(L.airDist)}));
          // gemalt wie anime.grade (Anzeige-Farben, sRGB-kodiert)
          vec3 d = encode(aces(lin * ${glf(P.exposure)}));
          float lum = dot(d, vec3(0.2126, 0.7152, 0.0722));
          d = lum + (d - lum) * ${glf(P.saturation)};
          d += (1.0 - smoothstep(0.0, 0.45, lum)) * SHADOW;
          d *= 1.0 + smoothstep(0.35, 0.85, lum) * (WARM - 1.0);
          return min(acesInverse(decode(clamp(d, 0.0, 1.0))), 0.91); // TEX_MAX
        }
        void main() {
          vShape = aShape;
          mat4 m = modelMatrix * instanceMatrix;
          // Azimut der Sonne in den Achsen der Vorlage (x = cos φ, z = sin φ): Licht durch die eigene Krone
          vec2 sd = vec2(dot(SKY_LIGHT, normalize(m[0].xyz)), dot(SKY_LIGHT, normalize(m[2].xyz)));
          sd /= max(length(sd), 1e-4);
          float self = clamp(aSelf.y + aSelf.z * sd.x + aSelf.w * sd.y, 0.0, 1.0);
          float sun = mix(aInfo.x, aInfo.y, smoothstep(0.2, 0.8, position.y)) * self;
          vec4 wp = m * vec4(position, 1.0);
          vec3 sc = vec3(length(m[0].xyz), length(m[1].xyz), length(m[2].xyz));
          vec3 N = normalize(mat3(m) * (normal / (sc * sc)));
          vec3 toCam = cameraPosition - wp.xyz;
          float dist = length(toCam);
          vFront = shade(N, toCam / dist, dist, sun, aSelf.x, aLeaf);
          vBack = shade(-N, toCam / dist, dist, sun, aSelf.x, aLeaf); // Rückseite: Normale umgedreht
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `
        uniform float uFade, uReady;
        varying vec3 vFront, vBack;
        varying vec2 vShape;
        void main() {
          // runde Blätter statt Sechsecke (gemalt verwischt der Pinsel ihre Ecken), zur Spitze schmaler
          if (abs(vShape.y) > 0.5 * pow(sin(3.14159 * vShape.x), 0.6) * (1.0 - 0.2 * vShape.x)) discard;
          gl_FragColor = vec4((gl_FrontFacing ? vFront : vBack) * uFade * uReady, 1.0);
        }`,
  });
  return yield* instancedModels(set, material, true);
}

/**
 * Nahe Objekte mit gebackenem Licht (Daten: { pos16: Ecken in Spielkoordinaten als Int16 / scale, uv16: UV als Uint16,
 * idx16/idx32: Dreiecke, rock8: je Ecke 0 … 255, wie viel Fels sie trägt, texture: Bild – Szenenwerte vor ACES,
 * sRGB-kodiert, gemalt wie das Panorama }; Strand: die nahen Felsen samt dem Gelände ihrer Gruppen). Blender hat sie
 * beleuchtet, mit Schatten; das Panorama zeigt sie nicht (aus seinem Mittelpunkt gesehen lägen sie schräg), ihre
 * Schatten darin bleiben. Wo das Gelände flach ist (rock8 unter der Hälfte), zeigt sich das Panorama: Dort stimmt es
 * (gebacken hob sich der Sand ab). Mit fade: [von, bis] läuft das Netz dazwischen ins Panorama aus, statt hart
 * abzubrechen: durchsichtig, oder mit ground: [sink, up] (Wüste: rock8 · up ist die Höhe der nahen Dünen über dem Sand
 * des Panoramas, das Netz liegt sink tiefer) in die Farbe, die das Panorama vom Sand direkt darunter zeigt; Strand:
 * ground [0, 0], das flache Gelände der Felsgruppen nimmt die Farbe, die das Panorama genau dort zeigt (sonst stand es
 * mit Treppenrand heller im Sand).
 * Mit view, viewTexture, viewData zeigen sie, wo man sie vom Mittelpunkt des Panoramas aus sieht, das Bild, das Blender
 * von dort gemalt hat (vom Mittelpunkt aus projiziert: so sahen sie aus, als das Panorama sie noch zeigte – gebacken
 * wirkten sie fleckiger und flauer); sonst das gebackene Licht. view.windows: Ausschnitte [az0, az1, el0, el1 (Grad,
 * wie das Equirect), Breite, Zeile oben, Zeile unten (Anteil des Bilds)], untereinander im Bild; viewData ein Viertel:
 * R Abstand vom Mittelpunkt (log, 8 Bit, Bereich view.log), G Gewicht (0 neben und am Rand der Felsen). Ein Punkt
 * gilt als von dort gesehen, wenn sein Abstand zu dem im Bild passt.
 * Generator (sliced: wartet, bis die Bilder dekodiert sind; hochgeladen werden sie mit den übrigen Texturen vor dem
 * Einblenden).
 */
function* bakedMesh(ctx, opt) {
  const set = ctx.data[opt.data];
  // je Feld und Stück ein Häppchen (sliced, b64Bytes): zusammen hielt das Entpacken ein Bild 30–40 ms an, ein grosses
  // Feld allein auf dem gedrosselten Handy noch 50–60 ms (Ticket 09 der Leistung)
  const q = new Int16Array(yield* b64Bytes(set.pos16));
  const uv = new Uint16Array(yield* b64Bytes(set.uv16));
  const rock = new Uint8Array(yield* b64Bytes(set.rock8));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(yield* mappedFloats(q, (v) => v / set.scale), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(yield* mappedFloats(uv, (v) => v / 65535), 2));
  geo.setAttribute('aRock', new THREE.BufferAttribute(yield* mappedFloats(rock, (v) => v / 255), 1));
  const idx = set.idx16 ? new Uint16Array(yield* b64Bytes(set.idx16)) : new Uint32Array(yield* b64Bytes(set.idx32));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  // Bild aus einer Data-URL, dekodiert, nicht nur geladen: Sonst dekodierte es texImage2D beim Hochladen im Hauptthread
  // (siehe loadSkyImage). color: Farbbild (sRGB, Mipmaps), sonst Daten (nächster Nachbar, ohne Mipmaps)
  // Als ImageBitmap ohne Farbumrechnung, im Hintergrund dekodiert: Ein dekodiertes Bild (img.decode) dekodierte der
  // Browser beim Hochladen noch einmal im Hauptthread, weil three die Farbumrechnung abschaltet. Farbbilder dazu in
  // Streifen zu 256 Zeilen, die skyUpload je in einem eigenen Bild hochlädt (Mipmaps danach auf der Grafikkarte): Das
  // grosse Bild der Felsen am Strand (2662 × 1706) hielt in einem Stück ein Bild über 100 ms an (Ticket 08). Wo das
  // nicht geht, wie bisher als Bild.
  const BITMAP = { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }, ZEILEN = 256;
  const image = function* (url, color) {
    let bitmap = null, done = typeof createImageBitmap !== 'function';
    if (!done) {
      fetch(url).then((r) => r.blob()).then((blob) => createImageBitmap(blob, BITMAP))
        .then((b) => { bitmap = b; }, () => {}).finally(() => { done = true; });
    }
    while (!done) yield NEXT_FRAME;
    let strips = null;
    if (bitmap && color && renderer.capabilities.isWebGL2 && typeof OffscreenCanvas === 'function') {
      // Streifen über ein OffscreenCanvas wie in skyBitmaps, je einer in einem Häppchen: Einen mit
      // createImageBitmap(bitmap, 0, y, …) zugeschnittenen lädt Firefox ohne den Zuschnitt in WebGL (deckende JPEGs:
      // das vormultiplizierte Canvas ändert nichts). Ohne OffscreenCanvas das ganze Bild in einem Stück.
      const { width: w, height: h } = bitmap, list = [];
      try {
        for (let y = 0; y < h; y += ZEILEN) {
          const c = new OffscreenCanvas(w, Math.min(ZEILEN, h - y));
          c.getContext('2d', { willReadFrequently: true }).drawImage(bitmap, 0, -y);
          list.push({ level: 0, y, bitmap: c.transferToImageBitmap() });
          yield;
        }
        strips = list;
      } catch { for (const s of list) s.bitmap.close(); }
    }
    const img = strips ? { width: bitmap.width, height: bitmap.height } : bitmap ?? new Image();
    const tex = new THREE.Texture(img);
    if (strips) {
      bitmap.close();
      tex.userData.strips = strips;
      tex.userData.mipmaps = true;
    } else if (bitmap) tex.addEventListener('dispose', () => bitmap.close());
    tex.flipY = false; // Zeile 0 oben wie die Bilder und die UV-Karte aus Blender (v nach oben): im Shader 1 − v
    if (color) {
      tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    } else {
      tex.minFilter = tex.magFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
    }
    if (strips) return tex; // lädt skyUpload hoch, three nicht (needsUpdate bleibt aus)
    if (!bitmap) {
      let decoded = null;
      img.src = url;
      img.decode().then(() => { decoded = true; }, () => { decoded = false; });
      while (decoded === null) yield NEXT_FRAME;
      if (!decoded || !img.naturalWidth) throw new Error('Bild der Felsen nicht lesbar');
    }
    tex.needsUpdate = true;
    return tex;
  };
  const tex = yield* image(set.texture, true);
  const view = set.view && set.viewTexture && set.viewData ? set.view : null;
  const uniforms = { ...ctx.uniforms, uTex: { value: tex } };
  if (view) {
    uniforms.uView = { value: yield* image(set.viewTexture, true) };
    uniforms.uViewData = { value: yield* image(set.viewData, false) };
  }
  // je Ausschnitt: Lage im Bild und Gewicht 0 … 1 (ohne Verzweigung: Ableitungen fürs Farbbild gelten überall)
  const windows = (view?.windows ?? []).map(([a0, a1, e0, e1, w, t0, t1], i) => `
          {
            vec2 st = vec2((az - ${glf(a0)}) / ${glf(a1 - a0)}, (${glf(e1)} - el) / ${glf(e1 - e0)});
            float inside = step(0.0, st.x) * step(st.x, 1.0) * step(0.0, st.y) * step(st.y, 1.0);
            vec2 uv${i} = vec2(st.x * ${glf(w)}, ${glf(t0)} + st.y * ${glf(t1 - t0)});
            vec4 dd = texture2D(uViewData, uv${i});
            float ld = mix(VIEW_LOG.x, VIEW_LOG.y, dd.r);
            float w${i} = inside * dd.g * (1.0 - smoothstep(0.015, 0.04, abs(log(dist) - ld)));
            viewUv = mix(viewUv, uv${i}, inside);
            weight = max(weight, w${i});
          }`).join('');
  // fade [von, bis] in rock8: dort geht die Farbe in die des Panoramas über; ground [sink, up]: rock8 ist die Höhe über
  // dem Sand des Panoramas (mal up, in m), das Netz liegt sink tiefer – die Farbe kommt von diesem Sand unter dem Punkt
  // (was dahinter liegt, wäre bei schrägem Blick der Sand unter der Düne)
  const fade = opt.fade ?? null, ground = fade && opt.ground;
  if (ground) Object.assign(uniforms, { uPano: { value: ctx.pano.full } });
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
        attribute float aRock;
        varying vec2 vUv;
        varying float vRock;
        varying vec3 vPos;
        void main() {
          vUv = vec2(uv.x, 1.0 - uv.y);
          vRock = aRock;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `${ground ? `
        #if __VERSION__ >= 300
          #define LOD0(t, p) textureLod(t, p, 0.0)
        #elif defined(GL_EXT_shader_texture_lod)
          #define LOD0(t, p) texture2DLodEXT(t, p, 0.0)
        #else
          #define LOD0(t, p) texture2D(t, p)
        #endif
        uniform sampler2D uPano;` : ''}
        uniform sampler2D uTex${view ? ', uView, uViewData' : ''};
        uniform float uFade, uReady;
        varying vec2 vUv;
        varying float vRock;
        varying vec3 vPos;
        const vec3 VIEW_CENTER = ${glv(ctx.pano.center.toArray())};
        const vec2 VIEW_LOG = ${glv((view?.log ?? [1, 2]).map(Math.log))};
        void main() {
          vec3 col = texture2D(uTex, vUv).rgb;${view ? `
          // Richtung vom Mittelpunkt wie im Equirect (Grad): az von Blender +y aus, el über dem Horizont
          vec3 d = vPos - VIEW_CENTER;
          float dist = length(d);
          float az = degrees(atan(d.x, -d.z)), el = degrees(asin(clamp(d.y / dist, -1.0, 1.0)));
          vec2 viewUv = vec2(0.0);
          float weight = 0.0;${windows}
          col = mix(col, texture2D(uView, viewUv).rgb, weight);` : ''}
          ${ground ? `if (vRock < ${glf(fade[0])}) discard;
          vec3 g = vec3(vPos.x, vPos.y + ${glf(ground[0])} - vRock * ${glf(ground[1])}, vPos.z) - VIEW_CENTER;
          vec3 b = normalize(vec3(g.x, -g.z, g.y));
          vec3 sand = LOD0(uPano, vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927)).rgb;
          col = mix(sand, col, smoothstep(${glf(fade[0])}, ${glf(fade[1])}, vRock));` : fade ? `float a = smoothstep(${glf(fade[0])}, ${glf(fade[1])}, vRock);
          if (a <= 0.0) discard;` : 'if (vRock < 0.5) discard;'}
          gl_FragColor = vec4(col * uFade * uReady, ${fade && !ground ? 'a' : '1.0'});
        }`,
    transparent: !!fade && !ground,
    extensions: { shaderTextureLOD: !!ground },
  }));
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * Leuchtpunkte zwischen nahen Objekten (Daten wie toonInstances; Wald: Glühwürmchen): im Ring um das Brett, über dem
 * Nebel, unter der Brettebene; klein, mit weichem Schein, sie leuchten unregelmässig auf (etwa eine halbe Sekunde, dann
 * eine Weile dunkel).
 */
function glowParticles(ctx, opt) {
  const rand = mulberry32(opt.seed);
  const [r0, r1] = opt.ring;
  const spots = ctx.data[opt.data].instances.filter(([x, y, z, , , , , , , , top = -Infinity]) =>
    Math.hypot(x, z) > r0 && Math.hypot(x, z) < r1 && y > top + opt.aboveFog);
  const n = opt.count, pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n && spots.length; i++) {
    const [x, y, z] = spots[Math.floor(rand() * spots.length)];
    pos.set([x + (rand() - 0.5) * opt.spread, Math.min(y + opt.lift[0] + rand() * opt.lift[1], opt.yMax), z + (rand() - 0.5) * opt.spread], i * 3);
    seed[i] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: ctx.pointUniforms,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute float aSeed;
        uniform float uTime, uFade, uReady, uPixelRatio;
        varying float vGlow;
        void main() {
          float t = uTime * (0.2 + 0.15 * aSeed) + aSeed * 60.0;
          vec3 p = position + vec3(sin(t) * 1.2 + sin(t * 0.37) * 0.7, sin(t * 0.7 + 1.0) * 0.4, cos(t * 0.83) * 1.2);
          p.y = min(p.y, ${glf(opt.ceiling)}); // nie über die Brettebene
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float ph = fract(uTime * (0.25 + 0.2 * aSeed) + aSeed * 7.0);
          float blink = smoothstep(0.0, 0.08, ph) * smoothstep(0.3, 0.12, ph); // kurz an, lange aus
          vGlow = blink * uFade * uReady;
          gl_PointSize = ${glf(opt.size)} * uPixelRatio * 40.0 / -mv.z;
        }`,
    fragmentShader: `varying float vGlow;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float core = smoothstep(0.3, 0.0, r), halo = exp(-r * r * 6.0) * 0.35;
          gl_FragColor = vec4((${glv(opt.color)} * core * 2.2 + ${glv(opt.halo)} * halo) * vGlow, 0.0);
        }`,
  }));
  points.frustumCulled = false;
  points.renderOrder = 6;
  return points;
}

/**
 * Ziehender Nebelschleier: durchscheinende Lagen knapp über der Oberkante des Nebelmeers (fog.top; sheets: Höhe darüber,
 * Deckkraft, Versatz des Musters), deren Schwaden langsam mit dem Wind treiben und sich dabei verändern. Wo Kämme
 * höher liegen, verdeckt sie das Panorama (Tiefentest): Der Schleier bleibt in den Tälern. Farbe wie der gemalte Nebel
 * (air), zum Licht hin heller; zum Rand der Sicht (fade) blendet er aus.
 */
function mistSheets(ctx, opt) {
  const out = new THREE.Group(), air = ctx.air;
  opt.sheets.forEach(([dy, alpha, off]) => {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(opt.radius, 64).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { ...ctx.uniforms, uAlpha: { value: alpha }, uOff: { value: off } },
      transparent: true, depthWrite: false,
      vertexShader: `varying vec3 vPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
      fragmentShader: `uniform float uTime, uFade, uReady, uAlpha, uOff;
          varying vec3 vPos;
          ${GLSL_NOISE}
          ${ctx.lightGLSL}
          const vec3 HAZE = ${glv(air.haze)}, FOG_LIT = ${glv(air.lit)};
          void main() {
            vec2 wind = ${glv(opt.wind)};
            vec2 p = vPos.xz - wind * uTime * ${glf(opt.speed)};
            // in Windrichtung gestreckte Schwaden, die sich langsam verändern
            vec2 q = vec2(dot(p, wind), dot(p, vec2(-wind.y, wind.x)) * ${glf(opt.stretch)}) / ${glf(opt.scale)};
            float n = fbm3(vec3(q, uTime * 0.02 + uOff * 7.0));
            float a = smoothstep(${glf(opt.cover[0])}, ${glf(opt.cover[1])}, n) * uAlpha;
            vec3 toCam = cameraPosition - vPos;
            float dist = length(toCam);
            a *= smoothstep(${glf(opt.fade[1])}, ${glf(opt.fade[0])}, dist);
            vec2 h = normalize(-toCam.xz + vec2(1e-4)), m = normalize(SKY_LIGHT.xz);
            vec3 col = mix(HAZE, FOG_LIT, pow(max(dot(h, m), 0.0), 2.0));
            float k = uFade * uReady;
            gl_FragColor = vec4(col * k, a * k);
          }`,
    }));
    disc.position.y = ctx.fog.top + dy;
    disc.frustumCulled = false;
    disc.renderOrder = 5;
    out.add(disc);
  });
  return out;
}

/**
 * Lavasee unter dem Brett (Vulkan, wie der Nyiragongo): eine Scheibe auf der Höhe level (+ lift zur Kamera hin, für
 * den Tiefentest gegen das Netz des Panoramas), Radius radius, am Rand über fade ins gemalte Panorama ausgeblendet.
 * Dunkle Krustenplatten (crust: zwei Töne) mit unregelmässigen, glühenden Rissen in zwei Grössen (plates: Platten
 * scale m, feinere Risse fine im Anteil der Platten, Breite crack im Anteil der Zelle); die Platten treiben (drift, m/s)
 * und verformen sich langsam (churn), die Risse öffnen und schliessen sich. Farbe der Glut nach Hitze (heat: Kern,
 * heiss, tief). Gasblasen (bursts: count Stellen im Ring ring, Radius size, Dauer period in s) wölben die Kruste auf,
 * ihre Risse glühen auf, dann reisst sie, Lava spritzt kurz hoch (spatter: Tropfen je Blase, Höhe height in m, Grösse
 * size) und kühlt wieder zu Kruste ab. Dazu Funken (sparks). Nahe beim Brett (calm: Radien, Faktor) glüht alles
 * gedämpfter. Alle Farben sind Szenenwerte unter der Bloom-Schwelle.
 */
function lavaPool(ctx, opt) {
  const out = new THREE.Group();
  const y0 = opt.level + opt.lift;
  const [calm0, calm1, calmK] = opt.calm;
  const [core, hot, deep] = opt.heat;
  const pl = opt.plates, bu = opt.bursts, sp = opt.spatter;
  const rand = mulberry32(opt.seed);
  // Blasen: Ort, Dauer, Versatz (gemeinsam für Scheibe und Spritzer)
  const bursts = Array.from({ length: bu.count }, () => {
    const a = rand() * 2 * Math.PI, r = bu.ring[0] + rand() * (bu.ring[1] - bu.ring[0]);
    return { x: Math.sin(a) * r, z: Math.cos(a) * r, period: bu.period[0] + rand() * (bu.period[1] - bu.period[0]),
      offset: rand(), size: bu.size[0] + rand() * (bu.size[1] - bu.size[0]) };
  });
  const burstU = bursts.map((b) => new THREE.Vector4(b.x, b.z, b.period, b.offset));
  const sizeU = bursts.map((b) => b.size);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(opt.radius, 160).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { ...ctx.uniforms, uBursts: { value: burstU }, uBurstR: { value: sizeU } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
    fragmentShader: `uniform float uTime, uFade, uReady;
        uniform vec4 uBursts[${bu.count}];
        uniform float uBurstR[${bu.count}];
        varying vec3 vPos;
        ${GLSL_NOISE}
        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453);
        }
        // Abstand zur nächsten Zellgrenze (Anteil der Zelle); die Zellpunkte kreisen langsam (die Platten verformen sich)
        float cells(vec2 x, float t) {
          vec2 n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0);
          float md = 8.0;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j)), o = 0.5 + 0.4 * sin(t + 6.2831 * hash2(n + g));
            vec2 r = g + o - f;
            float d = dot(r, r);
            if (d < md) { md = d; mr = r; mg = g; }
          }
          md = 8.0;
          for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
            vec2 g = mg + vec2(float(i), float(j)), o = 0.5 + 0.4 * sin(t + 6.2831 * hash2(n + g));
            vec2 r = g + o - f;
            if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
          }
          return md;
        }
        const vec3 CORE = ${glv(core)}, HOT = ${glv(hot)}, DEEP = ${glv(deep)};
        const vec3 CRUST0 = ${glv(opt.crust[0])}, CRUST1 = ${glv(opt.crust[1])};
        vec3 glow(float h) { return h < 0.5 ? mix(DEEP, HOT, h * 2.0) : mix(HOT, CORE, h * 2.0 - 1.0); }
        void main() {
          vec2 p = vPos.xz;
          float t = uTime;
          vec2 q = p - ${glv(pl.drift)} * t;
          vec2 w = q + (vec2(fbm3(vec3(q * 0.12, t * 0.02)), fbm3(vec3(q * 0.12 + 7.0, t * 0.02))) - 0.44) * 8.0;
          float open = 0.7 + 0.6 * noise(vec3(p * 0.15, t * 0.25));            // Risse atmen
          float big = cells(w / ${glf(pl.scale)}, t * ${glf(pl.churn)});
          float small = cells(w / ${glf(pl.scale * 0.32)} + 9.0, t * ${glf(pl.churn * 1.3)});
          float cw = ${glf(pl.crack)} * open;
          float k1 = (1.0 - smoothstep(0.0, cw, big)) * mix(0.5, 1.0, smoothstep(0.3, 0.65, noise(vec3(w * 0.4, 2.0))));
          float k2 = (1.0 - smoothstep(0.0, cw * 0.8, small)) * smoothstep(${glf(1 - pl.fine)}, ${glf(1 - pl.fine + 0.12)}, noise(vec3(p * 0.3, 5.0))) * 0.75;
          float heat = max(k1, k2);
          float halo = (1.0 - smoothstep(0.0, cw * 3.5, big)) * 0.18;            // Kruste neben den Rissen glimmt
          vec3 crust = mix(CRUST0, CRUST1, noise(vec3(w * 0.5, 1.0)));
          // Blasen: Kruste wölbt sich, Risse glühen auf, reisst, glüht hell, kühlt ab
          for (int i = 0; i < ${bu.count}; i++) {
            vec4 b = uBursts[i];
            float R = uBurstR[i];
            float ph = fract(t / b.z + b.w);
            vec2 d = p - b.xy;
            float r = length(d);
            if (r > R * 3.0) continue;
            if (ph < 0.55) {                                                   // aufwölben
              float s = ph / 0.55, rr = R * (0.4 + 0.6 * s);
              float inside = 1.0 - smoothstep(rr * 0.85, rr, r);
              float torn = 1.0 - smoothstep(0.0, cw * (0.8 + 1.2 * s), small);   // die feinen Risse reissen auf
              crust = mix(crust, crust * 1.6 + 0.01, inside * s);                // gespannt, heller
              heat = max(heat, inside * torn * s * s * 0.85);
              heat = max(heat, (1.0 - smoothstep(rr, rr * 1.15, r)) * smoothstep(rr * 0.8, rr, r) * s * 0.6);
            } else if (ph < 0.68) {                                            // aufgerissen: helle Lava
              float s = (ph - 0.55) / 0.13;
              float edge = R * (1.0 + 0.45 * s) * (0.75 + 0.5 * noise(vec3(d * 2.5, b.w * 30.0 + s)));
              heat = max(heat, (1.0 - smoothstep(edge * 0.8, edge, r)) * (0.7 + 0.3 * (1.0 - r / edge)));
            } else {                                                           // abkühlen, Spritzer ringsum
              float s = (ph - 0.68) / 0.32;
              float edge = R * (1.1 - 0.6 * s) * (0.75 + 0.5 * noise(vec3(d * 2.5, b.w * 30.0 + 1.0)));
              float spot = (1.0 - smoothstep(edge * 0.75, edge, r)) * (0.6 + 0.4 * (1.0 - r / edge));
              float drops = step(0.86, noise(vec3(d * 5.0, b.w * 40.0))) * (1.0 - smoothstep(R, R * 2.6, r));
              heat = max(heat, max(spot, drops * 0.8) * (1.0 - s) * (1.0 - s));
            }
          }
          float calm = mix(${glf(calmK)}, 1.0, smoothstep(${glf(calm0)}, ${glf(calm1)}, length(p)));
          vec3 col = crust + DEEP * halo * calm;
          col = mix(col, glow(heat) * calm, smoothstep(0.02, 0.25, heat));
          float a = 1.0 - smoothstep(${glf(opt.radius - opt.fade)}, ${glf(opt.radius)}, length(p));
          gl_FragColor = vec4(col, a * uFade * uReady);
        }`,
  }));
  disc.position.y = y0;
  disc.frustumCulled = false;
  disc.renderOrder = -900; // gleich nach dem Panorama, vor allem Übrigen
  out.add(disc);

  // Spritzer (beim Aufreissen hochgeworfen, im Bogen zurück) und Funken (steigen auf): Punkte, Grösse in Metern
  const screenH = { value: 1 };
  const P = [], A = [], B = [];
  for (const b of bursts) {
    for (let k = 0; k < sp.count; k++) {
      const a = rand() * 2 * Math.PI, h = rand() * 1.4;
      P.push(b.x, y0, b.z);
      A.push(Math.cos(a) * h, sp.height * (0.5 + 0.5 * rand()), Math.sin(a) * h, -1);   // Geschwindigkeit; w < 0: Spritzer
      B.push(b.period, b.offset, 0, 0);
    }
  }
  const sk = opt.sparks;
  for (let i = 0; i < sk.count; i++) {
    const a = rand() * 2 * Math.PI, r = Math.sqrt(rand()) * (opt.radius - opt.fade);
    P.push(Math.sin(a) * r, y0, Math.cos(a) * r);
    A.push(0, sk.height * (0.5 + 0.5 * rand()), 0, rand());
    B.push(1.6 + rand() * 2.4, rand(), 0, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('aVel', new THREE.Float32BufferAttribute(A, 4));
  geo.setAttribute('aTime', new THREE.Float32BufferAttribute(B, 4));
  const drops = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: { ...ctx.pointUniforms, uScreenH: screenH },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec4 aVel, aTime;
        uniform float uTime, uScreenH;
        varying float vOn, vCool;
        void main() {
          vec3 p = position;
          float size;
          if (aVel.w < 0.0) {                         // Spritzer: ab dem Aufreissen (Phase 0.55) im Bogen
            float tau = (fract(uTime / aTime.x + aTime.y) - 0.55) * aTime.x;
            float vy = sqrt(2.0 * 9.81 * aVel.y);
            p += vec3(aVel.x * tau, vy * tau - 4.905 * tau * tau, aVel.z * tau);
            vOn = step(0.0, tau) * step(${glf(opt.level)}, p.y);
            vCool = clamp(tau / 1.2, 0.0, 1.0);
            size = ${glf(sp.size)};
          } else {                                    // Funke: steigt auf, schwankt
            float ph = fract(uTime / aTime.x + aTime.y * 13.0), s = aVel.w * 6.2831;
            p += vec3(sin(uTime * 1.3 + s) * 0.8 * ph, ph * aVel.y, cos(uTime * 1.1 + s) * 0.8 * ph);
            vOn = 1.0 - smoothstep(0.6, 1.0, ph);
            vCool = ph;
            size = ${glf(sk.size)};
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(size * projectionMatrix[1][1] * 0.5 * uScreenH / max(-mv.z, 0.1), 1.5);
        }`,
    fragmentShader: `uniform float uFade, uReady;
        varying float vOn, vCool;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float a = (1.0 - smoothstep(0.5, 1.0, r)) * vOn;
          vec3 col = mix(${glv(sp.color)}, ${glv(sk.color)}, vCool);   // kühlt ab: gelb zu rot
          gl_FragColor = vec4(col * a * uFade * uReady, 0.0);
        }`,
  }));
  drops.frustumCulled = false;
  drops.renderOrder = 6;
  out.add(drops);
  const size = new THREE.Vector2();
  out.userData.update = () => { screenH.value = renderer.getDrawingBufferSize(size).y; };
  return out;
}

/**
 * Feuernester (Vulkan, wie im Gaskrater Darvaza): Das Panorama zeigt nur ihren Schein, den Russ und die glimmenden
 * Risse, die Flammen zeichnet das Spiel bewegt. Je Flamme eine aufrechte Fläche, zur Kamera gedreht, der Fuss auf der
 * Böschung (data: flames je [x, y, z, Höhe, Breite, Zufall] in Spielkoordinaten, vom Export der Szene); im Shader drei
 * Zungen aus Rauschen, das nach oben zieht: Sie flackern, schwanken und reissen an der Spitze auf, in vier Farbstufen
 * wie gemalt (core, mid, edge, deep ab den Schwellen bands), am Fuss ein bläulicher Saum (base), rundum ein weicher
 * Glutschein (halo); shape: Faktor auf Höhe und Breite. Dazu je Nest (nests: [x, y, z, Zahl der Flammen]) ein weicher
 * Schein (glow, Radius glowSize m plus 0,25 m je Flamme), der mitflackert: das Licht auf dem Sand, und aufsteigende
 * Funken (embers: count je Nest, Höhe height m, Grösse size m, Farbe color). Keine Texturen, nur Ecken (rund 1000
 * Flammen: gut 130 KB, samt Schein und Funken gut 150 KB). lift: so weit zur Kamera hin (m), für den Tiefentest gegen
 * das Netz des Panoramas; cover: so viel deckt eine Flamme den Grund ab (der Rest kommt dazu). Farben unter der
 * Bloom-Schwelle.
 */
function fireNests(ctx, opt) {
  const out = new THREE.Group();
  const { flames, nests } = ctx.data[opt.data];
  const n = flames.length;
  const foot = new Float32Array(n * 12), shape = new Float32Array(n * 12), corner = new Float32Array(n * 8);
  const index = new (n * 4 > 65536 ? Uint32Array : Uint16Array)(n * 6); // ab 16384 Flammen reicht Uint16 nicht
  flames.forEach(([x, y, z, h, w, s], i) => {
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      foot.set([x, y, z], v * 3);
      shape.set([h, w, s], v * 3);
      corner.set([k & 1 ? 1 : -1, k >> 1], v * 2);
    }
    index.set([i * 4, i * 4 + 1, i * 4 + 3, i * 4, i * 4 + 3, i * 4 + 2], i * 6);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(foot, 3));
  geo.setAttribute('aFlame', new THREE.BufferAttribute(shape, 3));
  geo.setAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  const speed = glf(opt.speed);
  const tongues = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec3 aFlame;
        attribute vec2 aCorner;
        uniform float uTime;
        varying vec2 vUv;
        varying float vSeed, vHot;
        void main() {
          float s = aFlame.z, t = uTime * ${speed};
          // Flackern: die Flamme wächst und schrumpft unregelmässig, je Flamme anders
          float flick = 0.8 + 0.12 * sin(t * 6.1 + s * 40.0) + 0.08 * sin(t * 11.3 + s * 17.0) + 0.06 * sin(t * 2.3 + s * 5.0);
          vec3 toCam = cameraPosition - position;
          vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
          vec3 front = normalize(vec3(toCam.x, 0.0, toCam.z) + 1e-4);
          // die Fläche ist breiter und höher als die Flamme: Platz zum Schwanken
          float h = aFlame.x * flick * 1.15 * ${glf(opt.shape[0])}, w = aFlame.y * 2.0 * ${glf(opt.shape[1])};
          vec3 p = position + front * ${glf(opt.lift)} + side * (aCorner.x * w * 0.5) + vec3(0.0, aCorner.y * h, 0.0);
          vUv = aCorner; vSeed = s; vHot = flick;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
    fragmentShader: `uniform float uTime, uFade, uReady;
        varying vec2 vUv;
        varying float vSeed, vHot;
        ${GLSL_NOISE}
        void main() {
          float t = uTime * ${speed};
          // Rauschen zieht nach oben; nach oben schwankt die Flamme mehr, die Ränder fransen aus, die Spitzen reissen
          // auf. Unten breit auf dem Boden (rund unten und spitz oben wirkte wie ein Tropfen). Drei Zungen: in der Mitte
          // die grosse, links und rechts kürzere, die abwechselnd auflodern
          float n = fbm3(vec3(vUv.x * 1.6 + vSeed * 13.0, vUv.y * 2.2 - t * 2.2, t * 0.4 + vSeed * 7.0));
          float e = noise(vec3(vUv.x * 4.0 + vSeed * 5.0, vUv.y * 5.0 - t * 4.0, vSeed * 3.0));
          float y0 = vUv.y * 1.15, sway = (n - 0.44) * 1.8 * vUv.y, body = 0.0, heat = 0.0;
          for (int i = 0; i < 3; i++) {
            float fi = float(i) - 1.0;
            float tall = i == 1 ? 1.0 : 0.6 + 0.18 * sin(t * 3.1 + vSeed * 20.0 + fi * 2.1);
            float y = y0 / tall;
            float x = vUv.x * 2.0 - fi * 0.34 + sway;
            float width = (y < 0.25 ? 0.75 + y : pow(max(1.0 - y, 0.0) / 0.75, 0.9)) * (i == 1 ? 1.0 : 0.55);
            float d = abs(x) / max(width, 1e-3) + (e - 0.5) * 0.7 * y;
            float b = (1.0 - smoothstep(0.8, 1.0, d)) * (1.0 - smoothstep(0.5, 0.9, y + (n - 0.44) * 1.2));
            body = max(body, b);
            heat = max(heat, b * pow(max(1.0 - d, 0.0), 1.5) * (1.0 - 0.9 * y));
          }
          // Glut um die Flamme: ein weicher Schein, nur dazugezählt
          float halo = exp(-(vUv.x * vUv.x * 2.5 + (y0 - 0.3) * (y0 - 0.3) * 3.5)) * (0.75 + 0.25 * vHot);
          if (body < 0.01 && halo < 0.02) discard;
          heat *= vHot;
          vec3 col = heat > ${glf(opt.bands[0])} ? ${glv(opt.core)} : heat > ${glf(opt.bands[1])} ? ${glv(opt.mid)}
            : heat > ${glf(opt.bands[2])} ? ${glv(opt.edge)} : ${glv(opt.deep)};
          // Gas brennt am Fuss bläulich: ein schmaler Saum unten in der Mitte
          col = mix(col, ${glv(opt.base)}, (1.0 - smoothstep(0.02, 0.1, y0)) * smoothstep(0.2, 0.5, heat) * 0.8);
          float k = uFade * uReady, a = body * k;
          gl_FragColor = vec4(col * a + ${glv(opt.halo)} * halo * (1.0 - body) * k, a * ${glf(opt.cover)});
        }`,
  }));
  tongues.frustumCulled = false;
  tongues.renderOrder = 6;
  out.add(tongues);

  // Schein je Nest: ein weicher Fleck, der unregelmässig mitflackert. Als Fläche zur Kamera, nicht als Punkt: Punkte
  // wären hier mehrere hundert Pixel gross (manche Handys begrenzen sie) und fielen ganz weg, sobald ihre Mitte das
  // Bild verlässt (Review)
  const screenH = { value: 1 };
  const G = [], K = [], GC = [], GI = [];
  nests.forEach(([x, y, z, k], i) => {
    for (let c = 0; c < 4; c++) {
      G.push(x, y + 0.6, z);
      K.push(opt.glowSize + 0.25 * k, (i * 0.618) % 1);
      GC.push(c & 1 ? 1 : -1, c & 2 ? 1 : -1);
    }
    GI.push(i * 4, i * 4 + 1, i * 4 + 3, i * 4, i * 4 + 3, i * 4 + 2);
  });
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.Float32BufferAttribute(G, 3));
  gGeo.setAttribute('aGlow', new THREE.Float32BufferAttribute(K, 2));
  gGeo.setAttribute('aCorner', new THREE.Float32BufferAttribute(GC, 2));
  gGeo.setIndex(GI);
  const glow = new THREE.Mesh(gGeo, new THREE.ShaderMaterial({
    uniforms: ctx.uniforms,
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec2 aGlow, aCorner;
        uniform float uTime;
        varying float vK;
        varying vec2 vUv;
        void main() {
          float t = uTime * ${speed}, s = aGlow.y * 6.2831;
          vK = 0.55 + 0.25 * sin(t * 5.3 + s * 3.0) + 0.2 * sin(t * 9.7 + s * 7.0);
          vUv = aCorner;
          vec4 mv = viewMatrix * vec4(position, 1.0);
          mv.xy += aCorner * aGlow.x;   // in Blickrichtung ausgerichtet, Radius in Metern
          gl_Position = projectionMatrix * mv;
        }`,
    fragmentShader: `uniform float uFade, uReady;
        varying float vK;
        varying vec2 vUv;
        void main() {
          float r = length(vUv);
          gl_FragColor = vec4(${glv(opt.glow)} * exp(-r * r * 4.0) * (1.0 - smoothstep(0.8, 1.0, r)) * vK * uFade * uReady, 0.0);
        }`,
  }));
  glow.frustumCulled = false;
  glow.renderOrder = 5;
  out.add(glow);

  // Funken (embers: count je Nest): steigen aus dem Nest auf, schwanken, kühlen von Gelb zu Rot ab und verlöschen
  const em = opt.embers, rand = mulberry32(31), E = [], EA = [];
  for (const [x, y, z, k] of nests) {
    const spread = 0.4 + 0.06 * k;
    for (let j = 0; j < em.count; j++) {
      E.push(x + (rand() - 0.5) * 2 * spread, y + 0.3, z + (rand() - 0.5) * 2 * spread);
      EA.push(1.2 + rand() * 1.8, rand(), em.height * (0.5 + 0.5 * rand()), rand());   // Dauer, Versatz, Höhe, Zufall
    }
  }
  const eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.Float32BufferAttribute(E, 3));
  eGeo.setAttribute('aEmber', new THREE.Float32BufferAttribute(EA, 4));
  const embers = new THREE.Points(eGeo, new THREE.ShaderMaterial({
    uniforms: { ...ctx.uniforms, uScreenH: screenH },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: `attribute vec4 aEmber;
        uniform float uTime, uScreenH;
        varying float vOn, vCool;
        void main() {
          float t = uTime * ${speed}, ph = fract(t / aEmber.x + aEmber.y), s = aEmber.w * 6.2831;
          vec3 p = position + vec3(sin(t * 1.7 + s) * 0.5 * ph, ph * aEmber.z, cos(t * 1.3 + s) * 0.5 * ph);
          vOn = smoothstep(0.0, 0.08, ph) * (1.0 - smoothstep(0.55, 1.0, ph)) * step(0.5, fract(t * 7.0 + s));
          vCool = ph;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = max(${glf(em.size)} * projectionMatrix[1][1] * 0.5 * uScreenH / max(-mv.z, 0.1), 1.5);
        }`,
    fragmentShader: `uniform float uFade, uReady;
        varying float vOn, vCool;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float a = (1.0 - smoothstep(0.4, 1.0, r)) * (0.6 + 0.4 * vOn) * (1.0 - vCool * 0.5);
          gl_FragColor = vec4(mix(${glv(em.color)}, ${glv(opt.deep)}, vCool) * a * uFade * uReady, 0.0);
        }`,
  }));
  embers.frustumCulled = false;
  embers.renderOrder = 6;
  out.add(embers);
  const size = new THREE.Vector2();
  out.userData.update = () => { screenH.value = renderer.getDrawingBufferSize(size).y; };
  return out;
}

/**
 * Kachelbare Wellen fürs Wasser (waterSurface): RGB = Normale feiner Wellen (Summe von Sinuswellen mit ganzzahligen
 * Wellenzahlen, vorwiegend in einer Richtung), A = kachelbares Rauschen (Lücken der Brecher). Generator (yield je Zeile).
 */
function* createWaveTexture(size) {
  const rand = mulberry32(91);
  const waves = [];
  while (waves.length < 56) {
    const mag = 2 + 26 * rand() ** 2, ang = (rand() - 0.5) * 2.4;
    const kx = Math.round(Math.sin(ang) * mag), ky = Math.round(Math.cos(ang) * mag);
    if (kx || ky) waves.push([kx, ky, Math.hypot(kx, ky) ** -1.8, rand() * 2 * Math.PI]);
  }
  const n = size * size, sx = new Float32Array(n), sy = new Float32Array(n);
  // cos(a + b) = cos a cos b − sin a sin b: Sinus und Kosinus je Welle und Spalte bzw. Zeile vorab (statt 56 cos je Pixel)
  const W = waves.length, colC = new Float64Array(W * size), colS = new Float64Array(W * size);
  const rowC = new Float64Array(W * size), rowS = new Float64Array(W * size);
  const KX = waves.map((w) => w[0]), KY = waves.map((w) => w[1]), AMP = waves.map((w) => w[2]);
  waves.forEach(([kx, ky, , ph], w) => {
    for (let i = 0; i < size; i++) {
      const a = 2 * Math.PI * kx * i / size + ph, b = 2 * Math.PI * ky * i / size;
      colC[w * size + i] = Math.cos(a); colS[w * size + i] = Math.sin(a);
      rowC[w * size + i] = Math.cos(b); rowS[w * size + i] = Math.sin(b);
    }
  });
  let sum = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let ax = 0, ay = 0;
      for (let w = 0, i = 0; w < W; w++, i += size) {
        const c = AMP[w] * (colC[i + x] * rowC[i + y] - colS[i + x] * rowS[i + y]);
        ax += c * KX[w]; ay += c * KY[w];
      }
      sx[y * size + x] = ax; sy[y * size + x] = ay;
      sum += ax * ax + ay * ay;
    }
    yield;
  }
  const norm = 0.3 / Math.sqrt(sum / n); // mittlere Steigung
  // Rauschen auf kachelbaren Gittern (Perioden 4 … 32)
  const lattices = [4, 8, 16, 32].map((p) => ({ p, g: Float32Array.from({ length: p * p }, rand) }));
  const lat = ({ p, g }, u, v) => {
    const x = u * p, y = v * p, xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi, sxx = fx * fx * (3 - 2 * fx), syy = fy * fy * (3 - 2 * fy);
    const at = (i, j) => g[((j % p) + p) % p * p + ((i % p) + p) % p];
    return (at(xi, yi) * (1 - sxx) + at(xi + 1, yi) * sxx) * (1 - syy) + (at(xi, yi + 1) * (1 - sxx) + at(xi + 1, yi + 1) * sxx) * syy;
  };
  const data = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const gx = sx[i] * norm, gy = sy[i] * norm, len = Math.hypot(gx, gy, 1);
      data[i * 4] = (-gx / len * 0.5 + 0.5) * 255;
      data[i * 4 + 1] = (-gy / len * 0.5 + 0.5) * 255;
      data[i * 4 + 2] = (1 / len * 0.5 + 0.5) * 255;
      let f = 0;
      lattices.forEach((l, k) => { f += lat(l, x / size, y / size) * 0.5 ** (k + 1); });
      data[i * 4 + 3] = THREE.MathUtils.clamp((f / 0.9375 - 0.5) * 1.6 + 0.5, 0, 1) * 255;
    }
    yield;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

/**
 * Schaum, kachelbar: R = Schwelle, wie lange ein Punkt Schaum bleibt – je weiter von den Mitten runder Löcher in drei
 * Grössen, desto länger. Wie viel Schaum zu sehen ist, entscheidet im Shader die Dichte: frisch ist alles weiss, dann
 * reisst er zu Zellen, dann zu Fäden auf und verschwindet (foamDissolve). So sehen Schaumfelder in der Brandung von oben
 * aus. Generator (yield je Zeile).
 */
function* createFoamTexture(size) {
  const rand = mulberry32(17);
  const cells = (n) => {
    const pts = Float32Array.from({ length: n * n * 2 }, rand);
    return (u, v) => { // Abstand zum nächsten Zellpunkt (Worley), kachelbar
      const x = u * n, y = v * n, xi = Math.floor(x), yi = Math.floor(y);
      let f1 = 9;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const cx = xi + di, cy = yi + dj, k = (((cy % n) + n) % n * n + ((cx % n) + n) % n) * 2;
          const d = (x - cx - pts[k]) ** 2 + (y - cy - pts[k + 1]) ** 2;
          if (d < f1) f1 = d;
        }
      }
      return Math.sqrt(f1);
    };
  };
  const big = cells(9), small = cells(22), tiny = cells(55);
  const lattice = (p) => { const g = Float32Array.from({ length: p * p }, rand); return (u, v) => {
    const x = u * p, y = v * p, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const at = (i, j) => g[((j % p) + p) % p * p + ((i % p) + p) % p], sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (at(xi, yi) * (1 - sx) + at(xi + 1, yi) * sx) * (1 - sy) + (at(xi, yi + 1) * (1 - sx) + at(xi + 1, yi + 1) * sx) * sy;
  }; };
  const thick = lattice(6), patch = lattice(14);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      // Löcher: Je weiter ein Punkt von den (verwirbelten) Lochmitten in drei Grössen entfernt ist, desto länger bleibt
      // er Schaum – die Löcher gehen rund auf und wachsen, bis nur Fäden zwischen ihnen übrig sind
      const wu = u + 0.035 * (thick(u, v) - 0.5), wv = v + 0.035 * (thick(v + 0.37, u + 0.71) - 0.5);
      const holes = Math.min(big(wu, wv) / 0.62, 0.85 * small(wu, wv) / 0.62 + 0.25, 0.7 * tiny(u, v) / 0.62 + 0.45);
      const i = (y * size + x) * 4;
      data[i] = Math.max(0, Math.min(1, holes * (0.8 + 0.2 * patch(u, v)))) * 255;
      data[i + 3] = 255;
    }
    yield;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Gerechnete Textur merken (Generator): beim nächsten Aufbau eine Kopie mit denselben Daten, ohne nochmals zu rechnen
 * (Wellen und Schaum des Wassers: wer wieder zum Strand wechselt, spart rund 0,3 s). Die Kopie gibt release frei.
 */
const rememberedTextures = new Map();
function* rememberTexture(key, steps) {
  if (!rememberedTextures.has(key)) rememberedTextures.set(key, yield* steps);
  return rememberedTextures.get(key).clone(); // clone setzt needsUpdate (Texture.copy)
}

/** Karte aus einer Data-URL (Wasser): ohne Mipmaps, linear gefiltert */
function mapTexture(url, what) {
  const img = new Image(), tex = new THREE.Texture(img);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  img.onload = () => { tex.needsUpdate = true; };
  img.onerror = () => console.warn(`Wasser: ${what} nicht lesbar`);
  img.src = url;
  return tex;
}

/**
 * Ersatz für den Grund, wo ihn das Panorama nicht zeigt (Brechung im Wasser, waterSurface). Sichtbar ist der Grund
 * unter einer Zelle der Wasserkarte, wenn die Tiefe des Panoramas in seiner Richtung bis zur Wasserfläche darüber
 * reicht (Blender hat sie in der Tiefe; wo das Spiel sie zeichnet, ist sie durchsichtig). Hinter Fels sähe der
 * Mittelpunkt den Fels – im Wasser stünde ein Schatten des Felsens –, dort gilt die nächste Zelle mit sichtbarem Grund
 * (um eine Zelle Abstand vom Schatten, damit die lineare Filterung nicht hineinreicht); im Loch des Geländes unter dem
 * Brett (ohne Treffer zeigt das Panorama den Himmel) der Rand rundum. water: { image (Karte), ext, range, level, calm
 * (ruhig: verdeckt auch, was laut Karte als Fels an der Wasserfläche steht) },
 * depth: { image, log }. Ergebnis RGBA, Zeile 0 bei z = +ext (wie die Karte als Textur, ohne Kippen): R 128 − Radius
 * des Rands im Loch / 0,1 m (sonst 128), G/B 128 + Versatz in x/z zur Ersatzstelle / 0,25 m. Generator für sliced.
 */
function* groundShift(water, depth, center) {
  const { ext, range: [d0, d1], level, calm = false } = water, n = water.image.width;
  const px = imagePixels(water.image);
  yield;
  const depthPx = imagePixels(depth.image);
  yield;
  const la = Math.log(depth.log[0]), lb = Math.log(depth.log[1]), dw = depth.image.width, dh = depth.image.height;
  // Abstand der Szene vom Mittelpunkt in Richtung (x, y, z) (Spiel), bilinear im Log wie im Shader; null ohne Treffer
  const dist = (x, y, z) => {
    const l = Math.hypot(x, y, z), bx = x / l, by = -z / l, bz = y / l;
    const u = (0.5 + Math.atan2(bx, by) / (2 * Math.PI)) * dw - 0.5;
    const v = (Math.acos(Math.max(-1, Math.min(1, bz))) / Math.PI) * dh - 0.5;
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    let sum = 0;
    const corners = [[0, 0, (1 - fu) * (1 - fv)], [1, 0, fu * (1 - fv)], [0, 1, (1 - fu) * fv], [1, 1, fu * fv]];
    for (const [di, dj, wt] of corners) {
      const k = 4 * (Math.min(dh - 1, Math.max(0, j + dj)) * dw + ((((i + di) % dw) + dw) % dw));
      const code = depthPx[k] * 256 + depthPx[k + 1];
      if (code === 65535) return null;
      sum += wt * (la + (code / 65535) * (lb - la));
    }
    return Math.exp(sum);
  };
  // je Zelle: 0 sichtbar, 1 verdeckt, 2 im Loch, 3 Land (ohne Wasser, Grund egal)
  const LAND = 3, kind = new Uint8Array(n * n), rim = new Float32Array(n * n), cell = (2 * ext) / n;
  const CALM_TALL = 1.2; // ruhig: so hoch ragt Eis oder Fels im Wasser höchstens heraus (m; Schollen bis gut 1 m)
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = row * n + col, d = d0 + ((d1 - d0) * (px[4 * i] * 256 + px[4 * i + 1])) / 65535;
      if (d <= 0) { kind[i] = LAND; continue; }
      const x = (col + 0.5) * cell - ext - center.x, z = (row + 0.5) * cell - ext - center.z, y = level - d - center.y;
      // Grund um t vom Mittelpunkt weg gerückt: 0 sichtbar, 1 verdeckt, 2 im Loch
      const r = Math.hypot(x, z) || 1;
      const seen = (t) => {
        const qx = x * (1 + t / r), qz = z * (1 + t / r), pd = dist(qx, y, qz);
        if (pd === null) return 2;
        const ds = (Math.hypot(qx, y, qz) * (center.y - level)) / -y; // bis zur Wasserfläche auf dem Strahl
        if (pd < ds - 0.05 - 0.004 * ds) return 1;
        if (calm) {
          // Ruhig: Steht auf dem letzten Stück des Strahls vor der Wasserfläche (dort tiefer als CALM_TALL über ihr) Eis
          // oder Fels (B der Karte, eine Zelle Rand)? Dann verdeckt es den Grund. Die grobe Tiefe fasst die dünnen
          // Ränder der Schollen nicht: Sie standen sonst als Geisterbilder im Wasser, gestreckt und weiter hinten
          const f = (level - center.y) / y, hx = qx * f, hz = qz * f, hr = Math.hypot(hx, hz) || 1;
          const back = Math.min(hr, (CALM_TALL * hr) / (center.y - level));
          for (let u = 0; u <= back; u += cell) { // ganze Zellen genügen: jede Probe prüft 3 × 3
            const k = 1 - u / hr;
            const sc = Math.floor((hx * k + center.x + ext) / cell), sr = Math.floor((hz * k + center.z + ext) / cell);
            for (let a = Math.max(0, sr - 1); a <= Math.min(n - 1, sr + 1); a++) {
              for (let b = Math.max(0, sc - 1); b <= Math.min(n - 1, sc + 1); b++) {
                if (px[4 * (a * n + b) + 2] > 76) return 1;
              }
            }
          }
        }
        return 0;
      };
      kind[i] = seen(0);
      if (kind[i] !== 2) continue;
      let t = 0;
      while (t < 12 && seen(t) === 2) t += 0.25;
      rim[i] = r + t + 0.5; // etwas weiter: Die Farben haben am Rand des Lochs noch vom Himmel
      if (col % 8 === 7) yield; // eine Zeile im Loch dauerte allein über 10 ms (Ticket 09)
    }
    yield;
  }
  // Schatten um eine Zelle erweitern; Loch: der grösste Rand der Nachbarn
  const seed = new Int32Array(n * n).fill(-1), rimOut = new Float32Array(n * n);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = row * n + col;
      let near = false;
      for (let a = Math.max(0, row - 1); a <= Math.min(n - 1, row + 1); a++) {
        for (let b = Math.max(0, col - 1); b <= Math.min(n - 1, col + 1); b++) {
          const j = a * n + b;
          if (kind[j] === 1) near = true;
          rimOut[i] = Math.max(rimOut[i], rim[j]);
        }
      }
      if (kind[i] === 0 && !near) seed[i] = i;
    }
    yield;
  }
  // nächste sichtbare Zelle: je ein Durchgang vorwärts und rückwärts über das Gitter, jede Zelle übernimmt von den
  // schon besuchten Nachbarn die nächste (Abstand nach Euklid)
  const take = (i, row, col, dr, dc) => {
    const r2 = row + dr, c2 = col + dc;
    if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) return;
    const s = seed[r2 * n + c2], own = seed[i];
    if (s < 0) return;
    const d2 = (o) => (((o / n) | 0) - row) ** 2 + ((o % n) - col) ** 2;
    if (own < 0 || d2(s) < d2(own)) seed[i] = s;
  };
  const FORWARD = [[-1, -1], [-1, 0], [-1, 1], [0, -1]], BACK = [[1, 1], [1, 0], [1, -1], [0, 1]];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) for (const [dr, dc] of FORWARD) take(row * n + col, row, col, dr, dc);
    yield;
  }
  for (let row = n - 1; row >= 0; row--) {
    for (let col = n - 1; col >= 0; col--) for (const [dr, dc] of BACK) take(row * n + col, row, col, dr, dc);
    yield;
  }
  const out = new Uint8Array(n * n * 4), enc = (v, step) => Math.max(0, Math.min(255, Math.round(128 + v / step)));
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const i = row * n + col, k = 4 * ((n - 1 - row) * n + col), s = seed[i];
      out[k] = enc(-rimOut[i], 0.1);
      out[k + 1] = s < 0 || kind[i] === LAND ? 128 : enc(((s % n) - col) * cell, 0.25);
      out[k + 2] = s < 0 || kind[i] === LAND ? 128 : enc((((s / n) | 0) - row) * cell, 0.25);
      out[k + 3] = 255;
    }
    yield;
  }
  return { data: out, n };
}

/**
 * Gitter fürs Wasser in der Ebene y = 0: n × n Felder über ±half, darum Ringe (das Quadrat vergrössert, je um 12 %) bis
 * far. Die Ringe brauchen keine feinen Felder: Weit draussen rechnet der Shader den Ort aus dem Strahl. Generator
 * (sliced: yield je Zeile bzw. Ring; in einem Stück hielt es ein Bild auf dem gedrosselten Handy 58 ms an, Ticket 09
 * der Leistung), gleich in die fertigen Felder geschrieben.
 */
function* waterGeometry(half, n, far) {
  // Rand des Gitters gegen den Uhrzeigersinn (von oben), dann je Ring dieselben Punkte weiter draussen
  const rim = [];
  for (let j = 0; j < n; j++) rim.push([j, 0]);
  for (let i = 0; i < n; i++) rim.push([n, i]);
  for (let j = n; j > 0; j--) rim.push([j, n]);
  for (let i = n; i > 0; i--) rim.push([0, i]);
  const m = rim.length, first = (n + 1) * (n + 1);
  let k = 0;
  for (let scale = 1; scale < far / half; k++, scale *= 1.12);
  const count = first + k * m;
  const pos = new Float32Array(count * 3);
  const index = new (count - 1 >= 65535 ? Uint32Array : Uint16Array)(6 * n * n + 6 * m * Math.max(0, k - 1));
  let p = 0, x = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= n; j++) { pos[p++] = -half + (2 * half * j) / n; pos[p++] = 0; pos[p++] = -half + (2 * half * i) / n; }
    yield;
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * (n + 1) + j, b = a + 1, c = a + n + 1, d = c + 1;
      index[x++] = a; index[x++] = c; index[x++] = b; index[x++] = b; index[x++] = c; index[x++] = d;
    }
    yield;
  }
  for (let r = 0, scale = 1; r < k; r++, scale *= 1.12) {
    for (const [j, i] of rim) { pos[p++] = (-half + (2 * half * j) / n) * scale; pos[p++] = 0; pos[p++] = (-half + (2 * half * i) / n) * scale; }
    yield;
  }
  for (let r = 0; r + 1 < k; r++) {
    for (let q = 0; q < m; q++) {
      const a = first + r * m + q, b = first + r * m + ((q + 1) % m), c = a + m, d = b + m;
      index[x++] = a; index[x++] = b; index[x++] = c; index[x++] = b; index[x++] = d; index[x++] = c;
    }
    yield;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  return geo;
}

/** RGBA-Daten n × n als Karte fürs Wasser (linear, ohne Mipmaps) */
function groundTexture(data, n) {
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Wassermaske des Panoramas (Zeile 0 am Horizont, Zeilen wie im Equirect: 360° / Breite je Zeile; so weit unter den
 * Horizont, wie sie hoch ist, siehe MASK_DEG in tools/blender/wald_export.py): linear, ohne Mipmaps, rundum
 */
function maskTexture(img) {
  const tex = new THREE.Texture(img);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

/** Pixel (RGBA) eines geladenen Bilds */
function imagePixels(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, img.width, img.height).data;
}

// Bis wohin das Spielwasser reicht: Ringe ums Gitter der Karte bis WATER_FAR (m), zum Horizont hin blendet es nach der
// Richtung, in der das Netz des Panoramas liegt, zwischen WATER_HORIZON[0] und [1] Grad unter dem Horizont ins gemalte
// Meer (dort ist es nur noch Dunst)
const WATER_FAR = 6000, WATER_HORIZON = [-1.2, -0.3];
// m: so weit liegt das Spielwasser höchstens vor der Kamera (weiter Entferntes rückt auf dem Strahl her); das Netz
// des Panoramas schreibt dahinter höchstens bis WATER_CAP + 4, die Himmelskugel liegt bei 136
const WATER_CAP = camera.far - 16;

/**
 * Wasser ums Brett, wie es sich bewegt. Daten aus Blender: map – R/G Wassertiefe mit 16 Bit (an Land negativ: Höhe des
 * Sands), B Fels –, shore – R/G Abstand zur Wasserlinie mit 16 Bit (> 0 an Land), B nahe Felsgruppe (zeichnet das
 * Spiel, bakedMesh) –, Zeile 0 am hinteren Rand bei z = −extent; dazu size, extent, level, die Bereiche depthRange und
 * shoreRange und fade: wo Blender seine Wasserfläche einblendet. Bis fade[1] malt Blender nur den Grund (mit der Farbe
 * des Wassers nach Tiefe); diese Ebene deckt das Meer bis kurz vor den Horizont (WATER_FAR, WATER_HORIZON) – sonst lag
 * zwischen Spielwasser und Himmel ein Streifen gemaltes Meer, das nicht dazu passte (erst Grund, dann flaches Wasser).
 * Die Oberfläche kommt von ihr: Dünung, die parallel zum Ufer heranläuft, im Flachen steiler wird und als Walze bricht
 * – Schaum, der zu Zellen und Fäden zerfällt, nicht jede Welle überall –, das Auflaufen den Strand hinauf und zurück,
 * nasser glänzender Sand, Spülmarken, Gischt an den Felsen, Glitzern zur Sonne. Brechung und Spiegelung lesen das
 * Panorama: den Grund unter der Stelle, von den Wellen verschoben, und in Richtung des gespiegelten Strahls Himmel und
 * Insel (wie vom Mittelpunkt aus gesehen). Wellenphysik wie im früheren gerechneten Strand (2.25). wave: Wellenlänge,
 * Kreisfrequenz; sun, foam, sediment, lip, crest: Farben (Szenenwerte; crest: Licht im Kamm der Dünung, die noch nicht
 * bricht). calm (Eishöhle): ruhiges Wasser – keine Dünung, keine Brandung, kein Schaum, kein Auflaufen, kein Spülsaum;
 * nur Kräuselwellen, um ripple (0 … 1) schwächer, und die Spiegelung (am Ufer endet es, wo der Grund auftaucht). Das Gitter folgt, wo das Wasser aufläuft, der Höhe des Sands, und liegt für den Tiefentest etwas zur Kamera
 * hin (lift). Ob es verdeckt ist, entscheidet das Netz des Panoramas Pixel für Pixel nach dem, was es zeigt
 * (ctx.pano.depthRule): Zeigt es Wasser oder etwas hinter dem Wasser, liegt seine Tiefe hinter der Wasserfläche – das
 * geglättete Netz reichte um Felsen herum vor das Wasser, von der Seite gesehen endete das Wasser so weit vor dem Fels
 * –, zeigt es Fels vor dem Wasser, liegt sie davor (nicht bei den nahen Felsgruppen): Das Wasser endet am gemalten Rand
 * des Felsens, aus jedem Blickwinkel. Die Brechung nimmt den Grund, wo das Panorama ihn nicht zeigt, von daneben
 * (groundShift). Was unter der Oberfläche schwimmt (ctx.under.scene, etwa fishSchools), zeichnet es vorher in ein
 * eigenes Bild und legt es über den Grund, von den Wellen verschoben wie dieser; Spiegelung, Schaum und Glitzern liegen
 * darüber. Generator (sliced: Wellen und Schaum rechnen).
 */
function* waterSurface(ctx, opt) {
  const w = ctx.data[opt.data];
  const waves = yield* rememberTexture('waves', createWaveTexture(256));
  const foam = yield* rememberTexture('foam', createFoamTexture(512));
  const ext = w.extent;
  // Tiefenregel für das Netz (unten) braucht gl_FragDepth; ohne sie (WebGL1 ohne EXT_frag_depth) wie vor 2.36: Schnitt
  // am Fels vom Mittelpunkt aus, Blende bis fade[1]
  const cut = renderer.capabilities.isWebGL2 || renderer.extensions.has('EXT_frag_depth');
  const geo = yield* waterGeometry(ext, Math.round(2 * ext), cut ? WATER_FAR : ext);
  // Abstand der Szene vom Mittelpunkt in Richtung d, aus der Tiefe des Panoramas (log, bilinear; ohne Treffer fern);
  // im Wasser und in der Tiefenregel des Netzes
  const depthGLSL = (sampler) => `
        const vec2 DEPTH_SIZE = ${glv(ctx.pano.depth.size)}, DEPTH_LOG = ${glv(ctx.pano.depth.log.map(Math.log))};
        float logDepth(vec2 ij) {
          vec4 t = LOD0(${sampler}, (ij + 0.5) / DEPTH_SIZE);
          float c = (t.r * 65280.0 + t.g * 255.0) / 65535.0;
          return c > 0.99999 ? DEPTH_LOG.y : mix(DEPTH_LOG.x, DEPTH_LOG.y, c);
        }
        float panoDist(vec3 d) {
          vec3 b = normalize(vec3(d.x, -d.z, d.y));
          vec2 uv = vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927) * DEPTH_SIZE - 0.5;
          vec2 i = floor(uv), f = uv - i;
          return exp(mix(mix(logDepth(i), logDepth(i + vec2(1.0, 0.0)), f.x), mix(logDepth(i + vec2(0.0, 1.0)), logDepth(i + 1.0), f.x), f.y));
        }`;
  const under = { scene: new THREE.Scene(), target: null };
  ctx.under = under;
  ctx.offscreen.push(under.scene);
  const decl = `
        uniform sampler2D uMap, uShore;
        const float EXT = ${glf(ext)}, LEVEL = ${glf(w.level)}, ROCK_LIFT = 1.0;
        const vec2 DEPTH = ${glv(w.depthRange)}, SHORE = ${glv(w.shoreRange)};
        vec2 mapUV(vec2 p) { return vec2((p.x + EXT) / (2.0 * EXT), 1.0 - (p.y + EXT) / (2.0 * EXT)); }
        float bits16(vec2 hl) { return (hl.x * 65280.0 + hl.y * 255.0) / 65535.0; }
        // Tiefe (an Land negativ) und Abstand zur Wasserlinie (> 0 an Land) an p (Spiel x, z)
        vec2 at(vec2 p) {
          vec2 uv = mapUV(p);
          return vec2(mix(DEPTH.x, DEPTH.y, bits16(texture2D(uMap, uv).rg)), mix(SHORE.x, SHORE.y, bits16(texture2D(uShore, uv).rg)));
        }`;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...ctx.uniforms,
      uMap: { value: mapTexture(w.map, 'Karte') }, uShore: { value: mapTexture(w.shore, 'Abstand zum Ufer') },
      uWaves: { value: waves }, uFoam: { value: foam },
      uPano: { value: ctx.pano.full }, uCenter: { value: ctx.pano.center }, uDepth: { value: ctx.pano.depth.tex },
      uUnder: { value: null }, uUnderOn: { value: 0 }, uUnderView: { value: new THREE.Matrix4() },
      uGround: { value: groundTexture(new Uint8Array([128, 128, 128, 255]), 1) }, // bis groundShift gerechnet ist
    },
    defines: { ...(cut ? { CUT: '' } : {}), ...(opt.calm ? { CALM: '' } : {}) },
    extensions: { derivatives: true, shaderTextureLOD: true },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `${decl}
        varying vec3 vPos, vRay;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vec2 m = at(wp.xz);
          float rock = texture2D(uMap, mapUV(wp.xz)).b;
          // an Land auf dem Sand (dort läuft das Wasser auf), am Fels auf Höhe des Wassers: Was er verdeckt,
          // entscheiden die Felsen des Spiels und das Netz des Panoramas (ohne dessen Tiefenregel liegt es weiter
          // vorn). Jenseits der Karte offenes Wasser (ihr Rand gilt dort nicht, wie im Fragment)
          float outside = smoothstep(EXT - 12.0, EXT - 1.0, max(abs(wp.x), abs(wp.z)));
          wp.y = LEVEL + max(-m.x, 0.0) * (1.0 - rock) * (1.0 - outside);
          #ifdef CALM
            wp.y = LEVEL; // ruhiges Wasser läuft nicht auf
          #endif
          float lift = ${glf(opt.lift)};
          #ifndef CUT
            lift += ROCK_LIFT * rock;
          #endif
          vPos = wp.xyz;
          // auf dem Strahl zur Kamera hin; was weiter weg liegt, höchstens so weit wie WATER_CAP (vor camera.far und
          // der Himmelskugel, im Bild an derselben Stelle)
          vec3 toCam = cameraPosition - wp.xyz;
          float dc = length(toCam);
          float t = min(max(dc - lift, 0.0), ${glf(WATER_CAP)});
          vRay = cameraPosition - toCam / dc * t;
          gl_Position = projectionMatrix * viewMatrix * vec4(vRay, 1.0);
        }`,
    fragmentShader: `${decl}
        #if __VERSION__ >= 300
          #define LOD(t, p, l) textureLod(t, p, l)
        #elif defined(GL_EXT_shader_texture_lod)
          #define LOD(t, p, l) texture2DLodEXT(t, p, l)
        #else
          #define LOD(t, p, l) texture2D(t, p)
        #endif
        #define LOD0(t, p) LOD(t, p, 0.0)
        uniform sampler2D uWaves, uFoam, uPano, uDepth, uUnder, uGround;
        uniform vec3 uCenter;
        uniform float uTime, uFade, uReady, uUnderOn;
        uniform mat4 uUnderView;
        varying vec3 vPos, vRay;
        ${GLSL_NOISE}
        // noise(vec3(q, 0.0)): bei z = 0 wiegt die zweite Lage 0, also nur die erste (gleiches Ergebnis, halb so viel)
        float noiseFlat(vec2 q) {
          vec3 i = vec3(floor(q), 0.0);
          vec2 f = fract(q);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y);
        }
        ${ctx.lightGLSL}
        const float CELL = ${glf(2 * ext / w.size)};
        const vec2 FADE = ${glv(w.fade)};
        const float SKY_R = ${glf(PANO.dMax)};
        const vec2 HORIZON = ${glv(WATER_HORIZON.map((a) => Math.sin(THREE.MathUtils.degToRad(a))))};
        const float SWELL_K = ${glf(2 * Math.PI / opt.wave[0])}, SWELL_W = ${glf(opt.wave[1])};
        const vec3 SUN_COL = ${glv(opt.sun)}, FOAM = ${glv(opt.foam)}, SEDIMENT = ${glv(opt.sediment)}, LIP = ${glv(opt.lip)};
        const vec3 CREST = ${glv(opt.crest)};
        #ifdef CALM
          const float WIND = ${glf(opt.ripple ?? 1)}; // ruhiges Wasser: Kräuselwellen so viel schwächer
        #else
          const float WIND = 1.0;
        #endif
        // Panorama in Richtung d (Spiel), wie vom Mittelpunkt gesehen; Mipmap-Stufe lod von Hand (Ableitungen gelten in
        // den verzweigten Teilen nicht), sonst die Grundstufe (die Karte ist hier fein genug)
        const float PANO_TEXEL = 0.0015; // Winkel eines Pixels im ganzen Bild (π / 2048 Zeilen)
        vec3 panoLod(vec3 d, float lod) {
          vec3 b = normalize(vec3(d.x, -d.z, d.y));
          return LOD(uPano, vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927), lod).rgb;
        }
        vec3 pano(vec3 d) { return panoLod(d, 0.0); }
        #ifdef CALM
          // Grund an der Ersatzstelle q + s (Versatz s in m), mit deren Tiefe statt der eigenen
          vec3 groundAt(vec3 rel, vec2 q, vec2 s) {
            return pano(vec3(rel.x + s.x, rel.y + at(q).x - at(q + s).x, rel.z + s.y));
          }
        #endif
        // Grund an q, wie ihn das Panorama zeigt; sieht der Mittelpunkt ihn nicht, eine Stelle daneben (groundShift):
        // die nächste, deren Grund er sieht, im Loch unter dem Brett der Rand rundum, zur eigenen Richtung gewichtet
        vec3 ground(vec3 q) {
          vec4 g = texture2D(uGround, mapUV(q.xz)) * 255.0 - 128.0;
          vec3 rel = q - uCenter;
          if (g.r > -0.5) {
            #ifdef CALM
              // ruhig: die Farben der vier Nachbarzellen mischen, jede an ihrer Ersatzstelle mit deren Tiefe. Gemischte
              // Versätze zweier Ersatzstellen zeigten zwischen ihnen wieder den Rand einer Scholle (Geisterbilder)
              float gn = 2.0 * EXT / CELL;
              vec2 t = mapUV(q.xz) * gn - 0.5, t0 = floor(t), fr = t - t0;
              vec2 s0 = (texture2D(uGround, (t0 + vec2(0.5, 0.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              vec2 s1 = (texture2D(uGround, (t0 + vec2(1.5, 0.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              vec2 s2 = (texture2D(uGround, (t0 + vec2(0.5, 1.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              vec2 s3 = (texture2D(uGround, (t0 + vec2(1.5, 1.5)) / gn).gb * 255.0 - 128.0) * 0.25;
              // alle gleich (im offenen Wasser fast immer 0): eine Abfrage, bei 0 genau wie ohne Ersatz
              if (length(s1 - s0) + length(s2 - s0) + length(s3 - s0) < 0.01) {
                return dot(s0, s0) < 1e-6 ? pano(rel) : groundAt(rel, q.xz, s0);
              }
              return mix(mix(groundAt(rel, q.xz, s0), groundAt(rel, q.xz, s1), fr.x),
                         mix(groundAt(rel, q.xz, s2), groundAt(rel, q.xz, s3), fr.x), fr.y);
            #else
              return pano(rel + vec3(g.g, 0.0, g.b) * 0.25);
            #endif
          }
          // sechs Richtungen ab der eigenen; je näher am Rand, desto mehr zählt die eigene (am Rand die Probe von dort)
          float len = length(rel.xz), rim = max(-g.r * 0.1, len + 0.01), sum = 0.0;
          float a0 = len > 1e-4 ? atan(rel.z, rel.x) : 0.0, sharp = 30.0 * pow(len / rim, 4.0);
          vec3 col = vec3(0.0);
          for (int i = 0; i < 6; i++) {
            float an = a0 + float(i) * 1.0472;
            float wt = pow(0.501 + 0.5 * cos(float(i) * 1.0472), sharp);
            col += pano(vec3(cos(an) * rim, rel.y, sin(an) * rim)) * wt;
            sum += wt;
          }
          return col / sum;
        }
        ${depthGLSL('uDepth')}
        // Schaum mit Dichte dens an p: dicht ganz weiss, dann reisst er zu Zellen, dann zu Fäden auf und verschwindet.
        // In Strömungsrichtung dir gestreckt und mit dem Wasser um drift verschoben.
        float foamDissolve(vec2 p, float dens, vec2 dir, float drift) {
          vec2 q = vec2(dot(p, vec2(-dir.y, dir.x)), dot(p, dir) * 0.45 - drift);
          float t = texture2D(uFoam, q * 0.2).r * 0.7 + texture2D(uFoam, q * 0.53 + 0.37).r * 0.3;
          return smoothstep(1.0 - dens, 1.15 - dens, t);
        }
        float wrapPhase(float ph) { return mod(ph + 3.14159, 6.28319) - 3.14159; }
        // Wellengruppen: mal höhere, mal niedrigere Wellen, entlang der Küste versetzt
        float swellSetAt(vec2 p, float t) { return 0.75 + 0.25 * sin(t * 0.19 + p.x * 0.05) * sin(t * 0.083 + p.x * 0.031 + 1.7); }
        // ... für Welle Nummer m, als sie die Wasserlinie erreichte (off: Versatz der Phase hier)
        float waveEnv(vec2 p, float m, float off) { return swellSetAt(p, (m * 6.28319 + off * SWELL_K) / SWELL_W); }
        // Profil einer gebrochenen Welle (Walze): Kamm bei 0, vorn (landwärts, x > 0) steil abfallend, hinten flach
        float bore(float x, float sharp) { return x > 0.0 ? exp(-x * sharp) : (x + 3.14159) * (x + 3.14159) * 0.10132; }
        // Höhe der Dünung über dem Meeresspiegel an Phase x; d: Wassertiefe (an Land negativ), env: Wellengruppe. Im
        // Flachen wird die Welle höher und steiler, bricht und läuft als Walze ans Ufer – nie höher, als das Wasser tief
        // ist. brk: ob diese Welle hier bricht – wo nicht, bleibt sie rund (ausser um das Tal: sonst spränge die Höhe)
        float swellHeight(float x, float d, float env, float sharp, float brk) {
          float b = smoothstep(1.8, 0.9, d) * mix(1.0, brk, smoothstep(3.0, 2.2, abs(x)));
          float shape = mix(cos(x), bore(x, sharp) - 0.19, b);
          return min(${glf(opt.height)} * env * (1.0 + 0.9 * smoothstep(5.0, 1.2, d)), 0.4 * max(d, 0.0) + 0.03) * shape;
        }
        // Auflaufen: Hat die Walze die Wasserlinie erreicht, schiesst sie als dünner Film den Strand hinauf, wird
        // langsamer und bleibt stehen, dann fliesst sie beschleunigt zurück (Umkehr nach etwa 40 % des Zyklus).
        // u: Zeit seit dem Eintreffen der Walze (Anteil der Periode); reach: Höhe, die diese Welle erreicht
        const float SWASH_UP = 0.24, SWASH_DOWN = 0.4, SWASH_LOW = -0.1;
        float swashLevel(float u, float reach) {
          float r = reach - SWASH_LOW;
          if (u < SWASH_UP) { float t = 1.0 - u / SWASH_UP; return SWASH_LOW + r * (1.0 - t * t); }
          float t = min((u - SWASH_UP) / SWASH_DOWN, 1.0);
          return reach - r * t * t;
        }
        float swashLeaves(float a, float reach) { return SWASH_UP + SWASH_DOWN * sqrt(clamp((reach - a) / (reach - SWASH_LOW), 0.0, 1.0)); }
        float swashHash(float n, float i) { return fract(sin(mod(n, 256.0) * 12.9898 + i * 78.233) * 43758.5453); }
        // Höhe, die Welle Nummer n erreicht: von Welle zu Welle und entlang des Strands verschieden, mit Zungen
        float swashReach(float n, float along) {
          float a = along / 7.0, i = floor(a), f = smoothstep(0.0, 1.0, fract(a));
          float b = along / 2.3, j = floor(b), g = smoothstep(0.0, 1.0, fract(b));
          return ${glf(opt.reach)} * (0.15 + 0.2 * mix(swashHash(n, i), swashHash(n, i + 1.0), f) + 0.05 * (mix(swashHash(n + 0.5, j), swashHash(n + 0.5, j + 1.0), g) - 0.5));
        }
        // Nicht jede Welle bricht überall: Lücken entlang der Front, von Welle zu Welle anders; nahe am Ufer jede
        float breakGaps(float ph, float d, float along) {
          float waveNo = floor((ph - wrapPhase(ph)) / 6.28319 + 0.5);
          return mix(smoothstep(0.32, 0.5, texture2D(uWaves, vec2(along * 0.012, waveNo * 0.137)).a), 1.0, smoothstep(1.0, 0.6, d));
        }
        float swashShare(float d) { return smoothstep(0.7, 0.05, d); }
        // Normale der Wasserfläche: Dünung (Gefälle aus swellHeight, Richtung dir) und kurze Wellen – zwei Züge
        // analytisch, drei Lagen aus der Normal-Map; im dünnen Wasser am Strand glatt. var: Streuung der Steigungen, die
        // das Bild nicht mehr auflöst (Länge der gemittelten Normalen in den Mipmaps): In der Ferne wird das Glitzern so
        // zu einem Schimmer, statt zu flimmern.
        // low: nur die langen Wellen (Dünung, Wellenzüge ab 4,5 m) – damit verschiebt das Wasser, was darunter schwimmt.
        // Mit den Kräuselwellen änderte sich der Versatz auf Zentimetern um bis über 0,1 m: Die Fische zerrissen.
        // fp: wie gross ein Pixel auf der Wasserfläche ist (m). Wellen, die er nicht mehr auflöst, fallen weg (die aus
        // der Normal-Map mitteln die Mipmaps): In der Ferne liefen sie sonst als Moiré schnell quer über das Wasser,
        // und im flachen Blick spiegelt schon eine kleine Neigung einen ganz anderen Teil des Himmels.
        float resolved(float k, float fp) { return 1.0 - smoothstep(0.4, 0.8, fp * k / 3.14159); }
        vec3 waterNormal(vec2 p, float dist, float fp, float x, vec2 dir, float d, float env, float sharp, float brk, out float var, out vec2 low) {
          vec2 d2 = vec2(-0.34, -0.94), d3 = vec2(0.53, -0.848);
          float deep = smoothstep(0.0, 0.8, d); // im Flachen glatt
          vec2 s = dir * SWELL_K * (swellHeight(x + 0.03, d, env, sharp, brk) - swellHeight(x - 0.03, d, env, sharp, brk)) / 0.06 * (1.0 - swashShare(d)) * resolved(SWELL_K, fp);
          #ifdef CALM
            s = vec2(0.0); // keine Dünung
          #endif
          float wind = deep * WIND;
          s += d2 * 0.05 * wind * sin(dot(p, d2) * 0.95 - uTime * 1.05 + 1.3) * resolved(0.95, fp);
          s += d3 * 0.035 * wind * sin(dot(p, d3) * 1.4 - uTime * 1.25 + 4.1) * resolved(1.4, fp);
          vec2 d4 = vec2(0.81, -0.59); // Windsee schräg zur Dünung, länger
          s += d4 * 0.07 * wind * sin(dot(p, d4) * 0.52 - uTime * 0.83 + 0.7) * (0.6 + 0.4 * sin(dot(p, vec2(0.6, 0.8)) * 0.07 + uTime * 0.05)) * resolved(0.52, fp);
          low = -s;
          const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
          vec3 a = texture2D(uWaves, p * 0.09 + vec2(0.004, -0.013) * uTime).rgb * 2.0 - 1.0;
          vec3 b = texture2D(uWaves, (ROT * p) * 0.27 + vec2(-0.011, -0.02) * uTime).rgb * 2.0 - 1.0;
          vec3 c = texture2D(uWaves, p * 0.83 + vec2(0.031, -0.027) * uTime).rgb * 2.0 - 1.0;
          float ripple = (0.25 + 0.75 * deep) * WIND;
          s -= a.xy / max(a.z, 0.3) * 0.3 * ripple;
          s -= (b.xy / max(b.z, 0.3)) * ROT * 0.32 * ripple;
          s -= c.xy / max(c.z, 0.3) * 0.22 * ripple;
          var = 0.004 + (0.1 * max(1.0 - length(a), 0.0) + 0.1 * max(1.0 - length(b), 0.0) + 0.06 * max(1.0 - length(c), 0.0)) * ripple + dist * 0.00004;
          // in der Ferne ruhiger: Im flachen Blick wechselte jede Neigung zwischen Spiegelung und Grund (Streifen)
          return normalize(vec3(-s.x, 1.0, -s.y) * vec3(1.0 - 0.6 * smoothstep(60.0, 300.0, dist), 1.0, 1.0 - 0.6 * smoothstep(60.0, 300.0, dist)));
        }
        // Spiegelung der Sonne auf einer rauen Fläche (Beckmann-Verteilung mit Streuung var der Steigungen)
        float sunGlint(vec3 N, vec3 V, float var) {
          vec3 H = normalize(SKY_LIGHT + V);
          float nh = max(dot(N, H), 0.05), nh2 = nh * nh;
          float D = exp(-(1.0 - nh2) / (nh2 * 2.0 * var)) / (6.2832 * var * nh2 * nh2);
          float F = 0.02 + 0.98 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
          return min(D * F / (4.0 * max(dot(N, V), 0.15)) * 0.05, 12.0);
        }
        void main() {
          vec3 pos = vPos;
          #ifdef CUT
            // Ort auf der Wasserfläche aus dem Strahl (weit draussen liegen die Ecken auf ihm näher, und die Felder
            // sind gross); an Land, wo das Gitter dem Sand folgt, wie gezeichnet
            vec3 ray = normalize(vRay - cameraPosition);
            if (vPos.y < LEVEL + 0.001 && ray.y < -1e-5) pos = cameraPosition + ray * ((cameraPosition.y - LEVEL) / -ray.y);
          #endif
          vec2 p = pos.xz;
          // vor jedem discard: Ableitungen über das ganze Pixelquadrat
          float fp = max(length(dFdx(p)), length(dFdy(p)));
          #ifdef CUT
            if (ray.y > -1e-5) discard;
          #endif
          // zum Rand der Karte hin offenes Wasser (ihr Rand gilt draussen nicht; Land verdeckt dort das Netz des
          // Panoramas), weich, damit man keine Kante sieht
          float open = smoothstep(EXT - 12.0, EXT - 1.0, max(abs(p.x), abs(p.y)));
          vec2 m = mix(at(p), vec2(4.0, SHORE.x), open);
          float bedD = m.x, shore = m.y;
          float rock = texture2D(uMap, mapUV(p)).b * (1.0 - open);
          #ifdef CUT
            // Zum Horizont hin ins gemalte Meer, nach der Richtung, in der das Netz des Panoramas auf diesem Strahl
            // liegt (von einer hohen Kamera aus liegt sein Horizont tiefer als der wahre)
            vec3 oc = cameraPosition - uCenter;
            float rb = dot(oc, ray), skyT = -rb + sqrt(max(rb * rb - dot(oc, oc) + SKY_R * SKY_R, 0.0));
            float k = uFade * uReady * (1.0 - smoothstep(HORIZON.x, HORIZON.y, (oc.y + ray.y * skyT) / SKY_R));
            // Land über dem Auflaufen. Fels am Wasser (die Karte mit 0,75 m zählt ihn grob) bleibt Wasser: Wo er es
            // verdeckt, entscheidet das Netz des Panoramas, bis an seinen gemalten Rand.
            if ((bedD < -0.7 && (rock < 0.7 || shore > 2.0)) || k <= 0.0) discard;
          #else
            float k = uFade * uReady * (1.0 - smoothstep(FADE.x, FADE.y, length(p)));
            if (bedD < -0.7 || k <= 0.0) discard;
          #endif
          // Am Fels: Fürs Wasser selbst ist der Grund dort tief genug, dass es nicht aufläuft. Wo er es verdeckt,
          // entscheidet das Netz des Panoramas (CUT), sonst die Tiefe in Richtung des Mittelpunkts: Sieht er vor dieser
          // Stelle schon Fels, liegt sie in ihm oder dahinter – dort kein Wasser.
          float seen = 1.0, bed0 = bedD, hug = 0.0, near = 0.0;
          if (rock > 0.01) {
            vec3 rel = pos - uCenter;
            float rk = smoothstep(0.0, 0.25, rock);
            #ifndef CUT
              float dc = length(rel);
              seen = 1.0 - smoothstep(0.02 + 0.002 * dc, 0.08 + 0.006 * dc, dc - panoDist(rel)) * rk;
              if (seen <= 0.0) discard;
            #endif
            // dicht vor dem Fels (von der Kamera aus): 0,6 m weiter hinten wäre schon Fels – dort der Schaum am Fuss.
            // Fels im Panorama nach seiner Tiefe. Die nahen Felsgruppen (B der zweiten Karte) zeichnet das Spiel, dort
            // nach der Karte, nur am Rand: Sie zählt um die Blöcke einen Ring mit (sonst ein breites weisses Band)
            // ruhig (CALM): kein Schaum am Fels
            #ifndef CALM
            vec2 away = normalize(pos.xz - cameraPosition.xz) * 0.6;
            vec3 rel2 = rel + vec3(away.x, 0.0, away.y);
            near = texture2D(uShore, mapUV(p)).b;
            float edge = smoothstep(0.85, 1.0, texture2D(uMap, mapUV(p + away)).b) * (1.0 - smoothstep(0.85, 1.0, rock));
            hug = mix(smoothstep(0.0, 0.6, length(rel2) - panoDist(rel2)), edge, near) * rk;
            #endif
            bedD = mix(bedD, max(bedD, 0.25), smoothstep(0.3, 0.7, rock));
          }
          vec3 toCam = cameraPosition - pos;
          float dist = length(toCam);
          vec3 V = toCam / dist;
          // aufs Ufer zu: Gefälle des Abstands, nach vorn genommen (zwei Abfragen statt vier: fürs Handy)
          #ifdef CALM
            vec2 dir = vec2(0.0, 1.0); // ohne Wellen gleich (spart vier Abfragen)
          #else
          vec2 dir = normalize(vec2(at(p + vec2(CELL, 0.0)).y - shore, at(p + vec2(0.0, CELL)).y - shore) + vec2(1e-6));
          #endif
          // Wellen: Fronten parallel zum Ufer, entlang des Ufers leicht versetzt (wob), in Gruppen höher und niedriger
          float wob = (noiseFlat(p * 0.045) - 0.5) * 6.0;
          // Wellengruppen; zum Rand der Karte hin ohne Dünung (draussen gälte überall derselbe Abstand zum Ufer),
          // rundum gleich weit
          float env = swellSetAt(p, uTime) * (1.0 - smoothstep(EXT * 0.55, EXT * 0.95, length(p)));
          float sharp = mix(7.0, 3.0, smoothstep(15.0, 50.0, dist)); // Front der Walze in der Ferne weicher
          float along = p.x;
          // Was nur im Flachen wirkt, nur dort rechnen (Ticket 11, Handy): Ab 1,8 m Tiefe bricht keine Welle (jede
          // Verwendung von brk ist mit smoothstep(1.8, 0.9, Tiefe) = 0 gewichtet), ab 0,7 m läuft nichts auf (share = 0,
          // das Wasser ist dort mindestens 0,39 m dick, der Sand nie frei). Das Bild bleibt genau gleich.
          #ifdef CALM
            // ruhiges Wasser: keine Dünung, kein Auflaufen; es reicht genau bis an die Wasserlinie
            float ph = 0.0, x = 0.0, brk = 1.0, u = 0.0, n = 0.0;
            float share = 0.0, reach = 0.0, reachPrev = 0.0, swash = 0.0;
            float thick = bedD;
            if (thick <= 0.0) discard; // Grund über dem Wasser: das zeigt das Panorama (vor Normale und Wellen)
          #else
          float ph = (shore + wob) * SWELL_K - uTime * SWELL_W, x = wrapPhase(ph), brk = bedD < 1.8 ? breakGaps(ph, bedD, along) : 1.0;
          float cyc = (uTime * SWELL_W - wob * SWELL_K) / 6.28319; // so viele Walzen haben die Wasserlinie erreicht
          float u = fract(cyc), n = floor(cyc);
          float share = swashShare(bedD), reach = 0.0, reachPrev = 0.0, swash = 0.0;
          if (bedD < 0.7) {
            reach = swashReach(n, along) * waveEnv(p, n, wob);
            reachPrev = swashReach(n - 1.0, along) * waveEnv(p, n - 1.0, wob);
            swash = swashLevel(u, reach);
          }
          float thick = mix(swellHeight(x, bedD, env, sharp, brk), swash, share) + bedD; // Wasser über dem Grund
          #endif
          float var;
          vec2 lowN; // Neigung der langen Wellen (wie N.xz, ohne Kräuselwellen)
          vec3 N = waterNormal(p, dist, fp, x, dir, bedD, env, sharp, brk, var, lowN);
          float fn = texture2D(uWaves, p * vec2(0.35, 0.5) + vec2(0.0, uTime * 0.03)).a;
          vec3 rgb;
          float a;
          if (thick <= 0.0) {
            // Sand frei: Wie lange ist es her, dass das Wasser hier abgeflossen ist? Frisch glänzt der Film, dann
            // versickert er. Am höchsten Punkt jeder Welle bleibt ein Schaumsaum liegen und zerfällt; ältere Spülmarken
            // als dünne dunkle Linien, bis eine höhere Welle sie wegspült.
            float h = -bedD, since = 9.0, residue = 0.0, marks = 0.0;
            if (h > -0.3 && h < 0.6) {
              if (h < reach && u > swashLeaves(h, reach)) since = u - swashLeaves(h, reach);
              else if (h < reachPrev) since = u + 1.0 - swashLeaves(h, reachPrev);
              residue = smoothstep(0.03, 0.0, abs(h - reach)) * step(SWASH_UP, u) * exp(-(u - SWASH_UP) * 2.5)
                + smoothstep(0.03, 0.0, abs(h - reachPrev)) * exp(-(u + 1.0 - SWASH_UP) * 2.5);
              float later = u < SWASH_UP ? swashLevel(u, reach) : -1.0;
              for (int i = 0; i <= 5; i++) {
                float mi = n - float(i), rk = swashReach(mi, along) * waveEnv(p, mi, wob);
                float wt = (1.0 - (float(i) + u) * 0.16) * (i == 0 ? smoothstep(SWASH_UP, SWASH_UP + 0.05, u) : 1.0);
                if (rk > later) marks = max(marks, smoothstep(0.012, 0.0, abs(h - rk)) * wt);
                later = max(later, rk);
              }
            }
            float shine = exp(-since * 4.0) * (1.0 - rock);
            vec3 Nf = normalize(mix(N, vec3(0.0, 1.0, 0.0), 0.8));
            float F = 0.02 + 0.98 * pow(1.0 - max(dot(Nf, V), 0.0), 5.0);
            vec3 R = reflect(-V, Nf);
            float foam = foamDissolve(p, residue * 0.7, dir, 0.0) * 0.85 * (1.0 - rock);
            // vormultipliziert: nasser Sand dunkler (a), der Film spiegelt Himmel und Sonne (dazu), Schaum deckt
            a = clamp(0.12 * shine + 0.12 * marks * (1.0 - rock) + foam, 0.0, 1.0);
            rgb = (pano(vec3(R.x, abs(R.y), R.z)) * max(F, 0.1) + SUN_COL * sunGlint(Nf, V, 0.005)) * shine + FOAM * foam;
            if (a < 0.004 && dot(rgb, rgb) < 1e-5) discard;
          } else {
            // Grund durch die Oberfläche: im Panorama an der Stelle unter dem Wasser, von den Wellen verschoben
            float depth = thick;
            vec2 off = N.xz * min(depth, 1.5) * 0.2;
            #ifdef CALM
              off *= 0.25; // ruhig: sonst Schlieren an Eis und Steinen knapp unter Wasser
            #endif
            vec3 below = ground(vec3(p.x + off.x, LEVEL - bedD, p.y + off.y));
            // was darin schwimmt (Bild der Szene unter der Oberfläche, vormultipliziert), von den langen Wellen verschoben
            // wie der Grund in gut 1 m Tiefe: Die Fische schwanken, bleiben aber ganz
            if (uUnderOn > 0.5) {
              vec4 c = uUnderView * vec4(pos + vec3(lowN.x, 0.0, lowN.y) * 0.25, 1.0);
              vec4 f = LOD0(uUnder, c.xy / c.w * 0.5 + 0.5);
              below = below * (1.0 - f.a) + f.rgb;
            }
            // Auflauffilm über dem Sand: dünn und klar – der Sand darunter nur etwas dunkler und kühler (nass); ein
            // deckendes, dunkles Band wirkte wie Schlamm
            below *= mix(vec3(1.0), vec3(0.9, 0.91, 0.95), share);
            float rising = max(1.0 - smoothstep(SWASH_UP * 0.7, SWASH_UP * 1.3, u), smoothstep(0.9, 1.0, u));
            float back = (1.0 - rising) * share * smoothstep(0.3, 0.0, bedD); // Rückstrom: Film fliesst den Strand hinab
            // Trübung: In der Brandung wirbeln die Walzen Sand auf – milchig, gleich hinter einer Walze am stärksten
            float breaking = smoothstep(1.8, 0.9, bedD) * mix(1.0, brk, smoothstep(3.0, 2.2, abs(x)));
            float stirred = smoothstep(2.4, 0.6, bedD) * (0.4 + 0.6 * exp(min(x, 0.0) * 0.6) * smoothstep(0.15, 0.0, x) * smoothstep(-3.14, -2.4, x));
            #ifdef CALM
              breaking = 0.0; stirred = 0.0; // keine Brandung, nichts aufgewirbelt
            #endif
            below = mix(below, SEDIMENT, stirred * 0.5 * (1.0 - exp(-depth * 1.5)) * (1.0 - 0.7 * share));
            float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
            vec3 R = reflect(-V, N);
            // unscharf, so weit die Wellen innerhalb des Pixels streuen (was die Mipmaps der Normal-Map wegmitteln: var
            // ohne Grundwert): Fern spiegelt das Wasser den gemittelten Himmel, statt Pixel für Pixel zwischen den
            // Farben am Horizont zu springen – das flimmerte und lief als Streifen quer über das Wasser (höchstens
            // Stufe 6, gut 6°; die Probe bleibt so weit über dem Horizont, sonst mischte der Boden darunter mit)
            float lod = min(log2(1.0 + sqrt(max(var - 0.004 - dist * 0.00004, 0.0)) / PANO_TEXEL), 6.0);
            vec3 refl = panoLod(vec3(R.x, max(abs(R.y), exp2(lod) * PANO_TEXEL * 0.5), R.z), lod);
            vec3 col = mix(below, refl, max(F, 0.1 * share)) + SUN_COL * sunGlint(N, V, var); // der Film glänzt
            // Rückstrom: Das Wasser läuft beschleunigt hangab und sammelt sich in flachen Rinnen – helle und dunkle
            // Streifen in Fliessrichtung, die mit ihm seewärts gleiten
            float down = max(u - SWASH_UP, 0.0);
            vec2 rq = vec2(dot(p, vec2(-dir.y, dir.x)), dot(p, dir) + down * down * 6.0);
            float thin = smoothstep(0.12, 0.01, depth);   // im dünnen Film deutlicher
            if (back * thin > 0.0) { // sonst ändert es nichts (Ticket 11: Texturzugriffe nur, wo sie wirken)
              float rill = texture2D(uWaves, rq * vec2(1.3, 0.38)).a * 0.6 + texture2D(uWaves, rq * vec2(3.1, 0.9) + 0.4).a * 0.4;
              col *= 1.0 - 0.08 * back * thin * smoothstep(0.5, 0.72, rill);
              col += refl * 0.08 * back * thin * smoothstep(0.55, 0.78, 1.0 - rill);
            }
            // Vor der brechenden Front ihre steile, beschattete Seite: ein dunkler Streifen; die dünne Lippe leuchtet
            // türkis im Gegenlicht (draussen ebenso die Kämme)
            col *= 1.0 - 0.25 * breaking * smoothstep(0.0, 0.06, x) * smoothstep(0.4, 0.12, x) * (1.0 - share);
            float face = breaking * smoothstep(0.8, 0.0, x) * smoothstep(-0.15, 0.0, x);
            col += LIP * face * env * (1.0 - share) * smoothstep(0.0, 0.3, depth);
            // Dünung, die noch nicht bricht: Der Kamm leuchtet, wo das Licht durch seine dünne Spitze fällt, das Tal
            // davor liegt etwas dunkler – so sieht man von oben die Wellen heranrollen
            float swell = (1.0 - breaking) * (1.0 - share) * smoothstep(0.5, 1.6, bedD) * env;
            #ifdef CALM
              swell = 0.0;
            #endif
            col *= 1.0 - 0.12 * swell * smoothstep(0.1, 0.9, -cos(x));
            col += CREST * swell * smoothstep(0.45, 1.0, cos(x)) * smoothstep(-0.2, 0.6, sin(x + 0.6));
            // Schaum: an der brechenden Front ein schmaler, dichter Kern, dahinter ein Feld aus Zellen und Fäden, das
            // seewärts ausdünnt; in der Brandungszone ein Rest. Auf dem Auflauffilm Schaum, solange er hinaufläuft,
            // vorn eine helle Kante; Gischt an den Felsen.
            float xf = x + (fn - 0.5) * 0.3;
            float core = smoothstep(0.08, -0.02, xf) * smoothstep(-0.75, -0.15, xf);
            float field = exp(min(xf, 0.0) * 0.65) * smoothstep(0.12, 0.04, xf) * smoothstep(-3.14, -2.3, xf) * 0.62;
            float dens = (breaking * max(core * 1.15 * (1.0 - 0.5 * rock), field) + 0.17 * smoothstep(2.2, 0.8, bedD)) * (1.0 - share);
            dens *= 1.0 - 0.55 * smoothstep(0.3, 0.8, rock); // über flachem Fels kein Teppich
            #ifdef CALM
              dens = 0.0; // kein Schaum
            #endif
            // auf dem Film: hinauf eine Schaumrolle vorn; hinab zerrissene Schaumreste, in Fliessrichtung gezogen
            dens = max(dens, share * (0.1 + 0.6 * rising * smoothstep(0.12, 0.01, depth)) + back * 0.22 * smoothstep(0.2, 0.03, depth));
            // ohne Dichte kein Schaum (foamDissolve ist dann 0)
            float foam = dens > 0.0 ? foamDissolve(p, dens, dir, share * swash * 8.0 + uTime * 0.05 - back * down * 2.0) : 0.0;
            foam = max(foam, smoothstep(0.03, 0.004, depth) * share * rising * (0.6 + 0.4 * fn)); // helle Kante nur hinauf
            // an den Felsen: Brandung im Takt der Wellen – kommt eine an, schäumt es am Fels auf, dann zerfällt der
            // Schaum zu Fäden und läuft ab; dicht am Fels (flach) immer etwas Schaum
            float surge = smoothstep(-0.5, 0.6, cos(x + 0.4)) * env, d0 = depth - bedD + bed0;
            // am Fuss ein Saum, mal breiter, mal unterbrochen; kommt eine Welle an, schäumt es auf
            // (nur am Fels: ohne ihn sind hug und lace 0)
            float gaps = hug > 0.0 ? texture2D(uFoam, p * 0.11 + vec2(uTime * 0.012, 0.0)).r : 0.0;
            float lace = max(hug * mix(smoothstep(0.25, 0.7, gaps), 1.0, surge), 0.5 * surge * smoothstep(0.4, 0.9, rock) * smoothstep(0.9, 0.2, d0) * (1.0 - 0.75 * near));
            #ifdef CALM
              lace = 0.0; // kein Schaum an Schollen und Eis im Wasser
            #endif
            if (lace > 0.0) foam = max(foam, lace * foamDissolve(p * 1.3, 0.12 + 0.35 * hug + 0.35 * surge * (0.4 + hug), dir, uTime * 0.06 - surge * 0.4));
            col = mix(col, FOAM * (0.86 + 0.16 * fn), clamp(foam, 0.0, 1.0) * mix(0.75, 0.95, smoothstep(0.4, 0.9, dens)));
            // Rand des Films: hinauf eine klare Kante, hinab versickert das Wasser fleckig (die Stellen, wo der Sand
            // schon frei liegt, wandern nicht als Linie zurück)
            float seep = back > 0.0 ? back * 0.03 * texture2D(uFoam, p * 0.35).r : 0.0;
            a = smoothstep(0.0, 0.012 + 0.02 * back, depth - seep) * seen;
            rgb = col * a;
          }
          gl_FragColor = vec4(rgb * k, a * k);
        }`,
  });
  // Tiefe des Netzes nach dem, was es zeigt (siehe oben): T ist der Punkt, den das Panorama in dieser Richtung zeigt, P
  // die Wasserfläche auf dem Strahl der Kamera. Wasser, Loch (ohne Treffer) oder etwas hinter P: hinter P; Fels vor P:
  // vor das höchste Wasser (Auflaufen bis 0,75 m, dazu lift); sonst (Sand: dort läuft das Wasser auf) wie es liegt.
  if (cut) {
    // so viele Grad unter dem Horizont deckt die Wassermaske ab (siehe maskTexture)
    const mask = ctx.pano.waterMask?.image, maskDeg = mask ? (mask.height * 360) / mask.width : 90;
    ctx.pano.depthRule = {
      uniforms: {
        uCutDepth: { value: ctx.pano.depth.tex }, uCutMap: { value: material.uniforms.uMap.value },
        uCutShore: { value: material.uniforms.uShore.value }, uCutMask: { value: ctx.pano.waterMask },
      },
      glsl: `${ctx.pano.waterMask ? '\n        #define CUT_MASK' : ''}
        uniform sampler2D uCutDepth, uCutMap, uCutShore, uCutMask;
        uniform mat4 projectionMatrix;
        const float CUT_LEVEL = ${glf(w.level)}, CUT_EXT = ${glf(ext)};
        const float CUT_FAR = ${glf(WATER_CAP + 4)}, CUT_NEAR = ${glf(camera.near + 0.05)};
        #define LOD0(t, p) texture2D(t, p) // ohne Mipmaps
        ${depthGLSL('uCutDepth')}
        float cutAt(vec3 w) {
          vec4 q = projectionMatrix * (viewMatrix * vec4(w, 1.0)); // zwei Matrix-Vektor-Produkte statt Matrix mal Matrix je Pixel
          return clamp(q.z / q.w * 0.5 + 0.5, 0.0, 1.0);
        }
        float skyDepth(vec3 world) {
          vec3 d = normalize(world - uCenter), ray = normalize(world - cameraPosition);
          if (d.y > 0.0 || ray.y > -0.001) return gl_FragCoord.z; // Himmel; Strahl ohne Wasserfläche
          float tP = (cameraPosition.y - CUT_LEVEL) / -ray.y;
          #define CUT_BEHIND max(gl_FragCoord.z, cutAt(cameraPosition + ray * min(tP + 0.5, CUT_FAR))) // hinter P
          // Wasser: nach der Maske, so fein wie das Bild (die Tiefe ist gröber: um ferne Palmen blieb ein Saum ohne
          // Spielwasser), sonst nach der Tiefe. Etwas hinter dem Wasser: nur nah (Felsen, die das geglättete Netz vor
          // das Wasser zieht); weiter weg gälte es auch, wo das Netz Fernes nur tiefer zeigt (Inseln, Küste von oben).
          // Zeigt die Maske Wasser, steht das Ergebnis ohne die Tiefe des Panoramas fest (Ticket 11: das Wasser deckt am
          // Strand den grössten Teil des Bilds; das Lesen der Tiefe ist dort das Teuerste)
          bool masked = false, water = false;
          #ifdef CUT_MASK
            float below = degrees(asin(clamp(-d.y, -1.0, 1.0))) / ${glf(maskDeg)};
            if (below < 1.0) {
              masked = true;
              water = texture2D(uCutMask, vec2(0.5 + atan(d.x, -d.z) / (2.0 * PI), below)).r > 0.5;
              if (water) return CUT_BEHIND;
            }
          #endif
          float dT = panoDist(d);
          vec3 T = uCenter + d * dT;
          if (!masked) water = T.y < CUT_LEVEL + 0.03;
          if (water || (dT < 60.0 && length(T - cameraPosition) > tP + 0.3)) return CUT_BEHIND;
          // Fels, den das Panorama zeigt (nicht die nahen Felsgruppen: Die zeichnet das Spiel, das Panorama zeigt dort
          // flachen Boden, der sie sonst verdeckte)
          vec2 uv = vec2((T.x + CUT_EXT) / (2.0 * CUT_EXT), 1.0 - (T.z + CUT_EXT) / (2.0 * CUT_EXT));
          if (texture2D(uCutMap, uv).b > 0.3 && texture2D(uCutShore, uv).b < 0.5) {
            float tH = (cameraPosition.y - CUT_LEVEL - 0.75) / -ray.y;
            return min(gl_FragCoord.z, cutAt(cameraPosition + ray * max(tH - 1.6, CUT_NEAR)));
          }
          return gl_FragCoord.z;
        }`,
    };
  }
  // Ersatz für verdeckten Grund, in Häppchen, sobald die Skybox eingeblendet ist (bis dahin liest die Brechung das
  // Panorama überall direkt); bricht ab, wenn sie inzwischen freigegeben ist
  ctx.later.push(async (alive) => {
    try {
      await ruhe.warte(); // wie der übrige Aufbau nur an ruhigen Stellen, auch das Dekodieren (nicht in Fahrten)
      const image = await loadSkyImage(w.map);
      const water = { ext, range: w.depthRange, level: w.level, image, calm: !!opt.calm };
      const steps = groundShift(water, ctx.pano.depth, ctx.pano.center);
      const done = await sliced((function* () {
        for (let s = steps.next(); alive(); s = steps.next()) { if (s.done) return s.value; yield; }
        return null;
      })(), true, 'Wasser: Grund');
      if (!done || !alive()) return;
      const old = material.uniforms.uGround.value;
      material.uniforms.uGround.value = groundTexture(done.data, done.n);
      old.dispose();
    } catch (e) { console.warn(`Wasser: Ersatz für den Grund nicht gerechnet (${e.message})`); }
  });
  const plane = new THREE.Mesh(geo, material);
  plane.frustumCulled = false;
  plane.renderOrder = 4;
  // Kurz bevor das Wasser gezeichnet wird: die Szene unter der Oberfläche in ein eigenes Bild, so gross wie das, in das
  // gerade gezeichnet wird, auch auf dem Handy: Halb so gross deckte dort ein Texel 2,75 × 2,75 Bildschirmpixel, die
  // schmalen Fische bekamen Treppen und die Schwanzlinien zerfielen in Punkte (Spec .scratch/leistung/, Ticket 14).
  // Im Bild des Spiels schon vor der Szene (SCENE_PREPASSES, Ticket 11): Mitten in der Szene das Ziel zu wechseln hiess
  // auf Kachel-GPUs (Handy), das halb gezeichnete Szenenbild samt Tiefe in den Speicher zu schreiben und danach wieder
  // zu laden. Sonst (Aufwärmen, Übersetzen) wie bisher in onBeforeRender.
  const clearColor = new THREE.Color(), size = new THREE.Vector2();
  let ready = null; // Kamera, für die das Bild unter der Oberfläche in diesem Bild schon steht (Vorlauf)
  const drawUnder = (r, cam, into) => {
    const on = under.scene.children.some((o) => o.visible);
    material.uniforms.uUnderOn.value = on ? 1 : 0;
    // Aufwärmen (skyWarmDraw, 1 × 1): das Ziel gleich so gross und mit so vielen Proben wie im Spiel anlegen, auch wenn
    // gerade nichts darunter schwimmt. Sonst legte es das erste Bild an, in dem der Strand einblendet; das hielt die
    // Grafikkarte dort 50–80 ms an (Ticket 05)
    if (!on && !into?.prismaWarm) return;
    if (into?.prismaWarm) into = composer.readBuffer;
    if (into) size.set(into.width, into.height); else r.getDrawingBufferSize(size);
    size.max(new THREE.Vector2(1, 1));
    if (!under.target) {
      under.target = new THREE.WebGLRenderTarget(size.x, size.y, {
        type: HDR_TYPE, samples: r.capabilities.isWebGL2 && !IS_MOBILE ? (into?.samples ?? 0) : 0,
      });
    } else if (under.target.width !== size.x || under.target.height !== size.y) under.target.setSize(size.x, size.y);
    const before = r.getRenderTarget();
    r.getClearColor(clearColor);
    const clearAlpha = r.getClearAlpha();
    r.setRenderTarget(under.target);
    r.setClearColor(0x000000, 0);
    // clear() löscht nur, was gerade beschrieben werden darf; zuletzt war oft ein Material ohne depthWrite dran (auch
    // das Wasser selbst). Blieb die Tiefe der Fische vom vorigen Bild stehen, schnitt sie die bewegten Fische ab.
    r.state.buffers.depth.setMask(true);
    r.state.buffers.color.setMask(true);
    r.clear();
    r.render(under.scene, cam);
    discardDepth(r, under.target); // die Tiefe der Fische braucht danach niemand
    r.setRenderTarget(before);
    r.setClearColor(clearColor, clearAlpha);
    material.uniforms.uUnder.value = under.target.texture;
    material.uniforms.uUnderView.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
  };
  const prepass = (r, cam, into, root) => {
    ready = null;
    let o = plane;
    for (; o.parent; o = o.parent) if (!o.visible) return; // wird nicht gezeichnet
    if (o !== root || !o.visible) return;
    drawUnder(r, cam, into);
    ready = cam;
  };
  SCENE_PREPASSES.add(prepass);
  plane.onBeforeRender = (r, scene, cam) => {
    if (ready === cam) ready = null; // schon im Vorlauf gezeichnet
    else drawUnder(r, cam, r.getRenderTarget());
  };
  plane.userData.dispose = () => { SCENE_PREPASSES.delete(prepass); under.target?.dispose(); };
  return plane;
}

/**
 * Fischkörper (Länge 1 entlang +x, Kopf bei 0, Schwanzwurzel bei 1, dann die gegabelte Schwanzflosse bis 1.3; seitlich
 * flach): aUV = (Lage entlang 0 … 1.3, Höhe −1 … 1, Seite −1 … 1). Höhe und Breite gibt die Instanz.
 */
function createFishGeometry() {
  const along = 10, around = 8, pos = [], uv = [], idx = [];
  const prof = (u) => Math.sin(Math.PI * (0.06 + 0.94 * u)) ** 0.75 * (1 - 0.55 * u * u); // Umriss von der Seite
  for (let i = 0; i <= along; i++) {
    const u = i / along, h = 0.5 * prof(u), w = 0.22 * prof(u) * (1 - 0.4 * u);
    for (let j = 0; j < around; j++) {
      const a = (j / around) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
      pos.push(u, h * s, w * c);
      uv.push(u, s, c);
    }
  }
  for (let i = 0; i < along; i++) {
    for (let j = 0; j < around; j++) {
      const a = i * around + j, b = i * around + (j + 1) % around;
      idx.push(a, a + around, b, b, a + around, b + around);
    }
  }
  // Schwanzflosse (gegabelt) und Rückenflosse: flache Dreiecke, beidseitig
  const fin = (pts, uvs) => { const o = pos.length / 3; pts.forEach((p, k) => { pos.push(...p); uv.push(...uvs[k]); }); idx.push(o, o + 1, o + 2); };
  fin([[0.97, 0, 0], [1.3, 0.36, 0], [1.18, 0, 0]], [[1.0, 0, 0], [1.3, 1, 0], [1.2, 0, 0]]);
  fin([[0.97, 0, 0], [1.18, 0, 0], [1.3, -0.36, 0]], [[1.0, 0, 0], [1.2, 0, 0], [1.3, -1, 0]]);
  fin([[0.3, 0.38, 0], [0.62, 0.52, 0], [0.82, 0.3, 0]], [[0.3, 1.1, 0], [0.62, 1.3, 0], [0.82, 1.1, 0]]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Wo Fische schwimmen dürfen, als Abstandsfeld (m): positiv im offenen Wasser – mindestens minDepth tief, kein Fels –
 * mit dem Abstand zur nächsten Stelle, die das nicht ist, dort negativ. Karte: Tiefe und Fels je Zelle (Zeile 0 bei
 * z = −extent). Abstand nach Chamfer (Schritte 1 und √2 in zwei Durchläufen, auf etwa 8 % genau); sdf und depth lesen
 * bilinear an (x, z) (Spiel). Ohne three.js (tools/blender/out/arbeit/fischtest.mjs prüft es in Node). steps: statt
 * des Felds ein Generator für sliced (yield je Zeile; in einem Stück hielt es ein Bild auf dem gedrosselten Handy 70 ms
 * an, Ticket 09 der Leistung), dasselbe Ergebnis.
 */
function fishField(depth, rock, size, extent, minDepth, steps = false) {
  const cell = (2 * extent) / size, n = size * size;
  const dist = function* (inside) {
    const d = new Float32Array(n);
    for (let i = 0; i < n; i++) d[i] = inside(i) ? 1e9 : 0;
    const relax = (i, j, w) => { if (d[j] + w < d[i]) d[i] = d[j] + w; };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        if (x > 0) relax(i, i - 1, 1);
        if (y > 0) { relax(i, i - size, 1); if (x > 0) relax(i, i - size - 1, Math.SQRT2); if (x < size - 1) relax(i, i - size + 1, Math.SQRT2); }
      }
      yield;
    }
    for (let y = size - 1; y >= 0; y--) {
      for (let x = size - 1; x >= 0; x--) {
        const i = y * size + x;
        if (x < size - 1) relax(i, i + 1, 1);
        if (y < size - 1) { relax(i, i + size, 1); if (x < size - 1) relax(i, i + size + 1, Math.SQRT2); if (x > 0) relax(i, i + size - 1, Math.SQRT2); }
      }
      yield;
    }
    return d;
  };
  const open = (i) => depth[i] >= minDepth && rock[i] < 0.01;
  const build = function* () {
    const toShallow = yield* dist(open), toOpen = yield* dist((i) => !open(i));
    const sdf = new Float32Array(n);
    for (let i = 0; i < n; i++) sdf[i] = (open(i) ? toShallow[i] - 0.5 : 0.5 - toOpen[i]) * cell;
    const bilinear = (f, x, z) => {
      const u = Math.min(Math.max((x + extent) / cell - 0.5, 0), size - 1.001), v = Math.min(Math.max((z + extent) / cell - 0.5, 0), size - 1.001);
      const i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j, k = j * size + i;
      return (f[k] * (1 - a) + f[k + 1] * a) * (1 - b) + (f[k + size] * (1 - a) + f[k + size + 1] * a) * b;
    };
    return { sdf: (x, z) => bilinear(sdf, x, z), depth: (x, z) => bilinear(depth, x, z) };
  };
  const g = build();
  if (steps) return g;
  for (;;) { const { done, value } = g.next(); if (done) return value; }
}

/**
 * Schwarmverhalten (ohne three.js). Jeder Schwarm hat einen unsichtbaren Leitfisch, der um das Brett patrouilliert –
 * Fische sammeln sich an Bauten im Wasser –, je Schwarm in eigenem Abstand zur Kante (meist nahe), mal näher, mal
 * weiter, mit leichtem Schlängeln. Vor flachem Wasser, Fels, Brett und dem Rand der Reichweite weicht er mit Fühlern aus
 * (voraus, schräg links und rechts; die Seite bleibt, bis es frei ist); stösst er an, kehrt die Patrouille um. Andere
 * Schwärme meidet er. Die Fische folgen ihm auf eigenen Plätzen im Schwarm, die langsam wandern, halten Abstand
 * voneinander und schwimmen immer in Blickrichtung: Die Drehrate ändert sich stetig (sprang sie, zitterten die Fische),
 * der Körper biegt sich in der Kurve, das Tempo folgt mit begrenzter Beschleunigung. Der Schwanzschlag folgt dem Tempo
 * (schneller = häufiger), die Stärke dem Schub; die Tiefe folgt sanft der gewünschten, nie näher als 0,4 m am Grund.
 * Nie ins Flache: Wer doch zu nahe kommt, wird zurückgeschoben.
 * opt: seed, area (Mitte x, z, Halbachsen: Reichweite), keepOut (halbe Kante des Bretts samt Abstand), schools (count,
 * length, speed, depth). setField(fishField) – vorher steht alles still (advance gibt null). advance(t) rechnet in
 * festen Schritten bis t und gibt den Anteil des nächsten Schritts; neu begonnen (erstes Bild, Zeit zurück) wird WARM s
 * vor t, das erste Bild hängt so nur von t ab (Vergleichsbilder mit angehaltener Zeit, ?t=); warm(t) nimmt das beim
 * Aufbau vorweg. Nach einer Lücke über CATCH s geht es vom letzten Stand weiter.
 * sample(k, alpha, out): Fisch k,
 * zwischen den letzten zwei Schritten gemischt – x, z, Richtung (Winkel, von +x nach +z), Tempo, Tiefe unter der
 * Oberfläche, Biegung (Krümmung × Länge), Phase und Stärke des Schwanzschlags, Neigung, Drehrate.
 */
function createFishSim(opt) {
  // WARM: Vorlauf nach einem Neubeginn (s). Vorher wurde ab Sekunde 0 nachgerechnet – bis zu 3600 Schritte in einem
  // Bild, ein Ruck beim Wählen des Hintergrunds; 5 s sind 150 Schritte, die Schwärme sind dann schon unterwegs (warm:
  // beim Aufbau in Häppchen). CATCH: so viel wird nach einer Pause höchstens in einem Bild nachgerechnet (s)
  const H = 1 / 30, TAU = Math.PI * 2, F = 10, WARM = 5, CATCH = 0.25;
  const [cx, cz, rx, rz] = opt.area, B = opt.keepOut;
  const wrap = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let field = null;
  // Abstand zur Kante des Bretts (Quadrat mit halber Kante B), zum Rand der Reichweite (Ellipse, genähert), zu allem
  const board = (x, z) => {
    const dx = Math.abs(x) - B, dz = Math.abs(z) - B;
    return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
  };
  const reach = (x, z) => (1 - Math.hypot((x - cx) / rx, (z - cz) / rz)) * Math.min(rx, rz);
  const clear = (x, z) => Math.min(field.sdf(x, z), board(x, z), reach(x, z));
  const grad = (f, x, z) => {
    const e = 0.4, gx = f(x + e, z) - f(x - e, z), gz = f(x, z + e) - f(x, z - e), l = Math.hypot(gx, gz) || 1;
    return [gx / l, gz / l];
  };

  // Schwärme und Fische (fest): Plätze im Schwarm (vorn, seitlich, Tiefe; × Radius), wie die Plätze wandern
  const rand0 = mulberry32(opt.seed);
  const schools = opt.schools.map((s, k) => ({
    s, cruise: s.speed, radius: 0.5 + 0.55 * s.length * Math.sqrt(s.count),
    wander: [0.13 + 0.12 * rand0(), 0.37 + 0.25 * rand0(), rand0() * TAU, rand0() * TAU, 0.05 + 0.06 * rand0(), rand0() * TAU],
    pref: 0.6 + 6 * ((k + rand0()) / opt.schools.length) ** 1.6,
  }));
  const fish = [];
  schools.forEach((sc, k) => {
    for (let i = 0; i < sc.s.count; i++) {
      const a = rand0() * TAU, r = Math.sqrt(rand0());
      fish.push({
        school: k, len: sc.s.length * (0.85 + 0.3 * rand0()),
        slot: [Math.cos(a) * r * 1.2 - 0.35, Math.sin(a) * r * 0.85, (rand0() - 0.5) * 0.4],
        drift: [rand0() * TAU, rand0() * TAU, 0.11 + 0.1 * rand0(), 0.07 + 0.08 * rand0()],
      });
    }
  });
  const N = fish.length;
  let cur = new Float64Array(N * F), prev = new Float64Array(N * F), simT = null;
  const lead = schools.map(() => ({ x: 0, z: 0, a: 0, w: 0, v: 0, dir: 1, avoid: 0, against: 0 }));

  // Neubeginn zur Zeit start: Startplätze je nach start verschieden (sonst begänne jede Wahl gleich), aber nur von ihm
  // abhängig
  // Generator (yield je Schwarm: die Suche nach dem Start kostet je bis 300 Abfragen des Felds); reset in einem Stück
  const reset = (start) => { for (const _ of resetSteps(start)); };
  function* resetSteps(start) {
    const rand = mulberry32(opt.seed + 101 + Math.floor(start));
    for (let k = 0; k < lead.length; k++) {
      const L = lead[k], sc = schools[k];
      if (k) yield;
      // Start: frei genug, nahe am Brett, möglichst weit weg von den übrigen Schwärmen; entlang der Kante
      let best = [0, B + 3], bestScore = -Infinity;
      for (let tries = 0; tries < 300; tries++) {
        const a = rand() * TAU, r = B + 1 + rand() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (clear(x, z) < sc.radius + 1) continue;
        let score = 0;
        for (let j = 0; j < k; j++) score = Math.min(score, Math.hypot(x - lead[j].x, z - lead[j].z) - 8);
        if (score > bestScore) { bestScore = score; best = [x, z]; }
      }
      [L.x, L.z] = best;
      L.dir = k % 2 ? 1 : -1;
      const [gx, gz] = grad(board, L.x, L.z);
      Object.assign(L, { a: Math.atan2(gx * L.dir, -gz * L.dir), w: 0, v: sc.cruise, avoid: 0, against: 0 });
    }
    fish.forEach((f, i) => {
      const L = lead[f.school], sc = schools[f.school], o = i * F;
      const c = Math.cos(L.a), s = Math.sin(L.a), fx = f.slot[0] * sc.radius, fz = f.slot[1] * sc.radius;
      cur.set([L.x + c * fx - s * fz, L.z + s * fx + c * fz, L.a, sc.cruise, sc.s.depth + f.slot[2], 0, rand() * TAU, 0.6, 0, 0], o);
    });
    prev.set(cur);
  }

  function stepLead(L, sc, k, t) {
    const w = sc.wander;
    // gewünschte Richtung: entlang der Kante (Patrouille), zum bevorzugten Abstand hin, dazu Schlängeln
    const [gx, gz] = grad(board, L.x, L.z);
    const off = clamp((board(L.x, L.z) - sc.pref - 2 * Math.sin(t * w[4] + w[5])) / 3, -1, 1);
    const wig = 0.45 * (Math.sin(t * w[0] + w[2]) + 0.6 * Math.sin(t * w[1] + w[3]));
    let want = wrap(Math.atan2(gx * L.dir - gz * off * 0.7, -gz * L.dir - gx * off * 0.7) + wig - L.a) * 0.6;
    // Fühler
    const look = 1.5 + 1.5 * L.v, need = 0.5 * sc.radius + 0.4;
    const probe = (da, f) => clear(L.x + Math.cos(L.a + da) * look * f, L.z + Math.sin(L.a + da) * look * f);
    const cL = probe(0.6, 0.8), cR = probe(-0.6, 0.8), worst = Math.min(probe(0, 1), cL, cR, clear(L.x, L.z) + 0.5);
    if (worst < need) {
      if (!L.avoid) L.avoid = cL > cR ? 1 : -1;
      want = L.avoid * (1.4 * (need - worst) / need + 0.25);
    } else if (worst > need * 1.3) L.avoid = 0;
    // andere Schwärme meiden (vor allem voraus)
    lead.forEach((o, j) => {
      if (o === L) return;
      const ex = o.x - L.x, ez = o.z - L.z, d = Math.hypot(ex, ez), near = 2.5 * (sc.radius + schools[j].radius);
      if (d >= near) return;
      const ahead = (ex * Math.cos(L.a) + ez * Math.sin(L.a)) / d, side = Math.cos(L.a) * ez - Math.sin(L.a) * ex;
      want -= Math.sign(side || 1) * 0.6 * (near - d) / near * (0.4 + 0.6 * Math.max(ahead, 0));
    });
    // stösst er an (schwimmt er länger gegen die Patrouille), kehrt sie um
    L.against = (Math.cos(L.a) * -gz + Math.sin(L.a) * gx) * L.dir < -0.3 ? L.against + H : 0;
    if (L.against > 1.5) { L.dir = -L.dir; L.against = 0; }
    L.w += clamp(clamp(want, -0.9, 0.9) - L.w, -1.5 * H, 1.5 * H);
    L.a = wrap(L.a + L.w * H);
    L.v += clamp(sc.cruise * (1 + 0.2 * Math.sin(t * 0.21 + k * 1.7) + 0.1 * Math.sin(t * 0.53 + k)) - L.v, -0.5, 0.5) * H;
    L.x += Math.cos(L.a) * L.v * H; L.z += Math.sin(L.a) * L.v * H;
    const c = clear(L.x, L.z), m = sc.radius * 0.5;
    if (c < m) { const [px, pz] = grad(clear, L.x, L.z); L.x += px * (m - c); L.z += pz * (m - c); }
  }

  function step(t) {
    lead.forEach((L, k) => stepLead(L, schools[k], k, t));
    [prev, cur] = [cur, prev];
    for (let i = 0; i < N; i++) {
      const f = fish[i], sc = schools[f.school], L = lead[f.school], o = i * F, d = f.drift, R = sc.radius;
      let x = prev[o], z = prev[o + 1], a = prev[o + 2], v = prev[o + 3];
      // zum eigenen Platz im Schwarm (wandert langsam) und mit dem Leitfisch mit
      const sx = (f.slot[0] + 0.25 * Math.sin(t * d[2] + d[0])) * R, sz = (f.slot[1] + 0.25 * Math.sin(t * d[3] + d[1])) * R;
      const c = Math.cos(L.a), s = Math.sin(L.a);
      let vx = c * L.v + (L.x + c * sx - s * sz - x) * 0.7, vz = s * L.v + (L.z + s * sx + c * sz - z) * 0.7;
      // Abstand zu den Nachbarn im Schwarm
      const sep = 1.1 * f.len + 0.25;
      for (let j = 0; j < N; j++) {
        if (j === i || fish[j].school !== f.school) continue;
        const ex = x - prev[j * F], ez = z - prev[j * F + 1], e = Math.hypot(ex, ez);
        if (e < sep && e > 1e-4) { const k = ((sep - e) / sep) * sc.cruise * 1.2 / e; vx += ex * k; vz += ez * k; }
      }
      // selbst nicht ins Flache (Fühler voraus)
      const worst = Math.min(clear(x + Math.cos(a) * (0.6 + 0.8 * v), z + Math.sin(a) * (0.6 + 0.8 * v)), clear(x, z) + 0.3);
      if (worst < 0.35) { const [gx, gz] = grad(clear, x, z); vx += gx * (0.35 - worst) * 2.5; vz += gz * (0.35 - worst) * 2.5; }
      // drehen (Drehrate stetig, höchstens 2 rad/s) und vorwärts schwimmen, nie seitwärts
      const da = wrap(Math.atan2(vz, vx) - a);
      const turn = prev[o + 9] + clamp(clamp(da / 0.4, -2, 2) - prev[o + 9], -8 * H, 8 * H);
      a = wrap(a + turn * H);
      const vt = clamp(Math.hypot(vx, vz) * Math.max(Math.cos(da), 0.3), 0.25 * sc.cruise, 1.9 * sc.cruise);
      const acc = clamp((vt - v) / 0.3, -2 * sc.cruise, 1.4 * sc.cruise);
      v += acc * H;
      x += Math.cos(a) * v * H; z += Math.sin(a) * v * H;
      const c2 = clear(x, z);
      if (c2 < 0.15) { const [gx, gz] = grad(clear, x, z); x += gx * (0.15 - c2); z += gz * (0.15 - c2); }
      // Tiefe sanft zur gewünschten; Neigung aus dem Steigen und Sinken
      const y0 = prev[o + 4];
      const yt = clamp(sc.s.depth + f.slot[2] * R * 0.3 + 0.08 * Math.sin(t * 0.4 + d[0]), 0.3, Math.max(field.depth(x, z) - 0.4, 0.3));
      const y = y0 + (yt - y0) * (1 - Math.exp(-H / 1.2));
      const pitch = prev[o + 8] + (clamp((y0 - y) / H / Math.max(v, 0.1), -0.35, 0.35) - prev[o + 8]) * 0.1;
      // Biegung in der Kurve; Schwanzschlag: Takt nach Tempo je Länge, Stärke nach Schub
      const bend = prev[o + 5] + (clamp((turn / Math.max(v, 0.15)) * f.len, -0.8, 0.8) - prev[o + 5]) * 0.2;
      const hz = clamp(0.7 + (0.8 * v) / f.len, 0.8, 2.6);
      const amp = prev[o + 7] + (clamp(0.45 + (0.6 * acc) / sc.cruise + 0.3 * (v / sc.cruise - 0.6), 0.3, 1) - prev[o + 7]) * 0.1;
      cur.set([x, z, a, v, y, bend, (prev[o + 6] + TAU * hz * H) % (TAU * 64), amp, pitch, turn], o);
    }
  }

  return {
    count: N, fish,
    setField(f) { field = f; simT = null; },
    /** Neubeginn zur Zeit t vorwegnehmen (Generator für sliced, yield je Schritt): wie das erste advance(t), aber beim
     *  Aufbau statt im ersten Bild (dort hielten die 150 Schritte es auf dem gedrosselten Handy 170 ms an, Ticket 09) */
    *warm(t) {
      const start = Math.max(0, t - WARM);
      yield* resetSteps(start);
      simT = start;
      while (simT + H <= t + 1e-9) { step(simT); simT += H; yield; }
    },
    advance(t) {
      if (!field) return null;
      // Ein wenig zurück (warm nach der Uhr, das erste Bild nach dem Zeitstempel des Bilds, der früher liegen kann):
      // stehen lassen, nicht neu einschwimmen (das hielt das Bild sonst wieder 150 Schritte an); erst weiter zurück neu
      if (simT === null || t < simT - CATCH) { simT = Math.max(0, t - WARM); reset(simT); }
      else if (t < simT) return 0;
      // nach einer Pause (ausgeblendet, die Zeit sprang): vom letzten Stand weiter, nicht neu einschwimmen und nicht alles
      // nachrechnen; höchstens CATCH s je Bild (die Plätze sind ohnehin zufällig, das fällt nicht auf)
      else if (t - simT > CATCH) simT = t - CATCH;
      while (simT + H <= t + 1e-9) { step(simT); simT += H; }
      return clamp((t - simT) / H, 0, 1);
    },
    sample(k, alpha, out) {
      const o = k * F;
      for (let j = 0; j < F; j++) out[j] = prev[o + j] + (cur[o + j] - prev[o + j]) * alpha;
      out[2] = prev[o + 2] + wrap(cur[o + 2] - prev[o + 2]) * alpha;
      if (cur[o + 6] < prev[o + 6]) out[6] = prev[o + 6] + (cur[o + 6] + TAU * 64 - prev[o + 6]) * alpha; // Phase lief über
      return out;
    },
  };
}

/**
 * Bunte Fische, die in kleinen Schwärmen ums Brett ziehen (Daten: die Wasserkarte von waterSurface, für Tiefe, Fels und
 * Grund). Wie sie schwimmen, rechnet createFishSim (in der Lagune, nie flacher als minDepth, in der Reichweite area);
 * die Wasserkarte liest es einmal als Bild. Schwärme (schools): Anzahl, Länge (m), Form (Höhe, Breite je Länge), Tempo
 * (m/s), Tiefe (m), Muster ('tang': Rücken dunkel, Schwanz farbig; 'bands': helle Bänder mit dunklem Rand; 'plain':
 * Bauch heller) und drei Farben (Szenenwerte). Sie liegen unter dem Wasser: Rot wird mit dem Weg durchs Wasser zuerst
 * geschluckt, das Licht des Wassers (Grund aus dem Panorama) legt sich darüber. Auf dem Grund ein weicher Schatten
 * (shadow: Deckkraft), von der gebrochenen Sonne versetzt, je höher über dem Grund, desto weicher. Gezeichnet wird in die
 * Szene unter der Oberfläche (ctx.under, von waterSurface): Das Wasser legt sie als Grund unter seine Oberfläche, mit
 * Brechung, Spiegelung, Schaum und Glitzern darüber – über allem gezeichnet sahen die Fische aus, als flögen sie.
 */
function* fishSchools(ctx, opt) {
  const w = ctx.data[opt.data], under = ctx.under;
  if (!under) throw new Error('braucht waterSurface davor');
  const sim = createFishSim({ ...opt, keepOut: PLATE / 2 + 0.3 });
  // Wasserkarte lesen, Abstandsfeld rechnen und das Einschwimmen vorwegnehmen, alles beim Aufbau in Häppchen (sliced):
  // im Rückruf des Bilds bzw. im ersten Bild hielt das ein Bild auf dem gedrosselten Handy 70 bzw. 170 ms an (Ticket 09)
  const readField = function* () {
    let img = null, failed = null;
    loadSkyImage(w.map).then((i) => { img = i; }, (e) => { failed = e; });
    while (!img && !failed) yield NEXT_FRAME;
    if (failed) throw failed;
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const g = canvas.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, img.width, img.height).data, m = img.width * img.height;
    yield;
    const depth = new Float32Array(m), rock = new Float32Array(m), [d0, d1] = w.depthRange;
    for (let i = 0; i < m; i++) {
      depth[i] = d0 + ((d1 - d0) * (px[4 * i] * 256 + px[4 * i + 1])) / 65535;
      rock[i] = px[4 * i + 2] / 255;
    }
    yield;
    return yield* fishField(depth, rock, img.width, w.extent, opt.minDepth, true);
  };
  try {
    sim.setField(yield* readField());
    yield* sim.warm(FIXED_TIME ?? (clock.running ? clock.getElapsedTime() : 0)); // die Uhr nicht hier starten
  } catch (e) { console.warn(`Fische: Wasserkarte nicht lesbar (${e.message})`); }

  const PAT = { tang: 0, bands: 1, plain: 2 };
  const n = sim.count;
  const attr = (size, get) => new THREE.InstancedBufferAttribute(Float32Array.from(sim.fish.flatMap(get)), size);
  const school = (f) => opt.schools[f.school];
  // je Bild aus der Simulation: Ort (x, Tiefe, z, Neigung) und Bewegung (Richtung, Biegung, Phase, Stärke)
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aMove = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aShape = attr(4, (f) => [f.len, school(f).shape[0], school(f).shape[1], PAT[school(f).pattern]]);
  const decl = `
        attribute vec4 aPos, aMove, aShape;
        const float LEVEL = ${glf(w.level)};
        // Mitte des Fischs und die Achsen seiner Form: x nach hinten (Kopf vorn), z zur Seite
        vec3 fishAt() { return vec3(aPos.x, LEVEL - aPos.y, aPos.z); }
        vec2 fishBack() { return -vec2(cos(aMove.x), sin(aMove.x)); }`;
  const common = { ...ctx.uniforms, uPano: { value: ctx.pano.full }, uCenter: { value: ctx.pano.center } };

  // Fische
  const body = new THREE.InstancedBufferGeometry().copy(createFishGeometry());
  body.instanceCount = n;
  body.setAttribute('aPos', aPos);
  body.setAttribute('aMove', aMove);
  body.setAttribute('aShape', aShape);
  body.setAttribute('aC1', attr(3, (f) => school(f).colors[0]));
  body.setAttribute('aC2', attr(3, (f) => school(f).colors[1]));
  body.setAttribute('aC3', attr(3, (f) => school(f).colors[2]));
  const fishMat = new THREE.ShaderMaterial({
    uniforms: common,
    extensions: { shaderTextureLOD: true },
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `${decl}
        attribute vec3 aUV, aC1, aC2, aC3;
        varying vec3 vPos, vN, vUV, vC1, vC2, vC3;
        varying float vPat;
        void main() {
          // Körper: Länge, Höhe, Breite. Schwanzschlag als Welle zum Schwanz hin, hinten stärker (Phase und Stärke aus der
          // Simulation); in der Kurve gebogen, Kopf und Schwanz zur Innenseite (aMove.y: Krümmung × Länge); beim Steigen
          // und Sinken geneigt
          float u = position.x;
          float side = sin(aMove.z - u * 4.0) * 0.16 * aMove.w * u * u - 0.5 * aMove.y * (u - 0.4) * (u - 0.4);
          // Umriss ±0,5 hoch, ±0,22 breit: auf Höhe aShape.y und Breite aShape.z je Länge
          vec3 q = vec3(u - 0.5, position.y * aShape.y, position.z / 0.44 * aShape.z + side) * aShape.x;
          q.y -= q.x * aPos.w;
          vec3 n = vec3(normal.x, normal.y / aShape.y, normal.z * 0.44 / aShape.z);
          vec2 xd = fishBack(), zd = vec2(-xd.y, xd.x);
          vec3 wp = fishAt() + vec3(xd.x * q.x + zd.x * q.z, q.y, xd.y * q.x + zd.y * q.z);
          vN = normalize(vec3(xd.x * n.x + zd.x * n.z, n.y, xd.y * n.x + zd.y * n.z));
          vPos = wp; vUV = aUV; vC1 = aC1; vC2 = aC2; vC3 = aC3; vPat = aShape.w;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
    fragmentShader: `
        #if __VERSION__ >= 300
          #define LOD0(t, p) textureLod(t, p, 0.0)
        #elif defined(GL_EXT_shader_texture_lod)
          #define LOD0(t, p) texture2DLodEXT(t, p, 0.0)
        #else
          #define LOD0(t, p) texture2D(t, p)
        #endif
        uniform sampler2D uPano;
        uniform vec3 uCenter;
        uniform float uTime;
        varying vec3 vPos, vN, vUV, vC1, vC2, vC3;
        varying float vPat;
        const float LEVEL = ${glf(w.level)};
        const vec3 ABSORB = vec3(0.4, 0.1, 0.07); // Schwächung je m Weg im Wasser (Rot zuerst; klar in der Lagune)
        vec3 pano(vec3 d) {
          vec3 b = normalize(vec3(d.x, -d.z, d.y));
          return LOD0(uPano, vec2(0.5 + atan(b.x, b.y) / 6.2831853, 1.0 - acos(clamp(b.z, -1.0, 1.0)) / 3.1415927)).rgb;
        }
        void main() {
          float u = vUV.x, v = vUV.y;
          // Muster
          vec3 col = vC1;
          if (vPat < 0.5) {        // Doktorfisch: dunkle Zeichnung auf dem Rücken, Schwanz farbig
            col = mix(col, vC2, smoothstep(0.15, 0.3, v) * smoothstep(0.12, 0.25, u) * smoothstep(0.85, 0.7, u)
              * smoothstep(0.3, 0.6, abs(vUV.z)));   // nur seitlich: von oben sieht man den blauen Rücken
            col = mix(col, vC3, step(0.98, u));
          } else if (vPat < 1.5) { // Clownfisch: drei helle Bänder mit dunklem Rand
            float b = min(min(abs(u - 0.22), abs(u - 0.55)), abs(u - 0.9));
            col = mix(vC2, col, smoothstep(0.05, 0.07, b));
            col = mix(col, vC3, smoothstep(0.065, 0.075, b) * smoothstep(0.095, 0.085, b));
            col = mix(col, vC3, step(1.12, u) * 0.8);
          } else {                 // schlicht: Bauch heller, Flossen eigene Farbe
            col = mix(col, vC2, smoothstep(-0.1, -0.6, v));
            col = mix(col, vC3, step(0.98, u) + step(1.05, v));
          }
          // Auge
          col *= 1.0 - 0.85 * smoothstep(0.045, 0.03, length(vec2(u - 0.1, (v - 0.25) * 0.5)) ) * step(0.3, abs(vUV.z));
          // Licht von oben (Sonne und Himmel durchs Wasser), unten dunkler, flimmernde Lichtnetze
          vec3 N = normalize(vN);
          float shimmer = 0.85 + 0.3 * sin(vPos.x * 3.1 + uTime * 2.3) * sin(vPos.z * 2.7 - uTime * 1.9);
          col *= (0.5 + 0.5 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0)) * shimmer * 1.5;
          // Weg durchs Wasser bis zur Oberfläche: Rot zuerst geschluckt, das Licht des Wassers darüber (Spiegelung und
          // Brechung an der Oberfläche macht das Wasser). Unter Wasser läuft der Strahl gebrochen steiler (Brechzahl
          // 1,33): höchstens 1,5-mal die Tiefe – gerade gerechnet wurde er bei flachem Blick doppelt so lang, und die
          // Fische verschwanden im Wasserlicht
          vec3 V = normalize(cameraPosition - vPos);
          float depth = max(LEVEL - vPos.y, 0.0), path = depth / sqrt(1.0 - (1.0 - V.y * V.y) / 1.769);
          vec3 water = pano(vec3(vPos.x, LEVEL - depth - 0.6, vPos.z) - uCenter);
          col = col * exp(-ABSORB * path) + water * (1.0 - exp(-0.45 * path));
          float a = smoothstep(48.0, 30.0, length(vPos.xz));
          gl_FragColor = vec4(col * a, a);
        }`,
  });
  const fishMesh = new THREE.Mesh(body, fishMat);
  fishMesh.frustumCulled = false;

  // Schatten auf dem Grund: weiche dunkle Flecken, von der (gebrochenen) Sonne versetzt
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3));
  quad.setIndex([0, 2, 1, 0, 3, 2]);
  quad.instanceCount = n;
  for (const name of ['aPos', 'aMove', 'aShape']) quad.setAttribute(name, body.getAttribute(name));
  const shadowMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: mapTexture(w.map, 'Karte') } },
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `${decl}
        ${ctx.lightGLSL}
        uniform sampler2D uMap;
        const float EXT = ${glf(w.extent)};
        const vec2 DEPTH = ${glv(w.depthRange)};
        varying vec2 vQ;
        varying float vA;
        void main() {
          vec3 p = fishAt();
          vec2 hl = texture2D(uMap, vec2((p.x + EXT) / (2.0 * EXT), 1.0 - (p.z + EXT) / (2.0 * EXT))).rg;
          float bed = LEVEL - max(mix(DEPTH.x, DEPTH.y, (hl.x * 65280.0 + hl.y * 255.0) / 65535.0), 0.0);
          // im Wasser steiler gebrochen (Brechzahl 1,33)
          vec3 L = normalize(vec3(SKY_LIGHT.x / 1.33, sqrt(max(1.0 - dot(SKY_LIGHT.xz, SKY_LIGHT.xz) / 1.769, 0.05)), SKY_LIGHT.z / 1.33));
          vec3 s = p - L * (p.y - bed) / L.y;
          // je höher über dem Grund, desto weicher und blasser (die Wellen streuen das Licht)
          float h = p.y - bed, blur = 1.0 + 0.3 * h;
          vec2 xd = fishBack(), zd = vec2(-xd.y, xd.x);
          vec2 q = position.xz * vec2(0.75, 0.35) * aShape.x * blur;
          vec3 wp = vec3(s.x + xd.x * q.x + zd.x * q.y, bed + 0.02, s.z + xd.y * q.x + zd.y * q.y);
          vQ = position.xz;
          vA = smoothstep(4.5, 0.3, h) / blur;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }`,
    fragmentShader: `
        varying vec2 vQ;
        varying float vA;
        void main() {
          float a = ${glf(opt.shadow)} * vA * smoothstep(1.0, 0.2, length(vQ));
          gl_FragColor = vec4(0.0, 0.0, 0.0, a);
        }`,
  });
  const shadowMesh = new THREE.Mesh(quad, shadowMat);
  shadowMesh.frustumCulled = false;
  fishMesh.visible = shadowMesh.visible = false; // bis die Wasserkarte gelesen ist
  under.scene.add(shadowMesh, fishMesh);

  const holder = new THREE.Group();
  const s = new Float64Array(10);
  holder.userData.update = (t) => {
    const alpha = sim.advance(t);
    if (alpha === null) return; // Wasserkarte noch nicht gelesen
    for (let k = 0; k < n; k++) {
      sim.sample(k, alpha, s);
      aPos.setXYZW(k, s[0], s[4], s[1], s[8]);
      aMove.setXYZW(k, s[2], s[5], s[6], s[7]);
    }
    aPos.needsUpdate = aMove.needsUpdate = true;
    fishMesh.visible = shadowMesh.visible = true;
  };
  return holder;
}

const SKY_LAYERS = { toonInstances, paintedInstances, glowParticles, mistSheets, waterSurface, fishSchools, bakedMesh, lavaPool, fireNests };

/**
 * Eine Skybox aus ihrem Manifest (Eintrag im Register). Schnittstelle wie die übrigen Hintergründe (skyTheme):
 * prepare() lädt, setFade(k) blendet ein (0 … 1), update(t, dt) jedes Bild solange sichtbar, ready = ganz eingeblendet,
 * release() gibt den Grafikspeicher frei (ausgeblendet und nicht gewählt; prepare() lädt danach neu).
 */
function createPanoramaSky(m) {
  const group = new THREE.Group();
  group.visible = false;
  const uniforms = { uFade: { value: 0 }, uReady: { value: 0 }, uTime: { value: 0 } };
  const pointUniforms = { ...uniforms, uPixelRatio: { value: renderer.getPixelRatio() } };
  const light = new THREE.Vector3().fromArray(m.light.dir).normalize();
  const lightGLSL = `const vec3 SKY_LIGHT = vec3(${light.toArray().map((v) => v.toFixed(4)).join(', ')});`;
  let loading = null, failed = false, mesh = null, preview = null, age = null, token = 0, offscreen = [], vorgezeichnet = false;
  let bands = [];               // je Streifen: { on (Uniform uOn), age (s seit dem Hochladen), done }
  let sharpen = null;           // scharfes ganzes Bild über der Vorschau: { on (Uniform uSoftOn), age, done }
  const streaming = new Set();  // Streifen-Texturen, die gerade hochladen

  /** Teil laden (Skript mit Data-URLs); es muss zum Stand des Registers passen */
  async function loadPart(role) {
    const part = m.parts.find((p) => p.role === role);
    await loadSkyScript(`backgrounds/${part.file}`);
    const key = `${m.id}/${role}`, got = window.PRISMA_SKY_PARTS?.[key];
    delete window.PRISMA_SKY_PARTS?.[key]; // die Bilder stecken gleich in den Texturen
    if (!got || got.rev !== m.rev) throw new Error(`${part.file}: anderer Stand als im Register`);
    return plainPngs(got);
  }

  async function build(my) {
    const base = await loadPart('base');
    const hd = PANO.hd && m.parts.some((p) => p.role === 'bands')
      ? await loadPart('bands').catch((e) => { console.warn(`${m.name}: ${e.message}, ohne Streifen`); return null; }) : null;
    const rects = hd ? m.panorama.bands : [];
    if (my !== token) return; // inzwischen wieder freigegeben (weitergeschaltet): nichts mehr dekodieren
    // Farbbilder fertig dekodiert (Tiefe als Bild: skyLogDepth liest sie ungekippt über ein Canvas). Erst das ganze
    // Bild: Damit blendet die Skybox ein; die Streifen dekodiert der Worker danach, sie kommen später dazu (unten).
    const alive = () => my === token;
    const fullLoad = loadSkyImage(base.full, true, alive), depthLoad = loadSkyImage(base.depth);
    const maskLoad = base.watermask ? loadSkyImage(base.watermask) : null; // Wasser im Panorama, fein (waterSurface)
    // im Worker nach dem ganzen Bild, aufgefüllt auf BAND_HOEHE Zeilen (eine Höhe für alle Welten, skyTexPool)
    const bandLoads = (hd?.bands ?? []).map((url) => loadSkyImage(url, true, alive, BAND_HOEHE));
    for (const load of bandLoads) load.catch(() => {}); // Fehler erst unten, beim Abbruch gar nicht: nie unbehandelt
    const images = await Promise.allSettled([fullLoad, depthLoad, ...(maskLoad ? [maskLoad] : [])]);
    const [fullImg, depthImg, maskImg = null] = images.map((r) => r.value);
    const dropBands = () => { for (const load of bandLoads) load.then(closeSkyStrips, () => {}); };
    const dropImages = () => { closeSkyStrips(fullImg); dropBands(); };
    const broken = images.find((r) => r.status === 'rejected');
    if (broken || my !== token) { // gescheitert oder inzwischen wieder freigegeben
      dropImages();
      if (broken && my === token) throw broken.reason;
      return;
    }
    // Vorschau: die Stufe des ganzen Bilds mit höchstens 1024 Pixel Breite, als eigene kleine Textur ohne Mipmaps
    // (kopiert: die Streifen braucht das ganze Bild noch), rund 2 MB. Damit steht die Skybox gleich, nur unscharf: auf
    // der Himmelskugel (panoSky), sobald sie dekodiert ist, auf dem Netz, sobald es steht. Das scharfe Bild kommt nach
    // der Enthüllung des Intros (unten); vorher hielte sein Hochladen den Grafikprozess an. Die Vorschau ist klein genug
    // für Menü und Übersicht (ruhe, klein), nicht aber für die Enthüllung des Startbildschirms.
    const small = fullImg.strips ? Math.ceil(Math.log2(fullImg.width / 1024)) : 0;
    const smallStrips = small > 0 ? fullImg.strips.filter((s) => s.level === small) : [];
    if (smallStrips.length) {
      const strips = await Promise.all(smallStrips.map(async ({ y, bitmap }) => ({ level: 0, y, bitmap: await createImageBitmap(bitmap) })));
      const tex = skyTexture({ width: fullImg.width >> small, height: fullImg.height >> small, strips }, true);
      streaming.add(tex);
      await sliced(skyUpload(tex, true), false, `Himmel ${m.id}: Vorschau hochladen`);
      streaming.delete(tex);
      if (my !== token) { tex.dispose(); dropImages(); return; }
      preview = tex;
      sceneLoop.wake(); // Vorschau einblenden (skyTheme.update)
    }
    await sceneReady; // erst nach dem ersten Bild der Szene: Seine Shader übersetzten sonst gleichzeitig, das Intro begänne später
    if (my !== token) { dropImages(); return; }
    const full = skyTexture(fullImg, true);
    streaming.add(full); // bis es hochgeladen ist: release schliesst seine Streifen
    const dropFull = () => { streaming.delete(full); closeSkyImage(full); full.dispose(); };
    // Netz in Häppchen (sliced): Tiefe glätten, Ecken setzen. Wie alles Weitere nur an ruhigen Stellen (ruhe): Schon die
    // Häppchen von 6 ms liessen das Menü und die Fahrten des Prologs auf dem gedrosselten Handy Bilder auslassen
    const center = new THREE.Vector3().fromArray(m.panorama.center);
    const depthLog = await sliced(skyLogDepth(depthImg, m.panorama.depth.log, m.panorama.depth.blur), true, `Himmel ${m.id}: Tiefe`);
    const geo = my === token ? await sliced(skyProxyGeometry(depthLog, center, m.panorama.depth.mesh), true, `Himmel ${m.id}: Netz`) : null;
    if (my !== token) { dropFull(); dropBands(); geo?.dispose(); return; }
    const soft = preview ?? full; // so lange auf dem Netz und in den Ebenen (Spiegelung im Wasser)
    const sky = new THREE.Mesh(geo, skyPanoramaMaterial(uniforms, center, soft, rects.map((b) => ({ ...b, tex: null, on: 0 }))));
    const myBands = bands = rects.map((_, i) => ({ on: sky.material.uniforms[`uOn${i}`], age: null, done: false }));
    const mySharpen = sharpen = { on: sky.material.uniforms.uSoftOn, age: null, done: !preview };
    sky.renderOrder = -1000;           // zuerst: alles Übrige liegt davor, der Tiefentest verwirft es früh
    sky.frustumCulled = false;
    const parts = [sky];
    let painted = false; // eine Ebene mit Pinsel: seine Programme mit übersetzen
    // Tiefe ungeglättet (16 Bit in Rot und Grün: nächste Nachbarn, das Wasser mischt selbst im Log)
    const depth = new THREE.Texture(depthImg);
    depth.minFilter = depth.magFilter = THREE.NearestFilter;
    depth.generateMipmaps = false;
    depth.wrapS = THREE.RepeatWrapping;
    depth.needsUpdate = true;
    const pano = {
      full: soft, center, depthRule: null, waterMask: maskImg && maskTexture(maskImg),
      depth: { tex: depth, size: [depthImg.width, depthImg.height], log: m.panorama.depth.log, image: depthImg },
    };
    const ctx = {
      uniforms, pointUniforms, data: withHd(base.data ?? {}, hd?.data), light, lightGLSL, fog: m.fog, air: m.air, pano,
      offscreen: [], later: [],
    };
    // Ebenen je ab einem neuen Bild; wer viel rechnet (Wasser, Bäume), ist ein Generator und läuft in Häppchen
    for (const layer of [...m.layers ?? [], null]) {
      await nextFrame();
      await ruhe.warte();
      if (my !== token) { for (const root of [...parts, ...ctx.offscreen]) releaseTree(root); dropFull(); dropBands(); return; }
      if (!layer) break;
      try {
        if (!SKY_LAYERS[layer.type]) throw new Error('unbekannt');
        const made = arbeit.tue(`Himmel ${m.id}: Ebene ${layer.type}`, () => SKY_LAYERS[layer.type](ctx, layer));
        const part = made.isObject3D ? made : await sliced(made, true, `Himmel ${m.id}: Ebene ${layer.type}`);
        if (layer.brush && m.brush) painted = paint(part) || painted;
        parts.push(part);
      } catch (e) { console.warn(`${m.name}: Ebene ${layer.type} ausgelassen (${e.message})`); }
    }
    if (pano.depthRule) sky.material.userData.setDepthRule(pano.depthRule);
    // Nicht in der Bodenspiegelung (dort wird auch die Himmelskugel ausgeblendet), nicht anklickbar
    for (const p of parts) p.traverse((o) => { o.layers.set(LAYER_NO_REFLECT); o.raycast = () => {}; });
    // Übersetzen, Hochladen und erstes Zeichnen nur an ruhigen Stellen (ruhe; jedes Stück fragt neu): Mit leerem
    // Shader-Cache (erster Besuch) hielt das den Grafikprozess mitten in der Enthüllung bis 300 ms an. Neue Spieler laden
    // so nach der Enthüllung oder in den Pausen des Prologs, wer weiterspielt, nach der Enthüllung oder hinter der
    // Überblendung nach «Weiter» (story.skyOf). Bis dahin zeigt die Himmelskugel die Vorschau.
    await ruhe.warte();
    if (my !== token) { for (const root of [...parts, ...ctx.offscreen]) releaseTree(root); dropFull(); dropBands(); return; }
    offscreen = ctx.offscreen;
    // Vor dem ersten Bild des Einblendens übersetzen und hochladen, ohne das laufende Bild anzuhalten: Shader im
    // Hintergrund (compileParallel, beide Fassungen des Panoramas, siehe applyFade), Texturen in Häppchen (skyUpload; das
    // ganze Bild nur ohne Vorschau, sonst folgt es unten). Solange in der Szene, aber unsichtbar: compile geht auch über
    // Unsichtbares und rechnet mit dem Licht der Szene.
    const staging = new THREE.Group();
    staging.visible = false;
    staging.add(...parts);
    scene.add(staging);
    try {
      // nur die neuen Teile (staging, offscreen), in Häppchen: Der Rest der Szene ist schon übersetzt, und three erzeugte
      // sonst den Code aller ihrer Programme in einem Stück (Ticket 09). Die Szene bleibt Wurzel (Licht, Nebel, Umgebung)
      const roots = [scene, ...offscreen], compiled = [];
      const skip = [...skyTheme.idleGroups, ...scene.children.filter((c) => c !== staging)];
      const variants = [true, false].map((transparent) => () => { sky.material.transparent = transparent; });
      const alive = () => my === token;
      compiled.push(compileParallel(roots, { skip, variants, slices: true, alive, was: `Himmel ${m.id}: Shader` }));
      if (painted) compiled.push(compileParallel([brushPass.programs()], { slices: true, alive, was: `Himmel ${m.id}: Shader Pinsel` }));
      const textures = new Set();
      for (const root of [staging, ...offscreen]) root.traverse((o) => {
        for (const mat of [o.material ?? []].flat()) {
          for (const v of [...Object.values(mat), ...Object.values(mat.uniforms ?? {}).map((u) => u.value)]) if (v?.isTexture) textures.add(v);
        }
      });
      const uploads = sliced((function* () {
        yield* skyBufferUpload(sky.geometry); // vor dem ersten Zeichnen (skyWarmDraw), sonst lädt es three in einem Stück
        for (const t of textures) {
          if (my !== token) return;
          yield* skyUpload(t);
          yield;
        }
      })(), false, `Himmel ${m.id}: Hochladen`);
      await Promise.all([...compiled, uploads]);
      await sliced(skyWarmDraw(staging, parts, sky, () => my === token), false, `Himmel ${m.id}: erstes Zeichnen (1 × 1)`);
    } catch (e) {
      for (const root of [staging, ...ctx.offscreen]) releaseTree(root); // gescheitert: nichts halb Geladenes behalten
      dropFull();
      dropBands();
      if (my === token) { offscreen = []; preview = null; } // die Vorschau hing in den Uniforms, ist also entsorgt
      throw e;
    } finally {
      scene.remove(staging);
    }
    if (my !== token) { releaseTree(staging); dropFull(); dropBands(); return; } // inzwischen wieder freigegeben
    if (!preview) streaming.delete(full); // ohne Vorschau oben schon hochgeladen
    group.add(...parts);
    mesh = sky;
    sceneLoop.wake(); // einblenden (update, skyTheme.update), auch hinter dem Startbildschirm
    adaptiveResolution.hold(); // Einblenden (doppelt gezeichnet) nicht als Überlast werten
    // Grosse Texturen erst, wenn die Skybox ganz eingeblendet ist: Das erste Schreiben in eine neue grosse Textur hält
    // den Grafikprozess kurz an (30–80 ms), das sah man im Intro und in der Überblendung als Ruck. Ebenso während einer
    // Zwischenszene der Geschichte (skyTheme.quiet): Dort fliegt das Licht, und jeder Ruck fiele auf. Jedes Stück
    // wartet dazu auf eine ruhige Stelle (skyUpload, ruhe): im Prolog nur beim Warten auf Tippen.
    const shown = () => uniforms.uFade.value >= 1 && uniforms.uReady.value >= 1 && !skyTheme.quiet;
    if (preview) {
      while (my === token && !shown()) await nextFrame();
      if (my === token) await sliced(skyUpload(full), false, `Himmel ${m.id}: scharfes Bild`);
      streaming.delete(full);
      if (my !== token) { full.dispose(); dropBands(); return; }
      // Scharfes Bild statt der Vorschau, überall (Netz, Spiegelung im Wasser); das Netz blendet dabei weich über (uSoft)
      for (const root of [group, ...offscreen]) root.traverse((o) => {
        for (const mat of [o.material ?? []].flat()) for (const u of Object.values(mat.uniforms ?? {})) if (u.value === preview) u.value = full;
      });
      sky.material.uniforms.uSoft.value = preview;
      mySharpen.on.value = 1;
      mySharpen.age = 0;
      sceneLoop.wake();
    }
    // Was die Ebenen erst nach dem Einblenden rechnen (ctx.later), dann die Streifen nachladen, je hochgeladen weich
    // über dem ganzen Bild einblenden (update, uOn)
    while (my === token && !shown()) await nextFrame();
    for (const job of ctx.later) if (my === token) await job(() => my === token);
    for (const [i, load] of bandLoads.entries()) {
      let img = null;
      try { img = await load; } catch (e) { if (my === token) console.warn(`${m.name}: Streifen ${i + 1} nicht geladen (${e.message})`); }
      if (my !== token || !img) { closeSkyStrips(img); myBands[i].done = true; continue; }
      const tex = skyTexture(img, false);
      streaming.add(tex); // release schliesst die Bilder, skyUpload bricht dann ab
      await sliced(skyUpload(tex), false, `Himmel ${m.id}: Streifen`);
      streaming.delete(tex);
      if (my !== token) { tex.dispose(); continue; }
      sky.material.uniforms[`uBand${i}`].value = tex;
      sky.material.uniforms[`uKl${i}`].value = (img.inhalt ?? img.height) / img.height;
      myBands[i].age = 0;
      sceneLoop.wake();
    }
  }

  /** Ebene mit Pinselstrichen (brush: true an der Ebene, Einstellungen im Feld brush der Skybox; createBrushPass): beim
   *  Pass anmelden, beim Freigeben abmelden */
  function paint(part) {
    if (!brushPass.supported) return false;
    const center = new THREE.Vector3().fromArray(m.panorama.center);
    const off = brushPass.add({ root: part, brush: { ...BRUSH_DEFAULT, ...m.brush }, center, uniforms });
    const before = part.userData.dispose;
    part.userData.dispose = () => { before?.(); off(); };
    return true;
  }

  /** Daten der Ebenen: Felder aus dem HD-Teil (Desktop, etwa grössere Bilder) ersetzen die gleichnamigen */
  function withHd(data, hdData) {
    const out = { ...data };
    for (const [k, v] of Object.entries(hdData ?? {})) out[k] = { ...out[k], ...v };
    return out;
  }

  /** Dekodierte Streifen schliessen, die (noch) keine Textur haben */
  function closeSkyStrips(img) { for (const s of img?.strips ?? []) s.bitmap.close(); }

  /** Grafikspeicher eines Teilbaums freigeben; spaeter: in Häppchen (freigabe), etwa beim Wechsel des Himmels */
  function releaseTree(root, spaeter = false) {
    const frei = (fn, schwer = false) => (spaeter ? freigabe.add(fn, schwer, `Himmel ${m.id}: freigeben`) : fn());
    root.traverse((o) => {
      o.userData.dispose?.();
      if (o.isInstancedMesh) frei(() => o.dispose()); // Puffer der Instanzen (Geometrie und Material bleiben, siehe unten)
      if (o.geometry) frei(() => o.geometry.dispose());
      for (const mat of [o.material ?? []].flat()) {
        for (const u of Object.values(mat.uniforms ?? {})) {
          const t = u.value;
          if (!t?.isTexture) continue;
          closeSkyImage(t); // noch nicht hochgeladen (Abbruch während des Aufbaus)
          if (t.userData.vorrat) t.dispose(); // zurück in den Vorrat (skyTexPool), gleich wieder zu haben
          else frei(() => t.dispose(), freigabe.schwer(t));
        }
        frei(() => mat.dispose());
      }
    });
  }

  /** Während des Überblendens und Einblendens durchsichtig über der Himmelskugel, sonst undurchsichtig und zuerst. */
  function applyFade() {
    if (!mesh) return;
    const transparent = uniforms.uFade.value * uniforms.uReady.value < 0.999;
    if (mesh.material.transparent !== transparent) {
      mesh.material.transparent = transparent;
      mesh.material.needsUpdate = true;
    }
  }

  return {
    group,
    panorama: true,
    /** ganz eingeblendet, samt Streifen */
    get ready() { return uniforms.uReady.value >= 1 && (sharpen?.done ?? true) && bands.every((b) => b.done); },
    /** geladen (blendet ab jetzt ein; Streifen kommen danach) oder gescheitert: bis dahin bleibt der bisherige Hintergrund
     * stehen (skyTheme.update) */
    get settled() { return mesh !== null || failed; },
    /** ganz eingeblendet, vielleicht noch mit der Vorschau statt des scharfen Bilds und ohne Streifen; oder gescheitert */
    get shown() { return mesh !== null && uniforms.uReady.value >= 1 || failed; },
    /** update blendet noch ein (Netz, scharfes Bild, Streifen); wer das anstösst, weckt die Schleife (sceneLoop) */
    get busy() {
      return mesh !== null && (uniforms.uReady.value < 1 || sharpen?.age != null && !sharpen.done
        || bands.some((b) => b.age !== null && !b.done));
    },
    /** geladen oder lädt: release gibt etwas frei */
    get held() { return loading !== null; },
    /** kleine Textur des ganzen Bilds für die Himmelskugel, solange das Netz fehlt, ein- oder ausblendet (null: noch keine) */
    get preview() { return preview; },
    /** geladen, aber noch nie im Bild und noch nicht vorgezeichnet (skyTheme.vorzeichnen) */
    get vorzeichnenNoetig() { return !!mesh && !vorgezeichnet && !group.visible; },
    /**
     * Einmal unsichtbar ins Bild des Spiels zeichnen (Ticket 11): wie im ersten Bild des Einblendens, durchsichtig und
     * mit fast nichts Deckkraft, ganz eingeblendet (uReady), zeichne(): die Szene samt Pinsel in das Ziel, das das
     * nächste Bild ohnehin ganz überschreibt (skyTheme.vorzeichnen). Danach wieder unsichtbar.
     */
    vorzeichnen(zeichne) {
      if (!this.vorzeichnenNoetig) return false;
      vorgezeichnet = true;
      const fade = uniforms.uFade.value, ready = uniforms.uReady.value;
      uniforms.uFade.value = 1e-3;
      uniforms.uReady.value = 1;
      group.visible = true;
      applyFade();
      try { zeichne(); } finally {
        uniforms.uFade.value = fade;
        uniforms.uReady.value = ready;
        group.visible = false;
        applyFade();
      }
      return true;
    },
    /** Erst laden, wenn die Skybox gewählt wird (Wald: 1,5 MB, auf dem Desktop dazu 4,5 MB Streifen). */
    prepare() {
      if (loading) return;
      const my = token;
      loading = build(my).catch((e) => { if (my === token) failed = true; console.error(`${m.name}: ${e.message}`); })
        .finally(() => sceneLoop.wake()); // gescheitert: der bisherige Hintergrund blendet aus (skyTheme.update)
    },
    setFade(k) {
      if (k > 0 && !group.visible) arbeit.merke(`Himmel ${m.id}: erstes Bild${mesh ? '' : ' (Vorschau)'}`);
      uniforms.uFade.value = k;
      if (k > 0) this.prepare();
      else if (mesh) age = PANO.appear; // vor dem Einblenden geladen: nur uFade blendet (sonst mischten sich halb die Ringe)
      group.visible = k > 0;
      applyFade();
    },
    update(t, dt) {
      if (!mesh) return;
      age = age === null ? 0 : age + dt; // in dt, nicht in t: läuft auch bei angehaltener Zeit (?t=)
      uniforms.uReady.value = Math.min(1, age / PANO.appear);
      uniforms.uTime.value = t;
      pointUniforms.uPixelRatio.value = renderer.getPixelRatio();
      for (const p of group.children) p.userData.update?.(t, dt);
      if (sharpen && sharpen.age !== null && !sharpen.done) {
        sharpen.age += dt;
        sharpen.on.value = Math.max(0, 1 - sharpen.age / PANO.appear);
        sharpen.done = sharpen.on.value <= 0;
      }
      for (const b of bands) {
        if (b.age === null || b.done) continue;
        b.age += dt;
        b.on.value = Math.min(1, b.age / PANO.appear);
        b.done = b.on.value >= 1;
      }
      applyFade();
    },
    release() {
      if (!loading) return;
      arbeit.merke(`Himmel ${m.id}: freigeben`);
      token++;
      loading = null; failed = false; mesh = null; age = null; bands = []; sharpen = null; vorgezeichnet = false;
      preview?.dispose(); // zurück in den Vorrat (skyTexPool)
      preview = null;
      for (const t of streaming) closeSkyImage(t); // bricht skyUpload ab
      streaming.clear();
      uniforms.uReady.value = 0;
      // in Häppchen (freigabe): Alles auf einmal (beim Wechsel bis rund 300 MB am Desktop) hielt den Grafikprozess im
      // ersten Bild des neuen Himmels 70–125 ms an (Ticket 11)
      for (const root of [group, ...offscreen]) releaseTree(root, true);
      group.clear();
      offscreen = [];
    },
  };
}

/**
 * Hintergründe (order: Reihenfolge im Register): Milchstrasse und Sonnensystem aus dem Code, dazu jede Skybox aus
 * Blender im Register (backgrounds/skies.js, SKYBOX: Wald, Strand …). Welchen das Spiel zeigt, bestimmt die Welt der
 * Geschichte (Entscheid 26; Tests mit ?sky=); gespeichert wird keine Wahl. Beim Wechsel bleibt der bisherige stehen,
 * bis der neue geladen ist (settled); dann blendet erst der bisherige ganz aus, dann der neue ein: Undurchsichtige
 * Teile (Planeten, nahe 3D-Objekte einer Skybox) blenden aus Schwarz ein und lägen sonst als dunkle Flächen über dem
 * alten. Darum ist immer höchstens einer eingeblendet, und Himmelskugel und Sterne mischen nur zwischen ihm und dem
 * Neutralzustand (dunkler Raum mit Sternen). sky: milkyWay (Anteil der Milchstrasse), stars (Helligkeit der Sterne),
 * starsAboveHorizon (Sterne nur über dem Horizont), starsFrom (mit starsAboveHorizon: erst ab dieser Höhe in Grad,
 * Vulkan: über dem Kraterrand), rings (Platzhalter der Kugel, solange ein Panorama lädt oder überblendet). Module:
 * prepare, setFade, update, ready, settled, release (siehe createPanoramaSky). board: die Brett-Angabe der Skybox
 * (Register), ohne sie das Steinbrett. Das Brett gehört zum Bereitsein seines Hintergrunds: Es lädt mit ihm, hält mit
 * ihm (holding), blendet gleichzeitig mit ihm über und wird mit ihm freigegeben (boardTheme). spiegel: Unter diesem
 * Hintergrund spiegelt das Brett (nur die beiden im All, Ticket 04 der Energie, ADR 0010; spiegelHimmel, boardReflection).
 */
const SKY_NEUTRAL = { milkyWay: 0, stars: 1, starsAboveHorizon: false, starsFrom: 0, rings: null };
/** so lange hält skyTheme den bisherigen Himmel höchstens, bis der gewählte vorgezeichnet ist (wartetAufVorzeichnen) */
const VORZEICHNEN_MS = 500;
/** Untergrenze der Sterne (sky.starsFrom, Grad) als Sinus für den Shader; ohne starsAboveHorizon 0 */
const starsFromSin = (s) => (s.starsAboveHorizon ? Math.sin(THREE.MathUtils.degToRad(s.starsFrom ?? 0)) : 0);
const SKY_ENTRIES = (() => {
  const code = [
    { id: 'milky', name: 'Milchstrasse', order: 10, sky: { milkyWay: 1 }, spiegel: true },
    { id: 'solar', name: 'Sonnensystem', order: 20, module: solar, spiegel: true },
  ];
  // Ein unbrauchbarer Eintrag (unbekannte Fassung, id doppelt, Fehler beim Anlegen) fällt mit einer Warnung weg; das Spiel
  // läuft mit den übrigen Hintergründen weiter
  const ids = new Set(code.map((e) => e.id));
  const blender = [];
  for (const m of window.PRISMA_SKIES ?? []) {
    try {
      if (m.format !== SKY_FORMAT) throw new Error(`Fassung ${m.format} unbekannt`);
      if (ids.has(m.id)) throw new Error('id doppelt');
      const rings = m.sky?.rings;
      if (!Array.isArray(rings) || rings.length !== 9 || !rings.every((c) => Array.isArray(c) && c.length === 3 && c.every(Number.isFinite))) {
        throw new Error('sky.rings: 9 Farben');
      }
      // Die Brett-Angabe bekommt die Richtung des Hauptlichts im Panorama mit (light.dir): Bretter im Mondlicht
      // (boardMoonlight) beleuchten sich aus der Richtung des Monds
      const board = m.board && m.light?.dir ? { ...m.board, lightDir: m.light.dir } : m.board;
      blender.push({ id: m.id, name: m.name, order: m.order, sky: m.sky, board, camera: m.camera,
        module: createPanoramaSky(m) });
      ids.add(m.id);
    } catch (e) { console.warn(`Skybox ${m?.id}: übersprungen (${e.message})`); }
  }
  delete window.PRISMA_SKIES;
  return [...code, ...blender].map((e) => ({ ...e, sky: { ...SKY_NEUTRAL, ...e.sky } })).sort((a, b) => a.order - b.order);
})();
for (const e of SKY_ENTRIES) if (e.module?.panorama) scene.add(e.module.group);

const skyTheme = {
  entries: SKY_ENTRIES,
  byId: new Map(SKY_ENTRIES.map((e) => [e.id, e])),
  order: SKY_ENTRIES.map((e) => e.id),
  current: 'milky',
  weight: Object.fromEntries(SKY_ENTRIES.map((e) => [e.id, e.id === 'milky' ? 1 : 0])), // Anteil, 0 … 1
  fadeTime: 0.9,   // s für Aus- und Einblenden zusammen
  quiet: false,    // Zwischenszene der Geschichte: grosse Texturen (scharfes Bild, Streifen) erst danach (createPanoramaSky)
  // Eine ausgeblendete Skybox aus Blender gibt ihren Grafikspeicher frei: auf dem Handy sofort, sonst nach keep s
  // (wer bald wieder vorbeikommt, lädt sie nicht neu, und Neuladen kostet einen Ruckler) – und immer, sobald eine
  // andere gewählt ist: zwei Panoramen zugleich im Grafikspeicher nur, solange das neue lädt und das alte noch steht.
  keep: IS_MOBILE ? 0 : 30,
  hidden: {},      // s ausgeblendet, je Hintergrund
  ahead: null,     // vorgeladen, noch nicht gewählt (preload): wird nicht freigegeben, bis ein anderer gewählt ist
  goal(id) { return id === this.current ? 1 : 0; },
  get fading() { return this.order.some((id) => this.weight[id] !== this.goal(id)); },
  /** Gewählter Hintergrund ganz eingeblendet, sein Brett ganz und bereit im Bild (die Geschichte wartet darauf; Tests) */
  get ready() {
    return !this.fading && (this.byId.get(this.current).module?.ready ?? true) && boardTheme.steht(this.current);
  },
  /** Gewählter Hintergrund geladen (oder gescheitert) und sein Brett bereit: Ab jetzt blendet er über (update) */
  get settled() {
    return this.byId.get(this.current).module?.settled !== false && boardTheme.bereitFuer(this.current);
  },
  /**
   * Der bisherige Hintergrund bleibt stehen, solange er etwas zeigt: während der gewählte lädt (sonst sähe man nur die
   * Platzhalterfarben; lädt der bisherige selbst noch, blendet er gleich aus und gibt frei, das bricht sein Laden ab)
   * und während das Brett des gewählten noch nicht bereit ist (so lange bleibt auch das bisherige Brett, boardTheme.haelt).
   */
  get holding() {
    const shown = this.entries.filter((e) => e.id !== this.current && this.weight[e.id] > 0);
    if (!shown.length) return false;
    return this.byId.get(this.current).module?.settled === false && shown.some((e) => e.module?.settled !== false)
      || boardTheme.haelt(this.current) || this.wartetAufVorzeichnen();
  },
  /**
   * Der gewählte Himmel ist geladen, aber noch nicht vorgezeichnet (vorzeichnen): Der bisherige bleibt so lange stehen,
   * höchstens VORZEICHNEN_MS, damit auch ohne Vorladen (Wiederholen über eine Weltgrenze) erst vorgezeichnet wird und
   * dann eingeblendet. Fragt nur, was billig ist (je Bild).
   */
  wartetAufVorzeichnen() {
    const m = this.byId.get(this.current).module;
    if (!m?.vorzeichnenNoetig) { this.vorzeichnenSeit = null; return false; }
    this.vorzeichnenSeit ??= performance.now();
    return performance.now() - this.vorzeichnenSeit < VORZEICHNEN_MS;
  },
  vorzeichnenSeit: null,
  /**
   * Ein Bild, in dem das doppelte Zeichnen nicht auffällt (Review Ticket 11, Poco): keine Lichtwelle, kein Wachsen des
   * Bretts, keine Fahrt der Kamera und kein Überblenden (Halten zählt nicht: da steht das Bild).
   */
  get ruhigZumVorzeichnen() {
    return !celebration.active && !(shockUniforms.uShock.value.y > 0) && boardTheme.anteil === 1
      && !story.tweens.length && !(this.fading && !this.holding);
  },
  /** Gewählter Hintergrund steht (Startbildschirm): wie ready, aber scharfes Bild und Streifen dürfen noch fehlen */
  get shown() { return !this.fading && (this.byId.get(this.current).module?.shown ?? true); },
  /**
   * update hat noch zu tun (sceneLoop.pending): Überblenden, Vorschau einblenden, ein Panorama blendet ein oder schärft
   * nach, ein ausgeblendetes wartet aufs Freigeben, ein Brett blendet aus dem Notfall über. Lädt eines nur, weckt es
   * die Schleife selbst (createPanoramaSky, boardTheme.load).
   */
  get busy() {
    return this.moving || boardTheme.busy || this.entries.some((e) => !(this.weight[e.id] > 0)
      && e.id !== this.current && e.id !== this.ahead && e.module?.held);
  },
  /** Im Bild ändert sich der Himmel gerade (Überblenden, Vorschau, Einblenden, Schärfen); frameRate.skyOnly gilt dann nicht. */
  get moving() {
    if (this.fading) return true;
    const bg = background.material.uniforms, shown = this.entries.find((e) => this.weight[e.id] > 0);
    const preview = shown?.module?.preview ?? null;
    if (bg.uPreview.value !== preview || preview && bg.uPreviewOn.value < 1) return true;
    return this.entries.some((e) => this.weight[e.id] > 0 && e.module?.busy);
  },
  /**
   * Ein geladenes Panorama, das noch nie zu sehen war (gewählt oder vorgeladen), einmal unsichtbar in voller Grösse
   * vorzeichnen, vor dem Bild des Spiels (draw) und nur an einer ruhigen Stelle (ruhe), je Bild höchstens eines (Ticket
   * 11). skyWarmDraw hat es schon in ein Ziel von 1 × 1 Pixel gezeichnet; hier trifft es dazu das Ziel des Spiels in seiner
   * Grösse und Art (Tiefe, Stencil, HDR) mit allen Vorläufen (SCENE_PREPASSES) und den Pinsel samt seinen Zielen: Was ein
   * Treiber erst beim ersten echten Zeichnen anlegt, geschieht so vorher. Das Bild selbst überschreibt danach alles.
   */
  vorzeichnen() {
    for (const e of this.entries) {
      if (this.weight[e.id] > 0 || (e.id !== this.current && e.id !== this.ahead) || !e.module?.vorzeichnenNoetig) continue;
      if (!ruhe.jetzt() || !this.ruhigZumVorzeichnen) return; // erst fragen, wenn eines ansteht (je Bild)
      arbeit.tue(`Himmel ${e.id}: vorzeichnen`, () => e.module.vorzeichnen(() => {
        const rt = composer.readBuffer, before = renderer.getRenderTarget(), shadows = renderer.shadowMap.needsUpdate;
        renderer.shadowMap.needsUpdate = false;
        try {
          for (const prepass of SCENE_PREPASSES) prepass(renderer, camera, rt, scene);
          renderer.setRenderTarget(rt);
          renderer.render(scene, camera); // autoClear: löscht das Ziel zuerst
          brushPass.render(renderer, composer.writeBuffer, rt);
        } finally {
          renderer.setRenderTarget(before);
          renderer.shadowMap.needsUpdate = shadows;
        }
      }));
      adaptiveResolution.hold(0.5); // das doppelt gezeichnete Bild nicht als Überlast werten
      return;
    }
  },

  /** Gruppen der Hintergründe aus dem Code, die gerade nicht gewählt sind: beim Vorab-Übersetzen auslassen */
  get idleGroups() { return this.entries.filter((e) => e.module?.group && !e.module.panorama && e.id !== this.current).map((e) => e.module.group); },
  /** Hintergrund wechseln (die Welt der Geschichte bestimmt ihn, Entscheid 26; gespeichert wird nichts). */
  set(id, animate = true) {
    arbeit.merke(`Himmel ${id}: gewählt`);
    this.current = id;
    this.ahead = null;
    this.hidden[id] = 0;                   // gewählt: die Frist fürs Freigeben beginnt erst beim Wegschalten
    this.byId.get(id).module?.prepare?.(); // vor dem Ausblenden: sonst stockte die Überblendung
    boardTheme.prepare(id, this.byId.get(id).board); // sein Brett ebenso
    if (!animate) for (const n of this.order) this.weight[n] = this.goal(n);
    this.apply();
    boardReflection.follow(0, !animate); // die Spiegelung ebenso
    boardTheme.follow(0); // ohne Überblenden springt das Brett gleich mit
    sceneLoop.wake();
  },
  /**
   * Einen Hintergrund schon laden, ohne ihn zu zeigen (die Geschichte: die nächste Welt, solange «Gelöst» steht). Sein
   * Aufbau (Netze, Hochladen der Bilder) hielt sonst einzelne Bilder 50–120 ms an, mitten in der Reise oder beim
   * Überblenden an einer Weltgrenze (Review Ticket 06); so geschieht er vorher auf dem stillen Bild. Sein Brett ebenso.
   */
  preload(id) {
    if (id === this.current || !this.byId.has(id)) return;
    arbeit.merke(`Himmel ${id}: vorladen`);
    this.ahead = id;
    this.hidden[id] = 0;
    this.byId.get(id).module?.prepare?.();
    boardTheme.prepare(id, this.byId.get(id).board);
    sceneLoop.wake(); // das bisher vorgeladene gibt update frei
  },
  update(dt, t) {
    if (this.fading && !this.holding) {
      const step = 2 * dt / this.fadeTime;
      const others = this.order.filter((n) => n !== this.current);
      for (const n of others) this.weight[n] = Math.max(0, this.weight[n] - step);
      if (others.every((n) => this.weight[n] === 0)) this.weight[this.current] = Math.min(1, this.weight[this.current] + step);
      this.apply();
    }
    // Vorschau des eingeblendeten Panoramas statt der Platzhalterfarben (panoSky), in 0,3 s
    const bg = background.material.uniforms;
    const preview = this.entries.find((e) => this.weight[e.id] > 0)?.module?.preview ?? null;
    if (bg.uPreview.value !== preview) { bg.uPreview.value = preview; bg.uPreviewOn.value = 0; }
    if (preview) bg.uPreviewOn.value = Math.min(1, bg.uPreviewOn.value + dt / 0.3);
    const otherPanorama = this.byId.get(this.current).module?.panorama;
    for (const e of this.entries) {
      if (this.weight[e.id] > 0) { e.module?.update(t, dt); this.hidden[e.id] = 0; continue; }
      if (e.id === this.current || e.id === this.ahead || !e.module?.release) continue;
      this.hidden[e.id] = (this.hidden[e.id] ?? 0) + dt;
      if (otherPanorama || this.hidden[e.id] >= this.keep) { e.module.release(); boardTheme.free(e.id); }
    }
    boardReflection.follow(dt);
    boardTheme.follow(dt);
  },
  apply() {
    const a = this.entries.find((e) => this.weight[e.id] > 0); // höchstens einer (siehe oben)
    const w = a ? this.weight[a.id] : 0, k = w * w * (3 - 2 * w), s = a?.sky ?? SKY_NEUTRAL;
    const mix = (key) => SKY_NEUTRAL[key] + k * (s[key] - SKY_NEUTRAL[key]);
    const bg = background.material.uniforms;
    bg.uGlow.value = SKY.glow * mix('milkyWay');
    bg.uPano.value = s.rings ? k : 0;
    if (s.rings) s.rings.forEach((c, i) => bg.uRings.value[i].fromArray(c));
    stars.material.uniforms.uFade.value = mix('stars');
    stars.material.uniforms.uHorizon.value = s.starsAboveHorizon ? k : 0;
    stars.material.uniforms.uFrom.value = starsFromSin(s);
    // Die Himmelskugel (Radius 80 um die Kamera, ohne Tiefe) zeichnet nach dem Netz eines Panoramas und deckte weiter
    // draussen liegende Teile zu. Mit 136 (vor camera.far = 140) liegt sie überall dahinter; sie rechnet nur mit der
    // Richtung, sieht also gleich aus.
    background.scale.setScalar(a?.module?.panorama ? 136 / 80 : 1);
    for (const e of this.entries) e.module?.setFade(e === a ? k : 0);
  },
};

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  boardCoreUniforms: () => boardCoreUniforms, skyTheme: () => skyTheme,
});

export { boardCoreUniforms, glf, glm3, glv, skyTheme, starsFromSin };
