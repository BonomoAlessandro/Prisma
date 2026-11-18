# 02: Liste beim Antippen

**Spec:** ../spec.md

**Status:** done (Review 18.11.2026 bestanden)

**Blocked by:** 01 (Ticket 03 ist erledigt: Der Schalter bleibt oben rechts, die Liste geht nach unten auf)

**What to build:** Heute zeigt der Schalter oben rechts im Menü den Globus und die aktuelle Sprache («DEUTSCH»). Ein
Klick wechselt direkt zur nächsten Sprache, ohne dass man sieht, welche das ist. Neu öffnet der Schalter eine kleine
Liste aller Sprachen, in der man wählt (vom Nutzer gewählt, siehe Spec):

```
   Desktop:  🌐 DEUTSCH ▾        Smartphone:  🌐 DE ▾
   ┌─────────────┐
   │ ✓ Deutsch   │
   │   English   │
   └─────────────┘
```

- [x] **Schalter:** Globus, das Kürzel der aktuellen Sprache und ein kleines ▾ (als Zeichen im Strich der übrigen
      Zeichen des Menüs, kein Schriftzeichen), so zurückhaltend wie heute. **Auf dem Smartphone** steht statt
      «DEUTSCH» nur «DE», statt «ENGLISH» nur «EN», damit der Schalter neben dem Titel weniger Platz braucht. **Sonst**
      (Desktop, Tablet) bleibt der volle Name wie heute (Wunsch des Nutzers 18.11.2026). Smartphone heisst: die
      Handy-Layouts des Menüs, hochkant und quer (dieselben Medienabfragen wie in `menue.css`, mit `SEITE`). Am
      einfachsten stehen beide Texte im Schalter, und das CSS zeigt je Layout einen. Das Kürzel ist das der Sprachdatei
      in Grossbuchstaben. Das `aria-label` nennt immer den vollen Namen. Antippen oder Klicken öffnet die Liste. Ist
      die Liste offen, schliesst ein erneutes Antippen sie wieder.
- [x] **Liste:** alle Sprachen mit Datei (`VORHANDEN`, Deutsch zuerst), jede mit ihrem Namen in ihr selbst
      («Deutsch», «English»). Die aktuelle Sprache hat ein Häkchen. Antippen einer anderen Sprache wechselt sie (Ticket
      01, ohne Neuladen) und schliesst die Liste. Danach steht der Schalter in der neuen Sprache. Antippen der
      aktuellen Sprache schliesst die Liste nur.
- [x] **Schliessen:** Klick oder Tippen ausserhalb, Esc (schliesst nur die Liste, nicht das Menü), erneutes Antippen
      des Schalters. Beim Ausblenden des Menüs schliesst sie ohne Animation. Eine offene Rückfrage «Von vorn» und die
      Liste sind nie gleichzeitig offen.
- [x] **Tastatur und Bildschirmleser** nach dem Muster «Menu Button» (WAI-ARIA APG):
      - Der Schalter hat `aria-haspopup` und `aria-expanded`, die Liste und ihre Einträge passende Rollen, die aktuelle
        Sprache `aria-checked` bzw. `aria-current`.
      - Enter, Leertaste und Pfeil runter öffnen die Liste und setzen den Fokus auf die aktuelle Sprache. In der Liste
        gehen Pfeile, Pos1 und Ende. Enter und Leertaste wählen. Esc und Tab schliessen. Danach liegt der Fokus wieder
        auf dem Schalter.
      - Die Tastensteuerung des Menüs (Pfeile über Knopf und Reiter, `taste` in `menue.js`) gilt, solange die Liste zu
        ist, und greift nicht hinein, solange sie offen ist.
- [x] **Gestalt** im Stil des Menüs: Schrift Jost, Farben und Linien der Sternkarte, eher wie die Rückfrage «Von vorn»
      als wie ein Systemmenü. Sanftes Ein- und Ausblenden. Mit `prefers-reduced-motion` ohne Bewegung.
- [x] **Grössen:** Desktop, Handy hochkant, Handy quer, Poco (393 × 873, Pixeldichte 2,75) und 360 × 640, auch mit
      dem Massstab `SEITE`. Die Liste bleibt ganz im Bild, deckt keinen Teil des Menüs ab, der wichtig bleibt, und hat
      auf dem Handy Trefferflächen von mindestens etwa 44 px Höhe. Der Fokusrahmen erscheint wie im übrigen Menü erst
      nach einer Taste.
