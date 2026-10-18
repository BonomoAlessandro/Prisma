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
// Ab „mittel“ (vorgaben.andocken, Ticket 28) ein Weichenring: Drei Quellen leuchten an drei Ecken in den Ring, zwei in
// der Grundfarbe, eine in einer Mischung, die sie enthält (die Leitfarbe); Ziele an drei Ausgängen. Eine Ecke mit
// eigener Quelle ist eine Weiche: In der einen Stellung schickt sie das Licht aus dem Ring hinaus und lässt ihre Quelle
// hinein, in der anderen lässt sie den Ring weiterlaufen und schickt ihre Quelle hinaus. So teilen sich die Stränge
// Ecken, und keiner ist ein Füllteil; im alten Ring liefen die Stränge der beiden Quellen und der dritten von aussen
// meist getrennt (bei mittel-abzaehlen bis zu 77 von 100 Seeds mit Füllteil). Drei Quellen derselben Farbe hätten
// mehrere Lösungen (sie tauschen ihre Ziele); die Leitfarbe legt fest, welches Ziel die gemischte Quelle bekommt.
import { setRot, solve } from '../../solver.mjs';
import { strahl, auswege, zufuehren, trifft, wegzellen, frei, maske, FARBEN } from './wege.mjs';

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

/**
 * Beginnt einen Versuch: leert den Bau und setzt die vier Eckspiegel eines zufälligen Rings (Kernidee). Rückgabe: null
 * oder { farbe: Grundfarbe, r: ring, spiegel, ringzellen, ausgaenge: je Ecke die Zellen ihres Ausgangs }.
 */
function rahmen(bau) {
  const { R, feldform } = bau;
  bau.leere();
  const farbe = R.pick(GRUNDFARBEN);
  const r1 = R.pick(feldform.richtungen), r2 = R.pick(feldform.richtungen);
  const r = ring(bau, R.pick(feldform.zellen), r1, r2, R.int(2, 4), R.int(2, 4));
  if (!r) return null;
  const spiegel = r.ecken.map(e => bau.setze(feldform.element(e.zelle, { type: 'mirror' }), { kern: true }));
  const ringzellen = new Set([...r.zellen, ...r.ecken.map(e => e.zelle)]);
  // Ausgänge: je Ecke die andere Richtung, in die ein Spiegel das Licht aus dem Ring lenkt
  const ausgaenge = r.ecken.map((e, i) => {
    const w = auswege(bau, spiegel[i], e.ein).find(x => x.richtung !== e.aus);
    return w ? strahl(bau, e.zelle, w.richtung, ringzellen) : [];
  });
  return { farbe, r, spiegel, ringzellen, ausgaenge };
}

/**
 * Eine Quelle der Farbe farbe, deren Licht an Ecke i so einfällt, dass eine Stellung des Eckspiegels es in den Ring
 * lenkt; ihr Weg meidet Ring und Ausgänge. Rückgabe: die Quelle oder null.
 */
function quelleAnEcke(bau, { r, spiegel, ringzellen, ausgaenge }, i, farbe) {
  const { R, feldform } = bau, e = r.ecken[i];
  const ein = R.shuffle(feldform.richtungen.filter(d => d !== e.ein && d !== bau.gegen[e.aus]
    && auswege(bau, spiegel[i], d).some(w => w.richtung === e.aus)));
  const belegt = new Set([...ringzellen, ...ausgaenge.flat()]);
  for (const d of ein) {
    const q = zufuehren(bau, e.zelle, d, { spiegel: 0, farbe, belegt });
    if (q) return q.quelle;
  }
  return null;
}

