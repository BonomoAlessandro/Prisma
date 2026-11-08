# 09: Vulkan

**Spec:** ../spec.md

**Blocked by:** 08 (der neue Vulkan-Krater ist seit 05.11.2026 auf `main`, 504adbb, und im Branch: Merge 0fc5cee)

**Status:** ready-for-agent

**What to build:** Ein Brett für den Vulkan, auf dem fertigen neuen Krater.
Die Welt bekommt ihren eigenen Katalog mit 6 bis 8 völlig neuen Richtungen (wie Ticket 03), die dem
Strand nicht ähneln müssen (Entscheid des Nutzers vom 05.11.2026). Der Nutzer wählt eine, sie wird im Spiel gebaut,
fertig gemacht und abgenommen.

- [x] **Vorher main holen:** erledigt am 05.11.2026 (Merge 0fc5cee). Das Register enthält den neuen Krater (rev
      584a34b8) mit der Brett-Angabe `stone`. Logiktests, Offline-Probe und Geschichte-Probe «leicht» waren grün.
- [x] **Katalog:** Vorbilder suchen und eine Vorschauseite mit 6 bis 8 völlig verschiedenen Richtungen für den Vulkan
      bauen, wie in Ticket 03: echte Spielbilder mit zur Laufzeit eingesetztem Brett, je 4 Ansichten, Vorbilder mit
      Link, Idee, Raster, Einlegelinie, Spiegelung, Lichtwelle und Kostenhinweise. Der Katalog darf vor Ticket 05
      entstehen (er fasst `index.html` nicht an).
- [x] **Wahl aus dem Katalog:** Der Nutzer wählt eine Richtung, eventuell mit Änderungswünschen. Die Wahl steht unter
      «Comments».
- [x] **Im Spiel:** Die gewählte Richtung wird eine Art von Brett, wie das Gezeitenbecken in Ticket 04. Der Nutzer gibt
      an Bildern Rückmeldungen, bis sie sitzt.
- [x] **Eigene Lichtwelle:** Das Brett bekommt seine eigene Lichtwelle aus seiner Welt, wie die Blumen beim
      Moospolster: Wo der Ring vorbeizieht, passiert etwas auf dem Brett und kommt danach wieder zur Ruhe.
      Gewählt mit dem Brett: Glut steigt in den Fugen der Säulen auf, und die Köpfe der Randsäulen leuchten
      nacheinander auf. Achte auf Bloom.
      Sie kommt als Bildfolge oder kurzes Video auf die Vorschauseite.
- [x] **Bilder und Leistung:** eine Vorschauseite mit denselben Ansichten wie in Ticket 04 auf Desktop und Handy
      (Spielansicht, flach, ganz heraus, Fall des Lichts beim Einstieg in den Vulkan mit dem Blick über die Kraterwand,
      Lösen). Dazu kommen die Messwerte des Bretts, verglichen mit dem Steinbrett.
- [x] **Brett-Angabe:** Die Werte stehen in der Brett-Angabe des Vulkans. Das Register wird nur in der Brett-Angabe
      nachgeführt, und das Prüfwerkzeug kennt die Werte.
- [ ] **Übergänge:** Auf der Reise von der Wüste zum Vulkan und vom Vulkan zu den Planeten (dort das Steinbrett) und
      beim Wiederholen über diese Weltgrenzen bleibt alles ohne falsches Brett, ohne Löcher und ohne Ruckeln.
- [ ] **Leistung:** Die Bildzeit steigt nicht messbar, und der Grafikspeicher bleibt etwa wie heute.
- [x] **Abnahme:** Der Nutzer nimmt über eine Vorschauseite ab, erst dann wird committet.
- [ ] Alle Tests sind grün (Logik, offline, Geschichte-Probe), und das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Der neue Krater** (Stand Krater-Branch, 05.11.2026):
  - Er ist etwa doppelt so weit (Ufer 53 m) und hat einen Rand bei 60 m.
  - Es ist Nacht, und die Lava ist das Hauptlicht (satte Glut).
  - Im Kapitel Vulkan schaut die Kamera weniger hoch (`up` 0.65).
  - Der Lavasee (`lavaPool`) liegt unter dem Brett und wird nah am Brett gedämpft (`calm`). Dazu kommen Felsen
    (`bakedMesh`).
- **Budget:** Der Vulkan wird vorab gespeichert. Eine Form aus Blender zählt deshalb zur Grenze von 4,5 MB. Reicht der
  Platz nicht, fragen wir den Nutzer.
- Auf dem Branch des Kleinen Wagens steht der Stern des Vulkans «über der Kraterwand». Ist der Kleine Wagen schon auf
  `main`, kommt er mit.

