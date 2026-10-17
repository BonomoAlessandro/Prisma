// Generator (Spec „Generator“, ADR 0004): ein Einstieg, generiere(auftrag). Ein Auftrag mit Grad, Kernidee, Seed und
// Feldform ergibt ein Level oder nichts. Ein Ablauf für alle Grade:
// 1. Kernidee einbauen: Der Baustein der Kernidee (bausteine/) setzt sie gezielt in einen leeren Bau (bau.mjs).
// 2. Ergänzen bis zur Grösse, die die Vorgabe des Grads würfelt (vorgaben.mjs): Quellen, drehbare Elemente, Filter,
//    feste Spiegel, Ziele an den Strahlenden. Dann festigen: aufräumen, Eindeutigkeit herstellen (höchstens
//    vorgaben.reparaturen Reparaturen), wirkungslose Elemente wegnehmen (schritte.mjs). Hat der Bau danach weniger
//    drehbare Elemente als gewürfelt, wird nachgelegt, höchstens NACHLEGEN-mal; unter der Untergrenze ist er verworfen.
// 3. Startstellung: Reichen die Klicks nicht, kommt eine neue, statt das Level zu verwerfen.
// 4. Beurteilen und verfeinern: zuerst die günstige, exakte Vorprüfung, die Beurteilung ohne ihre teuren Regeln
//    (Scheinmischung, Knäuel, ab „mittel“ Füllteil und Zerfall, die Kernideen, die nicht teuer sind), dann die volle
//    Beurteilung. Beide teilen sich einen Zwischenstand, nichts wird doppelt gerechnet. Stimmt der Grad nicht, macht
//    ein Schritt des Verfeinerns (verfeinern.mjs) das Level leichter oder schwerer, höchstens vorgaben.schritte-mal,
//    und die Beurteilung beginnt von neuem: Ausschlüsse und Spielwert gelten in jedem Schritt.
// Die günstigen Prüfungen stehen vorn: Eindeutigkeit (eine Suche im Modus unique, bis zur zweiten Lösung) und die Regel
// gegen wirkungslose Elemente brauchen nur die Strahlregel und kleine Suchen, die Vorprüfung rund ein Sechstel der
// vollen Beurteilung, die Suche ohne Abschneiden kommt zuletzt.
//
// Jedes gelieferte Level erfüllt vier Bedingungen: genau eine Lösung, die Beurteilung bestanden (kein Grund der
// Levelliste aus levelliste.mjs: kein Ausschlussgrund, ab „mittel“ eine nötige Kernidee und der Mindest-Spielwert), der
// verlangte Grad (grad.mjs) und die verlangte Kernidee nötig. Derselbe Auftrag ergibt dasselbe Level: Aller Zufall
// kommt aus dem Seed (zufall.mjs). Das Feld kennt der Generator nur über die Feldform des Auftrags (Spec „Feldform“).
// Weitere Kernideen (Ticket 19) kommen als Baustein dazu, weitere Grade (Ticket 20) als Vorgabe und als Schritte des
// Verfeinerns.
import os from 'node:os';
import { beurteile, GRADE, TEILE } from '../beurteilung/index.mjs';
import { gradVon } from '../beurteilung/grad.mjs';
import { GRUENDE } from '../levelliste.mjs';
import { zufall } from './zufall.mjs';
import { Bau } from './bau.mjs';
import { VORGABEN, maengel } from './vorgaben.mjs';
import { ergaenze, setzeZiele, festige, startstellung } from './schritte.mjs';
import { SCHRITTE } from './verfeinern.mjs';
import * as registriert from './bausteine/index.mjs';

/** So oft wird höchstens nachgelegt, wenn der Bau nach dem Festigen zu klein ist. */
const NACHLEGEN = 3;
/** Die Bausteine nach Kernidee (null: ohne Kernidee). */
const BAUSTEINE = new Map(Object.values(registriert).map(b => [b.kernidee, b]));
/** Kurznamen der Kernideen für die Kommandozeile und das Messskript. */
export const KURZNAMEN = {
  mischziel: 'Mischziel aus zwei Quellen', abschalten: 'Abschalten', abzaehlen: 'Farben abzählen',
  sammelstelle: 'Sammelstelle', falle: 'Falle', lockvogel: 'Lockvogel',
};

