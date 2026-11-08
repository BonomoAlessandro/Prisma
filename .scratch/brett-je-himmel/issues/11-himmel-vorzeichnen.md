# 11: Himmel unsichtbar vorzeichnen

**Spec:** ../spec.md

**Blocked by:** 10

**Status:** ready-for-agent (Auflage aus dem Review: Naht an der Kante der Streifen, dann Merge mit Ticket 10)

**What to build:** Im ersten Bild, in dem ein neuer Blender-Himmel einblendet, dauerte ein Bild 100–175 ms
(`skyTheme.set` mit `fadeTime` 2,4 s an Weltgrenzen; im Log der Probe `shown` = neuer Himmel, `w` ≈ 0,04, Anteil des
Bretts ≈ 0,52). Rot waren `--wagen` (Grenze ins Meer), `--grenzen` (Wüste → Vulkan) und `--dorf` (Prolog
überspringen) am Desktop und `--uebersicht` (Öffnen) auf dem Handy. Wunsch des Nutzers: flüssig «von Beginn auf Nummer
sicher», ohne die Prüfung zu lockern. Ein vorgeladener Himmel wird einmal unsichtbar vorgezeichnet, bevor er
einblendet. Zusatz (08.11.): Nirgends sonst darf es ruckeln, auch nicht beim Vorladen und Aufbauen von Himmel, Brett,
Lichtwelle und Shadern. Jede solche Arbeit steht im Log der Probe, mit dem Bild, in dem sie geschieht.

- [x] **Ursache gemessen:** Es ist nicht der neue Himmel. Das alte Panorama gibt im selben Bild seinen Grafikspeicher
      frei (siehe «Comments»).
- [x] **Streifen in einer Höhe:** Die Streifen am Desktop liegen alle in Texturen von 4096 × 4096 (`BAND_HOEHE`). So
      nimmt der Vorrat auch die Streifen jeder anderen Welt (siehe «Comments»).
- [x] **Freigeben ohne Anhalten:** Ein Vorrat für die Texturen der Himmel (`skyTexPool`). Was übrig bleibt, gibt
      `freigabe` an stillen Bildern und in Häppchen frei.
- [x] **Unsichtbar vorzeichnen:** Ein geladenes Panorama wird einmal in voller Grösse in das Ziel des Spiels gezeichnet,
      mit Vorläufen und Pinsel (`skyTheme.vorzeichnen`). Das gilt auch ohne Vorladen.
- [x] **Protokoll der Arbeit:** `arbeit` im Spiel, `ARBEIT` in der Geschichte-Probe. Jede Lücke nennt die Arbeit in
      ihrem Bild, und am Ende steht eine Tabelle je Schritt.
- [x] **Die vier Prüfungen:** grün, ohne Lockerung. Das Öffnen der Übersicht auf dem Handy kommt nachweislich nicht vom
      Himmel (siehe unten).
- [x] Tests, Leistung, Vorab-Speicher, `APP_VERSION` `2026-11-08 himmel-vorzeichnen`.
- [ ] Review.

## Comments

**Umsetzung (08.11.2026, Worktree `prisma-brett-11`, Branch `feature/brett-11-vorzeichnen` von
`feature/brett-10-schluss` 122d6f7)**

**Messen: Protokoll der Arbeit**

- **Im Spiel** (`arbeit`, nur an, wenn eine Probe vor dem Laden `window.__arbeitAn` setzt): `sliced` und
  `compileParallel` haben einen Namen (`was`). Damit stehen im Protokoll:
  - beim Himmel: Vorschau, Tiefe, Netz, Ebenen, Shader, Hochladen, erstes Zeichnen 1 × 1, Vorzeichnen, scharfes Bild,
    Streifen, Freigeben, Vorrat;
  - beim Brett: bauen, Shader, Shader fürs Überblenden, Texturen, freigeben;
  - beim Level: vorab, Rest aufbauen, Shader, freigeben;
  - dazu die Ereignisse gewählt, vorladen, erstes Bild, wächst und Lichtwelle.
