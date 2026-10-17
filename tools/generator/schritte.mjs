// Schritte des Generators, gemeinsam für alle Bausteine und Grade (Ticket 18). Jeder arbeitet auf einem Bau (bau.mjs)
// in der Lösungsstellung und kennt das Feld nur über die Feldform. Die Reihenfolge im Ablauf (index.mjs):
//   ergaenze → setzeZiele → festige (aufraeumen, eindeutig, wirkungslos) → startstellung.
// Übernommen aus dem alten Generator (generate.mjs): Elemente entlang der Strahlen setzen, Ziele an die Strahlenden mit
// genau der Farbe, die dort ankommt, Elemente ohne Licht wegnehmen, Eindeutigkeit mit Blockern oder festen Spiegeln
// herstellen. Neu sind die Regel gegen wirkungslose Elemente (Spec „Generator“) und die Startstellung, die bei zu
// wenigen Klicks neu gewählt wird, statt das Level zu verwerfen (Spec „Effizienz“).
import { L, solve, setRot, clicksTo } from '../solver.mjs';

/** Farben farbiger Quellen (wie im alten Generator). */
const QUELLFARBEN = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta'];
/** So oft leuchtet eine neue Quelle schräg statt entlang ihres längsten Wegs ins Feld (der alte Generator: 10–20 %). */
const SCHRAEG = 0.15;
/** So oft wird höchstens eine Startstellung gewürfelt. */
const STARTVERSUCHE = 20;
/** Mindestens zwei Grundfarben. */
export const gemischt = (farbe) => (farbe & (farbe - 1)) !== 0;

/** Farbe einer neuen Quelle: mit dem Anteil anteil eine der Quellfarben, sonst Weiss. */
export const quellfarbe = (R, anteil) => (R.chance(anteil) ? R.pick(QUELLFARBEN) : 'white');

/**
 * Eine Quelle auf einen freien Platz am Rand, deren Weg ins Feld frei von Elementen ist (sie strahlt in keine andere
 * Quelle); meist entlang des längsten Wegs durchs Feld. Rückgabe: die Quelle oder null.
 */
export function setzeQuelle(bau, farbe, { kern = false } = {}) {
  const { R } = bau;
  const leer = (z) => !bau.bei(z);
  const frei = bau.quellplaetze()
    .filter(p => leer(p.zelle) && !bau.reserviert.has(p.zelle) && bau.weg(p.zelle, p.richtung).every(leer));
  if (!frei.length) return null;
  const zelle = R.pick([...new Set(frei.map(p => p.zelle))]);
  const dort = frei.filter(p => p.zelle === zelle), laengste = Math.max(...dort.map(p => p.laenge));
  const platz = R.chance(SCHRAEG) ? R.pick(dort) : R.pick(dort.filter(p => p.laenge === laengste));
  const q = bau.quelle(platz.zelle, platz.richtung, farbe);
  return q && bau.setze(q, { kern });
}

/** Ein drehbares Element der Art type auf einen Strahl, in einer Stellung, die das Licht sinnvoll weitergibt. */
export function setzeDrehbar(bau, type, { zellen = bau.strahlzellen(), kern = false } = {}) {
  const { R, feldform } = bau;
  // Ein Kombinator braucht eine Kreuzung zweier Strahlen, die beide enden (er schneidet beide ab). Ein Prisma auf Licht
  // einer Grundfarbe lenkt nur um wie ein Spiegel, darum nur auf Mischlicht (wie bisher).
  const frei = type === 'combiner' ? bau.kreuzungen(bau.bild(), { nurEnden: true }).map(zelle => ({ zelle }))
    : type === 'prism' ? zellen.filter(c => gemischt(c.farbe)) : zellen;
  if (!frei.length) return null;
  const c = R.pick(frei), el = feldform.element(c.zelle, { type });
  const moeglich = bau.stellungenFuer(el, c.richtung, c.farbe);
  if (!moeglich.length) return null;
  setRot(el, R.pick(moeglich));
  return bau.setze(el, { kern });
}

/**
 * Ein Filter auf Mischlicht, der dem Strahl dort eine Farbe nimmt (seine Farbe ist ein echter Teil der Strahlfarbe);
 * hinter ihm bleibt eine freie Zelle.
 */
