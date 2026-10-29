// Bilder und Prüfungen der Übersicht (probe.html) in headless Chrome. Nur über tools/leise.sh starten, aus dem Worktree:
//   LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/bausteine/uebersicht/aufnahme.mjs [format]
// Je Format (desktop 1440×900, hoch 390×844 und quer 844×390 mit Gerätepixeln 2) ein Chrome; je Stand (anfang, mitte,
// geschafft, dorf) ein Bild nach bilder/<stand>-<format>.png, dazu: Tastaturfokus (fokus-desktop: ↑ von der offenen
// Kachel, dann →), die Seite «Im Dorf» auf dem Handy (dorf-dorf-hoch), Wischen mitten in der Bewegung (wischen-hoch)
// und der Hinweis einer gesperrten Kachel (gesperrt-hoch). Jede Aufnahme meldet, was abgeschnitten oder zu klein ist.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startChrome, emulate, evaluate, sleep } from '../../../../tools/chrome.mjs';

const hier = dirname(fileURLToPath(import.meta.url));
const bilder = join(hier, 'bilder');
mkdirSync(bilder, { recursive: true });
const probe = pathToFileURL(join(hier, 'probe.html')).href;

const FORMATE = {
  desktop: { width: 1440, height: 900, dpr: 1, phone: false },
  hoch: { width: 390, height: 844, dpr: 2, phone: true },
  quer: { width: 844, height: 390, dpr: 2, phone: true },
};
const STAENDE = ['anfang', 'mitte', 'geschafft', 'dorf'];
const nur = process.argv[2];

/** Prüfung in der Seite: Modus, Schrift, Grösse der Kacheln, Abgeschnittenes, lange Titel */
const PRUEFUNG = `(() => {
  const ueb = document.querySelector('.ueb'), W = innerWidth, H = innerHeight;
  const sichtbar = (el) => !el.closest('[inert]') && el.getClientRects().length;
  const kacheln = [...ueb.querySelectorAll('.ueb-kachel')].filter(sichtbar);
  const r = kacheln.map((k) => k.getBoundingClientRect());
  const raus = [...ueb.querySelectorAll('.ueb-kachel, .ueb-tab, .ueb-schritt, .ueb-schliessen, .ueb-titel, .ueb-grad, .ueb-legende, .ueb-welt-name, .ueb-seitentitel')]
    .filter(sichtbar).filter((el) => { const b = el.getBoundingClientRect(); return b.width && (b.left < -0.5 || b.top < -0.5 || b.right > W + 0.5 || b.bottom > H + 0.5); })
    .map((el) => el.className.baseVal ?? el.className);
  const zuBreit = [...ueb.querySelectorAll('.ueb-name')].filter(sichtbar).filter((t) => t.scrollWidth > t.clientWidth + 1).map((t) => t.textContent);
  const eng = [...ueb.querySelectorAll('.ueb-name.ueb-eng')].filter(sichtbar).map((t) => t.textContent + (t.classList.contains('ueb-brich') ? ' (gebrochen)' : ''));
  return {
    modus: ueb.dataset.modus,
    schrift: document.fonts.check('300 14px Jost'),
    kacheln: kacheln.length,
    kleinste: r.length ? Math.round(Math.min(...r.map((b) => b.width))) + ' × ' + Math.round(Math.min(...r.map((b) => b.height))) : '-',
    scrollt: ueb.scrollHeight > ueb.clientHeight + 1 || document.documentElement.scrollWidth > W,
    raus, zuBreit, eng,
    fokus: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
  };
})()`;

