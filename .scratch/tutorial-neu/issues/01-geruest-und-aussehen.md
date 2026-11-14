# 01: Gerüst und Aussehen, «Erstes Licht» neu

**Spec:** ../spec.md

**Status:** ready-for-agent

**What to build:** Die Führung aus 1a.1 bekommt das neue Aussehen und wird strikt. Am Ende läuft «Erstes Licht» auf einem
neuen Brett mit vier Schritten so, wie es für alle Übungen gelten soll. Die übrigen acht alten Übungen bleiben in diesem
Ticket stehen und laufen mit dem neuen Gerüst weiter (ihre Schritte sind schon Daten), werden aber erst in Ticket 02
ersetzt. Prüfen, ob sie unter der Sperre lösbar bleiben (die Schritte müssen alle nötigen Elemente markieren); wo
nicht, das beim Übergeben zum Poco-Test sagen. Danach prüft der Nutzer auf dem Poco; ohne sein Okay geht es nicht weiter.

- [x] **Band unten** mit Satz, Fortschrittspunkten und «Weiter» an fester Stelle; der Satz verschwindet aus der
      Kopfzeile, «Übung n / N» bleibt dort. Auf Handy hoch, quer und bei 360 × 640 lesbar, verdeckt keine Knöpfe.
- [x] **Abdunkeln und Lichtkegel** auf dem markierten Element (auch mehreren), statt des gestrichelten Umrisses.
- [x] **Hand sofort** bei jedem Handlungsschritt, mit der Geste des Schritts. Den späten Fingerzeig
      (`FUEHRUNG.fingerzeig`, `fingerzeigZiel`) entfernen.
- [x] **Strikt:** Bei einem Handlungsschritt reagiert nur das markierte Element, alle anderen weigern sich (Wackeln, auch
      drehbare). Bei Erklärungen ist das Brett gesperrt bis «Weiter». Kamera, Knöpfe, Menü, Übersicht, Ton, Neustart und
      «Dorf überspringen» bleiben frei. Ausserhalb des Dorfs ändert sich nichts.
- [x] **Rückmeldung:** Funkeln am Element, Punkt füllt sich, leiser Ton (nur bei Ton an), dann etwa 0,6 s und weiches
      Einblenden des nächsten Schritts.
- [x] **Hinweise nebenbei** als kleiner Zusatz über dem Band (Verhalten wie bisher).
- [x] **«Erstes Licht» neu:** Brett mit Quelle, Ziel, drehbaren und einem festen Spiegel; vier Schritte: Ziel zeigen
      (Erklärung), Tippen dreht, den festen Spiegel antippen (er wackelt, danach rund gegen eckig), Zurückdrehen mit
      langem Drücken, das die Übung löst. Lösung eindeutig (Löser). `SCHRITTE_MAX` auf 4.
- [x] **Tests:** Logiktests anpassen (höchstens 4 Schritte, Sperre: nur das markierte Element dreht), Golden für «Erstes
      Licht» neu, Dorf-Probe spielt die vier Schritte; Bilder von Desktop, Handy hoch und quer für den Nutzer.
- [x] `APP_VERSION` in `index.html` und `sw.js` gleich setzen.

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

## Comments

### Review (14.11.2026)

Geprüft wurden die Commits 08a139a und 90d844b gegen `feature/tutorial-neu`. Alle Punkte der Checkliste sind erfüllt.

**Tests** (über `tools/leise.sh`, nach dem Review-Commit):

- Alle Node-Tests grün (9 Dateien, `logic.test.mjs` 2073 Tests). Golden grün: 847 Level, Stichprobe des Lösers.
- Dorf-Probe `--dorf` grün auf Desktop, `--handy`, `--handy --groesse 360x640` und `--quer`, Konsole ohne Fehler.
  Keine Lücke über 100 ms in den Übergängen. Die bekannte Lücke «Sehr schwer: Übersicht → Übung 8 wiederholen» trat
  diesmal nicht auf (17–18 ms). Es gab kein neues Rot, darum war kein Vergleich mit `ec02954` nötig.
- «Erstes Licht» ist nach `tools/solver.mjs` eindeutig lösbar: genau eine Lösung, `2,4` = 3 und `5,1` = 1. Die Übung hat
  vier Schritte. Alle Sätze bleiben auf beiden Geräten in der Grenze, der längste ist Schritt 4 mit 16 Wörtern und
  100 Zeichen am Desktop.

**Sperre und Randfälle (im Code geprüft):**

