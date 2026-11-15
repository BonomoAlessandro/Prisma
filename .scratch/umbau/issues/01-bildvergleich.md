# 01: Bildvergleich gegen die heutige `index.html`

**Spec:** ../spec.md

**Status:** needs-triage

**What to build:** Eine automatische Prüfung, die zeigt, dass das Spiel nach einem Schritt des Umbaus genau gleich
aussieht. Sie läuft noch gegen die heutige `index.html` und hält deren Bilder als Referenz fest, **bevor** irgendetwas
umgebaut wird. Ab Ticket 02 muss sie nach jedem Schritt grün sein; der Nutzer prüft nicht mehr von Hand.

- [ ] `tests/bildvergleich.mjs`: öffnet das Spiel in Chrome ohne Fenster (über `tools/chrome.mjs`) und nimmt eine feste
      Liste von Ansichten auf:
      - Startbildschirm, Menü mit den vier Graden, Übersicht, Einstellungen;
      - jede Welt der Geschichte (Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne) mit ihrem Himmel, je ein Level vor und
        nach dem Lösen;
      - jede Übung im Dorf mit Band, Lichtkegel und Hand, je ein Schritt;
      - je eine Szene aus Prolog, Reise und Epilog;
      - jedes Element mindestens einmal im Bild (Spiegel, Prisma, Filter, Kombinator, Block, farbige Quellen).
- [ ] Drei Grössen: Desktop 1280 × 800, Handy hochkant 390 × 844, Handy quer 844 × 390.
- [ ] **Gleiche Bilder bei jedem Lauf:** feste Zeit (`?t=`, setzt heute schon `Math.random` auf einen festen Samen,
      siehe `FIXED_TIME` in `index.html`), `?noadapt`, Rendern in Software (SwiftShader, wie `tools/chrome.mjs` ohne
      `gpu`), damit die Grafikkarte keine Rolle spielt. Bleibt trotzdem Zufall im Bild, einen Schalter nur für die
      Prüfung einbauen, der das Spiel sonst nicht ändert.
- [ ] Referenzbilder in `tests/bildvergleich/referenz/`. `--write` schreibt sie neu, aber nur bei einer bewussten
      Änderung des Aussehens (im Umbau nie).
- [ ] Vergleich mit kleiner Toleranz (Abweichung je Pixel und Anteil abweichender Pixel). Bei Rot werden das Bild, die
      Referenz und ein Differenzbild nach `tests/output/bildvergleich/` geschrieben.
- [ ] **Stabil:** Fünf Läufe hintereinander gegen dieselbe `index.html` sind alle grün. Die Toleranz so knapp wählen,
      dass eine Verschiebung um ein Pixel oder eine leicht andere Farbe auffällt; das mit einer absichtlich kleinen
      Änderung prüfen (z. B. eine Farbe um 2 % ändern, der Vergleich muss rot werden) und wieder zurücknehmen.
- [ ] Laufzeit messen und im README angeben; mit `tools/leise.sh` laufen lassen.
- [ ] README: Abschnitt «Tests» um den Bildvergleich ergänzen.

## Hinweise

- Die Proben (`tests/brett-probe.mjs`, `tests/geschichte-probe.mjs`, `tests/screenshot.mjs`) zeigen, wie man das
  Spiel steuert und Ansichten ansteuert (`?noadapt&nointro`, `?sky=`, `window.__prismaDebug`). Darauf aufbauen.
- Die URL wird später auf den Dev-Server bzw. `dist/` umgestellt (Ticket 02). Die Adresse darum an einer Stelle
  halten.
- Kein Umbau in diesem Ticket ausser dem Schalter für festen Zufall, falls nötig.

## Comments
