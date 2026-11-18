# 07: Übersetzungsschicht, deutsche Texte, Sprachwahl

**Spec:** ../spec.md

**Status:** done (Review 18.11.2026 bestanden)

**Blocked by:** 06

**What to build:** Alle Texte, die der Spieler sieht, kommen über eine Übersetzungsschicht aus einer JSON-Datei je
Sprache. In diesem Ticket gibt es nur Deutsch, das Spiel sieht genau gleich aus. Dazu kommt die Sprachwahl, damit
Ticket 08 nur noch eine Datei ergänzen muss. **Meilenstein 1** (erster Handytest, der nach 02 entfällt): Danach spielt der Nutzer auf dem Handy die deutsche
Fassung.

- [x] Modul mit `t('schluessel', { werte })`. Platzhalter wie heute («{Tippe}», «{Drücke lang}» je Gerät) und Werte
      (z. B. «Übung {n} / {N}») gehen darüber. Fehlt ein Schlüssel in einer Sprache, gilt der deutsche Text.
- [x] `src/texte/de.json` (oder ähnlich) mit allen Texten: Menüs, Kopfzeile, Einstellungen, Übersicht, Band und
      Schritte der Führung, Hinweise nebenbei, Prolog, Reisen, Finale, Epilog, Titel der Level, Seitentitel. Auch
      Texte in den Daten aus Ticket 06 werden zu Schlüsseln.
- [x] Kein Text, den der Spieler sieht, steht mehr fest im Code. Ein Test sucht nach deutschen Wörtern im Code der
      Oberfläche, die nicht über `t()` laufen (mit Liste bewusster Ausnahmen).
- [x] Test: Jede Sprachdatei hat genau die Schlüssel von `de.json`, und jeder Platzhalter im Deutschen steht auch in der
      Übersetzung. Die Regeln der Führung (höchstens 18 Wörter und 105 Zeichen je Schritt, 16 Wörter je Hinweis)
      gelten je Sprache.
- [x] **Sprachwahl:** Beim ersten Start die Sprache des Geräts (`navigator.language`: Deutsch bei `de*`, sonst
      Englisch; solange es `en.json` noch nicht gibt, Deutsch). In den Einstellungen ein Schalter für die Sprache, über
      die Speicherschicht gespeichert. Ein Wechsel wirkt sofort oder nach einem Neuladen, je nachdem, was einfacher und
      sauber ist.
- [x] `lang` des Dokuments folgt der Sprache.
- [x] Bildvergleich (auf Deutsch), Golden, alle Tests und Proben grün; der neue Schalter in den Einstellungen bekommt ein
      neues Referenzbild (bewusste Änderung, unter «Comments» festhalten).
- [x] Der Bildvergleich legt Deutsch fest (z. B. `--lang=de-CH`, `setLocaleOverride` oder `?lang=de`), weil
      Headless-Chrome sonst die Sprache des Rechners bzw. Englisch meldet (Fund Review 01).
- [x] Begriff «Übersetzungsschicht» in `CONTEXT.md`.

## Comments

### Umsetzung

Umsetzer, 17.11.2026, Branch `ticket/umbau-07` ab dem Stand von Ticket 06 (`2c86ded`, noch im Review). Commits:
`0288a01` (07a: Schicht, Texte, Tests, Werkzeuge), `64d9ce3` (07b: Schalter der Sprache, neue Referenzbilder), dazu
README/`CONTEXT.md` und dieser.

