// Spielelemente: 3D-Modelle für Quelle, Spiegel, Prisma, Filter, Vereiniger, Blocker und Ziel (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import '../kamera.js';
import { CELL, GRID, phasenZufall } from '../konfiguration.js';
import { LAYER_NO_REFLECT } from '../szene.js';
import { createBrushedTexture, makeMirrorStreakTexture } from '../texturen.js';
import { game, SHARED_MATERIALS } from './feld.js';
import { beamView, spotTexture } from './strahlen.js';
import { mergeGeometries, SHARED_GEOMETRIES } from '../eingabe.js';
import { AXES, dirToRotationY, MIRROR_HALF_WIDTH } from '../../logik.js';
import { alsGlobal } from '../testschnittstelle.ts';

/* =====================================================================
   SPIELELEMENTE — 3D-Modelle für Quelle, Spiegel und Ziel
   ===================================================================== */

const BEAM_Y = 0.42; // Höhe, auf der die Strahlen über der Platte laufen
const HALF_GRID = (GRID - 1) / 2;

/** Rasterkoordinate → Weltposition (Zellmitte auf der Platte). */
function gridToWorld(x, z, y = 0, target = new THREE.Vector3()) {
  return target.set((x - HALF_GRID) * CELL, y, (z - HALF_GRID) * CELL);
}

/**
 * Würfel-Level: Rasterpunkt (auch Zwischenpunkte von Strahlen) → Welt. Die Zellen liegen mittig im Würfel, der auf
 * der Platte steht: die unterste Zellmitte eine halbe Zelle über der Platte (CUBE_FLOOR), jede weitere eine Zelle
 * höher – so passen auch senkrechte Ringe der untersten Ebene (Radius mit Marken 0.58) über die Platte.
 * Waagrecht mittig wie das 2D-Feld.
 */
const CUBE_FLOOR = CELL / 2;
function cubeToWorld(x, y, z, size, target = new THREE.Vector3()) {
  const half = (size - 1) / 2;
  return target.set((x - half) * CELL, CUBE_FLOOR + y * CELL, (z - half) * CELL);
}

/** Strahlpunkt eines Abschnitts oder Ereignisses in Weltkoordinaten (2D: auf Strahlhöhe). */
function beamPointToWorld(x, y, z, target) {
  return y === undefined ? gridToWorld(x, z, BEAM_Y, target) : cubeToWorld(x, y, z, game.board.size, target);
}

/** Normale aus der Logik als Weltvektor (2D: [nx, nz], Würfel: [nx, ny, nz]). */
const normalToWorld = (n, target = new THREE.Vector3()) => (n.length === 3 ? target.fromArray(n) : target.set(n[0], 0, n[1]));

/**
 * Würfel-Level: Lage eines Elementmodells. Die Modelle sind für die 2D-Platte gebaut (Sockel unten, Optik auf
 * Strahlhöhe, Drehung um ihr lokales y). Die Basis (u, a, v) der Drehachse (AXES) dreht lokales x, y, z in die
 * Drehebene; der Ursprung liegt so, dass die Optik in der Zellmitte sitzt.
 */
const _axisBasis = new THREE.Matrix4();
function placeInCube(obj, el, size) {
  const { u, a, v } = AXES[el.axis];
  _axisBasis.makeBasis(new THREE.Vector3(...u), new THREE.Vector3(...a), new THREE.Vector3(...v));
  obj.quaternion.setFromRotationMatrix(_axisBasis);
  cubeToWorld(el.x, el.y, el.z, size, obj.position).addScaledVector(new THREE.Vector3(...a), -BEAM_Y);
}

/**
 * 0 … 1: wie stark eine Farbe gedämpft werden soll, weil sie hell ist. Helle Farben (Weiss, Gelb,
 * Cyan, Grün) überschreiten die Bloom-Schwelle viel stärker als Rot, Blau oder Magenta.
 */
function brightTame(c) {
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return THREE.MathUtils.smoothstep(lum, 0.35, 0.95);
}

// Linear (THREE.Color), satt: Nebenkanäle nahe 0. Früher lagen sie bei 0.2 (im Bild Mint, Lachs, Lavendel), und es war
// schwer zu sehen, welche Farbe wohin muss (Wunsch 10.11.2026). Cyan liegt näher bei Blau (G 0.55): mit mehr Grün
// bleichte die Tonwertabbildung (ACES) seinen Kern fast weiss. Gleich dick wirken die Strahlen über BEAM_EVEN.
const COLOR_RGB = {
  1: new THREE.Color(1.0, 0.035, 0.02),  // Rot
  2: new THREE.Color(0.04, 1.0, 0.07),   // Grün
  3: new THREE.Color(1.0, 0.7, 0.0),     // Gelb
  4: new THREE.Color(0.03, 0.13, 1.0),   // Blau
  5: new THREE.Color(1.0, 0.03, 0.9),    // Magenta
  6: new THREE.Color(0.0, 0.55, 1.0),    // Cyan
  7: new THREE.Color(1.0, 0.97, 0.92),   // Weiss (minimal warm)
};

const brushedTex = createBrushedTexture(256);
brushedTex.repeat.set(2, 2);

