// Die beiden handgebauten Würfel-Level Aufzug und Kern, nur noch als Testdaten: Sie waren die ersten Würfel-Level und
// dienten zum Testen; am 25.10.2026 hat der Nutzer sie aus dem Spiel genommen (Würfel-Level, Ticket 10). Die Tests der
// Beurteilung, der Feldform, der Ähnlichkeit und der KI-Tester brauchen sie weiter als feste, von Hand geprüfte Fälle.

export const AUFZUG = {
  // Lösung: Spiegel (3,0,3) Achse z rot 3 – Ost → hinauf; Prisma (3,3,3) Achse x rot 2 – Fächer nach oben:
  //   Rot → oben/Süd → Ziel (3,6,6), Grün → hinauf → Spiegel (3,6,3) Achse z rot 1 → West → Ziel (0,6,3),
  //   Blau → oben/Nord → Ziel (3,6,0).
  name: 'Aufzug', dim: 3, size: 7, grad: 'leicht',
  hint: 'Jedes Element dreht in seinem Ring – die Zapfen zeigen die Achse.',
  elements: [
    { type: 'source', x: 0, y: 0, z: 3, dir: 0 },
    { type: 'mirror', x: 3, y: 0, z: 3, axis: 'z', rot: 1 },
    { type: 'prism', x: 3, y: 3, z: 3, axis: 'x', rot: 0 },
    { type: 'mirror', x: 3, y: 6, z: 3, axis: 'z', rot: 0 },
    { type: 'target', x: 3, y: 6, z: 6, color: 'red' },
    { type: 'target', x: 0, y: 6, z: 3, color: 'green' },
    { type: 'target', x: 3, y: 6, z: 0, color: 'blue' },
  ],
  solution: { '3,0,3': 3, '3,3,3': 2, '3,6,3': 1 },
};

export const KERN = {
  // Lösung: Rot: Spiegel (3,0,0) Achse z rot 3 – Ost → hinauf; Spiegel (3,3,0) Achse x rot 1 – hinauf → Süd
  //   → Ziel (3,3,3). Weiss: Prisma (4,6,6) Achse z rot 3 – Rot → hinab → Ziel (4,0,6), Grün → unten/West
  //   → Ziel (1,3,6), Blau → West → Spiegel (3,6,6) Achse z rot 3 → hinab → Spiegel (3,3,6) Achse x rot 1
  //   → Nord → Ziel (3,3,3): Rot + Blau = Magenta in der Würfelmitte. Grün kreuzt den Blauschacht bei (3,5,6).
  name: 'Kern', dim: 3, size: 7, grad: 'leicht',
  hint: 'Strahlen kreuzen sich in leeren Zellen. Magenta = Rot + Blau – beide müssen in die Mitte.',
  elements: [
    { type: 'source', x: 0, y: 0, z: 0, dir: 0, color: 'red' },
    { type: 'mirror', x: 3, y: 0, z: 0, axis: 'z', rot: 0 },
    { type: 'mirror', x: 3, y: 3, z: 0, axis: 'x', rot: 3 },
    { type: 'source', x: 6, y: 6, z: 6, dir: 4 },
    { type: 'prism', x: 4, y: 6, z: 6, axis: 'z', rot: 4 },
    { type: 'mirror', x: 3, y: 6, z: 6, axis: 'z', rot: 1 },
    { type: 'mirror', x: 3, y: 3, z: 6, axis: 'x', rot: 2 },
    { type: 'target', x: 3, y: 3, z: 3, color: 'magenta' },
    { type: 'target', x: 4, y: 0, z: 6, color: 'red' },
    { type: 'target', x: 1, y: 3, z: 6, color: 'green' },
  ],
  solution: { '3,0,0': 3, '3,3,0': 1, '4,6,6': 3, '3,6,6': 3, '3,3,6': 1 },
};
