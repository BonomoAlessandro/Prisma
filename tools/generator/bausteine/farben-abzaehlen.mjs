// Baustein „Farben abzählen“ (Glossar, Ticket 19): aus den Zielfarben folgern, welche Grundfarbe von welcher Quelle
// wohin muss. Die Beurteilung (kernideen/farben-abzaehlen.mjs) verlangt eine knappe Grundfarbe: genau so viele Quellen
// können sie an ein Ziel bringen, wie Ziele sie brauchen (mindestens zwei), und bei einer Quelle zeigt sich ihr Verlust
// an keinem einzelnen Ziel, weil die übrigen jedes Ziel noch erreichen könnten. Mit drei Quellen heisst das: Zwei davon
// erreichen jedes der drei Ziele. Gezielt eingebaut als Ring, in einen leeren Bau:
// - Vier drehbare Spiegel an den Ecken eines Rechtecks. Licht im Ring läuft von Ecke zu Ecke; an jeder Ecke biegt es
//   weiter oder verlässt den Ring nach aussen.
// - Zwei Quellen derselben Grundfarbe leuchten an zwei gegenüberliegenden Ecken in den Ring: Jede kann über den Ring
//   jeden Ausgang erreichen.
// - Ziele in dieser Grundfarbe an drei Ausgängen; eines davon bekommt sein Licht in der Lösung von einer dritten Quelle
//   derselben Farbe, über einen drehbaren Spiegel von aussen.
// - Die Stellungen der Lösung: die erste Belegung der vier Ecken, die alle Ziele erfüllt und jede Ecke beleuchtet.
// Alles gehört zur Kernidee, die Wege sind reserviert. Ob das Abzählen nötig ist, entscheidet die Beurteilung, schon in
// der günstigen Vorprüfung.
import { setRot, solve } from '../../solver.mjs';
import { strahl, auswege, zufuehren, trifft, wegzellen, frei, maske } from './wege.mjs';

/** So oft versucht der Baustein höchstens, den Ring einzubauen. */
const VERSUCHE = 400;
const GRUNDFARBEN = ['red', 'green', 'blue'];

/**
 * Ein Ring ab Ecke a: zuerst in Richtung r1 (laenge1 Schritte), dann r2 (laenge2), dann zurück. Rückgabe: die vier
 * Ecken [a, b, c, d] mit der Richtung, in der das Licht im Ring (im Uhrzeigersinn der Reihenfolge) ankommt, oder null,
 * wenn die Seiten nicht frei sind oder kein Spiegel an einer Ecke weiterbiegt.
 */
function ring(bau, a, r1, r2, laenge1, laenge2) {
  const { feldform } = bau;
  const seiten = [[r1, laenge1], [r2, laenge2], [bau.gegen[r1], laenge1], [bau.gegen[r2], laenge2]];
  const ecken = [], zellen = [];
  let z = a;
  for (const [r, n] of seiten) {
    ecken.push({ zelle: z, aus: r });
    for (let i = 0; i < n; i++) {
      z = feldform.nachbar(z, r);
      if (z === null) return null;
      if (i < n - 1) zellen.push(z);
    }
  }
  if (z !== a) return null;
  for (const [i, e] of ecken.entries()) e.ein = ecken[(i + 3) % 4].aus;
  const probe = feldform.element(a, { type: 'mirror' });
  if (ecken.some(e => !auswege(bau, probe, e.ein).some(w => w.richtung === e.aus))) return null;
  if (![...ecken.map(e => e.zelle), ...zellen].every(c => frei(bau, c))) return null;
  return { ecken, zellen };
}

