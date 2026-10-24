// Screenshots der Startstellung für die KI-Tester, schnell und ruhig: Desktop (1440 × 900) und Handy (390 × 844,
// Pixeldichte 2), je Bildschirm alle Level in einer Browser-Sitzung.
// Aufruf: sh tools/leise.sh node tools/ki-tester/shots.mjs <ordner> <platz …> [--wuerfel]
//   Platz 1–150 (ohne Tutorial), Bilder <ordner>/<platz>-desktop.png und -handy.png mit der Kopfzeile wie im Spiel.
//   prepare.mjs nimmt dieselben Bilder mit der Kennung des Levels statt Nummer, Name und Grad auf.
//   --wuerfel: Platz unter den Würfel-Leveln (LEVELS_3D), Bilder <ordner>/w<platz>-… aus den Blickwinkeln von
//   CUBE_ANGLES (Desktop beim Start, von oben und seitlich, Handy beim Start).
// Je Level: Level merken und neu laden (?t=12: Zeit steht, Zufall fest; nach einem Levelwechsel ohne Neuladen wüchsen
// die Strahlen bei stehender Zeit nie), Herauswachsen und Aufleuchten mit __prismaDebug.settle vorspulen statt sie
// über 150 s Bild für Bild abzuwarten, zwei Bilder rendern lassen und aufnehmen. Gültig ist eine Aufnahme erst, wenn
// eine zweite nach weiterem Vorspulen byte-gleich ist: Dann ist die Szene ruhig.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gedeckelt, deckelText } from '../deckel.mjs';
import { startChrome, emulate, evaluate, sleep } from '../chrome.mjs';
import { L } from '../solver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Die Seite der Aufnahmen: index.html, oder eine Kopie mit weiteren Leveln (Kandidaten, prepare.mjs). */
export const seitenUrl = (datei = join(root, 'index.html')) => pathToFileURL(datei).href + '?noadapt&nointro&t=12';
const PAGE = seitenUrl();
export const VIEWS = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1, phone: false },
  { name: 'handy', width: 390, height: 844, dpr: 2, phone: true },
];
const SETTLE = 6;  // s vorspulen: Herauswachsen bis 1,1 s, Aufleuchten bis 2,8 s, Ziele und Kamera klingen danach ab
const TRIES = 5;   // weitere Aufnahmen, bis zwei gleich sind
/**
 * Blickwinkel auf einen Würfel je Bildschirm, neben dem beim Start (name ''): theta dreht um die senkrechte Achse,
 * phi neigt (negativ = steiler), beides im Bogenmass gegen die Ausgangsansicht und wie beim Ziehen in den Grenzen der
 * Kamera (phiLimits; −9 heisst so steil wie erlaubt). „oben“ zeigt die Zellen jeder Ebene fast senkrecht übereinander,
 * „seite“ von der anderen vorderen Ecke und flacher die Höhen. Auf dem Handy nur das Bild beim Start: Es zeigt, was
 * der Spieler dort zuerst sieht.
 */
export const CUBE_ANGLES = {
  desktop: [{ name: '', theta: 0, phi: 0 }, { name: 'oben', theta: 0, phi: -9 },
    { name: 'seite', theta: -1.1, phi: 0.25 }],
  handy: [{ name: '', theta: 0, phi: 0 }],
};
/** Die Bilddateien eines Levels ohne Endung je Bildschirm und Blickwinkel: <file>-desktop, <file>-desktop-oben … */
export const imageNames = (file, angles = null) => VIEWS.flatMap(v => (angles?.[v.name] ?? [{ name: '' }])
  .map(a => `${file}-${v.name}${a.name ? `-${a.name}` : ''}`));

/**
 * Bricht ab, wenn der Prozess nicht über leise.sh mit höchstens 50 % läuft (so viel dürfen Screenshots; ein Rechner hebt
 * die Grenze mit LEISE_MAX_CPU an, deckel.mjs).
 */
export function requireQuiet() {
  if (!gedeckelt()) {
    throw new Error(`Screenshots nur über die gedeckelte Umgebung (jetzt ${deckelText()}): LEISE_CPU=50 sh `
      + 'tools/leise.sh node …');
  }
}

async function until(send, expression, what, seconds = 300) {
  for (let i = 0; i < seconds * 5; i++) {
    const v = await evaluate(send, expression).catch(() => null);
    if (v) return v;
    await sleep(200);
  }
  throw new Error(`Zeitüberschreitung: ${what}`);
}
const frames = (send) => evaluate(send, 'window.__prisma.frames');
async function rendered(send, n) {
  const f = await frames(send);
  await until(send, `window.__prisma.frames >= ${f + n}`, `${n} Bilder`);
}
const capture = async (send) => (await send('Page.captureScreenshot', { format: 'png' })).result.data;

