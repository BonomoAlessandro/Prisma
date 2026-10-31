# 04: Prolog-SVG flüssig

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Die Bühne von Prolog und Epilog (`createStoryScene`, `index.html` 17190–17608) läuft auf Desktop und
Handy flüssig und kostet so wenig wie möglich. Sie sieht genau so aus wie heute.

Heute läuft `scene.frame()` (17538) ungebremst im Bildschirmtakt, auch mit 120 oder 144 Hz. `draw()` (17553) setzt pro
Bild Attribute: Transforms der 6 Ebenen, Arm und Schal, Strahl samt Verlaufsendpunkten, 16 Glühwürmchen, etwa 15
Rauch-Ellipsen, Polarstern. SVG-Attribut-Transforms laufen nicht über den Compositor, die bildschirmfüllende Szene
(viewBox 1600 × 900, `slice`, etwa 300 Sterne, 180 Punkte Milchstrasse, Verläufe, grosse Verlaufsflächen 7600 × 4400)
wird deshalb vermutlich jedes Bild neu gerastert. Dazu kommen endlose CSS-Opacity-Animationen auf funkelnden Sternen
(`.tw`) und flackernden Fenstern (`.flk`, 367–368).

- [x] Zuerst messen und im Performance-Panel nachsehen, wo die Zeit hingeht: Script, Style, Paint, Raster,
      Composite. Das Ergebnis kommt ins Ticket, bevor umgebaut wird.
- [x] **Bewegung über den Compositor:** Die Parallax-Ebenen und die Kamerafahrt werden so umgebaut, dass sie als
      Ebenen mit CSS-`transform` (oder Web Animations API) verschoben bzw. skaliert werden, ohne neu zu rastern.
      Statische Ebenen werden z. B. einmal gerastert oder als eigene Layer behandelt, wo das ohne sichtbaren
      Schärfeverlust geht. Bei Zoom ist auf Unschärfe durch skalierte Rasterbilder zu achten: Lieber mit Reserve in
      der Auflösung rastern, oder die Ebene zu den Ruhepunkten der Fahrt neu rastern lassen.
- [x] **Kleine bewegte Teile** (Glühwürmchen, Rauch, Funkeln, Flackern, Strahl) kosten nur ihren eigenen kleinen
      Bereich und lösen kein Neuzeichnen der ganzen Szene aus. Opacity und Transform der Elemente auf eigenen Layern,
      nicht über SVG-Attribute in einer grossen Ebene. Die Zahl der gleichzeitig laufenden Animationen prüfen: Wenige
      Gruppen mit versetzten Startzeiten statt Dutzender Einzelanimationen, wenn es gleich aussieht.
- [x] **Takt:** Die JS-Schleife läuft nur, solange sich etwas per JS bewegt, und nicht häufiger als 60 Hz. Ruhige
      Phasen (Warten auf Tippen) sind dann reine CSS- bzw. Compositor-Animation ohne JS pro Bild. Die Bühne ruht ganz,
      wenn sie ausgeblendet ist.
- [x] Gleiches Aussehen: Vergleich nebeneinander bei Bildern jeder Einstellung (Prolog und Epilog, Hoch- und
      Querformat, Handy-Grösse aus `tests/geschichte-probe.mjs --handy`). Die Vorher- und Nachher-Screenshots kommen ins
      Ticket.
- [x] Messen: Abschnitt Prolog vorher und nachher, ungedrosselt und gedrosselt; Ziel ist der Grenzwert aus der Spec.
- [x] Tests grün, Review des Diffs, Commit auf `feature/leistung`.

## Comments

### 31.10.2026 – Profil vor dem Umbau

