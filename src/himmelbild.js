// Farbbilder der Skyboxen dekodieren (Ticket 05 von .scratch/umbau/, bis dahin in skyBitmaps in
// src/seite/himmel/skybox.js): decode(url, rows, pad) liefert { width, height, inhalt, strips: [{ level, y, bitmap }] }
// (Beschreibung bei skyBitmaps). Ohne Bezug auf die Seite: Der Worker src/himmelbild-worker.ts importiert es, und die
// Seite rechnet damit im Hauptthread, wo es keinen Worker gibt. Bis Ticket 05 bekam der Worker den Text dieser
// Funktion (Blob), darum durfte das Verkleinern die Namen nicht ändern.
const OPT = { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
async function decode(url, rows, pad = 0) {
  let bmp = await createImageBitmap(await (await fetch(url)).blob(), OPT);
  const inhalt = bmp.height;
  // pad: Stufe 0 auf so viele Zeilen auffüllen, mit der letzten Zeile (gekippt: der oberen Kante des Bilds) wiederholt,
  // erst dann die Mipmaps: So geht jede Stufe genau auf (Streifen in einer Höhe, BAND_HOEHE), und keine Stufe liest an
  // der Kante Zeilen, die nicht zum Bild gehören (im Vorrat die eines früheren Himmels)
  if (pad > inhalt && rows < Infinity && typeof OffscreenCanvas === 'function') {
    // willReadFrequently: Leinwand im Hauptspeicher (wie cut); sonst lag sie im Grafikprozess, und das Auffüllen und die
    // Mipmaps daraus hielten ihn mitten im Überblenden an (Bilder bis 200 ms, --wagen)
    const c = new OffscreenCanvas(bmp.width, pad), g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = false;
    g.drawImage(bmp, 0, 0);
    g.drawImage(bmp, 0, inhalt - 1, bmp.width, 1, 0, inhalt, bmp.width, pad - inhalt);
    bmp.close();
    bmp = c.transferToImageBitmap();
  }
  const { width, height } = bmp, levels = [bmp];
  // Für das eigene Hochladen (rows endlich) auch die Mipmaps, je Stufe halbiert: generateMipmap hielt den Grafikprozess
  // je grosse Textur 35–50 ms an
  for (let w = width, h = height; rows < Infinity && (w > 1 || h > 1);) {
    w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
    const next = await createImageBitmap(levels[levels.length - 1], { resizeWidth: w, resizeHeight: h, resizeQuality: 'medium' });
    // Übergeht ein Browser die Grösse still, scheiterte texSubImage2D (Stufe schwarz): dann ein Bild wie bisher
    if (next.width !== w || next.height !== h) throw new Error('Grösse übergangen');
    levels.push(next);
  }
  // Streifen über ein OffscreenCanvas als eigenes Bild: Einen mit createImageBitmap(lv, 0, y, …) zugeschnittenen lädt
  // Firefox ohne den Zuschnitt in WebGL (jeder Streifen zeigte die obersten Zeilen, der Grund lag in Ringen); so
  // bitgenau und je Streifen in 1–2 statt bis 25 ms hochgeladen. willReadFrequently: Canvas im Hauptspeicher, Chrome
  // wie vorher (sonst lagen die wartenden Streifen im Grafikprozess, an der Spitze rund 180 MB mehr). Vormultipliziert
  // (das Canvas): gleich für die deckenden JPEGs, nicht für ein Farbbild mit Alpha.
  const cut = (lv, y, h) => {
    const c = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(lv.width, h) : null;
    const g = c?.getContext('2d', { willReadFrequently: true });
    if (!g) return createImageBitmap(lv, 0, y, lv.width, h);
    g.drawImage(lv, 0, -y);
    return c.transferToImageBitmap();
  };
  const strips = [];
  for (const [level, lv] of levels.entries()) {
    if (lv.height <= rows) { strips.push({ level, y: 0, bitmap: lv }); continue; }
    for (let y = 0; y < lv.height; y += rows) {
      strips.push({ level, y, bitmap: await cut(lv, y, Math.min(rows, lv.height - y)) });
    }
    lv.close();
  }
  return { width, height, inhalt, strips };
}

export { decode, OPT };
