# 01: Bildvergleich gegen die heutige `index.html`

**Spec:** ../spec.md

**Status:** ready-for-agent (umgesetzt, wartet auf Review)

**What to build:** Eine automatische Prüfung, die zeigt, dass das Spiel nach einem Schritt des Umbaus genau gleich
aussieht. Sie läuft noch gegen die heutige `index.html` und hält deren Bilder als Referenz fest, **bevor** irgendetwas
umgebaut wird. Ab Ticket 02 muss sie nach jedem Schritt grün sein; der Nutzer prüft nicht mehr von Hand.

- [x] `tests/bildvergleich.mjs`: öffnet das Spiel in Chrome ohne Fenster (über `tools/chrome.mjs`) und nimmt eine feste
      Liste von Ansichten auf:
      - Startbildschirm, Menü mit den vier Graden, Übersicht, Einstellungen (gibt es nicht, siehe Notizen);
      - jede Welt der Geschichte (Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne) mit ihrem Himmel, je ein Level vor und
        nach dem Lösen;
      - jede Übung im Dorf mit Band, Lichtkegel und Hand, je ein Schritt;
      - je eine Szene aus Prolog, Reise und Epilog;
      - jedes Element mindestens einmal im Bild (Spiegel, Prisma, Filter, Kombinator, Block, farbige Quellen).
- [x] Drei Grössen: Desktop 1280 × 800, Handy hochkant 390 × 844, Handy quer 844 × 390.
- [x] **Gleiche Bilder bei jedem Lauf:** feste Zeit (`?t=`, setzt heute schon `Math.random` auf einen festen Samen,
      siehe `FIXED_TIME` in `index.html`), `?noadapt`, Rendern in Software (SwiftShader, wie `tools/chrome.mjs` ohne
      `gpu`), damit die Grafikkarte keine Rolle spielt. Bleibt trotzdem Zufall im Bild, einen Schalter nur für die
      Prüfung einbauen, der das Spiel sonst nicht ändert.
- [x] Referenzbilder in `tests/bildvergleich/referenz/`. `--write` schreibt sie neu, aber nur bei einer bewussten
      Änderung des Aussehens (im Umbau nie).
- [x] Vergleich mit kleiner Toleranz (Abweichung je Pixel und Anteil abweichender Pixel). Bei Rot werden das Bild, die
      Referenz und ein Differenzbild nach `tests/output/bildvergleich/` geschrieben.
- [x] **Stabil:** Fünf Läufe hintereinander gegen dieselbe `index.html` sind alle grün. Die Toleranz so knapp wählen,
      dass eine Verschiebung um ein Pixel oder eine leicht andere Farbe auffällt; das mit einer absichtlich kleinen
      Änderung prüfen (z. B. eine Farbe um 2 % ändern, der Vergleich muss rot werden) und wieder zurücknehmen.
- [x] Laufzeit messen und im README angeben; mit `tools/leise.sh` laufen lassen.
- [x] README: Abschnitt «Tests» um den Bildvergleich ergänzen.

## Hinweise

- Die Proben (`tests/brett-probe.mjs`, `tests/geschichte-probe.mjs`, `tests/screenshot.mjs`) zeigen, wie man das
  Spiel steuert und Ansichten ansteuert (`?noadapt&nointro`, `?sky=`, `window.__prismaDebug`). Darauf aufbauen.
- Die URL wird später auf den Dev-Server bzw. `dist/` umgestellt (Ticket 02). Die Adresse darum an einer Stelle
  halten.
- Kein Umbau in diesem Ticket ausser dem Schalter für festen Zufall, falls nötig.

## Notizen der Umsetzung

16.11.2026, Branch `ticket/umbau-01`. In `index.html` nur der Schalter für festen Zufall (`phasenZufall`, siehe
Entscheide); ohne `?t=` ändert er nichts.

**Gebaut:** `tests/bildvergleich.mjs`, die Referenzen in `tests/bildvergleich/referenz/` (66 JPEG, 5,8 MB), README
(Abschnitt Tests), in `index.html` der Schalter `phasenZufall`.

**Ansichten** (je Grösse, Bild `<grösse>-<ansicht>.jpg`), in fünf Abläufen mit je einem frischen Laden (`--nur`):

