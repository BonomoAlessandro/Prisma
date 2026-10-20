# 18: Generator: erster Durchstich für „leicht“

**What to build:** Der neue Generator liefert auf einen Auftrag hin ein Level oder nichts. Der Auftrag besteht aus
Grad, Kernidee, Seed und Feldform. Der erste Durchstich deckt den Grad „leicht“ ab, ohne Kernidee und mit der Kernidee
Mischziel aus zwei Quellen (ADR 0004). Die Lehren aus der Messung der Effizienz sind von Anfang an eingebaut.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Effizienz“, Nahtstelle 4 unter „Entscheide zu den Tests“.

**Blocked by:** 12 (Schwierigkeit geeicht), 13 (Spielwert geeicht)

**Status:** resolved

- [x] Der Generator hat einen einzigen Einstieg: Ein Auftrag mit Grad, Kernidee, Seed und Feldform ergibt ein Level oder
      nichts.
- [x] Für „leicht“ liefert er Level, ohne Kernidee und mit der Kernidee Mischziel aus zwei Quellen.
- [x] Derselbe Auftrag mit demselben Seed ergibt dasselbe Level.
- [x] Jedes gelieferte Level erfüllt vier Bedingungen:
      - genau eine Lösung, geprüft mit dem Modus aus Ticket 04;
      - die Beurteilung ist bestanden;
      - der verlangte Grad ist erreicht;
      - die verlangte Kernidee ist nötig.
- [x] Günstige, exakte Prüfungen laufen zuerst. Bei zu wenigen Klicks bekommt ein Kandidat eine neue Startstellung,
      statt verworfen zu werden. Es gibt nur Budgets, die die Untergrenzen erreichen können.
- [x] Der Generator setzt keine wirkungslosen Elemente. Ein Filter, dessen Strahl schon die Filterfarbe hat, kommt
      nicht vor, ebenso ein fester Spiegel, der weder für die Lösung zählt noch als Lockvogel wirkt. Ein Test mit
      festen Seeds belegt das.
- [x] Der Generator kennt das Feld nur über die Feldform.
- [x] Er läuft nur über die gedeckelte Umgebung mit höchstens 50 % CPU.
- [x] Tests der Nahtstelle Generator prüfen Determinismus, Eindeutigkeit und die bestandene Beurteilung.
- [x] Das Messskript aus Ticket 02 misst die angenommenen Level je CPU-Stunde für „leicht“ und vergleicht mit dem
      heutigen Generator, beide mit der Beurteilung als Abnahme. Das Ergebnis steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 02 (Messskript):** `--compare` in `tools/bench.mjs` vergleicht nur Gruppen gleichen Namens.
Über einen Generatorwechsel, also den alten Generator nach Profilen gegen den neuen nach Graden, vergleicht es noch
nicht, und `grades` und `total` vergleicht es gar nicht. Das in diesem Ticket nachrüsten, zusammen mit dem neuen
Generator in `GENERATORS` und der Beurteilung in `ACCEPTANCES`.

**Hinweis aus Ticket 04 (Löser schneller):**
- **Eindeutigkeit** mit `solve(level, { unique: true })` prüfen. Er hält bei der zweiten Lösung an. Bei höchstens einer
  Lösung liefert er genau dasselbe wie ohne den Modus, also auch Knoten und Rateschritte für die Beurteilung.
  `maxNodes` zählt nur bis zum Anhalten: „zu gross“ heisst dann „bis zur zweiten Lösung zu gross“.
- **Doppelte Suchen vermeiden:** `metrics(level, { sol, full })` übernimmt Suchen, die der Aufrufer schon hat; `finish`
  in `tools/generate.mjs` zeigt, wann sie noch gelten (solange das Feld gleich bleibt). Die Beurteilung sollte Suchen
  ebenso annehmen.
