# 01: Sprache wechseln ohne Neuladen

**Spec:** ../spec.md

**Status:** done (Review 18.11.2026 bestanden)

**What to build:** Heute speichert ein Klick auf den Schalter der Sprache im Menü die neue Sprache und lädt die Seite
neu (`setzeSprache` in `src/texte/sprache.js`). Danach beginnt das Spiel wieder beim Startbildschirm. Neu lädt nichts
mehr neu: Das laufende Spiel zeigt ab dem Wechsel jeden Text in der neuen Sprache. Man bleibt im Menü, und Szene,
Himmel und Brett bleiben unverändert. Der Schalter selbst bleibt in diesem Ticket, wie er ist (ein Klick wählt die
nächste Sprache). Ticket 02 baut die Liste. Das Spiel sieht in beiden Sprachen genau gleich aus wie heute nach einem
frischen Laden.

- [x] **Schicht** (`src/texte/sprache.js`): Die Sprache ist zur Laufzeit wechselbar. `t`, `levelTitel` und `sprache`
      folgen der aktuellen Sprache (etwa `export let sprache` als Live-Binding und ein `t`, das den Übersetzer der
      aktuellen Sprache nimmt). `setzeSprache(kuerzel)` speichert die Sprache wie heute (`einstellungen.setSprache`).
      Es setzt `lang` des Dokuments, Seitentitel, Beschreibung und Manifest (auch zurück auf `manifest.webmanifest`)
      und entfernt `?sprache=` ohne Neuladen aus der Adresse (`history.replaceState`). Dann meldet es den Wechsel
      (etwa ein Ereignis `sprachwechsel` oder eine Liste von Abonnenten). Gleiche oder unbekannte Sprache: nichts. Kein
      `location.reload` mehr.
- [x] **Texte, die Module beim Laden holen**, werden beim Wechsel neu geholt. Die Verwender sollen davon nichts merken:
      Entweder werden die Objekte an Ort und Stelle neu befüllt, oder die Texte werden erst bei Bedarf gelesen. Bekannt
      (Stand 18.11.):
      - `src/seite/geschichte/daten.js`: `STORY_STATIONS`, die Kapitel (`STORY_CHAPTERS`), `STORY_FINALE`,
        `STORY_DORF`, Prolog und Epilog
      - `src/seite/levelfluss.js`: `GRAD_ANZEIGE`
      - `src/seite/oberflaeche/menue.js`: `GRADE`, `WELTEN`, `AKTION`
      - `src/seite/oberflaeche/uebersicht.js`: die Namen der Grade

      Selbst nach weiteren suchen: Konstanten mit Texten, Texte in Arrays oder Objekten, Texte in Canvas oder
      Texturen, Kopien von Texten in einem Zustand.
- [x] **Einmal aufgebaute Teile** schreiben ihre Texte beim Wechsel neu:
      - das Gerüst des Menüs (Name, Untertitel, `aria-label` der Grade, Knöpfe der Rückfrage, der Schalter selbst)
      - das Gerüst der Übersicht
      - die festen Texte in `index.html` (`data-t …`)
      - der Überspringen-Knopf und der Hinweis der Bühne
      - der Text des Startbildschirms
      - das `aria-label` des Spielfelds

      Texte mit Zustand nicht auf den Grundtext zurücksetzen, etwa `aria-label` von `#btn-sound` (je nach Ton an oder
      aus), `#solved-msg`, `#btn-next` oder den Knopf «Überspringen» (je nach Lage der Geschichte). Diese setzt ihr
      Besitzer mit dem aktuellen Zustand neu.
- [x] **Sichtbares:** Das offene Menü steht sofort in der neuen Sprache: Reiter, Karte, Knopf, Stand und eine offene
      Rückfrage. Ebenso alles, was nach dem Schliessen des Menüs wieder erscheint: Kopfzeile des Levels, Band der
      Führung, Meldung «gelöst», Knöpfe unten rechts (`title`, `aria-label`) und Untertitel der Geschichte. Prüfen, was
      die Knöpfe des Menüs tun (laden sie ein Level neu oder zeigen sie das laufende?) und von wo aus man das Menü
      öffnen kann (Level, Geschichte, Übersicht).