**Schicht.** `src/texte/uebersetzung.js` ist der reine Kern (auch für Node): `nachschlagen`, `uebersetzer(sprachen,
sprache, touch)` → `t(schluessel, werte)`, `titelVon`, `spracheWaehlen`, `platzhalter`, `blaetter`. Eine Sprachdatei
ist JSON mit Bereichen; ein Blatt ist ein Text oder ein Text je Gerät `{ touch, maus }` («Tippen»/«Klicken»).
Platzhalter `{name}` nehmen zuerst einen Wert aus `werte`, sonst ein Wort je Gerät aus dem Bereich `geraet` (`{Tippe}`,
`{Drücke lang}` wie bisher, nur jetzt in der Sprachdatei statt `SCHRITT_PLATZHALTER` in der Logik); `werte.touch`
wählt das Gerät für einen Aufruf (Proben prüfen so beide). Fehlt ein Schlüssel, gilt Deutsch, fehlt er auch dort, der
Schlüssel selbst. `src/texte/sprache.js` (Seite) lädt alle `src/texte/*.json` mit `import.meta.glob` (Ticket 08 legt nur
`en.json` daneben), wählt die Sprache (`?sprache=` zum Prüfen, ungespeichert; sonst `prisma.sprache`; sonst
`navigator.language`: `de*` Deutsch, sonst Englisch, solange es `en.json` gibt, sonst Deutsch), setzt `lang` des
Dokuments und die festen Texte von `index.html` (`data-t`, `data-t-title`, `data-t-aria-label`, `data-t-content`),
gleich beim Laden, vor dem Startbildschirm. Es importiert nichts aus `src/seite/` (die Reihenfolge der Teile bleibt).
Weil ein Wechsel neu lädt, dürfen Module ihre Texte schon beim Laden holen (`GRAD_ANZEIGE`, `STORY_CHAPTERS`,
`STORY_PROLOG` …, nur die Literale ersetzt). Speicher: `einstellungen.sprache()`/`setSprache()` in
`src/spielstand.js`, neuer Schlüssel `prisma.sprache`, geschrieben erst bei einem Wechsel; die bestehenden Schlüssel
unverändert (`speicher.test` grün).

**Texte.** `src/texte/de.json`: 179 Texte und 244 Titel (Startbildschirm, Seitentitel und Beschreibung, Steuerung,
Kopfzeile, «Gelöst», Grade, Welten, Menü samt Rückfrage und Bildschirmleser, Übersicht samt Bildschirmleser, Bühne,
Untertitel, Kapitel (Titel, Reise, Ende, Weiter), Dorf, Finale, Prolog, Epilog, Führung (Weiter, 16 Schritte, 2 Hinweise
nebenbei), Titel der Level). Umgestellt: `index.html`, `ui.js`, `levelfluss.js` (`GRAD_ANZEIGE`), `szene.js`
(`aria-label` des Spielfelds, Meldung bei verlorenem Grafikkontext), `menue.js`, `uebersicht.js`, `fuehrung.js`,
`geschichte/daten.js`, `geschichte.js`, `buehne.js` (dort stand noch ein «Überspringen» im Markup), `schleife.js`.
Nicht übersetzt (bewusst, Liste im Test): «Prisma»/«PRISMA» (Name), die Kennung `'sehr schwer'`, Protokoll und
Warnungen für Entwickler (`pending` in `szene.js`, Protokoll der Arbeit), die Leistungsanzeige `leistung.js` (`?perf`),
Meldungen an die Konsole und Fehler.

**Daten aus Ticket 06 → Schlüssel.** Die Schritte der Übungen in `src/daten/level.js` nennen `text:
'fuehrung.schritt.<übung>.<n>'` (umgewandelt mit einem Skript nur für dieses Ticket); `NEBENBEI` in `src/logik.js`
nennt `text: 'fuehrung.nebenbei.kamera'` (Blatt je Gerät); `geraeteText`/`SCHRITT_PLATZHALTER` sind weg (das macht
`t`). Die Titel (`titel:` in 240 Namenszeilen von `FLACH`) sind aus den Leveldaten entfernt und stehen in `de.json`
unter `titel` (Name → Titel, zuerst die vier Übungen mit ihrem Namen als Titel, dann in der Reihenfolge von `FLACH`).
Angezeigt wird `levelTitel(lvl)` (ohne Eintrag der Name, z. B. ein Kandidat der KI-Tester). Die Übersicht bekommt die
Namen der Welten aus `welt.*` statt `title.replace(/^(Der|Die|Das) /, '')`.