Gemessen mit `tests/buehne-messung.mjs` (dieses Ticket; das Messwerkzeug aus Ticket 01 war noch nicht da): Chrome mit
GPU und **sichtbarem Fenster** (`tools/chrome.mjs`, neue Option `fenster`), Menü → «Leicht» → ganzer Prolog, je
Einstellung 1,5 s Warten auf Tippen, dann Tippen; Bildabstände über `requestAnimationFrame` (jedes Bild des Browsers,
getrennt nach Kamerafahrt und Warten), dazu ein Trace über CDP (`Tracing.start`, devtools.timeline), Selbstzeit je
Gruppe in **ms je Sekunde Prolog**. Rechner: Chrome nimmt hier die **Intel UHD 630** (ANGLE D3D11), nicht die Quadro
T2000; also ein schwacher Grafikchip. Desktop 1920 × 953 ungedrosselt; Handy 393 × 873, Pixeldichte 2,75, Touch
(`Input.dispatchTouchEvent`), `Emulation.setCPUThrottlingRate` 4. «ohne WebGL»: die 3D-Szene hinter der deckenden
Bühne zeichnet nicht (so wie nach Ticket 02), damit nur die Bühne zählt.

| Lauf | Fahrt p50 / p95 / max (ms) | Warten p50 / p95 / max | Bilder > 33 ms | GPU-Prozess | Hauptthread (Script / Style / Paint+Layerize) |
|---|---|---|---|---|---|
| Desktop ×1 | 89 / 146 / 215 | 18 / 36 / 72 | 883 von 1811 | 959 ms/s | 21 / 12 / 38 |
| Desktop ×1, ohne WebGL | 88 / 142 / 212 | 18 / 18 / 53 | 546 von 2134 | 902 ms/s | 16 / 15 / 51 |
| Handy ×4 | 35 / 53 / 510 | 35 / 52 / 54 | 1218 von 1830 | 594 ms/s | 219 / 131 / 393 |
| Handy ×4, ohne WebGL | 35 / 53 / 71 | 18 / 36 / 54 | 850 von 2196 | 584 ms/s | 158 / 138 / 429 |

Befund:

- **Desktop: der GPU-Prozess ist voll** (900–960 ms GPU-Arbeit je Sekunde, `GPUTask`). Das ist das Rastern des SVG
  (Skia im GPU-Prozess, OOP-Raster; `RasterTask` auf den Raster-Threads sind nur Aufzeichnung, 0,1 ms/s). Während
  einer Kamerafahrt wird **die ganze Szene jedes Bild neu gerastert**: Fahrt p50 89 ms, also gut 11 Bilder/s. Beim
  Warten ändert sich nur Kleines (Glühwürmchen, Rauch, Funkeln), das wird nur in kleinen Rechtecken neu gerastert:
  p50 17,6 ms. Hauptthread ungedrosselt nur 70–90 ms/s, also nicht der Engpass. Composite (Viz DrawAndSwap) 33 ms/s.
- Kosten je Ebene beim Neurastern (Fahrt von 2 s, je Ebene allein, ms je Bild): Himmel 2,7, ferne Berge 7,1,
  Bergwald 6,8, Dorf 4,5, Noas Hügel 9,8, Vordergrund 0,9; alle zusammen 41 ms je Bild. Teuer sind die grossen Pfade
  (Tannenreihen mit Hunderten Tannen, Grate) und die riesigen Verlaufsflächen, nicht die Sterne.
- **Handy ×4: der Hauptthread ist voll**: Layerize 230–260 ms/s, Style (UpdateLayoutTree) 130–140, Script 135–200,
  Paint 90, PrePaint 50, Commit 40 – zusammen 700–800 ms je Sekunde. Pro Bild setzt `draw()` rund 60 Attribute, das
  löst Style, Paint und Layerize der ganzen SVG-Szene aus; der Takt fällt auf 30 Bilder/s, auch beim Warten (p50
  35 ms), weil die Schleife immer läuft. Der GPU-Prozess ist mit 590 ms/s ebenfalls stark belastet.
- Mit WebGL dahinter: zusätzlich ein Ausreisser von 510 ms (Handy) und doppelt so viele Bilder über 33 ms beim
  Warten; das ist Ticket 02.

