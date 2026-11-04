# Das Spiel zeichnet wieder stetig 60 Bilder pro Sekunde; der Referenzdurchlauf entfällt

Entschieden vom Nutzer am 04.11.2026. Ersetzt den Entscheid zum Takt in ADR 0006.

## Kontext

Seit ADR 0006 zeichnete das Spiel im Level und im Menü stetig 30 Bilder/s. Nur die Folgen der Geschichte im WebGL-Bild
liefen mit 60 (ADR 0007). Der Nutzer will das Spiel im Allgemeinen wieder mit 60 sehen. Ausserdem will er die
Bildrate während des Spiels ablesen können: die angestrebte und die tatsächlich erreichte.

Die Leistungsanzeige (Taste F) zeigte bis dahin vor allem Messwerte des Vorhabens Leistung, dazu den Knopf
«Referenzdurchlauf». Das Messwerkzeug war für die drei Handy-Durchläufe auf dem Poco gebaut worden (Ticket 01 von
`.scratch/leistung/`). Beim Abschluss des Vorhabens war kein Abbau geplant, darum blieb es in der App.

## Entscheid

- **Takt:** Das WebGL-Bild läuft stetig mit 60 Bildern/s (`frameRate.spielFps`): im Level, im Menü und in den Folgen
  der Geschichte, auch in Ruhe und ohne Eingabe. Steht der Blick im Himmel (Menü, Übersicht), bleiben es 10
  (`skyFps`). Hinter der Bühne von Prolog und Epilog, solange sie einblendet, bleiben es wie bisher 30: Dann zeichnen
  Bühne und Spiel, und vom Spiel ist kaum noch etwas zu sehen. Steht alles still (nur mit `?t=`), ruht die Schleife
  wie bisher ganz.
- Die Unterscheidung zwischen «aktiv» und «ruhig» entfällt (`busy`, `poke`, `idleFps`), ebenso der Sonderfall für
  bewegte Himmel (`fluid`, `fluidAus`, die Fische am Strand). Bei stetigen 60 braucht es beides nicht mehr.
- `?takt=30` stellt zum Vergleich den Stand von ADR 0006 her: das Spiel stetig 30, die Geschichte 60.
- **Leistungsanzeige:** schlank. Oben steht die effektive Bildrate, also wie viele Bilder in der letzten Sekunde
  wirklich gezeichnet wurden (Spiel oder Bühne von Prolog und Epilog). Daneben steht das Ziel mit dem Grund: Spiel,
  Menü, Himmel, Geschichte, hinter der Bühne, Bühne, ruht. Hält die Grafik den Takt nicht, bleibt das Ziel stehen,
  und man sieht den Rückstand. Darunter folgen Bildschirmtakt, p95 der Bildabstände, Auflösung samt adaptiver
  Absenkung und die Version.
- **Referenzdurchlauf:** entfällt ganz. Das betrifft den Knopf, den Durchlauf mit Sicherung des Spielstands, die
  Dauerlast (Ticket 08), die Ergebniskarte, `?ersatzmass` und `tests/leistung-probe.mjs`. Die Messung der Bildabstände
  je Abschnitt bleibt (`leistung`, `?perf`), weil die Proben sie lesen.

## Folgen

- Bewegungen im Spiel sind wieder so flüssig wie vor ADR 0006, auch in Ruhe.
- Auf dem Poco bleibt weniger Reserve. Am Strand brauchte ein Bild 10,9 ms, das Budget bei 60 ist 16,7 ms. Schafft
  ein Gerät den Takt nicht, senkt die adaptive Auflösung wie vor ADR 0006. Eine Stufe «zurück auf 30 in Ruhe» gibt es
  nicht mehr.
- Mehr Bilder kosten mehr Akku und Wärme als unter ADR 0006.
- Auf dem Poco gibt es keine gemessene Zeichenzeit mehr, weil die Dauerlast fehlt und die Erweiterung für die GPU-Zeit
  fehlt. Braucht ein späteres Vorhaben sie wieder, liegt das Werkzeug in git (Commit vor diesem Entscheid).
