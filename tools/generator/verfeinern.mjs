// Verfeinern (Spec „Generator“, ADR 0004): Schritte, die ein Level leichter oder schwerer machen, bis die Beurteilung
// den verlangten Grad findet. Der Ablauf in index.mjs beurteilt nach jedem Schritt neu, Ausschlüsse und Spielwert
// gelten also in jedem Schritt; wie viele Schritte ein Grad erlaubt, sagt seine Vorgabe (vorgaben.mjs, schritte). Ein
// Schritt ist eine Funktion (bau, plan, vorgaben, mangel) → null oder der Grund, warum er nicht ging; mangel ist der
// Befund aus index.mjs (bei Füllteil und Zerfall mit den Zellen der Ziele, die „schwerer“ öffnen soll). Er ändert den
// Bau und festigt ihn wieder (schritte.mjs): Ein Bau nach einem Schritt ist gelöst, eindeutig und ohne wirkungslose
// Elemente.
// Ticket 18 brachte „leichter“, Ticket 20 „schwerer“; damit verfeinert der Ablauf in beide Richtungen bis zum Grad.
import { festige, ergaenze, setzeZiele, setzeDrehbar, setzeQuelle, neueFarbe, kreuzungszellen } from './schritte.mjs';
import { dockeAn, angedockt } from './andocken.mjs';

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
 * Ticket 28:
 * - Andocken (plan.andocken, ab „mittel“ für die Bausteine, die es wollen): Nennt die Beurteilung Elemente der
 *   Kernidee (ihr Strang ist ein Füllteil oder abgetrennt; andocken: Zellen der Spiegel und Quellen), dockt der Schritt
 *   den Strang zuerst an (andocken.mjs): fremdes Licht auf einen seiner drehbaren Spiegel oder ein Prisma vor seine
 *   Quelle; die Ziele der Kernidee darf er nicht öffnen. Fände er sonst keinen Platz, dockt er ebenso an, statt eine
 *   neue Quelle mit einem getrennten Strang zu setzen. Ausgenommen sind die Elemente in bau.unberuehrt. Danach ergänzt
 *   er an den neuen Enden und festigt; gelungen ist er, wenn das Andocken danach noch hält, auch ohne ein drehbares
 *   Element mehr. Geht das Andocken nicht, wie bisher.
 * - Ab „mittel“ (vorgaben.abkuerzen): Ist vor dem Festigen kein drehbares Element dazugekommen, kann der Versuch nicht
 *   gelingen (Festigen nimmt nur weg), er endet ohne die Suche nach einer zweiten Lösung (Review Ticket 20, Fund 2). In
 *   „leicht“ festigt er wie bisher, damit „leicht“ bitgleich bleibt.
 */
