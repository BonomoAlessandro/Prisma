// Feldform der Würfel-Level (Ticket 14, nur auf dem Branch feature/3d-wuerfel): dieselben Teile wie die flache Feldform
// (feldform.mjs), für einen Würfel aus groesse × groesse × groesse Zellen. Die Wirkung der Elemente kommt aus der
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

/** Vierteldrehung um die senkrechte Achse wie im flachen Feld: Ost wird Süd, Süd wird West. */
const dreheVektor = ([dx, dy, dz]) => [-dz, dy, dx];
const gleich = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** Würfel-Feldform mit groesse × groesse × groesse Zellen. Teile und Bedeutung wie in flacheFeldform (feldform.mjs). */
export function wuerfelFeldform(groesse) {
  const key = (x, y, z) => x + ',' + y + ',' + z;
  const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < groesse && y < groesse && z < groesse;
  const lies = (zelle) => zelle.split(',').map(Number);
  const zellen = [];
  for (let y = 0; y < groesse; y++) for (let z = 0; z < groesse; z++) {
    for (let x = 0; x < groesse; x++) zellen.push(key(x, y, z));
  }
  const richtungen = VEKTOREN.map((_, d) => d);
  const gegen = (richtung) => richtungVon(VEKTOREN[richtung].map(c => -c));
  const nachbar = (zelle, richtung) => {
    const [x, y, z] = lies(zelle), [dx, dy, dz] = VEKTOREN[richtung];
    return inside(x + dx, y + dy, z + dz) ? key(x + dx, y + dy, z + dz) : null;
  };
  const achseVon = (el) => el.axis || 'y';
  const stellungVon = (el) => (el.type === 'source' ? el.dir : getRot(el));
  const bei = (x, y, z) => {
    const rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
    return inside(rx, ry, rz) ? key(rx, ry, rz) : null;
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

  return {
    art: 'wuerfel',
    zellen,
    richtungen,
    zelle: (el) => key(el.x, el.y, el.z),
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
  };
}