**Werkzeuge.** `tools/texte.mjs` (Sprachdateien lesen, feste Form schreiben, Zeilenenden wie in der Datei wegen
`core.autocrlf`). `tools/geschichte.mjs spiel` schreibt die Titel jetzt nach `de.json` (`mitTitelnInTexten`,
`leseMitTexten`; ein Feld `titel` in den Leveldaten entfernt es); `spiel --trocken` am echten Stand: «… stimmen schon,
nichts zu schreiben». Generator, Ausbau, `vorrat.mjs`, `ordne-level`/`ordne-wuerfel` und KI-Tester brauchten nichts
(sie lesen/schreiben `titel` nur wahlweise; `shots.mjs` setzt die Kopfzeile selbst, ein Kandidat zeigt seinen Namen).
`tools/chrome.mjs`: Option `sprache`, Vorgabe `--lang=de` für alle Proben und den Bildvergleich (gemessen: `--lang=en-US`
gibt `en-US`; `Emulation.setLocaleOverride` ändert `navigator.language` nicht, darum nicht das).

**Tests.** Neu `tests/texte.test.mjs` (in `npm test`): Schlüssel jeder Sprache = `de.json` (gleiche Art je Blatt),
Platzhalter gleich, `de.json` in fester Form; jeder Schlüssel aus dem Code (auch Muster aus Templates und `?:`, `data-t`,
Schritte, `NEBENBEI`) steht in `de.json`, und jeder dort wird genannt; Titel = genau die Level im Spiel; die Regeln der
Führung je Sprache und Gerät (Schritt 3–18 Wörter, ≤ 105 Zeichen, ≤ 2 Sätze, keine unbekannten Platzhalter; Hinweis ≤ 16
Wörter; bisher in `logic.test`, dort bleiben nur Zahl und Aufbau der Schritte); Suche nach deutschem Text im Code der
Oberfläche (Parser von TypeScript, mit Gegenprobe und Liste `AUSNAHMEN`); Kern (Rückfall, Platzhalter, Gerät, Wahl der
Sprache). Angepasst: `logic.test` (Schritte über `t`), `levelliste.test` (`GRAD_ANZEIGE` mit `t`), `geschichte.test`
(Titel aus `de.json`, neuer Titel ändert nur seine Zeile), `geschichte-probe` (`t(…, { touch })` statt `geraeteText`,
`levelTitel` statt `titel ?? name`; `t`, `levelTitel` in der Testschnittstelle).

**Sprachwahl.** Das Spiel hat keine Einstellungen; der Schalter steht oben rechts im Menü (Globus und «DEUTSCH», wie
«Von vorn» zurückhaltend). Ein Klick wählt die nächste Sprache mit Datei, speichert sie und lädt die Seite neu (danach
kommt der Startbildschirm). Mit nur `de.json` ändert er nichts. Geprüft mit einer vorübergehenden `en.json` (Kopie,
nicht im Repo) in Chrome mit `--lang=en-US`: Start auf Englisch (`lang="en"`), Klick → Deutsch gespeichert, neu
geladen; Klick → Englisch; `?sprache=en` wirkt; Konsole leer.

### Geänderte Referenzbilder (bewusst)

Je in `tests/bildvergleich/referenz/` (SwiftShader) und `referenz-gpu/` (`--gpu`), geschrieben mit `--write --nur
welt-3-4 --groesse desktop,handy,quer`, danach die übrigen Bilder der Gruppe zurückgesetzt (`git checkout`):
`desktop-menue.jpg`, `handy-menue.jpg`, `quer-menue.jpg` – nur der neue Schalter der Sprache oben rechts. Vorher
zeigte der Vergleich genau diese drei rot (GPU: 965/755/762 Pixel, grösste Abweichung 127–131), alle übrigen der
Gruppe mit Abweichung 0. Sonst kein Bild geändert; `poco` hat kein Menübild.

### Läufe

Alle über `tools/leise.sh` (`LEISE_MAX_CPU=100 LEISE_CPU=100`), leichte mit `LEISE_ART=leicht`, die Probe allein.

- **Bildvergleich `--gpu` ganz auf 07a (ohne Schalter): GRÜN**, 77 Bilder in 10 min 51 s, 73 mit Abweichung 0, sonst
  1, 3, 6 (Sternpunkte); `poco-welt-2-vor` «fast ruhig» (0 Pixel). Also sieht das Spiel mit der Schicht genau gleich aus.
