# 02: Ausgangszahlen der Effizienz

**What to build:** Ein Messskript misst, wie viele Level der heutige Generator je CPU-Stunde liefert und wie schnell
Strahlregel und Löser rechnen. Diese Zahlen sind der Vergleich für alle späteren Verbesserungen. Das Skript soll später
auch den neuen Generator je Schwierigkeitsgrad messen und mit der Beurteilung als Abnahme laufen können.

**Spec:** ../spec.md, Abschnitt „Effizienz“.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Das Skript läuft nur über die gedeckelte Umgebung mit höchstens 50 % CPU. Mehrere Prozesse laufen nur innerhalb
      dieses Deckels, nie mehrere Läufe nebeneinander.
- [x] Die Seeds sind fest: Zwei Läufe mit gleichen Seeds liefern dieselben angenommenen Level.
- [x] Ausgabe: angenommene Level je CPU-Stunde (CPU-Zeit, nicht Wanduhr), für jedes Profil des heutigen Generators.
- [x] Ausgabe: mittlere Zeit je Aufruf der Strahlregel auf zufälligen Stellungen aller Level (fester Seed) und die
      Gesamtzeit des Lösers über alle Level.
- [x] Die Abnahme ist austauschbar. Heute gilt die Abnahme des alten Generators, später die Beurteilung. Die Messung
      lässt sich nach Schwierigkeitsgrad aufteilen.
- [x] Die Ausgangszahlen stehen mit Datum und Rechner unter `## Comments` in diesem Ticket.

## Comments

**Umgesetzt (Oktober 2026):** `tools/bench.mjs` misst CPU-Zeit (`process.cpuUsage`, über alle Prozesse summiert). Die
Ausgangszahlen stehen maschinenlesbar in `tools/bench-baseline.json`. Es gibt drei Teile: `generator`, `trace`
(Strahlregel) und `solver`.
- **Austauschbar:** Generator und Abnahme sind je ein Eintrag in `GENERATORS` bzw. `ACCEPTANCES`. Die alten Werkzeuge
  lädt das Skript nur für den Teil `generator`. Die Gruppen sind heute die Profile, beim neuen Generator die Grade.
  Liefert eine Abnahme den Grad (später die Beurteilung), zählt die Messung zusätzlich je Grad.
- **Deckel:** Das Skript bricht ab, wenn es nicht mit tiefster Priorität läuft, wie sie `leise.sh` setzt. Es bricht
  auch ab, wenn `LEISE_CPU` mit `generator` über 50 liegt oder mit `trace`/`solver` allein über 20. Die Prozesse des
  Generators sind Kinder des Skripts und bleiben im Job von `leise.sh`.
- **`--save`** schreibt die Teile in eine Datei. Bei gleichen Bedingungen (Generator, Abnahme, Seeds, `--jobs`,
  Rechner) führt es die Gruppen zusammen und rechnet `total` neu, sonst bricht es vor der Messung ab. Gruppen aus
  einem anderen Lauf tragen ihre eigenen Angaben (`measured`).
- **`--compare`** zeigt den Faktor gegenüber einer früheren Messung und rät, vorher und nachher in derselben Sitzung
  zu messen. Bei anderem Generator, anderer Abnahme, anderen Seeds oder anderem `--jobs` fehlt der Faktor, bei anderem
  Rechner erscheint eine Warnung. Gemeldet werden andere angenommene Level (Fingerabdruck je Gruppe), andere
  Strahlbilder (Prüfsumme) und eine andere Knotenzahl des Lösers.
- **Prüfsumme der Strahlbilder:** Sie entsteht in einem eigenen, nicht gemessenen Durchgang über dieselben Stellungen.
  Erfasst sind Art, Farbe und Element der Ereignisse in ihrer Reihenfolge, Treffer und Mischungen, „gelöst“ und
  „abgebrochen“ sowie Farbe und Endpunkte der Abschnitte, auf 1e-6 gerundet. Es fehlen Normalen, Längen, Abstände und
  die Lage der Ereignisse, und ein Rundungsrest genau an einer Rundungsgrenze kann sie kippen. Sie zeigt also nur grob,
  dass dieselben Strahlbilder entstehen; das Verhalten sichert weiterhin der Golden-Test.

**Ausgangszahlen** vom 15.10.2026, i7-12800H (20 logische Kerne), Node 22.12.0. Generator und Löser sind auf `a52407f`
gemessen. Die Strahlregel ist wegen der neuen Prüfsumme danach neu gemessen, mit unveränderter Strahlregel.