- [x] **Nur eine Sprache:** kein ▾, keine Liste, ein Klick tut nichts.
- [x] **Tests, gezielt und ohne grosse Läufe** (Entscheid des Nutzers 18.11.2026; die Änderung betrifft nur das
      Menü):
      - Eine Probe im Browser, ein Lauf: öffnen, wählen (Wechsel ohne Neuladen), aktuelle wählen, Esc, Klick
        ausserhalb, erneutes Antippen, Tastatur (Pfeile, Pos1, Ende, Enter, Tab), Fokus danach, Menü ausblenden mit
        offener Liste. Auf Desktop und Handy hochkant.
      - Node-Tests grün.
      - Referenzbilder des Menüs einmal nachführen (das ▾ am Schalter): nur der Ablauf mit dem
        Menü (`--nur welt-3-4 --write`, SwiftShader und `--gpu`). Nur die Bilder `menue` übernehmen, andere Bilder
        dieses Ablaufs, die sich durch Rauschen ändern, mit `git restore` zurücksetzen. Kein ganzer Bildvergleich,
        keine neue Ansicht.
- [x] `appVersion` in `package.json` auf `2026-11-18 sprachwahl-2`.
- [x] README und Kopfkommentar von `menue.js` (Beschreibung des Schalters), `CONTEXT.md`, falls dort der Schalter
      steht.

## Hinweise

- Der Schalter steht heute in `src/seite/oberflaeche/menue.js` (`.menue-sprache`, `ICONS.sprache`), der Stil in
  `src/stil/menue.css` (`.menue-sprache`, mit eigenen Regeln für Handy hochkant und quer).
- Vorbild für Ein- und Ausblenden, Fokus und Tasten ist die Rückfrage «Von vorn» (`oeffneFrage`, `schliesseFrage`,
  `taste`).
- Prüfläufe wie in Ticket 01 (siehe `CLAUDE.md`, Abschnitt Prüfläufe). Die Referenzbilder schreibt der Umsetzer erst,
  wenn alle übrigen Bilder grün sind, und nennt im Bericht, welche neu sind.
- Nicht committen. Der Koordinator committet nach dem Review.

## Notizen der Umsetzung (18.11.2026)

Umsetzer, Branch `feature/sprachwahl` (Basis 7b5e23b, Ticket 01 committet), nicht committet. Der Baustein der Liste
(`src/seite/oberflaeche/sprachliste.js`, `src/stil/sprachliste.css`, Probe in `../bausteine/sprachliste/`) lag schon
bereit; hier ist er ins Menü eingebaut.

**Ansatz.** Das Menü erzeugt die Liste am Schalter (`createSprachliste`, nach unten, am rechten Rand des Schalters) und
gibt ihr die Sprachen mit Datei, die aktuelle und die Texte für den Bildschirmleser. Den Text des Schalters (voller
Name und Kürzel, das CSS zeigt je Layout einen) und das ▾ setzt die Liste; eine Wahl ruft `setzeSprache` (Ticket 01),
der Abonnent des Menüs gibt der Liste danach die neue Sprache und Texte (`setze`). Solange die Liste offen ist, gehen
die Tasten des Menüs an sie, auch die vom Tastatur-Handler des Spiels.

- `src/seite/oberflaeche/menue.js`: Schalter nur noch mit Globus (der alte Text-`<span>` und der Klick «nächste
  Sprache» sind weg); `sprachliste = createSprachliste({ …, onWahl: (k) => { if (offen && !gesperrt) setzeSprache(k); } })`;
  `sprachTexte()` für Name der Liste und `aria-label` des Schalters; im Abonnenten `sprachliste.setze({ aktuell, texte })`
  statt der zwei Zeilen am Schalter; am Anfang von `taste` und `keydown` (nach `if (!offen)`) `if (sprachliste.offen)
  return sprachliste.keydown(e);`; `hide()` schliesst sie vor dem `blur()` sofort, `oeffneFrage` zuerst. Kopfkommentar
  nachgeführt (Schalter mit Liste, Tasten).
