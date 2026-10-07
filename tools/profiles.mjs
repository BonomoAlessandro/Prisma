// Generator-Profile für die Level 1–50 (tools/generate.mjs, tools/curate.mjs) und Namen aller Level.
// Die Level sind nicht nach Elementen gruppiert: Jede Grössenstufe gibt es in mehreren Mischungen,
// curate.mjs wirft alle Pools zusammen und sortiert allein nach der Wertung (Schwierigkeit).
//
// Felder (Bereiche als [min, max]):
//   sources          Anzahl Lichtquellen (am Rand, Blick ins Feld)
//   diagonalSources  Anteil diagonal abstrahlender Quellen
//   colorSources     Anteil farbiger Quellen (zufällig Rot, Grün, Blau, Gelb, Cyan oder Magenta)
//   place            Elemente, die entlang der Strahlen gesetzt werden (drehbar bzw. Filter)
//   fixedOnPath      feste Spiegel auf den Strahlwegen (gehören zur Lösung)
//   decoys           feste Lockvögel abseits der Lösung (Blocker oder feste Spiegel)
//   targets          Anzahl Ziele
//   rotatable        erlaubte Anzahl drehbarer Elemente im fertigen Level
//   requireKinds     diese Elementtypen müssen vorkommen
//   minClicks        mindestens so viele Klicks bis zur Lösung
//   repairs          zusätzliche Lösungen mit Blockern ausschliessen (sonst verwerfen)
//   maxBlockers      höchstens so viele Blocker insgesamt

/** Grössenstufen: Umfang und Anzahl drehbarer Elemente steigen. */
const TIERS = {
  1: { sources: [1, 2], mirrors: [2, 4], fixedOnPath: [0, 1], decoys: [1, 2], targets: [1, 2], rotatable: [2, 4], minClicks: 3, maxBlockers: 3 },
  2: { sources: [1, 2], mirrors: [3, 5], fixedOnPath: [0, 1], decoys: [1, 2], targets: [2, 3], rotatable: [4, 6], minClicks: 4, maxBlockers: 4 },
  3: { sources: [2, 3], mirrors: [4, 6], fixedOnPath: [0, 2], decoys: [1, 3], targets: [2, 4], rotatable: [5, 8], minClicks: 6, maxBlockers: 5 },
  4: { sources: [2, 3], mirrors: [5, 7], fixedOnPath: [1, 2], decoys: [2, 3], targets: [3, 5], rotatable: [7, 10], minClicks: 9, maxBlockers: 5 },
  5: { sources: [3, 4], mirrors: [6, 8], fixedOnPath: [1, 3], decoys: [2, 4], targets: [3, 5], rotatable: [9, 12], minClicks: 12, maxBlockers: 6 },
};

/** Mischungen: welche Elemente zusätzlich zu den Spiegeln vorkommen. */
const FLAVOURS = {
  spiegel: { diagonalSources: 0.2, maxTier: 4 },
  prisma: { place: { prism: [1, 2] }, requireKinds: ['prism'], mirrorsLess: 1 },
  filter: { place: { filter: [1, 2], prism: [0, 1] }, requireKinds: ['filter'], mirrorsLess: 1 },
  farbe: { colorSources: 0.7, diagonalSources: 0.15, place: { filter: [0, 1] }, maxTier: 4 },
  misch: { place: { prism: [1, 1], combiner: [1, 1] }, requireKinds: ['combiner'], mirrorsLess: 1, minTier: 2 },
  bunt: { colorSources: 0.4, place: { prism: [0, 2], filter: [0, 2], combiner: [0, 1] }, mirrorsLess: 1, minTier: 2 },
};

export const PROFILES = [];
for (const [tier, t] of Object.entries(TIERS)) {
  for (const [flavour, f] of Object.entries(FLAVOURS)) {
    if (+tier < (f.minTier || 1) || +tier > (f.maxTier || 5)) continue;
    const less = f.mirrorsLess || 0;
    PROFILES.push({
      id: `${tier}-${flavour}`,
      sources: t.sources, diagonalSources: f.diagonalSources ?? 0.1, colorSources: f.colorSources || 0,
      place: { mirror: [Math.max(1, t.mirrors[0] - less), t.mirrors[1] - less], ...(f.place || {}) },
      fixedOnPath: t.fixedOnPath, decoys: t.decoys, targets: t.targets, rotatable: t.rotatable,
      requireKinds: f.requireKinds, minClicks: t.minClicks, repairs: true, maxBlockers: t.maxBlockers,
    });
  }
}

/**
 * Namen der Level in aufsteigender Schwierigkeit (Speicherschlüssel des Fortschritts). Die ersten 50 stammen aus
 * den Profilen oben, die Level 51–80 aus tools/harden.mjs (alle schwerer als Level 50; 71–80 vorab mit einem
 * Spielermodell auf Denkaufwand gesiebt).
 */
export const NAMES = [
  'Zickzack', 'Umlenkung', 'Schleuse', 'Winkelzug', 'Gegenlicht', 'Farbsieb', 'Fächer', 'Kehre', 'Tönung', 'Rundgang',
  'Spiegelgasse', 'Lichtfalle', 'Regenbogen', 'Zwillinge', 'Begegnung', 'Weichen', 'Auslese', 'Gabelung', 'Farbspiel', 'Labyrinth',
  'Zusammenfluss', 'Doppelpass', 'Brechpunkt', 'Glasfenster', 'Kreuzweg', 'Einklang', 'Knotenpunkt', 'Schnittstelle', 'Geflecht', 'Farbschleuse',
  'Kreuzfeuer', 'Legierung', 'Verästelung', 'Spektralband', 'Weichensteller', 'Mosaik', 'Glasbläser', 'Uhrwerk', 'Lichtorgel', 'Kaleidoskop',
  'Rangierbahnhof', 'Sternwarte', 'Polarlicht', 'Kathedrale', 'Sonnenwende', 'Gordischer Knoten', 'Lichtjahr', 'Supernova', 'Meisterstück', 'Unendlichkeit',
  'Irrlicht', 'Zwielicht', 'Spiegelsaal', 'Brennglas', 'Halo', 'Rosette', 'Fata Morgana', 'Interferenz', 'Leuchtturm', 'Sonnenfinsternis',
  'Korona', 'Glasperlenspiel', 'Sternbild', 'Kristallpalast', 'Pulsar', 'Quasar', 'Ereignishorizont', 'Lichtgeschwindigkeit', 'Singularität', 'Urknall',
  'Morgenröte', 'Abendstern', 'Prismenhof', 'Spiegelkabinett', 'Lichtbrücke', 'Farbenrausch', 'Sternenstaub', 'Zenit', 'Nebelfeld', 'Lichtkegel',
];
/** So viele Level stammen aus den Generator-Profilen; die übrigen sind gehärtet (tools/harden.mjs). */
export const PROFILE_LEVELS = 50;
