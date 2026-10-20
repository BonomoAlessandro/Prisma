// Baustein „Falle“ (Glossar, Ticket 19): eine naheliegende Stellung eines Prismas oder Spiegels, die in die Irre führt.
// Gezielt eingebaut, in einen leeren Bau:
// - Eine Quelle mit Mischlicht (Gelb, Cyan, Magenta oder Weiss) und auf ihrem Weg ein drehbares Prisma.
// - Die Falle: In einer Stellung bricht das Prisma eine Grundfarbe direkt auf ein Ziel in dieser Farbe; das Ziel
//   leuchtet, mit einem einzigen Element (naheliegend wie beim Abschalten, kernideen/abschalten.mjs).
// - In der Lösung steht das Prisma anders, und dieselbe Grundfarbe derselben Quelle kommt auf längerem Weg über einen
//   drehbaren Spiegel zum Ziel. Die übrigen Grundfarben brechen in der Lösung in andere Richtungen; dort setzt das
//   Ergänzen fort. In der Falle laufen sie anderswohin, und die Ziele dort bleiben dunkel.
// - Der Holzweg (holzweg): Eine übrige Grundfarbe läuft in der Lösung über zwei drehbare Spiegel, deren zweiter auf
//   ihrem Strahl in der Falle steht. In der Falle bekommt er ihr Licht und lenkt es in einer anderen Stellung auf einen
//   Spiegel der Kernidee: drei drehbare Elemente anders als in der Lösung, nur ein Ziel dunkel. Ohne ihn fehlte meist
//   die weite Fast-Lösung, die die Beurteilung verlangt (1000 Seeds mit 24 Versuchen je Seed: 6 statt 318 Level).
// Quelle, Prisma, Spiegel und Ziel gehören zur Kernidee; reserviert sind der Weg zum Prisma, der Weg der Falle und der
// Weg der Lösung zum Ziel. Ob die Falle in die Irre führt (eine weite Fast-Lösung enthält sie, das Spielermodell
// widerlegt sie nicht auf den ersten Blick), entscheidet die volle Beurteilung (kernideen/falle.mjs, teuer).
import { L, setRot } from '../../solver.mjs';
import { setzeQuelle } from '../schritte.mjs';
import { strahl, auswege, bildMit, trifft, frei, maske } from './wege.mjs';

/** So oft versucht der Baustein höchstens, die Falle einzubauen. */
const VERSUCHE = 80;
/** Farben der Quelle: Mischlicht, damit das Prisma es zerlegt. */
const MISCHLICHT = ['yellow', 'cyan', 'magenta', 'white'];

/**
 * Fallen am Prisma in zelle für Licht der Farbe farbe aus Richtung ein: je Lösung und Falle { loesung, falle:
 * Stellungen, farbe: Grundfarbe (Maske), ziel: Zelle, kurz: Zellen des Wegs der Falle, spiegel: { zelle, stellung },
 * lang: Zellen des Wegs der Lösung }. Das Ziel liegt auf dem Strahl der Falle; den Strahl der Lösung lenkt ein Spiegel
 * dorthin.
 */
function fallen(bau, zelle, ein, farbe) {
  const { feldform } = bau, prisma = feldform.element(zelle, { type: 'prism' }), out = [];
  for (const loesung of feldform.stellungen(prisma)) {
    const lang = feldform.brechen(prisma, ein, farbe, loesung);
    if (!lang.length) continue;
    for (const falle of feldform.stellungen(prisma)) {
      if (falle === loesung) continue;
      for (const kurz of feldform.brechen(prisma, ein, farbe, falle)) {
        const weg = lang.find(o => o.farbe === kurz.farbe);
        if (!weg || weg.richtung === kurz.richtung) continue;
        const kurzLinie = strahl(bau, zelle, kurz.richtung);
        const langLinie = strahl(bau, zelle, weg.richtung, new Set(kurzLinie));
        for (const [i, m] of langLinie.entries()) {
          if (!frei(bau, m)) continue;
          const spiegel = feldform.element(m, { type: 'mirror' });
          for (const aus of auswege(bau, spiegel, weg.richtung)) {
            const weiter = strahl(bau, m, aus.richtung);
            for (const [j, ziel] of weiter.entries()) {
              const k = kurzLinie.indexOf(ziel);
              if (k < 0 || !frei(bau, ziel)) continue;
              out.push({ loesung, falle, farbe: kurz.farbe, ziel, kurz: kurzLinie.slice(0, k),
                spiegel: { zelle: m, stellung: aus.stellung },
                lang: [...langLinie.slice(0, i), ...weiter.slice(0, j)] });
            }
          }
        }
      }
    }
  }
  return out;
}

