// Messwerkzeug und Leistungsanzeige (?perf, Taste F), Bildrate (frameRate) (Ticket 04 von .scratch/umbau/, bis dahin in
// index.html).
import { adaptiveResolution } from './aufloesung.js';
import { APP_VERSION, IS_MOBILE } from './konfiguration.ts';
import { renderer, sceneLoop } from './szene.js';
import { skyTheme } from './himmel/skybox.js';
import { SHOCK_REST_S, shockUniforms } from './brett/brett.js';
import { drag } from './kamera.js';
import { input } from './eingabe.js';
import { flow } from './levelfluss.js';
import { fuehrung } from './fuehrung.js';
import { ui } from './oberflaeche/ui.js';
import { story, uebersicht } from './geschichte/geschichte.js';
import { bildrate, bildrateGrund, RUHE_NACH_MS, ruhetaktAus, ruhtJetzt } from '../logik.js';
import { alsGlobal } from './testschnittstelle.ts';

/* ---------- Messwerkzeug (Spec .scratch/leistung/, Ticket 01) ---------- */

// Abschnitte der Messung: Kennung → [Name auf der Karte, Laden (zählt nicht gegen die Grenzwerte)]
const MESS_ABSCHNITTE = {
  seitenstart: ['Seitenstart', true], // bis die Enthüllung des Startbildschirms beginnt: Die Seite lädt
  laden: ['Laden', true],             // Laden hinter einer Überblendung, vom Code markiert (leistung.markiere('laden'))
  start: ['Startbildschirm'], menue: ['Menü'], uebersicht: ['Übersicht'], prolog: ['Prolog'], einstieg: ['Einstieg'],
  spiel: ['Spiel'], reise: ['Reise'], weltwechsel: ['Weltwechsel'], ankunft: ['Spiel n. Reise'], finale: ['Finale'],
  epilog: ['Epilog'],
};
// Grenzwerte der Spec: p95 der sichtbaren Bildabstände ≤ 16,7 ms mit 10 % Toleranz (rAF-Zeitstempel schwanken), kein
// Bild über 33 ms; auf dem Handy (Poco) p95 der Zeichenzeit ≤ 8 ms bei 60 Bildern/s, mit ?takt=30 (stetige 30 wie unter
// ADR 0006) dieselbe Reserve: ≤ 16 ms
const MESS_GRENZE = { p95: 18.3, bild: 33, get zeichnen() { return frameRate.spielFps <= 30 ? 16 : 8; } };
const MESS_FACH = 0.1, MESS_FAECHER = 2000; // Histogramm: Fächer zu 0,1 ms bis 200 ms, darüber im letzten (max genau)

/**
 * Misst, was man sieht, nicht nur die WebGL-Bilder (perfHud): Eine eigene, leichte rAF-Schleife (starte) misst den
 * Abstand aufeinanderfolgender Display-Frames, unabhängig von frameRate und frame(); ruht die Szene, misst sie weiter. Sie
 * läuft nur mit ?perf oder nach Taste F. Getrennt nach Abschnitten (abschnitt: Startbildschirm,
 * Prolog, Menü, Spiel, Reise …): Ein Abstand zählt zum Abschnitt an seinem Anfang (der Hänger nach dem Klick auf
 * «Klicken zum Starten» gehört zum Startbildschirm). Einstieg, Reise, Weltwechsel und Finale markiert die Geschichte
 * (waehrend), Laden hinter einer Überblendung markiert der Code mit markiere('laden') bzw. waehrend('laden', promise):
 * Es wird getrennt ausgewiesen und zählt nicht gegen die Grenzwerte. Die Messung verfälscht nichts merklich: Histogramme
 * mit festen Fächern (genaue p95 ohne Liste aller Abstände) und ein Ringpuffer für die Anzeige, keine Allokationen pro
 * Bild. Dazu Hänger des Hauptthreads mit Ursache (PerformanceObserver: long-animation-frame, longtask).
 * Zeichenzeit (bildBeginn … bildEnde in frame()): die GPU-Zeit je gerendertem Bild über EXT_disjoint_timer_query_webgl2
 * (fehlt die Erweiterung, wie auf vielen Android-Geräten, bleibt sie leer). Dazu die CPU-Zeit von frame() und die
 * gezeichneten Bilder je Sekunde, auch nur in ruhigen Zeiten (ohne Tweens, ohne Einblenden des Himmels). Die Proben
 * lesen die Werte über window.__prisma.leistung.daten(). Den Referenzdurchlauf mit Ergebniskarte und Dauerlast (Tickets
 * 01 und 08 der Leistung) gibt es nicht mehr (ADR 0008).
 */
