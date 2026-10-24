# 03: Würfel-Gruppe 2 (50 neue Level)

**What to build:** 25 neue Würfel-Level 7 × 7 × 7 aus dem Generator, nach dem Ablauf einer Gruppe in der Spec. Neu je
Grad (leicht / mittel / schwer / sehr schwer): 4 / 14 / 5 / 2.
Danach stehen 50 neue Würfel-Level im Spiel: 9 / 27 / 10 / 4 (dazu Aufzug und Kern).

**Spec:** ../spec.md, Abschnitte „Vorgehen in kleinen Gruppen“ und „Ablauf einer Gruppe“.

**Blocked by:** 02

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

- 2026-10-24: Erledigt. 25 neue Würfel-Level, 4 / 14 / 5 / 2; im Spiel jetzt 50 neue (9 / 27 / 10 / 4) und Aufzug und Kern.
  - leicht: Kellertreppe, Hinterhof, Gartenhaus, Briefkasten
  - mittel: Empore, Gewächshaus, Brückenbogen, Bergfried, Zinnen, Schiessscharte, Wendelgang, Treppenabsatz, Zwischengeschoss, Dachgaube, Vorhalle, Eingangshalle, Foyer, Korridor
  - schwer: Festung, Wolkenkratzer, Kathedralenkuppel, Glaspalast, Schlossanlage
  - sehr schwer: Escher, Penrose-Treppe
- **Würfel-Anker W2** (36fcd9b): je Grad zwei Level aus Gruppe 1, eines am unteren, eines am oberen Ende. Es sind Bauklotz, Kern, Galerie, Laubengang, Zitadelle, Basilika, Hyperwürfel und Tesserakt; Level, die die KI-Tester verschoben hatten, sind keine Anker. Die Würfel-Tests der KI-Tester hängen nicht mehr an der aktuellen Version (abc6ab1).
- **Herkunft mit Stand des Codes** (03ce677, Befund des Reviews von Ticket 02): Seit dem Plattform-Fix 0d0edd0 baut ein Seed ein anderes Level. Darum trägt jede Pool-Zeile den Commit, mit dem sie gebaut ist, und der Kommentar des Levels nennt ihn.
  - Pool-1, pool-2-mittel und pool-2-sehr-schwer sind auf 33f26f8 gebaut, pool-2-schwer auf 0d0edd0. Geprüft mit je 6 Stichproben, die auf ihrem Stand alle gleich herauskommen und auf dem anderen nicht.
  - Gruppe 1 ist nachgetragen. Der Test verlangt den Stand als Commit.
- **KI-Tester:** Beide sahen zuerst nur das Desktop-Bild. Auf Nachfrage sahen sie alle Bilder; A ergänzte auch die Bilder der Anker. Geändert hat das nur Lesbarkeit und Aha (je 8 Urteile), bei A ausserdem L15 (A7 → A6-A7, jetzt ganz gelöst). Keine Ablehnung.
  - Korrekturen: Viele mittlere Kandidaten finden beide leichter als die Formel, bis 5 Plätze nach vorn; zwei schwere nach hinten (+1, +5).
  - Ab Gruppe 3 verlangt der Auftrag an die Agents alle Bilder ausdrücklich.
- **Dauer:**
  - Wahl 144 s, aus 4210 Kandidaten (in Frage 1116).
  - Bilder 81 min für 33 Level, mit den neuen Ankern.
  - KI-Tester je 11–12 min, dazu 2–4 min für das Nachholen der Bilder.
- **Namen:** Der Würfel-Vorrat ist erweitert (Bauten, Räume, Bauwerke; für sehr schwer Raum und Geometrie). Danach liegen 29 / 65 / 21 / 16 Namen bereit.
