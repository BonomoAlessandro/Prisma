// Feldform der Würfel-Level (Ticket 14, nur auf dem Branch feature/3d-wuerfel): dieselben Teile wie die flache Feldform
// (feldform.mjs), für einen Würfel aus groesse × hoehe × groesse Zellen (Grundfläche groesse × groesse, hoehe Ebenen;
// die Würfel-Level sind 7 × 7 × 5, .scratch/wuerfel-7x7x5/). Die Wirkung der Elemente kommt aus der
// Strahlregel des Würfels in index.html (planeDir, reflect3, refractInPrism3; ADR 0003), es gibt keine eigene.
//
// - Zelle: „x,y,z“ wie in der Lösung eines Würfel-Levels, y ist die Ebene (0 = unten). Die Zellen stehen Ebene für
//   Ebene wie im Brett der Strahlregel, in der untersten also wie im flachen Feld.
// - Richtungen: die 18 der Strahlregel (6 Achsen und 12 Flächendiagonalen, keine Raumdiagonalen). Die ersten acht
//   liegen in der Ebene und sind die des flachen Felds (0 = Ost, 2 = Süd, …), dann folgen die mit Anteil in y.
// - Nachbarn: die 18 Zellen in diesen Richtungen, ohne die über eine Raumdiagonale (Entscheid für den Knäuel).
// - Drehachse: die Achse des Elements (axis, Standard y). Ein Element wirkt in der Ebene senkrecht dazu wie im flachen
//   Feld; seine Stellung zählt dort über die Ebenenbasis der Strahlregel (AXES).
// - Drehungen: um die senkrechte Achse y wie im flachen Feld, aber nur die, die sich mit den Elementen der Strahlregel
//   darstellen lassen (siehe drehungen).
// - Für den Generator (Ticket 22): die Leveldaten eines Elements in einer Zelle mit einer der drei Drehachsen
//   (element, drehachsen) und die Angaben des Würfels (rahmen).
import { L, period, getRot } from '../solver.mjs';

/** Die 18 Richtungen als Vektoren [dx, dy, dz]: zuerst die acht der Ebene in der Reihenfolge von DIRS. */
const VEKTOREN = L.DIRS.map(([dx, dz]) => [dx, 0, dz]);
for (const dy of [1, -1]) for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
  if (dx * dx + dz * dz <= 1) VEKTOREN.push([dx, dy, dz]);
}
const schluessel = (v) => `${v[0]},${v[1]},${v[2]}`;
const NUMMER = new Map(VEKTOREN.map((v, i) => [schluessel(v), i]));
/** Richtung eines ganzzahligen Vektors aus der Strahlregel. */
const richtungVon = (v) => NUMMER.get(schluessel(v));
/** Die Drehachsen der Strahlregel (AXES), zuerst y, der Standard (ohne axis in den Leveldaten). */
const DREHACHSEN = Object.freeze(['y', ...Object.keys(L.AXES).filter(a => a !== 'y')]);

/** Vierteldrehung um die senkrechte Achse wie im flachen Feld: Ost wird Süd, Süd wird West. */
const dreheVektor = ([dx, dy, dz]) => [-dz, dy, dx];
const gleich = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * Würfel-Feldformen nach Grösse, einmal angelegt wie die flachen (feldformVon): Ihre Nachbartabelle kostet etwas, und
 * der Generator merkt sich manches je Feldform. Darum eingefroren, kein Aufrufer kann sie verändern.
 */
const WUERFEL = new Map();

/** Würfel-Feldform mit groesse × hoehe × groesse Zellen (hoehe ohne Angabe groesse), je Grösse dieselbe (WUERFEL). */
export function wuerfelFeldform(groesse, hoehe = groesse) {
  const k = `${groesse}×${hoehe}`;
  if (!WUERFEL.has(k)) WUERFEL.set(k, neueWuerfelFeldform(groesse, hoehe));
  return WUERFEL.get(k);
}

