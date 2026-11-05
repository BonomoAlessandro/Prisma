# Spec: Ein Brett je Himmel

Status: ready-for-agent

PLAN 1.1 «Plattformen passend zur Skybox», eingeschränkt auf die Himmel, die es schon gibt. Die Entscheide stammen aus
dem Grilling vom 05.11.2026. Die Begriffe folgen `CONTEXT.md`, die neuen Begriffe «Brett» und «Steinbrett» trägt die
Grundlage nach (siehe «Geplanter Ablauf»).

Gearbeitet wird auf dem Branch `feature/brett-je-himmel`, abgezweigt von `main` (6f322ce), in einem eigenen
Arbeitsordner neben dem Repo. Der Merge nach `main` kommt erst am Ende, wenn alles fertig ist, und nur auf das Go des
Nutzers.

## Problem

In allen Welten schwebt dasselbe Brett: dunkler, fein geäderter Schiefer mit eingravierten Rasterlinien, einer hellen
Einlegelinie, polierten dunklen Seiten und einer Metallkante. Die Himmel aus Blender sind dagegen sorgfältig gestaltet.
Am Strand schlägt Wasser ums Brett und Fische ziehen vorbei, in der Wüste laufen Dünen aus, am Vulkan liegen Felsen in
der Lava, im Dorf stehen Noas Haus und die Nachbarhäuser. Das Brett gehört zu keiner dieser Welten und wirkt darin wie
ein Fremdkörper. Heute hängt am Brett gar nichts vom Himmel ab: Material, Licht und Spiegelung sind überall gleich.

## Lösung

Jede der fünf Welten mit einem Himmel aus Blender bekommt ein **eigenes, festes Brett**, das das Material seiner
Umgebung aufnimmt, zum Beispiel sandig am Strand. Das sind Strand, Wüste, Wald, Dorf und Vulkan. Milchstrasse und
Sonnensystem behalten das heutige Brett, das **Steinbrett**.

Das Brett wechselt mit dem Himmel. Der Spieler sieht dabei nie ein falsches oder vorläufiges Brett, denn die Geschichte
wartet wie heute mit dem Kleinen Wagen, bis Himmel und Brett da sind.

Gestaltet wird zuerst der Strand. Dafür gibt es einen Katalog mit 6 bis 8 deutlich verschiedenen Richtungen, danach 2 bis
3 Richtungen im Spiel, und der Nutzer wählt eine. Diese Richtung wird dann auf Wüste, Wald, Dorf und Vulkan übertragen,
jeweils mit 2 bis 3 Varianten zur Wahl. Am Ende hat jede Welt ein festes Brett, und es gibt keinen Schalter mehr.

## Nutzergeschichten

### Spieler

1. Als Spieler will ich am Strand ein Brett sehen, das aus dem Material des Strands gemacht scheint, damit die Welt
   Meer wie aus einem Guss wirkt.
2. Als Spieler will ich in der Wüste ein Brett sehen, das zu Sand und Dünen passt, damit es nicht wie ein Fremdkörper
   über den Dünen schwebt.
3. Als Spieler will ich im Bergwald ein Brett sehen, das zu Fichten, Moos und Waldboden passt, damit der Wald stimmig
   wirkt.
4. Als Spieler will ich «Im Dorf» ein Brett sehen, das zu Noas Dorf bei Nacht passt, damit die Übungen schon in Noas
   Welt stattfinden.
5. Als Spieler will ich am Vulkan ein Brett sehen, das zu Fels und Lava passt, damit das Brett zum Krater gehört.
6. Als Spieler will ich bei den Planeten und den Sternen das gewohnte Steinbrett sehen, weil es im Weltraum keinen Boden
   gibt, dessen Material es übernehmen könnte.
7. Als Spieler will ich, dass beim Einstieg in eine Welt das Licht auf dem Brett dieser Welt landet, damit Ankunft und
   Ort zusammenpassen.
8. Als Spieler will ich nach einer Reise, wenn der Blick aus dem Himmel aufs Brett sinkt, schon das Brett der neuen
   Welt sehen und nie das der alten oder ein Steinbrett.
9. Als Spieler will ich, dass beim Wiederholen über eine Weltgrenze das Brett zusammen mit dem Himmel und gleich lang wie
   er in das der nächsten Welt übergeht, damit der Wechsel ruhig wirkt.
10. Als Spieler will ich unter einem Himmel aus Blender nie, auch nicht kurz, das Steinbrett sehen, damit kein
    Platzhalter durchscheint.
