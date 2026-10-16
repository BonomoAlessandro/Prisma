// Spielwert (Glossar, Spec „Beurteilung“): wie viel Spass ein Level macht, unabhängig von seiner Schwierigkeit. Er
// entscheidet, ob ein Level ins Spiel kommt: Unter dem MINDEST_SPIELWERT kommt ein Level ab „mittel“ nicht hinein.
// Der Wert ist die Summe der vier Teilwerte (je zwischen 0 und 1), gewichtet mit GEWICHTE (zusammen 100), liegt also
// zwischen 0 und 100:
// - Schliessen (Glossar) misst das Spielermodell (schliessen.mjs): Lässt sich das Level Schritt für Schritt durch
//   Folgern lösen, ohne blind zu drehen? Ein Produkt aus drei Anteilen:
//   - folgern: Anteil der Stellungen, die das Spielermodell mit Horizont 2 streicht, durch Folgern oder eine
//     Fallunterscheidung; unter 1 nur, wenn es steckt;
//   - Raten: Fallunterscheidungen mit vollem Überblick, gemessen an der Schwelle von Probieren (SCHWELLEN in
//     probieren.mjs): Eine mehr als erlaubt ergäbe 0;
//   - Fast-Lösungen: der Anteil weiter Fast-Lösungen an allen Strahlbildern, ebenso an der Schwelle gemessen.
//   Die Kette zählt hier nicht: Sie hängt stark von der Reihenfolge der Elemente ab (Ticket 09), die Zahl der
//   Fallunterscheidungen misst das Raten schon.
// - Kernidee: Zählt nur, wenn die Lösung von ihr abhängt, also die nötigen Kernideen (haupt-kernidee.mjs). Die erste
//   bringt KERNIDEE.erste, jede weitere verschiedene den Anteil KERNIDEE.weitere des Rests (kernideeTeil).
// - Farblogik (Glossar: Mischen, Filtern oder Zerlegen von Farben ist für die Lösung nötig): Anteil der Ziele, deren
//   Farbe Farblogik braucht. Das ist ein Mischziel (mischziele.mjs), oder eine Quelle bringt Licht auf das Ziel, deren
//   Farbe nicht in der Farbe des Ziels aufgeht: Dann muss ein Filter oder ein Prisma ihr Licht auf dem Weg beschneiden,
//   denn in der Lösung bekommt kein Ziel falsches Licht. Weiss + Rot = Weiss auf einem weissen Ziel zählt so nicht.
// - Zusammenspiel (Glossar: Strahlen kreuzen sich, ein Element wird mehrfach getroffen oder von mehreren Quellen
//   genutzt): Stellen des Zusammenspiels je drehbares Element, höchstens 1. Stellen sind
//   - Elemente, die im Strahlbild der Lösung mehrere Strahlen nutzen (spiegeln, brechen, filtern, mischen oder als Ziel
//     sammeln), gleich von welcher Quelle: ein Spiegel, den ein Strahl zweimal trifft oder zwei Quellen nutzen, ein
//     Kombinator mit zwei Eingängen. Das Strahlbild enthält das Licht aller Quellen, verglichen werden also alle, nicht
//     nur die ersten beiden (behobener Fehler aus der Analyse, Spec);
//   - gemeinsame Mischziele: Mischziele, auf die mindestens zwei Quellen Licht bringen (mischziele.mjs), auch wenn ihr
//     Licht schon in einem Kombinator gemischt ankommt (behobener Fehler aus der Analyse, Spec);
//   - Kreuzungen: Zellen ohne Element, durch die Licht in mindestens zwei Achsen läuft.
//   Elemente hinter einem Kombinator, die bloss sein Mischlicht weiterleiten, zählen nicht: Sie nutzen einen Strahl.
// Schliessen und Kernidee tragen zusammen zwei Drittel (Spec: „etwa zwei Drittel“), Farblogik und Zusammenspiel den
// kleineren Rest. Ein Level, das sich durch Schliessen lösen lässt und eine nötige Kernidee hat, erreicht ohne Bonus
// 60,4, also gut 60 % der Skala; mit jeder weiteren Kernidee mehr, bis 67.
//
// Eichung (Ticket 13) am Gefühl der KI-Tester und der Spieler-Tester aus den Reviews (spielwert-eichmenge.mjs,
// Messskript tools/eiche-spielwert.mjs): Geeicht wird an den Leveln ohne Ausschlussgrund, denn der Spielwert entscheidet
// nur unter ihnen. Frei eingestellte Gewichte lernten die Eichmenge auswendig: In der Kreuzprüfung lagen sie unter den
// Gewichten nach der Spec, darum bleiben diese. Bestätigt hat die Kreuzprüfung nur, dass weitere Kernideen mitzählen
// (KERNIDEE). Die Werte und der MINDEST_SPIELWERT sind in Ticket 13 unter „Comments“ begründet.
// Teuer, weil Schliessen die Suche ohne Abschneiden und die Kernideen Falle und Lockvogel brauchen.
import { loesung, jeQuelle } from './loesungsstellung.mjs';
import { mischziele } from './mischziele.mjs';
import { schliessen as schliessenWerte } from './schliessen.mjs';
import { spielermodell } from './spielermodell.mjs';
import { hauptKernidee } from './haupt-kernidee.mjs';
import { SCHWELLEN } from './ausschluesse/probieren.mjs';

