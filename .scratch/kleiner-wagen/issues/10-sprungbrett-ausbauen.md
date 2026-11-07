# 10: Sprungbrett ausbauen

**Spec:** ../spec.md

**Blocked by:** 09, 11, 12 und die Abnahme durch den Nutzer (erfolgt 07.11.; Ticket 13 läuft parallel)

**Status:** ready-for-agent

**What to build:** Nach der Abnahme verschwindet das Sprungbrett ganz, damit ADR 0005 im Spiel wieder ohne Ausnahme
gilt (Entscheid 25). Erst danach wird auf Wort des Nutzers nach main gemergt.

- [x] Nicht beginnen, bevor der Nutzer die Szenen abgenommen hat (mit `?szenen` am Arbeitsrechner und über das Deploy
      des Feature-Branchs auf dem Poco) und Grösse und Helligkeit des Wagens festgelegt sind; seine Werte in den
      Comments festhalten und als feste Werte übernehmen.
- [x] Entfernen: Knopf «Szenen», Liste, Parameter `?szenen`, das Abschalten des Speicherns, die Parameter zum
      Abstimmen von Grösse und Helligkeit, ihre Stile und Kommentare.
- [x] Prüfen, dass nichts übrig ist: keine Spur davon im Code, `?szenen` bewirkt nichts, Stand und Bestwerte werden
      normal gespeichert.
- [x] Der Parameter `?wagen=<faktor>` des Ladezeichens bleibt (er gehört nicht zum Sprungbrett).
- [x] Alle Tests grün (Probe der Geschichte samt Wagen-Ablauf, Messung der Bühne, übrige Testreihen); Review nach dem
      Ticket.
- [ ] Danach: Merge nach main nur auf Wort des Nutzers, Push nur auf Auftrag.

## Comments

**07.11.2026, Abnahme durch den Nutzer** (Koordinator): Nach Runde 3 (Stand 524432d auf dem Poco) «ich finde alles
super»; offen nur Ticket 13 (Winkel im Epilog). Grösse und Helligkeit des Wagens: «ich finde sie gut wie sie sind»,
also die Werte von 524432d fest übernehmen (am Himmel und auf der Bühne: Desktop 18 %, quer 11 % der Breite; die
übrigen aktuellen Standardwerte im Code). Ebenfalls bestätigt: Halt bis zum Tippen auch bei der Reise; Strahlen am Ende
der Welten 1–5 bleiben wie sie sind.

**07.11.2026, Umsetzer** (Worktree `kw10`, auf 524432d): Sprungbrett ganz ausgebaut, nur in `index.html`:

- Stile von `#szenen` (Knopf, Liste, Kopf) samt Kommentar entfernt.
- `SZENEN_SPEICHER` und seine drei Weichen in `progress` (read, write, remove) entfernt: `progress` liest und
  schreibt wieder ohne Ausnahme in localStorage.
- Der Block «SZENEN» am Ende (Liste, `standVor`, Sprünge, Knopf, Tasten, Sichtbarkeit) entfernt.
- Die Parameter `?himmel-groesse=`, `?himmel-hell=` und `?himmel-punkt=` in `himmelsWagen` entfernt, ebenso
  `himmelsWagen.abstimmung`, das glBuehne und `scene.wagenBei` auf der Bühne lasen. Ihr Standard war je der Faktor 1;
  fest gelten also die Werte von `HIMMELSWAGEN` (winkel 0,15, wach 0,85 / 6,5 px, Linie 0,17 / 0,26 hell und 1,1 px
  breit, Lücke 7 px, Stern der Welt, Schlafende, Polarstern wie in der Tabelle) und `BUEHNENWAGEN` unverändert; der
  Wagen bleibt also genau so gross und hell (Probe `--wagen`: Desktop 20 %, Handy 54 % der Breite in «Wagen in
  Wagen», hoch wie in Ticket 11). Kommentar bei `HIMMELSWAGEN`: bestätigt bei der Abnahme.
- `?wagen=<faktor>` des Ladezeichens bleibt.
- `tests/levelliste.test.mjs`: der Test des Speicherstands übergibt `SZENEN_SPEICHER` nicht mehr.
- `PLAN.md` 0.4: Abnahme abgehakt, Sprungbrett ausgebaut, offen nur der Merge. `CONTEXT.md`, README und ADRs
  erwähnten das Sprungbrett nicht; die Spec bleibt als Geschichte des Entscheids.

