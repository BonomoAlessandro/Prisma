// Regeln der Levelliste (Ticket 15; Spec „Levelliste, Reihenfolge und Austausch“ und „Entscheide zu den Tests“,
// Nahtstelle 3), gemeinsam für tools/ordne-level.mjs, das Reihenfolge und Grade schreibt, und den Test
// tests/levelliste.test.mjs, der sie prüft:
// - Reihenfolge (ordne): Die Level stehen nach ihrer Schwierigkeit, bei gleichem Wert in der heutigen Reihenfolge
//   (beurteilung/heutige-reihenfolge.mjs). Verschiebungen bis MAX_WANDERN Plätze werden übernommen. Ein Level, das nach
//   der Formel weiter wandern würde, bleibt an seinem heutigen Platz und steht auf der Prüfliste der KI-Tester
//   (Ticket 16). Die übrigen füllen die freien Plätze in der Reihenfolge der Schwierigkeit; wanderte eines dabei
//   weiter, bleibt es ebenso stehen, bis keines mehr zu weit wandert (heute 56 Strahlenkranz).
// - Grade entlang der Reihenfolge (gradeEntlang): nach den Schwellen (beurteilung/grad.mjs). Ein Level, das an seinem
//   heutigen Platz bleibt, steht nicht nach seiner Schwierigkeit; es bekommt den Grad seines Abschnitts, also den des
//   letzten Levels davor, das nach der Formel steht. Ein Abschnitt beginnt beim ersten Level nach der Formel, das die
//   Schwelle erreicht. So sinkt der Grad nie, und ein Level am alten Platz zieht keine anderen mit.
// - Duldungsliste (levelliste.json, versioniert), nach Grund getrennt (GRUENDE): Level mit Ausschlussgrund, Level ab
//   „mittel“ ohne nötige Kernidee und Level ab „mittel“ unter dem Mindest-Spielwert. Die Liste wird nur kürzer: Sie
//   bleibt in jedem Grund eine Teilmenge der ursprünglichen Liste (urspruenglich). Dazu die Namen entfernter Level, die
//   nie wieder vergeben werden (entfernteNamen), und die Prüfliste für Ticket 16 (pruefliste).
// - Je 10 Level (eine Seite der Levelauswahl): Das Mittel der Schwierigkeit fällt um höchstens TOLERANZ_MITTEL Punkte,
//   und dieselbe Haupt-Kernidee kommt höchstens HAUPT_KERNIDEE_JE_10-mal vor, gezählt ohne die Level der
//   Duldungsliste (Entscheide des Nutzers vom 16.10.2026, Ticket 15).
import { readFileSync } from 'node:fs';
import { GRADE } from './beurteilung/index.mjs';
import { gradVon } from './beurteilung/grad.mjs';
import { MINDEST_SPIELWERT } from './beurteilung/spielwert.mjs';

/** Weiter wandert kein Level ohne die KI-Tester (Spec „KI-Tester“: Kleinere Abweichungen entscheidet die Formel). */
export const MAX_WANDERN = 10;
/** Je 10 Level darf das Mittel der Schwierigkeit um höchstens so viele Punkte fallen. */
export const TOLERANZ_MITTEL = 1;
/** Je 10 Level kommt dieselbe Haupt-Kernidee höchstens so oft vor, ohne die Level der Duldungsliste. */
export const HAUPT_KERNIDEE_JE_10 = 2;
export const DATEI = new URL('./levelliste.json', import.meta.url);

/**
 * Die Gründe der Duldungsliste, je { text, gilt(beurteilung, grad) }: Verletzt ein Level mit dieser Beurteilung (mit
 * seinem Grad beurteilt) und diesem Grad die Regel?
 */
export const GRUENDE = {
  ausschlussgrund: { text: 'Ausschlussgrund', gilt: (b) => b.ausschluesse.length > 0 },
  ohneKernidee: {
    text: 'ab „mittel“ ohne nötige Kernidee',
    gilt: (b, grad) => grad !== GRADE[0] && !b.hauptKernidee.begriff,
  },
  unterMindestSpielwert: {
    text: `ab „mittel“ unter dem Mindest-Spielwert ${MINDEST_SPIELWERT}`,
    gilt: (b, grad) => grad !== GRADE[0] && b.spielwert.wert < MINDEST_SPIELWERT,
  },
};

/** Die Daten der Levelliste aus levelliste.json: { duldung, urspruenglich, entfernteNamen, pruefliste }. */
export const ladeLevelliste = () => JSON.parse(readFileSync(DATEI, 'utf8'));

/**
 * Die Reihenfolge aus den Schwierigkeiten (werte[i]: Level auf dem heutigen Platz i + 1): { formel: Platz nach der
 * Formel, platz: neuer Platz, bleibt: Map Index → 'Formel' (Prüfliste) oder 'Reihenfolge' (warum es am heutigen Platz
 * bleibt) }, je Index, Plätze ab 1.
 */
export function ordne(werte) {
  const n = werte.length, nachWert = werte.map((_, i) => i).sort((i, j) => werte[i] - werte[j] || i - j);
  const formel = new Array(n);
  nachWert.forEach((i, r) => { formel[i] = r + 1; });
  const bleibt = new Map(nachWert.filter(i => Math.abs(formel[i] - (i + 1)) > MAX_WANDERN).map(i => [i, 'Formel']));
  for (;;) {
    const frei = [...Array(n).keys()].filter(i => !bleibt.has(i)), platz = new Array(n);
    for (const i of bleibt.keys()) platz[i] = i + 1;
    nachWert.filter(i => !bleibt.has(i)).forEach((i, k) => { platz[i] = frei[k] + 1; });
    const zuWeit = nachWert.filter(i => !bleibt.has(i) && Math.abs(platz[i] - (i + 1)) > MAX_WANDERN);
    if (!zuWeit.length) return { formel, platz, bleibt };
    for (const i of zuWeit) bleibt.set(i, 'Reihenfolge');
  }
}

/**
 * Die Grade entlang der Reihenfolge (folge: Indizes nach neuem Platz, werte und bleibt wie bei ordne): nach der
 * Schwelle; ein Level, das am heutigen Platz bleibt, mit dem Grad des letzten Levels davor, das nach der Formel steht
 * (ganz vorn mit dem des ersten). Rückgabe je Index.
 */
export function gradeEntlang(folge, werte, bleibt) {
  const grad = new Array(werte.length);
  let zuletzt = gradVon(werte[folge.find(i => !bleibt.has(i))]);
  for (const i of folge) {
    if (!bleibt.has(i)) zuletzt = gradVon(werte[i]);
    grad[i] = zuletzt;
  }
  return grad;
}

/** Je 10 Level, also je Seite der Levelauswahl (PAGE_SIZE in index.html). */
export const zehner = (reihe) => Array.from({ length: Math.ceil(reihe.length / 10) },
  (_, k) => reihe.slice(10 * k, 10 * k + 10));
