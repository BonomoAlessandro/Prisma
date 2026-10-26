// Feldform (Spec „Feldform“): Beurteilung, Spielermodell und Generator kennen das Feld nur über sie. Sie liefert die
// Zellen, die Nachbarn, die Richtungen, die Drehachse eines Elements, seine möglichen Stellungen und was es in einer
// Stellung mit einem Strahl macht, dazu die Drehungen eines Levels und für den Generator die Leveldaten eines Elements
// in einer Zelle mit einer der möglichen Drehachsen (element, drehachsen) und des Felds (rahmen). Nur hier stehen
// Koordinaten, die acht Richtungen der flachen Level und die Wirkung der Elemente in diesen Richtungen; sie kommt aus
// der Strahlregel (ADR 0003).
//
// - Zelle: ein Schlüssel wie in der Lösung eines Levels („x,z“ im flachen Feld). Ausserhalb der Feldform wird er nie
//   zerlegt, nur verglichen und in Begründungen genannt.
// - Richtung: ein Wert aus richtungen, die Zahlen 0 … n − 1 (n höchstens 32), damit sie als Index und als Bit einer
//   Maske dienen kann. Was sie im Feld bedeutet, weiss nur die Feldform; ausserhalb wird sie nur verglichen, als Index
//   genutzt und der Feldform zurückgegeben.
// - Stellung: eine kleine Zahl wie in der Lösung (Drehung eines Spiegels oder Prismas, Ausgang eines Kombinators). Was
//   sie bewirkt, sagen spiegeln, brechen und ausgang.
// - Strahlbild: von der Strahlregel. Seine Ereignisse und Abschnitte liest nur die Feldform (zelleBei, abschnitt,
//   durchlauf), mit so vielen Koordinaten, wie sie hat.
//
// Auf main gibt es nur die flache Feldform. Eine weitere Feldform (Würfel, Ticket 14) liefert dieselben Teile, auch
// eigene Drehungen, und kommt in feldformVon dazu.
import { L, period, getRot } from '../solver.mjs';
import { wuerfelFeldform } from './feldform-wuerfel.mjs'; // nur auf dem Würfel-Branch

/**
 * Flache Feldformen nach Grösse, einmal angelegt: Ihre Nachbartabelle kostet etwas. Alle Beurteilungen im Prozess
 * teilen sich eine Feldform je Grösse; darum ist sie eingefroren (flacheFeldform), kein Aufrufer kann sie verändern.
 */
const FLACH = new Map();

