# 08: Einbau der gewählten Varianten (Menü, Übersicht, Leiste)

**Spec:** ../spec.md

**Blocked by:** 02 (Wahl des Nutzers), 07  (nacheinander in `index.html`)

**Status:** ready-for-agent

**What to build:** Was der Nutzer im Skizzenkatalog (Ticket 02) gewählt hat, kommt ins Spiel: der Wagen im Menü, in
der Übersicht und in der Leiste unter dem Untertitel (Entscheid 9, 17). Was genau, steht in den Comments von
Ticket 02; ohne diese Wahl nicht beginnen.

- [x] **Menü** nach der gewählten Variante; Stand je Grad aus dem Wagen-Modul. Braucht sie die Zahl der wachen
      Sterne, bekommt die Schnittstelle des Menüs dieses Feld; das Menü bleibt ohne Abhängigkeit vom übrigen Spiel.
      Bedienung, Fokus, «Weiter», «Von vorn» mit Rückfrage und Tastatur unverändert.
- [x] **Übersicht** nach der gewählten Variante; Bestwerte, Sperren und Wiederholen unverändert.
- [x] **Leiste unter dem Untertitel** nach der gewählten Variante (falls nicht «wie heute» gewählt).
- [x] Der Moment, in dem ein Stern neu aufleuchtet, so wie im Katalog gewählt (etwa beim ersten Öffnen des Menüs nach
      einem Erwachen), falls Teil der Wahl.
- [x] Desktop, Handy hoch und quer, kleine Handys (360 × 640, 320 × 568): nichts abgeschnitten, Ziele mindestens
      44 px.
- [x] Leistung: Menü und Übersicht öffnen nicht langsamer als heute (Vorwärmen am Startbildschirm bleibt wirksam).
- [x] Die Bausteine in `.scratch/noa-geschichte/bausteine/` nachziehen oder als überholt markieren (das Spiel ist
      massgebend).
- [x] Probe: Abläufe für Menü und Übersicht grün, Stand des Wagens im Menü je Grad (nicht begonnen, mitten im
      Durchgang, geschafft), Bilder in allen Formaten.
- [x] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `createMenu` (Schnittstelle `show(stand)`, `stand.grade[g] = { stand, welt, geloest }`), `story.menuStand`,
  `menu.vorwaermen`.
- `createUebersicht`; Leiste `story.fillPath` mit `STORY_STATIONS`.
- Probe: `tests/geschichte-probe.mjs --menue`, `--uebersicht`.

## Comments

**04.11.2026, Wahl des Nutzers (Ticket 02):**
- **Menü F** «Sternkarte mit Reitern»: ein grosser Wagen wie auf einer Sternkarte (Kreise um den Polarstern, Namen der
  Welten an ihren Sternen, Punktgrösse nach echter Helligkeit, noch fehlende Linien gestrichelt), die vier Grade als
  Reiter daneben (Handy hoch: oben als Segmente), darunter Stand, Knopf (Beginnen/Fortsetzen/Übersicht) und «Von vorn».
- **Übersicht C** «Sternhaufen»: um jeden Stern die zehn Level seiner Welt als kleine Sterne (gelöst hell, nächstes mit
  Ring, gesperrt blass), «Im Dorf» als eigener Haufen; Tippen auf einen Haufen zeigt seine Level als Liste mit
  Bestwerten. Auf dem Handy wird der ganze Haufen gewählt, nicht das einzelne Level.
- **Leiste C** «Zeichen im Wagen», mit Anpassung des Nutzers: Kicker und Untertitel **senkrecht in der Mitte** des
  Bildschirms; der Wagen mit den Zeichen der Welten bleibt **unten am Rand**, wo die Leiste heute steht (Nutzer: «Das
  Sternzeichen sollte noch immer wie am Anfang am unteren Rand bleiben»); das getragene Licht (Lichtpunkt) **in der Mitte
  des freien Raums zwischen oberem Rand und Text** (Nutzer: «der Lichtpunkt sollte ebenfalls im freien Platz zwischen
  oberem Rand und dem Text zentriert sein»; ersetzt den Zwischenstand mit gleichen Abständen). Gilt für die Untertitel bei der Ankunft in einer Welt (die mit Leiste). Im Spiel
  heisst das auch: Während dieser Untertitel steht, bleibt der Lichtpunkt im oberen Teil des Bilds (Kamera bzw. Flug
  aus Ticket 05 entsprechend).
