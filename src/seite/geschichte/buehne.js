// Bühne für Prolog und Epilog (createStoryScene) (Ticket 04 von .scratch/umbau/, bis dahin in index.html).
import { BUEHNENWAGEN, HIMMELSWAGEN, STORY_EPILOG, STORY_PROLOG, wagen } from './daten.js';
import { camera, DIAG } from '../szene.js';
import { audio } from '../ton.js';
import { IS_TOUCH } from '../oberflaeche/dom.ts';
import { storyEase, storyLinear, storySleep } from './geschichte.js';
import { mulberry32 } from '../../zufall.js';
import { t } from '../../texte/sprache.js';

/**
 * Bühne für Prolog und Epilog: ein Bergdorf bei Nacht über den ganzen Bildschirm, gezeichnet in sechs Ebenen (Himmel,
 * ferne Berge, Bergwald, Dorf, Noas Hügel, Vordergrund). Eine Kamera fährt darüber; nahe Ebenen ziehen schneller
 * vorbei als ferne (Parallaxe, p). Die Szene lebt: Sterne funkeln, Rauch steigt aus den Kaminen, Glühwürmchen
 * schwirren am Waldrand. Masse in der Ebene von Noa (p = 1): bei Zoom 1 ein Bild von 1600 × 900. Ohne SVG-Filter
 * (Unschärfe kostete bei jeder Kamerabewegung viel), Leuchten über radiale Verläufe.
 *
 * Gezeichnet wird so selten wie möglich (Ticket 04 von .scratch/leistung/): Jede Ebene ist eine eigene Ebene des
 * Compositors (.ebene, ein SVG darin in Massen der Szene), die Kamera schiebt und skaliert sie per Web Animations
 * (fahrt), ohne sie neu zu rastern. Gerastert wird eine Ebene einmal je Folge (Prolog oder Epilog), in der grössten
 * Skalierung der Folge (das macht Chrome für laufende Transform-Animationen so; eine Animation je Ebene für die ganze
 * Folge, folgeAnlegen): Sie bleibt beim Zoom scharf, und keine sichtbare Ebene rastert neu (sonst zeigte sie dabei
 * fehlende Kacheln, Flackern, Ticket 16). Was sich klein bewegt (Glühwürmchen, Rauch, Schal, Atmen des
 * Polarsterns, Flackern des Strahls), läuft als Animation von transform und opacity auf eigenen kleinen Ebenen, nach
 * der Zeit der Bühne (time; mit speed schneller); Arm, Strahl und Blinken als vorab berechnete Spuren (spur); funkelnde
 * Sterne in wenigen Gruppen, flackernde Fenster einzeln per CSS. Während einer Fahrt ändert JavaScript nichts am DOM:
 * Jeder Commit liess Chrome die bewegten Ebenen neu rastern. Die Linien (linie) bekommen ihre Breite je Ruhepunkt in
 * einer verborgenen Kopie. Beim Warten auf Tippen läuft keine Schleife, ausgeblendet ruht alles.
 * Am Himmel steht der Kleine Wagen um den Polarstern (BUEHNENWAGEN, Ticket 07 von .scratch/kleiner-wagen/); wo, sagt
 * wagenLage(): die Orte seiner sieben Sterne im ersten Bild des Epilogs (Anteile von oben links; story.wagenEnde).
 */