| Ablauf | Ansichten |
|---|---|
| `start` | `start` (Startbildschirm, «Klicken/Tippen zum Starten») |
| `dorf` | `prolog` (erste Einstellung), `dorf-uebung-1` … `-4` (Erstes Licht, Brechung, Farbenlehre, Mischung: je der erste Schritt mit Geste, also Band, Abdunkeln, Lichtkegel und Hand) |
| `welt-1-2` | `welt-1-vor`, `welt-1-nach` (Bergwald 10), `reise` (Bergwald → Meer, das Licht hält über dem Untertitel), `welt-2-vor`, `welt-2-nach` (Meer 1) |
| `welt-3-4` | `menue` (Menü mit den vier Graden, Leicht in der Wüste, Mittel begonnen), `uebersicht` (Leicht), `welt-3-…` (Wüste 10), `welt-4-…` (Vulkan 1) |
| `welt-5-6` | `welt-5-…` (Planeten 10), `welt-6-…` (Sterne 1; vor dem Lösen «Ton aus»), `epilog` (erste Einstellung) |

22 Ansichten × 3 Grössen = 66 Bilder. Gespielt wird im Grad Leicht wie ein Spieler über «Weiter» im Menü, mit einem
Stand im `localStorage`; je zwei Welten in einer Sitzung (das letzte Level der einen, die Reise, das erste der nächsten),
das spart Laden. Elemente im Bild (prüft der Lauf): weisse und farbige Quellen, Spiegel, Prisma, Filter, Kombinator,
Block, Kristall (Kombinator und Block in Sterne 1 und im Dorf).

**Entscheide:**

- **Keine Einstellungen:** Das Spiel hat keine Seite «Einstellungen» (Abweichung vom Ticket). Was es gibt, steht im
  Bild: die Knöpfe unten rechts (Neustart, Ton, Übersicht, Menü) in jedem Level, «Ton aus» in `welt-6-nach`.
- **Schalter für festen Zufall (`phasenZufall`).** Mit `?t=` ist `Math.random` zwar fest, aber laden und three
  (UUIDs jedes Objekts) ziehen je nach Zeitpunkt verschieden viel daraus. Die Phase, mit der ein Ziel oder ein Filter
  atmet und ein Lichtblitz flackert, war darum im Dorf von Lauf zu Lauf anders (bis 1,7 % der Pixel rot, um Kristall
  und Brett). Mit `?t=` kommen diese drei Phasen jetzt aus einer eigenen Folge (`mulberry32(2)`), ohne `?t=` wie bisher
  aus `Math.random` (gleicher Aufruf zur gleichen Zeit). Golden und `logic.test.mjs` grün. Folge: Bilder mit `?t=`
  (etwa die der KI-Tester) zeigen Ziele und Filter in anderer Phase als vorher; verglichen werden sie nirgends.
- **Sonst deterministisch aus der Prüfung.** `?t=12` (Zeit steht, `Math.random` fest), `?noadapt`, SwiftShader. Was
  bei stehender Zeit nie fertig oder nie still würde, hält die Prüfung nur in der Seite fest: Strahlen zählen ihre Geburt
  ab Zeit 0 (wie `__prismaDebug.zeige`; sonst wüchsen nach `?t=` geborene Strahlen nie, auch nicht nach dem Lösen);
  Herauswachsen, Feier, Kamera und Flüge spult `__prismaDebug.settle` vor (beim Warten je 0,5 s, vor dem Bild 20 s);
  CSS- und Web-Animationen angehalten (endliche am Ende, endlose am Anfang); die Bühne von Prolog und Epilog mit
  `scene.einfrieren(12)` und ihr Bild zur festen Zeit 12 000 ms (sie funkelt nach der echten Zeit des Bilds); die Uhr
  der Hand im Dorf angehalten; die Glühwürmchen der Reise zu einer festen Zeit ihres Trägers (`carrier.t`). Ein Bild
  gilt erst, wenn eine zweite Aufnahme nach weiterem Vorspulen byte-gleich ist. Der Epilog kommt über
  `story.ending()` aus einem Level der Sterne, ohne das Finale davor.