Generator: Seeds 1–60 000 je Profil, 10 Prozesse unter `LEISE_CPU=50`, Abnahme des alten Generators. Der Lauf dauerte
25,6 min Wanduhr und 14 742 CPU-s. Die Level je CPU-Stunde sind aus den auf 0,1 s gerundeten CPU-Sekunden gerechnet.

| Profil | angenommen | CPU-s | Level je CPU-Stunde |
|---|---:|---:|---:|
| 1-spiegel | 2 655 | 63,7 | 150 047 |
| 1-prisma | 4 769 | 165,6 | 103 674 |
| 1-filter | 1 483 | 70,1 | 76 160 |
| 1-farbe | 2 913 | 59,4 | 176 545 |
| 2-spiegel | 717 | 44,9 | 57 488 |
| 2-prisma | 2 411 | 208,2 | 41 689 |
| 2-filter | 547 | 61,7 | 31 916 |
| 2-farbe | 1 057 | 40,5 | 93 956 |
| 2-misch | 1 745 | 298,9 | 21 017 |
| 2-bunt | 1 298 | 141,8 | 32 953 |
| 3-spiegel | 489 | 155,5 | 11 321 |
| 3-prisma | 938 | 669,7 | 5 042 |
| 3-filter | 328 | 258,8 | 4 563 |
| 3-farbe | 835 | 188,6 | 15 938 |
| 3-misch | 809 | 1 170,4 | 2 488 |
| 3-bunt | 655 | 721,3 | 3 269 |
| 4-spiegel | 19 | 104,0 | 658 |
| 4-prisma | 117 | 699,3 | 602 |
| 4-filter | 11 | 198,7 | 199 |
| 4-farbe | 46 | 108,2 | 1 530 |
| 4-misch | 111 | 710,6 | 562 |
| 4-bunt | 76 | 411,6 | 665 |
| 5-prisma | 4 | 2 270,3 | 6 |
| 5-filter | 0 | 649,2 | 0 |
| 5-misch | 9 | 3 333,5 | 10 |
| 5-bunt | 3 | 1 937,8 | 6 |
| **gesamt** | **24 045** | **14 742,3** | **5 872** |

Je Grössenstufe ergeben sich 118 595 (1), 35 163 (2), 4 612 (3), 613 (4) und 7 (5) Level je CPU-Stunde.
Grössenstufe 5 braucht 56 % der CPU-Zeit und liefert 16 Level.

- **Strahlregel:** 2,211 µs je Aufruf von `traceBeams`. Das ist der Median aus 10 Runden (Runden 2,01–2,45 µs) über
  159 Level × 20 000 zufällige Stellungen mit Seed 1, also 3,18 Mio. Aufrufe in 7,0 CPU-s. Ein Prozess lief über
  `leise.sh` mit 20 %.
- **Löser:** 103,8 CPU-s für `solve(level)` über alle 159 Level, 9 831 779 Knoten. Am längsten brauchen Urknall
  (15,6 s), Spiegelkabinett (10,5 s) und Quasar (7,7 s).

**5-filter liefert 0, und das kann nicht anders sein.** Das Budget setzt 5–7 drehbare Spiegel und 0–1 Prisma, also
höchstens 8 drehbare Elemente; Filter drehen sich nicht. Kein späterer Schritt macht ein Element drehbar: Feste Spiegel
auf dem Weg und Lockvögel sind fest, die Reparatur setzt Blocker oder macht Spiegel fest, und Elemente ohne Licht fallen
weg. Verlangt sind aber mindestens 9. Spätestens die Prüfung „Anzahl drehbarer Elemente“ verwirft deshalb jeden Seed
(4 057 von 60 000, die übrigen fallen schon vorher). Die 60 000 Seeds kosten trotzdem 649 CPU-s, also 4 % der
Gesamtzeit. Als Obergrenze je Profil dient die feste Zahl der Seeds; so endet auch ein Profil, das nie liefert.

**Determinismus:** Ich habe 1-prisma, 3-bunt und 4-prisma mit den Seeds 1–3000 zweimal gerechnet, mit 10 und mit 4
Prozessen. Beide Läufe ergaben dieselbe Zahl angenommener Level (229, 41 und 9) und dieselben Fingerabdrücke. Auch die
zwei Vorläufe über alle 26 Profile (Seeds 1–1000, andere Blockgrösse) stimmten in allen Fingerabdrücken überein. Ein
später neu gemessenes 1-spiegel mit allen 60 000 Seeds hatte denselben Fingerabdruck wie in den Ausgangszahlen, und
die Prüfsumme der Strahlregel war in zwei Läufen gleich.