const MAT = {
  metalDark: new THREE.MeshStandardMaterial({
    color: 0x2c2c33, metalness: 1, roughness: 0.42, roughnessMap: brushedTex, envMapIntensity: 1.1,
  }),
  metalBright: new THREE.MeshStandardMaterial({
    color: 0xb9bac4, metalness: 1, roughness: 0.3, roughnessMap: brushedTex, envMapIntensity: 1.25,
  }),
  mirror: new THREE.MeshStandardMaterial({
    color: 0xf2f4ff, metalness: 1, roughness: 0.03, envMap: null, envMapIntensity: 1.7, // envMap: seitenstart
    emissive: 0xdfe6ff, emissiveIntensity: 0.22, emissiveMap: makeMirrorStreakTexture(),
  }),
  // Rahmen des Spiegels: schwarz lackiert, leichter Glanz
  frameBlack: new THREE.MeshStandardMaterial({ color: 0x0a0a0d, metalness: 0.3, roughness: 0.32, envMapIntensity: 0.9 }),
  stone: new THREE.MeshStandardMaterial({
    color: 0x111117, metalness: 0, roughness: 0.38, envMapIntensity: 0.7,
  }),
  lens: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.97, 0.92).multiplyScalar(5.5) }),
};

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Würfel-Level (Prototyp): Die Elemente schweben, Sockel passen dort nicht. Statt des Drehtellers liegt ein Ring in
 * der Drehebene um das Element (mit 45°-Marken), zwei Achszapfen zeigen die Drehachse auch dann, wenn man den Ring
 * von der Kante sieht. Feste Elemente haben statt des eckigen Sockels einen eckigen Rahmen mit rotem Rand.
 * Alles in lokalen Koordinaten des 2D-Modells (lokal y = Drehachse, Optik auf BEAM_Y).
 */
const CUBE_MOUNT = { ring: 0.52, tube: 0.011, tick: 0.06, pin: [0.27, 0.44], frame: 0.98, bar: 0.03 };
const inCube = () => game.board?.dim === 3;

function makeCubeRing() {
  const g = new THREE.Group();
  const R = CUBE_MOUNT.ring;
  const ring = shadowed(new THREE.Mesh(new THREE.TorusGeometry(R, CUBE_MOUNT.tube, 8, 96), MAT.metalBright));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = BEAM_Y;
  g.add(ring);
  for (let i = 0; i < 8; i++) { // 45°-Marken, nach aussen
    const a = i * Math.PI / 4;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(CUBE_MOUNT.tick, 0.014, 0.014), MAT.metalBright);
    tick.position.set(Math.cos(a) * (R + CUBE_MOUNT.tick / 2), BEAM_Y, Math.sin(a) * (R + CUBE_MOUNT.tick / 2));
    tick.rotation.y = -a;
    g.add(tick);
  }
  const [p0, p1] = CUBE_MOUNT.pin;
  for (const s of [-1, 1]) { // Achszapfen über und unter dem Element
    const pin = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, p1 - p0, 12), MAT.metalBright));
    pin.position.y = BEAM_Y + s * (p0 + p1) / 2;
    const knob = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), MAT.metalBright));
    knob.position.y = BEAM_Y + s * p1;
    g.add(pin, knob);
  }
  return g;
}

function makeCubeFrame() {
  const g = new THREE.Group();
  const s = CUBE_MOUNT.frame, t = CUBE_MOUNT.bar, e = s / 2 - t / 2, w = FIXED_EDGE.width;
  const { edgeMat } = fixedBase();
  for (const [bw, bd, x, z, along] of [[s, t, 0, -e, 'x'], [s, t, 0, e, 'x'], [t, s - 2 * t, -e, 0, 'z'], [t, s - 2 * t, e, 0, 'z']]) {
    const bar = shadowed(new THREE.Mesh(new THREE.BoxGeometry(bw, t, bd), MAT.metalDark));
    bar.position.set(x, BEAM_Y, z);
    // roter Rand: schmaler Streifen mitten im Profil, schaut oben und unten knapp heraus
    const edge = new THREE.Mesh(along === 'x' ? new THREE.BoxGeometry(bw, t + 0.006, w) : new THREE.BoxGeometry(w, t + 0.006, bd), edgeMat);
    edge.position.copy(bar.position);
    edge.raycast = () => {};
    edge.layers.set(LAYER_NO_REFLECT);
    g.add(bar, edge);
  }
  return g;
}

/** Runder Metallsockel (Drehteller), auf dem jedes drehbare Element steht. */
function makePedestal(radius = 0.34) {
  if (inCube()) return makeCubeRing();
  const g = new THREE.Group();
  const disk = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius + 0.02, 0.06, 48), MAT.metalDark));
  disk.position.y = 0.03;
  const rim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(radius - 0.03, 0.008, 8, 64), MAT.metalBright));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.062;
  g.add(disk, rim);
  return g;
}

/**
 * Fester Sockel für alles, was sich nicht drehen lässt (Quelle, Ziel, Filter, fester Spiegel; auch ein festes Prisma
 * oder ein fester Kombinator): eckiger, dunkler Steinblock mit schmalem rot leuchtendem Rand – kein Drehteller.
 * Formensprache: rund mit weissem Leuchtring = drehbar, eckig mit rotem Rand = fest (auf dem Handy waren die feinen
 * Drehmarken unsichtbar).
 */