Folgerung für den Umbau: Die Kamera darf die Ebenen nicht mehr neu rastern lassen (Ebenen des Compositors, per Web
Animations geschoben und skaliert), das Kleine muss auf eigene kleine Ebenen, und beim Warten darf kein JavaScript
pro Bild laufen. Rohdaten: `tests/output/buehne/messung-vorher-*.json` (lokal, gitignored).

### 31.10.2026 – Umbau und Messung danach

Umgebaut nur in der Bühne (`createStoryScene`, CSS der Bühne um 356–375) und an vier Stellen der Geschichte, die sie
benutzen (`offer`: wartet auf `sc.laeuft`; `playScene`: `moveTo(shot, nächste)`; `vorwaermen`, `prewarmScene`):

- **Ebenen im Compositor:** Jede der sechs Ebenen ist ein `div.ebene` (Nullpunkt in der Mitte des Bildschirms) mit
  einem SVG in Massen der Szene. Die Kamera setzt `transform: translateZ(0) scale() translate()` je Ebene; eine
  **Fahrt ist eine Web Animation je Ebene** (30 Keyframes je Sekunde, `storyEase` und der geometrische Zoom stecken in
  den Keyframes). Tippen (4×) und Überspringen (60×) setzen `playbackRate`. Kein `will-change` auf den Ebenen (das
  friert die Rasterskalierung ein, Bild unscharf beim Zoom): Chrome rastert eine Ebene mit laufender
  Transform-Animation einmal in der **grössten Skalierung der Fahrt** und während der Fahrt nicht mehr.
- **Vorbereitete Fahrt:** Sobald eine Fahrt fertig ist, legt `vorbereiten(nächste Einstellung)` die nächste schon an,
  verzögert um 10⁹ ms im Startbild (`fill: both`). So fällt das Rastern in die Wartezeit auf Tippen, nicht in den
  Start der Fahrt; `moveTo` setzt nur `currentTime` auf das Ende der Verzögerung.
- **Striche** (`vector-effect: non-scaling-stroke` wirkt nicht über CSS-Transforms hinweg): Breite
  `calc(w / var(--rs))`, `--rs` = Skalierung der Ebene im Ruhepunkt. Im Ruhepunkt genau wie früher, während einer Fahrt
  wachsen die Grate- und Dachlinien mit (bis 2× bei der stärksten Zoomfahrt) und sind im nächsten Ruhepunkt wieder
  dünn.
- **Kleine Teile auf eigenen Ebenen**, als Web Animations nach der Zeit der Bühne (Sinus über
  `cubic-bezier(0.37, 0, 0.63, 1)`, hin und her): Glühwürmchen (Ort ‹ Schwingen x mit Blinken ‹ Schwingen y ‹
  Grösse; nur im Flug zur Lampe und in den Wald setzt JavaScript den Ort), 15 Rauchwolken (Keyframes über den Weg;
  das Wiegen schwingt jetzt zweimal je Weg statt mit 0,6 rad/s), Schal, Atmen des Polarsterns, Flackern des Strahls.
  Arm und Strahl ändert JavaScript nur während ihrer Tweens. **Funkeln:** 8 Gruppen statt rund 65 einzelner
  CSS-Animationen (4 Takte nach der früheren Dauer des Sterns, matte und helle getrennt, damit sie wie früher bis etwa
  0,12 abdunkeln); 3 flackernde Fenster je ein kleines SVG.
- **Takt:** Die Zeit der Bühne (`time`) läuft in echter Zeit × `speed`, auch ohne Schleife. `frame` läuft nur, solange
  ein Tween läuft oder Glühwürmchen fliegen, höchstens 60-mal pro Sekunde (`faellig`); beim Warten auf Tippen und in
  reinen Kamerafahrten läuft kein JavaScript pro Bild. Ausgeblendet (`hide` → `ruhen`) sind alle Animationen angehalten.