Geprüft: `grep -i szenen` findet im Code nur noch «Zwischenszenen», «Szenenwerte» u. Ä., keine Spur von
`SZENEN_SPEICHER`, `#szenen`, `himmel-groesse/-hell/-punkt` oder `abstimmung`. Handprüfung mit `?szenen` (Skript im
Scratchpad, Chrome stumm): kein Knopf, keine Liste, kein `SZENEN_SPEICHER`; ein gelöstes Level schreibt Stand,
«zuletzt» und Bestwerte in localStorage, nach dem Neuladen ist der Stand da; Konsole ohne Fehler.

Tests (über `leise.sh`, Vorrang 14): Node levelliste, geschichte, logic, ki-tester, vorrat, beurteilung grün; Probe
ohne Argumente grün; `--wagen` Desktop und `--wagen --handy --dpr 2.75` grün; `--menue` einmal rot (Menü → Prolog
212 ms beim Start des Prologs), im zweiten Lauf grün, also kein Befund; `--dorf` viermal rot nur an «Übersicht →
Übung 8 wiederholen → Übung 9» (389, 421, 335, 403 ms), sonst grün; dieselbe Stelle auf 524432d (Kopie im Scratchpad)
zweimal: 53 ms und 416 ms. Bekannt seit Ticket 06 (Reviews 11 und 12), also kein Befund des Tickets.
Messung der Bühne und die übrigen Testreihen macht der Reviewer.

**07.11.2026, Notiz des Schlussreviews** (unabhängiger Reviewer, frischer Kontext; Tickets 10 und 13 zusammen, auf
56f5668 plus Ticket 10 in der Arbeitskopie; der ganze Testsatz, der in Review 13 aufgeschoben war)

Urteil: **angenommen, bereit zum Commit und zum Merge nach main** (Merge auf Wort des Nutzers).

Code (`git diff 56f5668`):

- Nichts übrig: `grep -i` nach `szenen`, `SZENEN`, `himmel-groesse/-hell/-punkt`, `abstimmung` und «Sprungbrett» in
  `index.html`, `tests/`, `tools/`, README, CONTEXT und ADRs findet nur «Zwischenszenen», «Szenenbild» u. Ä. und
  `tools/blender/szenen/`.
- Feste Werte gleich den alten Standardwerten: Der Faktor war ohne Parameter `Math.min(20, Math.abs(+null) || 1)` = 1,
  und `x * 1` ist in Gleitkomma exakt `x`. Nachgemessen im Browser auf 56f5668 und jetzt (Menü zu, drei Sterne wach,
  zwei Linien, Welt 4): `uHell`, `uGroesse`, `uLuecke` und die Geometrie des Himmelswagens Wert für Wert gleich (wach
  0,85 / 6,5 px, Linie 0,17 / 1,1 px, Lücke 7 px). Auf der Bühne fällt nur `* 1` weg (`wagenBei`, Block «der Kleine
  Wagen im Himmel» in glBuehne: `H.linie.breite * q`, `H.linie.luecke * q` wie vorher mit `punkt = 1`).
- Zusammenspiel mit Ticket 13: `winkelKamera`, `orteAus`, `winkel` und `ziel` lesen nichts vom Sprungbrett; der Port
  ändert in der Bühne nur die drei Zeilen von `wagenBei` und den Wagen-Block in glBuehne. Winkel und Wagen in Wagen
  unverändert (siehe Läufe).
- Handprüfung (eigenes Skript, Chrome stumm): mit `?szenen` kein `#szenen`, kein Knopf, `SZENEN_SPEICHER` und
  `himmelsWagen.abstimmung` undefiniert (auf 56f5668 alle vorhanden und mit `?szenen` nichts in localStorage); jetzt
  schreiben `progress.save`, `setLast` und `noteBest` nach localStorage, nach dem Neuladen (wieder mit `?szenen`) sind
  Stand, «zuletzt» und Bestwerte da, `progress.remove` löscht den Stand, die Bestwerte bleiben. `?wagen=2` setzt das
  Ladezeichen auf `--gross: 2.000` (ohne: 2.200 bei 1440 × 900). Konsole leer.
- **Behoben im Review:** Kommentar bei `BUEHNENWAGEN` (`index.html`, «Grösse und Helligkeit stimmt der Nutzer bei der
  Abnahme ab … Parametern von himmelsWagen») auf den Stand gebracht; `PLAN.md` 0.4: «Tickets 01–13» statt «01–10»,
  Abnahme «nach drei Runden, Tickets 11 bis 13».

