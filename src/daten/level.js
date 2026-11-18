// Die Level des Spiels und die Reise der Geschichte (Ticket 06 von .scratch/umbau/; bis dahin in src/logik.js
// zwischen den Markierungen LEVELS, WUERFEL und GESCHICHTE): nur Daten, kein Code. Die Spiellogik (src/logik.js)
// importiert sie und setzt daraus LEVELS (zuerst die Übungen, dann die Level der Reihe), LEVELS_3D und STORY_LEVELS
// zusammen; Vite bündelt sie beim Build mit ins Spiel (kein Nachladen über das Netz, das Spiel bleibt offline
// spielbar). Ein JavaScript-Modul statt JSON, damit jedes Level seine Kommentare behält (Lösung, Herkunft zum
// Nachbauen) und als Block Zeile für Zeile zwischen Spiel und Vorrat (tools/vorrat/) wandert.
//
// Texte stehen hier keine (Ticket 07 von .scratch/umbau/): Die Schritte der Übungen nennen den Schlüssel ihres Satzes in
// der Übersetzungsschicht (src/texte/), die Titel der Level stehen dort im Bereich titel unter ihrem Namen (geschrieben
// von tools/geschichte.mjs spiel).
// Werkzeuge schreiben hierher, je in einen Bereich: die Zeilen zwischen «const FLACH = [» und dem nächsten «];»
// (tools/ordne-level.mjs, tools/vorrat.mjs, tools/geschichte.mjs spiel), zwischen «const WUERFEL = [» und
// «];» (tools/ordne-wuerfel.mjs, tools/vorrat.mjs) und zwischen «const REISE = {» und «};» (tools/geschichte.mjs
// spiel). In den Bereichen der Level steht jedes Level als Block von «  {» bis «  },», sonst nichts. Die Übungen
// (UEBUNGEN) schreibt kein Werkzeug. Wie man ein Level ändert: README, «Levels».
// Feste Form wie src/logik.js (tools/seitenmodule.mjs): kein import, am Schluss ein export-Block mit allen Namen.

/**
 * Level-Definitionen (UEBUNGEN, FLACH; in LEVELS der Spiellogik). Format:
 *   { name, grad?, size?, tutorial?, schritte?, nebenbei?, elements: [{ type, x, z, dir?, rot?, color?, fixed? }],
 *     solution }
 *   grad:     Schwierigkeitsgrad jedes Levels nach dem Tutorial: 'leicht', 'mittel', 'schwer' oder 'sehr schwer'
 *             (Kopfzeile, Kachel und Seitentitel zeigen ihn, GRAD_ANZEIGE)
 *   source:   dir = Abstrahlrichtung, color (Standard Weiss)
 *   mirror:   rot = Winkel der Spiegelfläche (drehbar; rot und rot + 4 wirken gleich)
 *   prism:    rot = Richtung der Austrittsfläche = Richtung des Farbfächers (drehbar)
 *   filter:   color = durchgelassene Farbe(n)
 *   combiner: dir = Ausgangsrichtung (drehbar)
 *   blocker:  schluckt Licht
 *   target:   color = benötigte Farbe
 *   fixed:    Element ist nicht drehbar
 *   tutorial: Lern-Level am Anfang (die Übungen im Dorf); schritte ist ihre Führung (höchstens SCHRITTE_MAX,
 *             { text, bei, weiter, richtung?, trifft?, farbe? }, siehe SCHRITT_WEITER; text ist der Schlüssel des Satzes,
 *             fuehrung.schritt.<übung>.<n>), dazu nebenbei: Hinweise nebenbei (NEBENBEI). Einen Hinweis (hint) haben
 *             sie seit Ticket 03 der Führung nicht mehr
 *   solution: { "x,z": rot bzw. dir } für jedes drehbare Element – die einzige Lösung.
 *             Die Elemente stehen zu Beginn in ihrer Startstellung (nie bereits gelöst).
 * UEBUNGEN: das Tutorial, seit .scratch/tutorial-neu/ vier Übungen: Erstes Licht (Ziel, Spiegel, drehbar und fest),
 * Brechung (Block, Prisma), Farbenlehre (Filter, farbige Quellen, Ring am Ziel), Mischung (Mischen am Ziel, Kombinator).
 * Ihre Bretter lassen die beiden untersten Reihen frei (dort liegt auf dem Handy das Band der Führung).
 */
const UEBUNGEN = [
  {
    // Lösung: Spiegel (2,4) rot 3 – Ost → Nord; fester Spiegel (2,1) – Nord → Ost; Spiegel (5,1) rot 1 – Ost → Süd
    //   → Ziel (5,4). Neu mit Ticket 01 von .scratch/tutorial-neu/ (vier Schritte, strikte Führung): zuerst das Ziel,
    //   dann Tippen dreht (der vordere Spiegel wirft das Licht zu Beginn zurück, ein Tippen schickt es zum festen),
    //   dann den festen Spiegel antippen (er wackelt), zuletzt rund gegen eckig und zurückdrehen: Der hintere Spiegel
    //   steht eine Stufe zu weit (rot 2 = 1 + 1), langes Drücken löst die Übung. Zwischen dem festen Spiegel und den
    //   drehbaren liegt mindestens ein Feld.
    name: 'Erstes Licht', tutorial: true,
    schritte: [
      { text: 'fuehrung.schritt.erstesLicht.1', bei: '5,4',
        weiter: 'erklaerung' },
      { text: 'fuehrung.schritt.erstesLicht.2', bei: '2,4',
        weiter: 'strahl', trifft: '2,1' },
      { text: 'fuehrung.schritt.erstesLicht.3', bei: '2,1',
        weiter: 'antippen' },
      { text: 'fuehrung.schritt.erstesLicht.4',
        bei: '5,1', weiter: 'drehen', richtung: -1 },
    ],
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'white' },
    ],
    solution: { '2,4': 3, '5,1': 1 },
  },
  {
    // Lösung: Spiegel (2,4) rot 1 – Süd → Ost; Prisma (4,4) rot 7 – Fächer nach Nordost: Rot → Nord → Ziel (4,1),
    //   Grün → Nordost → Ziel (6,2), Blau → Ost → Ziel (6,4). Neu mit Ticket 02 von .scratch/tutorial-neu/ (vier
    //   Schritte): Zu Beginn wirft der Spiegel das Licht nach Westen in den Block (0,4), der erste Schritt erklärt ihn.
    //   Zwei Tippen (über «zurück zur Lampe») schicken es nach Osten ins Prisma; dort fächert es zuerst falsch auf (rot 6:
    //   Grün und Blau treffen die falschen Kristalle), ein Tippen löst. Unten (z = 5, 6) steht nichts: Dort liegt auf dem
    //   Handy quer und bei 360 × 640 das Band. Nebenbei Kamera und Neustart.
    name: 'Brechung', tutorial: true,
    schritte: [
      { text: 'fuehrung.schritt.brechung.1', bei: '0,4',
        weiter: 'erklaerung' },
      { text: 'fuehrung.schritt.brechung.2', bei: '2,4', weiter: 'strahl', trifft: '4,4' },
      { text: 'fuehrung.schritt.brechung.3', bei: '4,4', weiter: 'erklaerung' },
      { text: 'fuehrung.schritt.brechung.4', bei: '4,4', weiter: 'drehen' },
    ],
    nebenbei: ['kamera', 'neustart'],
    elements: [
      { type: 'source', x: 2, z: 1, dir: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'blocker', x: 0, z: 4 },
      { type: 'prism', x: 4, z: 4, rot: 6 },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '2,4': 1, '4,4': 7 },
  },
  {
    // Lösung: Grünfilter (2,2) – aus Weiss wird Grün; Spiegel (4,2) rot 3 – Ost → Nord → Ziel (4,0); die rote Lampe
    //   (6,1) – Süd; Spiegel (6,4) rot 3 – Süd → West → Ziel (4,4). Neu mit Ticket 02 von .scratch/tutorial-neu/ (vier
    //   Schritte): Zu Beginn fällt das Grün auf den roten Kristall (4,4) und flackert in seinem Ring, wenn der zweite
    //   Schritt den Ring erklärt; das Rot läuft am Ostrand hinaus. Zuerst kommt das Grün an seinen Platz (zwei Tippen),
    //   erst dann das Rot: Andersherum mischten sich auf dem roten Kristall beide Farben. Unten (z = 5, 6) steht nichts.
    name: 'Farbenlehre', tutorial: true,
    schritte: [
      { text: 'fuehrung.schritt.farbenlehre.1', bei: '2,2',
        weiter: 'erklaerung' },
      { text: 'fuehrung.schritt.farbenlehre.2',
        bei: ['4,4', '4,0'], weiter: 'erklaerung' },
      { text: 'fuehrung.schritt.farbenlehre.3', bei: '4,2', weiter: 'strahl',
        trifft: '4,0', farbe: 'green' },
      { text: 'fuehrung.schritt.farbenlehre.4',
        bei: '6,4', weiter: 'drehen' },
    ],
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'filter', x: 2, z: 2, color: 'green' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 4, color: 'red' },
      { type: 'source', x: 6, z: 1, dir: 2, color: 'red' },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
    ],
    solution: { '4,2': 3, '6,4': 3 },
  },
  {
    // Lösung: Spiegel (3,1) rot 1 – Rot von West → Süd → Ziel (3,3), dort mit dem Blau von West zu Magenta gemischt;
    //   Kombinator (5,2) dir 0 – mischt Rot von Nord und Blau von Süd zu Magenta → Ost → Ziel (6,2). Neu mit Ticket 02
    //   von .scratch/tutorial-neu/ (vier Schritte): zuerst Mischen am Ziel (zu Beginn läuft das Rot oben hinaus, nur
    //   Blau kommt an; zwei Tippen), dann der Kombinator, der schon beide Farben mischt (ein Tippen). Zwei rote und zwei
    //   blaue Lampen, damit beide Arten zu mischen dieselbe Farbe ergeben. Unten (z = 5, 6) steht nichts.
    name: 'Mischung', tutorial: true,
    schritte: [
      { text: 'fuehrung.schritt.mischung.1', bei: '3,3',
        weiter: 'erklaerung' },
      { text: 'fuehrung.schritt.mischung.2', bei: '3,1', weiter: 'strahl',
        trifft: '3,3', farbe: 'magenta' },
      { text: 'fuehrung.schritt.mischung.3', bei: '5,2',
        weiter: 'erklaerung' },
      { text: 'fuehrung.schritt.mischung.4', bei: '5,2', weiter: 'drehen' },
    ],
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'target', x: 3, z: 3, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 5, z: 4, dir: 6, color: 'blue' },
      { type: 'combiner', x: 5, z: 2, dir: 7 },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
    ],
    solution: { '3,1': 1, '5,2': 0 },
  },
];

/**
 * Die Level der Reihe (nach den Übungen in LEVELS), mit ihrem Grad. Im Spiel stehen seit Noas Geschichte genau die
 * 240 Level der Reise (REISE; ihre Titel in src/texte/); die übrigen liegen im Vorrat (tools/vorrat/flach.js).
 * tools/ordne-level.mjs ordnet die ganze Reihe aus Spiel und Vorrat nach der Schwierigkeit aus der Beurteilung
 * (Ticket 15) und setzt den Grad; die Kommentare je Level nennen die Lösung und die Herkunft (alte Wertung und Profil
 * der Werkzeuge bis Ticket 21, Generator und Seed). Die Tests prüfen mit dem Löser (tools/solver.mjs), dass jede
 * notierte Lösung stimmt und eindeutig ist.
 */
