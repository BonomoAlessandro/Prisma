// Würfel-Level für Screenshots einstellen: Level laden, optional Lösung setzen, Ebene wählen, Kamera neigen.
// Vorher (im selben Ausdruck) Variablen setzen, z. B. Würfel 2 gelöst, Ebene 1 (unten) gewählt:
//   node tests/screenshot.mjs cube2 1440 900 25000 "window.CUBE_INDEX=160; window.CUBE_LAYER=0;
//     window.CUBE_SOLVE={'2,0,0':3,'2,2,0':1,'3,4,4':3,'2,4,4':3,'2,2,4':1}; $(cat tests/cube-probe.js)"
//   CUBE_INDEX: Index in LEVELS (Würfel-Level ab CUBE_START, heute 159 und 160 – verschiebt sich, wenn 2D-Level dazukommen)
//   CUBE_SOLVE: { "x,y,z": Stellung } (optional) · CUBE_LAYER: Ebene 0 … size − 1 oder −1 = alle (optional)
//   CUBE_PHI / CUBE_THETA: Kamera neigen bzw. drehen (optional, wie beim Ziehen)
// Ohne Grafikkarte (SwiftShader) rendert Chrome nur 2–3 Bilder/s: Wartezeit 20–40 s.
(async () => {
  const P = window.__prisma, D = window.__prismaDebug;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  P.goto(window.CUBE_INDEX);
  for (let i = 0; i < 200 && !(P.playing() && P.levelIndex() === window.CUBE_INDEX); i++) await sleep(300);
  if (window.CUBE_SOLVE) for (const el of D.game.board.elements) {
    const want = window.CUBE_SOLVE[el.x + ',' + el.y + ',' + el.z];
    if (want === undefined) continue;
    const cur = el.type === 'combiner' ? el.dir : el.rot;
    D.rotateElement(el, ((want - cur) % 8 + 8) % 8);
  }
  if (window.CUBE_LAYER !== undefined) D.cubeView.setLayer(window.CUBE_LAYER);
  if (window.CUBE_PHI !== undefined) { D.cameraRig.goalPhi = window.CUBE_PHI; D.cameraRig.goalTheta = window.CUBE_THETA || 0; }
  return 'ok';
})()
