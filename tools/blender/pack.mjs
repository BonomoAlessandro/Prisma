// Packt eine Skybox aus Blender fürs Spiel: Bilder als Skripte mit Data-URLs (Chrome lässt Bilder aus file:// nicht in
// WebGL-Texturen, Data-URLs aus einem Skript schon) und ihr Eintrag im Register backgrounds/skies.js.
//   backgrounds/<id>/base.<rev>.js   ganzes Panorama, Tiefe, Daten der Ebenen (jedes Gerät, vorab gespeichert)
//   backgrounds/<id>/hd.<rev>.js     hoch aufgelöste Streifen für den Blick nach unten, dazu grössere Bilder der Ebenen
//                                    (nur Desktop, beim ersten Gebrauch)
// rev (Stand) steht im Dateinamen: Der Service Worker speichert ohne Query-Parameter, ein neuer Stand braucht neue Namen.
// Aufruf: node tools/blender/pack.mjs <id>
//         node tools/blender/pack.mjs --brett [<id> …]
// Liest tools/blender/szenen/<id>/skybox.json (Name, Reihenfolge, vorab, Tiefe, Sterne, Farben, Pinsel, Kamera, Ebenen, Brett) und aus dessen Ordner
// `daten` die Ausgabe der Pipeline: sky.json (Mittelpunkt, Tiefe, Streifen, Hauptlicht, Spitze, Farbringe von
// wald_export.py bzw. anime.py json), die Bilder, trees.json (wald_spielbaum.py: nahe Fichten, Nebel der Szene) und
// ebenen.json (export() der Szene: weitere Daten für die Ebenen).
// Im Register ersetzt es nur den Eintrag dieser Skybox: Die Rohdaten der anderen liegen nicht im Repo.
// --brett: nur die Brett-Angabe (board) aus skybox.json in den bestehenden Eintrag übertragen, ohne id in alle Einträge
// des Registers. Die Teile werden nicht neu gepackt, sie und ihr Stand (rev) bleiben; nachgeführt werden das Register
// und sein Stand in sw.js. So geht es ohne die Rohdaten aus Blender, und die Werte der Bretter ändern sich oft
// (Spec .scratch/brett-je-himmel/).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { SKY_FORMAT, loadSkies, checkSkies, layerTypes, boardTypes, codeSkies } from '../sky-schema.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const args = process.argv.slice(2);
if (args[0] === '--brett') {
  transferBoards(args.slice(1));
  process.exit(0);
}
const id = args[0];
if (!id) throw new Error('Aufruf: node tools/blender/pack.mjs <id> | --brett [<id> …]');
const author = readAuthor(id);
const src = join(here, author.daten);
const cfg = JSON.parse(readFileSync(join(src, 'sky.json'), 'utf8'));
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const url = (file) => {
  const mime = MIME[extname(file).toLowerCase()];
  if (!mime) throw new Error(`${file}: unbekannte Endung (bekannt: ${Object.keys(MIME).join(', ')})`);
  return `data:${mime};base64,${readFileSync(join(src, file)).toString('base64')}`;
};

/** Breite und Höhe eines JPEG (SOF-Marke) oder PNG (IHDR) */
function size(file) {
  const b = readFileSync(join(src, file));
  if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  for (let p = 2; p < b.length;) {
    const m = b[p + 1], len = b.readUInt16BE(p + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(p + 7), b.readUInt16BE(p + 5)];
    p += 2 + len;
  }
  throw new Error(`${file}: Grösse nicht gefunden`);
}
/** Grafikspeicher von Texturen mit Mipmaps (RGBA 8 Bit), dazu masks ohne Mipmaps */
const texels = (files) => files.reduce((s, f) => { const [w, h] = size(f); return s + w * h; }, 0);
const gpuMB = (files, masks = []) => Math.ceil((texels(files) * 4 * 4 / 3 + texels(masks) * 4) / 2 ** 20);