- `.world` hat `pointer-events: none` (kein Hit-Test durch die grossen SVG bei jeder Mausbewegung).
- **Vorwärmen für Ticket 03:** `story.vorwaermen()` (gibt jetzt ein Promise zurück, erfüllt, sobald gezeichnet) →
  `prewarmScene(STORY_PROLOG[0])` → `scene.vorwaermen(shot)`: Einstellung setzen, erste Fahrt vorbereiten, zwei Bilder
  fast durchsichtig zeichnen, danach `scene.ruhen()` (Ebenen weg, nichts läuft). Im Finale wie bisher
  `prewarmScene(STORY_EPILOG[0])`, dort bleibt die vorbereitete Fahrt bis zum Epilog stehen.

**Aussehen:** `node tests/buehne-messung.mjs vergleich vorher nachher`: an allen 40 Ruhepunkten (Prolog 7, Epilog 3;
Desktop 1440 × 900, Handy 390 × 844, quer 844 × 390, Handy 360 × 640), eingefroren auf dieselbe Zeit der Bühne,
weichen höchstens **0,04 %** der Pixel um mehr als 24/255 ab (mittlere Abweichung 0,3–1,0/255): Kanten der Silhouetten
um einen Bruchteil eines Pixels und die funkelnden Sterne (jetzt in Gruppen). Bilder: `tests/output/buehne/vorher/`,
`…/nachher/`, nebeneinander `…/vergleich/` (lokal, gitignored). Die Schärfe beim Zoom lässt sich mit Screenshots über
CDP nicht prüfen (`Page.captureScreenshot` rastert neu); belegt ist sie über den Trace (keine Raster-Arbeit während
der Fahrten, GPU 110 statt 900 ms/s) und das Verhalten von Chrome für Transform-Animationen. Bitte auf dem Poco
nachsehen.

**Messung** (wie oben, gleicher Rechner, Intel UHD 630, sichtbares Fenster):

| Lauf | alle p50 / p95 / max | Fahrt p95 | Warten p95 | Bilder > 33 ms | GPU-Prozess | Hauptthread Style / Paint (mit PrePaint, Layerize) / Script, ms/s |
|---|---|---|---|---|---|---|
| Desktop ×1 vorher | 18,5 / 124 / 215 | 146 | 36 | 883 von 1811 | 959 ms/s | 12 / 38 / 21 |
| Desktop ×1 nachher | 17,6 / 18,5 / 90 | 18,7 | 18,4 | 72 von 2730 | 508 ms/s | 39 / 42 / 38 |
| Desktop ×1 ohne WebGL vorher | 17,8 / 123 / 212 | 142 | 18,3 | 546 von 2134 | 902 ms/s | 15 / 51 / 16 |
| Desktop ×1 ohne WebGL nachher | 17,6 / **18,4** / 106 | 18,4 | 18,5 | 26 von 2666 | **110 ms/s** | 40 / 48 / 21 |
| Epilog Desktop ohne WebGL nachher | 17,6 / 18,5 / 125 | 18,6 | 18,4 | 18 von 1132 | 82 ms/s | 38 / 39 / 19 |
| Handy ×4 vorher | 35 / 53 / 510 | 53 | 52 | 1218 von 1830 | 594 ms/s | 131 / 393 / 219 |
| Handy ×4 nachher | 17,8 / 18,7 / 126 | 35 | 18,3 | 130 von 2770 | 238 ms/s | 153 / 157 / 188 |
| Handy ×4 ohne WebGL vorher | 18 / 36 / 71 | 53 | 36 | 850 von 2196 | 584 ms/s | 138 / 429 / 158 |
| Handy ×4 ohne WebGL nachher | 17,7 / 34,9 / 526 | 35 | **18,2** | 167 von 2572 | **88 ms/s** | 175 / 149 / 128 |

(Ein zweiter Lauf Handy ×4 ohne WebGL: p95 18,3, max 159, 79 Bilder über 33 ms; die Streuung zwischen Läufen ist
gross.) Rohdaten `tests/output/buehne/messung-nachher-*.json`.

Befund nachher:

- Desktop: Der GPU-Prozess hat statt 900 nur noch 80–110 ms/s zu tun, Fahrten laufen mit 60 Bildern/s (p95 18,4).
  Mit WebGL dahinter bleibt er bei 500 ms/s, das ist Ticket 02.
- **Handy ×4:** Warten auf Tippen und reine Kamerafahrten erfüllen den Grenzwert (Bilder ohne JavaScript der Bühne:
  p95 18,2–18,4). **Nicht erfüllt** sind die Abschnitte, in denen JavaScript bewegt (Arm, Strahl wächst, Glühwürmchen
  fliegen, Blinken; etwa ein Drittel der Bilder): p95 35 ms, 17 % der Bilder über 33 ms. Dort kostet der Hauptthread
  pro Bild Style (UpdateLayoutTree, rund 90 laufende Animationen werden bei jedem Hauptbild mitgerechnet), Paint des
  Strahls und Layerize. Ideen, falls das Poco das bestätigt: Strahl als fertig gezeichneter Kegel, der nur skaliert
  und gedreht wird; Flug der Glühwürmchen als Keyframes; weniger Animationen (je Glühwürmchen eine statt drei).
- **Einzelne lange Bilder** (max 90–126 ms, einmal 526 ms gedrosselt) liegen nicht in den JS-Abschnitten: Es ist das
  Rastern einer Fahrt (in der grössten Skalierung, Intel UHD 630 rastert die Tannenreihen langsam), vor allem beim
  ersten Bild der Bühne, weil `vorwaermen` die Ebenen danach wieder freigibt. Für Ticket 03: Die Bühne bis zum Prolog
  gerastert halten (statt `ruhen` nach dem Vorwärmen) oder das erste Rastern in das Warten vor dem Prolog legen.
- Die Messung über `requestAnimationFrame` erzwingt selbst ein Hauptbild pro Takt; ohne sie liefe beim Warten auf dem
  Hauptthread gar nichts.

Tests: `node tests/logic.test.mjs` (2032 bestanden), `node tests/golden.mjs`, `tests/geschichte-probe.mjs --grad
leicht --finale leicht` (Desktop und `--handy`, Prolog und Epilog), `--quer --grad leicht`, `tests/offline.mjs`: alle
grün, Bildzeiten Epilog → Menü längste Lücke 19 ms. Commit auf `leistung/04-prolog-svg` (von `feature/leistung`,
Zusammenführen macht der Koordinator).

### 31.10.2026 – Review Code

Diff 963177d..0fe5e75 gelesen; Kamerafahrt, Tippen/Überspringen, Abbruch, Epilog, Wiederholen, Drehen und Ruhen
durchgegangen. Gut: Zeit der Bühne in echter Zeit × `speed`, dieselbe Basis wie die Web Animations (auch bei
verborgenem Tab laufen beide gleich weiter, `finished` löst nach der Rückkehr aus); `speed` setzt Uhr und
`playbackRate` im selben Moment; `reset` bricht die laufende Fahrt ab (Promise bleibt offen wie früher ein Tween);
`anpassen` rechnet Keyframes von laufender und vorbereiteter Fahrt neu, eine nach dem Drehen falsche vorbereitete Fahrt
fällt über `key` in `moveTo` heraus; ausgeblendet pausiert `ruhen` alle Animationen der Umgebung, die CSS-Animationen
hält `#story.hidden .scene *`. Die Schwingungen (Schal, Glühwürmchen an allen drei Orten, Blinken als sin², Flackern
als Faktor im eigenen Element) sind exakt umgerechnet.

Behoben (Commit `fix(geschichte): …`):

- **60-Hz-Bremse liess Bilder aus:** `faellig` lief bei Bildschirmen knapp über 60 Hz davon (60,05 Hz: alle 22 s,
  60,24 Hz: alle 5 s ein JS-Bild ausgelassen, also 33 ms Lücke im Flug der Glühwürmchen oder am Arm). Jetzt höchstens
  ein Bild voraus (`min(…, now + 1000/60 + 1)`); simuliert für 59,94–165 Hz: bei 60–61 Hz kein Aussetzer mehr, bei
  75–165 Hz weiter 60 Hz.

