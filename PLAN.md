# PRISMA – Plan und offene Punkte

## 0. Erledigt (31.10.2026): Schwierigkeit wählen, dann Noas Geschichte

Wunsch des Nutzers (28.10.2026), als Nächstes anzugehen. Grundlage ist der Prototyp «Ein Lichtsignal an die Sterne»
(Branch `feature/lichtsignal-prototyp`): Prolog im Bergdorf, sechs Welten mit je eigener Skybox
(Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne) und Reisen dazwischen, Finale beim Polarstern, Epilog bei Noa.
Entscheide aus dem Grilling vom 29.10.2026, Spec und Tickets: `.scratch/noa-geschichte/` (Tickets 01–09). Begriffe in `CONTEXT.md` (Abschnitte «Noas Geschichte» und «Level der Geschichte»),
Entscheid in ADR 0005.

- **Stand 31.10.2026:** Alle Tickets 01–09 gebaut, reviewt und abgenommen (ganzer Durchgang je Grad auf Desktop
  und Handy, Bildzeiten der Zwischenszenen, Ticket 08), lokal nach main gemergt. Vorrat und Lader (02), Wahl der
  240 Level und Titel (03), die Geschichte je Grad (04), Menü mit den vier Graden (05), Übersicht mit Bestwerten und
  Wiederholen (06), Kapitel «Im Dorf» (07), Werkzeuge ohne feste Reihe und Aufräumen (08), 23 neue sehr schwere Level
  statt der Platzhalter (09).
- **Offen aus der Abnahme (Ticket 08, klein):**
  - [x] Erster Klick: `audio.unlock` hält das Bild 350–430 ms an (Hall mit 3,2 s Rauschen); Hall später oder kürzer.
    Erledigt in Ticket 05 von `.scratch/leistung/`: Teuer war vor allem das Anlegen des AudioContext, dazu der Puffer
    des Convolvers; beides geschieht jetzt beim Laden, solange der Startbildschirm still steht, die Impulsantwort
    rechnet ein Worker (Klang bitgleich). Erster Klick Desktop 19–36 ms statt 90–367, Handy-Emulation 4× gedrosselt
    54–125 ms statt 424–606 (der Rest ist der Start des Prologs, nicht der Ton).
  - [ ] Desktop «Spiel → Übersicht» 87–88 ms (einmal 106).
  - [ ] Übersicht auf kleinen Handys (360 × 640, 320 × 568): «Schliessen» liegt unter den Kacheln ausserhalb des
    Bildschirms, der Kopf ist weggescrollt.
  - [ ] Kopfzeile der Reise («Kapitel 3 · Die Wüste») auf hellem Himmel kaum lesbar; etwas heller.
  - [x] `.menue-aktion` auf kleinen Handys 8 px: entfallen, das Menü ist seit 0.4 (Ticket 08) neu gebaut.
  - [ ] Felsbilder in Streifen (OffscreenCanvas) in einem echten Firefox gegenprüfen (Strand, Wüste).
  - [ ] Baustein der Übersicht in `.scratch/noa-geschichte/bausteine/` kennt Tasten, Hinweis an der Kachel und 44 px
    nicht (das Spiel ist massgebend).
- **Offen, nicht Teil der Spec:**
  - [x] Eigene Skybox für «Im Dorf»: Noas Dorf bei Nacht (`village`), seit 03.11.2026 eingebaut (siehe 1.2).
  - [ ] Würfel-Level als Teil 2 der Geschichte: Alle 300 liegen im Vorrat, ohne Zugang im Spiel, mit einem Befehl
    zurückzuholen (`tools/vorrat.mjs`); ob und wie sie wiederkommen, ist offen.
  - [ ] Zwischenszenen innerhalb einer Welt (vorerst bewusst keine, Entscheid 7 der Spec).

- [x] **0.1 Neuer Spielablauf:** Keine feste Reihe von 500 Leveln mehr. Im Menü wählt der Spieler die Schwierigkeit
  (leicht, mittel, schwer, sehr schwer); danach spielt er Noas Geschichte mit genau 10 Leveln je Skybox, also
  60 Leveln je Schwierigkeit.
  - **Wahl der Level (Wunsch des Nutzers, 28.10.2026):** Je Welt und Grad kommen die 10 am besten bewerteten Level
    dazu (Urteil der KI-Tester, Spielwert), aber ohne Häufungen: Innerhalb einer Welt und über die Weltgrenzen hinweg
    dürfen keine Klumpen entstehen, in denen zu viele Level auf dieselbe Art gelöst werden (dieselbe Haupt-Kernidee,
    ähnliches Feld). Lässt sich beides nicht zugleich erfüllen, geht die Vielfalt vor; dann kommt das nächstbeste
    Level mit einer anderen Lösungsart.
  - **Steigende Schwierigkeit (Wunsch des Nutzers, 28.10.2026):** Neben der Bewertung zählt die Schwierigkeit. Innerhalb
    eines Grads steigt sie über die Geschichte: Die letzten leichten Level (bei den Sternen) sind schwerer als die
    ersten (im Bergwald), ebenso in jedem anderen Grad. Die Wahl verteilt die Level eines Grads darum über seinen
    ganzen Bereich der Schwierigkeit, und die Welten bekommen ihn der Reihe nach, von unten nach oben.
  - **Entschieden (29.10.2026, Spec):** Die Geschichte ist der einzige Ablauf; ein Grad je Durchgang mit eigenem
    Fortschritt; steigend auch innerhalb einer Welt (Vertauschungen höchstens 2 Plätze); Tutorial als Kapitel
    «Im Dorf» nach dem Prolog (Üben oder Gleich los); die Levelauswahl wird zur Übersicht des Grads mit Bestwerten;
    Prolog und Einstiege beim ersten Durchgang je Grad; Würfel-Level vorerst in den Vorrat.
  - **Entschieden (30.10.2026):** Die Bestwerte überleben «Von vorn»; die Reisen zwischen den Welten laufen ganz und
    sind nicht überspringbar (überspringbar bleiben Prolog, Angebot, «Im Dorf» und die Einstiege in die Welten).
- [x] **0.2 Nicht mehr gebrauchte Level zur Seite legen:** Was in keiner Welt mehr vorkommt, nicht löschen, sondern in
  einen Vorrat verschieben, damit es später wieder verwendet werden kann (Leveldaten samt Herkunft und Urteil der
  KI-Tester). Die Tests, die heute Reihenfolge, Grade und Namen festhalten (`tests/levelliste.test.mjs`,
  `tests/golden.mjs`, `entfernteNamen`), an den neuen Ablauf anpassen.
  - Vorrat (`tools/vorrat/`, `tools/vorrat.mjs`) und Lader (`tools/lader.mjs`) stehen seit Ticket 02; 275 flache und
    alle 300 Würfel-Level liegen dort. Seit Ticket 08 schreiben `ordne-level`/`ordne-wuerfel` in Spiel und Vorrat;
    Austausch und Bedarf je Gruppe sind entfernt.
