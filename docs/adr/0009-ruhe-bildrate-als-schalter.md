# In Ruhe zeichnet das Level weniger Bilder, vorerst nur als Schalter

Ergänzt ADR 0008 (Das Spiel zeichnet wieder stetig 60 Bilder pro Sekunde). Umgesetzt am 15.11.2026 in Ticket 01 des
Vorhabens «Energie auf dem Handy» (`.scratch/energie/`).

## Kontext

Der Nutzer will, dass das Spiel auf dem Handy weniger Akku braucht, ohne dass Gefühl oder Ansicht schlechter werden.
Auf dem Poco brauchte das ruhende Level mit 60 Bildern/s etwa 3,6 W, mit `?takt=30` etwa 1,6 W (Spec). Der grösste
Hebel ist also die Bildrate, auch wenn der Spieler nur überlegt. Stetige 30 hatte der Nutzer mit ADR 0008 wieder
verlassen: Er will das Spiel im Allgemeinen mit 60 sehen und kein träges oder stufiges Gefühl.

## Entscheid

- Mit `?ruhetakt=<n>` (ab 20, unter dem Takt des Spiels) zeichnet das Level in **Ruhe** nur n Bilder/s, bei jeder
  Eingabe oder Bewegung im nächsten Bildschirmbild wieder 60.
- **Ruhe** heisst: im Level, weder Menü, Übersicht, Geschichte noch Bühne; seit 1,5 s keine Eingabe und kein Weckruf
  der Schleife; nichts bewegt sich, das man anschaut. Das Schweben der Kamera, das Fliessen der Strahlen und das Drehen
  der Ziele gelten als Ruhe.
- Keine Ruhe sind Drehen, Wackeln, Hover, Feier, Herauswachsen, Überblenden, Fahrten der Kamera, wachsende Strahlen,
  der Wechsel der Führung samt Hand, die Lichtwelle und Himmel mit Bewegung, der das Auge folgt: Fische, Glühwürmchen,
  Funken und Planeten. Diese liefen schon in Ticket 17 der Leistung bei einem Wechsel von 30 und 60 sichtbar stufig. Im
  Zweifel bleibt es bei 60. `?ruhehimmel` zählt diese Himmel zum Vergleich doch als Ruhe.
- **Nur als Schalter.** Ohne `?ruhetakt` bleibt alles wie unter ADR 0008. Ob und mit welchem Wert die Ruhe-Bildrate
  Standard wird, entscheidet der Nutzer nach seinem Test auf dem Poco und einer Messung am Akku.

## Folgen

- Mit dem Schalter ruht das Level nur in Welten ohne solche Himmel: in der Wüste und unter der Milchstrasse. In Dorf,
  Wald, Meer, Vulkan und bei den Planeten bleibt es bei 60, ausser mit `?ruhehimmel`.
- Die adaptive Auflösung rechnet in Ruhe mit dem längeren Abstand und wertet das erste Bild danach nicht.
- Unter 20 Bildern/s wäre ein Zeitschritt länger als `MAX_DT`, die Animationen liefen langsamer. Darum gilt 20 als
  Untergrenze.