- Vorlage ist der Katalog (`katalog/katalog.html`, Varianten F, C, C); das Spiel ist massgebend für Bedienung,
  Tastatur, Fokus und Texte.

**06.11.2026, Notiz des Umsetzers** (Worktree `kw-08`, Stand b17bd39 = Ticket 05 committet, 06 und 07 vor Review)

Gebaut (`index.html`, `tests/geschichte-probe.mjs`, `tests/buehne-messung.mjs`; Bausteine als überholt markiert):

- **Menü F «Sternkarte mit Reitern»** (`createMenu` neu gezeichnet, Logik von Stand, Rückfrage, Fokus und Tasten
  übernommen): die vier Grade als Reiter (Desktop und quer links untereinander, hoch oben als Segmente), daneben bzw.
  darunter die Sternkarte des gewählten Grads: Kreise und Stundenlinien um den Polarstern, die Namen der Welten an ihren
  Sternen mit «10 / 10» bzw. den gelösten Leveln der laufenden Welt, Punktgrösse nach echter Helligkeit (`KARTE.mag`),
  noch fehlende Linien gestrichelt, Ring um den Stern der Welt, in der das Licht ist, Polarstern mit Strahlen (hell,
  wenn geschafft). Darunter der Knopf des Grads (`.menue-weiter`: «Weiter» beim zuletzt gespielten, sonst Beginnen,
  Fortsetzen, Übersicht, mit der Zeile «Grad · Welt n / 60») und «Von vorn» mit Rückfrage; hoch dazu Name, Stand und
  «Als Nächstes erwacht Stern k: Welt». Form und Linien kommen über die neue Option `wagen` (im Spiel das Modul
  `wagen`), die Zahl der wachen Sterne als neues Feld `wach` je Grad aus `story.menuStand` (`wagen.stand`); ohne `wach`
  rechnet das Menü sie aus den gelösten Leveln. Das Menü bleibt ohne Abhängigkeit vom übrigen Spiel.
- **Bedienung (Abweichung, bitte bei der Abnahme ansehen):** Reiter wählen nur (Klick, Tippen, Fokus); ausgeführt wird
  mit dem Knopf darunter oder mit Enter auf dem Reiter. Beim Öffnen ist der Grad von «Weiter» gewählt und der Knopf hat
  den Fokus, sonst wie bisher der Reiter des hervorgehobenen bzw. zuletzt gespielten Grads (gehaltenes Enter am
  Startbildschirm unverändert). Pfeile: Knopf, dann die Reiter (der fokussierte Reiter ist gewählt). Das folgt der
  Variante F des Katalogs; vorher führte ein Klick auf eine Karte gleich in den Grad. Die Probe wählt darum über Reiter
  und Knopf (`waehle`).
- **Moment** (aus dem Katalog): Ist seit dem letzten Zeigen eines Grads in dieser Sitzung ein Stern erwacht (etwa beim
  ersten Öffnen des Menüs nach einer Reise), blitzt er auf, seine Linien ziehen sich, dann wandert der Ring weiter
  (`KARTE.moment`; ohne neues Feld im Speicherstand, nach dem Neuladen nicht; bei reduzierter Bewegung nicht).
- **Übersicht C «Sternhaufen»** (`createUebersicht`): ein Himmel mit dem Kleinen Wagen im Stand des Grads, um jeden
  Stern die zehn Level seiner Welt (gelöst hell, das nächste mit Ring, gesperrt blass), «Im Dorf» als eigener Haufen
  unter der Deichsel; die Haufen sind die Stationen (Ziele ≥ 44 px, die gezeigte mit Hof). Daneben (Desktop, quer) bzw.
  darunter (hoch) die Level der gewählten Welt als Liste mit Bestwerten (Desktop eine Zeile je Level, Handy zwei Spalten
  zu fünf), eine Welt je Seite: Pfeile, Wischen, Tasten, Sperren, Hinweis, Wiederholen unverändert. Die frühere
  Darstellung «alle Welten untereinander» (Desktop) entfällt, `data-modus` ist immer `seiten`. Auf dem Handy ist
  «Schliessen» ein runder Knopf mit ✕ oben rechts (wie im Katalog). Der Hinweis zu einer gesperrten Kachel steht jetzt
  in allen Formaten an der Kachel.
