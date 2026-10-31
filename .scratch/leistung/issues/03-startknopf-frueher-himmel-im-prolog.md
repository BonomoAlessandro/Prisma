# 03: Startknopf spätestens nach 3,9 s, Himmel lädt im Prolog

**Spec:** ../spec.md

**Blocked by:** 02, 04 (04 baut die Prolog-Bühne und ihr Vorwärmen um, dieses Ticket plant die Ladearbeit darum herum)

**Status:** resolved

**What to build:** «Klicken/Tippen zum Starten» erscheint **spätestens 3,9 s** nach Beginn der Enthüllung, auch auf dem
Handy und bei langsamem Laden. Die schwere Ladearbeit für den Himmel kollidiert weder mit den Animationen des
Startbildschirms noch mit der Fahrt des Prologs.

Heute wartet der Knopf auf mindestens 2,9 s **und** `skyTheme.shown` (`index.html` 15799–15808, Commit 7bf959c),
höchstens 15 s. Der Startbildschirm ist aber deckend (305), man sieht den Himmel dahinter also nicht. Die Enthüllung
selbst wartet vorher auf die Schrift (bis 0,8 s) und `sceneReady` (bis 5 s, 15790–15796). Ticket 02 löst die Bindung an
das erste WebGL-Bild. Bei `introCalm` (4,2 s, `INTRO_REVEAL_MS` 15769) startet ein Schwall Arbeit: Shader, Uploads,
Aufwärm-Zeichnen, Vorwärmen von Menü-SVG mit Blur, Übersicht und Prolog-Bühne (17632–17637, 11730ff). Er fällt genau in
das Einblenden und Pulsieren des Knopfs.

**Wichtig: WebGL-Pause allein genügt nicht.** Das erste Schreiben in eine grosse Textur hält den **Grafikprozess**
30–80 ms an (11778–11781). Über diesen Prozess laufen auch CSS und SVG, also auch Startbildschirm und Prolog-Bühne.
Deshalb hält `skyTheme.quiet` scharfes Bild und Streifen heute schon aus der Prolog-Fahrt heraus (18050–18054, «ihr
Hochladen hielt sie bis 110 ms an», Review Ticket 07 der Geschichte). Diese Regel bleibt bestehen.

- [ ] **Enthüllung ohne lange Wartezeit:** Sie beginnt, sobald die Schrift geladen ist (höchstens 0,8 s wie heute),
      nicht erst nach einem WebGL-Bild. Die Zeit vom Laden der Seite bis zum Knopf wird gemessen und im Ticket notiert.
- [x] Der Knopf erscheint nach Ende der Enthüllung, spätestens aber bei 3,9 s, **ohne** auf den Himmel zu warten.
- [x] **Wo die grossen Uploads hindürfen:** Bestandsaufnahme aller GPU-Uploads und Shader-Kompilierungen von Seitenstart
      bis Spielbeginn: Vorschau, Netz, Tiefe, scharfes Bild, Streifen, Ebenen, Vorwärmen. Für jede wird festgelegt, wann
      sie läuft:
      - nur an Stellen, an denen nichts Sichtbares animiert: die Enthüllung ist fertig und nur das Pulsieren läuft
        (prüfen, ob auch das stockt), oder im Prolog beim Warten auf Tippen zwischen den Fahrten (nicht während einer
        Fahrt);
      - oder in Stücken, die klein genug sind, dass keiner den Grafikprozess über einen Frame anhält, z. B. kleinere
        `texSubImage2D`-Streifen.
      Das Ergebnis als Tabelle ins Ticket schreiben.
- [x] **Neue Spieler (mit Prolog):** Was für den Spielbeginn nötig ist (Vorschau und Netz, also `skyTheme.shown`), ist
      bis zum Ende des Prologs fertig. Hochgeladen wird nur in den Warte-Phasen nach der Regel oben. Ist es am Ende
      trotzdem nicht fertig, gibt es eine weiche Überblendung, bis der Himmel steht. Dieses Laden wird im Messwerkzeug
      markiert.
