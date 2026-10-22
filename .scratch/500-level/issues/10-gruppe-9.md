# 10: Gruppe 9 (465 Level)

**What to build:** 35 neue Level aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je Grad (leicht /
mittel / schwer / sehr schwer): 5 / 19 / 8 / 3. Danach stehen 465 Level im Spiel: 79 / 246 / 98 / 42.

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 09

**Status:** resolved

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

**Ergebnis (22.10.2026, Branch `ausbau/10-gruppe-9`)**

- **Wahl:** `ausbau-9` nur über beurteilte Kandidaten (Vorräte) fand beim ersten Startwert eine Wahl ohne Fehler,
  ohne neue Korrekturrunde.
- **Im Spiel:** 465 Level, 79 / 246 / 98 / 42, genau nach der Tabelle.
- **Neu:** Funke, Glimmer, Morgenlicht, Frühlicht, Hellblau (leicht); Krokus, Enzian, Edelweiss, Alpenglühen, Bergsee, Gipfelkreuz, Passhöhe, Hängebrücke, Viadukt, Aquädukt, Kreuzgang, Arkade, Kuppel, Gewölbe, Säulenhalle, Rundbogen, Spitzbogen, Laterna magica, Camera obscura (mittel); Getriebe, Zahnrad, Spieluhr, Automaton, Taschenuhr, Sanduhr, Wasseruhr, Kalenderstein (schwer); Weisser Zwerg, Neutronenstern, Schwarzes Loch (sehr schwer).
- **KI-Tester:** alle 35 aus den Vorräten beurteilt, keines abgelehnt oder schwach.
- **Werkzeug:** keine Codeänderung, darum kein Review.
- **Tests:** Logik 1493, Levelliste 54, KI-Tester 65, Golden 474 (nach `--write`), Beurteilung 178, alle grün.
  Stichprobe: Viadukt (204, Desktop) und Spieluhr (385, Handy). Bei Viadukt leuchtet in der Startstellung schon
  ein Ziel (1/4); das kommt auch im Bestand vor (12 Level, etwa Fackellauf, Weissglut), also kein Befund.
- **Vorrat für Gruppe 10:** `ausbau-v2` mit 20 leichten, 20 mittleren und 12 sehr schweren Kandidaten in Arbeit.