function createStoryScene(host, { wagenLage = null } = {}) {
  const rand = mulberry32(11);
  const r = (a, b) => a + (b - a) * rand();
  const n = (v) => +v.toFixed(1);
  const smooth01 = (v) => { const k = Math.min(1, Math.max(0, v)); return k * k * (3 - 2 * k); };
  const line = (pts) => 'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L');
  const area = (pts) => `${line(pts)}L${pts.at(-1)[0]} 2600L${pts[0][0]} 2600Z`; // weit hinab: im Hochformat sieht man mehr
  const yAt = (pts, x) => {
    const i = pts.findIndex(([px]) => px > x);
    if (i <= 0) return (i < 0 ? pts.at(-1) : pts[0])[1];
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    return ay + (by - ay) * (x - ax) / (bx - ax);
  };
  /** Grat aus Stützpunkten, viermal verfeinert: Jede neue Mitte liegt etwas versetzt, so wird die Kante zackig. */
  const ridge = (ctrl, rough) => {
    let pts = ctrl;
    for (let pass = 0; pass < 4; pass++) {
      const next = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        next.push(pts[i], [(ax + bx) / 2, (ay + by) / 2 + (rand() - 0.5) * (bx - ax) * rough]);
      }
      pts = [...next, pts.at(-1)];
    }
    return pts;
  };
  /** Sanfte Kuppen: zwischen den Stützpunkten weich (waagrecht an jedem Stützpunkt). */
  const soft = (ctrl) => ctrl.slice(1).flatMap(([bx, by], i) => {
    const [ax, ay] = ctrl[i];
    return Array.from({ length: 12 }, (_, k) => { const t = k / 12; return [ax + (bx - ax) * t, ay + (by - ay) * t * t * (3 - 2 * t)]; });
  }).concat([ctrl.at(-1)]);
  /** Schneekappen über der Schneegrenze: von der Kante ein Stück hinab, je höher der Gipfel, desto tiefer. */
  const snow = (pts, limit) => {
    let d = '', run = [];
    const flush = () => {
      if (run.length > 2) d += line([...run, ...run.slice().reverse().map(([x, y]) => [x + r(-2, 2), y + (limit - y) * r(0.25, 0.45)])]) + 'Z';
      run = [];
    };
    for (const p of pts) { if (p[1] < limit) run.push(p); else flush(); }
    flush();
    return d;
  };
  /** Tanne als eine Fläche: drei Stufen und ein kurzer Stamm. */
  const FIR = [[0.3, 0.64], [0.14, 0.62], [0.4, 0.36], [0.2, 0.34], [0.5, 0.05], [0.07, 0.05], [0.07, 0]];
  const fir = (x, y, h) => {
    const w = h * r(0.34, 0.44), lean = r(-0.03, 0.03) * h;
    const side = (s) => FIR.map(([dx, dy]) => `L${n(x + s * dx * w)} ${n(y - dy * h)}`);
    return `M${n(x + lean)} ${n(y - h)}${side(-1).join('')}${side(1).reverse().join('')}Z`;
  };
  /**
   * Grosse Flächen aus vielen Teilen (Tannenreihen, Gras) in Stücken von STUECK Massen, je ein eigener Pfad ('|' trennt,
   * pfade): Skia rastert jede Kachel nur mit den Pfaden, die sie berührt. Ein Pfad mit Hunderten Tannen kostete jede
   * Kachel der Ebene ganz (Raster-Hänger bis 80 ms im GPU-Prozess, Ticket 16).
   */
  const STUECK = 150;
  const pfade = (d, attr) => d.split('|').filter(Boolean).map((s) => `<path d="${s}" ${attr}/>`).join('');
  const firRow = (x0, x1, [s0, s1], [h0, h1], base) => {
    let d = '';
    let stueck = null;
    for (let x = x0; x < x1; x += r(s0, s1)) {
      const s = Math.floor(x / STUECK);
      if (stueck !== null && s !== stueck) d += '|';
      stueck = s;
      d += fir(x, base(x), r(h0, h1));
    }
    return d + '|';
  };
  /**
   * Strichbreite wie früher mit vector-effect non-scaling-stroke: in Pixeln, gleich bei jedem Zoom. --rs ist die
   * Skalierung der Ebene im Ruhepunkt (die WebGL-Bühne rastert jede Linie je Ruhepunkt, linieTex), während einer Fahrt
   * wächst und schrumpft der Strich mit, im Ruhepunkt stimmt er wieder. Ausnahme die fernen Ebenen (.fest): --rs aus
   * Zoom 1, der Strich wird beim Zoomen etwas breiter.
   */
  const strich = (w) => `stroke-width:calc(${w}px / var(--rs, 1))`;
  const rim = (pts, color, opacity, width = 1.2) =>
    `<path d="${line(pts)}" fill="none" stroke="${color}" stroke-opacity="${opacity}" style="${strich(width)}"/>`;
  /** Ein Teil der Szene als eigenes SVG in Massen der Szene: Ausschnitt x, y, b, h (viewBox), dort auch platziert. */
  const svg = (x, y, b, h, inhalt, cls = '', stil = '') =>
    `<svg class="${cls}" width="${b}" height="${h}" viewBox="${x} ${y} ${b} ${h}" style="left:${x}px;top:${y}px;${stil}">${inhalt}</svg>`;
  const BILD = (inhalt, cls = '', stil = '') => svg(0, 0, 1600, 900, inhalt, `bild ${cls}`, stil); // eine ganze Ebene (ragt über 1600 × 900 hinaus)
  /**
   * Linien mit strich (Grate, Dachkanten, Umriss von Noa) als eigenes SVG (.linie): Die WebGL-Bühne rastert sie je
   * Ruhepunkt mit ihrer Breite dort (linieTex). f(inhalt, cls): SVG. Jede Linie kostet Speicher der Grafik (Textur
   * längs der ganzen Linie): die Grate der fernen Berge und des Bergwalds, die im Prolog höchstens um 1,26 und 1,5
   * zoomen, liegen darum im Bild ihrer Ebene, mit fester Breite (.fest). Die Grate von Dorfhügel und Noas Hügel liegen
   * unter dem Bild, doppelt so breit (die Fläche deckt die untere Hälfte).
   */
  const linie = (f, inhalt) => f(inhalt, 'linie');

  // Himmel: Verlauf, Milchstrasse, Sterne (einige funkeln), der Polarstern. Die funkelnden Sterne liegen in acht
  // Gruppen (je vier Takte, matte und helle getrennt), jede eine eigene kleine Ebene mit einer CSS-Animation, statt
  // dutzender Animationen je Stern; ihr Takt richtet sich nach der Dauer, die der Stern früher hatte
  const TW_TAKT = [[2.8, -0.4], [3.6, -2.9], [4.3, -1.6], [5.1, -4.4]]; // Dauer, Verzögerung (s)
  const twinkle = TW_TAKT.flatMap(() => ['', '']);
  let stars = '', band = '';
  for (let i = 0; i < 300; i++) {
    const y = r(-950, 620);
    if (y > 420 && rand() < 0.6) continue; // zum Horizont hin dünner
    const big = rand() < 0.07, twinkles = rand() < 0.25;
    const cx = r(-700, 2300), radius = big ? r(1.3, 2.1) : r(0.4, 1.1), opacity = r(0.3, 0.95);
    const circle = `<circle cx="${n(cx)}" cy="${n(y)}" r="${radius.toFixed(2)}" opacity="${opacity.toFixed(2)}"/>`;
    if (!twinkles) { stars += circle; continue; }
    r(0, 6); // früher die Verzögerung je Stern: gezogen bleibt sie, sonst verschöbe sich alles Weitere der Szene
    const takt = Math.min(3, Math.floor((r(2.4, 5.5) - 2.4) / 3.1 * 4));
    twinkle[takt * 2 + (opacity < 0.62 ? 0 : 1)] += circle;
  }
  for (let i = 0; i < 180; i++) {
    const x = r(-300, 2000), spread = (rand() + rand() + rand() - 1.5) * 110;
    band += `<circle cx="${n(x)}" cy="${n(150 + spread)}" r="${r(0.35, 0.8).toFixed(2)}" opacity="${r(0.25, 0.7).toFixed(2)}"/>`;
  }
  // Milchstrasse aus vielen weichen Flecken entlang eines Bands, verschieden breit und hell
  let milky = '';
  for (let i = 0; i < 14; i++) {
    const x = -300 + i * 170 + r(-60, 60);
    milky += `<ellipse cx="${n(x)}" cy="${n(150 + r(-40, 40))}" rx="${n(r(160, 320))}" ry="${n(r(55, 130))}" fill="url(#s-mw)" opacity="${r(0.25, 0.6).toFixed(2)}"/>`;
  }

  // Ferne Berge mit Schnee, dahinter Dunst
  const far = ridge([[-800, 560], [-520, 430], [-300, 490], [-80, 360], [150, 470], [380, 335], [560, 440], [770, 300], [940, 415],
    [1120, 345], [1300, 455], [1510, 320], [1720, 440], [1930, 370], [2400, 520]], 0.32);
  // Bergwald: niedrigere Kämme, dicht mit Tannen
  const mid = ridge([[-800, 650], [-450, 565], [-160, 605], [100, 528], [330, 592], [520, 548], [720, 606], [910, 566], [1110, 618],
    [1310, 548], [1560, 604], [1810, 538], [2400, 630]], 0.22);
  // Dorfhügel
  const hill = soft([[-800, 732], [-200, 706], [250, 712], [520, 690], [700, 660], [900, 641], [1100, 646], [1300, 668],
    [1600, 700], [2000, 712], [2400, 730]]);
  // Noas Hügel links, der Waldrand rechts
  const ground = soft([[-800, 772], [-350, 746], [50, 712], [300, 668], [430, 657], [560, 672], [760, 742], [980, 768],
    [1180, 752], [1450, 742], [1750, 750], [2400, 775]]);

  // Häuser: Mitte x, Breite, Höhe, Dachhöhe, Fenster [dx, dy über dem Boden], Kamin
  const HOUSES = [[700, 44, 28, 18, [[-9, 11], [8, 11]], 1], [756, 34, 24, 16, [[0, 9]], 0],
    [818, 54, 34, 22, [[-15, 12], [0, 12], [15, 12]], 1], [884, 40, 28, 18, [[-7, 10]], 1], [940, 30, 22, 15, [[0, 8]], 0],
    [1072, 48, 32, 21, [[-11, 12], [10, 12]], 1], [1128, 38, 26, 17, [[0, 10]], 0], [1174, 32, 22, 15, [], 1]];
  const chimneys = [];
  let houses = '', eaves = '', glows = '', flicker = '';
  const windowAt = (x, y) => {
    if (rand() < 0.15) { houses += `<rect x="${n(x - 2.5)}" y="${n(y - 3)}" width="5" height="6" fill="#16162e"/>`; return; }
    const glow = `<circle cx="${n(x)}" cy="${n(y)}" r="17" fill="url(#s-win)"/>`;
    // flackernde Fenster: je ein eigenes kleines SVG mit der CSS-Animation (es sind nur wenige)
    if (rand() < 0.3) flicker += svg(n(x) - 17, n(y) - 17, 34, 34, glow, 'flk', `animation-delay:${(-r(0, 3)).toFixed(1)}s`);
    else glows += glow;
    houses += `<rect x="${n(x - 2.5)}" y="${n(y - 3)}" width="5" height="6" fill="#ffd28a"/>`;
  };
  for (const [x, w, h, roof, wins, chimney] of HOUSES) {
    const base = yAt(hill, x) + 6, top = base - h, eave = `M${x - w / 2 - 4} ${n(top + 1)}L${x} ${n(top - roof)}L${x + w / 2 + 4} ${n(top + 1)}`;
    if (chimney) {
      const cx = x + w * 0.22, cy = top - roof * 0.62;
      houses += `<rect x="${n(cx - 3)}" y="${n(cy - 9)}" width="6" height="14" fill="#0a0a1c"/>`;
      chimneys.push([cx, cy - 10]);
    }
    houses += `<rect x="${x - w / 2}" y="${n(top)}" width="${w}" height="${h + 12}" fill="#0a0a1d"/><path d="${eave}Z" fill="#0d0d26"/>`;
    eaves += `<path d="${eave}" fill="none" stroke="#3c4080" stroke-opacity="0.55" style="${strich(1)}"/>`;
    for (const [dx, dy] of wins) windowAt(x + dx, base - dy - 4);
  }
  { // Kirche: Turm mit Spitze und Kreuz, ein kleines Schiff daneben
    const base = yAt(hill, 1004) + 6, top = base - 76;
    houses += `<rect x="1015" y="${n(base - 30)}" width="26" height="42" fill="#0a0a1d"/><path d="M1013 ${n(base - 29)}L1028 ${n(base - 44)}L1043 ${n(base - 29)}Z" fill="#0d0d26"/>` +
      `<rect x="993" y="${n(top)}" width="22" height="88" fill="#0a0a1d"/><path d="M990 ${n(top + 1)}L1004 ${n(top - 40)}L1018 ${n(top + 1)}Z" fill="#0d0d26"/>` +
      `<path d="M1004 ${n(top - 40)}v-11M999.5 ${n(top - 46)}h9" stroke="#0d0d26" stroke-width="2"/>`;
    eaves += `<path d="M990 ${n(top + 1)}L1004 ${n(top - 40)}L1018 ${n(top + 1)}" fill="none" stroke="#3c4080" stroke-opacity="0.55" style="${strich(1)}"/>`;
    glows += `<circle cx="1004" cy="${n(top + 20)}" r="15" fill="url(#s-win)"/>`;
    houses += `<circle cx="1004" cy="${n(top + 20)}" r="3.6" fill="#ffd28a"/>`;
  }
  // Weg vom Dorf hinunter, mit Laternen
  const path = [690, 640, 590, 540, 480, 420].map((x) => [x, yAt(hill, x) + 5]);
  let lanterns = '';
  for (const [x, y] of path.slice(1, -1)) lanterns += `<circle cx="${n(x)}" cy="${n(y - 9)}" r="11" fill="url(#s-win)" opacity="0.7"/><circle cx="${n(x)}" cy="${n(y - 9)}" r="1.8" fill="#ffe2a8"/><rect x="${n(x - 0.7)}" y="${n(y - 7)}" width="1.4" height="7" fill="#0a0a1d"/>`;
  // Zaun an Noas Hügel
  const posts = [470, 494, 518, 542].map((x) => [x, yAt(ground, x)]);
  const fence = posts.map(([x, y]) => `<rect x="${x - 1.5}" y="${n(y - 18)}" width="3" height="20"/>`).join('') +
    `<path d="${line(posts.map(([x, y]) => [x, y - 13]))}${line(posts.map(([x, y]) => [x, y - 6]))}" fill="none" stroke="#05050f" stroke-width="2"/>`;
  // Vordergrund: Grasbüschel
  let grass = '';
  for (let x = -900, s = null; x < 2500; x += r(12, 28)) {
    if (s !== null && Math.floor(x / STUECK) !== s) grass += '|';
    s = Math.floor(x / STUECK);
    const y = 884 + r(-6, 6);
    grass += `M${n(x - 6)} ${n(y)}L${n(x - 3)} ${n(y - r(8, 18))}L${n(x)} ${n(y)}L${n(x + 2)} ${n(y - r(10, 24))}L${n(x + 5)} ${n(y)}Z`;
  }

  // ein Teil, der sich bewegt: Drehpunkt an (x, y), der Inhalt darum herum (Ausschnitt dx, dy, b, h um den Drehpunkt)
  const teil = (cls, x, y, [dx, dy, b, h], inhalt, innen = '@') =>
    `<div class="teil ${cls}" style="left:${x}px;top:${y}px">${innen.replace('@', svg(dx, dy, b, h, inhalt))}</div>`;
  /*
   * Strahl der Taschenlampe, im Arm (dreht mit ihm, Ursprung an der Spitze der Lampe), gezeichnet von der WebGL-Bühne
   * (strahlMesh): Kegel und Kern, je ein Trapez mit Hals w0 an der Lampe und Breite k · Länge am Ende, darauf ein
   * Verlauf über Länge / 0,55 (stopps: Alpha, Prozent). Die Länge ist ein Anteil von STRAHL_L (laenge).
   */
  const STRAHL_L = 860, STRAHL_MIN = 0.02; // kürzer (Anteil von STRAHL_L) zeichnet er nicht (Kraft 0 oder kaum sichtbar)
  const STRAHL_WEICH = 0.8; // Breite des weichen Rands des Kegels (teil im Shader; der Kern 0,5)
  const STRAHL_TEILE = [
    { w0: 3, k: 0.04, farbe: '#fff1cc', stopps: [[0.42, 0], [0.2, 15], [0.07, 35], [0, 55]] },
    { w0: 1.4, k: 0.011, farbe: '#fffaf0', stopps: [[0.95, 0], [0.4, 12], [0.06, 32], [0, 50]] },
  ];
  const twinkleSvgs = twinkle.map((s, i) => BILD(`<g fill="#fff">${s}</g>`, `tw${i % 2 ? ' hell' : ''}`,
    `animation-duration:${TW_TAKT[i >> 1][0]}s;animation-delay:${TW_TAKT[i >> 1][1] - (i % 2) * 1.3}s`)).join('');
  host.insertAdjacentHTML('beforeend', `<div class="scene">
    <div class="world" aria-hidden="true">
      <div class="ebene" data-p="0.06">
        ${BILD(`<defs>
          <linearGradient id="s-sky" gradientUnits="userSpaceOnUse" x1="0" y1="-700" x2="0" y2="640"><stop offset="0" stop-color="#03040f"/><stop offset="0.45" stop-color="#080a24"/><stop offset="0.8" stop-color="#15163a"/><stop offset="1" stop-color="#28274f"/></linearGradient>
          <radialGradient id="s-mw"><stop offset="0" stop-color="#c9cfff" stop-opacity="0.16"/><stop offset="1" stop-color="#c9cfff" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-ray" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="30"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.4" stop-color="#e8ecff" stop-opacity="0.35"/><stop offset="1" stop-color="#e8ecff" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-halo"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="0.08" stop-color="#eef0ff" stop-opacity="0.5"/><stop offset="0.25" stop-color="#cdd5ff" stop-opacity="0.16"/><stop offset="1" stop-color="#cdd5ff" stop-opacity="0"/></radialGradient>
          <linearGradient id="s-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3070" stop-opacity="0"/><stop offset="0.5" stop-color="#2c3070" stop-opacity="0.5"/><stop offset="1" stop-color="#2c3070" stop-opacity="0"/></linearGradient>
          <radialGradient id="s-win"><stop offset="0" stop-color="#ffb35a" stop-opacity="0.55"/><stop offset="0.4" stop-color="#ff9c3a" stop-opacity="0.16"/><stop offset="1" stop-color="#ff9c3a" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-gw"><stop offset="0" stop-color="#e4ff8a" stop-opacity="0.9"/><stop offset="0.3" stop-color="#c2ff4a" stop-opacity="0.3"/><stop offset="1" stop-color="#c2ff4a" stop-opacity="0"/></radialGradient>
          <radialGradient id="s-smoke"><stop offset="0" stop-color="#5c6190" stop-opacity="0.55"/><stop offset="0.6" stop-color="#5c6190" stop-opacity="0.2"/><stop offset="1" stop-color="#5c6190" stop-opacity="0"/></radialGradient>
        </defs>
        <rect x="-3000" y="-3000" width="7600" height="4400" fill="url(#s-sky)"/>
        <g transform="rotate(-16 900 150)">${milky}<g fill="#dfe3ff">${band}</g></g>
        <g fill="#fff">${stars}</g>`)}
        ${twinkleSvgs}
        ${teil('polar', 1120, 150, [-64, -64, 128, 128], `<circle r="64" fill="url(#s-halo)"/><g transform="rotate(12)" fill="url(#s-ray)"><path d="M0 -30L1.8 0L0 30L-1.8 0ZM-30 0L0 -1.8L30 0L0 1.8Z"/><path d="M0 -13L1 0L0 13L-1 0ZM-13 0L0 -1L13 0L0 1Z" transform="rotate(45)" opacity="0.6"/></g><circle r="3.4" fill="#fff"/>`)}
      </div>
      <div class="ebene" data-p="0.22">
        ${BILD(`<path d="${area(far)}" fill="#1f1f4a"/><path d="${snow(far, 425)}" fill="#8b92d6" opacity="0.2"/>${rim(far, '#8a90d8', 0.35)}
        <rect x="-3000" y="470" width="7600" height="170" fill="url(#s-mist)"/>`, 'fest')}
      </div>
      <div class="ebene" data-p="0.42">
        ${BILD(`<path d="${area(mid)}" fill="#15153a"/>${rim(mid, '#4f539e', 0.35)}${pfade(`${firRow(-800, 2400, [6, 12], [10, 26], (x) => yAt(mid, x) + r(2, 7))}`, 'fill="#101030"')}
        <rect x="-3000" y="612" width="7600" height="120" fill="url(#s-mist)" opacity="0.8"/>`, 'fest')}
      </div>
      <div class="ebene" data-p="0.68">
        ${linie(BILD, rim(hill, '#2c3066', 0.5, 2.4))}${BILD(`<path d="${area(hill)}" fill="#0d0d25"/><path d="${line(path)}" fill="none" stroke="#1b1b3b" stroke-width="3" stroke-linecap="round"/>
        ${pfade(`${firRow(360, 650, [7, 15], [22, 52], (x) => yAt(hill, x) + 4)}${firRow(1215, 1580, [7, 14], [24, 58], (x) => yAt(hill, x) + 4)}${firRow(-700, 300, [10, 22], [26, 60], (x) => yAt(hill, x) + 4)}${firRow(1600, 2300, [10, 22], [26, 60], (x) => yAt(hill, x) + 4)}`, 'fill="#0a0a1f"')}
        <g>${glows}</g>`)}${flicker}${svg(450, 480, 780, 240, houses + lanterns)}${linie((inhalt, cls) => svg(450, 480, 780, 240, inhalt, cls), eaves)}
        <div class="teil smoke"></div>
      </div>
      <div class="ebene" data-p="1">
        ${linie(BILD, rim(ground, '#2a2e62', 0.55, 3))}${BILD(`${pfade(`${firRow(1110, 2200, [22, 40], [170, 330], (x) => yAt(ground, x) + r(0, 8))}${firRow(-700, 230, [26, 48], [120, 260], (x) => yAt(ground, x) + r(0, 8))}`, 'fill="#0a0a20"')}
        <path d="${area(ground)}" fill="#08081b"/>
        ${pfade(`${firRow(1150, 2200, [30, 60], [120, 240], (x) => yAt(ground, x) + 12)}${firRow(-700, 160, [40, 70], [110, 210], (x) => yAt(ground, x) + 12)}`, 'fill="#050515"')}
        <g fill="#05050f">${fence}</g>
        <g fill="#03030a">
          <path d="M422.5 628L422 650Q421.5 653 418.8 655.4Q417.6 657.6 420.4 657.6L429 657.6L429.3 628Z"/>
          <path d="M431.2 628L431.5 657.6L440.6 657.6Q443.2 657.4 441.6 655.2Q439 653 438.8 650L438.2 628Z"/>
          <path d="M419.5 592Q430 585.5 440.5 592L443.6 610L447.6 634.5Q430 639 412.4 634.5L416.4 610Z"/>
          <circle cx="430" cy="576.5" r="9.4"/>
          <path d="M419.8 575Q419.2 559.5 430 558.4Q440.8 559.5 440.2 575Z"/><rect x="418.6" y="571.2" width="22.8" height="5.2" rx="2.6"/>
          <circle cx="430" cy="555.2" r="4.3"/>
        </g>`)}
        ${teil('scarf', 437, 590, [-18, -4, 38, 18], '<path fill="#03030a" d="M-15.8 -3Q-7 1.5 1.8 -3L3.2 1.6Q-7 6 -17.2 1.6ZM-1.5 0L18 7Q12 12 4 5.6Z"/>')}
        ${linie((inhalt, cls) => svg(436, 567, 13, 69, inhalt, cls), `<path d="M437.2 568.5A9.4 9.4 0 0 1 438.6 581M440.8 592.6L443.9 610L447.6 634" fill="none" stroke="#4a4f98" stroke-opacity="0.75" stroke-linecap="round" style="${strich(1.1)}"/>`)}
        ${teil('arm', 440, 592, [-3, -5, 39, 10], '<g fill="#03030a"><rect x="-2" y="-3" width="24" height="6" rx="3"/><circle cx="21.5" cy="0" r="3.8"/></g><rect x="22" y="-4.2" width="11.5" height="8.4" rx="2" fill="#22223c"/><rect x="32.4" y="-4.8" width="2.4" height="9.6" rx="1" fill="#3a3a60"/>')}
        <div class="teil worms"></div>
      </div>
      <div class="ebene" data-p="1.35">
        ${BILD(`<path d="${fir(-140, 905, 780)}${fir(60, 910, 520)}${fir(2060, 905, 720)}${fir(2200, 912, 460)}" fill="#020208"/>
        ${pfade(`${grass}`, 'fill="#030309"')}<rect x="-3000" y="884" width="7600" height="1800" fill="#030309"/>`)}
      </div>
    </div>
    <div class="sub"><div class="kicker"></div><div class="lines"><p class="line"></p><p class="line"></p></div><div class="hint"><span></span></div><div class="actions"></div></div>
    <button class="skip" type="button">${t('geschichte.ueberspringen')}</button>
  </div>`);

  const el = host.lastElementChild, q = (s) => el.querySelector(s);
  /*
   * Je Ebene: p (Parallaxe), inhalt (das Element .ebene, darin ihre SVG und Teile in der Reihenfolge des Bilds): nur
   * die Quelle der WebGL-Bühne (glBuehne), selbst nie gezeichnet (CSS).
   */
  const layers = [...el.querySelectorAll('.ebene')].map((e) => ({ p: +e.dataset.p, inhalt: e }));
  const lines = [...el.querySelectorAll('.line')];

  /* ---- Bewegung: Werte nach der Zeit der Bühne, je Bild gezeichnet von glBuehne ---- */
  let scene = null;
  /** die Kurve SINUS (cubic-bezier(0.37, 0, 0.63, 1), wie (1 − cos πu) / 2) wie im Browser: zu p in [0, 1] der Wert */
  const sinusKurve = (p) => {
    const bx = (s) => 3 * (1 - s) ** 2 * s * 0.37 + 3 * (1 - s) * s * s * 0.63 + s ** 3;
    let lo = 0, hi = 1;
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (bx(m) < p) lo = m; else hi = m; }
    const s = (lo + hi) / 2;
    return 3 * (1 - s) * s * s + s ** 3; // y: 0, 0, 1, 1
  };
  /**
   * Schwingung mitte + amp · sin(ω t + φ) in der Zeit der Bühne t, hin und her zwischen mitte − amp und mitte + amp mit
   * der Kurve SINUS (so lief sie bis Ticket 19 als Animation des Browsers): wert(t).
   */
  const schwinger = (amp, omega, phi, mitte = 0) => {
    if (omega < 0) { omega = -omega; phi = Math.PI - phi; } // sin(−ω t + φ) = sin(ω t − φ + π)
    const halb = Math.PI / omega, c = (t) => t + (phi + Math.PI / 2) / omega; // Wert(c) = mitte − amp · cos(ω c)
    return { wert: (t) => { const x = c(t) / halb, n = Math.floor(x), p = x - n;
      return mitte - amp + 2 * amp * sinusKurve(n % 2 === 0 ? p : 1 - p); } };
  };
  /**
   * Ein Wert der Bühne, der sich in Stücken ändert (wie die Tweens; Arm, Kraft und Länge des Strahls, Blinken des Sterns):
   * Stücke { t0, t1, f(t, u) } in der Zeit der Bühne (t wie beim Anlegen, auch wenn die Zeit seither gesprungen ist;
   * u: so lange läuft das Stück schon), ein späteres gilt ab seinem Beginn und hält danach seinen letzten Wert.
   * Gezeichnet wird wert(t) in jedem Bild (glBuehne).
   */
  const spur = (basis) => {
    const s = { basis, stuecke: [] };
    s.wert = (t) => {
      let v = s.basis;
      // f in der Zeit, in der das Stück angelegt wurde (verschoben: so weit ist die Zeit seither gesprungen)
      for (const st of s.stuecke) {
        if (t >= st.t0) v = st.f(Math.min(t, st.t1) - st.verschoben, Math.min(t, st.t1) - st.t0);
      }
      return v;
    };
    /** Die Zeit der Bühne springt um d (time = …): Die Stücke rücken mit, zu sehen bleibt dasselbe. */
    s.verschiebe = (d) => { for (const st of s.stuecke) { st.t0 += d; st.t1 += d; st.verschoben += d; } };
    /** ein Stück dazu: ab t0 für dauer Sekunden der Wert f(t) */
    s.dazu = (t0, dauer, f) => { s.stuecke.push({ t0, t1: t0 + dauer, f, verschoben: 0 }); };
    /** von vorn: steht auf basis */
    s.zurueck = (b) => { s.basis = b; s.stuecke = []; };
    return s;
  };
  // Schal im Wind, der Polarstern atmet, der Strahl flackert
  const schal = schwinger(4, 2.3, 0), atem = schwinger(0.05, 1.7, 0, 1), flackern = schwinger(0.07, 23, 0, 0.93);
  // Arm (Grad), Kraft und Länge des Strahls (Anteil von STRAHL_L), Blinken des Polarsterns, Helligkeit der Linien des
  // Wagens (Andeutung in Prolog 4, Nachglimmen im Epilog; scene.wagenBei) als Spuren (spur)
  const armSpur = spur(75), kraft = spur(0), laenge = spur(0), stern = spur(0), wagenLinien = spur(0);
  const spuren = [armSpur, kraft, laenge, stern, wagenLinien];
  // Glühwürmchen: schwirren am Waldrand (hx, hy), fliegen zur Lampe und umkreisen sie (ox, oy, spin), tragen das Licht
  // in den Wald (dx, dy); wo sie sind, rechnet wurmOrt, ihr Blinken glBuehne
  const worms = Array.from({ length: 16 }, () => ({ hx: r(1070, 1250), hy: r(565, 705), dx: r(1390, 1570), dy: r(560, 665),
    a: r(0.5, 1.3), b: r(0.6, 1.5), ph: r(0, 6.3), fl: r(2, 5), spin: r(1.6, 2.6) * (rand() < 0.5 ? -1 : 1), ox: r(18, 44),
    oy: r(12, 30), delay: r(0, 1.6) }));
  /* ---- Bühne in WebGL (Ticket 19, ADR 0007) ---- */
  /**
   * Die Bühne, gezeichnet in WebGL (bis Ticket 19 vom Compositor, als Ebenen): Die Logik (Folge, Fahrten, Spuren,
   * Schwinger, Orte der Glühwürmchen) liefert die Werte, die Ebenen (.ebene) nur die Quelle. Jedes Bild zeichnet die eigene
   * Schleife aus der Zeit: Kamera aus der Folge (folgeZeit, auf der Uhr der Folge, folgeUhr), Arm, Kraft,
   * Länge und Stern aus den Spuren, Schal, Atmen und Flackern aus den Schwingern, die Glühwürmchen aus wurmOrt (genau,
   * ohne Animationen). Was steht, ist je Ebene und Abschnitt der Folge (abschnitteFuer, wie die Ebenen des Compositors)
   * ein Bild aus demselben SVG, nur so gross wie das, was man darin sieht, in der grössten Skalierung des Abschnitts
   * (darüber hinaus eine Grundstufe und scharfe Stufen je Ruhepunkt, stufen), in Kacheln je eine Textur, ganz
   * durchsichtige fallen weg; gerastert wird im Ruhepunkt davor, ein paar Kacheln je Bild. Linien (linie) bekommen wie
   * oben ihre Breite je Ruhepunkt. Eine eigene Leinwand im .world (dessen Ein- und Ausblenden bleibt), ein eigener
   * WebGL-Kontext ohne Tiefe und Kantenglättung, in Gerätepixeln (mit dem Massstab der Seite, SEITE); der des Spiels
   * zeichnet mit höchstens 2 Pixeln je CSS-Pixel der Oberfläche (QUALITY), auf dem Poco unschärfer als die Bühne bisher.
   * Gemessen (Ticket 19): Fahrten des Prologs ohne Lücke über 25 ms, Texturen höchstens etwa 116 MB bei 2400 × 1080.
   */
  const glBuehne = () => {
    const leinwand = document.createElement('canvas');
    leinwand.className = 'gl-buehne';
    q('.world').prepend(leinwand);
    const r3 = new THREE.WebGLRenderer({ canvas: leinwand, antialias: false, alpha: false, depth: false, stencil: false,
      premultipliedAlpha: true, powerPreference: 'high-performance' });
    r3.setPixelRatio(1);
    r3.setClearColor(0x020208, 1);
    r3.sortObjects = false;
    const MAX_TEX = Math.min(8192, r3.capabilities.maxTextureSize);
    const KACHEL = 512; // px je Kachel (eine Textur; ganz durchsichtige fallen weg, rastern)
    const kamera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);
    const welt = new THREE.Scene();
    const quad = new THREE.BufferGeometry();
    quad.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
    quad.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    quad.setIndex([0, 1, 2, 0, 2, 3]);
    // vormultipliertes Alpha wie im Compositor: Texturen vormultipliert hochgeladen, gemischt mit 1, 1 − α
    const mischen = { transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
    // uvRect: der Teil der Textur ohne ihren Rand (1 Pixel der Nachbarn, gegen Nähte beim Filtern, rastern)
    const VS = 'uniform vec4 uvRect; varying vec2 vUv; void main() { vUv = uvRect.xy + uv * uvRect.zw; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
    const bildMaterial = () => new THREE.ShaderMaterial({ ...mischen,
      uniforms: { map: { value: null }, opacity: { value: 1 }, uvRect: { value: new THREE.Vector4(0, 0, 1, 1) } },
      vertexShader: VS,
      fragmentShader: 'uniform sampler2D map; uniform float opacity; varying vec2 vUv; void main() { gl_FragColor = texture2D(map, vUv) * opacity; }' });
    /** Mesh über dem Einheitsquadrat stellen: box [x, y, b, h] in Massen des Teils, m (a, b, c, d, e, f) vom Teil in
     *  die Ebene, pose { s, ox, oy } von der Ebene in Pixel der Leinwand */
    const setze = (mesh, { s, ox, oy }, [bx, by, bw, bh], [a, b, c, d, e, f] = [1, 0, 0, 1, 0, 0]) => {
      mesh.matrix.set(s * a * bw, s * c * bh, 0, s * (a * bx + c * by + e) + ox,
        s * b * bw, s * d * bh, 0, s * (b * bx + d * by + f) + oy, 0, 0, 1, 0, 0, 0, 0, 1);
      mesh.matrixWorldNeedsUpdate = true;
    };
    const dreh = (grad, x = 0, y = 0, sk = 1) => {
      const r = grad * Math.PI / 180, co = Math.cos(r) * sk, si = Math.sin(r) * sk;
      return [co, si, -si, co, x, y];
    };
    const mal = ([a1, b1, c1, d1, e1, f1], [a2, b2, c2, d2, e2, f2]) => // erst m2, dann m1
      [a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2, a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1];

    /* -- SVG aus den Ebenen: was steht, als Markup in Massen der Szene (verschachtelte svg mit x, y statt left, top) -- */
    const defs = new XMLSerializer().serializeToString(q('defs'));
    const markup = (svgEl) => {
      const k = svgEl.cloneNode(true);
      k.setAttribute('x', parseFloat(svgEl.style.left) || 0);
      k.setAttribute('y', parseFloat(svgEl.style.top) || 0);
      k.removeAttribute('style');
      k.removeAttribute('class');
      k.setAttribute('overflow', 'visible');
      return new XMLSerializer().serializeToString(k);
    };
    const boxVon = (svgEl) => svgEl.getAttribute('viewBox').split(' ').map(Number);
    // Namensraum aus dem DOM: index.html nennt keine Adresse (Offline, tests/logic.test.mjs)
    const svgDoc = (inhalt, [x, y, w, h], pw, ph, rs) => `<svg xmlns="${q('svg').namespaceURI}" `
      + `width="${pw}" height="${ph}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="none" style="--rs:${rs}">${defs}${inhalt}</svg>`;
    /** Grenzen einer Linie: die Punkte ihres Pfads (nur M und L), sonst die Box ihres SVG; dazu Rand für den Strich */
    const linienBox = (svgEl) => {
      const d = [...svgEl.querySelectorAll('path')].map((p) => p.getAttribute('d')).join(' ');
      if (/[AQCSHVaqcshv]/.test(d)) { const [x, y, b, h] = boxVon(svgEl); return [x - 4, y - 4, x + b + 4, y + h + 4]; }
      const z = d.match(/-?\d*\.?\d+/g).map(Number);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i + 1 < z.length; i += 2) { x0 = Math.min(x0, z[i]); x1 = Math.max(x1, z[i]); y0 = Math.min(y0, z[i + 1]); y1 = Math.max(y1, z[i + 1]); }
      return [x0 - 6, y0 - 6, x1 + 6, y1 + 6];
    };

    /* -- Teile je Ebene in der Reihenfolge des DOM: stehend (gruppe), linie, sterne, flk, polar, rauch, schal, arm, wuermer -- */
    const teile = layers.map(({ inhalt, p }, ebene) => {
      const liste = [];
      let gruppe = null;
      for (const kind of inhalt.children) {
        const cl = kind.classList;
        if (kind.tagName.toLowerCase() === 'svg' && !cl.contains('linie') && !cl.contains('tw') && !cl.contains('flk')) {
          if (!gruppe) liste.push(gruppe = { art: 'gruppe', ebene, p, teile: [], box: [Infinity, Infinity, -Infinity, -Infinity],
            rs: cl.contains('fest') ? 'fest' : 1 });
          gruppe.teile.push(markup(kind));
          if (cl.contains('fest')) gruppe.rs = 'fest';
          // ein ganzes Bild (BILD) ragt über seine Box hinaus (Himmel, Flächen bis 2600 hinab): ohne Grenze
          const [x, y, b, h] = boxVon(kind), ganz = cl.contains('bild');
          const g = gruppe.box;
          gruppe.box = ganz ? [-Infinity, -Infinity, Infinity, Infinity]
            : [Math.min(g[0], x), Math.min(g[1], y), Math.max(g[2], x + b), Math.max(g[3], y + h)];
          continue;
        }
        gruppe = null;
        if (cl.contains('linie')) { if (!cl.contains('aus')) liste.push({ art: 'linie', ebene, p, inhalt: markup(kind), box: linienBox(kind) }); }
        else if (cl.contains('tw')) {
          const st = kind.style, dauer = parseFloat(st.animationDuration), verz = parseFloat(st.animationDelay);
          let sterne = liste.find((x) => x.art === 'sterne');
          if (!sterne) liste.push(sterne = { art: 'sterne', ebene, p, punkte: [] });
          for (const c of kind.querySelectorAll('circle')) {
            sterne.punkte.push([+c.getAttribute('cx'), +c.getAttribute('cy'), +c.getAttribute('r'), +(c.getAttribute('opacity') ?? 1),
              dauer, verz, cl.contains('hell') ? 0.15 : 0.26]);
          }
        } else if (cl.contains('flk')) {
          liste.push({ art: 'flk', ebene, p, inhalt: markup(kind), box: boxVon(kind),
            verz: parseFloat(kind.style.animationDelay) || 0 });
        } else if (cl.contains('polar')) liste.push({ art: 'polar', ebene, p, ...teilVon(kind, kind.querySelector('svg')) });
        else if (cl.contains('smoke')) liste.push({ art: 'rauch', ebene, p });
        else if (cl.contains('scarf')) liste.push({ art: 'schal', ebene, p, ...teilVon(kind, kind.querySelector('svg')) });
        else if (cl.contains('arm')) liste.push({ art: 'arm', ebene, p, ...teilVon(kind, kind.querySelector(':scope > svg')) });
        else if (cl.contains('worms')) liste.push({ art: 'wuermer', ebene, p });
      }
      return liste;
    });
    /** Teil (div.teil) um seinen Ort (left, top) und sein SVG (Box um den Ort) */
    function teilVon(div, svgEl) {
      return { ort: [parseFloat(div.style.left) || 0, parseFloat(div.style.top) || 0], box: boxVon(svgEl),
        inhalt: markup(svgEl) };
    }

    /* -- Rastern: SVG → Kacheln (je eine Textur), eine je Bild gezeichnet und hochgeladen, abbrechbar -- */
    let plan = 0; // Nummer des Plans (neue Folge, anderer Bildschirm): ältere Arbeit bricht ab
    const nachBild = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    const RASTER_MS = 4; // so viel Arbeit des Hauptthreads je Bild beim Rastern im Ruhepunkt
    let wartet = false; // eine Fahrt wartet auf ihre Texturen (bereit): mehr je Bild
    let kette = Promise.resolve(); // Rastern nacheinander (ein Stück je Bild)
    const statistik = { kacheln: 0, leer: 0, ms: 0, laengste: 0, texturen: 0, log: [] };
    const g3 = r3.getContext(), kachel = document.createElement('canvas'), kctx = kachel.getContext('2d');
    const probe = document.createElement('canvas');
    probe.width = probe.height = 32;
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    /** Die Kachel ist ganz durchsichtig (Probe in 32 × 32): keine Textur (der Himmel der nahen Ebenen, Speicher der Grafik) */
    const durchsichtig = (img, x, y, w, h) => {
      pctx.clearRect(0, 0, 32, 32);
      pctx.drawImage(img, x, y, w, h, 0, 0, 32, 32);
      const d = pctx.getImageData(0, 0, 32, 32).data;
      for (let i = 3; i < d.length; i += 4) if (d[i]) return false;
      return true;
    };
    /**
     * Textur aus der Leinwand der Kachel, als THREE.Texture, die three nur bindet (Version 0: lädt nichts selbst hoch):
     * Eine ganze Leinwand auf einmal hielt den Hauptthread bis 320 ms an (das SVG wird erst beim Hochladen gerastert).
     */
    const textur = (quelle) => {
      const wt = g3.createTexture();
      r3.state.bindTexture(g3.TEXTURE_2D, wt);
      g3.pixelStorei(g3.UNPACK_FLIP_Y_WEBGL, false);
      g3.pixelStorei(g3.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      g3.texImage2D(g3.TEXTURE_2D, 0, g3.RGBA, g3.RGBA, g3.UNSIGNED_BYTE, quelle);
      for (const [k, v] of [[g3.TEXTURE_MIN_FILTER, g3.LINEAR], [g3.TEXTURE_MAG_FILTER, g3.LINEAR],
        [g3.TEXTURE_WRAP_S, g3.CLAMP_TO_EDGE], [g3.TEXTURE_WRAP_T, g3.CLAMP_TO_EDGE]]) g3.texParameteri(g3.TEXTURE_2D, k, v);
      const tex = new THREE.Texture();
      r3.properties.get(tex).__webglTexture = wt;
      return { tex, frei: () => { g3.deleteTexture(wt); r3.properties.remove(tex); } };
    };
    /**
     * SVG inhalt im Ausschnitt [x0, y0, x1, y1] (Massen) mit S Pixeln je Mass rastern, in Kacheln von KACHEL Pixeln, je
     * eine eigene Textur mit 1 Pixel Rand der Nachbarn (keine Nähte beim Filtern); ganz durchsichtige fallen weg. Zurück
     * ein Bild { obj (Gruppe der Meshes), kacheln [{ mesh, box }], frei(), bytes }, oder null (abgebrochen).
     */
    const rastern = (inhalt, [x0, y0, x1, y1], S, rs, eilig = () => false) => {
      const job = kette.then(async () => {
        const meinPlan = plan;
        let pw = Math.max(1, Math.ceil((x1 - x0) * S)), ph = Math.max(1, Math.ceil((y1 - y0) * S));
        const f = Math.min(1, MAX_TEX / pw, MAX_TEX / ph);
        if (f < 1) { S *= f; pw = Math.min(MAX_TEX, Math.ceil((x1 - x0) * S)); ph = Math.min(MAX_TEX, Math.ceil((y1 - y0) * S)); }
        const url = URL.createObjectURL(new Blob([svgDoc(inhalt, [x0, y0, pw / S, ph / S], pw, ph, rs)], { type: 'image/svg+xml' }));
        const kacheln = [], frei = () => { for (const k of kacheln) k.frei(); };
        let ab = performance.now(); // Beginn der Arbeit in diesem Bild
        try {
          const img = new Image();
          img.src = url;
          await img.decode();
          for (let ty = 0; ty < ph; ty += KACHEL) for (let tx = 0; tx < pw; tx += KACHEL) {
            // im Ruhepunkt ein Stück je Bild; in einer Fahrt nur, was gebraucht wird (sonst wartet es)
            while (scene.moving && !eilig() && meinPlan === plan) await nachBild();
            if (meinPlan !== plan) { frei(); return null; }
            const t0 = performance.now(), w = Math.min(KACHEL, pw - tx), h = Math.min(KACHEL, ph - ty);
            if (pw * ph > KACHEL * KACHEL && durchsichtig(img, tx, ty, w, h)) { statistik.leer++; continue; }
            const ax = Math.max(0, tx - 1), ay = Math.max(0, ty - 1), kw = Math.min(pw, tx + w + 1) - ax, kh = Math.min(ph, ty + h + 1) - ay;
            if (kachel.width !== kw || kachel.height !== kh) { kachel.width = kw; kachel.height = kh; } else kctx.clearRect(0, 0, kw, kh);
            kctx.drawImage(img, ax, ay, kw, kh, 0, 0, kw, kh);
            const t = textur(kachel), mesh = new THREE.Mesh(quad, bildMaterial());
            mesh.matrixAutoUpdate = false;
            mesh.frustumCulled = false;
            mesh.material.uniforms.map.value = t.tex;
            mesh.material.uniforms.uvRect.value.set((tx - ax) / kw, (ty - ay) / kh, w / kw, h / kh);
            kacheln.push({ mesh, box: [x0 + tx / S, y0 + ty / S, w / S, h / S], frei: t.frei, bytes: kw * kh * 4 });
            const ms = performance.now() - t0;
            statistik.kacheln++; statistik.ms += ms; statistik.laengste = Math.max(statistik.laengste, ms);
            if (statistik.log.length < 3000) statistik.log.push([Math.round(t0), +ms.toFixed(1), kw * kh]);
            // weiter im nächsten Bild, sobald dieses RASTER_MS Arbeit hatte (wartet eine Fahrt darauf: mehr)
            if (!eilig() && performance.now() - ab > (wartet ? 12 : RASTER_MS)) { await nachBild(); ab = performance.now(); }
          }
          statistik.texturen++;
          const obj = new THREE.Group();
          for (const k of kacheln) obj.add(k.mesh);
          return { obj, kacheln, frei, bytes: kacheln.reduce((x, k) => x + k.bytes, 0), groesse: [pw, ph] };
        } finally { URL.revokeObjectURL(url); }
      });
      kette = job.catch(() => null);
      return job;
    };
    /** Bild in die Ebene (pose), m: vom Teil in die Ebene, alpha: Deckkraft */
    const zeigBild = (bild, pose, m, alpha = 1) => {
      for (const k of bild.kacheln) { setze(k.mesh, pose, k.box, m); k.mesh.material.uniforms.opacity.value = alpha; }
    };

    /* -- Plan je Folge und Bildschirm: Ansichten je Ebene und Abschnitt, daraus Ausschnitte und Skalierungen -- */
    const q2 = () => (window.visualViewport?.scale ?? 1) * (window.devicePixelRatio || 1); // Gerätepixel je CSS-Pixel der Bühne
    // höchstens so viele Bildschirme an Pixeln je Textur (Speicher der Grafik): darüber bekommt ein Abschnitt eine
    // Grundstufe über alles, was man sieht, und schärfere Stufen für die Ruhepunkte (stufen)
    const BUDGET = 1.6;
    /** Ansichten der Ebene p in den Fahrten a … b, je 24 Schritte: Rechteck in Massen, Skalierung, ende (Ruhepunkt) */
    const ansichten = (stuecke, p, a, b) => {
      const W = innerWidth, H = innerHeight, aus = [];
      for (const [i, { from, to }] of stuecke.slice(a, b + 1).entries()) for (let j = i ? 1 : 0; j <= 24; j++) {
        const k = j / 24, c = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z * (to.z / from.z) ** k };
        const s = scene.skala(c, p), X = 800 + (c.x - 800) * p, Y = 450 + (c.y - 450) * p;
        aus.push({ box: [X - W / 2 / s - 4, Y - H / 2 / s - 4, X + W / 2 / s + 4, Y + H / 2 / s + 4], s, ende: j === 0 || j === 24 });
      }
      return aus;
    };
    const huelle = (l) => [Math.min(...l.map((x) => x.box[0])), Math.min(...l.map((x) => x.box[1])),
      Math.max(...l.map((x) => x.box[2])), Math.max(...l.map((x) => x.box[3]))];
    const schnitt = (a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])];
    const leer = (b) => !(b[2] > b[0] && b[3] > b[1]);
    const inhaltVon = (b) => (b[2] - b[0]) * (b[3] - b[1]);
    const weiter = ([x0, y0, x1, y1], f) => { const dx = (x1 - x0) * f, dy = (y1 - y0) * f; return [x0 - dx, y0 - dy, x1 + dx, y1 + dy]; };
    /**
     * Stufen einer Gruppe im Abschnitt [a, b] der Folge: eine Grundstufe über alles, was man darin sieht (Skalierung die
     * grösste, höchstens BUDGET Bildschirme an Pixeln), dazu je Ruhepunkt, den die Grundstufe um mehr als 15 % zu grob
     * zeigt, eine scharfe Stufe über seine Ansicht (in einer Zoomfahrt ist die Mitte so etwas weicher, im Halt nie)
     */
    const stufen = (p, [a, b], grenze) => {
      const q = q2(), budget = BUDGET * innerWidth * innerHeight * q * q, v = ansichten(stand.stuecke, p, a, b);
      const box = schnitt(huelle(v), grenze);
      if (leer(box)) return [];
      const S = Math.min(Math.max(...v.map((x) => x.s)) * q, Math.sqrt(budget / inhaltVon(box))), aus = [{ box, S }];
      for (const x of v) {
        if (!x.ende || x.s * q <= S * 1.15) continue;
        const bx = schnitt(weiter(x.box, 0.04), grenze);
        if (leer(bx) || aus.some((y) => y.box.join() === bx.join())) continue;
        aus.push({ box: bx, S: Math.min(x.s * q, Math.sqrt(budget / inhaltVon(bx))) });
      }
      return aus;
    };

    // Texturen der stehenden Gruppen: je Gruppe { Abschnitt → { job, teile (Stufen mit Mesh), fertig } }; Linien je
    // Ruhepunkt; Teile (Sprites)
    const gruppen = teile.flat().filter((x) => x.art === 'gruppe');
    const linienT = teile.flat().filter((x) => x.art === 'linie');
    for (const g of gruppen) { g.obj = new THREE.Group(); welt.add(g.obj); g.tex = new Map(); }
    for (const l of linienT) { l.obj = new THREE.Group(); welt.add(l.obj); }
    let stand = null; // { stuecke, abschnitte, key }
    const freiAlle = (e) => { for (const bild of e?.teile ?? []) bild.frei(); };
    /** Textur der Gruppe g für den Abschnitt [a, b] (anlegen, falls nicht da); eilig: in einer Fahrt sofort rastern */
    const gruppeTex = (g, ab, eilig = false) => {
      const key = ab.join('-');
      let e = g.tex.get(key);
      if (!e) {
        e = { teile: null, eilig, fertig: false };
        g.tex.set(key, e);
        const rs = g.rs === 'fest' ? scene.skala({ z: 1 }, g.p).toFixed(5) : 1;
        e.job = Promise.all(stufen(g.p, ab, g.box).map(({ box, S }) => rastern(g.teile.join(''), box, S, rs, () => e.eilig)))
          .then((bilder) => {
            if (bilder.some((x) => !x)) { for (const x of bilder) x?.frei(); return null; } // abgebrochen (neuer Plan)
            e.teile = bilder;
            e.fertig = true;
            einmal();
            return e;
          });
      }
      if (eilig) e.eilig = true;
      return e;
    };
    /** Linie l im Ruhepunkt: Breite aus der Kamera c, gerastert für die nächste Fahrt n (Ausschnitt der ganzen Folge) */
    const linieTex = (l, c, n) => {
      const rs = scene.skala(c, l.p), aktuell = l.aktuell;
      if (aktuell && Math.max(rs / aktuell.rs, aktuell.rs / rs) <= LINIEN_TOLERANZ) return;
      if (l.wird && Math.max(rs / l.wird.rs, l.wird.rs / rs) <= LINIEN_TOLERANZ) return;
      const anzahl = stand.stuecke.length, q = q2();
      const aus = schnitt(huelle(ansichten(stand.stuecke, l.p, 0, anzahl - 1)), l.box);
      if (leer(aus)) return;
      const smax = Math.max(...ansichten(stand.stuecke, l.p, Math.max(0, n - 1), Math.min(n, anzahl - 1)).map((x) => x.s));
      const S = Math.min(smax * q, Math.sqrt(BUDGET * innerWidth * innerHeight * q * q / inhaltVon(aus)));
      const e = l.wird = { rs, bild: null };
      e.job = rastern(l.inhalt, aus, S, rs.toFixed(5)).then((bild) => {
        if (l.wird !== e || !bild) { bild?.frei(); return; }
        l.wird = null;
        l.aktuell?.bild?.frei();
        e.bild = bild;
        l.aktuell = e;
        l.obj.clear();
        l.obj.add(bild.obj);
      });
    };

    /* -- Teile, die sich bewegen: kleine Texturen einmal je Plan, je ein Mesh -- */
    const sprites = [];
    const sprite = (x, inhalt, box, extra = 1) => {
      const s = { obj: new THREE.Group(), box, inhalt, extra, p: x.p, bild: null };
      welt.add(s.obj);
      sprites.push(s);
      return s;
    };
    const flks = [], rauch = [], wuermer = [];
    let polarT = null, schalT = null, armT = null, sterne = null, strahl = null;
    for (const x of teile.flat()) {
      if (x.art === 'flk') flks.push({ ...x, s: sprite(x, x.inhalt, x.box) });
      else if (x.art === 'polar') polarT = { ...x, s: sprite(x, x.inhalt, x.box, 2.8) };
      else if (x.art === 'schal') schalT = { ...x, s: sprite(x, x.inhalt, x.box) };
      else if (x.art === 'arm') {
        armT = { ...x, s: sprite(x, x.inhalt, x.box) };
        strahl = strahlMesh();
      } else if (x.art === 'rauch') {
        const inhalt = '<ellipse rx="1.5" ry="1" fill="url(#s-smoke)"/>';
        chimneys.forEach(([cx, cy], i) => [0, 1 / 3, 2 / 3].forEach((off0) =>
          rauch.push({ ort: [n(cx), n(cy)], off: off0 + i * 0.13, s: sprite(x, inhalt, [-1.5, -1, 3, 2], 13) })));
      } else if (x.art === 'wuermer') {
        const inhalt = (DIAG.has('ohneleuchten') ? '' : '<circle r="11" fill="url(#s-gw)"/>') + '<circle r="1.9" fill="#efffb0"/>';
        for (const w of worms) wuermer.push({ w, s: sprite(x, inhalt, [-11, -11, 22, 22], 1.6) });
      } else if (x.art === 'sterne') sterne = { ...x, mesh: sternMesh(x.punkte) };
    }
    const wagenM = wagenMesh();
    // gezeichnet wird in der Reihenfolge des DOM (Ebene für Ebene, darin wie ihre Kinder)
    {
      const reihe = [];
      for (const x of teile.flat()) {
        if (x.art === 'gruppe') reihe.push(x.obj);
        else if (x.art === 'linie') reihe.push(x.obj);
        else if (x.art === 'sterne') reihe.push(sterne.mesh);
        else if (x.art === 'flk') reihe.push(flks.find((f) => f.box === x.box).s.obj);
        else if (x.art === 'polar') reihe.push(wagenM, polarT.s.obj); // der Wagen hinter seinem Polarstern
        else if (x.art === 'schal') reihe.push(schalT.s.obj);
        else if (x.art === 'arm') reihe.push(armT.s.obj, strahl);
        else if (x.art === 'rauch') reihe.push(...rauch.map((r) => r.s.obj));
        else if (x.art === 'wuermer') reihe.push(...wuermer.map((w) => w.s.obj));
      }
      for (const m of reihe) welt.remove(m);
      for (const m of reihe) welt.add(m);
    }
    // alle Shader jetzt übersetzen: Der Strahl erscheint erst beim Klick der Lampe und übersetzte dann im ersten Bild (88 ms)
    {
      const vor = new THREE.Mesh(quad, bildMaterial());
      welt.add(vor);
      for (const o of welt.children) o.visible = true;
      r3.compile(welt, kamera);
      welt.remove(vor);
    }

    /** Funkelnde Sterne als Punkte: Deckkraft je Gruppe wie die CSS-Animation (ease-in-out, hin und her) */
    function sternMesh(punkte) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(punkte.flatMap(([x, y]) => [x, y, 0]), 3));
      g.setAttribute('stern', new THREE.Float32BufferAttribute(punkte.flatMap(([, , r, o]) => [r, o]), 2));
      g.setAttribute('takt', new THREE.Float32BufferAttribute(punkte.flatMap(([, , , , d, v, von]) => [d, v, von]), 3));
      const m = new THREE.Points(g, new THREE.ShaderMaterial({ ...mischen,
        uniforms: { uPose: { value: new THREE.Vector3(1, 0, 0) }, uZeit: { value: 0 }, uAufl: { value: new THREE.Vector2(1, 1) } },
        vertexShader: `uniform vec3 uPose; uniform float uZeit; uniform vec2 uAufl; attribute vec2 stern; attribute vec3 takt;
          varying float vR; varying float vA;
          float kurve(float x) { // ease-in-out (cubic-bezier(0.42, 0, 0.58, 1)), genähert
            return x * x * (3.0 - 2.0 * x); }
          void main() {
            vec2 px = position.xy * uPose.x + uPose.yz;
            gl_Position = vec4(px / uAufl * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
            vR = stern.x * uPose.x;
            float u = mod((uZeit - takt.y) / takt.x, 2.0); // hin und her (alternate)
            float k = kurve(u < 1.0 ? u : 2.0 - u);
            vA = stern.y * mix(takt.z, 1.0, k);
            gl_PointSize = 2.0 * vR + 3.0;
          }`,
        fragmentShader: `varying float vR; varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5) * (2.0 * vR + 3.0);
            // Fläche wie beim Rastern einer kleinen Scheibe: Kante 1 Pixel weich, sehr kleine nach ihrer Fläche
            float a = clamp(vR + 0.5 - d, 0.0, 1.0) * min(1.0, vR * vR * 3.14159 / 0.785);
            gl_FragColor = vec4(1.0) * a * vA;
          }` }));
      m.frustumCulled = false;
      welt.add(m);
      return m;
    }
    /**
     * Der Kleine Wagen (BUEHNENWAGEN): Sterne 1 … 6 und die sieben Linien als Rechtecke in Bildpixeln um ihre Orte im
     * Himmel (scene.wagenOrte, wagenSetzen), gezeichnet wie der Wagen am Himmel der Welten (himmelsWagen: Kern mit
     * Schein, Linien mit Lücke zu den Sternen); der Polarstern ist der Teil polar. Helligkeit und Grösse je Bild
     * (zeichnen, scene.wagenBei).
     */
    function wagenMesh() {
      const nS = wagen.polarstern - 1, nQ = nS + wagen.linien.length, index = [];
      const ecke = new Float32Array(nQ * 8), art = new Float32Array(nQ * 4), nr = new Float32Array(nQ * 4);
      for (let i = 0; i < nQ; i++) {
        const linie = i >= nS;
        (linie ? [[-1, 0], [1, 0], [1, 1], [-1, 1]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]]).forEach((e, j) => {
          ecke.set(e, (i * 4 + j) * 2);
          art[i * 4 + j] = linie ? 1 : 0;
          nr[i * 4 + j] = i;
        });
        index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(nQ * 12), 3)); // für three.js
      g.setAttribute('aA', new THREE.Float32BufferAttribute(new Float32Array(nQ * 8), 2));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(new Float32Array(nQ * 8), 2));
      g.setAttribute('aEcke', new THREE.Float32BufferAttribute(ecke, 2));
      g.setAttribute('aArt', new THREE.Float32BufferAttribute(art, 1));
      g.setAttribute('aNr', new THREE.Float32BufferAttribute(nr, 1));
      g.setIndex(index);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ ...mischen,
        uniforms: { uPose: { value: new THREE.Vector3(1, 0, 0) }, uAufl: { value: new THREE.Vector2(1, 1) },
          uHell: { value: new Float32Array(nQ) }, uGroesse: { value: new Float32Array(nQ) }, uLuecke: { value: 0 } },
        vertexShader: `uniform vec3 uPose; uniform vec2 uAufl; uniform float uHell[${nQ}], uGroesse[${nQ}], uLuecke;
          attribute vec2 aA, aB, aEcke; attribute float aArt, aNr;
          varying vec2 vEcke; varying float vHell, vArt;
          vec4 bild(vec2 px) { return vec4(px / uAufl * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0); }
          void main() {
            int i = int(aNr + 0.5);
            vHell = uHell[i]; vEcke = aEcke; vArt = aArt;
            vec2 pa = aA * uPose.x + uPose.yz, pb = aB * uPose.x + uPose.yz; // Bildpixel
            if (vHell <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; } // aus: nichts
            if (aArt < 0.5) { gl_Position = bild(pa + aEcke * 0.75 * uGroesse[i]); return; } // Stern mit Schein
            vec2 d = pb - pa;
            float len = length(d);
            if (len < 2.0 * uLuecke + 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
            d /= len;
            gl_Position = bild(mix(pa, pb, aEcke.y) + vec2(-d.y, d.x) * aEcke.x * (0.5 * uGroesse[i] + 1.0)
              + d * uLuecke * (1.0 - 2.0 * aEcke.y));
          }`,
        fragmentShader: `varying vec2 vEcke; varying float vHell, vArt;
          void main() {
            float a;
            if (vArt < 0.5) {
              float r = length(vEcke) * 1.5; // 1: Rand des Kerns
              a = smoothstep(1.0, 0.45, r) + 0.22 * pow(max(0.0, 1.0 - r / 1.5), 2.0);
            } else a = smoothstep(1.0, 0.35, abs(vEcke.x));
            float h = min(vHell * a, 1.0);
            gl_FragColor = vec4(vec3(h), h);
          }` }));
      m.frustumCulled = false;
      welt.add(m);
      return m;
    }
    /** Die Orte des Wagens (scene.wagenOrte, Massen der Szene im Himmel) in sein Netz, wenn sie neu sind. */
    function wagenSetzen(orte) {
      if (wagenM.userData.orte === orte) return;
      wagenM.userData.orte = orte;
      const nS = wagen.polarstern - 1, ga = wagenM.geometry.attributes.aA, gb = wagenM.geometry.attributes.aB;
      const enden = [...orte.slice(0, nS).map((o) => [o, o]),
        ...wagen.linien.map(([a, b]) => [orte[a - 1], orte[b - 1]])];
      enden.forEach(([a, b], i) => {
        for (let j = 0; j < 4; j++) { ga.array.set(a, (i * 4 + j) * 2); gb.array.set(b, (i * 4 + j) * 2); }
      });
      ga.needsUpdate = gb.needsUpdate = true;
    }
    /**
     * Strahl: Kegel und Kern (STRAHL_TEILE) als ein Trapez je Teil mit Hals w0 und Breite k · L am Ende, deckend in seiner
     * Farbe mal dem Verlauf (Maske: Stopps über L / 0,55), der Kern über dem Kegel, darüber das Leuchten der Lampe (s-lamp);
     * alles zusammen mal Kraft und Flackern (wie die Deckkraft der Gruppe im DOM). In Massen des Arms, Ursprung an der
     * Spitze der Lampe (left 34).
     */
    function strahlMesh() {
      const farbe = (h) => new THREE.Vector3(...[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
      const stopps = (st) => st.map(([a, p]) => new THREE.Vector2(p / 100, a));
      const [kegel, kern] = STRAHL_TEILE;
      const m = new THREE.Mesh(quad, new THREE.ShaderMaterial({ ...mischen,
        uniforms: { uL: { value: 1 }, uS: { value: 1 }, uO: { value: 0 }, uPx: { value: 1 },
          uW0: { value: new THREE.Vector2(kegel.w0, kern.w0) }, uK: { value: new THREE.Vector2(kegel.k, kern.k) },
          uHb: { value: new THREE.Vector2(...STRAHL_TEILE.map(({ w0, k }) => Math.max(k * STRAHL_L, w0 / 0.25))) },
          uF0: { value: farbe(kegel.farbe) }, uF1: { value: farbe(kern.farbe) },
          uS0: { value: stopps(kegel.stopps) }, uS1: { value: stopps(kern.stopps) }, uBox: { value: new THREE.Vector4() } },
        vertexShader: 'uniform vec4 uBox; varying vec2 vP; void main() { vP = uBox.xy + uv * uBox.zw; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uL; uniform float uS; uniform float uO; uniform float uPx; uniform vec2 uW0; uniform vec2 uK; uniform vec2 uHb;
          uniform vec3 uF0; uniform vec3 uF1; uniform vec2 uS0[4]; uniform vec2 uS1[4]; varying vec2 vP;
          // Maske: Stopps (Anteil, Alpha) über die Länge L / 0,55, zwischen ihnen weich (smoothstep statt linear: keine
          // Knicke im Verlauf, die als Stufen zu sehen waren)
          float verlauf(vec2 s[4], float u) {
            if (u <= s[0].x) return s[0].y;
            for (int i = 1; i < 4; i++) if (u <= s[i].x) return mix(s[i - 1].y, s[i].y, smoothstep(s[i - 1].x, s[i].x, u));
            return s[3].y; }
          // weich: so breit (Anteil der halben Breite) blendet der Rand aus, je zur Hälfte innen und aussen (die Menge
          // Licht bleibt gleich, mindestens ein Pixel); mit dem harten Rand wie im DOM wirkte der Strahl aussen eckig
          // (Nutzer, Ticket 19)
          float teil(float w0, float k, float hb, float weich) {
            float halb = w0 + (k * uL - w0) * vP.x / uL; // Hals w0, am Ende k · L (Kegel und Keile zusammen)
            float rand = min(halb, uS * hb); // die Box der Maske (Höhe 2 hb, mitskaliert)
            float b = max(uPx, weich * rand);
            float a = smoothstep(-0.5 * b, 0.5 * b, rand - abs(vP.y));
            return a * clamp(vP.x / uPx + 0.5, 0.0, 1.0) * clamp((uL - vP.x) / uPx + 0.5, 0.0, 1.0); }
          void main() {
            float u = vP.x / (uL / 0.55);
            float a0 = teil(uW0.x, uK.x, uHb.x, ${STRAHL_WEICH.toFixed(2)}) * verlauf(uS0, u), a1 = teil(uW0.y, uK.y, uHb.y, 0.5) * verlauf(uS1, u);
            vec4 c = vec4(uF0 * a0, a0);
            c = vec4(uF1 * a1, a1) + c * (1.0 - a1);
            float r = length(vP) / 24.0; // Leuchten der Lampe (s-lamp, r 24)
            float al = r < 0.25 ? mix(1.0, 0.45, r / 0.25) : mix(0.45, 0.0, clamp((r - 0.25) / 0.75, 0.0, 1.0));
            vec3 fl = r < 0.25 ? mix(vec3(1.0, 250.0 / 255.0, 240.0 / 255.0), vec3(1.0, 241.0 / 255.0, 204.0 / 255.0), r / 0.25) : vec3(1.0, 241.0 / 255.0, 204.0 / 255.0);
            c = vec4(fl * al, al) + c * (1.0 - al);
            gl_FragColor = c * uO;
          }` }));
      m.matrixAutoUpdate = false;
      m.frustumCulled = false;
      welt.add(m);
      return m;
    }

    /* -- Kamera aus der Folge auf ihrer Uhr (folgeUhr: Tippen, Tempo, Halt) -- */
    const kameraBei = () => {
      const a = scene.folgeUhr, fz = scene.folgeZeit;
      if (!a || !fz || a.currentTime == null) return scene.cam;
      const ms = a.currentTime;
      let c = fz.start;
      for (const { from, to, t, d } of fz.stuecke) {
        if (ms < t) return from;
        if (ms <= t + d) {
          const k = storyEase((ms - t) / d);
          return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z * (to.z / from.z) ** k };
        }
        c = to;
      }
      return c;
    };
    /** Funkeln der Sterne und Flackern der Fenster wie die CSS-Animationen bis Ticket 19: ease-in-out, genähert */
    const sanft = (x) => x * x * (3 - 2 * x);
    const FLK = [[0, 0.9], [0.3, 1], [0.55, 0.6], [0.8, 0.85], [1, 0.9]];
    const flackernBei = (zeit, verz) => {
      const u = (((zeit - verz) / 3.2) % 1 + 1) % 1;
      for (let i = 1; i < FLK.length; i++) if (u <= FLK[i][0]) return FLK[i - 1][1] + (FLK[i][1] - FLK[i - 1][1]) * sanft((u - FLK[i - 1][0]) / (FLK[i][0] - FLK[i - 1][0]));
      return 0.9;
    };

    /* -- je Bild -- */
    const bilder = new Float64Array(4096); // Zeitstempel der eigenen Bilder (Ring), für die Proben
    let bildN = 0, raf = 0, breite = 0, hoehe = 0;
    let fest = null; // eingefroren (scene.einfrieren): jedes Bild zu diesem Zeitpunkt (performance.now)
    const neuePlan = () => {
      const fz = scene.folgeZeit;
      if (!fz) return;
      plan++;
      stand = { stuecke: fz.stuecke, abschnitte: scene.abschnitte, key: fz.key };
      // was noch rastert, bricht ab und gibt sich selbst frei (plan)
      for (const g of gruppen) { for (const e of g.tex.values()) freiAlle(e); g.tex.clear(); g.zeigt = null; g.obj.clear(); }
      for (const l of linienT) { l.aktuell?.bild?.frei(); l.aktuell = l.wird = null; }
      // Teile: klein, gleich rastern (Skalierung: die grösste der Folge in ihrer Ebene, mal extra)
      for (const s of sprites) {
        const smax = Math.max(...ansichten(stand.stuecke, s.p, 0, stand.stuecke.length - 1).map((v) => v.s)), [x, y, b, h] = s.box;
        rastern(s.inhalt, [x, y, x + b, y + h], Math.min(smax * q2() * s.extra, 512 / Math.max(b, h)), 1, () => true)
          .then((bild) => { if (!bild) return; s.bild?.frei(); s.bild = bild; s.obj.clear(); s.obj.add(bild.obj); });
      }
      nachfuehren();
    };
    /** Welche Texturen jetzt gebraucht werden: anlegen, was fehlt; im Ruhepunkt auch die der nächsten Fahrt */
    const nachfuehren = () => {
      if (!stand) return;
      const anzahl = stand.stuecke.length;
      const n = Math.max(0, Math.min(anzahl - 1, scene.moving ? scene.fahrtIndex : scene.fahrtIndex + 1));
      for (const g of gruppen) {
        const ab = stand.abschnitte[g.ebene].find(([a, b]) => a <= n && n <= b);
        const e = gruppeTex(g, ab, scene.moving && !g.zeigt);
        if (e.fertig && g.zeigt !== e) {
          g.zeigt = e;
          g.obj.clear();
          for (const bild of e.teile) g.obj.add(bild.obj);
          // andere Abschnitte frei (ausser einer, der gerade noch rastert)
          for (const [k, x] of g.tex) if (x !== e && x.fertig) { freiAlle(x); g.tex.delete(k); }
        }
      }
      if (!scene.moving) for (const l of linienT) linieTex(l, scene.cam, n);
    };
    const pose = (c, p, q) => {
      const s = scene.skala(c, p) * q, X = 800 + (c.x - 800) * p, Y = 450 + (c.y - 450) * p;
      return { s, ox: innerWidth * q / 2 - s * X, oy: innerHeight * q / 2 - s * Y };
    };
    const zeichnen = (ts = performance.now()) => {
      if (fest !== null) ts = fest;
      const q = q2(), bw = Math.round(innerWidth * q), bh = Math.round(innerHeight * q);
      if (bw !== breite || bh !== hoehe) {
        breite = bw; hoehe = bh;
        r3.setSize(bw, bh, false);
        kamera.right = bw; kamera.bottom = bh; kamera.updateProjectionMatrix();
      }
      const t = scene.zeitBei(ts), c = kameraBei(), posen = layers.map(({ p }) => pose(c, p, q)), echt = ts / 1000;
      for (const g of gruppen) {
        for (const bild of g.zeigt?.teile ?? []) zeigBild(bild, posen[g.ebene]);
      }
      for (const l of linienT) {
        if (l.aktuell?.bild) zeigBild(l.aktuell.bild, posen[l.ebene]);
      }
      const zeig = (s, m, alpha = 1, ebene = layers.findIndex((l) => l.p === s.p)) => {
        s.obj.visible = !!s.bild && alpha > 0.001;
        if (s.obj.visible) zeigBild(s.bild, posen[ebene], m, alpha);
      };
      if (sterne) {
        const u = sterne.mesh.material.uniforms, ps = posen[sterne.ebene];
        u.uPose.value.set(ps.s, ps.ox, ps.oy); u.uZeit.value = echt; u.uAufl.value.set(bw, bh);
      }
      for (const f of flks) zeig(f.s, [1, 0, 0, 1, 0, 0], flackernBei(echt, f.verz), f.ebene);
      { // der Kleine Wagen im Himmel (die Ebene des Polarsterns), sein Polarstern ist der Teil polar
        const orte = scene.wagenOrte, w = scene.wagenBei(t), u = wagenM.material.uniforms, ps = posen[0];
        const nS = wagen.polarstern - 1, H = HIMMELSWAGEN;
        wagenM.visible = !!orte;
        if (orte) {
          wagenSetzen(orte);
          u.uPose.value.set(ps.s, ps.ox, ps.oy); u.uAufl.value.set(bw, bh);
          u.uHell.value.fill(w.hell, 0, nS).fill(w.linie, nS);
          u.uGroesse.value.fill(w.punkt * q, 0, nS).fill(H.linie.breite * q, nS);
          u.uLuecke.value = H.linie.luecke * q;
        }
      }
      if (polarT) zeig(polarT.s, dreh(0, ...(scene.wagenOrte?.[wagen.polarstern - 1] ?? polarT.ort),
        (1 + 1.8 * stern.wert(t)) * atem.wert(t)), 1, polarT.ebene);
      for (const r of rauch) {
        const k = (((t + r.off * 20) % 20) + 20) % 20 / 20, size = 3 + k * 10, dx = k * 34 + Math.sin(4 * Math.PI * k - 3 * r.off) * 3;
        zeig(r.s, [size, 0, 0, size, r.ort[0] + dx, r.ort[1] - k * 85], Math.sin(Math.PI * k) ** 1.5 * 0.5, layers.findIndex((l) => l.p === r.s.p));
      }
      if (schalT) zeig(schalT.s, dreh(schal.wert(t), ...schalT.ort), 1, schalT.ebene);
      const armGrad = armSpur.wert(t);
      if (armT) {
        const m = dreh(armGrad, ...armT.ort);
        zeig(armT.s, m, 1, armT.ebene);
        const v = kraft.wert(t), o = (v > 0.002 ? v : 0) * flackern.wert(t);
        strahl.visible = o > 0.001 && !DIAG.has('ohnestrahl');
        if (strahl.visible) {
          const sL = Math.max(laenge.wert(t), STRAHL_MIN), L = sL * STRAHL_L, H = Math.max(24, ...STRAHL_TEILE.map(({ w0, k }) => Math.max(w0, k * L) * (1 + STRAHL_WEICH / 2))) + 2;
          const box = [-24, -H, L + 24, 2 * H], u = strahl.material.uniforms, ps = posen[armT.ebene];
          setze(strahl, ps, box, mal(m, [1, 0, 0, 1, 34, 0]));
          u.uBox.value.set(...box); u.uL.value = L; u.uS.value = sL; u.uO.value = o; u.uPx.value = 1 / ps.s;
        }
      }
      if (wuermer.length) {
        const a = armGrad * Math.PI / 180, tx = 440 + 34 * Math.cos(a), ty = 592 + 34 * Math.sin(a);
        for (const { w, s } of wuermer) {
          const [x, y, g] = scene.worms === 'idle' ? [w.hx + Math.sin(t * w.a + w.ph) * 16, w.hy + Math.cos(t * w.b + w.ph) * 9, 1]
            : scene.wurmOrt(w, t, tx, ty), blink = 0.45 + 0.55 * Math.sin(w.fl * t + w.ph) ** 2;
          zeig(s, [g, 0, 0, g, x, y], blink);
        }
      }
      r3.render(welt, kamera);
      bilder[bildN++ % bilder.length] = ts;
    };
    let einmalRaf = 0;
    const einmal = () => { if (!raf && !einmalRaf) einmalRaf = requestAnimationFrame((ts) => { einmalRaf = 0; if (!raf && stand) { nachfuehren(); zeichnen(ts); } }); };
    const schleife = (ts) => {
      raf = 0;
      if (!scene.running) return;
      zeichnen(ts);
      raf = requestAnimationFrame(schleife);
      // nach dem Bild: was fehlt, anstossen (rastert dann ein Stück je Bild)
      if (!scene.moving) nachfuehren();
    };
    return {
      leinwand,
      neuePlan,
      /** einmal zeichnen (vorwärmen: Shader und Texturen), ohne Schleife */
      zeichnen: () => { nachfuehren(); zeichnen(); },
      start() { if (!raf) raf = requestAnimationFrame(schleife); },
      /** jedes Bild zum Zeitpunkt ms (performance.now; null: wieder jetzt) */
      einfrieren(ms) { fest = ms; },
      stop() { cancelAnimationFrame(raf); raf = 0; },
      /** Fahrt n kann beginnen, sobald ihre Texturen da sind (Tippen im Ruhepunkt, bevor sie fertig gerastert sind) */
      async bereit(n) {
        if (!stand) return;
        const jobs = gruppen.map((g) => gruppeTex(g, stand.abschnitte[g.ebene].find(([a, b]) => a <= n && n <= b)).job);
        wartet = true;
        try { await Promise.all(jobs); } finally { wartet = false; }
        nachfuehren();
      },
      /** ausgeblendet: Texturen frei (Speicher der Grafik), die Leinwand klein; die nächste Folge plant neu */
      freigeben() {
        plan++;
        stand = null;
        for (const g of gruppen) { for (const e of g.tex.values()) freiAlle(e); g.tex.clear(); g.zeigt = null; g.obj.clear(); }
        for (const l of linienT) { l.aktuell?.bild?.frei(); l.aktuell = l.wird = null; }
        for (const s of sprites) { s.bild?.frei(); s.bild = null; }
        breite = hoehe = 1;
        r3.setSize(1, 1, false);
      },
      /** Abstände der eigenen Bilder (ms), die letzten n */
      bilder(nur = 4096) {
        const k = Math.min(bildN, bilder.length, nur), aus = [];
        for (let i = bildN - k + 1; i < bildN; i++) aus.push(bilder[i % bilder.length] - bilder[(i - 1) % bilder.length]);
        return aus;
      },
      /** Zeitstempel der eigenen Bilder seit t (performance.now, aufsteigend), für die Leistungsanzeige */
      zeitenSeit(t) {
        const aus = [];
        for (let i = Math.max(0, bildN - bilder.length); i < bildN; i++) if (bilder[i % bilder.length] >= t) aus.push(bilder[i % bilder.length]);
        return aus;
      },
      /** Bytes der Texturen (stehend, Linien, Teile) */
      speicher() {
        let b = 0;
        for (const g of gruppen) for (const e of g.tex.values()) for (const bild of e.teile ?? []) b += bild.bytes;
        for (const l of linienT) b += (l.aktuell?.bild?.bytes ?? 0) + (l.wird?.bild?.bytes ?? 0);
        for (const s of sprites) b += s.bild?.bytes ?? 0;
        return b;
      },
      statistik,
      /** Bilder einzeln: [Art, Ebene, Breite × Höhe in Pixeln, Kacheln, MB] */
      liste() {
        const aus = [];
        for (const g of gruppen) for (const [k, e] of g.tex) for (const bild of e.teile ?? []) aus.push(['gruppe ' + k, g.ebene, bild.groesse.join('×'), bild.kacheln.length, +(bild.bytes / 1048576).toFixed(1)]);
        for (const l of linienT) if (l.aktuell?.bild) aus.push(['linie', l.ebene, l.aktuell.bild.groesse.join('×'), l.aktuell.bild.kacheln.length, +(l.aktuell.bild.bytes / 1048576).toFixed(1)]);
        return aus;
      },
    };
  };
  const gl = glBuehne();
  q('.hint span').textContent = t('geschichte.weitergehen', { touch: IS_TOUCH });
  // Arm mit der Lampe zeigt zum Polarstern (Grad; er steht an der Spitze des Wagens, scene.wagenOrte), so wie man beide
  // in der Einstellung sieht, in der Noa zu ihm hinauf leuchtet (Prolog 4 reach, schon beim Heben in lamp; Epilog 3
  // answer), mit der Parallaxe von Himmel und Hügel (Abnahme Ticket 11; vorher wie bei Zoom 1, und der Strahl lief auf
  // dem Desktop links am Polarstern vorbei). Noa steht in der Ebene p = 1, ihr Arm dreht um (440, 592).
  // In Epilog 3 im selben Winkel wie in Prolog 4 (Abnahme Ticket 13: dafür fährt die Kamera dort, scene.winkelKamera).
  const erhoben = (act) => {
    const shot = scene.folge?.find((s) => s.act === (act === 'lamp' ? 'reach' : act));
    if (!shot || !scene.wagenOrte) {
      const [x, y] = scene.wagenOrte?.[wagen.polarstern - 1] ?? [1120, 150];
      return Math.atan2(y + 20 - 592, x - 440) * 180 / Math.PI;
    }
    return scene.winkel(scene.ziel(shot)[0]);
  };
  const [FLUG_ZU, FLUG_WALD] = [2.4, 3.6]; // s: Dauer der Flüge der Glühwürmchen zur Lampe und in den Wald
  const ABSCHNITT_MARGE = 1.15; // so viel mehr als nötig darf eine Ebene im Ruhepunkt gerastert sein (abschnitteFuer)
  const HALTEN = 1e7; // ms (fast 3 h): so lange hält die Folge vor jeder Fahrt ihr Bild (folgeAnlegen; länger: haltWachen)
  const LINIEN_TOLERANZ = 1.1; // neu gerastert wird eine Linie erst, wenn ihre Strichbreite sonst um mehr als 10 % abwiche
  // ms nach dem Halt, bis die Pause ruhig ist (story.stillBild): Bis dahin rastert die Bühne Linien und die Texturen der
  // nächsten Fahrt (glBuehne, nachfuehren); so lang wie bis Ticket 19 (Wartezeit, gestaffelte Ebenen, Tausch der Linien)
  const RUHE_NACH_HALT = 1050;
  const ZEILE_AUS_MS = 600; // so lange blendet ein Satz der Bühne aus (CSS #story .scene .line; Rückfall in say)

  scene = {
    el, skip: q('.skip'), gl,
    tweens: [], running: false,
    uhr: { t0: performance.now(), s0: 0, tempo: 1 }, // Zeit der Bühne: läuft in echter Zeit, mal speed
    letzte: 0,          // Zeit der Bühne beim letzten Bild der JS-Schleife
    raf: 0, faellig: 0, // angefordertes Bild; frühestens dann zeichnet es wieder (höchstens 60 Hz)
    tweenZeit: 0,       // Zeitgeber zum nächsten Beginn oder Ende eines Tweens (tweenWecker)
    cam: { x: 800, y: 450, z: 1 },
    arm: 75, beamLen: 0, beamPower: 0, starBoost: 0,
    worms: 'idle', gatherAt: 0, carryAt: 0,
    klickAt: 0,         // Zeit der Bühne, zu der die Lampe klickt (act lamp; Überspringen davor: kein Strahl)
    moving: false,      // eine Kamerafahrt läuft (nur sie wird durch Tippen schneller)
    movedAt: 0,         // Beginn der Fahrt (Zeit der Bühne): ein Doppeltipp beschleunigt die nächste nicht gleich
    laufend: null,      // Fahrt der Kamera, die läuft oder zuletzt lief: { uhr }
    folge: null,        // die Einstellungen, die die Bühne zeigt (Prolog oder Epilog)
    folgeFuer: null,    // für diese Folge ist folgeUhr angelegt
    folgeUhr: null,     // Uhr der ganzen Folge (folgeAnlegen): eine Animation ohne Ziel, ms auf der Uhr
    folgeZeit: null,    // { start, zeiten, kameras, key } der Folge
    fahrtIndex: -1,     // Einstellung der Fahrt, die läuft oder zuletzt lief
    haltZeit: 0,        // Zeitgeber: der Halt bleibt unbegrenzt (haltWachen)
    wagenOrte: null,    // Orte der sieben Sterne des Wagens im Himmel, Massen der Szene (wagenLegen)

    /** Zeit der Bühne (s); setzen rückt die Spuren mit. */
    get time() { const u = this.uhr; return u.s0 + (performance.now() - u.t0) / 1000 * u.tempo; },
    /** Zeit der Bühne zum Zeitpunkt ms (performance.now, auch die Zeitachse des Dokuments) */
    zeitBei(ms) { const u = this.uhr; return u.s0 + (ms - u.t0) / 1000 * u.tempo; },
    set time(v) {
      for (const s of spuren) s.verschiebe(v - this.time);
      this.uhr = { t0: performance.now(), s0: v, tempo: this.uhr.tempo };
      this.letzte = v;
    },
    /** Tempo: Tippen (4) und Überspringen (60) beschleunigen Fahrt, Tweens und alles, was sich bewegt. */
    get speed() { return this.uhr.tempo; },
    set speed(v) {
      if (v === this.uhr.tempo) return;
      this.uhr = { t0: performance.now(), s0: this.time, tempo: v };
      if (this.tweenZeit) this.wecken(); // Ende der Tweens neu stellen (tweenWecker)
      // übersprungen vor dem Klick der Lampe: kein Strahl (wie der Tween in act; die Spur zeigte ihn sonst kurz)
      if (v >= 10 && this.time < this.klickAt) { kraft.zurueck(0); laenge.zurueck(0); }
      // die Uhr der Folge (anpassen legt sie beim Drehen mitten in einer Fahrt neu an) und die der Fahrt
      for (const a of [this.folgeUhr, this.laufend?.uhr]) a?.updatePlaybackRate(v);
    },
    /** Es läuft noch etwas, auf das man warten kann (Tween oder Fahrt). */
    get laeuft() { return this.tweens.length > 0 || this.moving; },

    portrait() { return innerWidth / innerHeight < 0.9; },
    /** Wo der Polarstern bei dieser Kamera im Bild steht (Anteil der Breite und Höhe), wie skala() rechnet. */
    starAt(c) { return this.wagenImBild(c)[wagen.polarstern - 1]; },
    /** Wo die sieben Sterne des Wagens (wagenOrte) bei der Kamera c im Bild stehen (Anteile von oben links). */
    wagenImBild(c) {
      const W = innerWidth, H = innerHeight, p = layers[0].p, s = this.skala(c, p);
      const x = 800 + (c.x - 800) * p, y = 450 + (c.y - 450) * p;
      return (this.wagenOrte ?? this.wagenLegen()).map(([ox, oy]) => [(ox - x) * s / W + 0.5, (oy - y) * s / H + 0.5]);
    },
    /** Kamera im ersten Bild des Epilogs (Beginn seiner ersten Fahrt; im Hochformat fromP) */
    epilogStart() {
      const f = STORY_EPILOG[0];
      return (this.portrait() && f.fromP) || f.from;
    },
    /**
     * Platz für den Wagen auf der Bühne (BUEHNENWAGEN.feld) als Anteile im ersten Bild des Epilogs { links, rechts,
     * oben, unten }: so, dass er in jedem Bild des Epilogs (Anfang und jede Einstellung) und in Prolog 4 ganz zu sehen
     * ist, rand vom Rand des Bilds und über dem höchsten Grat der fernen Berge und des Bergwalds, den man dort sieht.
     * Gerechnet in der Ebene des Himmels (dort steht der Wagen fest).
     */
    wagenFeld() {
      const W = innerWidth, H = innerHeight, rand = BUEHNENWAGEN.feld.rand * Math.min(W, H), p = layers[0].p;
      const mitte = (c, q) => [800 + (c.x - 800) * q, 450 + (c.y - 450) * q];
      const reach = STORY_PROLOG.find((s) => s.act === 'reach');
      const kameras = [this.epilogStart(), ...STORY_EPILOG.map((s) => this.ziel(s)[0]), this.ziel(reach)[0]];
      let x0 = -Infinity, x1 = Infinity, y0 = -Infinity, y1 = Infinity;
      for (const c of kameras) {
        const s = this.skala(c, p), [X, Y] = mitte(c, p);
        let grat = H; // höchster Grat im Bild (Bildpixel von oben)
        for (const [pts, q] of [[far, layers[1].p], [mid, layers[2].p]]) {
          const sq = this.skala(c, q), [Xq, Yq] = mitte(c, q);
          for (const [x, y] of pts) {
            const bx = W / 2 + (x - Xq) * sq;
            if (bx >= 0 && bx <= W) grat = Math.min(grat, H / 2 + (y - Yq) * sq);
          }
        }
        x0 = Math.max(x0, X + (rand - W / 2) / s);
        x1 = Math.min(x1, X + (W / 2 - rand) / s);
        y0 = Math.max(y0, Y + (rand - H / 2) / s);
        y1 = Math.min(y1, Y + (grat - rand - H / 2) / s);
      }
      const c = this.epilogStart(), s = this.skala(c, p), [X, Y] = mitte(c, p);
      return { links: (x0 - X) * s / W + 0.5, rechts: (x1 - X) * s / W + 0.5, oben: (y0 - Y) * s / H + 0.5,
        unten: (y1 - Y) * s / H + 0.5 };
    },
    /**
     * Den Wagen in den Himmel legen: dorthin, wo ihn das Finale am Ende zeigt (wagenLage, Anteile im ersten Bild des
     * Epilogs), in Massen der Szene in der Ebene des Himmels; ohne wagenLage dreimal so gross wie die Form um den
     * Polarstern von früher. Zurück die Orte (wagenOrte), je Bildschirm neu (folgeAnlegen).
     */
    wagenLegen() {
      const [px, py] = wagen.form[wagen.polarstern - 1];
      this.wagenOrte = wagenLage ? this.orteAus(wagenLage())
        : wagen.form.map(([fx, fy]) => [1120 + 3 * (fx - px), 150 + 3 * (fy - py)]);
      return this.wagenOrte;
    },
    /** Orte im Himmel (Massen der Szene) zu Anteilen lage im ersten Bild des Epilogs (wagenLage). */
    orteAus(lage) {
      const c = this.epilogStart(), p = layers[0].p, s = this.skala(c, p);
      const x = 800 + (c.x - 800) * p, y = 450 + (c.y - 450) * p;
      return lage.map(([fx, fy]) => [x + (fx - 0.5) * innerWidth / s, y + (fy - 0.5) * innerHeight / s]);
    },
    /**
     * Winkel (Grad im Bild, y nach unten: hinauf negativ), in dem Noa bei der Kamera c zum Polarstern leuchtet: vom
     * Drehpunkt ihres Arms (440, 592 in ihrer Ebene, p = 1) zum Polarstern an seinem Ort in orte (Massen der Szene im
     * Himmel), mit der Parallaxe von Himmel und Hügel (wie wagenImBild).
     */
    winkel(c, orte = this.wagenOrte ?? this.wagenLegen()) {
      const p = layers[0].p, s0 = this.skala(c, p), s1 = this.skala(c, 1), [ox, oy] = orte[wagen.polarstern - 1];
      const dx = (ox - 800 - (c.x - 800) * p) * s0 - (440 - c.x) * s1;
      const dy = (oy - 450 - (c.y - 450) * p) * s0 - (592 - c.y) * s1;
      return Math.atan2(dy, dx) * 180 / Math.PI;
    },
    /**
     * Kamera c der Einstellung shot mit winkelWie (Epilog 3; Abnahme Ticket 13): Noa leuchtet darin im selben Winkel
     * zum Polarstern wie in der Einstellung winkelWie des Prologs (Prolog 4), in jedem Format. Höhe und Zoom bleiben,
     * waagrecht fährt die Kamera dorthin, wo der Polarstern in diesem Winkel über Noa steht (Noa zieht schneller durchs
     * Bild als der ferne Himmel; der Abstand im Bild hängt linear an c.x). Der Wagen liegt, wo ihn das Finale am Ende
     * zeigt (wagenLage), und das hängt über wagenFeld ein wenig auch an dieser Kamera: darum in ein paar Schritten;
     * solange gerechnet wird, gibt ziel den letzten Schritt (wagenFeld fragt danach). Je Bildschirm einmal.
     */
    winkelKamera(shot, c) {
      const key = `${innerWidth}×${innerHeight}×${camera.aspect}`, m = this._winkel;
      if (m?.shot === shot && m.key === key) return m.c;
      const w = this._winkel = { shot, key, c: { ...c } };
      if (!wagenLage) return w.c;
      const vorbild = STORY_PROLOG.find((s) => s.act === shot.winkelWie), p = layers[0].p;
      for (let schritt = 0; schritt < 6; schritt++) {
        const orte = this.orteAus(wagenLage()), soll = this.winkel(this.ziel(vorbild)[0], orte) * Math.PI / 180;
        const s0 = this.skala(w.c, p), s1 = this.skala(w.c, 1), [ox, oy] = orte[wagen.polarstern - 1];
        const dy = (oy - 450 - (w.c.y - 450) * p) * s0 - (592 - w.c.y) * s1;
        // dx = (ox - 800 - (x - 800) p) s0 - (440 - x) s1 soll dy / tan(soll) sein, nach x aufgelöst
        const x = (dy / Math.tan(soll) - (ox - 800 + 800 * p) * s0 + 440 * s1) / (s1 - p * s0);
        const fertig = Math.abs(x - w.c.x) < 0.01;
        w.c = { ...w.c, x };
        if (fertig) break;
      }
      return w.c;
    },
    /**
     * Was der Wagen der Bühne zur Zeit t zeigt (BUEHNENWAGEN; glBuehne zeichnet es): hell und punkt (Durchmesser in
     * CSS-Pixeln) der Sterne 1 … 6, linie: Helligkeit der Linien. Im Epilog wach wie am Himmel der Welten, sonst
     * schlafend; die Linien aus der Spur wagenLinien, im Epilog atmend, sobald sie nachglimmen.
     */
    wagenBei(t) {
      const B = BUEHNENWAGEN, N = B.nachglimmen, H = HIMMELSWAGEN;
      const wach = this.folge === STORY_EPILOG, v = wagenLinien.wert(t), von = H.linie.hell[0];
      const ruhig = wach ? THREE.MathUtils.clamp((von - v) / Math.max(1e-6, von - N.glimmen), 0, 1) : 0;
      return { hell: wach ? H.wach.hell[0] : B.schlaf.hell,
        punkt: wach ? H.wach.punkt[0] : B.schlaf.punkt,
        linie: v * (1 + N.tiefe * ruhig * Math.sin(2 * Math.PI * t / N.periode)) };
    },
    /** Pixel je Mass der Szene in der Ebene p bei der Kamera c (Hochformat: weiter weg; wie preserveAspectRatio slice). */
    skala(c, p) {
      const W = innerWidth, H = innerHeight, fit = Math.min(1, 900 * W / H / 820);
      return (1 + (c.z - 1) * p) * fit * Math.max(W / 1600, H / 900);
    },
    /** Ziel einer Einstellung (im Hochformat camP; mit winkelWie gerechnet, winkelKamera) und Dauer ihrer Fahrt (s). */
    ziel(shot) {
      const seconds = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : shot.move;
      const c = (this.portrait() && shot.camP) || shot.cam;
      return [shot.winkelWie ? this.winkelKamera(shot, c) : c, seconds];
    },
    /**
     * Die ganze Folge (Prolog oder Epilog) auf einer Uhr (folgeUhr, eine Animation ohne Ziel auf der Zeitachse des
     * Dokuments, mit dem Tempo der Bühne): vor jeder Fahrt ein Halt (HALTEN lang, die Kamera steht), dann die Fahrt
     * (storyEase, Zoom geometrisch); die Kamera rechnet glBuehne je Bild aus der Uhr (kameraBei). moveTo springt an den
     * Beginn der nächsten Fahrt (currentTime). zeiten[i]: Beginn der Fahrt zur Einstellung i (ms auf der Uhr),
     * kameras[i]: ihr Ziel.
     */
    folgeAnlegen() {
      this.folgeUhr?.cancel();
      const shots = this.folge, hoch = this.portrait();
      let c = { ...((hoch && shots[0].fromP) || shots[0].from || shots[0].cam) };
      const stuecke = [], zeiten = [], kameras = [];
      let t = HALTEN;
      for (const shot of shots) {
        const [to, seconds] = this.ziel(shot), d = seconds * 1000;
        stuecke.push({ from: c, to, t, d });
        zeiten.push(t);
        kameras.push(to);
        t += d + HALTEN;
        c = to;
      }
      this.folgeZeit = { start: { ...stuecke[0].from }, zeiten, kameras, stuecke, ende: t, key: this.folgeKey() };
      this.abschnitte = layers.map(({ p }) => this.abschnitteFuer(p, stuecke));
      this.folgeUhr = new Animation(new KeyframeEffect(null, null, { duration: t, fill: 'both' }), document.timeline);
      this.folgeUhr.play();
      this.folgeUhr.updatePlaybackRate(this.speed);
      this.wagenLegen(); // je Bildschirm (wie das Finale ihn am Ende zeigt)
      gl.neuePlan();
    },
    /**
     * Der Halt ist unbegrenzt: Die Folge hält je Ruhepunkt HALTEN lang; steht die Bühne länger (Tab über Nacht), springt
     * ihre Uhr alle HALTEN / 3 zurück an den Anfang des Halts ab (ms auf der Uhr).
     */
    haltWachen(ab) {
      clearTimeout(this.haltZeit);
      this.haltZeit = setTimeout(() => {
        if (this.moving) return;
        if (this.folgeUhr && this.folgeUhr.currentTime > ab) this.folgeUhr.currentTime = ab;
        this.haltWachen(ab);
      }, HALTEN / 3);
    },
    /**
     * Abschnitte der Folge für die Ebene p (Fahrten [von, bis]): Eine Textur der Ebene (glBuehne) hält die grösste
     * Skalierung ihrer Fahrten, und so ist sie auch im Ruhepunkt davor so fein gerastert (Speicher der Grafik: eine
     * Textur für die ganze Folge hielte jede nahe Ebene im ganzen Prolog in Zoom 2,2, Review Ticket 16).
     * Ein Abschnitt wächst, solange an keinem seiner Ruhepunkte mehr als ABSCHNITT_MARGE × die Skalierung gerastert wird,
     * die dort ohnehin nötig ist (Ruhepunkt oder nächste Fahrt). Ferne Ebenen bleiben so in einem Abschnitt; die nahen
     * wechseln nur an Ruhepunkten mit grossem Zoomwechsel (Prolog: nach Fahrt 1, 3 und 4, nicht in der Noa-Szene 2).
     */
    abschnitteFuer(p, stuecke) {
      const s = (c) => this.skala(c, p), noetig = stuecke.map(({ from, to }) => Math.max(s(from), s(to)));
      // Ruhepunkt k (nach Fahrt k; −1: Anfang): was dort ohnehin gerastert ist, mal Marge
      const erlaubt = (k) => ABSCHNITT_MARGE * Math.max(s(k < 0 ? stuecke[0].from : stuecke[k].to), noetig[k + 1] ?? 0);
      const abschnitte = [];
      for (let a = 0; a < stuecke.length;) {
        let b = a, max = noetig[a];
        while (b + 1 < stuecke.length) {
          const m = Math.max(max, noetig[b + 1]);
          let passt = true;
          for (let k = a - 1; k <= b + 1; k++) if (m > erlaubt(k)) passt = false;
          if (!passt) break;
          b++;
          max = m;
        }
        abschnitte.push([a, b]);
        a = b + 1;
      }
      return abschnitte;
    },
    /** Kennung der Folge (Bildschirm, Hochformat, reduzierte Bewegung) */
    folgeKey() {
      return JSON.stringify([innerWidth, innerHeight, matchMedia('(prefers-reduced-motion: reduce)').matches]);
    },
    /** Die Uhr der Folge steht am Anfang (im Halt vor der ersten Fahrt); neu angelegt nur, wenn nötig. */
    folgeStart(folge) {
      if (folge) this.folge = folge;
      if (!this.folge) return;
      if (folge && folge !== this.folgeFuer || this.folgeZeit?.key !== this.folgeKey() || !this.folgeUhr) {
        this.folgeFuer = this.folge;
        this.folgeAnlegen();
      }
      this.folgeUhr.currentTime = 0;
      this.folgeUhr.play();
      this.haltWachen(0);
    },
    /** ms nach dem Halt, bis die Pause ruhig ist (story.stillBild; RUHE_NACH_HALT) */
    ruheNachHalt: RUHE_NACH_HALT,
    /** Bildschirm gedreht oder anders gross: Folge und Kamera neu rechnen (gleiche Zeit, gleicher Weg). */
    anpassen() {
      const alt = this.folgeUhr;
      if (!alt) return;
      const zeit = alt.currentTime, lief = alt.playState === 'running';
      this.folgeAnlegen();
      // die Kamera steht im Ziel der letzten fertigen Fahrt (in einer Fahrt: in dem davor)
      const { kameras, start } = this.folgeZeit, i = this.moving ? this.fahrtIndex - 1 : this.fahrtIndex;
      this.cam = { ...(i >= 0 ? kameras[i] : start) };
      this.folgeUhr.currentTime = zeit;
      if (!lief) this.folgeUhr.pause();
    },
    /** Auf den Anfang der Einstellung shot stellen; folge: die Einstellungen, die kommen (Prolog oder Epilog). */
    reset(shot, folge = null) {
      this.tweens = [];
      this.speed = 1;
      this.moving = false;
      this.fahrtIndex = -1;
      this.laufend?.uhr.cancel();
      this.laufend = null;
      this.arm = 75;
      this.beamLen = this.beamPower = this.starBoost = 0;
      armSpur.zurueck(75);
      for (const s of [kraft, laenge, stern, wagenLinien]) s.zurueck(0);
      this.worms = 'idle';
      this.cam = { ...((this.portrait() && shot.fromP) || shot.from || shot.cam) };
      this.folgeStart(folge);
      if (this.folge === STORY_EPILOG) { // die Linien des Wagens kommen hell aus dem Finale und glimmen nach
        const N = BUEHNENWAGEN.nachglimmen, von = HIMMELSWAGEN.linie.hell[0], t0 = this.time + N.halten;
        wagenLinien.zurueck(von);
        wagenLinien.dazu(t0, N.abklingen, (x, u) => von + (N.glimmen - von) * smooth01(u / N.abklingen));
      }
      this.say('');
      this.kicker('');
      q('.sub').classList.remove('angebot', 'sofort');
      this.hint(false);
      this.actions([]);
    },
    /**
     * Unsichtbar vorwärmen für die erste Einstellung shot der folge: die Folge anlegen und alles zeichnen, dazu die
     * Klasse prewarm (fast durchsichtig, aber gezeichnet). playScene nimmt sie weg, ruhen ebenso.
     */
    vorwaermen(shot, folge = null) {
      this.reset(shot, folge);
      el.classList.add('prewarm');
    },
    /** Ausgeblendet: keine Schleife (nichts kostet mehr). */
    ruhen() {
      el.classList.remove('prewarm');
      if (this.running) return;
      gl.stop();
      clearTimeout(this.haltZeit);
      // die Folge weg (ausser in einer Fahrt: die läuft zu Ende), die Texturen frei; die nächste Folge legt reset wieder an
      if (!this.moving && this.folgeUhr) {
        this.folgeUhr.cancel();
        this.folgeUhr = null;
        this.folgeFuer = null;
        this.laufend?.uhr.cancel();
        this.laufend = null;
        gl.freigeben(); // ausgeblendet: Texturen frei, die nächste Folge plant neu (folgeAnlegen)
      }
    },
    /** Einblenden und die Szene laufen lassen. */
    show() {
      el.classList.remove('lit');
      if (!this.running) {
        this.running = true;
        this.folgeUhr?.play();
        this.time = this.time; // die Tweens holen die Zeit des Ruhens nicht nach (letzte)
        this.wecken();
      }
      gl.start();
      void el.offsetWidth;
      el.classList.add('lit');
    },
    /**
     * Für Vergleichsbilder (tests/buehne-messung.mjs): Die Bühne steht in der Zeit t (s), auch Funkeln und Flackern, und
     * zeigt dieses eine Bild; auftauen lässt sie von dort weiterlaufen.
     */
    einfrieren(t) {
      this.running = false;
      this.time = this.gefroren = t;
      this.folgeUhr?.pause();
      gl.einfrieren(performance.now());
      gl.zeichnen();
    },
    auftauen() {
      gl.einfrieren(null);
      this.time = this.gefroren;
      this.running = true;
      this.folgeUhr?.play();
      gl.start();
      this.wecken();
    },
    /** Ausblenden (CSS 1,6 s), danach anhalten (ausser sie zeigt sich inzwischen wieder: «Zum Menü» und gleich neu). */
    async hide() {
      el.classList.remove('lit');
      await storySleep(1600);
      if (!el.classList.contains('lit')) { this.running = false; this.ruhen(); }
    },
    tween(seconds, fn, ease = storyEase, delay = 0) {
      const p = new Promise((resolve) => this.tweens.push({ t: -delay, s: Math.max(seconds, 1e-6), fn, ease, resolve }));
      this.wecken();
      return p;
    },
    /**
     * Kamerafahrt zur Einstellung shot (der Folge; im Hochformat camP): Die Uhr der Folge springt an den Beginn der Fahrt
     * und läuft mit speed. Wann sie fertig ist, sagt eine Animation ohne Ziel (uhr, mit Tempo). Danach hält die Folge das
     * Ziel (Halt).
     */
    moveTo(shot) {
      if (this.speed < 10) this.speed = 1; // nach dem Beschleunigen wieder normal (ausser beim Überspringen)
      clearTimeout(this.haltZeit);
      const i = this.folge?.indexOf(shot) ?? -1;
      if (i < 0) throw new Error('moveTo: Einstellung nicht in der Folge');
      if (this.folgeZeit?.key !== this.folgeKey()) this.anpassen();
      const { zeiten } = this.folgeZeit, [, seconds] = this.ziel(shot);
      const f = { uhr: new Animation(new KeyframeEffect(null, null, { duration: seconds * 1000 }), document.timeline) };
      this.moving = true;
      this.fahrtIndex = i;
      this.movedAt = this.time;
      const a = this.folgeUhr;
      a.currentTime = zeiten[i];
      a.play();
      a.updatePlaybackRate(this.speed);
      f.uhr.play();
      f.uhr.updatePlaybackRate(this.speed);
      this.laufend?.uhr.cancel();
      this.laufend = f;
      return new Promise((resolve) => f.uhr.finished.then(() => {
        if (this.laufend !== f) return; // abgebrochen (reset): wie früher ein Tween, der nie fertig wird
        this.cam = { ...this.folgeZeit.kameras[i] }; // (nach einer Drehung in der Fahrt die neue)
        this.moving = false;
        if (!this.running) { this.ruhen(); resolve(); return; } // in der Fahrt ausgeblendet: jetzt ganz ruhen (Folge weg)
        if (this.speed < 10) this.speed = 1; // sonst liefen Rauch, Glühwürmchen und Schal beim Warten weiter im Zeitraffer
        this.haltWachen(zeiten[i] + seconds * 1000); // die Folge hält das Ziel weiter (Halt)
        resolve();
      }, () => {}));
    },
    /**
     * Im Ruhepunkt vor der Einstellung mit act name vorbereiten: Vor answer und lamp hat der Strahl schon seine Länge,
     * noch aus (Kraft 0; act und reset setzen die Kraft über die Spur). Seine Shader übersetzt glBuehne beim Anlegen.
     */
    vorbereiten(name) {
      if ((name === 'answer' || name === 'lamp') && kraft.wert(this.time) === 0) {
        const l = name === 'lamp' ? 0.3 : 0.55;
        this.beamLen = l;
        laenge.zurueck(l);
      }
    },
    /** Was in einer Einstellung geschieht. */
    act(name) {
      // was sich bewegt, rechnet der Tween (Stand für die Logik) und zeigt die Spur (je Bild gezeichnet, glBuehne)
      const t = this.time, eben = (t0, d, ease) => (x) => ease(Math.min(1, Math.max(0, (x - t0) / d)));
      const hoch = erhoben(name);
      if (name === 'lamp') { // Arm hoch, Klick, der Strahl wächst zum Himmel
        this.tween(1.1, (k) => { this.arm = 75 + (hoch - 75) * k; }, storyEase, 0.4).then(() => {
          if (this.speed >= 10) { kraft.zurueck(0); laenge.zurueck(0); return; } // übersprungen: kein Klick über dem Ausblenden
          audio.rotate();
          this.beamPower = 1;
          this.tween(1.8, (k) => { this.beamLen = 0.3 * k; }, (k) => 1 - (1 - k) ** 3); // nah: nur ein Stück, sonst reicht er bis zum Stern
        });
        const e = eben(t + 0.4, 1.1, storyEase);
        armSpur.dazu(t + 0.4, 1.1, (x) => 75 + (hoch - 75) * e(x));
        this.klickAt = t + 1.5;
        kraft.dazu(t + 1.5, 0, () => 1);
        const w = eben(t + 1.5, 1.8, (k) => 1 - (1 - k) ** 3);
        laenge.dazu(t + 1.5, 1.8, (x) => 0.3 * w(x));
      } else if (name === 'reach') { // beim Blick nach oben streckt sich der Strahl und verblasst vor den Sternen
        const from = this.beamLen;
        this.tween(3.5, (k) => { this.beamLen = from + (1 - from) * k; }, storyEase, 0.3);
        const von = laenge.wert(t), e = eben(t + 0.3, 3.5, storyEase);
        laenge.dazu(t + 0.3, 3.5, (x) => von + (1 - von) * e(x));
        // … und die Linien des Wagens zeichnen sich einmal für einen Atemzug ab (BUEHNENWAGEN.andeutung)
        const A = BUEHNENWAGEN.andeutung;
        wagenLinien.dazu(t + A.ab, A.auf + A.aus, (x, u) => A.hell * (u < A.auf ? smooth01(u / A.auf)
          : 1 - smooth01((u - A.auf) / A.aus)));
      } else if (name === 'gather') { // Glühwürmchen fliegen zur Lampe und umkreisen sie
        this.worms = 'gather';
        this.gatherAt = this.time + 0.6;
        for (let i = 0; i < 5; i++) audio.hit(2, 0.9 + i * 0.32, { octave: 2, gain: 0.018 });
      } else if (name === 'carry') { // … und tragen das Licht in den Wald, die Lampe wird schwächer
        this.worms = 'carry';
        this.carryAt = this.time + 0.3;
        this.tween(3.2, (k) => { this.beamPower = 1 - 0.75 * k; }, storyEase, 0.5);
        const e = eben(t + 0.5, 3.2, storyEase);
        kraft.dazu(t + 0.5, 3.2, (x) => 1 - 0.75 * e(x));
      } else if (name === 'blink') { // Epilog: der Polarstern blinkt dreimal
        for (let i = 0; i < 3; i++) {
          this.tween(0.9, (k) => { this.starBoost = Math.sin(Math.PI * k); }, storyLinear, 1.4 + i * 1.1);
          audio.hit(7, 1.6 + i * 1.1, { octave: 2, gain: 0.05 });
          const e = eben(t + 1.4 + i * 1.1, 0.9, storyLinear);
          stern.dazu(t + 1.4 + i * 1.1, 0.9, (x) => Math.sin(Math.PI * e(x)));
        }
      } else if (name === 'answer') { // Noa hebt die Lampe und blinkt dreimal zurück
        this.beamLen = 0.55;
        laenge.zurueck(0.55);
        this.tween(1.0, (k) => { this.arm = 75 + (hoch - 75) * k; }, storyEase, 0.3);
        const e = eben(t + 0.3, 1.0, storyEase);
        armSpur.dazu(t + 0.3, 1.0, (x) => 75 + (hoch - 75) * e(x));
        for (let i = 0; i < 3; i++) {
          this.tween(0.8, (k) => { this.beamPower = Math.sin(Math.PI * k); }, storyLinear, 1.6 + i * 1.0);
          audio.hit(7, 1.8 + i * 1.0, { gain: 0.03 });
          const b = eben(t + 1.6 + i, 0.8, storyLinear);
          kraft.dazu(t + 1.6 + i, 0.8, (x) => Math.sin(Math.PI * b(x)));
        }
      }
    },
    /**
     * Untertitel: der alte blendet aus, der neue danach ein (CSS .line.on). umbau: ändert, was um den Satz steht
     * (Angebot: «Im Dorf» und die Knöpfe; Epilog: Platz für «Zum Menü»), und läuft erst, wenn der alte Satz ganz
     * ausgeblendet ist; dann kommt der neue mit allem gleich (sofort). So steht jeder Satz von Anfang an dort, wo er
     * bleibt, und keiner rückt, solange man ihn sieht (Abnahme Ticket 12: Die Bühne ist unten bündig, Knöpfe darunter
     * schoben den Satz hinauf). Zurück dann: erfüllt nach dem Umbau.
     */
    say(text, { umbau = null } = {}) {
      this.umbauLos?.(false);
      const [a, b] = lines, cur = a.classList.contains('on') ? a : b, next = cur === a ? b : a;
      const sichtbar = cur.classList.contains('on') && cur.textContent;
      cur.classList.remove('on');
      if (text && next.textContent !== text) next.textContent = text; // schon gesetzt und gerastert (vorSagen)
      if (!umbau) { if (text) next.classList.add('on'); return; }
      return new Promise((fertig) => {
        // ja: umbauen und den Satz zeigen; nein (reset oder ein neuer Satz davor): nichts mehr
        const los = this.umbauLos = (ja = true) => {
          if (this.umbauLos !== los) return;
          clearTimeout(this.umbauZeit);
          this.umbauLos = null;
          if (ja) {
            umbau();
            q('.sub').classList.add('sofort');
            if (text) next.classList.add('on');
          }
          fertig();
        };
        if (!sichtbar) { los(); return; }
        // erst am Ende seines Ausblendens (Review Ticket 12): Nach einer festen Zeit ab hier rückte er noch, wenn das
        // nächste Bild spät kam (Rechner beschäftigt; 200–400 ms später schob der Umbau den halb sichtbaren Satz
        // 34–42 px). Rückfall nach der vierfachen Zeit (im verborgenen Tab ruhen die Transitionen)
        void getComputedStyle(cur).opacity; // die Transition jetzt anlegen
        const aus = cur.getAnimations?.().filter((an) => an.transitionProperty === 'opacity') ?? [];
        Promise.all(aus.map((an) => an.finished)).then(() => los(), () => los());
        this.umbauZeit = setTimeout(los, 4 * ZEILE_AUS_MS);
      });
    },
    /**
     * Den nächsten Satz schon im Ruhepunkt in die verborgene Zeile setzen: Chrome rastert ihn dann jetzt und nicht beim
     * Tippen, wo er mit dem Beginn der Fahrt ein bis zwei Bilder kostete (Ticket 20). say nimmt ihn so, wie er steht.
     */
    vorSagen(text) {
      const next = lines.find((l) => !l.classList.contains('on'));
      if (text && next && next.textContent !== text) next.textContent = text;
    },
    hint(on) { q('.hint').classList.toggle('on', on); },
    /** Zeile über dem Untertitel (Angebot nach dem Prolog: «Im Dorf»); leer: blendet aus. */
    kicker(text) {
      const k = q('.sub .kicker');
      if (text) { k.textContent = text; q('.sub').classList.add('angebot'); } // Gestalt des Angebots (CSS), bis reset
      k.classList.toggle('on', !!text);
    },
    /** Knöpfe unter dem Untertitel ([Beschriftung, Aktion]); angebot: blenden mit dem Satz ein (CSS). */
    actions(list, { angebot = false } = {}) {
      const box = q('.actions');
      box.classList.toggle('angebot', angebot);
      box.replaceChildren();
      if (!list.length) { box.classList.remove('platz'); box.style.minHeight = ''; }
      for (const [label, fn] of list) {
        const b = document.createElement('button');
        b.textContent = label;
        b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
        box.append(b);
      }
    },
    /**
     * Platz für die Knöpfe list schon jetzt, ohne sie (Epilog: «Zum Menü» kommt erst nach der Fahrt, der letzte Satz
     * steht aber schon dort, wo er dann bleibt; Abnahme Ticket 12): so hoch wie mit ihnen, bis actions sie bringt.
     */
    platzFuer(list) {
      const box = q('.actions');
      this.actions(list);
      box.style.minHeight = `${box.offsetHeight}px`;
      box.classList.add('platz');
      box.replaceChildren();
    },

    /**
     * Die JS-Schleife der Tweens anstossen, solange die Bühne läuft. Wartet sie auf das nächste Ende eines Tweens
     * (tweenZeit), läuft sie gleich weiter (ein neuer Tween endet vielleicht früher).
     */
    wecken() {
      if (!this.running) return;
      if (this.tweenZeit) { clearTimeout(this.tweenZeit); this.tweenZeit = 0; this.raf = requestAnimationFrame((t) => this.frame(t)); return; }
      if (this.raf) return;
      this.letzte = this.time;
      this.raf = requestAnimationFrame((t) => this.frame(t));
    },
    /**
     * Tweens rechnen nur den Stand für die Logik (zu sehen sind die Spuren): Statt jedes Bild (rAF hielt den Hauptthread
     * in den Fahrten 3, 4 und 6 jedes Bild wach, Ticket 18) weckt ein Zeitgeber zum nächsten Beginn oder Ende eines Tweens.
     */
    tweenWecker() {
      clearTimeout(this.tweenZeit);
      const naechst = Math.min(...this.tweens.map((tw) => (tw.t < 0 ? -tw.t : tw.s - tw.t)));
      this.tweenZeit = setTimeout(() => { this.tweenZeit = 0; this.frame(performance.now()); },
        Math.max(1, naechst / this.speed * 1000 + 1));
    },
    frame(now) {
      this.raf = 0;
      if (!this.running) return;
      if (now < this.faellig - 2) { this.raf = requestAnimationFrame((t) => this.frame(t)); return; } // höchstens 60 Hz
      // nicht weiter als ein Bild voraus: Sonst liefe die Frist bei Bildschirmen knapp über 60 Hz davon und liesse
      // alle paar Sekunden ein Bild aus
      this.faellig = Math.min(Math.max(this.faellig + 1000 / 60, now), now + 1000 / 60 + 1);
      const t = this.time, dt = Math.max(0, t - this.letzte);
      this.letzte = t;
      for (const tw of this.tweens.slice()) {
        tw.t += dt;
        if (tw.t < 0) continue;
        const k = Math.min(1, tw.t / tw.s);
        tw.fn(tw.ease(k));
        if (k >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.resolve(); }
      }
      if (this.tweens.length) this.tweenWecker();
    },
    /**
     * Wo ein Glühwürmchen zur Zeit t ist (x, y, Grösse s; tx, ty: Spitze der Lampe), samt Schwingen: zur Lampe (gather,
     * Anteil g), von dort in den Wald (carry, k), unterwegs im Bogen nach oben.
     */
    wurmOrt(w, t, tx, ty) {
      const g = smooth01((t - this.gatherAt - w.delay) / FLUG_ZU);
      const k = this.worms === 'carry' ? smooth01((t - this.carryAt - w.delay * 0.7) / FLUG_WALD) : 0;
      let x = w.hx + Math.sin(t * w.a + w.ph) * 16, y = w.hy + Math.cos(t * w.b + w.ph) * 9;
      const ang = t * w.spin + w.ph;
      x += (tx + Math.cos(ang) * w.ox - x) * g;
      y += (ty + Math.sin(ang) * w.oy - y) * g - Math.sin(Math.PI * g) * 50;
      if (this.worms === 'carry') {
        x += (w.dx + Math.sin(t * w.a) * 8 - x) * k;
        y += (w.dy + Math.cos(t * w.b) * 6 - y) * k - Math.sin(Math.PI * k) * 70;
      }
      return [x, y, this.worms === 'idle' ? 1 : 1 + 0.6 * g];
    },
  };
  addEventListener('resize', () => scene.anpassen());
  return scene;
}

export { createStoryScene };
