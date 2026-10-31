# 01: Messwerkzeug, Referenzdurchlauf, Ergebniskarte mit Version

**Spec:** ../spec.md

**Blocked by:** –

**Status:** ready-for-agent

**What to build:** Ein Messwerkzeug, das misst, was man **sieht**, nicht nur die WebGL-Bilder. Ausserdem einen festen
Referenzdurchlauf, an dessen Ende eine Ergebniskarte steht, die sich ohne Kabel auf dem Handy ablesen und kopieren
lässt. Alle weiteren Tickets messen damit vorher und nachher.

Arbeit auf dem Branch `feature/leistung`: von `main` abzweigen, falls es ihn noch nicht gibt, sonst den gepushten Stand
holen.

Heute misst der HUD (`perfHud`, `index.html` um 19299, `?perf` oder Taste **F**) nur die Abstände der *gerenderten*
WebGL-Bilder in `frame()`. Ist die Bildrate gedrosselt (30 fps hinter dem Prolog), zeigt er 30 FPS, egal wie flüssig
CSS- und SVG-Animationen laufen. Ruckler im Startbildschirm und im Prolog sieht er nicht.

- [x] **Sichtbare Bildabstände:** eine eigene, leichte rAF-Messschleife, die nur bei `?perf` läuft und unabhängig von
      `frameRate` und `frame()` ist. Ticket 02 lässt `frame()` ruhen, die Messung muss trotzdem weiterlaufen. Sie misst
      den Abstand aufeinanderfolgender Display-Frames, Grenzwerte wie in der Spec (p95 ≤ 18,3 ms inklusive Toleranz,
      kein Bild über 33 ms). Wo verfügbar, kommen `PerformanceObserver` für `long-animation-frame` und `longtask` dazu,
      um Hänger des Hauptthreads mit Ursache (Script-Quelle) zu sehen. Die Messung selbst darf das Ergebnis nicht
      merklich verfälschen: keine Allokationen pro Bild, Ringpuffer.
- [x] **Zeichenzeit, eindeutig definiert:** Wo `EXT_disjoint_timer_query_webgl2` verfügbar ist, gilt die GPU-Zeit pro
      gerendertem Bild. Auf vielen Android-Geräten fehlt die Erweiterung. Dann gilt als Ersatzmass die Zeit von Beginn
      `frame()` bis nach einem `gl.finish()` (bzw. einem 1-Pixel-`readPixels`, falls `finish` nicht blockiert). Das
      läuft **nur während des Referenzdurchlaufs**, weil es die Pipeline anhält. Die Karte zeigt, welches Mass
      verwendet wurde. Die 8-ms-Marge der Spec bezieht sich auf diese Zeichenzeit. Zusätzlich wird die CPU-Zeit von
      `frame()` ausgewiesen.
- [x] **Abschnitte:** Die Messung wird automatisch nach Abschnitten getrennt: Startbildschirm, Prolog, Spiel (erstes
      Level), Menü, Weltwechsel bzw. Reise. Laden hinter einer Überblendung wird als solches markiert und getrennt
      ausgewiesen. Es zählt nicht gegen die Grenzwerte, aber die Werte werden trotzdem gezeigt.
- [x] **Referenzdurchlauf:** Im HUD gibt es einen Knopf «Referenzdurchlauf». Er setzt einen frischen Spielstand
      **ohne den echten zu löschen** (eigener Speicherschlüssel oder Sicherung und Rückspielen) und lädt die Seite neu.
      Danach klickt man normal durch: Startbildschirm → Prolog → erstes Level lösen → Menü. Weil man mit frischem Stand
      nicht schnell in eine andere Welt kommt, bietet der Durchlauf danach einen Knopf «Weiter zur Reise». Er springt
      über die vorhandene Debug- bzw. Testschnittstelle (`__prismaDebug`, `zeige()`, Übersicht) an das Ende der
      ersten Welt, sodass die Reise in die zweite Welt mit frisch geladener Skybox gemessen wird. Am Ende wird der echte
      Spielstand wiederhergestellt.