function setzeFilter(bau) {
  const { R, feldform } = bau;
  const dahinter = (c) => {
    const z = feldform.nachbar(c.zelle, c.richtung);
    return z !== null && !bau.bei(z) && !bau.reserviert.has(z);
  };
  const frei = bau.strahlzellen().filter(c => gemischt(c.farbe) && dahinter(c));
  if (!frei.length) return null;
  const c = R.pick(frei);
  const teile = [1, 2, 3, 4, 5, 6].filter(m => (m & c.farbe) === m && m !== c.farbe);
  return bau.setze(feldform.element(c.zelle, { type: 'filter', color: L.COLOR_NAMES[R.pick(teile)] }));
}

/** Ein fester Spiegel auf das Ende eines Strahls, der das Licht ablenkt; er gehört zur Lösung. */
function setzeFestenSpiegel(bau) {
  const { R, feldform } = bau;
  const frei = bau.strahlzellen(bau.bild(), { nurEnden: true });
  if (!frei.length) return null;
  const c = R.pick(frei), el = feldform.element(c.zelle, { type: 'mirror', fixed: true });
  const moeglich = bau.stellungenFuer({ ...el, fixed: false }, c.richtung, c.farbe);
  if (!moeglich.length) return null;
  setRot(el, R.pick(moeglich));
  return bau.setze(el);
}

/**
 * Ergänzen bis zum Plan: Quellen bis plan.quellen, dann drehbare Elemente bis plan.drehbar (Arten nach den Gewichten
 * der Vorgabe), zuletzt Filter und feste Spiegel. Ein drehbares Element kommt ans Ende eines Strahls, der noch kein
 * Ziel hat: So behalten früher gesetzte Elemente und Ziele ihr Licht, die Stränge wachsen an ihrem Ende. Endet kein
 * Strahl mehr offen, kommt eine weitere Quelle dazu, solange die Vorgabe es erlaubt. Die Elemente der Kernidee bleiben,
 * wie sie sind (ihre Wege sind reserviert).
 */
export function ergaenze(bau, plan, vorgaben) {
  const { R } = bau;
  const neueQuelle = () => bau.art('source').length < vorgaben.quellen[1]
    && setzeQuelle(bau, quellfarbe(R, vorgaben.farbigeQuellen));
  while (bau.art('source').length < plan.quellen && neueQuelle());
  for (let versuch = 0; bau.drehbare().length < plan.drehbar && versuch < 4 * plan.drehbar; versuch++) {
    const zellen = bau.strahlzellen(bau.bild(), { nurEnden: true });
    if (zellen.length) setzeDrehbar(bau, R.gewichtet(vorgaben.arten), { zellen });
    else if (!neueQuelle()) break;
  }
  for (let i = bau.art('filter').length; i < plan.filter; i++) setzeFilter(bau);
  for (let i = bau.art('mirror').filter(e => e.fixed).length; i < plan.festeSpiegel; i++) setzeFestenSpiegel(bau);
}

/**
 * Ziele an die Enden der Strahlen, bis es anzahl sind: je endendem Strahl eines, auf einer der letzten freien Zellen
 * davor. Ein Strahl ohne Ziel liesse die Elemente auf seinem Weg frei drehen (das Level wäre mehrdeutig), darum
 * bekommt jeder ein Ziel, solange die Obergrenze es erlaubt. Die Farbe setzt aufraeumen (die Farbe, die dort ankommt).
 */
export function setzeZiele(bau, anzahl) {
  const { R, feldform } = bau;
  const plaetze = R.shuffle(bau.strahlenden().map(letzte => R.pick(letzte)));
  for (const zelle of plaetze) {
    if (bau.art('target').length >= anzahl) break;
    if (!bau.bei(zelle)) bau.setze(feldform.element(zelle, { type: 'target', color: 'white' }));
  }
}

