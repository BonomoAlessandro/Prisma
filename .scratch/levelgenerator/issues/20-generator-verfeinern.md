# 20: Generator: Verfeinern bis „sehr schwer“

**What to build:** Der Generator verfeinert ein Level Schritt für Schritt, bis es die Ziel-Schwierigkeit des Auftrags
erreicht. So liefert er Level für alle Grade bis „sehr schwer“. Das ersetzt das bisherige Härten.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Effizienz“.

**Blocked by:** 18 (Generator: erster Durchstich)

**Status:** resolved

- [x] Der Generator verfeinert schrittweise bis zur Ziel-Schwierigkeit des Auftrags. In jedem Schritt gelten die
      Ausschlüsse und der Spielwert.
- [x] Reparaturen sind begrenzt, denn laut Messung bringen sie ab der dritten kaum noch etwas.
- [x] Er liefert Level mit Kernidee für „mittel“, „schwer“ und „sehr schwer“.
- [x] Tests wie in Ticket 18 decken alle Grade ab.
- [x] Das Messskript misst die angenommenen Level je CPU-Stunde und Grad und vergleicht mit den Ausgangszahlen des
      heutigen Generators einschliesslich Härten, beide mit der Beurteilung als Abnahme. Bei „schwer“ und „sehr schwer“
      liefert der neue Generator mehr als der heutige. Das Ergebnis steht unter `## Comments`.

## Comments

**Hinweis aus Ticket 02 (Messskript):** Für „härten“ fehlt die Ausgangszahl, denn ein Lauf kostet oft über 10
CPU-Minuten. Sie wird mit eigenem Zeitbudget gemessen, **bevor** Ticket 21 `harden.mjs` entfernt, oder danach in
einem Worktree auf einem Stand vor Ticket 21 (`a52407f` hat `bench.mjs` noch nicht, erst der Commit von Ticket 02).
Etwa mit `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator härten --seeds N
--save datei`. Achtung: `--save` führt nur bei gleichen Seeds und gleichem `--jobs` mit einer
vorhandenen Messung zusammen. Die Ausgangszahlen haben 60 000 Seeds je Profil, das ist für „härten“ zu teuer. Also
entweder eine eigene Datei nehmen oder das Zusammenführen für Gruppen mit eigener Seed-Zahl erweitern.

**Hinweis aus Ticket 04 (Löser schneller):**
- **Härten ist schneller geworden:** Ein Lauf von `climb` mit 300 Schritten (Seed 5, Zielwertung 44–54) brauchte 3,7
  statt 17,0 CPU-s. Die Ausgangszahl für „härten“ hängt also davon ab, ob sie vor oder nach Ticket 04 gemessen wird.
  Für den Vergleich mit dem neuen Generator den Stand nach Ticket 04 nehmen.
- **`makeUnique` sucht im Modus unique.** Eine Suche mit mehreren Lösungen, die erst nach der zweiten über
  `maxSearch` (beim Härten 1,5e6) käme, gilt nicht mehr als „zu gross“; das Level wird repariert. In sechs Proben
  verlief `climb` gleich wie vorher, in Einzelfällen kann ein Lauf aber anders verlaufen.
- **Beim Verfeinern** stellt jeder Schritt die Eindeutigkeit her. Dafür den Modus unique nehmen; seine Knoten und
  Rateschritte gelten bei einer Lösung unverändert für die Beurteilung (siehe Ticket 18).
- **Doppelte Suchen, die in den alten Werkzeugen bleiben** (Ticket 04 hat sie nicht mehr umgebaut; das Verfeinern
  ersetzt das Härten). Der neue Generator sollte sie vermeiden:
  - `harden.mjs`, Zeile 330: `climb` ruft `finish` ohne `sol` auf. Dann wiederholt `metrics` die Suche von `makeUnique`
    aus `evaluate`, bis 1,5e6 Knoten. Abhilfe: Das Ergebnis von `makeUnique` in `evaluate` aufheben und als `sol`
    mitgeben.
  - Die Vollsuchen in `finish` und `metrics` wiederholen in manchen Fällen die Lockvogel-Suche von `generateOne`
    (zusammen knapp 1 % der Knoten), die Lockvogel-Suche in `quality` wiederholt die Vollsuche (1,4 %). Alle drei
    brauchen eigene Rückrufe je Blatt. Besser ist eine Vollsuche, die alle Rückrufe auf einmal bedient.

**Hinweis aus Ticket 18 (Generator):**
- **Grad:** Ein Grad ist eine Vorgabe in `tools/generator/vorgaben.mjs` (Grösse, Arten, Ziele, Klicks, Reparaturen,
  `schritte`); `maengel` prüft, dass sie ihre Untergrenzen erreichen kann. Heute gibt es nur „leicht“.
