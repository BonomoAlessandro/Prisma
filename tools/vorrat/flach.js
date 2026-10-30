// Vorrat der flachen Level (Spec .scratch/noa-geschichte/, «Daten»): Level, die nicht im Spiel stehen, aber jederzeit
// zurückkommen können. Je Level sein Block aus LEVELS in index.html, Zeile für Zeile wie dort (Lösung und Herkunft im
// Kommentar, Name, Grad, Elemente, Lösung), darüber sein Platz im Spiel beim Ablegen. Geschrieben von tools/vorrat.mjs
// (ablegen, zurueckholen, liste); Werkzeuge und Tests lesen ihn über tools/lader.mjs. Nur über das Werkzeug ändern.
const VORRAT_FLACH = [
  /* VORRAT:BEGIN */
  // Platz im Spiel: am Anfang
  {
    // Lösung: Prisma (5,5) rot 5 · Spiegel (5,3) rot 1
    // Wertung 9.8 · 2 drehbar · 2 Ziele · Rateschritte 2 · Profil 1-prisma, Seed 149
    name: 'Zickzack', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'prism', x: 5, z: 5, rot: 3 },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '5,5': 5, '5,3': 1 },
  },
  // Platz im Spiel: nach „Zickzack“
  {
    // Lösung: Spiegel (1,0) rot 1 · Spiegel (2,3) rot 1 · Spiegel (1,3) rot 1
    // Generator leicht-mischziel, Seed 10004 · Ausbau „leicht“
    name: 'Kiesel', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'target', x: 2, z: 5, color: 'white' },
    ],
    solution: { '1,0': 1, '2,3': 1, '1,3': 1 },
  },
  // Platz im Spiel: nach „Wasserfarbe“
  {
    // Lösung: Spiegel (5,3) rot 3 · Spiegel (4,3) rot 3 · Spiegel (5,2) rot 1
    // Wertung 10.8 · 3 drehbar · 2 Ziele · Rateschritte 3 · Profil 1-spiegel, Seed 937
    name: 'Winkelzug', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 2, color: 'white' },
    ],
    solution: { '5,3': 3, '4,3': 3, '5,2': 1 },
  },
  // Platz im Spiel: nach „Tönung“
  {
    // Lösung: Spiegel (3,3) rot 2 · Spiegel (2,4) rot 2 · Spiegel (4,6) rot 0 · Spiegel (5,5) rot 2
    // Wertung 11.4 · 4 drehbar · 1 Ziel · Rateschritte 4 · Kapitel II Umlenkung
    name: 'Schleuse', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 0, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'target', x: 2, z: 6, color: 'white' },
    ],
    solution: { '3,3': 2, '2,4': 2, '4,6': 0, '5,5': 2 },
  },
  // Platz im Spiel: nach „Regenbogen“
  {
    // Lösung: Spiegel (5,1) rot 1 · Spiegel (2,2) rot 1 · Spiegel (2,1) rot 3 · Spiegel (5,6) rot 1
    // Wertung 17.5 · 4 drehbar · 2 Ziele · Rateschritte 17 · Profil 2-filter, Seed 1037
    name: 'Lichtfalle', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'filter', x: 4, z: 2, color: 'yellow' },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'target', x: 6, z: 6, color: 'yellow' },
    ],
    solution: { '5,1': 1, '2,2': 1, '2,1': 3, '5,6': 1 },
  },
  // Platz im Spiel: nach „Lichtfalle“
  {
    // Lösung: Prisma (1,2) rot 3 · Spiegel (4,5) rot 2 · Spiegel (1,6) rot 1
    // Generator leicht-sammelstelle, Seed 97, Ziel 29,5–32,9 · ersetzt Begegnung (Austausch „leicht“)
    name: 'Sammellinse', grad: 'leicht',
    elements: [
      { type: 'prism', x: 1, z: 2, rot: 1 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'yellow' },
      { type: 'source', x: 3, z: 6, dir: 7, color: 'blue' },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'target', x: 0, z: 3, color: 'green' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '1,2': 3, '4,5': 2, '1,6': 1 },
  },
  // Platz im Spiel: nach „Papierflieger“
  {
    // Lösung: Prisma (0,2) rot 0 · Spiegel (5,2) rot 3 · Spiegel (5,1) rot 1
    // Generator leicht-sammelstelle, Seed 10778 · Ausbau „leicht“
    name: 'Buntstift', grad: 'leicht',
    elements: [
      { type: 'prism', x: 0, z: 2, rot: 6 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'yellow' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
    ],
    solution: { '0,2': 0, '5,2': 3, '5,1': 1 },
  },
  // Platz im Spiel: nach „Farbstift“
  {
    // Lösung: Spiegel (1,0) rot 3 · Spiegel (3,0) rot 1 · Spiegel (2,4) rot 2 · Prisma (2,6) rot 7
    // Generator leicht, Seed 10063 · Ausbau „leicht“
    name: 'Drachenschnur', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'target', x: 3, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'prism', x: 2, z: 6, rot: 6 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 5, color: 'red' },
    ],
    solution: { '1,0': 3, '3,0': 1, '2,4': 2, '2,6': 7 },
  },
  // Platz im Spiel: nach „Drachenschnur“
  {
    // Lösung: Spiegel (4,5) rot 3 · Spiegel (4,4) rot 1 · Prisma (6,1) rot 3
    // Generator leicht-mischziel, Seed 10183 · Ausbau „leicht“
    name: 'Zitronengelb', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'green' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 1 },
      { type: 'prism', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '4,5': 3, '4,4': 1, '6,1': 3 },
  },
  // Platz im Spiel: nach „Fächer“
  {
    // Lösung: Spiegel (1,2) rot 1 · Spiegel (5,5) rot 0 · Prisma (0,0) rot 3
    // Generator leicht-mischziel, Seed 10079 · Ausbau „leicht“
    name: 'Lupe', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, z: 0, dir: 3, color: 'cyan' },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'target', x: 4, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'prism', x: 0, z: 0, rot: 7 },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '1,2': 1, '5,5': 0, '0,0': 3 },
  },
  // Platz im Spiel: nach „Wegmarke“
  {
    // Lösung: Prisma (0,4) rot 2 · Prisma (1,1) rot 3 · Spiegel (0,6) rot 1
    // Generator leicht, Seed 10727 · Ausbau „leicht“
    name: 'Kerzenlicht', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'prism', x: 0, z: 4, rot: 1 },
      { type: 'prism', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 6, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 4, z: 2, color: 'green' },
    ],
    solution: { '0,4': 2, '1,1': 3, '0,6': 1 },
  },
  // Platz im Spiel: nach „Gabelung“
  {
    // Lösung: Spiegel (2,2) rot 3 · Spiegel (0,4) rot 3 · Prisma (1,4) rot 6
    // Generator leicht-mischziel, Seed 10124 · Ausbau „leicht“
    name: 'Pfadfinder', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 6 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'prism', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 4, z: 1, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'red' },
    ],
    solution: { '2,2': 3, '0,4': 3, '1,4': 6 },
  },
  // Platz im Spiel: nach „Pfadfinder“
  {
    // Lösung: Prisma (1,4) rot 7 · Spiegel (3,1) rot 3 · Spiegel (2,1) rot 3 · Prisma (2,2) rot 3
    // Generator leicht, Seed 10604 · Ausbau „leicht“
    name: 'Himmelblau', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'prism', x: 1, z: 4, rot: 5 },
      { type: 'target', x: 5, z: 4, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 2, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 3, color: 'green' },
    ],
    solution: { '1,4': 7, '3,1': 3, '2,1': 3, '2,2': 3 },
  },
  // Platz im Spiel: nach „Strahlteiler“
  {
    // Lösung: Prisma (0,1) rot 6 · Spiegel (4,0) rot 3 · Spiegel (1,0) rot 0 · Spiegel (5,4) rot 2
    // Generator leicht, Seed 10059 · Ausbau „leicht“
    name: 'Morgenlicht', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'prism', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'filter', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '0,1': 6, '4,0': 3, '1,0': 0, '5,4': 2 },
  },
  // Platz im Spiel: nach „Lichtschalter“
  {
    // Lösung: Spiegel (6,1) rot 1 · Spiegel (2,2) rot 3 · Spiegel (6,3) rot 3 · Spiegel (2,1) rot 1 ·
    //   Spiegel (5,3) rot 3
    // Wertung 23.3 · 5 drehbar · 3 Ziele · Rateschritte 60 · Profil 3-filter, Seed 5044
    name: 'Lichtspur', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'filter', x: 3, z: 1, color: 'green' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'target', x: 2, z: 3, color: 'white' },
      { type: 'target', x: 5, z: 5, color: 'green' },
    ],
    solution: { '6,1': 1, '2,2': 3, '6,3': 3, '2,1': 1, '5,3': 3 },
  },
  // Platz im Spiel: nach „Lichtspur“
  {
    // Lösung: Prisma (1,4) rot 2 · Spiegel (0,3) rot 2 · Spiegel (1,3) rot 3 · Spiegel (5,4) rot 2
    // Generator leicht-sammelstelle, Seed 10073 · Ausbau „leicht“
    name: 'Windspiel', grad: 'leicht',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'source', x: 3, z: 0, dir: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
    ],
    solution: { '1,4': 2, '0,3': 2, '1,3': 3, '5,4': 2 },
  },
  // Platz im Spiel: nach „Windspiel“
  {
    // Lösung: Prisma (3,2) rot 0 · Spiegel (2,4) rot 3 · Spiegel (3,4) rot 1 · Spiegel (4,2) rot 1 ·
    //   Spiegel (2,0) rot 1
    // Wertung 27.4 · 5 drehbar · 4 Ziele · Rateschritte 127 · Profil 3-bunt, Seed 855 (ohne die wirkungslosen Filter (1,2) und (4,4))
    name: 'Farbkreis', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 3, fixed: true },
      { type: 'prism', x: 3, z: 2, rot: 3 },
      { type: 'target', x: 0, z: 0, color: 'cyan' },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 5, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'white' },
    ],
    solution: { '3,2': 0, '2,4': 3, '3,4': 1, '4,2': 1, '2,0': 1 },
  },
  // Platz im Spiel: nach „Kurve“
  {
    // Lösung: Prisma (2,5) rot 0 · Spiegel (2,0) rot 3 · Spiegel (4,2) rot 3 · Prisma (4,1) rot 0
    // Generator leicht-sammelstelle, Seed 10123 · Ausbau „leicht“
    name: 'Seifenblase', grad: 'leicht',
    elements: [
      { type: 'prism', x: 2, z: 5, rot: 7 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'red' },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'target', x: 6, z: 1, color: 'yellow' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'prism', x: 4, z: 1, rot: 2 },
    ],
    solution: { '2,5': 0, '2,0': 3, '4,2': 3, '4,1': 0 },
  },
  // Platz im Spiel: nach „Seifenblase“
  {
    // Lösung: Spiegel (4,6) rot 3 · Spiegel (3,6) rot 1 · Spiegel (2,2) rot 1 · Spiegel (3,3) rot 1 ·
    //   Spiegel (2,3) rot 3 · Spiegel (2,5) rot 1
    // Generator leicht, Seed 10701 · Ausbau „leicht“
    name: 'Murmel', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'filter', x: 3, z: 5, color: 'red' },
      { type: 'mirror', x: 6, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 5, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'cyan' },
    ],
    solution: { '4,6': 3, '3,6': 1, '2,2': 1, '3,3': 1, '2,3': 3, '2,5': 1 },
  },
  // Platz im Spiel: nach „Murmel“
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (4,2) rot 3 · Spiegel (4,3) rot 3 · Prisma (3,2) rot 4
    // Generator leicht-mischziel, Seed 10006 · Ausbau „leicht“
    name: 'Glanzlicht', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'red' },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 2, z: 3, color: 'white' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'prism', x: 3, z: 2, rot: 5 },
      { type: 'filter', x: 3, z: 5, color: 'cyan' },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'green' },
    ],
    solution: { '2,2': 1, '4,2': 3, '4,3': 3, '3,2': 4 },
  },
  // Platz im Spiel: nach „Sonnenblume“
  {
    // Lösung: Prisma (2,5) rot 0 · Spiegel (0,3) rot 2 · Spiegel (1,6) rot 0 · Spiegel (5,2) rot 2 ·
    //   Spiegel (4,1) rot 2 · Spiegel (5,0) rot 0
    // Generator leicht-sammelstelle, Seed 10170 · Ausbau „leicht“
    name: 'Leuchtkäfer', grad: 'leicht',
    elements: [
      { type: 'prism', x: 2, z: 5, rot: 5 },
      { type: 'source', x: 3, z: 0, dir: 3, color: 'green' },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'source', x: 0, z: 5, dir: 1, color: 'magenta' },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '2,5': 0, '0,3': 2, '1,6': 0, '5,2': 2, '4,1': 2, '5,0': 0 },
  },
  // Platz im Spiel: nach „Tautropfen“
  {
    // Lösung: Spiegel (5,5) rot 1 · Prisma (6,1) rot 2 · Spiegel (0,3) rot 3 · Spiegel (6,2) rot 3 ·
    //   Spiegel (4,2) rot 3 · Spiegel (4,4) rot 1
    // Generator leicht, Seed 10181 · Ausbau „leicht“
    name: 'Kinderspiel', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'red' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'red' },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'prism', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 3, z: 4, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '5,5': 1, '6,1': 2, '0,3': 3, '6,2': 3, '4,2': 3, '4,4': 1 },
  },
  // Platz im Spiel: nach „Fensterglas“
  {
    // Lösung: Spiegel (3,5) rot 3 · Spiegel (3,1) rot 1 · Spiegel (6,5) rot 3 · Spiegel (3,4) rot 1 ·
    //   Prisma (6,1) rot 4 · Spiegel (4,3) rot 0
    // Wertung 20.9 · 6 drehbar · 3 Ziele · Rateschritte 34 · Profil mittel/3-filter, Seed 2002452
    name: 'Facette', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'prism', x: 6, z: 1, rot: 6 },
      { type: 'filter', x: 1, z: 4, color: 'green' },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'green' },
    ],
    solution: { '3,5': 3, '3,1': 1, '6,5': 3, '3,4': 1, '6,1': 4, '4,3': 0 },
  },
  // Platz im Spiel: nach „Zusammenfluss“
  {
    // Lösung: Spiegel (1,2) rot 1 · Prisma (0,2) rot 3 · Prisma (3,5) rot 0 · Spiegel (5,5) rot 1 ·
    //   Kombinator (5,3) dir 6
    // Wertung 29.5 · 5 drehbar · 4 Ziele · Rateschritte 177 · Profil 3-bunt, Seed 1023
    name: 'Spiegelbild', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'cyan' },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'prism', x: 0, z: 2, rot: 6 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'combiner', x: 5, z: 3, dir: 4 },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 5, z: 6, color: 'green' },
    ],
    solution: { '1,2': 1, '0,2': 3, '3,5': 0, '5,5': 1, '5,3': 6 },
  },
  // Platz im Spiel: nach „Schliff“
  {
    // Lösung: Prisma (5,3) rot 7 · Spiegel (6,4) rot 2 · Spiegel (2,6) rot 0 · Spiegel (2,1) rot 1 ·
    //   Spiegel (2,0) rot 3
    // Generator leicht-sammelstelle, Seed 10826 · Ausbau „leicht“
    name: 'Löwenzahn', grad: 'leicht',
    elements: [
      { type: 'prism', x: 5, z: 3, rot: 3 },
      { type: 'source', x: 4, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'red' },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'magenta' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'blue' },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
    ],
    solution: { '5,3': 7, '6,4': 2, '2,6': 0, '2,1': 1, '2,0': 3 },
  },
  // Platz im Spiel: nach „Lindgrün“
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (1,4) rot 3 · Spiegel (6,4) rot 1 · Spiegel (3,5) rot 3 ·
    //   Spiegel (1,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (0,5) rot 3
    // Generator mittel-abschalten, Seed 10038 · Ausbau „mittel“
    name: 'Funkenregen', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'white' },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'target', x: 3, z: 6, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 6, color: 'white' },
    ],
    solution: { '4,5': 1, '1,4': 3, '6,4': 1, '3,5': 3, '1,3': 3, '3,3': 1, '0,5': 3 },
  },
  // Platz im Spiel: nach „Funkenregen“
  {
    // Lösung: Spiegel (5,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (1,3) rot 1 · Spiegel (1,0) rot 3 ·
    //   Prisma (2,0) rot 2
    // Generator mittel-mischziel, Seed 10305 · Ausbau „mittel“
    name: 'Lichtkasten', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'prism', x: 2, z: 0, rot: 4 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '5,2': 1, '2,4': 1, '1,3': 1, '1,0': 3, '2,0': 2 },
  },
  // Platz im Spiel: nach „Lichtkasten“
  {
    // Lösung: Prisma (2,4) rot 1 · Spiegel (2,6) rot 3 · Spiegel (3,4) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (3,0) rot 2 · Spiegel (6,4) rot 3
    // Generator mittel-falle, Seed 10064 · Ausbau „mittel“
    name: 'Pastell', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'prism', x: 3, z: 0, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'red' },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 4, z: 1, color: 'red' },
    ],
    solution: { '2,4': 1, '2,6': 3, '3,4': 1, '3,5': 1, '3,0': 2, '6,4': 3 },
  },
  // Platz im Spiel: nach „Pastell“
  {
    // Lösung: Spiegel (3,4) rot 3 · Spiegel (4,3) rot 1 · Spiegel (6,3) rot 1 · Spiegel (2,4) rot 3 ·
    //   Spiegel (2,2) rot 3 · Spiegel (1,4) rot 1
    // Generator mittel-abschalten, Seed 201, Ziel 43,01–43,73 · ersetzt Lichtpfad (Austausch „mittel“)
    name: 'Zwillingsstrahl', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'target', x: 2, z: 5, color: 'red' },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 5, color: 'blue' },
    ],
    solution: { '3,4': 3, '4,3': 1, '6,3': 1, '2,4': 3, '2,2': 3, '1,4': 1 },
  },
  // Platz im Spiel: nach „Zwillingsstrahl“
  {
    // Lösung: Spiegel (1,2) rot 1 · Spiegel (3,2) rot 1 · Spiegel (3,4) rot 1 · Spiegel (1,4) rot 1 ·
    //   Prisma (3,5) rot 5 · Spiegel (0,5) rot 3
    // Generator mittel-abzaehlen, Seed 10980 · Ausbau „mittel“
    name: 'Wasserspiel', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 3, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 4, color: 'cyan' },
      { type: 'prism', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '1,2': 1, '3,2': 1, '3,4': 1, '1,4': 1, '3,5': 5, '0,5': 3 },
  },
  // Platz im Spiel: nach „Wasserspiel“
  {
    // Lösung: Spiegel (3,4) rot 3 · Spiegel (5,4) rot 1 · Spiegel (1,3) rot 3 · Prisma (2,6) rot 7 ·
    //   Spiegel (5,6) rot 3
    // Generator mittel-mischziel, Seed 10567 · Ausbau „mittel“
    name: 'Bolero', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'magenta' },
      { type: 'prism', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 3, z: 5, color: 'blue' },
      { type: 'target', x: 2, z: 1, color: 'red' },
    ],
    solution: { '3,4': 3, '5,4': 1, '1,3': 3, '2,6': 7, '5,6': 3 },
  },
  // Platz im Spiel: nach „Bolero“
  {
    // Lösung: Spiegel (0,1) rot 2 · Spiegel (2,4) rot 1 · Spiegel (1,4) rot 1 · Prisma (5,1) rot 3 ·
    //   Spiegel (5,4) rot 3
    // Generator mittel-mischziel, Seed 10384 · Ausbau „mittel“
    name: 'Spiegelwand', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 3, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 2, dir: 5 },
      { type: 'prism', x: 5, z: 1, rot: 4 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 3, color: 'red' },
    ],
    solution: { '0,1': 2, '2,4': 1, '1,4': 1, '5,1': 3, '5,4': 3 },
  },
  // Platz im Spiel: nach „Spiegelwand“
  {
    // Lösung: Spiegel (3,3) rot 3 · Spiegel (4,5) rot 1 · Spiegel (1,5) rot 3 · Spiegel (1,6) rot 3 ·
    //   Spiegel (0,6) rot 1 · Spiegel (0,3) rot 3
    // Generator mittel-mischziel, Seed 10688 · Ausbau „mittel“
    name: 'Quarz', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'target', x: 3, z: 4, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'filter', x: 3, z: 1, color: 'red' },
      { type: 'target', x: 3, z: 0, color: 'red' },
    ],
    solution: { '3,3': 3, '4,5': 1, '1,5': 3, '1,6': 3, '0,6': 1, '0,3': 3 },
  },
  // Platz im Spiel: nach „Quarz“
  {
    // Lösung: Spiegel (6,2) rot 3 · Spiegel (2,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (6,4) rot 1 ·
    //   Prisma (2,5) rot 5 · Spiegel (0,5) rot 1
    // Generator mittel-abzaehlen, Seed 10278 · Ausbau „mittel“
    name: 'Guckkasten', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'white' },
      { type: 'target', x: 1, z: 4, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 3, color: 'red' },
    ],
    solution: { '6,2': 3, '2,2': 1, '2,4': 1, '6,4': 1, '2,5': 5, '0,5': 1 },
  },
  // Platz im Spiel: nach „Guckkasten“
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (4,4) rot 1 · Spiegel (2,4) rot 3 · Spiegel (2,2) rot 1 ·
    //   Prisma (4,5) rot 5 · Spiegel (1,5) rot 3
    // Generator mittel-abzaehlen, Seed 10190 · Ausbau „mittel“
    name: 'Aquarell', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'blue' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '4,2': 1, '4,4': 1, '2,4': 3, '2,2': 1, '4,5': 5, '1,5': 3 },
  },
  // Platz im Spiel: nach „Aquarell“
  {
    // Lösung: Prisma (0,5) rot 7 · Spiegel (0,2) rot 3 · Spiegel (6,2) rot 1 · Spiegel (6,4) rot 3 ·
    //   Spiegel (3,4) rot 1 · Spiegel (4,6) rot 3
    // Generator mittel-sammelstelle, Seed 66, Ziel 43,01–43,73 · ersetzt Farbwechsel (Austausch „mittel“)
    name: 'Farbfang', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 5, rot: 0 },
      { type: 'source', x: 1, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'target', x: 4, z: 1, color: 'green' },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'target', x: 2, z: 6, color: 'red' },
    ],
    solution: { '0,5': 7, '0,2': 3, '6,2': 1, '6,4': 3, '3,4': 1, '4,6': 3 },
  },
  // Platz im Spiel: nach „Bronze“
  {
    // Lösung: Prisma (4,4) rot 3 · Spiegel (4,6) rot 1 · Spiegel (3,4) rot 3 · Spiegel (3,5) rot 3 ·
    //   Prisma (1,4) rot 1
    // Generator mittel-falle, Seed 10207 · Ausbau „mittel“
    name: 'Strömung', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'cyan' },
      { type: 'prism', x: 1, z: 4, rot: 4 },
      { type: 'target', x: 1, z: 5, color: 'blue' },
    ],
    solution: { '4,4': 3, '4,6': 1, '3,4': 3, '3,5': 3, '1,4': 1 },
  },
  // Platz im Spiel: nach „Strömung“
  {
    // Lösung: Spiegel (1,1) rot 1 · Spiegel (3,4) rot 1 · Spiegel (5,2) rot 3 · Spiegel (6,2) rot 1 ·
    //   Spiegel (6,3) rot 3 · Spiegel (1,3) rot 1
    // Generator mittel-mischziel, Seed 10952 · Ausbau „mittel“
    name: 'Springbrunnen', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'green' },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'target', x: 3, z: 1, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 1, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,1': 1, '3,4': 1, '5,2': 3, '6,2': 1, '6,3': 3, '1,3': 1 },
  },
  // Platz im Spiel: nach „Springbrunnen“
  {
    // Lösung: Spiegel (5,6) rot 1 · Spiegel (5,3) rot 1 · Spiegel (1,3) rot 1 · Spiegel (1,6) rot 3 ·
    //   Prisma (5,1) rot 3 · Spiegel (0,1) rot 3
    // Generator mittel-abzaehlen, Seed 10658 · Ausbau „mittel“
    name: 'Karmin', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'target', x: 1, z: 0, color: 'magenta' },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'prism', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '5,6': 1, '5,3': 1, '1,3': 1, '1,6': 3, '5,1': 3, '0,1': 3 },
  },
  // Platz im Spiel: nach „Karmin“
  {
    // Lösung: Prisma (1,1) rot 2 · Spiegel (4,3) rot 2 · Spiegel (6,5) rot 2 · Prisma (5,6) rot 5 ·
    //   Spiegel (5,3) rot 3
    // Generator mittel-sammelstelle, Seed 10231 · Ausbau „mittel“
    name: 'Ultramarin', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'green' },
      { type: 'source', x: 2, z: 0, dir: 3, color: 'blue' },
      { type: 'target', x: 1, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'prism', x: 5, z: 6, rot: 7 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
    ],
    solution: { '1,1': 2, '4,3': 2, '6,5': 2, '5,6': 5, '5,3': 3 },
  },
  // Platz im Spiel: nach „Ultramarin“
  {
    // Lösung: Prisma (3,3) rot 1 · Spiegel (3,6) rot 1 · Spiegel (4,6) rot 3 · Spiegel (4,0) rot 3 ·
    //   Spiegel (5,0) rot 1
    // Generator mittel-sammelstelle, Seed 10570 · Ausbau „mittel“
    name: 'Kreistanz', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 3, rot: 5 },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'green' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 5, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
    ],
    solution: { '3,3': 1, '3,6': 1, '4,6': 3, '4,0': 3, '5,0': 1 },
  },
  // Platz im Spiel: nach „Krokus“
  {
    // Lösung: Spiegel (6,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (3,5) rot 1 · Spiegel (6,5) rot 1 ·
    //   Prisma (6,1) rot 2 · Spiegel (5,2) rot 0
    // Generator mittel-abzaehlen, Seed 10417 · Ausbau „mittel“
    name: 'Bergkristall', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' },
      { type: 'target', x: 6, z: 6, color: 'cyan' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'target', x: 3, z: 2, color: 'green' },
      { type: 'prism', x: 6, z: 1, rot: 4 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 2, z: 1, color: 'blue' },
    ],
    solution: { '6,3': 3, '3,3': 1, '3,5': 1, '6,5': 1, '6,1': 2, '5,2': 0 },
  },
  // Platz im Spiel: nach „Bergkristall“
  {
    // Lösung: Spiegel (0,2) rot 3 · Prisma (5,2) rot 5 · Spiegel (4,4) rot 3 · Spiegel (4,6) rot 1 ·
    //   Spiegel (0,4) rot 1 · Kombinator (4,1) dir 6
    // Wertung 28.7 · 6 drehbar · 2 Ziele · Rateschritte 223 · Profil 3-misch, Seed 1157
    name: 'Lichtnetz', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'prism', x: 5, z: 2, rot: 3 },
      { type: 'combiner', x: 4, z: 1, dir: 5 },
      { type: 'blocker', x: 2, z: 1 },
      { type: 'target', x: 4, z: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 6, color: 'white' },
    ],
    solution: { '0,2': 3, '5,2': 5, '4,4': 3, '4,6': 1, '0,4': 1, '4,1': 6 },
  },
  // Platz im Spiel: nach „Lichtnetz“
  {
    // Lösung: Spiegel (2,6) rot 3 · Spiegel (2,2) rot 1 · Spiegel (2,4) rot 3 · Prisma (4,2) rot 2 ·
    //   Prisma (2,3) rot 7
    // Wertung 25.2 · 5 drehbar · 3 Ziele · Rateschritte 81 · Profil 3-prisma, Seed 578
    name: 'Glasfenster', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'prism', x: 2, z: 3, rot: 2 },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'white' },
      { type: 'target', x: 4, z: 6, color: 'green' },
    ],
    solution: { '2,6': 3, '2,2': 1, '2,4': 3, '4,2': 2, '2,3': 7 },
  },
  // Platz im Spiel: nach „Glasfenster“
  {
    // Lösung: Prisma (5,4) rot 5 · Spiegel (3,4) rot 3 · Spiegel (5,3) rot 1 · Spiegel (4,3) rot 1 ·
    //   Spiegel (4,1) rot 1 · Spiegel (3,0) rot 1 · Spiegel (2,4) rot 3
    // Generator mittel-falle, Seed 10346 · Ausbau „mittel“
    name: 'Reigen', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 6, color: 'white' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
    ],
    solution: { '5,4': 5, '3,4': 3, '5,3': 1, '4,3': 1, '4,1': 1, '3,0': 1, '2,4': 3 },
  },
  // Platz im Spiel: nach „Reigen“
  {
    // Lösung: Spiegel (2,3) rot 1 · Spiegel (4,3) rot 1 · Spiegel (4,5) rot 1 · Spiegel (2,5) rot 3 ·
    //   Prisma (5,3) rot 5 · Spiegel (5,2) rot 3
    // Generator mittel-abzaehlen, Seed 10549 · Ausbau „mittel“
    name: 'Lichtzelt', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'magenta' },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'prism', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '2,3': 1, '4,3': 1, '4,5': 1, '2,5': 3, '5,3': 5, '5,2': 3 },
  },
  // Platz im Spiel: nach „Enzian“
  {
    // Lösung: Spiegel (3,3) rot 3 · Spiegel (4,4) rot 1 · Spiegel (4,0) rot 1 · Spiegel (3,4) rot 3 ·
    //   Spiegel (3,5) rot 1 · Spiegel (4,6) rot 3 · Spiegel (1,6) rot 1
    // Generator mittel-abschalten, Seed 10722 · Ausbau „mittel“
    name: 'Gebirgsbach', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'target', x: 1, z: 2, color: 'green' },
    ],
    solution: { '3,3': 3, '4,4': 1, '4,0': 1, '3,4': 3, '3,5': 1, '4,6': 3, '1,6': 1 },
  },
  // Platz im Spiel: nach „Gebirgsbach“
  {
    // Lösung: Prisma (5,4) rot 6 · Spiegel (5,6) rot 3 · Spiegel (3,1) rot 1 · Prisma (3,4) rot 5 ·
    //   Spiegel (2,3) rot 0
    // Generator mittel-sammelstelle, Seed 10082 · Ausbau „mittel“
    name: 'Indigo', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 5 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 3 },
      { type: 'prism', x: 3, z: 4, rot: 4 },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
    ],
    solution: { '5,4': 6, '5,6': 3, '3,1': 1, '3,4': 5, '2,3': 0 },
  },
  // Platz im Spiel: nach „Indigo“
  {
    // Lösung: Prisma (3,4) rot 0 · Spiegel (2,3) rot 2 · Spiegel (1,6) rot 0 · Spiegel (3,3) rot 2 ·
    //   Prisma (4,2) rot 7
    // Generator mittel-sammelstelle, Seed 10380 · Ausbau „mittel“
    name: 'Wasserfall', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 5 },
      { type: 'source', x: 5, z: 0, dir: 3, color: 'green' },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'source', x: 0, z: 5, dir: 1, color: 'red' },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'target', x: 6, z: 4, color: 'green' },
      { type: 'target', x: 5, z: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'red' },
    ],
    solution: { '3,4': 0, '2,3': 2, '1,6': 0, '3,3': 2, '4,2': 7 },
  },
  // Platz im Spiel: nach „Wasserfall“
  {
    // Lösung: Prisma (6,1) rot 3 · Spiegel (1,1) rot 1 · Spiegel (1,0) rot 3 · Spiegel (0,1) rot 3 ·
    //   Spiegel (0,4) rot 1
    // Generator mittel-sammelstelle, Seed 11129 · Ausbau „mittel“
    name: 'Prismenglas', grad: 'mittel',
    elements: [
      { type: 'prism', x: 6, z: 1, rot: 4 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 1, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'target', x: 3, z: 4, color: 'cyan' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
    ],
    solution: { '6,1': 3, '1,1': 1, '1,0': 3, '0,1': 3, '0,4': 1 },
  },
  // Platz im Spiel: nach „Prismenglas“
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (2,2) rot 3 · Spiegel (1,5) rot 3 · Spiegel (6,2) rot 3 ·
    //   Prisma (6,1) rot 5
    // Generator mittel-mischziel, Seed 11177 · Ausbau „mittel“
    name: 'Glaswand', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 3, color: 'white' },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'prism', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 1, color: 'red' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '5,2': 3, '2,2': 3, '1,5': 3, '6,2': 3, '6,1': 5 },
  },
  // Platz im Spiel: nach „Glaswand“
  {
    // Lösung: Spiegel (2,2) rot 3 · Spiegel (0,1) rot 1 · Prisma (2,1) rot 1 · Spiegel (1,2) rot 1 ·
    //   Spiegel (5,1) rot 3
    // Generator mittel-mischziel, Seed 11058 · Ausbau „mittel“
    name: 'Ocker', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'target', x: 5, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'prism', x: 2, z: 1, rot: 4 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 2, fixed: true },
      { type: 'mirror', x: 3, z: 4, rot: 2, fixed: true },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 5, color: 'green' },
    ],
    solution: { '2,2': 3, '0,1': 1, '2,1': 1, '1,2': 1, '5,1': 3 },
  },
  // Platz im Spiel: nach „Europa“
  {
    // Lösung: Spiegel (2,4) rot 3 · Spiegel (3,0) rot 3 · Spiegel (2,2) rot 1 · Spiegel (1,4) rot 1 ·
    //   Spiegel (1,0) rot 1
    // Generator mittel-mischziel, Seed 10957 · Ausbau „mittel“
    name: 'Kallisto', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'green' },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 3, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'filter', x: 1, z: 3, color: 'green' },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 1, fixed: true },
      { type: 'target', x: 5, z: 1, color: 'green' },
    ],
    solution: { '2,4': 3, '3,0': 3, '2,2': 1, '1,4': 1, '1,0': 1 },
  },
  // Platz im Spiel: nach „Bachlauf“
  {
    // Lösung: Prisma (2,4) rot 6 · Spiegel (2,1) rot 3 · Spiegel (2,5) rot 3 · Spiegel (4,5) rot 3 ·
    //   Spiegel (4,1) rot 3
    // Wertung 26.7 · 5 drehbar · 3 Ziele · Rateschritte 125 · Profil mittel/3-filter, Seed 2000121
    name: 'Schattenspiel', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 6, z: 4, rot: 0, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 2, z: 4, rot: 3 },
      { type: 'filter', x: 5, z: 5, color: 'cyan' },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 5, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 5, color: 'cyan' },
    ],
    solution: { '2,4': 6, '2,1': 3, '2,5': 3, '4,5': 3, '4,1': 3 },
  },
  // Platz im Spiel: nach „Schattenspiel“
  {
    // Lösung: Prisma (5,1) rot 3 · Spiegel (5,2) rot 1 · Spiegel (2,1) rot 0 · Prisma (1,2) rot 7 ·
    //   Spiegel (4,1) rot 3
    // Wertung 30.9 · 5 drehbar · 4 Ziele · Rateschritte 306 · Profil mittel2/b-3-prisma, Seed 4000951
    name: 'Lichtharfe', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'source', x: 4, z: 0, dir: 1 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 1, fixed: true },
      { type: 'prism', x: 5, z: 1, rot: 7 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'target', x: 1, z: 0, color: 'white' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 4, z: 3, color: 'cyan' },
      { type: 'target', x: 2, z: 4, color: 'green' },
    ],
    solution: { '5,1': 3, '5,2': 1, '2,1': 0, '1,2': 7, '4,1': 3 },
  },
  // Platz im Spiel: nach „Lichtharfe“
  {
    // Lösung: Spiegel (5,1) rot 3 · Spiegel (5,3) rot 3 · Spiegel (1,0) rot 1 · Spiegel (0,5) rot 2 ·
    //   Prisma (4,1) rot 1
    // Generator mittel-mischziel, Seed 15, Ziel 44,28–45,68 · ersetzt Verästelung (Austausch „mittel“)
    name: 'Farbbrücke', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'cyan' },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'source', x: 1, z: 6, dir: 5 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'prism', x: 4, z: 1, rot: 7 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
    ],
    solution: { '5,1': 3, '5,3': 3, '1,0': 1, '0,5': 2, '4,1': 1 },
  },
  // Platz im Spiel: nach „Farbbrücke“
  {
    // Lösung: Spiegel (0,2) rot 1 · Spiegel (2,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (0,4) rot 3 ·
    //   Prisma (4,2) rot 3 · Spiegel (4,6) rot 3
    // Generator mittel-abzaehlen, Seed 218, Ziel 44,28–45,68 · ersetzt Tagesanbruch (Austausch „mittel“)
    name: 'Morgenblau', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'target', x: 2, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'prism', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 3, color: 'red' },
    ],
    solution: { '0,2': 1, '2,2': 1, '2,4': 1, '0,4': 3, '4,2': 3, '4,6': 3 },
  },
  // Platz im Spiel: nach „Lichtfeder“
  {
    // Lösung: Prisma (5,4) rot 6 · Spiegel (3,2) rot 0 · Spiegel (6,3) rot 2 · Spiegel (5,2) rot 2 ·
    //   Spiegel (3,0) rot 0 · Spiegel (6,1) rot 2
    // Generator mittel-falle, Seed 236, Ziel 43,75–44,14 · ersetzt Kreuzweg (Austausch „mittel“)
    name: 'Serpentine', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 7, color: 'magenta' },
      { type: 'prism', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'target', x: 1, z: 4, color: 'red' },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'mirror', x: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'filter', x: 1, z: 2, color: 'yellow' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '5,4': 6, '3,2': 0, '6,3': 2, '5,2': 2, '3,0': 0, '6,1': 2 },
  },
  // Platz im Spiel: nach „Weissglut“
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,5) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (1,5) rot 1 · Prisma (3,1) rot 3
    // Generator mittel-abzaehlen, Seed 112, Ziel 45,7–46,01 · ersetzt Schnittstelle (Austausch „mittel“)
    name: 'Reflex', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'prism', x: 1, z: 5, rot: 6 },
      { type: 'prism', x: 3, z: 1, rot: 4 },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'blocker', x: 5, z: 1 },
    ],
    solution: { '3,2': 1, '6,2': 3, '6,5': 1, '3,5': 1, '1,5': 1, '3,1': 3 },
  },
  // Platz im Spiel: nach „Malachit“
  {
    // Lösung: Spiegel (4,3) rot 1 · Spiegel (2,3) rot 1 · Spiegel (2,1) rot 1 · Spiegel (4,1) rot 1 ·
    //   Prisma (1,3) rot 1 · Spiegel (1,5) rot 3
    // Generator mittel-abzaehlen, Seed 10338 · Ausbau „mittel“
    name: 'Lapislazuli', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'prism', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 4, color: 'blue' },
    ],
    solution: { '4,3': 1, '2,3': 1, '2,1': 1, '4,1': 1, '1,3': 1, '1,5': 3 },
  },
  // Platz im Spiel: nach „Meeresleuchten“
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (4,3) rot 1 · Spiegel (6,3) rot 3 · Spiegel (6,5) rot 1 ·
    //   Prisma (4,1) rot 3 · Spiegel (3,1) rot 3
    // Generator mittel-abzaehlen, Seed 10542 · Ausbau „mittel“
    name: 'Edelweiss', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 2, z: 3, color: 'white' },
      { type: 'prism', x: 4, z: 1, rot: 5 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '4,5': 1, '4,3': 1, '6,3': 3, '6,5': 1, '4,1': 3, '3,1': 3 },
  },
  // Platz im Spiel: nach „Edelweiss“
  {
    // Lösung: Prisma (2,0) rot 1 · Spiegel (0,0) rot 3 · Spiegel (1,1) rot 2 · Prisma (3,5) rot 7 ·
    //   Spiegel (6,2) rot 2
    // Generator mittel-sammelstelle, Seed 10244 · Ausbau „mittel“
    name: 'Jade', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 0, rot: 3 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 0, z: 0, rot: 1 },
      { type: 'source', x: 6, z: 6, dir: 5, color: 'green' },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'target', x: 4, z: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 4, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 5 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 5, color: 'blue' },
      { type: 'target', x: 3, z: 2, color: 'red' },
    ],
    solution: { '2,0': 1, '0,0': 3, '1,1': 2, '3,5': 7, '6,2': 2 },
  },
  // Platz im Spiel: nach „Jade“
  {
    // Lösung: Prisma (5,5) rot 5 · Spiegel (5,6) rot 1 · Spiegel (0,3) rot 1 · Spiegel (3,5) rot 1 ·
    //   Spiegel (3,2) rot 3
    // Generator mittel-sammelstelle, Seed 10520 · Ausbau „mittel“
    name: 'Sternenregen', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'source', x: 4, z: 6, dir: 7, color: 'green' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'red' },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'red' },
    ],
    solution: { '5,5': 5, '5,6': 1, '0,3': 1, '3,5': 1, '3,2': 3 },
  },
  // Platz im Spiel: nach „Sternenregen“
  {
    // Lösung: Spiegel (3,3) rot 1 · Spiegel (5,3) rot 1 · Spiegel (5,5) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (3,1) rot 3 · Spiegel (1,1) rot 3
    // Generator mittel-abzaehlen, Seed 10759 · Ausbau „mittel“
    name: 'Farbenrad', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 3, color: 'yellow' },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '3,3': 1, '5,3': 1, '5,5': 1, '3,5': 1, '3,1': 3, '1,1': 3 },
  },
  // Platz im Spiel: nach „Farbenrad“
  {
    // Lösung: Prisma (4,5) rot 0 · Spiegel (3,4) rot 0 · Spiegel (4,6) rot 1 · Spiegel (2,0) rot 1 ·
    //   Prisma (1,0) rot 4
    // Generator mittel-sammelstelle, Seed 68, Ziel 45,7–46,88 · ersetzt Funkenflug (Austausch „mittel“)
    name: 'Karussell', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 6 },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'green' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'prism', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 5, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 3, z: 2, color: 'red' },
    ],
    solution: { '4,5': 0, '3,4': 0, '4,6': 1, '2,0': 1, '1,0': 4 },
  },
  // Platz im Spiel: nach „Karussell“
  {
    // Lösung: Prisma (2,4) rot 0 · Spiegel (4,2) rot 2 · Spiegel (3,5) rot 0 · Spiegel (4,4) rot 0 ·
    //   Spiegel (5,3) rot 1 · Prisma (5,5) rot 1
    // Generator mittel-falle, Seed 10598 · Ausbau „mittel“
    name: 'Flussbett', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'prism', x: 5, z: 5, rot: 5 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'blue' },
    ],
    solution: { '2,4': 0, '4,2': 2, '3,5': 0, '4,4': 0, '5,3': 1, '5,5': 1 },
  },
  // Platz im Spiel: nach „Flussbett“
  {
    // Lösung: Prisma (4,2) rot 5 · Spiegel (4,0) rot 3 · Spiegel (3,2) rot 1 · Spiegel (3,1) rot 1 ·
    //   Spiegel (2,1) rot 3 · Spiegel (2,5) rot 3 · Prisma (0,2) rot 3
    // Generator mittel-falle, Seed 10100 · Ausbau „mittel“
    name: 'Topas', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'target', x: 1, z: 5, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 3 },
      { type: 'prism', x: 0, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '4,2': 5, '4,0': 3, '3,2': 1, '3,1': 1, '2,1': 3, '2,5': 3, '0,2': 3 },
  },
  // Platz im Spiel: nach „Topas“
  {
    // Lösung: Spiegel (2,3) rot 3 · Spiegel (5,3) rot 1 · Prisma (1,1) rot 3 · Spiegel (1,5) rot 1 ·
    //   Spiegel (0,1) rot 1 · Spiegel (0,0) rot 3
    // Generator mittel-mischziel, Seed 84, Ziel 46,09–46,94 · ersetzt Sonnenstrahl (Austausch „mittel“)
    name: 'Sonnenglanz', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 3 },
      { type: 'prism', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'target', x: 1, z: 0, color: 'blue' },
    ],
    solution: { '2,3': 3, '5,3': 1, '1,1': 3, '1,5': 1, '0,1': 1, '0,0': 3 },
  },
  // Platz im Spiel: nach „Sonnenglanz“
  {
    // Lösung: Spiegel (6,1) rot 3 · Spiegel (1,5) rot 1 · Spiegel (1,1) rot 1 · Spiegel (5,5) rot 3 ·
    //   Spiegel (5,6) rot 3 · Spiegel (5,1) rot 3 · Prisma (2,5) rot 3
    // Wertung 22.4 · 7 drehbar · 3 Ziele · Rateschritte 39 · Profil 4-bunt, Seed 22268
    name: 'Streulicht', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 2, fixed: true },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 5, rot: 4 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 3, z: 1, color: 'white' },
      { type: 'target', x: 1, z: 6, color: 'green' },
    ],
    solution: { '6,1': 3, '1,5': 1, '1,1': 1, '5,5': 3, '5,6': 3, '5,1': 3, '2,5': 3 },
  },
  // Platz im Spiel: nach „Spektrum“
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (1,4) rot 3 · Spiegel (5,3) rot 1 · Spiegel (5,4) rot 1 ·
    //   Prisma (1,3) rot 7 · Spiegel (4,1) rot 1 · Prisma (1,1) rot 4
    // Wertung 28.4 · 7 drehbar · 3 Ziele · Rateschritte 160 · Profil mittel2/b-3-prisma, Seed 4003369
    name: 'Strahlenkranz', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'prism', x: 1, z: 1, rot: 1 },
      { type: 'prism', x: 1, z: 3, rot: 1 },
      { type: 'target', x: 3, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '4,4': 1, '1,4': 3, '5,3': 1, '5,4': 1, '1,3': 7, '4,1': 1, '1,1': 4 },
  },
  // Platz im Spiel: nach „Granat“
  {
    // Lösung: Spiegel (5,5) rot 1 · Spiegel (5,3) rot 1 · Spiegel (2,3) rot 1 · Spiegel (2,5) rot 1 ·
    //   Prisma (5,1) rot 3 · Spiegel (1,5) rot 0
    // Generator mittel-abzaehlen, Seed 10598 · Ausbau „mittel“
    name: 'Lichtspiel', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'prism', x: 5, z: 1, rot: 5 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 4, color: 'green' },
    ],
    solution: { '5,5': 1, '5,3': 1, '2,3': 1, '2,5': 1, '5,1': 3, '1,5': 0 },
  },
  // Platz im Spiel: nach „Lichtspiel“
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (5,5) rot 3 · Spiegel (6,5) rot 3 · Spiegel (2,4) rot 1 ·
    //   Spiegel (1,4) rot 1 · Spiegel (1,2) rot 1 · Spiegel (0,2) rot 3 · Spiegel (0,5) rot 1
    // Generator mittel-abschalten, Seed 10934 · Ausbau „mittel“
    name: 'Achat', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 6, z: 4, color: 'green' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 2, color: 'green' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 0, color: 'magenta' },
    ],
    solution: { '4,4': 1, '5,5': 3, '6,5': 3, '2,4': 1, '1,4': 1, '1,2': 1, '0,2': 3, '0,5': 1 },
  },
  // Platz im Spiel: nach „Achat“
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (2,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (4,4) rot 1 ·
    //   Prisma (5,4) rot 5 · Spiegel (5,0) rot 3
    // Generator mittel-abzaehlen, Seed 145, Ziel 46,96–47,88 · ersetzt Geflecht (Austausch „mittel“)
    name: 'Diagonale', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 1, z: 4, color: 'red' },
      { type: 'prism', x: 5, z: 4, rot: 4 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'blue' },
    ],
    solution: { '4,2': 1, '2,2': 1, '2,4': 1, '4,4': 1, '5,4': 5, '5,0': 3 },
  },
  // Platz im Spiel: nach „Diagonale“
  {
    // Lösung: Prisma (2,5) rot 0 · Spiegel (2,4) rot 1 · Spiegel (4,3) rot 0 · Spiegel (6,5) rot 2 ·
    //   Spiegel (3,0) rot 3
    // Generator mittel-sammelstelle, Seed 10481 · Ausbau „mittel“
    name: 'Alpenglühen', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 5, rot: 4 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'target', x: 5, z: 5, color: 'green' },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'source', x: 6, z: 0, dir: 4 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'filter', x: 3, z: 1, color: 'red' },
    ],
    solution: { '2,5': 0, '2,4': 1, '4,3': 0, '6,5': 2, '3,0': 3 },
  },
  // Platz im Spiel: nach „Alpenglühen“
  {
    // Lösung: Spiegel (2,5) rot 1 · Spiegel (2,4) rot 1 · Spiegel (4,4) rot 3 · Spiegel (4,0) rot 1 ·
    //   Spiegel (6,1) rot 1 · Spiegel (1,1) rot 1
    // Generator mittel-mischziel, Seed 10893 · Ausbau „mittel“
    name: 'Pirouette', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 1, z: 4, color: 'cyan' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'green' },
      { type: 'mirror', x: 2, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'target', x: 1, z: 0, color: 'green' },
    ],
    solution: { '2,5': 1, '2,4': 1, '4,4': 3, '4,0': 1, '6,1': 1, '1,1': 1 },
  },
  // Platz im Spiel: nach „Pirouette“
  {
    // Lösung: Spiegel (3,5) rot 3 · Spiegel (6,5) rot 3 · Spiegel (3,4) rot 3 · Prisma (2,2) rot 7 ·
    //   Spiegel (2,1) rot 3 · Spiegel (0,4) rot 1
    // Generator mittel-mischziel, Seed 100, Ziel 46,96–47,88 · ersetzt Drehscheibe (Austausch „mittel“)
    name: 'Lichtwaage', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 3, color: 'red' },
    ],
    solution: { '3,5': 3, '6,5': 3, '3,4': 3, '2,2': 7, '2,1': 3, '0,4': 1 },
  },
  // Platz im Spiel: nach „Lichtwaage“
  {
    // Lösung: Spiegel (0,3) rot 3 · Spiegel (5,4) rot 1 · Spiegel (5,1) rot 3 · Prisma (0,4) rot 6 ·
    //   Spiegel (4,1) rot 1 · Spiegel (0,5) rot 3 · Spiegel (6,1) rot 3
    // Wertung 29.7 · 7 drehbar · 4 Ziele · Rateschritte 211 · Profil mittel2/b-4-bunt, Seed 4114550
    name: 'Turmalin', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 0, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 0, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 0, color: 'white' },
      { type: 'target', x: 2, z: 2, color: 'blue' },
      { type: 'target', x: 6, z: 3, color: 'green' },
    ],
    solution: { '0,3': 3, '5,4': 1, '5,1': 3, '0,4': 6, '4,1': 1, '0,5': 3, '6,1': 3 },
  },
  // Platz im Spiel: nach „Turmalin“
  {
    // Lösung: Spiegel (3,3) rot 3 · Spiegel (5,5) rot 3 · Spiegel (5,0) rot 1 · Spiegel (3,4) rot 1 ·
    //   Spiegel (3,6) rot 1 · Spiegel (5,6) rot 3 · Spiegel (6,5) rot 3 · Spiegel (2,4) rot 1
    // Generator mittel-abschalten, Seed 235, Ziel 47,9–48,51 · ersetzt Legierung (Austausch „mittel“)
    name: 'Goldwechsel', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 4, color: 'yellow' },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '3,3': 3, '5,5': 3, '5,0': 1, '3,4': 1, '3,6': 1, '5,6': 3, '6,5': 3, '2,4': 1 },
  },
  // Platz im Spiel: nach „Goldwechsel“
  {
    // Lösung: Spiegel (2,2) rot 0 · Spiegel (1,5) rot 2 · Spiegel (0,4) rot 2 · Spiegel (4,0) rot 0 ·
    //   Spiegel (6,2) rot 2 · Spiegel (5,3) rot 0 · Spiegel (2,4) rot 0
    // Generator mittel-abschalten, Seed 10744 · Ausbau „mittel“
    name: 'Farbmuster', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'target', x: 1, z: 3, color: 'green' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'green' },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'magenta' },
      { type: 'mirror', x: 2, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
    ],
    solution: { '2,2': 0, '1,5': 2, '0,4': 2, '4,0': 0, '6,2': 2, '5,3': 0, '2,4': 0 },
  },
  // Platz im Spiel: nach „Farbtafel“
  {
    // Lösung: Spiegel (5,1) rot 3 · Spiegel (1,2) rot 3 · Spiegel (6,2) rot 3 · Spiegel (3,1) rot 1 ·
    //   Spiegel (3,5) rot 3 · Spiegel (3,0) rot 3 · Spiegel (0,5) rot 3 · Spiegel (1,1) rot 3
    // Generator mittel-abschalten, Seed 10493 · Ausbau „mittel“
    name: 'Mündung', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'target', x: 6, z: 1, color: 'yellow' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'yellow' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
    ],
    solution: { '5,1': 3, '1,2': 3, '6,2': 3, '3,1': 1, '3,5': 3, '3,0': 3, '0,5': 3, '1,1': 3 },
  },
  // Platz im Spiel: nach „Brillenglas“
  {
    // Lösung: Prisma (1,0) rot 1 · Spiegel (3,5) rot 0 · Prisma (5,3) rot 6 · Spiegel (4,2) rot 2 ·
    //   Spiegel (6,5) rot 2
    // Generator mittel-sammelstelle, Seed 56, Ziel 48,53–49,45 · ersetzt Paravent (Austausch „mittel“)
    name: 'Zitronenlicht', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 0, rot: 2 },
      { type: 'source', x: 0, z: 1, dir: 7, color: 'yellow' },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'yellow' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'prism', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'target', x: 5, z: 6, color: 'green' },
    ],
    solution: { '1,0': 1, '3,5': 0, '5,3': 6, '4,2': 2, '6,5': 2 },
  },
  // Platz im Spiel: nach „Ganymed“
  {
    // Lösung: Prisma (6,2) rot 4 · Prisma (2,1) rot 4 · Spiegel (1,0) rot 0 · Prisma (2,5) rot 0 ·
    //   Spiegel (3,4) rot 2 · Spiegel (2,3) rot 0
    // Generator mittel-sammelstelle, Seed 215, Ziel 47,9–48,51 · ersetzt Laterne (Austausch „mittel“)
    name: 'Lichtzange', grad: 'mittel',
    elements: [
      { type: 'prism', x: 6, z: 2, rot: 3 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 3, z: 5, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'prism', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 2, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'blocker', x: 1, z: 1 },
    ],
    solution: { '6,2': 4, '2,1': 4, '1,0': 0, '2,5': 0, '3,4': 2, '2,3': 0 },
  },
  // Platz im Spiel: nach „Lichtzange“
  {
    // Lösung: Spiegel (3,4) rot 3 · Spiegel (1,4) rot 3 · Spiegel (2,5) rot 1 · Prisma (4,0) rot 1 ·
    //   Spiegel (5,0) rot 1 · Spiegel (5,5) rot 3
    // Generator mittel-mischziel, Seed 10382 · Ausbau „mittel“
    name: 'Rosenquarz', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'target', x: 1, z: 5, color: 'yellow' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'prism', x: 4, z: 0, rot: 7 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '3,4': 3, '1,4': 3, '2,5': 1, '4,0': 1, '5,0': 1, '5,5': 3 },
  },
  // Platz im Spiel: nach „Kobalt“
  {
    // Lösung: Prisma (1,1) rot 5 · Spiegel (0,1) rot 3 · Spiegel (0,2) rot 1 · Spiegel (4,2) rot 1 ·
    //   Spiegel (4,6) rot 3 · Spiegel (3,6) rot 1 · Spiegel (3,3) rot 1 · Spiegel (2,3) rot 3
    // Generator mittel-sammelstelle, Seed 10932 · Ausbau „mittel“
    name: 'Fjord', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 1, rot: 4 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 2, z: 0, dir: 3, color: 'green' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'red' },
    ],
    solution: { '1,1': 5, '0,1': 3, '0,2': 1, '4,2': 1, '4,6': 3, '3,6': 1, '3,3': 1, '2,3': 3 },
  },
  // Platz im Spiel: nach „Fjord“
  {
    // Lösung: Spiegel (2,1) rot 3 · Spiegel (1,2) rot 3 · Spiegel (0,2) rot 1 · Spiegel (0,1) rot 3 ·
    //   Spiegel (2,0) rot 3 · Prisma (4,0) rot 0
    // Generator mittel-mischziel, Seed 10275 · Ausbau „mittel“
    name: 'Phobos', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'target', x: 2, z: 4, color: 'white' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'prism', x: 4, z: 0, rot: 5 },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
    ],
    solution: { '2,1': 3, '1,2': 3, '0,2': 1, '0,1': 3, '2,0': 3, '4,0': 0 },
  },
  // Platz im Spiel: nach „Phobos“
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (4,5) rot 1 · Spiegel (2,5) rot 1 · Prisma (3,5) rot 5 ·
    //   Spiegel (3,4) rot 1 · Spiegel (1,4) rot 3 · Spiegel (0,2) rot 2
    // Wertung 30.1 · 7 drehbar · 4 Ziele · Rateschritte 285 · Profil 4-filter, Seed 121311
    name: 'Farbschleuse', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 1, fixed: true },
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'filter', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'target', x: 5, z: 5, color: 'red' },
    ],
    solution: { '3,1': 3, '4,5': 1, '2,5': 1, '3,5': 5, '3,4': 1, '1,4': 3, '0,2': 2 },
  },
  // Platz im Spiel: nach „Farbschleuse“
  {
    // Lösung: Prisma (4,5) rot 2 · Spiegel (5,4) rot 0 · Spiegel (4,1) rot 2 · Spiegel (3,0) rot 0 ·
    //   Prisma (0,3) rot 2
    // Generator mittel-sammelstelle, Seed 10389 · Ausbau „mittel“
    name: 'Zinnober', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'source', x: 0, z: 1, dir: 1, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'green' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'prism', x: 0, z: 3, rot: 3 },
    ],
    solution: { '4,5': 2, '5,4': 0, '4,1': 2, '3,0': 0, '0,3': 2 },
  },
  // Platz im Spiel: nach „Zinnober“
  {
    // Lösung: Prisma (5,1) rot 3 · Spiegel (1,1) rot 1 · Spiegel (5,6) rot 1 · Spiegel (3,1) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (4,2) rot 2 · Kombinator (5,3) dir 0
    // Wertung 32.8 · 7 drehbar · 3 Ziele · Rateschritte 408 · Profil mittel2/b-4-misch, Seed 4054108
    name: 'Perlmutt', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 5, z: 1, rot: 7 },
      { type: 'combiner', x: 5, z: 3, dir: 1 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 3, color: 'yellow' },
      { type: 'target', x: 6, z: 6, color: 'white' },
    ],
    solution: { '5,1': 3, '1,1': 1, '5,6': 1, '3,1': 1, '5,5': 1, '4,2': 2, '5,3': 0 },
  },
  // Platz im Spiel: nach „Perlmutt“
  {
    // Lösung: Prisma (2,4) rot 5 · Spiegel (2,2) rot 3 · Spiegel (1,4) rot 1 · Spiegel (1,3) rot 1 ·
    //   Spiegel (0,3) rot 3 · Spiegel (0,6) rot 1 · Spiegel (5,6) rot 3 · Spiegel (5,5) rot 1
    // Generator mittel-falle, Seed 85, Ziel 48,53–49,45 · ersetzt Lichtfaden (Austausch „mittel“)
    name: 'Ehrenrunde', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 6 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 5, color: 'red' },
    ],
    solution: { '2,4': 5, '2,2': 3, '1,4': 1, '1,3': 1, '0,3': 3, '0,6': 1, '5,6': 3, '5,5': 1 },
  },
  // Platz im Spiel: nach „Ehrenrunde“
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (1,1) rot 3 · Spiegel (4,3) rot 0 · Spiegel (5,2) rot 0 ·
    //   Prisma (3,6) rot 5 · Spiegel (2,6) rot 1
    // Generator mittel-mischziel, Seed 163, Ziel 48,53–49,45 · ersetzt Einklang (Austausch „mittel“)
    name: 'Komplement', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'source', x: 1, z: 0, dir: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 2, fixed: true },
      { type: 'prism', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '3,1': 3, '1,1': 3, '4,3': 0, '5,2': 0, '3,6': 5, '2,6': 1 },
  },
  // Platz im Spiel: nach „Komplement“
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (3,5) rot 3 · Spiegel (2,2) rot 3 · Spiegel (0,2) rot 3 ·
    //   Prisma (0,3) rot 1 · Spiegel (4,3) rot 1
    // Generator mittel-mischziel, Seed 10704 · Ausbau „mittel“
    name: 'Zwischenton', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'prism', x: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 4, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'red' },
    ],
    solution: { '5,2': 3, '3,5': 3, '2,2': 3, '0,2': 3, '0,3': 1, '4,3': 1 },
  },
  // Platz im Spiel: nach „Zwischenton“
  {
    // Lösung: Spiegel (1,3) rot 1 · Spiegel (1,4) rot 3 · Prisma (3,3) rot 4 · Spiegel (0,4) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (5,1) rot 1 · Spiegel (0,1) rot 1
    // Wertung 31.7 · 7 drehbar · 3 Ziele · Rateschritte 405 · Profil mittel2/4-bunt, Seed 3012677
    name: 'Bumerang', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 4, rot: 0, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 3, fixed: true },
      { type: 'prism', x: 3, z: 3, rot: 6 },
      { type: 'prism', x: 5, z: 5, rot: 1 },
      { type: 'blocker', x: 2, z: 2 },
      { type: 'target', x: 0, z: 0, color: 'cyan' },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'target', x: 3, z: 6, color: 'red' },
    ],
    solution: { '1,3': 1, '1,4': 3, '3,3': 4, '0,4': 3, '5,5': 5, '5,1': 1, '0,1': 1 },
  },
  // Platz im Spiel: nach „Bergsee“
  {
    // Lösung: Spiegel (2,3) rot 1 · Spiegel (1,5) rot 2 · Prisma (2,4) rot 5 · Spiegel (0,6) rot 1 ·
    //   Spiegel (1,4) rot 1 · Spiegel (1,1) rot 3
    // Generator mittel-mischziel, Seed 10625 · Ausbau „mittel“
    name: 'Drehung', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 5 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'prism', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'target', x: 5, z: 1, color: 'red' },
    ],
    solution: { '2,3': 1, '1,5': 2, '2,4': 5, '0,6': 1, '1,4': 1, '1,1': 3 },
  },
  // Platz im Spiel: nach „Drehung“
  {
    // Lösung: Spiegel (1,4) rot 1 · Spiegel (1,5) rot 1 · Spiegel (6,1) rot 1 · Prisma (1,1) rot 3 ·
    //   Spiegel (0,1) rot 1 · Spiegel (4,4) rot 1
    // Generator mittel-mischziel, Seed 10793 · Ausbau „mittel“
    name: 'Gletscher', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'prism', x: 1, z: 1, rot: 7 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 5, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,4': 1, '1,5': 1, '6,1': 1, '1,1': 3, '0,1': 1, '4,4': 1 },
  },
  // Platz im Spiel: nach „Gletscher“
  {
    // Lösung: Prisma (3,3) rot 7 · Spiegel (5,3) rot 1 · Spiegel (3,2) rot 3 · Spiegel (4,2) rot 3 ·
    //   Spiegel (4,1) rot 1 · Spiegel (2,1) rot 1 · Spiegel (2,0) rot 3 · Spiegel (6,2) rot 1
    // Generator mittel-falle, Seed 10214 · Ausbau „mittel“
    name: 'Eiskristall', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 3, z: 3, rot: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'target', x: 4, z: 5, color: 'white' },
    ],
    solution: { '3,3': 7, '5,3': 1, '3,2': 3, '4,2': 3, '4,1': 1, '2,1': 1, '2,0': 3, '6,2': 1 },
  },
  // Platz im Spiel: nach „Eiskristall“
  {
    // Lösung: Prisma (4,3) rot 5 · Spiegel (5,3) rot 1 · Spiegel (3,4) rot 0 · Prisma (1,6) rot 1 ·
    //   Spiegel (2,6) rot 3 · Spiegel (2,0) rot 3
    // Generator mittel-sammelstelle, Seed 10537 · Ausbau „mittel“
    name: 'Halbton', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 2 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'source', x: 0, z: 1, dir: 1, color: 'blue' },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'prism', x: 1, z: 6, rot: 6 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
    ],
    solution: { '4,3': 5, '5,3': 1, '3,4': 0, '1,6': 1, '2,6': 3, '2,0': 3 },
  },
  // Platz im Spiel: nach „Halbton“
  {
    // Lösung: Spiegel (1,3) rot 1 · Spiegel (3,0) rot 3 · Spiegel (4,0) rot 1 · Spiegel (4,6) rot 1 ·
    //   Spiegel (6,5) rot 1 · Prisma (1,5) rot 6
    // Generator mittel-mischziel, Seed 10299 · Ausbau „mittel“
    name: 'Windrose', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'target', x: 5, z: 3, color: 'white' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'prism', x: 1, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 4, color: 'blue' },
      { type: 'target', x: 0, z: 3, color: 'green' },
    ],
    solution: { '1,3': 1, '3,0': 3, '4,0': 1, '4,6': 1, '6,5': 1, '1,5': 6 },
  },
  // Platz im Spiel: nach „Gipfelkreuz“
  {
    // Lösung: Spiegel (1,4) rot 3 · Spiegel (1,5) rot 1 · Spiegel (5,4) rot 3 · Spiegel (0,5) rot 1 ·
    //   Prisma (5,6) rot 1 · Spiegel (5,3) rot 3 · Spiegel (5,5) rot 1
    // Wertung 27.1 · 7 drehbar · 3 Ziele · Rateschritte 136 · Profil mittel2/b-4-bunt, Seed 4034468
    name: 'Mondlicht', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 0, fixed: true },
      { type: 'prism', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'green' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'target', x: 6, z: 6, color: 'red' },
    ],
    solution: { '1,4': 3, '1,5': 1, '5,4': 3, '0,5': 1, '5,6': 1, '5,3': 3, '5,5': 1 },
  },
  // Platz im Spiel: nach „Mondlicht“
  {
    // Lösung: Spiegel (3,6) rot 3 · Spiegel (2,3) rot 1 · Spiegel (4,4) rot 2 · Prisma (5,3) rot 5 ·
    //   Spiegel (4,2) rot 2 · Spiegel (5,1) rot 0
    // Generator mittel-mischziel, Seed 10005 · Ausbau „mittel“
    name: 'Linse', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'target', x: 2, z: 6, color: 'white' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'prism', x: 5, z: 3, rot: 4 },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'blocker', x: 4, z: 1 },
    ],
    solution: { '3,6': 3, '2,3': 1, '4,4': 2, '5,3': 5, '4,2': 2, '5,1': 0 },
  },
  // Platz im Spiel: nach „Linse“
  {
    // Lösung: Prisma (4,1) rot 4 · Spiegel (5,1) rot 3 · Spiegel (4,0) rot 1 · Spiegel (2,6) rot 0 ·
    //   Spiegel (3,5) rot 0 · Prisma (4,6) rot 0
    // Generator mittel-sammelstelle, Seed 10011 · Ausbau „mittel“
    name: 'Glockenspiel', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 4, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'prism', x: 4, z: 6, rot: 7 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '4,1': 4, '5,1': 3, '4,0': 1, '2,6': 0, '3,5': 0, '4,6': 0 },
  },
  // Platz im Spiel: nach „Glockenspiel“
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (6,2) rot 3 · Spiegel (5,2) rot 3 · Spiegel (4,5) rot 3 ·
    //   Spiegel (5,4) rot 3 · Spiegel (2,5) rot 1 · Prisma (2,1) rot 7
    // Wertung 23.5 · 7 drehbar · 4 Ziele · Rateschritte 42 · Profil 4-filter, Seed 120577
    name: 'Weichen', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'prism', x: 2, z: 1, rot: 6 },
      { type: 'filter', x: 6, z: 1, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
    ],
    solution: { '4,4': 1, '6,2': 3, '5,2': 3, '4,5': 3, '5,4': 3, '2,5': 1, '2,1': 7 },
  },
  // Platz im Spiel: nach „Weichen“
  {
    // Lösung: Prisma (3,0) rot 2 · Spiegel (4,6) rot 1 · Spiegel (1,2) rot 0 · Spiegel (3,1) rot 1 ·
    //   Spiegel (5,6) rot 3 · Spiegel (4,4) rot 1 · Spiegel (4,1) rot 1
    // Wertung 26.5 · 7 drehbar · 3 Ziele · Rateschritte 135 · Profil mittel2/b-4-bunt, Seed 4046585
    name: 'Glasbaustein', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'prism', x: 3, z: 0, rot: 0 },
      { type: 'filter', x: 4, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '3,0': 2, '4,6': 1, '1,2': 0, '3,1': 1, '5,6': 3, '4,4': 1, '4,1': 1 },
  },
  // Platz im Spiel: nach „Glasbaustein“
  {
    // Lösung: Spiegel (5,2) rot 1 · Spiegel (3,2) rot 1 · Spiegel (5,3) rot 1 · Spiegel (5,1) rot 1 ·
    //   Spiegel (3,1) rot 3 · Prisma (4,1) rot 5 · Prisma (1,1) rot 5
    // Wertung 28 · 7 drehbar · 4 Ziele · Rateschritte 134 · Profil mittel2/b-4-prisma, Seed 4105765
    name: 'Fadenkreuz', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 0, z: 0, rot: 2, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 1, rot: 0 },
      { type: 'prism', x: 4, z: 1, rot: 1 },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'red' },
    ],
    solution: { '5,2': 1, '3,2': 1, '5,3': 1, '5,1': 1, '3,1': 3, '4,1': 5, '1,1': 5 },
  },
  // Platz im Spiel: nach „Farbton“
  {
    // Lösung: Prisma (5,5) rot 5 · Spiegel (1,3) rot 2 · Prisma (2,4) rot 1 · Spiegel (5,4) rot 3 ·
    //   Spiegel (5,1) rot 1 · Spiegel (2,6) rot 3
    // Generator mittel-sammelstelle, Seed 10542 · Ausbau „mittel“
    name: 'Raureif', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 7, color: 'green' },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 1, z: 1, color: 'yellow' },
      { type: 'source', x: 4, z: 0, dir: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '5,5': 5, '1,3': 2, '2,4': 1, '5,4': 3, '5,1': 1, '2,6': 3 },
  },
  // Platz im Spiel: nach „Lichtgitter“
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (5,2) rot 3 · Spiegel (0,2) rot 3 · Prisma (4,1) rot 2 ·
    //   Prisma (3,5) rot 7 · Spiegel (4,4) rot 0 · Spiegel (3,2) rot 1
    // Wertung 29.6 · 7 drehbar · 4 Ziele · Rateschritte 241 · Profil mittel2/b-4-prisma, Seed 4137993
    name: 'Lichtschranke', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 0, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 0, fixed: true },
      { type: 'prism', x: 4, z: 1, rot: 4 },
      { type: 'prism', x: 3, z: 5, rot: 1 },
      { type: 'target', x: 4, z: 3, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'green' },
      { type: 'target', x: 4, z: 5, color: 'blue' },
    ],
    solution: { '3,1': 3, '5,2': 3, '0,2': 3, '4,1': 2, '3,5': 7, '4,4': 0, '3,2': 1 },
  },
  // Platz im Spiel: nach „Lichtschranke“
  {
    // Lösung: Spiegel (5,5) rot 2 · Spiegel (3,5) rot 1 · Spiegel (2,2) rot 2 · Spiegel (0,5) rot 1 ·
    //   Prisma (1,5) rot 4 · Spiegel (3,1) rot 0 · Kombinator (0,4) dir 7
    // Wertung 29.5 · 7 drehbar · 3 Ziele · Rateschritte 205 · Profil mittel/3-bunt, Seed 2000344
    name: 'Feuerwerk', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'source', x: 4, z: 6, dir: 7 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'prism', x: 1, z: 5, rot: 1 },
      { type: 'combiner', x: 0, z: 4, dir: 5 },
      { type: 'blocker', x: 1, z: 2 },
      { type: 'target', x: 1, z: 1, color: 'cyan' },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '5,5': 2, '3,5': 1, '2,2': 2, '0,5': 1, '1,5': 4, '3,1': 0, '0,4': 7 },
  },
  // Platz im Spiel: nach „Feuerwerk“
  {
    // Lösung: Prisma (1,1) rot 0 · Spiegel (1,4) rot 1 · Spiegel (2,2) rot 2 · Spiegel (3,3) rot 0 ·
    //   Prisma (5,1) rot 0 · Spiegel (6,2) rot 2
    // Generator mittel-sammelstelle, Seed 187, Ziel 49,65–50,32 · ersetzt Chamäleon (Austausch „mittel“)
    name: 'Delta', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 1, rot: 6 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'green' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'magenta' },
      { type: 'target', x: 4, z: 1, color: 'green' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 3, z: 5, color: 'blue' },
    ],
    solution: { '1,1': 0, '1,4': 1, '2,2': 2, '3,3': 0, '5,1': 0, '6,2': 2 },
  },
  // Platz im Spiel: nach „Delta“
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (5,3) rot 3 · Spiegel (2,1) rot 1 · Prisma (1,3) rot 2 ·
    //   Spiegel (0,4) rot 2 · Spiegel (2,6) rot 0 · Kombinator (1,5) dir 1
    // Wertung 26.8 · 7 drehbar · 3 Ziele · Rateschritte 98 · Profil mittel2/b-4-misch, Seed 4058586
    name: 'Pinselstrich', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 0, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 0, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'prism', x: 1, z: 3, rot: 1 },
      { type: 'combiner', x: 1, z: 5, dir: 6 },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'target', x: 4, z: 4, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'cyan' },
    ],
    solution: { '5,2': 3, '5,3': 3, '2,1': 1, '1,3': 2, '0,4': 2, '2,6': 0, '1,5': 1 },
  },
  // Platz im Spiel: nach „Pinselstrich“
  {
    // Lösung: Spiegel (6,2) rot 1 · Spiegel (4,1) rot 3 · Spiegel (3,3) rot 2 · Prisma (3,2) rot 0 ·
    //   Prisma (4,5) rot 6 · Prisma (2,4) rot 7
    // Generator mittel-lockvogel, Seed 10024 · Ausbau „mittel“
    name: 'Wendeltreppe', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 1, color: 'green' },
      { type: 'blocker', x: 5, z: 5 },
      { type: 'prism', x: 3, z: 2, rot: 3 },
      { type: 'prism', x: 4, z: 5, rot: 7 },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 2, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 0, color: 'red' },
    ],
    solution: { '6,2': 1, '4,1': 3, '3,3': 2, '3,2': 0, '4,5': 6, '2,4': 7 },
  },
  // Platz im Spiel: nach „Wendeltreppe“
  {
    // Lösung: Spiegel (4,3) rot 3 · Spiegel (4,5) rot 1 · Spiegel (1,5) rot 1 · Spiegel (1,3) rot 1 ·
    //   Prisma (1,2) rot 1 · Spiegel (5,2) rot 3 · Spiegel (5,0) rot 3 · Spiegel (6,0) rot 1
    // Generator mittel-abzaehlen, Seed 10045 · Ausbau „mittel“
    name: 'Sonnenstein', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'prism', x: 1, z: 2, rot: 5 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 6, color: 'red' },
    ],
    solution: { '4,3': 3, '4,5': 1, '1,5': 1, '1,3': 1, '1,2': 1, '5,2': 3, '5,0': 3, '6,0': 1 },
  },
  // Platz im Spiel: nach „Onyx“
  {
    // Lösung: Spiegel (5,4) rot 1 · Spiegel (6,5) rot 1 · Spiegel (6,6) rot 3 · Spiegel (5,6) rot 1 ·
    //   Spiegel (2,4) rot 3 · Spiegel (2,5) rot 1
    // Generator mittel-mischziel, Seed 11096 · Ausbau „mittel“
    name: 'Wirbel', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 1, fixed: true },
      { type: 'target', x: 5, z: 1, color: 'white' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 4, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'filter', x: 3, z: 4, color: 'green' },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'green' },
    ],
    solution: { '5,4': 1, '6,5': 1, '6,6': 3, '5,6': 1, '2,4': 3, '2,5': 1 },
  },
  // Platz im Spiel: nach „Wirbel“
  {
    // Lösung: Spiegel (6,3) rot 3 · Prisma (4,3) rot 1 · Spiegel (2,2) rot 1 · Spiegel (6,2) rot 1 ·
    //   Spiegel (3,2) rot 3 · Spiegel (4,5) rot 3 · Spiegel (3,4) rot 1
    // Wertung 28.8 · 7 drehbar · 3 Ziele · Rateschritte 208 · Profil mittel2/b-4-prisma, Seed 4053031
    name: 'Blaue Stunde', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 4, z: 3, rot: 5 },
      { type: 'target', x: 3, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
    ],
    solution: { '6,3': 3, '4,3': 1, '2,2': 1, '6,2': 1, '3,2': 3, '4,5': 3, '3,4': 1 },
  },
  // Platz im Spiel: nach „Blaue Stunde“
  {
    // Lösung: Spiegel (2,1) rot 1 · Spiegel (4,1) rot 3 · Spiegel (4,6) rot 3 · Prisma (3,1) rot 1 ·
    //   Prisma (5,1) rot 3 · Spiegel (5,3) rot 3
    // Wertung 29.8 · 6 drehbar · 4 Ziele · Rateschritte 262 · Profil 3-prisma, Seed 560
    name: 'Kaleidoskop', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'prism', x: 3, z: 1, rot: 3 },
      { type: 'prism', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
    ],
    solution: { '2,1': 1, '4,1': 3, '4,6': 3, '3,1': 1, '5,1': 3, '5,3': 3 },
  },
  // Platz im Spiel: nach „Kaleidoskop“
  {
    // Lösung: Spiegel (3,3) rot 3 · Spiegel (4,2) rot 1 · Spiegel (4,0) rot 1 · Spiegel (1,0) rot 3 ·
    //   Spiegel (1,3) rot 1 · Spiegel (3,2) rot 1 · Spiegel (2,4) rot 3 · Spiegel (0,4) rot 3
    // Generator mittel-mischziel, Seed 10301 · Ausbau „mittel“
    name: 'Nordlicht', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'target', x: 5, z: 3, color: 'white' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '3,3': 3, '4,2': 1, '4,0': 1, '1,0': 3, '1,3': 1, '3,2': 1, '2,4': 3, '0,4': 3 },
  },
  // Platz im Spiel: nach „Silhouette“
  {
    // Lösung: Prisma (3,4) rot 3 · Spiegel (4,1) rot 3 · Spiegel (3,5) rot 1 · Spiegel (6,5) rot 1 ·
    //   Spiegel (6,6) rot 3 · Prisma (1,1) rot 4
    // Generator mittel-sammelstelle, Seed 374, Ziel 51,15–51,71 · ersetzt Widerschein (Austausch „mittel“)
    name: 'Palette', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 5 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'blue' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'target', x: 2, z: 4, color: 'blue' },
      { type: 'target', x: 2, z: 5, color: 'green' },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'prism', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'green' },
    ],
    solution: { '3,4': 3, '4,1': 3, '3,5': 1, '6,5': 1, '6,6': 3, '1,1': 4 },
  },
  // Platz im Spiel: nach „Palette“
  {
    // Lösung: Spiegel (4,1) rot 3 · Spiegel (1,3) rot 1 · Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 ·
    //   Spiegel (0,3) rot 1 · Prisma (0,2) rot 7
    // Generator mittel-mischziel, Seed 10044 · Ausbau „mittel“
    name: 'Glasmalerei', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'green' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 4, z: 3, color: 'cyan' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'prism', x: 0, z: 2, rot: 2 },
      { type: 'target', x: 5, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 1, color: 'red' },
    ],
    solution: { '4,1': 3, '1,3': 1, '5,5': 1, '5,6': 3, '0,3': 1, '0,2': 7 },
  },
  // Platz im Spiel: nach „Glasmalerei“
  {
    // Lösung: Spiegel (1,1) rot 1 · Spiegel (4,4) rot 3 · Spiegel (0,4) rot 1 · Spiegel (2,1) rot 1 ·
    //   Prisma (4,2) rot 2 · Spiegel (6,4) rot 2 · Spiegel (2,6) rot 1
    // Generator mittel-abschalten, Seed 10424 · Ausbau „mittel“
    name: 'Lichtton', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'prism', x: 4, z: 2, rot: 4 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 2, fixed: true },
      { type: 'target', x: 6, z: 6, color: 'yellow' },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
    ],
    solution: { '1,1': 1, '4,4': 3, '0,4': 1, '2,1': 1, '4,2': 2, '6,4': 2, '2,6': 1 },
  },
  // Platz im Spiel: nach „Lichtton“
  {
    // Lösung: Spiegel (1,3) rot 3 · Spiegel (1,2) rot 3 · Spiegel (4,1) rot 3 · Spiegel (3,4) rot 3 ·
    //   Spiegel (2,6) rot 3 · Spiegel (1,6) rot 1 · Spiegel (4,3) rot 1 · Spiegel (4,5) rot 1
    // Generator mittel-mischziel, Seed 10017 · Ausbau „mittel“
    name: 'Farbtropfen', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 4, z: 2, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
    ],
    solution: { '1,3': 3, '1,2': 3, '4,1': 3, '3,4': 3, '2,6': 3, '1,6': 1, '4,3': 1, '4,5': 1 },
  },
  // Platz im Spiel: nach „Farbtropfen“
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (5,3) rot 3 · Spiegel (2,3) rot 1 · Prisma (2,2) rot 5 ·
    //   Spiegel (1,3) rot 1 · Spiegel (2,1) rot 1 · Kombinator (1,1) dir 2
    // Wertung 29.1 · 7 drehbar · 3 Ziele · Rateschritte 188 · Profil mittel2/b-4-misch, Seed 4105678
    name: 'Farbtupfer', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'prism', x: 2, z: 2, rot: 0 },
      { type: 'combiner', x: 1, z: 1, dir: 5 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 4, color: 'cyan' },
      { type: 'target', x: 1, z: 6, color: 'white' },
    ],
    solution: { '5,2': 3, '5,3': 3, '2,3': 1, '2,2': 5, '1,3': 1, '2,1': 1, '1,1': 2 },
  },
  // Platz im Spiel: nach „Farbtupfer“
  {
    // Lösung: Spiegel (4,4) rot 1 · Prisma (2,4) rot 4 · Spiegel (3,1) rot 1 · Prisma (3,4) rot 5 ·
    //   Spiegel (1,1) rot 1 · Spiegel (1,5) rot 0 · Spiegel (5,1) rot 1
    // Wertung 28.4 · 7 drehbar · 4 Ziele · Rateschritte 150 · Profil mittel2/b-4-bunt, Seed 4134071
    name: 'Rubin', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 3, fixed: true },
      { type: 'prism', x: 2, z: 4, rot: 3 },
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'blocker', x: 1, z: 4 },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 3, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
    ],
    solution: { '4,4': 1, '2,4': 4, '3,1': 1, '3,4': 5, '1,1': 1, '1,5': 0, '5,1': 1 },
  },
  // Platz im Spiel: nach „Rubin“
  {
    // Lösung: Spiegel (4,1) rot 3 · Spiegel (2,6) rot 0 · Spiegel (6,2) rot 2 · Spiegel (4,3) rot 3 ·
    //   Spiegel (4,5) rot 3 · Spiegel (6,3) rot 1 · Prisma (1,5) rot 1
    // Generator mittel-abschalten, Seed 10730 · Ausbau „mittel“
    name: 'Passhöhe', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 1, z: 3, color: 'green' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'prism', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '4,1': 3, '2,6': 0, '6,2': 2, '4,3': 3, '4,5': 3, '6,3': 1, '1,5': 1 },
  },
  // Platz im Spiel: nach „Passhöhe“
  {
    // Lösung: Prisma (2,3) rot 2 · Spiegel (2,1) rot 3 · Spiegel (4,4) rot 0 · Prisma (5,3) rot 7 ·
    //   Spiegel (6,3) rot 1 · Spiegel (5,0) rot 1
    // Generator mittel-sammelstelle, Seed 70, Ziel 51,73–52,13 · ersetzt Spiegelachse (Austausch „mittel“)
    name: 'Purpur', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 3, rot: 5 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'blue' },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'green' },
      { type: 'target', x: 1, z: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'prism', x: 5, z: 3, rot: 4 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
    ],
    solution: { '2,3': 2, '2,1': 3, '4,4': 0, '5,3': 7, '6,3': 1, '5,0': 1 },
  },
  // Platz im Spiel: nach „Purpur“
  {
    // Lösung: Prisma (6,4) rot 5 · Spiegel (5,2) rot 1 · Prisma (4,2) rot 2 · Spiegel (4,5) rot 3 ·
    //   Spiegel (2,5) rot 3 · Spiegel (2,6) rot 3
    // Generator mittel-sammelstelle, Seed 20204, Ziel 52–58 · Ausbau „mittel“
    name: 'Buntglas', grad: 'mittel',
    elements: [
      { type: 'prism', x: 6, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 6, dir: 7, color: 'blue' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 4, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'green' },
    ],
    solution: { '6,4': 5, '5,2': 1, '4,2': 2, '4,5': 3, '2,5': 3, '2,6': 3 },
  },
  // Platz im Spiel: nach „Hängebrücke“
  {
    // Lösung: Prisma (2,2) rot 1 · Spiegel (3,0) rot 1 · Prisma (0,0) rot 2 · Spiegel (4,2) rot 1 ·
    //   Spiegel (0,1) rot 1 · Spiegel (5,1) rot 3
    // Generator mittel-sammelstelle, Seed 10217 · Ausbau „mittel“
    name: 'Scherenschnitt', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 2, rot: 3 },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 4, color: 'yellow' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'prism', x: 0, z: 0, rot: 6 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '2,2': 1, '3,0': 1, '0,0': 2, '4,2': 1, '0,1': 1, '5,1': 3 },
  },
  // Platz im Spiel: nach „Scherenschnitt“
  {
    // Lösung: Prisma (1,5) rot 0 · Spiegel (0,4) rot 2 · Spiegel (2,1) rot 0 · Spiegel (3,0) rot 0 ·
    //   Prisma (4,1) rot 2 · Spiegel (1,4) rot 2 · Spiegel (2,5) rot 2
    // Generator mittel-sammelstelle, Seed 20331, Ziel 52–58 · Ausbau „mittel“
    name: 'Farbklang', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 5, rot: 4 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'yellow' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 3 },
      { type: 'prism', x: 4, z: 1, rot: 7 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '1,5': 0, '0,4': 2, '2,1': 0, '3,0': 0, '4,1': 2, '1,4': 2, '2,5': 2 },
  },
  // Platz im Spiel: nach „Farbklang“
  {
    // Lösung: Prisma (2,2) rot 5 · Spiegel (0,2) rot 3 · Spiegel (2,1) rot 1 · Spiegel (1,1) rot 1 ·
    //   Prisma (4,3) rot 1 · Spiegel (5,3) rot 3 · Spiegel (5,1) rot 1
    // Generator mittel-falle, Seed 10834 · Ausbau „mittel“
    name: 'Mondsichel', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 6, dir: 5, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 3 },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'target', x: 5, z: 4, color: 'green' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 5, color: 'blue' },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '2,2': 5, '0,2': 3, '2,1': 1, '1,1': 1, '4,3': 1, '5,3': 3, '5,1': 1 },
  },
  // Platz im Spiel: nach „Mondsichel“
  {
    // Lösung: Spiegel (1,3) rot 2 · Spiegel (3,3) rot 0 · Spiegel (1,1) rot 0 · Spiegel (4,6) rot 0 ·
    //   Spiegel (1,5) rot 2 · Spiegel (6,4) rot 2 · Spiegel (5,3) rot 0
    // Generator mittel-abschalten, Seed 10693 · Ausbau „mittel“
    name: 'Fensterrose', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 3, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'source', x: 6, z: 0, dir: 3, color: 'red' },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'source', x: 6, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'target', x: 2, z: 6, color: 'white' },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
    ],
    solution: { '1,3': 2, '3,3': 0, '1,1': 0, '4,6': 0, '1,5': 2, '6,4': 2, '5,3': 0 },
  },
  // Platz im Spiel: nach „Fensterrose“
  {
    // Lösung: Prisma (4,2) rot 5 · Spiegel (0,2) rot 3 · Spiegel (4,0) rot 1 · Spiegel (2,0) rot 3 ·
    //   Spiegel (2,1) rot 3 · Prisma (1,3) rot 2 · Spiegel (3,5) rot 2
    // Generator mittel-falle, Seed 10910 · Ausbau „mittel“
    name: 'Viadukt', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 4 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'prism', x: 1, z: 3, rot: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 4, color: 'green' },
    ],
    solution: { '4,2': 5, '0,2': 3, '4,0': 1, '2,0': 3, '2,1': 3, '1,3': 2, '3,5': 2 },
  },
  // Platz im Spiel: nach „Viadukt“
  {
    // Lösung: Spiegel (3,1) rot 1 · Spiegel (3,5) rot 1 · Spiegel (0,5) rot 3 · Spiegel (0,1) rot 1 ·
    //   Prisma (5,1) rot 3 · Spiegel (1,4) rot 1 · Spiegel (5,4) rot 3
    // Generator mittel-abzaehlen, Seed 20380, Ziel 52–58 · Ausbau „mittel“
    name: 'Citrin', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 5, color: 'cyan' },
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'red' },
    ],
    solution: { '3,1': 1, '3,5': 1, '0,5': 3, '0,1': 1, '5,1': 3, '1,4': 1, '5,4': 3 },
  },
  // Platz im Spiel: nach „Citrin“
  {
    // Lösung: Spiegel (5,0) rot 3 · Spiegel (2,0) rot 1 · Spiegel (2,3) rot 1 · Spiegel (5,3) rot 1 ·
    //   Prisma (2,5) rot 5 · Spiegel (0,5) rot 1 · Spiegel (0,2) rot 3 · Spiegel (4,2) rot 3
    // Generator mittel-abzaehlen, Seed 10223 · Ausbau „mittel“
    name: 'Glockenturm', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'blue' },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 5, z: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 6 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 1, color: 'red' },
    ],
    solution: { '5,0': 3, '2,0': 1, '2,3': 1, '5,3': 1, '2,5': 5, '0,5': 1, '0,2': 3, '4,2': 3 },
  },
  // Platz im Spiel: nach „Glockenturm“
  {
    // Lösung: Spiegel (3,0) rot 1 · Spiegel (1,3) rot 1 · Spiegel (5,6) rot 1 · Prisma (6,6) rot 6 ·
    //   Spiegel (6,5) rot 1 · Spiegel (1,5) rot 1 · Spiegel (0,3) rot 3
    // Generator mittel-mischziel, Seed 20135, Ziel 52–58 · Ausbau „mittel“
    name: 'Akkord', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'red' },
      { type: 'mirror', x: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 1, z: 0, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 4, z: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 0, z: 5, color: 'green' },
    ],
    solution: { '3,0': 1, '1,3': 1, '5,6': 1, '6,6': 6, '6,5': 1, '1,5': 1, '0,3': 3 },
  },
  // Platz im Spiel: nach „Akkord“
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (2,0) rot 1 · Spiegel (4,0) rot 3 · Spiegel (4,2) rot 1 ·
    //   Prisma (1,2) rot 1 · Spiegel (1,5) rot 1 · Spiegel (6,5) rot 3
    // Generator mittel-abzaehlen, Seed 10730 · Ausbau „mittel“
    name: 'Harmonie', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'red' },
      { type: 'target', x: 2, z: 4, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 4 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
    ],
    solution: { '2,2': 1, '2,0': 1, '4,0': 3, '4,2': 1, '1,2': 1, '1,5': 1, '6,5': 3 },
  },
  // Platz im Spiel: nach „Aquamarin“
  {
    // Lösung: Prisma (3,1) rot 4 · Spiegel (5,3) rot 2 · Spiegel (4,0) rot 0 · Spiegel (1,5) rot 1 ·
    //   Spiegel (4,5) rot 1 · Prisma (3,6) rot 6 · Spiegel (0,1) rot 3
    // Generator mittel-sammelstelle, Seed 10509 · Ausbau „mittel“
    name: 'Spiegelung', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 7, color: 'red' },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'source', x: 6, z: 2, dir: 5, color: 'blue' },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'prism', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 4, color: 'green' },
    ],
    solution: { '3,1': 4, '5,3': 2, '4,0': 0, '1,5': 1, '4,5': 1, '3,6': 6, '0,1': 3 },
  },
  // Platz im Spiel: nach „Spiegelung“
  {
    // Lösung: Spiegel (0,1) rot 1 · Spiegel (4,2) rot 1 · Spiegel (3,2) rot 3 · Prisma (6,5) rot 6 ·
    //   Spiegel (6,4) rot 1 · Spiegel (2,4) rot 3
    // Generator mittel-mischziel, Seed 10947 · Ausbau „mittel“
    name: 'Spirale', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'green' },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 3, z: 1, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 4, z: 6, color: 'green' },
    ],
    solution: { '0,1': 1, '4,2': 1, '3,2': 3, '6,5': 6, '6,4': 1, '2,4': 3 },
  },
  // Platz im Spiel: nach „Spirale“
  {
    // Lösung: Spiegel (1,4) rot 1 · Spiegel (3,4) rot 1 · Spiegel (3,1) rot 3 · Spiegel (1,1) rot 1 ·
    //   Prisma (1,5) rot 7 · Spiegel (6,5) rot 1 · Spiegel (4,3) rot 3
    // Generator mittel-abzaehlen, Seed 20277, Ziel 52–58 · Ausbau „mittel“
    name: 'Muschel', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'prism', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '1,4': 1, '3,4': 1, '3,1': 3, '1,1': 1, '1,5': 7, '6,5': 1, '4,3': 3 },
  },
  // Platz im Spiel: nach „Muschel“
  {
    // Lösung: Prisma (2,4) rot 0 · Spiegel (1,5) rot 0 · Spiegel (4,6) rot 0 · Spiegel (5,0) rot 3 ·
    //   Prisma (6,0) rot 2
    // Generator mittel-sammelstelle, Seed 10100 · Ausbau „mittel“
    name: 'Melodie', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 4, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'cyan' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 4, z: 2, color: 'magenta' },
      { type: 'target', x: 6, z: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'prism', x: 6, z: 0, rot: 3 },
    ],
    solution: { '2,4': 0, '1,5': 0, '4,6': 0, '5,0': 3, '6,0': 2 },
  },
  // Platz im Spiel: nach „Melodie“
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (0,2) rot 1 · Spiegel (4,5) rot 1 · Spiegel (5,5) rot 3 ·
    //   Spiegel (0,6) rot 1 · Spiegel (6,6) rot 3 · Spiegel (6,3) rot 1 · Spiegel (1,3) rot 1
    // Generator mittel-mischziel, Seed 10544 · Ausbau „mittel“
    name: 'Schnecke', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 1, color: 'white' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 1, z: 0, color: 'red' },
    ],
    solution: { '4,2': 1, '0,2': 1, '4,5': 1, '5,5': 3, '0,6': 1, '6,6': 3, '6,3': 1, '1,3': 1 },
  },
  // Platz im Spiel: nach „Schnecke“
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (3,4) rot 3 · Spiegel (6,4) rot 3 · Spiegel (1,2) rot 3 ·
    //   Spiegel (0,2) rot 3 · Prisma (1,4) rot 0 · Spiegel (2,5) rot 2 · Spiegel (3,1) rot 1
    // Generator mittel-abschalten, Seed 20237, Ziel 52–58 · Ausbau „mittel“
    name: 'Vollmond', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 2, color: 'white' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 1, z: 0, color: 'cyan' },
      { type: 'prism', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'target', x: 2, z: 3, color: 'red' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'target', x: 2, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '5,2': 3, '3,4': 3, '6,4': 3, '1,2': 3, '0,2': 3, '1,4': 0, '2,5': 2, '3,1': 1 },
  },
  // Platz im Spiel: nach „Vollmond“
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (4,2) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,5) rot 1 ·
    //   Prisma (3,5) rot 1 · Spiegel (3,6) rot 3 · Prisma (4,1) rot 3 · Spiegel (3,1) rot 1
    // Generator mittel-abzaehlen, Seed 10929 · Ausbau „mittel“
    name: 'Kompass', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'prism', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'prism', x: 4, z: 1, rot: 7 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '4,5': 1, '4,2': 1, '6,2': 3, '6,5': 1, '3,5': 1, '3,6': 3, '4,1': 3, '3,1': 1 },
  },
  // Platz im Spiel: nach „Lichtkreuz“
  {
    // Lösung: Spiegel (1,5) rot 1 · Spiegel (3,5) rot 1 · Spiegel (1,3) rot 3 · Spiegel (3,6) rot 3 ·
    //   Prisma (0,6) rot 5 · Spiegel (0,4) rot 3 · Spiegel (5,4) rot 3
    // Generator mittel-mischziel, Seed 10166 · Ausbau „mittel“
    name: 'Lichtstrahl', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'blue' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'target', x: 3, z: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'prism', x: 0, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '1,5': 1, '3,5': 1, '1,3': 3, '3,6': 3, '0,6': 5, '0,4': 3, '5,4': 3 },
  },
  // Platz im Spiel: nach „Lichtstrahl“
  {
    // Lösung: Spiegel (1,6) rot 3 · Prisma (1,1) rot 5 · Spiegel (1,4) rot 3 · Spiegel (4,4) rot 3 ·
    //   Prisma (3,4) rot 1 · Spiegel (4,3) rot 1 · Spiegel (2,3) rot 1
    // Wertung 30 · 7 drehbar · 5 Ziele · Rateschritte 190 · Profil 4-prisma, Seed 2861
    name: 'Glitzer', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'prism', x: 1, z: 1, rot: 0 },
      { type: 'prism', x: 3, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'target', x: 1, z: 0, color: 'magenta' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 5, color: 'green' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
    ],
    solution: { '1,6': 3, '1,1': 5, '1,4': 3, '4,4': 3, '3,4': 1, '4,3': 1, '2,3': 1 },
  },
  // Platz im Spiel: nach „Glitzer“
  {
    // Lösung: Spiegel (5,6) rot 0 · Spiegel (2,1) rot 1 · Spiegel (4,5) rot 2 · Spiegel (5,1) rot 1 ·
    //   Spiegel (4,1) rot 3 · Prisma (5,4) rot 5 · Kombinator (4,3) dir 6
    // Wertung 27 · 7 drehbar · 3 Ziele · Rateschritte 99 · Profil mittel2/4-bunt, Seed 3038958
    name: 'Glühwürmchen', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 5, dir: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'prism', x: 5, z: 4, rot: 3 },
      { type: 'filter', x: 3, z: 1, color: 'magenta' },
      { type: 'combiner', x: 4, z: 3, dir: 1 },
      { type: 'target', x: 4, z: 0, color: 'magenta' },
      { type: 'target', x: 6, z: 3, color: 'cyan' },
      { type: 'target', x: 0, z: 4, color: 'red' },
    ],
    solution: { '5,6': 0, '2,1': 1, '4,5': 2, '5,1': 1, '4,1': 3, '5,4': 5, '4,3': 6 },
  },
  // Platz im Spiel: nach „Glühwürmchen“
  {
    // Lösung: Spiegel (5,1) rot 3 · Spiegel (2,0) rot 1 · Spiegel (2,4) rot 3 · Spiegel (1,4) rot 3 ·
    //   Prisma (1,0) rot 0 · Spiegel (2,2) rot 1 · Spiegel (5,4) rot 0
    // Wertung 33.4 · 7 drehbar · 4 Ziele · Rateschritte 510 · Profil 4-filter, Seed 41972
    name: 'Spektralband', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 1, z: 0, rot: 6 },
      { type: 'filter', x: 2, z: 1, color: 'cyan' },
      { type: 'target', x: 1, z: 1, color: 'cyan' },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '5,1': 3, '2,0': 1, '2,4': 3, '1,4': 3, '1,0': 0, '2,2': 1, '5,4': 0 },
  },
  // Platz im Spiel: nach „Neumond“
  {
    // Lösung: Spiegel (1,2) rot 3 · Spiegel (4,3) rot 3 · Spiegel (3,6) rot 1 · Spiegel (4,6) rot 3 ·
    //   Spiegel (5,3) rot 1 · Prisma (5,5) rot 4 · Spiegel (0,5) rot 3
    // Generator mittel-mischziel, Seed 315, Ziel 53,89–54,34 · ersetzt Rochade (Austausch „mittel“)
    name: 'Rücklicht', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 6, color: 'green' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
    ],
    solution: { '1,2': 3, '4,3': 3, '3,6': 1, '4,6': 3, '5,3': 1, '5,5': 4, '0,5': 3 },
  },
  // Platz im Spiel: nach „Rücklicht“
  {
    // Lösung: Prisma (5,2) rot 1 · Prisma (1,1) rot 0 · Spiegel (5,5) rot 2 · Spiegel (4,6) rot 0 ·
    //   Spiegel (5,1) rot 3 · Spiegel (5,0) rot 1
    // Generator mittel-sammelstelle, Seed 10081 · Ausbau „mittel“
    name: 'Elfenbein', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'green' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'prism', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 2, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
    ],
    solution: { '5,2': 1, '1,1': 0, '5,5': 2, '4,6': 0, '5,1': 3, '5,0': 1 },
  },
  // Platz im Spiel: nach „Elfenbein“
  {
    // Lösung: Prisma (2,5) rot 5 · Spiegel (3,6) rot 0 · Spiegel (2,6) rot 3 · Spiegel (2,3) rot 1 ·
    //   Spiegel (5,2) rot 1 · Spiegel (5,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (2,0) rot 3
    // Generator mittel-sammelstelle, Seed 20213, Ziel 52–58 · Ausbau „mittel“
    name: 'Polarstern', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 5, rot: 6 },
      { type: 'source', x: 6, z: 3, dir: 3, color: 'red' },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'filter', x: 3, z: 3, color: 'blue' },
      { type: 'target', x: 5, z: 3, color: 'blue' },
    ],
    solution: { '2,5': 5, '3,6': 0, '2,6': 3, '2,3': 1, '5,2': 1, '5,1': 3, '6,1': 3, '2,0': 3 },
  },
  // Platz im Spiel: nach „Polarstern“
  {
    // Lösung: Spiegel (2,5) rot 3 · Prisma (1,5) rot 7 · Spiegel (1,1) rot 1 · Spiegel (5,5) rot 3 ·
    //   Spiegel (1,4) rot 1 · Spiegel (5,4) rot 1 · Prisma (3,5) rot 0
    // Wertung 27.2 · 7 drehbar · 4 Ziele · Rateschritte 121 · Profil mittel2/3-bunt, Seed 3004457
    name: 'Saphir', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 0 },
      { type: 'prism', x: 3, z: 5, rot: 2 },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,5': 3, '1,5': 7, '1,1': 1, '5,5': 3, '1,4': 1, '5,4': 1, '3,5': 0 },
  },
  // Platz im Spiel: nach „Saphir“
  {
    // Lösung: Spiegel (2,2) rot 3 · Spiegel (5,2) rot 1 · Spiegel (5,4) rot 1 · Spiegel (2,4) rot 3 ·
    //   Prisma (2,1) rot 3 · Spiegel (1,1) rot 1 · Spiegel (0,0) rot 3 · Spiegel (0,4) rot 1
    // Generator mittel-abzaehlen, Seed 20339, Ziel 52–58 · Ausbau „mittel“
    name: 'Venus', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'target', x: 2, z: 5, color: 'white' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'prism', x: 2, z: 1, rot: 4 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '2,2': 3, '5,2': 1, '5,4': 1, '2,4': 3, '2,1': 3, '1,1': 1, '0,0': 3, '0,4': 1 },
  },
  // Platz im Spiel: nach „Venus“
  {
    // Lösung: Spiegel (3,3) rot 2 · Spiegel (1,5) rot 0 · Spiegel (1,1) rot 2 · Spiegel (2,0) rot 0 ·
    //   Spiegel (6,4) rot 2 · Spiegel (4,6) rot 0 · Prisma (0,2) rot 7
    // Generator mittel-mischziel, Seed 10053 · Ausbau „mittel“
    name: 'Aquädukt', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 0, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'prism', x: 0, z: 2, rot: 3 },
      { type: 'target', x: 3, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 1, color: 'red' },
    ],
    solution: { '3,3': 2, '1,5': 0, '1,1': 2, '2,0': 0, '6,4': 2, '4,6': 0, '0,2': 7 },
  },
  // Platz im Spiel: nach „Aquädukt“
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (0,1) rot 1 · Prisma (3,1) rot 1 · Spiegel (5,2) rot 1 ·
    //   Spiegel (4,1) rot 3 · Spiegel (5,5) rot 3 · Prisma (1,1) rot 6
    // Wertung 34.8 · 7 drehbar · 4 Ziele · Rateschritte 680 · Profil mittel/4-bunt, Seed 2000034
    name: 'Blendwerk', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'prism', x: 1, z: 1, rot: 0 },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'magenta' },
      { type: 'target', x: 5, z: 3, color: 'cyan' },
    ],
    solution: { '3,2': 1, '0,1': 1, '3,1': 1, '5,2': 1, '4,1': 3, '5,5': 3, '1,1': 6 },
  },
  // Platz im Spiel: nach „Blendwerk“
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (5,2) rot 1 · Spiegel (0,2) rot 1 · Spiegel (4,2) rot 3 ·
    //   Spiegel (0,1) rot 3 · Prisma (5,5) rot 6 · Spiegel (4,4) rot 1
    // Wertung 31.9 · 7 drehbar · 3 Ziele · Rateschritte 375 · Profil mittel2/b-4-filter, Seed 4806867
    name: 'Traumfänger', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 4 },
      { type: 'filter', x: 5, z: 1, color: 'cyan' },
      { type: 'filter', x: 1, z: 2, color: 'yellow' },
      { type: 'target', x: 4, z: 0, color: 'cyan' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'target', x: 6, z: 4, color: 'cyan' },
    ],
    solution: { '3,1': 3, '5,2': 1, '0,2': 1, '4,2': 3, '0,1': 3, '5,5': 6, '4,4': 1 },
  },
  // Platz im Spiel: nach „Traumfänger“
  {
    // Lösung: Spiegel (6,5) rot 1 · Spiegel (4,5) rot 1 · Spiegel (4,3) rot 1 · Spiegel (6,3) rot 3 ·
    //   Prisma (1,5) rot 7 · Prisma (4,2) rot 1 · Spiegel (5,2) rot 3
    // Generator mittel-abzaehlen, Seed 10148 · Ausbau „mittel“
    name: 'Strahlengang', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'prism', x: 1, z: 5, rot: 3 },
      { type: 'prism', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'red' },
    ],
    solution: { '6,5': 1, '4,5': 1, '4,3': 1, '6,3': 3, '1,5': 7, '4,2': 1, '5,2': 3 },
  },
  // Platz im Spiel: nach „Strahlengang“
  {
    // Lösung: Spiegel (1,1) rot 1 · Spiegel (1,3) rot 1 · Spiegel (3,3) rot 1 · Spiegel (3,1) rot 1 ·
    //   Prisma (1,5) rot 7 · Spiegel (4,5) rot 1 · Spiegel (5,6) rot 3
    // Generator mittel-abzaehlen, Seed 10437 · Ausbau „mittel“
    name: 'Seestern', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'yellow' },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'magenta' },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 1, z: 0, color: 'yellow' },
      { type: 'prism', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
    ],
    solution: { '1,1': 1, '1,3': 1, '3,3': 1, '3,1': 1, '1,5': 7, '4,5': 1, '5,6': 3 },
  },
  // Platz im Spiel: nach „Intarsie“
  {
    // Lösung: Prisma (3,3) rot 4 · Spiegel (4,2) rot 2 · Prisma (6,3) rot 7 · Spiegel (6,1) rot 1 ·
    //   Spiegel (0,1) rot 3 · Spiegel (1,5) rot 2
    // Generator mittel-sammelstelle, Seed 20021, Ziel 52–58 · Ausbau „mittel“
    name: 'Filigran', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 3, rot: 3 },
      { type: 'source', x: 2, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 0, z: 3, color: 'yellow' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 1 },
      { type: 'prism', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'red' },
    ],
    solution: { '3,3': 4, '4,2': 2, '6,3': 7, '6,1': 1, '0,1': 3, '1,5': 2 },
  },
  // Platz im Spiel: nach „Perlglanz“
  {
    // Lösung: Prisma (2,3) rot 4 · Prisma (3,2) rot 5 · Spiegel (0,3) rot 1 · Spiegel (3,0) rot 3 ·
    //   Spiegel (5,0) rot 1
    // Generator mittel-sammelstelle, Seed 10273 · Ausbau „mittel“
    name: 'Morgenstern', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 3, rot: 1 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'green' },
    ],
    solution: { '2,3': 4, '3,2': 5, '0,3': 1, '3,0': 3, '5,0': 1 },
  },
  // Platz im Spiel: nach „Mondfinsternis“
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (1,5) rot 1 · Spiegel (1,1) rot 1 · Spiegel (3,1) rot 1 ·
    //   Prisma (5,1) rot 3 · Spiegel (5,2) rot 1 · Spiegel (6,2) rot 1
    // Generator mittel-abzaehlen, Seed 20396, Ziel 52–58 · Ausbau „mittel“
    name: 'Kreuzgang', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'target', x: 3, z: 0, color: 'blue' },
      { type: 'prism', x: 5, z: 1, rot: 7 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '3,5': 1, '1,5': 1, '1,1': 1, '3,1': 1, '5,1': 3, '5,2': 1, '6,2': 1 },
  },
  // Platz im Spiel: nach „Kreuzgang“
  {
    // Lösung: Prisma (4,4) rot 3 · Spiegel (5,4) rot 1 · Spiegel (6,2) rot 2 · Prisma (1,2) rot 1 ·
    //   Spiegel (0,4) rot 1 · Spiegel (1,6) rot 1
    // Generator mittel-sammelstelle, Seed 286, Ziel 54,36–54,78 · ersetzt Lichtschleife (Austausch „mittel“)
    name: 'Fokus', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'target', x: 3, z: 5, color: 'green' },
      { type: 'target', x: 4, z: 6, color: 'magenta' },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'prism', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 3, color: 'green' },
    ],
    solution: { '4,4': 3, '5,4': 1, '6,2': 2, '1,2': 1, '0,4': 1, '1,6': 1 },
  },
  // Platz im Spiel: nach „Seidenglanz“
  {
    // Lösung: Prisma (0,5) rot 7 · Spiegel (1,6) rot 0 · Prisma (5,4) rot 4 · Spiegel (3,2) rot 2 ·
    //   Spiegel (4,1) rot 2 · Spiegel (3,0) rot 0 · Spiegel (2,4) rot 1
    // Generator mittel-sammelstelle, Seed 10460 · Ausbau „mittel“
    name: 'Goldstaub', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 5, rot: 4 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'cyan' },
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 2, color: 'blue' },
    ],
    solution: { '0,5': 7, '1,6': 0, '5,4': 4, '3,2': 2, '4,1': 2, '3,0': 0, '2,4': 1 },
  },
  // Platz im Spiel: nach „Goldstaub“
  {
    // Lösung: Spiegel (5,0) rot 1 · Spiegel (2,1) rot 3 · Prisma (2,4) rot 1 · Spiegel (4,2) rot 3 ·
    //   Spiegel (4,0) rot 3 · Spiegel (5,1) rot 3 · Spiegel (2,0) rot 1
    // Wertung 28.5 · 7 drehbar · 3 Ziele · Rateschritte 171 · Profil mittel2/b-4-filter, Seed 4791376
    name: 'Farbnebel', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'filter', x: 5, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'yellow' },
    ],
    solution: { '5,0': 1, '2,1': 3, '2,4': 1, '4,2': 3, '4,0': 3, '5,1': 3, '2,0': 1 },
  },
  // Platz im Spiel: nach „Sternschnuppe“
  {
    // Lösung: Prisma (3,3) rot 2 · Spiegel (2,2) rot 2 · Spiegel (3,5) rot 1 · Spiegel (4,6) rot 1 ·
    //   Spiegel (6,6) rot 3 · Prisma (1,1) rot 1
    // Generator mittel-sammelstelle, Seed 10146 · Ausbau „mittel“
    name: 'Silbermond', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 3, rot: 6 },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'blue' },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 4, color: 'yellow' },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1, fixed: true },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'prism', x: 1, z: 1, rot: 4 },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'target', x: 1, z: 4, color: 'blue' },
    ],
    solution: { '3,3': 2, '2,2': 2, '3,5': 1, '4,6': 1, '6,6': 3, '1,1': 1 },
  },
  // Platz im Spiel: nach „Silbermond“
  {
    // Lösung: Spiegel (5,1) rot 1 · Spiegel (5,3) rot 1 · Spiegel (3,3) rot 1 · Spiegel (3,1) rot 1 ·
    //   Prisma (1,3) rot 7 · Spiegel (1,2) rot 1 · Spiegel (0,1) rot 3 · Spiegel (5,5) rot 1
    // Generator mittel-abzaehlen, Seed 359, Ziel 53,89–54,34 · ersetzt Mosaik (Austausch „mittel“)
    name: 'Bogengang', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'blue' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 3, z: 5, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 3, color: 'magenta' },
      { type: 'prism', x: 1, z: 3, rot: 6 },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '5,1': 1, '5,3': 1, '3,3': 1, '3,1': 1, '1,3': 7, '1,2': 1, '0,1': 3, '5,5': 1 },
  },
  // Platz im Spiel: nach „Spiegeltreppe“
  {
    // Lösung: Spiegel (1,4) rot 1 · Spiegel (2,2) rot 1 · Spiegel (3,2) rot 3 · Prisma (3,1) rot 4 ·
    //   Spiegel (0,1) rot 1 · Spiegel (1,0) rot 1 · Spiegel (6,4) rot 3
    // Generator mittel-mischziel, Seed 10383 · Ausbau „mittel“
    name: 'Fuge', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'red' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 5, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'prism', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'target', x: 6, z: 2, color: 'green' },
    ],
    solution: { '1,4': 1, '2,2': 1, '3,2': 3, '3,1': 4, '0,1': 1, '1,0': 1, '6,4': 3 },
  },
  // Platz im Spiel: nach „Sonate“
  {
    // Lösung: Spiegel (4,2) rot 3 · Spiegel (4,1) rot 3 · Spiegel (3,2) rot 1 · Prisma (3,4) rot 3 ·
    //   Spiegel (3,5) rot 1 · Prisma (3,1) rot 7 · Spiegel (1,6) rot 0
    // Wertung 28.8 · 7 drehbar · 4 Ziele · Rateschritte 157 · Profil mittel2/b-4-bunt, Seed 4183354
    name: 'Schimmer', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'prism', x: 3, z: 1, rot: 1 },
      { type: 'prism', x: 3, z: 4, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '4,2': 3, '4,1': 3, '3,2': 1, '3,4': 3, '3,5': 1, '3,1': 7, '1,6': 0 },
  },
  // Platz im Spiel: nach „Schimmer“
  {
    // Lösung: Prisma (3,5) rot 7 · Spiegel (2,6) rot 0 · Spiegel (2,5) rot 1 · Spiegel (5,3) rot 2 ·
    //   Spiegel (6,2) rot 1
    // Generator mittel-sammelstelle, Seed 10662 · Ausbau „mittel“
    name: 'Koralle', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'red' },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'target', x: 3, z: 1, color: 'yellow' },
      { type: 'target', x: 6, z: 5, color: 'cyan' },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'filter', x: 4, z: 2, color: 'green' },
    ],
    solution: { '3,5': 7, '2,6': 0, '2,5': 1, '5,3': 2, '6,2': 1 },
  },
  // Platz im Spiel: nach „Koralle“
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (3,4) rot 1 · Spiegel (1,6) rot 1 · Prisma (4,4) rot 5 ·
    //   Spiegel (0,4) rot 3 · Spiegel (6,6) rot 3 · Spiegel (6,5) rot 1
    // Generator mittel-abschalten, Seed 10032 · Ausbau „mittel“
    name: 'Perle', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'prism', x: 4, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'target', x: 3, z: 5, color: 'magenta' },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
    ],
    solution: { '1,1': 3, '3,4': 1, '1,6': 1, '4,4': 5, '0,4': 3, '6,6': 3, '6,5': 1 },
  },
  // Platz im Spiel: nach „Perle“
  {
    // Lösung: Spiegel (4,5) rot 3 · Spiegel (4,2) rot 3 · Spiegel (2,2) rot 1 · Spiegel (2,5) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (5,0) rot 3 · Spiegel (1,3) rot 3
    // Generator mittel-abzaehlen, Seed 10063 · Ausbau „mittel“
    name: 'Kanon', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'red' },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'target', x: 1, z: 5, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'prism', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
    ],
    solution: { '4,5': 3, '4,2': 3, '2,2': 1, '2,5': 3, '5,5': 5, '5,0': 3, '1,3': 3 },
  },
  // Platz im Spiel: nach „Kanon“
  {
    // Lösung: Prisma (3,3) rot 2 · Spiegel (2,3) rot 3 · Prisma (1,3) rot 4 · Spiegel (0,3) rot 3 ·
    //   Spiegel (0,5) rot 1 · Spiegel (0,2) rot 2 · Spiegel (1,1) rot 2
    // Generator mittel-sammelstelle, Seed 20047, Ziel 52–58 · Ausbau „mittel“
    name: 'Arkade', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 3, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'green' },
      { type: 'target', x: 5, z: 5, color: 'yellow' },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'prism', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
    ],
    solution: { '3,3': 2, '2,3': 3, '1,3': 4, '0,3': 3, '0,5': 1, '0,2': 2, '1,1': 2 },
  },
  // Platz im Spiel: nach „Merkur“
  {
    // Lösung: Prisma (5,6) rot 7 · Spiegel (1,6) rot 1 · Spiegel (2,3) rot 2 · Prisma (2,5) rot 1 ·
    //   Spiegel (5,1) rot 3 · Spiegel (6,1) rot 3
    // Generator mittel-sammelstelle, Seed 10836 · Ausbau „mittel“
    name: 'Dämmerung', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 6, rot: 4 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'source', x: 5, z: 0, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'source', x: 0, z: 3, dir: 1 },
      { type: 'prism', x: 2, z: 5, rot: 5 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'red' },
    ],
    solution: { '5,6': 7, '1,6': 1, '2,3': 2, '2,5': 1, '5,1': 3, '6,1': 3 },
  },
  // Platz im Spiel: nach „Dämmerung“
  {
    // Lösung: Spiegel (5,4) rot 1 · Spiegel (4,0) rot 3 · Spiegel (4,5) rot 1 · Spiegel (5,3) rot 3 ·
    //   Spiegel (1,3) rot 1 · Spiegel (5,2) rot 3 · Spiegel (6,2) rot 3 · Prisma (5,0) rot 3
    // Generator mittel-abschalten, Seed 10275 · Ausbau „mittel“
    name: 'Rondo', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 1, color: 'green' },
      { type: 'prism', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'red' },
    ],
    solution: { '5,4': 1, '4,0': 3, '4,5': 1, '5,3': 3, '1,3': 1, '5,2': 3, '6,2': 3, '5,0': 3 },
  },
  // Platz im Spiel: nach „Rondo“
  {
    // Lösung: Spiegel (3,4) rot 1 · Spiegel (0,2) rot 2 · Prisma (4,6) rot 3 · Spiegel (3,6) rot 1 ·
    //   Spiegel (1,4) rot 1 · Spiegel (0,1) rot 1 · Spiegel (6,1) rot 3
    // Generator mittel-mischziel, Seed 20240, Ziel 52–58 · Ausbau „mittel“
    name: 'Umlenkspiegel', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 6, dir: 7, color: 'cyan' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'target', x: 3, z: 3, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'prism', x: 4, z: 6, rot: 6 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '3,4': 1, '0,2': 2, '4,6': 3, '3,6': 1, '1,4': 1, '0,1': 1, '6,1': 3 },
  },
  // Platz im Spiel: nach „Umlenkspiegel“
  {
    // Lösung: Prisma (5,5) rot 5 · Spiegel (4,0) rot 0 · Prisma (6,2) rot 2 · Spiegel (5,0) rot 3 ·
    //   Spiegel (6,3) rot 3 · Spiegel (2,3) rot 3
    // Generator mittel-sammelstelle, Seed 10689 · Ausbau „mittel“
    name: 'Kehrspiegel', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'source', x: 6, z: 4, dir: 3, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'prism', x: 6, z: 2, rot: 5 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
    ],
    solution: { '5,5': 5, '4,0': 0, '6,2': 2, '5,0': 3, '6,3': 3, '2,3': 3 },
  },
  // Platz im Spiel: nach „Kehrspiegel“
  {
    // Lösung: Spiegel (5,2) rot 1 · Spiegel (2,3) rot 1 · Spiegel (2,2) rot 1 · Spiegel (4,2) rot 3 ·
    //   Prisma (2,5) rot 2 · Spiegel (5,3) rot 3 · Spiegel (6,3) rot 1
    // Wertung 34.4 · 7 drehbar · 5 Ziele · Rateschritte 447 · Profil 4-filter, Seed 97028
    name: 'Kreuzfeuer', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 0, fixed: true },
      { type: 'prism', x: 2, z: 5, rot: 5 },
      { type: 'filter', x: 6, z: 4, color: 'magenta' },
      { type: 'filter', x: 4, z: 5, color: 'cyan' },
      { type: 'target', x: 1, z: 0, color: 'cyan' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'magenta' },
    ],
    solution: { '5,2': 1, '2,3': 1, '2,2': 1, '4,2': 3, '2,5': 2, '5,3': 3, '6,3': 1 },
  },
  // Platz im Spiel: nach „Kreuzfeuer“
  {
    // Lösung: Prisma (1,2) rot 4 · Prisma (2,1) rot 1 · Spiegel (2,5) rot 3 · Spiegel (5,1) rot 3 ·
    //   Spiegel (6,5) rot 2 · Spiegel (0,5) rot 1
    // Generator mittel-sammelstelle, Seed 10223 · Ausbau „mittel“
    name: 'Ornament', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 2, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'magenta' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'prism', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'green' },
    ],
    solution: { '1,2': 4, '2,1': 1, '2,5': 3, '5,1': 3, '6,5': 2, '0,5': 1 },
  },
  // Platz im Spiel: nach „Ornament“
  {
    // Lösung: Spiegel (4,1) rot 1 · Spiegel (4,4) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,1) rot 1 ·
    //   Prisma (4,5) rot 7 · Spiegel (6,5) rot 1 · Spiegel (5,6) rot 1
    // Generator mittel-abzaehlen, Seed 385, Ziel 55,55–56,1 · ersetzt Lichtorgel (Austausch „mittel“)
    name: 'Farbchor', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'white' },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'blocker', x: 2, z: 3 },
    ],
    solution: { '4,1': 1, '4,4': 1, '1,4': 1, '1,1': 1, '4,5': 7, '6,5': 1, '5,6': 1 },
  },
  // Platz im Spiel: nach „Farbchor“
  {
    // Lösung: Spiegel (2,4) rot 3 · Prisma (5,1) rot 4 · Spiegel (1,4) rot 1 · Prisma (2,2) rot 1 ·
    //   Spiegel (0,1) rot 1 · Spiegel (4,2) rot 2 · Spiegel (1,1) rot 1
    // Wertung 32.5 · 7 drehbar · 5 Ziele · Rateschritte 384 · Profil mittel/4-prisma, Seed 2022264
    name: 'Bernstein', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 0, fixed: true },
      { type: 'prism', x: 5, z: 1, rot: 7 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'target', x: 1, z: 0, color: 'cyan' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '2,4': 3, '5,1': 4, '1,4': 1, '2,2': 1, '0,1': 1, '4,2': 2, '1,1': 1 },
  },
  // Platz im Spiel: nach „Bernstein“
  {
    // Lösung: Prisma (5,1) rot 7 · Spiegel (4,1) rot 1 · Prisma (1,1) rot 0 · Spiegel (4,5) rot 1 ·
    //   Spiegel (2,0) rot 0 · Spiegel (5,5) rot 1 · Spiegel (5,6) rot 1
    // Generator mittel-sammelstelle, Seed 296, Ziel 55,55–56,1 · ersetzt Uhrwerk (Austausch „mittel“)
    name: 'Lichtkrone', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 1, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 0, color: 'green' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'prism', x: 1, z: 1, rot: 5 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'red' },
    ],
    solution: { '5,1': 7, '4,1': 1, '1,1': 0, '4,5': 1, '2,0': 0, '5,5': 1, '5,6': 1 },
  },
  // Platz im Spiel: nach „Lichtkrone“
  {
    // Lösung: Spiegel (1,5) rot 1 · Spiegel (1,2) rot 1 · Spiegel (4,2) rot 3 · Prisma (4,3) rot 1 ·
    //   Spiegel (5,3) rot 1 · Spiegel (4,1) rot 1 · Spiegel (4,6) rot 3
    // Wertung 27.2 · 7 drehbar · 4 Ziele · Rateschritte 112 · Profil mittel2/b-4-filter, Seed 4374504
    name: 'Schachbrett', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 0, fixed: true },
      { type: 'prism', x: 4, z: 3, rot: 3 },
      { type: 'filter', x: 2, z: 2, color: 'magenta' },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
    ],
    solution: { '1,5': 1, '1,2': 1, '4,2': 3, '4,3': 1, '5,3': 1, '4,1': 1, '4,6': 3 },
  },
  // Platz im Spiel: nach „Schachbrett“
  {
    // Lösung: Prisma (3,3) rot 6 · Spiegel (2,4) rot 2 · Spiegel (3,0) rot 1 · Spiegel (1,0) rot 3 ·
    //   Spiegel (1,4) rot 3 · Spiegel (0,4) rot 3 · Spiegel (0,5) rot 1 · Spiegel (5,5) rot 3
    // Generator mittel-sammelstelle, Seed 20334, Ziel 52–58 · Ausbau „mittel“
    name: 'Kuppel', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'red' },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'cyan' },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
    ],
    solution: { '3,3': 6, '2,4': 2, '3,0': 1, '1,0': 3, '1,4': 3, '0,4': 3, '0,5': 1, '5,5': 3 },
  },
  // Platz im Spiel: nach „Glasfaser“
  {
    // Lösung: Spiegel (3,4) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,6) rot 3 · Spiegel (3,6) rot 1 ·
    //   Prisma (3,3) rot 3 · Spiegel (0,3) rot 1 · Spiegel (0,1) rot 3 · Spiegel (6,1) rot 3
    // Generator mittel-abzaehlen, Seed 20219, Ziel 52–58 · Ausbau „mittel“
    name: 'Saturn', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 2, color: 'magenta' },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'prism', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '3,4': 1, '1,4': 1, '1,6': 3, '3,6': 1, '3,3': 3, '0,3': 1, '0,1': 3, '6,1': 3 },
  },
  // Platz im Spiel: nach „Saturn“
  {
    // Lösung: Spiegel (3,2) rot 3 · Spiegel (0,5) rot 1 · Spiegel (5,3) rot 3 · Spiegel (6,3) rot 1 ·
    //   Spiegel (6,4) rot 3 · Spiegel (3,4) rot 1 · Prisma (4,2) rot 1
    // Generator mittel-mischziel, Seed 10031 · Ausbau „mittel“
    name: 'Sextant', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'red' },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '3,2': 3, '0,5': 1, '5,3': 3, '6,3': 1, '6,4': 3, '3,4': 1, '4,2': 1 },
  },
  // Platz im Spiel: nach „Sextant“
  {
    // Lösung: Spiegel (5,4) rot 1 · Spiegel (3,4) rot 3 · Spiegel (3,2) rot 3 · Spiegel (5,2) rot 1 ·
    //   Prisma (3,1) rot 3 · Spiegel (0,1) rot 3 · Spiegel (6,3) rot 1 · Spiegel (6,4) rot 3
    // Generator mittel-abzaehlen, Seed 10660 · Ausbau „mittel“
    name: 'Brandung', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'yellow' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'target', x: 1, z: 4, color: 'blue' },
    ],
    solution: { '5,4': 1, '3,4': 3, '3,2': 3, '5,2': 1, '3,1': 3, '0,1': 3, '6,3': 1, '6,4': 3 },
  },
  // Platz im Spiel: nach „Brandung“
  {
    // Lösung: Prisma (3,2) rot 7 · Spiegel (4,3) rot 2 · Spiegel (1,0) rot 0 · Spiegel (6,5) rot 2 ·
    //   Spiegel (5,2) rot 0 · Spiegel (6,3) rot 2 · Prisma (3,6) rot 5
    // Generator mittel-sammelstelle, Seed 10252 · Ausbau „mittel“
    name: 'Spiegelpaar', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 2, rot: 6 },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'source', x: 0, z: 1, dir: 7, color: 'red' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'target', x: 3, z: 1, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 7 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'prism', x: 3, z: 6, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 4, color: 'green' },
    ],
    solution: { '3,2': 7, '4,3': 2, '1,0': 0, '6,5': 2, '5,2': 0, '6,3': 2, '3,6': 5 },
  },
  // Platz im Spiel: nach „Kaskade“
  {
    // Lösung: Prisma (1,5) rot 7 · Spiegel (0,4) rot 2 · Spiegel (0,2) rot 1 · Prisma (0,1) rot 7 ·
    //   Spiegel (4,1) rot 1 · Spiegel (4,4) rot 1 · Spiegel (6,4) rot 3
    // Generator mittel-sammelstelle, Seed 10510 · Ausbau „mittel“
    name: 'Doppelbild', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 5, rot: 2 },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'prism', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '1,5': 7, '0,4': 2, '0,2': 1, '0,1': 7, '4,1': 1, '4,4': 1, '6,4': 3 },
  },
  // Platz im Spiel: nach „Fernrohr“
  {
    // Lösung: Spiegel (4,3) rot 1 · Spiegel (4,5) rot 3 · Spiegel (3,4) rot 3 · Spiegel (2,4) rot 3 ·
    //   Spiegel (5,6) rot 3 · Spiegel (6,3) rot 1 · Prisma (6,4) rot 2
    // Generator mittel-mischziel, Seed 20356, Ziel 52–58 · Ausbau „mittel“
    name: 'Periskop', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 5, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'prism', x: 6, z: 4, rot: 4 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '4,3': 1, '4,5': 3, '3,4': 3, '2,4': 3, '5,6': 3, '6,3': 1, '6,4': 2 },
  },
  // Platz im Spiel: nach „Periskop“
  {
    // Lösung: Spiegel (3,5) rot 3 · Spiegel (5,5) rot 3 · Spiegel (5,2) rot 3 · Spiegel (2,1) rot 1 ·
    //   Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 · Prisma (5,0) rot 2
    // Generator mittel-mischziel, Seed 10861 · Ausbau „mittel“
    name: 'Spiegelschrift', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'green' },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
      { type: 'prism', x: 5, z: 0, rot: 6 },
      { type: 'mirror', x: 0, z: 5, rot: 2, fixed: true },
      { type: 'mirror', x: 1, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 3, z: 4, color: 'blue' },
    ],
    solution: { '3,5': 3, '5,5': 3, '5,2': 3, '2,1': 1, '6,1': 3, '6,0': 1, '5,0': 2 },
  },
  // Platz im Spiel: nach „Arabeske“
  {
    // Lösung: Spiegel (5,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (0,6) rot 1 · Spiegel (2,6) rot 3 ·
    //   Spiegel (4,5) rot 2 · Prisma (5,4) rot 6 · Spiegel (4,1) rot 3 · Spiegel (4,4) rot 3
    // Generator mittel-mischziel, Seed 11164 · Ausbau „mittel“
    name: 'Jupiter', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'prism', x: 5, z: 4, rot: 5 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'target', x: 3, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '5,1': 1, '5,0': 1, '0,6': 1, '2,6': 3, '4,5': 2, '5,4': 6, '4,1': 3, '4,4': 3 },
  },
  // Platz im Spiel: nach „Jupiter“
  {
    // Lösung: Prisma (1,3) rot 3 · Spiegel (0,2) rot 2 · Spiegel (6,3) rot 1 · Spiegel (1,4) rot 1 ·
    //   Spiegel (5,4) rot 1 · Spiegel (5,5) rot 3 · Spiegel (4,5) rot 1 · Prisma (1,6) rot 1
    // Generator mittel-sammelstelle, Seed 10056 · Ausbau „mittel“
    name: 'Goldglanz', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 3, rot: 2 },
      { type: 'source', x: 2, z: 0, dir: 3, color: 'green' },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 1 },
      { type: 'prism', x: 1, z: 6, rot: 6 },
      { type: 'target', x: 3, z: 6, color: 'red' },
    ],
    solution: { '1,3': 3, '0,2': 2, '6,3': 1, '1,4': 1, '5,4': 1, '5,5': 3, '4,5': 1, '1,6': 1 },
  },
  // Platz im Spiel: nach „Mars“
  {
    // Lösung: Spiegel (2,3) rot 1 · Prisma (6,1) rot 4 · Spiegel (2,1) rot 3 · Prisma (5,2) rot 6 ·
    //   Kombinator (4,1) dir 4
    // Wertung 33 · 5 drehbar · 3 Ziele · Rateschritte 506 · Profil mittel2/b-3-bunt, Seed 4004088
    name: 'Farbknoten', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 1, fixed: true },
      { type: 'prism', x: 6, z: 1, rot: 0 },
      { type: 'prism', x: 5, z: 2, rot: 5 },
      { type: 'combiner', x: 4, z: 1, dir: 6 },
      { type: 'target', x: 5, z: 0, color: 'cyan' },
      { type: 'target', x: 5, z: 3, color: 'yellow' },
      { type: 'target', x: 6, z: 4, color: 'white' },
    ],
    solution: { '2,3': 1, '6,1': 4, '2,1': 3, '5,2': 6, '4,1': 4 },
  },
  // Platz im Spiel: nach „Farbknoten“
  {
    // Lösung: Spiegel (4,1) rot 3 · Spiegel (1,3) rot 1 · Prisma (4,3) rot 4 · Spiegel (3,4) rot 2 ·
    //   Prisma (1,4) rot 0 · Spiegel (2,3) rot 2 · Kombinator (1,2) dir 6
    // Wertung 35.2 · 7 drehbar · 3 Ziele · Rateschritte 877 · Profil mittel2/4-bunt, Seed 3060502
    name: 'Wabe', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'prism', x: 4, z: 3, rot: 3 },
      { type: 'prism', x: 1, z: 4, rot: 2 },
      { type: 'combiner', x: 1, z: 2, dir: 0 },
      { type: 'target', x: 0, z: 0, color: 'white' },
      { type: 'target', x: 2, z: 4, color: 'green' },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '4,1': 3, '1,3': 1, '4,3': 4, '3,4': 2, '1,4': 0, '2,3': 2, '1,2': 6 },
  },
  // Platz im Spiel: nach „Wabe“
  {
    // Lösung: Spiegel (1,2) rot 1 · Spiegel (1,5) rot 1 · Spiegel (4,5) rot 1 · Spiegel (4,2) rot 3 ·
    //   Prisma (4,1) rot 1 · Spiegel (5,1) rot 1 · Spiegel (6,3) rot 3 · Spiegel (6,2) rot 1
    // Generator mittel-abzaehlen, Seed 10802 · Ausbau „mittel“
    name: 'Lichtleiter', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'white' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'blocker', x: 6, z: 4 },
    ],
    solution: { '1,2': 1, '1,5': 1, '4,5': 1, '4,2': 3, '4,1': 1, '5,1': 1, '6,3': 3, '6,2': 1 },
  },
  // Platz im Spiel: nach „Lichtleiter“
  {
    // Lösung: Prisma (0,1) rot 2 · Spiegel (1,0) rot 0 · Spiegel (2,6) rot 0 · Spiegel (1,5) rot 2 ·
    //   Prisma (3,3) rot 1 · Spiegel (6,3) rot 1 · Spiegel (5,5) rot 2
    // Generator mittel-sammelstelle, Seed 10468 · Ausbau „mittel“
    name: 'Menuett', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'target', x: 3, z: 4, color: 'magenta' },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'prism', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 1, z: 3, color: 'green' },
    ],
    solution: { '0,1': 2, '1,0': 0, '2,6': 0, '1,5': 2, '3,3': 1, '6,3': 1, '5,5': 2 },
  },
  // Platz im Spiel: nach „Menuett“
  {
    // Lösung: Spiegel (5,6) rot 3 · Spiegel (4,4) rot 1 · Spiegel (1,2) rot 3 · Spiegel (1,4) rot 1 ·
    //   Prisma (4,5) rot 4 · Spiegel (0,5) rot 1 · Spiegel (0,3) rot 3
    // Generator mittel-mischziel, Seed 20192, Ziel 52–58 · Ausbau „mittel“
    name: 'Säulenhalle', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 6, dir: 0, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'cyan' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'prism', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'green' },
    ],
    solution: { '5,6': 3, '4,4': 1, '1,2': 3, '1,4': 1, '4,5': 4, '0,5': 1, '0,3': 3 },
  },
  // Platz im Spiel: nach „Säulenhalle“
  {
    // Lösung: Prisma (5,3) rot 2 · Spiegel (6,4) rot 2 · Spiegel (1,3) rot 1 · Spiegel (5,4) rot 3 ·
    //   Spiegel (1,4) rot 1 · Spiegel (2,4) rot 3 · Spiegel (2,0) rot 1 · Kombinator (2,6) dir 0
    // Wertung 36.5 · 8 drehbar · 3 Ziele · Rateschritte 1145 · Profil mittel2/4-misch, Seed 3025213
    name: 'Smaragd', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'prism', x: 5, z: 3, rot: 4 },
      { type: 'combiner', x: 2, z: 6, dir: 1 },
      { type: 'target', x: 0, z: 0, color: 'white' },
      { type: 'target', x: 4, z: 0, color: 'cyan' },
      { type: 'target', x: 5, z: 5, color: 'red' },
    ],
    solution: { '5,3': 2, '6,4': 2, '1,3': 1, '5,4': 3, '1,4': 1, '2,4': 3, '2,0': 1, '2,6': 0 },
  },
  // Platz im Spiel: nach „Smaragd“
  {
    // Lösung: Prisma (2,1) rot 1 · Spiegel (1,2) rot 1 · Spiegel (2,6) rot 1 · Spiegel (1,6) rot 3 ·
    //   Spiegel (4,6) rot 3
    // Generator mittel-sammelstelle, Seed 11133 · Ausbau „mittel“
    name: 'Blütenblatt', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 1, rot: 4 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'cyan' },
      { type: 'target', x: 4, z: 1, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'filter', x: 1, z: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
    ],
    solution: { '2,1': 1, '1,2': 1, '2,6': 1, '1,6': 3, '4,6': 3 },
  },
  // Platz im Spiel: nach „Kupferglanz“
  {
    // Lösung: Prisma (2,2) rot 0 · Spiegel (4,4) rot 2 · Spiegel (3,1) rot 0 · Spiegel (4,2) rot 0 ·
    //   Prisma (5,5) rot 5 · Kombinator (5,1) dir 7 · Spiegel (4,5) rot 3
    // Generator mittel-falle, Seed 10006 · Ausbau „mittel“
    name: 'Seitenspiegel', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'source', x: 6, z: 4, dir: 3 },
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'combiner', x: 5, z: 1, dir: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'target', x: 6, z: 0, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 2, color: 'green' },
    ],
    solution: { '2,2': 0, '4,4': 2, '3,1': 0, '4,2': 0, '5,5': 5, '5,1': 7, '4,5': 3 },
  },
  // Platz im Spiel: nach „Seitenspiegel“
  {
    // Lösung: Prisma (1,5) rot 2 · Spiegel (1,3) rot 3 · Spiegel (3,5) rot 1 · Spiegel (4,5) rot 1 ·
    //   Prisma (6,5) rot 6 · Spiegel (6,4) rot 1
    // Generator mittel-sammelstelle, Seed 20056, Ziel 52–58 · Ausbau „mittel“
    name: 'Iris', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'cyan' },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'prism', x: 6, z: 5, rot: 5 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'red' },
    ],
    solution: { '1,5': 2, '1,3': 3, '3,5': 1, '4,5': 1, '6,5': 6, '6,4': 1 },
  },
  // Platz im Spiel: nach „Iris“
  {
    // Lösung: Spiegel (4,6) rot 1 · Spiegel (4,3) rot 1 · Spiegel (2,3) rot 1 · Spiegel (2,6) rot 3 ·
    //   Prisma (4,1) rot 3 · Spiegel (0,1) rot 1 · Spiegel (0,0) rot 3 · Spiegel (2,0) rot 1
    // Generator mittel-abzaehlen, Seed 10043 · Ausbau „mittel“
    name: 'Messing', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'yellow' },
      { type: 'target', x: 5, z: 3, color: 'red' },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'prism', x: 4, z: 1, rot: 4 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
    ],
    solution: { '4,6': 1, '4,3': 1, '2,3': 1, '2,6': 3, '4,1': 3, '0,1': 1, '0,0': 3, '2,0': 1 },
  },
  // Platz im Spiel: nach „Messing“
  {
    // Lösung: Spiegel (5,3) rot 3 · Spiegel (5,1) rot 3 · Spiegel (2,1) rot 1 · Spiegel (2,3) rot 1 ·
    //   Prisma (2,4) rot 5 · Spiegel (0,4) rot 3 · Spiegel (1,1) rot 3 · Spiegel (6,1) rot 3
    // Generator mittel-abzaehlen, Seed 20192, Ziel 52–58 · Ausbau „mittel“
    name: 'Neptun', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'blue' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 2, z: 0, color: 'white' },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'red' },
    ],
    solution: { '5,3': 3, '5,1': 3, '2,1': 1, '2,3': 1, '2,4': 5, '0,4': 3, '1,1': 3, '6,1': 3 },
  },
  // Platz im Spiel: nach „Neptun“
  {
    // Lösung: Spiegel (0,4) rot 1 · Spiegel (0,2) rot 3 · Spiegel (4,5) rot 1 · Spiegel (6,5) rot 1 ·
    //   Spiegel (6,6) rot 3 · Spiegel (5,6) rot 1 · Spiegel (5,3) rot 1 · Prisma (3,3) rot 5
    // Generator mittel-mischziel, Seed 10045 · Ausbau „mittel“
    name: 'Astrolabium', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'prism', x: 3, z: 3, rot: 1 },
      { type: 'target', x: 2, z: 3, color: 'red' },
      { type: 'target', x: 1, z: 1, color: 'green' },
    ],
    solution: { '0,4': 1, '0,2': 3, '4,5': 1, '6,5': 1, '6,6': 3, '5,6': 1, '5,3': 1, '3,3': 5 },
  },
  // Platz im Spiel: nach „Astrolabium“
  {
    // Lösung: Prisma (2,2) rot 1 · Spiegel (2,4) rot 3 · Spiegel (3,2) rot 1 · Spiegel (3,3) rot 1 ·
    //   Spiegel (4,6) rot 3 · Spiegel (4,3) rot 3 · Spiegel (4,0) rot 1 · Prisma (5,3) rot 0
    // Generator mittel-falle, Seed 11104 · Ausbau „mittel“
    name: 'Gewölbe', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 1, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 5 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'prism', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'green' },
    ],
    solution: { '2,2': 1, '2,4': 3, '3,2': 1, '3,3': 1, '4,6': 3, '4,3': 3, '4,0': 1, '5,3': 0 },
  },
  // Platz im Spiel: nach „Gewölbe“
  {
    // Lösung: Prisma (5,4) rot 2 · Spiegel (6,4) rot 3 · Spiegel (1,1) rot 0 · Prisma (2,0) rot 7 ·
    //   Spiegel (3,0) rot 1 · Spiegel (3,5) rot 3 · Spiegel (2,6) rot 1
    // Generator mittel-sammelstelle, Seed 20259, Ziel 52–58 · Ausbau „mittel“
    name: 'Gezeitenkreis', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'green' },
      { type: 'target', x: 4, z: 5, color: 'blue' },
      { type: 'target', x: 5, z: 6, color: 'cyan' },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'prism', x: 2, z: 0, rot: 6 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
    ],
    solution: { '5,4': 2, '6,4': 3, '1,1': 0, '2,0': 7, '3,0': 1, '3,5': 3, '2,6': 1 },
  },
  // Platz im Spiel: nach „Gezeitenkreis“
  {
    // Lösung: Spiegel (2,3) rot 3 · Spiegel (2,6) rot 0 · Spiegel (1,5) rot 2 · Spiegel (2,0) rot 1 ·
    //   Spiegel (0,4) rot 2 · Spiegel (0,0) rot 3 · Spiegel (0,1) rot 1 · Prisma (3,1) rot 6
    // Generator mittel-abschalten, Seed 11092 · Ausbau „mittel“
    name: 'Lotus', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'target', x: 2, z: 4, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'green' },
      { type: 'prism', x: 3, z: 1, rot: 4 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'green' },
    ],
    solution: { '2,3': 3, '2,6': 0, '1,5': 2, '2,0': 1, '0,4': 2, '0,0': 3, '0,1': 1, '3,1': 6 },
  },
  // Platz im Spiel: nach „Lotus“
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (5,2) rot 1 · Spiegel (5,0) rot 3 · Spiegel (2,0) rot 1 ·
    //   Prisma (2,3) rot 5 · Spiegel (1,3) rot 3 · Spiegel (1,5) rot 3 · Spiegel (0,5) rot 1
    // Generator mittel-abzaehlen, Seed 10033 · Ausbau „mittel“
    name: 'Abendlicht', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'blue' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 5, z: 5, color: 'white' },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'prism', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
    ],
    solution: { '2,2': 1, '5,2': 1, '5,0': 3, '2,0': 1, '2,3': 5, '1,3': 3, '1,5': 3, '0,5': 1 },
  },
  // Platz im Spiel: nach „Abendlicht“
  {
    // Lösung: Spiegel (1,5) rot 1 · Spiegel (0,5) rot 1 · Spiegel (5,3) rot 3 · Prisma (0,2) rot 5 ·
    //   Spiegel (0,1) rot 3 · Spiegel (3,1) rot 3 · Spiegel (3,0) rot 1 · Spiegel (1,0) rot 3
    // Generator mittel-mischziel, Seed 10157 · Ausbau „mittel“
    name: 'Rundbogen', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'target', x: 4, z: 5, color: 'blue' },
    ],
    solution: { '1,5': 1, '0,5': 1, '5,3': 3, '0,2': 5, '0,1': 3, '3,1': 3, '3,0': 1, '1,0': 3 },
  },
  // Platz im Spiel: nach „Rundbogen“
  {
    // Lösung: Spiegel (6,4) rot 3 · Spiegel (3,4) rot 3 · Prisma (6,0) rot 1 · Spiegel (3,6) rot 3 ·
    //   Spiegel (1,6) rot 1 · Spiegel (1,2) rot 3 · Spiegel (2,2) rot 3 · Spiegel (2,1) rot 1
    // Generator mittel-mischziel, Seed 20146, Ziel 52–58 · Ausbau „mittel“
    name: 'Spitzbogen', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 0, rot: 5 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
    ],
    solution: { '6,4': 3, '3,4': 3, '6,0': 1, '3,6': 3, '1,6': 1, '1,2': 3, '2,2': 3, '2,1': 1 },
  },
  // Platz im Spiel: nach „Spitzbogen“
  {
    // Lösung: Spiegel (5,2) rot 1 · Spiegel (0,1) rot 2 · Spiegel (4,5) rot 0 · Spiegel (5,0) rot 1 ·
    //   Prisma (3,6) rot 5 · Spiegel (1,4) rot 0 · Spiegel (2,0) rot 3 · Kombinator (2,6) dir 5
    // Generator mittel-abschalten, Seed 20058, Ziel 52–58 · Ausbau „mittel“
    name: 'Camera obscura', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'target', x: 5, z: 4, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'yellow' },
      { type: 'prism', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'combiner', x: 2, z: 6, dir: 2 },
      { type: 'target', x: 1, z: 5, color: 'magenta' },
    ],
    solution: { '5,2': 1, '0,1': 2, '4,5': 0, '5,0': 1, '3,6': 5, '1,4': 0, '2,0': 3, '2,6': 5 },
  },
  // Platz im Spiel: nach „Wechselspiel“
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (1,1) rot 2 · Spiegel (0,2) rot 2 · Spiegel (4,2) rot 0 ·
    //   Prisma (6,4) rot 3 · Spiegel (5,5) rot 0 · Spiegel (1,6) rot 1 · Spiegel (1,4) rot 1
    // Generator mittel-mischziel, Seed 20095, Ziel 52–58 · Ausbau „mittel“
    name: 'Hortensie', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'magenta' },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'prism', x: 6, z: 4, rot: 5 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'red' },
    ],
    solution: { '3,1': 3, '1,1': 2, '0,2': 2, '4,2': 0, '6,4': 3, '5,5': 0, '1,6': 1, '1,4': 1 },
  },
  // Platz im Spiel: nach „Walzer“
  {
    // Lösung: Spiegel (2,2) rot 3 · Spiegel (1,1) rot 1 · Spiegel (1,4) rot 3 · Spiegel (4,1) rot 3 ·
    //   Spiegel (1,0) rot 3 · Spiegel (2,0) rot 1 · Spiegel (1,2) rot 3 · Prisma (0,5) rot 3
    // Generator mittel-mischziel, Seed 20185, Ziel 52–58 · Ausbau „mittel“
    name: 'Pingpong', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'target', x: 2, z: 4, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'prism', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '2,2': 3, '1,1': 1, '1,4': 3, '4,1': 3, '1,0': 3, '2,0': 1, '1,2': 3, '0,5': 3 },
  },
  // Platz im Spiel: nach „Glasharfe“
  {
    // Lösung: Prisma (4,4) rot 6 · Spiegel (2,2) rot 0 · Spiegel (5,3) rot 2 · Spiegel (4,2) rot 2 ·
    //   Spiegel (5,1) rot 2 · Spiegel (1,0) rot 0 · Spiegel (6,3) rot 2 · Prisma (4,1) rot 6
    // Generator mittel-falle, Seed 10442 · Ausbau „mittel“
    name: 'Gegenschein', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'target', x: 4, z: 0, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 0, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'red' },
    ],
    solution: { '4,4': 6, '2,2': 0, '5,3': 2, '4,2': 2, '5,1': 2, '1,0': 0, '6,3': 2, '4,1': 6 },
  },
  // Platz im Spiel: nach „Gegenschein“
  {
    // Lösung: Spiegel (5,4) rot 1 · Spiegel (1,3) rot 3 · Spiegel (4,5) rot 1 · Prisma (4,6) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (3,4) rot 3 · Spiegel (5,5) rot 1 · Spiegel (6,5) rot 1
    // Generator mittel-mischziel, Seed 20344, Ziel 52–58 · Ausbau „mittel“
    name: 'Nachglühen', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'green' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'target', x: 5, z: 3, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'prism', x: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '5,4': 1, '1,3': 3, '4,5': 1, '4,6': 3, '3,6': 1, '3,4': 3, '5,5': 1, '6,5': 1 },
  },
  // Platz im Spiel: nach „Laterna magica“
  {
    // Lösung: Prisma (4,2) rot 5 · Spiegel (4,0) rot 3 · Spiegel (3,2) rot 1 · Spiegel (3,1) rot 1 ·
    //   Prisma (1,1) rot 3 · Spiegel (0,1) rot 3 · Spiegel (0,2) rot 1
    // Generator mittel-falle, Seed 20288, Ziel 52–58 · Ausbau „mittel“
    name: 'Flut', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'prism', x: 1, z: 1, rot: 5 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 3, z: 3, color: 'blue' },
    ],
    solution: { '4,2': 5, '4,0': 3, '3,2': 1, '3,1': 1, '1,1': 3, '0,1': 3, '0,2': 1 },
  },
  // Platz im Spiel: nach „Flut“
  {
    // Lösung: Prisma (3,2) rot 2 · Spiegel (3,6) rot 3 · Spiegel (1,6) rot 1 · Prisma (0,3) rot 2 ·
    //   Spiegel (1,5) rot 3
    // Generator mittel-sammelstelle, Seed 10777 · Ausbau „mittel“
    name: 'Ebbe', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 2, rot: 7 },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'cyan' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'target', x: 0, z: 5, color: 'cyan' },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'prism', x: 0, z: 3, rot: 5 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
    ],
    solution: { '3,2': 2, '3,6': 3, '1,6': 1, '0,3': 2, '1,5': 3 },
  },
  // Platz im Spiel: nach „Ebbe“
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (3,2) rot 3 · Spiegel (3,5) rot 1 · Spiegel (5,5) rot 1 ·
    //   Prisma (2,2) rot 7 · Spiegel (2,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (5,6) rot 3
    // Generator mittel-abzaehlen, Seed 20220, Ziel 52–58 · Ausbau „mittel“
    name: 'Uranus', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'target', x: 2, z: 5, color: 'white' },
      { type: 'target', x: 3, z: 1, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'prism', x: 2, z: 2, rot: 5 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 4, z: 6, color: 'red' },
    ],
    solution: { '5,2': 3, '3,2': 3, '3,5': 1, '5,5': 1, '2,2': 7, '2,1': 1, '5,0': 1, '5,6': 3 },
  },
  // Platz im Spiel: nach „Uranus“
  {
    // Lösung: Prisma (0,2) rot 0 · Spiegel (5,2) rot 1 · Spiegel (5,4) rot 3 · Spiegel (1,4) rot 3 ·
    //   Spiegel (5,5) rot 1 · Spiegel (6,5) rot 1 · Prisma (6,6) rot 4
    // Generator mittel-sammelstelle, Seed 10778 · Ausbau „mittel“
    name: 'Flieder', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 2, rot: 4 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 1, z: 1, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'prism', x: 6, z: 6, rot: 2 },
    ],
    solution: { '0,2': 0, '5,2': 1, '5,4': 3, '1,4': 3, '5,5': 1, '6,5': 1, '6,6': 4 },
  },
  // Platz im Spiel: nach „Flieder“
  {
    // Lösung: Prisma (2,5) rot 4 · Spiegel (3,6) rot 0 · Spiegel (5,2) rot 2 · Spiegel (2,1) rot 2 ·
    //   Prisma (1,2) rot 2 · Spiegel (2,3) rot 0 · Spiegel (5,0) rot 0
    // Generator mittel-sammelstelle, Seed 10368 · Ausbau „mittel“
    name: 'Lichtwirbel', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 5, rot: 0 },
      { type: 'source', x: 6, z: 3, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'source', x: 3, z: 0, dir: 1, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 1, z: 4, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '2,5': 4, '3,6': 0, '5,2': 2, '2,1': 2, '1,2': 2, '2,3': 0, '5,0': 0 },
  },
  // Platz im Spiel: nach „Lichtwirbel“
  {
    // Lösung: Spiegel (3,4) rot 1 · Spiegel (0,5) rot 1 · Spiegel (5,3) rot 2 · Prisma (6,4) rot 3 ·
    //   Spiegel (3,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 · Spiegel (2,0) rot 3
    // Generator mittel-mischziel, Seed 10902 · Ausbau „mittel“
    name: 'Waagschale', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'prism', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '3,4': 1, '0,5': 1, '5,3': 2, '6,4': 3, '3,1': 3, '6,1': 3, '6,0': 1, '2,0': 3 },
  },
  // Platz im Spiel: nach „Waagschale“
  {
    // Lösung: Spiegel (3,2) rot 3 · Spiegel (5,1) rot 0 · Prisma (4,0) rot 3 · Spiegel (4,5) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (6,2) rot 1 · Spiegel (6,3) rot 3
    // Generator mittel-mischziel, Seed 20323, Ziel 52–58 · Ausbau „mittel“
    name: 'Orchidee', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 1, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 0, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'prism', x: 4, z: 0, rot: 6 },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'target', x: 2, z: 3, color: 'red' },
    ],
    solution: { '3,2': 3, '5,1': 0, '4,0': 3, '4,5': 1, '5,5': 1, '6,2': 1, '6,3': 3 },
  },
  // Platz im Spiel: nach „Kristall“
  {
    // Lösung: Prisma (4,3) rot 1 · Spiegel (2,6) rot 0 · Prisma (1,5) rot 6 · Spiegel (0,4) rot 2 ·
    //   Spiegel (5,1) rot 2 · Spiegel (4,0) rot 0 · Spiegel (0,2) rot 2
    // Generator mittel-sammelstelle, Seed 10833 · Ausbau „mittel“
    name: 'Glut', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'blue' },
      { type: 'target', x: 5, z: 4, color: 'green' },
      { type: 'target', x: 4, z: 4, color: 'magenta' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'magenta' },
      { type: 'mirror', x: 3, z: 5, rot: 0, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'prism', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
    ],
    solution: { '4,3': 1, '2,6': 0, '1,5': 6, '0,4': 2, '5,1': 2, '4,0': 0, '0,2': 2 },
  },
  // Platz im Spiel: nach „Glut“
  {
    // Lösung: Prisma (3,6) rot 6 · Spiegel (4,6) rot 3 · Prisma (2,5) rot 5 · Prisma (5,2) rot 1 ·
    //   Spiegel (0,5) rot 1 · Spiegel (0,1) rot 3
    // Generator mittel-sammelstelle, Seed 11055 · Ausbau „mittel“
    name: 'Tulpe', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 6, rot: 7 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'green' },
      { type: 'target', x: 6, z: 3, color: 'cyan' },
      { type: 'target', x: 3, z: 1, color: 'yellow' },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'cyan' },
      { type: 'prism', x: 2, z: 5, rot: 6 },
      { type: 'prism', x: 5, z: 2, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
    ],
    solution: { '3,6': 6, '4,6': 3, '2,5': 5, '5,2': 1, '0,5': 1, '0,1': 3 },
  },
  // Platz im Spiel: nach „Tulpe“
  {
    // Lösung: Prisma (5,5) rot 4 · Spiegel (5,4) rot 1 · Spiegel (5,6) rot 3 · Prisma (5,3) rot 7 ·
    //   Spiegel (6,3) rot 3 · Spiegel (6,1) rot 1
    // Generator mittel-sammelstelle, Seed 10695 · Ausbau „mittel“
    name: 'Morgendämmerung', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 1 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'target', x: 2, z: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'prism', x: 5, z: 3, rot: 4 },
      { type: 'mirror', x: 5, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
    ],
    solution: { '5,5': 4, '5,4': 1, '5,6': 3, '5,3': 7, '6,3': 3, '6,1': 1 },
  },
  // Platz im Spiel: nach „Gleichgewicht“
  {
    // Lösung: Prisma (3,0) rot 3 · Spiegel (6,0) rot 1 · Spiegel (5,2) rot 2 · Spiegel (2,1) rot 0 ·
    //   Spiegel (1,0) rot 0 · Spiegel (0,1) rot 2 · Spiegel (1,2) rot 2 · Spiegel (0,3) rot 2
    // Generator mittel-sammelstelle, Seed 11111 · Ausbau „mittel“
    name: 'Zwischenlicht', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 0, rot: 6 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
    ],
    solution: { '3,0': 3, '6,0': 1, '5,2': 2, '2,1': 0, '1,0': 0, '0,1': 2, '1,2': 2, '0,3': 2 },
  },
  // Platz im Spiel: nach „Silberstreif“
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (3,2) rot 1 · Spiegel (6,2) rot 1 · Spiegel (4,4) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (2,2) rot 3 · Spiegel (0,4) rot 3 · Spiegel (4,3) rot 1
    // Generator mittel-abschalten, Seed 10704 · Ausbau „mittel“
    name: 'Lavendel', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'filter', x: 2, z: 5, color: 'cyan' },
      { type: 'mirror', x: 2, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'target', x: 1, z: 3, color: 'cyan' },
    ],
    solution: { '5,4': 3, '3,2': 1, '6,2': 1, '4,4': 3, '3,6': 1, '2,2': 3, '0,4': 3, '4,3': 1 },
  },
  // Platz im Spiel: nach „Lavendel“
  {
    // Lösung: Prisma (4,4) rot 3 · Spiegel (5,6) rot 1 · Spiegel (5,4) rot 3 · Spiegel (4,5) rot 1 ·
    //   Spiegel (5,5) rot 1 · Prisma (3,3) rot 6 · Spiegel (3,0) rot 1
    // Wertung 34.4 · 7 drehbar · 4 Ziele · Rateschritte 640 · Profil mittel2/b-4-prisma, Seed 4083721
    name: 'Prismenreigen', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 0, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'prism', x: 4, z: 4, rot: 1 },
      { type: 'target', x: 2, z: 4, color: 'cyan' },
      { type: 'target', x: 2, z: 5, color: 'white' },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'red' },
    ],
    solution: { '4,4': 3, '5,6': 1, '5,4': 3, '4,5': 1, '5,5': 1, '3,3': 6, '3,0': 1 },
  },
  // Platz im Spiel: nach „Prismenreigen“
  {
    // Lösung: Spiegel (4,4) rot 3 · Spiegel (2,4) rot 3 · Spiegel (2,1) rot 1 · Spiegel (4,1) rot 3 ·
    //   Prisma (4,5) rot 5 · Spiegel (0,5) rot 3 · Spiegel (0,6) rot 1 · Spiegel (1,6) rot 3
    // Generator mittel-abzaehlen, Seed 10923 · Ausbau „mittel“
    name: 'Abendglut', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'white' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'target', x: 5, z: 4, color: 'blue' },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
    ],
    solution: { '4,4': 3, '2,4': 3, '2,1': 1, '4,1': 3, '4,5': 5, '0,5': 3, '0,6': 1, '1,6': 3 },
  },
  // Platz im Spiel: nach „Abendglut“
  {
    // Lösung: Spiegel (6,1) rot 3 · Spiegel (3,2) rot 0 · Spiegel (2,0) rot 1 · Prisma (1,1) rot 7 ·
    //   Prisma (1,4) rot 6 · Prisma (2,2) rot 5 · Spiegel (0,2) rot 3 · Spiegel (0,3) rot 1
    // Generator mittel-lockvogel, Seed 10082 · Ausbau „mittel“
    name: 'Silberblick', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'mirror', x: 6, z: 2, rot: 3, fixed: true },
      { type: 'prism', x: 1, z: 1, rot: 1 },
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'prism', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 5, z: 3, color: 'red' },
    ],
    solution: { '6,1': 3, '3,2': 0, '2,0': 1, '1,1': 7, '1,4': 6, '2,2': 5, '0,2': 3, '0,3': 1 },
  },
  // Platz im Spiel: nach „Silberblick“
  {
    // Lösung: Prisma (4,3) rot 6 · Spiegel (4,5) rot 3 · Spiegel (4,0) rot 3 · Spiegel (5,0) rot 1 ·
    //   Spiegel (5,1) rot 3 · Spiegel (0,1) rot 3 · Spiegel (0,2) rot 1 · Spiegel (1,2) rot 3
    // Generator mittel-sammelstelle, Seed 10838 · Ausbau „mittel“
    name: 'Narzisse', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 0 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'yellow' },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'blocker', x: 2, z: 0 },
    ],
    solution: { '4,3': 6, '4,5': 3, '4,0': 3, '5,0': 1, '5,1': 3, '0,1': 3, '0,2': 1, '1,2': 3 },
  },
  // Platz im Spiel: nach „Narzisse“
  {
    // Lösung: Spiegel (5,3) rot 3 · Spiegel (5,4) rot 3 · Spiegel (2,4) rot 1 · Spiegel (6,1) rot 3 ·
    //   Prisma (4,4) rot 5 · Prisma (1,1) rot 2 · Spiegel (3,3) rot 0
    // Wertung 29.4 · 7 drehbar · 4 Ziele · Rateschritte 206 · Profil mittel/4-prisma, Seed 2016846
    name: 'Lichtbogen', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 1, z: 1, rot: 5 },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 4, z: 2, color: 'magenta' },
      { type: 'target', x: 1, z: 5, color: 'green' },
    ],
    solution: { '5,3': 3, '5,4': 3, '2,4': 1, '6,1': 3, '4,4': 5, '1,1': 2, '3,3': 0 },
  },
  // Platz im Spiel: nach „Lichtbogen“
  {
    // Lösung: Spiegel (1,5) rot 3 · Spiegel (0,2) rot 1 · Spiegel (3,5) rot 3 · Spiegel (0,3) rot 3 ·
    //   Prisma (2,3) rot 7 · Prisma (3,1) rot 4 · Kombinator (3,2) dir 6
    // Wertung 29.2 · 7 drehbar · 3 Ziele · Rateschritte 188 · Profil mittel2/4-bunt, Seed 3007714
    name: 'Doppelspiegel', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 6, dir: 6 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'prism', x: 2, z: 3, rot: 3 },
      { type: 'combiner', x: 3, z: 2, dir: 3 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 1, color: 'yellow' },
      { type: 'target', x: 5, z: 3, color: 'blue' },
    ],
    solution: { '1,5': 3, '0,2': 1, '3,5': 3, '0,3': 3, '2,3': 7, '3,1': 4, '3,2': 6 },
  },
  // Platz im Spiel: nach „Doppelspiegel“
  {
    // Lösung: Prisma (4,4) rot 3 · Spiegel (5,4) rot 1 · Spiegel (6,2) rot 2 · Prisma (1,2) rot 1 ·
    //   Spiegel (0,4) rot 1 · Spiegel (2,0) rot 1
    // Generator mittel-sammelstelle, Seed 286, Ziel 56,2–57,26 · ersetzt Glasbläser (Austausch „mittel“)
    name: 'Türkis', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 6 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 1, color: 'red' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'target', x: 3, z: 5, color: 'green' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'prism', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 3, color: 'cyan' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
    ],
    solution: { '4,4': 3, '5,4': 1, '6,2': 2, '1,2': 1, '0,4': 1, '2,0': 1 },
  },
  // Platz im Spiel: nach „Türkis“
  {
    // Lösung: Prisma (4,5) rot 0 · Spiegel (3,4) rot 0 · Spiegel (4,6) rot 1 · Spiegel (2,0) rot 1 ·
    //   Prisma (1,0) rot 4 · Spiegel (1,4) rot 0 · Spiegel (0,3) rot 2
    // Generator mittel-sammelstelle, Seed 68, Ziel 57,28–58,31 · ersetzt Libelle (Austausch „mittel“)
    name: 'Rundflug', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 1 },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'green' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'prism', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 5, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'target', x: 3, z: 0, color: 'red' },
    ],
    solution: { '4,5': 0, '3,4': 0, '4,6': 1, '2,0': 1, '1,0': 4, '1,4': 0, '0,3': 2 },
  },
  // Platz im Spiel: nach „Doppelstern“
  {
    // Lösung: Spiegel (1,2) rot 3 · Spiegel (4,0) rot 1 · Spiegel (4,1) rot 3 · Spiegel (1,3) rot 1 ·
    //   Spiegel (1,5) rot 3 · Spiegel (5,1) rot 3 · Spiegel (4,4) rot 1 · Spiegel (5,3) rot 1 ·
    //   Spiegel (5,4) rot 1 · Spiegel (6,4) rot 3
    // Generator schwer-abschalten, Seed 10207 · Ausbau „schwer“
    name: 'Gewürzroute', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'green' },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'target', x: 1, z: 1, color: 'green' },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'green' },
    ],
    solution: { '1,2': 3, '4,0': 1, '4,1': 3, '1,3': 1, '1,5': 3, '5,1': 3, '4,4': 1, '5,3': 1, '5,4': 1, '6,4': 3 },
  },
  // Platz im Spiel: nach „Irrgarten“
  {
    // Lösung: Spiegel (6,3) rot 1 · Spiegel (5,2) rot 3 · Spiegel (3,3) rot 1 · Spiegel (5,5) rot 1 ·
    //   Prisma (6,5) rot 5 · Spiegel (5,4) rot 3 · Kombinator (6,4) dir 6
    // Wertung 35.2 · 7 drehbar · 3 Ziele · Rateschritte 841 · Profil 4-misch, Seed 9975
    name: 'Sonnenwende', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'prism', x: 6, z: 5, rot: 6 },
      { type: 'combiner', x: 6, z: 4, dir: 3 },
      { type: 'target', x: 1, z: 0, color: 'white' },
      { type: 'target', x: 3, z: 2, color: 'magenta' },
      { type: 'target', x: 0, z: 5, color: 'white' },
    ],
    solution: { '6,3': 1, '5,2': 3, '3,3': 1, '5,5': 1, '6,5': 5, '5,4': 3, '6,4': 6 },
  },
  // Platz im Spiel: nach „Sonnenwende“
  {
    // Lösung: Spiegel (6,1) rot 3 · Spiegel (2,1) rot 3 · Prisma (3,1) rot 4 · Spiegel (2,3) rot 1 ·
    //   Spiegel (5,3) rot 1 · Spiegel (0,3) rot 3 · Spiegel (2,0) rot 0 · Kombinator (2,2) dir 2
    // Wertung 40.5 · 8 drehbar · 4 Ziele · Rateschritte 2333 · Profil mittel2/b-4-misch, Seed 4169824
    name: 'Pendel', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'prism', x: 3, z: 1, rot: 2 },
      { type: 'combiner', x: 2, z: 2, dir: 7 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 6, z: 3, color: 'white' },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 5, color: 'white' },
    ],
    solution: { '6,1': 3, '2,1': 3, '3,1': 4, '2,3': 1, '5,3': 1, '0,3': 3, '2,0': 0, '2,2': 2 },
  },
  // Platz im Spiel: nach „Pendel“
  {
    // Lösung: Prisma (6,5) rot 3 · Spiegel (6,0) rot 1 · Spiegel (5,4) rot 0 · Spiegel (4,4) rot 1 ·
    //   Prisma (3,4) rot 4 · Spiegel (2,4) rot 1 · Spiegel (2,3) rot 3 · Spiegel (4,3) rot 3
    // Generator schwer-sammelstelle, Seed 10379 · Ausbau „schwer“
    name: 'Fernweh', grad: 'schwer',
    elements: [
      { type: 'prism', x: 6, z: 5, rot: 6 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'source', x: 3, z: 6, dir: 7, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'magenta' },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'prism', x: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 1, color: 'green' },
      { type: 'blocker', x: 3, z: 2 },
    ],
    solution: { '6,5': 3, '6,0': 1, '5,4': 0, '4,4': 1, '3,4': 4, '2,4': 1, '2,3': 3, '4,3': 3 },
  },
  // Platz im Spiel: nach „Gipfelsturm“
  {
    // Lösung: Spiegel (1,4) rot 1 · Spiegel (3,1) rot 3 · Spiegel (0,1) rot 3 · Spiegel (5,4) rot 1 ·
    //   Spiegel (6,4) rot 1 · Spiegel (5,2) rot 3 · Spiegel (3,5) rot 3 · Spiegel (4,0) rot 3 ·
    //   Spiegel (5,5) rot 3 · Spiegel (3,6) rot 3
    // Generator schwer-abschalten, Seed 10488 · Ausbau „schwer“
    name: 'Entdeckungsreise', grad: 'schwer',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'blue' },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'yellow' },
    ],
    solution: { '1,4': 1, '3,1': 3, '0,1': 3, '5,4': 1, '6,4': 1, '5,2': 3, '3,5': 3, '4,0': 3, '5,5': 3, '3,6': 3 },
  },
  // Platz im Spiel: nach „Entdeckungsreise“
  {
    // Lösung: Prisma (3,5) rot 3 · Spiegel (6,5) rot 3 · Spiegel (3,0) rot 1 · Spiegel (5,3) rot 3 ·
    //   Spiegel (2,3) rot 1 · Prisma (2,2) rot 7 · Spiegel (2,1) rot 1 · Spiegel (0,1) rot 3
    // Generator schwer-sammelstelle, Seed 10383 · Ausbau „schwer“
    name: 'Schachzug', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 5, rot: 0 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 4, z: 1, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
    ],
    solution: { '3,5': 3, '6,5': 3, '3,0': 1, '5,3': 3, '2,3': 1, '2,2': 7, '2,1': 1, '0,1': 3 },
  },
  // Platz im Spiel: nach „Segeltörn“
  {
    // Lösung: Spiegel (5,3) rot 1 · Spiegel (2,1) rot 3 · Spiegel (2,4) rot 1 · Spiegel (5,2) rot 3 ·
    //   Spiegel (1,4) rot 1 · Spiegel (0,1) rot 3 · Spiegel (0,2) rot 1 · Spiegel (5,0) rot 1 ·
    //   Spiegel (2,5) rot 3 · Spiegel (1,0) rot 1
    // Generator schwer-abschalten, Seed 10087 · Ausbau „schwer“
    name: 'Karawane', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 2, color: 'yellow' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'blue' },
    ],
    solution: { '5,3': 1, '2,1': 3, '2,4': 1, '5,2': 3, '1,4': 1, '0,1': 3, '0,2': 1, '5,0': 1, '2,5': 3, '1,0': 1 },
  },
  // Platz im Spiel: nach „Nordwand“
  {
    // Lösung: Spiegel (1,3) rot 3 · Spiegel (5,4) rot 3 · Spiegel (4,4) rot 3 · Prisma (4,5) rot 3 ·
    //   Spiegel (1,5) rot 1 · Spiegel (2,3) rot 3 · Spiegel (2,2) rot 3 · Spiegel (6,2) rot 3 ·
    //   Spiegel (6,1) rot 1 · Spiegel (2,1) rot 1
    // Generator schwer-mischziel, Seed 10538 · Ausbau „schwer“
    name: 'Wehrgang', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'target', x: 1, z: 2, color: 'white' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'prism', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
    ],
    solution: { '1,3': 3, '5,4': 3, '4,4': 3, '4,5': 3, '1,5': 1, '2,3': 3, '2,2': 3, '6,2': 3, '6,1': 1, '2,1': 1 },
  },
  // Platz im Spiel: nach „Wegweiser“
  {
    // Lösung: Prisma (2,5) rot 6 · Spiegel (2,4) rot 3 · Spiegel (1,4) rot 3 · Spiegel (2,3) rot 1 ·
    //   Spiegel (4,3) rot 1 · Spiegel (2,1) rot 1 · Spiegel (4,4) rot 3
    // Wertung 31.6 · 7 drehbar · 3 Ziele · Rateschritte 386 · Profil 4-filter, Seed 36729
    name: 'Kathedrale', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'prism', x: 2, z: 5, rot: 3 },
      { type: 'filter', x: 1, z: 5, color: 'yellow' },
      { type: 'target', x: 1, z: 1, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'yellow' },
      { type: 'target', x: 5, z: 5, color: 'white' },
    ],
    solution: { '2,5': 6, '2,4': 3, '1,4': 3, '2,3': 1, '4,3': 1, '2,1': 1, '4,4': 3 },
  },
  // Platz im Spiel: nach „Kathedrale“
  {
    // Lösung: Spiegel (6,2) rot 3 · Spiegel (2,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (6,4) rot 1 ·
    //   Prisma (1,3) rot 2 · Prisma (6,1) rot 3 · Spiegel (3,1) rot 1
    // Generator schwer-abzaehlen, Seed 370, Ziel 58,5–59,28 · ersetzt Opal (Austausch „schwer“)
    name: 'Tandem', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 1, z: 4, color: 'yellow' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'prism', x: 1, z: 3, rot: 6 },
      { type: 'prism', x: 6, z: 1, rot: 6 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '6,2': 3, '2,2': 1, '2,4': 1, '6,4': 1, '1,3': 2, '6,1': 3, '3,1': 1 },
  },
  // Platz im Spiel: nach „Passstrasse“
  {
    // Lösung: Spiegel (3,0) rot 3 · Prisma (3,2) rot 1 · Spiegel (3,3) rot 3 · Prisma (3,1) rot 3 ·
    //   Spiegel (5,2) rot 1 · Spiegel (5,1) rot 3 · Kombinator (2,2) dir 0
    // Wertung 37.9 · 7 drehbar · 5 Ziele · Rateschritte 1216 · Profil 4-bunt, Seed 6120
    name: 'Supernova', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 4 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'prism', x: 3, z: 1, rot: 1 },
      { type: 'prism', x: 3, z: 2, rot: 3 },
      { type: 'combiner', x: 2, z: 2, dir: 1 },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'white' },
      { type: 'target', x: 4, z: 3, color: 'green' },
      { type: 'target', x: 5, z: 4, color: 'red' },
    ],
    solution: { '3,0': 3, '3,2': 1, '3,3': 3, '3,1': 3, '5,2': 1, '5,1': 3, '2,2': 0 },
  },
  // Platz im Spiel: nach „Kaperfahrt“
  {
    // Lösung: Spiegel (2,4) rot 1 · Spiegel (4,4) rot 1 · Spiegel (4,6) rot 1 · Spiegel (2,6) rot 3 ·
    //   Spiegel (1,2) rot 3 · Spiegel (0,2) rot 1 · Spiegel (0,1) rot 3 · Prisma (5,4) rot 5 ·
    //   Spiegel (5,2) rot 3
    // Generator schwer-abzaehlen, Seed 10130 · Ausbau „schwer“
    name: 'Seilschaft', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'prism', x: 5, z: 4, rot: 4 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '2,4': 1, '4,4': 1, '4,6': 1, '2,6': 3, '1,2': 3, '0,2': 1, '0,1': 3, '5,4': 5, '5,2': 3 },
  },
  // Platz im Spiel: nach „Biwak“
  {
    // Lösung: Spiegel (6,2) rot 3 · Spiegel (2,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (6,4) rot 1 ·
    //   Spiegel (3,3) rot 1 · Prisma (4,3) rot 1 · Spiegel (4,5) rot 3 · Spiegel (3,5) rot 3 ·
    //   Spiegel (3,6) rot 1
    // Generator schwer-abzaehlen, Seed 10278 · Ausbau „schwer“
    name: 'Getriebe', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'white' },
      { type: 'target', x: 1, z: 4, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'prism', x: 4, z: 3, rot: 6 },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
    ],
    solution: { '6,2': 3, '2,2': 1, '2,4': 1, '6,4': 1, '3,3': 1, '4,3': 1, '4,5': 3, '3,5': 3, '3,6': 1 },
  },
  // Platz im Spiel: nach „Pilgerweg“
  {
    // Lösung: Prisma (0,1) rot 0 · Spiegel (0,0) rot 3 · Spiegel (0,2) rot 1 · Spiegel (5,6) rot 1 ·
    //   Spiegel (5,3) rot 1 · Prisma (0,3) rot 2 · Spiegel (0,4) rot 1 · Spiegel (2,5) rot 2 ·
    //   Spiegel (1,6) rot 0
    // Generator schwer-sammelstelle, Seed 10402 · Ausbau „schwer“
    name: 'Turmzimmer', grad: 'schwer',
    elements: [
      { type: 'prism', x: 0, z: 1, rot: 6 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 3, z: 4, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'prism', x: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'red' },
    ],
    solution: { '0,1': 0, '0,0': 3, '0,2': 1, '5,6': 1, '5,3': 1, '0,3': 2, '0,4': 1, '2,5': 2, '1,6': 0 },
  },
  // Platz im Spiel: nach „Kompassnadel“
  {
    // Lösung: Spiegel (6,2) rot 1 · Spiegel (1,0) rot 1 · Spiegel (1,1) rot 1 · Spiegel (6,4) rot 3 ·
    //   Spiegel (1,3) rot 1 · Spiegel (1,4) rot 3 · Spiegel (0,4) rot 3 · Spiegel (1,5) rot 1 ·
    //   Spiegel (1,6) rot 3 · Spiegel (2,5) rot 1 · Spiegel (2,6) rot 1
    // Generator schwer-abschalten, Seed 10509 · Ausbau „schwer“
    name: 'Sternenkarte', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'green' },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'target', x: 5, z: 3, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '6,2': 1, '1,0': 1, '1,1': 1, '6,4': 3, '1,3': 1, '1,4': 3, '0,4': 3, '1,5': 1, '1,6': 3, '2,5': 1, '2,6': 1 },
  },
  // Platz im Spiel: nach „Sternenkarte“
  {
    // Lösung: Prisma (1,0) rot 1 · Spiegel (0,1) rot 2 · Prisma (2,6) rot 3 · Spiegel (0,6) rot 1 ·
    //   Spiegel (0,5) rot 3 · Spiegel (4,0) rot 1 · Spiegel (4,1) rot 1 · Spiegel (5,1) rot 3
    // Generator schwer-sammelstelle, Seed 103, Ziel 62,4–64,2 · ersetzt Komet (Austausch „schwer“)
    name: 'Marktplatz', grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, z: 0, rot: 5 },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'green' },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'cyan' },
      { type: 'target', x: 1, z: 4, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'prism', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '1,0': 1, '0,1': 2, '2,6': 3, '0,6': 1, '0,5': 3, '4,0': 1, '4,1': 1, '5,1': 3 },
  },
  // Platz im Spiel: nach „Oase“
  {
    // Lösung: Spiegel (5,3) rot 1 · Spiegel (3,1) rot 1 · Prisma (1,2) rot 7 · Spiegel (1,0) rot 1 ·
    //   Spiegel (2,1) rot 0 · Prisma (5,2) rot 4 · Kombinator (4,1) dir 2
    // Wertung 37.9 · 7 drehbar · 4 Ziele · Rateschritte 1310 · Profil mittel2/b-4-bunt, Seed 4205338
    name: 'Wetterleuchten', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'prism', x: 1, z: 2, rot: 4 },
      { type: 'prism', x: 5, z: 2, rot: 5 },
      { type: 'combiner', x: 4, z: 1, dir: 0 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 2, color: 'white' },
      { type: 'target', x: 2, z: 5, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '5,3': 1, '3,1': 1, '1,2': 7, '1,0': 1, '2,1': 0, '5,2': 4, '4,1': 2 },
  },
  // Platz im Spiel: nach „Wetterleuchten“
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (3,5) rot 2 · Spiegel (2,4) rot 2 · Spiegel (2,1) rot 1 ·
    //   Spiegel (2,3) rot 3 · Prisma (0,3) rot 2 · Spiegel (2,5) rot 0 · Spiegel (0,2) rot 2
    // Generator schwer-abschalten, Seed 50, Ziel 59,45–60,41 · ersetzt Lichthof (Austausch „schwer“)
    name: 'Rollentausch', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'green' },
      { type: 'source', x: 2, z: 6, dir: 7, color: 'green' },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'target', x: 2, z: 0, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'prism', x: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
    ],
    solution: { '3,1': 3, '3,5': 2, '2,4': 2, '2,1': 1, '2,3': 3, '0,3': 2, '2,5': 0, '0,2': 2 },
  },
  // Platz im Spiel: nach „Stabübergabe“
  {
    // Lösung: Spiegel (6,1) rot 3 · Spiegel (4,5) rot 1 · Spiegel (4,1) rot 3 · Spiegel (3,4) rot 3 ·
    //   Spiegel (3,6) rot 1 · Prisma (1,0) rot 7 · Spiegel (3,0) rot 1 · Spiegel (2,4) rot 1 ·
    //   Spiegel (2,1) rot 3
    // Generator schwer-mischziel, Seed 17, Ziel 66,03–70,98 · ersetzt Interferenz (Austausch „schwer“)
    name: 'Achterbahn', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'green' },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 4, z: 3, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 0, z: 1, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'prism', x: 1, z: 0, rot: 5 },
      { type: 'mirror', x: 3, z: 0, rot: 3 },
      { type: 'filter', x: 5, z: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 6, color: 'magenta' },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '6,1': 3, '4,5': 1, '4,1': 3, '3,4': 3, '3,6': 1, '1,0': 7, '3,0': 1, '2,4': 1, '2,1': 3 },
  },
  // Platz im Spiel: nach „Achterbahn“
  {
    // Lösung: Spiegel (1,4) rot 1 · Spiegel (1,6) rot 3 · Spiegel (3,6) rot 1 · Spiegel (3,4) rot 1 ·
    //   Spiegel (5,5) rot 3 · Spiegel (5,0) rot 3 · Spiegel (6,0) rot 1 · Spiegel (6,1) rot 3 ·
    //   Prisma (3,3) rot 1 · Spiegel (6,3) rot 1
    // Generator schwer-abzaehlen, Seed 10139 · Ausbau „schwer“
    name: 'Zugzwang', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'target', x: 4, z: 4, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'white' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'red' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'prism', x: 3, z: 3, rot: 5 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '1,4': 1, '1,6': 3, '3,6': 1, '3,4': 1, '5,5': 3, '5,0': 3, '6,0': 1, '6,1': 3, '3,3': 1, '6,3': 1 },
  },
  // Platz im Spiel: nach „Springergabel“
  {
    // Lösung: Spiegel (1,5) rot 1 · Spiegel (3,5) rot 3 · Spiegel (3,2) rot 3 · Spiegel (1,2) rot 1 ·
    //   Prisma (5,3) rot 7 · Spiegel (5,2) rot 1 · Spiegel (6,2) rot 2 · Spiegel (5,1) rot 2 ·
    //   Prisma (5,5) rot 4
    // Generator schwer-abzaehlen, Seed 21122, Ziel 72–86 · Ausbau „schwer“
    name: 'Geheimgang', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'target', x: 3, z: 6, color: 'green' },
      { type: 'target', x: 1, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'prism', x: 5, z: 3, rot: 5 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'target', x: 6, z: 0, color: 'green' },
      { type: 'prism', x: 5, z: 5, rot: 1 },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '1,5': 1, '3,5': 3, '3,2': 3, '1,2': 1, '5,3': 7, '5,2': 1, '6,2': 2, '5,1': 2, '5,5': 4 },
  },
  // Platz im Spiel: nach „Geheimgang“
  {
    // Lösung: Spiegel (6,4) rot 1 · Spiegel (1,5) rot 3 · Spiegel (5,4) rot 1 · Spiegel (3,5) rot 3 ·
    //   Spiegel (5,1) rot 1 · Prisma (3,4) rot 7 · Spiegel (3,2) rot 1 · Prisma (4,2) rot 7 ·
    //   Spiegel (4,1) rot 1
    // Wertung 38.3 · 9 drehbar · 4 Ziele · Rateschritte 1662 · Profil 5-prisma, Seed 39630
    name: 'Lichtjahr', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 0, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 2, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 1, fixed: true },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'prism', x: 3, z: 4, rot: 3 },
      { type: 'target', x: 4, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 5, color: 'blue' },
    ],
    solution: { '6,4': 1, '1,5': 3, '5,4': 1, '3,5': 3, '5,1': 1, '3,4': 7, '3,2': 1, '4,2': 7, '4,1': 1 },
  },
  // Platz im Spiel: nach „Lichtjahr“
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (5,4) rot 1 · Spiegel (6,3) rot 3 · Spiegel (6,1) rot 1 ·
    //   Spiegel (1,3) rot 1 · Spiegel (5,0) rot 3 · Spiegel (4,5) rot 3 · Spiegel (2,5) rot 1 ·
    //   Spiegel (2,0) rot 3 · Spiegel (3,0) rot 1 · Spiegel (3,4) rot 1
    // Generator schwer-mischziel, Seed 20534, Ziel 72–86 · Ausbau „schwer“
    name: 'Zahnrad', grad: 'schwer',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'target', x: 0, z: 1, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '1,1': 3, '5,4': 1, '6,3': 3, '6,1': 1, '1,3': 1, '5,0': 3, '4,5': 3, '2,5': 1, '2,0': 3, '3,0': 1, '3,4': 1 },
  },
  // Platz im Spiel: nach „Planetarium“
  {
    // Lösung: Spiegel (6,3) rot 1 · Spiegel (4,2) rot 0 · Spiegel (5,5) rot 3 · Prisma (2,3) rot 0 ·
    //   Prisma (3,1) rot 1 · Prisma (5,2) rot 2 · Kombinator (3,2) dir 7 · Spiegel (1,6) rot 0 ·
    //   Spiegel (0,5) rot 2
    // Generator schwer-lockvogel, Seed 20629, Ziel 72–86 · Ausbau „schwer“
    name: 'Orakel', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 1, color: 'cyan' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'target', x: 6, z: 0, color: 'green' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'blocker', x: 2, z: 4 },
      { type: 'prism', x: 2, z: 3, rot: 6 },
      { type: 'prism', x: 3, z: 1, rot: 3 },
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'combiner', x: 3, z: 2, dir: 5 },
      { type: 'target', x: 4, z: 1, color: 'magenta' },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 6, color: 'blue' },
    ],
    solution: { '6,3': 1, '4,2': 0, '5,5': 3, '2,3': 0, '3,1': 1, '5,2': 2, '3,2': 7, '1,6': 0, '0,5': 2 },
  },
  // Platz im Spiel: nach „Orakel“
  {
    // Lösung: Prisma (3,6) rot 7 · Spiegel (1,6) rot 1 · Spiegel (2,5) rot 2 · Spiegel (5,4) rot 0 ·
    //   Spiegel (5,1) rot 2 · Prisma (4,0) rot 3 · Spiegel (0,3) rot 1 · Prisma (0,1) rot 7
    // Generator schwer-sammelstelle, Seed 10313 · Ausbau „schwer“
    name: 'Flaschenpost', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 6, rot: 6 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'red' },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'prism', x: 4, z: 0, rot: 1 },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'target', x: 4, z: 1, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'prism', x: 0, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 0, color: 'red' },
    ],
    solution: { '3,6': 7, '1,6': 1, '2,5': 2, '5,4': 0, '5,1': 2, '4,0': 3, '0,3': 1, '0,1': 7 },
  },
  // Platz im Spiel: nach „Zauberwürfel“
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (2,2) rot 1 · Spiegel (5,1) rot 1 · Spiegel (1,2) rot 3 ·
    //   Spiegel (2,5) rot 3 · Prisma (1,4) rot 7 · Spiegel (3,1) rot 1 · Spiegel (1,5) rot 3 ·
    //   Kombinator (2,3) dir 2
    // Wertung 41.4 · 9 drehbar · 4 Ziele · Rateschritte 2830 · Profil 5-misch, Seed 17552
    name: 'Meisterstück', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 1, fixed: true },
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'combiner', x: 2, z: 3, dir: 7 },
      { type: 'target', x: 3, z: 0, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'target', x: 1, z: 6, color: 'yellow' },
      { type: 'target', x: 5, z: 6, color: 'white' },
    ],
    solution: { '5,4': 3, '2,2': 1, '5,1': 1, '1,2': 3, '2,5': 3, '1,4': 7, '3,1': 1, '1,5': 3, '2,3': 2 },
  },
  // Platz im Spiel: nach „Mäander“
  {
    // Lösung: Prisma (4,2) rot 3 · Spiegel (2,2) rot 1 · Spiegel (4,3) rot 3 · Spiegel (3,3) rot 3 ·
    //   Prisma (5,6) rot 5 · Prisma (1,1) rot 2 · Spiegel (5,4) rot 1 · Kombinator (1,4) dir 3
    // Generator schwer-falle, Seed 10083 · Ausbau „schwer“
    name: 'Turmopfer', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'prism', x: 5, z: 6, rot: 7 },
      { type: 'target', x: 3, z: 5, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'prism', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'combiner', x: 1, z: 4, dir: 5 },
      { type: 'mirror', x: 0, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 0, z: 5, color: 'cyan' },
    ],
    solution: { '4,2': 3, '2,2': 1, '4,3': 3, '3,3': 3, '5,6': 5, '1,1': 2, '5,4': 1, '1,4': 3 },
  },
  // Platz im Spiel: nach „Basislager“
  {
    // Lösung: Spiegel (1,5) rot 3 · Spiegel (5,4) rot 1 · Prisma (2,3) rot 4 · Spiegel (0,3) rot 1 ·
    //   Prisma (6,4) rot 3 · Spiegel (6,6) rot 3 · Spiegel (5,2) rot 1 · Spiegel (4,2) rot 1
    // Generator schwer-mischziel, Seed 20789, Ziel 72–86 · Ausbau „schwer“
    name: 'Himmelsscheibe', grad: 'schwer',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 3, rot: 1 },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'prism', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 3, fixed: true },
    ],
    solution: { '1,5': 3, '5,4': 1, '2,3': 4, '0,3': 1, '6,4': 3, '6,6': 3, '5,2': 1, '4,2': 1 },
  },
  // Platz im Spiel: nach „Sphinx“
  {
    // Lösung: Spiegel (5,2) rot 1 · Prisma (4,5) rot 3 · Spiegel (3,5) rot 1 · Spiegel (3,0) rot 3 ·
    //   Spiegel (5,0) rot 1 · Spiegel (3,6) rot 0 · Spiegel (6,2) rot 3 · Spiegel (6,1) rot 1 ·
    //   Spiegel (1,1) rot 1 · Prisma (1,4) rot 2
    // Generator schwer-mischziel, Seed 10511 · Ausbau „schwer“
    name: 'Falltür', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'cyan' },
      { type: 'prism', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'prism', x: 1, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '5,2': 1, '4,5': 3, '3,5': 1, '3,0': 3, '5,0': 1, '3,6': 0, '6,2': 3, '6,1': 1, '1,1': 1, '1,4': 2 },
  },
  // Platz im Spiel: nach „Puzzlestück“
  {
    // Lösung: Prisma (2,5) rot 5 · Spiegel (2,3) rot 3 · Spiegel (1,4) rot 1 · Spiegel (0,4) rot 3 ·
    //   Spiegel (0,6) rot 1 · Prisma (4,4) rot 6 · Prisma (5,3) rot 7 · Spiegel (5,0) rot 1 ·
    //   Spiegel (2,0) rot 3
    // Generator schwer-falle, Seed 20119, Ziel 75–86 · Ausbau „schwer“
    name: 'Endspiel', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 7 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 3, color: 'cyan' },
      { type: 'mirror', x: 1, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 7 },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'prism', x: 5, z: 3, rot: 6 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
    ],
    solution: { '2,5': 5, '2,3': 3, '1,4': 1, '0,4': 3, '0,6': 1, '4,4': 6, '5,3': 7, '5,0': 1, '2,0': 3 },
  },
  // Platz im Spiel: nach „Endspiel“
  {
    // Lösung: Spiegel (1,5) rot 2 · Spiegel (2,4) rot 2 · Spiegel (1,4) rot 3 · Spiegel (3,2) rot 1 ·
    //   Prisma (3,3) rot 4 · Spiegel (3,0) rot 3 · Prisma (4,2) rot 0 · Spiegel (5,3) rot 0 ·
    //   Spiegel (4,6) rot 0 · Spiegel (5,5) rot 0
    // Generator schwer-mischziel, Seed 20733, Ziel 72–86 · Ausbau „schwer“
    name: 'Knobelei', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 5, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'source', x: 6, z: 0, dir: 4 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'prism', x: 4, z: 2, rot: 7 },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'target', x: 6, z: 6, color: 'red' },
    ],
    solution: { '1,5': 2, '2,4': 2, '1,4': 3, '3,2': 1, '3,3': 4, '3,0': 3, '4,2': 0, '5,3': 0, '4,6': 0, '5,5': 0 },
  },
  // Platz im Spiel: nach „Knobelei“
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (3,2) rot 1 · Spiegel (3,4) rot 1 · Spiegel (5,3) rot 1 ·
    //   Spiegel (5,4) rot 3 · Prisma (3,1) rot 2 · Prisma (2,1) rot 3 · Prisma (5,5) rot 6 ·
    //   Spiegel (1,2) rot 0 · Kombinator (4,2) dir 0
    // Wertung 53.5 · 10 drehbar · 4 Ziele · Rateschritte 70841 · gehärtet aus Profil 3-spiegel, Seed 6012
    name: 'Zwielicht', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'prism', x: 2, z: 1, rot: 7 },
      { type: 'prism', x: 3, z: 1, rot: 1 },
      { type: 'prism', x: 5, z: 5, rot: 5 },
      { type: 'combiner', x: 4, z: 2, dir: 6 },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'target', x: 5, z: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'cyan' },
    ],
    solution: { '2,2': 1, '3,2': 1, '3,4': 1, '5,3': 1, '5,4': 3, '3,1': 2, '2,1': 3, '5,5': 6, '1,2': 0, '4,2': 0 },
  },
  // Platz im Spiel: nach „Schatztruhe“
  {
    // Lösung: Prisma (3,5) rot 7 · Spiegel (3,6) rot 3 · Spiegel (6,2) rot 2 · Spiegel (5,1) rot 0 ·
    //   Spiegel (1,5) rot 0 · Prisma (5,2) rot 2 · Spiegel (2,5) rot 0 · Spiegel (1,4) rot 0 ·
    //   Prisma (0,1) rot 7
    // Generator schwer-sammelstelle, Seed 10484 · Ausbau „schwer“
    name: 'Tierkreis', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 5, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'red' },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 2, dir: 1, color: 'cyan' },
      { type: 'target', x: 3, z: 2, color: 'yellow' },
      { type: 'target', x: 5, z: 5, color: 'cyan' },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 3 },
      { type: 'prism', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'cyan' },
      { type: 'prism', x: 0, z: 1, rot: 4 },
      { type: 'mirror', x: 1, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 3, z: 1, color: 'blue' },
    ],
    solution: { '3,5': 7, '3,6': 3, '6,2': 2, '5,1': 0, '1,5': 0, '5,2': 2, '2,5': 0, '1,4': 0, '0,1': 7 },
  },
  // Platz im Spiel: nach „Zugbrücke“
  {
    // Lösung: Prisma (4,3) rot 2 · Spiegel (2,1) rot 0 · Spiegel (3,3) rot 3 · Spiegel (4,0) rot 1 ·
    //   Prisma (4,2) rot 4 · Spiegel (0,2) rot 1 · Spiegel (3,1) rot 0 · Prisma (6,5) rot 5 ·
    //   Spiegel (6,4) rot 1 · Spiegel (0,4) rot 3
    // Generator schwer-sammelstelle, Seed 20798, Ziel 72–86 · Ausbau „schwer“
    name: 'Wasseruhr', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'source', x: 0, z: 3, dir: 7, color: 'blue' },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'target', x: 2, z: 5, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'cyan' },
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 6, z: 5, rot: 6 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '4,3': 2, '2,1': 0, '3,3': 3, '4,0': 1, '4,2': 4, '0,2': 1, '3,1': 0, '6,5': 5, '6,4': 1, '0,4': 3 },
  },
  // Platz im Spiel: nach „Rosette“
  {
    // Lösung: Spiegel (2,3) rot 3 · Prisma (2,1) rot 5 · Spiegel (1,2) rot 1 · Prisma (1,3) rot 1 ·
    //   Prisma (3,1) rot 4 · Spiegel (1,1) rot 3 · Prisma (4,1) rot 4 · Prisma (5,1) rot 4 ·
    //   Spiegel (2,4) rot 0
    // Wertung 46.5 · 9 drehbar · 3 Ziele · Rateschritte 16164 · gehärtet aus Profil 3-bunt, Seed 6065
    name: 'Brennglas', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 0, fixed: true },
      { type: 'mirror', x: 0, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 2, z: 1, rot: 7 },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'prism', x: 4, z: 1, rot: 3 },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'prism', x: 1, z: 3, rot: 5 },
      { type: 'target', x: 1, z: 0, color: 'green' },
      { type: 'target', x: 5, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 2, color: 'green' },
    ],
    solution: { '2,3': 3, '2,1': 5, '1,2': 1, '1,3': 1, '3,1': 4, '1,1': 3, '4,1': 4, '5,1': 4, '2,4': 0 },
  },
  // Platz im Spiel: nach „Brennglas“
  {
    // Lösung: Prisma (3,4) rot 0 · Spiegel (5,2) rot 2 · Spiegel (4,5) rot 0 · Spiegel (5,4) rot 0 ·
    //   Prisma (1,5) rot 1 · Spiegel (2,6) rot 0 · Spiegel (1,0) rot 0 · Spiegel (2,2) rot 2 ·
    //   Prisma (1,3) rot 1
    // Generator schwer-falle, Seed 20825, Ziel 72–86 · Ausbau „schwer“
    name: 'Sternzeichen', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, z: 4, rot: 7 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2, fixed: true },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'source', x: 0, z: 1, dir: 7, color: 'cyan' },
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 6, z: 3, color: 'white' },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'prism', x: 1, z: 3, rot: 4 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '3,4': 0, '5,2': 2, '4,5': 0, '5,4': 0, '1,5': 1, '2,6': 0, '1,0': 0, '2,2': 2, '1,3': 1 },
  },
  // Platz im Spiel: nach „Gebirgspfad“
  {
    // Lösung: Prisma (1,5) rot 0 · Spiegel (0,5) rot 1 · Spiegel (5,3) rot 2 · Prisma (6,4) rot 3 ·
    //   Prisma (2,1) rot 7 · Spiegel (5,1) rot 3 · Spiegel (5,0) rot 1 · Spiegel (3,0) rot 0 ·
    //   Spiegel (6,3) rot 2
    // Generator schwer-sammelstelle, Seed 21178, Ziel 72–86 · Ausbau „schwer“
    name: 'Gratwanderung', grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, z: 5, rot: 1 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'magenta' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 2, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'prism', x: 6, z: 4, rot: 4 },
      { type: 'target', x: 4, z: 6, color: 'green' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 1, rot: 4 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'green' },
    ],
    solution: { '1,5': 0, '0,5': 1, '5,3': 2, '6,4': 3, '2,1': 7, '5,1': 3, '5,0': 1, '3,0': 0, '6,3': 2 },
  },
  // Platz im Spiel: nach „Gratwanderung“
  {
    // Lösung: Prisma (5,4) rot 6 · Spiegel (5,6) rot 3 · Spiegel (5,1) rot 1 · Spiegel (3,1) rot 1 ·
    //   Spiegel (3,0) rot 1 · Prisma (3,4) rot 5 · Spiegel (0,4) rot 3 · Spiegel (0,5) rot 1 ·
    //   Spiegel (4,5) rot 3 · Spiegel (4,0) rot 3 · Kombinator (0,1) dir 6
    // Generator schwer-sammelstelle, Seed 10082 · Ausbau „schwer“
    name: 'Seidenstrasse', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 1, dir: 3 },
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'combiner', x: 0, z: 1, dir: 2 },
      { type: 'target', x: 0, z: 0, color: 'cyan' },
    ],
    solution: { '5,4': 6, '5,6': 3, '5,1': 1, '3,1': 1, '3,0': 1, '3,4': 5, '0,4': 3, '0,5': 1, '4,5': 3, '4,0': 3, '0,1': 6 },
  },
  // Platz im Spiel: nach „Spiegelsaal“
  {
    // Lösung: Prisma (1,6) rot 5 · Spiegel (1,0) rot 0 · Prisma (4,4) rot 6 · Prisma (0,1) rot 1 ·
    //   Spiegel (4,1) rot 3 · Spiegel (5,3) rot 2 · Spiegel (4,5) rot 0 · Spiegel (5,1) rot 3 ·
    //   Spiegel (5,0) rot 3
    // Generator schwer-sammelstelle, Seed 458, Ziel 81,58–83,6 · ersetzt Singularität (Austausch „schwer“)
    name: 'Nadelöhr', grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, z: 6, rot: 7 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'red' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'cyan' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 5, color: 'cyan' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 6, z: 5, dir: 5 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'prism', x: 0, z: 1, rot: 4 },
      { type: 'target', x: 3, z: 1, color: 'magenta' },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 1 },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '1,6': 5, '1,0': 0, '4,4': 6, '0,1': 1, '4,1': 3, '5,3': 2, '4,5': 0, '5,1': 3, '5,0': 3 },
  },
  // Platz im Spiel: nach „Ankerplatz“
  {
    // Lösung: Prisma (3,1) rot 2 · Spiegel (6,1) rot 3 · Spiegel (3,4) rot 3 · Spiegel (2,4) rot 3 ·
    //   Spiegel (2,6) rot 3 · Spiegel (1,6) rot 1 · Spiegel (5,6) rot 1 · Spiegel (6,6) rot 3 ·
    //   Spiegel (1,0) rot 0 · Prisma (2,1) rot 2
    // Generator schwer-sammelstelle, Seed 10395 · Ausbau „schwer“
    name: 'Burggraben', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 3 },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'yellow' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'target', x: 1, z: 3, color: 'cyan' },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'prism', x: 2, z: 1, rot: 5 },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 4, z: 3, color: 'red' },
    ],
    solution: { '3,1': 2, '6,1': 3, '3,4': 3, '2,4': 3, '2,6': 3, '1,6': 1, '5,6': 1, '6,6': 3, '1,0': 0, '2,1': 2 },
  },
  // Platz im Spiel: nach „Burggraben“
  {
    // Lösung: Prisma (2,3) rot 3 · Spiegel (3,2) rot 0 · Spiegel (1,4) rot 0 · Spiegel (0,3) rot 2 ·
    //   Prisma (4,1) rot 2 · Spiegel (1,0) rot 0 · Spiegel (4,5) rot 3 · Spiegel (0,5) rot 3 ·
    //   Prisma (4,0) rot 4
    // Generator schwer-sammelstelle, Seed 21198, Ziel 72–86 · Ausbau „schwer“
    name: 'Mondbahn', grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, z: 3, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'yellow' },
      { type: 'target', x: 1, z: 3, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'prism', x: 4, z: 1, rot: 5 },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'source', x: 6, z: 2, dir: 5, color: 'magenta' },
      { type: 'prism', x: 4, z: 0, rot: 6 },
      { type: 'target', x: 6, z: 3, color: 'red' },
    ],
    solution: { '2,3': 3, '3,2': 0, '1,4': 0, '0,3': 2, '4,1': 2, '1,0': 0, '4,5': 3, '0,5': 3, '4,0': 4 },
  },
  // Platz im Spiel: nach „Halo“
  {
    // Lösung: Prisma (3,5) rot 6 · Spiegel (2,6) rot 0 · Spiegel (3,3) rot 3 · Spiegel (3,1) rot 1 ·
    //   Spiegel (1,3) rot 1 · Spiegel (2,1) rot 3 · Prisma (3,0) rot 0 · Spiegel (6,6) rot 3 ·
    //   Spiegel (6,2) rot 1 · Spiegel (0,2) rot 3
    // Generator schwer-sammelstelle, Seed 371, Ziel 81,58–83,6 · ersetzt Urknall (Austausch „schwer“)
    name: 'Weltumsegelung', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 5, rot: 1 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'blue' },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'target', x: 5, z: 3, color: 'cyan' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'prism', x: 3, z: 0, rot: 3 },
      { type: 'filter', x: 2, z: 2, color: 'yellow' },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'green' },
    ],
    solution: { '3,5': 6, '2,6': 0, '3,3': 3, '3,1': 1, '1,3': 1, '2,1': 3, '3,0': 0, '6,6': 3, '6,2': 1, '0,2': 3 },
  },
  // Platz im Spiel: nach „Weltumsegelung“
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (4,0) rot 3 · Spiegel (4,2) rot 1 · Spiegel (2,0) rot 1 ·
    //   Spiegel (4,4) rot 3 · Spiegel (5,4) rot 3 · Spiegel (5,3) rot 1 · Prisma (5,0) rot 2 ·
    //   Spiegel (2,1) rot 1 · Prisma (1,0) rot 7 · Prisma (4,3) rot 4
    // Wertung 47.8 · 11 drehbar · 4 Ziele · Rateschritte 17574 · gehärtet aus Profil 4-filter, Seed 1052
    name: 'Sonnenfinsternis', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 1, z: 0, rot: 6 },
      { type: 'prism', x: 5, z: 0, rot: 4 },
      { type: 'prism', x: 4, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 1, color: 'magenta' },
      { type: 'target', x: 0, z: 3, color: 'green' },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'target', x: 3, z: 4, color: 'red' },
    ],
    solution: { '4,5': 1, '4,0': 3, '4,2': 1, '2,0': 1, '4,4': 3, '5,4': 3, '5,3': 1, '5,0': 2, '2,1': 1, '1,0': 7, '4,3': 4 },
  },
  // Platz im Spiel: nach „Sonnenfinsternis“
  {
    // Lösung: Prisma (4,1) rot 3 · Spiegel (1,1) rot 3 · Kombinator (2,3) dir 3 · Spiegel (1,2) rot 3 ·
    //   Prisma (5,3) rot 3 · Spiegel (4,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (3,1) rot 1 ·
    //   Spiegel (5,1) rot 3 · Prisma (5,2) rot 3 · Spiegel (5,4) rot 3
    // Wertung 54.6 · 11 drehbar · 3 Ziele · Rateschritte 106093 · gehärtet aus Profil 3-misch, Seed 8008
    name: 'Lichtbrücke', grad: 'schwer',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'mirror', x: 3, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'prism', x: 5, z: 3, rot: 0 },
      { type: 'combiner', x: 2, z: 3, dir: 2 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'target', x: 5, z: 5, color: 'white' },
    ],
    solution: { '4,1': 3, '1,1': 3, '2,3': 3, '1,2': 3, '5,3': 3, '4,3': 3, '3,3': 1, '3,1': 1, '5,1': 3, '5,2': 3, '5,4': 3 },
  },
  // Platz im Spiel: nach „Lichtbrücke“
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (4,4) rot 1 · Prisma (1,2) rot 1 · Spiegel (6,2) rot 3 ·
    //   Spiegel (0,5) rot 2 · Spiegel (2,3) rot 0 · Prisma (3,4) rot 3 · Spiegel (3,5) rot 1 ·
    //   Spiegel (6,5) rot 3 · Spiegel (1,5) rot 1 · Spiegel (3,6) rot 1
    // Generator schwer-mischziel, Seed 568, Ziel 83,6–85,91 · ersetzt Lichtgeschwindigkeit (Austausch „schwer“)
    name: 'Fehlstart', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 3, color: 'yellow' },
      { type: 'source', x: 0, z: 3, dir: 7, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 5 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'prism', x: 3, z: 4, rot: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
    ],
    solution: { '5,4': 3, '4,4': 1, '1,2': 1, '6,2': 3, '0,5': 2, '2,3': 0, '3,4': 3, '3,5': 1, '6,5': 3, '1,5': 1, '3,6': 1 },
  },
  /* VORRAT:END */
];
