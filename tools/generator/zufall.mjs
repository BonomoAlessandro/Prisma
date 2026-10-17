// Deterministischer Zufall für den Generator: gleicher Seed, gleiche Folge, also gleiches Level. Übernommen aus
// tools/generate.mjs (rng, mulberry32), damit der neue Generator nicht vom alten abhängt, der in Ticket 21 wegfällt.

/** Zufall aus einem Seed (ganze Zahl): next() in [0, 1), int(a, b) von a bis b, pick, chance, shuffle, gewichtet. */
export function zufall(seed) {
  let s = seed >>> 0;
  const next = () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    /** Fisher-Yates, unabhängig von der Sortierung der JS-Engine. */
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    /** Ein Schlüssel aus { Schlüssel: Gewicht } nach Gewicht (Gewicht 0: nie); null, wenn keiner ein Gewicht hat. */
    gewichtet: (gewichte) => {
      const paare = Object.entries(gewichte).filter(([, g]) => g > 0);
      let x = next() * paare.reduce((sum, [, g]) => sum + g, 0);
      for (const [k, g] of paare) if ((x -= g) < 0) return k;
      return paare.length ? paare.at(-1)[0] : null;
    },
  };
}
