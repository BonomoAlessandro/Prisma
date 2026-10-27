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

**27.10.2026, Reviewer: in Ordnung nach vierzehn Umbenennungen, eine Frage offen** (Branch `review/quader-10`).

- **Korrektur aus dem Protokoll (`korrektur` in `reihenfolge`):** Die Begründung ist schlüssig, die Umsetzung korrekt.
  - `abgelehnt`, `gruende` und `verschiebung` kommen aus `eintrag.ergebnis`.
  - Die Kappung bleibt: `korrigiere` begrenzt auf MAX_SHIFT und auf den Abschnitt des Grads.
  - Flach unverändert: Der Zweig gilt nur bei `VERSIONS[ablauf].wuerfel`. Golden und levelliste sind grün.
  - Die Tests sind sinnvoll.
  - **Behoben:** `ankerNamen` in `tools/ki-tester/protocol.mjs` war verwaist, samt Kommentar. Entfernt.
- **Entfernte Level:** Lastenaufzug (c3f5d522) und Hochrad (53eadf87, vorher Leuchtbake) stehen auf `entfernteNamen`
  und in `ohne.txt`, ebenso f763c133 und 0219e436.
- **Umbenannt** (Teilwörter, Wortenden, Häufungen mit Nachbarn):
  - Leicht:
    - Kasperli → Mixer: Kasperli, Springseil und Teddybär, drei Spielsachen auf 6 Plätzen; dazu Marionette.
    - Latzhose → Trinkhalm: Handschuh, Latzhose und Mütze, drei Kleider auf 10 Plätzen (wie Faltenrock in Review 09).
    - Mikado → Badewanne: Jojo, Spielzeugauto und Mikado, drei Spielsachen auf 10 Plätzen.
  - Mittel:
    - Blockbau → Traktor: endet auf „bau“ wie Mittelbau (wie Ständerbau in Review 09).
    - Ankerklüse → Skulptur: „Anker“ in Ankerwinde, 2 Plätze davor, und im flachen Ankerplatz.
    - Ochsenkarren → Fanfare: „Ochsen“ in Ochsenauge, 2 Plätze danach.
    - Kalfaterer → Fischkutter: Schreiner, Kalfaterer und Vergolder, drei Handwerker auf 11 Plätzen.
    - Filzen → Kipplaster: direkt neben Ziselieren, zwei Techniken als Verb.
    - Dampflok → Dschunke: fast dasselbe wie Lokomotive, 3 Plätze danach; „Lok“ in Lokschuppen, „Dampf“ in Dampfwalze.
    - Schoner → Ikone: direkt neben Brigg, Kogge 6 Plätze danach.
    - Blattgold → Weber: „Gold“ in Vergolder und drei flachen Namen, „Blatt“ in Blütenblatt.
    - Konsolfries → Stillleben: „Konsol“ wie das entfernte Konsole; Lettner und Lisene direkt daneben.
  - Schwer:
    - El Djem → Uruk: El Djem, Dougga und Karthago, drei Stätten in Tunesien auf 11 Plätzen.
    - Pompeji → Djenné: Karthago, Baalbek und Pompeji, drei römische Stätten nebeneinander.
  - Die neuen Namen sind gegen alle flachen, Würfel- und entfernten Namen geprüft. Die alten waren nie auf main,
    deshalb nicht auf `entfernteNamen`. Golden ist nachgeführt.
- **Geprüft, in Ordnung:**
  - Die Verteilung ist 44 / 133 / 51 / 22. Neu sind 4 / 15 / 6 / 2 = 27, entfernt 0 / 2 / 0 / 0.
  - Protokoll: Jedes neue Level hat genau ein Urteil, 26 aus wuerfel-7-q und 4f586fa9 aus wuerfel-7-q2.
    0219e436 ist abgelehnt (Füllteil) und nicht im Spiel.
- **Offen, für Entwickler und Reviewer gemeinsam:** Gauss steht als letztes Level auf 250. Mit 88,1 ist es eines
  der leichtesten „sehr schweren“, Platz der Formel 231, eigene Verschiebung 0.
  - Ursache ist `korrigiere`. Fast alle „sehr schweren“ Level haben aus ihrem Lauf eine negative Verschiebung (−1 bis −5).
    Jedes, das an Gauss vorbeizieht, schiebt es einen Platz nach hinten, so 19 Plätze weit.
  - Für Gauss gilt keine Grenze: Es ist nicht korrigiert, und mit dem Ausbau gilt `zuWeitKorrigiert` nicht.
  - Kowalewskaja wandert genauso, von 230 auf 235.
  - Im Rest des Grads steigt die Schwierigkeit plausibel.
  - Vorschlag: Die Verschiebungen je Grad am Median ausrichten, oder ein Level ohne eigene Korrektur höchstens
    MAX_SHIFT Plätze von der Formel schieben. Das ist eine Regeländerung, darum nicht im Review.
  - Auch Korrigierte rücken in der Kette bis 9 Plätze, etwa Sessellift von 68 auf 59. Das ist mit dem Ausbau
    zugelassen (Entscheid vom 22.10.2026).
- **Tests:** grün, ohne FAIL: wuerfelliste (20), levelliste (56), ki-tester (84), beurteilung (206), logic (1867)
  und golden (759 Level, davon 250 Würfel).
