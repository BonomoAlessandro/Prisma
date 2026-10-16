# 11: Kernideen II: Sammelstelle, Falle, Lockvogel

**What to build:** Die Beurteilung erkennt die übrigen drei Kernideen und bestimmt für jedes Level die Haupt-Kernidee.
Die Prüfung „nötig“ kommt aus Ticket 10.

**Spec:** ../spec.md, Abschnitt „Beurteilung“ (Kernideen); Glossar, Abschnitt „Kernideen“.

**Blocked by:** 09 (Spielermodell und Probieren), 10 (Kernideen I)

**Status:** resolved

- [x] Erkannt werden diese Kernideen:
      - **Sammelstelle:** ein Prisma, das Licht aus mehreren Richtungen sammelt und neu verteilt.
      - **Falle:** eine naheliegende Stellung eines Prismas oder Spiegels, die in die Irre führt. Die Erkennung stützt
        sich auf die Fast-Lösungen und das Spielermodell.
      - **Lockvogel:** ein festes Teil abseits der Lösung, das beim Probieren Licht bekommt. Eine vorhandene Erkennung
        in den Werkzeugen wird übernommen oder ersetzt.
- [x] Jede dieser Kernideen zählt nur, wenn sie nötig ist.
- [x] Jedes Level bekommt eine Haupt-Kernidee. Die Regel dafür ist begründet, zum Beispiel die Kernidee mit dem
      grössten Beitrag zum Schliessen.
- [x] Mini-Level gibt es je Kernidee, einmal nötig und einmal dekorativ.
- [x] Die Zahlen je Kernidee, die Verteilung der Haupt-Kernideen und die Grade auf den 150 stehen unter `## Comments`.

## Comments

**Hinweis aus Ticket 04 (Löser schneller):** `solve` übergibt `onLeaf` nur noch `(r, board)`; das dritte Argument
`value` (Map Element-Id → Stellung) ist weggefallen.
- Die unversionierten Skripte zu den Fallen in den Review-Ordnern der Pools benutzen es und brechen jetzt ab:
  `tools/pools/review4/traps.mjs`, `review4/trapshow.mjs`, `review6/traps.mjs` und `review6/trapshow.mjs`. Dazu
  kommen `review5/screen.mjs` und `review6/features.mjs` (Ticket 09).
- Beim Übernehmen der Holzwege anpassen: Entschieden ist ein Element, wenn `getRot(el) !== L.OPEN`, und seine
  Stellung ist `getRot(el)`. Beides kommt aus `tools/solver.mjs`.

**Abschluss 16.10.2026.**

**Aufbau** (`tools/beurteilung/`, README unter „Beurteilung“):
- `kernideen/sammelstelle.mjs`, `kernideen/falle.mjs`, `kernideen/lockvogel.mjs` und `haupt-kernidee.mjs`, je eine Zeile
  in `regeln.mjs` unter der Kommentarzeile von Ticket 11.
- Erweitert, rückwärtsverträglich:
  - `noetig.mjs`: `zulauf` (Licht, das in einer Zelle ankommt, je Richtung) und die Wegnahme `ohneZulauf`;
  - `spielermodell.mjs`: `aufDenErstenBlick(ctx, stellung)`; das Modell entsteht jetzt einmal je Beurteilung;
  - `suche.mjs`: `licht` (Strahlbilder mit Licht je festem Teil abseits der Lösung), je Fast-Lösung `feste` (die festen
    Teile mit Licht darin) und `beleuchtet`.
- `index.mjs`: der Teil `hauptKernidee` in `TEILE`. Er trägt den Glossarbegriff „Kernidee“, weil „Haupt-Kernidee“ nicht
  im Glossar steht. Eine Änderung des Glossars hätte den Fingerabdruck der KI-Tester geändert.