const leistung = {
  aktiv: false,
  schleife: 0,        // Nummer der laufenden Messschleife (starte, stoppe)
  prev: null,        // rAF-Zeitstempel des letzten Display-Frames (null: neu anfangen, etwa nach verstecktem Tab)
  teil: null,         // Messwerte des Abschnitts ab dem letzten Frame (neuerTeil)
  teile: new Map(),   // Kennung → Messwerte, in der Reihenfolge des ersten Auftretens
  wechsel: [],        // [Zeit, Kennung] je Abschnittswechsel: Hänger kommen erst später an (teilBei)
  marken: [],         // Abschnitte, die der Code markiert (markiere), der jüngste gilt
  ladend: 0,          // markiertes Laden hinter einer Überblendung (geht allen Abschnitten vor)
  ring: new Float32Array(256), ringPos: 0, ringN: 0, sortiert: new Float32Array(256), // Anzeige: jüngste Abstände (Takt)
  schlimmste: [],     // die längsten Abstände { ms, id, t }
  haenger: [],        // die längsten long-animation-frames { ms, id, t, ursache }
  hudZeit: 0,
  gl: null, timer: null, abfragen: [], abfrageNeu: 0, abfrageAlt: 0, abfrageLaeuft: false, // GPU-Zeit
  ruhig: false,       // beim letzten Display-Frame: keine Tweens, der Himmel blendet nicht ein (gez/s ruhig)
  modell: '',         // Gerät laut navigator.userAgentData (Android: Modell), sobald bekannt

  starte() {
    if (this.aktiv) return;
    this.aktiv = true;
    this.prev = null;
    // je Start eine eigene Schleife: Eine alte, die nach stoppe noch ein Bild wartet, endet dort
    const nr = ++this.schleife, loop = (ts) => {
      if (nr !== this.schleife) return;
      this.tick(ts);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    if (this.gl) return; // eingerichtet beim ersten Start
    this.gl = renderer.getContext();
    this.timer = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (this.timer) for (let i = 0; i < 8; i++) this.abfragen.push({ q: this.gl.createQuery(), teil: null, offen: false });
    document.addEventListener('visibilitychange', () => { this.prev = null; });
    const typen = window.PerformanceObserver?.supportedEntryTypes ?? [];
    if (typen.includes('long-animation-frame')) {
      new PerformanceObserver((l) => { if (this.aktiv) l.getEntries().forEach((e) => this.haenger1(e)); })
        .observe({ type: 'long-animation-frame', buffered: true });
    }
    if (typen.includes('longtask')) {
      new PerformanceObserver((l) => {
        if (this.aktiv) l.getEntries().forEach((e) => { this.teilBei(e.startTime).longtasks++; });
      })
        .observe({ type: 'longtask', buffered: true });
    }
    navigator.userAgentData?.getHighEntropyValues?.(['model', 'platformVersion'])
      .then((d) => { this.modell = [d.platform, d.platformVersion, d.model].filter(Boolean).join(' '); })
      .catch(() => {});
  },
  /** Taste F blendet die Anzeige aus: Dann ruht auch die Messung (keine Kosten). */
  stoppe() {
    this.aktiv = false;
    this.schleife++;
  },
  /** Ein Display-Frame: den Abstand zum letzten dem Abschnitt an dessen Anfang zuschlagen. */
  tick(ts) {
    const id = this.abschnitt();
    if (this.prev !== null && this.teil) {
      this.abstand(this.teil, ts - this.prev, ts);
      if (this.ruhig) this.teil.ruhigMs += ts - this.prev;
    }
    if (this.teil?.id !== id) { this.teil = this.neuerTeil(id); this.wechsel.push([ts, id]); }
    this.prev = ts;
    // ruhig: Es läuft keine Fahrt (Tween) und der Himmel blendet nicht ein oder über (gez/s ruhig: wie viel die Szene
    // zeichnet, wenn sich nichts tut; das Menü zeichnet beim Hineinfahren und beim Einblenden des Himmels 60/s, still 10/s)
    this.ruhig = !story.tweens.length && !skyTheme.moving;
    if (ts - this.hudZeit >= 500) {
      this.hudZeit = ts;
      perfHud.zeige();
    }
  },
  /** Welcher Abschnitt gerade zu sehen ist (nur Lesen von Zuständen, je Display-Frame). */
  abschnitt() {
    if (this.ladend) return 'laden';
    if (flow.state === 'intro') return ui.intro.classList.contains('go') ? 'start' : 'seitenstart';
    if (story.choosing) return uebersicht.offen ? 'uebersicht' : 'menue';
    // die Bühne: Prolog (mit Angebot) oder Epilog (der Grad ist dann schon geschafft, ending)
    if (story.el.dataset.mode === 'scene' && !story.el.classList.contains('hidden')) {
      return story.stand?.geschafft ? 'epilog' : 'prolog';
    }
    return this.marken.length ? this.marken[this.marken.length - 1] : 'spiel';
  },
  /** Abschnitt id markieren, bis die zurückgegebene Funktion aufgerufen wird ('laden': Laden hinter Überblendung). */
  markiere(id) {
    let aus = false;
    if (id === 'laden') {
      this.ladend++;
      return () => { if (!aus) { aus = true; this.ladend--; } };
    }
    this.marken.push(id);
    return () => {
      if (aus) return;
      aus = true;
      const i = this.marken.lastIndexOf(id);
      if (i >= 0) this.marken.splice(i, 1);
    };
  },
  /** Abschnitt id markieren, bis promise erledigt ist; zurück das Promise (wartet wie das ursprüngliche). */
  waehrend(id, promise) { return promise.finally(this.markiere(id)); },

  reihe: () => ({ fach: new Uint32Array(MESS_FAECHER), n: 0, summe: 0, max: 0 }),
  neuerTeil(id) {
    let t = this.teile.get(id);
    if (!t) {
      t = { id, bild: this.reihe(), zeichnen: this.reihe(), cpu: this.reihe(), ueber: 0, gezeichnet: 0, haenger: 0,
        haengerMax: 0, longtasks: 0,
        ruhigMs: 0, gezRuhig: 0 }; // Zeit und gezeichnete Bilder, solange es ruhig war (tick)
      this.teile.set(id, t);
    }
    return t;
  },
  eintragen(r, ms) {
    r.fach[Math.min(MESS_FAECHER - 1, Math.floor(ms / MESS_FACH))]++;
    r.n++;
    r.summe += ms;
    if (ms > r.max) r.max = ms;
  },
  /** Quantil q einer Reihe (obere Kante des Fachs, höchstens max); leer: null. */
  quantil(r, q) {
    if (!r.n) return null;
    const ziel = Math.ceil(r.n * q);
    for (let i = 0, s = 0; i < MESS_FAECHER; i++) {
      s += r.fach[i];
      if (s >= ziel) return i === MESS_FAECHER - 1 ? r.max : Math.min((i + 1) * MESS_FACH, r.max);
    }
    return r.max;
  },
  abstand(teil, ms, ts) {
    this.eintragen(teil.bild, ms);
    this.ring[this.ringPos] = ms;
    this.ringPos = (this.ringPos + 1) % this.ring.length;
    this.ringN++;
    if (ms <= MESS_GRENZE.bild) return;
    teil.ueber++;
    this.bestenliste(this.schlimmste, { ms, id: teil.id, t: ts - ms });
  },
  /** liste: die 8 längsten Einträge (nach ms) behalten. */
  bestenliste(liste, eintrag) {
    liste.push(eintrag);
    liste.sort((a, b) => b.ms - a.ms);
    if (liste.length > 8) liste.length = 8;
  },
  /** Abschnitt zur Zeit t (performance.now) aus den Wechseln; davor der erste. */
  teilBei(t) {
    for (let i = this.wechsel.length - 1; i >= 0; i--) if (this.wechsel[i][0] <= t) return this.teile.get(this.wechsel[i][1]);
    return this.teile.get(this.wechsel[0]?.[1]) ?? this.neuerTeil(this.abschnitt());
  },
  /** Ein long-animation-frame (über 50 ms): zählen und mit Ursache merken (längstes Script, sonst Stil und Layout). */
  haenger1(e) {
    const teil = this.teilBei(e.startTime);
    teil.haenger++;
    teil.haengerMax = Math.max(teil.haengerMax, e.duration);
    const s = [...(e.scripts ?? [])].sort((a, b) => b.duration - a.duration)[0];
    const render = e.renderStart > 0 ? e.startTime + e.duration - e.renderStart : 0;
    const datei = (s?.sourceURL || '').replace(/[?#].*$/, '').split('/').pop();
    const ursache = s
      ? `${s.invoker || s.invokerType}${s.sourceFunctionName ? ` → ${s.sourceFunctionName}` : ''}`
        + `${datei ? ` (${datei}${s.sourceCharPosition >= 0 ? `:${s.sourceCharPosition}` : ''})` : ''}`
        + `: Script ${Math.round(s.duration)} ms, Rendern ${Math.round(render)} ms`
      : `ohne Script, Rendern ${Math.round(render)} ms`;
    this.bestenliste(this.haenger, { ms: e.duration, id: teil.id, t: e.startTime, ursache });
  },

  /** Beginn eines gerenderten Bilds in frame(): Startzeit (0: Messung aus). */
  bildBeginn() { return this.aktiv ? performance.now() : 0; },
  /** Vor dem ersten Zeichnen in frame(): GPU-Zeit messen (fertige Abfragen vorher auslesen). */
  gpuBeginn() {
    if (!this.aktiv || !this.timer || !this.teil) return;
    this.abfragenLesen();
    const a = this.abfragen[this.abfrageNeu];
    if (a.offen) return; // alle Abfragen noch unterwegs: dieses Bild nicht
    this.gl.beginQuery(this.timer.TIME_ELAPSED_EXT, a.q);
    a.offen = true;
    a.teil = this.teil;
    this.abfrageLaeuft = true;
    this.abfrageNeu = (this.abfrageNeu + 1) % this.abfragen.length;
  },
  /** Ende eines gerenderten Bilds (t0 aus bildBeginn): CPU-Zeit, GPU-Abfrage schliessen. */
  bildEnde(t0) {
    if (!t0 || !this.teil) return;
    const teil = this.teil;
    this.eintragen(teil.cpu, performance.now() - t0);
    teil.gezeichnet++;
    if (this.ruhig) teil.gezRuhig++;
    if (this.abfrageLaeuft) {
      this.gl.endQuery(this.timer.TIME_ELAPSED_EXT);
      this.abfrageLaeuft = false;
    }
  },

  /**
   * Fertige GPU-Abfragen der Reihe nach auslesen. Disjunkt (Takt der GPU gestört): Die Ergebnisse aller Abfragen
   * unterwegs sind unbrauchbar, auch die noch nicht fertigen; das Lesen setzt die Meldung zurück, darum gleich alle.
   */
  abfragenLesen() {
    const gl = this.gl, n = this.abfragen.length;
    if (gl.getParameter(this.timer.GPU_DISJOINT_EXT)) for (const a of this.abfragen) a.teil = null;
    for (let k = 0; k < n; k++) {
      const a = this.abfragen[this.abfrageAlt];
      if (!a.offen || !gl.getQueryParameter(a.q, gl.QUERY_RESULT_AVAILABLE)) return;
      if (a.teil) this.eintragen(a.teil.zeichnen, gl.getQueryParameter(a.q, gl.QUERY_RESULT) / 1e6);
      a.offen = false;
      this.abfrageAlt = (this.abfrageAlt + 1) % n;
    }
  },

  /**
   * Bildschirmtakt (Hz) aus den jüngsten Abständen der Display-Frames (für die Anzeige): der Median. frameRate.vsync
   * misst nur, solange das Spiel zeichnet, und nimmt das 10-%-Quantil (schätzt bei 60 Hz eher 61). Hält die Grafik
   * den Takt dauernd nicht, ruft der Browser rAF seltener auf: Dann ist das der erreichte Takt, nicht der des
   * Bildschirms (das Ziel der Anzeige rechnet darum nicht damit, perfHud.ziel). null: noch zu wenige Abstände.
   */
  bildschirmHz() {
    const n = Math.min(this.ringN, this.ring.length);
    if (n < 10) return null;
    const s = this.sortiert.subarray(0, n);
    s.set(this.ring.subarray(0, n));
    return 1000 / s.sort()[n >> 1];
  },

  /** Alle Messwerte als Daten (Testschnittstelle). */
  daten() {
    const q = (r, x) => this.quantil(r, x);
    const abschnitte = [...this.teile.values()].filter((t) => t.bild.n || t.gezeichnet).map((t) => {
      const [name, laden = false] = MESS_ABSCHNITTE[t.id];
      const p95 = q(t.bild, 0.95), zeichnenP95 = q(t.zeichnen, 0.95);
      return { id: t.id, name, laden, bilder: t.bild.n, sekunden: t.bild.summe / 1000, p50: q(t.bild, 0.5), p95,
        max: t.bild.max, ueber33: t.ueber, zeichnenP95, zeichnenMax: t.zeichnen.max, zeichnenN: t.zeichnen.n,
        cpuP95: q(t.cpu, 0.95), cpuMax: t.cpu.max, gezeichnet: t.gezeichnet,
        gezeichnetJeS: t.bild.summe ? t.gezeichnet / t.bild.summe * 1000 : 0,
        // ruhig: erst ab einer halben Sekunde Ruhe im Abschnitt (sonst «–»)
        ruhigSekunden: t.ruhigMs / 1000, gezeichnetRuhigJeS: t.ruhigMs >= 500 ? t.gezRuhig / t.ruhigMs * 1000 : null,
        haenger: t.haenger,
        haengerMax: t.haengerMax, longtasks: t.longtasks,
        fluessig: laden ? null : t.bild.n === 0 || p95 <= MESS_GRENZE.p95 && t.ueber === 0,
        zeichnenOk: zeichnenP95 === null ? null : zeichnenP95 <= MESS_GRENZE.zeichnen };
    });
    // alle Abschnitte ausser Laden zusammen, und der Takt aus dem Median aller Abstände
    const gesamt = this.reihe(), alle = this.reihe(), zeichnen = this.reihe();
    let ueber = 0;
    for (const t of this.teile.values()) {
      for (let i = 0; i < MESS_FAECHER; i++) {
        alle.fach[i] += t.bild.fach[i];
        if (!MESS_ABSCHNITTE[t.id][1]) { gesamt.fach[i] += t.bild.fach[i]; zeichnen.fach[i] += t.zeichnen.fach[i]; }
      }
      alle.n += t.bild.n;
      if (MESS_ABSCHNITTE[t.id][1]) continue;
      gesamt.n += t.bild.n; gesamt.summe += t.bild.summe; gesamt.max = Math.max(gesamt.max, t.bild.max);
      zeichnen.n += t.zeichnen.n; zeichnen.max = Math.max(zeichnen.max, t.zeichnen.max);
      ueber += t.ueber;
    }
    alle.max = Math.max(...[...this.teile.values()].map((t) => t.bild.max), 0);
    const median = q(alle, 0.5), size = renderer.getDrawingBufferSize(new THREE.Vector2());
    return {
      version: APP_VERSION, zeit: new Date().toISOString(), gpuZeit: !!this.timer, // Zeichenzeit gemessen (Timer)
      geraet: { ua: navigator.userAgent, modell: this.modell, gpu: perfHud.gpu, mobil: IS_MOBILE,
        bildschirm: `${screen.width}×${screen.height}`, fenster: `${Math.round(innerWidth / SEITE)}×${Math.round(innerHeight / SEITE)}`, seite: SEITE,
        pixelverhaeltnis: devicePixelRatio, render: `${size.x}×${size.y}`, renderPixel: renderer.getPixelRatio(),
        adaptiv: adaptiveResolution.scale, umbauten: adaptiveResolution.changes || 0,
        spielFps: frameRate.spielFps, ruheFps: frameRate.ruheFps, kerne: navigator.hardwareConcurrency ?? null, speicher: navigator.deviceMemory ?? null,
        takt: median ? Math.round(1000 / median) : null, medianMs: median },
      abschnitte,
      gesamt: { bilder: gesamt.n, p95: q(gesamt, 0.95), max: gesamt.max, ueber33: ueber, zeichnenP95: q(zeichnen, 0.95),
        zeichnenMax: zeichnen.max },
      schlimmste: this.schlimmste.map((e) => ({ ...e, abschnitt: MESS_ABSCHNITTE[e.id][0] })),
      haenger: this.haenger.map((e) => ({ ...e, abschnitt: MESS_ABSCHNITTE[e.id][0] })),
    };
  },
};

/* ---------- Leistungsanzeige (Taste F oder ?perf) ---------- */

/**
 * Leistungsanzeige: wie viele Bilder je Sekunde wirklich gezeichnet werden (effektiv, gezählt über die letzte Sekunde)
 * und wie viele das Bild gerade anstrebt (Ziel, mit dem Grund: Spiel, Menü, Himmel, Geschichte, Bühne), dazu der
 * Bildschirmtakt, das p95 der Abstände der gezeichneten Bilder, die Auflösung und die Version. Gezählt werden die Bilder
 * des Spiels (draw) und die der Bühne von Prolog und Epilog (eigene Leinwand, createStoryScene); es gilt die Leinwand,
 * die mehr zeichnet (beim Überblenden zeichnen beide). Neu geschrieben alle 0,5 s aus der Messschleife (leistung.tick),
 * die nur läuft, solange die Anzeige offen ist.
 */
const perfHud = {
  el: document.getElementById('perf'),
  visible: new URLSearchParams(location.search).has('perf'),
  last: performance.now(),
  zeiten: new Float64Array(512), n: 0, // Zeitstempel der gezeichneten Bilder des Spiels (Ring)
  gpu: (() => {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  })(),
  /** Je gerendertem WebGL-Bild (draw): Zeit merken; die Anzeige schreibt zeige. */
  tick() {
    const now = performance.now();
    const ms = now - this.last;
    this.last = now;
    if (ms < 250) this.avgMs = this.avgMs ? this.avgMs * 0.95 + ms * 0.05 : ms; // für __prisma.fps()
    this.zeiten[this.n++ % this.zeiten.length] = now;
  },
  /** Zeitstempel der Bilder des Spiels seit t (aufsteigend). */
  spielSeit(t) {
    const aus = [];
    for (let i = Math.max(0, this.n - this.zeiten.length); i < this.n; i++) {
      const z = this.zeiten[i % this.zeiten.length];
      if (z >= t) aus.push(z);
    }
    return aus;
  },
  /**
   * Was das Bild gerade anstrebt: [Bilder/s, Grund]; Bilder/s null, wo kein WebGL-Bild gezeichnet wird. Fürs Spiel
   * wie frameRate.due (jedes k-te Bildschirmbild, bei 144 Hz also 72), die Bühne zeichnet jedes Bildschirmbild. hz
   * (bildschirmHz) sinkt, wenn die Grafik den Takt dauernd nicht hält: Das Ziel bleibt dann mindestens fps bzw. 60,
   * sonst stünde dort, was erreicht wird, und man sähe den Rückstand nicht.
   */
  ziel(hz) {
    if (story.scene?.running) return [Math.round(Math.max(60, hz)), 'Bühne'];
    if (flow.state === 'intro') return [null, 'Startbildschirm (Animation des Browsers)'];
    if (sceneLoop.covered) return [null, 'verdeckt'];
    if (sceneLoop.started && !sceneLoop.awake) return [0, 'ruht (nichts bewegt sich)'];
    const fps = frameRate.fps(), k = frameRate.teiler(fps);
    return [Math.round(k > 1 ? hz / k : Math.max(fps, hz)), frameRate.grund()];
  },
  zeige() {
    if (!this.visible) return;
    const seit = performance.now() - 1000;
    const spiel = this.spielSeit(seit), buehne = story.scene?.gl?.zeitenSeit(seit) ?? [];
    const bilder = buehne.length > spiel.length ? buehne : spiel;
    const abstaende = bilder.slice(1).map((z, i) => z - bilder[i]).sort((a, b) => a - b);
    const p95 = abstaende.length ? abstaende[Math.min(abstaende.length - 1, Math.floor(abstaende.length * 0.95))] : null;
    const hz = leistung.bildschirmHz() ?? 1000 / frameRate.vsync;
    const [ziel, grund] = this.ziel(hz);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const effektiv = ziel === null && !bilder.length ? '–' : bilder.length;
    const abstand = p95 === null ? '–' : `${p95.toFixed(1)} ms`;
    const adaptiv = `adaptiv ${adaptiveResolution.scale.toFixed(2)}${adaptiveResolution.locked ? ' (gesperrt)' : ''}`;
    // schmal (Handy): knappe Fassung oben links (CSS #perf.schmal), die Bedienung des Spiels bleibt frei
    const schmal = innerWidth / SEITE < 700;
    this.el.classList.toggle('schmal', schmal);
    this.el.textContent = schmal
      ? `${effektiv} Bilder/s · Ziel ${ziel ?? '–'} · ${grund}\n${Math.round(hz)} Hz · p95 ${abstand} · ${adaptiv}\n${APP_VERSION}`
      : `${effektiv} Bilder/s   Ziel ${ziel ?? '–'} · ${grund}\n`
        + `Bildschirm ${Math.round(hz)} Hz · Abstand p95 ${abstand}\n`
        + `Auflösung ${size.x}×${size.y} · ${adaptiv}\n`
        + `Version ${APP_VERSION}`;
  },
  toggle() {
    this.visible = !this.visible;
    this.el.hidden = !this.visible;
    if (this.visible) leistung.starte();
    else leistung.stoppe();
  },
};
perfHud.el.hidden = !perfHud.visible;
if (perfHud.visible) leistung.starte();

window.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'KeyF') perfHud.toggle();
});