// Nahe Objekte (trees.json): Modelle und Instanzen; der Nebel der Szene gehört ins Register (mehrere Ebenen lesen ihn)
const treesFile = join(src, 'trees.json');
const trees = existsSync(treesFile) ? JSON.parse(readFileSync(treesFile, 'utf8')) : null;
const data = trees ? { trees: { models: trees.models, instances: trees.trees } } : {};
// Weitere Daten für die Ebenen (ebenen.json, vom Export der Szene, z. B. Pflanzen und Wasserkarte am Strand):
// Texte "file:<name>" werden zu Data-URLs der Datei daneben; was unter "hd" steht, kommt in den HD-Teil (nur
// Desktop) und ersetzt dort Felder gleichen Namens (etwa ein grösseres Bild)
const layersFile = join(src, 'ebenen.json');
// Bilder darin, die als Textur mit Mipmaps hochgeladen werden (JPEG; die Karten als PNG sind klein): für gpuMB
const jpegs = (v) => (typeof v === 'string' ? (/^file:.*\.jpe?g$/i.test(v) ? [v.slice(5)] : [])
  : v && typeof v === 'object' ? Object.values(v).flatMap(jpegs) : []);
let layerImages = [], hdImages = [];
if (existsSync(layersFile)) {
  const raw = JSON.parse(readFileSync(layersFile, 'utf8'));
  layerImages = jpegs({ ...raw, hd: null });
  hdImages = jpegs(raw.hd ?? null);
  const inline = (v) => (typeof v === 'string' && v.startsWith('file:') ? url(v.slice(5))
    : Array.isArray(v) ? v.map(inline)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, inline(x)])) : v);
  Object.assign(data, inline(raw));
}

const base = { full: url(cfg.full), depth: url(cfg.depth), ...(cfg.watermask ? { watermask: url(cfg.watermask) } : {}), data };
const hdData = data.hd;
delete data.hd;
const hd = { bands: cfg.bands.map((b) => url(b.file)), ...(hdData ? { data: hdData } : {}) };
const rev = createHash('sha256').update(JSON.stringify([base, hd])).digest('hex').slice(0, 8);
const partJs = (role, body) => `// Skybox ${id} (${role}) – erzeugt von tools/blender/pack.mjs, nicht von Hand ändern\n` +
  `(globalThis.PRISMA_SKY_PARTS ||= {})[${JSON.stringify(`${id}/${role}`)}] = ${JSON.stringify({ rev, ...body })};\n`;
const files = [
  // vorab: false in skybox.json – das ganze Bild erst beim ersten Gebrauch laden (wie die Streifen), nicht beim
  // Installieren (BUDGET.precacheBytes in tools/sky-schema.mjs)
  { role: 'base', file: `${id}/base.${rev}.js`, device: 'all', precache: author.vorab ?? true, js: partJs('base', base),
    gpuMB: gpuMB([cfg.full, ...layerImages], cfg.watermask ? [cfg.watermask] : []) },
  { role: 'bands', file: `${id}/hd.${rev}.js`, device: 'desktop', precache: false, js: partJs('bands', hd),
    gpuMB: gpuMB([...cfg.bands.map((b) => b.file), ...hdImages]) },
];

const entry = {
  format: SKY_FORMAT, id, name: author.name, order: author.order, rev,
  parts: files.map(({ role, file, device, precache, js, gpuMB: g }) => ({ role, file, device, precache, bytes: Buffer.byteLength(js), gpuMB: g })),
  // depth in skybox.json: Glättung blur (Grad) und Netz mesh der Tiefe im Spiel, sonst wie PANO in index.html
  panorama: { center: cfg.center, depth: { log: cfg.depthLog, ...author.depth }, bands: cfg.bands.map(({ u, v }) => ({ u, v })), peak: cfg.peak },
  light: cfg.light,
  ...(trees?.fog ? { fog: trees.fog } : {}),
  ...(author.air ? { air: author.air } : {}),
  ...(author.brush ? { brush: author.brush } : {}),
  ...(author.camera ? { camera: author.camera } : {}),
  sky: { ...author.sky, rings: cfg.rings },
  layers: author.layers ?? [],
  ...(author.board !== undefined ? { board: author.board } : {}), // Brett-Angabe unverändert (sonst das Steinbrett)
};

