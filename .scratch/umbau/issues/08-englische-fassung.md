# 08: Englische Fassung

**Spec:** ../spec.md

**Status:** ready-for-agent (umgesetzt, Review bestanden)

**Blocked by:** 07

**What to build:** Prisma gibt es auch auf Englisch. Claude schreibt alle englischen Texte, der Nutzer prüft sie im
Spiel. **Meilenstein 2:** Danach spielt der Nutzer auf dem Handy die englische Fassung.

- [x] `en.json` mit allen Schlüsseln. Die Geschichte im Ton «Vorgelesen» wie im Deutschen (PLAN 1a.2): warm, mit
      kleinen Einzelheiten aus dem Bild, ohne die Muster, die dort als «zu stark nach KI» galten (Gedankenstriche,
      Doppelpunkt mit Auflösung, feierliche Formeln, jedes Kapitel nach demselben Muster).
- [x] Die Schritte der Führung halten die Grenzen ein (18 Wörter, 105 Zeichen; Hinweise 16 Wörter). Platzhalter je
      Gerät auf Englisch («{Tap}», «{Long press}»).
- [x] Name im Spiel und im Manifest für Englisch: «Prisma – Light Puzzle» (Startbildschirm «Prisma»).
- [x] Bei Englisch passen alle Texte in Band, Knöpfe und Kopfzeile, auf Handy hoch, quer und bei 360 × 640 (englische
      Wörter sind teils länger oder kürzer). Der Bildvergleich bekommt für Englisch eigene Referenzbilder.
- [x] Die Sprachwahl aus Ticket 07 wählt jetzt Englisch für jede Sprache des Geräts ausser Deutsch.
- [x] Eine Vergleichsseite Deutsch/Englisch je Text für den Nutzer (wie bei PLAN 1a.2), damit er Ton und Inhalt prüfen
      kann.
- [x] Alle Tests und Proben grün, auf Deutsch und Englisch.

## Comments

### Umsetzung

Umsetzer, 18.11.2026, Branch `ticket/umbau-08` ab `530c0ea`.

**Texte.** `src/texte/en.json` mit allen 179 Texten und 244 Titeln (gleiche Schlüssel und Platzhalter wie `de.json`,
feste Form von `tools/texte.mjs`). Amerikanische Schreibweise (color, practice). Namen: Noa, fireflies, North Star,
Little Dipper (Deichsel: handle, Schale: bowl), Village, Forest, Sea, Desert, Volcano, Planets, Stars; Grade Easy,
Medium, Hard, Very hard; «Übung» ist Lesson; «Weiter» je nach Stelle Continue («Gelöst», Menü), Next (Band der
Führung) oder Play (Kachel der Übersicht). Die Geschichte im Ton «Vorgelesen»: Einzelheiten aus dem Bild (smoke from
the chimneys, fir trees, a whirl of sand, a crater with a fire burning inside), keine Gedankenstriche, kein
Doppelpunkt, keine Formeln; die Reisen folgen dem Bau der deutschen, nicht einem Muster. Wörter je Gerät: `{Tippe}` →
Tap/Click, `{Drücke lang}` → Press and hold/Right-click (die Namen der Platzhalter bleiben in jeder Sprache dieselben,
wie in Ticket 07 festgelegt; englisch sind die eingesetzten Wörter). Titel der Level: englische Entsprechungen der
Naturwörter je Welt (Moss Cushion, Seagull, Desert Fox, Ember Glow, Earthrise …), Eigennamen bleiben (Io, Pegasus,
Basalt). Nach den ersten Bildern geändert: «Village» statt «In the Village» (sonst bricht die Kopfzeile «In the
Village – First Light» auf dem Handy um; im Deutschen ist «Im Dorf – Erstes Licht» einzeilig) und «Tap to continue»
statt «Tap to go on».

