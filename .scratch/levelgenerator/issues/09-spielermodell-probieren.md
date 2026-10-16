# 09: Spielermodell und Probieren

**What to build:** Das Spielermodell aus den Reviews wird ein versionierter Teil der Beurteilung. Bisher liegt es
unversioniert in den Review-Ordnern der Pools. Es liefert die Grundlage für das Schliessen. Mit ihm meldet die
Beurteilung den Ausschlussgrund Probieren, in allen Graden.

**Spec:** ../spec.md, Abschnitte „Beurteilung“ (Spielermodell, Ausschlussgründe) und „Feldform“.

**Blocked by:** 04 (Löser schneller), 06 (Feldform und Beurteilung)

**Status:** resolved

- [x] Das Spielermodell ist bei den Werkzeugen versioniert und benutzt nur die Feldform.
- [x] Die Beurteilung liefert seine Teilwerte: die Horizonte (k2, kInf), die Ketten und die Fallunterscheidungen.
- [x] Probieren liegt vor, wenn die weiten Fast-Lösungen mehr als 60 ‰ aller Strahlbilder der Suche ohne Abschneiden
      ausmachen, oder bei Raten: kInf > 6 oder Kette > 38, jeweils strikt grösser (16.10.2026 angepasst: feste
      Zellenfolge, vorher 4/28; Entscheid unter `## Comments`).
- [x] Mini-Level vergleichen ein Level, das sich durch Schliessen lösen lässt, mit einem Level voller gleichwertiger
      Fast-Lösungen.
- [x] Auf den 150 fällt kein Level wegen Probieren heraus:
      - Die Grenzfälle 135, 140, 148 und 149 bestehen.
      - Das heutige Maximum von 55,5 ‰ (74 Lichtnetz) wird nachgerechnet.
- [x] Die Laufzeit der Beurteilung je Level ist gemessen und steht unter `## Comments`. Sie ist wichtig für den
      Generator.

## Comments

**Hinweis aus Ticket 04 (Löser schneller):** `solve` übergibt `onLeaf` nur noch `(r, board)`; das dritte Argument
`value` (Map Element-Id → Stellung) ist weggefallen.
- Die unversionierten Skripte in den Review-Ordnern der Pools benutzen es und brechen jetzt ab:
  `tools/pools/review4/traps.mjs`, `review4/trapshow.mjs`, `review5/screen.mjs`, `review6/features.mjs`,
  `review6/traps.mjs` und `review6/trapshow.mjs`.
- Beim Übernehmen von Spielermodell, Holzwegen und Vorsieb anpassen: Entschieden ist ein Element, wenn
  `getRot(el) !== L.OPEN`, und seine Stellung ist `getRot(el)`. Beides kommt aus `tools/solver.mjs`.

**Abschluss 16.10.2026.**

**Spielermodell** (`tools/beurteilung/spielermodell.mjs`):
- Übernommen aus Review 4, gemessen wie im Vorsieb aus Review 5: vorwärts und rückwärts folgern (Horizont k), bei
  Stillstand eine Fallunterscheidung.
- Das Feld kennt es nur über die Feldform: Zellen, Nachbarn, Richtungen und Stellungen; die Gegenrichtung leitet es aus
  `nachbar` ab. Die Wirkung der Elemente kommt aus der Strahlregel, `getRot` aus dem Löser.
- Bei gleicher Reihenfolge der Elemente liefert es auf allen 150 dieselben Werte wie das Original (k2, steckt, kInf,
  Kette, gelöst). Es ist etwa 6-mal schneller: 1,2 s statt 7,7 s auf den 150.
- **Befund: Das Original hängt von der Reihenfolge der Elemente in den Leveldaten ab.**
  - Die Kette zählt die Folgerungen bis zum ersten Widerspruch, in Datenreihenfolge. Unter gleich guten
    Fallunterscheidungen wählt es die erste. Welche Fälle widerlegt werden, hängt dagegen nicht von der Reihenfolge ab.
  - Die Neuzählung rechnete auf `tools/selection.jsonl`. Dort stehen die Elemente in der Reihenfolge ihrer Erzeugung,
    in `index.html` nach Art, z und x sortiert (`curate.mjs`).
  - In `selection.jsonl` hat die Neuzählung höchstens kInf 4 und Kette 28. Mit `LEVELS` kommen 135 (Kette 32), 144
    (kInf 6) und 147 (Kette 35) darüber.
  - Bei zehn Zufallsreihenfolgen schwanken die Werte stark, etwa 144 mit kInf 2–7 und 149 mit Kette 14–43.
  - Darum geht das Spielermodell die drehbaren Elemente in der Reihenfolge der Zellen der Feldform durch. Ein Test
    belegt, dass die Reihenfolge in den Leveldaten nichts ändert; ohne die feste Reihenfolge wird er rot.

