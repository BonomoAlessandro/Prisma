# 02: Brechung, Farbenlehre, Mischung neu; kein Stand im Dorf

**Spec:** ../spec.md

**Blocked by:** 01 und das Okay des Nutzers nach seinem Poco-Test

**Status:** ready-for-human (umgesetzt und reviewt; offen nur noch der Test des Nutzers auf dem Poco und mit einer
Person, die Prisma nicht kennt, siehe Ticket 03)

**What to build:** Das Dorf hat danach genau vier Übungen auf neuen Brettern. Die alten Übungen Umweg, Sperre,
Schatten, Farbiges Licht und Treffpunkt sowie die alten Bretter von Brechung, Farbenlehre und Mischung sind weg.

- [x] **Brechung:** Blöcke schlucken Licht, das Prisma fächert auf; nebenbei Kamera und Neustart. Höchstens 4 Schritte.
- [x] **Farbenlehre:** der Filter, farbige Quellen und der Ring am Ziel. Höchstens 4 Schritte.
- [x] **Mischung:** Mischen am Ziel, dann der Kombinator. Höchstens 4 Schritte.
- [x] Jedes Brett eindeutig lösbar (Löser), auf dem Handy quer nicht eng; der letzte Schritt führt zur Lösung, kein
      Schritt kann wegen der Sperre in eine Sackgasse führen.
- [x] **Kein Stand im Dorf** (Spec «Kein Stand im Dorf»): `platz` im Dorf-Stand fällt weg; wer das Dorf startet oder
      mitten im Dorf neu lädt, beginnt bei Übung 1. Gespeichert bleibt nur `ende`; ein beendetes oder übersprungenes
      Dorf bleibt beendet, auch aus alten Ständen mit `platz` bis 8. Logiktest dazu; was heute `dorf.platz` prüft,
      umstellen (`tests/levelliste.test.mjs` etwa Zeile 917–930, `tests/geschichte-probe.mjs` etwa Zeile 2088–2160
      mit «Neuladen → Übung 4», dazu etwa 2327 und 2362–2397).
- [x] **Abhängigkeiten der 9 nachziehen:** `TUTORIAL_COUNT` ergibt sich aus `LEVELS`; prüfen, was an Indizes von `LEVELS`
      hängt (`tests/golden.json`, Klassik-Modus mit «Tutorial n / N», Übersicht, Logik- und Vorratstests), und anpassen.
- [x] Dorf-Probe spielt jeden Schritt aller vier Übungen auf Desktop, Handy hoch, 360 × 640 und quer.

## Hinweise

- Der Test «Tutorial: führt alle Elementarten ein» in `tests/logic.test.mjs` verlangt Spiegel, festen Spiegel, Block,
  Prisma, Filter, Kombinator und eine farbige Quelle im Tutorial; die neue Auswahl muss das weiter erfüllen oder der
  Test wird bewusst angepasst. «Schritte: die Inhalte je Übung» nennt die neun alten Namen, «Umweg», «Schatten» und die
  Hinweise nebenbei in «Sperre» und «Brechung»; er wird neu geschrieben (Kamera und Neustart dann beide in «Brechung»).
- Der Speicherstand des Dorfs wird in `storyDorfStand` geprüft (`index.html`, etwa Zeile 22650). Achtung: Heute gilt
  dort ein Stand ohne ganzzahliges `platz` oder mit `platz` ≥ `TUTORIAL_COUNT` als unlesbar, und `setGrade` löscht ihn
  (etwa Zeile 24722–24724). Ein altes gespieltes Dorf steht auf Platz 8 (`TUTORIAL_COUNT - 1`, so auch `?alles`, etwa
  Zeile 24630); ohne Änderung ginge also gerade das beendete Dorf verloren, und ein neuer Stand ohne `platz` ebenso.
- `dorf.platz` wird gelesen in `firstIndex` (etwa Zeile 24731) und `begin` (etwa Zeile 25077: läuft das Dorf, beginnt
  es bei dieser Übung) und geschrieben in `save` (etwa Zeile 24750). Ohne `platz` muss `begin` bei Index 0 beginnen.
  «Innerhalb einer Sitzung behalten Menü und Übersicht die Übung» gilt heute über `resume` (`choose`, `playDorf`: das
  Brett steht noch). Wo `choose` nicht fortsetzt, ruft es `setGrade` auf (setzt `inDorf` zurück, lädt den Stand neu),
  dann `begin`: ohne gespeicherten Platz also Übung 1, z. B. nach einem Wechsel in einen anderen Grad und zurück. Das
  passt zu «jeder Start bei Übung 1»; nur darf `begin` nicht auf ein fehlendes `platz` stossen.
