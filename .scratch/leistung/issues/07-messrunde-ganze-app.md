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

**Handy-Durchlauf 2, Poco F4 GT, 01.11.2026, vom Nutzer:**

```
PRISMA · Referenzdurchlauf (Spec .scratch/leistung/)
Version     2026-11-01 leistung-07
Zeit        1.11.2026, 08:14:18
Gerät       Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36
Modell      Android 13.0.0 21121210G
GPU         ANGLE (Qualcomm, Adreno (TM) 730, OpenGL ES 3.2)
Bildschirm  393×873, Fenster 392×739, Pixelverhältnis 2.75
Rendern     784×1478 (Pixelverhältnis 2.00, adaptiv 1.00, Umbauten 0), Handy
Takt        60 Hz (Median der Bildabstände 16.60 ms)
Zeichenzeit ERSATZMASS: frame() bis nach readPixels (1 px), jedes 10. Bild; der Abstand danach zählt nicht
ACHTUNG     Ersatzmass aktiv (keine GPU-Zeit): 240 Bildabstände mit readPixels nicht gezählt
Grenzen     p95 ≤ 18.3 ms, kein Bild > 33 ms; Zeichnen p95 ≤ 8 ms (Handy)

Abschnitt       Bilder    p95    max  >33 Zeichn   CPU gez/s
Seitenstart*         9  345.4  345.4    3      –  33.0     1
Startbildschirm    253   16.6   17.0    0      –     –     0
Menü               257   16.6   49.5    1   57.7   7.4    31
Prolog            2898   16.6   98.8    5   12.1   3.8     1
Einstieg           325   16.6   65.8    3   58.6   8.4    65
Spiel              822   16.6   49.5    2   33.0   9.4    66
Reise              699   16.6   98.8    2   31.1   7.4    66
Spiel n. Reise     326   16.7   49.4    1   45.8  11.4    38
Gesamt            5580   16.6   98.8   14   39.6            
* Laden: zählt nicht gegen die Grenzwerte. p95/max: sichtbare Bildabstände; Zeichn/CPU: p95 je
  gezeichnetem Bild (Zeichenzeit, CPU-Zeit von frame()); gez/s: gezeichnete WebGL-Bilder je Sekunde.

Flüssig:    nein (Menü, Prolog, Einstieg, Spiel, Reise, Spiel n. Reise)
Zeichnen ≤ 8 ms: nein (Menü, Prolog, Einstieg, Spiel, Reise, Spiel n. Reise)

Längste Bilder:
   345.4 ms  Seitenstart bei 0.2 s
   214.0 ms  Seitenstart bei 0.8 s
   114.6 ms  Seitenstart bei 0.6 s
    98.8 ms  Reise bei 80.0 s
    98.8 ms  Prolog bei 21.4 s
    65.8 ms  Einstieg bei 60.7 s
    65.8 ms  Reise bei 85.9 s
    49.5 ms  Prolog bei 50.4 s

Hänger des Hauptthreads (long-animation-frame):
     342 ms  Seitenstart bei 0.2 s: https://prisma-5d09.onrender.com/?perf=: Script 332 ms, Rendern 4 ms
     173 ms  Seitenstart bei 0.8 s: ohne Script, Rendern 2 ms
     120 ms  Seitenstart bei 0.6 s: FrameRequestCallback: Script 77 ms, Rendern 97 ms
     118 ms  Reise bei 80.0 s: FrameRequestCallback: Script 104 ms, Rendern 110 ms
     101 ms  Prolog bei 21.4 s: ohne Script, Rendern 4 ms
      87 ms  Einstieg bei 60.7 s: FrameRequestCallback → frame: Script 72 ms, Rendern 75 ms
      75 ms  Reise bei 85.9 s: FrameRequestCallback → frame: Script 60 ms, Rendern 61 ms
      72 ms  Einstieg bei 55.9 s: FrameRequestCallback → frame: Script 59 ms, Rendern 60 ms
```

Der Nutzer: Grafik im Spiel «eigentlich ganz gut», bei den **Fischen nicht ganz sicher, ob sie ein wenig pixelig
waren**. Glühwürmchen «super», ausser **einem kurzen Moment, als sie in den Wald flogen**. **Kurzes Flackern des Bildes in
der ersten Noa-Szene.** Erster Klick ins Menü sauber.

Vergleich mit Durchlauf 1 (01c): Gesamt p95 49,3 → 16,6 ms, Bilder über 33 ms 334 → 14; Prolog p95 65,9 → 16,6, über
33 ms 320 → 5, gezeichnet 22/s → 1/s; Startbildschirm max 98,7 → 17,0, 0 gezeichnet; Seitenstart-Hänger 807 → 342 ms;
`adaptiv 1.00, Umbauten 0` gehalten. Offen: Zeichnen (Ersatzmass) p95 31–59 ms überall ausser Prolog, Marge 8 ms weit
verfehlt; Menü 31 gezeichnete Bilder/s statt 10; einzelne Bilder 50–100 ms in Prolog (21,4 s, «ohne Script»), Einstieg
und Reise.
