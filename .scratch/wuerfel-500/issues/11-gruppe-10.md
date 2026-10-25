# 11: Würfel-Gruppe 10 (250 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 14 / 5 / 2.
Danach stehen 250 neue Würfel-Level im Spiel: 43 / 133 / 52 / 22. Aufzug und Kern sind nicht mehr im Spiel (Entscheid vom 25.10.2026).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 10

**Status:** resolved

- [x] 25 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig über flache und Würfel-Level, keiner von der Liste entfernter Level
      (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf `feature/3d-wuerfel`
      gepusht.

## Comments

**25.10.2026, Agent:** Gruppe 10 steht im Spiel: 25 neue Würfel-Level (4 / 14 / 5 / 2). Zusammen sind es jetzt 250
(43 / 133 / 52 / 22).
- **Wahl:** Die erste Wahl (wahl-10) liess keine Häufung offen. Nach den Korrekturen der Tester blieben aber Seite 9
  mit Abschalten 6-mal und Seite 10 mit Sammelstelle 4-mal. Ersetzt wurden 4100b3ff, b09e40f2 und c0fd7282
  (wahl-10b, Lauf wuerfel-10-2). Danach rückte der Ersatz 2b43ea8c (Sammelstelle, −5) auf Seite 10, auch er ist
  ersetzt (wahl-10c, Lauf wuerfel-10-3). Danach blieb keine Häufung offen.
- **KI-Tester (wuerfel-10, -10-2, -10-3):** 29 Kandidaten beurteilt, keiner von beiden abgelehnt. B nennt bei Ewige
  Wiederkehr „Knäuel“, A nicht. Am Handy schwach lesbar (2 von 5): Ewige Wiederkehr und Xanadu bei beiden, Isfahan
  bei B. Kein Aha für A bei Radiergummi und Teddybär (beide leicht).
- **Namen nach Review 10:** umbenannt Spinnrad → Gobelin (Grundwort …rad wie Zahnrad), Konsolfries → Kupferstich
  (nah an Konsole), Bibliothekar → Sekretär (nah an Bibliothek von Babel), Wollknäuel → Nudelholz („Knäuel“ ist ein
  Begriff der Beurteilung), Kerzenleuchter → Ochsenauge (nah an Kerzenlicht, Kerzenschein). Die Grundwort-Prüfung
  kennt jetzt auch …rad.
- **Namen der Gruppe:** Von Hand ersetzt wurden Goldschmied (nah an Schmiede), Blasebalg (zu Amboss und Schmiede),
  Gummistiefel (zweites …gummi neben Radiergummi) sowie Triglyphe, Akanthus und Volute. Diese drei sind Bauornamente
  wie Metope und Kapitell. Der Vorrat für „mittel“ ist fast leer: Die meisten Namen darin scheitern am Grundwort
  (…haus, …erei, …werk). Vor Gruppe 11 stocke ich ihn auf.
- Golden nachgeführt, alle Tests grün. Stichproben der Screenshots stammen aus den Bildern der Tester.

**25.10.2026, Review:** Geprüft auf 1df6ca5 (Merge von eecb241).
- **Herkunft:** Krabbe (mittel-abzaehlen, Seed 20285, Stand 33f26f8) und Lalibela (schwer-abzaehlen, Seed 20550,
  Stand 0d0edd0) mit `tools/ausbau.mjs pool … --wuerfel` auf dem Stand aus `git archive` nachgebaut; der Abdruck
  stimmt (9f1264df, 5537bb72).
- **Urteile:** Alle 25 neuen haben ein zählendes Urteil (22 aus wuerfel-10, Supraporte und Deckenfresko aus
  wuerfel-10-2, Krabbe aus wuerfel-10-3), keines von beiden abgelehnt; B nennt bei Ewige Wiederkehr Knäuel, das zählt
  allein nicht. 4100b3ff, b09e40f2, c0fd7282 und 2b43ea8c stehen nicht im Spiel.
- **Häufung:** keine offen. Seiten 9 und 10 stehen genau an der Grenze 3 (alle Level ab „mittel“): Seite 9 Farben
  abzählen, Sammelstelle und Abschalten je 3, Seite 10 Farben abzählen, Abschalten und Sammelstelle je 3.
- **Grade:** 43 / 133 / 52 / 22 wie bestandNach(10). `tests/wuerfelliste.test.mjs`: 12 Tests bestanden,
  `tests/ki-tester.test.mjs`: 83 Tests bestanden.
- **Namen:** eindeutig, keiner von der Liste entfernter Level, die fünf Umbenennungen sind in Ordnung bis auf
  Kupferstich (unten). Offen für den Koordinator (das Review ändert index.html nicht):
  - **Zinngießer** ist der einzige Name mit „ß“; alle anderen schreiben „ss“ (Schiessscharte, Weisser Zwerg). Dazu
    Zinn… wie Zinnen (Würfel, Seite 10) und Zinnober (flach). Vorschlag: neuer Name.
  - **Deckenfresko** (Platz 91) und **Kassettendecke** (Platz 86) tragen beide „Decke“, auf derselben Seite 9.
  - **Kandelaber** ist inhaltlich so nah an Kerzenlicht und Kerzenschein wie das eben umbenannte Kerzenleuchter.
  - **Kupferstich** (aus der Umbenennung) teilt „Kupfer“ mit Kupferglanz (flach) und klingt wie Pinselstrich und
    Kreidestrich (flach).
  - Kleiner: Kai ist inhaltlich nah an Hafenmole und Hafenkran. Krabbe und Wimperg (Platz 81/82) sind gotische Bauzier
    wie Fiale, obwohl Triglyphe, Akanthus und Volute aus diesem Grund ersetzt wurden. Drehorgel trägt das Grundwort
    von Lichtorgel (entfernt, nicht im Spiel). Nudelholz/Holzkiste und Siegelring/Ringmauer teilen ein Wort, einmal
    als Grund-, einmal als Bestimmungswort.