/**
 * Ziele färben und Elemente ohne Licht wegnehmen, bis sich nichts mehr ändert: Jedes Ziel bekommt die Farbe, die in der
 * Lösung ankommt; ein Ziel ohne Licht fällt weg, ebenso ein drehbares Element (seine Stellung wäre egal, das Level also
 * mehrdeutig) und ein Filter ohne Licht. Danach fällt ein drehbares Element weg, dessen Licht kein Ziel erreicht: Steht
 * ein Blocker an seiner Stelle oder fehlt es, bekommt jedes Ziel dasselbe Licht (sonst lenkt es Licht von einem Ziel
 * fern, und die Eindeutigkeit entscheidet). Rückgabe: null oder der Grund, warum es nicht weitergeht.
 */
export function aufraeumen(bau) {
  const { feldform } = bau;
  for (let runde = 0; runde < 20; runde++) {
    const { brett, strahlbild } = bau.bild(), licht = bau.licht();
    const weg = [];
    let gefaerbt = false;
    brett.elements.forEach((t, id) => {
      if (t.type !== 'target') return;
      const el = bau.elemente[id], farbe = strahlbild.hits.get(id) || 0;
      if (!farbe) weg.push(el);
      else if (L.COLORS[el.color] !== farbe) { el.color = L.COLOR_NAMES[farbe]; gefaerbt = true; }
    });
    for (const el of bau.elemente) {
      if ((feldform.stellungen(el).length || el.type === 'filter') && !licht.has(feldform.zelle(el))) weg.push(el);
    }
    if (gefaerbt) bau.geaendert();
    if (!weg.length) {
      const blind = bau.drehbare().find(r => !bau.kern.has(r) && !zieleAnders(bau, mitBlocker(bau, r))
        && !zieleAnders(bau, bau.verfolge(bau.elemente.filter(e => e !== r))));
      if (!blind) return null;
      weg.push(blind);
    }
    if (weg.some(el => bau.kern.has(el))) return 'Kernidee ohne Licht';
    for (const el of weg) bau.entferne(el);
  }
  return 'Aufräumen endet nicht';
}

/**
 * Eindeutigkeit herstellen (wie makeUnique im alten Generator): Hat das Level eine zweite Lösung, kommt ein Blocker auf
 * eine freie Zelle, über die nur deren Licht läuft; gibt es keine, wird ein drehbarer Spiegel fest, der dort anders
 * steht (nur Spiegel zeigen im Spiel, dass sie fest sind). Höchstens vorgaben.reparaturen Reparaturen. Die Suche hält
 * bei der zweiten Lösung an (Modus unique, Ticket 04). Rückgabe: null (eindeutig) oder der Grund.
 */
export function eindeutig(bau, vorgaben) {
  const { R, feldform } = bau;
  for (let reparatur = 0; ; reparatur++) {
    const level = bau.level();
    const res = solve(level, { unique: true, collect: 6, maxNodes: vorgaben.maxSuche });
    if (res.aborted) return 'Suche zu gross';
    if (res.count === 1) return null;
    if (res.count === 0) return 'keine Lösung';
    if (reparatur >= vorgaben.reparaturen) return 'nicht eindeutig';
    const anders = (set) => Object.entries(set).filter(([z, v]) => z in level.solution && v !== level.solution[z]);
    const alt = res.solutions.find(s => s.free || anders(s.set).length);
    if (!alt) return 'keine zweite Lösung greifbar';
    const zellen = (bild) => new Set(bild.strahlbild.segments.flatMap(s => feldform.durchlauf(s).map(d => d.zelle)));
    const altElemente = bau.elemente.map((e) => {
      const z = feldform.zelle(e);
      if (!(z in alt.set) || !feldform.stellungen(e).length) return e;
      const kopie = { ...e };
      setRot(kopie, alt.set[z]);
      return kopie;
    });
    const jetzt = zellen(bau.bild());
    const frei = [...zellen(bau.verfolge(altElemente))]
      .filter(z => !jetzt.has(z) && !bau.bei(z) && !bau.reserviert.has(z));
    if (frei.length) {
      bau.setze(feldform.element(R.pick(frei), { type: 'blocker' }));
      continue;
    }
    const andersIn = new Set(anders(alt.set).map(([z]) => z));
    const spiegel = bau.drehbare().filter(e => e.type === 'mirror' && andersIn.has(feldform.zelle(e)));
    if (!spiegel.length) return 'zweite Lösung nicht blockierbar';
    R.pick(spiegel).fixed = true;
    bau.geaendert();
  }
}