// Erst alles prüfen (neue Teile noch im Speicher), dann schreiben: Ein fehlerhafter Eintrag landet nie im Register
const skies = loadSkies(root).filter((s) => s.id !== id).concat(entry).sort((a, b) => a.order - b.order);
const errors = checkRegistry(skies, Object.fromEntries(files.map((f) => [f.file, f.js])));
if (errors.length) {
  console.error('Nicht gepackt, Register fehlerhaft:\n  ' + errors.join('\n  '));
  process.exit(1);
}
const out = join(root, 'backgrounds');
mkdirSync(join(out, id), { recursive: true });
for (const f of files) writeFileSync(join(out, f.file), f.js);
const skiesRev = writeRegistry(skies);
for (const f of readdirSync(join(out, id))) {
  if (!files.some((x) => x.file === `${id}/${f}`)) rmSync(join(out, id, f));   // alte Stände dieser Skybox
}
for (const f of files) console.log(`backgrounds/${f.file}: ${(Buffer.byteLength(f.js) / 1e6).toFixed(2)} MB, ${f.gpuMB} MB Grafikspeicher`);
console.log(`backgrounds/skies.js: ${skies.map((s) => s.id).join(', ')} (Stand ${id}: ${rev}, Register ${skiesRev} in sw.js)`);

/** Beschreibung einer Skybox (tools/blender/szenen/<id>/skybox.json) */
function readAuthor(id) {
  const author = JSON.parse(readFileSync(join(here, 'szenen', id, 'skybox.json'), 'utf8'));
  if (author.id !== id) throw new Error(`skybox.json: id ${author.id} statt ${id}`);
  return author;
}

/** Register prüfen (tools/sky-schema.mjs) mit den Ebenentypen, Arten der Bretter und Hintergründen des Spiels */
function checkRegistry(skies, pending = {}) {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  return checkSkies(skies, { root, types: layerTypes(html), boards: boardTypes(html), reserved: codeSkies(html), pending });
}

/**
 * Register backgrounds/skies.js schreiben und seinen Stand in sw.js nachführen: Ein geänderter Service Worker löst in
 * jedem Browser ein Update aus (ob ein nur per importScripts geändertes Register das auch tut, hängt vom Browser ab).
 * Rückgabe: der Stand des Registers
 */
function writeRegistry(skies) {
  const registry = '// Register der Skyboxen aus Blender – erzeugt von tools/blender/pack.mjs, nicht von Hand ändern\n' +
    '(globalThis.PRISMA_SKIES ||= []).push(\n' + skies.map((s) => '  ' + JSON.stringify(s)).join(',\n') + ',\n);\n';
  const swFile = join(root, 'sw.js');
  const sw = readFileSync(swFile, 'utf8');
  if (!/^const SKIES = '[0-9a-f]*';/m.test(sw)) throw new Error("sw.js: Zeile const SKIES = '…'; fehlt");
  const skiesRev = createHash('sha256').update(registry).digest('hex').slice(0, 8);
  writeFileSync(join(root, 'backgrounds', 'skies.js'), registry);
  writeFileSync(swFile, sw.replace(/^const SKIES = '[0-9a-f]*';/m, `const SKIES = '${skiesRev}';`));
  return skiesRev;
}

/** --brett: nur die Brett-Angabe aus skybox.json in die Einträge ids (leer: alle) des bestehenden Registers */
function transferBoards(ids) {
  const skies = loadSkies(root);
  if (!skies.length) throw new Error('backgrounds/skies.js fehlt oder ist leer: erst packen');
  for (const id of ids.length ? ids : skies.map((s) => s.id)) {
    const entry = skies.find((s) => s.id === id);
    if (!entry) throw new Error(`${id}: nicht im Register, erst ganz packen (node tools/blender/pack.mjs ${id})`);
    const { board } = readAuthor(id);
    delete entry.board; // steht danach wie beim Packen am Schluss des Eintrags
    if (board !== undefined) entry.board = board;
  }
  const errors = checkRegistry(skies);
  if (errors.length) {
    console.error('Nicht übertragen, Register fehlerhaft:\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  const skiesRev = writeRegistry(skies);
  for (const s of skies) console.log(`${s.id}: Brett ${s.board ? JSON.stringify(s.board) : '– (Steinbrett)'}`);
  console.log(`backgrounds/skies.js: nur Brett-Angaben übertragen, Teile unverändert (Register ${skiesRev} in sw.js)`);
}
