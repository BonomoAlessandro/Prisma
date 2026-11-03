# Die Bühne der Geschichte wird in WebGL gezeichnet

Entschieden vom Nutzer am 03.11.2026 im Vorhaben Leistung (`.scratch/leistung/`, Ticket 19).

## Kontext

Die Bühne der Noa-Szenen besteht aus SVG-Ebenen im DOM. Die Kamerafahrten und die Flüge der Glühwürmchen laufen als
Web Animations im Compositor des Browsers. Wann der Browser Kacheln rastert, Ebenen zusammenlegt oder ein Bild
auslässt, entscheidet er selbst. Die Tickets 15, 16 und 18 sowie die Stände `leistung-10` bis `leistung-12` haben
viele dieser Stellen einzeln umgangen:
- Ladesperre
- Seitenmassstab 2
- vorbereitete Untertitel und vorbereiteter Strahl
- glatte Flugbahnen

Der Nutzer sieht trotzdem weiter Ruckler und ungleichmässige Fahrten, auf dem Poco und auch am Computer mit 60 Hz.
Jede Korrektur behebt eine Stelle, und die nächste taucht auf.

## Entscheid

- **Darstellung:** Die Bühne wird in WebGL (three.js) gezeichnet. Umgesetzt mit einer eigenen Leinwand und einem
  eigenen WebGL-Kontext in `#story .scene` statt dem Renderer des Spiels (siehe Nachtrag).
- **Ebenen:** Jede SVG-Ebene wird beim Laden einmal zu einer Textur gerastert und steht als flache Tafel
  (Billboard) in der Tiefe. Die Parallaxe kommt von der Kamera.
- **Detailstufen:** Die Auflösung der Textur richtet sich nach der grössten Skalierung, in der die Ebene zu sehen
  ist. Für starkes Hineinzoomen gibt es eine schärfere Stufe. Auf dem Handy wird der Grafikspeicher begrenzt.
- **Glühwürmchen:** Sie werden auf der Grafikkarte gezeichnet. Ihr Ort wird je Bild genau aus der Zeit berechnet.
- **Takt:** Jedes Bild zeichnet die eigene Schleife, in der Geschichte stetig 60 Bilder/s. ADR 0006 bleibt für das
  Spiel. Die Reisen zwischen den Welten gehören zur Geschichte und laufen damit ebenfalls mit 60.
- **Texte:** Texte, Knöpfe und Hinweise bleiben DOM über dem Bild.
- **Reihenfolge:** Der Umbau läuft in Stufen. Zuerst kommt der Prolog hinter einem Schalter, den der Nutzer gegen
  die alte Bühne vergleicht, danach der Rest. Die alte Bühne bleibt als Rückfall, bis der Nutzer abnimmt.

## Folgen

- Während einer Fahrt rastert der Browser nichts nach. Ausgelassene Bilder lassen sich in der eigenen Schleife
  messen und prüfen.
- Die Ebenen brauchen Grafikspeicher. Die Grösse der Texturen wird gemessen und begrenzt, besonders auf dem Poco.
- Die Ebenen müssen vor dem ersten Zeigen fertig gerastert und hochgeladen sein, sonst hakt der Anfang.
- Die Tests der Geschichte (`geschichte-probe`) prüfen die neue Bühne. Die Stellen, die heute DOM-Elemente der Bühne
  abfragen, werden angepasst.

## Nachtrag (03.11.2026, Stufe 1)

Die Bühne zeichnet nicht mit dem Renderer des Spiels, sondern in einer eigenen Leinwand mit eigenem WebGL-Kontext in
`#story .scene` (an der Stelle der früheren Ebenen in `.world`), in vollen Gerätepixeln und mit eigener rAF-Schleife:
- **Schärfe:** Der Renderer des Spiels zeichnet höchstens 2 Pixel je Pixel der Oberfläche. Auf dem Poco wären das 1746
  statt 2400 Pixel Breite, unschärfer als die Bühne vorher.
- **Übergänge:** Die Überblendungen in CSS (Finale → Epilog, Epilog → Menü, Ein- und Ausblenden der Bühne) und
  `sceneLoop.coverStory` bleiben unverändert; Spiel und Bühne müssen nicht in einem Bild gemischt werden.
- **Takt:** Die Schleife der Bühne ist von `frameRate` unabhängig. Die Reisen im WebGL-Bild des Spiels laufen über
  `frameRate.geschichte()` mit 60 Bildern/s.

Die Texturen sind begrenzt: höchstens etwa 116 MB bei 2400 × 1080 (Poco quer), gerastert in Kacheln von 512 px im
Ruhepunkt vor einer Fahrt. Abgenommen vom Nutzer auf `leistung-15` (Ticket 13).