Offen, klein (kein Umbau nötig, zur Kenntnis):

- **Atmen des Polarsterns beim Blinken:** früher additiv `1 + 0,05 sin + 1,8 boost`, jetzt verschachtelt
  `(1 + 1,8 boost) · (1 ± 0,05)`: auf dem Gipfel eines Blinkens ±0,14 statt ±0,05. Ein Blinken dauert 0,9 s, das Atmen
  3,7 s; kaum sichtbar. Exakt ginge mit `atem.setze(0.05 / (1 + 1.8 * starBoost), …)` bei jeder Änderung von `boost`.
- **Rauch:** Das Wiegen hat jetzt ω = 0,628 statt 0,6 rad/s (zweimal je 20-s-Weg), bei 3 px Ausschlag unsichtbar.
  Exakt bräuchte je Wolke eine eigene Schwingung (15 Animationen mehr); lohnt nicht.
- **Strichbreite `calc(w / var(--rs))`:** Chrome und Firefox rechnen `calc()` mit Division durch eine Zahl in
  `stroke-width` (CSS-Eigenschaft im `style`, nicht als Attribut) und erben `--rs` von der `.ebene`. Ob ältere
  Safari `calc()` in SVG-Eigenschaften können, ist ungeprüft; geht es nicht, ist der Wert «ungültig zur
  Berechnungszeit» und `stroke-width` fällt auf den geerbten Anfangswert 1 zurück (nicht auf ein Attribut), also Grate
  etwa so breit wie heute, mit dem Zoom etwas dicker. Kein Bruch, kein Fallback nötig (iOS wird nicht geprüft).
- `ruhen` hält die zuletzt gelaufene Fahrt (`laufend`, fertig, `fill: both`) stehen: kostet nichts. Wird die Bühne
  mitten in einer Fahrt ausgeblendet, läuft diese zu Ende und legt mit `vorbereiten(next)` danach noch eine neue Fahrt
  an (wartend, im ausgeblendeten Element). Kommt heute nicht vor (Überspringen wartet über `sc.laeuft`); früher hing in
  dem Fall der Tween.
- `story.vorwaermen()` erfüllt sein Promise erst nach drei `requestAnimationFrame`; bei verborgenem Tab also erst nach
  der Rückkehr. Für Ticket 03, falls es darauf wartet: mit Zeitgrenze verbinden.
- Strahl (`.beam`) und Polarstern ändern Opacity bzw. Transform per Stil ohne eigene Ebene (`bewegt`); die Kinder sind
  durch ihre Animationen ohnehin eigene Ebenen, die Messung zeigt kein Neurastern der grossen Ebene. Falls das Poco beim
  Blinken im Epilog hakt: `will-change` dort prüfen.
- Safari rastert animierte Transforms vermutlich nicht in der grössten Skalierung der Fahrt (Unschärfe beim Zoom
  möglich); ungeprüft, iOS ist nicht Abnahme.

Mittel/gross: keine.

Zusammenführen `tools/chrome.mjs` mit Ticket 01 (gleiche Option `fenster`): beide Fassungen vereinen. Aus 01:
`maximiert`, `--disable-background-timer-throttling`, `--force_high_performance_gpu` (Quadro statt Intel UHD 630!),
`--window-position=0,0`, `gpu || fenster`, das Maximieren über `Browser.setWindowBounds`. Aus 04:
`--disable-features=CalculateNativeWinOcclusion` dazunehmen, `on(method, fn)` mit `hoerer` im Nachrichten-Handler und
in der Rückgabe. Doku-Kommentar beider zusammenlegen. Folge: Die Werte dieses Tickets sind auf der Intel UHD 630
gemessen und nicht direkt mit Läufen des Messwerkzeugs aus 01 (Quadro) vergleichbar; `tests/buehne-messung.mjs` kann
später auf das Werkzeug aus 01 umgestellt oder entfernt werden.