- **JPEG statt PNG.** Ein Level auf dem Desktop war als PNG 1,4 MB gross, alle 66 Bilder wären rund 40 MB gewesen.
  Als JPEG (Qualität 90, von Chrome selbst kodiert, `Page.captureScreenshot`) sind es 5,8 MB. Verglichen wird JPEG mit
  JPEG: dasselbe Bild ergibt dasselbe JPEG, eine Änderung ändert es an ihrer Stelle. Dekodiert und gerechnet wird in
  einem zweiten Chrome (in Node gibt es keinen JPEG-Dekoder ohne Pakete). Ein erster Ansatz (Referenz JPEG gegen Bild
  PNG, Mittelwert je Block 8 × 8) scheiterte: Das Rauschen des JPEG (bis 5 von 255 im Blockmittel) war grösser als eine
  Farbänderung um 2 %.
- **Pixeldichte 1** auch auf den Handys (Touch und Mobil-Kennung wie in den Proben): ein Viertel der Pixel je Bild,
  kürzere Läufe; das Layout in CSS-Pixeln ist dasselbe wie auf dem Handy, nur gröber gezeichnet.
- **Toleranz:** Ein Pixel weicht ab, wenn ein Farbkanal um mehr als 3 (von 255) abweicht; rot ist ein Bild, wenn mehr
  als 0,01 % seiner Pixel abweichen (Desktop 102 Pixel, Handy 33). Begründung: In sieben Läufen waren 64 der 66 Bilder
  jedes Mal pixelgleich mit der Referenz (Abweichung 0). Das einzige Rauschen ist eine Stelle, die das Spiel selbst
  nicht immer gleich zeichnet: Handy quer, Meer 1 (`quer-welt-2-vor`, `-nach`), im Wasser links des Bretts eine dünne
  dunkle Linie in etwa der Hälfte der Läufe (bis 113 Pixel um bis 16, x 5–129, y 144–159; Ursache nicht gefunden,
  vermutlich das Laden des Strands auf der Reise). Ein Rechteck darum (x 0–143, y 128–175, auf ganzen Blöcken des
  JPEG, 2,1 % des Bilds) ist als einzige Ausnahme vom Vergleich ausgenommen (`AUSNAHMEN`, im Differenzbild blau),
  geprüft mit der Referenz im anderen Zustand: grün, ausserhalb höchstens 2 Abweichung. Ohne Ausnahme hätte die
  Toleranz über 0,034 % liegen müssen, und eine um 2 % andere Farbe der Spiegel fiel in einem Bild erst ab 0,032 % auf.
  Gemessen mit absichtlichen Änderungen (je Desktop, Abläufe `start`/`dorf`, danach `index.html` wieder byte-gleich
  wie vorher):

  | Änderung | abweichende Pixel je Bild | grösste Abweichung |
  |---|---|---|
  | Schriftfarbe `--ink` 2 % dunkler (Kopfzeile, Band) | 0,050–0,066 % in allen vier Übungen; Start und Prolog unberührt (andere Farben) | 11–16 |
  | Farbe der Spiegel (`MAT.mirror`) 2 % dunkler | 0,032–0,123 % in allen vier Übungen | 8–13 |
  | Titel der Kopfzeile 1 Pixel tiefer | 0,188–0,233 % in allen vier Übungen | 212–218 |

  Mit 0,01 % sind alle drei in jedem betroffenen Bild rot (mindestens dreimal über der Grenze).
- **Adresse an einer Stelle:** `seite(query)` oben in `tests/bildvergleich.mjs` (Ticket 02 stellt sie auf
  Dev-Server bzw. `dist/` um). Der Stand wird auf `favicon.svg` desselben Ursprungs gesetzt (geht auch über http).
- **Energie:** Der Lauf nimmt die Standards (Ruhe-Bildrate 30, Spiegelung nur im All); die Standbilder hängen nicht
  von der Bildrate ab, die Spiegelung des Bretts steht in `welt-5-…` und `welt-6-…`.
- **Laufzeit:** 27–33 min für alle drei Grössen unter `tools/leise.sh` mit `LEISE_CPU=100` (Desktop 16–20 min,
  Handy hochkant und quer je 5–7 min; das Laden der Himmel in SwiftShader macht den grössten Teil aus). `--write` gleich
  lang. Damit Flüge und Feier nicht zwölfmal langsamer laufen als im Spiel (ein Bild in SwiftShader bis 0,6 s, ein
  Schritt der Logik höchstens 0,05 s), spult die Prüfung beim Warten die Logik mit `settle` vor.
