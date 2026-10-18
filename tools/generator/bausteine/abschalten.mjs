// Baustein „Abschalten“ (Glossar, Ticket 19): Ein Ziel bekommt Licht in der Farbe des Ziels und leuchtet schon, doch
// die Lösung verlangt, dieses Licht wegzunehmen. Gezielt eingebaut, in einen leeren Bau:
// - Eine Quelle A mit einem drehbaren Spiegel auf ihrem Weg. In der Lösung lenkt er ihr Licht weiter (das Ergänzen
//   setzt dort fort, am Ende kommt ein Ziel).
// - Der Zwischenstand: In einer anderen Stellung lenkt derselbe Spiegel das Licht von A auf kurzem Weg auf ein Ziel in
//   der Farbe von A. Ein Spiegel genügt, so ist er ein kurzer Strang (abschalten.mjs der Beurteilung: höchstens drei).
// - In der Lösung bekommt das Ziel dieselbe Farbe aus einer zweiten Quelle B über zwei drehbare Spiegel: länger als der
//   Zwischenstand, und die Lösung nimmt dem Ziel das Licht von A weg.
// Quellen, Ziel und die drei Spiegel gehören zur Kernidee; reserviert sind der Weg von A zum Spiegel, die Abkürzung und
// der Weg von B, damit nichts den Zwischenstand oder die Lösung des Ziels verstellt. Ob die Kernidee nötig ist,
// entscheidet die Beurteilung (kernideen/abschalten.mjs), schon in der günstigen Vorprüfung.
// Ab „mittel“ (vorgaben.andocken, Ticket 28):
// - Der Strahl von A bekommt in der Lösung immer ein eigenes Ziel. Endete er offen und fand das Ergänzen dort keinen
//   Platz für ein Ziel, war der Zwischenstand eine zweite Lösung (A erfüllt das Ziel, B auch, sonst fehlte nichts):
//   Das Festigen machte den Spiegel von A fest, und A wurde wirkungslos. So war es in jedem Fall von „Kernidee
//   wirkungslos“ bei mittel-abschalten (Seeds 1–40), zusammen 20 von 100 Seeds.
// - A und ihr Spiegel bleiben, wie sie sind (bau.unberuehrt): kein Prisma davor, kein fremdes Licht darauf, nicht fest.
//   Sonst gibt es keinen kurzen, sauberen Zwischenstand mehr („Kernidee nicht nötig“).
// - Dieses Ziel bekommt A über einen zweiten drehbaren Spiegel der Kernidee auf ihrem Strahl (nicht unberührt), an den
//   gleich fremdes Licht andockt (andocken.mjs: eine neue Quelle in einer Farbe ohne die Grundfarben der Ziele der
//   Kernidee). Ohne ihn ist der Strang von A ein Füllteil, an dem „schwerer“ nichts andocken kann (Review Ticket 28:
//   bei mittel-abschalten, Seeds 1–600, in 404 Seeds bei der ersten Beurteilung, in 247 noch am Ende). Geht er nicht,
//   kommt das Ziel gleich auf den Strahl von A. Der Weg dorthin ist reserviert: Ein Element auf einer Kreuzung dort
//   (verbinden) nähme dem Ziel das Licht.
// Nicht über B: Kommt A über einen Spiegel von B an ihr Ziel (gleiche Farbe), tauschen A und B oft ihre Ziele, und das
// ist eine zweite Lösung (erzwungen, Seeds 201–400: „zweite Lösung nicht blockierbar“ bei mittel 33 statt 9, bei
// schwer 72 statt 20). Aus demselben Grund geht keine Weiche, in der B über den Spiegel von A ans Ziel kommt: Von den
// vier Stellungen eines Spiegels lenken nur zwei das Licht von A um, und sie stehen senkrecht zueinander. Im
// Zwischenstand tauschten A und B ihre Ziele (in einer Probe 100 von 100 Seeds verworfen).
import { getRot } from '../../solver.mjs';
import { setzeQuelle, setzeDrehbar } from '../schritte.mjs';
import { dockeAn } from '../andocken.mjs';
import {
  FARBEN, strahl, auswege, einfall, zufuehren, reserviere, bildMit, trifft, wegzellen, frei, maske,
} from './wege.mjs';