- **Leiste C «Zeichen im Wagen»** (`story.fillPath`, `STORY_LEISTE`): bei der Ankunft in einer Welt (Reise, Einstieg,
  Dorf) Kicker und Text senkrecht in der Mitte (`.caption.mitte`), der Wagen mit den Zeichen der Welten unten am Rand,
  wo die Leiste stand (quer knapp über dem Rand); geweckte Sterne hell und verbunden, die Welt, in die das Licht kommt,
  mit Ring und Puls; auf der Reise blitzt der eben geweckte Stern einmal auf und seine Linie zieht sich (CSS). Das Dorf
  hat keinen Stern: alle Zeichen blass. Untertitel ohne Leiste (Finale, Ende des Dorfs) bleiben unten wie bisher.
- **Lichtpunkt:** `story.lichtHoch()` misst die Oberkante des Kickers (je Untertitel und Fenstergrösse einmal) und
  setzt das Licht in die Mitte des freien Raums darüber; `STORY_FLUG.licht` (0,3) gilt nur noch, wo nichts zu messen ist.
  Gemessen: Desktop 0,55–0,57, Poco hoch 0,56, quer 0,61–0,65, 360 × 640 0,58–0,60, 320 × 568 0,59–0,62 (Anteil der
  halben Bildhöhe über der Mitte).
- **Leistung:** Die Übersicht baut Kopf und Kacheln nur bei neuen Daten neu, zeichnet den Himmel nur bei neuem Stand
  oder neuer Grösse (Grösse je Fenster einmal gemessen) und beim Öffnen erst im nächsten Bild; die Spur steht in Ruhe
  ohne Messen (`translateX` in Anteilen). Das Menü zeichnet die Karte nicht neu, wenn sie dasselbe zeigt
  (ResizeObserver, show mit gleichem Stand); Vorwärmen am Startbildschirm wie bisher (Menü und Übersicht).
- Bausteine `.scratch/noa-geschichte/bausteine/menue/` und `…/uebersicht/`: in LIESMICH.md als überholt markiert.

Probe (`tests/geschichte-probe.mjs`): `waehle` (Reiter, dann Knopf) statt Klick auf die Karte; `tippeKachel` (zeigt die
Übersicht eine andere Welt, erst ihr Haufen); neu `menueWagen` (je Grad: wache Sterne, Linien, Ring, Stern der Welt;
nicht begonnen, mitten im Durchgang, geschafft), `uebHimmel` (wache Sterne, Linien, 60 Level, gelöst, offen, Haufen im
Himmel, Ziel ≥ 44 px), `pruefeImBild` (Knöpfe und Namen ganz im Bild, auf dem Handy Ziele ≥ 44 px) und `pruefeLeiste`
(Stand der Leiste, Text in der Mitte, Leiste frei darunter, Licht in der Mitte des freien Raums, auf der Reise auch im
Bild). Angepasst: Tastatur im Menü (Pfeil ab wählt Leicht, noch einmal Mittel, Enter auf dem Reiter), «Von vorn»
(Reiter bleibt gewählt, «Weiter» gehört Mittel), Übersicht immer `seiten`. `tests/buehne-messung.mjs`: Prolog über
Reiter und Knopf.

