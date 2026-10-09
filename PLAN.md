# PRISMA – Plan und offene Punkte

Hier stehen alle Punkte, die wir noch umsetzen wollen. Erledigtes wird abgehakt (`[x]`) und bleibt zur
Nachvollziehbarkeit stehen. Neue Wünsche kommen einfach als neuer Punkt dazu.

**Legende:** `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt · **E** = Entscheidung des Nutzers nötig

Zuletzt aktualisiert: 9. Oktober 2026

---

## Ziel

- **Tutorial + 80 Level:** Zuerst ein kurzes Tutorial (9 Level, je ein Gedanke): Ziel und Spiegel, drehbar/fest,
  Block, Prisma, verschwindendes Licht, Filter, farbige Quellen, Mischen auf dem Ziel, Kombinator – je mit einem
  Hinweis in der Kopfzeile. Danach 80 Level, **allein nach Schwierigkeit sortiert** (leicht → schwer), ohne
  Gruppierung nach Elementen oder Anzahl Komponenten. Die Level 51–80 sind alle schwerer als Level 50.
- **Leitlinien für alle Level:**
  1. Elemente und Farben mischen sich frei: Spiegel, Prismen, Filter, Kombinatoren, Blöcke, farbige Quellen.
  2. Die Level sollen Spass machen, teilweise zum Grübeln anregen und qualitativ stark sein.
  3. Je weiter man kommt, desto schwerer.
- Alle Level sind jederzeit spielbar, nichts muss freigeschaltet werden.
- Die Levelauswahl blättert in Seiten (Tutorial, 1–10, …, 71–80). Die Seiten sind keine Kapitel und haben kein Thema.

---

## 1. Entscheidungen

- [x] **E3 · Tutorial überspringen?** Erledigt durch E5: Alle Level sind jederzeit spielbar.
- [x] **E4 · Farbige Quellen im Tutorial:** eigenes Tutorial-Level „Farbiges Licht“ vor dem Kombinator.
- [x] **E5 · Kein Freischalten:** Alle Level (auch Tutorial) sind jederzeit spielbar; gelöste Level bleiben markiert.
- [x] **E6 · Level 74 und 79:** Nur „Nebelfeld“ (S07, Platz 79) wird ersetzt, durch S19 „Farbmühle“ auf Platz 77;
  „Spiegelkabinett“ (S36, Platz 74) bleibt, weil S40 dieselbe Schwäche stärker hätte (siehe 2.11).

## 2. Tutorial + 80 Level (aktuelle Arbeit)

- [x] **2.1 Struktur:** Kapitel entfernt; Tutorial mit Hinweisen, 50 Level nach Wertung, Levelauswahl mit Seiten,
  Fortschritt nach Levelname (alte Schlüssel „II:Name“ werden übernommen).
- [x] **2.2 Generator-Profile** (`tools/profiles.mjs`): Grössenstufe 1–5 × Mischung (Spiegel, Prisma, Filter,
  farbige Quellen, Kombinator, bunt). Farbige Quellen im Generator. Pools mit `tools/pools.mjs`.
- [x] **2.3 Kuratierung** (`tools/curate.mjs`): alle Pools + handgebaute Level, 50 gleichmässig über die Wertung,
  verschiedene Grundmuster, abwechselnde und ausgewogene Mischungen; Review der Auswahl und der Reihenfolge.
- [x] **2.3b Zweites Review** mit zwei unabhängigen Testern (Spielersicht ohne Kennzahlen, analytisches
  Spielermodell), abgeglichen in zwei Runden: Reihenfolge neu (Rangkorrelation der Tester 0.91 → Abstand im Mittel
  unter 2 Plätzen), 4 Level ersetzt (Kopie eines Tutorial-Levels, Dopplung, zwei wirkungslose Filter). Tutorial:
  „Farbenlehre“ umgebaut (Filter jetzt nötig), „Mischung“ mit festen Spiegeln entschärft, Hinweise zu Mischen auf
  dem Ziel und Prisma auf einfarbigem Licht. Berichte in `tools/pools/review2/` (nicht versioniert).
- [ ] **2.4 Feedback des Nutzers:** Tutorial und alle 80 Level anspielen: Steigt die Schwierigkeit spürbar?
  Langweilige oder unfaire Level? Passen die Übergänge vom Tutorial zu Level 1, von 50 zu 51 und von 70 zu 71?
- [ ] **2.5 Oberes Ende:** Über Wertung ~40 gibt es nur wenige Kandidaten (Stufe 5 ist langsam, Filter-Profil ohne
  Ausbeute). Bei Bedarf Stufe 5 länger laufen lassen und die letzten Level ersetzen.
- [ ] **2.6 Mischziele gezielt erzeugen:** Zwei verschiedenfarbige Strahlen auf dasselbe Ziel (z. B. Magenta aus
  Rot und Blau), mit Qualitätskriterium „Mischziel vorhanden“.
- [ ] **2.7 Generator: wirkungslose Filter verwerfen** (Strahl hat schon die Filterfarbe – bei rund 1/3 der
  Filter-Level im Pool). Ebenso feste Spiegel, die nie für die Lösung zählen und kaum als Lockvogel wirken.
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

## 3. Qualität der Level und Werkzeuge (aus den Reviews)

- [ ] **3.1 Wertung verfeinern:** Sie bildet noch stark nur die Anzahl Elemente und Quellen ab.
  - Interaktion in die Wertung aufnehmen: Kreuzungen, geteilte Spiegel, Mehrfachtreffer.
  - Nur echte Verzweigungen als Rateschritte zählen.
  - Der frühere Test „Rangkorrelation mit Kapitel I“ entfällt (Kapitel I gibt es nicht mehr); stattdessen
    prüft das Review die Reihenfolge, der Test verlangt eine steigende Wertung (Toleranz 1.5).
- [ ] **3.2 Vielfalt der Grundmuster:** Bei einer Quelle dominiert „Schleife durch festen Spiegel“. Mustermarken
  vergeben (Schleife, diagonal, Selbstkreuzung, geteilter Spiegel, Mischziel …), höchstens 2 gleiche je 10 Level.
- [ ] **3.3 Ausbeute des Generators verbessern:** Häufigste Verwerfungsgründe sind „Quelle überflüssig“,
  „Anzahl drehbarer Elemente“ und „zu wenige Ziele“. Weitere Quellen gezielt durch einen drehbaren Spiegel einer
  vorhandenen Quelle führen.
- [ ] **3.4 Lockvögel häufiger:** Bisher hat nur ein Teil der Level einen Lockvogel, der beim Probieren Licht bekommt.
  Ziel: in den meisten Leveln mindestens einer.
- [ ] **3.5 `harden.mjs` verbessern** (Review 4, Bericht `tools/pools/review4/tester-analyst.md`, Abschnitt 4):
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
- [ ] Eventuell eine 3D-Karte für die Levelauswahl.
- [ ] Mehr als 80 Level, wenn die ersten 80 überzeugen.

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
- [x] Bildrate nach Bedarf: höchstens 60 Bilder/s bei Bewegung, 30 in Ruhe und bei offener Levelauswahl – auf
  schnellen Bildschirmen und im Ruhezustand ein Bruchteil der bisherigen Grafiklast

---

## Arbeitsweise und Befehle

- Jeder Schritt wird von einem Reviewer geprüft und danach committet. Commits enthalten keine Erwähnung von Claude.
- Grössere Level-Änderungen spielt der Nutzer an und gibt Feedback.

```bash
node tests/logic.test.mjs                                   # alle Tests (Eindeutigkeit jedes Levels)
node tests/offline.mjs                                      # Offline-Betrieb im Browser (Service Worker)
node tools/pools.mjs --jobs 13                              # Pools je Profil erzeugen (bis 2,5 h; vorhandene bleiben)
node tools/curate.mjs --dry --save tools/pools/draft.jsonl   # Auswahl ansehen und speichern
node tools/curate.mjs --order tools/selection.jsonl          # genau diese Auswahl/Reihenfolge ins Spiel schreiben
node tools/show.mjs --level 15                               # ein Level als Textfeld (Start und Lösung)
node tests/screenshot.mjs name 1440 900                      # Screenshot nach tests/output/ (MOBILE=1 DPR=3: Handy)
```

- Pools liegen in `tools/pools/` (nicht versioniert).
