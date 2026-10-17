# 19: Generator: alle Kernideen

**What to build:** Der Generator baut jede der sechs Kernideen gezielt ein. Ein Auftrag mit einer Kernidee liefert ein
Level, in dem genau diese Kernidee nötig ist.

**Spec:** ../spec.md, Abschnitt „Generator“; Glossar, Abschnitt „Kernideen“.

**Blocked by:** 18 (Generator: erster Durchstich)

**Status:** resolved

- [x] Abschalten, Farben abzählen, Sammelstelle, Falle und Lockvogel lassen sich gezielt einbauen, zusätzlich zum
      Mischziel aus zwei Quellen.
- [x] Ein Auftrag mit einer Kernidee liefert ein Level, in dem diese Kernidee laut Beurteilung nötig ist.
- [x] Je Kernidee gibt es einen Test mit festem Seed.
- [x] Die Ausbeute je Kernidee ist gemessen und steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 18 (Generator):**
- **Baustein:** Eine Kernidee ist ein Baustein in `tools/generator/bausteine/` mit einer Zeile in
  `bausteine/index.mjs` (Glossarbegriff, `braucht`, `baue(bau, plan, vorgaben)`); Vorbild ist
  `mischziel-zwei-quellen.mjs`. Der Baustein schützt seine Elemente (`kern: true`) und reserviert die Zellen seiner
  Wege. Ob die Kernidee nötig ist, entscheidet die Beurteilung: Abschalten, Farben abzählen und Sammelstelle schon in
  der Vorprüfung, Falle und Lockvogel erst in der vollen Beurteilung (der Ablauf erkennt das an `offen`).
- **Lockvogel:** Der Generator setzt noch keine Lockvögel, und ein festes Teil zählt heute nur über die Lösung (Regel
  gegen wirkungslose Elemente, `wirkungslos` in `schritte.mjs`). Ein Lockvogel braucht die Prüfung „bekommt beim
  Probieren Licht“, also die Suche ohne Abschneiden. Die macht schon die Beurteilung (`suche.mjs`, `licht`), gibt
  `licht` aber nicht aus. Damit sie nicht doppelt läuft: den Lockvogel über die Kernidee in der vollen Beurteilung
  prüfen oder `beurteile` klein ergänzen (etwa das Licht auf festen Teilen ausgeben), bitgleich wie in Ticket 18. Der
  alte Generator suchte heisse Zellen mit einer eigenen Vollsuche (47 % seiner Zeit). Achtung (Review): Ein fester
  Spiegel des Lockvogel-Bausteins zählt nicht für die Lösung; `wirkungslos` meldet für ihn heute „Kernidee
  wirkungslos“, der Bau scheitert also schon beim Festigen. `wirkungslos` muss feste Teile der Kernidee dort auslassen
  (die Beurteilung prüft den Lockvogel dann mit dem Licht der Suche) oder ihren Anteil im Licht der Suche prüfen.
- **Quellen:** Abschalten und Farben abzählen brauchen oft drei Quellen; die Vorgabe „leicht“ erlaubt 1–3. Der
  Mischziel-Baustein belegt zwei Quellen und reserviert ihre Wege; danach findet das Ergänzen oft keinen offenen Strahl
  mehr („zu klein“ bei 13 % der Seeds).
- **Aufträge:** `KURZNAMEN` in `index.mjs` kennt die Kurznamen aller sechs Kernideen. `angebot()` nimmt neue
  Bausteine von selbst auf (Kommandozeile `leicht-abschalten` …, Gruppen des Messskripts).
- **Test und Messung:** In `tests/generator.test.mjs` je Kernidee einen Auftrag zu `AUFTRAEGE` hinzufügen; alle
  Prüfungen gelten dann auch für ihn. `bench.mjs generator --generator neu --accept beurteilung` zählt je Grad und
  nötiger Kernidee; `--compare` mit einer Messung des alten Generators zeigt dieselbe Kernidee über alle Profile und im
  besten Profil.