## Comments

**Katalog (06.11.2026):** acht Richtungen am neuen Krater, https://claude.ai/artifact/M9QffoMkGcgwSn2geoCjWv: Obsidian,
Basaltsäulen, Stricklava, Amboss, Bimsfloss, Schwefelquelle, Höhlenstadt und Drachenhort. Quelle, Bilder und Skripte
liegen in `katalog-vulkan/`, die Vorbilder in `vorbilder/vulkan.md`. Die Fassung von `bretter.js` dort rechnet die
Weltposition für Instanzen richtig, in den Katalogen von Wüste und Wald ist das noch falsch.

**Wahl des Nutzers (06.11.2026): Basaltsäulen** (Karte 2), mit der Lichtwelle der Karte:

- Das Brett ist das Ende eines Bündels sechseckiger Basaltsäulen wie am Giant’s Causeway.
- Im Feld sind die Säulen eben geschliffen, man sieht nur ihre feinen Fugen. Das Raster sind feine helle Linien
  über den Fugen, die Einlegelinie ist hellgrau.
- Im Rand stehen die Säulen in Stufen, nach aussen tiefer, einzelne etwas höher.
- Unten hängen sie verschieden lang herab wie an der Decke der Fingalshöhle, und ihre Enden fangen das Licht der Lava.
- Leichte Spiegelung, der Basalt ist geschliffen.
- Lichtwelle: Glut steigt in den Fugen auf, und die Köpfe der Randsäulen leuchten nacheinander auf. In Version 2 des
  Katalogs (nach der Wahl veröffentlicht) heben sich dazu die Säulen des Felds eine Handbreit, ihre Flanken glühen
  orange, und hinter dem Ring sinken sie zurück und die Fugen verglimmen. Der Nutzer will diese Version 2 (06.11.2026).
- Kosten: rund 940 Säulen als ein Körper mit Instanzen, auf dem Handy zu messen. Der stufige Rand verkleinert den
  Kernquader etwas.
- Vorlage: `katalog-vulkan/bretter/varianten-vulkan/2-basalt.js` mit `0-hilfe.js` und `bretter.js` aus demselben Ordner.

**Umsetzung (07.11.2026, Worktree `prisma-brett-09`, Branch `feature/brett-09-vulkan` von `feature/brett-je-himmel`
50760cf)**

- **Art `basalt`** (`index.html`, eigener Block «Basaltsäulen» im Brett-Teil nach `clayBoard`):
  - `BOARD_TYPES = { stone, tidePool, clay, basalt }`. Masse in `BASALT`, Werte in `BASALT_VALUES`.
  - Die Oberfläche rechnet `basaltData` im Hintergrund-Thread über `boardTextures` (wie das Gezeitenbecken): Farbe mit
    Alpha, Rauheit und Normalen, je 1024². Formeln und Farben aus `2-basalt.js`, die Höhen ungerundet. Ausserhalb der
    Säulen des Felds ist sie durchsichtig (Alpha 0, `discard` im Shader statt `alphaTest`, damit das Überblenden mit
    `opacity` nicht alles verwirft). Die Fugen für die Glut stehen im R-Kanal der Rauheit, also keine vierte Textur.
  - Raster als feine helle Linien, Einlegelinie hellgrau (`FLOOR_DETAIL_GLSL`), Spiegelung 0,3 (leicht).
  - Säulen: `basaltColumns` legt dieselben 941 Säulen wie der Katalog an (gleicher Zufall, `mulberry32(301)`), als zwei
    Instanzen eines Sechseckprismas: Feld (821) und Rand (120). Matt (`MeshLambertMaterial`) mit einem Ersatz für das
    Umgebungslicht, flach schattiert, ohne Schatten, dazu das Licht des Lavasees von unten wie im Katalog (Enden am
    stärksten). Die Oberfläche zeichnet vor den Säulen (`renderOrder`), deren Köpfe unter ihr kosten dann nichts.
  - **Kernquader** ±3,95 m, y −0,8 … 0: Bis 4,2 m stehen Säulen des Felds, die kürzeste endet bei −0,86 m.
  - **Überblenden** (`setFade`, `fadeVariants`) wie bei der Lehmterrasse. Die Säulen schreiben auch durchsichtig Tiefe,
    sonst stünden sie durcheinander. Geht das Brett, bleiben Oberfläche und Säulen des Felds deckend, die des Rands und
    die der Welle blenden aus.
