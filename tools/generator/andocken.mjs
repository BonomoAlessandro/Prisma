// Andocken (Ticket 28): Ein Strang der Kernidee bekommt Verbindung zu anderem Licht, ohne dass sich das Licht der
// Kernidee ändert. Ab „mittel“ ist ein Strang der Kernidee sonst oft ein Füllteil oder abgetrennt (Zerfall): Ihre
// Bausteine setzen Spiegel und Quellen auf Zellen ohne fremdes Licht und reservieren ihre Wege, und ihre Ziele darf
// „schwerer“ nicht öffnen (Ticket 20, „Nach dem Merge mit 19“). Zwei Wege:
// - An einen Spiegel andocken: Fremdes Licht fällt aus einer anderen Richtung auf einen drehbaren Spiegel des Strangs.
//   Der Spiegel bleibt in seiner Stellung, lenkt das neue Licht weiter, und an dessen Ende kommt ein eigenes Ziel. So
//   zählt seine Stellung auch für fremdes Licht, und die Ziele beider Stränge hängen an ihm zusammen. Das Licht kommt
//   - vom Ende eines Strahls, der offen oder auf einem Ziel ausserhalb der Kernidee endet: Ein neuer drehbarer Spiegel
//     auf einer freien Zelle dort lenkt es auf den Spiegel (wie das Ergänzen: Der Strang wächst an seinem Ende);
//   - oder von einer neuen Quelle am Rand, direkt oder über einen neuen drehbaren Spiegel auf einer Zelle ohne Licht.
//     Erlaubt die Vorgabe keine Quelle mehr, weicht eine Quelle ausserhalb der Kernidee (ihr Strang fällt weg). Die
//     neue Quelle teilt keine Grundfarbe mit den Zielen der Kernidee, wo das geht (fremdfarbe in schritte.mjs).
// - Ein Prisma vorschalten: Eine Quelle der Kernidee mit einer Grundfarbe leuchtet in Mischlicht, das diese Grundfarbe
//   enthält, und ein drehbares Prisma auf ihrem ersten Abschnitt bricht die Grundfarbe in die alte Richtung weiter.
//   Die übrigen Grundfarben brechen zur Seite, dort setzt das Ergänzen neue Stränge an. Licht über ein Prisma ist kein
//   Strang (kein Füllteil), und die neuen Ziele hängen mit denen der Kernidee am Prisma zusammen.
// Licht darf reservierte Zellen kreuzen (dort steht nur kein neues Element), denn Licht stört Licht nicht. Geprüft mit
// der Strahlregel: Die Ziele der Kernidee bekommen dasselbe Licht wie vorher, die Lockvögel bleiben dunkel, das neue
// Licht endet dort, wo ein Ziel hinkommen kann, und beim Andocken an einen Spiegel bekommt dieser Licht aus einer
// Quelle, die ihn vorher nicht erreichte. Weicht dafür eine Quelle, heisst „vorher“ nach ihrem Wegfall: Brachte sie
// einem Ziel der Kernidee Licht, ändert sich dessen Licht, und ob die Kernidee noch nötig ist, entscheidet die
// Beurteilung (Review Ticket 28: Gegen das Licht vor dem Wegfall geprüft, lieferte schwer-abzaehlen 44 statt 50
// Haupt-Level aus 200 Seeds, Abschalten gleich viele). Welche Elemente der Aufrufer anbietet, entscheidet er
// (verfeinern.mjs: nur solche der Kernidee, die nicht in bau.unberuehrt stehen; der Baustein Abschalten: den zweiten
// Spiegel von A). Wie alles im Generator kennt das hier das Feld nur über die Feldform.
import { setRot } from '../solver.mjs';
import { gemischt, fremdfarbe } from './schritte.mjs';
import { lichtzellen, FARBEN, maske } from './bausteine/wege.mjs';

/** So viele Möglichkeiten probiert das Andocken höchstens aus, bevor es aufgibt. */
const PROBEN = 8;