const FLACH = [
  {
    // Lösung: Spiegel (2,3) rot 1 · Prisma (2,2) rot 7 · Spiegel (4,0) rot 0
    // Generator leicht, Seed 10013 · Ausbau „leicht“
    name: 'Wasserfarbe', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 2, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 1, color: 'green' },
      { type: 'target', x: 2, z: 1, color: 'red' },
    ],
    solution: { '2,3': 1, '2,2': 7, '4,0': 0 },
  },
  {
    // Lösung: Prisma (5,5) rot 5 · Spiegel (5,6) rot 1 · Spiegel (2,3) rot 0
    // Generator leicht-sammelstelle, Seed 10091 · Ausbau „leicht“
    name: 'Lichtblick', grad: 'leicht',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'source', x: 6, z: 4, dir: 3, color: 'blue' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'green' },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 2, fixed: true },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
    ],
    solution: { '5,5': 5, '5,6': 1, '2,3': 0 },
  },
  {
    // Lösung: Spiegel (4,1) rot 3 · Spiegel (4,3) rot 3
    // Wertung 12.8 · 2 drehbar · 2 Ziele · Rateschritte 5 · Profil 1-filter, Seed 2
    name: 'Umlenkung', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'filter', x: 5, z: 1, color: 'cyan' },
      { type: 'filter', x: 4, z: 5, color: 'magenta' },
      { type: 'target', x: 2, z: 3, color: 'cyan' },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
    ],
    solution: { '4,1': 3, '4,3': 3 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (5,5) rot 3 · Spiegel (5,4) rot 1
    // Wertung 13.7 · 3 drehbar · 2 Ziele · Rateschritte 6 · Kapitel II Gegenlicht
    name: 'Tönung', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'target', x: 6, z: 5, color: 'white' },
    ],
    solution: { '3,5': 1, '5,5': 3, '5,4': 1 },
  },
  {
    // Lösung: Prisma (3,4) rot 6 · Spiegel (1,2) rot 0 · Spiegel (5,2) rot 0 · Spiegel (3,1) rot 3
    // Wertung 19.9 · 4 drehbar · 3 Ziele · Rateschritte 34 · handgebaut Spektrum
    name: 'Rundgang', grad: 'leicht',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'prism', x: 3, z: 4, rot: 4 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '3,4': 6, '1,2': 0, '5,2': 0, '3,1': 3 },
  },
  {
    // Lösung: Spiegel (5,4) rot 2 · Spiegel (6,3) rot 2 · Spiegel (2,4) rot 3 · Spiegel (2,0) rot 3
    // Generator leicht-mischziel, Seed 10636 · Ausbau „leicht“
    name: 'Fingerzeig', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 5, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
    ],
    solution: { '5,4': 2, '6,3': 2, '2,4': 3, '2,0': 3 },
  },
  {
    // Lösung: Prisma (5,2) rot 3 · Spiegel (5,1) rot 1 · Spiegel (5,5) rot 1
    // Generator leicht-sammelstelle, Seed 10416 · Ausbau „leicht“
    name: 'Taschenlampe', grad: 'leicht',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'source', x: 6, z: 3, dir: 5, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 2, z: 2, color: 'blue' },
      { type: 'target', x: 2, z: 5, color: 'green' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 6, color: 'red' },
    ],
    solution: { '5,2': 3, '5,1': 1, '5,5': 1 },
  },
  {
    // Lösung: Spiegel (1,5) rot 2 · Spiegel (0,4) rot 2 · Prisma (2,2) rot 0 · Spiegel (3,2) rot 1
    // Wertung 13.3 · 4 drehbar · 3 Ziele · Rateschritte 5 · Profil 2-prisma, Seed 939
    name: 'Farbsieb', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'mirror', x: 2, z: 0, rot: 2, fixed: true },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'prism', x: 2, z: 2, rot: 6 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 3, z: 4, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '1,5': 2, '0,4': 2, '2,2': 0, '3,2': 1 },
  },
  {
    // Lösung: Prisma (1,2) rot 5 · Spiegel (1,0) rot 3 · Spiegel (4,0) rot 1 · Spiegel (4,5) rot 3
    // Generator leicht, Seed 10432 · Ausbau „leicht“
    name: 'Lichtpunkt', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'prism', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '1,2': 5, '1,0': 3, '4,0': 1, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (4,5) rot 1 · Spiegel (3,5) rot 1 · Spiegel (1,4) rot 1
    // Wertung 14.7 · 4 drehbar · 2 Ziele · Rateschritte 10 · Profil 2-farbe, Seed 927
    name: 'Kehre', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 3, z: 2, color: 'green' },
    ],
    solution: { '4,4': 1, '4,5': 1, '3,5': 1, '1,4': 1 },
  },
  {
    // Lösung: Spiegel (4,0) rot 3 · Spiegel (3,4) rot 3 · Spiegel (4,4) rot 3 · Spiegel (4,3) rot 1
    // Wertung 17.1 · 4 drehbar · 2 Ziele · Rateschritte 19 · Profil 2-farbe, Seed 1087
    name: 'Gegenlicht', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 4, color: 'blue' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'filter', x: 3, z: 3, color: 'red' },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 5, z: 3, color: 'blue' },
    ],
    solution: { '4,0': 3, '3,4': 3, '4,4': 3, '4,3': 1 },
  },
  {
    // Lösung: Spiegel (4,5) rot 3 · Prisma (4,6) rot 1 · Spiegel (5,6) rot 3 · Spiegel (5,2) rot 1
    // Generator leicht, Seed 10179 · Ausbau „leicht“
    name: 'Schneeflocke', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'prism', x: 4, z: 6, rot: 5 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 5, color: 'red' },
    ],
    solution: { '4,5': 3, '4,6': 1, '5,6': 3, '5,2': 1 },
  },
  {
    // Lösung: Spiegel (2,6) rot 1 · Spiegel (2,0) rot 1 · Prisma (2,4) rot 5
    // Wertung 12.1 · 3 drehbar · 1 Ziel · Rateschritte 5 · Profil 1-prisma, Seed 105
    name: 'Regenbogen', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
    ],
    solution: { '2,6': 1, '2,0': 1, '2,4': 5 },
  },
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (3,5) rot 1 · Prisma (0,3) rot 1
    // Generator leicht-mischziel, Seed 10570 · Ausbau „leicht“
    name: 'Papierflieger', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'prism', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 3, color: 'red' },
    ],
    solution: { '5,2': 3, '3,5': 1, '0,3': 1 },
  },
  {
    // Lösung: Spiegel (2,4) rot 0 · Spiegel (3,3) rot 2 · Prisma (1,5) rot 0
    // Generator leicht, Seed 10648 · Ausbau „leicht“
    name: 'Funke', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 1, color: 'cyan' },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'filter', x: 2, z: 2, color: 'green' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
    ],
    solution: { '2,4': 0, '3,3': 2, '1,5': 0 },
  },
  {
    // Lösung: Spiegel (2,3) rot 3 · Prisma (1,5) rot 1 · Prisma (2,4) rot 2
    // Generator leicht, Seed 10375 · Ausbau „leicht“
    name: 'Glimmer', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 7 },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '2,3': 3, '1,5': 1, '2,4': 2 },
  },
  {
    // Lösung: Prisma (4,3) rot 2 · Spiegel (6,1) rot 2 · Spiegel (4,5) rot 3
    // Generator leicht-sammelstelle, Seed 10095 · Ausbau „leicht“
    name: 'Kerzenschein', grad: 'leicht',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 5 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 1, color: 'blue' },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
    ],
    solution: { '4,3': 2, '6,1': 2, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (5,2) rot 1 · Prisma (3,2) rot 3 · Spiegel (2,3) rot 0 · Spiegel (0,2) rot 3 ·
    //   Spiegel (0,3) rot 1
    // Generator leicht, Seed 10177 · Ausbau „leicht“
    name: 'Kreidestrich', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'red' },
    ],
    solution: { '5,2': 1, '3,2': 3, '2,3': 0, '0,2': 3, '0,3': 1 },
  },
  {
    // Lösung: Spiegel (2,3) rot 3 · Spiegel (1,3) rot 1 · Prisma (1,2) rot 7 · Spiegel (3,0) rot 0 ·
    //   Spiegel (6,3) rot 2
    // Generator leicht, Seed 10245 · Ausbau „leicht“
    name: 'Farbstift', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 5 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 5, color: 'green' },
      { type: 'target', x: 4, z: 2, color: 'blue' },
    ],
    solution: { '2,3': 3, '1,3': 1, '1,2': 7, '3,0': 0, '6,3': 2 },
  },
  {
    // Lösung: Spiegel (5,3) rot 3 · Spiegel (5,6) rot 1 · Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3
    // Wertung 17.7 · 4 drehbar · 2 Ziele · Rateschritte 19 · Profil 2-filter, Seed 1699
    name: 'Fächer', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 5, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'filter', x: 2, z: 5, color: 'green' },
      { type: 'filter', x: 5, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 2, z: 6, color: 'green' },
    ],
    solution: { '5,3': 3, '5,6': 1, '5,4': 3, '2,4': 3 },
  },
  {
    // Lösung: Prisma (3,5) rot 6 · Spiegel (0,2) rot 2 · Spiegel (2,0) rot 0
    // Generator leicht-sammelstelle, Seed 11007 · Ausbau „leicht“
    name: 'Wegmarke', grad: 'leicht',
    elements: [
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'blue' },
      { type: 'target', x: 3, z: 2, color: 'green' },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
    ],
    solution: { '3,5': 6, '0,2': 2, '2,0': 0 },
  },
  {
    // Lösung: Spiegel (3,3) rot 2 · Spiegel (5,3) rot 2 · Prisma (6,2) rot 5
    // Generator leicht-mischziel, Seed 10053 · Ausbau „leicht“
    name: 'Farbklecks', grad: 'leicht',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 0, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'prism', x: 6, z: 2, rot: 6 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
    ],
    solution: { '3,3': 2, '5,3': 2, '6,2': 5 },
  },
  {
    // Lösung: Spiegel (2,4) rot 1 · Prisma (3,3) rot 5 · Spiegel (3,2) rot 3
    // Generator leicht-mischziel, Seed 10076 · Ausbau „leicht“
    name: 'Grasgrün', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'green' },
    ],
    solution: { '2,4': 1, '3,3': 5, '3,2': 3 },
  },
  {
    // Lösung: Prisma (5,4) rot 0 · Spiegel (2,4) rot 3 · Prisma (0,3) rot 0
    // Generator leicht-sammelstelle, Seed 10733 · Ausbau „leicht“
    name: 'Glanzpapier', grad: 'leicht',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 2 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'green' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 0, z: 3, rot: 7 },
      { type: 'target', x: 3, z: 6, color: 'blue' },
    ],
    solution: { '5,4': 0, '2,4': 3, '0,3': 0 },
  },
  {
    // Lösung: Spiegel (1,5) rot 1 · Spiegel (5,4) rot 1 · Spiegel (5,5) rot 1 · Spiegel (1,4) rot 1
    // Wertung 16 · 4 drehbar · 2 Ziele · Rateschritte 13 · Profil 2-bunt, Seed 268
    name: 'Spiegelgasse', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 5, z: 2, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 2, fixed: true },
      { type: 'filter', x: 3, z: 4, color: 'green' },
      { type: 'filter', x: 3, z: 5, color: 'green' },
      { type: 'target', x: 1, z: 2, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'green' },
    ],
    solution: { '1,5': 1, '5,4': 1, '5,5': 1, '1,4': 1 },
  },
  {
    // Lösung: Prisma (2,1) rot 1 · Spiegel (1,1) rot 1 · Spiegel (2,4) rot 1 · Kombinator (5,4) dir 7
    // Wertung 18.3 · 4 drehbar · 3 Ziele · Rateschritte 12 · Profil 2-misch, Seed 442
    name: 'Zwillinge', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'prism', x: 2, z: 1, rot: 5 },
      { type: 'combiner', x: 5, z: 4, dir: 4 },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'cyan' },
      { type: 'target', x: 1, z: 5, color: 'white' },
    ],
    solution: { '2,1': 1, '1,1': 1, '2,4': 1, '5,4': 7 },
  },
  {
    // Lösung: Prisma (6,3) rot 3 · Spiegel (5,2) rot 0 · Spiegel (6,5) rot 3
    // Generator leicht-sammelstelle, Seed 10769 · Ausbau „leicht“
    name: 'Fackel', grad: 'leicht',
    elements: [
      { type: 'prism', x: 6, z: 3, rot: 6 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'green' },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 4, z: 5, color: 'yellow' },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
    ],
    solution: { '6,3': 3, '5,2': 0, '6,5': 3 },
  },
  {
    // Lösung: Spiegel (6,5) rot 1 · Spiegel (5,2) rot 1 · Spiegel (2,2) rot 1 · Spiegel (5,4) rot 3 ·
    //   Spiegel (4,5) rot 1
    // Wertung 24.1 · 5 drehbar · 3 Ziele · Rateschritte 62 · Profil mittel/3-spiegel, Seed 2003045
    name: 'Glanzpunkt', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 4, color: 'white' },
    ],
    solution: { '6,5': 1, '5,2': 1, '2,2': 1, '5,4': 3, '4,5': 1 },
  },
  {
    // Lösung: Spiegel (1,0) rot 1 · Spiegel (4,3) rot 1 · Spiegel (5,3) rot 1 · Spiegel (1,3) rot 3 ·
    //   Spiegel (0,3) rot 1
    // Wertung 24.4 · 5 drehbar · 3 Ziele · Rateschritte 72 · Profil 3-bunt, Seed 2840
    name: 'Gabelung', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 0, fixed: true },
      { type: 'filter', x: 1, z: 2, color: 'cyan' },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'target', x: 5, z: 5, color: 'white' },
    ],
    solution: { '1,0': 1, '4,3': 1, '5,3': 1, '1,3': 3, '0,3': 1 },
  },
  {
    // Lösung: Spiegel (1,0) rot 1 · Spiegel (1,4) rot 1 · Spiegel (5,3) rot 3 · Spiegel (4,2) rot 1
    // Generator leicht-mischziel, Seed 10408 · Ausbau „leicht“
    name: 'Glühbirne', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 5, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'filter', x: 4, z: 5, color: 'magenta' },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 6, color: 'magenta' },
    ],
    solution: { '1,0': 1, '1,4': 1, '5,3': 3, '4,2': 1 },
  },
  {
    // Lösung: Prisma (0,3) rot 7 · Prisma (2,0) rot 5 · Spiegel (1,0) rot 3
    // Generator leicht-sammelstelle, Seed 33, Ziel 35,4–36,65 · ersetzt Auslese (Austausch „leicht“)
    name: 'Strahlteiler', grad: 'leicht',
    elements: [
      { type: 'prism', x: 0, z: 3, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 1, z: 6, color: 'red' },
    ],
    solution: { '0,3': 7, '2,0': 5, '1,0': 3 },
  },
  {
    // Lösung: Prisma (1,0) rot 2 · Prisma (5,2) rot 6 · Spiegel (5,4) rot 0
    // Generator leicht-sammelstelle, Seed 10239 · Ausbau „leicht“
    name: 'Frühlicht', grad: 'leicht',
    elements: [
      { type: 'prism', x: 1, z: 0, rot: 1 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'magenta' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 5, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'target', x: 6, z: 3, color: 'red' },
    ],
    solution: { '1,0': 2, '5,2': 6, '5,4': 0 },
  },
  {
    // Lösung: Prisma (3,6) rot 5 · Spiegel (3,4) rot 1 · Prisma (5,1) rot 6 · Kombinator (1,4) dir 5
    // Generator leicht, Seed 10672 · Ausbau „leicht“
    name: 'Lichtschalter', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'prism', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'prism', x: 5, z: 1, rot: 3 },
      { type: 'combiner', x: 1, z: 4, dir: 6 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
    ],
    solution: { '3,6': 5, '3,4': 1, '5,1': 6, '1,4': 5 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Spiegel (2,6) rot 1 · Prisma (0,5) rot 2 · Prisma (2,2) rot 3 ·
    //   Spiegel (3,6) rot 3
    // Wertung 22.3 · 5 drehbar · 4 Ziele · Rateschritte 30 · Profil 3-prisma, Seed 339
    name: 'Brechpunkt', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 3, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'prism', x: 2, z: 2, rot: 5 },
      { type: 'prism', x: 0, z: 5, rot: 5 },
      { type: 'target', x: 1, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 3, color: 'white' },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 1, z: 6, color: 'red' },
    ],
    solution: { '2,5': 3, '2,6': 1, '0,5': 2, '2,2': 3, '3,6': 3 },
  },
  {
    // Lösung: Spiegel (5,1) rot 2 · Spiegel (3,5) rot 0 · Prisma (4,6) rot 7 · Spiegel (5,6) rot 3
    // Generator leicht-mischziel, Seed 10056 · Ausbau „leicht“
    name: 'Kirschrot', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 7 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'prism', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'target', x: 5, z: 2, color: 'blue' },
    ],
    solution: { '5,1': 2, '3,5': 0, '4,6': 7, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (2,3) rot 3 · Prisma (0,3) rot 0 · Spiegel (1,2) rot 2 · Spiegel (3,6) rot 0
    // Generator leicht-mischziel, Seed 10137 · Ausbau „leicht“
    name: 'Morgentau', grad: 'leicht',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 3, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 6 },
      { type: 'prism', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 3, z: 1, color: 'green' },
    ],
    solution: { '2,3': 3, '0,3': 0, '1,2': 2, '3,6': 0 },
  },
  {
    // Lösung: Prisma (5,2) rot 2 · Spiegel (1,6) rot 0 · Spiegel (5,3) rot 3 · Spiegel (0,5) rot 2 ·
    //   Spiegel (6,3) rot 2 · Spiegel (5,4) rot 2
    // Generator leicht, Seed 10654 · Ausbau „leicht“
    name: 'Abzweigung', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 3, color: 'green' },
      { type: 'target', x: 3, z: 2, color: 'blue' },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '5,2': 2, '1,6': 0, '5,3': 3, '0,5': 2, '6,3': 2, '5,4': 2 },
  },
  {
    // Lösung: Spiegel (6,2) rot 2 · Spiegel (1,5) rot 2 · Prisma (5,3) rot 3 · Spiegel (5,4) rot 3 ·
    //   Spiegel (3,4) rot 1
    // Generator leicht, Seed 10349 · Ausbau „leicht“
    name: 'Schaukel', grad: 'leicht',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 1 },
      { type: 'source', x: 2, z: 6, dir: 5 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'prism', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'filter', x: 2, z: 4, color: 'yellow' },
      { type: 'target', x: 3, z: 2, color: 'red' },
      { type: 'target', x: 4, z: 2, color: 'yellow' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 5, color: 'green' },
    ],
    solution: { '6,2': 2, '1,5': 2, '5,3': 3, '5,4': 3, '3,4': 1 },
  },
  {
    // Lösung: Prisma (6,4) rot 5 · Spiegel (6,6) rot 3 · Spiegel (5,5) rot 0 · Spiegel (6,1) rot 1
    // Generator leicht-sammelstelle, Seed 10308 · Ausbau „leicht“
    name: 'Hellblau', grad: 'leicht',
    elements: [
      { type: 'prism', x: 6, z: 4, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'target', x: 2, z: 4, color: 'red' },
      { type: 'target', x: 3, z: 1, color: 'cyan' },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
    ],
    solution: { '6,4': 5, '6,6': 3, '5,5': 0, '6,1': 1 },
  },
  {
    // Lösung: Spiegel (2,2) rot 0 · Spiegel (3,1) rot 0 · Spiegel (6,4) rot 2 · Prisma (3,3) rot 6
    // Generator leicht, Seed 10913 · Ausbau „leicht“
    name: 'Kreisel', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'prism', x: 3, z: 3, rot: 1 },
      { type: 'filter', x: 4, z: 2, color: 'magenta' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'magenta' },
    ],
    solution: { '2,2': 0, '3,1': 0, '6,4': 2, '3,3': 6 },
  },
  {
    // Lösung: Prisma (3,3) rot 6 · Spiegel (5,0) rot 1 · Spiegel (2,0) rot 3 · Prisma (2,5) rot 1
    // Generator leicht, Seed 10506 · Ausbau „leicht“
    name: 'Lichtfleck', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'prism', x: 3, z: 3, rot: 5 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'prism', x: 2, z: 5, rot: 7 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'red' },
    ],
    solution: { '3,3': 6, '5,0': 1, '2,0': 3, '2,5': 1 },
  },
  {
    // Lösung: Prisma (5,2) rot 6 · Spiegel (6,1) rot 2 · Spiegel (5,1) rot 1 · Spiegel (3,1) rot 1 ·
    //   Kombinator (3,0) dir 3
    // Generator leicht, Seed 10472 · Ausbau „leicht“
    name: 'Kurve', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'prism', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'combiner', x: 3, z: 0, dir: 4 },
      { type: 'target', x: 1, z: 2, color: 'yellow' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '5,2': 6, '6,1': 2, '5,1': 1, '3,1': 1, '3,0': 3 },
  },
  {
    // Lösung: Spiegel (2,2) rot 3 · Prisma (0,1) rot 5 · Spiegel (2,0) rot 3 · Spiegel (3,1) rot 3 ·
    //   Spiegel (3,6) rot 3 · Spiegel (3,0) rot 1
    // Wertung 20.5 · 6 drehbar · 2 Ziele · Rateschritte 36 · Profil mittel/3-prisma, Seed 2001256
    name: 'Querschläger', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'prism', x: 0, z: 1, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'white' },
    ],
    solution: { '2,2': 3, '0,1': 5, '2,0': 3, '3,1': 3, '3,6': 3, '3,0': 1 },
  },
  {
    // Lösung: Spiegel (4,3) rot 1 · Spiegel (6,4) rot 3 · Spiegel (5,3) rot 1 · Prisma (5,0) rot 2
    // Generator leicht, Seed 10777 · Ausbau „leicht“
    name: 'Sonnenblume', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 0, dir: 4 },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'prism', x: 5, z: 0, rot: 6 },
      { type: 'filter', x: 4, z: 1, color: 'magenta' },
      { type: 'mirror', x: 2, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 4, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 5, z: 5, color: 'magenta' },
    ],
    solution: { '4,3': 1, '6,4': 3, '5,3': 1, '5,0': 2 },
  },
  {
    // Lösung: Prisma (0,4) rot 2 · Spiegel (2,6) rot 0 · Spiegel (0,5) rot 1 · Spiegel (4,4) rot 2 ·
    //   Spiegel (3,3) rot 0 · Spiegel (6,5) rot 1
    // Generator leicht, Seed 10557 · Ausbau „leicht“
    name: 'Torbogen', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'prism', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 2, z: 4, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'blocker', x: 1, z: 4 },
    ],
    solution: { '0,4': 2, '2,6': 0, '0,5': 1, '4,4': 2, '3,3': 0, '6,5': 1 },
  },
  {
    // Lösung: Prisma (6,2) rot 3 · Spiegel (5,5) rot 3 · Spiegel (0,5) rot 1
    // Generator leicht-sammelstelle, Seed 114, Ziel 39,1–41,2 · ersetzt Doppelpass (Austausch „leicht“)
    name: 'Amethyst', grad: 'leicht',
    elements: [
      { type: 'prism', x: 6, z: 2, rot: 5 },
      { type: 'source', x: 4, z: 0, dir: 1, color: 'yellow' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'filter', x: 2, z: 5, color: 'red' },
    ],
    solution: { '6,2': 3, '5,5': 3, '0,5': 1 },
  },
  {
    // Lösung: Spiegel (4,3) rot 3 · Prisma (5,5) rot 0 · Spiegel (5,3) rot 3 · Prisma (5,2) rot 0 ·
    //   Spiegel (6,3) rot 2
    // Generator leicht, Seed 10230 · Ausbau „leicht“
    name: 'Tautropfen', grad: 'leicht',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'prism', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 2, z: 5, color: 'blue' },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '4,3': 3, '5,5': 0, '5,3': 3, '5,2': 0, '6,3': 2 },
  },
  {
    // Lösung: Spiegel (6,4) rot 3 · Spiegel (6,1) rot 1 · Prisma (3,2) rot 5 · Prisma (0,1) rot 6
    // Generator leicht, Seed 11096 · Ausbau „leicht“
    name: 'Sternchen', grad: 'leicht',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'prism', x: 0, z: 1, rot: 4 },
      { type: 'mirror', x: 0, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 0, color: 'green' },
    ],
    solution: { '6,4': 3, '6,1': 1, '3,2': 5, '0,1': 6 },
  },
  {
    // Lösung: Prisma (4,4) rot 6 · Prisma (2,5) rot 3 · Spiegel (1,1) rot 2 · Spiegel (2,0) rot 0 ·
    //   Spiegel (6,2) rot 2
    // Generator leicht, Seed 10477 · Ausbau „leicht“
    name: 'Lichtkugel', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'prism', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'mirror', x: 4, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '4,4': 6, '2,5': 3, '1,1': 2, '2,0': 0, '6,2': 2 },
  },
  {
    // Lösung: Prisma (3,4) rot 6 · Spiegel (3,0) rot 3 · Prisma (6,1) rot 4
    // Generator leicht-sammelstelle, Seed 10818 · Ausbau „leicht“
    name: 'Glasperle', grad: 'leicht',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 3 },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'yellow' },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'blue' },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 2, color: 'magenta' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'prism', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 2, color: 'green' },
    ],
    solution: { '3,4': 6, '3,0': 3, '6,1': 4 },
  },
  {
    // Lösung: Prisma (2,3) rot 0 · Spiegel (3,2) rot 0 · Kombinator (4,3) dir 6 · Spiegel (4,5) rot 0 ·
    //   Spiegel (1,6) rot 1
    // Wertung 28.5 · 5 drehbar · 3 Ziele · Rateschritte 172 · handgebaut Kreuzungen
    name: 'Farbspiel', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 3, rot: 2 },
      { type: 'filter', x: 5, z: 6, color: 'cyan' },
      { type: 'combiner', x: 4, z: 3, dir: 0 },
      { type: 'blocker', x: 6, z: 1 },
      { type: 'target', x: 4, z: 0, color: 'yellow' },
      { type: 'target', x: 1, z: 1, color: 'cyan' },
      { type: 'target', x: 6, z: 3, color: 'blue' },
    ],
    solution: { '2,3': 0, '3,2': 0, '4,3': 6, '4,5': 0, '1,6': 1 },
  },
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (0,4) rot 2 · Spiegel (4,0) rot 0 · Spiegel (0,2) rot 3 ·
    //   Prisma (0,3) rot 0
    // Generator leicht-abschalten, Seed 1435, Ziel 36,7–37,5 · ersetzt Labyrinth (Austausch „leicht“)
    name: 'Fackellauf', grad: 'leicht',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'yellow' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'prism', x: 0, z: 3, rot: 1 },
      { type: 'target', x: 5, z: 3, color: 'green' },
      { type: 'target', x: 3, z: 0, color: 'red' },
    ],
    solution: { '5,2': 3, '0,4': 2, '4,0': 0, '0,2': 3, '0,3': 0 },
  },
  {
    // Lösung: Prisma (0,2) rot 0 · Spiegel (2,0) rot 0 · Spiegel (6,4) rot 2 · Spiegel (5,5) rot 0
    // Generator leicht-sammelstelle, Seed 10067 · Ausbau „leicht“
    name: 'Fensterglas', grad: 'leicht',
    elements: [
      { type: 'prism', x: 0, z: 2, rot: 1 },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 2, color: 'yellow' },
      { type: 'target', x: 3, z: 5, color: 'blue' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 2, fixed: true },
    ],
    solution: { '0,2': 0, '2,0': 0, '6,4': 2, '5,5': 0 },
  },
  {
    // Lösung: Spiegel (0,5) rot 2 · Spiegel (1,0) rot 0 · Prisma (5,4) rot 4 · Spiegel (4,5) rot 2 ·
    //   Spiegel (5,6) rot 0
    // Generator leicht-mischziel, Seed 10280 · Ausbau „leicht“
    name: 'Rosenrot', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 5, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 7, color: 'magenta' },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'prism', x: 5, z: 4, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'green' },
    ],
    solution: { '0,5': 2, '1,0': 0, '5,4': 4, '4,5': 2, '5,6': 0 },
  },
  {
    // Lösung: Prisma (5,6) rot 0 · Prisma (1,2) rot 1 · Spiegel (1,3) rot 3 · Spiegel (4,2) rot 3 ·
    //   Spiegel (6,5) rot 2
    // Generator leicht, Seed 1710, Ziel 41,3–41,8 · ersetzt Seitenlicht (Austausch „leicht“)
    name: 'Fernlicht', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'prism', x: 5, z: 6, rot: 7 },
      { type: 'prism', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'target', x: 2, z: 1, color: 'red' },
    ],
    solution: { '5,6': 0, '1,2': 1, '1,3': 3, '4,2': 3, '6,5': 2 },
  },
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (4,4) rot 1 · Spiegel (4,0) rot 1 · Spiegel (1,0) rot 3 ·
    //   Spiegel (1,4) rot 3 · Spiegel (4,1) rot 1
    // Wertung 23 · 6 drehbar · 2 Ziele · Rateschritte 67 · Profil 3-farbe, Seed 1164
    name: 'Zusammenfluss', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4, color: 'green' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 1, color: 'yellow' },
      { type: 'target', x: 1, z: 6, color: 'white' },
    ],
    solution: { '4,5': 1, '4,4': 1, '4,0': 1, '1,0': 3, '1,4': 3, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (5,5) rot 3 · Prisma (1,4) rot 0 · Prisma (5,6) rot 4 · Kombinator (3,6) dir 4
    // Generator leicht, Seed 11194 · Ausbau „leicht“
    name: 'Rutschbahn', grad: 'leicht',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'prism', x: 5, z: 6, rot: 3 },
      { type: 'combiner', x: 3, z: 6, dir: 1 },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'target', x: 4, z: 4, color: 'green' },
      { type: 'target', x: 4, z: 1, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
    ],
    solution: { '5,5': 3, '1,4': 0, '5,6': 4, '3,6': 4 },
  },
  {
    // Lösung: Spiegel (6,5) rot 3 · Spiegel (3,5) rot 1 · Spiegel (1,0) rot 1 · Spiegel (3,6) rot 3 ·
    //   Spiegel (1,6) rot 1 · Spiegel (3,3) rot 3 · Spiegel (1,1) rot 3
    // Wertung 29 · 7 drehbar · 3 Ziele · Rateschritte 249 · Profil mittel2/b-4-farbe, Seed 4351010
    name: 'Schliff', grad: 'leicht',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 5, z: 3, color: 'red' },
    ],
    solution: { '6,5': 3, '3,5': 1, '1,0': 1, '3,6': 3, '1,6': 1, '3,3': 3, '1,1': 3 },
  },
  {
    // Lösung: Prisma (1,3) rot 6 · Spiegel (3,1) rot 0 · Spiegel (0,2) rot 2 · Spiegel (1,1) rot 2 ·
    //   Prisma (3,2) rot 0 · Spiegel (6,2) rot 3
    // Generator leicht-falle, Seed 525, Ziel 42,4–42,95 · ersetzt Lichtbündel (Austausch „leicht“)
    name: 'Blitz', grad: 'leicht',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 1, z: 3, rot: 4 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'target', x: 5, z: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 1 },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'blue' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '1,3': 6, '3,1': 0, '0,2': 2, '1,1': 2, '3,2': 0, '6,2': 3 },
  },
  {
    // Lösung: Prisma (1,4) rot 6 · Spiegel (2,2) rot 0 · Prisma (3,3) rot 3 · Spiegel (3,6) rot 1
    // Generator leicht-sammelstelle, Seed 10659 · Ausbau „leicht“
    name: 'Lindgrün', grad: 'leicht',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'magenta' },
      { type: 'target', x: 1, z: 1, color: 'green' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'prism', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'green' },
      { type: 'target', x: 5, z: 2, color: 'red' },
    ],
    solution: { '1,4': 6, '2,2': 0, '3,3': 3, '3,6': 1 },
  },
  {
    // Lösung: Spiegel (1,4) rot 3 · Spiegel (3,4) rot 3 · Spiegel (3,1) rot 3 · Spiegel (1,1) rot 1 ·
    //   Prisma (4,4) rot 5 · Spiegel (4,1) rot 1
    // Generator mittel-abzaehlen, Seed 10221 · Ausbau „mittel“
    name: 'Bronze', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 5, color: 'blue' },
    ],
    solution: { '1,4': 3, '3,4': 3, '3,1': 3, '1,1': 1, '4,4': 5, '4,1': 1 },
  },
  {
    // Lösung: Prisma (4,5) rot 0 · Spiegel (4,4) rot 3 · Spiegel (0,1) rot 2 · Spiegel (2,6) rot 1 ·
    //   Spiegel (6,5) rot 1
    // Generator mittel-sammelstelle, Seed 10651 · Ausbau „mittel“
    name: 'Krokus', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 3, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '4,5': 0, '4,4': 3, '0,1': 2, '2,6': 1, '6,5': 1 },
  },
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (1,4) rot 3 · Spiegel (6,3) rot 3 · Spiegel (6,0) rot 1 ·
    //   Spiegel (1,0) rot 3
    // Generator mittel-mischziel, Seed 11017 · Ausbau „mittel“
    name: 'Enzian', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'filter', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '4,2': 1, '1,4': 3, '6,3': 3, '6,0': 1, '1,0': 3 },
  },
  {
    // Lösung: Prisma (2,5) rot 5 · Spiegel (2,3) rot 3 · Spiegel (1,5) rot 1 · Spiegel (1,4) rot 1 ·
    //   Prisma (0,2) rot 2
    // Generator mittel-falle, Seed 10727 · Ausbau „mittel“
    name: 'Titan', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 3, color: 'yellow' },
      { type: 'prism', x: 0, z: 2, rot: 4 },
      { type: 'target', x: 4, z: 6, color: 'red' },
    ],
    solution: { '2,5': 5, '2,3': 3, '1,5': 1, '1,4': 1, '0,2': 2 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Spiegel (5,5) rot 1 · Spiegel (1,2) rot 1 · Spiegel (2,3) rot 1 ·
    //   Prisma (1,5) rot 6
    // Generator mittel-mischziel, Seed 10664 · Ausbau „mittel“
    name: 'Europa', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'target', x: 5, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'red' },
    ],
    solution: { '2,5': 3, '5,5': 1, '1,2': 1, '2,3': 1, '1,5': 6 },
  },
  {
    // Lösung: Spiegel (2,4) rot 1 · Spiegel (4,4) rot 1 · Spiegel (4,1) rot 3 · Spiegel (2,1) rot 1 ·
    //   Prisma (2,5) rot 5 · Spiegel (0,5) rot 3
    // Generator mittel-abzaehlen, Seed 10027 · Ausbau „mittel“
    name: 'Bachlauf', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 4, z: 5, color: 'magenta' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 2, color: 'red' },
    ],
    solution: { '2,4': 1, '4,4': 1, '4,1': 3, '2,1': 1, '2,5': 5, '0,5': 3 },
  },
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,1) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (2,5) rot 1
    // Generator mittel-abzaehlen, Seed 10373 · Ausbau „mittel“
    name: 'Lichtfeder', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 5, z: 0, color: 'cyan' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '5,4': 3, '2,4': 3, '2,1': 1, '5,1': 3, '5,5': 5, '2,5': 1 },
  },
  {
    // Lösung: Prisma (1,1) rot 0 · Spiegel (1,4) rot 1 · Spiegel (2,2) rot 2 · Spiegel (3,3) rot 0 ·
    //   Prisma (5,1) rot 0
    // Generator mittel-sammelstelle, Seed 187, Ziel 44,28–45,68 · ersetzt Glasmurmel (Austausch „mittel“)
    name: 'Dreiklang', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 1, rot: 3 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'green' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'magenta' },
      { type: 'target', x: 4, z: 1, color: 'green' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'prism', x: 5, z: 1, rot: 7 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '1,1': 0, '1,4': 1, '2,2': 2, '3,3': 0, '5,1': 0 },
  },
  {
    // Lösung: Spiegel (3,5) rot 3 · Spiegel (2,2) rot 0 · Spiegel (3,3) rot 2 · Spiegel (5,5) rot 1 ·
    //   Prisma (4,4) rot 7 · Spiegel (5,4) rot 1
    // Generator mittel-abschalten, Seed 335, Ziel 44,28–45,68 · ersetzt Knotenpunkt (Austausch „mittel“)
    name: 'Weissglut', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 3, z: 5, rot: 1 },
      { type: 'target', x: 1, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'target', x: 5, z: 6, color: 'white' },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
    ],
    solution: { '3,5': 3, '2,2': 0, '3,3': 2, '5,5': 1, '4,4': 7, '5,4': 1 },
  },
  {
    // Lösung: Prisma (3,5) rot 5 · Spiegel (3,3) rot 3 · Spiegel (2,5) rot 1 · Spiegel (2,4) rot 1 ·
    //   Prisma (3,6) rot 3 · Spiegel (0,4) rot 1
    // Generator mittel-falle, Seed 10184 · Ausbau „mittel“
    name: 'Malachit', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'prism', x: 3, z: 5, rot: 6 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'target', x: 5, z: 3, color: 'blue' },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 1, color: 'red' },
    ],
    solution: { '3,5': 5, '3,3': 3, '2,5': 1, '2,4': 1, '3,6': 3, '0,4': 1 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Spiegel (3,1) rot 0 · Prisma (2,0) rot 3 · Spiegel (1,1) rot 2 ·
    //   Spiegel (4,4) rot 0 · Spiegel (5,3) rot 0
    // Generator mittel-mischziel, Seed 47, Ziel 45,7–46,88 · ersetzt Lichtschacht (Austausch „mittel“)
    name: 'Meeresleuchten', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'prism', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '2,5': 3, '3,1': 0, '2,0': 3, '1,1': 2, '4,4': 0, '5,3': 0 },
  },
  {
    // Lösung: Prisma (6,2) rot 4 · Spiegel (6,0) rot 1 · Spiegel (1,3) rot 3 · Prisma (3,3) rot 1 ·
    //   Spiegel (5,5) rot 2
    // Generator mittel-sammelstelle, Seed 10577 · Ausbau „mittel“
    name: 'Spektrum', grad: 'mittel',
    elements: [
      { type: 'prism', x: 6, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'green' },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 2, z: 2, color: 'green' },
      { type: 'target', x: 3, z: 5, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'prism', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'green' },
    ],
    solution: { '6,2': 4, '6,0': 1, '1,3': 3, '3,3': 1, '5,5': 2 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (1,4) rot 1 · Spiegel (4,4) rot 1 · Spiegel (4,1) rot 3 ·
    //   Prisma (1,5) rot 7 · Spiegel (4,5) rot 3
    // Generator mittel-abzaehlen, Seed 10761 · Ausbau „mittel“
    name: 'Granat', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 1, z: 0, color: 'magenta' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'prism', x: 1, z: 5, rot: 4 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
    ],
    solution: { '1,1': 3, '1,4': 1, '4,4': 1, '4,1': 3, '1,5': 7, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (2,4) rot 3 · Spiegel (2,2) rot 1 · Spiegel (4,2) rot 3 · Spiegel (4,4) rot 3 ·
    //   Prisma (1,4) rot 1 · Spiegel (1,6) rot 1
    // Generator mittel-abzaehlen, Seed 10083 · Ausbau „mittel“
    name: 'Farbtafel', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'white' },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'prism', x: 1, z: 4, rot: 7 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'green' },
    ],
    solution: { '2,4': 3, '2,2': 1, '4,2': 3, '4,4': 3, '1,4': 1, '1,6': 1 },
  },
  {
    // Lösung: Prisma (4,4) rot 7 · Spiegel (2,6) rot 0 · Prisma (4,1) rot 1 · Spiegel (4,3) rot 3 ·
    //   Kombinator (6,3) dir 2
    // Generator mittel-sammelstelle, Seed 10598 · Ausbau „mittel“
    name: 'Brillenglas', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 5 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'target', x: 5, z: 4, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'cyan' },
      { type: 'prism', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'combiner', x: 6, z: 3, dir: 5 },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
    ],
    solution: { '4,4': 7, '2,6': 0, '4,1': 1, '4,3': 3, '6,3': 2 },
  },
  {
    // Lösung: Spiegel (2,5) rot 1 · Spiegel (5,5) rot 1 · Spiegel (5,1) rot 1 · Spiegel (2,1) rot 1 ·
    //   Prisma (1,1) rot 1 · Spiegel (1,6) rot 3
    // Generator mittel-abzaehlen, Seed 11065 · Ausbau „mittel“
    name: 'Ganymed', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'target', x: 2, z: 0, color: 'white' },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'prism', x: 1, z: 1, rot: 7 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '2,5': 1, '5,5': 1, '5,1': 1, '2,1': 1, '1,1': 1, '1,6': 3 },
  },
  {
    // Lösung: Spiegel (1,4) rot 3 · Spiegel (4,0) rot 1 · Spiegel (3,3) rot 2 · Prisma (3,4) rot 3 ·
    //   Prisma (4,5) rot 5 · Prisma (5,5) rot 4
    // Generator mittel-lockvogel, Seed 10180 · Ausbau „mittel“
    name: 'Kobalt', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'cyan' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 5, color: 'magenta' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 3, rot: 3, fixed: true },
      { type: 'prism', x: 3, z: 4, rot: 6 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'target', x: 1, z: 6, color: 'green' },
    ],
    solution: { '1,4': 3, '4,0': 1, '3,3': 2, '3,4': 3, '4,5': 5, '5,5': 4 },
  },
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (0,4) rot 1 · Spiegel (0,0) rot 3 · Spiegel (3,0) rot 1 ·
    //   Prisma (3,3) rot 1 · Spiegel (4,3) rot 1
    // Generator mittel-mischziel, Seed 11110 · Ausbau „mittel“
    name: 'Bergsee', grad: 'mittel',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 1, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'prism', x: 3, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '4,5': 1, '0,4': 1, '0,0': 3, '3,0': 1, '3,3': 1, '4,3': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (5,5) rot 3 · Spiegel (4,3) rot 1 · Prisma (0,2) rot 1 ·
    //   Spiegel (0,5) rot 1 · Spiegel (6,6) rot 3 · Spiegel (1,3) rot 0
    // Generator mittel-mischziel, Seed 10435 · Ausbau „mittel“
    name: 'Sonnenuhr', grad: 'mittel',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 5, z: 3, color: 'white' },
      { type: 'source', x: 2, z: 0, dir: 3, color: 'cyan' },
      { type: 'prism', x: 0, z: 2, rot: 6 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 2, color: 'green' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '3,5': 1, '5,5': 3, '4,3': 1, '0,2': 1, '0,5': 1, '6,6': 3, '1,3': 0 },
  },
  {
    // Lösung: Spiegel (0,2) rot 1 · Spiegel (3,2) rot 1 · Spiegel (3,5) rot 1 · Spiegel (0,5) rot 3 ·
    //   Prisma (4,2) rot 5 · Spiegel (4,1) rot 3 · Spiegel (5,1) rot 3 · Spiegel (5,0) rot 3
    // Generator mittel-abzaehlen, Seed 10480 · Ausbau „mittel“
    name: 'Mondstein', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 3, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'yellow' },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '0,2': 1, '3,2': 1, '3,5': 1, '0,5': 3, '4,2': 5, '4,1': 3, '5,1': 3, '5,0': 3 },
  },
  {
    // Lösung: Prisma (1,5) rot 7 · Spiegel (0,4) rot 2 · Prisma (5,3) rot 4 · Spiegel (4,3) rot 3 ·
    //   Spiegel (3,5) rot 3
    // Generator mittel-sammelstelle, Seed 10066 · Ausbau „mittel“
    name: 'Deimos', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 3, color: 'cyan' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'green' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'prism', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '1,5': 7, '0,4': 2, '5,3': 4, '4,3': 3, '3,5': 3 },
  },
  {
    // Lösung: Prisma (2,2) rot 1 · Spiegel (4,2) rot 3 · Spiegel (2,3) rot 1 · Spiegel (3,3) rot 1 ·
    //   Spiegel (3,5) rot 1 · Prisma (1,5) rot 7
    // Generator mittel-falle, Seed 10622 · Ausbau „mittel“
    name: 'Gipfelkreuz', grad: 'mittel',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'mirror', x: 6, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
    ],
    solution: { '2,2': 1, '4,2': 3, '2,3': 1, '3,3': 1, '3,5': 1, '1,5': 7 },
  },
  {
    // Lösung: Prisma (3,6) rot 5 · Spiegel (5,4) rot 2 · Spiegel (1,6) rot 1 · Spiegel (1,1) rot 1 ·
    //   Spiegel (0,1) rot 1 · Spiegel (5,0) rot 0
    // Generator mittel-sammelstelle, Seed 10024 · Ausbau „mittel“
    name: 'Farbton', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 6, rot: 4 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'target', x: 3, z: 1, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'red' },
      { type: 'mirror', x: 5, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 2, fixed: true },
    ],
    solution: { '3,6': 5, '5,4': 2, '1,6': 1, '1,1': 1, '0,1': 1, '5,0': 0 },
  },
  {
    // Lösung: Spiegel (5,5) rot 1 · Spiegel (2,2) rot 1 · Spiegel (4,4) rot 3 · Prisma (4,1) rot 5 ·
    //   Spiegel (0,2) rot 1 · Spiegel (2,5) rot 1
    // Generator mittel-mischziel, Seed 10040 · Ausbau „mittel“
    name: 'Lichtgitter', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'green' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'target', x: 5, z: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'prism', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '5,5': 1, '2,2': 1, '4,4': 3, '4,1': 5, '0,2': 1, '2,5': 1 },
  },
  {
    // Lösung: Prisma (1,2) rot 4 · Spiegel (5,6) rot 0 · Prisma (1,1) rot 4 · Spiegel (0,2) rot 2 ·
    //   Spiegel (3,5) rot 0
    // Generator mittel-sammelstelle, Seed 10900 · Ausbau „mittel“
    name: 'Brennpunkt', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 2, rot: 7 },
      { type: 'source', x: 3, z: 0, dir: 3, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 3, color: 'blue' },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,2': 4, '5,6': 0, '1,1': 4, '0,2': 2, '3,5': 0 },
  },
  {
    // Lösung: Spiegel (6,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (3,5) rot 1 · Spiegel (6,5) rot 1 ·
    //   Prisma (6,2) rot 3 · Spiegel (4,2) rot 1 · Spiegel (1,0) rot 3 · Spiegel (1,2) rot 3
    // Generator mittel-abzaehlen, Seed 10612 · Ausbau „mittel“
    name: 'Onyx', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'white' },
      { type: 'target', x: 3, z: 1, color: 'red' },
      { type: 'prism', x: 6, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '6,3': 3, '3,3': 1, '3,5': 1, '6,5': 1, '6,2': 3, '4,2': 1, '1,0': 3, '1,2': 3 },
  },
  {
    // Lösung: Prisma (4,3) rot 6 · Spiegel (2,1) rot 0 · Spiegel (5,2) rot 2 · Spiegel (4,1) rot 2 ·
    //   Spiegel (2,4) rot 1 · Prisma (6,5) rot 4
    // Generator mittel-falle, Seed 10363 · Ausbau „mittel“
    name: 'Silhouette', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'white' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'prism', x: 6, z: 5, rot: 5 },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '4,3': 6, '2,1': 0, '5,2': 2, '4,1': 2, '2,4': 1, '6,5': 4 },
  },
  {
    // Lösung: Prisma (0,3) rot 6 · Spiegel (0,4) rot 1 · Prisma (4,1) rot 6 · Spiegel (5,0) rot 0 ·
    //   Spiegel (6,1) rot 2 · Spiegel (1,6) rot 0
    // Generator mittel-sammelstelle, Seed 10290 · Ausbau „mittel“
    name: 'Hängebrücke', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 3, rot: 1 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'prism', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '0,3': 6, '0,4': 1, '4,1': 6, '5,0': 0, '6,1': 2, '1,6': 0 },
  },
  {
    // Lösung: Prisma (4,4) rot 5 · Spiegel (4,2) rot 3 · Spiegel (3,4) rot 1 · Spiegel (3,3) rot 1 ·
    //   Prisma (0,2) rot 1 · Kombinator (1,3) dir 7
    // Generator mittel-falle, Seed 11069 · Ausbau „mittel“
    name: 'Halbmond', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'prism', x: 0, z: 2, rot: 4 },
      { type: 'combiner', x: 1, z: 3, dir: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 1, color: 'yellow' },
      { type: 'target', x: 4, z: 1, color: 'red' },
    ],
    solution: { '4,4': 5, '4,2': 3, '3,4': 1, '3,3': 1, '0,2': 1, '1,3': 7 },
  },
  {
    // Lösung: Spiegel (1,2) rot 1 · Spiegel (1,4) rot 1 · Spiegel (3,4) rot 1 · Spiegel (3,2) rot 3 ·
    //   Prisma (4,4) rot 5 · Spiegel (4,0) rot 1 · Spiegel (1,0) rot 3 · Spiegel (3,1) rot 3
    // Generator mittel-abzaehlen, Seed 10426 · Ausbau „mittel“
    name: 'Aquamarin', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'target', x: 5, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'prism', x: 4, z: 4, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
    ],
    solution: { '1,2': 1, '1,4': 1, '3,4': 1, '3,2': 3, '4,4': 5, '4,0': 1, '1,0': 3, '3,1': 3 },
  },
  {
    // Lösung: Prisma (5,4) rot 4 · Spiegel (2,4) rot 1 · Spiegel (4,2) rot 1 · Spiegel (4,5) rot 1 ·
    //   Spiegel (3,5) rot 1 · Spiegel (1,0) rot 0 · Spiegel (2,2) rot 3
    // Wertung 27.7 · 7 drehbar · 3 Ziele · Rateschritte 159 · Profil mittel2/b-4-filter, Seed 4999940
    name: 'Lichtkreuz', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 5, z: 4, rot: 3 },
      { type: 'filter', x: 3, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '5,4': 4, '2,4': 1, '4,2': 1, '4,5': 1, '3,5': 1, '1,0': 0, '2,2': 3 },
  },
  {
    // Lösung: Prisma (5,2) rot 3 · Spiegel (5,1) rot 1 · Spiegel (5,5) rot 3 · Prisma (1,2) rot 0 ·
    //   Spiegel (5,6) rot 0
    // Generator mittel-sammelstelle, Seed 10416 · Ausbau „mittel“
    name: 'Neumond', grad: 'mittel',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 6 },
      { type: 'source', x: 6, z: 3, dir: 5, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 2, z: 2, color: 'cyan' },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'cyan' },
      { type: 'prism', x: 1, z: 2, rot: 5 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 2, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'blue' },
    ],
    solution: { '5,2': 3, '5,1': 1, '5,5': 3, '1,2': 0, '5,6': 0 },
  },
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (6,3) rot 3 · Spiegel (2,5) rot 3 · Spiegel (0,5) rot 3 ·
    //   Spiegel (0,6) rot 1 · Spiegel (1,6) rot 3 · Prisma (1,2) rot 7
    // Generator mittel-mischziel, Seed 10329 · Ausbau „mittel“
    name: 'Intarsie', grad: 'mittel',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'prism', x: 1, z: 2, rot: 3 },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 1, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 4, color: 'blue' },
    ],
    solution: { '4,2': 1, '6,3': 3, '2,5': 3, '0,5': 3, '0,6': 1, '1,6': 3, '1,2': 7 },
  },
  {
    // Lösung: Spiegel (5,2) rot 3 · Spiegel (3,5) rot 1 · Prisma (2,4) rot 5 · Spiegel (0,4) rot 3 ·
    //   Spiegel (1,3) rot 2 · Spiegel (1,1) rot 0 · Spiegel (0,5) rot 1 · Spiegel (3,6) rot 1
    // Generator mittel-mischziel, Seed 10570 · Ausbau „mittel“
    name: 'Perlglanz', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'yellow' },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '5,2': 3, '3,5': 1, '2,4': 5, '0,4': 3, '1,3': 2, '1,1': 0, '0,5': 1, '3,6': 1 },
  },
  {
    // Lösung: Prisma (2,3) rot 7 · Spiegel (4,1) rot 2 · Prisma (6,0) rot 4 · Spiegel (1,5) rot 0 ·
    //   Spiegel (0,4) rot 2 · Spiegel (3,1) rot 0
    // Generator mittel-sammelstelle, Seed 10504 · Ausbau „mittel“
    name: 'Mondfinsternis', grad: 'mittel',
    elements: [
      { type: 'prism', x: 2, z: 3, rot: 5 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'blue' },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 3, color: 'magenta' },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 6, z: 0, rot: 7 },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
    ],
    solution: { '2,3': 7, '4,1': 2, '6,0': 4, '1,5': 0, '0,4': 2, '3,1': 0 },
  },
  {
    // Lösung: Spiegel (4,2) rot 3 · Spiegel (4,4) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,2) rot 3 ·
    //   Prisma (5,2) rot 3 · Prisma (1,1) rot 1 · Spiegel (4,1) rot 1
    // Generator mittel-abzaehlen, Seed 10144 · Ausbau „mittel“
    name: 'Seidenglanz', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 1, z: 6, color: 'magenta' },
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'prism', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 4, z: 5, color: 'red' },
    ],
    solution: { '4,2': 3, '4,4': 1, '1,4': 1, '1,2': 3, '5,2': 3, '1,1': 1, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (1,2) rot 3 · Prisma (1,1) rot 7 · Spiegel (5,4) rot 3 · Spiegel (1,0) rot 3 ·
    //   Spiegel (2,4) rot 1 · Spiegel (3,1) rot 1 · Spiegel (2,0) rot 1
    // Wertung 27.8 · 7 drehbar · 3 Ziele · Rateschritte 190 · Profil mittel2/b-4-filter, Seed 4170829
    name: 'Sternschnuppe', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0, fixed: true },
      { type: 'prism', x: 1, z: 1, rot: 2 },
      { type: 'filter', x: 1, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 1, z: 3, color: 'blue' },
      { type: 'target', x: 2, z: 5, color: 'red' },
    ],
    solution: { '1,2': 3, '1,1': 7, '5,4': 3, '1,0': 3, '2,4': 1, '3,1': 1, '2,0': 1 },
  },
  {
    // Lösung: Spiegel (5,5) rot 1 · Prisma (5,1) rot 0 · Spiegel (2,1) rot 3 · Spiegel (2,0) rot 3 ·
    //   Prisma (3,0) rot 0 · Spiegel (4,0) rot 1 · Spiegel (2,5) rot 1 · Spiegel (2,2) rot 1
    // Wertung 28.8 · 8 drehbar · 3 Ziele · Rateschritte 189 · Profil mittel2/b-4-prisma, Seed 4044674
    name: 'Spiegeltreppe', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 0, rot: 2, fixed: true },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'prism', x: 3, z: 0, rot: 5 },
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 2, color: 'white' },
      { type: 'target', x: 5, z: 2, color: 'blue' },
    ],
    solution: { '5,5': 1, '5,1': 0, '2,1': 3, '2,0': 3, '3,0': 0, '4,0': 1, '2,5': 1, '2,2': 1 },
  },
  {
    // Lösung: Prisma (0,5) rot 7 · Spiegel (1,6) rot 0 · Spiegel (0,1) rot 2 · Spiegel (1,0) rot 0 ·
    //   Spiegel (2,1) rot 0 · Prisma (3,2) rot 4
    // Generator mittel-sammelstelle, Seed 11079 · Ausbau „mittel“
    name: 'Sonate', grad: 'mittel',
    elements: [
      { type: 'prism', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'target', x: 0, z: 2, color: 'yellow' },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 4, z: 1, rot: 2, fixed: true },
      { type: 'prism', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 1, z: 4, color: 'red' },
    ],
    solution: { '0,5': 7, '1,6': 0, '0,1': 2, '1,0': 0, '2,1': 0, '3,2': 4 },
  },
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (2,4) rot 1 · Spiegel (5,4) rot 1 · Spiegel (5,2) rot 1 ·
    //   Prisma (1,2) rot 1 · Spiegel (1,3) rot 3 · Spiegel (0,3) rot 3 · Spiegel (2,5) rot 1
    // Generator mittel-abzaehlen, Seed 20199, Ziel 52–58 · Ausbau „mittel“
    name: 'Merkur', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 7 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'target', x: 2, z: 6, color: 'blue' },
    ],
    solution: { '2,2': 1, '2,4': 1, '5,4': 1, '5,2': 1, '1,2': 1, '1,3': 3, '0,3': 3, '2,5': 1 },
  },
  {
    // Lösung: Spiegel (4,1) rot 2 · Spiegel (1,0) rot 0 · Spiegel (5,4) rot 0 · Spiegel (5,2) rot 0 ·
    //   Prisma (1,4) rot 0 · Spiegel (2,5) rot 0 · Spiegel (3,2) rot 0
    // Wertung 34 · 7 drehbar · 4 Ziele · Rateschritte 536 · Profil mittel2/b-4-filter, Seed 4241762
    name: 'Farbverlauf', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 0, fixed: true },
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'filter', x: 2, z: 1, color: 'yellow' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 3, color: 'magenta' },
      { type: 'target', x: 4, z: 4, color: 'green' },
    ],
    solution: { '4,1': 2, '1,0': 0, '5,4': 0, '5,2': 0, '1,4': 0, '2,5': 0, '3,2': 0 },
  },
  {
    // Lösung: Spiegel (6,1) rot 3 · Spiegel (1,1) rot 1 · Prisma (3,5) rot 7 · Spiegel (1,0) rot 3 ·
    //   Spiegel (3,4) rot 3 · Prisma (4,1) rot 3 · Spiegel (6,5) rot 3
    // Wertung 30.9 · 7 drehbar · 3 Ziele · Rateschritte 317 · Profil mittel2/b-4-prisma, Seed 4036449
    name: 'Glasfaser', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'source', x: 4, z: 6, dir: 5 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 4, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'prism', x: 4, z: 1, rot: 7 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'white' },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
    ],
    solution: { '6,1': 3, '1,1': 1, '3,5': 7, '1,0': 3, '3,4': 3, '4,1': 3, '6,5': 3 },
  },
  {
    // Lösung: Prisma (2,0) rot 3 · Spiegel (2,2) rot 1 · Spiegel (1,0) rot 3 · Spiegel (1,1) rot 3 ·
    //   Spiegel (0,1) rot 3 · Spiegel (2,4) rot 1 · Spiegel (0,2) rot 1 · Prisma (2,5) rot 4
    // Generator mittel-falle, Seed 218, Ziel 55,55–55,68 · ersetzt Weichensteller (Austausch „mittel“)
    name: 'Kaskade', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 4, color: 'magenta' },
      { type: 'prism', x: 2, z: 0, rot: 6 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 2, color: 'red' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '2,0': 3, '2,2': 1, '1,0': 3, '1,1': 3, '0,1': 3, '2,4': 1, '0,2': 1, '2,5': 4 },
  },
  {
    // Lösung: Spiegel (5,3) rot 3 · Spiegel (4,3) rot 3 · Spiegel (1,5) rot 1 · Spiegel (4,2) rot 1 ·
    //   Spiegel (4,0) rot 1 · Prisma (2,0) rot 3 · Spiegel (2,3) rot 1
    // Generator mittel-mischziel, Seed 10309 · Ausbau „mittel“
    name: 'Ranke', grad: 'mittel',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'prism', x: 2, z: 0, rot: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 3, z: 6, color: 'red' },
    ],
    solution: { '5,3': 3, '4,3': 3, '1,5': 1, '4,2': 1, '4,0': 1, '2,0': 3, '2,3': 1 },
  },
  {
    // Lösung: Spiegel (4,1) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,5) rot 1 · Spiegel (4,5) rot 1 ·
    //   Prisma (2,5) rot 7 · Spiegel (3,4) rot 2 · Spiegel (1,4) rot 0 · Spiegel (0,3) rot 2
    // Generator mittel-abzaehlen, Seed 10310 · Ausbau „mittel“
    name: 'Fernrohr', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 1, color: 'white' },
      { type: 'prism', x: 2, z: 5, rot: 6 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
    ],
    solution: { '4,1': 1, '6,1': 3, '6,5': 1, '4,5': 1, '2,5': 7, '3,4': 2, '1,4': 0, '0,3': 2 },
  },
  {
    // Lösung: Prisma (1,6) rot 7 · Spiegel (0,5) rot 2 · Spiegel (1,2) rot 1 · Spiegel (0,2) rot 3 ·
    //   Spiegel (0,3) rot 1 · Prisma (2,2) rot 4
    // Generator mittel-sammelstelle, Seed 11145 · Ausbau „mittel“
    name: 'Abenddämmerung', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 6, rot: 3 },
      { type: 'source', x: 5, z: 0, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'green' },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 3, color: 'yellow' },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'green' },
    ],
    solution: { '1,6': 7, '0,5': 2, '1,2': 1, '0,2': 3, '0,3': 1, '2,2': 4 },
  },
  {
    // Lösung: Prisma (3,2) rot 7 · Spiegel (3,0) rot 1 · Spiegel (4,2) rot 3 · Spiegel (4,1) rot 3 ·
    //   Prisma (2,3) rot 1 · Spiegel (6,3) rot 1 · Spiegel (2,6) rot 1
    // Generator mittel-falle, Seed 10318 · Ausbau „mittel“
    name: 'Lagune', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 1, z: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'prism', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'target', x: 5, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 1, color: 'blue' },
    ],
    solution: { '3,2': 7, '3,0': 1, '4,2': 3, '4,1': 3, '2,3': 1, '6,3': 1, '2,6': 1 },
  },
  {
    // Lösung: Spiegel (1,0) rot 0 · Spiegel (3,2) rot 2 · Spiegel (2,4) rot 1 · Spiegel (1,6) rot 0 ·
    //   Prisma (0,5) rot 7 · Spiegel (6,5) rot 1 · Spiegel (6,6) rot 3 · Spiegel (5,1) rot 1
    // Generator mittel-mischziel, Seed 20297, Ziel 52–58 · Ausbau „mittel“
    name: 'Arabeske', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 7, color: 'cyan' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 1, dir: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'prism', x: 0, z: 5, rot: 4 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
    ],
    solution: { '1,0': 0, '3,2': 2, '2,4': 1, '1,6': 0, '0,5': 7, '6,5': 1, '6,6': 3, '5,1': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (3,3) rot 3 · Spiegel (5,3) rot 3 · Spiegel (5,5) rot 1 ·
    //   Prisma (1,5) rot 7 · Prisma (3,1) rot 1 · Spiegel (6,1) rot 3
    // Generator mittel-abzaehlen, Seed 20005, Ziel 52–58 · Ausbau „mittel“
    name: 'Mars', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'cyan' },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'magenta' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'prism', x: 1, z: 5, rot: 4 },
      { type: 'target', x: 2, z: 4, color: 'green' },
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '3,5': 1, '3,3': 3, '5,3': 3, '5,5': 1, '1,5': 7, '3,1': 1, '6,1': 3 },
  },
  {
    // Lösung: Prisma (3,4) rot 6 · Spiegel (1,2) rot 2 · Spiegel (3,0) rot 0 · Spiegel (6,3) rot 2 ·
    //   Prisma (2,6) rot 7 · Spiegel (2,0) rot 1
    // Generator mittel-sammelstelle, Seed 10371 · Ausbau „mittel“
    name: 'Rückspiegel', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'green' },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'target', x: 3, z: 1, color: 'green' },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'prism', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'green' },
    ],
    solution: { '3,4': 6, '1,2': 2, '3,0': 0, '6,3': 2, '2,6': 7, '2,0': 1 },
  },
  {
    // Lösung: Prisma (3,4) rot 5 · Prisma (2,2) rot 2 · Spiegel (2,6) rot 3 · Spiegel (5,5) rot 0 ·
    //   Spiegel (3,1) rot 3 · Spiegel (4,1) rot 1
    // Generator mittel-sammelstelle, Seed 10336 · Ausbau „mittel“
    name: 'Kupferglanz', grad: 'mittel',
    elements: [
      { type: 'prism', x: 3, z: 4, rot: 2 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'prism', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 1 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '3,4': 5, '2,2': 2, '2,6': 3, '5,5': 0, '3,1': 3, '4,1': 1 },
  },
  {
    // Lösung: Prisma (4,1) rot 6 · Spiegel (2,1) rot 3 · Spiegel (5,1) rot 1 · Spiegel (4,2) rot 3 ·
    //   Prisma (4,4) rot 2 · Spiegel (4,6) rot 3 · Spiegel (3,6) rot 1
    // Generator mittel-sammelstelle, Seed 10139 · Ausbau „mittel“
    name: 'Regenschauer', grad: 'mittel',
    elements: [
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
    ],
    solution: { '4,1': 6, '2,1': 3, '5,1': 1, '4,2': 3, '4,4': 2, '4,6': 3, '3,6': 1 },
  },
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,1) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (4,5) rot 3 · Spiegel (2,6) rot 1 · Spiegel (6,1) rot 3
    // Generator mittel-abzaehlen, Seed 10993 · Ausbau „mittel“
    name: 'Wechselspiel', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'red' },
    ],
    solution: { '5,4': 3, '2,4': 3, '2,1': 1, '5,1': 3, '5,5': 5, '4,5': 3, '2,6': 1, '6,1': 3 },
  },
  {
    // Lösung: Spiegel (2,0) rot 0 · Spiegel (3,1) rot 2 · Spiegel (4,6) rot 3 · Spiegel (4,2) rot 3 ·
    //   Spiegel (5,4) rot 3 · Spiegel (6,4) rot 3 · Prisma (6,2) rot 4
    // Generator mittel-mischziel, Seed 20358, Ziel 52–58 · Ausbau „mittel“
    name: 'Walzer', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 7, color: 'red' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 2, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'prism', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 5, z: 0, color: 'green' },
    ],
    solution: { '2,0': 0, '3,1': 2, '4,6': 3, '4,2': 3, '5,4': 3, '6,4': 3, '6,2': 4 },
  },
  {
    // Lösung: Prisma (4,2) rot 3 · Spiegel (4,4) rot 1 · Spiegel (3,2) rot 3 · Spiegel (3,3) rot 3 ·
    //   Spiegel (2,3) rot 3 · Spiegel (1,3) rot 1 · Prisma (1,1) rot 5 · Spiegel (2,6) rot 1
    // Generator mittel-falle, Seed 10421 · Ausbau „mittel“
    name: 'Glasharfe', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 6, z: 4, color: 'red' },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '4,2': 3, '4,4': 1, '3,2': 3, '3,3': 3, '2,3': 3, '1,3': 1, '1,1': 5, '2,6': 1 },
  },
  {
    // Lösung: Prisma (1,4) rot 2 · Spiegel (5,4) rot 1 · Spiegel (4,1) rot 0 · Spiegel (1,2) rot 2 ·
    //   Spiegel (2,5) rot 2 · Spiegel (2,1) rot 0 · Prisma (3,0) rot 0 · Spiegel (5,0) rot 0
    // Generator mittel-sammelstelle, Seed 10036 · Ausbau „mittel“
    name: 'Laterna magica', grad: 'mittel',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'source', x: 6, z: 3, dir: 5, color: 'green' },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 3, z: 0, rot: 4 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'green' },
    ],
    solution: { '1,4': 2, '5,4': 1, '4,1': 0, '1,2': 2, '2,5': 2, '2,1': 0, '3,0': 0, '5,0': 0 },
  },
  {
    // Lösung: Spiegel (3,4) rot 0 · Spiegel (4,6) rot 3 · Spiegel (6,2) rot 1 · Prisma (2,3) rot 1 ·
    //   Prisma (4,5) rot 2 · Prisma (3,2) rot 0 · Spiegel (5,3) rot 1
    // Generator mittel-lockvogel, Seed 10102 · Ausbau „mittel“
    name: 'Kristall', grad: 'mittel',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 1, color: 'yellow' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'mirror', x: 2, z: 5, rot: 2, fixed: true },
      { type: 'prism', x: 2, z: 3, rot: 5 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'prism', x: 3, z: 2, rot: 5 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'red' },
    ],
    solution: { '3,4': 0, '4,6': 3, '6,2': 1, '2,3': 1, '4,5': 2, '3,2': 0, '5,3': 1 },
  },
  {
    // Lösung: Prisma (6,3) rot 3 · Spiegel (4,3) rot 1 · Spiegel (6,4) rot 3 · Spiegel (5,4) rot 3 ·
    //   Spiegel (3,4) rot 1 · Prisma (5,0) rot 4 · Spiegel (5,5) rot 1 · Spiegel (6,5) rot 1
    // Generator mittel-falle, Seed 10749 · Ausbau „mittel“
    name: 'Gleichgewicht', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 6, z: 3, rot: 6 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 1, color: 'blue' },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'prism', x: 5, z: 0, rot: 6 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'target', x: 0, z: 3, color: 'red' },
    ],
    solution: { '6,3': 3, '4,3': 1, '6,4': 3, '5,4': 3, '3,4': 1, '5,0': 4, '5,5': 1, '6,5': 1 },
  },
  {
    // Lösung: Prisma (1,2) rot 5 · Spiegel (4,2) rot 3 · Spiegel (4,4) rot 3 · Spiegel (2,4) rot 1 ·
    //   Spiegel (2,0) rot 3 · Spiegel (6,4) rot 1 · Spiegel (5,0) rot 1 · Prisma (4,5) rot 5
    // Wertung 35.5 · 8 drehbar · 4 Ziele · Rateschritte 956 · Profil mittel2/b-4-bunt, Seed 4056924
    name: 'Silberstreif', grad: 'mittel',
    elements: [
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 1, fixed: true },
      { type: 'prism', x: 1, z: 2, rot: 1 },
      { type: 'prism', x: 4, z: 5, rot: 3 },
      { type: 'filter', x: 3, z: 0, color: 'cyan' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 4, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '1,2': 5, '4,2': 3, '4,4': 3, '2,4': 1, '2,0': 3, '6,4': 1, '5,0': 1, '4,5': 5 },
  },
  {
    // Lösung: Spiegel (4,1) rot 1 · Spiegel (4,4) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,1) rot 1 ·
    //   Prisma (4,5) rot 7 · Prisma (5,1) rot 5 · Spiegel (6,5) rot 3 · Spiegel (6,3) rot 1
    // Generator mittel-abzaehlen, Seed 385, Ziel 57,28–58,31 · ersetzt Polarlicht (Austausch „mittel“)
    name: 'Doppelstern', grad: 'mittel',
    elements: [
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'blue' },
      { type: 'target', x: 5, z: 0, color: 'blue' },
    ],
    solution: { '4,1': 1, '4,4': 1, '1,4': 1, '1,1': 1, '4,5': 7, '5,1': 5, '6,5': 3, '6,3': 1 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (3,1) rot 1 · Spiegel (3,4) rot 1 · Spiegel (1,4) rot 3 ·
    //   Prisma (5,1) rot 4 · Spiegel (4,2) rot 2 · Spiegel (5,3) rot 0 · Spiegel (4,4) rot 1 ·
    //   Spiegel (0,4) rot 3
    // Generator schwer-abzaehlen, Seed 10231 · Ausbau „schwer“
    name: 'Steinkreis', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'green' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'prism', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'red' },
    ],
    solution: { '1,1': 3, '3,1': 1, '3,4': 1, '1,4': 3, '5,1': 4, '4,2': 2, '5,3': 0, '4,4': 1, '0,4': 3 },
  },
  {
    // Lösung: Spiegel (5,5) rot 1 · Spiegel (5,2) rot 1 · Spiegel (3,2) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (1,2) rot 7 · Spiegel (2,1) rot 2 · Spiegel (6,5) rot 1 · Spiegel (3,0) rot 1
    // Generator schwer-abzaehlen, Seed 10030 · Ausbau „schwer“
    name: 'Irrgarten', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'cyan' },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'green' },
    ],
    solution: { '5,5': 1, '5,2': 1, '3,2': 1, '3,5': 1, '1,2': 7, '2,1': 2, '6,5': 1, '3,0': 1 },
  },
  {
    // Lösung: Prisma (1,6) rot 6 · Spiegel (3,6) rot 3 · Spiegel (1,1) rot 3 · Spiegel (5,6) rot 0 ·
    //   Spiegel (4,1) rot 1 · Spiegel (2,3) rot 0 · Spiegel (1,0) rot 1
    // Generator schwer-sammelstelle, Seed 10001 · Ausbau „schwer“
    name: 'Observatorium', grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, z: 6, rot: 1 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'cyan' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'target', x: 4, z: 3, color: 'cyan' },
      { type: 'target', x: 0, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 3, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'white' },
    ],
    solution: { '1,6': 6, '3,6': 3, '1,1': 3, '5,6': 0, '4,1': 1, '2,3': 0, '1,0': 1 },
  },
  {
    // Lösung: Spiegel (5,4) rot 0 · Prisma (2,4) rot 7 · Spiegel (2,1) rot 3 · Spiegel (4,2) rot 0 ·
    //   Spiegel (6,4) rot 2 · Spiegel (3,4) rot 3 · Spiegel (5,5) rot 2 · Spiegel (3,1) rot 3 ·
    //   Spiegel (3,0) rot 3
    // Generator schwer-mischziel, Seed 10247 · Ausbau „schwer“
    name: 'Gipfelsturm', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 4, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'blue' },
    ],
    solution: { '5,4': 0, '2,4': 7, '2,1': 3, '4,2': 0, '6,4': 2, '3,4': 3, '5,5': 2, '3,1': 3, '3,0': 3 },
  },
  {
    // Lösung: Spiegel (4,0) rot 3 · Spiegel (0,2) rot 1 · Spiegel (2,3) rot 0 · Prisma (4,3) rot 5 ·
    //   Prisma (1,2) rot 3 · Prisma (3,4) rot 4 · Spiegel (1,6) rot 1
    // Generator schwer-lockvogel, Seed 10060 · Ausbau „schwer“
    name: 'Expedition', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'prism', x: 4, z: 3, rot: 4 },
      { type: 'prism', x: 1, z: 2, rot: 2 },
      { type: 'prism', x: 3, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'target', x: 3, z: 3, color: 'red' },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'mirror', x: 2, z: 6, rot: 3, fixed: true },
    ],
    solution: { '4,0': 3, '0,2': 1, '2,3': 0, '4,3': 5, '1,2': 3, '3,4': 4, '1,6': 1 },
  },
  {
    // Lösung: Prisma (3,1) rot 0 · Prisma (0,5) rot 6 · Spiegel (0,4) rot 3 · Spiegel (4,4) rot 1 ·
    //   Spiegel (4,6) rot 1 · Spiegel (5,6) rot 3 · Spiegel (5,1) rot 3 · Spiegel (6,1) rot 3
    // Generator schwer-sammelstelle, Seed 10076 · Ausbau „schwer“
    name: 'Polarfahrt', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 1, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 1, color: 'cyan' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'prism', x: 0, z: 5, rot: 4 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '3,1': 0, '0,5': 6, '0,4': 3, '4,4': 1, '4,6': 1, '5,6': 3, '5,1': 3, '6,1': 3 },
  },
  {
    // Lösung: Prisma (4,4) rot 2 · Spiegel (6,4) rot 3 · Spiegel (1,2) rot 1 · Prisma (3,2) rot 2 ·
    //   Spiegel (2,3) rot 2 · Spiegel (6,5) rot 2 · Spiegel (4,5) rot 2
    // Generator schwer-sammelstelle, Seed 10121 · Ausbau „schwer“
    name: 'Windjammer', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'target', x: 3, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'prism', x: 3, z: 2, rot: 5 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'blue' },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '4,4': 2, '6,4': 3, '1,2': 1, '3,2': 2, '2,3': 2, '6,5': 2, '4,5': 2 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (1,2) rot 1 · Spiegel (1,5) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (3,1) rot 3 · Spiegel (2,1) rot 1 · Spiegel (1,1) rot 1 · Prisma (4,5) rot 1
    // Generator schwer-abzaehlen, Seed 10140 · Ausbau „schwer“
    name: 'Dreimaster', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'white' },
      { type: 'target', x: 5, z: 2, color: 'red' },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 5, z: 6, color: 'green' },
    ],
    solution: { '3,2': 1, '1,2': 1, '1,5': 1, '3,5': 1, '3,1': 3, '2,1': 1, '1,1': 1, '4,5': 1 },
  },
  {
    // Lösung: Spiegel (4,5) rot 3 · Spiegel (4,1) rot 3 · Spiegel (2,3) rot 1 · Prisma (2,6) rot 1 ·
    //   Spiegel (5,6) rot 3 · Spiegel (1,0) rot 0 · Prisma (2,1) rot 1
    // Generator schwer-mischziel, Seed 10351 · Ausbau „schwer“
    name: 'Weltreise', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'prism', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'prism', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'target', x: 3, z: 3, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'red' },
    ],
    solution: { '4,5': 3, '4,1': 3, '2,3': 1, '2,6': 1, '5,6': 3, '1,0': 0, '2,1': 1 },
  },
  {
    // Lösung: Prisma (2,5) rot 6 · Spiegel (4,3) rot 0 · Spiegel (1,4) rot 2 · Spiegel (2,3) rot 2 ·
    //   Spiegel (0,1) rot 2 · Spiegel (1,0) rot 0 · Spiegel (5,2) rot 0 · Prisma (0,5) rot 6 ·
    //   Spiegel (0,3) rot 2
    // Generator schwer-falle, Seed 10215 · Ausbau „schwer“
    name: 'Segeltörn', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 5, color: 'cyan' },
      { type: 'prism', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
    ],
    solution: { '2,5': 6, '4,3': 0, '1,4': 2, '2,3': 2, '0,1': 2, '1,0': 0, '5,2': 0, '0,5': 6, '0,3': 2 },
  },
  {
    // Lösung: Spiegel (6,5) rot 1 · Spiegel (4,5) rot 1 · Spiegel (4,3) rot 1 · Spiegel (6,3) rot 3 ·
    //   Prisma (3,5) rot 7 · Spiegel (3,2) rot 1 · Prisma (4,2) rot 1 · Spiegel (5,2) rot 3 ·
    //   Spiegel (0,0) rot 3
    // Generator schwer-abzaehlen, Seed 10148 · Ausbau „schwer“
    name: 'Kreuzfahrt', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 1, fixed: true },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 1, color: 'red' },
    ],
    solution: { '6,5': 1, '4,5': 1, '4,3': 1, '6,3': 3, '3,5': 7, '3,2': 1, '4,2': 1, '5,2': 3, '0,0': 3 },
  },
  {
    // Lösung: Prisma (3,2) rot 7 · Spiegel (3,3) rot 1 · Spiegel (3,0) rot 1 · Spiegel (2,0) rot 3 ·
    //   Prisma (1,2) rot 1 · Spiegel (2,1) rot 1 · Spiegel (1,6) rot 1 · Spiegel (4,5) rot 0
    // Generator schwer-sammelstelle, Seed 10329 · Ausbau „schwer“
    name: 'Gambit', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'source', x: 0, z: 5, dir: 7, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 3, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 0 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'target', x: 5, z: 4, color: 'green' },
    ],
    solution: { '3,2': 7, '3,3': 1, '3,0': 1, '2,0': 3, '1,2': 1, '2,1': 1, '1,6': 1, '4,5': 0 },
  },
  {
    // Lösung: Prisma (4,5) rot 4 · Spiegel (5,6) rot 0 · Spiegel (4,4) rot 3 · Prisma (6,1) rot 3 ·
    //   Spiegel (6,3) rot 3 · Spiegel (1,6) rot 0 · Prisma (2,2) rot 7
    // Generator schwer-sammelstelle, Seed 10116 · Ausbau „schwer“
    name: 'Schatzkarte', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 2 },
      { type: 'source', x: 6, z: 5, dir: 3, color: 'blue' },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 3, color: 'white' },
      { type: 'target', x: 1, z: 5, color: 'green' },
      { type: 'source', x: 5, z: 0, dir: 1 },
      { type: 'prism', x: 6, z: 1, rot: 6 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 2, fixed: true },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'target', x: 4, z: 2, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 0, color: 'green' },
    ],
    solution: { '4,5': 4, '5,6': 0, '4,4': 3, '6,1': 3, '6,3': 3, '1,6': 0, '2,2': 7 },
  },
  {
    // Lösung: Spiegel (5,3) rot 1 · Spiegel (3,3) rot 1 · Spiegel (3,6) rot 3 · Spiegel (5,6) rot 1 ·
    //   Prisma (5,1) rot 2 · Prisma (1,3) rot 0 · Spiegel (3,1) rot 0 · Spiegel (2,4) rot 1
    // Generator schwer-abzaehlen, Seed 10276 · Ausbau „schwer“
    name: 'Steilwand', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'cyan' },
      { type: 'target', x: 3, z: 2, color: 'yellow' },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'prism', x: 1, z: 3, rot: 5 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
    ],
    solution: { '5,3': 1, '3,3': 1, '3,6': 3, '5,6': 1, '5,1': 2, '1,3': 0, '3,1': 0, '2,4': 1 },
  },
  {
    // Lösung: Spiegel (3,6) rot 1 · Spiegel (3,2) rot 3 · Spiegel (5,2) rot 3 · Spiegel (5,1) rot 3 ·
    //   Prisma (6,1) rot 7 · Prisma (4,4) rot 1 · Spiegel (4,5) rot 3 · Spiegel (2,5) rot 3
    // Generator schwer-mischziel, Seed 10487 · Ausbau „schwer“
    name: 'Nordwand', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 5, dir: 4, color: 'blue' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'mirror', x: 5, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 5, color: 'white' },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'prism', x: 6, z: 1, rot: 5 },
      { type: 'mirror', x: 6, z: 0, rot: 1, fixed: true },
      { type: 'source', x: 4, z: 0, dir: 2 },
      { type: 'prism', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'red' },
    ],
    solution: { '3,6': 1, '3,2': 3, '5,2': 3, '5,1': 3, '6,1': 7, '4,4': 1, '4,5': 3, '2,5': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 7 · Spiegel (0,4) rot 2 · Spiegel (0,2) rot 2 · Spiegel (1,1) rot 2 ·
    //   Prisma (3,3) rot 4 · Spiegel (2,3) rot 3 · Spiegel (2,5) rot 1 · Spiegel (4,5) rot 3
    // Generator schwer-sammelstelle, Seed 10559 · Ausbau „schwer“
    name: 'Minotaurus', grad: 'schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 1 },
      { type: 'source', x: 6, z: 4, dir: 5, color: 'blue' },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'red' },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 1, color: 'cyan' },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'prism', x: 3, z: 3, rot: 5 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '3,1': 7, '0,4': 2, '0,2': 2, '1,1': 2, '3,3': 4, '2,3': 3, '2,5': 1, '4,5': 3 },
  },
  {
    // Lösung: Spiegel (4,2) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,4) rot 1 · Spiegel (4,4) rot 1 ·
    //   Spiegel (1,0) rot 3 · Spiegel (2,0) rot 1 · Prisma (2,4) rot 1 · Spiegel (2,5) rot 3
    // Generator schwer-abzaehlen, Seed 324, Ziel 59,45–60,41 · ersetzt Unendlichkeit (Austausch „schwer“)
    name: 'Wegweiser', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'prism', x: 2, z: 4, rot: 5 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 5, color: 'blue' },
    ],
    solution: { '4,2': 1, '6,2': 3, '6,4': 1, '4,4': 1, '1,0': 3, '2,0': 1, '2,4': 1, '2,5': 3 },
  },
  {
    // Lösung: Prisma (2,2) rot 0 · Spiegel (4,4) rot 2 · Spiegel (3,1) rot 0 · Spiegel (4,2) rot 0 ·
    //   Spiegel (5,1) rot 2 · Spiegel (2,1) rot 2 · Spiegel (0,1) rot 2 · Prisma (1,0) rot 0
    // Generator schwer-falle, Seed 557, Ziel 58,5–59,28 · ersetzt Rangierbahnhof (Austausch „schwer“)
    name: 'Passstrasse', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 4, z: 0, color: 'yellow' },
      { type: 'blocker', x: 4, z: 1 },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'prism', x: 1, z: 0, rot: 6 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '2,2': 0, '4,4': 2, '3,1': 0, '4,2': 0, '5,1': 2, '2,1': 2, '0,1': 2, '1,0': 0 },
  },
  {
    // Lösung: Spiegel (4,5) rot 1 · Spiegel (4,1) rot 1 · Spiegel (2,1) rot 1 · Spiegel (2,5) rot 1 ·
    //   Prisma (5,5) rot 3 · Spiegel (5,6) rot 1 · Spiegel (4,0) rot 3 · Spiegel (5,0) rot 1
    // Generator schwer-abzaehlen, Seed 10580 · Ausbau „schwer“
    name: 'Kaperfahrt', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'white' },
      { type: 'target', x: 1, z: 5, color: 'blue' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'prism', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
    ],
    solution: { '4,5': 1, '4,1': 1, '2,1': 1, '2,5': 1, '5,5': 3, '5,6': 1, '4,0': 3, '5,0': 1 },
  },
  {
    // Lösung: Prisma (5,6) rot 0 · Spiegel (3,5) rot 0 · Prisma (2,4) rot 4 · Spiegel (0,4) rot 3 ·
    //   Spiegel (0,2) rot 2 · Spiegel (2,0) rot 0 · Spiegel (6,4) rot 2 · Prisma (2,1) rot 1
    // Generator schwer-sammelstelle, Seed 10387 · Ausbau „schwer“
    name: 'Biwak', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 6, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 1, color: 'red' },
      { type: 'target', x: 6, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'prism', x: 2, z: 4, rot: 6 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'target', x: 1, z: 5, color: 'red' },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'prism', x: 2, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 5, color: 'green' },
    ],
    solution: { '5,6': 0, '3,5': 0, '2,4': 4, '0,4': 3, '0,2': 2, '2,0': 0, '6,4': 2, '2,1': 1 },
  },
  {
    // Lösung: Spiegel (5,4) rot 3 · Spiegel (2,4) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,1) rot 3 ·
    //   Prisma (5,5) rot 5 · Spiegel (4,5) rot 3 · Spiegel (6,1) rot 3 · Spiegel (4,6) rot 3 ·
    //   Spiegel (1,6) rot 1
    // Generator schwer-abzaehlen, Seed 10373 · Ausbau „schwer“
    name: 'Pilgerweg', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 5, z: 0, color: 'cyan' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'prism', x: 5, z: 5, rot: 4 },
      { type: 'mirror', x: 4, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'source', x: 6, z: 0, dir: 2 },
      { type: 'target', x: 2, z: 5, color: 'white' },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'blocker', x: 3, z: 3 },
    ],
    solution: { '5,4': 3, '2,4': 3, '2,1': 1, '5,1': 3, '5,5': 5, '4,5': 3, '6,1': 3, '4,6': 3, '1,6': 1 },
  },
  {
    // Lösung: Prisma (5,0) rot 2 · Spiegel (2,0) rot 3 · Spiegel (0,5) rot 2 · Prisma (6,4) rot 1 ·
    //   Prisma (3,4) rot 7 · Prisma (1,2) rot 1 · Spiegel (1,3) rot 3
    // Generator schwer-sammelstelle, Seed 10010 · Ausbau „schwer“
    name: 'Kompassnadel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 0, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'yellow' },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'prism', x: 6, z: 4, rot: 6 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'cyan' },
      { type: 'prism', x: 3, z: 4, rot: 0 },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '5,0': 2, '2,0': 3, '0,5': 2, '6,4': 1, '3,4': 7, '1,2': 1, '1,3': 3 },
  },
  {
    // Lösung: Spiegel (4,5) rot 0 · Prisma (3,4) rot 6 · Spiegel (1,4) rot 3 · Prisma (2,4) rot 6 ·
    //   Spiegel (4,2) rot 2 · Spiegel (2,3) rot 2 · Spiegel (4,1) rot 0
    // Wertung 31.4 · 7 drehbar · 3 Ziele · Rateschritte 399 · Profil mittel2/4-bunt, Seed 3064184
    name: 'Oase', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 5, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'prism', x: 3, z: 4, rot: 0 },
      { type: 'target', x: 3, z: 1, color: 'cyan' },
      { type: 'target', x: 5, z: 2, color: 'magenta' },
      { type: 'target', x: 1, z: 3, color: 'red' },
    ],
    solution: { '4,5': 0, '3,4': 6, '1,4': 3, '2,4': 6, '4,2': 2, '2,3': 2, '4,1': 0 },
  },
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (1,2) rot 1 · Spiegel (6,2) rot 1 · Spiegel (0,4) rot 3 ·
    //   Prisma (4,3) rot 1 · Spiegel (6,5) rot 2 · Prisma (0,6) rot 0 · Spiegel (5,1) rot 2
    // Generator schwer-abschalten, Seed 8, Ziel 59,45–60,41 · ersetzt Sternwarte (Austausch „schwer“)
    name: 'Stabübergabe', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'prism', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 5, z: 3, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'prism', x: 0, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 0, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '4,4': 1, '1,2': 1, '6,2': 1, '0,4': 3, '4,3': 1, '6,5': 2, '0,6': 0, '5,1': 2 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (3,4) rot 2 · Prisma (2,1) rot 7 · Spiegel (4,1) rot 1 ·
    //   Prisma (4,3) rot 6 · Spiegel (4,2) rot 3 · Kombinator (5,2) dir 2
    // Wertung 34.8 · 7 drehbar · 3 Ziele · Rateschritte 762 · Profil 4-bunt, Seed 781
    name: 'Gordischer Knoten', grad: 'schwer',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 2, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'prism', x: 2, z: 1, rot: 3 },
      { type: 'prism', x: 4, z: 3, rot: 2 },
      { type: 'combiner', x: 5, z: 2, dir: 5 },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 5, z: 3, color: 'cyan' },
    ],
    solution: { '1,1': 3, '3,4': 2, '2,1': 7, '4,1': 1, '4,3': 6, '4,2': 3, '5,2': 2 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (3,6) rot 1 · Spiegel (1,6) rot 3 · Spiegel (1,2) rot 1 ·
    //   Prisma (4,4) rot 1 · Spiegel (5,5) rot 0 · Spiegel (6,4) rot 2 · Prisma (4,2) rot 5 ·
    //   Spiegel (4,1) rot 3 · Spiegel (5,1) rot 3
    // Generator schwer-abzaehlen, Seed 20367, Ziel 72–86 · Ausbau „schwer“
    name: 'Seekarte', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'red' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'target', x: 4, z: 6, color: 'white' },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'source', x: 0, z: 0, dir: 1, color: 'cyan' },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'prism', x: 4, z: 2, rot: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '3,2': 1, '3,6': 1, '1,6': 3, '1,2': 1, '4,4': 1, '5,5': 0, '6,4': 2, '4,2': 5, '4,1': 3, '5,1': 3 },
  },
  {
    // Lösung: Spiegel (3,3) rot 1 · Spiegel (4,3) rot 1 · Spiegel (6,1) rot 1 · Spiegel (6,4) rot 3 ·
    //   Spiegel (1,5) rot 1 · Prisma (2,5) rot 1 · Prisma (4,0) rot 1 · Spiegel (5,3) rot 3 ·
    //   Spiegel (5,0) rot 3
    // Generator schwer-mischziel, Seed 20440, Ziel 72–86 · Ausbau „schwer“
    name: 'Springergabel', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 4, color: 'white' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'prism', x: 2, z: 5, rot: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 4, z: 5, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 3, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 7 },
      { type: 'prism', x: 4, z: 0, rot: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '3,3': 1, '4,3': 1, '6,1': 1, '6,4': 3, '1,5': 1, '2,5': 1, '4,0': 1, '5,3': 3, '5,0': 3 },
  },
  {
    // Lösung: Spiegel (3,0) rot 3 · Spiegel (5,4) rot 1 · Spiegel (0,5) rot 1 · Spiegel (6,3) rot 3 ·
    //   Prisma (6,1) rot 6 · Prisma (0,4) rot 7 · Spiegel (5,6) rot 3 · Spiegel (2,2) rot 2 ·
    //   Spiegel (1,1) rot 2 · Spiegel (4,6) rot 1
    // Generator schwer-mischziel, Seed 20548, Ziel 72–86 · Ausbau „schwer“
    name: 'Planetarium', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'white' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'prism', x: 6, z: 1, rot: 4 },
      { type: 'prism', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'target', x: 4, z: 1, color: 'blue' },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '3,0': 3, '5,4': 1, '0,5': 1, '6,3': 3, '6,1': 6, '0,4': 7, '5,6': 3, '2,2': 2, '1,1': 2, '4,6': 1 },
  },
  {
    // Lösung: Spiegel (3,4) rot 3 · Prisma (0,4) rot 5 · Spiegel (0,1) rot 3 · Spiegel (1,0) rot 3 ·
    //   Spiegel (6,0) rot 1 · Spiegel (6,2) rot 3 · Spiegel (5,2) rot 3 · Spiegel (4,1) rot 1 ·
    //   Spiegel (1,4) rot 1 · Spiegel (5,3) rot 1 · Spiegel (5,6) rot 1
    // Generator schwer-mischziel, Seed 20905, Ziel 72–86 · Ausbau „schwer“
    name: 'Leuchtfeuer', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'yellow' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'magenta' },
      { type: 'prism', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'target', x: 6, z: 3, color: 'blue' },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '3,4': 3, '0,4': 5, '0,1': 3, '1,0': 3, '6,0': 1, '6,2': 3, '5,2': 3, '4,1': 1, '1,4': 1, '5,3': 1, '5,6': 1 },
  },
  {
    // Lösung: Prisma (2,4) rot 6 · Prisma (4,1) rot 4 · Spiegel (1,1) rot 1 · Spiegel (1,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (3,2) rot 2 · Spiegel (5,4) rot 0 · Prisma (4,0) rot 5
    // Generator schwer-sammelstelle, Seed 20667, Ziel 72–86 · Ausbau „schwer“
    name: 'Rätselturm', grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, z: 4, rot: 5 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'green' },
      { type: 'target', x: 0, z: 2, color: 'yellow' },
      { type: 'target', x: 2, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'source', x: 0, z: 4, dir: 7, color: 'magenta' },
      { type: 'prism', x: 4, z: 0, rot: 0 },
    ],
    solution: { '2,4': 6, '4,1': 4, '1,1': 1, '1,0': 1, '0,0': 3, '3,2': 2, '5,4': 0, '4,0': 5 },
  },
  {
    // Lösung: Prisma (4,3) rot 0 · Prisma (3,1) rot 2 · Spiegel (3,5) rot 3 · Spiegel (1,3) rot 0 ·
    //   Spiegel (3,6) rot 3 · Prisma (2,6) rot 5 · Spiegel (2,5) rot 1 · Spiegel (2,4) rot 3
    // Generator schwer-sammelstelle, Seed 10089 · Ausbau „schwer“
    name: 'Zauberwürfel', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 3 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'target', x: 5, z: 3, color: 'yellow' },
      { type: 'target', x: 6, z: 1, color: 'yellow' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '4,3': 0, '3,1': 2, '3,5': 3, '1,3': 0, '3,6': 3, '2,6': 5, '2,5': 1, '2,4': 3 },
  },
  {
    // Lösung: Spiegel (2,0) rot 1 · Spiegel (1,4) rot 3 · Spiegel (3,4) rot 2 · Spiegel (2,5) rot 2 ·
    //   Prisma (4,2) rot 2 · Spiegel (4,5) rot 0 · Prisma (5,2) rot 3 · Prisma (5,6) rot 3
    // Generator schwer-mischziel, Seed 79, Ziel 66,03–70,98 · ersetzt Kristallpalast (Austausch „schwer“)
    name: 'Mäander', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'target', x: 2, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 5, z: 4, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 4, z: 2, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'prism', x: 5, z: 2, rot: 2 },
      { type: 'prism', x: 5, z: 6, rot: 6 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,0': 1, '1,4': 3, '3,4': 2, '2,5': 2, '4,2': 2, '4,5': 0, '5,2': 3, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (0,5) rot 3 · Spiegel (2,5) rot 1 · Spiegel (2,2) rot 1 · Spiegel (0,2) rot 1 ·
    //   Prisma (3,4) rot 7 · Spiegel (3,0) rot 3 · Spiegel (6,0) rot 1 · Spiegel (6,3) rot 3 ·
    //   Spiegel (1,3) rot 3 · Spiegel (4,4) rot 3 · Spiegel (4,1) rot 1
    // Generator schwer-abzaehlen, Seed 20656, Ziel 72–86 · Ausbau „schwer“
    name: 'Basislager', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'source', x: 0, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'target', x: 5, z: 2, color: 'cyan' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 0, z: 0, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'prism', x: 3, z: 4, rot: 4 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'target', x: 1, z: 1, color: 'blue' },
    ],
    solution: { '0,5': 3, '2,5': 1, '2,2': 1, '0,2': 1, '3,4': 7, '3,0': 3, '6,0': 1, '6,3': 3, '1,3': 3, '4,4': 3, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (4,2) rot 3 · Spiegel (1,2) rot 1 · Spiegel (1,4) rot 3 · Spiegel (4,4) rot 3 ·
    //   Prisma (3,3) rot 5 · Spiegel (3,1) rot 1 · Prisma (5,4) rot 5 · Spiegel (5,1) rot 3 ·
    //   Spiegel (6,1) rot 1 · Spiegel (6,2) rot 3
    // Generator schwer-abzaehlen, Seed 10157 · Ausbau „schwer“
    name: 'Sphinx', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'white' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'prism', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'prism', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '4,2': 3, '1,2': 1, '1,4': 3, '4,4': 3, '3,3': 5, '3,1': 1, '5,4': 5, '5,1': 3, '6,1': 1, '6,2': 3 },
  },
  {
    // Lösung: Prisma (1,1) rot 2 · Spiegel (4,1) rot 1 · Spiegel (1,0) rot 1 · Spiegel (2,4) rot 0 ·
    //   Spiegel (2,3) rot 2 · Spiegel (1,4) rot 0 · Prisma (0,3) rot 7 · Prisma (3,5) rot 7 ·
    //   Spiegel (5,3) rot 0
    // Generator schwer-sammelstelle, Seed 20876, Ziel 72–86 · Ausbau „schwer“
    name: 'Spieluhr', grad: 'schwer',
    elements: [
      { type: 'prism', x: 1, z: 1, rot: 7 },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'prism', x: 0, z: 3, rot: 0 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'target', x: 3, z: 2, color: 'red' },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 3, z: 0, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '1,1': 2, '4,1': 1, '1,0': 1, '2,4': 0, '2,3': 2, '1,4': 0, '0,3': 7, '3,5': 7, '5,3': 0 },
  },
  {
    // Lösung: Spiegel (2,1) rot 1 · Spiegel (1,4) rot 1 · Prisma (4,3) rot 5 · Spiegel (0,5) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Spiegel (4,2) rot 3 · Spiegel (4,0) rot 1 ·
    //   Spiegel (3,0) rot 3 · Spiegel (6,2) rot 3 · Spiegel (6,1) rot 1
    // Generator schwer-mischziel, Seed 20904, Ziel 72–86 · Ausbau „schwer“
    name: 'Automaton', grad: 'schwer',
    elements: [
      { type: 'source', x: 2, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'target', x: 1, z: 1, color: 'white' },
      { type: 'source', x: 1, z: 6, dir: 7, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
    ],
    solution: { '2,1': 1, '1,4': 1, '4,3': 5, '0,5': 1, '5,5': 1, '5,6': 3, '4,2': 3, '4,0': 1, '3,0': 3, '6,2': 3, '6,1': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (1,4) rot 1 · Spiegel (4,1) rot 3 · Spiegel (2,2) rot 1 ·
    //   Prisma (1,2) rot 4 · Spiegel (0,2) rot 3 · Spiegel (0,3) rot 1 · Spiegel (5,3) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (4,0) rot 1 · Spiegel (3,0) rot 3
    // Generator schwer-mischziel, Seed 20986, Ziel 72–86 · Ausbau „schwer“
    name: 'Puzzlestück', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 1, z: 5, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'green' },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'blocker', x: 4, z: 4 },
    ],
    solution: { '3,5': 1, '1,4': 1, '4,1': 3, '2,2': 1, '1,2': 4, '0,2': 3, '0,3': 1, '5,3': 1, '5,5': 1, '4,0': 1, '3,0': 3 },
  },
  {
    // Lösung: Prisma (2,4) rot 2 · Spiegel (4,2) rot 0 · Spiegel (1,4) rot 1 · Prisma (5,2) rot 2 ·
    //   Spiegel (5,6) rot 1 · Spiegel (1,5) rot 0 · Prisma (3,6) rot 0 · Spiegel (6,6) rot 3 ·
    //   Spiegel (6,3) rot 2
    // Generator schwer-sammelstelle, Seed 20294, Ziel 75–86 · Ausbau „schwer“
    name: 'Kopfnuss', grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, z: 4, rot: 6 },
      { type: 'source', x: 6, z: 4, dir: 5, color: 'cyan' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'target', x: 4, z: 6, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'filter', x: 3, z: 1, color: 'cyan' },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '2,4': 2, '4,2': 0, '1,4': 1, '5,2': 2, '5,6': 1, '1,5': 0, '3,6': 0, '6,6': 3, '6,3': 2 },
  },
  {
    // Lösung: Prisma (4,3) rot 3 · Spiegel (4,5) rot 1 · Spiegel (3,3) rot 3 · Spiegel (3,4) rot 3 ·
    //   Prisma (4,2) rot 5 · Prisma (3,1) rot 6 · Spiegel (4,0) rot 0 · Spiegel (1,6) rot 1 ·
    //   Spiegel (2,6) rot 3
    // Generator schwer-falle, Seed 20316, Ziel 72–86 · Ausbau „schwer“
    name: 'Taschenuhr', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'source', x: 0, z: 4, dir: 7, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 5 },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'prism', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 2, z: 4, color: 'magenta' },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'target', x: 3, z: 0, color: 'green' },
    ],
    solution: { '4,3': 3, '4,5': 1, '3,3': 3, '3,4': 3, '4,2': 5, '3,1': 6, '4,0': 0, '1,6': 1, '2,6': 3 },
  },
  {
    // Lösung: Spiegel (0,1) rot 1 · Spiegel (2,1) rot 1 · Spiegel (2,3) rot 1 · Spiegel (0,3) rot 3 ·
    //   Spiegel (5,4) rot 1 · Spiegel (6,4) rot 1 · Spiegel (6,5) rot 3 · Prisma (4,1) rot 5 ·
    //   Prisma (2,4) rot 7 · Spiegel (5,6) rot 3
    // Generator schwer-abzaehlen, Seed 20281, Ziel 75–86 · Ausbau „schwer“
    name: 'Sanduhr', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 0, z: 5, color: 'magenta' },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'yellow' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'prism', x: 4, z: 1, rot: 2 },
      { type: 'prism', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 2, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'green' },
    ],
    solution: { '0,1': 1, '2,1': 1, '2,3': 1, '0,3': 3, '5,4': 1, '6,4': 1, '6,5': 3, '4,1': 5, '2,4': 7, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (4,4) rot 1 · Spiegel (3,3) rot 3 · Spiegel (1,4) rot 1 · Spiegel (3,0) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (5,6) rot 3 · Prisma (4,0) rot 2 · Spiegel (0,4) rot 2 ·
    //   Spiegel (6,1) rot 1 · Spiegel (6,3) rot 3
    // Generator schwer-mischziel, Seed 20081, Ziel 75–86 · Ausbau „schwer“
    name: 'Räderwerk', grad: 'schwer',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 4, z: 1, color: 'white' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'filter', x: 3, z: 5, color: 'red' },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'target', x: 4, z: 5, color: 'red' },
    ],
    solution: { '4,4': 1, '3,3': 3, '1,4': 1, '3,0': 3, '3,6': 1, '5,6': 3, '4,0': 2, '0,4': 2, '6,1': 1, '6,3': 3 },
  },
  {
    // Lösung: Prisma (4,3) rot 4 · Spiegel (6,1) rot 2 · Spiegel (2,5) rot 0 · Spiegel (0,3) rot 2 ·
    //   Spiegel (4,4) rot 0 · Spiegel (5,5) rot 2 · Spiegel (4,6) rot 0 · Prisma (5,1) rot 1 ·
    //   Spiegel (5,4) rot 1
    // Generator schwer-sammelstelle, Seed 20504, Ziel 72–86 · Ausbau „schwer“
    name: 'Denksport', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 3, rot: 6 },
      { type: 'source', x: 5, z: 0, dir: 1, color: 'blue' },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'target', x: 1, z: 3, color: 'cyan' },
      { type: 'mirror', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'source', x: 2, z: 6, dir: 7, color: 'blue' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 5, z: 1, rot: 4 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2, fixed: true },
      { type: 'mirror', x: 2, z: 2, rot: 2, fixed: true },
      { type: 'target', x: 3, z: 1, color: 'green' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '4,3': 4, '6,1': 2, '2,5': 0, '0,3': 2, '4,4': 0, '5,5': 2, '4,6': 0, '5,1': 1, '5,4': 1 },
  },
  {
    // Lösung: Prisma (2,1) rot 1 · Prisma (5,1) rot 4 · Prisma (2,4) rot 7 · Spiegel (4,2) rot 0 ·
    //   Spiegel (5,3) rot 2 · Spiegel (3,5) rot 2 · Spiegel (2,2) rot 1 · Spiegel (1,2) rot 3
    // Generator schwer-sammelstelle, Seed 10237 · Ausbau „schwer“
    name: 'Ariadnefaden', grad: 'schwer',
    elements: [
      { type: 'prism', x: 2, z: 1, rot: 4 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'green' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'target', x: 5, z: 4, color: 'cyan' },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'source', x: 6, z: 2, dir: 5 },
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 1 },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'target', x: 4, z: 6, color: 'yellow' },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
    ],
    solution: { '2,1': 1, '5,1': 4, '2,4': 7, '4,2': 0, '5,3': 2, '3,5': 2, '2,2': 1, '1,2': 3 },
  },
  {
    // Lösung: Prisma (0,4) rot 1 · Spiegel (2,4) rot 3 · Spiegel (0,5) rot 1 · Prisma (4,3) rot 2 ·
    //   Spiegel (6,5) rot 1 · Spiegel (1,1) rot 3 · Spiegel (5,4) rot 0 · Spiegel (6,1) rot 3 ·
    //   Spiegel (4,4) rot 3 · Spiegel (2,6) rot 1 · Spiegel (6,0) rot 1
    // Generator schwer-falle, Seed 20844, Ziel 72–86 · Ausbau „schwer“
    name: 'Schatztruhe', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 0, z: 4, rot: 4 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 1, fixed: true },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'blue' },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'yellow' },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 3, z: 0, color: 'magenta' },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 6, color: 'green' },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
    ],
    solution: { '0,4': 1, '2,4': 3, '0,5': 1, '4,3': 2, '6,5': 1, '1,1': 3, '5,4': 0, '6,1': 3, '4,4': 3, '2,6': 1, '6,0': 1 },
  },
  {
    // Lösung: Spiegel (1,4) rot 1 · Spiegel (0,4) rot 3 · Spiegel (4,1) rot 3 · Spiegel (5,1) rot 1 ·
    //   Spiegel (5,3) rot 1 · Prisma (4,0) rot 5 · Prisma (6,3) rot 2 · Spiegel (2,0) rot 3 ·
    //   Spiegel (6,4) rot 3 · Spiegel (1,3) rot 3 · Spiegel (5,6) rot 1
    // Generator schwer-mischziel, Seed 20840, Ziel 72–86 · Ausbau „schwer“
    name: 'Lotsenboot', grad: 'schwer',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 0, z: 5, color: 'white' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'prism', x: 4, z: 0, rot: 3 },
      { type: 'prism', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '1,4': 1, '0,4': 3, '4,1': 3, '5,1': 1, '5,3': 1, '4,0': 5, '6,3': 2, '2,0': 3, '6,4': 3, '1,3': 3, '5,6': 1 },
  },
  {
    // Lösung: Spiegel (5,6) rot 1 · Spiegel (3,3) rot 3 · Spiegel (5,5) rot 1 · Prisma (2,3) rot 5 ·
    //   Spiegel (2,1) rot 1 · Spiegel (1,3) rot 1 · Spiegel (1,2) rot 3 · Prisma (3,1) rot 3 ·
    //   Prisma (4,5) rot 4 · Spiegel (3,5) rot 3
    // Wertung 44.3 · 10 drehbar · 4 Ziele · Rateschritte 8031 · gehärtet aus Profil 4-prisma, Seed 3007
    name: 'Fata Morgana', grad: 'schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'prism', x: 2, z: 3, rot: 7 },
      { type: 'prism', x: 4, z: 5, rot: 6 },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 5, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
    ],
    solution: { '5,6': 1, '3,3': 3, '5,5': 1, '2,3': 5, '2,1': 1, '1,3': 1, '1,2': 3, '3,1': 3, '4,5': 4, '3,5': 3 },
  },
  {
    // Lösung: Spiegel (3,3) rot 3 · Spiegel (3,1) rot 1 · Spiegel (1,1) rot 1 · Spiegel (1,3) rot 3 ·
    //   Prisma (6,5) rot 2 · Prisma (5,3) rot 5 · Spiegel (1,0) rot 1 · Spiegel (1,5) rot 1 ·
    //   Spiegel (5,2) rot 1 · Spiegel (6,6) rot 3
    // Generator schwer-abzaehlen, Seed 20107, Ziel 75–86 · Ausbau „schwer“
    name: 'Zugbrücke', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 0, z: 3, color: 'white' },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'prism', x: 6, z: 5, rot: 1 },
      { type: 'prism', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'target', x: 2, z: 2, color: 'blue' },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
    ],
    solution: { '3,3': 3, '3,1': 1, '1,1': 1, '1,3': 3, '6,5': 2, '5,3': 5, '1,0': 1, '1,5': 1, '5,2': 1, '6,6': 3 },
  },
  {
    // Lösung: Prisma (4,0) rot 1 · Spiegel (4,2) rot 3 · Spiegel (5,0) rot 1 · Spiegel (5,1) rot 1 ·
    //   Spiegel (1,3) rot 1 · Prisma (1,4) rot 1 · Spiegel (6,4) rot 3 · Spiegel (6,2) rot 1 ·
    //   Spiegel (5,5) rot 3 · Spiegel (6,1) rot 3
    // Generator schwer-falle, Seed 559, Ziel 70,98–75,57 · ersetzt Irrlicht (Austausch „schwer“)
    name: 'Abkürzung', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'prism', x: 4, z: 0, rot: 5 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 1, z: 1, color: 'white' },
    ],
    solution: { '4,0': 1, '4,2': 3, '5,0': 1, '5,1': 1, '1,3': 1, '1,4': 1, '6,4': 3, '6,2': 1, '5,5': 3, '6,1': 3 },
  },
  {
    // Lösung: Spiegel (4,2) rot 3 · Spiegel (4,1) rot 1 · Spiegel (2,6) rot 3 · Spiegel (2,2) rot 1 ·
    //   Spiegel (1,2) rot 3 · Spiegel (1,1) rot 3 · Prisma (2,1) rot 0 · Prisma (1,4) rot 3 ·
    //   Kombinator (3,2) dir 1 · Prisma (1,6) rot 0
    // Wertung 47.8 · 10 drehbar · 4 Ziele · Rateschritte 16396 · gehärtet aus Profil 4-farbe, Seed 3057
    name: 'Rosette', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 1, rot: 7 },
      { type: 'prism', x: 1, z: 4, rot: 7 },
      { type: 'prism', x: 1, z: 6, rot: 4 },
      { type: 'filter', x: 2, z: 5, color: 'yellow' },
      { type: 'combiner', x: 3, z: 2, dir: 6 },
      { type: 'target', x: 3, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 4, z: 3, color: 'white' },
      { type: 'target', x: 0, z: 5, color: 'green' },
    ],
    solution: { '4,2': 3, '4,1': 1, '2,6': 3, '2,2': 1, '1,2': 3, '1,1': 3, '2,1': 0, '1,4': 3, '3,2': 1, '1,6': 0 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Prisma (5,4) rot 5 · Spiegel (2,4) rot 3 · Spiegel (2,5) rot 1 ·
    //   Spiegel (5,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 · Prisma (1,0) rot 1 ·
    //   Spiegel (3,5) rot 1 · Spiegel (3,6) rot 3
    // Generator schwer-mischziel, Seed 20113, Ziel 75–86 · Ausbau „schwer“
    name: 'Jakobsweg', grad: 'schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'target', x: 4, z: 1, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'prism', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 4, z: 0, color: 'magenta' },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'prism', x: 1, z: 0, rot: 5 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'red' },
    ],
    solution: { '1,1': 3, '5,4': 5, '2,4': 3, '2,5': 1, '5,1': 3, '6,1': 3, '6,0': 1, '1,0': 1, '3,5': 1, '3,6': 3 },
  },
  {
    // Lösung: Prisma (5,4) rot 0 · Spiegel (2,1) rot 3 · Prisma (4,2) rot 2 · Spiegel (4,3) rot 1 ·
    //   Spiegel (6,3) rot 3 · Spiegel (2,6) rot 0 · Spiegel (0,3) rot 1 · Spiegel (4,6) rot 1 ·
    //   Prisma (6,6) rot 6
    // Generator schwer-sammelstelle, Seed 20095, Ziel 75–86 · Ausbau „schwer“
    name: 'Gebirgspfad', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 4 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'source', x: 3, z: 6, dir: 7, color: 'green' },
      { type: 'target', x: 6, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 5, rot: 2, fixed: true },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 2, color: 'cyan' },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'prism', x: 6, z: 6, rot: 4 },
      { type: 'target', x: 0, z: 0, color: 'red' },
    ],
    solution: { '5,4': 0, '2,1': 3, '4,2': 2, '4,3': 1, '6,3': 3, '2,6': 0, '0,3': 1, '4,6': 1, '6,6': 6 },
  },
  {
    // Lösung: Prisma (4,5) rot 3 · Spiegel (4,3) rot 3 · Prisma (5,2) rot 6 · Spiegel (3,0) rot 0 ·
    //   Prisma (5,1) rot 5 · Spiegel (3,1) rot 3 · Spiegel (4,6) rot 1 · Spiegel (5,0) rot 1 ·
    //   Kombinator (4,0) dir 2
    // Generator schwer-sammelstelle, Seed 20172, Ziel 75–86 · Ausbau „schwer“
    name: 'Kalenderstein', grad: 'schwer',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 5 },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 2, z: 5, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'prism', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 0, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'source', x: 0, z: 6, dir: 7 },
      { type: 'prism', x: 5, z: 1, rot: 4 },
      { type: 'mirror', x: 3, z: 1, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'target', x: 6, z: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'combiner', x: 4, z: 0, dir: 0 },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
    ],
    solution: { '4,5': 3, '4,3': 3, '5,2': 6, '3,0': 0, '5,1': 5, '3,1': 3, '4,6': 1, '5,0': 1, '4,0': 2 },
  },
  {
    // Lösung: Spiegel (4,6) rot 1 · Spiegel (1,5) rot 3 · Spiegel (1,2) rot 3 · Prisma (4,3) rot 6 ·
    //   Spiegel (4,2) rot 3 · Spiegel (1,4) rot 1 · Spiegel (5,2) rot 3 · Prisma (4,5) rot 6 ·
    //   Prisma (5,4) rot 4 · Kombinator (3,4) dir 4 · Spiegel (3,2) rot 3
    // Wertung 52.4 · 11 drehbar · 3 Ziele · Rateschritte 65481 · gehärtet aus Profil 4-filter, Seed 6008
    name: 'Spiegelsaal', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'prism', x: 4, z: 5, rot: 2 },
      { type: 'filter', x: 4, z: 4, color: 'green' },
      { type: 'combiner', x: 3, z: 4, dir: 7 },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'target', x: 3, z: 1, color: 'yellow' },
      { type: 'target', x: 0, z: 4, color: 'white' },
    ],
    solution: { '4,6': 1, '1,5': 3, '1,2': 3, '4,3': 6, '4,2': 3, '1,4': 1, '5,2': 3, '4,5': 6, '5,4': 4, '3,4': 4, '3,2': 3 },
  },
  {
    // Lösung: Spiegel (5,4) rot 1 · Spiegel (1,3) rot 1 · Prisma (1,5) rot 1 · Spiegel (6,1) rot 2 ·
    //   Spiegel (2,6) rot 0 · Spiegel (5,0) rot 0 · Prisma (4,1) rot 5 · Spiegel (4,0) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Spiegel (3,0) rot 3
    // Generator schwer-mischziel, Seed 21131, Ziel 72–86 · Ausbau „schwer“
    name: 'Höhenweg', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 5, z: 3, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 1 },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'prism', x: 4, z: 1, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
    ],
    solution: { '5,4': 1, '1,3': 1, '1,5': 1, '6,1': 2, '2,6': 0, '5,0': 0, '4,1': 5, '4,0': 1, '5,5': 1, '5,6': 3, '3,0': 3 },
  },
  {
    // Lösung: Prisma (2,4) rot 0 · Spiegel (4,2) rot 2 · Spiegel (3,5) rot 0 · Spiegel (4,4) rot 0 ·
    //   Spiegel (1,2) rot 3 · Spiegel (0,2) rot 3 · Spiegel (5,5) rot 0 · Prisma (0,3) rot 1 ·
    //   Spiegel (6,4) rot 2 · Prisma (6,6) rot 3 · Spiegel (6,0) rot 1
    // Generator schwer-falle, Seed 20941, Ziel 72–86 · Ausbau „schwer“
    name: 'Ankerplatz', grad: 'schwer',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 6 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'source', x: 4, z: 6, dir: 7 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'magenta' },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'prism', x: 0, z: 3, rot: 7 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
      { type: 'prism', x: 6, z: 6, rot: 5 },
      { type: 'mirror', x: 5, z: 1, rot: 2, fixed: true },
      { type: 'mirror', x: 6, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 5, z: 6, color: 'blue' },
      { type: 'target', x: 4, z: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'blocker', x: 3, z: 2 },
    ],
    solution: { '2,4': 0, '4,2': 2, '3,5': 0, '4,4': 0, '1,2': 3, '0,2': 3, '5,5': 0, '0,3': 1, '6,4': 2, '6,6': 3, '6,0': 1 },
  },
  {
    // Lösung: Prisma (5,5) rot 0 · Spiegel (5,4) rot 1 · Spiegel (3,2) rot 0 · Prisma (2,1) rot 7 ·
    //   Spiegel (5,1) rot 1 · Spiegel (2,0) rot 1 · Spiegel (0,0) rot 3 · Spiegel (0,3) rot 1 ·
    //   Prisma (2,6) rot 5 · Spiegel (1,6) rot 1
    // Generator schwer-sammelstelle, Seed 21101, Ziel 72–86 · Ausbau „schwer“
    name: 'Hafeneinfahrt', grad: 'schwer',
    elements: [
      { type: 'prism', x: 5, z: 5, rot: 4 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 4, z: 6, dir: 7, color: 'yellow' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'prism', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'target', x: 2, z: 3, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 3, color: 'magenta' },
      { type: 'prism', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 2 },
      { type: 'target', x: 1, z: 2, color: 'red' },
    ],
    solution: { '5,5': 0, '5,4': 1, '3,2': 0, '2,1': 7, '5,1': 1, '2,0': 1, '0,0': 3, '0,3': 1, '2,6': 5, '1,6': 1 },
  },
  {
    // Lösung: Prisma (5,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (5,4) rot 3 · Spiegel (4,4) rot 3 ·
    //   Prisma (2,5) rot 6 · Spiegel (2,3) rot 1 · Spiegel (0,3) rot 3 · Spiegel (1,2) rot 3 ·
    //   Spiegel (2,2) rot 3 · Spiegel (6,2) rot 1
    // Generator schwer-falle, Seed 194, Ziel 75,76–81,58 · ersetzt Sternbild (Austausch „schwer“)
    name: 'Seeschlange', grad: 'schwer',
    elements: [
      { type: 'source', x: 5, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 5, z: 3, rot: 6 },
      { type: 'mirror', x: 3, z: 3, rot: 3 },
      { type: 'target', x: 3, z: 1, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'filter', x: 1, z: 5, color: 'blue' },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '5,3': 3, '3,3': 1, '5,4': 3, '4,4': 3, '2,5': 6, '2,3': 1, '0,3': 3, '1,2': 3, '2,2': 3, '6,2': 1 },
  },
  {
    // Lösung: Spiegel (1,2) rot 3 · Spiegel (1,5) rot 3 · Spiegel (3,5) rot 1 · Spiegel (3,2) rot 3 ·
    //   Spiegel (5,3) rot 3 · Spiegel (5,1) rot 1 · Prisma (5,5) rot 5 · Spiegel (6,3) rot 1 ·
    //   Spiegel (0,4) rot 3 · Spiegel (0,5) rot 1 · Spiegel (3,0) rot 1
    // Generator schwer-abzaehlen, Seed 261, Ziel 75,76–81,58 · ersetzt Leuchtturm (Austausch „schwer“)
    name: 'Odyssee', grad: 'schwer',
    elements: [
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'target', x: 4, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'yellow' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
    ],
    solution: { '1,2': 3, '1,5': 3, '3,5': 1, '3,2': 3, '5,3': 3, '5,1': 1, '5,5': 5, '6,3': 1, '0,4': 3, '0,5': 1, '3,0': 1 },
  },
  {
    // Lösung: Prisma (4,3) rot 3 · Spiegel (4,5) rot 1 · Spiegel (3,3) rot 3 · Spiegel (3,4) rot 3 ·
    //   Spiegel (4,2) rot 3 · Spiegel (4,1) rot 1 · Spiegel (4,0) rot 3 · Spiegel (0,4) rot 1 ·
    //   Prisma (3,0) rot 5 · Spiegel (1,0) rot 3 · Spiegel (1,3) rot 1
    // Generator schwer-falle, Seed 409, Ziel 75,76–81,58 · ersetzt Glasperlenspiel (Austausch „schwer“)
    name: 'Maskerade', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'mirror', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'filter', x: 5, z: 0, color: 'magenta' },
      { type: 'target', x: 6, z: 0, color: 'magenta' },
      { type: 'prism', x: 3, z: 0, rot: 4 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '4,3': 3, '4,5': 1, '3,3': 3, '3,4': 3, '4,2': 3, '4,1': 1, '4,0': 3, '0,4': 1, '3,0': 5, '1,0': 3, '1,3': 1 },
  },
  {
    // Lösung: Spiegel (3,3) rot 1 · Spiegel (5,5) rot 1 · Spiegel (5,2) rot 3 · Prisma (3,4) rot 4 ·
    //   Prisma (3,2) rot 7 · Prisma (4,3) rot 3 · Prisma (3,5) rot 6 · Spiegel (1,3) rot 0 ·
    //   Spiegel (5,1) rot 1 · Prisma (5,4) rot 7
    // Wertung 53.6 · 10 drehbar · 4 Ziele · Rateschritte 76094 · gehärtet aus Profil 3-spiegel, Seed 6024
    name: 'Halo', grad: 'schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 6, z: 5, dir: 4 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
      { type: 'prism', x: 3, z: 2, rot: 4 },
      { type: 'prism', x: 4, z: 3, rot: 2 },
      { type: 'prism', x: 3, z: 4, rot: 2 },
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'prism', x: 3, z: 5, rot: 0 },
      { type: 'blocker', x: 1, z: 2 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'target', x: 4, z: 5, color: 'red' },
    ],
    solution: { '3,3': 1, '5,5': 1, '5,2': 3, '3,4': 4, '3,2': 7, '4,3': 3, '3,5': 6, '1,3': 0, '5,1': 1, '5,4': 7 },
  },
  {
    // Lösung: Spiegel (2,5) rot 3 · Prisma (3,6) rot 1 · Spiegel (2,3) rot 3 · Prisma (2,4) rot 6 ·
    //   Prisma (3,2) rot 3 · Spiegel (2,2) rot 3 · Prisma (1,5) rot 0 · Prisma (4,5) rot 5 ·
    //   Spiegel (4,4) rot 1
    // Wertung 53.4 · 9 drehbar · 4 Ziele · Rateschritte 84811 · gehärtet aus Profil 3-bunt, Seed 7013
    name: 'Sternenstaub', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 5, rot: 2 },
      { type: 'prism', x: 3, z: 2, rot: 6 },
      { type: 'prism', x: 2, z: 4, rot: 4 },
      { type: 'prism', x: 1, z: 5, rot: 4 },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'prism', x: 3, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'blue' },
      { type: 'target', x: 1, z: 3, color: 'magenta' },
      { type: 'target', x: 2, z: 6, color: 'magenta' },
      { type: 'target', x: 4, z: 6, color: 'red' },
    ],
    solution: { '2,5': 3, '3,6': 1, '2,3': 3, '2,4': 6, '3,2': 3, '2,2': 3, '1,5': 0, '4,5': 5, '4,4': 1 },
  },
  {
    // Lösung: Prisma (1,3) rot 7 · Spiegel (3,5) rot 1 · Prisma (3,6) rot 1 · Spiegel (4,6) rot 3 ·
    //   Spiegel (6,5) rot 3 · Spiegel (3,4) rot 1 · Spiegel (2,4) rot 3 · Spiegel (1,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (0,2) rot 1
    // Generator sehr schwer-sammelstelle, Seed 12035 · Ausbau „sehr schwer“
    name: 'Kapella', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 3, rot: 6 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 0, z: 4, dir: 7, color: 'magenta' },
      { type: 'target', x: 2, z: 2, color: 'yellow' },
      { type: 'target', x: 4, z: 3, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'prism', x: 3, z: 6, rot: 5 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'filter', x: 6, z: 1, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
    ],
    solution: { '1,3': 7, '3,5': 1, '3,6': 1, '4,6': 3, '6,5': 3, '3,4': 1, '2,4': 3, '1,0': 1, '0,0': 3, '0,2': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (3,2) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,5) rot 1 ·
    //   Spiegel (5,4) rot 3 · Spiegel (2,4) rot 1 · Spiegel (2,0) rot 1 · Spiegel (0,0) rot 3 ·
    //   Prisma (3,1) rot 1 · Spiegel (4,1) rot 3 · Prisma (1,5) rot 7 · Spiegel (1,3) rot 3
    // Generator sehr schwer-abzaehlen, Seed 41595 · Ausbau „sehr schwer“
    name: 'Albireo', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 2 },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 1 },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'prism', x: 1, z: 5, rot: 6 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'red' },
    ],
    solution: { '3,5': 1, '3,2': 1, '6,2': 3, '6,5': 1, '5,4': 3, '2,4': 1, '2,0': 1, '0,0': 3, '3,1': 1, '4,1': 3, '1,5': 7, '1,3': 3 },
  },
  {
    // Lösung: Spiegel (5,5) rot 3 · Spiegel (3,4) rot 2 · Spiegel (2,1) rot 1 · Prisma (3,5) rot 1 ·
    //   Prisma (4,3) rot 4 · Prisma (2,2) rot 7 · Spiegel (3,6) rot 1 · Spiegel (0,3) rot 1 ·
    //   Prisma (6,3) rot 3
    // Generator sehr schwer-lockvogel, Seed 41653 · Ausbau „sehr schwer“
    name: 'Kanopus', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 0, color: 'magenta' },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'yellow' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'target', x: 5, z: 6, color: 'magenta' },
      { type: 'target', x: 0, z: 1, color: 'yellow' },
      { type: 'blocker', x: 1, z: 2 },
      { type: 'prism', x: 3, z: 5, rot: 6 },
      { type: 'prism', x: 4, z: 3, rot: 1 },
      { type: 'prism', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 4, z: 0, color: 'green' },
      { type: 'source', x: 3, z: 0, dir: 1 },
      { type: 'prism', x: 6, z: 3, rot: 4 },
      { type: 'target', x: 3, z: 2, color: 'blue' },
    ],
    solution: { '5,5': 3, '3,4': 2, '2,1': 1, '3,5': 1, '4,3': 4, '2,2': 7, '3,6': 1, '0,3': 1, '6,3': 3 },
  },
  {
    // Lösung: Prisma (5,2) rot 1 · Spiegel (5,0) rot 1 · Spiegel (5,6) rot 1 · Spiegel (6,6) rot 3 ·
    //   Prisma (1,4) rot 2 · Spiegel (3,6) rot 0 · Prisma (4,2) rot 3 · Spiegel (1,5) rot 1 ·
    //   Spiegel (0,2) rot 3 · Spiegel (0,5) rot 2
    // Generator sehr schwer-sammelstelle, Seed 40895 · Ausbau „sehr schwer“
    name: 'Diphda', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'magenta' },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'source', x: 6, z: 1, dir: 3, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'target', x: 6, z: 3, color: 'white' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 6, rot: 0 },
      { type: 'prism', x: 1, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 6, rot: 3 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 3, color: 'magenta' },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'green' },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 0, fixed: true },
      { type: 'target', x: 0, z: 3, color: 'blue' },
    ],
    solution: { '5,2': 1, '5,0': 1, '5,6': 1, '6,6': 3, '1,4': 2, '3,6': 0, '4,2': 3, '1,5': 1, '0,2': 3, '0,5': 2 },
  },
  {
    // Lösung: Prisma (3,1) rot 3 · Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Prisma (2,6) rot 6 ·
    //   Prisma (4,2) rot 5 · Spiegel (4,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 ·
    //   Spiegel (5,0) rot 3 · Spiegel (4,4) rot 2 · Spiegel (1,1) rot 0
    // Generator sehr schwer-sammelstelle, Seed 40911 · Ausbau „sehr schwer“
    name: 'Hamal', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'source', x: 2, z: 0, dir: 1, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'green' },
      { type: 'target', x: 2, z: 1, color: 'cyan' },
      { type: 'target', x: 0, z: 4, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'prism', x: 2, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'magenta' },
      { type: 'prism', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'target', x: 6, z: 5, color: 'blue' },
      { type: 'blocker', x: 6, z: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '3,1': 3, '5,5': 1, '5,6': 3, '2,6': 6, '4,2': 5, '4,1': 3, '6,1': 3, '6,0': 1, '5,0': 3, '4,4': 2, '1,1': 0 },
  },
  {
    // Lösung: Prisma (2,6) rot 5 · Prisma (3,4) rot 6 · Spiegel (3,2) rot 3 · Prisma (5,4) rot 1 ·
    //   Spiegel (4,2) rot 3 · Spiegel (6,4) rot 1 · Spiegel (6,5) rot 3 · Spiegel (4,1) rot 1 ·
    //   Prisma (5,1) rot 3 · Spiegel (4,0) rot 1 · Spiegel (3,0) rot 3
    // Generator sehr schwer-sammelstelle, Seed 40922 · Ausbau „sehr schwer“
    name: 'Fomalhaut', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, z: 6, rot: 7 },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 3, color: 'green' },
      { type: 'target', x: 2, z: 1, color: 'cyan' },
      { type: 'target', x: 1, z: 5, color: 'yellow' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'prism', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 3, color: 'blue' },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'prism', x: 5, z: 4, rot: 4 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'prism', x: 5, z: 1, rot: 6 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
    ],
    solution: { '2,6': 5, '3,4': 6, '3,2': 3, '5,4': 1, '4,2': 3, '6,4': 1, '6,5': 3, '4,1': 1, '5,1': 3, '4,0': 1, '3,0': 3 },
  },
  {
    // Lösung: Prisma (3,2) rot 3 · Spiegel (4,2) rot 3 · Prisma (2,6) rot 7 · Spiegel (4,6) rot 3 ·
    //   Spiegel (5,2) rot 1 · Spiegel (5,5) rot 3 · Spiegel (2,3) rot 1 · Spiegel (0,3) rot 3 ·
    //   Spiegel (2,1) rot 3 · Prisma (3,1) rot 6 · Spiegel (3,0) rot 1
    // Generator sehr schwer-sammelstelle, Seed 42721 · Ausbau „sehr schwer“
    name: 'Dubhe', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 2, rot: 0 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 5, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 0 },
      { type: 'prism', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'green' },
    ],
    solution: { '3,2': 3, '4,2': 3, '2,6': 7, '4,6': 3, '5,2': 1, '5,5': 3, '2,3': 1, '0,3': 3, '2,1': 3, '3,1': 6, '3,0': 1 },
  },
  {
    // Lösung: Spiegel (0,5) rot 1 · Spiegel (5,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (3,2) rot 3 ·
    //   Prisma (3,4) rot 0 · Spiegel (5,4) rot 1 · Spiegel (1,1) rot 3 · Prisma (1,3) rot 1 ·
    //   Spiegel (5,6) rot 1 · Spiegel (1,6) rot 1 · Spiegel (4,3) rot 1
    // Generator sehr schwer-mischziel, Seed 41160 · Ausbau „sehr schwer“
    name: 'Kastor', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'white' },
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'source', x: 6, z: 2, dir: 4 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'prism', x: 1, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 2, z: 4, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
    ],
    solution: { '0,5': 1, '5,1': 1, '5,0': 1, '3,2': 3, '3,4': 0, '5,4': 1, '1,1': 3, '1,3': 1, '5,6': 1, '1,6': 1, '4,3': 1 },
  },
  {
    // Lösung: Prisma (1,4) rot 5 · Spiegel (0,2) rot 1 · Prisma (2,6) rot 3 · Spiegel (0,6) rot 1 ·
    //   Prisma (4,5) rot 5 · Spiegel (4,3) rot 1 · Spiegel (2,1) rot 3 · Spiegel (2,0) rot 1 ·
    //   Spiegel (1,0) rot 3 · Spiegel (5,2) rot 1
    // Generator sehr schwer-sammelstelle, Seed 10188 · Ausbau „sehr schwer“
    name: 'Atair', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 7 },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'magenta' },
      { type: 'source', x: 5, z: 0, dir: 3, color: 'green' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'target', x: 0, z: 3, color: 'cyan' },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'mirror', x: 0, z: 1, rot: 3, fixed: true },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'prism', x: 2, z: 6, rot: 6 },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'blocker', x: 1, z: 5 },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 4, z: 5, rot: 4 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 5, z: 5, color: 'blue' },
    ],
    solution: { '1,4': 5, '0,2': 1, '2,6': 3, '0,6': 1, '4,5': 5, '4,3': 1, '2,1': 3, '2,0': 1, '1,0': 3, '5,2': 1 },
  },
  {
    // Lösung: Spiegel (4,3) rot 1 · Spiegel (5,5) rot 0 · Prisma (6,4) rot 5 · Spiegel (2,4) rot 3 ·
    //   Spiegel (3,1) rot 0 · Spiegel (0,4) rot 2 · Spiegel (2,6) rot 3 · Spiegel (0,6) rot 1 ·
    //   Prisma (6,3) rot 5 · Spiegel (4,1) rot 3 · Spiegel (6,0) rot 1 · Spiegel (1,0) rot 3
    // Generator sehr schwer-mischziel, Seed 41581 · Ausbau „sehr schwer“
    name: 'Alhena', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'target', x: 2, z: 3, color: 'cyan' },
      { type: 'source', x: 0, z: 0, dir: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'prism', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 1, z: 5, color: 'cyan' },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 0, z: 6, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 5, z: 1, color: 'red' },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
    ],
    solution: { '4,3': 1, '5,5': 0, '6,4': 5, '2,4': 3, '3,1': 0, '0,4': 2, '2,6': 3, '0,6': 1, '6,3': 5, '4,1': 3, '6,0': 1, '1,0': 3 },
  },
  {
    // Lösung: Spiegel (3,1) rot 3 · Spiegel (1,1) rot 1 · Spiegel (4,4) rot 1 · Prisma (2,2) rot 5 ·
    //   Spiegel (0,2) rot 3 · Spiegel (0,5) rot 1 · Spiegel (6,5) rot 3 · Spiegel (6,1) rot 1 ·
    //   Spiegel (2,0) rot 1 · Spiegel (3,2) rot 1 · Spiegel (4,2) rot 3 · Prisma (5,2) rot 3 ·
    //   Spiegel (5,4) rot 1
    // Generator sehr schwer-mischziel, Seed 11914 · Ausbau „sehr schwer“
    name: 'Sirius', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'prism', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'cyan' },
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
    ],
    solution: { '3,1': 3, '1,1': 1, '4,4': 1, '2,2': 5, '0,2': 3, '0,5': 1, '6,5': 3, '6,1': 1, '2,0': 1, '3,2': 1, '4,2': 3, '5,2': 3, '5,4': 1 },
  },
  {
    // Lösung: Spiegel (2,1) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,4) rot 1 · Spiegel (2,4) rot 1 ·
    //   Spiegel (3,2) rot 1 · Spiegel (4,2) rot 1 · Spiegel (4,6) rot 3 · Prisma (3,6) rot 5 ·
    //   Spiegel (0,2) rot 3 · Spiegel (0,3) rot 1 · Spiegel (5,3) rot 3 · Spiegel (1,6) rot 1 ·
    //   Spiegel (1,0) rot 1
    // Generator sehr schwer-abzaehlen, Seed 11803 · Ausbau „sehr schwer“
    name: 'Aldebaran', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 6, z: 6, dir: 6 },
      { type: 'target', x: 2, z: 5, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'target', x: 0, z: 1, color: 'white' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'prism', x: 3, z: 6, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 0, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'mirror', x: 1, z: 6, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 0 },
      { type: 'target', x: 0, z: 0, color: 'red' },
    ],
    solution: { '2,1': 1, '6,1': 3, '6,4': 1, '2,4': 1, '3,2': 1, '4,2': 1, '4,6': 3, '3,6': 5, '0,2': 3, '0,3': 1, '5,3': 3, '1,6': 1, '1,0': 1 },
  },
  {
    // Lösung: Prisma (4,4) rot 3 · Spiegel (4,3) rot 1 · Spiegel (5,4) rot 1 · Spiegel (1,1) rot 1 ·
    //   Spiegel (2,1) rot 1 · Prisma (2,2) rot 3 · Spiegel (2,6) rot 3 · Prisma (3,2) rot 1 ·
    //   Spiegel (6,2) rot 3 · Spiegel (6,1) rot 1
    // Generator sehr schwer-sammelstelle, Seed 10419 · Ausbau „sehr schwer“
    name: 'Spiralnebel', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'cyan' },
      { type: 'target', x: 0, z: 4, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'prism', x: 2, z: 2, rot: 5 },
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'prism', x: 3, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 0, z: 1, color: 'red' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'red' },
    ],
    solution: { '4,4': 3, '4,3': 1, '5,4': 1, '1,1': 1, '2,1': 1, '2,2': 3, '2,6': 3, '3,2': 1, '6,2': 3, '6,1': 1 },
  },
  {
    // Lösung: Spiegel (3,0) rot 1 · Spiegel (3,4) rot 3 · Spiegel (4,3) rot 1 · Prisma (2,5) rot 7 ·
    //   Spiegel (2,3) rot 1 · Spiegel (6,3) rot 3 · Spiegel (6,2) rot 1 · Spiegel (4,5) rot 3 ·
    //   Spiegel (4,0) rot 3 · Spiegel (2,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (1,3) rot 1
    // Generator sehr schwer-mischziel, Seed 366, Ziel 88,36–89,15 · ersetzt Korona (Austausch „sehr schwer“)
    name: 'Lichtfächer', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'cyan' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'target', x: 1, z: 0, color: 'white' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'green' },
      { type: 'source', x: 3, z: 6, dir: 5 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'prism', x: 2, z: 5, rot: 6 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'target', x: 5, z: 6, color: 'green' },
    ],
    solution: { '3,0': 1, '3,4': 3, '4,3': 1, '2,5': 7, '2,3': 1, '6,3': 3, '6,2': 1, '4,5': 3, '4,0': 3, '2,1': 1, '5,0': 1, '1,3': 1 },
  },
  {
    // Lösung: Spiegel (1,5) rot 3 · Spiegel (5,1) rot 1 · Spiegel (5,0) rot 1 · Spiegel (6,6) rot 3 ·
    //   Prisma (6,3) rot 5 · Spiegel (1,3) rot 3 · Spiegel (5,4) rot 3 · Spiegel (0,5) rot 3 ·
    //   Prisma (2,1) rot 6 · Spiegel (2,0) rot 1 · Spiegel (1,0) rot 3 · Spiegel (0,3) rot 1
    // Generator sehr schwer-mischziel, Seed 41786 · Ausbau „sehr schwer“
    name: 'Alioth', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'cyan' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'prism', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 0 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'source', x: 0, z: 4, dir: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'prism', x: 2, z: 1, rot: 5 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'red' },
    ],
    solution: { '1,5': 3, '5,1': 1, '5,0': 1, '6,6': 3, '6,3': 5, '1,3': 3, '5,4': 3, '0,5': 3, '2,1': 6, '2,0': 1, '1,0': 3, '0,3': 1 },
  },
  {
    // Lösung: Prisma (1,1) rot 5 · Spiegel (1,4) rot 3 · Spiegel (3,5) rot 3 · Spiegel (3,4) rot 3 ·
    //   Spiegel (5,4) rot 1 · Prisma (5,5) rot 4 · Prisma (1,2) rot 4 · Spiegel (2,0) rot 1 ·
    //   Prisma (3,2) rot 0 · Spiegel (6,2) rot 1
    // Generator sehr schwer, Seed 41243 · Ausbau „sehr schwer“
    name: 'Ankaa', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
      { type: 'prism', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 0, z: 1, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'prism', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 0, rot: 3, fixed: true },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'prism', x: 1, z: 2, rot: 5 },
      { type: 'target', x: 4, z: 6, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'target', x: 0, z: 3, color: 'red' },
      { type: 'prism', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '1,1': 5, '1,4': 3, '3,5': 3, '3,4': 3, '5,4': 1, '5,5': 4, '1,2': 4, '2,0': 1, '3,2': 0, '6,2': 1 },
  },
  {
    // Lösung: Spiegel (3,2) rot 2 · Spiegel (6,3) rot 1 · Spiegel (5,1) rot 3 · Prisma (1,4) rot 0 ·
    //   Prisma (1,3) rot 1 · Prisma (5,5) rot 7 · Spiegel (4,4) rot 1 · Spiegel (4,5) rot 3 ·
    //   Spiegel (2,5) rot 0 · Spiegel (0,0) rot 3 · Spiegel (0,1) rot 1
    // Generator sehr schwer-lockvogel, Seed 40912 · Ausbau „sehr schwer“
    name: 'Enif', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 5, dir: 7, color: 'yellow' },
      { type: 'source', x: 0, z: 3, dir: 0, color: 'magenta' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'yellow' },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 1, color: 'magenta' },
      { type: 'mirror', x: 6, z: 2, rot: 3, fixed: true },
      { type: 'prism', x: 1, z: 4, rot: 4 },
      { type: 'prism', x: 1, z: 3, rot: 6 },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 3, z: 5, color: 'green' },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'blue' },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
    ],
    solution: { '3,2': 2, '6,3': 1, '5,1': 3, '1,4': 0, '1,3': 1, '5,5': 7, '4,4': 1, '4,5': 3, '2,5': 0, '0,0': 3, '0,1': 1 },
  },
  {
    // Lösung: Spiegel (1,3) rot 1 · Spiegel (1,4) rot 1 · Spiegel (1,1) rot 1 · Spiegel (1,0) rot 3 ·
    //   Spiegel (2,0) rot 1 · Spiegel (2,5) rot 3 · Spiegel (0,5) rot 3 · Spiegel (3,2) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (4,6) rot 3 · Spiegel (4,0) rot 3 · Spiegel (5,0) rot 1 ·
    //   Spiegel (5,3) rot 3 · Spiegel (0,1) rot 3
    // Generator sehr schwer-mischziel, Seed 11995 · Ausbau „sehr schwer“
    name: 'Rigel', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'cyan' },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'blue' },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'green' },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'target', x: 0, z: 2, color: 'green' },
    ],
    solution: { '1,3': 1, '1,4': 1, '1,1': 1, '1,0': 3, '2,0': 1, '2,5': 3, '0,5': 3, '3,2': 3, '3,6': 1, '4,6': 3, '4,0': 3, '5,0': 1, '5,3': 3, '0,1': 3 },
  },
  {
    // Lösung: Spiegel (5,3) rot 1 · Spiegel (5,6) rot 3 · Spiegel (4,4) rot 1 · Spiegel (3,4) rot 3 ·
    //   Prisma (2,4) rot 5 · Spiegel (1,4) rot 3 · Spiegel (1,5) rot 3 · Spiegel (0,5) rot 3 ·
    //   Spiegel (0,6) rot 1 · Spiegel (2,0) rot 1 · Spiegel (1,0) rot 3 · Prisma (6,1) rot 7 ·
    //   Spiegel (6,0) rot 1
    // Generator sehr schwer-mischziel, Seed 42703 · Ausbau „sehr schwer“
    name: 'Menkar', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'blue' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 5, z: 4, color: 'white' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'prism', x: 2, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'source', x: 0, z: 1, dir: 0 },
      { type: 'prism', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 3, color: 'red' },
    ],
    solution: { '5,3': 1, '5,6': 3, '4,4': 1, '3,4': 3, '2,4': 5, '1,4': 3, '1,5': 3, '0,5': 3, '0,6': 1, '2,0': 1, '1,0': 3, '6,1': 7, '6,0': 1 },
  },
  {
    // Lösung: Prisma (4,5) rot 3 · Spiegel (6,3) rot 2 · Spiegel (1,2) rot 0 · Prisma (2,6) rot 5 ·
    //   Spiegel (2,1) rot 3 · Spiegel (6,1) rot 3 · Spiegel (0,6) rot 1 · Spiegel (0,4) rot 3 ·
    //   Spiegel (6,0) rot 1 · Spiegel (5,0) rot 3 · Spiegel (5,6) rot 1 · Spiegel (6,6) rot 3
    // Generator sehr schwer-sammelstelle, Seed 11925 · Ausbau „sehr schwer“
    name: 'Pollux', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, z: 5, rot: 6 },
      { type: 'source', x: 3, z: 0, dir: 1, color: 'yellow' },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'source', x: 0, z: 3, dir: 7, color: 'blue' },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 5, color: 'cyan' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'prism', x: 2, z: 6, rot: 4 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 3, z: 6, color: 'green' },
      { type: 'mirror', x: 0, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 1 },
      { type: 'target', x: 6, z: 4, color: 'magenta' },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
    ],
    solution: { '4,5': 3, '6,3': 2, '1,2': 0, '2,6': 5, '2,1': 3, '6,1': 3, '0,6': 1, '0,4': 3, '6,0': 1, '5,0': 3, '5,6': 1, '6,6': 3 },
  },
  {
    // Lösung: Prisma (5,6) rot 7 · Spiegel (4,5) rot 2 · Prisma (3,1) rot 2 · Spiegel (5,3) rot 1 ·
    //   Prisma (3,2) rot 0 · Spiegel (0,4) rot 2 · Spiegel (5,0) rot 0 · Spiegel (1,5) rot 0 ·
    //   Spiegel (4,2) rot 3 · Spiegel (2,4) rot 2
    // Generator sehr schwer-sammelstelle, Seed 42412 · Ausbau „sehr schwer“
    name: 'Merak', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 6, rot: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 3, dir: 3, color: 'magenta' },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'cyan' },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 0, z: 5, dir: 7 },
      { type: 'prism', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 1, color: 'red' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'target', x: 4, z: 0, color: 'green' },
    ],
    solution: { '5,6': 7, '4,5': 2, '3,1': 2, '5,3': 1, '3,2': 0, '0,4': 2, '5,0': 0, '1,5': 0, '4,2': 3, '2,4': 2 },
  },
  {
    // Lösung: Spiegel (1,0) rot 1 · Prisma (1,5) rot 0 · Spiegel (3,5) rot 3 · Kombinator (3,3) dir 7 ·
    //   Spiegel (1,3) rot 1 · Spiegel (4,5) rot 3 · Prisma (4,4) rot 5 · Spiegel (4,3) rot 3 ·
    //   Spiegel (2,4) rot 3 · Kombinator (2,5) dir 2
    // Wertung 52.2 · 10 drehbar · 3 Ziele · Rateschritte 49178 · gehärtet aus Profil 3-misch, Seed 8068
    name: 'Lichtkegel', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0 },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 3, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 4, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 1, fixed: true },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 0, fixed: true },
      { type: 'prism', x: 4, z: 4, rot: 7 },
      { type: 'prism', x: 1, z: 5, rot: 5 },
      { type: 'filter', x: 1, z: 2, color: 'magenta' },
      { type: 'combiner', x: 3, z: 3, dir: 1 },
      { type: 'combiner', x: 2, z: 5, dir: 1 },
      { type: 'target', x: 5, z: 1, color: 'white' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'white' },
    ],
    solution: { '1,0': 1, '1,5': 0, '3,5': 3, '3,3': 7, '1,3': 1, '4,5': 3, '4,4': 5, '4,3': 3, '2,4': 3, '2,5': 2 },
  },
  {
    // Lösung: Spiegel (2,2) rot 1 · Spiegel (1,3) rot 1 · Spiegel (4,3) rot 3 · Prisma (0,1) rot 1 ·
    //   Spiegel (4,1) rot 3 · Spiegel (4,0) rot 3 · Spiegel (3,4) rot 2 · Spiegel (0,5) rot 1 ·
    //   Spiegel (5,5) rot 1 · Spiegel (6,6) rot 3 · Prisma (2,6) rot 5 · Spiegel (6,3) rot 1
    // Generator sehr schwer-mischziel, Seed 42120 · Ausbau „sehr schwer“
    name: 'Sadr', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 2, color: 'white' },
      { type: 'source', x: 0, z: 0, dir: 2 },
      { type: 'prism', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'target', x: 1, z: 6, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'prism', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,2': 1, '1,3': 1, '4,3': 3, '0,1': 1, '4,1': 3, '4,0': 3, '3,4': 2, '0,5': 1, '5,5': 1, '6,6': 3, '2,6': 5, '6,3': 1 },
  },
  {
    // Lösung: Prisma (4,3) rot 3 · Spiegel (2,3) rot 3 · Spiegel (2,4) rot 3 · Prisma (2,0) rot 5 ·
    //   Prisma (5,2) rot 5 · Spiegel (6,0) rot 1 · Spiegel (4,6) rot 1 · Spiegel (5,6) rot 3 ·
    //   Prisma (3,6) rot 5 · Spiegel (3,2) rot 1
    // Generator sehr schwer, Seed 40343 · Ausbau „sehr schwer“
    name: 'Mintaka', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'prism', x: 4, z: 3, rot: 5 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'prism', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 0, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'blue' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'cyan' },
      { type: 'prism', x: 5, z: 2, rot: 6 },
      { type: 'mirror', x: 5, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 3, z: 6, rot: 4 },
      { type: 'target', x: 5, z: 0, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
    ],
    solution: { '4,3': 3, '2,3': 3, '2,4': 3, '2,0': 5, '5,2': 5, '6,0': 1, '4,6': 1, '5,6': 3, '3,6': 5, '3,2': 1 },
  },
  {
    // Lösung: Spiegel (2,1) rot 3 · Spiegel (2,4) rot 1 · Spiegel (5,4) rot 1 · Prisma (3,1) rot 1 ·
    //   Spiegel (0,4) rot 3 · Spiegel (5,1) rot 3 · Prisma (3,4) rot 5 · Prisma (4,4) rot 5 ·
    //   Prisma (5,3) rot 2 · Spiegel (1,1) rot 2 · Kombinator (4,2) dir 6
    // Wertung 54.5 · 11 drehbar · 4 Ziele · Rateschritte 80714 · gehärtet aus Profil 4-bunt, Seed 8051
    name: 'Morgenröte', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'green' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 0, rot: 0, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 6, rot: 2, fixed: true },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'prism', x: 5, z: 3, rot: 4 },
      { type: 'prism', x: 3, z: 4, rot: 1 },
      { type: 'prism', x: 4, z: 4, rot: 4 },
      { type: 'filter', x: 5, z: 5, color: 'yellow' },
      { type: 'combiner', x: 4, z: 2, dir: 5 },
      { type: 'target', x: 4, z: 0, color: 'cyan' },
      { type: 'target', x: 5, z: 0, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 5, color: 'green' },
    ],
    solution: { '2,1': 3, '2,4': 1, '5,4': 1, '3,1': 1, '0,4': 3, '5,1': 3, '3,4': 5, '4,4': 5, '5,3': 2, '1,1': 2, '4,2': 6 },
  },
  {
    // Lösung: Prisma (5,2) rot 2 · Spiegel (1,2) rot 1 · Spiegel (3,1) rot 1 · Spiegel (3,0) rot 1 ·
    //   Spiegel (5,6) rot 3 · Spiegel (4,6) rot 1 · Spiegel (6,1) rot 1 · Spiegel (2,0) rot 3 ·
    //   Prisma (3,3) rot 4 · Spiegel (0,4) rot 1 · Spiegel (1,4) rot 3
    // Generator sehr schwer-sammelstelle, Seed 40563 · Ausbau „sehr schwer“
    name: 'Mizar', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 2, rot: 7 },
      { type: 'source', x: 5, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'target', x: 6, z: 3, color: 'yellow' },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'green' },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 3 },
      { type: 'prism', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 3, fixed: true },
      { type: 'target', x: 1, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'target', x: 0, z: 2, color: 'green' },
    ],
    solution: { '5,2': 2, '1,2': 1, '3,1': 1, '3,0': 1, '5,6': 3, '4,6': 1, '6,1': 1, '2,0': 3, '3,3': 4, '0,4': 1, '1,4': 3 },
  },
  {
    // Lösung: Spiegel (2,4) rot 3 · Spiegel (4,3) rot 1 · Prisma (1,4) rot 5 · Spiegel (3,6) rot 3 ·
    //   Spiegel (3,2) rot 1 · Prisma (1,2) rot 4 · Prisma (4,4) rot 2 · Spiegel (0,4) rot 3 ·
    //   Spiegel (4,6) rot 1 · Spiegel (6,6) rot 3 · Spiegel (6,3) rot 1 · Spiegel (4,1) rot 1
    // Generator sehr schwer, Seed 40139 · Ausbau „sehr schwer“
    name: 'Alkor', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0 },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'yellow' },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'prism', x: 4, z: 4, rot: 5 },
      { type: 'mirror', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 5, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'green' },
      { type: 'target', x: 0, z: 1, color: 'cyan' },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 1, rot: 0 },
    ],
    solution: { '2,4': 3, '4,3': 1, '1,4': 5, '3,6': 3, '3,2': 1, '1,2': 4, '4,4': 2, '0,4': 3, '4,6': 1, '6,6': 3, '6,3': 1, '4,1': 1 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Prisma (1,4) rot 1 · Spiegel (5,4) rot 1 · Spiegel (2,5) rot 2 ·
    //   Spiegel (1,6) rot 0 · Spiegel (1,2) rot 3 · Spiegel (6,5) rot 1 · Prisma (0,2) rot 6 ·
    //   Spiegel (3,6) rot 1 · Spiegel (1,3) rot 1 · Spiegel (0,1) rot 3 · Spiegel (6,1) rot 3
    // Generator sehr schwer-mischziel, Seed 40142 · Ausbau „sehr schwer“
    name: 'Kochab', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'blue' },
      { type: 'mirror', x: 3, z: 2, rot: 0 },
      { type: 'target', x: 4, z: 2, color: 'white' },
      { type: 'source', x: 1, z: 0, dir: 2 },
      { type: 'source', x: 0, z: 3, dir: 1 },
      { type: 'prism', x: 1, z: 4, rot: 6 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 5, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'prism', x: 0, z: 2, rot: 5 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'target', x: 2, z: 0, color: 'blue' },
      { type: 'blocker', x: 2, z: 6 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'green' },
    ],
    solution: { '3,2': 1, '1,4': 1, '5,4': 1, '2,5': 2, '1,6': 0, '1,2': 3, '6,5': 1, '0,2': 6, '3,6': 1, '1,3': 1, '0,1': 3, '6,1': 3 },
  },
  {
    // Lösung: Prisma (1,4) rot 7 · Spiegel (0,4) rot 1 · Spiegel (4,1) rot 0 · Spiegel (5,2) rot 0 ·
    //   Prisma (6,3) rot 3 · Spiegel (3,3) rot 1 · Spiegel (4,5) rot 2 · Spiegel (3,1) rot 1 ·
    //   Spiegel (6,1) rot 2 · Spiegel (5,6) rot 0 · Spiegel (3,5) rot 2 · Spiegel (4,6) rot 0
    // Generator sehr schwer-sammelstelle, Seed 673, Ziel 90,42–91,28 · ersetzt Quasar (Austausch „sehr schwer“)
    name: 'Leitstern', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 4, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'yellow' },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 5, color: 'blue' },
      { type: 'target', x: 1, z: 1, color: 'magenta' },
      { type: 'target', x: 6, z: 4, color: 'white' },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'prism', x: 6, z: 3, rot: 7 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 0, color: 'green' },
      { type: 'source', x: 6, z: 2, dir: 3, color: 'yellow' },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '1,4': 7, '0,4': 1, '4,1': 0, '5,2': 0, '6,3': 3, '3,3': 1, '4,5': 2, '3,1': 1, '6,1': 2, '5,6': 0, '3,5': 2, '4,6': 0 },
  },
  {
    // Lösung: Prisma (5,4) rot 4 · Spiegel (4,3) rot 2 · Spiegel (5,2) rot 2 · Spiegel (3,0) rot 0 ·
    //   Spiegel (2,1) rot 0 · Spiegel (1,0) rot 0 · Spiegel (0,1) rot 2 · Prisma (2,5) rot 3 ·
    //   Spiegel (0,5) rot 3 · Prisma (2,2) rot 3 · Spiegel (0,2) rot 3
    // Generator sehr schwer-sammelstelle, Seed 10645 · Ausbau „sehr schwer“
    name: 'Prokyon', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 4, rot: 6 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 6, color: 'cyan' },
      { type: 'target', x: 4, z: 5, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'cyan' },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'source', x: 3, z: 6, dir: 5 },
      { type: 'prism', x: 2, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 1, z: 6, color: 'green' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 2, z: 2, rot: 4 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
    ],
    solution: { '5,4': 4, '4,3': 2, '5,2': 2, '3,0': 0, '2,1': 0, '1,0': 0, '0,1': 2, '2,5': 3, '0,5': 3, '2,2': 3, '0,2': 3 },
  },
  {
    // Lösung: Spiegel (2,4) rot 3 · Spiegel (2,2) rot 1 · Spiegel (4,2) rot 1 · Spiegel (4,4) rot 3 ·
    //   Spiegel (2,6) rot 1 · Spiegel (3,6) rot 3 · Spiegel (3,0) rot 1 · Spiegel (0,0) rot 3 ·
    //   Prisma (5,2) rot 3 · Spiegel (5,5) rot 1 · Prisma (4,5) rot 5 · Spiegel (2,1) rot 3
    // Generator sehr schwer-abzaehlen, Seed 11189 · Ausbau „sehr schwer“
    name: 'Gravitation', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 2, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 4, dir: 0, color: 'cyan' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'magenta' },
      { type: 'target', x: 0, z: 2, color: 'white' },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'target', x: 6, z: 4, color: 'blue' },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'red' },
      { type: 'mirror', x: 2, z: 5, rot: 1, fixed: true },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'prism', x: 5, z: 2, rot: 4 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'prism', x: 4, z: 5, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'red' },
    ],
    solution: { '2,4': 3, '2,2': 1, '4,2': 1, '4,4': 3, '2,6': 1, '3,6': 3, '3,0': 1, '0,0': 3, '5,2': 3, '5,5': 1, '4,5': 5, '2,1': 3 },
  },
  {
    // Lösung: Prisma (0,1) rot 1 · Spiegel (1,0) rot 0 · Prisma (3,5) rot 6 · Spiegel (5,3) rot 0 ·
    //   Spiegel (6,4) rot 2 · Spiegel (3,1) rot 1 · Prisma (6,1) rot 5 · Spiegel (2,4) rot 0 ·
    //   Spiegel (5,0) rot 0 · Spiegel (1,4) rot 2 · Spiegel (3,0) rot 3 · Spiegel (4,0) rot 1
    // Generator sehr schwer-sammelstelle, Seed 40656 · Ausbau „sehr schwer“
    name: 'Izar', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 0, z: 1, rot: 5 },
      { type: 'source', x: 6, z: 5, dir: 5, color: 'blue' },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'source', x: 0, z: 0, dir: 2, color: 'green' },
      { type: 'target', x: 0, z: 6, color: 'magenta' },
      { type: 'target', x: 4, z: 5, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 5 },
      { type: 'prism', x: 3, z: 5, rot: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 1 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 1 },
      { type: 'mirror', x: 1, z: 4, rot: 1 },
      { type: 'target', x: 3, z: 6, color: 'green' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'blue' },
    ],
    solution: { '0,1': 1, '1,0': 0, '3,5': 6, '5,3': 0, '6,4': 2, '3,1': 1, '6,1': 5, '2,4': 0, '5,0': 0, '1,4': 2, '3,0': 3, '4,0': 1 },
  },
  {
    // Lösung: Spiegel (6,2) rot 3 · Spiegel (3,2) rot 3 · Prisma (5,3) rot 4 · Spiegel (2,0) rot 0 ·
    //   Spiegel (1,1) rot 0 · Spiegel (0,3) rot 1 · Spiegel (0,2) rot 3 · Prisma (0,5) rot 6 ·
    //   Spiegel (1,4) rot 0 · Spiegel (3,0) rot 3 · Spiegel (4,0) rot 1 · Spiegel (2,1) rot 3
    // Generator sehr schwer-mischziel, Seed 40263 · Ausbau „sehr schwer“
    name: 'Algol', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'target', x: 3, z: 4, color: 'white' },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'cyan' },
      { type: 'prism', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'target', x: 0, z: 0, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 5 },
      { type: 'prism', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'target', x: 2, z: 5, color: 'cyan' },
      { type: 'blocker', x: 1, z: 5 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 1, rot: 3, fixed: true },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
    ],
    solution: { '6,2': 3, '3,2': 3, '5,3': 4, '2,0': 0, '1,1': 0, '0,3': 1, '0,2': 3, '0,5': 6, '1,4': 0, '3,0': 3, '4,0': 1, '2,1': 3 },
  },
  {
    // Lösung: Spiegel (5,0) rot 1 · Spiegel (3,3) rot 3 · Spiegel (6,3) rot 3 · Spiegel (1,0) rot 3 ·
    //   Spiegel (2,1) rot 0 · Prisma (3,2) rot 2 · Prisma (4,1) rot 5 · Spiegel (1,5) rot 3 ·
    //   Spiegel (0,5) rot 3 · Prisma (3,4) rot 7 · Spiegel (2,3) rot 3 · Spiegel (2,6) rot 3
    // Generator sehr schwer-abschalten, Seed 11243 · Ausbau „sehr schwer“
    name: 'Orion', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 5, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'target', x: 6, z: 0, color: 'red' },
      { type: 'source', x: 3, z: 6, dir: 6, color: 'magenta' },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'prism', x: 3, z: 2, rot: 3 },
      { type: 'target', x: 6, z: 5, color: 'red' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'prism', x: 4, z: 1, rot: 4 },
      { type: 'target', x: 3, z: 1, color: 'red' },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 0, z: 6, color: 'yellow' },
      { type: 'prism', x: 3, z: 4, rot: 6 },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 6, z: 4, color: 'blue' },
    ],
    solution: { '5,0': 1, '3,3': 3, '6,3': 3, '1,0': 3, '2,1': 0, '3,2': 2, '4,1': 5, '1,5': 3, '0,5': 3, '3,4': 7, '2,3': 3, '2,6': 3 },
  },
  {
    // Lösung: Prisma (1,0) rot 1 · Spiegel (0,1) rot 2 · Prisma (2,2) rot 5 · Spiegel (2,1) rot 3 ·
    //   Spiegel (0,2) rot 3 · Spiegel (3,1) rot 1 · Spiegel (0,5) rot 1 · Spiegel (3,5) rot 1 ·
    //   Prisma (4,3) rot 6 · Spiegel (4,2) rot 3 · Spiegel (6,2) rot 1 · Spiegel (6,4) rot 3
    // Generator sehr schwer-sammelstelle, Seed 40703 · Ausbau „sehr schwer“
    name: 'Bellatrix', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 0, rot: 5 },
      { type: 'source', x: 0, z: 0, dir: 0, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 0, color: 'magenta' },
      { type: 'target', x: 1, z: 4, color: 'cyan' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'magenta' },
      { type: 'prism', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 3, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 4, z: 6, color: 'red' },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'target', x: 6, z: 1, color: 'blue' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 0 },
    ],
    solution: { '1,0': 1, '0,1': 2, '2,2': 5, '2,1': 3, '0,2': 3, '3,1': 1, '0,5': 1, '3,5': 1, '4,3': 6, '4,2': 3, '6,2': 1, '6,4': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 0 · Spiegel (5,3) rot 2 · Spiegel (4,0) rot 0 · Spiegel (5,1) rot 0 ·
    //   Spiegel (2,3) rot 0 · Prisma (1,6) rot 0 · Spiegel (4,3) rot 0 · Prisma (1,2) rot 7 ·
    //   Spiegel (5,4) rot 0 · Spiegel (1,0) rot 1 · Spiegel (6,2) rot 3 · Spiegel (6,3) rot 2
    // Generator sehr schwer-falle, Seed 11138 · Ausbau „sehr schwer“
    name: 'Beteigeuze', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 1, dir: 0, color: 'magenta' },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'mirror', x: 5, z: 3, rot: 3 },
      { type: 'target', x: 3, z: 5, color: 'blue' },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 2 },
      { type: 'source', x: 5, z: 0, dir: 3 },
      { type: 'source', x: 0, z: 5, dir: 1 },
      { type: 'mirror', x: 2, z: 3, rot: 2 },
      { type: 'prism', x: 1, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 3, rot: 3 },
      { type: 'prism', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'target', x: 6, z: 0, color: 'magenta' },
      { type: 'mirror', x: 6, z: 2, rot: 1 },
      { type: 'target', x: 0, z: 0, color: 'red' },
      { type: 'mirror', x: 6, z: 3, rot: 3 },
    ],
    solution: { '3,1': 0, '5,3': 2, '4,0': 0, '5,1': 0, '2,3': 0, '1,6': 0, '4,3': 0, '1,2': 7, '5,4': 0, '1,0': 1, '6,2': 3, '6,3': 2 },
  },
  {
    // Lösung: Prisma (1,3) rot 4 · Spiegel (5,3) rot 0 · Prisma (3,1) rot 3 · Spiegel (3,6) rot 3 ·
    //   Spiegel (2,6) rot 1 · Spiegel (2,1) rot 1 · Spiegel (1,1) rot 1 · Spiegel (1,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (5,6) rot 0 · Prisma (4,5) rot 5
    // Generator sehr schwer-sammelstelle, Seed 40816 · Ausbau „sehr schwer“
    name: 'Megrez', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 1, z: 3, rot: 5 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'yellow' },
      { type: 'source', x: 4, z: 6, dir: 5, color: 'blue' },
      { type: 'target', x: 0, z: 3, color: 'green' },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 3 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'prism', x: 3, z: 1, rot: 5 },
      { type: 'mirror', x: 3, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 3 },
      { type: 'mirror', x: 0, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 5, dir: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 3 },
      { type: 'prism', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 5, color: 'red' },
      { type: 'target', x: 1, z: 2, color: 'green' },
    ],
    solution: { '1,3': 4, '5,3': 0, '3,1': 3, '3,6': 3, '2,6': 1, '2,1': 1, '1,1': 1, '1,0': 1, '0,0': 3, '5,6': 0, '4,5': 5 },
  },
  {
    // Lösung: Prisma (1,2) rot 2 · Spiegel (1,4) rot 3 · Prisma (5,4) rot 5 · Spiegel (0,4) rot 1 ·
    //   Spiegel (4,1) rot 3 · Spiegel (1,5) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 ·
    //   Spiegel (0,0) rot 3 · Spiegel (0,1) rot 1 · Spiegel (2,1) rot 1 · Kombinator (5,3) dir 7 ·
    //   Spiegel (0,3) rot 3 · Spiegel (2,5) rot 1
    // Generator sehr schwer, Seed 42941 · Ausbau „sehr schwer“
    name: 'Nunki', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'source', x: 6, z: 3, dir: 3 },
      { type: 'prism', x: 1, z: 2, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'prism', x: 5, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'target', x: 3, z: 5, color: 'red' },
      { type: 'target', x: 3, z: 2, color: 'green' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'red' },
      { type: 'mirror', x: 4, z: 1, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 5, z: 6, color: 'red' },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'blocker', x: 3, z: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'combiner', x: 5, z: 3, dir: 4 },
      { type: 'target', x: 6, z: 2, color: 'cyan' },
      { type: 'mirror', x: 0, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 3 },
      { type: 'target', x: 2, z: 6, color: 'red' },
    ],
    solution: { '1,2': 2, '1,4': 3, '5,4': 5, '0,4': 1, '4,1': 3, '1,5': 1, '6,1': 3, '6,0': 1, '0,0': 3, '0,1': 1, '2,1': 1, '5,3': 7, '0,3': 3, '2,5': 1 },
  },
  {
    // Lösung: Prisma (4,4) rot 2 · Spiegel (5,1) rot 3 · Spiegel (3,1) rot 3 · Prisma (5,5) rot 2 ·
    //   Prisma (3,3) rot 3 · Kombinator (6,6) dir 6 · Spiegel (3,4) rot 3 · Spiegel (1,3) rot 3 ·
    //   Spiegel (1,6) rot 3 · Kombinator (2,4) dir 2
    // Generator sehr schwer-sammelstelle, Seed 10608 · Ausbau „sehr schwer“
    name: 'Magellanwolke', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 4, z: 4, rot: 1 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 4, color: 'blue' },
      { type: 'target', x: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 2, z: 6, color: 'white' },
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'mirror', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 0 },
      { type: 'prism', x: 5, z: 5, rot: 6 },
      { type: 'prism', x: 3, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 6, rot: 1, fixed: true },
      { type: 'combiner', x: 6, z: 6, dir: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'combiner', x: 2, z: 4, dir: 5 },
      { type: 'mirror', x: 0, z: 6, rot: 1, fixed: true },
      { type: 'target', x: 0, z: 2, color: 'blue' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
    ],
    solution: { '4,4': 2, '5,1': 3, '3,1': 3, '5,5': 2, '3,3': 3, '6,6': 6, '3,4': 3, '1,3': 3, '1,6': 3, '2,4': 2 },
  },
  {
    // Lösung: Prisma (6,4) rot 3 · Spiegel (5,3) rot 0 · Spiegel (5,5) rot 2 · Spiegel (1,2) rot 2 ·
    //   Prisma (2,1) rot 1 · Spiegel (4,1) rot 1 · Spiegel (4,6) rot 3 · Spiegel (5,2) rot 3 ·
    //   Spiegel (5,0) rot 1 · Spiegel (1,0) rot 3 · Spiegel (1,1) rot 3 · Prisma (0,5) rot 7
    // Generator sehr schwer-sammelstelle, Seed 42153 · Ausbau „sehr schwer“
    name: 'Alnilam', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 6, z: 4, rot: 6 },
      { type: 'source', x: 2, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 2, color: 'red' },
      { type: 'target', x: 0, z: 4, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'prism', x: 2, z: 1, rot: 5 },
      { type: 'mirror', x: 4, z: 1, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 2, z: 2, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'source', x: 1, z: 6, dir: 5, color: 'magenta' },
      { type: 'prism', x: 0, z: 5, rot: 2 },
      { type: 'target', x: 6, z: 6, color: 'green' },
    ],
    solution: { '6,4': 3, '5,3': 0, '5,5': 2, '1,2': 2, '2,1': 1, '4,1': 1, '4,6': 3, '5,2': 3, '5,0': 1, '1,0': 3, '1,1': 3, '0,5': 7 },
  },
  {
    // Lösung: Spiegel (6,0) rot 1 · Spiegel (6,4) rot 3 · Spiegel (1,2) rot 1 · Prisma (4,3) rot 5 ·
    //   Spiegel (2,6) rot 3 · Spiegel (2,3) rot 1 · Spiegel (4,2) rot 1 · Spiegel (1,1) rot 1 ·
    //   Spiegel (0,3) rot 3 · Spiegel (0,5) rot 1 · Spiegel (2,1) rot 3 · Spiegel (6,6) rot 3 ·
    //   Spiegel (5,6) rot 1
    // Generator sehr schwer-mischziel, Seed 42851 · Ausbau „sehr schwer“
    name: 'Saiph', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 0, dir: 0, color: 'blue' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'yellow' },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 0 },
      { type: 'target', x: 1, z: 4, color: 'white' },
      { type: 'source', x: 0, z: 6, dir: 0, color: 'cyan' },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'prism', x: 4, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 0 },
      { type: 'mirror', x: 2, z: 3, rot: 0 },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'filter', x: 0, z: 4, color: 'green' },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'mirror', x: 0, z: 5, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1 },
      { type: 'mirror', x: 3, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 1, fixed: true },
      { type: 'target', x: 3, z: 6, color: 'red' },
      { type: 'mirror', x: 6, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'target', x: 5, z: 1, color: 'green' },
    ],
    solution: { '6,0': 1, '6,4': 3, '1,2': 1, '4,3': 5, '2,6': 3, '2,3': 1, '4,2': 1, '1,1': 1, '0,3': 3, '0,5': 1, '2,1': 3, '6,6': 3, '5,6': 1 },
  },
  {
    // Lösung: Prisma (5,1) rot 2 · Prisma (5,5) rot 4 · Spiegel (0,5) rot 1 · Spiegel (0,4) rot 3 ·
    //   Spiegel (1,4) rot 3 · Spiegel (5,4) rot 1 · Spiegel (1,0) rot 1 · Spiegel (6,4) rot 1 ·
    //   Spiegel (4,6) rot 0 · Spiegel (2,2) rot 1 · Prisma (2,3) rot 5 · Spiegel (4,4) rot 2
    // Generator sehr schwer-sammelstelle, Seed 51827, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Wezen', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'cyan' },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'target', x: 6, z: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 5 },
      { type: 'prism', x: 5, z: 5, rot: 7 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'mirror', x: 0, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 3 },
      { type: 'target', x: 0, z: 0, color: 'green' },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'target', x: 0, z: 2, color: 'magenta' },
      { type: 'source', x: 2, z: 6, dir: 6, color: 'cyan' },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'prism', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'green' },
    ],
    solution: { '5,1': 2, '5,5': 4, '0,5': 1, '0,4': 3, '1,4': 3, '5,4': 1, '1,0': 1, '6,4': 1, '4,6': 0, '2,2': 1, '2,3': 5, '4,4': 2 },
  },
  {
    // Lösung: Spiegel (2,1) rot 1 · Spiegel (2,0) rot 1 · Prisma (0,0) rot 2 · Prisma (1,2) rot 2 ·
    //   Kombinator (4,4) dir 0 · Prisma (6,3) rot 5 · Spiegel (2,3) rot 3 · Spiegel (2,6) rot 3 ·
    //   Prisma (3,5) rot 7 · Spiegel (0,6) rot 1
    // Generator sehr schwer, Seed 40562 · Ausbau „sehr schwer“
    name: 'Alphard', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'source', x: 0, z: 1, dir: 1 },
      { type: 'mirror', x: 2, z: 1, rot: 2 },
      { type: 'mirror', x: 2, z: 0, rot: 2 },
      { type: 'prism', x: 0, z: 0, rot: 5 },
      { type: 'prism', x: 1, z: 2, rot: 6 },
      { type: 'combiner', x: 4, z: 4, dir: 6 },
      { type: 'target', x: 6, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 3, color: 'magenta' },
      { type: 'source', x: 3, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 3, rot: 6 },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'mirror', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'source', x: 0, z: 2, dir: 1 },
      { type: 'prism', x: 3, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 6, rot: 0 },
      { type: 'target', x: 5, z: 5, color: 'blue' },
    ],
    solution: { '2,1': 1, '2,0': 1, '0,0': 2, '1,2': 2, '4,4': 0, '6,3': 5, '2,3': 3, '2,6': 3, '3,5': 7, '0,6': 1 },
  },
  {
    // Lösung: Spiegel (3,5) rot 1 · Spiegel (3,2) rot 3 · Spiegel (5,2) rot 3 · Spiegel (5,5) rot 1 ·
    //   Prisma (3,1) rot 3 · Spiegel (2,1) rot 1 · Spiegel (0,0) rot 3 · Spiegel (0,3) rot 1 ·
    //   Spiegel (5,6) rot 1 · Spiegel (5,0) rot 1 · Spiegel (4,3) rot 1 · Spiegel (4,0) rot 3 ·
    //   Prisma (6,3) rot 2
    // Generator sehr schwer-abzaehlen, Seed 10292 · Ausbau „sehr schwer“
    name: 'Gezeitenkraft', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'mirror', x: 3, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 5, dir: 0, color: 'red' },
      { type: 'source', x: 3, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 2, dir: 4, color: 'yellow' },
      { type: 'target', x: 2, z: 2, color: 'red' },
      { type: 'target', x: 3, z: 6, color: 'magenta' },
      { type: 'target', x: 6, z: 5, color: 'yellow' },
      { type: 'prism', x: 3, z: 1, rot: 6 },
      { type: 'mirror', x: 2, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1, fixed: true },
      { type: 'mirror', x: 0, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 4 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 4, color: 'blue' },
      { type: 'mirror', x: 4, z: 0, rot: 0 },
      { type: 'prism', x: 6, z: 3, rot: 1 },
    ],
    solution: { '3,5': 1, '3,2': 3, '5,2': 3, '5,5': 1, '3,1': 3, '2,1': 1, '0,0': 3, '0,3': 1, '5,6': 1, '5,0': 1, '4,3': 1, '4,0': 3, '6,3': 2 },
  },
  {
    // Lösung: Prisma (2,4) rot 7 · Spiegel (2,2) rot 1 · Spiegel (3,4) rot 3 · Spiegel (3,3) rot 3 ·
    //   Spiegel (6,3) rot 3 · Spiegel (4,1) rot 2 · Spiegel (0,5) rot 2 · Spiegel (1,6) rot 0 ·
    //   Prisma (5,1) rot 3 · Spiegel (5,4) rot 3 · Prisma (5,5) rot 1 · Spiegel (5,6) rot 3
    // Generator sehr schwer-falle, Seed 12126 · Ausbau „sehr schwer“
    name: 'Kassiopeia', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'target', x: 0, z: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 3, z: 3, rot: 2 },
      { type: 'source', x: 5, z: 0, dir: 2 },
      { type: 'source', x: 3, z: 0, dir: 1, color: 'green' },
      { type: 'mirror', x: 6, z: 3, rot: 2 },
      { type: 'mirror', x: 4, z: 1, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'mirror', x: 1, z: 6, rot: 1 },
      { type: 'prism', x: 5, z: 1, rot: 1 },
      { type: 'mirror', x: 2, z: 5, rot: 0, fixed: true },
      { type: 'target', x: 4, z: 2, color: 'green' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'white' },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'source', x: 6, z: 4, dir: 3 },
      { type: 'prism', x: 5, z: 5, rot: 4 },
      { type: 'mirror', x: 5, z: 6, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'red' },
    ],
    solution: { '2,4': 7, '2,2': 1, '3,4': 3, '3,3': 3, '6,3': 3, '4,1': 2, '0,5': 2, '1,6': 0, '5,1': 3, '5,4': 3, '5,5': 1, '5,6': 3 },
  },
  {
    // Lösung: Spiegel (3,2) rot 1 · Spiegel (5,3) rot 3 · Spiegel (5,4) rot 3 · Prisma (4,4) rot 2 ·
    //   Spiegel (4,6) rot 1 · Spiegel (6,5) rot 1 · Prisma (4,3) rot 7 · Spiegel (5,1) rot 1 ·
    //   Spiegel (1,5) rot 1 · Spiegel (1,1) rot 1 · Spiegel (4,2) rot 3 · Spiegel (3,0) rot 3 ·
    //   Spiegel (4,0) rot 1
    // Generator sehr schwer-mischziel, Seed 40538 · Ausbau „sehr schwer“
    name: 'Markab', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 6, dir: 6, color: 'red' },
      { type: 'source', x: 2, z: 0, dir: 2, color: 'cyan' },
      { type: 'mirror', x: 3, z: 2, rot: 3 },
      { type: 'target', x: 2, z: 2, color: 'white' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'mirror', x: 5, z: 3, rot: 2 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'prism', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'source', x: 1, z: 6, dir: 7 },
      { type: 'prism', x: 4, z: 3, rot: 0 },
      { type: 'target', x: 6, z: 1, color: 'green' },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 3, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'target', x: 0, z: 1, color: 'green' },
      { type: 'mirror', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 2, color: 'red' },
      { type: 'mirror', x: 3, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'target', x: 1, z: 0, color: 'blue' },
    ],
    solution: { '3,2': 1, '5,3': 3, '5,4': 3, '4,4': 2, '4,6': 1, '6,5': 1, '4,3': 7, '5,1': 1, '1,5': 1, '1,1': 1, '4,2': 3, '3,0': 3, '4,0': 1 },
  },
  {
    // Lösung: Prisma (1,4) rot 5 · Spiegel (1,0) rot 3 · Spiegel (2,0) rot 1 · Spiegel (2,2) rot 3 ·
    //   Spiegel (0,2) rot 1 · Spiegel (0,1) rot 3 · Spiegel (5,5) rot 1 · Prisma (1,5) rot 2 ·
    //   Spiegel (3,0) rot 0 · Prisma (2,3) rot 2 · Spiegel (5,2) rot 2
    // Generator sehr schwer, Seed 40374 · Ausbau „sehr schwer“
    name: 'Achernar', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 4, dir: 4 },
      { type: 'prism', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 2, z: 0, rot: 3 },
      { type: 'mirror', x: 2, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 2 },
      { type: 'mirror', x: 6, z: 1, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'prism', x: 1, z: 5, rot: 0 },
      { type: 'target', x: 2, z: 6, color: 'yellow' },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'source', x: 6, z: 3, dir: 4 },
      { type: 'source', x: 0, z: 3, dir: 7, color: 'blue' },
      { type: 'mirror', x: 3, z: 0, rot: 2 },
      { type: 'prism', x: 2, z: 3, rot: 7 },
      { type: 'target', x: 0, z: 4, color: 'red' },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'filter', x: 5, z: 4, color: 'yellow' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '1,4': 5, '1,0': 3, '2,0': 1, '2,2': 3, '0,2': 1, '0,1': 3, '5,5': 1, '1,5': 2, '3,0': 0, '2,3': 2, '5,2': 2 },
  },
  {
    // Lösung: Spiegel (3,2) rot 3 · Spiegel (1,2) rot 1 · Spiegel (1,5) rot 1 · Spiegel (3,5) rot 3 ·
    //   Spiegel (4,4) rot 3 · Spiegel (5,4) rot 3 · Spiegel (5,2) rot 1 · Spiegel (0,2) rot 3 ·
    //   Prisma (3,1) rot 1 · Spiegel (6,1) rot 3 · Spiegel (6,0) rot 1 · Spiegel (4,0) rot 3 ·
    //   Prisma (5,5) rot 3
    // Generator sehr schwer-abzaehlen, Seed 42430 · Ausbau „sehr schwer“
    name: 'Schedir', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 3, z: 5, rot: 0 },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'source', x: 1, z: 6, dir: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 5, dir: 4, color: 'magenta' },
      { type: 'target', x: 1, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'white' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'green' },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 5, z: 4, rot: 0 },
      { type: 'mirror', x: 5, z: 2, rot: 2 },
      { type: 'mirror', x: 0, z: 2, rot: 0 },
      { type: 'prism', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'mirror', x: 6, z: 0, rot: 0 },
      { type: 'mirror', x: 4, z: 0, rot: 2 },
      { type: 'mirror', x: 2, z: 4, rot: 1, fixed: true },
      { type: 'target', x: 2, z: 1, color: 'red' },
      { type: 'prism', x: 5, z: 5, rot: 5 },
      { type: 'target', x: 6, z: 4, color: 'green' },
    ],
    solution: { '3,2': 3, '1,2': 1, '1,5': 1, '3,5': 3, '4,4': 3, '5,4': 3, '5,2': 1, '0,2': 3, '3,1': 1, '6,1': 3, '6,0': 1, '4,0': 3, '5,5': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 6 · Spiegel (0,4) rot 2 · Prisma (2,5) rot 6 · Spiegel (0,3) rot 2 ·
    //   Spiegel (3,4) rot 2 · Spiegel (4,3) rot 0 · Prisma (6,5) rot 1 · Spiegel (0,1) rot 2 ·
    //   Spiegel (1,0) rot 0 · Spiegel (5,2) rot 0 · Spiegel (6,3) rot 2
    // Generator sehr schwer-sammelstelle, Seed 51612, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Thuban', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 2, z: 6, dir: 5, color: 'red' },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'cyan' },
      { type: 'target', x: 2, z: 0, color: 'yellow' },
      { type: 'target', x: 3, z: 0, color: 'yellow' },
      { type: 'source', x: 0, z: 5, dir: 0 },
      { type: 'prism', x: 2, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'target', x: 4, z: 0, color: 'blue' },
      { type: 'source', x: 5, z: 6, dir: 5 },
      { type: 'mirror', x: 3, z: 4, rot: 1 },
      { type: 'mirror', x: 4, z: 3, rot: 2 },
      { type: 'prism', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 3, rot: 1 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'target', x: 3, z: 6, color: 'blue' },
    ],
    solution: { '3,1': 6, '0,4': 2, '2,5': 6, '0,3': 2, '3,4': 2, '4,3': 0, '6,5': 1, '0,1': 2, '1,0': 0, '5,2': 0, '6,3': 2 },
  },
  {
    // Lösung: Prisma (2,1) rot 6 · Spiegel (3,0) rot 0 · Spiegel (5,2) rot 2 · Spiegel (3,4) rot 2 ·
    //   Spiegel (4,2) rot 0 · Spiegel (4,6) rot 0 · Spiegel (1,3) rot 0 · Prisma (0,4) rot 2 ·
    //   Prisma (5,3) rot 3 · Spiegel (2,6) rot 0 · Spiegel (0,5) rot 1 · Spiegel (1,0) rot 0 ·
    //   Spiegel (0,1) rot 2
    // Generator sehr schwer, Seed 50514, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Hadar', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 6, z: 1, dir: 4 },
      { type: 'prism', x: 2, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 0, rot: 1 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'target', x: 2, z: 0, color: 'green' },
      { type: 'target', x: 5, z: 6, color: 'magenta' },
      { type: 'source', x: 6, z: 4, dir: 3 },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'yellow' },
      { type: 'mirror', x: 4, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 3, rot: 3 },
      { type: 'prism', x: 0, z: 4, rot: 0 },
      { type: 'prism', x: 5, z: 3, rot: 1 },
      { type: 'target', x: 4, z: 4, color: 'yellow' },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 0 },
      { type: 'target', x: 6, z: 5, color: 'green' },
      { type: 'mirror', x: 1, z: 0, rot: 1 },
      { type: 'mirror', x: 0, z: 1, rot: 3 },
      { type: 'target', x: 1, z: 6, color: 'red' },
    ],
    solution: { '2,1': 6, '3,0': 0, '5,2': 2, '3,4': 2, '4,2': 0, '4,6': 0, '1,3': 0, '0,4': 2, '5,3': 3, '2,6': 0, '0,5': 1, '1,0': 0, '0,1': 2 },
  },
  {
    // Lösung: Prisma (6,2) rot 4 · Spiegel (6,1) rot 1 · Spiegel (3,3) rot 1 · Prisma (4,3) rot 2 ·
    //   Spiegel (4,5) rot 1 · Spiegel (5,5) rot 1 · Spiegel (5,6) rot 3 · Spiegel (3,4) rot 0 ·
    //   Spiegel (2,3) rot 0 · Spiegel (0,5) rot 2 · Prisma (0,3) rot 7 · Spiegel (1,3) rot 1 ·
    //   Spiegel (1,5) rot 1
    // Generator sehr schwer-sammelstelle, Seed 109, Ziel 96,52–110 · ersetzt Farbmühle (Austausch „sehr schwer“)
    name: 'Konjunktion', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 6, z: 2, rot: 0 },
      { type: 'source', x: 0, z: 1, dir: 0, color: 'red' },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'source', x: 6, z: 6, dir: 6, color: 'green' },
      { type: 'target', x: 2, z: 6, color: 'red' },
      { type: 'target', x: 0, z: 2, color: 'yellow' },
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'mirror', x: 3, z: 3, rot: 0 },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'mirror', x: 3, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 3, rot: 3 },
      { type: 'mirror', x: 0, z: 5, rot: 1 },
      { type: 'source', x: 3, z: 6, dir: 5 },
      { type: 'prism', x: 0, z: 3, rot: 3 },
      { type: 'target', x: 4, z: 6, color: 'cyan' },
      { type: 'target', x: 5, z: 4, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'target', x: 1, z: 6, color: 'blue' },
    ],
    solution: { '6,2': 4, '6,1': 1, '3,3': 1, '4,3': 2, '4,5': 1, '5,5': 1, '5,6': 3, '3,4': 0, '2,3': 0, '0,5': 2, '0,3': 7, '1,3': 1, '1,5': 1 },
  },
  {
    // Lösung: Spiegel (1,1) rot 3 · Spiegel (5,0) rot 0 · Spiegel (4,3) rot 3 · Spiegel (6,2) rot 1 ·
    //   Prisma (6,3) rot 4 · Spiegel (4,4) rot 3 · Spiegel (1,4) rot 3 · Spiegel (1,5) rot 3 ·
    //   Spiegel (0,5) rot 1 · Spiegel (5,4) rot 2 · Spiegel (6,5) rot 2 · Spiegel (5,6) rot 0 ·
    //   Spiegel (2,6) rot 1 · Prisma (4,6) rot 0
    // Generator sehr schwer-mischziel, Seed 357, Ziel 90,33–90,41 · ersetzt Spiegelkabinett (Austausch „sehr schwer“)
    name: 'Weissabgleich', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 3, dir: 0, color: 'green' },
      { type: 'source', x: 6, z: 1, dir: 5, color: 'red' },
      { type: 'mirror', x: 1, z: 3, rot: 3, fixed: true },
      { type: 'mirror', x: 1, z: 1, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'target', x: 4, z: 1, color: 'white' },
      { type: 'mirror', x: 4, z: 3, rot: 1 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 0 },
      { type: 'prism', x: 6, z: 3, rot: 3 },
      { type: 'mirror', x: 4, z: 4, rot: 1 },
      { type: 'mirror', x: 1, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 5, rot: 2 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'green' },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 5, z: 6, rot: 1 },
      { type: 'source', x: 2, z: 0, dir: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 3 },
      { type: 'prism', x: 4, z: 6, rot: 6 },
      { type: 'target', x: 4, z: 5, color: 'red' },
      { type: 'target', x: 6, z: 4, color: 'red' },
    ],
    solution: { '1,1': 3, '5,0': 0, '4,3': 3, '6,2': 1, '6,3': 4, '4,4': 3, '1,4': 3, '1,5': 3, '0,5': 1, '5,4': 2, '6,5': 2, '5,6': 0, '2,6': 1, '4,6': 0 },
  },
  {
    // Lösung: Spiegel (4,6) rot 1 · Spiegel (4,2) rot 1 · Spiegel (2,2) rot 1 · Spiegel (2,6) rot 3 ·
    //   Prisma (1,2) rot 7 · Spiegel (1,1) rot 1 · Prisma (4,1) rot 1 · Spiegel (6,1) rot 3 ·
    //   Spiegel (0,0) rot 3 · Spiegel (6,0) rot 1 · Spiegel (5,0) rot 3 · Spiegel (6,5) rot 3 ·
    //   Spiegel (1,3) rot 3 · Spiegel (6,4) rot 1
    // Generator sehr schwer-abzaehlen, Seed 170, Ziel 96,18–99,16 · ersetzt Farbenrausch (Austausch „sehr schwer“)
    name: 'Dreigestirn', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 4, z: 6, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 2, z: 2, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'source', x: 4, z: 0, dir: 2, color: 'magenta' },
      { type: 'source', x: 6, z: 6, dir: 4, color: 'magenta' },
      { type: 'source', x: 0, z: 2, dir: 0, color: 'magenta' },
      { type: 'target', x: 1, z: 6, color: 'cyan' },
      { type: 'target', x: 6, z: 2, color: 'blue' },
      { type: 'target', x: 2, z: 1, color: 'magenta' },
      { type: 'prism', x: 1, z: 2, rot: 4 },
      { type: 'mirror', x: 1, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1, fixed: true },
      { type: 'prism', x: 4, z: 1, rot: 6 },
      { type: 'mirror', x: 6, z: 1, rot: 2 },
      { type: 'mirror', x: 0, z: 0, rot: 0 },
      { type: 'target', x: 2, z: 0, color: 'red' },
      { type: 'mirror', x: 6, z: 0, rot: 3 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
      { type: 'mirror', x: 5, z: 5, rot: 1, fixed: true },
      { type: 'source', x: 6, z: 3, dir: 4, color: 'green' },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 1, z: 3, rot: 2 },
      { type: 'mirror', x: 6, z: 4, rot: 2 },
      { type: 'target', x: 0, z: 4, color: 'red' },
    ],
    solution: { '4,6': 1, '4,2': 1, '2,2': 1, '2,6': 3, '1,2': 7, '1,1': 1, '4,1': 1, '6,1': 3, '0,0': 3, '6,0': 1, '5,0': 3, '6,5': 3, '1,3': 3, '6,4': 1 },
  },
  {
    // Lösung: Prisma (2,4) rot 1 · Spiegel (2,6) rot 3 · Spiegel (3,4) rot 1 · Spiegel (3,5) rot 1 ·
    //   Spiegel (5,5) rot 3 · Spiegel (1,2) rot 2 · Prisma (2,3) rot 3 · Spiegel (5,1) rot 3 ·
    //   Spiegel (0,3) rot 1 · Spiegel (0,1) rot 3 · Spiegel (5,0) rot 1 · Spiegel (6,1) rot 1 ·
    //   Prisma (6,5) rot 1 · Spiegel (4,0) rot 3
    // Generator sehr schwer-falle, Seed 534, Ziel 91,29–96,51 · ersetzt Zenit (Austausch „sehr schwer“)
    name: 'Azur', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 0, z: 4, dir: 0, color: 'magenta' },
      { type: 'prism', x: 2, z: 4, rot: 2 },
      { type: 'mirror', x: 2, z: 6, rot: 2 },
      { type: 'target', x: 0, z: 6, color: 'blue' },
      { type: 'mirror', x: 3, z: 4, rot: 3 },
      { type: 'mirror', x: 3, z: 5, rot: 3 },
      { type: 'source', x: 3, z: 0, dir: 3 },
      { type: 'mirror', x: 5, z: 5, rot: 2 },
      { type: 'mirror', x: 1, z: 2, rot: 1 },
      { type: 'prism', x: 2, z: 3, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 0 },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'mirror', x: 0, z: 1, rot: 1 },
      { type: 'mirror', x: 5, z: 0, rot: 3 },
      { type: 'mirror', x: 6, z: 1, rot: 0 },
      { type: 'target', x: 6, z: 3, color: 'red' },
      { type: 'source', x: 5, z: 6, dir: 7 },
      { type: 'prism', x: 6, z: 5, rot: 3 },
      { type: 'target', x: 6, z: 6, color: 'blue' },
      { type: 'target', x: 0, z: 5, color: 'green' },
      { type: 'mirror', x: 4, z: 0, rot: 1 },
      { type: 'target', x: 4, z: 6, color: 'blue' },
    ],
    solution: { '2,4': 1, '2,6': 3, '3,4': 1, '3,5': 1, '5,5': 3, '1,2': 2, '2,3': 3, '5,1': 3, '0,3': 1, '0,1': 3, '5,0': 1, '6,1': 1, '6,5': 1, '4,0': 3 },
  },
  {
    // Lösung: Prisma (3,1) rot 0 · Spiegel (4,0) rot 0 · Prisma (4,5) rot 1 · Spiegel (1,0) rot 0 ·
    //   Spiegel (4,2) rot 2 · Spiegel (4,6) rot 1 · Spiegel (6,6) rot 3 · Spiegel (2,2) rot 1 ·
    //   Spiegel (0,2) rot 3 · Prisma (0,3) rot 2 · Spiegel (1,4) rot 0 · Prisma (4,3) rot 1
    // Generator sehr schwer, Seed 40862 · Ausbau „sehr schwer“
    name: 'Mirfak', grad: 'sehr schwer',
    elements: [
      { type: 'source', x: 3, z: 0, dir: 2 },
      { type: 'prism', x: 3, z: 1, rot: 7 },
      { type: 'mirror', x: 4, z: 0, rot: 3 },
      { type: 'source', x: 3, z: 6, dir: 7 },
      { type: 'prism', x: 4, z: 5, rot: 7 },
      { type: 'mirror', x: 5, z: 1, rot: 0, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'magenta' },
      { type: 'target', x: 5, z: 5, color: 'magenta' },
      { type: 'source', x: 0, z: 1, dir: 7 },
      { type: 'mirror', x: 1, z: 0, rot: 2 },
      { type: 'mirror', x: 4, z: 2, rot: 3 },
      { type: 'mirror', x: 4, z: 6, rot: 0 },
      { type: 'mirror', x: 3, z: 3, rot: 2, fixed: true },
      { type: 'target', x: 4, z: 1, color: 'yellow' },
      { type: 'mirror', x: 6, z: 6, rot: 1 },
      { type: 'source', x: 2, z: 6, dir: 6 },
      { type: 'mirror', x: 2, z: 2, rot: 0 },
      { type: 'mirror', x: 0, z: 2, rot: 2 },
      { type: 'prism', x: 0, z: 3, rot: 4 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'prism', x: 4, z: 3, rot: 7 },
      { type: 'target', x: 5, z: 3, color: 'red' },
    ],
    solution: { '3,1': 0, '4,0': 0, '4,5': 1, '1,0': 0, '4,2': 2, '4,6': 1, '6,6': 3, '2,2': 1, '0,2': 3, '0,3': 2, '1,4': 0, '4,3': 1 },
  },
  {
    // Lösung: Spiegel (3,1) rot 1 · Spiegel (3,4) rot 1 · Spiegel (1,4) rot 3 · Spiegel (1,1) rot 3 ·
    //   Spiegel (4,2) rot 3 · Spiegel (6,2) rot 1 · Spiegel (6,4) rot 3 · Spiegel (0,4) rot 1 ·
    //   Prisma (3,5) rot 7 · Spiegel (6,5) rot 1 · Spiegel (5,6) rot 1 · Spiegel (5,0) rot 1
    // Generator sehr schwer-abzaehlen, Seed 101, Ziel 90,55–96,17 · ersetzt Ereignishorizont (Austausch „sehr schwer“)
    name: 'Umlaufbahn', grad: 'sehr schwer',
    elements: [
      { type: 'mirror', x: 3, z: 1, rot: 3 },
      { type: 'mirror', x: 3, z: 4, rot: 0 },
      { type: 'mirror', x: 1, z: 4, rot: 2 },
      { type: 'mirror', x: 1, z: 1, rot: 1 },
      { type: 'source', x: 1, z: 0, dir: 2, color: 'red' },
      { type: 'source', x: 3, z: 6, dir: 6 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'yellow' },
      { type: 'target', x: 1, z: 6, color: 'red' },
      { type: 'target', x: 3, z: 0, color: 'white' },
      { type: 'target', x: 0, z: 1, color: 'magenta' },
      { type: 'source', x: 4, z: 6, dir: 6, color: 'blue' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 1 },
      { type: 'mirror', x: 0, z: 4, rot: 3 },
      { type: 'prism', x: 3, z: 5, rot: 5 },
      { type: 'mirror', x: 6, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 6, rot: 3, fixed: true },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 0, rot: 0 },
    ],
    solution: { '3,1': 1, '3,4': 1, '1,4': 3, '1,1': 3, '4,2': 3, '6,2': 1, '6,4': 3, '0,4': 1, '3,5': 7, '6,5': 1, '5,6': 1, '5,0': 1 },
  },
  {
    // Lösung: Prisma (2,1) rot 0 · Spiegel (0,3) rot 2 · Prisma (1,3) rot 1 · Spiegel (4,6) rot 0 ·
    //   Spiegel (5,5) rot 2 · Spiegel (4,4) rot 0 · Spiegel (1,5) rot 3 · Spiegel (0,5) rot 1 ·
    //   Prisma (4,2) rot 7 · Spiegel (5,2) rot 1 · Spiegel (5,4) rot 1
    // Generator sehr schwer-sammelstelle, Seed 42149 · Ausbau „sehr schwer“
    name: 'Mira', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, z: 1, rot: 2 },
      { type: 'source', x: 3, z: 6, dir: 5, color: 'blue' },
      { type: 'mirror', x: 0, z: 3, rot: 0 },
      { type: 'source', x: 1, z: 0, dir: 1, color: 'yellow' },
      { type: 'target', x: 4, z: 3, color: 'magenta' },
      { type: 'target', x: 6, z: 1, color: 'cyan' },
      { type: 'source', x: 4, z: 0, dir: 3 },
      { type: 'prism', x: 1, z: 3, rot: 7 },
      { type: 'mirror', x: 4, z: 6, rot: 1 },
      { type: 'mirror', x: 5, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'target', x: 2, z: 6, color: 'green' },
      { type: 'mirror', x: 1, z: 5, rot: 1 },
      { type: 'mirror', x: 0, z: 5, rot: 2 },
      { type: 'source', x: 0, z: 2, dir: 0 },
      { type: 'prism', x: 4, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 0, color: 'green' },
      { type: 'mirror', x: 5, z: 2, rot: 3 },
      { type: 'mirror', x: 5, z: 4, rot: 3 },
      { type: 'mirror', x: 6, z: 4, rot: 3, fixed: true },
      { type: 'target', x: 0, z: 4, color: 'blue' },
    ],
    solution: { '2,1': 0, '0,3': 2, '1,3': 1, '4,6': 0, '5,5': 2, '4,4': 0, '1,5': 3, '0,5': 1, '4,2': 7, '5,2': 1, '5,4': 1 },
  },
  {
    // Lösung: Prisma (2,0) rot 3 · Spiegel (0,2) rot 2 · Spiegel (4,5) rot 3 · Spiegel (6,5) rot 1 ·
    //   Prisma (6,6) rot 4 · Spiegel (5,6) rot 1 · Spiegel (5,2) rot 3 · Spiegel (4,4) rot 0 ·
    //   Spiegel (2,6) rot 0 · Spiegel (1,5) rot 0 · Spiegel (6,2) rot 1 · Prisma (1,2) rot 7 ·
    //   Spiegel (5,1) rot 1
    // Generator sehr schwer-sammelstelle, Seed 42541 · Ausbau „sehr schwer“
    name: 'Alpheratz', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 2, z: 0, rot: 2 },
      { type: 'source', x: 6, z: 0, dir: 4, color: 'yellow' },
      { type: 'source', x: 6, z: 4, dir: 5, color: 'blue' },
      { type: 'target', x: 2, z: 4, color: 'yellow' },
      { type: 'target', x: 1, z: 0, color: 'magenta' },
      { type: 'mirror', x: 0, z: 2, rot: 3 },
      { type: 'source', x: 4, z: 6, dir: 6 },
      { type: 'mirror', x: 4, z: 5, rot: 0 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'prism', x: 6, z: 6, rot: 0 },
      { type: 'mirror', x: 5, z: 6, rot: 2 },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 4, z: 4, rot: 3 },
      { type: 'mirror', x: 2, z: 6, rot: 1 },
      { type: 'mirror', x: 1, z: 5, rot: 3 },
      { type: 'mirror', x: 6, z: 2, rot: 2 },
      { type: 'target', x: 6, z: 3, color: 'green' },
      { type: 'source', x: 0, z: 3, dir: 7 },
      { type: 'prism', x: 1, z: 2, rot: 1 },
      { type: 'mirror', x: 5, z: 1, rot: 3 },
      { type: 'target', x: 0, z: 1, color: 'blue' },
      { type: 'target', x: 0, z: 6, color: 'blue' },
    ],
    solution: { '2,0': 3, '0,2': 2, '4,5': 3, '6,5': 1, '6,6': 4, '5,6': 1, '5,2': 3, '4,4': 0, '2,6': 0, '1,5': 0, '6,2': 1, '1,2': 7, '5,1': 1 },
  },
  {
    // Lösung: Prisma (3,1) rot 3 · Spiegel (4,2) rot 2 · Prisma (5,3) rot 5 · Spiegel (5,2) rot 3 ·
    //   Spiegel (6,2) rot 1 · Spiegel (6,5) rot 3 · Prisma (0,4) rot 6 · Spiegel (2,0) rot 3 ·
    //   Spiegel (3,6) rot 1 · Spiegel (0,1) rot 3 · Spiegel (2,5) rot 1
    // Generator sehr schwer-sammelstelle, Seed 50914, Ziel 96–112 · Ausbau „sehr schwer“
    name: 'Alkaid', grad: 'sehr schwer',
    elements: [
      { type: 'prism', x: 3, z: 1, rot: 0 },
      { type: 'source', x: 6, z: 1, dir: 4, color: 'red' },
      { type: 'source', x: 0, z: 6, dir: 7, color: 'cyan' },
      { type: 'mirror', x: 4, z: 2, rot: 0 },
      { type: 'target', x: 3, z: 4, color: 'magenta' },
      { type: 'target', x: 1, z: 3, color: 'white' },
      { type: 'source', x: 5, z: 6, dir: 6 },
      { type: 'prism', x: 5, z: 3, rot: 3 },
      { type: 'mirror', x: 2, z: 1, rot: 1, fixed: true },
      { type: 'mirror', x: 5, z: 2, rot: 1 },
      { type: 'mirror', x: 6, z: 2, rot: 3 },
      { type: 'mirror', x: 6, z: 5, rot: 0 },
      { type: 'mirror', x: 4, z: 5, rot: 3, fixed: true },
      { type: 'mirror', x: 4, z: 6, rot: 3, fixed: true },
      { type: 'target', x: 6, z: 0, color: 'cyan' },
      { type: 'source', x: 2, z: 6, dir: 5 },
      { type: 'prism', x: 0, z: 4, rot: 0 },
      { type: 'mirror', x: 2, z: 0, rot: 1 },
      { type: 'mirror', x: 3, z: 6, rot: 2 },
      { type: 'mirror', x: 0, z: 1, rot: 0 },
      { type: 'mirror', x: 2, z: 5, rot: 0 },
      { type: 'target', x: 4, z: 4, color: 'green' },
    ],
    solution: { '3,1': 3, '4,2': 2, '5,3': 5, '5,2': 3, '6,2': 1, '6,5': 3, '0,4': 6, '2,0': 3, '3,6': 1, '0,1': 3, '2,5': 1 },
  },
];