11. Als Spieler mit langsamer Verbindung will ich, dass der Kleine Wagen wie heute wartet, bis Himmel und Brett der Welt
    bereit sind, statt dass ich ein halbfertiges Bild sehe.
12. Als Spieler, der nach dem Neuladen «Weiter» wählt, will ich gleich das Brett der Welt sehen, in der mein Stand ist.
13. Als Spieler ohne Netz (installierte App) will ich in jeder Welt dasselbe Brett sehen wie online.
14. Als Spieler will ich, dass beim Lösen eines Levels die Lichtwelle über jedes Brett läuft, weil sie zum Gefühl des
    Lösens gehört.
15. Als Spieler will ich, dass Sockel und Teller der Elemente in allen Welten gleich aussehen, damit ich immer erkenne,
    was fest und was drehbar ist.
16. Als Spieler will ich, dass Elemente und Strahlen in allen Welten gleich beleuchtet sind, damit ich mich nicht in
    jeder Welt neu einsehen muss.
17. Als Spieler auf dem Handy will ich, dass das Spiel mit den neuen Brettern so flüssig läuft wie heute (stetig 60
    Bilder pro Sekunde).
18. Als Spieler will ich, dass der Wechsel in eine neue Welt nicht ruckelt, auch nicht, weil ein Brett erst berechnet
    werden muss.
19. Als Spieler, der die App installiert, will ich nicht mehr herunterladen müssen als heute, bevor sie offline läuft.
20. Als Spieler, der ganz herauszoomt oder flach über das Brett schaut, will ich, dass Seiten und Rand des Bretts
    ebenso zur Welt passen wie die Oberfläche.
21. Als Spieler will ich, dass das 7×7-Feld überall eben und gleich gross bleibt, damit sich das Spielen nicht ändert.

### Nutzer als Gestalter

22. Als Gestalter will ich für den Strand 6 bis 8 deutlich verschiedene Richtungen als Karten auf einer Vorschauseite
    sehen, damit ich eine Richtung finde, auch wenn ich vorher selbst nicht genau weiss, was ich will.
23. Als Gestalter will ich auf jeder Karte ein echtes Spielbild vom Strand mit dem neuen Brett darauf und eine Aufsicht
    sehen, damit ich die Wirkung im Spiel beurteilen kann und nicht nur eine Idee.
24. Als Gestalter will ich zu jeder Karte die Vorbilder aus Spielen, Kunst oder Natur mit Link und eine kurze Idee
    lesen, damit ich verstehe, woher die Richtung kommt.
25. Als Gestalter will ich auf jeder Karte lesen, was sie von Rasterlinien, Einlegelinie und Spiegelung behält, damit
    ich die Lesbarkeit selbst beurteilen kann.
26. Als Gestalter will ich auf jeder Karte einen Hinweis sehen, wenn die Richtung eine Form aus Blender braucht, über
    den heutigen Umriss hinausginge oder das Brett mit dem Grund verbände, damit ich weiss, was teurer wäre.
27. Als Gestalter will ich 2 bis 3 gewählte Richtungen im Spiel umschalten können und sie als Bilder von Desktop und
    Handy bekommen, damit ich die eine Richtung im echten Spiel wähle.
28. Als Gestalter will ich für Wüste, Wald, Dorf und Vulkan je 2 bis 3 Varianten innerhalb der gewählten Richtung im
    Spiel sehen und wählen, ohne jedes Mal einen neuen grossen Katalog.
29. Als Gestalter will ich jeden Himmel abnehmen, bevor der nächste beginnt, damit Fehler der Richtung früh auffallen.
30. Als Gestalter will ich, dass am Ende jede Welt genau ein festes Brett hat, dass die nicht gewählten Varianten aus dem
    Spiel entfernt sind und dass kein Schalter übrig bleibt.
31. Als Gestalter will ich das Brett des Vulkans erst auf dem fertigen, neuen Krater gestalten, damit es nicht zu einem
    veralteten Krater passt.
32. Als Nutzer will ich am Ende gesammelt auf dem Poco testen, ob alles flüssig läuft.
33. Als Nutzer will ich, dass alles erst am Ende und nur auf mein Go nach `main` kommt.

### Entwickler und Agenten

34. Als Entwickler will ich das Brett eines Himmels in dessen Beschreibungsdatei (skybox.json) festlegen, damit die
    neuen Himmel aus 1.2 ihr Brett später am selben Ort und auf dieselbe Weise mitbringen.