- [ ] **Spieler ohne Prolog** (Neuladen mitten im Spiel, «Weiter»): Nach dem Klick folgt eine kurze, weiche
      Überblendung, bis der Himmel steht. Kein schwarzer Blitz und kein Hänger über 33 ms ausserhalb der markierten
      Ladephase. Wie lange das auf dem Arbeitsrechner gedrosselt dauert, wird gemessen und im Ticket notiert.
- [x] **Vorwärmen:** Was heute an `introCalm` hängt, nach derselben Regel planen. Das Vorwärmen der Prolog-Bühne (so,
      wie Ticket 04 sie umgebaut hat) muss vor dem Prolog fertig sein, sonst ruckelt ihr erstes Bild (bekannt:
      103–249 ms, Ticket 08 der Geschichte). Das Menü-SVG mit Blur kann warten, bis der Prolog vorbei ist.
- [x] Ruckelt der Startbildschirm selbst noch, wird das hier mitbehoben. In Frage kommen die CSS-Animationen (223–301:
      `clip-path`-Reveal mit `text-shadow` 60 px, Strahl mit `box-shadow`) und der SVG-Fächer mit `feGaussianBlur` und
      `stroke-dashoffset` im Markup (um 1120–1124). Die Optik bleibt gleich, z. B. durch compositor-fähige Eigenschaften
      (transform/opacity) oder vorgerenderten Glow statt Live-Filter.
- [x] Messen: Abschnitte Startbildschirm und Prolog sowie Übergang ins Spiel vorher und nachher, ungedrosselt und
      gedrosselt; dazu die Zeit bis zum Erscheinen des Knopfs.
- [ ] Tests grün (Start-, Geschichte- und Offline-Tests anpassen, wo sie auf `skyTheme.shown` vor dem Start bauen),
      Review des Diffs, Commit auf `feature/leistung`.

## Comments

**31.10.2026, Umsetzung** (Branch `leistung/03-startknopf`: `eb1be8f` = Ticket 02 mit 01 und 05, darin `1242082` =
Ticket 04 gemergt, ohne Konflikte, weil 04 schon 01 enthielt; nachgezogen `d246d73` von 04, `101443b` von 02 und `6e2e4a0` von `feature/leistung` mit dem Endstand von 02, 04, 05, 06).

- **`ruhe`** (`index.html`, gleich nach `sliced`): ruhige Stellen. `ruhe.jetzt(klein)` ist wahr vor der Enthüllung
  (Seite lädt), nach ihr (`introCalm`, nur das Pulsieren läuft), auf der Bühne nur beim Warten auf Tippen und beim
  Angebot (`story.stillBild`, keine Fahrt `sc.laeuft`), während eines markierten Ladens (`ruhe.lade(promise)`, zugleich
  `leistung.markiere('laden')`) und im Spiel (dort gelten wie bisher `skyTheme.quiet` und `preload`). Nicht ruhig: die
  Enthüllung, Menü und Übersicht (`klein`: die Vorschau einer Skybox darf dort), die Bühne sonst. Mit `?nointro` (Tests
  ohne Startbildschirm) zählt das Menü als ruhig, also wie bisher. `ruhe.warte()` fragt alle 50 ms per `setTimeout`
  (kein rAF, die Szene darf ruhen). Generatoren melden `yield RUHIG` / `RUHIG_KLEIN`; `sliced(gen, true)` wartet vor
  jedem Häppchen.
- **Skybox** (`createPanoramaSky.build`): Netz und Ebenen (`sliced(…, true)`), Shader (`await ruhe.warte()` statt
  `introCalm`), jedes Stück von `skyBufferUpload`, `skyUpload` (Streifen), `skyWarmDraw` (je Teil), scharfes Bild und
  HD-Streifen nur an ruhigen Stellen; die Vorschau als `klein`. Das `skyTheme.quiet` über den ganzen Prolog ist weg: Der
  Wald lädt in den Pausen des Prologs und beim Angebot, nie während einer Fahrt.
