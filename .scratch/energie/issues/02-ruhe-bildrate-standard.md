# 02: Ruhe-Bildrate als Standard

**Spec:** ../spec.md

**Status:** ready-for-agent

**What to build:** Der Nutzer hat entschieden (15.11.2026, nach Test auf dem Poco und Akkuvergleich in Ticket 01):
Die Ruhe-Bildrate wird **Standard**, mit 30 Bildern/s in Ruhe, **in allen Welten**, also auch mit Himmeln mit
Bewegung (bisher nur mit `?ruhehimmel`). Gemessen spart das im Level 30–35 % Strom, und in keiner Welt wirkte etwas
stufig.

- [ ] Ohne Parameter: Ruhe mit 30 Bildern/s in jeder Welt. `skyTheme.fluid` hält die Bildrate nicht mehr bei 60.
      Entscheide, ob die Markierung bleibt, als Grund in der Anzeige oder für einen Schalter, oder ob sie entfällt.
      Toter Code soll nicht bleiben.
- [ ] Schalter zum Vergleichen: `?ruhetakt=60` (oder `aus`) schaltet die Ruhe-Bildrate aus, also stetig 60 wie
      bisher. `?ruhetakt=<n>` ab 20 bleibt. `?ruhehimmel` entfällt oder wird zum Gegenteil (`?ruhehimmel=aus`: Himmel
      mit Bewegung bei 60). Halte es einfach und dokumentiere es.
- [ ] Desktop: Das gilt auch dort (Strom am Laptop, weniger Lüfter). Hover weckt wie bisher.
- [ ] Alles andere bleibt: Geschichte 60, Menü und Übersicht 10, hinter der Bühne 30, `?takt=30`, sofort zurück auf 60
      bei Eingabe oder Animation.
- [ ] ADR 0009 nachführen (Entscheid des Nutzers, Messung), README Abschnitt Leistung, Leistungsanzeige.
- [ ] Tests: Logiktests und `tests/ruhetakt-probe.mjs` auf den neuen Standard umstellen (ohne Parameter Ruhe 30, auch im
      Wald; mit `?ruhetakt=60` stetig 60). `leerlauf-probe`, Golden und Dorf-Probe bleiben grün; Proben, die stetige 60
      im Level voraussetzen, passend umstellen (eher mit `?ruhetakt=60`, wenn sie Bildzeiten messen).
- [ ] `APP_VERSION` in `index.html` und `sw.js` gleich auf `2026-11-15 energie-2`.