35. Als Entwickler will ich, dass das Prüfwerkzeug der Skyboxen unbekannte Arten von Brettern und ungültige Werte
    ablehnt, damit ein Tippfehler nicht erst im Spiel auffällt.
36. Als Entwickler will ich, dass ein Himmel ohne Brett-Angabe das Steinbrett bekommt, damit ein neuer Himmel auch ohne
    eigenes Brett lauffähig ist.
37. Als Entwickler will ich das Steinbrett als eine Art Brett unter anderen behandeln, damit es nur einen Weg gibt, ein
    Brett zu bauen, zu zeigen und zu wechseln.
38. Als Entwickler will ich über die Testschnittstelle abfragen können, welches Brett gerade zu sehen ist und ob es
    bereit ist, damit die Proben das Verhalten prüfen können, ohne Bilder zu vergleichen.
39. Als Entwickler will ich, dass der Wechsel, das Warten und das Überblenden schon mit dem Steinbrett als vorläufigem
    Brett jedes Himmels gebaut und geprüft sind, bevor die Gestaltung feststeht, damit die Gestaltung danach nur noch
    das Aussehen einsetzt.
40. Als Agent will ich «Brett» und «Steinbrett» im Glossar finden, damit Specs, Tickets und Code dieselben Wörter
    benutzen.

## Entscheide zur Umsetzung

### Was das Brett ist

- **Brett** heisst das 7×7-Feld mit Oberfläche, Seiten und Kante, auf dem die Elemente stehen. Heute ist es 9,8 × 9,8 m
  gross, 0,38 m dick, mit einem Rand von 0,7 m um das Feld. Im Code heisst es noch «Steinplatte» oder «Platte», im PLAN
  «Plattform».
- **Steinbrett** heisst das heutige Brett. Es bleibt bei Milchstrasse und Sonnensystem und ist der Rückfall, wenn ein
  Himmel keine Brett-Angabe hat.
- Nur das Brett passt sich an. Drehteller, feste Sockel, der Teller des Prismas mit seinem Zeichen sowie Ring und
  Rahmen im Würfel bleiben überall gleich.
- **Form:** Sie ist frei innerhalb des heutigen Umrisses von 9,8 × 9,8 m. Das 7×7-Feld bleibt eben, gleich gross und
  an derselben Stelle. Rand, Dicke und Umriss dürfen sich innerhalb dieses Umrisses ändern. Mehrere Stellen im Code
  kennen den Umriss als festes Mass: Der Himmel blendet alles hinter dem Quader des Bretts aus, der Pinselfilter am
  Strand spart ihn aus, die Fische halten Abstand, und die Korona der Sonne steht dahinter. Deshalb ist alles, was
  darüber hinausgeht, nicht Teil dieser Spec.
- **Kernquader:** Der Himmel zeichnet heute nichts hinter dem Quader des Bretts, weil das Steinbrett diesen Quader ganz
  und undurchsichtig deckt. Eine freie Form deckt ihn vielleicht nicht ganz. Deshalb nennt jede Art ihren Kernquader,
  also den Quader, den sie sicher undurchsichtig deckt, und nur dahinter verzichtet der Himmel aufs Zeichnen. Während
  eines Überblendens gilt der Schnitt beider Kernquader, und dort muss jedes Pixel von einem der beiden Bretter gedeckt
  sein. Sonst entstehen Löcher im Himmel.
- **Das Brett schwebt weiter** in allen Welten wie heute: am Strand 3 m über dem Wasser, in Wüste und Dorf 4 m über dem
  Boden, am Vulkan über der Lava.
- **Pflicht auf jedem Brett ist die Lichtwelle beim Lösen**, in einer Form, die zum Material passt.
- **Frei je Richtung** sind die eingravierten Rasterlinien, die Einlegelinie und die Spiegelung von Elementen und
  Strahlen. Braucht ein Brett keine Spiegelung, darf ihr Zeichnen für dieses Brett entfallen.
- **Licht:** Es bleibt unverändert, also Hauptlicht, Grundlicht, der dunkle Raum für die Spiegelungen und der Nebel. Die
  Farben jedes Bretts werden so abgestimmt, dass sie wirken, als stünden sie im Licht ihres Himmels.
- Eine feste Regel für die Lesbarkeit gibt es nicht. Der Nutzer beurteilt sie an den Beispielen.

### Daten: das Brett in der Beschreibung des Himmels