- **Knopf:** Enthüllung nach der Schrift (≤ 0,8 s), zwei Bildern und dem Vorwärmen von Menü und Bühne
  (`vorwaermenVorStart`), ohne auf die Shader der Szene zu warten (`sceneStarted` entfernt). «Klicken zum Starten» genau
  2,9 s nach `.go` (der Strahl ist verglüht), ohne `skyTheme.shown`. Die Szene wärmt verdeckt erst auf, wenn ihre Shader
  fertig sind und keine Enthüllung läuft (`sceneLoop.mayDraw`, auch das allererste Bild).
- **Spieler ohne Prolog:** `story.skyOf` markiert das Warten auf den ersten Himmel nach dem Start (`ersterHimmel`) mit
  `ruhe.lade`: Die Kamera schaut in den Himmel, die Vorschau steht, Netz und scharfes Bild blenden weich darüber (kein
  Schwarz). Wer am Startbildschirm wartet, hat den Himmel danach meist schon (nach der Enthüllung ist es ruhig).
- **Vorwärmen:** Menü (zuerst, es kommt gleich nach dem Klick, also nicht erst nach dem Prolog) und Bühne vor `.go`
  (`vorwaermenVorStart`). Nach `introCalm` war zu spät: Ein Klick bei 3–4 s brachte das Menü kalt (gemessen 650 ms).
  Die Bühne bleibt für neue Spieler bis zum Prolog gerastert (`story.vorwaermen(true)`, Klasse `gehalten`: `#story`
  bleibt `hidden` und `inert`, CSS `#story.hidden.gehalten { opacity: 1 }`, die Welt mit 0,002 wie beim Vorwärmen);
  `playScene` blendet sie wie sonst aus 0 ein, `buehneFrei()` (weiter ohne Prolog, `resume`) lässt sie ruhen. Die
  Übersicht nach `introCalm` an einer ruhigen, verdeckten Stelle.
- **Ton:** `audio._quiet` hängt an `ruhe` (vor `.go` sofort, sonst an der nächsten ruhigen Stelle, dann im Leerlauf).
- **Hinter der Bühne zeichnen** (Fund aus dem Review von 02): `sceneLoop.mayDraw` hinter der eingeblendeten Bühne nur
  bei `ruhe.jetzt()`, also beim Warten auf Tippen und beim Angebot; `stillBild` weckt die Schleife.
- **Seitenstart:** Ein Profil (Headless, CPU 4×) zeigte die Steinplatte (`createStoneTextures`, 1024² × 16 Oktaven
  Rauschen) mit rund 1,8 s von 4 s als grössten Posten, nicht das Parsen der base64-Skybox. Sie rechnet jetzt in einem
  Worker (`stoneData`, derselbe Code, bitgleich; ohne Worker im Hauptthread), die Texturen lädt das nächste erlaubte
  Bild hoch.
- **Startbildschirm-CSS** nicht geändert: Die Lücken lagen bei `.go` (erstes Bild) und nach der Enthüllung (Laden),
  nicht in der Enthüllung selbst; Poco vorher p95 16,7 ms. Bleibt für Ticket 07 notiert.
- Probe **`tests/start-probe.mjs`** (README): Zeiten `.go`, Knopf, Himmel; Fall «Weiter» ohne Prolog mit Abschnitten.

**Bestandsaufnahme: GPU-Uploads und Übersetzen von Seitenstart bis Spielbeginn** (Wald; die anderen Welten gleich)

