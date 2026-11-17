// Lösungsmoment und Levelfluss: Feier, Übergänge zwischen den Leveln, Fortschritt (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { audio } from './ton.js';
import { BOARD, CELL, LOOK, PLATE } from './konfiguration.js';
import { arbeit, compileParallel, LAYER_NO_REFLECT, markShadowsDirty, renderer, scene, sceneLoop } from './szene.js';
import { SHOCK_SPEED, shockUniforms } from './brett/brett.js';
import { bloomPass } from './bildschritte.js';
import { cameraGoHome } from './kamera.js';
import { COLOR_RGB } from './brett/elemente.js';
import { boardGroup, cubeView, game, loadLevel, prepareLevel } from './brett/feld.js';
import { beamView, WHITE } from './brett/strahlen.js';
import { input, setHovered } from './eingabe.js';
import { fuehrung } from './fuehrung.js';
import { ui } from './oberflaeche/ui.js';
import { story } from './geschichte/geschichte.js';
import { adaptiveResolution } from './aufloesung.js';
import { mulberry32 } from '../zufall.js';
import { LEVELS, LEVELS_3D, STORY_LEVELS } from '../logik.js';
import { alsGlobal } from './testschnittstelle.ts';

/* =====================================================================
   LÖSUNGSMOMENT — die Ziele leuchten nacheinander auf (mit ihren Tönen),
   dann erklingt der Akkord: Bloom pulsiert, eine Lichtwelle läuft über die
   Platte und es regnet Funken in den Zielfarben. Danach "Level gelöst".
   Im Würfel ist die Welle eine Kugelschale aus der Würfelmitte (der Rahmen
   leuchtet auf, wenn sie ihn durchquert) und die Funken sprühen aus den Zielen.
   ===================================================================== */

const CELEBRATE = {
  step: 0.2,          // Sekunden zwischen dem Aufleuchten zweier Ziele
  chordPause: 0.12,   // nach dem letzten Ziel bis zum Akkord
  panelDelay: 1.2,    // nach dem Akkord bis "Level gelöst"
  bloomBoost: 1.1,    // Bloom-Stärke steigt kurz um diesen Faktor
  shockSpeed: SHOCK_SPEED, // Welteinheiten pro Sekunde
  shockWidth: 0.16,
  shockReach: PLATE * 0.72, // läuft bis über die Plattenecken
  shellReach: 1.1,    // Würfel: Kugelschale bis 1.1 × Kantenlänge (über die Ecken bei 0.87)
  particles: 300,
};

