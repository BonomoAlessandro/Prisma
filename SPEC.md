# Projekt: PRISMA – ein 3D-Licht-Puzzle mit Fokus auf Grafik

## Ziel
Baue ein Browser-Puzzlespiel in 3D, in dem der Spieler Spiegel und Kristalle dreht,
um einen weissen Lichtstrahl zu lenken, ihn mit Prismen in Spektralfarben aufzuspalten
und farbige Ziele zu treffen. Die Grafik hat oberste Priorität: Das Spiel soll edel,
ruhig und hochwertig wirken, wie ein Ausstellungsstück in einem dunklen Museum.

## Technik
- Eine einzige HTML-Datei mit dem ganzen Spiel (HTML, CSS, JS inline); dazu nur die Bibliotheken und die Schrift
  unter `vendor/` und der Service Worker `sw.js`, der das Spiel offline spielbar macht.
- Three.js (feste Version, heute r147, lokal unter `vendor/`) plus EffectComposer, RenderPass,
  UnrealBloomPass und ShaderPass für Post-Processing.
- Kein Build-Step, keine externen Bilder; Texturen prozedural oder per Canvas erzeugen.
- Ziel: stabile 60 FPS auf einem normalen Laptop, auf Mobile spielbar.

## Spielmechanik
Das Spielfeld ist ein Raster (z. B. 7×7) auf einer Ebene. Die Strahlberechnung läuft
logisch in 2D auf diesem Raster, dargestellt wird alles in 3D.

Elemente:
- **Lichtquelle:** sendet einen weissen Strahl in eine feste Richtung.
- **Spiegel:** reflektiert den Strahl, drehbar in 45°-Schritten.
- **Prisma:** spaltet weisses Licht in drei Strahlen (Rot, Grün, Blau) mit
  unterschiedlichen Winkeln; farbiges Licht wird nur gebrochen, nicht gespalten.
- **Farbfilter-Kristall:** lässt nur eine Farbe durch.
- **Kombinator (ab späteren Levels):** mischt eintreffende Farben additiv
  (Rot + Blau = Magenta usw.).
- **Ziel:** ein Kristall, der eine bestimmte Farbe braucht. Leuchtet auf, wenn er
  getroffen wird.
- **Blocker:** dunkle Steinsäulen, die Licht schlucken.

Regeln:
- Klick/Tap auf ein drehbares Element dreht es um 45° (Rechtsklick oder
  langes Drücken: Gegenrichtung).
- Der Strahl wird nach jeder Änderung sofort neu berechnet (mit Schutz gegen
  Endlosschleifen, max. ~50 Abprallungen).
- Level gelöst, wenn alle Ziele gleichzeitig mit der richtigen Farbe getroffen sind.
- Levels als JSON-Array definiert, damit neue einfach ergänzt werden können.
- 10 Levels mit sanfter Lernkurve: zuerst nur Spiegel, dann Prisma, dann Filter,
  dann Kombination aus allem.

## Grafik (wichtigster Teil)
Szene & Licht:
- Fast schwarzer Hintergrund mit leichtem blau-violettem Farbverlauf und Fog.
- Spielfeld als dunkle, leicht spiegelnde Steinplatte (geringe Roughness),
  damit sich Strahlen und Kristalle darin spiegeln.
- Environment-Map über PMREMGenerator für realistische Reflexionen.
- ACES Filmic Tone Mapping, sRGB-Output.

Lichtstrahlen:
- Jeder Strahl besteht aus einem hellen, fast weissen Kern und einem breiteren
  farbigen Glow (zwei Meshes oder ein Custom-Shader mit additivem Blending).
- Leichtes Flimmern/Fliessen entlang des Strahls (animierte UV im Shader).
- Feine Staubpartikel, die nur innerhalb der Strahlen sichtbar aufleuchten.
- Kleine Lichtblitze (Sprites) an jedem Reflexions- und Brechungspunkt.

Objekte:
- Kristalle und Prismen mit MeshPhysicalMaterial (Transmission, IOR, Clearcoat),
  damit sie wie geschliffenes Glas wirken.
- Spiegel mit dünnem, gebürstetem Metallrahmen und hochglänzender Fläche.
- Ziele als facettierte Edelsteine, die im inaktiven Zustand schwach in ihrer
  Zielfarbe glimmen.
- Drehbare Elemente bekommen beim Hover einen sanften Lichtrand.

Post-Processing:
- UnrealBloomPass (Bloom gezielt einstellen, damit nur Strahlen und Leuchtobjekte
  blühen, nicht die ganze Szene).
- Dezente Vignette und sehr leichte chromatische Aberration am Bildrand.
- Optional: leichtes Filmkorn für einen edlen Look.

Animation & Kamera:
- Drehungen weich animiert (Easing, ~250 ms), nie sprunghaft.
- Kamera schräg von oben, schwebt leicht (sanfte Sinus-Bewegung); der Spieler kann
  sie frei rund ums Feld drehen (Neigung begrenzt), aber nicht verlieren.
- Level-Übergänge: Feld versinkt in Dunkelheit, neues Feld baut sich Element für
  Element auf.

## Der "Aufleuchten"-Moment beim Lösen
Das muss richtig befriedigend sein:
1. Alle Ziele leuchten nacheinander hell auf (kurze Verzögerung zwischen ihnen).
2. Bloom-Stärke pulsiert kurz hoch.
3. Eine Licht-Schockwelle läuft über die Bodenplatte.
4. Partikelregen in den Farben der Ziele.
5. Ein harmonischer Akkord ertönt (siehe Audio).
6. Danach dezent eingeblendet: "Level gelöst" und ein Button für das nächste Level.

## Audio (Web Audio API, alles generiert, keine Dateien)
- Leiser, atmosphärischer Ambient-Drone im Hintergrund.
- Jede Drehung: kurzer, glasiger Klang.
- Ziel getroffen: Ton passend zur Farbe (Rot tief, Blau hoch).
- Level gelöst: Akkord aus allen getroffenen Tönen.
- Mute-Button.

## UI
- Minimalistisch, schmale elegante Schrift, viel Leerraum.
- Oben: Levelnummer und Name (z. B. "III – Brechung").
- Kleine Buttons: Level neu starten, Ton an/aus, Levelauswahl.
- Kurzer Startbildschirm mit Titel "PRISMA", der aus einem Lichtstrahl entsteht.

## Vorgehen in Phasen
Bitte in dieser Reihenfolge bauen und nach jeder Phase prüfen, dass alles läuft:
1. Szene, Kamera, Boden, Beleuchtung, Post-Processing (Look zuerst festlegen).
2. Rasterlogik und Strahlberechnung mit Quelle, Spiegel und Ziel.
3. Strahl-Rendering mit Kern, Glow, Partikeln und Lichtblitzen.
4. Prisma, Filter, Kombinator und Blocker.
5. Interaktion (Raycasting, Hover, weiche Drehung).
6. Level-System mit 10 Levels und Übergängen.
7. Lösungs-Animation, Audio, UI, Startbildschirm.
8. Feinschliff: Performance, Mobile-Steuerung, Balance der Bloom-Werte.

## Abnahmekriterien
- Alle 10 Levels sind lösbar (bitte jede Lösung im Code als Kommentar notieren).
- Kein Ruckeln bei Drehungen, stabile Framerate.
- Strahlen wirken leuchtend und "echt", nicht wie flache Linien.
- Der Lösungsmoment fühlt sich wie eine kleine Belohnung an.
- Funktioniert per Maus und Touch.
