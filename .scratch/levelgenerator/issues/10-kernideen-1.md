# 10: Kernideen I: Mischziel aus zwei Quellen, Abschalten, Farben abzählen

**What to build:** Die Beurteilung erkennt die ersten drei Kernideen. Eine Kernidee zählt nur, wenn die Lösung von ihr
abhängt. Die Prüfung, ob sie nötig ist, wird so gebaut, dass Ticket 11 sie für die übrigen Kernideen wiederverwenden
kann.

**Spec:** ../spec.md, Abschnitt „Beurteilung“ (Kernideen); Glossar, Abschnitt „Kernideen“.

**Blocked by:** 06 (Feldform und Beurteilung)

**Status:** resolved

- [x] Erkannt werden Mischziel aus zwei Quellen, Abschalten und Farben abzählen. Ausgangspunkt für die Erkennung,
      jeweils an Mini-Leveln zu begründen und zu schärfen:
      - **Mischziel aus zwei Quellen:** In der Lösung bekommt ein Ziel Licht aus zwei Quellen, und keine einzelne Quelle
        kann seine Farbe liefern.
      - **Abschalten:** Ein naheliegender Zwischenstand gibt einem Ziel falsches Licht, und die Lösung verlangt, dieses
        Licht wegzunehmen.
      - **Farben abzählen:** Die Zuordnung, welche Grundfarbe von welcher Quelle zu welchem Ziel muss, folgt aus den
        Zielfarben.
- [x] Jede Kernidee lässt sich auf „nötig“ prüfen und zählt nur dann.
- [x] Das Ergebnis nennt je Level die nötigen Kernideen mit Begründung: welches Ziel, welche Quellen, welches Licht.
- [x] Mini-Level gibt es je Kernidee zweimal, einmal mit nötiger und einmal mit bloss dekorativer Kernidee. Die
      dekorative zählt nicht.
- [x] Die Zahlen je Kernidee und Grad auf den 150 stehen unter `## Comments`.

## Comments

**Hinweis aus Ticket 06 (Mischziele):** `mischziele(ctx)` aus `tools/beurteilung/mischziele.mjs` liefert je Mischziel
`ausZweiQuellen`. Das heisst nur: Mindestens zwei Quellen bringen je allein Licht darauf (die Zählung der Spec, 38 der
150 Level). Die Kernidee verlangt mehr: Keine einzelne Quelle kann die Farbe liefern, und die Lösung hängt davon ab.
- Schon mit „keine Quelle liefert allein die Farbe“ (Lösungsstellung, je Quelle allein) sind es 37 Level und 44 Ziele
  statt 38 und 46.
- Anders sind 114 Gordischer Knoten (Gelb auf 3,0) und 125 Halo (Gelb auf 0,4).
- Das Kennzeichen taugt als Vorauswahl, nicht als Erkennung.

**Abschluss 16.10.2026.**

**Aufbau** (`tools/beurteilung/`, README unter „Beurteilung“):
- `noetig.mjs`: die Prüfung „nötig“, gemeinsam für alle Kernideen (siehe unten).
- `kernideen/mischziel-zwei-quellen.mjs`, `kernideen/abschalten.mjs`, `kernideen/farben-abzaehlen.mjs`, je eine Zeile
  in `regeln.mjs` unter der Kommentarzeile von Ticket 10. Gemessen wird in der Lösungsstellung.
- Jeder Fund nennt Ziel, Quellen und Licht als Felder und in der Begründung.

**Prüfung „nötig“** (`noetig.mjs`): Die Kernidee nimmt der Lösung ihren Beitrag weg und fragt, ob dann ein Ziel seine
Farbe verliert. Wo es um andere Stellungen geht, fragt sie den Löser.
- `gegenprobe(ctx, wegnahme)`: Zellen der Ziele, die die Lösungsstellung ohne den Beitrag nicht mehr erfüllt.
  - Die Wegnahme ersetzt Elemente und lässt keines weg: `nurQuelle(ctx, quelle)`, ein Blocker an der Stelle eines
    Elements oder ein abgewandeltes Element.
- `wegZu(ctx, ziel, elemente, stellung)`: die drehbaren Elemente, die das Licht eines Ziels braucht, in beliebiger
  Stellung (Gegenprobe je Element).
- `allein(ctx)`: je Quelle eine Suche des Lösers, die übrigen Quellen als Blocker, einmal je Beurteilung über
  `ctx.merke`. Ergebnis: die Grundfarben, die an jedem Ziel ankommen können, die verlierbaren Grundfarben, die Stellungen,
  in denen die Quelle ein Ziel allein erfüllt, und ob abgebrochen wurde. Gezählt werden nur Stellungen ohne falsches
  Licht.
