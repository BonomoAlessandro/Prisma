# 19: Bühne der Geschichte in WebGL

**Spec:** ../spec.md · **ADR:** docs/adr/0007-buehne-der-geschichte-in-webgl.md

**Blocked by:** 18 (gemergt)

**Status:** Stufe 1 gebaut (`leistung-13`, `?buehne=gl`), wartet auf den Vergleich des Nutzers

**What to build:** Die Bühne der Noa-Szenen (Prolog, Kapitelszenen, Finale, Epilog) neu in WebGL, nach ADR 0007.

Vorgeschichte (Nutzer, 03.11.):
- `leistung-10`: «Glühwürmchen ruckeln noch ein wenig, erste Noa-Szene nicht ganz glatt, in anderen Szenen kleine
  Stellen nicht gleichmässig.»
- Am Computer (60 Hz) gleich, die Kamera wirkt «mal schneller, mal langsamer».
- `leistung-11` (sanftere Kurve, langsamere Glühwürmchen) brachte keinen grossen Unterschied.
- `leistung-12` (Untertitel, Satz und Strahl vorbereitet, weniger ausgelassene Bilder) ist «besser, aber noch nicht
  wie erwartet».
- Darauf der Entscheid für den Umbau.

Stufen:
1. Prolog in WebGL hinter `?buehne=gl`:
   - Ebenen als Texturen (Billboards) mit Detailstufen
   - Kamerafolge mit denselben Einstellungen und derselben Kurve
   - Lampe und Strahl
   - Glühwürmchen
   - Untertitel und Hinweise als DOM darüber
   - Tippen, Überspringen, Beschleunigen wie heute
   - gemessen Bild für Bild am Computer
   - gepusht, damit der Nutzer gegen die alte Bühne vergleicht
2. Nach dem Ja des Nutzers: Kapitelszenen, Finale und Epilog auf der neuen Bühne. Die neue Bühne wird Standard, die
   alte gibt es noch über `?buehne=dom`. Die Reisen laufen mit 60 Bildern/s.
3. Nach der Abnahme: die alte Bühne entfernen.

## Acceptance criteria

- [ ] In der eigenen Schleife ist während Fahrten und Flügen am Computer kein Bild ausgelassen. Gemessen wird über den
      ganzen Prolog, die Abstände bleiben unter 1,5 × 16,7 ms.
- [ ] Die Bahnen von Kamera und Glühwürmchen sind je Bild glatt: kein Sprung über die Kurve hinaus.
- [ ] Gleiches Bild wie heute: Ebenen, Farben, Licht, Schärfe beim Zoom. Vergleichsbilder liegen nebeneinander.
- [ ] Der Grafikspeicher der Ebenen auf dem Handy ist gemessen und begrenzt.
- [ ] `geschichte-probe` (Standard und `--quer`) ist grün, die übrigen Proben bleiben wie bisher.
- [ ] Der Nutzer nimmt den Prolog auf dem Poco und am Computer ab.

## Comments

**Plan Stufe 2 (03.11.):**
- Nur Prolog und Epilog nutzen die DOM-Bühne. Die Kapitelszenen, die Reisen und das Finale laufen schon in der
  3D-Szene des Spiels, für sie heisst Stufe 2 nur «mit 60 Bildern/s».
- Vorgabe für Stufe 1:
  - generisch je Folge, mit Spuren für Kamera, Arm, Strahl und Stern
  - dieselbe Schnittstelle wie `createStoryScene`
  - Wahl allein in `story.makeScene()` über `?buehne=`
  - Untertitel-DOM und SVG-Erzeugung geteilt
  - eigenes Canvas in `#story .scene` als Ersatz für `.world`, die CSS-Übergänge bleiben
  - `__prisma.buehne` mit `bilder()` und `speicher()` für die Proben