**Belege an Kopien:**
- **Prüfsumme:** Die Kopie enthielt nur `index.html`, `tools/solver.mjs` und `tools/bench.mjs`. Darin war allein die
  Farbe des Filter-Ereignisses geändert (`color: ray.color` statt `passed || ray.color`). Bei 2000 Stellungen je Level
  meldete `--compare` „≠ andere Strahlbilder“, das unveränderte Original zweimal hintereinander nicht. Die erste
  Prüfsumme (nur Anzahlen) hätte das nicht bemerkt. Zugleich lief `trace` dort ohne `generate.mjs`, `harden.mjs` und
  `profiles.mjs`.
- **`--save`:** In einer Kopie der Ausgangszahlen brach `generator 1-spiegel --seeds 1000 --save` vor der Messung ab
  („andere Seeds“). `generator 1-spiegel --save` mit den Standardwerten ersetzte nur 1-spiegel, mit eigenen Angaben,
  weil der Commit ein anderer war. Alle 26 Profile waren danach noch da, die übrigen 25 unverändert, und `total`
  stimmte mit der Summe überein.
- **Deckel:** Das Skript brach ab bei `LEISE_CPU=50` mit `trace`, bei `LEISE_CPU=60` mit `generator` und ohne
  `leise.sh`.

**Was die Zahlen verzerrt:**
- **Zahl der Prozesse:** Die CPU-Zeit je Seed hängt stark von ihr ab. Mit 10 Prozessen kostet dieselbe Arbeit 1,5- bis
  2,3-mal so viel CPU-Zeit wie mit 1 oder 4 (Hyperthreading, E-Kerne, tieferer Turbo). Vergleiche gelten deshalb nur
  bei gleichem `--jobs`; die Ausgangszahlen gelten für 10.
- **Last des Nutzers:** Zeitweise lief ein Java-Prozess mit etwa 6 Kernen. Über sieben Läufe streute die Strahlregel
  zwischen 2,05 und 2,87 µs, über drei Läufe der Löser zwischen 99 und 119 CPU-s. Beim zweiten Mal brauchte 1-spiegel
  74,3 statt 63,7 CPU-s und 2-farbe in einem kurzen Lauf allein 59,3 statt 40,5 CPU-s, jeweils mit denselben Level.
  In die Datei kam jeweils der schnellere Lauf, damit spätere Gewinne nicht zu gross erscheinen. Für die Tickets 03 und 04 sollten vorher und nachher in derselben Sitzung gemessen werden, den alten
  Stand etwa in einem `git worktree`. `--compare` prüft dann zusätzlich, ob Prüfsumme, Knoten und Fingerabdrücke
  gleich bleiben.
- **Messauflösung:** Unter Windows zählt `cpuUsage` in Schritten von 15,6 ms. Das Skript misst deshalb über lange,
  zusammenhängende Abschnitte. Jeder Prozess des Generators wärmt sich vorher 0,3 CPU-s lang auf. Ohne das trug die
  erste Gruppe das Aufwärmen aller Prozesse: 1-spiegel brauchte 3,2 statt 1,7 CPU-s je 1000 Seeds.

**Abweichungen vom Ticket:**
- „härten“ ist als Gruppe eingebaut (`node tools/bench.mjs generator härten`), fehlt aber in den Ausgangszahlen. Ein
  Vorlauf mit 10 Seeds war nach 21 min nicht fertig (8 von 10 Läufen fertig), ein Lauf kostet also oft über 10
  CPU-Minuten. Die Notiz dazu steht in Ticket 20.
- Gemessen ist nur mit der Abnahme des alten Generators. Die Aufteilung nach Grad ist vorbereitet, über die Gruppen oder
  den Grad aus der Abnahme. Prüfen lässt sie sich erst mit der Beurteilung.
- `leise.sh` lag damals unversioniert in `tools/blender/out/arbeit/`, obwohl `bench.mjs` es voraussetzt. Erledigt nach
  Ticket 04: `leise.sh` und `leise.ps1` liegen versioniert unter `tools/`.

**Weitergegeben** als Notiz in die Tickets 04 (Modus für die Eindeutigkeit, nur die Summe der Knoten verglichen),
18 (Vergleich über einen Generatorwechsel, `grades` und `total`) und 20 (Ausgangszahl für „härten“).

**Laufzeit der Messung:** Der Hauptlauf dauerte 25,6 min und der Determinismus 20 s. Drei Läufe von Strahlregel und
Löser brauchten je rund 2 min, sechs Läufe nur der Strahlregel je 15–31 s. Dazu kamen die Vorläufe und Belege mit rund
4 min und der abgebrochene Vorlauf „härten“ mit 21 min, zusammen rund 60 min. Golden-Test (29 s) und Logiktests
(554, 4 min 51 s) sind über `leise.sh` grün, nach der Nachbesserung erneut.

Commit siehe git log.
