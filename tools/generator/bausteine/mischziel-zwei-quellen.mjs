// Baustein „Mischziel aus zwei Quellen“ (Glossar, Ticket 18): ein Ziel, dessen Farbe nur entsteht, wenn sich Strahlen
// aus zwei verschiedenen Quellen darauf treffen. Gezielt eingebaut, in einen leeren Bau:
// - Zwei farbige Quellen, deren Farben zusammen eine Mischfarbe ergeben, die keine allein hat (PAARE: etwa Rot und Grün
//   für ein gelbes Ziel, Gelb und Cyan für ein weisses).
// - Auf den Weg jeder Quelle ein oder zwei drehbare Spiegel: Der Spieler muss das Licht erst zum Ziel bringen.
// - Das Ziel kommt auf eine Zelle, durch die das Licht beider Quellen läuft, je allein gemessen (die andere schluckt
//   dabei wie ein Blocker, wie in der Beurteilung). Mindestens einer der beiden Wege führt über einen Spiegel.
// - Quellen, Ziel und die Spiegel auf den beiden Wegen gehören zur Kernidee, die Zellen der Wege sind reserviert: Was
//   der Generator danach setzt, ändert diese Wege nicht. Spiegel hinter dem Ziel bekommen kein Licht mehr; sie gehören
//   nicht dazu und fallen beim Aufräumen weg.
// Ob die Kernidee nötig ist, entscheidet am Ende die Beurteilung (kernideen/mischziel-zwei-quellen.mjs). Ihre Regel ist
// nicht teuer und läuft darum schon in der günstigen Vorprüfung des Generators.
import { L } from '../../solver.mjs';
import { setzeQuelle, setzeDrehbar } from '../schritte.mjs';

/** Farbpaare der beiden Quellen: Jede hat eine Grundfarbe, die der anderen fehlt, zusammen eine Mischfarbe. */
const PAARE = [
  ['red', 'green'], ['red', 'blue'], ['green', 'blue'], ['red', 'cyan'], ['green', 'magenta'], ['blue', 'yellow'],
  ['yellow', 'cyan'], ['yellow', 'magenta'], ['cyan', 'magenta'],
];
/** So oft versucht der Baustein höchstens, die beiden Wege auf einer Zelle zusammenzubringen. */
const VERSUCHE = 12;

export default {
  kernidee: 'Mischziel aus zwei Quellen',
  braucht: { quellen: 2, drehbar: 1 },
  baue(bau) {
    const { R, feldform } = bau;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      bau.leere();
      const farben = R.shuffle([...R.pick(PAARE)]);
      const erste = setzeQuelle(bau, farben[0], { kern: true });
      const zweite = erste && setzeQuelle(bau, farben[1], { kern: true });
      if (!zweite) continue;
      const quellen = [erste, zweite];
      for (const q of quellen) {
        for (let n = R.int(1, 2); n > 0; n--) setzeDrehbar(bau, 'mirror', { zellen: bau.strahlzellen(bau.bildVon(q)) });
      }
      // Zellen auf dem Licht jeder Quelle allein; direkt: auf ihrem ersten Abschnitt, vor dem ersten Element
      const wege = quellen.map((q) => {
        const bild = bau.bildVon(q), zelle = feldform.zelle(q);
        const direkt = new Set(bild.strahlbild.segments.filter(s => feldform.abschnitt(s).von === zelle)
          .flatMap(s => feldform.durchlauf(s).map(d => d.zelle)));
        return { zellen: new Set(bau.strahlzellen(bild).map(c => c.zelle)), direkt };
      });
      const moeglich = [...wege[0].zellen]
        .filter(z => wege[1].zellen.has(z) && !(wege[0].direkt.has(z) && wege[1].direkt.has(z)));
      if (!moeglich.length) continue;
      const ziel = bau.setze(feldform.element(R.pick(moeglich), { type: 'target', color: 'white' }), { kern: true });
      const farbe = bau.bild().strahlbild.hits.get(bau.elemente.indexOf(ziel)) || 0;
      if (farbe !== (L.COLORS[farben[0]] | L.COLORS[farben[1]])) continue;
      ziel.color = L.COLOR_NAMES[farbe];
      for (const q of quellen) {
        const bild = bau.bildVon(q), licht = bau.licht(bild);
        for (const el of bau.drehbare()) if (licht.has(feldform.zelle(el))) bau.kern.add(el);
        for (const s of bild.strahlbild.segments) {
          for (const { zelle } of feldform.durchlauf(s)) bau.reserviert.add(zelle);
        }
      }
      bau.geaendert();
      return null;
    }
    return 'Mischziel nicht eingebaut';
  },
};
