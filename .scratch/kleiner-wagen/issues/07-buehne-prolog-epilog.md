# 07: Bühne von Prolog und Epilog, Überblendung Wagen in Wagen

**Spec:** ../spec.md

**Blocked by:** 06

**Status:** ready-for-agent

**What to build:** Der Kleine Wagen am Himmel der Bühne: im Prolog blass, im Epilog ganz wach; dazu die Überblendung
vom Finale in den Epilog von Wagen zu Wagen (Entscheide 8, 15; Ablauf 1, 6 und 7 der Spec).

- [x] Der Wagen ist Teil des Himmels der Bühne, um ihren Polarstern, in der Form aus dem Wagen-Modul.
- [x] **Prolog:** die sechs Sterne so blass wie die schwächsten Hintergrundsterne, ohne Funkeln, ohne Linien; der
      Polarstern hell wie heute.
- [x] **Prolog 4** (Noas Strahl verblasst, «… der Kleine Wagen ist fast unsichtbar»): Die Linien zeichnen sich einmal
      für einen Atemzug ganz schwach ab und verlöschen wieder.
- [x] **Epilog:** alle sieben Sterne hell, die Linien glimmen schwach nach; der Polarstern blinkt wie heute.
- [x] **Überblendung Wagen in Wagen:** Der leuchtende Wagen am Ende des Finales geht ohne Sprung in den Wagen über dem
      Dorf über (heute Stern in Stern über `starAt`; auf den ganzen Wagen erweitern), in Desktop, Handy hoch und quer.
- [x] Der ganze Wagen ist in Prolog 4 und im Epilog im Bild, auch im Hochformat; dafür darf die Kamera von Prolog 4
      im Hochformat leicht verschoben werden.
- [x] Prolog und Epilog bleiben gleich lang wie heute.
- [x] Nach den Regeln der Bühne (ADR 0007): in WebGL wie die übrigen Teile, Andeutung und Nachglimmen als kleine
      Animation nach der Zeit der Bühne, keine zusätzlichen Ruckler; Grafikspeicher auf dem Handy im Rahmen.
- [x] Die Sprünge «Prolog» und «Epilog» im Sprungbrett zeigen die neuen Szenen.
- [x] Messung der Bühne: Bildzeiten wie vorher (Desktop, Handy mit Pixeldichte des Poco), Bilder an jedem Ruhepunkt
      in Desktop, Handy hoch und quer und kleinem Handy; der Wagen ist darauf zu sehen.
- [x] Probe: Übergang Finale → Epilog ohne Sprung (Bilder davor und danach), Bildzeiten.
- [x] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `createStoryScene` (Himmel mit Sternen und Polarstern als Teil `polar`, Aktionen `reach`, `blink`, `answer`,
  `starAt`), `STORY_PROLOG`/`STORY_EPILOG` (`cam`, `camP` für Hochformat).
- Messung: `tests/buehne-messung.mjs` (`messen`, `bilder`, `--epilog`, `--handy`).

## Comments

**05.11.2026, Notiz des Umsetzers** (Worktree `kw-07`, Stand nach Ticket 06 vor dessen Review, f09d114)

Gebaut (`index.html`, `tests/geschichte-probe.mjs`, `tests/buehne-messung.mjs`):

- **Wagen in Wagen, umgekehrt gedacht:** Der Wagen am Himmel steht im Spiel waagrecht immer mittig (sonst schräg, Ticket
  06), und seine Grösse im Bild ist durch das Sichtfeld der Kamera gegeben. Darum legt nicht das Finale sich nach der
  Bühne, sondern die Bühne ihren Wagen genau dorthin, wo das Finale ihn am Ende zeigt: `story.wagenEnde()` rechnet Blick
  und Sichtfeld des Endbilds und die Orte der sieben Sterne im Bild, `scene.wagenLegen()` rechnet sie in Massen des
  Himmels der Bühne beim ersten Bild des Epilogs um (`STORY_EPILOG[0].from`/`fromP` bleiben). So stimmt es in jedem
  Format genau (Probe: höchstens 1,7 px Abweichung), auch wenn der Nutzer Grösse oder Lage des Wagens noch ändert.
