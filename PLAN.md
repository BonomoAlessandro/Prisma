# PRISMA – Plan und offene Punkte

Hier stehen alle Punkte, die wir noch umsetzen wollen. Erledigtes wird abgehakt (`[x]`) und bleibt zur
Nachvollziehbarkeit stehen. Neue Wünsche kommen einfach als neuer Punkt dazu.

**Legende:** `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt · **E** = Entscheidung des Nutzers nötig

Zuletzt aktualisiert: 18. Oktober 2026

---

## Ziel

- **Tutorial + 150 Level:** Zuerst ein kurzes Tutorial (9 Level, je ein Gedanke): Ziel und Spiegel, drehbar/fest,
  Block, Prisma, verschwindendes Licht, Filter, farbige Quellen, Mischen auf dem Ziel, Kombinator – je mit einem
  Hinweis in der Kopfzeile. Danach 150 Level, **allein nach Schwierigkeit sortiert** (leicht → schwer), ohne
  Gruppierung nach Elementen oder Anzahl Komponenten. Die Level 121–150 sind alle schwerer als die ersten 120. Die Level
  120–140 sind als „schwer“ markiert, 141–150 als „sehr schwer“.
- **Leitlinien für alle Level:**
  1. Elemente und Farben mischen sich frei: Spiegel, Prismen, Filter, Kombinatoren, Blöcke, farbige Quellen.
  2. Die Level sollen Spass machen, teilweise zum Grübeln anregen und qualitativ stark sein.
  3. Je weiter man kommt, desto schwerer.
- Alle Level sind jederzeit spielbar, nichts muss freigeschaltet werden.
- Die Levelauswahl blättert in Seiten (Tutorial, 1–10, …, 141–150). Die Seiten sind keine Kapitel und haben kein Thema.

---

## 1. Entscheidungen

- [x] **E3 · Tutorial überspringen?** Erledigt durch E5: Alle Level sind jederzeit spielbar.
- [x] **E4 · Farbige Quellen im Tutorial:** eigenes Tutorial-Level „Farbiges Licht“ vor dem Kombinator.
- [x] **E5 · Kein Freischalten:** Alle Level (auch Tutorial) sind jederzeit spielbar; gelöste Level bleiben markiert.
- [x] **E6 · Level 74 und 79:** Nur „Nebelfeld“ (S07, Platz 79) wird ersetzt, durch S19 „Farbmühle“ auf Platz 77;
  „Spiegelkabinett“ (S36, Platz 74) bleibt, weil S40 dieselbe Schwäche stärker hätte (siehe 2.11).

## 2. Tutorial + 150 Level (aktuelle Arbeit)

- [x] **2.1 Struktur:** Kapitel entfernt; Tutorial mit Hinweisen, 50 Level nach Wertung, Levelauswahl mit Seiten,
  Fortschritt nach Levelname (alte Schlüssel „II:Name“ werden übernommen).
- [x] **2.2 Generator-Profile** (`tools/profiles.mjs`): Grössenstufe 1–5 × Mischung (Spiegel, Prisma, Filter,
  farbige Quellen, Kombinator, bunt). Farbige Quellen im Generator. Pools mit `tools/pools.mjs`. Profile, alter
  Generator und Pools sind mit Ticket 21 entfernt; heute erzeugt der Generator in `tools/generator/` die Level (ADR
  0004).
- [x] **2.3 Kuratierung** (`tools/curate.mjs`): alle Pools + handgebaute Level, 50 gleichmässig über die Wertung,
  verschiedene Grundmuster, abwechselnde und ausgewogene Mischungen; Review der Auswahl und der Reihenfolge. Mit Ticket
  21 entfernt (samt `tools/selection.jsonl` und `tools/candidates.jsonl`): Reihenfolge und Grade rechnet
  `tools/ordne-level.mjs` aus der Beurteilung.
- [x] **2.3b Zweites Review** mit zwei unabhängigen Testern (Spielersicht ohne Kennzahlen, analytisches
  Spielermodell), abgeglichen in zwei Runden: Reihenfolge neu (Rangkorrelation der Tester 0.91 → Abstand im Mittel
  unter 2 Plätzen), 4 Level ersetzt (Kopie eines Tutorial-Levels, Dopplung, zwei wirkungslose Filter). Tutorial:
  „Farbenlehre“ umgebaut (Filter jetzt nötig), „Mischung“ mit festen Spiegeln entschärft, Hinweise zu Mischen auf
  dem Ziel und Prisma auf einfarbigem Licht. Berichte in `tools/pools/review2/` (nicht versioniert).
- [ ] **2.4 Feedback des Nutzers:** Tutorial und alle 150 Level anspielen: Steigt die Schwierigkeit spürbar?
  Langweilige oder unfaire Level? Passen die Übergänge vom Tutorial zu Level 1, von 120 zu 121 und von 140 zu 141?
- [ ] **2.5 Oberes Ende:** Über Wertung ~40 gibt es nur wenige Kandidaten (Stufe 5 ist langsam, Filter-Profil ohne
  Ausbeute). Bei Bedarf Stufe 5 länger laufen lassen und die letzten Level ersetzen.
  → Ersetzt durch die Spec `.scratch/levelgenerator/spec.md`, Tickets 20, 25 und 26.
- [ ] **2.6 Mischziele gezielt erzeugen:** Zwei verschiedenfarbige Strahlen auf dasselbe Ziel (z. B. Magenta aus
  Rot und Blau), mit Qualitätskriterium „Mischziel vorhanden“.
  → Ersetzt durch die Spec `.scratch/levelgenerator/spec.md`, Tickets 06, 10 und 18.
- [ ] **2.7 Generator: wirkungslose Filter verwerfen** (Strahl hat schon die Filterfarbe – bei rund 1/3 der
  Filter-Level im Pool). Ebenso feste Spiegel, die nie für die Lösung zählen und kaum als Lockvogel wirken.
  → Ersetzt durch die Spec `.scratch/levelgenerator/spec.md`: Der neue Generator setzt keine wirkungslosen Elemente
  (Ticket 18).
- [x] **2.8 Lesbarkeit im Spiel** (aus dem Review): Blaue Ziele wirken fast weiss; die Richtung des Kombinators ist
  auf Distanz schwer zu erkennen. („Weiss + Rot im Kombinator = Weiss“ steht jetzt im Hinweis zum Kombinator.)
  **Umgesetzt (8. Oktober):** Zielkristalle satter (dunkle Farben mit weniger Weiss und Schillern). Der Ring am Ziel
  hat einen festen Platz je Grundfarbe (Rot links, Grün rechts, Blau vorne; grösser, damit der Stein ihn auf dem
  Handy nicht verdeckt) und zeigt, woraus die Zielfarbe besteht – auch ohne Farbunterscheidung lesbar. Er ersetzt
  den äusseren Ring für falsches Licht: Kommt eine gebrauchte Grundfarbe an, wird ihr Bogen heller; eine nicht
  gebrauchte flackert in ihrem leeren Platz. Tutorial-Hinweis „Farbiges Licht“ angepasst. Kombinator: hellere,
  grössere Düse mit schwach leuchtender Linse. Filter gleich behandelt, siehe 2.15.
- [x] **2.9 Level 51–70 (schwerer als Level 50):** `tools/harden.mjs` macht erzeugte Level schrittweise schwerer
  (lokale Suche; Quellen müssen gekoppelt sein, Feld kaum dichter als bei den 50 – auch nach dem Abschluss geprüft,
  `curate.mjs` und ein Test prüfen dasselbe). Pools harden-1 bis -6: 121 Kandidaten (Wertung 44–56.6; harden-6 lieferte
  mit 18 Prozessen 73 Level in einer Stunde). Strahlverfolgung 2,2× schneller (gleiche Ergebnisse, im Code-Review an
  22 800 Strahlbildern nachgeprüft). Code-Review, Befunde behoben.
  **Review** (`tools/pools/review4/`, nicht versioniert): 20 per `curate.mjs --keep 50` gewählte + 12 Reserven,
  gemischt und anonym, an zwei Tester (Spielersicht: alle 32 ohne Löser gelöst; Analyst: Spielermodell
  `player.mjs`, Holzwege `traps.mjs`). 7 gewählte ersetzt (zu erzwungen/Fleiss: Spiegeltreppen, Prismenreihe,
  Zerlegen-und-Vereinen; R09 als ermüdendes Knäuel), 7 Reserven aufgenommen. Reihenfolge aus beiden Rangfolgen
  nach zwei Runden (Rangkorrelation 0.06 → 0.50; einig bei Anfang und den schwersten drei). Die Wertung trifft die
  menschliche Schwierigkeit in diesem Band kaum (ρ ≈ 0.26) – siehe 3.5. Testlauf dauert gut 2 Minuten (vorher 7 s).
- [x] **2.10 Tutorial: verschwindendes Licht** (aus Review 4): eigenes Tutorial-Level „Schatten“ (Spiegel längs,
  Prisma von hinten – beides nacheinander sichtbar).
- [x] **2.11 Level 71–80 (mindestens so schwer wie 51–70):** Zwei Läufe harden-7/-8 (73 Kandidaten), Vorsieb mit dem
  Spielermodell (`tools/pools/review5/screen.mjs`: Denkaufwand, Raten, Holzwege, Scheinkombinatoren; geeicht an Review 4),
  59 bestanden, 30 + 10 Reserven an zwei Tester (`tools/pools/review6/`). Der Analyst empfahl nur 10 (echtes Mischziel
  aus zwei Quellen, kein Fleissteil, keine Scheinmischung) – diese 10 sind eingebaut (Reihenfolge des Analysten).
  **Spieler-Tester** (nach dem Commit, `review6/tester-spieler.md`): empfiehlt 20. Einig mit dem Analysten bei 8 der
  10 eingebauten; **strittig: Level 74 „Spiegelkabinett“ (S36, Spiegeltreppe) und 79 „Nebelfeld“ (S07, Kombinator nur
  Umlenker)** – der Spieler würde sie streichen. Der Spieler wählt dafür S19 und S40, beim Analysten sind sie nur
  Reserve (S19 Nr. 1, S40 Nr. 5 von 6).
  **Nachprüfung (8. Oktober):** **„Nebelfeld“ (S07) → S19 „Farbmühle“.** Beide haben eine Scheinmischung im
  Kombinator (S07: Weiss + Rot = Weiss; S19: Rot + Grün aus zwei Quellen, ein Prisma zerlegt das Gelb sofort wieder)
  und beide Cyan aus zwei Quellen am Ziel. Den Ausschlag gibt der Spieler: S07 gestrichen (Spass 3.5, triviales
  Weissziel), S19 gewählt (Spass 4); beim Analysten ist S19 die beste Reserve („sonst stark“, Schw. 7 statt 8 bei S07).
  Minus: obere zwei Reihen leer. Platz 77 statt 79: So steht S19 mindestens 2 Plätze von „Zenit“ (S12, ebenfalls
  Kombinator → Prisma) und von „Lichtbrücke“/„Lichtkegel“ (Gelb aus zwei Quellen im Kombinator) entfernt; im Mittel
  beider Tester Schw. 6.5, die Nachbarn liegen bei 7.
  **„Spiegelkabinett“ (S36) bleibt:** S40 hätte statt einer Schlange über 5 Spiegel eine über 7–8, dazu wirkungslose
  Filter, und ist laut Analyst leichter. Sonst steht nur S04 bei beiden auf der Reserveliste (Blauschlange, Füllteil).
  Mehr als 10 eher nicht.
- [x] **2.12 Tutorial klarer, alle Elemente erklärt:** Ziel im ersten Hinweis („Jeder Kristall muss in seiner Farbe
  leuchten“), Zähler „Ziele x / y“ in der Kopfzeile (alle Level), falsches Licht am Ziel als flackernder äusserer Ring
  in der ankommenden Farbe. Tutorial von 6 auf 9 Level: neu „Sperre“ (Block), „Schatten“ (verschwindendes Licht),
  „Treffpunkt“ (Mischen auf dem Ziel); „Umweg“ ohne Block; Hinweise gekürzt, Mischfilter und „Weiss + Rot = Weiss“
  ergänzt (`1cf64b9`).
- [x] **2.14 Tutorial: 135°-Knick im Prisma** (aus Review 6): Rot und Blau können im Prisma um 135° abknicken
  (z. B. Level „Prismenhof“; in der Lösungsstellung von 17 der 80 Level). **Entschieden (8. Oktober): keine
  Änderung** – die Regel ist klar genug, Hinweis und Tutorial bleiben.
- [x] **2.15 Filter satter** (aus 2.8): Der Blaufilter wirkte blasslila wie früher die blauen Ziele. Gleich
  behandelt: dunkle Farben mit weniger Weiss und Schillern, etwas deckender und mit mehr Eigenleuchten. Fällt
  weisses Licht hinein, wirkt der Filter weiterhin hell (der Strahl scheint durch das Glas).
- [x] **2.16 Hintergrund: Sternenhimmel mit Milchstrasse** (Wunsch des Nutzers, 8. Oktober): statt des fast schwarzen
  Verlaufs. Ganz berechnet, ohne Bilddatei: 15 000 feste Sterne als runde Punkte (Farben bläulich bis warm, helle
  funkeln leicht, am Band dichter) und die Milchstrasse im Shader (wolkig, dunkle Staubstreifen, warmer Kern). Lage
  je Bildformat: im Hochformat diagonal über und unter dem Feld, im Breitformat flach über dem Feld mit dem Kern rechts
  oben, dazwischen übergeblendet (`SKY`, `updateSky`). Dunkel und unter der Bloom-Schwelle, nicht in der
  Bodenspiegelung. Der Himmel ist im Bildpuffer mit Alpha 0 markiert: Die Farbverschiebung am Bildrand lässt ihn aus
  (sonst bekamen die Sterne einen Rot-Blau-Saum). Offen: Leistung auf echten schwachen Handys prüfen (5.7).
- [x] **2.17 Spiegel auf dem Handy sichtbar** (Wunsch des Nutzers, 8. Oktober): Steil von oben spiegelte das Glas nur
  den fast schwarzen Boden der Lichtumgebung und war dunkler als das Brett. Auf Handy und Tablet (`IS_MOBILE`) bekommt
  das Spiegelglas eine eigene, silbrige Umgebung (`ENV_ROOM.mirror`); am Computer bleibt es wie bisher. Ein helleres
  Brett wurde verglichen und verworfen: Es nimmt den Strahlen Kontrast und macht die Marmoradern unruhig.
- [x] **2.18 Kamera frei ums Feld drehbar** (Wunsch des Nutzers, 8. Oktober): Ziehen dreht beliebig rund ums Feld,
  nur die Neigung bleibt begrenzt. Der Abstand bleibt rundum der der Ausgangsansicht (9. Oktober, Wunsch des
  Nutzers); über der Diagonale ragen dafür Ecken der Platte und des Spielfelds etwas aus dem Bild. Verworfen: Abstand
  nach dem Winkel (über der Diagonale √2, damit die ganze Platte passt) pumpte bei jeder Vierteldrehung; einmal
  herauszoomen (1.25 in den ersten 30°) wirkte wie Wegfahren, sobald man dreht. Das Hauptlicht kreist mit, sonst
  spiegelte es sich von hinten grell im Stein. Die Kamera bleibt stehen, wo man sie lässt, und fliegt erst beim
  Levelwechsel auf kürzestem Weg zurück (früher nach 4 s). Sterne jetzt am ganzen Himmel (gut 35 000 statt 15 000,
  gleiche Dichte; die Ausgangsansicht sieht unverändert aus).
- [x] **2.19 Galaktische Wolken in der Milchstrasse** (Wunsch des Nutzers, 9. Oktober), alles im Himmels-Shader:
  - Sternwolken: hellere Klumpen im Band, neben dem Staubstreifen einzelne dunkle Staubwolken.
  - Gasnebel: selten, nahe der Bandebene und fädig: rosa leuchtender Wasserstoff, bläulich angestrahlter Staub; der
    Staub schneidet auch durch die Nebel. Im Breitformat steht einer links oben über dem Feld.
  - Magellansche Wolken (`SKY.lmc`, `SKY.smc`): zwei fleckige Nebel aus Sternenlicht, 40–56° neben dem Band, die
    man erst beim Drehen entdeckt (um gut 200°). Im Hochformat unter der Platte, im Breitformat im Streifen darüber;
    die grosse mit Balken und einem rosa Gasnebel am Rand.
- [x] **2.20 Zweiter Hintergrund: Sonnensystem** (Wunsch des Nutzers, 9. Oktober), umschaltbar über einen vierten Knopf
  unten rechts (Saturn) oder die Taste H; die Wahl bleibt gespeichert (`prisma.sky`), der Wechsel blendet in 0,9 s über
  (`skyTheme`). Das Brett schwebt über der Sonne; ihre Korona scheint rund um die Platte hervor (Billboard hinter die
  Platte geschoben, sonst lag das Leuchten auf deren hinterem Teil). Die acht Planeten kreisen um beide (`SOLAR`):
  - Grössen und Abstände gestaucht, Umlaufzeiten nach der Wurzel der echten (Merkur 60 s, Neptun gut 26 min).
  - Die äusseren Bahnen liegen tiefer: So ziehen alle auf der fernen Seite durch den Streifen über der Platte, im
    Hoch- wie im Breitformat (seitlich verlassen sie das Bild).
  - Oberflächen berechnet (Wolkenbänder, Grosser Roter Fleck, Kontinente mit ziehenden Wolken, Polkappen), von der
    Sonne beleuchtet mit Tag- und Nachtseite, Atmosphären am Rand; Saturn mit Ring, Cassini-Teilung und dem
    Schatten des Planeten auf dem Ring; die Erde mit Mond; feine Bahnlinien.
  - Dahinter nur Sterne (Wunsch des Nutzers): Milchstrasse, Nebel und Magellansche Wolken blenden aus.
  - Kostet beim Rendern nicht mehr als die Milchstrasse (deren Shader entfällt). Beim Umschalten hält die adaptive
    Auflösung kurz still: Das erste Mal werden Shader übersetzt, die einzelnen langen Bilder sind kein Grund zum Absenken.
- [x] **2.21 Dritter Hintergrund: nächtlicher Nadelwald** (Wunsch des Nutzers, 9. Oktober, Stimmung „Nacht mit
  Mondlicht“). Der Knopf schaltet jetzt der Reihe nach: Milchstrasse → Sonnensystem → Wald (`skyTheme.order`).
  - Das Brett schwebt über einer bewaldeten Kuppe; von dort fällt das Gelände in Kämme und Täler ab (`terrainHeight`,
    gratiges Wertrauschen), ein Nebelmeer füllt die Täler, alles verblasst mit der Entfernung (Luftperspektive). Der
    Blick geht über die nahen Wipfel einen Hang hinunter in den Dunst.
  - Bäume als geschlossene Silhouetten aus Etagen: schlanke Spitze, darunter immer breitere, hängende Etagen mit
    unregelmässigem Rand; gut dreimal so hoch wie breit. Im Shader Nadelbüschel um den Stamm, helle Zweigspitzen,
    dunkel unter der nächsten Etage und unten im dichten Wald; die Krone wird wie ein Volumen beleuchtet (Normale
    halb vom Stamm weg und nach oben), Wipfel wiegen sich leicht. Mond seitlich (`FOREST_MOON`), der Nebel leuchtet zum
    Mond hin heller (`forestMist`, gemeinsam für Himmel, Bäume, Gelände und Nebelmeer).
  - Abwechslung: vier Arten (`KINDS`: Fichte, schlanke Fichte, Tanne, abgebrochen mit Stammstumpf), je Baum eigene
    Zweiglängen, schlank bis stämmig, etwas Schräglage, Farbe von Fichtengrün über bläulich bis olivfarben; Bestände
    mit höheren und niedrigeren Bäumen und kleine Lichtungen. Bäume ganz im Nebelmeer werden nicht gesetzt.
  - Verteilung (Rückmeldung des Nutzers: „zu nah aufeinander“, „eckig angehäuft, rundherum nur Nebel“): Standorte
    zufällig mit Mindestabstand (Poisson-Disk) statt in Ringen, Abstand schwankend, in Gruppen mit lichten Stellen,
    dazwischen sieht man den Waldboden. Das Gelände entsteht aus gedrehtem Wertrauschen (`smoothNoise`): Auf dem
    Gitter des Rauschens bildeten Kämme und Nebelmeer achsparallele, eckige Formen, nur ein Viereck um das Brett
    ragte aus dem Nebel. Gelände flacher abfallend, Nebelmeer tiefer: Der Wald reicht rundum weit hinaus.
  - Alle Bäume unter der Brettebene (`FOREST.tipMax`): Sie kommen nie zwischen Kamera und Spielfeld. Glühwürmchen
    über den Wipfeln. Bis 78 Einheiten verläuft alles ganz in den Dunst, sonst überdeckte die Himmelskugel (Radius 80)
    die Objekte mit harten Kanten. Die Sterne blenden im Wald aus.
  - Verworfen, aus der Reihe der Versuche: Stämme auf flachem Boden (von oben fast nur kahle Stämme), Bäume auf flacher
    Ebene (wirkt wie ein Muster), ausgestanzte Astflächen mit Canvas-Nadeltextur (ohne Kantenglättung pixelig und
    unruhig, dazu doppelt so teuer). Recherche dazu: Realismus kommt bei nebligen Wäldern von oben vor allem von
    Gelände, Nebel in den Tälern und Luftperspektive; für noch realistischere Bäume wären Impostors aus einem
    detaillierten Modell der nächste Schritt (Bibliothek für three.js vorhanden, Vorlage z. B. aus EZ-Tree).
  - Kostet beim Rendern etwas mehr als die Milchstrasse (Software-Rendering ~15–20 %).
  - Wechsel jetzt durch Dunkel: erst aus-, dann einblenden (je 0,45 s). Gleichzeitig lagen die undurchsichtigen Teile
    des Waldes, die aus Schwarz einblenden, als schwarze Flächen über dem Sonnensystem.
- [x] **2.22 20 mittelschwere Level** (Wunsch des Nutzers, 10. Oktober: Schwierigkeit etwa wie Level 20–40).
  Zusätzliche Pools der Stufen 3 und 4 (`tools/pools/mittel/`, 360 Level ab Seed 2 000 000) und die bisherigen Pools
  (7 der 20 stammen daraus), Vorauswahl von 32 Kandidaten
  (Wertung 20–37, Qualitätsregeln, symOverlap < 0.5 gegen alle 80 und früher verworfene Level ausgeschlossen). Review
  durch zwei Tester (`tools/pools/mittel/review/`, nicht versioniert): Spielersicht (A) und Spielermodell aus Review 2
  (B, Rangkorrelation 0.95 mit der heutigen Reihenfolge L15–L50). Einig bei 13; dazu 7 mit gutem Urteil von A
  (K02, K03, K07, K08 eher am unteren Rand, K23, K28, K30 oben). Verworfen: zerfallende Level, wirkungslose Filter, zu dicht,
  Kombinator nur als Umlenker. K13 („Farbkreis“) ohne seine zwei wirkungslosen Filter. Einsortiert nach dem Modellwert
  von B zwischen die Level 16 und 68, je höchstens 2 Plätze verschoben, damit die Mittelwerte je 10 Level steigen und
  nie mehr als 2 neue hintereinander stehen. Die bisherigen Level behalten ihre Namen (Speicherschlüssel); neue Namen
  für die 20. `PROFILE_LEVELS` damals 70.
- [x] **2.23 Schwere Level markiert** (Wunsch des Nutzers, 10. Oktober): Feld `difficulty` – „schwer“ für die
  bisherigen Level 50–70 (damals 70–90, heute 120–140), „sehr schwer“ für die bisherigen 71–80 (damals 91–100,
  heute 141–150, vom Spielermodell auf Denkaufwand gesiebt). Kopfzeile: Rauten und Text hinter dem Namen
  (◆ Schwer, ◆◆ Sehr schwer; auf dem Handy nur die Rauten), Levelauswahl: Rauten oben rechts auf der Kachel,
  Seitentitel z. B. „Level 141 – 150 · Sehr schwer“, wenn die ganze Seite gleich markiert ist. Farben `--hard` (bernstein) und `--very-hard` (rötlich). Gespeichert in
  `tools/selection.jsonl`, von `curate.mjs` übernommen; Tests prüfen, dass die Markierung nie abfällt und alle
  gehärteten Level trägt.
- [x] **2.24 50 mittelschwere Level** (Wunsch des Nutzers, 10. Oktober: Schwierigkeit wie Level 40–69,
  abwechslungsreich). Zusätzliche Pools in `tools/pools/mittel2/` (nicht versioniert, `generate.mjs` mit Seeds ab 3 000 000: Stufe 4
  alle Mischungen je 80, Stufe 5 misch/prisma/bunt, Stufe 3 misch/prisma/bunt; Dateien mit Präfix `b-` aus einem
  zweiten Lauf ab Seed 4 000 000, Stufe 4 je 300, Stufe 3 je 120). Aus 3421 Kandidaten aller Pools blieben 164
  (Wertung 26.5–42, Qualitätsregeln, kein Zerfall in der Lösung – Quellen teilen ein drehbares Element oder ein Ziel –,
  keine wirkungslosen Filter, symOverlap < 0.5 gegen alle Level, die Kandidaten von 2.22 und untereinander); Vorsieb
  mit dem Spielermodell (ohne Teilrätsel und Startziel, Modellrang ab L36): 85 Kandidaten. Review
  (`tools/pools/mittel2/review/`, nicht versioniert): drei Tester aus Spielersicht (A1–A3, je ein Drittel, gemeinsame
  Anker L40 ≈ 7, L69 ≈ 9) empfahlen 57; das Spielermodell (B, Rangkorrelation 0.96 an L30–L70) ordnete ein und
  prüfte die Abwechslung (Grundmuster höchstens 2 je 10, Dopplungsfamilien der Tester mindestens 10 Plätze
  auseinander, Rot+Grün=Gelb nur zweimal). Nur von A empfohlene Kandidaten, einsortiert zwischen die damaligen
  Level 40 und 69 (heute 40–119), höchstens 3 neue hintereinander, die Mittelwerte der Wertung je 10 Level steigen
  mit den exakten Testwerten um mindestens 0.11. Kompromisse für 50 statt sauberer etwa 40: drei Kombinatoren nur
  als Umlenker (K69, K84, K85 – für L60–L69 fehlte anderes Material), fünf Prismen mit nur einer Grundfarbe, vier
  Level mit in der Lösung getrennten Quellwegen. Neue Namen für die 50, `PROFILE_LEVELS` jetzt 120. Levelauswahl:
  Seitenreiter schon unter 640 px in Reihen zu 4 (16 Seiten).
- [x] **2.25 Vierter Hintergrund: Meer und Küste bei Sonnenuntergang** (Wunsch des Nutzers, 11. Oktober: Meer/Strand,
  Sonnenuntergang, sehr hochwertig; das Brett schwebt vor der Küste, beim Drehen soll man Meer und Küste sehen).
  Der Knopf schaltet jetzt Milchstrasse → Sonnensystem → Wald → Strand (`skyTheme.order`).
  - Aufbau: Das Brett schwebt über einer flachen, türkisen Lagune; in der Ausgangsansicht liegt der Strand dahinter,
    links eine felsige Landzunge, nach vorn eine Kante ins tiefe Blau. Hinter dem Strand eine niedrige Düne, dann
    Bewuchs. Die Sonne steht gut 12° hoch über dem Meer rechts (`BEACH.sun`): Streiflicht auf dem Strand, und zur
    Sonne hin glitzert das Wasser.
  - Die Kamera blickt nie über den Horizont – den Himmel sieht man nur gespiegelt. Das Meer ist kein Netz mit Wellen,
    sondern wird pro Pixel gerechnet (`BEACH_GLSL`); aus dieser Höhe bringt verschobene Geometrie wenig, Form und Licht
    der Wellen viel. Feine Wellen aus einer kachelbaren Normal-Map (`createWaveTexture`, beim Bauen gerechnet),
    Fresnel-Spiegelung des Himmels und Glitzern der Sonne (Beckmann). Die Streuung der Steigungen kommt aus den Mipmaps
    der Normal-Map (Länge der gemittelten Normalen): In der Ferne wird das Glitzern zu einem breiten Schimmer.
  - Dünung und Brandung (Rückmeldung des Nutzers: „Wellen und wie das Wasser auf den Strand fällt sehen schwach aus“):
    `swellHeight` gibt den Wasserstand je Tiefe – draussen eine runde Welle, im Flachen höher und steiler (Shoaling),
    nie höher, als das Wasser tief ist; sie bricht und läuft als Walze (`bore`: vorn steil, hinten flach) ans Ufer.
    Wellengruppen (`swellSet`):
    mal höhere, mal niedrigere, entlang der Küste versetzt. Im Flachen drehen die Fronten parallel zum Ufer
    (Refraktion, `shorePhase`/`swellDir` mit Abstand und Gefälle zur Wasserlinie je Ecke, `aDir`; dazu ein Ausgleich je
    Ecke, der beide Masse in der Mitte des Übergangs gleichsetzt – ohne ihn liefen die Wellen entlang der Küste
    stellenweise gestaucht, gedehnt oder gar seewärts, gefunden im Review). Die Normale kommt
    aus dem Gefälle von `swellHeight` – die steile Front der Walze spiegelt sichtbar anders.
  - Wo Wasser steht, entscheidet der Wasserstand pro Pixel (nicht das Gitter): Das Gelände zeichnet darüber Meer,
    Walze oder Film – unter Wasser über den Blick bis zur Oberfläche (an der getroffenen Stelle nachgebessert); Rot wird
    zuerst geschluckt (`ABSORB`), der Sand schimmert türkis durch, Lichtnetz (Kaustik) im Flachen. Draussen rechnet die
    Himmelskugel den Strahl bis zur Wasserfläche mit denselben Funktionen, daher ohne sichtbaren Rand. Alles verläuft
    bis 77 Einheiten in den Dunst.
  - Schaum (siehe auch den Abgleich mit Referenzen): ein schmaler dichter Kern am brechenden Kamm, dahinter ein
    Schaumfeld mit runden Löchern, das seewärts zu Fäden ausdünnt, in Strömungsrichtung gestreckt; auf dem Film nur
    eine Schaumrolle am dünnen Rand; ein Saum um die Felsen. Durch die steile Front und die Kämme scheint türkises
    Licht.
  - Auflaufen (Rückmeldung: „die auf den Sand treffenden Wellen massiv verbessern“): Erreicht eine Walze die
    Wasserlinie, schiesst sie als dünner Film den Strand hinauf, wird langsamer, bleibt stehen und fliesst
    beschleunigt zurück – wie ein geworfener Ball (`swashLevel`, Parabel im Takt der Walzen an der Wasserlinie).
    Jede Welle läuft verschieden weit, entlang des Strands versetzt (`swashReach`). Beim Hinauflaufen trägt der
    Film vorn eine Schaumrolle; beim Zurückfliessen wird er glatt und durchsichtig. Am höchsten Punkt bleibt ein
    Schaumsaum liegen und zerfällt, darüber dünne Spülmarken früherer Wellen (Höhe nach der Wellengruppe beim
    Eintreffen der jeweiligen Welle, `waveEnv` – sonst wanderten sie mit der Zeit); der Sand glänzt, solange er eben überspült war
    (`swashLeaves`: wann das Wasser die Stelle freigab), und bleibt dunkel bis über die höchsten Wellen, darüber
    ein Spülsaum. Strandsicheln (Beach Cusps): Die Wasserlinie bildet regelmässige Bögen.
  - Licht: Das Gelände wirft weiche Schatten (beim Bauen je Ecke zur Sonne hin abgetastet, Höhengitter). Kronen,
    Palmen und Felsen werfen scharfe, lange Abendschatten über eine Schattenkarte aus Sonnenrichtung (2048², einmal
    beim Bauen gerendert, `objectShadow`): auf Sand, Wasser und aufeinander. Mikrorelief und Windrippel im Sand
    werfen im Streiflicht kleine Schatten, in der Ferne ausgeblendet.
  - Bäume und Palmen (Rückmeldung: „Strand, Bäume und Felsen sehen schwach aus“): Laubkronen als Kugeln, in grossen
    und kleinen Ballen verbeult (wie Blumenkohl, Normale aus Nachbarpunkten), Blattbüschel mit dunklen Lücken,
    Gegenlicht am Rand (`treeAt`, je Zelle höchstens ein Baum). Davor Palmen am Dünenrand, in Gruppen, zum Meer
    geneigt (`createPalmGeometry`): gebogener Stamm mit Ringen, 13 Wedel aus schmalen, hängenden Blättchen, die
    unteren dürr; gegen die Sonne scheinen sie durch, sie wiegen sich leicht.
  - Felsen: Blöcke (`createRockGeometry`, mit Grat-Rauschen kantig verbeult) auf einem niedrigen Sockel im Gelände
    (der Sockel gibt den Schaum im Wasser). Schichten, Spalten, oben Flechten, um die Wasserlinie Algen und Nässe,
    unter Wasser in der Wasserfarbe mit der Spiegelung darüber, Gischt im Takt der Wellen. Der Wasserstand am Fels
    folgt Phase, Brandung und Auflaufen des Wassers daneben (je Block Abstand zur Wasserlinie und Ausgleich der Phase).
  - Schattenkarte: nur dort abgefragt, wo man den Boden sieht (nicht unter tiefem Wasser); nach einem verlorenen
    Grafikkontext neu gezeichnet (sonst läge der Strand im Schatten). Palmen nur bis 9,5 vor der Wasserlinie (sonst
    ragten sie in die Kronen).
  - Abgleich mit Referenzen (Wunsch des Nutzers: im Internet nach Bildern und Videos suchen und genau analysieren):
    freie Luftbilder und Videostandbilder von Wikimedia Commons (Brandung von oben, Swash-Linien, Strände bei tiefer
    Sonne), dazu Recherche zu Brandungsphysik und Spieletechnik (Horizon Forbidden West, Sea of Thieves, Lagarde zu
    nassen Oberflächen). Daraus: Schaum als Flächentextur mit Auflösung (`createFoamTexture`, `foamDissolve`: frisch
    geschlossen, dann gehen runde Löcher auf, dann Fäden – ein Netz aus Zellwänden wirkte wie gesprungene Farbe);
    an der brechenden Front ein schmaler dichter Kern, dahinter ein Schaumfeld, das seewärts ausdünnt, Lücken entlang
    der Front (nicht jede Welle bricht überall), ein dunkler Streifen vor der Front; Trübung in der Brandungszone
    (aufgewirbelter Sand, khaki); Auflaufen asymmetrisch (Umkehr nach etwa 40 % des Zyklus), lappige Front, Schaum nur
    als Rolle am dünnen Rand, der Film sonst durchsichtig, ohne Lichtnetz; Spülmarken früherer Wellen, bis eine höhere
    sie wegspült; ein immer glänzendes, wassergesättigtes Band; Sand ohne Vorzugsrichtung (wirkte wie Sackleinen);
    Himmel und Spiegelung entsättigt (gegen die Sonne golden-grau statt kupfern, sonst schiefergrau statt violett),
    feine Rippel statt marmorierter grosser Wellen, Sonnenreflex breiter.
  - Unschönheiten aus Bildern des Nutzers (11. Oktober): (1) gegen die Sonne eine gerade Naht im Wellenmuster – der
    Ausgleich der Phase hing vom kleinräumigen Rauschen der Uferlinie ab, über den Hebel bis zur Mitte des Übergangs
    wurde daraus ein Sprung entlang einer Dreieckskante; jetzt nach dem grossräumigen Küstenverlauf (über ±4 geglättet),
    das Rauschen je Ecke abgezogen, der Hebel begrenzt (sonst liefen die Wellen an der Flanke der Landzunge seitwärts).
    Dazu: Wo eine Welle laut den Lücken nicht bricht, bleibt sie rund (vorher steile Front ohne Schaum – spiegelte als
    lange Linie). (2) Ganz untergetauchte Felsblöcke wirkten wie dunkle Klumpen: Blöcke nur, wo sie aus dem Wasser
    ragen; Schaum über dem Felssockel lockerer.
    (3) Die Sandbank in der Lagune (dort brach jede Welle ein zweites Mal) lief als gleichförmiger Wulst mit
    Brandungsstreifen die ganze Küste entlang: entfernt (Entscheid des Nutzers); der Grund fällt gleichmässig ab, die
    Wellen brechen nur am Ufer.
  - Verworfen, aus der Reihe der Versuche: Kronen als Buckel im Gelände (auf dem Gitter spitze Pyramiden),
    Grasbüschel aus der Rauschtextur (sichtbare Kachelung, Flecken), ein breiter Sandstreifen bis zum Wald (wirkte
    wie Wüste, der Wald lag im Dunst), Felsen aus Graten (Pyramiden), Schaumgeflecht überall (Netz über der Lagune),
    flaches Meer mit Wellen nur in den Normalen und Auflaufen als Färbung des Sandes (wirkte schwach), glatte
    Kugelkronen (Moosbälle), Palmenblättchen als breite Dreiecke (wirkten wie Farn), ein Rissnetz auf den Felsen
    (wie ein Schildkrötenpanzer), Felsen nur als Höhenfeld (glatte Pyramiden).
  - Gebaut erst bei der ersten Wahl (`beach.prepare`, mit Übersetzen der Shader und der Schattenkarte, vor dem
    Ausblenden; dazu die Schaumtextur): ~0,8 s im
    Software-Rendering, die meiste Zeit das Höhengitter für den Schatten (Fels-Rauschen nur, wo Fels sein kann). Ist
    der Strand gespeichert, verzögert das den Start entsprechend (auf dem Handy wohl um eine Sekunde).
    Kosten beim Rendern nicht verlässlich gemessen (die Messungen im Software-Rendering streuten stark; grob 25–30 %
    mehr als die Milchstrasse, zuletzt ~30 %). Bodentexturen, Kaustik und Schaum nur im Flachen. Dreiecke: Kronen ~200 000, Felsen
    ~45 000, Palmen ~75 000, Gelände ~160 000 – auf schwachen Handys zu prüfen.
  - Die Spiegelung der Platte stellt den Hintergrund danach wieder her, wie er war (beim Strand ausgeblendet).
- [x] **2.26 Wald: Nebelmeer bei Mondnacht** (Wunsch des Nutzers, 11. Oktober: den Wald nach Bildern und Videos so
  realistisch und hochwertig wie möglich machen). Recherche mit drei Agenten: Technik (Impostors, Crysis-Vegetation,
  Purkinje-Verschiebung nach Ghost of Tsushima, Höhennebel nach Quilez), Luftbilder nebliger Fichtenwälder von
  Wikimedia Commons im Vergleich mit unseren Bildern, Farben bei Mondlicht und Nebel gemessen. Leitbild: ein
  mondbeschienenes Nebelmeer, aus dem dunkle Fichtenkämme ragen (Commons „Dance of the Fog“, Schwarzwald-Drohnenbilder).
  - Werte umgekehrt: Vorher waren Himmel, Dunst und Bäume gleich dunkel, nichts hob sich ab. Jetzt ist der Nebel die
    hellste grosse Fläche (vom Mond von oben beschienen, zum Mond hin dazu Vorwärtsstreuung), der Dunst wird mit der
    Entfernung heller (Luftperspektive), die Bäume sind fast schwarz und kaum noch grün, ihre dem Mond zugewandten
    Seiten silbrig. Dunst nach der Entfernung vom Brett, nicht von der Kamera – im Hochformat steht sie weiter weg, und
    alles lag im Dunst.
  - Nebelmeer höher (`FOREST.fogY`): füllt die Täler schon nahe am Brett. Oberfläche mit langsam ziehenden Schlieren
    und Wogen, vom Mond schräg beschienen; darüber Schwaden, in denen die tieferen Wipfel halb verschwinden. Gelände
    und Bäume knapp darüber gehen in die Farbe des Nebels an derselben Stelle über (samt Schatten), ohne Rand.
  - Schattenkarte des Mondes (gemeinsamer Baustein mit dem Strand: `bakeShadowMap`, `shadowGLSL`): Bäume und Kämme
    werfen lange Schatten auf die Nachbarn, den Boden und das Nebelmeer (dort weich, `objectShadowSoft` – der Nebel
    streut das Licht, hart wirkten die Schatten treppig).
  - Fichten schlanker (gut dreimal so hoch wie breit) mit Leittrieb, Etagen gedreht, mit eigenem Radius und vielen
    ungleich langen Zweigspitzen (gleichmässige Etagen wirkten wie Weihnachtsbäume); kleiner und dichter, 15 % junge
    Bäume, weniger abgebrochene; je Art zwei Formen; draussen eine einfache Form. Gegenlicht am Kronenrand, wenn der
    Mond hinter dem Baum steht.
  - Himmel: oben tiefblau, zum Horizont der Dunst, um den Mond ein Hof (vom Rand an alle 1,5 Radien halb so hell, wie auf Fotos);
    einige Sterne bleiben (nur über dem Horizont). Glühwürmchen gelbgrün, klein mit weichem Schein, kurz an und lange aus, zwischen den Wipfeln.
  - Erst bei der ersten Wahl gebaut (`forest.prepare`, ~0,5 s im Software-Rendering); vorher beim Start. Kosten beim
    Rendern etwa wie die Milchstrasse (Software-Rendering, Messung streute).
- [x] **2.27 Wald: Impostor-Fichten und volumetrischer Nebel** (Rückmeldung des Nutzers: „Die Idee ist cool, aber die
  Grafik könnte besser sein“; er wählte beides, Fichten zuerst).
  - Fichten als Impostors (`IMPOSTOR`, `createSpruceGeometry`, `bakeImpostor`): beim Bauen eine detaillierte Fichte
    (Stamm, 20 Astquirle mit 5–7 Ästen in zwei Lagen, je Ast 18 hängende Zweige, Leittrieb; Verdeckung in den Farben)
    aus 64 Blickwinkeln (16 rundum × 4 Höhen, 10–70°) in zwei Tafeln gerendert: Farbe mit Deckung, Normale und Tiefe
    (8 × 8 Ansichten zu 256 Pixeln, auf dem Handy 128). Jeder Baum ist eine zur Kamera gedrehte Fläche, nur so breit
    wie die Krone, die die vier nächsten Ansichten überblendet; Licht aus den Normalen, Schatten und Dunst am Punkt aus
    der Tiefe, die Tiefe auch ins Bild geschrieben (`gl_FragDepthEXT`) – sonst schnitten sich benachbarte Flächen in
    geraden Linien. In der Schattenkarte zum Mond gedrehte Flächen. Abwechslung über Drehung, Grösse, Wuchs und Farbe.
    Die Etagen-Kegel und die Baumarten sind weg (auch die abgebrochenen Bäume).
  - Volumetrischer Nebel (`createVolumetricFog`, Prototyp von einem Agenten): Sichtstrahl durch ein Nebelband um
    `FOREST.fogY` in halber (Handy: Viertel-)Auflösung, 16 (10) Schritte mit Versatz, Dichte aus Schlieren und Wogen
    (3D-Rauschen aus einer 2D-Textur), Mondlicht mit Vorwärtsstreuung, Schattenkarte je Schritt (Schattenbahnen),
    Selbstschatten; danach geglättet und im letzten Bildschritt tiefengewichtet hochskaliert und gemischt. Braucht die
    Szenentiefe (Tiefentextur am Composer-Puffer, ohne Mehrspeicher). Ohne Tiefentexturen bleibt das flache Nebelmeer.
    Bäume jetzt bis 2 Einheiten unter der Nebelobergrenze gesetzt (der Nebel sinkt zwischen den Bänken tiefer).
  - Kosten: Software-Rendering etwa doppelt so viel wie die Milchstrasse (Messung streute stark); auf echten Handys zu
    prüfen (`?perf`). Speicher: Tafeln 2 × 21 MB mit Mipmaps und 2 × 8 MB Tiefenpuffer vom Backen (Handy
    ~14 MB zusammen); Nebelpuffer bei 1080p 8 MB, bei 1440p ~15 MB (Handy 2,5 MB). Nach verlorenem Grafikkontext neu
    gebacken. In der Ferne tiefere Schwelle der Deckung (sonst dünnten die Bäume in den kleinen Mipmaps aus).
- [x] **2.28 Wald: Flackern behoben, Bäume detaillierter, Hügel** (Rückmeldung des Nutzers: „gewisse Bäume flackern
  (wahrscheinlich weil sie halb im Nebel sind)“, Bäume und Hügel detaillierter).
  - Flackern gemessen statt geraten: zwei Bilder mit eingefrorener Zeit, die Kamera um Bruchteile eines Pixels
    verschoben (eine grössere Verschiebung bewegt detailreiche Ränder ohnehin), Pixel mit grossem Sprung gezählt.
    Ursache war ein Rundungsfehler: Die Nummer der Ansicht in der Bildtafel kam interpoliert als 14,99999 statt 15 an,
    eine winzige Bewegung genügte, und ganze Bäume zeigten eine falsche Ansicht – vor hellem Nebel am auffälligsten.
    Jetzt gerundet (`impostorUV`); im Wald springen statt Tausenden noch etwa 20 Pixel.
  - Dazu stabilisiert: alle Abrufe der Bildtafel vor jeder Verzweigung (in verzweigtem Programmfluss ist die Wahl der
    Mipmap-Stufe nicht definiert), Ränder weich (Bäume gemischt, von hinten nach vorn sortiert, wenn sich die Kamera
    merklich bewegt hat), Deckung, Normale und Tiefe aus einer leicht weicheren Stufe, der Nebel je Texel bis zur
    nächsten und zur fernsten Tiefe gerechnet (`VOLFOG_ZRANGE_FRAGMENT`; jedes Pixel mischt nach seiner Tiefe –
    Lücken zwischen Nadeln bekommen den Nebel dahinter, die Nadeln ihren eigenen).
  - Bäume: Ansichten eng um die Krone gerahmt (doppelte waagrechte Auflösung bei gleichem Speicher), 26 Astquirle,
    je Ast 13 Zweige als Nadelbüschel mit Seitentrieben.
  - Hügel: Kuppen, Mulden und Felsrippen im Gelände, feineres Netz; Waldboden aus Nadelstreu und Moos mit feiner
    Unebenheit, an steilen Stellen Fels mit Rissen (dort keine Bäume), Kontaktschatten der Kronen am Boden
    (Dichtekarte beim Bauen); moosbewachsene Granitblöcke an Hängen und in Lichtungen, mit Mondschatten.
  - Kosten (Software-Rendering, streuend): etwa doppelt so viel wie die Milchstrasse; der Nebel wird zweimal gerechnet
    (nah und fern), in niedriger Auflösung. Umschalten ~0,65 s.

- [x] **2.29 Wald als Skybox aus Blender** (Wunsch des Nutzers, 12. Oktober: die Wald-Skybox in Blender bauen, gleiches
  Setting, „qualitativ massiv hochwertiger“; nach dem ersten Versuch: „die aktuelle Wald-Skybox durch die neue ersetzen“).
  - Szene in Blender 5.2 mit Cycles (`tools/blender/`; die Skripte bauen sie reproduzierbar, die .blend ist nicht
    versioniert): ein Grat von West nach Ost (zum Mond hin) unter dem Brett, Täler mit Nebelmeer, Kämme ragen heraus,
    fern höhere Berge. Rund 245 000 Fichten aus 7 detaillierten Modellen (Quirle, hängende Zweige, Seitentriebe; fern 3
    einfache), Volumennebel mit weichem Saum und Schwaden, Dunst in zwei Schichten, Mond als Sonnenlampe in der
    Richtung von `FOREST_MOON`, Himmel mit Hof und Sternen.
  - Ausgabe: ganzes Equirect 4096 × 2048, drei Streifen je 4096 × 3413 für den Blick nach unten (Breite +10° … −90°,
    rund 34 px/°), Tiefe 1024 × 512. Farben linear mal Belichtung, sRGB-kodiert; ACES macht das Spiel wie bei allem.
    Rendern rund 33 Minuten (RTX A2000).
  - Im Spiel (Abschnitt WALD): `backgrounds/forest.js` (1,5 MB: ganzes Bild und Tiefe) und `backgrounds/forest-hd.js`
    (5,8 MB: Streifen, nur Desktop) als Data-URLs, weil Chrome Bilder aus file:// nicht in WebGL-Texturen lässt; erst
    bei der Wahl geladen und dann eingeblendet. Das Panorama liegt auf einem Netz um seinen Mittelpunkt, jede Ecke im
    Abstand der geglätteten Tiefe: So stimmt die Parallaxe beim Kreisen der Kamera. Service Worker: `forest.js` vorab,
    `forest-hd.js` erst beim ersten Gebrauch (`LAZY`).
  - Entfernt: Gelände, Impostor-Fichten, Glühwürmchen und volumetrischer Nebel des bisherigen Walds (2.21, 2.26–2.28;
    im Verlauf von git). Die Himmelskugel zeigt Mond und Dunst, solange das Panorama lädt (in der Spiegelung wird sie
    ausgeblendet; seit 2.32 A zeigt sie stattdessen einen im Panorama gemessenen Farbverlauf).
  - Grenzen: Die nahen Bäume an den Brettkanten stehen schräg, weil die Kamera sie aus einem anderen Winkel sieht als
    der Mittelpunkt des Panoramas; im Hochformat fächern sie wie ein Strahlenkranz. Alles steht still. Grafikspeicher
    rund 270 MB auf dem Desktop, rund 45 MB auf dem Handy. Auf Render muss der Build Command `backgrounds/` kopieren.
- [~] **2.30 Wald: nahe Bäume und Bewegung** (13. Oktober, Nutzer: „einige Bäume wirken verzerrt oder verbogen, je nach
  Blickwinkel“; Mischform gewählt, Empfehlung A).
  - [x] Mischform: Die Fichten näher als 60 m am Brett (`R_NEAR`, rund 1460) fehlen im Panorama; in Blender stehen sie
    im eigenen Objekt „Baeume nah“, für die Kamera ausgeblendet, ihre Schatten fallen aber auf den Boden. Das Spiel
    zeichnet sie als 3D-Fichten (`buildTrees`): einfache Stufen-Fichten aus Blender (`tools/blender/wald_spielbaum.py`,
    4 Modelle mit je rund 500 Dreiecken, gezackte, hängende Astkränze im Umriss der Blender-Fichten), Toon-Licht in den
    Farben der gemalten Bäume, Mondlicht je Baum unten und oben (Schatten von Kämmen und Nachbarbäumen, in Blender
    gerechnet). Damit ist auch der Strahlenkranz im Hochformat weg (das waren diese Bäume).
  - [x] Nebel auf den 3D-Fichten (13. Oktober, Nutzer: „Bäume an der Nebelgrenze wirken, als würden sie schweben, kein
    sauberer Übergang“): Blender liefert je Baum die Oberkante des Nebels; der Shader summiert die Dichte der Szene
    (weicher Saum und Kern, je eine Rampe) entlang des Blicks auf. Bäume am Rand des Nebelmeers versinken darin wie im
    Panorama.
  - [x] Ein leicht ziehender Nebelschleier: zwei durchscheinende Lagen knapp über der Nebeloberkante, Schwaden treiben
    mit dem Wind und verändern sich; Kämme verdecken sie (Tiefentest), so bleiben sie in den Tälern.
  - [x] Glühwürmchen zwischen den nahen Fichten (wie im früheren Wald, 2.21): die einzigen warmen Lichter.
- [~] **2.31 Wald im Anime-Stil** (Wunsch des Nutzers, 12. Oktober: Comic-Stil 11 „Anime-Hintergrund/Ghibli“, nur der
  Hintergrund, das Brett bleibt wie es ist). **E:** Anime, realistisch oder beide als eigene Hintergründe?
  - Gleiche Szene mit `WALD_STIL=anime` (hellere Nadeln mit Toon-Licht, Wolken; Renderings in `out/anime/`), gemalt in
    `tools/blender/anime.py`: Farbverlauf Indigo → blaugrün → hellblau, Pinselstriche (Kuwahara des Kompositors, in
    Stücken), Leuchten um Nebel und Mond, gemalter Himmel mit Mond, Wolken und Sternen über der Himmelsmaske, Gamut-
    Abbildung vor der Rückrechnung durch ACES. Malen rund 6 Minuten, ohne neues Rendern. Streifen mit 24 Samples.
  - 13. Oktober: Der hellste Nebel war heller als Weiss gespeichert (GAIN 2) und brachte den Bloom des Spiels zum
    Leuchten: ein milchiger Schleier über dem Brett, wenn die Kamera Richtung Nebel gedreht ist. Jetzt drückt eine weiche
    Schulter am hellsten Kanal alles unter den Szenenwert 0,95 (`PEAK`), der Nebel bleibt hellblau; `uGain` ist weg.
  - Eingebaut ist die Anime-Fassung (seit 2.32: `node tools/blender/pack.mjs forest`; die realistische Fassung bräuchte
    ein eigenes `tools/blender/szenen/<id>/skybox.json`, siehe 2.32 D).
    Download 6,2 MB auf dem Desktop (realistisch 7,3 MB), 1,5 MB auf dem Handy.
  - Grenzen wie 2.29. In beiden Fassungen ist die Kopfzeile vor hellem Nebel schwer lesbar (Idee: feiner dunkler
    Schatten unter der Schrift).
  - 13. Oktober, Nutzer: „weniger Nebel, die Bäume nicht so dicht aufeinander, aktuell eher ein grosser grüner Brei“.
    Nebelmeer 5 m tiefer (`FOG_DROP`) und dünner (`FOG_CORE` 0,3 statt 0,5), Dunst halb so dicht; Bäume im Raster 2,1 m
    statt 1,08 m (fern 2,6 statt 1,45), Lichtungen dünnen nur aus (`STAND`): rund 90 000 statt 245 000 Fichten. Der
    Boden ist im Anime-Stil heller und grüner (Wiese), damit sich die Bäume abheben. Gearbeitet über den Blender-MCP
    (`tools/blender/wald_mcp.py`); die realistische Fassung ist mit diesen Werten nicht neu gerendert.
  - 13. Oktober, Nutzer: „Untergrund und Berge überarbeiten, die Kulisse wirkt leblos und karg“. Gebirge am Horizont
    (ab gut 1 km schroffe, breite Massive bis gut 400 m, Schnee über rund 230 m; nah ändert sich am Gelände nichts),
    Boden mit Flecken aus Heide und Moos, im Anime-Stil dunkler und grüner (vorher gemalt wie Schnee), Fels dunkel,
    ferner Wald in Beständen und nur unter der Baumgrenze. Unterholz (`Unterholz`, rund 11 000): junge Fichten und
    breite, niedrige Nadelbüsche aus den einfachen Fichten, Felsbrocken mit Moos (an Hängen mehr). Erste Büsche als
    glatte Klumpen sahen gemalt wie Kiesel aus.
- [~] **2.32 Skybox-Baukasten** (Wunsch des Nutzers, 13. Oktober: „so aufbauen, dass auch in Zukunft möglichst einfach
  neue Skyboxen aus Blender hinzugefügt werden können“). Konzept zusammen mit einem Architektur-Agenten, gegenseitig
  geprüft: https://claude.ai/artifact/CLbC5mjKdYPih7dNoHWtCJ. Ziel: Eine neue Skybox ist ein Ordner
  `tools/blender/szenen/<id>/` (`skybox.json`, `szene.py`) und ein paar Befehle (bauen, rendern, packen, prüfen), ohne
  Änderung an `index.html`, `sw.js` oder den Tests, solange die vorhandenen Ebenentypen reichen.
  - Vertrag: je Skybox ein Manifest im Register `backgrounds/skies.js` (von `pack.mjs` erzeugt; ersetzt nur den Eintrag
    der gepackten Skybox, weil die Rohdaten der anderen nicht im Repo liegen), Daten in `backgrounds/<id>/` mit
    Versionskennung im Dateinamen (`base.<rev>.js`, `hd.<rev>.js`; `sw.js` wirft Query-Parameter beim Cache-Schlüssel
    weg, `?v=` brächte gemischte Stände). Spielkonstanten, die Blender braucht, in einem `CONTRACT`-Block in
    `index.html` (Phase B).
  - [x] **A Spiel und Packen** (13. Oktober): `?sky=<id>` wählt den Hintergrund, `?t=<s>` hält die Zeit an und macht den
    Zufall fest (zwei Aufnahmen fallen gleich aus; `tests/screenshot.mjs` mit `QUERY=…`, frischem Profil und Warten auf
    `__prisma.skyReady()`). Register mit einer Mischregel gegen einen Neutralzustand statt Sonderfällen in `skyTheme`
    (es ist immer höchstens ein Hintergrund eingeblendet); Milchstrasse, Sonnensystem und Strand als Einträge aus dem
    Code. `createPanoramaSky(manifest)` und die Ebenentypen `toonInstances`, `glowParticles`, `mistSheets` aus dem
    Waldcode, die Werte (Palette, Dunst, Wind, Glühwürmchen) jetzt in `tools/blender/szenen/forest/skybox.json`; die
    Mondrichtung kommt aus der Blender-Szene. Platzhalter beim Laden: 9 Farbringe nach Höhe, gemessen im fertigen
    Panorama (der handgemachte Waldhimmel ist weg, der Mond erscheint erst mit dem Panorama). `anime.py json` schreibt
    `sky.json` jetzt selbst (vorher las es Mittelpunkt und Tiefenbereich aus der realistischen Fassung), mit Hauptlicht,
    hellstem Wert (0,92) und Farbringen. `pack.mjs <id>` schreibt `backgrounds/<id>/base.<rev>.js`, `hd.<rev>.js` und
    den Eintrag im Register, löscht alte Stände und prüft alles mit `tools/sky-schema.mjs`. `sw.js` liest seine Listen
    aus dem Register (`importScripts`) und räumt beim Aktivieren alte Stände weg; registriert mit
    `updateViaCache: 'none'`; `SKIES` in `sw.js` (Stand des Registers, von `pack.mjs` nachgeführt) sorgt dafür, dass
    jeder Browser ein neues Register holt. Grafikspeicher: Eine ausgeblendete Skybox gibt ihn frei, auf dem Handy
    sofort, sonst nach 30 s (`skyTheme.keep`; wer mit H durchschaltet, kommt bald wieder vorbei), und immer sofort, wenn
    eine andere Skybox aus Blender gewählt ist (nie zwei Panoramen zugleich; gemessen: Texturen und Geometrien weg, beim
    Zurückwechseln wieder da). `?sky=` ändert die gespeicherte Wahl nicht. Tests: Register gültig (auch die Parameter
    der Ebenen), Stand in `sw.js`, jeder Teil in `sw.js`, nichts Verwaistes, `index.html` lädt Hintergründe nur über das
    Register; der Offline-Test zeigt den Wald auch offline (mit Streifen). Vergleich vorher/nachher (altes `index.html`
    mit denselben URL-Parametern, Kamera fest gesetzt): alle vier Hintergründe auf Desktop und Handy und der gedrehte
    Wald im Hintergrund pixelgleich; abweichend nur der Leuchtring des drehbaren Spiegels, dessen Animation
    unabhängig von der angehaltenen Zeit läuft.
    Review: `pack.mjs` prüft jetzt vor dem Schreiben (vorher konnte ein fehlerhafter Eintrag ins Register gelangen und
    das Spiel schwarz lassen), das Spiel überspringt einen unbrauchbaren Eintrag mit Warnung, eine fehlerhafte Ebene
    ebenso; `backgrounds/** -text` in `.gitattributes` (sonst stimmen nach einem Checkout unter Windows die Grössen im
    Register nicht mehr); fehlt `skies.js` auf dem Server, installiert sich der Service Worker trotzdem.
  - [ ] **B Blender-Kern:** `kern/` und `szenen/forest/`; Sammlungen `Spiel`, `Spielmodelle`, `Volumen` und ein Licht
    mit Eigenschaft `hauptlicht` statt Objektnamen; `CONTRACT`-Block; nahe Objekte allgemein aus `Spiel`;
    Palette und Dunstfarben im gemalten Bild gemessen; Prüfungen (Spitze, Parallaxe, Tiefe); Vorlage; Vorschauen auch
    in den Extremlagen der Kamera.
  - [ ] **C Qualität:** `tests/skies.mjs` (Aufnahme je Skybox auf Desktop und Handy, Budget, Speicherfreigabe);
    Abdunklung hinter der Kopfzeile je Skybox; Panorama 2048 fürs Handy; Begrenzung der Helligkeit ohne HDR (dort gilt
    die Bloom-Schwelle 0,8, der Anime-Nebel reicht bis 0,95).
  - [ ] **D Probe:** zweite Skybox ohne Codeänderung, etwa der realistische Wald als `forest-real`.
  - Render (13. Oktober): Der Build-Befehl kopierte `backgrounds/` nicht. Neu, vor dem Push von Phase A einzutragen:
    `mkdir -p dist && cp -r index.html sw.js manifest.webmanifest favicon.svg icons vendor backgrounds dist/`
    (`cp -r` nimmt die Unterordner mit, neue Skyboxen brauchen keine Änderung mehr). Der Nutzer hat ihn eingetragen,
    das Deployment lief.
- [~] **2.33 Strand als Skybox aus Blender im Anime-Stil** (Wunsch des Nutzers, 13. Oktober: „die Strand-Skybox
  überarbeiten, Stil wie beim Wald, also Anime/Ghibli“). Ersetzt den prozeduralen Strand (2.25, rund 1100 Zeilen in
  `index.html`, im Verlauf von git); die id `beach` bleibt (gespeicherte Wahl).
  - Szene `tools/blender/szenen/beach/szene.py` (`wald_mcp.neu('beach')`, rund 5 s): Bildaufbau wie 2.25 (Lagune ums
    Brett, Strand dahinter, Landzunge links, Sonne gut 12° hoch über dem Meer rechts), dahinter Dünen mit Gras,
    Palmen, Buschwald, grüne Hügel und Berge; Haufenwolken aus Metaball-Ballen (Volumen), Dunst; Himmel aus dem
    physikalischen Himmel von Blender, zum Horizont und zur Sonne hin wärmer. Unter Wasser färbt der Grund das Wasser
    nach Tiefe (Rot zuerst geschluckt), dazu Seegrasflecken und Sandrippel; die Wasserfläche ist durchsichtig und
    spiegelt nach Fresnel. Schatten nie schwarz: Boden und Pflanzen haben ein bläuliches Grundlicht, der Himmel leuchtet
    als Licht stärker, als die Kamera ihn sieht.
  - Was näher als 45 m am Brett steht (Palmen, Bäume, Büsche, Sammlung `Spiel`), zeichnet das Spiel als 3D-Modelle mit
    Farbe je Ecke (`toonInstances`, Palette als Faktoren); Sonnenlicht je Pflanze unten und oben in Blender gerechnet.
    Das Wasser ums Brett bewegt sich (`waterSurface`, neuer Ebenentyp): Kämme laufen parallel zum Ufer heran und
    brechen im Flachen zu Schaum, ein Saum läuft an der Wasserlinie hinauf und zurück, Gischt um die Felsen, Glitzern
    zur Sonne; dazu eine Karte aus Blender (Tiefe, Abstand zur Wasserlinie, Fels).
  - Für die zweite Szene allgemein gemacht (Teil von 2.32 B): Malstil und Belichtung je Szene in
    `tools/blender/stile.py` (der Wald bleibt bildgleich, geprüft), Sammlungen `Spiel` und `Volumen` statt Objektnamen
    in `wald_export.py`, `wald_mcp.neu/scene/skybox(stil)` für Szenen unter `szenen/<stil>/`, `pack.mjs` nimmt
    `ebenen.json` mit (Texte `file:…` werden Data-URLs). `wald_mcp.run` lädt die Hilfsmodule frisch (sonst galten
    geänderte Stile erst nach einem Neustart von Blender).
  - Unterwegs: Die tiefe Sonne wirft lange Schatten der nahen Pflanzen; der Wald dahinter lag darin schwarz (dicht und
    ohne Himmelslicht) – darum das Grundlicht. Ein Lichtnetz (Kaustik) aus Voronoi-Kanten wirkte wie Fliesen, verworfen.
    Warme, satte Töne (Sonne, ihr Spiegelbild) bräuchten zurückgerechnet in einzelnen Kanälen mehr als `PEAK`: Die
    Textur ist jetzt bei 0,91 gekappt (`TEX_MAX`, mit Spielraum fürs Überschwingen des JPEG), die Spitze wird über 3 × 3
    Pixel gemessen (einzelne JPEG-Ausreisser an Kanten zählen nicht). Die Wasserebene zeichnete am flachen Ufer über den
    Sand (das geglättete Netz des Panoramas verdeckte sie dort nicht): jetzt nur, wo die Karte Wasser meldet.
  - Übersichtsseite mit beiden Panoramen zum Drehen und Aufnahmen aus dem Spiel:
    https://claude.ai/artifact/2AASs7CcWz76rJtpLZq6V6
  - Erste Überarbeitung (14. Oktober, Vormittag): Sonne 7° statt gut 12° (`SUN_ELEV`), Himmelsfarbe als Knotengruppe
    `Himmelsfarbe` (rundum warmer Horizont, zur Sonne orange, gegenüber rosa, oben leicht violett, Hof um die Sonne),
    Luftperspektive je Material statt Dunst als Volumen (das rauschte, der Himmel war fleckig; Gruppe `Luft`),
    Malrauschen je Szene (`stile.py` `rauschen`), Felsen in Schichten mit Absätzen und Rissen (dunkler Basalt). Der
    Nutzer verwarf das Gesamtbild („sieht nicht gut aus“), lobte aber die Felsen.
  - Zweite Überarbeitung (14. Oktober, Nachmittag; Rückmeldung: „Strand an einer kleinen Insel, der wegen der Krümmung
    irgendwann nicht mehr sichtbar ist, ein oder zwei kleine Berge teilweise bewaldet, der Blick aufs Meer soll in den
    Horizont auslaufen statt abrupt zu enden, Strand viel zu wenig detailliert, Wald schlecht und unnatürlich – lieber
    weniger dicht mit teilweise Palmen, Bäume schöner und realistischer, Wasser lieblos und leblos – detaillierter und
    wie bei der alten Version Wellen mit leichtem Schaum, Wolken natürlicher; die Steine links sehen super aus“):
    - Insel (`coast`, `ground` mit `Ground`): längliche Ellipse (380 × 200 m) um (0, 210) mit Buchten und Kaps an den
      Seiten, vor dem Brett die bisherige Uferlinie; der Strand verschwindet gut 100 m seitlich hinter Felskaps. Zwei
      Hügel (82 und 50 m, `HILLS`), unten und in Mulden bewaldet, Kuppen offen. Lagune ringsum (am Brett gut 2 m tief,
      weiter draussen bis 4 m, Korallenköpfe, Seegras), Riff gut 140 m vor dem Strand mit Brandung (Schaum auf der
      Wasserfläche), dahinter der Abfall auf höchstens 34 m (`SEA_FLOOR`). Vorher wurde der Grund nach aussen immer
      tiefer: Flache Blicke trafen ihn nie und gingen am Rand der Szene in den Himmel – das Meer endete 5° unter dem
      Horizont in einer harten Linie. Gelände und Wasser reichen jetzt 30 km weit (`EXTENT`), unter dem Horizont gibt
      die Himmelsfarbe die Farbe knapp darüber.
    - Pflanzen neu (`szenen/beach/pflanzen.py`): Kokospalme (gebogener Stamm, Wedel aus einzelnen Fiedern in V-Form,
      ältere hängend, einzelne dürr, Kokosnüsse), Laubbaum (Äste mit Unterästen, an den Zweigen Büschel einzelner
      Blätter als Sechsecke; dazu eine Etagenform), Busch, Strandgras, Strandwinde, Treibholz, Kokosnuss – alles als
      Geometrie mit Farbton je Ecke, ohne Texturen. Verteilung: Palmenhaine am Strandwall (zum Meer geneigt), einzelne
      Palmen am Strand, lockerer Wald aus Palmen und Laubbäumen mit Lichtungen, an den Hügeln dichter Laubwald,
      Buschgürtel am Rand, Unterholz, Strandgras.
    - Strand: nasser, glänzender Saum (Film spiegelt den Himmel), Spülrillen, Spülsaum mit Tang, Muschelstückchen,
      Windrippel im trockenen Sand (Relief im Streiflicht), Wiese und Waldboden in Flecken.
    - Wolken als Volumen (Mesh to Volume der Ballenform, Volume Displace mit farbigem Wolkenrauschen: ausfransende
      Ränder); Streuungen im Volumen je Szene (`stile.py` `volumen`, am Strand 4, sonst blieben dichte Wolken innen
      grau); ferne Wolken im Dunst (Eigenschaft `dunst` je Objekt).
    - Wasser in Blender rauer (Spiegelbilder verschwimmen), Wellenfelder in der Ferne, Spiegelung etwas schwächer als
      nach Fresnel, Lagune leuchtet stärker. Ums Brett (bis 70 m, Übergang bis 95 m: `WATER_GAME`) malt Blender nur
      den Grund, die Oberfläche zeichnet das Spiel.
    - Wasser im Spiel (`waterSurface` neu, Physik aus dem früheren Strand 2.25): Dünung parallel zum Ufer, im Flachen
      Brecher (Walze) mit Schaum, der zu Zellen und Fäden zerfällt (Schaumtextur), Lücken entlang der Front, Auflaufen
      und Zurückfliessen auf dem Sand, glänzender nasser Sand, Spülmarken, Gischt an den Felsen, Glitzern (Beckmann);
      Brechung und Spiegelung lesen das Panorama (`ctx.pano`: Grund unter der Stelle, Himmel und Insel in Richtung des
      gespiegelten Strahls). Karten mit 16 Bit (Tiefe, Abstand zur Wasserlinie: mit 8 Bit hatte die Wasserlinie des
      Auflaufens Stufen von 60 cm), Gitter folgt der Höhe des Sands, für den Tiefentest etwas zur Kamera hin (`lift`).
    - Nahe Pflanzen im Spiel: nur 4 Palmen, 3 Bäume, 1 Etagenbaum, 2 Büsche als Modelle, mit weniger Fiedern und
      Blättern (`GAME_DETAIL`); nahe am Brett stehen nur diese Vorlagen (Schatten im Panorama passen). Kompakt als
      Base64 (`pack_model`, im Spiel `unpackModel`); weichere Stufen (`soft`). Zusammen rund 180 000 Dreiecke.
    - Vorschau mit Rundumblick (Insel, erste Runde, 13. Oktober), Bildfolge der Wellen und Vergleichen:
      https://claude.ai/artifact/2AASs7CcWz76rJtpLZq6V6
    - Tests: Logik 551 bestanden, offline bestanden; Basis der Skybox 1,32 MB (vorab gespeichert zusammen unter 3 MB:
      dafür Wasserkarten mit 0,75-m-Zellen und Pflanzenmodelle ohne Normalen).
  - Dritte Runde (14. Oktober, Abend; Nutzer: „sieht bereits sehr gut aus“, dazu Wunsch nach etwas besserer
    Wellenbildung und kleinen farbigen Fischen ums Brett; erst Fische, dann Wellen):
    - Fische (`fishSchools`, neuer Ebenentyp): acht kleine Schwärme auf Ringen ums Brett (`area`), die sich weiten und
      zusammenziehen, im und gegen den Uhrzeigersinn; Doktorfische, gelbe Doktorfische, Fahnenbarsche, blaue
      Schwalbenschwänzchen, Clownfische (Muster `tang`, `plain`, `bands`), etwa doppelt so gross wie echte (sonst vom
      Brett aus kaum zu sehen). Körper aus einem Netz (`createFishGeometry`), Bewegung ganz im Vertex-Shader
      (Schwanzschlag, Lage im Schwarm), nie ins Flache (Wasserkarte). Unter Wasser: Rot zuerst geschluckt, Wasserlicht
      aus dem Panorama, Spiegelung nach Fresnel; Schatten auf dem Grund, von der gebrochenen Sonne versetzt. Erste
      Bahnen lagen vor dem Brett und waren von ihm verdeckt; türkise Schwalbenschwänzchen verschwanden im Wasser.
    - Wellen: Dünung im tieferen Wasser sichtbar (Kamm hell durchscheinend, `crest`; Tal dunkler; Höhe 0,19), zweiter
      schräger Wellenzug (Windsee) in den Normalen, Schaum hinter der Front zerfällt langsamer, Teppich in der
      Brandung, Schaumstreifen im zurückfliessenden Film (Schaum stärker in Strömungsrichtung gestreckt).
    - Rohre der Pflanzen (Stämme, Äste): Jeder Ring war um 90° gegen den vorigen gedreht – die Stämme sahen gewunden
      aus wie Kordeln, im Panorama und im Spiel. Jetzt wird die Querachse mitgeführt; die Ringe am Palmstamm folgen
      dem Stamm (Ton = Lage entlang des Stamms) und sind kaum sichtbar.
    - Vorschau mit Bildfolgen der Brandung und der Fische (gleicher Link). Tests: Logik 551 bestanden, offline
      bestanden; Basis der Skybox 1,33 MB.
  - Vierte Runde (14. Oktober, später Nachmittag; Nutzer: zurückfliessendes Wasser wirkt unnatürlich; Fische „super
    schön“, zwei Schwärme mehr und etwa doppelter Umkreis, aber weiter nicht zu nah ans Ufer; Felsen realistischer oder
    kantiger, vor allem die im Wasser, Übergang Wasser–Fels natürlicher):
    - Rückstrom (`waterSurface`): Der Film war beim Zurückfliessen ein deckendes, dunkles Band, sein Rand wanderte als
      harte helle Linie zurück. Jetzt dünn und klar (Sand darunter nur etwas dunkler und kühler), er glänzt; hangab
      Rinnen und zerrissene Schaumreste, in Fliessrichtung gezogen und beschleunigt; der Rand versickert fleckig; die
      helle Kante nur, solange das Wasser hinaufläuft; nur im Flachen (nicht bis in die Lagune). Bildfolgen nah am
      Ufer (`rueckstrom.sh`).
    - Fische: zehn Schwärme (dazu Sergeant-Majors und Papageifische), Umkreis etwa doppelt (`area`), nie ins Wasser
      unter 2 m (`minDepth`): Wo eine Bahn zu flach käme, schiebt sie das Gefälle der Tiefe hinaus.
    - Felsen: Bruchflächen im Gelände (`facets`: Zellen mit je einer schrägen Ebene, scharfe Grate; am stärksten, wo der
      Fels ins Wasser geht), Blöcke mit 14 Schnitten und scharfen Kanten (`set_sharp_from_angle`; weich schattiert
      wirkten sie wie Kissen), dazu Blöcke halb im Wasser und Geröll am Fuss. Eigenes Material der Blöcke (`mat_rock`)
      und für Blöcke wie Gelände die Zonen einer Felsküste (`shore_zones`, nach Biotop-Beschreibungen: Algen,
      Seepocken, darüber die schwarze Zone aus Flechten und Blaualgen im Spritzwasser), oben gelbe Flechten, nass
      glänzend. Ein Netz aus Rissen wirkte wie ein Schildkrötenpanzer: nur noch einzelne Risse.
    - Übergang Wasser–Fels: Die Blöcke fehlten in der Wasserkarte, das Wasser lief als flache Schaumfläche in sie
      hinein. Jetzt stehen sie in der Karte (`rock_tops`, Strahlen von oben auf die Blöcke, 3 × 3 je Zelle; Ring Fels
      darum für den Schaum). Am Fels bleibt die Wasserfläche auf Wasserhöhe, und ob sie sichtbar ist, entscheidet die
      Tiefe des Panoramas (`ctx.pano.depth`, ungeglättet als Textur): Sieht der Mittelpunkt vor der Stelle schon Fels,
      liegt sie in ihm. Die Tiefe hat dort die Wasserfläche von Blender, die Grenze ist so genau die gemalte
      Wasserlinie. Damit das geglättete Netz des Panoramas das Wasser um die Felsen nicht verdeckt, liegt es dort 1 m
      weiter zur Kamera hin (`ROCK_LIFT`). Schaum am Fuss nur, wo 0,6 m weiter hinten Fels ist, unterbrochen und mit
      den Wellen aufschäumend; über flachem Fels weniger Brandungsschaum (vorher ein Teppich).
    - Vorschau mit Bildfolgen (Rückstrom, Felsen, Brandung, Fische) und Vergleich mit der dritten Runde (gleicher Link).
  - Fünfte Runde (15. Oktober; Nutzer: „eigentlich muss nur noch das Verhalten der Fische verbessert werden“ – nah am
    Strand wirken sie, als flögen sie; ein Schwarm schwamm bis in den Strand; sie zittern und stocken):
    - Ursachen: Die Ringbahnen um (0, 3) reichten hinten bis 8 m auf den Strand (Ufer bei z ≈ −10, 2-m-Linie bei
      z ≈ −3); ein Wegschieben entlang des Gefälles der Tiefe holte sie nur teilweise zurück, sprang von Zelle zu Zelle
      (Zittern) und galt auf flachem Land in keine Richtung. Das Tempo auf dem Ring konnte kurz negativ werden (Umkehr,
      Stocken). Gezeichnet wurden die Fische über der fertigen Wasserfläche, also über Schaum, Glitzern und Auflaufen.
    - Neu: Schwarmsimulation auf der CPU (`createFishSim`, ohne three.js): je Schwarm ein unsichtbarer Leitfisch, der in
      eigenem Abstand ums Brett patrouilliert, mit Fühlern vor Flachem, Fels, Brett und Rand ausweicht und am Ende
      umkehrt; die Fische folgen auf wandernden Plätzen, halten Abstand, schwimmen nur vorwärts, Drehrate stetig
      (höchstens 2 rad/s, Änderung höchstens 8 rad/s²), Körper biegt sich in Kurven, Schwanzschlag nach Tempo. Feld
      `fishField`: Abstand zum Wasser unter `minDepth` und zum Fels (Chamfer), die Wasserkarte einmal als Bild gelesen.
      Feste Schritte (1/30 s), Ergebnis hängt nur von t ab (`?t=` bleibt pixelgleich).
    - Unter der Oberfläche: `waterSurface` zeichnet `ctx.under.scene` (Fische, Schatten) kurz vor sich in ein eigenes
      Bild und legt es als Grund unter die Oberfläche, von den Wellen verschoben; Spiegelung, Schaum, Glitzern liegen
      darüber, an Land und am Fels sieht man keine Fische mehr. Fische tiefer (0,8–1,6 m statt 0,35–0,8), Schatten
      weicher, je höher über dem Grund. `ctx.offscreen`, `userData.update/dispose` für Ebenen; `lift` der Fische weg;
      sky-schema prüft, dass vor `fishSchools` ein `waterSurface` steht.
    - Prüfung in Node (`tools/blender/out/arbeit/fischtest.mjs`, 600 s): nie flacher als 2,09 m, nie unter dem Brett,
      Bahnen auf der Karte (`karte.mjs`). Tests: Logik 551 bestanden. Bildfolgen: `folge.sh` (gitignored).
    - Nutzer (15. Oktober): „sieht sehr gut und gelungen aus“; die uneinheitliche Ausrichtung im Schwarm stört ihn
      nicht (bleibt so). Offen: Handy-Ansicht und Leistung (zusätzliches Bild, auf dem Handy halbe Grösse) prüfen,
      dann Review (16. Oktober, gemeinsam mit dem Nutzer) und Commit, wenn es gut aussieht; Vorschauseite nachführen
      nur bei Bedarf.
    - Fische bei flachem Blick (Wunsch des Nutzers: flach über das Brett sieht man sie kaum oder gar nicht, steiler
      wieder). Gemessen (15. Oktober; Aufnahmen mit und ohne Fische bei gleicher Zeit, Unterschied je Pixel; dazu die
      Simulation in Node, `fischsicht.mjs`, gitignored): Vor allem Geometrie. In der Ausgangsansicht blickt die Kamera
      über das Brett zum Strand; dort ist die Lagune nur 1,2–2 m tief (erste Brecher), direkt hinter dem Brett bleibt
      kaum ein Streifen tiefer als 2 m. Die Schwärme ziehen darum im Bogen vor und neben dem Brett, die Kamera sieht nur
      dessen hintere Enden: im Mittel 8 % der Fische steil, 5 % in der Ausgangsneigung, 3 % flach (vom Strand aus
      aufs Meer 21–36 %). Die Spiegelung nach Fresnel ist bei diesen Winkeln klein (unter 0,1). Erwogen: Schwimmgebiet
      zur Strandseite (Ausgangsansicht etwa doppelt so viele, Bahnen aber als zwei Gruppen neben dem Brett), ein
      Schwarm in der flachen Lagune hinter dem Brett; der Nutzer wählte nur die Optik. Korrigiert: Der Weg durchs Wasser
      im Fischshader folgt dem gebrochenen Strahl (höchstens 1,5-mal die Tiefe; gerade gerechnet bei flachem Blick fast
      doppelt so lang) – Kontrast der Fische flach +7 %, steil +3 %, die Farben satter.
    - Handy und Leistung (15. Oktober, Software-Rendering, nur Verhältnisse; `perf-fische.js`, gitignored): Das Bild
      unter der Oberfläche samt Fischen kostet am Desktop gut 1 % der Bildzeit, als Handy (780 × 1688 Pixel, Bild halb
      so gross) knapp 3 %; die Wasseroberfläche selbst 26 % bzw. 34 %. Die Spiegelung des Bodens zeichnet die Ebenen
      des Hintergrunds nicht (kein zweites Fischbild). Handy-Ansicht: Fische vor dem Brett gut sichtbar (steilere
      Kamera). Offen bleibt ein echtes Handy.
    - Review (15. Oktober, Agent; Urteil: commitbereit, keine Fehler in Shadern, Freigeben, Reihenfolge des Ladens).
      Behoben auf Wunsch des Nutzers: Die Fischsimulation rechnete beim ersten Bild ab Sekunde 0 nach (bis zu 3600
      Schritte in einem Bild, ein Ruck beim Wählen des Strands, auf dem Handy bei jeder Wahl) – jetzt Neubeginn 5 s vor
      t (`WARM`), weiter nur von t abhängig. Härtungen: sky-schema prüft bei `fishSchools` Halbachsen von `area`,
      `length`, `speed`, `depth` (> 0; ein fehlender Wert machte den Schwarm still unsichtbar), pack.mjs bricht bei
      unbekannten Endungen ab (statt `data:undefined`), `pack_model` bei mehr als 65 536 Ecken. Neue Tests in
      `tests/logic.test.mjs` mit der echten Wasserkarte: zwei Minuten nie flacher als `minDepth` und nie unter dem
      Brett, Ergebnis nur von t abhängig, erstes Bild gleich teuer, egal wann gewählt (554 bestanden). Nicht
      committet: Der Nutzer prüft den Stand erst selbst.
    - Zerrissene Fische (Nutzer, 15. Oktober, Bild `bilder/AbgeschnitteneFische.png`: je nach Blickwinkel fehlen Teile
      von Fischen, kleine Fische nur noch Fetzen). Gemessen (Prüfbilder auf der Grafikkarte, `GPU=1` in
      `tests/screenshot.mjs`; Hilfen `wasserdeckung.js`, `fische-debug.sh`, gitignored): Die Wasserfläche deckt in
      16 Blickwinkeln lückenlos. Ursache war der Versatz des Bilds unter der Oberfläche: Er folgte der ganzen Normalen
      samt Kräuselwellen und änderte sich auf Zentimetern um bis über 0,1 m – Nachbarpixel eines Fischs lasen an weit
      auseinanderliegenden Stellen, die Fische zerrissen (von oben ist ein Clownfisch nur gut 0,1 m breit). Jetzt
      verschieben nur die langen Wellen (Dünung, Wellenzüge ab 4,5 m; `low` aus `waterNormal`): Die Fische schwanken,
      bleiben aber ganz; Glitzern und Spiegelung behalten die Kräuselwellen. Dazu: Neubeginn der Simulation mit
      Startplätzen je nach Startzeit (mit 5 s Vorlauf begann sonst jede Wahl und jedes `?t=` fast gleich).
    - Abgeschnittene Fische, eigentliche Ursache (Nutzer: neues Bild, Fische scharfkantig abgeschnitten, oft nur der
      Kopf): Der Tiefenpuffer des Bilds unter der Oberfläche wurde nicht geleert. `renderer.clear()` löscht nur, was
      gerade beschrieben werden darf, und zuletzt war meist ein Material ohne `depthWrite` an der Reihe (three.js
      #18897; Reflector.js setzt darum die Maske vorher). Die Tiefe der Fische aus früheren Bildern blieb stehen und
      verdeckte die bewegten Fische – nur was gerade in freies Gebiet schwamm (der Kopf), blieb sichtbar. Mit
      angehaltener Zeit (`?t=`) bewegt sich nichts, darum zeigten die Prüfbilder es nicht; nachgestellt mit laufender
      Zeit auf der Grafikkarte. Jetzt vor dem Leeren `state.buffers.depth/color.setMask(true)`. Lehre: Was von Bild zu
      Bild Zustand behält, auch mit laufender Zeit prüfen.
  - Offen: Urteil des Nutzers zur Insel, danach Review und Commit; Leistung auf einem echten Handy (das Wasser rechnet
    mehr als vorher; am Fels acht Abfragen der Tiefe je Pixel).

## 3. Qualität der Level und Werkzeuge (aus den Reviews)

- [ ] **3.1 Wertung verfeinern:** Sie bildet noch stark nur die Anzahl Elemente und Quellen ab.
  - Interaktion in die Wertung aufnehmen: Kreuzungen, geteilte Spiegel, Mehrfachtreffer.
  - Nur echte Verzweigungen als Rateschritte zählen.
  - Der frühere Test „Rangkorrelation mit Kapitel I“ entfällt (Kapitel I gibt es nicht mehr); stattdessen
    prüft das Review die Reihenfolge, der Test verlangt eine steigende Wertung (Toleranz 1.5).
  → Ersetzt durch die Spec `.scratch/levelgenerator/spec.md` (Schwierigkeit und Spielwert getrennt), Tickets 12 und 13.
- [ ] **3.2 Vielfalt der Grundmuster:** Bei einer Quelle dominiert „Schleife durch festen Spiegel“. Mustermarken
  vergeben (Schleife, diagonal, Selbstkreuzung, geteilter Spiegel, Mischziel …), höchstens 2 gleiche je 10 Level.
  → Ersetzt durch die Spec `.scratch/levelgenerator/spec.md` (Haupt-Kernidee höchstens zweimal je 10 Level),
  Tickets 11 und 15.
- [ ] **3.3 Ausbeute des Generators verbessern:** Häufigste Verwerfungsgründe sind „Quelle überflüssig“,
  „Anzahl drehbarer Elemente“ und „zu wenige Ziele“. Weitere Quellen gezielt durch einen drehbaren Spiegel einer
  vorhandenen Quelle führen.
  → Ersetzt durch die Spec `.scratch/levelgenerator/spec.md`, Tickets 02 und 18–20.
- [ ] **3.4 Lockvögel häufiger:** Bisher hat nur ein Teil der Level einen Lockvogel, der beim Probieren Licht bekommt.
  Ziel: in den meisten Leveln mindestens einer.
  → Teilweise in der Spec `.scratch/levelgenerator/spec.md`: Der Lockvogel ist eine Kernidee (Tickets 11 und 19). Ein
  Ziel „in den meisten Leveln“ ist dort nicht festgelegt.
- [ ] **3.5 `harden.mjs` verbessern** (Review 4, Bericht `tools/pools/review4/tester-analyst.md`, Abschnitt 4):
  → Ersetzt durch die Spec `.scratch/levelgenerator/spec.md`: Das Härten entfällt (Tickets 20 und 21; `harden.mjs` ist
  entfernt), die Punkte unten gehen in die Beurteilung ein (Tickets 07–09, 12 und 13). Abweichend gilt: Kombinator →
  Prisma wie bei „Zenit“ ist eine Scheinmischung.
  - Wertung belohnt Grösse statt Denken: 16 von 32 Kandidaten sind bei vollem Überblick ohne Fallunterscheidung
    lösbar. Spielermodell (`player.mjs`) als Abnahme, z. B. mindestens ein Stillstand bei Horizont 2, aber höchstens
    zwei Fallunterscheidungen mit kurzer Kette bei vollem Überblick. Das Modell dafür versionieren.
  - Scheinmischung: Kombinator mit nur einer Eingangsfarbe (blosser Umlenker) oder Mischung, die ein Prisma sofort
    wieder zerlegt, verwerfen (ausser das Prisma sammelt und verteilt, siehe Vorsieb unten); Prismen, die in der
    Lösung nur eine Grundfarbe führen, bestrafen.
  - Füllteile (Quelle → 1–3 Spiegel → Ziel) bestrafen; ein weisses Ziel direkt aus einer weissen Quelle zählt in
    der Wertung fälschlich als Mischziel (betrifft auch `solver.mjs`).
  - Mischziele aus zwei verschiedenen Quellen verlangen oder stark gewichten (8 von 32 Kandidaten hatten keins).
  - Geschlucktes Licht an drehbaren Elementen und Tausende weiter Fast-Lösungen (Probieren statt Denken) begrenzen;
    Dichtegrenzen eher senken (`maxAdjacent` ~1.2, `maxShort` ~0.75).
  - Vorsieb (`review5/screen.mjs`, aus Review 6): mix2 ≥ 1 verlangen, Scheinkombinatoren (Ausgabe = Eingang,
    Zerlegen und Wiedervereinen, Kombinator → Prisma) erkennen. Kombinator → Prisma nur zulassen, wenn das Prisma
    wirklich sammelt und verteilt (wie „Zenit“); „Farbmühle“ ist ein Grenzfall. Die Basen „misch“ und „bunt“
    liefern die guten Level.

## 4. Später (nächste Version, nicht jetzt)

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
  handgebauten Leveln im 5×5×5-Würfel, um das Potenzial zu prüfen. Modell: feste Drehachse je Element, gleich viele
  Stellungen wie in 2D (Löser bleibt schnell). Ebenenwahl, abgeblendete fremde Ebenen, freiere Kamera.
  **E** nach dem Ausprobieren: weiterverfolgen? Dann offen: Tutorial für die Achsen, Würfel-Level aus dem Generator
  (Ticket 22) von Hand und mit den KI-Testern prüfen, grössere Würfel (7×7×7) erst nach Spieltests, Leistung auf dem
  Handy.
  → Beurteilung und Generator im Würfel, eine Strahlregel für beide: Spec `.scratch/levelgenerator/spec.md`,
  Tickets 14, 22 und 27.
- [ ] Eventuell eine 3D-Karte für die Levelauswahl.
- [ ] Mehr als 150 Level, wenn die ersten 150 überzeugen.

## 5. Google Play Store

Weg: Prisma bleibt eine Web-App und wird als Trusted Web Activity (TWA) in eine Android-Hülle verpackt (Bubblewrap oder
PWABuilder) – das Spiel selbst wird nicht umgeschrieben. Reihenfolge: zuerst 5.1–5.4 (lohnt sich auch ohne Store),
dann 5.5–5.7, parallel 5.8–5.10, zuletzt der Test 5.11. Die Regeln (Testerzahl, verlangte Android-Version) vor dem
Start in der aktuellen Play-Console-Hilfe nachsehen.

**Im Projekt**
- [ ] **5.1 Feste Adresse mit HTTPS**, z. B. GitHub Pages (Repo liegt schon auf GitHub) oder eigene Domain.
  Vor dem geschlossenen Test (5.11) endgültig entscheiden: Spielfortschritt (localStorage), Manifest-`id` und Asset
  Links hängen an der Adresse, ein späterer Wechsel kostet die Spieler ihren Fortschritt. Bei GitHub Pages als
  Projektseite (`…github.io/Prisma/`) muss `assetlinks.json` (5.5) im Repo `BonomoAlessandro.github.io` liegen.
- [x] **5.2 Offline-Fähigkeit:** Service Worker (`sw.js`), der Spiel, Icons, Bibliotheken und Schrift
  zwischenspeichert. Online kommt die Seite frisch vom Server (nach 3 s Wartezeit aus dem Speicher), offline aus
  dem Speicher; `vendor/` direkt aus dem Speicher; alle anderen Anfragen gehen vorbei. Nur über http(s) (über
  file:// gibt es keine Service Worker).
  `tests/logic.test.mjs` prüft die Dateiliste, `tests/offline.mjs` lädt das Spiel, stoppt den Server und lädt neu.
- [x] **5.3 Abhängigkeiten lokal ausliefern:** Three.js r147 samt 7 Zusatzmodulen in `vendor/three-0.147.0/` (aus dem
  npm-Paket, Prüfsumme der Registry geprüft, byte-gleich mit den bisherigen CDN-Dateien), die Schrift „Jost“ in
  `vendor/jost/` (nur der lateinische Zeichensatz, variable Schrift für alle Stärken). Lizenzen liegen bei
  (MIT, SIL OFL). Kein Abruf bei fremden Servern mehr.
- [x] **5.4 Manifest ergänzen:** Name „Prisma – Licht-Puzzle“ (Startbildschirm „Prisma“; „Prisma“ allein ist im Store
  durch eine Foto-App besetzt), feste `id` „prisma“ (nicht mehr ändern, sonst gilt die installierte Web-App als neue;
  die Play-App erkennt man an Paketname und Signaturschlüssel), `scope`, Sprache,
  Beschreibung, Kategorie. Android-Icons mit Schutzrand (`icons/icon-maskable-192/512.png`, erzeugt mit
  `tools/icons.mjs`: ohne Ecke, Prisma auf 85 % verkleinert, Strahl und Spektrum bis zum Rand). Seitentitel
  angepasst. Speicherschlüssel des Fortschritts unverändert. Chrome meldet keine Manifest-Fehler, installierbar.
- [ ] **5.5 Digital Asset Links:** `/.well-known/assetlinks.json` auf der Website, sonst zeigt die App eine
  Browser-Adressleiste.
- [ ] **5.6 Android App Bundle (.aab) bauen und signieren** (Bubblewrap). Signaturschlüssel sicher aufbewahren – ohne
  ihn keine Updates.
- [ ] **5.7 Test auf echten Android-Geräten:** Leistung auf schwächeren Handys, Zurück-Taste, Hoch-/Querformat, Ton.

**Konto und Store-Eintrag**
- [ ] **5.8 Google-Play-Entwicklerkonto:** einmalig 25 USD, Identitätsprüfung.
- [ ] **5.9 Pflichtangaben:** Datenschutzerklärung als Webseite (Fortschritt nur lokal; seit 5.3 keine Abrufe bei
  fremden Servern mehr), Formular „Datensicherheit“, Altersfreigabe-Fragebogen, Zielgruppe.
- [ ] **5.10 Store-Material:** Icon 512 × 512 (vorhanden), Titelgrafik 1024 × 500, mindestens 2 Screenshots,
  Kurzbeschreibung (80 Zeichen), lange Beschreibung.
- [ ] **5.11 Geschlossener Test:** Neue private Konten brauchen mindestens 12 Tester über 14 Tage, bevor die App
  öffentlich erscheinen darf – zeitlich der längste Schritt.

## 6. Erledigt (Überblick)

- [x] Phasen 1–8 der Spezifikation (Szene, Logik, Strahlen, Elemente, Interaktion, Level-System, Lösungsmoment,
  Audio, UI, Startbildschirm, Feinschliff)
- [x] App-Icon und Web-App-Manifest (`e3582cd`)
- [x] Löser, Schwierigkeitsmessung, Generator, Textansicht; eine Regel für Spiel, Löser und Tests (`a21ec1a`)
- [x] Kapitelstruktur und Kuratier-Werkzeug (`caa018f`)
- [x] Levelauswahl mit Kapitelreitern, Freischalten (eins überspringbar), Fortschritt nach „Kapitel:Name“ (`f5931c1`)
- [x] Kapitel II „Spiegelwege“ (10 Level, rein weiss, Wertung 10.8–17.9) und Qualitätskriterien (`d32e15f`)
- [x] Umbau auf Tutorial + 50 Level nach Schwierigkeit (Kapitel aufgelöst)
- [x] Level 51–70, alle schwerer als Level 50 (`6e988e0`)
- [x] Drehbar und fest auf einen Blick: runder Teller mit weissem Leuchtring = drehbar, eckiger Sockel mit roten
  Eckleuchten = fest – auch Quelle, Ziel und Filter (`343096c`, `9a58a00`)
- [x] Level 71–80, mindestens so schwer wie 51–70 (`088c81e`); „Nebelfeld“ nach Nachprüfung durch „Farbmühle“
  (Platz 77) ersetzt
- [x] Kein Freischalten: alle Level jederzeit spielbar (`101a37b`)
- [x] Fester Sockel: feine, gedämpft rote Randlinie statt hellem Rand und Eckleuchten (`06905d8`, `60a6ca8`)
- [x] Tutorial mit 9 Leveln, Zähler „Ziele x / y“, Ring bei falscher Farbe am Ziel (`1cf64b9`)
- [x] Sternenhimmel mit Milchstrasse als Hintergrund, je nach Bildformat ausgerichtet
- [x] Lesbarkeit: sattere Zielkristalle, Farbring mit festem Platz je Grundfarbe (zeigt auch falsches Licht),
  gut sichtbare Düse am Kombinator
- [x] 20 mittelschwere Level zwischen 16 und 68 eingefügt (damals 100), schwere Level markiert
- [x] 50 mittelschwere Level zwischen die damaligen Level 40 und 69 eingefügt (jetzt 150)
- [x] Bildrate nach Bedarf: höchstens 60 Bilder/s bei Bewegung, 30 in Ruhe und bei offener Levelauswahl – auf
  schnellen Bildschirmen und im Ruhezustand ein Bruchteil der bisherigen Grafiklast
- [x] Alte Level-Werkzeuge abgebaut (Ticket 21): alter Generator, Härten, Profile, Pools, Kuratieren, Auswahlliste,
  Ja/Nein-Filter und alte Wertung; es beurteilen und erzeugen nur noch die Beurteilung und der neue Generator

---

## Arbeitsweise und Befehle

- Jeder Schritt wird von einem Reviewer geprüft und danach committet. Commits enthalten keine Erwähnung von Claude.
- Grössere Level-Änderungen spielt der Nutzer an und gibt Feedback.

```bash
sh tools/leise.sh node tests/logic.test.mjs                 # Strahllogik, Löser, Lösung und Eindeutigkeit jedes Levels
sh tools/leise.sh node tests/golden.mjs                     # Strahlbilder und Löser gegen tests/golden.json
sh tools/leise.sh node tests/beurteilung.test.mjs           # Beurteilung
sh tools/leise.sh node tests/levelliste.test.mjs            # Levelliste: Reihenfolge, Grade, Duldungsliste, Namen
sh tools/leise.sh node tests/generator.test.mjs             # Generator
node tests/ki-tester.test.mjs                               # Ablauf der KI-Tester
sh tools/leise.sh node tests/offline.mjs [--redirect]       # Offline-Betrieb im Browser (Service Worker)
LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs mittel-mischziel --anzahl 3 | node tools/show.mjs
                                                            # Kandidaten aus dem Generator als Textfeld
sh tools/leise.sh node tools/ordne-level.mjs                # Reihenfolge und Grade (--schreiben: ins Spiel)
node tools/show.mjs --level 15 [--beurteilen]               # ein Level als Textfeld (Start und Lösung)
sh tools/leise.sh node tests/screenshot.mjs name 1440 900   # Screenshot nach tests/output/ (MOBILE=1 DPR=3: Handy)
```

- Frühere Pools und Reviews liegen in `tools/pools/` (nicht versioniert); die Werkzeuge dazu sind seit Ticket 21
  entfernt.