- **Verfeinern:** `verfeinern.mjs` hat den Schritt „leichter“ (ein drehbares Element ausserhalb der Kernidee fällt
  weg), „schwerer“ fehlt. `mangel` in `index.mjs` liefert die Richtung aus dem Grad der vollen Beurteilung; bei
  Ausschluss, fehlender Kernidee oder zu tiefem Spielwert liefert es keine (dann kein Level). Nach jedem Schritt
  beurteilt der Ablauf neu, zuerst die Vorprüfung, dann voll.
- **Reparaturen:** `vorgaben.reparaturen` (heute 2).
- **Nutzen:** Bei „leicht“ bringt „leichter“ 4–5 % mehr Level. Ein Schritt kostet eine volle Beurteilung; bei grossen
  Leveln ist deren Suche ohne Abschneiden teuer.
- **Ziel-Schwierigkeit:** Im Auftrag fehlt sie noch; der Generator zielt auf den ganzen Grad.
- **Kernidee ab „mittel“:** Heute muss die verlangte Kernidee unter den nötigen sein. Für „dieselbe Haupt-Kernidee
  höchstens zweimal je 10 Level“ könnte der Austausch verlangen, dass sie die Haupt-Kernidee ist.
- **Messung:** `bench.mjs generator --generator neu --accept beurteilung`; `--compare` mit einer Messung des alten
  Generators (Profile, für „härten“ die Gruppe `härten`, beide mit `--accept beurteilung`) vergleicht je Auftrag mit
  demselben Grad über alle Gruppen und in der besten.
- **Zusammenspiel (Review von Ticket 18):** Das Ergänzen setzt drehbare Elemente nur ans offene Ende eines Strahls, auf
  Zellen ohne fremden Strahl; es entstehen unabhängige Stränge. Mit den Regeln ab „mittel“ beurteilt, hätten 57 %
  der leichten Level ohne Kernidee und 53 % der mit Mischziel einen Füllteil (Seeds 101–600). Für „mittel“ und
  schwerer braucht es ein Ergänzen oder einen Schritt „schwerer“, der Stränge verbindet (Kreuzungen, gemeinsame
  Ziele, Kombinatoren); die Vorprüfung findet den Füllteil günstig, es kostet also vor allem Ausbeute.

**Abschluss 17.10.2026.** Gearbeitet im Worktree `.claude/worktrees/agent-a43c1793cac49f90a` auf dem Branch
`ticket/20-generator-verfeinern` (ab `974c4f0`), Commits `f8fd158` (Generator) und `c173f0b` (Deckel 65 %, siehe
unten). Rechner: i7-9750H (12 logische Kerne), Node 22.12.0. Alle Läufe über `leise.sh`, nacheinander: Generator und
Messskript mit `LEISE_CPU=50`, Tests mit 20 %.

**Entwurf** (`tools/generator/`, README „Generator“):
- **Vorgaben** für „mittel“, „schwer“ und „sehr schwer“ in `vorgaben.mjs`, nach den Leveln im Spiel: drehbare
  Elemente 5–8 / 7–11 / 9–14 (im Spiel 5–8 / 7–12 / 9–14, Median 7 / 9 / 11; im Review berichtigt), Quellen 2–3 /
  2–4 / 2–4, Ziele 2–5 / 3–5 / 3–5, mehr Prismen in den schweren, Klicks 4 / 5 / 6, Schritte 4 / 6 / 8. `maengel`
  nimmt alle an.
- **Schritt „schwerer“** in `verfeinern.mjs`: ein drehbares Element mehr, möglichst eines, das Stränge verbindet.
  - Kreuzen sich zwei Strahlen, die beide offen oder auf einem Ziel ausserhalb der Kernidee enden, kommt es auf die
    Kreuzung (`kreuzungszellen` in `schritte.mjs`). Hinter der Kreuzung steht kein Element, also verliert keines sein
    Licht, höchstens ein Ziel, das an die neuen Enden wandert.
  - Sonst öffnet er ein Ziel ausserhalb der Kernidee und ergänzt an dessen Strahlende, notfalls mit einer neuen
    Quelle.
  - Danach Ziele setzen und festigen. Misslingt ein Versuch (der Bau ist danach gleich gross oder nicht fest), geht
    es vom selben Stand aus neu, höchstens 8-mal. Das kostet keine Beurteilung.
  - An der Obergrenze tauscht er nur, und nur zum Verbinden: Zuerst fällt ein drehbares Element weg.
- **Füllteil und Zerfall** aus der Vorprüfung führen zum Schritt „schwerer“ (`mangel` in `index.mjs`). Er öffnet
  dann gezielt das Ziel des Füllteils bzw. die Ziele der abgetrennten Gruppen und verbindet dort (Hinweis aus dem
  Review von Ticket 18). Zu tiefer Grad führt zu „schwerer“, zu hoher zu „leichter“. Nach jedem Schritt beurteilt
  der Ablauf neu, zuerst die Vorprüfung, dann voll: Ausschlüsse und Spielwert gelten in jedem Schritt.