/** Würfel-Feldform mit groesse × hoehe × groesse Zellen. Teile und Bedeutung wie in flacheFeldform (feldform.mjs). */
function neueWuerfelFeldform(groesse, hoehe) {
  const key = (x, y, z) => x + ',' + y + ',' + z;
  const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < groesse && y < hoehe && z < groesse;
  const lies = (zelle) => zelle.split(',').map(Number);
  const zellen = [];
  for (let y = 0; y < hoehe; y++) for (let z = 0; z < groesse; z++) {
    for (let x = 0; x < groesse; x++) zellen.push(key(x, y, z));
  }
  const richtungen = VEKTOREN.map((_, d) => d);
  const gegen = (richtung) => richtungVon(VEKTOREN[richtung].map(c => -c));
  const schritt = (zelle, richtung) => {
    const [x, y, z] = lies(zelle), [dx, dy, dz] = VEKTOREN[richtung];
    return inside(x + dx, y + dy, z + dz) ? key(x + dx, y + dy, z + dz) : null;
  };
  // Die Nachbarn je Zelle und Richtung einmal je Feldform, wie in der flachen (Ticket 18): Das Spielermodell fragt sie
  // in jeder Beurteilung zehntausendfach ab. Dieselben Ergebnisse wie schritt.
  const tabelle = new Map(zellen.map(z => [z, richtungen.map(d => schritt(z, d))]));
  const nachbar = (zelle, richtung) => {
    const reihe = tabelle.get(zelle);
    return reihe && richtung in reihe ? reihe[richtung] : schritt(zelle, richtung);
  };
  const achseVon = (el) => el.axis || 'y';
  const stellungVon = (el) => (el.type === 'source' ? el.dir : getRot(el));
  // Ein Strahl nach unten endet auf der Plattform (y = −0.5, PLAN 2.2): in keiner Zelle, obwohl gerundet y = 0
  const bei = (x, y, z) => {
    const rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    return y > -0.5 && inside(rx, ry, rz) ? key(rx, ry, rz) : null;
  };

  /**
   * Das Level nach n Vierteldrehungen um die senkrechte Achse, oder null, wenn ein Element sich gedreht nicht
   * darstellen lässt. Jedes Element bekommt die Achse, auf der seine gedrehte Achse liegt, und die Stellung, deren
   * Richtung in der Ebenenbasis dieser Achse die gedrehte Richtung ist (Spiegel: die gedrehte Spiegellinie). Zeigt
   * die gedrehte Achse eines Prismas gegen die Achse der Strahlregel, bräche es Rot und Blau zu den vertauschten
   * Seiten: Die Strahlregel kennt dafür keine Stellung, ihre Ebenenbasis ist für jede Achse fest und rechtshändig.
   */
  const drehe = (level, n) => {
    const dreh = (v) => { for (let i = 0; i < n; i++) v = dreheVektor(v); return v; };
    const platz = (x, y, z) => { for (let i = 0; i < n; i++) [x, z] = [groesse - 1 - z, x]; return [x, y, z]; };
    const neueAchse = (achse) => {
      const a = dreh(L.AXES[achse].a);
      const name = Object.keys(L.AXES).find(k => L.AXES[k].a.some((c, i) => c !== 0 && a[i] !== 0));
      return { name, umgekehrt: !gleich(a, L.AXES[name].a) };
    };
    const stellung = (achse, neu, k) => L.planeIndex(neu, dreh(L.planeDir(achse, k)));
    const loesung = new Map(); // Id → Stellung in der Lösung → gedrehte Stellung, je drehbares Element
    const elements = [];
    for (const [id, e] of level.elements.entries()) {
      const achse = achseVon(e), { name, umgekehrt } = neueAchse(achse);
      if (e.type === 'prism' && umgekehrt) return null;
      const [x, y, z] = platz(e.x, e.y, e.z), neu = { ...e, x, y, z };
      if (e.axis !== undefined || name !== 'y') neu.axis = name;
      if (['mirror', 'prism'].includes(e.type)) neu.rot = stellung(achse, name, e.rot ?? 0);
      if (['source', 'combiner'].includes(e.type)) neu.dir = stellung(achse, name, e.dir ?? 0);
      elements.push(neu);
      if (L.isRotatable(e)) loesung.set(id, (k) => stellung(achse, name, k) % period(e));
    }
    const solution = {};
    for (const [id, e] of level.elements.entries()) {
      const zelle = key(e.x, e.y, e.z);
      if (loesung.has(id) && zelle in level.solution) {
        solution[key(...platz(e.x, e.y, e.z))] = loesung.get(id)(level.solution[zelle]);
      }
    }
    return { ...level, elements, solution };
  };

  // Eingefroren samt Zellen, Richtungen, Drehachsen und Rahmen: wuerfelFeldform gibt dieselbe an alle Aufrufer
  return Object.freeze({
    art: 'wuerfel',
    zellen: Object.freeze(zellen),
    richtungen: Object.freeze(richtungen),
    /** Angaben der Leveldaten, die diesen Würfel festlegen (wie in LEVELS_3D); feldformVon liest daraus dieselbe. */
    rahmen: Object.freeze(hoehe === groesse ? { dim: 3, size: groesse } : { dim: 3, size: groesse, height: hoehe }),
    /** Die Drehachsen, die ein Element haben kann (Werte wie drehachse), zuerst y. */
    drehachsen: DREHACHSEN,
    zelle: (el) => key(el.x, el.y, el.z),
    /**
     * Leveldaten eines Elements in zelle wie in der flachen Feldform; drehachse (Vorgabe y) wird zu axis, bei y ohne
     * Angabe wie in LEVELS_3D.
     */
    element: (zelle, { type, drehachse = 'y', ...angaben }) => {
      if (!DREHACHSEN.includes(drehachse)) throw new Error(`Würfel-Feldform: keine Drehachse ${drehachse}`);
      const [x, y, z] = lies(zelle);
      return { type, x, y, z, ...(drehachse === 'y' ? {} : { axis: drehachse }), ...angaben };
    },
    zelleBei: (p) => bei(p.x, p.y, p.z),
    abschnitt: (s) => ({ von: bei(s.x0, s.y0, s.z0), bis: bei(s.x1, s.y1, s.z1) }),
    /** Wie in der flachen Feldform; die Achse ist die kleinere der beiden Richtungen der Linie. */
    durchlauf: (s) => {
      const d = [s.x1 - s.x0, s.y1 - s.y0, s.z1 - s.z0];
      const schritt = d.map(c => Math.sign(Math.round(c * 1000)));
      const richtung = richtungVon(schritt) ?? -1;
      const achse = richtung < 0 ? richtung : Math.min(richtung, gegen(richtung));
      const schritte = Math.round(Math.max(...d.map(Math.abs)));
      const [x0, y0, z0] = [s.x0, s.y0, s.z0].map(Math.round);
      const out = [];
      for (let i = 1; i < schritte; i++) {
        const x = x0 + i * schritt[0], y = y0 + i * schritt[1], z = z0 + i * schritt[2];
        if (!inside(x, y, z)) break;
        out.push({ zelle: key(x, y, z), achse });
      }
      return out;
    },
    nachbar,
    /** Alle Nachbarzellen in den 18 Richtungen, ohne Raumdiagonalen. */
    nachbarn: (zelle) => richtungen.map(d => nachbar(zelle, d)).filter(n => n !== null),
    drehachse: achseVon,
    stellungen: (el) => (L.isRotatable(el) ? [...Array(period(el)).keys()] : []),
    spiegeln: (el, richtung, stellung = stellungVon(el)) => {
      const neu = L.reflect3(VEKTOREN[richtung], achseVon(el), stellung);
      return neu === null ? null : richtungVon(neu);
    },
    brechen: (el, richtung, farbe, stellung = stellungVon(el)) =>
      L.refractInPrism3(VEKTOREN[richtung], farbe, achseVon(el), stellung)
        .map(o => ({ richtung: richtungVon(o.d), farbe: o.color })),
    ausgang: (el, stellung = stellungVon(el)) =>
      richtungVon(L.planeDir(achseVon(el), el.type === 'source' ? el.dir : stellung)),
    startstrahl: (zelle, richtung, farbe) => {
      const [x, y, z] = lies(zelle);
      return { x, y, z, d: VEKTOREN[richtung], color: farbe };
    },
    quelleStatt: (el, stellung) => ({ ...el, type: 'source', dir: stellung }),
    /**
     * Das Level in den Drehungen um die senkrechte Achse, je eine Vierteldrehung weiter, soweit sie sich darstellen
     * lassen; die erste ist das Level selbst. Ohne Prisma mit waagrechter Achse sind es alle vier wie im flachen Feld.
     * Ein solches Prisma lässt nur die Drehungen zu, die seine Achse nicht umkehren (Achse x: 0 und 1, Achse z: 0 und 3
     * Vierteldrehungen); mit Prismen beider Achsen bleibt nur das Level selbst.
     */
    drehungen: (level) => [level, ...[1, 2, 3].map(n => drehe(level, n)).filter(Boolean)],
  });
}