- **In der Geschichte-Probe** (`ARBEIT`, über `Page.addScriptToEvaluateOnNewDocument`): Ein eigener rAF zählt jedes Bild
  der ganzen Sitzung, auch ausserhalb der Messungen. Bilder der Probe zählen nicht.
  - Jede Lücke über 50 ms in einer Messung nennt «Arbeit darin (ms im Hauptthread)».
  - Am Ende des Laufs steht je Arbeit das längste Bild, in dem sie lief, und jede Lücke über 100 ms mit ihrer Arbeit.
  - `--messwerte` schreibt das mit unter `arbeit`. Die Probe prüft damit nichts, sie zeigt nur.
- **Spur:** Dazu habe ich Chrome-Spuren (Tracing) der Lücken aufgenommen, mit Zeiten im Grafikprozess (GPU-Prozess).

**Ursache der Lücke im ersten Bild**

- **Nicht der neue Himmel.** Im langen Bild (`w` 0,03–0,06) lief im Hauptthread keine Arbeit. In der Spur hängt der
  Grafikprozess (`CrGpuMain`) 47–75 ms in einem `CommandBuffer::Flush` von WebGL mit nur wenigen Befehlen, dazu
  25–53 ms `FinishPaintRenderPass`. Die Shader des Vulkans (D3DCompile 250–850 ms) waren da längst in den Hintergrund-
  Threads fertig.
- **Ein Vorzeichnen allein half nicht.** Ich habe zuerst wie verlangt vorgezeichnet: in ein Ziel von 1 × 1 wie das
  Spiel (HDR, Tiefe und Stencil), dann in voller Grösse in `composer.readBuffer`. `--grenzen` blieb rot (71 und 109 ms,
  dann 71 und 88 ms).
- **Ohne Freigeben grün.** Wird das alte Panorama nicht freigegeben, ist das erste Bild glatt: zweimal 53 ms statt
  69–124 ms. Die Ursache ist also `skyTheme.update`. Sobald der alte Himmel ganz aus ist, beginnt im selben Bild der
  neue, und der alte gibt mit `release` alles auf einmal frei. Am Desktop sind das rund 300 MB: das ganze Bild
  4096 × 2048 mit Mipmaps und drei Streifen 4096 × 3823. Dazu kommen Netze und Programme.
- **Je Textur messbar.** In Häppchen, je Bild eine grosse Textur, kostete jedes Löschen eines Streifens noch je 53 ms.
  Eine Sekunde später kostete es einmal 143 ms, mitten im Einblenden und Hochladen des neuen Himmels. Acht Sekunden
  später in einem ruhigen Level kostete es nichts (18 ms).
- **Prolog überspringen und Übung 8 wiederholen** in `--dorf` sind dieselbe Stelle: Der Wald bzw. das Dorf gibt beim
  Wechsel frei.
- **Handy:** Dort sind die Panoramen kleiner, ohne Streifen. Darum war die Ansicht Handy an den Weltgrenzen grün.

**Gewählter Weg** (alles in `index.html`)

- **Vorrat für Texturen der Himmel** (`skyTexPool`): Was `skyUpload` angelegt hat (ganzes Bild, Vorschau, Streifen,
  Bilder der Felsen; feste Grösse über `texStorage2D`), wird beim Freigeben nicht gelöscht, sondern aufgehoben.
  - Der nächste Himmel mit gleicher Grösse lädt hinein. So entfällt das Löschen, und auch das erste Schreiben in eine
    neue grosse Textur, wenn die Grösse passt.
  - Nach 30 s, auf dem Handy nach 10 s, löscht `freigabe` eine Textur, die niemand genommen hat.
  - `dispose` gibt eine Textur nur einmal zurück: Die Vorschau hängt auch in den Uniforms und bekäme sonst zwei
    Himmel.
  - `skyTexPool.stand` zeigt Zahl und MB im Vorrat (für Proben).
- **Freigeben an stillen Bildern** (`freigabe`): Was nicht in den Vorrat geht (Netze, Materialien, Texturen von three,
  Löschen aus dem Vorrat), wartet auf ein stilles Bild (`still`). Dann wird je Bild eine grosse Textur oder Kleines in
  Häppchen freigegeben.
  - Still heisst: Ein Level läuft, der Himmel ist ganz bereit (`skyTheme.ready`, auch kein Hochladen mehr), keine
    Feier, kein Menü, keine Übersicht, und das seit 0,5 s.
  - Länger als 20 s wartet nichts.
  - Das gilt nur fürs Freigeben beim Wechsel (`release`). Ein abgebrochener Aufbau gibt wie bisher sofort frei.