- **Ergänzen ab „mittel“** (`vorgaben.verbinden` = 0,7): So viele der drehbaren Elemente kommen auf eine Kreuzung
  offener Strahlenden, wo es eine gibt. Ein Bau unter der Untergrenze wächst mit „schwerer“ (`vorgaben.wachsen`, 4 /
  8 / 10-mal, ohne Beurteilung), statt als zu klein verworfen zu werden.
- **Ziel-Schwierigkeit:** Der Auftrag nimmt wahlweise `schwierigkeit: [von, bis]` innerhalb des Grads an. Darunter
  folgt „schwerer“, darüber „leichter“; ein Bereich ausserhalb des Grads wirft. Ohne Angabe gilt wie bisher der
  ganze Grad. Im Test liefert „leicht“ mit 33–43 (die zu ersetzenden Level in Ticket 23) 26 von 30 Seeds.
- **„leicht“ bleibt bitgleich:** Ohne `verbinden` und `wachsen` zieht der Zufall nichts zusätzlich, und Füllteil
  und Zerfall gelten dort nicht. Verglichen mit dem Stand `974c4f0` sind 2000 von 2000 Aufträgen gleich (Seeds
  1–1000, ohne Kernidee und mit Mischziel). In der Messung liefern dieselben 2000 Seeds wie in Ticket 18 1773 und
  1578 Level.
- **Doppelte Suchen:** Der Generator macht weiter keine Suche ohne Abschneiden; nur die der Beurteilung läuft.
  Jeder Versuch von „schwerer“ macht eine Suche im Modus unique (im Festigen), und nur, weil sich der Bau geändert
  hat. Die doppelten Suchen von `harden.mjs` bleiben, wie sie sind; das Härten entfällt mit Ticket 21.

**Reparaturen begrenzt:** Es bleibt bei höchstens 2 je Festigen, für alle Grade. Gemessen mit 1, 2, 3 und 4
Reparaturen:

| Reparaturen | 1 | 2 | 3 | 4 |
|---|---:|---:|---:|---:|
| `mittel-mischziel`, Seeds 1–300 | 168 | 168 | 168 | 168 |
| `schwer-mischziel`, Seeds 1–200 | 67 | 68 | 68 | 67 |
| `schwer`, Seeds 1–150 | 35 | 36 | 37 | 38 |
| CPU-s `mittel-mischziel` | 3,9 | 3,2 | 3,2 | 3,6 |
| CPU-s `schwer-mischziel` | 25,0 | 23,3 | 22,6 | 23,9 |
| CPU-s `schwer` | 26,0 | 33,3 | 33,8 | 34,0 |

(CPU-s nach dem Review nachgetragen, aus derselben Messung: ein Prozess, `LEISE_CPU=50`, je Lauf einmal gemessen, darum
etwa ±15 % unsicher.) Ab der dritten bringt jede höchstens ein Level auf 150 Seeds. Je CPU-Stunde liegen alle vier
Varianten innerhalb der Streuung; bei `schwer` ist 1 Reparatur sogar am günstigsten (4 843 gegen 3 896 Level je
CPU-Stunde mit 2). Es bleibt bei 2 wie in „leicht“ (Ticket 18), weil mehr nichts bringt und weniger die Messzahlen
änderte, ohne sicher zu helfen. `maxSuche` ist ab „schwer“ 2e5 statt 6e5 bzw. 8e5:
Bei gleich vielen Leveln brauchte „schwer“ ohne Kernidee 21,6 statt 38,4 CPU-s (100 Seeds) und „sehr schwer“ 82,6
statt 130,3.

**Messung** (17.10.2026, i7-9750H, Node 22.12.0, `LEISE_CPU=50`, alle drei mit `--jobs 4`, in derselben Sitzung
nacheinander; Abnahme `beurteilung`):
- neu: alle 8 Aufträge, Seeds 1–2000 je Auftrag, 20:10–20:35;
- alt: die 26 Profile, Seeds 1–60 000 je Profil wie die Ausgangszahlen, 20:38–20:52;
- „härten“: Seeds 1–160, eigene Datei, 20:52–22:25.

Ausgangszahlen von Ticket 02 und 18 kommen vom i7-12800H und gelten hier nicht. Gemessen ist darum hier neu. Alle
drei Messungen haben 4 Prozesse; mit 7 Prozessen (mit 65 % auf diesem Rechner) ist nichts davon gemessen. Gemischt ist
nur mit gleichem `--jobs`, denn die CPU-Zeit je Seed hängt laut Ticket 02 von der Zahl der Prozesse ab (mit 10 statt
4 Prozessen 1,5- bis 2,3-mal so viel).