/** Funkenregen: CPU-animierte Punkte, additiv; nur aktiv, solange Funken leben. */
function createSparkRain(count) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), alpha = new Float32Array(count);
  const size = new Float32Array(count);
  const rand = mulberry32(23);
  for (let i = 0; i < count; i++) size[i] = 0.6 + rand() * 1.0;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: renderer.getPixelRatio() } },
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
        gl_PointSize = aAlpha <= 0.0 ? 0.0 : aSize * 2.6 * uPixelRatio * (20.0 / -mv.z);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.0, length(c));
        gl_FragColor = vec4(vColor * a * a, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.visible = false;
  points.layers.set(LAYER_NO_REFLECT);
  points.raycast = () => {};
  scene.add(points);
  const sparks = Array.from({ length: count }, () => ({ life: 0, max: 1, vx: 0, vy: 0, vz: 0 }));
  return {
    points, sparks, alive: 0, rand,
    drag: 0, // Luftwiderstand (1/s): nur beim Feuerwerk im Würfel
    /** Funken über dem Feld verteilen; sie starten gestaffelt (delay) und fallen sanft. */
    burst(colors) {
      this.drag = 0;
      const p = geo.attributes.position.array, cl = geo.attributes.aColor.array;
      for (let i = 0; i < count; i++) {
        const s = sparks[i], c = COLOR_RGB[colors[i % colors.length]];
        p[i * 3] = (rand() - 0.5) * BOARD * 1.05;
        p[i * 3 + 1] = 0.9 + rand() * 2.0; // knapp über dem Feld – höher wirkt es wie ein Sternenhimmel
        p[i * 3 + 2] = (rand() - 0.5) * BOARD * 1.05;
        s.vx = (rand() - 0.5) * 0.25; s.vz = (rand() - 0.5) * 0.25; s.vy = -(0.25 + rand() * 0.5);
        s.max = 2.0 + rand() * 1.6;
        s.life = -rand() * 0.9; // negativ = wartet noch
        const hot = 1.0 + rand() * 1.2; // HDR: die hellsten Funken blühen
        cl[i * 3] = c.r * hot; cl[i * 3 + 1] = c.g * hot; cl[i * 3 + 2] = c.b * hot;
      }
      geo.attributes.aColor.needsUpdate = true;
      this.alive = count;
      points.visible = true;
    },
    /**
     * Würfel: Feuerwerk – aus jedem Ziel (origins, Weltpositionen) sprühen Funken seiner Farbe in alle Richtungen,
     * werden von der Luft gebremst und sinken dann ab.
     */
    burstFrom(origins, colors) {
      this.drag = 1.8;
      const p = geo.attributes.position.array, cl = geo.attributes.aColor.array;
      for (let i = 0; i < count; i++) {
        const s = sparks[i], k = i % origins.length, o = origins[k], c = COLOR_RGB[colors[k]];
        const u = rand() * 2 - 1, phi = rand() * 2 * Math.PI, ring = Math.sqrt(1 - u * u), v = 2.5 + rand() * 3.0;
        s.vx = ring * Math.cos(phi) * v; s.vy = u * v + 0.5; s.vz = ring * Math.sin(phi) * v;
        p[i * 3] = o.x; p[i * 3 + 1] = o.y; p[i * 3 + 2] = o.z;
        s.max = 1.6 + rand() * 1.4;
        s.life = -rand() * 0.12;
        const hot = 1.0 + rand() * 1.2;
        cl[i * 3] = c.r * hot; cl[i * 3 + 1] = c.g * hot; cl[i * 3 + 2] = c.b * hot;
      }
      geo.attributes.aColor.needsUpdate = true;
      this.alive = count;
      points.visible = true;
    },
    update(dt, t) {
      if (!this.alive) return;
      const p = geo.attributes.position.array, a = geo.attributes.aAlpha.array;
      let alive = 0;
      for (let i = 0; i < count; i++) {
        const s = sparks[i];
        if (s.life >= s.max) { a[i] = 0; continue; }
        s.life += dt;
        alive++;
        if (s.life < 0) { a[i] = 0; continue; }
        if (this.drag) { const f = Math.exp(-this.drag * dt); s.vx *= f; s.vy *= f; s.vz *= f; }
        s.vy -= 0.35 * dt; // leichte Schwerkraft, die Luft bremst
        p[i * 3] += (s.vx + Math.sin(t * 1.3 + i) * 0.08) * dt;
        p[i * 3 + 1] += s.vy * dt;
        p[i * 3 + 2] += s.vz * dt;
        if (p[i * 3 + 1] < 0.03) { p[i * 3 + 1] = 0.03; s.vy = 0; s.vx *= 0.5; s.vz *= 0.5; } // am Boden verglühen
        const k = s.life / s.max;
        const twinkle = 0.75 + 0.25 * Math.sin(t * 17 + i * 3.1);
        a[i] = Math.min(1, s.life * 6) * (1 - k * k) * twinkle;
      }
      this.alive = alive;
      points.visible = alive > 0;
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    },
    stop() { for (const s of sparks) if (s.life < 0) s.life = s.max; }, // wartende Funken verwerfen
  };
}

/**
 * Würfel: Lichtwelle als Kugelschale aus der Würfelmitte. Leuchtet am Rand (Fresnel), innen kaum – so bleibt der
 * Würfel durch sie hindurch sichtbar. Wo sie die Platte schneidet, läuft der Bodenring der 2D-Welle mit.
 */