- Die Übersicht (`baueReihen`, etwa Zeile 21782) richtet sich nicht nach `platz`, sondern nach `geloest`: Die erste
  ungelöste Übung ist «offen». `geloest` bleibt gespeichert. Nach dem Neuladen mitten im Dorf beginnt «Weiter» also bei
  Übung 1, die Übersicht zeigt aber die gelösten Übungen als gelöst und die nächste als offen; wer sie dort wählt,
  spielt ab ihr im normalen Ablauf weiter (`playDorf`, `advanceDorf`). Das bleibt so (Entscheid des Nutzers,
  14.11.2026: Die Übersicht wählt man bewusst).
- Neues Rot zuerst gegen `ec02954` (Stand vor dem Vorhaben) vergleichen.

## Comments

### Review (14.11.2026)

Geprüft wurde Commit f19492a gegen `feature/tutorial-neu`. Alle Punkte der Checkliste sind erfüllt. Es gibt keine
mittleren oder grossen Funde und nichts, was ich selbst beheben musste.

**Tests** (über `tools/leise.sh`, je Lauf einzeln):

- Alle Node-Tests grün (10 Dateien, `logic.test.mjs` 2059 Tests). Golden grün: 842 Level, Löser für die Stichprobe.
- Dorf-Probe `--dorf` grün auf Desktop, `--handy` und `--quer`, ebenso `--dorf-raender`, `--wagen` und
  `tests/brett-probe.mjs`. Konsole jeweils ohne Fehler.
- `--dorf --handy --groesse 360x640` war zweimal rot, beide Male nur wegen Bildlücken. Die Lücke «Satz zum Ende →
  Bergwald 1» (444 ms) kam beim zweiten Lauf nicht wieder. «Sehr schwer: Übersicht → Übung 3 wiederholen → Übung 4»
  hatte 297 ms und dann 194 ms. Die Lücke liegt im ersten Zeichnen des Himmels `forest` beim Himmelswechsel
  (549 ms), nicht in den Brettern. Das ist die bekannte Lücke «Übung 8 wiederholen» von vor dem Vorhaben. Auf
  `ec02954` war derselbe Lauf diesmal grün, auf dem Branch waren Desktop, hoch und quer diesmal grün. Sie kommt also
  nur zeitweise. Ich werte sie nicht als neues Rot.

**Bretter** (mit `tools/solver.mjs` und Nachspielen der Tipp-Folgen):

- Brechung, Farbenlehre und Mischung haben je genau eine Lösung und je 4 Schritte. Der letzte Schritt ist «drehen» und
  endet mit dem Lösen. Die Reihen z = 5 und 6 sind leer. Der neue Test der Probe, ob das Band ein Element verdeckt,
  schlug in keiner Lage an.
- Unter der Sperre gibt es keine Sackgasse (Test «Schritte: unter der Sperre führt keine erlaubte Handlung in eine
  Sackgasse»). Jeder `strahl`-Schritt schaltet genau bei der Stellung weiter, die die Lösung braucht. Danach ist das
  Element gesperrt, ohne dass ein falscher Stand stehen bleibt.
- Alle Sätze bleiben in der Grenze. Der längste ist Farbenlehre Schritt 4 mit 16 Wörtern und 100 Zeichen am Desktop.
  Die Hinweise nebenbei haben je höchstens 14 Wörter.

**Kein Stand im Dorf** (im Code und in den Proben):

- `storyDorfStand` verwirft `platz`. Alte Stände mit `ende` 'gespielt' oder 'uebersprungen' bleiben beendet, auch mit
  `platz` 8 oder einem ungültigen `platz` (Logiktest, Probe `--dorf-raender` f). Ein laufendes Dorf beginnt bei Übung 1.
  `setGrade` schreibt den bereinigten Stand zurück, beim nächsten Speichern fällt `platz` weg.
- `begin` setzt `uebung = 0`, `firstIndex` gibt 0 zurück, `save` schreibt keine Übung mehr. Menü und Übersicht
  behalten Übung und Schritt über `resume`. Ein Wechsel in einen anderen Grad und zurück geht über `setGrade`
  (setzt `inDorf` zurück) und `begin`, also zu Übung 1. Das passt zu «jeder Start bei Übung 1». Die Proben spielen das
  nicht, der Weg ist derselbe wie beim Neuladen.
