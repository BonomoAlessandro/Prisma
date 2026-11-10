# 04: Schluss mit Prüfung und Doku

**Spec:** ../spec.md

**Blocked by:** 03

**Status:** ready-for-human (alles vor dem manuellen Test erledigt; es fehlen Poco-Test, Test mit einer fremden Person, die 15 s und der Merge)

**What to build:** Die Führung wird als Ganzes geprüft und dokumentiert, danach entscheidet der Nutzer über den Merge.

- [x] **Automatisch:** alle Node-Tests, Golden-Test, `tests/geschichte-probe.mjs --dorf` am Desktop und auf dem Handy, mit
      jedem Schritt jeder Übung; dazu Neuladen, Neustart, Menü, Übersicht und «Dorf überspringen» mitten in der Führung.
- [x] **Wackeln:** in einer Welt ausserhalb des Dorfs geprüft, drehbares Element neben festem auf dem Handy.
- [x] **`APP_VERSION`** vor dem Poco-Test und dem Test mit der fremden Person setzen, in `index.html` und `sw.js` gleich,
      sonst läuft auf dem Handy womöglich der alte Stand.
- [ ] **Poco-Test des Nutzers.**
- [ ] **Test mit mindestens einer Person, die Prisma noch nie gesehen hat**, auf dem Handy, am Massstab der Spec. Was
      dabei auffällt, steht unter «Comments».
- [ ] **15 Sekunden** nach den Tests festlegen.
- [x] **Doku:** `CONTEXT.md` («Im Dorf»), `README.md` (Levels und Hinweise), PLAN 1a.1 abhaken, Schlussstand
      in der Spec. (PLAN 1a.1 trägt den Vermerk «umgesetzt, wartet auf den Poco-Test und den Test mit einer fremden
      Person»; abgehakt wird erst nach den Tests von Hand.)
- [ ] **Merge nach `main`** nur auf das Go des Nutzers.

## Comments

