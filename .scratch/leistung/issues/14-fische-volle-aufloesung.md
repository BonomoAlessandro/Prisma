# 14: Fische auf dem Handy ohne Treppen

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Die Fische unter der Wasseroberfläche (Welt Strand) sehen auf dem Handy nicht mehr pixelig aus.
Beobachtung des Nutzers im Handy-Durchlauf 2: «bei den Fischen nicht ganz sicher, ob sie ein wenig pixelig waren».

**Ursache (Diagnose in 07, «Beobachtungen Handy-Durchlauf 2»):** `waterSurface` zeichnet die Unterwasser-Ansicht auf
dem Handy in ein halb so grosses Bild ohne MSAA (`under.target`, `IS_MOBILE ? 0.5`, seit `7c78158` vom 15.10.). Auf dem
Poco deckt ein Pixel davon 2,75 × 2,75 Bildschirmpixel, die Kanten werden zu Treppen. Alt, nicht durch dieses Vorhaben
(01c und `c42423e` pixelgleich). Gegenprobe mit vollem `under.target`: glatte Kanten, durchgehende Schwanzlinien, der
Rest des Bildes gleich (0,06 % der Pixel). Bilder: `scratchpad/07-beob/out/fische-*.png`.

**Vorschlag:** `under.target` auf dem Handy in voller Grösse; wenn die Kosten zu hoch sind, 0,75 oder MSAA – Massstab
ist, dass bei normalem Abstand auf dem Poco keine Treppen zu sehen sind.

- [ ] Kosten messen: Zeichenzeit (Mass aus Ticket 08, sonst GPU-Zeit auf der T2000 in Handy-Emulation) in «Spiel n.
      Reise» (Strand) vorher/nachher.
- [ ] Ausschnitt 3× vergrössert in Handy-Emulation: keine Treppen an Fischkanten, Schwanzlinien durchgehend.
- [ ] Zeichenzeit «Spiel n. Reise» höchstens 0,5 ms mehr; Karte weiter `adaptiv 1.00, Umbauten 0`.
- [ ] Tests grün, Review, Commit auf `feature/leistung`.

## Comments
