// Wege des Lichts für die Bausteine der Kernideen (Ticket 19): Licht gezielt an eine Zelle bringen, Strahlen ab einer
// Zelle verfolgen, Stellungen eines Spiegels für eine Richtung finden. Wie der Bau (bau.mjs) kennt alles hier das Feld
// nur über die Feldform: Zellen werden nur verglichen, Richtungen und Stellungen nur verglichen, als Index genutzt und
// der Feldform zurückgegeben.
import { L, setRot } from '../../solver.mjs';

/** Farben der Quellen einer Kernidee: die sechs farbigen wie beim Ergänzen und Weiss. */
export const FARBEN = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white'];

/** Kann ein neues Element in zelle stehen, ohne fremdes Licht abzulenken? Frei, nicht reserviert, ohne Strahl. */
export function frei(bau, zelle, belegt = new Set()) {
  return !bau.bei(zelle) && !bau.reserviert.has(zelle) && !belegt.has(zelle) && !bau.durchgaenge(bau.bild()).has(zelle);
}

/**
 * Zellen ab zelle (ohne sie) in Richtung richtung, solange sie leer, nicht reserviert und nicht in belegt sind; hält
 * vor der ersten anderen Zelle oder an der Feldkante.
 */
export function strahl(bau, zelle, richtung, belegt = new Set()) {
  const out = [];
  for (let z = bau.feldform.nachbar(zelle, richtung); z !== null; z = bau.feldform.nachbar(z, richtung)) {
    if (bau.bei(z) || bau.reserviert.has(z) || belegt.has(z)) break;
    out.push(z);
  }
  return out;
}

/**
 * Richtungen, in die ein Spiegel Licht aus Richtung richtung sinnvoll lenkt (weder zurück noch geschluckt), je
 * Stellung: [{ stellung, richtung }].
 */
export function auswege(bau, el, richtung) {
  return bau.feldform.stellungen(el).flatMap((stellung) => {
    const neu = bau.feldform.spiegeln(el, richtung, stellung);
    return neu === null || neu === bau.gegen[richtung] ? [] : [{ stellung, richtung: neu }];
  });
}

/** Richtung, in der Licht in einem Bild in zelle ankommt (der Abschnitt, der dort endet), oder null. */
export function einfall(bau, bild, zelle) {
  const s = bild.strahlbild.segments.find((seg) => {
    const { von, bis } = bau.feldform.abschnitt(seg);
    return bis === zelle && von !== zelle;
  });
  return s ? bau.laufrichtung(s) : null;
}

/**
 * Zellen, durch die das Licht eines Bilds läuft, und die Zellen, in denen seine Abschnitte enden (dort steht das
 * Element, das es lenkt oder schluckt); ohne die Zellen der Quellen.
 */
export function wegzellen(bau, bild) {
  const out = new Set();
  for (const s of bild.strahlbild.segments) {
    for (const { zelle } of bau.feldform.durchlauf(s)) out.add(zelle);
    const { bis } = bau.feldform.abschnitt(s);
    if (bis !== null) out.add(bis);
  }
  return out;
}

/** Licht (Maske), das in einem Bild auf das Element in zelle fällt (Ziele: ihr Treffer). */
export function trifft(bau, bild, zelle) {
  const id = bau.elemente.findIndex(e => bau.feldform.zelle(e) === zelle);
  return id < 0 ? 0 : bild.strahlbild.hits.get(id) || 0;
}

/**
 * Bild, in dem nur die Quelle q leuchtet und einige drehbare Elemente anders stehen: stellung ist eine Map Element →
 * Stellung. Wie bau.bildVon, die übrigen Quellen schlucken als Blocker.
 */
export function bildMit(bau, q, stellung = new Map()) {
  return bau.verfolge(bau.elemente.map((e) => {
    if (e.type === 'source' && q && e !== q) return { ...e, type: 'blocker' };
    if (!stellung.has(e)) return e;
    const kopie = { ...e };
    setRot(kopie, stellung.get(e));
    return kopie;
  }));
}

