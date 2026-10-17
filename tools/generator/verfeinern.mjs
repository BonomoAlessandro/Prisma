// Verfeinern (Spec „Generator“, ADR 0004): Schritte, die ein Level leichter oder schwerer machen, bis die Beurteilung
// den verlangten Grad findet. Der Ablauf in index.mjs beurteilt nach jedem Schritt neu, Ausschlüsse und Spielwert
// gelten also in jedem Schritt; wie viele Schritte ein Grad erlaubt, sagt seine Vorgabe (vorgaben.mjs, schritte). Ein
// Schritt ist eine Funktion (bau, plan, vorgaben, mangel) → null oder der Grund, warum er nicht ging; mangel ist der
// Befund aus index.mjs (bei Füllteil und Zerfall mit den Zellen der Ziele, die „schwerer“ öffnen soll). Er ändert den
// Bau und festigt ihn wieder (schritte.mjs): Ein Bau nach einem Schritt ist gelöst, eindeutig und ohne wirkungslose
// Elemente.
// Ticket 18 brachte „leichter“, Ticket 20 „schwerer“; damit verfeinert der Ablauf in beide Richtungen bis zum Grad.
import { festige, ergaenze, setzeZiele, setzeDrehbar, setzeQuelle, quellfarbe, kreuzungszellen } from './schritte.mjs';

/** Unter den Untergrenzen der Vorgabe? */
const zuKlein = (bau, vorgaben) => bau.drehbare().length < vorgaben.drehbar[0]
  || bau.art('target').length < vorgaben.ziele[0];

/**
 * Leichter: ein drehbares Element, das nicht zur Kernidee gehört, fällt weg, samt allem, was danach kein Licht mehr
 * bekommt. Bleibt der Bau unter den Untergrenzen der Vorgabe, geht es nicht.
 */
function leichter(bau, plan, vorgaben) {
  const frei = bau.drehbare().filter(e => !bau.kern.has(e));
  if (!frei.length) return 'nichts wegzunehmen';
  bau.entferne(bau.R.pick(frei));
  const grund = festige(bau, vorgaben);
  if (grund) return grund;
  return zuKlein(bau, vorgaben) ? 'zu klein' : null;
}

/**
 * Schwerer (Ticket 20): ein drehbares Element mehr, möglichst eines, das Stränge verbindet.
 * - Kreuzen sich zwei Strahlen, die offen oder auf einem Ziel ausserhalb der Kernidee enden, kommt es auf die Kreuzung
 *   (kreuzungszellen): Beide Strahlen laufen dann über dasselbe Element, das verbindet Stränge (Füllteil, Zerfall)
 *   und bringt Zusammenspiel, beides zählt für die Schwierigkeit. Die Ziele dahinter setzt setzeZiele neu.
 * - Sonst fällt ein Ziel ausserhalb der Kernidee weg, und das Ergänzen setzt ein Element ans offene Ende seines Strahls
 *   (oder, wenn kein Strahl offen endet, eine neue Quelle, soweit die Vorgabe sie erlaubt). Es zielt auf zwei Elemente
 *   mehr und füllt dabei auch Quellen, Filter und feste Spiegel bis zum Plan auf.
 * Danach Ziele an die Enden und festigen. Gelungen ist der Schritt mit mindestens einem drehbaren Element mehr. An der
 * Obergrenze geht er nur mit Zielen zum Öffnen (Füllteil, Zerfall) und tauscht dann ein Element. Rückgabe wie bei jedem
 * Schritt; „zu klein“, wenn der Bau gewachsen ist, aber noch unter den Untergrenzen liegt (das Wachsen in index.mjs
 * macht dann weiter).
 */