**Umgesetzt 17.10.2026.** Gearbeitet im Worktree `.claude/worktrees/agent-af621ce46dc2a0be5` auf dem Branch
`ticket/19-generator-kernideen` (von `feature/levelgenerator`, Stand `974c4f0`). Alle Läufe über `leise.sh`,
nacheinander: Generator und Messskript mit `LEISE_CPU=50`, Tests mit 20 %. Rechner i7-9750H, Node 22.12.0 (nicht der
i7-12800H aus 02 und 18; beide Seiten der Vergleiche unten sind hier gemessen).

**Ergebnis:** Jede der sechs Kernideen hat einen Baustein in `tools/generator/bausteine/` mit einer Zeile in
`bausteine/index.mjs`; gemeinsame Hilfen stehen in `bausteine/wege.mjs` (kein Baustein): Licht aus einer neuen Quelle
über genau n Spiegel in einer Richtung an eine Zelle bringen (`zufuehren`, rückwärts gesucht, mit der Strahlregel
geprüft), freie Strahlen, Auswege eines Spiegels, Bilder mit anders gestellten Elementen. Alles nur über die Feldform
(der Quelltext-Test des Generators gilt auch für die neuen Dateien). Ob die Kernidee nötig ist, entscheidet weiter allein
die Beurteilung; die Bausteine prüfen mit der Strahlregel nur, dass ihr Aufbau so leuchtet wie gedacht.
- **Abschalten** (`abschalten.mjs`): Quelle A mit einem Spiegel; in einer anderen Stellung lenkt er A auf kurzem Weg
  auf ein Ziel in der Farbe von A (der Zwischenstand, ein Element). In der Lösung bekommt das Ziel dieselbe Farbe aus
  einer Quelle B über zwei Spiegel, und A leuchtet anderswohin (halb so oft gleich auf ein Ziel, sonst setzt das
  Ergänzen fort).
- **Farben abzählen** (`farben-abzaehlen.mjs`): ein Ring aus vier drehbaren Spiegeln an den Ecken eines Rechtecks. Zwei
  Quellen derselben Grundfarbe leuchten an gegenüberliegenden Ecken hinein und erreichen über den Ring jeden Ausgang;
  drei Ziele an Ausgängen, eines bekommt sein Licht in der Lösung von einer dritten Quelle über einen Spiegel von aussen.
  So ist die Grundfarbe knapp (3 Quellen, 3 Ziele), und ohne die dritte Quelle zeigt sich ihr Verlust an keinem Ziel.
  Der Baustein nimmt nur Ringe, die schon ohne Reparatur eindeutig sind (sonst machte das Festigen einen Eckspiegel
  fest und nähme einer Quelle den Weg durch den Ring: 32 % „Kernidee wirkungslos“).
- **Sammelstelle** (`sammelstelle.mjs`): ein Prisma in einer Stellung, die Licht aus zwei Richtungen bricht, ohne dass
  beide Zuläufe dieselbe Grundfarbe in dieselbe Richtung schicken (sonst ersetzt der eine den anderen); je Zulauf eine
  Quelle mit null oder einem Spiegel und ein eigenes Ziel auf einem seiner gebrochenen Strahlen.
- **Falle** (`falle.mjs`): Quelle mit Mischlicht und ein Prisma; in der Falle bricht es eine Grundfarbe direkt aufs Ziel,
  in der Lösung kommt dieselbe Grundfarbe über einen Spiegel dorthin. Dazu der Holzweg: Eine übrige Grundfarbe läuft in
  der Lösung über zwei Spiegel, deren zweiter auf ihrem Strahl in der Falle steht und sie dort auf einen Spiegel der
  Kernidee lenken kann. Das ergibt die weite Fast-Lösung (drei Elemente anders, ein Ziel dunkel), die die Falle der
  Beurteilung verlangt. Ohne den Holzweg: 6 statt 318 Level aus 1000 Seeds (bei 24 Versuchen je Seed).