/**
 * Gewichte der Teilwerte: Schliessen und Kernidee 67, Farblogik und Zusammenspiel 33. Die Spec gibt nur die zwei
 * Drittel vor; geteilt ist beides fast hälftig, und die Kreuzprüfung zog das frei eingestellten Gewichten vor.
 */
export const GEWICHTE = { schliessen: 34, kernidee: 33, farblogik: 17, zusammenspiel: 16 };
/**
 * Kernidee: die erste nötige bringt erste, jede weitere den Anteil weitere des Rests. erste ist so tief, wie die Spec
 * es zulässt (Schliessen und eine Kernidee bei gut 60 %), weil die Eichung tiefere Werte vorzog; weitere ist geeicht.
 */
export const KERNIDEE = { erste: 0.8, weitere: 0.3 };
/**
 * Unter diesem Spielwert kommt ein Level ab „mittel“ nicht ins Spiel. Ein Level, das sich durch Schliessen lösen lässt
 * und eine nötige Kernidee hat, liegt immer darüber (60,4); ohne Kernidee braucht es volles Schliessen und fast den
 * ganzen Bonus. In der Eichmenge trennt diese Schwelle das Gefühl am deutlichsten.
 */
export const MINDEST_SPIELWERT = 60;

/** Teilwert Kernidee bei n verschiedenen nötigen Kernideen (0 ohne); k: Werte wie KERNIDEE. */
export const kernideeTeil = (n, k = KERNIDEE) => (n === 0 ? 0 : k.erste + (1 - k.erste) * (1 - (1 - k.weitere) ** (n - 1)));

/** Ereignisse der Strahlregel, in denen ein Element einen Strahl nutzt; schlucken zählt nicht. */
const NUTZEN = new Set(['reflect', 'refract', 'filter', 'merge', 'hit']);

/** Zahl der Strahlen, die jedes Element im Strahlbild der Lösung nutzt: Map Zelle → Zahl. */
function genutzt(ctx) {
  const { brett, strahlbild } = loesung(ctx);
  const zahl = new Map();
  for (const e of strahlbild.events) {
    if (!NUTZEN.has(e.kind)) continue;
    // Ein Spiegel nennt beim Spiegeln sein Element nicht, nur die Stelle
    const zelle = e.kind === 'reflect' ? ctx.feldform.zelleBei(e) : ctx.feldform.zelle(brett.elements[e.element ?? e.target]);
    zahl.set(zelle, (zahl.get(zelle) || 0) + 1);
  }
  return zahl;
}