| Was | Art | vorher | nachher |
|---|---|---|---|
| Shader der Szene (rund 40 Programme, `compileParallel`) | Übersetzen in Threads | Seitenstart; `.go` wartete bis 5 s darauf | Seitenstart; `.go` wartet nicht |
| Umgebung (2 × PMREM `fromScene`) | Shader und Zeichnen, synchron | Seitenstart | unverändert (Laden) |
| Steinplatte (3 × 1024² RGBA, Mipmaps) | Rechnen 1,8 s bei CPU 4×, Upload | Hauptthread beim Laden, Upload im ersten Bild | Worker; Upload im ersten erlaubten Bild (vor `.go` oder nach der Enthüllung) |
| Erstes Zeichnen (Render-Targets, Spiegelung, Bloom) | ein Bild | vor `.go`, sonst auch in der Enthüllung | vor `.go` oder erst nach der Enthüllung |
| Menü-SVG mit Blur | erstes Rastern | `introCalm` (4,2 s) | vor `.go` (Laden) |
| Bühne des Prologs (6 grosse Ebenen) | erstes Rastern 100–800 ms | `introCalm`, dann freigegeben, im Prolog neu gerastert | vor `.go`; für neue Spieler bis zum Prolog gehalten |
| Übersicht | erstes Zeichnen ~100 ms | `introCalm` | nach `introCalm`, ruhig und verdeckt |
| Skybox: Teile (base64) parsen, Bilder dekodieren | Worker | ab Laden | unverändert |
| Vorschau (≤ 1024 px, ~2 MB, 2 Streifen) | Upload | sofort, auch in der Enthüllung | ruhig `klein`: nicht in der Enthüllung, im Menü erlaubt |
| Tiefe glätten, Netz, Ebenen | CPU, 6-ms-Häppchen | jederzeit (Enthüllung, Menü, Fahrt) | nur an ruhigen Stellen |
| Shader der Skybox (2 Fassungen, Pinsel) | Übersetzen in Threads | `introCalm` | ruhig |
| Netzpuffer (≤ 4 MB, sonst 2-MB-Stücke) | Upload | nach `introCalm` | ruhig, je Stück |
| Tiefe, Wassermaske, Texturen der Ebenen | Upload je Streifen | nach `introCalm` | ruhig, je Streifen |
| Erstes Zeichnen der Teile (`skyWarmDraw`) | je Teil ein Bild | nach `introCalm` | ruhig, je Teil |
| Scharfes Bild (4096, Streifen 4 MB; erstes Schreiben 30–80 ms) | Upload | eingeblendet und nicht `quiet`: Startbildschirm, Menü oder Angebot | ruhig, je Streifen: nach der Enthüllung, Pausen des Prologs, Angebot, Laden nach «Weiter» |
| HD-Streifen (nur Desktop) | Upload | wie scharfes Bild | wie scharfes Bild |
| Ton: Kontext / Puffer des Convolvers | Hauptthread 65–430 ms | vor `.go` / nach `introCalm` | vor `.go` / ruhig |
| Elemente-Shader (`warmupShaders`) | Übersetzen | nach dem ersten Level | unverändert |

**Messung** (Rechner der Agenten: Quadro T2000, 4K mit 250 %, Chrome 156, `leise.sh`; andere Agenten massen
gleichzeitig; echtes Fenster). Vorher = `6e2e4a0` (`feature/leistung` mit 02, 04, 05, 06), nachher = `5af32cb` (dieser
Branch mit `6e2e4a0` gemergt); vorher und nachher abwechselnd gefahren. Eine erste Runde auf dem Stand vor 06
(`30b697f` gegen `3c70252`) ergab dasselbe Bild.

Zeit bis «Klicken zum Starten» (`tests/start-probe.mjs --fenster`, je 4 Läufe: 2 × frisch, 2 × «Weiter»):

| | `.go` nach Laden, vorher → nachher | Knopf nach `.go` | Knopf nach Laden |
|---|---|---|---|
| Desktop | 1,29–1,57 → 1,69–2,07 s | 5,25–5,78 → **2,90–2,91 s** | 6,54–7,31 → **4,60–4,97 s** |
| Handy-Emulation, CPU 4× | 4,36–4,84 → 4,06–4,38 s | 5,80–6,21 → **2,91–2,92 s** | 10,42–10,91 → **6,99–7,29 s** |

`.go` wartet nicht mehr auf die Shader der Szene, aber auf das Vorwärmen von Menü und Bühne (Desktop rund 0,5–1 s im
Seitenstart, also Laden). Das ist bewusst: Ihr erstes Rastern hielt vorher bei `introCalm` den Startbildschirm 700–870
ms an, jetzt fällt es ins Laden. **«Höchstens 0,8 s» bis zur Enthüllung hält das auf dem Desktop nicht ein** (Schrift
≤ 0,8 s, danach das Vorwärmen); bitte entscheiden, ob das Vorwärmen vor `.go` so bleibt.

