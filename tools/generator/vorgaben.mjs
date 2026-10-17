// Vorgaben je Schwierigkeitsgrad für den Generator (Ticket 18): wie gross ein Level wird und welche Untergrenzen es
// erreichen muss. Sie ersetzen die Profile des alten Generators (Grössenstufe × Mischung): Je Grad gibt es eine
// Vorgabe, die Mischung der Elemente wählt der Zufall nach Gewichten. Ob der Grad stimmt, entscheidet am Ende allein
// die Beurteilung (grad.mjs); die Vorgaben legen nur fest, wo der Generator anfängt.
//
// Bereiche als [min, max]:
//   quellen         Zahl der Quellen
//   farbigeQuellen  Anteil der farbigen Quellen (zufällig Rot, Grün, Blau, Gelb, Cyan oder Magenta), die übrigen weiss
//   drehbar         drehbare Elemente im fertigen Level
//   arten           Gewichte der drehbaren Arten beim Ergänzen (ein Prisma nur auf Mischlicht, ein Kombinator nur auf
//                   einer Kreuzung zweier Strahlen)
//   filter          Filter auf den Strahlen (sie nehmen dem Licht dort eine Farbe)
//   festeSpiegel    feste Spiegel auf den Strahlen (sie lenken das Licht der Lösung)
//   ziele           Ziele; jeder endende Strahl bekommt eines, solange es nicht mehr als max sind
//   klicks          mindestens so viele Klicks von der Startstellung bis zur Lösung
//   reparaturen     höchstens so viele Reparaturen der Eindeutigkeit (Spec „Effizienz“: ab der dritten bringen sie kaum
//                   noch etwas)
//   schritte        höchstens so viele Schritte beim Verfeinern (Spec „Generator“: bei „leicht“ wenige oder keine)
//   maxSuche        so viele Knoten darf die Suche nach einer zweiten Lösung brauchen (wie im alten Generator)
// Ticket 20 trägt die übrigen Grade ein.
export const VORGABEN = {
  leicht: {
    quellen: [1, 3], farbigeQuellen: 0.4, drehbar: [3, 6], arten: { mirror: 7, prism: 2, combiner: 1 },
    filter: [0, 1], festeSpiegel: [0, 1], ziele: [1, 4], klicks: 3, reparaturen: 2, schritte: 2, maxSuche: 4e5,
  },
};

const bereich = (b) => Array.isArray(b) && b.length === 2 && b.every(Number.isInteger) && b[0] >= 0 && b[0] <= b[1];

/**
 * Prüft, ob eine Vorgabe ihre Untergrenzen erreichen kann (Spec „Effizienz“: Ein Profil des alten Generators konnte nie
 * ein Level liefern, weil sein Budget weniger drehbare Elemente setzte, als es verlangte). braucht: was der Baustein
 * der Kernidee mindestens setzt, { quellen, drehbar }. Rückgabe: die Mängel als Texte, leer, wenn sie taugt.
 * - Die Bereiche sind gültig, und es gibt mindestens eine Quelle, ein drehbares Element und ein Ziel.
 * - Der Baustein findet Platz: Die Vorgabe erlaubt so viele Quellen und drehbare Elemente, wie er braucht.
 * - Die Klicks sind erreichbar: Schon mit den wenigsten drehbaren Elementen und der Art mit den wenigsten Stellungen
 *   lässt sich die Startstellung so weit von der Lösung wegdrehen (je Element höchstens die halbe Zahl seiner
 *   Stellungen, wie clicksTo im Löser zählt).
 */
export function maengel(vorgaben, feldform, braucht = { quellen: 1, drehbar: 0 }) {
  const out = [];
  for (const name of ['quellen', 'drehbar', 'filter', 'festeSpiegel', 'ziele']) {
    if (!bereich(vorgaben[name])) out.push(`${name}: kein gültiger Bereich [min, max]`);
  }
  if (out.length) return out;
  if (vorgaben.quellen[0] < 1 || vorgaben.drehbar[0] < 1 || vorgaben.ziele[0] < 1) {
    out.push('Es braucht mindestens eine Quelle, ein drehbares Element und ein Ziel');
  }
  if (vorgaben.quellen[1] < braucht.quellen) out.push(`Der Baustein braucht ${braucht.quellen} Quellen`);
  if (vorgaben.drehbar[1] < braucht.drehbar) out.push(`Der Baustein braucht ${braucht.drehbar} drehbare Elemente`);
  const arten = Object.entries(vorgaben.arten).filter(([, g]) => g > 0).map(([type]) => type);
  if (!arten.length) out.push('arten: keine Art mit Gewicht');
  const probe = (type) => feldform.stellungen(feldform.element(feldform.zellen[0], { type })).length;
  const weit = Math.min(...arten.map(type => Math.floor(probe(type) / 2)));
  if (vorgaben.drehbar[0] * weit < vorgaben.klicks) {
    out.push(`${vorgaben.klicks} Klicks sind mit ${vorgaben.drehbar[0]} drehbaren Elementen nicht immer erreichbar`);
  }
  return out;
}