- **Teuer ist im alten Generator jetzt die Lockvogel-Suche** in `generateOne`: 47 % der Zeit, davon gut die Hälfte in
  den Rückrufen je Blatt (`pathCells`, `segmentCells`), nicht im Löser. Danach kommen die Vollsuche in `finish` (16 %)
  und `makeUnique` (15 %). Statistiken über alle Blätter günstiger sammeln (z. B. aus `events` statt aus Abschnitten)
  oder nur eine Vollsuche mit allen Rückrufen machen.
  - Gemessen ist das mit `node --cpu-prof` über `generateOne` für die Seeds 1–4000 je Profil in 3-misch, 3-bunt,
    4-prisma und 3-prisma, in einem Prozess.
  - Angegeben ist die Zeit in `solve` samt Rückrufen, nach Aufrufer, als Anteil an der ganzen Zeit.
- **Löser über das Messskript:** `bench.mjs solver --unique` misst den Modus; die Level ohne Blocker zeigen, was der
  Abbruch bei der zweiten Lösung bringt (× 2,8–2,9 gegen den Standard).

**Abschluss 17.10.2026.** Gearbeitet im Worktree `prisma-wt/t18` auf dem Branch `ticket-18` (Stand `456a4d1`). Alle
Läufe gingen über `leise.sh`, nacheinander: Generator und Messskript mit `LEISE_CPU=50`, Tests mit 20 %.

**Entwurf** (`tools/generator/`, README „Generator“): ein Einstieg, `generiere({ grad, kernidee, seed, feldform })` in
`index.mjs`. Er liefert `{ level, beurteilung }` mit Leveldaten wie in LEVELS (Name leer, `grad`, Startstellung,
`solution`) und ihrer Beurteilung, oder `{ level: null, grund }`. Einen Auftrag, den er nicht kennt, weist er mit einem
Fehler ab (Grad ohne Vorgabe: Ticket 20, Kernidee ohne Baustein: Ticket 19). Ein Ablauf für alle Grade:
1. **Kernidee einbauen:** Je Kernidee ein Baustein in `bausteine/`, mit einer Zeile in `bausteine/index.mjs`
   registriert (wie `regeln.mjs`). Ein Baustein hat `kernidee` (Glossarbegriff), `braucht` (Quellen und drehbare
   Elemente, die er mindestens setzt) und `baue(bau, plan, vorgaben)`.
   - `ohne.mjs` setzt nichts.
   - `mischziel-zwei-quellen.mjs` setzt zwei farbige Quellen, deren Farben zusammen eine Mischfarbe ergeben, die keine
     allein hat (Rot + Grün bis Gelb + Cyan), und je ein bis zwei drehbare Spiegel auf ihren Weg. Das Ziel kommt auf
     eine Zelle, durch die das Licht beider läuft, je allein gemessen (die andere schluckt wie in der Beurteilung).
     Quellen, Ziel und die Spiegel auf den Wegen sind als Kernidee geschützt, die Zellen der Wege reserviert.
2. **Ergänzen** bis zur Grösse, die die Vorgabe des Grads würfelt (`vorgaben.mjs`, ersetzt die Profile). Neue drehbare
   Elemente kommen nur ans offene Ende eines Strahls, auf eine Zelle ohne anderen Strahl; so behalten frühere Elemente
   und Ziele ihr Licht. Endet kein Strahl mehr offen, kommt eine Quelle dazu. Danach Filter (nur auf Mischlicht, mit
   Platz dahinter), feste Spiegel und an jedem endenden Strahl ein Ziel (bis zur Obergrenze).
3. **Festigen** (`schritte.mjs`):
   - Ziele färben; Ziele, drehbare Elemente und Filter ohne Licht wegnehmen, ebenso drehbare Elemente, deren Licht kein
     Ziel erreicht;
   - Eindeutigkeit herstellen, mit höchstens zwei Reparaturen (Blocker oder fester Spiegel) und der Suche im Modus
     unique;
   - wirkungslose Elemente wegnehmen.
   Ist der Bau danach kleiner als gewürfelt, wird bis zu dreimal nachgelegt; unter der Untergrenze ist er verworfen.
4. **Startstellung:** Jedes drehbare Element steht anders als in der Lösung, höchstens ein Ziel leuchtet (bei einem
   keines), mindestens 3 Klicks. Reichen die Klicks nicht, drehen einzelne Elemente weiter weg; misslingt es, kommt eine
   neue Startstellung (bis 20), statt das Level zu verwerfen.