/** So oft versucht der Baustein höchstens, die Kernidee einzubauen. */
const VERSUCHE = 12;
/** So oft bekommt der Strahl von A in der Lösung gleich ein Ziel, statt offen zu enden. */
const GLEICH_ZIEL = 0.5;

export default {
  kernidee: 'Abschalten',
  andocken: {},
  braucht: { quellen: 2, drehbar: 3 },
  baue(bau, plan, vorgaben) {
    const { R, feldform } = bau, immerZiel = !!vorgaben?.andocken;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      bau.leere();
      const farbe = R.pick(FARBEN);
      const a = setzeQuelle(bau, farbe, { kern: true });
      const m = a && setzeDrehbar(bau, 'mirror', { zellen: bau.strahlzellen(bau.bildVon(a)), kern: true });
      if (!m) continue;
      const zelle = feldform.zelle(m), ein = einfall(bau, bau.bildVon(a), zelle), loesung = getRot(m);
      const vorA = wegzellen(bau, bau.bildVon(a));
      // Die Abkürzung: eine andere Stellung, deren Strahl frei bis zu einer Zelle für das Ziel läuft
      const plaetze = auswege(bau, m, ein).filter(w => w.stellung !== loesung)
        .flatMap(w => strahl(bau, zelle, w.richtung)
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
      // Wohin A in der Lösung leuchtet: Halb so oft (GLEICH_ZIEL) bekommt der Strahl gleich ein Ziel (keines der
      // Kernidee), sonst endet er offen, und das Ergänzen setzt dort fort. Ohne Ziel am Ende wäre A wirkungslos. Ab
      // „mittel“ immer, über einen zweiten Spiegel (siehe oben).
      const aus = feldform.spiegeln(m, ein), weiter = strahl(bau, zelle, aus);
      if (!weiter.length) continue;
      if (immerZiel) {
        bau.unberuehrt.add(a);
        bau.unberuehrt.add(m);
        // Der zweite Spiegel auf dem Strahl von A, wenn er ihn auf freie Zellen lenkt; der Weg zu ihm ist reserviert
        let linie = weiter;
        const aufWeg = new Set(weiter);
        const zellen = bau.strahlzellen(bau.bildVon(a)).filter(c => aufWeg.has(c.zelle));
        const n = setzeDrehbar(bau, 'mirror', { zellen });
        if (n) {
          const zn = feldform.zelle(n), nach = strahl(bau, zn, feldform.spiegeln(n, aus));
          if (nach.length) {
            bau.kern.add(n);
            for (const z of weiter.slice(0, weiter.indexOf(zn))) bau.reserviert.add(z);
            linie = nach;
          } else bau.entferne(n);
        }
        // Das Ziel von A, der Weg dorthin reserviert; fremdes Licht auf den zweiten Spiegel (gelingt es nicht, kann
        // „schwerer“ es später andocken)
        const x = R.pick(linie.slice(-3));
        bau.setze(feldform.element(x, { type: 'target', color: farbe }));
        for (const z of linie.slice(0, linie.indexOf(x))) bau.reserviert.add(z);
        if (linie !== weiter) {
          dockeAn(bau, [feldform.zelle(n)], { quellen: vorgaben.quellen[1], farbigeQuellen: vorgaben.farbigeQuellen });
        }
      } else if (R.chance(GLEICH_ZIEL)) {
        bau.setze(feldform.element(R.pick(weiter.slice(-3)), { type: 'target', color: farbe }));
      }
      bau.geaendert();
      return null;
    }
    return 'Abschalten nicht eingebaut';
  },
};