Geprüft (alle über `LEISE_VORRANG=8 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

| Lauf | Ergebnis |
|---|---|
| Node `geschichte`, `levelliste`, `hall` | grün |
| `--menue` Desktop, `--handy --dpr 2.75`, `--quer --dpr 2.75`, `--handy --groesse 360x640`, `--groesse 320x568` | alle bestanden |
| `--wagen` in denselben fünf Formaten | alle bestanden |
| Probe ohne Argumente (vier Grade, je zwei Welten) in denselben fünf Formaten | alle bestanden |
| `--uebersicht` in denselben fünf Formaten | alle Prüfungen grün bis auf Bildlücken (siehe unten) |
| `--dorf` Desktop / `--handy --dpr 2.75` | Desktop bestanden (im ersten Lauf zweimal Zeitüberschreitung beim Wiederholen von Übung 8 aus der Übersicht; `tippeKachel` wartet seither, bis die Seite fertig geblättert ist); hoch alle Prüfungen grün, eine Lücke von 194 ms beim Wiederholen Übung 8 → 9 |

Bildlücken der Übersicht (einzige roten Punkte): «Spiel → Übersicht» 105–165 ms bei 2,5–2,7 s (letzter Desktop-Lauf 127 ms, sonst grün) nach dem Öffnen (Blick
schon im Himmel, nichts bewegt sich) in Desktop, hoch, quer, 320 — auf dem Vorstand dieselbe Stelle Desktop 163 ms,
hoch zweimal 54/55 ms. «letztes Level → Übersicht» gut 320–370 ms bei 2,1–2,4 s: hoch dreimal, quer zweimal, 360
einmal; Vorstand quer 341 ms an derselben Stelle, hoch zweimal 36 ms. Übrige Lücken (Schliessen, Wiederholen,
Übersicht → Menü) wandern und kommen auf dem Vorstand ebenso vor. Wiederkehrend und auf dem Vorstand nicht: die Stelle
2,1–2,4 s nach «Zur Übersicht» bzw. 2,6 s nach dem Öffnen aus dem Spiel **im Hochformat** (Fund, offen; der Himmel
ist dabei schon gezeichnet, eine eigene Ebene für ihn half nicht).

Öffnen (eigene Messung, je 8 Neuladen bzw. 15 Öffnungen in einer Sitzung, Median, neu / Vorstand b17bd39):

| | Desktop | Poco hoch (393 × 873, dpr 2,75) |
|---|---|---|
| Übersicht, erstes Öffnen nach dem Laden (Aufruf / erstes Bild) | 9,5 / 16,8 ms gegen 12,1 / 14,9 | 12,2 / 16,8 gegen 7,2 / 11,9 |
| Übersicht, wieder geöffnet (Aufruf) | 3,1–3,4 ms gegen 6,8–7,8 | 3,1–5,1 gegen 6,5–6,9 |
| Menü aus dem Spiel (Aufruf) | 2,1–3,8 ms gegen 3,8–7,6 | 2,2–4,3 gegen 3,9–4,7 |
| längste Lücke in der ersten Sekunde (Median) | gleich (26 ms) | gleich (26 ms) |

Menü → Übersicht (geschaffter Grad) gezielt, Lücken beim Öffnen über 100 ms: Desktop neu 3 von 13, Vorstand 1 von 5;
quer neu 1 von 13, Vorstand 0 von 5; sonst wandernde Lücken von 150–250 ms bei 1,3–2,9 s in beiden Ständen.

Bilder (`tests/output/geschichte/`, je Format `desktop-`, `handy-dpr275-`, `quer-dpr275-`, `handy-360x640-`,
`handy-320x568-`): `…menue-start`, `…menue-wagen-leicht|schwer|sehr-schwer`, `…menue-von-vorn`,
`…uebersicht-aus-dem-spiel`, `…uebersicht-aus-dem-menue`, `…leicht-einstieg`, `…leicht-reise-2|3`.

Offen / zur Abnahme:

- Bedienung des Menüs mit Reitern (zwei Schritte statt einem Klick auf die Karte) — so im Katalog, aber anders als
  «Bedienung unverändert» im Ticket.
- Bildlücke im Hochformat 2–3 s nach dem Öffnen der Übersicht (siehe oben).
- Desktop: Die Übersicht zeigt nicht mehr alle Welten untereinander, sondern eine Welt neben dem Himmel.
- Klein (320 × 568): Name «Polarstern» und «Sterne» am Himmel der Übersicht stehen eng.
- Review (anderer Agent), dann Commit durch den Koordinator.

**06.11.2026, Review** (unabhängiger Reviewer, frischer Kontext; Hauptarbeitskopie = 960364b mit den Änderungen von
08; alle Läufe über `LEISE_VORRANG=8 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm;
Vergleiche gegen 960364b in einem temporären Worktree, danach entfernt)

