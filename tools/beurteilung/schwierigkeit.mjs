// Schwierigkeit (Glossar, Spec „Beurteilung“, ADR 0001): wie viel Denkarbeit ein Level einem Spieler abverlangt; sie
// bestimmt die Reihenfolge der Level. Der Wert ist die Summe von vier Teilwerten, je mit seinem Anteil am Wert:
// - Denkarbeit (Spec: „vor allem Denkarbeit: das Spielermodell, die Farblogik und die Kernideen“), selbst die Summe aus
//   - Spielermodell (spielermodell.mjs), gemittelt über die vier Drehungen des Levels um die Drehachse
//     (spielermodellJeDrehung): Die feste Reihenfolge der Zellen ist geometrisch willkürlich, und schon um 180° gedreht
//     hatten 28 der 150 heutigen Level andere Werte. Das Mittel hängt nicht davon ab, wie das Level gedreht ist.
//     - rueckschluesse: drehbare Elemente, die das Modell mit vollem Überblick rückwärts entscheidet, vom Ziel her. Was
//       sicheres Licht vorwärts zeigt, sieht der Spieler; was erst eine Fallunterscheidung entscheidet, zählt dort.
//     - fallunterscheidungen: mit Horizont 2 und mit vollem Überblick zusammen (k2 + kInf, die Horizonte).
//     - kette: die längste Kette mit vollem Überblick, Folgerungen bis zum Widerspruch.
//     - stillstand: 1, wenn das Modell mit Horizont 2 steckenbleibt (auf den 150 heutigen Leveln in jeder Drehung
//       gleich).
//   - Farblogik (Glossar: Mischen, Filtern oder Zerlegen ist für die Lösung nötig): die Farboperationen, die die Lösung
//     braucht, je Operation gezählt.
//     - Mischen: jedes Mischziel (mischziele.mjs).
//     - Filtern: jeder Filter, ohne dessen Wirkung ein Ziel seine Farbe verliert (an seiner Stelle ein weisser Filter,
//       Gegenprobe aus noetig.mjs).
//     - Zerlegen: jedes Prisma, das in der Lösung Licht aus mindestens zwei Grundfarben bricht und ohne das ein Ziel
//       seine Farbe verliert (an seiner Stelle ein Blocker).
//     Je Operation, weil jede für sich durchdacht sein will. Beim Eichen folgte die Zahl der Operationen der heutigen
//     Reihenfolge besser als die Zahl der Ziele mit Farblogik oder die der Arten (Ticket 12).
//   - Kernideen: die Zahl der nötigen Kernideen, also der Funde in kernideen; jede ist eine Einsicht, die der Spieler
//     haben muss.
// - Zusammenspiel (Glossar): derselbe Teilwert wie im Spielwert (zusammenspiel aus spielwert.mjs), die Stellen des
//   Zusammenspiels je drehbares Element, höchstens 1. Wo Strahlen sich kreuzen und Elemente mehreren Strahlen dienen,
//   muss eine Stellung mehreren Strängen zugleich genügen. Ein eigener Teilwert neben der Denkarbeit, die nach der Spec
//   aus Spielermodell, Farblogik und Kernideen besteht.
// - Weglänge: die Zahl der geraden Strahlabschnitte in der Lösungsstellung. Jeden verfolgt der Spieler, um zu sehen,
//   wohin das Licht geht, auch den, der ins Leere läuft: Auch er könnte ein Ziel falsch treffen. Gezählt in Abschnitten
//   und nicht nach Länge, denn ein langer gerader Strahl ist nicht schwerer als ein kurzer. Verglichen mit den
//   Umlenkungen, den Reflexionen, der Länge und den Elementen auf den Wegen zu den Zielen (Ticket 12). Sie ist eher Weg
//   als Denken, darum begrenzt (Entscheid des Nutzers, GRENZEN): höchstens ein Viertel des Werts im Mittel der 150
//   heutigen Level und ein Drittel bei jedem davon; die Denkarbeit trägt im Mittel mindestens die Hälfte. Das stellt
//   die Eichung sicher (schwierigkeit-eichung.mjs).
// - Grösse (drehbare Elemente): nur mit kleinem, nach oben begrenztem Anteil, höchstens GROESSE.punkte, voll ab
//   GROESSE.voll drehbaren Elementen. Sie misst kein Denken; grosse, aber einfache Level sollen nicht nach hinten
//   rutschen.
// Die übrigen Gewichte stehen in schwierigkeit-gewichte.json. tools/eiche-schwierigkeit.mjs stellt sie an den Leveln
// der geraden Plätze der heutigen Reihenfolge ein; der Test prüft gekreuzt, jede Hälfte mit den Gewichten der anderen.
// Teuer, weil die Kernideen Falle und Lockvogel die Suche ohne Abschneiden brauchen.
import { readFileSync } from 'node:fs';
import { spielermodellJeDrehung } from './spielermodell.mjs';
import { mischziele } from './mischziele.mjs';
import { loesung } from './loesungsstellung.mjs';
import { gegenprobe } from './noetig.mjs';
import { RANGFOLGE } from './haupt-kernidee.mjs';
import { zusammenspiel, zusammenspielStellen } from './spielwert.mjs';