**Erkennung je Kernidee** (gemessen in der Lösungsstellung):
- **Sammelstelle:**
  - Muster: Aus mindestens zwei Richtungen fällt Licht in ein Prisma, das es bricht. Licht an der Rückseite zählt nicht.
  - Nötig: Ohne den Zulauf aus einer Richtung verliert ein Ziel seine Farbe, und das für mindestens zwei Richtungen.
  - Die Wegnahme `ohneZulauf` setzt einen Blocker an die Stelle des Prismas. Was aus den übrigen Richtungen ankommt,
    bricht sie mit `refractInPrism` und schickt es als Startstrahlen weiter, bis sich nichts mehr ändert.
  - Wächter (aus dem Review, ADR 0003): Ohne Wegnahme muss `ohneZulauf` die Lösung wiedergeben; `sammelstellen` prüft
    das an jedem Prisma mit Zulauf aus mindestens zwei Richtungen und bricht sonst mit einem Fehler ab. So kann der
    nachgebildete Schritt des Prismas nicht unbemerkt von der Strahlregel abweichen.
  - Ein Blocker vor dem Prisma, wie in Ticket 10 vorgeschlagen, ging meist nicht. Auf den 150 gibt es 33 Zuläufe in
    Prismen mit Licht aus mindestens zwei Richtungen:
    - 25 kommen direkt aus der Nachbarzelle;
    - bei 3 kreuzt ein fremder Strahl die einzige freie Zelle;
    - nur bei 5 wäre Platz.
  - Fund `{ element, zulauf: [{ von, farbe, ziele }] }`; nur die nötigen Zuläufe, in der Reihenfolge der Zellen.
  - Review 6 zu 148 Sternenstaub („sammelt R, G und B aus drei Richtungen“): Nötig sind Blau und Rot. Das Grün bekäme
    sein Ziel auch so.
- **Lockvogel:**
  - Muster aus `quality.mjs` (`decoysRead`) übernommen: ein festes Teil abseits der Lösung, das in mindestens 10 % der
    Strahlbilder der Suche ohne Abschneiden Licht bekommt. Feste Teile sind Blocker, Filter, feste Spiegel, feste
    Prismen und feste Kombinatoren. Neu sind die Filter: `quality.mjs` zählte nur Blocker und Elemente mit `fixed`, und
    kein heutiger Filter trägt `fixed`.
  - Nötig, wenn beides gilt (Entscheid des Nutzers, siehe unten):
    - Es führt beim Probieren in die Irre: Licht in mindestens 10 % der Holzwege, mindestens in einem.
    - Ohne das Teil (ein weisser Filter an seiner Stelle) hätte das Level eine zweite Lösung (`solve` mit `unique`).
      Die Lösung bleibt dabei gültig, denn das Teil bekommt in ihr kein Licht.
  - Fund `{ element, strahlbilder: { licht, alle }, holzwege: { licht, alle }, zweiteLoesung }`.
  - Die alte Löser-Schnittstelle (`value`) brauchte nur die Holzwege in `traps.mjs`. Diese stecken jetzt in den
    Fast-Lösungen von `suche.mjs`.
  - Review 4 zu 125 Halo („2 Lockvögel wirken“): Beide locken, nötig ist nur der Blocker (1,2). Die festen Spiegel, die
    Review 4 „Deko“ nennt, sind nicht nötig: 124 (0,6) und 131 (2,4). Die Spiegel in 133 (6,1) und 139 (2,6) locken
    nicht einmal, sie bekommen in weniger als 10 % der Strahlbilder Licht.
- **Falle:**
  - Naheliegend ist ein Zwischenstand wie beim Abschalten (`zwischenstaende`): Eine Quelle erfüllt ein Ziel allein über
    höchstens drei drehbare Elemente, über weniger als in der Lösung, ohne falsches Licht.
  - Ein Spiegel oder Prisma darin steht in der Lösung anders (`falsch`).
  - Nötig, also „in die Irre“:
    - Eine weite Fast-Lösung enthält ihn (Holzweg: alle Ziele bis auf eines, mindestens 3 Elemente anders);
    - das Spielermodell mit Horizont 2 widerlegt ihn nicht auf den ersten Blick, also ohne zu folgern.
  - Fund `{ ziel, farbe, quelle, stellung, falsch, holzweg: { ziel, abstand } }`, je Ziel der kürzeste Zwischenstand.
  - Was die Prüfung mit dem Spielermodell ausmacht: Es wirft 68 Blaue Stunde und 135 Pulsar hinaus. In 135 steckt der
    Zwischenstand für (1,3) in 192 weiten Fast-Lösungen, aber das Spielermodell sieht sofort, dass ein Ziel dann sein
    Licht nicht mehr bekommen kann.

