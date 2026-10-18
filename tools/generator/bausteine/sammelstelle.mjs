// Baustein „Sammelstelle“ (Glossar, Ticket 19): ein Prisma, das Licht aus mehreren Richtungen sammelt und neu verteilt.
// Gezielt eingebaut, in einen leeren Bau:
// - Ein drehbares Prisma und eine Stellung, in der es Licht aus zwei Richtungen bricht (aus keiner verschwindet es an
//   der Rückseite) und beide Zuläufe verschieden weitergibt; hinter jedem austretenden Strahl ist Platz.
// - Je Richtung eine Quelle mit null oder einem drehbaren Spiegel davor (zufuehren, wege.mjs), in zufälliger Farbe.
//   Wohin das Prisma das Licht verteilt, setzt das Ergänzen fort; an den Enden der Strahlen kommen die Ziele.
// Quellen, Prisma und Spiegel gehören zur Kernidee, die Wege zum Prisma sind reserviert. Ob die Sammelstelle nötig ist
// (ohne den Zulauf aus mindestens zwei Richtungen verliert je ein Ziel seine Farbe), entscheidet die Beurteilung
// (kernideen/sammelstelle.mjs), schon in der günstigen Vorprüfung.
import { L, setRot } from '../../solver.mjs';
import { FARBEN, frei, zufuehren, maske, strahl, trifft } from './wege.mjs';

/** So oft versucht der Baustein höchstens, die Kernidee einzubauen. */
const VERSUCHE = 24;

/** Stellungen und Zuläufe eines Prismas in zelle: [{ stellung, zulauf: [{ richtung, farbe }] }] mit zwei Zuläufen. */
function moeglichkeiten(bau, zelle, farben) {
  const { feldform } = bau, prisma = feldform.element(zelle, { type: 'prism' });
  const platz = (o) => {
    const z = feldform.nachbar(zelle, o.richtung);
    return z !== null && frei(bau, z);
  };
  const out = [];
  for (const stellung of feldform.stellungen(prisma)) {
    for (const d1 of feldform.richtungen) {
      for (const d2 of feldform.richtungen) {
        if (d2 <= d1) continue;
        const aus = [d1, d2].map((d, i) => feldform.brechen(prisma, d, maske(farben[i]), stellung));
        if (aus.some(a => !a.length || !a.every(platz))) continue;
        // Dieselbe Grundfarbe in dieselbe Richtung aus beiden Zuläufen: Dort ersetzte der eine den anderen
        if (aus[0].some(o => aus[1].some(p => p.richtung === o.richtung && (p.farbe & o.farbe)))) continue;
        out.push({ stellung, zulauf: [{ richtung: d1, farbe: farben[0] }, { richtung: d2, farbe: farben[1] }] });
      }
    }
  }
  return out;
}

/**
 * Je Zulauf ein Ziel der Kernidee auf einem der Strahlen, die das Prisma aus ihm bricht, nahe dem Ende des freien Wegs;
 * die Zellen bis dahin sind reserviert. So bekommt jeder Zulauf ein eigenes Ziel, das ohne ihn seine Farbe verliert.
 * Rückgabe: true, wenn beide Ziele ihr Licht bekommen.
 */
function setzeZiele(bau, zelle, quellen) {
  const { R, feldform } = bau, ziele = [], wege = [];
  for (const q of quellen) {
    const aus = bau.bildVon(q).strahlbild.segments.filter(s => feldform.abschnitt(s).von === zelle)
      .map(s => ({ farbe: s.color, linie: strahl(bau, zelle, bau.laufrichtung(s), new Set(ziele)) }))
      .filter(a => a.linie.length);
    if (!aus.length) return false;
    const { farbe, linie } = R.pick(aus), i = Math.max(0, linie.length - 1 - R.int(0, 2));
    ziele.push(linie[i]);
    wege.push(...linie.slice(0, i));
    bau.setze(feldform.element(linie[i], { type: 'target', color: L.COLOR_NAMES[farbe] }), { kern: true });
  }
  const bild = bau.bild();
  if (ziele.some(z => !trifft(bau, bild, z))) return false;
  for (const z of wege) bau.reserviert.add(z);
  return true;
}

export default {
  kernidee: 'Sammelstelle',
  braucht: { quellen: 2, drehbar: 1 },
  baue(bau) {
    const { R, feldform } = bau;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      bau.leere();
      const zelle = R.pick(feldform.zellen);
      const wahl = R.shuffle(moeglichkeiten(bau, zelle, [R.pick(FARBEN), R.pick(FARBEN)])).slice(0, 6);
      for (const { stellung, zulauf } of wahl) {
        const prisma = feldform.element(zelle, { type: 'prism' });
        setRot(prisma, stellung);
        bau.setze(prisma, { kern: true });
        const belegt = new Set(), wege = [];
        for (const { richtung, farbe } of R.shuffle([...zulauf])) {
          let weg = null;
          for (const spiegel of R.shuffle([0, 1])) {
            weg = zufuehren(bau, zelle, richtung, { spiegel, farbe, belegt });
            if (weg) break;
          }
          if (!weg) break;
          wege.push(weg);
          for (const z of weg.weg) belegt.add(z);
        }
        if (wege.length === 2 && setzeZiele(bau, zelle, wege.map(w => w.quelle))) {
          for (const z of belegt) bau.reserviert.add(z);
          bau.geaendert();
          return null;
        }
        bau.leere();
      }
    }
    return 'Sammelstelle nicht eingebaut';
  },
};