- **Brett-Angabe:** Die Beschreibungsdatei jedes Blender-Himmels (skybox.json) bekommt ein neues, optionales Feld für
  das Brett. Es nennt die **Art** des Bretts und die Werte dieser Art, etwa Farben. Das Packwerkzeug übernimmt es
  unverändert ins Register. Die Teile einer Skybox ändern sich dadurch nicht, nur das Register und dessen Stand im
  Service Worker.
- **Arten und Prüfung:** Welche Arten es gibt und wie sie gezeichnet werden, steht im Spielcode. Das Prüfwerkzeug der
  Skyboxen liest die Liste der Arten aus dem Spielcode, wie heute die Arten der Ebenen. Es lehnt unbekannte Arten und
  ungültige Werte ab.
- **Rückfall:** Fehlt die Angabe, gilt das Steinbrett. Die Hintergründe aus dem Code (Milchstrasse, Sonnensystem) haben
  keine Beschreibungsdatei und zeigen das Steinbrett.
- Das Steinbrett ist selbst eine Art, und seine heutigen Werte bleiben unverändert.

### Material und Speicher

- **Im Spiel berechnet:** Das Material wird im Spiel berechnet, wie heute die Textur des Steinbretts in einem
  Hintergrund-Thread. Dafür kommen keine Bilddateien dazu und keine neuen Bytes, die vorab gespeichert werden. Heute
  belegen die vorab gespeicherten Teile von Wald, Strand und Vulkan etwa 4,2 von 4,5 MB.
- **Grafikspeicher:** Er bleibt etwa wie heute, wo das Steinbrett drei Texturen à 1024² belegt. Gleichzeitig im
  Speicher stehen höchstens das gezeigte Brett und, während eines Wechsels, das bisherige. Die Texturen eines Bretts
  werden mit denen seines Himmels freigegeben (auf dem Handy sofort, auf dem Desktop nach 30 s).
- **Formen aus Blender** gibt es nur, wenn eine gewählte Richtung eine Form verlangt, die sich nicht berechnen lässt (zum
  Beispiel Treibholz). Sie bleiben klein, laden mit ihrer Skybox und zählen zu deren Budget. Die Grenze von 4,5 MB für
  alles vorab Gespeicherte gilt weiter. Reicht der Platz nicht, entscheidet der Nutzer, wie damals bei der Wüste.
- **Zeitpunkt des Rechnens:** Das Brett eines Himmels wird berechnet und auf die Grafikkarte geladen, während dieser
  Himmel lädt oder vorgeladen wird, nie im Moment des Wechsels. Für die nächste Welt geschieht das, solange «Gelöst»
  steht. Die Rechenzeit pro Bild darf nicht messbar steigen.

### Wechsel, Warten und Überblenden

- **Das gezeigte Brett folgt immer dem gezeigten Himmel.** Das gilt auch, wenn ein Test den Himmel über die Adresse
  setzt. Darüber hinaus gibt es keinen eigenen Weg, das Brett zu wählen.
- **Bereitsein:** Ein Himmel gilt erst als bereit, wenn auch sein Brett berechnet und hochgeladen ist. Jede Stelle, die
  heute auf den Himmel wartet, wartet damit auch auf das Brett. Das sind das Angebot nach dem Prolog («Gleich los»), der
  Einstieg in eine Welt, die Reise, das Fortsetzen nach dem Neuladen und das Senken des Blicks aufs Brett. Das Warten
  dauert wie heute höchstens 8 Sekunden, mit dem Kleinen Wagen.
- **Halten:** Bis das neue Brett bereit ist, bleibt das bisherige stehen, so wie heute der bisherige Himmel stehen
  bleibt, bis der neue geladen ist.
- **Überblenden:** Das Brett gleitet gleichzeitig mit dem Himmel und über dessen ganze Dauer direkt vom bisherigen zum
  neuen Brett, ohne Umweg über das Steinbrett. Wie zwei verschiedene Formen ineinander übergehen (zum Beispiel ein
  Auflösen oder ein Wachsen wie bei den Elementen), legt die Arbeit am Strand fest. Vorgegeben sind nur die gleiche
  Dauer wie beim Himmel und kein Steinbrett dazwischen.
- **Steinbrett unter einem Blender-Himmel** gibt es nur im Notfall: wenn das Berechnen scheitert, oder wenn es nach 8
  Sekunden noch kein früheres Brett zum Halten gibt, etwa beim ersten Himmel nach dem Start. Ein solcher Notfall ist
  keine Ausnahme mit Meldung `[error]` in der Konsole.