- Mit Schalter, vor dem Schreiben: `--gpu --nur welt-3-4 --groesse desktop,handy,quer`: nur die drei Menübilder rot
  (siehe oben), die 15 übrigen Abweichung 0. Danach die Referenzen geschrieben (GPU und SwiftShader, SwiftShader neben
  `npm test` 19 min).
- **Bildvergleich `--gpu` ganz am Schluss (07b): GRÜN**, 77 Bilder in 10 min 22 s, 75 mit Abweichung 0, zwei mit 1, eines
  mit 6. Der Lauf prüft jetzt auch `navigator.language` (de) und `lang` des Dokuments.
- **`npm test` am Schluss: alles grün** in 23 min 21 s (golden 17 s, logic 187 s, hall, speicher, testschnittstelle,
  texte 4 s, vorrat, geschichte 878 s, levelliste, wuerfelliste, ki-tester, beurteilung, generator, typecheck, leise).
- **`golden.mjs --voll`: alle 842 Level** (davon 300 Würfel) wie in `golden.json`, Löser für alle Level.
- `geschichte-probe --dorf` (GPU=1, allein, 17 min): alle Prüfungen der Führung, Texte, Kopfzeilen, Hinweise nebenbei
  und Übersicht bestanden; rot nur an den zwei bekannten Lücken im Bildtakt («Leicht: Menü → Prolog → Überspringen»
  319 ms, «Sehr schwer: Übersicht → Übung 3 wiederholen → Übung 4» 430 ms), dieselben Stellen wie auf der Basis in den
  Reviews 04 und 05. Nicht gegen die Basis wiederholt (Zeitmessung: Reviewer).
- Werkzeuge: `geschichte.mjs spiel --trocken` am echten Stand: nichts zu schreiben.
- Schalter mit vorübergehender `en.json` im Browser (siehe Umsetzung), Konsole leer.

### Abweichungen

- «In den Einstellungen» → im Menü oben rechts (es gibt keine Einstellungen; ein eigenes Fenster dafür wäre neue
  Funktion).
- Seitentitel und Beschreibung stehen in `index.html` weiter auf Deutsch (für Suchmaschinen und ohne JavaScript),
  aber mit Schlüssel; der Test verlangt, dass sie genau `de.json` entsprechen. Alle anderen Elemente mit Schlüssel sind
  in `index.html` leer und werden beim Laden gefüllt (unsichtbar: Startbildschirm-Texte sind bis zur Enthüllung
  durchsichtig, alles andere verborgen).
- Die Platzhalter heissen weiter `{Tippe}` und `{Drücke lang}` (wie heute; in jeder Sprache dieselben Namen).

### Offene Punkte

- Ticket 08: `uebersicht.js` trennt lange Titel mit Regeln für Deutsch (`trenne`); für Englisch prüfen. Der Name im
  `manifest.webmanifest` («Prisma – Licht-Puzzle») ist nicht übersetzt (Store-Eintrag, Ticket 10).
- Ein Level, das jemand mit `vorrat.mjs zurueckholen` ins Spiel holt, hat bis `geschichte.mjs spiel` keinen Titel in
  `de.json` (Anzeige: Name; `texte.test` meldet es).
- Reviewer: SwiftShader ganz, Proben mit Zeitmessung (vor allem `geschichte-probe --menue`, `--uebersicht`, `--handy`).

### Für den Handytest (Meilenstein 1)

Es soll alles genau aussehen wie bisher, bis auf «◎ DEUTSCH» oben rechts im Menü. Besonders ansehen: die Texte des
Startbildschirms («Tippen zum Starten»), die Führung im Dorf (Sätze mit «Tippe»/«Drücke lang», Hinweise nebenbei,
«Weiter»), Kopfzeile («Im Dorf – Erstes Licht», «Übung 1 / 4», «Ziele 0 / 3 · Leicht»), «Gelöst» mit Zeit/Drehungen,
Untertitel der Reisen, Menü und Übersicht (Titel der Level, «Gesperrt – erst …»), Prolog/Epilog («Tippen zum
Weitergehen», «Zum Menü»). Ein Tippen auf «Deutsch» tut noch nichts (es gibt nur Deutsch); erst mit Ticket 08 wechselt
es die Sprache und lädt dabei die Seite neu (zurück auf den Startbildschirm).