Startbildschirm mit frischem Stand (Start-Probe, max / Bilder > 33 ms, je 2 Läufe): Desktop vorher 217 / 5, 134 / 4,
nachher 83 / 6, 67 / 5; Seitenstart-Hänger vorher 807–1027 ms, nachher 534–617 ms. Handy ×4 vorher 517 / 14, 551 / 14,
nachher 250 / 33, 284 / 36; Seitenstart vorher 3,5–4,1 s, nachher 1,5–1,7 s.

Referenzdurchlauf (`tests/leistung-probe.mjs --fenster` bzw. `--fenster --handy --drossel 4`), je zwei Läufe; p95 / max /
Bilder > 33 ms:

| Abschnitt | Desktop vorher | Desktop nachher | Handy ×4 vorher | Handy ×4 nachher |
|---|---|---|---|---|
| Seitenstart (Laden), max | 942; 879 | 338; 362 | 3270; 3436 | 1051; 1134 |
| Startbildschirm | 16,9 / 868 / 6; 16,9 / 867 / 6 | 17,1 / 184 / 4; 17,4 / 217 / 7 | 16,9 / 684 / 11; 17,0 / 701 / 13 | 33,4 / 234 / 20; 16,9 / 267 / 5 |
| Menü | 16,9 / 300 / 1; 16,9 / 267 / 1 | 16,9 / 33 / 1; 16,9 / 50 / 2 | 66,8 / 334 / 27; 66,6 / 284 / 26 | 66,9 / 184 / 32; 50,2 / 150 / 37 |
| Prolog | 16,9 / 67 / 6; 16,9 / 67 / 5 | 16,9 / 83 / 7; 16,9 / 67 / 8 | 50,1 / 167 / 538; 50,1 / 184 / 579 | 50,1 / 167 / 656; 33,6 / 200 / 493 |
| Einstieg | 16,9 / 50 / 2; 16,9 / 67 / 1 | 16,9 / 67 / 2; 16,9 / 67 / 2 | 50,1 / 217 / 45; 50,1 / 200 / 44 | 50,2 / 250 / 48; 50,1 / 183 / 37 |
| Spiel | 16,9 / 20 / 0; 16,9 / 20 / 0 | 16,9 / 33 / 1; 16,9 / 17 / 0 | 50,2 / 150 / 308; 50,2 / 117 / 326 | 66,7 / 150 / 308; 50,1 / 133 / 295 |
| Reise | 16,9 / 100 / 9; 16,9 / 50 / 9 | 16,9 / 50 / 9; 16,9 / 83 / 9 | – | – |
| Laden | – | – (Himmel am Ende des Prologs fertig) | – | – |
| adaptiv / Umbauten | 1,00 / 0; 1,00 / 0 | **0,88 / 1; 0,88 / 1** | 1,00 / 2; 1,00 / 2 | 1,00 / 2; 1,00 / 2 |

Befund:

- **Desktop:** Der Hänger bei `introCalm` (870 ms) ist weg, der Startbildschirm hat höchstens 184–217 ms (nach der
  Enthüllung, beim Aufbau des Himmels), das Menü keinen Hänger mehr (33–50 statt 267–300 ms), Prolog und Einstieg
  gleich. Neue Spieler: Der Himmel war in allen Läufen am Ende des Prologs fertig (kein Abschnitt Laden).
- **Neu und offen: `adaptiv 0,88, Umbauten 1` auf dem Desktop** in beiden Läufen (und in einer dritten Probe), vorher nie.
  Eine Probe (Zeit jeder Änderung) zeigt die Absenkung bei 54 s im ersten Level (`flow.state` play, Himmel fertig),
  ohne dass ein sichtbares Bild lang war (Spiel max 17,7 ms). `adaptiveResolution` wertet die Abstände der gezeichneten
  Bilder (über 20 ms = langsam); die Ursache ist noch nicht gefunden. Das muss vor dem Handy-Durchlauf 2 geklärt sein
  (Abnahme: `adaptiv 1.00, Umbauten 0`).
