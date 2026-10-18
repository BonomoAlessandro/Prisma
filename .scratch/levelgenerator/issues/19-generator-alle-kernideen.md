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
  fest und nähme einer Quelle den Weg durch den Ring: 32 % „Kernidee wirkungslos“). Die dritte Quelle und ihr Spiegel
  meiden die Ausgänge des Rings (seit dem Review, siehe dort).
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

**Ausbeute je Kernidee** (nachgemessen nach den Funden M1–M3 des Reviews, 17.10.2026, 23:22–23:27, i7-9750H,
Node 22.12.0, `LEISE_CPU=50`, `--jobs 4`, Seeds 1–5000 je Gruppe, Abnahme `beurteilung`; gezählt sind Level, in denen
die verlangte Kernidee nötig ist). Neu und alt liefen abwechselnd je zweimal in einem Lauf von `leise.sh` (neu, alt,
neu, alt); je Zelle stehen beide Läufe, der Faktor ist die Spanne von kleinstem neu / grösstem alt bis grösstem neu /
kleinstem alt:

| Auftrag | Level aus 5000 Seeds | CPU-s | Level je CPU-Stunde | alt, bestes Profil | Faktor | Schwierigkeit Q1 / Median / Q3 |
|---|---:|---:|---:|---:|---:|---|
| `leicht` (ohne) | 4412 (88 %) | 20,3 / 19,6 | 782 424 / 810 367 | 461 250 (1-spiegel) / 408 522 (1-farbe) | × 1,7–2,0 | 23,5 / 28,7 / 34,6 |
| `leicht-mischziel` | 3876 (78 %) | 14,7 / 14,9 | 949 224 / 936 483 | 6 923 / 5 806 (2-bunt) | × 135–163 | 28,4 / 31,2 / 35,4 |
| `leicht-abschalten` | 4320 (86 %) | 17,3 / 16,6 | 898 960 / 936 867 | 18 000 / 18 000 (2-spiegel) | × 50–52 | 22,3 / 28,5 / 33,8 |
| `leicht-abzaehlen` | 3977 (80 %) | 35,5 / 35,3 | 403 301 / 405 586 | 468 / 468 (3-bunt) | × 862–867 | 28,5 / 28,5 / 28,5 |
| `leicht-sammelstelle` | 4033 (81 %) | 19,6 / 19,9 | 740 755 / 729 588 | 1 241 / 1 286 (3-filter) | × 567–597 | 27,8 / 32,8 / 37,2 |
| `leicht-falle` | 3164 (63 %) | 47,5 / 46,4 | 239 798 / 245 483 | 2 769 / 2 571 (2-prisma) | × 87–95 | 26,1 / 27,0 / 34,0 |
| `leicht-lockvogel` | 3898 (78 %) | 88,4 / 87,7 | 158 742 / 160 009 | 2 769 / 2 571 (2-prisma) | × 57–62 | 18,8 / 21,0 / 23,2 |

- Der alte Generator lief mit den 16 Profilen der Stufen 1–3, je 5000 Seeds: 1741 Level in beiden Läufen, 61,7 und
  64,6 CPU-s. Über alle 16 Profile kam er auf 100 707 / 96 186 leichte Level je CPU-Stunde, mit Kernidee nötig auf
  Abschalten 1225 / 1170, Mischziel 759 / 724, Falle 408 / 390, Lockvogel 292 / 279, Farben abzählen und Sammelstelle
  je 175 / 167. Seine Zahlen je Kernidee beruhen auf wenigen Leveln (je Profil 1–12), sind also grob; die Abstände sind
  aber so gross, dass das nichts ändert.
- **Ohne Kernidee** ist der Vorsprung klein und hängt an der Sitzung: hier × 1,7–2,0, in den beiden Läufen des Reviews
  × 0,63 und × 1,22, in der ersten Messung dieses Tickets × 2,1. Die kleinen Profile rechnen je Lauf nur 1–3 CPU-s; je
  Profil schwankt der alte Generator bis × 1,6 (1-spiegel 1,6 gegen 2,6 CPU-s für dieselben 205 Level), in den Läufen
  des Reviews bis × 2,8 (0,8 gegen 2,2 CPU-s). An den Schritten von 15,6 ms liegt das kaum: Das Messskript zählt jede
  Mikrosekunde eines Prozesses genau einmal. Dass der neue Generator ohne Kernidee schneller ist als das beste alte
  Profil, ist auf diesem Rechner also nicht sicher belegt; er ist etwas langsamer bis doppelt so schnell.
