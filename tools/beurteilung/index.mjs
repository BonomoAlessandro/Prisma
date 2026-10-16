// Beurteilung eines Levels (Spec „Beurteilung“, ADR 0002): ein Modul mit einem Einstieg, beurteile(level). Werkzeuge
// und Tests beurteilen Level nur darüber. Das Feld kennt die Beurteilung nur über die Feldform (feldform.mjs), gemessen
// wird in der Lösungsstellung (loesungsstellung.mjs).
//
// Aufbau:
// - Jede Regel liegt in einer eigenen Datei: mischziele.mjs, schliessen.mjs, je Ausschlussgrund eine in ausschluesse/, je
//   Kernidee eine in kernideen/, haupt-kernidee.mjs, dazu schwierigkeit.mjs und spielwert.mjs. regeln.mjs registriert sie,
//   je Regel eine Zeile.
// - Eine Regel ist der Standard-Export ihrer Datei, { teil, begriff, beurteile(ctx) }:
//   - teil: der Teil der Ausgabe, den sie liefert (ein Schlüssel von TEILE).
//   - begriff: bei Ausschlussgründen und Kernideen ihr Glossarbegriff. beurteile gibt dann die Funde zurück, je
//     mindestens { begruendung } (leer: nichts gefunden); die Beurteilung ergänzt den Begriff.
//   - Ohne begriff gibt beurteile den Wert des Teils zurück.
//   - teuer: true bei einer Regel, die lange rechnet (etwa mit der Suche ohne Abschneiden, suche.mjs).
// - ctx = { level, feldform, grad, merke(schluessel, rechne) }. merke rechnet einmal je Beurteilung, was mehrere Regeln
//   brauchen; Schlüssel ist die rechnende Funktion selbst (siehe loesungsstellung.mjs). Braucht eine Regel das Ergebnis
//   einer anderen, etwa Zerfall die Mischziele, ruft sie deren Funktion mit ctx auf; eine Regel, deren Ergebnis andere
//   brauchen, rechnet darum selbst über merke (wie mischziele.mjs).
import { feldformVon } from './feldform.mjs';
import * as registriert from './regeln.mjs';

/**
 * Teile der Ausgabe mit ihren Glossarbegriffen, in der Reihenfolge der Spec; Schliessen steht als Grundlage von
 * Schwierigkeit und Spielwert dahinter, die Haupt-Kernidee (eine der Kernideen) trägt den Begriff Kernidee. Ein Teil hat
 * einen Wert (ein Begriff) oder Funde je Begriff (eine Liste, Reihenfolge wie im Glossar).
 */
export const TEILE = {
  schwierigkeit: 'Schwierigkeit',
  spielwert: 'Spielwert',
  schliessen: 'Schliessen',
  kernideen: ['Mischziel aus zwei Quellen', 'Abschalten', 'Farben abzählen', 'Sammelstelle', 'Falle', 'Lockvogel'],
  hauptKernidee: 'Kernidee',
  mischziele: 'Mischziel',
  ausschluesse: ['Probieren', 'Füllteil', 'Scheinmischung', 'Zerfall', 'Knäuel'],
};
export const GRADE = ['leicht', 'mittel', 'schwer', 'sehr schwer'];

const begriffe = (teil) => [TEILE[teil]].flat();
const nameOf = (regel) => regel.begriff ?? TEILE[regel.teil];
const REGELN = Object.values(registriert);
for (const r of REGELN) {
  const known = Array.isArray(TEILE[r.teil]) ? TEILE[r.teil].includes(r.begriff) : r.teil in TEILE && r.begriff === undefined;
  if (!known || typeof r.beurteile !== 'function') throw new Error(`regeln.mjs: unbekannte Regel ${r.teil} ${r.begriff ?? ''}`);
}
// Funde in der Reihenfolge des Glossars, gleich welche Datei zuerst registriert ist
const ORDER = Object.keys(TEILE).flatMap(begriffe);
REGELN.sort((a, b) => ORDER.indexOf(nameOf(a)) - ORDER.indexOf(nameOf(b)));
const offenBei = (regeln) => ORDER.filter(begriff => !regeln.some(r => nameOf(r) === begriff));

/**
 * Beurteilt ein Level (Leveldaten wie in LEVELS, mit Lösung).
 * grad: Schwierigkeitsgrad von aussen (leicht, mittel, schwer, sehr schwer), bis die Beurteilung ihn selbst bestimmt
 *   (Tickets 12 und 15); Regeln, die erst ab „mittel“ gelten, lesen ihn aus ctx.grad (null: nicht vorgegeben).
 * teuer: false lässt die teuren Regeln weg; sie stehen dann in offen. Für Tests und Vorprüfungen, die sie nicht brauchen.
 * Rückgabe:
 *   schwierigkeit: { wert, teilwerte } oder null
 *   spielwert:     { wert, teilwerte } oder null
 *   schliessen:    Teilwerte des Spielermodells und die weiten Fast-Lösungen (siehe schliessen.mjs) oder null
 *   kernideen:     nötige Kernideen, je { begriff, begruendung, … }
 *   hauptKernidee: { begriff (null ohne nötige Kernidee), fund, weitere, begruendung } (siehe haupt-kernidee.mjs) oder null
 *   mischziele:    [{ ziel, farbe, quellen, ausZweiQuellen }] (siehe mischziele.mjs) oder null
 *   ausschluesse:  Ausschlussgründe, je { begriff, begruendung, … }
 *   offen:         Glossarbegriffe der Teile, die noch keine Regel berechnet. Ein offener Teil ist null bzw. hat keine
 *                  Funde; ein leeres ausschluesse heisst also nur für die übrigen Gründe „kein Ausschluss“.
 */
export function beurteile(level, { grad = null, teuer = true } = {}) {
  if (!level.solution) throw new Error(`Level "${level.name}": ohne Lösung (solution) lässt es sich nicht beurteilen`);
  if (grad !== null && !GRADE.includes(grad)) throw new Error(`Level "${level.name}": unbekannter Grad „${grad}“ (${GRADE.join(', ')})`);
  const store = new Map();
  const ctx = {
    level, feldform: feldformVon(level), grad,
    merke(schluessel, rechne) {
      if (!store.has(schluessel)) store.set(schluessel, rechne());
      return store.get(schluessel);
    },
  };
  const out = Object.fromEntries(Object.entries(TEILE).map(([teil, b]) => [teil, Array.isArray(b) ? [] : null]));
  const regeln = teuer ? REGELN : REGELN.filter(r => !r.teuer);
  for (const regel of regeln) {
    const result = regel.beurteile(ctx);
    if (regel.begriff) out[regel.teil].push(...result.map(fund => ({ begriff: regel.begriff, ...fund })));
    else out[regel.teil] = result;
  }
  out.offen = offenBei(regeln);
  return out;
}
