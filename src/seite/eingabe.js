// Eingabe: Maus, Finger, Mausrad, Hover (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import './brett/strahlen.js';
import { camera, LAYER_NO_REFLECT, renderer, sceneLoop } from './szene.js';
import { cameraRig, drag } from './kamera.js';
import { BEAM_Y, CUBE_MOUNT, inCube } from './brett/elemente.js';
import { CUBE, game, rotateElement, weigern } from './brett/feld.js';
import { flow } from './levelfluss.js';
import { fuehrung } from './fuehrung.js';
import { adaptiveResolution } from './aufloesung.js';
import { isRotatable, pickTapped } from '../logik.js';
import { alsGlobal } from './testschnittstelle.ts';

/* =====================================================================
   INTERAKTION — Klick/Tap dreht +45°, Rechtsklick/langes Drücken −45°,
   Ziehen dreht die Kamera, Mausrad/zwei Finger zoomen. Hover: sanfter Lichtrand + Lichtkreis am Boden.
   ===================================================================== */

const INPUT = {
  pulseDuration: 1.1, // Sekunden: Aufleuchten der drehbaren Elemente zu Levelbeginn
  dragThresholdMouse: 5,    // px, ab hier ist es ein Ziehen statt eines Klicks
  dragThresholdTouch: 10,
  longPressMs: 450,
  touchSlop: 26,            // px: so weit daneben darf ein Finger tippen und trifft trotzdem
  hoverFade: 0.0008,        // Glättung des Hover-Leuchtens (pro Sekunde verbleibender Anteil)
  wheelZoom: 0.001,         // Zoom je Pixel Mausrad (ein Raster ≈ 100 px ≈ 10 %), gedeckelt auf wheelStep je Ereignis
  wheelStep: 100,
};

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
// pinch: zweiter Finger, solange zwei Finger zoomen ({ id, x, y, d: letzter Abstand der Finger })
const input = { pointer: null, pinch: null, hovered: null, longPressTimer: 0 };

const _pickPos = new THREE.Vector3();
/**
 * Element unter einem Bildschirmpunkt, über die Trefferzylinder: drehbare und feste mit Sockel (Weigerung), Drehbares
 * im Toleranzbereich gewinnt immer (pickTapped). slop (px): verfehlt der Strahl die Zylinder, zählt auch ein Element,
 * dessen Mitte höchstens so weit entfernt liegt (Finger sind ungenau).
 */
function pickElement(clientX, clientY, slop = 0) {
  if (flow.state !== 'play') return null; // während eines Levelwechsels nichts anwählen
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNdc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointerNdc, camera);
  const cands = raycaster.intersectObjects(game.hitProxies, false)
    .map((h) => ({ el: h.object.userData.element, hit: h.distance, px: Infinity }));
  if (slop > 0) {
    for (const proxy of game.hitProxies) { // Abstände hier in Pixeln des Layouts (clientX, Rechteck)
      proxy.getWorldPosition(_pickPos).project(camera);
      const px = Math.hypot((_pickPos.x + 1) / 2 * rect.width + rect.left - clientX,
        (1 - _pickPos.y) / 2 * rect.height + rect.top - clientY);
      cands.push({ el: proxy.userData.element, hit: null, px });
    }
  }
  return pickTapped(cands, slop * SEITE, fuehrung.vorrang());
}

/**
 * Nur drehbare Elemente, die drehen dürfen (Hover, Lichtrand, Drehen): Feste reagieren allein aufs Antippen, unter der
 * Sperre der Führung weigern sich auch drehbare ausser den markierten (fuehrung.darf).
 */
const rotatableOnly = (el) => (el && isRotatable(el) && fuehrung.darf(el) ? el : null);

function setHovered(el) {
  if (input.hovered === el) return;
  input.hovered = el;
  sceneLoop.wake(); // Hover blendet weich ein und aus
  renderer.domElement.style.cursor = el ? 'pointer' : '';
}

/** Fresnel-Lichtrand: additiv über den Flächen eines Elements, nur wenn es gehovert wird. */
const RIM_VERTEX = `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const RIM_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.6);
    gl_FragColor = vec4(uColor * f * uIntensity, 1.0);
  }`;

function createHoverRingTexture(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const h = size / 2;
  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0.0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.02)');
  g.addColorStop(0.74, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.8, 'rgba(255,255,255,0.18)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const hoverRingTexture = createHoverRingTexture(256);
const hoverRingGeometry = new THREE.PlaneGeometry(1.15, 1.15);
// Höhe ≈ Modellhöhe: höhere Zylinder fingen bei schrägem Blick Klicks auf das dahinterliegende Element ab
const hitProxyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.75, 12);
const hitProxyMaterial = new THREE.MeshBasicMaterial({ visible: false });
const SHARED_GEOMETRIES = new Set([hoverRingGeometry, hitProxyGeometry]);