/**
 * Würfel-Level (LEVELS_3D der Spiellogik): { name, dim: 3, size, height?, grad, hint?,
 * elements: [{ type, x, y, z, axis?, dir?, rot?, color?, fixed? }], solution: { "x,y,z": rot bzw. dir } }. y ist die
 * Ebene (0 = unten), axis die Drehachse (Standard 'y', siehe AXES). grad wie in FLACH; entlang der Reihenfolge sinkt er
 * nie. Seit Noas Geschichte liegen alle im Vorrat (tools/vorrat.mjs). Getrennt von FLACH, damit die Werkzeuge der
 * Levelliste (tools/ordne-level.mjs) unberührt bleiben. Reihenfolge und Grade schreibt tools/ordne-wuerfel.mjs
 * (.scratch/wuerfel-500/).
 */
const WUERFEL = [
];

/**
 * Noas Geschichte (Spec .scratch/noa-geschichte/, «Daten»): je Grad die 6 Welten in der Reihenfolge der Kapitel
 * (STORY_CHAPTERS: Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne), je mit den Schlüsseln (name) ihrer 10 Level in der
 * Reihenfolge des Durchgangs (STORY_LEVELS der Spiellogik). Die Level stehen in FLACH; den Titel, den das Spiel zeigt,
 * hat die Übersetzungsschicht (src/texte/, Bereich titel). Diesen Block schreibt tools/geschichte.mjs spiel (aus
 * tools/geschichte/wahl.json).
 */