- **Unsichtbar vorzeichnen** (`skyTheme.vorzeichnen`, je Panorama `vorzeichnen`, `vorzeichnenNoetig`): Das geschieht in
  `draw` vor dem Bild des Spiels, nur an einer ruhigen Stelle (`ruhe.jetzt`) und je Bild höchstens einmal.
  - Gezeichnet wird ein geladenes Panorama, das noch nie zu sehen war (gewählt oder vorgeladen). Es ist einmal ganz
    eingeblendet (`uReady` 1), aber durchsichtig mit Deckkraft 0,001, wie im ersten Bild des Einblendens.
  - Es geht in `composer.readBuffer`, mit allen `SCENE_PREPASSES` und dem Pinsel samt seinen Zielen. Das Bild selbst
    überschreibt danach alles. `adaptiveResolution.hold(0,5)` wertet das doppelt gezeichnete Bild nicht.
  - Einmal je Panorama: `release` setzt die Marke zurück. Das gilt auch ohne Vorladen (Bergwald 10 wiederholen, dann
    «Weiter»): Der Himmel wird vorgezeichnet, sobald er geladen ist, noch während der alte steht (`holding`).
  - Am Desktop machte das keinen messbaren Unterschied: `--grenzen` je zweimal mit und ohne gleich, nach dem Freigeben
    in Häppchen. Es bleibt «auf Nummer sicher» für Treiber, die Fassungen eines Shaders erst beim ersten echten
    Zeichnen in Ziel, Format und Mischung anlegen (Kachel-GPUs wie das Adreno im Poco), und für die Ziele des Pinsels
    am Strand, die sonst das erste sichtbare Bild in voller Grösse anlegt. Es kostet einmal je Panorama 1–8 ms
    Hauptthread, das Bild bleibt unter 36 ms.

**Streifen am Desktop in einer Höhe** (`BAND_HOEHE`, Shader `uKl`)

- **Befund:** Das erste Schreiben in eine Textur einer neuen Grösse hielt den Grafikprozess 105–142 ms an, einmal je
  Welt. Im Protokoll lag es in `--ganz` im ersten Level des Vulkans (`flow` play, Blick aufs Brett, Himmel schärft
  nach), in `--grenzen` beim Aufstieg in die Übersicht. Beides ist sichtbar.
- **Warum nur dort:** Die Streifen der Wüste haben 4096 × 3823 Zeilen, alle übrigen 4096 × 3413. Nur der Wechsel der
  Grösse traf den Vorrat nicht.
- **Versucht, ohne Erfolg:**
  - kleinere Streifen (128 statt 256 Zeilen): 135 und 142 ms;
  - jede neue Stufe vorher auf der Grafikkarte leeren (Framebuffer und `clear`): 124 und 124 ms;
  - nur an stillen Bildern laden: Das geht nicht, weil `skyTheme.ready` und damit die Geschichte auf die Streifen
    wartet.
- **Gebaut:** Alle Streifen liegen in Texturen von 4096 × 4096. Jeder Streifen belegt die unteren Zeilen jeder Stufe.
  - Der Shader liest mit dem Anteil `uKl` und hält Abstand zur Kante nach der Grösse des Abdrucks, damit tiefe Mipmaps
    die Zeilen darüber nicht mitlesen.
  - Der Vorrat nimmt danach die Streifen jeder Welt: `--grenzen` zeigte zweimal «Textur 4096×4096: aus dem Vorrat»,
    und der Vulkan hatte höchstens 36 ms statt 124 ms.
  - Ein Bild des Vulkans mit dem Horizont im Blick (Blick 0,45) sieht vorher und nachher gleich aus: keine Naht an der
    Kante des Streifens.
  - Kosten: rund 10–20 % mehr Grafikspeicher für die Streifen am Desktop (3 × 89 statt 3 × 74 bzw. 83 MB).

**Lücken vorher und nachher** (Desktop headless mit GPU, Quadro T2000. «vor» heisst 122d6f7 mit derselben Probe, im
Wechsel gemessen, je Fall mindestens 2 Läufe)

