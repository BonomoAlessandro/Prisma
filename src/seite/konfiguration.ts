// Konfiguration der Seite (Ticket 04 von .scratch/umbau/, bis dahin das erste Skript in index.html): Fassung,
// Gerät, Schalter der Adresse (?t=, ?spiegel=), Qualität, Masse des Bretts und Look.
import { mulberry32 } from '../zufall.js';
import { alsGlobal } from './testschnittstelle.ts';
import '../logik.js'; // die Spiellogik im ersten Teil laden, wie bis Ticket 04 (vor der Darstellung)

/* =====================================================================
   KONFIGURATION
   ===================================================================== */

// Fassung, die gerade läuft (Leistungsanzeige, Taste F, Spec .scratch/leistung/): Datum und
// Ticketstand, bei jedem Stand für einen Handy-Durchlauf nachgeführt. Die einzige Quelle ist appVersion in package.json;
// vite.config.mjs setzt sie hier und in sw.js ein (npm run dev und npm run build). Weil sich sw.js damit ändert, holt
// der Browser beim nächsten Besuch einen neuen Service Worker samt Speicher.
const APP_VERSION = '__APP_VERSION__';

const IS_MOBILE = matchMedia('(pointer: coarse)').matches || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// ?t=12: Zeit der Animationen anhalten, Zufall fest (Vergleichsbilder: zwei Aufnahmen fallen gleich aus). Überblenden
// und Einblenden laufen weiter, sie zählen dt.
const FIXED_TIME = (() => {
  const v = new URLSearchParams(location.search).get('t');
  return v !== null && Number.isFinite(+v) ? +v : null;
})();
if (FIXED_TIME !== null) Math.random = mulberry32(1);
// Phasen, mit denen Ziele und Filter atmen und Lichtblitze flackern: mit ?t= aus einer eigenen festen Folge
// (Bildvergleich, Ticket 01 von .scratch/umbau/). Aus Math.random hingen sie davon ab, wie viel Laden und three (UUIDs)
// davor gezogen hatten, und das hängt vom Zeitpunkt ab. Ohne ?t= wie bisher Math.random.
const phasenZufall = FIXED_TIME !== null ? mulberry32(2) : () => Math.random();

// ?spiegel=alle (Ticket 04 der Energie): Das Brett spiegelt in allen Welten wie bis energie-3 (spiegelHimmel, QUALITY)
const SPIEGEL_ALLE = new URLSearchParams(location.search).get('spiegel') === 'alle';

// Feste Qualität (früher Stufe "Niedrig"): höhere Stufen kosteten auf Laptops sehr viele FPS,
// ohne sichtbar besser auszusehen. pixelRatio ist die Obergrenze; adaptiveResolution regelt darunter.
// Smartphones haben 2–3 Bildpunkte pro CSS-Pixel und kleine Schirme: mit nur 1 wirkte dort alles verpixelt.
// Bis 2 rendern (3 kostete mehr als das Doppelte, ohne sichtbar besser zu sein); auf dem Desktop bleibt es bei 1.
const QUALITY = {
  pixelRatio: Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 2 : 1),
  msaa: 0,                // Hauptbild ohne MSAA
  // Spiegeltextur des Bretts, Anteil am Drawing-Buffer und Kantenglättung: Seit Ticket 04 der Energie spiegelt das Brett
  // nur in den Welten im All (spiegelHimmel, ADR 0010), dort klein und ohne MSAA (Handy mit Pixeldichte 2: 0,25 ≈ halbe
  // CSS-Auflösung). ?spiegel=alle: in allen Welten und so gross wie bis energie-3 (Handy 0,35 mit MSAA 2, Desktop 0,3
  // mit MSAA 4), zum Vergleichen
  reflectionMsaa: SPIEGEL_ALLE ? (IS_MOBILE ? 2 : 4) : 0,
  reflectionScale: SPIEGEL_ALLE ? (IS_MOBILE ? 0.35 : 0.3) : (IS_MOBILE ? 0.25 : 0.22),
  shadowSize: IS_MOBILE ? 1024 : 2048,
  textureSize: 1024,
  reflections: true,
  // Pinsel über gemalten Ebenen der Skyboxen (createBrushPass; je Skybox brush, auf dem Handy dort mobile): Desktop in
  // voller Auflösung (RTX A2000, 1440 × 900: bis 0,8 ms), Handy je 2 × 2 Pixel und vergrössert; null aus
  brush: IS_MOBILE ? { step: 2, full: false } : { step: 1, full: true },
};

const GRID = 7;            // Spielfeld 7×7
const CELL = 1.2;          // Weltgrösse einer Zelle
const BOARD = GRID * CELL; // Kantenlänge des Spielfelds
const PLATE = BOARD + 1.4; // Brett inkl. Rand (Umriss, siehe BOARD_TYPES)
const PLATE_RIM = (PLATE - BOARD) / 2; // Plattenrand ausserhalb des Spielfelds
const PLATE_THICK = 0.38;

const LOOK = {
  exposure: 1.0,
  bloomStrength: 0.72,
  bloomRadius: 0.55,
  bloomThreshold: 1.0,     // HDR: nur Werte > 1 blühen (Strahlen, Leuchtkörper)
  vignette: 0.55,
  aberration: 0.0035,
  grain: 0.012,
  fogColor: 0x05040b,
  fogDensity: 0.016,
};

// Hex-Farben als sRGB interpretieren und korrekt nach linear wandeln.
THREE.ColorManagement.legacyMode = false;

// Testschnittstelle: Diese Namen lesen Proben als globale Namen (src/seite/testschnittstelle.ts)
alsGlobal({
  CELL: () => CELL, GRID: () => GRID, IS_MOBILE: () => IS_MOBILE, PLATE: () => PLATE, QUALITY: () => QUALITY,
});

export {
  APP_VERSION, BOARD, CELL, FIXED_TIME, GRID, IS_MOBILE, LOOK, phasenZufall, PLATE, PLATE_RIM, PLATE_THICK, QUALITY,
  SPIEGEL_ALLE,
};
