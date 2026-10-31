// Würfel-Level für Screenshots einstellen: Level laden, optional Lösung setzen, Kamera neigen. Seit Noas Geschichte
// (Ticket 04) liegen die Würfel-Level im Vorrat: vorher zurückholen (node tools/vorrat.mjs zurueckholen <name>,
// danach wieder ablegen); gezeigt wird es über die Testschnittstelle (__prismaDebug.zeige), ausserhalb der Geschichte.
// Vorher (im selben Ausdruck) Variablen setzen, z. B. (Index und Lösung von „Kern“, bis zum 25.10.2026 im Spiel;
// für ein heutiges Würfel-Level Index und Lösung aus index.html nehmen):
//   node tests/screenshot.mjs cube2 1440 900 25000 "window.CUBE_INDEX=510;
//     window.CUBE_SOLVE={'3,0,0':3,'3,3,0':1,'4,6,6':3,'3,6,6':3,'3,3,6':1}; $(cat tests/cube-probe.js)"
//   CUBE_INDEX: Index in LEVELS (Würfel-Level ab CUBE_START, heute 509 und 510 – verschiebt sich, wenn 2D-Level dazukommen)
//   CUBE_SOLVE: { "x,y,z": Stellung } (optional)
//   CUBE_PHI / CUBE_THETA: Kamera neigen bzw. drehen (optional, wie beim Ziehen)
// Ohne Grafikkarte (SwiftShader) rendert Chrome nur 2–3 Bilder/s: Wartezeit 20–40 s.
(async () => {
  const P = window.__prisma, D = window.__prismaDebug;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  D.zeige(window.CUBE_INDEX);
  for (let i = 0; i < 200 && !(P.playing() && P.levelIndex() === window.CUBE_INDEX); i++) await sleep(300);
  if (window.CUBE_SOLVE) for (const el of D.game.board.elements) {
    const want = window.CUBE_SOLVE[el.x + ',' + el.y + ',' + el.z];
    if (want === undefined) continue;
    const cur = el.type === 'combiner' ? el.dir : el.rot;
    D.rotateElement(el, ((want - cur) % 8 + 8) % 8);
  }
  if (window.CUBE_PHI !== undefined) { D.cameraRig.goalPhi = window.CUBE_PHI; D.cameraRig.goalTheta = window.CUBE_THETA || 0; }
  return 'ok';
})()