- **Platz auf der Bühne** (`scene.wagenFeld()`): Der Wagen muss in jedem Bild des Epilogs (Anfang und drei
  Einstellungen) und in Prolog 4 ganz zu sehen sein, mit Rand und über den Graten der Berge (fern und Bergwald). Auf
  Desktop und quer ist das nur ein schmaler Streifen Himmel (Desktop 21 % der Bildhöhe, quer 16 %; die Antwort im
  Epilog 3 schaut am tiefsten); dort passt der Wagen mit dem Sichtfeld des Spiels nicht hinein. Das Finale schaut darum
  am Ende **weiter** (Sichtfeld beim Blick hinauf gleitend: Desktop 32° → 55°, quer 32° → 68°, Handy hoch 44° → 49°),
  der Wagen wird im Bild kleiner; danach wieder wie sonst (`story.sichtfeld()`, in `playScene` nach der Überblendung).
  Der Lichtpunkt auf dem Polarstern wächst dabei mit. Der Polarstern der Bühne steht damit nicht mehr bei (1120, 150)
  oben rechts, sondern über dem Wagen: Desktop bei 0,41/0,09 des Bilds, Handy hoch 0,09/0,11 (der Wagen füllt dort 80 %
  der Breite), quer 0,44/0,09. Noas Arm mit der Lampe zeigt zu ihm (`erhoben()` statt `RAISED`).
- **Zeichnen** (ADR 0007): ein kleines Netz in der WebGL-Bühne (`wagenMesh`: Sterne 1–6 und sieben Linien als
  Rechtecke in Bildpixeln, gezeichnet wie `himmelsWagen`), in der Ebene des Himmels hinter dem Teil `polar` (der bleibt
  der Polarstern, hell und blinkend wie heute). Keine Textur, kein Rastern; Helligkeit je Bild aus `scene.wagenBei(t)`.
- **Prolog:** sechs blasse Punkte (`BUEHNENWAGEN.schlaf`: Helligkeit 0,34, 1,6 px), ohne Funkeln, ohne Linien.
  **Prolog 4:** Die Linien zeichnen sich einmal ab (`andeutung`: ab 1,4 s nach Beginn der Einstellung in 1,3 s auf 0,11,
  in 2,1 s wieder weg, als Stück der neuen Spur `wagenLinien` nach der Zeit der Bühne). **Epilog:** alle sieben wach wie
  am Himmel der Welten (0,85, 6,5 px), die Linien kommen mit 0,17 aus dem Finale und glimmen nach (`nachglimmen`: nach
  2,6 s in 4 s auf 0,11, dann atmen sie ±30 % in 5 s).
- Alle Werte in `BUEHNENWAGEN` (nach `STORY_PULS`): `feld` (Rand 0,04 der kürzeren Bildseite, höchstens 0,8 des
  Platzes hoch), `schlaf`, `andeutung`, `nachglimmen`. Die Parameter `?himmel-groesse=`, `?himmel-hell=`,
  `?himmel-punkt=` gelten auch auf der Bühne (`himmelsWagen.abstimmung`, SZENEN-Kennwort); die Grösse folgt ohnehin dem
  Finale. Prolog und Epilog sind gleich lang (keine Fahrt geändert); auch die Kamera von Prolog 4 im Hochformat musste
  nicht verschoben werden (der Platz wird für sie mitgerechnet).
- Nebenbei behoben: Die Spuren der Bühne (`spur`) rechneten nach einem Sprung der Bühnenzeit (`scene.einfrieren` der
  Messung) mit der alten Zeit; in den Bildern der Messung stand Noas Arm darum immer unten, der Strahl fehlte. Jetzt
  bekommt `f` die Zeit wie beim Anlegen (`verschoben`), im Spiel ändert sich nichts (dort springt die Zeit nie).