- [x] **Bedienung:** Nach dem Wechsel bleibt der Fokus auf dem Schalter. Der Bildschirmleser hört die neue Sprache
      (Meldung über `.menue-sr` in der neuen Sprache, neuer Schlüssel in jeder Sprachdatei). Gewählter Reiter und
      Stand der Karte bleiben. Der Wechsel ruckelt nicht: Er baut keine Szene, keinen Himmel und kein Brett neu und
      startet keine Ladeanzeige.
- [x] **Wahl beim Laden unverändert:** `?sprache=xx` zum Prüfen (nicht gespeichert), dann die gespeicherte Sprache,
      dann die des Geräts.
- [x] **Tests:**
      - Node: Logiktest des Wechsels (Übersetzer folgt der neuen Sprache, Meldung an die Abonnenten, gleiche oder
        unbekannte Sprache tut nichts), in `npm test`.
      - ~~**Bildvergleich mit Wechsel** (`--wechsel`)~~: gestrichen (Entscheid des Nutzers 18.11.2026: keine grossen
        Testläufe, kein ganzer Bildvergleich; `tests/bildvergleich.mjs` bleibt unverändert).
      - **Gezielte Probe statt dessen** (`tests/sprachwechsel-probe.mjs`, ein Lauf, eine Grösse, leichter Lauf): Spiel
        auf Deutsch laden, im Menü wechseln und zurück, kein Neuladen, das Menü sofort in der neuen Sprache, und im DOM
        (`textContent`, `aria-label`, `title`, `alt`, `content` der Beschreibung, `document.title`) kein Text der alten
        Sprache, der in der neuen anders lautet (Blätter mit Platzhaltern bis zum Platzhalter); dazu nach dem Schliessen
        des Menüs in Level (mit Führung im Dorf), Übersicht, Geschichte (Untertitel, Bühne) und auf dem
        Startbildschirm.
      - Node-Tests und Typecheck grün; Golden und andere Proben nur, wenn ihr Teil direkt geändert ist.
- [x] `appVersion` in `package.json` auf `2026-11-18 sprachwahl-1`.
- [x] README (Übersetzungsschicht, ~~neue Option des Bildvergleichs~~ die neue Probe), `CONTEXT.md` (Sprachwahl, Abschnitt um Zeile
      288) und die Kopfkommentare (`sprache.js`, `menue.js`, `spielstand.js`) nachgeführt: Der Wechsel lädt nicht mehr
      neu.

## Hinweise

- Warum heute neu geladen wird: `.scratch/umbau/issues/07-uebersetzungsschicht.md`, Abschnitt «Schicht» («Weil ein
  Wechsel neu lädt, dürfen Module ihre Texte schon beim Laden holen»).
- `uebersetzeSeite()` in `sprache.js` setzt heute die `data-t`-Texte beim Laden. Für den Wechsel nur die Elemente ohne
  Zustand nehmen (siehe oben) oder die Besitzer der übrigen danach neu setzen lassen.
- Die Trennregeln der Übersicht (`TRENNREGELN[sprache]`) lesen die Sprache beim Aufruf. Mit einem Live-Binding passt
  das von selbst.
- Prüfläufe (seit 18.11.2026 knapp, Entscheid des Nutzers): Node-Tests, Typecheck und die gezielte Probe oben, kein
  Bildvergleich. Schwere Läufe nur über `tools/leise.sh` mit Zeitgrenze. Jeder Chrome läuft stumm (`--mute-audio`, `tools/chrome.mjs` macht das schon).
- Nicht committen. Der Koordinator committet nach dem Review.

## Notizen der Umsetzung (18.11.2026)

Umsetzer, Branch `feature/sprachwahl` (Basis 39d39f2), nicht committet.

**Ansatz.** Drei Teile: (1) Die Schicht wechselt zur Laufzeit, (2) Texte in Daten holen Getter erst beim Lesen, (3) wer
Texte ins Dokument geschrieben hat, schreibt sie bei einer Meldung mit seinem Zustand neu, auch verborgene.