**Teilwerte:** ein eigener Teil `schliessen` (Glossar „Schliessen“), dafür ein Eintrag in `TEILE` (`schliessen.mjs`):
- k2, kInf: Zahl der Fallunterscheidungen mit Horizont 2 bzw. mit vollem Überblick; steckt: Horizont 2 kommt nicht
  weiter; kette: längste Kette mit vollem Überblick; geloest.
- `fallunterscheidungen` { k2, kInf }, je { element, faelle, widerlegt, ketten }.
- `fastLoesungen` { alle, weite, strahlbilder, promille, abgebrochen }. Weit ist eine Fast-Lösung ab 3 Elementen, die
  anders stehen als in der Lösung, wie im Vorsieb.
- Geteilt über `ctx.merke`:
  - `spielermodell(ctx)` mit allen Folgerungen;
  - `sucheOhneAbschneiden(ctx)` (`suche.mjs`) mit Strahlbildern, Knoten und jeder Fast-Lösung samt Ziel, Stellung und
    Abstand zur Lösung, für die Falle in Ticket 11.

**Probieren** (`ausschluesse/probieren.mjs`), in allen Graden und strikt:
- Fall „Fast-Lösungen“: mehr als 60 ‰.
- Fall „Raten“: kInf > 6 oder Kette > 38 (bis zum Entscheid vom 16.10.2026: 4 und 28).
- Je Fall ein Fund mit Begründung.

**Zahlen auf den 150:**
- **Weite Fast-Lösungen:** Kein Level fällt.
  - Das Maximum hat 74 Lichtnetz mit 66 von 1190 Strahlbildern, also 55,5 ‰ wie in der Neuzählung. Danach folgt 79
    Saphir mit 36,5 ‰.
  - Keine Suche bricht ab, die grösste (140 Urknall) hat 1,5 Mio. Knoten.
- **Raten** (Reihenfolge der Zellen): Kein Level fällt.
  - Die Höchstwerte liegen genau auf den Schwellen: 144 Spiegelkabinett mit kInf 6 und 135 Pulsar mit Kette 38. Danach
    folgen 148 mit kInf 4 und 147 Farbmühle mit Kette 32.
  - Die Grenzfälle der Neuzählung bestehen: 135, 140 (kInf 3, Kette 18), 148 (kInf 4, Kette 9) und 149 (kInf 1,
    Kette 14).
- **Spielermodell:**
  - Mit vollem Überblick löst es alle 150.
  - Mit Horizont 2 steckt es in 116, 138, 139, 140, 147 und 150 fest.
  - Fallunterscheidungen braucht es mit Horizont 2 in 60 Leveln, mit vollem Überblick in 32.

**Entscheid vom 16.10.2026** (Nutzer): Raten heisst kInf > 6 oder Kette > 38, strikt grösser, nach dem Grundsatz
„knapp über dem heutigen Höchstwert“. Spec und Code sind nachgeführt.
- Ausgangslage: Die alten Schwellen 4 und 28 lagen genau auf den Höchstwerten der Neuzählung, also in der Reihenfolge
  der Erzeugung. In dieser Reihenfolge wählte das Vorsieb die heutigen Level aus. In der festen Reihenfolge der Zellen
  wären 135, 144 und 147 gefallen.
- In Kauf genommen: Bei fester Reihenfolge trennt keine Schwelle die 150 von zwei Kandidaten, die Review 5 wegen Raten
  gestrichen hat. 144 hat kInf 6, Kandidat 8024 kInf 5; 135 hat Kette 38, Kandidat 8017 Kette 37. Beide bestünden jetzt.
  Ob ein Level viel Raten verlangt, misst zusätzlich der Spielwert über das Schliessen (Tickets 12 und 13).
- Auch im Vorsieb kippen Urteile mit der Reihenfolge: Kandidat 8041 fällt neu, 8005, 8060 und 8067 bestehen neu. 8004
  (kInf 7) und 8027 (Kette 40) fallen weiterhin.
- Verworfen: 135 und 144 auf die Duldungsliste, denn die Liste wird nur kürzer. Offen bleibt ein robusteres Mass für
  Kette und kInf, etwa die Tiefe in Runden von Folgerungen (auf den 150 höchstens 3), bei der Eichung in Ticket 12.

**Laufzeit der Beurteilung je Level** (über `leise.sh` mit 20 %, die 150 nacheinander):
- Median 5 ms, Mittel 177 ms, 90 % unter 0,69 s, höchstens 3,6 s (140 Urknall); zusammen 26,6 s.
- Je Grad (Median / Maximum): leicht 2 ms / 14 ms, mittel 3,5 ms / 22 ms, schwer 67 ms / 3,6 s, sehr schwer
  1,4 s / 2,0 s.
- Die Suche ohne Abschneiden macht 95 % aus (25,4 s). Das Spielermodell braucht höchstens 135 ms (144), zusammen
  1,2 s.
