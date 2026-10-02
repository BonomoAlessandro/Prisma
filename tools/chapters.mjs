// Kapitel-Vorgaben für den Level-Generator (tools/generate.mjs).
// Kapitel I sind die handgebauten Lern-Level in index.html; ab Kapitel II wird generiert.
//
// Felder (Bereiche als [min, max]):
//   sources          Anzahl Lichtquellen (am Rand, Blick ins Feld)
//   diagonalSources  Anteil diagonal abstrahlender Quellen
//   place            Elemente, die entlang der Strahlen gesetzt werden (drehbar bzw. Filter)
//   fixedOnPath      feste Spiegel auf den Strahlwegen (gehören zur Lösung)
//   decoys           feste Lockvögel abseits der Lösung (Blocker oder feste Spiegel)
//   targets          Anzahl Ziele
//   rotatable        erlaubte Anzahl drehbarer Elemente im fertigen Level
//   requireKinds     diese Elementtypen müssen vorkommen
//   minClicks        mindestens so viele Klicks bis zur Lösung
//   repairs          zusätzliche Lösungen mit Blockern ausschliessen (sonst verwerfen)
//   maxBlockers      höchstens so viele Blocker insgesamt
export const CHAPTERS = [
  { id: 'I', title: 'Grundlagen', handmade: true },
  {
    id: 'II', title: 'Spiegelwege',
    sources: [1, 2], diagonalSources: 0.15,
    place: { mirror: [3, 5] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [1, 2], rotatable: [3, 5], requireKinds: ['mirror'], minClicks: 3, repairs: true, maxBlockers: 4,
  },
  {
    id: 'III', title: 'Doppelte Wege',
    sources: [2, 3], diagonalSources: 0.25,
    place: { mirror: [4, 6] }, fixedOnPath: [0, 2], decoys: [1, 3],
    targets: [2, 3], rotatable: [4, 6], requireKinds: ['mirror'], minClicks: 5, repairs: true, maxBlockers: 4,
  },
  {
    id: 'IV', title: 'Spektrum',
    sources: [1, 2], diagonalSources: 0.1,
    place: { prism: [1, 2], mirror: [2, 4] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [2, 3], rotatable: [3, 6], requireKinds: ['prism'], minClicks: 4, repairs: true, maxBlockers: 4,
  },
  {
    id: 'V', title: 'Filterfolgen',
    sources: [1, 2], diagonalSources: 0.1,
    place: { filter: [1, 3], prism: [0, 1], mirror: [2, 4] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [2, 3], rotatable: [3, 6], requireKinds: ['filter'], minClicks: 4, repairs: true, maxBlockers: 4,
  },
  {
    id: 'VI', title: 'Mischpult',
    sources: [1, 2], diagonalSources: 0.1,
    place: { prism: [1, 1], mirror: [2, 4], combiner: [1, 1] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [1, 3], rotatable: [4, 7], requireKinds: ['combiner'], minClicks: 5, repairs: true, maxBlockers: 4,
  },
  {
    id: 'VII', title: 'Kreuzungen',
    sources: [2, 3], diagonalSources: 0.2,
    place: { prism: [0, 2], filter: [0, 2], mirror: [3, 5], combiner: [0, 1] }, fixedOnPath: [0, 2], decoys: [2, 3],
    targets: [3, 4], rotatable: [5, 7], minClicks: 7, repairs: true, maxBlockers: 5,
  },
  {
    id: 'VIII', title: 'Feste Bahnen',
    sources: [2, 3], diagonalSources: 0.2,
    place: { prism: [0, 1], filter: [0, 1], mirror: [4, 6] }, fixedOnPath: [2, 3], decoys: [3, 5],
    targets: [2, 4], rotatable: [5, 7], minClicks: 7, repairs: true, maxBlockers: 5,
  },
  {
    id: 'IX', title: 'Meister',
    sources: [2, 3], diagonalSources: 0.25,
    place: { prism: [1, 2], filter: [0, 2], mirror: [4, 6], combiner: [0, 1] }, fixedOnPath: [1, 2], decoys: [2, 4],
    targets: [3, 5], rotatable: [6, 9], minClicks: 9, repairs: true, maxBlockers: 5,
  },
  {
    id: 'X', title: 'Finale',
    sources: [3, 4], diagonalSources: 0.25,
    place: { prism: [2, 3], filter: [1, 2], mirror: [5, 7], combiner: [1, 1] }, fixedOnPath: [1, 2], decoys: [2, 4],
    targets: [3, 5], rotatable: [8, 11], minClicks: 12, repairs: true, maxBlockers: 5,
  },
];