- **Schicht.** Neuer Kern `sprachSchicht(sprachen, sprache, { touch, fehler })` in `src/texte/uebersetzung.js` (rein,
  in Node geprüft): `t`, `titel`, `sprache` folgen der aktuellen Sprache; `wechsle(k)` stellt um und meldet allen
  Abonnenten `{ sprache, vorher }` in ihrer Reihenfolge (wirft einer, kommen die übrigen trotzdem dran, Fehler an die
  Konsole); gleiche oder unbekannte Sprache: nichts. `src/texte/sprache.js`: `export let sprache` (Live-Binding), `t`
  und `levelTitel` aus der Schicht, `beiSprachwechsel(fn)`, `setzeSprache(k)` speichert, nimmt `?sprache=` mit
  `history.replaceState` aus der Adresse (übrige Parameter wörtlich, `?nointro` bleibt ohne `=`), stellt um; kein
  `location.reload`. Als erster Abonnent stellt sprache.js das Dokument um: `lang`, feste Texte (`uebersetzeSeite`
  ohne die Teile mit Zustand), Seitentitel, Beschreibung, Manifest (auch zurück auf `manifest.webmanifest`; nur
  gesetzt, wenn es sich ändert). Testschnittstelle `__prismaDebug.sprache(k)` (schleife.js).
- **Texte mit Zustand in index.html:** neues Attribut `data-zustand` (`text` bzw. `aria-label`) an `#btn-sound`
  (aria-label), `#solved-msg`, `#btn-next`, `#btn-skip`, `#intro .start span`. Beim Laden setzt `uebersetzeSeite` sie
  wie bisher, beim Wechsel nicht; ihr Besitzer setzt sie mit seinem Zustand. (Nicht `data-t-…` genannt: texte.test
  läse den Wert sonst als Schlüssel.)
- **Daten mit Gettern:** `daten.js` (`STORY_STATIONS`, Kapitel, `STORY_FINALE`, `STORY_DORF` samt Angebot und
  Einstieg, Prolog, Epilog; Hilfe `textAn` für Arrays), `GRAD_ANZEIGE` (levelfluss.js), `GRADE`/`WELTEN` im Menü
  (statt `AKTION` die Funktion `aktionName`), `GRADE` der Übersicht, `story.overviewData` (Name der Welt, Titel der
  Level). Dieselben Objekte bleiben (Vergleiche wie `folge === STORY_EPILOG` gelten weiter). Trennregeln der Übersicht
  bei jedem Aufruf (waren einmal beim Bauen gelesen, anders als im Ticket vermutet).
- **Abonnenten:** Menü (Gerüst, Schalter, Rückfrage, Reiter und Knopf über `render` aus dem gemerkten Stand, Namen
  auf der Karte an Ort und Stelle, damit ein Erwachen weiterläuft; Fokus über `data-menue-fokus` zurück; offen: Ansage
  `menue.spracheGewechselt` über `.menue-sr`, zu: alte Meldung leer); Übersicht (Gerüst, Legende, Inhalt aus denselben
  Daten, Seite, Fokus und Tab-Kachel bleiben, Hinweis leer); ui (Startbildschirm je Gerät, Ton an/aus, Kopfzeile des
  zuletzt gezeigten Levels über `hudTexte` samt Zielen, «Gelöst» über `geloestTexte`); Führung (Band aus gemerkten
  Schlüsseln, `bandTexte`); Geschichte (`#btn-skip` mit gemerktem Fall, Untertitel aus `captionInhalt`; `fillCaption`
  und `caption` nehmen dafür auch eine Funktion; eine weggetippte Aufforderung bleibt weg); Bühne (`say`, `vorSagen`,
  `kicker`, `actions` nehmen Text oder Funktion, die Bühne merkt sich die Quellen; dazu «Überspringen» und Hinweis);
  szene.js (`aria-label` des Spielfelds).
- **Neuer Schlüssel** `menue.spracheGewechselt` in `de.json` («Das Spiel ist jetzt auf {sprache}.») und `en.json`
  («The game is now in {sprache}.»).
- Nebenbei: `hudTexte` leert den Grad (`#hud-grad`) ausserhalb der Geschichte (verborgen; vorher blieb dort der Grad
  eines früheren Levels stehen, die Probe fand ihn nach dem Wechsel auf der Reise).