Stil: Deutsch, «ss», Kommentare knapp und erklärend; README-Einträge (Messung, `chrome.mjs` mit `fenster`/`on`)
passen. Tests nach dem Fix: `node tests/logic.test.mjs` (2032 bestanden), `node tests/golden.mjs`, `tests/geschichte-probe.mjs --grad leicht
--finale leicht` mit GPU: bestanden, Konsole ohne Fehler, Epilog → Menü längste Lücke 19 ms.

### 31.10.2026 – Nachbesserung nach Review

**1. Hänger am Ende jeder Fahrt (behoben).** Ursache: Im Bild, in dem eine Fahrt endete, kam dreierlei zusammen.
Die Animation der Ebenen war fertig, also rasterte Chrome jede Ebene in ihrer neuen (Ruhe-)Skalierung nach. `stelle()`
setzte `--rs` neu, also mussten alle sechs Ebenen neu zeichnen. Und `vorbereiten(next)` legte die nächste Fahrt an,
also noch einmal Rastern in deren grösster Skalierung. Alle sechs Ebenen auf einmal, genau beim Einblenden des
Untertitels. Belegt dadurch, dass genau diese drei Dinge aus dem Endbild herausgenommen den Hänger beseitigen (Messung
unten, «alt» gegen «neu»).
Änderung (`createStoryScene`):
- Eine Fahrt hält ihr Zielbild danach noch 10 min (`HALTEN`, letzter Keyframe), die Animation läuft also weiter und
  Chrome rastert am Ende nicht nach. Wann die Fahrt fertig ist, sagt eine Animation ohne Ziel (`uhr`, mit Tempo).
- Nach dem Halt `HALT_MS` = 400 ms warten, dann **je Ebene ein Schritt alle 90 ms** (`gestaffelt`, Reihenfolge so,
  dass die teuren Ebenen nicht nebeneinander liegen): `--rs` dieser Ebene setzen und ihre vorbereitete Fahrt anlegen
  (`ebeneAnlegen`; die alte Animation der Ebene gibt sie dabei ab). So rastert jedes Bild höchstens eine Ebene neu.
  Tippt man vorher, legt `moveTo` die fehlenden Ebenen sofort an. Ohne nächste Einstellung (letzte) nur `--rs`,
  ebenso gestaffelt.

Gemessen mit dem Skript des Reviewers (`review04/mess.mjs`, Kopie mit `--seite`), sichtbares Fenster, jetzt mit
`--force_high_performance_gpu` (Quadro T2000) aus Ticket 01; je zwei Läufe, Median; «Ende» = längste Lücke in den
400 ms nach dem Ende einer Fahrt; vorher = 963177d, alt = 60afae5, neu = dieser Stand.

| Lauf | Ende Median / Max vorher | alt | **neu** | Bilder > 33 ms vorher / alt / neu |
|---|---|---|---|---|
| Prolog Desktop 1920 × 953 | 50 / 50 | 117 / 200 | **17 / 17** | 750 / 31 / 9 |
| Epilog Desktop | 34 / 100 | 67 / 184 | **17 / 17** | 340 / 12 / 8 |
| Prolog Handy ×4 | 50 / 51 | 150 / 167 | **34 / 50** | 929 / 551 / 391 |
| Epilog Handy ×4 | 50 / 67 | 117 / 151 | **50 / 50** | 390 / 304 / 320 |

Desktop: Fahrtenden ohne Bild über 33 ms (alle 17 ms). Gedrosselt nicht schlechter als der Ausgangsstand. Was bleibt,
ist das erste Bild der Bühne (100–270 ms, Rastern beim Einblenden, siehe Ticket 03) und gedrosselt einmal ein Start
einer Epilog-Fahrt mit 117–133 ms (einer von zwei Läufen).