function createShockShell() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uStrength: { value: 0 } },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        gl_FragColor = vec4(uColor * pow(rim, 5.0) * 2.4 * uStrength, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat);
  shell.visible = false;
  shell.frustumCulled = false;
  shell.raycast = () => {};
  shell.layers.set(LAYER_NO_REFLECT);
  boardGroup.add(shell);
  return shell;
}

const celebration = {
  active: false,
  t: 0,
  chordAt: 0,
  steps: [],          // [{ obj, at, done }]
  chordDone: false,
  panelShown: false,
  colors: [],
  rain: createSparkRain(CELEBRATE.particles),
  shell: createShockShell(),

  start(targets) {
    // Reihenfolge: von links hinten nach rechts vorn – eine Welle wie beim Levelwechsel
    const order = [...targets].sort((a, b) => waveDelay(a.userData.element) - waveDelay(b.userData.element));
    this.steps = order.map((obj, i) => ({ obj, at: i * CELEBRATE.step, done: false }));
    this.chordAt = (order.length - 1) * CELEBRATE.step + CELEBRATE.chordPause;
    this.colors = order.map(o => o.userData.element.color);
    this.t = 0;
    this.active = true;
    sceneLoop.wake();
    this.chordDone = this.panelShown = false;
    // Hell, etwas höher als beim Treffer: die Ziele "antworten" nacheinander
    // Eigener Ausgang: beim Abbrechen verstummen auch die schon geplanten Töne und der Akkord
    if (this.sound) this.sound.fadeOut();
    const out = this.sound = audio.bus();
    this.steps.forEach((s) => audio.hit(s.obj.userData.element.color, s.at, { octave: 2, gain: 0.04, out }));
    audio.chord(this.colors, this.chordAt, out);
    adaptiveResolution.hold(this.chordAt + 3); // Funken und Bloom-Puls nicht als Leistungsproblem werten
  },

  cancel() {
    if (this.active && this.sound) { this.sound.fadeOut(); this.sound = null; }
    this.active = false;
    this.rain.stop();
    this.endWave();
    bloomPass.strength = LOOK.bloomStrength;
  },
  /** Lichtwelle aus: Bodenring, Kugelschale und Leuchten des Würfelrahmens. */
  endWave() {
    shockUniforms.uShock.value.y = 0;
    this.shell.visible = false;
    cubeView.glow(0);
  },

  update(dt, t) {
    this.rain.update(dt, t);
    if (!this.active) return;
    this.t += dt;
    for (const s of this.steps) if (!s.done && this.t >= s.at) { s.done = true; s.obj.userData.flash = 1; }
    if (!this.chordDone && this.t >= this.chordAt) {
      this.chordDone = true;
      arbeit.merke('Lichtwelle');
      if (cubeView.size) this.rain.burstFrom(this.steps.map(s => s.obj.userData.gem.getWorldPosition(new THREE.Vector3())), this.colors);
      else this.rain.burst(this.colors);
      // Wellenfarbe: Mischung der Zielfarben, hell genug zum Blühen
      const c = shockUniforms.uShockColor.value.setRGB(0, 0, 0);
      for (const k of this.colors) c.add(COLOR_RGB[k]);
      c.multiplyScalar(1 / this.colors.length).lerp(WHITE, 0.25).multiplyScalar(0.5);
    }
    const tc = this.t - this.chordAt;
    if (tc >= 0) {
      // Bloom: schneller Anstieg, weiches Abklingen
      const env = tc < 0.12 ? tc / 0.12 : Math.exp(-(tc - 0.12) * 2.0);
      bloomPass.strength = LOOK.bloomStrength * (1 + CELEBRATE.bloomBoost * env);
      const r = tc * CELEBRATE.shockSpeed;
      let fade;
      if (cubeView.size) {
        // Würfel: Kugelschale aus der Mitte bis über die Ecken; am Boden ihr Schnittkreis, der Rahmen leuchtet auf,
        // während sie ihn durchquert (Flächenmitten bei ext/2, Ecken bei ext·√3/2)
        const ext = cubeView.size * CELL, h = cubeView.height * CELL / 2;
        fade = Math.max(0, 1 - r / (ext * CELEBRATE.shellReach));
        this.shell.visible = fade > 0;
        this.shell.position.set(0, h, 0);
        this.shell.scale.setScalar(Math.max(r, 0.01));
        this.shell.material.uniforms.uColor.value.copy(shockUniforms.uShockColor.value);
        this.shell.material.uniforms.uStrength.value = fade * fade;
        const foot = r > h ? Math.sqrt(r * r - h * h) : 0;
        shockUniforms.uShock.value.set(foot, r > h ? fade * fade : 0, CELEBRATE.shockWidth * (1 + foot * 0.12));
        cubeView.glow(THREE.MathUtils.smoothstep(r, ext * 0.4, ext * 0.5) * (1 - THREE.MathUtils.smoothstep(r, ext * 0.6, ext * 0.95)));
      } else {
        fade = Math.max(0, 1 - r / CELEBRATE.shockReach);
        shockUniforms.uShock.value.set(r, fade * fade, CELEBRATE.shockWidth * (1 + r * 0.12));
      }
      if (!this.panelShown && tc >= CELEBRATE.panelDelay) {
        this.panelShown = true;
        ui.showSolved(game.levelIndex, flow.solveStats);
      }
      if (fade <= 0 && env < 0.01 && this.panelShown) {
        this.active = false;
        this.endWave();
        bloomPass.strength = LOOK.bloomStrength;
      }
    }
  },
};