- **Grösse der Referenzen:** 66 JPEG, zusammen 5,8 MB (5 805 491 Bytes): Desktop 3,3 MB (Level um 120–220 KB), Handy
  hochkant 1,2 MB, quer 1,3 MB.

**Ergebnisse:**

- Sieben ganze Läufe nacheinander gegen dieselbe `index.html` (je 66 Bilder, 26–33 min): Die 64 Bilder ausser
  `quer-welt-2-*` wichen in **keinem** Lauf um auch nur einen Pixel ab (grösste Abweichung 0). `quer-welt-2-vor` und
  `-nach` zeigten in den Läufen 1, 2, 6 und 7 die Linie im Wasser, in 3, 4 und 5 nicht (111 bzw. 90 Pixel, bis 16), sonst
  ebenfalls 0. Während der Läufe stand die Toleranz noch nicht fest: Mit 0,02 % ohne Ausnahme meldeten die Läufe 1–5
  diese zwei Bilder rot, mit 0,05 % waren 6 und 7 grün. Mit der endgültigen Regel (0,01 %, Ausnahme) sind alle sieben
  grün, denn jede Abweichung liegt im ausgenommenen Rechteck. Die Referenz von `quer-welt-2-*` zeigt den Zustand ohne
  Linie (wie in den Läufen 3–5).
- Lauf 8 mit dem endgültigen Stand (Toleranz 0,01 %, Ausnahme, Referenzen wie committet): **grün**, 28 min 12 s. 64
  Bilder Abweichung 0; `quer-welt-2-*` mit der Linie (im Rechteck), ausserhalb höchstens 2, kein Pixel über 3.
- Die Ausnahme geprüft: Referenz `quer-welt-2-*` vorübergehend im Zustand mit Linie, Lauf `--groesse quer --nur
  welt-1-2` ohne Linie: grün, danach die Referenzen wieder wie vorher.
- Absichtliche Änderungen: siehe Tabelle unter «Toleranz»; alle rot, `index.html` danach byte-gleich wie vorher.
- `tests/golden.mjs` (ohne `--write`) und `tests/logic.test.mjs` nach dem Schalter grün (842 Level wie in
  `golden.json`; 2063 Tests).
- Unterwegs gefunden und behoben (nur in der Prüfung): Hand und Lichtkegel des Dorfs zuerst im erklärenden Schritt
  ohne Geste (jetzt «Weiter» im Band bis zum ersten Schritt mit Hand); die Bühne funkelte nach der echten Zeit des
  Bilds; der Himmel der Reise war je nach Rechner verschieden weit überblendet (jetzt wartet die Prüfung, bis er ganz
  da ist); Kamera und Ziele brauchten mehr Vorspulen (20 s).

**Offen für den Nutzer oder später:**

- Die Linie im Wasser (Handy quer, Meer 1) zeichnet das Spiel selbst nicht in jedem Lauf gleich; ob das auch im echten
  Spiel vorkommt, ist offen (die Ausnahme verdeckt nur sie).
- Die Prüfung greift nur über `window.__prisma` und `__prismaDebug` in die Seite (seit dem Review stehen dort auch
  `beamView`, `shockUniforms`, `STORY_LEVELS`, `COLORS`), dazu Felder der Geschichte (`story.carrier`, `story.scene`).
  Ticket 03/04 muss `__prismaDebug` mit diesen Namen erhalten.
- Bei einer neuen Fassung von Chrome (SwiftShader, JPEG-Kodierer) kann der Vergleich überall rot werden, ohne dass sich
  das Spiel geändert hat. Dann die Referenzen auf dem alten Stand des Spiels mit `--write` neu schreiben, nie mitten in
  einem Schritt des Umbaus.

## Comments

### Review (16.11.2026, unabhängiger Reviewer)

**Ergebnis: bestanden**, mit einem kleinen Fund selbst behoben (`d1daca4`) und drei mittleren Hinweisen für spätere
Tickets. Der Bildvergleich deckt, was das Ticket verlangt, ist scharf genug und in meinen Läufen völlig ruhig.