**Vergleichsseite** für den Nutzer: `.scratch/umbau/vergleich-en/index.html` (im Browser öffnen). Je Bereich eine
Tabelle Schlüssel | Deutsch | English: Prolog, Im Dorf, Reisen, Finale und Epilog, Führung im Dorf, Startbildschirm,
Kopfzeile und Knöpfe, Menü, Übersicht, dazu alle 244 Titel. Die Wörter je Gerät sind gelb markiert (Handy; die
Fassung mit der Maus steht darunter). Die Seite von PLAN 1a.2 ist nirgends mehr abgelegt (weder im Repo noch im
Temp-Ordner), die Form ist darum nachempfunden. Die Seite ist statisch; ändern sich die Texte, muss sie neu erzeugt
werden (das Skript dazu war einmalig und liegt nicht im Repo).

**Name und Manifest.** `seite.titel` «Prisma – Light Puzzle» (Titel der Seite), der Startbildschirm zeigt wie bisher
«PRISMA». `manifest-en.webmanifest` ist gleich wie `manifest.webmanifest` bis auf `name`, `description` und `lang`
(`short_name` «Prisma»). `index.html` fügt wie bisher das deutsche Manifest ein; `src/texte/sprache.js` setzt den
Verweis bei einer anderen Sprache auf `manifest-<kürzel>.webmanifest` um. So bleiben `index.html` und die deutsche Seite
unverändert, und die Wahl der Sprache steht nur an einer Stelle. Der Build kopiert alle `manifest*.webmanifest`
(`vite.config.mjs`, `STATISCH`), `sw.js` nimmt sie mit. **Kompromiss:** Ein installiertes PWA übernimmt den Namen beim
Installieren; wer die Sprache danach wechselt, behält den alten Namen, bis Chrome das Manifest wieder prüft (gleiche
`id`, also dieselbe App). Für den Play Store zählt das Manifest nicht: Dort kommt der Name aus den Android-Ressourcen
je Sprache (Ticket 10, `values/strings.xml` und `values-de/strings.xml`).

**Sprachwahl.** Brauchte keine Änderung: Seit es `en.json` gibt, wählt `spracheWaehlen` Englisch für jede Gerätesprache
ausser `de*`. Im Browser geprüft (Hilfsskript, Chrome mit `--lang`): en-US, fr-FR, it → Englisch, `lang="en"`, Titel und
Manifest englisch; de-CH → Deutsch mit deutschem Manifest; der Schalter im Menü wechselt Englisch → Deutsch → Englisch
(gespeichert, neu geladen); Konsole leer.

**Trennung langer Titel** (`uebersicht.js`, `trenne`): Regeln je Sprache (`TRENNREGELN`), Deutsch unverändert.
Englisch: englische Anlaute ohne th, tw, sh (Earth-rise, Drift-wood, Sand-storm, Mael-strom), ck und x bleiben bei der
Silbe davor, kein Schnitt vor einem e, dem gleich Konsonanten folgen (stummes e: Horse-head, Fire-storm). Ohne
Wörterbuch nicht perfekt (Pe-rihe-lion, Cele-stial), greift aber nur, wenn ein Wort auch klein nicht in die Kachel
passt; die englischen Titel sind kürzer als die deutschen, in den Bildern bricht keiner.

**Bildvergleich.** `--sprache de,en` (Vorgabe beide): dieselben Abläufe auf Englisch, Chrome mit `--lang=en-US`, Bilder
`en-<grösse>-<ansicht>.jpg`, je 77 neue Referenzen in `referenz/` (SwiftShader) und `referenz-gpu/`. Die deutschen
77 + 77 sind byte-gleich (im Commit unter `tests/bildvergleich/` nur `A` für `en-*`). Die Prüfung «Referenzen ohne
Ansicht» gilt je Sprache. Die englischen Bilder habe ich angesehen: Band, Knöpfe, Kopfzeile, Menü, Übersicht, Reise,
Prolog und Epilog passen auf Desktop, hoch, quer und Poco.

**Feste Sprache in Chrome.** `tests/offline.mjs` startet Chrome jetzt mit `--lang=de`. Sonst startet nur `tools/chrome.mjs`
Chrome (Vorgabe `de` seit Ticket 07).