- `darf` und `vorrang` greifen an allen Stellen der Eingabe: bei Hover, Drücken, Loslassen, langem Drücken und
  Rechtsklick. Wechselt der Schritt zwischen Drücken und Loslassen, wird beim Loslassen noch einmal geprüft.
- Das Mausrad zoomt nur, Kamera, Knöpfe und Menü sind frei. `__prismaDebug.loese` geht an der Sperre vorbei, das ist
  für die Proben so gewollt.
- Ohne Führung verhalten sich `pickTapped`, `weigern` und `rotatableOnly` wie vorher. Feste Elemente in den Welten
  weigern sich weiter nur mit Sockelrand, im Würfel ändert sich nichts.
- Neustart und neues Brett halten die Uhren an und setzen `wechselt` zurück. «Weiter» ist während des Wechsels gesperrt.
- Wird eine Übung zu früh gelöst, ruft `gedreht` sofort `beenden` auf.
- Neu geprüft: Die alten Übungen haben unter der Sperre **keine Sackgasse**, alle neun mit 0. Ein Spieler darf die
  markierten Elemente beliebig drehen, auch zurück oder mehrmals, und schaltet damit weiter. Kein so erreichbarer Stand
  ist unlösbar. Die alten Übungen bleiben also unter der Sperre lösbar, es gibt nichts zu melden.

**Leistung:** `platziere` setzt Kegel und Maske nur, wenn sich Lage oder Halbmesser um mindestens einen halben Pixel
ändern. Die Kamera schwebt langsam: höchstens 0,035 rad bei 0,13 rad/s, also wenige Pixel je Sekunde. Darum wird die
Maske nur einige Male je Sekunde neu gesetzt, nicht in jedem Bild. Die Hand liegt nicht in der Maske. Je Bild bleiben
nur zwei Projektionen je Kegel. Das ist unbedenklich.

**Entfernt:** Vom späten Fingerzeig (`fingerzeig`, `fingerzeigZiel`, `inLoesung`, `vorspulen`, `spaet`, `stups`) und
vom Ring-Shader (`UMRISS_*`, `ringe*`) bleibt nichts zurück, auch nicht in Proben und Werkzeugen. Toter Code wurde
keiner gefunden.

**Selbst behoben** (Commit «fix(tutorial): kein Funkeln über Menü und Übersicht …»):

- Klein: Werden Menü oder Übersicht innerhalb der 0,6 s nach einem geschafften Schritt geöffnet, ruft die
  `wechselUhr` `zeichneBild` auf. Bisher stellte das die Ebene wegen des noch laufenden Funkelns wieder sichtbar, und es
  funkelte kurz über dem Menü. Jetzt zeigt `zeichneBild` ein auslaufendes Funkeln nur, solange das Brett zu sehen ist.
- Fehlender Test: «Schritte: unter der Sperre führt keine erlaubte Handlung in eine Sackgasse» in `tests/logic.test.mjs`.
  Der bisherige Test folgt nur dem kürzesten Weg. Die Gegenprobe ist gemacht: Wird Schritt 2 von «Erstes Licht» zu
  «drehen», meldet der Test 9 Sackgassen. Für Ticket 02 ist er die Absicherung der neuen Bretter.

**Hinweise für Ticket 02 und den Poco-Test (keine Fehler dieses Tickets):**

- Bei 360 × 640 und quer decken Band und Hinweise nebenbei die unterste Reihe des Bretts und reichen in die zweitletzte
  (siehe `*-6-nebenbei.png`). Die Probe prüft nur, ob die Mitte eines Lichtkegels unter dem Band liegt. Die neuen
  Bretter sollten unten frei bleiben, oder die Probe prüft alle Elemente.
- Der Hinweis nebenbei zum Neustart sagt «Kreispfeil rechts am Rand». Auf dem Handy hochkant steht der Knopf aber unten
  in der Reihe. Der Text war schon vorher so (`NEBENBEI.neustart`) und betrifft «Brechung» in Ticket 02.
- Der Lichtkegel ist auf den Handybildern eher zurückhaltend (Abdunkeln 0,46). Ob er auf dem Poco genug auffällt, soll
  der Nutzer beurteilen (`FUEHRUNG.kegel.dunkel`).

**Ergebnis:** Es gibt keine mittleren oder grossen Funde. Das Ticket ist aus Sicht des Reviews bereit für den Poco-Test.
Die Bilder liegen in `%TEMP%\prisma-bilder-tn01\`, neu dazugekommen sind `*-6-nebenbei.png` mit den Hinweisen nebenbei
im neuen Stil.
