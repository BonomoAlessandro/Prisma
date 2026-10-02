// Aufruf: node tests/screenshot.mjs interaction 1440 900 500 "$(cat tests/interaction-probe.js)"
// Simuliert Klick, Rechtsklick, Ziehen und Hover auf das erste drehbare Element.
(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  while (!window.__prisma.playing()) await wait(50); // Level-Übergang abwarten
  window.__prisma.holdSolved(true); // ein gelöstes Feld nicht mitten in der Probe weiterschalten
  const canvas = document.querySelector('canvas');
  const el = game.board.elements.find(isRotatable);
  const obj = game.objects.get(el.id);
  const p = obj.position.clone(); p.y = BEAM_Y;
  camera.updateMatrixWorld();
  p.project(camera);
  const rect = canvas.getBoundingClientRect();
  const x = rect.left + (p.x + 1) / 2 * rect.width, y = rect.top + (1 - p.y) / 2 * rect.height;
  const ev = (type, opts) => canvas.dispatchEvent(new PointerEvent(type, Object.assign({
    clientX: x, clientY: y, pointerId: 7, pointerType: 'mouse', button: 0, buttons: 1, bubbles: true, isPrimary: true,
  }, opts)));
  const rotOf = () => (el.type === 'combiner' ? el.dir : el.rot);
  const out = { type: el.type, start: rotOf() };

  ev('pointermove', { buttons: 0 });
  out.hover = input.hovered === el;
  ev('pointerdown'); ev('pointerup', { buttons: 0 });
  out.nachKlick = rotOf();
  await wait(700);
  out.pivotNachAnimation = +obj.userData.pivot.rotation.y.toFixed(4);

  ev('pointerdown', { button: 2, buttons: 2 }); ev('pointerup', { button: 2, buttons: 0 });
  out.nachRechtsklick = rotOf();

  ev('pointerdown');
  ev('pointermove', { clientX: x + 40, clientY: y + 10 });
  ev('pointerup', { clientX: x + 40, clientY: y + 10, buttons: 0 });
  out.nachZiehen = rotOf();
  out.kameraGezogen = Math.abs(cameraRig.goalTheta) > 0.01;

  // drei schnelle Klicks: Ziel muss 3 × −π/4 weiter liegen
  await wait(500);
  const before = obj.userData.rotation ? obj.userData.rotation.to : obj.userData.pivot.rotation.y;
  for (let i = 0; i < 3; i++) { ev('pointerdown'); ev('pointerup', { buttons: 0 }); }
  out.zielNachDreifachklick = +((obj.userData.rotation.to - before) / (-Math.PI / 4)).toFixed(3);
  out.solvedJetzt = game.result.solved;
  return JSON.stringify(out);
})()
