// Führung im Dorf: Band, Lichtkegel, Hand, Sperre (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { $, IS_TOUCH } from './oberflaeche/dom.ts';
import { camera, sceneLoop } from './szene.js';
import { game } from './brett/feld.js';
import { canvasEl } from './eingabe.js';
import { audio } from './ton.js';
import { flow } from './levelfluss.js';
import { story } from './geschichte/geschichte.js';
import {
  LEVELS, NEBENBEI, schrittErfuellt, schrittErlaubt, schrittGeste, schrittZellen, zelleVon,
} from '../logik.js';
import { alsGlobal } from './testschnittstelle.ts';
import { beiSprachwechsel, t } from '../texte/sprache.js';

/**
 * Führung im Dorf (Spec .scratch/tutorial-fuehrung/, neu gestaltet mit .scratch/tutorial-neu/): zeigt die Schritte
 * einer Übung (LEVELS[i].schritte), wartet auf die Handlung des Spielers und geht dann weiter. Der Satz steht im Band
 * unten (#band), mit Punkten für den Fortschritt der Übung und bei einer Erklärung «Weiter»; Hinweise nebenbei klein
 * darüber. Die Szene ist leicht abgedunkelt, ein Lichtkegel liegt auf jedem Element des Schritts; bei einem
 * Handlungsschritt zeigt die Hand seine Geste sofort vor, nach FUEHRUNG.handPause s ohne Fortschritt wieder, bis der
 * Schritt geschafft ist (Wunsch des Nutzers nach dem Poco-Test).
 * Strikt (Sperre): Bei einem Handlungsschritt reagieren nur seine Elemente (darf, vorrang; schrittErlaubt), alle
 * anderen weigern sich (weigern, auch drehbare); bei einer Erklärung ist das ganze Brett gesperrt bis «Weiter». Kamera,
 * Knöpfe, Menü, Übersicht, Ton, Neustart und «Dorf überspringen» bleiben frei. Ohne Führung ist nichts gesperrt.
 * Rückmeldung: Ist ein Schritt geschafft, füllt sich sein Punkt, ein leiser Ton (audio.schritt, nur bei Ton an); nach FUEHRUNG.wechsel s blendet der nächste weich ein (Satz,
 * Lichtkegel, Hand). Die Sperre gilt in der Zeit dazwischen schon für den neuen Schritt. Fehlversuche bleiben ohne
 * Tadel. Der letzte Schritt endet erst mit dem Lösen; gelöst wird nie von selbst. Wird die Übung früher gelöst, gilt
 * das sofort: Die restlichen Schritte entfallen, nichts bleibt stehen.
 * Jedes neue Brett (enterLevel: Neustart, Neuladen, nächster Grad, aus der Übersicht) beginnt beim ersten Schritt;
 * Menü und Übersicht (hideHud, showHud) behalten ihn. Kein Speicherstand.
 * Anschlüsse: gedreht (rotateElement), angetippt (weigern: ein Schritt «antippen» eines festen Elements wartet darauf),
 * kamera (dragCamera, zoomCamera), neustart (restartLevel), start (das Brett steht), darf und vorrang (Eingabe:
 * rotatableOnly, pickElement, weigern), platziere (je Bild, solange über dem Brett etwas zu sehen ist).
 */
const FUEHRUNG = {
  hand: { tippen: 2.6, zurueck: 3.6 }, // s: so lange zeigt die Hand die Geste zu Beginn eines Schritts vor
  handPause: 5,                        // s: so lange bleibt die Hand weg, bis sie die Geste noch einmal vorzeigt
  kuppe: 0.42,                         // Höhe über dem Brett, wo die Fingerkuppe aufsetzt (Welt)
  wechsel: 0.6,                        // s nach einem geschafften Schritt, bis der nächste weich einblendet
  // Lichtkegel: Halbmesser um das Element (Welt; die Zelle misst CELL) in der Höhe hoehe über dem Brett; bis innen
  // (Anteil des Halbmessers) ganz hell, dann weich ins Abdunkeln (dunkel: Deckkraft über der übrigen Szene)
  kegel: { radius: 0.78, hoehe: 0.3, innen: 0.55, dunkel: 0.52 }, // dunkel 0,46 → 0,52 nach dem Poco-Test
};

