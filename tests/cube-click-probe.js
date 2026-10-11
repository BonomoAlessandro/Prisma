// Aufruf: node tests/screenshot.mjs cube-click 1440 900 500 "$(cat tests/cube-click-probe.js)"
// Klickt im Würfel-Level "Kern" jedes drehbare Element an – einmal mit allen Ebenen, einmal mit seiner Ebene
// gewählt – und meldet, welches Element sich gedreht hat (erwartet: jeweils genau das angeklickte).
(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const index = LEVELS.findIndex(l => l.name === 'Kern');
  window.__prisma.goto(index);
  while (!(window.__prisma.playing() && game.levelIndex === index)) await wait(100);
  await wait(1500); // Kamera eingeschwenkt
  const canvas = document.querySelector('canvas');
  const rect = canvas.getBoundingClientRect();
  const rotOf = (el) => (el.type === 'combiner' ? el.dir : el.rot);
  const out = [];
  for (const el of game.board.elements.filter(isRotatable)) {
    for (const layer of [-1, el.y]) {
      cubeView.setLayer(layer);
      const p = cubeToWorld(el.x, el.y, el.z, game.board.size);
      camera.updateMatrixWorld();
      p.project(camera);
      const x = rect.left + (p.x + 1) / 2 * rect.width, y = rect.top + (1 - p.y) / 2 * rect.height;
      const before = game.board.elements.map(rotOf);
      const ev = (type, o) => canvas.dispatchEvent(new PointerEvent(type, Object.assign({
        clientX: x, clientY: y, pointerId: 7, pointerType: 'mouse', button: 0, buttons: 1, bubbles: true, isPrimary: true,
      }, o)));
      ev('pointerdown'); ev('pointerup', { buttons: 0 });
      const changed = game.board.elements.filter((e, i) => rotOf(e) !== before[i]);
      out.push(`${el.x},${el.y},${el.z} Ebene ${layer}: ${changed.map(e => `${e.x},${e.y},${e.z}`).join(' ') || '–'}`);
      await wait(400);
    }
  }
  return out.join(' | ');
})()