- **Lichtwelle (Katalog Version 2)**, ganz nach der Ankunft des Rings (`uShockT` aus `shockClock`, wie beim
  Gezeitenbecken):
  - Glut steigt in den Fugen auf (Spitze knapp über der Bloom-Schwelle, 1,5 × `glow`) und verglimmt in gut 2 s.
  - Die Hälfte der Säulen des Felds (441 Instanzen, `rise`) hebt sich um 8 bis 30 cm, die Flanken glühen orange (1,2).
    Danach sinken sie in einer halben Sekunde zurück. Gezeichnet werden sie nur, solange die Welle wirkt (3 s).
  - Die Köpfe der Randsäulen leuchten nacheinander auf (je bis 0,25 s Verzug, 1,15, fast nur die Köpfe). In der
    ersten Fassung leuchteten Köpfe und Flanken zu stark und zu lange, alles crèmeweiss im Bloom; gedämpft.
  - Der Ring selbst bleibt ein warmer Hauch, wie im Katalog.
- **Brett-Angabe:** `tools/blender/szenen/volcano/skybox.json` nennt `basalt` mit neun Farben in sRGB 0 … 1 (`basalt`
  und `column` je [hell, dunkel], `tint`, `lip`, `joint`, `line`, `inlay`, `rise`, `glow`). Die Shader- und
  Instanzfarben des Katalogs (linear) sind dafür nach sRGB umgerechnet. Register mit `node tools/blender/pack.mjs --brett
  volcano` nachgeführt (Register `21063d13` in `sw.js`). `BOARD_PARAMS.basalt` in `tools/sky-schema.mjs`, Kopf
  beschrieben. Keine Bytes zum Vorab-Speichern dazu.
- `APP_VERSION` `2026-11-07 brett-vulkan` (`index.html`, `sw.js`).
- **Geschichte-Probe:** neuer Teil `--grenzen` (`grenzenAblauf`): Stand Leicht bis Planeten 6, aus der Übersicht das
  letzte Level der Wüste und dann das des Vulkans wiederholen, je «Weiter» über die Grenze. Geprüft: ohne
  Zwischenszene, Blick bleibt, das Brett gleitet mit dem Himmel und steigend ins neue, in jedem Bild die Art seiner
  Brett-Angabe, kein Notfall.

**Vorschau und Abnahme (07.11.2026):** lokale Seite (die Artifact-Werkzeuge gingen in dieser Sitzung nicht), Ordner
`vorschau-09` im Scratchpad der Sitzung: Desktop 1440 × 900 und Handy 390 × 844 (Pixeldichte 2), je Spielansicht, flach,
ganz heraus und flach plus heraus neben dem Steinbrett, Lichtwelle und Fall des Lichts beim Einstieg in den Vulkan
(Leicht 31, «Weiter» im Menü, Halt, Blick über die Kraterwand) als Filme in Echtzeit, Katalogbilder, Messwerte.
Rückmeldung des Nutzers: «das sieht super aus».

- Nach dieser Rückmeldung, wegen der Messung: Die Säulen zeichnen jetzt matt (Lambert) statt mit
  `MeshStandardMaterial`. Das kostete am Desktop 4–5 ms je Bild mehr als das Steinbrett (26,9 gegen 22,0 ms). Mit dem
  Ersatz für das Umgebungslicht sehen die Köpfe fast gleich aus, die Säulen glänzen aber nicht mehr in den Softboxen.
  Die Seite zeigt die neuen Bilder.

**Messwerte** (headless mit Grafikkarte, Messwerkzeug, Level 41, Spielansicht, Welle angehalten, je 4 s, zwei Seiten je
Brett abwechselnd; die Grafikkarte teilte sich der Rechner mit den Reviews von 07 und 08, Werte um 20 ms statt wie sonst
um 9 ms):

| Ansicht | Zustand | Basalt GPU ms | Stein GPU ms |
|---|---|---|---|
| Desktop 1440 × 900 | Ruhe | 22,77 · 22,77 | 21,07 · 21,13 |
| | Welle 0,3 s (Feld) | 23,03 · 23,14 | 20,88 · 21,08 |
| | Welle 0,8 s (Rand) | 23,29 · 23,41 | 20,95 · 20,96 |
| Handy 390 × 844, Pixeldichte 2, CPU 4× | Ruhe | 26,79 · 26,81 | 27,55 · 25,85 |
| | Welle 0,3 s | 26,95 · 26,95 | 27,16 · 25,78 |
| | Welle 0,8 s | 27,01 · 27,05 | 27,96 · 25,81 |

- Desktop: in Ruhe rund +1,7 ms (8 %), in der Welle +2,2 ms. Einzeln ausgeblendet kosten die Säulen des Felds etwa
  0,5–0,9 ms, die des Rands weniger, als die Messung streut. Der Rest ist, dass das Bündel mit den hängenden Säulen
  mehr Fläche im Bild deckt als die 41 cm hohe Platte des Steinbretts.
