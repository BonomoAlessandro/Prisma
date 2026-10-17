// Baustein „Abschalten“ (Glossar, Ticket 19): Ein Ziel bekommt Licht in der Farbe des Ziels und leuchtet schon, doch die
// Lösung verlangt, dieses Licht wegzunehmen. Gezielt eingebaut, in einen leeren Bau:
// - Eine Quelle A mit einem drehbaren Spiegel auf ihrem Weg. In der Lösung lenkt er ihr Licht weiter (das Ergänzen
//   setzt dort fort, am Ende kommt ein Ziel).
// - Der Zwischenstand: In einer anderen Stellung lenkt derselbe Spiegel das Licht von A auf kurzem Weg auf ein Ziel in
//   der Farbe von A. Ein Spiegel genügt, so ist er ein kurzer Strang (abschalten.mjs der Beurteilung: höchstens drei).
// - In der Lösung bekommt das Ziel dieselbe Farbe aus einer zweiten Quelle B über zwei drehbare Spiegel: länger als der
//   Zwischenstand, und die Lösung nimmt dem Ziel das Licht von A weg.
// Quellen, Ziel und die drei Spiegel gehören zur Kernidee; reserviert sind der Weg von A zum Spiegel, die Abkürzung und
// der Weg von B, damit nichts den Zwischenstand oder die Lösung des Ziels verstellt. Ob die Kernidee nötig ist,
// entscheidet die Beurteilung (kernideen/abschalten.mjs), schon in der günstigen Vorprüfung.
import { getRot } from '../../solver.mjs';
import { setzeQuelle, setzeDrehbar } from '../schritte.mjs';
import { FARBEN, strahl, auswege, einfall, zufuehren, reserviere, bildMit, trifft, wegzellen, frei, maske } from './wege.mjs';

/** So oft versucht der Baustein höchstens, die Kernidee einzubauen. */
const VERSUCHE = 12;
/** So oft bekommt der Strahl von A in der Lösung gleich ein Ziel, statt offen zu enden. */
const GLEICH_ZIEL = 0.5;

export default {
  kernidee: 'Abschalten',
  braucht: { quellen: 2, drehbar: 3 },
  baue(bau) {
    const { R, feldform } = bau;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      bau.leere();
      const farbe = R.pick(FARBEN);
      const a = setzeQuelle(bau, farbe, { kern: true });
      const m = a && setzeDrehbar(bau, 'mirror', { zellen: bau.strahlzellen(bau.bildVon(a)), kern: true });
      if (!m) continue;
      const zelle = feldform.zelle(m), ein = einfall(bau, bau.bildVon(a), zelle), loesung = getRot(m);
      const vorA = wegzellen(bau, bau.bildVon(a));
      // Die Abkürzung: eine andere Stellung, deren Strahl frei bis zu einer Zelle für das Ziel läuft
      const plaetze = auswege(bau, m, ein).filter(w => w.stellung !== loesung).flatMap(w => strahl(bau, zelle, w.richtung)
        .map((z, i, linie) => ({ ...w, ziel: z, abkuerzung: linie.slice(0, i) })))
        .filter(p => !vorA.has(p.ziel) && frei(bau, p.ziel));
      if (!plaetze.length) continue;
      const p = R.pick(plaetze);
      bau.setze(feldform.element(p.ziel, { type: 'target', color: farbe }), { kern: true });
      const richtungen = R.shuffle([...feldform.richtungen]).filter(r => r !== p.richtung);
      let b = null;
      for (const r of richtungen) {
        b = zufuehren(bau, p.ziel, r, { spiegel: 2, farbe, belegt: new Set(p.abkuerzung) });
        if (b) break;
      }
      if (!b) continue;
      // Gegenprobe mit der Strahlregel: In der Lösung bringt nur B dem Ziel seine Farbe, im Zwischenstand A allein
      const kurz = new Map([[m, p.stellung]]);
      if (trifft(bau, bau.bild(), p.ziel) !== maske(farbe) || trifft(bau, bau.bildVon(a), p.ziel)
        || trifft(bau, bildMit(bau, a, kurz), p.ziel) !== maske(farbe)) continue;
      reserviere(bau, bau.bildVon(b.quelle));
      const bisM = bau.bildVon(a).strahlbild.segments.filter(s => feldform.abschnitt(s).bis === zelle);
      for (const s of bisM) for (const { zelle: z } of feldform.durchlauf(s)) bau.reserviert.add(z);
      for (const z of p.abkuerzung) bau.reserviert.add(z);
      // Wohin A in der Lösung leuchtet: Meist endet der Strahl offen, und das Ergänzen setzt dort fort. Sonst bekommt er
      // gleich ein Ziel (keines der Kernidee): Ohne Ziel am Ende wäre A wirkungslos.
      const weiter = strahl(bau, zelle, feldform.spiegeln(m, ein));
      if (!weiter.length) continue;
      if (R.chance(GLEICH_ZIEL)) {
        bau.setze(feldform.element(R.pick(weiter.slice(-3)), { type: 'target', color: farbe }));
      }
      bau.geaendert();
      return null;
    }
    return 'Abschalten nicht eingebaut';
  },
};