/**
 * Rückwärts von zelle: Wo kann Licht herkommen, das in Richtung richtung in zelle ankommt, über genau spiegel drehbare
 * Spiegel aus einer neuen Quelle am Rand? Rückgabe: { teile: [{ zelle, richtung } der Quelle, dann je Spiegel
 * { zelle, stellung }], weg: Zellen, durch die das Licht läuft } oder null. Spiegel und Quelle kommen nur auf Zellen
 * ohne fremdes Licht; der Weg meidet belegt.
 */
function rueckwaerts(bau, zelle, richtung, spiegel, belegt) {
  const { feldform, R } = bau, zurueck = bau.gegen[richtung];
  const linie = strahl(bau, zelle, zurueck, belegt);
  if (spiegel === 0) {
    const rand = linie.at(-1);
    if (rand === undefined || feldform.nachbar(rand, zurueck) !== null || !frei(bau, rand, belegt)) return null;
    if (!bau.quelle(rand, richtung)) return null;
    return { teile: [{ zelle: rand, richtung }], weg: linie.slice(0, -1) };
  }
  for (const i of R.shuffle([...linie.keys()])) {
    const m = linie[i];
    if (!frei(bau, m, belegt)) continue;
    const el = feldform.element(m, { type: 'mirror' });
    const noch = new Set([...belegt, ...linie.slice(0, i + 1)]);
    for (const stellung of R.shuffle([...feldform.stellungen(el)])) {
      for (const ein of R.shuffle([...feldform.richtungen])) {
        if (feldform.spiegeln(el, ein, stellung) !== richtung || ein === zurueck) continue;
        const rest = rueckwaerts(bau, m, ein, spiegel - 1, noch);
        if (rest) return { teile: [...rest.teile, { zelle: m, stellung }], weg: [...rest.weg, ...linie.slice(0, i)] };
      }
    }
  }
  return null;
}

/**
 * Bringt Licht der Farbe farbe in Richtung richtung nach zelle: eine neue Quelle am Rand und genau spiegel drehbare
 * Spiegel dazwischen, alle als Kernidee (kern), auf Zellen ohne fremdes Licht; der Weg meidet belegt. Prüft mit der
 * Strahlregel, dass das Licht der Quelle allein dort ankommt (ein Element in zelle muss es treffen oder brechen).
 * Rückgabe: { quelle, spiegel: [Elemente], weg: Zellen des Lichts } oder null (dann ist nichts gesetzt).
 */
export function zufuehren(bau, zelle, richtung, { spiegel = 1, farbe = 'white', belegt = new Set() } = {}) {
  const { feldform } = bau;
  const gefunden = rueckwaerts(bau, zelle, richtung, spiegel, new Set([...belegt, zelle]));
  if (!gefunden) return null;
  const [anfang, ...rest] = gefunden.teile;
  const quelle = bau.setze(bau.quelle(anfang.zelle, anfang.richtung, farbe), { kern: true });
  const spiegelEl = rest.map(({ zelle: z, stellung }) => {
    const el = feldform.element(z, { type: 'mirror' });
    setRot(el, stellung);
    return bau.setze(el, { kern: true });
  });
  if (einfall(bau, bau.bildVon(quelle), zelle) !== richtung) {
    for (const el of [quelle, ...spiegelEl]) { bau.kern.delete(el); bau.entferne(el); }
    return null;
  }
  return { quelle, spiegel: spiegelEl, weg: gefunden.weg };
}

/** Alle Zellen der Abschnitte eines Bilds reservieren (der Weg des Lichts bleibt, wie er ist). */
export function reserviere(bau, bild) {
  for (const s of bild.strahlbild.segments) {
    for (const { zelle } of bau.feldform.durchlauf(s)) bau.reserviert.add(zelle);
  }
}

/** Farbmaske eines Farbnamens. */
export const maske = (farbe) => L.COLORS[farbe];