const FIXED_BASE_SIZE = 0.66;
const FIXED_BASE_TOP = 0.07;  // Oberkante des Steinblocks (Teller: 0.06) – Ringe und Lichthöfe liegen knapp darüber
// Randleiste: feine Linie (halb so breit wie der Leuchtring der drehbaren Elemente), flach knapp über dem Block;
// Oberkante 0.079 – knapp über dem Lichthof des Ziels (FIXED_BASE_TOP + 0.008), sonst flimmert sein Rand.
// Gedämpftes Rot weit unter der Bloom-Schwelle: ruhig und unaufdringlich. Wenig Grün- und Blauanteil – das ACES im
// finalPass zieht helles Rot sonst ins Orange.
const FIXED_EDGE = { width: 0.017, height: 0.010, inset: 0.012, color: new THREE.Color(0.42, 0.06, 0.07) };
let fixedBaseParts = null; // Geometrien und Material, geteilt von allen festen Sockeln (beim ersten Gebrauch gebaut)
function fixedBase() {
  if (fixedBaseParts) return fixedBaseParts;
  const size = FIXED_BASE_SIZE, { width: t, height: h, inset } = FIXED_EDGE;
  const blockGeo = new THREE.BoxGeometry(size, FIXED_BASE_TOP, size).translate(0, FIXED_BASE_TOP / 2, 0);
  const frameGeo = new THREE.BoxGeometry(size + 0.02, 0.02, size + 0.02).translate(0, 0.01, 0);
  // eckiger Rand oben, knapp innerhalb der Blockkante: macht die Form "eckig = fest" auch auf dem dunklen Boden lesbar
  const outer = size - 2 * inset, e = outer / 2 - t / 2, y = FIXED_BASE_TOP - 0.001 + h / 2;
  const edgeGeo = mergeGeometries([[outer, t, 0, -e], [outer, t, 0, e], [t, outer - 2 * t, -e, 0], [t, outer - 2 * t, e, 0]]
    .map(([w, d, x, z]) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)));
  const edgeMat = new THREE.MeshBasicMaterial({ color: FIXED_EDGE.color, fog: false });
  for (const geo of [blockGeo, frameGeo, edgeGeo]) SHARED_GEOMETRIES.add(geo);
  SHARED_MATERIALS.add(edgeMat);
  fixedBaseParts = { blockGeo, frameGeo, edgeGeo, edgeMat };
  return fixedBaseParts;
}
/** Drei Draw-Calls: Block, Rahmen, Randleiste (alle Geometrien geteilt). */
function makeFixedBase() {
  if (inCube()) return makeCubeFrame();
  const { blockGeo, frameGeo, edgeGeo, edgeMat } = fixedBase();
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(blockGeo, MAT.stone)), shadowed(new THREE.Mesh(frameGeo, MAT.metalDark)));
  // Leuchtrand nicht in der Bodenspiegelung (wie der Leuchtring der drehbaren Elemente)
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  edge.raycast = () => {};
  edge.layers.set(LAYER_NO_REFLECT);
  edge.userData.sockelRand = true; // makeRefusing: das Element weigert sich beim Antippen
  g.add(edge);
  return g;
}

/** Lichtquelle: schlanker Scheinwerfer auf einer Säule, Linse strahlt in +x. */
function makeSource(el) {
  const root = new THREE.Group();
  root.add(makeFixedBase());

  const head = new THREE.Group();
  head.rotation.y = dirToRotationY(el.dir);
  root.add(head);

  const column = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, BEAM_Y - 0.05, 24), MAT.metalBright));
  column.position.y = 0.06 + (BEAM_Y - 0.05) / 2 - 0.02;
  if (!inCube()) head.add(column);

  const housing = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.15, 0.5, 40), MAT.metalDark));
  housing.rotation.z = Math.PI / 2;
  housing.position.set(-0.04, BEAM_Y, 0);
  head.add(housing);

  // Kühlrippen
  for (let i = 0; i < 4; i++) {
    const fin = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 40), MAT.metalBright));
    fin.rotation.y = Math.PI / 2;
    fin.position.set(-0.24 + i * 0.07, BEAM_Y, 0);
    head.add(fin);
  }

  const bezel = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 12, 48), MAT.metalBright));
  bezel.rotation.y = Math.PI / 2;
  bezel.position.set(0.21, BEAM_Y, 0);
  head.add(bezel);

  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 40), MAT.lens.clone());
  lens.rotation.y = Math.PI / 2;
  lens.position.set(0.212, BEAM_Y, 0);
  head.add(lens);

  root.userData.lens = lens;
  return root;
}

/** Spiegel: schmaler schwarzer Rahmen, silbrige Fläche mit Lichtstreifen, auf Drehteller mit 45°-Markierungen (fest: Steinblock). */
function makeMirror(el) {
  const root = new THREE.Group();
  root.add(el.fixed ? makeFixedBase() : makePedestal(0.4));

  // Gravierte 45°-Marken auf dem Teller (nur drehbare Spiegel – feste stehen auf dem eckigen Sockel)
  for (let i = 0; i < 8 && !el.fixed && !inCube(); i++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.004, 0.012), MAT.metalBright);
    const a = i * Math.PI / 4;
    tick.position.set(Math.cos(a) * 0.32, 0.063, Math.sin(a) * 0.32);
    tick.rotation.y = -a;
    root.add(tick);
  }

  const pivot = new THREE.Group();
  pivot.rotation.y = dirToRotationY(el.rot);
  root.add(pivot);

  const W = MIRROR_HALF_WIDTH * 2 * CELL, H = 0.6, T = 0.03, P = 0.034; // Breite, Höhe, Rahmentiefe, Profil
  const bottom = BEAM_Y - H / 2;

  const frame = new THREE.Group();
  const bar = (w, h, x, y) => {
    const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, T), MAT.frameBlack));
    m.position.set(x, y, 0);
    frame.add(m);
  };
  bar(W, P, 0, bottom + P / 2);
  bar(W, P, 0, bottom + H - P / 2);
  bar(P, H, -W / 2 + P / 2, bottom + H / 2);
  bar(P, H, W / 2 - P / 2, bottom + H / 2);
  pivot.add(frame);

  const glass = shadowed(new THREE.Mesh(new THREE.BoxGeometry(W - P * 1.4, H - P * 1.4, 0.012), MAT.mirror));
  glass.position.y = bottom + H / 2;
  pivot.add(glass);

  // Zwei schlanke Stützen zum Teller
  for (const sx of inCube() ? [] : [-0.22, 0.22]) {
    const leg = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, bottom - 0.06, 12), MAT.frameBlack));
    leg.position.set(sx, 0.06 + (bottom - 0.06) / 2, 0);
    pivot.add(leg);
  }

  root.userData.pivot = pivot;
  root.userData.orient = (e) => { pivot.rotation.y = dirToRotationY(e.rot); };
  return root;
}

