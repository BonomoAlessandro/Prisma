// Ton: Web Audio, Hall (im Worker), Töne der Ziele und Sterne (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import './eingabe.js';
import { ruhe } from './szene.js';
import { flow } from './levelfluss.js';
import { ui } from './oberflaeche/ui.js';
import { wagen } from './geschichte/daten.js';
import { HALL_SECONDS, hallImpulse } from '../hall.js';
import { einstellungen } from '../spielstand.js';
import { alsGlobal } from './testschnittstelle.ts';

/* =====================================================================
   AUDIO — alles mit der Web Audio API erzeugt, keine Dateien.
   Leises Glitzern im Hintergrund, glasige Klicks beim Drehen, ein Ton je Zielfarbe
   (Rot tief … Blau hoch) und ein Akkord beim Lösen. Alle Töne liegen in
   A-Dur (A, C#, E, F#, G#, B), damit jede Kombination harmonisch klingt.
   Der AudioContext entsteht erst bei der ersten Geste (Autoplay-Regeln).
   ===================================================================== */

// Frequenz je Farbmaske – vom tiefen Rot über das Spektrum zum hohen Blau
const TONE_HZ = {
  1: 220.0,   // Rot      A3
  3: 277.18,  // Gelb     C#4
  2: 329.63,  // Grün     E4
  6: 415.30,  // Cyan     G#4
  4: 493.88,  // Blau     B4
  5: 369.99,  // Magenta  F#4
  7: 554.37,  // Weiss    C#5
};
const GLASS_HZ = [1760, 1975.5, 2217.5, 2637.0, 2960.0]; // A6 … F#7 (Pentatonik)
const SHIMMER_HZ = [1318.5, 1480.0, 1760, 1975.5, 2217.5]; // E6 … C#7: Hintergrund-Glitzern, etwas tiefer und weicher
// Glockentöne der Sterne 1–6 des Kleinen Wagens (audio.stern, Ticket 05 von .scratch/kleiner-wagen/): A4 … A5 in der
// Pentatonik der Zieltöne, Stern 1 der tiefste; über dem Akkord der Strahlen, unter dem Glitzern
const STERN_HZ = [440, 493.88, 554.37, 659.26, 739.99, 880];
// Schlusston des Polarsterns im Finale (audio.stern(7), Ticket 06): das A des sechsten Sterns, darunter Quinte und
// Oktave, die die steigende Reihe auflösen ([Hz, Anteil der Lautstärke])
const POLAR_HZ = [[880, 1], [659.26, 0.45], [440, 0.6]];
const HALL_WET = 0.55;    // Lautstärke des Halls (HALL_SECONDS: Länge, in src/hall.js)

// im Leerlauf (Safari kennt requestIdleCallback nicht)
const whenIdle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 200 }) : (f) => setTimeout(f, 16);

/**
 * Impulsantwort je Abtastrate, einmal berechnet (Promise auf [links, rechts]): in einem Worker, damit der Hauptthread
 * frei bleibt; ohne Worker in Stücken von etwa 4 ms im Leerlauf.
 */
const hallData = (() => {
  const cache = new Map();
  const inPieces = (rate) => new Promise((resolve) => {
    const steps = hallImpulse(rate, HALL_SECONDS);
    const step = () => {
      const t = performance.now();
      let r;
      do r = steps.next(); while (!r.done && performance.now() - t < 4);
      if (r.done) resolve(r.value); else whenIdle(step);
    };
    whenIdle(step);
  });
  // der Worker lädt sein Modul src/hall-worker.ts (im Build eine eigene Datei unter assets/)
  const inWorker = (rate) => new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../hall-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => resolve(data);
    worker.onerror = (e) => { e.preventDefault(); reject(e); };
    worker.postMessage(rate);
  });
  return (rate) => {
    if (!cache.has(rate)) {
      let p;
      try { p = inWorker(rate).catch(() => inPieces(rate)); } catch { p = inPieces(rate); }
      cache.set(rate, p);
    }
    return cache.get(rate);
  };
})();
// gleich beim Laden, auf Verdacht für die häufigste Abtastrate (Windows, Android, iOS); prepare verlangt die des Kontexts
hallData(48000);