/** Schliessen: folgern × (1 − Raten) × (1 − Fast-Lösungen), je zwischen 0 und 1. */
function schliessen(ctx) {
  const { k2 } = spielermodell(ctx);
  const { kInf, fastLoesungen } = schliessenWerte(ctx);
  const zuStreichen = ctx.level.elements.reduce((n, e) => n + Math.max(0, ctx.feldform.stellungen(e).length - 1), 0);
  const gestrichen = k2.folgerungen.reduce((n, f) => n + f.stellungen.length, 0);
  const folgern = zuStreichen ? gestrichen / zuStreichen : 1;
  const raten = Math.min(1, kInf / (SCHWELLEN.kInf + 1));
  const fast = Math.min(1, fastLoesungen.promille / SCHWELLEN.promille);
  return folgern * (1 - raten) * (1 - fast);
}

/** Kernidee: aus der Zahl der verschiedenen nötigen Kernideen. */
function kernidee(ctx) {
  const { begriff, weitere } = hauptKernidee(ctx);
  return kernideeTeil(begriff ? 1 + weitere.length : 0);
}

/** Farblogik: Anteil der Ziele, die ein Mischziel sind oder Licht einer Quelle bekommen, deren Farbe nicht passt. */
function farblogik(ctx) {
  const { brett } = loesung(ctx);
  const ziele = brett.elements.filter(e => e.type === 'target');
  const gemischt = new Set(mischziele(ctx).map(m => m.ziel));
  const farbe = new Map(brett.elements.filter(e => e.type === 'source').map(q => [ctx.feldform.zelle(q), q.color]));
  const beschnitten = (t) => jeQuelle(ctx).some(q => q.strahlbild.hits.get(t.id) && farbe.get(q.quelle) & ~t.color);
  const mit = ziele.filter(t => gemischt.has(ctx.feldform.zelle(t)) || beschnitten(t));
  return ziele.length ? mit.length / ziele.length : 0;
}

/** Zusammenspiel: Stellen des Zusammenspiels je drehbares Element, höchstens 1. */
function zusammenspiel(ctx) {
  const { feldform } = ctx;
  const stellen = new Set();
  for (const [zelle, n] of genutzt(ctx)) if (n >= 2) stellen.add(zelle);
  for (const m of mischziele(ctx)) if (m.ausZweiQuellen) stellen.add(m.ziel);
  const besetzt = new Set(ctx.level.elements.map(feldform.zelle));
  const achsen = new Map();
  for (const s of loesung(ctx).strahlbild.segments) {
    for (const { zelle, achse } of feldform.durchlauf(s)) {
      if (besetzt.has(zelle)) continue;
      if (!achsen.has(zelle)) achsen.set(zelle, new Set());
      achsen.get(zelle).add(achse);
    }
  }
  const kreuzungen = [...achsen.values()].filter(a => a.size >= 2).length;
  const drehbar = ctx.level.elements.filter(e => feldform.stellungen(e).length).length;
  return Math.min(1, (stellen.size + kreuzungen) / Math.max(1, drehbar));
}

/** Der Spielwert eines Levels, einmal je Beurteilung: { wert (0–100), teilwerte: { schliessen, kernidee, farblogik, zusammenspiel } (je 0–1) }. */
export const spielwert = (ctx) => ctx.merke(spielwert, () => {
  const teilwerte = { schliessen: schliessen(ctx), kernidee: kernidee(ctx), farblogik: farblogik(ctx), zusammenspiel: zusammenspiel(ctx) };
  const wert = Object.entries(GEWICHTE).reduce((s, [teil, g]) => s + g * teilwerte[teil], 0);
  return { wert, teilwerte };
});

export default { teil: 'spielwert', teuer: true, beurteile: spielwert };
