# 02: Ruhe-Bildrate als Standard

**Spec:** ../spec.md

**Status:** ready-for-human (umgesetzt, wartet auf Review)

**What to build:** Der Nutzer hat entschieden (15.11.2026, nach Test auf dem Poco und Akkuvergleich in Ticket 01):
Die Ruhe-Bildrate wird **Standard**, mit 30 Bildern/s in Ruhe, **in allen Welten**, also auch mit Himmeln mit
Bewegung (bisher nur mit `?ruhehimmel`). Gemessen spart das im Level 30–35 % Strom, und in keiner Welt wirkte etwas
stufig.

- [x] Ohne Parameter: Ruhe mit 30 Bildern/s in jeder Welt. `skyTheme.fluid` hält die Bildrate nicht mehr bei 60.
      Entscheide, ob die Markierung bleibt, als Grund in der Anzeige oder für einen Schalter, oder ob sie entfällt.
      Toter Code soll nicht bleiben.
- [x] Schalter zum Vergleichen: `?ruhetakt=60` (oder `aus`) schaltet die Ruhe-Bildrate aus, also stetig 60 wie
      bisher. `?ruhetakt=<n>` ab 20 bleibt. `?ruhehimmel` entfällt oder wird zum Gegenteil (`?ruhehimmel=aus`: Himmel
      mit Bewegung bei 60). Halte es einfach und dokumentiere es.
- [x] Desktop: Das gilt auch dort (Strom am Laptop, weniger Lüfter). Hover weckt wie bisher.
- [x] Alles andere bleibt: Geschichte 60, Menü und Übersicht 10, hinter der Bühne 30, `?takt=30`, sofort zurück auf 60
      bei Eingabe oder Animation.
- [x] ADR 0009 nachführen (Entscheid des Nutzers, Messung), README Abschnitt Leistung, Leistungsanzeige.
- [x] Tests: Logiktests und `tests/ruhetakt-probe.mjs` auf den neuen Standard umstellen (ohne Parameter Ruhe 30, auch im
      Wald; mit `?ruhetakt=60` stetig 60). `leerlauf-probe`, Golden und Dorf-Probe bleiben grün; Proben, die stetige 60
      im Level voraussetzen, passend umstellen (eher mit `?ruhetakt=60`, wenn sie Bildzeiten messen).
- [x] `APP_VERSION` in `index.html` und `sw.js` gleich auf `2026-11-15 energie-2`.

## Notizen der Umsetzung (15.11.2026)

- **Standard:** `RUHE_FPS = 30` im Logikblock. `ruhetaktAus` gibt ohne Parameter (oder bei unbrauchbarem Wert) 30 zurück,
  mit `?takt=30` null (zeichnet ohnehin 30). Die Ruhe gilt in jeder Welt, auf Handy und Desktop; was in Ruhe ist, ist
  sonst unverändert (Eingabe, Hover, Drehen, Feier, Führung, Lichtwelle, Kamerafahrt: sofort 60).
- **Schalter:** `?ruhetakt=aus` oder `?ruhetakt=60` (allgemein: nicht unter dem Takt des Spiels): Ruhe-Bildrate aus,
  stetig 60 wie unter ADR 0008. `?ruhetakt=<n>` ab 20 bleibt. Die Leistungsanzeige zeigt ohne Ruhe-Bildrate den Grund
  «Spiel (Ruhe aus)», sonst «Spiel» bzw. «Ruhe».
- **`fluid` entfällt** samt `?ruhehimmel`: Die Markierung diente nur der Ruhe-Bildrate (Planeten, Glühwürmchen, Funken
  an Vulkan und Lava, Fische; Getter in `createPanoramaSky` und `skyTheme`). Ein Grund in der Anzeige oder ein Schalter
  `?ruhehimmel=aus` brächte nichts, was der Nutzer verlangt hat; die Rückkehr wäre in git (Ticket 01).
- ADR 0009 umbenannt in `0009-ruhe-bildrate.md` (Titel ohne «vorerst nur als Schalter», Verlauf mit Test und
  Akkuvergleich), ADR 0008 verweist darauf. README Leistung, Leistungsanzeige, Proben nachgeführt.
- **Proben:** `ruhetakt-probe` neu mit `ruhe` (Wüste ohne Parameter), `aus` (`?ruhetakt=60`), `wald` (ohne Parameter,
  Ruhe mit Glühwürmchen); dazu die Prüfung, dass die Auflösung beim Wechsel 30 ↔ 60 nicht sinkt (Vorschlag aus dem
  Review von 01). `leerlauf-probe` erwartet im Fenster in Ruhe `frameRate.ruheFps ?? spielFps`. Andere Proben messen
  Lücken zwischen rAF (Bildschirmbilder, unverändert im Takt) oder warten auf `__prisma.frames`; nichts weiter
  umzustellen.
- **Läufe:** `logic.test.mjs` grün, `golden.mjs` grün (842 Level). `ruhetakt-probe` Desktop und `--handy` OK (Ruhe
  28,3–28,7 Bilder/s bei 57,8 Hz, Soll 28,9, Grund «Ruhe», auch im Wald; Tippen: erstes Bild im nächsten
  Bildschirmbild, Ruhe wieder nach 1594–1616 ms; Drehen und Feier im vollen Takt; `?ruhetakt=60` stetig, «Spiel (Ruhe
  aus)»). `leerlauf-probe` headless, `--still`, `--handy` OK (Level in Ruhe 28,3 gez/s, Reaktion immer im nächsten
  Bild). `geschichte-probe --dorf --handy` bestanden. `--dorf` am Desktop: eine Lücke von 427 ms bei «Sehr schwer:
  Übersicht → Übung 3 wiederholen → Übung 4» (im Wald, Brett moss bauen); auf `feature/energie` 90d44f0 ebenso (389 ms),
  also nicht von diesem Ticket.
