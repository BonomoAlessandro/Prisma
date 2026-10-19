# Spec: Level beurteilen und generieren

Status: ready-for-agent

Begriffe nach `CONTEXT.md` (Glossar). Grundsatzentscheide in `docs/adr/0001`–`0004`. Diese Spec ersetzt die offenen
Punkte 2.5–2.7 und 3.1–3.5 in PLAN.md; dort steht künftig nur ein Verweis hierher.

## Problem

Die Level von PRISMA sollen Spass machen und mit der richtigen Schwierigkeit im Spiel stehen. Beides leisten die
heutigen Werkzeuge nicht:

- **Die Schwierigkeit misst die Grösse, nicht das Denken.** Die heutige Formel folgt fast nur der Zahl drehbarer
  Elemente (R² 0,86). Mit der heutigen Reihenfolge stimmt sie grob überein (Rangkorrelation 0,88), in der Mitte und
  oben aber kaum (31–60: 0,08; 61–90: 0,09; 121–150: 0,41). Die heutige Reihenfolge stammt vollständig aus Reviews und
  ist von Hand eingetragen.
- **Ob ein Level Spass macht, prüft der Code kaum.** Es gibt nur einen Ja/Nein-Filter. Wendet man die Ausschlussgründe
  aus den Reviews an, fallen 37 der 150 Level heraus, darunter vier, die das letzte Review als gut ausgewählt hatte.
- **Jedes Werkzeug rechnet anders.** Generator, Härten, Kuratieren und Tests haben eigene Formeln. Das Härten bricht
  deshalb oft mit „zu leicht“ ab.
- **Ein Mischziel wird falsch gezählt.** Ein weisses Ziel direkt aus einer weissen Quelle zählt heute als Mischziel
  (129 statt 71 Level).
- **Die Markierung sagt wenig.** Nur „schwer“ und „sehr schwer“ werden markiert, vergeben nach Herkunft und nicht nach
  Schwierigkeit.
- **Der Generator ist langsam und liefert oben zu wenig.** Ein Profil kann wegen seines Budgets nie ein Level liefern.
  Teure Reparaturen bringen kaum etwas, und die Strahlregel und der Löser verschwenden Rechenzeit.
- **Würfel-Level sind angedacht** (Branch `feature/3d-wuerfel`), aber kein Werkzeug kennt sie.

## Lösung

- **Ein gemeinsames Modul beurteilt jedes Level.** Es liefert getrennt die **Schwierigkeit** (Denkarbeit, bestimmt die
  Reihenfolge) und den **Spielwert** (Spass, entscheidet über die Aufnahme), dazu die nötigen **Kernideen**, die
  **Mischziele** und die Ausschlussgründe **Probieren**, **Füllteil**, **Scheinmischung**, **Zerfall** und **Knäuel**.
  Alle Werkzeuge und Tests benutzen dieses Modul.
- **Geeicht wird an der heutigen Reihenfolge** (ADR 0001), geprüft an Leveln, an denen nicht geeicht wurde.
- **Zwei KI-Tester korrigieren eng** (ADR 0002). Sie beurteilen Aha-Moment, Lesbarkeit und Gefühl.
- **Vier Schwierigkeitsgrade für alle Level:** leicht, mittel, schwer, sehr schwer. Sie folgen festen Schwellen, sinken
  entlang der Reihenfolge nie und erscheinen im Spiel als Punkte 1–4 und als Text.
- **Ein einziger Generator für alle Grade** (ADR 0004) baut zuerst eine Kernidee gezielt ein und verfeinert dann.
- **Strahlregel und Löser werden schneller bei gleichem Verhalten** (ADR 0003), abgesichert durch einen Golden-Test.
- **Die 150 Level werden neu bewertet und umsortiert.** Die 37 Level mit Ausschlussgrund auf der Duldungsliste ersetzt
  der neue Generator; über die übrigen Level der Liste wird je Grad entschieden (Ticket 15).
- **Bewertung und Generator arbeiten über eine Feldform.** So kommen Würfel-Level später ohne Umbau dazu. Die
  Würfel-Logik selbst bleibt auf ihrem Branch.

## User Stories

### Spieler

1. Als Spieler will ich, dass jedes Level nach dem Tutorial einen Schwierigkeitsgrad hat, damit ich weiss, worauf ich
   mich einlasse.
2. Als Spieler will ich den Grad als Punkte 1–4 auf jeder Kachel der Levelauswahl sehen, damit ich schwere Level auf
   einen Blick finde.
3. Als Spieler will ich den Grad als Text in der Kopfzeile des Levels sehen, damit ich ihn auch beim Spielen kenne.
4. Als Spieler will ich den Grad im Seitentitel der Levelauswahl sehen, wenn alle Level der Seite denselben Grad
   haben, damit ich mich auf den Seiten zurechtfinde.
5. Als Spieler will ich die Grade ohne Farbsehen unterscheiden können, damit ich sie nicht mit Lichtfarben verwechsle.
6. Als Spieler will ich, dass der Grad entlang der Reihenfolge nie sinkt, damit nach einem schweren Level kein
   mittleres kommt.
7. Als Spieler will ich, dass die Level spürbar schwerer werden, damit ich mich steigern kann.
8. Als Spieler will ich, dass zwei benachbarte Level ähnlich schwer sind, damit es keine Sprünge gibt.
9. Als Spieler will ich jedes Level durch Schliessen lösen können, damit ich nicht blind drehen muss.
10. Als Spieler will ich in jedem Level ab „mittel“ eine Kernidee finden, damit ich einen Aha-Moment erlebe.
11. Als Spieler will ich, dass sich die Kernideen abwechseln, damit nicht zehn Level hintereinander dasselbe verlangen.
12. Als Spieler will ich, dass in Leveln ab „mittel“ jeder Strang für den Rest eine Rolle spielt, damit kein Teil des
    Felds blosse Fleissarbeit ist.
13. Als Spieler will ich, dass Kombinatoren und Prismen immer etwas bewirken, damit die Farblogik echt ist.
14. Als Spieler will ich ab „mittel“ keine Level, die in unabhängige Teilrätsel zerfallen, damit das Level als Ganzes
    ein Rätsel ist.
15. Als Spieler will ich kein Knäuel, damit ich das Feld auch auf dem Handy lesen kann.
16. Als Spieler will ich keine Level, bei denen nur Raten hilft, damit Nachdenken belohnt wird.
17. Als Spieler will ich, dass leichte Level aus einfachen Strängen bestehen dürfen, damit ich die Elemente in Ruhe
    kennenlerne.
18. Als Spieler will ich, dass das Tutorial bleibt, wie es ist, damit der Einstieg unverändert gut funktioniert.
19. Als Spieler will ich meinen Fortschritt behalten, wenn Level umsortiert werden, damit ich nichts doppelt spiele.
20. Als Spieler will ich, dass ein entferntes Level einfach verschwindet und mein übriger Fortschritt bleibt.
21. Als Spieler will ich, dass ein neues Level nie als gelöst gilt, nur weil früher ein Level gleichen Namens existierte.
22. Als Spieler will ich, dass sich die Strahlen genau gleich verhalten wie vorher, auch wenn das Spiel schneller
    rechnet.
23. Als Spieler will ich, dass Ersatzlevel neue Namen im bisherigen Stil tragen, damit das Spiel einheitlich wirkt.