Läufe (alle über `LEISE_VORRANG=10 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm; Formate:
Desktop 1440 × 900, hoch `--handy --dpr 2.75`, quer `--quer --dpr 2.75`, 360 × 640, 320 × 568):

| Lauf | Ergebnis |
|---|---|
| Node: alle `tests/*.test.mjs` parallel, `golden.mjs` | grün (beurteilung, generator, geschichte, hall, ki-tester, levelliste, logic, vorrat, wuerfelliste; golden 847 Level) |
| Probe ohne Argumente, 5 Formate (je alle vier Grade) | bestanden; Prolog 4 44,6 / 74,8 / 38,9 / 73,1 / 73,1° |
| `--ganz --vorher desktop.json` Desktop | bestanden; Reisen +0,18 … +0,23, Einstieg +0,23, Finale +3,69, Epilog −0,02 |
| `--ganz --handy --dpr 2.75 --vorher handy.json` (zweimal) | 1. Lauf rot nur 144 ms 72 ms nach Beginn des Prologs (bekannte Lücke am Prologanfang), sonst nur Artefakte; 2. Lauf bestanden. Reisen −0,29 … +0,18, Finale +3,68. Auf 56f5668 zweimal bestanden |
| `--ganz --quer --dpr 2.75` | rot: 177 ms am Prologanfang (bekannt), Finale 288 ms und Epilog 391 ms je 53 ms nach einem Bild der Probe (Artefakte) |
| `--wagen`, 5 Formate | bestanden; Wagen in Wagen 1,5 / 1,2 / 0,6 / 0,9 / 0,8 px, Wagen 20 / 54 / 15 / 53 / 53 % der Breite |
| `--finale leicht`, 5 Formate (Desktop und hoch mit `--vorher …-finale.json`) | Desktop, quer, 320 bestanden; hoch und 360 rot nur je an einer Lücke 53 ms nach einem Bild der Probe (Artefakt). Epilog 3 = Prolog 4 in allen fünf; Finale +3,69 / +3,40 s |
| `--fall`, 5 Formate | bestanden; Licht 1,18 / 1,37 / 0,59 / 1,06 / 0,96 px je Bild |
| `--dorf`, 5 Formate | alle Prüfungen grün; rot nur «Übung 8 wiederholen → Übung 9» (hoch 231, 320 193 ms), einmal 129 ms beim übersprungenen Einstieg (360, nicht wiederholt) und ein Artefakt (35 ms nach einem Bild) |
| `--dorf` Desktop im Wechsel jetzt / 56f5668, je 5 | «Übung 9»: jetzt 1 von 5 rot (394 ms), 56f5668 3 von 5 (391, 357, 320 ms). Nicht häufiger; die 4 von 4 des Umsetzers waren Streuung |
| `--menue`, 5 Formate, dazu 320 × 568 im Wechsel je zweimal | alle Prüfungen grün; rot nur «Menü → Prolog (neuer Grad)» 395 / 195 ms (bekannt seit Review 08) und einmal «Menü → Spiel (dasselbe Level)» 288 ms auf 320 × 568, in vier weiteren Läufen (2 × jetzt, 2 × 56f5668) nicht wieder |
| `--uebersicht`, 5 Formate, danach im Wechsel jetzt / 56f5668 (3 / 5) | alle Prüfungen grün; in den ersten fünf Läufen (hintereinander) rot an den bekannten Lücken beim Öffnen und Schliessen der Übersicht (100–431 ms); im Wechsel jetzt 3 von 3 grün, 56f5668 1 von 5 rot (100 ms). Kein Befund |
| `buehne-messung messen` Prolog/Epilog, Desktop/`--handy` | p50 17,7 ms, p95 18,5–18,6, längste 24–35 ms, keine über 50 ms, Konsole leer |
| `buehne-messung bilder r10` (5 Ansichten) und `r10p --nur handy-275,quer-275` | grün; Prolog 4 = Epilog 3: 44,6 / 74,8 / 38,9 / 73,1 / 73,1 / 75,0 / 38,4°, Unterschied 0,00° |
| `offline.mjs`, `--redirect` | grün (je 20 Prüfungen) |

Angesehen: Wagen am Himmel (Vulkan, Planeten), Ende des Finales und Anfang des Epilogs (Desktop, hoch), Prolog 4 und
Epilog 3 mit Strahl (Desktop, hoch), Menü, Übersicht: wie vor dem Ausbau, kein Knopf «Szenen».