- [x] **0.3 Fehlende Level generieren:** Je Grad braucht es 60 Level. Heute gibt es in der Fläche 85 leichte,
  265 mittlere, 105 schwere und 45 sehr schwere; für «sehr schwer» fehlen also mindestens 15 (Generator und KI-Tester
  wie beim Ausbau auf 500).
  - [x] **Sehr schwer (29.10.2026):** 15 neue Level beurteilt und gewählt, noch nicht im Spiel, in
    `tools/geschichte/sehr-schwer-neu.json`; Herkunft und Wahl in `.scratch/noa-geschichte/issues/01-sehr-schwer-vorrat.md`.
    Mit den 45 im Spiel sind es 60 (je Haupt-Kernidee höchstens 12, dazu ein Lockvogel).
  - **Entschieden (29.10.2026, Spec):** Die 240 Level bekommen Titel, die zu ihrer Welt passen; der bisherige Name
    bleibt der Schlüssel für Werkzeuge und Protokoll.
  - [x] **Platzhalter ersetzt (Ticket 09, 30.10.2026):** 23 neue sehr schwere Level statt der 23 Platzhalter, die
    Vielfalt geht ganz auf; die ersetzten liegen im Vorrat.
- [x] **0.4 Warum das Licht durch alle Welten muss: der Kleine Wagen** (Vorschlag vom 01.11.2026, entschieden im
  Grilling vom 04.11.2026). Spec und Tickets: `.scratch/kleiner-wagen/` (Tickets 01–13, Stand in `STAND.md`). Begriffe
  in `CONTEXT.md` («Kleiner Wagen», «Stern einer Welt», «Erwachen»). Der Polarstern sitzt an der Spitze der Deichsel des
  Kleinen Wagens; die sechs anderen Sterne schlafen, jede Welt weckt einen (zuerst die Schale, dann die Deichsel
  hinauf), der siebte ist der Polarstern.
  - **Gebaut (Tickets 01–09, Branch `feature/kleiner-wagen`):** Form, Linien und Stand des Wagens an einer Stelle
    (`wagen`, die Form des Ladezeichens); Texte von Prolog, Reisen, Finale und Epilog nach der Spec; der Wagen an einer
    festen Stelle am Himmel jeder Welt und des Dorfs (hell, was wach ist, auch bei Tag); Erwachen am Ende jeder Welt mit
    Aufblitzen, Linien und Glockenton, Flug am nächsten Stern vorbei, Einstiege am Stern der Welt; Finale mit dem
    sechsten Stern, Puls durch den Wagen und über die Deichsel zum Polarstern; Bühne mit dem Wagen (Prolog schlafend,
    Epilog wach) und Überblendung Wagen in Wagen; Menü «Sternkarte mit Reitern», Übersicht «Sternhaufen» und Leiste
    «Zeichen im Wagen» aus dem Skizzenkatalog (Ticket 02, Wahl des Nutzers).
  - [x] Abnahme durch den Nutzer am Computer und auf dem Poco (07.11.2026, nach drei Runden, Tickets 11 bis 13):
    Grösse und Helligkeit des Wagens bleiben, wie sie waren, jetzt als feste Werte; das Sprungbrett zur Abnahme ist
    ausgebaut (Ticket 10).
  - [ ] Merge nach main auf Wort des Nutzers.
  - [ ] **Offene Idee, nicht Teil der Spec (Entscheid 3):** Jede Welt gibt dem Licht ihre Farbe; erst alle zusammen
    ergeben das weisse Licht, auf das der Polarstern antwortet (Finale als Mischziel). Auch nicht in einer leichten
    Fassung mit farbigen Sternen; die Sterne leuchten weiss.

## 0a. Erledigt (03.11.2026): Leistung

Spec und Tickets: `.scratch/leistung/` (Tickets 01–19), Entscheide in ADR 0006 und 0007. Abgenommen vom Nutzer auf
dem Poco F4 GT und am Arbeitsrechner (`leistung-15`, Ticket 13): Startbildschirm, Prolog und Spiel flüssig, das Spiel
stetig mit 30 Bildern/s, die Geschichte mit 60, die Bühne von Prolog und Epilog in WebGL, Seitenmassstab 2 auf
Android-Chromium.

- [ ] `leistung-16`: alte DOM-Bühne entfernt (Stufe 3 von Ticket 19); kurzer Blick des Nutzers, dann Merge nach `main`
  auf sein Go.
- [x] Nachtrag 04.11.2026 (ADR 0008): Das Spiel zeichnet wieder stetig 60 Bilder/s (`?takt=30` zum Vergleich), die
  Leistungsanzeige (Taste F) zeigt effektive Bildrate und Ziel, der Referenzdurchlauf ist entfernt. Branch
  `feature/takt-60`.
- [x] Nachtrag 04.11.2026: Ladezeichen «Kleiner Wagen», solange die Geschichte auf einen Himmel wartet (nach «Üben»
  waren es bei 20 Mbit/s rund 4 s Schwarz). Gewählt aus sechs Varianten (Prototyp auf Branch `prototyp/ladeindikator`).
  Nicht gemacht: den Himmel des Dorfs schon während des Angebots vorladen (würde die Lücke kürzen, kostet
  Grafikspeicher auf dem Poco).
- [ ] Ohne Befund, nur zur Kenntnis: Die erste Fahrt nach dem Öffnen der Bühne hakt am Arbeitsrechner manchmal
  (Bildschirm aus), mitten in starken Zoomfahrten ist das Bild etwas weicher, Firefox auf Android ist ungeprüft.

## 1. Aussehen