### Entwickler: Beurteilung

24. Als Entwickler will ich eine Schwierigkeit, die vor allem die Denkarbeit misst, damit die Reihenfolge auch in der
    Mitte stimmt.
25. Als Entwickler will ich, dass die Grösse nur mit kleinem, begrenztem Anteil in die Schwierigkeit eingeht, damit
    grosse, aber einfache Level nicht nach hinten rutschen.
26. Als Entwickler will ich, dass die Schwierigkeit die heutige Reihenfolge mit einer Rangkorrelation von mindestens
    0,85 insgesamt und 0,3 je 30er-Bereich nachbildet, damit sie meinem Spielgefühl entspricht.
27. Als Entwickler will ich, dass diese Werte an Leveln gemessen werden, an denen nicht geeicht wurde (jede Hälfte mit
    den Gewichten aus der anderen), damit die Formel die Reihenfolge nicht auswendig lernt.
28. Als Entwickler will ich, dass alle 150 Level beim Eichen gleich zählen.
29. Als Entwickler will ich einen Spielwert getrennt von der Schwierigkeit, damit ein schweres, aber langweiliges Level
    nicht ins Spiel kommt.
30. Als Entwickler will ich, dass Schliessen und eine nötige Kernidee den Spielwert zu etwa zwei Dritteln tragen, damit
    die wichtigsten Spassquellen am meisten zählen.
31. Als Entwickler will ich, dass Farblogik und Zusammenspiel einen kleineren Bonus geben, damit nicht alle Level gleich
    gebaut werden.
32. Als Entwickler will ich einen Mindest-Spielwert, unter dem ab „mittel“ kein Level ins Spiel kommt.
33. Als Entwickler will ich, dass eine Kernidee nur zählt, wenn die Lösung von ihr abhängt, damit dekorative Muster
    keinen Spielwert vortäuschen.
34. Als Entwickler will ich, dass ein Ausschlussgrund ein Level hart ausschliesst und mit Begriff und Begründung
    gemeldet wird, damit ich sehe, warum es fällt.
35. Als Entwickler will ich, dass Füllteil und Zerfall erst ab „mittel“ gelten und Probieren, Scheinmischung und Knäuel
    überall.
36. Als Entwickler will ich, dass Mischziele nach dem Glossar gezählt werden, damit Weiss aus einer weissen Quelle
    nicht als Mischung gilt.
37. Als Entwickler will ich zur Schwierigkeit und zum Spielwert die Teilwerte sehen, damit ich jede Einstufung
    nachvollziehen kann.
38. Als Entwickler will ich, dass der Schwierigkeitsgrad über feste Schwellen aus der Schwierigkeit folgt, damit ein
    neues Level automatisch richtig eingestuft wird.
39. Als Entwickler will ich, dass Generator, Kuratieren und Tests dieselbe Beurteilung benutzen, damit kein Werkzeug
    mit eigener Formel rechnet.
40. Als Entwickler will ich das Spielermodell versioniert bei den Werkzeugen haben, damit die Beurteilung
    reproduzierbar ist.

### Entwickler: KI-Tester

41. Als Entwickler will ich zwei voneinander unabhängige KI-Tester, damit ein einzelnes Fehlurteil nichts entscheidet.
42. Als KI-Tester will ich das Feld als Text und Screenshots der Startstellung auf Desktop und Handy, damit ich die
    Lesbarkeit beurteilen kann.
43. Als KI-Tester will ich je zwei feste Anker pro Schwierigkeitsgrad, damit „schwerer als“ für alle Tester dasselbe
    heisst.
44. Als Entwickler will ich die Urteile in festen JSON-Feldern, damit ich sie auswerten kann.
45. Als Entwickler will ich, dass die Tester ein Level höchstens um 5 Plätze verschieben und nie über eine Gradgrenze,
    damit sie die Reihenfolge nicht durcheinanderbringen.
46. Als Entwickler will ich, dass ein Level nur fällt, wenn beide Tester es ablehnen, und zwar mit einem Begriff aus dem
    Glossar.
47. Als Entwickler will ich, dass die Tester jedes neue Level prüfen und jedes heutige, bei dem Formel und heutige
    Reihenfolge um mehr als 10 Plätze auseinanderliegen.
48. Als Entwickler will ich jede Korrektur mit Begründung in einem versionierten Protokoll, damit ich den Code daran
    nacheichen kann.
49. Als Entwickler will ich die Gewichte des Spielwerts am Spass-Urteil der Tester eichen.

### Entwickler: Levelliste und Austausch

50. Als Entwickler will ich die 150 heutigen Level neu bewertet und danach sortiert haben, damit die Reihenfolge der
    neuen Schwierigkeit folgt.
51. Als Entwickler will ich, dass kleine Abweichungen die Formel entscheidet und grosse die Tester prüfen, damit die
    bewährte Reihenfolge nicht auf einen Schlag umgeworfen wird.
52. Als Entwickler will ich eine Duldungsliste der heute ausgeschlossenen Level, die nur kürzer werden darf, damit die
    Tests sofort gelten und der Austausch später folgt.
53. Als Entwickler will ich den Austausch je Schwierigkeitsgrad in einem Durchgang, geprüft durch die KI-Tester.
54. Als Entwickler will ich, dass ich die vorgeschlagenen Namen der Ersatzlevel genehmige.
55. Als Entwickler will ich eine Liste der Namen entfernter Level, die nie wieder vergeben werden.
56. Als Entwickler will ich, dass die Anzahl von 150 Leveln später änderbar bleibt.

### Entwickler: Generator und Effizienz

57. Als Entwickler will ich einen einzigen Generator für alle Grade, der zuerst eine Kernidee gezielt einbaut und dann
    verfeinert, damit auch schwere Level eine Kernidee haben.
58. Als Entwickler will ich dem Generator einen Auftrag geben (Grad, Kernidee, Seed, Feldform) und ein Level oder nichts
    zurückbekommen.
59. Als Entwickler will ich, dass der Generator bei gleichem Seed dasselbe Level liefert, damit Läufe reproduzierbar
    sind.
60. Als Entwickler will ich, dass jedes gelieferte Level genau eine Lösung hat und die Beurteilung besteht.
61. Als Entwickler will ich, dass Ausschlüsse und Spielwert schon während des Verfeinerns gelten, damit keine Rechenzeit
    in aussichtslose Kandidaten fliesst.
62. Als Entwickler will ich, dass günstige Prüfungen vor teuren laufen, damit der Generator früh verwirft.
63. Als Entwickler will ich, dass ein Kandidat mit zu wenigen Klicks eine neue Startstellung bekommt, statt verworfen zu
    werden.
64. Als Entwickler will ich nur Budgets, die die verlangten Untergrenzen überhaupt erreichen können.
65. Als Entwickler will ich, dass der Generator höchstens 50 % CPU nutzt, damit der Rechner bedienbar bleibt.
66. Als Entwickler will ich die Effizienz als angenommene Level je CPU-Stunde und Grad messen, mit festen Seeds, damit
    ich Verbesserungen belegen kann.
67. Als Entwickler will ich Ausgangszahlen vor dem Umbau, damit ich den Fortschritt vergleichen kann.
68. Als Entwickler will ich eine schnellere Strahlregel und einen schnelleren Löser, damit Generator und Tests weniger
    Zeit brauchen.
