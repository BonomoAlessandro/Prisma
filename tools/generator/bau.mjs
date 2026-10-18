// Bau: ein Level im Entstehen, für den Generator (Ticket 18). Er steht immer in der Lösungsstellung: Jedes drehbare
// Element steht in seiner Lösung, die Startstellung setzt erst startstellung (schritte.mjs).
//
// Das Feld kennt der Bau nur über die Feldform (Spec „Feldform“): Zellen, Nachbarn, Richtungen, Stellungen, die Wirkung
// der Elemente (spiegeln, brechen, ausgang) und die Zellen eines Strahlabschnitts (abschnitt, durchlauf). Eine Zelle
// wird nie zerlegt, nur verglichen und der Feldform zurückgegeben; eine Richtung oder Stellung nur verglichen, als
// Index genutzt und der Feldform zurückgegeben. Neue Elemente entstehen mit feldform.element in einer Zelle, Quellen
// mit feldform.quelleStatt. Stellungen setzt setRot aus dem Löser, wie in den Leveldaten (Drehung oder Ausgang).
//
// Die Elemente des Baus sind Leveldaten (wie in LEVELS). In jedem Brett der Strahlregel, das der Bau anlegt, ist die Id
// eines Elements sein Platz in bau.elemente.
import { L, getRot } from '../solver.mjs';
import { beleuchtet } from '../beurteilung/suche.mjs';

/** Ziele bekommen eine der letzten so vielen Zellen vor dem Ende eines Strahls (wie im alten Generator). */
const ZIEL_VOR_ENDE = 3;

export class Bau {
  /** feldform: die Feldform des Auftrags; R: der Zufall (zufall.mjs). */
  constructor(feldform, R) {
    this.feldform = feldform;
    this.R = R;
    /** Elemente als Leveldaten, die drehbaren in ihrer Lösung. */
    this.elemente = [];
    /** Elemente der Kernidee: Aufräumen und Verfeinern nehmen sie nie weg (bausteine/). */
    this.kern = new Set();
    /**
     * Lockvögel: feste Teile der Kernidee abseits der Lösung, ausdrücklich markiert von ihrem Baustein (Review Ticket
     * 19, M4). Die Regel gegen wirkungslose Elemente nimmt nur sie aus (schritte.mjs).
     */
    this.lockvoegel = new Set();
    /**
     * Elemente der Kernidee, die das Andocken nicht verändert (Ticket 28, andocken.mjs): kein fremdes Licht darauf,
     * kein Prisma davor; das Festigen macht sie auch nicht fest. Ihr Baustein trägt sie ein, etwa beim Abschalten die
     * Quelle A und ihren Spiegel (ihr kurzer Weg zum Ziel ist der Zwischenstand).
     */
    this.unberuehrt = new Set();
    /** Zellen, auf die nichts mehr kommt, etwa die Wege des Lichts einer Kernidee. */
    this.reserviert = new Set();
    this.platz = new Map(); // Zelle → Element
    this.gegen = gegenrichtungen(feldform);
    this.gemerkt = null; // Strahlbild der Lösungsstellung bis zur nächsten Änderung
  }

  /** Das Element in einer Zelle oder undefined. */
  bei(zelle) { return this.platz.get(zelle); }

  /** Element setzen; kern: gehört zur Kernidee; lockvogel: ist ein Lockvogel. Rückgabe: das Element. */
  setze(el, { kern = false, lockvogel = false } = {}) {
    const zelle = this.feldform.zelle(el);
    if (this.platz.has(zelle)) throw new Error(`Bau: Zelle ${zelle} ist schon besetzt`);
    this.elemente.push(el);
    this.platz.set(zelle, el);
    if (kern) this.kern.add(el);
    if (lockvogel) this.lockvoegel.add(el);
    this.geaendert();
    return el;
  }

