# 06: Würfel-Gruppe 3 in 7 × 7 × 5 (150 Level)

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2. Danach im Spiel: 28 / 82 / 28 / 12.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 150 Würfel-Level, je Grad 28 / 82 / 28 / 12, wie in der Tabelle.

- **Wahl:** 4 / 13 / 6 / 2, mit 7 Tauschen gegen Häufungen.
  - Darunter war wieder Kandidat a1f97f10, der in Gruppe 2 ersetzt wurde (nur ein Strang, Füllteil). Er hatte schon ein Urteil, darum beurteilten die Tester in wuerfel-3-q nur 24. Er ist ersetzt.
  - Ab jetzt läuft jede Wahl mit `--ohne "$(cat tests/output/quader/ohne.txt)"`. Die Liste enthält a1f97f10 und d155f557.
- **KI-Tester:** wuerfel-3-q, 24 Kandidaten, keiner abgelehnt.
- **Ersatz für a1f97f10:** Mit dem Ersatz blieb auf Seite 11 „Sammelstelle“ 4-mal offen. Die Korrekturen der Tester an den gesetzten Kandidaten hatten d155f557 dorthin geschoben.
  - Darum ist auch d155f557 ersetzt. Er war unauffällig und wurde nur wegen der Häufung ersetzt.
  - Die beiden Ersatzlevel 12b0315e (leicht) und 796e71df (mittel) kamen in Lauf wuerfel-3-q2. Keiner ist abgelehnt, und danach ist keine Häufung mehr offen.
- **Namen:** Knopf, Springseil, Jojo, Kupferstich, Fresko, Hochofen, Mundharmonika, Hafenbecken, Kronleuchter, Seifenkiste, Hospiz, Postkutsche, Cello, Bugspriet, Heckentheater, Mykene, Milet, Uxmal, Olympia, Timgad, Hampi, Apeiron, Kepler, Schubkarre, Webstuhl.
  - Das Skript hätte für „mittel“ acht Instrumente nacheinander vergeben. Darum sind die Themen von Hand gemischt.
  - Nach Review 05 prüft das Skript auch gegen `entfernteNamen` und gegen Teilwörter.
- **Golden und Tests:** Golden nachgeführt (659 Level). Alle Tests mit Exit 0, jeder Test einzeln geprüft.