69. Als Entwickler will ich einen Golden-Test, der jede Änderung im Verhalten der Strahlregel und des Lösers meldet.
70. Als Entwickler will ich, dass der Golden-Test Kommazahlen mit einer Toleranz von 1e-9 vergleicht, damit
    Rundungsreste keinen Umbau blockieren.

### Entwickler: Würfel

71. Als Entwickler will ich, dass Beurteilung, Spielermodell und Generator das Feld nur über eine Feldform kennen, damit
    Würfel-Level später ohne Umbau dazukommen.
72. Als Entwickler will ich, dass die Würfel-Logik auf ihrem Branch bleibt und dort weiterentwickelt wird.
73. Als Entwickler will ich nach Phase 2 und nach Phase 5 main in den Würfel-Branch übernehmen und dort dieselben Tests
    mit Würfel-Leveln laufen lassen, damit die Feldform an echten Würfeln geprüft ist.
74. Als Entwickler will ich, dass flache Level und Würfel-Level mit derselben Strahlregel rechnen, damit sich der Strahl
    überall gleich verhält.

## Entscheide zur Umsetzung

### Ablauf in sechs Phasen

1. **Schneller bei gleichem Ergebnis:** Strahlregel und Löser werden beschleunigt, der Golden-Test kommt nach main,
   und die Ausgangszahlen der Effizienz werden gemessen.
2. **Beurteilung:** das gemeinsame Modul mit Schwierigkeit, Spielwert, Kernideen, Mischzielen und Ausschlüssen,
   geeicht an der heutigen Reihenfolge. Danach wird main in den Würfel-Branch übernommen.
3. **Die 150 neu bewerten:** umsortieren, KI-Tester bei grossen Abweichungen, Grade festlegen, die neuen Tests der
   Levelliste mit Duldungsliste.
4. **Grade im Spiel:** Punkte, Kopfzeile, Seitentitel.
5. **Neuer Generator** mit Kernideen. Er ersetzt den heutigen Generator, das Härten und die Profile. Danach wird main
   in den Würfel-Branch übernommen.
6. **Austausch:** Ersatz für die Duldungsliste je Grad, mit neuen Namen und Prüfung durch die KI-Tester. Zuerst kommen
   die 37 Level mit Ausschlussgrund; über die 52, die nur wegen Kernidee oder Spielwert auf der Liste stehen, wird je
   Grad nach Ticket 16 entschieden, mit den Urteilen der KI-Tester (Entscheid des Nutzers vom 16.10.2026).

Phase 3 braucht Phase 2. Phase 4 braucht die Grade aus Phase 3. Phase 5 braucht Phase 2, Phase 6 braucht die Phasen
3 und 5. Phase 1 ist Voraussetzung für alle, weil der Golden-Test das Sicherheitsnetz ist.

### Strahlregel (ADR 0003)

- Sie bleibt die einzige Regel für Spiel, Löser, Generator, Beurteilung und Tests. Es gibt keine schnellere Kopie für
  die Werkzeuge.
- **Beschleunigt wird ohne Änderung des Verhaltens.** Die heissen Stellen aus der Messung: Beim Lesen einer offenen
  Stellung wird eine Ausnahme geworfen. Längen werden bei jedem Schritt neu berechnet. Die Buchhaltung der Kombinatoren
  ist aufwendig. Bei jedem Knoten der Suche werden alle Strahlen neu verfolgt.
- „Gleiches Verhalten“ heisst: gleiche Treffer, Mischungen, „gelöst“, Art, Reihenfolge und Farbe der Ereignisse, gleiche
  Zellen und Richtungen. Kommazahlen (Normalen, Endpunkte, Längen) dürfen um höchstens 1e-9 abweichen.
- Das Spiel profitiert mit. Vor und nach dem Umbau werden Screenshots verglichen.

### Löser

- Was nur die Suche betrifft, gehört in den Löser: früh aufhören, wenn nur die Eindeutigkeit gefragt ist (ab der
  zweiten Lösung), doppelte Suchen weglassen, Zwischenspeicher.
- Neue, schnellere Modi lassen die Ergebnisse der bestehenden Aufrufe unverändert (Zahl der Lösungen, Knoten, Blätter,
  Fast-Lösungen, Rateschritte).

### Feldform

- Beurteilung, Spielermodell und Generator kennen das Feld nur über eine Feldform: Zellen, Nachbarn, Richtungen, die
  Drehachse eines Elements und seine möglichen Stellungen. Feste x/y-Annahmen oder „acht Richtungen“ stehen nur in der
  Feldform.
- Auf main gibt es nur die flache Feldform (quadratisch, bis 7×7).
- Alle Regeln der Beurteilung gelten ohne Bezug auf eine Ebene. Knäuel zählt über Nachbarn, Füllteil über Spiegel,
  Zerfall über Gruppen von Zielen.

### Beurteilung (ein Modul, ein Einstieg)

**Eingabe:** ein Level in jeder Feldform. **Ausgabe:**
- Schwierigkeit (Zahl) mit Teilwerten
- Spielwert (Zahl) mit Teilwerten
- nötige Kernideen, eine davon als Haupt-Kernidee
- Mischziele
- Ausschlussgründe, je mit Glossarbegriff und Begründung

Der Schwierigkeitsgrad folgt über feste Schwellen aus der Schwierigkeit.

**Schwierigkeit**
- Sie besteht vor allem aus Denkarbeit: dem Spielermodell (Horizonte, Ketten, Fallunterscheidungen), der Farblogik und
  den Kernideen. Die Grösse (drehbare Elemente) zählt nur mit kleinem, nach oben begrenztem Anteil.
- Dazu kommen das Zusammenspiel (derselbe Teilwert wie im Spielwert) und die Weglänge (gerade Strahlabschnitte der
  Lösung). Die Weglänge trägt im Mittel höchstens ein Viertel des Werts und bei keinem Level mehr als ein Drittel, die
  Denkarbeit im Mittel mindestens die Hälfte (Entscheide des Nutzers, Ticket 12).
- **Eichung (ADR 0001):** Die Gewichte werden an jedem zweiten der 150 Level eingestellt, den geraden Plätzen. Geprüft
  wird gekreuzt: an den geraden eichen und die ungeraden vorhersagen, dann umgekehrt. Abnahme: Rangkorrelation dieser
  Vorhersagen mit der heutigen Reihenfolge mindestens 0,85 über alle Level und mindestens 0,3 in jedem 30er-Bereich,
  dort über alle 30 Level, beides auf zwei Stellen gerundet wie beim Knäuel. Alle 150 zählen gleich.
  - Bis zum 16.10.2026 galt 0,5 je Bereich, gemessen nur an den 15 nicht geeichten Leveln eines Bereichs. Das erreichte
    keine Formel; Begründung und Zahlen in ADR 0001 und Ticket 12.

**Spielwert**
- **Schliessen** misst das Spielermodell.
- Eine **Kernidee** zählt nur, wenn die Lösung von ihr abhängt.
- Schliessen und eine nötige Kernidee tragen zusammen etwa zwei Drittel: Ein Level mit vollem Schliessen und einer
  nötigen Kernidee erreicht ohne Bonus gut 60 Punkte.