- Tests: `tests/texte.test.mjs` zwei neue Tests des Wechsels (Kern); `tests/levelliste.test.mjs` liest
  `GRAD_ANZEIGE` jetzt bis `};` (die Getter enthalten Strichpunkte); neu `tests/sprachwechsel-probe.mjs`.
- Doku: README (Übersetzungsschicht, texte.test, neue Probe samt Tabelle der Läufe), `CONTEXT.md`
  (Übersetzungsschicht), Kopfkommentare `sprache.js`, `uebersetzung.js`, `menue.js`, `spielstand.js`; `appVersion`
  `2026-11-18 sprachwahl-1`.
- Bildvergleich: nach dem neuen Entscheid nicht gebaut; eine schon begonnene Option `--wechsel` wieder entfernt,
  `tests/bildvergleich.mjs` unverändert.

**Prüfungen** (alle über `tools/leise.sh`, `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100`):

- `node tests/alle.mjs logic texte testschnittstelle levelliste speicher ki-tester typecheck` (Endstand, 15:21–15:24):
  **grün** (logic 67 s, levelliste 95 s, texte 2 s, testschnittstelle 2 s, ki-tester 6 s, speicher, typecheck).
  Davor ein Lauf rot nur an testschnittstelle: Strings der neuen Probe sahen für den Parser wie freie Namen aus (`$`
  in einem Regex, `.menue-sprache`); in der Probe umformuliert (Selektor über `data-menue-fokus`).
- `node tests/sprachwechsel-probe.mjs --gpu` (Desktop 1280 × 800, Endstand): **grün** in 146 s. 16 Wechsel (de ⇄ en)
  in Startbildschirm, Menü (Schalter hin und zurück, Rückfrage), Prolog, Angebot, Einstieg ins Dorf, Übung 1 mit Band,
  Menü aus der Übung und zurück, «Gelöst», Übersicht, «Gelöst» am Ende des Bergwalds, Reise ans Meer, Epilog; nach
  jedem kein Text der alten Sprache im DOM (Gegenprobe davor: 86–361 Texte gefunden), kein Neuladen, dasselbe Brett,
  derselbe Himmel, keine Ladeanzeige, gespeichert, Manifest; Fokus auf dem Schalter, Reiter und Karte gleich, Ansage
  in der neuen Sprache; `?sprache=` aus der Adresse, Neuladen mit gespeicherter Sprache, `?sprache=` gilt ohne zu
  speichern; Konsole leer. Ein Wechsel über die Testschnittstelle dauerte 3–45 ms.
- Nicht gelaufen (bewusst, neuer Umfang): Bildvergleich, Golden (Logik und Löser unberührt), `geschichte-probe` und
  übrige Proben, ganzes `npm test` (geschichte, vorrat, generator, beurteilung, wuerfelliste, hall, leise: ihr Code ist
  nicht berührt).

**Offen / Risiken:**

- Kein Bildvergleich: Dass das Spiel nach dem Wechsel *pixelgleich* zu einem frischen Laden aussieht, ist nicht
  geprüft, nur dass kein alter Text bleibt. Am ehesten abweichen könnte das Menü (Reiter neu gebaut, Namen auf der Karte
  an Ort und Stelle getauscht) und die Übersicht (neu gezeichnet).
- Die Probe läuft nur auf dem Desktop (Maus); Handy (Finger, Texte je Gerät), Handy quer und `?sprache=en` als
  Ausgangssprache nicht geprüft.
- Nicht neu gesetzt: die Meldung bei verlorenem Grafikkontext in `#hud-sub` (ein Wechsel danach überschreibt sie mit
  der Unterzeile des Levels; das Spiel ist dann ohnehin kaputt).
- Ein Wechsel während eines Erwachens auf der Karte des Menüs ist nicht geprüft (die Namen werden an Ort und Stelle
  getauscht, das Bild nicht neu gezeichnet, gedacht damit es weiterläuft).

## Review (18.11.2026)