/** Brillantschliff als Lathe-Profil (unten Spitze, oben Tafel), facettiert durch flatShading. */
function makeGemGeometry(radius) {
  const pts = [
    new THREE.Vector2(0.0, -0.95),
    new THREE.Vector2(0.62, -0.28),
    new THREE.Vector2(1.0, 0.0),
    new THREE.Vector2(1.0, 0.08),
    new THREE.Vector2(0.62, 0.42),
    new THREE.Vector2(0.0, 0.42),
  ].map(p => p.multiplyScalar(radius));
  const geo = new THREE.LatheGeometry(pts, 8);
  geo.computeVertexNormals();
  return geo;
}

/** Ziel: schwebender Edelstein in seiner Zielfarbe, mit Leuchtkern und glimmendem Ring. */
function makeTarget(el) {
  const root = new THREE.Group();
  root.add(makeFixedBase());
  const col = COLOR_RGB[el.color];
  const mask = el.color; // Farbmaske: Rot 1, Grün 2, Blau 4
  // Etwas sattere Variante der Strahlfarbe für den Stein (bei den satten Farben seit 10.11.2026 kaum ein Unterschied)
  const deep = new THREE.Color(col.r * col.r, col.g * col.g, col.b * col.b).lerp(col, 0.85);
  // Dunkle Farben (Blau, Rot) verwässern schnell: Mit viel Weiss und Schillern im Glas liest sich Blau neben
  // Weiss nur als „Weiss mit Blaustich“. Helle Farben vertragen mehr (und werden getroffen gedämpft, siehe litTame).
  const bt = brightTame(col);

  // Ring aus drei Bögen, ein fester Platz je Grundfarbe (Rot links, Grün rechts, Blau vorne; hinten offen, dort
  // verdeckt ihn der Stein). Es leuchten die Grundfarben, aus denen die Zielfarbe besteht: Blau ein Bogen, Cyan
  // zwei, Weiss drei. So ist die Farbe auch ohne Farbunterscheidung lesbar, und man sieht, woraus sie gemischt
  // wird. Kommt Licht an, zeigt jeder Bogen seine Grundfarbe: gebraucht und da = heller, fehlt = ruhig,
  // nicht gebraucht und da = flackert im leeren Platz (falsches Licht).
  const ringSegs = [];
  for (const p of [1, 2, 4]) {
    const on = (mask & p) !== 0;
    const seg = new THREE.Mesh(targetArcGeometry(), new THREE.MeshBasicMaterial({
      color: on ? COLOR_RGB[p].clone().multiplyScalar(TARGET_IDLE.ring) : TARGET_RING.offColor, toneMapped: false,
    }));
    // Bogen in der xy-Ebene drehen, dann flach legen: Winkel 90° zeigt zur Kamera (+z)
    seg.rotation.set(Math.PI / 2, 0, THREE.MathUtils.degToRad(TARGET_RING.slots[p] - TARGET_RING.arc / 2));
    seg.position.y = FIXED_BASE_TOP + 0.006;
    if (inCube()) { seg.position.y = BEAM_Y; seg.scale.setScalar(1.4); } // Würfel: um den Stein statt auf dem Sockel
    // In der Bodenspiegelung verdeckt ihn ohnehin das Spiegelbild des Sockels: dort nicht zeichnen
    seg.layers.set(LAYER_NO_REFLECT);
    root.add(seg);
    // arrive: Grundfarbe kommt sichtbar an (animiert 0..1). partial: Zusatzhelligkeit, wenn sie ankommt –
    // bei hellen Farben (Grün) gedämpft, sonst überstrahlt der Bogen schon vor dem Treffer.
    const partial = TARGET_RING.partial * (1 - 0.6 * brightTame(COLOR_RGB[p]));
    Object.assign(seg.userData, { primary: p, on, color: COLOR_RGB[p], partial, arrive: 0, arriveGoal: 0 });
    ringSegs.push(seg);
  }

  // Farbiger Lichthof auf dem Sockel: zeigt schon vor dem Treffer, welche Farbe das Ziel erwartet.
  const haloMat = new THREE.MeshBasicMaterial({
    map: spotTexture, color: col.clone().multiplyScalar(TARGET_IDLE.halo), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = inCube() ? BEAM_Y : FIXED_BASE_TOP + 0.008;
  halo.raycast = () => {};
  root.add(halo);

  // Bewusst ohne echte Transmission: die würde jedes Frame die ganze Szene ein zweites Mal rendern
  // (≈ ein Drittel der Frame-Zeit). Transparenz + Clearcoat + Iridescence + Leuchtkern wirken fast gleich.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: deep.clone().lerp(new THREE.Color(1, 1, 1), THREE.MathUtils.lerp(0.06, 0.3, bt)), // getönt, aber noch Glas
    metalness: 0, roughness: 0.04, ior: 2.0, specularIntensity: 1,
    transparent: true, opacity: 0.84,
    clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: THREE.MathUtils.lerp(0.15, 0.45, bt), iridescenceIOR: 1.8, // Schillern hellt dunkle Farben auf
    emissive: deep.clone(), emissiveIntensity: TARGET_IDLE.emissive,
    flatShading: true, envMapIntensity: 1.8,
  });
  // Kein Schattenwurf: der Stein dreht und schwebt, die Shadow-Map wird aber nur bei Änderungen
  // neu berechnet – und Transparenz kennt die Shadow-Map nicht (voll dunkler Schatten).
  const gem = new THREE.Mesh(makeGemGeometry(0.26), gemMat);
  gem.position.y = BEAM_Y;
  root.add(gem);

  // Opaker Leuchtkern: scheint durch den transparenten Stein.
  const coreMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(TARGET_IDLE.core) });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), coreMat);
  gem.add(core);

  root.userData.gem = gem;
  root.userData.core = core;
  root.userData.ringSegs = ringSegs;
  root.userData.halo = halo;
  root.userData.color = col;
  // Dunkle Farben (v. a. Blau) gehen sonst in den hellen Glanzlichtern unter: stärker selbst leuchten lassen.
  const lum = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
  // Helle Farben überschreiten die Bloom-Schwelle viel stärker: getroffen gedämpfter leuchten,
  // sonst wird der ganze Edelstein (v. a. Weiss) zum facettenlosen Fleck
  root.userData.litTame = 1 - 0.4 * bt;
  root.userData.emissiveTame = 1 - 0.65 * bt;
  root.userData.glowBoost = THREE.MathUtils.clamp(0.35 / Math.max(lum, 0.01), 1, 1.2);
  root.userData.hit = 0;        // animierter Zustand 0..1
  root.userData.hitGoal = 0;
  root.userData.wrong = 0;      // falsches Licht kommt an: animiert 0..1
  root.userData.wrongGoal = 0;
  root.userData.wrongMix = 0;
  root.userData.wrongColor = new THREE.Color();
  root.userData.flash = 0;      // kurzes Aufblitzen im Lösungsmoment (1 → 0)
  root.userData.phase = phasenZufall() * Math.PI * 2;
  root.userData.update = (t, dt) => updateTarget(root, t, dt);
  return root;
}