5. **Beurteilen und verfeinern:** Zuerst die günstige, exakte Vorprüfung, die Beurteilung mit `teuer: false`
   (Scheinmischung, Knäuel, ab „mittel“ Füllteil und Zerfall, die Kernideen, die nicht teuer sind, darunter das
   Mischziel). Dann die volle Beurteilung, über denselben Zwischenstand. Ist der Grad zu hoch, nimmt der Schritt
   „leichter“ (`verfeinern.mjs`) ein drehbares Element ausserhalb der Kernidee weg, höchstens zweimal bei „leicht“, und
   die Beurteilung beginnt von neuem; Ausschlüsse und Spielwert gelten so in jedem Schritt.

Ein geliefertes Level erfüllt die vier Bedingungen: genau eine Lösung, kein Grund der Levelliste (`GRUENDE` aus
`levelliste.mjs`: kein Ausschlussgrund, ab „mittel“ eine nötige Kernidee und der Mindest-Spielwert), der verlangte Grad
nach `grad.mjs` und die verlangte Kernidee unter den nötigen. „Ohne Kernidee“ heisst: keine verlangt; nötige Kernideen
dürfen trotzdem vorkommen. Aller Zufall kommt aus dem Seed (`zufall.mjs`, aus `generate.mjs` übernommen, damit nichts
vom alten Generator abhängt).

**Effizienz:**
- Günstige, exakte Prüfungen zuerst: Eindeutigkeit (bis zur zweiten Lösung) und die Regel gegen wirkungslose Elemente
  brauchen nur die Strahlregel und kleine Suchen. Die Vorprüfung kostet auf kleinen Leveln ein Sechstel der vollen
  Beurteilung (0,6 gegen 3,8 ms); die Suche ohne Abschneiden kommt zuletzt.
- Keine doppelten Suchen: Der Generator macht selbst keine Suche ohne Abschneiden, nur die der Beurteilung läuft. Die
  Suche im Modus unique läuft nur, wenn sich der Bau geändert hat. Vorprüfung und volle Beurteilung teilen sich ihre
  Zwischenergebnisse, auch die Suchen je Quelle (`allein`). Das Messskript übernimmt die Beurteilung, die der Generator
  mitgibt.
- Bei zu wenigen Klicks eine neue Startstellung (siehe 4).
- Budgets: Die Vorgabe würfelt die Grösse aus denselben Bereichen, die sie verlangt; das Ergänzen füllt bis dahin auf
  und legt nach. `maengel` in `vorgaben.mjs` prüft beim Auftrag, dass eine Vorgabe ihre Untergrenzen erreichen kann:
  gültige Bereiche, Platz für den Baustein, Klicks mit den wenigsten drehbaren Elementen erreichbar. Eine Vorgabe wie
  das alte Profil 5-filter würde abgewiesen.

**Keine wirkungslosen Elemente** (Regel des Generators, `wirkungslos` in `schritte.mjs`):
- Filter: Jeder nimmt einem Strahl der Lösung Farbe (sein Strahl hat nicht schon die Filterfarbe), gibt keine fremde
  Farbe ab (so verlangt es der Logiktest für Level im Spiel) und zählt für die Lösung.
- Feste Spiegel und Blocker zählen für die Lösung: Ohne sie bekäme ein Ziel anderes Licht, oder es gäbe eine zweite
  Lösung.
- Dazu: Jede Quelle bringt einem Ziel Licht, jedes Ziel hängt von einem drehbaren Element ab.
- Lockvögel setzt der Generator noch keine; ein festes Teil zählt deshalb nur über die Lösung (siehe Hinweis für 19).
- Der Test prüft die gelieferten Level unabhängig: keinen Filter, dessen Strahl schon seine Farbe hat; keinen festen
  Spiegel, der weder für die Lösung zählt noch als Lockvogel wirkt (Lockvogel wie in der Beurteilung: ohne Licht in der
  Lösung, in mindestens 10 % der Strahlbilder mit Licht). Eine Gegenprobe an einem handgebauten Level zeigt, dass die
  Prüfung solche Elemente findet: einen Gelbfilter auf rotem Licht, einen festen Spiegel, der Licht nur aus dem Feld
  lenkt, und einen, der nie Licht bekommt.