/**
 * Nimmt die Level auf. shots: [{ index (in LEVELS, im Spiel mit den Würfel-Leveln ab CUBE_START), label (Kennung in
 * der Kopfzeile, null = wie im Spiel), file (Pfad ohne Endung), angles (wahlweise Blickwinkel je Bildschirm wie
 * CUBE_ANGLES) }]. Schreibt <file>-desktop.png und <file>-handy.png, mit angles je Blickwinkel (imageNames).
 * log(text) meldet den Fortschritt; page: die URL der Seite (seitenUrl), Vorgabe index.html. Rückgabe: Sekunden je
 * Bildschirm und Level.
 */
export async function takeShots(shots, log = console.log, page = PAGE) {
  requireQuiet();
  const seconds = {};
  for (const view of VIEWS) {
    const { send, logs, close } = await startChrome(view);
    try {
      await emulate(send, view);
      await send('Page.navigate', { url: page });
      await until(send, 'window.__prisma?.frames > 2', 'Spiel startet');
      seconds[view.name] = [];
      for (const shot of shots) {
        const start = Date.now();
        await evaluate(send, `__prismaDebug.progress.save(${shot.index}); window.__before = true`);
        await send('Page.reload');
        await until(send, `!window.__before && window.__prisma?.levelIndex() === ${shot.index} && ` +
          'window.__prisma.frames > 2 && window.__prisma.skyReady()', `Level ${shot.index}`);
        if (shot.label) {
          await evaluate(send, `document.getElementById('hud-title').textContent = ${JSON.stringify(shot.label)};
            document.getElementById('hud-tier').hidden = true;
            const sub = document.getElementById('hud-sub');
            sub.textContent = sub.textContent.replace(/^Level \\d+ \\/ \\d+ · /, '');`);
        }
        await evaluate(send, `__prismaDebug.settle(${SETTLE})`);
        for (const angle of shot.angles?.[view.name] ?? [{ name: '', theta: 0, phi: 0 }]) {
          // Blickwinkel wie nach dem Ziehen, gleich am Ziel statt weich dorthin (siehe CUBE_ANGLES)
          if (angle.name) {
            await evaluate(send, `(() => { const c = __prismaDebug.cameraRig, l = phiLimits(); c.homing = null;
              c.goalTheta = c.userTheta = ${angle.theta};
              c.goalPhi = c.userPhi = Math.min(Math.max(${angle.phi}, -l.up), l.down); })()`);
            await evaluate(send, '__prismaDebug.settle(1)');
          }
          await rendered(send, 2);
          let image = await capture(send), calm = false;
          for (let k = 0; k < TRIES && !calm; k++) {
            await evaluate(send, '__prismaDebug.settle(1)');
            await rendered(send, 2);
            const again = await capture(send);
            calm = again === image;
            image = again;
          }
          const file = `${shot.file}-${view.name}${angle.name ? `-${angle.name}` : ''}.png`;
          if (!calm) throw new Error(`${file}: Szene wird nicht ruhig`);
          mkdirSync(dirname(shot.file), { recursive: true });
          writeFileSync(file, Buffer.from(image, 'base64'));
          log(`${file} (${((Date.now() - start) / 1000).toFixed(1)} s)`);
        }
        seconds[view.name].push((Date.now() - start) / 1000);
      }
    } finally { await close(); }
    const bad = logs.filter(l => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l));
    if (bad.length) throw new Error('Konsole:\n  ' + bad.join('\n  '));
  }
  return seconds;
}

if (process.argv[1] && process.argv[1].endsWith('shots.mjs')) {
  const cube = process.argv.includes('--wuerfel');
  const [dir, ...positions] = process.argv.slice(2).filter(a => a !== '--wuerfel');
  const count = cube ? L.LEVELS_3D.length : L.LEVELS.length - L.TUTORIAL_COUNT;
  if (!dir || !positions.length || positions.some(p => !(+p >= 1 && +p <= count))) {
    console.error('Aufruf: sh tools/leise.sh node tools/ki-tester/shots.mjs <ordner> <platz …> [--wuerfel]   '
      + `(Platz 1–${count}; mit --wuerfel der Platz unter den Würfel-Leveln, aus allen Blickwinkeln)`);
    process.exit(1);
  }
  await takeShots(positions.map(p => (cube
    ? { index: L.LEVELS.length + +p - 1, label: null, file: join(resolve(dir), `w${p}`), angles: CUBE_ANGLES }
    : { index: L.TUTORIAL_COUNT + +p - 1, label: null, file: join(resolve(dir), p) })));
}
