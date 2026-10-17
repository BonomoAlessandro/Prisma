// Screenshots der Startstellung für die KI-Tester, schnell und ruhig: Desktop (1440 × 900) und Handy (390 × 844,
// Pixeldichte 2), je Bildschirm alle Level in einer Browser-Sitzung.
// Aufruf: sh tools/leise.sh node tools/ki-tester/shots.mjs <ordner> <platz …>
//   Platz 1–150 (ohne Tutorial), Bilder <ordner>/<platz>-desktop.png und -handy.png mit der Kopfzeile wie im Spiel.
//   prepare.mjs nimmt dieselben Bilder mit der Kennung des Levels statt Nummer, Name und Grad auf.
// Je Level: Level merken und neu laden (?t=12: Zeit steht, Zufall fest; nach einem Levelwechsel ohne Neuladen wüchsen
// die Strahlen bei stehender Zeit nie), Herauswachsen und Aufleuchten mit __prismaDebug.settle vorspulen statt sie
// über 150 s Bild für Bild abzuwarten, zwei Bilder rendern lassen und aufnehmen. Gültig ist eine Aufnahme erst, wenn
// eine zweite nach weiterem Vorspulen byte-gleich ist: Dann ist die Szene ruhig.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import { startChrome, emulate, evaluate, sleep } from '../chrome.mjs';
import { L } from '../solver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGE = pathToFileURL(join(root, 'index.html')).href + '?noadapt&nointro&t=12';
export const VIEWS = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1, phone: false },
  { name: 'handy', width: 390, height: 844, dpr: 2, phone: true },
];
const SETTLE = 6;  // s vorspulen: Herauswachsen bis 1,1 s, Aufleuchten bis 2,8 s, Ziele und Kamera klingen danach ab
const TRIES = 5;   // weitere Aufnahmen, bis zwei gleich sind

/** Bricht ab, wenn der Prozess nicht über leise.sh mit höchstens 50 % läuft (so viel dürfen Screenshots, leise.sh). */
export function requireQuiet() {
  if (os.getPriority() !== os.constants.priority.PRIORITY_LOW || !(Number(process.env.LEISE_CPU || 20) <= 50)) {
    throw new Error('Screenshots nur über die gedeckelte Umgebung: LEISE_CPU=50 sh tools/leise.sh node …');
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
 * Nimmt die Level auf. shots: [{ index (in LEVELS), label (Kennung in der Kopfzeile, null = wie im Spiel), file (Pfad
 * ohne Endung) }]. Schreibt <file>-desktop.png und <file>-handy.png. log(text) meldet den Fortschritt.
 * Rückgabe: Sekunden je Bildschirm und Aufnahme.
 */
export async function takeShots(shots, log = console.log) {
  requireQuiet();
  const seconds = {};
  for (const view of VIEWS) {
    const { send, logs, close } = await startChrome(view);
    try {
      await emulate(send, view);
      await send('Page.navigate', { url: PAGE });
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
        await rendered(send, 2);
        let image = await capture(send), calm = false;
        for (let k = 0; k < TRIES && !calm; k++) {
          await evaluate(send, '__prismaDebug.settle(1)');
          await rendered(send, 2);
          const again = await capture(send);
          calm = again === image;
          image = again;
        }
        if (!calm) throw new Error(`${shot.file}-${view.name}: Szene wird nicht ruhig`);
        mkdirSync(dirname(shot.file), { recursive: true });
        writeFileSync(`${shot.file}-${view.name}.png`, Buffer.from(image, 'base64'));
        seconds[view.name].push((Date.now() - start) / 1000);
        log(`${shot.file}-${view.name}.png (${((Date.now() - start) / 1000).toFixed(1)} s)`);
      }
    } finally { await close(); }
    const bad = logs.filter(l => /\[exception\]|\[error\]|THREE\.WebGLProgram/.test(l));
    if (bad.length) throw new Error('Konsole:\n  ' + bad.join('\n  '));
  }
  return seconds;
}

if (process.argv[1] && process.argv[1].endsWith('shots.mjs')) {
  const [dir, ...positions] = process.argv.slice(2);
  if (!dir || !positions.length || positions.some(p => !(+p >= 1 && +p <= L.LEVELS.length - L.TUTORIAL_COUNT))) {
    console.error('Aufruf: sh tools/leise.sh node tools/ki-tester/shots.mjs <ordner> <platz …>   (Platz 1–150)');
    process.exit(1);
  }
  await takeShots(positions.map(p => ({ index: L.TUTORIAL_COUNT + +p - 1, label: null, file: join(resolve(dir), p) })));
}