/**
 * Bildrate nach Bedarf: Jedes Bild rendert die Szene zweimal (Bodenspiegelung) plus Bloom – das ist fast die ganze
 * Last; die Logik kostet unter 0,1 ms. Das WebGL-Bild läuft mit 60 Bildern/s (spielFps), im Level, im Menü und in den
 * Folgen der Geschichte (ADR 0008; von ADR 0006 bis dahin stetig 30), im ruhenden Level 30 (siehe unten). Steht der Blick im Himmel
 * (Menü, Übersicht), 10 (skyFps); hinter der Bühne, solange sie einblendet, 30. Bewegt sich gar nichts (mit ?t=), ruht die Schleife ganz (sceneLoop). ?takt=30: zum
 * Vergleich wie unter ADR 0006, das Spiel stetig mit 30, die Folgen der Geschichte im WebGL-Bild (Einstieg, Reise,
 * Finale) mit 60 (storyFps, geschichte; ADR 0007).
 * Ruhe-Bildrate (Tickets 01 und 02 der Energie, ADR 0009): Ruht das Level (ruhe), zeichnet es 30 Bilder/s (ruheFps;
 * ?ruhetakt=<n> ab 20, ?ruhetakt=aus oder =60: aus), bei jeder Eingabe oder Bewegung sofort wieder spielFps (rege,
 * zurueck).
 */