/**
 * Was der Generator heute liefern kann: je Grad mit Vorgabe und Baustein ein Auftrag ohne Seed und Feldform, { name,
 * grad, kernidee }; name wie „leicht“ oder „leicht-mischziel“ (für das Messskript und die Kommandozeile).
 */
export function angebot() {
  const kurz = Object.fromEntries(Object.entries(KURZNAMEN).map(([k, v]) => [v, k]));
  const kernideen = [...BAUSTEINE.keys()].sort((a, b) => (b === null) - (a === null)); // ohne Kernidee zuerst
  return Object.keys(VORGABEN).flatMap(grad => kernideen
    .map(kernidee => ({ name: kernidee ? `${grad}-${kurz[kernidee]}` : grad, grad, kernidee })));
}

let gedeckelt = false;
/**
 * Der Generator läuft nur über die gedeckelte Umgebung (Spec „Generator“): mit tiefster Priorität, wie tools/leise.sh
 * sie setzt, und mit LEISE_CPU höchstens 50. Geprüft einmal je Prozess; Tests laufen über leise.sh mit 20 %.
 */
function pruefeDeckel() {
  if (gedeckelt) return;
  const cpu = Number(process.env.LEISE_CPU || 20);
  if (os.getPriority() !== os.constants.priority.PRIORITY_LOW || !(cpu <= 50)) {
    throw new Error('Generator: nur über die gedeckelte Umgebung, mit tiefster Priorität und LEISE_CPU höchstens 50 '
      + `(jetzt ${process.env.LEISE_CPU ?? 'nicht gesetzt'}), z. B. LEISE_CPU=50 sh tools/leise.sh node `
      + 'tools/generiere.mjs …');
  }
  gedeckelt = true;
}

/** Vorgabe und Baustein eines Auftrags; wirft, wenn es sie nicht gibt oder die Vorgabe nicht taugt. */
function rezept({ grad, kernidee, seed, feldform }) {
  if (!GRADE.includes(grad)) throw new Error(`Generator: unbekannter Grad „${grad}“ (${GRADE.join(', ')})`);
  if (kernidee !== null && !TEILE.kernideen.includes(kernidee)) {
    throw new Error(`Generator: unbekannte Kernidee „${kernidee}“`);
  }
  if (!Number.isInteger(seed)) throw new Error(`Generator: Der Seed muss eine ganze Zahl sein, nicht ${seed}`);
  if (!feldform?.zellen || typeof feldform.element !== 'function') {
    throw new Error('Generator: Der Auftrag braucht eine Feldform');
  }
  const vorgaben = VORGABEN[grad], baustein = BAUSTEINE.get(kernidee);
  if (!vorgaben) throw new Error(`Generator: Für „${grad}“ gibt es noch keine Vorgabe (Ticket 20)`);
  if (!baustein) throw new Error(`Generator: Für die Kernidee „${kernidee}“ gibt es noch keinen Baustein (Ticket 19)`);
  const fehlt = maengel(vorgaben, feldform, baustein.braucht);
  if (fehlt.length) throw new Error(`Generator: Die Vorgabe für „${grad}“ taugt nicht: ${fehlt.join('; ')}`);
  return { vorgaben, baustein };
}

/**
 * Was an einer Beurteilung (mit dem Grad des Auftrags) nicht stimmt, oder null: { grund, richtung }. richtung ist der
 * Schritt des Verfeinerns, der helfen kann (leichter, schwerer), sonst null. voll: mit den teuren Regeln; sonst prüft
 * es nur, was die Vorprüfung schon weiss (Ausschlüsse und die Kernideen, die nicht teuer sind).
 */
