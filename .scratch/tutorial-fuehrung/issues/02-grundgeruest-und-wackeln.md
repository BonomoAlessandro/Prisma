# 02: Grundgerüst für die Schritte und Wackeln der festen Elemente

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Die Führung als eigenes Stück neben dem Spiel: Sie zeigt die Schritte einer Übung, wartet auf die
Handlung des Spielers und geht dann weiter. Dazu die Weigerung fester Elemente im ganzen Spiel. Gebaut wird in der
Richtung, die der Nutzer am Katalog gewählt hat; am Ende läuft zur Probe eine Übung («Erstes Licht») geführt.

- [x] **Schritte als Daten** je Übung, neben dem Feld `hint`: Eine Übung hat in diesem Ticket Schritte oder `hint`, erst
      Ticket 03 entfernt `hint`. Höchstens drei Schritte mit Text und dem, was weiterschaltet (Spec, «Was weiterschaltet»).
- [x] **Hinweise nebenbei** (Kamera, Neustart): warten auf nichts, zählen nicht mit, verschwinden bei der ersten Benutzung
      oder spätestens mit dem Lösen und kommen beim Neustart derselben Übung nicht wieder. Das braucht Anschlüsse an
      Kamera und Neustart.
- [x] **Text je Gerät** mit Platzhaltern in der Befehlsform («Tippe» / «Klicke», «Drücke lang» / «Rechtsklicke»). Die
      heutigen `{Klick}` und `{Rechtsklick}` ergeben «Tippen» und «Ein Klick», das passt nicht ins Du.
- [x] **Später Fingerzeig:** nach etwa 15 Sekunden ohne Fortschritt das nächste Element hervorheben, nie automatisch lösen,
      keine Meldung bei Fehlversuchen. Der Wert steht an einer Stelle.
- [x] **Unterbrechungen:** Neuladen und Neustart beginnen beim ersten Schritt der Übung, Menü und Übersicht behalten den
      Schritt. Kein neues Feld in `prisma.noa.<grad>.dorf`, keine gesperrten Knöpfe.
- [x] **Früher gelöst:** Die Lösung gilt sofort, die restlichen Schritte entfallen, kein Hinweis bleibt stehen.
- [x] **Wackeln:** Ein festes Element mit eckigem Sockel wackelt beim Antippen kurz, der rote Rand blitzt auf, ohne Text,
      im ganzen Spiel. Es verändert weder Zugzahl noch Strahlen. Elemente ohne Sockel reagieren nicht.
- [x] **Auswahl beim Antippen:** Liegt ein drehbares Element im Toleranzbereich, gewinnt es immer gegen ein festes, auch
      auf dem Handy mit `INPUT.touchSlop`.
- [x] **Tests:** Logiktests für die Daten der Schritte (Anzahl, Länge, nur bekannte Platzhalter). Die Tests «jedes mit
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
- 09.11., Teil «Gerüst der Schritte» (`feature/tutorial-02-geruest`), fertig in Richtung C «Vorzeigen»: Daten je Übung
  `schritte` ({ text, bei, weiter, richtung? }, höchstens `SCHRITTE_MAX` = 3) und `nebenbei` neben `hint`;
  weiter ist `erklaerung` («Weiter» am Satz), `antippen` (auch die Weigerung eines festen Elements), `drehen`
  (`richtung: -1`: nur zurück) oder `strahl` (`SCHRITT_WEITER`, `schrittErfuellt`, `strahlTrifft` im LOGIC-Block).
  Platzhalter je Gerät `{Tippe}` und `{Drücke lang}` (`SCHRITT_PLATZHALTER`, `geraeteText`, auch für die alten
  `{Klick}`/`{Rechtsklick}`). Hinweise nebenbei `NEBENBEI` (kamera, neustart). Die Führung `fuehrung` in
  `index.html` (bei der Oberfläche): Satz in der Kopfzeile (`span.hinweis.schritt`, Knopf `.fuehrung-weiter`),
  gestrichelter Umriss und Hand auf der Ebene `#fuehrung` über dem Brett, als Ring perspektivisch auf dem Brett
  projiziert (`platziere` je Bild, nur solange etwas zu sehen ist; die Bewegung macht CSS). Später Fingerzeig nach
  `FUEHRUNG.fingerzeig` = 15 s ohne Fortschritt, nach den Schritten am nächsten Element ausserhalb der Lösung
  (`fingerzeigZiel`). Anschlüsse: `fuehrung.gedreht` (rotateElement), `fuehrung.angetippt` (weigern; für «Umweg»
  in Ticket 03), `fuehrung.kamera` (dragCamera, zoomCamera), `fuehrung.neustart` (restartLevel), `fuehrung.neu`
  (enterLevel), `fuehrung.start` (Brett steht), `verbergen`/`zeigen` (hideHud/showHud: Menü und Übersicht behalten
  den Schritt, die Zeit dort zählt nicht). «Erstes Licht» läuft geführt (zwei Schritte: Ziel erklären, Spiegel antippen),
  die übrigen acht behalten `hint`. Begriffe Führung, Schritt, Hinweis nebenbei, Später Fingerzeig in `CONTEXT.md`.
  Tests: Logiktests «Führung im Dorf (Schritte)» und die beiden angepassten Tests des Tutorials; Dorf-Probe spielt
  «Erstes Licht» geführt (`gefuehrt` in `tests/geschichte-probe.mjs`, mit zur Probe gesetzten Hinweisen nebenbei).
  Gelaufen: `logic.test.mjs` 2061 ok; Dorf-Probe Desktop und `--handy`: alle Prüfungen der Führung ok. Rot blieb nur
  eine Bildlücke bei «Sehr schwer: Übersicht → Übung 8 wiederholen» (281–404 ms, Himmel forest → village); sie kommt
  auf dem Stand vor diesem Teil ebenso (444 ms), gehört also nicht zur Führung.