- [x] **Ergebniskarte** am Ende, gut lesbar auf dem Handy. Sie zeigt pro Abschnitt p95, den schlimmsten Frame, die
      Zahl der Frames über 33 ms und die p95 der Zeichenzeit samt Mass. Dazu Gerät bzw. User-Agent, GPU, Bildschirm,
      Pixelverhältnis, Bildschirmtakt und die **Version** der laufenden Fassung. Ein Knopf «Kopieren» legt alles als
      Text in die Zwischenablage. Fallback ohne Clipboard-API: markierbares Textfeld.
- [x] **Version sichtbar:** Es gibt keinen Build-Schritt. `sw.js` (Cache `prisma-v1`) lädt online zuerst vom Netz und
      antwortet nur aus dem Speicher, wenn das Netz länger als `NETWORK_WAIT` = 3 s braucht. Eine alte Fassung droht
      also vor allem, wenn Render kalt startet. Einführen: eine Versionskennung, die bei jedem Handy-Commit nachgeführt
      wird (z. B. `APP_VERSION` mit Datum und Ticketstand) und in HUD und Ergebniskarte erscheint. Ein Neuladen holt
      sicher die neue Fassung. Den Ablauf im README im Wurzelordner festhalten («Version prüfen, sonst neu laden»).
- [x] **Testschnittstelle:** Die Ergebnisse sind auch per `window.__prisma` abrufbar. So können Headless-Tests
      (`tools/chrome.mjs`, `tests/*.mjs`) den Durchlauf als Regressionsprüfung fahren (Klicks per Script, `--handy`).
      Ihre Zeiten sind keine echten Messwerte, ohne GPU rendern sie in Software. Im README im Wurzelordner ist
      beschrieben, wie man den Durchlauf startet.
- [ ] **Ausgangswerte** im echten Chrome mit Fenster und GPU auf dem Arbeitsrechner erheben, einmal ungedrosselt und
      einmal mit DevTools-Handy-Emulation und 4× CPU-Drosselung, und unter `## Comments` eintragen. Fährt der Agent den
      Durchlauf selbst, dann über `tools/chrome.mjs` mit `GPU=1` und sichtbarem Fenster, falls das geht. Sonst ist das
      ein Schritt für den Nutzer am Arbeitsrechner, und das Ticket sagt das.
- [ ] Tests grün, Review des Diffs. Dann committen und auf `feature/leistung` pushen, Ticket mit **«bereit für
      Handy-Durchlauf 1 (Ausgangswert), bitte auf Render deployen»** abschliessen. Der Nutzer trägt die Ergebniskarte
      vom Poco nach.

## Comments

**31.10.2026, Umsetzung (Branch `leistung/01-messwerkzeug`, von 963177d):**

- **Messwerkzeug** `leistung` in `index.html` (Abschnitt «Messwerkzeug» direkt vor der Leistungsanzeige `perfHud`):
  eigene rAF-Schleife (`starte`, `tick`), unabhängig von `frameRate` und `frame()`; sie läuft mit `?perf`, nach Taste F
  und im Referenzdurchlauf. Je Abschnitt Histogramme in Fächern zu 0,1 ms bis 200 ms (genaue p95, keine Allokationen pro
  Bild), Ringpuffer für die Anzeige. Ein Abstand zählt zum Abschnitt an seinem **Anfang** (der Hänger nach dem Klick
  auf «Klicken zum Starten» gehört so zum Startbildschirm, nicht zum Menü). `long-animation-frame` und `longtask` per
  `PerformanceObserver`, die längsten mit Ursache (längstes Script: Aufrufer, Funktion, Datei:Zeichen; sonst «ohne
  Script» mit Renderzeit).
- **Zeichenzeit:** GPU-Zeit je gerendertem Bild über `EXT_disjoint_timer_query_webgl2` (8 Abfragen im Kreis, disjunkte
  verworfen). Ohne Erweiterung im Referenzdurchlauf die Zeit von Beginn `frame()` bis nach einem 1-Pixel-`readPixels`
  (gewählt statt `gl.finish`, weil `readPixels` sicher auf das fertige Bild wartet). Die Karte nennt das Mass. Dazu die
  CPU-Zeit von `frame()` und die gezeichneten WebGL-Bilder je Sekunde («gez/s», für 02 und 06). Haken: Hält
  `readPixels` die Pipeline an, kann `adaptiveResolution` das als langsames Bild werten; die Karte zeigt «adaptiv» und
  «Umbauten».