- Esc mit offener Liste: Die Liste nimmt die Taste schon an ihrem eigenen Hörer (Standardaktion verhindert, danach
  zu). Der Handler des Spiels (`geschichte.js`, `menu.offen` → `menu.keydown(e)`) bekommt `true` zurück (Ziel im Menü,
  `defaultPrevented`) und ruft `story.back()` nicht auf. In der Probe geprüft, mit Gegenprobe (ohne Liste führt Esc
  zurück ins Level).
- **Reihenfolge beim Laden:** `tests/logic.test.mjs` verlangt, dass jeder Teil unter `src/seite/` zuerst den
  vorherigen importiert (Kette von `src/main.ts` rückwärts). `sprachliste.js` importiert darum zuerst `./ui.js` (nur für
  die Reihenfolge, im Kopf vermerkt), `menue.js` zuerst `./sprachliste.js` statt `./ui.js`. Die Probeseite des Bausteins
  (`../bausteine/sprachliste/probe.html`) lädt das Modul seither als Text ohne diese Zeile (sonst käme das ganze Spiel
  mit).
- **Texte:** `menue.sprache` mit Kürzel: «Sprache: {sprache} ({kuerzel})» / «Language: {sprache} ({kuerzel})», also
  «Sprache: Deutsch (DE)» bzw. «Language: English (EN)» (passt auf dem Handy zum sichtbaren «DE», WCAG 2.5.3). Neu
  `menue.sprachliste`: «Sprache wählen» / «Choose language» (Name der Liste, `role="menu"`).
- Fokus und Ansage nach einem Wechsel wie in Ticket 01 (Fokus auf dem Schalter, `.menue-sr` meldet die neue Sprache).
- Die Medienabfragen in `sprachliste.css` (Kürzel bzw. voller Name) sind dieselben wie in `menue.css` für Handy hochkant
  (`(max-width: 600px) and (orientation: portrait)`) und quer (`(orientation: landscape) and (max-height: 500px)`);
  nachgeprüft, unverändert.
- `tests/sprachwechsel-probe.mjs`: Wechsel im Menü jetzt wie ein Spieler über Schalter und Liste (`waehle`); neuer
  Ablauf `liste` (siehe Kopf der Probe und README); die Suche nach alten Texten lässt Elemente mit eigenem `lang` aus
  (die Namen in der Liste stehen je in ihrer Sprache); `wechsle` gibt der Bedienung die neue Sprache; `--bilder` legt
  Aufnahmen der offenen Liste nach `tests/output/sprachwechsel/`.
- README (Schalter mit Liste in der Übersetzungsschicht, `sprachliste.js` in der Liste der Teile, Probe mit `liste` und
  `--bilder`); `appVersion` `2026-11-18 sprachwahl-2`. `CONTEXT.md` unverändert: Dort steht nur «ein Wechsel im
  Menü», der Schalter selbst ist nicht beschrieben.

**Prüfungen** (alle `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 … node …`):

- `node tests/alle.mjs texte testschnittstelle typecheck` (15:52, 17 s) und `node tests/alle.mjs logic speicher`
  (15:53–15:54, logic 68 s): grün. Der `logic`-Test war vorher rot (sprachliste.js nicht in der Kette der Teile).
- Endstand `node tests/alle.mjs logic texte testschnittstelle speicher typecheck` (16:37–16:39, 1 min 50 s): **grün**
  (logic 85 s, testschnittstelle 11 s, typecheck 8 s, texte 1 s, speicher 1 s).
- `node tests/sprachwechsel-probe.mjs --gpu --bilder --nur liste` (Desktop, erster Lauf des neuen Ablaufs): 34 s, grün.
- `node tests/sprachwechsel-probe.mjs --gpu --handy --bilder` (Handy hochkant, alle Abläufe): 142 s, **GRÜN**, 16
  Wechsel; Schalter «DE», Liste 126 × 108 px unter dem Schalter, Einträge 46 px.
