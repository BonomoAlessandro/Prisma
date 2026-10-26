# 04: Würfel-Gruppe 3 (75 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2.
Danach stehen 75 neue Würfel-Level im Spiel: 13 / 40 / 16 / 6 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 03

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

- 2026-10-24: Erledigt. 25 neue Würfel-Level, 4 / 13 / 6 / 2; im Spiel jetzt 75 neue (13 / 40 / 16 / 6) und Aufzug und Kern.
  - leicht: Schublade, Kommode, Hängematte, Stockwerk
  - mittel: Refektorium, Flur, Geländer, Terrasse, Gebälk, Giebel, Burghof, Portikus, Kemenate, Loggia, Fachwerk, Brüstung, Kolonnade
  - schwer: Kolosseum, Stufenpyramide, Klosteranlage, Burganlage, Tempelanlage, Pantheon
  - sehr schwer: Möbiusband, Klein-Flasche
- KI-Tester (Lauf wuerfel-3, Anker W2): Beide sahen alle vier Bilder je Level und Anker, das verlangt der Auftrag an die Agents jetzt ausdrücklich. Keine Ablehnung. Korrekturen bis ±5 Plätze, diesmal öfter nach hinten (schwerer als die Formel). A legte einmal per Shell den Antwortordner an; das ist ohne Einfluss auf die Urteile.
- Dauer: Wahl 187 s; Bilder 65 min für 33 Level (die Anker werden neu aufgenommen, weil index.html sich ändert); KI-Tester je 11–14 min.
- Review Ticket 03: keine echten Fehler. 6 Level aus Gruppe 2 kommen auf ihrem Stand gleich heraus, ohne den Stand gar nicht. standDesCodes ist robuster geworden (8e67a1c).
  - Hinweis: In anchors-wuerfel.json nennt der Text zu W2 „Treppenhaus −4“, das Protokoll −2. Das bleibt so stehen, weil es in den Fingerabdruck von W2 eingeht.
  - Ähnliche Namen (Treppe…, …halle, Dach…) sind aus dem Vorrat genommen. Für mittel sind neue, klar verschiedene dazugekommen.
