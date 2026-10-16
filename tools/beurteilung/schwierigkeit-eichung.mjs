// Eichung der Schwierigkeit (ADR 0001, Ticket 12): Gewichte aus den Messwerten der 150 heutigen Level und die Prüfung
// mit der Rangkorrelation. Gemeinsam für tools/eiche-schwierigkeit.mjs (stellt die Gewichte ein und schreibt
// schwierigkeit-gewichte.json) und den Test (tests/beurteilung/schwierigkeit.test.mjs). Ein Level ist hier
// { platz: heutiger Platz, teilwerte: wie in der Schwierigkeit }; jedes zählt gleich.
// - Eichen (eiche): nichtnegative kleinste Quadrate des heutigen Platzes auf die geeichten Messwerte (MESSWERTE in
//   schwierigkeit.mjs), nur an den Leveln einer Auswahl, etwa den geraden Plätzen. Die Lösung ist eindeutig, und kein
//   Teilwert kann die Schwierigkeit senken. Skala: Ohne die Grösse hat das schwerste der Level 100 − GROESSE.punkte.
//   Skala und Nebenbedingungen nehmen alle übergebenen Level, auch die ausserhalb der Auswahl, aber nur ihre Messwerte,
//   nie ihren Platz. So haben beide Hälften im gekreuzten Mass dieselbe Skala. Die Grösse skaliert nicht mit; ihr
//   Gewicht gegenüber den übrigen hängt also am schwersten Level (mit der Skala nur aus der Auswahl fiele 31–60
//   gekreuzt auf 0,25, Review von Ticket 12).
// - Nebenbedingungen (GRENZEN in schwierigkeit.mjs), über alle Level: Der Anteil der Weglänge am Wert liegt im Mittel
//   höchstens bei GRENZEN.weglaenge.mittel und bei keinem über GRENZEN.weglaenge.level, der Anteil der Denkarbeit im
//   Mittel mindestens bei GRENZEN.denkarbeit.mittel. Hält die freie Lösung das nicht ein, wird das Gewicht der Weglänge
//   festgehalten und die übrigen werden darauf geeicht; das grösste Gewicht, das die Grenzen einhält, sucht eine
//   Bisektion (mit dem Gewicht wächst der Anteil der Weglänge, der der Denkarbeit sinkt). So bleibt die Regel Gewicht
//   mal Messwert, und die Grenzen gelten nach jedem neuen Eichen. Geprüft wird mit den gerundeten Gewichten.
// - Prüfen (jeBereich): Rangkorrelation nach Spearman mit dem heutigen Platz, über alle und je 30er-Bereich.
// - Gekreuzt (gekreuzt): an den geraden Plätzen eichen und die ungeraden vorhersagen, dann umgekehrt; die
//   Rangkorrelation je Bereich über alle 30 Level, jedes mit der Vorhersage aus der anderen Hälfte. Das senkt den
//   Zufall gegenüber den 15 Leveln einer Hälfte.
import { MESSWERTE, GROESSE, GRENZEN, bewerte, zeile } from './schwierigkeit.mjs';

export const gerade = (platz) => platz % 2 === 0;
export const ungerade = (platz) => platz % 2 === 1;
/** Die Namen der Gewichte in der Reihenfolge von MESSWERTE. */
export const NAMEN = Object.values(MESSWERTE).flatMap(Object.keys);
/** Platz der Weglänge in NAMEN und in jeder zeile. */
const WEG = NAMEN.indexOf('weglaenge');
const mittel = (v) => v.reduce((a, b) => a + b, 0) / v.length;

/** Nichtnegative kleinste Quadrate mit Achsenabschnitt (Koordinatenabstieg, je Koordinate exakt): Gewichte zu X → y. */
function nnls(X, y) {
  const n = X.length, k = X[0].length;
  const Z = [...Array(k).keys()].map((j) => { const m = mittel(X.map(r => r[j])); return X.map(r => r[j] - m); });
  const rest = y.map(v => v - mittel(y)), w = new Array(k).fill(0);
  for (let runde = 0; runde < 100000; runde++) {
    let groesste = 0;
    for (let j = 0; j < k; j++) {
      const zz = Z[j].reduce((s, z) => s + z * z, 0);
      if (!zz) continue;
      const neu = Math.max(0, w[j] + Z[j].reduce((s, z, i) => s + z * rest[i], 0) / zz), d = neu - w[j];
      if (!d) continue;
      for (let i = 0; i < n; i++) rest[i] -= d * Z[j][i];
      w[j] = neu;
      groesste = Math.max(groesste, Math.abs(d));
    }
    if (groesste < 1e-12) break;
  }
  return w;
}