- `node tests/sprachwechsel-probe.mjs --gpu` (Desktop, alle Abläufe): erster Lauf **hing** im Ablauf `menue` (nach
  `start`, ein einziger Chrome seit dem Start des Ablaufs, keine Ausgabe mehr); `timeout -k 30 900` beendete ihn nach
  17 min nicht, von Hand beendet. Danach `--nur menue` allein 21 s grün und der ganze Lauf noch einmal: 166 s,
  **GRÜN**, 16 Wechsel; Schalter «Deutsch», Liste 122 × 88 px, verdeckt nichts. Nicht nachgestellt; ein Hänger des
  Chrome mit GPU, kein Fehler im Ablauf gefunden.
- Probe des Bausteins `node .scratch/sprachwahl/bausteine/sprachliste/probe.mjs` (nach der Änderung der Probeseite;
  Desktop, hoch, 360 × 640, quer, Poco mit `SEITE` 1,375, sichere Ränder): 216 Prüfungen, 0 Fehler (~1 min). Ihre
  Aufnahmen danach wieder durch die des Bausteins ersetzt (unverändert).
- Aufnahmen der offenen Liste im echten Menü (`--bilder`, Desktop und Handy, mit Zeiger und mit Tastatur) angesehen und
  wieder gelöscht: Liste wie im Baustein, Fokusrahmen nur nach der Taste, ▾ gedreht.
- Referenzbilder: `node tests/bildvergleich.mjs --nur welt-3-4 --write` in SwiftShader (16:23–16:36, 12 min 48 s,
  36 Bilder) und mit `--gpu` (16:37–16:40, 3 min 30 s). In SwiftShader änderten sich genau die sechs Bilder `menue`;
  mit `--gpu` dazu 22 Bilder der Level: `*-welt-3-*` nur Rauschen (grösste Abweichung 1–2), `*-welt-4-*` (Vulkan, alle
  Grössen und Sprachen, 3–4 % der Pixel, bis 213) ein anderes Muster der Lavarisse im Boden links unten, das Brett
  gleich. Alle 22 mit `git restore` zurückgesetzt. Neu sind nur `{,en-}{desktop,handy,quer}-menue.jpg` in `referenz/`
  und `referenz-gpu/` (zwölf Bilder); gegen die alten weichen sie nur im Kasten des Schalters ab (oben rechts, etwa
  95 × 12 px oder kleiner), angesehen: «DEUTSCH ▾»/«ENGLISH ▾» auf dem Desktop, «DE ▾»/«EN ▾» hochkant und quer.
- Nicht gelaufen (Entscheid des Nutzers): ganzer Bildvergleich, Golden, übrige Proben, `ki-tester` (`CONTEXT.md`
  unverändert), ganzes `npm test`.

**Offen / Risiken:**

- Auf dem Handy hochkant deckt die offene Liste das rechte Ende des Untertitels und die Reiter «Schwer» und «Sehr
  schwer» ab (Probe: «verdeckt .menue-unter, .menue-grad»). So im Baustein und in der Wahl aus Ticket 03 (nach unten
  auf); solange sie offen ist, ist darunter ohnehin nichts bedienbar. Auf dem Desktop deckt sie nichts.
- Die GPU-Referenzen `*-welt-4-*` passen nicht mehr zum heutigen Bild auf dieser Grafikkarte (Lavarisse); nicht Teil
  dieses Tickets, nicht nachgeführt. Der nächste Bildvergleich mit `--gpu` wird sie rot melden.
- Der Hänger des ersten Desktop-Laufs ist nicht erklärt; `timeout.exe` beendete den Lauf nicht.
- «Menü blendet mit offener Liste aus» und «Von vorn mit offener Liste» sind nur über die Testschnittstelle bzw. das
  DOM geprüft: Ein Spieler erreicht bei offener Liste nur sie (Schleier, Tasten).
- Handy quer, Poco und 360 × 640 im echten Menü nur über die Referenzbilder (zu) und die Probe des Bausteins (mit dem
  Stil des Menüs) geprüft, nicht mit der Probe des Spiels. Bildschirmleser selbst nicht ausprobiert, nur Rollen und
  Namen geprüft.

## Review (18.11.2026)

Unabhängiges Review der uncommitteten Änderungen auf `7b5e23b` und der neuen Dateien (`sprachliste.js`,
`sprachliste.css`, Baustein `../bausteine/sprachliste/`, zwölf Referenzbilder des Menüs). Zwei Achsen (Gepflogenheiten
des Repos, Ticket), dazu die Abläufe der Tasten, des Fokus und des Schleiers im Kopf durchgespielt und gezielte Läufe
(Entscheid des Nutzers: kein ganzer Bildvergleich, nicht die ganze Applikation).