  /** Element wegnehmen (nie eines der Kernidee). */
  entferne(el) {
    if (this.kern.has(el)) throw new Error('Bau: ein Element der Kernidee wird nicht weggenommen');
    this.elemente.splice(this.elemente.indexOf(el), 1);
    this.platz.delete(this.feldform.zelle(el));
    this.lockvoegel.delete(el);
    this.unberuehrt.delete(el);
    this.geaendert();
  }

  /** Alles wegnehmen, auch die Kernidee und die reservierten Zellen (für einen neuen Versuch eines Bausteins). */
  leere() {
    this.elemente = [];
    this.platz.clear();
    this.kern.clear();
    this.lockvoegel.clear();
    this.unberuehrt.clear();
    this.reserviert.clear();
    this.geaendert();
  }

  /** Nach jeder Änderung an einem Element: Das gemerkte Strahlbild gilt nicht mehr. */
  geaendert() {
    this.gemerkt = null;
  }

  /** Die drehbaren Elemente (mit Stellungen laut Feldform). */
  drehbare() { return this.elemente.filter(e => this.feldform.stellungen(e).length); }

  /** Die Elemente einer Art (type). */
  art(type) { return this.elemente.filter(e => e.type === type); }

  /** Leveldaten in der Lösungsstellung (Kopien der Elemente): { name, …rahmen, elements, solution }. */
  level(name = '') {
    const solution = {};
    for (const e of this.drehbare()) solution[this.feldform.zelle(e)] = getRot(e);
    return { name, ...this.feldform.rahmen, elements: this.elemente.map(e => ({ ...e })), solution };
  }

  /** Brett und Strahlbild der Strahlregel für eine Liste von Elementen (Vorgabe: die des Baus). */
  verfolge(elemente = this.elemente) {
    const brett = L.createBoard({ name: '', ...this.feldform.rahmen, elements: elemente });
    return { brett, strahlbild: L.traceBeams(brett) };
  }

  /** Brett und Strahlbild der Lösungsstellung, gemerkt bis zur nächsten Änderung. */
  bild() {
    return (this.gemerkt ??= this.verfolge());
  }

  /**
   * Brett und Strahlbild, in dem nur die Quelle q leuchtet; die übrigen Quellen schlucken als Blocker (wie jeQuelle in
   * der Beurteilung).
   */
  bildVon(q) {
    return this.verfolge(this.elemente.map(e => (e.type === 'source' && e !== q ? { ...e, type: 'blocker' } : e)));
  }

  /** Zellen der Elemente, die in einem Bild Licht bekommen (Vorgabe: die Lösungsstellung). */
  licht(bild = this.bild()) {
    return beleuchtet(this.feldform, bild.brett, bild.strahlbild);
  }

  /** Richtung, in der ein Strahlabschnitt läuft: der Schritt von seiner ersten Zelle zur nächsten; null ohne. */
  laufrichtung(s) {
    const { feldform } = this, { von, bis } = feldform.abschnitt(s);
    const naechste = feldform.durchlauf(s)[0]?.zelle ?? bis;
    if (von === null || naechste === null) return null;
    return feldform.richtungen.find(d => feldform.nachbar(von, d) === naechste) ?? null;
  }

  /**
   * Freie Zellen auf den Strahlen eines Bilds, je Durchgang eines Strahls { zelle, richtung, farbe }: ohne Element und
   * nicht reserviert. Eine Zelle, durch die mehrere Strahlen laufen, kommt mehrmals vor. nurEnden: nur auf Abschnitten,
   * die den Strahl enden (endet), und nur Zellen, durch die kein anderer Strahl läuft; ein Element dort verlängert den
   * Strahl, ohne anderes Licht abzulenken.
   */
  strahlzellen(bild = this.bild(), { nurEnden = false } = {}) {
    const out = [], endet = nurEnden && this.endet(bild), allein = nurEnden && this.durchgaenge(bild);
    for (const s of bild.strahlbild.segments) {
      if (endet && !endet(s)) continue;
      const richtung = this.laufrichtung(s);
      if (richtung === null) continue;
      for (const { zelle } of this.feldform.durchlauf(s)) {
        if (this.reserviert.has(zelle) || (allein && allein.get(zelle) !== 1)) continue;
        out.push({ zelle, richtung, farbe: s.color });
      }
    }
    return out;
  }