- Ohne teure Regeln braucht die Beurteilung 0,1 ms je Level.
- Für den Generator: die Suche als letzte Prüfung. Probieren mit T Suchen mit Abschneiden statt einer ohne war
  langsamer (67 s statt 24 s auf den 150).

**Tests** (testgetrieben, zuerst 12 rot):
- `tests/beurteilung/schliessen.test.mjs` (8) und `probieren.test.mjs` (8); die Testlevel liegen in
  `probieren-level.mjs`.
- **Mini-Level** auf 5 × 5, je zwei Quellen, vier drehbare Spiegel und zwei Ziele:
  - durch Schliessen lösbar, ohne weite Fast-Lösung: besteht;
  - voller gleichwertiger Fast-Lösungen (103,4 ‰): fällt in allen Graden;
  - dasselbe Feld mit einem anderen Zielplatz (51,7 ‰): besteht. Mit Horizont 2 braucht es eine
    Fallunterscheidung, mit vollem Überblick keine.
- **Grenzen beim Raten**, denn von Hand lassen sich solche Werte nicht bauen:
  - genau auf den Schwellen bestehen 144 (kInf 6) und 135 (Kette 38) aus den 150;
  - je eins darüber fallen zwei Kandidaten aus den Pools des Härtens: Seed 8004 (harden-8) mit kInf 7 und Seed 3029
    (harden-3) mit Kette 39.
- **Laufzeiten**, alle grün:
  - `tests/beurteilung.test.mjs`: 44 Tests, 27–33 s je nach Last statt 1,3 s. Davon braucht die Suche ohne
    Abschneiden auf den 150 rund 25 s, nur für die Tests der Zahlen. Eine einzelne Testdatei ohne teure Regeln läuft
    weiter unter 0,2 s.
  - `tests/golden.mjs`: 5 s.
  - `tests/logic.test.mjs`: 558 Tests.

**Abweichungen:**
- **Gemeinsame Dateien:**
  - `index.mjs`: der Eintrag `schliessen` in `TEILE` und die Option `teuer`. `beurteile(level, { teuer: false })`
    lässt die Regeln mit `teuer: true` weg; sie stehen dann in `offen`.
  - `tests/beurteilung/helfer.mjs`: `heutigeLevel()` rechnet ohne teure Regeln, `heutigeLevel({ teuer: true })` mit.
  - `regeln.mjs`: zwei Zeilen, Schliessen und Probieren.
- **Testlevel für das Raten:** zwei Level aus den 150 und zwei Kandidaten aus den Pools statt kleiner, handgebauter
  Level.
- **README** hat der Umsetzer nicht nachgeführt, weil es eine gemeinsame Datei ist; nachgeführt im Review.

**Review 16.10.2026** (unabhängiger Reviewer, nicht committet):
- Den Entscheid umgesetzt: `probieren.mjs`, Spec (Tabelle der Ausschlussgründe und Tests der Nahtstelle 2), Tests und
  Testlevel. Die Seeds 3004, 6023 und 4001 sind ersetzt durch 8004 und 3029. Die Prüfung der Reihenfolge läuft jetzt
  mit 8004; ohne die feste Reihenfolge wird sie rot (kInf/Kette: Daten 7/33, umgekehrt 5/34, wie in `index.html`
  7/36).
- README, Abschnitt „Beurteilung“: Spielermodell, Schliessen, Probieren und `teuer`, dazu die Laufzeit des Tests.
- Kleinigkeiten:
  - Kommentare: Ablauf von `folgern` (`spielermodell.mjs`), wer nur das Spielermodell braucht (`schliessen.mjs`),
    `schliessen.mjs` in der Liste der Regeln (`index.mjs`), zwei Beurteilungen der 150 (`tests/beurteilung.test.mjs`).
  - `einstieg.test.mjs` prüft „null genau dann, wenn offen“ für alle Teile mit einem Wert, also auch für Schliessen.
  - In `suche.mjs` heisst die Zahl der Ziele `zahlZiele`.
- Nachgeprüft in einer Kopie: Das Original liefert auf zellsortierten Elementen auf allen 150 dieselben Werte wie das
  neue Spielermodell, samt jeder Fallunterscheidung (Element, Fälle, Ketten). Die Werte für 135, 140, 144, 147, 148
  und 149, das Maximum 55,5 ‰ bei 74 und die Aussage zu 8024 und 8017 stimmen.
- Für Ticket 12: Die Zellenfolge ist fest, aber ebenso willkürlich. Dasselbe Level um 180° gedreht hat in 28 der 150
  andere Werte, etwa 149 kInf 4 statt 1 und Kette 29 statt 14, 147 Kette 38 statt 32. Gedreht bestehen alle 150
  knapp (höchstens kInf 6 und Kette 38). Das spricht für ein robusteres Mass bei der Eichung.
