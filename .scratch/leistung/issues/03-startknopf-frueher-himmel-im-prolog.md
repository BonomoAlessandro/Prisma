# 03: Startknopf spätestens nach 3,9 s, Himmel lädt im Prolog

**Spec:** ../spec.md

**Blocked by:** 02, 04 (04 baut die Prolog-Bühne und ihr Vorwärmen um, dieses Ticket plant die Ladearbeit darum herum)

**Status:** ready-for-agent

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
- [ ] Der Knopf erscheint nach Ende der Enthüllung, spätestens aber bei 3,9 s, **ohne** auf den Himmel zu warten.
- [ ] **Wo die grossen Uploads hindürfen:** Bestandsaufnahme aller GPU-Uploads und Shader-Kompilierungen von Seitenstart
      bis Spielbeginn: Vorschau, Netz, Tiefe, scharfes Bild, Streifen, Ebenen, Vorwärmen. Für jede wird festgelegt, wann
      sie läuft:
      - nur an Stellen, an denen nichts Sichtbares animiert: die Enthüllung ist fertig und nur das Pulsieren läuft
        (prüfen, ob auch das stockt), oder im Prolog beim Warten auf Tippen zwischen den Fahrten (nicht während einer
        Fahrt);
      - oder in Stücken, die klein genug sind, dass keiner den Grafikprozess über einen Frame anhält, z. B. kleinere
        `texSubImage2D`-Streifen.
      Das Ergebnis als Tabelle ins Ticket schreiben.
- [ ] **Neue Spieler (mit Prolog):** Was für den Spielbeginn nötig ist (Vorschau und Netz, also `skyTheme.shown`), ist
      bis zum Ende des Prologs fertig. Hochgeladen wird nur in den Warte-Phasen nach der Regel oben. Ist es am Ende
      trotzdem nicht fertig, gibt es eine weiche Überblendung, bis der Himmel steht. Dieses Laden wird im Messwerkzeug
      markiert.
- [ ] **Spieler ohne Prolog** (Neuladen mitten im Spiel, «Weiter»): Nach dem Klick folgt eine kurze, weiche
      Überblendung, bis der Himmel steht. Kein schwarzer Blitz und kein Hänger über 33 ms ausserhalb der markierten
      Ladephase. Wie lange das auf dem Arbeitsrechner gedrosselt dauert, wird gemessen und im Ticket notiert.
- [ ] **Vorwärmen:** Was heute an `introCalm` hängt, nach derselben Regel planen. Das Vorwärmen der Prolog-Bühne (so,
      wie Ticket 04 sie umgebaut hat) muss vor dem Prolog fertig sein, sonst ruckelt ihr erstes Bild (bekannt:
      103–249 ms, Ticket 08 der Geschichte). Das Menü-SVG mit Blur kann warten, bis der Prolog vorbei ist.
- [ ] Ruckelt der Startbildschirm selbst noch, wird das hier mitbehoben. In Frage kommen die CSS-Animationen (223–301:
      `clip-path`-Reveal mit `text-shadow` 60 px, Strahl mit `box-shadow`) und der SVG-Fächer mit `feGaussianBlur` und
      `stroke-dashoffset` im Markup (um 1120–1124). Die Optik bleibt gleich, z. B. durch compositor-fähige Eigenschaften
      (transform/opacity) oder vorgerenderten Glow statt Live-Filter.
- [ ] Messen: Abschnitte Startbildschirm und Prolog sowie Übergang ins Spiel vorher und nachher, ungedrosselt und
      gedrosselt; dazu die Zeit bis zum Erscheinen des Knopfs.
- [ ] Tests grün (Start-, Geschichte- und Offline-Tests anpassen, wo sie auf `skyTheme.shown` vor dem Start bauen),
      Review des Diffs, Commit auf `feature/leistung`.

## Comments

