# Auftrag an KI-Tester {{TESTER}} (Lauf {{LAUF}}, Ablauf {{VERSION}})

Du bist KI-Tester für PRISMA, ein Lichtstrahl-Puzzle, hier in der Spielart „Würfel“: Das Feld ist kein flaches Raster,
sondern ein Würfel aus Ebenen. Du beurteilst Level aus der Sicht eines Spielers: Lässt sich der Würfel gut lesen? Gibt
es einen Aha-Moment? Macht das Level Spass? Wie schwer ist es im Vergleich zu festen Ankern? Ein zweiter KI-Tester
beurteilt dieselben Level unabhängig von dir. Deine Urteile korrigieren die Reihenfolge der Level nur eng; entschieden
wird nach festen Regeln.

## Regeln für dich

- Du bist Spieler, nicht Entwickler. Lies nur die Dateien im Ordner `{{EINGABE}}`: die Texte und die Bilder. Öffne
  keinen Code, keine Lösungen, keine anderen Dateien des Projekts und nichts vom anderen KI-Tester. Führe keine
  Programme aus und rechne keine Lösung mit Werkzeugen nach.
- Löse jedes Level im Kopf, wie ein Spieler vor dem Bildschirm: hinschauen, folgern, wo es geht, und probeweise drehen,
  wo nötig. Merke dir, wo du hängen bleibst.
- Schreibe auf Deutsch in Schweizer Schreibweise (ss statt ß), knapp und konkret.
- Deine einzige Ausgabe ist die Datei `{{AUSGABE}}` (siehe „Antwort“). Schreibe sonst nichts ins Projekt.

## Das Spiel im Würfel

- Das Feld ist ein Würfel aus 7 × 7 × 7 Zellen auf einer Plattform, von schräg oben gesehen. Jede Zelle hat drei
  Koordinaten (x,y,z): x von links nach rechts (West → Ost), y die Ebene von unten nach oben (Ebene 0 liegt auf der
  Plattform, Ebene 6 oben), z von hinten nach vorne (Nord → Süd). Der Text jedes Levels erklärt sie noch einmal.
- Licht läuft von Zelle zu Zelle in 18 Richtungen: in den acht Richtungen einer Ebene (waagrecht, senkrecht im Raster
  und diagonal), gerade nach oben oder unten, und schräg zwischen den Ebenen, je Schritt eine Zelle nach Ost, West,
  Nord oder Süd und eine Ebene höher oder tiefer (etwa „nach Ost und oben“). Raumdiagonalen gibt es nicht. Strahlen
  kreuzen sich in leeren Zellen, ohne sich zu stören.
- Licht, das unten aus dem Würfel läuft, endet auf der Plattform. Licht, das seitlich oder oben hinausläuft, verlässt
  den Würfel.
- **Drehachse:** Spiegel, Prismen, Kombinatoren und Quellen haben eine feste Achse: y (senkrecht), x (West–Ost) oder z
  (Nord–Süd). Ein Element dreht in der Ebene senkrecht zu seiner Achse, der Drehebene, und wirkt dort wie im flachen
  Spiel. Mit Achse y ist das die waagrechte Ebene wie im flachen Spiel; mit Achse x oder z steht die Drehebene
  senkrecht, und das Element lenkt Licht zwischen die Ebenen. Im Bild zeigen Zapfen am Ring die Achse.
- **Quelle:** sendet einen Strahl ihrer Farbe in ihre Richtung. Licht, das eine Quelle trifft, wird geschluckt.
- **Spiegel:** beidseitig verspiegelt, die Fläche enthält seine Achse. Er lenkt den Anteil des Lichts in seiner
  Drehebene um wie ein flacher Spiegel; der Anteil längs der Achse bleibt. Läuft das Licht genau längs der Fläche,
  trifft es die Kante und wird geschluckt. Ein Spiegel hat vier wirksame Stellungen (um 180° gedreht wirkt er gleich).
- **Prisma:** zeigt mit seinem Farbfächer in eine von acht Richtungen seiner Drehebene. Weisses Licht zerfällt: Grün
  läuft in Fächerrichtung, Rot und Blau je 45° daneben in der Drehebene (der Text nennt bei jedem Prisma alle drei
  Richtungen). Eine Mischfarbe zerfällt in ihre Grundfarben, eine Grundfarbe wird nur auf ihre Bahn umgelenkt. Licht,
  das schräg zur Drehebene läuft oder um mehr als 90° vom Fächer abweicht (es trifft das Prisma von hinten), wird
  geschluckt.
