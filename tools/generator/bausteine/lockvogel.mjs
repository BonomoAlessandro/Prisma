// Baustein „Lockvogel“ (Glossar, Ticket 19): ein festes Teil abseits der Lösung, das beim Probieren Licht bekommt. Die
// Beurteilung verlangt mehr (kernideen/lockvogel.mjs): Es bekommt in mindestens 10 % der Strahlbilder Licht, ebenso in
// 10 % der Holzwege (weite Fast-Lösungen), und ohne es hätte das Level eine zweite Lösung. Gezielt eingebaut als
// Ringtausch, in einen leeren Bau:
// - Drei Quellen derselben Farbe, je mit einem drehbaren Spiegel auf ihrem Weg, und drei Ziele in dieser Farbe. In der
//   Lösung bringt Spiegel i sein Licht zu Ziel i, in der anderen Stellung zu Ziel i + 1 (im Kreis). So gibt es zwei
//   Lösungen: die Lösung und den Ringtausch.
// - Auf einem Weg des Ringtauschs steht der Lockvogel, ein fester Spiegel (oder ein Blocker), auf einer Zelle ohne
//   Licht in der Lösung. Er verstellt den Ringtausch: Ohne ihn hätte das Level eine zweite Lösung. Beim Probieren
//   bekommt er Licht, sobald sein Spiegel in die Stellung des Ringtauschs dreht (ein Viertel der Strahlbilder), und der
//   Holzweg dahin (die beiden übrigen Spiegel im Ringtausch, er selbst schluckt das Licht des dritten) ist eine weite
//   Fast-Lösung: drei Spiegel anders als in der Lösung, alle Ziele bis auf eines leuchten.
// Alles gehört zur Kernidee, die Wege der Lösung und des Ringtauschs sind reserviert. Die Strahlen enden alle an
// Zielen; das Ergänzen setzt darum kaum etwas dazu. Ob der Lockvogel nötig ist, entscheidet die volle Beurteilung
// (teuer, wegen der Suche ohne Abschneiden).
import { setRot } from '../../solver.mjs';
import { FARBEN, strahl, auswege, einfall, bildMit, trifft, wegzellen, maske, lichtzellen } from './wege.mjs';

/** So oft versucht der Baustein höchstens, den Ringtausch einzubauen. */
const VERSUCHE = 80;
/** So oft werden je Versuch die drei Spiegel neu auf die Wege ihrer Quellen verteilt. */
const SPIEGELWAHL = 20;
/** So oft ist der Lockvogel ein fester Spiegel, sonst ein Blocker. */
const SPIEGEL = 0.7;

export default {
  kernidee: 'Lockvogel',
  braucht: { quellen: 3, drehbar: 3 },
  baue(bau) {
    const { R, feldform } = bau;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      bau.leere();
      const farbe = R.pick(FARBEN);
      const quellen = [0, 1, 2].map(() => quelleIrgendwohin(bau, farbe));
      if (!quellen.every(Boolean)) continue;
      // Je Quelle ein Spiegel auf ihrem ersten Abschnitt, auf keinem Weg einer anderen Quelle
      const wegVon = quellen.map(q => wegzellen(bau, bau.bildVon(q)));
      const plaetze = quellen.map((q, i) => strahl(bau, feldform.zelle(q), feldform.ausgang(q))
        .filter(z => !wegVon.some((w, j) => j !== i && w.has(z))));
      if (plaetze.some(p => !p.length)) continue;
      // Die Wege von den Quellen zu ihren Spiegeln bleiben frei
      const quellwege = new Set(quellen.flatMap(q => strahl(bau, feldform.zelle(q), feldform.ausgang(q))));
      let spiegel = [], fund = null;
      for (let wahl = 0; !fund && wahl < SPIEGELWAHL; wahl++) {
        for (const s of spiegel) { bau.kern.delete(s.m); bau.entferne(s.m); }
        spiegel = quellen.map((q, i) => ({
          m: bau.setze(feldform.element(R.pick(plaetze[i]), { type: 'mirror' }), { kern: true }),
          ein: feldform.ausgang(q),
        }));
        for (const s of spiegel) s.wege = auswege(bau, s.m, s.ein);
        if (spiegel.every(s => s.wege.length === 2)) fund = ringtausch(bau, spiegel, quellwege);
      }
      if (!fund) continue;
      for (const [i, s] of spiegel.entries()) setRot(s.m, fund.loesung[i].stellung);
      for (const z of fund.ziele) bau.setze(feldform.element(z, { type: 'target', color: farbe }), { kern: true });
      const tausch = new Map(spiegel.map((s, i) => [s.m, fund.tausch[i].stellung]));
      const alleZiele = (bild) => fund.ziele.every(z => trifft(bau, bild, z) === maske(farbe));
      if (!alleZiele(bau.bild()) || !alleZiele(bildMit(bau, null, tausch))) continue;
      if (!lockvogel(bau, spiegel, fund, tausch, farbe)) continue;
      for (const bild of [bau.bild(), bildMit(bau, null, tausch)]) {
        for (const z of wegzellen(bau, bild)) bau.reserviert.add(z);
      }
      bau.geaendert();
      return null;
    }
    return 'Lockvogel nicht eingebaut';
  },
};