/** Leuchtstärken eines noch nicht getroffenen Ziels (getroffen kommt jeweils hit × … dazu). */
// Unter der Bloom-Schwelle bleiben, sonst kippt die Farbe im Tone Mapping ins Weisse.
const TARGET_IDLE = { core: 0.8, emissive: 0.15, ring: 0.7, halo: 0.12 };
/**
 * Farbring der Ziele: Radius (ausserhalb des Steins, Radius 0.26 – er schwebt höher und verdeckt von oben sonst die
 * Bögen; innerhalb des roten Sockelrands bei 0.30), Bogenmitte je Grundfarbe in Grad (0 = +x, 90 = zur Kamera; Rot
 * und Grün leicht nach vorne, damit sie auch im Hochformat neben dem Stein sichtbar bleiben), Bogenlänge, Dicke,
 * Farbe leerer Plätze und Zusatzhelligkeit eines gebrauchten Bogens, dessen Farbe schon ankommt.
 */
const TARGET_RING = {
  radius: 0.27, slots: { 1: 190, 2: 350, 4: 90 }, arc: 90, tube: 0.017,
  offColor: new THREE.Color(0.05, 0.05, 0.06), partial: 1.0,
};
let targetArcGeo = null;
/** Ein Bogen des Farbrings (geteilt von allen Zielen). */
function targetArcGeometry() {
  if (!targetArcGeo) {
    targetArcGeo = new THREE.TorusGeometry(TARGET_RING.radius, TARGET_RING.tube, 8, 32, THREE.MathUtils.degToRad(TARGET_RING.arc));
    SHARED_GEOMETRIES.add(targetArcGeo);
  }
  return targetArcGeo;
}

/** Ziel-Zustand weich nachführen (Glimmen ↔ hell leuchtend). */
function updateTarget(obj, t, dt) {
  const u = obj.userData;
  u.hit += (u.hitGoal - u.hit) * (1 - Math.pow(0.0005, dt));
  u.wrong += (u.wrongGoal - u.wrong) * (1 - Math.pow(0.002, dt));
  const h = u.hit, hl = h * u.litTame;
  u.flash *= Math.pow(0.04, dt);
  const f = u.flash;
  u.gem.scale.setScalar(1 + f * 0.28);
  u.gem.rotation.y = t * (0.25 + h * 0.6) + u.phase;
  u.gem.position.y = BEAM_Y + Math.sin(t * 1.1 + u.phase) * 0.018;
  const flicker = 1 + Math.sin(t * 13.0 + u.phase) * 0.03 * h;
  // Wartend atmet das Ziel langsam in seiner Farbe – es "fragt" nach Licht.
  const breathe = (1 - h) * (0.5 + 0.5 * Math.sin(t * 1.8 + u.phase));
  u.core.material.color.copy(u.color).multiplyScalar((TARGET_IDLE.core + breathe * 0.15 + hl * 6.9 + f * 14 * u.litTame) * flicker);
  u.gem.material.emissiveIntensity = (TARGET_IDLE.emissive + breathe * 0.05) * u.glowBoost + h * 1.3 * u.emissiveTame;
  u.halo.material.color.copy(u.color).multiplyScalar(TARGET_IDLE.halo + breathe * 0.05 + hl * 0.6 + f * 1.4);
  // Farbring: je Grundfarbe ein Bogen. Gebraucht: leuchtet, heller sobald seine Farbe ankommt (danach trägt hit).
  // Nicht gebraucht, kommt aber an: flackert unruhig im leeren Platz – z. B. "hier kommt zu viel Blau an".
  const ringLevel = TARGET_IDLE.ring + breathe * 0.1 + hl * 2.9 + f * 5;
  const unrest = 0.65 + 0.35 * Math.sin(t * 7.0 + u.phase) * Math.sin(t * 2.3);
  for (const seg of u.ringSegs) {
    const s = seg.userData;
    s.arrive += (s.arriveGoal - s.arrive) * (1 - Math.pow(0.002, dt));
    if (s.on) seg.material.color.copy(s.color).multiplyScalar(ringLevel + s.arrive * (1 - h) * s.partial);
    else seg.material.color.copy(TARGET_RING.offColor).lerp(_wrongTint.copy(s.color).multiplyScalar(TARGET_WRONG.ring * unrest), s.arrive);
  }
  // Falsche Farbe: Der Lichtfleck flackert zusätzlich in der Mischung, die ankommt; Stein und gebrauchte Bögen
  // zeigen weiter, welche Farbe gesucht ist.
  if (u.wrong > 0.002) u.halo.material.color.lerp(_wrongTint.copy(u.wrongColor).multiplyScalar(TARGET_WRONG.halo * unrest), u.wrong);
}
/** Ziel mit Licht der falschen Farbe: leerer Platz im Farbring und Lichtfleck (unter der Bloom-Schwelle). */
const TARGET_WRONG = { ring: 0.9, halo: 0.6 };
const _wrongTint = new THREE.Color();

