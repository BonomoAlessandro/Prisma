// Deterministischer Zufall (Ticket 03 von .scratch/umbau/): mulberry32(seed) liefert eine Funktion, die bei jedem
// Aufruf die nächste Zahl der Folge aus seed gibt, in [0, 1). Die Seite setzt das Modul an seiner Stelle in ihr erstes
// Skript ein (Marke «MODUL src/zufall.js», tools/seitenmodule.mjs: dort ist mulberry32 global wie bisher), der Hall
// importiert es (src/hall.js).
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export {
  mulberry32,
};
