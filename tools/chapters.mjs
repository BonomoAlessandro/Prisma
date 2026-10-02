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
//   window           Wertungsfenster (metrics.score) für die Auswahl durch tools/curate.mjs – steigt von
//                    Kapitel zu Kapitel; jedes Kapitel beginnt etwas unter dem Ende des vorigen ("Sägezahn")
//   names            Levelnamen in aufsteigender Schwierigkeit
export const CHAPTERS = [
  { id: 'I', title: 'Grundlagen', handmade: true },
  {
    id: 'II', title: 'Spiegelwege',
    sources: [1, 2], diagonalSources: 0.15,
    place: { mirror: [3, 5] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [1, 2], rotatable: [3, 5], requireKinds: ['mirror'], minClicks: 3, repairs: true, maxBlockers: 4,
    window: [9.5, 17],
    names: ['Zickzack', 'Umlenkung', 'Schleuse', 'Winkelzug', 'Gegenlicht', 'Spiegelgasse', 'Kehre', 'Rundgang', 'Lichtfalle', 'Labyrinth'],
  },
  {
    id: 'III', title: 'Doppelte Wege',
    sources: [2, 3], diagonalSources: 0.25,
    place: { mirror: [4, 6] }, fixedOnPath: [0, 2], decoys: [1, 3],
    targets: [2, 3], rotatable: [4, 6], requireKinds: ['mirror'], minClicks: 5, repairs: true, maxBlockers: 4,
    window: [15, 21],
    names: ['Zwillinge', 'Begegnung', 'Parallelen', 'Weichen', 'Gabelung', 'Doppelspiel', 'Zwei Ufer', 'Spiegelpaar', 'Kreuzweg', 'Doppelpass'],
  },
  {
    id: 'IV', title: 'Prismen',
    sources: [1, 2], diagonalSources: 0.1,
    place: { prism: [1, 2], mirror: [3, 5] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [2, 4], rotatable: [4, 7], requireKinds: ['prism'], minClicks: 5, repairs: true, maxBlockers: 4,
    window: [16, 23],
    names: ['Regenbogen', 'Fächer', 'Lichtteiler', 'Farbspiel', 'Dreiklang', 'Brechpunkt', 'Farbkeil', 'Aufspaltung', 'Spektralband', 'Prismenpfad'],
  },
  {
    id: 'V', title: 'Filterfolgen',
    sources: [1, 2], diagonalSources: 0.1,
    place: { filter: [1, 3], prism: [1, 1], mirror: [3, 5] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [2, 4], rotatable: [4, 7], requireKinds: ['filter'], minClicks: 5, repairs: true, maxBlockers: 4,
    window: [17, 23],
    names: ['Farbsieb', 'Auslese', 'Schleier', 'Tönung', 'Glasfenster', 'Durchlass', 'Farbschleuse', 'Reinheit', 'Lichtsieb', 'Kirchenfenster'],
  },
  {
    id: 'VI', title: 'Mischpult',
    sources: [1, 2], diagonalSources: 0.1,
    place: { prism: [1, 1], mirror: [2, 4], combiner: [1, 1] }, fixedOnPath: [0, 1], decoys: [1, 2],
    targets: [1, 3], rotatable: [4, 7], requireKinds: ['combiner'], minClicks: 5, repairs: true, maxBlockers: 4,
    window: [19, 25],
    names: ['Zusammenfluss', 'Mischbad', 'Einklang', 'Legierung', 'Farbtopf', 'Akkord', 'Verschmelzung', 'Komposition', 'Synthese', 'Palette'],
  },
  {
    id: 'VII', title: 'Verflechtungen',
    sources: [2, 3], diagonalSources: 0.2,
    place: { prism: [0, 2], filter: [0, 2], mirror: [3, 5], combiner: [0, 1] }, fixedOnPath: [0, 2], decoys: [2, 3],
    targets: [3, 4], rotatable: [5, 8], minClicks: 7, repairs: true, maxBlockers: 5,
    window: [23, 31],
    names: ['Knotenpunkt', 'Schnittstelle', 'Geflecht', 'Kreuzfeuer', 'Netzwerk', 'Verästelung', 'Weichensteller', 'Sternkreuzung', 'Rangierbahnhof', 'Gordischer Knoten'],
  },
  {
    id: 'VIII', title: 'Feste Bahnen',
    sources: [2, 3], diagonalSources: 0.2,
    place: { prism: [0, 1], filter: [0, 1], mirror: [5, 7] }, fixedOnPath: [2, 3], decoys: [3, 5],
    targets: [3, 4], rotatable: [6, 8], minClicks: 8, repairs: true, maxBlockers: 5,
    window: [25, 32],
    names: ['Gleise', 'Leitplanken', 'Schienen', 'Fixpunkte', 'Kanäle', 'Gerüst', 'Korsett', 'Felsenweg', 'Starre Wege', 'Bollwerk'],
  },
  {
    id: 'IX', title: 'Meister',
    sources: [2, 3], diagonalSources: 0.25,
    place: { prism: [1, 2], filter: [0, 2], mirror: [4, 6], combiner: [0, 1] }, fixedOnPath: [1, 2], decoys: [2, 4],
    targets: [3, 5], rotatable: [7, 9], minClicks: 10, repairs: true, maxBlockers: 5,
    window: [29, 35],
    names: ['Feinarbeit', 'Präzision', 'Mosaik', 'Glasbläser', 'Uhrwerk', 'Lichtorgel', 'Kaleidoskop', 'Sternwarte', 'Kathedrale', 'Meisterstück'],
  },
  {
    id: 'X', title: 'Finale',
    sources: [3, 4], diagonalSources: 0.25,
    place: { prism: [2, 3], filter: [1, 2], mirror: [5, 7], combiner: [1, 1] }, fixedOnPath: [1, 2], decoys: [2, 4],
    targets: [3, 5], rotatable: [8, 11], minClicks: 12, repairs: true, maxBlockers: 5,
    window: [34, 48],
    names: ['Dämmerung', 'Morgenrot', 'Horizont', 'Zenit', 'Sonnenwende', 'Polarlicht', 'Lichtjahr', 'Lichtmeer', 'Supernova', 'Unendlichkeit'],
  },
];