- Handy (gedrosselt): kein Unterschied, der grösser wäre als die Streuung.
- CPU je Bild: Desktop etwa +0,7 ms, Handy eher weniger als beim Steinbrett (Streuung).
- **Grafikspeicher:** Texturen 16 MB (3 × 1024² mit Mipmaps, wie das Steinbrett), Netze und Instanzen 0,1 MB.
- **Bauen** im Hauptthread (Median aus 3): Desktop 8,8 ms (Stein 2,0), Handy 11,9 ms (Stein 5,5). **Rechnen** im
  Hintergrund-Thread 286 ms (Stein 372), **bis bereit** 481 ms (Stein 567).
- **Fall des Lichts** beim Einstieg in den Vulkan: Halt nach 5,7 s (Desktop) bzw. 4,7 s (Handy) nach «Weiter», das
  Brett dabei schon `basalt` und bereit. Im Mitschnitt längste Lücke 50 bzw. 53 ms.

**Tests (07./08.11.2026, Umsetzer; die Proben über `leise.sh`, GPU, stumm):**

- `node tests/logic.test.mjs`: 2042 bestanden. Neu: «Vulkan mit den Basaltsäulen (basalt); die Prüfung lehnt ungültige
  und fehlende Farben ab» (Glut über 1, Farbe unter 0, zwei Werte, Säulen des Felds ohne zwei Töne, drei Töne der
  Säulen, fehlende Farbe, unbekannter Wert).
- `tests/offline.mjs`: bestanden. Der Vulkan meldet online und offline `basalt`.
- `tests/brett-probe.mjs`: bestanden, alle Teile (auch die wackelige Lücken-Prüfung der Mechanik).
- Geschichte-Probe `--grad leicht --welten 5` (Desktop): bestanden, mit den Reisen Wüste → Vulkan und Vulkan → Planeten,
  in jedem Level das Brett der Welt. Ein erster Lauf brach in der Reise ans Meer ab (Chrome antwortete 30 s nicht auf
  ein Bild der Probe), vor dem Vulkan; der zweite lief durch.
- Geschichte-Probe `--grenzen` (neu, Wiederholen über die Grenzen des Vulkans): Die Prüfungen zum Brett sind in allen
  Läufen grün (Brett wechselt gleichzeitig mit dem Himmel, steigend, in jedem Bild die richtige Art, kein Notfall). Rot
  ist die Lücken-Prüfung bei «Weiter zum Vulkan»:
  - Desktop: 194 ms (der Vulkan noch nicht geladen, 7 Lücken über 100 ms beim Laden des Himmels), im zweiten Lauf
    106 ms. Vulkan → Planeten 106 bzw. 54 ms. Handy: 133 ms, Vulkan → Planeten 89 ms.
  - Der Stand 50760cf als Kopie (Vulkan mit dem Steinbrett, dieselbe Probe): bestanden, längste Lücke 70 ms.
  - Gesucht mit long-animation-frames (Wüste, dann Brett des Vulkans bauen und bereit machen, dann den Himmel mit
    Überblenden auf den Vulkan): Das Laden der Basaltsäulen erzeugt keine Lücke über 50 ms (bereit nach 1,06 s,
    Überblenden übersetzt nach 1,45 s). Beim Einblenden des Himmels stehen 5 Lücken von 88–129 ms ohne Skript als
    Ursache. Die Kopie von 50760cf zeigt dort dasselbe (6 Lücken, 53–123 ms). Die Lücken kommen also vom Laden und
    ersten Zeichnen des Vulkan-Himmels, nicht vom Brett. Wie beim Strand schwanken sie stark von Lauf zu Lauf.
- Zeilenenden wie zuvor (CRLF in `index.html`, `sw.js`, `tools/sky-schema.mjs`, den Tests, `skybox.json` und dem
  Ticket).

**Offen:**

- **Leistung am Desktop:** in Ruhe rund +1,7 ms je Bild gegen das Steinbrett (das hängende Bündel deckt mehr Fläche).
  Der Haken «Leistung» bleibt deshalb offen, der Nutzer entscheidet. Mögliche Schritte: kürzer hängende Säulen oder
  Säulen in der Mitte ohne Enden, die man nur flach sieht.
- **Übergänge:** Das Brett wechselt richtig. Die Lücken über 100 ms beim Wiederholen über die Grenze zum Vulkan kommen
  vom Himmel (siehe oben). Der Haken bleibt offen fürs Review.