/** Die Grösse bringt höchstens punkte, voll ab voll drehbaren Elementen (die schwersten Level haben um 100). */
export const GROESSE = { punkte: 10, voll: 12 };
/**
 * Grenzen der Anteile am Wert, beim Eichen eingehalten: die Weglänge höchstens weglaenge.mittel im Mittel und
 * weglaenge.level bei einem einzelnen Level, die Denkarbeit im Mittel mindestens denkarbeit.mittel.
 */
export const GRENZEN = { weglaenge: { mittel: 0.25, level: 1 / 3 }, denkarbeit: { mittel: 0.5 } };
/** Gewichte je geeichtem Messwert (Namen wie in MESSWERTE), eingestellt von tools/eiche-schwierigkeit.mjs. */
export const GEWICHTE = JSON.parse(readFileSync(new URL('./schwierigkeit-gewichte.json', import.meta.url), 'utf8'))
  .gewichte;
/**
 * Die geeichten Messwerte je Teil: Name des Gewichts → Messwert, gelesen aus den Messwerten des Teils (wie in
 * teilwerte). Die Grösse ist nicht geeicht.
 */
export const MESSWERTE = {
  spielermodell: {
    rueckschluesse: s => s.rueckschluesse, fallunterscheidungen: s => s.fallunterscheidungen,
    kette: s => s.kette, stillstand: s => s.stillstand,
  },
  farblogik: { farblogik: f => f.mischen + f.filtern + f.zerlegen },
  kernideen: { kernideen: k => k.zahl },
  zusammenspiel: { zusammenspiel: z => z.jeElement },
  weglaenge: { weglaenge: w => w.abschnitte },
};
/** Die Teile der Denkarbeit; Zusammenspiel und Weglänge sind eigene Teilwerte. */
const DENKARBEIT = ['spielermodell', 'farblogik', 'kernideen'];
/** Wo ein Teil in den Teilwerten (oder den Messwerten) steht. */
const teilIn = (t, teil) => (DENKARBEIT.includes(teil) ? t.denkarbeit[teil] : t[teil]);
/** Die geeichten Messwerte aus Teilwerten oder Messwerten, in der Reihenfolge von MESSWERTE (für die Eichung). */
export const zeile = (t) => Object.entries(MESSWERTE)
  .flatMap(([teil, je]) => Object.values(je).map(lies => lies(teilIn(t, teil))));

const mittel = (werte) => werte.reduce((a, b) => a + b, 0) / werte.length;
/** Mindestens zwei Grundfarben. */
const gemischt = (farbe) => (farbe & (farbe - 1)) !== 0;

/**
 * Drehbare Elemente, die das Spielermodell in einer Partie (Ergebnis von spiele) rückwärts entscheidet: Eine Folgerung
 * rückwärts lässt ihnen als letzte nur noch eine Stellung.
 */
function rueckschluesse(feldform, level, partie) {
  const drehbar = level.elements.filter(e => feldform.stellungen(e).length);
  const offen = new Map(drehbar.map(e => [feldform.zelle(e), feldform.stellungen(e).length]));
  let n = 0;
  for (const f of partie.folgerungen) {
    const vorher = offen.get(f.element), nachher = vorher - f.stellungen.length;
    offen.set(f.element, nachher);
    if (vorher > 1 && nachher === 1 && f.art === 'rückwärts') n++;
  }
  return n;
}

/**
 * Die Messwerte, einmal je Beurteilung, gegliedert wie die Teilwerte: denkarbeit { spielermodell { rueckschluesse,
 * fallunterscheidungen, kette, stillstand } (Mittel über die Drehungen), farblogik { mischen, filtern, zerlegen },
 * kernideen { zahl: nötige } }, zusammenspiel { jeElement: der Teilwert des Spielwerts, stellen }, weglaenge
 * { abschnitte }, groesse { drehbar }.
 */
