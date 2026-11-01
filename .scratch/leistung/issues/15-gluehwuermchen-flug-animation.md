# 15: Flug der Glühwürmchen ohne Arbeit pro Bild

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Der Flug der Glühwürmchen in den Wald (Prolog, Einstellung 6, «… tragen das Licht in den Wald»)
läuft auf dem Poco ohne Stocken. Beobachtung des Nutzers im Handy-Durchlauf 2: Glühwürmchen «super, abgesehen von einem
kurzen Moment, als sie in den Wald flogen».

**Ursache (Diagnose in 07):** Der Flug läuft als JavaScript pro Bild. Seit Ticket 04 ist jedes Glühwürmchen ein eigener
Layer; das kostet pro Bild Style, Paint und Layerize. Handy-Emulation 4×: Hauptthread in Einstellung 6 je Bild p50 29 ms,
p95 53 ms, Layerize p50 6,3 ms (Einstellung 1: 14 / 28 ms ohne Layerize); beim Einparken Ausreisser bis 133 ms, passt
zu 49,5 ms bei 50,4 s auf dem Poco. Das Laden in den Pausen ist es nicht.

**Vorschlag:** Den Flug als vorab berechnete Web Animation abspielen, wie die Kamerafahrt in Ticket 04 (Compositor statt
Hauptthread). Optik gleich: dieselben Bahnen, dasselbe Leuchten, nebeneinander verglichen.

- [ ] Layerize p95 < 1 ms im Flug, kein Bildabstand über 50 ms (Handy-Emulation 4×).
- [ ] Poco: max ≤ 33 ms in Einstellung 6 (Handy-Durchlauf 3).
- [ ] Vergleich nebeneinander vorher/nachher: kein Unterschied bei normalem Abstand; reduzierte Bewegung, Überspringen,
      Tempo, Epilog weiter korrekt.
- [ ] Tests grün (`geschichte-probe` Desktop und `--handy`), Review, Commit auf `feature/leistung`.

## Comments
