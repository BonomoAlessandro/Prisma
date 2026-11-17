// Noas Geschichte: der Ablauf (story), Menü und Übersicht, Ladezeichen, Vorwärmen (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { createStoryScene } from './buehne.js';
import { LOOK } from '../konfiguration.ts';
import { camera, LAYER_NO_REFLECT, nextFrame, renderer, ruhe, RUHE_OHNE_START, scene, sceneLoop } from '../szene.js';
import { background, stars } from '../himmel/sterne.js';
import { skyTheme, starsFromSin } from '../himmel/skybox.js';
import { shockUniforms, urlSky } from '../brett/brett.js';
import { bloomPass } from '../bildschritte.js';
import { _gazeLook, cameraRig, Y_AXIS } from '../kamera.js';
import { BEAM_Y, COLOR_RGB } from '../brett/elemente.js';
import { game, prepareLevel, recomputeBeams } from '../brett/feld.js';
import { WHITE } from '../brett/strahlen.js';
import { setHovered } from '../eingabe.js';
import { audio } from '../ton.js';
import { CELEBRATE, celebration, changeLevel, enterLevel, flow, progress, restartLevel } from '../levelfluss.js';
import { $, IS_TOUCH } from '../oberflaeche/dom.ts';
import { introCalm, markIntroCalm, setShown, ui } from '../oberflaeche/ui.js';
import { createMenu } from '../oberflaeche/menue.js';
import { createUebersicht } from '../oberflaeche/uebersicht.js';
import {
  BUEHNENWAGEN, himmelsWagen, HIMMELSWAGEN, STORY_CARRIERS, STORY_CHAPTERS, STORY_DORF, STORY_EPILOG, STORY_FINALE,
  STORY_FLUG, STORY_ICONS, STORY_LEISTE, STORY_PROLOG, STORY_PULS, STORY_SKIP_RUHE, STORY_STATIONS, STORY_UP,
  storyChapterId, storyDorfStand, wagen,
} from './daten.js';
import { adaptiveResolution, kameraSichtfeld } from '../aufloesung.js';
import { leistung } from '../leistung.js';
import { mulberry32 } from '../../zufall.js';
import { LEVELS, STORY_LEVELS, TUTORIAL_COUNT } from '../../logik.js';
import { alsGlobal } from '../testschnittstelle.ts';

// wie der Rückflug der Kamera; die flachere Kurve aus leistung-11 ist zurückgenommen (Ursache der Ruckler war die
// DOM-Bühne, Nutzer: Tempo wieder wie am Anfang, Ticket 19)
const storyEase = (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (2 - 2 * k) ** 3 / 2);
const storyLinear = (k) => k;
/** Zügig los, dann immer langsamer (Strahl des Polarsterns läuft ins Brett aus, story.auslaufen). */
const storyAuslauf = (k) => 1 - (1 - k) ** 3;
/**
 * Weg mit gleichmässig steigender Geschwindigkeit über den Anteil a der Zeit, dann gleich schnell, zuletzt über den
 * Anteil b gleichmässig abbremsend (b 0: ohne Abbremsen).
 */
const storyRampe = (a, b = 0) => (k) => {
  const ganz = 1 - a / 2 - b / 2;
  if (k < a) return k * k / (2 * a) / ganz;
  if (k <= 1 - b) return (k - a / 2) / ganz;
  return 1 - (1 - k) ** 2 / (2 * b) / ganz;
};
/** Fall des Lichts aufs Brett im Bild (story.fall; Abnahme Ticket 11, 12): kurzer Anlauf (STORY_FLUG.anlauf), dann
 * gleichmässig. */
const storyFall = (k) => storyRampe(STORY_FLUG.anlauf)(k);
const storySleep = (ms) => new Promise((r) => setTimeout(r, ms)); // für Übergänge im DOM (CSS läuft in echter Zeit)

/**
 * Das Menü der Geschichte (createMenu); den Stand liefert story.menuStand, die Aktionen nimmt story.pick. Ein
 * geschaffter Grad öffnet seine Übersicht (Entscheid 19). Die Form des Kleinen Wagens auf der Sternkarte: wagen.
 */
const menu = createMenu({
  root: $('menue'),
  wagen,
  uebersicht: true,
  onAction: (a) => story.pick(a),
});
/** Die Übersicht eines Grads (createUebersicht): Daten aus story.overviewData; Wahl und Schliessen nimmt story. */
const uebersicht = createUebersicht({
  root: $('uebersicht'),
  icons: STORY_ICONS,
  wagen,
  onPlay: (wahl) => story.playFromOverview(wahl),
  onClose: () => story.closeOverview(),
});
/**
 * Menü und Bühne einmal unsichtbar zeichnen, noch vor der Enthüllung des Startbildschirms (ui.init; die Seite lädt, nichts
 * Sichtbares animiert): Beim ersten Öffnen stand sonst ein Bild bis gut 400 ms (Menü mit den Lichtwegen) bzw. 250 ms
 * (Bühne des Prologs, Review Ticket 05). Nach der Enthüllung (introCalm) wäre zu spät: «Klicken zum Starten» kommt schon
 * nach 2,9 s, und ein Klick vor dem Vorwärmen brachte das Menü kalt (gemessen 650 ms). Die Bühne bleibt für neue Spieler
 * bis zum Prolog gehalten (story.vorwaermen). Ihr Promise erfüllt sich erst nach drei Bildern, bei verborgenem Tab erst
 * nach der Rückkehr: höchstens 1 s warten. Mit ?nointro steht statt des Startbildschirms gleich das Menü.
 */
async function vorwaermenVorStart() {
  if (flow.state !== 'intro' && !(RUHE_OHNE_START && story.choosing)) return;
  if (!menu.offen) {
    menu.vorwaermen(story.menuStand());
    await nextFrame(); await nextFrame(); await nextFrame();
  }
  // wer Prolog und Angebot schon gesehen hat, bekommt keinen Prolog mehr (ausser in einem neuen Grad): keine Bühne;
  // gehalten nur hinter dem Startbildschirm (mit ?nointro und zeige() käme sonst nie ein Prolog, der sie freigibt)
  const gesehen = story.stand?.gesehen ?? [];
  if (gesehen.includes('prolog') && gesehen.includes('angebot')) return;
  await Promise.race([story.vorwaermen(flow.state === 'intro' && !gesehen.includes('prolog')), storySleep(1000)]);
}
// Die Übersicht (~100 ms beim ersten Öffnen) wird erst aus Menü oder Spiel gebraucht: nach der Enthüllung an der
// nächsten ruhigen Stelle, die nichts Sichtbares zeigt (Startbildschirm, wartende Bühne) oder ohnehin lädt (ruhe.laden,
// Überblendung nach «Weiter»); im sichtbaren Spiel kostete es selbst ein Bild
introCalm.then(async () => {
  for (;;) {
    await ruhe.warte();
    if (uebersicht.offen) return;
    if (flow.state === 'intro' || story.stillBild || ruhe.laden || RUHE_OHNE_START && story.choosing) break;
    await storySleep(500);
  }
  uebersicht.vorwaermen(story.overviewData(story.grade ?? 'leicht'));
});

/**
 * Ladezeichen: Wartet die Geschichte auf den Himmel einer Welt (story.skyOf: Einstieg nach «Üben», Fortsetzen, erster
 * Himmel nach dem Start; story.offer: «Gleich los», solange der Wald fehlt), zeichnet sich nach 0,4 s der Kleine Wagen:
 * Stern für Stern vom Polarstern bis zur Schale, dann blenden alle aus, und er beginnt von vorn. Gewählt vom Nutzer aus
 * dem Prototyp (Branch prototyp/ladeindikator, .scratch/ladeindikator/). Die Wartestellen melden etwa alle 0,1 s mit
 * warte(true), ob sie noch warten, am Ende warte(false). Unter Menü und Übersicht nicht (dann warte(false)). Versteckt
 * laufen keine Animationen.
 */
const ladeZeichen = (() => {
  const el = document.getElementById('lade');
  // Sterne des Kleinen Wagens (Form aus wagen.form, px; hier Polarstern zuerst, umgekehrt zum Erwachen) und Linien
  // [von, nach, Beginn in s] aus wagen.linien: Der Wagen zeichnet sich vom Polarstern die Deichsel hinab bis in die
  // Schale. Jede Linie zwischen zwei Nachbarn wächst in 0,25 s zum nächsten Stern, sobald er aufleuchtet; die übrige
  // (4 → 1 des Wagens) schliesst danach die Schale, von ihrem letzten Stern zurück
  const S = 1.2, RAND = 15, TAKT = 0.32, AN = 0.25, HALTEN = 0.8, AUS = 0.7;
  const P = wagen.form.slice().reverse(), stelle = (k) => P.length - k; // Stern k des Wagens an Stelle 7 − k
  const K = wagen.linien.map(([a, b]) => {
    const i = Math.min(stelle(a), stelle(b)), j = Math.max(stelle(a), stelle(b));
    return j - i === 1 ? [i, j, j * TAKT] : [j, i, j * TAKT + AN];
  }).sort((x, y) => x[2] - y[2]);
  const ende = P.length * TAKT + HALTEN, zyklus = ende + AUS, pz = (s) => `${(s / zyklus * 100).toFixed(2)}%`;
  const xs = P.map(([x]) => x * S), ys = P.map(([, y]) => y * S), x0 = Math.min(...xs) - RAND, y0 = Math.min(...ys) - RAND;
  el.style.width = `${Math.max(...xs) - x0 + RAND}px`;
  el.style.height = `${Math.max(...ys) - y0 + RAND}px`;
  const ort = (i) => [xs[i] - x0, ys[i] - y0];
  let css = '';
  for (const [i, j, t] of K) {
    const [ax, ay] = ort(i), [bx, by] = ort(j), k = document.createElement('div');
    k.className = 'kante';
    k.style.cssText = `left:${ax}px;top:${ay}px;width:${Math.hypot(bx - ax, by - ay)}px;transform:rotate(${Math.atan2(by - ay, bx - ax)}rad)`;
    k.innerHTML = `<i></i><i style="animation:lade-k${i}${j} ${zyklus}s linear infinite"></i>`;
    el.append(k);
    css += `@keyframes lade-k${i}${j}{0%,${pz(t)}{transform:scaleX(0);opacity:0}${pz(t + AN)}{transform:scaleX(1);opacity:1}`
      + `${pz(ende)}{transform:scaleX(1);opacity:1}100%{transform:scaleX(1);opacity:0}}`;
  }
  P.forEach((_, i) => {
    const [x, y] = ort(i), d = i === 0 ? 30 : 18, s = document.createElement('div');
    s.className = 'stern';
    s.style.cssText = `left:${x}px;top:${y}px;width:${d}px;height:${d}px;animation:lade-s${i} ${zyklus}s linear infinite`;
    el.append(s);
    css += `@keyframes lade-s${i}{0%,${pz(i * TAKT)}{opacity:0.16}${pz(i * TAKT + AN)},${pz(ende)}{opacity:1}100%{opacity:0.16}}`;
  });
  const stil = document.createElement('style');
  stil.textContent = css;
  document.head.append(stil);

  // Grösse (--gross): auf dem Handy wie oben gezeichnet, auf grossen Bildschirmen bis 2,2-mal (Nutzer: auf dem
  // Computer grösser; 1280 × 800 ergibt 2). ?wagen=<faktor>: fest, zum Ausprobieren
  const fest = Math.min(4, Math.max(0, Number(new URLSearchParams(location.search).get('wagen')) || 0));
  const groesse = () => el.style.setProperty('--gross',
    (fest || Math.min(2.2, Math.max(1, Math.min(seiteBreite(), seiteHoehe() * 1.6) / 640))).toFixed(3));
  groesse();
  window.addEventListener('resize', groesse);

  let seit = 0, an = false, stopp = 0, obenGewuenscht = false;
  const setze = (ja) => {
    if (ja === an) return;
    an = ja;
    clearTimeout(stopp);
    if (ja) { // von vorn: zuerst der Polarstern (laufen die Animationen noch vom Ausblenden, erst neu anstossen)
      el.classList.toggle('oben', obenGewuenscht);
      if (el.classList.contains('laeuft')) { el.classList.remove('laeuft'); void el.offsetWidth; }
      el.classList.add('laeuft', 'an');
    } else {
      el.classList.remove('an');
      stopp = setTimeout(() => el.classList.remove('laeuft'), 600); // nach dem Ausblenden: Animationen aus
    }
  };
  return {
    /**
     * Wartet die Stelle noch (ja)? Nach 0,4 s Warten zeigen, sonst weich ausblenden. oben: über der Bühne (oben im
     * Himmel statt in der Mitte); gilt ab dem nächsten Einblenden, ein stehender Wagen springt nicht.
     */
    warte(ja, oben = false) {
      obenGewuenscht = oben;
      if (!ja) { seit = 0; setze(false); return; }
      const jetzt = performance.now();
      if (!seit) seit = jetzt;
      setze(jetzt - seit >= 400);
    },
  };
})();

/**
 * Testhilfe ?alles (Wunsch des Nutzers vom 09.11.2026: testen, ohne durchzuspielen): setzt den Speicherstand eines
 * Grads auf «alles gelöst», bevor die Geschichte ihn liest. Alle Level seines Durchgangs und alle Übungen im Dorf sind
 * gelöst, alle Momente und das Finale gesehen, der Grad ist der zuletzt gespielte. Im Menü steht dann «Übersicht», dort
 * ist jedes Level wählbar. ?alles: Leicht; ?alles=mittel, schwer, sehr-schwer. Weitere Felder des Stands und die
 * Bestwerte bleiben. Danach verschwindet der Parameter aus der Adresse, ein Neuladen setzt nichts mehr; «Von vorn» im
 * Menü setzt den Grad zurück.
 */