- **Farblogik** und **Zusammenspiel** geben einen kleineren Bonus.
- Unter dem **Mindest-Spielwert** wird ein Level ab „mittel“ nicht aufgenommen.
- Die Gewichte werden am Spass-Urteil der KI-Tester geeicht.

**Spielermodell**
- Das heutige Spielermodell aus den Reviews kommt versioniert zu den Werkzeugen und wird ein Teil der Beurteilung.
- Es steht hinter der Feldform.

**Kernideen** (Glossar): Mischziel aus zwei Quellen, Abschalten, Farben abzählen, Sammelstelle, Falle, Lockvogel.
- Jede Kernidee hat eine eigene Erkennung. Sie zählt nur, wenn die Lösung von ihr abhängt.
- Ab „mittel“ hat jedes Level mindestens eine Kernidee.
- Dieselbe Haupt-Kernidee kommt höchstens zweimal je 10 Level vor.

**Mischziel:** Ein Ziel, dessen Farbe im Level gemischt wird, durch einen Kombinator oder durch mehrere Strahlen auf
dem Ziel. Weiss direkt aus einer weissen Quelle zählt nicht. Nach dieser Definition haben heute 71 Level ein Mischziel,
38 eines aus zwei Quellen.

**Ausschlussgründe** (hart, ADR 0002). Die Schwellen liegen knapp über dem heutigen Höchstwert, damit sie neue Level vor
den Fehlern aus den Reviews schützen.

| Grund | gilt | Regel |
|---|---|---|
| Probieren | alle Grade | Weite Fast-Lösungen machen mehr als 60 ‰ aller Strahlbilder der Suche ohne Abschneiden aus (heutiges Maximum 55,5 ‰). Oder Raten: Horizont kInf > 6 oder Kette > 38 (strikt grösser; die heutigen Höchstwerte mit genau 6 bzw. 38 bestehen, 144 und 135; 16.10.2026 angepasst: feste Zellenfolge, vorher 4/28). |
| Füllteil | ab „mittel“ | Ein Strang mit einer Quelle, höchstens 3 Spiegeln und eigenem Ziel. Dreht man ausgehend von der Lösung irgendein drehbares Element des Strangs einzeln in eine andere Stellung, ändert sich das Licht, das fremde Strahlen an andere Ziele bringen, nie. |
| Scheinmischung | alle Grade | (a) Ein Kombinator gibt einen Eingang unverändert aus oder hat nur einen beleuchteten Eingang. (b) Eine Mischung läuft direkt in ein Prisma, das genau die eingehenden Strahlen wieder trennt; gezählt wird nach Strahlen, nicht nach Quellen. (c) Eine Mischung läuft in einen Filter, der nur einen Eingang durchlässt. „Nur eine Quelle trägt die Mischung“ ist kein Ausschluss. |
| Zerfall | ab „mittel“ | Mehr als eine Gruppe von Zielen, und die zweite Gruppe hat mindestens 3 drehbare Elemente. Ein gemeinsames Mischziel verbindet Gruppen. |
| Knäuel | alle Grade | Benachbarte drehbare Elemente > 1,30. Oder der Anteil kurzer Strahlabschnitte > 0,85, gezählt nur bei Leveln mit mindestens 12 Abschnitten. |

Behobene Fehler aus der Analyse: Ein gemeinsames Mischziel verbindet bei Zerfall und Zusammenspiel. Die Aufteilung nach
Quellen vergleicht alle Quellen und nicht nur die ersten beiden. Die Scheinmischung wird vollständig erkannt.

**Schwierigkeitsgrade**
- Die Grade folgen festen Schwellen auf der Schwierigkeit, festgelegt in Ticket 15 (`tools/beurteilung/grad.mjs`):
  mittel ab 43, schwer ab 58,5, sehr schwer ab 87. Danach sind es 30 / 74 / 34 / 12 der 150 Level.
- Ausgangspunkt war die vorläufige Aufteilung nach der heutigen Reihenfolge: leicht 1–30, mittel 31–100, schwer
  101–140, sehr schwer 141–150. Je Grenze liegt die Schwelle in der breitesten Lücke zwischen zwei benachbarten Werten
  höchstens 5 Plätze von der vorläufigen Grenze, in ihrer Mitte, auf halbe Punkte gerundet.
- Entlang der Reihenfolge sinkt der Grad nie. Ein Level, das nicht auf dem Platz der Formel steht (Prüfliste), bekommt
  den Grad seines Abschnitts der Reihenfolge (siehe „Levelliste, Reihenfolge und Austausch“). Das Tutorial hat keinen
  Grad.

### KI-Tester (ADR 0002)

- **Zwei Tester** urteilen unabhängig voneinander.
- **Eingabe:** das Feld als Text und Screenshots der Startstellung auf Desktop und Handy, dazu je zwei feste Anker pro
  Schwierigkeitsgrad aus der Reihenfolge im Spiel (Ablauf 1 der KI-Tester: aus der heutigen Reihenfolge).
- **Ausgabe in festen JSON-Feldern:**
  - Aha-Moment ja oder nein, mit Beschreibung
  - Lesbarkeit
  - Gefühl (Spass) von 1 bis 5
  - Einordnung zwischen den Ankern
  - Ablehnung mit einem Glossarbegriff
- **Grenzen:** Ein Level darf höchstens um 5 Plätze verschoben werden und nie über eine Gradgrenze. Ablehnen nur, wenn
  beide ablehnen.
- **Wann:** bei jedem neuen Level, nachdem die Formel es eingeordnet hat, und bei heutigen Leveln, wenn Formel und
  heutige Reihenfolge um mehr als 10 Plätze auseinanderliegen. Kleinere Abweichungen entscheidet die Formel.
- **Protokoll:** Jedes Urteil und jede Korrektur steht mit Begründung in einer versionierten Datei. An ihr werden die
  Gewichte nachgeeicht.

### Levelliste, Reihenfolge und Austausch

- Nach dem unveränderten Tutorial folgen 150 Level. Die Anzahl bleibt später änderbar.
- Die Reihenfolge folgt der neuen Schwierigkeit, korrigiert durch das Protokoll der KI-Tester. Sie ersetzt die bis
  Ticket 15 von Hand gepflegte Auswahlliste. `tools/ordne-level.mjs` rechnet sie und schreibt sie in die Leveldaten:
  - Gerechnet wird von der heutigen Reihenfolge aus, einer festen Namensliste
    (`tools/beurteilung/heutige-reihenfolge.json`). Sie bleibt der Massstab der Eichung (ADR 0001).
  - Bei gleicher Schwierigkeit gilt die heutige Reihenfolge. Verschiebungen bis 10 Plätze werden übernommen.
  - Ein Level, das nach der Formel weiter wandern würde, bleibt an seinem heutigen Platz und steht auf der Prüfliste
    der KI-Tester (Ticket 16; 51 Level). Die übrigen füllen die freien Plätze nach der Schwierigkeit; wanderte
    eines dabei weiter als 10 Plätze, bleibt es ebenso stehen (vor Ticket 16: 56 Strahlenkranz, danach 34 Funkenflug
    und 40 Geflecht).
  - Ein Level der Prüfliste kommt auf den Platz der Formel, wenn beide KI-Tester zustimmen; dazu kommen ihre eigenen
    Korrekturen und die Häufungsregel (siehe „Weitere Hinweise“, Ticket 16). Nach Ticket 16 stehen 28 der 51 nach der
    Formel. Diese Entscheide bleiben fest, auch wenn ein Austausch die Formel verschiebt (Entscheid des Nutzers vom
    19.10.2026, Ticket 26).
