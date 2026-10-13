// Packt die kodierte Wald-Skybox (tools/blender/sky/, von wald_export.py) als Skripte mit Data-URLs nach backgrounds/:
// Chrome lässt Bilder aus file:// nicht in WebGL-Texturen, Data-URLs aus einem Skript schon.
//   backgrounds/forest.js     ganzes Panorama und Tiefe, dazu die Fichten nahe am Brett (lädt jedes Gerät)
//   backgrounds/forest-hd.js  hoch aufgelöste Streifen für den Blick nach unten (nur Desktop)
// Aufruf: node tools/blender/pack.mjs [stil]   (stil: Unterordner von sky/, z. B. anime; ohne: realistisch)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sky = join(here, 'sky', process.argv[2] ?? '');
const out = join(here, '..', '..', 'backgrounds');
mkdirSync(out, { recursive: true });
const cfg = JSON.parse(readFileSync(join(sky, 'sky.json'), 'utf8'));
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg' };
const url = (file) => `data:${MIME[extname(file)]};base64,${readFileSync(join(sky, file)).toString('base64')}`;

function write(name, data) {
  const js = `// Wald-Hintergrund aus Blender – erzeugt von tools/blender/pack.mjs, nicht von Hand ändern\n` +
    `window.PRISMA_FOREST = Object.assign(window.PRISMA_FOREST || {}, ${JSON.stringify(data)});\n`;
  writeFileSync(join(out, name), js);
  console.log(`backgrounds/${name}: ${(js.length / 1e6).toFixed(2)} MB`);
}

// trees.json (wald_spielbaum.py): Modelle und Standorte der Fichten, die das Spiel selbst zeichnet (fehlt: keine)
const trees = existsSync(join(sky, 'trees.json')) ? JSON.parse(readFileSync(join(sky, 'trees.json'), 'utf8')) : undefined;
write('forest.js', { center: cfg.center, depthLog: cfg.depthLog, full: url(cfg.full), depth: url(cfg.depth), trees });
write('forest-hd.js', { bands: cfg.bands.map((b) => ({ url: url(b.file), u: b.u, v: b.v })) });
