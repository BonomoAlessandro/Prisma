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
- Die Prüfung liest globale Namen der Seite (`beamView`, `STORY_LEVELS`, `COLORS`, mit `--diag` `shockUniforms`) und
  Felder der Geschichte (`story.carrier`, `story.scene`). Ticket 03/04 muss sie über `__prismaDebug` erreichbar halten.
- Bei einer neuen Fassung von Chrome (SwiftShader, JPEG-Kodierer) kann der Vergleich überall rot werden, ohne dass sich
  das Spiel geändert hat. Dann die Referenzen auf dem alten Stand des Spiels mit `--write` neu schreiben, nie mitten in
  einem Schritt des Umbaus.

## Comments