const fuehrung = {
  level: null,        // die geführte Übung (LEVELS[i]) oder null: keine Führung
  board: null,        // ihr Brett; ein neues (enterLevel) beginnt beim ersten Schritt
  schritt: 0,         // Platz in level.schritte; der letzte bleibt bis zum Lösen
  los: false,         // das Brett steht (flow play): Lichtkegel und Hand dürfen erscheinen
  fertig: false,      // gelöst: nichts mehr bis zum nächsten Brett
  wechselt: false,    // ein Schritt ist geschafft, der nächste blendet nach FUEHRUNG.wechsel ein
  vorige: [],         // Zellen des geschafften Schritts: ihr Lichtkegel bleibt, solange es wechselt
  hand: false,        // die Hand zeigt die Geste des Schritts vor (einmal je Schritt)
  vorzeigen: false,   // die Hand hat die Geste des Schritts noch nicht vorgezeigt (unter Menü und Übersicht wartet sie)
  nebenbei: [],       // offene Hinweise nebenbei (Schlüssel in NEBENBEI)
  benutzt: new Set(), // benutzte Hinweise nebenbei der Übung benutztIn: kommen beim Neustart nicht wieder
  benutztIn: -1,
  neustarten: false,  // ein Neustart (restartLevel) kommt: nur dann bleiben die benutzten Hinweise nebenbei weg
  handUhr: 0, wechselUhr: 0, ausUhr: 0, // setTimeout: Ende des Vorzeigens, nächster Schritt, Ebene weg
  sichtbar: false,    // Abdunkeln, Lichtkegel oder Hand zu sehen: platziere je Bild
  kegel: [],          // Lichtkegel { el, loch, schein, x, y, r } (x, y, r in Pixeln des Canvas; platziere)
  kegelZellen: '',    // ihre Zellen (ein neuer Satz Kegel wächst neu auf)
  handZiel: null,     // Element der Hand
  band: null,         // das Band unten (#band, bandTeile)
  bild: null, handEl: null, // Ebene über dem Brett (#fuehrung): Abdunkeln, Lichtkegel, Hand

  /** Läuft die Führung für LEVELS[index] auf dem Brett? */
  fuehrt(index) { return !!this.level && this.level === LEVELS[index] && this.board === game.board; },
  aktiv() { return !!this.level && !this.fertig; },
  /** Der laufende Schritt (null: keiner mehr oder keine Führung). */
  aktuell() { return this.aktiv() ? this.level.schritte[this.schritt] ?? null : null; },
  /** Sperre: Darf el reagieren (drehen, als festes angetippt werden)? Ohne laufende Führung immer. */
  darf(el) { return !this.aktiv() || this.board !== game.board || schrittErlaubt(this.aktuell(), el); },
  /** Für die Auswahl beim Antippen (pickTapped): die Elemente des Schritts gewinnen; ohne Führung null. */
  vorrang() {
    if (!this.aktiv() || this.board !== game.board) return null;
    const s = this.aktuell();
    return (el) => schrittErlaubt(s, el);
  },

  /** Neues Brett (enterLevel): Führung nur für eine Übung im Dorf mit Schritten, beim ersten Schritt. */
  neu(index) {
    const lvl = LEVELS[index];
    const gefuehrt = !!lvl.schritte?.length && story.drives(index) && story.inDorf;
    // benutzte Hinweise nebenbei bleiben nur beim Neustart derselben Übung weg; sonst (nächster Grad, aus der
    // Übersicht) läuft die Führung ganz (Review Ticket 02 Gerüst)
    if (index !== this.benutztIn || !this.neustarten) { this.benutzt.clear(); this.benutztIn = index; }
    this.neustarten = false;
    this.level = gefuehrt ? lvl : null;
    this.board = game.board;
    this.schritt = 0;
    this.los = this.fertig = this.wechselt = this.hand = this.vorzeigen = false;
    this.vorige = [];
    this.nebenbei = gefuehrt ? (lvl.nebenbei ?? []).filter((n) => !this.benutzt.has(n)) : [];
    this.stoppeUhren();
    this.zeichneBild(true); // das vorige Brett: nichts mehr darüber
    this.zeichneBand();
  },
  /** Das Brett steht (updateFlow): Abdunkeln, Lichtkegel, die Hand zeigt den laufenden Schritt vor. */
  start() {
    if (!this.aktiv() || this.board !== game.board || this.los) return;
    this.los = true;
    this.beginneSchritt();
  },
  /**
   * Schritt beginnen (auch nach dem Weiterschalten, weich: nach FUEHRUNG.wechsel). Trifft der Strahl schon: gleich
   * weiter (nie über den letzten hinaus).
   */
  beginneSchritt(weich = false) {
    const letzter = this.level.schritte.length - 1;
    let s = this.aktuell();
    while (s?.weiter === 'strahl' && this.schritt < letzter
      && schrittErfuellt(s, { art: 'strahl', board: this.board, result: game.result })) {
      this.schritt++;
      s = this.aktuell();
    }
    clearTimeout(this.handUhr);
    clearTimeout(this.wechselUhr);
    this.hand = false;
    this.vorzeigen = !!(s && schrittGeste(s));
    this.wechselt = weich;
    if (weich) {
      this.wechselUhr = setTimeout(() => {
        this.wechselt = false;
        this.zeigeHand();
        this.zeichne();
      }, FUEHRUNG.wechsel * 1000);
    } else this.zeigeHand();
    this.zeichne();
  },
  /**
   * Die Hand zeigt die Geste des laufenden Schritts vor, sobald das Brett steht, der Schritt eingeblendet und zu sehen
   * ist (stand es unter dem Menü fertig, beim Zurückkommen; Review Ticket 02 Gerüst). Danach bleibt sie
   * FUEHRUNG.handPause s weg und zeigt wieder vor, bis der Schritt wechselt (beginneSchritt hält die Uhr an).
   */
  zeigeHand() {
    const s = this.aktuell(), geste = s && schrittGeste(s);
    if (!this.vorzeigen || !this.los || this.wechselt || story.choosing || !geste) return;
    this.vorzeigen = false;
    this.hand = true;
    this.handUhr = setTimeout(() => {
      this.hand = false;
      this.zeichneBild();
      this.handUhr = setTimeout(() => { this.vorzeigen = true; this.zeigeHand(); this.zeichneBild(); },
        FUEHRUNG.handPause * 1000);
    }, FUEHRUNG.hand[geste] * 1000);
  },
  /** Ereignis e (schrittErfuellt) für den laufenden Schritt; schaltet es weiter: true. Der letzte endet mit dem Lösen. */
  ereignis(e) {
    const s = this.aktuell();
    if (!s || this.board !== game.board || !schrittErfuellt(s, e)) return false;
    if (this.schritt >= this.level.schritte.length - 1) return false;
    this.geschafft(s);
    this.schritt++;
    this.beginneSchritt(true);
    return true;
  },
  /** Rückmeldung zum geschafften Schritt s: Ton; den Punkt füllt zeichne. Kein Funkeln (Wunsch des Nutzers nach Ticket 01). */
  geschafft(s) {
    this.vorige = schrittZellen(s);
    audio.schritt();
  },
  /** Ein Element wurde gedreht (rotateElement, nach der neuen Rechnung). */
  gedreht(el, delta) {
    if (!this.aktiv() || this.board !== game.board) return;
    if (game.result.solved) { this.beenden(); return; } // früher gelöst: gilt sofort
    if (!this.ereignis({ art: 'gedreht', el, delta })) this.ereignis({ art: 'strahl', board: this.board, result: game.result });
  },
  /** Ein Element weigert sich (weigern): der Anschluss für einen Schritt «antippen» eines festen Elements. */
  angetippt(el) { if (this.aktiv()) this.ereignis({ art: 'angetippt', el }); },
  /** «Weiter» an einer Erklärung (nicht, solange der nächste Schritt einblendet). */
  weiter() { if (this.aktiv() && !this.wechselt) this.ereignis({ art: 'weiter' }); },
  /** Eine Geste der Kamera (Ziehen, Zoomen): beendet den Hinweis nebenbei zur Kamera. */
  kamera() { if (this.nebenbei.length && this.nebenbei.includes('kamera')) this.nutze('kamera'); },
  /** Neustart der Übung (restartLevel), vor dem neuen Brett. */
  neustart() {
    this.neustarten = true;
    if (this.nebenbei.includes('neustart')) this.nutze('neustart');
  },
  nutze(n) {
    this.benutzt.add(n);
    this.nebenbei = this.nebenbei.filter((m) => m !== n);
    this.zeichneBand();
  },
  /** Gelöst: Schritte und Hinweise nebenbei entfallen, Band, Abdunkeln und Hand gehen weich. */
  beenden() {
    this.fertig = true;
    this.wechselt = this.hand = false;
    this.nebenbei = [];
    this.stoppeUhren();
    this.zeichne();
  },
  stoppeUhren() { clearTimeout(this.handUhr); clearTimeout(this.wechselUhr); },
  /** Kopfzeile ausgeblendet (Menü, Übersicht, Levelwechsel, Zwischenszene): nichts über dem Brett. */
  verbergen() {
    clearTimeout(this.handUhr); // der Wechsel zum nächsten Schritt läuft weiter, die Hand wartet (zeigeHand)
    // mitten im Vorzeigen oder in der Pause danach: beim Zurückkommen zeigt sie noch einmal ganz vor
    if (!this.fertig) this.vorzeigen = true;
    this.hand = false;
    if (this.band?.knopf.contains(document.activeElement)) this.band.knopf.blur(); // das Band ist nur ausgeblendet
    this.zeichneBild(true);
  },
  /** Kopfzeile wieder da (showHud): weiter im selben Schritt. */
  zeigen() {
    this.zeichneBand();
    this.zeigeHand();
    this.zeichneBild();
  },
  zeichne() { this.zeichneBand(); this.zeichneBild(); },

  /** Die Teile des Bands (#band in der Kopfzeile), beim ersten Gebrauch. */
  bandTeile() {
    if (this.band) return this.band;
    const el = $('band');
    const knopf = el.querySelector('.fuehrung-weiter');
    knopf.addEventListener('click', () => this.weiter());
    return this.band = { el, knopf, satz: el.querySelector('.band-satz'), zeile: el.querySelector('.band-zeile'),
      punkte: el.querySelector('.band-punkte'), neben: el.querySelector('.band-neben') };
  },
  /**
   * Das Band: der Satz des Schritts, ein Punkt je Schritt (voll: geschafft, mit Ring: der laufende), «Weiter» an einer
   * Erklärung, darüber die Hinweise nebenbei. Während es wechselt, blendet der Satz aus und mit dem neuen wieder ein
   * (CSS .wechsel). Ohne laufende Führung (gelöst, anderes Brett) blendet es aus und behält dabei seinen Inhalt.
   */
  zeichneBand() {
    const b = this.bandTeile(), schritte = this.level?.schritte ?? [];
    const an = this.aktiv() && this.board === game.board;
    b.el.classList.toggle('aus', !an);
    if (b.punkte.childElementCount !== schritte.length && (an || !schritte.length)) {
      b.punkte.replaceChildren(...schritte.map(() => document.createElement('i')));
    }
    [...b.punkte.children].forEach((p, i) => {
      p.classList.toggle('voll', this.fertig || i < this.schritt);
      p.classList.toggle('jetzt', an && !this.wechselt && i === this.schritt);
    });
    if (!an) return;
    b.zeile.classList.toggle('wechsel', this.wechselt);
    if (!this.wechselt) {
      const s = this.aktuell();
      b.satzSchluessel = s.text;
      b.knopf.hidden = s.weiter !== 'erklaerung';
    } else if (b.knopf.contains(document.activeElement)) b.knopf.blur();
    b.nebenSchluessel = this.nebenbei.map((n) => NEBENBEI[n].text);
    this.bandTexte();
  },
  /**
   * Satz und Hinweise nebenbei im Band in der aktuellen Sprache (zeichneBand; ein Wechsel der Sprache schreibt sie neu,
   * auch im ausgeblendeten Band, das seinen Inhalt behält). Die Schlüssel merkt sich das Band.
   */
  bandTexte() {
    const b = this.bandTeile();
    const text = b.satzSchluessel ? t(b.satzSchluessel, { touch: IS_TOUCH }) : b.satz.textContent;
    if (b.satz.textContent !== text) b.satz.textContent = text;
    const neben = (b.nebenSchluessel ?? []).map((s) => t(s, { touch: IS_TOUCH })).join(' ');
    if (b.neben.textContent !== neben) b.neben.textContent = neben;
    b.neben.hidden = !neben;
  },

  /**
   * Was über dem Brett zu sehen ist: das Abdunkeln mit einem Lichtkegel je Element des Schritts (während es wechselt,
   * die des geschafften), die Hand beim Vorzeigen. aus: sofort nichts (Menü, neues Brett); gelöst blenden Abdunkeln und
   * Kegel weich aus.
   */
  zeichneBild(aus = false) {
    const s = this.aktuell();
    const zeigt = !aus && this.aktiv() && this.los && flow.state === 'play' && !story.choosing
      && this.board === game.board;
    clearTimeout(this.ausUhr);
    if (!zeigt && !this.bild) return;
    if (!this.bild) this.baueBild();
    if (zeigt) {
      const am = (z) => this.board.elements.find((el) => zelleVon(el) === z);
      this.zeigeKegel((this.wechselt ? this.vorige : schrittZellen(s)).map(am).filter(Boolean));
    } else if (aus) this.zeigeKegel([]);
    const geste = zeigt && !this.wechselt ? schrittGeste(s) : null;
    const hand = geste && this.hand ? this.kegel[0]?.el ?? null : null;
    this.handZiel = hand;
    const art = !hand ? '' : geste === 'tippen' ? 'tippen' : IS_TOUCH ? 'halten' : 'rechtsklick';
    if (this.handEl.dataset.art !== art) this.handEl.dataset.art = art;
    this.handEl.style.display = hand ? '' : 'none';
    this.bild.classList.toggle('dunkel', zeigt);
    this.sichtbar = zeigt;
    if (zeigt) {
      this.bild.style.display = '';
      this.platziere();
    }
    if (aus) this.bild.style.display = 'none';
    // gelöst: Abdunkeln und Kegel blenden aus (CSS), danach ist die Ebene weg
    else if (!zeigt) this.ausUhr = setTimeout(() => { this.bild.style.display = 'none'; this.zeigeKegel([]); }, 700);
  },
  /** Lichtkegel auf die Elemente ziele: ein neuer Satz wächst auf (CSS), derselbe bleibt stehen. */
  zeigeKegel(ziele) {
    const key = ziele.map((el) => el.id).join();
    if (key === this.kegelZellen) return;
    this.kegelZellen = key;
    for (const k of this.kegel) { k.loch.remove(); k.schein.remove(); }
    const ns = this.bild.namespaceURI, loecher = this.bild.querySelector('.fz-loecher');
    const scheine = this.bild.querySelector('.fz-scheine');
    this.kegel = ziele.map((el) => {
      const teil = (verlauf) => {
        const g = document.createElementNS(ns, 'g'), c = document.createElementNS(ns, 'circle');
        c.setAttribute('r', '1');
        c.setAttribute('fill', `url(#${verlauf})`);
        c.setAttribute('class', 'fz-kegel');
        g.append(c);
        return g;
      };
      const loch = teil('fz-loch'), schein = teil('fz-schein');
      loecher.append(loch);
      scheine.append(schein);
      return { el, loch, schein, x: 0, y: 0, r: 0 };
    });
    sceneLoop.wake();
  },
  /** Die Ebene #fuehrung (beim ersten Gebrauch): Abdunkeln mit Löchern für die Lichtkegel, die Hand. */
  baueBild() {
    const tmp = document.createElement('div');
    // Zeigehand (Ticket 06, Wahl B des Nutzers): Kuppe des Zeigefingers im Ursprung, die Hand unten rechts, in Pixeln;
    // eingerollte Finger, Daumen, goldener Ärmel. Maus mit der rechten Taste. Die Drehung steht an einer eigenen Gruppe:
    // Die Animationen (transform in CSS) ersetzten sonst die des Attributs
    const form = ['<rect x="-6.5" y="0" width="13" height="36" rx="6.5"/>', '<rect x="5" y="19" width="11.5" height="17" rx="5.75"/>',
      '<rect x="15" y="22" width="11" height="16" rx="5.5"/>', '<rect x="24" y="26" width="9.5" height="14" rx="4.75"/>',
      '<rect x="-8" y="26" width="41" height="32" rx="11"/>',
      '<rect x="-15" y="31" width="10" height="22" rx="5" transform="rotate(-32 -10 42)"/>',
      '<rect x="-4" y="55" width="33" height="10" rx="2"/>'].join('');
    const finger = `<g class="fz-finger"><g class="fz-kontur">${form}</g><g class="fz-flaeche">${form}</g>
      <rect class="fz-aermel" x="-4" y="57" width="33" height="8" rx="2"/><path class="fz-falte" d="M15.7 27V33M25 30V35M-2 6.5H2"/></g>`;
    // Lichtkegel: Im Abdunkeln (Maske: weiss deckt) liegt je Kegel ein Loch, innen ganz offen, aussen weich, nach
    // aussen durchsichtig statt weiss, so stören sich nahe Kegel nicht; darüber ein schwacher warmer Schein
    const k = FUEHRUNG.kegel;
    tmp.innerHTML = `<svg id="fuehrung" aria-hidden="true" style="display: none">
      <defs>
        <radialGradient id="fz-loch"><stop offset="${k.innen}" stop-color="#000"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
        <radialGradient id="fz-schein"><stop offset="0" stop-color="#ffe6b0" stop-opacity="0.12"/>
          <stop offset="${k.innen}" stop-color="#ffd98a" stop-opacity="0.07"/>
          <stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
        <mask id="fz-maske" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect class="fz-flaeche-maske" width="100%" height="100%" fill="#fff"/><g class="fz-loecher"></g></mask>
      </defs>
      <rect class="fz-dunkel" width="100%" height="100%" mask="url(#fz-maske)" style="--fz-dunkel: ${k.dunkel}"/>
      <g class="fz-scheine"></g>
      <g class="fz-hand">
      <g class="fz-tippen"><circle class="fz-welle" r="22"/><g transform="rotate(-18)">${finger}</g></g>
      <g class="fz-halten"><circle class="fz-ring" r="28" pathLength="100" transform="rotate(-90)"/>
        <g transform="rotate(-18)">${finger}</g></g>
      <g class="fz-rechtsklick"><circle class="fz-welle" r="22"/><g transform="translate(6 6)">
        <path class="fz-maus" d="M0 12A12 12 0 0 1 24 12V26A12 12 0 0 1 0 26Z"/>
        <path class="fz-taste" d="M12 0A12 12 0 0 1 24 12V14H12Z"/><path class="fz-maus" d="M12 0V14H0V12A12 12 0 0 1 12 0Z"/></g></g>
    </g></svg>`;
    this.bild = tmp.firstElementChild;
    this.handEl = this.bild.querySelector('.fz-hand');
    this.handEl.style.display = 'none';
    document.body.insertBefore(this.bild, $('hud')); // unter Kopfzeile und Band, über der Szene
  },
  /** Bildschirmlage (Pixel des Canvas) des Modells obj, hoehe über seiner Mitte (mit seiner Grösse beim Herauswachsen). */
  bildpunkt(obj, hoehe) {
    const v = _fzMitte, w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    obj.getWorldPosition(v);
    v.y += hoehe * obj.scale.x;
    v.project(camera);
    return { x: (v.x + 1) / 2 * w, y: (1 - v.y) / 2 * h };
  },
  /**
   * Je Bild, solange sichtbar: Die Lichtkegel und die Hand gehen an die Bildschirmlage ihres Elements (Kamera, Zoom,
   * Herauswachsen), die Kegel in der Grösse des Elements im Bild, die Hand in ihrer eigenen. Gesetzt wird nur, was
   * sich um einen halben Pixel ändert (die Kamera schwebt).
   */
  platziere() {
    if (!this.bild) return;
    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    const box = `0 0 ${w} ${h}`;
    if (this.bild.getAttribute('viewBox') !== box) this.bild.setAttribute('viewBox', box);
    camera.updateMatrixWorld();
    const rechts = _fzRechts.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    const rund = (x) => Math.round(x * 2) / 2;
    for (const k of this.kegel) {
      const obj = game.objects.get(k.el.id);
      if (!obj) continue;
      const p = this.bildpunkt(obj, FUEHRUNG.kegel.hoehe);
      // Halbmesser im Bild: ein Punkt um radius nach rechts (in der Ebene des Bildschirms) neben der Mitte
      const v = obj.getWorldPosition(_fzMitte);
      v.y += FUEHRUNG.kegel.hoehe * obj.scale.x;
      v.addScaledVector(rechts, FUEHRUNG.kegel.radius * Math.max(obj.scale.x, 0.01)).project(camera);
      const r = Math.max(4, rund(Math.hypot((v.x + 1) / 2 * w - p.x, (1 - v.y) / 2 * h - p.y)));
      const x = rund(p.x), y = rund(p.y);
      if (x === k.x && y === k.y && r === k.r) continue;
      Object.assign(k, { x, y, r });
      const t = `translate(${x} ${y}) scale(${r})`;
      k.loch.setAttribute('transform', t);
      k.schein.setAttribute('transform', t);
    }
    const obj = this.handZiel && game.objects.get(this.handZiel.id);
    if (!obj) return;
    const p = this.bildpunkt(obj, FUEHRUNG.kuppe);
    const t = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`;
    if (this.handEl.getAttribute('transform') !== t) this.handEl.setAttribute('transform', t);
  },
};
const _fzMitte = new THREE.Vector3(), _fzRechts = new THREE.Vector3();
// Wechsel der Sprache (Ticket 01 von .scratch/sprachwahl/, ohne Neuladen): das Band im selben Schritt neu
beiSprachwechsel(() => fuehrung.bandTexte());

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  fuehrung: () => fuehrung, FUEHRUNG: () => FUEHRUNG,
});

export { fuehrung };
