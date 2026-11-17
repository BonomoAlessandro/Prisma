// Module unter src/, die die Seite an ihrer Stelle einsetzt (Ticket 03 von .scratch/umbau/).
//
// Die Spiellogik (src/logik.js, bis dahin der Bereich LOGIC in index.html), der Zufall (src/zufall.js) und der Hall
// (src/hall.js) sind ES-Module: Tests und Werkzeuge importieren sie. index.html hat aber noch klassische Skripte mit
// gemeinsamem globalem Bereich, und ein Modul liefe erst nach ihnen. Darum steht in index.html an ihrer Stelle eine
// Marke auf einer eigenen Zeile, «/* MODUL src/logik.js */», und vite.config.mjs setzt dort beim Build und im
// Dev-Server den Text des Moduls ein (setzeEin), Zeichen für Zeichen, nur ohne seine import-Zeilen und ohne den
// export-Block am Schluss. Im Spiel gelten die Namen so global wie vorher, und es läuft derselbe Code wie vorher.
//
// Darum die Form der Module: am Anfang höchstens Zeilen «import { a, b } from './x.js';» (x.js steht dann in der Seite
// weiter oben, seine Namen sind dort global), danach der Code, am Schluss genau ein «export { … };» mit den Namen
// seiner obersten Ebene. Kein anderes import oder export (zerlege prüft das; tests/logic.test.mjs prüft, dass der
// export-Block alle Deklarationen der obersten Ebene nennt).
//
// - zerlege(text, datei): { importe: [{ namen, von }], code (der Text für die Seite), namen (der export-Block) }.
// - setzeEin(html, lies): html mit den Modulen an ihren Marken; lies(pfad) liefert den Text (Vorgabe: aus der Datei).
// - ausText(text, datei, globale): die Exporte eines Moduls aus einem Text, etwa einer geänderten Spiellogik mit
//   weiteren Leveln (die importierten Namen in globale), ausgeführt wie früher die Tests den Bereich LOGIC ausführten.
// - mitLogik(seite, logik): die gebaute Seite (dist/index.html) mit einer anderen Spiellogik (KI-Tester: Kandidaten).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './spielserver.mjs';

export const LOGIK = join(root, 'src', 'logik.js');
/** Die Marke eines Moduls in index.html: eine eigene Zeile «/* MODUL src/….js *\/». */
export const MARKE = /^\/\* MODUL (src\/[\w/.-]+\.js) \*\/(?=\r?$)/gm;
const IMPORT = /^import \{ ([\w$, ]+) \} from '\.\/([\w.-]+\.js)';\r?\n/;
const EXPORT = /\r?\nexport \{([\w$,\s]*)\};\r?\n?$/;

/** Zerlegt den Text eines Moduls (siehe Kopf); wirft, wenn er nicht die erwartete Form hat. */
export function zerlege(text, datei) {
  const importe = [];
  let code = text, m;
  while (true) {
    // vor einem import nur Kommentarzeilen und leere Zeilen
    const kopf = code.match(/^(?:(?:\/\/[^\n]*)?\r?\n)*/)[0];
    m = code.slice(kopf.length).match(IMPORT);
    if (!m) break;
    importe.push({ namen: m[1].split(',').map(n => n.trim()).filter(Boolean), von: `src/${m[2]}` });
    code = code.slice(0, kopf.length) + code.slice(kopf.length + m[0].length);
  }
  m = code.match(EXPORT);
  if (!m) throw new Error(`${datei}: am Schluss fehlt der export-Block «export { … };»`);
  const namen = m[1].split(',').map(n => n.trim()).filter(Boolean);
  code = code.slice(0, m.index).replace(/\r?\n$/, '');
  const fremd = code.match(/^(import|export)\b[^\n]*/m);
  if (fremd) throw new Error(`${datei}: «${fremd[0].trim()}» – nur import-Zeilen am Anfang und ein export-Block am Schluss`);
  return { importe, code, namen };
}

/** index.html mit den Modulen an ihren Marken (siehe Kopf); ein Modul darf nur importieren, was weiter oben steht. */
export function setzeEin(html, lies = (pfad) => readFileSync(join(root, pfad), 'utf8')) {
  const gesetzt = new Map();
  return html.replace(MARKE, (_, pfad) => {
    if (gesetzt.has(pfad)) throw new Error(`index.html: ${pfad} zweimal eingesetzt`);
    const { importe, code, namen } = zerlege(lies(pfad), pfad);
    for (const i of importe) {
      const fehlt = i.namen.filter(n => !gesetzt.get(i.von)?.includes(n));
      if (fehlt.length) throw new Error(`${pfad}: ${fehlt.join(', ')} aus ${i.von} steht in index.html nicht weiter oben`);
    }
    gesetzt.set(pfad, namen);
    return code;
  });
}

/** Die Exporte eines Moduls aus seinem Text (siehe Kopf); globale: die Werte der importierten Namen. */
export function ausText(text, datei, globale = {}) {
  const { importe, code, namen } = zerlege(text, datei);
  const fehlt = importe.flatMap(i => i.namen).filter(n => !(n in globale));
  if (fehlt.length) throw new Error(`${datei}: ${fehlt.join(', ')} fehlt in globale`);
  return new Function(...Object.keys(globale), `${code}\nreturn { ${namen.join(', ')} };`)(...Object.values(globale));
}

/** Die gebaute Seite mit einer anderen Spiellogik statt der aus src/logik.js (dieselbe Stelle, siehe Kopf). */
export function mitLogik(seite, logik) {
  const vorher = zerlege(readFileSync(LOGIK, 'utf8'), 'src/logik.js').code, a = seite.indexOf(vorher);
  if (a < 0 || seite.indexOf(vorher, a + 1) >= 0) throw new Error('Seite: die Spiellogik steht nicht genau einmal darin');
  return seite.slice(0, a) + zerlege(logik, 'Spiellogik').code + seite.slice(a + vorher.length);
}