| Level je CPU-Stunde | neu | heute, bestes Profil | heute, „härten“ | heute, Profile und „härten“ zusammen | neu / bestes heute |
|---|---:|---:|---:|---:|---:|
| leicht | 925 043 | 665 885 (1-farbe) | 0 | 3 239 | × 1,39 |
| leicht, Mischziel nötig | 962 847 | 5 671 (2-bunt) | 0 | 21 | × 170 |
| mittel | 14 216 | 3 533 (2-prisma) | 0 | 26 | × 4,0 |
| mittel, Mischziel nötig | 178 414 | 2 769 (2-prisma) | 0 | 16 | × 64 |
| **schwer** | **1 353** | 173 (4-bunt, 4 Level) | 6,3 (35 Level) | 7,6 | × 7,8 |
| schwer, Mischziel nötig | 6 815 | 130 (4-bunt, 3 Level) | 2,9 | 3,5 | × 52 |
| **sehr schwer** | **160** | 0 | 3,4 (19 Level) | 3,0 | × 47 |
| sehr schwer, Mischziel nötig | 379 | 0 | 2,7 | 2,4 | × 140 |

- **Ziel erreicht:** Bei „schwer“ und „sehr schwer“ liefert der neue Generator mehr als der heutige: ×7,8 gegen
  das beste Profil (4-bunt, nur 4 Level in 83 CPU-s, also unsicher), ×215 gegen „härten“ und ×178 gegen alles
  zusammen. Bei „sehr schwer“ liefert nur „härten“ überhaupt Level: ×47, mit Mischziel ×140.
- „neu“ meint die Gruppe des Auftrags, etwa `schwer` für „schwer“ ohne verlangte Kernidee bzw. `schwer-mischziel` für
  die Zeile „Mischziel nötig“. Der alte Generator zählt alle angenommenen Level des Grads, mit Kernidee nur die, in
  denen sie nötig ist (`--compare` über den Generatorwechsel).

Neu je Auftrag:

| Auftrag | angenommen von 2000 | CPU-s | ms je Seed | Schwierigkeit Q1 / Median / Q3 |
|---|---:|---:|---:|---|
| leicht | 1 773 | 6,9 | 3,5 | 23,5 / 28,9 / 34,6 |
| leicht-mischziel | 1 578 | 5,9 | 3,0 | 28,6 / 31,7 / 36,0 |
| mittel | 201 | 50,9 | 25 | 48,6 / 52,4 / 55,7 |
| mittel-mischziel | 1 125 | 22,7 | 11 | 45,2 / 48,1 / 51,0 |
| schwer | 352 | 936,7 | 468 | 63,3 / 68,6 / 75,2 |
| schwer-mischziel | 693 | 366,1 | 183 | 61,6 / 64,9 / 70,0 |
| sehr schwer | 117 | 2 631,0 | 1 316 | 89,1 / 91,5 / 94,3 |
| sehr schwer-mischziel | 139 | 1 318,9 | 660 | 88,2 / 90,0 / 93,1 |

- **Alt:** 2 683 CPU-s für 1,56 Mio. Seeds, angenommen leicht 20 488, mittel 167, schwer 13, sehr schwer 0.
  Je Profil liefern nur 4-prisma (2), 4-misch (1), 4-bunt (4) und 5-misch (2) schwere Level, die Stufe 5 sonst
  keines.
- **„härten“:** 54 von 160 Seeds angenommen, in 20 091 CPU-s (126 CPU-s je Seed): schwer 35, sehr schwer 19,
  Schwierigkeit 78,9 / 83,9 / 89,7. Verworfen vor allem wegen Scheinmischung (36, dazu 12 mit Zerfall oder Knäuel),
  Knäuel 15, zu leicht 12 und ohne nötige Kernidee 9.
- **Gründe ohne Level, neu:**
  - `mittel`: ohne nötige Kernidee 497 (ohne Baustein gibt es eine Kernidee nur nebenbei), keine Ziele 230, Zerfall
    oder Füllteil, auch nach „schwerer“, rund 740.
  - `schwer-mischziel`: Zerfall und „schwerer“ ohne Zuwachs 297, zu klein und „schwerer“ ohne Zuwachs 167, Kernidee
    wirkungslos 133.
  - `sehr schwer-mischziel`: zu klein und „schwerer“ ohne Zuwachs 387, Zerfall und „schwerer“ ohne Zuwachs 387, Grad
    schwer und „schwerer“ ohne Zuwachs 291.
  - Das Feld 7 × 7 mit den reservierten Wegen der Kernidee lässt oft keinen Platz mehr, das ist die Grenze der
    Ausbeute.
