# 01: Ruhe-Bildrate im Level

**Spec:** ../spec.md

**Status:** ready-for-agent

**What to build:** Im Level zeichnet das Spiel heute stetig 60 Bilder/s, auch wenn der Spieler nur überlegt (ADR 0008).
Neu senkt es in **Ruhe** die Bildrate, etwa auf 30, und kehrt bei jeder Eingabe oder Animation **sofort** auf 60
zurück. Zunächst nur als Schalter `?ruhetakt=<n>` (z. B. 30 oder 20). Ohne den Schalter bleibt alles wie heute. Den
Standard entscheidet der Nutzer nach seinem Test auf dem Poco und einer Messung am Akku.

- [x] **Ruhe** heisst: im Level (`flow.state === 'play'`, nicht Menü/Übersicht/Geschichte/Bühne), seit mindestens etwa
      1,5 s keine Eingabe (pointerdown/move/up, Rad, Tasten, Touch), keine laufende Drehung, kein Wackeln, keine Feier,
      kein Herauswachsen oder Überblenden, keine Fahrt der Kamera nach einer Eingabe (Ziehen, Zoom, Nachlaufen), kein
      Strahl, der gerade wächst, kein Wechsel der Führung (`fuehrung.wechselt`, Lichtkegel, der aufwächst). Das Schweben
      der Kamera, das Fliessen der Strahlen und das Drehen der Ziele zählen **nicht** als Bewegung (das ist die Ruhe).
      Im Zweifel lieber 60: Lieber zu selten sparen als ein stufiges Bild bei etwas, das man anschaut.
- [x] **Sofort zurück:** Die erste Eingabe nach der Ruhe wird im nächsten Bildschirmbild mit 60 gezeichnet, nicht erst
      im nächsten 30er-Takt. Hover auf dem Desktop und der Druck auf ein Element zählen als Eingabe.
- [x] Gleichmässiger Takt wie heute über `frameRate.teiler` (jedes k-te Bildschirmbild, 120 Hz → 4, 60 Hz → 2).
- [x] Alle Animationen laufen zeitbasiert weiter (gleiches Tempo bei 30 wie bei 60). Prüfen, ob irgendwo je Bild statt
      je Zeit gerechnet wird.
- [x] Die adaptive Auflösung wertet 30er-Bilder nicht als zu langsam (`frameRate.gap`), und der Wechsel 30 ↔ 60 löst
      keine Umbauten aus.
- [x] Die Leistungsanzeige (Taste F, `?perf`) zeigt das Ziel mit dem Grund «Ruhe», das Messwerkzeug zählt richtig.
- [x] `?takt=30` bleibt, wie es ist. Die Geschichte bleibt immer bei 60 (Vorgabe des Nutzers). Menü und Übersicht
      bleiben bei 10, hinter der Bühne bei 30.
- [x] **Tests:** Logiktest der Entscheidung (fps, grund) mit und ohne Schalter. Eine Browser-Probe, Desktop und Handy:
      Mit `?ruhetakt=30` gezeichnete Bilder/s im ruhenden Level ≈ 30; nach einem Tippen aufs Brett ist der nächste
      Abstand ≈ ein Bildschirmbild und die Rate sofort 60. Bleibt etwas, das man anschaut, bei 60 (Drehung, Feier)?
      Ohne Schalter unverändert 60. Bestehende Proben und Golden bleiben grün.
- [x] `APP_VERSION` in `index.html` und `sw.js` gleich auf `2026-11-15 energie-1`.
- [x] README (Abschnitt Leistung, Bildrate) und `CONTEXT.md`, falls dort Begriffe dazu stehen: Ruhe-Bildrate.

## Hinweise

- `frameRate` in `index.html` (um `const frameRate`, `fps()`, `grund()`, `due`, `teiler`), `sceneLoop`
  (`wake`, `ambient`, `pending`), `adaptiveResolution.tick(gap)`, `perfHud`, `leistung` (Messwerkzeug).
  Eingaben wecken heute schon die Schleife (`sceneLoop.wake`). Das ist eine gute Stelle, um den Zeitpunkt der letzten
  Eingabe zu merken.
- `sceneLoop.pending()` kennt schon vieles, was «es bewegt sich etwas» heisst (Tweens, Einblenden, Kamera). Verwende
  es, statt eine zweite Liste zu pflegen, wo es passt.
- Messen auf dem Poco macht der Koordinator. Du misst im Browser des Rechners.

## Notizen der Umsetzung (15.11.2026)

- Ruhe zusätzlich nicht, solange ein Himmel Bewegung zeigt, der das Auge folgt (`skyTheme.fluid`, wieder eingeführt:
  Fische am Strand, Glühwürmchen in Wald und Dorf, Funken am Vulkan, Planeten; Ticket 17 der Leistung). Mit dem
  Schalter ruht das Level darum nur in der Wüste und unter der Milchstrasse. `?ruhehimmel` zählt diese Himmel zum
  Vergleich als Ruhe (für die Messung am Akku).
- Ebenso keine Ruhe: Finger oder Taste unten, Hand der Führung, Lichtwelle samt Nachwirkung (`SHOCK_REST_S`). Eine
  Bewegung zählt wie eine Eingabe (danach noch 1,5 s voller Takt).
- `?ruhetakt` ab 20 (`MAX_DT`). ADR 0009. Probe `tests/ruhetakt-probe.mjs`.
