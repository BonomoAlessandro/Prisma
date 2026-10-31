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

- [ ] Zuerst messen und im Performance-Panel nachsehen, wo die Zeit hingeht: Script, Style, Paint, Raster,
      Composite. Das Ergebnis kommt ins Ticket, bevor umgebaut wird.
- [ ] **Bewegung über den Compositor:** Die Parallax-Ebenen und die Kamerafahrt werden so umgebaut, dass sie als
      Ebenen mit CSS-`transform` (oder Web Animations API) verschoben bzw. skaliert werden, ohne neu zu rastern.
      Statische Ebenen werden z. B. einmal gerastert oder als eigene Layer behandelt, wo das ohne sichtbaren
      Schärfeverlust geht. Bei Zoom ist auf Unschärfe durch skalierte Rasterbilder zu achten: Lieber mit Reserve in
      der Auflösung rastern, oder die Ebene zu den Ruhepunkten der Fahrt neu rastern lassen.
- [ ] **Kleine bewegte Teile** (Glühwürmchen, Rauch, Funkeln, Flackern, Strahl) kosten nur ihren eigenen kleinen
      Bereich und lösen kein Neuzeichnen der ganzen Szene aus. Opacity und Transform der Elemente auf eigenen Layern,
      nicht über SVG-Attribute in einer grossen Ebene. Die Zahl der gleichzeitig laufenden Animationen prüfen: Wenige
      Gruppen mit versetzten Startzeiten statt Dutzender Einzelanimationen, wenn es gleich aussieht.
- [ ] **Takt:** Die JS-Schleife läuft nur, solange sich etwas per JS bewegt, und nicht häufiger als 60 Hz. Ruhige
      Phasen (Warten auf Tippen) sind dann reine CSS- bzw. Compositor-Animation ohne JS pro Bild. Die Bühne ruht ganz,
      wenn sie ausgeblendet ist.
- [ ] Gleiches Aussehen: Vergleich nebeneinander bei Bildern jeder Einstellung (Prolog und Epilog, Hoch- und
      Querformat, Handy-Grösse aus `tests/geschichte-probe.mjs --handy`). Die Vorher- und Nachher-Screenshots kommen ins
      Ticket.
- [ ] Messen: Abschnitt Prolog vorher und nachher, ungedrosselt und gedrosselt; Ziel ist der Grenzwert aus der Spec.
- [ ] Tests grün, Review des Diffs, Commit auf `feature/leistung`.

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
