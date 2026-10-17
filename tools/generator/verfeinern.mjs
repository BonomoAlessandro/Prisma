// Verfeinern (Spec „Generator“, ADR 0004): Schritte, die ein Level leichter oder schwerer machen, bis die Beurteilung
// den verlangten Grad findet. Der Ablauf in index.mjs beurteilt nach jedem Schritt neu, Ausschlüsse und Spielwert
// gelten also in jedem Schritt; wie viele Schritte ein Grad erlaubt, sagt seine Vorgabe (vorgaben.mjs, schritte). Ein
// Schritt ist eine Funktion (bau, plan, vorgaben) → null oder der Grund, warum er nicht ging. Er ändert den Bau und
// festigt ihn wieder (schritte.mjs): Ein Bau nach einem Schritt ist gelöst, eindeutig und ohne wirkungslose Elemente.
// Ticket 18 bringt den Schritt „leichter“ (für „leicht“ genügt er); Ticket 20 ergänzt „schwerer“ und weitere.
import { festige } from './schritte.mjs';

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
  if (bau.drehbare().length < vorgaben.drehbar[0] || bau.art('target').length < vorgaben.ziele[0]) return 'zu klein';
  return null;
}

/** Die Schritte nach Richtung. */
export const SCHRITTE = { leichter };