**31.10.2026, Umsetzung** (Branch `leistung/03-startknopf`: `eb1be8f` = Ticket 02 mit 01 und 05, darin `1242082` =
Ticket 04 gemergt, ohne Konflikte, weil 04 schon 01 enthielt; nachgezogen `d246d73` von 04 und `101443b` von 02).

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
gleichzeitig, die Last schwankte stark; echtes Fenster). Vorher = `30b697f` (02 und 04 zusammengebaut), nachher =
`3c70252`. Rohdaten lokal (Scratchpad), Karten wie in Ticket 01.

Zeit bis «Klicken zum Starten» (`tests/start-probe.mjs --fenster`, je 4 Läufe: 2 × frisch, 2 × «Weiter»):

| | `.go` nach Laden, vorher → nachher | Knopf nach `.go` | Knopf nach Laden |
|---|---|---|---|
| Desktop | 1,36–1,49 → 1,61–2,27 s | 5,26–5,80 → **2,90–2,91 s** | 6,62–7,19 → **4,51–5,18 s** |
| Handy-Emulation, CPU 4× | 4,31–4,86 → 4,32–4,64 s | 5,84–6,11 → **2,90–2,93 s** | 10,29–10,97 → **7,25–7,55 s** |

`.go` kommt nicht mehr nach den Shadern der Szene, aber nach dem Vorwärmen von Menü und Bühne (Desktop rund 0,5–1 s,
im Seitenstart, also Laden). Das ist bewusst: Ihr erstes Rastern hielt vorher bei `introCalm` den Startbildschirm
700–830 ms an, jetzt fällt es ins Laden. **«Höchstens 0,8 s» bis zur Enthüllung hält das auf dem Desktop nicht ein**
(Schrift ≤ 0,8 s, danach das Vorwärmen); bitte entscheiden, ob das Vorwärmen vor `.go` so bleibt.

Referenzdurchlauf (`tests/leistung-probe.mjs`), je zwei Läufe; p95 / max / Bilder > 33 ms:

| Abschnitt | Desktop vorher | Desktop nachher | Handy ×4 vorher | Handy ×4 nachher |
|---|---|---|---|---|
| Seitenstart (Laden), max | 777; 856 | 437; 1034 | 3153; 2520 | 1201; 1201 |
| Startbildschirm | 17,1 / 701 / 5; 17,1 / 818 / 5 | 19,4 / 267 / 5; 17,6 / 183 / 7 | 16,9 / 751 / 14; 16,9 / 534 / 8 | 33,4 / 300 / 22; 33,4 / 334 / 15 |
| Menü | 17,1 / 250 / 1; 17,0 / 234 / 1 | 16,9 / 33,5 / 1; 16,9 / 33,3 / 2 | 50,2 / 284 / 38; 50,0 / 250 / 26 | 66,9 / 150 / 49; 50,2 / 167 / 54 |
| Prolog | 17,1 / 67 / 13; 17,1 / 83 / 11 | 16,9 / 100 / 8; 16,9 / 83 / 8 | 33,5 / 183 / 376; 33,5 / 167 / 272 | 50,1 / 234 / 663; 50,1 / 200 / 537 |
| Einstieg | 17,1 / 33 / 4; 17,1 / 50 / 3 | 16,9 / 67 / 3; 16,9 / 67 / 3 | 50,1 / 167 / 43; 50,1 / 184 / 46 | 66,7 / 217 / 87; 50,1 / 250 / 52 |
| Spiel (unberührt, zum Vergleich) | 17,1 / 33 / 1; 17,0 / 17 / 0 | 16,9 / 33 / 1; 16,9 / 33 / 1 | 50,2 / 150 / 305; 50,1 / 150 / 305 | 66,9 / 200 / 322; 66,8 / 167 / 326 |
| Laden | – | – (Himmel nach dem Prolog fertig) | – | – |
| adaptiv / Umbauten | 1,00 / 0 | 1,00 / 0 | 1,00 / 2 | 1,00 / 2 |