/* ---------- Phase 4: Prisma, Farbfilter, Kombinator, Blocker ---------- */

/** Geschliffenes Glas ohne Transmission (zu teuer, siehe Edelstein); tiefen-neutral, damit Strahlen im Glas sichtbar bleiben. */
function makeGlassMaterial(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color, metalness: 0, roughness: 0.03, ior: 1.5, specularIntensity: 1,
    transparent: true, opacity: 0.42, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.02,
    iridescence: 0.7, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 700],
    flatShading: true, envMapIntensity: 2.2,
  }, opts));
}

/** Feine, helle Glaskanten: lassen den Schliff auch vor dunklem Grund erkennen. */
function glassEdges(geometry, opacity = 0.28) {
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 20),
    new THREE.LineBasicMaterial({ color: 0xdfe6ff, transparent: true, opacity, depthWrite: false })
  );
  lines.renderOrder = 6; // nach dem Glas (renderOrder 5), sonst deckt es die Kanten ab
  lines.raycast = () => {};
  return lines;
}

/** Weicher Regenbogenverlauf (für das Spektralfenster des Prismas). */
function createSpectrumTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  ['#ff2a1e', '#ffb21e', '#f4ff3a', '#30ff6a', '#2ad8ff', '#3a5bff', '#a43aff'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 32);
  // vertikal weich ausblenden
  const v = ctx.createLinearGradient(0, 0, 0, 32);
  v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 256, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const spectrumTexture = createSpectrumTexture();

/** Leuchtzustand eines Elements weich nachführen: aktiv, sobald die Strahlfront es erreicht. */
function activeColorOf(u) {
  let color = 0;
  for (const r of u.events || []) if (beamView.revealed(r, r.worldDist)) color |= r.ev.color;
  return color;
}
function easeToward(current, goal, dt, speed = 0.0005) {
  return current + (goal - current) * (1 - Math.pow(speed, dt));
}

/**
 * Zeichen des Prismas auf seinem Sockel (PLAN 1.3): hinten ein weisser Strich (Eingang), vorn drei Pfeilspitzen in Rot,
 * Grün und Blau, jede in Richtung ihres Strahls (refractInPrism: Rot rot − 1, Grün rot, Blau rot + 1; lokal liegt der
 * Austritt bei −z und Rot auf der Seite −x). Sie drehen mit und zeigen auch ohne Licht, wohin das Prisma die Farben
 * wirft; tritt eine Farbe aus, leuchtet ihr Pfeil heller (unter der Bloom-Schwelle). Die Pfeile liegen vor der
 * Bodenplatte des Prismas, sonst verdeckte diese sie von oben. Auf dem eckigen Steinsockel eines festen Prismas ist
 * weniger Platz als auf dem Drehteller (Radius 0.38): Dort sind sie kleiner und näher.
 */
const PRISM_MARKS = {
  fan: [{ color: 1, offset: -1 }, { color: 2, offset: 0 }, { color: 4, offset: 1 }],
  arrowAt: 0.3, arrowAtFixed: 0.27, arrowScaleFixed: 0.75,
  barAt: 0.35, barAtFixed: 0.31,
  plateY: 0.078, // über dem Drehteller samt Leuchtring (Oberkante 0.07)
  arrowIdle: 1.1, arrowLit: 0.8, barIdle: 0.75, barLit: 0.4,
};
let prismMarkParts = null; // Geometrien, geteilt von allen Prismen (beim ersten Gebrauch gebaut)
function prismMarkGeometries() {
  if (prismMarkParts) return prismMarkParts;
  const arrow = new THREE.ShapeGeometry(new THREE.Shape(
    [[0, 0.075], [0.075, -0.045], [0, -0.018], [-0.075, -0.045]].map(([x, y]) => new THREE.Vector2(x, y))
  )).rotateX(-Math.PI / 2); // Spitze nach −z
  const bar = new THREE.BoxGeometry(0.16, 0.008, 0.04);
  for (const geo of [arrow, bar]) SHARED_GEOMETRIES.add(geo);
  prismMarkParts = { arrow, bar };
  return prismMarkParts;
}
/** Gruppe der Zeichen (lokal wie das Prisma) und update(Farben, die austreten; Leuchten des Prismas; dt). */
function makePrismMarks(fixed) {
  const { arrow, bar } = prismMarkGeometries();
  const m = PRISM_MARKS;
  const y = fixed ? FIXED_BASE_TOP + 0.012 : m.plateY; // Steinsockel: über der Randleiste (Oberkante 0.079)
  const group = new THREE.Group();
  const flat = (geo, mat) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.raycast = () => {};
    mesh.layers.set(LAYER_NO_REFLECT); // wie die Leuchtränder nicht in der Bodenspiegelung
    group.add(mesh);
    return mesh;
  };
  const arrows = m.fan.map(({ color, offset }) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0, side: THREE.DoubleSide });
    const mesh = flat(arrow, mat);
    const a = offset * Math.PI / 4, r = fixed ? m.arrowAtFixed : m.arrowAt;
    mesh.position.set(Math.sin(a) * r, y, -Math.cos(a) * r);
    mesh.rotation.y = -a; // Spitze −z → (sin a, −cos a)
    if (fixed) mesh.scale.setScalar(m.arrowScaleFixed);
    // Helle Farben (Grün) gedämpft, sonst überstrahlen sie Rot und Blau
    return { color, mat, glow: 0, tame: 1 - 0.5 * brightTame(COLOR_RGB[color]) };
  });
  const barMat = new THREE.MeshBasicMaterial({ color: 0 });
  flat(bar, barMat).position.set(0, y, fixed ? m.barAtFixed : m.barAt);
  return {
    group,
    update(color, glow, dt) {
      for (const a of arrows) {
        a.glow = easeToward(a.glow, color & a.color ? 1 : 0, dt);
        a.mat.color.copy(COLOR_RGB[a.color]).multiplyScalar((m.arrowIdle + a.glow * m.arrowLit) * a.tame);
      }
      barMat.color.setScalar(m.barIdle + glow * m.barLit);
    },
  };
}