export default {
  kernidee: 'Farben abzählen',
  andocken: { fremdfarbe: true },
  braucht: { quellen: 3, drehbar: 5 },
  baue(bau, plan, vorgaben) {
    if (vorgaben?.andocken) return weichenring(bau);
    const { R, feldform } = bau;
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      const rr = rahmen(bau);
      if (!rr) continue;
      const { farbe, spiegel, ringzellen, ausgaenge } = rr;
      // Zwei Quellen an gegenüberliegenden Ecken: Ihr Licht fällt so ein, dass eine Stellung es in den Ring lenkt
      const start = R.int(0, 1), quellen = [];
      for (const i of [start, start + 2]) {
        const q = quelleAnEcke(bau, rr, i, farbe);
        if (!q) break;
        quellen.push(q);
      }
      if (quellen.length < 2) continue;
      // Drei Ziele an Ausgängen, die noch frei sind
      const plaetze = ausgaenge.map(a => a.filter(z => frei(bau, z)));
      const mitPlatz = R.shuffle([0, 1, 2, 3].filter(i => plaetze[i].length));
      if (mitPlatz.length < 3) continue;
      const ziele = mitPlatz.slice(0, 3)
        .map(i => bau.setze(feldform.element(R.pick(plaetze[i]), { type: 'target', color: farbe }), { kern: true }));
      // Die dritte Quelle bringt einem Ziel von aussen Licht, über einen Spiegel. Sie und ihr Spiegel meiden auch die
      // Ausgänge: Auf einem Ausgang zwischen Ecke und Ziel verstellten sie dem Ring dieses Ziel, und der Verlust einer
      // Ringquelle zeigte sich doch an einem Ziel (Review Ticket 19: sonst 14 % „Kernidee nicht nötig“).
      const fuer = R.pick(ziele), zelle = feldform.zelle(fuer);
      const meiden = new Set([...ringzellen, ...ausgaenge.flat()]);
      let dritte = null;
      for (const d of R.shuffle([...feldform.richtungen])) {
        dritte = zufuehren(bau, zelle, d, { spiegel: 1, farbe, belegt: meiden });
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

/** Mischungen, die eine Grundfarbe enthalten (die Leitfarbe des Weichenrings). */
const mischungenMit = (farbe) => FARBEN.filter(f => (maske(f) & maske(farbe)) && f !== farbe);

/**
 * Der Weichenring ab „mittel“ (Ticket 28): drei Quellen an drei Ecken, eine davon in der Leitfarbe, Ziele an drei
 * Ausgängen; die Stellungen der Lösung sind die erste Belegung der Ecken, in der jedes Ziel das Licht genau einer
 * Quelle bekommt, jede Quelle ein Ziel erreicht und jede Ecke Licht hat. Die Ziele bekommen die Farbe ihrer Quelle.
 * Genommen wird er nur, wenn er schon so eindeutig ist (wie der Ring in „leicht“).
 */
function weichenring(bau) {
  const { R, feldform } = bau;
  for (let versuch = 0; versuch < VERSUCHE; versuch++) {
    const rr = rahmen(bau);
    if (!rr) continue;
    const { farbe, spiegel, ringzellen, ausgaenge } = rr;
    const ecken = R.shuffle([0, 1, 2, 3]).slice(0, 3), leit = R.pick(ecken), leitfarbe = R.pick(mischungenMit(farbe));
    const quellen = [];
    for (const i of ecken) {
      const q = quelleAnEcke(bau, rr, i, i === leit ? leitfarbe : farbe);
      if (!q) break;
      quellen.push(q);
    }
    if (quellen.length < 3) continue;
    const plaetze = ausgaenge.map(a => a.filter(z => frei(bau, z)));
    const mitPlatz = R.shuffle([0, 1, 2, 3].filter(i => plaetze[i].length));
    if (mitPlatz.length < 3) continue;
    const ziele = mitPlatz.slice(0, 3)
      .map(i => bau.setze(feldform.element(R.pick(plaetze[i]), { type: 'target', color: farbe }), { kern: true }));
    if (!weichen(bau, spiegel, ziele, quellen)) continue;
    if (solve(bau.level(), { unique: true, collect: 0 }).count !== 1) continue;
    for (const z of wegzellen(bau, bau.bild())) bau.reserviert.add(z);
    for (const z of ringzellen) bau.reserviert.add(z);
    bau.geaendert();
    return null;
  }
  return 'Farben abzählen nicht eingebaut';
}

/**
 * Setzt die Ecken in die erste Belegung, in der jedes Ziel das Licht genau einer Quelle bekommt, jede Quelle ein Ziel
 * erreicht und jede Ecke Licht hat, und färbt die Ziele mit der Farbe ihrer Quelle; false, wenn es keine gibt.
 */
function weichen(bau, spiegel, ziele, quellen) {
  const { feldform } = bau, n = feldform.stellungen(spiegel[0]).length, zellen = ziele.map(feldform.zelle);
  for (let k = 0; k < n ** spiegel.length; k++) {
    spiegel.forEach((m, i) => setRot(m, Math.floor(k / n ** i) % n));
    bau.geaendert();
    const licht = bau.licht();
    if (!spiegel.every(m => licht.has(feldform.zelle(m)))) continue;
    // Je Quelle allein die Ziele, die sie trifft: genau eines, und jedes Ziel von einer
    const je = quellen.map((q) => {
      const bild = bau.bildVon(q);
      return zellen.filter(z => trifft(bau, bild, z));
    });
    if (je.some(t => t.length !== 1) || new Set(je.flat()).size !== ziele.length) continue;
    ziele.forEach((t, i) => { t.color = quellen[je.findIndex(x => x[0] === zellen[i])].color ?? 'white'; });
    bau.geaendert();
    return true;
  }
  return false;
}