(() => {
  const q = new URLSearchParams(location.search);
  if (!q.has('alles')) return;
  const grad = (q.get('alles') || 'leicht').replaceAll('-', ' ');
  if (!Object.hasOwn(STORY_LEVELS, grad)) { console.warn(`?alles: Grad ${grad} unbekannt, nichts gesetzt`); return; }
  const namen = STORY_LEVELS[grad].flat(), uebungen = LEVELS.slice(0, TUTORIAL_COUNT).map((l) => l.name);
  const alt = progress.load(grad, namen.length);
  const momente = ['prolog', 'angebot', STORY_DORF.einstieg.moment, ...STORY_CHAPTERS.map(storyChapterId)];
  progress.save(grad, { ...alt, platz: namen.length - 1, geloest: [...new Set([...uebungen, ...namen])],
    gesehen: [...new Set([...alt.gesehen, ...momente])], geschafft: true,
    dorf: { ende: 'gespielt' } });
  progress.setLast(grad);
  // die übrigen Parameter wörtlich behalten (URLSearchParams schriebe ?noadapt als ?noadapt=)
  const rest = location.search.slice(1).split('&').filter((t) => t && !/^alles(=|$)/.test(t)).join('&');
  history.replaceState(history.state, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
})();

const story = {
  el: $('story'),
  grade: null,        // gewählter Grad (Schlüssel in STORY_LEVELS), bis zur Wahl der zuletzt gespielte oder null
  stand: null,        // sein Speicherstand (progress.load), platz siehe step
  choosing: false,    // Menü oder Übersicht offen (openMenu bis choose, Übersicht bis zur Wahl oder zum Schliessen)
  paused: null,       // Menü oder Übersicht aus dem Spiel geöffnet: { grade, at } (toMenu, toOverview); im selben
                      // Grad geht es dort weiter (resume)
  overview: null,     // Übersicht offen: { grade, from: 'menu' | 'spiel' } (dorthin führt Schliessen zurück)
  replay: false,      // Wiederholen (Entscheid 16): gelöste Level ohne Einstieg, Reise und Untertitel; der Platz
                      // im Speicherstand bleibt, bis wieder ein ungelöstes Level dran ist
  outside: false,     // ein Level ausserhalb der Geschichte (Testschnittstelle zeige): ohne Stand und Kopfzeile
  steps: [],          // je Level des Durchgangs im Grad { c: Kapitel, index: Platz in LEVELS }
  step: 0,            // Level, das gerade läuft (der Platz im Speicherstand)
  inDorf: false,      // eine Übung «Im Dorf» läuft (Ticket 07), dann ist uebung das Level statt steps[step]; mit
                      // replay als Wiederholen aus der Übersicht
  uebung: 0,          // die Übung im Dorf (0 … TUTORIAL_COUNT − 1, zugleich ihr Platz in LEVELS)
  entering: null,     // ein Einstieg (enter) läuft, bis das Level zu wachsen beginnt: { skip } (Überspringen, land)
  endeWartet: false,  // «Überspringen» im Dorf, während eine Zwischenszene lief: danach (done)
  skipShown: false,   // «Überspringen» (#btn-skip) ist zu sehen (update, skippable)
  skipRuhe: 0,        // bis dann (performance.now) kein «Dorf überspringen»: gleich nach einem Einstieg
  landing: false,     // ein übersprungener Einstieg landet (land): Tippen beschleunigt nicht
  gaze: 0,            // Blick in den Himmel, 0 … 1 (updateCamera)
  gazeDir: new THREE.Vector3(0, 1, 0),
  amStern: null,      // Finale: Der Lichtpunkt steht auf diesem Stern des Wagens (1 … 7; update)
  seit: 0,            // Ende des Finales: Drehung der Kamera um ihre Hochachse (rad, updateCamera; wagenEnde)
  halt: false,        // das Licht hält über dem Untertitel der Ankunft an und wartet auf Tippen (anhalten)
  haltAuf: null,      // dabei: wo es von der Kamera aus steht (update hält es dort, auch wenn sie noch gleitet)
  gazeRun: 0,         // zählt die weichen Blickwechsel (gazeTo): ein neuer löst den laufenden ab
  holdEnter: false,   // updateFlow: nach dem Versinken auf die Geschichte warten (sunk)
  running: false,     // eine Zwischenszene läuft
  fast: 1,            // Tippen in einer Zwischenszene: schneller
  tweens: [],
  waitTap: null,
  scene: null,        // Bühne für Prolog und Epilog (createStoryScene), beim ersten Gebrauch gebaut
  _covered: false,
  /** Die Bühne deckt das Spiel zu: Es zeichnet höchstens 30 Bilder/s (frameRate.fps), sobald sie ganz eingeblendet ist gar nicht mehr (sceneLoop) */
  get covered() { return this._covered; },
  set covered(on) {
    if (on === this._covered) return;
    this._covered = on;
    sceneLoop.coverStory(on);
  },
  blend: null,        // Reise zwischen zwei Welten auf der Erde: { from, to } der Hintergründe (blendSky)
  himmel: himmelsWagen, // der Kleine Wagen am Himmel (Ticket 04 von .scratch/kleiner-wagen/; Proben lesen stand)
  skipped: false,     // Prolog übersprungen
  stillBild: false,   // die Bühne wartet auf Tippen oder steht mit dem Angebot: eine ruhige Stelle (ruhe) ab stillAb
  ladeSperre: false,  // Ruhepunkt vor einem Flug der Glühwürmchen: dort lädt nichts Grosses hinter der Bühne (ruhe)
  stillAb: 0,         // performance.now(), ab wann (nach dem gestaffelten Vorbereiten der nächsten Fahrt)
  buehneWarm: false,  // die Bühne des Prologs ist vorgewärmt und bleibt bis zum Prolog gerastert (vorwaermen)
  ersterHimmel: true, // noch keiner seit dem Start abgewartet (skyOf): Fehlt er, ist das Laden markiert (ruhe.lade)
  licht: null,        // Höhe des Lichts über dem Untertitel, gemessen (lichtHoch); null: neu messen
  lichtBei: 0,        // bei dieser Höhe des Fensters gemessen

  init() {
    // der Hintergrund der Welt, in der es im zuletzt gespielten Grad weitergeht (sonst der ersten): Er lädt schon
    // während des Startbildschirms. Mit ?sky= (Tests) bleibt der dort gewählte
    const last = progress.last();
    if (last) this.setGrade(last);
    if (!urlSky) {
      this.setSky(this.dorfLaeuft() ? STORY_DORF.sky : STORY_CHAPTERS[this.steps[this.step]?.c ?? 0].sky, false);
    }
    this.el.addEventListener('click', () => this.tap());
    this.skipBtn = $('btn-skip');
    this.skipBtn.addEventListener('click', (e) => { e.stopPropagation(); this.skip(); this.keepFocus(this.skipBtn); });
    this.buildScene();
  },
  /**
   * Grad setzen: sein Durchgang aus STORY_LEVELS, sein Stand, sein Platz (ein Wiederholen endet, ebenso eine Übung im
   * Dorf: begin setzt sie fort). Den Stand des Dorfs prüft erst dieser Schritt (progress kennt das Tutorial nicht).
   */
  setGrade(grade) {
    this.grade = grade;
    this.replay = false;
    this.inDorf = false;
    this.endeWartet = false;
    const byName = new Map(LEVELS.map((l, i) => [l.name, i]));
    this.steps = [];
    STORY_CHAPTERS.forEach((ch, c) => {
      for (const name of STORY_LEVELS[grade]?.[c] ?? []) {
        if (byName.has(name)) this.steps.push({ c, index: byName.get(name) });
        else console.warn(`Geschichte: Level ${name} fehlt`);
      }
    });
    this.stand = progress.load(grade, this.steps.length);
    this.step = this.stand.platz;
    const dorf = storyDorfStand(this.stand.dorf);
    if (dorf) this.stand.dorf = dorf;
    else delete this.stand.dorf;
    this.himmelStand();
  },
  /** Das Kapitel «Im Dorf» ist begonnen und noch nicht zu Ende (gespielt oder übersprungen). */
  dorfLaeuft() { return this.stand?.dorf?.ende === null; },
  /** Das Level, mit dem es nach dem Start wohl weitergeht (Vorwärmen): im zuletzt gespielten Grad, sonst im ersten. */
  firstIndex() {
    if (this.dorfLaeuft()) return 0; // das Dorf beginnt immer bei Übung 1
    if (this.steps.length) return this.steps[this.step].index;
    const name = Object.values(STORY_LEVELS)[0]?.[0]?.[0], i = LEVELS.findIndex(l => l.name === name);
    return i >= 0 ? i : 0;
  },
  chapter() { return STORY_CHAPTERS[this.steps[this.step].c]; },
  /** Hintergrund des Kapitels; fehlt die Skybox (z. B. skies.js nicht geladen): Milchstrasse. */
  // ?sky=…: dieser Hintergrund bleibt auch in den Levels und auf Reisen (Vergleich auf dem Handy)
  setSky(id, animate) { skyTheme.set(skyTheme.byId.has(urlSky) ? urlSky : skyTheme.byId.has(id) ? id : 'milky', animate); },
  /** Das Level, das die Geschichte gerade spielt: im Dorf die Übung, sonst das Level des Platzes (Platz in LEVELS). */
  currentIndex() { return this.inDorf ? this.uebung : this.steps[this.step]?.index; },
  /** Die Geschichte führt das Level index (sonst: ausserhalb, Testschnittstelle zeige). */
  drives(index) { return !this.outside && this.grade !== null && this.currentIndex() === index; },
  /**
   * Stand des Grads speichern; gespielt: wann zuletzt (ms seit 1970), für «Weiter» im Menü (menuStand). Der Platz
   * fällt nie zurück (Wiederholen spielt Level davor). Die Übung im Dorf nicht (Spec .scratch/tutorial-neu/, «Kein
   * Stand im Dorf»): Innerhalb der Sitzung behalten sie Menü und Übersicht (story.uebung), nach dem Neuladen beginnt
   * das Dorf bei Übung 1.
   */
  save() {
    if (this.outside || this.grade === null) return;
    this.stand.platz = Math.max(this.stand.platz, this.step);
    this.stand.gespielt = Date.now();
    progress.save(this.grade, this.stand);
  },
  /** Ein Moment, der nur beim ersten Mal kommt (prolog, Einstieg in eine Welt), ist gesehen. */
  see(moment) {
    if (this.stand.gesehen.includes(moment)) return;
    this.stand.gesehen.push(moment);
    this.save();
  },
  seen(moment) { return this.stand.gesehen.includes(moment); },
  /**
   * Ein Level des Durchgangs ist gelöst (beim Lösen, updateFlow; stats: flow.solveStats): gelöst merken und die
   * Bestwerte nachführen, auch beim Wiederholen. Zurück, was besser wurde ({ neueBestzeit, wenigerDrehungen }, für
   * «Gelöst»), ausserhalb der Geschichte null.
   */
  markSolved(index, stats) {
    if (!this.drives(index)) return null;
    const name = LEVELS[index].name, record = progress.noteBest(this.grade, name, stats);
    if (!this.stand.geloest.includes(name)) {
      this.stand.geloest.push(name);
      this.save();
    }
    return record;
  },
  /**
   * Stand des Kleinen Wagens im Grad grade (wagen.stand: wache Sterne, gezogene Linien, nächster Stern), abgeleitet aus
   * seinem Durchgang; je Grad getrennt, nach «Von vorn» alle schlafend. Neuladen, Fortsetzen, Wiederholen, Menü und
   * Übersicht zeigen denselben; nur das Erwachen selbst (Aufstieg, Reise, Finale) ändert ihn sichtbar. Proben lesen ihn
   * über die Testschnittstelle (story).
   */
  wagenStand(grade = this.grade) {
    const welten = STORY_LEVELS[grade];
    if (!welten) return wagen.stand(null, null);
    return wagen.stand(grade === this.grade && this.stand ? this.stand : progress.load(grade, welten.flat().length),
      welten);
  },
  /**
   * Der Wagen am Himmel (himmelsWagen) zeigt den Stand des Durchgangs im Grad auf dem Brett; über dem Dorf (Kapitel «Im
   * Dorf», auch im Menü, solange es läuft) wie im Prolog alle sechs schlafend, ohne Stern einer Welt; sonst ist der
   * Stern dieser Welt der des Kapitels auf dem Platz. Angeglichen bei jedem Wechsel von Grad oder Welt (setGrade,
   * begin, enter, Wiederholen über eine Weltgrenze, Epilog), also bevor man ihn sieht. Das Lösen des letzten Levels
   * einer Welt weckt ihren Stern sichtbar erst beim Aufstieg (erwache); Stern dieser Welt wird der nächste, wenn das
   * Licht auf der Reise an ihm vorbeizieht (zucke).
   */
  himmelStand() {
    const c = this.steps[this.step]?.c;
    if (this.grade === null || this.inDorf || !this.replay && this.dorfLaeuft()) himmelsWagen.zeige(null, null);
    else himmelsWagen.zeige(this.wagenStand(), c === undefined ? null : c + 1);
  },

  /* ---------- Ablauf ---------- */

  /** Nach dem Startbildschirm: das Menü über dem Himmel der Welt, in der es im zuletzt gespielten Grad weitergeht. */
  start() {
    flow.state = 'story';
    this.scene ??= this.makeScene(); // jetzt, unter dem Startbildschirm, statt erst im Finale (ein Ruck)
    this.openMenu({ sofort: true });
  },
  /**
   * Menü öffnen (Entscheide 8, 14, 17): nach dem Startbildschirm, mit «Menü» im Spiel und am Ende des Epilogs.
   * Kopfzeile, Knöpfe und «Gelöst» sind solange weg; dahinter schaut die Kamera in den Himmel, damit das Brett nicht
   * hinter der Sternkarte steht (vom Brett hebt sich der Blick weich, sofort: unter dem Startbildschirm). hervorheben:
   * direkt nach dem Epilog der nächstschwerere Grad (Entscheid 14).
   */
  openMenu({ sofort = false, hervorheben = false } = {}) {
    this.lift(sofort);
    menu.show(this.menuStand(hervorheben));
  },
  /**
   * Menü oder Übersicht öffnet: Kopfzeile, Knöpfe und «Gelöst» gehen weg, der Blick hebt sich vom Brett in den Himmel
   * (sofort: unter dem Startbildschirm). Bis zur Wahl oder zum Schliessen ist choosing gesetzt: Dann erscheinen
   * Kopfzeile und «Gelöst» nicht (ui), Tippen wirkt nicht (tap), steht der Blick im Himmel, reichen 10 Bilder/s (frameRate).
   */
  lift(sofort = false) {
    this.choosing = true;
    this.fast = 1;
    setHovered(null);
    ui.hideHud();
    ui.hideSolved();
    setShown(ui.controls, false);
    if (this.gaze < 1) {
      if (this.gaze === 0) this.aimGaze(this.steps.length ? this.chapter().up ?? STORY_UP : STORY_UP);
      if (sofort) { this.gazeRun++; this.gaze = 1; } else this.gazeTo(1, 1.8);
    }
  },
  /**
   * Stand je Grad für das Menü (createMenu): neu, begonnen (ab dem Prolog; Welt des Platzes, vor dem Bergwald das Dorf,
   * gelöste Level des Durchgangs, wache Sterne des Wagens) oder geschafft. «Weiter» (Entscheid 25) führt zum zuletzt gespielten unter den
   * begonnenen Graden: dem zuletzt gewählten, wenn er begonnen ist, sonst dem mit dem jüngsten Speichern (gespielt;
   * ohne Zeit zählt ein Stand als ältester). «Von vorn» und «geschafft» nehmen einen Grad aus dieser Wahl.
   * hervorheben: direkt nach dem Epilog der nächstschwerere, noch nicht geschaffte Grad nach dem zuletzt gewählten
   * (Entscheid 14).
   */
  menuStand(hervorheben = false) {
    const grade = {}, gespielt = {};
    for (const [g, welten] of Object.entries(STORY_LEVELS)) {
      const namen = new Set(welten.flat()), s = progress.load(g, namen.size);
      if (s.geschafft) { grade[g] = { stand: 'geschafft', wach: wagen.form.length }; continue; }
      if (!s.gesehen.length && !s.geloest.length && !s.platz) continue; // neu (auch ein unlesbarer Stand)
      let c = 0;
      for (let rest = s.platz; c < welten.length - 1 && rest >= welten[c].length; c++) rest -= welten[c].length;
      const welt = storyChapterId(STORY_CHAPTERS[c]);
      grade[g] = { stand: 'begonnen', welt: c === 0 && !s.gesehen.includes(welt) ? 'dorf' : welt,
        geloest: s.geloest.filter((n) => namen.has(n)).length, wach: wagen.stand(s, welten).wach.length };
      gespielt[g] = Number.isFinite(s.gespielt) ? s.gespielt : 0;
    }
    const last = progress.last(), order = Object.keys(STORY_LEVELS), begonnen = Object.keys(gespielt);
    const weiter = gespielt[last] !== undefined ? last
      : begonnen.reduce((a, g) => (a === null || gespielt[g] > gespielt[a] ? g : a), null);
    const nach = order.indexOf(last);
    const hervor = hervorheben && nach >= 0
      ? order.slice(nach + 1).find((g) => grade[g]?.stand !== 'geschafft') ?? false : false;
    // zuletzt: das Ziel von «Weiter»; ohne begonnenen Grad der zuletzt gewählte (Fokus im Menü)
    return { grade, zuletzt: weiter ?? last, hervorheben: hervor };
  },
  /** «Menü» im Spiel (Entscheid 17, Esc): Der Stand bleibt; der Blick hebt sich vom Brett in den Himmel. */
  toMenu() {
    if (this.choosing || this.running || this.holdEnter || !['play', 'in', 'out'].includes(flow.state)) return;
    // zurück ins selbe Level (choose): Es steht noch auf dem Brett; at: die Zeit im Menü zählt nicht
    this.paused = this.outside || this.grade === null ? null : { grade: this.grade, at: performance.now() };
    this.openMenu();
  },
  /**
   * «Übersicht» im Spiel (Knopf, Taste L) wie «Menü»: Das Level bleibt stehen (paused), der Blick hebt sich in den
   * Himmel, darüber die Übersicht des laufenden Grads mit dem laufenden Level. Nur in einem Level der Geschichte.
   */
  toOverview() {
    if (this.choosing || this.running || this.holdEnter || !['play', 'in', 'out'].includes(flow.state)) return;
    if (this.outside || this.grade === null) return;
    this.paused = { grade: this.grade, at: performance.now() };
    this.lift();
    this.openOverview(this.grade, 'spiel');
  },
  /** Übersicht des Grads grade öffnen (from: 'menu' oder 'spiel', dorthin führt Schliessen zurück). */
  openOverview(grade, from) {
    this.overview = { grade, from };
    if (from === 'menu') menu.hide(); // die Übersicht blendet darüber ein (gleiche Ebene, im Dokument danach)
    uebersicht.show(this.overviewData(grade, from === 'spiel'));
  },
  /**
   * Übersicht schliessen (Esc, «Schliessen», Klick daneben, L): zurück ins Menü (Fokus bei der Karte des Grads) bzw.
   * ins Level, das beim Öffnen lief (die Zeit in der Übersicht zählt nicht, resume). Fokus: in einem gelösten Level
   * auf «Weiter», sobald «Gelöst» wieder steht (Enter führt weiter), sonst auf «Übersicht».
   */
  closeOverview() {
    const o = this.overview;
    if (!o || !uebersicht.offen) return;
    uebersicht.hide();
    this.overview = null;
    if (o.from === 'menu') {
      menu.show(this.menuStand());
      $('menue').querySelector(`[data-menue-fokus="wahl:${CSS.escape(o.grade)}"]`)?.focus({ preventScroll: true });
      return;
    }
    this.choosing = false;
    const p = this.paused, geloest = flow.solved;
    this.paused = null;
    const zurueck = p ? this.resume(p) : Promise.resolve();
    if (!geloest) { ui.overview.focus({ preventScroll: true }); return; }
    zurueck.then(() => { if (!this.choosing && ui.solvedVisible()) ui.next.focus({ preventScroll: true }); });
  },
  /**
   * Kachel in der Übersicht gewählt (Entscheide 9 und 16). Ein gelöstes Level läuft als Wiederholen: ohne Einstieg,
   * Reise und Untertitel, der Platz im Speicherstand bleibt; aus dem Menü ändert das den zuletzt gespielten Grad nicht
   * (Entscheid 3 zu Ticket 06). Das offene Level läuft im normalen Ablauf; ist es das Level auf dem Brett, geht es dort
   * weiter wie nach Schliessen. Ein altes Brett versinkt, während die Kamera im Himmel ist (begin). Eine Übung im
   * Dorf: playDorf.
   */
  playFromOverview({ welt, level, eintrag, wiederholen }) {
    const o = this.overview, p = this.paused;
    if (!o || !uebersicht.offen) return;
    if (o.grade !== this.grade) this.setGrade(o.grade); // aus dem Menü: ein anderer Grad als der auf dem Brett
    const i = welt === 'dorf' ? (LEVELS[level]?.name === eintrag.name ? level : -1)
      : this.steps.findIndex((s) => LEVELS[s.index].name === eintrag.name);
    if (i < 0) return;
    uebersicht.hide();
    this.overview = null;
    this.choosing = false;
    this.paused = null;
    if (welt === 'dorf') { this.playDorf(i, wiederholen, p); return; }
    if (!wiederholen && p?.grade === o.grade && !this.inDorf && i === this.step && game.board
      && game.levelIndex === this.steps[i].index) {
      this.resume(p); // das offene Level steht noch auf dem Brett: dort weiter
      return;
    }
    // ein Level der Welten mitten im Kapitel «Im Dorf» (nur das erste des Bergwalds ist offen): Das Dorf ist damit
    // übersprungen, ohne seinen Schluss (Entscheid des Umsetzers, Ticket 07)
    if (this.dorfLaeuft()) this.stand.dorf.ende = 'uebersprungen';
    this.inDorf = false;
    this.outside = false;
    this.step = i;
    this.replay = wiederholen;
    if (!wiederholen) this.save();
    this.begin();
  },
  /**
   * Übung i «Im Dorf» aus der Übersicht (Entscheid 4 zu Ticket 07): Läuft das Kapitel noch, geht es an der offenen
   * Übung weiter wie sonst (steht sie auf dem Brett, wie Schliessen); jede andere läuft als Wiederholen, ohne Einstieg,
   * «Weiter» zur nächsten, nach der letzten zurück in die Übersicht. Nach «Überspringen» sind alle frei (auch die
   * ungelösten laufen so). p: Spiel pausiert beim Öffnen.
   */
  playDorf(i, wiederholen, p) {
    const laeuft = this.dorfLaeuft();
    if (!wiederholen && laeuft && p?.grade === this.grade && this.inDorf && !this.replay && this.uebung === i
      && game.board && game.levelIndex === i) {
      this.resume(p);
      return;
    }
    this.outside = false;
    this.inDorf = true;
    this.uebung = i;
    this.replay = wiederholen || !laeuft;
    if (!this.replay) this.save();
    this.begin();
  },
  /**
   * Daten der Übersicht (createUebersicht) für den Grad grade: die sechs Welten mit ihren Leveln (Titel, gelöst,
   * Bestwerte nur bei gelösten: nach «Von vorn» bleiben sie gespeichert, erscheinen aber erst wieder mit dem Lösen),
   * geschafft (Finale gesehen), aus dem Spiel das laufende Level. dorf: die Übungen «Im Dorf», sobald das Kapitel
   * gespielt ist (Ticket 07: stand.dorf, nach «Überspringen» alle frei).
   */
  overviewData(grade, imSpiel = false) {
    const s = grade === this.grade && this.stand ? this.stand
      : progress.load(grade, (STORY_LEVELS[grade] ?? []).flat().length);
    const best = progress.best(grade), titel = new Map(LEVELS.map((l) => [l.name, l.titel]));
    const level = (name) => {
      const geloest = s.geloest.includes(name), b = geloest ? best[name] ?? {} : {};
      return { name, titel: titel.get(name), geloest, bestzeit: b.zeit ?? null, drehungen: b.drehungen ?? null };
    };
    const welten = STORY_CHAPTERS.map((ch, c) => ({ name: ch.title.replace(/^(Der|Die|Das) /, ''),
      icon: storyChapterId(ch), level: (STORY_LEVELS[grade]?.[c] ?? []).map(level) }));
    const d = { grad: grade, welten, geschafft: s.geschafft }, dorf = storyDorfStand(s.dorf);
    if (dorf) {
      d.dorf = { level: LEVELS.slice(0, TUTORIAL_COUNT).map((l) => level(l.name)),
        frei: dorf.ende === 'uebersprungen' };
    }
    const cur = imSpiel && this.steps[this.step];
    if (imSpiel && this.inDorf) d.aktuell = { welt: 'dorf', level: this.uebung };
    else if (cur) {
      d.aktuell = { welt: cur.c, level: (STORY_LEVELS[grade]?.[cur.c] ?? []).indexOf(LEVELS[cur.index].name) };
    }
    return d;
  },
  /** Esc im Menü, das aus dem Spiel kam: zurück ins Level wie mit «Weiter» (nach dem Start und dem Epilog nicht). */
  back() {
    if (this.choosing && this.paused) this.choose(this.paused.grade);
  },
  /** «Zum Menü» am Ende des Epilogs, ohne Neuladen: Das Menü blendet über der Bühne ein, die Bühne aus. */
  afterEpilog() {
    if (this.choosing) return;
    this.running = false;
    this.covered = false; // dahinter der Himmel der Sterne, die Kamera schaut noch zum Polarstern
    this.openMenu({ hervorheben: true });
    himmelsWagen.sofort(); // hinter der Bühne schon aus (die Sternkarte zeigt den Wagen), ohne Ausblenden
    this.close();
    this.scene.hide();
  },
  /** Aktion im Menü (createMenu, onAction): ein geschaffter Grad öffnet seine Übersicht, die übrigen spielen. */
  pick({ aktion, grad }) {
    if (aktion === 'vonvorn') this.resetGrade(grad);
    else if (aktion === 'uebersicht') this.openOverview(grad, 'menu');
    else this.choose(grad);
  },
  /**
   * «Von vorn» (nach der Rückfrage im Menü): nur der Stand dieses Grads geht (Entscheid 19), seine Bestwerte bleiben
   * (Entscheid 27); das Menü bleibt offen.
   */
  resetGrade(grade) {
    progress.remove(grade);
    if (this.grade === grade) { this.paused = null; this.setGrade(grade); } // sein Level auf dem Brett gilt nicht mehr
    menu.show(this.menuStand());
  },
  /**
   * Grad gewählt: dort weiter, wo er steht; neu von vorn mit dem Prolog. Das Menü blendet sofort aus (nicht erst, wenn
   * der Himmel der Welt da ist); war es aus dem Spiel geöffnet und geht es im selben Level weiter, steht es noch da.
   */
  choose(grade) {
    if (!this.choosing) return;
    this.choosing = false;
    menu.hide();
    // zurück in ein Wiederholen eines geschafften Grads (Esc): Es bleibt der zuletzt gespielte, nicht geschaffte Grad
    // (Entscheid 25 und 3 zu Ticket 06)
    if (!(grade === this.grade && this.stand?.geschafft)) progress.setLast(grade);
    const p = this.paused;
    this.paused = null;
    if (p?.grade === grade && game.board && game.levelIndex === this.currentIndex()) { // auch eine Übung im Dorf
      this.save(); // gespielt: jetzt (menuStand)
      this.resume(p);
      return;
    }
    this.outside = false;
    this.setGrade(grade);
    this.save();
    this.begin();
  },
  /**
   * Zurück ins Level, das beim Öffnen von Menü oder Übersicht lief: Der Blick senkt sich aufs Brett, es geht weiter
   * wie vorher; die Zeit dort zählt nicht für die Bestzeit.
   */
  async resume(p) {
    this.running = true;
    this.buehneFrei();
    // beide Zeitpunkte verschieben: Kam der Lösungsmoment der letzten Drehung vor dem Menü erst danach, zählte sonst
    // die Zeit im Menü ab (unter dem Menü gibt es keine Drehung, lastTurnAt liegt immer davor)
    const st = game.stats, pause = performance.now() - p.at;
    if (st.startedAt !== null) { st.startedAt += pause; st.lastTurnAt += pause; }
    setShown(ui.controls, true);
    ui.showHud(game.levelIndex);
    await this.gazeTo(0, 1.8);
    // gelöst: die Meldung wieder (kam der Lösungsmoment erst unter dem Menü, jetzt; sonst kommt sie noch von selbst)
    if (flow.solved && flow.state === 'play' && (!celebration.active || celebration.panelShown)) {
      ui.showSolved(game.levelIndex, flow.solveStats);
    }
    this.done();
  },
  /**
   * Prolog (nur beim ersten Mal je Grad) mit dem Angebot «Üben» / «Gleich los» (Entscheid 18), dann bringt der Träger
   * das Licht in die Welt, in der es weitergeht, bzw. das Licht kommt ins Dorf. Ein altes Feld (Menü oder Übersicht aus
   * dem Spiel, nach dem Epilog) versinkt dabei unbemerkt: Die Kamera schaut in den Himmel bzw. die Bühne deckt es zu.
   * Läuft das Kapitel «Im Dorf», beginnt es bei Übung 1 (kein Stand im Dorf). Wiederholen (replay) kommt immer ohne
   * Prolog und Einstieg.
   */
  async begin() {
    this.running = true;
    flow.state = 'story';
    if (!this.inDorf && !this.replay && this.dorfLaeuft()) { this.inDorf = true; this.uebung = 0; }
    this.himmelStand();
    let index = this.currentIndex(), ch = this.inDorf ? STORY_DORF : this.chapter();
    prepareLevel(index); // ohne altes Feld (sinkTo): die Elemente in den Pausen des Prologs bzw. während der Blick oben ist
    const sunk = game.board ? this.sinkTo(index) : Promise.resolve(); // versinkt auch aus dem Herauswachsen
    if (this.replay || this.seen(this.inDorf ? STORY_DORF.einstieg.moment : storyChapterId(ch))) {
      // in dieser Welt hat schon ein Level begonnen: ohne Einstieg. Die Kamera bleibt im Himmel, bis die Welt bereit
      // ist (sonst sähe man ein leeres Brett, solange ihr Himmel lädt), dann senkt sich der Blick, und das Level wächst
      this.buehneFrei(); // kein Prolog: eine gehaltene Bühne ruht
      await this.skyOf(ch);
      await sunk;
      setShown(ui.controls, true);
      await this.gazeTo(0, 2.2, (k) => { if (k > 0.25 && flow.state === 'story') enterLevel(index); });
      this.done();
      return;
    }
    // das Angebot nur vor dem ersten Level des Grads (ein älterer Stand ohne «angebot» bekommt es nicht mitten im Wald)
    const angebot = !this.inDorf && !this.seen('angebot') && !this.seen(storyChapterId(STORY_CHAPTERS[0]));
    if (this.seen('prolog') && !angebot) this.buehneFrei(); // kein Prolog: die gehaltene Bühne ruht
    if (!this.seen('prolog') || angebot) {
      // lädt hinter der Bühne, aber nur beim Warten auf Tippen und beim Angebot, nie während einer Fahrt (ruhe; das
      // Hochladen von scharfem Bild und Streifen hielt sie bis 110 ms an, Review Ticket 07)
      this.setSky(ch.sky, true);
      // nach einem Neuladen zwischen Prolog und Wahl: nur das Angebot, auf dem letzten Bild des Prologs, ohne Fahrt
      const shots = this.seen('prolog') ? [{ ...STORY_PROLOG.at(-1), text: '', act: null, move: 0 }] : STORY_PROLOG;
      const ueben = await this.playScene(shots, { skippable: !this.seen('prolog'), angebot });
      this.see('prolog');
      if (ueben) { this.inDorf = true; this.uebung = 0; index = this.currentIndex(); ch = STORY_DORF; }
    }
    // Abschnitte des Messwerkzeugs (leistung.waehrend): Einstieg, Reise, Weltwechsel und Finale
    if (this.inDorf) await leistung.waehrend('einstieg', this.enter(index, ch, sunk, STORY_DORF.einstieg));
    else await leistung.waehrend('einstieg', this.enter(index, ch, sunk));
    this.done();
  },
  /**
   * «Gelöst» steht, und «Weiter» führt in eine andere Welt (Reise, beim Wiederholen die Weltgrenze): deren Himmel
   * gleich schon laden (skyTheme.preload; die Feier ist dann vorbei), nicht erst im Flug. Er braucht gut 2 s.
   */
  preloadNext() {
    const cur = !this.inDorf && this.steps[this.step], next = cur && this.steps[this.step + 1];
    if (!next || next.c === cur.c) return;
    const sky = STORY_CHAPTERS[next.c].sky, index = game.levelIndex;
    setTimeout(() => {
      if (ui.solvedVisible() && game.levelIndex === index && !this.choosing && !this.running) skyTheme.preload(sky);
    }, 300);
  },
  /** Eine Zwischenszene ist zu Ende; wartet ein «Überspringen» des Dorfs (skip), kommt es jetzt. */
  done() {
    this.running = false;
    if (this.endeWartet) { this.endeWartet = false; this.dorfEnde('uebersprungen'); }
  },
  /**
   * Das Angebot nach dem Prolog (auch nach «Überspringen») auf der Bühne: «Im Dorf», der Satz und die Knöpfe «Üben» und
   * «Gleich los», der Fokus auf «Üben». Der Prolog ist gesehen, sobald das Angebot steht; die Wahl gilt sofort (gesehen:
   * angebot; nach «Üben» stand.dorf, und der Himmel des Dorfs kommt hinter der Bühne, die ihn noch ganz zudeckt).
   * Zurück: true bei «Üben».
   */
  async offer(sc) {
    const a = STORY_DORF.angebot;
    // übersprungen: Die Fahrt läuft im Zeitraffer zu Ende (sonst klickte die Lampe noch unter dem Angebot)
    for (let t = 0; sc.laeuft && t < 40; t++) await storySleep(50);
    sc.speed = 1;
    sc.hint(false);
    // «Im Dorf» und die Knöpfe erst, wenn der letzte Satz des Prologs aus ist (Abnahme Ticket 12: Sie schoben ihn
    // sonst noch im Ausblenden hinauf); dann steht der Satz des Angebots gleich dort, wo er bleibt
    let knoepfe;
    const umgebaut = sc.say(a.text, { umbau: () => {
      sc.kicker(a.kicker);
      knoepfe = new Promise((resolve) => {
        sc.actions([[a.ueben, () => resolve(true)], [a.los, () => resolve(false)]], { angebot: true });
      });
    } });
    this.see('prolog'); // schon jetzt: Ein Neuladen vor der Wahl bringt nur noch das Angebot (begin)
    await umgebaut;
    sc.el.querySelector('.actions button')?.focus({ preventScroll: true });
    // sobald das Angebot steht (wie bis Ticket 12, nicht schon, während der letzte Satz ausblendet), lädt der Wald
    // fertig (ruhe), was in den Pausen des Prologs nicht fertig wurde: Die Fahrt ist vorbei, der Spieler liest. So ist
    // er nach «Gleich los» bereit (sonst Schwarz, bis er geladen war). Nach «Üben» ist er nicht mehr gewählt und lädt
    // nicht weiter (Review Ticket 07)
    this.stillBild = true;
    this.ladeSperre = false;
    // erst wenn die Linien des letzten Halts getauscht sind (nach dem Überspringen kommt das Angebot gleich danach)
    this.stillAb = performance.now() + sc.ruheNachHalt;
    setTimeout(() => sceneLoop.wake(), sc.ruheNachHalt + 20);
    sceneLoop.wake(); // was hinter der Bühne liegen blieb, jetzt zeichnen (mayDraw)
    // (ohne Knöpfe: Der Umbau entfiel, weil die Bühne inzwischen neu begann; dann wie bis Ticket 12 keine Wahl mehr)
    const ueben = await (knoepfe ?? new Promise(() => {}));
    sc.actions([]); // nur eine Wahl (Doppelklick)
    this.keepFocus(); // der Knopf ist weg: Fokus gleich zurück (nicht erst nach dem Warten unten)
    // «Gleich los», der Wald aber noch nicht da (vor den Flügen der Glühwürmchen lädt er nicht, Ticket 18): die Bühne
    // bleibt stehen, bis er da ist (höchstens 8 s), statt schwarz
    // (nach der Uhr, nicht gezählt: Zeitgeber in einem verborgenen Tab sind gedrosselt)
    const bis = performance.now() + 8000;
    if (!ueben) while (!skyTheme.ready && performance.now() < bis) { ladeZeichen.warte(true, true); await storySleep(100); }
    // nach 8 s ohne Wald wartet gleich der Einstieg weiter (skyOf): Der Wagen bleibt stehen, statt aus- und einzublenden
    if (ueben || skyTheme.ready) ladeZeichen.warte(false);
    this.stillBild = false;
    this.keepFocus();
    this.fast = 1; // «Überspringen» des Prologs tippt (fast = 3): Der Einstieg danach läuft wieder in seinem Tempo
    if (ueben) {
      this.stand.dorf = { ende: null };
      this.setSky(STORY_DORF.sky, false);
    }
    this.see('angebot');
    return ueben;
  },
  /**
   * Himmel der Welt ch und warten, bis er da ist (höchstens 8 s). Sieht man dabei in den Himmel (nach dem Menü),
   * wechselt er wie auf der Reise langsamer, zwischen zwei Welten auf der Erde über die Farben beider (blendSky).
   */
  async skyOf(ch) {
    const old = skyTheme.current, fadeTime = skyTheme.fadeTime;
    this.setSky(ch.sky, true);
    if (skyTheme.current !== old) {
      skyTheme.fadeTime = 2.4;
      const earth = (id) => skyTheme.byId.get(id)?.sky.rings;
      this.blend = earth(old) && earth(skyTheme.current) ? { from: old, to: skyTheme.current } : null;
    }
    // Steht der erste Himmel nach dem Start noch nicht (wer weiterspielt und gleich «Weiter» wählt; im Prolog nicht
    // fertig geworden): Laden hinter der Überblendung, ruhig und im Messwerkzeug markiert (ruhe.lade). Die Kamera
    // schaut in den Himmel, die Vorschau steht schon, das Netz und das scharfe Bild blenden weich darüber ein. Solange
    // der Himmel fehlt, zeichnet sich der Kleine Wagen (ladeZeichen; unter Menü und Übersicht nicht)
    const warte = async () => {
      // nicht, solange ein Satz auf Tippen wartet (Ende des Dorfs: Der Wald lädt schon, während man liest)
      for (let t = 0; !skyTheme.ready && t < 8; t += 0.1) { ladeZeichen.warte(!this.choosing && !this.waitTap); await this.wait(0.1); }
      ladeZeichen.warte(false);
    };
    await (skyTheme.ready || !this.ersterHimmel ? warte() : ruhe.lade(warte()));
    this.ersterHimmel = false;
    skyTheme.fadeTime = fadeTime;
    this.blend = null;
  },
  /** Blick weich in den Himmel (to = 1) oder zurück aufs Brett (0); ein neuer Aufruf löst einen laufenden ab. */
  gazeTo(to, seconds, onStep) {
    const run = ++this.gazeRun, from = this.gaze;
    return this.tween(seconds, (k) => {
      if (run !== this.gazeRun) return;
      this.gaze = from + (to - from) * k;
      onStep?.(k);
    });
  },
  /**
   * „Weiter“ nach dem Lösen: im Kapitel das nächste Level, am Kapitelende die Zwischenszene. Beim Wiederholen
   * (Entscheid 16) das nächste gelöste Level ohne Zwischenszene, in einer anderen Welt blendet nur der Himmel
   * (replayWorld); nach dem letzten Level eines geschafften Grads die Übersicht. Ist das nächste Level noch ungelöst,
   * gilt wieder der normale Ablauf (Reise, Finale).
   */
  advance() {
    if (this.running) return;
    if (this.inDorf) { this.advanceDorf(); return; }
    const cur = this.steps[this.step], next = this.steps[this.step + 1];
    if (this.replay) {
      if (!next && this.stand.geschafft) { this.toOverview(); return; }
      if (next && this.stand.geloest.includes(LEVELS[next.index].name)) {
        this.step++;
        if (next.c === cur.c) changeLevel(next.index);
        else leistung.waehrend('weltwechsel', this.replayWorld(next));
        return;
      }
      this.replay = false;
    }
    if (next?.c !== cur.c && STORY_CHAPTERS[cur.c].finale) { leistung.waehrend('finale', this.finale()); return; }
    if (!next) { this.ending(); return; }
    this.step++;
    this.save();
    if (next.c === cur.c) changeLevel(next.index);
    else leistung.waehrend('reise', this.chapterEnd(next));
  },
  /**
   * «Weiter» im Dorf: die nächste Übung, nach der letzten das Ende des Kapitels (dorfEnde). Beim Wiederholen nach dem
   * Ende des Kapitels zurück in die Übersicht; läuft das Kapitel noch, gilt ab der ersten ungelösten Übung wieder der
   * normale Ablauf.
   */
  advanceDorf() {
    const next = this.uebung + 1, laeuft = this.dorfLaeuft();
    if (next >= TUTORIAL_COUNT) {
      if (this.replay && !laeuft) { this.toOverview(); return; }
      this.replay = false;
      this.dorfEnde('gespielt');
      return;
    }
    if (this.replay && laeuft && !this.stand.geloest.includes(LEVELS[next].name)) this.replay = false;
    this.uebung = next;
    this.save();
    changeLevel(next);
  },
  /**
   * Ende des Kapitels «Im Dorf» (art: 'gespielt' nach der letzten Übung, 'uebersprungen'): «Gelöst», Kopfzeile und
   * Knöpfe gehen weg, der Blick hebt sich, darunter versinkt die Übung; der Satz zum Ende wartet auf Tippen, dann
   * tragen die Glühwürmchen das Licht in den Bergwald (Einstieg wie nach dem Prolog). Während einer Zwischenszene
   * wartet ein «Überspringen», bis sie fertig ist (done).
   */
  async dorfEnde(art) {
    if (!this.inDorf || this.choosing || !this.dorfLaeuft()) return;
    if (this.running) { this.endeWartet = true; return; }
    this.running = true;
    flow.state = 'story'; // die Übung dreht nicht mehr (auch mitten im Herauswachsen)
    this.fast = 1;
    ui.hideSolved();
    // gleich nach dem Lösen übersprungen: «Gelöst» käme sonst noch aus der Feier (panelDelay) über den Satz zum Ende
    if (celebration.active) celebration.panelShown = true;
    ui.hideHud();
    setHovered(null);
    setShown(ui.controls, false);
    this.stand.dorf.ende = art;
    this.inDorf = false;
    this.replay = false;
    this.save();
    if (this.gaze === 0) this.aimGaze(STORY_UP);
    const hoch = this.gazeTo(1, 1.8);
    await this.wait(0.6);
    this.present('caption', this.el.querySelector('.caption'), (el) => this.fillCaption(el,
      { kicker: STORY_DORF.title, text: STORY_DORF.ende, tap: IS_TOUCH ? 'Tippen' : 'Klicken' }));
    await hoch;
    const { index } = this.steps[this.step], sunk = this.sinkTo(index); // erst im Himmel: kein leeres Brett
    // der Himmel des Bergwalds kommt schon, während der Satz steht («Am Waldrand blinken schon …»): Nach dem Tippen
    // wartet der Einstieg dann nicht mehr auf ihn (Review Ticket 07)
    const wald = this.skyOf(STORY_CHAPTERS[0]);
    await this.untilTap();
    this.el.querySelector('.caption .tap').textContent = ''; // getippt: die Aufforderung geht sofort
    await wald;
    await leistung.waehrend('einstieg', this.enter(index, STORY_CHAPTERS[0], sunk));
    this.done();
  },
  /** Ende einer Welt (1–5): Die Strahlen steigen zu ihrem Stern, er erwacht, dann die Reise in die nächste. */
  async chapterEnd(next) {
    const c = this.steps[this.step - 1].c, from = STORY_CHAPTERS[c], ch = STORY_CHAPTERS[next.c];
    // der Stern erwacht schon dort, wo er gleich über dem Untertitel der Reise steht (Abnahme Ticket 11): Danach
    // verschiebt sich das Bild nicht mehr
    await this.ascend(c + 1, { ende: (p) => this.blickAuf(p, this.lichtFuer(this.ankunft(ch))) });
    await this.travel(from, STORY_CHAPTERS[next.c], next.index);
    this.running = false;
  },
  /**
   * Wiederholen über die Grenze einer Welt (Entscheid 16): Nur der Himmel blendet, ohne Träger, Untertitel und Blick
   * in den Himmel. Das alte Level bleibt stehen (dreht nicht mehr), bis der Himmel der neuen Welt samt Brett geladen
   * ist (settled, höchstens 8 s; nicht ready: das scharfe Bild und die Streifen kommen mit quiet erst danach), dann
   * versinkt es, und das neue wächst, während der Himmel überblendet: langsamer als sonst, zwischen zwei Welten auf der
   * Erde über die Farben beider wie auf der Reise (blendSky). Das Brett gleitet dabei mit dem Himmel ins neue.
   */
  async replayWorld(next) {
    this.running = true;
    flow.state = 'story';
    this.fast = 1; // wie ascend: ein Tippen vorher (Enter beim Herauswachsen) verkürzt das Warten auf den Himmel nicht
    ui.hideSolved();
    ui.hideHud();
    setHovered(null);
    const fadeTime = skyTheme.fadeTime, old = skyTheme.current;
    skyTheme.quiet = true; // grosse Texturen erst, wenn das Level steht (wie nach der Reise)
    skyTheme.fadeTime = 2.4;
    this.setSky(STORY_CHAPTERS[next.c].sky, true);
    this.himmelStand(); // der Stern der neuen Welt; der Wagen bleibt stehen
    const earth = (id) => skyTheme.byId.get(id)?.sky.rings;
    this.blend = earth(old) && earth(skyTheme.current) ? { from: old, to: skyTheme.current } : null;
    for (let t = 0; !skyTheme.settled && t < 8; t += 0.1) await this.wait(0.1); // Himmel und Brett der neuen Welt
    await this.sinkTo(next.index);
    enterLevel(next.index);
    for (let t = 0; skyTheme.fading && t < 8; t += 0.1) await this.wait(0.1);
    skyTheme.fadeTime = fadeTime;
    this.blend = null;
    this.running = false;
    this.wait(1.2).then(() => { skyTheme.quiet = false; });
  },
  /**
   * Zwischen zwei Welten, ohne Schnitt: Ein Träger (Glühwürmchen, Gischt, Sand, Glut, Komet) nimmt den Lichtpunkt beim
   * eben geweckten Stern, er fliegt in einem Bogen am nächsten, noch schlafenden Stern vorbei (der kurz aufzuckt, zucke)
   * und hinab, und die Kamera folgt ihm (Ticket 05 von .scratch/kleiner-wagen/; STORY_FLUG). Die neue Welt lädt schon
   * beim Abflug; sobald sie da ist, blendet die alte über einen kurzen Moment Nacht in sie hinein, der Wagen bleibt
   * stehen. Unbemerkt versinkt darunter das alte Feld. In der Mitte steht dazu, wohin die Reise geht, die Leiste am
   * Rand; darüber steht das Licht (lichtHoch). Am Ende des Bogens hält es dort an und wartet auf Tippen (anhalten,
   * Abnahme Ticket 11), dann fällt es aufs neue Brett.
   */
  async travel(from, ch, index) {
    const fl = this.flare, carrier = this.carrier, n = STORY_CHAPTERS.indexOf(ch) + 1, F = STORY_FLUG;
    carrier.start(from.carrier, fl.position);
    this.present('caption', this.el.querySelector('.caption'), (el) => this.fillCaption(el, this.ankunft(ch)));
    // Der geweckte Stern ist Stern n − 1, der nächste Stern n (der der neuen Welt). Das Licht bleibt bei ihm, während
    // der Träger es aufnimmt; es steht schon über dem Untertitel (der Blick des Aufstiegs, chapterEnd)
    const dist = fl.position.distanceTo(camera.position), stern = himmelsWagen.richtung(n - 1);
    const place = (el, az) => fl.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
      .multiplyScalar(dist).add(camera.position);
    let hoch = this.lichtHoch();
    this.tween(0.9, (k) => {
      carrier.strength = k;
      for (const b of this.beams) b.material.uniforms.uStrength.value = 1 - k;
    });
    await this.tween(1.0, () => {
      hoch = this.lichtHoch();
      fl.position.copy(camera.position).addScaledVector(stern, dist);
      carrier.orb.copy(fl.position);
      this.look(fl.position, hoch);
    });
    this.endAscent();
    const sunk = this.sinkTo(index);
    // Langsamer als ein gewöhnlicher Wechsel des Hintergrunds: erst aus, dann ein, je 1,5 s. Die alte Welt bleibt, bis
    // die neue geladen ist (skyTheme.update). Zwischen zwei Welten auf der Erde gleitet der Himmel dazwischen über die
    // Farben beider (blendSky) statt über die Nacht; ins Sonnensystem und zu den Sternen geht es durch die Nacht.
    const fadeTime = skyTheme.fadeTime, old = skyTheme.current;
    skyTheme.fadeTime = 3;
    skyTheme.quiet = true; // scharfes Bild und Streifen der neuen Welt erst nach der Landung (jeder Ruck fiele auf)
    this.setSky(ch.sky, true);
    const earth = (id) => skyTheme.byId.get(id)?.sky.rings;
    this.blend = earth(old) && earth(skyTheme.current) ? { from: old, to: skyTheme.current } : null;
    // Lädt die neue Welt noch (Himmel oder Brett), sammelt der Träger das Licht weiter, in einem kleinen Kreis um den
    // geweckten Stern (höchstens 8 s): Hochladen und Übersetzen halten den Grafikprozess kurz an, und ein Ruck fiele im Flug auf
    const [azS, elS] = this.winkel(stern), kreis = THREE.MathUtils.degToRad(F.schweben);
    // seitwärts in die Richtung, in der der nächste Stern liegt (keine Kehre); liegt er fast darunter, abwechselnd
    const quer = this.vorbeiAn(n, azS)[0] - azS, side = Math.abs(quer) > 0.02 ? Math.sign(quer) : n % 2 ? 1 : -1;
    let az0 = azS, el0 = elS, phase = 0;
    for (let t = 0; !skyTheme.settled && t < 8; t += 0.1) {
      await this.tween(0.1, (k) => {
        const p = phase + k * 0.12, r = kreis * Math.min(1, (t + k * 0.1) / 1.5);
        az0 = azS + side * r * Math.sin(p) / Math.cos(elS);
        el0 = elS + r * (1 - Math.cos(p)) * 0.6;
        place(el0, az0);
        carrier.orb.copy(fl.position);
        this.look(fl.position, hoch);
      }, storyLinear);
      phase += 0.12;
    }
    // Bogen vom geweckten Stern am nächsten vorbei und hinab, seitwärts weiter in seine Richtung, am Ende so hoch,
    // wie man in der neuen Welt hinaufschaut
    const vorbei = this.vorbeiAn(n, az0), ende = [vorbei[0] + side * F.reise.seitwaerts,
      Math.min(1.15, (ch.up ?? STORY_UP) + 0.1)];
    const weg = this.bogen([az0, el0], vorbei, ende, F.reise.amStern);
    let gezuckt = false;
    await this.tween(F.reise.dauer, (k) => {
      const [az, el] = weg(k);
      place(el, az);
      carrier.orb.copy(fl.position);
      this.look(fl.position, hoch);
      if (!gezuckt && k >= F.reise.amStern) { gezuckt = true; this.zucke(n, true); }
    });
    if (!gezuckt) this.zucke(n, true);
    await this.anhalten(); // über dem Untertitel, bis der Spieler tippt (inzwischen versinkt das alte Feld)
    await sunk;
    // blendet die neue Welt noch ein, schwebt das Licht weiter (höchstens 8 s)
    let [az, el1] = ende;
    for (let t = 0; skyTheme.fading && t < 8; t += 0.1) {
      await this.tween(0.1, (k) => {
        place(el1, az + side * 0.03 * k);
        carrier.orb.copy(fl.position);
        this.look(fl.position, hoch);
      }, storyLinear);
      az += side * 0.03;
    }
    await this.fall(index, fl.position.clone());
    skyTheme.fadeTime = fadeTime; // erst jetzt: sonst blendete der Rest der neuen Welt plötzlich schneller ein
    this.blend = null;
    this.wait(1.2).then(() => { skyTheme.quiet = false; }); // erst, wenn das Level steht
  },
  /**
   * Himmel zwischen zwei Welten auf der Erde, nach skyTheme.update: Die Panoramen blenden durchsichtig über der
   * Himmelskugel (skyTheme zeigt immer nur eines zugleich). Dazwischen zeigte die Kugel den leeren Weltraum; hier zeigt
   * sie stattdessen den Farbverlauf beider Welten (sky.rings), der während des ganzen Überblendens von der alten zur
   * neuen gleitet. Die Vorschau eines Panoramas auf der Kugel (uPreview) blendet mit ihm aus und ein, die Sterne gehen
   * von der alten zur neuen Helligkeit.
   */
  blendSky() {
    const { from, to } = this.blend, a = skyTheme.byId.get(from).sky, b = skyTheme.byId.get(to).sky;
    const wa = skyTheme.weight[from], wb = skyTheme.weight[to], smooth = (w) => w * w * (3 - 2 * w);
    const p = wa > 0 ? 0.5 * (1 - wa) : 0.5 + 0.5 * wb; // 0 … 1 über das ganze Überblenden
    const bg = background.material.uniforms, su = stars.material.uniforms;
    bg.uPano.value = 1;
    bg.uRings.value.forEach((c, i) => c.fromArray(a.rings[i]).lerp(_storyDir.fromArray(b.rings[i]), p));
    bg.uPreviewOn.value = Math.min(bg.uPreviewOn.value, smooth(Math.max(wa, wb)));
    su.uFade.value = a.stars + (b.stars - a.stars) * p;
    su.uHorizon.value = (a.starsAboveHorizon ? 1 : 0) + ((b.starsAboveHorizon ? 1 : 0) - (a.starsAboveHorizon ? 1 : 0)) * p;
    su.uFrom.value = starsFromSin(a) + (starsFromSin(b) - starsFromSin(a)) * p;
  },
  /**
   * Ende der letzten Welt (Ticket 06 von .scratch/kleiner-wagen/, STORY_PULS): Die Strahlen steigen zum sechsten Stern,
   * er erwacht. Satz 1: Der Blick geht zum ganzen Wagen, ein Lichtpuls läuft Stern für Stern durch ihn (puls). Satz 2:
   * Er springt über die Deichsel, der Polarstern flammt auf (deichsel). Satz 3, dann antwortet der Polarstern: Sein
   * Strahl fällt zurück aufs Brett, die Kamera folgt ihm. Der Aufprall klingt aus (Lichtwelle, Funkenregen, die Ziele
   * blitzen), dann geht der Blick noch einmal hinauf, bis der ganze Wagen dort im Bild steht, wo die Bühne ihn zeigt
   * (wagenEnde, wenn nötig mit weiterem Sichtfeld), und während die Welt in der Nacht versinkt, taucht das Dorf auf, in
   * dem Noa wartet (Epilog; Wagen in Wagen, Ticket 07).
   */
  async finale() {
    const P = STORY_PULS, fl = this.flare, sechster = this.steps[this.step].c + 1;
    // er erwacht schon im Blick auf den ganzen Wagen, wie ihn Satz 1 zeigt (Abnahme Ticket 11: kein Nachschieben),
    // und die Strahlen laufen aus, sobald er wach ist (Abnahme Ticket 12: in ihn hinein, nicht abrupt)
    const oben = this.captionVorab({ text: STORY_FINALE[0], tap: IS_TOUCH ? 'Tippen' : 'Klicken' }).cap;
    await this.ascend(sechster, { ende: () => this.wagenBlick(oben / innerHeight), aus: true });
    // Satz 1: Das Licht geht im sechsten Stern auf, der Blick gleitet zum ganzen Wagen über dem Untertitel
    this.amStern = sechster;
    await this.caption(STORY_FINALE[0], (cap) => {
      const von = this.gazeDir.clone(), blick = this.wagenBlick(cap.getBoundingClientRect().top / innerHeight);
      this.tween(P.blick, (x) => { this.gazeDir.copy(von).lerp(blick, x).normalize(); });
      const hell = fl.material.opacity;
      this.tween(0.8, (x) => { fl.material.opacity = hell * (1 - x); fl.visible = x < 1; });
      return this.puls();
    });
    // Satz 2: über die Deichsel zum Polarstern
    await this.caption(STORY_FINALE[1], () => this.deichsel());
    // Satz 3: Alles steht still, jetzt fällt ein langes Bild nicht auf (die Bühne wird vorgezeichnet)
    await this.caption(STORY_FINALE[2], () => this.prewarmScene(STORY_EPILOG));
    const cap = this.el.querySelector('.caption');
    cap.classList.add('swap');
    await storySleep(350);
    this.open('veil');
    cap.classList.remove('swap');
    this.fast = 1;
    const star = fl.position.clone(), hit = new THREE.Vector3(0, BEAM_Y, 0), blick = this.gazeDir.clone();
    this.aim(this.answer, star, hit, WHITE);
    audio.hit(7, 0, { octave: 2, gain: 0.06 });
    audio.hit(7, 0.3, { gain: 0.05 });
    // der Strahl fällt immer schneller aus dem Bild, das gerade steht (Abnahme Ticket 11: kein Blick zum Polarstern
    // davor); erst wenn seine Spitze tief unter die Mitte kommt, folgt ihr die Kamera bis aufs Brett (antwortBlick)
    const folge = this.antwortBlick(blick), A = P.antwort;
    // weicher Aufprall (Abnahme Ticket 12): Das Brett glüht unter der Spitze schon auf, bevor sie ankommt (Lichtwelle
    // mit Halbmesser 0)
    shockUniforms.uShockColor.value.copy(WHITE).multiplyScalar(0.6);
    const glut = (u) => A.glut * THREE.MathUtils.smoothstep(u, 1 - A.vorglut, 1) ** 2;
    await this.tween(2.4, (k) => {
      const u = k * k;
      this.answer.material.uniforms.uHead.value = u;
      folge(_storyHead.copy(star).lerp(hit, u));
      this.gaze = 1 - THREE.MathUtils.smoothstep(k, 0.8, 1);
      shockUniforms.uShock.value.set(0, glut(u), CELEBRATE.shockWidth);
    }, storyLinear);
    this.endAscent();
    this.shock(WHITE, { von: glut(1), anstieg: A.anstieg });
    this.pulse(A.anstieg);
    audio.chord([1, 2, 4, 7], 0);
    celebration.rain.burst([7, 7, 4, 2, 1]);
    for (const obj of game.targets) obj.userData.flash = 1;
    this.wait(A.ab).then(() => this.auslaufen([this.answer], A.aus, storyAuslauf)); // der Strahl läuft ins Brett aus
    await this.wait(2.6);
    // Blick hinauf, bis der ganze Wagen dort steht, wo ihn gleich das gezeichnete Dorf zeigt (Wagen in Wagen,
    // wagenEnde; hat er dort weniger Platz, schaut die Kamera dabei weiter); der Lichtpunkt auf dem Polarstern wird so
    // gross wie der gezeichnete Stern
    const ende = this.wagenEnde(), fov0 = camera.fov, size = fl.scale.x, rad = THREE.MathUtils.degToRad;
    const weiter = Math.tan(rad(ende.fov / 2)) / Math.tan(rad(fov0 / 2));
    this.tween(3.4, (k) => {
      this.gazeDir.copy(ende.blick);
      this.gaze = k;
      this.seit = ende.seit * k;
      this.sichtfeld(fov0 + (ende.fov - fov0) * k);
      fl.scale.setScalar(size + (4.5 * weiter - size) * k);
    });
    await this.wait(3.2);
    await this.ending(true);
  },
  /**
   * Nach dem letzten Level: Der Grad ist geschafft, Epilog im Dorf. soft: langsam überblenden (Finale). «Zum Menü»
   * führt ohne Neuladen ins Menü (afterEpilog; Entscheid 14).
   */
  async ending(soft = false) {
    this.running = true;
    flow.state = 'story';
    ui.hideSolved();
    ui.hideHud();
    this.stand.geschafft = true;
    this.save();
    this.himmelStand(); // der ganze Wagen (dahinter, für das Menü nach dem Epilog)
    await this.playScene(STORY_EPILOG, { soft, actions: [['Zum Menü', () => this.afterEpilog()]] });
  },
  /**
   * Prolog oder Epilog auf der Bühne: je Einstellung eine Kamerafahrt mit einem Satz, weiter mit Tippen. Tippen
   * während einer Fahrt macht sie schneller. actions: Knöpfe nach der letzten Einstellung (Epilog), die Bühne bleibt
   * dann stehen; sonst blendet sie aus. angebot: nach dem Tippen auf die letzte Einstellung oder dem Überspringen das
   * Angebot (offer), danach blendet sie aus; zurück die Wahl (true: «Üben»), sonst false.
   */
  async playScene(shots, { skippable = false, actions = null, soft = false, angebot = false } = {}) {
    const sc = this.scene ??= this.makeScene();
    sc.reset(shots[0], shots);
    // eine bis hier gehaltene Bühne (vorwaermen) zeigt sich jetzt, schon gerastert, und blendet wie sonst aus 0 ein
    // (vor dem Wegnehmen von prewarm: bis open gilt sonst kein Modus, und die Ebenen fielen weg)
    if (this.buehneWarm) {
      this.el.style.transition = 'none';
      this.el.classList.remove('gehalten');
      void this.el.offsetWidth;
      this.el.style.transition = '';
      this.buehneWarm = false;
    }
    sc.el.classList.remove('prewarm');
    this.stillBild = false;
    sc.skip.hidden = !skippable;
    this.skipped = false;
    // soft: Die Welt dahinter versinkt langsam in der Nacht, während die Bühne einblendet (CSS #story.slow); erst
    // danach ist sie ganz verdeckt
    this.el.classList.toggle('slow', soft);
    this.open('scene');
    sc.show();
    if (soft) {
      await this.wait(1.9);
      this.el.classList.remove('slow');
      for (const o of [this.answer, this.flare]) o.visible = false;
      this.amStern = null;
      this.sichtfeld(); // das Finale schaute am Ende weiter und seitlich gedreht (wagenEnde)
      this.seit = 0;
    }
    this.covered = true;
    for (const shot of shots) {
      if (this.skipped) break;
      if (sc.gl) await sc.gl.bereit(shots.indexOf(shot)); // WebGL: Texturen der Fahrt fertig (meist schon im Ruhepunkt)
      // vor dem letzten Satz des Epilogs schon der Platz für «Zum Menü» (er rückt dann nicht mehr, Abnahme Ticket 12)
      if (actions && shot === shots.at(-1)) sc.say(shot.text, { umbau: () => sc.platzFuer(actions) });
      else sc.say(shot.text);
      sc.hint(false);
      if (shot.act) sc.act(shot.act);
      await sc.moveTo(shot);
      if (this.skipped) break;
      // (war die Fahrt kürzer als das Ausblenden des vorigen Satzes, jetzt gleich umbauen: sonst nähme der Umbau die
      // Knöpfe danach wieder weg)
      if (actions && shot === shots.at(-1)) { sc.umbauLos?.(); sc.actions(actions); return; }
      // nach einem Neuladen (letztes Bild ohne Satz) gleich das Angebot, sonst erst nach dem Tippen wie jedes Bild
      if (angebot && shot === shots.at(-1) && !shot.text) break;
      sc.hint(true);
      // ruhige Stelle: hier darf geladen und die Szene dahinter gezeichnet werden (ruhe), aber erst, wenn die Bühne die
      // Linien gestaffelt neu gerastert hat (ruheNachHalt; sonst raste beides zugleich)
      this.stillBild = true;
      this.stillAb = performance.now() + sc.ruheNachHalt;
      setTimeout(() => sceneLoop.wake(), sc.ruheNachHalt + 20);
      // was die nächste Einstellung beim Tippen neu rastern liesse, jetzt (sc.vorbereiten)
      // (nur in diesem Ruhepunkt: schnell getippt, könnte schon der nächste stehen)
      const hier = shots.indexOf(shot), naechste = shots[hier + 1];
      this.ladeSperre = ['gather', 'carry'].includes(naechste?.act);
      if (naechste) setTimeout(() => { if (this.stillBild && sc.running && sc.fahrtIndex === hier) { sc.vorSagen(naechste.text); if (naechste.act) sc.vorbereiten(naechste.act); } }, sc.ruheNachHalt);
      await this.untilTap();
      this.stillBild = false;
    }
    sc.skip.hidden = true; // Escape wirkt nur im Prolog (sonst ginge damit später eine Karte weiter)
    const ueben = angebot ? await this.offer(sc) : false;
    sc.say('');
    sc.kicker('');
    sc.hint(false);
    await sc.hide();
    this.covered = false;
    return ueben;
  },
  /**
   * Vorwärmen der Bühne für den Prolog: Unter dem Startbildschirm die Bühne einmal unsichtbar zeichnen (erste
   * Einstellung des Prologs, die Folge schon angelegt), zwei Bilder lang: Ihr erstes Zeichnen hielt den Prolog bis
   * 250 ms an (Review Ticket 05), danach nicht mehr. #story ist dabei da, aber leer und nicht bedienbar (inert). Nur,
   * solange die Geschichte nichts zeigt; danach ruht die Bühne wieder (createStoryScene, ruhen). halten (neue Spieler,
   * Ticket 03 der Leistung): Sie bleibt fast durchsichtig stehen und damit gerastert, bis der Prolog sie zeigt (sonst
   * rasterte sein erstes Bild sie neu, 90–130 ms) oder feststeht, dass keiner kommt (buehneFrei). Zurück: ein Promise,
   * erfüllt, sobald das Vorwärmen gezeichnet ist.
   */
  vorwaermen(halten = false) {
    if (!this.el.classList.contains('hidden')) return Promise.resolve();
    const sc = this.scene ??= this.makeScene();
    if (sc.el.classList.contains('prewarm')) return Promise.resolve();
    this.prewarmScene(STORY_PROLOG);
    this.el.classList.add('gehalten'); // da, obwohl hidden (CSS): Wer «hidden» prüft, sieht weiter keine Bühne
    this.buehneWarm = true;
    return new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!halten) this.buehneFrei();
      requestAnimationFrame(() => fertig());
    })));
  },
  /** Die vorgewärmte Bühne ausblenden und ruhen lassen (vorwaermen; als Nächstes kommt kein Prolog). */
  buehneFrei() {
    if (!this.buehneWarm) return;
    this.buehneWarm = false;
    this.el.classList.remove('gehalten');
    if (this.el.inert) this.scene.ruhen(); // sonst inzwischen geöffnet (open): Das zeigt die Bühne selbst
  },
  /**
   * Die Bühne einmal unsichtbar zeichnen lassen (erste Einstellung der Folge shots, die Folge schon angelegt), bevor sie gebraucht
   * wird: Das erste Zeichnen der grossen Szene dauerte über 100 ms. playScene nimmt die Klasse wieder weg.
   */
  prewarmScene(shots) {
    const sc = this.scene ??= this.makeScene();
    sc.vorwaermen(shots[0], shots);
  },
  makeScene() {
    // der Wagen am Himmel der Bühne steht, wo ihn das Finale am Ende zeigt (Wagen in Wagen)
    const sc = createStoryScene(this.el, { wagenLage: () => this.wagenEnde().sterne });
    sc.skip.hidden = true; // nur im Prolog (playScene); sonst hielte skip ihn nach einem Neuladen für offen
    sc.skip.addEventListener('click', (e) => { e.stopPropagation(); this.skipProlog(); });
    return sc;
  },
  /** Prolog überspringen: laufende Fahrt sofort zu Ende, keine weiteren Einstellungen. */
  skipProlog() {
    if (!this.scene || this.scene.skip.hidden) return;
    this.skipped = true;
    this.scene.speed = 60;
    this.tap();
  },

  /* ---------- Zwischenszenen ---------- */

  /** Blickrichtung in den Himmel: geradeaus über das Brett hinweg, elevation (rad) über dem Horizont. */
  aimGaze(elevation) {
    const f = _gazeLook.copy(cameraRig.target).sub(camera.position).setY(0).normalize();
    this.gazeDir.copy(f).multiplyScalar(Math.cos(elevation)).setY(Math.sin(elevation)).normalize();
  },
  /**
   * Die Strahlen der Ziele steigen zu einem Lichtpunkt am Himmel, die Kamera schaut ihnen nach; der Punkt blitzt auf,
   * wenn sie ankommen. stern: Nummer des Sterns dieser Welt (Ende einer Welt, Ticket 05 von .scratch/kleiner-wagen/; im
   * Finale der sechste, Ticket 06): Der Lichtpunkt steht dort, wo er am Himmel steht (himmelsWagen.richtung; beim
   * Vulkan hoch über dem Rand), und er erwacht, sobald die Strahlen ankommen (erwache). Reise und Finale beginnen hier:
   * Die Knöpfe gehen weg, «Menü» und «Neu starten» wirken dort nicht (Review Ticket 05); sie kommen mit dem nächsten
   * Level wieder (fall, begin).
   * ende(punkt): Blickrichtung, in der die Kamera ankommt (Abnahme Ticket 11): Der Stern steht beim Erwachen schon
   * dort, wo ihn der folgende Untertitel braucht (Reise: über ihm, lichtFuer; Finale: der ganze Wagen, wagenBlick); auf
   * dem Weg hinauf gleitet der Blick von der Spitze der Strahlen dorthin. Ohne: genau auf den Stern. aus: Die Strahlen
   * laufen aus, sobald er wach ist (auslaufen; Finale; am Ende einer Welt nimmt sie der Träger, travel).
   */
  async ascend(stern, { ende = null, aus = false } = {}) {
    this.running = true;
    flow.state = 'story';
    this.fast = 1;
    ui.hideSolved();
    ui.hideHud();
    setShown(ui.controls, false);
    setHovered(null);
    adaptiveResolution.hold(6);
    this.open('veil');
    himmelsWagen.richtung(stern, this.gazeDir);
    const ziel = this.gazeDir.clone(), dist = 72;
    const fl = this.flare, point = fl.position.copy(camera.position).addScaledVector(ziel, dist);
    const schluss = ende ? ende(point.clone()) : null;
    fl.visible = true;
    fl.material.opacity = 0;
    fl.scale.setScalar(1);
    const targets = game.targets.slice(0, this.beams.length);
    const colors = targets.map((o) => o.userData.element.color);
    const from = targets.map((o) => o.userData.gem.getWorldPosition(new THREE.Vector3()));
    const middle = from.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, from.length));
    const rise = 2.0, step = 0.14;
    targets.forEach((obj, i) => {
      const b = this.beams[i];
      this.aim(b, from[i], point, COLOR_RGB[colors[i]]);
      audio.hit(colors[i], 0.15 + i * step, { octave: 2, gain: 0.045 });
      this.tween(rise, (k) => { b.material.uniforms.uHead.value = k; }, storyEase, 0.15 + i * step);
    });
    // die Kamera folgt der Spitze der mittleren Strahlen hinauf (am Anfang weich vom Brett weg) und kommt in schluss an
    this.tween(rise, (k) => {
      this.look(_storyHead.copy(middle).lerp(point, storyEase(k)));
      if (schluss) this.gazeDir.lerp(schluss, storyEase(k)).normalize();
      this.gaze = THREE.MathUtils.smoothstep(k, 0, 0.3);
    }, storyLinear, 0.15 + (targets.length - 1) * step / 2);
    await this.wait(0.15 + (targets.length - 1) * step + rise);
    // Ankunft am Himmel
    audio.chord(colors, 0);
    this.pulse();
    this.erwache(stern);
    if (aus) this.auslaufen(this.beams.filter((b) => b.visible)).then(() => this.endAscent());
    await this.tween(1.3, (k) => {
      // am Stern: Er steht in der Richtung von der Kamera aus, die sich leise bewegt (sonst wanderte das Licht von ihm weg)
      fl.position.copy(camera.position).addScaledVector(ziel, dist);
      const burst = k < 0.15 ? k / 0.15 : Math.exp(-(k - 0.15) * 3);
      fl.material.opacity = Math.min(1, k * 6);
      fl.scale.setScalar(5 + 9 * burst);
    }, storyLinear);
  },
  endAscent() {
    for (const b of this.beams) b.visible = false;
  },
  /**
   * Strahlen laufen aus (Abnahme Ticket 12: nicht abrupt weg): Ihr Ende rückt in dauer s zur Spitze (uTail mit
   * einem weichen Stück, makeBeam), auf dem Weg weg (Anteil der Länge über der Zeit), und in der zweiten Hälfte werden
   * sie dazu schwächer. Im Finale die Strahlen zum sechsten Stern ins Licht beim Stern (erst langsam, dann zügig, weich
   * ankommend) und der Strahl des Polarsterns ins Brett (zügig durch das ferne Stück, das im Bild kurz ist, dann immer
   * langsamer durch das nahe; storyAuslauf). Zurück: erfüllt, wenn nichts mehr leuchtet (sichtbar bleiben sie;
   * wegnehmen wie endAscent).
   */
  auslaufen(strahlen, dauer = STORY_PULS.auslaufen, weg = storyEase) {
    return this.tween(dauer, (k) => {
      for (const b of strahlen) {
        b.material.uniforms.uTail.value = 1.2 * weg(k);
        b.material.uniforms.uStrength.value = 1 - THREE.MathUtils.smoothstep(k, 0.5, 1);
      }
    }, storyLinear);
  },
  /**
   * Blick in den Himmel auf einen Punkt richten (gaze bestimmt, wie weit). hoch: der Punkt steht so weit über der Mitte
   * des Bilds (Anteil der halben Bildhöhe, lichtHoch), der Blick also etwas tiefer.
   */
  look(point, hoch = 0) { this.blickAuf(point, hoch, this.gazeDir); },
  /**
   * Die Kamera gleich in Richtung d drehen (wie updateCamera mit gaze 1 im nächsten Bild), damit dieses Bild so
   * gezeichnet wird, wie fall den Lichtpunkt ins Bild rechnet (sonst hinkte der Blick ein Bild nach).
   */
  kameraNach(d) {
    camera.lookAt(_gazeLook.copy(camera.position).add(d));
    camera.updateMatrixWorld();
  },
  /** Die Blickrichtung von look, ohne den Blick zu setzen (in d). */
  blickAuf(point, hoch = 0, d = new THREE.Vector3()) {
    d.copy(point).sub(camera.position).normalize();
    if (!hoch) return d;
    const el = Math.asin(d.y) - Math.atan(hoch * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const waag = Math.hypot(d.x, d.z) || 1;
    return d.set(d.x / waag * Math.cos(el), Math.sin(el), d.z / waag * Math.cos(el));
  },
  /**
   * Antwort des Polarsterns (Finale; Abnahme Ticket 11): Die Kamera bleibt im Blick blick, solange die Spitze seines
   * Strahls nicht weiter als frei (Anteil der halben Bildhöhe) unter die Mitte fällt; dann senkt sie sich weich mit
   * ihr, die Spitze bleibt höchstens tief unter der Mitte. Zurück eine Funktion, die zur Spitze (Punkt) den Blick
   * setzt.
   */
  antwortBlick(blick, frei = 0.5, tief = 0.75) {
    const [azB, elB] = this.winkel(blick), halb = THREE.MathUtils.degToRad(camera.fov / 2);
    const a = frei * halb, r = (tief - frei) * halb, d = new THREE.Vector3();
    return (spitze) => {
      const [azH, elH] = this.winkel(d.copy(spitze).sub(camera.position).normalize(), azB);
      const x = elB - elH - a; // so weit ist die Spitze unter der freien Zone
      const senken = x <= 0 ? 0 : x - r * (1 - Math.exp(-x / r)); // stetig und ohne Ruck in der Neigung
      const w = senken > 0 ? senken / (elB - elH) : 0, az = azB + (azH - azB) * w, el = elB - senken;
      this.gazeDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    };
  },
  /**
   * Stern k des Kleinen Wagens erwacht (Ende einer Welt, sobald die Strahlen ihn erreichen; Ticket 05 von
   * .scratch/kleiner-wagen/): Der Wagen am Himmel zeigt ab jetzt den neuen Stand, der Stern blitzt auf und bleibt hell,
   * die neuen Linien ziehen sich nacheinander vom vorigen Stern zu ihm (mit Stern 4 danach 4 → 1, die Schale schliesst
   * sich), sein Glockenton klingt. Der Stern dieser Welt bleibt er, bis das Licht am nächsten vorbeizieht (zucke).
   */
  erwache(k) {
    const H = himmelsWagen, F = STORY_FLUG, n = wagen.form.length, vorher = H.stand.linien.map((l) => l.join());
    H.zeige(this.wagenStand(), k);
    const neu = wagen.linien.map((l, i) => i).filter((i) => H.stand.linien.some((l) => l.join() === wagen.linien[i].join())
      && !vorher.includes(wagen.linien[i].join()));
    audio.stern(k, 0.1);
    this.tween(F.blitz, (x) => { H.glanz[k - 1] = x >= 1 ? 0 : x < 0.08 ? x / 0.08 : Math.exp(-(x - 0.08) * 4); },
      storyLinear);
    neu.forEach((i, j) => {
      H.anteil[i] = 0;
      H.glanz[n + i] = 1;
      const zug = F.linie + F.nach;
      this.tween(zug, (x) => {
        const t = x * zug;
        H.anteil[i] = storyEase(Math.min(1, t / F.linie));
        H.glanz[n + i] = t <= F.linie ? 1 : 1 - THREE.MathUtils.smoothstep(t, F.linie, zug);
      }, storyLinear, 0.2 + j * F.linie * 0.85);
    });
  },
  /**
   * Das Licht zieht am schlafenden Stern k vorbei (Reise, Einstieg): Er zuckt kurz auf und wird wieder blass. weiter: ab
   * jetzt ist er der Stern dieser Welt (Reise: der Stern der neuen Welt, himmelStand).
   */
  zucke(k, weiter = false) {
    const H = himmelsWagen;
    if (weiter) this.himmelStand();
    this.tween(STORY_FLUG.zucken, (x) => {
      H.glanz[k - 1] = x >= 1 ? 0 : x < 0.1 ? 0.75 * x / 0.1 : 0.75 * Math.exp(-(x - 0.1) * 5);
    }, storyLinear);
  },
  /**
   * Blick, in dem der ganze Kleine Wagen am Himmel im Bild steht (Finale, Ticket 06 von .scratch/kleiner-wagen/), mit
   * STORY_PULS.rand Platz zu den Rändern; unten: so weit hinab (Anteil der Bildhöhe von oben) reicht der freie Platz
   * (über dem Untertitel). Waagrecht steht der Wagen immer in der Mitte: Er steht hoch am Himmel, und die Kamera hält
   * den Horizont waagrecht (updateCamera), seitlich davon stünde er schräg (bei 60° Höhe für ein Viertel der Bildbreite
   * gut 20° gedreht); senkrecht mitten im freien Platz. feld (Ende des Finales, wagenEnde): statt dessen genau zwischen
   * oben und unten (Anteile der Höhe), mit dem Sichtfeld fov (Grad) und der Kamera um seit (rad) um ihre Hochachse
   * gedreht (wagenEnde). Gerechnet mit einer Kopie der Kamera an ihrem Ort (wagenKamera), in wenigen Schritten (die
   * Projektion ist nicht linear). Zurück die Blickrichtung (für gazeDir).
   */
  wagenBlick(unten = 1, feld = null) {
    const H = himmelsWagen, cam = this.wagenKamera(feld?.fov), seit = feld?.seit ?? 0;
    const Hb = innerHeight, r = STORY_PULS.rand * Math.min(innerWidth, Hb), y1 = 1 - 2 * (feld ? feld.oben : r / Hb);
    // Feld des Wagens im Bild (NDC, y nach oben)
    const y0 = Math.min(y1, 1 - 2 * (feld ? feld.unten : unten - r / Hb));
    const sterne = wagen.form.map((_, i) => H.richtung(i + 1, new THREE.Vector3()));
    const az = THREE.MathUtils.degToRad(HIMMELSWAGEN.azimut), p = new THREE.Vector3();
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    let el = Math.asin(sterne.reduce((a, d) => a.add(d), new THREE.Vector3()).normalize().y);
    const blick = () => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    for (let schritt = 0; schritt < 8; schritt++) {
      cam.lookAt(p.copy(cam.position).add(blick()));
      if (seit) cam.rotateY(seit);
      cam.updateMatrixWorld();
      const ys = sterne.map((d) => p.copy(cam.position).addScaledVector(d, H.mesh.material.uniforms.uAbstand.value)
        .project(cam).y);
      const ly = Math.min(...ys), hy = Math.max(...ys), dy = (y0 + y1 - ly - hy) / 2; // Verschiebung: mitten ins Feld
      if (Math.abs(dy) < 1e-4) break;
      el -= Math.atan(dy * tanV); // das Bild hinauf schieben: Die Kamera senkt sich
    }
    return blick();
  },
  /** Kopie der Kamera an ihrem Ort (wagenBlick, wagenImBild), mit dem Sichtfeld fov (Grad), sonst ihrem. */
  wagenKamera(fov = null) {
    const cam = (this._wagenKamera ??= camera.clone(false)).copy(camera, false);
    if (fov !== null && fov !== undefined) { cam.fov = fov; cam.updateProjectionMatrix(); }
    return cam;
  },
  /** Wo die sieben Sterne des Wagens am Himmel im Bild stehen, wenn die Kamera nach blick schaut (Sichtfeld fov, Grad;
   *  um seit rad um ihre Hochachse gedreht): Anteile [x, y] von oben links. */
  wagenImBild(blick, fov, seit = 0) {
    const H = himmelsWagen, cam = this.wagenKamera(fov), p = new THREE.Vector3(), d = new THREE.Vector3();
    cam.lookAt(p.copy(cam.position).add(blick));
    if (seit) cam.rotateY(seit);
    cam.updateMatrixWorld();
    return wagen.form.map((_, i) => {
      p.copy(cam.position).addScaledVector(H.richtung(i + 1, d), H.mesh.material.uniforms.uAbstand.value).project(cam);
      return [(p.x + 1) / 2, (1 - p.y) / 2];
    });
  },
  /**
   * Ende des Finales, Wagen in Wagen (Ticket 07 von .scratch/kleiner-wagen/): Blick und Sichtfeld der Kamera (fov,
   * Grad), in denen der ganze Wagen am Himmel dort steht, wo die Bühne Platz für ihn hat (scene.wagenFeld):
   * senkrecht mitten im Platz (wagenBlick), höchstens BUEHNENWAGEN.feld.hoehe des Platzes hoch und breite so breit,
   * waagrecht bei lage im Platz (Abnahme Ticket 11: weiter rechts, Noa leuchtet weniger steil). Ist er dafür mit dem
   * Sichtfeld des Spiels (kameraSichtfeld) zu gross, schaut die Kamera am Ende weiter. Seitlich der Mitte stünde er
   * schräg (wagenBlick): Darum dreht sich die Kamera dafür um ihre eigene Hochachse (seit, rad; updateCamera), dann
   * bleibt er aufrecht. Den Horizont, der sich dabei neigte, sieht man am Ende des Finales nicht (die Kamera schaut hoch
   * in den Himmel der Sterne). sterne: wo seine sieben Sterne dann im Bild stehen (Anteile von oben links); genau dort
   * legt die Bühne ihren Wagen hin (scene.wagenLegen), im ersten Bild des Epilogs.
   */
  wagenEnde() {
    const sc = this.scene ??= this.makeScene(), feld = sc.wagenFeld(), fov0 = kameraSichtfeld(camera.aspect);
    const B = BUEHNENWAGEN.feld, breit = feld.rechts - feld.links, rad = THREE.MathUtils.degToRad;
    const spanne = (sterne, k) => {
      const v = sterne.map((s) => s[k]);
      return [Math.min(...v), Math.max(...v)];
    };
    const masse = (sterne) => [0, 1].map((k) => ((a, b) => b - a)(...spanne(sterne, k)));
    const [b0, h0] = masse(this.wagenImBild(this.wagenBlick(1, { ...feld, fov: fov0 }), fov0));
    const platz = [B.breite * breit, B.hoehe * (feld.unten - feld.oben)];
    // so viel weiter: Der Wagen wird kleiner, wie tan(fov / 2) wächst (nie enger, höchstens dreimal so weit)
    const f = THREE.MathUtils.clamp(Math.max(b0 / platz[0], h0 / platz[1]), 1, 3) || 1;
    const fov = 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(rad(fov0 / 2)) * f));
    // waagrecht: die Kamera so weit um ihre Hochachse gedreht, dass die Mitte des Wagens bei lage im Platz steht (ein
    // paar Schritte, die Projektion ist nicht linear; senkrecht danach neu eingepasst)
    const tanH = Math.tan(rad(fov / 2)) * camera.aspect, ndc = (x) => Math.atan((2 * x - 1) * tanH);
    let seit = 0, blick = this.wagenBlick(1, { ...feld, fov }), sterne = this.wagenImBild(blick, fov);
    for (let schritt = 0; schritt < 4; schritt++) {
      const [x0, x1] = spanne(sterne, 0), ziel = feld.links + (x1 - x0) / 2 + B.lage * (breit - (x1 - x0));
      seit += ndc(ziel) - ndc((x0 + x1) / 2);
      blick = this.wagenBlick(1, { ...feld, fov, seit });
      sterne = this.wagenImBild(blick, fov, seit);
    }
    return { blick, fov, seit, sterne };
  },
  /** Sichtfeld der Kamera (Grad; ohne: wie sonst in diesem Format, kameraSichtfeld), am Ende des Finales weiter. */
  sichtfeld(fov = kameraSichtfeld(camera.aspect)) {
    if (camera.fov === fov) return;
    camera.fov = fov;
    camera.updateProjectionMatrix();
  },
  /**
   * Satz 1 des Finales (STORY_PULS.puls): Ein Lichtpuls läuft Stern für Stern durch den Wagen, in der Reihenfolge des
   * Erwachens (1 … 6), jeder Stern leuchtet mit seinem Glockenton auf und klingt nach; die Linie zum nächsten leuchtet,
   * solange der Puls auf ihr zu einem Stern läuft, mit allen Linien, die sich mit diesem Stern gezogen haben (an Stern 4
   * auch die der Schale, 4 → 1). Zurück ein Promise, erfüllt, wenn er verklungen ist.
   */
  puls() {
    const H = himmelsWagen, P = STORY_PULS.puls, n = wagen.form.length, z = wagen.polarstern - 2; // Stern 1 … z + 1
    const wege = Array.from({ length: z }, (_, i) => wagen.linien.map((l, j) => j)
      .filter((j) => Math.max(...wagen.linien[j]) === i + 2)); // je Schritt zu Stern i + 2 seine Linien
    const dauer = z * P.schritt + P.nach;
    let klang = 0;
    return this.tween(dauer, (x) => {
      const s = x * dauer / P.schritt; // so weit ist der Puls: bei Stern s + 1
      for (; klang <= z && klang <= s; klang++) audio.stern(klang + 1);
      for (let i = 0; i <= z; i++) {
        H.glanz[i] = x >= 1 || s < i ? 0 : P.glanz * Math.exp(-4 * (s - i) * P.schritt / P.nach);
      }
      wege.forEach((w, i) => {
        const g = x < 1 && s > i && s < i + 1 ? Math.sin(Math.PI * (s - i)) : 0;
        for (const j of w) H.glanz[n + j] = g;
      });
    }, storyLinear, P.ab);
  },
  /**
   * Satz 2 des Finales (STORY_PULS.deichsel): Der Puls springt vom sechsten Stern über die Deichsel, die Linie 6 → 7
   * zieht sich, dann flammt der Polarstern auf (er ist jetzt wach, der Lichtpunkt steht auf ihm) und setzt den
   * Schlusston. Zurück ein Promise, erfüllt, wenn er ruhig steht.
   */
  async deichsel() {
    const H = himmelsWagen, D = STORY_PULS.deichsel, fl = this.flare, n = wagen.form.length, k = wagen.polarstern;
    const i = wagen.linien.findIndex(([a, b]) => a === k - 1 && b === k), alle = wagen.linien.map((l) => [...l]);
    H.anteil[i] = 0; // die Linie zur Deichsel gibt es ab jetzt, sie zieht sich erst
    H.glanz[n + i] = 1;
    H.zeige({ wach: H.stand.wach, linien: alle }, H.stand.welt);
    await this.tween(D.zug, (x) => {
      H.anteil[i] = storyEase(x);
      H.glanz[k - 2] = 0.6 * (1 - x); // am Fuss der Deichsel springt er ab (die Strahlen sind schon aus, ascend)
    }, storyLinear, D.ab);
    // der Polarstern flammt auf
    H.zeige({ wach: wagen.form.map((_, j) => j + 1), linien: alle }, null);
    this.amStern = k;
    fl.visible = true;
    fl.material.opacity = 0;
    audio.stern(k);
    this.pulse();
    await this.tween(D.flamme, (x) => {
      const burst = x < 0.15 ? x / 0.15 : Math.exp(-(x - 0.15) * 3);
      fl.material.opacity = Math.min(1, x * 6);
      fl.scale.setScalar(6 + 9 * burst);
      H.glanz[k - 1] = x >= 1 ? 0 : burst;
      H.glanz[n + i] = x >= 1 ? 0 : 1 - x;
    }, storyLinear);
  },
  /**
   * Richtung von der Kamera aus als [Azimut, Höhe] (rad, wie place in travel und enter: x = sin az · cos el, z = cos az
   * · cos el), der Azimut nahe bei um (ohne Sprung über ±π: geradeaus liegt dort).
   */
  winkel(dir, um = null) {
    const az = Math.atan2(dir.x, dir.z), el = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
    return [um === null ? az : um + THREE.MathUtils.euclideanModulo(az - um + Math.PI, 2 * Math.PI) - Math.PI, el];
  },
  /**
   * Der Punkt neben Stern k, an dem das Licht vorbeizieht ([Azimut, Höhe] wie winkel): STORY_FLUG.vorbei Grad vom Stern
   * weg, nach aussen von der Mitte des Wagens.
   */
  vorbeiAn(k, um) {
    const H = himmelsWagen, mitte = new THREE.Vector3();
    for (let i = 1; i <= wagen.form.length; i++) mitte.add(H.richtung(i, _storyDir));
    const [az, el] = this.winkel(H.richtung(k, _storyDir), um), [maz, mel] = this.winkel(mitte.normalize(), um);
    const dx = (az - maz) * Math.cos(el), dy = el - mel, l = Math.hypot(dx, dy) || 1;
    const w = THREE.MathUtils.degToRad(STORY_FLUG.vorbei);
    return [az + dx / l * w / Math.cos(el), el + dy / l * w];
  },
  /**
   * Bogen am Himmel von p0 über p1 nach p2 (je [Azimut, Höhe]): eine quadratische Bézierkurve, die beim Anteil u durch p1
   * geht. Zurück eine Funktion des Anteils t (0 … 1) des Wegs.
   */
  bogen(p0, p1, p2, u) {
    const c = [0, 1].map((i) => (p1[i] - (1 - u) ** 2 * p0[i] - u * u * p2[i]) / (2 * u * (1 - u)));
    return (t) => [0, 1].map((i) => (1 - t) ** 2 * p0[i] + 2 * t * (1 - t) * c[i] + t * t * p2[i]);
  },
  /**
   * In eine Welt hinein ohne Reise davor (nach dem Prolog, beim Fortsetzen): Der Träger, der das Licht hierher bringt
   * (im ersten Kapitel die Glühwürmchen des Prologs, sonst der der Welt davor), fliegt mit ihm von der Seite heran, am
   * schlafenden Stern dieser Welt vorbei, der kurz aufzuckt (Ticket 05 von .scratch/kleiner-wagen/), und es fällt aufs
   * Brett; ins Dorf ohne Träger und ohne Stern, tief über dem Horizont. Dazu der Untertitel mit Kapitel und Leiste wie
   * auf der Reise; über ihm hält das Licht an, bis der Spieler tippt (anhalten, Abnahme Ticket 11), und fällt dann
   * gleichmässig aufs Brett. Bis der Himmel der Welt geladen ist, bleibt die Kamera, wo sie war (nach dem Menü im
   * Himmel der Welt davor); schaut sie schon in den Himmel, schwenkt sie weich zum Licht. sunk: ein altes Feld ist
   * versunken (begin).
   * wie: was der Welt ch sonst entnommen wird (Einstieg ins Dorf: STORY_DORF.einstieg, ohne Träger): kicker, text, path
   * (Station), traeger (STORY_CARRIERS oder null), moment (gesehen, sobald das Level wächst).
   * «Überspringen» oder Esc (Entscheid 10) bis dahin: weich landen (land), ohne Schnitt.
   */
  async enter(index, ch, sunk, wie = {}) {
    prepareLevel(index); // nach «Üben» ein anderes als in begin
    const c = STORY_CHAPTERS.indexOf(ch), fl = this.flare, carrier = this.carrier;
    const { kicker = `Kapitel ${c + 1} · ${ch.title}`, text = ch.travel, path = ch.station,
      traeger = c > 0 ? STORY_CHAPTERS[c - 1].carrier : 'glow', moment = storyChapterId(ch) } = wie;
    const e = this.entering = { skip: false };
    this.himmelStand(); // nach «Üben» das Dorf, nach dem Dorf der Bergwald
    this.fast = 1; // ein Tippen davor (Prolog, Bühne) beschleunigt den Einstieg nicht; Tippen während seiner schon
    await this.skyOf(ch); // übersprungen: trotzdem bis der Himmel da ist (kein leeres Brett unter einem fremden Himmel)
    if (e.skip) { await this.land(index, moment, sunk); return; }
    const up = ch.up ?? STORY_UP, dist = 60, from = this.gaze > 0.5 ? this.gazeDir.clone() : null;
    this.gazeRun++; // ein weicher Blickwechsel (gazeTo) endet hier
    this.aimGaze(up);
    // in eine Welt: von der Seite heran am schlafenden Stern dieser Welt vorbei, der kurz aufzuckt (zucke), und hinab
    // vor die Kamera (STORY_FLUG.einstieg); das Licht steht über dem Untertitel (lichtHoch). Ins Dorf (ohne
    // Stern): tief über dem Horizont heran und erst vor der Kamera etwas höher; auch dort steht das Licht über dem
    // Untertitel in der Mitte (Review Ticket 08: mit hoch 0 lag es gut 3 s hinter dem Text)
    const az1 = Math.atan2(this.gazeDir.x, this.gazeDir.z), side = c % 2 ? 1 : -1, el1 = Math.max(0.2, up - 0.15);
    const F = STORY_FLUG, stern = c >= 0 ? c + 1 : null, hoch = () => this.lichtHoch();
    let weg;
    if (stern) {
      const [azS, elS] = this.winkel(himmelsWagen.richtung(stern, _storyDir), az1);
      weg = this.bogen([azS + side * F.einstieg.von / Math.cos(elS), elS + F.einstieg.hoeher],
        this.vorbeiAn(stern, az1), [az1, el1], F.einstieg.amStern);
    } else {
      const az0 = az1 + side, el0 = Math.max(0.03, up - 0.4);
      weg = (k) => [az0 + (az1 - az0) * k, el0 + (el1 - el0) * k];
    }
    const place = ([az, el]) => fl.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
      .multiplyScalar(dist).add(camera.position);
    place(weg(0));
    fl.visible = true;
    fl.material.opacity = 1;
    fl.scale.setScalar(5);
    carrier.start(traeger, fl.position); // ohne Träger (null): nur der Lichtpunkt
    carrier.strength = 1;
    // aus dem Himmel (Menü): erst noch dorthin, wohin die Kamera schon schaut, dann folgt sie dem Licht
    const follow = (k) => {
      this.look(fl.position, hoch());
      if (from) this.gazeDir.lerp(from, 1 - THREE.MathUtils.smoothstep(k, 0, 0.6)).normalize();
    };
    follow(0);
    this.gaze = 1;
    this.present('caption', this.el.querySelector('.caption'), (el) => this.fillCaption(el,
      { kicker, text, path, tap: IS_TOUCH ? 'Tippen' : 'Klicken', warte: true }));
    let gezuckt = !stern;
    await this.tween(F.einstieg.dauer, (k) => {
      place(weg(k));
      carrier.orb.copy(fl.position);
      follow(k);
      if (!gezuckt && k >= F.einstieg.amStern) { gezuckt = true; this.zucke(stern); }
    }, storyEase, 0, e);
    if (e.skip) { await this.land(index, moment, sunk); return; }
    await this.anhalten(e); // über dem Untertitel, bis der Spieler tippt (Abnahme Ticket 11)
    if (e.skip) { await this.land(index, moment, sunk); return; }
    await sunk;
    if (e.skip) { await this.land(index, moment, sunk); return; }
    await this.fall(index, fl.position.clone(), moment, e);
  },
  /**
   * Der Lichtpunkt fällt von from aufs Brett, die Kamera folgt ihm; ein Träger zerstreut sich, das Level wächst, der
   * Moment (Einstieg in eine Welt, ins Dorf; sonst die Welt des Platzes) ist gesehen. e: im Einstieg (enter) dessen
   * Zustand: Bis das Level wächst, lässt er sich überspringen (land). from: wo das Licht steht (über dem Untertitel).
   * Massgebend ist die Bewegung im Bild (Abnahme Ticket 12): Das Licht fällt dort gleich schnell (nach dem kurzen
   * Anlauf, storyFall; ohne Abbremsen vor dem Brett, Abnahme Ticket 11) von seinem Platz bis dorthin, wo das Brett
   * im Bild steht. Die Kamera dreht sich derweil auf dem Grosskreis vom Himmel aufs Brett, ruhig: anlaufen,
   * gleichmässig, sanft ankommen (STORY_FLUG.fall.kamera). Den Ort des Lichts in der Welt ergeben beide: auf dem Strahl
   * der Kamera durch seinen Punkt im Bild, im Abstand, der von dem am Halt zu dem des Bretts geht (im Kehrwert
   * gleichmässig, wie die Tiefe im Bild). Bis Ticket 11 fiel es in der Welt gleichmässig und die Kamera folgte ihm:
   * Im Bild beschleunigte es, bremste und beschleunigte wieder (gemessen in der Probe, pruefeFallImBild).
   */
  async fall(index, from, moment = storyChapterId(this.chapter()), e = null) {
    const fl = this.flare, carrier = this.carrier, to = new THREE.Vector3(0, BEAM_Y, 0), size = fl.scale.x;
    const F = STORY_FLUG.fall, kamera = storyRampe(...F.kamera), cam = camera.position;
    fl.visible = true;
    fl.material.opacity = 1;
    // Anfang: Blick und Ort im Bild am Halt (die Kamera genau so ausgerichtet, wie gleich gezeichnet wird)
    const von = this.gaze > 0 ? this.gazeDir.clone() : _gazeLook.copy(cameraRig.target).sub(cam).normalize().clone();
    this.gazeRun++; // ein weicher Blickwechsel (gazeTo) endet hier
    this.gaze = 1;
    this.gazeDir.copy(von);
    this.kameraNach(von);
    const s0 = from.clone().project(camera), r0 = from.distanceTo(cam), s1 = new THREE.Vector3();
    const brett = new THREE.Vector3(), dreh = new THREE.Quaternion(), q = new THREE.Quaternion(), keine = q.clone();
    let entered = false, closed = false;
    await this.tween(F.dauer, (t) => {
      const k = storyFall(t), c = kamera(t);
      // wo das Brett im Bild steht, wenn die Kamera ganz unten ist (sie wiegt sich leise, darum je Bild)
      brett.copy(cameraRig.target).sub(cam).normalize();
      this.kameraNach(brett);
      s1.copy(to).project(camera);
      // der Blick dieses Bilds, und das Licht auf dem Strahl durch seinen Punkt im Bild
      dreh.setFromUnitVectors(von, brett);
      this.gazeDir.copy(von).applyQuaternion(q.slerpQuaternions(keine, dreh, c)).normalize();
      this.kameraNach(this.gazeDir);
      const r = 1 / (1 / r0 + (1 / to.distanceTo(cam) - 1 / r0) * k);
      fl.position.lerpVectors(s0, s1, k).setZ(0.5).unproject(camera).sub(cam).normalize().multiplyScalar(r).add(cam);
      fl.scale.setScalar(size + (2 - size) * k);
      fl.material.opacity = 1 - THREE.MathUtils.smoothstep(k, 0.72, 0.95);
      carrier.orb.copy(fl.position);
      carrier.strength = Math.min(carrier.strength, 1 - THREE.MathUtils.smoothstep(k, 0.55, 0.95));
      if (t >= 1) this.gaze = 0; // genau aufs Brett (der Blick ist dort angekommen)
      if (!entered && k > 0.6) {
        entered = true;
        if (e && this.entering === e) { // ab hier nicht mehr zu überspringen
          this.entering = null;
          this.skipRuhe = performance.now() + STORY_SKIP_RUHE;
        }
        enterLevel(index);
        setShown(ui.controls, true); // nach dem Menü wieder da
        this.see(moment); // hier beginnt das erste Level dieser Welt: ihr Einstieg ist gesehen
      }
      if (!closed && k > 0.8) { closed = true; this.close(); } // Untertitel der Reise oder des Einstiegs
    }, storyLinear, 0, e);
    if (!entered) { await this.land(index, moment); return; } // übersprungen, bevor das Level wuchs
    fl.visible = false;
    carrier.stop();
  },
  /**
   * Einstieg übersprungen (Entscheid 10; Vorbild der Prolog: kein Schnitt, nur eine kürzere, weiche Fahrt): Der
   * Untertitel geht zu, Lichtpunkt und Träger blenden in 0,4 s aus, dann senkt sich der Blick aufs Brett, und das Level
   * wächst wie beim Fortsetzen; der Moment ist gesehen. sunk: das alte Feld ist versunken.
   */
  async land(index, moment, sunk = Promise.resolve()) {
    this.entering = null;
    // «Dorf überspringen» erst 2 s nach dem Herauswachsen (wie im Fall), nicht schon während der Landung: Mit dem Warten
    // aufs Versinken und grossen Winkeln dauert sie länger als die Pause
    this.skipRuhe = Infinity;
    this.fast = 1;
    this.landing = true; // Tippen beschleunigt die Landung nicht (sie ist schon die Abkürzung)
    this.close();
    const fl = this.flare, carrier = this.carrier, o = fl.material.opacity, s = carrier.strength;
    this.tween(0.4, (k) => { fl.material.opacity = o * (1 - k); carrier.strength = s * (1 - k); }, storyLinear)
      .then(() => { fl.visible = false; carrier.stop(); });
    await sunk;
    setShown(ui.controls, true);
    // Der Blick dreht sich auf dem Grosskreis von seiner jetzigen Richtung aufs Brett, gleichmässig verteilt (Review
    // Ticket 07). Das lineare Mischen von updateCamera (gaze) zwischen Brett und gazeDir drängte bei einem früh
    // übersprungenen Einstieg (gazeDir 130–150° vom Brett) fast die ganze Drehung in wenige Bilder. Grosse Winkel
    // dauern länger: höchstens etwa 1,3° je Bild bei 60 Bildern/s. Das Level wächst, sobald das Brett ins Bild kommt.
    const brett = _gazeLook.copy(cameraRig.target).sub(camera.position).normalize().clone();
    const von = brett.clone().lerp(this.gazeDir, this.gaze).normalize(), winkel = von.angleTo(brett);
    const dreh = new THREE.Quaternion().setFromUnitVectors(von, brett), q = new THREE.Quaternion(), keine = q.clone();
    const smooth = (k) => k * k * (3 - 2 * k);
    this.gazeRun++; // ein laufender weicher Blickwechsel endet hier
    this.gazeDir.copy(von);
    this.gaze = 1;
    let gewachsen = false;
    await this.tween(1.8 * Math.max(1, winkel / (Math.PI / 2)), (k) => {
      this.gazeDir.copy(von).applyQuaternion(q.slerpQuaternions(keine, dreh, k)).normalize();
      if (!gewachsen && k > 0.25 && (1 - k) * winkel < 1.05 && flow.state === 'story') {
        gewachsen = true;
        this.skipRuhe = performance.now() + STORY_SKIP_RUHE;
        enterLevel(index);
        this.see(moment);
      }
    }, smooth);
    this.gaze = 0;
    this.landing = false;
    if (!gewachsen && flow.state === 'story') { enterLevel(index); this.see(moment); }
    this.skipRuhe = Math.min(this.skipRuhe, performance.now() + STORY_SKIP_RUHE);
  },
  /**
   * «Überspringen» (Knopf #btn-skip) bzw. Esc (taste): den Prolog (sein Knopf auf der Bühne), einen Einstieg (enter
   * landet weich) und, nur mit dem Knopf, das Kapitel «Im Dorf» (dorfEnde). Die Reisen laufen ganz (Entscheid 28).
   */
  skip(taste = false) {
    if (this.scene && !this.scene.skip.hidden) { this.skipProlog(); return; }
    const e = this.entering;
    if (e) {
      if (e.skip) return;
      e.skip = true;
      this.dropTweens(e); // Flug oder Fall halten an, wo sie sind; enter bzw. fall gehen zu land
      e.halt?.(); // ebenso das Licht, das über dem Untertitel wartet (anhalten)
      return;
    }
    if (!taste && this.skippable()) this.dorfEnde('uebersprungen');
  },
  /** Ist «Überspringen» (#btn-skip) jetzt zu sehen: in einem Einstieg und solange das Kapitel «Im Dorf» läuft. */
  skippable() {
    if (this.choosing || this.outside || this.grade === null || flow.state === 'intro') return false;
    if (this.entering) return !this.entering.skip;
    // nach dem Einstieg ins Dorf eine Pause: «Überspringen» wechselt dort die Bedeutung (Einstieg → Kapitel), ein
    // Tippen, das noch den Einstieg meinte, beendet sonst das Dorf (Review Ticket 07)
    if (performance.now() < this.skipRuhe) return false;
    return this.inDorf && this.dorfLaeuft() && !this.endeWartet; // auch beim Wiederholen einer Übung davor
  },
  /** Altes Feld versinken lassen, ohne dass das neue von selbst wächst (updateFlow ruft sunk). */
  sinkTo(index) {
    return new Promise((resolve) => {
      this._sunk = resolve;
      this.holdEnter = true;
      changeLevel(index);
    });
  },
  sunk() {
    this.holdEnter = false;
    flow.state = 'story';
    const resolve = this._sunk;
    this._sunk = null;
    resolve?.();
  },
  /** Bloom kurz hochziehen wie beim Lösen. */
  pulse(anstieg = null) {
    // anstieg: in so vielen s weich am hellsten (Aufprall des Polarsterns, Abnahme Ticket 12), sonst gleich
    const a = anstieg ? anstieg / 1.6 : 0.08;
    return this.tween(1.6, (k) => {
      const env = k < a ? (anstieg ? THREE.MathUtils.smoothstep(k, 0, a) : k / a) : Math.exp(-(k - a) * 4);
      bloomPass.strength = LOOK.bloomStrength * (1 + 1.3 * env * (1 - k));
    }, storyLinear);
  },
  /**
   * Lichtwelle über die Platte (wie beim Lösen, siehe celebration). von, anstieg (Aufprall des Polarsterns, Abnahme
   * Ticket 12): Sie beginnt so hell, wie das Brett schon glüht (von), und wird erst in anstieg s ganz hell.
   */
  shock(color, { von = 1, anstieg = 0 } = {}) {
    shockUniforms.uShockColor.value.copy(color).multiplyScalar(0.6);
    return this.tween(1.5, (k) => {
      const r = k * CELEBRATE.shockReach, fade = 1 - k;
      const hell = anstieg ? von + (1 - von) * THREE.MathUtils.smoothstep(k, 0, anstieg / 1.5) : 1;
      shockUniforms.uShock.value.set(r, k < 1 ? fade * fade * hell : 0, CELEBRATE.shockWidth * (1 + r * 0.12));
    }, storyLinear);
  },

  /* ---------- Untertitel ---------- */

  /**
   * Ein Satz, weiter mit Tippen. waehrend(el): was zum Satz geschieht (Finale), gerufen, sobald er erscheint (el: der
   * Untertitel, schon mit dem Satz gefüllt, wenn vorher keiner stand); erst wenn es fertig ist (Promise), wartet der Satz
   * auf Tippen, bis dahin ohne Aufforderung.
   */
  async caption(text, waehrend = null) {
    const cap = this.el.querySelector('.caption');
    const zeigen = this.present('caption', cap,
      (el) => this.fillCaption(el, { text, tap: IS_TOUCH ? 'Tippen' : 'Klicken', warte: !!waehrend }));
    await Promise.all([zeigen, waehrend?.(cap)]);
    cap.classList.remove('warte');
    await this.untilTap();
  },
  /**
   * Untertitel füllen: Kapitel darüber, Leiste unten am Rand (beides nur bei der Ankunft in einer Welt; dann stehen
   * Kicker und Text in der Mitte, .mitte), Aufforderung zum Tippen. neu: auf der Reise (die Leiste zeigt das Erwachen).
   * warte: die Aufforderung bleibt verborgen (ihr Platz bleibt), bis das, worauf der Satz wartet, fertig ist (Finale)
   * bzw. das Licht über ihm anhält (anhalten).
   */
  fillCaption(el, { kicker = '', text, path, tap = '', neu = false, warte = false }) {
    el.querySelector('.kicker').textContent = kicker;
    el.querySelector('.text').textContent = text;
    el.classList.toggle('mitte', path !== undefined);
    el.classList.toggle('warte', warte);
    this.fillPath(el.querySelector('.path'), path, neu);
    el.querySelector('.tap').textContent = tap;
    this.licht = null; // neu messen (lichtHoch)
  },
  /** Untertitel der Ankunft in der Welt ch auf der Reise (travel; fillCaption). */
  ankunft(ch) {
    return { kicker: `Kapitel ${STORY_CHAPTERS.indexOf(ch) + 1} · ${ch.title}`, text: ch.travel, path: ch.station,
      neu: true, tap: IS_TOUCH ? 'Tippen' : 'Klicken', warte: true };
  },
  /**
   * Ankunft in einer Welt (Abnahme Ticket 11): Das Licht hält über dem Untertitel an, die Aufforderung zum Tippen
   * erscheint, und es geht erst weiter, wenn der Spieler tippt, klickt oder Enter bzw. die Leertaste drückt; kein
   * Zeitablauf. Ein Tippen in den ersten STORY_FLUG.halt s galt noch dem Flug (es machte ihn schneller) und zählt
   * nicht. Das Licht bleibt dabei still im Bild (haltAuf, update). e: Zustand des Einstiegs (enter): «Überspringen»
   * bzw. Esc beenden den Halt ebenso (skip, e.skip).
   */
  async anhalten(e = null) {
    const cap = this.el.querySelector('.caption'), ab = performance.now();
    this.halt = true;
    this.haltAuf = this.flare.position.clone().sub(camera.position);
    this.fast = 1;
    cap.classList.remove('warte');
    while (!e?.skip) {
      const getippt = this.untilTap();
      await (e ? Promise.race([getippt, new Promise((weiter) => { e.halt = weiter; })]) : getippt);
      if (performance.now() - ab >= STORY_FLUG.halt * 1000) break;
    }
    if (e) e.halt = null;
    this.waitTap = null;
    this.halt = false;
    this.haltAuf = null;
    cap.querySelector('.tap').textContent = ''; // getippt: die Aufforderung geht sofort (ohne Höhe, nichts rückt)
  },
  /**
   * So weit über der Mitte des Bilds steht das Licht, solange der Untertitel steht (Anteil der halben Bildhöhe, wie
   * look): bei der Ankunft in einer Welt in der Mitte des freien Raums zwischen oberem Rand und Kicker (Wahl des
   * Nutzers, Ticket 02 von .scratch/kleiner-wagen/), einmal je Untertitel und Grösse des Bilds gemessen; sonst
   * STORY_FLUG.licht.
   */
  lichtHoch() {
    const cap = this.el.querySelector('.caption');
    if (this.el.dataset.mode !== 'caption' || !cap.classList.contains('mitte')) return STORY_FLUG.licht;
    if (this.licht === null || this.lichtBei !== innerHeight) {
      this.licht = this.lichtUeber(this.oberkante(cap).oben);
      this.lichtBei = innerHeight;
    }
    return this.licht;
  },
  /** lichtHoch zu einem Kicker (bzw. Text) mit der Oberkante oben (px). */
  lichtUeber(oben) { return THREE.MathUtils.clamp(1 - oben / innerHeight, 0, 0.9); },
  /** Oberkante (px von oben) des Untertitels cap (cap) und seines Kickers bzw. Texts (oben). */
  oberkante(cap) {
    return { cap: cap.getBoundingClientRect().top,
      oben: (cap.querySelector('.kicker:not(:empty)') ?? cap.querySelector('.text')).getBoundingClientRect().top };
  },
  /**
   * Wo ein Untertitel mit inhalt (wie fillCaption) stünde, bevor er steht (oberkante), gemessen an einer verborgenen
   * Kopie: Der Blick des Aufstiegs kommt schon so an, wie ihn der folgende Untertitel braucht (Abnahme Ticket 11).
   */
  captionVorab(inhalt) {
    const kopie = this.el.querySelector('.caption').cloneNode(true), licht = this.licht;
    this.fillCaption(kopie, inhalt);
    this.licht = licht;
    kopie.classList.remove('swap');
    kopie.style.cssText = 'display: flex; visibility: hidden; pointer-events: none';
    this.el.append(kopie);
    const r = this.oberkante(kopie);
    kopie.remove();
    return r;
  },
  /** lichtHoch für den Untertitel mit inhalt, bevor er steht (captionVorab). */
  lichtFuer(inhalt) { return this.lichtUeber(this.captionVorab(inhalt).oben); },
  /** Untertitel zeigen; ein schon offener wechselt seinen Inhalt mit kurzem Überblenden. */
  async present(mode, el, fill) {
    const shown = !this.el.classList.contains('hidden') && this.el.dataset.mode === mode;
    if (shown) { el.classList.add('swap'); await storySleep(350); }
    fill(el);
    if (!shown) { el.classList.add('swap'); this.open(mode); void el.offsetWidth; }
    el.classList.remove('swap');
    await storySleep(shown ? 350 : 800);
  },
  /**
   * Leiste der Ankunft (Leiste C «Zeichen im Wagen», Ticket 08 von .scratch/kleiner-wagen/): der Kleine Wagen in der
   * Form von wagen.form, an den Sternen der Welten ihre Zeichen (STORY_ICONS), an der Spitze der Polarstern. now:
   * Station, in die das Licht kommt (STORY_STATIONS; Station k ist Stern k, das Dorf 0 hat keinen): die Sterne davor
   * wach und verbunden, der Stern der Welt now mit Ring und Puls, spätere blass. neu (Reise): Der eben geweckte Stern
   * now − 1 blitzt auf, seine Linie(n) ziehen sich. Masse: STORY_LEISTE (CSS-Pixel, die Breite setzt das CSS).
   */
  fillPath(el, now, neu = false) {
    el.replaceChildren();
    if (now === undefined) return;
    const { massstab: s, rand, zeichen: ic } = STORY_LEISTE, form = wagen.form;
    const x0 = Math.min(...form.map((p) => p[0])), y0 = Math.min(...form.map((p) => p[1]));
    const w = (Math.max(...form.map((p) => p[0])) - x0) * s + 2 * rand[0];
    const h = (Math.max(...form.map((p) => p[1])) - y0) * s + 2 * rand[1];
    const P = (k) => [rand[0] + (form[k - 1][0] - x0) * s, rand[1] + (form[k - 1][1] - y0) * s];
    const f = (v) => v.toFixed(1), polar = wagen.polarstern, eben = neu && now > 1 ? now - 1 : 0;
    const wach = (k) => k < now && k !== polar;
    let svg = `<defs><radialGradient id="story-hof"><stop offset="0" stop-color="#fff" stop-opacity="0.8"/>`
      + `<stop offset="0.22" stop-color="#dfe3ff" stop-opacity="0.32"/><stop offset="1" stop-color="#aab4ff" stop-opacity="0"/>`
      + '</radialGradient></defs>';
    for (const [a, b] of wagen.linien) {
      const [ax, ay] = P(a), [bx, by] = P(b), xy = `x1="${f(ax)}" y1="${f(ay)}" x2="${f(bx)}" y2="${f(by)}"`;
      svg += `<line class="wgeist" ${xy}/>`;
      if (wach(a) && wach(b)) {
        const istNeu = a === eben || b === eben, len = Math.hypot(bx - ax, by - ay);
        svg += `<line class="wl${istNeu ? ' neu' : ''}"${istNeu ? ` style="--len:${f(len + 1)}"` : ''} ${xy}/>`;
      }
    }
    const [px, py] = P(polar), r = ic * 0.3;
    svg += `<g transform="translate(${f(px)} ${f(py)})" opacity="0.7"><circle r="${f(ic * 0.9)}" fill="url(#story-hof)" opacity="0.6"/>`
      + `<path d="M0 ${f(-2 * r)}L${f(r * 0.15)} ${f(-r * 0.15)} ${f(r * 1.4)} 0 ${f(r * 0.15)} ${f(r * 0.15)} 0 ${f(2 * r)} ${f(-r * 0.15)} ${f(r * 0.15)} ${f(-r * 1.4)} 0 ${f(-r * 0.15)} ${f(-r * 0.15)}z" fill="#fff"/>`
      + '<circle r="1.6" fill="#fff"/></g>';
    STORY_STATIONS.slice(1).forEach(([icon], i) => {
      const k = i + 1, [x, y] = P(k);
      const cls = wach(k) ? `wach${k === eben ? ' neu' : ''}` : k === now ? 'jetzt' : '';
      svg += `<g class="${cls}" data-k="${k}" transform="translate(${f(x)} ${f(y)})">`
        + `<circle class="hof" r="${f(ic * 1.15)}" fill="url(#story-hof)"/><circle class="ring" r="${f(ic * 0.82)}"/>`
        + `<g class="zeichen" transform="translate(${f(-ic / 2)} ${f(-ic / 2)}) scale(${(ic / 24).toFixed(3)})">`
        + `<circle class="scheibe" cx="12" cy="12" r="14"/>${STORY_ICONS[icon]}</g></g>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}" aria-hidden="true">${svg}</svg>`;
  },
  open(mode) {
    this.el.dataset.mode = mode;
    setShown(this.el, true);
    sceneLoop.wake(); // deckt die Bühne nicht mehr (Modus), zeichnet die Szene wieder
  },
  close() {
    const fokus = this.el.contains(document.activeElement);
    setShown(this.el, false);
    sceneLoop.wake(); // aufgedeckt
    if (fokus) this.keepFocus();
  },
  /**
   * Der Fokus fiele auf body, weil sein Knopf eben verschwand (weg; Wahl im Angebot, «Überspringen») oder die
   * Geschichte ausblendet (Review Ticket 07): Er geht auf die Geschichte, solange sie zu sehen ist (Enter tippt, Tab
   * führt zu «Überspringen»), sonst aufs Spielfeld. Ein anderer Fokus bleibt.
   */
  keepFocus(weg = null) {
    const a = document.activeElement;
    if (a && a !== document.body && a !== weg && a.isConnected && !a.closest('[inert]')) return;
    (this.el.classList.contains('hidden') ? renderer.domElement : this.el).focus({ preventScroll: true });
  },
  untilTap() { return new Promise((resolve) => { this.waitTap = resolve; }); },
  /** Tippen/Klicken auf die Geschichte (oder Enter): Karte weiter, in einer Zwischenszene schneller. */
  tap() {
    if (this.choosing) return; // Menü: nur seine Knöpfe
    if (!this.waitTap) {
      if (!this.landing) this.fast = 3; // die Landung (land) nicht: sie ist schon die Abkürzung
      const sc = this.scene;
      if (sc?.moving && sc.speed < 10 && sc.time - sc.movedAt > 0.3) sc.speed = 4; // Kamerafahrt auf der Bühne
      return;
    }
    const resolve = this.waitTap;
    this.waitTap = null;
    this.fast = 1;
    audio.rotate();
    resolve();
  },
  /** Tasten in der Geschichte (das offene Menü nimmt sie vorher, menu.keydown); true: erledigt. */
  keydown(e) {
    if (this.el.classList.contains('hidden') && flow.state !== 'story') return false;
    if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.tap(); }
    else if (e.code === 'Escape') this.skip(true); // Prolog oder Einstieg (das Dorf nicht: dort öffnet Esc das Menü)
    return e.code !== 'KeyM';
  },

  /* ---------- Kopfzeile und Meldung ---------- */

  /**
   * Kopfzeile: [«Das Meer – Brandung»] (Kapitel und Level stehen seit dem 09.11.2026 nicht mehr in der Unterzeile);
   * im Dorf [«Im Dorf – Brechung», «Übung 2 / 4»]. Grad und Hinweis: ui.
   */
  hudText(index) {
    if (this.inDorf) {
      return [`${STORY_DORF.title} – ${LEVELS[index].name}`, `Übung ${this.uebung + 1} / ${TUTORIAL_COUNT}`];
    }
    const lvl = LEVELS[index];
    return [`${STORY_CHAPTERS[this.steps[this.step].c].title} – ${lvl.titel ?? lvl.name}`];
  },
  /**
   * Meldung und Knopf nach dem Lösen: im Kapitel «Gelöst» / «Weiter», am Ende der Welt ihr Satz und wohin es geht
   * (beim Wiederholen ebenso, nur ohne Reise); nach dem letzten Level eines geschafften Grads beim Wiederholen zurück
   * in die Übersicht statt ins Finale.
   */
  solvedText() {
    if (this.inDorf) { // nach der letzten Übung in den Bergwald, beim Wiederholen nach dem Kapitel in die Übersicht
      if (this.uebung + 1 < TUTORIAL_COUNT) return ['Gelöst', 'Weiter'];
      return [STORY_DORF.done, this.replay && !this.dorfLaeuft() ? 'Zur Übersicht' : STORY_DORF.next];
    }
    const cur = this.steps[this.step], next = this.steps[this.step + 1], ch = STORY_CHAPTERS[cur.c];
    if (next && next.c === cur.c) return ['Gelöst', 'Weiter'];
    return !next && this.replay && this.stand.geschafft ? [ch.done, 'Zur Übersicht'] : [ch.done, ch.next];
  },

  /* ---------- Zeitachse (läuft mit animate, Zeit der Szene) ---------- */

  /** mark: Marke für dropTweens (Flug und Fall eines Einstiegs: sein Zustand entering). */
  tween(seconds, fn, ease = storyEase, delay = 0, mark = null) {
    sceneLoop.wake(); // ruht die Schleife hinter der Bühne, liefe der Tween nie
    return new Promise((resolve) => {
      this.tweens.push({ t: -delay, s: Math.max(seconds, 1e-6), fn, ease, resolve, mark });
    });
  },
  /**
   * Die Tweens mit der Marke mark abbrechen: Sie verschwinden ohne letzten Schritt (Lichtpunkt und Kamera springen
   * nicht ans Ende), ihre Promise ist erfüllt. Weiche Blickwechsel (gazeTo) und Warten (skyOf, wait) bleiben.
   */
  dropTweens(mark) {
    const weg = this.tweens.filter((tw) => tw.mark === mark);
    this.tweens = this.tweens.filter((tw) => tw.mark !== mark);
    for (const tw of weg) tw.resolve();
  },
  wait(seconds) { return this.tween(seconds, () => {}); },
  update(dt) {
    const skip = this.skippable();
    if (skip !== this.skipShown) {
      this.skipShown = skip;
      // im Dorf sagt der Knopf, was er überspringt (nur beim Einblenden: kein Wechsel vor den Augen)
      if (skip) this.skipBtn.textContent = this.entering ? 'Überspringen' : 'Dorf überspringen';
      setShown(this.skipBtn, skip);
    }
    this.carrier?.update(dt * this.fast);
    // auf dem Stern: Er steht in der Richtung von der Kamera aus, die sich leise bewegt (sonst wanderte das Licht weg)
    if (this.amStern) {
      this.flare.position.copy(camera.position)
        .addScaledVector(himmelsWagen.richtung(this.amStern, _storyDir), STORY_PULS.abstand);
    }
    // im Halt über dem Untertitel ebenso: Es steht still im Bild, auch wenn die Kamera noch gleitet (anhalten)
    if (this.haltAuf) {
      this.flare.position.copy(camera.position).add(this.haltAuf);
      this.carrier?.orb.copy(this.flare.position);
    }
    if (this.blend) this.blendSky();
    if (!this.tweens.length) return;
    const d = dt * this.fast;
    for (const tw of this.tweens.slice()) {
      tw.t += d;
      if (tw.t < 0) continue;
      const k = Math.min(1, tw.t / tw.s);
      tw.fn(tw.ease(k));
      if (k >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.resolve(); }
    }
  },

  /* ---------- 3D: Himmelsstrahlen, Lichtpunkt, Träger ---------- */

  /** Alles einmal anlegen, unsichtbar: compileParallel übersetzt beim Start auch Unsichtbares mit. */
  buildScene() {
    const geo = new THREE.CylinderGeometry(0.2, 0.2, 1, 16, 1, true).translate(0, 0.5, 0);
    this.beams = Array.from({ length: 10 }, () => this.makeBeam(geo));
    this.answer = this.makeBeam(geo);
    this.flare = this.makeFlare();
    this.carrier = this.makeCarrier(96);
  },
  /**
   * Träger des Lichts zwischen zwei Welten (STORY_CARRIERS): Punkte, die dem Lichtpunkt (orb) folgen. Jeder Punkt hängt
   * um seine Verzögerung zurück und liegt dort, wo der Lichtpunkt damals war (Verlauf history): So entsteht beim Flug
   * von selbst eine Spur. strength blendet alles ein und aus.
   */
  makeCarrier(count) {
    const geo = new THREE.BufferGeometry();
    for (const [name, size] of [['position', 3], ['aColor', 3], ['aAlpha', 1], ['aSize', 1]]) {
      geo.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * size), size));
    }
    const mat = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: 1 } },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aSize;
        uniform float uPixelRatio;
        varying vec3 vColor;
        void main() {
          vColor = aColor * aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aAlpha <= 0.0 ? 0.0 : aSize * 260.0 * uPixelRatio / -mv.z;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(vColor * a * a, 1.0);
        }`,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    });
    const points = new THREE.Points(geo, mat);
    points.visible = false;
    points.frustumCulled = false;
    points.renderOrder = 9;
    points.raycast = () => {};
    points.layers.set(LAYER_NO_REFLECT);
    scene.add(points);
    const rand = mulberry32(31);
    const seeds = Array.from({ length: count }, () => ({ d: rand(), r: rand(), sp: rand(), s: rand(), ph: rand() * Math.PI * 2,
      fl: 2 + rand() * 4, dir: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize() }));
    const history = []; // [Zeit, x, y, z] der letzten 3 s
    const A = geo.attributes;
    return {
      kind: null, t: 0, strength: 0, orb: new THREE.Vector3(),
      start(kind, at) {
        this.kind = STORY_CARRIERS[kind] ?? null;
        this.t = 0;
        this.strength = 0;
        this.orb.copy(at);
        history.length = 0;
        points.visible = !!this.kind;
      },
      stop() { this.kind = null; points.visible = false; },
      update(dt) {
        const K = this.kind;
        if (!K) return;
        this.t += dt;
        history.push([this.t, this.orb.x, this.orb.y, this.orb.z]);
        while (history.length > 2 && history[1][0] < this.t - 3) history.shift();
        const t = this.t, back = (time) => { let i = history.length - 1; while (i > 0 && history[i][0] > time) i--; return history[i]; };
        seeds.forEach((sd, i) => {
          if (i >= K.count) { A.aAlpha.array[i] = 0; return; }
          const [, hx, hy, hz] = back(t - K.delay * sd.d), r = K.radius[0] + (K.radius[1] - K.radius[0]) * sd.r;
          const ang = sd.ph + t * (K.spin ? K.spin[0] + (K.spin[1] - K.spin[0]) * sd.sp : 0);
          let x = hx, y = hy, z = hz, alpha;
          if (K.motion === 'swarm' || K.motion === 'helix') {
            const rr = K.motion === 'helix' ? r * (0.35 + sd.d) : r;
            x += Math.cos(ang) * rr;
            y += Math.sin(ang * 1.3 + sd.ph) * rr * 0.6;
            z += Math.sin(ang) * rr;
            alpha = K.motion === 'swarm' ? 0.5 + 0.5 * Math.sin(t * sd.fl + sd.ph) ** 2 : 1 - 0.7 * sd.d;
          } else {
            const spread = K.motion === 'trail' ? r : r * (K.motion === 'embers' ? 0.3 + sd.d * 2 : 0.15 + sd.d * 1.2);
            x += sd.dir.x * spread;
            y += sd.dir.y * spread + (K.wave ? Math.sin(t * 3 + sd.d * 8) * K.wave : 0) - (K.motion === 'embers' ? 6 * sd.d * sd.d : 0);
            z += sd.dir.z * spread;
            alpha = K.motion === 'comet' ? (1 - sd.d) ** 1.5 : (1 - sd.d) * (0.6 + 0.4 * Math.sin(t * sd.fl * 2 + sd.ph));
          }
          A.position.array.set([x, y, z], i * 3);
          const hot = 1.3 + sd.s * 1.3;
          A.aColor.array.set([K.color[0] * hot, K.color[1] * hot, K.color[2] * hot], i * 3);
          A.aAlpha.array[i] = Math.max(0, alpha) * this.strength;
          A.aSize.array[i] = K.size[0] + (K.size[1] - K.size[0]) * sd.s;
        });
        for (const a of Object.values(A)) a.needsUpdate = true;
        mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      },
    };
  },
  /** Strahl als leuchtende Röhre (Kern und Hof aus dem Blickwinkel); wächst bis uHead (0 … 1 seiner Länge). */
  makeBeam(geo) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color() }, uHead: { value: 0 }, uTail: { value: 0 },
        uStrength: { value: 1 } },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        varying vec3 vAxis;
        varying float vY;
        void main() {
          vY = position.y;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vAxis = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
          vV = cameraPosition - wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      // Mitte der Röhre aus Sicht der Kamera: Blickrichtung quer zur Achse (schräg gesehen sonst fast unsichtbar)
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uHead;
        uniform float uTail;
        uniform float uStrength;
        varying vec3 vN;
        varying vec3 vV;
        varying vec3 vAxis;
        varying float vY;
        void main() {
          // auslaufen (story.auslaufen): Das Ende uTail rückt zur Spitze, weich über ein Stück der Länge
          float tail = smoothstep(uTail - 0.2, uTail, vY);
          if (vY > uHead || tail <= 0.0) discard;
          vec3 v = normalize(vV), axis = normalize(vAxis);
          vec3 across = v - axis * dot(v, axis);
          float l = length(across);
          float f = l > 1e-4 ? abs(dot(normalize(vN), across / l)) : 1.0;
          float profile = pow(f, 18.0) * 3.2 + pow(f, 4.0) * 0.4;
          vec3 color = mix(uColor, vec3(1.0), pow(f, 30.0) * 0.75); // weisslicher Kern
          float head = 1.0 + 3.0 * exp(-(uHead - vY) * 60.0);
          gl_FragColor = vec4(color * profile * head * smoothstep(0.0, 0.01, vY) * tail * uStrength, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.raycast = () => {};
    mesh.layers.set(LAYER_NO_REFLECT);
    scene.add(mesh);
    return mesh;
  },
  aim(beam, from, to, color) {
    const dir = _storyDir.copy(to).sub(from), len = dir.length();
    beam.position.copy(from);
    beam.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
    beam.scale.set(1, len, 1);
    const u = beam.material.uniforms;
    u.uColor.value.copy(color);
    u.uHead.value = 0;
    u.uStrength.value = 1;
    u.uTail.value = 0;
    beam.visible = true;
  },
  /**
   * Lichtpunkt am Himmel (Ziel der Strahlen beim Stern der Welt, dann das getragene Licht, im Finale zuletzt auf dem
   * Polarstern): weicher Hof mit vier kurzen Strahlen, die sich zur Spitze hin verjüngen, dazwischen vier schwache;
   * leicht gedreht. Feine Linien quer durchs Bild wirkten wie ein Fadenkreuz.
   */
  makeFlare() {
    const size = 256, h = size / 2, c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(h, h, 0, h, h, h);
    // weich auslaufend: ohne sichtbaren Rand (sonst wirkt der Hof wie eine Scheibe)
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.05, 'rgba(255,255,255,0.85)');
    r.addColorStop(0.1, 'rgba(235,238,255,0.45)');
    r.addColorStop(0.18, 'rgba(220,226,255,0.18)');
    r.addColorStop(0.3, 'rgba(210,218,255,0.06)');
    r.addColorStop(0.5, 'rgba(200,210,255,0.015)');
    r.addColorStop(1, 'rgba(200,210,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, size, size);
    g.globalCompositeOperation = 'lighter';
    const ray = (angle, length, width, alpha) => {
      g.save();
      g.translate(h, h);
      g.rotate(angle);
      const l = g.createLinearGradient(0, 0, length, 0);
      l.addColorStop(0, `rgba(255,255,255,${alpha})`);
      l.addColorStop(0.35, `rgba(235,240,255,${alpha * 0.4})`);
      l.addColorStop(1, 'rgba(235,240,255,0)');
      g.fillStyle = l;
      g.beginPath();
      g.moveTo(0, -width);
      g.lineTo(length, 0);
      g.lineTo(0, width);
      g.closePath();
      g.fill();
      g.restore();
    };
    for (let k = 0; k < 4; k++) ray(0.21 + k * Math.PI / 2, h * 0.7, 3.4, 0.9);
    for (let k = 0; k < 4; k++) ray(0.21 + Math.PI / 4 + k * Math.PI / 2, h * 0.3, 1.8, 0.4);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(2.4, 2.4, 2.4), transparent: true, depthWrite: false,
      depthTest: false, blending: THREE.AdditiveBlending, fog: false });
    const s = new THREE.Sprite(mat);
    s.visible = false;
    s.renderOrder = 10;
    s.raycast = () => {};
    s.layers.set(LAYER_NO_REFLECT);
    scene.add(s);
    return s;
  },
};
const _storyDir = new THREE.Vector3(), _storyHead = new THREE.Vector3();
story.init();

/* ---------- Tasten ----------
   R: neu starten · M: Ton · Esc: Menü · L: Übersicht · Enter: weiter (nach dem Lösen) bzw. Start; im Menü Tab,
   Pfeile, Pos1/Ende, Enter (menu.keydown), Esc zurück ins Spiel (story.back); in der Übersicht Pfeile, Pos1/Ende,
   Bild↑/↓, Tab, Enter und Esc (createUebersicht fängt sie ab), L schliesst sie; in den Zwischenszenen
   Enter/Leertaste weiter, Esc überspringt den Prolog und die Einstiege (story.keydown); im Dorf öffnet Esc das Menü
   wie in jedem Level (das Kapitel überspringt nur der Knopf).
   Level und Hintergrund wählt die Geschichte (Entscheide 21 und 26). C (Debug): Farbe der Quellen wechseln */

/**
 * Nach dem Start mit Enter oder Leertaste hat ein Knopf des Menüs gleich den Fokus: Die gehaltene Taste löste sonst
 * seinen Klick aus, bei Enter die Wiederholung des Drückens, bei der Leertaste das Loslassen (ohne Wahl in den Prolog
 * von «Leicht» oder weiter). Bis zum Loslassen gehört sie niemandem; ein neues Drücken (Loslassen verpasst, etwa in
 * einem anderen Fenster) gibt sie wieder frei.
 */
function holdUntilRelease(code) {
  const halt = (u) => {
    if (u.code !== code) return;
    const done = u.type === 'keyup' || !u.repeat;
    if (done) { removeEventListener('keydown', halt, true); removeEventListener('keyup', halt, true); }
    if (u.type === 'keydown' && !u.repeat) return; // neu gedrückt: wieder wie sonst
    u.preventDefault();
    u.stopImmediatePropagation();
  };
  addEventListener('keydown', halt, true);
  addEventListener('keyup', halt, true);
}

window.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  // Enter/Leertaste auf einer Schaltfläche löst deren Klick aus – nicht zusätzlich hier
  if ((e.code === 'Enter' || e.code === 'Space') && e.target.closest?.('button')) return;
  if (flow.state === 'intro') {
    if (e.code !== 'Enter' && e.code !== 'Space') return;
    e.preventDefault();
    ui.start();
    if (flow.state !== 'intro') holdUntilRelease(e.code);
    return;
  }
  // offene Übersicht: ihre Tasten nimmt sie selbst (Capture), R usw. wirken nicht aufs Feld darunter; L schliesst
  if (uebersicht.offen) {
    if (e.code === 'KeyM') ui.toggleSound();
    else if (e.code === 'KeyL') story.closeOverview();
    return;
  }
  // offenes Menü: R, Pfeile usw. bedienen nicht das Feld darunter; Esc führt zurück ins Spiel, wenn es von dort kam
  if (menu.offen) {
    if (menu.keydown(e)) return;
    if (e.code === 'KeyM') ui.toggleSound();
    else if (e.code === 'Escape') story.back();
    return;
  }
  if (story.keydown(e)) return;
  if (e.code === 'KeyM') ui.toggleSound();
  else if (e.code === 'Escape') story.toMenu();
  else if (e.code === 'KeyL') story.toOverview();
  else if (e.code === 'Enter' && ui.solvedVisible()) {
    e.preventDefault();
    ui.advance();
  } else if (e.code === 'KeyR') {
    restartLevel();
  } else if (e.code === 'KeyC') {
    if (flow.state !== 'play') return;
    const cycle = [7, 1, 2, 4, 3, 5, 6];
    for (const el of game.board.elements) {
      if (el.type !== 'source') continue;
      el.color = cycle[(cycle.indexOf(el.color) + 1) % cycle.length];
      game.objects.get(el.id).userData.lens.material.color.copy(COLOR_RGB[el.color]).multiplyScalar(5.5);
    }
    recomputeBeams();
  }
});

// ?nointro: direkt ins Spiel (Screenshot-Tests)
if (new URLSearchParams(location.search).has('nointro')) { ui.canStart = true; ui.start(false); markIntroCalm(); }

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  menu: () => menu, story: () => story, uebersicht: () => uebersicht,
});

export { menu, story, storyEase, storyLinear, storySleep, uebersicht, vorwaermenVorStart };
