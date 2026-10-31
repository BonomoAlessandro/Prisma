// Vorrat der Würfel-Level (Spec .scratch/noa-geschichte/, «Daten»): Level, die nicht im Spiel stehen, aber jederzeit
// zurückkommen können. Je Level sein Block aus LEVELS_3D in index.html, Zeile für Zeile wie dort (Lösung und Herkunft
// im Kommentar, Name, Würfel, Grad, Elemente, Lösung), darüber sein Platz im Spiel beim Ablegen. Geschrieben von
// tools/vorrat.mjs (ablegen, zurueckholen, liste); Werkzeuge und Tests lesen ihn über tools/lader.mjs. Nur über das
// Werkzeug ändern.
const VORRAT_WUERFEL = [
  /* VORRAT:BEGIN */
  // Platz im Spiel: am Anfang
  {
    // Lösung: Spiegel (3,0,4) Achse z rot 3 · Spiegel (3,1,4) Achse z rot 3 ·
    //   Spiegel (4,1,4) Achse z rot 3 · Spiegel (4,3,4) Achse z rot 1
    // Generator leicht, Seed 20065, Stand 33f26f8, gesenkt um 3 · Würfel „leicht“
    name: 'Wippe', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 0, z: 4, dir: 0, color: 'green' },
      { type: 'mirror', x: 3, y: 0, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'target', x: 2, y: 3, z: 4, color: 'green' },
    ],
    solution: { '3,0,4': 3, '3,1,4': 3, '4,1,4': 3, '4,3,4': 1 },
  },
  // Platz im Spiel: nach „Wippe“
  {
    // Lösung: Spiegel (3,4,2) Achse y rot 1 · Spiegel (2,4,2) Achse z rot 3 ·
    //   Spiegel (2,1,2) Achse x rot 3 · Spiegel (2,1,6) Achse x rot 3
    // Generator leicht, Seed 60010, Stand 74361c6 · Würfel „leicht“
    name: 'Keksdose', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 6, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 0, z: 6, color: 'cyan' },
    ],
    solution: { '3,4,2': 1, '2,4,2': 3, '2,1,2': 3, '2,1,6': 3 },
  },
  // Platz im Spiel: nach „Keksdose“
  {
    // Lösung: Spiegel (1,4,2) Achse x rot 1 · Spiegel (1,2,3) Achse z rot 1 ·
    //   Spiegel (1,0,3) Achse x rot 1
    // Generator leicht-mischziel, Seed 20125, Stand 33f26f8, gesenkt um 0 · Würfel „leicht“
    name: 'Schneebesen', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 1, y: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, y: 2, z: 3, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 1, y: 4, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 3, axis: 'x', rot: 0 },
      { type: 'target', x: 1, y: 0, z: 2, color: 'white' },
    ],
    solution: { '1,4,2': 1, '1,2,3': 1, '1,0,3': 1 },
  },
  // Platz im Spiel: nach „Schneebesen“
  {
    // Lösung: Spiegel (5,2,2) Achse z rot 3 · Spiegel (1,1,2) Achse x rot 1 ·
    //   Spiegel (1,0,2) Achse z rot 1
    // Generator leicht-mischziel, Seed 20033, Stand 33f26f8, gesenkt um 3 · Würfel „leicht“
    name: 'Kellertreppe', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 2, z: 2, dir: 4, color: 'blue' },
      { type: 'source', x: 1, y: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 5, y: 2, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 1, y: 1, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'z', rot: 3 },
      { type: 'target', x: 5, y: 0, z: 2, color: 'white' },
    ],
    solution: { '5,2,2': 3, '1,1,2': 1, '1,0,2': 1 },
  },
  // Platz im Spiel: nach „Kellertreppe“
  {
    // Lösung: Spiegel (4,0,5) Achse z rot 3 · Spiegel (4,1,5) Achse z rot 3 ·
    //   Spiegel (6,1,5) Achse z rot 3 · Spiegel (6,2,5) Achse z rot 1
    // Generator leicht, Seed 20042, Stand 33f26f8, gesenkt um 1 · Würfel „leicht“
    name: 'Garderobe', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 1, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 5, axis: 'z', rot: 0 },
      { type: 'filter', x: 1, y: 2, z: 5, color: 'yellow' },
      { type: 'mirror', x: 0, y: 2, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 0, y: 2, z: 1, color: 'yellow' },
    ],
    solution: { '4,0,5': 3, '4,1,5': 3, '6,1,5': 3, '6,2,5': 1 },
  },
  // Platz im Spiel: nach „Garderobe“
  {
    // Lösung: Spiegel (2,3,6) Achse x rot 1 · Spiegel (1,4,6) Achse z rot 0 ·
    //   Spiegel (0,3,6) Achse y rot 1 · Spiegel (0,2,5) Achse y rot 0 · Spiegel (0,1,6) Achse x rot 2
    // Generator leicht, Seed 60045, Stand 74361c6 · Würfel „leicht“
    name: 'Kehrblech', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 3, z: 2, dir: 3, color: 'blue' },
      { type: 'mirror', x: 2, y: 3, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 6, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 0, z: 5, color: 'blue' },
    ],
    solution: { '2,3,6': 1, '1,4,6': 0, '0,3,6': 1, '0,2,5': 0, '0,1,6': 2 },
  },
  // Platz im Spiel: nach „Kehrblech“
  {
    // Lösung: Spiegel (2,1,1) Achse y rot 0 · Spiegel (2,0,2) Achse x rot 0 ·
    //   Spiegel (2,2,4) Achse x rot 2 · Spiegel (2,4,2) Achse x rot 0
    // Generator leicht, Seed 60052, Stand 74361c6 · Würfel „leicht“
    name: 'Gummistiefel', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 2, y: 4, z: 4, axis: 'x', dir: 5, color: 'magenta' },
      { type: 'mirror', x: 2, y: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 4, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 2, y: 4, z: 0, color: 'magenta' },
    ],
    solution: { '2,1,1': 0, '2,0,2': 0, '2,2,4': 2, '2,4,2': 0 },
  },
  // Platz im Spiel: nach „Gummistiefel“
  {
    // Lösung: Spiegel (1,2,6) Achse x rot 2 · Spiegel (1,4,4) Achse z rot 1 ·
    //   Spiegel (0,4,3) Achse z rot 3 · Spiegel (0,1,0) Achse y rot 3 · Spiegel (1,0,0) Achse x rot 3
    // Generator leicht, Seed 60060, Stand 74361c6 · Würfel „leicht“
    name: 'Wollknäuel', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 1, y: 0, z: 4, axis: 'x', dir: 1, color: 'red' },
      { type: 'mirror', x: 1, y: 2, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 0, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'target', x: 6, y: 0, z: 5, color: 'red' },
    ],
    solution: { '1,2,6': 2, '1,4,4': 1, '0,4,3': 3, '0,1,0': 3, '1,0,0': 3 },
  },
  // Platz im Spiel: nach „Wollknäuel“
  {
    // Lösung: Spiegel (1,2,0) Achse z rot 2 · Spiegel (2,3,0) Achse z rot 2 ·
    //   Spiegel (1,4,0) Achse z rot 0 · Spiegel (0,3,0) Achse y rot 3
    // Generator leicht, Seed 60087, Stand 74361c6 · Würfel „leicht“
    name: 'Geranie', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 0, z: 0, axis: 'z', dir: 5 },
      { type: 'mirror', x: 1, y: 2, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 3, z: 0, rot: 0 },
      { type: 'filter', x: 0, y: 2, z: 1, color: 'red' },
      { type: 'mirror', x: 0, y: 1, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 1, y: 0, z: 2, color: 'red' },
    ],
    solution: { '1,2,0': 2, '2,3,0': 2, '1,4,0': 0, '0,3,0': 3 },
  },
  // Platz im Spiel: nach „Geranie“
  {
    // Lösung: Spiegel (1,0,5) Achse y rot 3 · Spiegel (1,0,6) Achse y rot 3 ·
    //   Prisma (0,0,6) Achse z rot 6 · Spiegel (3,3,6) Achse z rot 0
    // Generator leicht, Seed 60016, Stand 74361c6 · Würfel „leicht“
    name: 'Bauernhof', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 0, z: 5, dir: 4 },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 6, rot: 0 },
      { type: 'prism', x: 0, y: 0, z: 6, axis: 'z', rot: 5 },
      { type: 'mirror', x: 3, y: 3, z: 6, axis: 'z', rot: 3 },
      { type: 'target', x: 5, y: 1, z: 6, color: 'blue' },
    ],
    solution: { '1,0,5': 3, '1,0,6': 3, '0,0,6': 6, '3,3,6': 0 },
  },
  // Platz im Spiel: nach „Bauernhof“
  {
    // Lösung: Spiegel (0,0,2) Achse y rot 3 · Spiegel (0,0,6) Achse x rot 1 ·
    //   Spiegel (0,1,6) Achse z rot 3 · Spiegel (3,1,6) Achse z rot 3 · Spiegel (3,2,6) Achse z rot 1
    // Generator leicht, Seed 20050, Stand 33f26f8, gesenkt um 4 · Würfel „leicht“
    name: 'Regal', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 0, z: 2, dir: 4, color: 'green' },
      { type: 'mirror', x: 0, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 6, axis: 'z', rot: 2 },
      { type: 'target', x: 0, y: 2, z: 6, color: 'green' },
    ],
    solution: { '0,0,2': 3, '0,0,6': 1, '0,1,6': 3, '3,1,6': 3, '3,2,6': 1 },
  },
  // Platz im Spiel: nach „Regal“
  {
    // Lösung: Prisma (5,0,1) Achse x rot 1 · Spiegel (5,1,2) Achse y rot 1 ·
    //   Spiegel (5,2,1) Achse x rot 3 · Spiegel (5,0,4) Achse y rot 3
    // Generator leicht, Seed 20022, Stand 33f26f8, gesenkt um 4 · Würfel „leicht“
    name: 'Schublade', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 5, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 5, y: 0, z: 1, axis: 'x', rot: 4 },
      { type: 'mirror', x: 5, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 1, axis: 'x', rot: 2 },
      { type: 'target', x: 5, y: 2, z: 0, color: 'blue' },
      { type: 'target', x: 6, y: 2, z: 2, color: 'green' },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 4, rot: 1, fixed: true },
      { type: 'target', x: 4, y: 0, z: 1, color: 'red' },
    ],
    solution: { '5,0,1': 1, '5,1,2': 1, '5,2,1': 3, '5,0,4': 3 },
  },
  // Platz im Spiel: nach „Schublade“
  {
    // Lösung: Spiegel (0,4,4) Achse z rot 3 · Prisma (6,4,4) Achse y rot 1 ·
    //   Spiegel (6,4,5) Achse x rot 3 · Spiegel (6,2,5) Achse x rot 3
    // Generator leicht, Seed 60022, Stand 74361c6 · Würfel „leicht“
    name: 'Pantoffel', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 0, z: 4, axis: 'x', dir: 2 },
      { type: 'mirror', x: 0, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'prism', x: 6, y: 4, z: 4, rot: 5 },
      { type: 'mirror', x: 6, y: 4, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, y: 2, z: 6, color: 'blue' },
    ],
    solution: { '0,4,4': 3, '6,4,4': 1, '6,4,5': 3, '6,2,5': 3 },
  },
  // Platz im Spiel: nach „Pantoffel“
  {
    // Lösung: Spiegel (2,1,1) Achse y rot 3 · Spiegel (2,1,0) Achse x rot 3 ·
    //   Spiegel (1,1,0) Achse z rot 2 · Spiegel (0,2,0) Achse y rot 2
    // Generator leicht-mischziel, Seed 20142, Stand 33f26f8, gesenkt um 0 · Würfel „leicht“
    name: 'Klettergerüst', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 1, z: 1, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 0, axis: 'z', dir: 7, color: 'magenta' },
      { type: 'mirror', x: 2, y: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 1 },
      { type: 'target', x: 2, y: 4, z: 0, color: 'white' },
    ],
    solution: { '2,1,1': 3, '2,1,0': 3, '1,1,0': 2, '0,2,0': 2 },
  },
  // Platz im Spiel: nach „Klettergerüst“
  {
    // Lösung: Spiegel (3,4,1) Achse x rot 0 · Spiegel (3,3,0) Achse y rot 0 ·
    //   Prisma (3,1,2) Achse x rot 6 · Spiegel (3,0,1) Achse z rot 0
    // Generator leicht, Seed 60075, Stand 74361c6 · Würfel „leicht“
    name: 'Planschbecken', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 0, z: 5, axis: 'x', dir: 3 },
      { type: 'mirror', x: 3, y: 4, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 3, z: 0, rot: 1 },
      { type: 'prism', x: 3, y: 1, z: 2, axis: 'x', rot: 7 },
      { type: 'mirror', x: 3, y: 0, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 3, y: 4, z: 3, color: 'red' },
    ],
    solution: { '3,4,1': 0, '3,3,0': 0, '3,1,2': 6, '3,0,1': 0 },
  },
  // Platz im Spiel: nach „Planschbecken“
  {
    // Lösung: Spiegel (1,0,4) Achse x rot 0 · Spiegel (1,1,5) Achse y rot 3 ·
    //   Spiegel (0,2,5) Achse z rot 2 · Spiegel (1,3,5) Achse y rot 3 · Spiegel (1,4,4) Achse z rot 1 ·
    //   Spiegel (0,4,3) Achse y rot 2
    // Generator leicht, Seed 20020, Stand 33f26f8, gesenkt um 2 · Würfel „leicht“
    name: 'Briefkasten', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 1, y: 4, z: 0, axis: 'x', dir: 7 },
      { type: 'mirror', x: 1, y: 0, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 3, rot: 3 },
      { type: 'target', x: 3, y: 4, z: 0, color: 'white' },
    ],
    solution: { '1,0,4': 0, '1,1,5': 3, '0,2,5': 2, '1,3,5': 3, '1,4,4': 1, '0,4,3': 2 },
  },
  // Platz im Spiel: nach „Briefkasten“
  {
    // Lösung: Spiegel (1,2,2) Achse x rot 3 · Spiegel (0,1,2) Achse y rot 2 ·
    //   Spiegel (1,0,2) Achse x rot 0 · Prisma (2,1,2) Achse z rot 7
    // Generator leicht, Seed 60078, Stand 74361c6 · Würfel „leicht“
    name: 'Duschvorhang', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 2, z: 0, dir: 3 },
      { type: 'mirror', x: 1, y: 2, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'x', rot: 1 },
      { type: 'prism', x: 2, y: 1, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 2, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 2, y: 4, z: 2, color: 'red' },
      { type: 'target', x: 3, y: 4, z: 2, color: 'blue' },
      { type: 'target', x: 5, y: 4, z: 2, color: 'green' },
    ],
    solution: { '1,2,2': 3, '0,1,2': 2, '1,0,2': 0, '2,1,2': 7 },
  },
  // Platz im Spiel: nach „Duschvorhang“
  {
    // Lösung: Spiegel (3,1,3) Achse y rot 0 · Spiegel (3,3,1) Achse z rot 0 ·
    //   Spiegel (3,2,0) Achse y rot 0 · Spiegel (3,1,1) Achse x rot 2 · Prisma (3,0,0) Achse x rot 3
    // Generator leicht, Seed 60106, Stand 74361c6 · Würfel „leicht“
    name: 'Domino', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 0, z: 2, axis: 'x', dir: 1 },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 1, axis: 'x', rot: 3 },
      { type: 'prism', x: 3, y: 0, z: 0, axis: 'x', rot: 6 },
      { type: 'target', x: 3, y: 1, z: 0, color: 'red' },
    ],
    solution: { '3,1,3': 0, '3,3,1': 0, '3,2,0': 0, '3,1,1': 2, '3,0,0': 3 },
  },
  // Platz im Spiel: nach „Domino“
  {
    // Lösung: Spiegel (4,2,2) Achse z rot 3 · Prisma (3,2,2) Achse y rot 2 ·
    //   Spiegel (2,2,6) Achse x rot 3 · Spiegel (1,2,5) Achse z rot 2
    // Generator leicht, Seed 60082, Stand 74361c6 · Würfel „leicht“
    name: 'Mixer', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 4, y: 4, z: 2, axis: 'x', dir: 6, color: 'yellow' },
      { type: 'source', x: 4, y: 0, z: 6, axis: 'z', dir: 5 },
      { type: 'mirror', x: 4, y: 2, z: 2, axis: 'z', rot: 2 },
      { type: 'prism', x: 3, y: 2, z: 2, rot: 4 },
      { type: 'mirror', x: 2, y: 2, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 5, axis: 'z', rot: 0 },
      { type: 'target', x: 4, y: 4, z: 0, color: 'white' },
      { type: 'target', x: 6, y: 2, z: 5, color: 'red' },
      { type: 'target', x: 3, y: 2, z: 6, color: 'green' },
    ],
    solution: { '4,2,2': 3, '3,2,2': 2, '2,2,6': 3, '1,2,5': 2 },
  },
  // Platz im Spiel: nach „Mixer“
  {
    // Lösung: Prisma (2,0,4) Achse y rot 7 · Spiegel (2,0,5) Achse y rot 3 ·
    //   Spiegel (3,0,3) Achse x rot 3 · Spiegel (6,3,3) Achse z rot 2
    // Generator leicht-sammelstelle, Seed 60118, Stand 74361c6 · Würfel „leicht“
    name: 'Lineal', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'prism', x: 2, y: 0, z: 4, rot: 5 },
      { type: 'source', x: 0, y: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'red' },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 2 },
      { type: 'target', x: 6, y: 0, z: 4, color: 'blue' },
      { type: 'target', x: 2, y: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'z', rot: 3 },
      { type: 'target', x: 5, y: 4, z: 3, color: 'green' },
    ],
    solution: { '2,0,4': 7, '2,0,5': 3, '3,0,3': 3, '6,3,3': 2 },
  },
  // Platz im Spiel: nach „Lineal“
  {
    // Lösung: Spiegel (1,2,1) Achse y rot 1 · Spiegel (0,2,1) Achse z rot 3 ·
    //   Prisma (0,0,1) Achse z rot 0 · Spiegel (1,1,1) Achse x rot 3 · Spiegel (2,1,0) Achse x rot 3
    // Generator leicht, Seed 60101, Stand 74361c6 · Würfel „leicht“
    name: 'Tablett', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 1, y: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 1, y: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 1, axis: 'z', rot: 1 },
      { type: 'prism', x: 0, y: 0, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 0, axis: 'x', rot: 2 },
      { type: 'target', x: 3, y: 2, z: 0, color: 'red' },
    ],
    solution: { '1,2,1': 1, '0,2,1': 3, '0,0,1': 0, '1,1,1': 3, '2,1,0': 3 },
  },
  // Platz im Spiel: nach „Tablett“
  {
    // Lösung: Spiegel (3,4,6) Achse y rot 3 · Spiegel (1,4,6) Achse z rot 3 ·
    //   Spiegel (1,0,6) Achse z rot 1 · Spiegel (4,0,6) Achse z rot 3 · Spiegel (4,1,6) Achse x rot 3 ·
    //   Spiegel (4,1,1) Achse y rot 3
    // Generator leicht, Seed 60188, Stand 74361c6 · Würfel „leicht“
    name: 'Föhn', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 3, y: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 6, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 1, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 2, z: 1, color: 'white' },
    ],
    solution: { '3,4,6': 3, '1,4,6': 3, '1,0,6': 1, '4,0,6': 3, '4,1,6': 3, '4,1,1': 3 },
  },
  // Platz im Spiel: nach „Föhn“
  {
    // Lösung: Spiegel (2,0,4) Achse z rot 3 · Spiegel (2,4,4) Achse x rot 3 ·
    //   Prisma (1,0,4) Achse y rot 6 · Spiegel (2,0,3) Achse z rot 2 · Spiegel (1,0,3) Achse x rot 3
    // Generator leicht, Seed 20105, Stand 33f26f8, gesenkt um 1 · Würfel „leicht“
    name: 'Handschuh', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'z', rot: 1 },
      { type: 'source', x: 2, y: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 2, y: 4, z: 4, axis: 'x', rot: 0 },
      { type: 'prism', x: 1, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 3, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 1, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 1, y: 3, z: 1, color: 'green' },
      { type: 'target', x: 0, y: 0, z: 3, color: 'red' },
    ],
    solution: { '2,0,4': 3, '2,4,4': 3, '1,0,4': 6, '2,0,3': 2, '1,0,3': 3 },
  },
  // Platz im Spiel: nach „Handschuh“
  {
    // Lösung: Spiegel (4,1,2) Achse x rot 1 · Spiegel (5,0,2) Achse z rot 0 ·
    //   Spiegel (6,1,2) Achse y rot 3 · Spiegel (6,3,0) Achse x rot 2 · Spiegel (6,4,1) Achse z rot 1 ·
    //   Spiegel (3,4,4) Achse z rot 3
    // Generator leicht, Seed 60088, Stand 74361c6 · Würfel „leicht“
    name: 'Fernbedienung', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 1, z: 6, dir: 7 },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'target', x: 3, y: 2, z: 6, color: 'white' },
    ],
    solution: { '4,1,2': 1, '5,0,2': 0, '6,1,2': 3, '6,3,0': 2, '6,4,1': 1, '3,4,4': 3 },
  },
  // Platz im Spiel: nach „Fernbedienung“
  {
    // Lösung: Spiegel (1,2,3) Achse z rot 1 · Spiegel (1,1,3) Achse x rot 3 ·
    //   Spiegel (1,0,5) Achse x rot 1 · Spiegel (5,2,3) Achse y rot 3
    // Generator leicht-mischziel, Seed 60266, Stand 74361c6 · Würfel „leicht“
    name: 'Springseil', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 2, z: 3, dir: 0, color: 'yellow' },
      { type: 'source', x: 1, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'x', rot: 2 },
      { type: 'target', x: 1, y: 1, z: 5, color: 'white' },
      { type: 'source', x: 5, y: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 3, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 1, y: 3, z: 6, color: 'blue' },
    ],
    solution: { '1,2,3': 1, '1,1,3': 3, '1,0,5': 1, '5,2,3': 3 },
  },
  // Platz im Spiel: nach „Springseil“
  {
    // Lösung: Prisma (4,2,1) Achse y rot 1 · Spiegel (5,2,2) Achse z rot 3 ·
    //   Spiegel (5,4,4) Achse z rot 0 · Spiegel (5,3,5) Achse y rot 0
    // Generator leicht-sammelstelle, Seed 60078, Stand 74361c6 · Würfel „leicht“
    name: 'Sparschwein', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'prism', x: 4, y: 2, z: 1, rot: 6 },
      { type: 'source', x: 4, y: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, y: 2, z: 5, dir: 7, color: 'red' },
      { type: 'target', x: 4, y: 2, z: 4, color: 'blue' },
      { type: 'target', x: 5, y: 2, z: 1, color: 'red' },
      { type: 'mirror', x: 5, y: 2, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 0, z: 0, color: 'green' },
    ],
    solution: { '4,2,1': 1, '5,2,2': 3, '5,4,4': 0, '5,3,5': 0 },
  },
  // Platz im Spiel: nach „Sparschwein“
  {
    // Lösung: Spiegel (4,0,3) Achse y rot 1 · Spiegel (4,0,0) Achse y rot 1 ·
    //   Spiegel (3,0,0) Achse z rot 1 · Prisma (3,3,0) Achse x rot 2 · Spiegel (3,4,1) Achse z rot 3 ·
    //   Spiegel (4,4,2) Achse y rot 2
    // Generator leicht, Seed 20319, Stand 33f26f8, gesenkt um 2 · Würfel „leicht“
    name: 'Teddybär', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 0, z: 3, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'z', rot: 3 },
      { type: 'prism', x: 3, y: 3, z: 0, axis: 'x', rot: 5 },
      { type: 'mirror', x: 3, y: 4, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 2, rot: 3 },
      { type: 'target', x: 1, y: 4, z: 5, color: 'red' },
      { type: 'target', x: 3, y: 4, z: 0, color: 'green' },
    ],
    solution: { '4,0,3': 1, '4,0,0': 1, '3,0,0': 1, '3,3,0': 2, '3,4,1': 3, '4,4,2': 2 },
  },
  // Platz im Spiel: nach „Teddybär“
  {
    // Lösung: Prisma (2,1,1) Achse x rot 5 · Spiegel (2,1,0) Achse x rot 3 ·
    //   Spiegel (2,3,0) Achse z rot 3 · Spiegel (4,3,0) Achse z rot 3 · Spiegel (4,4,0) Achse z rot 3 ·
    //   Spiegel (6,4,0) Achse y rot 1
    // Generator leicht, Seed 20242, Stand 33f26f8, gesenkt um 1 · Würfel „leicht“
    name: 'Garnrolle', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 2, y: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'prism', x: 2, y: 1, z: 1, axis: 'x', rot: 0 },
      { type: 'target', x: 2, y: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 2, y: 1, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 0, rot: 3 },
      { type: 'target', x: 6, y: 4, z: 6, color: 'red' },
    ],
    solution: { '2,1,1': 5, '2,1,0': 3, '2,3,0': 3, '4,3,0': 3, '4,4,0': 3, '6,4,0': 1 },
  },
  // Platz im Spiel: nach „Garnrolle“
  {
    // Lösung: Prisma (4,2,4) Achse y rot 6 · Spiegel (5,2,3) Achse x rot 1 ·
    //   Spiegel (6,1,3) Achse z rot 2 · Spiegel (5,0,3) Achse z rot 0
    // Generator leicht-sammelstelle, Seed 60396, Stand 74361c6 · Würfel „leicht“
    name: 'Kühlbox', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'prism', x: 4, y: 2, z: 4, rot: 5 },
      { type: 'source', x: 6, y: 2, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 0, y: 2, z: 4, dir: 0, color: 'green' },
      { type: 'target', x: 0, y: 2, z: 0, color: 'red' },
      { type: 'target', x: 4, y: 2, z: 1, color: 'green' },
      { type: 'mirror', x: 5, y: 2, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 6, y: 1, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 0, z: 3, axis: 'z', rot: 1 },
      { type: 'target', x: 1, y: 4, z: 3, color: 'blue' },
    ],
    solution: { '4,2,4': 6, '5,2,3': 1, '6,1,3': 2, '5,0,3': 0 },
  },
  // Platz im Spiel: nach „Kühlbox“
  {
    // Lösung: Spiegel (1,0,5) Achse y rot 1 · Prisma (1,0,6) Achse y rot 4 ·
    //   Spiegel (0,0,6) Achse z rot 1 · Spiegel (0,1,6) Achse x rot 3 · Spiegel (0,1,3) Achse x rot 3 ·
    //   Spiegel (0,4,3) Achse x rot 3
    // Generator leicht, Seed 60281, Stand 74361c6 · Würfel „leicht“
    name: 'Knopf', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 2 },
      { type: 'prism', x: 1, y: 0, z: 6, rot: 1 },
      { type: 'mirror', x: 0, y: 0, z: 6, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 6, y: 4, z: 2, color: 'green' },
    ],
    solution: { '1,0,5': 1, '1,0,6': 4, '0,0,6': 1, '0,1,6': 3, '0,1,3': 3, '0,4,3': 3 },
  },
  // Platz im Spiel: nach „Knopf“
  {
    // Lösung: Spiegel (1,2,3) Achse z rot 1 · Spiegel (3,2,4) Achse x rot 1 ·
    //   Spiegel (3,2,6) Achse y rot 1 · Prisma (4,2,6) Achse y rot 6 · Spiegel (4,2,2) Achse y rot 1
    // Generator leicht, Seed 60084, Stand 74361c6 · Würfel „leicht“
    name: 'Trinkhalm', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'z', rot: 2 },
      { type: 'source', x: 3, y: 0, z: 4, axis: 'x', dir: 2 },
      { type: 'mirror', x: 3, y: 2, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 6, rot: 2 },
      { type: 'prism', x: 4, y: 2, z: 6, rot: 4 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 0 },
      { type: 'target', x: 1, y: 4, z: 1, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 4, color: 'blue' },
      { type: 'target', x: 2, y: 2, z: 2, color: 'green' },
    ],
    solution: { '1,2,3': 1, '3,2,4': 1, '3,2,6': 1, '4,2,6': 6, '4,2,2': 1 },
  },
  // Platz im Spiel: nach „Trinkhalm“
  {
    // Lösung: Spiegel (3,1,1) Achse z rot 3 · Spiegel (2,1,0) Achse x rot 3 ·
    //   Spiegel (1,2,0) Achse y rot 3 · Prisma (1,3,1) Achse x rot 0 · Spiegel (1,3,5) Achse y rot 1 ·
    //   Spiegel (1,1,3) Achse y rot 3
    // Generator leicht, Seed 20069, Stand 33f26f8, gesenkt um 3 · Würfel „leicht“
    name: 'Brotkorb', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 3, z: 3, axis: 'x', dir: 5 },
      { type: 'mirror', x: 3, y: 1, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 0, rot: 1 },
      { type: 'prism', x: 1, y: 3, z: 1, axis: 'x', rot: 6 },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 3 },
      { type: 'target', x: 4, y: 3, z: 5, color: 'green' },
      { type: 'mirror', x: 1, y: 1, z: 3, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 3, color: 'red' },
    ],
    solution: { '3,1,1': 3, '2,1,0': 3, '1,2,0': 3, '1,3,1': 0, '1,3,5': 1, '1,1,3': 3 },
  },
  // Platz im Spiel: nach „Brotkorb“
  {
    // Lösung: Spiegel (2,1,1) Achse x rot 0 · Prisma (1,0,1) Achse z rot 5 ·
    //   Spiegel (0,0,1) Achse z rot 1 · Spiegel (0,4,1) Achse x rot 3 · Spiegel (1,2,1) Achse z rot 3 ·
    //   Spiegel (4,2,1) Achse y rot 3
    // Generator leicht, Seed 60019, Stand 74361c6 · Würfel „leicht“
    name: 'Mütze', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 0, z: 1, axis: 'z', dir: 5 },
      { type: 'mirror', x: 2, y: 1, z: 1, axis: 'x', rot: 1 },
      { type: 'prism', x: 1, y: 0, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 0, y: 0, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 0, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 4, y: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, y: 1, z: 0, color: 'red' },
    ],
    solution: { '2,1,1': 0, '1,0,1': 5, '0,0,1': 1, '0,4,1': 3, '1,2,1': 3, '4,2,1': 3 },
  },
  // Platz im Spiel: nach „Mütze“
  {
    // Lösung: Prisma (5,0,5) Achse y rot 6 · Spiegel (3,0,3) Achse y rot 0 ·
    //   Spiegel (6,0,4) Achse y rot 2 · Spiegel (5,0,3) Achse y rot 2 · Spiegel (6,0,2) Achse z rot 2 ·
    //   Spiegel (5,0,1) Achse z rot 1
    // Generator leicht-falle, Seed 20059, Stand 33f26f8, gesenkt um 3 · Würfel „leicht“
    name: 'Zahnbürste', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 5, y: 0, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 5, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 2 },
      { type: 'target', x: 1, y: 0, z: 5, color: 'red' },
      { type: 'mirror', x: 6, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, y: 2, z: 0, color: 'blue' },
      { type: 'blocker', x: 6, y: 1, z: 1 },
    ],
    solution: { '5,0,5': 6, '3,0,3': 0, '6,0,4': 2, '5,0,3': 2, '6,0,2': 2, '5,0,1': 1 },
  },
  // Platz im Spiel: nach „Zahnbürste“
  {
    // Lösung: Prisma (3,3,1) Achse y rot 4 · Spiegel (0,3,1) Achse z rot 1 ·
    //   Spiegel (0,4,1) Achse x rot 1 · Spiegel (2,3,2) Achse z rot 3 · Spiegel (2,0,5) Achse x rot 0 ·
    //   Spiegel (2,1,6) Achse y rot 3
    // Generator leicht, Seed 60077, Stand 74361c6 · Würfel „leicht“
    name: 'Fotoalbum', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 3, y: 3, z: 6, dir: 6 },
      { type: 'prism', x: 3, y: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 0, y: 3, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 2, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 2, z: 2, color: 'green' },
      { type: 'mirror', x: 2, y: 3, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 6, rot: 0 },
      { type: 'target', x: 0, y: 3, z: 6, color: 'red' },
    ],
    solution: { '3,3,1': 4, '0,3,1': 1, '0,4,1': 1, '2,3,2': 3, '2,0,5': 0, '2,1,6': 3 },
  },
  // Platz im Spiel: nach „Fotoalbum“
  {
    // Lösung: Prisma (5,0,3) Achse x rot 2 · Spiegel (5,3,3) Achse x rot 3 ·
    //   Spiegel (5,2,5) Achse z rot 1 · Spiegel (4,2,6) Achse x rot 1 · Spiegel (5,1,2) Achse x rot 0 ·
    //   Spiegel (5,0,1) Achse x rot 0
    // Generator leicht, Seed 20199, Stand 33f26f8, gesenkt um 3 · Würfel „leicht“
    name: 'Schemel', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 5, y: 0, z: 6, dir: 6 },
      { type: 'prism', x: 5, y: 0, z: 3, axis: 'x', rot: 7 },
      { type: 'mirror', x: 5, y: 3, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 6, y: 3, z: 1, color: 'green' },
      { type: 'target', x: 3, y: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 5, y: 1, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 1, axis: 'x', rot: 2 },
      { type: 'target', x: 5, y: 1, z: 0, color: 'blue' },
    ],
    solution: { '5,0,3': 2, '5,3,3': 3, '5,2,5': 1, '4,2,6': 1, '5,1,2': 0, '5,0,1': 0 },
  },
  // Platz im Spiel: nach „Schemel“
  {
    // Lösung: Prisma (2,2,2) Achse y rot 4 · Spiegel (2,2,6) Achse y rot 3 ·
    //   Prisma (5,2,2) Achse z rot 2 · Spiegel (3,0,2) Achse x rot 0
    // Generator leicht-sammelstelle, Seed 60194, Stand 74361c6 · Würfel „leicht“
    name: 'Salzstreuer', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'prism', x: 2, y: 2, z: 2, rot: 5 },
      { type: 'source', x: 6, y: 2, z: 6, dir: 5, color: 'green' },
      { type: 'source', x: 0, y: 2, z: 6, dir: 0, color: 'blue' },
      { type: 'mirror', x: 2, y: 2, z: 6, rot: 2 },
      { type: 'target', x: 1, y: 2, z: 2, color: 'cyan' },
      { type: 'target', x: 1, y: 2, z: 1, color: 'blue' },
      { type: 'source', x: 5, y: 4, z: 2, axis: 'x', dir: 6 },
      { type: 'prism', x: 5, y: 2, z: 2, axis: 'z', rot: 7 },
      { type: 'target', x: 6, y: 1, z: 2, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 2, axis: 'x', rot: 3 },
    ],
    solution: { '2,2,2': 4, '2,2,6': 3, '5,2,2': 2, '3,0,2': 0 },
  },
  // Platz im Spiel: nach „Salzstreuer“
  {
    // Lösung: Prisma (3,0,2) Achse y rot 2 · Spiegel (6,0,5) Achse z rot 3 ·
    //   Spiegel (6,1,6) Achse y rot 3 · Spiegel (5,2,6) Achse z rot 0
    // Generator leicht-sammelstelle, Seed 20250, Stand 33f26f8, gesenkt um 4 · Würfel „leicht“
    name: 'Sandschaufel', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'prism', x: 3, y: 0, z: 2, rot: 4 },
      { type: 'source', x: 3, y: 0, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 5, y: 0, z: 0, dir: 3, color: 'magenta' },
      { type: 'target', x: 3, y: 0, z: 6, color: 'yellow' },
      { type: 'target', x: 2, y: 0, z: 3, color: 'blue' },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 6, axis: 'z', rot: 2 },
    ],
    solution: { '3,0,2': 2, '6,0,5': 3, '6,1,6': 3, '5,2,6': 0 },
  },
  // Platz im Spiel: nach „Sandschaufel“
  {
    // Lösung: Spiegel (4,2,1) Achse x rot 3 · Spiegel (0,2,4) Achse z rot 1 ·
    //   Spiegel (4,0,1) Achse x rot 3 · Prisma (4,2,0) Achse y rot 4
    // Generator leicht-mischziel, Seed 80084, Ziel 37–42,5, Stand b80d994 · Würfel „leicht“
    name: 'Konfetti', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 4, y: 4, z: 1, axis: 'x', dir: 6, color: 'green' },
      { type: 'source', x: 6, y: 2, z: 4, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, y: 2, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'z', rot: 3 },
      { type: 'target', x: 4, y: 2, z: 4, color: 'white' },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6 },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'x', rot: 1 },
      { type: 'prism', x: 4, y: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 3, y: 4, z: 0, color: 'green' },
      { type: 'target', x: 0, y: 4, z: 6, color: 'red' },
    ],
    solution: { '4,2,1': 3, '0,2,4': 1, '4,0,1': 3, '4,2,0': 4 },
  },
  // Platz im Spiel: nach „Konfetti“
  {
    // Lösung: Spiegel (3,3,1) Achse z rot 3 · Spiegel (2,3,3) Achse y rot 2 ·
    //   Spiegel (3,2,3) Achse y rot 3 · Prisma (3,4,1) Achse x rot 0 · Spiegel (1,0,3) Achse z rot 0 ·
    //   Spiegel (0,1,3) Achse z rot 2
    // Generator leicht-abschalten, Seed 80177, Ziel 37–42,5, Stand b80d994 · Würfel „leicht“
    name: 'Strickjacke', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 3, z: 1, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, y: 3, z: 1, axis: 'z', rot: 2 },
      { type: 'target', x: 3, y: 0, z: 1, color: 'yellow' },
      { type: 'source', x: 3, y: 4, z: 3, axis: 'z', dir: 3, color: 'yellow' },
      { type: 'mirror', x: 2, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 3, rot: 0 },
      { type: 'prism', x: 3, y: 4, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 1, y: 4, z: 2, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 3 },
      { type: 'target', x: 1, y: 4, z: 3, color: 'red' },
    ],
    solution: { '3,3,1': 3, '2,3,3': 2, '3,2,3': 3, '3,4,1': 0, '1,0,3': 0, '0,1,3': 2 },
  },
  // Platz im Spiel: nach „Strickjacke“
  {
    // Lösung: Spiegel (2,0,4) Achse y rot 1 · Spiegel (2,0,2) Achse y rot 1 ·
    //   Spiegel (0,0,2) Achse z rot 1 · Spiegel (0,4,2) Achse x rot 3 · Spiegel (0,4,0) Achse y rot 3 ·
    //   Spiegel (1,4,0) Achse z rot 1
    // Generator leicht, Seed 60111, Stand 74361c6 · Würfel „leicht“
    name: 'Jojo', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 0, z: 4, dir: 4 },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 0, axis: 'z', rot: 2 },
      { type: 'filter', x: 1, y: 1, z: 0, color: 'blue' },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 1, y: 0, z: 4, color: 'blue' },
    ],
    solution: { '2,0,4': 1, '2,0,2': 1, '0,0,2': 1, '0,4,2': 3, '0,4,0': 3, '1,4,0': 1 },
  },
  // Platz im Spiel: nach „Jojo“
  {
    // Lösung: Prisma (1,2,2) Achse y rot 7 · Spiegel (5,2,2) Achse y rot 1 ·
    //   Spiegel (1,2,0) Achse y rot 3 · Spiegel (3,2,0) Achse y rot 1 · Spiegel (3,2,6) Achse x rot 3 ·
    //   Spiegel (3,1,6) Achse z rot 1
    // Generator leicht-falle, Seed 80999, Ziel 37–42,5, Stand b80d994 · Würfel „leicht“
    name: 'Türklinke', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 1, y: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 1, y: 2, z: 2, rot: 4 },
      { type: 'mirror', x: 5, y: 2, z: 2, rot: 3 },
      { type: 'target', x: 5, y: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 1, y: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 6, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 1, z: 6, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 4, y: 0, z: 6, color: 'red' },
    ],
    solution: { '1,2,2': 7, '5,2,2': 1, '1,2,0': 3, '3,2,0': 1, '3,2,6': 3, '3,1,6': 1 },
  },
  // Platz im Spiel: nach „Türklinke“
  {
    // Lösung: Prisma (3,0,4) Achse y rot 3 · Spiegel (3,0,6) Achse y rot 1 ·
    //   Spiegel (2,0,4) Achse y rot 3 · Spiegel (2,0,5) Achse y rot 3 · Spiegel (1,3,5) Achse x rot 3 ·
    //   Spiegel (1,0,5) Achse z rot 1
    // Generator leicht-falle, Seed 81291, Ziel 37–42,5, Stand b80d994 · Würfel „leicht“
    name: 'Wecker', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 0, z: 4, dir: 4, color: 'magenta' },
      { type: 'prism', x: 3, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 6, rot: 2 },
      { type: 'target', x: 5, y: 0, z: 6, color: 'red' },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 1 },
      { type: 'source', x: 1, y: 3, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 1, y: 3, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 1, y: 4, z: 5, color: 'red' },
      { type: 'target', x: 1, y: 3, z: 2, color: 'blue' },
    ],
    solution: { '3,0,4': 3, '3,0,6': 1, '2,0,4': 3, '2,0,5': 3, '1,3,5': 3, '1,0,5': 1 },
  },
  // Platz im Spiel: nach „Wecker“
  {
    // Lösung: Prisma (4,2,1) Achse y rot 6 · Spiegel (5,2,1) Achse y rot 1 ·
    //   Prisma (5,0,3) Achse x rot 2 · Spiegel (4,3,1) Achse y rot 1
    // Generator leicht-sammelstelle, Seed 20149, Stand 33f26f8, gesenkt um 2 · Würfel „leicht“
    name: 'Kommode', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'prism', x: 4, y: 2, z: 1, rot: 1 },
      { type: 'source', x: 0, y: 2, z: 5, dir: 7, color: 'green' },
      { type: 'source', x: 5, y: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 0 },
      { type: 'target', x: 4, y: 2, z: 0, color: 'green' },
      { type: 'target', x: 5, y: 2, z: 0, color: 'blue' },
      { type: 'source', x: 5, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 5, y: 0, z: 3, axis: 'x', rot: 6 },
      { type: 'mirror', x: 4, y: 3, z: 1, rot: 0 },
      { type: 'target', x: 4, y: 4, z: 0, color: 'blue' },
    ],
    solution: { '4,2,1': 6, '5,2,1': 1, '5,0,3': 2, '4,3,1': 1 },
  },
  // Platz im Spiel: nach „Kommode“
  {
    // Lösung: Spiegel (4,0,6) Achse z rot 3 · Prisma (2,1,6) Achse x rot 2 ·
    //   Spiegel (4,3,6) Achse z rot 3 · Spiegel (2,3,4) Achse y rot 3 · Spiegel (2,3,6) Achse z rot 3 ·
    //   Spiegel (5,3,6) Achse z rot 1
    // Generator leicht, Seed 60073, Stand 74361c6 · Würfel „leicht“
    name: 'Spielzeugauto', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 0, z: 6, dir: 0, color: 'red' },
      { type: 'source', x: 2, y: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 4, y: 0, z: 6, axis: 'z', rot: 1 },
      { type: 'prism', x: 2, y: 1, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 3, z: 6, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 6, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 4, z: 4, color: 'blue' },
      { type: 'target', x: 5, y: 4, z: 6, color: 'green' },
      { type: 'target', x: 5, y: 0, z: 6, color: 'red' },
    ],
    solution: { '4,0,6': 3, '2,1,6': 2, '4,3,6': 3, '2,3,4': 3, '2,3,6': 3, '5,3,6': 1 },
  },
  // Platz im Spiel: nach „Spielzeugauto“
  {
    // Lösung: Spiegel (3,3,1) Achse y rot 3 · Spiegel (3,3,5) Achse y rot 3 ·
    //   Prisma (4,2,5) Achse z rot 4 · Spiegel (3,2,5) Achse y rot 3 · Spiegel (3,2,6) Achse y rot 3
    // Generator leicht-mischziel, Seed 20341, Stand 33f26f8, gesenkt um 0 · Würfel „leicht“
    name: 'Picknick', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 6, y: 3, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, y: 3, z: 5, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 5, rot: 0 },
      { type: 'target', x: 5, y: 3, z: 1, color: 'white' },
      { type: 'source', x: 4, y: 0, z: 5, axis: 'x', dir: 2 },
      { type: 'prism', x: 4, y: 2, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 6, rot: 0 },
      { type: 'target', x: 3, y: 4, z: 6, color: 'blue' },
      { type: 'target', x: 0, y: 2, z: 6, color: 'green' },
    ],
    solution: { '3,3,1': 3, '3,3,5': 3, '4,2,5': 4, '3,2,5': 3, '3,2,6': 3 },
  },
  // Platz im Spiel: nach „Picknick“
  {
    // Lösung: Prisma (3,1,1) Achse y rot 1 · Spiegel (4,1,0) Achse y rot 0 ·
    //   Spiegel (6,1,4) Achse y rot 2 · Spiegel (5,1,5) Achse x rot 1 · Spiegel (4,2,5) Achse y rot 1 ·
    //   Spiegel (4,3,4) Achse x rot 0
    // Generator leicht-sammelstelle, Seed 20385, Stand 33f26f8, gesenkt um 2 · Würfel „leicht“
    name: 'Stockwerk', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'prism', x: 3, y: 1, z: 1, rot: 6 },
      { type: 'source', x: 6, y: 1, z: 2, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 4, y: 1, z: 0, rot: 2 },
      { type: 'source', x: 0, y: 1, z: 1, dir: 0, color: 'blue' },
      { type: 'target', x: 4, y: 1, z: 1, color: 'red' },
      { type: 'target', x: 3, y: 1, z: 4, color: 'blue' },
      { type: 'mirror', x: 6, y: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 2, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 6, y: 0, z: 3, color: 'green' },
    ],
    solution: { '3,1,1': 1, '4,1,0': 0, '6,1,4': 2, '5,1,5': 1, '4,2,5': 1, '4,3,4': 0 },
  },
  // Platz im Spiel: nach „Stockwerk“
  {
    // Lösung: Spiegel (4,0,1) Achse x rot 3 · Spiegel (4,1,4) Achse z rot 3 ·
    //   Spiegel (1,0,6) Achse y rot 0 · Spiegel (0,0,5) Achse y rot 2 · Prisma (6,2,1) Achse z rot 7
    // Generator leicht-mischziel, Seed 60390, Stand 74361c6 · Würfel „leicht“
    name: 'Notizbuch', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 4, y: 4, z: 1, axis: 'x', dir: 6, color: 'green' },
      { type: 'source', x: 6, y: 1, z: 4, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 0, z: 4, color: 'white' },
      { type: 'source', x: 6, y: 0, z: 1, dir: 3 },
      { type: 'mirror', x: 1, y: 0, z: 6, rot: 3 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 0 },
      { type: 'prism', x: 6, y: 2, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 6, y: 4, z: 5, color: 'red' },
    ],
    solution: { '4,0,1': 3, '4,1,4': 3, '1,0,6': 0, '0,0,5': 2, '6,2,1': 7 },
  },
  // Platz im Spiel: nach „Notizbuch“
  {
    // Lösung: Spiegel (2,2,2) Achse x rot 1 · Spiegel (2,2,6) Achse y rot 0 ·
    //   Spiegel (6,2,2) Achse y rot 2 · Spiegel (4,4,2) Achse z rot 0 · Spiegel (4,0,2) Achse x rot 3 ·
    //   Spiegel (2,4,4) Achse z rot 1
    // Generator leicht-abschalten, Seed 80394, Ziel 37–42,5, Stand b80d994 · Würfel „leicht“
    name: 'Toaster', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 2, z: 0, dir: 1, color: 'blue' },
      { type: 'mirror', x: 2, y: 2, z: 2, axis: 'x', rot: 3 },
      { type: 'target', x: 4, y: 2, z: 0, color: 'blue' },
      { type: 'source', x: 0, y: 2, z: 4, dir: 1, color: 'blue' },
      { type: 'mirror', x: 2, y: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 4, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 0, y: 4, z: 2, color: 'blue' },
    ],
    solution: { '2,2,2': 1, '2,2,6': 0, '6,2,2': 2, '4,4,2': 0, '4,0,2': 3, '2,4,4': 1 },
  },
  // Platz im Spiel: nach „Toaster“
  {
    // Lösung: Spiegel (3,2,5) Achse y rot 1 · Spiegel (5,3,4) Achse y rot 1 ·
    //   Spiegel (5,2,5) Achse y rot 3 · Prisma (5,4,2) Achse x rot 3 · Spiegel (5,4,1) Achse x rot 1
    // Generator leicht-abschalten, Seed 80566, Ziel 37–42,5, Stand b80d994 · Würfel „leicht“
    name: 'Nachttisch', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 5, y: 4, z: 5, axis: 'z', dir: 3 },
      { type: 'mirror', x: 3, y: 2, z: 5, rot: 3 },
      { type: 'target', x: 4, y: 1, z: 5, color: 'white' },
      { type: 'source', x: 4, y: 4, z: 4, axis: 'z', dir: 1 },
      { type: 'mirror', x: 5, y: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 5, rot: 1 },
      { type: 'source', x: 5, y: 0, z: 2, axis: 'x', dir: 2 },
      { type: 'prism', x: 5, y: 4, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 1, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 2, z: 1, color: 'blue' },
      { type: 'target', x: 3, y: 0, z: 3, color: 'white' },
    ],
    solution: { '3,2,5': 1, '5,3,4': 1, '5,2,5': 3, '5,4,2': 3, '5,4,1': 1 },
  },
  // Platz im Spiel: nach „Nachttisch“
  {
    // Lösung: Spiegel (1,4,2) Achse z rot 1 · Spiegel (1,1,3) Achse y rot 3 ·
    //   Prisma (1,2,4) Achse x rot 2 · Spiegel (1,3,4) Achse z rot 1 · Spiegel (0,3,4) Achse y rot 3
    // Generator leicht-mischziel, Seed 80408, Ziel 37–42,5, Stand b80d994 · Würfel „leicht“
    name: 'Badewanne', dim: 3, size: 7, height: 5, grad: 'leicht',
    elements: [
      { type: 'source', x: 0, y: 1, z: 2, dir: 0, color: 'blue' },
      { type: 'source', x: 0, y: 4, z: 2, dir: 0, color: 'green' },
      { type: 'mirror', x: 1, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 1, y: 1, z: 2, color: 'cyan' },
      { type: 'source', x: 2, y: 0, z: 3, axis: 'z', dir: 5 },
      { type: 'mirror', x: 1, y: 1, z: 3, rot: 2 },
      { type: 'prism', x: 1, y: 2, z: 4, axis: 'x', rot: 4 },
      { type: 'mirror', x: 1, y: 3, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 4, z: 1, color: 'blue' },
      { type: 'target', x: 2, y: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 1, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 4, rot: 2 },
      { type: 'target', x: 0, y: 3, z: 5, color: 'green' },
    ],
    solution: { '1,4,2': 1, '1,1,3': 3, '1,2,4': 2, '1,3,4': 1, '0,3,4': 3 },
  },
  // Platz im Spiel: nach „Badewanne“
  {
    // Lösung: Spiegel (5,0,6) Achse y rot 1 · Spiegel (5,0,4) Achse y rot 1 ·
    //   Spiegel (3,0,4) Achse y rot 1 · Spiegel (3,0,6) Achse y rot 3 · Prisma (5,0,1) Achse y rot 2 ·
    //   Spiegel (6,0,2) Achse z rot 3
    // Generator mittel-abzaehlen, Seed 20069, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Zither', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, y: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 6, rot: 0 },
      { type: 'source', x: 5, y: 0, z: 0, dir: 2 },
      { type: 'source', x: 6, y: 0, z: 6, dir: 4, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 4, dir: 0, color: 'green' },
      { type: 'target', x: 3, y: 0, z: 0, color: 'cyan' },
      { type: 'target', x: 6, y: 0, z: 4, color: 'green' },
      { type: 'target', x: 1, y: 0, z: 6, color: 'green' },
      { type: 'prism', x: 5, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 3, rot: 0, fixed: true },
      { type: 'target', x: 4, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 6, y: 2, z: 2, color: 'red' },
    ],
    solution: { '5,0,6': 1, '5,0,4': 1, '3,0,4': 1, '3,0,6': 3, '5,0,1': 2, '6,0,2': 3 },
  },
  // Platz im Spiel: nach „Zither“
  {
    // Lösung: Prisma (1,1,0) Achse y rot 1 · Spiegel (0,1,1) Achse y rot 2 ·
    //   Spiegel (1,1,1) Achse x rot 3 · Spiegel (1,0,1) Achse x rot 3 · Spiegel (1,0,5) Achse x rot 1 ·
    //   Spiegel (1,3,5) Achse z rot 3 · Spiegel (3,3,5) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60204, Stand 74361c6 · Würfel „mittel“
    name: 'Gouache', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 1, z: 0, rot: 2 },
      { type: 'source', x: 0, y: 1, z: 0, dir: 0, color: 'red' },
      { type: 'source', x: 5, y: 1, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 0, y: 1, z: 1, rot: 3 },
      { type: 'target', x: 6, y: 1, z: 0, color: 'red' },
      { type: 'target', x: 4, y: 1, z: 3, color: 'green' },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'z', rot: 3 },
      { type: 'target', x: 3, y: 0, z: 5, color: 'blue' },
    ],
    solution: { '1,1,0': 1, '0,1,1': 2, '1,1,1': 3, '1,0,1': 3, '1,0,5': 1, '1,3,5': 3, '3,3,5': 1 },
  },
  // Platz im Spiel: nach „Gouache“
  {
    // Lösung: Spiegel (0,4,5) Achse y rot 3 · Spiegel (0,4,3) Achse y rot 1 ·
    //   Spiegel (2,4,3) Achse y rot 1 · Spiegel (2,4,5) Achse y rot 1 · Prisma (4,4,3) Achse y rot 4 ·
    //   Spiegel (1,4,0) Achse x rot 1
    // Generator mittel-abzaehlen, Seed 60273, Stand 74361c6 · Würfel „mittel“
    name: 'Engobe', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, y: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 2 },
      { type: 'source', x: 0, y: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 2, y: 4, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, y: 4, z: 3, dir: 4, color: 'cyan' },
      { type: 'target', x: 6, y: 4, z: 5, color: 'cyan' },
      { type: 'target', x: 2, y: 4, z: 2, color: 'green' },
      { type: 'target', x: 0, y: 4, z: 6, color: 'green' },
      { type: 'prism', x: 4, y: 4, z: 3, rot: 5 },
      { type: 'mirror', x: 1, y: 4, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 0, rot: 2, fixed: true },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 5, y: 2, z: 0, color: 'blue' },
    ],
    solution: { '0,4,5': 3, '0,4,3': 1, '2,4,3': 1, '2,4,5': 1, '4,4,3': 4, '1,4,0': 1 },
  },
  // Platz im Spiel: nach „Engobe“
  {
    // Lösung: Prisma (5,0,6) Achse z rot 7 · Spiegel (1,2,4) Achse x rot 3 ·
    //   Prisma (0,1,4) Achse z rot 5 · Spiegel (5,3,6) Achse z rot 3 · Spiegel (6,3,6) Achse y rot 3
    // Generator mittel, Seed 20490, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Tympanon', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 0, z: 6, dir: 0 },
      { type: 'source', x: 5, y: 2, z: 0, dir: 3 },
      { type: 'prism', x: 5, y: 0, z: 6, axis: 'z', rot: 6 },
      { type: 'mirror', x: 1, y: 2, z: 4, axis: 'x', rot: 0 },
      { type: 'prism', x: 0, y: 1, z: 4, axis: 'z', rot: 4 },
      { type: 'mirror', x: 0, y: 3, z: 4, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 3, z: 4, color: 'magenta' },
      { type: 'target', x: 6, y: 0, z: 6, color: 'blue' },
      { type: 'target', x: 6, y: 1, z: 6, color: 'green' },
      { type: 'mirror', x: 5, y: 3, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 6, rot: 2 },
    ],
    solution: { '5,0,6': 7, '1,2,4': 3, '0,1,4': 5, '5,3,6': 3, '6,3,6': 3 },
  },
  // Platz im Spiel: nach „Tympanon“
  {
    // Lösung: Spiegel (0,2,3) Achse y rot 1 · Spiegel (0,2,5) Achse y rot 3 ·
    //   Spiegel (4,2,5) Achse y rot 1 · Spiegel (4,2,3) Achse y rot 1 · Prisma (4,2,1) Achse y rot 2 ·
    //   Spiegel (1,2,4) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 22478, Stand 1df6ca5, gesenkt um 3 · Würfel „mittel“
    name: 'Ankerwinde', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 3, rot: 2 },
      { type: 'source', x: 4, y: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, y: 2, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, y: 2, z: 5, dir: 4, color: 'cyan' },
      { type: 'target', x: 5, y: 2, z: 3, color: 'green' },
      { type: 'target', x: 4, y: 2, z: 6, color: 'green' },
      { type: 'target', x: 0, y: 2, z: 1, color: 'cyan' },
      { type: 'prism', x: 4, y: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 0, y: 0, z: 5, color: 'blue' },
    ],
    solution: { '0,2,3': 1, '0,2,5': 3, '4,2,5': 1, '4,2,3': 1, '4,2,1': 2, '1,2,4': 3 },
  },
  // Platz im Spiel: nach „Ankerwinde“
  {
    // Lösung: Spiegel (1,1,2) Achse x rot 1 · Spiegel (0,2,0) Achse y rot 3 ·
    //   Spiegel (1,2,0) Achse y rot 1 · Spiegel (1,0,2) Achse z rot 1 · Prisma (0,2,5) Achse y rot 7 ·
    //   Spiegel (2,0,3) Achse y rot 0
    // Generator mittel-abschalten, Seed 20506, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Graveur', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 1, y: 1, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 1, y: 1, z: 2, axis: 'x', rot: 0 },
      { type: 'target', x: 1, y: 2, z: 2, color: 'red' },
      { type: 'source', x: 0, y: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 0, z: 2, color: 'red' },
      { type: 'prism', x: 0, y: 2, z: 5, rot: 3 },
      { type: 'target', x: 4, y: 2, z: 5, color: 'blue' },
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 3 },
      { type: 'source', x: 5, y: 0, z: 0, dir: 3, color: 'cyan' },
      { type: 'target', x: 0, y: 3, z: 0, color: 'cyan' },
    ],
    solution: { '1,1,2': 1, '0,2,0': 3, '1,2,0': 1, '1,0,2': 1, '0,2,5': 7, '2,0,3': 0 },
  },
  // Platz im Spiel: nach „Graveur“
  {
    // Lösung: Spiegel (2,1,3) Achse z rot 3 · Spiegel (2,0,5) Achse y rot 0 ·
    //   Spiegel (3,0,4) Achse y rot 2 · Spiegel (2,4,3) Achse z rot 3 · Spiegel (5,0,2) Achse y rot 2 ·
    //   Spiegel (2,1,6) Achse y rot 1 · Spiegel (3,4,2) Achse x rot 1
    // Generator mittel-abschalten, Seed 60272, Stand 74361c6 · Würfel „mittel“
    name: 'Sattler', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 1, z: 3, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 2, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'target', x: 2, y: 0, z: 3, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 3, dir: 1, color: 'cyan' },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'z', rot: 1 },
      { type: 'target', x: 6, y: 4, z: 3, color: 'cyan' },
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 0 },
      { type: 'source', x: 3, y: 0, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 2, fixed: true },
      { type: 'mirror', x: 3, y: 0, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 3, y: 4, z: 2, axis: 'x', rot: 0 },
      { type: 'target', x: 6, y: 1, z: 2, color: 'red' },
    ],
    solution: { '2,1,3': 3, '2,0,5': 0, '3,0,4': 2, '2,4,3': 3, '5,0,2': 2, '2,1,6': 1, '3,4,2': 1 },
  },
  // Platz im Spiel: nach „Sattler“
  {
    // Lösung: Prisma (3,2,3) Achse y rot 5 · Spiegel (5,2,1) Achse y rot 2 ·
    //   Spiegel (4,2,4) Achse y rot 2 · Spiegel (1,2,1) Achse x rot 3 · Spiegel (0,3,1) Achse y rot 2
    // Generator mittel-sammelstelle, Seed 60158, Stand 74361c6 · Würfel „mittel“
    name: 'Skulptur', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, y: 2, z: 3, rot: 0 },
      { type: 'source', x: 4, y: 2, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 0 },
      { type: 'source', x: 2, y: 2, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 4, y: 2, z: 4, rot: 3 },
      { type: 'target', x: 0, y: 2, z: 3, color: 'red' },
      { type: 'target', x: 3, y: 2, z: 1, color: 'cyan' },
      { type: 'source', x: 1, y: 0, z: 1, axis: 'x', dir: 2, color: 'green' },
      { type: 'mirror', x: 1, y: 2, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 1, axis: 'z', rot: 0, fixed: true },
      { type: 'mirror', x: 1, y: 2, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 3, y: 2, z: 0, color: 'green' },
    ],
    solution: { '3,2,3': 5, '5,2,1': 2, '4,2,4': 2, '1,2,1': 3, '0,3,1': 2 },
  },
  // Platz im Spiel: nach „Skulptur“
  {
    // Lösung: Prisma (0,2,2) Achse y rot 1 · Spiegel (5,2,2) Achse z rot 3 ·
    //   Spiegel (5,4,2) Achse z rot 1 · Prisma (5,0,2) Achse z rot 7 · Spiegel (6,0,2) Achse y rot 3
    // Generator mittel-sammelstelle, Seed 60505, Stand 74361c6 · Würfel „mittel“
    name: 'Traktor', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, y: 2, z: 2, rot: 5 },
      { type: 'source', x: 2, y: 2, z: 0, dir: 3, color: 'green' },
      { type: 'source', x: 0, y: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 3, y: 2, z: 5, color: 'green' },
      { type: 'target', x: 0, y: 2, z: 5, color: 'blue' },
      { type: 'source', x: 1, y: 4, z: 2, axis: 'z', dir: 1 },
      { type: 'mirror', x: 5, y: 2, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'prism', x: 5, y: 0, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 2, rot: 1 },
      { type: 'target', x: 6, y: 2, z: 2, color: 'red' },
      { type: 'target', x: 6, y: 0, z: 0, color: 'blue' },
      { type: 'target', x: 3, y: 4, z: 2, color: 'red' },
    ],
    solution: { '0,2,2': 1, '5,2,2': 3, '5,4,2': 1, '5,0,2': 7, '6,0,2': 3 },
  },
  // Platz im Spiel: nach „Traktor“
  {
    // Lösung: Spiegel (1,3,3) Achse y rot 1 · Spiegel (1,3,6) Achse y rot 3 ·
    //   Spiegel (5,3,6) Achse y rot 1 · Spiegel (5,3,3) Achse y rot 1 · Prisma (5,3,1) Achse y rot 1 ·
    //   Spiegel (6,3,2) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 22726, Stand 1df6ca5, gesenkt um 3 · Würfel „mittel“
    name: 'Fanfare', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 5, y: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 0 },
      { type: 'source', x: 0, y: 3, z: 3, dir: 0, color: 'blue' },
      { type: 'source', x: 6, y: 3, z: 6, dir: 4, color: 'magenta' },
      { type: 'source', x: 5, y: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 1, y: 3, z: 0, color: 'magenta' },
      { type: 'target', x: 6, y: 3, z: 3, color: 'blue' },
      { type: 'target', x: 0, y: 3, z: 6, color: 'blue' },
      { type: 'prism', x: 5, y: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 6, y: 1, z: 6, color: 'green' },
    ],
    solution: { '1,3,3': 1, '1,3,6': 3, '5,3,6': 1, '5,3,3': 1, '5,3,1': 1, '6,3,2': 1 },
  },
  // Platz im Spiel: nach „Fanfare“
  {
    // Lösung: Spiegel (0,0,2) Achse z rot 1 · Spiegel (2,1,2) Achse y rot 1 ·
    //   Spiegel (4,1,2) Achse z rot 1 · Prisma (3,0,1) Achse y rot 5 · Spiegel (2,0,0) Achse x rot 2
    // Generator mittel-mischziel, Seed 20236, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Architrav', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 3, z: 2, axis: 'x', dir: 6, color: 'yellow' },
      { type: 'source', x: 2, y: 1, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'z', rot: 3 },
      { type: 'target', x: 4, y: 0, z: 2, color: 'white' },
      { type: 'source', x: 4, y: 0, z: 0, dir: 3 },
      { type: 'prism', x: 3, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 0, z: 1, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 1, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 0, z: 0, color: 'blue' },
      { type: 'target', x: 0, y: 2, z: 4, color: 'green' },
      { type: 'target', x: 6, y: 2, z: 1, color: 'red' },
    ],
    solution: { '0,0,2': 1, '2,1,2': 1, '4,1,2': 1, '3,0,1': 5, '2,0,0': 2 },
  },
  // Platz im Spiel: nach „Architrav“
  {
    // Lösung: Prisma (5,0,2) Achse y rot 0 · Spiegel (5,0,5) Achse y rot 1 ·
    //   Spiegel (4,0,2) Achse y rot 3 · Prisma (6,2,3) Achse x rot 6 · Spiegel (6,1,4) Achse x rot 0
    // Generator mittel-sammelstelle, Seed 20888, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Ochsenauge', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, y: 0, z: 2, rot: 5 },
      { type: 'source', x: 6, y: 0, z: 5, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, y: 0, z: 5, rot: 2 },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 0 },
      { type: 'target', x: 6, y: 0, z: 3, color: 'cyan' },
      { type: 'target', x: 6, y: 0, z: 2, color: 'green' },
      { type: 'source', x: 6, y: 4, z: 5, axis: 'x', dir: 5, color: 'cyan' },
      { type: 'prism', x: 6, y: 2, z: 3, axis: 'x', rot: 4 },
      { type: 'mirror', x: 6, y: 1, z: 4, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 5, y: 4, z: 6, color: 'blue' },
    ],
    solution: { '5,0,2': 0, '5,0,5': 1, '4,0,2': 3, '6,2,3': 6, '6,1,4': 0 },
  },
  // Platz im Spiel: nach „Ochsenauge“
  {
    // Lösung: Prisma (0,0,2) Achse y rot 1 · Spiegel (2,0,0) Achse y rot 0 ·
    //   Spiegel (0,0,3) Achse x rot 1 · Spiegel (0,1,3) Achse x rot 1 · Spiegel (0,1,6) Achse x rot 1 ·
    //   Spiegel (0,2,6) Achse x rot 3
    // Generator mittel-sammelstelle, Seed 60863, Stand 74361c6 · Würfel „mittel“
    name: 'Droschke', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, y: 0, z: 2, rot: 3 },
      { type: 'source', x: 6, y: 0, z: 4, dir: 5, color: 'green' },
      { type: 'mirror', x: 2, y: 0, z: 0, rot: 2 },
      { type: 'source', x: 0, y: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 4, y: 0, z: 6, color: 'green' },
      { type: 'target', x: 5, y: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 0, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 5, y: 0, z: 4, color: 'blue' },
    ],
    solution: { '0,0,2': 1, '2,0,0': 0, '0,0,3': 1, '0,1,3': 1, '0,1,6': 1, '0,2,6': 3 },
  },
  // Platz im Spiel: nach „Droschke“
  {
    // Lösung: Spiegel (3,0,5) Achse y rot 1 · Spiegel (0,0,5) Achse y rot 3 ·
    //   Spiegel (0,0,1) Achse y rot 1 · Spiegel (3,0,1) Achse y rot 1 · Prisma (5,0,1) Achse y rot 5 ·
    //   Spiegel (4,0,0) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 21924, Stand 1df6ca5, gesenkt um 3 · Würfel „mittel“
    name: 'Wallfahrtskirche', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 0 },
      { type: 'source', x: 3, y: 0, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, y: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, y: 0, z: 1, dir: 4, color: 'yellow' },
      { type: 'target', x: 3, y: 0, z: 0, color: 'red' },
      { type: 'target', x: 6, y: 0, z: 5, color: 'yellow' },
      { type: 'target', x: 0, y: 0, z: 6, color: 'red' },
      { type: 'prism', x: 5, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 0, axis: 'z', rot: 2, fixed: true },
      { type: 'target', x: 5, y: 3, z: 0, color: 'green' },
    ],
    solution: { '3,0,5': 1, '0,0,5': 3, '0,0,1': 1, '3,0,1': 1, '5,0,1': 5, '4,0,0': 3 },
  },
  // Platz im Spiel: nach „Wallfahrtskirche“
  {
    // Lösung: Spiegel (1,2,2) Achse z rot 1 · Spiegel (1,0,1) Achse y rot 1 ·
    //   Spiegel (4,2,2) Achse y rot 3 · Spiegel (1,4,2) Achse x rot 3 · Spiegel (1,4,1) Achse y rot 1 ·
    //   Spiegel (0,4,1) Achse z rot 3 · Spiegel (0,2,1) Achse x rot 1
    // Generator mittel-mischziel, Seed 20826, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Tribüne', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 2, z: 2, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 1, y: 2, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 1, rot: 3 },
      { type: 'target', x: 1, y: 0, z: 2, color: 'white' },
      { type: 'source', x: 4, y: 2, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 1, axis: 'x', rot: 3 },
      { type: 'target', x: 0, y: 2, z: 0, color: 'green' },
    ],
    solution: { '1,2,2': 1, '1,0,1': 1, '4,2,2': 3, '1,4,2': 3, '1,4,1': 1, '0,4,1': 3, '0,2,1': 1 },
  },
  // Platz im Spiel: nach „Tribüne“
  {
    // Lösung: Spiegel (2,0,3) Achse y rot 1 · Spiegel (5,0,3) Achse y rot 1 ·
    //   Spiegel (5,0,0) Achse y rot 3 · Spiegel (2,0,0) Achse y rot 1 · Prisma (2,0,5) Achse y rot 5 ·
    //   Spiegel (0,0,3) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 20201, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Apsis', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 0, rot: 3 },
      { type: 'source', x: 6, y: 0, z: 3, dir: 4, color: 'blue' },
      { type: 'source', x: 0, y: 0, z: 0, dir: 0 },
      { type: 'source', x: 2, y: 0, z: 6, dir: 6 },
      { type: 'target', x: 1, y: 0, z: 3, color: 'blue' },
      { type: 'target', x: 5, y: 0, z: 5, color: 'white' },
      { type: 'target', x: 6, y: 0, z: 0, color: 'blue' },
      { type: 'prism', x: 2, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 0, y: 4, z: 3, color: 'green' },
      { type: 'target', x: 0, y: 4, z: 5, color: 'red' },
    ],
    solution: { '2,0,3': 1, '5,0,3': 1, '5,0,0': 3, '2,0,0': 1, '2,0,5': 5, '0,0,3': 1 },
  },
  // Platz im Spiel: nach „Apsis“
  {
    // Lösung: Prisma (1,2,3) Achse y rot 5 · Spiegel (4,2,3) Achse y rot 3 ·
    //   Spiegel (0,2,3) Achse z rot 1 · Spiegel (0,3,3) Achse x rot 1 · Spiegel (0,3,6) Achse y rot 1 ·
    //   Spiegel (3,3,0) Achse y rot 3 · Spiegel (6,3,0) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60117, Stand 74361c6 · Würfel „mittel“
    name: 'Posamenter', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 2, z: 3, rot: 3 },
      { type: 'source', x: 0, y: 2, z: 4, dir: 7, color: 'yellow' },
      { type: 'source', x: 4, y: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 4, y: 2, z: 3, rot: 2 },
      { type: 'target', x: 0, y: 2, z: 2, color: 'green' },
      { type: 'target', x: 1, y: 2, z: 1, color: 'blue' },
      { type: 'mirror', x: 0, y: 2, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 3, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 3, y: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 0, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 0, z: 0, color: 'red' },
    ],
    solution: { '1,2,3': 5, '4,2,3': 3, '0,2,3': 1, '0,3,3': 1, '0,3,6': 1, '3,3,0': 3, '6,3,0': 1 },
  },
  // Platz im Spiel: nach „Posamenter“
  {
    // Lösung: Prisma (5,0,3) Achse y rot 7 · Spiegel (5,0,0) Achse y rot 1 ·
    //   Spiegel (4,0,0) Achse z rot 1 · Spiegel (4,4,0) Achse z rot 3 · Spiegel (6,4,0) Achse z rot 1 ·
    //   Spiegel (6,3,0) Achse z rot 3 · Spiegel (1,3,0) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60326, Stand 74361c6 · Würfel „mittel“
    name: 'Volute', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, y: 0, z: 3, rot: 6 },
      { type: 'source', x: 2, y: 0, z: 0, dir: 1, color: 'yellow' },
      { type: 'source', x: 6, y: 0, z: 4, dir: 5, color: 'blue' },
      { type: 'target', x: 6, y: 0, z: 2, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 3, color: 'blue' },
      { type: 'mirror', x: 5, y: 0, z: 0, rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 0, axis: 'z', rot: 3 },
      { type: 'target', x: 1, y: 4, z: 0, color: 'red' },
      { type: 'blocker', x: 2, y: 4, z: 0 },
    ],
    solution: { '5,0,3': 7, '5,0,0': 1, '4,0,0': 1, '4,4,0': 3, '6,4,0': 1, '6,3,0': 3, '1,3,0': 1 },
  },
  // Platz im Spiel: nach „Volute“
  {
    // Lösung: Spiegel (0,0,1) Achse y rot 1 · Spiegel (2,0,1) Achse y rot 1 ·
    //   Spiegel (2,0,5) Achse y rot 1 · Spiegel (0,0,5) Achse y rot 3 · Prisma (4,0,1) Achse y rot 3 ·
    //   Spiegel (1,0,4) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 60025, Stand 74361c6 · Würfel „mittel“
    name: 'Bugspriet', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 1 },
      { type: 'source', x: 0, y: 0, z: 0, dir: 2 },
      { type: 'source', x: 2, y: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 6, y: 0, z: 1, dir: 4, color: 'cyan' },
      { type: 'target', x: 5, y: 0, z: 5, color: 'white' },
      { type: 'target', x: 0, y: 0, z: 6, color: 'blue' },
      { type: 'target', x: 2, y: 0, z: 0, color: 'blue' },
      { type: 'prism', x: 4, y: 0, z: 1, rot: 6 },
      { type: 'mirror', x: 1, y: 0, z: 4, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 3, y: 4, z: 6, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 5, y: 2, z: 6, color: 'green' },
    ],
    solution: { '0,0,1': 1, '2,0,1': 1, '2,0,5': 1, '0,0,5': 3, '4,0,1': 3, '1,0,4': 1 },
  },
  // Platz im Spiel: nach „Bugspriet“
  {
    // Lösung: Spiegel (5,2,4) Achse x rot 1 · Spiegel (6,2,1) Achse y rot 1 ·
    //   Spiegel (6,2,6) Achse y rot 3 · Spiegel (5,2,3) Achse x rot 3 · Spiegel (6,4,4) Achse z rot 0 ·
    //   Spiegel (6,3,3) Achse y rot 1 · Spiegel (3,2,5) Achse x rot 2
    // Generator mittel-abschalten, Seed 60892, Stand 74361c6 · Würfel „mittel“
    name: 'Sänfte', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 5, y: 4, z: 4, axis: 'x', dir: 6, color: 'yellow' },
      { type: 'mirror', x: 5, y: 2, z: 4, axis: 'x', rot: 2 },
      { type: 'target', x: 5, y: 2, z: 6, color: 'yellow' },
      { type: 'source', x: 0, y: 2, z: 1, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 6, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 3, axis: 'x', rot: 2 },
      { type: 'target', x: 5, y: 3, z: 3, color: 'yellow' },
      { type: 'source', x: 4, y: 0, z: 6, axis: 'z', dir: 7, color: 'blue' },
      { type: 'mirror', x: 6, y: 4, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 4, y: 2, z: 0, color: 'blue' },
    ],
    solution: { '5,2,4': 1, '6,2,1': 1, '6,2,6': 3, '5,2,3': 3, '6,4,4': 0, '6,3,3': 1, '3,2,5': 2 },
  },
  // Platz im Spiel: nach „Sänfte“
  {
    // Lösung: Spiegel (5,3,2) Achse y rot 3 · Spiegel (5,3,5) Achse y rot 1 ·
    //   Spiegel (3,3,5) Achse y rot 1 · Spiegel (3,3,2) Achse y rot 1 · Prisma (1,3,5) Achse y rot 0 ·
    //   Spiegel (5,3,1) Achse x rot 1
    // Generator mittel-abzaehlen, Seed 21634, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Schreiner', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, y: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 2, rot: 3 },
      { type: 'source', x: 5, y: 3, z: 6, dir: 6 },
      { type: 'source', x: 6, y: 3, z: 2, dir: 4, color: 'green' },
      { type: 'source', x: 0, y: 3, z: 5, dir: 0, color: 'yellow' },
      { type: 'target', x: 0, y: 3, z: 2, color: 'white' },
      { type: 'target', x: 3, y: 3, z: 6, color: 'green' },
      { type: 'target', x: 6, y: 3, z: 5, color: 'green' },
      { type: 'prism', x: 1, y: 3, z: 5, rot: 4 },
      { type: 'mirror', x: 5, y: 3, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 6, y: 2, z: 1, axis: 'z', rot: 2, fixed: true },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 0, z: 5, color: 'red' },
    ],
    solution: { '5,3,2': 3, '5,3,5': 1, '3,3,5': 1, '3,3,2': 1, '1,3,5': 0, '5,3,1': 1 },
  },
  // Platz im Spiel: nach „Schreiner“
  {
    // Lösung: Prisma (6,0,2) Achse y rot 3 · Spiegel (5,0,1) Achse y rot 0 ·
    //   Spiegel (1,4,4) Achse z rot 1 · Prisma (1,3,4) Achse z rot 2 · Spiegel (1,1,4) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60427, Stand 74361c6 · Würfel „mittel“
    name: 'Sessellift', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 6, y: 0, z: 2, rot: 2 },
      { type: 'source', x: 6, y: 0, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, y: 0, z: 6, dir: 7, color: 'green' },
      { type: 'mirror', x: 5, y: 0, z: 1, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 4, y: 0, z: 4, color: 'yellow' },
      { type: 'source', x: 0, y: 4, z: 4, dir: 0 },
      { type: 'mirror', x: 1, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'prism', x: 1, y: 3, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 1, y: 1, z: 4, axis: 'z', rot: 0 },
      { type: 'target', x: 4, y: 1, z: 4, color: 'green' },
    ],
    solution: { '6,0,2': 3, '5,0,1': 0, '1,4,4': 1, '1,3,4': 2, '1,1,4': 1 },
  },
  // Platz im Spiel: nach „Sessellift“
  {
    // Lösung: Spiegel (6,2,1) Achse y rot 3 · Spiegel (3,2,1) Achse y rot 1 ·
    //   Spiegel (3,2,3) Achse y rot 1 · Spiegel (6,2,3) Achse y rot 1 · Prisma (3,2,5) Achse y rot 5 ·
    //   Spiegel (0,2,2) Achse z rot 3
    // Generator mittel-abzaehlen, Seed 21661, Stand 1df6ca5, gesenkt um 1 · Würfel „mittel“
    name: 'Enkaustik', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, y: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 6, y: 2, z: 3, rot: 2 },
      { type: 'source', x: 3, y: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 6, y: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, y: 2, z: 1, dir: 0, color: 'cyan' },
      { type: 'target', x: 3, y: 2, z: 0, color: 'blue' },
      { type: 'target', x: 6, y: 2, z: 6, color: 'cyan' },
      { type: 'target', x: 0, y: 2, z: 3, color: 'blue' },
      { type: 'prism', x: 3, y: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 1, axis: 'x', rot: 2, fixed: true },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 4, y: 0, z: 6, color: 'green' },
    ],
    solution: { '6,2,1': 3, '3,2,1': 1, '3,2,3': 1, '6,2,3': 1, '3,2,5': 5, '0,2,2': 3 },
  },
  // Platz im Spiel: nach „Enkaustik“
  {
    // Lösung: Prisma (5,0,2) Achse y rot 6 · Spiegel (3,0,4) Achse y rot 0 ·
    //   Spiegel (6,0,1) Achse z rot 3 · Spiegel (6,1,0) Achse y rot 0 · Spiegel (6,2,1) Achse y rot 3 ·
    //   Spiegel (2,0,1) Achse x rot 0 · Spiegel (1,1,1) Achse z rot 2
    // Generator mittel-sammelstelle, Seed 20032, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Dudelsack', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, y: 0, z: 2, rot: 1 },
      { type: 'source', x: 0, y: 0, z: 1, dir: 1, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 3 },
      { type: 'source', x: 6, y: 0, z: 2, dir: 4, color: 'cyan' },
      { type: 'target', x: 4, y: 0, z: 1, color: 'red' },
      { type: 'target', x: 5, y: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 1, axis: 'z', rot: 0, fixed: true },
      { type: 'mirror', x: 2, y: 0, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'z', rot: 3 },
      { type: 'target', x: 3, y: 3, z: 1, color: 'blue' },
    ],
    solution: { '5,0,2': 6, '3,0,4': 0, '6,0,1': 3, '6,1,0': 0, '6,2,1': 3, '2,0,1': 0, '1,1,1': 2 },
  },
  // Platz im Spiel: nach „Dudelsack“
  {
    // Lösung: Spiegel (0,2,1) Achse y rot 1 · Spiegel (2,2,1) Achse y rot 1 ·
    //   Spiegel (2,2,3) Achse y rot 1 · Spiegel (0,2,3) Achse y rot 3 · Prisma (5,2,1) Achse y rot 4 ·
    //   Spiegel (1,2,5) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 20835, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Mittelschiff', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 3, rot: 0 },
      { type: 'source', x: 0, y: 2, z: 0, dir: 2 },
      { type: 'source', x: 2, y: 2, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, y: 2, z: 1, dir: 4, color: 'yellow' },
      { type: 'target', x: 0, y: 2, z: 5, color: 'green' },
      { type: 'target', x: 4, y: 2, z: 3, color: 'white' },
      { type: 'target', x: 2, y: 2, z: 0, color: 'green' },
      { type: 'prism', x: 5, y: 2, z: 1, rot: 6 },
      { type: 'mirror', x: 1, y: 2, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 5, rot: 3, fixed: true },
      { type: 'target', x: 0, y: 0, z: 6, color: 'red' },
    ],
    solution: { '0,2,1': 1, '2,2,1': 1, '2,2,3': 1, '0,2,3': 3, '5,2,1': 4, '1,2,5': 3 },
  },
  // Platz im Spiel: nach „Mittelschiff“
  {
    // Lösung: Prisma (1,0,2) Achse y rot 1 · Spiegel (3,0,2) Achse y rot 3 ·
    //   Spiegel (1,0,3) Achse y rot 1 · Spiegel (2,0,3) Achse y rot 1 · Spiegel (2,0,6) Achse x rot 1 ·
    //   Spiegel (0,2,6) Achse z rot 2 · Spiegel (2,4,6) Achse x rot 3
    // Generator mittel-falle, Seed 22106, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Deichtor', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 1, y: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 1, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 2, rot: 2 },
      { type: 'target', x: 3, y: 0, z: 0, color: 'red' },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 3 },
      { type: 'source', x: 6, y: 0, z: 2, dir: 3 },
      { type: 'mirror', x: 2, y: 0, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 6, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 4, y: 1, z: 6, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 4, y: 0, z: 6, color: 'blue' },
      { type: 'mirror', x: 0, y: 2, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 4, z: 6, axis: 'x', rot: 1 },
      { type: 'target', x: 5, y: 4, z: 3, color: 'white' },
    ],
    solution: { '1,0,2': 1, '3,0,2': 3, '1,0,3': 1, '2,0,3': 1, '2,0,6': 1, '0,2,6': 2, '2,4,6': 3 },
  },
  // Platz im Spiel: nach „Deichtor“
  {
    // Lösung: Prisma (5,1,4) Achse y rot 3 · Spiegel (1,1,4) Achse y rot 1 ·
    //   Spiegel (5,1,6) Achse y rot 3 · Spiegel (3,1,6) Achse y rot 1 · Spiegel (5,3,1) Achse x rot 3 ·
    //   Spiegel (3,1,1) Achse x rot 1 · Spiegel (3,0,1) Achse z rot 3
    // Generator mittel-falle, Seed 22575, Stand 1df6ca5, gesenkt um 3 · Würfel „mittel“
    name: 'Gasometer', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 5, y: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 5, y: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 4, rot: 0 },
      { type: 'target', x: 1, y: 1, z: 0, color: 'blue' },
      { type: 'mirror', x: 5, y: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 6, rot: 2 },
      { type: 'source', x: 6, y: 3, z: 0, dir: 3, color: 'green' },
      { type: 'mirror', x: 5, y: 3, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 0, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 1, y: 0, z: 0, color: 'green' },
      { type: 'target', x: 1, y: 0, z: 1, color: 'red' },
    ],
    solution: { '5,1,4': 3, '1,1,4': 1, '5,1,6': 3, '3,1,6': 1, '5,3,1': 3, '3,1,1': 1, '3,0,1': 3 },
  },
  // Platz im Spiel: nach „Gasometer“
  {
    // Lösung: Spiegel (6,2,4) Achse y rot 3 · Prisma (6,2,0) Achse y rot 4 ·
    //   Spiegel (0,2,0) Achse y rot 3 · Spiegel (1,3,1) Achse x rot 1 · Prisma (1,3,4) Achse x rot 7
    // Generator mittel, Seed 20091, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Empore', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 2, z: 4, dir: 0 },
      { type: 'mirror', x: 6, y: 2, z: 4, rot: 0 },
      { type: 'prism', x: 6, y: 2, z: 0, rot: 6 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 1 },
      { type: 'target', x: 1, y: 2, z: 5, color: 'yellow' },
      { type: 'target', x: 0, y: 2, z: 2, color: 'green' },
      { type: 'source', x: 1, y: 0, z: 1, axis: 'x', dir: 2 },
      { type: 'mirror', x: 1, y: 3, z: 1, axis: 'x', rot: 0 },
      { type: 'prism', x: 1, y: 3, z: 4, axis: 'x', rot: 4 },
      { type: 'target', x: 1, y: 3, z: 5, color: 'blue' },
    ],
    solution: { '6,2,4': 3, '6,2,0': 4, '0,2,0': 3, '1,3,1': 1, '1,3,4': 7 },
  },
  // Platz im Spiel: nach „Empore“
  {
    // Lösung: Spiegel (1,3,0) Achse y rot 1 · Spiegel (1,3,3) Achse y rot 1 ·
    //   Spiegel (5,3,3) Achse y rot 1 · Spiegel (5,3,0) Achse y rot 3 · Prisma (1,3,5) Achse y rot 5 ·
    //   Spiegel (0,3,4) Achse z rot 3
    // Generator mittel-abzaehlen, Seed 22039, Stand 1df6ca5, gesenkt um 0 · Würfel „mittel“
    name: 'Wimperg', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 5, y: 3, z: 0, rot: 0 },
      { type: 'source', x: 6, y: 3, z: 3, dir: 4, color: 'blue' },
      { type: 'source', x: 0, y: 3, z: 0, dir: 0 },
      { type: 'source', x: 1, y: 3, z: 6, dir: 6 },
      { type: 'target', x: 5, y: 3, z: 5, color: 'white' },
      { type: 'target', x: 0, y: 3, z: 3, color: 'blue' },
      { type: 'target', x: 6, y: 3, z: 0, color: 'blue' },
      { type: 'prism', x: 1, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 2, axis: 'x', rot: 2, fixed: true },
      { type: 'target', x: 0, y: 0, z: 3, color: 'green' },
      { type: 'target', x: 0, y: 3, z: 5, color: 'red' },
    ],
    solution: { '1,3,0': 1, '1,3,3': 1, '5,3,3': 1, '5,3,0': 3, '1,3,5': 5, '0,3,4': 3 },
  },
  // Platz im Spiel: nach „Wimperg“
  {
    // Lösung: Spiegel (3,1,4) Achse y rot 1 · Spiegel (5,1,4) Achse y rot 1 ·
    //   Spiegel (5,1,1) Achse y rot 1 · Spiegel (3,1,1) Achse y rot 1 · Prisma (1,1,1) Achse y rot 0 ·
    //   Spiegel (2,1,0) Achse x rot 1
    // Generator mittel-abzaehlen, Seed 21863, Stand 1df6ca5, gesenkt um 0 · Würfel „mittel“
    name: 'Fischkutter', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 1, rot: 0 },
      { type: 'source', x: 0, y: 1, z: 1, dir: 0, color: 'yellow' },
      { type: 'source', x: 6, y: 1, z: 4, dir: 4, color: 'cyan' },
      { type: 'source', x: 5, y: 1, z: 0, dir: 2, color: 'green' },
      { type: 'target', x: 3, y: 1, z: 0, color: 'cyan' },
      { type: 'target', x: 6, y: 1, z: 1, color: 'green' },
      { type: 'target', x: 5, y: 1, z: 5, color: 'green' },
      { type: 'prism', x: 1, y: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 5, y: 2, z: 0, color: 'red' },
    ],
    solution: { '3,1,4': 1, '5,1,4': 1, '5,1,1': 1, '3,1,1': 1, '1,1,1': 0, '2,1,0': 1 },
  },
  // Platz im Spiel: nach „Fischkutter“
  {
    // Lösung: Prisma (2,1,4) Achse y rot 0 · Spiegel (2,1,3) Achse y rot 1 ·
    //   Spiegel (1,1,5) Achse y rot 2 · Spiegel (3,1,4) Achse z rot 1 · Spiegel (3,0,4) Achse z rot 3 ·
    //   Spiegel (2,3,5) Achse x rot 1 · Spiegel (2,3,6) Achse x rot 3
    // Generator mittel-sammelstelle, Seed 60059, Stand 74361c6 · Würfel „mittel“
    name: 'Pietra dura', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 1, z: 4, rot: 4 },
      { type: 'source', x: 0, y: 1, z: 3, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 3 },
      { type: 'source', x: 2, y: 1, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 0 },
      { type: 'target', x: 4, y: 1, z: 2, color: 'red' },
      { type: 'target', x: 3, y: 1, z: 5, color: 'blue' },
      { type: 'mirror', x: 3, y: 1, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 2, y: 0, z: 5, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 3, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 2, y: 2, z: 6, color: 'green' },
    ],
    solution: { '2,1,4': 0, '2,1,3': 1, '1,1,5': 2, '3,1,4': 1, '3,0,4': 3, '2,3,5': 1, '2,3,6': 3 },
  },
  // Platz im Spiel: nach „Pietra dura“
  {
    // Lösung: Spiegel (3,4,3) Achse y rot 0 · Spiegel (5,4,4) Achse y rot 1 ·
    //   Spiegel (5,4,0) Achse y rot 1 · Spiegel (5,4,5) Achse x rot 3 · Spiegel (0,4,4) Achse z rot 3 ·
    //   Spiegel (0,2,4) Achse z rot 1 · Spiegel (5,2,4) Achse z rot 3
    // Generator mittel-abschalten, Seed 60842, Stand 74361c6 · Würfel „mittel“
    name: 'Schlitten', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 4, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 3, y: 4, z: 3, rot: 3 },
      { type: 'target', x: 0, y: 4, z: 0, color: 'cyan' },
      { type: 'source', x: 6, y: 4, z: 4, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 5, y: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 5, y: 4, z: 5, axis: 'x', rot: 2 },
      { type: 'target', x: 6, y: 3, z: 5, color: 'cyan' },
      { type: 'source', x: 5, y: 0, z: 5, axis: 'x', dir: 2, color: 'red' },
      { type: 'mirror', x: 0, y: 4, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 3, z: 4, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 5, y: 3, z: 1, color: 'red' },
    ],
    solution: { '3,4,3': 0, '5,4,4': 1, '5,4,0': 1, '5,4,5': 3, '0,4,4': 3, '0,2,4': 1, '5,2,4': 3 },
  },
  // Platz im Spiel: nach „Schlitten“
  {
    // Lösung: Spiegel (3,2,2) Achse y rot 1 · Spiegel (1,2,2) Achse y rot 1 ·
    //   Spiegel (1,2,4) Achse y rot 1 · Spiegel (3,2,4) Achse y rot 1 · Prisma (5,2,4) Achse y rot 5 ·
    //   Spiegel (5,2,2) Achse x rot 1
    // Generator mittel-abzaehlen, Seed 21997, Stand 1df6ca5, gesenkt um 0 · Würfel „mittel“
    name: 'Vergolder', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 1, y: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 4, rot: 3 },
      { type: 'source', x: 1, y: 2, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, y: 2, z: 4, dir: 4 },
      { type: 'source', x: 0, y: 2, z: 2, dir: 0, color: 'magenta' },
      { type: 'target', x: 1, y: 2, z: 1, color: 'red' },
      { type: 'target', x: 3, y: 2, z: 6, color: 'magenta' },
      { type: 'target', x: 0, y: 2, z: 4, color: 'red' },
      { type: 'prism', x: 5, y: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 5, y: 2, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 4, y: 2, z: 3, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 5, y: 0, z: 6, color: 'blue' },
      { type: 'target', x: 4, y: 4, z: 1, color: 'green' },
    ],
    solution: { '3,2,2': 1, '1,2,2': 1, '1,2,4': 1, '3,2,4': 1, '5,2,4': 5, '5,2,2': 1 },
  },
  // Platz im Spiel: nach „Vergolder“
  {
    // Lösung: Spiegel (5,4,6) Achse y rot 1 · Spiegel (3,4,6) Achse y rot 3 ·
    //   Spiegel (3,4,3) Achse y rot 1 · Spiegel (5,4,3) Achse y rot 1 · Prisma (1,4,6) Achse y rot 0 ·
    //   Spiegel (6,4,1) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 21550, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Mundharmonika', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, y: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 3, y: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 3, y: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 3, rot: 0 },
      { type: 'source', x: 0, y: 4, z: 6, dir: 0, color: 'yellow' },
      { type: 'source', x: 6, y: 4, z: 3, dir: 4, color: 'green' },
      { type: 'source', x: 3, y: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 6, y: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 0, y: 4, z: 3, color: 'green' },
      { type: 'target', x: 5, y: 4, z: 0, color: 'green' },
      { type: 'prism', x: 1, y: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 0, axis: 'x', rot: 2, fixed: true },
      { type: 'target', x: 6, y: 0, z: 3, color: 'red' },
    ],
    solution: { '5,4,6': 1, '3,4,6': 3, '3,4,3': 1, '5,4,3': 1, '1,4,6': 0, '6,4,1': 1 },
  },
  // Platz im Spiel: nach „Mundharmonika“
  {
    // Lösung: Prisma (2,0,5) Achse y rot 1 · Spiegel (3,0,4) Achse y rot 0 ·
    //   Spiegel (0,0,3) Achse y rot 2 · Spiegel (3,0,6) Achse x rot 1 · Spiegel (6,3,6) Achse y rot 2 ·
    //   Spiegel (5,4,6) Achse x rot 0 · Spiegel (4,3,6) Achse y rot 2
    // Generator mittel-sammelstelle, Seed 60676, Stand 74361c6 · Würfel „mittel“
    name: 'Origami', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 0, z: 5, rot: 7 },
      { type: 'source', x: 5, y: 0, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 1 },
      { type: 'source', x: 3, y: 0, z: 0, dir: 3, color: 'red' },
      { type: 'mirror', x: 0, y: 0, z: 3, rot: 1 },
      { type: 'target', x: 2, y: 0, z: 6, color: 'blue' },
      { type: 'target', x: 6, y: 0, z: 5, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 3, z: 6, rot: 0 },
      { type: 'target', x: 6, y: 1, z: 6, color: 'green' },
    ],
    solution: { '2,0,5': 1, '3,0,4': 0, '0,0,3': 2, '3,0,6': 1, '6,3,6': 2, '5,4,6': 0, '4,3,6': 2 },
  },
  // Platz im Spiel: nach „Origami“
  {
    // Lösung: Prisma (2,3,4) Achse y rot 0 · Spiegel (2,3,3) Achse y rot 1 ·
    //   Spiegel (2,3,5) Achse y rot 3 · Spiegel (4,3,2) Achse x rot 2 · Spiegel (5,3,3) Achse y rot 0 ·
    //   Spiegel (3,1,1) Achse z rot 2 · Spiegel (4,0,1) Achse z rot 0
    // Generator mittel-sammelstelle, Seed 60146, Stand 74361c6 · Würfel „mittel“
    name: 'Maurer', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 3, z: 4, rot: 4 },
      { type: 'source', x: 0, y: 3, z: 3, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 2, y: 3, z: 3, rot: 2 },
      { type: 'source', x: 0, y: 3, z: 5, dir: 0, color: 'blue' },
      { type: 'mirror', x: 2, y: 3, z: 5, rot: 1 },
      { type: 'target', x: 5, y: 3, z: 4, color: 'green' },
      { type: 'target', x: 3, y: 3, z: 5, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 2, axis: 'z', rot: 2, fixed: true },
      { type: 'mirror', x: 5, y: 3, z: 1, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 3, y: 1, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 2, z: 1, color: 'red' },
    ],
    solution: { '2,3,4': 0, '2,3,3': 1, '2,3,5': 3, '4,3,2': 2, '5,3,3': 0, '3,1,1': 2, '4,0,1': 0 },
  },
  // Platz im Spiel: nach „Maurer“
  {
    // Lösung: Spiegel (2,1,5) Achse z rot 1 · Prisma (2,2,5) Achse x rot 3 ·
    //   Prisma (5,1,0) Achse y rot 2 · Spiegel (1,1,4) Achse x rot 3 · Spiegel (2,2,3) Achse y rot 3 ·
    //   Spiegel (6,1,1) Achse z rot 2
    // Generator mittel, Seed 20678, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Wäscherei', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 1, z: 5, dir: 4 },
      { type: 'mirror', x: 2, y: 1, z: 5, axis: 'z', rot: 2 },
      { type: 'prism', x: 2, y: 2, z: 5, axis: 'x', rot: 7 },
      { type: 'mirror', x: 2, y: 3, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 2, y: 3, z: 4, color: 'green' },
      { type: 'target', x: 4, y: 3, z: 5, color: 'red' },
      { type: 'source', x: 0, y: 1, z: 0, dir: 0, color: 'magenta' },
      { type: 'prism', x: 5, y: 1, z: 0, rot: 7 },
      { type: 'mirror', x: 1, y: 1, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 3, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 2, y: 2, z: 6, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 4, color: 'blue' },
      { type: 'target', x: 6, y: 3, z: 3, color: 'blue' },
    ],
    solution: { '2,1,5': 1, '2,2,5': 3, '5,1,0': 2, '1,1,4': 3, '2,2,3': 3, '6,1,1': 2 },
  },
  // Platz im Spiel: nach „Wäscherei“
  {
    // Lösung: Spiegel (4,1,2) Achse x rot 1 · Spiegel (0,3,5) Achse y rot 1 ·
    //   Spiegel (0,3,2) Achse y rot 3 · Spiegel (4,0,2) Achse z rot 1 · Prisma (2,3,5) Achse y rot 3 ·
    //   Spiegel (3,0,5) Achse x rot 1
    // Generator mittel-abschalten, Seed 60460, Stand 74361c6 · Würfel „mittel“
    name: 'Omnibus', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'x', rot: 2 },
      { type: 'target', x: 4, y: 3, z: 2, color: 'blue' },
      { type: 'source', x: 6, y: 3, z: 5, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 0, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 6, y: 0, z: 2, color: 'cyan' },
      { type: 'prism', x: 2, y: 3, z: 5, rot: 0 },
      { type: 'target', x: 2, y: 3, z: 6, color: 'red' },
      { type: 'source', x: 0, y: 4, z: 4, axis: 'x', dir: 7, color: 'green' },
      { type: 'mirror', x: 3, y: 0, z: 5, axis: 'x', rot: 2 },
    ],
    solution: { '4,1,2': 1, '0,3,5': 1, '0,3,2': 3, '4,0,2': 1, '2,3,5': 3, '3,0,5': 1 },
  },
  // Platz im Spiel: nach „Omnibus“
  {
    // Lösung: Prisma (2,2,2) Achse y rot 1 · Spiegel (4,2,2) Achse y rot 3 ·
    //   Spiegel (2,2,3) Achse y rot 1 · Spiegel (3,2,3) Achse y rot 1 · Prisma (2,0,1) Achse x rot 2 ·
    //   Spiegel (3,2,5) Achse x rot 1
    // Generator mittel-falle, Seed 20300, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Bergfried', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 2, y: 2, z: 2, rot: 5 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 2 },
      { type: 'target', x: 4, y: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 3, rot: 3 },
      { type: 'source', x: 2, y: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'prism', x: 2, y: 0, z: 1, axis: 'x', rot: 7 },
      { type: 'mirror', x: 3, y: 2, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 3, rot: 2, fixed: true },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 2, y: 3, z: 0, color: 'green' },
      { type: 'target', x: 2, y: 4, z: 3, color: 'red' },
      { type: 'target', x: 3, y: 4, z: 5, color: 'blue' },
    ],
    solution: { '2,2,2': 1, '4,2,2': 3, '2,2,3': 1, '3,2,3': 1, '2,0,1': 2, '3,2,5': 1 },
  },
  // Platz im Spiel: nach „Bergfried“
  {
    // Lösung: Spiegel (0,0,1) Achse y rot 1 · Spiegel (2,0,1) Achse y rot 1 ·
    //   Spiegel (2,0,4) Achse y rot 1 · Spiegel (0,0,4) Achse y rot 3 · Prisma (5,0,1) Achse y rot 5 ·
    //   Spiegel (5,0,0) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 60251, Stand 74361c6 · Würfel „mittel“
    name: 'Korvette', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 4, rot: 0 },
      { type: 'source', x: 2, y: 0, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, y: 0, z: 0, dir: 2 },
      { type: 'source', x: 6, y: 0, z: 1, dir: 4 },
      { type: 'target', x: 0, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 2, y: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, y: 0, z: 4, color: 'white' },
      { type: 'prism', x: 5, y: 0, z: 1, rot: 6 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 5, y: 1, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 1, y: 1, z: 0, color: 'blue' },
      { type: 'target', x: 2, y: 2, z: 0, color: 'green' },
    ],
    solution: { '0,0,1': 1, '2,0,1': 1, '2,0,4': 1, '0,0,4': 3, '5,0,1': 5, '5,0,0': 3 },
  },
  // Platz im Spiel: nach „Korvette“
  {
    // Lösung: Spiegel (6,4,5) Achse y rot 1 · Spiegel (4,4,5) Achse y rot 1 ·
    //   Spiegel (4,4,1) Achse y rot 1 · Spiegel (6,4,1) Achse y rot 3 · Prisma (2,4,5) Achse y rot 7 ·
    //   Spiegel (2,4,3) Achse y rot 3
    // Generator mittel-abzaehlen, Seed 22778, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Synagoge', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 1, rot: 2 },
      { type: 'source', x: 4, y: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, y: 4, z: 5, dir: 0 },
      { type: 'source', x: 6, y: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 4, y: 4, z: 6, color: 'blue' },
      { type: 'target', x: 0, y: 4, z: 1, color: 'cyan' },
      { type: 'target', x: 6, y: 4, z: 0, color: 'blue' },
      { type: 'prism', x: 2, y: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 2, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 5, y: 4, z: 3, color: 'red' },
      { type: 'target', x: 6, y: 0, z: 5, color: 'green' },
    ],
    solution: { '6,4,5': 1, '4,4,5': 1, '4,4,1': 1, '6,4,1': 3, '2,4,5': 7, '2,4,3': 3 },
  },
  // Platz im Spiel: nach „Synagoge“
  {
    // Lösung: Spiegel (3,3,4) Achse z rot 1 · Spiegel (4,3,4) Achse z rot 1 ·
    //   Spiegel (2,1,3) Achse y rot 3 · Spiegel (2,3,1) Achse z rot 1 · Spiegel (3,1,6) Achse y rot 3 ·
    //   Spiegel (2,0,6) Achse x rot 0
    // Generator mittel-mischziel, Seed 60889, Stand 74361c6 · Würfel „mittel“
    name: 'Schraubstock', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 4, z: 4, axis: 'x', dir: 6, color: 'blue' },
      { type: 'source', x: 4, y: 0, z: 2, axis: 'x', dir: 1, color: 'green' },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 2, z: 4, color: 'cyan' },
      { type: 'source', x: 1, y: 0, z: 3, axis: 'z', dir: 7 },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 0, y: 3, z: 1, axis: 'z', rot: 2, fixed: true },
      { type: 'filter', x: 1, y: 3, z: 2, color: 'yellow' },
      { type: 'mirror', x: 3, y: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 6, axis: 'x', rot: 2 },
      { type: 'target', x: 0, y: 2, z: 6, color: 'yellow' },
    ],
    solution: { '3,3,4': 1, '4,3,4': 1, '2,1,3': 3, '2,3,1': 1, '3,1,6': 3, '2,0,6': 0 },
  },
  // Platz im Spiel: nach „Schraubstock“
  {
    // Lösung: Prisma (4,1,2) Achse y rot 1 · Spiegel (3,0,4) Achse y rot 3 ·
    //   Spiegel (4,1,5) Achse y rot 3 · Spiegel (0,0,4) Achse y rot 3 · Spiegel (0,0,5) Achse x rot 1 ·
    //   Kombinator (0,1,5) Achse x dir 2 · Spiegel (5,1,2) Achse z rot 3
    // Generator mittel, Seed 20656, Stand 33f26f8, gesenkt um 4 · Würfel „mittel“
    name: 'Gewächshaus', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 0, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 6, y: 1, z: 0, dir: 3, color: 'magenta' },
      { type: 'prism', x: 4, y: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'x', rot: 0 },
      { type: 'combiner', x: 0, y: 1, z: 5, axis: 'x', dir: 4 },
      { type: 'target', x: 0, y: 2, z: 5, color: 'cyan' },
      { type: 'mirror', x: 5, y: 1, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 2, z: 2, color: 'red' },
    ],
    solution: { '4,1,2': 1, '3,0,4': 3, '4,1,5': 3, '0,0,4': 3, '0,0,5': 1, '0,1,5': 2, '5,1,2': 3 },
  },
  // Platz im Spiel: nach „Gewächshaus“
  {
    // Lösung: Prisma (4,0,6) Achse y rot 5 · Spiegel (6,0,6) Achse y rot 3 ·
    //   Spiegel (5,0,5) Achse y rot 2 · Spiegel (0,0,2) Achse z rot 1 · Spiegel (0,2,0) Achse y rot 3 ·
    //   Spiegel (1,3,0) Achse y rot 1 · Spiegel (1,4,1) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60055, Stand 74361c6 · Würfel „mittel“
    name: 'Stuckmarmor', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 0, z: 6, rot: 3 },
      { type: 'source', x: 6, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 6, y: 0, z: 6, rot: 0 },
      { type: 'source', x: 0, y: 0, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 5, y: 0, z: 5, rot: 1 },
      { type: 'target', x: 4, y: 0, z: 1, color: 'blue' },
      { type: 'target', x: 0, y: 0, z: 6, color: 'red' },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 4, z: 2, axis: 'z', rot: 2, fixed: true },
      { type: 'mirror', x: 3, y: 4, z: 5, rot: 0, fixed: true },
      { type: 'target', x: 5, y: 4, z: 3, color: 'green' },
    ],
    solution: { '4,0,6': 5, '6,0,6': 3, '5,0,5': 2, '0,0,2': 1, '0,2,0': 3, '1,3,0': 1, '1,4,1': 1 },
  },
  // Platz im Spiel: nach „Stuckmarmor“
  {
    // Lösung: Prisma (4,4,2) Achse y rot 4 · Spiegel (4,4,5) Achse y rot 1 ·
    //   Spiegel (3,4,3) Achse z rot 3 · Spiegel (3,2,5) Achse z rot 0 · Spiegel (3,3,6) Achse x rot 2 ·
    //   Spiegel (3,4,5) Achse z rot 0 · Spiegel (3,0,1) Achse x rot 0
    // Generator mittel-sammelstelle, Seed 60005, Stand 74361c6 · Würfel „mittel“
    name: 'Steinmetz', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 4, z: 2, rot: 3 },
      { type: 'source', x: 6, y: 4, z: 5, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, y: 4, z: 5, rot: 2 },
      { type: 'source', x: 6, y: 4, z: 0, dir: 3, color: 'magenta' },
      { type: 'target', x: 1, y: 4, z: 2, color: 'green' },
      { type: 'target', x: 3, y: 4, z: 1, color: 'blue' },
      { type: 'mirror', x: 3, y: 4, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 4, z: 5, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 1, axis: 'x', rot: 1 },
      { type: 'target', x: 3, y: 1, z: 0, color: 'red' },
    ],
    solution: { '4,4,2': 4, '4,4,5': 1, '3,4,3': 3, '3,2,5': 0, '3,3,6': 2, '3,4,5': 0, '3,0,1': 0 },
  },
  // Platz im Spiel: nach „Steinmetz“
  {
    // Lösung: Spiegel (0,1,6) Achse x rot 1 · Spiegel (1,3,4) Achse y rot 3 ·
    //   Spiegel (0,2,4) Achse y rot 3 · Spiegel (0,2,6) Achse x rot 3 · Spiegel (1,1,4) Achse y rot 2 ·
    //   Spiegel (5,2,4) Achse y rot 3 · Spiegel (5,2,2) Achse y rot 3
    // Generator mittel-abschalten, Seed 60381, Stand 74361c6 · Würfel „mittel“
    name: 'Trockendock', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 0, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 0, z: 6, color: 'white' },
      { type: 'source', x: 1, y: 4, z: 3, axis: 'x', dir: 7 },
      { type: 'mirror', x: 1, y: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 4, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 4, axis: 'z', dir: 7, color: 'red' },
      { type: 'target', x: 0, y: 4, z: 6, color: 'red' },
      { type: 'mirror', x: 5, y: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 2, rot: 1 },
      { type: 'filter', x: 1, y: 2, z: 4, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 2, color: 'red' },
    ],
    solution: { '0,1,6': 1, '1,3,4': 3, '0,2,4': 3, '0,2,6': 3, '1,1,4': 2, '5,2,4': 3, '5,2,2': 3 },
  },
  // Platz im Spiel: nach „Trockendock“
  {
    // Lösung: Spiegel (3,3,1) Achse y rot 1 · Spiegel (1,3,1) Achse y rot 1 ·
    //   Spiegel (1,3,5) Achse y rot 1 · Spiegel (3,3,5) Achse y rot 1 · Prisma (5,3,5) Achse y rot 4 ·
    //   Spiegel (2,3,2) Achse z rot 3
    // Generator mittel-abzaehlen, Seed 21405, Stand 1df6ca5, gesenkt um 0 · Würfel „mittel“
    name: 'Dampfwalze', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 5, rot: 3 },
      { type: 'source', x: 0, y: 3, z: 1, dir: 0 },
      { type: 'source', x: 6, y: 3, z: 5, dir: 4, color: 'cyan' },
      { type: 'source', x: 1, y: 3, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 1, y: 3, z: 0, color: 'green' },
      { type: 'target', x: 0, y: 3, z: 5, color: 'green' },
      { type: 'target', x: 3, y: 3, z: 6, color: 'white' },
      { type: 'prism', x: 5, y: 3, z: 5, rot: 6 },
      { type: 'mirror', x: 2, y: 3, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 2, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 0, z: 5, color: 'blue' },
    ],
    solution: { '3,3,1': 1, '1,3,1': 1, '1,3,5': 1, '3,3,5': 1, '5,3,5': 4, '2,3,2': 3 },
  },
  // Platz im Spiel: nach „Dampfwalze“
  {
    // Lösung: Spiegel (5,3,1) Achse y rot 2 · Spiegel (5,3,3) Achse y rot 2 ·
    //   Spiegel (3,3,1) Achse y rot 2 · Spiegel (6,3,2) Achse z rot 1 · Spiegel (6,2,1) Achse y rot 0 ·
    //   Spiegel (6,3,4) Achse z rot 1 · Spiegel (6,2,5) Achse z rot 0 · Spiegel (6,3,6) Achse y rot 3
    // Generator mittel-abschalten, Seed 60467, Stand 74361c6 · Würfel „mittel“
    name: 'Drehbank', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 3, z: 0, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 5, y: 3, z: 1, rot: 3 },
      { type: 'target', x: 4, y: 3, z: 0, color: 'magenta' },
      { type: 'source', x: 2, y: 3, z: 6, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 2, z: 3, color: 'magenta' },
      { type: 'mirror', x: 6, y: 2, z: 1, rot: 1 },
      { type: 'source', x: 6, y: 0, z: 3, axis: 'x', dir: 3, color: 'green' },
      { type: 'mirror', x: 6, y: 3, z: 4, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 6, rot: 0 },
      { type: 'target', x: 5, y: 4, z: 6, color: 'green' },
    ],
    solution: { '5,3,1': 2, '5,3,3': 2, '3,3,1': 2, '6,3,2': 1, '6,2,1': 0, '6,3,4': 1, '6,2,5': 0, '6,3,6': 3 },
  },
  // Platz im Spiel: nach „Drehbank“
  {
    // Lösung: Spiegel (4,3,3) Achse x rot 3 · Spiegel (6,3,3) Achse y rot 2 ·
    //   Spiegel (3,3,0) Achse y rot 0 · Spiegel (2,3,5) Achse z rot 1 · Prisma (5,3,4) Achse y rot 0 ·
    //   Spiegel (3,4,1) Achse z rot 1
    // Generator mittel-abschalten, Seed 60450, Stand 74361c6 · Würfel „mittel“
    name: 'Kupferstich', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 5, y: 4, z: 3, axis: 'z', dir: 3, color: 'red' },
      { type: 'mirror', x: 4, y: 3, z: 3, axis: 'x', rot: 0 },
      { type: 'target', x: 2, y: 3, z: 1, color: 'red' },
      { type: 'source', x: 3, y: 3, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 6, y: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 5, axis: 'z', rot: 3 },
      { type: 'target', x: 2, y: 4, z: 6, color: 'yellow' },
      { type: 'prism', x: 5, y: 3, z: 4, rot: 1 },
      { type: 'target', x: 6, y: 3, z: 4, color: 'green' },
      { type: 'source', x: 3, y: 0, z: 3, axis: 'x', dir: 3, color: 'green' },
      { type: 'mirror', x: 3, y: 4, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 4, axis: 'z', rot: 2, fixed: true },
    ],
    solution: { '4,3,3': 3, '6,3,3': 2, '3,3,0': 0, '2,3,5': 1, '5,3,4': 0, '3,4,1': 1 },
  },
  // Platz im Spiel: nach „Kupferstich“
  {
    // Lösung: Spiegel (1,0,4) Achse z rot 1 · Spiegel (2,2,3) Achse y rot 0 ·
    //   Prisma (4,2,4) Achse x rot 7 · Spiegel (4,1,5) Achse z rot 0 · Spiegel (4,0,4) Achse z rot 3 ·
    //   Spiegel (4,2,6) Achse y rot 1
    // Generator mittel-mischziel, Seed 60978, Stand 74361c6 · Würfel „mittel“
    name: 'Bojenfeld', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 1, y: 4, z: 0, axis: 'x', dir: 7, color: 'red' },
      { type: 'source', x: 2, y: 4, z: 5, axis: 'x', dir: 5, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 4, axis: 'z', rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 3 },
      { type: 'target', x: 2, y: 0, z: 5, color: 'yellow' },
      { type: 'source', x: 4, y: 2, z: 0, dir: 2 },
      { type: 'prism', x: 4, y: 2, z: 4, axis: 'x', rot: 5 },
      { type: 'mirror', x: 4, y: 1, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 6, rot: 2 },
      { type: 'target', x: 1, y: 3, z: 4, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 6, color: 'blue' },
      { type: 'target', x: 5, y: 3, z: 6, color: 'green' },
    ],
    solution: { '1,0,4': 1, '2,2,3': 0, '4,2,4': 7, '4,1,5': 0, '4,0,4': 3, '4,2,6': 1 },
  },
  // Platz im Spiel: nach „Bojenfeld“
  {
    // Lösung: Spiegel (1,0,3) Achse y rot 1 · Spiegel (5,0,3) Achse y rot 1 ·
    //   Spiegel (5,0,1) Achse y rot 3 · Spiegel (1,0,1) Achse y rot 1 · Prisma (1,0,5) Achse y rot 6 ·
    //   Spiegel (2,0,4) Achse z rot 3 · Spiegel (2,1,3) Achse y rot 3
    // Generator mittel-abzaehlen, Seed 20053, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Supraporte', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 1, rot: 3 },
      { type: 'source', x: 1, y: 0, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 6, y: 0, z: 3, dir: 4, color: 'green' },
      { type: 'source', x: 0, y: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'target', x: 5, y: 0, z: 6, color: 'yellow' },
      { type: 'target', x: 0, y: 0, z: 3, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 1, color: 'green' },
      { type: 'prism', x: 1, y: 0, z: 5, rot: 5 },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 3, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 5, y: 2, z: 5, color: 'blue' },
    ],
    solution: { '1,0,3': 1, '5,0,3': 1, '5,0,1': 3, '1,0,1': 1, '1,0,5': 6, '2,0,4': 3, '2,1,3': 3 },
  },
  // Platz im Spiel: nach „Supraporte“
  {
    // Lösung: Spiegel (4,1,2) Achse z rot 1 · Spiegel (1,1,4) Achse y rot 3 ·
    //   Spiegel (1,1,0) Achse y rot 1 · Spiegel (0,1,0) Achse y rot 3 · Spiegel (0,1,2) Achse y rot 1 ·
    //   Spiegel (0,0,6) Achse y rot 1 · Spiegel (0,0,1) Achse x rot 3
    // Generator mittel-mischziel, Seed 60161, Stand 74361c6 · Würfel „mittel“
    name: 'Vestibül', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 2, z: 2, dir: 0, color: 'red' },
      { type: 'source', x: 6, y: 1, z: 2, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 4, y: 2, z: 2, color: 'white' },
      { type: 'source', x: 0, y: 1, z: 4, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, y: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 1, y: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 0, y: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 4, y: 0, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 1, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 2, z: 1, color: 'blue' },
    ],
    solution: { '4,1,2': 1, '1,1,4': 3, '1,1,0': 1, '0,1,0': 3, '0,1,2': 1, '0,0,6': 1, '0,0,1': 3 },
  },
  // Platz im Spiel: nach „Vestibül“
  {
    // Lösung: Spiegel (2,3,4) Achse y rot 3 · Spiegel (2,1,3) Achse y rot 3 ·
    //   Spiegel (2,2,4) Achse y rot 1 · Spiegel (1,3,4) Achse y rot 3 · Spiegel (0,3,4) Achse y rot 1 ·
    //   Spiegel (1,3,0) Achse x rot 1 · Spiegel (1,2,0) Achse z rot 3 · Spiegel (0,2,4) Achse y rot 1
    // Generator mittel-abschalten, Seed 60114, Stand 74361c6 · Würfel „mittel“
    name: 'Einspänner', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 2, y: 3, z: 4, rot: 1 },
      { type: 'target', x: 3, y: 3, z: 4, color: 'cyan' },
      { type: 'source', x: 3, y: 0, z: 3, axis: 'z', dir: 5, color: 'cyan' },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 1, y: 3, z: 4, rot: 1 },
      { type: 'target', x: 1, y: 3, z: 5, color: 'cyan' },
      { type: 'mirror', x: 0, y: 3, z: 4, rot: 3 },
      { type: 'source', x: 0, y: 3, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 1, y: 3, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 4, rot: 0 },
      { type: 'target', x: 2, y: 2, z: 5, color: 'red' },
    ],
    solution: { '2,3,4': 3, '2,1,3': 3, '2,2,4': 1, '1,3,4': 3, '0,3,4': 1, '1,3,0': 1, '1,2,0': 3, '0,2,4': 1 },
  },
  // Platz im Spiel: nach „Einspänner“
  {
    // Lösung: Prisma (5,2,3) Achse y rot 1 · Spiegel (6,2,2) Achse y rot 2 ·
    //   Spiegel (5,2,4) Achse y rot 3 · Prisma (1,4,3) Achse z rot 0 · Spiegel (6,4,3) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60940, Stand 74361c6 · Würfel „mittel“
    name: 'Walmdach', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, y: 2, z: 3, rot: 3 },
      { type: 'source', x: 4, y: 2, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 6, y: 2, z: 2, rot: 1 },
      { type: 'source', x: 2, y: 2, z: 0, dir: 1, color: 'cyan' },
      { type: 'target', x: 6, y: 2, z: 3, color: 'yellow' },
      { type: 'target', x: 6, y: 2, z: 4, color: 'green' },
      { type: 'mirror', x: 5, y: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 4, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 3, y: 0, z: 4, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 0, z: 5, color: 'blue' },
      { type: 'source', x: 0, y: 4, z: 3, dir: 0, color: 'cyan' },
      { type: 'prism', x: 1, y: 4, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 3, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 0, z: 3, color: 'blue' },
    ],
    solution: { '5,2,3': 1, '6,2,2': 2, '5,2,4': 3, '1,4,3': 0, '6,4,3': 1 },
  },
  // Platz im Spiel: nach „Walmdach“
  {
    // Lösung: Spiegel (1,0,6) Achse y rot 3 · Spiegel (4,0,6) Achse y rot 1 ·
    //   Spiegel (4,0,3) Achse y rot 1 · Spiegel (1,0,3) Achse y rot 1 · Prisma (4,0,1) Achse y rot 3 ·
    //   Spiegel (0,0,5) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 20124, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Lokschuppen', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 6, rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 2 },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2 },
      { type: 'source', x: 6, y: 0, z: 6, dir: 4 },
      { type: 'source', x: 0, y: 0, z: 3, dir: 0, color: 'red' },
      { type: 'target', x: 6, y: 0, z: 3, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 6, color: 'red' },
      { type: 'target', x: 1, y: 0, z: 1, color: 'white' },
      { type: 'prism', x: 4, y: 0, z: 1, rot: 4 },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 6, rot: 0, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 5, y: 2, z: 0, color: 'green' },
    ],
    solution: { '1,0,6': 3, '4,0,6': 1, '4,0,3': 1, '1,0,3': 1, '4,0,1': 3, '0,0,5': 1 },
  },
  // Platz im Spiel: nach „Lokschuppen“
  {
    // Lösung: Spiegel (6,0,1) Achse z rot 2 · Spiegel (5,3,1) Achse y rot 3 ·
    //   Spiegel (6,2,1) Achse y rot 1 · Spiegel (1,0,6) Achse x rot 1 · Spiegel (1,2,6) Achse z rot 1 ·
    //   Spiegel (0,2,1) Achse y rot 3 · Spiegel (6,2,4) Achse x rot 1 · Spiegel (0,1,6) Achse y rot 1
    // Generator mittel-abschalten, Seed 60172, Stand 74361c6 · Würfel „mittel“
    name: 'Kipplaster', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 5, y: 0, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'z', rot: 0 },
      { type: 'target', x: 6, y: 1, z: 2, color: 'red' },
      { type: 'source', x: 5, y: 4, z: 2, axis: 'x', dir: 5, color: 'red' },
      { type: 'mirror', x: 5, y: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 6, axis: 'x', rot: 0 },
      { type: 'source', x: 1, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 1, y: 2, z: 6, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 4, axis: 'x', rot: 3 },
      { type: 'target', x: 6, y: 3, z: 4, color: 'cyan' },
      { type: 'mirror', x: 0, y: 1, z: 6, rot: 2 },
      { type: 'target', x: 0, y: 3, z: 4, color: 'red' },
    ],
    solution: { '6,0,1': 2, '5,3,1': 3, '6,2,1': 1, '1,0,6': 1, '1,2,6': 1, '0,2,1': 3, '6,2,4': 1, '0,1,6': 1 },
  },
  // Platz im Spiel: nach „Kipplaster“
  {
    // Lösung: Spiegel (1,0,4) Achse y rot 1 · Spiegel (0,2,5) Achse y rot 1 ·
    //   Spiegel (1,1,5) Achse y rot 1 · Spiegel (1,0,2) Achse x rot 3 · Spiegel (2,1,2) Achse y rot 2 ·
    //   Spiegel (0,0,3) Achse z rot 1 · Spiegel (1,3,5) Achse x rot 3 · Spiegel (4,3,2) Achse x rot 2
    // Generator mittel-abschalten, Seed 20049, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Leier', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 0, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 1, y: 0, z: 4, rot: 3 },
      { type: 'target', x: 1, y: 0, z: 6, color: 'blue' },
      { type: 'source', x: 0, y: 3, z: 4, axis: 'x', dir: 7, color: 'blue' },
      { type: 'mirror', x: 0, y: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'x', rot: 1 },
      { type: 'target', x: 1, y: 3, z: 2, color: 'blue' },
      { type: 'mirror', x: 2, y: 1, z: 2, rot: 1 },
      { type: 'source', x: 0, y: 3, z: 2, axis: 'z', dir: 1, color: 'green' },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 2, axis: 'x', rot: 0 },
      { type: 'target', x: 5, y: 3, z: 3, color: 'green' },
    ],
    solution: { '1,0,4': 1, '0,2,5': 1, '1,1,5': 1, '1,0,2': 3, '2,1,2': 2, '0,0,3': 1, '1,3,5': 3, '4,3,2': 2 },
  },
  // Platz im Spiel: nach „Leier“
  {
    // Lösung: Prisma (4,2,4) Achse y rot 6 · Spiegel (5,2,3) Achse x rot 2 ·
    //   Spiegel (6,2,4) Achse z rot 1 · Spiegel (6,1,5) Achse z rot 3 · Spiegel (5,1,6) Achse x rot 3 ·
    //   Spiegel (4,0,6) Achse z rot 0 · Spiegel (1,3,6) Achse x rot 0 · Spiegel (0,2,6) Achse y rot 1
    // Generator mittel-sammelstelle, Seed 60396, Stand 74361c6 · Würfel „mittel“
    name: 'Krähennest', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 2, z: 4, rot: 2 },
      { type: 'source', x: 6, y: 2, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 0, y: 2, z: 4, dir: 0, color: 'green' },
      { type: 'target', x: 0, y: 2, z: 0, color: 'red' },
      { type: 'target', x: 4, y: 2, z: 1, color: 'green' },
      { type: 'mirror', x: 5, y: 2, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 6, rot: 0 },
      { type: 'target', x: 0, y: 1, z: 5, color: 'blue' },
    ],
    solution: { '4,2,4': 6, '5,2,3': 2, '6,2,4': 1, '6,1,5': 3, '5,1,6': 3, '4,0,6': 0, '1,3,6': 0, '0,2,6': 1 },
  },
  // Platz im Spiel: nach „Krähennest“
  {
    // Lösung: Prisma (3,4,4) Achse y rot 5 · Spiegel (3,4,6) Achse y rot 1 ·
    //   Spiegel (1,4,2) Achse y rot 2 · Spiegel (3,4,0) Achse x rot 1 · Spiegel (6,1,0) Achse y rot 2 ·
    //   Spiegel (5,0,0) Achse z rot 0 · Spiegel (2,3,0) Achse z rot 0 · Spiegel (1,2,0) Achse y rot 3
    // Generator mittel-sammelstelle, Seed 60031, Stand 74361c6 · Würfel „mittel“
    name: 'Böttcher', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, y: 4, z: 4, rot: 1 },
      { type: 'source', x: 6, y: 4, z: 6, dir: 4, color: 'red' },
      { type: 'mirror', x: 3, y: 4, z: 6, rot: 3 },
      { type: 'source', x: 6, y: 4, z: 4, dir: 4, color: 'cyan' },
      { type: 'target', x: 1, y: 4, z: 4, color: 'red' },
      { type: 'target', x: 3, y: 4, z: 1, color: 'blue' },
      { type: 'mirror', x: 1, y: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 3, y: 4, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 0, rot: 1 },
      { type: 'target', x: 1, y: 1, z: 1, color: 'green' },
    ],
    solution: { '3,4,4': 5, '3,4,6': 1, '1,4,2': 2, '3,4,0': 1, '6,1,0': 2, '5,0,0': 0, '2,3,0': 0, '1,2,0': 3 },
  },
  // Platz im Spiel: nach „Böttcher“
  {
    // Lösung: Spiegel (2,0,2) Achse y rot 1 · Spiegel (2,0,4) Achse y rot 3 ·
    //   Spiegel (4,0,4) Achse y rot 1 · Spiegel (4,0,2) Achse y rot 1 · Prisma (2,0,5) Achse y rot 7 ·
    //   Spiegel (6,0,5) Achse z rot 3 · Spiegel (6,2,5) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 20019, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Arena', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 3 },
      { type: 'source', x: 2, y: 0, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, y: 0, z: 4, dir: 4, color: 'yellow' },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 6, y: 0, z: 2, color: 'red' },
      { type: 'target', x: 4, y: 0, z: 6, color: 'red' },
      { type: 'target', x: 2, y: 0, z: 0, color: 'yellow' },
      { type: 'prism', x: 2, y: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 5, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 4, y: 3, z: 5, color: 'blue' },
    ],
    solution: { '2,0,2': 1, '2,0,4': 3, '4,0,4': 1, '4,0,2': 1, '2,0,5': 7, '6,0,5': 3, '6,2,5': 1 },
  },
  // Platz im Spiel: nach „Arena“
  {
    // Lösung: Spiegel (1,0,1) Achse y rot 1 · Spiegel (3,0,1) Achse y rot 3 ·
    //   Spiegel (3,0,3) Achse y rot 1 · Spiegel (1,0,3) Achse y rot 1 · Prisma (4,0,1) Achse y rot 4 ·
    //   Spiegel (3,0,0) Achse x rot 3 · Spiegel (2,1,0) Achse y rot 3
    // Generator mittel-abzaehlen, Seed 20040, Stand 33f26f8, gesenkt um 1 · Würfel „mittel“
    name: 'Baldachin', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 2 },
      { type: 'source', x: 0, y: 0, z: 3, dir: 0, color: 'green' },
      { type: 'source', x: 3, y: 0, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 6, y: 0, z: 1, dir: 4, color: 'cyan' },
      { type: 'target', x: 0, y: 0, z: 1, color: 'cyan' },
      { type: 'target', x: 1, y: 0, z: 4, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 3, color: 'green' },
      { type: 'prism', x: 4, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 4, z: 4, rot: 0, fixed: true },
      { type: 'target', x: 0, y: 4, z: 3, color: 'blue' },
    ],
    solution: { '1,0,1': 1, '3,0,1': 3, '3,0,3': 1, '1,0,3': 1, '4,0,1': 4, '3,0,0': 3, '2,1,0': 3 },
  },
  // Platz im Spiel: nach „Baldachin“
  {
    // Lösung: Spiegel (4,2,4) Achse x rot 1 · Spiegel (1,2,5) Achse y rot 2 ·
    //   Spiegel (0,2,4) Achse y rot 2 · Spiegel (3,3,4) Achse y rot 1 · Spiegel (2,2,4) Achse y rot 2 ·
    //   Spiegel (4,0,4) Achse z rot 0 · Spiegel (3,4,5) Achse x rot 0
    // Generator mittel-abschalten, Seed 60270, Stand 74361c6 · Würfel „mittel“
    name: 'Ziselieren', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 2, z: 2, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 4, y: 2, z: 4, axis: 'x', rot: 0 },
      { type: 'target', x: 2, y: 2, z: 2, color: 'magenta' },
      { type: 'source', x: 0, y: 2, z: 6, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 1, y: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 3, y: 3, z: 4, rot: 0 },
      { type: 'target', x: 3, y: 4, z: 3, color: 'magenta' },
      { type: 'mirror', x: 2, y: 2, z: 4, rot: 1 },
      { type: 'source', x: 0, y: 2, z: 2, dir: 1, color: 'green' },
      { type: 'mirror', x: 2, y: 2, z: 6, rot: 0, fixed: true },
      { type: 'mirror', x: 5, y: 1, z: 4, axis: 'z', rot: 2, fixed: true },
      { type: 'mirror', x: 4, y: 0, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 5, axis: 'x', rot: 3 },
      { type: 'target', x: 3, y: 3, z: 6, color: 'green' },
    ],
    solution: { '4,2,4': 1, '1,2,5': 2, '0,2,4': 2, '3,3,4': 1, '2,2,4': 2, '4,0,4': 0, '3,4,5': 0 },
  },
  // Platz im Spiel: nach „Ziselieren“
  {
    // Lösung: Spiegel (3,3,3) Achse y rot 1 · Spiegel (1,2,4) Achse y rot 1 ·
    //   Spiegel (2,2,4) Achse y rot 3 · Spiegel (3,2,4) Achse y rot 3 · Spiegel (4,3,4) Achse y rot 3 ·
    //   Spiegel (3,1,5) Achse z rot 0 · Spiegel (3,2,6) Achse y rot 3 · Spiegel (0,3,4) Achse y rot 3
    // Generator mittel-abschalten, Seed 60478, Stand 74361c6 · Würfel „mittel“
    name: 'Museum', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 4, z: 3, axis: 'z', dir: 1, color: 'yellow' },
      { type: 'mirror', x: 3, y: 3, z: 3, rot: 3 },
      { type: 'target', x: 2, y: 2, z: 3, color: 'yellow' },
      { type: 'source', x: 1, y: 2, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 1, y: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 4, rot: 0 },
      { type: 'target', x: 1, y: 0, z: 4, color: 'yellow' },
      { type: 'mirror', x: 4, y: 3, z: 4, rot: 0 },
      { type: 'source', x: 4, y: 4, z: 3, axis: 'x', dir: 7, color: 'blue' },
      { type: 'mirror', x: 3, y: 1, z: 5, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 6, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 4, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 3, z: 4, rot: 2 },
      { type: 'target', x: 1, y: 1, z: 5, color: 'blue' },
    ],
    solution: { '3,3,3': 1, '1,2,4': 1, '2,2,4': 3, '3,2,4': 3, '4,3,4': 3, '3,1,5': 0, '3,2,6': 3, '0,3,4': 3 },
  },
  // Platz im Spiel: nach „Museum“
  {
    // Lösung: Spiegel (0,1,3) Achse x rot 1 · Spiegel (2,1,3) Achse y rot 3 ·
    //   Spiegel (5,1,3) Achse y rot 3 · Spiegel (5,1,1) Achse y rot 1 · Spiegel (0,1,1) Achse y rot 3 ·
    //   Spiegel (0,2,3) Achse x rot 1 · Spiegel (0,2,6) Achse y rot 1 · Spiegel (1,2,6) Achse y rot 3
    // Generator mittel-mischziel, Seed 20416, Stand 33f26f8, gesenkt um 1 · Würfel „mittel“
    name: 'Obelisk', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 1, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 0, y: 0, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 0, z: 3, color: 'yellow' },
      { type: 'source', x: 2, y: 1, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 5, y: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 6, rot: 0 },
      { type: 'target', x: 1, y: 2, z: 0, color: 'red' },
    ],
    solution: { '0,1,3': 1, '2,1,3': 3, '5,1,3': 3, '5,1,1': 1, '0,1,1': 3, '0,2,3': 1, '0,2,6': 1, '1,2,6': 3 },
  },
  // Platz im Spiel: nach „Obelisk“
  {
    // Lösung: Prisma (2,3,2) Achse y rot 7 · Spiegel (1,3,1) Achse y rot 2 ·
    //   Prisma (3,2,3) Achse z rot 1 · Spiegel (3,0,3) Achse z rot 3 · Spiegel (6,2,3) Achse z rot 3 ·
    //   Spiegel (6,3,3) Achse x rot 3
    // Generator mittel-sammelstelle, Seed 60982, Stand 74361c6 · Würfel „mittel“
    name: 'Schiessstand', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 3, z: 2, rot: 2 },
      { type: 'source', x: 2, y: 3, z: 0, dir: 3, color: 'red' },
      { type: 'mirror', x: 1, y: 3, z: 1, rot: 0 },
      { type: 'source', x: 2, y: 3, z: 6, dir: 6, color: 'blue' },
      { type: 'target', x: 2, y: 3, z: 1, color: 'red' },
      { type: 'target', x: 4, y: 3, z: 2, color: 'magenta' },
      { type: 'source', x: 1, y: 0, z: 3, axis: 'z', dir: 7 },
      { type: 'prism', x: 3, y: 2, z: 3, axis: 'z', rot: 5 },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 2, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 4, y: 1, z: 3, color: 'green' },
      { type: 'target', x: 2, y: 0, z: 4, color: 'blue' },
    ],
    solution: { '2,3,2': 7, '1,3,1': 2, '3,2,3': 1, '3,0,3': 3, '6,2,3': 3, '6,3,3': 3 },
  },
  // Platz im Spiel: nach „Schiessstand“
  {
    // Lösung: Spiegel (1,2,2) Achse y rot 1 · Spiegel (3,2,2) Achse y rot 1 ·
    //   Spiegel (3,2,5) Achse y rot 1 · Spiegel (1,2,5) Achse y rot 3 · Prisma (5,2,2) Achse y rot 4 ·
    //   Spiegel (4,2,1) Achse z rot 2 · Spiegel (5,2,0) Achse x rot 1
    // Generator mittel-abzaehlen, Seed 22293, Stand 1df6ca5, gesenkt um 1 · Würfel „mittel“
    name: 'Fresko', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 5, rot: 1 },
      { type: 'source', x: 3, y: 2, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, y: 2, z: 2, dir: 4, color: 'cyan' },
      { type: 'source', x: 1, y: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 3, y: 2, z: 1, color: 'green' },
      { type: 'target', x: 4, y: 2, z: 5, color: 'cyan' },
      { type: 'target', x: 1, y: 2, z: 6, color: 'green' },
      { type: 'prism', x: 5, y: 2, z: 2, rot: 5 },
      { type: 'mirror', x: 4, y: 2, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 0, axis: 'z', rot: 2, fixed: true },
      { type: 'target', x: 5, y: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,2,2': 1, '3,2,2': 1, '3,2,5': 1, '1,2,5': 3, '5,2,2': 4, '4,2,1': 2, '5,2,0': 1 },
  },
  // Platz im Spiel: nach „Fresko“
  {
    // Lösung: Prisma (1,2,4) Achse y rot 5 · Prisma (1,0,1) Achse x rot 0 ·
    //   Spiegel (1,0,2) Achse x rot 1 · Spiegel (1,3,4) Achse z rot 1 · Spiegel (0,3,5) Achse y rot 2 ·
    //   Spiegel (1,3,6) Achse x rot 2
    // Generator mittel-sammelstelle, Seed 20559, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Zinnen', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 2, z: 4, rot: 6 },
      { type: 'source', x: 6, y: 2, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 5, y: 2, z: 0, dir: 3, color: 'blue' },
      { type: 'target', x: 0, y: 2, z: 4, color: 'red' },
      { type: 'target', x: 1, y: 2, z: 2, color: 'cyan' },
      { type: 'source', x: 1, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 1, y: 0, z: 1, axis: 'x', rot: 4 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 1, y: 3, z: 6, axis: 'x', rot: 3 },
      { type: 'target', x: 4, y: 3, z: 3, color: 'blue' },
    ],
    solution: { '1,2,4': 5, '1,0,1': 0, '1,0,2': 1, '1,3,4': 1, '0,3,5': 2, '1,3,6': 2 },
  },
  // Platz im Spiel: nach „Zinnen“
  {
    // Lösung: Prisma (1,0,2) Achse y rot 5 · Spiegel (0,0,3) Achse y rot 2 ·
    //   Spiegel (4,0,5) Achse y rot 0 · Spiegel (1,0,0) Achse x rot 3 · Spiegel (1,4,0) Achse z rot 3 ·
    //   Spiegel (0,1,0) Achse z rot 2
    // Generator mittel-sammelstelle, Seed 60933, Stand 74361c6 · Würfel „mittel“
    name: 'Dschunke', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 0, z: 2, rot: 7 },
      { type: 'source', x: 3, y: 0, z: 6, dir: 5, color: 'magenta' },
      { type: 'mirror', x: 0, y: 0, z: 3, rot: 0 },
      { type: 'source', x: 6, y: 0, z: 3, dir: 3, color: 'green' },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 2 },
      { type: 'target', x: 0, y: 0, z: 2, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 1, color: 'green' },
      { type: 'source', x: 6, y: 0, z: 5, dir: 5 },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 0, axis: 'z', rot: 0 },
      { type: 'filter', x: 3, y: 0, z: 2, color: 'blue' },
      { type: 'mirror', x: 4, y: 4, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 4, y: 4, z: 5, color: 'blue' },
      { type: 'target', x: 2, y: 3, z: 0, color: 'blue' },
    ],
    solution: { '1,0,2': 5, '0,0,3': 2, '4,0,5': 0, '1,0,0': 3, '1,4,0': 3, '0,1,0': 2 },
  },
  // Platz im Spiel: nach „Dschunke“
  {
    // Lösung: Spiegel (2,4,3) Achse x rot 1 · Spiegel (2,2,2) Achse z rot 1 ·
    //   Spiegel (2,0,2) Achse x rot 3 · Spiegel (4,2,4) Achse z rot 1 · Spiegel (4,4,4) Achse z rot 1 ·
    //   Spiegel (3,4,4) Achse y rot 1 · Spiegel (3,4,2) Achse y rot 1 · Spiegel (2,4,2) Achse z rot 3
    // Generator mittel-mischziel, Seed 60896, Stand 74361c6 · Würfel „mittel“
    name: 'Fontäne', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 4, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, y: 2, z: 2, dir: 0, color: 'green' },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 2, axis: 'x', rot: 0 },
      { type: 'target', x: 2, y: 0, z: 3, color: 'yellow' },
      { type: 'source', x: 6, y: 2, z: 4, dir: 4, color: 'red' },
      { type: 'mirror', x: 4, y: 2, z: 4, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 2, z: 2, color: 'red' },
    ],
    solution: { '2,4,3': 1, '2,2,2': 1, '2,0,2': 3, '4,2,4': 1, '4,4,4': 1, '3,4,4': 1, '3,4,2': 1, '2,4,2': 3 },
  },
  // Platz im Spiel: nach „Fontäne“
  {
    // Lösung: Spiegel (1,1,6) Achse y rot 3 · Spiegel (1,1,2) Achse y rot 1 ·
    //   Spiegel (3,1,2) Achse y rot 1 · Spiegel (3,1,6) Achse y rot 1 · Prisma (5,1,2) Achse y rot 4 ·
    //   Spiegel (2,1,5) Achse x rot 3 · Spiegel (1,0,5) Achse x rot 0
    // Generator mittel-abzaehlen, Seed 20949, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Postkutsche', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 6, rot: 3 },
      { type: 'source', x: 1, y: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, y: 1, z: 2, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, y: 1, z: 6, dir: 0, color: 'green' },
      { type: 'target', x: 5, y: 1, z: 6, color: 'yellow' },
      { type: 'target', x: 3, y: 1, z: 0, color: 'green' },
      { type: 'target', x: 0, y: 1, z: 2, color: 'green' },
      { type: 'prism', x: 5, y: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 2, y: 1, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 3, z: 3, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 0, y: 1, z: 1, color: 'red' },
    ],
    solution: { '1,1,6': 3, '1,1,2': 1, '3,1,2': 1, '3,1,6': 1, '5,1,2': 4, '2,1,5': 3, '1,0,5': 0 },
  },
  // Platz im Spiel: nach „Postkutsche“
  {
    // Lösung: Prisma (3,0,2) Achse y rot 1 · Spiegel (5,0,2) Achse y rot 3 ·
    //   Spiegel (3,0,3) Achse y rot 1 · Spiegel (4,0,3) Achse y rot 1 · Spiegel (4,0,5) Achse y rot 1 ·
    //   Spiegel (6,0,5) Achse z rot 3 · Spiegel (4,0,6) Achse y rot 1 · Spiegel (6,1,5) Achse x rot 3
    // Generator mittel-falle, Seed 21585, Stand 1df6ca5, gesenkt um 4 · Würfel „mittel“
    name: 'Lokomotive', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 3, y: 0, z: 2, rot: 6 },
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 2 },
      { type: 'target', x: 5, y: 0, z: 0, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 2 },
      { type: 'source', x: 0, y: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 6, y: 1, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 2, z: 0, color: 'blue' },
      { type: 'target', x: 5, y: 0, z: 6, color: 'white' },
    ],
    solution: { '3,0,2': 1, '5,0,2': 3, '3,0,3': 1, '4,0,3': 1, '4,0,5': 1, '6,0,5': 3, '4,0,6': 1, '6,1,5': 3 },
  },
  // Platz im Spiel: nach „Lokomotive“
  {
    // Lösung: Spiegel (5,2,4) Achse z rot 3 · Spiegel (4,2,5) Achse y rot 0 ·
    //   Spiegel (4,1,4) Achse y rot 3 · Spiegel (5,3,4) Achse x rot 1 · Spiegel (5,3,6) Achse y rot 1 ·
    //   Spiegel (1,2,2) Achse y rot 0 · Spiegel (5,3,3) Achse x rot 0 · Spiegel (6,3,6) Achse z rot 3
    // Generator mittel-abschalten, Seed 20757, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Atelier', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 2, z: 4, dir: 0, color: 'green' },
      { type: 'mirror', x: 5, y: 2, z: 4, axis: 'z', rot: 1 },
      { type: 'target', x: 5, y: 0, z: 4, color: 'green' },
      { type: 'source', x: 4, y: 4, z: 3, axis: 'x', dir: 7, color: 'green' },
      { type: 'mirror', x: 4, y: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 4, y: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 2, rot: 3 },
      { type: 'source', x: 0, y: 2, z: 3, dir: 7, color: 'blue' },
      { type: 'mirror', x: 5, y: 3, z: 3, axis: 'x', rot: 3 },
      { type: 'target', x: 5, y: 2, z: 2, color: 'blue' },
      { type: 'mirror', x: 6, y: 3, z: 6, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 6, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 1, y: 4, z: 0, color: 'green' },
    ],
    solution: { '5,2,4': 3, '4,2,5': 0, '4,1,4': 3, '5,3,4': 1, '5,3,6': 1, '1,2,2': 0, '5,3,3': 0, '6,3,6': 3 },
  },
  // Platz im Spiel: nach „Atelier“
  {
    // Lösung: Prisma (2,0,3) Achse y rot 3 · Spiegel (1,0,2) Achse y rot 2 ·
    //   Spiegel (1,0,3) Achse z rot 1 · Spiegel (1,3,3) Achse z rot 1 · Spiegel (0,3,3) Achse y rot 3 ·
    //   Spiegel (0,3,5) Achse y rot 1 · Spiegel (1,3,6) Achse y rot 3 · Spiegel (0,3,6) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60016, Stand 74361c6 · Würfel „mittel“
    name: 'Kerzenzieher', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 0, z: 3, rot: 0 },
      { type: 'source', x: 5, y: 0, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 3, y: 0, z: 0, dir: 3, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 2, rot: 3 },
      { type: 'target', x: 2, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 1, y: 0, z: 4, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 0, y: 3, z: 6, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,0,3': 3, '1,0,2': 2, '1,0,3': 1, '1,3,3': 1, '0,3,3': 3, '0,3,5': 1, '1,3,6': 3, '0,3,6': 1 },
  },
  // Platz im Spiel: nach „Kerzenzieher“
  {
    // Lösung: Prisma (2,3,6) Achse y rot 6 · Spiegel (6,3,6) Achse y rot 3 ·
    //   Spiegel (0,3,6) Achse y rot 1 · Spiegel (5,3,3) Achse z rot 3 · Spiegel (5,4,2) Achse z rot 3 ·
    //   Spiegel (6,4,1) Achse z rot 2 · Spiegel (1,0,0) Achse x rot 3 · Spiegel (0,0,1) Achse z rot 2
    // Generator mittel-sammelstelle, Seed 20023, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Hafenkran', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 3, z: 6, rot: 1 },
      { type: 'source', x: 6, y: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 6, y: 3, z: 6, rot: 1 },
      { type: 'source', x: 0, y: 3, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 0, y: 3, z: 6, rot: 3 },
      { type: 'target', x: 1, y: 3, z: 5, color: 'red' },
      { type: 'target', x: 2, y: 3, z: 0, color: 'green' },
      { type: 'mirror', x: 5, y: 3, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 0, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 1, axis: 'z', rot: 1 },
      { type: 'target', x: 3, y: 0, z: 4, color: 'blue' },
    ],
    solution: { '2,3,6': 6, '6,3,6': 3, '0,3,6': 1, '5,3,3': 3, '5,4,2': 3, '6,4,1': 2, '1,0,0': 3, '0,0,1': 2 },
  },
  // Platz im Spiel: nach „Hafenkran“
  {
    // Lösung: Spiegel (3,0,5) Achse y rot 1 · Spiegel (0,0,5) Achse y rot 3 ·
    //   Spiegel (0,0,1) Achse y rot 1 · Spiegel (3,0,1) Achse y rot 1 · Prisma (5,0,1) Achse y rot 3 ·
    //   Spiegel (5,0,6) Achse x rot 1 · Spiegel (5,2,6) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 20258, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Mansarde', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 0, dir: 2 },
      { type: 'source', x: 6, y: 0, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 3, y: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'target', x: 3, y: 0, z: 0, color: 'blue' },
      { type: 'target', x: 4, y: 0, z: 5, color: 'white' },
      { type: 'target', x: 0, y: 0, z: 6, color: 'blue' },
      { type: 'prism', x: 5, y: 0, z: 1, rot: 5 },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 4, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 3, z: 4, color: 'red' },
    ],
    solution: { '3,0,5': 1, '0,0,5': 3, '0,0,1': 1, '3,0,1': 1, '5,0,1': 3, '5,0,6': 1, '5,2,6': 3 },
  },
  // Platz im Spiel: nach „Mansarde“
  {
    // Lösung: Prisma (1,1,4) Achse y rot 5 · Spiegel (0,1,5) Achse y rot 2 ·
    //   Spiegel (0,1,3) Achse z rot 3 · Spiegel (0,0,2) Achse x rot 0 · Spiegel (0,1,1) Achse y rot 3 ·
    //   Spiegel (1,2,1) Achse x rot 1 · Spiegel (4,2,4) Achse x rot 2 · Spiegel (5,2,3) Achse y rot 0
    // Generator mittel-sammelstelle, Seed 20179, Stand 33f26f8, gesenkt um 4 · Würfel „mittel“
    name: 'Zisterne', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 1, z: 4, rot: 3 },
      { type: 'source', x: 6, y: 1, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 1, y: 1, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 0, y: 1, z: 5, rot: 3 },
      { type: 'target', x: 0, y: 1, z: 4, color: 'red' },
      { type: 'target', x: 1, y: 1, z: 1, color: 'blue' },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 6, y: 1, z: 5, color: 'green' },
    ],
    solution: { '1,1,4': 5, '0,1,5': 2, '0,1,3': 3, '0,0,2': 0, '0,1,1': 3, '1,2,1': 1, '4,2,4': 2, '5,2,3': 0 },
  },
  // Platz im Spiel: nach „Zisterne“
  {
    // Lösung: Spiegel (1,3,2) Achse z rot 1 · Spiegel (6,3,4) Achse y rot 2 ·
    //   Spiegel (2,3,0) Achse y rot 0 · Spiegel (3,3,2) Achse z rot 3 · Spiegel (3,4,2) Achse z rot 1 ·
    //   Spiegel (2,4,2) Achse y rot 1 · Prisma (5,3,5) Achse y rot 7 · Spiegel (5,3,2) Achse y rot 1
    // Generator mittel-abschalten, Seed 20007, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Remise', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 1, y: 4, z: 2, axis: 'x', dir: 6, color: 'green' },
      { type: 'mirror', x: 1, y: 3, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 0, y: 3, z: 2, color: 'green' },
      { type: 'source', x: 4, y: 3, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 6, y: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 2, rot: 0 },
      { type: 'target', x: 2, y: 4, z: 0, color: 'green' },
      { type: 'prism', x: 5, y: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 5, y: 3, z: 2, rot: 3 },
      { type: 'target', x: 3, y: 0, z: 2, color: 'red' },
    ],
    solution: { '1,3,2': 1, '6,3,4': 2, '2,3,0': 0, '3,3,2': 3, '3,4,2': 1, '2,4,2': 1, '5,3,5': 7, '5,3,2': 1 },
  },
  // Platz im Spiel: nach „Remise“
  {
    // Lösung: Spiegel (2,1,5) Achse y rot 1 · Spiegel (2,1,3) Achse y rot 1 ·
    //   Spiegel (6,1,3) Achse y rot 3 · Spiegel (6,1,5) Achse y rot 1 · Prisma (2,1,1) Achse y rot 2 ·
    //   Spiegel (3,1,2) Achse x rot 3 · Spiegel (4,0,2) Achse z rot 0 · Spiegel (5,1,2) Achse y rot 2
    // Generator mittel-abzaehlen, Seed 60081, Stand 74361c6 · Würfel „mittel“
    name: 'Kasematte', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 6, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 6, y: 1, z: 5, rot: 3 },
      { type: 'source', x: 0, y: 1, z: 5, dir: 0, color: 'green' },
      { type: 'source', x: 6, y: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 2, y: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 6, y: 1, z: 0, color: 'green' },
      { type: 'target', x: 2, y: 1, z: 6, color: 'green' },
      { type: 'target', x: 1, y: 1, z: 3, color: 'yellow' },
      { type: 'prism', x: 2, y: 1, z: 1, rot: 5 },
      { type: 'mirror', x: 3, y: 1, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 1, z: 2, rot: 0 },
      { type: 'target', x: 3, y: 3, z: 2, color: 'red' },
    ],
    solution: { '2,1,5': 1, '2,1,3': 1, '6,1,3': 3, '6,1,5': 1, '2,1,1': 2, '3,1,2': 3, '4,0,2': 0, '5,1,2': 2 },
  },
  // Platz im Spiel: nach „Kasematte“
  {
    // Lösung: Prisma (4,2,5) Achse y rot 5 · Spiegel (4,2,3) Achse y rot 3 ·
    //   Spiegel (3,2,5) Achse y rot 1 · Spiegel (3,2,4) Achse y rot 1 · Spiegel (1,2,4) Achse z rot 3 ·
    //   Spiegel (1,0,2) Achse y rot 1 · Spiegel (1,0,5) Achse x rot 1 · Spiegel (1,2,5) Achse z rot 3
    // Generator mittel-falle, Seed 22086, Stand 1df6ca5, gesenkt um 4 · Würfel „mittel“
    name: 'Tapisserie', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 2, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, y: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 3, rot: 1 },
      { type: 'target', x: 6, y: 2, z: 3, color: 'blue' },
      { type: 'mirror', x: 3, y: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 4, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 2, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 1, y: 2, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 4, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 1, z: 4, color: 'red' },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, y: 2, z: 6, color: 'yellow' },
    ],
    solution: { '4,2,5': 5, '4,2,3': 3, '3,2,5': 1, '3,2,4': 1, '1,2,4': 3, '1,0,2': 1, '1,0,5': 1, '1,2,5': 3 },
  },
  // Platz im Spiel: nach „Tapisserie“
  {
    // Lösung: Prisma (3,0,2) Achse y rot 6 · Spiegel (5,0,2) Achse y rot 3 ·
    //   Spiegel (2,0,2) Achse y rot 1 · Spiegel (1,0,0) Achse y rot 0 · Spiegel (0,0,1) Achse y rot 2 ·
    //   Spiegel (4,0,5) Achse z rot 3 · Spiegel (4,1,6) Achse y rot 3 · Spiegel (3,2,6) Achse z rot 2
    // Generator mittel-sammelstelle, Seed 20295, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Tintenfass', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, y: 0, z: 2, rot: 3 },
      { type: 'source', x: 5, y: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 2 },
      { type: 'source', x: 2, y: 0, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 0 },
      { type: 'target', x: 4, y: 0, z: 1, color: 'blue' },
      { type: 'target', x: 3, y: 0, z: 1, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 0, rot: 3 },
      { type: 'mirror', x: 0, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 5, y: 3, z: 5, color: 'red' },
    ],
    solution: { '3,0,2': 6, '5,0,2': 3, '2,0,2': 1, '1,0,0': 0, '0,0,1': 2, '4,0,5': 3, '4,1,6': 3, '3,2,6': 2 },
  },
  // Platz im Spiel: nach „Tintenfass“
  {
    // Lösung: Prisma (2,1,5) Achse y rot 7 · Spiegel (2,1,3) Achse y rot 1 ·
    //   Spiegel (3,1,5) Achse y rot 3 · Spiegel (3,1,4) Achse y rot 3 · Prisma (2,3,1) Achse x rot 6 ·
    //   Spiegel (2,2,0) Achse x rot 2 · Spiegel (2,1,1) Achse y rot 1
    // Generator mittel-falle, Seed 22539, Stand 1df6ca5, gesenkt um 1 · Würfel „mittel“
    name: 'Mandoline', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 1, z: 5, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, y: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 3 },
      { type: 'target', x: 0, y: 1, z: 3, color: 'red' },
      { type: 'mirror', x: 3, y: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 4, rot: 2 },
      { type: 'source', x: 2, y: 3, z: 0, dir: 2 },
      { type: 'prism', x: 2, y: 3, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 1, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 3, y: 0, z: 3, color: 'blue' },
      { type: 'target', x: 4, y: 1, z: 1, color: 'blue' },
      { type: 'mirror', x: 2, y: 2, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 1, rot: 3 },
      { type: 'target', x: 3, y: 0, z: 1, color: 'red' },
    ],
    solution: { '2,1,5': 7, '2,1,3': 1, '3,1,5': 3, '3,1,4': 3, '2,3,1': 6, '2,2,0': 2, '2,1,1': 1 },
  },
  // Platz im Spiel: nach „Mandoline“
  {
    // Lösung: Spiegel (3,3,3) Achse y rot 3 · Spiegel (4,2,1) Achse y rot 3 ·
    //   Spiegel (4,2,2) Achse y rot 3 · Spiegel (2,2,3) Achse y rot 1 · Spiegel (2,3,2) Achse y rot 1 ·
    //   Spiegel (1,4,2) Achse x rot 3 · Prisma (5,2,1) Achse y rot 3 · Spiegel (5,2,3) Achse y rot 3
    // Generator mittel-abschalten, Seed 60118, Stand 74361c6 · Würfel „mittel“
    name: 'Kesselflicker', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 4, z: 2, axis: 'x', dir: 7, color: 'blue' },
      { type: 'mirror', x: 3, y: 3, z: 3, rot: 2 },
      { type: 'target', x: 3, y: 2, z: 2, color: 'blue' },
      { type: 'source', x: 6, y: 2, z: 1, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 3 },
      { type: 'target', x: 2, y: 1, z: 2, color: 'blue' },
      { type: 'source', x: 4, y: 0, z: 3, axis: 'z', dir: 5, color: 'red' },
      { type: 'mirror', x: 2, y: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 2, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 4, z: 1, color: 'red' },
      { type: 'prism', x: 5, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 3, rot: 1 },
      { type: 'target', x: 2, y: 2, z: 1, color: 'red' },
    ],
    solution: { '3,3,3': 3, '4,2,1': 3, '4,2,2': 3, '2,2,3': 1, '2,3,2': 1, '1,4,2': 3, '5,2,1': 3, '5,2,3': 3 },
  },
  // Platz im Spiel: nach „Kesselflicker“
  {
    // Lösung: Spiegel (1,1,1) Achse y rot 1 · Spiegel (1,1,3) Achse y rot 1 ·
    //   Spiegel (3,1,3) Achse y rot 1 · Spiegel (3,1,1) Achse y rot 1 · Prisma (1,1,5) Achse y rot 6 ·
    //   Spiegel (0,1,4) Achse z rot 1 · Spiegel (0,2,1) Achse y rot 3
    // Generator mittel-abzaehlen, Seed 21840, Stand 1df6ca5, gesenkt um 0 · Würfel „mittel“
    name: 'Ravelin', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 1, rot: 3 },
      { type: 'source', x: 3, y: 1, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 1, y: 1, z: 6, dir: 6 },
      { type: 'source', x: 6, y: 1, z: 3, dir: 4, color: 'cyan' },
      { type: 'target', x: 5, y: 1, z: 1, color: 'green' },
      { type: 'target', x: 0, y: 1, z: 3, color: 'green' },
      { type: 'target', x: 1, y: 1, z: 0, color: 'cyan' },
      { type: 'prism', x: 1, y: 1, z: 5, rot: 7 },
      { type: 'mirror', x: 0, y: 1, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 2, axis: 'x', rot: 0, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 2 },
      { type: 'target', x: 1, y: 0, z: 2, color: 'red' },
    ],
    solution: { '1,1,1': 1, '1,1,3': 1, '3,1,3': 1, '3,1,1': 1, '1,1,5': 6, '0,1,4': 1, '0,2,1': 3 },
  },
  // Platz im Spiel: nach „Ravelin“
  {
    // Lösung: Prisma (5,0,4) Achse y rot 6 · Spiegel (2,0,4) Achse y rot 3 ·
    //   Spiegel (2,4,1) Achse z rot 1 · Spiegel (6,0,3) Achse z rot 3 · Spiegel (6,1,2) Achse z rot 0 ·
    //   Spiegel (6,0,1) Achse z rot 3 · Spiegel (5,0,0) Achse x rot 3
    // Generator mittel-sammelstelle, Seed 60347, Stand 74361c6 · Würfel „mittel“
    name: 'Firstbalken', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, y: 0, z: 4, rot: 2 },
      { type: 'source', x: 2, y: 0, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 0 },
      { type: 'source', x: 5, y: 0, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 5, y: 0, z: 2, color: 'green' },
      { type: 'target', x: 2, y: 0, z: 1, color: 'magenta' },
      { type: 'source', x: 0, y: 4, z: 1, dir: 0, color: 'blue' },
      { type: 'mirror', x: 2, y: 4, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'target', x: 1, y: 4, z: 0, color: 'blue' },
    ],
    solution: { '5,0,4': 6, '2,0,4': 3, '2,4,1': 1, '6,0,3': 3, '6,1,2': 0, '6,0,1': 3, '5,0,0': 3 },
  },
  // Platz im Spiel: nach „Firstbalken“
  {
    // Lösung: Spiegel (3,3,5) Achse z rot 3 · Spiegel (4,4,5) Achse y rot 1 ·
    //   Spiegel (1,1,2) Achse z rot 3 · Spiegel (1,0,2) Achse x rot 3 · Spiegel (1,0,5) Achse y rot 1 ·
    //   Spiegel (3,0,5) Achse z rot 3 · Spiegel (6,3,5) Achse z rot 1
    // Generator mittel-mischziel, Seed 60019, Stand 74361c6 · Würfel „mittel“
    name: 'Theaterloge', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 3, z: 5, dir: 0, color: 'yellow' },
      { type: 'source', x: 4, y: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 5, rot: 2 },
      { type: 'target', x: 3, y: 4, z: 5, color: 'white' },
      { type: 'source', x: 6, y: 1, z: 2, dir: 4 },
      { type: 'mirror', x: 1, y: 1, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'z', rot: 2 },
      { type: 'filter', x: 4, y: 3, z: 5, color: 'blue' },
      { type: 'mirror', x: 6, y: 2, z: 5, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 3, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 6, y: 0, z: 3, color: 'blue' },
    ],
    solution: { '3,3,5': 3, '4,4,5': 1, '1,1,2': 3, '1,0,2': 3, '1,0,5': 1, '3,0,5': 3, '6,3,5': 1 },
  },
  // Platz im Spiel: nach „Theaterloge“
  {
    // Lösung: Prisma (1,1,5) Achse y rot 1 · Spiegel (4,1,2) Achse y rot 0 ·
    //   Spiegel (2,1,6) Achse x rot 1 · Spiegel (3,2,6) Achse x rot 0 · Spiegel (4,1,6) Achse y rot 3 ·
    //   Spiegel (4,0,5) Achse z rot 0 · Spiegel (4,4,1) Achse z rot 0 · Spiegel (4,3,0) Achse y rot 1
    // Generator mittel-sammelstelle, Seed 60019, Stand 74361c6 · Würfel „mittel“
    name: 'Risalit', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 1, z: 5, rot: 6 },
      { type: 'source', x: 6, y: 1, z: 4, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 4, y: 1, z: 2, rot: 1 },
      { type: 'source', x: 0, y: 1, z: 4, dir: 1, color: 'blue' },
      { type: 'target', x: 6, y: 1, z: 5, color: 'red' },
      { type: 'target', x: 1, y: 1, z: 6, color: 'blue' },
      { type: 'mirror', x: 2, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 4, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 0, rot: 2, fixed: true },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 6, y: 1, z: 0, color: 'green' },
      { type: 'blocker', x: 5, y: 2, z: 0 },
    ],
    solution: { '1,1,5': 1, '4,1,2': 0, '2,1,6': 1, '3,2,6': 0, '4,1,6': 3, '4,0,5': 0, '4,4,1': 0, '4,3,0': 1 },
  },
  // Platz im Spiel: nach „Risalit“
  {
    // Lösung: Spiegel (2,1,3) Achse z rot 0 · Spiegel (5,1,4) Achse y rot 2 ·
    //   Spiegel (6,1,5) Achse y rot 2 · Spiegel (2,0,4) Achse x rot 0 · Spiegel (0,2,4) Achse z rot 2 ·
    //   Spiegel (2,4,4) Achse x rot 1 · Spiegel (2,2,6) Achse y rot 3 · Spiegel (1,3,6) Achse x rot 3
    // Generator mittel-abschalten, Seed 60280, Stand 74361c6 · Würfel „mittel“
    name: 'Ikone', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 0, z: 2, axis: 'x', dir: 1, color: 'red' },
      { type: 'mirror', x: 2, y: 1, z: 3, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 1, z: 6, color: 'red' },
      { type: 'source', x: 6, y: 1, z: 3, dir: 3, color: 'red' },
      { type: 'mirror', x: 5, y: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 2, z: 4, rot: 1, fixed: true },
      { type: 'source', x: 4, y: 4, z: 6, axis: 'x', dir: 5, color: 'cyan' },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 5, y: 0, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 4, y: 0, z: 6, color: 'cyan' },
      { type: 'blocker', x: 3, y: 3, z: 4 },
      { type: 'mirror', x: 2, y: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 6, axis: 'x', rot: 2 },
      { type: 'target', x: 0, y: 3, z: 5, color: 'red' },
    ],
    solution: { '2,1,3': 0, '5,1,4': 2, '6,1,5': 2, '2,0,4': 0, '0,2,4': 2, '2,4,4': 1, '2,2,6': 3, '1,3,6': 3 },
  },
  // Platz im Spiel: nach „Ikone“
  {
    // Lösung: Spiegel (2,2,5) Achse y rot 1 · Spiegel (2,2,2) Achse y rot 1 ·
    //   Spiegel (4,2,2) Achse y rot 3 · Spiegel (4,2,5) Achse y rot 1 · Prisma (5,2,2) Achse y rot 4 ·
    //   Spiegel (3,2,0) Achse x rot 1 · Spiegel (2,1,0) Achse y rot 2 · Spiegel (3,0,0) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 60576, Stand 74361c6 · Würfel „mittel“
    name: 'Brigg', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 5, rot: 2 },
      { type: 'source', x: 6, y: 2, z: 2, dir: 4, color: 'cyan' },
      { type: 'source', x: 4, y: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 0, y: 2, z: 5, dir: 0, color: 'green' },
      { type: 'target', x: 2, y: 2, z: 6, color: 'green' },
      { type: 'target', x: 6, y: 2, z: 5, color: 'green' },
      { type: 'target', x: 1, y: 2, z: 2, color: 'cyan' },
      { type: 'prism', x: 5, y: 2, z: 2, rot: 7 },
      { type: 'mirror', x: 3, y: 2, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'target', x: 6, y: 0, z: 3, color: 'blue' },
    ],
    solution: { '2,2,5': 1, '2,2,2': 1, '4,2,2': 3, '4,2,5': 1, '5,2,2': 4, '3,2,0': 1, '2,1,0': 2, '3,0,0': 3 },
  },
  // Platz im Spiel: nach „Brigg“
  {
    // Lösung: Spiegel (3,0,3) Achse y rot 1 · Spiegel (3,0,1) Achse y rot 1 ·
    //   Spiegel (6,0,1) Achse y rot 3 · Spiegel (6,0,3) Achse y rot 1 · Prisma (2,0,3) Achse y rot 7 ·
    //   Spiegel (2,0,2) Achse x rot 3 · Spiegel (2,3,2) Achse z rot 1 · Spiegel (0,3,2) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 60201, Stand 74361c6 · Würfel „mittel“
    name: 'Tempera', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 3, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'source', x: 3, y: 0, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, y: 0, z: 6, dir: 6 },
      { type: 'target', x: 3, y: 0, z: 6, color: 'blue' },
      { type: 'target', x: 1, y: 0, z: 1, color: 'white' },
      { type: 'target', x: 6, y: 0, z: 0, color: 'blue' },
      { type: 'prism', x: 2, y: 0, z: 3, rot: 4 },
      { type: 'mirror', x: 2, y: 0, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 3, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 4, z: 2, color: 'red' },
    ],
    solution: { '3,0,3': 1, '3,0,1': 1, '6,0,1': 3, '6,0,3': 1, '2,0,3': 7, '2,0,2': 3, '2,3,2': 1, '0,3,2': 1 },
  },
  // Platz im Spiel: nach „Tempera“
  {
    // Lösung: Spiegel (5,1,5) Achse y rot 1 · Spiegel (5,1,3) Achse y rot 1 ·
    //   Spiegel (3,1,3) Achse y rot 1 · Spiegel (3,1,5) Achse y rot 1 · Prisma (5,1,1) Achse y rot 1 ·
    //   Spiegel (6,4,5) Achse z rot 0 · Spiegel (6,3,6) Achse x rot 2 · Spiegel (6,2,5) Achse y rot 1
    // Generator mittel-abzaehlen, Seed 60854, Stand 74361c6 · Würfel „mittel“
    name: 'Tuba', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, y: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 5, rot: 3 },
      { type: 'source', x: 5, y: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 3, y: 1, z: 6, dir: 6 },
      { type: 'source', x: 0, y: 1, z: 3, dir: 0, color: 'blue' },
      { type: 'target', x: 5, y: 1, z: 6, color: 'blue' },
      { type: 'target', x: 0, y: 1, z: 5, color: 'white' },
      { type: 'target', x: 6, y: 1, z: 3, color: 'blue' },
      { type: 'prism', x: 5, y: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 2, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 4, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 5, rot: 2 },
      { type: 'target', x: 5, y: 0, z: 4, color: 'green' },
    ],
    solution: { '5,1,5': 1, '5,1,3': 1, '3,1,3': 1, '3,1,5': 1, '5,1,1': 1, '6,4,5': 0, '6,3,6': 2, '6,2,5': 1 },
  },
  // Platz im Spiel: nach „Tuba“
  {
    // Lösung: Prisma (2,0,2) Achse y rot 2 · Prisma (2,0,1) Achse z rot 7 ·
    //   Spiegel (5,0,1) Achse y rot 1 · Spiegel (5,0,6) Achse y rot 3 · Spiegel (1,0,3) Achse y rot 0
    // Generator mittel-sammelstelle, Seed 20445, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Zinnsoldat', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 0, z: 2, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 0, dir: 1, color: 'magenta' },
      { type: 'source', x: 4, y: 0, z: 0, dir: 3, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 6, color: 'red' },
      { type: 'target', x: 2, y: 0, z: 6, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 1, dir: 0 },
      { type: 'prism', x: 2, y: 0, z: 1, axis: 'z', rot: 5 },
      { type: 'mirror', x: 5, y: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 1, rot: 2, fixed: true },
      { type: 'target', x: 2, y: 1, z: 1, color: 'red' },
      { type: 'target', x: 1, y: 3, z: 1, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 2, color: 'blue' },
    ],
    solution: { '2,0,2': 2, '2,0,1': 7, '5,0,1': 1, '5,0,6': 3, '1,0,3': 0 },
  },
  // Platz im Spiel: nach „Zinnsoldat“
  {
    // Lösung: Prisma (1,0,5) Achse y rot 6 · Spiegel (2,0,5) Achse y rot 1 ·
    //   Spiegel (5,0,1) Achse x rot 2 · Spiegel (6,0,2) Achse z rot 2 · Spiegel (3,0,5) Achse y rot 0 ·
    //   Spiegel (0,0,2) Achse z rot 1 · Spiegel (0,2,0) Achse y rot 0
    // Generator mittel-sammelstelle, Seed 20167, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Einsiedelei', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 0, z: 5, rot: 7 },
      { type: 'source', x: 1, y: 0, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 2, y: 0, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 0 },
      { type: 'target', x: 1, y: 0, z: 2, color: 'green' },
      { type: 'target', x: 0, y: 0, z: 4, color: 'magenta' },
      { type: 'mirror', x: 5, y: 0, z: 1, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 1, axis: 'x', rot: 0, fixed: true },
    ],
    solution: { '1,0,5': 6, '2,0,5': 1, '5,0,1': 2, '6,0,2': 2, '3,0,5': 0, '0,0,2': 1, '0,2,0': 0 },
  },
  // Platz im Spiel: nach „Einsiedelei“
  {
    // Lösung: Spiegel (6,4,2) Achse y rot 3 · Spiegel (6,4,5) Achse y rot 1 ·
    //   Spiegel (2,4,5) Achse y rot 1 · Spiegel (2,4,2) Achse y rot 1 · Prisma (2,4,1) Achse y rot 3 ·
    //   Spiegel (1,4,1) Achse y rot 1 · Spiegel (2,2,0) Achse y rot 1 · Spiegel (2,2,5) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 60640, Stand 74361c6 · Würfel „mittel“
    name: 'Blasebalg', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 2, rot: 2 },
      { type: 'source', x: 2, y: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, y: 4, z: 5, dir: 0, color: 'red' },
      { type: 'source', x: 6, y: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 2, y: 4, z: 6, color: 'red' },
      { type: 'target', x: 0, y: 4, z: 2, color: 'magenta' },
      { type: 'target', x: 6, y: 4, z: 0, color: 'red' },
      { type: 'prism', x: 2, y: 4, z: 1, rot: 7 },
      { type: 'mirror', x: 1, y: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 0, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 2, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 5, axis: 'x', rot: 1 },
      { type: 'target', x: 2, y: 0, z: 5, color: 'blue' },
    ],
    solution: { '6,4,2': 3, '6,4,5': 1, '2,4,5': 1, '2,4,2': 1, '2,4,1': 3, '1,4,1': 1, '2,2,0': 1, '2,2,5': 3 },
  },
  // Platz im Spiel: nach „Blasebalg“
  {
    // Lösung: Prisma (2,2,1) Achse y rot 2 · Spiegel (2,2,0) Achse y rot 3 ·
    //   Spiegel (4,2,1) Achse y rot 1 · Spiegel (0,2,3) Achse y rot 2 · Spiegel (3,2,6) Achse x rot 3 ·
    //   Spiegel (5,0,6) Achse x rot 0 · Spiegel (3,3,5) Achse x rot 2 · Spiegel (2,3,6) Achse x rot 2
    // Generator mittel-sammelstelle, Seed 20056, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Stauwehr', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 2, z: 1, rot: 7 },
      { type: 'source', x: 6, y: 2, z: 0, dir: 4, color: 'red' },
      { type: 'mirror', x: 2, y: 2, z: 0, rot: 0 },
      { type: 'source', x: 4, y: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 4, y: 2, z: 1, rot: 3 },
      { type: 'target', x: 6, y: 2, z: 5, color: 'red' },
      { type: 'target', x: 2, y: 2, z: 4, color: 'green' },
      { type: 'mirror', x: 0, y: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 6, axis: 'z', rot: 2, fixed: true },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 6, axis: 'x', rot: 1 },
      { type: 'target', x: 0, y: 3, z: 4, color: 'blue' },
    ],
    solution: { '2,2,1': 2, '2,2,0': 3, '4,2,1': 1, '0,2,3': 2, '3,2,6': 3, '5,0,6': 0, '3,3,5': 2, '2,3,6': 2 },
  },
  // Platz im Spiel: nach „Stauwehr“
  {
    // Lösung: Prisma (2,2,2) Achse y rot 0 · Spiegel (4,2,4) Achse y rot 2 ·
    //   Spiegel (3,2,1) Achse y rot 0 · Spiegel (4,2,2) Achse y rot 0 · Prisma (2,2,0) Achse z rot 0 ·
    //   Kombinator (6,2,0) Achse z dir 6
    // Generator mittel-falle, Seed 22495, Stand 1df6ca5, gesenkt um 3 · Würfel „mittel“
    name: 'Theodolit', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 2, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, y: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 4, rot: 1 },
      { type: 'target', x: 2, y: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, y: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 3 },
      { type: 'source', x: 2, y: 3, z: 0, axis: 'x', dir: 6 },
      { type: 'prism', x: 2, y: 2, z: 0, axis: 'z', rot: 6 },
      { type: 'combiner', x: 6, y: 2, z: 0, axis: 'z', dir: 5 },
      { type: 'mirror', x: 3, y: 3, z: 0, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 6, y: 0, z: 0, color: 'red' },
      { type: 'target', x: 6, y: 3, z: 0, color: 'yellow' },
    ],
    solution: { '2,2,2': 0, '4,2,4': 2, '3,2,1': 0, '4,2,2': 0, '2,2,0': 0, '6,2,0': 6 },
  },
  // Platz im Spiel: nach „Theodolit“
  {
    // Lösung: Spiegel (2,2,0) Achse y rot 3 · Spiegel (2,3,3) Achse y rot 0 ·
    //   Spiegel (1,2,3) Achse x rot 1 · Spiegel (3,0,3) Achse x rot 0 · Spiegel (5,2,3) Achse x rot 3 ·
    //   Spiegel (6,2,2) Achse z rot 1 · Spiegel (6,1,1) Achse z rot 3 · Spiegel (5,1,0) Achse x rot 1
    // Generator mittel-mischziel, Seed 60228, Stand 74361c6 · Würfel „mittel“
    name: 'Kogge', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 2, z: 0, dir: 4, color: 'green' },
      { type: 'source', x: 2, y: 4, z: 4, axis: 'x', dir: 5, color: 'red' },
      { type: 'mirror', x: 2, y: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 2, y: 3, z: 3, rot: 2 },
      { type: 'target', x: 2, y: 2, z: 4, color: 'yellow' },
      { type: 'source', x: 0, y: 2, z: 4, dir: 7, color: 'red' },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 2, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 0, axis: 'z', rot: 0, fixed: true },
      { type: 'mirror', x: 2, y: 3, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 1, y: 4, z: 1, color: 'red' },
    ],
    solution: { '2,2,0': 3, '2,3,3': 0, '1,2,3': 1, '3,0,3': 0, '5,2,3': 3, '6,2,2': 1, '6,1,1': 3, '5,1,0': 1 },
  },
  // Platz im Spiel: nach „Kogge“
  {
    // Lösung: Spiegel (5,0,2) Achse x rot 3 · Spiegel (3,0,2) Achse y rot 0 ·
    //   Spiegel (5,0,0) Achse y rot 0 · Spiegel (6,0,3) Achse z rot 3 · Prisma (2,0,1) Achse y rot 1 ·
    //   Spiegel (2,0,3) Achse y rot 1 · Spiegel (6,1,4) Achse y rot 3 · Spiegel (3,4,4) Achse x rot 0
    // Generator mittel-abschalten, Seed 60010, Stand 74361c6 · Würfel „mittel“
    name: 'Stickrahmen', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 1, y: 4, z: 2, axis: 'z', dir: 1, color: 'green' },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'x', rot: 2 },
      { type: 'target', x: 6, y: 0, z: 1, color: 'green' },
      { type: 'source', x: 1, y: 0, z: 0, dir: 1, color: 'cyan' },
      { type: 'mirror', x: 3, y: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 0, rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 3, axis: 'z', rot: 2 },
      { type: 'prism', x: 2, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 2 },
      { type: 'target', x: 6, y: 3, z: 3, color: 'blue' },
      { type: 'mirror', x: 6, y: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 4, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 4, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 0, y: 3, z: 4, color: 'green' },
    ],
    solution: { '5,0,2': 3, '3,0,2': 0, '5,0,0': 0, '6,0,3': 3, '2,0,1': 1, '2,0,3': 1, '6,1,4': 3, '3,4,4': 0 },
  },
  // Platz im Spiel: nach „Stickrahmen“
  {
    // Lösung: Spiegel (1,0,5) Achse y rot 1 · Spiegel (1,0,3) Achse y rot 1 ·
    //   Spiegel (4,0,3) Achse y rot 1 · Spiegel (4,0,5) Achse y rot 1 · Prisma (1,0,1) Achse y rot 3 ·
    //   Spiegel (0,0,2) Achse z rot 1 · Spiegel (0,3,5) Achse y rot 1 · Spiegel (1,4,5) Achse z rot 0
    // Generator mittel-abzaehlen, Seed 20866, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Grotte', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 0 },
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'red' },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 1, y: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 6, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 3, color: 'yellow' },
      { type: 'target', x: 1, y: 0, z: 6, color: 'red' },
      { type: 'prism', x: 1, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 5, axis: 'z', rot: 1 },
      { type: 'target', x: 4, y: 1, z: 5, color: 'green' },
    ],
    solution: { '1,0,5': 1, '1,0,3': 1, '4,0,3': 1, '4,0,5': 1, '1,0,1': 3, '0,0,2': 1, '0,3,5': 1, '1,4,5': 0 },
  },
  // Platz im Spiel: nach „Grotte“
  {
    // Lösung: Spiegel (1,4,3) Achse z rot 1 · Spiegel (6,4,1) Achse y rot 2 ·
    //   Spiegel (3,4,4) Achse y rot 0 · Spiegel (0,4,3) Achse y rot 3 · Spiegel (1,4,6) Achse x rot 3 ·
    //   Prisma (0,4,6) Achse x rot 6 · Spiegel (0,1,3) Achse z rot 1
    // Generator mittel-abschalten, Seed 60006, Stand 74361c6 · Würfel „mittel“
    name: 'Drechsler', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 1, y: 0, z: 3, axis: 'x', dir: 2, color: 'yellow' },
      { type: 'mirror', x: 1, y: 4, z: 3, axis: 'z', rot: 2 },
      { type: 'target', x: 2, y: 4, z: 3, color: 'yellow' },
      { type: 'source', x: 5, y: 4, z: 0, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 6, y: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 3, rot: 1 },
      { type: 'source', x: 5, y: 4, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 1, y: 4, z: 6, axis: 'x', rot: 2 },
      { type: 'target', x: 0, y: 3, z: 6, color: 'cyan' },
      { type: 'prism', x: 0, y: 4, z: 6, axis: 'x', rot: 5 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 4, z: 0, color: 'red' },
    ],
    solution: { '1,4,3': 1, '6,4,1': 2, '3,4,4': 0, '0,4,3': 3, '1,4,6': 3, '0,4,6': 6, '0,1,3': 1 },
  },
  // Platz im Spiel: nach „Drechsler“
  {
    // Lösung: Spiegel (3,1,1) Achse y rot 1 · Spiegel (1,1,1) Achse y rot 1 ·
    //   Spiegel (1,1,3) Achse y rot 3 · Spiegel (3,1,3) Achse y rot 1 · Prisma (1,1,5) Achse y rot 5 ·
    //   Spiegel (0,1,4) Achse z rot 1 · Spiegel (0,3,2) Achse z rot 0 · Spiegel (0,1,0) Achse y rot 3
    // Generator mittel-abzaehlen, Seed 60634, Stand 74361c6 · Würfel „mittel“
    name: 'Gondel', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, y: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 0 },
      { type: 'source', x: 1, y: 1, z: 6, dir: 6 },
      { type: 'source', x: 3, y: 1, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, y: 1, z: 3, dir: 4, color: 'magenta' },
      { type: 'target', x: 3, y: 1, z: 6, color: 'blue' },
      { type: 'target', x: 5, y: 1, z: 1, color: 'blue' },
      { type: 'target', x: 1, y: 1, z: 0, color: 'magenta' },
      { type: 'prism', x: 1, y: 1, z: 5, rot: 4 },
      { type: 'mirror', x: 0, y: 1, z: 4, axis: 'z', rot: 3 },
      { type: 'target', x: 0, y: 1, z: 5, color: 'red' },
      { type: 'mirror', x: 0, y: 3, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 0, rot: 0 },
      { type: 'target', x: 1, y: 0, z: 0, color: 'green' },
    ],
    solution: { '3,1,1': 1, '1,1,1': 1, '1,1,3': 3, '3,1,3': 1, '1,1,5': 5, '0,1,4': 1, '0,3,2': 0, '0,1,0': 3 },
  },
  // Platz im Spiel: nach „Gondel“
  {
    // Lösung: Spiegel (4,0,5) Achse y rot 3 · Spiegel (4,0,3) Achse x rot 3 ·
    //   Spiegel (4,3,4) Achse y rot 1 · Prisma (5,3,5) Achse y rot 0 · Spiegel (6,3,5) Achse z rot 1 ·
    //   Spiegel (6,0,5) Achse z rot 3 · Spiegel (4,0,6) Achse x rot 1
    // Generator mittel-mischziel, Seed 60479, Stand 74361c6 · Würfel „mittel“
    name: 'Okarina', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 5, y: 4, z: 4, axis: 'z', dir: 3, color: 'green' },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 4, rot: 2 },
      { type: 'target', x: 4, y: 2, z: 3, color: 'white' },
      { type: 'source', x: 4, y: 3, z: 6, dir: 7 },
      { type: 'prism', x: 5, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 6, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 4, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 4, z: 3, color: 'red' },
      { type: 'target', x: 2, y: 2, z: 6, color: 'green' },
      { type: 'target', x: 6, y: 3, z: 6, color: 'blue' },
    ],
    solution: { '4,0,5': 3, '4,0,3': 3, '4,3,4': 1, '5,3,5': 0, '6,3,5': 1, '6,0,5': 3, '4,0,6': 1 },
  },
  // Platz im Spiel: nach „Okarina“
  {
    // Lösung: Spiegel (2,0,2) Achse y rot 1 · Spiegel (2,0,0) Achse y rot 1 ·
    //   Spiegel (4,0,0) Achse y rot 3 · Spiegel (4,0,2) Achse y rot 1 · Prisma (1,0,2) Achse y rot 7 ·
    //   Spiegel (1,0,1) Achse y rot 1 · Spiegel (0,3,1) Achse x rot 1 · Spiegel (0,3,3) Achse x rot 3
    // Generator mittel-abzaehlen, Seed 60175, Stand 74361c6 · Würfel „mittel“
    name: 'Schaluppe', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 3 },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6 },
      { type: 'source', x: 6, y: 0, z: 0, dir: 4, color: 'blue' },
      { type: 'source', x: 0, y: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'target', x: 0, y: 0, z: 0, color: 'white' },
      { type: 'target', x: 5, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 2, y: 0, z: 5, color: 'blue' },
      { type: 'prism', x: 1, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 1, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 3, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 3, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 1, z: 3, color: 'red' },
    ],
    solution: { '2,0,2': 1, '2,0,0': 1, '4,0,0': 3, '4,0,2': 1, '1,0,2': 7, '1,0,1': 1, '0,3,1': 1, '0,3,3': 3 },
  },
  // Platz im Spiel: nach „Schaluppe“
  {
    // Lösung: Prisma (5,4,2) Achse y rot 1 · Spiegel (6,4,3) Achse z rot 1 ·
    //   Spiegel (6,3,6) Achse x rot 2 · Spiegel (6,4,5) Achse z rot 0 · Spiegel (6,1,2) Achse y rot 0 ·
    //   Spiegel (6,0,3) Achse x rot 0 · Spiegel (6,1,6) Achse y rot 3 · Spiegel (5,0,6) Achse x rot 1
    // Generator mittel-sammelstelle, Seed 60032, Stand 74361c6 · Würfel „mittel“
    name: 'Kaminhut', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, y: 4, z: 2, rot: 6 },
      { type: 'source', x: 6, y: 4, z: 1, dir: 3, color: 'cyan' },
      { type: 'source', x: 5, y: 4, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 5, y: 4, z: 4, color: 'blue' },
      { type: 'target', x: 6, y: 4, z: 2, color: 'red' },
      { type: 'mirror', x: 6, y: 4, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 5, axis: 'x', rot: 0, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 5, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 0, z: 1, color: 'green' },
    ],
    solution: { '5,4,2': 1, '6,4,3': 1, '6,3,6': 2, '6,4,5': 0, '6,1,2': 0, '6,0,3': 0, '6,1,6': 3, '5,0,6': 1 },
  },
  // Platz im Spiel: nach „Kaminhut“
  {
    // Lösung: Spiegel (5,3,3) Achse y rot 1 · Spiegel (2,3,6) Achse y rot 0 ·
    //   Spiegel (4,3,4) Achse y rot 2 · Spiegel (6,3,3) Achse z rot 1 · Spiegel (6,1,1) Achse y rot 0 ·
    //   Spiegel (5,3,4) Achse z rot 2 · Spiegel (6,3,5) Achse z rot 3 · Prisma (1,3,5) Achse y rot 0
    // Generator mittel-abschalten, Seed 20231, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Fayence', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 5, y: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 3 },
      { type: 'target', x: 3, y: 3, z: 3, color: 'blue' },
      { type: 'source', x: 0, y: 3, z: 4, dir: 1, color: 'cyan' },
      { type: 'mirror', x: 2, y: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 4, y: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'z', rot: 0 },
      { type: 'target', x: 6, y: 2, z: 3, color: 'blue' },
      { type: 'mirror', x: 6, y: 1, z: 1, rot: 1 },
      { type: 'source', x: 6, y: 0, z: 2, axis: 'x', dir: 3, color: 'yellow' },
      { type: 'mirror', x: 5, y: 3, z: 4, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'z', rot: 0 },
      { type: 'target', x: 6, y: 4, z: 6, color: 'yellow' },
      { type: 'prism', x: 1, y: 3, z: 5, rot: 4 },
      { type: 'target', x: 6, y: 4, z: 5, color: 'green' },
    ],
    solution: { '5,3,3': 1, '2,3,6': 0, '4,3,4': 2, '6,3,3': 1, '6,1,1': 0, '5,3,4': 2, '6,3,5': 3, '1,3,5': 0 },
  },
  // Platz im Spiel: nach „Fayence“
  {
    // Lösung: Spiegel (5,2,1) Achse y rot 0 · Spiegel (3,2,5) Achse y rot 2 ·
    //   Spiegel (1,2,3) Achse y rot 2 · Spiegel (6,2,2) Achse z rot 3 · Spiegel (6,3,1) Achse x rot 0 ·
    //   Spiegel (6,4,4) Achse x rot 0 · Spiegel (6,3,5) Achse z rot 0 · Prisma (6,4,6) Achse x rot 7
    // Generator mittel-abschalten, Seed 60296, Stand 74361c6 · Würfel „mittel“
    name: 'Treibarbeit', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 2, z: 6, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 2 },
      { type: 'target', x: 4, y: 2, z: 0, color: 'magenta' },
      { type: 'source', x: 2, y: 2, z: 6, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 3, y: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 2, axis: 'z', rot: 0 },
      { type: 'source', x: 4, y: 2, z: 6, dir: 5, color: 'green' },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'x', rot: 1 },
      { type: 'target', x: 6, y: 2, z: 0, color: 'green' },
      { type: 'mirror', x: 6, y: 4, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'z', rot: 1 },
      { type: 'prism', x: 6, y: 4, z: 6, axis: 'x', rot: 1 },
      { type: 'target', x: 6, y: 0, z: 6, color: 'red' },
    ],
    solution: { '5,2,1': 0, '3,2,5': 2, '1,2,3': 2, '6,2,2': 3, '6,3,1': 0, '6,4,4': 0, '6,3,5': 0, '6,4,6': 7 },
  },
  // Platz im Spiel: nach „Treibarbeit“
  {
    // Lösung: Prisma (4,0,1) Achse y rot 0 · Spiegel (4,0,5) Achse y rot 3 ·
    //   Spiegel (3,3,4) Achse z rot 3 · Spiegel (4,3,4) Achse y rot 3 · Prisma (4,3,2) Achse x rot 3 ·
    //   Spiegel (4,3,0) Achse x rot 3 · Spiegel (4,4,2) Achse z rot 3
    // Generator mittel-sammelstelle, Seed 60595, Stand 74361c6 · Würfel „mittel“
    name: 'Parkett', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 0, z: 1, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'red' },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 1 },
      { type: 'source', x: 3, y: 0, z: 0, dir: 1, color: 'blue' },
      { type: 'target', x: 5, y: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, y: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 3, y: 0, z: 4, axis: 'x', dir: 2 },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 4, rot: 0 },
      { type: 'prism', x: 4, y: 3, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 3, z: 0, axis: 'x', rot: 2 },
      { type: 'target', x: 4, y: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 4, y: 4, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 2, axis: 'z', rot: 1, fixed: true },
    ],
    solution: { '4,0,1': 0, '4,0,5': 3, '3,3,4': 3, '4,3,4': 3, '4,3,2': 3, '4,3,0': 3, '4,4,2': 3 },
  },
  // Platz im Spiel: nach „Parkett“
  {
    // Lösung: Spiegel (0,3,3) Achse y rot 3 · Spiegel (0,3,1) Achse y rot 1 ·
    //   Spiegel (4,3,1) Achse y rot 1 · Spiegel (4,3,3) Achse y rot 1 · Prisma (4,3,4) Achse y rot 5 ·
    //   Spiegel (2,3,4) Achse z rot 3 · Spiegel (6,1,4) Achse z rot 1 · Spiegel (6,0,4) Achse x rot 1
    // Generator mittel-abzaehlen, Seed 60252, Stand 74361c6 · Würfel „mittel“
    name: 'Akanthus', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 3, rot: 2 },
      { type: 'source', x: 4, y: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, y: 3, z: 1, dir: 4, color: 'blue' },
      { type: 'source', x: 0, y: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 5, y: 3, z: 3, color: 'cyan' },
      { type: 'target', x: 4, y: 3, z: 0, color: 'blue' },
      { type: 'target', x: 0, y: 3, z: 6, color: 'blue' },
      { type: 'prism', x: 4, y: 3, z: 4, rot: 7 },
      { type: 'mirror', x: 2, y: 3, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 1, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 1, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 4, axis: 'x', rot: 0 },
      { type: 'target', x: 6, y: 0, z: 1, color: 'red' },
    ],
    solution: { '0,3,3': 3, '0,3,1': 1, '4,3,1': 1, '4,3,3': 1, '4,3,4': 5, '2,3,4': 3, '6,1,4': 1, '6,0,4': 1 },
  },
  // Platz im Spiel: nach „Akanthus“
  {
    // Lösung: Prisma (2,2,5) Achse y rot 7 · Spiegel (3,2,6) Achse y rot 0 ·
    //   Spiegel (3,2,5) Achse z rot 3 · Spiegel (5,0,1) Achse y rot 3 · Spiegel (6,0,1) Achse y rot 1 ·
    //   Spiegel (6,0,4) Achse x rot 1 · Spiegel (6,4,5) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 20572, Stand 33f26f8, gesenkt um 1 · Würfel „mittel“
    name: 'Pechnase', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 2, z: 5, rot: 4 },
      { type: 'source', x: 6, y: 2, z: 3, dir: 3, color: 'green' },
      { type: 'mirror', x: 3, y: 2, z: 6, rot: 3 },
      { type: 'source', x: 0, y: 2, z: 5, dir: 0, color: 'magenta' },
      { type: 'target', x: 5, y: 2, z: 2, color: 'green' },
      { type: 'target', x: 2, y: 2, z: 2, color: 'red' },
      { type: 'mirror', x: 3, y: 2, z: 5, axis: 'z', rot: 1 },
      { type: 'target', x: 3, y: 4, z: 5, color: 'cyan' },
      { type: 'source', x: 5, y: 0, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 5, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 4, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 5, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 4, z: 5, axis: 'z', rot: 3 },
    ],
    solution: { '2,2,5': 7, '3,2,6': 0, '3,2,5': 3, '5,0,1': 3, '6,0,1': 1, '6,0,4': 1, '6,4,5': 1 },
  },
  // Platz im Spiel: nach „Pechnase“
  {
    // Lösung: Spiegel (4,3,4) Achse z rot 3 · Spiegel (6,2,5) Achse y rot 2 ·
    //   Spiegel (5,2,6) Achse y rot 0 · Spiegel (4,4,5) Achse x rot 0 · Spiegel (1,1,5) Achse y rot 1 ·
    //   Spiegel (4,0,5) Achse x rot 3 · Spiegel (4,3,6) Achse y rot 3 · Spiegel (1,0,6) Achse z rot 0
    // Generator mittel-abschalten, Seed 60083, Stand 74361c6 · Würfel „mittel“
    name: 'Wagner', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 3, z: 0, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 4, y: 3, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 2, z: 5, color: 'yellow' },
      { type: 'source', x: 1, y: 2, z: 0, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 6, y: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 4, y: 4, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 2 },
      { type: 'source', x: 1, y: 0, z: 4, axis: 'x', dir: 1, color: 'blue' },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 2, y: 0, z: 5, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'filter', x: 3, y: 2, z: 6, color: 'red' },
      { type: 'target', x: 0, y: 1, z: 6, color: 'red' },
    ],
    solution: { '4,3,4': 3, '6,2,5': 2, '5,2,6': 0, '4,4,5': 0, '1,1,5': 1, '4,0,5': 3, '4,3,6': 3, '1,0,6': 0 },
  },
  // Platz im Spiel: nach „Wagner“
  {
    // Lösung: Prisma (4,2,1) Achse y rot 1 · Spiegel (6,2,3) Achse z rot 3 ·
    //   Spiegel (6,3,4) Achse y rot 0 · Spiegel (6,4,3) Achse z rot 0 · Spiegel (6,2,1) Achse z rot 3 ·
    //   Spiegel (5,2,0) Achse x rot 1 · Spiegel (6,0,1) Achse y rot 2 · Spiegel (3,0,4) Achse x rot 2
    // Generator mittel-sammelstelle, Seed 60078, Stand 74361c6 · Würfel „mittel“
    name: 'Planierraupe', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 2, z: 1, rot: 2 },
      { type: 'source', x: 4, y: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, y: 2, z: 5, dir: 7, color: 'red' },
      { type: 'target', x: 4, y: 2, z: 4, color: 'blue' },
      { type: 'target', x: 5, y: 2, z: 1, color: 'red' },
      { type: 'mirror', x: 6, y: 2, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 0, axis: 'z', rot: 2, fixed: true },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 4, axis: 'x', rot: 3 },
      { type: 'target', x: 2, y: 0, z: 3, color: 'green' },
    ],
    solution: { '4,2,1': 1, '6,2,3': 3, '6,3,4': 0, '6,4,3': 0, '6,2,1': 3, '5,2,0': 1, '6,0,1': 2, '3,0,4': 2 },
  },
  // Platz im Spiel: nach „Planierraupe“
  {
    // Lösung: Spiegel (3,4,4) Achse y rot 1 · Spiegel (1,4,5) Achse y rot 3 ·
    //   Prisma (1,1,3) Achse z rot 5 · Spiegel (1,3,3) Achse x rot 1 · Spiegel (0,1,3) Achse z rot 1 ·
    //   Spiegel (6,4,3) Achse y rot 1 · Spiegel (6,4,5) Achse y rot 3
    // Generator mittel-mischziel, Seed 20955, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Barbakane', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 4, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, y: 4, z: 5, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 3, y: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 5, rot: 0 },
      { type: 'target', x: 1, y: 4, z: 4, color: 'white' },
      { type: 'source', x: 2, y: 0, z: 3, axis: 'z', dir: 5 },
      { type: 'prism', x: 1, y: 1, z: 3, axis: 'z', rot: 4 },
      { type: 'mirror', x: 1, y: 3, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 3, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 1, y: 3, z: 4, color: 'blue' },
      { type: 'mirror', x: 6, y: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 0 },
      { type: 'target', x: 1, y: 4, z: 6, color: 'red' },
    ],
    solution: { '3,4,4': 1, '1,4,5': 3, '1,1,3': 5, '1,3,3': 1, '0,1,3': 1, '6,4,3': 1, '6,4,5': 3 },
  },
  // Platz im Spiel: nach „Barbakane“
  {
    // Lösung: Spiegel (5,1,1) Achse y rot 1 · Spiegel (2,1,1) Achse y rot 1 ·
    //   Spiegel (2,1,4) Achse y rot 1 · Spiegel (5,1,4) Achse y rot 1 · Prisma (2,1,5) Achse y rot 5 ·
    //   Spiegel (0,1,5) Achse z rot 3 · Spiegel (0,0,5) Achse z rot 1 · Spiegel (4,0,5) Achse z rot 3
    // Generator mittel-abzaehlen, Seed 22143, Stand 1df6ca5, gesenkt um 0 · Würfel „mittel“
    name: 'Alphorn', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, y: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 5, y: 1, z: 4, rot: 3 },
      { type: 'source', x: 2, y: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, y: 1, z: 1, dir: 0, color: 'cyan' },
      { type: 'source', x: 6, y: 1, z: 4, dir: 4, color: 'blue' },
      { type: 'target', x: 0, y: 1, z: 4, color: 'blue' },
      { type: 'target', x: 5, y: 1, z: 5, color: 'cyan' },
      { type: 'target', x: 2, y: 1, z: 0, color: 'blue' },
      { type: 'prism', x: 2, y: 1, z: 5, rot: 6 },
      { type: 'mirror', x: 0, y: 1, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 4, z: 5, color: 'red' },
    ],
    solution: { '5,1,1': 1, '2,1,1': 1, '2,1,4': 1, '5,1,4': 1, '2,1,5': 5, '0,1,5': 3, '0,0,5': 1, '4,0,5': 3 },
  },
  // Platz im Spiel: nach „Alphorn“
  {
    // Lösung: Spiegel (3,0,0) Achse y rot 3 · Spiegel (6,0,0) Achse y rot 1 ·
    //   Spiegel (6,0,5) Achse y rot 3 · Spiegel (0,0,5) Achse z rot 1 · Spiegel (0,1,5) Achse x rot 3 ·
    //   Spiegel (0,1,4) Achse y rot 3 · Spiegel (4,1,2) Achse z rot 1 · Prisma (6,1,4) Achse y rot 3
    // Generator mittel, Seed 20064, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Scheune', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 0, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 3, y: 0, z: 0, rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 0, rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 4, rot: 1 },
      { type: 'source', x: 4, y: 3, z: 0, axis: 'x', dir: 7 },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'z', rot: 3 },
      { type: 'target', x: 5, y: 1, z: 4, color: 'cyan' },
      { type: 'prism', x: 6, y: 1, z: 4, rot: 2 },
      { type: 'target', x: 4, y: 1, z: 6, color: 'green' },
      { type: 'target', x: 6, y: 1, z: 6, color: 'red' },
    ],
    solution: { '3,0,0': 3, '6,0,0': 1, '6,0,5': 3, '0,0,5': 1, '0,1,5': 3, '0,1,4': 3, '4,1,2': 1, '6,1,4': 3 },
  },
  // Platz im Spiel: nach „Scheune“
  {
    // Lösung: Prisma (3,0,4) Achse y rot 7 · Spiegel (5,0,4) Achse y rot 1 ·
    //   Spiegel (3,0,3) Achse y rot 3 · Spiegel (4,0,3) Achse y rot 3 · Spiegel (4,0,2) Achse x rot 3 ·
    //   Spiegel (4,3,2) Achse x rot 3 · Spiegel (4,3,1) Achse x rot 1 · Spiegel (4,1,1) Achse z rot 3
    // Generator mittel-falle, Seed 21812, Stand 1df6ca5, gesenkt um 1 · Würfel „mittel“
    name: 'Hebebühne', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 0, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 3, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 2 },
      { type: 'target', x: 5, y: 0, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 0 },
      { type: 'source', x: 0, y: 3, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 2, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 6, y: 3, z: 2, color: 'yellow' },
      { type: 'mirror', x: 4, y: 3, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 1, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 0, z: 1, color: 'red' },
    ],
    solution: { '3,0,4': 7, '5,0,4': 1, '3,0,3': 3, '4,0,3': 3, '4,0,2': 3, '4,3,2': 3, '4,3,1': 1, '4,1,1': 3 },
  },
  // Platz im Spiel: nach „Hebebühne“
  {
    // Lösung: Prisma (1,2,2) Achse y rot 1 · Spiegel (0,2,2) Achse y rot 1 ·
    //   Spiegel (4,2,2) Achse z rot 1 · Spiegel (6,2,2) Achse z rot 3 · Spiegel (6,3,2) Achse x rot 1 ·
    //   Spiegel (5,0,5) Achse z rot 1 · Spiegel (5,4,5) Achse x rot 1 · Spiegel (5,4,6) Achse x rot 3
    // Generator mittel-sammelstelle, Seed 60328, Stand 74361c6 · Würfel „mittel“
    name: 'Stechbeitel', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, y: 2, z: 2, rot: 5 },
      { type: 'source', x: 0, y: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 0, y: 2, z: 2, rot: 2 },
      { type: 'source', x: 3, y: 2, z: 0, dir: 3, color: 'green' },
      { type: 'target', x: 1, y: 2, z: 4, color: 'blue' },
      { type: 'target', x: 5, y: 2, z: 6, color: 'cyan' },
      { type: 'source', x: 4, y: 4, z: 2, axis: 'x', dir: 6, color: 'blue' },
      { type: 'mirror', x: 4, y: 2, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 5, y: 0, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 4, z: 6, axis: 'x', rot: 0 },
    ],
    solution: { '1,2,2': 1, '0,2,2': 1, '4,2,2': 1, '6,2,2': 3, '6,3,2': 1, '5,0,5': 1, '5,4,5': 1, '5,4,6': 3 },
  },
  // Platz im Spiel: nach „Stechbeitel“
  {
    // Lösung: Spiegel (5,1,0) Achse z rot 3 · Spiegel (6,0,5) Achse y rot 2 ·
    //   Spiegel (3,0,2) Achse y rot 2 · Spiegel (5,2,0) Achse x rot 1 · Spiegel (6,2,1) Achse y rot 2 ·
    //   Spiegel (3,0,0) Achse x rot 3 · Spiegel (2,0,1) Achse y rot 2 · Prisma (1,0,4) Achse y rot 3
    // Generator mittel-abschalten, Seed 21397, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Papyrus', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 1, z: 0, dir: 0, color: 'green' },
      { type: 'mirror', x: 5, y: 1, z: 0, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 0, z: 0, color: 'green' },
      { type: 'source', x: 5, y: 0, z: 6, dir: 7, color: 'green' },
      { type: 'mirror', x: 6, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'x', rot: 3 },
      { type: 'target', x: 5, y: 2, z: 5, color: 'green' },
      { type: 'mirror', x: 6, y: 2, z: 1, rot: 0 },
      { type: 'source', x: 1, y: 2, z: 6, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 1, rot: 3 },
      { type: 'prism', x: 1, y: 0, z: 4, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 4, color: 'blue' },
      { type: 'target', x: 1, y: 0, z: 6, color: 'red' },
    ],
    solution: { '5,1,0': 3, '6,0,5': 2, '3,0,2': 2, '5,2,0': 1, '6,2,1': 2, '3,0,0': 3, '2,0,1': 2, '1,0,4': 3 },
  },
  // Platz im Spiel: nach „Papyrus“
  {
    // Lösung: Spiegel (2,4,3) Achse z rot 2 · Spiegel (0,1,2) Achse y rot 2 ·
    //   Spiegel (3,1,5) Achse y rot 2 · Spiegel (3,4,4) Achse x rot 2 · Spiegel (4,4,5) Achse y rot 2 ·
    //   Spiegel (1,3,5) Achse y rot 2 · Spiegel (2,0,5) Achse z rot 0 · Prisma (5,4,2) Achse y rot 6
    // Generator mittel-abschalten, Seed 60660, Stand 74361c6 · Würfel „mittel“
    name: 'Pleuel', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 5, y: 4, z: 0, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'z', rot: 1 },
      { type: 'target', x: 2, y: 1, z: 6, color: 'magenta' },
      { type: 'source', x: 2, y: 1, z: 0, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 0, y: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 3, y: 4, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 5, rot: 1 },
      { type: 'source', x: 3, y: 4, z: 6, dir: 7, color: 'green' },
      { type: 'mirror', x: 2, y: 4, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 2, z: 5, color: 'green' },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'prism', x: 5, y: 4, z: 2, rot: 2 },
      { type: 'target', x: 3, y: 4, z: 0, color: 'red' },
      { type: 'target', x: 6, y: 4, z: 1, color: 'blue' },
    ],
    solution: { '2,4,3': 2, '0,1,2': 2, '3,1,5': 2, '3,4,4': 2, '4,4,5': 2, '1,3,5': 2, '2,0,5': 0, '5,4,2': 6 },
  },
  // Platz im Spiel: nach „Pleuel“
  {
    // Lösung: Spiegel (1,2,1) Achse y rot 1 · Spiegel (1,2,3) Achse y rot 3 ·
    //   Spiegel (5,2,3) Achse y rot 1 · Spiegel (5,2,1) Achse y rot 1 · Prisma (1,2,4) Achse y rot 5 ·
    //   Spiegel (0,2,3) Achse z rot 3 · Spiegel (0,2,4) Achse z rot 3 · Spiegel (0,1,4) Achse x rot 1
    // Generator mittel-abzaehlen, Seed 21581, Stand 1df6ca5, gesenkt um 3 · Würfel „mittel“
    name: 'Sfumato', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 0 },
      { type: 'source', x: 6, y: 2, z: 3, dir: 4, color: 'cyan' },
      { type: 'source', x: 5, y: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 1, y: 2, z: 6, dir: 6 },
      { type: 'target', x: 6, y: 2, z: 1, color: 'blue' },
      { type: 'target', x: 5, y: 2, z: 6, color: 'blue' },
      { type: 'target', x: 1, y: 2, z: 0, color: 'cyan' },
      { type: 'prism', x: 1, y: 2, z: 4, rot: 6 },
      { type: 'mirror', x: 0, y: 2, z: 3, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 0, z: 1, color: 'green' },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 4, axis: 'x', rot: 2 },
      { type: 'target', x: 0, y: 1, z: 1, color: 'red' },
    ],
    solution: { '1,2,1': 1, '1,2,3': 3, '5,2,3': 1, '5,2,1': 1, '1,2,4': 5, '0,2,3': 3, '0,2,4': 3, '0,1,4': 1 },
  },
  // Platz im Spiel: nach „Sfumato“
  {
    // Lösung: Spiegel (2,0,4) Achse z rot 3 · Spiegel (1,0,4) Achse y rot 1 ·
    //   Spiegel (0,0,4) Achse y rot 1 · Spiegel (2,3,1) Achse z rot 3 · Spiegel (3,3,0) Achse x rot 3 ·
    //   Prisma (4,4,0) Achse z rot 0 · Spiegel (1,0,1) Achse y rot 3 · Spiegel (2,1,4) Achse z rot 3
    // Generator mittel-abschalten, Seed 60610, Stand 74361c6 · Würfel „mittel“
    name: 'Galionsfigur', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 0, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'z', rot: 1 },
      { type: 'target', x: 0, y: 0, z: 2, color: 'cyan' },
      { type: 'source', x: 1, y: 0, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 1, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 0, axis: 'x', rot: 2 },
      { type: 'prism', x: 4, y: 4, z: 0, axis: 'z', rot: 6 },
      { type: 'mirror', x: 6, y: 2, z: 0, axis: 'z', rot: 2, fixed: true },
      { type: 'target', x: 5, y: 1, z: 0, color: 'blue' },
      { type: 'target', x: 6, y: 4, z: 0, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 1, rot: 0 },
      { type: 'source', x: 6, y: 0, z: 1, dir: 4, color: 'red' },
      { type: 'mirror', x: 2, y: 1, z: 4, axis: 'z', rot: 0 },
      { type: 'target', x: 5, y: 1, z: 4, color: 'red' },
    ],
    solution: { '2,0,4': 3, '1,0,4': 1, '0,0,4': 1, '2,3,1': 3, '3,3,0': 3, '4,4,0': 0, '1,0,1': 3, '2,1,4': 3 },
  },
  // Platz im Spiel: nach „Galionsfigur“
  {
    // Lösung: Prisma (2,3,6) Achse y rot 5 · Spiegel (5,3,3) Achse y rot 2 ·
    //   Spiegel (6,3,6) Achse y rot 3 · Spiegel (1,1,3) Achse x rot 1 · Spiegel (1,0,5) Achse y rot 3 ·
    //   Spiegel (0,1,0) Achse x rot 3 · Spiegel (1,0,3) Achse x rot 3 · Spiegel (0,3,0) Achse x rot 1
    // Generator mittel-sammelstelle, Seed 60551, Stand 74361c6 · Würfel „mittel“
    name: 'Oldtimer', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 3, z: 6, rot: 1 },
      { type: 'source', x: 2, y: 3, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 1 },
      { type: 'source', x: 6, y: 3, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 6, y: 3, z: 6, rot: 1 },
      { type: 'target', x: 1, y: 3, z: 6, color: 'red' },
      { type: 'target', x: 0, y: 3, z: 4, color: 'yellow' },
      { type: 'source', x: 1, y: 1, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 1, y: 1, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 1, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 1, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 3, z: 0, axis: 'x', rot: 3 },
    ],
    solution: { '2,3,6': 5, '5,3,3': 2, '6,3,6': 3, '1,1,3': 1, '1,0,5': 3, '0,1,0': 3, '1,0,3': 3, '0,3,0': 1 },
  },
  // Platz im Spiel: nach „Oldtimer“
  {
    // Lösung: Prisma (2,1,1) Achse y rot 4 · Spiegel (2,1,4) Achse y rot 3 ·
    //   Spiegel (4,0,1) Achse y rot 3 · Prisma (1,0,1) Achse z rot 5 · Spiegel (0,1,3) Achse z rot 1 ·
    //   Spiegel (0,3,5) Achse x rot 0
    // Generator mittel-sammelstelle, Seed 20807, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Passage', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 1, z: 1, rot: 6 },
      { type: 'source', x: 6, y: 1, z: 1, dir: 4, color: 'green' },
      { type: 'source', x: 0, y: 1, z: 4, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 2, y: 1, z: 4, rot: 1 },
      { type: 'target', x: 1, y: 1, z: 1, color: 'cyan' },
      { type: 'target', x: 1, y: 1, z: 0, color: 'blue' },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2 },
      { type: 'mirror', x: 4, y: 0, z: 1, rot: 1 },
      { type: 'prism', x: 1, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 0, y: 3, z: 1, color: 'green' },
      { type: 'target', x: 0, y: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 5, axis: 'x', rot: 2 },
      { type: 'target', x: 0, y: 2, z: 6, color: 'red' },
    ],
    solution: { '2,1,1': 4, '2,1,4': 3, '4,0,1': 3, '1,0,1': 5, '0,1,3': 1, '0,3,5': 0 },
  },
  // Platz im Spiel: nach „Passage“
  {
    // Lösung: Spiegel (1,1,6) Achse y rot 3 · Spiegel (3,1,6) Achse y rot 1 ·
    //   Spiegel (3,1,3) Achse y rot 1 · Spiegel (1,1,3) Achse y rot 1 · Prisma (3,1,1) Achse y rot 1 ·
    //   Spiegel (4,1,2) Achse x rot 3 · Spiegel (5,0,2) Achse x rot 1 · Spiegel (6,0,1) Achse z rot 2
    // Generator mittel-abzaehlen, Seed 20377, Stand 33f26f8, gesenkt um 1 · Würfel „mittel“
    name: 'Eingangshalle', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, y: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 3, rot: 2 },
      { type: 'source', x: 6, y: 1, z: 6, dir: 4, color: 'cyan' },
      { type: 'source', x: 3, y: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, y: 1, z: 3, dir: 0, color: 'blue' },
      { type: 'target', x: 0, y: 1, z: 6, color: 'blue' },
      { type: 'target', x: 6, y: 1, z: 3, color: 'blue' },
      { type: 'target', x: 1, y: 1, z: 0, color: 'cyan' },
      { type: 'prism', x: 3, y: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 1, y: 4, z: 0, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 0, y: 4, z: 1, color: 'green' },
    ],
    solution: { '1,1,6': 3, '3,1,6': 1, '3,1,3': 1, '1,1,3': 1, '3,1,1': 1, '4,1,2': 3, '5,0,2': 1, '6,0,1': 2 },
  },
  // Platz im Spiel: nach „Eingangshalle“
  {
    // Lösung: Spiegel (4,2,1) Achse z rot 1 · Spiegel (0,2,3) Achse y rot 2 ·
    //   Spiegel (1,2,2) Achse y rot 2 · Spiegel (5,2,1) Achse z rot 3 · Spiegel (5,1,0) Achse y rot 3 ·
    //   Spiegel (6,2,2) Achse y rot 2 · Prisma (1,2,4) Achse y rot 6 · Spiegel (1,2,3) Achse x rot 1
    // Generator mittel-abschalten, Seed 21810, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Raspel', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 4, z: 1, axis: 'x', dir: 6, color: 'red' },
      { type: 'mirror', x: 4, y: 2, z: 1, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 2, z: 1, color: 'red' },
      { type: 'source', x: 3, y: 2, z: 6, dir: 5 },
      { type: 'mirror', x: 0, y: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 1, axis: 'z', rot: 0 },
      { type: 'target', x: 5, y: 3, z: 1, color: 'red' },
      { type: 'mirror', x: 5, y: 1, z: 0, rot: 2 },
      { type: 'source', x: 6, y: 0, z: 0, axis: 'z', dir: 5, color: 'cyan' },
      { type: 'mirror', x: 6, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 6, y: 2, z: 4, color: 'cyan' },
      { type: 'prism', x: 1, y: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'x', rot: 2 },
      { type: 'target', x: 1, y: 0, z: 3, color: 'green' },
      { type: 'target', x: 4, y: 1, z: 0, color: 'blue' },
    ],
    solution: { '4,2,1': 1, '0,2,3': 2, '1,2,2': 2, '5,2,1': 3, '5,1,0': 3, '6,2,2': 2, '1,2,4': 6, '1,2,3': 1 },
  },
  // Platz im Spiel: nach „Raspel“
  {
    // Lösung: Prisma (5,3,6) Achse y rot 7 · Prisma (5,0,4) Achse x rot 2 ·
    //   Spiegel (5,1,4) Achse x rot 3 · Spiegel (5,1,2) Achse y rot 3 · Spiegel (6,1,2) Achse z rot 3 ·
    //   Spiegel (5,1,5) Achse x rot 2
    // Generator mittel-sammelstelle, Seed 60624, Stand 74361c6 · Würfel „mittel“
    name: 'Lithografie', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, y: 3, z: 6, rot: 4 },
      { type: 'source', x: 0, y: 3, z: 1, dir: 1, color: 'red' },
      { type: 'source', x: 0, y: 3, z: 6, dir: 0, color: 'cyan' },
      { type: 'target', x: 5, y: 3, z: 1, color: 'magenta' },
      { type: 'target', x: 6, y: 3, z: 6, color: 'blue' },
      { type: 'source', x: 5, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 5, y: 0, z: 4, axis: 'x', rot: 6 },
      { type: 'mirror', x: 5, y: 1, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 5, axis: 'x', rot: 3 },
      { type: 'target', x: 6, y: 2, z: 2, color: 'green' },
      { type: 'target', x: 6, y: 3, z: 5, color: 'green' },
      { type: 'target', x: 5, y: 4, z: 2, color: 'red' },
    ],
    solution: { '5,3,6': 7, '5,0,4': 2, '5,1,4': 3, '5,1,2': 3, '6,1,2': 3, '5,1,5': 2 },
  },
  // Platz im Spiel: nach „Lithografie“
  {
    // Lösung: Spiegel (2,4,1) Achse y rot 1 · Spiegel (4,4,1) Achse y rot 1 ·
    //   Spiegel (4,4,5) Achse y rot 1 · Spiegel (2,4,5) Achse y rot 3 · Prisma (1,4,5) Achse y rot 0 ·
    //   Spiegel (2,4,6) Achse x rot 3 · Spiegel (2,0,6) Achse x rot 1 · Spiegel (1,0,5) Achse y rot 2
    // Generator mittel-abzaehlen, Seed 60851, Stand 74361c6 · Würfel „mittel“
    name: 'Heissluftballon', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 1 },
      { type: 'source', x: 2, y: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, y: 4, z: 1, dir: 4, color: 'green' },
      { type: 'source', x: 0, y: 4, z: 5, dir: 0, color: 'cyan' },
      { type: 'target', x: 5, y: 4, z: 5, color: 'yellow' },
      { type: 'target', x: 4, y: 4, z: 0, color: 'green' },
      { type: 'target', x: 0, y: 4, z: 1, color: 'green' },
      { type: 'prism', x: 1, y: 4, z: 5, rot: 6 },
      { type: 'mirror', x: 2, y: 4, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 6, rot: 2, fixed: true },
      { type: 'mirror', x: 2, y: 0, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 2, y: 0, z: 0, color: 'blue' },
    ],
    solution: { '2,4,1': 1, '4,4,1': 1, '4,4,5': 1, '2,4,5': 3, '1,4,5': 0, '2,4,6': 3, '2,0,6': 1, '1,0,5': 2 },
  },
  // Platz im Spiel: nach „Heissluftballon“
  {
    // Lösung: Spiegel (3,1,3) Achse x rot 3 · Spiegel (0,1,1) Achse y rot 3 ·
    //   Spiegel (0,1,6) Achse y rot 1 · Spiegel (3,1,2) Achse y rot 1 · Spiegel (3,3,4) Achse y rot 1 ·
    //   Spiegel (2,0,2) Achse x rot 1 · Spiegel (1,0,1) Achse z rot 2 · Prisma (5,1,1) Achse y rot 3
    // Generator mittel-abschalten, Seed 60520, Stand 74361c6 · Würfel „mittel“
    name: 'Spengler', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 0, z: 3, axis: 'x', dir: 2, color: 'blue' },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'x', rot: 2 },
      { type: 'target', x: 3, y: 1, z: 6, color: 'blue' },
      { type: 'source', x: 6, y: 1, z: 1, dir: 4 },
      { type: 'mirror', x: 0, y: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 2, rot: 2 },
      { type: 'target', x: 1, y: 1, z: 2, color: 'blue' },
      { type: 'mirror', x: 3, y: 3, z: 4, rot: 3 },
      { type: 'source', x: 4, y: 4, z: 4, axis: 'z', dir: 3, color: 'yellow' },
      { type: 'mirror', x: 2, y: 0, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 4, y: 0, z: 2, color: 'yellow' },
      { type: 'prism', x: 5, y: 1, z: 1, rot: 6 },
      { type: 'target', x: 2, y: 0, z: 3, color: 'green' },
      { type: 'target', x: 5, y: 1, z: 6, color: 'red' },
    ],
    solution: { '3,1,3': 3, '0,1,1': 3, '0,1,6': 1, '3,1,2': 1, '3,3,4': 1, '2,0,2': 1, '1,0,1': 2, '5,1,1': 3 },
  },
  // Platz im Spiel: nach „Spengler“
  {
    // Lösung: Prisma (3,0,2) Achse y rot 0 · Spiegel (5,0,4) Achse y rot 2 ·
    //   Spiegel (4,0,1) Achse y rot 0 · Spiegel (5,0,2) Achse y rot 0 · Spiegel (6,1,2) Achse y rot 3 ·
    //   Spiegel (6,0,1) Achse z rot 3 · Spiegel (5,0,0) Achse x rot 3 · Spiegel (6,1,0) Achse y rot 0
    // Generator mittel-falle, Seed 90861, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Klipper', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, y: 0, z: 2, rot: 4 },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 1 },
      { type: 'target', x: 3, y: 0, z: 6, color: 'blue' },
      { type: 'mirror', x: 4, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 3 },
      { type: 'source', x: 3, y: 4, z: 2, axis: 'z', dir: 1 },
      { type: 'mirror', x: 6, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 0 },
      { type: 'filter', x: 2, y: 3, z: 0, color: 'cyan' },
      { type: 'target', x: 1, y: 4, z: 0, color: 'cyan' },
      { type: 'mirror', x: 6, y: 1, z: 0, rot: 2 },
      { type: 'target', x: 6, y: 4, z: 3, color: 'red' },
    ],
    solution: { '3,0,2': 0, '5,0,4': 2, '4,0,1': 0, '5,0,2': 0, '6,1,2': 3, '6,0,1': 3, '5,0,0': 3, '6,1,0': 0 },
  },
  // Platz im Spiel: nach „Klipper“
  {
    // Lösung: Spiegel (1,3,3) Achse y rot 3 · Spiegel (0,3,1) Achse y rot 2 ·
    //   Spiegel (1,3,2) Achse y rot 2 · Spiegel (2,3,3) Achse z rot 1 · Spiegel (2,2,4) Achse y rot 1 ·
    //   Spiegel (2,3,1) Achse x rot 1 · Spiegel (2,0,3) Achse x rot 3 · Spiegel (2,0,5) Achse y rot 1
    // Generator mittel-abschalten, Seed 60932, Stand 74361c6 · Würfel „mittel“
    name: 'Posaune', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 1, y: 3, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, y: 3, z: 3, rot: 2 },
      { type: 'target', x: 0, y: 3, z: 3, color: 'yellow' },
      { type: 'source', x: 1, y: 3, z: 0, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 0, y: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 1, y: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 4, rot: 3 },
      { type: 'source', x: 4, y: 0, z: 4, axis: 'z', dir: 5, color: 'blue' },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 1, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 4, y: 3, z: 1, color: 'blue' },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 2 },
      { type: 'filter', x: 3, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 6, y: 0, z: 5, color: 'red' },
    ],
    solution: { '1,3,3': 3, '0,3,1': 2, '1,3,2': 2, '2,3,3': 1, '2,2,4': 1, '2,3,1': 1, '2,0,3': 3, '2,0,5': 1 },
  },
  // Platz im Spiel: nach „Posaune“
  {
    // Lösung: Spiegel (3,1,5) Achse y rot 1 · Spiegel (0,1,5) Achse y rot 3 ·
    //   Spiegel (0,1,2) Achse y rot 1 · Spiegel (3,1,2) Achse y rot 1 · Prisma (5,1,2) Achse y rot 5 ·
    //   Spiegel (5,1,0) Achse x rot 3 · Spiegel (6,0,0) Achse z rot 3 · Spiegel (4,0,0) Achse z rot 1
    // Generator mittel-abzaehlen, Seed 21384, Stand 1df6ca5, gesenkt um 4 · Würfel „mittel“
    name: 'Ölmühle', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, y: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, y: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 2, rot: 2 },
      { type: 'source', x: 6, y: 1, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, y: 1, z: 0, dir: 2 },
      { type: 'source', x: 3, y: 1, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 0, y: 1, z: 6, color: 'red' },
      { type: 'target', x: 5, y: 1, z: 5, color: 'white' },
      { type: 'target', x: 3, y: 1, z: 1, color: 'red' },
      { type: 'prism', x: 5, y: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 0, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 0, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 2, z: 0, color: 'blue' },
    ],
    solution: { '3,1,5': 1, '0,1,5': 3, '0,1,2': 1, '3,1,2': 1, '5,1,2': 5, '5,1,0': 3, '6,0,0': 3, '4,0,0': 1 },
  },
  // Platz im Spiel: nach „Ölmühle“
  {
    // Lösung: Spiegel (4,3,2) Achse y rot 1 · Spiegel (3,3,3) Achse y rot 0 ·
    //   Spiegel (2,3,4) Achse y rot 0 · Spiegel (6,3,2) Achse z rot 3 · Prisma (4,3,4) Achse y rot 4 ·
    //   Spiegel (5,3,3) Achse y rot 2 · Spiegel (6,4,1) Achse z rot 1 · Spiegel (3,4,2) Achse z rot 3
    // Generator mittel-abschalten, Seed 60206, Stand 74361c6 · Würfel „mittel“
    name: 'Hospiz', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 2, rot: 2 },
      { type: 'target', x: 0, y: 3, z: 2, color: 'blue' },
      { type: 'source', x: 6, y: 3, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 3, y: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 4, z: 2, color: 'blue' },
      { type: 'prism', x: 4, y: 3, z: 4, rot: 7 },
      { type: 'target', x: 3, y: 3, z: 4, color: 'green' },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 0, rot: 0, fixed: true },
      { type: 'source', x: 3, y: 0, z: 0, axis: 'x', dir: 1, color: 'green' },
      { type: 'mirror', x: 3, y: 4, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 6, y: 3, z: 4, color: 'green' },
    ],
    solution: { '4,3,2': 1, '3,3,3': 0, '2,3,4': 0, '6,3,2': 3, '4,3,4': 4, '5,3,3': 2, '6,4,1': 1, '3,4,2': 3 },
  },
  // Platz im Spiel: nach „Hospiz“
  {
    // Lösung: Prisma (4,3,2) Achse y rot 1 · Spiegel (6,3,2) Achse y rot 3 ·
    //   Spiegel (4,3,3) Achse y rot 1 · Spiegel (5,3,3) Achse y rot 1 · Spiegel (1,0,5) Achse z rot 2 ·
    //   Spiegel (4,0,2) Achse y rot 0 · Spiegel (5,0,3) Achse z rot 3 · Spiegel (5,3,6) Achse y rot 3
    // Generator mittel-falle, Seed 21262, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Kronleuchter', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 4, y: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 2, rot: 2 },
      { type: 'target', x: 6, y: 3, z: 0, color: 'red' },
      { type: 'mirror', x: 4, y: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 0 },
      { type: 'source', x: 2, y: 0, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 5, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 6, rot: 1 },
      { type: 'filter', x: 5, y: 1, z: 4, color: 'blue' },
      { type: 'mirror', x: 0, y: 3, z: 6, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 4, y: 4, z: 6, color: 'blue' },
      { type: 'target', x: 0, y: 4, z: 6, color: 'blue' },
    ],
    solution: { '4,3,2': 1, '6,3,2': 3, '4,3,3': 1, '5,3,3': 1, '1,0,5': 2, '4,0,2': 0, '5,0,3': 3, '5,3,6': 3 },
  },
  // Platz im Spiel: nach „Kronleuchter“
  {
    // Lösung: Spiegel (4,0,3) Achse y rot 1 · Spiegel (1,0,3) Achse y rot 1 ·
    //   Spiegel (1,0,5) Achse y rot 1 · Spiegel (4,0,5) Achse y rot 1 · Prisma (4,0,1) Achse y rot 2 ·
    //   Spiegel (0,0,5) Achse y rot 2 · Spiegel (1,0,6) Achse x rot 1 · Spiegel (4,3,6) Achse x rot 0
    // Generator mittel-abzaehlen, Seed 90226, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Frottage', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 3 },
      { type: 'source', x: 6, y: 0, z: 5, dir: 4, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 3, dir: 0, color: 'green' },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 6, y: 0, z: 3, color: 'green' },
      { type: 'target', x: 4, y: 0, z: 6, color: 'green' },
      { type: 'target', x: 1, y: 0, z: 2, color: 'cyan' },
      { type: 'prism', x: 4, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'x', rot: 1 },
      { type: 'target', x: 6, y: 1, z: 6, color: 'blue' },
    ],
    solution: { '4,0,3': 1, '1,0,3': 1, '1,0,5': 1, '4,0,5': 1, '4,0,1': 2, '0,0,5': 2, '1,0,6': 1, '4,3,6': 0 },
  },
  // Platz im Spiel: nach „Frottage“
  {
    // Lösung: Prisma (3,3,4) Achse y rot 1 · Spiegel (3,3,6) Achse y rot 3 ·
    //   Spiegel (4,3,4) Achse y rot 1 · Spiegel (4,3,5) Achse y rot 1 · Prisma (4,2,5) Achse x rot 5 ·
    //   Spiegel (4,1,4) Achse y rot 3 · Spiegel (5,0,4) Achse z rot 0 · Spiegel (6,1,4) Achse z rot 2
    // Generator mittel-falle, Seed 22407, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Marimba', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 3, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, y: 3, z: 4, rot: 5 },
      { type: 'mirror', x: 3, y: 3, z: 6, rot: 0 },
      { type: 'target', x: 1, y: 3, z: 6, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 5, rot: 0 },
      { type: 'source', x: 4, y: 3, z: 6, axis: 'x', dir: 5, color: 'cyan' },
      { type: 'prism', x: 4, y: 2, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 3, z: 5, color: 'red' },
      { type: 'mirror', x: 4, y: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 4, axis: 'z', rot: 1 },
      { type: 'target', x: 2, y: 0, z: 5, color: 'blue' },
      { type: 'target', x: 4, y: 4, z: 3, color: 'green' },
    ],
    solution: { '3,3,4': 1, '3,3,6': 3, '4,3,4': 1, '4,3,5': 1, '4,2,5': 5, '4,1,4': 3, '5,0,4': 0, '6,1,4': 2 },
  },
  // Platz im Spiel: nach „Marimba“
  {
    // Lösung: Spiegel (5,2,4) Achse y rot 3 · Spiegel (3,2,4) Achse y rot 2 ·
    //   Spiegel (2,2,3) Achse y rot 2 · Spiegel (5,2,6) Achse x rot 3 · Spiegel (6,1,6) Achse y rot 3 ·
    //   Spiegel (6,2,1) Achse z rot 3 · Spiegel (5,0,6) Achse z rot 1 · Prisma (6,0,6) Achse z rot 6
    // Generator mittel-abschalten, Seed 60354, Stand 74361c6 · Würfel „mittel“
    name: 'Weber', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 2, z: 4, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 5, y: 2, z: 4, rot: 2 },
      { type: 'target', x: 5, y: 2, z: 0, color: 'yellow' },
      { type: 'source', x: 1, y: 2, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 3, y: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 6, rot: 2 },
      { type: 'source', x: 6, y: 0, z: 5, axis: 'x', dir: 1, color: 'blue' },
      { type: 'mirror', x: 6, y: 2, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 6, y: 3, z: 2, color: 'blue' },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'z', rot: 0 },
      { type: 'prism', x: 6, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'target', x: 2, y: 4, z: 6, color: 'red' },
    ],
    solution: { '5,2,4': 3, '3,2,4': 2, '2,2,3': 2, '5,2,6': 3, '6,1,6': 3, '6,2,1': 3, '5,0,6': 1, '6,0,6': 6 },
  },
  // Platz im Spiel: nach „Weber“
  {
    // Lösung: Prisma (4,1,3) Achse y rot 3 · Prisma (3,1,0) Achse y rot 4 ·
    //   Spiegel (0,1,0) Achse z rot 3 · Spiegel (0,0,0) Achse z rot 1 · Spiegel (4,0,0) Achse y rot 1 ·
    //   Spiegel (4,0,2) Achse y rot 1
    // Generator mittel-sammelstelle, Seed 60240, Stand 74361c6 · Würfel „mittel“
    name: 'Celesta', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 1, z: 3, rot: 4 },
      { type: 'source', x: 6, y: 1, z: 5, dir: 5, color: 'blue' },
      { type: 'source', x: 4, y: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, y: 1, z: 3, color: 'magenta' },
      { type: 'target', x: 4, y: 1, z: 4, color: 'red' },
      { type: 'source', x: 6, y: 1, z: 3, dir: 5 },
      { type: 'prism', x: 3, y: 1, z: 0, rot: 6 },
      { type: 'mirror', x: 0, y: 1, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 5, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 2, z: 6, axis: 'x', rot: 2, fixed: true },
      { type: 'target', x: 2, y: 4, z: 4, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 2, color: 'green' },
    ],
    solution: { '4,1,3': 3, '3,1,0': 4, '0,1,0': 3, '0,0,0': 1, '4,0,0': 1, '4,0,2': 1 },
  },
  // Platz im Spiel: nach „Celesta“
  {
    // Lösung: Spiegel (2,2,5) Achse y rot 3 · Spiegel (4,2,5) Achse y rot 1 ·
    //   Spiegel (4,2,2) Achse y rot 3 · Spiegel (2,2,2) Achse y rot 3 · Prisma (1,2,2) Achse y rot 1 ·
    //   Spiegel (1,2,5) Achse y rot 1 · Spiegel (4,2,1) Achse x rot 1 · Spiegel (4,0,1) Achse z rot 3
    // Generator mittel-abzaehlen, Seed 90059, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Kintsugi', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 2, rot: 0 },
      { type: 'source', x: 6, y: 2, z: 5, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, y: 2, z: 2, dir: 0, color: 'magenta' },
      { type: 'source', x: 2, y: 2, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 2, y: 2, z: 0, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 2, color: 'yellow' },
      { type: 'target', x: 4, y: 2, z: 6, color: 'red' },
      { type: 'prism', x: 1, y: 2, z: 2, rot: 5 },
      { type: 'mirror', x: 1, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 1, y: 4, z: 0, color: 'blue' },
    ],
    solution: { '2,2,5': 3, '4,2,5': 1, '4,2,2': 3, '2,2,2': 3, '1,2,2': 1, '1,2,5': 1, '4,2,1': 1, '4,0,1': 3 },
  },
  // Platz im Spiel: nach „Kintsugi“
  {
    // Lösung: Spiegel (4,3,5) Achse y rot 3 · Spiegel (4,3,3) Achse y rot 3 ·
    //   Spiegel (6,3,5) Achse y rot 3 · Spiegel (1,0,3) Achse x rot 3 · Spiegel (1,3,3) Achse z rot 3 ·
    //   Spiegel (4,3,0) Achse x rot 1 · Spiegel (5,2,0) Achse z rot 3 · Spiegel (5,3,0) Achse x rot 1
    // Generator mittel-mischziel, Seed 60154, Stand 74361c6 · Würfel „mittel“
    name: 'Kombüse', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 3, z: 5, dir: 0, color: 'red' },
      { type: 'source', x: 4, y: 3, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 5, rot: 1 },
      { type: 'target', x: 6, y: 3, z: 3, color: 'magenta' },
      { type: 'source', x: 1, y: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 1, y: 0, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 3, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 0, axis: 'x', rot: 3 },
      { type: 'target', x: 5, y: 3, z: 6, color: 'blue' },
    ],
    solution: { '4,3,5': 3, '4,3,3': 3, '6,3,5': 3, '1,0,3': 3, '1,3,3': 3, '4,3,0': 1, '5,2,0': 3, '5,3,0': 1 },
  },
  // Platz im Spiel: nach „Kombüse“
  {
    // Lösung: Prisma (2,3,3) Achse y rot 7 · Spiegel (2,3,1) Achse y rot 1 ·
    //   Spiegel (3,3,3) Achse y rot 3 · Spiegel (3,3,2) Achse y rot 3 · Spiegel (3,0,2) Achse z rot 1 ·
    //   Prisma (3,2,2) Achse x rot 1 · Spiegel (3,2,5) Achse x rot 3 · Spiegel (5,3,4) Achse y rot 1
    // Generator mittel-falle, Seed 90445, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Mofa', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 3, z: 5, dir: 7, color: 'magenta' },
      { type: 'prism', x: 2, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 1, rot: 0 },
      { type: 'target', x: 0, y: 3, z: 1, color: 'red' },
      { type: 'mirror', x: 3, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 2, rot: 1, fixed: true },
      { type: 'source', x: 6, y: 0, z: 2, dir: 4 },
      { type: 'mirror', x: 3, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'prism', x: 3, y: 2, z: 2, axis: 'x', rot: 4 },
      { type: 'mirror', x: 3, y: 2, z: 5, axis: 'x', rot: 2 },
      { type: 'target', x: 3, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 2, y: 4, z: 3, color: 'green' },
      { type: 'mirror', x: 5, y: 3, z: 4, rot: 2 },
      { type: 'target', x: 6, y: 3, z: 4, color: 'blue' },
    ],
    solution: { '2,3,3': 7, '2,3,1': 1, '3,3,3': 3, '3,3,2': 3, '3,0,2': 1, '3,2,2': 1, '3,2,5': 3, '5,3,4': 1 },
  },
  // Platz im Spiel: nach „Mofa“
  {
    // Lösung: Spiegel (2,4,2) Achse y rot 1 · Spiegel (5,4,2) Achse y rot 1 ·
    //   Spiegel (5,4,0) Achse y rot 3 · Spiegel (2,4,0) Achse y rot 1 · Prisma (2,4,4) Achse y rot 5 ·
    //   Spiegel (1,4,3) Achse z rot 3 · Spiegel (2,0,0) Achse x rot 0
    // Generator mittel-abzaehlen, Seed 91687, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Kamee', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 0, rot: 2 },
      { type: 'source', x: 2, y: 4, z: 6, dir: 6 },
      { type: 'source', x: 6, y: 4, z: 2, dir: 4, color: 'blue' },
      { type: 'source', x: 0, y: 4, z: 0, dir: 0, color: 'cyan' },
      { type: 'target', x: 5, y: 4, z: 4, color: 'cyan' },
      { type: 'target', x: 6, y: 4, z: 0, color: 'cyan' },
      { type: 'target', x: 1, y: 4, z: 2, color: 'blue' },
      { type: 'prism', x: 2, y: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 1, y: 1, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 1, y: 4, z: 6, color: 'red' },
      { type: 'mirror', x: 2, y: 0, z: 0, axis: 'x', rot: 3 },
    ],
    solution: { '2,4,2': 1, '5,4,2': 1, '5,4,0': 3, '2,4,0': 1, '2,4,4': 5, '1,4,3': 3, '2,0,0': 0 },
  },
  // Platz im Spiel: nach „Kamee“
  {
    // Lösung: Prisma (3,1,5) Achse y rot 5 · Spiegel (3,1,3) Achse y rot 3 ·
    //   Spiegel (2,1,5) Achse y rot 1 · Spiegel (2,1,4) Achse y rot 1 · Spiegel (1,3,3) Achse z rot 1 ·
    //   Prisma (1,2,3) Achse x rot 7 · Spiegel (1,1,4) Achse z rot 3 · Spiegel (1,2,5) Achse x rot 3
    // Generator mittel-falle, Seed 91157, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Triglyphe', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 1, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 3, y: 1, z: 5, rot: 7 },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 2 },
      { type: 'target', x: 5, y: 1, z: 3, color: 'blue' },
      { type: 'mirror', x: 2, y: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 4, rot: 3 },
      { type: 'source', x: 0, y: 3, z: 3, dir: 0 },
      { type: 'mirror', x: 1, y: 3, z: 3, axis: 'z', rot: 2 },
      { type: 'prism', x: 1, y: 2, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 4, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 1, y: 0, z: 5, color: 'blue' },
      { type: 'target', x: 0, y: 1, z: 5, color: 'green' },
      { type: 'target', x: 1, y: 0, z: 3, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 4, color: 'red' },
    ],
    solution: { '3,1,5': 5, '3,1,3': 3, '2,1,5': 1, '2,1,4': 1, '1,3,3': 1, '1,2,3': 7, '1,1,4': 3, '1,2,5': 3 },
  },
  // Platz im Spiel: nach „Triglyphe“
  {
    // Lösung: Spiegel (4,1,1) Achse z rot 3 · Spiegel (1,1,4) Achse y rot 3 ·
    //   Spiegel (5,1,4) Achse y rot 3 · Spiegel (3,1,0) Achse y rot 0 · Spiegel (3,3,2) Achse z rot 0 ·
    //   Spiegel (3,0,5) Achse z rot 1 · Spiegel (6,2,4) Achse y rot 1 · Spiegel (0,1,3) Achse z rot 1
    // Generator mittel-abschalten, Seed 91486, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Stampflehm', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 4, z: 4, axis: 'x', dir: 5, color: 'yellow' },
      { type: 'mirror', x: 4, y: 1, z: 1, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 1, z: 0, color: 'yellow' },
      { type: 'source', x: 1, y: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, y: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 0, rot: 2 },
      { type: 'source', x: 3, y: 0, z: 1, axis: 'x', dir: 3, color: 'blue' },
      { type: 'mirror', x: 3, y: 3, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'z', rot: 0, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 4, rot: 2 },
      { type: 'target', x: 5, y: 0, z: 5, color: 'blue' },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 3 },
      { type: 'filter', x: 0, y: 2, z: 4, color: 'green' },
      { type: 'target', x: 0, y: 4, z: 6, color: 'green' },
    ],
    solution: { '4,1,1': 3, '1,1,4': 3, '5,1,4': 3, '3,1,0': 0, '3,3,2': 0, '3,0,5': 1, '6,2,4': 1, '0,1,3': 1 },
  },
  // Platz im Spiel: nach „Stampflehm“
  {
    // Lösung: Prisma (4,4,4) Achse y rot 5 · Spiegel (2,4,6) Achse y rot 0 ·
    //   Spiegel (3,4,4) Achse z rot 3 · Spiegel (3,3,4) Achse x rot 1 · Spiegel (3,3,0) Achse x rot 1 ·
    //   Spiegel (3,0,0) Achse z rot 1 · Spiegel (5,0,0) Achse z rot 3 · Spiegel (5,4,0) Achse z rot 1
    // Generator mittel-sammelstelle, Seed 60271, Stand 74361c6 · Würfel „mittel“
    name: 'Stillleben', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 4, z: 4, rot: 2 },
      { type: 'source', x: 0, y: 4, z: 4, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 2, y: 4, z: 6, rot: 3 },
      { type: 'source', x: 6, y: 4, z: 4, dir: 4, color: 'blue' },
      { type: 'target', x: 2, y: 4, z: 2, color: 'green' },
      { type: 'target', x: 4, y: 4, z: 2, color: 'magenta' },
      { type: 'mirror', x: 3, y: 4, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 0, rot: 3, fixed: true },
    ],
    solution: { '4,4,4': 5, '2,4,6': 0, '3,4,4': 3, '3,3,4': 1, '3,3,0': 1, '3,0,0': 1, '5,0,0': 3, '5,4,0': 1 },
  },
  // Platz im Spiel: nach „Stillleben“
  {
    // Lösung: Prisma (4,0,1) Achse y rot 7 · Spiegel (5,0,2) Achse y rot 0 ·
    //   Prisma (1,0,3) Achse y rot 3 · Spiegel (0,0,4) Achse z rot 1 · Spiegel (0,2,6) Achse y rot 0 ·
    //   Spiegel (1,0,5) Achse y rot 3 · Spiegel (0,0,3) Achse y rot 1 · Spiegel (0,0,1) Achse y rot 3
    // Generator mittel-sammelstelle, Seed 20948, Stand 33f26f8, gesenkt um 2 · Würfel „mittel“
    name: 'Lettner', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 0, z: 1, rot: 4 },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, y: 0, z: 1, dir: 3, color: 'green' },
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 2 },
      { type: 'target', x: 4, y: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, y: 0, z: 0, color: 'green' },
      { type: 'source', x: 1, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 1, y: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 0, y: 0, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 4, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 0, y: 2, z: 2, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 2 },
      { type: 'target', x: 0, y: 0, z: 5, color: 'red' },
      { type: 'mirror', x: 0, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 1, rot: 1 },
      { type: 'target', x: 5, y: 0, z: 1, color: 'blue' },
    ],
    solution: { '4,0,1': 7, '5,0,2': 0, '1,0,3': 3, '0,0,4': 1, '0,2,6': 0, '1,0,5': 3, '0,0,3': 1, '0,0,1': 3 },
  },
  // Platz im Spiel: nach „Lettner“
  {
    // Lösung: Prisma (6,3,2) Achse y rot 3 · Spiegel (4,3,2) Achse y rot 1 ·
    //   Spiegel (6,3,3) Achse y rot 3 · Spiegel (5,3,3) Achse y rot 3 · Prisma (5,4,3) Achse z rot 1 ·
    //   Spiegel (5,3,6) Achse x rot 3 · Spiegel (5,0,6) Achse z rot 1 · Spiegel (6,1,1) Achse z rot 0
    // Generator mittel-falle, Seed 22570, Stand 1df6ca5, gesenkt um 2 · Würfel „mittel“
    name: 'Trommel', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 6, y: 3, z: 2, rot: 4 },
      { type: 'mirror', x: 4, y: 3, z: 2, rot: 3 },
      { type: 'target', x: 4, y: 3, z: 0, color: 'blue' },
      { type: 'mirror', x: 6, y: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 3, rot: 0 },
      { type: 'source', x: 0, y: 4, z: 3, dir: 0 },
      { type: 'prism', x: 5, y: 4, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 1, axis: 'z', rot: 1 },
      { type: 'target', x: 6, y: 0, z: 6, color: 'red' },
      { type: 'target', x: 6, y: 4, z: 3, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 0, color: 'green' },
    ],
    solution: { '6,3,2': 3, '4,3,2': 1, '6,3,3': 3, '5,3,3': 3, '5,4,3': 1, '5,3,6': 3, '5,0,6': 1, '6,1,1': 0 },
  },
  // Platz im Spiel: nach „Trommel“
  {
    // Lösung: Prisma (4,0,3) Achse y rot 2 · Spiegel (2,0,5) Achse y rot 0 ·
    //   Spiegel (5,0,4) Achse y rot 2 · Spiegel (4,0,5) Achse y rot 2 · Spiegel (5,3,3) Achse z rot 1 ·
    //   Spiegel (5,0,6) Achse y rot 0 · Prisma (6,3,3) Achse y rot 1 · Spiegel (6,3,4) Achse y rot 3
    // Generator mittel-falle, Seed 91565, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Nauen', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 4, y: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 3, color: 'blue' },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 1 },
      { type: 'source', x: 5, y: 4, z: 3, axis: 'x', dir: 6 },
      { type: 'mirror', x: 5, y: 3, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 6, rot: 3 },
      { type: 'prism', x: 6, y: 3, z: 3, rot: 5 },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 4, rot: 2 },
      { type: 'target', x: 0, y: 3, z: 4, color: 'blue' },
      { type: 'target', x: 5, y: 4, z: 4, color: 'red' },
    ],
    solution: { '4,0,3': 2, '2,0,5': 0, '5,0,4': 2, '4,0,5': 2, '5,3,3': 1, '5,0,6': 0, '6,3,3': 1, '6,3,4': 3 },
  },
  // Platz im Spiel: nach „Nauen“
  {
    // Lösung: Prisma (6,3,3) Achse y rot 3 · Spiegel (4,3,1) Achse y rot 0 ·
    //   Spiegel (4,3,5) Achse z rot 3 · Spiegel (4,2,6) Achse y rot 0 · Spiegel (4,1,5) Achse x rot 0 ·
    //   Spiegel (4,4,2) Achse z rot 1 · Spiegel (4,0,2) Achse x rot 1 · Spiegel (2,4,2) Achse y rot 1
    // Generator mittel-sammelstelle, Seed 60383, Stand 74361c6 · Würfel „mittel“
    name: 'Kürschner', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 6, y: 3, z: 3, rot: 5 },
      { type: 'source', x: 6, y: 3, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, y: 3, z: 5, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 4, y: 3, z: 1, rot: 2 },
      { type: 'target', x: 6, y: 3, z: 6, color: 'red' },
      { type: 'target', x: 0, y: 3, z: 3, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 4, y: 1, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 0, axis: 'x', rot: 1, fixed: true },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 2, rot: 2 },
      { type: 'target', x: 2, y: 0, z: 0, color: 'green' },
      { type: 'target', x: 0, y: 2, z: 0, color: 'green' },
    ],
    solution: { '6,3,3': 3, '4,3,1': 0, '4,3,5': 3, '4,2,6': 0, '4,1,5': 0, '4,4,2': 1, '4,0,2': 1, '2,4,2': 1 },
  },
  // Platz im Spiel: nach „Kürschner“
  {
    // Lösung: Spiegel (4,4,1) Achse x rot 1 · Spiegel (3,3,4) Achse z rot 1 ·
    //   Spiegel (3,4,4) Achse z rot 3 · Prisma (3,3,5) Achse x rot 0 · Spiegel (3,2,6) Achse y rot 3 ·
    //   Spiegel (2,1,6) Achse x rot 0 · Spiegel (1,2,6) Achse y rot 2 · Spiegel (0,4,5) Achse y rot 2
    // Generator mittel-mischziel, Seed 60169, Stand 74361c6 · Würfel „mittel“
    name: 'Clavichord', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 0, z: 1, axis: 'x', dir: 2, color: 'red' },
      { type: 'source', x: 6, y: 3, z: 4, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'target', x: 4, y: 4, z: 4, color: 'yellow' },
      { type: 'source', x: 3, y: 4, z: 5, axis: 'x', dir: 6, color: 'magenta' },
      { type: 'prism', x: 3, y: 3, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 6, rot: 2, fixed: true },
      { type: 'mirror', x: 1, y: 4, z: 6, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 4, z: 6, color: 'blue' },
      { type: 'mirror', x: 0, y: 4, z: 5, rot: 1 },
      { type: 'target', x: 5, y: 3, z: 1, color: 'red' },
    ],
    solution: { '4,4,1': 1, '3,3,4': 1, '3,4,4': 3, '3,3,5': 0, '3,2,6': 3, '2,1,6': 0, '1,2,6': 2, '0,4,5': 2 },
  },
  // Platz im Spiel: nach „Clavichord“
  {
    // Lösung: Spiegel (2,1,0) Achse y rot 3 · Spiegel (6,1,0) Achse y rot 1 ·
    //   Spiegel (6,3,4) Achse z rot 1 · Spiegel (3,0,0) Achse y rot 1 · Spiegel (3,0,1) Achse y rot 1 ·
    //   Spiegel (4,0,1) Achse y rot 3 · Spiegel (4,0,0) Achse y rot 3 · Prisma (5,0,0) Achse z rot 7
    // Generator mittel-mischziel, Seed 60030, Stand 74361c6 · Würfel „mittel“
    name: 'Spinett', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 1, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 0, y: 3, z: 4, dir: 0, color: 'red' },
      { type: 'mirror', x: 2, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'target', x: 6, y: 1, z: 4, color: 'white' },
      { type: 'source', x: 0, y: 0, z: 0, dir: 0 },
      { type: 'mirror', x: 3, y: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 0, rot: 0 },
      { type: 'prism', x: 5, y: 0, z: 0, axis: 'z', rot: 4 },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 6, y: 3, z: 2, color: 'green' },
      { type: 'target', x: 2, y: 2, z: 0, color: 'red' },
    ],
    solution: { '2,1,0': 3, '6,1,0': 1, '6,3,4': 1, '3,0,0': 1, '3,0,1': 1, '4,0,1': 3, '4,0,0': 3, '5,0,0': 7 },
  },
  // Platz im Spiel: nach „Spinett“
  {
    // Lösung: Spiegel (2,2,4) Achse x rot 1 · Spiegel (2,2,2) Achse x rot 1 ·
    //   Spiegel (1,4,4) Achse y rot 1 · Prisma (0,4,4) Achse z rot 2 · Spiegel (0,1,4) Achse x rot 3 ·
    //   Spiegel (4,2,2) Achse z rot 2 · Spiegel (3,2,1) Achse x rot 3 · Spiegel (1,4,1) Achse z rot 0
    // Generator mittel-mischziel, Seed 60583, Stand 74361c6 · Würfel „mittel“
    name: 'Triptychon', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 4, z: 4, axis: 'x', dir: 6, color: 'green' },
      { type: 'source', x: 1, y: 0, z: 2, axis: 'z', dir: 7, color: 'magenta' },
      { type: 'mirror', x: 2, y: 2, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 2, axis: 'x', rot: 2 },
      { type: 'target', x: 2, y: 1, z: 2, color: 'white' },
      { type: 'source', x: 1, y: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 1, y: 4, z: 4, rot: 0 },
      { type: 'prism', x: 0, y: 4, z: 4, axis: 'z', rot: 5 },
      { type: 'mirror', x: 0, y: 1, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 0, y: 3, z: 1, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 5, color: 'green' },
    ],
    solution: { '2,2,4': 1, '2,2,2': 1, '1,4,4': 1, '0,4,4': 2, '0,1,4': 3, '4,2,2': 2, '3,2,1': 3, '1,4,1': 0 },
  },
  // Platz im Spiel: nach „Triptychon“
  {
    // Lösung: Prisma (4,0,2) Achse y rot 3 · Spiegel (5,0,1) Achse y rot 0 ·
    //   Spiegel (1,0,5) Achse z rot 2 · Prisma (1,0,4) Achse y rot 6 · Spiegel (5,0,0) Achse x rot 2 ·
    //   Spiegel (6,0,1) Achse z rot 3
    // Generator mittel-sammelstelle, Seed 21198, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Lisene', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 0, z: 2, rot: 5 },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, y: 0, z: 2, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 5, y: 0, z: 1, rot: 2 },
      { type: 'target', x: 1, y: 0, z: 2, color: 'cyan' },
      { type: 'target', x: 4, y: 0, z: 4, color: 'red' },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'z', rot: 3 },
      { type: 'target', x: 2, y: 0, z: 6, color: 'green' },
      { type: 'source', x: 0, y: 0, z: 5, dir: 7 },
      { type: 'prism', x: 1, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 4, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 0, y: 0, z: 3, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 5, color: 'blue' },
    ],
    solution: { '4,0,2': 3, '5,0,1': 0, '1,0,5': 2, '1,0,4': 6, '5,0,0': 2, '6,0,1': 3 },
  },
  // Platz im Spiel: nach „Lisene“
  {
    // Lösung: Prisma (4,2,4) Achse y rot 3 · Spiegel (2,2,4) Achse y rot 1 ·
    //   Spiegel (4,2,5) Achse y rot 3 · Spiegel (3,2,5) Achse y rot 3 · Spiegel (6,0,1) Achse x rot 1 ·
    //   Spiegel (6,3,1) Achse x rot 1 · Spiegel (6,2,6) Achse x rot 1 · Spiegel (6,2,5) Achse y rot 1
    // Generator mittel-falle, Seed 21894, Stand 1df6ca5, gesenkt um 0 · Würfel „mittel“
    name: 'Grammophon', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 4, y: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, y: 2, z: 4, rot: 0 },
      { type: 'target', x: 2, y: 2, z: 2, color: 'blue' },
      { type: 'mirror', x: 4, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 5, rot: 1 },
      { type: 'source', x: 6, y: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'x', rot: 2 },
      { type: 'filter', x: 6, y: 1, z: 1, color: 'blue' },
      { type: 'mirror', x: 3, y: 2, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 6, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 4, z: 6, color: 'red' },
      { type: 'mirror', x: 6, y: 2, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 5, rot: 0 },
      { type: 'target', x: 4, y: 2, z: 6, color: 'blue' },
    ],
    solution: { '4,2,4': 3, '2,2,4': 1, '4,2,5': 3, '3,2,5': 3, '6,0,1': 1, '6,3,1': 1, '6,2,6': 1, '6,2,5': 1 },
  },
  // Platz im Spiel: nach „Grammophon“
  {
    // Lösung: Prisma (4,0,5) Achse y rot 3 · Spiegel (4,0,2) Achse y rot 3 ·
    //   Spiegel (3,0,2) Achse z rot 2 · Prisma (2,0,1) Achse y rot 4 · Spiegel (0,0,3) Achse y rot 2 ·
    //   Spiegel (1,0,0) Achse x rot 3 · Spiegel (0,1,0) Achse z rot 2
    // Generator mittel-sammelstelle, Seed 20454, Stand 33f26f8, gesenkt um 4 · Würfel „mittel“
    name: 'Schanze', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, y: 0, z: 5, rot: 0 },
      { type: 'source', x: 5, y: 0, z: 6, dir: 5, color: 'blue' },
      { type: 'source', x: 6, y: 0, z: 2, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 2 },
      { type: 'target', x: 1, y: 0, z: 5, color: 'blue' },
      { type: 'target', x: 3, y: 0, z: 6, color: 'yellow' },
      { type: 'source', x: 0, y: 0, z: 5, dir: 7 },
      { type: 'mirror', x: 3, y: 0, z: 2, axis: 'z', rot: 1 },
      { type: 'prism', x: 2, y: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 0, y: 0, z: 3, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 1, color: 'green' },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 0, axis: 'z', rot: 1 },
      { type: 'target', x: 1, y: 2, z: 0, color: 'blue' },
    ],
    solution: { '4,0,5': 3, '4,0,2': 3, '3,0,2': 2, '2,0,1': 4, '0,0,3': 2, '1,0,0': 3, '0,1,0': 2 },
  },
  // Platz im Spiel: nach „Schanze“
  {
    // Lösung: Spiegel (3,4,3) Achse y rot 3 · Spiegel (1,4,3) Achse z rot 3 ·
    //   Spiegel (3,3,3) Achse z rot 1 · Spiegel (3,1,3) Achse z rot 3 · Spiegel (6,1,5) Achse x rot 3 ·
    //   Spiegel (5,1,6) Achse z rot 1 · Spiegel (6,2,1) Achse y rot 1 · Prisma (6,1,6) Achse y rot 4
    // Generator mittel-mischziel, Seed 60919, Stand 74361c6 · Würfel „mittel“
    name: 'Fallgatter', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 3, y: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, y: 3, z: 3, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 3, y: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'z', rot: 1 },
      { type: 'target', x: 1, y: 1, z: 3, color: 'white' },
      { type: 'source', x: 6, y: 4, z: 5, axis: 'x', dir: 6 },
      { type: 'mirror', x: 6, y: 1, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 1, z: 6, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 6, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 2, z: 1, rot: 0 },
      { type: 'prism', x: 6, y: 1, z: 6, rot: 3 },
      { type: 'target', x: 3, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 2, y: 2, z: 1, color: 'green' },
    ],
    solution: { '3,4,3': 3, '1,4,3': 3, '3,3,3': 1, '3,1,3': 3, '6,1,5': 3, '5,1,6': 1, '6,2,1': 1, '6,1,6': 4 },
  },
  // Platz im Spiel: nach „Fallgatter“
  {
    // Lösung: Spiegel (4,0,2) Achse y rot 1 · Spiegel (3,1,3) Achse z rot 3 ·
    //   Spiegel (3,0,2) Achse z rot 1 · Prisma (2,0,6) Achse y rot 6 · Spiegel (0,0,4) Achse z rot 2 ·
    //   Spiegel (2,0,4) Achse y rot 3 · Spiegel (0,0,2) Achse z rot 2 · Spiegel (4,0,4) Achse y rot 3
    // Generator mittel-mischziel, Seed 60773, Stand 74361c6 · Würfel „mittel“
    name: 'Emaille', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 6, y: 0, z: 2, dir: 4, color: 'red' },
      { type: 'source', x: 6, y: 1, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 4, y: 0, z: 1, color: 'magenta' },
      { type: 'source', x: 0, y: 0, z: 6, dir: 0, color: 'yellow' },
      { type: 'prism', x: 2, y: 0, z: 6, rot: 3 },
      { type: 'mirror', x: 0, y: 0, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 2, fixed: true },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 4, rot: 0 },
      { type: 'target', x: 3, y: 4, z: 2, color: 'green' },
      { type: 'target', x: 1, y: 0, z: 1, color: 'red' },
    ],
    solution: { '4,0,2': 1, '3,1,3': 3, '3,0,2': 1, '2,0,6': 6, '0,0,4': 2, '2,0,4': 3, '0,0,2': 2, '4,0,4': 3 },
  },
  // Platz im Spiel: nach „Emaille“
  {
    // Lösung: Spiegel (3,3,4) Achse z rot 3 · Prisma (1,2,4) Achse z rot 1 ·
    //   Spiegel (5,2,4) Achse z rot 3 · Spiegel (5,3,4) Achse z rot 1 · Spiegel (2,1,4) Achse y rot 3 ·
    //   Spiegel (2,0,3) Achse z rot 3 · Spiegel (0,0,1) Achse z rot 2 · Spiegel (1,0,0) Achse x rot 2
    // Generator mittel-mischziel, Seed 60450, Stand 74361c6 · Würfel „mittel“
    name: 'Bienenkorb', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 2, y: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 3, y: 4, z: 4, axis: 'x', dir: 6, color: 'red' },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 2, y: 3, z: 4, color: 'magenta' },
      { type: 'source', x: 1, y: 4, z: 4, axis: 'x', dir: 6, color: 'yellow' },
      { type: 'prism', x: 1, y: 2, z: 4, axis: 'z', rot: 3 },
      { type: 'mirror', x: 5, y: 2, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 4, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 3, y: 1, z: 2, color: 'red' },
      { type: 'mirror', x: 2, y: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'target', x: 5, y: 0, z: 4, color: 'green' },
    ],
    solution: { '3,3,4': 3, '1,2,4': 1, '5,2,4': 3, '5,3,4': 1, '2,1,4': 3, '2,0,3': 3, '0,0,1': 2, '1,0,0': 2 },
  },
  // Platz im Spiel: nach „Bienenkorb“
  {
    // Lösung: Spiegel (3,2,1) Achse x rot 0 · Spiegel (3,2,5) Achse y rot 1 ·
    //   Spiegel (0,2,5) Achse y rot 1 · Spiegel (2,1,1) Achse y rot 1 · Spiegel (4,3,5) Achse y rot 1 ·
    //   Prisma (3,1,4) Achse x rot 4 · Spiegel (3,1,1) Achse y rot 1 · Spiegel (2,1,0) Achse y rot 3
    // Generator mittel-abschalten, Seed 60508, Stand 74361c6 · Würfel „mittel“
    name: 'Zeppelin', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 5, y: 0, z: 1, axis: 'z', dir: 5 },
      { type: 'mirror', x: 3, y: 2, z: 1, axis: 'x', rot: 2 },
      { type: 'target', x: 0, y: 2, z: 4, color: 'white' },
      { type: 'source', x: 3, y: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 3, y: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 1, rot: 0 },
      { type: 'target', x: 2, y: 0, z: 0, color: 'white' },
      { type: 'mirror', x: 4, y: 3, z: 5, rot: 3 },
      { type: 'source', x: 4, y: 4, z: 6, axis: 'x', dir: 5 },
      { type: 'prism', x: 3, y: 1, z: 4, axis: 'x', rot: 5 },
      { type: 'target', x: 3, y: 0, z: 3, color: 'cyan' },
      { type: 'target', x: 3, y: 3, z: 2, color: 'red' },
      { type: 'mirror', x: 3, y: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'x', rot: 3, fixed: true },
    ],
    solution: { '3,2,1': 0, '3,2,5': 1, '0,2,5': 1, '2,1,1': 1, '4,3,5': 1, '3,1,4': 4, '3,1,1': 1, '2,1,0': 3 },
  },
  // Platz im Spiel: nach „Zeppelin“
  {
    // Lösung: Prisma (2,0,3) Achse y rot 3 · Spiegel (5,0,3) Achse y rot 1 ·
    //   Spiegel (4,1,1) Achse y rot 3 · Spiegel (0,0,5) Achse y rot 2 · Spiegel (1,0,6) Achse x rot 1 ·
    //   Spiegel (5,1,4) Achse z rot 3 · Spiegel (5,2,4) Achse x rot 1 · Spiegel (5,2,6) Achse y rot 3
    // Generator mittel-sammelstelle, Seed 20514, Stand 33f26f8, gesenkt um 3 · Würfel „mittel“
    name: 'Mittelbau', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, y: 0, z: 3, rot: 0 },
      { type: 'source', x: 2, y: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 5, y: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 5, y: 0, z: 3, rot: 3 },
      { type: 'target', x: 2, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 1, y: 0, z: 3, color: 'blue' },
      { type: 'source', x: 6, y: 1, z: 1, dir: 4, color: 'blue' },
      { type: 'mirror', x: 4, y: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 6, axis: 'x', rot: 3 },
      { type: 'target', x: 3, y: 2, z: 6, color: 'cyan' },
      { type: 'mirror', x: 5, y: 1, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 6, rot: 0 },
    ],
    solution: { '2,0,3': 3, '5,0,3': 1, '4,1,1': 3, '0,0,5': 2, '1,0,6': 1, '5,1,4': 3, '5,2,4': 1, '5,2,6': 3 },
  },
  // Platz im Spiel: nach „Mittelbau“
  {
    // Lösung: Prisma (2,0,5) Achse y rot 7 · Spiegel (2,0,3) Achse y rot 1 ·
    //   Spiegel (3,0,5) Achse y rot 3 · Spiegel (3,0,4) Achse y rot 3 · Spiegel (0,2,1) Achse y rot 3 ·
    //   Spiegel (6,2,1) Achse z rot 1 · Spiegel (5,0,4) Achse y rot 3 · Prisma (6,1,1) Achse x rot 5
    // Generator mittel-falle, Seed 90129, Ziel 53–58,4, Stand 33eb4e5 · Würfel „mittel“
    name: 'Rösslitram', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 2 },
      { type: 'target', x: 0, y: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 1 },
      { type: 'source', x: 0, y: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, y: 0, z: 0, color: 'cyan' },
      { type: 'prism', x: 6, y: 1, z: 1, axis: 'x', rot: 6 },
      { type: 'target', x: 6, y: 0, z: 1, color: 'blue' },
      { type: 'target', x: 6, y: 1, z: 0, color: 'red' },
    ],
    solution: { '2,0,5': 7, '2,0,3': 1, '3,0,5': 3, '3,0,4': 3, '0,2,1': 3, '6,2,1': 1, '5,0,4': 3, '6,1,1': 5 },
  },
  // Platz im Spiel: nach „Rösslitram“
  {
    // Lösung: Spiegel (4,2,5) Achse z rot 1 · Spiegel (3,1,1) Achse y rot 1 ·
    //   Spiegel (2,2,3) Achse x rot 2 · Spiegel (1,2,4) Achse x rot 2 · Prisma (0,2,3) Achse y rot 6 ·
    //   Spiegel (2,2,1) Achse x rot 3 · Spiegel (0,2,1) Achse x rot 3 · Prisma (5,1,1) Achse z rot 0
    // Generator mittel, Seed 20655, Stand 33f26f8, gesenkt um 0 · Würfel „mittel“
    name: 'Gesims', dim: 3, size: 7, height: 5, grad: 'mittel',
    elements: [
      { type: 'source', x: 4, y: 1, z: 6, axis: 'x', dir: 3 },
      { type: 'source', x: 3, y: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 4, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 2, z: 4, axis: 'x', rot: 0 },
      { type: 'prism', x: 0, y: 2, z: 3, rot: 7 },
      { type: 'mirror', x: 2, y: 2, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 1, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 4, y: 4, z: 1, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 0, y: 4, z: 0, color: 'green' },
      { type: 'target', x: 6, y: 2, z: 1, color: 'magenta' },
      { type: 'prism', x: 5, y: 1, z: 1, axis: 'z', rot: 3 },
      { type: 'target', x: 6, y: 1, z: 1, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 1, color: 'blue' },
    ],
    solution: { '4,2,5': 1, '3,1,1': 1, '2,2,3': 2, '1,2,4': 2, '0,2,3': 6, '2,2,1': 3, '0,2,1': 3, '5,1,1': 0 },
  },
  // Platz im Spiel: nach „Gesims“
  {
    // Lösung: Spiegel (2,2,3) Achse x rot 1 · Spiegel (1,1,2) Achse y rot 1 ·
    //   Spiegel (2,1,2) Achse y rot 1 · Spiegel (2,3,3) Achse x rot 1 · Spiegel (2,3,1) Achse y rot 1 ·
    //   Spiegel (2,4,3) Achse z rot 3 · Spiegel (4,4,3) Achse y rot 1 · Spiegel (4,4,4) Achse y rot 1 ·
    //   Spiegel (6,4,4) Achse y rot 1
    // Generator schwer-abschalten, Seed 60745, Stand 74361c6 · Würfel „schwer“
    name: 'Kölner Dom', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 2, y: 2, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 2, y: 2, z: 3, axis: 'x', rot: 2 },
      { type: 'target', x: 2, y: 1, z: 3, color: 'green' },
      { type: 'source', x: 1, y: 1, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 1, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 3, z: 3, axis: 'x', rot: 3 },
      { type: 'target', x: 2, y: 3, z: 6, color: 'cyan' },
      { type: 'mirror', x: 2, y: 3, z: 1, rot: 0 },
      { type: 'source', x: 0, y: 3, z: 1, dir: 0, color: 'blue' },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 4, rot: 0 },
      { type: 'source', x: 0, y: 3, z: 2, axis: 'z', dir: 1, color: 'blue' },
      { type: 'mirror', x: 6, y: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 6, y: 4, z: 5, color: 'blue' },
    ],
    solution: { '2,2,3': 1, '1,1,2': 1, '2,1,2': 1, '2,3,3': 1, '2,3,1': 1, '2,4,3': 3, '4,4,3': 1, '4,4,4': 1, '6,4,4': 1 },
  },
  // Platz im Spiel: nach „Kölner Dom“
  {
    // Lösung: Prisma (4,0,1) Achse y rot 6 · Spiegel (4,0,5) Achse y rot 1 ·
    //   Spiegel (4,0,0) Achse x rot 3 · Spiegel (4,1,0) Achse z rot 1 · Spiegel (3,1,0) Achse z rot 1 ·
    //   Spiegel (3,2,0) Achse z rot 1 · Spiegel (1,2,0) Achse y rot 3 · Spiegel (1,2,4) Achse y rot 1 ·
    //   Spiegel (5,2,6) Achse y rot 3 · Spiegel (2,2,6) Achse y rot 1
    // Generator schwer-sammelstelle, Seed 20255, Stand 33f26f8, gesenkt um 4 · Würfel „schwer“
    name: 'Paestum', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, y: 0, z: 1, rot: 5 },
      { type: 'source', x: 6, y: 0, z: 5, dir: 4, color: 'red' },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 2 },
      { type: 'source', x: 6, y: 0, z: 1, dir: 4, color: 'cyan' },
      { type: 'target', x: 3, y: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, y: 0, z: 0, color: 'blue' },
      { type: 'mirror', x: 4, y: 0, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 5, y: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 6, rot: 2 },
      { type: 'target', x: 2, y: 2, z: 3, color: 'green' },
    ],
    solution: { '4,0,1': 6, '4,0,5': 1, '4,0,0': 3, '4,1,0': 1, '3,1,0': 1, '3,2,0': 1, '1,2,0': 3, '1,2,4': 1, '5,2,6': 3, '2,2,6': 1 },
  },
  // Platz im Spiel: nach „Paestum“
  {
    // Lösung: Spiegel (3,2,3) Achse y rot 3 · Spiegel (3,2,1) Achse y rot 1 ·
    //   Spiegel (5,2,1) Achse y rot 1 · Spiegel (5,2,3) Achse y rot 1 · Spiegel (5,0,3) Achse y rot 1 ·
    //   Spiegel (6,0,3) Achse z rot 3 · Prisma (5,2,4) Achse y rot 7 · Spiegel (6,2,4) Achse y rot 1
    // Generator schwer-abzaehlen, Seed 21142, Stand 0d0edd0, gesenkt um 3 · Würfel „schwer“
    name: 'Ellora', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 3, rot: 2 },
      { type: 'source', x: 6, y: 2, z: 1, dir: 4, color: 'red' },
      { type: 'source', x: 3, y: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 5, y: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 6, y: 2, z: 3, color: 'white' },
      { type: 'target', x: 5, y: 2, z: 0, color: 'red' },
      { type: 'target', x: 3, y: 2, z: 6, color: 'red' },
      { type: 'source', x: 5, y: 0, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 3, axis: 'z', rot: 2 },
      { type: 'prism', x: 5, y: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 6, y: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 6, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 1, y: 3, z: 6, color: 'blue' },
    ],
    solution: { '3,2,3': 3, '3,2,1': 1, '5,2,1': 1, '5,2,3': 1, '5,0,3': 1, '6,0,3': 3, '5,2,4': 7, '6,2,4': 1 },
  },
  // Platz im Spiel: nach „Ellora“
  {
    // Lösung: Spiegel (5,4,1) Achse z rot 1 · Spiegel (3,1,2) Achse y rot 2 ·
    //   Spiegel (4,2,2) Achse y rot 3 · Spiegel (5,3,0) Achse x rot 2 · Spiegel (4,1,1) Achse y rot 2 ·
    //   Spiegel (6,1,5) Achse z rot 3 · Spiegel (2,3,3) Achse y rot 2 · Spiegel (6,3,1) Achse z rot 3 ·
    //   Spiegel (3,1,4) Achse y rot 0 · Spiegel (1,1,6) Achse x rot 1
    // Generator schwer-abschalten, Seed 60402, Stand 74361c6 · Würfel „schwer“
    name: 'Kyoto', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 4, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 5, y: 4, z: 1, axis: 'z', rot: 0 },
      { type: 'target', x: 4, y: 4, z: 0, color: 'cyan' },
      { type: 'source', x: 4, y: 0, z: 2, axis: 'z', dir: 5, color: 'cyan' },
      { type: 'mirror', x: 3, y: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 5, y: 3, z: 0, axis: 'x', rot: 0 },
      { type: 'target', x: 5, y: 0, z: 3, color: 'cyan' },
      { type: 'mirror', x: 4, y: 1, z: 1, rot: 3 },
      { type: 'source', x: 3, y: 1, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 6, y: 1, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 2, z: 6, color: 'red' },
      { type: 'mirror', x: 2, y: 3, z: 3, rot: 1 },
      { type: 'source', x: 5, y: 3, z: 6, dir: 5, color: 'red' },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 2, axis: 'z', rot: 0, fixed: true },
      { type: 'mirror', x: 5, y: 1, z: 6, axis: 'x', rot: 2, fixed: true },
      { type: 'mirror', x: 3, y: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 2, z: 6, color: 'red' },
    ],
    solution: { '5,4,1': 1, '3,1,2': 2, '4,2,2': 3, '5,3,0': 2, '4,1,1': 2, '6,1,5': 3, '2,3,3': 2, '6,3,1': 3, '3,1,4': 0, '1,1,6': 1 },
  },
  // Platz im Spiel: nach „Kyoto“
  {
    // Lösung: Spiegel (4,0,5) Achse y rot 1 · Spiegel (5,0,2) Achse y rot 3 ·
    //   Spiegel (5,0,6) Achse y rot 3 · Spiegel (4,0,2) Achse y rot 1 · Spiegel (4,0,0) Achse y rot 3 ·
    //   Spiegel (5,0,1) Achse x rot 3 · Spiegel (5,4,1) Achse x rot 1 · Spiegel (5,4,5) Achse y rot 3 ·
    //   Spiegel (4,4,5) Achse z rot 3 · Spiegel (1,0,2) Achse y rot 3 · Spiegel (1,0,4) Achse y rot 3
    // Generator schwer-abschalten, Seed 60092, Stand 74361c6 · Würfel „schwer“
    name: 'Hampi', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 6, y: 0, z: 5, dir: 4, color: 'red' },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 0 },
      { type: 'target', x: 4, y: 0, z: 6, color: 'red' },
      { type: 'source', x: 6, y: 0, z: 2, dir: 4, color: 'red' },
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 0, rot: 0 },
      { type: 'source', x: 6, y: 0, z: 0, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, y: 0, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 1, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 2, z: 5, color: 'blue' },
      { type: 'mirror', x: 1, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 4, rot: 0 },
      { type: 'target', x: 0, y: 0, z: 4, color: 'red' },
    ],
    solution: { '4,0,5': 1, '5,0,2': 3, '5,0,6': 3, '4,0,2': 1, '4,0,0': 3, '5,0,1': 3, '5,4,1': 1, '5,4,5': 3, '4,4,5': 3, '1,0,2': 3, '1,0,4': 3 },
  },
  // Platz im Spiel: nach „Hampi“
  {
    // Lösung: Spiegel (2,0,1) Achse y rot 3 · Spiegel (2,0,5) Achse y rot 3 ·
    //   Spiegel (4,0,5) Achse y rot 1 · Spiegel (4,0,1) Achse y rot 1 · Spiegel (3,1,2) Achse y rot 1 ·
    //   Spiegel (0,1,2) Achse z rot 3 · Spiegel (0,0,2) Achse x rot 3 · Spiegel (0,0,5) Achse y rot 1 ·
    //   Spiegel (6,0,5) Achse z rot 3 · Spiegel (6,1,5) Achse x rot 1
    // Generator schwer-abzaehlen, Seed 21579, Stand 1df6ca5, gesenkt um 0 · Würfel „schwer“
    name: 'Skara Brae', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 2, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 1, rot: 0 },
      { type: 'source', x: 2, y: 0, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, y: 0, z: 1, dir: 0, color: 'green' },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'green' },
      { type: 'target', x: 2, y: 0, z: 0, color: 'green' },
      { type: 'target', x: 4, y: 0, z: 6, color: 'yellow' },
      { type: 'target', x: 6, y: 0, z: 1, color: 'green' },
      { type: 'source', x: 3, y: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 3, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 4, z: 6, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 4, z: 0, color: 'blue' },
    ],
    solution: { '2,0,1': 3, '2,0,5': 3, '4,0,5': 1, '4,0,1': 1, '3,1,2': 1, '0,1,2': 3, '0,0,2': 3, '0,0,5': 1, '6,0,5': 3, '6,1,5': 1 },
  },
  // Platz im Spiel: nach „Skara Brae“
  {
    // Lösung: Spiegel (3,3,4) Achse z rot 1 · Spiegel (4,3,4) Achse z rot 1 ·
    //   Spiegel (3,1,0) Achse z rot 0 · Spiegel (2,0,0) Achse x rot 3 · Prisma (0,0,2) Achse y rot 2 ·
    //   Spiegel (2,0,1) Achse y rot 1 · Spiegel (2,0,4) Achse x rot 1 · Spiegel (2,4,4) Achse x rot 1
    // Generator schwer-mischziel, Seed 60889, Stand 74361c6 · Würfel „schwer“
    name: 'Cusco', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 3, y: 4, z: 4, axis: 'x', dir: 6, color: 'blue' },
      { type: 'source', x: 4, y: 0, z: 2, axis: 'x', dir: 1, color: 'green' },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 2, z: 4, color: 'white' },
      { type: 'source', x: 4, y: 0, z: 0, axis: 'z', dir: 5 },
      { type: 'mirror', x: 3, y: 1, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'prism', x: 0, y: 0, z: 2, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 4, color: 'green' },
      { type: 'source', x: 0, y: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 2, y: 0, z: 1, rot: 0 },
      { type: 'filter', x: 2, y: 0, z: 2, color: 'green' },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 6, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 2, y: 1, z: 6, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 1, y: 1, z: 6, color: 'green' },
    ],
    solution: { '3,3,4': 1, '4,3,4': 1, '3,1,0': 0, '2,0,0': 3, '0,0,2': 2, '2,0,1': 1, '2,0,4': 1, '2,4,4': 1 },
  },
  // Platz im Spiel: nach „Cusco“
  {
    // Lösung: Spiegel (6,0,4) Achse y rot 1 · Spiegel (6,0,2) Achse y rot 3 ·
    //   Spiegel (4,0,2) Achse y rot 1 · Spiegel (4,0,4) Achse y rot 1 · Prisma (4,0,5) Achse y rot 5 ·
    //   Spiegel (0,0,5) Achse y rot 1 · Spiegel (0,2,2) Achse x rot 1 · Spiegel (0,1,2) Achse x rot 1 ·
    //   Spiegel (0,1,1) Achse y rot 3 · Spiegel (4,1,1) Achse y rot 3
    // Generator schwer-abzaehlen, Seed 20078, Stand 33f26f8, gesenkt um 0 · Würfel „schwer“
    name: 'Yazd', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 6, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 4, rot: 2 },
      { type: 'source', x: 6, y: 0, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, y: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'target', x: 4, y: 0, z: 0, color: 'blue' },
      { type: 'target', x: 6, y: 0, z: 5, color: 'magenta' },
      { type: 'target', x: 3, y: 0, z: 4, color: 'blue' },
      { type: 'prism', x: 4, y: 0, z: 5, rot: 6 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 4, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 4, y: 1, z: 1, rot: 0 },
      { type: 'target', x: 4, y: 1, z: 0, color: 'red' },
    ],
    solution: { '6,0,4': 1, '6,0,2': 3, '4,0,2': 1, '4,0,4': 1, '4,0,5': 5, '0,0,5': 1, '0,2,2': 1, '0,1,2': 1, '0,1,1': 3, '4,1,1': 3 },
  },
  // Platz im Spiel: nach „Yazd“
  {
    // Lösung: Prisma (3,3,4) Achse y rot 6 · Spiegel (4,3,5) Achse y rot 0 ·
    //   Spiegel (1,3,4) Achse y rot 3 · Spiegel (2,3,3) Achse z rot 1 · Spiegel (2,4,2) Achse x rot 0 ·
    //   Spiegel (2,2,0) Achse x rot 2 · Spiegel (2,0,2) Achse z rot 0 · Spiegel (2,3,5) Achse y rot 3 ·
    //   Spiegel (1,4,3) Achse z rot 2 · Spiegel (0,4,2) Achse z rot 3
    // Generator schwer-sammelstelle, Seed 60714, Stand 74361c6 · Würfel „schwer“
    name: 'Uruk', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, y: 3, z: 4, rot: 7 },
      { type: 'source', x: 6, y: 3, z: 3, dir: 3, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 5, rot: 1 },
      { type: 'source', x: 1, y: 3, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, y: 3, z: 4, rot: 1 },
      { type: 'target', x: 4, y: 3, z: 3, color: 'blue' },
      { type: 'target', x: 3, y: 3, z: 2, color: 'green' },
      { type: 'mirror', x: 2, y: 3, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 4, z: 4, rot: 2, fixed: true },
      { type: 'mirror', x: 1, y: 4, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 4, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 3, z: 1, color: 'red' },
    ],
    solution: { '3,3,4': 6, '4,3,5': 0, '1,3,4': 3, '2,3,3': 1, '2,4,2': 0, '2,2,0': 2, '2,0,2': 0, '2,3,5': 3, '1,4,3': 2, '0,4,2': 3 },
  },
  // Platz im Spiel: nach „Uruk“
  {
    // Lösung: Prisma (3,0,3) Achse y rot 7 · Spiegel (3,0,1) Achse y rot 1 ·
    //   Spiegel (4,0,3) Achse y rot 3 · Spiegel (4,0,2) Achse y rot 3 · Spiegel (5,0,2) Achse z rot 3 ·
    //   Spiegel (5,1,2) Achse x rot 3 · Spiegel (5,1,0) Achse y rot 1 · Spiegel (1,1,0) Achse y rot 3 ·
    //   Spiegel (1,1,6) Achse x rot 1 · Spiegel (4,4,3) Achse x rot 1 · Spiegel (1,4,6) Achse x rot 3
    // Generator schwer-falle, Seed 20250, Stand 33f26f8, gesenkt um 2 · Würfel „schwer“
    name: 'Uxmal', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, y: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 0 },
      { type: 'target', x: 1, y: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 1 },
      { type: 'source', x: 6, y: 2, z: 3, axis: 'z', dir: 5, color: 'blue' },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 1, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 6, axis: 'x', rot: 2 },
      { type: 'target', x: 1, y: 4, z: 1, color: 'blue' },
      { type: 'target', x: 0, y: 3, z: 6, color: 'blue' },
    ],
    solution: { '3,0,3': 7, '3,0,1': 1, '4,0,3': 3, '4,0,2': 3, '5,0,2': 3, '5,1,2': 3, '5,1,0': 1, '1,1,0': 3, '1,1,6': 1, '4,4,3': 1, '1,4,6': 3 },
  },
  // Platz im Spiel: nach „Uxmal“
  {
    // Lösung: Prisma (2,2,3) Achse y rot 6 · Spiegel (0,2,5) Achse y rot 2 ·
    //   Spiegel (0,2,3) Achse y rot 1 · Prisma (1,0,2) Achse z rot 6 · Spiegel (1,2,2) Achse x rot 3 ·
    //   Spiegel (0,3,2) Achse y rot 2 · Spiegel (1,2,0) Achse x rot 3 · Spiegel (1,3,0) Achse z rot 1 ·
    //   Spiegel (1,4,2) Achse z rot 0
    // Generator schwer-sammelstelle, Seed 60033, Stand 74361c6 · Würfel „schwer“
    name: 'Lothal', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, y: 2, z: 3, rot: 5 },
      { type: 'source', x: 1, y: 2, z: 6, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 0, y: 2, z: 5, rot: 3 },
      { type: 'source', x: 0, y: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 0, y: 2, z: 3, rot: 2 },
      { type: 'target', x: 2, y: 2, z: 2, color: 'green' },
      { type: 'target', x: 4, y: 2, z: 1, color: 'blue' },
      { type: 'source', x: 0, y: 0, z: 2, dir: 0 },
      { type: 'prism', x: 1, y: 0, z: 2, axis: 'z', rot: 5 },
      { type: 'target', x: 0, y: 1, z: 2, color: 'red' },
      { type: 'mirror', x: 1, y: 2, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 3, z: 0, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 3, z: 0, color: 'green' },
      { type: 'mirror', x: 1, y: 4, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 0, z: 3, color: 'red' },
    ],
    solution: { '2,2,3': 6, '0,2,5': 2, '0,2,3': 1, '1,0,2': 6, '1,2,2': 3, '0,3,2': 2, '1,2,0': 3, '1,3,0': 1, '1,4,2': 0 },
  },
  // Platz im Spiel: nach „Lothal“
  {
    // Lösung: Spiegel (0,4,2) Achse y rot 1 · Spiegel (3,4,2) Achse y rot 1 ·
    //   Spiegel (3,4,5) Achse y rot 1 · Spiegel (0,4,5) Achse y rot 3 · Spiegel (3,3,3) Achse y rot 3 ·
    //   Spiegel (3,3,1) Achse x rot 1 · Spiegel (3,0,1) Achse x rot 3 · Spiegel (3,0,4) Achse y rot 1 ·
    //   Spiegel (4,0,4) Achse y rot 1 · Spiegel (4,0,5) Achse x rot 1
    // Generator schwer-abzaehlen, Seed 21568, Stand 1df6ca5, gesenkt um 2 · Würfel „schwer“
    name: 'Paphos', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 0, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 0, y: 4, z: 5, rot: 0 },
      { type: 'source', x: 3, y: 4, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, y: 4, z: 2, dir: 4, color: 'green' },
      { type: 'source', x: 0, y: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 0, y: 4, z: 6, color: 'green' },
      { type: 'target', x: 3, y: 4, z: 0, color: 'green' },
      { type: 'target', x: 4, y: 4, z: 5, color: 'white' },
      { type: 'source', x: 0, y: 3, z: 3, dir: 0, color: 'red' },
      { type: 'mirror', x: 3, y: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'x', rot: 2 },
    ],
    solution: { '0,4,2': 1, '3,4,2': 1, '3,4,5': 1, '0,4,5': 3, '3,3,3': 3, '3,3,1': 1, '3,0,1': 3, '3,0,4': 1, '4,0,4': 1, '4,0,5': 1 },
  },
  // Platz im Spiel: nach „Paphos“
  {
    // Lösung: Spiegel (0,1,2) Achse y rot 1 · Spiegel (4,1,2) Achse y rot 1 ·
    //   Spiegel (4,1,5) Achse y rot 1 · Spiegel (0,1,5) Achse y rot 3 · Spiegel (4,0,1) Achse z rot 3 ·
    //   Spiegel (6,3,2) Achse y rot 3 · Spiegel (3,0,0) Achse x rot 3 · Spiegel (2,1,0) Achse y rot 3 ·
    //   Spiegel (2,2,1) Achse z rot 3 · Spiegel (2,2,3) Achse y rot 0 · Spiegel (0,2,1) Achse y rot 2
    // Generator schwer-abzaehlen, Seed 20490, Stand 0d0edd0, gesenkt um 2 · Würfel „schwer“
    name: 'Aksum', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 0, y: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 4, y: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 5, rot: 2 },
      { type: 'source', x: 0, y: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 4, y: 1, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, y: 1, z: 2, dir: 4, color: 'red' },
      { type: 'target', x: 5, y: 1, z: 5, color: 'yellow' },
      { type: 'target', x: 4, y: 1, z: 0, color: 'red' },
      { type: 'target', x: 0, y: 1, z: 6, color: 'red' },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 2, rot: 0 },
      { type: 'source', x: 6, y: 4, z: 1, axis: 'x', dir: 7, color: 'blue' },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 3 },
      { type: 'target', x: 1, y: 2, z: 0, color: 'blue' },
    ],
    solution: { '0,1,2': 1, '4,1,2': 1, '4,1,5': 1, '0,1,5': 3, '4,0,1': 3, '6,3,2': 3, '3,0,0': 3, '2,1,0': 3, '2,2,1': 3, '2,2,3': 0, '0,2,1': 2 },
  },
  // Platz im Spiel: nach „Aksum“
  {
    // Lösung: Prisma (1,2,4) Achse y rot 0 · Spiegel (3,2,2) Achse y rot 2 ·
    //   Spiegel (2,2,5) Achse y rot 0 · Spiegel (3,2,4) Achse y rot 0 · Spiegel (3,2,5) Achse x rot 1 ·
    //   Prisma (3,2,6) Achse y rot 0 · Spiegel (4,2,5) Achse z rot 1 · Spiegel (6,2,6) Achse y rot 3 ·
    //   Spiegel (4,1,6) Achse y rot 1 · Spiegel (5,0,6) Achse x rot 1
    // Generator schwer-falle, Seed 21581, Stand 1df6ca5, gesenkt um 0 · Würfel „schwer“
    name: 'Hattusa', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 2, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 1, y: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 3, y: 2, z: 2, rot: 1 },
      { type: 'target', x: 1, y: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 2, y: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 4, rot: 2 },
      { type: 'source', x: 3, y: 0, z: 5, axis: 'x', dir: 2 },
      { type: 'mirror', x: 3, y: 2, z: 5, axis: 'x', rot: 2 },
      { type: 'prism', x: 3, y: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 2, z: 6, rot: 0 },
      { type: 'target', x: 4, y: 1, z: 4, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 1, color: 'green' },
      { type: 'mirror', x: 4, y: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 6, y: 0, z: 5, color: 'blue' },
    ],
    solution: { '1,2,4': 0, '3,2,2': 2, '2,2,5': 0, '3,2,4': 0, '3,2,5': 1, '3,2,6': 0, '4,2,5': 1, '6,2,6': 3, '4,1,6': 1, '5,0,6': 1 },
  },
  // Platz im Spiel: nach „Hattusa“
  {
    // Lösung: Spiegel (3,2,1) Achse y rot 1 · Spiegel (6,4,5) Achse y rot 3 ·
    //   Spiegel (5,4,5) Achse y rot 1 · Spiegel (3,3,0) Achse y rot 1 · Spiegel (2,3,0) Achse y rot 3 ·
    //   Prisma (3,3,4) Achse x rot 0 · Spiegel (5,4,6) Achse y rot 3 · Spiegel (2,4,5) Achse y rot 1 ·
    //   Spiegel (3,3,5) Achse y rot 3
    // Generator schwer-abschalten, Seed 60923, Stand 74361c6 · Würfel „schwer“
    name: 'Mykene', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 5, y: 0, z: 1, axis: 'z', dir: 5, color: 'blue' },
      { type: 'mirror', x: 3, y: 2, z: 1, rot: 3 },
      { type: 'target', x: 5, y: 4, z: 1, color: 'blue' },
      { type: 'source', x: 6, y: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 0, rot: 0 },
      { type: 'target', x: 2, y: 4, z: 0, color: 'cyan' },
      { type: 'mirror', x: 2, y: 3, z: 0, rot: 1 },
      { type: 'source', x: 2, y: 3, z: 6, dir: 6, color: 'yellow' },
      { type: 'prism', x: 3, y: 3, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 4, z: 6, rot: 1 },
      { type: 'source', x: 0, y: 4, z: 6, dir: 0, color: 'green' },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 1, y: 3, z: 2, color: 'green' },
    ],
    solution: { '3,2,1': 1, '6,4,5': 3, '5,4,5': 1, '3,3,0': 1, '2,3,0': 3, '3,3,4': 0, '5,4,6': 3, '2,4,5': 1, '3,3,5': 3 },
  },
  // Platz im Spiel: nach „Mykene“
  {
    // Lösung: Prisma (2,2,2) Achse y rot 1 · Spiegel (4,2,2) Achse y rot 3 ·
    //   Spiegel (2,2,3) Achse y rot 1 · Spiegel (3,2,3) Achse y rot 1 · Prisma (2,0,1) Achse x rot 2 ·
    //   Spiegel (3,2,5) Achse x rot 1 · Spiegel (2,3,1) Achse x rot 3 · Spiegel (3,4,5) Achse z rot 3 ·
    //   Spiegel (2,3,0) Achse x rot 3 · Spiegel (2,4,0) Achse z rot 3
    // Generator schwer-falle, Seed 20300, Stand 33f26f8, gesenkt um 2 · Würfel „schwer“
    name: 'Ephesos', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 2, y: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 2, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 2 },
      { type: 'target', x: 4, y: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 2, y: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 3, rot: 3 },
      { type: 'source', x: 2, y: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'prism', x: 2, y: 0, z: 1, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 4, y: 4, z: 3, axis: 'z', rot: 0, fixed: true },
      { type: 'target', x: 5, y: 4, z: 6, color: 'blue' },
      { type: 'target', x: 6, y: 2, z: 3, color: 'red' },
      { type: 'mirror', x: 2, y: 3, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 0, axis: 'z', rot: 1 },
      { type: 'target', x: 4, y: 4, z: 0, color: 'green' },
    ],
    solution: { '2,2,2': 1, '4,2,2': 3, '2,2,3': 1, '3,2,3': 1, '2,0,1': 2, '3,2,5': 1, '2,3,1': 3, '3,4,5': 3, '2,3,0': 3, '2,4,0': 3 },
  },
  // Platz im Spiel: nach „Ephesos“
  {
    // Lösung: Prisma (4,0,1) Achse y rot 1 · Spiegel (4,0,5) Achse y rot 3 ·
    //   Spiegel (6,0,1) Achse y rot 1 · Spiegel (6,0,3) Achse y rot 3 · Spiegel (3,0,3) Achse y rot 3 ·
    //   Prisma (0,0,3) Achse z rot 5 · Spiegel (0,2,3) Achse z rot 3 · Spiegel (3,2,3) Achse z rot 1 ·
    //   Spiegel (3,0,6) Achse x rot 1 · Spiegel (3,1,3) Achse x rot 3
    // Generator schwer-falle, Seed 20334, Stand 33f26f8, gesenkt um 1 · Würfel „schwer“
    name: 'Delphi', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'prism', x: 4, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, y: 0, z: 5, color: 'blue' },
      { type: 'mirror', x: 6, y: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 3, rot: 1 },
      { type: 'source', x: 3, y: 0, z: 0, dir: 2 },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 2 },
      { type: 'prism', x: 0, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'x', rot: 2 },
      { type: 'target', x: 3, y: 1, z: 4, color: 'blue' },
      { type: 'target', x: 3, y: 3, z: 6, color: 'red' },
    ],
    solution: { '4,0,1': 1, '4,0,5': 3, '6,0,1': 1, '6,0,3': 3, '3,0,3': 3, '0,0,3': 5, '0,2,3': 3, '3,2,3': 1, '3,0,6': 1, '3,1,3': 3 },
  },
  // Platz im Spiel: nach „Delphi“
  {
    // Lösung: Spiegel (3,4,5) Achse y rot 3 · Spiegel (3,4,2) Achse y rot 1 ·
    //   Spiegel (5,4,2) Achse y rot 3 · Spiegel (5,4,5) Achse y rot 3 · Spiegel (2,0,3) Achse z rot 1 ·
    //   Spiegel (3,0,3) Achse z rot 3 · Spiegel (3,1,3) Achse z rot 1 · Spiegel (1,1,3) Achse y rot 3 ·
    //   Spiegel (0,1,6) Achse z rot 1 · Spiegel (0,4,6) Achse z rot 3 · Spiegel (3,4,6) Achse y rot 3
    // Generator schwer-abzaehlen, Seed 20403, Stand 0d0edd0, gesenkt um 2 · Würfel „schwer“
    name: 'Himeji', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, y: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 5, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 5, rot: 0 },
      { type: 'source', x: 5, y: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 3, y: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, y: 4, z: 5, dir: 0, color: 'blue' },
      { type: 'target', x: 6, y: 4, z: 5, color: 'blue' },
      { type: 'target', x: 2, y: 4, z: 2, color: 'blue' },
      { type: 'target', x: 5, y: 4, z: 0, color: 'magenta' },
      { type: 'source', x: 2, y: 4, z: 3, axis: 'x', dir: 6, color: 'green' },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 1, y: 1, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 1, z: 6, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 4, z: 6, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 6, rot: 0 },
      { type: 'target', x: 6, y: 4, z: 2, color: 'green' },
    ],
    solution: { '3,4,5': 3, '3,4,2': 1, '5,4,2': 3, '5,4,5': 3, '2,0,3': 1, '3,0,3': 3, '3,1,3': 1, '1,1,3': 3, '0,1,6': 1, '0,4,6': 3, '3,4,6': 3 },
  },
  // Platz im Spiel: nach „Himeji“
  {
    // Lösung: Prisma (6,3,1) Achse y rot 4 · Spiegel (6,3,0) Achse y rot 1 ·
    //   Spiegel (6,3,2) Achse y rot 3 · Spiegel (5,0,0) Achse y rot 3 · Spiegel (6,0,0) Achse y rot 1 ·
    //   Prisma (6,0,3) Achse y rot 4 · Spiegel (0,0,3) Achse z rot 1 · Spiegel (0,2,3) Achse x rot 3 ·
    //   Spiegel (4,0,1) Achse x rot 3
    // Generator schwer-sammelstelle, Seed 20329, Stand 33f26f8, gesenkt um 3 · Würfel „schwer“
    name: 'Dougga', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 6, y: 3, z: 1, rot: 2 },
      { type: 'source', x: 0, y: 3, z: 0, dir: 0, color: 'red' },
      { type: 'mirror', x: 6, y: 3, z: 0, rot: 0 },
      { type: 'source', x: 0, y: 3, z: 2, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 6, y: 3, z: 2, rot: 2 },
      { type: 'target', x: 2, y: 3, z: 5, color: 'red' },
      { type: 'target', x: 1, y: 3, z: 1, color: 'cyan' },
      { type: 'source', x: 5, y: 0, z: 6, dir: 6 },
      { type: 'mirror', x: 5, y: 0, z: 0, rot: 1 },
      { type: 'mirror', x: 6, y: 0, z: 0, rot: 3 },
      { type: 'prism', x: 6, y: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'target', x: 0, y: 2, z: 1, color: 'green' },
      { type: 'mirror', x: 0, y: 2, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'x', rot: 2 },
    ],
    solution: { '6,3,1': 4, '6,3,0': 1, '6,3,2': 3, '5,0,0': 3, '6,0,0': 1, '6,0,3': 4, '0,0,3': 1, '0,2,3': 3, '4,0,1': 3 },
  },
  // Platz im Spiel: nach „Dougga“
  {
    // Lösung: Spiegel (2,3,2) Achse z rot 3 · Spiegel (3,3,1) Achse y rot 2 ·
    //   Spiegel (2,2,1) Achse y rot 3 · Spiegel (2,4,2) Achse x rot 1 · Spiegel (4,2,2) Achse y rot 1 ·
    //   Spiegel (1,4,3) Achse y rot 0 · Spiegel (0,4,2) Achse z rot 3 · Spiegel (3,1,1) Achse y rot 1 ·
    //   Spiegel (3,3,3) Achse x rot 2 · Spiegel (0,3,5) Achse x rot 2 · Spiegel (0,4,4) Achse z rot 0
    // Generator schwer-abschalten, Seed 60719, Stand 74361c6 · Würfel „schwer“
    name: 'Anuradhapura', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 3, z: 2, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 2, y: 3, z: 2, axis: 'z', rot: 2 },
      { type: 'target', x: 2, y: 1, z: 2, color: 'cyan' },
      { type: 'source', x: 2, y: 4, z: 1, axis: 'z', dir: 1, color: 'cyan' },
      { type: 'mirror', x: 3, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 2, axis: 'x', rot: 3 },
      { type: 'target', x: 2, y: 4, z: 4, color: 'cyan' },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 3 },
      { type: 'source', x: 4, y: 0, z: 4, axis: 'x', dir: 3, color: 'red' },
      { type: 'mirror', x: 1, y: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'x', rot: 0, fixed: true },
      { type: 'mirror', x: 3, y: 1, z: 1, rot: 3 },
      { type: 'source', x: 3, y: 0, z: 2, axis: 'x', dir: 3, color: 'red' },
      { type: 'mirror', x: 3, y: 3, z: 3, axis: 'x', rot: 1 },
      { type: 'target', x: 6, y: 3, z: 0, color: 'red' },
      { type: 'mirror', x: 0, y: 3, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 0, y: 1, z: 1, color: 'red' },
    ],
    solution: { '2,3,2': 3, '3,3,1': 2, '2,2,1': 3, '2,4,2': 1, '4,2,2': 1, '1,4,3': 0, '0,4,2': 3, '3,1,1': 1, '3,3,3': 2, '0,3,5': 2, '0,4,4': 0 },
  },
  // Platz im Spiel: nach „Anuradhapura“
  {
    // Lösung: Spiegel (5,0,2) Achse y rot 3 · Spiegel (5,0,4) Achse y rot 1 ·
    //   Spiegel (2,0,4) Achse y rot 1 · Spiegel (2,0,2) Achse y rot 3 · Prisma (2,0,1) Achse y rot 1 ·
    //   Spiegel (5,2,0) Achse z rot 1 · Spiegel (3,2,0) Achse y rot 3 · Spiegel (3,2,1) Achse x rot 3 ·
    //   Prisma (5,0,1) Achse y rot 5
    // Generator schwer-abzaehlen, Seed 20283, Stand 33f26f8, gesenkt um 0 · Würfel „schwer“
    name: 'Palmyra', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 0 },
      { type: 'source', x: 2, y: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, y: 0, z: 2, dir: 4, color: 'blue' },
      { type: 'source', x: 0, y: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'target', x: 6, y: 0, z: 4, color: 'blue' },
      { type: 'target', x: 0, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 2, y: 0, z: 5, color: 'magenta' },
      { type: 'prism', x: 2, y: 0, z: 1, rot: 6 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, y: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 1, axis: 'x', rot: 2 },
      { type: 'target', x: 3, y: 1, z: 1, color: 'red' },
      { type: 'source', x: 5, y: 0, z: 6, dir: 6, color: 'yellow' },
      { type: 'prism', x: 5, y: 0, z: 1, rot: 3 },
      { type: 'target', x: 3, y: 0, z: 3, color: 'red' },
    ],
    solution: { '5,0,2': 3, '5,0,4': 1, '2,0,4': 1, '2,0,2': 3, '2,0,1': 1, '5,2,0': 1, '3,2,0': 3, '3,2,1': 3, '5,0,1': 5 },
  },
  // Platz im Spiel: nach „Palmyra“
  {
    // Lösung: Prisma (5,3,3) Achse y rot 1 · Spiegel (1,3,3) Achse y rot 3 ·
    //   Prisma (6,0,4) Achse x rot 1 · Spiegel (6,3,3) Achse z rot 3 · Spiegel (6,4,3) Achse x rot 3 ·
    //   Spiegel (6,4,2) Achse y rot 1 · Spiegel (1,4,2) Achse y rot 1 · Spiegel (6,2,6) Achse x rot 2 ·
    //   Spiegel (6,0,5) Achse y rot 3
    // Generator schwer-sammelstelle, Seed 60127, Stand 74361c6 · Würfel „schwer“
    name: 'Yaxchilan', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, y: 3, z: 3, rot: 5 },
      { type: 'source', x: 2, y: 3, z: 0, dir: 1, color: 'magenta' },
      { type: 'source', x: 1, y: 3, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 1, y: 3, z: 3, rot: 1 },
      { type: 'target', x: 5, y: 3, z: 5, color: 'blue' },
      { type: 'target', x: 6, y: 3, z: 4, color: 'cyan' },
      { type: 'source', x: 6, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 6, y: 0, z: 4, axis: 'x', rot: 7 },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 1, y: 4, z: 0, color: 'red' },
      { type: 'target', x: 2, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 6, y: 1, z: 3, color: 'green' },
    ],
    solution: { '5,3,3': 1, '1,3,3': 3, '6,0,4': 1, '6,3,3': 3, '6,4,3': 3, '6,4,2': 1, '1,4,2': 1, '6,2,6': 2, '6,0,5': 3 },
  },
  // Platz im Spiel: nach „Yaxchilan“
  {
    // Lösung: Spiegel (0,1,3) Achse z rot 3 · Prisma (5,0,2) Achse y rot 7 ·
    //   Spiegel (0,0,3) Achse x rot 3 · Prisma (0,0,6) Achse y rot 0 · Spiegel (5,0,0) Achse x rot 3 ·
    //   Spiegel (1,0,5) Achse x rot 3 · Spiegel (2,1,5) Achse y rot 1 · Spiegel (6,0,2) Achse y rot 1 ·
    //   Kombinator (6,0,6) Achse z dir 5 · Spiegel (2,4,6) Achse x rot 0
    // Generator schwer, Seed 60972, Stand 74361c6 · Würfel „schwer“
    name: 'Karthago', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 6, y: 1, z: 3, dir: 4 },
      { type: 'source', x: 0, y: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'prism', x: 5, y: 0, z: 2, rot: 6 },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'x', rot: 2 },
      { type: 'prism', x: 0, y: 0, z: 6, rot: 7 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'target', x: 5, y: 3, z: 0, color: 'red' },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 1, z: 5, rot: 2 },
      { type: 'target', x: 2, y: 2, z: 6, color: 'red' },
      { type: 'mirror', x: 6, y: 0, z: 2, rot: 2 },
      { type: 'combiner', x: 6, y: 0, z: 6, axis: 'z', dir: 4 },
      { type: 'mirror', x: 2, y: 4, z: 6, axis: 'x', rot: 2 },
      { type: 'target', x: 0, y: 2, z: 6, color: 'cyan' },
    ],
    solution: { '0,1,3': 3, '5,0,2': 7, '0,0,3': 3, '0,0,6': 0, '5,0,0': 3, '1,0,5': 3, '2,1,5': 1, '6,0,2': 1, '6,0,6': 5, '2,4,6': 0 },
  },
  // Platz im Spiel: nach „Karthago“
  {
    // Lösung: Prisma (4,2,4) Achse y rot 7 · Spiegel (6,2,4) Achse y rot 1 ·
    //   Spiegel (4,2,3) Achse y rot 3 · Spiegel (5,2,3) Achse y rot 3 · Spiegel (5,2,2) Achse y rot 3 ·
    //   Spiegel (3,3,1) Achse z rot 3 · Spiegel (3,0,1) Achse x rot 3 · Spiegel (3,0,3) Achse y rot 1 ·
    //   Spiegel (6,2,2) Achse z rot 3 · Prisma (6,0,3) Achse z rot 6 · Spiegel (6,4,2) Achse x rot 3
    // Generator schwer-falle, Seed 21647, Stand 1df6ca5, gesenkt um 1 · Würfel „schwer“
    name: 'Baalbek', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 2, y: 2, z: 6, dir: 7, color: 'magenta' },
      { type: 'prism', x: 4, y: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 6, y: 2, z: 4, rot: 3 },
      { type: 'target', x: 6, y: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 4, y: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 3, rot: 2 },
      { type: 'source', x: 6, y: 3, z: 1, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 5, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 6, y: 2, z: 2, axis: 'z', rot: 0 },
      { type: 'prism', x: 6, y: 0, z: 3, axis: 'z', rot: 5 },
      { type: 'mirror', x: 6, y: 4, z: 2, axis: 'x', rot: 0 },
      { type: 'target', x: 6, y: 4, z: 1, color: 'red' },
      { type: 'target', x: 4, y: 4, z: 5, color: 'red' },
    ],
    solution: { '4,2,4': 7, '6,2,4': 1, '4,2,3': 3, '5,2,3': 3, '5,2,2': 3, '3,3,1': 3, '3,0,1': 3, '3,0,3': 1, '6,2,2': 3, '6,0,3': 6, '6,4,2': 3 },
  },
  // Platz im Spiel: nach „Baalbek“
  {
    // Lösung: Spiegel (4,3,6) Achse y rot 2 · Spiegel (4,4,1) Achse y rot 2 ·
    //   Spiegel (6,4,3) Achse y rot 2 · Spiegel (3,4,6) Achse x rot 3 · Spiegel (3,4,4) Achse y rot 1 ·
    //   Spiegel (3,3,6) Achse x rot 1 · Spiegel (3,3,1) Achse y rot 1 · Spiegel (0,3,4) Achse x rot 3 ·
    //   Spiegel (3,4,0) Achse y rot 0 · Spiegel (3,4,2) Achse y rot 0 · Spiegel (0,3,1) Achse y rot 3
    // Generator schwer-abschalten, Seed 60810, Stand 74361c6 · Würfel „schwer“
    name: 'Ayutthaya', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 1, y: 0, z: 6, axis: 'z', dir: 7, color: 'red' },
      { type: 'mirror', x: 4, y: 3, z: 6, rot: 0 },
      { type: 'target', x: 4, y: 4, z: 5, color: 'red' },
      { type: 'source', x: 5, y: 4, z: 0, dir: 3, color: 'red' },
      { type: 'mirror', x: 4, y: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 4, z: 6, axis: 'x', rot: 2 },
      { type: 'target', x: 2, y: 4, z: 5, color: 'yellow' },
      { type: 'mirror', x: 3, y: 4, z: 4, rot: 2 },
      { type: 'source', x: 0, y: 4, z: 4, dir: 0, color: 'green' },
      { type: 'mirror', x: 3, y: 3, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 4, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 2, z: 4, color: 'green' },
      { type: 'mirror', x: 3, y: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 1 },
      { type: 'source', x: 1, y: 4, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 0, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 3, axis: 'z', rot: 2, fixed: true },
    ],
    solution: { '4,3,6': 2, '4,4,1': 2, '6,4,3': 2, '3,4,6': 3, '3,4,4': 1, '3,3,6': 1, '3,3,1': 1, '0,3,4': 3, '3,4,0': 0, '3,4,2': 0, '0,3,1': 3 },
  },
  // Platz im Spiel: nach „Ayutthaya“
  {
    // Lösung: Spiegel (4,0,3) Achse y rot 1 · Spiegel (5,3,4) Achse y rot 3 ·
    //   Spiegel (4,2,4) Achse y rot 3 · Spiegel (4,0,0) Achse y rot 1 · Spiegel (2,2,4) Achse y rot 1 ·
    //   Spiegel (0,2,4) Achse z rot 3 · Spiegel (0,0,4) Achse x rot 3 · Spiegel (4,2,3) Achse y rot 3 ·
    //   Spiegel (2,2,1) Achse y rot 3 · Prisma (0,0,0) Achse z rot 6 · Spiegel (2,2,0) Achse y rot 1
    // Generator schwer-abschalten, Seed 60952, Stand 74361c6 · Würfel „schwer“
    name: 'Djenné', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 6, y: 0, z: 3, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 2 },
      { type: 'target', x: 4, y: 0, z: 6, color: 'magenta' },
      { type: 'source', x: 5, y: 4, z: 3, axis: 'x', dir: 7, color: 'magenta' },
      { type: 'mirror', x: 5, y: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 0, rot: 0 },
      { type: 'source', x: 2, y: 2, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 2, y: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 3, rot: 0 },
      { type: 'source', x: 6, y: 2, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 2, y: 2, z: 1, rot: 2 },
      { type: 'target', x: 5, y: 2, z: 1, color: 'green' },
      { type: 'prism', x: 0, y: 0, z: 0, axis: 'z', rot: 7 },
      { type: 'target', x: 0, y: 0, z: 6, color: 'green' },
      { type: 'mirror', x: 2, y: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 2, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 3, y: 1, z: 4, color: 'blue' },
    ],
    solution: { '4,0,3': 1, '5,3,4': 3, '4,2,4': 3, '4,0,0': 1, '2,2,4': 1, '0,2,4': 3, '0,0,4': 3, '4,2,3': 3, '2,2,1': 3, '0,0,0': 6, '2,2,0': 1 },
  },
  // Platz im Spiel: nach „Djenné“
  {
    // Lösung: Spiegel (3,3,1) Achse y rot 3 · Spiegel (0,3,2) Achse y rot 3 ·
    //   Spiegel (1,2,2) Achse y rot 3 · Spiegel (3,2,0) Achse y rot 3 · Spiegel (4,2,0) Achse y rot 1 ·
    //   Spiegel (3,2,1) Achse y rot 1 · Spiegel (5,2,1) Achse y rot 3 · Spiegel (5,2,0) Achse y rot 3 ·
    //   Spiegel (6,2,0) Achse y rot 1 · Spiegel (5,2,2) Achse y rot 1 · Spiegel (6,3,2) Achse y rot 1
    // Generator schwer-abschalten, Seed 60791, Stand 74361c6 · Würfel „schwer“
    name: 'Dunhuang', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 2, y: 4, z: 1, axis: 'z', dir: 1 },
      { type: 'mirror', x: 3, y: 3, z: 1, rot: 2 },
      { type: 'target', x: 1, y: 1, z: 1, color: 'white' },
      { type: 'source', x: 0, y: 4, z: 3, axis: 'x', dir: 5 },
      { type: 'mirror', x: 0, y: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 1, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 0, rot: 0 },
      { type: 'target', x: 5, y: 0, z: 0, color: 'white' },
      { type: 'mirror', x: 4, y: 2, z: 0, rot: 3 },
      { type: 'source', x: 4, y: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 3, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 0, rot: 0 },
      { type: 'filter', x: 6, y: 2, z: 1, color: 'red' },
      { type: 'mirror', x: 6, y: 2, z: 3, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 5, y: 2, z: 2, rot: 3 },
      { type: 'source', x: 5, y: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 1, y: 2, z: 5, color: 'magenta' },
      { type: 'mirror', x: 6, y: 3, z: 2, rot: 0 },
      { type: 'target', x: 0, y: 3, z: 6, color: 'red' },
    ],
    solution: { '3,3,1': 3, '0,3,2': 3, '1,2,2': 3, '3,2,0': 3, '4,2,0': 1, '3,2,1': 1, '5,2,1': 3, '5,2,0': 3, '6,2,0': 1, '5,2,2': 1, '6,3,2': 1 },
  },
  // Platz im Spiel: nach „Dunhuang“
  {
    // Lösung: Prisma (5,2,5) Achse y rot 4 · Spiegel (5,2,0) Achse y rot 1 ·
    //   Prisma (4,1,4) Achse x rot 4 · Spiegel (4,1,2) Achse x rot 1 · Spiegel (4,2,3) Achse z rot 1 ·
    //   Spiegel (4,0,3) Achse z rot 1 · Spiegel (4,0,2) Achse x rot 1 · Spiegel (4,0,0) Achse y rot 3 ·
    //   Spiegel (6,0,0) Achse y rot 1 · Spiegel (6,0,1) Achse y rot 3 · Spiegel (1,0,1) Achse z rot 1
    // Generator schwer-sammelstelle, Seed 20581, Stand 0d0edd0, gesenkt um 0 · Würfel „schwer“
    name: 'Ninive', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, y: 2, z: 5, rot: 2 },
      { type: 'source', x: 0, y: 2, z: 0, dir: 0, color: 'blue' },
      { type: 'mirror', x: 5, y: 2, z: 0, rot: 2 },
      { type: 'source', x: 6, y: 2, z: 5, dir: 4, color: 'red' },
      { type: 'target', x: 1, y: 2, z: 1, color: 'cyan' },
      { type: 'target', x: 4, y: 2, z: 6, color: 'red' },
      { type: 'source', x: 4, y: 1, z: 6, dir: 6 },
      { type: 'prism', x: 4, y: 1, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 1, axis: 'z', rot: 0 },
      { type: 'target', x: 5, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 3, y: 2, z: 2, color: 'red' },
    ],
    solution: { '5,2,5': 4, '5,2,0': 1, '4,1,4': 4, '4,1,2': 1, '4,2,3': 1, '4,0,3': 1, '4,0,2': 1, '4,0,0': 3, '6,0,0': 1, '6,0,1': 3, '1,0,1': 1 },
  },
  // Platz im Spiel: nach „Ninive“
  {
    // Lösung: Prisma (3,3,2) Achse y rot 5 · Spiegel (4,3,1) Achse y rot 0 ·
    //   Spiegel (3,3,6) Achse y rot 3 · Spiegel (1,3,2) Achse z rot 1 · Spiegel (6,4,5) Achse x rot 3 ·
    //   Spiegel (6,4,2) Achse y rot 1 · Spiegel (3,4,2) Achse y rot 3 · Spiegel (1,4,2) Achse x rot 3 ·
    //   Spiegel (6,1,5) Achse z rot 3 · Spiegel (1,4,0) Achse y rot 3 · Prisma (3,4,5) Achse x rot 7
    // Generator schwer-sammelstelle, Seed 60004, Stand 74361c6 · Würfel „schwer“
    name: 'Butrint', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, y: 3, z: 2, rot: 2 },
      { type: 'source', x: 6, y: 3, z: 3, dir: 5, color: 'green' },
      { type: 'mirror', x: 4, y: 3, z: 1, rot: 2 },
      { type: 'source', x: 0, y: 3, z: 6, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 3, y: 3, z: 6, rot: 1 },
      { type: 'target', x: 1, y: 3, z: 0, color: 'green' },
      { type: 'target', x: 3, y: 3, z: 1, color: 'blue' },
      { type: 'source', x: 0, y: 1, z: 5, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 1, y: 3, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 5, y: 4, z: 6, color: 'red' },
      { type: 'prism', x: 3, y: 4, z: 5, axis: 'x', rot: 4 },
      { type: 'target', x: 0, y: 0, z: 6, color: 'green' },
    ],
    solution: { '3,3,2': 5, '4,3,1': 0, '3,3,6': 3, '1,3,2': 1, '6,4,5': 3, '6,4,2': 1, '3,4,2': 3, '1,4,2': 3, '6,1,5': 3, '1,4,0': 3, '3,4,5': 7 },
  },
  // Platz im Spiel: nach „Butrint“
  {
    // Lösung: Spiegel (4,4,5) Achse z rot 1 · Spiegel (4,2,5) Achse z rot 3 ·
    //   Spiegel (3,1,4) Achse y rot 0 · Prisma (5,1,2) Achse z rot 6 · Spiegel (5,4,2) Achse x rot 1 ·
    //   Spiegel (6,2,2) Achse y rot 2 · Spiegel (5,4,3) Achse y rot 3 · Spiegel (4,4,2) Achse x rot 3 ·
    //   Spiegel (0,2,0) Achse y rot 3 · Spiegel (1,4,3) Achse y rot 1 · Spiegel (2,4,0) Achse x rot 1
    // Generator schwer-mischziel, Seed 60199, Stand 74361c6 · Würfel „schwer“
    name: 'Nippur', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 4, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 3, y: 0, z: 5, axis: 'x', dir: 3, color: 'yellow' },
      { type: 'mirror', x: 4, y: 4, z: 5, axis: 'z', rot: 3 },
      { type: 'mirror', x: 4, y: 2, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 4, rot: 2 },
      { type: 'target', x: 3, y: 2, z: 5, color: 'white' },
      { type: 'source', x: 5, y: 0, z: 2, axis: 'x', dir: 2, color: 'cyan' },
      { type: 'prism', x: 5, y: 1, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 3, rot: 3 },
      { type: 'target', x: 1, y: 4, z: 0, color: 'green' },
      { type: 'mirror', x: 2, y: 4, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 1, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 4, y: 1, z: 3, color: 'blue' },
    ],
    solution: { '4,4,5': 1, '4,2,5': 3, '3,1,4': 0, '5,1,2': 6, '5,4,2': 1, '6,2,2': 2, '5,4,3': 3, '4,4,2': 3, '0,2,0': 3, '1,4,3': 1, '2,4,0': 1 },
  },
  // Platz im Spiel: nach „Nippur“
  {
    // Lösung: Prisma (2,0,5) Achse y rot 5 · Spiegel (2,0,1) Achse y rot 3 ·
    //   Spiegel (0,0,5) Achse y rot 1 · Spiegel (0,0,3) Achse y rot 3 · Spiegel (4,1,1) Achse x rot 3 ·
    //   Spiegel (1,0,3) Achse z rot 3 · Spiegel (1,2,3) Achse z rot 1 · Spiegel (4,2,1) Achse x rot 3 ·
    //   Spiegel (4,2,0) Achse y rot 1 · Prisma (0,2,0) Achse y rot 2 · Spiegel (5,2,5) Achse z rot 1
    // Generator schwer-falle, Seed 20139, Stand 33f26f8, gesenkt um 4 · Würfel „schwer“
    name: 'Pyramide', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 6, y: 0, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 1, rot: 0 },
      { type: 'target', x: 6, y: 0, z: 1, color: 'blue' },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 3, rot: 1 },
      { type: 'source', x: 4, y: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 4, y: 1, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 2, z: 3, color: 'yellow' },
      { type: 'mirror', x: 4, y: 2, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 0, rot: 0 },
      { type: 'prism', x: 0, y: 2, z: 0, rot: 4 },
      { type: 'mirror', x: 5, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 1, z: 6, color: 'red' },
    ],
    solution: { '2,0,5': 5, '2,0,1': 3, '0,0,5': 1, '0,0,3': 3, '4,1,1': 3, '1,0,3': 3, '1,2,3': 1, '4,2,1': 3, '4,2,0': 1, '0,2,0': 2, '5,2,5': 1 },
  },
  // Platz im Spiel: nach „Pyramide“
  {
    // Lösung: Spiegel (1,1,4) Achse y rot 1 · Spiegel (4,1,4) Achse y rot 1 ·
    //   Spiegel (4,1,0) Achse y rot 3 · Spiegel (1,1,0) Achse y rot 1 · Spiegel (3,1,5) Achse z rot 1 ·
    //   Spiegel (3,3,5) Achse x rot 1 · Spiegel (3,3,6) Achse y rot 1 · Spiegel (4,3,6) Achse z rot 1 ·
    //   Prisma (1,1,5) Achse y rot 7 · Spiegel (3,0,5) Achse x rot 3
    // Generator schwer-abzaehlen, Seed 20955, Stand 0d0edd0, gesenkt um 3 · Würfel „schwer“
    name: 'Machu Picchu', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 1, y: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 4, y: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 0, rot: 3 },
      { type: 'source', x: 1, y: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, y: 1, z: 0, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, y: 1, z: 4, dir: 4, color: 'red' },
      { type: 'target', x: 0, y: 1, z: 4, color: 'red' },
      { type: 'target', x: 5, y: 1, z: 0, color: 'red' },
      { type: 'target', x: 4, y: 1, z: 6, color: 'white' },
      { type: 'source', x: 6, y: 1, z: 5, dir: 4, color: 'green' },
      { type: 'mirror', x: 3, y: 1, z: 5, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'z', rot: 3 },
      { type: 'prism', x: 1, y: 1, z: 5, rot: 4 },
      { type: 'mirror', x: 3, y: 0, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, y: 0, z: 6, color: 'blue' },
    ],
    solution: { '1,1,4': 1, '4,1,4': 1, '4,1,0': 3, '1,1,0': 1, '3,1,5': 1, '3,3,5': 1, '3,3,6': 1, '4,3,6': 1, '1,1,5': 7, '3,0,5': 3 },
  },
  // Platz im Spiel: nach „Machu Picchu“
  {
    // Lösung: Prisma (2,2,0) Achse y rot 0 · Prisma (1,4,2) Achse y rot 0 ·
    //   Spiegel (6,2,4) Achse z rot 1 · Spiegel (4,4,5) Achse z rot 1 · Spiegel (2,4,1) Achse z rot 1 ·
    //   Spiegel (2,3,0) Achse y rot 1 · Spiegel (4,2,0) Achse z rot 1 · Spiegel (4,3,6) Achse x rot 2 ·
    //   Spiegel (4,4,2) Achse y rot 3 · Spiegel (6,1,5) Achse y rot 0 · Spiegel (4,1,0) Achse z rot 3
    // Generator schwer, Seed 60565, Stand 74361c6 · Würfel „schwer“
    name: 'Avebury', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 2, z: 0, dir: 0 },
      { type: 'source', x: 1, y: 4, z: 0, dir: 2 },
      { type: 'prism', x: 2, y: 2, z: 0, rot: 1 },
      { type: 'prism', x: 1, y: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 4, y: 2, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'x', rot: 1 },
      { type: 'target', x: 0, y: 1, z: 0, color: 'yellow' },
      { type: 'target', x: 4, y: 2, z: 5, color: 'blue' },
      { type: 'mirror', x: 4, y: 4, z: 2, rot: 1 },
      { type: 'target', x: 4, y: 4, z: 1, color: 'green' },
      { type: 'mirror', x: 6, y: 1, z: 5, rot: 1 },
      { type: 'target', x: 6, y: 0, z: 4, color: 'blue' },
      { type: 'mirror', x: 4, y: 1, z: 0, axis: 'z', rot: 2 },
    ],
    solution: { '2,2,0': 0, '1,4,2': 0, '6,2,4': 1, '4,4,5': 1, '2,4,1': 1, '2,3,0': 1, '4,2,0': 1, '4,3,6': 2, '4,4,2': 3, '6,1,5': 0, '4,1,0': 3 },
  },
  // Platz im Spiel: nach „Avebury“
  {
    // Lösung: Spiegel (3,3,3) Achse y rot 1 · Spiegel (1,3,3) Achse y rot 1 ·
    //   Spiegel (1,3,1) Achse y rot 1 · Spiegel (3,3,1) Achse y rot 1 · Spiegel (5,1,0) Achse x rot 3 ·
    //   Spiegel (5,4,0) Achse x rot 1 · Prisma (5,4,6) Achse x rot 6 · Spiegel (5,3,5) Achse y rot 1 ·
    //   Spiegel (2,0,5) Achse x rot 0 · Spiegel (1,1,5) Achse y rot 1 · Spiegel (5,2,6) Achse x rot 1
    // Generator schwer-abzaehlen, Seed 20429, Stand 0d0edd0, gesenkt um 0 · Würfel „schwer“
    name: 'Milet', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, y: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 1, rot: 2 },
      { type: 'source', x: 3, y: 3, z: 6, dir: 6 },
      { type: 'source', x: 0, y: 3, z: 3, dir: 0, color: 'green' },
      { type: 'source', x: 1, y: 3, z: 0, dir: 2, color: 'green' },
      { type: 'target', x: 1, y: 3, z: 4, color: 'green' },
      { type: 'target', x: 0, y: 3, z: 1, color: 'white' },
      { type: 'target', x: 4, y: 3, z: 3, color: 'green' },
      { type: 'source', x: 5, y: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 5, y: 1, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 0, axis: 'x', rot: 0 },
      { type: 'prism', x: 5, y: 4, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 0, y: 4, z: 3, color: 'red' },
      { type: 'target', x: 0, y: 2, z: 2, color: 'green' },
    ],
    solution: { '3,3,3': 1, '1,3,3': 1, '1,3,1': 1, '3,3,1': 1, '5,1,0': 3, '5,4,0': 1, '5,4,6': 6, '5,3,5': 1, '2,0,5': 0, '1,1,5': 1, '5,2,6': 1 },
  },
  // Platz im Spiel: nach „Milet“
  {
    // Lösung: Prisma (2,1,5) Achse y rot 7 · Spiegel (2,1,1) Achse x rot 1 ·
    //   Prisma (0,3,1) Achse z rot 7 · Spiegel (1,3,1) Achse z rot 1 · Spiegel (1,1,1) Achse x rot 1 ·
    //   Spiegel (2,0,1) Achse z rot 1 · Spiegel (1,4,1) Achse x rot 0 ·
    //   Kombinator (5,0,1) Achse y dir 1 · Spiegel (1,1,0) Achse x rot 1 ·
    //   Spiegel (6,0,2) Achse z rot 2
    // Generator schwer-sammelstelle, Seed 60153, Stand 74361c6 · Würfel „schwer“
    name: 'Volubilis', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, y: 1, z: 5, rot: 1 },
      { type: 'source', x: 1, y: 1, z: 6, dir: 7, color: 'magenta' },
      { type: 'source', x: 3, y: 1, z: 6, dir: 5, color: 'green' },
      { type: 'target', x: 4, y: 1, z: 5, color: 'blue' },
      { type: 'target', x: 5, y: 1, z: 2, color: 'green' },
      { type: 'source', x: 3, y: 1, z: 0, dir: 3, color: 'cyan' },
      { type: 'mirror', x: 2, y: 1, z: 1, axis: 'x', rot: 0 },
      { type: 'prism', x: 0, y: 3, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 3, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 1, axis: 'x', rot: 1 },
      { type: 'combiner', x: 5, y: 0, z: 1, dir: 7 },
      { type: 'mirror', x: 1, y: 1, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 5, axis: 'z', rot: 2, fixed: true },
      { type: 'target', x: 4, y: 0, z: 6, color: 'yellow' },
      { type: 'target', x: 1, y: 0, z: 0, color: 'blue' },
    ],
    solution: { '2,1,5': 7, '2,1,1': 1, '0,3,1': 7, '1,3,1': 1, '1,1,1': 1, '2,0,1': 1, '1,4,1': 0, '5,0,1': 1, '1,1,0': 1, '6,0,2': 2 },
  },
  // Platz im Spiel: nach „Volubilis“
  {
    // Lösung: Spiegel (3,3,4) Achse x rot 3 · Spiegel (4,3,0) Achse y rot 3 ·
    //   Prisma (5,2,0) Achse z rot 0 · Spiegel (6,1,0) Achse z rot 2 · Prisma (3,4,4) Achse x rot 3 ·
    //   Spiegel (3,4,3) Achse x rot 1 · Spiegel (3,1,3) Achse z rot 1 · Spiegel (4,1,3) Achse y rot 1 ·
    //   Spiegel (6,3,0) Achse y rot 2 · Spiegel (4,1,4) Achse x rot 1 · Spiegel (6,2,0) Achse y rot 1
    // Generator schwer, Seed 60077, Stand 74361c6 · Würfel „schwer“
    name: 'Wartburg', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 3, y: 3, z: 6, dir: 6 },
      { type: 'source', x: 4, y: 4, z: 1, axis: 'x', dir: 5 },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 0, rot: 2 },
      { type: 'prism', x: 5, y: 2, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 0, axis: 'z', rot: 3 },
      { type: 'prism', x: 3, y: 4, z: 4, axis: 'x', rot: 7 },
      { type: 'mirror', x: 3, y: 4, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 4, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 4, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 5, y: 4, z: 0, color: 'red' },
      { type: 'target', x: 6, y: 2, z: 4, color: 'cyan' },
      { type: 'target', x: 5, y: 0, z: 0, color: 'blue' },
      { type: 'mirror', x: 6, y: 2, z: 0, rot: 3 },
    ],
    solution: { '3,3,4': 3, '4,3,0': 3, '5,2,0': 0, '6,1,0': 2, '3,4,4': 3, '3,4,3': 1, '3,1,3': 1, '4,1,3': 1, '6,3,0': 2, '4,1,4': 1, '6,2,0': 1 },
  },
  // Platz im Spiel: nach „Wartburg“
  {
    // Lösung: Spiegel (5,1,3) Achse x rot 3 · Spiegel (0,3,2) Achse y rot 2 ·
    //   Spiegel (2,3,0) Achse y rot 0 · Spiegel (5,0,3) Achse x rot 1 · Spiegel (6,1,3) Achse y rot 1 ·
    //   Spiegel (6,2,4) Achse y rot 0 · Spiegel (6,4,2) Achse x rot 0 · Spiegel (6,2,0) Achse y rot 0 ·
    //   Spiegel (6,1,1) Achse x rot 2 · Spiegel (2,1,2) Achse x rot 0 · Prisma (1,4,2) Achse z rot 0
    // Generator schwer-abschalten, Seed 60854, Stand 74361c6 · Würfel „schwer“
    name: 'Prambanan', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 5, y: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, y: 1, z: 3, axis: 'x', rot: 1 },
      { type: 'target', x: 5, y: 3, z: 3, color: 'yellow' },
      { type: 'source', x: 4, y: 3, z: 6, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 0, y: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 3, axis: 'x', rot: 2 },
      { type: 'target', x: 5, y: 0, z: 2, color: 'white' },
      { type: 'source', x: 2, y: 0, z: 0, dir: 1, color: 'blue' },
      { type: 'mirror', x: 6, y: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 1, axis: 'x', rot: 0 },
      { type: 'target', x: 6, y: 0, z: 0, color: 'blue' },
      { type: 'source', x: 5, y: 4, z: 2, axis: 'z', dir: 3 },
      { type: 'mirror', x: 2, y: 1, z: 2, axis: 'x', rot: 2 },
      { type: 'prism', x: 1, y: 4, z: 2, axis: 'z', rot: 1 },
      { type: 'target', x: 4, y: 4, z: 2, color: 'green' },
    ],
    solution: { '5,1,3': 3, '0,3,2': 2, '2,3,0': 0, '5,0,3': 1, '6,1,3': 1, '6,2,4': 0, '6,4,2': 0, '6,2,0': 0, '6,1,1': 2, '2,1,2': 0, '1,4,2': 0 },
  },
  // Platz im Spiel: nach „Prambanan“
  {
    // Lösung: Prisma (3,3,4) Achse z rot 1 · Spiegel (4,2,4) Achse y rot 1 ·
    //   Spiegel (5,3,4) Achse z rot 1 · Spiegel (3,1,4) Achse x rot 3 · Spiegel (0,4,3) Achse x rot 3 ·
    //   Spiegel (3,1,5) Achse x rot 3 · Spiegel (0,4,0) Achse x rot 1 · Prisma (0,1,0) Achse x rot 2 ·
    //   Spiegel (5,2,4) Achse x rot 1 · Spiegel (0,0,3) Achse z rot 1 · Spiegel (3,0,3) Achse y rot 1
    // Generator schwer, Seed 60576, Stand 74361c6 · Würfel „schwer“
    name: 'Jerash', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 0, z: 1, axis: 'x', dir: 3 },
      { type: 'source', x: 2, y: 4, z: 4, axis: 'z', dir: 1 },
      { type: 'prism', x: 3, y: 3, z: 4, axis: 'z', rot: 7 },
      { type: 'mirror', x: 4, y: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 4, axis: 'z', rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 1, z: 5, axis: 'x', rot: 0 },
      { type: 'target', x: 3, y: 0, z: 5, color: 'cyan' },
      { type: 'mirror', x: 0, y: 4, z: 0, axis: 'x', rot: 2 },
      { type: 'prism', x: 0, y: 1, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 2, z: 4, axis: 'x', rot: 3 },
      { type: 'target', x: 5, y: 2, z: 2, color: 'red' },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 2 },
      { type: 'target', x: 4, y: 1, z: 5, color: 'green' },
    ],
    solution: { '3,3,4': 1, '4,2,4': 1, '5,3,4': 1, '3,1,4': 3, '0,4,3': 3, '3,1,5': 3, '0,4,0': 1, '0,1,0': 2, '5,2,4': 1, '0,0,3': 1, '3,0,3': 1 },
  },
  // Platz im Spiel: nach „Jerash“
  {
    // Lösung: Prisma (2,0,4) Achse y rot 7 · Spiegel (2,0,5) Achse y rot 3 ·
    //   Spiegel (3,0,3) Achse z rot 3 · Prisma (1,4,5) Achse y rot 7 · Spiegel (4,4,2) Achse z rot 1 ·
    //   Spiegel (6,4,5) Achse y rot 3 · Spiegel (4,2,0) Achse y rot 0 · Spiegel (6,4,0) Achse y rot 1 ·
    //   Spiegel (3,1,2) Achse x rot 2 · Spiegel (3,2,3) Achse z rot 0 · Spiegel (4,0,2) Achse z rot 1
    // Generator schwer-sammelstelle, Seed 60118, Stand 74361c6 · Würfel „schwer“
    name: 'Olympia', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, y: 0, z: 4, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'red' },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 1 },
      { type: 'target', x: 6, y: 0, z: 4, color: 'cyan' },
      { type: 'target', x: 2, y: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'z', rot: 1 },
      { type: 'source', x: 0, y: 4, z: 4, dir: 1, color: 'cyan' },
      { type: 'prism', x: 1, y: 4, z: 5, rot: 6 },
      { type: 'mirror', x: 4, y: 4, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 0, rot: 2 },
      { type: 'target', x: 2, y: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 3, y: 1, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 3, y: 1, z: 4, color: 'green' },
    ],
    solution: { '2,0,4': 7, '2,0,5': 3, '3,0,3': 3, '1,4,5': 7, '4,4,2': 1, '6,4,5': 3, '4,2,0': 0, '6,4,0': 1, '3,1,2': 2, '3,2,3': 0, '4,0,2': 1 },
  },
  // Platz im Spiel: nach „Olympia“
  {
    // Lösung: Spiegel (2,4,0) Achse y rot 1 · Spiegel (2,4,4) Achse y rot 1 ·
    //   Spiegel (4,4,4) Achse y rot 1 · Spiegel (4,4,0) Achse y rot 3 · Spiegel (4,2,3) Achse y rot 3 ·
    //   Spiegel (4,2,2) Achse y rot 1 · Spiegel (1,2,2) Achse y rot 3 · Spiegel (1,2,5) Achse y rot 3 ·
    //   Spiegel (0,2,5) Achse z rot 1 · Spiegel (0,4,6) Achse x rot 3 · Prisma (5,4,4) Achse y rot 3
    // Generator schwer-abzaehlen, Seed 71296, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Stobi', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 2, y: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 2, y: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 0, rot: 2 },
      { type: 'source', x: 2, y: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, y: 4, z: 0, dir: 0, color: 'cyan' },
      { type: 'source', x: 6, y: 4, z: 4, dir: 4, color: 'magenta' },
      { type: 'target', x: 6, y: 4, z: 0, color: 'blue' },
      { type: 'target', x: 4, y: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 0, y: 4, z: 4, color: 'magenta' },
      { type: 'source', x: 0, y: 2, z: 3, dir: 0, color: 'red' },
      { type: 'mirror', x: 4, y: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 1, y: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 5, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 4, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 0, z: 4, axis: 'x', rot: 3, fixed: true },
      { type: 'prism', x: 5, y: 4, z: 4, rot: 2 },
      { type: 'target', x: 5, y: 4, z: 5, color: 'red' },
    ],
    solution: { '2,4,0': 1, '2,4,4': 1, '4,4,4': 1, '4,4,0': 3, '4,2,3': 3, '4,2,2': 1, '1,2,2': 3, '1,2,5': 3, '0,2,5': 1, '0,4,6': 3, '5,4,4': 3 },
  },
  // Platz im Spiel: nach „Stobi“
  {
    // Lösung: Spiegel (5,4,3) Achse y rot 1 · Spiegel (5,4,5) Achse y rot 1 ·
    //   Spiegel (2,4,5) Achse y rot 1 · Spiegel (2,4,3) Achse y rot 1 · Spiegel (1,2,3) Achse x rot 1 ·
    //   Spiegel (1,1,3) Achse z rot 3 · Spiegel (0,1,3) Achse z rot 1 · Prisma (2,4,2) Achse y rot 1 ·
    //   Spiegel (6,4,2) Achse y rot 3 · Spiegel (0,0,0) Achse z rot 1 · Spiegel (0,3,0) Achse z rot 3
    // Generator schwer-abzaehlen, Seed 71771, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Segovia', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, y: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 3, rot: 3 },
      { type: 'source', x: 2, y: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, y: 4, z: 5, dir: 0, color: 'blue' },
      { type: 'source', x: 5, y: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 2, y: 4, z: 6, color: 'blue' },
      { type: 'target', x: 6, y: 4, z: 5, color: 'blue' },
      { type: 'target', x: 0, y: 4, z: 3, color: 'white' },
      { type: 'source', x: 1, y: 2, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 3 },
      { type: 'prism', x: 2, y: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 0, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 0, z: 0, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 0, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 0, axis: 'z', rot: 1 },
      { type: 'target', x: 5, y: 3, z: 0, color: 'red' },
    ],
    solution: { '5,4,3': 1, '5,4,5': 1, '2,4,5': 1, '2,4,3': 1, '1,2,3': 1, '1,1,3': 3, '0,1,3': 1, '2,4,2': 1, '6,4,2': 3, '0,0,0': 1, '0,3,0': 3 },
  },
  // Platz im Spiel: nach „Segovia“
  {
    // Lösung: Spiegel (0,4,3) Achse y rot 3 · Spiegel (0,4,1) Achse y rot 1 ·
    //   Spiegel (2,4,1) Achse y rot 1 · Spiegel (2,4,3) Achse y rot 1 · Prisma (5,4,1) Achse y rot 3 ·
    //   Spiegel (4,4,2) Achse x rot 3 · Prisma (2,4,4) Achse y rot 5 · Spiegel (1,4,4) Achse z rot 3 ·
    //   Spiegel (1,1,2) Achse x rot 3 · Spiegel (3,0,4) Achse y rot 3 · Spiegel (0,1,3) Achse z rot 2
    // Generator schwer-abzaehlen, Seed 71579, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Sukhothai', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 0, y: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 3, rot: 2 },
      { type: 'source', x: 6, y: 4, z: 1, dir: 4, color: 'cyan' },
      { type: 'source', x: 2, y: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, y: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 5, y: 4, z: 3, color: 'magenta' },
      { type: 'target', x: 0, y: 4, z: 5, color: 'blue' },
      { type: 'target', x: 2, y: 4, z: 0, color: 'blue' },
      { type: 'prism', x: 5, y: 4, z: 1, rot: 5 },
      { type: 'mirror', x: 4, y: 4, z: 2, axis: 'x', rot: 2 },
      { type: 'prism', x: 2, y: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 4, axis: 'z', rot: 2 },
      { type: 'target', x: 1, y: 0, z: 4, color: 'yellow' },
      { type: 'mirror', x: 1, y: 1, z: 2, axis: 'x', rot: 1 },
      { type: 'source', x: 3, y: 0, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 3, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 3 },
      { type: 'target', x: 3, y: 1, z: 6, color: 'green' },
    ],
    solution: { '0,4,3': 3, '0,4,1': 1, '2,4,1': 1, '2,4,3': 1, '5,4,1': 3, '4,4,2': 3, '2,4,4': 5, '1,4,4': 3, '1,1,2': 3, '3,0,4': 3, '0,1,3': 2 },
  },
  // Platz im Spiel: nach „Sukhothai“
  {
    // Lösung: Prisma (4,2,4) Achse z rot 7 · Spiegel (5,2,4) Achse y rot 3 ·
    //   Spiegel (5,2,2) Achse y rot 3 · Prisma (0,0,0) Achse x rot 3 · Spiegel (0,4,0) Achse z rot 3 ·
    //   Spiegel (4,4,0) Achse z rot 1 · Spiegel (4,1,0) Achse z rot 3 · Spiegel (1,1,0) Achse z rot 3 ·
    //   Spiegel (4,3,4) Achse x rot 3 · Spiegel (1,0,0) Achse z rot 1 · Spiegel (6,2,2) Achse z rot 1
    // Generator schwer, Seed 60614, Stand 74361c6 · Würfel „schwer“
    name: 'Nazca', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 2, y: 4, z: 4, axis: 'z', dir: 1 },
      { type: 'prism', x: 4, y: 2, z: 4, axis: 'z', rot: 4 },
      { type: 'mirror', x: 5, y: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 2, z: 2, rot: 0 },
      { type: 'source', x: 0, y: 4, z: 4, axis: 'x', dir: 5, color: 'yellow' },
      { type: 'prism', x: 0, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 4, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 1, y: 1, z: 0, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 3, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 0, axis: 'z', rot: 3 },
      { type: 'target', x: 6, y: 4, z: 4, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 0, color: 'magenta' },
      { type: 'mirror', x: 6, y: 2, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 2, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 4, y: 3, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 1, y: 3, z: 2, color: 'red' },
    ],
    solution: { '4,2,4': 7, '5,2,4': 3, '5,2,2': 3, '0,0,0': 3, '0,4,0': 3, '4,4,0': 1, '4,1,0': 3, '1,1,0': 3, '4,3,4': 3, '1,0,0': 1, '6,2,2': 1 },
  },
  // Platz im Spiel: nach „Nazca“
  {
    // Lösung: Spiegel (2,0,1) Achse y rot 1 · Spiegel (2,0,3) Achse y rot 3 ·
    //   Spiegel (4,0,3) Achse y rot 3 · Spiegel (4,0,1) Achse y rot 3 · Prisma (5,0,3) Achse y rot 5 ·
    //   Spiegel (5,0,2) Achse x rot 3 · Spiegel (6,4,3) Achse y rot 3 · Spiegel (3,4,3) Achse y rot 1 ·
    //   Spiegel (2,0,5) Achse y rot 1 · Prisma (6,0,1) Achse y rot 2 · Spiegel (6,0,2) Achse x rot 1
    // Generator schwer-abzaehlen, Seed 70232, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Harappa', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 2, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 1, rot: 0 },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, y: 0, z: 3, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, y: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'target', x: 2, y: 0, z: 0, color: 'red' },
      { type: 'target', x: 4, y: 0, z: 4, color: 'red' },
      { type: 'target', x: 1, y: 0, z: 3, color: 'yellow' },
      { type: 'prism', x: 5, y: 0, z: 3, rot: 4 },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 2, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 4, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 3, y: 4, z: 3, rot: 0 },
      { type: 'target', x: 3, y: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 3 },
      { type: 'source', x: 6, y: 0, z: 5, dir: 4 },
      { type: 'prism', x: 6, y: 0, z: 1, rot: 5 },
      { type: 'mirror', x: 6, y: 0, z: 2, axis: 'x', rot: 3 },
      { type: 'target', x: 6, y: 3, z: 2, color: 'green' },
    ],
    solution: { '2,0,1': 1, '2,0,3': 3, '4,0,3': 3, '4,0,1': 3, '5,0,3': 5, '5,0,2': 3, '6,4,3': 3, '3,4,3': 1, '2,0,5': 1, '6,0,1': 2, '6,0,2': 1 },
  },
  // Platz im Spiel: nach „Harappa“
  {
    // Lösung: Prisma (4,1,2) Achse y rot 3 · Spiegel (2,1,2) Achse y rot 1 ·
    //   Spiegel (4,1,3) Achse y rot 3 · Spiegel (3,1,3) Achse y rot 3 · Prisma (4,1,4) Achse z rot 5 ·
    //   Spiegel (3,1,4) Achse y rot 3 · Prisma (2,2,1) Achse x rot 2 · Spiegel (2,4,3) Achse z rot 0 ·
    //   Spiegel (2,3,4) Achse x rot 2 · Spiegel (2,4,5) Achse y rot 1
    // Generator schwer-falle, Seed 70718, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Luxor', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 4, y: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 4, y: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 2, rot: 0 },
      { type: 'target', x: 2, y: 1, z: 0, color: 'blue' },
      { type: 'mirror', x: 4, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 2 },
      { type: 'source', x: 5, y: 0, z: 4, axis: 'z', dir: 5, color: 'magenta' },
      { type: 'source', x: 2, y: 0, z: 1, axis: 'x', dir: 2 },
      { type: 'prism', x: 4, y: 1, z: 4, axis: 'z', rot: 4 },
      { type: 'mirror', x: 3, y: 1, z: 4, rot: 2 },
      { type: 'prism', x: 2, y: 2, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 4, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 3, y: 1, z: 6, color: 'red' },
      { type: 'target', x: 1, y: 0, z: 2, color: 'red' },
      { type: 'target', x: 1, y: 1, z: 4, color: 'red' },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 2 },
      { type: 'target', x: 4, y: 4, z: 5, color: 'blue' },
    ],
    solution: { '4,1,2': 3, '2,1,2': 1, '4,1,3': 3, '3,1,3': 3, '4,1,4': 5, '3,1,4': 3, '2,2,1': 2, '2,4,3': 0, '2,3,4': 2, '2,4,5': 1 },
  },
  // Platz im Spiel: nach „Luxor“
  {
    // Lösung: Prisma (0,4,4) Achse y rot 1 · Spiegel (2,4,4) Achse y rot 3 ·
    //   Spiegel (0,4,5) Achse y rot 1 · Spiegel (1,4,5) Achse y rot 1 · Prisma (5,3,4) Achse x rot 0 ·
    //   Spiegel (5,1,6) Achse y rot 1 · Spiegel (5,0,5) Achse z rot 3 · Spiegel (3,0,5) Achse y rot 3 ·
    //   Spiegel (1,4,6) Achse y rot 3 · Spiegel (0,4,6) Achse z rot 3 · Spiegel (5,4,5) Achse z rot 1
    // Generator schwer-falle, Seed 71910, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Calakmul', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 0, y: 4, z: 4, rot: 6 },
      { type: 'mirror', x: 2, y: 4, z: 4, rot: 0 },
      { type: 'target', x: 2, y: 4, z: 2, color: 'red' },
      { type: 'mirror', x: 0, y: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 5, rot: 0 },
      { type: 'source', x: 5, y: 4, z: 4, axis: 'x', dir: 6 },
      { type: 'prism', x: 5, y: 3, z: 4, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 5, y: 3, z: 5, axis: 'x', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 0, z: 6, color: 'red' },
      { type: 'mirror', x: 5, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 1, y: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 6, axis: 'z', rot: 1 },
      { type: 'target', x: 0, y: 0, z: 6, color: 'cyan' },
      { type: 'mirror', x: 5, y: 4, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 4, z: 6, color: 'blue' },
    ],
    solution: { '0,4,4': 1, '2,4,4': 3, '0,4,5': 1, '1,4,5': 1, '5,3,4': 0, '5,1,6': 1, '5,0,5': 3, '3,0,5': 3, '1,4,6': 3, '0,4,6': 3, '5,4,5': 1 },
  },
  // Platz im Spiel: nach „Calakmul“
  {
    // Lösung: Prisma (4,0,1) Achse x rot 0 · Spiegel (4,1,2) Achse x rot 2 ·
    //   Spiegel (4,3,0) Achse y rot 3 · Spiegel (5,4,0) Achse x rot 1 · Prisma (0,1,2) Achse x rot 0 ·
    //   Spiegel (4,0,4) Achse x rot 1 · Spiegel (0,1,3) Achse x rot 1 ·
    //   Kombinator (0,2,3) Achse x dir 3 · Spiegel (0,0,3) Achse z rot 0 ·
    //   Spiegel (6,4,1) Achse z rot 2 · Spiegel (0,1,4) Achse y rot 1
    // Generator schwer, Seed 71597, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Ugarit', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 4, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 4, y: 0, z: 1, axis: 'x', rot: 6 },
      { type: 'mirror', x: 4, y: 1, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 4, y: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 0, axis: 'x', rot: 2 },
      { type: 'source', x: 0, y: 0, z: 1, axis: 'x', dir: 1 },
      { type: 'prism', x: 0, y: 1, z: 2, axis: 'x', rot: 6 },
      { type: 'mirror', x: 4, y: 0, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'x', rot: 0 },
      { type: 'combiner', x: 0, y: 2, z: 3, axis: 'x', dir: 2 },
      { type: 'target', x: 4, y: 3, z: 4, color: 'green' },
      { type: 'target', x: 0, y: 4, z: 1, color: 'cyan' },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'z', rot: 1 },
      { type: 'target', x: 3, y: 4, z: 4, color: 'magenta' },
      { type: 'mirror', x: 0, y: 1, z: 4, rot: 0 },
    ],
    solution: { '4,0,1': 0, '4,1,2': 2, '4,3,0': 3, '5,4,0': 1, '0,1,2': 0, '4,0,4': 1, '0,1,3': 1, '0,2,3': 3, '0,0,3': 0, '6,4,1': 2, '0,1,4': 1 },
  },
  // Platz im Spiel: nach „Ugarit“
  {
    // Lösung: Prisma (4,3,1) Achse z rot 2 · Spiegel (5,2,1) Achse y rot 3 ·
    //   Spiegel (5,4,4) Achse y rot 1 · Spiegel (4,0,1) Achse x rot 1 · Prisma (5,4,5) Achse y rot 1 ·
    //   Spiegel (6,4,5) Achse y rot 3 · Spiegel (6,4,1) Achse y rot 1 · Spiegel (3,4,5) Achse x rot 3 ·
    //   Spiegel (3,2,1) Achse y rot 3 · Spiegel (5,4,6) Achse y rot 1 · Spiegel (3,1,5) Achse x rot 1
    // Generator schwer, Seed 71210, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Ravenna', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 6, y: 3, z: 1, dir: 4 },
      { type: 'source', x: 0, y: 4, z: 4, dir: 0 },
      { type: 'prism', x: 4, y: 3, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'x', rot: 3 },
      { type: 'prism', x: 5, y: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 4, y: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 3, y: 4, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 6, rot: 0 },
      { type: 'filter', x: 1, y: 4, z: 4, color: 'magenta' },
      { type: 'target', x: 3, y: 1, z: 2, color: 'magenta' },
      { type: 'target', x: 6, y: 4, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, y: 1, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, y: 0, z: 0, color: 'red' },
    ],
    solution: { '4,3,1': 2, '5,2,1': 3, '5,4,4': 1, '4,0,1': 1, '5,4,5': 1, '6,4,5': 3, '6,4,1': 1, '3,4,5': 3, '3,2,1': 3, '5,4,6': 1, '3,1,5': 1 },
  },
  // Platz im Spiel: nach „Ravenna“
  {
    // Lösung: Prisma (4,4,0) Achse y rot 1 · Spiegel (4,4,2) Achse y rot 3 ·
    //   Spiegel (5,4,0) Achse y rot 1 · Spiegel (5,4,1) Achse y rot 1 · Prisma (3,0,1) Achse y rot 3 ·
    //   Spiegel (3,0,2) Achse x rot 1 · Prisma (2,0,1) Achse z rot 6 · Spiegel (2,2,1) Achse x rot 1 ·
    //   Kombinator (6,4,1) Achse x dir 7 · Spiegel (2,2,5) Achse y rot 1 ·
    //   Spiegel (6,0,5) Achse z rot 3
    // Generator schwer-falle, Seed 71567, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Sanchi', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 4, z: 0, dir: 0, color: 'magenta' },
      { type: 'prism', x: 4, y: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 2, rot: 2 },
      { type: 'target', x: 2, y: 4, z: 2, color: 'blue' },
      { type: 'mirror', x: 5, y: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 1, rot: 3 },
      { type: 'source', x: 0, y: 0, z: 1, dir: 0 },
      { type: 'source', x: 3, y: 0, z: 0, dir: 2 },
      { type: 'prism', x: 3, y: 0, z: 1, rot: 7 },
      { type: 'mirror', x: 3, y: 0, z: 2, axis: 'x', rot: 2 },
      { type: 'prism', x: 2, y: 0, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 2, z: 1, axis: 'x', rot: 0 },
      { type: 'combiner', x: 6, y: 4, z: 1, axis: 'x', dir: 6 },
      { type: 'mirror', x: 2, y: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 5, axis: 'z', rot: 1 },
      { type: 'target', x: 3, y: 3, z: 2, color: 'red' },
      { type: 'target', x: 5, y: 0, z: 6, color: 'magenta' },
      { type: 'target', x: 6, y: 2, z: 5, color: 'green' },
    ],
    solution: { '4,4,0': 1, '4,4,2': 3, '5,4,0': 1, '5,4,1': 1, '3,0,1': 3, '3,0,2': 1, '2,0,1': 6, '2,2,1': 1, '6,4,1': 7, '2,2,5': 1, '6,0,5': 3 },
  },
  // Platz im Spiel: nach „Sanchi“
  {
    // Lösung: Spiegel (5,1,1) Achse z rot 1 · Spiegel (6,3,1) Achse y rot 3 ·
    //   Spiegel (6,2,0) Achse y rot 0 · Spiegel (1,1,1) Achse z rot 3 · Prisma (1,0,1) Achse z rot 3 ·
    //   Spiegel (0,0,1) Achse y rot 3 · Spiegel (0,3,1) Achse y rot 3 · Spiegel (6,3,0) Achse y rot 1 ·
    //   Spiegel (2,1,2) Achse y rot 0 · Prisma (1,0,0) Achse x rot 3 · Spiegel (0,0,4) Achse x rot 1
    // Generator schwer-abschalten, Seed 71520, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Masada', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 5, y: 0, z: 1, axis: 'x', dir: 2 },
      { type: 'mirror', x: 5, y: 1, z: 1, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 1, z: 1, color: 'white' },
      { type: 'source', x: 5, y: 4, z: 1, axis: 'z', dir: 1 },
      { type: 'mirror', x: 6, y: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'z', rot: 2 },
      { type: 'prism', x: 1, y: 0, z: 1, axis: 'z', rot: 4 },
      { type: 'mirror', x: 0, y: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 0, y: 3, z: 1, rot: 0 },
      { type: 'source', x: 0, y: 3, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 6, y: 3, z: 0, rot: 0 },
      { type: 'target', x: 1, y: 3, z: 0, color: 'magenta' },
      { type: 'mirror', x: 2, y: 1, z: 2, rot: 3 },
      { type: 'source', x: 4, y: 1, z: 0, dir: 3, color: 'yellow' },
      { type: 'prism', x: 1, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 4, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 0, y: 4, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 6, y: 4, z: 5, color: 'blue' },
    ],
    solution: { '5,1,1': 1, '6,3,1': 3, '6,2,0': 0, '1,1,1': 3, '1,0,1': 3, '0,0,1': 3, '0,3,1': 3, '6,3,0': 1, '2,1,2': 0, '1,0,0': 3, '0,0,4': 1 },
  },
  // Platz im Spiel: nach „Masada“
  {
    // Lösung: Prisma (2,4,2) Achse y rot 5 · Spiegel (3,4,1) Achse y rot 2 ·
    //   Prisma (1,1,5) Achse x rot 2 · Spiegel (1,4,5) Achse z rot 3 · Spiegel (0,2,0) Achse y rot 3 ·
    //   Spiegel (6,0,0) Achse z rot 3 · Spiegel (6,2,0) Achse z rot 1 · Spiegel (0,2,1) Achse y rot 1 ·
    //   Spiegel (2,2,1) Achse y rot 1 · Spiegel (2,2,6) Achse x rot 1
    // Generator schwer-sammelstelle, Seed 20029, Stand 33f26f8, gesenkt um 2 · Würfel „schwer“
    name: 'Torii', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, y: 4, z: 2, rot: 6 },
      { type: 'source', x: 2, y: 4, z: 0, dir: 1, color: 'cyan' },
      { type: 'mirror', x: 3, y: 4, z: 1, rot: 1 },
      { type: 'source', x: 6, y: 4, z: 6, dir: 5, color: 'red' },
      { type: 'target', x: 2, y: 4, z: 1, color: 'blue' },
      { type: 'target', x: 1, y: 4, z: 2, color: 'magenta' },
      { type: 'source', x: 1, y: 1, z: 6, dir: 6 },
      { type: 'prism', x: 1, y: 1, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 2, z: 6, axis: 'x', rot: 2, fixed: true },
      { type: 'target', x: 2, y: 4, z: 6, color: 'yellow' },
      { type: 'target', x: 1, y: 4, z: 4, color: 'red' },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 0 },
      { type: 'source', x: 0, y: 0, z: 0, dir: 0, color: 'red' },
      { type: 'mirror', x: 6, y: 0, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 2, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 1, y: 4, z: 1, color: 'green' },
    ],
    solution: { '2,4,2': 5, '3,4,1': 2, '1,1,5': 2, '1,4,5': 3, '0,2,0': 3, '6,0,0': 3, '6,2,0': 1, '0,2,1': 1, '2,2,1': 1, '2,2,6': 1 },
  },
  // Platz im Spiel: nach „Torii“
  {
    // Lösung: Prisma (1,3,4) Achse y rot 1 · Spiegel (5,3,4) Achse y rot 3 ·
    //   Spiegel (1,3,6) Achse y rot 1 · Spiegel (3,3,6) Achse y rot 3 · Spiegel (1,1,0) Achse z rot 1 ·
    //   Prisma (1,0,0) Achse x rot 0 · Spiegel (1,2,2) Achse z rot 3 · Spiegel (1,0,2) Achse x rot 3 ·
    //   Spiegel (3,3,3) Achse x rot 3 · Spiegel (3,4,3) Achse z rot 3 · Spiegel (4,3,2) Achse x rot 3
    // Generator schwer-falle, Seed 70144, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Rapa Nui', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 1, y: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 1, y: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 4, rot: 1 },
      { type: 'target', x: 5, y: 3, z: 0, color: 'red' },
      { type: 'mirror', x: 1, y: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 6, rot: 2 },
      { type: 'source', x: 0, y: 1, z: 0, dir: 0 },
      { type: 'source', x: 6, y: 2, z: 2, dir: 4 },
      { type: 'mirror', x: 1, y: 1, z: 0, axis: 'z', rot: 3 },
      { type: 'prism', x: 1, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 2, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'x', rot: 0 },
      { type: 'filter', x: 1, y: 0, z: 3, color: 'yellow' },
      { type: 'mirror', x: 2, y: 2, z: 3, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 1, y: 0, z: 5, color: 'yellow' },
      { type: 'mirror', x: 3, y: 3, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 3, axis: 'z', rot: 0 },
      { type: 'target', x: 4, y: 4, z: 3, color: 'blue' },
      { type: 'mirror', x: 4, y: 3, z: 2, axis: 'x', rot: 0 },
      { type: 'target', x: 5, y: 4, z: 2, color: 'blue' },
    ],
    solution: { '1,3,4': 1, '5,3,4': 3, '1,3,6': 1, '3,3,6': 3, '1,1,0': 1, '1,0,0': 0, '1,2,2': 3, '1,0,2': 3, '3,3,3': 3, '3,4,3': 3, '4,3,2': 3 },
  },
  // Platz im Spiel: nach „Rapa Nui“
  {
    // Lösung: Spiegel (4,0,6) Achse y rot 1 · Spiegel (4,0,2) Achse y rot 1 ·
    //   Spiegel (2,0,2) Achse y rot 1 · Spiegel (2,0,6) Achse y rot 3 · Prisma (2,4,3) Achse x rot 1 ·
    //   Spiegel (2,4,6) Achse y rot 3 · Spiegel (0,4,6) Achse z rot 3 · Prisma (1,0,2) Achse y rot 7 ·
    //   Spiegel (1,0,0) Achse y rot 3 · Spiegel (3,0,3) Achse x rot 1 · Spiegel (3,3,3) Achse z rot 1
    // Generator schwer-abzaehlen, Seed 71674, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Gyeongju', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'mirror', x: 4, y: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 6, rot: 1 },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, y: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, y: 0, z: 6, dir: 4 },
      { type: 'target', x: 5, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 2, y: 0, z: 1, color: 'white' },
      { type: 'target', x: 0, y: 0, z: 6, color: 'magenta' },
      { type: 'source', x: 2, y: 1, z: 6, axis: 'x', dir: 3 },
      { type: 'prism', x: 2, y: 4, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 6, axis: 'z', rot: 0 },
      { type: 'prism', x: 1, y: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 3, axis: 'z', rot: 0 },
      { type: 'target', x: 2, y: 3, z: 3, color: 'red' },
    ],
    solution: { '4,0,6': 1, '4,0,2': 1, '2,0,2': 1, '2,0,6': 3, '2,4,3': 1, '2,4,6': 3, '0,4,6': 3, '1,0,2': 7, '1,0,0': 3, '3,0,3': 1, '3,3,3': 1 },
  },
  // Platz im Spiel: nach „Gyeongju“
  {
    // Lösung: Spiegel (3,3,5) Achse z rot 0 · Spiegel (4,1,6) Achse y rot 3 ·
    //   Spiegel (1,1,6) Achse y rot 1 · Spiegel (4,4,5) Achse z rot 0 · Spiegel (4,3,4) Achse y rot 1 ·
    //   Prisma (4,3,6) Achse x rot 5 · Spiegel (1,2,5) Achse z rot 3 · Spiegel (4,2,5) Achse y rot 0 ·
    //   Spiegel (5,2,1) Achse z rot 2 · Spiegel (2,3,4) Achse z rot 3 · Prisma (6,2,5) Achse z rot 3
    // Generator schwer-abschalten, Seed 71823, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Mzcheta', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 2, y: 4, z: 5, axis: 'z', dir: 1 },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'z', rot: 3 },
      { type: 'target', x: 1, y: 1, z: 5, color: 'white' },
      { type: 'source', x: 4, y: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 4, y: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 4, y: 4, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 3, z: 4, rot: 3 },
      { type: 'source', x: 1, y: 0, z: 4, axis: 'z', dir: 7 },
      { type: 'prism', x: 4, y: 3, z: 6, axis: 'x', rot: 6 },
      { type: 'source', x: 2, y: 0, z: 6, axis: 'z', dir: 5, color: 'red' },
      { type: 'mirror', x: 1, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 2, y: 0, z: 5, color: 'green' },
      { type: 'blocker', x: 3, y: 1, z: 5 },
      { type: 'mirror', x: 5, y: 2, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 2, y: 3, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 5, y: 0, z: 4, color: 'red' },
      { type: 'target', x: 4, y: 2, z: 0, color: 'red' },
      { type: 'prism', x: 6, y: 2, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 2, z: 5, color: 'blue' },
    ],
    solution: { '3,3,5': 0, '4,1,6': 3, '1,1,6': 1, '4,4,5': 0, '4,3,4': 1, '4,3,6': 5, '1,2,5': 3, '4,2,5': 0, '5,2,1': 2, '2,3,4': 3, '6,2,5': 3 },
  },
  // Platz im Spiel: nach „Mzcheta“
  {
    // Lösung: Spiegel (5,2,3) Achse x rot 1 · Spiegel (1,1,1) Achse z rot 3 ·
    //   Prisma (1,2,1) Achse z rot 7 · Spiegel (2,3,1) Achse z rot 0 · Kombinator (3,2,1) Achse y dir 1 ·
    //   Spiegel (4,4,1) Achse x rot 3 · Spiegel (4,2,1) Achse x rot 3 · Prisma (6,3,3) Achse z rot 5 ·
    //   Spiegel (4,2,5) Achse x rot 3 · Spiegel (4,1,5) Achse x rot 1 · Spiegel (4,1,1) Achse y rot 1
    // Generator schwer-mischziel, Seed 60602, Stand 74361c6 · Würfel „schwer“
    name: 'Bonampak', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 5, y: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 5, y: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 5, y: 2, z: 3, axis: 'x', rot: 2 },
      { type: 'target', x: 5, y: 1, z: 3, color: 'white' },
      { type: 'source', x: 4, y: 4, z: 0, dir: 2 },
      { type: 'source', x: 0, y: 1, z: 1, dir: 0 },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'z', rot: 2 },
      { type: 'prism', x: 1, y: 2, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'z', rot: 1 },
      { type: 'combiner', x: 3, y: 2, z: 1, dir: 4 },
      { type: 'mirror', x: 4, y: 4, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 1, axis: 'x', rot: 2 },
      { type: 'prism', x: 6, y: 3, z: 3, axis: 'z', rot: 2 },
      { type: 'filter', x: 4, y: 2, z: 4, color: 'green' },
      { type: 'target', x: 5, y: 4, z: 3, color: 'green' },
      { type: 'target', x: 6, y: 4, z: 3, color: 'blue' },
      { type: 'mirror', x: 4, y: 2, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 1, rot: 0 },
      { type: 'target', x: 1, y: 0, z: 1, color: 'green' },
    ],
    solution: { '5,2,3': 1, '1,1,1': 3, '1,2,1': 7, '2,3,1': 0, '3,2,1': 1, '4,4,1': 3, '4,2,1': 3, '6,3,3': 5, '4,2,5': 3, '4,1,5': 1, '4,1,1': 1 },
  },
  // Platz im Spiel: nach „Bonampak“
  {
    // Lösung: Spiegel (2,1,2) Achse z rot 1 · Spiegel (5,2,2) Achse y rot 3 ·
    //   Spiegel (3,2,3) Achse z rot 2 · Spiegel (6,1,2) Achse y rot 1 · Prisma (2,0,3) Achse x rot 7 ·
    //   Spiegel (6,1,5) Achse y rot 3 · Spiegel (4,3,3) Achse y rot 2 · Spiegel (3,4,3) Achse x rot 0 ·
    //   Prisma (4,2,2) Achse y rot 4 · Spiegel (0,1,5) Achse y rot 3 · Spiegel (0,1,6) Achse x rot 1
    // Generator schwer, Seed 60879, Stand 74361c6 · Würfel „schwer“
    name: 'Timgad', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 0, y: 1, z: 0, dir: 1, color: 'magenta' },
      { type: 'source', x: 5, y: 0, z: 3, axis: 'z', dir: 5, color: 'red' },
      { type: 'source', x: 5, y: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 2, y: 4, z: 2, axis: 'x', dir: 6 },
      { type: 'mirror', x: 2, y: 1, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 6, y: 1, z: 2, rot: 0 },
      { type: 'prism', x: 2, y: 0, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 5, rot: 0 },
      { type: 'filter', x: 3, y: 1, z: 2, color: 'blue' },
      { type: 'target', x: 6, y: 2, z: 6, color: 'red' },
      { type: 'mirror', x: 4, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 0, y: 4, z: 6, color: 'magenta' },
      { type: 'blocker', x: 2, y: 4, z: 4 },
      { type: 'prism', x: 4, y: 2, z: 2, rot: 6 },
      { type: 'target', x: 2, y: 0, z: 5, color: 'blue' },
      { type: 'mirror', x: 0, y: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 1, z: 6, axis: 'x', rot: 2 },
      { type: 'target', x: 3, y: 2, z: 1, color: 'blue' },
    ],
    solution: { '2,1,2': 1, '5,2,2': 3, '3,2,3': 2, '6,1,2': 1, '2,0,3': 7, '6,1,5': 3, '4,3,3': 2, '3,4,3': 0, '4,2,2': 4, '0,1,5': 3, '0,1,6': 1 },
  },
  // Platz im Spiel: nach „Timgad“
  {
    // Lösung: Prisma (2,0,1) Achse y rot 4 · Spiegel (5,1,3) Achse y rot 1 ·
    //   Spiegel (3,1,3) Achse z rot 1 · Spiegel (4,1,0) Achse y rot 3 · Prisma (3,3,3) Achse x rot 0 ·
    //   Prisma (6,1,0) Achse y rot 2 · Spiegel (6,1,1) Achse x rot 1 · Spiegel (3,2,4) Achse z rot 0 ·
    //   Spiegel (3,3,5) Achse z rot 1 · Spiegel (6,2,1) Achse x rot 1 · Spiegel (0,0,3) Achse z rot 2
    // Generator schwer, Seed 20028, Stand 33f26f8, gesenkt um 3 · Würfel „schwer“
    name: 'Fatehpur Sikri', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 2, y: 0, z: 0, dir: 2 },
      { type: 'source', x: 5, y: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 4, y: 1, z: 6, dir: 6 },
      { type: 'prism', x: 2, y: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 5, y: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 0, rot: 2 },
      { type: 'prism', x: 3, y: 3, z: 3, axis: 'x', rot: 6 },
      { type: 'prism', x: 6, y: 1, z: 0, rot: 4 },
      { type: 'mirror', x: 6, y: 1, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 1, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 1, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 3, z: 1, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 1, y: 0, z: 0, color: 'blue' },
      { type: 'target', x: 6, y: 2, z: 4, color: 'green' },
      { type: 'target', x: 0, y: 3, z: 1, color: 'green' },
      { type: 'target', x: 3, y: 0, z: 6, color: 'magenta' },
      { type: 'target', x: 2, y: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'z', rot: 1 },
    ],
    solution: { '2,0,1': 4, '5,1,3': 1, '3,1,3': 1, '4,1,0': 3, '3,3,3': 0, '6,1,0': 2, '6,1,1': 1, '3,2,4': 0, '3,3,5': 1, '6,2,1': 1, '0,0,3': 2 },
  },
  // Platz im Spiel: nach „Fatehpur Sikri“
  {
    // Lösung: Prisma (1,1,3) Achse y rot 6 · Spiegel (6,1,3) Achse y rot 1 ·
    //   Spiegel (1,1,5) Achse y rot 3 · Prisma (2,3,3) Achse z rot 2 · Prisma (5,0,3) Achse z rot 7 ·
    //   Spiegel (6,3,5) Achse y rot 0 · Spiegel (1,2,3) Achse x rot 1 · Spiegel (6,0,3) Achse y rot 3 ·
    //   Spiegel (0,2,2) Achse y rot 2 · Spiegel (2,2,0) Achse y rot 0 ·
    //   Kombinator (5,2,3) Achse z dir 6
    // Generator schwer-sammelstelle, Seed 20518, Stand 0d0edd0, gesenkt um 2 · Würfel „schwer“
    name: 'Bagan', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, y: 1, z: 3, rot: 2 },
      { type: 'source', x: 6, y: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 6, y: 1, z: 3, rot: 3 },
      { type: 'source', x: 0, y: 1, z: 5, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 1 },
      { type: 'target', x: 1, y: 1, z: 1, color: 'green' },
      { type: 'target', x: 3, y: 1, z: 1, color: 'blue' },
      { type: 'source', x: 0, y: 0, z: 3, dir: 0 },
      { type: 'source', x: 0, y: 3, z: 3, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, y: 3, z: 3, axis: 'z', rot: 3 },
      { type: 'prism', x: 5, y: 0, z: 3, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 1, y: 2, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 4, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 1, y: 4, z: 1, color: 'green' },
      { type: 'target', x: 6, y: 0, z: 2, color: 'blue' },
      { type: 'mirror', x: 2, y: 2, z: 0, rot: 3 },
      { type: 'combiner', x: 5, y: 2, z: 3, axis: 'z', dir: 5 },
      { type: 'target', x: 5, y: 3, z: 3, color: 'magenta' },
      { type: 'blocker', x: 3, y: 3, z: 3 },
    ],
    solution: { '1,1,3': 6, '6,1,3': 1, '1,1,5': 3, '2,3,3': 2, '5,0,3': 7, '6,3,5': 0, '1,2,3': 1, '6,0,3': 3, '0,2,2': 2, '2,2,0': 0, '5,2,3': 6 },
  },
  // Platz im Spiel: nach „Bagan“
  {
    // Lösung: Spiegel (0,3,0) Achse z rot 1 · Spiegel (4,0,6) Achse y rot 0 ·
    //   Spiegel (5,0,5) Achse y rot 2 · Spiegel (0,4,0) Achse x rot 1 · Prisma (5,1,1) Achse y rot 5 ·
    //   Spiegel (4,1,0) Achse y rot 0 · Spiegel (0,1,4) Achse z rot 3 · Spiegel (5,1,0) Achse x rot 1 ·
    //   Prisma (6,0,4) Achse y rot 7 · Prisma (0,4,5) Achse x rot 7
    // Generator schwer-abschalten, Seed 70637, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Cahokia', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 6, y: 3, z: 0, dir: 4 },
      { type: 'mirror', x: 0, y: 3, z: 0, axis: 'z', rot: 2 },
      { type: 'target', x: 0, y: 0, z: 0, color: 'white' },
      { type: 'source', x: 0, y: 0, z: 2, dir: 1 },
      { type: 'mirror', x: 4, y: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 0, axis: 'x', rot: 3 },
      { type: 'source', x: 0, y: 1, z: 6, dir: 7 },
      { type: 'prism', x: 5, y: 1, z: 1, rot: 7 },
      { type: 'mirror', x: 4, y: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 0, y: 1, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 0, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 0, y: 1, z: 1, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 5, color: 'yellow' },
      { type: 'target', x: 6, y: 0, z: 0, color: 'magenta' },
      { type: 'source', x: 6, y: 0, z: 6, dir: 5 },
      { type: 'prism', x: 6, y: 0, z: 4, rot: 4 },
      { type: 'prism', x: 0, y: 4, z: 5, axis: 'x', rot: 3 },
      { type: 'target', x: 0, y: 4, z: 6, color: 'blue' },
    ],
    solution: { '0,3,0': 1, '4,0,6': 0, '5,0,5': 2, '0,4,0': 1, '5,1,1': 5, '4,1,0': 0, '0,1,4': 3, '5,1,0': 1, '6,0,4': 7, '0,4,5': 7 },
  },
  // Platz im Spiel: nach „Cahokia“
  {
    // Lösung: Prisma (1,3,2) Achse y rot 3 · Prisma (5,3,5) Achse y rot 4 ·
    //   Prisma (4,4,1) Achse y rot 7 · Spiegel (0,3,5) Achse y rot 1 · Spiegel (6,4,1) Achse z rot 1 ·
    //   Spiegel (6,0,1) Achse z rot 3 · Spiegel (4,3,6) Achse x rot 2 · Spiegel (3,0,0) Achse y rot 1 ·
    //   Spiegel (2,0,0) Achse y rot 3 · Spiegel (2,0,4) Achse x rot 1
    // Generator schwer-sammelstelle, Seed 21038, Stand 0d0edd0, gesenkt um 0 · Würfel „schwer“
    name: 'Schlossanlage', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, y: 3, z: 2, rot: 4 },
      { type: 'source', x: 5, y: 3, z: 6, dir: 5, color: 'cyan' },
      { type: 'source', x: 6, y: 3, z: 2, dir: 4, color: 'red' },
      { type: 'target', x: 0, y: 3, z: 2, color: 'cyan' },
      { type: 'target', x: 1, y: 3, z: 6, color: 'red' },
      { type: 'source', x: 6, y: 3, z: 6, dir: 5 },
      { type: 'prism', x: 5, y: 3, z: 5, rot: 3 },
      { type: 'target', x: 2, y: 3, z: 4, color: 'magenta' },
      { type: 'source', x: 0, y: 4, z: 5, dir: 7 },
      { type: 'prism', x: 4, y: 4, z: 1, rot: 4 },
      { type: 'mirror', x: 0, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'x', rot: 0 },
      { type: 'target', x: 5, y: 4, z: 0, color: 'green' },
      { type: 'mirror', x: 3, y: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'x', rot: 0 },
      { type: 'target', x: 4, y: 4, z: 0, color: 'red' },
    ],
    solution: { '1,3,2': 3, '5,3,5': 4, '4,4,1': 7, '0,3,5': 1, '6,4,1': 1, '6,0,1': 3, '4,3,6': 2, '3,0,0': 1, '2,0,0': 3, '2,0,4': 1 },
  },
  // Platz im Spiel: nach „Schlossanlage“
  {
    // Lösung: Spiegel (3,3,2) Achse z rot 1 · Spiegel (5,1,4) Achse x rot 3 ·
    //   Prisma (3,2,4) Achse x rot 0 · Prisma (5,3,4) Achse x rot 4 · Prisma (2,3,1) Achse y rot 7 ·
    //   Spiegel (3,2,6) Achse x rot 3 · Spiegel (5,3,1) Achse y rot 3 ·
    //   Kombinator (3,0,6) Achse y dir 0 · Spiegel (5,4,3) Achse z rot 0 ·
    //   Spiegel (5,3,0) Achse x rot 1
    // Generator schwer, Seed 70061, Ziel 74–86, Stand 4ef5157 · Würfel „schwer“
    name: 'Kilwa', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'source', x: 5, y: 1, z: 6, dir: 6 },
      { type: 'source', x: 3, y: 4, z: 2, axis: 'x', dir: 7 },
      { type: 'source', x: 3, y: 0, z: 5, axis: 'x', dir: 3 },
      { type: 'mirror', x: 3, y: 3, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 4, axis: 'x', rot: 0 },
      { type: 'prism', x: 3, y: 2, z: 4, axis: 'x', rot: 5 },
      { type: 'prism', x: 5, y: 3, z: 4, axis: 'x', rot: 5 },
      { type: 'prism', x: 2, y: 3, z: 1, rot: 5 },
      { type: 'mirror', x: 5, y: 1, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 3, y: 3, z: 0, color: 'green' },
      { type: 'target', x: 4, y: 0, z: 2, color: 'white' },
      { type: 'mirror', x: 3, y: 2, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 1, rot: 0 },
      { type: 'combiner', x: 3, y: 0, z: 6, dir: 7 },
      { type: 'mirror', x: 4, y: 0, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 3, y: 4, z: 6, color: 'blue' },
      { type: 'mirror', x: 5, y: 4, z: 3, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 1, z: 0, color: 'magenta' },
      { type: 'mirror', x: 5, y: 3, z: 0, axis: 'x', rot: 2 },
      { type: 'target', x: 6, y: 3, z: 1, color: 'green' },
    ],
    solution: { '3,3,2': 1, '5,1,4': 3, '3,2,4': 0, '5,3,4': 4, '2,3,1': 7, '3,2,6': 3, '5,3,1': 3, '3,0,6': 0, '5,4,3': 0, '5,3,0': 1 },
  },
  // Platz im Spiel: nach „Kilwa“
  {
    // Lösung: Prisma (3,0,2) Achse y rot 3 · Spiegel (4,0,2) Achse y rot 1 ·
    //   Spiegel (1,0,0) Achse y rot 0 · Prisma (3,3,5) Achse y rot 3 · Spiegel (6,4,6) Achse z rot 1 ·
    //   Spiegel (1,1,5) Achse y rot 1 · Spiegel (2,3,6) Achse y rot 0 · Spiegel (1,3,5) Achse z rot 3 ·
    //   Spiegel (1,1,2) Achse x rot 3 · Spiegel (1,3,2) Achse x rot 1 · Prisma (1,3,4) Achse y rot 2
    // Generator schwer-sammelstelle, Seed 60870, Stand 74361c6 · Würfel „schwer“
    name: 'Pergamon', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, y: 0, z: 2, rot: 1 },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 2 },
      { type: 'source', x: 0, y: 0, z: 1, dir: 7, color: 'blue' },
      { type: 'mirror', x: 1, y: 0, z: 0, rot: 3 },
      { type: 'target', x: 3, y: 0, z: 5, color: 'red' },
      { type: 'target', x: 1, y: 0, z: 2, color: 'cyan' },
      { type: 'source', x: 0, y: 4, z: 6, dir: 0 },
      { type: 'source', x: 6, y: 3, z: 5, dir: 4 },
      { type: 'prism', x: 3, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 6, y: 1, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 2, y: 3, z: 5, color: 'magenta' },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 1, y: 3, z: 5, axis: 'z', rot: 0 },
      { type: 'target', x: 3, y: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 1, y: 1, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 2, axis: 'x', rot: 2 },
      { type: 'prism', x: 1, y: 3, z: 4, rot: 7 },
      { type: 'target', x: 0, y: 3, z: 5, color: 'blue' },
    ],
    solution: { '3,0,2': 3, '4,0,2': 1, '1,0,0': 0, '3,3,5': 3, '6,4,6': 1, '1,1,5': 1, '2,3,6': 0, '1,3,5': 3, '1,1,2': 3, '1,3,2': 1, '1,3,4': 2 },
  },
  // Platz im Spiel: nach „Pergamon“
  {
    // Lösung: Prisma (1,4,4) Achse y rot 6 · Spiegel (0,4,5) Achse y rot 2 ·
    //   Spiegel (6,4,4) Achse y rot 1 · Spiegel (2,3,1) Achse z rot 2 · Spiegel (5,0,4) Achse y rot 3 ·
    //   Spiegel (3,4,1) Achse x rot 1 · Prisma (5,4,3) Achse y rot 3 · Prisma (5,0,3) Achse y rot 0 ·
    //   Spiegel (2,4,6) Achse x rot 2 · Spiegel (6,0,6) Achse y rot 3 · Spiegel (6,0,3) Achse y rot 1
    // Generator schwer-sammelstelle, Seed 60235, Stand 74361c6 · Würfel „schwer“
    name: 'Bamiyan', dim: 3, size: 7, height: 5, grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, y: 4, z: 4, rot: 2 },
      { type: 'source', x: 1, y: 4, z: 6, dir: 5, color: 'red' },
      { type: 'mirror', x: 0, y: 4, z: 5, rot: 3 },
      { type: 'source', x: 6, y: 4, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 6, y: 4, z: 4, rot: 3 },
      { type: 'target', x: 0, y: 4, z: 3, color: 'magenta' },
      { type: 'target', x: 1, y: 4, z: 0, color: 'green' },
      { type: 'source', x: 5, y: 0, z: 1, axis: 'z', dir: 5 },
      { type: 'source', x: 0, y: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'prism', x: 5, y: 4, z: 3, rot: 7 },
      { type: 'prism', x: 5, y: 0, z: 3, rot: 5 },
      { type: 'mirror', x: 2, y: 4, z: 6, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 4, z: 5, rot: 0, fixed: true },
      { type: 'target', x: 5, y: 4, z: 6, color: 'yellow' },
      { type: 'target', x: 0, y: 4, z: 6, color: 'green' },
      { type: 'mirror', x: 6, y: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'z', rot: 1, fixed: true },
    ],
    solution: { '1,4,4': 6, '0,4,5': 2, '6,4,4': 1, '2,3,1': 2, '5,0,4': 3, '3,4,1': 1, '5,4,3': 3, '5,0,3': 0, '2,4,6': 2, '6,0,6': 3, '6,0,3': 1 },
  },
  // Platz im Spiel: nach „Bamiyan“
  {
    // Lösung: Prisma (2,0,4) Achse y rot 0 · Spiegel (4,0,2) Achse y rot 2 ·
    //   Spiegel (3,0,5) Achse y rot 0 · Spiegel (4,0,4) Achse y rot 0 · Spiegel (5,0,5) Achse x rot 1 ·
    //   Spiegel (6,1,5) Achse y rot 3 · Spiegel (6,3,3) Achse x rot 0 · Spiegel (6,2,2) Achse z rot 0 ·
    //   Spiegel (3,4,3) Achse z rot 3 · Prisma (3,3,4) Achse x rot 5 · Spiegel (3,3,2) Achse y rot 3 ·
    //   Prisma (5,1,2) Achse z rot 0 · Spiegel (6,3,2) Achse z rot 3 · Spiegel (6,1,2) Achse y rot 1
    // Generator sehr schwer-falle, Seed 21454, Stand 33f26f8, gesenkt um 2 · Würfel „sehr schwer“
    name: 'Möbiusband', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, y: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, y: 0, z: 4, rot: 4 },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 1 },
      { type: 'target', x: 2, y: 0, z: 0, color: 'red' },
      { type: 'mirror', x: 3, y: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 2, axis: 'z', rot: 3 },
      { type: 'target', x: 6, y: 3, z: 1, color: 'blue' },
      { type: 'source', x: 6, y: 4, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 3, y: 4, z: 3, axis: 'z', rot: 0 },
      { type: 'source', x: 3, y: 4, z: 5, axis: 'x', dir: 5 },
      { type: 'prism', x: 3, y: 3, z: 4, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 3, z: 2, rot: 1 },
      { type: 'prism', x: 5, y: 1, z: 2, axis: 'z', rot: 4 },
      { type: 'target', x: 6, y: 0, z: 2, color: 'blue' },
      { type: 'mirror', x: 6, y: 3, z: 2, axis: 'z', rot: 0 },
      { type: 'target', x: 6, y: 4, z: 2, color: 'red' },
      { type: 'mirror', x: 6, y: 1, z: 2, rot: 2 },
      { type: 'target', x: 1, y: 1, z: 5, color: 'green' },
    ],
    solution: { '2,0,4': 0, '4,0,2': 2, '3,0,5': 0, '4,0,4': 0, '5,0,5': 1, '6,1,5': 3, '6,3,3': 0, '6,2,2': 0, '3,4,3': 3, '3,3,4': 5, '3,3,2': 3, '5,1,2': 0, '6,3,2': 3, '6,1,2': 1 },
  },
  // Platz im Spiel: nach „Möbiusband“
  {
    // Lösung: Spiegel (0,0,3) Achse y rot 1 · Spiegel (4,0,3) Achse y rot 1 ·
    //   Spiegel (4,0,5) Achse y rot 1 · Spiegel (0,0,5) Achse y rot 3 · Spiegel (5,3,5) Achse y rot 3 ·
    //   Spiegel (6,3,5) Achse z rot 1 · Prisma (5,0,3) Achse y rot 3 · Spiegel (5,0,6) Achse y rot 1 ·
    //   Spiegel (1,1,6) Achse y rot 1 · Spiegel (1,1,3) Achse x rot 3 · Spiegel (1,4,3) Achse z rot 1 ·
    //   Spiegel (0,4,3) Achse y rot 3 · Spiegel (0,4,5) Achse x rot 3 · Spiegel (0,3,5) Achse x rot 3
    // Generator sehr schwer-abzaehlen, Seed 22321, Stand 33f26f8, gesenkt um 0 · Würfel „sehr schwer“
    name: 'Peano', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 0, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 2 },
      { type: 'source', x: 0, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 6, y: 0, z: 3, dir: 4, color: 'magenta' },
      { type: 'target', x: 4, y: 0, z: 2, color: 'blue' },
      { type: 'target', x: 0, y: 0, z: 6, color: 'blue' },
      { type: 'target', x: 6, y: 0, z: 5, color: 'white' },
      { type: 'source', x: 5, y: 3, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 5, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 5, axis: 'z', rot: 3 },
      { type: 'prism', x: 5, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 6, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 1, z: 6, axis: 'z', rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 5, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 3, z: 6, color: 'red' },
    ],
    solution: { '0,0,3': 1, '4,0,3': 1, '4,0,5': 1, '0,0,5': 3, '5,3,5': 3, '6,3,5': 1, '5,0,3': 3, '5,0,6': 1, '1,1,6': 1, '1,1,3': 3, '1,4,3': 1, '0,4,3': 3, '0,4,5': 3, '0,3,5': 3 },
  },
  // Platz im Spiel: nach „Peano“
  {
    // Lösung: Prisma (4,0,1) Achse y rot 7 · Spiegel (5,0,2) Achse y rot 0 ·
    //   Spiegel (2,0,5) Achse y rot 1 · Prisma (3,0,5) Achse y rot 6 · Spiegel (1,0,4) Achse x rot 1 ·
    //   Prisma (1,1,4) Achse z rot 5 · Spiegel (3,0,0) Achse x rot 3 · Spiegel (3,3,0) Achse z rot 1 ·
    //   Spiegel (6,0,2) Achse z rot 2 · Spiegel (0,2,4) Achse y rot 1 · Spiegel (1,4,1) Achse x rot 2 ·
    //   Spiegel (1,3,4) Achse x rot 3
    // Generator sehr schwer-sammelstelle, Seed 20948, Stand 33f26f8, gesenkt um 2 · Würfel „sehr schwer“
    name: 'Ikosaeder', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, y: 0, z: 1, rot: 4 },
      { type: 'source', x: 4, y: 0, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, y: 0, z: 1, dir: 3, color: 'green' },
      { type: 'mirror', x: 5, y: 0, z: 2, rot: 2 },
      { type: 'target', x: 4, y: 0, z: 0, color: 'magenta' },
      { type: 'target', x: 5, y: 0, z: 0, color: 'green' },
      { type: 'source', x: 1, y: 0, z: 0, dir: 2 },
      { type: 'source', x: 2, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 2, y: 0, z: 5, rot: 3 },
      { type: 'prism', x: 3, y: 0, z: 5, rot: 4 },
      { type: 'mirror', x: 1, y: 0, z: 4, axis: 'x', rot: 3 },
      { type: 'prism', x: 1, y: 1, z: 4, axis: 'z', rot: 7 },
      { type: 'mirror', x: 3, y: 0, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 0, axis: 'z', rot: 0 },
      { type: 'target', x: 1, y: 3, z: 0, color: 'cyan' },
      { type: 'mirror', x: 6, y: 0, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 0, y: 4, z: 2, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 1, y: 4, z: 1, axis: 'x', rot: 1 },
      { type: 'target', x: 4, y: 4, z: 4, color: 'green' },
      { type: 'mirror', x: 1, y: 3, z: 4, axis: 'x', rot: 2 },
    ],
    solution: { '4,0,1': 7, '5,0,2': 0, '2,0,5': 1, '3,0,5': 6, '1,0,4': 1, '1,1,4': 5, '3,0,0': 3, '3,3,0': 1, '6,0,2': 2, '0,2,4': 1, '1,4,1': 2, '1,3,4': 3 },
  },
  // Platz im Spiel: nach „Ikosaeder“
  {
    // Lösung: Spiegel (3,3,2) Achse y rot 1 · Spiegel (1,3,2) Achse y rot 1 ·
    //   Spiegel (1,3,4) Achse y rot 1 · Spiegel (3,3,4) Achse y rot 1 · Spiegel (3,0,3) Achse z rot 1 ·
    //   Spiegel (3,2,3) Achse z rot 1 · Spiegel (0,2,6) Achse y rot 1 · Spiegel (5,2,6) Achse z rot 3 ·
    //   Spiegel (5,3,6) Achse x rot 3 · Prisma (3,3,1) Achse y rot 1 · Spiegel (5,3,1) Achse y rot 3 ·
    //   Spiegel (5,3,0) Achse y rot 1 · Spiegel (4,3,0) Achse y rot 3 · Spiegel (4,3,5) Achse y rot 1
    // Generator sehr schwer-abzaehlen, Seed 21994, Stand 33f26f8, gesenkt um 3 · Würfel „sehr schwer“
    name: 'Banach-Tarski', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, y: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 1, y: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 1, y: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 3, z: 4, rot: 3 },
      { type: 'source', x: 6, y: 3, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 3, y: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, y: 3, z: 2, dir: 0, color: 'blue' },
      { type: 'target', x: 5, y: 3, z: 2, color: 'cyan' },
      { type: 'target', x: 3, y: 3, z: 5, color: 'blue' },
      { type: 'target', x: 1, y: 3, z: 1, color: 'magenta' },
      { type: 'source', x: 6, y: 0, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 2, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 0, y: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 6, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 3, z: 6, axis: 'x', rot: 1 },
      { type: 'prism', x: 3, y: 3, z: 1, rot: 4 },
      { type: 'mirror', x: 5, y: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 5, rot: 0 },
      { type: 'target', x: 6, y: 3, z: 5, color: 'red' },
    ],
    solution: { '3,3,2': 1, '1,3,2': 1, '1,3,4': 1, '3,3,4': 1, '3,0,3': 1, '3,2,3': 1, '0,2,6': 1, '5,2,6': 3, '5,3,6': 3, '3,3,1': 1, '5,3,1': 3, '5,3,0': 1, '4,3,0': 3, '4,3,5': 1 },
  },
  // Platz im Spiel: nach „Banach-Tarski“
  {
    // Lösung: Prisma (4,4,3) Achse y rot 1 · Spiegel (3,4,2) Achse y rot 2 ·
    //   Spiegel (5,0,2) Achse x rot 0 · Spiegel (5,2,0) Achse y rot 1 · Prisma (4,3,0) Achse z rot 6 ·
    //   Spiegel (4,4,4) Achse x rot 3 · Spiegel (4,0,4) Achse z rot 3 · Spiegel (3,4,0) Achse x rot 1 ·
    //   Spiegel (0,4,3) Achse z rot 2 · Spiegel (3,4,6) Achse x rot 2 · Spiegel (2,0,6) Achse y rot 3 ·
    //   Spiegel (1,0,6) Achse y rot 1 · Spiegel (1,0,5) Achse y rot 1 · Spiegel (0,0,5) Achse y rot 3
    // Generator sehr schwer-sammelstelle, Seed 62574, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Potenzreihe', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, y: 4, z: 3, rot: 2 },
      { type: 'source', x: 1, y: 4, z: 6, dir: 7, color: 'cyan' },
      { type: 'source', x: 5, y: 4, z: 0, dir: 3, color: 'red' },
      { type: 'mirror', x: 3, y: 4, z: 2, rot: 3 },
      { type: 'target', x: 5, y: 4, z: 4, color: 'yellow' },
      { type: 'target', x: 5, y: 4, z: 3, color: 'red' },
      { type: 'source', x: 5, y: 4, z: 6, axis: 'x', dir: 5 },
      { type: 'mirror', x: 5, y: 0, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 0, rot: 3 },
      { type: 'prism', x: 4, y: 3, z: 0, axis: 'z', rot: 5 },
      { type: 'mirror', x: 4, y: 4, z: 4, axis: 'x', rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 3, y: 4, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 6, rot: 1 },
      { type: 'mirror', x: 1, y: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 1 },
      { type: 'target', x: 0, y: 0, z: 6, color: 'blue' },
      { type: 'target', x: 4, y: 4, z: 0, color: 'green' },
    ],
    solution: { '4,4,3': 1, '3,4,2': 2, '5,0,2': 0, '5,2,0': 1, '4,3,0': 6, '4,4,4': 3, '4,0,4': 3, '3,4,0': 1, '0,4,3': 2, '3,4,6': 2, '2,0,6': 3, '1,0,6': 1, '1,0,5': 1, '0,0,5': 3 },
  },
  // Platz im Spiel: nach „Potenzreihe“
  {
    // Lösung: Prisma (1,1,4) Achse z rot 6 · Spiegel (4,4,4) Achse x rot 3 ·
    //   Spiegel (6,4,2) Achse z rot 1 · Spiegel (6,3,1) Achse x rot 0 · Prisma (4,4,1) Achse x rot 0 ·
    //   Spiegel (4,1,4) Achse z rot 1 · Spiegel (1,4,4) Achse z rot 1 · Spiegel (5,1,5) Achse z rot 1 ·
    //   Spiegel (0,4,4) Achse y rot 3 · Spiegel (0,2,4) Achse y rot 2 · Spiegel (0,4,5) Achse x rot 3 ·
    //   Spiegel (0,0,5) Achse x rot 1 · Spiegel (0,0,0) Achse y rot 3 · Spiegel (2,4,4) Achse x rot 0
    // Generator sehr schwer, Seed 61836, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Kowalewskaja', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, y: 0, z: 1, axis: 'x', dir: 2 },
      { type: 'source', x: 2, y: 0, z: 4, axis: 'z', dir: 5 },
      { type: 'prism', x: 1, y: 1, z: 4, axis: 'z', rot: 7 },
      { type: 'mirror', x: 4, y: 4, z: 4, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'x', rot: 3 },
      { type: 'prism', x: 4, y: 4, z: 1, axis: 'x', rot: 4 },
      { type: 'mirror', x: 4, y: 1, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 0, y: 4, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 0, rot: 2 },
      { type: 'target', x: 5, y: 1, z: 4, color: 'yellow' },
      { type: 'target', x: 5, y: 0, z: 6, color: 'red' },
      { type: 'target', x: 6, y: 0, z: 0, color: 'green' },
      { type: 'target', x: 6, y: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 2, y: 4, z: 4, axis: 'x', rot: 1 },
    ],
    solution: { '1,1,4': 6, '4,4,4': 3, '6,4,2': 1, '6,3,1': 0, '4,4,1': 0, '4,1,4': 1, '1,4,4': 1, '5,1,5': 1, '0,4,4': 3, '0,2,4': 2, '0,4,5': 3, '0,0,5': 1, '0,0,0': 3, '2,4,4': 0 },
  },
  // Platz im Spiel: nach „Kowalewskaja“
  {
    // Lösung: Prisma (3,4,1) Achse y rot 6 · Spiegel (1,4,3) Achse y rot 0 ·
    //   Prisma (4,1,4) Achse y rot 6 · Spiegel (1,1,1) Achse z rot 3 · Spiegel (4,1,1) Achse x rot 1 ·
    //   Spiegel (6,1,2) Achse z rot 3 · Spiegel (6,2,1) Achse z rot 1 · Spiegel (5,2,0) Achse y rot 0 ·
    //   Spiegel (3,2,2) Achse x rot 1 · Spiegel (3,4,0) Achse x rot 1 · Spiegel (3,1,0) Achse z rot 3 ·
    //   Spiegel (1,1,0) Achse z rot 1 · Spiegel (1,4,0) Achse x rot 1 · Spiegel (4,0,1) Achse x rot 1
    // Generator sehr schwer-sammelstelle, Seed 62625, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Fakultät', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, y: 4, z: 1, rot: 1 },
      { type: 'source', x: 6, y: 4, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, y: 4, z: 2, dir: 1, color: 'blue' },
      { type: 'mirror', x: 1, y: 4, z: 3, rot: 1 },
      { type: 'target', x: 2, y: 4, z: 0, color: 'red' },
      { type: 'target', x: 4, y: 4, z: 0, color: 'blue' },
      { type: 'source', x: 4, y: 1, z: 6, dir: 6 },
      { type: 'prism', x: 4, y: 1, z: 4, rot: 4 },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 1, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 1, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 1, axis: 'z', rot: 3 },
      { type: 'mirror', x: 5, y: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 2, axis: 'x', rot: 2 },
      { type: 'target', x: 1, y: 4, z: 2, color: 'cyan' },
      { type: 'target', x: 1, y: 0, z: 0, color: 'red' },
      { type: 'mirror', x: 3, y: 4, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 1, axis: 'x', rot: 2 },
      { type: 'target', x: 4, y: 0, z: 0, color: 'green' },
    ],
    solution: { '3,4,1': 6, '1,4,3': 0, '4,1,4': 6, '1,1,1': 3, '4,1,1': 1, '6,1,2': 3, '6,2,1': 1, '5,2,0': 0, '3,2,2': 1, '3,4,0': 1, '3,1,0': 3, '1,1,0': 1, '1,4,0': 1, '4,0,1': 1 },
  },
  // Platz im Spiel: nach „Fakultät“
  {
    // Lösung: Spiegel (4,4,5) Achse y rot 1 · Spiegel (4,4,2) Achse y rot 1 ·
    //   Spiegel (1,4,2) Achse y rot 1 · Spiegel (1,4,5) Achse y rot 3 · Spiegel (3,1,3) Achse y rot 3 ·
    //   Spiegel (2,1,3) Achse z rot 1 · Spiegel (2,4,3) Achse x rot 1 · Spiegel (2,4,4) Achse y rot 1 ·
    //   Spiegel (3,4,4) Achse y rot 3 · Spiegel (3,4,0) Achse y rot 1 · Prisma (4,4,1) Achse y rot 3 ·
    //   Spiegel (0,4,1) Achse y rot 1 · Spiegel (0,4,0) Achse x rot 1 · Spiegel (0,0,0) Achse x rot 3
    // Generator sehr schwer-abzaehlen, Seed 22515, Stand 1df6ca5, gesenkt um 2 · Würfel „sehr schwer“
    name: 'Gauss', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 4, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 5, rot: 2 },
      { type: 'source', x: 4, y: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, y: 4, z: 5, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, y: 4, z: 2, dir: 0, color: 'red' },
      { type: 'target', x: 0, y: 4, z: 5, color: 'red' },
      { type: 'target', x: 1, y: 4, z: 0, color: 'white' },
      { type: 'target', x: 6, y: 4, z: 2, color: 'red' },
      { type: 'source', x: 3, y: 1, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 3, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 3, y: 4, z: 0, rot: 0 },
      { type: 'prism', x: 4, y: 4, z: 1, rot: 5 },
      { type: 'mirror', x: 0, y: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 0, z: 0, axis: 'x', rot: 1 },
      { type: 'target', x: 0, y: 0, z: 5, color: 'blue' },
    ],
    solution: { '4,4,5': 1, '4,4,2': 1, '1,4,2': 1, '1,4,5': 3, '3,1,3': 3, '2,1,3': 1, '2,4,3': 1, '2,4,4': 1, '3,4,4': 3, '3,4,0': 1, '4,4,1': 3, '0,4,1': 1, '0,4,0': 1, '0,0,0': 3 },
  },
  // Platz im Spiel: nach „Gauss“
  {
    // Lösung: Spiegel (1,0,5) Achse y rot 1 · Spiegel (1,0,3) Achse y rot 1 ·
    //   Spiegel (3,0,3) Achse y rot 3 · Spiegel (3,0,5) Achse y rot 1 · Spiegel (1,3,5) Achse y rot 1 ·
    //   Spiegel (1,3,6) Achse x rot 3 · Prisma (5,0,3) Achse y rot 4 · Spiegel (4,0,2) Achse x rot 3 ·
    //   Spiegel (4,2,2) Achse z rot 0 · Spiegel (5,1,2) Achse z rot 0 · Spiegel (6,3,1) Achse z rot 1 ·
    //   Spiegel (5,3,0) Achse y rot 0 · Spiegel (4,3,1) Achse z rot 2 · Spiegel (5,3,2) Achse y rot 2
    // Generator sehr schwer-abzaehlen, Seed 22076, Stand 33f26f8, gesenkt um 2 · Würfel „sehr schwer“
    name: 'Hardy', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 1, y: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 3, y: 0, z: 5, rot: 3 },
      { type: 'source', x: 3, y: 0, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'green' },
      { type: 'source', x: 6, y: 0, z: 3, dir: 4 },
      { type: 'target', x: 0, y: 0, z: 3, color: 'yellow' },
      { type: 'target', x: 1, y: 0, z: 6, color: 'cyan' },
      { type: 'target', x: 5, y: 0, z: 5, color: 'green' },
      { type: 'source', x: 0, y: 3, z: 5, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 1, y: 3, z: 6, axis: 'x', rot: 2 },
      { type: 'prism', x: 5, y: 0, z: 3, rot: 6 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 3, y: 1, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 4, y: 2, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 2, axis: 'z', rot: 3 },
      { type: 'mirror', x: 6, y: 2, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 4, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 2, rot: 1 },
      { type: 'target', x: 0, y: 2, z: 6, color: 'blue' },
    ],
    solution: { '1,0,5': 1, '1,0,3': 1, '3,0,3': 3, '3,0,5': 1, '1,3,5': 1, '1,3,6': 3, '5,0,3': 4, '4,0,2': 3, '4,2,2': 0, '5,1,2': 0, '6,3,1': 1, '5,3,0': 0, '4,3,1': 2, '5,3,2': 2 },
  },
  // Platz im Spiel: nach „Hardy“
  {
    // Lösung: Prisma (1,0,3) Achse y rot 5 · Spiegel (6,3,4) Achse y rot 3 ·
    //   Spiegel (1,4,3) Achse y rot 1 · Spiegel (0,0,3) Achse z rot 1 · Spiegel (6,3,3) Achse x rot 1 ·
    //   Spiegel (1,4,2) Achse y rot 3 · Spiegel (6,4,2) Achse y rot 3 · Spiegel (0,2,3) Achse x rot 3 ·
    //   Spiegel (6,4,1) Achse x rot 1 · Spiegel (6,0,1) Achse y rot 1 · Spiegel (6,3,1) Achse x rot 1 ·
    //   Spiegel (6,3,0) Achse y rot 1 · Spiegel (0,2,2) Achse y rot 3 · Prisma (6,0,3) Achse x rot 4
    // Generator sehr schwer-sammelstelle, Seed 62877, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Aleph', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, y: 0, z: 3, rot: 4 },
      { type: 'source', x: 1, y: 0, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, y: 0, z: 4, dir: 7, color: 'blue' },
      { type: 'target', x: 0, y: 0, z: 2, color: 'green' },
      { type: 'target', x: 1, y: 0, z: 1, color: 'cyan' },
      { type: 'source', x: 6, y: 4, z: 3, dir: 4, color: 'blue' },
      { type: 'source', x: 0, y: 3, z: 4, dir: 0 },
      { type: 'mirror', x: 6, y: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 1, y: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 6, y: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 0, y: 2, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'x', rot: 3 },
      { type: 'mirror', x: 6, y: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 0, y: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 0, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 2, y: 2, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 2, y: 2, z: 1, color: 'red' },
      { type: 'prism', x: 6, y: 0, z: 3, axis: 'x', rot: 1 },
      { type: 'target', x: 5, y: 4, z: 0, color: 'red' },
      { type: 'target', x: 0, y: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,0,3': 5, '6,3,4': 3, '1,4,3': 1, '0,0,3': 1, '6,3,3': 1, '1,4,2': 3, '6,4,2': 3, '0,2,3': 3, '6,4,1': 1, '6,0,1': 1, '6,3,1': 1, '6,3,0': 1, '0,2,2': 3, '6,0,3': 4 },
  },
  // Platz im Spiel: nach „Aleph“
  {
    // Lösung: Prisma (3,2,1) Achse y rot 0 · Spiegel (2,2,2) Achse y rot 0 ·
    //   Spiegel (5,2,3) Achse z rot 3 · Spiegel (5,3,4) Achse y rot 0 · Spiegel (5,4,3) Achse x rot 0 ·
    //   Spiegel (5,1,0) Achse y rot 1 · Prisma (4,1,3) Achse x rot 4 · Spiegel (4,1,2) Achse y rot 3 ·
    //   Spiegel (4,3,1) Achse x rot 2 · Spiegel (4,0,2) Achse z rot 0 · Spiegel (6,1,2) Achse z rot 3 ·
    //   Spiegel (4,4,2) Achse z rot 1 · Spiegel (2,4,4) Achse z rot 2 · Spiegel (3,4,5) Achse z rot 1
    // Generator sehr schwer-sammelstelle, Seed 62977, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Lemniskate', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, y: 2, z: 1, rot: 1 },
      { type: 'source', x: 0, y: 2, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 2, y: 2, z: 2, rot: 2 },
      { type: 'source', x: 3, y: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 4, y: 2, z: 0, color: 'magenta' },
      { type: 'target', x: 6, y: 2, z: 1, color: 'green' },
      { type: 'mirror', x: 5, y: 2, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 5, y: 4, z: 3, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 0, axis: 'x', rot: 3, fixed: true },
      { type: 'mirror', x: 3, y: 0, z: 1, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 0, y: 3, z: 1, color: 'blue' },
      { type: 'source', x: 4, y: 0, z: 3, axis: 'x', dir: 2 },
      { type: 'prism', x: 4, y: 1, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 6, y: 1, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 3, y: 4, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 6, y: 3, z: 2, color: 'green' },
      { type: 'target', x: 3, y: 3, z: 6, color: 'red' },
    ],
    solution: { '3,2,1': 0, '2,2,2': 0, '5,2,3': 3, '5,3,4': 0, '5,4,3': 0, '5,1,0': 1, '4,1,3': 4, '4,1,2': 3, '4,3,1': 2, '4,0,2': 0, '6,1,2': 3, '4,4,2': 1, '2,4,4': 2, '3,4,5': 1 },
  },
  // Platz im Spiel: nach „Lemniskate“
  {
    // Lösung: Prisma (5,0,2) Achse y rot 2 · Spiegel (4,0,2) Achse y rot 1 ·
    //   Prisma (2,3,2) Achse y rot 4 · Spiegel (2,2,2) Achse y rot 1 · Spiegel (5,0,3) Achse x rot 1 ·
    //   Prisma (2,2,3) Achse x rot 1 · Spiegel (5,1,3) Achse x rot 1 · Spiegel (5,1,6) Achse x rot 1 ·
    //   Spiegel (2,2,5) Achse x rot 3 · Spiegel (1,3,3) Achse y rot 2 ·
    //   Kombinator (2,4,5) Achse z dir 1 · Spiegel (3,3,5) Achse x rot 3
    // Generator sehr schwer-sammelstelle, Seed 21928, Stand 33f26f8, gesenkt um 1 · Würfel „sehr schwer“
    name: 'Ewige Wiederkehr', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, y: 0, z: 2, rot: 6 },
      { type: 'source', x: 6, y: 0, z: 1, dir: 3, color: 'red' },
      { type: 'source', x: 4, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 4, y: 0, z: 2, rot: 2 },
      { type: 'target', x: 6, y: 0, z: 3, color: 'red' },
      { type: 'target', x: 2, y: 0, z: 5, color: 'magenta' },
      { type: 'source', x: 0, y: 2, z: 2, dir: 0 },
      { type: 'source', x: 2, y: 3, z: 6, dir: 6 },
      { type: 'prism', x: 2, y: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 2, y: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 5, y: 0, z: 3, axis: 'x', rot: 3 },
      { type: 'prism', x: 2, y: 2, z: 3, axis: 'x', rot: 6 },
      { type: 'mirror', x: 5, y: 1, z: 3, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 6, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 2, z: 5, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 4, z: 3, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 5, y: 4, z: 6, color: 'green' },
      { type: 'mirror', x: 1, y: 3, z: 3, rot: 0 },
      { type: 'target', x: 4, y: 3, z: 6, color: 'cyan' },
      { type: 'combiner', x: 2, y: 4, z: 5, axis: 'z', dir: 2 },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 4, y: 2, z: 5, axis: 'x', rot: 0, fixed: true },
      { type: 'target', x: 6, y: 4, z: 5, color: 'red' },
      { type: 'blocker', x: 2, y: 1, z: 4 },
    ],
    solution: { '5,0,2': 2, '4,0,2': 1, '2,3,2': 4, '2,2,2': 1, '5,0,3': 1, '2,2,3': 1, '5,1,3': 1, '5,1,6': 1, '2,2,5': 3, '1,3,3': 2, '2,4,5': 1, '3,3,5': 3 },
  },
  // Platz im Spiel: nach „Ewige Wiederkehr“
  {
    // Lösung: Spiegel (5,3,4) Achse x rot 1 · Prisma (5,3,1) Achse x rot 4 ·
    //   Prisma (1,3,1) Achse z rot 5 · Prisma (3,3,6) Achse y rot 4 · Spiegel (1,3,4) Achse x rot 3 ·
    //   Spiegel (0,3,1) Achse y rot 3 · Spiegel (0,3,5) Achse x rot 1 · Spiegel (0,4,5) Achse z rot 3 ·
    //   Spiegel (1,4,1) Achse x rot 3 · Spiegel (1,4,0) Achse y rot 3 · Spiegel (1,3,6) Achse y rot 1 ·
    //   Spiegel (1,4,4) Achse z rot 3 · Spiegel (2,4,4) Achse y rot 1 · Spiegel (2,4,5) Achse y rot 1
    // Generator sehr schwer, Seed 61912, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Chaos', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, y: 2, z: 4, axis: 'z', dir: 5 },
      { type: 'source', x: 1, y: 0, z: 1, axis: 'x', dir: 2 },
      { type: 'source', x: 5, y: 4, z: 1, axis: 'x', dir: 6 },
      { type: 'mirror', x: 5, y: 3, z: 4, axis: 'x', rot: 0 },
      { type: 'prism', x: 5, y: 3, z: 1, axis: 'x', rot: 5 },
      { type: 'prism', x: 1, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'prism', x: 3, y: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 1, y: 3, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 0, y: 3, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 4, z: 5, axis: 'z', rot: 2 },
      { type: 'target', x: 5, y: 3, z: 0, color: 'green' },
      { type: 'target', x: 5, y: 4, z: 0, color: 'magenta' },
      { type: 'target', x: 4, y: 4, z: 5, color: 'green' },
      { type: 'mirror', x: 1, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 1, y: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 4, rot: 0 },
      { type: 'target', x: 2, y: 4, z: 6, color: 'red' },
      { type: 'mirror', x: 2, y: 4, z: 5, rot: 2 },
      { type: 'target', x: 5, y: 2, z: 0, color: 'blue' },
    ],
    solution: { '5,3,4': 1, '5,3,1': 4, '1,3,1': 5, '3,3,6': 4, '1,3,4': 3, '0,3,1': 3, '0,3,5': 1, '0,4,5': 3, '1,4,1': 3, '1,4,0': 3, '1,3,6': 1, '1,4,4': 3, '2,4,4': 1, '2,4,5': 1 },
  },
  // Platz im Spiel: nach „Chaos“
  {
    // Lösung: Spiegel (3,3,1) Achse z rot 1 · Spiegel (1,4,1) Achse y rot 2 ·
    //   Spiegel (2,4,0) Achse y rot 0 · Spiegel (3,0,1) Achse x rot 3 · Spiegel (3,3,5) Achse x rot 1 ·
    //   Spiegel (3,3,6) Achse x rot 1 · Spiegel (2,0,2) Achse y rot 2 · Spiegel (6,3,1) Achse z rot 2 ·
    //   Prisma (3,4,6) Achse z rot 4 · Spiegel (2,3,6) Achse x rot 1 · Prisma (0,4,2) Achse y rot 1 ·
    //   Spiegel (4,4,2) Achse y rot 3 · Spiegel (4,4,0) Achse y rot 1
    // Generator sehr schwer-abschalten, Seed 22123, Stand 33f26f8, gesenkt um 2 · Würfel „sehr schwer“
    name: 'Hypatia', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, y: 3, z: 1, dir: 0 },
      { type: 'mirror', x: 3, y: 3, z: 1, axis: 'z', rot: 2 },
      { type: 'target', x: 3, y: 4, z: 1, color: 'white' },
      { type: 'source', x: 6, y: 4, z: 6, dir: 5 },
      { type: 'mirror', x: 1, y: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 2, y: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 5, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 3, y: 3, z: 5, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 3, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 0 },
      { type: 'source', x: 6, y: 0, z: 6, dir: 5 },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'prism', x: 3, y: 4, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 2, y: 3, z: 6, axis: 'x', rot: 0 },
      { type: 'filter', x: 5, y: 0, z: 5, color: 'red' },
      { type: 'mirror', x: 0, y: 3, z: 4, axis: 'z', rot: 1, fixed: true },
      { type: 'target', x: 1, y: 4, z: 6, color: 'green' },
      { type: 'target', x: 0, y: 4, z: 3, color: 'magenta' },
      { type: 'source', x: 0, y: 4, z: 0, dir: 1, color: 'magenta' },
      { type: 'prism', x: 0, y: 4, z: 2, rot: 4 },
      { type: 'mirror', x: 4, y: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 0, rot: 2 },
      { type: 'target', x: 3, y: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, y: 4, z: 1, color: 'red' },
    ],
    solution: { '3,3,1': 1, '1,4,1': 2, '2,4,0': 0, '3,0,1': 3, '3,3,5': 1, '3,3,6': 1, '2,0,2': 2, '6,3,1': 2, '3,4,6': 4, '2,3,6': 1, '0,4,2': 1, '4,4,2': 3, '4,4,0': 1 },
  },
  // Platz im Spiel: nach „Hypatia“
  {
    // Lösung: Prisma (5,0,3) Achse y rot 4 · Spiegel (5,0,5) Achse y rot 3 ·
    //   Spiegel (2,0,3) Achse y rot 1 · Spiegel (2,0,2) Achse y rot 3 · Spiegel (1,2,5) Achse z rot 1 ·
    //   Prisma (1,1,5) Achse z rot 0 · Spiegel (2,1,5) Achse y rot 3 · Spiegel (2,1,3) Achse y rot 3 ·
    //   Spiegel (4,1,3) Achse z rot 3 · Spiegel (4,3,3) Achse x rot 1 · Spiegel (1,3,5) Achse y rot 3 ·
    //   Spiegel (4,3,6) Achse x rot 1 · Spiegel (4,4,6) Achse x rot 3 · Spiegel (4,4,4) Achse x rot 1
    // Generator sehr schwer-sammelstelle, Seed 61020, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Kardioide', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, y: 0, z: 3, rot: 6 },
      { type: 'source', x: 0, y: 0, z: 5, dir: 0, color: 'red' },
      { type: 'mirror', x: 5, y: 0, z: 5, rot: 2 },
      { type: 'source', x: 5, y: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 4, y: 0, z: 4, color: 'yellow' },
      { type: 'target', x: 4, y: 0, z: 2, color: 'cyan' },
      { type: 'mirror', x: 2, y: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 1 },
      { type: 'source', x: 0, y: 2, z: 5, dir: 0 },
      { type: 'mirror', x: 1, y: 2, z: 5, axis: 'z', rot: 0 },
      { type: 'prism', x: 1, y: 1, z: 5, axis: 'z', rot: 3 },
      { type: 'mirror', x: 2, y: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 2, y: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 4, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 2, y: 2, z: 5, axis: 'z', rot: 2, fixed: true },
      { type: 'mirror', x: 1, y: 3, z: 5, rot: 2 },
      { type: 'target', x: 1, y: 4, z: 6, color: 'red' },
      { type: 'mirror', x: 4, y: 3, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 4, z: 4, axis: 'x', rot: 2 },
    ],
    solution: { '5,0,3': 4, '5,0,5': 3, '2,0,3': 1, '2,0,2': 3, '1,2,5': 1, '1,1,5': 0, '2,1,5': 3, '2,1,3': 3, '4,1,3': 3, '4,3,3': 1, '1,3,5': 3, '4,3,6': 1, '4,4,6': 3, '4,4,4': 1 },
  },
  // Platz im Spiel: nach „Kardioide“
  {
    // Lösung: Prisma (0,1,6) Achse x rot 6 · Prisma (1,1,3) Achse z rot 0 ·
    //   Prisma (5,3,4) Achse y rot 6 · Spiegel (2,0,3) Achse x rot 3 · Spiegel (1,3,0) Achse x rot 3 ·
    //   Spiegel (4,0,5) Achse z rot 2 · Spiegel (0,0,6) Achse z rot 1 · Spiegel (5,3,0) Achse x rot 1 ·
    //   Spiegel (5,2,0) Achse z rot 3 · Spiegel (4,2,0) Achse z rot 1 · Spiegel (4,4,0) Achse z rot 3 ·
    //   Spiegel (2,2,3) Achse x rot 0 · Spiegel (3,1,3) Achse z rot 0 · Spiegel (6,4,0) Achse y rot 1
    // Generator sehr schwer, Seed 60381, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Kolmogorow', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, y: 1, z: 0, dir: 2 },
      { type: 'source', x: 6, y: 3, z: 4, dir: 4 },
      { type: 'source', x: 1, y: 4, z: 3, axis: 'x', dir: 6 },
      { type: 'prism', x: 0, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'prism', x: 1, y: 1, z: 3, axis: 'z', rot: 1 },
      { type: 'prism', x: 5, y: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 1, y: 3, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 0, z: 5, axis: 'z', rot: 1 },
      { type: 'target', x: 0, y: 4, z: 0, color: 'red' },
      { type: 'target', x: 3, y: 0, z: 6, color: 'cyan' },
      { type: 'mirror', x: 0, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 0, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 4, y: 2, z: 0, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 0, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 2, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 3, axis: 'z', rot: 3 },
      { type: 'filter', x: 1, y: 3, z: 3, color: 'magenta' },
      { type: 'target', x: 6, y: 4, z: 3, color: 'yellow' },
      { type: 'target', x: 0, y: 0, z: 5, color: 'red' },
      { type: 'mirror', x: 6, y: 4, z: 0, rot: 2 },
      { type: 'target', x: 6, y: 3, z: 3, color: 'blue' },
    ],
    solution: { '0,1,6': 6, '1,1,3': 0, '5,3,4': 6, '2,0,3': 3, '1,3,0': 3, '4,0,5': 2, '0,0,6': 1, '5,3,0': 1, '5,2,0': 3, '4,2,0': 1, '4,4,0': 3, '2,2,3': 0, '3,1,3': 0, '6,4,0': 1 },
  },
  // Platz im Spiel: nach „Kolmogorow“
  {
    // Lösung: Prisma (2,3,1) Achse y rot 2 · Spiegel (1,3,0) Achse y rot 0 ·
    //   Prisma (3,2,3) Achse x rot 6 · Prisma (1,0,5) Achse y rot 7 · Spiegel (3,0,3) Achse x rot 3 ·
    //   Spiegel (3,0,6) Achse y rot 1 · Spiegel (2,3,6) Achse x rot 3 · Spiegel (1,0,2) Achse y rot 3 ·
    //   Spiegel (2,0,6) Achse x rot 1 · Spiegel (6,0,3) Achse x rot 3 · Spiegel (6,3,3) Achse z rot 1 ·
    //   Spiegel (2,0,2) Achse y rot 3 · Spiegel (2,0,1) Achse x rot 3
    // Generator sehr schwer-sammelstelle, Seed 62348, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Tensor', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, y: 3, z: 1, rot: 6 },
      { type: 'source', x: 3, y: 3, z: 0, dir: 3, color: 'blue' },
      { type: 'source', x: 0, y: 3, z: 1, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 1, y: 3, z: 0, rot: 1 },
      { type: 'target', x: 0, y: 3, z: 3, color: 'cyan' },
      { type: 'target', x: 5, y: 3, z: 4, color: 'red' },
      { type: 'source', x: 3, y: 4, z: 5, axis: 'x', dir: 5, color: 'yellow' },
      { type: 'source', x: 1, y: 0, z: 6, dir: 6, color: 'yellow' },
      { type: 'prism', x: 3, y: 2, z: 3, axis: 'x', rot: 7 },
      { type: 'prism', x: 1, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 3, y: 0, z: 3, axis: 'x', rot: 1 },
      { type: 'mirror', x: 3, y: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 6, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 3, y: 0, z: 2, color: 'green' },
      { type: 'mirror', x: 2, y: 0, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 6, y: 0, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 3, axis: 'z', rot: 3 },
      { type: 'target', x: 3, y: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 2, y: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 2, y: 0, z: 1, axis: 'x', rot: 0 },
      { type: 'target', x: 2, y: 2, z: 1, color: 'red' },
    ],
    solution: { '2,3,1': 2, '1,3,0': 0, '3,2,3': 6, '1,0,5': 7, '3,0,3': 3, '3,0,6': 1, '2,3,6': 3, '1,0,2': 3, '2,0,6': 1, '6,0,3': 3, '6,3,3': 1, '2,0,2': 3, '2,0,1': 3 },
  },
  // Platz im Spiel: nach „Tensor“
  {
    // Lösung: Prisma (4,2,1) Achse y rot 2 · Spiegel (5,2,0) Achse y rot 0 ·
    //   Spiegel (5,2,1) Achse y rot 1 · Spiegel (6,2,3) Achse z rot 3 · Prisma (2,0,4) Achse y rot 4 ·
    //   Spiegel (6,3,4) Achse x rot 2 · Spiegel (6,4,3) Achse z rot 1 · Spiegel (3,4,0) Achse x rot 2 ·
    //   Spiegel (2,4,1) Achse y rot 2 · Spiegel (6,4,5) Achse y rot 2 · Spiegel (5,4,6) Achse x rot 2 ·
    //   Spiegel (6,0,1) Achse y rot 2 · Spiegel (1,0,4) Achse z rot 1 · Spiegel (5,0,0) Achse y rot 0
    // Generator sehr schwer-sammelstelle, Seed 20751, Stand 33f26f8, gesenkt um 1 · Würfel „sehr schwer“
    name: 'Fibonacci', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, y: 2, z: 1, rot: 7 },
      { type: 'source', x: 6, y: 2, z: 1, dir: 5, color: 'green' },
      { type: 'mirror', x: 5, y: 2, z: 0, rot: 1 },
      { type: 'source', x: 5, y: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 5, y: 2, z: 1, rot: 3 },
      { type: 'target', x: 4, y: 2, z: 5, color: 'green' },
      { type: 'target', x: 1, y: 2, z: 4, color: 'cyan' },
      { type: 'source', x: 6, y: 0, z: 0, dir: 3 },
      { type: 'mirror', x: 6, y: 2, z: 3, axis: 'z', rot: 2 },
      { type: 'prism', x: 2, y: 0, z: 4, rot: 0 },
      { type: 'target', x: 1, y: 0, z: 3, color: 'blue' },
      { type: 'mirror', x: 6, y: 3, z: 4, axis: 'x', rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 3, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 0, axis: 'x', rot: 3 },
      { type: 'mirror', x: 2, y: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 6, axis: 'x', rot: 3 },
      { type: 'target', x: 1, y: 4, z: 2, color: 'red' },
      { type: 'source', x: 1, y: 0, z: 6, dir: 7 },
      { type: 'mirror', x: 6, y: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 1, y: 0, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 0, rot: 3 },
      { type: 'filter', x: 3, y: 0, z: 4, color: 'cyan' },
      { type: 'mirror', x: 1, y: 2, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 2, y: 3, z: 6, color: 'cyan' },
    ],
    solution: { '4,2,1': 2, '5,2,0': 0, '5,2,1': 1, '6,2,3': 3, '2,0,4': 4, '6,3,4': 2, '6,4,3': 1, '3,4,0': 2, '2,4,1': 2, '6,4,5': 2, '5,4,6': 2, '6,0,1': 2, '1,0,4': 1, '5,0,0': 0 },
  },
  // Platz im Spiel: nach „Fibonacci“
  {
    // Lösung: Spiegel (1,3,1) Achse y rot 3 · Spiegel (1,3,3) Achse y rot 1 ·
    //   Prisma (4,3,1) Achse y rot 2 · Spiegel (5,4,5) Achse x rot 3 · Prisma (5,1,5) Achse x rot 4 ·
    //   Spiegel (4,3,5) Achse x rot 1 · Spiegel (5,1,1) Achse x rot 3 · Spiegel (5,3,1) Achse z rot 3 ·
    //   Spiegel (4,4,5) Achse z rot 1 · Spiegel (0,3,5) Achse z rot 3 · Spiegel (0,2,6) Achse y rot 0 ·
    //   Spiegel (6,3,1) Achse y rot 3 · Spiegel (6,3,0) Achse x rot 3 · Spiegel (6,4,0) Achse x rot 1
    // Generator sehr schwer-mischziel, Seed 61400, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Cauchy', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, y: 2, z: 0, axis: 'x', dir: 1, color: 'magenta' },
      { type: 'source', x: 1, y: 3, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 1, y: 3, z: 1, rot: 2 },
      { type: 'target', x: 0, y: 3, z: 1, color: 'white' },
      { type: 'source', x: 6, y: 3, z: 3, dir: 4 },
      { type: 'source', x: 5, y: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 1, y: 3, z: 3, rot: 3 },
      { type: 'prism', x: 4, y: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 5, y: 4, z: 5, axis: 'x', rot: 1 },
      { type: 'prism', x: 5, y: 1, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 4, y: 3, z: 5, axis: 'x', rot: 2 },
      { type: 'mirror', x: 5, y: 1, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 3, z: 1, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 4, z: 5, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 5, y: 3, z: 2, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 0, y: 4, z: 6, color: 'green' },
      { type: 'target', x: 6, y: 4, z: 2, color: 'yellow' },
      { type: 'mirror', x: 0, y: 3, z: 5, axis: 'z', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 6, rot: 1 },
      { type: 'target', x: 0, y: 1, z: 5, color: 'blue' },
      { type: 'mirror', x: 6, y: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 4, z: 0, axis: 'x', rot: 3 },
      { type: 'target', x: 5, y: 0, z: 4, color: 'blue' },
    ],
    solution: { '1,3,1': 3, '1,3,3': 1, '4,3,1': 2, '5,4,5': 3, '5,1,5': 4, '4,3,5': 1, '5,1,1': 3, '5,3,1': 3, '4,4,5': 1, '0,3,5': 3, '0,2,6': 0, '6,3,1': 3, '6,3,0': 3, '6,4,0': 1 },
  },
  // Platz im Spiel: nach „Cauchy“
  {
    // Lösung: Prisma (3,1,3) Achse z rot 4 · Prisma (1,0,5) Achse y rot 4 ·
    //   Spiegel (1,1,3) Achse z rot 1 · Spiegel (1,4,3) Achse z rot 1 · Spiegel (0,0,5) Achse z rot 1 ·
    //   Spiegel (0,4,3) Achse y rot 1 · Spiegel (0,4,0) Achse x rot 1 · Spiegel (0,0,0) Achse x rot 3 ·
    //   Spiegel (0,4,6) Achse x rot 3 · Prisma (3,2,4) Achse z rot 5 · Spiegel (2,2,4) Achse y rot 3 ·
    //   Spiegel (3,3,4) Achse x rot 1 · Spiegel (0,2,6) Achse z rot 1 · Spiegel (3,3,5) Achse y rot 1
    // Generator sehr schwer, Seed 62806, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Euklid', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 2, y: 0, z: 6, dir: 5 },
      { type: 'source', x: 3, y: 0, z: 3, axis: 'x', dir: 2, color: 'yellow' },
      { type: 'prism', x: 3, y: 1, z: 3, axis: 'z', rot: 3 },
      { type: 'prism', x: 1, y: 0, z: 5, rot: 7 },
      { type: 'mirror', x: 1, y: 1, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 3, axis: 'z', rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 5, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 0, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 5, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 2, y: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 0, y: 4, z: 6, axis: 'x', rot: 2 },
      { type: 'source', x: 5, y: 4, z: 4, axis: 'z', dir: 3, color: 'magenta' },
      { type: 'prism', x: 3, y: 2, z: 4, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, y: 2, z: 6, color: 'yellow' },
      { type: 'mirror', x: 3, y: 3, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 6, axis: 'z', rot: 0 },
      { type: 'target', x: 0, y: 0, z: 4, color: 'cyan' },
      { type: 'mirror', x: 3, y: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 5, y: 3, z: 5, rot: 3, fixed: true },
      { type: 'target', x: 5, y: 3, z: 1, color: 'blue' },
    ],
    solution: { '3,1,3': 4, '1,0,5': 4, '1,1,3': 1, '1,4,3': 1, '0,0,5': 1, '0,4,3': 1, '0,4,0': 1, '0,0,0': 3, '0,4,6': 3, '3,2,4': 5, '2,2,4': 3, '3,3,4': 1, '0,2,6': 1, '3,3,5': 1 },
  },
  // Platz im Spiel: nach „Euklid“
  {
    // Lösung: Prisma (2,2,4) Achse y rot 6 · Spiegel (2,2,0) Achse y rot 3 ·
    //   Spiegel (3,2,0) Achse y rot 1 · Spiegel (3,2,1) Achse y rot 3 · Spiegel (1,2,1) Achse y rot 3 ·
    //   Spiegel (5,3,2) Achse y rot 1 · Spiegel (6,2,2) Achse z rot 2 · Spiegel (4,0,2) Achse z rot 0 ·
    //   Spiegel (3,1,2) Achse z rot 0 · Prisma (2,0,2) Achse z rot 5 · Spiegel (2,3,2) Achse x rot 3 ·
    //   Spiegel (0,2,2) Achse z rot 2 · Spiegel (2,3,0) Achse y rot 3 · Spiegel (1,3,2) Achse x rot 0
    // Generator sehr schwer-sammelstelle, Seed 62919, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Julia-Menge', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, y: 2, z: 4, rot: 7 },
      { type: 'source', x: 4, y: 2, z: 6, dir: 5, color: 'cyan' },
      { type: 'source', x: 0, y: 2, z: 4, dir: 0, color: 'red' },
      { type: 'target', x: 4, y: 2, z: 2, color: 'cyan' },
      { type: 'target', x: 1, y: 2, z: 3, color: 'yellow' },
      { type: 'mirror', x: 2, y: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 3, y: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 3, y: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 1, y: 2, z: 1, rot: 0 },
      { type: 'source', x: 5, y: 4, z: 1, axis: 'x', dir: 7, color: 'cyan' },
      { type: 'mirror', x: 5, y: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 6, y: 2, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 4, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 3, y: 1, z: 2, axis: 'z', rot: 1 },
      { type: 'prism', x: 2, y: 0, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 2, axis: 'x', rot: 1 },
      { type: 'mirror', x: 0, y: 2, z: 2, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 1, y: 3, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 3, y: 3, z: 0, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 3, y: 4, z: 0, color: 'blue' },
    ],
    solution: { '2,2,4': 6, '2,2,0': 3, '3,2,0': 1, '3,2,1': 3, '1,2,1': 3, '5,3,2': 1, '6,2,2': 2, '4,0,2': 0, '3,1,2': 0, '2,0,2': 5, '2,3,2': 3, '0,2,2': 2, '2,3,0': 3, '1,3,2': 0 },
  },
  // Platz im Spiel: nach „Julia-Menge“
  {
    // Lösung: Prisma (4,4,3) Achse y rot 4 · Spiegel (3,2,3) Achse z rot 2 ·
    //   Spiegel (2,3,1) Achse z rot 1 · Prisma (2,0,1) Achse x rot 4 · Prisma (2,1,3) Achse z rot 5 ·
    //   Spiegel (3,4,2) Achse x rot 1 · Spiegel (0,1,2) Achse z rot 2 · Spiegel (1,0,2) Achse x rot 3 ·
    //   Spiegel (0,1,3) Achse z rot 3 · Spiegel (2,0,0) Achse y rot 1 · Spiegel (2,1,0) Achse y rot 0 ·
    //   Spiegel (0,3,3) Achse y rot 1 · Spiegel (0,0,0) Achse y rot 3
    // Generator sehr schwer-sammelstelle, Seed 60239, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Isometrie', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, y: 4, z: 3, rot: 0 },
      { type: 'source', x: 6, y: 4, z: 5, dir: 5, color: 'green' },
      { type: 'source', x: 4, y: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 2, y: 4, z: 3, color: 'white' },
      { type: 'target', x: 1, y: 4, z: 6, color: 'red' },
      { type: 'source', x: 1, y: 4, z: 3, axis: 'z', dir: 1 },
      { type: 'source', x: 0, y: 3, z: 1, dir: 0 },
      { type: 'mirror', x: 3, y: 2, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 3, z: 1, axis: 'z', rot: 0 },
      { type: 'prism', x: 2, y: 0, z: 1, axis: 'x', rot: 1 },
      { type: 'prism', x: 2, y: 1, z: 3, axis: 'z', rot: 6 },
      { type: 'mirror', x: 3, y: 4, z: 2, axis: 'x', rot: 3 },
      { type: 'mirror', x: 0, y: 1, z: 2, axis: 'z', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 0, y: 1, z: 3, axis: 'z', rot: 1 },
      { type: 'mirror', x: 2, y: 0, z: 3, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 6, y: 4, z: 3, color: 'blue' },
      { type: 'target', x: 0, y: 0, z: 3, color: 'yellow' },
      { type: 'mirror', x: 2, y: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, y: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 0, rot: 0 },
      { type: 'target', x: 0, y: 4, z: 2, color: 'green' },
    ],
    solution: { '4,4,3': 4, '3,2,3': 2, '2,3,1': 1, '2,0,1': 4, '2,1,3': 5, '3,4,2': 1, '0,1,2': 2, '1,0,2': 3, '0,1,3': 3, '2,0,0': 1, '2,1,0': 0, '0,3,3': 1, '0,0,0': 3 },
  },
  // Platz im Spiel: nach „Isometrie“
  {
    // Lösung: Spiegel (3,4,2) Achse z rot 1 · Spiegel (1,4,2) Achse y rot 3 ·
    //   Prisma (1,3,1) Achse z rot 2 · Spiegel (0,2,1) Achse y rot 2 · Spiegel (1,1,1) Achse x rot 1 ·
    //   Spiegel (1,4,3) Achse x rot 3 · Prisma (3,1,3) Achse x rot 2 · Spiegel (1,1,3) Achse x rot 3 ·
    //   Spiegel (1,1,5) Achse y rot 1 · Prisma (5,1,5) Achse y rot 7 · Spiegel (1,1,0) Achse y rot 1 ·
    //   Spiegel (5,1,0) Achse x rot 3 · Spiegel (5,4,0) Achse z rot 1 · Spiegel (2,1,0) Achse x rot 2
    // Generator sehr schwer, Seed 62544, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Fourier', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, y: 3, z: 1, dir: 4 },
      { type: 'source', x: 3, y: 0, z: 2, axis: 'x', dir: 2, color: 'yellow' },
      { type: 'source', x: 3, y: 0, z: 3, axis: 'x', dir: 2, color: 'magenta' },
      { type: 'mirror', x: 3, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 1, y: 4, z: 2, rot: 0 },
      { type: 'prism', x: 1, y: 3, z: 1, axis: 'z', rot: 7 },
      { type: 'mirror', x: 0, y: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 1, y: 1, z: 1, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 4, z: 3, axis: 'x', rot: 0 },
      { type: 'prism', x: 3, y: 1, z: 3, axis: 'x', rot: 4 },
      { type: 'mirror', x: 1, y: 1, z: 3, axis: 'x', rot: 2 },
      { type: 'mirror', x: 1, y: 1, z: 5, rot: 2 },
      { type: 'prism', x: 5, y: 1, z: 5, rot: 4 },
      { type: 'target', x: 6, y: 1, z: 4, color: 'cyan' },
      { type: 'target', x: 3, y: 4, z: 0, color: 'magenta' },
      { type: 'mirror', x: 1, y: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 5, y: 1, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 5, y: 4, z: 0, axis: 'z', rot: 2 },
      { type: 'target', x: 3, y: 2, z: 4, color: 'red' },
      { type: 'mirror', x: 2, y: 1, z: 0, axis: 'x', rot: 1 },
      { type: 'target', x: 0, y: 1, z: 0, color: 'green' },
    ],
    solution: { '3,4,2': 1, '1,4,2': 3, '1,3,1': 2, '0,2,1': 2, '1,1,1': 1, '1,4,3': 3, '3,1,3': 2, '1,1,3': 3, '1,1,5': 1, '5,1,5': 7, '1,1,0': 1, '5,1,0': 3, '5,4,0': 1, '2,1,0': 2 },
  },
  // Platz im Spiel: nach „Fourier“
  {
    // Lösung: Spiegel (2,1,5) Achse y rot 1 · Prisma (2,2,0) Achse z rot 5 ·
    //   Prisma (2,1,6) Achse y rot 1 · Spiegel (4,1,6) Achse z rot 1 · Spiegel (4,0,6) Achse z rot 1 ·
    //   Prisma (1,4,5) Achse z rot 1 · Spiegel (6,4,5) Achse y rot 3 · Spiegel (0,0,5) Achse y rot 1 ·
    //   Spiegel (0,0,1) Achse x rot 3 · Spiegel (6,0,6) Achse z rot 3 · Spiegel (6,3,6) Achse z rot 1 ·
    //   Spiegel (1,3,0) Achse z rot 0 · Spiegel (0,2,0) Achse y rot 2 · Spiegel (0,3,6) Achse y rot 1
    // Generator sehr schwer, Seed 62178, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Kepler', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, y: 2, z: 0, dir: 4, color: 'cyan' },
      { type: 'source', x: 0, y: 1, z: 5, dir: 0 },
      { type: 'source', x: 0, y: 4, z: 5, dir: 0 },
      { type: 'mirror', x: 2, y: 1, z: 5, rot: 0 },
      { type: 'prism', x: 2, y: 2, z: 0, axis: 'z', rot: 0 },
      { type: 'prism', x: 2, y: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 4, y: 1, z: 6, axis: 'z', rot: 2 },
      { type: 'mirror', x: 4, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'prism', x: 1, y: 4, z: 5, axis: 'z', rot: 6 },
      { type: 'mirror', x: 2, y: 4, z: 0, axis: 'z', rot: 3, fixed: true },
      { type: 'mirror', x: 1, y: 0, z: 5, axis: 'z', rot: 3, fixed: true },
      { type: 'target', x: 6, y: 4, z: 0, color: 'magenta' },
      { type: 'target', x: 5, y: 0, z: 5, color: 'green' },
      { type: 'mirror', x: 6, y: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, y: 0, z: 1, axis: 'x', rot: 0 },
      { type: 'target', x: 0, y: 3, z: 1, color: 'magenta' },
      { type: 'mirror', x: 6, y: 0, z: 6, axis: 'z', rot: 0 },
      { type: 'mirror', x: 6, y: 3, z: 6, axis: 'z', rot: 3 },
      { type: 'mirror', x: 1, y: 3, z: 0, axis: 'z', rot: 3 },
      { type: 'mirror', x: 0, y: 2, z: 0, rot: 3 },
      { type: 'target', x: 2, y: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 0, y: 3, z: 6, rot: 3 },
    ],
    solution: { '2,1,5': 1, '2,2,0': 5, '2,1,6': 1, '4,1,6': 1, '4,0,6': 1, '1,4,5': 1, '6,4,5': 3, '0,0,5': 1, '0,0,1': 3, '6,0,6': 3, '6,3,6': 1, '1,3,0': 0, '0,2,0': 2, '0,3,6': 1 },
  },
  // Platz im Spiel: nach „Kepler“
  {
    // Lösung: Prisma (1,0,5) Achse y rot 1 · Prisma (3,1,3) Achse z rot 1 ·
    //   Prisma (1,3,4) Achse y rot 1 · Spiegel (5,1,3) Achse y rot 1 · Spiegel (2,3,4) Achse z rot 1 ·
    //   Spiegel (2,0,4) Achse z rot 1 · Spiegel (5,0,4) Achse z rot 3 · Spiegel (5,1,4) Achse x rot 1 ·
    //   Spiegel (5,3,4) Achse x rot 1 · Spiegel (2,3,5) Achse x rot 3 · Spiegel (1,3,6) Achse z rot 3 ·
    //   Spiegel (2,3,6) Achse z rot 3 · Spiegel (5,1,6) Achse x rot 3 · Spiegel (5,0,6) Achse z rot 3
    // Generator sehr schwer-sammelstelle, Seed 60902, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Ramanujan', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, y: 0, z: 5, rot: 4 },
      { type: 'source', x: 0, y: 0, z: 4, dir: 1, color: 'magenta' },
      { type: 'source', x: 0, y: 0, z: 6, dir: 7, color: 'green' },
      { type: 'target', x: 5, y: 0, z: 5, color: 'yellow' },
      { type: 'target', x: 2, y: 0, z: 6, color: 'yellow' },
      { type: 'source', x: 0, y: 3, z: 4, dir: 0, color: 'yellow' },
      { type: 'source', x: 2, y: 0, z: 3, axis: 'z', dir: 7 },
      { type: 'prism', x: 3, y: 1, z: 3, axis: 'z', rot: 6 },
      { type: 'prism', x: 1, y: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 5, y: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 0, z: 4, axis: 'z', rot: 2 },
      { type: 'mirror', x: 5, y: 0, z: 4, axis: 'z', rot: 0 },
      { type: 'mirror', x: 5, y: 1, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 3, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 5, y: 3, z: 5, axis: 'x', rot: 1, fixed: true },
      { type: 'target', x: 5, y: 4, z: 5, color: 'red' },
      { type: 'mirror', x: 2, y: 3, z: 5, axis: 'x', rot: 0 },
      { type: 'mirror', x: 1, y: 0, z: 6, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 1, y: 3, z: 6, axis: 'z', rot: 0 },
      { type: 'mirror', x: 2, y: 3, z: 6, axis: 'z', rot: 1 },
      { type: 'target', x: 2, y: 4, z: 6, color: 'blue' },
      { type: 'mirror', x: 5, y: 1, z: 6, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 0, z: 6, axis: 'z', rot: 2 },
      { type: 'target', x: 4, y: 0, z: 3, color: 'green' },
    ],
    solution: { '1,0,5': 1, '3,1,3': 1, '1,3,4': 1, '5,1,3': 1, '2,3,4': 1, '2,0,4': 1, '5,0,4': 3, '5,1,4': 1, '5,3,4': 1, '2,3,5': 3, '1,3,6': 3, '2,3,6': 3, '5,1,6': 3, '5,0,6': 3 },
  },
  // Platz im Spiel: nach „Ramanujan“
  {
    // Lösung: Spiegel (5,1,1) Achse z rot 3 · Spiegel (5,2,0) Achse y rot 0 ·
    //   Prisma (5,4,2) Achse x rot 7 · Spiegel (5,4,6) Achse y rot 3 · Spiegel (5,2,4) Achse y rot 0 ·
    //   Kombinator (5,0,2) Achse y dir 4 · Spiegel (3,4,6) Achse y rot 1 ·
    //   Spiegel (3,4,0) Achse y rot 3 · Spiegel (2,4,1) Achse x rot 1 · Spiegel (6,3,0) Achse x rot 3 ·
    //   Spiegel (2,4,2) Achse y rot 1 · Prisma (4,4,2) Achse y rot 6 · Spiegel (6,4,1) Achse x rot 1 ·
    //   Prisma (6,4,4) Achse y rot 4
    // Generator sehr schwer, Seed 60305, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Dedekind', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, y: 1, z: 6, dir: 7 },
      { type: 'mirror', x: 5, y: 1, z: 1, axis: 'z', rot: 1 },
      { type: 'mirror', x: 5, y: 2, z: 0, rot: 2 },
      { type: 'prism', x: 5, y: 4, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 5, y: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 5, y: 2, z: 4, rot: 1 },
      { type: 'combiner', x: 5, y: 0, z: 2, dir: 3 },
      { type: 'mirror', x: 3, y: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 3, y: 4, z: 0, rot: 0 },
      { type: 'target', x: 2, y: 0, z: 2, color: 'yellow' },
      { type: 'target', x: 4, y: 4, z: 0, color: 'cyan' },
      { type: 'source', x: 2, y: 0, z: 1, axis: 'x', dir: 2, color: 'yellow' },
      { type: 'source', x: 6, y: 4, z: 0, axis: 'x', dir: 6 },
      { type: 'mirror', x: 2, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'mirror', x: 6, y: 3, z: 0, axis: 'x', rot: 1 },
      { type: 'mirror', x: 6, y: 3, z: 1, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 2, y: 4, z: 2, rot: 0 },
      { type: 'prism', x: 4, y: 4, z: 2, rot: 7 },
      { type: 'target', x: 2, y: 4, z: 0, color: 'red' },
      { type: 'mirror', x: 6, y: 4, z: 1, axis: 'x', rot: 2 },
      { type: 'prism', x: 6, y: 4, z: 4, rot: 5 },
      { type: 'target', x: 1, y: 4, z: 4, color: 'green' },
      { type: 'target', x: 5, y: 4, z: 1, color: 'blue' },
    ],
    solution: { '5,1,1': 3, '5,2,0': 0, '5,4,2': 7, '5,4,6': 3, '5,2,4': 0, '5,0,2': 4, '3,4,6': 1, '3,4,0': 3, '2,4,1': 1, '6,3,0': 3, '2,4,2': 1, '4,4,2': 6, '6,4,1': 1, '6,4,4': 4 },
  },
  // Platz im Spiel: nach „Dedekind“
  {
    // Lösung: Spiegel (3,4,4) Achse y rot 2 · Prisma (3,3,2) Achse x rot 5 ·
    //   Prisma (1,4,6) Achse y rot 4 · Spiegel (4,2,4) Achse x rot 2 · Spiegel (3,0,2) Achse z rot 3 ·
    //   Prisma (4,4,2) Achse x rot 4 · Spiegel (2,1,1) Achse x rot 3 · Spiegel (0,0,2) Achse y rot 3 ·
    //   Spiegel (0,0,6) Achse x rot 1 · Spiegel (2,4,2) Achse y rot 3 · Spiegel (0,4,2) Achse z rot 3 ·
    //   Spiegel (0,3,2) Achse x rot 1 · Spiegel (0,4,5) Achse z rot 2 · Spiegel (0,3,0) Achse y rot 3
    // Generator sehr schwer, Seed 61594, Stand 74361c6 · Würfel „sehr schwer“
    name: 'Turing', dim: 3, size: 7, height: 5, grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, y: 0, z: 2, axis: 'x', dir: 1, color: 'yellow' },
      { type: 'source', x: 3, y: 4, z: 1, axis: 'x', dir: 7 },
      { type: 'source', x: 0, y: 4, z: 1, dir: 1 },
      { type: 'source', x: 2, y: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 3, y: 4, z: 4, rot: 0 },
      { type: 'prism', x: 3, y: 3, z: 2, axis: 'x', rot: 2 },
      { type: 'prism', x: 1, y: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 4, y: 2, z: 4, axis: 'x', rot: 3 },
      { type: 'mirror', x: 3, y: 0, z: 2, axis: 'z', rot: 2 },
      { type: 'prism', x: 4, y: 4, z: 2, axis: 'x', rot: 0 },
      { type: 'mirror', x: 2, y: 1, z: 1, axis: 'x', rot: 1 },
      { type: 'mirror', x: 2, y: 4, z: 1, axis: 'x', rot: 1, fixed: true },
      { type: 'mirror', x: 4, y: 4, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 0, y: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 5, y: 4, z: 0, color: 'cyan' },
      { type: 'mirror', x: 0, y: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 0, y: 0, z: 6, axis: 'x', rot: 3 },
      { type: 'target', x: 3, y: 2, z: 1, color: 'green' },
      { type: 'mirror', x: 2, y: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 0, y: 4, z: 2, axis: 'z', rot: 2 },
      { type: 'mirror', x: 0, y: 3, z: 2, axis: 'x', rot: 2 },
      { type: 'mirror', x: 0, y: 4, z: 5, axis: 'z', rot: 3 },
      { type: 'target', x: 3, y: 3, z: 0, color: 'magenta' },
      { type: 'mirror', x: 0, y: 3, z: 0, rot: 0 },
    ],
    solution: { '3,4,4': 2, '3,3,2': 5, '1,4,6': 4, '4,2,4': 2, '3,0,2': 3, '4,4,2': 4, '2,1,1': 3, '0,0,2': 3, '0,0,6': 1, '2,4,2': 3, '0,4,2': 3, '0,3,2': 1, '0,4,5': 2, '0,3,0': 3 },
  },
  /* VORRAT:END */
];