- **Warum zwei Läufe statt 20 000 Seeds:** Beide Läufe nehmen dieselben Level an (gleiche Zahlen je Profil und
  Auftrag); was schwankt, ist die CPU-Zeit, nicht die Stichprobe. Mehr Seeds verkleinern diese Schwankung kaum, sie
  hängt an Turbo, Wärme und der Last der parallel arbeitenden Agenten. Abwechselnd in einem Lauf von `leise.sh` stehen
  beide Generatoren unter denselben Bedingungen, und die Spanne zeigt die Unsicherheit direkt.
- Ohne Kernidee kommen die übrigen Kernideen selten von selbst vor (je CPU-Stunde, Lauf 1: Abschalten 16 315,
  Mischziel 14 719, Falle 1 596, Sammelstelle 1 419, Lockvogel 532, Farben abzählen 177).
- Am teuersten sind Lockvogel (17,6 ms je Seed, 22,6 ms je Level: bis 80 Versuche zu je 20 Verteilungen der Spiegel,
  bis der Ringtausch passt) und Falle (9,4 bzw. 14,9 ms: bis 80 Versuche), sonst 4–9 ms je Level.
- Gründe ohne Level (Proben mit je 500–1000 Seeds): Abschalten vor allem „Kernidee wirkungslos“ (rund 9 %: Quelle B
  kann über den Spiegel von A auch das zweite Ziel von A beliefern, das Festigen macht den Spiegel von A fest);
  Farben abzählen nur noch „nicht eingebaut“ (203 von 1000 Seeds); Sammelstelle „Kernidee wirkungslos“ (8 %); Falle
  „nicht eingebaut“ (17 %), dazu „nicht eindeutig“, „nicht nötig“ und Probieren (je 3–5 %); Lockvogel „nicht
  eingebaut“ (20 %).
- Die erste Messung (vor dem Review, in einer anderen Sitzung) ergab dieselben Level, ausser Farben abzählen (3475
  statt 3977), und mehr CPU-Zeit: `leicht` 22,4 statt 20,3 CPU-s, Falle 80,8 und Lockvogel 155,3, die beiden noch ohne
  M2.
- Aufruf: `LEISE_CPU=50 sh tools/leise.sh sh serie.sh`; darin je Lauf `node tools/bench.mjs generator --generator neu
  --accept beurteilung --seeds 5000 --jobs 4 --save neu.json` und dasselbe mit den Profilen 1-spiegel … 3-bunt als
  Gruppen und `--generator alt`. `tools/bench-baseline.json` bleibt unverändert.

**Beispiele** (`LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs <auftrag> --anzahl 1 | node tools/show.mjs`,
je die Lösung):

```
leicht-lockvogel, Seed 1    leicht-abzaehlen, Seed 1    leicht-falle, Seed 1
Q1 Q2  .  .  .  .  .         .  .  . Q2  .  .  .         .  .  .  .  .  .  .
 .  m  .  .  .  .  .        TG  .  .  g  .  .  .        M3  b P3  m  m  m Q4
TM M3  m  . TM  .  .        M1  g  g M3 TG  .  .         b  .  r  .  .  .  .
 .  .  . M0  .  .  .         .  .  .  .  .  g  .        M1 m1  r  .  .  .  .
M3  m  m  m  m  m Q4         .  .  .  .  .  . M2         .  b  r  .  .  .  .
 m m2  .  .  .  .  .        M3  g  g M1  .  g  .         . TB M1  r  r  r TR
TM  .  .  .  .  .  .        Q6  .  . TG Q7  .  .         .  .  .  .  .  .  .
```