/* =====================================================================
   LEVELFLUSS — Übergänge zwischen den Leveln.
   Beim Wechsel versinken die Elemente als Welle (diagonal über das Feld) im
   Stein, das neue Feld wächst in derselben Welle heraus, dann wachsen die Strahlen.
   ===================================================================== */

const FLOW = {
  outDuration: 0.4,  // Versinken eines Elements
  inDuration: 0.6,   // Herauswachsen eines Elements
  wave: 0.035,       // Versatz je Diagonalschritt (x + z) der Welle
};
const easeInCubic = (x) => x * x * x;
const easeOutBack = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const NO_LIGHT = { segments: [], events: [] }; // leeres Strahlergebnis: alles blendet aus
/**
 * Die Würfel-Level hängen im Spiel hinter den 2D-Leveln (seit Noas Geschichte liegen sie im Vorrat, tools/vorrat.mjs;
 * zurückgeholt zeigt sie die Testschnittstelle zeige). In src/logik.js bleibt LEVELS ohne sie – Tests, Golden-Test und
 * die Werkzeuge der Levelliste sehen nur die 2D-Level.
 */
const CUBE_START = LEVELS.length;
LEVELS.push(...LEVELS_3D);
/**
 * Anzeige der Grade (Feld grad in LEVELS): volle Punkte von GRAD_PUNKTE (●○○○ … ●●●●) und Text in der Kopfzeile, für
 * Screenreader als Text (das Menü hat dieselben Grade und Namen, createMenu). Das Tutorial hat keinen Grad und keine
 * Anzeige.
 */