**Befunde**

- Tasten richtig: Esc mit offener Liste nimmt der Hörer der Liste (Standardaktion verhindert), der `keydown` von `root`
  (`menue.js:539`) gibt bei `defaultPrevented` auf, `menu.keydown` liefert über `root.contains` → `defaultPrevented`
  `true`, `geschichte.js:2384` ruft `story.back()` nicht auf. Liegt der Fokus ausserhalb der Liste, nimmt
  `menue.js:614` die Taste für die Liste. Eine gehaltene Esc (Wiederholung) verlässt das Menü nicht
  (`geschichte.js:2366`). Enter und Leertaste auf einem Eintrag lösen den Klick des Knopfs aus, der Handler des Spiels
  lässt Knöpfe aus. Buchstaben, die keine Sprache treffen (etwa M), gehen weiter an das Spiel (Ton), wie im Menü.
- Fokus nach Wählen, Esc, Tab und Tippen daneben auf dem Schalter; nach einem Wechsel stellt der Abonnent des Menüs ihn
  über `data-menue-fokus="sprache"` wieder her. Fokusrahmen in der Liste nur nach einer Taste (`.menue-zeiger`,
  `sprachliste.css:60–61`; Spezifität höher als die Regeln in `menue.css`).
- Schleier: `position: fixed` in `.menue` (kein `transform`, also das Bild als Bezug), z-index 4 über der Rückfrage (3);
  `schliessen()` blendet ihn sofort aus, auch in `hide()` (`menue.js:595`) und `oeffneFrage` (`:427`). Kein hängender
  Schleier, Rückfrage und Liste nie zugleich (der Schalter ist bei offener Rückfrage `inert`).