- **Wahl der Seeds:**
  - Neu 2000 je Auftrag, damit auch „sehr schwer“ über 100 Level hat (Fehler etwa ±10 %); die Messung kostet 5 339
    CPU-s, 25 min Wanduhr.
  - Alt 60 000 je Profil wie die Ausgangszahlen. Seit Ticket 04 verwirft er schnell: 2 683 CPU-s, 14 min. Ein erster
    Lauf mit 10 000 Seeds (2,5 min) gab je Profil höchstens ein bis zwei schwere Level.
  - „härten“: Ein Vorlauf mit 8 Seeds brauchte 43 CPU-s je Seed. 160 Seeds hätten so gut eine Stunde gedauert,
    tatsächlich waren es 126 CPU-s je Seed und 93 min.
- Die Dateien der Messung liegen nicht im Repo (wie in Ticket 18); `tools/bench-baseline.json` bleibt unverändert.
- Aufrufe:
  - `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator --generator neu --accept beurteilung --seeds 2000
    --jobs 4 --save neu.json`
  - `… generator --generator alt --accept beurteilung --seeds 60000 --jobs 4 --save alt.json --compare neu.json`
  - `… generator härten --generator alt --accept beurteilung --seeds 160 --jobs 4 --save haerten.json --compare
    neu.json`
  - Auf diesem Rechner künftig mit `LEISE_MAX_CPU=65 LEISE_CPU=65` und `--jobs 7`.

**Wo die Zeit hingeht** (CPU-Profil, „sehr schwer“ ohne Kernidee, 40 Seeds): 93 % im Löser, davon 76 % in der Suche im
Modus unique beim Festigen, fast alles innerhalb von „schwerer“; die Beurteilung nur 7 %. Grosse Bauten wachsen Element
um Element, und jeder Versuch prüft die Eindeutigkeit. Hier liesse sich weiter sparen, etwa mit grösseren Schritten
oder einer Vorprüfung vor der Suche.

**Beispiele** (`LEISE_MAX_CPU=65 LEISE_CPU=65 sh tools/leise.sh node tools/generiere.mjs <auftrag> --anzahl 1 | node
tools/show.mjs`, Start und Lösung):

```
sehr schwer-mischziel, Seed 2: Schwierigkeit 88,0, Spielwert 90,7; nötig Mischziel aus zwei Quellen und Sammelstelle
(Haupt-Kernidee); 11 drehbar, 3 Ziele, 17 Klicks
   Q1  . Q3  .  . Q2  .     Q1  . Q3  .  . Q2  .
    .  r M0  .  .  w M3      .  w M3  y  y  y M1
   M1  .  w  .  .  w  .     M2  .  y  .  .  w  y
   TY  b  b P3  b P3 K1     TY  r  y P1  r P1 K6
    .  .  g  r  g  r  r      y  .  y  b  g  b  g
   M2  g M2 TW  . P0  .     M1  y M3 TW  . P2  g
    g  . Q7  . TB M0 M2      .  . Q7  . TB M1 M3
```

Weitere: `mittel-mischziel` Seed 5 (Schwierigkeit 53,6, Spielwert 77,6, 8 drehbar), `schwer-mischziel` Seed 10
(58,8 und 84,0, 8 drehbar, 5 Ziele).

**Tests** (nacheinander über `leise.sh` mit 20 %, 22:27–22:37), alle grün:

| Lauf | Dauer |
|---|---:|
| `node tests/golden.mjs` | 6,5 s |
| `node tests/logic.test.mjs` (553 Tests) | 34,3 s |
| `node tests/levelliste.test.mjs` (28 Tests) | 54,3 s |
| `node tests/beurteilung.test.mjs` (177 Tests) | 85,1 s |
| `node tests/ki-tester.test.mjs` (62 Tests) | 1,2 s |
| `node tests/generator.test.mjs` (18 Tests) | 98,6 s |

- `tests/generator.test.mjs` prüft jetzt neun Aufträge mit festen Seeds: „leicht“ wie bisher (je 50), „leicht“ mit
  der Ziel-Schwierigkeit 33–43 (30) und je ohne Kernidee und mit Mischziel „mittel“ (30), „schwer“ (30) und „sehr
  schwer“ (20 bzw. 12).
- Alle Prüfungen aus Ticket 18 gelten für alle Grade: Determinismus, genau eine Lösung, Beurteilung neu beurteilt
  und gleich der mitgegebenen, Grad, Kernidee, Leveldaten, Startstellung, keine wirkungslosen Elemente.
- Neu sind drei Prüfungen:
  - je Auftrag eine Mindestzahl an Leveln;
  - ab „mittel“ hat jedes Level eine nötige Kernidee, auch ohne verlangte;
  - mit Ziel-Schwierigkeit liegt jedes Level darin, und ein Ziel ausserhalb des Grads weist er ab.
- Die Dauer stieg von 1 s auf gut 1,5 min, weil die grossen Level teuer sind.

**Abweichungen und Entscheide:**
- **Ziel-Schwierigkeit** als wahlweises Feld des Auftrags. Ticket 18 nannte sie als fehlend. Ohne Angabe zielt der
  Generator weiter auf den ganzen Grad.