- **Abschnitte** (`abschnitt()`, liest nur Zustände): Seitenstart (bis die Enthüllung beginnt; zählt wie Laden nicht),
  Startbildschirm, Menü, Übersicht, Prolog (mit Angebot), Epilog, sonst der zuletzt markierte oder Spiel. Die
  Geschichte markiert über `leistung.waehrend(id, promise)`: Einstieg (`enter`), Reise (`chapterEnd`), Weltwechsel
  (`replayWorld`), Finale. **Schnittstelle für 02/03:** `const ende = leistung.markiere('laden')` … `ende()` bzw.
  `leistung.waehrend('laden', promise)` markiert Laden hinter einer Überblendung; es geht allen Abschnitten vor, steht
  getrennt auf der Karte und zählt nicht gegen die Grenzwerte.
- **Referenzdurchlauf:** Knöpfe in der Anzeige (`#perf .perf-knoepfe`). «Referenzdurchlauf» sichert alle `prisma.*`
  nach `prisma.leistung.sicherung` (eine vorhandene Sicherung aus einem abgebrochenen Lauf bleibt, sie ist der echte
  Stand), löscht sie, setzt `prisma.leistung.lauf` und lädt mit `?perf`, ohne `?nointro`/`?t=`/`?sky=`, neu. Nach dem
  ersten gelösten Level und «Menü»: «Weiter zur Reise» (Stand auf das 10. Level der ersten Welt, davor alles gelöst,
  Prolog/Angebot/Einstieg gesehen; `story.choose`, `__prismaDebug.loese`, nach 2 s «Weiter»; danach 6 s «Spiel n.
  Reise», weil scharfes Bild und Streifen erst 1,2 s nach der Landung laden) oder «Auswerten». «Abbrechen» jederzeit.
  Am Ende: Ergebnis nach `prisma.leistung.ergebnis`, echter Stand zurück (`progress.write` danach still), Neuladen,
  Karte.
- **Ergebniskarte** `#leistung-karte`: Version, Zeit, User-Agent, Modell (`userAgentData`, auf Android das Gerät), GPU,
  Bildschirm, Fenster, Pixelverhältnis, Renderauflösung, Takt (Median der Abstände), Mass der Zeichenzeit; je Abschnitt
  Bilder, p95, max, Bilder über 33 ms, p95 Zeichenzeit, p95 CPU, gez/s; Urteil, längste Bilder, Hänger mit Ursache.
  «Kopieren» (Clipboard-API, sonst markiertes Textfeld), «Schliessen» vergisst sie.
- **Version:** `APP_VERSION = '2026-10-31 leistung-01'` in `index.html` (KONFIGURATION) und `sw.js`, gleich (Test in
  `tests/logic.test.mjs`). Anzeige und Karte zeigen sie. README: «Version prüfen, sonst neu laden».
- **Testschnittstelle:** `window.__prisma.leistung` (`daten()`, `ergebnis()`, `schritt()`). Probe
  `tests/leistung-probe.mjs [--handy] [--drossel 4] [--fenster]` fährt den Durchlauf über die Knöpfe (README).
- **`tools/chrome.mjs`:** Optionen `fenster` (sichtbares Fenster, ohne Drosselung im Hintergrund, schnellere
  Grafikkarte über `--force_high_performance_gpu`) und `maximiert` (`Browser.setWindowBounds`).