- Jedes Level nach dem Tutorial trägt in den Leveldaten seinen Schwierigkeitsgrad mit einem der vier Wörter, im Feld
  `grad`. Es ersetzt die frühere Markierung `difficulty`, die nur „schwer“ und „sehr schwer“ kannte. Bis Ticket 17
  zeigt das Spiel nur diese beiden an.
- **Duldungsliste** (`tools/levelliste.json`, versioniert; Entscheid des Nutzers vom 16.10.2026): Diese Level
  verletzen eine Regel der Levelliste und bleiben geduldet, bis sie ersetzt sind oder über sie entschieden ist. Sie ist
  nach Grund getrennt, mit dem Grad der neuen Reihenfolge (Ticket 15):
  - Ausschlussgrund: 37 Level, genau die der Neuzählung (leicht 6, mittel 10, schwer 14, sehr schwer 7);
  - ab „mittel“ ohne nötige Kernidee: 57 Level (mittel 50, schwer 7);
  - ab „mittel“ unter dem Mindest-Spielwert: 55 Level (mittel 45, schwer 9, sehr schwer 1);
  - zusammen 89 Level, davon 52 ohne Ausschlussgrund.

  Nach Ticket 16 (neue Reihenfolge, Grund `abgelehnt`, Entscheide vom 17.10.2026):
  - Ausschlussgrund: 37 Level (leicht 6, mittel 11, schwer 13, sehr schwer 7);
  - ab „mittel“ ohne nötige Kernidee: 58 Level (mittel 51, schwer 7);
  - ab „mittel“ unter dem Mindest-Spielwert: 56 Level (mittel 46, schwer 9, sehr schwer 1);
  - von beiden KI-Testern abgelehnt: 7 Level (mittel 6, sehr schwer 1);
  - zusammen 90 Level (leicht 6 von 31, mittel 57 von 74, schwer 19 von 32, sehr schwer 8 von 13), davon 50 ohne
    Ausschlussgrund und ohne Ablehnung.

  Nach Ticket 23 (Austausch „leicht“, 18.10.2026): Ausschlussgrund 31 Level (leicht 0), zusammen 84 (leicht 0 von 31);
  die übrigen Gründe unverändert.

  Nach Ticket 26 (Austausch „sehr schwer“, 19.10.2026): Ausschlussgrund 24 Level (sehr schwer 0), unter dem
  Mindest-Spielwert 55 (sehr schwer 0), von beiden KI-Testern abgelehnt 6 (sehr schwer 0), ohne nötige Kernidee
  unverändert 58; zusammen 76 (leicht 0 von 31, mittel 57 von 74, schwer 19 von 32, sehr schwer 0 von 13).

  Die Liste darf in jedem Grund nur kürzer werden; die Datei hält dafür auch die ursprüngliche Liste fest, dazu die
  Prüfliste für Ticket 16 (erledigt) und die Namen entfernter Level. Einmal, in Ticket 16, wuchs die ursprüngliche
  Liste um begründete Ergänzungen, die die Datei einzeln festhält. Phase 6 ersetzt zuerst die Level mit
  Ausschlussgrund und die abgelehnten. Über die übrigen, die nur wegen Kernidee oder Spielwert auf der Liste stehen,
  wird je Grad nach Ticket 16 entschieden, mit den Urteilen der KI-Tester.
- Der Austausch geschieht je Grad in einem Durchgang. Die Formel ordnet jedes Ersatzlevel ein, die KI-Tester prüfen.
  Die Namen im bisherigen Stil werden vorgeschlagen und vom Nutzer genehmigt. Umsetzung (Ticket 23, vom Koordinator
  bestätigt am 18.10.2026): Ein neues Level hat keinen heutigen Platz und steht nach der Formel. Die KI-Tester
  beurteilen es in einem Lauf `ersatz-…` unter dem Namen „Kandidat <Abdruck seiner Leveldaten>“, bevor sein Name
  genehmigt ist; über diesen Namen findet die Levelliste ihr Urteil. Ihre Korrektur rechnet wie am Platz der Formel,
  höchstens 5 Plätze und nie über eine Gradgrenze. Lehnen beide ab, kommt das Level nicht ins Spiel, sondern ein neuer
  Kandidat. Die entfernten Level bleiben mit ihren Leveldaten als feste Kopie Teil des Massstabs der Eichung (ADR
  0001); neue Level kommen nicht in die Eichmenge des Spielwerts.
- **Entfernte Level verschwinden für alle Spieler samt Namen.** Der Fortschritt ist nach Namen gespeichert, unbekannte
  Namen verwirft das Spiel beim Laden. Dafür ist kein Umbau nötig. Die Namen entfernter Level kommen auf eine Liste und
  werden nie wieder vergeben, sonst gälte ein neues Level bei alten Speicherständen als gelöst.

### Anzeige der Grade

- **Kachel in der Levelauswahl:** Punkte 1–4 (●○○○ bis ●●●●). Sie lassen sich ohne Farbsehen lesen und passen zur
  heutigen Zeichensprache.
- **Kopfzeile des Levels:** der Grad als Text.
- **Seitentitel der Levelauswahl:** der Grad als Text, wie heute bei der Markierung, wenn die ganze Seite denselben Grad
  hat.
- Für die Grade gibt es keine eigenen Farben, weil Rot, Grün und Blau im Spiel Lichtfarben sind.
- Das Tutorial hat keinen Grad.

### Generator (ADR 0004)

- **Ein einziger Ablauf für alle Grade:** zuerst eine Kernidee gezielt einbauen, dann schrittweise verfeinern, bis die
  gewünschte Schwierigkeit erreicht ist. Bei „leicht“ braucht es wenige oder keine Schritte. Ausschlüsse und Spielwert
  gelten in jedem Schritt.
- **Ein Einstieg:** Der Auftrag (Grad, Kernidee, Seed, Feldform) liefert ein Level oder nichts.
- **Eigenschaften:** deterministisch über den Seed, genau eine Lösung, die Beurteilung bestanden.
- **Keine wirkungslosen Elemente:** Er setzt keinen Filter, dessen Strahl schon die Filterfarbe hat, und keinen
  festen Spiegel, der weder für die Lösung zählt noch als Lockvogel wirkt. Das ist eine Regel des Generators und kein
  Ausschlussgrund der Beurteilung.
- **Er ersetzt** den heutigen Generator, das Härten und die Profile (Grössenstufe × Mischung). Kuratieren und Pools
  benutzen die Beurteilung.
- **Lehren aus der Messung der Effizienz:**
  - Günstige, exakte Prüfungen laufen zuerst. Das sparte in der Messung 68 % bzw. 97 % der Zeit.
  - Reparaturen ab der dritten bringen kaum etwas: 38 % der Zeit für zwei Level. Sie werden begrenzt.
  - Ein Kandidat mit zu wenigen Klicks bekommt eine neue Startstellung, statt verworfen zu werden.
  - Budgets müssen die verlangten Untergrenzen erreichen können. Ein heutiges Profil kann deshalb nie ein Level
    liefern.