**Läufe** (alle über `tools/leise.sh`, `LEISE_MAX_CPU=100 LEISE_CPU=100 LEISE_VORRANG=1`, Browserläufe nacheinander):

- Bildvergleich ganz, Lauf 1 (mit `d1daca4`; nebenher lief versehentlich `geschichte.test.mjs` ohne `leise.sh`, also
  unter Last): **grün**, 30 min 20 s; 64 Bilder Abweichung 0, `quer-welt-2-*` höchstens 2 (Linie im Rechteck).
- Bildvergleich ganz, Lauf 2: **grün**, 28 min 55 s; alle 66 Bilder Abweichung 0 (diesmal ohne Linie).
- Absichtliche Änderungen an anderen Stellen als in der Umsetzung (je danach `git checkout`, Datei mit `cmp`
  byte-gleich, `git diff` leer):
  - Vulkan, Farbe des Basaltbretts (`tint` in `backgrounds/skies.js`) um 2 % heller, `--groesse handy --nur welt-3-4`:
    **rot** in `handy-welt-4-vor`/`-nach` (0,94 % bzw. 0,96 % der Pixel, bis 13), Wüste, Menü, Übersicht grün.
  - Meer, Wasser des Bretts (`water` des Strands) um nur 1 %, `--groesse quer --nur welt-1-2` (die Grösse mit der
    Ausnahme): **rot** in `quer-welt-2-vor`/`-nach` (0,99 % bzw. 1,12 %, bis 12), Bergwald und Reise grün. Die
    Ausnahme verdeckt eine Änderung am Brett also nicht.
- Node: `golden.mjs` (842 Level), `logic.test.mjs` (2063), `beurteilung`, `geschichte` (35), `hall` (6), `ki-tester`
  (84), `levelliste` (54), `vorrat` (18), `wuerfelliste` (20) grün; `generator.test.mjs` über `leise.sh` grün (31).
- Proben (`GPU=1`): `brett-probe` 2× auf dem Branch: einmal 1 Fehler (`moss → stone`: 1 Pixel Lücke im Kernquader),
  einmal grün; auf `a2a47e3` grün. `geschichte-probe --dorf` auf dem Branch 4× rot, auf `a2a47e3` 3×: 1× grün, 2× rot,
  immer dieselbe Art Fehler: eine einzelne Lücke über 100 ms (126–428 ms) im Bildtakt, meist «Sehr schwer: Übersicht →
  Übung 3 wiederholen → Übung 4», an wechselnden Stellen. Die Proben laufen ohne `?t=`, dort ist `phasenZufall` genau
  `Math.random()`; der Diff ändert für sie sonst nichts. **Keine Verschlechterung**, die Basis zeigt dieselben Fehler
  (Bildtakt dieses Rechners, nicht des Spiels).

**Geprüft:**

- *Abdeckung:* Alle Ansichten des Tickets da, je drei Grössen; jedes Element prüft der Lauf (`elementeImBild`).
  Abweichungen vertretbar: Eine Seite «Einstellungen» gibt es nicht (Knöpfe stehen in jedem Level, «Ton aus» in
  `welt-6-nach`); Epilog über `story.ending()` ohne Finale (das Finale ist eine Fahrt, kein Standbild); DPR 1 siehe
  unten.
- *Schärfe:* Toleranz 3/255 je Kanal und 0,01 % ist knapp genug: In meinen zwei Läufen lag das Rauschen bei 0
  (ausserhalb des Rechtecks höchstens 2), eine Farbänderung um 1–2 % ergibt ~1 % abweichende Pixel, also rund das
  Hundertfache der Grenze. JPEG gegen JPEG verdeckt nichts Sichtbares: Chrome kodiert dasselbe Bild byte-gleich; was
  JPEG Q90 schluckt, liegt unter der Pixelgrenze von 3. Die Ausnahme (`quer-welt-2-*`, 144 × 48 am linken Rand im
  Wasser, 2,1 %) ist gerechtfertigt und eng genug; Brett und Elemente liegen ausserhalb. Ihre Ursache bleibt offen.