- **Handy ×4:** Knopf 3,4–3,6 s früher, Seitenstart weniger als halb so lang, Menü kürzer angehalten (150–184 statt
  284–334 ms). Startbildschirm (1 von 2 Läufen) und Prolog haben mehr Bilder über 33 ms: Was vorher im langen
  Seitenstart und in den 6 s Startbildschirm lag (Aufbau des Himmels, Übersetzen, Uploads), fällt jetzt in die Zeit nach
  der Enthüllung und in die Pausen des Prologs. Einzelne Schritte (Konstruktor einer Ebene, Anstossen der Shader,
  `skyWarmDraw` eines Teils) dauern bei 4× gedrosselter CPU 100–300 ms und laufen in den Beginn der nächsten Fahrt, wenn
  nach 1,2 s getippt wird. Nach der Enthüllung pulsiert nur eine Opacity im Compositor; dort vermutlich unsichtbar, aber
  gezählt. Die Streuung zwischen Läufen ist gross (Prolog nachher 493–656, vorher 538–579).

**Fall «Weiter» ohne Prolog** (Stand mitten im Wald, Klick 1,5 s nach dem Knopf, nach 1,5 s im Menü «Weiter»):
Vorher stand der Himmel schon vor dem Klick (der Knopf wartete darauf): Menü und Spiel ohne Bild über 33 ms (Desktop),
Level nach 2,2 s. Nachher markiertes Laden: Desktop Himmel steht 1,37–1,43 s nach «Weiter», Level nach 5,4–5,5 s; im
Laden max 42 ms (1 Bild über 33 ms), Menü max 50 ms (Bild des Klicks, der Aufbau lief gerade), Spiel danach max 31–34
ms. Handy ×4: Himmel nach 3,1–3,3 s, Level nach 6,4–6,6 s; Laden p95 33,3–33,4, max 117–134 ms (zählt als Laden), Menü
max 84–117 ms. Kein Schwarz: Die Vorschau steht im Menü schon (klein, ruhig), Netz und scharfes Bild blenden darüber.

Offen, zur Entscheidung:

- Absenkung `adaptiv 0,88` auf dem Desktop (oben), Ursache suchen.
- `.go` nach dem Vorwärmen (Desktop 1,7–2,1 s statt ≤ 0,8 s) gegen Hänger von 650–870 ms im Startbildschirm oder Menü.
  **Entscheid Koordinator (31.10.2026): vorerst so, bewusst.** Das Ziel der Spec (Knopf ≤ 3,9 s) ist erreicht, der
  Knopf kommt insgesamt 2 s früher, und Hänger von 650–870 ms wären schlimmer. Nach dem Poco-Durchlauf 2 neu bewerten;
  die Checkbox bleibt offen.
- Gröbere Stücke auf dem Handy: nach dem Poco-Durchlauf 2 (Entscheid Koordinator).
- Schwache Geräte: Der Aufbau des Himmels in den Pausen des Prologs ist bei 4× gedrosselter CPU zu grob (einzelne
  Schritte 100–300 ms). Möglich: Konstruktoren der Ebenen und `skyWarmDraw` feiner teilen, nur in Pausen ab 2 s laden,
  oder auf schwachen Geräten mehr davon vor `.go` (Laden). Nach dem Poco-Durchlauf 2 entscheiden.
- Startbildschirm-CSS (Reveal mit `clip-path` und 60-px-Schein, Fächer mit Blur) ungeändert, siehe oben.
- Beim Bau des Ausgangsstands entpackte ich eine Kopie in `scratchpad/base`; dort lagen Dateien eines anderen Agenten
  (Messkopie vom Vormittag), sie sind teils überschrieben.