- **Filter:** lässt nur seine Grundfarben durch (ein gelber Filter Rot und Grün). Bleibt nichts übrig, endet das Licht.
- **Kombinator:** mischt alle Strahlen, die ihn aus beliebiger Richtung treffen, und sendet die Mischung in seine
  Ausgangsrichtung in der Drehebene. Weiss und Rot ergeben weiterhin Weiss.
- **Block:** schluckt Licht.
- **Ziel:** Alle Strahlen auf einem Ziel mischen sich. Erfüllt ist es nur, wenn die Mischung genau seine Farbe ist; eine
  zusätzliche falsche Farbe stört. Der Ring am Ziel zeigt die nötigen Grundfarben, eine falsche flackert darin.
- **Farben:** Rot + Grün = Gelb, Grün + Blau = Cyan, Rot + Blau = Magenta, alle drei = Weiss.
- **Bedienung:** Ein Klick dreht ein drehbares Element um 45° in seiner Drehebene, ein Rechtsklick zurück. Drehbar sind
  Spiegel, Prismen und Kombinatoren auf einem runden Teller mit weissem Ring; feste stehen auf einem eckigen Sockel mit
  rotem Rand. Der Spieler kann den Würfel mit der Maus oder dem Finger drehen und neigen.
- **Gelöst** ist ein Level, wenn alle Ziele zugleich erfüllt sind. Jedes Level hat genau eine Lösung.

Die Bilder zeigen die Startstellung vor dem ersten Klick: auf dem Desktop (1440 × 900) aus drei Blickwinkeln (so, wie
das Level startet; steil von oben; seitlich gedreht und flacher, wie nach Ziehen mit der Maus) und auf dem Handy
(390 × 844, doppelte Pixeldichte) so, wie das Level startet. In der Kopfzeile steht statt Nummer und Name nur die
Kennung des Levels, damit du unvoreingenommen einordnest. Der Text beschreibt dasselbe Feld genau: Ebene für Ebene,
jedes Element mit Zelle, Achse und Stellung, und das Licht in der Startstellung.

## Begriffe

Diese Begriffe aus dem Glossar des Projekts gelten für dein Urteil. Ablehnen darfst du nur mit Begriffen aus „Was Spass
verdirbt“. Eine Zeile „_Vermeiden_“ nennt, wofür ein Begriff nicht steht. Wo ein Begriff erst ab „mittel“ gilt,
wendet das die Regel an, nicht du: Nenne ihn in jedem Grad, wenn er zutrifft.

{{GLOSSAR}}

## Anker

Die Anker sind feste Würfel-Level, die festlegen, was „schwerer als“ heisst. Schau dir zuerst alle Anker an (Text und
alle Bilder) und überlege bei jedem, wie du ihn lösen würdest. Erst danach beurteilst du die Level. Alle Dateien liegen
im Ordner `{{EINGABE}}`. {{ANKERHINWEIS}}

{{ANKER}}

## Level

Beurteile diese Level in dieser Reihenfolge (Dateien wieder im Ordner `{{EINGABE}}`). Schau zuerst die Bilder an und
beurteile die Lesbarkeit, bevor du den Text liest; dann lies den Text und löse das Level im Kopf.

{{LEVEL}}

## Antwort

Schreibe eine JSON-Datei nach `{{AUSGABE}}`: eine Liste mit einem Urteil je Level, in der Reihenfolge oben, nur gültiges
JSON ohne Kommentare. Das genaue Schema steht in `{{EINGABE}}/answer.schema.json`. Die Felder:

- `level`: die Kennung aus der Liste oben, zum Beispiel `"L2"` oder `"A1"`.
- `aha`: `{ "ja": true oder false, "beschreibung": "…" }`. Gibt es einen Moment, in dem eine Einsicht (eine Kernidee aus
  dem Glossar) das Level knackt? Beschreibe die Einsicht in einem Satz, oder warum es keine gibt.