const GRAD_PUNKTE = 4;
const GRAD_ANZEIGE = {
  'leicht': { label: 'Leicht', punkte: 1 },
  'mittel': { label: 'Mittel', punkte: 2 },
  'schwer': { label: 'Schwer', punkte: 3 },
  'sehr schwer': { label: 'Sehr schwer', punkte: 4 },
};
/** Füllt ein .tier-Element für ein Level mit Punkten und Text; ohne Grad (Tutorial) bleibt es leer und versteckt. */
function fillTier(el, lvl) {
  const d = GRAD_ANZEIGE[lvl.grad];
  el.hidden = !d;
  el.replaceChildren();
  if (!d) return;
  const pips = document.createElement('span'), label = document.createElement('span');
  pips.className = 'pips';
  pips.setAttribute('aria-hidden', 'true');
  for (let k = 0; k < GRAD_PUNKTE; k++) {
    const punkt = document.createElement('i');
    if (k < d.punkte) punkt.className = 'on';
    pips.appendChild(punkt);
  }
  label.className = 'label';
  label.textContent = d.label;
  el.append(pips, label);
}
const flow = {
  state: 'intro', // intro | play | out | in
  t: 0,           // Zeit seit Beginn des aktuellen Übergangs
  next: 0,        // Ziel-Level beim Versinken
  solved: false,  // Lösungsmoment für das aktuelle Feld schon ausgelöst
  record: null,   // neue Bestmarke beim Lösen ({ neueBestzeit, wenigerDrehungen }, story.markSolved) für «Gelöst»
};
const waveDelay = (el) => (el.x + el.z + (el.y || 0)) * FLOW.wave; // Würfel: die Welle steigt auch nach oben
/** Dauer der Welle über ein Feld (Level oder Board; Würfel: drei Achsen, in der Höhe so viele Ebenen wie height). */
const waveLength = (b = game.board) => (2 * ((b.size || 7) - 1)
  + (b.dim === 3 ? (b.height || b.size || 7) - 1 : 0)) * FLOW.wave;

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
  read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  write(key, value) {
    try { localStorage.setItem(key, value); } catch { /* privates Fenster o. Ä. */ }
  },
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
  remove(grad) {
    try { localStorage.removeItem(this.keyOf(grad)); } catch { /* privates Fenster o. Ä. */ }
  },
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

/** Level wechseln: altes Feld versinkt, danach wächst das neue heraus. */
function changeLevel(index) {
  if (flow.state === 'intro' || index < 0 || index >= LEVELS.length) return;
  if (flow.state === 'story' && !story.holdEnter) return; // die Geschichte führt gerade (story.sinkTo darf)
  flow.next = index;
  prepareLevel(index); // die Elemente schon während des Versinkens bauen
  if (flow.state === 'out') return; // versinkt schon – nur das Ziel-Level ändert sich
  sceneLoop.wake();
  flow.state = 'out';
  flow.t = 0;
  flow.solved = false;
  cameraGoHome(); // das neue Feld erscheint wieder aus der Ausgangsansicht
  celebration.cancel();
  ui.hideSolved();
  ui.hideHud();
  // Elemente versinken aus ihrer aktuellen Höhe (auch mitten im Herauswachsen)
  for (const obj of game.objects.values()) obj.userData.appearFrom = obj.scale.x;
  setHovered(null);
  clearTimeout(input.longPressTimer);
  if (input.pointer) input.pointer.el = null;
  beamView.update(NO_LIGHT); // alle Strahlen blenden aus
  // Leuchtkörper erlöschen mit ihren Strahlen (sie hängen an den alten Ereignis-Datensätzen)
  for (const obj of game.objects.values()) {
    const u = obj.userData;
    if (u.element.type === 'target') { u.satisfied = false; u.arrivals = []; }
    if (u.events) u.events = [];
  }
  adaptiveResolution.hold(FLOW.outDuration + waveLength() + 0.2); // Schatten-Updates jeden Frame
}

/** Level neu starten (Knopf, R); während des Versinkens zählt das bereits gewählte Ziel-Level. */
function restartLevel() {
  fuehrung.neustart();
  changeLevel(flow.state === 'out' ? flow.next : game.levelIndex);
}

/** Neues Level aufbauen und als Welle herauswachsen lassen. */
function enterLevel(index) {
  sceneLoop.wake();
  flow.state = 'in';
  flow.t = 0;
  flow.solved = false;
  flow.record = null;
  loadLevel(index, FLOW.inDuration + waveLength(LEVELS[index])); // erst wenn alles steht
  for (const obj of game.objects.values()) obj.scale.setScalar(1e-3);
  fuehrung.neu(index); // beim ersten Schritt (auch nach Neustart und Neuladen)
  ui.showHud(index);
}