- *Verfälscht er das Spiel?* `phasenZufall` ist ohne `?t=` ein Aufruf von `Math.random()` an derselben Stelle zur
  selben Zeit, auch in `vorwaermElemente` (dort wird `Math.random` vorübergehend auf 0,5 gesetzt, `phasenZufall` ruft
  es zur Laufzeit auf und bekommt wie vorher 0,5). Übrige `Math.random` im Spiel nur im Ton und für eine Kennung der
  Übersicht, nichts Sichtbares. Alle Eingriffe des Tests (`beamView.update`, `carrier.update`, `einfrieren`,
  `clearTimeout(handUhr)`, Animationen) geschehen nur in der Prüfseite.
- *Für Ticket 02:* Adresse nur in `seite()`; der Stand wird über `favicon.svg` desselben Ursprungs gesetzt, das Ticket
  02 ohnehin nach `dist/` mitnehmen muss.
- README und Ticket stimmen mit dem Code (Aufruf, Ansichten, Toleranz, Ausnahme, `--diag`, Laufzeit; meine Läufe 29–30
  min liegen in der angegebenen Spanne).

**Selbst behoben** (`d1daca4`, *test(umbau-01): Bildvergleich greift nur über __prismaDebug in die Seite (Review Umbau
01)*): Der Test las die globalen Namen `beamView`, `STORY_LEVELS`, `COLORS` und mit `--diag` `shockUniforms`; nach
Ticket 03/04 (Module) gäbe es sie nicht mehr, und der Test bräche genau dann, wenn er am meisten gebraucht wird.
`__prismaDebug` führt sie jetzt (eine Zeile in `index.html`, ohne Wirkung aufs Spiel), der Test liest nur noch über
`__prismaDebug`. Beide ganzen Läufe oben liefen mit diesem Stand. Die Notiz unter «Offen» ist nachgeführt.

**Mittlere Hinweise (nicht behoben):**

1. **Der Weg der echten Handys fehlt.** Alle Bilder mit DPR 1 und iPhone-Kennung. Damit laufen nie: der Massstab der
   Seite `SEITE` (nur Chrome auf Android mit DPR > 2, das Poco hat 2,75; ein früh laufendes Inline-Skript, das beim
   Lösen in Module leicht später oder anders läuft) und das Pixelverhältnis 2 des Renderers auf Handys
   (`Math.min(devicePixelRatio, IS_MOBILE ? 2 : 1)`). Ein Fehler dort bliebe grün. Vorschlag: eine vierte Grösse
   «poco» (Android-Chrome-Kennung, z. B. 393 × 873, DPR 2,75) mit wenigen Ansichten (`start`, `dorf`, `welt-1-2`),
   Laufzeit grob +10 min. Entscheid für Ticket 02 (dort ohnehin der erste Handytest nach dem Umbau, Meilenstein 1).
2. **Sprache.** Ticket 07 wählt die Sprache nach dem Gerät (Deutsch nur bei Deutsch). Headless-Chrome meldet die
   Sprache des Rechners bzw. `en-US`; ab Ticket 07 kann der Vergleich darum überall auf Englisch und rot werden. Der
   Test muss dann Deutsch festlegen (`--lang=de-CH` beim Start, `Emulation.setLocaleOverride` oder ein Parameter
   `?lang=de`). Für Ticket 07 vormerken.
3. **«Proben grün» ist auf diesem Rechner nicht verlässlich erreichbar.** `geschichte-probe --dorf` meldet schon auf
   `a2a47e3` in 2 von 3 Läufen eine Lücke über 100 ms, `brett-probe` gelegentlich 1 Pixel. Die Spec verlangt nach
   jedem Schritt grüne Proben; für die Tickets 02 ff. braucht es eine Regel (z. B. bei Fehlern im Bildtakt Vergleich
   mit der Basis oder Wiederholen), sonst hält jeder Reviewer daran an.

**Kleinigkeiten, bewusst gelassen:** `istRot` rechnet den Anteil auf alle Pixel samt Ausnahme (Grenze dort 33 statt
32 Pixel); `--groesse`/`--nur` ohne Wert bricht mit einer Ausnahme statt einer Meldung ab; `--write` mit Fehler in
einem Ablauf schreibt die übrigen Referenzen trotzdem (gibt aber 1 zurück).