**Suche nach festen Texten** (`texte.test.mjs`) nimmt jetzt die Wörter aller Sprachen: auch «Level solved», «Next world»
u. ä. fallen auf (Gegenprobe im Test). Neu im Test: `en.json` ohne deutsche Reste (Umlaut, «», Text gleich dem
deutschen ausser reinen Mustern und Titeln); Geschichte und Führung je Sprache ohne Gedankenstrich, Doppelpunkt und
Strichpunkt; das Manifest jeder Sprache wie das deutsche bis auf Name, Beschreibung und `lang`.

**Geschichte-Probe auf Englisch** (`--sprache en`): Chrome meldet en-US, die erwarteten Texte kommen aus der Sprachdatei
(`T` und `TITEL` in der Probe) statt aus Literalen. Für Deutsch ergeben sie genau die alten Texte (Konstanten und alle
umgestellten Einzeltexte mit einem Skript gegen die alten Literale verglichen: gleich).

README (Bildvergleich, `texte.test`, Geschichte-Probe, `offline.mjs`) und `CONTEXT.md` (Übersetzungsschicht)
nachgeführt.

### Läufe

Alle über `tools/leise.sh` (`LEISE_MAX_CPU=100 LEISE_CPU=100`), leichte mit `LEISE_ART=leicht`, Proben mit `GPU=1`
allein.

- `npm test`: alles grün ausser `testschnittstelle` (die Aufrufzeile der Probe mit `--sprache` und ein `$` in einem
  Template galten als Code der Seite); umgeformt, danach `testschnittstelle` und `texte` einzeln grün. golden (gegen
  `golden.json`), logic (auch Build und Offline-Liste), geschichte, typecheck u. a. grün.
- Bildvergleich `--gpu --sprache de`: **GRÜN**, 77 Bilder in 8 min 30 s, grösste Abweichung 6 (Sternpunkte),
  `poco-welt-2-vor` «fast ruhig» (0 Pixel). Die deutsche Fassung sieht genau gleich aus.
- Bildvergleich `--gpu --sprache en --write` zweimal (erste Bilder, dann nach «Village» und «Tap to continue»), je 77
  Bilder in gut 8 min; `--sprache en --write` in SwiftShader, 38 min (`en-poco-start` «fast ruhig», 21 Pixel bis 5, wie
  `poco-start` auf Deutsch).
- `geschichte-probe` Deutsch: `--dorf` und `--menue` bestanden; `--uebersicht` rot nur an Lücken über 100 ms («Spiel →
  Übersicht» 158 ms, «Übersicht → Spiel» 213 ms, «Menü → Übersicht» 365 ms), dieselben Übergänge wie auf der Basis im
  Review 07; alle inhaltlichen Prüfungen bestanden.
- `geschichte-probe --sprache en`: `--menue`, `--grad leicht` (zwei Welten mit Reisen, Kopfzeilen, Neuladen) und
  `--quer --dorf` bestanden. `--dorf` (Desktop), `--handy --groesse 360x640 --dorf` und `--uebersicht --handy`: rot nur an
  einzelnen Lücken über 100 ms an den bekannten Stellen («Sehr schwer: Übersicht → Übung 3 wiederholen → Übung 4»
  191/232 ms, «Menü → Prolog → Überspringen» 102 ms, Übergänge der Übersicht 124–159 ms); Texte, Band, Hand,
  Kopfzeilen, Übersicht und «ganz im Bild» bestanden. Der erste englische Lauf fand drei weitere deutsche Erwartungen
  in der Probe («Tippen»/«Klicken» beim Halt, Welt beim Wagen im Menü, «noch nicht begonnen»), umgestellt und
  wiederholt. Nicht gegen die Basis wiederholt (Zeitmessung: Reviewer).
- `offline.mjs` (mit `--lang=de`, `timeout 1500`): bestanden.
- Sprachwahl und Manifest im Browser: siehe oben.

### Offene Punkte

