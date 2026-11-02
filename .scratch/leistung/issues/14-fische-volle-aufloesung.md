# 14: Fische auf dem Handy ohne Treppen

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** resolved

**What to build:** Die Fische unter der Wasseroberfläche (Welt Strand) sehen auf dem Handy nicht mehr pixelig aus.
Beobachtung des Nutzers im Handy-Durchlauf 2: «bei den Fischen nicht ganz sicher, ob sie ein wenig pixelig waren».

**Ursache (Diagnose in 07, «Beobachtungen Handy-Durchlauf 2»):** `waterSurface` zeichnet die Unterwasser-Ansicht auf
dem Handy in ein halb so grosses Bild ohne MSAA (`under.target`, `IS_MOBILE ? 0.5`, seit `7c78158` vom 15.10.). Auf dem
Poco deckt ein Pixel davon 2,75 × 2,75 Bildschirmpixel, die Kanten werden zu Treppen. Alt, nicht durch dieses Vorhaben
(01c und `c42423e` pixelgleich). Gegenprobe mit vollem `under.target`: glatte Kanten, durchgehende Schwanzlinien, der
Rest des Bildes gleich (0,06 % der Pixel). Bilder: `scratchpad/07-beob/out/fische-*.png`.

**Vorschlag:** `under.target` auf dem Handy in voller Grösse; wenn die Kosten zu hoch sind, 0,75 oder MSAA – Massstab
ist, dass bei normalem Abstand auf dem Poco keine Treppen zu sehen sind.

- [x] Kosten messen: Zeichenzeit (Mass aus Ticket 08, sonst GPU-Zeit auf der T2000 in Handy-Emulation) in «Spiel n.
      Reise» (Strand) vorher/nachher.
- [x] Ausschnitt 3× vergrössert in Handy-Emulation: keine Treppen an Fischkanten, Schwanzlinien durchgehend.
- [x] Zeichenzeit «Spiel n. Reise» höchstens 0,5 ms mehr; Karte weiter `adaptiv 1.00, Umbauten 0`.
- [ ] Tests grün, Review, Commit auf `feature/leistung`.

## Comments

**Umsetzung, 01.11.2026, Branch `leistung/14-fische` ab `eb8105e`:** `under.target` in `waterSurface` ist jetzt auch
auf dem Handy so gross wie das Bild, in das gerade gezeichnet wird (`IS_MOBILE ? 0.5` entfällt). MSAA bleibt auf dem
Handy aus: Das Hauptbild hat selbst keins (`QUALITY.msaa: 0`), die Fische sind mit voller Grösse so glatt wie der Rest
der Szene. 0,75 war nicht nötig, die Kosten liegen unter der Grenze.

Gemessen im echten Chrome mit Fenster auf der Quadro T2000, Handy-Emulation 393 × 873, DPR 2,75, Android-Kennung,
ungedrosselt. Vorher = `eb8105e` (Kopie im Scratchpad), nachher = dieser Branch, Läufe abwechselnd. Gerendert wird mit
786 × 1746 (Pixelverhältnis 2), `under.target` vorher 393 × 873, nachher 786 × 1746.

- **Nur der Unterwasser-Pass** (`plane.onBeforeRender`: Löschen und Fische ins `under.target`, einzeln in einer
  `TIME_ELAPSED`-Abfrage, Strand `?sky=beach`, Level 0, je 300 Mal):

  | | Mittel | p50 | p95 |
  |---|---|---|---|
  | vorher (2 Läufe) | 0,13 / 0,10 ms | 0,07 / 0,06 ms | 0,27 / 0,27 ms |
  | nachher (2 Läufe) | 0,28 / 0,28 ms | 0,19 / 0,18 ms | 0,44 / 0,44 ms |

  **Mehrkosten ≈ 0,16 ms** im Mittel (p95 +0,17 ms).
- **Ganzes Bild im Spiel am Strand** (GPU-Zeit je gezeichnetem Bild über 15 s, rund 450 Bilder je Lauf, 5 Läufe je
  Stand): Mittel vorher 10,63 / 10,25 / 10,63 / 11,10 / 10,92 ms (Schnitt 10,70), nachher 10,74 / 10,83 / 10,65 /
  10,49 / 10,60 ms (Schnitt 10,66). Der Unterschied geht in der Streuung von Lauf zu Lauf (±0,4 ms) unter.