/**
 * Prisma: dreiseitiges Glasprisma zwischen zwei Metallplatten, Austrittsfläche (lokal −z) in Richtung rot·45°, auf dem
 * Sockel seine Zeichen (makePrismMarks).
 */
function makePrism(el) {
  const root = new THREE.Group();
  root.add(el.fixed ? makeFixedBase() : makePedestal(0.38));
  const pivot = new THREE.Group();
  root.add(pivot);

  const H = 0.5;
  const R = 0.33;
  const geo = new THREE.CylinderGeometry(R, R, H, 3, 1); // Ecke lokal bei +z, gegenüber die Fläche bei −z
  const glass = new THREE.Mesh(geo, makeGlassMaterial(new THREE.Color(0.86, 0.9, 1.0), { iridescence: 1.0 }));
  glass.position.y = BEAM_Y;
  glass.renderOrder = 5;
  pivot.add(glass);
  const edges = glassEdges(geo, 0.32);
  edges.position.y = BEAM_Y;
  pivot.add(edges);

  for (const y of [BEAM_Y - H / 2 - 0.012, BEAM_Y + H / 2 + 0.012]) {
    const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.024, 3), MAT.metalBright));
    cap.position.y = y;
    pivot.add(cap);
  }
  const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, BEAM_Y - H / 2 - 0.07, 12), MAT.metalBright));
  post.position.y = 0.06 + (BEAM_Y - H / 2 - 0.07) / 2;
  if (!inCube()) pivot.add(post);

  // Spektralfenster auf der Austrittsfläche: zeigt die Fächerrichtung und leuchtet, wenn Licht austritt.
  // (Bei Blick von aussen liegt Rot auf der Seite, zu der der rote Strahl abgelenkt wird.)
  const veilMat = new THREE.MeshBasicMaterial({
    map: spectrumTexture, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 1,
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(R * Math.sqrt(3) * 0.8, H * 0.82), veilMat);
  veil.position.set(0, BEAM_Y, -(R * 0.5 + 0.004));
  veil.raycast = () => {};
  pivot.add(veil);

  const marks = makePrismMarks(el.fixed);
  pivot.add(marks.group);

  const u = root.userData;
  u.pivot = pivot;
  u.veil = veil;
  u.glow = 0;
  // Austrittsfläche lokal −z → Rasterrichtung (cos a, sin a): rotation.y = −π/2 − a
  u.orient = (e) => { pivot.rotation.y = -Math.PI / 2 - e.rot * Math.PI / 4; };
  u.orient(el);
  u.update = (t, dt) => {
    const color = activeColorOf(u);
    u.glow = easeToward(u.glow, color ? 1 : 0, dt);
    veilMat.color.setScalar(0.08 + u.glow * 1.1);
    marks.update(color, u.glow, dt);
  };
  return root;
}

/** Farbfilter: schwebender, sechseckig geschliffener Kristall in seiner Durchlassfarbe. */
function makeFilter(el) {
  const root = new THREE.Group();
  root.add(makeFixedBase());
  const col = COLOR_RGB[el.color];

  const pts = [[0, -0.34], [0.16, -0.2], [0.18, 0.16], [0, 0.34]].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(pts, 6);
  // Wie beim Zielkristall: Dunkle Farben (Blau, Rot) mit weniger Weiss und Schillern, etwas deckender und mit mehr
  // Eigenleuchten – sonst wirkt ein Blaufilter blasslila.
  const bt = brightTame(col);
  const idleGlow = THREE.MathUtils.lerp(0.3, 0.18, bt);
  const tint = col.clone().lerp(new THREE.Color(1, 1, 1), THREE.MathUtils.lerp(0.05, 0.25, bt));
  const crystal = new THREE.Mesh(geo, makeGlassMaterial(tint, {
    opacity: THREE.MathUtils.lerp(0.72, 0.62, bt), emissive: col.clone(), emissiveIntensity: idleGlow,
    iridescence: THREE.MathUtils.lerp(0.1, 0.3, bt),
  }));
  crystal.position.y = BEAM_Y;
  crystal.renderOrder = 5;
  root.add(crystal);
  const edges = glassEdges(geo, 0.22);
  crystal.add(edges);

  const coreMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.5) });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), coreMat);
  crystal.add(core);

  const ringMat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.5) });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.008, 8, 48), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = FIXED_BASE_TOP + 0.006;
  if (inCube()) { ring.position.y = BEAM_Y; ring.scale.setScalar(1.5); }
  root.add(ring);

  const u = root.userData;
  u.glow = 0;
  u.phase = phasenZufall() * Math.PI * 2;
  u.update = (t, dt) => {
    u.glow = easeToward(u.glow, activeColorOf(u) ? 1 : 0, dt);
    crystal.rotation.y = t * 0.3 + u.phase;
    crystal.position.y = BEAM_Y + Math.sin(t * 0.9 + u.phase) * 0.012;
    coreMat.color.copy(col).multiplyScalar(0.5 + u.glow * 4.5);
    ringMat.color.copy(col).multiplyScalar(0.5 + u.glow * 2.0);
    crystal.material.emissiveIntensity = idleGlow + u.glow * 0.8;
  };
  return root;
}