Befund:

- **Desktop:** Der Hänger bei `introCalm` (700–830 ms) ist weg (Startbildschirm max 183–267 ms, nach der Enthüllung),
  das Menü hat keinen Hänger mehr (max 33 statt 234–250 ms), der Prolog bleibt gleich (8 statt 11–13 Bilder > 33 ms).
  Neue Spieler: Der Himmel war in beiden Läufen am Ende des Prologs fertig (kein Abschnitt Laden).
- **Handy ×4:** Knopf 3 s früher, Seitenstart halb so lang. Startbildschirm, Menü und Prolog sind aber schlechter: Was
  vorher im langen Seitenstart und in den 6 s Startbildschirm lag (Aufbau des Himmels, Übersetzen, Uploads), fällt jetzt
  in die Zeit nach der Enthüllung und in die Pausen des Prologs. Einzelne Schritte (Konstruktor einer Ebene, Anstossen
  der Shader, `skyWarmDraw` eines Teils) dauern bei 4× gedrosselter CPU 100–300 ms und laufen über den Beginn der
  nächsten Fahrt, wenn der Spieler nach 1,2 s tippt. Nach der Enthüllung pulsiert nur noch eine Opacity im Compositor;
  sichtbar ist das dort vermutlich nicht, gezählt wird es. Achtung Last: Lauf 1 nachher lief mit Median 33 ms (30 Hz),
  auch das unberührte «Spiel» ist nachher schlechter (p95 66,8 statt 50,1); die Handy-Werte sind darum nur bedingt
  vergleichbar. Massgebend ist der Handy-Durchlauf 2 auf dem Poco.

**Fall «Weiter» ohne Prolog** (Stand mitten im Wald, Klick 1,5 s nach dem Knopf, nach 1,5 s im Menü «Weiter»):
Desktop vorher stand der Himmel schon vor dem Klick (der Knopf wartete darauf), Level nach 2,25 s; nachher markiertes
Laden bis der Himmel steht 1,46–1,49 s, Level nach 5,6 s; im Laden max 40–67 ms (1 Bild > 33 ms), Menü max 66 ms
(Klick ins Menü), Spiel danach max 39–67 ms. Handy ×4 nachher: Himmel steht 4,6–5,3 s nach «Weiter», Level nach
8,5–9,2 s; Laden p95 33,5, max 166 ms (zählt als Laden), Menü p95 33,5, max 117–250 ms. Kein Schwarz: Die Vorschau
steht im Menü schon (klein, ruhig).

Offen, zur Entscheidung:

- `.go` nach dem Vorwärmen (Desktop 1,6–2,3 s statt ≤ 0,8 s) gegen Hänger von 650–830 ms im Startbildschirm oder Menü.
- Schwache Geräte: Der Aufbau des Himmels in den Pausen des Prologs ist für 4× gedrosselte CPU zu grob (einzelne
  Schritte 100–300 ms). Möglich: Konstruktoren der Ebenen und `skyWarmDraw` feiner teilen, nur in Pausen ab 2 s laden,
  oder auf schwachen Geräten mehr davon vor `.go` (Laden). Erst nach dem Poco-Durchlauf 2 entscheiden.
- Startbildschirm-CSS (Reveal mit `clip-path` und 60-px-Schein, Fächer mit Blur) ungeändert, siehe oben.

Tests: `node tests/logic.test.mjs` (2033), `node tests/golden.mjs`, `node tests/hall.test.mjs` (6),
`tests/geschichte-probe.mjs --start`, `--grad leicht --welten 2 --finale leicht`, `--handy`, `--quer`,
`tests/leistung-probe.mjs` (headless Desktop und `--handy`, Fenster Desktop und `--handy --drossel 4`),
`tests/start-probe.mjs`, `tests/screenshot.mjs`, `tests/offline.mjs`: siehe Bericht unten.