| Lauf | Messung | vorher (ms) | nachher (ms) |
|---|---|---|---|
| `--grenzen` Desktop | Wiederholen: Wüste → Vulkan | 69, 97, 83, 107¹, 124¹ (Ticket 10: 117) | 53, 39, 53, 71, 53, 53, 37, 41, 53² |
| `--wagen` Desktop | Wiederholen über die Grenze ins Meer | 89, **123** (Ticket 10: 100) | 53, 70, 53² |
| `--dorf` Desktop | Menü → Prolog → Überspringen | 75, 28 (Ticket 10: 174) | 60, 19 |
| `--dorf` Desktop | Übersicht → Übung 8 wiederholen | 54, 53 | 36, 22 |
| `--uebersicht --handy` | Menü → Übersicht | **393**, 19 | **424**, 71 |
| `--uebersicht --handy` | Spiel → Übersicht | **160**, **106** | **124**, 52 |
| `--uebersicht --handy` | letztes Level → Übersicht | **356**, **354** | 21, **336** |
| `--uebersicht --handy` | Übersicht → Spiel (Schliessen) | 19, **161** | 22, **181** |

¹ mit Spur aufgenommen. ² Lauf der Abnahme auf dem Endstand (mit Streifen in einer Höhe).

`--dorf` und `--uebersicht --handy` siehe auch «Dieselben Fälle auf beiden Ständen» unter der Abnahme.

**`--uebersicht` auf dem Handy: nicht vom Himmel**

- **Im Bild keine Arbeit.** In keinem der langen Bilder lief Arbeit aus dem Protokoll. Kein Himmel und kein Brett
  wechselt dort: Unter der Übersicht steht der Strand bzw. die Milchstrasse, `w` 1.
- **Wo und wie gross:** Die Lücken springen zwischen den Messungen hin und her (Öffnen, Schliessen, Menü) und sind
  vorher wie nachher gleich gross (bis 424 ms).
- **Spur des ganzen Ablaufs:** Sie zeigt sechs `DXGISwapChainImageBacking::Present` von 350–460 ms im Grafikprozess
  (von 307 über 3 ms). Der Hauptthread des Renderers war in diesen Lücken frei. Dazu kam einmal ein `DoEndRasterCHROMIUM`
  von 151 ms (Rastern der Seite).
- **Mit Spur grün:** Mit laufender Spur blieben alle Messungen der Übersicht grün.
- **Schluss:** Das Present der Swapchain von Chrome headless hängt. Das ist dieselbe Streuung, die der Reviewer von 10
  bis 450 ms gesehen hat, auch unter Milchstrasse mit Steinbrett. Sie kommt nicht aus dem Spiel und lässt sich im Spiel
  nicht beheben. Auf dem Poco ansehen (dort ohne DXGI).

**Vorlade-Schritt → längstes Bild** (aus dem Protokoll der Arbeit: das längste Bild, in dem der Schritt lief; Desktop
`--grenzen`, vorher = gleicher Code mit Protokoll, ohne Vorrat und Freigabe)

| Schritt | vorher | nachher |
|---|---|---|
| Himmel freigeben (beim Wechsel) | 69–124 ms (im ersten Bild des neuen) | 18 ms |
| Freigeben, je grosse Textur | – (alles auf einmal) | 18 ms (Vorrat; Löschen aus dem Vorrat an stillen Bildern) |
| Himmel: Vorzeichnen | – | 17–36 ms |
| Himmel: erstes Zeichnen 1 × 1 | 18 ms | 18 ms |
| Himmel: Shader / Hochladen / Tiefe / Netz / Ebenen | 18–35 ms | 18–36 ms |
| Himmel: scharfes Bild | 18–53 ms | 18–36 ms |
| Himmel: Streifen (Desktop) | 105–142 ms (Vulkan) | 36 ms (in einer Höhe aus dem Vorrat) |
| Brett: bauen | 18 ms | 18 ms (Hauptthread 6–15 ms) |
| Brett: Shader, Shader Überblenden, Texturen | 18–36 ms | 18–36 ms |
| Brett: freigeben | 18–36 ms | 17–36 ms |
| Lichtwelle | 18 ms | 18 ms |
| Level vorab / aufbauen / Shader / freigeben | 18–106 ms² | 18–36 ms² |