- `lesbarkeit`: `{ "desktop": 1–5, "handy": 1–5, "beschreibung": "…" }`, nach den Bildern: Erkennt man Elemente,
  Farben, Richtungen, Ebenen und Achsen und was drehbar ist? Für den Desktop zählen alle drei Blickwinkel zusammen (der
  Spieler kann den Würfel drehen), für das Handy das Bild beim Start. 1 = kaum lesbar, 3 = mit Mühe, 5 = sofort klar.
- `gefuehl`: Spass als Spieler, unabhängig von der Schwierigkeit, ganze Zahl: 1 = langweilig oder ärgerlich, 2 = eher
  mühsam, 3 = in Ordnung, 4 = macht Spass, 5 = grosser Spass.
- `einordnung`: die Schwierigkeit im Vergleich zu den Ankern, genau einer dieser Werte: {{EINORDNUNGEN}}. Dabei heisst
  `"A1-A2"`: schwerer als A1 und leichter als A2 (ebenso für jedes andere Paar benachbarter Anker), `"A1"`: etwa so
  schwer wie A1, `"<A1"`: leichter als A1, `">{{LETZTER}}"`: schwerer als {{LETZTER}}.

  Ist das Level selbst ein Anker, ist die Einordnung seine eigene Kennung (bei A1 also `"A1"`).
- `ablehnung`: eine Liste aller Begriffe aus „Was Spass verdirbt“, die klar zutreffen, also einige von `"Probieren"`,
  `"Füllteil"`, `"Scheinmischung"`, `"Zerfall"` und `"Knäuel"`; trifft keiner zu, die leere Liste `[]`. Nenne jeden
  zutreffenden Begriff, auch Füllteil und Zerfall, unabhängig davon, wie schwer du das Level einschätzt. Ob ein Begriff
  beim Grad des Levels zählt, entscheidet die Regel. Abgelehnt ist ein Level, wenn beide KI-Tester mindestens einen
  Begriff nennen, der bei seinem Grad zählt; es kommt dann nicht ins Spiel. Schwer lesbar allein ist kein Grund zur
  Ablehnung, gehört aber in `lesbarkeit`.
- `begruendung`: ein bis drei Sätze zu deinem Urteil, bei einer Ablehnung vor allem zu ihr.

Beispiel für ein Level:

```json
[
  {
    "level": "L2",
    "aha": { "ja": true, "beschreibung": "Der Spiegel mit Achse z muss das Licht nach oben heben, sonst erreicht Blau die oberste Ebene nie." },
    "lesbarkeit": { "desktop": 4, "handy": 3, "beschreibung": "Von oben klar; auf dem Handy liegen die Ebenen 2 und 3 schwer auseinander." },
    "gefuehl": 4,
    "einordnung": "A1-A2",
    "ablehnung": [],
    "begruendung": "Eine schöne Idee, danach bleibt wenig Arbeit."
  }
]
```

<!-- Zeilen
Vorlagen für die Listen „Anker“ und „Level“ oben, je „name: Text“; prepare.mjs setzt sie ein. Ab hier erscheint nichts
im Auftrag. ankerhinweis-ende: Anker mit ende (zwei je Grad), ankerhinweis-ohne: Anker ohne ende (Version W1).
ankerhinweis-ende: Es sind zwei pro Schwierigkeitsgrad, je eines am unteren und eines am oberen Ende des Grads.
ankerhinweis-ohne: Geeichte Würfel-Level gibt es noch nicht; die Anker sind die zwei handgebauten Würfel-Level des Spiels, und ihre Einordnung ist darum grob. Viele Level werden schwerer sein als der letzte Anker.
anker: - **{{ID}}**: {{GRAD}}{{ENDE}}. {{DATEIEN}}
ende-unten: , unteres Ende des Grads
ende-oben: , oberes Ende des Grads
level: {{NR}}. **{{ID}}**: {{DATEIEN}}
level-anker: {{NR}}. **{{ID}}** (der Anker selbst, Einordnung „{{ID}}“): {{DATEIEN}}
dateien: `{{ID}}.md`, `bilder/{{ID}}-desktop.png`, `bilder/{{ID}}-desktop-oben.png`, `bilder/{{ID}}-desktop-seite.png`, `bilder/{{ID}}-handy.png`
-->
