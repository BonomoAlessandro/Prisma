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