- Arbeitspakete nach Stufe 1:
  - WP-0: Schnittstelle und Schalter
  - danach parallel:
    - WP-A: Epilog-Akte `blink` und `answer`
    - WP-B: Übergänge Finale → Epilog und Epilog → Menü, `starAt`
    - WP-C: Reisen mit 60 Bildern/s, Zweig `leistung/19-reisen-60`
    - WP-E: Proben mit `--buehne`
  - WP-D nach WP-A: Drehen, Seitenmassstab, reduzierte Bewegung, verborgener Tab, Ruhe-Politik, Speicher auf dem Handy
### Stufe 1 (03.11., Branch `leistung/19-buehne-gl`, `leistung-13`)

Gebaut: `glBuehne` in `createStoryScene`, hinter `?buehne=gl`. Ohne den Schalter bleibt die DOM-Bühne unverändert.
- **Logik:** Dieselbe Szene mit derselben Logik (Folge, Tippen, Tempo, Überspringen, Spuren, Schwinger, `wurmOrt`).
  Prolog und Epilog laufen damit beide auf der neuen Bühne.
- **Zeichnen:** In einer eigenen Leinwand im `.world`, eigener WebGL-Kontext (ohne Tiefe und Kantenglättung), in
  Gerätepixeln (`visualViewport.scale` × `devicePixelRatio`).
  - Der Renderer des Spiels zeichnet mit höchstens 2 Pixeln je Pixel der Oberfläche, auf dem Poco gröber als die Bühne
    bisher. Darum die eigene Leinwand (Abweichung von ADR 0007: «derselbe Renderer»).
  - Die Übergänge (`.world` 1,6 s, `#story`) bleiben unverändert.
- **Schleife:** Eine eigene rAF-Schleife, solange die Bühne läuft, ohne `frameRate`.
- **Stehende Teile:** Je Ebene und Abschnitt der Folge (`abschnitteFuer`) ein Bild aus demselben SVG, nur der Ausschnitt,
  den man sieht.
  - Skalierung: die grösste des Abschnitts. Über 1,6 Bildschirme an Pixeln eine Grundstufe, dazu scharfe Stufen je
    Ruhepunkt.
  - Kacheln von 512 px, je eine Textur mit 1 px Rand. Ganz durchsichtige Kacheln fallen weg (Probe 32 × 32).
  - Gerastert wird im Ruhepunkt davor, höchstens 4 ms Hauptthread je Bild.
  - Eine Fahrt beginnt erst mit ihren Texturen (`bereit` in `playScene`).
- **Linien:** Je Ruhepunkt neu, mit der Breite des Ruhepunkts (wie `linienTauschen`).
- **Bewegte Teile:** Glühwürmchen, Rauch, Fenster, Polarstern, Schal und Arm als kleine Texturen, der Ort je Bild aus
  der Zeit.
- **Strahl:** Ein Shader (Kegel, Kern, Maske, Leuchten der Lampe).
- **Sterne:** Funkelnde Sterne als Punkte.
- **Shader:** Werden vorab übersetzt.
- **Ohne DOM-Arbeit:** In WebGL legen Spuren, Glühwürmchen, Abschnitte und Linien keine Animationen mehr an.
- **Proben:** `__prisma.buehne` mit `modus`, `bilder()`, `speicher()`, `statistik()`, `liste()`.
  `geschichte-probe --buehne gl`.

Gemessen am Computer (echtes Fenster, GPU, Bildschirm aus, darum etwa 56 Hz), ganzer Prolog, Abstände der eigenen Bilder:
- **Fahrten 1–5:** keine Lücke über 25 ms, längster Abstand 19–24 ms. Desktop 1600 × 900 und quer 873 × 393 mit dpr 2,75.
- **Ruhepunkte:** ohne Lücke (ausser während eines Bildschirmfotos der Probe).
- **Zum Vergleich die DOM-Bühne** (`leistung-12`, Trace, Ticket 20): Lücken am Beginn der Fahrten bis 50–80 ms, Lampe
  45–57 ms.