Ergebnis: **bereit zum Commit** (mit den zwei kleinen Korrekturen unten). Menü F, Übersicht C und Leiste C entsprechen
dem Katalog und der Wahl des Nutzers samt Anpassung (Text mittig, Wagen unten am Rand, Licht im freien Raum darüber).
Mit den Reviews 06/07 passt es zusammen: 08 berührt `ascend(stern)`, `wagenBlick`, die Bühne und das Finale nicht
(nur `travel`/`enter` nehmen `lichtHoch()` statt `STORY_FLUG.licht`); `--wagen`, `--finale` gegen `vorher/` und die
Messung der Bühne sind wie im Review 07.

Selbst behoben:

1. **Einstieg ins Dorf: das Licht lag gut 3 s hinter dem mittigen Text.** Der Untertitel des Dorfs ist eine Ankunft
   mit Leiste (`.mitte`), `enter` setzte für das Dorf aber `hoch = 0` (Licht in der Bildmitte). Gemessen (eigenes
   Skript über `?szenen`, Lage des Lichts alle 100 ms, solange der Untertitel steht): Dorf Desktop/hoch/quer 0 von
   40–44 Proben über dem Text, 29–30 dahinter; Bergwald 24–27 darüber. Jetzt `hoch = () => this.lichtHoch()` auch fürs
   Dorf: 26–28 darüber, 2–4 dahinter (Durchflug), wie im Bergwald. Der Blick senkt sich dabei etwas, die Berge des
   Dorfs stehen unten im Bild (`desktop-dorf-einstieg.png`). Die Probe prüft es jetzt (`dorfAblauf`:
   `pruefeLeiste(0, …)` und «das Licht steigt über den Untertitel»); `--dorf` in drei Formaten grün bis auf die
   bekannte Lücke (unten).
2. **Kopf der Übersicht auf schmalen Handys:** «60 / 60» brach bei 360 px in zwei, bei 320 px in drei Zeilen,
   «Sehr schwer» in zwei; bei 320 × 568 schob das die Liste aus dem Bild (Sehr schwer, geschafft: Level 9/10
   abgeschnitten) und liess dem Himmel 130 px. Jetzt brechen Name und Stand nicht in sich um (der Stand notfalls
   zwischen seinen Teilen), auf kleinen Handys etwas kleiner. Gemessen (Leicht und Sehr schwer, geschafft): 360 × 640
   Stand 1 statt 2 Zeilen, Himmel 243 statt 220 px; 320 × 568 Stand 2 statt 3 Zeilen, Name 1 statt 2 Zeilen, Himmel
   147 statt 130 px, alles im Bild; 393 × 873 und quer unverändert.

Geprüft, ohne Fund:

- **Menü (Punkt 2 des Auftrags):** Reiter und Knopf passen zu Variante F (Katalog: «Ein Grad zur Zeit; die Reiter
  antippen», Wahl: «darunter Stand, Knopf und Von vorn»); ein Klick, der gleich ausführt, liesse die Karte des
  gewählten Grads nie sehen. Tastatur (eigenes Skript): beim Öffnen Fokus auf dem Knopf, gewählt der Grad von
  «Weiter»; Pfeile Knopf → Reiter (wählen mit), Pos1/Ende; Leertaste auf einem Reiter wählt nur, Enter führt aus; Tab:
  Reiter → Knopf → «Von vorn»; Rückfrage mit Fokus auf «Abbrechen», Esc schliesst sie, Fokus zurück auf «Von vorn»,
  Stand unverändert. Gehaltenes Enter am Startbildschirm und «Von vorn» mit Rückfrage in der Probe grün. Der Moment
  (Stern blitzt auf) kommt nach einem Sprung mit `?szenen` beim nächsten Öffnen (3 Sterne erwacht).
- **Übersicht:** Ziele ≥ 44 px in allen Formaten (Probe `pruefeImBild`, `uebHimmel`). Hinweis an der gesperrten Kachel
  jetzt auch auf dem Handy (eigene Messung, Level 5, 6 und 10 der Seite Meer, vier Formate): 10 px über der Kachel, ganz
  im Bild; auf dem Handy so breit wie der Text (fast die ganze Breite), darum nicht genau über der Kachelmitte.
