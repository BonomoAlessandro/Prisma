// Noas Geschichte: Kapitel, Stationen, Kleiner Wagen, Texte von Prolog und Epilog (Ticket 04 von .scratch/umbau/, bis
// dahin in index.html).
import '../oberflaeche/uebersicht.js';
import { LOOK } from '../konfiguration.ts';
import { camera, LAYER_NO_REFLECT, renderer, scene, sceneLoop } from '../szene.js';
import { stars } from '../himmel/sterne.js';
import { menu, uebersicht } from './geschichte.js';
import { alsGlobal } from '../testschnittstelle.ts';
import { t } from '../../texte/sprache.js';

/* =====================================================================
   NOAS GESCHICHTE — «Ein Lichtsignal an die Sterne», der Ablauf des Spiels (Spec .scratch/noa-geschichte/).
   Noa will aus einem Bergdorf dem Polarstern ein Zeichen schicken. Eine Taschenlampe reicht nicht so weit, doch Licht
   lässt sich weitergeben: Der Spieler reicht es Welt für Welt weiter (ein Kapitel = eine Welt mit ihrer Skybox und
   10 Leveln). Jede Welt weckt dabei einen Stern des Kleinen Wagens (wagen, Spec .scratch/kleiner-wagen/): Am
   Kapitelende steigen die Strahlen der Ziele zum Stern dieser Welt, er erwacht (erwache), und ein Träger nimmt das
   Licht am nächsten Stern vorbei mit in die nächste Welt (travel). Im Finale erwacht der sechste, das Licht läuft über
   die Deichsel zum Polarstern, und er antwortet: Sein Strahl fällt zurück, und im Dorf sieht Noa ihn blinken (Epilog
   auf der Bühne, createStoryScene).
   Nach dem Startbildschirm wählt der Spieler im Menü einen Grad (createMenu, Ticket 05); jeder Grad hat seinen eigenen
   Durchgang (STORY_LEVELS) und seinen eigenen Stand (progress, prisma.noa.*): Platz, gelöste Level, gesehene Momente.
   Prolog und Einstiege in die Welten kommen je Grad nur beim ersten Mal. Nach dem Prolog wählt der Spieler «Üben»
   (Kapitel «Im Dorf», das Tutorial, STORY_DORF) oder «Gleich los». Prolog, Kapitel «Im Dorf» und Einstiege lassen
   sich überspringen, die Reisen nicht (Entscheide 10, 28). Neuladen setzt dort fort, wo der Grad steht.
   Ins Menü geht es mit «Menü» im Spiel (der Stand bleibt) und am Ende des Epilogs; dahinter schaut die Kamera in den
   Himmel. Die Würfel-Level gehören nicht zu dieser Geschichte.
   ===================================================================== */

const STORY_UP = 0.42; // Blick in den Himmel: so hoch über den Horizont (rad), wenn das Kapitel nichts anderes sagt (up)
const STORY_ICONS = {
  dorf: '<path d="M4.5 19.5v-7.5l7.5-6 7.5 6v7.5z"/><path d="M10 19.5V15h4v4.5"/>',
  wald: '<path d="M12 3.5l-5 7h3l-4.5 6.5h13L14 10.5h3z"/><path d="M12 17v3.5"/>',
  meer: '<path d="M2.5 10c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/><path d="M2.5 15.5c2.4-2.2 4.6-2.2 7 0s4.6 2.2 7 0c1.4-1.3 3.6-1.8 5-1"/>',
  wueste: '<path d="M2.5 19.5l7-11 7 11z"/><path d="M9.5 8.5l2.2 11"/><circle cx="18.2" cy="6" r="2.2"/>',
  vulkan: '<path d="M2.5 19.5l5.5-9h2.2l1.8 2 1.8-2h2.2l5.5 9z"/><path d="M11 7.5c-.6-1.6.6-2.6 0-4.2M14 7.5c.8-1.2 1.8-1.6 2.6-1.2"/>',
  planeten: '<circle cx="12" cy="12" r="4.2"/><ellipse cx="12" cy="12" rx="9.5" ry="3" transform="rotate(-20 12 12)"/>',
  sterne: '<path d="M12 3l1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-1.9z"/>',
};
/**
 * Stationen des Wegs: das Dorf, dann je Kapitel eine (Station k ist Stern k des Kleinen Wagens), je [Kennung, Name];
 * die Kennung nennt ihr Zeichen (STORY_ICONS), ihren Namen (welt.<kennung> der Sprachdatei) und die Welt im
 * Speicherstand.
 */
const STORY_STATIONS = ['dorf', 'wald', 'meer', 'wueste', 'vulkan', 'planeten', 'sterne'].map((id) => [id, t(`welt.${id}`)]);
/**
 * Leiste unter dem Untertitel der Ankunft (story.fillPath, Leiste C aus dem Skizzenkatalog von .scratch/kleiner-wagen/):
 * massstab: CSS-Pixel je Einheit von wagen.form (bei voller Breite, Desktop), rand: Platz um die Form [x, y] (px),
 * zeichen: Grösse der Zeichen der Welten (px). Auf dem Handy setzt das CSS sie kleiner.
 */
