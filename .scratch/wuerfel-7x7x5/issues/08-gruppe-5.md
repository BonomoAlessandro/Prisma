# 08: Würfel-Gruppe 5 in 7 × 7 × 5 (200 Level)

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2. Danach im Spiel: 36 / 108 / 39 / 17.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**26.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 200 Würfel-Level, je Grad 36 / 108 / 39 / 17, wie in der Tabelle.

- **Häufung an der Grenze leicht/mittel:** Die Wahl liess Seite 4 offen, „Sammelstelle“ bei leichten Leveln (erlaubt sind 2).
  - Im Spiel lagen fünf leichte Sammelstelle-Level auf 9 Plätzen: Vogeltränke, Kommode, Federball, Stockwerk, Steckenpferd, mit Schwierigkeit 37–41. Bei höchstens 2 je Seite bräuchten sie mehr als 20 Plätze. Kein Tausch löst das, und „leicht“ endet direkt danach.
  - **Lösung:** Federball (Gruppe 4) und Steckenpferd (Gruppe 2) sind aus dem Spiel genommen. Beide kamen erst in diesem Umbau dazu und waren nie auf main.
  - Ihre Namen stehen trotzdem auf `entfernteNamen`, ihre Abdrücke in `ohne.txt`.
  - Die Gruppe wählt dafür 6 statt 4 leichte, nur aus dem Bereich 37–42,5 ohne Sammelstelle.
  - Dafür gibt es einen neuen Pool `pool-2-leicht-oben.jsonl`: Stand b80d994, `--schwierigkeit 37,42.5`, 5 Aufträge × 1500 Seeds, 1561 Kandidaten.
  - Gewählt sind 27, netto kommen 25 dazu. Danach ist keine Häufung offen.
- **KI-Tester:** wuerfel-5-q mit 26 Kandidaten. Einer, 6ad3ca9b, war schon in Lauf wuerfel-4-q beurteilt und damals nur wegen einer Häufung getauscht.
  - Keiner abgelehnt. d05409a4 (sehr schwer) bekam einmal Knäuel, nur von A.
  - Der Lauf hatte 26 statt höchstens 25 Kandidaten.
- **Namen:** Türklinke, Strickjacke, Handtuch, Zahnpasta, Kamm, Nachttisch, Kalvarienberg, Wallfahrtskirche, Barbican, Segelflugzeug, Kupferkessel, Steinmetz, Kerzenzieher, Brigg, Lastenaufzug, Drechsler, Balalaika, Klüver, Besanmast, Konark, Khajuraho, Anuradhapura, Sukhothai, Nikko, Gyeongju, Chaos, Ramanujan.
  - Alle sind streng geprüft. Instrumente und Entropie (Physik) sind von Hand ersetzt.
  - Der Vorrat an mittleren Namen, die die strengen Regeln bestehen, ist knapp. Für die nächsten Gruppen braucht es neue.
- **Golden und Tests:** Golden nachgeführt (709 Level). Alle Tests mit Exit 0.
