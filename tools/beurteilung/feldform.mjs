// Feldform (Spec „Feldform“): Beurteilung, Spielermodell und Generator kennen das Feld nur über sie. Sie liefert die
// Zellen, die Nachbarn, die Richtungen, die Drehachse eines Elements und seine möglichen Stellungen, dazu die Drehungen
// eines Levels um die Drehachse. Nur hier stehen Koordinaten und die acht Richtungen der flachen Level.
//
// Eine Zelle ist ein Schlüssel wie in der Lösung eines Levels („x,z“ im flachen Feld). Ausserhalb der Feldform wird er
// nie zerlegt, nur verglichen und in Begründungen genannt. Eine Richtung ist ein Wert aus richtungen.
//
// Auf main gibt es nur die flache Feldform. Eine weitere Feldform (Würfel, Ticket 14) liefert dieselben Teile und kommt
// in feldformVon dazu.
import { L, period } from '../solver.mjs';

/** Die Feldform eines Levels. */
export function feldformVon(level) {
  if (level.dim !== undefined && level.dim !== 2) throw new Error(`Level "${level.name}": keine Feldform für dim ${level.dim}`);
  return flacheFeldform(level.size || 7);
}

/**
 * Flache Feldform: quadratisches Feld mit groesse × groesse Zellen (bis 7 × 7), x nach rechts, z zum Betrachter hin.
 * Richtungen 0–7 wie in der Strahlregel (0 = Ost, 2 = Süd, in 45°-Schritten). Die Drehachse steht senkrecht: Achse y,
 * wie im Würfel-Level eine Drehachse y.
 */
export function flacheFeldform(groesse) {
  const key = (x, z) => x + ',' + z;
  const inside = (x, z) => x >= 0 && z >= 0 && x < groesse && z < groesse;
  const zellen = [];
  for (let z = 0; z < groesse; z++) for (let x = 0; x < groesse; x++) zellen.push(key(x, z));
  const richtungen = L.DIRS.map((_, d) => d);
  /** Nachbarzelle in einer Richtung, null am Rand. */
  const nachbar = (zelle, richtung) => {
    const [x, z] = zelle.split(',').map(Number), [dx, dz] = L.DIRS[richtung];
    return inside(x + dx, z + dz) ? key(x + dx, z + dz) : null;
  };
  /** Das Level um eine Vierteldrehung gedreht: Ost wird Süd, jede Richtung und Stellung zwei Schritte weiter. */
  const vierteldrehung = (level) => {
    const platz = (x, z) => [groesse - 1 - z, x], schritte = richtungen.length / 4;
    const elements = level.elements.map((e) => {
      const [x, z] = platz(e.x, e.z), neu = { ...e, x, z };
      if (e.dir !== undefined) neu.dir = (e.dir + schritte) % richtungen.length;
      if (e.rot !== undefined) neu.rot = (e.rot + schritte) % richtungen.length;
      return neu;
    });
    const solution = {};
    for (const e of level.elements.filter(L.isRotatable)) {
      const zelle = key(e.x, e.z);
      if (zelle in level.solution) solution[key(...platz(e.x, e.z))] = (level.solution[zelle] + schritte) % period(e);
    }
    return { ...level, elements, solution };
  };
  return {
    art: 'flach',
    zellen,
    richtungen,
    /** Zelle eines Elements (aus den Leveldaten oder vom Brett der Strahlregel). */
    zelle: (el) => key(el.x, el.z),
    /** Zelle eines Punkts im Strahlbild (Ereignis, Anfang oder Ende eines Abschnitts); null hinter der Feldkante. */
    zelleBei: (p) => {
      const x = Math.round(p.x), z = Math.round(p.z);
      return inside(x, z) ? key(x, z) : null;
    },
    /** Zellen, in denen ein Strahlabschnitt beginnt und endet: { von, bis }; bis ist null hinter der Feldkante. */
    abschnitt: (s) => {
      const bei = (x, z) => (inside(Math.round(x), Math.round(z)) ? key(Math.round(x), Math.round(z)) : null);
      return { von: bei(s.x0, s.z0), bis: bei(s.x1, s.z1) };
    },
    /**
     * Zellen, durch die ein Strahlabschnitt läuft, ohne die an seinem Anfang und Ende und ohne die hinter der Feldkante,
     * je { zelle, achse }. Die Achse ist für beide Laufrichtungen gleich (Richtung modulo 4).
     */
    durchlauf: (s) => {
      const dx = Math.sign(Math.round((s.x1 - s.x0) * 1000)), dz = Math.sign(Math.round((s.z1 - s.z0) * 1000));
      const achse = L.DIRS.findIndex(([a, b]) => a === dx && b === dz) % 4;
      const schritte = Math.round(Math.max(Math.abs(s.x1 - s.x0), Math.abs(s.z1 - s.z0)));
      const out = [];
      for (let i = 1; i < schritte; i++) {
        const x = Math.round(s.x0) + i * dx, z = Math.round(s.z0) + i * dz;
        if (!inside(x, z)) break;
        out.push({ zelle: key(x, z), achse });
      }
      return out;
    },
    nachbar,
    /** Alle Nachbarzellen, auch diagonal. */
    nachbarn: (zelle) => richtungen.map(d => nachbar(zelle, d)).filter(n => n !== null),
    /** Drehachse eines Elements: immer y, senkrecht zum Feld. */
    drehachse: () => 'y',
    /** Wirksame Stellungen eines drehbaren Elements (Spiegel 0–3, weil rot und rot + 4 gleich wirken), sonst keine. */
    stellungen: (el) => (L.isRotatable(el) ? [...Array(period(el)).keys()] : []),
    /**
     * Das Level in jeder Drehung des Felds um die Drehachse, je eine Vierteldrehung weiter; die erste ist das Level
     * selbst. Gedreht ist es dasselbe Rätsel: Elemente, Richtungen, Stellungen und Lösung drehen mit, und viermal
     * gedreht ist es wieder das Level. Für Werte, die nicht von der Reihenfolge der Zellen abhängen sollen (Ticket 12).
     * Ein Spiegelbild wäre kein Ersatz: Ein Prisma bricht Rot und Blau zu verschiedenen Seiten.
     */
    drehungen: (level) => {
      const out = [level];
      while (out.length < 4) out.push(vierteldrehung(out.at(-1)));
      return out;
    },
  };
}