async function bereit(send, url) {
  await send('Page.navigate', { url });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(send, 'document.readyState === "complete" && !!window.__ueb')) break;
    await sleep(150);
  }
  await evaluate(send, 'document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))');
}
async function bild(send, datei) {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(bilder, datei), Buffer.from(shot.result.data, 'base64'));
  const p = await evaluate(send, PRUEFUNG);
  const warn = [p.scrollt && 'scrollt', p.raus.length && `abgeschnitten: ${p.raus.join(', ')}`, p.zuBreit.length && `Titel zu breit: ${p.zuBreit.join(', ')}`,
    !p.schrift && 'Jost nicht geladen'].filter(Boolean);
  console.log(`${datei}: ${p.modus}, ${p.kacheln} Kacheln, kleinste ${p.kleinste} px${p.eng.length ? `, klein gesetzt: ${p.eng.join(', ')}` : ''}` +
    `${warn.length ? '\n  ! ' + warn.join('\n  ! ') : ''}\n  Fokus: ${p.fokus}`);
}
const taste = async (send, key, code, vk) => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(120);
};
const mitte = (send, sel) => evaluate(send, `(() => { const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => !e.closest('[inert]'));
  const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);

/**
 * pruefen: Tastatur und Ereignisse der Reihe nach (meldet nach jeder Taste die fokussierte Kachel bzw. das Ereignis),
 * dazu Laptop 1280×720 und Tablet 1024×768 (mitte-laptop.png, mitte-tablet.png)
 */
async function pruefen() {
  const TASTEN = {
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, PageUp: 33, PageDown: 34,
    Escape: 27, Tab: 9, Enter: 13, ' ': 32,
  };
  const stand = `(() => { const a = document.activeElement; const t = document.querySelector('.ueb-seitentitel .ueb-sr')?.textContent;
    return (a?.getAttribute('aria-label') ?? a?.textContent?.trim() ?? a?.tagName) + (document.querySelector('.ueb').dataset.modus === 'seiten' ? '  [Seite: ' + t + ']' : '')
      + (document.querySelector('.ueb.ueb-zu') ? '  [zu: ' + document.getElementById('ereignis').textContent + ']' : '')
      + (document.querySelector('.ueb-hinweis.ueb-da') ? '  [Hinweis: ' + document.querySelector('.ueb-hinweis').textContent + ']' : ''); })()`;
  async function folge(send, name, schritte) {
    console.log(`\n${name}\n  Start: ${await evaluate(send, stand)}`);
    for (const s of schritte) {
      const [key, mod] = s.split('+').reverse(), vk = TASTEN[key];
      const modifiers = mod === 'Shift' ? 8 : mod === 'Ctrl' ? 2 : 0;
      const text = key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined;
      await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers, text });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers });
      await sleep(350);
      console.log(`  ${s.padEnd(10)} → ${await evaluate(send, stand)}`);
    }
  }
  for (const [format, f] of [['desktop', FORMATE.desktop], ['hoch', FORMATE.hoch]]) {
    const { send, logs, close } = await startChrome({ width: f.width, height: f.height });
    try {
      await emulate(send, f);
      await bereit(send, `${probe}?stand=mitte`);
      await folge(send, `${format}: Pfeile, Pos1/Ende, Bild, Strg+Ende`, format === 'desktop'
        ? ['ArrowRight', 'End', 'ArrowRight', 'ArrowUp', 'ArrowUp', 'Home', 'ArrowLeft', 'PageDown', 'Ctrl+End', 'Ctrl+Home', 'ArrowUp']
        : ['End', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowUp', 'PageUp', 'Ctrl+Home', 'ArrowLeft']);
      await bereit(send, `${probe}?stand=mitte`);
      await folge(send, `${format}: Tab bleibt im Dialog`, ['Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab']);
      await bereit(send, `${probe}?stand=mitte`);
      await folge(send, `${format}: gesperrt, wiederholen, schliessen`, ['ArrowRight', ' ', 'ArrowLeft', 'ArrowLeft', 'Enter']);
      await bereit(send, `${probe}?stand=mitte`);
      await folge(send, `${format}: Escape`, ['Escape']);
      const fehler = logs.filter((l) => /\[exception\]|\[error\]/.test(l));
      if (fehler.length) console.log('Konsole:\n  ' + fehler.join('\n  '));
    } finally {
      await close();
    }
  }
  for (const [format, f] of [['laptop', { width: 1280, height: 720, dpr: 1 }], ['tablet', { width: 1024, height: 768, dpr: 1 }]]) {
    const { send, close } = await startChrome({ width: f.width, height: f.height });
    try {
      await emulate(send, f);
      for (const s of ['mitte', 'dorf']) {
        await bereit(send, `${probe}?stand=${s}`);
        await evaluate(send, 'document.activeElement.blur()');
        await bild(send, `${s}-${format}.png`);
      }
    } finally {
      await close();
    }
  }
}
if (nur === 'pruefen') { await pruefen(); process.exit(0); }

for (const format of nur ? [nur] : Object.keys(FORMATE)) {
  const f = FORMATE[format];
  const { send, logs, close } = await startChrome({ width: f.width, height: f.height });
  try {
    await emulate(send, f);
    for (const s of STAENDE) {
      await bereit(send, `${probe}?stand=${s}`);
      await evaluate(send, 'document.activeElement.blur()'); // wie nach Klick oder Tippen: ohne Fokusring
      await bild(send, `${s}-${format}.png`);
    }
    if (format === 'desktop') {
      // Tastatur: von der offenen Kachel (Wüste 3) eine Reihe hinauf (Meer 3), dann eine nach rechts (Meer 4)
      await bereit(send, `${probe}?stand=mitte`);
      await taste(send, 'ArrowUp', 'ArrowUp', 38);
      await taste(send, 'ArrowRight', 'ArrowRight', 39);
      await bild(send, 'fokus-desktop.png');
    }
    if (format === 'hoch') {
      await bereit(send, `${probe}?stand=dorf&welt=dorf`);
      await evaluate(send, 'document.activeElement.blur()');
      await bild(send, 'dorf-dorf-hoch.png');
      // Wischen: auf den Kacheln nach links ziehen, mitten in der Bewegung aufnehmen, dann loslassen
      await bereit(send, `${probe}?stand=mitte`);
      await evaluate(send, 'document.activeElement.blur()');
      const p = await mitte(send, '.ueb-kacheln');
      const zug = (type, x) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: p.y }] });
      await zug('touchStart', p.x + 120);
      for (let x = p.x + 110; x >= p.x - 40; x -= 15) { await zug('touchMove', x); await sleep(16); }
      await sleep(150);
      await bild(send, 'wischen-hoch.png');
      await zug('touchEnd');
      await sleep(600);
      console.log('  nach dem Loslassen:', await evaluate(send, `document.querySelector('.ueb-seitentitel .ueb-sr').textContent`));
      // gesperrte Kachel antippen: Hinweis
      const g = await mitte(send, '.ueb-gesperrt');
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: g.x, y: g.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await sleep(500);
      await bild(send, 'gesperrt-hoch.png');
      console.log('  Hinweis:', await evaluate(send, `document.querySelector('.ueb-hinweis').textContent`));
    }
    const fehler = logs.filter((l) => /\[exception\]|\[error\]/.test(l));
    if (fehler.length) console.log('Konsole:\n  ' + fehler.join('\n  '));
  } finally {
    await close();
  }
}
