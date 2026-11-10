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

- 10.11.2026, **Review** (unabhängig, Diff `4c3f2fa..46bb123`; Fix 21f5d50).

  Geprüft und in Ordnung:
  - **Mischung, `farbe`:** `lichtBei` nimmt am Kombinator `mixes` (seine Mischung samt Rückkopplung), sonst `hits`;
    `schrittErfuellt` verlangt die Farbe **exakt** (`=== COLORS[farbe]`). Das passt zum Satz «bis Rot und Blau den
    Kombinator treffen» und zu «sein Magenta» im dritten Schritt. Durchgerechnet über alle 8 Stellungen des Prismas und
    4 des Kombinators: Am Kombinator kommt nur 0, Rot, Grün, Blau oder Magenta an (nur bei rot 0), nie Weiss. «Exakt»
    und «enthält» sind hier also gleichwertig. Am Start (rot 7, Grün) schaltet der Schritt nicht, auch nicht über
    `beginneSchritt`. Logiktests kennen das Feld (Daten: nur bei «strahl», Farbe aus `COLORS`; Verhalten: Grün, Blau,
    Magenta).
  - **Umweg:** Der Löser (`tools/solver.mjs`) findet genau eine Lösung `{3,5: 3, 5,1: 1}`, mit und ohne Abschneiden;
    der Start ist nicht gelöst. `tests/golden.json` ist im Diff nicht geändert und muss es auch nicht: Im Start endet
    der Strahl am vorderen Spiegel, die Stellung von (5,1) steckt nicht im Abdruck. Golden ist grün. «Nicht zu früh» gilt
    weiter (Logiktest). Eine Breitensuche ohne Antippen des festen Spiegels löst mit **2 Zügen** (beide je einmal
    zurück). Das ist erlaubt und in der Spec unter «Nicht zu früh lösbar» vermerkt.
  - **Farbenlehre:** «{Tippe} Prisma und Spiegel: Das Prisma fächert nur auf, was ankommt.» hat 11 Wörter, ist
    neutral im Du und stimmt mit der Strahlregel (der Filter lässt Rot und Grün durch, das Prisma lenkt nur diese).
    Umweg: «{Drücke lang} auf die runden Spiegel, so drehen sie zurück.» hat 10 Wörter.
  - **`APP_VERSION`** ist in `index.html` und `sw.js` gleich: `2026-11-10 tutorial-fuehrung`.
  - **Doku** (Spec, STAND, CONTEXT, README, PLAN 1a.1, CLAUDE.md, Tabelle in Ticket 03) stimmt mit dem Code überein.

  Funde:
  - *Klein, behoben (21f5d50):* `lichtBei` kennt Farben nur am Kombinator und an Zielen. An jedem anderen Element
    wäre es 0 und der Schritt schaltete nie weiter. Der Datentest verlangt jetzt für `farbe` einen Kombinator oder ein
    Ziel als Zelle.
  - *Klein, behoben (21f5d50):* In STAND.md stand «jeden der 29 Schritte». Es gibt 23 Schritte; 29 gespielte sind es,
    weil Übung 2 und 3 auch in Leicht laufen.
  - *Beobachtung, kein Fehler:* In «Farbenlehre» steht der Spiegel (4,2) auf rot 1, die Lösung ist 0. Antippen
    braucht dorthin 3 Tipps, einmal lang Drücken nur einen. Der Satz sagt «Tippe», das stimmt, ist aber der lange Weg;
    der späte Fingerzeig zeigt danach das Zurück. Beim Poco-Test darauf achten, ob dreimal Tippen stört. Sonst den
    Spiegel auf rot 3 setzen: ein Tipp, Abdruck in `UEBUNGEN_OHNE_TEXT` neu.

  **Lücken bei `--uebersicht --menue`** (je zwei Läufe, `e426554` in einem temporären Worktree):

  | Lauf | Lücken über 100 ms |
  |---|---|
  | Branch 1 | 2: 212 ms «Übersicht → Spiel (Schliessen)», 412 ms «Übersicht → Menü» |
  | Branch 2 | 3: 142 ms «Spiel → Übersicht», 179 ms «Übersicht → Menü», 159 ms «letztes Level → Übersicht» |
  | `e426554` 1 | 2: 375 ms «Menü → Prolog», 161 ms «Spiel → Übersicht» |
  | `e426554` 2 | 1: 213 ms «Übersicht → Spiel (Schliessen)» |

  Die Lücken sind auf beiden Ständen dieselbe Art, an denselben Stellen. Meist fallen sie ins erste Bild nach einem Bild
  der Probe (bei 17–36 ms). Im Hauptthread läuft dabei nur 5–15 ms erfasste Arbeit. Die Führung kann sie nicht
  erklären:
  - Die Probe nimmt «Gleich los». Damit ist `fuehrung.level` null, und die SVG-Ebene `#fuehrung` wird nie gebaut
    (`baueBild` nur, wenn etwas sichtbar ist). `platziere` läuft nie, und keine ihrer CSS-Animationen läuft (im Dorf
    stehen sie unter `display: none`).
  - `weigernde` ist leer, dann gibt es keine Arbeit je Bild.
  - Die zusätzlichen Trefferzylinder der festen Elemente haben `visible: false` und werden nicht gezeichnet. Sie
    zählen nur beim Antippen, beim Raycast.
  - `getBoundingClientRect` gibt es nur in `pickElement` beim Antippen, nicht je Bild.
  - `verbergen` und `zeigen` in `hideHud` und `showHud` machen nur billige Prüfungen.

  Kein klares Muster, kein Fund im Vorhaben. Bleibt wie vermerkt: beim Poco-Test auf Ruckler beim Öffnen und
  Schliessen der Übersicht achten.

  Tests (Review):
  - Node alle grün: `logic` 2064, `golden` 847 Level, `vorrat` 18, `geschichte` 35, `levelliste` 54, `beurteilung`
    206, `ki-tester` 84, `generator` 31, `wuerfelliste` 20, `hall` 6.
  - `--dorf` Desktop: 29 gespielte Schritte, Unterbrechungen in «Brechung» ok. Rot nur bekannt: 426 ms «Menü → Prolog
    → Überspringen», 388 ms «Sehr schwer: Übersicht → Übung 8 wiederholen».
  - `--dorf --handy`: 29 Schritte und Unterbrechungen ok. Rot nur bekannt: 283 ms bei Übung 8. Diesmal kam keine
    Lücke im Einstieg ins Dorf.
  - `wackel-probe` mit `MOBILE=1` und am Desktop grün: Ausschlag 0,084 rad, Rand fünffach hell. In der Welt
    «Lichtblick» lag der Finger bei 51 % von 48,7 px auf der Seite des festen Spiegels, das Prisma drehte.

  Urteil: bereit zum Pushen für den manuellen Test.