/** Gestrichelter Ring (Torus-Bögen) als eine Geometrie: count Striche, gap = Anteil der Lücke. */
function dashedRingGeometry(radius, count, gap, tube) {
  const step = Math.PI * 2 / count;
  const parts = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.TorusGeometry(radius, tube, 6, 10, step * (1 - gap));
    g.rotateZ(i * step);
    parts.push(g);
  }
  return mergeGeometries(parts);
}

/** Fügt indizierte Geometrien zu einer zusammen (ein Draw-Call); gibt die Teile frei. */
function mergeGeometries(parts) {
  const pos = [], nor = [], uv = [], idx = [];
  let offset = 0;
  for (const g of parts) {
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
    if (g.attributes.uv) uv.push(...g.attributes.uv.array);
    for (const k of g.index.array) idx.push(k + offset);
    offset += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (uv.length === offset * 2) out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}

/** Rüstet ein drehbares Element mit Trefferzylinder, Lichtrand, Boden-Lichtkreis und Leuchtring aus. */
function makeInteractive(obj) {
  const u = obj.userData;

  const proxy = new THREE.Mesh(hitProxyGeometry, hitProxyMaterial);
  proxy.position.y = inCube() ? BEAM_Y : 0.375;
  if (inCube()) proxy.scale.set(1.2, 1.35, 1.2); // Würfel: Ring mit Marken (0.58) und Achszapfen (±0.475) einschliessen
  proxy.userData.element = u.element;
  obj.add(proxy);
  game.hitProxies.push(proxy);

  const rimMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0.75, 0.82, 1.0) }, uIntensity: { value: 0 } },
    vertexShader: RIM_VERTEX,
    fragmentShader: RIM_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    fog: false,
  });
  const overlays = [];
  const solids = [];
  obj.traverse((m) => {
    if (!m.isMesh || m === proxy || !m.material || m.material.blending === THREE.AdditiveBlending) return;
    solids.push(m);
  });
  for (const m of solids) {
    const o = new THREE.Mesh(m.geometry, rimMat);
    o.renderOrder = 7;
    o.raycast = () => {};
    o.visible = false;
    o.layers.set(LAYER_NO_REFLECT);
    m.add(o);
    overlays.push(o);
  }

  const ringMat = new THREE.MeshBasicMaterial({
    map: hoverRingTexture, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, color: new THREE.Color(0, 0, 0),
  });
  const ring = new THREE.Mesh(hoverRingGeometry, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = inCube() ? BEAM_Y : 0.006;
  ring.raycast = () => {};
  ring.visible = false;
  ring.layers.set(LAYER_NO_REFLECT);
  obj.add(ring);

  // Leuchtring auf dem Drehteller: dauerhaftes Zeichen "drehbar" (alles Feste steht auf einem eckigen Sockel
  // mit rotem Leuchtrand, siehe makeFixedBase).
  // Grundhelligkeit unter der Bloom-Schwelle, damit er ruhig bleibt; zu Levelbeginn pulsiert er einmal.
  const pedestalDisk = obj.children[0]?.children[0];
  const turnR = inCube() ? CUBE_MOUNT.ring : (pedestalDisk?.geometry?.parameters?.radiusTop ?? 0.38) - 0.03;
  const turnMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  // gestrichelt (6 grobe Striche, halbe Lücken): Filter haben einen durchgehenden Ring in ihrer Farbe, Ziele drei
  // farbige Bögen auf eckigem Sockel – so ist "drehbar" eine eigene Form. Alle Striche in einer Geometrie
  // (ein Draw-Call je Element).
  const turnRing = new THREE.Mesh(dashedRingGeometry(turnR, 6, 0.5, 0.017), turnMat);
  turnRing.rotation.x = Math.PI / 2;
  turnRing.position.y = inCube() ? BEAM_Y : 0.064;
  turnRing.raycast = () => {};
  turnRing.layers.set(LAYER_NO_REFLECT);
  obj.add(turnRing);

  u.hover = 0;
  u.pulseT = -1000; // Zeit seit Beginn des Pulses (negativ: Verzögerung; -1000: kein Puls)
  u.startPulse = (delay = 0) => { u.pulseT = -delay; sceneLoop.wake(); };
  u.updateHover = (dt) => {
    const goal = input.hovered === u.element ? 1 : 0;
    u.hover += (goal - u.hover) * (1 - Math.pow(INPUT.hoverFade, dt));
    if (u.hover < 0.002 && goal === 0) u.hover = 0;
    let pulse = 0;
    if (u.pulseT > -100) {
      u.pulseT += dt;
      if (u.pulseT >= INPUT.pulseDuration) u.pulseT = -1000; // fertig
      else if (u.pulseT > 0) pulse = Math.sin(Math.PI * u.pulseT / INPUT.pulseDuration);
    }
    const lit = Math.max(u.hover, pulse * 0.8);
    const on = lit > 0;
    rimMat.uniforms.uIntensity.value = lit * 0.6;
    for (const o of overlays) o.visible = on;
    ring.visible = u.hover > 0;
    ringMat.color.setRGB(0.55, 0.62, 0.85).multiplyScalar(u.hover * 1.3);
    turnMat.color.setRGB(0.66, 0.7, 0.8).multiplyScalar(0.85 + u.hover * 0.4 + pulse * 2.2); // kühles Weiss, so hell wie zuvor das Eisblau
  };
  u.warmup = (on) => { for (const o of overlays) o.visible = on; ring.visible = on; }; // siehe warmupShaders
}