### Review (unabhängiger Reviewer)

Reviewer, 18.11.2026, auf `ticket/umbau-07` (`0686ba7`, mit Ticket 06 hereingemergt). **Ergebnis: bestanden.** Das Spiel
ist **bereit für den Handytest** (Meilenstein 1).

**Texte wörtlich gleich.** Ein Skript hat alle Texte aus den entfernten Zeilen des Diffs (`src/`, `index.html`; Literale,
Templates mit `${…}` als Platzhalter, Text in HTML) gegen alle Blätter von `de.json` (beide Geräte, `{Tippe}`/`{Drücke
lang}` stehen gelassen) verglichen: Jeder alte Text steht genau so in `de.json`; die zusammengesetzten (Kopfzeile,
`aria-label` des Menüs, «… von … Level gelöst», Zeiten im Bildschirmleser, «Würfel n / N – …») von Hand Stück für Stück
nachgeprüft, gleich. Die 240 Titel stimmen alle mit den alten `titel:` der Basis überein, dazu die 4 Übungen mit ihrem
Namen. Platzhalter je Gerät: `{Tippe}` → «Tippe»/«Klicke», `{Drücke lang}` → «Drücke lang»/«Rechtsklicke», «Tippen»/
«Klicken» (Untertitel), «Tippen/Klicken zum Starten/Weitergehen» und die Hinweise nebenbei wie vorher; das Gerät ohne
Angabe (`matchMedia('(pointer: coarse)')`) ist dasselbe wie `IS_TOUCH`. Nur noch über `t()`: Menü, Kopfzeile,
«Gelöst», Übersicht, Führung, Prolog, Reisen, Finale, Epilog, Titel, Seitentitel, Meldung bei verlorenem
Grafikkontext, `aria-label`/`title`. Der Name der Welt in `STORY_STATIONS` heisst jetzt «Bergwald» statt «Wald»; er
wurde vorher nirgends angezeigt (nur die Kennung), jetzt in der Übersicht, wo vorher «Bergwald» aus dem Kapiteltitel
kam – gleich.

**Test gegen feste Texte.** Gegenprobe in einer Kopie: «Level gelöst», `title = 'Ton an/aus (M)'`, «Neue Runde
starten», «Weiter spielen» in `ui.js` und Text im `data-t`-Element von `index.html` → alle fünf rot gemeldet. Grenze
(klein, kein Fehler): Ein ganz neuer Text ohne Umlaut und ohne Wort aus `de.json` (etwa «Gut gemacht») fiele nicht auf;
`src/logik.js` und `src/daten/` gehören nicht zur Oberfläche (dort stehen nur noch Schlüssel). Die Ausnahmeliste ist
klein und begründet.

**Sprachwahl** (Chrome mit `--lang`, Hilfsskript im Temp-Ordner): ohne `en.json` und Gerät `en-US` Deutsch, `lang="de"`,
Klick auf den Schalter lädt nicht neu und speichert nichts; kaputter gespeicherter Wert (`kaputt{`) → Deutsch. Mit einer
vorübergehenden `en.json` (Kopie mit vier geänderten Texten, in einer Kopie des Worktrees, danach gelöscht): `en-US` →
Englisch, `lang="en"`, Seitentitel englisch; Klick → `prisma.sprache = de`, neu geladen, Deutsch; Klick → `en`;
`?sprache=en` auf `de-DE` wirkt; unbekanntes `?sprache=xx` und gespeichertes `fr` fallen auf das Gerät zurück; `de-CH`
→ Deutsch. Konsole immer leer. Bestehende Schlüssel unverändert (`speicher.test` grün), `prisma.sprache` erst beim
Wechsel geschrieben. Nebensache: Beim Wechsel wird `?nointro` zu `?nointro=` (URLSearchParams), wirkungslos.

**Schalter.** Desktop, hochkant, quer (Referenzbilder) und eigens Poco (393 × 873, Pixeldichte 2,75) und 360 × 640:
oben rechts, überdeckt nichts, der Mittelpunkt trifft den Knopf (`elementFromPoint`), 44 px hoch. Nur im Menü; Führung
und Prolog sehen ihn nicht; in der Rückfrage «Von vorn» ist er mit dem Inhalt `inert`; die Pfeiltasten des Menüs
überspringen ihn (Tab erreicht ihn). Dass ein Tippen mit nur Deutsch nichts tut, ist für den Handytest unauffällig
genug; dem Nutzer vorher sagen (steht oben unter «Für den Handytest»).

