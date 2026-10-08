// Erzeugt die Android-Icons mit Schutzrand („maskable“) aus favicon.svg. Android schneidet sie je nach Gerät rund
// oder eckig zu; sicher sichtbar ist nur ein Kreis mit 80 % Durchmesser. Deshalb: keine abgerundete Ecke, Grund bis
// zum Rand, Prisma samt Licht auf SCALE verkleinert, Strahl und Spektrum verlängert, damit sie weiter bis an den
// Rand reichen. Grund und Boden bleiben in voller Grösse.
// Aufruf: node tools/icons.mjs   (braucht Chrome oder Edge; schreibt icons/icon-maskable-192.png und -512.png)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCALE = 0.85;
const SIZES = [192, 512];

let svg = readFileSync(join(root, 'favicon.svg'), 'utf8').replace(/\r\n/g, '\n'); // auch nach Windows-Checkout
const replace = (from, to, count) => {
  const n = svg.split(from).length - 1;
  if (n !== count) throw new Error(`favicon.svg hat sich geändert: „${from}“ ${n}× statt ${count}×`);
  svg = svg.split(from).join(to);
};
// Ecke weg; alles nach Grund und Boden kommt in eine verkleinerte Gruppe um die Mitte
replace('<g clip-path="url(#tile)">', '<g>', 1);
replace('<rect y="300" width="512" height="212" fill="url(#floor)"/>',
  `<rect y="300" width="512" height="212" fill="url(#floor)"/>\n    <g transform="translate(256 256) scale(${SCALE}) translate(-256 -256)">`, 1);
replace('</g>\n</svg>', '</g>\n  </g>\n</svg>', 1);
// Maske der Bodenspiegelung verbreitern, sonst endet die verkleinerte Spiegelung links und rechts mit einer Kante
replace('<mask id="reflMask"><rect width="512" height="512"', '<mask id="reflMask"><rect x="-256" width="1024" height="512"', 1);
// einfallender Strahl: auf derselben Geraden weiter nach links (sichtbar wird vor allem der Dunst länger;
// der Kern verblasst wie im Original zum Rand hin)
const beamFrom = -90, beamY = 285 + (beamFrom + 10) * (225 - 285) / (196 + 10);
replace('M-10 285 L196 225', `M${beamFrom} ${beamY.toFixed(1)} L196 225`, 2);
// Spektrum: jeden Keil auf derselben Geraden bis x = 620 verlängern
const fanTo = 620, k = (fanTo - 325) / (530 - 325);
let fans = 0;
svg = svg.replace(/M325 ([\d.]+) L530 ([\d.]+) L530 ([\d.]+) L325 ([\d.]+) Z/g, (_, y0, y1, y2, y3) => {
  fans++;
  const top = +y0 + (y1 - y0) * k, bottom = +y3 + (y2 - y3) * k;
  return `M325 ${y0} L${fanTo} ${top.toFixed(1)} L${fanTo} ${bottom.toFixed(1)} L325 ${y3} Z`;
});
if (fans !== 7) throw new Error(`favicon.svg hat sich geändert: ${fans} statt 7 Spektrumkeile`);

const chrome = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find(p => existsSync(p));
if (!chrome) throw new Error('Kein Chrome/Edge gefunden (CHROME_PATH setzen).');

const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">';
if (!svg.includes(svgTag)) throw new Error('favicon.svg hat sich geändert: Wurzelelement nicht gefunden');

const tmp = mkdtempSync(join(tmpdir(), 'prisma-icons-'));
try {
  for (const size of SIZES) {
    // Feste Grösse im SVG: Headless-Chrome rendert mindestens 512 px breit; ohne width/height würde ein kleineres
    // Icon mittig in die breitere Fläche gesetzt und der Screenshot schnitte es ab
    const file = join(tmp, `maskable-${size}.svg`);
    writeFileSync(file, svg.replace(svgTag, svgTag.replace(' viewBox', ` width="${size}" height="${size}" viewBox`)));
    const out = join(root, 'icons', `icon-maskable-${size}.png`);
    rmSync(out, { force: true });
    execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(tmp, 'profile')}`,
      `--window-size=${size},${size}`, `--screenshot=${out}`, pathToFileURL(file).href,
    ], { stdio: 'ignore' });
    if (!existsSync(out)) throw new Error('Chrome hat kein Bild geschrieben: ' + out);
    console.log('geschrieben:', out);
  }
} finally {
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* Chrome hält noch Dateien offen */ }
}