const STORY_LEISTE = { massstab: 2.1, rand: [22, 20], zeichen: 19 };
/**
 * Kapitel: Station auf dem Weg, Hintergrund, Meldung und Knopf nach dem letzten Level; die Level je Grad stehen in
 * STORY_LEVELS (dieselbe Reihenfolge der Welten). travel: Untertitel, wenn das Licht hier ankommt (nach dem Prolog,
 * auf der Reise, beim Fortsetzen); carrier: was das Licht von hier in die nächste Welt trägt (STORY_CARRIERS). up:
 * so hoch schaut man in dieser Welt in den Himmel, wenn das Licht ankommt (Einstieg, Ende des Flugs, Menü; ohne
 * Angabe STORY_UP); der Aufstieg am Ende der Welt schaut zu ihrem Stern. finale: danach antwortet der Stern, und der
 * Epilog folgt.
 */
const kapitel = (station, k) => {
  const id = STORY_STATIONS[station][0], text = (was) => t(`geschichte.kapitel.${id}.${was}`);
  return { station, title: text('titel'), ...k, travel: text('reise'), done: text('fertig'), next: text('weiter') };
};
const STORY_CHAPTERS = [
  kapitel(1, { sky: 'forest', carrier: 'glow' }),
  kapitel(2, { sky: 'beach', carrier: 'spray' }),
  kapitel(3, { sky: 'desert', carrier: 'sand' }),
  kapitel(4, { sky: 'volcano', carrier: 'embers' }),
  kapitel(5, { sky: 'solar', carrier: 'comet' }),
  kapitel(6, { sky: 'milky', finale: true }),
];
const STORY_FINALE = [1, 2, 3].map((n) => t(`geschichte.finale.${n}`));
/** Kennung einer Welt im Speicherstand (gesehen): die ihrer Station auf dem Weg (STORY_STATIONS), etwa meer. */
const storyChapterId = (ch) => STORY_STATIONS[ch.station][0];
/**
 * Der Kleine Wagen (Spec .scratch/kleiner-wagen/, «Der Wagen»): das Sternbild, an der Spitze seiner Deichsel der
 * Polarstern. Jede der sechs Welten weckt einen seiner Sterne, in der Reihenfolge von STORY_CHAPTERS (Stern 1 der
 * Bergwald … Stern 6 die Sterne, im Finale); der siebte ist der Polarstern, er wird nicht geweckt, er antwortet. Form,
 * Reihenfolge des Erwachens, Linien und der Stand im Durchgang stehen hier an einer Stelle; Ladezeichen, Himmel, Bühne,
 * Finale, Menü, Übersicht und Leiste nehmen sie von hier. (Der Parameter ?wagen=<faktor> gehört dem Ladezeichen.)
 */
const wagen = {
  /**
   * Form: je Stern in der Reihenfolge des Erwachens (Stern 1 … 7) sein Ort, in Einheiten des Ladezeichens (dort bei
   * Grösse 1 je 1,2 px): x nach rechts, y nach unten. Der Polarstern (7) steht oben links an der Spitze der Deichsel
   * (5, 6), die Schale (1–4) unten rechts; 1 aussen an der Schale, 2 unten aussen, 3 unten innen, 4 wo die Deichsel
   * ansetzt.
   */
  form: [[44, 4], [48, 30], [14, 26], [8, 2], [-14, -12], [-38, -24], [-64, -34]],
  /**
   * Linien [von, nach] (Nummern der Sterne) in der Reihenfolge, in der sie sich ziehen: Erwacht Stern k (k ≥ 2), zieht
   * sich eine von k − 1 zu ihm; mit Stern 4 dazu 4 → 1 (die Schale schliesst sich); 6 → 7 zieht der Puls im Finale.
   */
  linien: [[1, 2], [2, 3], [3, 4], [4, 1], [4, 5], [5, 6], [6, 7]],
  polarstern: 7,
  /**
   * Stand des Wagens in einem Durchgang, ohne eigenes Feld im Speicherstand (stand: Stand eines Grads wie progress.load,
   * welten: seine Level je Welt, STORY_LEVELS[grad]). Stern k ist wach, sobald das letzte Level der Welt k gelöst ist
   * (bis «Von vorn»); ein geschaffter Grad (Finale gesehen) hat den ganzen Wagen wach, mit dem Polarstern. Eine Linie
   * ist gezogen, wenn ihre beiden Sterne wach sind; das sind genau die Linien je erwachtem Stern. Zurück { wach:
   * Nummern der wachen Sterne, linien: die gezogenen in ihrer Reihenfolge, naechster: der erste schlafende Stern (der
   * Stern der Welt, die dran ist; nach der letzten Welt vor dem Finale der Polarstern), null, wenn alle wach sind }.
   */
  stand(stand, welten) {
    const wach = [];
    for (let k = 1; k <= this.form.length; k++) {
      const letztes = k < this.polarstern ? welten?.[k - 1]?.at(-1) : undefined;
      if (stand?.geschafft || letztes !== undefined && stand?.geloest?.includes(letztes)) wach.push(k);
    }
    return { wach, linien: this.linien.filter(([a, b]) => wach.includes(a) && wach.includes(b)).map((l) => [...l]),
      naechster: this.form.map((_, i) => i + 1).find((k) => !wach.includes(k)) ?? null };
  },
};
/**
 * Der Kleine Wagen am Himmel der Welten und des Dorfs (Spec .scratch/kleiner-wagen/, «Der Wagen», Entscheide 10, 11,
 * 20; Ticket 04): Lage, Grösse und Helligkeit an einer Stelle. Er steht an einer festen Stelle in der Welt, nicht an
 * der Skybox: hoehe und azimut sind die Richtung der Mitte seiner Form (wagen.form) von der Kamera aus, azimut 0
 * geradeaus wie in der Ausgangsansicht (−z), positiv nach rechts. So hoch, dass der Stern des Vulkans über der
 * früheren Kraterwand stand (sie reichte geradeaus bis gut 50°; seit PLAN 1.7 ist der Rand viel niedriger, die Lage
 * blieb, wie abgenommen); der ganze Wagen (112 × 64 Einheiten der Form) misst mit winkel
 * 0,15 etwa 17° × 10° und passt so auch im Hochformat (gut 21° breit) ins Bild. Helligkeit je Zustand [Nacht, Tag]
 * nach der Tabelle der Spec (linear, die Sterne weiss; alles bleibt unter der Bloom-Schwelle), Grösse der Sterne
 * (punkt) und Breite der Linien in CSS-Pixeln. Grösse und Helligkeit hat der Nutzer bei der Abnahme so bestätigt
 * (07.11.2026); Punkte und Linien misst auch der Wagen der Bühne so (BUEHNENWAGEN, glBuehne).
 */