- **Leiste C:** Text mittig, Wagen unten, Licht in der Mitte des freien Raums (Probe `pruefeLeiste` in allen
  Durchgängen grün; Bilder angesehen). Die Überlappung aus Review 05 (quer, Schale des Wagens durch «Kapitel 6 · Die
  Sterne») ist weg: die Schale endet jetzt knapp über dem Kicker (`quer-dpr275-wagen-welt5-vorbeiflug.png`).
- **Nichts Neues gespeichert:** kein neuer Schlüssel; der Moment merkt sich nur in der Sitzung. `?szenen` (eigenes
  Skript): Sprung «Wüste → Vulkan» mit Leiste wach/wach/eben erwacht/jetzt, Menü danach 3 Sterne wach, kein
  `prisma.noa.*` im Speicher, ohne Parameter wieder «noch nicht begonnen»; Konsole leer.
- **Lücke «letztes Level → Übersicht» im Hochformat (offener Fund des Umsetzers): kein Fund von 08.** Trace (Probe mit
  Tracing je Übergang): Die Lücke ist eine WebGL-Aufgabe im GPU-Prozess (`CommandBufferService:PutChanged` des
  WebGL-Kontexts, 336–401 ms), nicht das DOM der Übersicht; der Hauptthread ist dabei frei. Sie tritt auf 960364b an
  derselben Stelle auf (377 ms bei 2,28 s; im zweiten Lauf 19 ms). Neu Poco hoch 2 von 5 Läufen (321/379 ms), 320 × 568
  1 von 2, Vorstand 1 von 2 (die 36 ms des Umsetzers stammen von b17bd39). Vermutlich der erste Blick in den Himmel der
  Sterne (milky) nach dem Wiederholen; nicht weiter verfolgt.
- **Übrige Bildlücken** (wandernd: «Spiel → Übersicht» bei 2,3–2,6 s, «Schliessen», «Übersicht → Menü», Dorf «Übung 8
  wiederholen → Übung 9» 124–332 ms, «Menü → Prolog (neuer Grad)» 196–466 ms): im Trace ein blockiertes `Present`
  (GPU beschäftigt, CPU frei), beim Prolog dazu der Klick (69 ms) und `GetGLError`/`CheckFramebufferStatus` beim ersten
  Bild der Bühne; alle auch auf 960364b («Menü → Prolog»: neu hoch 5 von 5, Desktop 1 von 3; Vorstand hoch 1 von 2,
  Desktop 0 von 2 – dort seltener, aber vorhanden).
- **Leistung**, eigene Messung (8 Neuladen, je 2 Wiederöffnungen und 2 Menüs, Median, neu / 960364b):

  | | Desktop | Poco hoch (393 × 873, dpr 2,75) |
  |---|---|---|
  | Übersicht, erstes Öffnen (Aufruf / zweites Bild) | 8,0 / 20,7 gegen 8,5 / 20,7 ms | 12,8 / 15,5 gegen 11,9 / 20,6 ms |
  | Übersicht, wieder geöffnet (Aufruf) | 2,9 gegen 6,7 ms | 3,3 gegen 6,8 ms |
  | Menü aus dem Spiel (Aufruf) | 2,8 gegen 4,3 ms | 3,4 gegen 4,1 ms |
  | längste Lücke in der ersten Sekunde (Median) | 62 / 69 / 70 gegen 62 / 70 / 70 ms | 44 / 53 / 52 gegen 36 / 53 / 52 ms |

  Das erste Öffnen auf dem Poco ist gegen 960364b gleich (die 7,2 ms des Umsetzers kamen von b17bd39).

Offener Fund (klein, Leistung, Ursache nicht gefunden):