- Dazu `brettIn` (Brett in beliebiger Stellung), `quellen`, `FARBNAME` (deutsch) und `liste` für Begründungen.
- **Für Ticket 11:**
  - Sammelstelle: `gegenprobe` ohne den Zulauf aus einer Einfallsrichtung, je Richtung. `gegenprobe` ersetzt heute
    nur Elemente: Das Element, von dem der Strahl kommt, lässt sich zum Blocker machen (es schluckt dann auch seine
    übrigen Strahlen). Ein Blocker in einer leeren Zelle vor dem Prisma braucht eine kleine Erweiterung; hinten an die
    Liste gehängt, liesse er die Ids unverändert.
  - Lockvogel: das Teil durchsichtig machen (ein weisser Filter lässt alles durch) und mit dem Löser vergleichen. Liegt
    das Teil abseits der Lösung, ist `gegenprobe` immer leer. `allein` nimmt keine Wegnahme an; eine Suche mit
    abgewandelten Elementen ruft Ticket 11 selbst auf (`solve`) oder erweitert `allein`.
  - Falle: `zwischenstaende(ctx)` aus `kernideen/abschalten.mjs` liefert die naheliegenden Zwischenstände, auch die bloss
    dekorativen. Bringt die Lösung dasselbe Licht auf anderem Weg, ist das eher eine Falle.
  - Haupt-Kernidee: Die Funde tragen Ziel und Quellen; `knappeFarben(ctx)` und `zwischenstaende(ctx)` liefern auch die
    nicht nötigen Muster.

**Erkennung je Kernidee:**
- **Mischziel aus zwei Quellen:** Vorauswahl `mischziele(ctx)` mit `ausZweiQuellen`.
  - Nötig: Mit dem Licht nur einer Quelle (`gegenprobe` mit `nurQuelle`) verliert das Ziel seine Farbe, bei jeder Quelle.
  - Fund `{ ziel, farbe, quellen, licht: { Quelle: Farbe ihres Lichts } }`.
  - „Kann liefern“ heisst: in der Lösung. Gälte jede Stellung, die eine Quelle allein erreicht, blieben 18 statt 44
    Ziele. Es fielen auch die beiden Magentaziele von 148 Sternenstaub weg (Review 6 und KI-Tester: aus je zwei
    Quellen) und Magenta in 125 Halo. Eine solche Stellung löst das Level nicht.
- **Abschalten:**
  - Zwischenstand: Eine Quelle erfüllt das Ziel allein (`allein`); er besteht aus den Elementen auf dem Weg (`wegZu`).
  - Naheliegend:
    - ein kurzer Strang wie beim Füllteil, höchstens drei drehbare Elemente;
    - weniger Elemente als der Weg zum Ziel in der Lösung;
    - kein falsches Licht, auch nicht von anderen Quellen über die gesetzten Elemente (offene schlucken wie Blocker).
  - Nötig: Mit nur dieser Quelle erfüllt die Lösung das Ziel nicht mehr, ihr Licht muss also weg.
  - Dekorativ: Die Lösung bringt dasselbe Licht auf anderem Weg; das ist eher eine Falle.
  - Fund `{ ziel, farbe, quelle, zwischenstand, licht }`; `licht` ist der Teil, der weg muss.
  - Morgenröte (141), „Das erfüllte Ziel muss man zerstören“ (Review 6): Ziel (6,4) mit Element (5,4).
- **Farben abzählen:**
  - Knapp: Genau so viele Quellen können die Grundfarbe an ein Ziel bringen, wie Ziele sie brauchen, mindestens zwei.
    Ein Strahl einer Grundfarbe endet an höchstens einem Ziel; also muss jede Quelle sie an ein eigenes Ziel bringen.
  - Nötig: Bei einer Quelle kann die Grundfarbe verloren gehen, und das zeigt sich an keinem Ziel. Ein Ziel mit nur einem
    möglichen Lieferanten bekommt ihn, und erst wenn einem Ziel keiner bleibt, zeigt sich der Verlust; das Abzählen
    zeigt ihn vorher.
  - Bei zwei Quellen zeigt sich ein Verlust immer am Ziel, nötig ist das Abzählen also erst ab drei Quellen. Das deckt
    sich mit den Reviews: „drei Quellen, drei Blau“ (149 Zenit), dazu 125, 141 und 148 (KI-Tester).
  - Fund `{ farbe, quellen, ziele, zuordnung in der Lösung, unsichtbar: Quellen, deren Verlust kein Ziel zeigt }`.

**Mini-Level** (je Kernidee nötig und dekorativ, dazu Grenzfälle):
- Mischziel aus zwei Quellen:
  - nötig: Rot und Blau auf dem Ziel; Rot und Blau im Kombinator;
  - dekorativ: Magenta aus einem Prisma, dazu Rot einer zweiten Quelle;
  - kein Fund: zwei Strahlen derselben Quelle.
- Abschalten:
  - nötig: Ziel nach einem Zug erfüllt, die Lösung braucht dieses Licht anderswo;
  - dekorativ: Die Lösung führt dasselbe Rot auf anderem Weg hin;
  - kein Fund, wenn die Lösung ebenso kurz ist oder wenn der Zwischenstand fremdes Licht falsch auf ein Ziel lenkt;
  - nur ein Teil des Lichts muss weg: 148, Ziel (1,3).