const REISE = {
  'leicht': [
    // Bergwald
    ['Wasserfarbe', 'Lichtblick', 'Umlenkung', 'Tönung', 'Rundgang', 'Taschenlampe', 'Farbsieb', 'Lichtpunkt', 'Kehre',
     'Gegenlicht'],
    // Meer
    ['Fingerzeig', 'Schneeflocke', 'Regenbogen', 'Kreidestrich', 'Papierflieger', 'Funke', 'Kerzenschein', 'Glimmer',
     'Wegmarke', 'Farbstift'],
    // Wüste
    ['Fächer', 'Farbklecks', 'Glanzpapier', 'Spiegelgasse', 'Grasgrün', 'Zwillinge', 'Fackel', 'Glanzpunkt',
     'Frühlicht', 'Gabelung'],
    // Vulkan
    ['Strahlteiler', 'Lichtschalter', 'Glühbirne', 'Fackellauf', 'Abzweigung', 'Schaukel', 'Hellblau', 'Brechpunkt',
     'Kurve', 'Kirschrot'],
    // Planeten
    ['Lichtfleck', 'Torbogen', 'Morgentau', 'Querschläger', 'Amethyst', 'Lichtkugel', 'Sternchen', 'Kreisel',
     'Fensterglas', 'Sonnenblume'],
    // Sterne
    ['Farbspiel', 'Rosenrot', 'Tautropfen', 'Schliff', 'Glasperle', 'Zusammenfluss', 'Fernlicht', 'Blitz', 'Lindgrün',
     'Rutschbahn'],
  ],
  'mittel': [
    // Bergwald
    ['Enzian', 'Bronze', 'Krokus', 'Weissglut', 'Dreiklang', 'Bachlauf', 'Titan', 'Europa', 'Lichtfeder', 'Malachit'],
    // Meer
    ['Meeresleuchten', 'Farbtafel', 'Spektrum', 'Granat', 'Brillenglas', 'Ganymed', 'Kobalt', 'Bergsee', 'Deimos',
     'Gipfelkreuz'],
    // Wüste
    ['Sonnenuhr', 'Mondstein', 'Brennpunkt', 'Spiegeltreppe', 'Farbton', 'Onyx', 'Silhouette', 'Lichtgitter',
     'Hängebrücke', 'Halbmond'],
    // Vulkan
    ['Lichtkreuz', 'Intarsie', 'Neumond', 'Aquamarin', 'Mondfinsternis', 'Seidenglanz', 'Merkur', 'Perlglanz',
     'Sternschnuppe', 'Sonate'],
    // Planeten
    ['Kaskade', 'Ranke', 'Abenddämmerung', 'Fernrohr', 'Rückspiegel', 'Mars', 'Lagune', 'Arabeske', 'Wechselspiel',
     'Kupferglanz'],
    // Sterne
    ['Silberstreif', 'Walzer', 'Regenschauer', 'Glasharfe', 'Laterna magica', 'Doppelstern', 'Gleichgewicht',
     'Farbverlauf', 'Kristall', 'Glasfaser'],
  ],
  'schwer': [
    // Bergwald
    ['Passstrasse', 'Irrgarten', 'Oase', 'Steinkreis', 'Observatorium', 'Wegweiser', 'Stabübergabe', 'Gipfelsturm',
     'Polarfahrt', 'Expedition'],
    // Meer
    ['Windjammer', 'Segeltörn', 'Weltreise', 'Dreimaster', 'Gambit', 'Kreuzfahrt', 'Steilwand', 'Gordischer Knoten',
     'Schatzkarte', 'Nordwand'],
    // Wüste
    ['Minotaurus', 'Kaperfahrt', 'Mäander', 'Pilgerweg', 'Biwak', 'Seekarte', 'Kompassnadel', 'Abkürzung',
     'Fata Morgana', 'Springergabel'],
    // Vulkan
    ['Planetarium', 'Rätselturm', 'Leuchtfeuer', 'Basislager', 'Zauberwürfel', 'Sphinx', 'Rosette', 'Seeschlange',
     'Spieluhr', 'Automaton'],
    // Planeten
    ['Puzzlestück', 'Taschenuhr', 'Räderwerk', 'Odyssee', 'Kopfnuss', 'Sanduhr', 'Ariadnefaden', 'Schatztruhe',
     'Denksport', 'Lotsenboot'],
    // Sterne
    ['Spiegelsaal', 'Maskerade', 'Jakobsweg', 'Zugbrücke', 'Gebirgspfad', 'Halo', 'Kalenderstein', 'Ankerplatz',
     'Hafeneinfahrt', 'Höhenweg'],
  ],
  'sehr schwer': [
    // Bergwald
    ['Kanopus', 'Sternenstaub', 'Fomalhaut', 'Kapella', 'Ankaa', 'Albireo', 'Lichtfächer', 'Dubhe', 'Diphda', 'Alioth'],
    // Meer
    ['Kastor', 'Aldebaran', 'Hamal', 'Sirius', 'Atair', 'Spiralnebel', 'Alhena', 'Lichtkegel', 'Umlaufbahn',
     'Weissabgleich'],
    // Wüste
    ['Morgenröte', 'Enif', 'Pollux', 'Kochab', 'Leitstern', 'Gravitation', 'Rigel', 'Menkar', 'Mintaka', 'Sadr'],
    // Vulkan
    ['Merak', 'Nunki', 'Mizar', 'Alkor', 'Izar', 'Prokyon', 'Saiph', 'Orion', 'Gezeitenkraft', 'Beteigeuze'],
    // Planeten
    ['Markab', 'Algol', 'Bellatrix', 'Azur', 'Achernar', 'Schedir', 'Alnilam', 'Megrez', 'Magellanwolke', 'Thuban'],
    // Sterne
    ['Hadar', 'Alphard', 'Wezen', 'Kassiopeia', 'Alpheratz', 'Dreigestirn', 'Konjunktion', 'Alkaid', 'Mirfak', 'Mira'],
  ],
};

export { UEBUNGEN, FLACH, WUERFEL, REISE };