- `wagenBlick(unten, feld)` (vorher `(unten, polar)`, `polar` hatte keinen Aufrufer mehr), dazu `wagenKamera`,
  `wagenImBild`; `kameraSichtfeld(aspect)` statt der Zahl in `onResize`. `scene.starAt` gibt es weiter (aus
  `wagenImBild`).
- Probe `--wagen`: `pruefeFinale` vergleicht jeden Stern des Endbilds mit dem der Bühne (`WAGEN_IN_WAGEN` = 4 px) und
  gibt die Abweichung aus; Bilder `wagen-finale-ueberblendung` (mitten in der Überblendung) und `wagen-epilog-anfang`.
  Das Endbild wartet nicht mehr auf die Grösse des Lichtpunkts, sondern auf den Blick (`gaze`). Messung `bilder`: dazu
  `prolog-4-andeutung` mitten in der Fahrt.

Geprüft (alle über `GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm, 05.11. 14:00–15:55):

| Lauf | Ergebnis |
|---|---|
| Node `geschichte`, `levelliste` | grün |
| `--wagen` Desktop / `--handy --dpr 2.75` / `--quer --dpr 2.75` | bestanden (246 / 251 / 250 s); Wagen in Wagen grösste Abweichung 1,7 / 1,4 / 0,7 px; Polarstern am Ende 0,405/0,090 / 0,090/0,106 / 0,443/0,088, Bühne 0,405/0,091 / 0,090/0,108 / 0,443/0,089 |
| `--finale leicht` | bestanden (126 s) |
| `--ganz --messwerte --vorher vorher/desktop.json` | bestanden (450 s); Reisen −0,05 … +0,02 s, Einstieg −0,01, Prolog −0,19, Epilog +0,01, Finale +3,70 s (Ticket 06); längste Lücke 53 ms |
| `--ganz --handy --dpr 2.75 --vorher vorher/handy.json` | rot nur an einer Lücke: Neuladen → Weiter (Wüste 26) 163 ms (bekannt seit Ticket 04, auf 844dc8b 143 ms; auf f09d114 diesmal nicht); Dauern Reisen −0,53 … −0,02, Finale +3,68, Epilog +0,13 s |
| `--ganz --quer` (dreimal) | rot nur an Lücken: Prolog gleich am Anfang 213 / 196 / 106 ms (auf f09d114 176 ms an derselben Stelle); im ersten Lauf Epilog 430 + 393 ms, in den zwei Wiederholungen nicht (längste 19 / 23 ms), auf f09d114 nicht; im dritten Lauf je einmal gut 300 ms in Reise 5, Reise 6 und Finale, in den andern Läufen nicht (wandernde Lücken des Rechners). Dauern wie Desktop, Finale 17,39–17,71 s |
| Messung der Bühne `messen` Prolog/Epilog, Desktop und `--handy` (dpr 2,75), je neu und f09d114 | gleich: Median 17,7 ms, p95 18,5 ms in allen acht; längste Lücke neu/vorher Prolog Desktop 24/24, Handy 53/53, Epilog Desktop 24/24, Handy 35/54 ms; Konsole leer |
| Messung `bilder` (Desktop, hoch, quer, 360 × 640, Poco 393 × 873 dpr 2,75) | Wagen an jedem Ruhepunkt von Epilog und Prolog 4 ganz im Bild, Andeutung sichtbar |
| Sprungbrett `?szenen` «Prolog» / «Epilog» (Desktop, hoch) | Bühne mit dem Wagen (schlafend bzw. wach), nichts gespeichert, Konsole leer |

Bilder: `tests/output/buehne/u07/<format>-prolog-<n>.png`, `-prolog-4-andeutung.png`, `-epilog-<n>.png`;
`tests/output/geschichte/<desktop|handy-dpr275|quer-dpr275>-wagen-finale-endbild|-ueberblendung.png`,
`-wagen-epilog-anfang.png`.

Offen / zur Abnahme:

- Grösse des Wagens: auf Desktop und quer kleiner als im Finale (18 % bzw. 11 % der Bildbreite), weil über den Bergen
  nicht mehr Platz ist; Handy hoch gross (80 %). Wer ihn grösser will: `BUEHNENWAGEN.feld` (weniger Rand, mehr Höhe)
  oder die Kameras des Epilogs höher, vor allem Einstellung 3 (Antwort), die am tiefsten schaut.
- Das weitere Sichtfeld am Ende des Finales ist eine neue Bewegung (Desktop 32° → 55°); bei der Abnahme ansehen.
- Prolog 6: Länge unverändert (5,5 s Fahrt, Satz wie in der Spec, drei Zeilen auf Desktop wie bisher gemeldet).
- Review (anderer Agent), dann Commit durch den Koordinator.

**05.11.2026, Review** (unabhängiger Reviewer, Hauptarbeitskopie auf 902b7fa mit den Änderungen von 07)

Ergebnis: **bereit zum Commit.** Geprüft gegen Ticket, Spec (Entscheide 8, 15, 19, Ablauf 1, 6, 7, «Bühne von Prolog
und Epilog») und den Diff. Passt zu `ascend(stern)` aus dem Review 06: 07 ändert an `ascend` nichts, `wagenBlick` hat
nur noch die Aufrufer im Finale und in `wagenEnde`.

Selbst behoben: Kopfzeile von `wagenAblauf` in der Probe: Laufzeit gemessen und eingetragen (245–252 s in Desktop,
Handy hoch und quer; «etwa 4 min» stimmt).

Zu den Punkten:

1. **Wagen in Wagen:** grösste Abweichung 1,7 px (Desktop), 1,6 px (Handy hoch, dpr 2,75), 0,7 px (quer, dpr 2,75);
   Grenze 4 px. Bilder Endbild, Überblendung und Epilog-Anfang angesehen: deckungsgleich. Die Lage hängt nur von der
   Blickrichtung ab, nicht vom Ort der Kamera. Gelegt wird beim Vorwärmen in Satz 3 und bleibt bis zum Epilog
   (gleiche Folge, gleicher Bildschirm).
2. **Sichtfeld:** gemessen mit einer Kopie der Probe: Desktop am Endbild 55,4°, im ersten Bild des Epilogs und danach
   32°. Handy hoch (390 × 844, dpr 2,75) bleibt bei 44°, weil der Wagen dort ohne Weiten passt (die 49° der Notiz
   gelten für ein anderes Format). Zurückgesetzt wird nur in `ending(soft)`. Einen anderen Weg aus dem Finale gibt es
   nicht: Es ist nicht überspringbar, das Sprungbrett ist während einer Zwischenszene gesperrt, Neuladen startet
   frisch, und `onResize` setzt das Sichtfeld ohnehin neu. Kein Fund.
3. **Polarstern der Bühne:** am Ende 0,405/0,090, auf der Bühne 0,405/0,091 (Desktop); 0,090/0,106 gegen 0,090/0,108
   (hoch); 0,443/0,088 gegen 0,443/0,089 (quer). Waagrecht stimmt es jetzt. `erhoben()` rechnet wie früher `RAISED`
   bei Zoom 1 ohne Parallaxe. Auf Desktop läuft der Strahl in Prolog 4 darum knapp links am Polarstern vorbei, hoch
   und quer trifft er (klein, zur Abnahme).
4. **`spur`:** Die Korrektur stimmt (`f` bekommt die Zeit, in der das Stück angelegt wurde). Auf 902b7fa zeigen die
   Bilder der Messung Prolog 4 noch mit gesenktem Arm und ohne Strahl, jetzt richtig. `wagenBlick(unten, feld)`:
   `polar` hatte keinen Aufrufer mehr, passt.
5. **Lücken:** Im Finale auf Desktop beim Aufprall (Blick unten, etwa 16,5 s nach dem Klick): neu 35 / 53 / 53 ms
   (`--finale`, drei Läufe) und 53 ms (`--ganz`); auf 902b7fa 53 / 36 ms an derselben Stelle. Also unverändert und
   unter 100 ms. Handy und quer im Finale 35–36 ms. Prolog gleich am Anfang (`--ganz`): neu hoch 161 ms, quer 284 ms;
   auf 902b7fa quer 178 ms an derselben Stelle (hoch diesmal nicht). Epilog in `--ganz --handy`: neu 356 / 375 ms bei
   2,8 / 9,5 s; auf 902b7fa hoch 414 ms bei 2,9 s und quer 324 / 411 ms bei 2,9 / 9,6 s. Jede dieser Lücken beginnt
   etwa 50 ms nach einem Bild der Probe. 07 macht sie weder besser noch schlechter; kein Fund, weiter offen.
6. **Dauer des Finales** gegen `vorher/` (Grenze +4,5 s): `--finale` Desktop 17,70 s (+3,70), Handy dpr 2,75
   17,71 s (+3,40), `--ganz` Desktop +3,70, `--ganz --handy` +3,70. Reisen −0,51 … +0,02 s, Einstiege
   −0,11 … +0,01 s, Prolog −0,04 / −0,10 s, Epilog +0,00 / +0,16 s (gleich lang wie heute).

Läufe (alle über `LEISE_VORRANG=7 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm,
05.11. 19:08–21:38; Gegenproben auf 902b7fa in einem temporären Worktree, danach entfernt):