**Abgrenzung Falle/Abschalten:**
- Beide gehen vom selben Zwischenstand aus. Es entscheidet, was die Lösung mit seinem Licht macht:
  - Nimmt sie es dem Ziel weg, ist es **Abschalten**: Das leuchtende Ziel ist falsch.
  - Bringt sie dasselbe Licht derselben Quelle auf einem anderen, längeren Weg hin, ist es eine **Falle**: Das Ziel ist
    richtig, nur der kurze Weg nicht.
- Für einen Zwischenstand gilt also nie beides; ein Test prüft das auf den 150. Im selben Level können beide vorkommen,
  an verschiedenen Zwischenständen (7 Level).
- Begründung:
  - Eine Einsicht soll einen Namen haben. Sonst trügen viele Level zwei Kernideen für denselben Aha-Moment, was die
    Haupt-Kernidee und die Abwechslung (Ticket 15) verzerrt.
  - Abschalten ist die genauere Aussage, weil sie sagt, was geschehen muss: Das Licht muss weg.
  - Abschalten bleibt, wie Ticket 10 es zählt. Ticket 10 nannte das dekorative Abschalten schon „eher eine Falle“.
- Folge: Die „Falle“ aus Review 4 in 134 Kristallpalast (Rot über S(3,2)/S(5,4)) ist Abschalten, denn das Ziel (6,3)
  bekommt sein Rot in der Lösung von einer anderen Quelle. Als Falle zählt in 134 der Zwischenstand für (1,1).

**Haupt-Kernidee** (`haupt-kernidee.mjs`, Teil `hauptKernidee`):
- Regel: Unter den nötigen Kernideen ist es die, die dem Schliessen am meisten abverlangt, nach einer festen Rangfolge.
  Unter mehreren Funden derselben Kernidee zählt der erste.
  1. Falle: Das Feld führt aktiv in die Irre (Holzweg, nicht auf den ersten Blick widerlegt).
  2. Abschalten: Ein leuchtendes Ziel muss gegen den Augenschein dunkel werden („stärkstes Aha“, Review 6).
  3. Farben abzählen: Der Verlust zeigt sich an keinem einzelnen Ziel.
  4. Sammelstelle: Ein Prisma muss mehreren Zuläufen zugleich dienen.
  5. Lockvogel: Der falsche Weg zeigt sein Ende, sobald Licht auf das Teil fällt.
  6. Mischziel aus zwei Quellen: Die Farbe des Ziels und der Quellen verrät es.
- Ohne nötige Kernidee ist `begriff` null. Ausgabe `{ begriff, fund, weitere, begruendung }`.
- Warum keine gemessene Grösse „Beitrag zum Schliessen“; geprüft an den Leveln mit mehreren Kernideen:
  - Gibt man dem Spielermodell die Elemente einer Kernidee vor, fallen immer alle Fallunterscheidungen weg, gleich bei
    welcher Kernidee. Das trennt nicht.
  - Folgerungen oder Fast-Lösungen an ihren Elementen oder Zielen zu zählen, misst vor allem ihre Grösse. Farben
    abzählen mit drei und mehr Zielen gewönne fast immer.