export const messwerte = (ctx) => ctx.merke(messwerte, () => {
  const { level, feldform } = ctx;
  const drehungen = feldform.drehungen(level);
  const jeDrehung = spielermodellJeDrehung(ctx).map(({ k2, kInf }, i) => ({
    rueckschluesse: rueckschluesse(feldform, drehungen[i], kInf),
    fallunterscheidungen: k2.fallunterscheidungen.length + kInf.fallunterscheidungen.length,
    kette: Math.max(0, ...kInf.fallunterscheidungen.flatMap(f => f.ketten)),
    stillstand: k2.steckt ? 1 : 0,
  }));
  const spielermodell = Object.fromEntries(Object.keys(jeDrehung[0]).map(k => [k, mittel(jeDrehung.map(d => d[k]))]));
  const wirkt = (wegnahme) => gegenprobe(ctx, wegnahme).length > 0;
  const { strahlbild } = loesung(ctx);
  const brechen = new Set(strahlbild.events.filter(e => e.kind === 'refract' && gemischt(e.color)).map(e => e.element));
  const weiss = (filter) => (e) => (e === filter ? { ...e, color: 'white' } : e);
  const blocker = (id) => (e) => (e === level.elements[id] ? { ...e, type: 'blocker' } : e);
  const farblogik = {
    mischen: mischziele(ctx).length,
    filtern: level.elements.filter(f => f.type === 'filter' && wirkt(weiss(f))).length,
    zerlegen: [...brechen].filter(id => wirkt(blocker(id))).length,
  };
  // Alle sechs Kernideen, wie sie die Haupt-Kernidee kennt
  const zahl = RANGFOLGE.reduce((n, [, funde]) => n + funde(ctx).length, 0);
  return {
    denkarbeit: { spielermodell, farblogik, kernideen: { zahl } },
    zusammenspiel: { jeElement: zusammenspiel(ctx), stellen: zusammenspielStellen(ctx).zahl },
    weglaenge: { abschnitte: strahlbild.segments.length },
    groesse: { drehbar: level.elements.filter(e => feldform.stellungen(e).length).length },
  };
});

/** Die Messwerte eines Teils ohne wert und anteil. */
const messung = ({ wert: _, anteil: __, ...m }) => m;

/**
 * Wert und Teilwerte aus den Messwerten (wie messwerte, auch die teilwerte einer Schwierigkeit) mit gegebenen
 * Gewichten; für die Eichung (schwierigkeit-eichung.mjs) dieselbe Rechnung wie für die Beurteilung.
 */
export function bewerte(m, gewichte = GEWICHTE) {
  const teil = (name) => {
    const gemessen = messung(teilIn(m, name));
    const wert = Object.entries(MESSWERTE[name])
      .reduce((s, [gewicht, lies]) => s + gewichte[gewicht] * lies(gemessen), 0);
    return { wert, ...gemessen };
  };
  const denkarbeit = Object.fromEntries(DENKARBEIT.map(name => [name, teil(name)]));
  const { drehbar } = m.groesse;
  const teilwerte = {
    denkarbeit: { wert: DENKARBEIT.reduce((s, name) => s + denkarbeit[name].wert, 0), ...denkarbeit },
    zusammenspiel: teil('zusammenspiel'),
    weglaenge: teil('weglaenge'),
    groesse: { wert: (GROESSE.punkte * Math.min(drehbar, GROESSE.voll)) / GROESSE.voll, drehbar },
  };
  const wert = Object.values(teilwerte).reduce((s, t) => s + t.wert, 0);
  for (const t of Object.values(teilwerte)) t.anteil = wert ? t.wert / wert : 0;
  return { wert, teilwerte };
}

/**
 * Die Schwierigkeit: { wert, teilwerte }, wert ist die Summe der vier Teilwerte, je mit wert, anteil (am Wert) und den
 * Messwerten:
 *   denkarbeit:    { wert, anteil, spielermodell: { wert, rueckschluesse, fallunterscheidungen, kette, stillstand },
 *                    farblogik: { wert, mischen, filtern, zerlegen }, kernideen: { wert, zahl } }
 *   zusammenspiel: { wert, anteil, jeElement, stellen }
 *   weglaenge:     { wert, anteil, abschnitte }
 *   groesse:       { wert, anteil, drehbar }
 */
export const schwierigkeit = (ctx) => ctx.merke(schwierigkeit, () => bewerte(messwerte(ctx)));

export default { teil: 'schwierigkeit', teuer: true, beurteile: schwierigkeit };