/** Die Feldform eines Levels. */
export function feldformVon(level) {
  // nur auf dem Würfel-Branch, Standard wie createBoard3
  if (level.dim === 3) return wuerfelFeldform(level.size || 5, level.height || level.size || 5);
  if (level.dim !== undefined && level.dim !== 2) throw new Error(`Level "${level.name}": keine Feldform für dim ${level.dim}`);
  const groesse = level.size || 7;
  if (!FLACH.has(groesse)) FLACH.set(groesse, flacheFeldform(groesse));
  return FLACH.get(groesse);
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
  /** Gegenrichtung: zurück auf derselben Linie. */
  const gegen = (richtung) => (richtung + richtungen.length / 2) % richtungen.length;
  const schritt = (zelle, richtung) => {
    const [x, z] = zelle.split(',').map(Number), [dx, dz] = L.DIRS[richtung];
    return inside(x + dx, z + dz) ? key(x + dx, z + dz) : null;
  };
  // Die Nachbarn je Zelle und Richtung einmal je Feldform: Das Spielermodell fragt sie in jeder Beurteilung
  // zehntausendfach ab (Ticket 18; vorher war das 40 % der Zeit des Generators). Dieselben Ergebnisse wie schritt.
  const tabelle = new Map(zellen.map(z => [z, richtungen.map(d => schritt(z, d))]));
  /** Nachbarzelle in einer Richtung, null am Rand. */
  const nachbar = (zelle, richtung) => {
    const reihe = tabelle.get(zelle);
    return reihe && richtung in reihe ? reihe[richtung] : schritt(zelle, richtung);
  };
  /** Stellung, in der ein Element steht: Drehung eines Spiegels oder Prismas, Ausgang eines Kombinators oder Quelle. */
  const stellungVon = (el) => (el.type === 'source' ? el.dir : getRot(el));
  /**
   * Das Level um eine Vierteldrehung gedreht: Ost wird Süd, jede Richtung und Stellung zwei Schritte weiter. Fehlt sie
   * in den Leveldaten, gilt 0 wie in der Strahlregel.
   */
  const vierteldrehung = (level) => {
    const platz = (x, z) => [groesse - 1 - z, x], schritte = richtungen.length / 4;
    const elements = level.elements.map((e) => {
      const [x, z] = platz(e.x, e.z), neu = { ...e, x, z };
      if (['source', 'combiner'].includes(e.type)) neu.dir = ((e.dir ?? 0) + schritte) % richtungen.length;
      if (['mirror', 'prism'].includes(e.type)) neu.rot = ((e.rot ?? 0) + schritte) % richtungen.length;
      return neu;
    });
    const solution = {};
    for (const e of level.elements.filter(L.isRotatable)) {
      const zelle = key(e.x, e.z);
      if (zelle in level.solution) solution[key(...platz(e.x, e.z))] = (level.solution[zelle] + schritte) % period(e);
    }
    return { ...level, elements, solution };
  };
  // Eingefroren samt Zellen, Richtungen, Drehachsen und Rahmen: feldformVon gibt dieselbe Feldform an alle Aufrufer
  return Object.freeze({
    art: 'flach',
    zellen: Object.freeze(zellen),
    richtungen: Object.freeze(richtungen),
    /**
     * Angaben der Leveldaten, die diese Feldform festlegen: feldformVon liest aus ihnen wieder dieselbe Feldform. Für
     * den Generator (Ticket 18), der Leveldaten zu einer Feldform schreibt; im Feld 7 × 7 keine, wie in LEVELS.
     */
    rahmen: Object.freeze(groesse === 7 ? {} : { size: groesse }),
    /** Zelle eines Elements (aus den Leveldaten oder vom Brett der Strahlregel). */
    zelle: (el) => key(el.x, el.z),
    /**
     * Leveldaten eines Elements in zelle: angaben (type, color, fixed …) mit dem Platz der Zelle; zelle(element) ist
     * wieder zelle. Die Stellung setzt der Aufrufer (setRot), eine Quelle entsteht mit quelleStatt. Für den Generator
     * (Ticket 18), der Elemente nur über Zellen setzt. drehachse ist eine aus drehachsen, Vorgabe die erste (Ticket
     * 22); sie steht nicht in den Leveldaten, denn im flachen Feld gibt es nur y.
     */
    element: (zelle, { type, drehachse = 'y', ...angaben }) => {
      if (drehachse !== 'y') throw new Error(`Flache Feldform: keine Drehachse ${drehachse}`);
      const [x, z] = zelle.split(',').map(Number);
      return { type, x, z, ...angaben };
    },
    /**
     * Die Drehachsen, die ein Element hier haben kann (Werte wie drehachse), die erste ist die Vorgabe von element. Im
     * flachen Feld nur y; im Würfel lenkt ein Element mit waagrechter Achse Licht zwischen die Ebenen. Der Generator
     * setzt drehbare Elemente und Quellen mit jeder von ihnen (Ticket 22).
     */
    drehachsen: Object.freeze(['y']),
    /** Zelle eines Ereignisses im Strahlbild (oder eines Punkts mit seinen Koordinaten); null hinter der Feldkante. */
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
     * je { zelle, achse }. Die Achse ist die Linie, auf der er läuft: für beide Laufrichtungen derselbe Wert, für
     * verschiedene Linien verschiedene (hier die kleinere der beiden Richtungen).
     */
    durchlauf: (s) => {
      const dx = Math.sign(Math.round((s.x1 - s.x0) * 1000)), dz = Math.sign(Math.round((s.z1 - s.z0) * 1000));
      const richtung = L.DIRS.findIndex(([a, b]) => a === dx && b === dz);
      const achse = richtung < 0 ? richtung : Math.min(richtung, gegen(richtung));
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
    /** Drehachse des Elements el: im flachen Feld immer y, senkrecht zum Feld. */
    drehachse: () => 'y',
    /** Wirksame Stellungen eines drehbaren Elements (Spiegel 0–3, weil rot und rot + 4 gleich wirken), sonst keine. */
    stellungen: (el) => (L.isRotatable(el) ? [...Array(period(el)).keys()] : []),
    /**
     * Wohin ein Spiegel in stellung Licht lenkt, das in Richtung richtung auf ihn trifft: die neue Richtung, null, wenn
     * es parallel zur Fläche läuft (die Rahmenkante schluckt es). Ohne stellung die, in der er steht.
     */
    spiegeln: (el, richtung, stellung = stellungVon(el)) => {
      const neu = L.reflectOnMirror(richtung, stellung);
      return neu === richtung ? null : neu;
    },
    /**
     * Was ein Prisma in stellung aus Licht der Farbe farbe (Maske) macht, das in Richtung richtung auf es trifft:
     * [{ richtung, farbe }] je austretende Grundfarbe, leer, wenn kein Licht austritt. Ohne stellung die, in der es
     * steht.
     */
    brechen: (el, richtung, farbe, stellung = stellungVon(el)) =>
      L.refractInPrism(richtung, farbe, stellung).map(o => ({ richtung: o.dir, farbe: o.color })),
    /**
     * Richtung, in die eine Quelle oder ein Kombinator in stellung Licht abgibt (eine Quelle hat nur ihre eigene). Ohne
     * stellung die, in der es steht.
     */
    ausgang: (el, stellung = stellungVon(el)) => (el.type === 'source' ? el.dir : stellung),
    /** Startstrahl für die Strahlregel (traceBeams, extraRays): Licht der Farbe farbe ab zelle in Richtung richtung. */
    startstrahl: (zelle, richtung, farbe) => {
      const [x, z] = zelle.split(',').map(Number);
      return { x, z, dir: richtung, color: farbe };
    },
    /**
     * Leveldaten einer Quelle an der Stelle des Elements el (Leveldaten), die in die Richtung leuchtet, in die el in
     * stellung abgibt (ausgang); ihre Farbe setzt der Aufrufer.
     */
    quelleStatt: (el, stellung) => ({ ...el, type: 'source', dir: stellung }),
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
  });
}