- **Lockvogel** (`lockvogel.mjs`): Ringtausch dreier Quellen derselben Farbe, je mit einem Spiegel; Spiegel i bringt
  sein Licht in der Lösung zu Ziel i, in der anderen Stellung zu Ziel i + 1. Ein fester Spiegel (70 %) oder Blocker auf
  einem Tauschweg, ohne Licht in der Lösung, verstellt den Ringtausch. Er bekommt in einem Viertel der Strahlbilder Licht
  und liegt auf einem der drei Holzwege (zwei Spiegel im Tausch, der dritte läuft in ihn); ohne ihn hätte das Level eine
  zweite Lösung. Die Quellen stehen in beliebiger Richtung am Rand, nicht meist entlang des längsten Wegs: Drei Wege im
  Kreis kreuzen sich nur, wenn nicht alle Spiegel parallel lenken.

**Review-Hinweise zum Lockvogel:** `wirkungslos` (`schritte.mjs`) lässt feste Teile der Kernidee ohne Licht in der
Lösung aus, also die Lockvögel des Bausteins; sie prüft die volle Beurteilung mit dem Licht der Suche ohne
Abschneiden. Der Generator macht dafür keine eigene Suche, und `beurteile` bleibt unverändert. Ein Lockvogel, den die
Beurteilung für nötig hält, zählt ohnehin auch über die Lösung (ohne ihn gäbe es eine zweite Lösung); darum besteht der
Test „kein fester Spiegel ohne Wirkung“ weiter. **Bitgleich:** Für `leicht` und `leicht-mischziel` liefert der
Generator für die Seeds 1–2000 dieselben Level und Gründe wie auf `974c4f0` (Level und Schwierigkeit als JSON
verglichen, 4000 von 4000 gleich).

**Ausbeute je Kernidee** (17.10.2026, i7-9750H, Node 22.12.0, `LEISE_CPU=50`, `--jobs 4`, Seeds 1–5000 je Gruppe,
Abnahme `beurteilung`; gezählt sind Level, in denen die verlangte Kernidee nötig ist):

| Auftrag | Level aus 5000 Seeds | CPU-s | Level je CPU-Stunde | alt, bestes Profil | alt, Stufe 1–3 | Schwierigkeit Q1 / Median / Q3 |
|---|---:|---:|---:|---:|---:|---|
| `leicht` (ohne) | 4412 (88 %) | 22,4 | 709 071 | 335 571 (1-farbe) | 80 383 | 23,5 / 28,7 / 34,6 |
| `leicht-mischziel` | 3876 (78 %) | 18,8 | 742 213 | 5 455 (2-bunt) | 605 | 28,4 / 31,2 / 35,4 |
| `leicht-abschalten` | 4320 (86 %) | 21,4 | 726 729 | 13 846 (2-spiegel) | 978 | 22,3 / 28,5 / 33,8 |
| `leicht-abzaehlen` | 3475 (70 %) | 51,2 | 244 336 | 379 (3-bunt) | 140 | 28,5 / 28,5 / 29,1 |
| `leicht-sammelstelle` | 4033 (81 %) | 29,7 | 488 848 | 1 125 (3-filter) | 140 | 27,8 / 32,8 / 37,2 |
| `leicht-falle` | 3164 (63 %) | 80,8 | 140 970 | 1 895 (2-prisma) | 326 | 26,1 / 27,0 / 34,0 |
| `leicht-lockvogel` | 3898 (78 %) | 155,3 | 90 359 | 1 895 (2-prisma) | 233 | 18,8 / 21,0 / 23,2 |

- Der alte Generator lief in derselben Sitzung mit den 16 Profilen der Stufen 1–3, je 5000 Seeds (1741 Level, 77 CPU-s);
  „alt, Stufe 1–3“ sind seine leichten Level mit dieser Kernidee über alle 16 Profile. Seine Zahlen je Kernidee beruhen
  auf wenigen Leveln (je Profil 1–12), sind also grob. Faktor neu / alt gegen das beste Profil: ohne Kernidee × 2,1,
  Mischziel × 136, Abschalten × 52, Farben abzählen × 645, Sammelstelle × 435, Falle × 74, Lockvogel × 48.