/* ---------- Zeiger-Ereignisse ---------- */

/** dx, dy in Pixeln der Oberfläche (SEITE) */
function dragCamera(dx, dy) {
  const s = 2.4 / Math.max(window.innerWidth / SEITE, 600);
  cameraRig.homing = null;
  fuehrung.kamera();
  cameraRig.goalTheta -= dx * s;
  // Nach einer ganzen Runde beide Winkel um 2π zurücknehmen (gleiches Bild): Der Rückflug beim Levelwechsel
  // nimmt so den kürzesten Weg, statt alle Runden zurückzudrehen.
  const wrap = Math.round(cameraRig.goalTheta / (2 * Math.PI)) * 2 * Math.PI;
  cameraRig.goalTheta -= wrap;
  cameraRig.userTheta -= wrap;
  const { up, down } = phiLimits();
  cameraRig.goalPhi = THREE.MathUtils.clamp(cameraRig.goalPhi - dy * s, -up, down);
}

/**
 * Grenzen der Neigung gegen basePhi (nach oben, nach unten). Würfel: deutlich freier – von oben in die Schächte, von
 * der Seite auf die Ebenen.
 */
function phiLimits() {
  const base = cameraRig.basePhi + CUBE.cameraTilt;
  return cameraRig.cube ? { up: base - CUBE.phiMin, down: CUBE.phiMax - base }
    : { up: cameraRig.limitsPhiUp, down: cameraRig.phiMax - cameraRig.basePhi };
}

/** Zoom um den Faktor f (> 1: weiter weg), in den Grenzen von cameraRig. */
function zoomCamera(f) {
  cameraRig.homing = null;
  fuehrung.kamera();
  cameraRig.goalZoom = THREE.MathUtils.clamp(cameraRig.goalZoom * f, cameraRig.zoomMin, cameraRig.zoomMax);
}

function endPointer() {
  clearTimeout(input.longPressTimer);
  if (input.pointer && input.pointer.type !== 'mouse') setHovered(null);
  input.pointer = null;
  input.pinch = null;
  if (drag.active) {
    drag.active = false;
    adaptiveResolution.hold(1);
  }
}

const canvasEl = renderer.domElement;

// iOS Safari ignoriert user-scalable=no: Pinch-Zoom der Seite (statt des Spiels) explizit unterbinden
document.addEventListener('gesturestart', (e) => e.preventDefault());

canvasEl.addEventListener('pointerdown', (e) => {
  // Eine Maus kann nicht zweimal drücken, ohne loszulassen: verlorenes pointerup aufräumen
  if (input.pointer && e.pointerType === 'mouse') endPointer();
  const first = input.pointer;
  if (first && !input.pinch && first.type !== 'mouse' && e.pointerType !== 'mouse') {
    // Zweiter Finger: zoomen statt tippen oder drehen
    clearTimeout(input.longPressTimer);
    first.consumed = true;
    input.pinch = { id: e.pointerId, x: e.clientX, y: e.clientY, d: Math.hypot(e.clientX - first.cx, e.clientY - first.cy) };
    try { canvasEl.setPointerCapture(e.pointerId); } catch { /* z. B. synthetische Zeiger */ }
    drag.active = true;
    setHovered(null);
    return;
  }
  if (input.pointer || e.button === 1) return; // sonst ein Zeiger zur Zeit; Mittelklick ignorieren
  const picked = pickElement(e.clientX, e.clientY, e.pointerType === 'mouse' ? 0 : INPUT.touchSlop);
  const el = rotatableOnly(picked);
  // x, y: zuletzt fürs Drehen ausgewertet; cx, cy: wo der Zeiger gerade ist (für den Abstand beim Zoomen);
  // done: nach dem Zoomen mit zwei Fingern dreht der verbliebene nicht mehr (ein neuer zweiter zoomt wieder);
  // fest: angetipptes festes Element, es weigert sich beim Loslassen
  input.pointer = {
    id: e.pointerId, type: e.pointerType, button: e.button,
    x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY,
    el, fest: el ? null : picked, moved: false, consumed: false, done: false,
  };
  try { canvasEl.setPointerCapture(e.pointerId); } catch { /* z. B. synthetische Zeiger */ }
  if (el) setHovered(el);
  // Langes Drücken (v. a. Touch): Gegenrichtung
  if (el && e.button === 0 && e.pointerType !== 'mouse') {
    input.longPressTimer = setTimeout(() => {
      const p = input.pointer;
      if (!p || p.moved || p.consumed) return;
      p.consumed = true;
      if (!fuehrung.darf(p.el)) { weigern(p.el); return; } // der Schritt wechselte während des Drückens
      rotateElement(p.el, -1);
      if (navigator.vibrate) navigator.vibrate(12);
    }, INPUT.longPressMs);
  }
});

