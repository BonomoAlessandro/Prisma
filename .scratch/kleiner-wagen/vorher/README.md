# Vorher-Lauf (Ticket 01): Dauer und Bildzeiten vor dem Kleinen Wagen

Massstab für die Tickets 05 (Reisen höchstens etwa 1 s länger, Einstiege nicht länger) und 06 (Finale etwa 4 s
länger). Gemessen am 04.11.2026 auf dem Stand 97a89a2 (`index.html` unverändert), mit der Probe der Geschichte, die
dafür um die Dauer der Übergänge und `--messwerte` erweitert wurde (Ticket 01). Arbeitsrechner, Headless-Chrome auf
der Grafikkarte (`GPU=1`, ANGLE d3d11), über `tools/leise.sh` mit `LEISE_CPU=50`.

```sh
GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/geschichte-probe.mjs --ganz --grad leicht \
  [--handy] --messwerte .scratch/kleiner-wagen/vorher/<desktop|handy>.json
GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/geschichte-probe.mjs --finale leicht \
  [--handy] --messwerte .scratch/kleiner-wagen/vorher/<desktop|handy>-finale.json
```

Dateien: `desktop.json`, `handy.json` (ganzer Durchgang in Leicht, Desktop 1440 × 900 und Handy hoch 390 × 844,
Pixeldichte 2), `desktop-finale.json`, `handy-finale.json` (letzte Welt ab «Weiter» im Menü: Einstieg beim
Fortsetzen, zehn Level, Finale). Je Abschnitt: `dauer` (Uhr), `tippen` (davon wartete ein Satz auf Tippen), `fotos`
(davon hielt ein Bild der Probe die Seite an, über 50 ms je Bild), `netto` (Dauer ohne beides: so lange dauert die
Szene selbst), dazu die Bildzeiten (`max`, `ueber50`, `ueber100`, `mittel` in ms).

## Wie gemessen

- Beginn: der Klick auf «Weiter» nach dem letzten Level einer Welt (Reise, Finale), auf «Gleich los» im Angebot
  (Einstieg in den Bergwald), auf «Weiter» im Menü (Einstieg beim Fortsetzen, Neuladen) bzw. auf die Karte des Grads
  (Prolog). Der Epilog zählt ab dem ersten Bild nach dem Finale.
- Ende: das nächste Level ist spielbar (Zustand `play`), beim Finale die Bühne des Epilogs, beim Prolog das Angebot,
  beim Epilog die Knöpfe am Ende («Zum Menü»).
- Spätere Tickets vergleichen **netto** aus demselben Aufruf.

## Ergebnis (netto, Sekunden)

| Abschnitt | Desktop | Handy hoch |
|---|---:|---:|
| Menü → Prolog bis zum Angebot | 28,09 | 28,05 |
| Einstieg in den Bergwald (nach «Gleich los») | 7,56 | 7,65 |
| Einstieg beim Fortsetzen (Sterne, `--finale`) | 5,99 | 5,93 |
| Reise in Welt 2 (Meer) | 13,15 | 13,24 |
| Reise in Welt 3 (Wüste) | 13,19 | 13,19 |
| Reise in Welt 4 (Vulkan) | 13,28 | 13,39 |
| Reise in Welt 5 (Planeten) | 13,18 | 13,66 |
| Reise in Welt 6 (Sterne) | 13,29 | 13,35 |
| Finale (Level 60 → Epilog), `--ganz` | 14,00 | 14,01 |
| Finale (Level 60 → Epilog), `--finale` | 14,00 | 14,31 |
| Epilog bis «Zum Menü» | 13,85 | 13,59 |
| Neuladen → «Weiter» (Wüste 26, ohne Einstieg) | 2,23 | 1,88 |

Eine Reise dauert also heute gut 13,2 s, das Finale 14,0 s (ohne Tippen), der Einstieg in den Bergwald 7,6 s und der
Einstieg beim Fortsetzen 6,0 s. Die Dauern streuen zwischen Desktop, Handy und den Läufen um wenige Zehntel; einzelne
lange Bilder (Handy) verlängern einen Abschnitt um bis zu 0,5 s.

## Bildzeiten

- **Desktop:** in beiden Abläufen keine Lücke über 100 ms (längste 50 ms), Mittel 16,7 ms.
- **Handy hoch:** schon heute einzelne Lücken über 100 ms, die die Probe als Fehler meldet: Prolog 310 ms, Einstieg
  Bergwald 117 ms, Reise ins Meer 100 ms, in den Vulkan 150 ms, zu den Planeten 501 ms; im Lauf mit `--finale` das
  Finale 234 ms (zweimal über 100 ms). Mittel 16,7–17,5 ms.