- Die Kosten auf dem echten Handy misst der Poco-Test (Ticket 10).
- Das Überblenden zwischen verschiedenen Formen (hängende Säulen unter einem Steinbrett erscheinen erst am Schluss)
  löst Ticket 05.

**Review (08.11.2026, unabhängig, gegen da65d5e):** passt, eine Auflage für den Merge auf Ticket 05.

- **Lücken an der Grenze des Vulkans (`--grenzen`):** Streuung vom Himmel, nicht vom Ticket. Abwechselnd gemessen,
  HEAD und eine Kopie von 50760cf mit derselben Probe, Desktop (längste Lücke, in Klammern Lücken über 100 ms):

  | Lauf | Wüste → Vulkan HEAD | Wüste → Vulkan 50760cf | Vulkan → Planeten HEAD | Vulkan → Planeten 50760cf |
  |------|---------------------|------------------------|------------------------|---------------------------|
  | 1    | 107 ms (1)          | 53 ms (0)              | 53 ms                  | 36 ms                     |
  | 2    | 142 ms (1)          | 90 ms (0)              | 55 ms                  | 36 ms                     |
  | 3    | 84 ms (0)           | 129 ms (1)             | 54 ms                  | 54 ms                     |

  Handy (HEAD): 53 und 70 ms, bestanden. Die längste Lücke liegt in allen sechs Läufen am selben Ort: im ersten Bild,
  nachdem der Himmel auf den Vulkan umgeschaltet hat (`shown` volcano, Anteil 0,515 … 0,522, w 0,03 … 0,045), bei
  HEAD wie in der Basis mit dem Steinbrett. Die zweite (70 bzw. 78 ms) kurz davor, Anteil 0,39 … 0,41, noch unter dem
  Himmel der Wüste, ebenfalls in beiden. `--wagen` zeigt dieselbe Stelle an der Grenze ins Meer (107 ms bei Anteil
  0,522). Vulkan → Planeten bei HEAD dreimal 53 bis 55 ms beim Ausblenden der Basaltsäulen (Anteil 0,38 … 0,44), in
  der Basis 36, 36 und 54 ms: knapp, unter jeder Grenze, passt zu den +1,7 ms unten.
- **Übrige Läufe:** Node-Tests alle grün, auch `generator.test.mjs` (31, unter `leise.sh` mit `LEISE_MAX_CPU=100`).
  `offline.mjs` und `brett-probe.mjs` (Lücken 54 / 71 ms) grün. Geschichte-Probe `--grad leicht --welten 5` Desktop
  und Handy grün. `--dorf` rot nur bei «Übung 8 wiederholen» mit 377 ms (Basis 350 … 430 ms). `--wagen` rot mit 107 ms
  an der Grenze ins Meer (Basis 90 … 136 ms). `--uebersicht` rot bei Öffnen 163 ms und Schliessen 484 ms, wie auf jedem
  Stand.
- **Geprüft:** Freigeben, Culling (`frustumCulled = false` bei beiden Instanzen), Schatten (nur die Oberfläche
  empfängt), Spiegelung, Lichtwelle (`uShockT`, `rise` nur bis `waveEnd`), Kernquader ±3,95 m, y −0,8 … 0 (die
  kürzeste Säule des Felds endet bei −0,865 m), Notfall.
- **Behoben:** Kommentar zu `BASALT.coreLow` und bei `basalt.core` nannte −0,83 m, nachgerechnet sind es −0,865 m
  (`basaltColumns` ausgelesen: 941 Säulen, 821 im Feld, 120 im Rand).
- **Auflage für den Merge auf Ticket 05:** Die Säulen hängen tiefer als die Hülle des Übergangs
  (`BOARD_BLEND_HULL_Y = -2`, «tiefer reicht kein Brett»). Ausgelesen: 97 Säulen enden unter −2 m, die tiefste bei
  −2,84 m (y = −`PLATE_THICK` − hang, hang bis 2,46 m). Beim Merge die Hülle auf mindestens −2,9 m setzen (oder aus
  den Arten ableiten) und den Übergang Wüste → Vulkan von unten ansehen.
- **Hinweis Leistung (+1,7 ms Desktop):** Vermutlich verhindert `discard` über die ganze Oberfläche den frühen
  Tiefentest, sodass die Säulen darunter voll schattiert werden. Mögliche Abhilfe: inneres Quadrat ohne `discard` als
  eigenes Netz, nur der Ring mit `discard`; oder die Säulen kürzer, innen durch einen Quader ersetzt. Nicht umgebaut,
  der Nutzer entscheidet (Haken «Leistung» bleibt offen).