**Nur über die Feldform:** Zellen, Nachbarn, Richtungen, Stellungen und die Wirkung der Elemente kommen aus der
Feldform. Neue Elemente entstehen mit `feldform.element`, Quellen mit `quelleStatt` aus einem Kombinator in der
gewünschten Richtung, die Gegenrichtung über die Nachbarn wie im Spielermodell. Der Test sucht im Quelltext (ohne
Kommentare) nach `.x`, `.z`, `DIRS`, `reflectOnMirror`, `refractInPrism`, `split(',')`, `.rot`, `.dir` und `% 8`.

**Gedeckelt:** `generiere` prüft einmal je Prozess, dass er mit tiefster Priorität und `LEISE_CPU` höchstens 50 läuft;
sonst wirft er (der Test zeigt es mit `LEISE_CPU=60`). Kommandozeile `tools/generiere.mjs <auftrag>`, Messskript
`bench.mjs generator --generator neu`.

**Ergänzungen an der Beurteilung** (klein und bitgleich, wie verlangt):
- `beurteile(level, { zwischenstand })`: eine Map für die Werte von `ctx.merke`. Eine zweite Beurteilung desselben
  Levels mit demselben Grad rechnet nichts davon nach; für ein anderes Level oder einen anderen Grad wirft sie (seit
  dem Review auch für dasselbe Level, wenn es sich seither verändert hat, verglichen als JSON).
- Feldform: `element(zelle, angaben)` (Leveldaten eines Elements in einer Zelle) und `rahmen` (Angaben des Felds, im
  Feld 7 × 7 keine). Ohne sie müsste der Generator Koordinaten kennen.
- Feldform, nur Laufzeit: Die Nachbarn stehen in einer Tabelle je Feldform, und `feldformVon` legt die flache Feldform
  je Grösse einmal an (seit dem Review eingefroren). Das CPU-Profil des Generators zeigte 40 % der ganzen Zeit in
  `nachbar`: Das Spielermodell fragt die Nachbarn in jeder Beurteilung zehntausendfach ab, und jede Abfrage zerlegte
  den Zellschlüssel. Danach brauchte der Generator 3,4 statt 4,9 ms je Seed (ohne Kernidee, 1000 Seeds, ein Prozess),
  mit denselben Leveln.
- Nachweis: Alle 342 Beurteilungen der Tests (42 Kandidaten der Eichmenge, die 150 mit und ohne teure Regeln) vor und
  nach den Änderungen, je mit `isDeepStrictEqual` verglichen: 342 von 342 gleich. Mit Zwischenstand (erst ohne, dann
  mit den teuren Regeln) die 192 Beurteilungen mit teuren Regeln: 192 von 192 gleich.
- Tests dazu: im Einstieg (Zwischenstand gleich wie ohne, Fehler bei fremdem oder verändertem Level oder anderem Grad)
  und in der Feldform (Nachbarn gleich dem Schritt über die Koordinaten in 3 × 3, 5 × 5 und 7 × 7; `element` und
  `rahmen`; eingefroren).

**Messung** (17.10.2026, 10:21–10:34, i7-12800H, Node 22.12.0, `LEISE_CPU=50`, `--jobs 4`, Seeds 1–20 000 je Gruppe,
Abnahme `beurteilung`: genau eine Lösung und die Beurteilung bestanden, Grad nach der Schwierigkeit). Der alte
Generator lief mit den 16 Profilen der Stufen 1–3 (Stufe 4 und 5 liefern kaum leichte Level). Lauf 2 in umgekehrter
Reihenfolge, nur neu und Stufe 1–2.

