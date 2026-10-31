# 05: Hall vorab berechnen

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Der erste Klick friert die Seite nicht mehr ein, und der Ton klingt genau gleich wie heute.

Heute baut `audio.unlock()` (`index.html` um 15097) beim ersten `pointerdown` die Impulsantwort für den Hall: 3,2 s
Stereo, etwa 307 000 `Math.pow`-Aufrufe auf dem Hauptthread. Laut PLAN.md:17 blockiert das 350–430 ms. Der erste Klick
ist oft «Klicken zum Starten», also genau der Übergang in den Prolog.

- [ ] Die Impulsantwort wird vorab berechnet, als rohe Float32Arrays unabhängig vom AudioContext. Das passiert in
      einem Worker oder in kleinen Stücken im Leerlauf, sobald der Startbildschirm ruhig ist. Beim Unlock wird nur noch
      der `AudioBuffer` aus den fertigen Daten gefüllt und an den Convolver gehängt. Die Abtastrate des Contexts
      beachten: Weicht sie von der Annahme ab, wird neu berechnet oder resampelt, ohne den Klang zu verändern.
- [ ] Bitgleich bzw. hörbar gleich: Die Kurve bleibt dieselbe. Ein Test vergleicht die vorab berechneten Daten mit der
      bisherigen Berechnung, vor dem Umbau als Referenz festgehalten.
- [ ] Klickt jemand, bevor die Vorabberechnung fertig ist, darf der Klick trotzdem nicht einfrieren. Dann startet der
      Ton ohne Hall, und der Hall wird weich dazugeblendet, sobald er bereit ist.
- [ ] Prüfen, was sonst noch in `unlock()` und beim ersten Ton teuer ist (Glitzer-Timer, Knoten-Aufbau), und mitnehmen,
      was auffällt.
- [ ] Laufende Kosten des Convolvers auf dem Audio-Thread notieren (Handy). Ändern nur in Ticket 07, falls die
      Messrunde ihn als Ursache zeigt.
- [ ] Messen: längster Frame beim ersten Klick vorher und nachher, ungedrosselt und gedrosselt. Ziel: kein Bild über
      33 ms.
- [ ] Tests grün, Review des Diffs, Commit auf `feature/leistung`. PLAN.md:17 nachführen.

## Comments
