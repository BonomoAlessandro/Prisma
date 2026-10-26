# 05: Würfel-Gruppe 4 (100 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 5 / 3.
Danach stehen 100 neue Würfel-Level im Spiel: 17 / 53 / 21 / 9 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 04

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

## Comments

- 2026-10-24: Erledigt. 25 neue Würfel-Level, 4 / 13 / 5 / 3; im Spiel jetzt 100 neue (17 / 53 / 21 / 9) und Aufzug und Kern.
  - leicht: Kartonschachtel, Holzkiste, Wäscheleine, Fensterbank
  - mittel: Vierung, Seitenflügel, Kornspeicher, Mittelbau, Strebepfeiler, Sakristei, Chorraum, Kassettendecke, Apsis, Archiv, Scheune, Mittelschiff, Passage
  - schwer: Campanile, Hängende Gärten, Mausoleum, Amphitheater, Minarett
  - sehr schwer: Vierte Dimension, Babylon, Atlantis
- KI-Tester (Lauf wuerfel-4, Anker W2): beide sahen alle vier Bilder je Level und Anker. Nur B nannte einen Begriff (Füllteil bei einem leichten Level), also keine Ablehnung. Fünf grosse Level lösten beide nur zum Teil im Kopf und ordneten sie über die Anker ein.
- Fehler gefunden und behoben: Zwei leichte Level mit gleichem Wert (Fensterbank, Hinterhof) tauschten bei jedem Ordnen den Platz, weil bei Gleichstand die Reihenfolge in index.html entschied und die Korrektur der Tester davon abhängt. Im Würfel entscheidet jetzt der Abdruck (`gleichstand` in reihenfolge/fuegeEin, Test in levelliste.test.mjs); zweimal Ordnen gibt dasselbe. Die flache Liste ist unverändert.
- Review Ticket 04: keine Datenfehler, Nachbau auf dem Stand bestätigt. Ähnliche Namen umbenannt: Burganlage → Kreml, Tempelanlage → Parthenon, Stufenpyramide → Akropolis, Terrasse → Orangerie, Burghof → Barbakane; Vorrat um ähnliche Namen bereinigt, Regel in der Spec (Schritt 5). Dass die Korrektur vom Platz der Formel aus rechnet, nicht vom Platz der Vorschau, steht jetzt in der Spec (Schritt 4).
- Dauer: Bilder 71 min für 33 Level, KI-Tester je 10–11 min.