  /** Wie oft Strahlen in einem Bild durch jede freie Zelle laufen: Map Zelle → Zahl der Abschnitte. */
  durchgaenge(bild = this.bild()) {
    const out = new Map();
    for (const s of bild.strahlbild.segments) {
      for (const { zelle } of this.feldform.durchlauf(s)) out.set(zelle, (out.get(zelle) || 0) + 1);
    }
    return out;
  }

  /**
   * Freie Zellen, durch die Strahlen auf mindestens zwei Linien laufen und deren Farben zusammen eine Farbe ergeben,
   * die keiner allein hat: Ein Kombinator dort sammelt zwei Eingänge und mischt sie (keine Scheinmischung). nurEnden:
   * nur Abschnitte, die den Strahl enden, wie bei strahlzellen.
   */
  kreuzungen(bild = this.bild(), { nurEnden = false } = {}) {
    const linien = new Map(), endet = nurEnden && this.endet(bild);
    for (const s of bild.strahlbild.segments) {
      if (endet && !endet(s)) continue;
      for (const { zelle, achse } of this.feldform.durchlauf(s)) {
        if (this.reserviert.has(zelle)) continue;
        if (!linien.has(zelle)) linien.set(zelle, { achsen: new Set(), farben: new Set() });
        linien.get(zelle).achsen.add(achse);
        linien.get(zelle).farben.add(s.color);
      }
    }
    const mischt = (farben) => {
      const alle = [...farben].reduce((m, f) => m | f, 0);
      return !farben.has(alle);
    };
    return [...linien].filter(([, l]) => l.achsen.size >= 2 && mischt(l.farben)).map(([zelle]) => zelle);
  }

  /**
   * Plätze für Ziele: je Strahl, der endet (über die Feldkante oder geschluckt), die letzten freien Zellen davor, als
   * Liste von Listen; nur Zellen, durch die kein anderer Strahl läuft. Ein Ziel dort schneidet nur das Ende des Strahls
   * ab. Nicht auf dem ersten Abschnitt einer Quelle: Dort hinge es von keinem Element ab.
   */
  strahlenden(bild = this.bild()) {
    const { feldform } = this, endet = this.endet(bild);
    const quellen = new Set(this.art('source').map(q => feldform.zelle(q))), durchgaenge = this.durchgaenge(bild);
    const out = [];
    for (const s of bild.strahlbild.segments) {
      if (!endet(s) || quellen.has(feldform.abschnitt(s).von)) continue;
      const frei = feldform.durchlauf(s).map(d => d.zelle)
        .filter(z => !this.reserviert.has(z) && durchgaenge.get(z) === 1);
      if (frei.length) out.push(frei.slice(-ZIEL_VOR_ENDE));
    }
    return out;
  }

  /**
   * Endet ein Strahlabschnitt eines Bilds den Strahl? Ja, wenn er über die Feldkante läuft oder dort geschluckt wird
   * (Blocker, Quelle, Kante eines Spiegels, Prisma ohne Austritt, Filter ohne Durchlass). Rückgabe: eine Funktion.
   */
  endet({ strahlbild }) {
    const { feldform } = this;
    const geschluckt = new Set(strahlbild.events.filter(e => e.kind === 'absorb').map(e => feldform.zelleBei(e)));
    return (s) => {
      const { bis } = feldform.abschnitt(s);
      return bis === null || geschluckt.has(bis);
    };
  }