/**
 * Zellen ab zelle (ohne sie) in Richtung richtung bis vor das erste Element oder bis zur Feldkante. Anders als strahl
 * (wege.mjs) zählen reservierte Zellen mit: Licht darf sie kreuzen.
 */
function bisElement(bau, zelle, richtung) {
  const { nachbar } = bau.feldform, out = [];
  for (let z = nachbar(zelle, richtung); z !== null && !bau.bei(z); z = nachbar(z, richtung)) out.push(z);
  return out;
}

/**
 * Freie Zellen auf den letzten Abschnitten der Strahlen, die offen oder auf einem Ziel ausserhalb der Kernidee enden
 * (wie kreuzungszellen in schritte.mjs): ohne Element, nicht reserviert und nur von diesem Strahl durchlaufen.
 * Rückgabe: Map Zelle → [Laufrichtung].
 */
function enden(bau) {
  const { feldform } = bau, bild = bau.bild(), endet = bau.endet(bild), durchgaenge = lichtzellen(bau), out = new Map();
  for (const s of bild.strahlbild.segments) {
    const ziel = bau.bei(feldform.abschnitt(s).bis);
    if (!endet(s) && !(ziel?.type === 'target' && !bau.kern.has(ziel))) continue;
    const richtung = bau.laufrichtung(s);
    if (richtung === null) continue;
    for (const { zelle } of feldform.durchlauf(s)) {
      if (bau.reserviert.has(zelle) || durchgaenge.get(zelle) !== 1) continue;
      if (!out.has(zelle)) out.set(zelle, []);
      out.get(zelle).push(richtung);
    }
  }
  return out;
}

/** Die Quellen, deren Licht allein das Element in zelle erreicht. */
const quellenAuf = (bau, zelle) => new Set(bau.art('source').filter(q => bau.licht(bau.bildVon(q)).has(zelle)));

/** Licht der Ziele der Kernidee nach Zelle, als Text zum Vergleichen; dazu, ob ein Lockvogel Licht bekommt. */
function kernBild(bau) {
  const { feldform } = bau, { strahlbild } = bau.bild(), licht = bau.licht();
  const ziele = bau.elemente.flatMap((e, id) => (e.type === 'target' && bau.kern.has(e)
    ? [`${feldform.zelle(e)}:${strahlbild.hits.get(id) || 0}`] : []));
  return ziele.join(' ') + ([...bau.lockvoegel].some(e => licht.has(feldform.zelle(e))) ? ' Lockvogel im Licht' : '');
}

/**
 * Hält das Andocken noch (dock aus dockeAn)? Die Ziele der Kernidee bekommen dasselbe Licht wie vorher, und in der
 * Zelle steht noch das drehbare Element: beim Andocken an einen Spiegel mit Licht aus einer Quelle, die ihn vorher
 * nicht erreichte und (mitZiel) allein einem Ziel Licht bringt, erst dann zählt seine Stellung für ein anderes Ziel;
 * beim Vorschalten das Prisma. Gleich nach dem Andocken (mitZiel false) hat das neue Licht noch kein Ziel, die Ziele
 * setzt erst setzeZiele.
 */
export function angedockt(bau, { art, zelle, vorher, kern }, { mitZiel = true } = {}) {
  const el = bau.bei(zelle);
  if (el?.type !== art || !bau.feldform.stellungen(el).length || kernBild(bau) !== kern) return false;
  const ziele = bau.elemente.flatMap((e, id) => (e.type === 'target' ? [id] : []));
  return art === 'prism' || [...quellenAuf(bau, zelle)].some(q => !vorher.has(q)
    && (!mitZiel || ziele.some(id => bau.bildVon(q).strahlbild.hits.get(id))));
}