- Gelöste Übungen bleiben gelöst (`geloest`). Wählt man die offene Übung in der Übersicht, geht es ohne `replay` im
  Ablauf weiter (Probe). `?alles` schreibt `{ ende: 'gespielt' }`.
- Indizes: `TUTORIAL_COUNT` ergibt sich aus `LEVELS`. In `tools/` (KI-Tester `shots`, `prepare`, `protocol`, Lader,
  `ordne-level`, `geschichte`), `tests/` und `golden.json` rechnet alles mit `TUTORIAL_COUNT` oder nach Namen. Der
  Speicherstand arbeitet mit Namen, ebenso die Bestwerte. Der Klassik-Titel lautet «Tutorial n / ${TUTORIAL_COUNT}».
  `brett-probe` zeigt `LEVELS[12]`; das ist jetzt ein anderes Level, aber weiter ein flaches, und die Probe ist grün.
  Nirgends hängt etwas an der alten 9.
- Das Funkeln ist nicht wieder da (Rückmeldung zum geschafften Schritt, `index.html` Zeile 20538: nur Ton und Punkt).

**Als Neuling durchgespielt, Hinweise für den Poco-Test** (keine Fehler, Entscheid beim Nutzer):

1. **Zwei Hinweise nebenbei zugleich.** In Brechung stehen Kamera und Neustart ab Schritt 1 als ein Text über dem
   Band: 25 Wörter, auf dem Handy hochkant 3 Zeilen, und das zur selben Zeit wie die Erklärung zum Block
   (`handy-dorf-leicht-uebung-2-schritt-1.png`). Jeder Hinweis bleibt für sich in der Grenze von 16 Wörtern, zusammen
   ist es viel Text. Möglich wäre, den Neustart-Hinweis erst nach dem Kamera-Hinweis zu zeigen
   (`fuehrung.zeichneBand`, `index.html` etwa Zeile 20622: nur `this.nebenbei[0]`). Dann sähe ihn aber nie, wer die
   Kamera nicht benutzt. Darum habe ich das nicht geändert.
2. **Zwischenstand bei zwei Tippen.** In Brechung Schritt 2 und Farbenlehre Schritt 3 schickt das erste Tippen das
   Licht zurück zur Lampe. In Farbenlehre Schritt 4 und Mischung Schritt 2 steht der Spiegel nach dem ersten Tippen
   längs zum Strahl, und das Licht endet an seiner Kante. Das ist der Sonderfall, der nicht mehr gelehrt wird. Auf
   dem Bild sehen beide Fälle gleich aus: Der Strahl endet am Spiegel. Das «bis …» im Satz sagt aber, dass man weiter
   tippt, und das zweite Tippen löst. Ich halte das für verständlich. Beim Test mit dem Neuling sollte man darauf
   achten. Mit Tippen allein lässt sich das längs stehende Zwischenbild nicht vermeiden: Vor der Lösungsstellung liegt
   dort immer die Stellung längs zum Strahl.
3. **Farbenlehre Schritt 4:** Der Kegel liegt auf dem Spiegel, die Hand auch. Der rote Strahl von der Lampe zum
   Spiegel ist deutlich zu sehen, und «ihren Spiegel» ist eindeutig. Das passt. Falls die Lampe mehr auffallen soll,
   ginge `bei: ['6,4', '6,1']`, die Hand bliebe am ersten.
4. **Mischung mit vier Lampen:** 8 Elemente, aber in zwei klaren Gruppen (links Spiegel und Kristall, rechts der
   Kombinator zwischen zwei Lampen). Jede Lampe leuchtet gerade, und der Lichtkegel führt. Für Anfänger nicht zu voll.
5. **Alte Bestwerte:** Brechung, Farbenlehre und Mischung heissen wie früher, ihre Bestwerte gelten aber für die alten
   Bretter. Wer sie dort schon hatte, sieht in der Übersicht Drehungen (früher mindestens 2, 3 und 2), die auf den
   neuen Brettern (mindestens 3, 4 und 3) nicht mehr zu erreichen sind. Die Spec will keine Umrechnung. Das betrifft
   nur Geräte mit altem Stand.

**Für Ticket 03:** `README.md` Zeile 171 nennt noch «alle 9 Übungen», dazu «Umriss», «später Fingerzeig» und den
Neuladen mitten in «Brechung» bei der Beschreibung von `--dorf`. Die Doku ist Teil von Ticket 03.

**Ergebnis:** Das Ticket ist aus Sicht des Reviews fertig. Die Bilder liegen in `%TEMP%\prisma-bilder-tn02\`.