- **Vor der Gestaltung:** Bis eine Gestaltung feststeht, bekommt jeder der fünf Himmel das Steinbrett als vorläufiges
  Brett. So sind Wechsel, Warten, Halten und Überblenden vor der Gestaltung gebaut und geprüft.

### Aufbau im Spielcode

- **Ein abgegrenzter Teil im Spielcode für das Brett.** Er kennt die Arten und baut aus Art und Werten das Brett mit
  Oberfläche, Seiten, Kante und Lichtwelle. Er berechnet die Texturen im Hintergrund, meldet, wann ein Brett bereit
  ist, blendet zwischen zwei Brettern über und gibt Bretter frei. Der Wechsel des Himmels (`skyTheme`) steuert ihn beim
  Vorbereiten, Vorladen, Wechseln, Überblenden und Freigeben. Die Geschichte spricht nur mit dem Himmel und nicht mit
  dem Brett.
- **Umschalten nur während der Arbeit:** Varianten lassen sich während der Arbeit über einen Parameter in der Adresse
  umschalten, nur für Vergleiche und Bilder. Mit der Wahl des Nutzers werden die übrigen Varianten aus dem Code
  entfernt. Am Ende werden auch der Parameter und jede andere Art, das Brett umzustellen, entfernt.
- **Testschnittstelle:** Die Abfragen der Proben bekommen eine lesende Abfrage dazu: welches Brett gerade zu sehen ist
  (Himmel und Art) und ob es bereit ist. Die bestehende Abfrage, ob der Himmel bereit ist, schliesst das Brett ein.

### Doku

- **Glossar:** `CONTEXT.md` bekommt die Einträge «Brett» und «Steinbrett» (siehe oben). «Plattform» und «Steinplatte»
  stehen dort unter _Vermeiden_. Nach der Änderung laufen die KI-Tester, denn das Glossar ist Teil ihres
  Fingerabdrucks.
- **PLAN:** Punkt 1.1 gilt für die fünf Blender-Himmel und verweist auf diese Spec. Für das Licht je Himmel kommt kein
  neuer Punkt in den PLAN.

### Geplanter Ablauf

Die Tickets liegen unter `issues/`:

| Nr. | Ticket | Blockiert durch | Entscheid des Nutzers |
|---|---|---|---|
| 01 | Brett-Angabe im Register, Steinbrett als Art | – | – |
| 02 | Das Brett wechselt mit dem Himmel: bereit, halten, überblenden | 01 | – |
| 03 | Vorbilder und Skizzenkatalog am Strand (läuft gleichzeitig mit 01 und 02) | – | gewählt: Gezeitenbecken (05.11.) |
| 04 | Strand: Gezeitenbecken im Spiel | 02 | Rückmeldung bis die Richtung sitzt |
| 05 | Strand fertig, mit dem Übergang zwischen verschiedenen Formen | 04 | Abnahme |
| 06 | Wüste | 05 | Wahl der Variante, Abnahme |
| 07 | Bergwald | 06 | Wahl der Variante, Abnahme |
| 08 | Dorf | 07 | Wahl der Variante, Abnahme |
| 09 | Vulkan, erst wenn der neue Krater auf `main` ist | 08 | Wahl der Variante, Abnahme |
| 10 | Schluss: Schalter weg, ganze Prüfung, Poco, Merge | 09 | Poco-Test, Go für den Merge |

Jedes Ticket prüft ein unabhängiger Reviewer, bevor das nächste beginnt. Jeder Himmel wird über eine Vorschauseite
abgenommen, bevor er committet wird.

## Entscheide zum Testen

- **Was ein guter Test ist:** Er prüft äusseres Verhalten, also was im Register steht und welches Brett das Spiel in
  einer Welt zeigt und wann. Er prüft keine Interna wie Shader-Werte, Texturgrössen oder den Aufbau der Netze. Es gibt
  keine Pixeltests: Das Aussehen nimmt der Nutzer von Hand an Bildern ab.