- Muttersprachliches Gegenlesen der englischen Texte gehört nicht zum Vorhaben (Spec, «Nicht in diesem Vorhaben»); der
  Nutzer prüft auf der Vergleichsseite.
- Ein neues Level aus `tools/geschichte.mjs spiel` bekommt nur in `de.json` einen Titel; `texte.test` meldet dann den
  fehlenden englischen Titel (gewollt streng: jede Sprache hat alle Schlüssel). Das Werkzeug schreibt keinen
  englischen Titel, er ist von Hand nachzutragen.
- Die Trennung für Englisch ist eine Regel ohne Wörterbuch (siehe oben); eine Sprache ohne eigene Regeln nimmt die
  deutschen.
- Der Bildvergleich ohne `--sprache` dauert jetzt doppelt so lang (GPU gut 16 min, SwiftShader gut 70 min);
  `--sprache de` für den alten Umfang.
- Die Geschichte-Probe auf Englisch lief für `--dorf`, `--menue`, `--uebersicht`, `--grad` und 360 × 640; `--finale`,
  `--ganz`, `--wagen`, `--grenzen` und `--dorf-raender` auf Englisch nicht (sie nutzen dieselben Konstanten).

### Für den Reviewer

- SwiftShader ganz (beide Sprachen), Proben mit Zeitmessung gegen die Basis, dazu `--finale leicht --sprache en`.
- Ton der Texte auf der Vergleichsseite.
- Unter `tests/bildvergleich/` sind nur `en-*` neu, keine deutsche Referenz geändert.

Meilenstein 2: vom Nutzer am 18.11.2026 ausgelassen.

### Review (unabhängiger Reviewer)

Reviewer, 18.11.2026, auf `baa73b3`. **Bestanden**, mit zwei kleinen Korrekturen (`b45c327`, `dcaa705`).

**Texte.** Alle 179 Texte und 244 Titel gelesen (Deutsch und Englisch nebeneinander, dazu die Vergleichsseite und die
englischen Bilder). Gutes, natürliches Englisch, inhaltlich treu; die Geschichte im warmen Ton «Vorgelesen», ohne
Gedankenstriche, Doppelpunkte und feierliche Formeln, die Reisen verschieden gebaut. Grenzen der Führung eingehalten
(Test je Sprache und Gerät). Geändert:
- `geschichte.dorf.ende`: «Now Noa has got the hang of it.» → «Noa has the hang of it now.» («has got» ist britisch,
  sonst gilt amerikanische Schreibweise).
- Titel `Querschläger` (Planetenbahn): «Planet Path» → «Orbit» (natürlicher).

Beide stehen in keinem Referenzbild (die Übersicht im Bild zeigt die Wüste); die Vergleichsseite ist nachgeführt.
Erwogen und gelassen: «fewest {drehungen}» (nur Bildschirmleser, wie im Deutschen), «Village» ohne Artikel (Grund:
Kopfzeile auf dem Handy), zweizeilige Kopfzeile bei langen Titeln (etwa «The Planets – Ringed Planet» auf dem Handy;
kommt im Deutschen bei langen Titeln auch vor, nichts überdeckt).

**Fund im Bildvergleich (behoben).** Die Ausnahme im Wasser von Handy quer, Meer 1 (`AUSNAHMEN`, die dünne Linie, die
das Spiel nur in etwa jedem zweiten Lauf zeichnet) galt nur für `quer-welt-2-*`, nicht für `en-quer-welt-2-*`. Der
ganze Lauf in SwiftShader war darum rot an genau diesen zwei Bildern (257/260 Pixel bis 18, die bekannte Linie bei
y ≈ 150 links). Jetzt gelten die Ausnahmen eines Bilds in jeder Sprache (`ausnahmenVon`); danach `--sprache en
--groesse quer --nur welt-1-2` grün, `testschnittstelle`, `texte`, `typecheck` grün.

