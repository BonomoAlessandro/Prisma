# 01: Sprache wechseln ohne Neuladen

**Spec:** ../spec.md

**Status:** ready-for-agent

**What to build:** Heute speichert ein Klick auf den Schalter der Sprache im Menü die neue Sprache und lädt die Seite
neu (`setzeSprache` in `src/texte/sprache.js`). Danach beginnt das Spiel wieder beim Startbildschirm. Neu lädt nichts
mehr neu: Das laufende Spiel zeigt ab dem Wechsel jeden Text in der neuen Sprache. Man bleibt im Menü, und Szene,
Himmel und Brett bleiben unverändert. Der Schalter selbst bleibt in diesem Ticket, wie er ist (ein Klick wählt die
nächste Sprache). Ticket 02 baut die Liste. Das Spiel sieht in beiden Sprachen genau gleich aus wie heute nach einem
frischen Laden.

- [ ] **Schicht** (`src/texte/sprache.js`): Die Sprache ist zur Laufzeit wechselbar. `t`, `levelTitel` und `sprache`
      folgen der aktuellen Sprache (etwa `export let sprache` als Live-Binding und ein `t`, das den Übersetzer der
      aktuellen Sprache nimmt). `setzeSprache(kuerzel)` speichert die Sprache wie heute (`einstellungen.setSprache`).
      Es setzt `lang` des Dokuments, Seitentitel, Beschreibung und Manifest (auch zurück auf `manifest.webmanifest`)
      und entfernt `?sprache=` ohne Neuladen aus der Adresse (`history.replaceState`). Dann meldet es den Wechsel
      (etwa ein Ereignis `sprachwechsel` oder eine Liste von Abonnenten). Gleiche oder unbekannte Sprache: nichts. Kein
      `location.reload` mehr.
- [ ] **Texte, die Module beim Laden holen**, werden beim Wechsel neu geholt. Die Verwender sollen davon nichts merken:
      Entweder werden die Objekte an Ort und Stelle neu befüllt, oder die Texte werden erst bei Bedarf gelesen. Bekannt
      (Stand 18.11.):
      - `src/seite/geschichte/daten.js`: `STORY_STATIONS`, die Kapitel (`STORY_CHAPTERS`), `STORY_FINALE`,
        `STORY_DORF`, Prolog und Epilog
      - `src/seite/levelfluss.js`: `GRAD_ANZEIGE`
      - `src/seite/oberflaeche/menue.js`: `GRADE`, `WELTEN`, `AKTION`
      - `src/seite/oberflaeche/uebersicht.js`: die Namen der Grade

      Selbst nach weiteren suchen: Konstanten mit Texten, Texte in Arrays oder Objekten, Texte in Canvas oder
      Texturen, Kopien von Texten in einem Zustand.
- [ ] **Einmal aufgebaute Teile** schreiben ihre Texte beim Wechsel neu:
      - das Gerüst des Menüs (Name, Untertitel, `aria-label` der Grade, Knöpfe der Rückfrage, der Schalter selbst)
      - das Gerüst der Übersicht
      - die festen Texte in `index.html` (`data-t …`)
      - der Überspringen-Knopf und der Hinweis der Bühne
      - der Text des Startbildschirms
      - das `aria-label` des Spielfelds

      Texte mit Zustand nicht auf den Grundtext zurücksetzen, etwa `aria-label` von `#btn-sound` (je nach Ton an oder
      aus), `#solved-msg`, `#btn-next` oder den Knopf «Überspringen» (je nach Lage der Geschichte). Diese setzt ihr
      Besitzer mit dem aktuellen Zustand neu.
- [ ] **Sichtbares:** Das offene Menü steht sofort in der neuen Sprache: Reiter, Karte, Knopf, Stand und eine offene
      Rückfrage. Ebenso alles, was nach dem Schliessen des Menüs wieder erscheint: Kopfzeile des Levels, Band der
      Führung, Meldung «gelöst», Knöpfe unten rechts (`title`, `aria-label`) und Untertitel der Geschichte. Prüfen, was
      die Knöpfe des Menüs tun (laden sie ein Level neu oder zeigen sie das laufende?) und von wo aus man das Menü
      öffnen kann (Level, Geschichte, Übersicht).
