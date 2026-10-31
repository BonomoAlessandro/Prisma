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
// - Seit 26.10.2026 (.scratch/wuerfel-7x7x5/, Dauerregel des Nutzers): jedes Würfel-Level im Quader 7 × 7 × 5
//   (WUERFEL = QUADER) und nach der Ebenen-Regel (ebenenVerletzt); keine Ausnahme.
// - Seit dem Vorrat (Spec .scratch/noa-geschichte/, Ticket 02): Die Regeln gelten für die Würfel-Level aus Spiel und
//   Vorrat, in der Folge des gemeinsamen Laders (ALLE in lader.mjs, wie nach dem Zurückholen aller).
import { GRADE } from './beurteilung/index.mjs';
import { GRUENDE, ZAEHLENDE_WUERFEL_LAEUFE, reihenfolge } from './levelliste.mjs';
import { L, keyOf, setRot } from './solver.mjs';
import { ALLE } from './lader.mjs';

/**
 * Der Würfel aller Würfel-Level nach der Dauerregel des Nutzers vom 26.10.2026 (.scratch/wuerfel-7x7x5/): Grundfläche
 * 7 × 7, Höhe 5.
 */
export const QUADER = Object.freeze({ dim: 3, size: 7, height: 5 });
/**
 * Der Würfel aller Würfel-Level: seit Ticket 03 der Spec .scratch/wuerfel-7x7x5/ der Quader (bis 26.10.2026 7 × 7 × 7;
 * height wie in den Leveldaten, ohne Angabe size).
 */
export const WUERFEL = QUADER;
/** Hat das Level den Würfel WUERFEL (Grundfläche und Höhe)? */
export const istWuerfel = (level) => level.dim === WUERFEL.dim && level.size === WUERFEL.size
  && (level.height || level.size) === (WUERFEL.height || WUERFEL.size);
/** Der Würfel WUERFEL als Text, etwa „7 × 7 × 7“ (Breite × Tiefe × Höhe). */
export const WUERFEL_TEXT = `${WUERFEL.size} × ${WUERFEL.size} × ${WUERFEL.height || WUERFEL.size}`;
/** Die Verteilung der Grade der neuen Würfel-Level am Ende (Spec, Entscheid des Nutzers vom 24.10.2026). */
export const ZIEL = { leicht: 85, mittel: 265, schwer: 105, 'sehr schwer': 45 };
/**
 * So viele Gruppen zu je 25 Leveln seit dem Umbau auf 7 × 7 × 5: 9 bis wieder 300 (Tickets 04–12 der Spec
 * wuerfel-7x7x5), dann 8 bis 500 (Tickets 14–21 der Spec wuerfel-500).
 */
export const GRUPPEN = 17;
/** Der Bestand nach Ticket 03 der Spec wuerfel-7x7x5: die 75 Würfel-Level, die im Quader die Ebenen-Regel erfüllen. */
export const BEHALTEN = { leicht: 17, mittel: 43, schwer: 10, 'sehr schwer': 5 };
/** So viele Gruppen bis wieder 300 (Tickets 04–12 der Spec wuerfel-7x7x5). */
const BIS_300 = 9;

/**
 * Je Grad von vorher aus der Anteil k / n von (nachher − vorher), nach den grössten Resten, bei gleichem der leichtere
 * (ganzzahlig gerechnet: Mit Brüchen kippten gleiche Reste je nach Rundung, etwa 85 · 0,7 gegen 105 · 0,7).
 */