/**
 * Anteile der Teilwerte am Wert mit gegebenen Gewichten: { denkarbeit, zusammenspiel, weglaenge, groesse }, je
 * { mittel, hoechstens, wenigstens, je: je Level }.
 */
export function anteile(level, gewichte) {
  const t = level.map(l => bewerte(l.teilwerte, gewichte).teilwerte);
  return Object.fromEntries(Object.keys(t[0]).map((teil) => {
    const je = t.map(x => x[teil].anteil);
    return [teil, { mittel: mittel(je), hoechstens: Math.max(...je), wenigstens: Math.min(...je), je }];
  }));
}

/**
 * Gewichte { Name: Gewicht }, eingestellt an den Leveln mit auswahl(platz), auf drei Stellen gerundet; die Anteile von
 * Weglänge und Denkarbeit bleiben über alle Level in den GRENZEN (siehe oben).
 */
export function eiche(level, auswahl) {
  const X = level.map(l => zeile(l.teilwerte)), geeicht = level.map((_, i) => i).filter(i => auswahl(level[i].platz));
  const gewichte = (roh) => {
    const hoechster = Math.max(...X.map(r => r.reduce((s, x, j) => s + x * roh[j], 0)));
    return Object.fromEntries(NAMEN.map((n, j) => [n, +((roh[j] * (100 - GROESSE.punkte)) / hoechster).toFixed(3)]));
  };
  const haelt = (g) => {
    const { weglaenge: w, denkarbeit: d } = anteile(level, g);
    return w.mittel <= GRENZEN.weglaenge.mittel && w.hoechstens <= GRENZEN.weglaenge.level
      && d.mittel >= GRENZEN.denkarbeit.mittel;
  };
  const frei = nnls(geeicht.map(i => X[i]), geeicht.map(i => level[i].platz));
  if (haelt(gewichte(frei))) return gewichte(frei);
  /** Die Weglänge mit dem Rohgewicht w festgehalten, die übrigen darauf geeicht. */
  const mitWeglaenge = (w) => {
    const ohne = (r) => r.filter((_, j) => j !== WEG);
    const roh = nnls(geeicht.map(i => ohne(X[i])), geeicht.map(i => level[i].platz - w * X[i][WEG]));
    return gewichte([...roh.slice(0, WEG), w, ...roh.slice(WEG)]);
  };
  if (!haelt(mitWeglaenge(0))) {
    throw new Error('Eichung: Auch ohne Weglänge hält die Schwierigkeit die GRENZEN nicht ein');
  }
  let unten = 0, oben = frei[WEG];
  for (let schritt = 0; schritt < 60; schritt++) {
    const w = (unten + oben) / 2;
    if (haelt(mitWeglaenge(w))) unten = w; else oben = w;
  }
  return mitWeglaenge(unten);
}

/** Ränge, gleiche Werte bekommen den mittleren Rang. */
export function raenge(v) {
  const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = new Array(v.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let q = i; q <= j; q++) r[idx[q][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}

/** Rangkorrelation nach Spearman. */
export function rangkorrelation(a, b) {
  const [ra, rb] = [raenge(a), raenge(b)], m = (ra.length + 1) / 2;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < ra.length; i++) {
    sab += (ra[i] - m) * (rb[i] - m); saa += (ra[i] - m) ** 2; sbb += (rb[i] - m) ** 2;
  }
  return sab / Math.sqrt(saa * sbb);
}

/** Rangkorrelation der Werte mit den Plätzen: { gesamt, bereiche: [{ von, bis, rho }] } je 30er-Bereich. */
export function jeBereich(werte, plaetze) {
  const bereiche = [0, 1, 2, 3, 4].map((b) => {
    const i = plaetze.map((_, j) => j).filter(j => plaetze[j] > 30 * b && plaetze[j] <= 30 * b + 30);
    return { von: 30 * b + 1, bis: 30 * b + 30, rho: rangkorrelation(i.map(j => werte[j]), i.map(j => plaetze[j])) };
  });
  return { gesamt: rangkorrelation(werte, plaetze), bereiche };
}

/**
 * Gekreuzt: jede Hälfte mit den Gewichten aus der anderen. Rückgabe wie jeBereich über alle Level, dazu werte (je
 * Level die Vorhersage) und gewichte { gerade, ungerade } (eingestellt an dieser Hälfte).
 */
export function gekreuzt(level) {
  const gewichte = { gerade: eiche(level, gerade), ungerade: eiche(level, ungerade) };
  const werte = level.map(l => bewerte(l.teilwerte, gerade(l.platz) ? gewichte.ungerade : gewichte.gerade).wert);
  return { ...jeBereich(werte, level.map(l => l.platz)), werte, gewichte };
}