/**
 * Sucht Stellungen und Ziele für den Ringtausch: je Spiegel i einen Weg der Lösung zu Ziel i und einen des Tauschs zu
 * Ziel i + 1; Ziel i liegt also auf dem Lösungsweg von Spiegel i und dem Tauschweg von Spiegel i − 1. Rückgabe: {
 * loesung, tausch: je Spiegel { stellung, richtung }, ziele: Zellen } oder null.
 */
function ringtausch(bau, spiegel, quellwege) {
  const { R, feldform } = bau;
  const wahlen = R.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
  for (const w of wahlen) {
    const loesung = spiegel.map((s, i) => s.wege[(w >> i) & 1]);
    const tausch = spiegel.map((s, i) => s.wege[1 - ((w >> i) & 1)]);
    const linie = (i, weg) => strahl(bau, feldform.zelle(spiegel[i].m), weg.richtung);
    const ziele = [];
    for (let i = 0; i < 3; i++) {
      const tauschLinie = new Set(linie((i + 2) % 3, tausch[(i + 2) % 3]));
      const moeglich = linie(i, loesung[i]).filter(z => tauschLinie.has(z) && !quellwege.has(z) && !ziele.includes(z));
      if (!moeglich.length) break;
      ziele.push(R.pick(moeglich));
    }
    if (ziele.length === 3) return { loesung, tausch, ziele };
  }
  return null;
}

/**
 * Setzt den Lockvogel auf den Tauschweg eines Spiegels, zwischen Spiegel und Ziel, auf eine Zelle ohne Licht in der
 * Lösung: einen festen Spiegel, der das Licht ablenkt, oder einen Blocker. Prüft, dass er in der Lösung kein Licht
 * bekommt und das Ziel im Ringtausch dann dunkel bleibt. Rückgabe: true, wenn es gelang (sonst ist nichts gesetzt).
 */
function lockvogel(bau, spiegel, fund, tausch, farbe) {
  const { R, feldform } = bau;
  const inLoesung = wegzellen(bau, bau.bild());
  for (const i of R.shuffle([0, 1, 2])) {
    const ziel = fund.ziele[(i + 1) % 3];
    // strahl hält vor dem ersten Element, also vor dem Ziel (oder vor einem anderen Ziel auf dem Tauschweg)
    const zellen = strahl(bau, feldform.zelle(spiegel[i].m), fund.tausch[i].richtung).filter(z => !inLoesung.has(z));
    for (const z of R.shuffle(zellen)) {
      let el = feldform.element(z, { type: 'blocker' });
      if (R.chance(SPIEGEL)) {
        const m = feldform.element(z, { type: 'mirror', fixed: true });
        const wege = auswege(bau, { ...m, fixed: false }, fund.tausch[i].richtung);
        if (wege.length) { setRot(m, R.pick(wege).stellung); el = m; }
      }
      bau.setze(el, { kern: true, lockvogel: true });
      const dunkel = trifft(bau, bildMit(bau, null, tausch), ziel) !== maske(farbe);
      if (dunkel && !bau.licht().has(z) && einfall(bau, bau.bild(), z) === null) return true;
      bau.kern.delete(el);
      bau.entferne(el);
    }
  }
  return false;
}

/**
 * Eine Quelle der Kernidee auf einen zufälligen freien Platz am Rand, in eine zufällige Richtung ins Feld, mit
 * mindestens drei freien Zellen davor (Platz für einen Spiegel und Licht dahinter). Anders als beim Ergänzen nicht
 * meist entlang des längsten Wegs: Drei Wege im Kreis kreuzen sich nur, wenn nicht alle Spiegel parallel lenken.
 * Rückgabe: die Quelle oder null.
 */
function quelleIrgendwohin(bau, farbe) {
  const licht = lichtzellen(bau); // einmal, nicht je Quellplatz (Review Ticket 19)
  const plaetze = bau.quellplaetze().filter(p => !bau.bei(p.zelle) && !licht.has(p.zelle)
    && strahl(bau, p.zelle, p.richtung).length >= 3);
  if (!plaetze.length) return null;
  const p = bau.R.pick(plaetze), q = bau.quelle(p.zelle, p.richtung, farbe);
  return q && bau.setze(q, { kern: true });
}