Im Lockvogel-Level verstellt der feste Spiegel (1,5) den Ringtausch. Im Abzählen-Level erreichen die beiden Quellen
oben und unten links über den Ring alle drei grünen Ziele; die dritte Quelle unten (4,6) beliefert das Ziel (4,2)
über den Spiegel (6,4), abseits der Ausgänge des Rings (seit dem Review ein anderes Level als vorher, weil die
dritte Quelle andere Wege meidet und der Zufall danach anders weiterläuft).
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
  (62–77 CPU-s), aber zweimal und abwechselnd mit dem neuen gemessen (siehe „Ausbeute je Kernidee“); ist der alte
  Generator weg, sind die Zahlen oben die Ausgangszahlen.
- **23–26 (Austausch):** Je Kernidee liefert der Generator für „leicht“ reichlich Level (160 000 bis 950 000 je
  CPU-Stunde). Für die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ lässt sich gezielt je Kernidee
  bestellen (`leicht-abschalten` …). Die Haupt-Kernidee wählt die Beurteilung; sie ist nicht immer die verlangte, wer
  sie braucht, prüft `beurteilung.hauptKernidee`. Die Level aus Farben abzählen und Lockvogel sehen sich je
  untereinander ähnlich (siehe Abweichungen).

**Review 17.10.2026** (Reviewer, im selben Worktree; Korrekturen im Commit „fix(generator): … (Review Ticket 19)“).
Geprüft: der Diff `974c4f0..abcf258` (fünf Bausteine, `wege.mjs`, `wirkungslos`, Test, README) gegen Spec „Generator“,
Glossar und Ticket 18; nachgemessen auf demselben Rechner (i7-9750H, Node 22.12.0), alles über `leise.sh` mit
`LEISE_CPU=50`, `--jobs 4`. Skripte im Scratchpad des Reviews (`review19/`).
- **Bitgleich:** `leicht` und `leicht-mischziel`, Seeds 1–2000, Level samt Beurteilung bzw. Grund als Hash gegen
  `974c4f0`: 4000 von 4000 gleich. Die Korrekturen dieses Reviews ändern kein Level: alle sieben Aufträge, Seeds
  1–1000, 7000 von 7000 gleich gegen `abcf258`.
- **`wirkungslos`:** In einer instrumentierten Kopie (1000 Seeds je Auftrag) greift die Ausnahme nur bei
  `leicht-lockvogel`; in den übrigen sechs Aufträgen nie. In jedem der 786 gelieferten Lockvogel-Level ist das feste
  Teil ohne Licht genau der Lockvogel der Beurteilung (567 feste Spiegel, 219 Blocker).
- **Abnahme:** Die vier Punkte sind erfüllt. Die Tests mit festem Seed prüfen, was sie sagen (Level geliefert, Kernidee
  laut neuer Beurteilung nötig, Grad leicht). Die Gründe ohne Level (1000 Seeds) decken sich mit den Proben oben.
- **Ausbeute:** Level je Auftrag (5000 Seeds) und Quartile stimmen genau, die CPU-Zeit des neuen Generators auf ±20 %
  (`leicht` 27,2, 21,8 und 22,6 CPU-s in drei Läufen, oben 22,4). Der alte Generator schwankt stark: 41,1 und
  61,6 CPU-s für dieselben 1741 Level (oben 77), je Profil bis × 2,8 (1-spiegel 0,8 gegen 2,2 CPU-s). Die Faktoren
  gegen das beste Profil sind darum nur grob: ohne Kernidee × 0,63 bzw. × 1,22 (oben × 2,1), Mischziel × 89 bzw.
  × 127 (× 136), Abschalten × 28 bzw. × 62 (× 52). Für die Kernideen bleibt der Abstand gross. Dass der neue Generator
  ohne Kernidee schneller ist als das beste alte Profil, ist auf diesem Rechner nicht belegt.
- **Selbst behoben** (ohne Wirkung auf die Level, siehe oben):
  - `lockvogel.mjs`: `linie.indexOf(ziel)` war immer −1, weil `strahl` vor dem Ziel hält (instrumentiert: in
    1000 Seeds nie gefunden); die Rechnung mit `bis` fällt weg.
  - `farben-abzaehlen.mjs`: Der Filter, der die Ecke aus `belegt` nahm, entfällt; `zufuehren` nimmt sie ohnehin dazu.
  - Kommentare: `wegzellen`, `auswege` und `rueckwaerts` (`wege.mjs`), „halb so oft“ statt „meist“ bei `GLEICH_ZIEL`,
    „leer“ statt „frei“ in `holzweg`, `FEST` und `ANTEIL_LEVEL` im Test. Zeilen über 120 Zeichen in den neuen Dateien
    umbrochen, wie im Code aus Ticket 18.
  - Test: Blocker ohne Wirkung werden geprüft wie feste Spiegel (`festeOhneWirkung`, mit Gegenprobe), weil der
    Lockvogel-Baustein in 30 % einen Blocker setzt und `wirkungslos` ihn auslässt.
