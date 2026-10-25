// Regeln der Würfel-Level (.scratch/wuerfel-500/, Ticket 01), gemeinsam für tools/ordne-wuerfel.mjs, das Reihenfolge und
// Grade der Würfel-Level schreibt, tools/wuerfel.mjs (Kandidaten wählen) und den Test tests/wuerfelliste.test.mjs:
// - Eine eigene Reihenfolge neben der flachen, mit denselben Regeln (reihenfolge in levelliste.mjs): Es gibt keinen
//   Bestand, jedes Würfel-Level steht wie eines des Ausbaus nach der Formel (fuegeEin in eine leere Folge, also nach der
//   Schwierigkeit), sein Grad folgt der Schwelle und sinkt darum nie. Die eigene Korrektur der KI-Tester gilt vom Platz
//   der Formel aus (höchstens MAX_SHIFT Plätze, nie über eine Gradgrenze), die Urteile kommen aus den Läufen der
//   Gruppen wuerfel-<Gruppe>… (zaehlendeWuerfelUrteile in levelliste.mjs).
//   Dann die Häufungsregel wie im Ausbau: dieselbe Haupt-Kernidee höchstens HAUPT_KERNIDEE_JE_10-mal je 10 Level, unter
//   Leveln ab „mittel“ HAUPT_KERNIDEE_JE_10_OBEN-mal, ein Level rückt dafür höchstens MAX_ENTZERREN_AUSBAU Plätze; das
//   Mittel der Schwierigkeit je 10 Level fällt um höchstens TOLERANZ_MITTEL.
// - Keine Duldungsliste: Jedes Würfel-Level erfüllt jede Regel (verletzt), sonst schreibt ordne-wuerfel.mjs nicht.
// - Jedes Würfel-Level kommt aus dem Generator und hat ein zählendes Urteil aus einem Lauf wuerfel-…, das es nicht
//   ablehnt. Die handgebauten Aufzug und Kern hat der Nutzer am 25.10.2026 aus dem Spiel genommen (nur noch Testdaten,
//   tests/wuerfel-handgebaut.mjs).
// - Verteilung der Grade (Spec, Tabelle): ZIEL nach GRUPPEN Gruppen, bestandNach(k) nach der Gruppe k.
import { GRADE } from './beurteilung/index.mjs';
import { GRUENDE, ZAEHLENDE_WUERFEL_LAEUFE, reihenfolge } from './levelliste.mjs';
import { L } from './solver.mjs';

/** Der Würfel aller Würfel-Level (Spec: 7 × 7 × 7). */
export const WUERFEL = { dim: 3, size: 7 };
/** Die Verteilung der Grade der neuen Würfel-Level am Ende (Spec, Entscheid des Nutzers vom 24.10.2026). */
export const ZIEL = { leicht: 85, mittel: 265, schwer: 105, 'sehr schwer': 45 };
/** So viele Gruppen zu je 25 Leveln (Tickets 02–21). */
export const GRUPPEN = 20;

/**
 * Der Bestand der neuen Würfel-Level je Grad nach der Gruppe k (0 = vor der ersten): je Grad der Anteil k / GRUPPEN
 * von ZIEL, auf ganze Level nach den grössten Resten verteilt, bei gleichem Rest der leichtere Grad zuerst (Tabelle
 * der Spec).
 */
export function bestandNach(k) {
  const anteil = GRADE.map(g => ZIEL[g] * k / GRUPPEN), ganz = anteil.map(Math.floor);
  const summe = Math.round(GRADE.reduce((s, g) => s + ZIEL[g], 0) * k / GRUPPEN);
  const reste = anteil.map((x, j) => [x - ganz[j], j]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const fehlen = summe - ganz.reduce((s, x) => s + x, 0);
  for (let r = 0; r < fehlen; r++) ganz[reste[r][1]]++;
  return Object.fromEntries(GRADE.map((g, j) => [g, ganz[j]]));
}

/** Die Würfel-Level im Spiel (LEVELS_3D, in ihrer Reihenfolge). */
export const imSpiel = () => L.LEVELS_3D;

/**
 * Reihenfolge und Grade der Würfel-Level (siehe Kopf). werte[i], namen[i], haupt[i]: Schwierigkeit, Name und
 * Haupt-Kernidee (oder null) des Levels i; kandidat[i]: der Name bei den KI-Testern (kandidatName in leveldaten.mjs),
 * auch nach dem Einordnen, denn die Urteile tragen ihn; urteile: die zählenden Würfel-Einträge des Protokolls (zaehlendeWuerfelUrteile; andere Läufe übergeht
 * die Funktion). Rückgabe: wie reihenfolge in levelliste.mjs (folge, grad, formel, ki, zuege, offen …).
 */
export function wuerfelReihenfolge(werte, namen, haupt, { kandidat = [], urteile = [] } = {}) {
  const n = werte.length;
  return reihenfolge(werte, namen, urteile.filter(e => ZAEHLENDE_WUERFEL_LAEUFE.test(e.lauf)), {
    haupt, heute: Array(n).fill(null), ausbau: Array(n).fill(true), kandidat: namen.map((_, i) => kandidat[i] ?? null),
    ausbauLaeufe: ZAEHLENDE_WUERFEL_LAEUFE,
    // bei gleichem Wert der Abdruck (kandidatName), nicht der Platz in index.html: sonst kippen zwei gleich schwere
    // Level mit Urteil bei jedem Ordnen hin und her
    gleichstand: namen.map((x, i) => kandidat[i] ?? x),
    // gegen Häufungen auch Plätze tauschen (entzerre): Mit 150 Leveln und mehr steht an den Seitengrenzen oft dieselbe
    // Haupt-Kernidee, dann löst das Rücken nichts (Ticket 08)
    tauschen: true,
  });
}

/**
 * Die Regeln, die ein Würfel-Level verletzt, als Schlüssel der GRUENDE in levelliste.mjs (leer: keine), mit dieser
 * Beurteilung (mit seinem Grad beurteilt), diesem Grad und diesem Urteil der KI-Tester (aus reihenfolge, oder
 * undefined): Ausschlussgrund, ab „mittel“ ohne nötige Kernidee oder unter dem Mindest-Spielwert, von beiden KI-Testern
 * abgelehnt. Im flachen Spiel stünde ein solches Level auf der Duldungsliste; im Würfel kommt es nicht ins Spiel.
 */
export const verletzt = (b, grad, ki) => Object.keys(GRUENDE).filter(g => GRUENDE[g].gilt(b, grad, ki));
