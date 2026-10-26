# 07: Würfel-Gruppe 6 (150 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 14 / 5 / 2.
Danach stehen 150 neue Würfel-Level im Spiel: 26 / 80 / 31 / 13 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 06

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

- 2026-10-25: Erledigt. 25 neue Würfel-Level, 4 / 14 / 5 / 2; im Spiel jetzt 150 neue (26 / 80 / 31 / 13) und Aufzug und Kern.
  - leicht: Regal, Garderobe, Haustür, Kleiderschrank
  - mittel: Ringmauer, Grotte, Gesims, Nische, Palisade, Kapelle, Stadttor, Kartause, Einsiedelei, Abtei, Lettner, Alkoven, Kasematte, Lisene
  - schwer: Machu Picchu, Angkor Wat, Hagia Sophia, Notre-Dame, Sagrada Familia
  - sehr schwer: Mandelbrot, Fraktal
- Häufungsregel: Die erste Wahl liess Häufungen offen (Seite 3 und 6 „Sammelstelle“), die nur aus Leveln im Spiel bestanden, weil die neuen sie über die Seitengrenzen schoben. `wuerfel.mjs wahl` tauscht jetzt auch gewählte Kandidaten ausserhalb der Häufung (bis TAUSCH_NAH = 400 Ersatz je Kandidat, die nach der Schwierigkeit nächsten zuerst) und zählt einen Tausch schon, wenn die offenen Häufungen zusammen kleiner werden. Damit keine offen.
- KI-Tester (Lauf wuerfel-6, Anker W2): keine Ablehnung beider (B: Zerfall bei einem mittleren Level, A nicht). Die Korrekturen der Tester öffneten zwei neue Häufungen (Seite 6 Sammelstelle, Seite 7 Abschalten); die zwei beteiligten Kandidaten (9d64221d, 3a076001) sind ersetzt, Lauf wuerfel-6-2 (dd579855, afe5ef39), beide angenommen.
- B fand ein Level nicht lösbar im Kopf (L5, A8); der Löser bestätigt genau eine Lösung.
- Review Ticket 06: Kaminzimmer (wie Turmzimmer) → Taubenschlag, Persepolis (wie Akropolis) → Petra. Der Namensvorrat enthielt noch Namen flacher Level (Schaukel, Pagode, Arkade …): gestrichen, Vorrat jetzt gegen alle Namen im Spiel geprüft.
- In einer Ebene liegen jetzt 22 von 152 Würfel-Levels (Frage an den Nutzer offen, siehe Ticket 06).
- Dauer: Wahl 5–7 min (mehrere Läufe), Bilder 29 min, KI-Tester 10–16 min; Ersatz: Bilder 7 min (Anker aus dem Zwischenspeicher), Tester je 3 min.