const HIMMELSWAGEN = {
  hoehe: 60,                                  // Grad über dem Horizont
  azimut: 0,                                  // Grad, positiv nach rechts
  winkel: 0.15,                               // Grösse: Grad je Einheit der Form
  abstand: 70,                                // von der Kamera, wie die Hintergrundsterne
  wach: { hell: [0.85, 0.85], punkt: [6.5, 6.5] },  // geweckt: hell, auch bei Tag
  linie: { hell: [0.17, 0.26], breite: 1.1, luecke: 7 }, // gezogene Linie; luecke: so viele px Abstand zu den Sternen
  welt: { hell: [0.22, 0.7], punkt: [3.4, 2.6] },    // Stern dieser Welt, schläft noch: blass und atmend / feiner Funke
  schlaf: { hell: [0.14, 0], punkt: [3, 3] },        // übrige schlafende: blass wie Hintergrundsterne / unsichtbar
  polar: { hell: [0.5, 0.22], punkt: [4.6, 3.6] },   // Polarstern, bevor er antwortet: mittelhell / blass
  atmen: { tiefe: 0.22, periode: 5 },                // Stern dieser Welt bei Nacht: kaum merklich (Anteil, s)
  // Aufblitzen beim Erwachen und Aufzucken im Vorbeiflug (Ticket 05): bei glanz 1 so hell (unter der Bloom-Schwelle,
  // auch bei Tag sichtbar) und um diesen Anteil grösser; eine Linie, die sich zieht, so hell
  glanz: { hell: 0.95, groesser: 1.3, linie: 0.6 },
};
/**
 * Der Wagen am Himmel (HIMMELSWAGEN): ein eigenes, leichtes Objekt um die Kamera (wie die Sterne, ohne Parallaxe), ein
 * Netz aus sieben Sternen und sieben Linien in einem Zeichenaufruf. Sterne und Linien sind Rechtecke, die der
 * Vertex-Shader in Bildpixeln aufspannt (die Linien zwischen den projizierten Sternen); gemischt wird über dem Himmel
 * (Farbe vorgerechnet, Alpha des Ziels bleibt: Alpha 0 markiert den Himmel), nie heller als die Bloom-Schwelle: Der
 * Wagen franst nicht aus. Er blendet mit keiner Skybox: Tag oder Nacht liest er aus dem Himmel (Helligkeit der
 * Hintergrundsterne, stars.uFade, die beim Überblenden mitgleitet; keine = Tag). Landschaft vor ihm (Panorama, Brett,
 * Planeten) deckt ihn über die Tiefe zu.
 * zeige(stand, welt): was er zeigt (stand wie wagen.stand, null: alle schlafend; welt: Nummer des Sterns dieser Welt,
 * null über dem Dorf). update(t): je Bild (animate). richtung(k): Richtung von Stern k (1 … 7) in der Welt, von der
 * Kamera aus (Aufstieg und Finale, Tickets 05 und 06; Proben). stand: was er gerade zeigt { wach, linien, welt }.
 * Bewegtes beim Erwachen und Vorbeiflug (Ticket 05; story.erwache, story.zucke), geschrieben von den Tweens der
 * Geschichte: glanz (je Stern 0 … 6, je Linie 7 …: 0 … 1, Stern hell bis an die Bloom-Schwelle und grösser, Linie heller)
 * und anteil (je Linie wie wagen.linien: so weit ist sie vom ersten zum zweiten Stern gezogen, 0 … 1).
 */