- **Referenzdurchlauf** (`tests/leistung-probe.mjs --handy --fenster`, GPU-Zeit, je 4 Läufe), Spalte «Zeichn» (p95):

  | | Lauf 1 | 2 | 3 | 4 | Schnitt |
  |---|---|---|---|---|---|
  | «Spiel n. Reise» vorher | 14,3 | 13,6 | 14,4 | 15,5 | 14,45 |
  | «Spiel n. Reise» nachher | 15,0 | 14,9 | 14,8 | 14,2 | 14,73 |
  | «Spiel» (Wald, ohne Fische) vorher | 14,9 | 13,4 | 13,2 | 13,6 | 13,78 |
  | «Spiel» (Wald, ohne Fische) nachher | 14,2 | 15,3 | 14,5 | 14,7 | 14,68 |

  Im Schnitt +0,28 ms in «Spiel n. Reise». Das p95 aus Fächern zu 0,1 ms über rund 220 gezeichnete Bilder streut je
  Lauf um ±1 ms: Im Wald, wo der Pass gar nicht läuft, liegt «nachher» sogar 0,9 ms höher. Massgebend ist darum die
  Messung des Passes allein, **+0,16 ms, unter der Grenze von 0,5 ms**.
- Karte in allen 8 Läufen `Rendern 786×1746 (Pixelverhältnis 2.00, adaptiv 1.00, Umbauten 0)`, «Referenzdurchlauf in
  Ordnung».

Bilder (Strand `?t=12`, `zeige(0)`, gleiche Stelle wie die Gegenprobe aus 07, Ausschnitt 3× vergrössert mit nächstem
Nachbarn, links vorher, rechts nachher), im Scratchpad des Agenten unter `14-fische/out/`
(`C:\Users\admin\AppData\Local\Temp\claude\C--workspace-Prisma\8b5e7724-0d5f-485c-bc5c-024f93a38529\scratchpad\14-fische\out\`):
- `fische-zoom3-vorher-nachher.png` (Schwarm blauer Fische, Ausschnitt 380/2060, 300 × 240): vorher Treppen an den
  Kanten und Schwanzlinien in Punkten, nachher glatte Kanten und durchgehende Schwanzlinien.
- `fische-zoom3-rand-vorher-nachher.png` (violette Fische am rechten Rand): vorher gezackter Umriss, nachher glatt.
- `fische-vorher.png`, `fische-nachher.png` (ganze Bilder). Unterschied im ganzen Bild 0,06 % der Pixel > 8, im
  Ausschnitt der Fische 1,8 % (nur die Fische).

Skripte dort: `gpu.mjs` (GPU-Zeit ganzes Bild und Pass allein), `fische.mjs`, `vergleich.mjs`; Karten und Protokolle
als `probe-vorher-*.log`, `probe-nachher-*.log`, `gpu-1.txt`, `gpu-2.txt`.

Tests: `logic` (2033), `golden`, `screenshot` (Konsole ohne Meldungen), `leistung-probe --handy` (headless mit
`GPU=1`) und `--handy --fenster` grün. `leistung-probe --handy` headless ohne `GPU=1` (SwiftShader) bricht mit
«Zeitüberschreitung: erstes Level» ab, auf `eb8105e` genauso: nicht durch dieses Ticket.

Offen: Abnahme auf dem Poco (Fische bei normalem Abstand nicht pixelig, Karte `adaptiv 1.00, Umbauten 0`) im nächsten
Handy-Durchlauf.

**Review (Koordinator, 01.11.2026):** Diff in `waterSurface` geprüft: `under.target` folgt weiter der Grösse des
Ziels (also auch einer allfälligen Absenkung), ganzzahlig durch die Quelle (Render-Target bzw. Drawing Buffer), MSAA auf
dem Handy wie das Hauptbild aus. Kosten +0,16 ms (Pass allein), Bilder ohne Treppen. Abnahme auf dem Poco im
Handy-Durchlauf 2b. Der Abbruch von `leistung-probe --handy` headless ohne GPU besteht schon auf `eb8105e`.