- **Fahrt 0:** In einigen Läufen ein Bild von 300–490 ms. Laut Trace ist das `DXGISwapChainImageBacking::Present` im
  GPU-Prozess (Bildschirm aus, wie in Ticket 20), nicht die Seite (LoAF ohne Skript). Am Poco prüfen.
- **Bahnen:** Kamera (`storyEase` genau, nicht mehr linear zwischen Keyframes) und Glühwürmchen werden je Bild aus der
  Zeit gerechnet und sind glatt per Bau.
- **Texturen:** höchstens 116 MB bei 2400 × 1080 (quer, dpr 2,75, also wie das Poco), am Ende etwa 100 MB. Vorher mit
  Kacheln von 1024 px 161 MB, als ganze Texturen 446 MB.
- **Gleiches Bild:** Vergleichsbilder DOM gegen GL je Einstellung, quer mit dpr 2,75: mittlere Abweichung 0,6–1,3/255.
  - Abweichungen über 16/255 bei 0,1–1,7 % der Pixel, an Kanten (Kantenglättung).
  - In den Einstellungen 4 und 5 zusätzlich bei den Glühwürmchen (anderer Zeitpunkt).

Proben grün:
- `geschichte-probe`, `--quer`, `--buehne gl`, `--quer --buehne gl`
- `leistung-probe`
- `leerlauf-probe`

Offen:
- **Abnahme:** Vergleich des Nutzers am Computer und am Poco (`?buehne=gl` gegen ohne).
- **Ruhe:** Zeichnet das Spiel im Ruhepunkt dahinter (`ruhe`), hält das auch die Schleife der Bühne an. Bisher liefen
  die Animationen im Compositor weiter. Auf dem Poco messen.
- **Zoomfahrten:** In Fahrten mit grossem Zoom ist die Mitte der Fahrt etwas weicher (Grundstufe), im Halt nie.
- **Uhr:** Die Uhr der Bühne läuft bei verborgenem Tab weiter, wie bisher.

**Test des Nutzers auf `leistung-13` (03.11.):**
- «Es ist nun viel besser! … Auch auf dem Handy ist es nun sauber.»
- Bewegungen wieder im Tempo vom Anfang: Die Kurve und die Flugdauern aus `leistung-11` sind zurückgenommen.
- Stufe 1 ist damit angenommen. Seit `leistung-14` ist die WebGL-Bühne Standard, die alte Bühne gibt es noch über
  `?buehne=dom`.

**Stufe 3 (03.11., `leistung-16`): alte Bühne entfernt.**
- Weg sind `?buehne=dom`, die Animationen des Compositors je Ebene (Folge, Abschnitte, Linien doppelt, Massstab k),
  der DOM-Strahl mit Keilen und Maske, die Flüge, das Schwingen und Blinken der Glühwürmchen als Web Animations, der
  Rauch und die CSS der Ebenen. Dazu die Schalter `altflug`, `knickflug` und `raster2`.
- Die Ebenen (SVG) bleiben als Quelle der Texturen, unsichtbar.
- Die Uhr der Folge ist eine Animation ohne Ziel (`folgeUhr`), Schwinger und Spuren sind reine Werte.
- `scene.einfrieren(t)` und `auftauen()` gibt es für Vergleichsbilder (`tests/buehne-messung.mjs bilder`).
- `index.html` ist 527 Zeilen kürzer (689 entfernt, 157 neu).
- Vorher und nachher am Computer (Prolog quer, dpr 2,75): Bilder gleich bis auf die Glühwürmchen (0,02–0,6/255), Fahrten 1–5 ohne Lücke über 25 ms.
- Alle Proben und Unit-Tests sind grün, auch `--uebersicht --dorf`.
- Behoben: Der Offline-Test schlug seit Stufe 1 an. Grund war die Adresse des SVG-Namensraums im Text, jetzt kommt sie aus dem DOM.