- **Rechnerlast:** Er läuft nur über die gedeckelte Umgebung mit höchstens 50 % CPU. Mehrere Prozesse laufen innerhalb
  dieses Deckels und nie mehrere Läufe nebeneinander. Er darf dafür länger dauern.

### Effizienz

- **Mass:** angenommene Level je CPU-Stunde, getrennt nach Grad, mit festen Seeds und unter dem Deckel von 50 %.
- **Messskript** statt Test, weil das Ergebnis vom Rechner abhängt.
- **Ausgangszahlen** in Phase 1 mit dem heutigen Generator. Sobald die Beurteilung steht, wird zusätzlich mit ihr als
  Abnahme gemessen.
- Daneben werden die Laufzeit der Strahlregel je Aufruf und die des Lösers über alle Level gemessen.

### Würfel (Branch `feature/3d-wuerfel`)

- Die Würfel-Logik und die Würfel-Level bleiben auf dem Branch und werden dort weiterentwickelt. Auf main kommen nur
  der Golden-Test (er deckt nur flache Level ab) und die Feldform.
- Nach Phase 2 und nach Phase 5 wird main in den Branch übernommen. Dort laufen die Tests der Beurteilung und des
  Generators zusätzlich mit Würfel-Leveln.
- **Vor der Rückkehr nach main** wird auf dem Branch ein einziger Pfad gebaut: Ein flaches Level ist ein Würfel mit
  einer Ebene. Der flache Fall darf dadurch nicht langsamer werden; heute ist der Würfel-Pfad etwa 1,3-mal langsamer.
  Gemessen gibt es heute keinen Unterschied im Verhalten: 159 Level und 3180 Zufallsstellungen, nur Rundungsreste bis
  1,8e-15.

## Entscheide zu den Tests

**Was ein guter Test ist:** Er prüft nur äusseres Verhalten an einer Nahtstelle: Level hinein, Ergebnis heraus. Er kennt
keine inneren Hilfsfunktionen, Gewichte oder Zwischenstände. Ein Umbau hinter der Nahtstelle lässt die Tests grün, eine
Änderung im Verhalten macht sie rot.

**Die vier Nahtstellen**

1. **Strahlregel** (besteht: Feld anlegen und Strahlen verfolgen)
   - Der **Golden-Test** hält für alle flachen Level (Tutorial und 150) die Strahlbilder in Start- und Lösungsstellung
     fest, dazu die Ergebnisse des Lösers. Das Verhalten muss exakt gleich bleiben, Kommazahlen dürfen um höchstens
     1e-9 abweichen. Er kommt vom Würfel-Branch und läuft dort schon gegen main.
   - Die bestehenden Einzeltests der Strahlregel und der Vergleich des Lösers mit stumpfem Durchprobieren bleiben.
2. **Beurteilung** (neu, ein Einstieg)
   - Kleine handgebaute Level, je eines für jeden Ausschlussgrund, jede Kernidee, das Mischziel (auch Weiss aus weisser
     Quelle) und jeden bekannten Grenzfall: Knäuel genau bei 1,30, Raten genau bei 6 und 38, Füllteil in einem leichten
     Level, Scheinmischung nach Strahlen gegen nach Quellen, Zerfall mit zweiter Gruppe aus 2 Elementen.
   - **Eichprüfung an den 150:** Rangkorrelation gekreuzt, jede Hälfte mit den Gewichten aus der anderen, auf zwei
     Stellen gerundet mindestens 0,85 über alle Level und mindestens 0,3 je 30er-Bereich.
   - Das Spielermodell wird nur über die Beurteilung getestet.
3. **Levelliste** (besteht: die Level im Spiel). Sie ersetzt die heutigen Tests zu Markierung, gehärteten Leveln,
   Härte-Abnahme und Auswahlliste:
   - Jedes Level nach dem Tutorial hat einen Grad, und der Grad sinkt nie. Er folgt den Schwellen; ein Level am
     heutigen Platz hat den Grad seines Abschnitts.
   - Die Reihenfolge ist die der Formel, und die Prüfliste stimmt (bis Ticket 16 ohne Korrekturen der KI-Tester; seit
     Ticket 16 mit ihren Urteilen und der Häufungsregel, und jedes Level der Prüfliste hat ein zählendes Urteil).
   - Das Mittel der Schwierigkeit je 10 Level steigt; es darf um höchstens 1 Punkt fallen.
   - Kein Level hat einen Ausschlussgrund, ausser es steht auf der Duldungsliste. Die Liste wird nur kürzer.
   - Ab „mittel“ hat jedes Level eine nötige Kernidee, und jedes liegt über dem Mindest-Spielwert, ausser es steht mit
     diesem Grund auf der Duldungsliste.
   - Dieselbe Haupt-Kernidee kommt höchstens zweimal je 10 Level vor, gezählt ohne die Level der Duldungsliste.
   - Die Namen sind eindeutig, und kein Name von der Liste entfernter Level kommt vor.
   - Jede Verschiebung durch die KI-Tester steht mit Begründung im Protokoll, ist höchstens 5 Plätze gross und
     überschreitet keine Gradgrenze.
   - Die Eindeutigkeit der Lösung wird geprüft wie heute.
4. **Generator** (neu, ein Einstieg)
   - Gleicher Auftrag mit gleichem Seed ergibt dasselbe Level.
   - Jedes gelieferte Level hat genau eine Lösung, besteht die Beurteilung und hat den verlangten Grad und die
     verlangte Kernidee.

**Ohne eigene Nahtstelle**
- **Würfel:** Auf dem Branch laufen die Tests der Nahtstellen 2 und 4 zusätzlich mit Würfel-Leveln.
- **Anzeige der Grade:** Die Daten prüft die Levelliste. Die Darstellung auf Kachel, Kopfzeile und Seitentitel wird mit
  den bestehenden Screenshot-Proben geprüft, auf Desktop und Handy.

**Vorbilder im Code**
- Die Logiktests mit kleinen, von Hand gebauten Feldern und der Vergleich des Lösers mit dem Durchprobieren.
- Die bestehenden Tests der Levelliste (Namen, steigendes Mittel je 10 Level, Markierung).
- Der Golden-Test auf dem Würfel-Branch.
- Die Screenshot-Proben für die Darstellung.

## Nicht Teil dieser Spec

- Würfel-Level im Spiel, die Würfel-Logik auf main und die Spielregeln für den Würfel. Sie bleiben auf dem Branch.
- Neue Mechaniken wie verschiebbare Elemente, Strahlteiler, Portale, Schalter oder Linsen.
- Mehr als 150 Level. Die Anzahl bleibt nur änderbar.
- Änderungen am Tutorial.
- Spieldaten aus dem Browser, Messungen bei Spielern oder Telemetrie.
- Eine 3D-Karte für die Levelauswahl, der Play Store und die Grafik.
- Menschliche Spieltests als Teil der Werkzeuge. Der Nutzer spielt selbst, das bleibt ausserhalb.

## Weitere Hinweise

- **Rechnerlast:** Rechenintensives läuft nur über die gedeckelte Umgebung (`leise.sh`). Der Generator darf bis 50 % CPU
  nutzen, alles andere bis 20 %. Nie mehrere schwere Läufe parallel.