² «Level vorab» hatte einmal 106 ms (Desktop) und einmal 393 ms (Handy, im selben Bild wie das Hängen von Present beim
Öffnen der Übersicht) bei 7 ms im Hauptthread. Das wird dem Present von Chrome zugeschrieben, nicht dem Level.

Ausserhalb der Übergänge zeigt das Protokoll nur den **Seitenstart** (die ersten 0,1–3 s nach dem Laden, mit `?nointro`
unter dem offenen Menü): bis 300 ms beim Bauen von Steinbrett und Moospolster (Hauptthread 3–38 ms) und beim
Übersetzen der Shader. Im Spiel liegt das hinter dem Startbildschirm, der dafür vor der Enthüllung wartet (Ticket 08 der
Leistung). Es ist nicht Teil dieses Tickets.

**Abnahme** (08.11.2026, Browser seriell über `leise.sh`, GPU, stumm)

- Node: Logik 2045, Geschichte 35, KI-Tester 84, Levelliste 54, Beurteilung 206, Vorrat 18, Hall 6, Würfelliste 20,
  alle grün. Den Generator betrifft das Ticket nicht.
- `offline.mjs`: bestanden (zweimal).
- `brett-probe`: 100/100 im ersten Lauf. Der Lauf auf dem Endstand hatte 98/100: `formen` moss → raisedBed
  (flach) 1 Pixel und tidePool → moss (flach heraus) 2 Pixel. Das ist das bekannte Moospolster, flach (Tickets 05, 09
  und 10), an den Brettern ändert das Ticket nichts.
- **Geschichte-Probe** (Endstand, Desktop / Handy):
  - grün: `--ganz` Desktop, `--grenzen` beide, `--wagen` beide, `--menue` Desktop. Im letzten Satz mit
    `BILD_NACHLAUF_MS` dazu `--ganz --handy` und `--dorf --handy`.
  - rot: `--dorf` Desktop, `--uebersicht` beide, `--menue --handy`. Alle roten Lücken liegen
    ausserhalb der Weltgrenzen. Sie haben im Bild keine Arbeit aus dem Protokoll, oder nur «Level vorab» unter 7 ms.
  - Die Basis 122d6f7 ist dort unter denselben Bedingungen ebenso rot (Tabelle unten).
- **Ursache der übrigen roten Lücken:** Die Spur zeigt in jeder untersuchten Lücke (Öffnen und Schliessen der
  Übersicht, «Übung 8 wiederholen») ein `DXGISwapChainImageBacking::Present` von 350–460 ms im Grafikprozess, bei
  freiem Hauptthread.
  - Bei «Übung 8 wiederholen» dekodiert dabei der Worker die Bilder des Dorfs (`HandlePostMessage` 509 ms, JPG). Die
    Läufe haben Priorität «Leerlauf» (`leise.sh`).
  - Im Lauf des Tages nahmen diese Lücken zu, auf beiden Ständen. Am Morgen waren `--dorf` und `--menue --handy` noch
    grün, wie in Ticket 10.
- **Bild der Probe:** Eine Lücke im ersten Bild einer Messung, die gleich nach einem Bild der Probe begann, gehört zur
  Probe: Im Protokoll der Sitzung liegt sie im Zeitfenster dieses Bilds. Gemessen in `--dorf --handy`, «Satz zum Ende
  → Bergwald 1», 266–283 ms bei 0 ms.
  - Seither beginnt `messe` frühestens 800 ms nach dem letzten Bild der Probe (`BILD_NACHLAUF_MS`). Ausgenommen
    wird dabei nichts.

**Dieselben Fälle auf beiden Ständen** (je längste Lücke über 100 ms der Messung in ms, sonst «grün»; vor = 122d6f7)

| Lauf | vor | neu |
|---|---|---|
| `--dorf` Desktop | Übung 8: 389; Prolog 120 und Übung 8 231 | grün (Übung 8: 23); Übung 8: 335 und 421 |
| `--dorf --handy` | grün, grün, Übung 8: 210 | Satz zum Ende: 266, 283 (bei 0 ms, Bild der Probe); mit `BILD_NACHLAUF_MS` grün |
| `--uebersicht` Desktop | Schliessen 495, Menü 212; Schliessen 180, Öffnen aus dem Menü 299, letztes Level 161 | Schliessen 197, Öffnen 321, Menü 267; Spiel 159, Öffnen 196, letztes Level 160 |
| `--menue --handy` | grün, grün, grün | Prolog 196 (Bühne blendet ein); grün; «anderer Grad, andere Welt» 356 (Himmel Wüste → Wald blendet über, `w` 0,46) |
| `--ganz --handy` | Neuladen 160 (bei 0 ms); Prolog 443 | Prolog 319 (Bühne blendet ein); grün |