/** Kombinator: Glaskugel in einer kardanischen Fassung, Austrittsdüse zeigt in Richtung dir. */
function makeCombiner(el) {
  const root = new THREE.Group();
  root.add(el.fixed ? makeFixedBase() : makePedestal(0.38));
  const pivot = new THREE.Group();
  root.add(pivot);

  const orbGeo = new THREE.IcosahedronGeometry(0.2, 1);
  const orb = new THREE.Mesh(orbGeo, makeGlassMaterial(new THREE.Color(0.9, 0.92, 1.0), { opacity: 0.38 }));
  orb.position.y = BEAM_Y;
  orb.renderOrder = 5;
  pivot.add(orb);
  orb.add(glassEdges(orbGeo, 0.18));

  const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.15, 0.15, 0.17) });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 14), coreMat);
  core.position.y = BEAM_Y;
  pivot.add(core);

  // Kardanische Ringe
  const gimbal = new THREE.Group();
  gimbal.position.y = BEAM_Y;
  pivot.add(gimbal);
  for (const [rx, ry] of [[Math.PI / 2, 0], [0, 0]]) {
    // kein Schattenwurf: die Ringe drehen sich, die Shadow-Map wird nur bei Änderungen erneuert
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.01, 8, 64), MAT.metalBright);
    ring.rotation.set(rx, ry, 0);
    gimbal.add(ring);
  }

  // Austrittsdüse (lokal +x) mit Linse in der Mischfarbe. Hell und mit schwach leuchtender Linse, damit die
  // Richtung auch ohne Licht und auf dem Handy erkennbar ist; die Linse ist eine flache Scheibe statt einer
  // Kreisfläche, damit sie auch von oben als Streifen zu sehen ist.
  const nozzle = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.14, 24), MAT.metalBright));
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(0.31, BEAM_Y, 0);
  pivot.add(nozzle);
  const lensMat = new THREE.MeshBasicMaterial({ color: COMBINER_LENS_IDLE.clone() });
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.02, 24), lensMat);
  lens.rotation.z = Math.PI / 2;
  lens.position.set(0.39, BEAM_Y, 0);
  pivot.add(lens);

  const post = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, BEAM_Y - 0.33, 12), MAT.metalBright));
  post.position.y = 0.06 + (BEAM_Y - 0.33) / 2;
  if (!inCube()) pivot.add(post);

  const u = root.userData;
  u.pivot = pivot;
  u.glow = 0;
  u.mix = 0;
  u.orient = (e) => { pivot.rotation.y = dirToRotationY(e.dir); };
  u.orient(el);
  const tmp = new THREE.Color();
  let shown = 7;
  u.update = (t, dt) => {
    const arrived = activeColorOf(u); // nur Farben, deren Strahl schon sichtbar angekommen ist
    if (arrived) shown = arrived;
    u.glow = easeToward(u.glow, arrived ? 1 : 0, dt);
    gimbal.rotation.y = t * 0.35;
    gimbal.rotation.x = Math.sin(t * 0.4) * 0.25;
    const tame = 1 - 0.45 * brightTame(COLOR_RGB[shown]); // weisse Mischung sonst eine weisse Scheibe
    tmp.copy(COLOR_RGB[shown]).multiplyScalar(2.6 * tame);
    coreMat.color.setRGB(0.15, 0.15, 0.17).lerp(tmp, u.glow);
    tmp.copy(COLOR_RGB[shown]).multiplyScalar(4.0 * tame);
    lensMat.color.copy(COMBINER_LENS_IDLE).lerp(tmp, u.glow);
  };
  return root;
}
/** Linse des Kombinators ohne Licht: schwach leuchtend (unter der Bloom-Schwelle), zeigt die Austrittsrichtung. */
const COMBINER_LENS_IDLE = new THREE.Color(0.55, 0.57, 0.66);

/** Blocker: schwere, dunkle Steinsäule mit Metallband. */
function makeBlocker() {
  const root = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x0c0c10, roughness: 0.62, metalness: 0, envMapIntensity: 0.6, flatShading: true,
  });
  const column = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.33, 0.92, 6), stoneMat));
  column.position.y = 0.46;
  column.rotation.y = Math.PI / 6;
  root.add(column);
  const top = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.06, 6), stoneMat));
  top.position.y = 0.95;
  top.rotation.y = Math.PI / 6;
  root.add(top);
  const band = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.34, 0.035, 6), MAT.metalDark));
  band.position.y = 0.1;
  band.rotation.y = Math.PI / 6;
  root.add(band);
  return root;
}

const ELEMENT_FACTORIES = {
  source: makeSource,
  mirror: makeMirror,
  prism: makePrism,
  filter: makeFilter,
  combiner: makeCombiner,
  blocker: makeBlocker,
  target: makeTarget,
};

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  BEAM_Y: () => BEAM_Y, cubeToWorld: () => cubeToWorld, fixedBase: () => fixedBase, gridToWorld: () => gridToWorld,
});

export {
  BEAM_Y, beamPointToWorld, COLOR_RGB, CUBE_FLOOR, CUBE_MOUNT, cubeToWorld, ELEMENT_FACTORIES, FIXED_EDGE, fixedBase,
  gridToWorld, inCube, MAT, normalToWorld, placeInCube,
};