- **„Ohne Kernidee“ ab „mittel“** liefert wenig (10 %, 18 %, 6 % der Seeds), denn ohne Baustein entsteht eine nötige
  Kernidee nur nebenbei (meist Abschalten oder Mischziel). Mit Mischziel sind es 56 %, 35 % und 7 %. Weitere
  Bausteine bringt Ticket 19.
- **Haupt-Kernidee:** Mit verlangtem Mischziel ist sie fast immer das Mischziel. Für „dieselbe Haupt-Kernidee
  höchstens zweimal je 10 Level“ braucht der Austausch die Bausteine aus Ticket 19. Er könnte verlangen, dass die
  verlangte Kernidee die Haupt-Kernidee ist (Hinweis aus Ticket 18, hier nicht eingebaut).
- **`schritte.mjs` und `index.mjs`** sind nur wenig geändert: `kreuzungszellen` dazu, ein Zweig in `ergaenze`; in
  `index.mjs` `mangel` (Füllteil, Zerfall, Ziel-Schwierigkeit), das Wachsen und die Ziel-Schwierigkeit im Auftrag.
  `bausteine/` ist unberührt.
- **Deckel** (Commit `c173f0b`, nach dem Review ersetzt): Auf diesem Rechner erlaubt der Nutzer 65 %. `c173f0b`
  schrieb das fest in den Code. Nach dem Review (Fund 1, Präzisierung des Nutzers: nur dieser Rechner) bleibt die
  Obergrenze im Repo und in der Spec 50 %. Ein Rechner hebt sie lokal mit `LEISE_MAX_CPU` an (nicht versioniert),
  siehe „Review“ unten. Die Messungen oben liefen mit 50 %.

**Offen:**
- Ausbeute und Kosten ab „schwer“: „schwerer“ ohne Zuwachs ist der häufigste Grund ohne Level, und die
  Eindeutigkeitssuche beim Wachsen kostet die meiste Zeit (siehe oben).
- Ohne Kernidee ab „mittel“ fallen viele Seeds erst nach der vollen Beurteilung („ohne nötige Kernidee“); mit den
  Bausteinen aus Ticket 19 wird das seltener.

Weitergegeben als Hinweise in die Tickets 21 und 23–26.

**Review 17.10.2026** (Reviewer-Agent, im selben Worktree, Stand `6b7e49d`; Skripte nur im Scratchpad):
- **Geprüft:** `git diff 974c4f0 HEAD`, also „schwerer“, `kreuzungszellen` und der neue Zweig in `ergaenze`, `mangel`
  mit `VERBINDEN`, das Wachsen, `bereichVon`, `rezept`, die Ziel-Schwierigkeit und die Vorgaben, dazu der
  Deckel-Commit.
  - Keine Endlosschleife: Wachsen höchstens `wachsen`-mal, Verfeinern `schritte`-mal, „schwerer“ je Aufruf 8 Versuche,
    Festigen 12 Runden, Aufräumen 20, Reparaturen 2, Ergänzen 4 · `plan.drehbar` Versuche.
  - Ausschlüsse und Spielwert: Nach jedem Schritt des Verfeinerns laufen Vorprüfung und volle Beurteilung. Das Wachsen
    läuft ohne Beurteilung, aber vor der ersten, solange der Bau unter der Untergrenze ist (wie das Nachlegen).
  - Kernidee: `kreuzungszellen` zählt ihre Ziele nicht als offen (ein Treffer ist kein Schlucken), ihre Wege sind
    reserviert. `VERBINDEN` passt zu den Funden: Füllteil mit `strang.ziel`, Zerfall mit den Gruppen nach Zahl der
    drehbaren Elemente, beides als Zellen und erst ab „mittel“, in „leicht“ also nie.
- **Bitgleich:** eigener Vergleich mit einer Kopie von `974c4f0`, Seeds 1–3000 ohne Kernidee und mit Mischziel: 6000
  von 6000 Ergebnissen gleich (5010 Level).
- **Nachgezählt** auf HEAD: `mittel-mischziel` 168 von 300 und 1125 von 2000, `mittel` 201 von 2000,
  `schwer-mischziel` 68 von 200, `schwer` 36 von 150. Das sind die Zahlen oben, gemessen ist also dieser Code.
- **Messung:** gleiche `--jobs` (4), gleiche Abnahme, gleicher Rechner, eine Sitzung; methodisch sauber.
  - Das Ergebnis trägt trotz kleiner Zahlen. Mit der oberen 95-%-Grenze nach Poisson liefert das beste Profil bei
    „schwer“ (4 Level) höchstens 444 Level je CPU-Stunde, neu (352 Level) mindestens 1215, also mindestens × 2,7.
    Bei „sehr schwer“ liefert „härten“ (19 Level) höchstens 5,3, neu (117) mindestens 132, also mindestens × 25.
    Auch eine um ein Mehrfaches falsche CPU-Zeit je Seed von „härten“ (Vorlauf 43, Messung 126 CPU-s) ändert das nicht.
  - Die genauen Faktoren sind unsicher: × 7,8 heisst etwa × 3 bis × 30.
  - Im Einzelprozess kostete ein Seed 1,3- bis 2,5-mal weniger CPU-Zeit als in der Messung (`schwer`, Seeds 1–150: 187
    statt 468 ms). Die absoluten Zahlen gelten also nur für `--jobs 4` auf diesem Rechner.