/**
 * Wie eine neue Quelle Licht in Richtung ein auf die Zelle am Ende von linie bringt (linie: die Zellen davor, von dort
 * aus rückwärts): direkt vom Rand der Linie oder über einen neuen Spiegel auf einer Zelle der Linie ohne Licht, vor
 * dem die Quelle am Rand steht. Rückgabe: Liste von { quelle: { zelle, richtung }, spiegel: { zelle, stellung } oder
 * null }.
 */
function vonQuelle(bau, linie, ein) {
  const { feldform } = bau, licht = lichtzellen(bau), out = [];
  const randFrei = (z, d) => feldform.nachbar(z, bau.gegen[d]) === null && !bau.reserviert.has(z) && !licht.has(z)
    && bau.quelle(z, d);
  const rand = linie.at(-1);
  if (rand !== undefined && randFrei(rand, ein)) out.push({ quelle: { zelle: rand, richtung: ein }, spiegel: null });
  for (const z of linie) {
    if (bau.reserviert.has(z) || licht.has(z)) continue;
    const el = feldform.element(z, { type: 'mirror' });
    for (const stellung of feldform.stellungen(el)) {
      for (const e of feldform.richtungen) {
        if (feldform.spiegeln(el, e, stellung) !== ein) continue;
        const q = bisElement(bau, z, bau.gegen[e]).at(-1);
        if (q !== undefined && randFrei(q, e)) {
          out.push({ quelle: { zelle: q, richtung: e }, spiegel: { zelle: z, stellung } });
        }
      }
    }
  }
  return out;
}

/** Möglichkeiten, fremdes Licht an den drehbaren Spiegel in zm anzudocken (neueQuelle: eine Quelle mehr erlaubt). */
function anSpiegel(bau, zm, offen, neueQuelle) {
  const { feldform } = bau, m = bau.bei(zm), out = [];
  for (const ein of feldform.richtungen) {
    const aus = feldform.spiegeln(m, ein);
    if (aus === null || aus === bau.gegen[ein]) continue;
    const linie = bisElement(bau, zm, bau.gegen[ein]);
    for (const z of linie) {
      for (const richtung of offen.get(z) ?? []) {
        const el = feldform.element(z, { type: 'mirror' });
        for (const stellung of feldform.stellungen(el)) {
          if (feldform.spiegeln(el, richtung, stellung) !== ein) continue;
          out.push({ art: 'mirror', zelle: zm, spiegel: { zelle: z, stellung } });
        }
      }
    }
    if (neueQuelle) for (const w of vonQuelle(bau, linie, ein)) out.push({ art: 'mirror', zelle: zm, ...w });
  }
  return out;
}

/**
 * Möglichkeiten, der Quelle in zq ein Prisma vorzuschalten: Sie hat eine Grundfarbe; auf einer Zelle ihres ersten
 * Abschnitts bricht ein Prisma in einer Stellung diese Grundfarbe aus Mischlicht in die alte Richtung, und für jede
 * übrige Grundfarbe ist die Zelle daneben frei.
 */
function vorPrisma(bau, zq) {
  const { feldform } = bau, q = bau.bei(zq), farbe = maske(q.color ?? 'white'), richtung = feldform.ausgang(q);
  const out = [];
  if (gemischt(farbe)) return out;
  const frei = (z, d) => {
    const n = feldform.nachbar(z, d);
    return n !== null && !bau.bei(n) && !bau.reserviert.has(n);
  };
  const mischungen = FARBEN.filter(f => (maske(f) & farbe) && maske(f) !== farbe);
  for (const zelle of bisElement(bau, zq, richtung)) {
    const el = feldform.element(zelle, { type: 'prism' });
    for (const stellung of feldform.stellungen(el)) {
      for (const mischung of mischungen) {
        const aus = feldform.brechen(el, richtung, maske(mischung), stellung);
        if (!aus.some(o => o.farbe === farbe && o.richtung === richtung)) continue;
        if (aus.every(o => o.farbe === farbe || frei(zelle, o.richtung))) {
          out.push({ art: 'prism', zelle, stellung, vor: zq, mischung });
        }
      }
    }
  }
  return out;
}

