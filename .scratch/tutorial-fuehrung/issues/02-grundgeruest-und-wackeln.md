# 02: Grundgerüst für die Schritte und Wackeln der festen Elemente

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Die Führung als eigenes Stück neben dem Spiel: Sie zeigt die Schritte einer Übung, wartet auf die
Handlung des Spielers und geht dann weiter. Dazu die Weigerung fester Elemente im ganzen Spiel. Gebaut wird in der
Richtung, die der Nutzer am Katalog gewählt hat; am Ende läuft zur Probe eine Übung («Erstes Licht») geführt.

- [ ] **Schritte als Daten** je Übung, neben dem Feld `hint`: Eine Übung hat in diesem Ticket Schritte oder `hint`, erst
      Ticket 03 entfernt `hint`. Höchstens drei Schritte mit Text und dem, was weiterschaltet (Spec, «Was weiterschaltet»).
- [ ] **Hinweise nebenbei** (Kamera, Neustart): warten auf nichts, zählen nicht mit, verschwinden bei der ersten Benutzung
      oder spätestens mit dem Lösen und kommen beim Neustart derselben Übung nicht wieder. Das braucht Anschlüsse an
      Kamera und Neustart.
- [ ] **Text je Gerät** mit Platzhaltern in der Befehlsform («Tippe» / «Klicke», «Drücke lang» / «Rechtsklicke»). Die
      heutigen `{Klick}` und `{Rechtsklick}` ergeben «Tippen» und «Ein Klick», das passt nicht ins Du.
- [ ] **Später Fingerzeig:** nach etwa 15 Sekunden ohne Fortschritt das nächste Element hervorheben, nie automatisch lösen,
      keine Meldung bei Fehlversuchen. Der Wert steht an einer Stelle.
- [ ] **Unterbrechungen:** Neuladen und Neustart beginnen beim ersten Schritt der Übung, Menü und Übersicht behalten den
      Schritt. Kein neues Feld in `prisma.noa.<grad>.dorf`, keine gesperrten Knöpfe.
- [ ] **Früher gelöst:** Die Lösung gilt sofort, die restlichen Schritte entfallen, kein Hinweis bleibt stehen.
- [x] **Wackeln:** Ein festes Element mit eckigem Sockel wackelt beim Antippen kurz, der rote Rand blitzt auf, ohne Text,
      im ganzen Spiel. Es verändert weder Zugzahl noch Strahlen. Elemente ohne Sockel reagieren nicht.
- [x] **Auswahl beim Antippen:** Liegt ein drehbares Element im Toleranzbereich, gewinnt es immer gegen ein festes, auch
      auf dem Handy mit `INPUT.touchSlop`.
- [ ] **Tests:** Logiktests für die Daten der Schritte (Anzahl, Länge, nur bekannte Platzhalter). Die Tests «jedes mit
      Hinweis» und «nur bekannte Platzhalter» (`tests/logic.test.mjs`) und der Aufbau der Kopfzeile (`lvl.hint.replaceAll`)
      akzeptieren in diesem Ticket Schritte oder `hint`. Ablauf von «Erstes Licht» in der Dorf-Probe.

## Hinweise

- Heute macht nur Drehbares mit: `makeInteractive` kommt allein für `isRotatable` (`index.html`), feste Elemente sind
  also nicht antippbar. Das Wackeln braucht darum eine eigene Auswahl, die Drehbares vorzieht.
- Der Hinweis wird in `index.html` beim Aufbau der Kopfzeile gesetzt (`lvl.tutorial`, Funktion um `hinweis`).
- Das Material des roten Rands (`edgeMat`) teilen sich alle festen Sockel. Direkt geändert blitzen alle; das angetippte
  Element braucht beim Wackeln ein eigenes.
- Die neuen Begriffe (etwa Schritt, Führung, Weigerung) gehören in `CONTEXT.md`.
- Bei Würfel-Leveln bleibt alles wie heute, sofern der Katalog nichts anderes ergibt: Dort gibt es den Rahmen statt des
  Sockels und kein Dorf.

