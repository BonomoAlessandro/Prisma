// Aufruf: node tests/screenshot.mjs wackeln 1440 900 300 "$(cat tests/wackel-probe.js)"
//   Handy: MOBILE=1 DPR=3 node tests/screenshot.mjs wackeln-handy 393 852 300 "$(cat tests/wackel-probe.js)"
// Weigerung (Ticket 02 von .scratch/tutorial-fuehrung/): Ein festes Element mit Sockel antippen. Es wackelt, nur sein
// Rand blitzt (eigenes Material, danach wieder das geteilte), Zugzahl, Strahlen und Speicherstand bleiben. Dazu: Ein
// Tippen auf ein drehbares Element dreht es weiterhin, und ein Levelwechsel mitten im Wackeln räumt auf. Zum Schluss
// in einer Welt (Ticket 04 der Führung): das erste Level des Bergwalds (Leicht) mit einem festen Spiegel direkt neben
// einem drehbaren, ohne Führung. Der feste wackelt auf seiner abgewandten Seite; nahe der gemeinsamen Kante (Handy,
// INPUT.touchSlop) bzw. auf dem drehbaren (Maus) dreht das drehbare, und der feste bleibt still. Wirft bei einem
// Fehler (screenshot.mjs meldet FEHLGESCHLAGEN).
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

  // in einer Welt: fester Spiegel neben einem drehbaren
  const index = new Map(LEVELS.map((l, i) => [l.name, i]));
  let paar = null;
  for (const name of STORY_LEVELS.leicht[0]) {
    const l = LEVELS[index.get(name)];
    for (const f of l.elements.filter(e => e.type === 'mirror' && e.fixed)) {
      const d = l.elements.find(e => isRotatable(e) && Math.abs(e.x - f.x) + Math.abs(e.z - f.z) === 1);
      if (d) { paar = { i: index.get(name), f: `${f.x},${f.z}`, d: `${d.x},${d.z}` }; break; }
    }
    if (paar) break;
  }
  check(paar, 'kein Level im Bergwald mit festem Spiegel neben einem drehbaren');
  window.__prismaDebug.zeige(paar.i);
  while (!(window.__prisma.playing() && game.levelIndex === paar.i && flow.state === 'play')) await wait(50);
  await wait(300);
  camera.updateMatrixWorld();
  const am = (z) => game.board.elements.find(e => `${e.x},${e.z}` === z);
  const wf = am(paar.f), wd = am(paar.d), of = game.objects.get(wf.id), od = game.objects.get(wd.id);
  check(!fuehrung.level && of.userData.sockelRand, 'in der Welt: Führung oder kein Sockel');
  const schirm = (a, b, t, y) => { // Punkt auf der Strecke a → b (t = 0: a), auf der Höhe y
    const p = a.position.clone().lerp(b.position, t); p.y = y;
    p.project(camera);
    return [rect.left + (p.x + 1) / 2 * rect.width, rect.top + (1 - p.y) / 2 * rect.height];
  };
  const lageD = () => (wd.type === 'combiner' ? wd.dir : wd.rot);
  // die vom drehbaren abgewandte Seite des festen: er wackelt, das drehbare bleibt
  let zuege = game.stats.turns, vor = lageD();
  tap(schirm(of, od, -0.25, 0.3));
  check(weigernde.has(of) && game.stats.turns === zuege && lageD() === vor, 'in der Welt: fester wackelt nicht');
  for (let i = 0; i < 200 && of.userData.weigern; i++) animateWeigern(0.02); // fertig wackeln (wie oben, synchron)
  check(!weigernde.size, 'in der Welt: wackelt nach 4 s noch');
  // Finger: auf der Strecke vom drehbaren zum festen, knapp innerhalb von INPUT.touchSlop um die Mitte des drehbaren
  // (wie pickElement: Pixel des Layouts) und damit auf der Seite des festen, sobald die Zellen so klein sind wie auf
  // dem Handy; Maus: auf dem drehbaren. Das drehbare dreht, der feste wackelt nicht
  const mitte = (el) => {
    const v = od.position.clone();
    game.hitProxies.find(q => q.userData.element === el).getWorldPosition(v).project(camera);
    return [rect.left + (v.x + 1) / 2 * rect.width, rect.top + (1 - v.y) / 2 * rect.height];
  };
  const [md, mf] = [mitte(wd), mitte(wf)], abst = Math.hypot(mf[0] - md[0], mf[1] - md[1]);
  const k = Math.min(1, 0.95 * INPUT.touchSlop * SEITE / abst);
  zuege = game.stats.turns; vor = lageD();
  tap(touch ? [md[0] + (mf[0] - md[0]) * k, md[1] + (mf[1] - md[1]) * k] : screenOf(wd, BEAM_Y));
  check(!weigernde.size && game.stats.turns === zuege + 1 && lageD() !== vor,
    `in der Welt: neben dem festen gewinnt das drehbare nicht (wackelt ${weigernde.size}, Züge ${game.stats.turns - zuege})`);
  out.welt = { level: LEVELS[paar.i].name, fest: paar.f, drehbar: paar.d, abstandPx: +abst.toFixed(1),
    seiteDesFesten: k > 0.5, anteil: +k.toFixed(2) };
  out.ok = true;
  return JSON.stringify(out);
})()