**Ausgangswerte (vor allen Umbauten), vom Agenten im echten Chrome-Fenster per Script gefahren** (`--fenster`).
Achtung: **nicht der Arbeitsrechner** der Spec (RTX 3070, 1920 × 953), sondern der Rechner der Agenten: Laptop mit
NVIDIA Quadro T2000 (Chrome über `--force_high_performance_gpu`) und Intel UHD 630, Bildschirm 4K mit 250 %
(1536 × 864 CSS-Pixel), Chrome 156, Prozesse mit tiefer Priorität (`leise.sh`). Der gemessene Takt lag bei 56 Hz
(Median 17,8 ms), nicht bei 60. **Die Werte vom Arbeitsrechner trägt der Nutzer nach** (Seite mit `?perf`,
«Referenzdurchlauf», oder `node tests/leistung-probe.mjs --fenster` bzw. `--fenster --handy --drossel 4`).

Ungedrosselt, Fenster maximiert (1536 × 729, Rendern 1536 × 729), Zeichenzeit = GPU-Zeit:

| Abschnitt | Bilder | p95 ms | max ms | > 33 ms | Zeichnen p95 ms | CPU p95 ms | gez/s | Hänger (max ms) |
|---|---|---|---|---|---|---|---|---|
| Seitenstart (Laden) | 11 | – | 668,0 | 3 | 16,9 | 15,8 | 1 | 1 (683) |
| Startbildschirm | 381 | 18,3 | 620,6 | 6 | 9,8 | 2,1 | 49 | 4 (638) |
| Menü | 164 | 18,7 | 176,0 | 1 | 10,5 | 2,7 | 39 | 1 (180) |
| Prolog | 1396 | **53,7** | 474,5 | **568** | 15,7 | 1,7 | 17 | 85 (486) |
| Einstieg | 348 | 18,6 | 37,9 | 2 | 8,2 | 2,8 | 56 | 0 |
| Spiel (erstes Level) | 879 | 18,5 | 48,0 | 2 | 12,2 | 3,1 | 53 | 0 |
| Reise | 758 | 18,6 | 34,7 | 1 | 9,0 | 3,7 | 56 | 1 (54) |
| Spiel nach der Reise | 339 | 18,6 | 18,8 | 0 | 12,0 | 6,0 | 35 | 0 |
| Gesamt (ohne Laden) | 4265 | 52,7 | 620,6 | 580 | 12,2 | | | |

Handy-Emulation (393 × 873, Pixeldichte 2,75, Touch, Android-Kennung; Rendern 786 × 1746) und CPU 4× gedrosselt:

| Abschnitt | Bilder | p95 ms | max ms | > 33 ms | Zeichnen p95 ms | CPU p95 ms | gez/s | Hänger (max ms) |
|---|---|---|---|---|---|---|---|---|
| Seitenstart (Laden) | 3 | – | 2186 | 3 | 32,4 | 97,7 | 0 | 3 (2312) |
| Startbildschirm | 370 | 18,6 | 499,4 | 15 | 16,7 | 13,3 | 46 | 6 (525) |
| Menü | 145 | 36,1 | 244,4 | 22 | 18,2 | 36,4 | 30 | 4 (249) |
| Prolog | 1473 | **52,7** | 439,5 | **721** | 18,8 | 12,2 | 18 | 1 (444) |
| Einstieg | 307 | 52,3 | 159,2 | 34 | 14,9 | 37,9 | 46 | 8 (178) |
| Spiel (erstes Level) | 521 | 52,9 | 457,7 | 273 | 32,8 | 44,2 | 30 | 23 (445) |
| Reise | 814 | 36,1 | 323,9 | 170 | 23,5 | 27,9 | 43 | 18 (327) |
| Spiel nach der Reise | 175 | 53,2 | 402,9 | 74 | 34,9 | 46,5 | 18 | 20 (405) |
| Gesamt (ohne Laden) | 3805 | 52,6 | 499,4 | 1309 | 26,0 | | | |

Karten und Daten: `tests/output/leistung/fenster-*.txt` bzw. `.json` (nicht versioniert). Die p95 des Seitenstarts
fehlt, weil alle Abstände dort über 200 ms lagen (seither gibt `quantil` dafür max an).

Notizen zu den Werten:

- **Prolog** ist der klare Ausreisser, auch ungedrosselt: p95 53,7 ms, 40 % der Abstände über 33 ms, 85 Hänger. Sie
  sind fast alle «ohne Script, Rendern 80–100 ms» (Stil, Layout, Paint der SVG-Bühne), dazu 430–490 ms ohne Script und
  fast ohne Rendern beim Antippen eines Bilds (Ticket 04).