| Level je CPU-Stunde, „leicht“ | Lauf 1 | Lauf 2 | Schwierigkeit Q1 / Median / Q3 |
|---|---:|---:|---|
| neu, `leicht` (17 660 von 20 000 Seeds) | 1 222 615 | 1 229 710 | 23,5 / 28,8 / 34,5 |
| alt, bestes Profil 1-farbe (976 von 20 000) | 650 667 | 717 061 | 11,4 / 16,2 / 19,6 |
| alt, Stufe 1–2 (10 Profile) | 271 959 | 284 488 | |
| alt, Stufe 1–3 (16 Profile) | 126 728 | | |
| neu, `leicht-mischziel`, Mischziel nötig (15 672 von 20 000) | 1 060 511 | 1 042 869 | 28,4 / 31,2 / 35,4 |
| alt, Mischziel nötig, bestes Profil 2-bunt | 8 100 | 8 526 | |
| alt, Mischziel nötig, Stufe 1–2 | 1 585 | 1 659 | |
| alt, Mischziel nötig, Stufe 1–3 | 859 | | |

- **Faktor neu / alt:** „leicht“ × 1,88 bzw. × 1,71 gegen das beste Profil, × 4,5 bzw. × 4,3 gegen Stufe 1–2, × 9,6
  gegen Stufe 1–3. Mischziel × 131 bzw. × 122 gegen das beste Profil.
- Die neuen Level sind grösser: Ihre Schwierigkeit liegt im Bereich der leichten Level im Spiel (19,8–42,8, Median um
  33), die des besten alten Profils fast ganz darunter.
- Die angenommenen Level waren in beiden Läufen dieselben (gleiche Fingerabdrücke je Gruppe).
- CPU-Zeit: neu 105 CPU-s für 40 000 Seeds; alt 77 CPU-s für die 200 000 Seeds der Stufe 1–2 und 116 CPU-s für die
  120 000 der Stufe 3.
- Alt je Profil, Lauf 1: 1-spiegel 286 349, 1-prisma 423 907, 1-filter 346 588, 1-farbe 650 667, 2-spiegel 321 231,
  2-prisma 273 830, 2-filter 163 459, 2-farbe 466 714, 2-misch 39 293, 2-bunt 144 900, 3-spiegel 42 677, 3-prisma
  36 706, 3-filter 33 818, 3-farbe 118 537, 3-misch 4 712, 3-bunt 22 710.
- Gründe ohne Level, neu `leicht` (2 340 von 20 000): keine Ziele 714, zu klein 452, Scheinmischung 328, Probieren 277,
  zweite Lösung nicht blockierbar 226, Grad mittel und „leichter“ zu klein 209, nicht eindeutig 64, Knäuel 59, übrige
  11.
- Gründe ohne Level, neu `leicht-mischziel` (4 328): zu klein 2 503 (das Mischziel hat oft nur zwei drehbare Spiegel,
  und kein Strahl endet mehr offen), Grad mittel und „leichter“ zu klein 595, Kernidee wirkungslos 565, Probieren 284,
  Mischziel nicht eingebaut 177, übrige 204.
- Aufruf: `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator --generator neu --accept beurteilung
  --seeds 20000 --jobs 4 --save neu.json --compare alt.json`, der alte mit den Profilen als Gruppen und
  `--accept beurteilung`. `--compare` zeigt den Generatorwechsel je Auftrag, über alle Profile und im besten Profil.
- Mit 4 statt 10 Prozessen gemessen, damit der Speicher klein bleibt; verglichen wird nur bei gleichem `--jobs`, beide
  in derselben Sitzung. `tools/bench-baseline.json` bleibt unverändert (andere Abnahme, andere Seeds).
- **Nachtrag aus dem Review:** Die erste gemessene Gruppe trug das Aufwärmen der JIT (die ersten rund 250 Seeds je
  Prozess bis dreimal so langsam); bei 5000 Seeds kam sie auf 0,63-mal ihren Wert als zweite Gruppe, bei 20 000 Seeds
  sind es geschätzt 10 %. Das Messskript wärmt sich darum jetzt 5 statt 0,3 CPU-s auf. Nachmessung mit 5000 Seeds,
  beide Generatoren in derselben Sitzung: `leicht` 1,01–1,12 Mio. gegen 1-farbe 0,52 Mio. (× 1,9–2,1), Mischziel
  1,03–1,11 Mio. gegen 2-bunt 7500 (× 140–148). Die Abnahme beurteilt Kandidaten des alten Generators, die ohne Grad
  einen Ausschluss haben und leicht sind, ein zweites Mal (1-farbe: 162 von 261, rund 10 % seiner CPU-Zeit); das
  begünstigt den neuen leicht.

