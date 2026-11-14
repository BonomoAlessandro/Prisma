# 01: Gerüst und Aussehen, «Erstes Licht» neu

**Spec:** ../spec.md

**Status:** ready-for-agent

**What to build:** Die Führung aus 1a.1 bekommt das neue Aussehen und wird strikt. Am Ende läuft «Erstes Licht» auf einem
neuen Brett mit vier Schritten so, wie es für alle Übungen gelten soll. Die übrigen acht alten Übungen bleiben in diesem
Ticket stehen und laufen mit dem neuen Gerüst weiter (ihre Schritte sind schon Daten), werden aber erst in Ticket 02
ersetzt. Prüfen, ob sie unter der Sperre lösbar bleiben (die Schritte müssen alle nötigen Elemente markieren); wo
nicht, das beim Übergeben zum Poco-Test sagen. Danach prüft der Nutzer auf dem Poco; ohne sein Okay geht es nicht weiter.

- [ ] **Band unten** mit Satz, Fortschrittspunkten und «Weiter» an fester Stelle; der Satz verschwindet aus der
      Kopfzeile, «Übung n / N» bleibt dort. Auf Handy hoch, quer und bei 360 × 640 lesbar, verdeckt keine Knöpfe.
- [ ] **Abdunkeln und Lichtkegel** auf dem markierten Element (auch mehreren), statt des gestrichelten Umrisses.
- [ ] **Hand sofort** bei jedem Handlungsschritt, mit der Geste des Schritts. Den späten Fingerzeig
      (`FUEHRUNG.fingerzeig`, `fingerzeigZiel`) entfernen.
- [ ] **Strikt:** Bei einem Handlungsschritt reagiert nur das markierte Element, alle anderen weigern sich (Wackeln, auch
      drehbare). Bei Erklärungen ist das Brett gesperrt bis «Weiter». Kamera, Knöpfe, Menü, Übersicht, Ton, Neustart und
      «Dorf überspringen» bleiben frei. Ausserhalb des Dorfs ändert sich nichts.
- [ ] **Rückmeldung:** Funkeln am Element, Punkt füllt sich, leiser Ton (nur bei Ton an), dann etwa 0,6 s und weiches
      Einblenden des nächsten Schritts.
- [ ] **Hinweise nebenbei** als kleiner Zusatz über dem Band (Verhalten wie bisher).
- [ ] **«Erstes Licht» neu:** Brett mit Quelle, Ziel, drehbaren und einem festen Spiegel; vier Schritte: Ziel zeigen
      (Erklärung), Tippen dreht, den festen Spiegel antippen (er wackelt, danach rund gegen eckig), Zurückdrehen mit
      langem Drücken, das die Übung löst. Lösung eindeutig (Löser). `SCHRITTE_MAX` auf 4.
- [ ] **Tests:** Logiktests anpassen (höchstens 4 Schritte, Sperre: nur das markierte Element dreht), Golden für «Erstes
      Licht» neu, Dorf-Probe spielt die vier Schritte; Bilder von Desktop, Handy hoch und quer für den Nutzer.
- [ ] `APP_VERSION` in `index.html` und `sw.js` gleich setzen.

## Hinweise

- Die Führung steckt in `index.html` um `const FUEHRUNG` (etwa Zeile 20446 ff., Anzeige `fuehrung`), die Daten der
  Schritte (`SCHRITTE_MAX`, `SCHRITT_WEITER`, `schrittErfuellt`, `fingerzeigZiel`) etwa Zeile 8195 ff., die Übungen am
  Anfang von `LEVELS` (etwa Zeile 1977 ff.). Der Satz kommt heute über `fuehrung.kopfzeile` (etwa Zeile 20676) in die
  Unterzeile der Kopfzeile (Aufbau etwa Zeile 20954 ff.); «Übung n / N» setzt die Geschichte (etwa Zeile 26434).
- Die Weigerung fester Elemente und die Auswahl beim Antippen (`pickTapped`, etwa Zeile 1466) gibt es schon; die Sperre
  kann die Weigerung für nicht markierte drehbare Elemente mitbenutzen. Achtung: `pickTapped` lässt heute ein drehbares
  Element in Reichweite immer gegen ein festes gewinnen; beim Schritt «den festen Spiegel antippen» muss das markierte
  Element gewinnen (oder es steht wie heute kein drehbares daneben, Test «ein festes Element zum Antippen hat kein
  drehbares im Nachbarfeld»).
- `tests/logic.test.mjs` lädt die Führung über einen Export (`SCHRITTE_MAX`, `schrittErfuellt`, `fingerzeigZiel` …);
  beim Entfernen des Fingerzeigs dort mitziehen. Betroffen sind vor allem «Schritte: höchstens drei, …», «Schritte: die
  Inhalte je Übung» (Erstes Licht) und «Später Fingerzeig: …» (fällt weg). «Schritte: wer jedem Schritt mit der
  kürzesten Handlung folgt, löst keine Übung vor ihrem letzten Schritt» bleibt; unter der Sperre darf die Suche dort nur
  die markierten Elemente drehen.
- Schwere Läufe (Chrome, Proben) nur über `tools/leise.sh`, siehe `.scratch/tutorial-fuehrung/STAND.md`, «Arbeitsweise».
- Neue Begriffe (Band, Lichtkegel, Sperre) in `CONTEXT.md`; «Später Fingerzeig» nach «Abgelöst».