/**
 * Einmalig: Shader, die erst später gebraucht werden (Hover-Lichtrand, Funkenregen), jetzt kompilieren.
 * Sonst stockt genau der erste Tipp bzw. der erste Lösungsmoment (auf Mobil-GPUs 10–50 ms).
 */
let shadersWarm = false;
function warmupShaders() {
  if (shadersWarm) return;
  shadersWarm = true;
  const obj = [...game.objects.values()].find(o => o.userData.warmup);
  // stösst in Häppchen an (übersetzt im Hintergrund; in einem Stück hielt es ein Bild auf dem gedrosselten Handy 95 ms
  // an, Ticket 09): der Zustand gilt nur je Häppchen, dazwischen ist er wie vorher
  const warm = () => {
    obj?.userData.warmup(true);
    celebration.rain.points.visible = true;
    return () => {
      obj?.userData.warmup(false);
      celebration.rain.points.visible = celebration.rain.alive > 0;
    };
  };
  compileParallel([scene], { variants: [warm], slices: true, was: 'Level: Shader' });
  // die unsichtbaren Vorwärm-Elemente jeder Art (am Ende, vor compileParallel) bleiben: Sonst übersetzte das erste
  // Level mit einer neuen Art seine Shader mitten im Fall des Lichts (ein Ruck)
}

/** Pro Frame: Übergänge animieren und den Lösungsmoment auslösen bzw. zurücknehmen. */
function updateFlow(dt) {
  if (flow.state === 'intro' || flow.state === 'story') return; // story: die Geschichte führt (Zwischenszene, Karte)
  if (flow.state === 'play') {
    const lit = game.result.solved && game.targets.every(o => o.userData.hit > 0.85);
    if (lit && !flow.solved) {
      flow.solved = true;
      // bis zur lösenden Drehung, nicht bis die Ziele sichtbar leuchten; Drehungen danach zählen nicht mehr
      const st = game.stats;
      flow.solveStats = { turns: st.turns, seconds: st.startedAt === null ? 0 : (st.lastTurnAt - st.startedAt) / 1000 };
      flow.record = story.markSolved(game.levelIndex, flow.solveStats); // neue Bestmarke für «Gelöst»
      celebration.start(game.targets);
    } else if (!game.result.solved && flow.solved) { // wieder verdreht
      flow.solved = false;
      celebration.cancel();
      ui.hideSolved();
    }
    return;
  }
  flow.t += dt;
  const out = flow.state === 'out';
  const dur = out ? FLOW.outDuration : FLOW.inDuration;
  for (const obj of game.objects.values()) {
    const k = Math.min(1, Math.max(0, (flow.t - waveDelay(obj.userData.element)) / dur));
    const s = out ? obj.userData.appearFrom * (1 - easeInCubic(k)) : easeOutBack(k);
    obj.scale.setScalar(Math.max(s, 1e-3)); // nie ganz 0: sonst entartete Normalenmatrix
  }
  markShadowsDirty();
  if (flow.t >= dur + waveLength()) {
    if (out && story.holdEnter) story.sunk(); // Geschichte: das neue Level wächst erst nach ihrer Zwischenszene
    else if (out) enterLevel(flow.next);
    else {
      flow.state = 'play';
      warmupShaders();
      fuehrung.start();
      // drehbare Elemente leuchten einmal kurz auf – als Welle wie beim Herauswachsen
      for (const obj of game.objects.values()) obj.userData.startPulse?.(waveDelay(obj.userData.element) * 1.5);
    }
  }
}

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  celebration: () => celebration, changeLevel: () => changeLevel, enterLevel: () => enterLevel, flow: () => flow,
});

export {
  CELEBRATE, celebration, changeLevel, CUBE_START, enterLevel, fillTier, flow, progress, restartLevel, updateFlow,
};
