# 02: Ruhe-Bildrate als Standard

**Spec:** ../spec.md

**Status:** ready-for-human (umgesetzt und reviewt; wartet auf den Test des Nutzers)

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

## Comments

### Review (15.11.2026, unabhängiger Reviewer)

**Ergebnis:** bereit zum Mergen. Jeder Punkt des Tickets ist erfüllt, die Doku (README Leistung und Proben, ADR 0008
und 0009, Leistungsanzeige) stimmt mit dem Code.

**Läufe (f69c020, dazu 13e3a3d):** alle `tests/*.test.mjs` grün (logic 2063, beurteilung 206, ki-tester 84,
levelliste 54, geschichte 35, wuerfelliste 20, vorrat 18, hall 6; generator 31 über `leise.sh`); `golden.mjs` grün
(842 Level). `ruhetakt-probe` Desktop und `--handy` OK: Ruhe 30,1 Bilder/s bei 60,2 Hz, Grund «Ruhe», auch im Wald;
Tippen im nächsten Bildschirmbild, Ruhe wieder nach 1601/1614 ms; Drehen und Feier im vollen Takt; `?ruhetakt=60`
stetig 60 mit «Spiel (Ruhe aus)». `leerlauf-probe` headless und `--fenster` OK (Level in Ruhe 30 gez/s, Reaktion
9 × im nächsten Bild). `geschichte-probe --dorf --quer` und `--dorf-raender` bestanden.

**`fluid`:** vollständig entfernt (Planeten, Glühwürmchen, Lavasee, Feuernester, Fische, Getter in
`createPanoramaSky` und `skyTheme`, `?ruhehimmel`, Grund «Himmel mit Bewegung»). Die Module verlieren sonst nichts:
`userData.update` von Lava, Feuer und Fischen bleibt; nichts anderes las `fluid`. Übrig nur in ADR 0006/0008 und
Ticket 01 als Verlauf, richtig so.

**Randfälle geprüft:**
- `?takt=30`: `ruhetaktAus` gibt null, das Spiel stetig 30. Die Leistungsanzeige sagte dort «Spiel (Ruhe aus)»,
  obwohl niemand sie ausgeschaltet hat; **klein, behoben (13e3a3d)**: «Spiel», «Spiel (Ruhe aus)» nur, wenn der Takt
  des Spiels über `RUHE_FPS` liegt; Logiktest nachgeführt.
- `?t=`: Die Szene ruht ganz (`sceneLoop`), bevor die Ruhe nach 1,5 s greift; `shots.mjs` der KI-Tester weckt mit
  `wake(true)` (voller Takt) und zählt dann `__prisma.frames`, also weder langsamer noch flatterhaft.
- `?ruhetakt` unsinnig (`abc`, `0`, `-30`, leer, `Infinity`): Standard 30; `1e3`, `60`, `100`: aus; `aus` auch
  gross geschrieben. Dass `0` den Standard gibt und nicht «aus», ist dokumentiert («unbrauchbar»); vertretbar.
- Würfel: nichts Eigenes; das Nachdrehen der Kamera zählt über `cameraRig.settling` als Bewegung.
- Führung: Hand und Wechsel halten den vollen Takt (`bewegt` «Führung»); die Lichtkegel nach dem Vorzeigen gehen in
  Ruhe mit 30 mit, weil `platziere` in `animate` und damit im selben Bild wie das WebGL läuft; das Aufwachsen der
  Kegel und die Geste der Hand sind CSS und laufen unabhängig. Die Dorf-Proben bestanden.
- Menü, Übersicht, Geschichte, hinter der Bühne: `bildrate` unverändert (Ruhe nur mit flow `play`, nicht im Menü).

**Proben und Werkzeuge mit `__prisma.frames`:** nur `leerlauf-probe` (nachgeführt auf `ruheFps ?? spielFps`),
`geschichte-probe` (nur im Log) und `ki-tester/shots.mjs` (mit `?t=` und Weckruf, s. o.). `__prisma.ticks` zählt
ausserhalb der Bühne nur gezeichnete Bilder, also in Ruhe 30/s; die Proben warten nur auf `ticks > 2`. Alle
Bildzeit-Messungen (`geschichte-probe`, `brett-probe`, `start-probe`, `buehne-messung`) zählen Lücken zwischen eigenen
rAF, also Bildschirmbilder: unverändert. Nichts weiter umzustellen.

**Offen:** nichts.
