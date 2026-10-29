// Aufnahmen für die Vorschau des Menüs (Ticket 05, Haltepunkt). Nur über tools/leise.sh starten, aus dem Worktree:
//   LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/menue-vorschau/aufnahme.mjs himmel [blick|-] [format]
//   LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/menue-vorschau/aufnahme.mjs vorschau [variante] [format]
//   LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/menue-vorschau/aufnahme.mjs uebersicht
// himmel: das Spiel mit der Milchstrasse, Kamera vom Brett weg in den Himmel (wie in den Zwischenszenen der
// Geschichte), ohne Kopfzeile und Knöpfe; ergibt hintergrund-<format>.png. vorschau: die Seiten variante-*.html je
// Format nach bilder/. uebersicht: alle neun Bilder auf einem Blatt (uebersicht.html → bilder/uebersicht.png).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../../../tools/chrome.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const bilder = join(here, 'bilder');
mkdirSync(bilder, { recursive: true });

const FORMATE = {
  desktop: { width: 1440, height: 900, dpr: 1, phone: false },
  hoch: { width: 390, height: 844, dpr: 2, phone: true },
  quer: { width: 844, height: 390, dpr: 2, phone: true },
};
const VARIANTEN = ['karten', 'faecher', 'lichtwege'];
const [modus = 'vorschau', a1, a2] = process.argv.slice(2);

async function aufnehmen({ url, format, datei, vorher = '', warten = 600 }) {
  const f = FORMATE[format];
  const { send, logs, close } = await startChrome({ width: f.width, height: f.height });
  try {
    await emulate(send, f);
    await send('Page.navigate', { url });
    for (let i = 0; i < 100; i++) {
      if (await evaluate(send, 'document.readyState === "complete"')) break;
      await sleep(200);
    }
    if (vorher) console.log('Skript:', await evaluate(send, vorher));
    await sleep(warten);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(datei, Buffer.from(shot.result.data, 'base64'));
    const fehler = logs.filter(l => /\[exception\]|\[error\]/.test(l) && !/GPU stall|swiftshader|WebGL-/i.test(l));
    console.log(datei, fehler.length ? '\n  ' + fehler.join('\n  ') : '');
  } finally {
    await close();
  }
}

// gewählte Blicke: ohne Brett, leicht unter den Horizont, gedreht zum roten Nebel und dem Band der Milchstrasse
const HIMMEL = { desktop: 'leer,-0.3,-0.95', hoch: 'leer,-0.32,-0.32', quer: 'leer,-0.3,-0.95' };

if (modus === 'himmel') {
  for (const format of a2 ? [a2] : Object.keys(FORMATE)) {
    const hoehe = a1 && a1 !== '-' ? a1 : HIMMEL[format];
    const url = pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro&sky=milky';
    // warten, bis die Szene läuft und der Hintergrund eingeblendet ist; dann Kopfzeile und Knöpfe weg, Blick hinauf
    const vorher = `(async () => {
      const t0 = performance.now();
      while (!(window.__prisma && window.__prisma.frames > 2 && window.__prisma.skyReady())) {
        if (performance.now() - t0 > 60000) return 'Zeitüberschreitung';
        await new Promise(r => setTimeout(r, 250));
      }
      for (const id of ['hud', 'controls', 'solved', 'levels', 'story', 'perf']) document.getElementById(id).style.display = 'none';
      const d = window.__prismaDebug;
      // hoehe «0.1,0.4»: 0.1 rad über dem Horizont, um 0.4 rad nach links gedreht; «brett»: Blick wie im Spiel
      // «leer…»: ohne Platte, Rahmen und Brett (alles, was kleiner als 60 Einheiten ist); «blick,…»: mit ihnen
      if (${hoehe.startsWith('leer')}) {
        const v = new THREE.Vector3();
        for (const o of d.scene.children) {
          if (o.type === 'Points') continue; // die Sterne: kleine Kugel, die der Shader ins Unendliche legt
          const box = new THREE.Box3().setFromObject(o);
          if (!box.isEmpty() && box.getSize(v).length() < 60) o.visible = false;
        }
        d.brushPass.enabled = false; // zeichnet die Platte sonst für sich noch einmal
      }
      const [el, az] = ${JSON.stringify(hoehe.replace(/^(leer|blick),?/, ''))}.split(',').map(Number);
      if (${/\d/.test(hoehe)}) {
        d.story.aimGaze(el);
        if (az) d.story.gazeDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), az);
        d.story.gaze = 1;
      }
      const f0 = window.__prisma.frames;
      while (window.__prisma.frames < f0 + 12) await new Promise(r => setTimeout(r, 100));
      return 'bereit nach ' + Math.round(performance.now() - t0) + ' ms';
    })()`;
    const probe = a1 && a1 !== '-' ? '-' + a1 : ''; // eigener Blick: als Probe daneben, der gewählte bleibt
    await aufnehmen({ url, format, datei: join(here, `hintergrund-${format}${probe}.png`), vorher, warten: 1500 });
  }
} else if (modus === 'vorschau') {
  for (const v of a1 ? [a1] : VARIANTEN) {
    for (const format of a2 ? [a2] : Object.keys(FORMATE)) {
      // ?fokus: die Seite setzt den Tastaturfokus auf ein Element (Probe des Fokusrings), sonst keiner
      const fokus = v === 'karten' && format === 'desktop' ? '?fokus' : '';
      const url = pathToFileURL(join(here, `variante-${v}.html`)).href + fokus;
      const vorher = `document.fonts.ready.then(() => 'Schrift: ' + [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).join(', '))`;
      await aufnehmen({ url, format, datei: join(bilder, `${v}-${format}.png`), vorher, warten: 900 });
    }
  }
} else if (modus === 'uebersicht') {
  const url = pathToFileURL(join(here, 'uebersicht.html')).href;
  const { send, close } = await startChrome({ width: 2900, height: 1600 });
  try {
    await emulate(send, { width: 2900, height: 1600, dpr: 1 });
    await send('Page.navigate', { url });
    await sleep(1500);
    const h = await evaluate(send, 'document.fonts.ready.then(() => Math.ceil(document.documentElement.scrollHeight))');
    await emulate(send, { width: 2900, height: h, dpr: 1 });
    await sleep(800);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(bilder, 'uebersicht.png'), Buffer.from(shot.result.data, 'base64'));
    console.log(join(bilder, 'uebersicht.png'), h);
  } finally {
    await close();
  }
}
