# Das Spiel zeichnet stetig 30 Bilder pro Sekunde, die Geschichte bleibt bei 60

Entschieden vom Nutzer am 02.11.2026 nach Handy-Durchlauf 3 des Vorhabens Leistung (Spec und Tickets in
`.scratch/leistung/`, Ticket 13), umgesetzt in `leistung-09` auf `feature/leistung`.

## Kontext

Die Spec der Leistung verlangt auf dem Poco F4 GT (Adreno 730) eine Zeichenzeit von höchstens 8 ms je Bild. Das ist
die Reserve für 60 Bilder/s auf einem warm gewordenen Handy. Die Tickets 08–12, 14 und 17 senkten die Zeichenzeit,
ohne dass man es dem Bild ansieht: Am Strand sank sie von 13,5 auf 10,9 ms, im Wald von 8,5 auf 7,4 ms, im Menü von
4,8 auf 4,0 ms. Unter 8 ms kam der Strand nur mit sichtbaren Abstrichen (Variante A: Leuchten und Wasser in tieferer
Auflösung, Pinsel und Kantenglättung der Spiegelung auf dem Handy aus). Die Alternative war Variante B: stetige 30
Bilder/s.

Der Nutzer hat beide Takte auf dem Poco gespielt. Dafür gab es die Schalter `?takt=30` und `?sky=beach`. Ergebnis:
«Den Strand gespielt mit 30 Takt, es läuft sauber.»

## Entscheid

- Das WebGL-Bild läuft stetig mit 30 Bildern/s: im Level, im Menü und auf Reisen, auch bei Eingaben und Bewegung
  (`frameRate.activeFps`). Steht der Blick im Himmel, bleiben es 10 (`skyFps`).
- Die Geschichte, also die Bühne der Noa-Szenen mit den Glühwürmchen, läuft immer mit 60 Bildern/s. Sie läuft als
  Animation des Browsers und wird nicht gedrosselt (Vorgabe des Nutzers).
- Variante A entfällt: kein sichtbarer Abstrich am Bild.
- Die Grenze der Zeichenzeit hält dieselbe Reserve wie vorher, bei 30 Bildern/s also 16 ms je Bild statt 8 ms
  (`MESS_GRENZE.zeichnen`).
- `?takt=60` stellt zum Vergleich das frühere Verhalten her (60, solange sich etwas bewegt; stetig 60 bei Fischen am
  Strand).
- Nachtrag 03.11.2026 (ADR 0007): Die Folgen der Geschichte im WebGL-Bild (Einstieg, Reise zwischen den Welten,
  Finale) gehören zur Geschichte und laufen stetig mit 60 Bildern/s (`frameRate.storyFps`, `frameRate.geschichte()`).
  Ab dem Einstieg ins Level gelten wieder 30.

## Folgen

- Alle gemessenen Welten haben auf dem Poco viel Reserve (10,9 von 33 ms). Die Rückfallstufe `fluidAus` und die
  adaptive Auflösung greifen nur noch auf deutlich schwächeren Geräten.
- Weniger Bilder je Sekunde schonen Akku und Wärme.
- Bewegungen im Spiel sind weniger flüssig als mit 60. Der Nutzer hat sie am Strand als sauber beurteilt.
- Auf Reisen zeichnet das Poco wieder 60 Bilder/s (Strand 10,9 ms je Bild, unter 16,7 ms). Schafft ein Gerät das
  nicht, senkt die adaptive Auflösung wie vor ADR 0006.
