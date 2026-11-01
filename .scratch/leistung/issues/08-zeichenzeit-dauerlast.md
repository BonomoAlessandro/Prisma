# 08: Zeichenzeit ohne Halt messen (Dauerlast) und auf dem Poco zerlegen

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Ein Mass für die Zeichenzeit, das auf dem Poco (ohne `EXT_disjoint_timer_query_webgl2`) die
**GPU-Arbeit je Bild** abbildet und nicht die Wartezeit der Pipeline. Dazu eine Zerlegung nach Durchgängen, die auf dem
Poco selbst läuft. Ohne dieses Mass lässt sich die 8-ms-Marge der Spec nicht beurteilen (Messrunde 07). Optisch und im
Spiel ohne `?perf` ändert sich nichts.

**Befund aus 07 (Messwerte unter `## Comments` von 07):** Das heutige Ersatzmass (Beginn `frame()` bis nach einem
1-Pixel-`readPixels`, jedes 10. Bild) überschätzt die Zeichenzeit um ein Mehrfaches:

- Auf dem Poco lief das Spiel mit 60 gezeichneten Bildern/s und p95 16,6 ms (Einstieg, Reise). Die GPU schafft also
  im Mittel ein Bild in unter 16,6 ms. Das Ersatzmass zeigte dort p95 31–59 ms. Es misst die CPU-Zeit von `frame()`
  (Poco p95 7–11 ms), den Weg zum Grafikprozess und zurück und **alles, was vorher schon in der Warteschlange lag**:
  frühere Bilder, Uploads in Stücken (Menü 57,7 ms, während der Himmel schärft), das Zusammensetzen der Seite.
- Auf der T2000 im selben Bild verglichen (Handy-Emulation 786 × 1746, Level, ungedrosselt): Ersatzmass Median 11–18,
  p95 13–26 ms; GPU-Zeit desselben Bilds (Timer) 5,8–8,5 ms; **Dauerlast** (20 Bilder hintereinander in einer Aufgabe,
  zwischen zwei `readPixels`, Zeit je Bild) 3,3–5,5 ms. Ersatzmass p95 / Dauerlast = 2,9–6,6. Desktop (1536 × 729)
  ebenso: Ersatzmass 7,5–10,3 / GPU 3,4–4,9 / Dauerlast 3,1–4,8 ms.
- Auf dem Adreno (Kachel-GPU) ist der Halt eher noch teurer: `readPixels` erzwingt das Auflösen aller Kacheln und
  leert die Pipeline; die GPU taktet bei einem Bild zwischen Pausen tief.
- `fenceSync`/`getSyncParameter` ohne Warten taugt nicht als Mass: Chrome aktualisiert den Zustand erst nach einer
  Rückkehr in die Ereignisschleife; gemessen 6–20 ms, also nur «fertig vor dem nächsten Bild ja/nein».

**Vorschlag:**

- [ ] **Dauerlast-Mass** im Referenzdurchlauf, wenn die Timer-Erweiterung fehlt (bzw. mit `?ersatzmass`): An festen,
      ruhigen Messpunkten (Menü still, erstes Level nach 3 s Ruhe, Level nach der Reise) einmal `readPixels` (Pipeline
      leer), dann K = 20 Bilder hintereinander (`renderReflection` + `composer.render`) in einer Aufgabe, dann wieder
      `readPixels`; Zeit / K = Zeichenzeit je Bild bei voll hochgetakteter GPU. Je Messpunkt 5 Wiederholungen, Median.
      Danach ein normales Bild, damit auf dem Schirm nichts Halbes steht. Die CPU-Zeit je Bild der Schleife (ohne
      Warten) mitschreiben: Liegt sie nahe an der Zeit je Bild, ist die Probe CPU-gebunden und die GPU-Zeit höchstens
      so gross (Karte vermerkt das). Die Bildabstände der Probe (etwa 0,1–0,3 s) zählen nicht zu den sichtbaren.
- [ ] **Zerlegung durch Weglassen** am selben Messpunkt: dieselbe Dauerlast ohne Spiegelung (`QUALITY.reflections`),
      ohne Bloom (`bloomPass.enabled`), ohne das Netz des Panoramas, ohne Pinsel (Strand). Die Differenz zum Ganzen ist
      der Anteil des Teils. Am Ende alles zurück und ein normales Bild. Auf der T2000 gegen die GPU-Zeit je Durchgang
      (Timer) prüfen, dass die Differenzen stimmen (Zahlen aus 07 als Referenz, siehe unten).
- [ ] Das alte Ersatzmass (`readPixels` jedes 10. Bild) entfällt; damit fällt auch der Sockel weg, den
      `adaptiveResolution.skip = 2` abfangen musste. `adaptiveResolution` darf die Probe nicht werten (`skip`, wie bei
      `wake()`).
- [ ] **Karte:** Zeile «Zeichenzeit» nennt das Mass («Dauerlast, K = 20, Median aus 5»). Neue Zeilen «Zeichnen
      (Dauerlast)» je Messpunkt mit ganz / ohne Spiegelung / ohne Bloom / ohne Netz / ohne Pinsel und CPU je Bild.
      Die Spalte «Zeichn» der Abschnitte bleibt nur, wo GPU-Zeit da ist (Desktop); sonst «–». Urteil
      «Zeichnen ≤ 8 ms» aus der Dauerlast «ganz».
- [ ] **«gez/s» ruhig:** Je Abschnitt zusätzlich die gezeichneten Bilder/s ohne laufende Tweens und ohne
      `skyTheme.moving` («ruhig»), damit das Menü nicht mehr wie in 07 mit 31/s erschrickt (siehe 07: Das sind die
      Fahrt des Blicks mit 60/s und das Einblenden des Himmels mit 30/s; still sind es 10/s).
- [ ] Probe `tests/leistung-probe.mjs --ersatzmass` prüft die neuen Zeilen; Karte auf dem Handy weiterhin ohne
      seitliches Wischen.
- [ ] Messung auf der T2000 (Fenster, Desktop und Handy-Emulation ungedrosselt): Dauerlast und Zerlegung gegen die
      GPU-Zeit (Timer) desselben Messpunkts; Abweichung je Teil höchstens 1 ms bzw. 20 %.
- [ ] Tests grün, Review des Diffs, Commit auf `feature/leistung`.

**Abnahmekriterium:** Auf der T2000 liegt die Dauerlast «ganz» innerhalb von 25 % der GPU-Zeit (Timer) bei voller
Last, die Zerlegung trifft die Anteile der Timer-Messung je Durchgang auf 1 ms. Der Referenzdurchlauf zeigt auf dem
Desktop und in der Handy-Emulation `adaptiv 1.00, Umbauten 0` (Emulation ungedrosselt), sichtbar ändert sich nichts.
Auf dem Poco liefert der nächste Handy-Durchlauf die Zahlen für Ticket 11.

**Hinweis für den Koordinator:** Ticket 11 braucht die Dauerlast-Zahlen vom Poco. Entweder ein zusätzlicher kurzer
Handy-Durchlauf nach 08 (nur der Referenzdurchlauf, «2b»), oder 11 entscheidet mit den Zahlen der Schlussabnahme
(dann ohne Gewissheit, ob die Marge hält). Empfehlung: Durchlauf 2b, er kostet den Nutzer etwa 3 Minuten.

## Comments