**Leistung in Ruhe** (`leerlauf-probe`, Abschnitt «Ruhe», headless mit GPU; Desktop 1440 × 900; Handy 393 × 873,
Pixeldichte 2,75, CPU 4× gedrosselt; vor = 122d6f7 über `--seite`, je Himmel im Wechsel)

| Ansicht | Himmel | GPU-Mittel neu / vor (ms) | GPU-p95 neu / vor | CPU-p95 neu / vor | Bild-p95 neu / vor | Bilder/s neu / vor |
|---|---|---|---|---|---|---|
| desktop | milky | 13,40 / 13,30 | 14,6 / 14,3 | 6,3 / 6,2 | 18,3 / 18,3 | 57,0 / 57,1 |
| desktop | solar | 13,26 / 13,03 | 14,7 / 14,2 | 6,7 / 6,6 | 18,2 / 18,2 | 57,1 / 57,2 |
| desktop | forest | 13,46 / 13,39 | 14,5 / 14,5 | 4,7 / 4,8 | 18,3 / 18,3 | 57,0 / 56,9 |
| desktop | beach | 19,84 / 19,84 | 22,0 / 23,8 | 7,8 / 7,6 | 35,3 / 35,4 | 49,4 / 49,4 |
| desktop | desert | 14,78 / 14,52 | 15,4 / 15,8 | 4,6 / 4,7 | 18,3 / 18,3 | 56,7 / 56,7 |
| desktop | volcano | 17,78 / 17,67 | 19,8 / 20,6 | 6,9 / 7,0 | 18,5 / 18,3 | 55,1 / 55,4 |
| desktop | village | 12,19 / 12,60 | 13,0 / 13,2 | 4,5 / 4,4 | 18,2 / 18,3 | 57,3 / 57,2 |
| handy | milky | 15,31 / 11,89 | 20,0 / 15,9 | 20,3 / 17,7 | 18,3 / 18,3 | 55,3 / 56,3 |
| handy | solar | 15,33 / 14,88 | 20,9 / 21,3 | 18,6 / 22,1 | 18,3 / 18,3 | 55,9 / 54,3 |
| handy | forest | 12,88 / 12,85 | 15,3 / 13,3 | 17,1 / 15,9 | 18,2 / 18,2 | 56,1 / 56,2 |
| handy | beach | 15,52 / 17,55 | 19,3 / 22,9 | 19,8 / 23,4 | 18,2 / 35,6 | 56,1 / 51,9 |
| handy | desert | 12,82 / 12,54 | 14,1 / 13,1 | 13,2 / 16,4 | 18,3 / 18,2 | 56,2 / 56,2 |
| handy | volcano | 16,99 / 30,88 | 21,5 / 37,0 | 20,1 / 40,2 | 18,3 / 53,1 | 55,9 / 31,8 |
| handy | village | 13,47 / 12,77 | 16,2 / 13,9 | 18,7 / 15,6 | 18,3 / 18,3 | 55,6 / 56,2 |

- **Desktop:** gleich, alle Unterschiede in der Streuung (≤ 0,26 ms im Mittel).
- **Handy:**
  - Die Werte streuen, wie in Ticket 10. Der Vulkan «vor» hatte einen Ausreisser (30,9 ms, 31,8 Bilder/s).
  - Milchstrasse und Dorf je zweimal nachgemessen: Milchstrasse neu 15,85 / 15,01, vor 14,72 / 14,53 ms; Dorf neu
    13,09 / 13,26, vor 13,21 / 12,41 ms.
  - Die Bildabstände (p95) sind überall gleich.
  - In Ruhe zeichnet das Ticket nichts zusätzlich: `vorzeichnen` fragt nur, und `ruhe.jetzt` erst, wenn ein
    Panorama ansteht.