- **Zahlen aus der Analyse** (Oktober 2026), als Ausgangslage:
  - Die alte Formel entspricht etwa 4,61 × drehbare Elemente.
  - Der heutige Test auf steigende Mittel hat nur 0,02 Reserve.
  - Die KI-Tester waren sich bisher zu 0,02–0,27 einig.
- **Die vier Favoriten aus Review 6**, die auf der Duldungsliste stehen (143, 146, 147, 149), wurden bewusst nicht als
  Ausnahme behandelt. Bei 149 Zenit gilt die wörtliche Lesart von Scheinmischung (b). Das ersetzt den Hinweis in
  PLAN 3.5, Kombinator → Prisma sei wie bei Zenit zulässig.
- **Grenzfälle der Neuzählung**, in Phase 3 mit der fertigen Beurteilung neu geprüft (Ticket 15: Beim Knäuel bestehen
  122, 150, 85, 99 und 109, 38 fällt wegen Scheinmischung; wegen Zerfall fällt keines; bei Scheinmischung (b) bestehen
  alle):
  - Knäuel: 122 und 150 genau bei 1,30, dazu 38, 85, 99 und 109 bei 1,29.
  - Zerfall mit zweiter Gruppe aus 2 Elementen: 36, 37, 43, 80, 101.
  - Scheinmischung (b) nicht direkt oder mit zerlegter Mischung über die Eingänge hinaus: 76, 100, 117, 118.