  /** Zellen auf dem Weg ab zelle in Richtung richtung bis zur Feldkante, ohne zelle. */
  weg(zelle, richtung) {
    const out = [];
    const { nachbar } = this.feldform;
    for (let z = nachbar(zelle, richtung); z !== null; z = nachbar(z, richtung)) out.push(z);
    return out;
  }

  /**
   * Plätze für Quellen am Rand, je { zelle, richtung, laenge }: Die Quelle leuchtet ins Feld, hinter ihr liegt die
   * Feldkante; laenge ist ihr Weg durchs Feld in Zellen.
   */
  quellplaetze() {
    const { feldform } = this;
    if (!QUELLPLAETZE.has(feldform)) {
      QUELLPLAETZE.set(feldform, feldform.zellen.flatMap(zelle => feldform.richtungen
        .filter(d => feldform.nachbar(zelle, d) !== null && feldform.nachbar(zelle, this.gegen[d]) === null)
        .map(richtung => ({ zelle, richtung, laenge: this.weg(zelle, richtung).length }))));
    }
    return QUELLPLAETZE.get(feldform);
  }

  /**
   * Leveldaten einer Quelle in zelle, die in Richtung richtung leuchtet, mit Farbe farbe (Name, Vorgabe Weiss), oder
   * null, wenn die Feldform dort keine solche Quelle kennt. Sie entsteht wie in der Beurteilung mit quelleStatt aus
   * einem Element, das in diese Richtung abgibt.
   */
  quelle(zelle, richtung, farbe = 'white') {
    const { feldform } = this, k = feldform.element(zelle, { type: 'combiner' });
    const stellung = feldform.stellungen(k).find(v => feldform.ausgang(k, v) === richtung);
    if (stellung === undefined) return null;
    const q = feldform.quelleStatt(k, stellung);
    if (farbe !== 'white') q.color = farbe;
    return q;
  }

  /**
   * Stellungen, in denen ein Element (Leveldaten) Licht der Farbe farbe aus Richtung richtung sinnvoll weitergibt: Ein
   * Spiegel lenkt es ab, weder zurück noch parallel zur Fläche; ein Prisma lässt Licht austreten; ein Kombinator in
   * jeder Stellung. Danach hat das Licht eine freie Zelle vor sich (Platz für ein weiteres Element oder ein Ziel), beim
   * Prisma mindestens ein austretender Strahl.
   */
  stellungenFuer(el, richtung, farbe) {
    const { feldform } = this, zelle = feldform.zelle(el);
    const frei = (d) => {
      const z = feldform.nachbar(zelle, d);
      return z !== null && !this.bei(z) && !this.reserviert.has(z);
    };
    return feldform.stellungen(el).filter((v) => {
      if (el.type === 'mirror') {
        const neu = feldform.spiegeln(el, richtung, v);
        return neu !== null && neu !== this.gegen[richtung] && frei(neu);
      }
      if (el.type === 'prism') return feldform.brechen(el, richtung, farbe, v).some(o => frei(o.richtung));
      return frei(feldform.ausgang(el, v));
    });
  }
}

/** Was nur von der Feldform abhängt, einmal je Feldform: Gegenrichtungen und Plätze für Quellen. */
const GEGEN = new WeakMap(), QUELLPLAETZE = new WeakMap();

/**
 * Gegenrichtung je Richtung (Index), aus den Nachbarn der Feldform: der Schritt, der zur Ausgangszelle zurückführt (wie
 * im Spielermodell).
 */
function gegenrichtungen(feldform) {
  if (GEGEN.has(feldform)) return GEGEN.get(feldform);
  const { zellen, richtungen, nachbar } = feldform;
  const gegen = [];
  for (const d of richtungen) {
    const z = zellen.find(a => nachbar(a, d) !== null);
    gegen[d] = richtungen.find(g => nachbar(nachbar(z, d), g) === z);
  }
  GEGEN.set(feldform, gegen);
  return gegen;
}