- **Tests:** Alle Prüfungen aus Ticket 18 laufen über die Level aller Aufträge, und jeder liefert welche (ab „mittel“ 2
  bis 11, zusammen 26). Bei „sehr schwer“ sind es nur 2 + 2 Level, also eine dünne, aber feste Probe.
- **Deckel:** Alle Stellen nennen 65, keine 50 ist übrig. „20 bis 50 %“ in `bench.mjs` und README meint die Last. Die
  Spec nennt weiter 50 %, siehe Fund 1.

**Im Review behoben** (dieser Commit):
- `verfeinern.mjs`: Der Kopf nennt die Signatur `(bau, plan, vorgaben, mangel)`. Die Doku von „schwerer“ sagt jetzt,
  was der Code tut: Er zielt auf zwei Elemente mehr, füllt Quellen, Filter und feste Spiegel auf, tauscht an der
  Obergrenze, und „zu klein“ heisst gewachsen, aber noch zu klein.
- `kreuzungszellen`: Auch ein Element, das den Strahl schluckt, kann sein Licht verlieren (das Aufräumen nimmt es weg).
- Vorgabe „schwer“: Sie hat 7–11 drehbare Elemente. Hier stand 7–12, das ist der Bereich im Spiel; `vorgaben.mjs` und
  der Entwurf oben sind berichtigt.
- Ziel-Schwierigkeit: Der Code nimmt jeden Bereich an, der den Grad überschneidet (etwa [42, 50] bei „leicht“,
  wirksam 42 bis unter 43). JSDoc, Fehlermeldung und README sagten „innerhalb“ und sind angeglichen.
- Tests:
  - Randfälle der Ziel-Schwierigkeit: [43, 50] bei „leicht“ und [60, 86,9] bei „sehr schwer“ abgewiesen, [42, 50]
    angenommen.
  - Neu der Auftrag „leicht“ mit 20–30 (23 von 30 Seeds, 0,5 CPU-s): Bei 33–43 fiel die Obergrenze auf die Gradgrenze,
    der Zweig „über dem Ziel → leichter“ lief nie. Mit 20–30 liefern ihn 4 Seeds, „schwerer“ innerhalb von „leicht“ 3.

**Offen:**
1. **Deckel 65 % fest im Code** (mittel, Vorgabe des Nutzers): Die 65 % gelten nur für diesen Rechner, nach dem Merge
   gälten sie überall. Im Repo bleibt 50; ein Rechner hebt die Grenze lokal mit `LEISE_MAX_CPU` an (nicht
   versioniert, etwa `.claude/settings.local.json` unter `env`). Ausführlich im Bericht an den Entwickler; der
   Test prüft ohne Variable 50, mit `LEISE_MAX_CPU=65` bis 65.
2. **Aussichtslose Versuche von „schwerer“** (niedrig): Ist vor dem Festigen kein drehbares Element dazugekommen, kann
   der Versuch nicht gelingen (Festigen nimmt nur weg), und doch läuft die Eindeutigkeitssuche. Gemessen: 4 % / 23 % /
   3 % der Versuche bei `sehr schwer` / `schwer-mischziel` / `mittel`, 3 % / 10 % / 1 % der ganzen Zeit. Abkürzen
   ändert den Zufall ab „mittel“, also die Level.
3. **Laufzeit des Generator-Tests** (niedrig): 92 s, davon 44 s für das Erzeugen und etwa ebenso viel für die
   Wiederholung im Test „Derselbe Auftrag …“. Halbieren liesse sie sich, wenn die Wiederholung ab „mittel“ nur einen
   Teil der Seeds nimmt (Frage an den Nutzer).
4. **Reparaturen** (niedrig): Die Tabelle belegt die Grenze nur mit der Zahl der Level, nicht mit der CPU-Zeit. Bei
   `schwer` bringt jede weitere Reparatur noch 1 Level auf 150 Seeds (+3 %); ob das „kaum noch etwas“ ist, hängt
   davon ab, was sie kostet.
5. **Vorgabe „schwer“ bis 11** (niedrig): Im Spiel reicht „schwer“ bis 12. Gewollt? Der Entwickler bestätigt oder
   ändert es mit neuer Messung.