- **Vorab gespeichert:** 4 153 961 Bytes (unverändert, keine neuen Dateien), Grenze 4 500 000.

**Jede Stelle: sichtbar, Massnahme** (Massstab des Nutzers vom 08.11.: Bewegt sich in dem Moment sichtbar etwas?)

| Stelle | Lücke | sichtbar? | Massnahme |
|---|---|---|---|
| Erstes Bild des neuen Himmels an Weltgrenzen (`--grenzen`, `--wagen`, `--dorf`) | 69–175 ms | ja (Himmel blendet ein, Brett wächst) | behoben: Vorrat, Freigeben an stillen Bildern, Vorzeichnen |
| Streifen am Desktop, neue Grösse (Vulkan) | 105–142 ms | ja: im Level (`--ganz`: `flow` play, Blick aufs Brett, Himmel schärft nach) und beim Aufstieg in die Übersicht | behoben: alle Streifen in einer Höhe (`BAND_HOEHE`), der Vorrat nimmt sie (danach 36 ms) |
| Öffnen und Schliessen der Übersicht auf dem Handy | 106–424 ms | ja (Übergang animiert), aber nicht vom Spiel | keine im Spiel möglich: Present von Chrome headless, siehe oben |
| Seitenstart (Bauen von Steinbrett und Moospolster, Shader) | 108–595 ms | nein: im Protokoll `wach: false`, das Menü steht, nichts bewegt sich (`?nointro`); im Spiel liegt es hinter dem Startbildschirm | keine |
| Level vorab (einmal 106 ms Desktop, 393 ms Handy) | | im selben Bild wie das Present der Übersicht | keine (Present) |

Das Protokoll hält dazu bei jeder Lücke über 100 ms den Zustand im Bild davor fest: Spiel wach, Ablauf, Blick, Fahrt,
Himmel bewegt sich, Menü, Übersicht, Bühne, verdeckt, Feier.

**Offen**

- **`--menue --handy`:** Auf dem neuen Stand war es in 3 von 4 Läufen rot, auf der Basis in 3 von 3 grün. Die Lücken
  lagen jedes Mal an einer anderen Stelle (196–356 ms), immer ohne Arbeit im Bild. Die Schritte des Tickets
  (Vorzeichnen, Freigeben, Vorrat) liefen in Bildern von 17–18 ms. Eine Ursache im Ticket habe ich nicht gefunden.
  Beim Review mit Spur noch einmal ansehen.

- **Übersicht auf dem Handy:** Das Present von Chrome headless hängt (siehe oben). Auf dem Poco messen.
- **Kein Vorzeichnen fürs Brett:** Seine Shader und Texturen sind vorab übersetzt bzw. hochgeladen (Ticket 02 und 05),
  im Protokoll ohne langes Bild.
- **Speicher:** Am Desktop bleiben ungenutzte Texturen bis 30 s im Vorrat (vorher hielt `keep` einen Himmel 30 s ganz).
  Auf dem Handy liegt der Vorrat bis zum nächsten Himmel oder 10 s; vorher gab das Handy sofort frei.

**Review (08.11.2026 abends, Reviewer, Worktree `prisma-brett-11`)**