- **Menü → Übersicht auf dem Desktop: gelegentlich eine Lücke von 270–420 ms im 3. bis 5. Bild** nach dem Klick
  (Übersicht des geschafften Grads aus dem Menü, je Neuladen dreimal): neu 6 von 36 Öffnungen, dazu die Probe Desktop
  2 von 2 (342/269 ms), quer 158 ms, 320 × 568 394 ms; 960364b 1 von 36 (im 1. Bild), in der Probe 0 von 3. Poco hoch
  ohne Unterschied (neu 6 von 36, Vorstand 4 von 36). Im Trace: `Present` blockiert (GPU beschäftigt), Hauptthread
  frei. Gegenproben (je 24 Öffnungen): ohne Animation des Rings im Menü 5, ohne Sternkarte 2, ohne Himmel der
  Übersicht 4, ohne eigene Ebene des Himmels 4 – keine eindeutige Ursache. Kein Grund, den Commit aufzuhalten; bei der
  Abnahme am Computer beobachten.

Offen für die Abnahme (nur benannt):

- Menü in zwei Schritten (Reiter wählt, Knopf führt aus) – passt zu F, weicht aber von «Bedienung unverändert» ab.
- Desktop-Übersicht zeigt eine Welt neben dem Himmel statt aller Welten untereinander (folgt C: «Tippen auf einen
  Haufen zeigt seine Level»).
- Wagen beim Vorbeiflug quer nahe am mittigen Text (Schale knapp über dem Kicker, ohne Überlappung).
- 320 × 568: am Himmel der Übersicht stehen Namen noch eng (4 Überlappungen von Texten, etwa «Polarstern»/«Sterne»);
  360 × 640 und grösser ohne.
- Kicker «Kapitel n · …» über hellem Taghimmel (Wüste, Meer) in der Mitte schwach lesbar (früher unten auf dem
  dunklen Verlauf).

Läufe:

| Lauf | Ergebnis |
|---|---|
| Node: alle `tests/*.test.mjs` parallel, `golden.mjs` | grün (logic 2036, beurteilung 206, levelliste 54, generator 31, ki-tester 84, vorrat 18, wuerfelliste 20, hall 6, geschichte; golden 847 Level) |
| `offline.mjs`, `--redirect` | grün (allein; ein erster Lauf parallel zu den Node-Tests lief in den 10-min-Rahmen) |
| Probe ohne Argumente, Desktop / hoch dpr 2,75 / quer dpr 2,75 | bestanden |
| `--menue` 5 Formate, Desktop und hoch je dreimal | quer bestanden, Desktop 2 von 3; sonst nur «Menü → Prolog (neuer Grad)» 196–466 ms (siehe oben) |
| `--uebersicht` 5 Formate, hoch/360/320 nach der Korrektur noch einmal | alle Prüfungen grün, nur wandernde Lücken (siehe oben) |
| `--dorf` Desktop / hoch / quer, nach der Korrektur zweimal | alle Prüfungen grün (auch die neue im Dorf), nur «Übung 8 wiederholen → Übung 9» 124–332 ms (bekannt seit Ticket 06) |
| `--wagen` 3 Formate | bestanden |
| `--finale leicht` Desktop / hoch dpr 2,75 mit `--vorher` | bestanden; Finale +3,67 / +3,38 s, Fortsetzen −0,07 / +0,02 s |
| `--ganz` Desktop mit `--vorher` | bestanden; Reisen −0,03 … +0,03, Einstieg −0,01, Prolog −0,11, Epilog −0,02, Finale +3,69 s; Neuladen → Weiter 2,65 statt 2,23 s, auf 960364b im selben Ablauf 2,54 s (kein Unterschied von 08) |
| `--ganz --handy --dpr 2.75 --vorher` | Dauern Reisen −0,54 … −0,02, Finale +3,65, Neuladen ±0; rot nur an einer Lücke im Finale (412 ms, Satz wartet auf Tippen; Finale ohne Leiste) |
| `--ganz --quer --dpr 2.75` | rot nur an einer Lücke im Epilog (393 ms bei 2,9 s, Bühne) |
| `--handy --grad leicht` | bestanden |
| `buehne-messung.mjs messen` Desktop / `--handy` | Median 17,7 ms, p95 18,5 / 18,6, längste 24 / 25 ms, Konsole leer (wie Review 07) |

Geänderte Dateien im Review: `index.html` (Licht beim Einstieg ins Dorf; Kopf der Übersicht auf schmalen Handys),
`tests/geschichte-probe.mjs` (Prüfung im Dorf), diese Datei.