- Abgleich mit den Haupt-Ideen der Reviews: 2 von 8 stimmen, 141 Morgenröte (Abschalten) und 134 Kristallpalast
  (Falle). Anders:
  - 148 Sternenstaub: Abschalten statt Sammelstelle;
  - 149 Zenit: Abschalten statt Farben abzählen;
  - 125, 145 und 146: Farben abzählen statt Mischziel aus zwei Quellen;
  - 150: Falle statt Mischziel aus zwei Quellen.
  - Keine feste Rangfolge trifft alle: 141 verlangt Abschalten vor Sammelstelle, 148 das Umgekehrte; ebenso 149 und
    145/146 bei Farben abzählen und Mischziel aus zwei Quellen.

**Zahlen auf den 150** (Grad nach heutigem Platz; leicht/mittel/schwer/sehr schwer):

| Kernidee | Level | leicht | mittel | schwer | sehr schwer | Funde |
|---|---|---|---|---|---|---|
| Mischziel aus zwei Quellen | 37 | 2 | 8 | 17 | 10 | 44 |
| Abschalten | 24 | 0 | 8 | 11 | 5 | 31 |
| Farben abzählen | 18 | 0 | 3 | 9 | 6 | 22 |
| Sammelstelle | 9 | 0 | 0 | 4 | 5 | 10 |
| Falle | 10 | 0 | 2 | 6 | 2 | 10 |
| Lockvogel | 7 | 1 | 2 | 4 | 0 | 7 |
| mindestens eine der sechs | 64 | 3 | 20 | 31 | 10 | |

- Ohne Prüfung „nötig“ zeigen deutlich mehr Level das Muster:
  - Sammelstelle (Prisma mit Zulauf aus zwei Richtungen): 15 Level;
  - Lockvogel (lockendes festes Teil): 86 Level;
  - Falle (Zwischenstand, dessen Licht die Lösung auf anderem Weg bringt): 27 Level.
- Alle 7 nötigen Lockvögel sind Blocker. Nur mit der zweiten Lösung, ohne das Locken, waren es 13 in 12 Leveln.
- 8 Level haben erst durch dieses Ticket eine nötige Kernidee: 26 (leicht), 60, 74, 79, 111, 127, 132 und 138.
- **Haupt-Kernideen** (64 Level):

| Haupt-Kernidee | Level | leicht | mittel | schwer | sehr schwer |
|---|---|---|---|---|---|
| Mischziel aus zwei Quellen | 20 | 2 | 7 | 10 | 1 |
| Abschalten | 17 | 0 | 7 | 7 | 3 |
| Falle | 10 | 0 | 2 | 6 | 2 |
| Farben abzählen | 9 | 0 | 2 | 5 | 2 |
| Sammelstelle | 4 | 0 | 0 | 2 | 2 |
| Lockvogel | 4 | 1 | 2 | 1 | 0 |

- **Ab „mittel“ ohne nötige Kernidee: 59 Level** (vor dem Ticket 66; ohne das Locken beim Lockvogel 57): mittel 50,
  schwer 9, sehr schwer 0. Neu ohne sind 72 Rubin und 75 Bumerang.
  - Die 9 schweren sind 102, 103, 104, 106, 107, 108, 109, 115 und 118.
  - Die Spec verlangt ab „mittel“ mindestens eine Kernidee; das ist wichtig für den Haltepunkt der Duldungsliste
    (Ticket 15).

**Mini-Level** (je Kernidee nötig und dekorativ, dazu Grenzfälle):
- Sammelstelle:
  - nötig: Ein Prisma bricht Rot von Westen nach Norden und Blau von Süden nach Osten auf je ein Ziel;
  - dekorativ: dasselbe Prisma, aber das Blau läuft ins Leere;
  - dekorativ: Rot aus zwei Richtungen nimmt dieselbe Bahn;
  - kein Fund: Licht an der Rückseite.
- Lockvogel:
  - nötig: aus 26 Labyrinth verkleinert. Mit dem Prisma und drei weiteren Elementen anders leuchtet das blaue Ziel, und
    das Rot läuft in den Blocker: ein Holzweg mit 4 Elementen anders, ohne den Blocker eine zweite Lösung. Eine
    gezielte Suche nach einem kleineren Level mit diesen Eigenschaften fand keines;
  - kein Lockvogel: Ein Blocker verhindert nur eine zweite Lösung, die einen Spiegel von der Lösung entfernt liegt;
    einen Holzweg gibt es nicht (wie bei der Reparatur durch `makeUnique`);
  - dekorativ: Ein fester Spiegel bekommt beim Probieren Licht, ohne ihn bliebe die Lösung eindeutig.