- **Startbildschirm:** ein Hänger von 400–640 ms bei etwa 5 s Seitenzeit, ohne Script, also im Grafikprozess bzw. beim
  Übersetzen und Hochladen um `introCalm` (Tickets 02/03). Mit der Intel-Grafik allein (erster Versuch im Fenster,
  1038 × 703) waren es 389 ms. Der Hänger beim ersten Klick (Hall, Ticket 05) fällt in dieselbe Zeile.
- **Zeichenzeit:** ungedrosselt p95 8–16 ms auf der T2000, im Prolog 15,7 ms, obwohl man die Szene dort nicht sieht
  (Ticket 02). Für die 8-ms-Marge der Spec zählen nur die Werte vom Poco.
- **Messartefakt möglich:** Mit der NVIDIA-Karte (das Bild geht über die Intel-Grafik auf den Bildschirm) traten Hänger
  von 380–490 ms «ohne Script» auf, mit der Intel-Grafik allein höchstens 107 ms ausserhalb von Seitenstart und
  Startbildschirm. Diese Laptop-Werte sind darum nur ein Anhalt; massgebend sind Arbeitsrechner und Poco.
- **Grenzwert «über 33 ms»** ist wörtlich umgesetzt (> 33,0 ms). Ein einzelnes ausgelassenes Bild bei 60 Hz ergibt
  33,3 ms und zählt damit schon. Ist «höchstens ein Bild ausgelassen» gemeint, wäre die Grenze 36,7 ms (33 ms + 10 %);
  bitte entscheiden (eine Zeile, `MESS_GRENZE.bild`).
- Headless (`GPU=1`, Intel, rAF virtuell): Durchlauf grün; Werte nur zur Regression.

**31.10.2026, Review Code** (Diff 963177d..c7c0e39): Aufbau gut, Schnittstelle `markiere`/`waehrend` taugt für 02/03,
die Messschleife hängt nicht an `frame()`. Ohne Messung kostet `frame()` nur zwei Abfragen von `aktiv`. Behoben
(eigener Commit):

- Taste F aus beendet jetzt auch die Messschleife (ausser im Referenzdurchlauf; `stoppe`, Schleifennummer gegen
  doppelte Schleifen bei schnellem Umschalten); Einrichten (Abfragen, Observer) nur beim ersten Start.
- GPU-Zeit: Das Lesen von `GPU_DISJOINT_EXT` setzt die Meldung zurück. Bisher galten danach Abfragen, die beim Lesen
  noch unterwegs waren, als gültig; jetzt werden bei «disjunkt» alle Abfragen unterwegs verworfen.
- Sicherung: Merker `prisma.leistung.lauf` wird vor dem Löschen geschrieben (schlug er bei vollem Speicher fehl, lag
  der Stand nur noch in einer Sicherung, die niemand zurückspielt und die ein späterer Durchlauf für den echten Stand
  gehalten hätte). Eine unlesbare Sicherung wird nicht mehr gelöscht.

Offen, zur Entscheidung:

- **Karte auf 393 px:** Die Tabellenzeilen sind 60 Zeichen breit, bei 12 px Monospace etwa 430 px; auf dem Poco
  muss man waagrecht scrollen. Vorschlag: Spalten schmaler (Name 13, Zahlen 6) und auf schmalen Bildschirmen 11 px,
  oder je Abschnitt zwei Zeilen. Der Reviewer im Browser prüft das.
- **Neuladen mitten im Durchlauf** (oder Tab zu, später wieder auf): Der Stand ist sicher (Sicherung bleibt, die
  Anzeige bietet «Abbrechen»), aber der Durchlauf läuft mit dem schon gespielten Stand weiter und misst nur ab dem
  Neuladen. Vorschlag: beim Laden mit Merker die Anzeige «Durchlauf unterbrochen: neu beginnen oder abbrechen».
- Grenze «über 33 ms» (33,0 vs. 36,7 ms) wie in der Umsetzung notiert: Entscheid des Nutzers.