- ARIA: `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `role="menu"` mit Namen, `menuitemradio` mit
  `aria-checked` und `lang`. Das `aria-label` «Sprache: Deutsch (DE)» enthält den sichtbaren Text in beiden Layouts.
- Medienabfragen in `sprachliste.css:10` gleich denen in `menue.css` (hochkant `:184`, quer `:233`); `index.html`
  rechnet sie mit `SEITE` um wie alle anderen (Vite fügt `index.css` zusammen).
- Aufräumen: `resize` nur solange offen, Timer gelöscht, Einträge bei jedem `setze` neu (die alten mit ihren Hörern
  weg), ein einziger Abonnent (der des Menüs, `createMenu` entsteht einmal).
- Referenzbilder: Die zwölf Bilder `{,en-}{desktop,handy,quer}-menue.jpg` in `referenz/` und `referenz-gpu/` weichen
  von `HEAD` nur im Kasten des Schalters ab (über 8 Stufen: Desktop 1120–1215 × 56–72, hochkant 309–376 × 24–40, quer
  754–823 × 16–32), angesehen: «DEUTSCH ▾»/«ENGLISH ▾» bzw. «DE ▾»/«EN ▾». Sonst ist kein Referenzbild geändert.
- Grundsätzlich, zum Entscheid (nicht geändert): `sprachliste.js:4` importiert `./ui.js` nur für die Kette der Teile
  (`tests/logic.test.mjs:1266`). Das ist begründet und vermerkt, holt aber beim Laden das ganze Spiel und zwingt die
  Probeseite zum Laden als Text ohne diese Zeile (`probe.html:89`, an genau diese Zeile gebunden). Sauberer wäre
  `sprachliste.js` als dritte Hilfe in `hilfen` des Tests (sie importiert sonst nichts, wie `aufgabe.ts` und
  `testschnittstelle.ts`), `menue.js` wieder zuerst mit `./ui.js`, README «Aufbau des Codes» nachgeführt; dann lädt die
  Probe das Modul direkt.
- Klein, offen gelassen (Ermessen):
  - Auf dem Handy hochkant deckt die offene Liste das Ende des Untertitels und die Reiter «Schwer», «Sehr schwer» (wie
    in den Notizen). Darunter ist bei offener Liste ohnehin nichts bedienbar; beim Test auf dem Handy abnehmen lassen.
  - Die 46 px der Einträge hängen an `(pointer: coarse)` (`sprachliste.css:63`), nicht an den Handy-Layouts; auf echten
    Geräten gleichwertig.
  - Nach einer Wahl baut `setze` die Einträge schon während des Ausblendens neu: Das Häkchen springt in der
    ausblendenden Liste zur neuen Sprache (300 ms, eher eine Bestätigung als ein Fehler).
  - Ungefragte Allgemeinheit des Bausteins, die das Menü nicht nutzt: `richtung: 'oben'` mit Umklappen,
    `ausrichtung: 'start'`, `setze({ sprachen })`, `oeffnen('erste')`, Bild auf/ab, Buchstabensprung, Rückfall auf
    `aria-labelledby` (`sprachliste.js:68`, `110`, `199`, `258`, `265`, `287`). Klein und von der Probe des Bausteins
    abgedeckt.
  - `sprachliste.css` steht in `index.css` zuletzt; das ▾ (12 px) gewinnt gegen `.menue-sprache .menue-ico` nur durch
    die Reihenfolge (gleiche Spezifität).
  - Die Probe des Spiels drückt die Leertaste nie (nur die Probe des Bausteins).

**Selbst behoben**

- `sprachliste.js`: der Export `PFEIL` (nirgends gebraucht) entfernt; in `lage()` überschattete `px = (v) => …` das
  Rechteck `v` des Schleiers (umbenannt in `wert`).
- `menue.css`, Kopf: Verweis, dass die Bedingungen für hoch und quer auch in `sprachliste.css` stehen (bisher nur in
  die andere Richtung).
- Baustein: Kopf von `probe.mjs` («Das Modul hat keine Importe», «aus dem Worktree») und `probe.html` («im Worktree»,
  die Texte des Schalters «wie menue.sprache», die dort jetzt das Kürzel tragen) nachgeführt.
- README: Zeile der Teile unter `src/seite/` wieder umbrochen; Dauer der Probe in README und Kopf der Probe gleich
  («knapp 3 min», bisher «gut 2½» bzw. «gut 3»).

**Prüfungen** (alle `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node …`)

- `tests/alle.mjs logic texte testschnittstelle speicher typecheck` (Stand des Umsetzers): 65 s, grün (logic 60 s).
- `tests/sprachwechsel-probe.mjs --gpu` (Desktop): 16:48–16:51, 182 s, **GRÜN**, 16 Wechsel, kein Hänger; Schalter
  «Deutsch» («Sprache: Deutsch (DE)»), Liste 122 × 88 px, Einträge 36 px, verdeckt nichts.
- `tests/sprachwechsel-probe.mjs --gpu --handy`: 16:52–16:55, 166 s, **GRÜN**, 16 Wechsel; Schalter «DE», Liste
  126 × 108 px unter dem Schalter, Einträge 46 px, verdeckt `.menue-unter`, `.menue-grad` (siehe oben).
- `.scratch/sprachwahl/bausteine/sprachliste/probe.mjs` (nach den eigenen Änderungen): 16:55, 42 s, 216 Prüfungen,
  0 Fehler (auch Poco mit `SEITE` 1,375, quer mit sicheren Rändern). Von den Aufnahmen war nur
  `poco-offen-unten.jpg` anders (in der Liste, von Auge gleich); alle sechs danach wieder durch die vorherigen ersetzt
  (byte-gleich).
- Nach den eigenen Änderungen `tests/alle.mjs logic texte typecheck`: 77 s, grün.
- Nicht gelaufen (Entscheid des Nutzers): Bildvergleich, Golden, übrige Proben, `ki-tester`, ganzes `npm test`.

**Urteil:** bestanden. Schalter und Liste tun, was das Ticket verlangt, auf Desktop und Handy, mit Zeiger und Tastatur;
Esc schliesst nur die Liste, nichts löst unter dem Schleier aus, und die neuen Referenzbilder ändern nur den Schalter.
Offen zum Entscheid: der Import von `ui.js` nur für die Ladereihenfolge (oben). Offen für den Nutzer: die Abdeckung der
Reiter auf dem Handy hochkant beim Test auf dem echten Gerät.
