// Die Module des Spiels unter src/ für Tests und Werkzeuge (Tickets 03 und 04 von .scratch/umbau/).
//
// Seit Ticket 04 ist das ganze Spiel ES-Module (Einstieg src/main.ts, die Teile unter src/seite/), index.html ist nur
// noch das Gerüst. Tests, die Code des Spiels als Text lesen (eine Konstante, ein Objekt, die Arten der Bretter), lesen
// ihn darum aus allen Modulen zusammen (spielQuelltext).
//
// Die Spiellogik (src/logik.js) hat eine feste Form, damit Tests und Werkzeuge sie auch als Text ausführen können
// (etwa mit weiteren Leveln): am Anfang höchstens Zeilen «import { a, b } from './x.js';», danach der Code, am Schluss
// genau ein «export { … };» mit den Namen seiner obersten Ebene. Kein anderes import oder export (zerlege prüft das;
// tests/logic.test.mjs prüft, dass der export-Block alle Deklarationen der obersten Ebene nennt). Ebenso src/zufall.js
// und src/hall.js.
//
// - zerlege(text, datei): { importe: [{ namen, von }], code (der Text ohne import-Zeilen und export-Block), namen (der
//   export-Block) }.
// - ausText(text, datei, globale): die Exporte eines Moduls aus einem Text, etwa einer geänderten Spiellogik mit
//   weiteren Leveln (die importierten Namen in globale), ausgeführt wie früher die Tests den Bereich LOGIC ausführten.
// - spielQuelltext(): index.html und alle Module unter src/ (.js, .ts) als ein Text, je Datei mit einer Kopfzeile
//   «// DATEI <pfad>».
// - module(): die Pfade dieser Module (relativ zum Wurzelordner, mit „/“), sortiert.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './spielserver.mjs';

export const LOGIK = join(root, 'src', 'logik.js');
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

/** Die Exporte eines Moduls aus seinem Text (siehe Kopf); globale: die Werte der importierten Namen. */
export function ausText(text, datei, globale = {}) {
  const { importe, code, namen } = zerlege(text, datei);
  const fehlt = importe.flatMap(i => i.namen).filter(n => !(n in globale));
  if (fehlt.length) throw new Error(`${datei}: ${fehlt.join(', ')} fehlt in globale`);
  return new Function(...Object.keys(globale), `${code}\nreturn { ${namen.join(', ')} };`)(...Object.values(globale));
}

/** Die Module des Spiels unter src/ (siehe Kopf). */
export function module(ordner = 'src') {
  return readdirSync(join(root, ordner), { withFileTypes: true }).flatMap((e) => {
    const pfad = `${ordner}/${e.name}`;
    if (e.isDirectory()) return module(pfad);
    return /\.(js|ts)$/.test(e.name) ? [pfad] : [];
  }).sort();
}

/** index.html und alle Module als ein Text (siehe Kopf). */
export function spielQuelltext() {
  return ['index.html', ...module()].map((p) => `// DATEI ${p}\n${readFileSync(join(root, p), 'utf8')}`).join('\n');
}
