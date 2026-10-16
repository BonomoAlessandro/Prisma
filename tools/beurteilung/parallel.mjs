// Beurteilt viele Level auf mehreren Threads (worker_threads), für Tests und Messskripte. Jeder Thread lädt die
// Beurteilung selbst und holt sich das nächste Level, sobald er frei ist; die Ergebnisse stehen in der Reihenfolge der
// Aufträge. beurteile ist rein (dasselbe Level, dasselbe Ergebnis, ohne Zustand zwischen zwei Aufrufen), darum ist das
// Ergebnis bitgleich zu dem auf einem Thread, gleich wie die Arbeit verteilt wird.
// - Threads: Vorgabe 4, so viele Kerne lässt der Deckel von tools/leise.sh (20 % der Maschine). Die Umgebungsvariable
//   BEURTEILUNG_THREADS übersteuert; 1 beurteilt ohne Worker im eigenen Thread.
// - Level und Beurteilung gehen per structured clone über die Thread-Grenze. Beides sind reine Daten (Objekte, Listen,
//   Texte, Zahlen, Wahrheitswerte, null; keine Funktionen, Klassen, Map oder Set, keine Verweise in die Leveldaten).
//   Sie kommen unverändert an, auch wo eine Beurteilung dasselbe Objekt an zwei Stellen hat (etwa Teile eines Funds
//   in kernideen und hauptKernidee): Jede Beurteilung geht als eine Nachricht.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { beurteile } from './index.mjs';

const ARBEITER = 'beurteilung/parallel.mjs';

/** Die Zahl der Threads: BEURTEILUNG_THREADS, sonst 4. */
function threads() {
  const n = process.env.BEURTEILUNG_THREADS ?? '';
  if (n === '') return 4;
  if (!/^[1-9]\d*$/.test(n)) throw new Error(`BEURTEILUNG_THREADS=${n}: erwartet eine ganze Zahl ab 1`);
  return Number(n);
}

/**
 * Beurteilt die Aufträge [{ level, opts }] wie beurteile(level, opts), verteilt auf n Threads (Vorgabe threads()).
 * Rückgabe: die Beurteilungen in der Reihenfolge der Aufträge. Wirft ein Auftrag, scheitert das Ganze mit seinem
 * Fehler.
 */
export async function beurteileAlle(auftraege, { n = threads() } = {}) {
  n = Math.min(n, auftraege.length);
  if (n <= 1) return auftraege.map(({ level, opts }) => beurteile(level, opts));
  const out = new Array(auftraege.length);
  let naechster = 0;
  const name = (i) => `Level "${auftraege[i].level.name}"`;
  const arbeite = (w) => new Promise((fertig, scheitert) => {
    const gib = () => {
      if (naechster === auftraege.length) return fertig();
      const i = naechster++;
      try {
        w.postMessage({ i, level: auftraege[i].level, opts: auftraege[i].opts });
      } catch (e) { // etwa ein Level, das sich nicht klonen lässt
        scheitert(new Error(`${name(i)}: ${e.message}`));
      }
    };
    w.on('message', ({ i, beurteilung, fehler }) => {
      if (!fehler) { out[i] = beurteilung; gib(); return; }
      const e = new Error(fehler.message.includes(name(i)) ? fehler.message : `${name(i)}: ${fehler.message}`);
      e.stack += `\nim Thread: ${fehler.stack}`;
      scheitert(e);
    });
    w.on('error', scheitert);
    w.on('exit', code => scheitert(new Error(`Thread der Beurteilung beendet (Code ${code})`)));
    gib();
  });
  const worker = [];
  try {
    // Im try angelegt: Scheitert ein Thread schon dabei, enden die übrigen trotzdem.
    while (worker.length < n) worker.push(new Worker(new URL(import.meta.url), { workerData: ARBEITER }));
    await Promise.all(worker.map(arbeite));
  } finally {
    await Promise.all(worker.map(w => w.terminate()));
  }
  return out;
}

// Im Thread: Aufträge beurteilen, bis der Hauptthread ihn beendet.
if (!isMainThread && workerData === ARBEITER) {
  parentPort.on('message', ({ i, level, opts }) => {
    try {
      parentPort.postMessage({ i, beurteilung: beurteile(level, opts) });
    } catch (e) { // auch eine Beurteilung, die sich nicht klonen liesse
      parentPort.postMessage({ i, fehler: { message: String(e?.message ?? e), stack: String(e?.stack ?? e) } });
    }
  });
}
