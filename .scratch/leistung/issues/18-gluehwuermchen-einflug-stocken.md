# 18: Glühwürmchen ohne Stocken, Bühne ohne fehlenden Hintergrund

**Spec:** ../spec.md

**Blocked by:** 15 (Flug als Web Animation), 16 (Bühne in Abschnitten, Linien)

**Status:** ready-for-agent

**What to build:** Zwei Befunde des Nutzers auf dem Poco F4 GT:

1. Handy-Durchlauf 3 (`leistung-08`): «Die Glühwürmchen stocken noch ein wenig beim Einflug in den Wald.»
   (Einstellung 6, «Denn Licht …», Fahrt 5,5 s.) Der Flug läuft seit Ticket 15 als Web Animation im Compositor; die
   rAF-Messung der Karte sieht ein Stocken dort womöglich nicht.
2. Nachtrag (`leistung-08d`, höherer Vorrang, weil sichtbar): «In der Szene, als die Glühwürmchen zu Noa fliegen,
   fehlten Teile des Hintergrunds.» (Einstellung 5, «Da blinkt …», Fahrt 4 s.)

Karte Durchlauf 3, Prolog: Hänger 106 ms bei 15,9 s («FrameRequestCallback → frame: Script 5 ms, Rendern 8 ms»),
66 ms bei 22,9 s, 69 ms bei 28,2 s («ohne Script, Rendern 63 ms»); Startbildschirm 101 ms bei 6,9 s (ohne Script).
Karte 08d: Prolog p95 16,6 ms, max 65,7 ms bei 29,5 s, Hänger 64 ms bei 37,6 s (`DIV#story.onclick`, Script 44 ms).

**Vorgehen:** Trace im Fenster mit Handy-Emulation und Drossel 4: Compositor- und Raster-Ereignisse, Style/Layout im
Hauptthread während des Flugs, Animationen, die in den Hauptthread fallen, Ebenenwechsel und Rasterung der Wald-Ebene
beim Einflug, Tausch der Linien (`ruheNachHalt`, `.linie.aus`). Für den fehlenden Hintergrund dieselbe Szene mit
kleinem Budget der Grafik (`--force-gpu-mem-available-mb` 512, 384 und kleiner), Screencast-Einzelbilder, Vergleich mit
`leistung-07c` (`68640a5`).

- [ ] Ursache des fehlenden Hintergrunds belegt (Trace, Einzelbilder) und behoben, ohne die Optik zu ändern.
- [ ] Ursache des Stockens belegt und behoben, ohne die Optik zu ändern; Vorher/Nachher-Einzelbilder und Trace.
- [ ] Desktop und Handy auch mit `--force-gpu-mem-available-mb=512`: keine Ebene fehlt, kein Flackern.
- [ ] Tests grün: logic, golden, screenshot, `geschichte-probe --start` und `--handy`,
      `leistung-probe --fenster --handy --ersatzmass`; keine Warnung «Weckstelle fehlt».
- [ ] Poco (nächster Handy-Durchlauf): Einstellungen 5 und 6 ohne fehlenden Hintergrund, Glühwürmchen ruhig.

## Comments