- [x] **1.1 Ein Brett je Himmel:** Das Brett nimmt das Material seiner Umgebung auf, z. B. sandig am Strand. Gilt für
  die fünf Himmel aus Blender (Strand, Wüste, Wald, Dorf, Vulkan); Milchstrasse und Sonnensystem behalten das
  Steinbrett. Die neuen Himmel aus 1.2 bringen ihr Brett später in ihrer `skybox.json` mit. Spec und Tickets:
  `.scratch/brett-je-himmel/` (Grilling vom 05.11.2026), Branch `feature/brett-je-himmel`.
  - **Fertig (08.11.2026, Tickets 01–10):** Jede Welt hat ihr festes Brett mit eigener Lichtwelle: Gezeitenbecken
    (Strand), Lehmterrasse (Wüste), Moospolster (Bergwald), Hochbeet (Dorf), Basaltsäulen (Vulkan); Milchstrasse und
    Sonnensystem das Steinbrett. Die Brett-Angabe steht in `skybox.json` und im Register, das Prüfwerkzeug kennt die
    Arten. Das Brett wechselt mit dem Himmel (bereit, halten, überblenden), das neue wächst von der Mitte über das alte,
    ein Steinbrett gibt es unter einem Blender-Himmel nur im Notfall. Berechnet wird im Spiel, keine Bytes zum Vorab-
    Speichern dazu. Der Schalter `?brett=` und die Test-Leiste `?bretter` sind entfernt. Begriffe in `CONTEXT.md`
    («Brett», «Steinbrett», die Namen der Bretter). Übergabe: `.scratch/brett-je-himmel/STAND.md`.
  - [x] Ticket 11 (08.11.2026): An Weltgrenzen hielt das erste Bild eines neuen Himmels 100–175 ms an. Das kam vom
    Freigeben des alten Panoramas, nicht vom neuen. Jetzt gibt es einen Vorrat für Texturen der Himmel, Freigeben an stillen
    Bildern, Streifen in einer Höhe und ein unsichtbares Vorzeichnen jedes Panoramas, ohne die Prüfung zu lockern.
  - [x] Test des Nutzers auf dem Poco F4 GT (09.11.2026): «alles sieht super aus», keine Befunde.
  - [x] Merge nach main auf Wort des Nutzers (09.11.2026, 9c853da).
  - [x] **Moospolster im Mondlicht** (09.11.2026, Branch `fix/wald-brett-mondlicht`): Das Brett sah aus wie am Tag
    (gelbgrünes Moos, warme Erde) und passte nicht in den nächtlichen Wald. Aus vier Varianten gewählt: **Blaugrün**
    (Vorschau https://claude.ai/artifact/9Pt6KXqMyJzPs9GVKAuQ9j). Moos und Farn blaugrün wie die Bäume, Erde blaugrau,
    Spitzen und Rasterlinien silbrig. Dazu ein kühles Licht aus der Richtung des Monds im Panorama nur auf dem Brett
    (`moon`, `moonRim` in der Brett-Angabe), das auf der Mondseite helle Kanten an Polstern und Farn zeichnet, wie bei
    den Bäumen. Aufbau und Lichtwelle bleiben. Die warmen Töne, die fest im Code standen, sind grau: Die Farbe kommt
    allein aus `skybox.json` (ausser den festen Tönen der Lichtwelle).
  - [x] **Hochbeet im Mondlicht** (10.11.2026, Branch `feature/dorf-mond-kuehe`): Das Brett wirkte für die Nacht im
    Dorf zu grell (warme Erde, saftig grüne Kräuter, orange Ringelblumen). Aus vier Varianten gewählt: **Mondsilber**
    (Vorschau https://claude.ai/artifact/Jts6VWRTULSuTU61fX3q85). Erde und Bohlen blaugrau, Kräuter blaugrün,
    Schnüre und Kiesel silbrig, Ringelblumen gedämpft. Dazu dasselbe kühle Mondlicht wie beim Moospolster mit hellen
    Kanten auf der Mondseite, auf der Erde kaum (sonst wirkte sie bei flachem Blick wie grauer Beton). Das Mondlicht ist
    ein Baustein für beide Bretter (`boardMoonlight`); seine Richtung kommt aus `light.dir` des Himmels, das Spiel gibt
    sie der Brett-Angabe mit (`lightDir`). Die Kopie `MOSS.moonDir` im Code ist weg.
  - [x] **Hochbeet als Blumenwiese** (10.11.2026, gleicher Branch): Statt der gerechten Erde wächst im Feld eine Wiese.
    Aus vier Varianten gewählt: **Blumenwiese** (Vorschau https://claude.ai/artifact/DhBE1GrE6iZ28vix6jyHSU): Gras in
    Büscheln mit dunklen Lücken und hellen Spitzen, helle und dunkle Flecken, dazu Grüppchen von Gänseblümchen und
    blassem Klee, alles in die Textur des Felds gemalt (`grass`, `grassTip`, `daisy`, `daisyHeart`, `clover` in der
    Brett-Angabe). Im Rand bleiben Erde, Mulch und Kräuter, Schnüre, Pflöcke und Kiesel bleiben. Nicht gewählt: Rasen
    ohne Blumen, Mähmuster im Schachbrett, hohes Gras im Rand. Das Berechnen der Texturen dauert rund 0,1 s länger
    (1024², im Hintergrund-Thread). Offen: Die Lichtwelle ist noch die alte (Sämlinge neben den Schnüren,
    Glühwürmchen); auf der Wiese wären ein Windstoss übers Gras oder sich öffnende Gänseblümchen denkbar.
  - Am Strand gewählt (05.11.2026): **Gezeitenbecken**. Das Feld ist heller Sandstein, im Rand läuft eine Rinne mit
    Wasser. Katalog mit 8 Richtungen: https://claude.ai/artifact/81jLC81YCbWBGYDRe6C6H1.
  - Idee, nicht Teil der Spec: Das Wasser der Rinne fällt als Wasserfall bis aufs Meer. Das verbindet das Brett mit dem
    Grund und wäre teurer.
  - Jede Welt bekommt ihren eigenen Katalog (Entscheid vom 05.11.2026). In der Wüste gewählt (06.11.2026):
    **Lehmterrasse**, das Dach eines Lehmbaus wie in Djenné. Katalog: https://claude.ai/artifact/18PvQpJeqFYvQZbDkyDR8j.
  - Im Bergwald gewählt (06.11.2026): **Moospolster**, ein Stück Waldboden mit Moos, leuchtenden Pilzen und Farn.
    Katalog: https://claude.ai/artifact/NxHnBEMttQfErbf32u96zJ.
  - Am Vulkan gewählt (06.11.2026): **Basaltsäulen** wie am Giant’s Causeway, Glut steigt bei der Lichtwelle in den
    Fugen auf. Katalog: https://claude.ai/artifact/M9QffoMkGcgwSn2geoCjWv.
  - Im Dorf gewählt (06.11.2026): **Hochbeet** aus Noas Garten, bei der Lichtwelle steigen Glühwürmchen auf.
    Katalog: https://claude.ai/artifact/6tyN2oGW1VJRwVB3CXNTEG.
  - Jedes Brett hat seine eigene Lichtwelle. Strand: **Brandung**, Wüste: **Sandverwehung** (06.11.2026, Vorschau
    https://claude.ai/artifact/JpN1KG6cNopn4wGAZrYJ8v); Dorf, Wald und Vulkan wie in ihren Katalogen.
- [~] **1.2 Neue Skyboxen:**
  - [x] Vulkan mit Lava (seit 26.10.2026 auf main; Storyline: Rot)
  - [x] Wüste (Storyline: Gelb; seit 28.10.2026): weiche Dünen im Anime-Stil, Windrippel nah am Brett, drei nahe Dünen
    als 3D-Netz im Spiel (bakedMesh mit Übergang in den Sand), eine kleine Oase und die Pyramiden von Giza. Lädt ihr
    Bild erst beim Wählen (`vorab: false`), weil die vorab gespeicherten Skyboxen sonst über 4,5 MB kämen; offen, ob
    das Budget steigen soll.
  - [ ] Eis oder Gletscher (Storyline: Cyan)
  - [ ] Blütental in der Dämmerung, z. B. Lavendel oder Kirschblüten (Storyline: Magenta)
  - [ ] Idyllisches Dorf, umgeben von Bergen (Storyline: Finale)
  - [x] Noas Dorf bei Nacht für das Kapitel «Im Dorf» (Skybox `village`, 02.11.2026): hinter Noas Haus, Dorf mit
    Kirche am Hang, Gipfel mit Schnee, Sternenhimmel; Noas Haus, Zaun, Hochbeet und drei Nachbarhäuser als 3D-Modelle
    im Spiel. Gepackt und im Register (lädt erst beim Gebrauch, `vorab: false`), seit 03.11.2026 eingebaut:
    `STORY_DORF.sky` ist `village` (Merge `feature/dorf-himmel`). Szene `tools/blender/szenen/village/szene.py`.
    - [x] **Kühe im Garten** (10.11.2026, Branch `feature/dorf-mond-kuehe`): Der Garten rund ums Brett wirkte leer.
      Fünf Kühe: zwei Braunvieh, zwei Fleckvieh und ein Kalb, weidend, stehend und liegend, die grossen mit Glocke
      (`COWS`, `cow_mesh` in `szene.py`: Metaballs für Rumpf, Hals und Kopf, eigene Formen für Beine, Hörner, Ohren,
      Augen, Schwanz und Glocke). Sie gehören zum Netz von Noas Haus (bakedMesh `house`) und teilen dessen Bild, weil
      eine eigene Textur die 300 MB Grafikspeicher des Dorfs gesprengt hätte. Auf dem Bild liegen sie 4-mal dichter
      (je Seitenlänge, `COW_TEXEL`), das Haus behält seine Dichte (`HOUSE_UV`). Die Orte sind aus den Spielansichten
      gewählt, nah ums Brett: auf dem Handy über und unter dem Brett, am Desktop an den Rändern und flach unter dem
      schwebenden Brett. Ihre Schatten liegen im Panorama. Grundteil des Dorfs 1,87 MB (Grenze 2 MB). Offen: Die Kühe stehen still.
- [ ] **1.3 Neuer Startbildschirm «Sternbild über Noas Dorf»** (vom Nutzer gewählt, 01.11.2026): ersetzt das heutige
  Intro (`#intro` in `index.html`: Strahl, Schriftzug, Farbfächer hinter dem A). Prototyp mit allen drei geprüften
  Varianten in `.scratch/startbildschirm/prototyp.html` (Variante 3; im Browser öffnen, Taste 3, Taste r spielt nochmals ab).
  Ablauf:
  - **Bild:** eigener Nachthimmel (Verlauf von fast Schwarz oben zu Violett am Horizont), rund 110 feste, leise
    funkelnde Sterne, unten zwei Bergketten als Silhouette. Auf dem mittleren Gipfel brennt Noas Dorf als warmes
    Licht, das leicht flackert.
  - **0,6 s:** Aus dem Dorf steigt ein weisser Strahl senkrecht auf (1,6 s), bis zum Polarstern oben in der Mitte.
  - **2,1 s:** Der Polarstern (vierzackig, mit Hof) blitzt auf und dreht sich ein; danach pulsiert er sanft. Der
    Strahl verblasst auf etwa 12 %, bleibt aber als feine Linie stehen.
  - **2,6 s:** «PRISMA» zeichnet sich als **Sternbild**: Die Buchstaben sind Linienzüge, an jedem Knick ein leuchtender
    Stern. Linie für Linie, je 0,16 s versetzt, erscheinen zuerst die Sterne, dann ziehen sich die Verbindungen.
  - **4,1 s / 4,6 s:** «Ein Lichtsignal an die Sterne» und «Tippen zum Starten» blenden ein, wie heute.
  - Beim Einbau beachten: Die Enthüllung dauert länger als heute (bis etwa 5,8 s statt 2,9 s). `INTRO_REVEAL_MS`
    (heute 4200, gibt `introCalm` frei) und die Mindestwartezeit vor `.ready` (heute 2900 ms) müssen mitwachsen,
    sonst erscheint «Tippen zum Starten», während das Sternbild noch entsteht. Die Regel für
    `prefers-reduced-motion` zählt heute die alten Elemente einzeln auf und ist für die neuen neu zu schreiben.
    Weiter gilt: Animation erst mit `.go`; auf dem Handy messen (Ruckler beim ersten Zeichnen von Filtern, vgl. das
    Vorab-Zeichnen des Farbfächers).
- [x] **1.4 Strand: Kamera und Felsen** (09.11.2026, Branch `fix/strand-kamera-felsen`, Bild des Nutzers
  `bilder/StrandUebergang.png`; Vorschau https://claude.ai/artifact/RjJYsRcUicQvjcVBanDRtZ):
  - Herausgezoomt kam die Kamera bis hinter die Palmen (Handy hoch bis 34 m landeinwärts, Desktop 18 m). Gewählt: Die
    Kamera hält an (`camera.stops` in `skybox.json`, Strand höchstens 13 m zum Land hin); wo sie heranrücken muss, wird
    das Sichtfeld weiter, das Brett bleibt auf der Höhe der Mitte gleich gross (`cameraStop`; Handy hoch, ganz flach
    zum Land: die vorderen Ecken ragen etwas hinaus, oben hängt ein Palmblatt ins Bild). Beim Wechsel der Welt gleitet
    der Halt mit dem Überblenden. Das Brett aufs Meer zu schieben hätte fürs Handy rund 20 m gebraucht. Offen, heute
    nicht erreichbar: Würfel im Hochformat bräuchte mehr als `stopFovMax` 100°; greift der Halt, überschreibt er
    `story.sichtfeld` (Finale nur in der Milchstrasse).
  - Neben den nahen Felsen lag ein Sandsaum des 3D-Netzes bis 18 cm über dem Boden des Panoramas (Sandhügel,
    Treppenkante), darunter malte das Panorama dunklen Boden. Strand neu gerendert: Flach und vom Spiel gezeichnet ist
    nur noch, wo Fels liegt (`rock_drawn` in `szenen/beach/szene.py`), daneben zeigt das Panorama glatten Sand; die
    Felsen gehen am Rand weich ins Panorama über (`bakedMesh` mit `ground: [0, 0]`). Rest: Kiesel im Sand mit dünnem
    dunklem Rand (ihr Schatten im Panorama).
- [x] **1.5 Satte Strahlen** (10.11.2026, Branch `feature/strahlen-satt`; Vergleich der Varianten
  https://claude.ai/artifact/4bkF9EMhK9UgfWYxuogP3w): Die Farben sollten satter sein, damit klar ist, welche Farbe wohin
  muss. Aus vier Varianten gewählt: **Dunkler Saum**. Die Farben (`COLOR_RGB`) sind rein statt pastell (Grün statt Mint,
  Blau statt Lavendel, Rot statt Lachs; gilt auch für Ziele, Filter, Kombinator und Funken), der Kern leuchtet in der
  Strahlfarbe statt fast weiss, das Leuchten ist etwas kräftiger (`BEAM.glowGain` 1.15, `glowWidth` 0.054), und ein
  leichter dunkler Saum (`beamShadeMaterial`, vor dem Glas gezeichnet) hält die Farbe auf hellem Sand und Gras sichtbar.
  Cyan liegt näher bei Blau, sonst bleichte sein Kern weiss aus. Dazu auf Wunsch: alle Strahlen gleich dick (Blau wirkte
  viel dünner als Grün). Ausgleich je Farbe in `BEAM_EVEN` (Breite, Leuchten, Kern), abgeglichen an sieben parallelen
  Strahlen auf drei Himmeln, Desktop und Handy. Offen: auf hellem Sand bleiben die Farben heller als vor dem
  Sternenhimmel.
- [x] **1.6 Wüste: Pyramiden auf den Ecken** (10.11.2026, Branch `feature/wueste-pyramiden`; Vergleich der Varianten
  https://claude.ai/artifact/529JqRzUk5eCZwx7U3c4pS): Auf den Ecken der Lehmterrasse stehen kleine Pyramiden statt
  der Spitztürmchen mit Straussenei. Aus drei Varianten (glatt, helle Spitze, Stufen) gewählt: **helle Spitze** wie
  bei der Chephrenpyramide am Horizont. 60 cm Kante, 38 cm hoch, Neigung 52° wie die Cheopspyramide, das oberste
  Viertel hell (`CLAY.pyramidSize`); der Wert `egg` der Brett-Angabe heisst jetzt `cap`.
- [x] Nachtrag 11.11.2026 (Branch `feature/wueste-ohne-pyramiden`): Die Pyramiden aus 1.6 sind wieder weg, ohne
  Ersatz: Der Nutzer will sie doch nicht. Die Ecken der Lehmterrasse bleiben frei; `CLAY.pyramid`, `pyramidSize` und
  der Wert `cap` sind weg.
- [x] **1.7 Vulkan wie das «Door to Hell»** (11.11.2026, Branch `feature/vulkan-sandtrichter`; Skizzen
  https://claude.ai/artifact/UCLy5akG6GFMPTUquRD8Yg, Abnahme https://claude.ai/artifact/DfffUQgbWPErndiEsYQhRk): Die
  Lava bleibt, die steilen Felswände kommen weg. Aus vier Skizzen (Gaskrater, Sandtrichter, Feuerbänder, Abbruchkante)
  gewählt: **Sandtrichter** wie der Gaskrater Darvaza, in drei Runden flacher, kleiner und detaillierter. Vom Lavasee
  (Ufer bei 38 m statt 53, das Spiel zeichnet die Lava bis 29 m) steigt eine Böschung aus Sand mit 15° bis 23° zu
  einer niedrigen, bröckelnden Abbruchkante mit hellen Lagen (Rand 11 … 23 m über der Lava statt um 60); darauf
  Rutschungen, Rinnen, Rieselzungen, Rippel, aufgerissene Lehmkruste, rund 7800 Lehmbrocken und 40 000 Kiesel, dahinter
  dunkle Sträucher. 130 Feuernester: Das Panorama zeigt ihren Schein, Russ und glimmende Risse, die 966 Flammen zeichnet
  das Spiel bewegt (neue Ebene `fireNests`: drei Zungen je Flamme in vier Farbstufen, bläulicher Fuss, Glutschein,
  Funken; 156 KB, keine Texturen). Die Kamera bleibt in allen Stellungen über der Böschung, auch beim Würfel-Level am
  Handy hochkant. Sterne ab 14° (`starsFrom`, vorher 32°), Einstieg ohne steileren Blick (`up` wie die anderen Welten).
  Der Schein der Nester ist eine Fläche zur Kamera, kein Punkt (Review: Punkte bis über 1000 px wären am Handy oft
  begrenzt und fielen ganz weg, sobald ihre Mitte aus dem Bild geht). Offen: Kosten der Flammen auf dem echten Handy
  (Poco).
- [x] **1.8 Neue Welt: Eishöhle** (11./12.11.2026, Branch `feature/skybox-eishoehle`; Skizzen
  https://claude.ai/artifact/4yjYAG9xRyEAAeWEwxsUbG, Runde 1 https://claude.ai/artifact/6FSTuJYmee8tpvkji9kb9d,
  Runde 2 https://claude.ai/artifact/MGySQ93B4s5nsxEnG3Bni9): Aus vier Eis-Skizzen (Gletscherlagune, Eishöhle,
  Polarnacht, Eisbruch) gewählt: **Eishöhle** (Skybox `icecave`, Reihenfolge 70). Runde 1 war eine runde Kuppel mit
  gleichmässigen Waben und wirkte künstlich; Runde 2 ist nach Fotos echter Gletscherhöhlen gebaut (Wikimedia Commons:
  Breiðamerkurjökull, Mendenhall, Nigardsbreen) und so detailliert wie möglich ausgearbeitet: eine längliche,
  unregelmässige Halle (die Decke mal steil, mal flach bis auf den Kies), ein Ausgang ins Tageslicht mit Zapfen und ein
  dunkler Gang mit Bach, ein Schmelzwasserschacht als Trichter mit Lichtstrahl, Mulden in vier Grössen mit gebogenen
  Kanten (gewichtetes Voronoi), zum Ausgang grösser und gestreckt, dazwischen glattes Eis; Schlieren, Blasenzüge,
  Raureif an den Öffnungen, nasse Rinnen; Kies- und Aschelagen nur unten, Steine stecken halb im Eis; am Ufer Kiesel,
  Grus, Steine, abgerundete Eisblöcke, Eis-Stalagmiten. Der See bleibt (Wunsch des Nutzers): klar über dem Kies, in der
  Mitte tief. Die Lampe des Schachts spiegelt sich nicht im See (eingebacken lag ihr Bild als weisser Fleck 7–10 m
  neben dem Brett); eine Eiskruste ums Brett war verworfen (helle Scheibe, Risse wie Flüsse). Gemalt mit feineren
  Strichen (`pinsel` 0.12) und mehr Abtastwerten (`proben` in `stile.py`). Neu: Decke für die Kamera (`camera.top`,
  28 m; auf dem Handy stand sie im Würfel steil über dem Gewölbe; 32 m reichten nicht, das Gewölbe senkt sich zur Wand
  hin: Review, nachgemessen entlang der ganzen Bahn mit `kamera_abstand()`). Das Steinbrett bleibt vorerst; offen: eigenes Brett
  und Lichtwelle, bewegtes Wasser als Spiel-Ebene, Poco.
  - Nachtrag 12.11.2026 nach dem Spieltest des Nutzers: Das Eis ist heller (`GLOW`, Grundwert von `thin`), auf dem See
    schwimmen drei Eisschollen (Schnee mit blanken Flecken, 30 cm über dem Wasser). Der Lichtstrahl und die Lampe über
    dem Schacht sind weg; der Schacht liegt jetzt genau über dem Brett, damit das Licht der Geschichte durch ihn ein-
    und ausfliegen und die Strahlen zum Himmel durch ihn hinaus gehen können; die Sonne scheint per Light Linking nur
    noch draussen. Der blaue Kreis unter dem Brett war ein Loch im Boden (Ringe ab 0,5 m, wie einst im Wald): mit einem
    Fächer geschlossen. Die Öffnung darüber spiegelte sich danach genau dort; ein Stellvertreter des Bretts nur für
    Spiegelungen zeigt nun seine dunkle Unterseite (eine Zone ohne Spiegelung gab einen dunklen Kreis, raues Wasser
    einen hellen Fleck). Der Offline-Test lädt jetzt sechs Blender-Himmel: seine Notbremse steht auf 900 s (600 s
    reichten in SwiftShader unter Last nicht mehr).
  - Nachtrag 12.11.2026, zweiter Spieltest: Die Spiegelung des Eingangs im See stimmte nur von der Mitte des Panoramas
    aus und blieb stehen, wenn die Kamera sich bewegte. Jetzt zeichnet das Spiel die Oberfläche des Sees (Ebene
    `waterSurface` mit dem neuen ruhigen Modus `calm`: keine Dünung, Brandung, Schaum und kein Auflaufen, Kräuselwellen
    um `ripple` schwächer) und spiegelt das Panorama passend zur Kamera; Blender malt nur noch den Grund durchs Wasser
    (unter Wasser grau-türkiser Gletscherschlamm) und exportiert Wasserkarte und Wassermaske wie der Strand. Was aus dem
    Wasser ragt (Schollen, Treibeis, Eis im Seichten), steht in der Karte als «Fels»: Dort bleibt das Panorama vor dem
    Wasser. Der Stellvertreter des Bretts für Spiegelungen ist damit weg. Dazu: viel mehr Eisblöcke (15 grosse mit
    Trümmern, 220 verstreut am Ufer, 60 halb im Seichten; abgeschmolzen oder frisch gebrochen, je Block eigene Farbe,
    Blasenbänder, feine Risse, helle Kanten), vier Schollen mit eigener Form (gestreckt, gerade Bruchkanten, eine mit
    abgebrochenem Stück, Presseisrücken, geneigt, verschieden verschneit), weichere Übergänge der Wandmuster.
    Danach auf Wunsch sieben Schollen mehr (elf), drei davon nah am Brett (13 … 18 m von der Mitte).
  - Nachtrag 13.11.2026, dritter Spieltest: (1) Unter Wasser zeigten die Schollen «Schlieren»: Ihr heller,
    untergetauchter Rand wurde von der Brechung des Spielwassers verschoben, und am Rand entschied nahe unter der
    Kamera nur die grobe Tiefe, ob Wasser gezeichnet wird. Jetzt ist der untergetauchte Teil dunkel wie Eis in tiefem
    Wasser, das ruhige Wasser (`calm`) verschiebt den Grund nur noch um ein Viertel (Strand unverändert), die
    Wassermaske reicht in der Eishöhle bis 70° unter den Horizont (neuer Stil-Wert `maske`, sonst 20°; Grund- und
    Wasserbild zusammen jetzt 295 von 300 MB). Bleibt: Ganz herausgezoomt und steil von oben werden die Seiten naher
    Schollen gezogen, weil das Panorama nur vom Mittelpunkt aus stimmt (hinter jeder Scholle ein «Schatten», den es
    nicht kennt); ganz weg nur, wenn das Spiel die nahen Schollen selbst zeichnet. (2) Der Blick durch den Ausgang war «pixelig»: Die
    Rinnen draussen lagen unter dem Seespiegel, ausserhalb der Wasserkarte zeichnete das Spiel dort im flachen Blick
    offenes Wasser in Streifen. Bäche und Rinnen ausserhalb des Sees sind jetzt nasser Kies knapp über dem Wasser;
    draussen kamen Moränenwälle, Schneewehen, Moränenhügel 250–900 m vor dem Mundloch (sie füllen das schmale Fenster
    von gut 4°, durch das man vom Brett aus hinaussieht) und 2600 Blöcke Moränengeröll dazu, auf steilen Hängen Schutt
    statt Schnee; die Berge haben dunkle Felsflanken und Felsrippen (ein mittleres Grau wurde in der hellen Belichtung
    draussen fast weiss). Rinnen und Bäche liegen dafür 0,12 m über dem Wasser (`DRY`; die Maske zählt bis 0,05 m
    darüber als Wasser: Review). Zweites Review: Die Rinnen schnitten bis 18 m tiefe, 4 m schmale Schluchten in die
    Hügel und der Tunnelbach eine Kerbe genau in die Blickachse; zwischen den groben Bodenringen (16–52 m) wurden daraus
    Treppen, Geröll schwebte. Jetzt liegen die Hügel über den Rinnen, der Bach verläuft sich 60–160 m vor dem Mundloch,
    und die Ringe sind bis 1000 m dichter (100 statt rund 20). `textur` der Eishöhle 0,8 statt 0,9: An einem
    Glitzerpunkt im satten Blau schwang das JPEG sonst auf 1,0 (Bloom-Schwelle; Spitze 0,998).
  - Nachtrag 13.11.2026, vierter Spieltest: Eis unter Wasser ist weg. Das «Treibeis» (26 grössere und 140 kleine
    Platten) lag ganz unter dem Spiegel: entfernt, ebenso Eisblöcke, deren Oberkante nicht 0,1 m herausragt. Die
    Schollen reichen nur noch 0,12 m unter die Wasserlinie (ihr Körper darunter schimmerte als Schlieren). Keine geraden
    Bruchkanten mehr: Sie wirkten abgeschnitten, vor allem bei den Schollen nah am Brett; alle haben jetzt einen
    natürlich ausgefransten Rand. Fünf ragen höher heraus (0,45 … 0,7 m statt 0,25 … 0,42 m). Review: Ohne Bruchkante
    steckte das kleine Stück in der Scholle daneben (verschoben), geneigte Schollen reichten auf der tiefen Seite bis
    0,32 m unter Wasser (Unterseite jetzt flach bei −0,12 m), flache Eisvorlagen (0,6 hoch) rutschten durch den Filter.
  - Nachtrag 13.11.2026, fünfter Spieltest (Bild `bilder/Eisschollen.png`, drei markierte «unsaubere Schollen» im
    Wasser): Das waren Geisterbilder der echten Schollen. Das Spielwasser zeigt den Grund, indem es im Panorama in
    Richtung des Grundpunkts nachschlägt; hinter einer Scholle geht diese Richtung durch sie, ihr heller Rand stand
    gestreckt weiter hinten im Wasser. `groundShift` erkennt bei ruhigem Wasser jetzt verdeckten Grund auch über die
    Wasserkarte (Eis oder Fels auf dem letzten Stück des Strahls vor der Wasserfläche; die grobe Tiefe fasste die dünnen
    Ränder nicht), und der Shader mischt bei `calm` die Farben der vier Nachbarzellen statt ihrer Versätze (gemischte
    Versätze zweier Ersatzstellen trafen dazwischen wieder den Rand). Weg sind damit auch die gezackten Linien im
    steilen Blick. Der Strand bleibt unverändert.

## 1a. Spielführung

- [x] **1a.1 Tutorial überarbeiten** (Wunsch des Nutzers, 09.11.2026): Der Spieler soll besser durch die einzelnen
  Funktionen geführt werden. Heute ist das Tutorial das Kapitel «Im Dorf» nach dem Prolog: neun Übungen (Erstes Licht,
  Umweg, Sperre, Brechung, Schatten, Farbenlehre, Farbiges Licht, Treffpunkt, Mischung), je mit einem Satz als Hinweis
  unter der Kopfzeile («Übung 2 / 9»). Was genau zu tun ist, muss der Spieler selbst herausfinden. Vor dem Bau zu klären:
  - **Was geführt wird:** Drehen und Zurückdrehen, drehbar oder fest, Blöcke, Prisma, Licht, das verschwindet, Filter,
    farbige Quellen und der Ring am Ziel, Mischen am Ziel, Kombinator; dazu die Bedienung rundherum (Kamera drehen
    und zoomen, Neustart, Menü und Übersicht).
  - **Wie geführt wird:** zum Beispiel Schritt für Schritt, das Element hervorgehoben, das als Nächstes zu drehen ist,
    ein kurzer Text genau in dem Moment, in dem er zählt, Warten auf die Handlung statt eines Satzes vorab, eine
    angedeutete Hand oder ein Finger, Rückmeldung, wenn etwas schiefgeht.
  - Gleich gut auf dem Handy (Tippen, zwei Finger) und am Desktop (Klick, Rechtsklick, Mausrad).
  - Vorgehen wie bei den Brettern: Vorbilder aus anderen Puzzlespielen sammeln, ein Katalog mit verschiedenen
    Richtungen, dann wählt der Nutzer.
  - **Stand 10.11.2026: fertig, nach zwei Handy-Tests des Nutzers abgenommen und nach `main` gemergt.** Branch
    `feature/tutorial-fuehrung`, Richtung C «Vorzeigen» aus dem Katalog: je Übung höchstens drei Schritte mit einem
    Satz in der Kopfzeile, Umriss und Hand am Element, Hinweise nebenbei zu Kamera und Neustart, später Fingerzeig nach
    15 s, gezeichnete Zeigehand (Wahl B), feste Elemente mit Sockel wackeln beim Antippen im ganzen
    Spiel. Spec, Tickets und Übergabe in `.scratch/tutorial-fuehrung/` (`STAND.md`). Offen: Test mit einer
    fremden Person.
- [x] **1a.2 Texte natürlicher** (Wunsch des Nutzers, 13.11.2026): Die Texte von Geschichte und Tutorial wirkten «zu
  stark nach KI generiert». Befund: Gedankenstriche, Doppelpunkt mit Auflösung, feierliche Formeln («von Spiegel zu
  Spiegel, von Ort zu Ort – Stern für Stern»), jedes Kapitel nach demselben Muster («erwacht und weist»), gehobene
  Wörter, «so» und «also». Vorschlag als Vergleichsseite alt/neu, der Prolog in drei Tonlagen; gewählt **«Vorgelesen»**
  (warm, mit kleinen Einzelheiten aus dem Bild, etwa Rauch aus den Kaminen). Neu sind alle 47 Texte: Prolog, Dorf
  (Angebot, Einstieg, Ende), sechs Reisen, Finale, Epilog, 22 der 23 Schritte und die Hinweise nebenbei. Die Regel der
  Führung ist dafür gelockert: ein oder zwei kurze Sätze je Schritt (höchstens 18 Wörter, 105 Zeichen), Hinweise
  höchstens 16 Wörter. Entscheid 13 des Kleinen Wagens («von Spiegel zu Spiegel» in Prolog 6) ist damit aufgehoben.

## 2. Würfel-Level (3D)

- [~] **2.1 Würfel-Level erstellen und ausbauen.** Seit 27.10.2026 Quader 7 × 7 × 5 (vorher 7 × 7 × 7, bis 23. Oktober
  5 × 5 × 5), Konzept in `3D-WUERFEL.md`; Specs und Tickets in `.scratch/wuerfel-500/` und `.scratch/wuerfel-7x7x5/`.
  - **Stand 27.10.2026: 300 Würfel-Level im Quader 7 × 7 × 5**, vom Nutzer abgenommen und am 27.10. nach main gemergt:
    51 leicht, 159 mittel, 63 schwer, 27 sehr schwer (17 / 53 / 21 / 9 %). Jedes geht in der Lösung über mindestens
    3 Ebenen und steht am Boden, hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee,
    ist keinem anderen zu ähnlich und von beiden KI-Testern beurteilt; Herkunft (Auftrag, Seed, Stand, „gesenkt um N“)
    nachbaubar.
  - **Dauerregel des Nutzers (26.10.2026), gilt immer, ausser er sagt etwas anderes:** Grundfläche 7 × 7, Höhe 5;
    die Lösung trifft Elemente auf mindestens 3 Ebenen; das unterste Element steht am Boden (`ebenenVerletzt` in
    `tools/wuerfelliste.mjs`, Test über alle Level im Spiel).
  - Umbau (Tickets 01–12 der Spec `wuerfel-7x7x5`): 75 der alten 300 gesenkt und behalten, 225 entfernt (Namen nie
    wieder vergeben, `entfernteNamen`), 9 Gruppen neu. Unterwegs neu im Code: Höhe der Würfel-Level (`height`),
    Ebenen-Regel, Pool umrechnen, Korrektur der KI-Tester im Würfel aus dem Lauf und nach Zielplatz.
  - Häufungsregel im Würfel wie im Ausbau (höchstens 2 je Seite, ab „mittel“ 3), ohne Duldung. Gegen Häufungen
    wurden 15 Level des Umbaus wieder entfernt; im oberen Bereich von „leicht“ und „mittel“ häufen sich Sammelstelle
    und Mischziel, eigene Pools mit Ziel-Schwierigkeit (`pool-2-*-oben`) helfen dort.
  - [ ] Weiter bis 500 (Tickets 14–21 der Spec `wuerfel-500`, in 7 × 7 × 5), erst auf Anweisung.
    - Für jede Gruppe wird es schwerer, Häufungen zu vermeiden; mit Ziel-Pools je Bereich rechnen.
    - Namen: Vorrat in `tests/output/wuerfel/namen-vorrat.json` (nicht versioniert), streng prüfen (Teilwort,
      Wortende, Nachbarn im Spiel).
  - [ ] **E** Offen: Bekommt das erste Würfel-Level den Achsen-Hinweis, den früher Aufzug hatte?
  - [ ] Leistung auf dem Handy und Spieltests mit Menschen.
- [ ] **2.2 Strahl auf der Plattform blocken:** Strahlt ein Strahl auf die Plattform (im Würfel ein Strahl nach unten),
  wird er dort geblockt und leuchtet nicht durch.

## 3. Später (nächste Version, nicht jetzt)

- [ ] Neue Mechaniken, z. B. verschiebbare Elemente, Strahlteiler (halbdurchlässiger Spiegel), Portale, Schalter:
  - **Schalter (Lichtsensor):** Trifft Licht den Schalter, bewegt sich automatisch ein anderes Element (verschieben,
    evtl. auch drehen oder Blocker öffnen). Eröffnet neue Levelideen: Reihenfolge der Schritte zählt, ein Strahl bahnt
    einem anderen den Weg. Offen: dauerhaft auslösen oder nur solange Licht darauf fällt; Darstellung der Verbindung
    Schalter → Element; Löser und Generator müssen Zustände mit Schaltern durchspielen.
  - **Linsen, konvex und konkav** (Idee des Nutzers, 9. Oktober): Die Sammellinse bündelt Strahlen, die
    Zerstreuungslinse fächert einen Strahl auf. Offen ist, wie das im Raster wirkt: Durch eine Linse in einer
    einzelnen Zelle läuft der Strahl immer mittig und würde nicht abgelenkt. Denkbar: Die Linse ist drei Zellen breit.
    Die Sammellinse lenkt dann die Strahlen in den äusseren Zellen um 45° zur Mitte, und im Brennpunkt mischen sich
    ihre Farben. Die Zerstreuungslinse macht aus einem Strahl drei (geradeaus und ±45°), in der gleichen Farbe.
    Abgrenzen vom Prisma, das schon einen Strahl in drei teilt (dort nach Farben).
- [~] **Würfel-Level in 3D** (Wunsch des Nutzers, 11. Oktober; Branch `feature/3d-wuerfel`): Prototyp mit zwei
  handgebauten Leveln im 7×7×7-Würfel (bis 23. Oktober 5×5×5), um das Potenzial zu prüfen. Modell: feste Drehachse
  je Element, gleich viele Stellungen wie in 2D (Löser bleibt schnell). Alle Elemente direkt anklickbar (die
  Ebenenwahl ist wieder entfernt), freiere Kamera. **E** nach dem Ausprobieren: weiterverfolgen? Dann offen: Tutorial
  für die Achsen, Würfel-Level aus dem Generator (Ticket 22) von Hand und mit den KI-Testern prüfen, Grösse (5 oder 7)
  nach Spieltests festlegen, Leistung auf dem Handy.
  → Beurteilung und Generator im Würfel, eine Strahlregel für beide: Spec `.scratch/levelgenerator/spec.md`,
  Tickets 14, 22 und 27.
- [ ] Eventuell eine 3D-Karte für die Levelauswahl.
- [~] **Storyline** (Idee des Nutzers, 26. Oktober): Vielleicht eine Art Geschichte, die die Level verbindet, am
  ehesten etwas, das mit Licht zu tun hat. Seit 28. Oktober als Prototyp «Ein Lichtsignal an die Sterne» (Branch
  `feature/lichtsignal-prototyp`, `?signal`); wie es weitergeht, steht unter 0.

## 4. Google Play Store

Weg: Prisma bleibt eine Web-App und wird als Trusted Web Activity (TWA) in eine Android-Hülle verpackt (Bubblewrap oder
PWABuilder) – das Spiel selbst wird nicht umgeschrieben. Reihenfolge: zuerst 4.1–4.4 (lohnt sich auch ohne Store),
dann 4.5–4.7, parallel 4.8–4.10, zuletzt der Test 4.11. Die Regeln (Testerzahl, verlangte Android-Version) vor dem
Start in der aktuellen Play-Console-Hilfe nachsehen.

**Im Projekt**
- [ ] **4.1 Feste Adresse mit HTTPS**, z. B. GitHub Pages (Repo liegt schon auf GitHub) oder eigene Domain.
  Vor dem geschlossenen Test (4.11) endgültig entscheiden: Spielfortschritt (localStorage), Manifest-`id` und Asset
  Links hängen an der Adresse, ein späterer Wechsel kostet die Spieler ihren Fortschritt. Bei GitHub Pages als
  Projektseite (`…github.io/Prisma/`) muss `assetlinks.json` (4.5) im Repo `BonomoAlessandro.github.io` liegen.
- [x] **4.2 Offline-Fähigkeit:** Service Worker (`sw.js`), der Spiel, Icons, Bibliotheken und Schrift
  zwischenspeichert. Online kommt die Seite frisch vom Server (nach 3 s Wartezeit aus dem Speicher), offline aus
  dem Speicher; `vendor/` direkt aus dem Speicher; alle anderen Anfragen gehen vorbei. Nur über http(s) (über
  file:// gibt es keine Service Worker).
  `tests/logic.test.mjs` prüft die Dateiliste, `tests/offline.mjs` lädt das Spiel, stoppt den Server und lädt neu.
- [x] **4.3 Abhängigkeiten lokal ausliefern:** Three.js r147 samt 7 Zusatzmodulen in `vendor/three-0.147.0/` (aus dem
  npm-Paket, Prüfsumme der Registry geprüft, byte-gleich mit den bisherigen CDN-Dateien), die Schrift „Jost“ in
  `vendor/jost/` (nur der lateinische Zeichensatz, variable Schrift für alle Stärken). Lizenzen liegen bei
  (MIT, SIL OFL). Kein Abruf bei fremden Servern mehr.
- [x] **4.4 Manifest ergänzen:** Name „Prisma – Licht-Puzzle“ (Startbildschirm „Prisma“; „Prisma“ allein ist im Store
  durch eine Foto-App besetzt), feste `id` „prisma“ (nicht mehr ändern, sonst gilt die installierte Web-App als neue;
  die Play-App erkennt man an Paketname und Signaturschlüssel), `scope`, Sprache,
  Beschreibung, Kategorie. Android-Icons mit Schutzrand (`icons/icon-maskable-192/512.png`, erzeugt mit
  `tools/icons.mjs`: ohne Ecke, Prisma auf 85 % verkleinert, Strahl und Spektrum bis zum Rand). Seitentitel
  angepasst. Speicherschlüssel des Fortschritts unverändert. Chrome meldet keine Manifest-Fehler, installierbar.
- [ ] **4.5 Digital Asset Links:** `/.well-known/assetlinks.json` auf der Website, sonst zeigt die App eine
  Browser-Adressleiste.
- [ ] **4.6 Android App Bundle (.aab) bauen und signieren** (Bubblewrap). Signaturschlüssel sicher aufbewahren – ohne
  ihn keine Updates.
- [ ] **4.7 Test auf echten Android-Geräten:** Leistung auf schwächeren Handys, Zurück-Taste, Hoch-/Querformat, Ton.

**Konto und Store-Eintrag**
- [ ] **4.8 Google-Play-Entwicklerkonto:** einmalig 25 USD, Identitätsprüfung.
- [ ] **4.9 Pflichtangaben:** Datenschutzerklärung als Webseite (Fortschritt nur lokal; seit 4.3 keine Abrufe bei
  fremden Servern mehr), Formular „Datensicherheit“, Altersfreigabe-Fragebogen, Zielgruppe.
- [ ] **4.10 Store-Material:** Icon 512 × 512 (vorhanden), Titelgrafik 1024 × 500, mindestens 2 Screenshots,
  Kurzbeschreibung (80 Zeichen), lange Beschreibung.
- [ ] **4.11 Geschlossener Test:** Neue private Konten brauchen mindestens 12 Tester über 14 Tage, bevor die App
  öffentlich erscheinen darf – zeitlich der längste Schritt.

## 5. Steam

- [ ] **5.1 Prisma irgendwann auch auf Steam veröffentlichen.** Als Web-App braucht Prisma dafür eine Desktop-Hülle
  (z. B. Electron oder Tauri). Weg und Schritte sind noch offen; Regeln und Gebühr (Steam Direct) vor dem Start
  nachsehen.