/**
 * Dockt einen Strang der Kernidee an (zellen: Zellen ihrer drehbaren Spiegel und Quellen). quellen: so viele Quellen
 * darf der Bau höchstens haben; farbigeQuellen wie in der Vorgabe (für fremdfarbe). Zuerst ohne eine Quelle
 * wegzunehmen; erst wenn das nicht geht, weicht eine Quelle ausserhalb der Kernidee. Rückgabe: null, wenn es nicht ging
 * (dann ist höchstens diese Quelle weggefallen), sonst { art, zelle, vorher, kern, neu } für angedockt: das drehbare
 * Element, an dem es hängt (Spiegel oder vorgeschaltetes Prisma), die Quellen, die es vorher erreichten, das Licht der
 * Kernidee (nach dem Wegfall einer weichenden Quelle, siehe oben) und die neu gesetzten Elemente.
 */
export function dockeAn(bau, zellen, { quellen, farbigeQuellen }) {
  const spiegel = zellen.filter(z => bau.bei(z)?.type === 'mirror');
  const quellzellen = zellen.filter(z => bau.bei(z)?.type === 'source');
  const offen = enden(bau), neueQuelle = bau.art('source').length < quellen;
  const moeglich = [...quellzellen.flatMap(zq => vorPrisma(bau, zq)),
    ...spiegel.flatMap(zm => anSpiegel(bau, zm, offen, neueQuelle))];
  const dock = probiere(bau, moeglich, farbigeQuellen);
  if (dock || neueQuelle || !spiegel.length) return dock;
  const tausch = bau.art('source').filter(q => !bau.kern.has(q));
  if (!tausch.length) return null;
  bau.entferne(bau.R.pick(tausch));
  return probiere(bau, spiegel.flatMap(zm => anSpiegel(bau, zm, enden(bau), true)), farbigeQuellen);
}

/** Probiert höchstens PROBEN der Möglichkeiten in zufälliger Reihenfolge; Rückgabe wie bei dockeAn. */
function probiere(bau, moeglich, farbigeQuellen) {
  const { R, feldform } = bau, kern = kernBild(bau), platz = new Set(bau.strahlenden().flat());
  for (const wahl of R.shuffle(moeglich).slice(0, PROBEN)) {
    // Vorgeschaltet (vor: Zelle der Quelle): Mischlicht aus der Quelle, das Prisma gehört zur Kernidee
    const q = wahl.art === 'prism' ? bau.bei(wahl.vor) : null, alt = q?.color;
    const vorher = wahl.art === 'prism' ? new Set() : quellenAuf(bau, wahl.zelle), neu = [];
    if (q) {
      if (wahl.mischung === 'white') delete q.color;
      else q.color = wahl.mischung;
      const p = feldform.element(wahl.zelle, { type: 'prism' });
      setRot(p, wahl.stellung);
      neu.push(bau.setze(p, { kern: true }));
    }
    if (wahl.spiegel) {
      const el = feldform.element(wahl.spiegel.zelle, { type: 'mirror' });
      setRot(el, wahl.spiegel.stellung);
      neu.push(bau.setze(el));
    }
    if (wahl.quelle) {
      neu.push(bau.setze(bau.quelle(wahl.quelle.zelle, wahl.quelle.richtung, fremdfarbe(bau, farbigeQuellen))));
    }
    const dock = { art: wahl.art, zelle: wahl.zelle, vorher, kern, neu };
    if (angedockt(bau, dock, { mitZiel: false }) && bau.strahlenden().flat().some(z => !platz.has(z))) return dock;
    for (const el of neu) { bau.kern.delete(el); bau.entferne(el); }
    if (q) {
      if (alt === undefined) delete q.color;
      else q.color = alt;
      bau.geaendert();
    }
  }
  return null;
}