- **Offen, mittel:** Farben abzählen verliert 14 % der Seeds an „Kernidee nicht nötig“, und alle diese Fälle haben die
  dritte Quelle oder ihren Spiegel auf einem Ausgang des Rings (`farben-abzaehlen.mjs`, `zufuehren` der dritten Quelle
  mit `belegt: ringzellen`). Steht ihr Spiegel zwischen Ecke und Ziel, erreicht der Ring das Ziel nicht mehr, und der
  Verlust einer Ringquelle zeigt sich doch an einem Ziel. Mit `belegt: new Set([...ringzellen, ...ausgaenge.flat()])`
  in einer Kopie: 797 statt 683 Level aus den Seeds 1–1000, 804 statt 706 aus 1001–2000, „nicht nötig“ 0.
- **Offen, mittel:** `frei` (`wege.mjs`) rechnet `durchgaenge` bei jedem Aufruf neu, `quelleIrgendwohin`
  (`lockvogel.mjs`) je Quellplatz. Im Profil (Seeds 1–400) sind das 17 % der Zeit bei Falle und 24 % bei Lockvogel,
  den beiden teuersten Aufträgen. Einmal je Strahlbild rechnen ändert kein Level.
- **Offen, mittel:** Die Faktoren gegen den alten Generator oben als Spanne aus mindestens zwei Läufen angeben (oder
  die alten Profile mit 20 000 Seeds messen), vor allem „ohne Kernidee“.
- **Offen, mittel (Design, nicht dringend):** Die Ausnahme in `wirkungslos` erkennt Lockvögel an „Kernidee und ohne
  Licht“. Heute setzt nur der Lockvogel-Baustein solche Teile; ein späterer Baustein oder ein fest gewordener Spiegel
  der Kernidee, der sein Licht verliert, fiele still durch. Eine ausdrückliche Markierung durch den Baustein wäre
  sicherer.
- **Frage an den Nutzer:** „genau diese Kernidee nötig“ ist umgesetzt als „die verlangte ist unter den nötigen“ (wie
  in Ticket 18). Die Haupt-Kernidee der Beurteilung ist fast immer die verlangte; Ausnahme sind 11 von 807
  Sammelstellen-Leveln mit Haupt-Kernidee Abschalten (1000 Seeds je Auftrag). Soll der Generator die Haupt-Kernidee
  verlangen (wichtig für die Regel der Tickets 23–26)?
- **Für Ticket 22 (Würfel):** Lockvogel (`s.wege.length === 2`) und Farben abzählen (ein Ausgang je Ecke) gehen davon
  aus, dass ein Spiegel Licht nur um 90° lenkt, also genau zwei Auswege hat. Das gilt in der flachen Feldform.

**Umsetzung der Funde M1–M3 (17.10.2026, Entwickler; M4 kommt nach dem Zusammenführen mit Ticket 20):**
- **M1 umgesetzt:** Die dritte Quelle von Farben abzählen und ihr Spiegel meiden jetzt auch die Ausgänge des Rings;
  Seeds 1–1000 liefern 797 statt 683 Level, „Kernidee nicht nötig“ kommt nicht mehr vor (übrig nur „nicht eingebaut“,
  203), aus 5000 Seeds 3977 statt 3475; der feste Seed 1 liefert weiter ein Level (ein anderes, Beispiel oben).
- **M2 umgesetzt:** `lichtzellen` (`wege.mjs`) rechnet die Durchgänge einmal je Strahlbild (WeakMap auf `bau.bild()`),
  `quelleIrgendwohin` einmal statt je Quellplatz; `bau.mjs` unverändert. M2 allein lässt alle sieben Aufträge
  bitgleich zu `abcf258` (Seeds 1–1000); mit M1 bleiben sechs gleich, Farben abzählen ändert sich nur wegen M1. In
  derselben Sitzung abwechselnd vor/nach gemessen: Falle 70,8 / 71,1 → 48,2 / 49,1 CPU-s (−31 %),
  Lockvogel 121,5 / 118,5 → 90,8 / 88,8 CPU-s (−25 %).
