# 07: Handy-Durchlauf 2 und Messrunde ganze App

**Spec:** ../spec.md

**Blocked by:** 02, 03, 04, 05, 06

**Status:** ready-for-agent

**What to build:** Ein Handy-Durchlauf auf dem Stand nach 02–06 und eine Messung der ganzen App, die festlegt, was dann
noch zu tun ist. Ergebnis sind neue Tickets (`08-…` usw.) in diesem Ordner, je Hotspot eines. Selbst gebaut wird in
diesem Ticket nichts.

- [ ] **Erster Schritt, Handy-Durchlauf 2:** Prüfen, dass 02–06 alle `resolved` sind. `APP_VERSION` nachführen, Tests
      grün, Stand auf `feature/leistung` pushen. Dann **«bereit für Handy-Durchlauf 2, bitte auf Render deployen»**
      unter `## Comments` vermerken und auf die Ergebniskarte des Nutzers vom Poco warten. Die folgenden Schritte
      beginnen erst, wenn sie eingetragen ist.
- [ ] Referenzdurchlauf im echten Chrome mit Fenster und GPU auf dem Arbeitsrechner fahren, einmal ungedrosselt und
      einmal mit Handy-Emulation und 4× bzw. 6× Drosselung. Dazu die Ergebniskarte vom Poco auswerten.
- [ ] Über den Referenzdurchlauf hinaus jeden Bereich einmal messen: alle sechs Welten bzw. Skyboxen (Wald, Strand,
      Wüste, Vulkan, Planeten, Sterne) samt Reise dorthin, Finale und Epilog, Menü, Übersicht, Feiern («celebration»,
      Regen), Ziehen der Kamera, Grössenänderung bzw. Drehen des Handys.
- [ ] Für jeden Bereich über den Grenzwerten: Ursache mit dem Performance-Panel belegen (CPU oder GPU, Script, Paint,
      Upload, Shader), dann ein Ticket mit Messwerten, Ursache, Vorschlag ohne sichtbaren Qualitätsverlust,
      Abnahmekriterium und Blocked-by. Die Notizen in `spec.md` dabei prüfen und jeweils bestätigen, verwerfen oder in
      ein Ticket überführen: Bloom, Spiegelung, Pinsel, HD-Himmel bzw. Grafikspeicher, Panorama-Netz, Staub,
      `cullInstances`, Menü-Blur, Startbildschirm-CSS, erstes Zeichnen einer Skybox, «Spiel → Übersicht», Hall-Convolver.
- [ ] Die 8-ms-Marge auf dem Poco gesondert bewerten: Wo liegt die Zeichenzeit pro Abschnitt, und was bringt sie am
      meisten darunter?
- [ ] Safari-Risiken für iOS festhalten (Texturgrössen über 4096, Grafikspeicher pro Skybox, SVG-Filter), auch wenn
      iOS nicht geprüft wird. Wo billig vermeidbar, als Ticket aufnehmen.
- [ ] Tabelle der neuen Tickets in `spec.md` nachführen. Als letztes Ticket die **Schlussabnahme** anlegen: alle Tests
      grün, Referenzdurchlauf auf dem Arbeitsrechner, `APP_VERSION` nachführen, Stand pushen, «bereit für
      Handy-Durchlauf 3 (Schluss), bitte auf Render deployen», Ergebniskarte vom Poco, README bzw. PLAN.md nachführen.
      Kein Merge, bis der Nutzer es sagt.

## Comments

**Erster Schritt, 01.11.2026:** 02–06 sind alle `resolved` und auf `feature/leistung` zusammengeführt (05 vorher,
dann 06 mit 02, 04, 03). `APP_VERSION = '2026-11-01 leistung-07'`. Tests auf dem zusammengeführten Stand: logic (2033),
golden, hall, beurteilung, generator, geschichte, offline, screenshot, start-probe, geschichte-probe (`--start`,
`--grad leicht --welten 2 --finale leicht`, `--handy`), leerlauf-probe, leistung-probe grün, keine Warnung
«Weckstelle fehlt».

Arbeitsrechner der Agenten (Quadro T2000, Fenster), vorher = 01c bzw. vor dem jeweiligen Ticket:
- Desktop: Karte `adaptiv 1.00, Umbauten 0` in allen Läufen; hinter Startbildschirm und Prolog 0 gezeichnete Bilder/s;
  Menü 10/s; Startknopf 3,8–4,4 s nach dem Laden (vorher 6,5–7,3 s), 2,9 s nach Beginn der Enthüllung; Seitenstart
  280–360 ms (vorher 880–940 ms); Kamerafahrten der Prolog-Bühne enden ohne Hänger.
- Handy-Emulation 4×: Absenkung `Umbauten 2` wie vorher (CPU-gebunden, Streuung `1.00`/`0.50` vorher wie nachher);
  massgebend ist das Poco.

Worauf auf dem Poco achten (aus den Reviews): Absenkung im Spiel (`adaptiv`/`Umbauten`, Spiegel und Skybox scharf?);
Glühwürmchen in den Prolog-Pausen (dort lädt jetzt der Himmel); Hänger beim ersten Klick ins Menü bei wiederkehrenden
Spielern; der Abschnitt «Startbildschirm» enthält das Vorwärmen vor der Enthüllung.

Offene Punkte für die Messrunde: jeder Umbau der Auflösung zeigt ein schwarzes Bild (vorher schon); Start der 3.
Prolog-Fahrt 133 ms; Linien werden nach dem Halt gestaffelt dünner; gröbere Ladestücke des Himmels auf schwachen
Geräten; Wartezeit vor der Enthüllung auf dem Desktop 1,7–2,1 s für neue Spieler (bewusst, Ticket 03); gelegentlich
ausfallendes Bild in der offenen Übersicht (10/s); Spiegelung im Level nur jedes zweite Bild (Kandidat aus 06).

**bereit für Handy-Durchlauf 2, bitte auf Render deployen**