const frameRate = {
  spielFps: new URLSearchParams(location.search).get('takt') === '30' ? 30 : 60,
  storyFps: 60,
  // Menü und Übersicht offen, der Blick steht im Himmel: Dort bewegt sich nur noch wenig und langsam (Funkeln der
  // Sterne, Schweben der Kamera; Bestandsaufnahme Ticket 06 der Leistung: je Bild höchstens 5/255 auf unter 0,1 % der
  // Pixel), 10 Bilder/s reichen
  skyFps: 10,
  vsync: 1000 / 60,   // Bildschirmtakt: 10-%-Quantil der rAF-Abstände im letzten Messfenster (übersprungene Bilder sind billig
                      // und kommen genau im Takt; gerenderte können länger dauern)
  windowD: new Float32Array(90), windowN: 0, windowCount: 0, // rAF-Abstände im Messfenster (due)
  prevTs: null,
  skipped: 0,         // rAF-Aufrufe seit dem letzten gerenderten Bild
  gap: 1000 / 60,     // erwarteter Abstand zweier gerenderter Bilder – Budget der adaptiven Auflösung (siehe due)
  ruheFps: null,      // Bilder/s in Ruhe (ruhetaktAus: 30 oder ?ruhetakt=<n>), null: aus (?ruhetakt=aus), stetig spielFps
  ruht: false,        // beim letzten rAF in Ruhe (ruhe): zeichnet ruheFps
  anstoss: -Infinity, // performance.now() der letzten Eingabe oder Bewegung (rege, ruhe)
  ruheLage: { ruheFps: null, spiel: false, seitAnstoss: 0, bewegt: false }, // für ruhtJetzt, ohne Allokation je rAF
  lage: { verdeckt: false, geschichte: false, himmel: false, menue: false, ruht: false, spielFps: 60, storyFps: 60,
    skyFps: 10, ruheFps: null }, // für bildrate und bildrateGrund
  /**
   * Eine Folge der Geschichte im WebGL-Bild läuft (flow.state 'story': Aufstieg, Reise, Fall, Einstieg, Finale, Satz
   * zum Ende des Dorfs), nicht im Menü oder in der Übersicht (choosing) und nicht hinter der Bühne (covered, dort steht
   * nur der Himmel). Am Zustand statt an den Promises der Folgen: Ein abgebrochener Tween (dropTweens, reset) wird nie
   * fertig, ein Zähler bliebe dann stehen und das Spiel bei 60. Ab enterLevel (flow.state 'in') gilt der Takt des Spiels.
   */
  geschichte() { return flow.state === 'story' && !story.choosing && !story.covered; },
  /** Menü oder Übersicht offen, der Blick ganz im Himmel (story.lift), nicht hinter der Bühne; der Himmel blendet nicht
   *  gerade ein, über oder schärft nach (skyTheme.moving: das liefe mit 10 Bildern/s stufig). */
  skyOnly() { return story.choosing && story.gaze >= 1 && !story.covered && !story.tweens.length && !skyTheme.moving; },
  /**
   * Angestrebte Bilder/s jetzt (due: je rAF, darum ohne Allokation). Hinter der Bühne, solange sie einblendet (danach
   * zeichnet das Spiel gar nicht mehr, sceneLoop.covered), höchstens 30 wie vor ADR 0008: Bühne und Spiel zeichnen dann
   * beide, und vom Spiel sieht man kaum noch etwas.
   */
  fps() { return bildrate(this.jetzt()); },
  /** Der Grund zu fps (Leistungsanzeige): Spiel, Ruhe, Menü, Himmel (Menü), Geschichte, hinter der Bühne. */
  grund() { return bildrateGrund(this.jetzt()); },
  /** Die Lage für bildrate und bildrateGrund (src/logik.js; ruht: zuletzt von due bestimmt). */
  jetzt() {
    const z = this.lage;
    z.verdeckt = story.covered;
    z.geschichte = !z.verdeckt && this.geschichte();
    z.himmel = !z.verdeckt && !z.geschichte && this.skyOnly();
    z.menue = story.choosing;
    z.ruht = this.ruht;
    z.spielFps = this.spielFps; z.storyFps = this.storyFps; z.skyFps = this.skyFps; z.ruheFps = this.ruheFps;
    return z;
  },
  /**
   * Was das Auge im ruhenden Level verfolgen würde (Text) oder false. Das Schweben der Kamera, das Fliessen der
   * Strahlen, das Drehen und Atmen der Ziele und die Himmel samt Fischen, Glühwürmchen, Funken und Planeten bleiben Ruhe
   * (Wunsch des Nutzers; Ticket 02 der Energie: auf dem Poco wirkte mit 30 in keiner Welt etwas stufig);
   * keine Ruhe sind: der Finger oder die Maustaste unten (Ziehen, Halten, zwei Finger), alles in sceneLoop.pending
   * (Drehen, Puls, Wackeln, Hover, Ziele, die aufleuchten, wachsende Strahlen, Feier, Herauswachsen, Überblenden des
   * Himmels oder Bretts, Kamera nach dem Ziehen, Zoomen oder beim Rückflug), der Wechsel der Führung und ihre Hand und
   * die Lichtwelle samt Nachwirkung auf dem Brett.
   */
  bewegt() {
    if (drag.active || input.pointer || input.pinch) return 'Eingabe';
    if (fuehrung.wechselt || fuehrung.hand) return 'Führung';
    if (shockUniforms.uShockT.value < SHOCK_REST_S) return 'Lichtwelle';
    return sceneLoop.pending();
  },
  /**
   * Ruht das Level (ruhtJetzt)? Im Level (flow 'play', weder Menü, Übersicht noch Bühne), RUHE_NACH_MS nach der letzten
   * Eingabe oder Bewegung, und es bewegt sich nichts, das man anschaut (bewegt). Eine Bewegung zählt wie eine Eingabe:
   * Nach ihrem Ende bleibt der volle Takt noch RUHE_NACH_MS. Mit ?ruhetakt=aus nie (stetig wie unter ADR 0008).
   */
  ruhe(ts) {
    if (this.ruheFps === null) return false;
    const z = this.ruheLage;
    z.ruheFps = this.ruheFps;
    z.spiel = flow.state === 'play' && !story.choosing && !story.covered && !sceneLoop.covered;
    z.seitAnstoss = ts - this.anstoss;
    z.bewegt = z.spiel && z.seitAnstoss >= RUHE_NACH_MS ? this.bewegt() : false;
    if (z.bewegt) this.anstoss = ts;
    return ruhtJetzt(z);
  },
  /** Eingabe oder Anstoss (sceneLoop.wake): ruhte das Level, das nächste Bildschirmbild gleich mit dem vollen Takt. */
  rege() {
    this.anstoss = performance.now();
    if (this.ruht) { this.ruht = false; this.zurueck(); }
  },
  /** Aus der Ruhe zurück: jetzt zeichnen, nicht erst im nächsten Ruhe-Takt; der längere Abstand davor ist kein langsames Bild. */
  zurueck() {
    this.skipped = Infinity;
    adaptiveResolution.skip = Math.max(adaptiveResolution.skip, 1);
  },
  /**
   * Jedes wievielte Bildschirmbild für fps gerendert wird (k). So bleibt der Takt gleichmässig (kein Wechsel 14/21 ms):
   * 60 Bilder/s bei 60 Hz alle, bei 75/90 Hz ebenfalls alle, bei 120/144 Hz jedes zweite (60/72), bei 165 Hz jedes dritte
   * (55). Schafft die Grafik den Takt nicht, kommen die rAF-Aufrufe ohnehin seltener.
   */
  teiler(fps) { return Math.max(1, Math.floor(1000 / this.vsync / fps + 0.34)); },
  /** true = dieses rAF-Ereignis rendern (jedes k-te Bildschirmbild, teiler). */
  due(ts) {
    if (this.prevTs !== null) {
      const d = ts - this.prevTs;
      if (d > 2 && d < 100) this.windowD[this.windowN++] = d;
      if (++this.windowCount >= 90) {
        // nicht der kürzeste Abstand, sondern das 10-%-Quantil: Nach einem langen Bild holt rAF auf (z. B. 21 und dann
        // 12 ms bei 60 Hz). Der kürzeste hielt dann 12 ms für den Takt, k wurde 3 statt 2 (20 statt 30 Bilder/s), und
        // adaptiveResolution wertete jedes Bild als langsam (50 ms bei einem Budget von 3 × 12 ms): Absenkung im ersten
        // Level ohne ein langes sichtbares Bild (Ticket 03 der Leistung)
        if (this.windowN) this.vsync = this.windowD.subarray(0, this.windowN).sort()[Math.floor(this.windowN * 0.1)];
        this.windowN = 0; this.windowCount = 0;
      }
    }
    this.prevTs = ts;
    const ruht = this.ruhe(ts);
    if (ruht !== this.ruht) { this.ruht = ruht; if (!ruht) this.zurueck(); }
    const fps = this.fps(), k = this.teiler(fps);
    // k > 1: übersprungene, billige Aufrufe zeigen den echten Takt – Budget = tatsächlicher Abstand (50 Hz: 40 ms).
    // k = 1: der gemessene Takt kann von einer überlasteten Grafik stammen – dann gilt das Ziel-Budget.
    this.gap = k > 1 ? k * this.vsync : 1000 / fps;
    if (++this.skipped < k) return false;
    this.skipped = 0;
    return true;
  },
};
frameRate.ruheFps = ruhetaktAus(new URLSearchParams(location.search).get('ruhetakt'), frameRate.spielFps);
// Eingaben wecken die Hauptschleife (sceneLoop): Drücken, Ziehen und Hover (pointermove), Loslassen, Rad, Tasten
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'touchstart']) {
  window.addEventListener(type, () => sceneLoop.wake(), { passive: true, capture: true });
}
window.addEventListener('resize', () => sceneLoop.wake(true)); // Render-Targets neu: aufwärmen
document.addEventListener('visibilitychange', () => sceneLoop.wake());

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  frameRate: () => frameRate, leistung: () => leistung, MESS_ABSCHNITTE: () => MESS_ABSCHNITTE,
  perfHud: () => perfHud, RUHE_NACH_MS: () => RUHE_NACH_MS,
});

export { frameRate, leistung, perfHud };