canvasEl.addEventListener('pointermove', (e) => {
  const p = input.pointer;
  if (!p) {
    if (e.pointerType === 'mouse') setHovered(rotatableOnly(pickElement(e.clientX, e.clientY)));
    return;
  }
  const q = input.pinch;
  if (e.pointerId === p.id) { p.cx = e.clientX; p.cy = e.clientY; }
  else if (q && e.pointerId === q.id) { q.x = e.clientX; q.y = e.clientY; }
  else return;
  if (q) {
    const d = Math.hypot(q.x - p.cx, q.y - p.cy);
    if (d > 0 && q.d > 0) zoomCamera(q.d / d); // auseinander: näher heran
    q.d = d;
    return;
  }
  if (p.done) return;
  if (!p.moved) {
    const threshold = p.type === 'mouse' ? INPUT.dragThresholdMouse : INPUT.dragThresholdTouch;
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) / SEITE < threshold) return;
    p.moved = true;
    clearTimeout(input.longPressTimer);
    drag.active = true;
    setHovered(null);
  }
  dragCamera((e.clientX - p.x) / SEITE, (e.clientY - p.y) / SEITE);
  p.x = e.clientX;
  p.y = e.clientY;
});

/** Zweiter Finger losgelassen: Zoomen fertig, der erste dreht bis zum Loslassen nicht mehr. */
function endPinch(e) {
  if (!input.pinch || e.pointerId !== input.pinch.id) return false;
  input.pinch = null;
  input.pointer.done = true;
  return true;
}

canvasEl.addEventListener('pointerup', (e) => {
  if (endPinch(e)) return;
  const p = input.pointer;
  if (!p || e.pointerId !== p.id) return;
  // die Sperre noch einmal: Zwischen Drücken und Loslassen kann der Schritt gewechselt haben
  if (!p.moved && !p.consumed && p.el && fuehrung.darf(p.el)) rotateElement(p.el, p.button === 2 ? -1 : 1);
  else if (!p.moved && !p.consumed && (p.fest || p.el)) weigern(p.fest ?? p.el);
  endPointer();
  if (e.pointerType === 'mouse') setHovered(rotatableOnly(pickElement(e.clientX, e.clientY)));
});
canvasEl.addEventListener('pointercancel', (e) => { if (!endPinch(e) && input.pointer && e.pointerId === input.pointer.id) endPointer(); });
canvasEl.addEventListener('lostpointercapture', (e) => { if (!endPinch(e) && input.pointer && e.pointerId === input.pointer.id) endPointer(); });
// Mausrad; die Zwei-Finger-Geste des Touchpads kommt als Rad mit ctrlKey (feiner, darum stärker gewichtet) und
// skalierte sonst die ganze Seite
canvasEl.addEventListener('wheel', (e) => {
  e.preventDefault();
  const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight / SEITE : 1) * (e.ctrlKey ? 10 : 1);
  zoomCamera(Math.exp(THREE.MathUtils.clamp(px, -INPUT.wheelStep, INPUT.wheelStep) * INPUT.wheelZoom));
  adaptiveResolution.hold(1); // wie beim Ziehen: währenddessen die Auflösung nicht umbauen
}, { passive: false });
window.addEventListener('blur', () => { if (input.pointer) endPointer(); });
// Mittelklick: kein Autoscroll
canvasEl.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
canvasEl.addEventListener('pointerleave', (e) => { if (!input.pointer && e.pointerType === 'mouse') setHovered(null); });

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  input: () => input, INPUT: () => INPUT, phiLimits: () => phiLimits,
});

export {
  canvasEl, hitProxyGeometry, hitProxyMaterial, input, makeInteractive, mergeGeometries, phiLimits, setHovered,
  SHARED_GEOMETRIES,
};