Tests (auf `5af32cb`): `node tests/logic.test.mjs` (2033), `node tests/golden.mjs`, `node tests/hall.test.mjs` (6),
`tests/geschichte-probe.mjs --start`, `--grad leicht --welten 2 --finale leicht`, `--handy`, `--quer`,
`tests/leistung-probe.mjs` (headless Desktop und `--handy`; Fenster Desktop und `--handy --drossel 4`, je 2 Läufe),
`tests/start-probe.mjs` (headless und Fenster), `tests/leerlauf-probe.mjs`, `tests/screenshot.mjs`,
`tests/offline.mjs`: alle grün, keine Warnung «Weckstelle fehlt». (`offline.mjs` lief einmal in eine Zeitüberschreitung
beim Strand unter Last, danach zweimal grün.)

**31.10.2026, Absenkung `adaptiv 0,88` behoben (`134a552`).** Eine Probe zeichnete jeden `tick` von
`adaptiveResolution` auf (Abstand, Budget, Zustand, Zeit seit dem letzten Stück an einer ruhigen Stelle). Ergebnis: Im
Spiel lief kein Ladestück (alle Stücke des Himmels lagen im Startbildschirm und in den Pausen des Prologs, das letzte bei
20 s). Bei 53,6–54,3 s, «Gelöst» stand (`frameRate` ruhig, 30 Bilder/s), kamen die Bilder alle 50 ms bei einem Budget
von 36 ms: `frameRate.due` hatte den Bildschirmtakt als kürzesten rAF-Abstand im Fenster gemessen, und ein Aufhol-Bild
nach einem langen (etwa 21, dann 12 ms) ergab 12 ms. Damit war k = 3 statt 2, gezeichnet wurde mit 20 statt 30 Bildern/s,
und jedes Bild galt als langsam (50 > 1,25 × 36 ms). Sichtbar war kein Bild lang. Fix: Takt aus dem 10-%-Quantil der
Abstände im Fenster. Zwei Läufe Desktop danach: `adaptiv 1.00, Umbauten 0`.

**Review Ticket 03 umgesetzt (`4da7be3`):** Die Bühne wird nur hinter dem Startbildschirm gehalten (mit `?nointro` und
`zeige()` blieb sie sonst für immer `gehalten`). Wer Prolog und Angebot gesehen hat, bekommt sie vor `.go` nicht
vorgewärmt; `.go` kommt dann bei 0,8–0,9 s (Desktop). Die Übersicht wartet auf die nächste verdeckte oder ladende
ruhige Stelle (`ruhe.laden` zählt). Der Grund unter Wasser (`ctx.later`) wird ruhig dekodiert und gerechnet. Die
Prolog-Pause ist erst nach dem gestaffelten Vorbereiten der nächsten Fahrt ruhig (`sc.ruheNachHalt` = 400 + 6 × 90 ms,
`story.stillAb`).

**Messung auf `4da7be3`** (je 2 Läufe, Fenster): Desktop `adaptiv 1.00, Umbauten 0` (beide); Startbildschirm max 184–234
ms; Menü max 33 ms; Prolog max 50–100 ms, 3–5 Bilder > 33 ms (vorher, also `6e2e4a0`, 5–6). Handy ×4: Prolog p95 33,5,
**295 / 295 Bilder > 33 ms** (vorher 538 / 579); Startbildschirm max 150–167 ms; Menü p95 50, max 133 ms; Seitenstart
918–984 ms; Karte `adaptiv 1.00 / 2 Umbauten` und einmal `0,50 / 2` (gedrosselt im Spiel, CPU-gebunden, wie in Ticket 02
beschrieben; vorher `1,00 / 2`). Knopf (Start-Probe): Desktop frisch 4,36–4,37 s nach Laden, wiederkehrend 3,75–3,77 s,
immer 2,91 s nach `.go`; Handy ×4 frisch 6,53–6,54 s, wiederkehrend 5,84–5,95 s. «Weiter» Desktop: Laden 1,36–1,39 s,
max 24–34 ms; Handy ×4: Laden 2,6–2,8 s, aber Menü max 450 ms beim Klick (der Himmel des wiederkehrenden Spielers lädt
nach der Enthüllung, der Klick 1,5 s nach dem Knopf trifft ein laufendes Stück); offen für den Poco-Durchlauf 2.