function schwerer(bau, plan, vorgaben, { ziele: oeffnen = [], andocken = [] } = {}) {
  const { R, feldform } = bau;
  // Die drehbaren Spiegel und Quellen der Kernidee: unter den genannten, und alle (falls kein Platz ist)
  const kernzellen = (zellen) => zellen.filter((z) => {
    const e = bau.bei(z);
    return bau.kern.has(e) && !bau.unberuehrt.has(e)
      && (e.type === 'source' || (e.type === 'mirror' && feldform.stellungen(e).length));
  });
  const andockbar = plan.andocken ? kernzellen(andocken) : [];
  // An der Obergrenze tauscht es nur, und nur zum Verbinden: zuerst fällt ein drehbares Element weg
  const tauschen = bau.drehbare().length >= vorgaben.drehbar[1];
  if (tauschen && !oeffnen.length) return 'zu gross';
  const stand = merke(bau), text = JSON.stringify(stand);
  let grund = null;
  const weg = () => {
    const frei = bau.drehbare().filter(e => !bau.kern.has(e));
    if (frei.length) bau.entferne(R.pick(frei));
    return frei.length > 0;
  };
  for (let versuch = 0; versuch < VERSUCHE; versuch++) {
    if (versuch) zurueck(bau, stand);
    let dock = null;
    if (andockbar.length) {
      // Zuerst andocken (an der Obergrenze nach dem Tausch eines Elements); geht es nicht, wie bisher
      if (tauschen && !weg()) return 'zu gross';
      dock = dockeAn(bau, andockbar, plan.andocken);
      if (!dock) zurueck(bau, stand);
    }
    if (!dock && tauschen && !weg()) return 'zu gross';
    const vorher = bau.drehbare().length, ziel = Math.min(vorher + 2, vorgaben.drehbar[1]);
    if (!dock) {
      // Ein Ziel öffnen, das die Beurteilung nennt (das eines Füllteils, eines abgetrennten Teils), sonst irgendeines
      const frei = bau.art('target').filter(t => !bau.kern.has(t));
      const genannt = frei.filter(t => oeffnen.includes(feldform.zelle(t)));
      if (genannt.length) bau.entferne(R.pick(genannt));
      const kreuzend = kreuzungszellen(bau);
      if (!kreuzend.length || !setzeDrehbar(bau, R.gewichtet(vorgaben.arten), { zellen: kreuzend })) {
        const offen = bau.art('target').filter(t => !bau.kern.has(t));
        if (!genannt.length && offen.length) bau.entferne(R.pick(offen));
        ergaenze(bau, { ...plan, drehbar: ziel }, vorgaben);
        // Kein Platz am offenen Ende: eine neue Quelle bringt einen neuen Strang, soweit die Vorgabe sie erlaubt. Mit
        // Andocken dockt sie an die Kernidee an (oder ein Prisma kommt vor eine ihrer Quellen), statt einen getrennten
        // Strang zu beginnen; erst wenn das nicht geht, irgendwo
        if (bau.drehbare().length <= vorher && plan.andocken && !tauschen) {
          dock = dockeAn(bau, kernzellen(bau.elemente.map(feldform.zelle)), plan.andocken);
          if (!dock) zurueck(bau, stand);
        }
        if (!dock && bau.drehbare().length <= vorher && bau.art('source').length < vorgaben.quellen[1]
          && setzeQuelle(bau, neueFarbe(bau, plan, vorgaben))) {
          ergaenze(bau, { ...plan, drehbar: ziel }, vorgaben);
        }
      }
    }
    if (dock) {
      // Angedockt: an den neuen Enden ergänzen (mindestens bis ein Element über den Stand vorher, falls dafür eine
      // Quelle samt Strang weichen musste), festigen; gelungen, wenn das Andocken danach noch hält
      const groesse = Math.max(stand.drehbar, bau.drehbare().length) + 1;
      ergaenze(bau, { ...plan, drehbar: Math.min(groesse, vorgaben.drehbar[1]) }, vorgaben);
      setzeZiele(bau, vorgaben.ziele[1]);
      grund = festige(bau, vorgaben) ?? (!angedockt(bau, dock) ? 'nicht angedockt'
        : bau.art('target').length < Math.min(vorgaben.ziele[0], stand.ziele) ? 'zu wenige Ziele' : null);
      if (grund) continue;
      if (!zuKlein(bau, vorgaben)) return null;
      // Unter den Untergrenzen: weitermachen lohnt nur, wenn er dabei gewachsen ist (etwa beim Wachsen in index.mjs)
      if (bau.drehbare().length > stand.drehbar) return 'zu klein';
      grund = 'zu klein';
      continue;
    }
    setzeZiele(bau, vorgaben.ziele[1]);
    // Aussichtslos ohne ein drehbares Element mehr (beim Tauschen gleich viele): ab „mittel“ ohne Festigen (Fund 2)
    if (vorgaben.abkuerzen && bau.drehbare().length < stand.drehbar + (tauschen ? 0 : 1)) {
      grund = 'nichts dazugekommen';
      continue;
    }
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
 * Stand des Baus, um nach einem misslungenen Versuch dorthin zurückzukehren: Elemente, Kernidee, Lockvögel, die
 * Elemente, die das Andocken nicht verändert, reservierte Zellen.
 */
function merke(bau) {
  return { elemente: bau.elemente.map(e => ({ ...e })), kern: bau.elemente.map(e => bau.kern.has(e)),
    lockvogel: bau.elemente.map(e => bau.lockvoegel.has(e)), unberuehrt: bau.elemente.map(e => bau.unberuehrt.has(e)),
    reserviert: [...bau.reserviert], drehbar: bau.drehbare().length, ziele: bau.art('target').length };
}
function zurueck(bau, { elemente, kern, lockvogel, unberuehrt, reserviert }) {
  bau.leere();
  elemente.forEach((e, i) => {
    const el = bau.setze({ ...e }, { kern: kern[i], lockvogel: lockvogel[i] });
    if (unberuehrt[i]) bau.unberuehrt.add(el);
  });
  for (const z of reserviert) bau.reserviert.add(z);
}

/** Die Schritte nach Richtung. */
export const SCHRITTE = { leichter, schwerer };