/**
 * Der Holzweg zur Falle: Eine übrige Grundfarbe läuft in der Lösung über zwei drehbare Spiegel weiter (das Ergänzen
 * setzt danach fort), und der zweite steht auf ihrem Strahl in der Falle. Wer bei der Falle bleibt, bringt diese
 * Grundfarbe so auf den zweiten Spiegel und von dort auf den ersten: drei Elemente anders als in der Lösung, und nur
 * ihr Ziel bleibt dunkel (eine weite Fast-Lösung, wie sie die Beurteilung der Falle verlangt). Rückgabe: true, wenn es
 * gelang (sonst ist nichts gesetzt).
 */
function holzweg(bau, a, prisma, f) {
  const { R, feldform } = bau, zelle = feldform.zelle(prisma), ein = feldform.ausgang(a);
  const loesung = feldform.brechen(prisma, ein, maske(a.color), f.loesung).filter(o => o.farbe !== f.farbe);
  const falle = feldform.brechen(prisma, ein, maske(a.color), f.falle);
  const wahl = [];
  for (const o of loesung) {
    const t = falle.find(x => x.farbe === o.farbe);
    if (!t || t.richtung === o.richtung) continue;
    const fallLinie = strahl(bau, zelle, t.richtung);
    for (const m1 of strahl(bau, zelle, o.richtung)) {
      // m1 steht auf dem Licht dieser Grundfarbe selbst (strahl: leer und nicht reserviert)
      for (const g of auswege(bau, feldform.element(m1, { type: 'mirror' }), o.richtung)) {
        for (const m2 of strahl(bau, m1, g.richtung)) {
          if (!fallLinie.includes(m2) || !frei(bau, m2)) continue;
          const el2 = feldform.element(m2, { type: 'mirror' });
          // In der Falle lenkt der zweite Spiegel in einer anderen Stellung als der Lösung auf den ersten oder auf den
          // Spiegel der Lösung zum Ziel der Falle
          const trifftSpiegel = (w) => {
            const linie = strahl(bau, m2, w.richtung), naechste = feldform.nachbar(linie.at(-1) ?? m2, w.richtung);
            return linie.includes(m1) || naechste === f.spiegel.zelle;
          };
          const zurueck = auswege(bau, el2, t.richtung).filter(trifftSpiegel);
          for (const h of auswege(bau, el2, g.richtung)) {
            if (!zurueck.some(w => w.stellung !== h.stellung) || !strahl(bau, m2, h.richtung).length) continue;
            wahl.push({ m1, s1: g.stellung, m2, s2: h.stellung });
          }
        }
      }
    }
  }
  for (const w of R.shuffle(wahl).slice(0, 4)) {
    const e1 = feldform.element(w.m1, { type: 'mirror' }), e2 = feldform.element(w.m2, { type: 'mirror' });
    setRot(e1, w.s1);
    setRot(e2, w.s2);
    bau.setze(e1, { kern: true });
    bau.setze(e2, { kern: true });
    const imLicht = bau.licht(bau.bildVon(a));
    if (imLicht.has(w.m1) && imLicht.has(w.m2) && trifft(bau, bau.bildVon(a), f.ziel) === f.farbe) return true;
    for (const e of [e1, e2]) { bau.kern.delete(e); bau.entferne(e); }
  }
  return false;
}

export default {
  kernidee: 'Falle',
  braucht: { quellen: 1, drehbar: 4 },
  baue(bau) {
    const { R, feldform } = bau;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      bau.leere();
      const a = setzeQuelle(bau, R.pick(MISCHLICHT), { kern: true });
      if (!a) continue;
      const vorP = strahl(bau, feldform.zelle(a), feldform.ausgang(a));
      const zelle = R.pick(vorP);
      const moeglich = fallen(bau, zelle, feldform.ausgang(a), maske(a.color))
        .filter(f => !vorP.includes(f.ziel) && !f.lang.some(z => vorP.includes(z)) && !vorP.includes(f.spiegel.zelle));
      if (!moeglich.length) continue;
      const f = R.pick(moeglich);
      const prisma = feldform.element(zelle, { type: 'prism' });
      setRot(prisma, f.loesung);
      bau.setze(prisma, { kern: true });
      const spiegel = feldform.element(f.spiegel.zelle, { type: 'mirror' });
      setRot(spiegel, f.spiegel.stellung);
      bau.setze(spiegel, { kern: true });
      bau.setze(feldform.element(f.ziel, { type: 'target', color: L.COLOR_NAMES[f.farbe] }), { kern: true });
      // Gegenprobe mit der Strahlregel: In der Lösung und in der Falle bekommt das Ziel genau seine Grundfarbe
      const falle = bildMit(bau, a, new Map([[prisma, f.falle]]));
      if (trifft(bau, bau.bildVon(a), f.ziel) !== f.farbe || trifft(bau, falle, f.ziel) !== f.farbe) continue;
      for (const z of [...vorP.slice(0, vorP.indexOf(zelle)), ...f.kurz, ...f.lang]) bau.reserviert.add(z);
      if (!holzweg(bau, a, prisma, f)) continue;
      bau.geaendert();
      return null;
    }
    return 'Falle nicht eingebaut';
  },
};