- **Ein erster Desktop-Lauf** (vor der Korrektur, wie Bilder der Probe abgezogen werden; seine Dauern sind darum nicht
  verwendet) hatte in der Reise in den Vulkan drei Lücken (längste 221 ms, beim Laden des Vulkans) und in der Reise zu
  den Sternen eine (109 ms). Die Lücken hängen also vom Lauf ab (Laden der Himmel, Grafikprozess); wer nach dem Umbau
  Lücken über 100 ms sieht, vergleicht mit diesen Werten und lässt den Lauf im Zweifel ein zweites Mal laufen.

## Einzelwerte

Desktop, `--ganz` (Probe bestanden):

| Abschnitt | Dauer | Tippen | Bilder der Probe | netto | Bilder | längste Lücke (ms) | > 50 ms | > 100 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Menü → Prolog bis zum Angebot | 29,76 | 1,67 | 0 | 28,09 | 1821 | 25 | 0 | 0 |
| Gleich los → Einstieg Bergwald | 7,56 | 0 | 0 | 7,56 | 458 | 33 | 0 | 0 |
| Reise in Welt 2 (Meer) | 13,15 | 0 | 0 | 13,15 | 797 | 50 | 0 | 0 |
| Reise in Welt 3 (Wüste) | 13,19 | 0 | 0 | 13,19 | 796 | 19 | 0 | 0 |
| Neuladen → Weiter (Wüste 26) | 2,23 | 0 | 0 | 2,23 | 136 | 18 | 0 | 0 |
| Reise in Welt 4 (Vulkan) | 13,28 | 0 | 0 | 13,28 | 800 | 18 | 0 | 0 |
| Reise in Welt 5 (Planeten) | 13,18 | 0 | 0 | 13,18 | 798 | 19 | 0 | 0 |
| Reise in Welt 6 (Sterne) | 13,29 | 0 | 0 | 13,29 | 805 | 18 | 0 | 0 |
| Finale (Level 60 → Epilog) | 17,46 | 3,47 | 0 | 14,00 | 1054 | 18 | 0 | 0 |
| Epilog bis «Zum Menü» | 15,10 | 1,25 | 0 | 13,85 | 924 | 18 | 0 | 0 |
| Epilog → Menü | – | – | – | – | 134 | 51 | 1 | 0 |

Handy hoch, `--ganz --handy` (Probe meldet die fünf Lücken oben):

| Abschnitt | Dauer | Tippen | Bilder der Probe | netto | Bilder | längste Lücke (ms) | > 50 ms | > 100 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Menü → Prolog bis zum Angebot | 29,87 | 1,82 | 0 | 28,05 | 1785 | 310 | 6 | 1 |
| Gleich los → Einstieg Bergwald | 8,46 | 0 | 0,82 | 7,65 | 448 | 117 | 2 | 1 |
| Reise in Welt 2 (Meer) | 14,12 | 0 | 0,88 | 13,24 | 783 | 100 | 3 | 1 |
| Reise in Welt 3 (Wüste) | 13,61 | 0 | 0,42 | 13,19 | 796 | 50 | 0 | 0 |
| Neuladen → Weiter (Wüste 26) | 1,88 | 0 | 0 | 1,88 | 114 | 37 | 0 | 0 |
| Reise in Welt 4 (Vulkan) | 13,85 | 0 | 0,47 | 13,39 | 802 | 150 | 1 | 1 |
| Reise in Welt 5 (Planeten) | 14,53 | 0 | 0,87 | 13,66 | 785 | 501 | 2 | 1 |
| Reise in Welt 6 (Sterne) | 14,46 | 0 | 1,11 | 13,35 | 798 | 67 | 2 | 0 |
| Finale (Level 60 → Epilog) | 19,37 | 5,37 | 0 | 14,01 | 1008 | 58 | 2 | 0 |
| Epilog bis «Zum Menü» | 15,60 | 1,77 | 0,25 | 13,59 | 914 | 47 | 0 | 0 |
| Epilog → Menü | – | – | – | – | 115 | 98 | 5 | 0 |

`--finale leicht` (Desktop bestanden; Handy meldet die Lücken im Finale):

| Abschnitt | Bildschirm | Dauer | Tippen | Bilder der Probe | netto | längste Lücke (ms) | > 100 ms |
|---|---|---:|---:|---:|---:|---:|---:|
| Weiter → Einstieg in die Sterne (Fortsetzen) | Desktop | 5,99 | 0 | 0 | 5,99 | 83 | 0 |
| Finale (Level 60 → Epilog) | Desktop | 17,20 | 3,20 | 0 | 14,00 | 18 | 0 |
| Weiter → Einstieg in die Sterne (Fortsetzen) | Handy | 6,33 | 0 | 0,40 | 5,93 | 66 | 0 |
| Finale (Level 60 → Epilog) | Handy | 17,46 | 3,15 | 0 | 14,31 | 234 | 2 |