| Lauf | Ergebnis |
|---|---|
| Node: alle `*.test.mjs` und `golden`, danach `generator.test` | grün |
| `offline.mjs`, `--redirect` | grün |
| Probe ohne Argumente (4 Grade) | bestanden |
| `--wagen` Desktop / `--handy --dpr 2.75` / `--quer --dpr 2.75` | bestanden (245 / 252 / 251 s) |
| `--finale leicht` Desktop / Handy dpr 2,75 | bestanden, siehe 5 und 6 |
| `--ganz` Desktop | bestanden |
| `--ganz --handy --dpr 2.75` / `--quer --dpr 2.75` | rot nur an den Lücken aus 5 (auf 902b7fa ebenso rot) |
| `--handy --grad leicht`, `--dorf` | bestanden |
| `--menue` (neu 4, 902b7fa 4 Läufe) | rot nur an Lücken auf beiden Ständen: «Menü → Spiel (anderer Grad, andere Welt)» neu 244–282 ms in 4 von 4 Läufen, 902b7fa 245 / 267 ms in 2 von 4; «Spiel → Menü», «Weiter» und «Menü → Prolog» wechselnd auf beiden. Im Weg läuft kein Code von 07 |
| `--uebersicht` (neu 2, 902b7fa 1) | rot nur an Lücken an denselben Stellen auf beiden Ständen (124–468 ms) |
| Messung der Bühne `messen` Prolog/Epilog, Desktop und `--handy` | p95 18,5–18,7 ms, längste Lücke höchstens 36 ms (902b7fa Handy 141 ms) |
| Messung `bilder` (Desktop, hoch, quer, 360 × 640) | Wagen in Epilog und Prolog 4 ganz im Bild, Andeutung sichtbar, im Prolog schlafend kaum zu sehen wie verlangt |

Offen zur Abnahme durch den Nutzer (kein Fund): Wagen auf der Bühne klein auf Desktop (18 % der Breite) und quer
(11 %); die neue Bewegung beim Herauszoomen am Ende des Finales (Desktop 32° → 55°); Strahl in Prolog 4 auf Desktop
knapp neben dem Polarstern.
