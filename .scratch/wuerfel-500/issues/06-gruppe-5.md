# 06: Würfel-Gruppe 5 (125 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 5 / 13 / 5 / 2.
Danach stehen 125 neue Würfel-Level im Spiel: 22 / 66 / 26 / 11 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 05

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

- 2026-10-25: Erledigt. 25 neue Würfel-Level, 5 / 13 / 5 / 2; im Spiel jetzt 125 neue (22 / 66 / 26 / 11) und Aufzug und Kern.
  - leicht: Klettergerüst, Schuhkarton, Fensterladen, Gartenzaun, Hundehütte
  - mittel: Werkstatt, Silo, Brückenkopf, Stallung, Atelier, Remise, Schanze, Stauwehr, Bastion, Kontor, Kaminzimmer, Fähre, Wäscherei
  - schwer: Felsendom, Baptisterium, Alhambra, Stupa, Torii
  - sehr schwer: Ikosaeder, Bibliothek von Babel
- KI-Tester (Lauf wuerfel-5, Anker W2): beide sahen alle Bilder. Ein sehr schweres Level lehnten beide als Knäuel ab (Kandidat 4ea06aa4); Ersatz über `wahl --behalte … --ohne …`, beurteilt im Lauf wuerfel-5-2 (Kandidat bd81156b, A6/A6-A7, angenommen). B nannte Füllteil bei einem mittleren Level, A nicht: bleibt.
- B merkte an, dass zwei Kandidaten ganz in einer Ebene liegen. Im Spiel liegen damit 20 von 127 Würfel-Levels in einer waagrechten Ebene (darunter der Anker Galerie). Eine Regel dagegen gibt es nicht; die Frage liegt beim Nutzer.
- Review Ticket 05: bestanden; der Reviewer prüft den Fixpunkt der Reihenfolge jetzt auch mit umgedrehter Eingabe (1dee403). Grenzfall Hängende Gärten (Garten wie Irrgarten, Wintergarten) umbenannt in Persepolis.
- Namensvorrat aufgestockt; Namen von der Liste entfernter Level (Unendlichkeit, Laterne, Leuchtturm) daraus gestrichen, Hyperraum (neben Hyperwürfel) auch.
- Dauer: Wahl 320 s, Bilder 87 min (der Reviewer lief gleichzeitig), KI-Tester 10–16 min; Ersatz: Wahl 246 s, Bilder 22 min, Tester je 2–3 min.
