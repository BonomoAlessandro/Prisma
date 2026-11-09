// Aufruf: node tests/screenshot.mjs wackeln 1440 900 300 "$(cat tests/wackel-probe.js)"
//   Handy: MOBILE=1 DPR=3 node tests/screenshot.mjs wackeln-handy 393 852 300 "$(cat tests/wackel-probe.js)"
// Weigerung (Ticket 02 von .scratch/tutorial-fuehrung/): Ein festes Element mit Sockel antippen. Es wackelt, nur sein
// Rand blitzt (eigenes Material, danach wieder das geteilte), Zugzahl, Strahlen und Speicherstand bleiben. Dazu: Ein
// Tippen auf ein drehbares Element dreht es weiterhin, und ein Levelwechsel mitten im Wackeln räumt auf. Wirft bei
// einem Fehler (screenshot.mjs meldet FEHLGESCHLAGEN).
(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const check = (ok, text) => { if (!ok) throw new Error('Weigerung: ' + text); };
  if (!window.__prisma.playing() && window.__prismaDebug.flow.state === 'story') window.__prismaDebug.zeige(0);
  while (!window.__prisma.playing()) await wait(50); // Level-Übergang abwarten
  const canvas = renderer.domElement;
  const touch = IS_MOBILE; // Handy-Ansicht (MOBILE=1): Finger mit INPUT.touchSlop, sonst Maus
  const rect = canvas.getBoundingClientRect();
  camera.updateMatrixWorld();
  const screenOf = (el, y) => {
    const p = game.objects.get(el.id).position.clone(); p.y = y;
    p.project(camera);
    return [rect.left + (p.x + 1) / 2 * rect.width, rect.top + (1 - p.y) / 2 * rect.height];
  };
  const tap = ([x, y]) => {
    const ev = (type, opts) => canvas.dispatchEvent(new PointerEvent(type, Object.assign({
      clientX: x, clientY: y, pointerId: 9, pointerType: touch ? 'touch' : 'mouse', button: 0, buttons: 1,
      bubbles: true, isPrimary: true,
    }, opts)));
    ev('pointerdown'); ev('pointerup', { buttons: 0 });
  };

  // Trefferzylinder: alle drehbaren und die festen mit Sockel, nie ein Blocker
  const mitZylinder = new Set(game.hitProxies.map(p => p.userData.element));
  for (const el of game.board.elements) {
    const sockel = !!game.objects.get(el.id).userData.sockelRand;
    check(mitZylinder.has(el) === (isRotatable(el) || sockel), `Trefferzylinder falsch bei ${el.type}`);
    check(el.type !== 'blocker' || !sockel, 'Blocker mit Sockel');
  }

  // das feste Element mit Sockel, das am weitesten von allen drehbaren liegt (nicht im Toleranzbereich eines drehbaren)
  const rot = game.board.elements.filter(isRotatable);
  const fest = game.board.elements.filter(el => !isRotatable(el) && game.objects.get(el.id).userData.sockelRand);
  check(fest.length > 0, 'kein festes Element mit Sockel');
  const abstand = (a) => Math.min(...rot.map(b => Math.hypot(a.x - b.x, a.z - b.z)));
  const el = fest.sort((a, b) => abstand(b) - abstand(a))[0];
  const obj = game.objects.get(el.id), u = obj.userData;
  const geteilt = fixedBase().edgeMat, farbe = geteilt.color.getHex();

  const stand = () => JSON.stringify({
    turns: game.stats.turns, solved: game.result.solved,
    segs: game.result.segments.map(s => [s.x0, s.z0, s.x1, s.z1, s.color]),
    lage: game.board.elements.map(e => [e.rot, e.dir]),
    speicher: Object.keys(localStorage).sort().map(k => k + '=' + localStorage.getItem(k)),
  });
  const vorher = stand(), lage = obj.rotation.y;
  const out = { touch, type: el.type };

  tap(screenOf(el, 0.3));
  check(weigernde.has(obj) && u.weigern, 'wackelt nicht nach dem Antippen');
  check(u.sockelRand.material !== geteilt, 'kein eigenes Material für den Rand');
  const andere = fest.filter(e => e !== el).map(e => game.objects.get(e.id).userData.sockelRand.material);
  check(andere.every(m => m === geteilt), 'andere Sockel haben nicht mehr das geteilte Material');
  // während des Wackelns: Ausschlag und heller Rand. In festen Schritten von 20 ms selbst fortgeschrieben (synchron,
  // die Schleife kommt nicht dazwischen): Headless zeichnet SwiftShader zu selten, um den Verlauf abzutasten.
  let maxWinkel = 0, maxHell = 0;
  for (let i = 0; i < 200 && u.weigern; i++) {
    const w = u.weigern;
    animateWeigern(0.02);
    maxWinkel = Math.max(maxWinkel, Math.abs(obj.rotation.y - w.rotY));
    maxHell = Math.max(maxHell, w.mat.color.r / geteilt.color.r);
  }
  out.maxWinkel = +maxWinkel.toFixed(3);
  out.maxHell = +maxHell.toFixed(2);
  check(maxWinkel > 0.02, 'kein sichtbarer Ausschlag');
  check(maxHell > 1.5, 'der Rand blitzt nicht auf');
  for (let i = 0; i < 100 && weigernde.size; i++) await wait(20);
  check(!weigernde.size && !u.weigern, 'wackelt nach über 2 s noch');
  check(u.sockelRand.material === geteilt && geteilt.color.getHex() === farbe, 'Rand nicht zurück auf dem geteilten Material');
  check(obj.rotation.y === lage,'Modell nicht zurück in seiner Lage');
  check(stand() === vorher, 'Zugzahl, Strahlen oder Speicherstand verändert');

  // ein drehbares Element dreht beim Antippen weiterhin (Zugzahl + 1)
  const r = rot[0], turns = game.stats.turns;
  tap(screenOf(r, BEAM_Y));
  check(game.stats.turns === turns + 1, 'drehbares Element dreht nicht');

  // Levelwechsel mitten im Wackeln: das alte Modell kommt zurück in seine Lage und aufs geteilte Material, das eigene
  // wird freigegeben, nichts wackelt weiter
  tap(screenOf(el, 0.3));
  check(weigernde.has(obj), 'wackelt beim zweiten Antippen nicht');
  const eigenes = u.weigern.mat;
  let freigegeben = false;
  eigenes.addEventListener('dispose', () => { freigegeben = true; });
  loadLevel(game.levelIndex);
  for (let i = 0; i < 100 && weigernde.size; i++) await wait(20);
  check(!weigernde.size && !u.weigern, 'wackelt nach dem Levelwechsel weiter');
  check(u.sockelRand.material === geteilt && obj.rotation.y === lage, 'altes Modell nicht zurückgesetzt');
  check(freigegeben, 'eigenes Material nach dem Levelwechsel nicht freigegeben');
  out.ok = true;
  return JSON.stringify(out);
})()
