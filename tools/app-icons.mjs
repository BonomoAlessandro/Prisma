// Icons der Android-App und des Play Stores (Ticket 10 von .scratch/umbau/) aus den Icons des Spiels in icons/
// (node tools/icons.mjs macht diese aus favicon.svg). Gezeichnet in Headless-Chrome auf einem Canvas (keine Pakete).
// Aufruf: node tools/app-icons.mjs   (braucht Chrome oder Edge; nach einer Änderung an icons/ neu laufen lassen)
//
// Schreibt nach android/app/src/main/res/mipmap-<dichte>/:
// - ic_launcher_foreground.png: Vordergrund des adaptiven Icons (Android 8 und neuer, mipmap-anydpi-v26/ic_launcher.xml),
//   108 dp. Sichtbar ist nur die Mitte (72 dp, je nach Gerät rund oder eckig zugeschnitten), sicher nur ein Kreis von
//   66 dp. Das Icon mit Schutzrand (icon-maskable-512.png: sicher ist ein Kreis von 80 %) steht darum 82,5 dp gross in
//   der Mitte (0,8 × 82,5 = 66): Es deckt die sichtbaren 72 dp ganz, sein Rand zeigt sich höchstens beim Wackeln
//   (Parallaxe), dahinter der Grund (values/ic_launcher_background.xml, die Farbe in den Ecken des Icons).
// - ic_launcher.png (Android 7: das Icon mit runder Ecke, icon-512.png) und ic_launcher_round.png (rund
//   zugeschnitten aus dem Icon mit Schutzrand), je 48 dp.
// Und store/icon-512.png: das Icon für den Play Store, 512 × 512, quadratisch ohne Ecke (die Ecken rundet Google).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, startChrome } from './chrome.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RES = join(root, 'android', 'app', 'src', 'main', 'res');
const DICHTEN = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const VORDERGRUND = 82.5 / 108; // Anteil des Icons mit Schutzrand am Vordergrund

const png = (datei) => `data:image/png;base64,${readFileSync(join(root, 'icons', datei)).toString('base64')}`;
const chrome = await startChrome({ width: 600, height: 600 });
try {
  /** Zeichnet bild (data:-URL) auf ein Canvas groesse × groesse: anteil der Fläche, mittig; rund: Kreis ausschneiden. */
  const zeichne = (bild, groesse, { anteil = 1, rund = false } = {}) => evaluate(chrome.send, `(async () => {
    const img = new Image();
    img.src = ${JSON.stringify(bild)};
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = ${groesse};
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    if (${rund}) { g.beginPath(); g.arc(${groesse} / 2, ${groesse} / 2, ${groesse} / 2, 0, 2 * Math.PI); g.clip(); }
    const s = ${groesse} * ${anteil}, o = (${groesse} - s) / 2;
    g.drawImage(img, o, o, s, s);
    return c.toDataURL('image/png').split(',')[1];
  })()`);
  const schreibe = (datei, b64) => { mkdirSync(dirname(datei), { recursive: true }); writeFileSync(datei, Buffer.from(b64, 'base64')); };
  const maskable = png('icon-maskable-512.png'), ecke = png('icon-512.png');
  for (const [dichte, f] of Object.entries(DICHTEN)) {
    const ordner = join(RES, `mipmap-${dichte}`);
    schreibe(join(ordner, 'ic_launcher_foreground.png'), await zeichne(maskable, Math.round(108 * f), { anteil: VORDERGRUND }));
    schreibe(join(ordner, 'ic_launcher.png'), await zeichne(ecke, Math.round(48 * f)));
    schreibe(join(ordner, 'ic_launcher_round.png'), await zeichne(maskable, Math.round(48 * f), { rund: true }));
    console.log(`mipmap-${dichte}: geschrieben`);
  }
  // über das Canvas: Google Play verlangt ein PNG mit 32 Bit (mit Alphakanal), icons/ hat nur 24
  schreibe(join(root, 'store', 'icon-512.png'), await zeichne(maskable, 512));
  console.log('store/icon-512.png: geschrieben');
} finally {
  await chrome.close();
}