Unabhängiges Review der uncommitteten Änderungen gegenüber `a0b37e4` bzw. `897ea16` (die Commits dazwischen sind nur
Doku anderer Tickets). Zwei Achsen (Gepflogenheiten des Repos, Ticket), dazu eine eigene Suche nach Texten, die nach
einem Wechsel in der alten Sprache stehen bleiben könnten, und gezielte Läufe (Entscheid des Nutzers: kein ganzer
Bildvergleich, nicht die ganze Applikation; Golden nicht, Logik und Löser sind unberührt).

**Befunde**

- Kein Text der alten Sprache gefunden: Jeder Aufruf von `t(` und `levelTitel(` in `src/` liegt in einer Funktion, die
  beim Wechsel neu läuft, hinter einem Getter oder in einem Abonnenten. Kein Text in Canvas oder Texturen (kein
  `fillText`). Kopien, die einen Getter einfrieren, werden beim Wechsel neu gelesen (`lies` im Menü aus `stand0`,
  `baueReihen` der Übersicht; `JSON.stringify(daten)` der Übersicht wertet die Getter aus). Der Spread in
  `geschichte.js:683` überschreibt `text` selbst. Identitätsvergleiche (`folge === STORY_EPILOG`) gelten weiter.
- Texte mit Zustand richtig: `#btn-sound` (aria-label je Ton), «Gelöst»/«Weiter» (`story.solvedText` bzw.
  Grundtext), «Überspringen» (`skipEinstieg`), Startbildschirm je Gerät, eine weggetippte Aufforderung bleibt weg.
  `uebersetzeSeite(true)` lässt die Teile mit `data-zustand` aus, ihre Besitzer setzen sie danach.
- Abonnenten: Menü, Übersicht, `ui.init`, `story.init` und die Bühne (`makeScene` über `??=`) entstehen je einmal, also
  keine doppelten Abonnenten. Die Bühne räumt abgehängte Elemente aus `quellen` (`platzFuer`, `actions`).
- Wahl beim Laden unverändert (`spracheWaehlen` mit denselben Eingaben, Manifest beim Laden wie vorher); in der Probe
  geprüft (Neuladen ohne und mit `?sprache=`).
- Klein, offen gelassen (alles verborgen oder latent, kein Auflagepunkt):
  - `ui.hudIndex` und `ui.geloest` (`ui.js:51`, `:53`) werden nie zurückgesetzt. `sprachwechsel` schreibt darum die
    verborgene Kopfzeile bzw. «Gelöst» eines früheren Levels mit dem jetzigen Stand der Geschichte neu; ist
    `story.drives` für das alte Level falsch, wird in der verborgenen Kopfzeile `#hud-tier` sichtbar. Das nächste
    `showHud`/`showSolved` (auch `story.resume`) setzt alles neu; ein Spieler wechselt nur bei offenem Menü, dann ist
    die Kopfzeile ausgeblendet. Ein Zurücksetzen in `hideSolved` liesse alte Texte in Zeit und Drehungen stehen, darum
    so belassen.
  - «Grafik verloren» (`szene.js:79–82`) geht bei einem Wechsel verloren (wie in den Notizen des Umsetzers).
  - `abonniere` hat kein Abmelden (`uebersetzung.js`): heute ohne Folgen, weil jeder Baustein einmal entsteht; wer
    `createMenu`/`createUebersicht` später mehrfach erzeugt, braucht es.
  - `etiketten()` (`menue.js:465`) hängt an der Reihenfolge der Namen in `zeichne` (Stern i + 1); stimmt heute.
  - Gepflogenheiten (Ermessen, nicht geändert): Texte stehen beim Aufbau und im Abonnenten doppelt (`szene.js:49/51`,
    `ui.js:62/227`, `buehne.js:1072/1075`, Menü- und Übersichtsgerüst); «Text oder Funktion» viermal
    (`buehne.js:301`, `geschichte.js:1827`, `:1842`, `:1867`); `story.sprachwechsel` wiederholt den Textteil von
    `fillCaption`; die Tabelle der Grade steht dreimal (`levelfluss.js`, `menue.js`, `uebersicht.js`);
    `STORY_STATIONS` als Tupel braucht `textAn` mit `defineProperty`; `fuehrung.js:240/243` legt Zustand
    (`satzSchluessel`, `nebenSchluessel`) auf den Cache der DOM-Teile statt als Feld oben; `let sprache`
    (`sprache.js`) folgt der Schicht über den ersten Abonnenten. Kein Kommentar sagt mehr «lädt neu», kein Eszett.
  - Die Probe wechselt ausser im Menü über die Testschnittstelle (wie der Schalter: `setzeSprache`). Ein Spieler kann
    nur im Menü wechseln; die Prüfung in den anderen Lagen ist für das Dokument strenger.
