// Spielstand (Ticket 05 von .scratch/umbau/, bis dahin progress in src/seite/levelfluss.js und der Ton in ton.js):
// Schlüssel und Format von allem, was das Spiel sich merkt. Gelesen und geschrieben wird nur über die Speicherschicht
// (src/speicher.ts); dieses Modul legt fest, was unter welchem Schlüssel steht. Schlüssel und Format sind seit Noas
// Geschichte (Ticket 04 und 06 dort) und dem Ton unverändert: Ein Spielstand von früher wird ohne Umrechnung gelesen
// (tests/speicher.test.mjs). Kein Bezug auf die Seite (auch für Node).
import { STORY_LEVELS } from './logik.js';
import { speicher } from './speicher.ts';

/**
 * Speicherstand von Noas Geschichte (Spec .scratch/noa-geschichte/, «Speicherstand»): je Grad unter prisma.noa.<grad>
 * (Leerzeichen als Bindestrich: prisma.noa.sehr-schwer) ein JSON { platz, geloest, gesehen, geschafft }. platz: das
 * Level, das dran ist (0 … 59 im Durchgang des Grads); geloest: die gelösten Level (Namen, nicht Plätze); gesehen: die
 * Momente, die nur beim ersten Mal kommen (prolog, angebot, dorf und die Einstiege in die Welten unter der Kennung
 * ihrer Station, etwa meer); geschafft: das Finale ist gesehen. Weitere Felder bleiben beim Speichern erhalten
 * (gespielt; dorf, das Kapitel «Im Dorf», prüft story.setGrade über storyDorfStand). Die Bestwerte je Level liegen
 * daneben unter prisma.noa.<grad>.bestwerte (best, noteBest), damit sie «Von vorn» überleben (Entscheid 27). Dazu der
 * zuletzt gespielte Grad unter prisma.noa.zuletzt. Die alten Schlüssel (prisma.solvedLevels, prisma.current,
 * prisma.sky, prisma.signal, prisma.signal.seen) liest das Spiel nicht mehr und löscht sie nicht.
 */
const progress = {
  keyOf: (grad) => `prisma.noa.${grad.replaceAll(' ', '-')}`,
  lastKey: 'prisma.noa.zuletzt',
  read(key) { return speicher.lesen(key); },
  write(key, value) { speicher.schreiben(key, value); },
  /** Stand eines Grads (count: Zahl der Level seines Durchgangs); fehlt er oder ist er unlesbar, von vorn. */
  load(grad, count) {
    let s = null;
    try { s = JSON.parse(this.read(this.keyOf(grad)) || 'null'); } catch { /* von vorn */ }
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = {};
    const namen = (a) => (Array.isArray(a) ? a.filter(x => typeof x === 'string') : []);
    const platz = Number.isInteger(s.platz) && s.platz >= 0 && s.platz < count ? s.platz : 0;
    return { ...s, platz, geloest: namen(s.geloest), gesehen: namen(s.gesehen), geschafft: s.geschafft === true };
  },
  save(grad, stand) { this.write(this.keyOf(grad), JSON.stringify(stand)); },
  /**
   * «Von vorn» im Menü: den Stand nur dieses Grads löschen (Entscheid 19); der zuletzt gespielte Grad und die
   * Bestwerte bleiben (Entscheid 27).
   */
  remove(grad) { speicher.loeschen(this.keyOf(grad)); },
  bestKeyOf(grad) { return `${this.keyOf(grad)}.bestwerte`; },
  /**
   * Bestwerte eines Grads (Entscheid 24): je Level (Name) { zeit, drehungen }, zeit in ganzen Sekunden, beide je für
   * sich, auch aus verschiedenen Läufen. Was keine endliche Zahl ≥ 0 ist, fällt weg; unlesbar: keine.
   */
  best(grad) {
    let s = null;
    try { s = JSON.parse(this.read(this.bestKeyOf(grad)) || 'null'); } catch { /* keine */ }
    const gut = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0, alle = {};
    if (!s || typeof s !== 'object' || Array.isArray(s)) return alle;
    for (const [name, w] of Object.entries(s)) {
      const e = {};
      if (gut(w?.zeit)) e.zeit = w.zeit;
      if (gut(w?.drehungen)) e.drehungen = w.drehungen;
      if (Object.keys(e).length) alle[name] = e;
    }
    return alle;
  },
  /**
   * Ein Level gelöst (seconds: Zeit bis zur lösenden Drehung, turns: Drehungen): Bestzeit und wenigste Drehungen je
   * für sich nachführen. Zurück, was besser wurde, für das Feld «Gelöst»; gemeldet nur, wenn es schon einen Wert gab
   * (nicht beim ersten Lösen). Die Zeit zählt in ganzen Sekunden wie die Anzeige: Bleibt sie gleich, ist es keine
   * neue Bestzeit.
   */
  noteBest(grad, name, { seconds, turns }) {
    const alle = this.best(grad), alt = alle[name] ?? {}, zeit = Math.floor(seconds);
    alle[name] = { zeit: Math.min(alt.zeit ?? Infinity, zeit), drehungen: Math.min(alt.drehungen ?? Infinity, turns) };
    this.write(this.bestKeyOf(grad), JSON.stringify(alle));
    return { neueBestzeit: alt.zeit !== undefined && zeit < alt.zeit,
      wenigerDrehungen: alt.drehungen !== undefined && turns < alt.drehungen };
  },
  /** Der zuletzt gespielte Grad (einer aus STORY_LEVELS), sonst null. */
  last() { const g = this.read(this.lastKey); return g !== null && Object.hasOwn(STORY_LEVELS, g) ? g : null; },
  setLast(grad) { this.write(this.lastKey, grad); },
};

/**
 * Einstellungen: Ton aus (Knopf in der Kopfzeile) unter prisma.muted, '1' für aus, '0' für an; fehlt der Schlüssel
 * oder ist das Lesen gescheitert, ist der Ton an. Die Sprache (Ticket 07 von .scratch/umbau/, Schalter im Menü) unter
 * prisma.sprache als Kürzel ihrer Datei ('de'); geschrieben erst, wenn der Spieler sie wählt, sonst gilt die des
 * Geräts (src/texte/sprache.js). Weitere Einstellungen merkt sich das Spiel nicht.
 */
const einstellungen = {
  stummKey: 'prisma.muted',
  stumm() { return speicher.lesen(this.stummKey) === '1'; },
  setStumm(m) { speicher.schreiben(this.stummKey, m ? '1' : '0'); },
  spracheKey: 'prisma.sprache',
  sprache() { return speicher.lesen(this.spracheKey); },
  setSprache(s) { speicher.schreiben(this.spracheKey, s); },
};

export { einstellungen, progress };