- Farben abzählen:
  - nötig: drei blaue Quellen, drei Prismen, drei Ziele;
  - dekorativ: jede Quelle mit eigenem Ziel;
  - kein Fund: eine vierte Quelle (nicht knapp); ein Blau, das nicht verloren gehen kann.

**Zahlen auf den 150** (Grad nach heutigem Platz: leicht 1–30, mittel 31–100, schwer 101–140, sehr schwer 141–150):

| Kernidee | Level | leicht | mittel | schwer | sehr schwer | Funde |
|---|---|---|---|---|---|---|
| Mischziel aus zwei Quellen | 37 | 2 | 8 | 17 | 10 | 44 Ziele |
| Abschalten | 24 | 0 | 8 | 11 | 5 | 31 |
| Farben abzählen | 18 | 0 | 3 | 9 | 6 | 22 |
| mindestens eine der drei | 56 | 2 | 17 | 27 | 10 | |

- Ohne Prüfung „nötig“ zeigen deutlich mehr Level das Muster:
  - Mischziel aus zwei Quellen (`ausZweiQuellen`): 38 Level, 46 Ziele; 114 fällt ganz weg, in 125 das gelbe Ziel.
  - naheliegender Zwischenstand: 39 Level;
  - knappe Grundfarbe: 135 Level.
- Ohne die Grenze von drei Elementen zählten bei Abschalten 34 Level.
- 66 Level ab „mittel“ haben noch keine dieser drei Kernideen (53 mittel, 13 schwer). Ticket 11 bringt die übrigen drei.

**Tests** (testgetrieben, nur über `beurteile`):
- `node tests/beurteilung.test.mjs`: 45 Tests (17 neu), etwa 5 s statt 1,3 s; die drei Regeln brauchen über die
  150 Level zusammen rund 4 s, vor allem für die Suchen je Quelle und die Wege der Zwischenstände.
- Ohne Regeln waren die nötigen Mini-Level und die Zahlen rot.
- Zehn verfälschte Regeln, je eine Änderung, fallen alle auf, zwei davon erst nach eigenen Grenzfall-Leveln:
  - ohne Prüfung „nötig“, bei jeder der drei Kernideen;
  - ohne die Prüfung auf falsches Licht im Zwischenstand;
  - ohne Grenze kurzer Strang;
  - nicht kürzer als die Lösung;
  - ohne Zuteilung Ziel für Ziel;
  - auch mit mehr Quellen als Zielen;
  - ohne möglichen Verlust;
  - Mischziel: Gegenprobe nur für die erste beteiligte Quelle statt für alle.
- `node tests/golden.mjs` und `node tests/logic.test.mjs` (558 Tests): grün, über `leise.sh`.

**Abweichungen vom Ticket:**
- „Keine Quelle kann die Farbe liefern“ gilt in der Lösung, nicht für jede Stellung (Zahlen oben).
- Abschalten zählt nur Licht in der Farbe des Ziels („das Ziel leuchtet schon“).
  - Licht in falscher Farbe sieht der Spieler sofort, und die Startstellung, die es oft zeigt, ist zufällig verdreht.
  - Darum zählt 35 Kreuzweg nicht. KI-Tester A nannte dort Abschalten: Magenta auf dem Cyan-Ziel in der Startstellung.
- Die Grenze „kurzer Strang“ (drei Elemente) kommt aus dem Glossar (Füllteil), nicht aus dem Ticket.
- Farben abzählen braucht mindestens drei knappe Strahlen einer Grundfarbe; zwei zählen nie (siehe oben).

**Offen:**
- Im README nennen die Zeile zum Testlauf („etwa 1 s“) und der Satz zu `offen` („alle ausser den Mischzielen“) noch den
  Stand von Ticket 06. Beide Stellen teilen sich die parallelen Tickets; nachführen beim Zusammenführen.
  - Ticket 09 schreibt beide Stellen schon neu (Testlauf „etwa 30 s“) und setzt seinen eigenen Absatz an dieselbe
    Stelle wie dieses Ticket, hinter den Absatz „Mischziele“. Beim Zusammenführen gibt das dort einen Konflikt: beide
    Absätze behalten. `regeln.mjs` lässt sich ohne Konflikt zusammenführen (geprüft im Review).
  - Mit `teuer` aus Ticket 09 laufen die drei Regeln auch bei `teuer: false` (sie sind nicht als teuer markiert); mit
    beiden Fassungen von `heutigeLevel` beurteilt ein Testlauf sie zweimal, zusammen rund 6–8 s.
- „Naheliegend“ misst bei Abschalten heute nur die Länge des Strangs. Mit dem Spielermodell (Ticket 09) liesse es sich
  schärfen, etwa danach, welches Ziel ein Spieler zuerst angeht.
- Die Suchen je Quelle haben die Grenze des Lösers (2 Mio. Knoten); auf den 150 bricht keine ab. Bricht eine ab, zählt
  Farben abzählen nicht, und Abschalten sieht nur die gefundenen Zwischenstände.