- [ ] **Bedienung:** Nach dem Wechsel bleibt der Fokus auf dem Schalter. Der Bildschirmleser hört die neue Sprache
      (Meldung über `.menue-sr` in der neuen Sprache, neuer Schlüssel in jeder Sprachdatei). Gewählter Reiter und
      Stand der Karte bleiben. Der Wechsel ruckelt nicht: Er baut keine Szene, keinen Himmel und kein Brett neu und
      startet keine Ladeanzeige.
- [ ] **Wahl beim Laden unverändert:** `?sprache=xx` zum Prüfen (nicht gespeichert), dann die gespeicherte Sprache,
      dann die des Geräts.
- [ ] **Tests:**
      - Node: Logiktest des Wechsels (Übersetzer folgt der neuen Sprache, Meldung an die Abonnenten, gleiche oder
        unbekannte Sprache tut nichts), in `npm test`.
      - **Bildvergleich mit Wechsel:** Eine neue Option (etwa `--wechsel`) beweist, dass keine Stelle vergessen ist.
        Chrome startet mit `--lang=de`, die Seite lädt also auf Deutsch. Dann wechselt sie live auf Englisch: in
        `welt-3-4` über das Menü wie ein Spieler, in den übrigen Abläufen vor dem ersten Bild über die
        Testschnittstelle (etwa `__prismaDebug.sprache('en')`). Danach läuft der Ablauf wie immer, und die Bilder
        müssen die englischen Referenzen (`en-…`) treffen, ohne neue Referenzen. Dasselbe umgekehrt (Englisch laden,
        live auf Deutsch, gegen die deutschen Referenzen).
      - **Unsichtbare Texte:** Eine Probe im Browser prüft nach dem Wechsel, dass kein Text im DOM (`textContent`,
        `aria-label`, `title`, `alt`, `content` der Beschreibung, `document.title`) noch in der alten Sprache steht.
        Etwa: kein Blatt der alten Sprachdatei, das in der neuen anders lautet (Blätter mit Platzhaltern bis zum
        ersten Platzhalter). Das gilt in Menü, Level (mit Führung im Dorf), Übersicht, Geschichte (Untertitel) und auf
        dem Startbildschirm.
      - Der bestehende Bildvergleich (de und en) bleibt grün, ohne neue Referenzen. Golden und alle Node-Tests bleiben
        grün. Die Proben, die das Menü oder die Geschichte betreffen, laufen auch.
- [ ] `appVersion` in `package.json` auf `2026-11-18 sprachwahl-1`.
- [ ] README (Übersetzungsschicht, neue Option des Bildvergleichs), `CONTEXT.md` (Sprachwahl, Abschnitt um Zeile
      288) und die Kopfkommentare (`sprache.js`, `menue.js`, `spielstand.js`) nachgeführt: Der Wechsel lädt nicht mehr
      neu.

## Hinweise

- Warum heute neu geladen wird: `.scratch/umbau/issues/07-uebersetzungsschicht.md`, Abschnitt «Schicht» («Weil ein
  Wechsel neu lädt, dürfen Module ihre Texte schon beim Laden holen»).
- `uebersetzeSeite()` in `sprache.js` setzt heute die `data-t`-Texte beim Laden. Für den Wechsel nur die Elemente ohne
  Zustand nehmen (siehe oben) oder die Besitzer der übrigen danach neu setzen lassen.
- Die Trennregeln der Übersicht (`TRENNREGELN[sprache]`) lesen die Sprache beim Aufruf. Mit einem Live-Binding passt
  das von selbst.
- Prüfläufe nach `CLAUDE.md` (Abschnitt Prüfläufe): Als Umsetzer nur Node-Tests, Golden, Bildvergleich auf der
  Grafikkarte (`--gpu`, auch mit `--wechsel`) und die Proben, die das Ticket direkt betrifft. Schwere Läufe nur über
  `tools/leise.sh` mit Zeitgrenze. Jeder Chrome läuft stumm (`--mute-audio`, `tools/chrome.mjs` macht das schon).
- Nicht committen. Der Koordinator committet nach dem Review.
