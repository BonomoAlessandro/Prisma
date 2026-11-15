# In Ruhe zeichnet das Level weniger Bilder

Ergänzt ADR 0008 (Das Spiel zeichnet wieder stetig 60 Bilder pro Sekunde). Umgesetzt am 15.11.2026 in Ticket 01 des
Vorhabens «Energie auf dem Handy» (`.scratch/energie/`), zunächst als Schalter `?ruhetakt`. Seit Ticket 02 (Entscheid
des Nutzers, 15.11.2026) Standard mit 30 Bildern/s in allen Welten.

## Kontext

Der Nutzer will, dass das Spiel auf dem Handy weniger Akku braucht, ohne dass Gefühl oder Ansicht schlechter werden.
Auf dem Poco brauchte das ruhende Level mit 60 Bildern/s etwa 3,6 W, mit `?takt=30` etwa 1,6 W (Spec). Der grösste
Hebel ist also die Bildrate, auch wenn der Spieler nur überlegt. Stetige 30 hatte der Nutzer mit ADR 0008 wieder
verlassen: Er will das Spiel im Allgemeinen mit 60 sehen und kein träges oder stufiges Gefühl.

## Entscheid

- Das Level zeichnet in **Ruhe** nur 30 Bilder/s (`RUHE_FPS`), bei jeder Eingabe oder Bewegung im nächsten
  Bildschirmbild wieder 60. Das gilt auf dem Handy wie auf dem Desktop (Strom am Laptop, weniger Lüfter).
- **Ruhe** heisst: im Level, weder Menü, Übersicht, Geschichte noch Bühne; seit 1,5 s keine Eingabe und kein Weckruf
  der Schleife; nichts bewegt sich, das man anschaut. Das Schweben der Kamera, das Fliessen der Strahlen, das Drehen
  der Ziele und die Himmel gelten als Ruhe, auch die mit Fischen, Glühwürmchen, Funken und Planeten.
- Keine Ruhe sind Drehen, Wackeln, Hover, Feier, Herauswachsen, Überblenden, Fahrten der Kamera, wachsende Strahlen,
  der Wechsel der Führung samt Hand und die Lichtwelle. Im Zweifel bleibt es bei 60.
- **Schalter zum Vergleichen:** `?ruhetakt=<n>` (ab 20, unter dem Takt des Spiels) wählt einen anderen Wert;
  `?ruhetakt=aus` oder `?ruhetakt=60` schaltet die Ruhe-Bildrate aus, das Spiel zeichnet dann stetig 60 wie unter ADR
  0008. Die Leistungsanzeige zeigt dafür «Spiel (Ruhe aus)».
- Unverändert: die Geschichte 60, Menü und Übersicht 10, hinter der Bühne 30, `?takt=30` (das Spiel stetig 30).

## Verlauf

- **Ticket 01:** nur als Schalter. Himmel mit Bewegung, der das Auge folgt (`skyTheme.fluid`: Fische, Glühwürmchen,
  Funken, Planeten), hielten den vollen Takt, weil sie in Ticket 17 der Leistung beim häufigen Wechsel von 30 und 60
  stufig wirkten. `?ruhehimmel` zählte sie zum Vergleich als Ruhe.
- **Test des Nutzers auf dem Poco** (mit `?alles&ruhetakt=30&ruhehimmel`): In keiner Welt wirkte etwas stufig.
- **Akkuvergleich auf dem Poco** (Bergwald, je 15 min abwechselnd A/B/A/B): stetig 60 im Mittel etwa 690 mA, Ruhe
  mit 30 auch im Himmel etwa 467 mA, also **30–35 % weniger Strom**; das Handy wurde dabei 1–3 °C kühler.
- **Ticket 02:** Standard mit 30 in allen Welten. Die Markierung `fluid` der Himmel und `?ruhehimmel` entfallen, sie
  hatten keinen anderen Zweck.

## Folgen

- Im ruhenden Level zeichnet das Spiel in jeder Welt die Hälfte der Bilder. Was man anschaut (Eingabe, Drehung, Feier),
  bleibt bei 60.
- Die adaptive Auflösung rechnet in Ruhe mit dem längeren Abstand und wertet das erste Bild danach nicht.
- Unter 20 Bildern/s wäre ein Zeitschritt länger als `MAX_DT`, die Animationen liefen langsamer. Darum gilt 20 als
  Untergrenze.
- Proben, die stetige 60 im Level voraussetzen, laufen mit `?ruhetakt=60` oder rechnen mit `frameRate.ruheFps`.