function schwerer(bau, plan, vorgaben, { ziele: oeffnen = [] } = {}) {
  const { R, feldform } = bau;
  // An der Obergrenze tauscht es nur, und nur zum Verbinden: zuerst fällt ein drehbares Element weg
  const tauschen = bau.drehbare().length >= vorgaben.drehbar[1];
  if (tauschen && !oeffnen.length) return 'zu gross';
  const stand = merke(bau), text = JSON.stringify(stand);
  let grund = null;
  for (let versuch = 0; versuch < VERSUCHE; versuch++) {
    if (versuch) zurueck(bau, stand);
    if (tauschen) {
      const weg = bau.drehbare().filter(e => !bau.kern.has(e));
      if (!weg.length) return 'zu gross';
      bau.entferne(R.pick(weg));
    }
    const vorher = bau.drehbare().length, ziel = Math.min(vorher + 2, vorgaben.drehbar[1]);
    // Ein Ziel öffnen, das die Beurteilung nennt (das eines Füllteils, eines abgetrennten Teils), sonst irgendeines
    const frei = bau.art('target').filter(t => !bau.kern.has(t));
    const genannt = frei.filter(t => oeffnen.includes(feldform.zelle(t)));
    if (genannt.length) bau.entferne(R.pick(genannt));
    const kreuzend = kreuzungszellen(bau);
    if (!kreuzend.length || !setzeDrehbar(bau, R.gewichtet(vorgaben.arten), { zellen: kreuzend })) {
      const offen = bau.art('target').filter(t => !bau.kern.has(t));
      if (!genannt.length && offen.length) bau.entferne(R.pick(offen));
      ergaenze(bau, { ...plan, drehbar: ziel }, vorgaben);
      // Kein Platz am offenen Ende: eine neue Quelle bringt einen neuen Strang, soweit die Vorgabe sie erlaubt
      if (bau.drehbare().length <= vorher && bau.art('source').length < vorgaben.quellen[1]
        && setzeQuelle(bau, quellfarbe(R, vorgaben.farbigeQuellen))) {
        ergaenze(bau, { ...plan, drehbar: ziel }, vorgaben);
      }
    }
    setzeZiele(bau, vorgaben.ziele[1]);
    // Gelungen, wenn der Bau fest ist, mehr drehbare Elemente hat (beim Tauschen gleich viele, aber andere) und nicht
    // weniger Ziele als nötig, sofern er sie vorher hatte
    grund = festige(bau, vorgaben)
      ?? (JSON.stringify(merke(bau)) === text ? 'nichts dazugekommen'
        : bau.drehbare().length < stand.drehbar + (tauschen ? 0 : 1) ? 'nichts dazugekommen'
          : bau.art('target').length < Math.min(vorgaben.ziele[0], stand.ziele) ? 'zu wenige Ziele' : null);
    if (!grund) return zuKlein(bau, vorgaben) ? 'zu klein' : null; // gewachsen, aber noch unter den Untergrenzen
  }
  return grund;
}

/** So oft versucht „schwerer“ höchstens, vom selben Stand aus ein Element dazuzubringen; es kostet keine Beurteilung. */
const VERSUCHE = 8;

/**
 * Stand des Baus, um nach einem misslungenen Versuch dorthin zurückzukehren: Elemente, Kernidee, Lockvögel, reservierte
 * Zellen.
 */
function merke(bau) {
  return { elemente: bau.elemente.map(e => ({ ...e })), kern: bau.elemente.map(e => bau.kern.has(e)),
    lockvogel: bau.elemente.map(e => bau.lockvoegel.has(e)), reserviert: [...bau.reserviert],
    drehbar: bau.drehbare().length, ziele: bau.art('target').length };
}
function zurueck(bau, { elemente, kern, lockvogel, reserviert }) {
  bau.leere();
  elemente.forEach((e, i) => bau.setze({ ...e }, { kern: kern[i], lockvogel: lockvogel[i] }));
  for (const z of reserviert) bau.reserviert.add(z);
}

/** Die Schritte nach Richtung. */
export const SCHRITTE = { leichter, schwerer };