- Spec und Tickets liegen in `.scratch/levelgenerator/`. PLAN.md bekommt bei 2.5–2.7 und 3.1–3.5 einen Verweis hierher.
- **Auslegungen bei der Umsetzung, vom Nutzer am 16.10.2026 bestätigt** (vorläufig; beim Eichen in Phase 3 mit Zahlen
  neu ansehen):
  - Raten bei fester Zellenfolge: kInf > 6 oder Kette > 38 (Ticket 09, siehe Tabelle der Ausschlussgründe).
  - Knäuel: Werte auf zwei Stellen gerundet wie in der Neuzählung, also wirksame Grenzen 1,305 und 0,855 (Ticket 07).
  - Ohne vorgegebenen Grad gelten Füllteil und Zerfall wie ab „mittel“, ausser bei einem ausdrücklich leichten Level
    (Ticket 08). Gilt, bis Ticket 15 die Grade festlegt.
  - Zerfall: Ein gemeinsames Mischziel verbindet Gruppen wie in der Spec, auch wenn sich die Teile einzeln lösen lassen
    (Ticket 08); in Phase 3 neu ansehen.
  - Mischziel aus zwei Quellen: „keine einzelne Quelle liefert die Farbe“ gilt in der Lösung (Ticket 10).
  - Abschalten zählt nur Licht in der Farbe des Ziels, also ein schon leuchtendes Ziel (Ticket 10).
  - „Naheliegend“ heisst vorläufig: höchstens 3 drehbare Elemente (Ticket 10); später mit dem Spielermodell eichen.
  - Farben abzählen ist nur nötig, wenn sich ein Verlust an keinem einzelnen Ziel zeigt; das braucht mindestens drei
    Quellen (Ticket 10).
  - Falle und Abschalten gehen vom selben naheliegenden Zwischenstand aus: Nimmt die Lösung dem Ziel dessen Licht weg,
    ist es Abschalten; bringt sie dasselbe Licht derselben Quelle auf einem längeren Weg hin, ist es eine Falle. Für
    einen Zwischenstand gilt nie beides (Ticket 11).
  - Holzweg heisst weite Fast-Lösung: Alle Ziele bis auf eines leuchten, und mindestens 3 drehbare Elemente stehen
    anders als in der Lösung (Ticket 11).
  - Eine Falle ist nur nötig, wenn ein Holzweg sie enthält und das Spielermodell mit Horizont 2 sie nicht auf den ersten
    Blick widerlegt (Ticket 11).
  - Ein Lockvogel ist nur nötig, wenn das Level ohne ihn (ein weisser Filter an seiner Stelle) eine zweite Lösung hätte
    und er in mindestens 10 % der Holzwege Licht bekommt, mindestens in einem. Ein Blocker, der nur eine zweite Lösung
    verhindert, zählt nicht (Ticket 11).
  - Haupt-Kernidee: unter den nötigen Kernideen die erste nach der festen Rangfolge Falle, Abschalten, Farben abzählen,
    Sammelstelle, Lockvogel, Mischziel aus zwei Quellen; ohne nötige Kernidee keine. Gilt, bis Ticket 13 oder 16 sie
    eicht (Ticket 11).
  - Vor dem nächsten Lauf der KI-Tester das Glossar schärfen (neue Version des Ablaufs): bei Füllteil „… den ein anderer
    Strahl an einem seiner Spiegel trifft“, bei Abschalten „Licht in der Farbe des Ziels“, bei Falle und Abschalten die
    Abgrenzung: Die Falle bringt dasselbe Licht auf einem anderen Weg ans Ziel, das Abschalten nimmt es dem Ziel weg.
    Erledigt mit Ablauf 2 (Ticket 16).
  - Der Mindest-Spielwert gilt erst ab „mittel“; leichte Level sind Einstieg und brauchen weder Kernidee noch
    Mindest-Spielwert (Ticket 13). Bei 60 lägen sonst 25 der 30 leichten Level darunter.
  - „Schliessen und eine nötige Kernidee tragen etwa zwei Drittel“ gilt für die Punkte eines Levels, nicht nur für die
    Gewichte: Volles Schliessen und eine nötige Kernidee ergeben ohne Bonus gut 60 Punkte, darum zählt die erste
    Kernidee 0,8, und der Mindest-Spielwert liegt bei 60 (Ticket 13).
  - Schwierigkeit (Entscheide des Nutzers vom 16.10.2026, Ticket 12):
    - Die Abnahme ist gekreuzt: an den geraden Plätzen eichen und die ungeraden vorhersagen, dann umgekehrt; über alle
      mindestens 0,85, je 30er-Bereich über alle 30 Level mindestens 0,3. Vorher galt 0,5 je Bereich an den 15 nicht
      geeichten Leveln; das erreichte keine Formel.
    - Die Rangkorrelation wird auf zwei Stellen gerundet, wie beim Knäuel. 91–120 liegt bei 0,296, gerundet 0,30, und
      ist damit erreicht; der Abstand zur Schwelle ist knapp.
    - Dazu die Teilwerte Zusammenspiel (wie im Spielwert) und Weglänge. Die Weglänge trägt im Mittel höchstens ein
      Viertel und bei keinem Level mehr als ein Drittel, die Denkarbeit (Spielermodell, Farblogik, Kernideen) im
      Mittel mindestens die Hälfte; das hält die Eichung ein.
  - Levelliste, Reihenfolge und Grade (Entscheide des Nutzers vom 16.10.2026, Ticket 15):
    - Die Duldungsliste hat 89 Level, nach Grund getrennt: Ausschlussgrund (37), ab „mittel“ ohne nötige Kernidee
      (57), ab „mittel“ unter dem Mindest-Spielwert (55). Die Tests gelten sofort, die Erkennung der Kernideen bleibt
      unverändert. Phase 6 ersetzt zuerst die 37 mit Ausschlussgrund; über die 52 übrigen wird je Grad nach Ticket 16
      entschieden, mit den Urteilen der KI-Tester. Das Glossar wird wie geplant vor Ticket 16 geschärft.
    - Eine erweiterte Erkennung (Abschalten mit jedem falschen Licht, Falle ohne erfülltes Ziel, Farben abzählen auch
      bei einem Verlust, der sich Ziel für Ziel zeigt) verkürzte die Liste höchstens auf 56. Sie zählte, was das
      Spielermodell auf den ersten Blick widerlegt, und kippte die Abnahme der Schwierigkeit (31–60) bzw. des
      Spielwerts (Ticket 15, Stufe A).
    - Schwellen der Grade: mittel ab 43, schwer ab 58,5, sehr schwer ab 87, je in der breitesten Lücke höchstens 5
      Plätze von der vorläufigen Grenze. Ein Level am heutigen Platz bekommt den Grad seines Abschnitts.
    - „Dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ zählt nur Level ausserhalb der Duldungsliste: Jede der
      vier Verletzungen in der neuen Reihenfolge hat ein Level der Duldungsliste in ihrer Gruppe.
    - Das Mittel der Schwierigkeit je 10 Level darf um höchstens 1 Punkt fallen. Ohne Toleranz fiele es einmal um
      0,68 (von 41–50 nach 51–60), weil Level der Prüfliste an ihrem heutigen Platz bleiben.
    - „Je 10 Level“ heisst je Seite der Levelauswahl, in festen Gruppen 1–10, 11–20 …
    - Die heutige Reihenfolge bleibt als feste Namensliste der Massstab der Eichung. Ablauf 1 der KI-Tester rechnete
      mit ihren Plätzen und den vorläufigen Graden; Ablauf 2 (Ticket 16, mit dem geschärften Glossar und neuen Ankern)
      rechnet mit den Plätzen der Reihenfolge im Spiel und den Graden der Leveldaten.
  - KI-Tester und Levelliste (Entscheide des Nutzers bzw. des Koordinators vom 17.10.2026, Ticket 16; Regeln in
    `tools/levelliste.mjs`):
    - Für die Levelliste zählen nur die Läufe `pruefung-…` von Ablauf 2, keine Probe- oder Eichläufe; jedes Level der
      Prüfliste hat genau ein zählendes Urteil, damit ist die Prüfliste erledigt.
    - Ein Level der Prüfliste kommt nur auf den Platz der Formel, wenn beide KI-Tester zustimmen: Der Platz der Formel
      liegt für beide in ihrem Bereich der Einordnung oder näher daran als der alte Platz. Sonst bleibt es am alten
      Platz. Liegt der neue Platz innerhalb des Bereichs zwischen zwei Ankern, gilt also die Formel; die Einordnung
      bleibt bei zwei Ankern pro Grad.
    - Die Entscheide aus Ticket 16 bleiben fest, auch wenn ein Austausch die Formel verschiebt (Entscheid des Nutzers
      vom 19.10.2026, Ticket 26): An dem Platz der Formel beim Entscheid, den `tools/levelliste.json` festhält
      (`prueflisteFormel`), misst sich, ob das Level auf der Prüfliste steht, und mit ihm rechnet die Zustimmung; wohin
      ein Level mit Zustimmung kommt, folgt der Formel von heute. Ein Level, das erst durch einen Austausch weiter als
      10 Plätze wandern würde, kommt neu auf die Prüfliste und braucht ein Urteil; danach kommt sein Platz der Formel
      dazu (nach dem Review von Ticket 26). Anlass: Ohne Spiegelkabinett (Formel 131) rückte Zwielicht in der Formel von 137 auf 136, und KI-Tester A
      hätte zugestimmt. Zwielicht wäre von 122 auf 136 gesprungen, 13 schwere Level wären einen Platz vorgerückt, und
      auf 131–140 hätte dreimal Farben abzählen gestanden, was die Häufungsregel mit einem Zug nicht auflöst. Zwielicht
      bleibt auf 122.
    - Von dort, wo es steht, gilt die eigene Korrektur der KI-Tester nach der Regel von `merge`: am alten Platz das
      Ergebnis aus dem Protokoll, am Platz der Formel dieselbe Regel mit dem Grad dort; höchstens 5 Plätze, nie über
      eine Gradgrenze.
    - Lehnen beide ab (beim Grad dort, wo das Level steht), wird es nicht korrigiert und kommt auf die Duldungsliste,
      Grund „von beiden KI-Testern abgelehnt“.
    - Kommt ein Level durch ein Urteil der KI-Tester in einen Grad, in dem es eine Regel verletzt, darf es jetzt auf
      die Duldungsliste, als einmalige Ausnahme in Ticket 16, dem letzten Zeitpunkt, an dem die Liste wachsen darf
      (17 Weichen und 32 Streulicht, „mittel“ ohne nötige Kernidee und unter dem Mindest-Spielwert). Über sie wird mit
      den übrigen Leveln ohne Ausschlussgrund entschieden. Jede Ergänzung der ursprünglichen Liste ist im Test durch
      das Protokoll begründet.
    - Häufungsregel: Kommt dieselbe Haupt-Kernidee auf einer Seite zu 10 Leveln öfter als zweimal vor, gezählt
      ausserhalb der Duldungsliste, rückt ein Level innerhalb seines Grads um höchstens 3 Plätze, so wenig wie nötig.
      Wahl der Züge: (1) zuerst Züge der betroffenen Level; (2) lässt sich die Häufung so nicht auflösen, Züge anderer
      Level derselben oder einer Nachbarseite, dabei ein Level der Duldungsliste vor einem anderen; (3) dann der
      kürzeste Zug, der spätere Platz, nach hinten. Kein Zug schafft eine neue Häufung oder bricht die übrigen Regeln
      (Grad, Mittel je 10 Level, Korrekturen der KI-Tester). In Ticket 16: 102 Chamäleon → 100 (die Häufung „Mischziel
      aus zwei Quellen“ auf 91–100 liess sich mit den betroffenen Leveln nicht auflösen) und 131 Spiegelsaal → 130.
    - Eine Abweichung vom Platz der Formel ist nur durch das Protokoll der KI-Tester oder durch die Häufungsregel
      erlaubt.
    - Übereinstimmung des Spielwerts mit dem Spass der Eichmenge (Entscheid des Nutzers vom 17.10.2026): mindestens
      0,26 ohne Ausschlussgrund und 0,25 über alle, auf zwei Stellen gerundet; vorher 0,30 / 0,27 (Ticket 13). Mit den
      51 Urteilen der Prüfläufe in der Eichmenge sind es gemessen 0,28 (98 Level) und 0,27 (149); innerhalb der Spec
      (erste Kernidee 0,8) hebt auch eine neue Eichung von „weitere“ den Wert nicht über 0,28. Je Grad ohne
      Ausschlussgrund: leicht 0,05, mittel 0,35, schwer 0,14, sehr schwer 0,70. Festgehaltene Schwäche: In „mittel“
      übersieht der Spielwert Kernideen, die die KI-Tester sehen. Von 44 Leveln in „mittel“ mit Urteil und ohne
      Ausschlussgrund haben 29 keine erkannte Kernidee; bei 27 davon sehen beide KI-Tester einen Aha-Moment, 19 haben
      ein Gefühl von mindestens 4. Vor dem Entscheid über die Level ohne Ausschlussgrund auf der Duldungsliste wird
      der Spielwert in „mittel“ angesehen, also die Erkennung der Kernideen oder das Modell.