- **M3 umgesetzt:** Neu und alt abwechselnd je zweimal in einem Lauf von `leise.sh`, gleiche Seeds und `--jobs 4`; die
  Tabelle oben nennt beide Läufe und die Faktoren als Spanne. Ohne Kernidee × 1,7–2,0 in dieser Sitzung, mit den
  Läufen des Reviews × 0,63–2,0: Ein Vorsprung ohne Kernidee ist nicht sicher belegt; mit Kernidee × 50 bis × 867.
- Tests danach grün: `generator.test.mjs` (23 Tests), `golden.mjs`, `logic.test.mjs` (553 Tests).
- **M4 umgesetzt** (18.10.2026, nach dem Merge mit Ticket 20, im Branch von Ticket 20): Lockvögel sind ausdrücklich
  markiert.
  - `bau.lockvoegel` ist ein Set. `setze(el, { kern, lockvogel })` trägt ein, `entferne` und `leere` nehmen weg, und
    das Zurücksetzen von „schwerer“ (`verfeinern.mjs`) stellt die Markierung wieder her.
  - Der Lockvogel-Baustein setzt sie, `wirkungslos` nimmt nur markierte Lockvögel ohne Licht aus. Ein anderes festes
    Teil der Kernidee fällt nicht mehr still durch.
  - Bitgleich: alle sieben leichten Aufträge über Seeds 1–1000, dazu Seeds 1–100 aller mittleren Aufträge und
    `schwer-lockvogel`. Der Generator-Test ist grün.

**Nachprüfung 17.10.2026** (Reviewer, `c35cb99`): M1–M3 sind behoben.
- **Bitgleich:** Seeds 1–1000 gegen `abcf258`: sechs Aufträge gleich. Farben abzählen ist 797 Level, genau wie die
  Kopie des Reviews mit nur M1 (1000 von 1000 gleich); M2 ändert also kein Level.
- **WeakMap:** In einer Kopie vergleicht `lichtzellen` bei jedem Aufruf mit einem frisch verfolgten Strahlbild:
  0 veraltet in 915 781 Aufrufen (Seeds 1–300 je Baustein, Falle 1–100). Durchgesehen: Wo der Code Elemente des Baus
  ändert (`setze`, `entferne`, `leere`, `setRot` in `loese`, Zielfarben in `aufraeumen`, `fixed` in `eindeutig`), folgt
  `geaendert()`, bevor `bau.bild()` wieder gelesen wird. Veralten könnte die Map nur zusammen mit `bau.bild()` selbst;
  ein neues Risiko kommt also nicht dazu. Im Kommentar steht jetzt, dass die geteilte Map nur gelesen wird.
- **Laufzeit:** vor/nach abwechselnd, je 2000 Seeds, dieselben Level: Falle 28,6 / 30,7 → 20,0 / 18,9 CPU-s (−34 %),
  Lockvogel 50,3 / 49,4 → 36,1 / 37,9 CPU-s (−26 %), ähnlich wie oben (−31 % / −25 %).
- **Zahlen in Stichproben:** Die Level je CPU-Stunde und die Faktoren der Tabelle folgen aus Leveln und CPU-s; alle
  sieben Zeilen nachgerechnet; Farben abzählen mit 5000 Seeds nachgemessen: 3977 Level, Quartile 28,5, 36,3 CPU-s.
  Korrigiert: Die Schwankung des alten Generators liegt kaum an den Schritten von 15,6 ms (das Messskript zählt jede
  Mikrosekunde genau einmal). Mit × 0,63 ist der neue ohne Kernidee „etwas langsamer bis doppelt so schnell“, nicht
  „gleich schnell bis doppelt so schnell“. Bei M2 ist umformuliert, was bitgleich ist.
- Tests danach grün: `golden.mjs`, `logic.test.mjs` (553 Tests), `generator.test.mjs` (23 Tests).