**Nach dem Review umgesetzt** (Entwickler, Commit „fix(werkzeuge): Deckel über LEISE_MAX_CPU …“):
1. **Deckel:** Erledigt.
   - Im Repo gilt wieder 50.
   - Neu ist `tools/deckel.mjs` mit `maxCpu()` (liest `LEISE_MAX_CPU`, Standard 50) und `gedeckelt(grenze)`, geprüft
     als `!(cpu <= grenze)`, also bricht auch ein NaN ab. Generator, `bench.mjs` (`limit = generator ? maxCpu() : 20`)
     und `shots.mjs` nutzen die Hilfe. `leise.sh` prüft mit `MAX=${LEISE_MAX_CPU:-50}`.
   - Aufrufbeispiele, README und die Tickets 20, 21 und 26 sind nachgeführt.
   - Der Test prüft drei Fälle: ohne Variable mit 55 Abbruch, mit 65/65 Status 0, mit 65/70 Abbruch.
   - `LEISE_CPU=65 sh tools/leise.sh node tools/generiere.mjs leicht --anzahl 1` bricht ohne `LEISE_MAX_CPU` ab und
     läuft mit `LEISE_MAX_CPU=65`.
2. **Aussichtslose Versuche:** Nicht eingebaut, weil es ab „mittel“ den Zufall und alle Messzahlen ändert. Als
   Hinweis in Ticket 21 eingetragen.
3. **Testdauer:** Der Test „Derselbe Auftrag …“ wiederholt ab „mittel“ nur noch die ersten 5 Seeds je Auftrag. Der
   Generator-Test dauert damit 58 s statt 92 s (Erzeugen 41 s).
4. **Reparaturen:** Die CPU-s aus derselben Messung sind oben nachgetragen. Je CPU-Stunde unterscheiden sich 1–4
   Reparaturen nur innerhalb der Streuung; es bleibt bei 2.
5. **„schwer“ bis 11:** Gewollt, bestätigt mit einer neuen Messung (Seeds 1–300, ein Prozess):
   - mit 7–12 liefert `schwer` 48 statt 67 Level (2 570 statt 4 112 je CPU-Stunde) und `schwer-mischziel` 101 statt
     105 (9 815 statt 12 515);
   - grössere Bauten finden im Feld 7 × 7 seltener Platz und kosten mehr Eindeutigkeitssuche;
   - Schwere Level mit 12 drehbaren Elementen liefert der Generator damit nicht. Für den Austausch fehlt dadurch
     nichts: Er sucht Level nach Schwierigkeit, nicht nach Grösse. Bauten mit 12 Elementen deckt die Vorgabe „sehr
     schwer“ (9–14) ab.

**Nachprüfung** (Reviewer, Stand `64bd63d`):
- **Fund 1 behoben.** Alle Stellen lesen `LEISE_MAX_CPU` mit Standard 50, über `tools/deckel.mjs` bzw. `leise.sh`.
  `git grep` findet keine fest verdrahtete 65 mehr; 65 steht nur noch als Beispiel im README und als Wert im Test.
  - `leise.sh` bricht ab ohne Variable mit 55, mit `abc`, mit 65/70 und mit 65/65,5; mit 65/65 läuft es.
  - Generator, Screenshots (`requireQuiet`) und `bench.mjs` (generator bis zur Grenze, trace bis 20) verhalten sich
    gleich, auch mit `abc` und mit leerer Variable (dann gilt 50).
- **Fund 2:** Als Hinweis in Ticket 21, einverstanden.
- **Fund 3:** Der Test dauert 57 s. Eine Lücke blieb: Bei `schwer-mischziel` liefert keiner der Seeds 1–5 ein Level
  (das erste kommt mit Seed 10), dort verglich der Test nur Gründe. Behoben: Ab „mittel“ wiederholt er auch den
  ersten Seed mit Level, so ist in jedem Auftrag eines dabei (0,03 CPU-s mehr).
- **Fund 4:** Nachvollziehbar, es bleibt bei 2. Bei `schwer` ist 1 Reparatur je CPU-Stunde 24 % günstiger, knapp
  mehr als die genannte Streuung; das lohnt erst eine Wiederholung, wenn Ticket 21 ohnehin neu misst.
- **Fund 5:** Bestätigt mit Messung.
- **Weiter bitgleich:** Seeds 1–1500 ohne Kernidee und mit Mischziel, 3000 von 3000 Ergebnissen gleich mit `974c4f0`.
- **Klein behoben** (dieser Commit):
  - README: „mehr nimmt `leise.sh` nicht an“ gilt nur ohne `LEISE_MAX_CPU`.
  - `leise.sh`: Die Meldung sagte bei `LEISE_MAX_CPU=abc` „20 ist über abc“; jetzt „muss eine ganze Zahl bis … sein“.
  - Wortlaut oben: „nach dem Review nachgetragen“.
- **Tests** über `leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65`, alle grün: golden, logic (553), generator (18,
  57 s), ki-tester (62).
- **Urteil:** bereit zum Mergen.