**Beispiele** (`LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs leicht --anzahl 3`, je die Lösung):

```
leicht, Seed 1: Schwierigkeit 23,5, Spielwert 47,8, keine Kernidee; 3 drehbar, 2 Ziele
 .  . m3  g TG  .  .
 .  .  g  .  .  .  .
M3  r  r  r  r  r TR
 r  .  g  .  .  .  .
 r  . M1  g  g  g Q4
 r  .  .  .  .  .  .
M1  r  r  r  r FR Q4

leicht-mischziel, Seed 3: Schwierigkeit 25,7, Spielwert 88,1, Haupt-Kernidee Mischziel aus zwei Quellen
 .  .  .  .  .  .  .
 .  .  .  .  .  .  .
 .  . M3 TW  .  .  .
Q0  c  y M3  .  .  .
Q0  y M3  .  .  .  .
```

Im ersten Level macht der Rotfilter aus dem Weiss der Quelle unten rechts Rot; das Grün der zweiten Quelle läuft über
den festen Spiegel oben zum Ziel. Im zweiten bringen Cyan und Gelb zusammen Weiss aufs Ziel, keine Quelle allein.
Weitere: `leicht` Seeds 2 und 3 (Schwierigkeit 21,1 und 15,4), `leicht-mischziel` Seeds 4 und 5 (24,4 und 23,5).

**Tests** (nacheinander über `leise.sh`, 10:36–10:38, Dauer innerhalb der Sperre), alle grün:

| Lauf | Dauer |
|---|---:|
| `node tests/golden.mjs` | 3,1 s |
| `node tests/logic.test.mjs` (553 Tests) | 17,4 s |
| `node tests/levelliste.test.mjs` (18 Tests) | 26,6 s |
| `node tests/beurteilung.test.mjs` (176 Tests) | 36,1 s |
| `node tests/ki-tester.test.mjs` (54 Tests) | 0,5 s |
| `node tests/generator.test.mjs` (16 Tests, je 50 Seeds) | 1,0 s |

**Abweichungen und Entscheide:**
- **Untergrenze drei drehbare Elemente** für „leicht“ (die alte Stufe 1 erlaubte zwei). Mit zwei lagen die Level im
  Median bei 16,5 und damit oft unter dem leichtesten Level im Spiel (19,8).
- **Wirkungslos** gilt auch für Quellen, Ziele, Blocker und drehbare Elemente, deren Licht kein Ziel erreicht; die Spec
  nennt nur Filter und feste Spiegel. Ohne das blieben Ziele, die geschenkt leuchten, und Spiegel, die frei drehen.
- **Fremde Filterfarbe:** übernommen als Regel des Generators, weil `tests/logic.test.mjs` sie für Level im Spiel
  verlangt.
- **Ergebnis bei „nichts“:** `{ level: null, grund }`, damit Messskript und Kommandozeile die Gründe zählen.
- **Abnahme im Messskript:** Sie übernimmt die mitgegebene Beurteilung des neuen Generators (der Test prüft, dass sie
  genau die des Levels ist) und prüft die Eindeutigkeit für beide Generatoren selbst (0,2 ms je Level).
- **Verfeinern** bei „leicht“: Der Schritt „leichter“ bringt 4–5 % mehr Level; von je 2000 Seeds liefern ohne ihn 1698
  (ohne Kernidee) und 1499 (Mischziel), mit höchstens zwei Schritten 1773 und 1578.

**Offen:**
- Eine Ziel-Schwierigkeit im Auftrag (Ticket 20 spricht davon) gibt es noch nicht; der Generator zielt auf den ganzen
  Grad. Für den Austausch in „leicht“ (Ticket 23, zu ersetzende Level mit Schwierigkeit 33–43) liegt rund ein Viertel
  der Level dort.
- „Keine Ziele“ und „zu klein“ sind die häufigsten Gründe ohne Level; sie kosten wenig, weil sie vor der Beurteilung
  fallen.

Weitergegeben als Hinweise in die Tickets 19, 20, 21 und 22.