**Referenzen.** Gegen `feature/umbau` geändert sind genau `desktop-menue`, `handy-menue`, `quer-menue` je in
`referenz/` und `referenz-gpu/`; alle anderen 71 + 71 byte-gleich. `poco` hat kein Menübild (nur `start`, `dorf`,
`welt-1-2`), also keine Lücke.

**Werkzeuge** (in einer Kopie des Worktrees, danach `git status` leer): `geschichte.mjs spiel` am echten Stand: nichts zu
schreiben. `vorrat.mjs ablegen Wasserfarbe`, dann `geschichte.mjs spiel`: holt es zurück, alles byte-gleich (Titel in
`de.json` blieb stehen; dazwischen meldet `texte.test` den Titel ohne Level, wie unter «Offene Punkte» beschrieben).
Generator, `ordne-level`, `vorrat` lesen `titel` nur wahlweise; Kandidaten der KI-Tester haben keinen Titel, das Spiel
zeigt ihren Namen, `shots.mjs` setzt die Kopfzeile selbst (`ki-tester.test` grün).

**Läufe** (alle über `tools/leise.sh`, `LEISE_MAX_CPU=100 LEISE_CPU=100`, Proben mit `GPU=1` allein):

- `npm test`: alles grün, 23 min 5 s (neben `golden --voll` und `offline`).
- `golden.mjs --voll`: alle 842 Level wie in `golden.json`, Löser für alle.
- Bildvergleich **SwiftShader ganz** (allein): **GRÜN**, 77 Bilder in 35 min 37 s, grösste Abweichung 4, Anteil
  0,000 %; die drei Menübilder Abweichung 0; `poco-start` «fast ruhig».
- `offline.mjs`: erst neben `npm test` nach 15 min an `timeout 900` abgebrochen (bis dahin alles ok), allein mit
  `timeout 1500` bestanden in 12 min 2 s (README nennt für `offline` keinen Zeitrahmen; 900 s reichen unter Last nicht).
- `start-probe` in Ordnung, `leerlauf-probe` OK, `ruhetakt-probe` OK, `spiegel-probe pruefe` OK, `buehne-messung` ohne
  Konsolenfehler, `brett-probe` bestanden (alle fünf Teile, auch «Reise»).
- `geschichte-probe` (Desktop, `--handy`, `--quer`, je etwa 11 min; `--menue` 79 s): bestanden.
- `geschichte-probe --uebersicht` und `--dorf`: rot nur an einzelnen Lücken über 100 ms, alle inhaltlichen Prüfungen
  (Texte, Kopfzeilen, Führung, Übersicht) bestanden. Gegen die Basis (Worktree von `feature/umbau`, abwechselnd je
  zweimal): Basis `--uebersicht` 2/2 rot (1–2 Lücken: «Spiel → Übersicht», «Menü → Übersicht» 414 ms, «letztes Level →
  Übersicht»), Ticket 3/3 rot (1–2 Lücken an denselben Übergängen, längste 425 ms); `--dorf` Basis 2/2 rot, Ticket 3/3
  rot, je an «Sehr schwer: Übersicht → Übung 3 wiederholen → Übung 4» (Basis 372/432 ms, Ticket 228–407 ms), dazu
  einzeln «Menü → Prolog → Überspringen» oder «Angebot steht» (beide Seiten). Nichts, was auf der Basis nicht kommt.

**Funde.** Keine mittleren oder grossen. Selbst behoben: README, ein überlanger Absatz zu `tools/chrome.mjs` umbrochen
(`973e354`). Hinweise für Ticket 08: `tests/offline.mjs` startet Chrome selbst ohne `--lang` (mit `en.json` sähe er auf
einem englischen Rechner Englisch; prüft aber keine Texte); die Suche nach festen Texten erkennt englische Texte nicht
(nur deutsche Wörter).
