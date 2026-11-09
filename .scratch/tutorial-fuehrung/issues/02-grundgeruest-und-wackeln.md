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
- [ ] **Wackeln:** Ein festes Element mit eckigem Sockel wackelt beim Antippen kurz, der rote Rand blitzt auf, ohne Text,
      im ganzen Spiel. Es verändert weder Zugzahl noch Strahlen. Elemente ohne Sockel reagieren nicht.
- [ ] **Auswahl beim Antippen:** Liegt ein drehbares Element im Toleranzbereich, gewinnt es immer gegen ein festes, auch
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