- **Befund, mittel (sichtbar, Desktop): Naht an der oberen Kante der Streifen nach der Wüste.** Nimmt der Vorrat
  Streifen-Texturen, in denen vorher die Wüste lag (3823 Zeilen), zeigt jede andere Welt (3413 Zeilen) eine dünne,
  gelbliche Linie quer durch das ganze Panorama, gut 10° über dem Horizont (Kante `v` 0,444 der Streifen), an
  Silhouetten der Berge am deutlichsten. Gemessen: Wüste, dann `skyTheme.set` in Wald bzw. Dorf, Blick auf den
  Horizont; gegen frisch geladen 1000–2000 Pixel über 8, bis 32 Abweichung in 1–3 Zeilen über die ganze Breite. Auf der
  Basis gibt es das nicht.
  - **Ursache:** Der Worker halbiert jede Stufe mit `h >> 1`. Stufe L des Bilds hat `floor(H / 2^L)` Zeilen und
    spannt das ganze Bild darüber. In der Textur von 4096 Zeilen liegt sie also nicht genau im Anteil `uKl` = H / 4096,
    sondern bis `(2^L − 1)` Texel der Stufe 0 tiefer. Ab Stufe 2–3 liest der Shader über `uKl − (1 + 0,5 f) / n` hinaus
    in die Zeilen darüber. In einer frischen Textur sind sie leer (fast unsichtbar), aus dem Vorrat stehen dort die
    Zeilen des vorigen Himmels. Dazu sind die Stufen ab 1 um bis zu einen Texel gegen Stufe 0 verschoben (frisch
    geladen: Kanten bis 51 Abweichung an einzelnen Pixeln, ohne Naht).
  - **Versucht:** Der Abstand `(1 + 3 f) / n` statt `(1 + 0,5 f) / n` im Shader macht die Linie kürzer, gibt an
    Silhouetten aber sichtbare Treppen. Das ist keine Lösung.
  - **Vorschlag:** Der Worker füllt Stufe 0 eines Streifens auf `BAND_HOEHE` Zeilen auf, indem er die letzte Zeile
    wiederholt, und rechnet die Mipmaps erst danach. Dann geht jede Stufe genau auf, die Kante wirkt wie
    `CLAMP_TO_EDGE`, und das Kürzen in `uKl` entfällt. Das kostet am Desktop rund 20 % mehr Zeilen beim Hochladen,
    an stillen Stellen. Danach soll der Vergleich «Wüste → andere Welt gegen frisch geladen» ohne Linie sein.
- **Vorrat und Freigabe: richtig.**
  - `dispose` einmal (der Hörer entfernt sich), `give` lehnt Doppelte ab.
  - three registriert für diese Texturen keinen eigenen Hörer (`version` 0, nie `initTexture`), löscht also nichts aus
    dem Vorrat.
  - `bg.uPreview` wechselt in `update` vor `release`.
  - Jeder Eintrag wird nach `KEEP_MS` und höchstens `FRIST_MS` gelöscht, auch ohne stilles Bild. Steht die Seite im
    Hintergrund, wartet nur der rAF-Takt.
  - Ein abgebrochener Aufbau gibt in den Vorrat zurück oder sofort frei.
  - Beim Kontextverlust lädt das Spiel ohnehin neu (Meldung); `deleteTexture` auf verlorene Namen tut nichts.
- **Grafikspeicher Handy:** Der Höchststand bleibt der des Überblendens (alter und neuer Himmel, je rund 45–55 MB). Er
  dauert jetzt 10–30 s länger, bis der Vorrat am stillen Bild löscht. Nur bei raschem Wechsel über drei Himmel mit
  verschiedener Grösse käme ein Panorama dazu; die ganzen Bilder sind gleich gross und werden wiederverwendet.
- **Probe:** `ARBEIT` zeigt nur. Ohne `__arbeitAn` kostet `arbeit` nur die Abfrage von `an`. Die Pause von 800 ms nach
  einem Bild der Probe liegt immer zwischen `bild` und `messe`, also vor der Handlung, die gemessen wird, an einer
  wartenden Stelle. Sie verdeckt keine Lücke des Spiels.
- **`--menue --handy`:** Im Wechsel mit 122d6f7 (dieselbe Probe) neu 4 von 4 grün (17–36 ms), Basis 3 von 3 grün
  (18–33 ms). Die roten Läufe des Umsetzers waren Streuung.
- **Present-Zuschreibung:** Spuren lassen sich nicht nutzen, weil mit laufender Spur alles grün bleibt (`--menue`,
  `--uebersicht --handy`). Im sichtbaren Chrome (`fenster`, gleiche GPU) waren dafür grün: `--menue` (headless
  «Menü → Prolog» 465 ms), `--uebersicht` (headless 232/375 ms), `--uebersicht --handy` (headless 127/435/143 ms) und
  in `--dorf` «Prolog überspringen» 67 ms und «Übung 8 wiederholen» 18 ms (headless 356/371 ms). Einmal 117 ms unter
  einem stehenden Untertitel, ohne Arbeit im Bild. Das stützt die Zuschreibung an headless.
- **`brett-probe`:** «Reise» einmal 1348 ms im ganzen Lauf, danach allein je zweimal neu und Basis grün (50 ms).
  `formen` 1 Pixel (raisedBed → tidePool), bekannt.
