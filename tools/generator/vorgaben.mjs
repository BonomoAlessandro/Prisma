// Vorgaben je Schwierigkeitsgrad für den Generator (Ticket 18): wie gross ein Level wird und welche Untergrenzen es
// erreichen muss. Sie ersetzen die Profile des alten Generators (Grössenstufe × Mischung): Je Grad gibt es eine
// Vorgabe, die Mischung der Elemente wählt der Zufall nach Gewichten. Ob der Grad stimmt, entscheidet am Ende allein
// die Beurteilung (grad.mjs); die Vorgaben legen nur fest, wo der Generator anfängt. Die Quellen aber hält jedes
// gelieferte Level ein, beide Grenzen (siehe unten).
//
// Bereiche als [min, max]:
//   quellen         Zahl der Quellen, auch im fertigen Level
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
//   verbinden       ab „mittel“: Anteil der drehbaren Elemente, die das Ergänzen auf eine Kreuzung offener Strahlenden
//                   setzt, wo es eine gibt (kreuzungszellen in schritte.mjs); das verbindet Stränge gegen Füllteil und
//                   Zerfall. Ohne Angabe nie (so bleibt „leicht“ wie in Ticket 18).
//   wachsen         ab „mittel“: so oft wächst ein Bau unter der Untergrenze mit dem Schritt „schwerer“, bevor er als
//                   zu klein verworfen wird (ohne Angabe nie)
//   andocken        ab „mittel“ (Ticket 28): Die Bausteine bauen ihre Kernidee so, dass ihre Stränge verbunden sind
//                   (Abschalten, Farben abzählen, Lockvogel), und „schwerer“ dockt Stränge der Kernidee an, wenn ihr
//                   Baustein es will (baustein.andocken; andocken.mjs). Auch das Andocken bleibt in quellen (sind
//                   alle belegt, weicht eine Quelle ausserhalb der Kernidee; plan.andocken in index.mjs). Ohne Angabe
//                   nie (so bleibt „leicht“ bitgleich).
//   abkuerzen       ab „mittel“ (Ticket 28, Fund 2 aus dem Review von Ticket 20): Ein Versuch von „schwerer“ ohne ein
//                   drehbares Element mehr endet vor dem Festigen. Ohne Angabe festigt er (so bleibt „leicht“ mit
//                   Ziel-Schwierigkeit bitgleich).
// Die Grade ab „mittel“ (Ticket 20) folgen den Leveln im Spiel: drehbare Elemente dort im Median 7 / 9 / 11 (Bereich
// 5–8, 7–12, 9–14), Quellen 2–4, Ziele meist 3–5, mehr Prismen in den schweren. Die Vorgabe für „schwer“ endet bei 11:
// Mit 7–12 lieferte „schwer“ 48 statt 67 Level aus 300 Seeds bei mehr CPU-Zeit (Review Ticket 20).
// Die Quellen gelten auch für das fertige Level, denn im Spiel hat kein Level ab „mittel“ weniger als zwei und kein
// mittleres mehr als drei. Die Obergrenze halten Ergänzen, „schwerer“ und Andocken ein (Review Ticket 28, M2). Unter
// die Untergrenze kommt ein Level, wenn das Festigen eine Quelle als wirkungslos wegnimmt; dann verwirft es der
// Generator am Ende mit „zu wenige Quellen“ (Ticket 29: von den Aufträgen ab „mittel“ mit je 500 Seeds nur
// mittel-falle, 2 von 76 Leveln).
// Die Klicks steigen mit der Grösse. maxSuche ist ab „schwer“ kleiner: Grosse Bauten mit zu grosser Suche brachten mit
// 6e5 bzw. 8e5 Knoten nicht mehr Level als mit 2e5, kosteten aber bis 1,8-mal so viel. Reparaturen bleiben bei 2: Mit
// 1, 2, 3 und 4 lieferten mittel-mischziel 168, 168, 168, 168 (von 300 Seeds), schwer-mischziel 67, 68, 68, 67 und
// schwer 35, 36, 37, 38 (von 150).
export const VORGABEN = {
  leicht: {
    quellen: [1, 3], farbigeQuellen: 0.4, drehbar: [3, 6], arten: { mirror: 7, prism: 2, combiner: 1 },
    filter: [0, 1], festeSpiegel: [0, 1], ziele: [1, 4], klicks: 3, reparaturen: 2, schritte: 2, maxSuche: 4e5,
  },
  mittel: {
    quellen: [2, 3], farbigeQuellen: 0.4, drehbar: [5, 8], arten: { mirror: 6, prism: 2, combiner: 1 },
    filter: [0, 1], festeSpiegel: [0, 2], ziele: [2, 5], klicks: 4, reparaturen: 2, schritte: 4, maxSuche: 4e5,
    verbinden: 0.7, wachsen: 4, andocken: true, abkuerzen: true,
  },
  schwer: {
    quellen: [2, 4], farbigeQuellen: 0.4, drehbar: [7, 11], arten: { mirror: 5, prism: 3, combiner: 1 },
    filter: [0, 1], festeSpiegel: [0, 2], ziele: [3, 5], klicks: 5, reparaturen: 2, schritte: 6, maxSuche: 2e5,
    verbinden: 0.7, wachsen: 8, andocken: true, abkuerzen: true,
  },
  'sehr schwer': {
    quellen: [2, 4], farbigeQuellen: 0.4, drehbar: [9, 14], arten: { mirror: 5, prism: 4, combiner: 1 },
    filter: [0, 1], festeSpiegel: [0, 2], ziele: [3, 5], klicks: 6, reparaturen: 2, schritte: 8, maxSuche: 2e5,
    verbinden: 0.7, wachsen: 10, andocken: true, abkuerzen: true,
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
