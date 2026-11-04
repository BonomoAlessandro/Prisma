// Bilder des Skizzenkatalogs (Ticket 02) für das Review. Nur über tools/leise.sh starten:
//   LEISE_CPU=50 sh tools/leise.sh node .scratch/kleiner-wagen/katalog/aufnahme.mjs blatt [bereich|alle] [format|alle] [stand] [t]
//   LEISE_CPU=50 sh tools/leise.sh node .scratch/kleiner-wagen/katalog/aufnahme.mjs seite [format]
// blatt: alle Varianten eines Bereichs nebeneinander (katalog.html?blatt), mit t eingefroren im Moment (Sekunden).
// seite: die Katalogseite selbst (Handy hoch 390 × 844 oder Desktop) und Prüfung auf waagrechtes Scrollen.
// Ziel: bilder/ neben diesem Skript, oder der Ordner in der Umgebungsvariable ZIEL.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../../../tools/chrome.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ziel = resolve(process.env.ZIEL || join(here, 'bilder'));
mkdirSync(ziel, { recursive: true });
const seiteUrl = pathToFileURL(join(here, 'katalog.html')).href;

const BLATT = { desktop: { width: 1560, height: 900 }, hoch: { width: 1900, height: 900 }, quer: { width: 2000, height: 900 } };
const BEREICHE = ['menue', 'ueb', 'leiste'];
const [modus = 'blatt', a1 = 'alle', a2 = 'alle', stand = 'wueste', t] = process.argv.slice(2);

const fehlerIn = (logs) => logs.filter((l) => /\[exception\]|\[error\]|\[log:error\]/.test(l));

async function laden(send, url) {
  await send('Page.navigate', { url });
  for (let i = 0; i < 150; i++) {
    if (await evaluate(send, '!!(window.__katalog && window.__katalog.fertig)')) break;
    await sleep(200);
  }
  await evaluate(send, 'document.fonts ? document.fonts.ready.then(() => true) : true');
  await sleep(400);
}

async function ganzeSeite(send, datei) {
  const m = await send('Page.getLayoutMetrics');
  const { width, height } = m.result.cssContentSize ?? m.result.contentSize;
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(width), height: Math.ceil(height), scale: 1 } });
  writeFileSync(datei, Buffer.from(shot.result.data, 'base64'));
  console.log(datei);
}

const { send, logs, close } = await startChrome({ width: 1600, height: 900 });
const stopp = setTimeout(() => { console.error('Zeitüberschreitung (5 min)'); close().finally(() => process.exit(1)); }, 300000);
try {
  if (modus === 'blatt') {
    const bereiche = a1 === 'alle' ? BEREICHE : [a1];
    const formate = a2 === 'alle' ? Object.keys(BLATT) : [a2];
    for (const b of bereiche) for (const f of formate) {
      await emulate(send, { ...BLATT[f], dpr: 1, mobile: false });
      await laden(send, `${seiteUrl}?blatt&bereich=${b}&format=${f}&stand=${stand}${t !== undefined ? `&t=${t}` : ''}`);
      await ganzeSeite(send, join(ziel, `${b}-${f}-${stand}${t !== undefined ? `-t${t}` : ''}.png`));
    }
  } else if (modus === 'seite') {
    const f = a1 === 'alle' ? 'hoch' : a1;
    const g = f === 'desktop' ? { width: 1440, height: 900, dpr: 1, mobile: false } : { width: 390, height: 844, dpr: 2, phone: true };
    await emulate(send, g);
    await laden(send, `${seiteUrl}?bereich=menue&stand=wueste&format=hoch`);
    const breite = await evaluate(send, '[document.documentElement.scrollWidth, innerWidth]');
    console.log('scrollWidth / innerWidth:', breite.join(' / '), breite[0] > breite[1] ? 'WAAGRECHTES SCROLLEN' : 'ok');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(ziel, `seite-${f}.png`), Buffer.from(shot.result.data, 'base64'));
    console.log(join(ziel, `seite-${f}.png`));
  }
  const f = fehlerIn(logs);
  if (f.length) { console.log('Fehler in der Konsole:\n  ' + f.join('\n  ')); process.exitCode = 1; } else console.log('Konsole ohne Fehler');
} finally {
  clearTimeout(stopp);
  await close();
}