- 10.11.2026, **Stand vor dem manuellen Test** (`feature/tutorial-fuehrung`, Commits cab0c58, 43b5bea, fe4dfb3 und
  die Doku danach).

  Zuerst drei Punkte aus dem Review von Ticket 03 (neue Sätze auch in der Tabelle von Ticket 03):
  - **Mischung, Schritt 1** ist jetzt ein Strahl-Schritt am Prisma mit `trifft: '6,3'` und neu `farbe: 'magenta'`:
    weiter erst, wenn im Kombinator Rot und Blau ohne Grün ankommen. Ein Strahl-Schritt ohne Farbe hätte gleich zu
    Beginn gegolten (aus rot 7 bekommt der Kombinator schon Grün). Satz unverändert, die Hand zeigt Tippen. Logiktest
    «nicht zu früh» grün, dazu ein Test: Grün allein und das Zurückdrehen (nur Blau) schalten nicht, ein Tippen schon.
  - **Umweg:** Der hintere Spiegel (5,1) startet wie der vordere eine Stufe zu weit (rot 2 statt 0, Lösung 1).
    Schritt 3 umrandet beide runden Spiegel: «{Drücke lang} auf die runden Spiegel, so drehen sie zurück.» (vorher
    «… auf den markierten Spiegel, so dreht er zurück.»). Jeder braucht genau ein Zurück; nach dem Schritt bleibt keine
    Drehung, von der kein Satz spricht. Lösung und Eindeutigkeit unverändert (Golden grün), Abdruck in
    `UEBUNGEN_OHNE_TEXT` neu, Spec «Bretter und Anzahl» nachgeführt.
  - **Farbenlehre, Schritt 2** umrandet Prisma und Spiegel: «{Tippe} Prisma und Spiegel: Das Prisma fächert nur auf, was
    ankommt.» (vorher «{Tippe} das Prisma: Es fächert nur die Farben auf, die ankommen.»). Brett unverändert.

  Probe ergänzt: `geschichte-probe --dorf` prüft mitten in der Führung von «Brechung» (Schritt 2): Neuladen beginnt
  wieder bei Schritt 1, Menü und Übersicht behalten Schritt 2, nach «Dorf überspringen» steht im Bergwald nichts mehr
  von der Führung. Neustart, Menü und später Fingerzeig prüfte sie schon in «Erstes Licht». `tests/wackel-probe.js`
  nimmt zum Schluss das erste Level des Bergwalds (Leicht) mit einem festen Spiegel direkt neben einem drehbaren.

  Tests:
  - **Node** alle grün: `logic` 2064, `golden` alle 847 Level (davon 300 Würfel), `vorrat` 18, `geschichte` 35,
    `levelliste` 54, `beurteilung` 206, `ki-tester` 84, `generator` 31, `wuerfelliste` 20, `hall` 6.
  - **`--dorf` Desktop:** alle 23 Schritte der 9 Übungen (dazu Übung 2 und 3 in Leicht) ok, alle Sätze einzeilig;
    Unterbrechungen ok. Rot nur zwei bekannte Lücken: 430 ms «Menü → Prolog → Überspringen», 403 ms «Sehr schwer:
    Übersicht → Übung 8 wiederholen».
  - **`--dorf --handy`** (zwei Läufe): alle Schritte und Unterbrechungen ok. Rot 424 bzw. 429 ms «Üben → Einstieg ins
    Dorf» im Untertitel (flow story, noch keine Führung), im zweiten Lauf dazu 296 ms bei Übung 8 (bekannt). Gegen
    `e426554`: Dort steht dieselbe Lücke (445 ms) an derselben Stelle gleich nach dem Bild «dorf-einstieg» der Probe
    und fällt noch in dessen Zeitfenster («Bild der Probe, zählt nicht»), hier knapp dahinter. Nicht vom Vorhaben.
  - **`--dorf --handy --groesse 360x640`:** alle Schritte ok, 13 Sätze einzeilig, 16 zweizeilig; rot nur die bekannte
    Lücke bei Übung 8 (160 ms).
  - **`--dorf --quer`:** bestanden, alle Sätze einzeilig.
  - **`--uebersicht --menue`:** rot in beiden Läufen nur Lücken beim Öffnen und Schliessen der Übersicht und des Menüs
    in Welten (Meer, Sterne), im ersten Bild der Messung gleich nach einem Bild der Probe (212/338/124 ms und
    230/395/123 ms). Auf `4c3f2fa` (vor diesem Ticket) zwei (212, 160 ms), auf `e426554` 0 und 1 (159 ms «Spiel →
    Übersicht»). Dieselbe Art Lücke wie im STAND von «Ein Brett je Himmel» (Present von Chrome headless); die Führung
    ist dort aus (`fuehrung.level` null, `verbergen`/`zeigen` nur billige Prüfungen). Auf dem Branch kamen sie
    etwas häufiger; beim Poco-Test auf Ruckler beim Öffnen und Schliessen der Übersicht achten.
  - **`--grad leicht --welten 2`:** bestanden.
  - **`wackel-probe`** Desktop und `MOBILE=1` grün: Ausschlag 0,084 rad, Rand fünffach hell. In der Welt (Bergwald
    «Lichtblick», fester Spiegel (4,5) neben dem Prisma (5,5)): Der feste wackelt auf seiner abgewandten Seite, das
    Prisma bleibt; ein Finger auf der Seite des festen nahe der Kante (51 % der 48 px vom Prisma) dreht das Prisma, der
    feste bleibt still; am Desktop dreht ein Klick aufs Prisma, der feste bleibt still.
  - Ausgelassen: `tests/offline.mjs` (Notbremse schon vor dem Vorhaben), `--groesse 640x360` (Review 03: zehn Funde,
    auf `e426554` identisch), `cube-click-probe`.
  - `APP_VERSION` in `index.html` und `sw.js`: `2026-11-10 tutorial-fuehrung`.

  **Für den Poco-Test und die fremde Person** (auf dem Handy, ohne Hilfe, am Massstab der Spec), zu beobachten:
  - Versteht der Spieler das Wort **«Farbpfeile»** in «Schatten» (die drei farbigen Pfeilspitzen am Prisma)?
  - Tippt er in **«Umweg»** zuerst den **festen Spiegel** an, wie der erste Schritt sagt, oder dreht er gleich die
    runden (dann gilt die Lösung sofort, der feste bleibt ungelernt)?
  - Sieht das **Wackeln** fester Elemente auf dem Gerät gut aus, und merkt der Spieler, dass der Tipp angekommen ist?
  - Findet der Blick die **Kopfzeile** mit dem Satz? Sonst Textort D aus dem Katalog (Satz beim Element).
  - **15 s** bis zum späten Fingerzeig: zu früh, zu spät? Danach festlegen (`FUEHRUNG.fingerzeig`).
  - Nebenbei: «Ziele» in der Kopfzeile gegen «Kristall» in den Sätzen; ob in «Umweg» und «Farbenlehre» klar ist,
    was nach dem letzten Schritt noch zu tun ist; ob im Bergwald die Elemente danach richtig benutzt werden.