**31.10.2026, Browser-Review (Stand `4da7be3`, vorher `6e2e4a0`; echtes Fenster, Quadro T2000, `leise.sh` 100 %).**
Urteil: **bereit für Handy-Durchlauf 2.**

- **Absenkung `0,50` ist Streuung, nicht neu durch 03.** Referenzdurchlauf Handy ×4, abwechselnd je 3 Läufe: vorher
  `1.00/2`, `0.50/2`, `0.50/2`; nachher `1.00/2`, `0.50/2`, `1.00/2` (ein vierter, instrumentierter nachher: `0.50/2`).
  Eine Probe schrieb jede Änderung von `adaptiveResolution` mit den letzten 60 `tick` mit: In allen Läufen (vorher und
  nachher) senkt sie zuerst bei 57–61 s im ersten Level (`play`, 30 Bilder/s, Budget 43 ms, Bilder 30–55 ms: die
  4×-Drosselung ist CPU-gebunden, CPU p95 von `frame()` 26–32 ms). Ob die Probe dann zurücknimmt und sperrt (`1.00/2`)
  oder «geholfen» hat und bei 91–95 s auf 0,5 geht, entscheidet der Zufall im Messfenster. Im ersten Level lief kein
  Ladestück über 30 ms (Zeiten jedes `sliced`-Schritts protokolliert); die Arbeit vor `frame()` im selben rAF ist dort
  also nicht die Ursache. Vorher zeigte ein Lauf noch den alten Fehler (Takt 6,1 ms aus einem Aufhol-Bild, Absenkung
  in der Reise), den `134a552` behebt. Desktop nachher 2 × `1.00/0`.
- **Optik** (Bilder und Screencast mit Helligkeit je Bild, Desktop und Handy ×4, neu und «Weiter»): Enthüllung,
  Knopf, Menü, alle Bilder des Prologs, Angebot und Spiel gleich wie vorher (nebeneinander kein Unterschied), Wald im
  Spiel scharf. Kein schwarzes Bild nach «Weiter»: Die Kamera steht 2–3 s auf dem Himmel (Vorschau), dann blendet das
  Level ein. Start-Probe neu: nach `.go` vorher Lücken bis 230–550 ms (beim Knopf, Himmel lädt), nachher Desktop
  höchstens 89 ms, Handy ×4 in der Enthüllung keine über 36 ms, bei `introCalm` einmal 269 ms (nur das Pulsieren).
- **Bestehend, nicht 03:** Jeder Umbau der Auflösung zeigt ein einzelnes schwarzes Bild (Screencast: Helligkeit 33 → 5
  → 33, in allen Läufen mit Umbau, vorher wie nachher, keins ohne Umbau). Auf dem Poco also nur sichtbar, wenn die
  Absenkung doch greift.
- **Hänger beim Klick ins Menü (wiederkehrend, Handy ×4):** in 3 instrumentierten Läufen nicht nachgestellt: Menü max
  124–161 ms. Der lange Task beim Klick ist das Öffnen des Menüs selbst (128–168 ms, kein Ladestück; der Klick kommt
  0,2 s nach `introCalm`, die Stücke davor dauerten 31–37 ms). Spätere Lücken bis 430 ms ohne Script (Grafikprozess)
  liegen im markierten Laden bzw. im Abstieg ins Level. Keine einfache Abhilfe nötig; auf dem Poco beobachten.
- Hinweis zur Karte: Der Abschnitt Startbildschirm enthält auch das Vorwärmen vor `.go` (Desktop einmal 458 ms bei
  1,1 s, ohne Script): unsichtbar, vor der Enthüllung, aber auf der Karte als «längstes Bild» sichtbar. Prolog Handy
  ×4: mehr Bilder über 33 ms als vorher (58–93 statt 15–28, Laden in den Pausen), max kleiner; auf dem Poco auf ein
  Stocken der Glühwürmchen in den Pausen achten.
- Konsole: keine Fehler, keine Warnung «Weckstelle fehlt». `node tests/logic.test.mjs` (2033) und
  `node tests/golden.mjs` grün.