- Ohne Kernidee kommen die übrigen Kernideen selten von selbst vor (je CPU-Stunde: Abschalten 14 786, Mischziel 13 339,
  Falle 1 446, Sammelstelle 1 286, Lockvogel 482, Farben abzählen 161).
- Teuer sind Lockvogel (31 ms je Seed: bis 80 Versuche zu je 20 Verteilungen der Spiegel, bis der Ringtausch passt) und
  Falle (16 ms: bis 80 Versuche). Je angenommenes Level sind es 40 bzw. 26 ms, sonst 5–15 ms.
- Gründe ohne Level (Proben mit je 500–1000 Seeds): Abschalten vor allem „Kernidee wirkungslos“ (rund 9 %: Quelle B
  kann über den Spiegel von A auch das zweite Ziel von A beliefern, das Festigen macht den Spiegel von A fest);
  Farben abzählen „nicht eingebaut“ (18 %) und „Kernidee nicht nötig“ (14 %); Sammelstelle „Kernidee wirkungslos“
  (8 %); Falle „nicht eingebaut“ (17 %), dazu „nicht eindeutig“, „nicht nötig“ und Probieren (je 3–5 %); Lockvogel
  „nicht eingebaut“ (20 %).
- Aufruf: `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator --generator neu --accept beurteilung --seeds 5000
  --jobs 4 --save neu.json`, der alte mit den Profilen 1-spiegel … 3-bunt als Gruppen und `--generator alt`.
  `tools/bench-baseline.json` bleibt unverändert.

**Beispiele** (`LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs <auftrag> --anzahl 1 | node tools/show.mjs`,
je die Lösung):

```
leicht-lockvogel, Seed 1    leicht-abzaehlen, Seed 1    leicht-falle, Seed 1
Q1 Q2  .  .  .  .  .         .  .  . Q2  .  .  .         .  .  .  .  .  .  .
 .  m  .  .  .  .  .        TG  .  .  g  .  .  .        M3  b P3  m  m  m Q4
TM M3  m  . TM  .  .        M1  g  g M3 TG  . Q3         b  .  r  .  .  .  .
 .  .  . M0  .  .  .         .  .  .  .  . M0  .        M1 m1  r  .  .  .  .
M3  m  m  m  m  m Q4         .  .  .  .  .  .  .         .  b  r  .  .  .  .
 m m2  .  .  .  .  .        M3  g  g M1  .  .  .         . TB M1  r  r  r TR
TM  .  .  .  .  .  .        Q6  .  . TG  .  .  .         .  .  .  .  .  .  .
```

Im Lockvogel-Level verstellt der feste Spiegel (1,5) den Ringtausch. Im Abzählen-Level erreichen die beiden Quellen
oben und unten links über den Ring alle drei grünen Ziele; die rechte Quelle beliefert eines über den Spiegel (5,3).
In der Falle zerlegt das Prisma das Magenta in Blau und Rot; in der naheliegenden Stellung bräche es das Rot direkt
aufs Ziel rechts unten.

**Tests** (nacheinander über `leise.sh`, Dauer mit Wartezeit und Deckel), alle grün:

| Lauf | Dauer |
|---|---:|
| `node tests/golden.mjs` | 18,7 s |
| `node tests/logic.test.mjs` (553 Tests) | 29,3 s |
| `node tests/generator.test.mjs` (22 Tests, 7 Aufträge je 50 Seeds) | 8,7 s |
| `node tests/beurteilung.test.mjs` (177 Tests) | 78,8 s |
| `node tests/levelliste.test.mjs` (28 Tests) | 50,7 s |