function anteilig(vorher, nachher, k, n) {
  const mal = GRADE.map(g => (nachher[g] - vorher[g]) * k), ganz = mal.map(x => Math.floor(x / n));
  const summe = Math.round(mal.reduce((s, x) => s + x, 0) / n);
  const reste = mal.map((x, j) => [x - ganz[j] * n, j]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  const fehlen = summe - ganz.reduce((s, x) => s + x, 0);
  for (let r = 0; r < fehlen; r++) ganz[reste[r][1]]++;
  return Object.fromEntries(GRADE.map((g, j) => [g, vorher[g] + ganz[j]]));
}
const NULL = Object.fromEntries(GRADE.map(g => [g, 0]));
/** Der Bestand nach der Gruppe k der Spec wuerfel-500 (20 Gruppen von 0 bis ZIEL, Tabelle dort). */
export const bestand500 = (k) => anteilig(NULL, ZIEL, k, 20);

/**
 * Der Bestand der Würfel-Level je Grad nach der Gruppe k (0 = vor der ersten, nach Ticket 03 der Spec wuerfel-7x7x5):
 * bis Gruppe 9 von BEHALTEN anteilig bis zum Bestand bei 300 der Spec wuerfel-500 (Tabelle der Spec wuerfel-7x7x5),
 * danach wie dort ab Gruppe 13 (Gruppe 10 hier ist Gruppe 13 dort).
 */
export function bestandNach(k) {
  return k <= BIS_300 ? anteilig(BEHALTEN, bestand500(12), k, BIS_300) : bestand500(k + 3);
}

/**
 * Ebenen-Regel (.scratch/wuerfel-7x7x5/, Dauerregel des Nutzers vom 26.10.2026, gilt für jedes Würfel-Level, ausser er
 * sagt etwas anderes): In der Lösung trifft der Strahl Elemente auf mindestens MIN_EBENEN Ebenen y (Quellen zählen
 * immer, ein Element, das kein Strahl berührt, nie: sonst genügte ein Zierstück), und das unterste Element steht auf
 * der Ebene 0 (kein Level schwebt).
 */
export const MIN_EBENEN = 3;

/** Die Ebenen y (aufsteigend) der Elemente, die der Strahl in der Lösungsstellung trifft, samt den Quellen. */
export function getroffeneEbenen(level) {
  const board = L.createBoard({ ...level, elements: level.elements.map(e => ({ ...e })) });
  for (const el of board.elements) if (keyOf(el) in level.solution) setRot(el, level.solution[keyOf(el)]);
  const n = board.size, ids = new Set(board.elements.filter(e => e.type === 'source').map(e => e.id));
  for (const ev of L.traceBeams(board).events) {
    if (ev.element !== undefined) ids.add(ev.element);
    else if (ev.target !== undefined) ids.add(ev.target);
    else if (ev.kind === 'reflect') ids.add(board.grid[(ev.y * n + ev.z) * n + ev.x].id);
  }
  return [...new Set(board.elements.filter(e => ids.has(e.id)).map(e => e.y))].sort((a, b) => a - b);
}

/**
 * Was ein Würfel-Level an der Ebenen-Regel verletzt, als Texte (leer: nichts): zu wenige getroffene Ebenen, unterstes
 * Element nicht am Boden.
 */
export function ebenenVerletzt(level) {
  const ebenen = getroffeneEbenen(level), boden = Math.min(...level.elements.map(e => e.y));
  return [...(ebenen.length < MIN_EBENEN ? [`trifft nur ${ebenen.length} Ebene(n) (${ebenen.join(', ')}), mindestens ${MIN_EBENEN}`] : []),
    ...(boden > 0 ? [`schwebt: unterstes Element auf der Ebene ${boden}`] : [])];
}

/**
 * Das Level um tief Ebenen gesenkt, im Quader QUADER (Elemente und Lösung): für Level aus dem Würfel 7 × 7 × 7, deren
 * Elemente in 5 Ebenen passen. Die Lösung bleibt dieselbe, über der obersten Ebene mit Elementen ist nur leerer Raum.
 */
export function senke(level, tief) {
  const zelle = (k) => { const [x, y, z] = k.split(',').map(Number); return `${x},${y - tief},${z}`; };
  return { ...level, ...QUADER, elements: level.elements.map(e => ({ ...e, y: e.y - tief })),
    solution: Object.fromEntries(Object.entries(level.solution).map(([k, v]) => [zelle(k), v])) };
}

/**
 * Die Würfel-Level aus Spiel und Vorrat (ALLE im Lader), in ihrer Reihenfolge; der Name stammt aus der Zeit ohne
 * Vorrat.
 */
export const imSpiel = () => ALLE.LEVELS_3D;

/**
 * Würfel-Level unter „mittel“, für die die Häufungsregel wie ab „mittel“ zählt (HAUPT_KERNIDEE_JE_10_OBEN): Stockwerk
 * ist mit 300 Würfel-Leveln das letzte leichte (Platz 51) und steht mit Palisade und Taubenschlag (mittel, alle drei
 * Sammelstelle) auf Seite 6; die drei waren schon im Spiel und sind nur gerückt (Entscheid des Nutzers vom 26.10.2026,
 * Ticket 13: diese eine Häufung an der Grenze leicht/mittel dulden). Seit dem Umbau auf 7 × 7 × 5 (.scratch/wuerfel-7x7x5/,
 * Ticket 04) steht Stockwerk nicht mehr dort, die Häufung gibt es nicht mehr: leer. Der Mechanismus (obenAuch in
 * levelliste.mjs) bleibt für einen ähnlichen Fall.
 */
export const GRENZ_DULDUNG = [];

/**
 * Reihenfolge und Grade der Würfel-Level (siehe Kopf). werte[i], namen[i], haupt[i]: Schwierigkeit, Name und
 * Haupt-Kernidee (oder null) des Levels i; kandidat[i]: der Name bei den KI-Testern (kandidatName in leveldaten.mjs),
 * auch nach dem Einordnen, denn die Urteile tragen ihn; urteile: die zählenden Würfel-Einträge des Protokolls (zaehlendeWuerfelUrteile; andere Läufe übergeht
 * die Funktion); obenAuch: die Namen der Grenz-Duldung (Vorgabe GRENZ_DULDUNG, anders nur im Test). Rückgabe: wie reihenfolge in levelliste.mjs (folge, grad, formel, ki, zuege, offen …).
 */
export function wuerfelReihenfolge(werte, namen, haupt, { kandidat = [], urteile = [], obenAuch = GRENZ_DULDUNG } = {}) {
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
    // jede Korrektur der KI-Tester auf einmal an ihren Zielplatz (korrigiereNachZiel, Review Ticket 10 im Quader)
    nachZiel: true,
    obenAuch,
  });
}

/**
 * Die Regeln, die ein Würfel-Level verletzt, als Schlüssel der GRUENDE in levelliste.mjs (leer: keine), mit dieser
 * Beurteilung (mit seinem Grad beurteilt), diesem Grad und diesem Urteil der KI-Tester (aus reihenfolge, oder
 * undefined): Ausschlussgrund, ab „mittel“ ohne nötige Kernidee oder unter dem Mindest-Spielwert, von beiden KI-Testern
 * abgelehnt. Im flachen Spiel stünde ein solches Level auf der Duldungsliste; im Würfel kommt es nicht ins Spiel.
 */
export const verletzt = (b, grad, ki) => Object.keys(GRUENDE).filter(g => GRUENDE[g].gilt(b, grad, ki));