**Geprüft ohne Befund.** Deutsche Referenzen unter `tests/bildvergleich/referenz*/` byte-gleich (im Diff nur `A` für
`en-*`, je 77), `de.json` unverändert. Trennung in `uebersicht.js`: für Deutsch rechnerisch dieselbe wie vorher (ohne
`amEnde` und `stummesE`). Sprachwahl, `?sprache=`, Manifest je Sprache, `vite.config.mjs` kopiert beide Manifeste,
`sw.js` nennt beide in `FILES`. Die neuen Prüfungen in `texte.test.mjs` greifen (Gegenprobe in einer Kopie: fehlender
Titel, Gedankenstrich im Prolog, 20 Wörter in einem Schritt, Text gleich dem Deutschen, abweichendes Manifest, alle
erkannt; Kopie gelöscht). Englische Bilder angesehen (Band, Knöpfe, Kopfzeile, Menü, Übersicht, Reise, Prolog,
«Gelöst»; Desktop, hoch, quer, Poco): nichts abgeschnitten oder überdeckt.

**Offline auf Englisch** (eigenes Hilfsskript, Chrome `--lang=en-US`, danach gelöscht): online und offline `lang="en"`,
Titel «Prisma – Light Puzzle», Verweis auf `manifest-en.webmanifest`, das offline aus dem Speicher kommt, Texte
englisch; offline `?sprache=de` deutsch mit deutschem Manifest. (Ein Teil der Skybox des Bergwalds fehlte offline, weil
das Skript diesen Himmel online nie gewählt hatte: ein Teil aus `LAZY`, unabhängig von der Sprache.)

**Läufe** (alle über `tools/leise.sh` als leichte Läufe, mit Zeitgrenze; auf Wunsch des Nutzers keine Messläufe):
- `npm test`: alles grün (15 Tests, geschichte 2062 s).
- `golden --voll`: grün (842 Level).
- Bildvergleich SwiftShader ganz, beide Sprachen: 154 Bilder in 111 min, alle grün bis auf `en-quer-welt-2-vor/-nach`
  (siehe Fund, danach grün); «fast ruhig»: poco-start, en-poco-start, en-poco-dorf-uebung-2.
- `offline.mjs`: bestanden.
- `geschichte-probe --sprache en`: `--finale leicht`, `--ganz`, `--wagen` (zweimal), `--grenzen`, `--dorf-raender`,
  `--handy --menue`, `--quer --uebersicht`, `--handy --groesse 360x640 --finale leicht`: alle inhaltlichen Prüfungen
  bestanden (Texte, Kopfzeilen, Halt, Leiste, Übersicht, «ganz im Bild»); rot nur an Lücken über 100 ms und bei
  `--wagen` am Gleichmass von Fall und Kamera (Bilder mit 0 px, also ausgefallene Bilder neben dem SwiftShader-Lauf).
  `--wagen` auf Deutsch zur selben Zeit: dieselben Fehlerarten, also nicht von der Sprache.
- `geschichte-probe` Deutsch ohne Optionen (alle vier Grade): bestanden.

**Für den Merge mit Ticket 09.** `vite.config.mjs`: Konflikt an `STATISCH` (09 fügt `datenschutz.html` an, 08 liest
die Manifeste mit `readdirSync`), beides nehmen, den Kommentar darüber ebenso. `README.md`: beide ändern den Absatz zu
`offline.mjs` (`--lang=de` bzw. `--unterpfad`), zusammenführen. `tests/offline.mjs`: getrennte Stellen
(Chrome-Argumente bzw. Server und Prüfungen). `index.html`: 08 ändert nichts; `sprache.js` setzt den
`<link rel="manifest">` um, den das Kopfskript einfügt, und das bleibt in 09 gleich. `logic.test.mjs` von 09 prüft nur
`manifest.webmanifest` (scope, start_url, Icons); `manifest-en` ist laut `texte.test` gleich bis auf Name, Beschreibung
und `lang`, gilt also mit. Nach dem Merge `npm test` und `offline.mjs` (auch `--unterpfad`) einmal laufen lassen.