Der Generator-Test hat je Kernidee einen Auftrag in `AUFTRAEGE` (alle Prüfungen gelten für ihn) und je Kernidee einen
festen Seed (`FEST`: Mischziel 3, Sammelstelle 2, die übrigen 1), der ein leichtes Level mit der Kernidee nötig
liefert. Verlangt sind mindestens zwei Drittel der 50 Seeds für „ohne“ und Mischziel, mindestens die Hälfte für die
übrigen (gemessen 30–43 von 50). Die Prüfung „Kernidee ohne Baustein wird abgewiesen“ entfällt: Jede hat einen.

**Abweichungen und Entscheide:**
- **„Genau diese Kernidee“** heisst wie in Ticket 18: Die verlangte ist unter den nötigen. Andere dürfen dazukommen,
  etwa ein Mischziel in 10 % der Sammelstellen-Level.
- **Farben abzählen** ist einförmig: immer der Ring, die Schwierigkeit liegt fast immer bei 28,5. Für „leicht“ genügt
  das; für Abwechslung (und schwerere Grade) braucht es weitere Formen.
- **Lockvogel** ist klein: drei Spiegel, drei Ziele, alle Strahlen enden an Zielen, das Ergänzen setzt nichts dazu.
  Schwierigkeit 19–23, am unteren Rand von „leicht“.
- **Spiegel der Kernidee fest machen:** Das Festigen darf weiterhin einen Spiegel der Kernidee fest machen. Ihn
  auszunehmen brachte bei Abschalten nichts (aus „Kernidee wirkungslos“ wurde „zweite Lösung nicht blockierbar“) und
  schadete der Sammelstelle (ihre Zuleitungsspiegel dürfen fest werden); Farben abzählen schützt sich selbst (siehe oben).
- **Gemeinsame Dateien** nur so weit nötig geändert: `bausteine/index.mjs` (fünf Zeilen unter eigener Kommentarzeile,
  ein Satz im Kopf), `schritte.mjs` (nur `wirkungslos`, Lockvögel), in `index.mjs` nur ein Kommentar, README
  Abschnitt „Generator“. `vorgaben.mjs`, `verfeinern.mjs`, `bau.mjs` und die Beurteilung unverändert.

**Hinweise für Folgetickets:**
- **20 (Verfeinern):** Die Bausteine bauen für jeden Grad dasselbe; wie gross das Level wird, entscheidet das Ergänzen
  nach der Vorgabe. Lockvogel und Farben abzählen lassen dem Ergänzen kaum Platz (alle Strahlen enden an Zielen, drei
  Quellen); für schwerere Grade müssen sie offene Strahlenden lassen, oder das Verfeinern muss neue Quellen und Stränge
  setzen dürfen (heute begrenzt `quellen` der Vorgabe „leicht“ auf 3, die beide schon belegen). `braucht` der
  Bausteine (Quellen/drehbar): Abschalten 2/3, Farben abzählen 3/5, Sammelstelle 2/1, Falle 1/4, Lockvogel 3/3; eine
  Vorgabe mit weniger weist `maengel` ab. „leichter“ nimmt nur Elemente ausserhalb der Kernidee weg; bei Lockvogel und
  Farben abzählen gibt es keine. Beim Zusammenführen: Ticket 19 ändert in `schritte.mjs` nur `wirkungslos`.
- **21 (alte Werkzeuge abbauen):** Für den Vergleich je Kernidee reichen die 16 Profile der Stufen 1–3 mit 5000 Seeds
  (77 CPU-s); ist der alte Generator weg, sind die Zahlen oben die Ausgangszahlen.
- **23–26 (Austausch):** Je Kernidee liefert der Generator für „leicht“ reichlich Level (90 000 bis 740 000 je
  CPU-Stunde). Für die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ lässt sich gezielt je Kernidee
  bestellen (`leicht-abschalten` …). Die Haupt-Kernidee wählt die Beurteilung; sie ist nicht immer die verlangte, wer
  sie braucht, prüft `beurteilung.hauptKernidee`. Die Level aus Farben abzählen und Lockvogel sehen sich je
  untereinander ähnlich (siehe Abweichungen).