function mangel(b, grad, kernidee, voll) {
  const begriffe = [...new Set(b.ausschluesse.map(a => a.begriff))];
  if (begriffe.length) return { grund: `Ausschluss: ${begriffe.join(', ')}` };
  const offen = !voll && b.offen.includes(kernidee); // voll beurteilt muss die Kernidee entschieden sein
  if (kernidee && !offen && !b.kernideen.some(k => k.begriff === kernidee)) return { grund: 'Kernidee nicht nötig' };
  if (!voll) return null;
  const gefunden = gradVon(b.schwierigkeit.wert);
  if (gefunden !== grad) {
    const richtung = GRADE.indexOf(gefunden) > GRADE.indexOf(grad) ? 'leichter' : 'schwerer';
    return { grund: `Grad ${gefunden}`, richtung };
  }
  const regel = Object.values(GRUENDE).find(r => r.gilt(b, grad));
  return regel ? { grund: regel.text } : null;
}

/**
 * Ein Level zum Auftrag { grad, kernidee, seed, feldform }:
 *   grad:     Schwierigkeitsgrad (leicht, mittel, schwer, sehr schwer); heute gibt es eine Vorgabe für „leicht“
 *   kernidee: Glossarbegriff der Kernidee, die nötig sein soll, oder null (keine verlangt); jede der sechs
 *             Kernideen des Glossars hat einen Baustein (Ticket 19)
 *   seed:     ganze Zahl; derselbe Auftrag mit demselben Seed ergibt dasselbe Level
 *   feldform: die Feldform (beurteilung/feldform.mjs), etwa feldformVon({}) für das flache Feld 7 × 7
 * Rückgabe: { level, beurteilung } mit den Leveldaten wie in LEVELS (name leer, grad, Startstellung, solution) und
 * ihrer Beurteilung mit dem Grad des Auftrags; oder { level: null, grund }, wenn der Seed kein Level ergibt. Wirft bei
 * einem Auftrag, den der Generator nicht kennt, und ausserhalb der gedeckelten Umgebung.
 */
export function generiere(auftrag) {
  const { grad, kernidee = null, seed, feldform } = auftrag;
  pruefeDeckel();
  const { vorgaben, baustein } = rezept({ grad, kernidee, seed, feldform });
  const nichts = (grund) => ({ level: null, grund });
  const R = zufall(seed), bau = new Bau(feldform, R);
  const wuerfle = (name) => R.int(...vorgaben[name]);
  const plan = { quellen: wuerfle('quellen'), drehbar: wuerfle('drehbar'), filter: wuerfle('filter'),
    festeSpiegel: wuerfle('festeSpiegel') };
  let grund = baustein.baue(bau, plan, vorgaben);
  for (let runde = 0; !grund && runde < NACHLEGEN; runde++) {
    ergaenze(bau, plan, vorgaben);
    setzeZiele(bau, vorgaben.ziele[1]);
    grund = festige(bau, vorgaben);
    if (bau.drehbare().length >= plan.drehbar && bau.art('target').length >= vorgaben.ziele[0]) break;
  }
  if (grund) return nichts(grund);
  if (bau.drehbare().length < vorgaben.drehbar[0] || bau.art('target').length < vorgaben.ziele[0]) {
    return nichts('zu klein');
  }
  for (let schritt = 0; ; schritt++) {
    const level = startstellung(bau, vorgaben, grad);
    if (typeof level === 'string') return nichts(level);
    const zwischenstand = new Map();
    const vorab = beurteile(level, { grad, teuer: false, zwischenstand });
    let fehlt = mangel(vorab, grad, kernidee, false), beurteilung = null;
    if (!fehlt) {
      beurteilung = beurteile(level, { grad, zwischenstand });
      fehlt = mangel(beurteilung, grad, kernidee, true);
    }
    if (!fehlt) return { level, beurteilung };
    if (!fehlt.richtung || schritt >= vorgaben.schritte || !SCHRITTE[fehlt.richtung]) return nichts(fehlt.grund);
    const nein = SCHRITTE[fehlt.richtung](bau, plan, vorgaben);
    if (nein) return nichts(`${fehlt.grund}, ${fehlt.richtung}: ${nein}`);
  }
}