- **Zwei Teststellen, beide gibt es schon:**
  - **Prüfwerkzeug der Skyboxen** (Daten). Es prüft die Brett-Angabe jedes Registereintrags. Logiktests verlangen, dass
    die fünf Blender-Himmel eine gültige Brett-Angabe haben, und zeigen, dass das Prüfwerkzeug eine unbekannte Art und
    ungültige Werte ablehnt. Vorbild ist der Test, der die Ebenen des Vulkans mit abgeänderten Werten prüft («lehnt
    grelle Lava … ab»), und der Test «Register gültig, Teile vorhanden, Budget eingehalten». Die Arten liest der Test
    aus dem Spielcode, wie heute die Arten der Ebenen.
  - **Testschnittstelle im Browser** (Verhalten), mit der neuen Abfrage, welches Brett zu sehen ist und ob es bereit
    ist:
    - **Offline-Probe:** Für jeden Blender-Himmel, über die Adresse gesetzt, online und offline, ist der Himmel erst
      bereit, wenn sein Brett bereit ist, und das gezeigte Brett ist das dieses Himmels. Vorbild ist die heutige
      Schleife über alle Skyboxen.
    - **Geschichte-Probe:**
      - In jeder Welt und «Im Dorf» passt das gezeigte Brett zum Himmel. Das prüft die Probe schon heute für den
        Himmel.
      - Die Prüfung «kein leeres Brett» wird erweitert: Der Blick senkt sich erst aufs Brett, wenn auch das Brett
        bereit ist, und im Protokoll steht unter einem Blender-Himmel nie das Steinbrett.
      - Beim Wiederholen über eine Weltgrenze wechselt das Brett mit.
      - Die gemessenen Bildzeiten der Übergänge (Lücken über 100 ms sind Fehler) sichern, dass der Wechsel des Bretts
        nicht ruckelt.
- **Leistung:** Gemessen wird je Himmel am Desktop und in der Handy-Ansicht, mit dem Messwerkzeug (`?perf`, Taste F),
  vor und nach dem neuen Brett. Die Werte stehen im Ticket. Am Ende testet der Nutzer auf dem Poco.
- **Bilder für die Abnahme** kommen mit dem bestehenden Bildwerkzeug und dem Himmel über die Adresse, auf Desktop und
  Handy, mit flacher Kamera und ganz herausgezoomt. Dazu kommen der Fall des Lichts aufs Brett und das Überblenden.
- Alle Browserproben laufen gedrosselt über `tools/leise.sh`, nie zwei gleichzeitig, und mit stummem Chrome
  (`--mute-audio`).

## Nicht enthalten

- Die neuen Himmel aus PLAN 1.2: Eis oder Gletscher, Blütental und das Dorf in den Bergen. Sie bringen ihr Brett später
  über die Brett-Angabe in ihrer Beschreibung mit.
- Ein anderes Brett für Milchstrasse und Sonnensystem. Sie behalten das Steinbrett, bis sie selbst aus Blender kommen.
- Ein eigenes Licht auf dem Brett je Himmel. Dafür gibt es auch keinen neuen Punkt im PLAN.
- Änderungen an Drehtellern, festen Sockeln, dem Teller und Zeichen des Prismas sowie an Ring und Rahmen im Würfel.
- Ein Brett, das über den heutigen Umriss hinausgeht oder mit dem Grund verbunden ist. Der Katalog zeigt das nur als
  Ausblick mit dem Hinweis, dass es teurer wäre.
- Eine feste, messbare Regel für die Lesbarkeit.
- Pixeltests und Referenzbilder.
- Ein Schalter für Spieler oder ein bleibender Parameter, mit dem man das Brett wählt.
- Der Umbau des Vulkan-Kraters selbst. Er läuft auf seinem eigenen Branch.
- Startbildschirm und Bühne von Prolog und Epilog.

## Weitere Hinweise

- **Kleiner Wagen:** Auf dem anderen Rechner läuft der Branch des Kleinen Wagens (PLAN 0.4), der ebenfalls die
  Spieldatei ändert. Vor der Arbeit holen und vor dem Merge am Ende mit dem dann aktuellen `main` zusammenführen. Der
  Stern des Vulkans steht dort «über der Kraterwand».
- **Pinselfilter am Strand:** Er spart heute das Brett und die Elemente aus. Soll das Strandbrett gemalt wirken wie die
  nahen Pflanzen, gehört das als Hinweis auf die Karte im Katalog.
- **Flacher Blick:** Heute steht bei flacher Kamera der Rand des Bretts dunkel im Bild («flacher stünde die Platte als
  schwarze Wand im Bild»). Seiten und Kante sind deshalb so wichtig wie die Oberfläche.
- **Würfel-Level:** Sie liegen im Vorrat und stehen auf demselben Brett. Sie brauchen keine eigene Behandlung, denn ihr
  Strahl nach unten endet weiter auf dem Brett.
- **Werkzeuge:** Blender wird nur über den Blender-MCP bedient. Schwere Prozesse (Chrome, Node, Blender) laufen
  gedrosselt und nie gleichzeitig.
- **Commits** enthalten keine Zeilen, die Claude nennen.
