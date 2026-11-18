// Oberfläche: Kopfzeile, kleine Schaltflächen, «Level gelöst», Startbildschirm (Ticket 04 von .scratch/umbau/, bis
// dahin in index.html).
import { fuehrung } from '../fuehrung.js';
import { nextFrame, ruhe, sceneLoop } from '../szene.js';
import { game } from '../brett/feld.js';
import { audio } from '../ton.js';
import { CUBE_START, fillTier, flow, restartLevel } from '../levelfluss.js';
import { $, IS_TOUCH } from './dom.ts';
import { story, vorwaermenVorStart } from '../geschichte/geschichte.js';
import { LEVELS, TUTORIAL_COUNT } from '../../logik.js';
import { beiSprachwechsel, levelTitel, t } from '../../texte/sprache.js';

/** Sekunden als m:ss bzw. h:mm:ss. */
function formatDuration(seconds) {
  const s = Math.floor(seconds), pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** Bereich ein-/ausblenden; versteckt ist er auch für Tastatur und Screenreader weg (inert). */
function setShown(el, shown) {
  el.classList.toggle('hidden', !shown);
  el.inert = !shown;
  if (!shown && el.contains(document.activeElement)) document.activeElement.blur();
}

/** Der Seitenstart (seitenstart, am Ende des Scripts) hat alles aufgebaut und die Programme der Szene angestossen: Erst
 * dann beginnt die Enthüllung (ui.init), seine Stücke fielen sonst als Rucke in sie */
let markSeitenstart;
const seitenstartAngestossen = new Promise((resolve) => { markSeitenstart = resolve; });

/**
 * Intro ruhig: Strahl, Schriftzug, Farbfächer und Texte sind eingeblendet (CSS #intro: „Klicken zum Starten“ endet
 * 2,9 + 1,2 s nach Beginn der Enthüllung, danach pulsiert es nur noch langsam). Bis dahin ist keine Stelle ruhig (ruhe):
 * Eine Skybox wartet mit dem Übersetzen, Hochladen und ersten Zeichnen (siehe createPanoramaSky), ebenso das Vorwärmen
 * von Menü und Bühne und der Ton: Schon ein einzelnes ausgelassenes Bild sah man als Ruck in der langsamen Enthüllung.
 * Vorher laufen Dekodieren (Worker), Netz und Ebenen in Häppchen. Ohne Intro (?nointro) sofort.
 */
const INTRO_REVEAL_MS = 4200;
let markIntroCalm;
const introCalm = new Promise((resolve) => { markIntroCalm = resolve; });

const ui = {
  hud: $('hud'), title: $('hud-title'), tier: $('hud-tier'), goal: $('hud-goal'), ziele: $('hud-ziele'),
  grad: $('hud-grad'), sub: $('hud-sub'),
  controls: $('controls'), sound: $('btn-sound'),
  solved: $('solved'), solvedMsg: $('solved-msg'), solvedBest: $('solved-best'), solvedStats: $('solved-stats'),
  next: $('btn-next'), overview: $('btn-overview'),
  intro: $('intro'),
  canStart: false, // „Klicken zum Starten“ ist da (siehe init)
  hudIndex: null,  // die Kopfzeile zeigt dieses Level (showHud); ein Wechsel der Sprache schreibt sie neu
  ziel: [0, 0],    // so viele Ziele leuchten, von so vielen (showGoal)
  geloest: null,   // «Gelöst» zeigt(e) { index, stats } (showSolved)

  init() {
    $('btn-restart').addEventListener('click', () => restartLevel());
    this.sound.addEventListener('click', () => this.toggleSound());
    $('btn-menu').addEventListener('click', () => story.toMenu());
    this.overview.addEventListener('click', () => story.toOverview());
    this.next.addEventListener('click', () => this.advance());
    this.intro.addEventListener('click', () => this.start());
    this.intro.querySelector('.start span').textContent = t('start.tippen', { touch: IS_TOUCH });
    this.updateSound();
    beiSprachwechsel(() => this.sprachwechsel());
    // Enthüllung starten, sobald die Schrift geladen ist (spätestens nach 0,8 s), ohne auf die Szene zu warten (Ticket 03
    // der Leistung). Kein sichtbares Bild: Die Szene liegt hinter dem deckenden Startbildschirm und wird davor nur einmal
    // gezeichnet (aufwaermen; was das erste Bild bei three einrichtet, hielte sonst die Enthüllung an). Sind ihre Shader
    // dann noch nicht übersetzt (compileParallel im Hintergrund), zeichnet sie erst nach der Enthüllung (introCalm,
    // sceneLoop.mayDraw)
    const until = (promise, ms) => Promise.race([promise, new Promise((r) => setTimeout(r, ms))]);
    // (nach zwei Bildern: Ist die Schrift schon da, ehe die Seite fertig geladen hat, fiele der lange erste Frame sonst
    // in die Enthüllung; davor Menü und Bühne vorwärmen, vorwaermenVorStart). Der Seitenstart läuft in Stücken (Ticket 10
    // der Leistung): auch auf ihn warten
    Promise.all([until(document.fonts?.ready, 800), seitenstartAngestossen]).then(nextFrame).then(nextFrame)
      .then(() => vorwaermenVorStart().catch((e) => console.error(e))).then(() => {
      sceneLoop.aufwaermen();
      this.intro.classList.add('go');
      // reduzierte Bewegung: die Animationen sind gleich fertig (CSS), also nicht warten
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(markIntroCalm, still ? 0 : INTRO_REVEAL_MS);
      introCalm.then(() => { sceneLoop.calm = ruhe.calm = true; sceneLoop.wake(); }); // was liegen blieb, jetzt
      // „Klicken zum Starten“ am Ende der Enthüllung (2,9 s: der Strahl ist verglüht), ohne auf den Himmel dahinter zu
      // warten: Er ist hinter dem deckenden Startbildschirm nicht zu sehen und lädt an ruhigen Stellen fertig (ruhe)
      setTimeout(() => {
        this.canStart = true;
        this.intro.classList.add('ready');
      }, still ? 0 : 2900);
    });
    // Ton freischalten, sobald der Spieler irgendwo interagiert (Autoplay-Regeln der Browser)
    const unlock = (e) => { if (e.isTrusted) audio.unlock(); }; // synthetische Ereignisse (Tests) zählen nicht als Geste
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
  },

  /**
   * Kopfzeile. In Noas Geschichte: «Das Meer – Brandung» (Kapitel und Titel des Levels), darunter die Ziele mit dem
   * Grad dahinter («Ziele 0 / 3 · ●●○○ Mittel»; Kapitel, Level und Bedienung stehen seit dem 09.11.2026 nicht mehr
   * da, Wunsch des Nutzers); im Dorf «Im Dorf – Brechung», darunter ebenso Ziele und Grad, dann «Übung 2 / 4» (der Satz
   * des laufenden Schritts steht seit .scratch/tutorial-neu/ im Band unten, fuehrung). Ein Level ausserhalb der
   * Geschichte (Testschnittstelle zeige): Titel oder Name mit dem Grad dahinter, im Tutorial darunter der erste
   * Schritt, im Würfel der Hinweis.
   */
  showHud(index) {
    const lvl = LEVELS[index];
    this.hud.classList.toggle('tutorial', !!lvl.tutorial || lvl.dim === 3);
    this.hud.classList.toggle('geschichte', story.drives(index)); // Handy quer: die Unterzeile bleibt (CSS)
    this.overview.hidden = !story.drives(index); // die Übersicht gibt es nur in einem Level der Geschichte
    this.hudIndex = index;
    this.hudTexte(index);
    this.showGoal(0, game.board.elements.filter(e => e.type === 'target').length);
    // unter dem offenen Menü nicht (ein Level, das beim Öffnen gerade wechselte, wächst dahinter fertig heraus)
    this.hud.classList.toggle('hidden', story.choosing);
    if (story.choosing) fuehrung.verbergen(); else fuehrung.zeigen();
  },
  /** Die Texte der Kopfzeile zum Level index: Titel, Grad, Unterzeile (showHud, Wechsel der Sprache). */
  hudTexte(index) {
    const lvl = LEVELS[index];
    fillTier(this.tier, lvl);
    fillTier(this.grad, {}); // verborgen und leer (sonst stünde dort der Grad eines früheren Levels, alte Sprache)
    // eine Übung ausserhalb der Führung zeigt ihren ersten Schritt (Testschnittstelle zeige)
    const hinweis = () => (lvl.schritte ? t(lvl.schritte[0].text, { touch: IS_TOUCH }) : '');
    if (story.drives(index)) {
      const [title, info] = story.hudText(index);
      this.title.textContent = title;
      this.tier.hidden = true; // der Grad steht hinter den Zielen
      // eine Übung im Dorf hat keinen Grad: der gewählte
      fillTier(this.grad, lvl.tutorial ? { grad: story.grade } : lvl);
      const zeile = [];
      if (info) { // im Dorf «Übung 2 / 4», am Stück: Auf dem Handy hochkant bräche es sonst vor der 4 um
        const teil = document.createElement('span');
        teil.className = 'teil';
        teil.textContent = info;
        zeile.push(teil);
      }
      // geführt: der Satz des Schritts steht im Band unten (fuehrung.zeichneBand, seit .scratch/tutorial-neu/)
      if (lvl.tutorial && !fuehrung.fuehrt(index)) { // Übung im Dorf ohne Führung: ihr erster Schritt in eigener Zeile
        const h = document.createElement('span');
        h.className = 'hinweis';
        h.textContent = hinweis();
        zeile.push(h);
      }
      this.sub.replaceChildren(...zeile);
    } else if (lvl.dim === 3) {
      this.title.textContent = t('kopf.wuerfel', { n: index - CUBE_START + 1, N: LEVELS.length - CUBE_START,
        titel: levelTitel(lvl) });
      this.sub.textContent = lvl.hint ?? '';
    } else if (lvl.tutorial) {
      this.title.textContent = t('kopf.tutorial', { n: index + 1, N: TUTORIAL_COUNT, titel: levelTitel(lvl) });
      this.sub.textContent = hinweis();
    } else {
      this.title.textContent = levelTitel(lvl);
      this.sub.textContent = '';
    }
  },
  /** Wie viele Ziele schon in ihrer Farbe leuchten – macht die Aufgabe in jedem Level sichtbar. */
  showGoal(lit, total) {
    this.ziel = [lit, total];
    const text = t('kopf.ziele', { n: lit, N: total });
    if (this.ziele.textContent !== text) this.ziele.textContent = text;
    this.goal.classList.toggle('done', lit === total); // hellt nur die Ziele auf, der Grad hat seine eigene Farbe
  },
  hideHud() { this.hud.classList.add('hidden'); fuehrung.verbergen(); },

  /**
   * Meldung nach dem Lösen, mit Zeit und Drehungen. In der Geschichte sagt sie, wie es weitergeht (story.solvedText),
   * und „Weiter“ führt dorthin; ausserhalb der Geschichte (Testschnittstelle) gibt es kein „Weiter“. Eine neue
   * Bestmarke (flow.record, Entscheid 24) steht darunter, die Zahl dazu leuchtet auf. Unter dem offenen Menü oder der
   * Übersicht nicht: Wer mitten im Lösungsmoment dorthin geht, sieht sie, wenn er ins Level zurückkehrt (story.resume).
   */
  showSolved(index, stats) {
    if (story.choosing) return;
    this.geloest = { index, stats };
    this.geloestTexte(index, stats);
    const inStory = story.drives(index);
    this.next.hidden = !inStory;
    if (inStory) story.preloadNext();
    setShown(this.solved, true);
    document.body.classList.add('is-solved'); // Handy quer: Meldung ersetzt die Kopfzeile
  },
  /** Texte von «Gelöst» zum Level index: Zeit, Drehungen, Bestmarke, Meldung, «Weiter» (showSolved, Sprachwechsel). */
  geloestTexte(index, stats) {
    const r = flow.record;
    const stat = (num, unit, best) => {
      const el = document.createElement('span'), n = document.createElement('span'), u = document.createElement('span');
      n.className = best ? 'num best' : 'num'; n.textContent = num;
      u.className = 'unit'; u.textContent = unit;
      el.append(n, ' ', u); // Leerzeichen für Screenreader
      return el;
    };
    this.solvedStats.replaceChildren(...(stats ? [
      stat(formatDuration(stats.seconds), t('geloest.zeit'), r?.neueBestzeit), ' ',
      stat(stats.turns, t(stats.turns === 1 ? 'geloest.drehung' : 'geloest.drehungen'), r?.wenigerDrehungen)] : []));
    // in der Zeile oben (Handy quer: dort ohne Zeit und Drehungen) und für den Bildschirmleser (aria-live)
    this.solvedBest.textContent = [r?.neueBestzeit && t('geloest.neueBestzeit'),
      r?.wenigerDrehungen && t('geloest.wenigerDrehungen')].filter(Boolean).join(' · ');
    // ausserhalb der Geschichte nur die Meldung («Weiter» ist dort verborgen, showSolved)
    const [meldung, weiter] = story.drives(index) ? story.solvedText() : [t('geloest.level'), t('geloest.weiter')];
    this.solvedMsg.textContent = meldung;
    this.next.textContent = weiter;
  },
  hideSolved() { setShown(this.solved, false); document.body.classList.remove('is-solved'); },
  solvedVisible() { return !this.solved.classList.contains('hidden'); },
  advance() {
    // z. B. zweites Auslösen (Taste + Klick); ausserhalb der Geschichte gibt es kein Weiter
    if (flow.state !== 'play' || !this.solvedVisible() || !story.drives(game.levelIndex)) return;
    story.advance();
  },

  toggleSound() {
    audio.unlock();
    audio.setMuted(!audio.muted);
    this.updateSound();
  },
  updateSound() {
    this.sound.classList.toggle('muted', audio.muted);
    this.sound.setAttribute('aria-pressed', String(audio.muted));
    this.sound.setAttribute('aria-label', t(audio.muted ? 'steuerung.ton.an' : 'steuerung.ton.aus'));
  },

  /**
   * Wechsel der Sprache (Ticket 01 von .scratch/sprachwahl/, ohne Neuladen): die Texte mit Zustand neu, die sonst nur
   * beim Zeigen entstehen, auch verborgen (Kopfzeile und «Gelöst» unter dem Menü): Startbildschirm (je Gerät), Ton (an
   * oder aus), Kopfzeile des Levels, das sie zuletzt zeigte, samt Zielen, «Gelöst» mit Meldung und «Weiter» nach der
   * Lage der Geschichte. Die übrigen festen Texte (data-t) setzt die Übersetzungsschicht.
   */
  sprachwechsel() {
    this.intro.querySelector('.start span').textContent = t('start.tippen', { touch: IS_TOUCH });
    this.updateSound();
    if (this.hudIndex !== null) {
      this.hudTexte(this.hudIndex);
      this.showGoal(...this.ziel);
    }
    if (this.geloest) this.geloestTexte(this.geloest.index, this.geloest.stats);
    else [this.solvedMsg.textContent, this.next.textContent] = [t('geloest.level'), t('geloest.weiter')];
  },

  /** Startbildschirm verlassen: Ton freischalten, dann das Menü (story.start); die Knöpfe kommen mit dem Level. */
  start(gesture = true) {
    if (flow.state !== 'intro' || !this.canStart) return; // erst, wenn „Klicken zum Starten“ da ist
    if (gesture) audio.unlock(); // ohne Geste verweigert der Browser den Ton – dann beim ersten Klick
    setShown(this.intro, false);
    // nach dem Ausblenden ganz entfernen (die Puls-Animation liefe sonst endlos weiter)
    setTimeout(() => { this.intro.style.display = 'none'; }, 1200);
    story.start();
    sceneLoop.wake(); // aufgedeckt: die Szene zeichnet wieder
  },
};
ui.init();

export { introCalm, markIntroCalm, markSeitenstart, setShown, ui };