export default {
  kernidee: 'Farben abzählen',
  braucht: { quellen: 3, drehbar: 5 },
  baue(bau) {
    const { R, feldform } = bau;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      bau.leere();
      const farbe = R.pick(GRUNDFARBEN);
      const r1 = R.pick(feldform.richtungen), r2 = R.pick(feldform.richtungen);
      const r = ring(bau, R.pick(feldform.zellen), r1, r2, R.int(2, 4), R.int(2, 4));
      if (!r) continue;
      const spiegel = r.ecken.map(e => bau.setze(feldform.element(e.zelle, { type: 'mirror' }), { kern: true }));
      const ringzellen = new Set([...r.zellen, ...r.ecken.map(e => e.zelle)]);
      // Ausgänge: je Ecke die andere Richtung, in die ein Spiegel das Licht aus dem Ring lenkt
      const ausgaenge = r.ecken.map((e, i) => {
        const w = auswege(bau, spiegel[i], e.ein).find(x => x.richtung !== e.aus);
        return w ? strahl(bau, e.zelle, w.richtung, ringzellen) : [];
      });
      // Zwei Quellen an gegenüberliegenden Ecken: Ihr Licht fällt so ein, dass eine Stellung es in den Ring lenkt
      const start = R.int(0, 1), quellen = [];
      for (const i of [start, start + 2]) {
        const e = r.ecken[i];
        const ein = R.shuffle(feldform.richtungen.filter(d => d !== e.ein && d !== bau.gegen[e.aus]
          && auswege(bau, spiegel[i], d).some(w => w.richtung === e.aus)));
        const belegt = new Set([...ringzellen, ...ausgaenge.flat()]);
        let q = null;
        for (const d of ein) {
          q = zufuehren(bau, e.zelle, d, { spiegel: 0, farbe, belegt });
          if (q) break;
        }
        if (!q) break;
        quellen.push(q.quelle);
      }
      if (quellen.length < 2) continue;
      // Drei Ziele an Ausgängen, die noch frei sind
      const plaetze = ausgaenge.map(a => a.filter(z => frei(bau, z)));
      const mitPlatz = R.shuffle([0, 1, 2, 3].filter(i => plaetze[i].length));
      if (mitPlatz.length < 3) continue;
      const ziele = mitPlatz.slice(0, 3)
        .map(i => bau.setze(feldform.element(R.pick(plaetze[i]), { type: 'target', color: farbe }), { kern: true }));
      // Die dritte Quelle bringt einem Ziel von aussen Licht, über einen Spiegel
      const fuer = R.pick(ziele), zelle = feldform.zelle(fuer);
      let dritte = null;
      for (const d of R.shuffle([...feldform.richtungen])) {
        dritte = zufuehren(bau, zelle, d, { spiegel: 1, farbe, belegt: ringzellen });
        if (dritte) break;
      }
      if (!dritte) continue;
      // Lösung: eine Belegung der vier Ecken, die alle Ziele erfüllt und jede Ecke beleuchtet
      if (!loese(bau, spiegel, ziele, maske(farbe))) continue;
      // Eindeutig schon ohne Reparatur: Ein fest gewordener Eckspiegel nähme einer Quelle den Weg durch den Ring
      if (solve(bau.level(), { unique: true, collect: 0 }).count !== 1) continue;
      for (const z of wegzellen(bau, bau.bild())) bau.reserviert.add(z);
      for (const z of ringzellen) bau.reserviert.add(z);
      bau.geaendert();
      return null;
    }
    return 'Farben abzählen nicht eingebaut';
  },
};

/**
 * Setzt die Ecken in die erste Belegung, die alle Ziele erfüllt und jede Ecke beleuchtet; false, wenn es keine gibt.
 */
function loese(bau, spiegel, ziele, farbe) {
  const { feldform } = bau, n = feldform.stellungen(spiegel[0]).length;
  for (let k = 0; k < n ** spiegel.length; k++) {
    spiegel.forEach((m, i) => setRot(m, Math.floor(k / n ** i) % n));
    bau.geaendert();
    const bild = bau.bild(), licht = bau.licht(bild);
    const erfuellt = ziele.every(t => trifft(bau, bild, feldform.zelle(t)) === farbe);
    if (erfuellt && spiegel.every(m => licht.has(feldform.zelle(m)))) return true;
  }
  return false;
}
