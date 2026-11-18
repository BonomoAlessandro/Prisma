// Feature-Grafik für den Play Store (1024 × 500, Ticket 10 von .scratch/umbau/): ein Bild des Spiels in dieser Grösse
// (tests/bildvergleich.mjs --gpu --store <ordner>, Grösse «grafik»; gewählt: grafik-welt-4-nach.jpg, der Vulkan gelöst)
// nach rechts gerückt, links im Dunkel der Name wie auf dem Startbildschirm und der Untertitel der Sprache; oben
// abgedunkelt, damit die Kopfzeile des Spiels nicht mitliest. Gezeichnet in Headless-Chrome (keine Pakete).
// Aufruf: node tools/store-grafik.mjs <bild.jpg> <untertitel> <aus.png>
//   etwa: node tools/store-grafik.mjs <ordner>/grafik-welt-4-nach.jpg "Ein Lichtsignal an die Sterne" store/de/feature-grafik.png
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, startChrome } from './chrome.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [bild, unter, aus] = process.argv.slice(2);
if (!aus) { console.error('Aufruf: node tools/store-grafik.mjs <bild.jpg> <untertitel> <aus.png>'); process.exit(2); }
const img = `data:image/jpeg;base64,${readFileSync(bild).toString('base64')}`;
const font = `data:font/woff2;base64,${readFileSync(join(root, 'vendor', 'jost', 'jost-latin.woff2')).toString('base64')}`;
const c = await startChrome({ width: 400, height: 400 });
try {
  const b64 = await evaluate(c.send, `(async () => {
    const f = new FontFace('Jost', 'url(${font})', { weight: '100 900' }); await f.load(); document.fonts.add(f);
    const im = new Image(); im.src = ${JSON.stringify(img)}; await im.decode();
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 500; const g = cv.getContext('2d');
    g.fillStyle = '#030308'; g.fillRect(0, 0, 1024, 500);
    g.drawImage(im, 280, 0, 1024, 500);
    let v = g.createLinearGradient(0, 0, 640, 0);
    v.addColorStop(0, 'rgba(3,3,8,1)'); v.addColorStop(0.45, 'rgba(3,3,8,0.92)'); v.addColorStop(1, 'rgba(3,3,8,0)');
    g.fillStyle = v; g.fillRect(0, 0, 1024, 500);
    v = g.createLinearGradient(0, 0, 0, 90);
    v.addColorStop(0, 'rgba(3,3,8,1)'); v.addColorStop(0.45, 'rgba(3,3,8,0.97)'); v.addColorStop(1, 'rgba(3,3,8,0)');
    g.fillStyle = v; g.fillRect(0, 0, 1024, 90);
    g.fillStyle = '#fff'; g.font = '200 64px Jost'; g.letterSpacing = '30px';
    g.shadowColor = 'rgba(170,180,255,0.6)'; g.shadowBlur = 24;
    g.fillText('PRISMA', 70, 250);
    g.shadowBlur = 0; g.fillStyle = 'rgba(232,230,240,0.78)'; g.font = '300 17px Jost'; g.letterSpacing = '6px';
    g.fillText(${JSON.stringify(unter)}.toUpperCase(), 74, 298);
    return cv.toDataURL('image/png').split(',')[1]; })()`);
  writeFileSync(aus, Buffer.from(b64, 'base64'));
  console.log(`geschrieben: ${aus}`);
} finally {
  await c.close();
}
