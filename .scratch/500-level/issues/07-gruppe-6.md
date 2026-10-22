# 07: Gruppe 6 (360 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 5 / 19 / 8 / 3. Danach stehen 360 Level im Spiel: 63 / 189 / 76 / 32.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 06

**Status:** done

- [x] 35 neue Level im Spiel, je Grad wie oben; Fehlmengen eines Grads sind begründet und für die nächste Gruppe
      vermerkt.
- [x] Jedes neue Level hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee und ist
      keinem anderen Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt (Protokoll); von beiden abgelehnte sind ersetzt.
- [x] Namen im bisherigen Stil vergeben, eindeutig, keiner von der Liste entfernter Level (ohne Freigabe des Nutzers).
- [x] Herkunft jedes Levels (Auftrag, Seed, Ziel-Schwierigkeit) ist nachbaubar.
- [x] Golden-Test-Referenz nachgeführt, alle Tests grün, Stichproben der Screenshots geprüft, auf main gemergt.

## Comments

## Comments

**Runde `ausbau-6` (Wahl):** keine Wahl ohne Fehler. Gruppe 6 hätte nur 5 neue schwere Level (sie gleicht die 3
zusätzlichen aus Gruppe 5 aus); offen blieben je 2–4 Häufungen, vor allem zwischen Leveln aus Bestand und früheren
Gruppen im Bereich „schwer“ (271–280 „Farben abzählen“: Tandem, Supernova, Seilschaft; 311–320 „Abschalten“ oder
„Sammelstelle“; 341–350 „Falle“). **Entscheid (selbst):** Die Verschiebung bleibt in dieser Gruppe
(`--verschiebe mittel:-3,schwer:3`, also 8 neue schwere); ausgeglichen wird in einer späteren Gruppe, spätestens in
Gruppe 9 (Gruppe 10 darf nicht verschieben).

**Runde `ausbau-6-2`** (mit `mittel:-3,schwer:3`): wieder keine Wahl ohne Fehler; auch Züge bis 10 Plätze lösten die
Häufungen nicht. Grund (gezählt): Ab „schwer“ hat fast jedes Level eine von fünf Haupt-Kernideen; mit höchstens 2 je
Seite muss jede Seite genau 2 von jeder haben, und die Seiten 261–360 waren schon fast genau so gepackt. Jedes neue
Level und jede Korrektur bricht das. Die sechste Haupt-Kernidee „Lockvogel“ hilft nicht: von 107 Kandidaten bestehen
nur 2 die Filter (fast alle zerfallen in zwei Teile).

**Entscheid des Nutzers (22.10.2026):** Im Ausbau gilt ab „schwer“ höchstens 3-mal dieselbe Haupt-Kernidee je 10 Level
(wenn alle Level der Häufung „schwer“ oder „sehr schwer“ sind); „leicht“ und „mittel“ bleiben bei 2. Umgesetzt als
`HAUPT_KERNIDEE_JE_10_OBEN`, `GRADE_OBEN`, `obenIn` in `tools/levelliste.mjs` (Häufungsregel, Zählung), in
`tools/ausbau.mjs` (Fenster der Wahl) und im Test der Levelliste; ohne Ausbau unverändert. Weil die Häufungsregel nun
weniger Züge braucht, ordnet sich die Reihenfolge der Level im Spiel beim Schreiben der Gruppe leicht anders. Die
Verschiebung `mittel:-3,schwer:3` entfällt damit wieder; Gruppe 6 folgt der Tabelle.

**Runden danach:** `ausbau-6-3` (Wahl mit der neuen Regel, alle sechs Startwerte ohne Fehler; 21 beurteilt, keines
abgelehnt oder schwach, 13 Korrekturen); beim Schreiben blieb auf 191–200 „Sammelstelle“ 4-mal offen (mittel, Grenze 2).
Vorrat `ausbau-v-mittel`: 40 Kandidaten „mittel“, je Haupt-Kernidee höchstens 10, keiner abgelehnt oder schwach. Danach
fand die Wahl nur über beurteilte Kandidaten (`ausbau-6-4`) beim ersten Startwert eine Wahl ohne Fehler.
Ein Name fiel im Test durch: „Quelle“ steht als Element im Feldtext der KI-Tester (der Name verriete das Level);
ersetzt durch „Gebirgsbach“, der übrige Namensvorrat enthält kein solches Wort.

**Ergebnis (22.10.2026, Branch `ausbau/07-gruppe-6`)**

- **Im Spiel:** 360 Level, 63 / 189 / 76 / 32, genau nach der Tabelle (die Verschiebung aus
  Gruppe 5 ist ausgeglichen).
- **Neu:** Papierflieger, Drachenschnur, Windspiel, Schaukel, Rutschbahn (leicht); Strömung, Wasserspiel,
  Springbrunnen, Wasserfall, Gebirgsbach, Bachlauf, Flussbett, Mündung, Fjord, Gletscher, Eiskristall, Raureif,
  Nordlicht, Polarstern, Morgenstern, Venus, Merkur, Mars, Saturn, Jupiter, Neptun, Uranus (mittel); Wehrgang,
  Turmzimmer, Minotaurus, Ariadnefaden, Sphinx (schwer); Spica, Regulus, Plejaden (sehr schwer).
- **KI-Tester:** alle 35 beurteilt (`ausbau-6-3`, `ausbau-v-mittel`, `ausbau-v-oben` und frühere), keines abgelehnt
  oder schwach im Spiel.
- **Werkzeug:** Häufungsregel im Ausbau ab „schwer“ bis 3 je 10 (Entscheid des Nutzers, siehe oben); `vorrat.mjs`
  (Hilfsskript, nicht im Repo) für Vorräte je Grad, reihum über die Haupt-Kernideen.
- **Tests:** Logik 1178, Levelliste 54, KI-Tester 65, Golden 369 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Gletscher (135, Desktop) und Minotaurus (291, Handy), ohne Befund.