- Falle:
  - nötig: Ein Prisma, nach Nordwesten gedreht, gibt Rot direkt ins rote Ziel. Dann kann der Spiegel (4,2) nicht
    zugleich Blau ins blaue Ziel und die rote Quelle ins zweite rote Ziel lenken: ein Holzweg mit 3 Elementen anders;
  - dekorativ: dasselbe mit dem blauen Ziel auf (5,4). Die Stellung verrät sich auf den ersten Blick, und ihre
    Fast-Lösungen liegen nur 2 Elemente weit;
  - Abgrenzung: Das Mini-Level „nötig“ aus dem Abschalten bleibt Abschalten.
  - Die Mini-Level der Falle stammen aus einer gezielten Suche (weisse Quelle, Prisma, Spiegel, Ziele an den
    Strahlenden) und sind von Hand nachgeprüft.
- Haupt-Kernidee:
  - Ein Prisma sammelt Rot und Blau, die sich über zwei feste Spiegel auf einem magentafarbenen Ziel treffen:
    Sammelstelle vor Mischziel aus zwei Quellen;
  - ohne nötige Kernidee keine Haupt-Kernidee.

**Tests** (nur über `beurteile`):
- Neue Testdateien `sammelstelle.test.mjs`, `lockvogel.test.mjs`, `falle.test.mjs` und `haupt-kernidee.test.mjs`
  (zusammen 26 Tests).
- Testgetrieben:
  - Sammelstelle und Haupt-Kernidee waren zuerst rot.
  - Bei Falle und Lockvogel belegen das die Gegenproben „nicht registriert“: rot.
- 16 verfälschte Regeln, je eine Änderung, fallen alle auf:
  - Sammelstelle: ohne „nötig“; ein nötiger Zulauf genügt; Blocker statt Prisma ohne Weitergabe;
  - Lockvogel: ohne „nötig“; ohne 10 %; auch Teile in der Lösung; nicht registriert; ohne Locken; ein Holzweg genügt;
    ohne zweite Lösung;
  - Falle: ohne Holzweg; ohne Spielermodell; ohne Abgrenzung; Holzweg ab 2; nicht registriert;
  - Haupt-Kernidee: Rangfolge umgekehrt.
  - Nur an den Zahlen der 150 fallen auf: ohne 10 %, auch Teile in der Lösung, Holzweg ab 2, ein Holzweg genügt.
- `node tests/beurteilung.test.mjs`: 127 Tests, rund 45 s statt 37,5 s (über `leise.sh` mit 20 %).
  - Der Lockvogel braucht auf den 150 rund 5 s. Je Teil, das lockt und in die Irre führt, sucht der Löser das ganze
    Level nach einer zweiten Lösung ab; das Locken prüft die Regel zuerst, weil es nichts kostet.
  - Das Zählen des Lichts in der Suche kostet unter 1 s.
  - Sammelstelle, Falle und Haupt-Kernidee brauchen zusammen unter 0,1 s.
- Die volle Beurteilung je Level: Median 8 ms, höchstens 3,6 s (140 Urknall), zusammen 34 s statt 26,6 s.
- `node tests/golden.mjs` (5 s) und `node tests/logic.test.mjs` (558 Tests, 33 s): grün.

**Abweichungen:**
- Die Prüfung „nötig“ der Sammelstelle erweitert nicht `gegenprobe` um einen Blocker in einer leeren Zelle, wie Ticket
  10 vorschlug, sondern bringt die eigene Wegnahme `ohneZulauf` (Grund oben).
