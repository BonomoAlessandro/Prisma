# 10: Würfel-Gruppe 7 in 7 × 7 × 5 (250 Level)

**Spec:** ../spec.md

**Blocked by:** 09

**Status:** resolved

**What to build:** 25 neue Würfel-Level 7 × 7 × 5 nach dem Ablauf einer Gruppe (Spec `wuerfel-500`), alle nach
der Ebenen-Regel. Neu je Grad (leicht / mittel / schwer / sehr schwer): 4 / 13 / 6 / 2. Danach im Spiel: 44 / 133 / 51 / 22.

- [x] 25 neue Level, je Grad wie oben; Fehlmengen begründet und für die nächste Gruppe vermerkt.
- [x] Genau eine Lösung, Beurteilung bestanden, ab „mittel“ nötige Kernidee, Ebenen-Regel erfüllt, keinem anderen
      Würfel-Level zu ähnlich.
- [x] Beide KI-Tester haben jedes neue Level beurteilt; von beiden abgelehnte sind ersetzt.
- [x] Namen ohne Freigabe, eindeutig, gut unterscheidbar; Herkunft nachbaubar.
- [x] Golden-Referenz, alle Tests grün, Stichproben der Screenshots, auf `feature/3d-wuerfel` gepusht; Review.

## Comments

**27.10.2026, Koordinator: erledigt.** Im Spiel stehen jetzt 250 Würfel-Level, je Grad 44 / 133 / 51 / 22, wie in der Tabelle.

- **Korrektur durch die KI-Tester neu geregelt** (`tools/levelliste.mjs`, Funktion `korrektur`, nur Würfel; mein Entscheid nach dem Auftrag des Nutzers):
  - Seit Ticket 04 rechnete `heutigeAnker` die Urteile mit den heutigen Plätzen der Anker neu.
  - Das kippte, sobald die Anker im Grad wanderten. Die Anker für „sehr schwer“ (W6: Möbiusband, Gauss) waren beim Lauf die schwersten Level, heute sind sie die leichtesten. Jedes Urteil „etwa wie A7“ zog darum −5. Alle „sehr schweren“ Level standen auf −5, Möbiusband als leichtestes zuletzt, und die Anker stimmten nicht mehr in der Reihenfolge.
  - **Neu:** Im Würfel gilt die Verschiebung aus dem Lauf, also `ergebnis.verschiebung` im Protokoll, vom Platz der Formel aus. Sie trägt, was die Tester gegenüber den damaligen Nachbarn meinten. `heutigeAnker` ist entfernt.
  - Tests: die Verschiebung aus dem Protokoll an einem erfundenen Fall; jedes zählende Urteil wirkt mit der Verschiebung aus seinem Lauf.
  - Die Reihenfolge der Würfel-Level ändert sich dadurch. Innerhalb der Grade steigt die Schwierigkeit wieder stimmig an. Die flachen Level sind unverändert (golden).
- **Häufung Seite 13, „Sammelstelle“ 5-mal bei mittel:** Lastenaufzug und Hochrad sind entfernt. Beide kamen erst in diesem Umbau dazu und waren nie auf main. Ausgeschlossen ist auch der Kandidat f763c133, der sonst auf die Seite gerutscht wäre.
- **KI-Tester:**
  - **wuerfel-7-q:** 27 Kandidaten. Abgelehnt: 0219e436 (mittel, Füllteil).
  - **wuerfel-7-q2:** Ersatz 4f586fa9, nicht abgelehnt.
- **Namen:** Konfetti, Kasperli, Latzhose, Mikado, Ankerklüse, Ziselieren, Konsolfries, Blattgold, Firstbalken, Filzen, Pietra dura, Dampflok, Schoner, Kaminhut, Volute, Patchwork, Kalfaterer, Ochsenkarren, Pompeji, Ravenna, El Djem, Stobi, Rapa Nui, Mzcheta, Kowalewskaja, Potenzreihe, Blockbau. Alle sind streng geprüft. Vier sind von Hand getauscht, gegen zu viele Schiffsteile und Kunsttechniken.
- **Review 09:** mit diesem Branch gemergt.
- **Golden und Tests:** Golden nachgeführt (759 Level). Alle Tests mit Exit 0.