## Comments

- 09.11., Teil «Wackeln und Auswahl» (`feature/tutorial-02-wackeln`), fertig: Weigerung fester Elemente mit eckigem
  Sockel im ganzen Spiel (`makeRefusing`, `weigern`, `animateWeigern`, `WEIGERN` in `index.html`; der Rand bekommt nur
  für die Dauer ein eigenes Material, danach wieder `edgeMat`; je Bild nichts, solange nichts wackelt). Feste mit
  Sockel haben einen Trefferzylinder in `game.hitProxies`, im Würfel nicht. Auswahl `pickTapped` (LOGIC): Drehbares
  im Toleranzbereich gewinnt immer; Hover und Lichtrand nur für Drehbares. Begriff «Weigerung» in `CONTEXT.md`.
  Tests: Logiktests «Antippen (Weigerung)», Browserprobe `tests/wackel-probe.js` (Desktop und `MOBILE=1`).
  Offen in diesem Ticket: das Gerüst der Schritte (wartet auf die Wahl am Katalog).
- 09.11.2026, **Review (Wackeln)** (`9da8553`, nur die Haken «Wackeln» und «Auswahl beim Antippen»): bereit zum
  Mergen. Geprüft: `pickTapped` lässt Drehbares im Toleranzbereich immer gewinnen (getroffen oder höchstens
  `INPUT.touchSlop` daneben, auch hinter einem festen); Drehen, langes Drücken (nur mit drehbarem `el`), Ziehen der
  Kamera und Hover (`rotatableOnly`) wie bisher; `weigern` nur in `flow.state === 'play'` und nur mit Sockel, ohne Zug,
  Strahlen und Speicher; im Würfel und beim Vorwärmen kein `makeRefusing`; Vorbauen über `buildElements` trägt die
  Zylinder in die Liste des neuen Levels ein; `loadLevel` löscht `pointer.fest`. Das eigene Material ist ein Klon von
  `edgeMat` (gleiches Programm, kein neuer Shader) und wird nach dem Wackeln oder, wenn das Modell aus der Szene ist,
  im nächsten Bild freigegeben; `edgeMat` steht in `SHARED_MATERIALS`, `disposeTree` gibt es nie frei. Leistung: ohne
  Wackeln je Bild nur `weigernde.size`; die zusätzlichen Trefferzylinder (einer je festes Element mit Sockel, 12
  Segmente, zuerst die Hüllkugel) kosten beim Hover und Antippen nichts Messbares; die Projektion aller Zylinder läuft
  nur noch mit Toleranz (Finger). Selbst behoben (`6ec4ae2`): `wackel-probe` verglich die Lage nach dem Wackeln mit 0
  statt mit der Lage davor und prüft jetzt dazu den Levelwechsel mitten im Wackeln (Modell zurück, geteiltes Material,
  eigenes freigegeben). Hinweis für Ticket 03: Steht ein festes Element auf dem Handy direkt neben einem drehbaren,
  gewinnt beim Tippen nahe der gemeinsamen Kante das drehbare (so gewollt); in «Umweg» liegen zwei Felder dazwischen.
  Tests: Node alle grün (logic 2054, beurteilung 206, ki-tester 84, levelliste 54, geschichte 35, generator 31,
  wuerfelliste 20, vorrat 18, hall 6, golden 847 Level); `wackel-probe` Desktop und Handy ok (Ausschlag 0,084 rad,
  Rand fünffach hell), `interaction-probe` Desktop und `MOBILE=1` ok; `geschichte-probe --dorf` und `--dorf --handy`
  nur mit Bildlücken über 100 ms rot, wie auf `e426554` (dort Desktop 2, Handy 1; zweiter Lauf Desktop hier 1, an
  derselben Stelle wie dort); `offline.mjs` läuft auch auf `e426554` nach 30 ok in die Notbremse von 600 s
  (SwiftShader), nicht vom Ticket.