const audio = {
  ctx: null,     // erst nach der ersten Geste (unlock); vorher liegt der Kontext angehalten in _ctx bereit
  master: null,  // Gesamtlautstärke (Ton an/aus)
  dry: null,     // direkter Weg
  wet: null,     // Hall
  muted: false,
  _ctx: null,    // vorab angelegt (prepare)
  _shimmerOn: false, _shimmerTimer: 0, // Hintergrund-Glitzern läuft (ab unlock); sein Zeitgeber (0: ruht)

  /**
   * Vorab, ohne Geste: Kontext angehalten anlegen, Knoten aufbauen und die Impulsantwort des Halls (hallData, seit dem
   * Laden im Worker berechnet) an den Convolver hängen. Das alles hielt früher beim ersten Klick die Seite an (Desktop
   * etwa 0,1 s, mit kaltem Audiogerät 0,4 s; Handy-Emulation mit 4× gedrosselter CPU 0,4–0,6 s), meist genau beim
   * Übergang in den Prolog. Anlegen des Kontexts und Puffer des Convolvers lassen sich nicht teilen (auf langsamen
   * Geräten je 0,1–0,2 s), darum beides nur, solange der Startbildschirm still steht (_quiet, Aufruf unten). Der
   * Browser warnt in der Konsole, dass der Kontext ohne Geste nicht startet; unlock weckt ihn.
   */
  prepare() {
    if (this._ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this._ctx = new AC();
    if (ctx.state === 'running') ctx.suspend(); // darf er ohne Geste laufen: bis zum ersten Klick trotzdem ruhen
    const comp = ctx.createDynamicsCompressor(); // fängt Spitzen ab, wenn viele Töne zusammenkommen
    comp.threshold.value = -14; comp.ratio.value = 3;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(comp);
    this.dry = ctx.createGain();
    this.dry.connect(this.master);
    const reverb = ctx.createConvolver();
    this.wet = ctx.createGain();
    this.wet.gain.value = 0; // bis der Hall da ist (ein Convolver ohne Puffer schweigt)
    this.wet.connect(reverb);
    reverb.connect(this.master);
    // der Puffer des Convolvers kostet für sich mehr als die ganze Berechnung
    hallData(ctx.sampleRate).then((data) => this._quiet(() => {
      const buf = ctx.createBuffer(2, data[0].length, ctx.sampleRate);
      data.forEach((d, ch) => buf.getChannelData(ch).set(d)); // copyToChannel fehlt dem alten webkitAudioContext
      reverb.buffer = buf;
      // Klick vor dem Hall: weich dazublenden (Töne, die schon klingen, kommen allmählich in den Hall)
      if (ctx.state === 'running') this.wet.gain.setTargetAtTime(HALL_WET, ctx.currentTime, 0.4);
      else this.wet.gain.value = HALL_WET;
    }));
  },

  /** Beim ersten Klick/Tastendruck: den vorbereiteten Kontext wecken und das Hintergrund-Glitzern starten. */
  unlock() {
    // Ohne echte Nutzergeste verweigert der Browser den Ton (und warnt) – dann später erneut
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    if (this.ctx) { this._sync(); return; }
    this.prepare(); // Klick vor der Vorbereitung: Kontext jetzt, der Hall kommt nach
    if (!this._ctx) return;
    this.ctx = this._ctx;
    this.master.gain.value = this.muted ? 0 : 0.9;
    this._sync(); // in der Geste wecken (stumm: bleibt angehalten, bis der Ton angeht)
    this._startShimmer();
  },

  /**
   * Was die Seite länger anhält, nur an einer ruhigen Stelle (ruhe): vor der Enthüllung des Startbildschirms (wartet auf
   * die Schrift) gleich, sonst an der nächsten (nach der Enthüllung, im Prolog beim Warten auf Tippen …), dann im
   * Leerlauf. Ohne Startbildschirm sofort.
   */
  _quiet(f) {
    if (!ui.intro.classList.contains('go') && flow.state === 'intro') f();
    else ruhe.warte().then(() => whenIdle(() => (ruhe.jetzt() ? f() : this._quiet(f))));
  },

  /**
   * Hintergrund: kein Dauerton, sondern vereinzelte, leise Glastöne mit langem Hall –
   * wie Lichtreflexe im Raum. Alle paar Sekunden ein Ton, manchmal ein zweiter dazu.
   */
  _startShimmer() {
    this._shimmerOn = true;
    this._shimmerResume();
  },
  /**
   * Nächsten Glitzerton planen. Im Hintergrund-Tab oder stumm ruht der Zeitgeber ganz (kein Ton zu hören, der Kontext
   * steht dann ohnehin); _sync plant wieder, sobald der Tab sichtbar bzw. der Ton an ist.
   */
  _shimmerResume(delay = 2000) {
    if (!this._shimmerOn || this._shimmerTimer || this.muted || document.hidden) return;
    const tick = () => {
      this._shimmerTimer = 0;
      if (this.muted || document.hidden) return; // ruhen bis _sync
      if (this.ctx.state === 'running') {
        const pick = () => SHIMMER_HZ[Math.floor(Math.random() * SHIMMER_HZ.length)];
        const opts = { gain: 0.012 + Math.random() * 0.01, attack: 0.02, decay: 3.5 + Math.random() * 1.5,
          partials: [[1, 1], [2.76, 0.12]], wet: 1.2 };
        this._bell(pick(), opts);
        if (Math.random() < 0.35) this._bell(pick(), { ...opts, when: 0.25 + Math.random() * 0.5, gain: opts.gain * 0.7 });
      }
      this._shimmerResume(2500 + Math.random() * 4000);
    };
    this._shimmerTimer = setTimeout(tick, delay);
  },

  setMuted(m) {
    this.muted = m;
    einstellungen.setStumm(m);
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.08);
    this._sync();
  },

  /**
   * Kontext laufen lassen oder anhalten: stumm oder Tab im Hintergrund → suspend (spart CPU).
   * Weckt auch iOS' "interrupted" (Anruf, App-Wechsel).
   */
  _sync() {
    if (!this.ctx) return;
    const run = !this.muted && !document.hidden;
    clearTimeout(this._suspendTimer);
    if (run && this.ctx.state !== 'running') this.ctx.resume();
    // erst nach dem Ausblenden anhalten, sonst knackt es
    if (!run && this.ctx.state === 'running') this._suspendTimer = setTimeout(() => this.ctx.suspend(), 300);
    if (run) this._shimmerResume(); // Glitzern ruhte (Tab verborgen oder stumm)
  },

  /** Eigener Ausgang für eine Tonfolge, die sich als Ganzes abbrechen lässt (Lösungsmoment). */
  bus() {
    if (!this.ctx) return null;
    const dry = this.ctx.createGain(), wet = this.ctx.createGain();
    dry.connect(this.dry); wet.connect(this.wet);
    return {
      dry, wet,
      fadeOut: () => {
        const t = this.ctx.currentTime;
        dry.gain.setTargetAtTime(0, t, 0.05); wet.gain.setTargetAtTime(0, t, 0.05);
        setTimeout(() => { dry.disconnect(); wet.disconnect(); }, 600); // Knoten freigeben
      },
    };
  },

  /**
   * Glockenartiger Ton aus wenigen Teiltönen.
   * partials: [[Verhältnis, Lautstärke], …] · decay: Abklingzeit (s) · wet: Hallanteil
   */
  _bell(hz, { when = 0, gain = 0.1, attack = 0.005, decay = 1.8, partials = [[1, 1]], wet = 0.5, out = null } = {}) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime + when;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(1e-4, t + attack + decay);
    const send = ctx.createGain();
    send.gain.value = wet;
    env.connect(out ? out.dry : this.dry);
    env.connect(send).connect(out ? out.wet : this.wet);
    for (const [ratio, g] of partials) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.value = hz * ratio;
      og.gain.value = g;
      o.connect(og).connect(env);
      o.start(t);
      o.stop(t + attack + decay + 0.05);
    }
  },

  /** Drehen: kurzer, glasiger Klang (unharmonische Teiltöne wie bei angeschlagenem Glas). */
  rotate() {
    const hz = GLASS_HZ[Math.floor(Math.random() * GLASS_HZ.length)];
    this._bell(hz, { gain: 0.035, decay: 0.45, partials: [[1, 1], [2.76, 0.3], [5.4, 0.1]], wet: 0.8 });
  },

  /** Ein Schritt der Führung ist geschafft (fuehrung.geschafft): zwei leise, helle Glockentöne aufwärts. */
  schritt() {
    const glocke = [[1, 1], [2, 0.14]];
    this._bell(STERN_HZ[3], { gain: 0.026, attack: 0.004, decay: 1.1, partials: glocke, wet: 0.7 });
    this._bell(STERN_HZ[5], { when: 0.09, gain: 0.02, attack: 0.004, decay: 1.4, partials: glocke, wet: 0.8 });
  },

  /** Ziel getroffen: Ton passend zur Farbe. */
  hit(color, when = 0, { octave = 1, gain = 0.07, out = null } = {}) {
    const hz = TONE_HZ[color];
    if (hz) this._bell(hz * octave, { when, gain, out, decay: 2.2, partials: [[1, 1], [2, 0.22], [3.01, 0.06]] });
  },

  /**
   * Ein Stern des Kleinen Wagens erwacht (k: 1 … 6, STERN_HZ): ein leiser Glockenton mit unharmonischem Teilton, lang
   * und mit viel Hall. k = 7: der Schlusston des Polarsterns im Finale (POLAR_HZ), voller und länger.
   */
  stern(k, when = 0, { gain = 0.05, out = null } = {}) {
    const glocke = [[1, 1], [2, 0.2], [2.76, 0.12], [5.4, 0.04]];
    if (k === wagen.polarstern) {
      for (const [hz, g] of POLAR_HZ) {
        this._bell(hz, { when, gain: gain * 1.2 * g, out, attack: 0.006, decay: 5.5, wet: 0.9, partials: glocke });
      }
      return;
    }
    const hz = STERN_HZ[k - 1];
    if (hz) this._bell(hz, { when, gain, out, attack: 0.004, decay: 3.6, wet: 0.9, partials: glocke });
  },

  /** Level gelöst: Akkord aus allen getroffenen Tönen, getragen von einem tiefen A. */
  chord(colors, when = 0, out = null) {
    const tones = [...new Set(colors.map(c => TONE_HZ[c]).filter(Boolean))];
    const g = 0.09 / Math.sqrt(tones.length + 1);
    for (const hz of tones) {
      this._bell(hz, { when, out, gain: g, attack: 0.06, decay: 4.5, partials: [[1, 1], [2, 0.3], [0.5, 0.25]], wet: 0.7 });
      this._bell(hz * 2, { when: when + 0.04, out, gain: g * 0.35, attack: 0.03, decay: 3.0, wet: 0.9 });
    }
    this._bell(110, { when, out, gain: g * 1.2, attack: 0.1, decay: 5, partials: [[1, 1], [2, 0.4]], wet: 0.6 });
  },
};
audio.muted = einstellungen.stumm(); // Standard (kein Stand, nicht lesbar): Ton an
document.addEventListener('visibilitychange', () => audio._sync());
// Vorbereiten, sobald das erste Bild steht (ui und introCalm gibt es dann)
requestAnimationFrame(() => setTimeout(() => audio._quiet(() => audio.prepare()), 0));

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  audio: () => audio,
});

export { audio };