/** Licht der Ziele in einem Bild, nach Zelle: Map Zelle → Farbe (Maske). */
function zielLicht(bau, { brett, strahlbild }) {
  const ziele = brett.elements.filter(e => e.type === 'target');
  return new Map(ziele.map(t => [bau.feldform.zelle(t), strahlbild.hits.get(t.id) || 0]));
}

/** Bild der Lösungsstellung mit einem Blocker an der Stelle des Elements el. */
const mitBlocker = (bau, el) => bau.verfolge(bau.elemente.map(e => (e === el ? { ...e, type: 'blocker' } : e)));

/** Bekommt ein Ziel in bild anderes Licht als in der Lösung? (Ziele, die dort fehlen, zählen nicht.) */
function zieleAnders(bau, bild) {
  const vorher = zielLicht(bau, bau.bild());
  return [...zielLicht(bau, bild)].some(([z, farbe]) => vorher.get(z) !== farbe);
}

/** Hat das Level ohne das Element el eine zweite Lösung? (wegnahme: was an seiner Stelle steht, null: nichts) */
function sonstMehrdeutig(bau, el, wegnahme, vorgaben) {
  const level = bau.level();
  const i = bau.elemente.indexOf(el);
  level.elements = wegnahme ? level.elements.map((e, j) => (j === i ? wegnahme : e))
    : level.elements.filter((_, j) => j !== i);
  const res = solve(level, { unique: true, collect: 0, maxNodes: vorgaben.maxSuche });
  return res.aborted || res.count > 1;
}

/**
 * Das erste wirkungslose Element oder null (Spec „Generator“: keine wirkungslosen Elemente; eine Regel des Generators,
 * kein Ausschlussgrund der Beurteilung). Der Bau ist gelöst und eindeutig. Wirkungslos ist
 * - ein Filter, der keinem Strahl der Lösung Farbe nimmt (sein Strahl hat schon die Filterfarbe), der eine fremde Farbe
 *   abgibt (weder seine eigene noch die eintreffende, etwa Cyan durch einen Gelbfilter als Grün; so verlangen es die
 *   Tests der Level im Spiel) oder der nicht für die Lösung zählt (siehe unten, an seiner Stelle ein weisser Filter);
 * - eine Quelle, ohne die jedes Ziel dasselbe Licht bekommt;
 * - ein Ziel, dessen Licht von keinem drehbaren Element abhängt (es leuchtet geschenkt);
 * - ein fester Spiegel oder Blocker, der nicht für die Lösung zählt.
 * Für die Lösung zählt ein festes Teil, wenn ohne es ein Ziel anderes Licht bekommt oder das Level eine zweite Lösung
 * hätte. Lockvögel (feste Teile abseits der Lösung, die beim Probieren Licht bekommen) setzt erst ihr Baustein (Ticket
 * 19); bis dahin zählt ein festes Teil nur über die Lösung. Ist ein Element der Kernidee wirkungslos, kommt der Grund
 * zurück.
 */