const himmelsWagen = (() => {
  const H = HIMMELSWAGEN, form = wagen.form, n = form.length, nL = wagen.linien.length;
  // hinter Menü und Übersicht aus (blendet): sicht 0 … 1, in AUSBLENDEN s
  const AUSBLENDEN = 0.4, zielSicht = () => (menu.offen || uebersicht.offen ? 0 : 1);
  let sicht = 1;
  // Richtungen: Mitte der Form in (hoehe, azimut), die Sterne in der Tangentialebene darum (rechts, oben im Bild)
  const rad = THREE.MathUtils.degToRad, el = rad(H.hoehe), az = rad(H.azimut);
  const mitte = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const rechts = new THREE.Vector3().crossVectors(mitte, new THREE.Vector3(0, 1, 0)).normalize();
  const oben = new THREE.Vector3().crossVectors(rechts, mitte).normalize();
  const xs = form.map((p) => p[0]), ys = form.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const je = Math.tan(rad(H.winkel));
  const dirs = form.map(([x, y]) => mitte.clone().addScaledVector(rechts, (x - cx) * je)
    .addScaledVector(oben, -(y - cy) * je).normalize());
  // Netz: je Stern und je Linie ein Rechteck (4 Ecken); a, b: Richtungen der beiden Enden (beim Stern dieselbe),
  // ecke: (quer, längs) −1 … 1 bzw. 0 … 1, art: 0 Stern, 1 Linie, nr: Platz in uHell/uGroesse
  const nQ = n + nL, a = new Float32Array(nQ * 12), b = new Float32Array(nQ * 12), ecke = new Float32Array(nQ * 8);
  const art = new Float32Array(nQ * 4), nr = new Float32Array(nQ * 4), index = [];
  const quad = (i, pa, pb, istLinie) => {
    const ecken = istLinie ? [[-1, 0], [1, 0], [1, 1], [-1, 1]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    ecken.forEach((e, j) => {
      const v = i * 4 + j;
      pa.toArray(a, v * 3);
      pb.toArray(b, v * 3);
      ecke.set(e, v * 2);
      art[v] = istLinie ? 1 : 0;
      nr[v] = i;
    });
    index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  };
  dirs.forEach((d, i) => quad(i, d, d, false));
  wagen.linien.forEach(([von, nach], i) => quad(n + i, dirs[von - 1], dirs[nach - 1], true));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(a, 3)); // für three.js; der Shader rechnet mit aA und aB
  geo.setAttribute('aA', new THREE.BufferAttribute(a, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(b, 3));
  geo.setAttribute('aEcke', new THREE.BufferAttribute(ecke, 2));
  geo.setAttribute('aArt', new THREE.BufferAttribute(art, 1));
  geo.setAttribute('aNr', new THREE.BufferAttribute(nr, 1));
  geo.setIndex(index);
  const uniforms = {
    uHell: { value: new Float32Array(nQ) },    // Helligkeit je Stern und Linie (update)
    uGroesse: { value: new Float32Array(nQ) }, // Durchmesser je Stern bzw. Breite je Linie (Bildpixel)
    uAnteil: { value: new Float32Array(nQ).fill(1) }, // so weit ist eine Linie gezogen (Erwachen); bei Sternen 1
    uLuecke: { value: 0 },                     // Abstand der Linien zu den Sternen (Bildpixel)
    uRes: { value: new THREE.Vector2(1, 1) },  // Grösse des Bilds (Bildpixel)
    uAbstand: { value: H.abstand },
    uMax: { value: 0.95 * LOOK.bloomThreshold }, // nie heller: kein Bloom
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec3 aA, aB;
      attribute vec2 aEcke;
      attribute float aArt, aNr;
      uniform float uHell[${nQ}], uGroesse[${nQ}], uAnteil[${nQ}], uLuecke, uAbstand;
      uniform vec2 uRes;
      varying vec2 vEcke;
      varying float vHell, vArt;
      void main() {
        int i = int(aNr + 0.5);
        vHell = uHell[i];
        vEcke = aEcke;
        vArt = aArt;
        vec4 pa = projectionMatrix * modelViewMatrix * vec4(aA * uAbstand, 1.0);
        vec4 pb = projectionMatrix * modelViewMatrix * vec4(aB * uAbstand, 1.0);
        pb = mix(pa, pb, uAnteil[i]); // eine Linie, die sich gerade zieht, reicht erst so weit
        // hinter der Kamera oder ausgeschaltet: nichts (ausserhalb des Bilds)
        if (pa.w <= 0.01 || pb.w <= 0.01 || vHell <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        vec2 px = 2.0 / uRes; // ein Bildpixel in NDC
        if (aArt < 0.5) { // Stern: Quadrat um den projizierten Punkt, anderthalbmal so gross wie der Kern (Schein)
          gl_Position = pa;
          gl_Position.xy += aEcke * 0.75 * uGroesse[i] * px * pa.w;
          return;
        }
        vec2 sa = pa.xy / pa.w, sb = pb.xy / pb.w, d = (sb - sa) / px;
        float len = length(d);
        if (len < 2.0 * uLuecke + 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        d /= len;
        vec4 p = mix(pa, pb, aEcke.y);
        vec2 off = vec2(-d.y, d.x) * aEcke.x * (0.5 * uGroesse[i] + 1.0) + d * uLuecke * (1.0 - 2.0 * aEcke.y);
        p.xy += off * px * p.w;
        gl_Position = p;
      }`,
    fragmentShader: `
      uniform float uMax;
      varying vec2 vEcke;
      varying float vHell, vArt;
      void main() {
        float a;
        if (vArt < 0.5) {
          float r = length(vEcke) * 1.5; // 1: Rand des Kerns
          a = smoothstep(1.0, 0.45, r) + 0.22 * pow(max(0.0, 1.0 - r / 1.5), 2.0);
        } else a = smoothstep(1.0, 0.35, abs(vEcke.x));
        float h = min(vHell * a, uMax);
        gl_FragColor = vec4(vec3(h), h);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide, // die Rechtecke der Linien drehen je nach Richtung im Bild
    // vorgerechnete Farbe über dem Himmel, Alpha des Ziels unverändert (Alpha 0 markiert den Himmel)
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -97; // nach den Sternen und der Korona der Sonne
  mesh.layers.set(LAYER_NO_REFLECT);
  mesh.raycast = () => {};
  scene.add(mesh);

  const mische = (paar, nacht) => paar[1] + (paar[0] - paar[1]) * nacht; // [Nacht, Tag]
  const stand = { wach: [], linien: [], welt: null };
  const glanz = new Float32Array(nQ), anteil = new Float32Array(nL).fill(1); // Erwachen, Vorbeiflug (Ticket 05)
  return {
    mesh,
    stand,
    glanz,
    anteil,
    zeige(s, welt) {
      const wach = s?.wach ?? [], linien = s?.linien ?? [];
      if (JSON.stringify([wach, linien, welt]) === JSON.stringify([stand.wach, stand.linien, stand.welt])) return;
      Object.assign(stand, { wach: [...wach], linien: linien.map((l) => [...l]), welt });
      sceneLoop.wake(); // ruht die Schleife (mit ?t=): den neuen Stand zeichnen
    },
    richtung(k, ziel = new THREE.Vector3()) { return ziel.copy(dirs[k - 1]); },
    /**
     * Offen sind Menü oder Übersicht: Ihre Sternkarte zeigt den Wagen schon; der am Himmel dahinter blendet aus (sicht
     * 0, in AUSBLENDEN s), sonst stünde er doppelt da (Abnahme Ticket 11: nach dem Epilog der ganze Wagen zweimal).
     */
    get blendet() { return sicht !== zielSicht(); },
    /** Ohne Ausblenden gleich so, wie es Menü und Übersicht verlangen (hinter der Bühne: Das sieht niemand). */
    sofort() { sicht = zielSicht(); },
    update(t, dt = 0) {
      mesh.position.copy(camera.position);
      const ziel = zielSicht(), schritt = Math.min(dt, 0.1) / AUSBLENDEN;
      sicht = sicht < ziel ? Math.min(ziel, sicht + schritt) : Math.max(ziel, sicht - schritt);
      mesh.visible = sicht > 0;
      const pr = renderer.getPixelRatio();
      renderer.getDrawingBufferSize(uniforms.uRes.value);
      // Nacht: Der Himmel zeigt Hintergrundsterne (Welten bei Nacht 0,3, Sonnensystem und Milchstrasse 1), Tag: keine
      const nacht = THREE.MathUtils.clamp(stars.material.uniforms.uFade.value / 0.3, 0, 1);
      const atmen = 1 + H.atmen.tiefe * nacht * Math.sin(2 * Math.PI * t / H.atmen.periode);
      const h = uniforms.uHell.value, g = uniforms.uGroesse.value;
      for (let k = 1; k <= n; k++) {
        const z = stand.wach.includes(k) ? H.wach : k === wagen.polarstern ? H.polar
          : k === stand.welt ? H.welt : H.schlaf;
        const basis = mische(z.hell, nacht) * (z === H.welt ? atmen : 1), x = glanz[k - 1];
        h[k - 1] = basis + (H.glanz.hell - basis) * x;
        g[k - 1] = mische(z.punkt, nacht) * pr * (1 + H.glanz.groesser * x);
      }
      wagen.linien.forEach(([von, nach], i) => {
        const basis = stand.linien.some(([x, y]) => x === von && y === nach) ? mische(H.linie.hell, nacht) : 0;
        h[n + i] = basis && basis + (H.glanz.linie - basis) * glanz[n + i];
        g[n + i] = H.linie.breite * pr;
        uniforms.uAnteil.value[n + i] = anteil[i];
      });
      uniforms.uLuecke.value = H.linie.luecke * pr;
      if (sicht < 1) for (let i = 0; i < h.length; i++) h[i] *= sicht * sicht * (3 - 2 * sicht);
    },
  };
})();
/**
 * Das Kapitel «Im Dorf» (Entscheide 3, 10, 18; Ticket 07): das Tutorial zwischen Prolog und Bergwald, keine der sechs
 * Welten. Seine Übungen sind LEVELS[0 … TUTORIAL_COUNT − 1] mit Name und Schritten der Führung; sie zählen nicht zu
 * den 60 des Grads.
 * angebot: nach dem Prolog auf der Bühne (auch nach «Überspringen»), beim ersten Durchgang je Grad; einstieg: der
 * Untertitel, wenn das Licht ins Dorf kommt (ohne Träger: Es ist schon bei Noa); ende: nach der letzten Übung oder
 * «Überspringen», danach tragen die Glühwürmchen das Licht in den Bergwald. done/next: «Gelöst» nach der letzten Übung.
 * sky: der Hintergrund, die Skybox «Noas Dorf bei Nacht» (village; fehlt sie, nimmt setSky die Milchstrasse).
 */
const STORY_DORF = { station: 0, title: t('geschichte.dorf.titel'), sky: 'village',
  angebot: { kicker: t('geschichte.dorf.titel'), ueben: t('geschichte.dorf.ueben'), los: t('geschichte.dorf.los'),
    text: t('geschichte.dorf.angebot') },
  einstieg: { kicker: t('geschichte.dorf.einstiegKicker'), traeger: null, moment: 'dorf', path: 0,
    text: t('geschichte.dorf.einstieg') },
  ende: t('geschichte.dorf.ende'), done: t('geschichte.dorf.fertig'), next: t('geschichte.dorf.weiter') };
/** So lange (ms) bleibt «Überspringen» nach dem Ende eines Einstiegs weg, bevor es im Dorf das Kapitel meint. */
const STORY_SKIP_RUHE = 2000;
/**
 * Stand des Dorfs im Speicherstand (prisma.noa.<grad>.dorf, nur nach «Üben»): { ende: null (das Kapitel läuft) |
 * 'gespielt' | 'uebersprungen' }; Unlesbares gilt als nicht gespielt (null). Seit Ticket 02 von .scratch/tutorial-neu/
 * merkt sich das Dorf keinen Platz mehr (Spec «Kein Stand im Dorf»): Wer es startet, beginnt bei Übung 1. Ein altes
 * Feld platz (bis 8, aus der Zeit der 9 Übungen) zählt nicht und fällt beim nächsten Speichern weg; ein beendetes Dorf
 * bleibt darum beendet, wie gross sein platz auch war.
 */
const storyDorfStand = (d) => (d && typeof d === 'object' && !Array.isArray(d)
  && [null, 'gespielt', 'uebersprungen'].includes(d.ende ?? null) ? { ende: d.ende ?? null } : null);
/**
 * Träger zwischen zwei Welten (story.makeCarrier): Punkte um den Lichtpunkt und hinter ihm her. motion: swarm
 * (umkreisen ihn), helix (Wirbel, nach hinten weiter), trail (Spur auf seinem Weg, wave: auf und ab wie Wellen),
 * embers (Glut, fällt zurück), comet (Schweif, nach hinten breiter). delay: so weit (s) reicht die Spur zurück;
 * radius, spin (rad/s), size: Bereiche je Punkt; color: Grundfarbe (heller als 1 blüht).
 */
const STORY_CARRIERS = {
  glow: { motion: 'swarm', count: 56, delay: 0.8, radius: [1.8, 5.5], spin: [1.4, 2.8], color: [0.8, 1, 0.32], size: [2.6, 4.2] },
  spray: { motion: 'trail', count: 96, delay: 1.6, radius: [0.3, 2.2], wave: 1.4, color: [0.55, 0.82, 1], size: [1.2, 2.4] },
  sand: { motion: 'helix', count: 96, delay: 1.2, radius: [1.6, 4.4], spin: [5, 8], color: [1, 0.76, 0.36], size: [1.1, 2.1] },
  embers: { motion: 'embers', count: 96, delay: 1.4, radius: [0.5, 2.8], color: [1, 0.36, 0.08], size: [1.3, 2.6] },
  comet: { motion: 'comet', count: 96, delay: 2.4, radius: [0.3, 1.8], color: [0.72, 0.88, 1], size: [1.2, 3.0] },
};
/**
 * Erwachen und Flug (Spec .scratch/kleiner-wagen/, Ablauf 3 und 5; Ticket 05): Am Ende einer Welt steigen die Strahlen
 * zu ihrem Stern (himmelsWagen.richtung), er erwacht (story.erwache: blitzt auf, die Linie(n) ziehen sich, sein
 * Glockenton), dann fliegt der Träger in einem Bogen (story.bogen) am nächsten, noch schlafenden Stern vorbei, der kurz
 * aufzuckt (story.zucke), und hinab, so hoch, wie man in der neuen Welt hinaufschaut. Ein Einstieg in eine Welt kommt
 * von der Seite am Stern dieser Welt vorbei. Gleich lang wie der frühere seitliche Bogen.
 * Solange der Untertitel der Ankunft steht (Kicker und Text in der Mitte, Ticket 08), liegt der Lichtpunkt in der
 * Mitte des freien Raums darüber (story.lichtHoch, gemessen); licht: so weit über der Mitte des Bilds (Anteil der
 * halben Bildhöhe; story.look), wo nichts zu messen ist. vorbei: so weit (Grad) zieht das Licht neben dem Stern
 * vorbei, nach aussen vom Wagen. reise: Flug der Reise (s), am Stern beim Anteil amStern des Wegs, das Ende seitwaerts
 * (rad) vom Stern. einstieg: Flug des Einstiegs (s), Start von (rad) seitlich und hoeher (rad) als der Stern, an ihm beim
 * Anteil amStern. Erwachen: blitz (s) des Sterns, linie (s) je Linie, die sich zieht, dann klingt ihr Glanz in nach (s)
 * aus; zucken (s) des nächsten Sterns im Vorbeiflug; schweben: Kreis (Grad) des Lichts um den geweckten Stern, solange
 * die nächste Welt lädt.
 * Abnahme Ticket 11: Am Ende von Einstieg und Reise hält das Licht über dem Untertitel an und wartet auf Tippen, ohne
 * Zeitablauf (story.anhalten); ein Tippen in den ersten halt s danach galt noch dem Flug und zählt nicht. Dann fällt
 * es gleichmässig aufs Brett (storyFall: nach einem Anlauf über den Anteil anlauf der Zeit gleich schnell, ohne
 * Abbremsen). Abnahme Ticket 12: gleichmässig im Bild (story.fall); fall: dauer (s), kamera: Anlauf und Abbremsen
 * der Kamera (Anteile der Zeit, storyRampe), dazwischen dreht sie gleich schnell.
 */
const STORY_FLUG = {
  licht: 0.3,
  halt: 0.3, anlauf: 0.1,
  fall: { dauer: 2.8, kamera: [0.15, 0.35] },
  vorbei: 1.0,
  reise: { dauer: 6, amStern: 0.32, seitwaerts: 0.45 },
  einstieg: { dauer: 3.4, amStern: 0.45, von: 0.55, hoeher: 0.06 },
  blitz: 1.6, linie: 0.7, nach: 0.8,
  zucken: 1.1,
  schweben: 1.2,
};
/**
 * Finale (Spec .scratch/kleiner-wagen/, Ablauf 6; Ticket 06): Die Strahlen steigen zum sechsten Stern, er erwacht
 * (ascend, erwache), und sie laufen in auslaufen (s) in ihn aus (story.auslaufen, Abnahme Ticket 12). Die Kamera
 * kommt dabei schon dort an, wo der ganze Wagen über dem Untertitel steht (story.wagenBlick; rand: so viel freier
 * Platz um ihn, Anteil der kürzeren Bildseite; Abnahme Ticket 11), zu Satz 1 gleitet sie in blick (s) nur noch nach,
 * falls der Untertitel anders steht. Ab ab (s) läuft ein Puls Stern für Stern durch ihn (story.puls): schritt (s) von
 * Stern zu Stern, jeder leuchtet bis glanz auf und mit seinem Ton, die Linie dazwischen leuchtet, während der Puls
 * darauf läuft; nach (s) nach dem sechsten Stern ist er verklungen. Zu Satz 2 springt er ab ab (s) über die Deichsel
 * (story.deichsel): Die Linie 6 → 7 zieht sich in zug (s), dann flammt der Polarstern auf, sein Schlusston klingt, in
 * flamme (s) ist er still. Erst dann wartet der Satz auf Tippen. Danach antwortet der Polarstern: Sein Strahl fällt aus
 * dem Bild, das steht (story.antwortBlick, ohne Blick zu ihm); am Ende steht der ganze Wagen im Bild, genau dort, wo
 * ihn gleich die Bühne zeigt (story.wagenEnde, Wagen in Wagen; Ticket 07; seit Ticket 11 rechts der Mitte, die Kamera
 * dafür seitlich gedreht). Der Aufprall auf dem Brett weich (Abnahme Ticket 12, antwort): Kommt die Spitze ins letzte
 * Stück vorglut (Anteil des Wegs), glüht das Brett unter ihr auf (bis glut), daraus läuft die Lichtwelle (story.shock),
 * die in anstieg (s) erst ganz hell wird, ebenso der Schein (story.pulse); der Strahl läuft nach ab (s) in aus (s) ins
 * Brett aus. abstand: so weit vor der Kamera steht der Lichtpunkt auf einem Stern (wie im Aufstieg).
 */
const STORY_PULS = {
  blick: 1.2, rand: 0.07, abstand: 72, auslaufen: 1.6,
  antwort: { vorglut: 0.3, glut: 0.45, anstieg: 0.35, ab: 0.15, aus: 2.0 },
  puls: { ab: 0.9, schritt: 0.26, glanz: 0.8, nach: 0.6 },
  deichsel: { ab: 0.35, zug: 0.7, flamme: 0.7 },
};
/**
 * Der Kleine Wagen auf der Bühne von Prolog und Epilog (Spec .scratch/kleiner-wagen/, Entscheide 8, 15, Ablauf 1
 * und 7; Ticket 07): Er steht im Himmel der Bühne um ihren Polarstern, in der Form von wagen.form. Wo und wie gross,
 * folgt aus dem Ende des Finales (story.wagenEnde): Im ersten Bild des Epilogs steht er genau dort, wo der Wagen am
 * Himmel der Welt zuletzt stand (Wagen in Wagen), in jedem Format; der Prolog zeigt ihn an derselben Stelle. feld:
 * Platz, den er auf der Bühne hat (scene.wagenFeld), in jedem Bild des Epilogs und in Prolog 4: rand (Anteil der
 * kürzeren Bildseite) vom Rand des Bilds und über den Graten der Berge; darin höchstens hoehe dieses Platzes hoch
 * und breite so breit (sonst schaut das Finale am Ende weiter, mit grösserem Sichtfeld der Kamera), waagrecht bei
 * lage (0 am linken, 1 am rechten Rand des Platzes; Abnahme Ticket 11: weiter rechts, damit Noa nicht so steil
 * hinauf leuchtet; Noas Arm und Strahl zeigen zum Polarstern, erhoben).
 * Prolog: die sechs Sterne blass wie die schwächsten Hintergrundsterne (schlaf: Helligkeit, Durchmesser in
 * CSS-Pixeln), ohne Funkeln, ohne Linien; in Prolog 4 zeichnen sich die Linien einmal ab (andeutung: ab s nach dem
 * Beginn der Einstellung, in auf s bis hell, in aus s wieder weg). Epilog: alle sieben wach wie am Himmel der Welten
 * (HIMMELSWAGEN.wach, die Linien wie HIMMELSWAGEN.linie bei Nacht); sie glimmen nach: ab halten s nach dem Beginn in
 * abklingen s auf glimmen, dann atmen sie (tiefe, periode s). Grösse und Helligkeit hat der Nutzer bei der
 * Abnahme so bestätigt (07.11.2026).
 */
const BUEHNENWAGEN = {
  feld: { rand: 0.04, hoehe: 0.8, breite: 0.6, lage: 0.8 },
  schlaf: { hell: 0.34, punkt: 1.6 },
  andeutung: { hell: 0.11, ab: 1.4, auf: 1.3, aus: 2.1 },
  nachglimmen: { halten: 2.6, abklingen: 4, glimmen: 0.11, tiefe: 0.3, periode: 5 },
};
/**
 * Prolog und Epilog: Einstellungen der Kamera über dem Dorf (Bühne siehe createStoryScene), je mit einem Satz.
 * cam: Bildmitte x, y und Zoom in der Ebene von Noa, im Hochformat camP (dort passt nur ein schmaler Streifen ins
 * Bild); from: Start der ersten Fahrt; move: Dauer der Fahrt (s); act: was dabei geschieht (siehe scene.act);
 * winkelWie: Noa leuchtet hier im selben Winkel zum Polarstern wie in dieser Einstellung des Prologs, die Kamera fährt
 * dafür waagrecht (x von cam bzw. camP gilt nur ohne Wagen; scene.winkelKamera, Abnahme Ticket 13).
 */
const STORY_PROLOG = [
  { from: { x: 820, y: 160, z: 1.08 }, fromP: { x: 760, y: 120, z: 1.08 }, cam: { x: 800, y: 470, z: 1 },
    camP: { x: 760, y: 470, z: 1 }, move: 6,
    text: t('geschichte.prolog.1') },
  { cam: { x: 520, y: 590, z: 2 }, move: 4.5,
    text: t('geschichte.prolog.2') },
  { cam: { x: 560, y: 560, z: 2.2 }, move: 2.6, act: 'lamp',
    text: t('geschichte.prolog.3') },
  { cam: { x: 900, y: 300, z: 1.35 }, camP: { x: 760, y: 330, z: 1.3 }, move: 5, act: 'reach',
    text: t('geschichte.prolog.4') },
  { cam: { x: 760, y: 600, z: 1.55 }, camP: { x: 560, y: 600, z: 1.55 }, move: 4, act: 'gather',
    text: t('geschichte.prolog.5') },
  { cam: { x: 1250, y: 560, z: 1.7 }, camP: { x: 1300, y: 590, z: 1.6 }, move: 5.5, act: 'carry',
    text: t('geschichte.prolog.6') },
];
const STORY_EPILOG = [
  { from: { x: 900, y: 120, z: 1.12 }, fromP: { x: 980, y: 160, z: 1.08 }, cam: { x: 760, y: 420, z: 1.25 },
    camP: { x: 520, y: 470, z: 1.3 }, move: 6.5,
    text: t('geschichte.epilog.1') },
  { cam: { x: 790, y: 400, z: 1.2 }, camP: { x: 1000, y: 300, z: 1.1 }, move: 2.5, act: 'blink',
    text: t('geschichte.epilog.2') },
  { cam: { x: 720, y: 560, z: 1.4 }, camP: { x: 500, y: 560, z: 1.6 }, winkelWie: 'reach', move: 3, act: 'answer',
    text: t('geschichte.epilog.3') },
];

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  BUEHNENWAGEN: () => BUEHNENWAGEN, STORY_CHAPTERS: () => STORY_CHAPTERS, STORY_DORF: () => STORY_DORF,
  STORY_EPILOG: () => STORY_EPILOG, STORY_PROLOG: () => STORY_PROLOG, wagen: () => wagen,
});

export {
  BUEHNENWAGEN, himmelsWagen, HIMMELSWAGEN, STORY_CARRIERS, STORY_CHAPTERS, STORY_DORF, STORY_EPILOG, STORY_FINALE,
  STORY_FLUG, STORY_ICONS, STORY_LEISTE, STORY_PROLOG, STORY_PULS, STORY_SKIP_RUHE, STORY_STATIONS, STORY_UP,
  storyChapterId, storyDorfStand, wagen,
};