- Die Haupt-Kernidee folgt einer festen Rangfolge statt einer gemessenen Grösse (Gründe oben).
- „Jedes Level bekommt eine Haupt-Kernidee“ gilt nur für Level mit einer nötigen Kernidee (64 der 150); die übrigen
  bekommen `begriff` null, ab „mittel“ 59 Level.
- Im README ist auch die Laufzeit des Testlaufs nachgeführt (etwa 45 s), nicht nur der neue Unterpunkt.
- Der nötige Mini-Level des Lockvogels ist aus 26 Labyrinth verkleinert, nicht von Hand gebaut.

**Offen:**
- Die Haupt-Kernidee weicht bei 6 von 8 Review-Leveln von der Haupt-Idee der Reviews ab. Die Gewichte des Spielwerts
  (Ticket 13) oder die KI-Tester (Ticket 16) könnten die Rangfolge eichen.
- Die Falle verlangt wie das Abschalten ein schon erfülltes Ziel. Die „Falle «Rot direkt ins Gelb»“ aus Review 6 (ein
  Teil der Farbe kommt auf kürzestem Weg) erkennt sie nicht. Keines der 150 Level hängt daran.
- `ohneZulauf` schickt die Startstrahlen mit den Koordinaten des Prismas in die Strahlregel. Beim Würfel (Ticket 14)
  kommt die Ebene dazu. Ausserdem nehmen `ohneZulauf` und `sammelstellen` eine Richtung der Feldform als Richtung von
  `refractInPrism`; im Würfel braucht es dafür die Drehachse des Prismas. Beides gehört dann in die Feldform.
- Mit `heutigeLevel()` ohne `teuer` laufen Mischziel, Abschalten, Farben abzählen und jetzt auch die Sammelstelle
  zweimal je Testlauf (siehe Ticket 10).

**Entscheide des Nutzers vom 16.10.2026** (nach dem Review):
- **Ein Lockvogel muss auch locken.** Nur mit der zweiten Lösung traf er auf den 150 fast nur Blocker, mit denen der
  heutige Generator mehrdeutige Level repariert (`makeUnique`). Neu zählt er nur, wenn er zusätzlich beim Probieren in
  die Irre führt.
  - Schwelle: Licht in mindestens 10 % der Holzwege, mindestens in einem. Dieselbe Grenze wie beim Locken überhaupt
    (10 % der Strahlbilder). Ein lockendes Teil bekommt ohnehin in vielen Strahlbildern Licht, also auch in einzelnen
    Holzwegen; erst ein merklicher Teil zeigt, dass Holzwege über es führen.
  - Auf den 150 fallen weg:
    - 72 Rubin, 75 Bumerang und 111 Lichtschleife: Sie haben gar keinen Holzweg; die zweite Lösung liegt nur einen
      Spiegel von der Lösung entfernt.
    - 131 Korona und 147 Farbmühle: 5 bzw. 9 % der Holzwege führen über den Blocker.
    - In 138 zählt nur noch der Blocker (2,3), nicht (1,3).
  - Andere Schwellen zum Vergleich: Mit „mindestens ein Holzweg“ blieben 9 Level (131 und 147 kämen dazu). Mit „die
    Strahlbilder mit Licht auf dem Teil sind öfter Holzwege als die übrigen“ blieben nur 26, 60 und 74.
  - Nur 4 Level haben den Lockvogel als Haupt-Kernidee (26, 60, 74, 132).
- **Die übrigen Auslegungen gelten vorläufig** und stehen in der Spec unter „Weitere Hinweise“, Block „Auslegungen bei
  der Umsetzung“: Abgrenzung Falle/Abschalten, feste Rangfolge der Haupt-Kernidee bis zum Eichen in Ticket 13/16,
  Holzweg gleich weite Fast-Lösung, Falle nur ohne Widerlegung auf den ersten Blick, Lockvogel mit weissem Filter,
  zweiter Lösung und Locken. Beim Schärfen des Glossars vor dem nächsten Lauf der KI-Tester kommt die Abgrenzung
  Falle/Abschalten dazu.