export function wirkungslos(bau, vorgaben) {
  const { feldform } = bau, { strahlbild } = bau.bild();
  const ohne = (el) => bau.verfolge(bau.elemente.filter(e => e !== el));
  const statt = (el, ersatz) => bau.verfolge(bau.elemente.map(e => (e === el ? ersatz : e)));
  const zaehlt = (el, ersatz = null) => zieleAnders(bau, ersatz ? statt(el, ersatz) : ohne(el))
    || sonstMehrdeutig(bau, el, ersatz, vorgaben);
  const funde = [];
  for (const f of bau.art('filter')) {
    const zelle = feldform.zelle(f), farbe = L.COLORS[f.color];
    const ein = strahlbild.segments.filter((s) => {
      const { von, bis } = feldform.abschnitt(s);
      return bis === zelle && von !== zelle;
    }).map(s => s.color);
    const nimmt = ein.some(c => (c & farbe) !== c);
    const fremd = ein.some(c => (c & farbe) && (c & farbe) !== farbe && (c & farbe) !== c);
    if (!nimmt || fremd || !zaehlt(f, { ...f, color: 'white' })) funde.push(f);
  }
  for (const q of bau.art('source')) if (!zieleAnders(bau, ohne(q))) funde.push(q);
  const abhaengig = new Set(), inLoesung = zielLicht(bau, bau.bild());
  for (const r of bau.drehbare()) {
    for (const [z, farbe] of zielLicht(bau, mitBlocker(bau, r))) if (farbe !== inLoesung.get(z)) abhaengig.add(z);
  }
  for (const t of bau.art('target')) if (!abhaengig.has(feldform.zelle(t))) funde.push(t);
  for (const el of bau.elemente) {
    if (funde.length) break;
    if ((el.type === 'mirror' && el.fixed) || el.type === 'blocker') if (!zaehlt(el)) funde.push(el);
  }
  if (!funde.length) return null;
  return bau.kern.has(funde[0]) ? 'Kernidee wirkungslos' : funde[0];
}

/**
 * Festigen: aufräumen, Eindeutigkeit herstellen und wirkungslose Elemente wegnehmen, bis keines mehr übrig ist.
 * Rückgabe: null oder der Grund, warum es nicht weitergeht.
 */
export function festige(bau, vorgaben) {
  for (let runde = 0; runde < 12; runde++) {
    let grund = aufraeumen(bau);
    if (!grund && !bau.art('target').length) grund = 'keine Ziele';
    if (!grund && !bau.bild().strahlbild.solved) grund = 'Lösungsstellung nicht gelöst';
    grund ??= eindeutig(bau, vorgaben);
    if (grund) return grund;
    const w = wirkungslos(bau, vorgaben);
    if (w === null) return null;
    if (typeof w === 'string') return w;
    bau.entferne(w);
  }
  return 'Festigen endet nicht';
}

/** Klicks von Stellung von bis Stellung nach eines Elements, je der kürzere Drehweg (wie clicksTo im Löser). */
function klicks(feldform, el, von, nach) {
  const n = feldform.stellungen(el).length, d = (((nach - von) % n) + n) % n;
  return Math.min(d, n - d);
}

/**
 * Die Leveldaten in einer Startstellung (Spec „Effizienz“): Jedes drehbare Element steht anders als in der Lösung,
 * höchstens ein Ziel leuchtet (keines bei nur einem Ziel), und es braucht mindestens vorgaben.klicks Klicks. Reichen
 * die Klicks nicht, drehen einzelne Elemente weiter weg; misslingt eine Startstellung, wird eine neue gewürfelt, statt
 * das Level zu verwerfen. Rückgabe: die Leveldaten (wie in LEVELS, mit grad) oder ein Grund (Text).
 */
export function startstellung(bau, vorgaben, grad) {
  const { R, feldform } = bau;
  const { name, elements, solution, ...rahmen } = bau.level();
  const level = { name, grad, ...rahmen, elements, solution };
  const drehbar = elements.filter(e => feldform.stellungen(e).length);
  const ziele = elements.filter(e => e.type === 'target').length;
  for (let versuch = 0; versuch < STARTVERSUCHE; versuch++) {
    for (const el of drehbar) {
      const loesung = solution[feldform.zelle(el)];
      setRot(el, R.pick(feldform.stellungen(el).filter(v => v !== loesung)));
    }
    for (const el of R.shuffle([...drehbar])) {
      if (clicksTo(level, solution) >= vorgaben.klicks) break;
      const loesung = solution[feldform.zelle(el)];
      const weitest = Math.max(...feldform.stellungen(el).map(v => klicks(feldform, el, loesung, v)));
      setRot(el, feldform.stellungen(el).find(v => klicks(feldform, el, loesung, v) === weitest));
    }
    if (clicksTo(level, solution) < vorgaben.klicks) return 'zu wenige Klicks möglich';
    const start = L.traceBeams(L.createBoard(level));
    if (!start.solved && start.satisfied.size <= (ziele > 1 ? 1 : 0)) return level;
  }
  return 'keine gute Startstellung';
}