**2. Linien werden beim Halt dünner (nicht geändert).** Mit der Staffelung werden sie jetzt 0,4–0,9 s nach dem Halt
Ebene für Ebene dünn statt alle im Endbild. Das geometrische Mittel beim Start der Fahrt ginge nicht ohne Kosten: `--rs`
zu ändern heisst Neurastern der Ebene, beim Start der Fahrt also genau der Hänger, den das Vorbereiten vermeidet; im
Ruhepunkt gesetzt, stimmen die Linien dort nicht mehr. Offen für die Messrunde (Ticket 07), falls es auf dem Poco
auffällt.

**3. JS-Abschnitte gedrosselt (nicht geändert)**, bleibt für die Messrunde 07 (Ideen oben).

Zusammengeführt: Ticket 01 (`9d02f3f`), Konflikt in `tools/chrome.mjs` vereint (`maximiert`, `Browser.setWindowBounds`,
`--disable-background-timer-throttling`, `--force_high_performance_gpu`, `--window-position=0,0`, `gpu || fenster`
aus 01; `--disable-features=CalculateNativeWinOcclusion` und `on(method, fn)` aus 04).

Tests: `node tests/logic.test.mjs` (2033 bestanden), `node tests/golden.mjs`, `tests/geschichte-probe.mjs --grad leicht
--finale leicht` (Desktop und `--handy`), `--quer --grad leicht`, `tests/offline.mjs`: alle grün, Konsole ohne Fehler.

### 31.10.2026 – Review der Nachbesserung (d246d73)

**Urteil: abnahmefähig** (mit dem kleinen Fix unten).

- Code: Tippen während der Staffelung (fehlende Ebenen legt `moveTo` an, alte Fahrt erst danach abgebrochen), Tempo
  (`uhr` mit), Überspringen (Staffelung läuft fertig, `ruhen` verwirft), `reset`/`verwerfen`, Grössenänderung (Lücken in
  `anims`) und Epilog geprüft: korrekt, keine liegengebliebenen Zeitgeber.
- **Fund (klein, behoben):** Nach dem Ausblenden liefen die sechs Ebenen-Animationen der letzten Fahrt noch bis zu
  10 min (`HALTEN`) weiter, `#story.hidden` ist nur `opacity: 0` (gemessen: Epilog → Menü 6 laufende `.ebene`-
  Animationen, vorher 0). Widerspricht «ruht, kostet nichts» (Ticket 06). Fix: `ruhen` beendet sie mit `finish()`
  (gleiches Zielbild, `fill: both`, wie vor der Nachbesserung). Danach 0 laufende.
- Rest, unverändert: Wer innerhalb von 0,85 s nach dem Halt tippt, fährt auf den noch nicht gestaffelten Ebenen mit dem
  `--rs` des vorherigen Ruhepunkts (Striche minim anders breit); nicht sichtbar, kein Handlungsbedarf.
- Optik (echtes Chrome-Fenster 1920 × 953, Quadro, Prolog und Epilog, Bilder am Fahrtende, +0,55 s, +1 s, +2 s; vorher
  963177d gegen d246d73): kein Sprung der Linienstärke, kein Flackern, keine falsche Ebene während der Staffelung.
  Die Änderungen nach dem Halt sind bei 3-facher Vergrösserung nicht zu sehen (Pixeldifferenz im Mittel < 1,2 Stufen,
  sonst nur Rauch, Glühwürmchen, Sternschein wie vorher).
- Kontrollmessung Desktop (mess.mjs, 2 Läufe Prolog, 1 Epilog): Fahrtenden 17 ms, je einmal 33 ms (Prolog Lauf 1,
  Epilog); Bilder > 33 ms 10 / 12 / 11 (Entwickler 9 / 8): bestätigt. Auffällig für 07: Start der 3. Prolog-Fahrt
  in beiden Läufen 133 ms (ein Bild), Start 1. Fahrt einmal 117 ms; nicht Teil dieser Nachbesserung.
- Tests: `logic.test.mjs` (2033), `golden.mjs` grün.