- Probe auf dem Handy: `tippe` schickte Mausereignisse, die mit der Touch-Emulation nie zurückkommen (erster Lauf mit
  `--handy` hing im Ablauf `menue`: «keine Antwort auf Input.dispatchMouseEvent»). Behoben (siehe unten).

**Selbst behoben**

- `tests/sprachwechsel-probe.mjs`: neue Optionen `--handy` (390 × 844, Touch, wie im Bildvergleich) und `--von en`
  (Ausgangssprache Englisch, Chrome englisch); `tippe` auf dem Handy mit `Input.dispatchTouchEvent` (wie
  `geschichte-probe.mjs`); Kopf und Aufruf nachgeführt.
- README: Eintrag der Probe mit den neuen Optionen.
- `src/spielstand.js`: Kopfkommentar «sie gilt beim nächsten Start» (las sich wie «erst dann») zu «sie gilt sofort und
  bei jedem weiteren Start».

**Prüfungen** (alle `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 … node …`)

- `node tests/alle.mjs logic texte testschnittstelle levelliste speicher ki-tester typecheck` (Stand des Umsetzers),
  15:29–15:32 (2 min 34 s): grün (logic 78 s, levelliste 63 s, ki-tester 7 s, übrige je 0–2 s).
- Nach den eigenen Änderungen `node tests/alle.mjs testschnittstelle texte speicher` (15:38, 21 s): grün.
- `node tests/sprachwechsel-probe.mjs --gpu` (Desktop, Deutsch zuerst): 197 s, **GRÜN**, 14 Wechsel, je kein Text der
  alten Sprache (Gegenprobe 86–361 Texte), Konsole leer; ein Wechsel 4–150 ms (vier leichte Läufe gleichzeitig).
- `node tests/sprachwechsel-probe.mjs --gpu --von en` (Desktop, Englisch zuerst): 217 s, **GRÜN**, 14 Wechsel, 6–59 ms.
- `node tests/sprachwechsel-probe.mjs --gpu --handy` (Handy hochkant mit Touch): erster Lauf rot am Fehler der Probe
  (abgebrochen), nach der Korrektur 153 s, **GRÜN**, 14 Wechsel (Schalter mit dem Finger, Fokus bleibt), 6–57 ms.
- Aussehen nach dem Wechsel (eigenes Skript ausserhalb des Repos, gleiche Mittel wie `tests/bildvergleich.mjs`:
  `?t=12&noadapt`, Stand wie `welt-3-4` im localStorage, Animationen angehalten, vorgespult, bis zwei Aufnahmen gleich
  sind; GPU): Menü nach einem Wechsel de → en über die Testschnittstelle und Übersicht nach de → en → de, Öffnen und
  Wechsel zu en bei offener Übersicht, je gegen ein frisches Laden mit `?sprache=en` im selben Zustand (Fokus und
  gewählter Reiter gleich). Desktop 1280 × 800 (89 s) und Handy hochkant 390 × 844 (105 s): alle vier Bilder
  **byte-gleich** (PNG).
- Nicht gelaufen (Entscheid des Nutzers): Bildvergleich, Golden, übrige Proben, ganzes `npm test`; Handy quer und
  Pixeldichte über 1 nicht geprüft; ein Wechsel während eines Erwachens auf der Karte nicht geprüft.

**Urteil:** bestanden. Der Wechsel lädt nicht neu, kein Text der alten Sprache bleibt (auch nicht verborgen), Menü und
Übersicht sehen nach dem Wechsel genau aus wie nach einem frischen Laden, auf Desktop und Handy, von Deutsch und von
Englisch aus. Die offenen Punkte oben sind klein und betreffen verborgene Teile oder spätere Umbauten.
