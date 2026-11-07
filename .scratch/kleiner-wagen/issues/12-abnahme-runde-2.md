# 12: Abnahme, Runde 2 (Rückmeldungen des Nutzers vom 06.11., Stand 73e476e)

**Spec:** ../spec.md

**Blocked by:** 11

**Status:** ready-for-agent

**What to build:** Zweite Runde der Rückmeldungen aus der Abnahme auf dem Poco (Zwischenstand 73e476e von Ticket 11).
Wortlaut des Nutzers jeweils in Anführung; danach, was das im Spiel heisst. Zum Prolog allgemein: «der sieht schon
besser aus»; zum Halt beim Einstieg: «das mit dem pausieren und dem weitermachen nach einem klick ist super».

- [x] **Fall aufs Brett, Licht und Kamera im Einklang:** «Hier soll nur etwas noch verbessert werden und zwar die
      bewegung des lichts nach dem klick auf das brett. Die bewegung wirkt noch ungleichmässig, es wirkt als würde
      beschleunigt, verlangsamt und dann wieder beschleunigt. Beziehungsweise die bewegung des lichts und die
      kameraführung passen nicht schön zusammen.» Gemeint ist der Fall nach dem Tippen beim Halt (Einstieg, Dorf,
      Reise). Massgebend ist die Bewegung des Lichts **im Bild** (Bildschirm-Pixel je Bild), nicht nur entlang seines
      Wegs in der Welt: Die Kamera bewegt sich mit, darum kann ein in der Welt gleichmässiger Fall im Bild schwanken.
      Licht und Kamera so führen, dass das Licht im Bild gleichmässig fällt und die Kamera ruhig und stimmig folgt;
      messen (Geschwindigkeit im Bild über den ganzen Fall) und mit dem Stand 73e476e vergleichen.
- [x] **Finale, Strahlen laufen aus:** «es ist gut, dass die lichtstrahlen wieder verschwinden nachdem der stern
      aktiviert wurde, aber sie sollten nicht so abrupt verschwinden, sondern auslaufen.» Die Strahlen, die den Stern
      aktivieren, weich ausblenden bzw. auslaufen lassen statt abrupt verschwinden.
- [x] **Finale, Aufprall des Polarstern-Strahls:** «Der aufprall des lichts vom polarstern auf das brett sollte noch
      ein wenig schöner gemacht werden. Die animation sieht gut aus, aber der übergang von lichtstrahl zu brett wirkt
      noch hart.» Den Übergang vom Strahl aufs Brett weicher gestalten (z. B. Aufleuchten, Ausbreiten, Nachglühen am
      Brett), ohne die Animation selbst grundsätzlich zu ändern.
- [x] **Epilog, letzter Text springt nicht:** «sobald der letzte text angezeigt wird "noa lacht und ..." wird er kurz
      nachdem er angezeigt wird nach oben verschoben, damit der menü button platz hat. Das ist nicht so schön. Der
      text sollte von anfang an so platziert sein, dass der menü button genügend platz hat und nichts mehr verschoben
      werden muss.»
- [x] **Prolog, Wechsel zum letzten Text sauber:** «die texte verschwinden und werden wieder angezeigt nach jedem
      klick und das ist sehr sauber, ausser beim 2t letzten text zum letzten. Dort wirkt es kurz unschön, ich vermute,
      dass das ebenfalls mit den "üben" und "gleich los" button zusammenhängt.» Der Wechsel vom vorletzten zum
      letzten Prolog-Text soll so sauber wirken wie die übrigen (Ursache prüfen, vermutlich Platz für die Knöpfe
      «Üben» / «Gleich los»; Text von Anfang an richtig platzieren, nichts nachschieben).
- [x] **Kapitelende, Strahlen erst nach «Weiter»** (Nachtrag 06.11.): «wenn das letzte level einer welt
      abgeschlossen wurde, sollen die lichtstrahlen etc erst kommen, wenn der benutzer auf den "weiter zur ..." Button
      geklickt hat». Nach dem letzten Level einer Welt (auch im Finale beim sechsten Stern, falls dort derselbe Ablauf)
      starten Strahlen, Aufstieg und Erwachen erst mit dem Klick auf «Weiter zur …», nicht schon beim Abschluss.
- [x] Probe nachführen (Fall im Bild gleichmässig, Strahlen laufen aus, Text im Epilog und Prolog verschiebt sich
      nach dem Erscheinen nicht), Dauer gegen `vorher/` einordnen.
- [x] Alle betroffenen Tests grün; Review nach dem Ticket.

## Comments

**06.11.2026, Notiz des Umsetzers** (Worktree `kw12` auf 73e476e, nicht committet; Probe-Korrektur aus Review 11
(`mitText` in `pruefeErwachen`) von Hand übernommen)

Gebaut (`index.html`, `tests/geschichte-probe.mjs`):

1. **Fall aufs Brett, gleichmässig im Bild** (`story.fall`, `storyRampe`, `STORY_FLUG.fall`, `story.kameraNach`).
   Ursache gemessen: Bis 73e476e fiel das Licht in der Welt gleichmässig, und die Kamera folgte ihm (`look`), ab 70 %
   blendete sie aufs Brett. Im Bild stand das Licht darum zuerst fast still, sank dann (bis 4,7 px je Bild), blieb
   stehen und schoss am Ende **nach oben aus dem Bild** (bis 28 px je Bild, Desktop bis −67 px über dem oberen Rand),
   während es ausblendete; die Kamera drehte erst langsam, stand fast, und schwenkte zuletzt mit bis 2,2° je Bild.
   Jetzt umgekehrt gedacht: Im Bild fällt das Licht nach einem kurzen Anlauf (10 % der Zeit) gleich schnell von
   seinem Platz über dem Untertitel bis dorthin, wo das Brett im Endbild steht; die Kamera dreht auf dem Grosskreis
   vom Himmel aufs Brett mit Anlauf (15 %), gleichmässig, und sanftem Ankommen (letzte 35 %). Den Ort in der Welt
   ergeben beide (Strahl der Kamera durch den Punkt im Bild, Abstand im Kehrwert gleichmässig vom Halt zum Brett).
   Dauer (2,8 s), Ausblenden, Herauswachsen des Levels und Schliessen des Untertitels an denselben Stellen wie bisher.
   Die Kamera wird im selben Bild ausgerichtet, in dem das Licht gesetzt wird (vorher hinkte der Blick ein Bild nach).

   | Licht im Bild, px je Bild (je 200 ms, nach dem Anlauf bis zum Ausblenden) | 73e476e | jetzt |
   |---|---|---|
   | Desktop, Einstieg Vulkan | 0,75 → 4,71 → 0,93 → 27,8 (±388 %) | 1,18 gleichbleibend (±0 %) |
   | Desktop, Reise ins Meer | 0,62 → 4,69 → 0,30 → 22,8 (±353 %) | 1,17 (±0–2 %) |
   | Handy dpr 2,75, Einstieg / Reise | 0,58 → 4,56 → 0,70 → 12,1 / 0,60 → 4,49 → 0,30 → 13,2 | 1,37 / 1,37 (±0 %) |
   | quer dpr 2,75, Einstieg / Reise | 0,31 → 2,28 → 0,19 → 11,9 / 0,38 → 2,23 → 0,13 → 12,7 | 0,59 / 0,59 (±0 %) |
   | Kamera, Grad je Bild (Desktop) | 0,10 → 0,01 → 2,2 (zweiter Anstieg) | 0,17 → 0,64 gleichbleibend → 0,06 |

   Alle Halte und Fälle der Abläufe (Einstieg Bergwald, Reisen 1–5, Vulkan, Dorf) gleich: Abweichung 0–2 %, ein
   einzelnes Fenster bis 10 % beim Herauswachsen. Der Weg ist im Bild kurz (Desktop 187 px in 2,8 s), das Licht
   «reitet» also mit der Kamera hinab; die Bewegung gegen den Hintergrund kommt aus der Kamera.
2. **Finale, Strahlen laufen aus** (`story.auslaufen`, `uTail` in `makeBeam`, `STORY_PULS.auslaufen` 1,6 s): Statt in
   0,8 s gleichmässig dunkler zu werden, zieht sich ihr Ende weich (ein Fünftel der Länge als Verlauf) zum sechsten
   Stern hinauf, die Strahlen fliessen in ihn hinein und werden in der zweiten Hälfte zugleich schwächer; danach aus,
   vor dem Puls. Gemessen: aus nach 1,60 s (vorher 0,80 s), nimmt über 1,13–1,15 s ab, grösster Schritt 3,4 % je
   Bild. Die Strahlen am Ende der Welten 1–5 (Übergabe an den Träger, 0,9 s) habe ich nicht angefasst.
3. **Finale, weicher Aufprall der Antwort** (`STORY_PULS.antwort`, `shock(…, { von, anstieg })`, `pulse(anstieg)`):
   Die Animation des Strahls bleibt. Neu: Im letzten Drittel seines Wegs glüht das Brett unter der Spitze schon auf
   (bis 0,45), daraus läuft die Lichtwelle, die erst in 0,35 s ganz hell wird; der Schein (Bloom) steigt ebenso in
   0,35 s weich an statt in 0,13 s (höchstens 7,7 % der Grundhelligkeit je Bild statt rechnerisch gut 16 %); der Strahl
   läuft danach in 2,0 s ins Brett aus (zügig durch das ferne Stück, langsam durch das nahe, sichtbare) statt 1,4 s
   gleichmässig dunkler zu werden. Gemessen: Glut vor dem Aufprall 0,44–0,45, Auslaufen über 1,42–1,43 s.
4. **Epilog, letzter Satz steht von Anfang an** (`scene.say(text, { umbau })`, `scene.platzFuer`): Die Bühne ist unten
   bündig; «Zum Menü» kam erst nach der Fahrt dazu und schob den Satz 63 px hinauf (Handy, gemessen auf 73e476e).
   Jetzt bekommt der letzte Satz den Platz für den Knopf schon, bevor er erscheint, und zwar erst, wenn der vorige
   Satz ganz ausgeblendet ist (sonst rückte der); der Knopf füllt den Platz danach. Gemessen: 0,0 px.
5. **Prolog, Wechsel zum Angebot sauber**: Ursache wie vermutet. Mit «Im Dorf» und den Knöpfen «Üben» / «Gleich los»
   wurde die Bühne sofort höher (Knöpfe, Zeile darüber; dafür fiel der Hinweis weg), noch während der letzte Satz des
   Prologs ausblendete: Er sprang dabei 34 px (Handy, 73e476e). Jetzt baut `say` mit `umbau` erst um, wenn der alte
   Satz aus ist, und zeigt dann Satz, «Im Dorf» und Knöpfe zugleich (ohne die sonstige Verzögerung von 0,5 s, CSS
   `.sub.sofort`); der neue Satz kommt so 0,1 s später als vorher. Gemessen: 0,0 px. Das Laden des Walds hinter der
   Bühne (`stillBild`, `ruhe`) beginnt wie bisher erst, wenn das Angebot steht.
6. **Kapitelende, Strahlen erst nach «Weiter»** (Nachtrag): Im Spiel begann der Aufstieg schon bisher erst mit
   «Weiter zum …» (bzw. «Hinaufschauen» vor dem Finale; geprüft in allen sechs Welten, `pruefeWartetAufWeiter`: 3 s
   nach dem Lösen nur «Gelöst»). Die Ursache war das **Sprungbrett**: Bei «Bergwald → Meer» usw. und «Finale» löste es
   das letzte Level und tippte 0,7 s danach selbst auf «Weiter». Jetzt löst es nur noch; «Weiter zum …» tippt der
   Spieler (eigenes Skript mit `?szenen`, «Bergwald → Meer» und «Finale»: 3 s nichts, nach dem Klick steigen die
   Strahlen, Konsole leer). Spec «Sprungbrett» sagt dazu nichts Abweichendes.

Probe: `pruefeFall` misst jetzt im Bild (`pruefeFallImBild`: Licht höchstens 15 % vom Mittel nach dem Anlauf, Kamera
ohne zweiten Anstieg; gezählt nur gezeichnete Bilder, Zeit der Aufzeichnung aus dem rAF-Zeitstempel; Werte je Bild in
`tests/output/geschichte/<bildschirm>-fall-<was>.json`), neu `--fall` (gut 1 min: Einstieg Vulkan und Reise ins
Meer). `pruefeFinale` prüft das Auslaufen der Strahlen (mindestens 1 s, höchstens 5 % je Bild) und den Aufprall
(Glut davor, Schein höchstens 12 % je Bild, Auslaufen der Antwort). `texteAufzeichnen` / `pruefeTexteRuhig` in
`buehneDurch` (Prolog, Epilog): kein Satz, «Im Dorf» oder Knopf rückt, solange er zu sehen ist (≤ 0,5 px; in der
Seite ausgewertet, das Holen einer langen Aufzeichnung hielt sonst die Seite an). `pruefeWartetAufWeiter` nach dem
letzten Level jeder Welt.

**Dauern gegen `vorher/`** (netto, `--ganz --grad leicht`): Einstieg Bergwald +0,24 / +0,15 s (Desktop / Handy dpr
2,75; Grenze 0,5), Reisen +0,20 … +0,25 / −0,28 … +0,20 s (Grenze 1,2), Finale +3,68 / +3,67 s (Grenze 4,5, wie Ticket
11), Epilog +0,04 / +0,20 s, Prolog bis zum Angebot +0,43 / +0,63 … +0,93 s (davon 0,1 s der spätere Satz des
Angebots; auf dem Handy dazu die Lücke nach dem Bild der Probe, siehe unten). Die Reisen laufen auf 73e476e mit
derselben Probe gleich lang (z. B. Meer 13,37 s alt / 13,37–13,39 s neu); der Fall dauert unverändert 2,75–2,79 s.

Geprüft (alle über `LEISE_VORRANG=12 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

| Lauf | Ergebnis |
|---|---|
| Node `geschichte`, `levelliste` | grün |
| `--fall` Desktop / `--handy --dpr 2.75` / `--quer --dpr 2.75` | bestanden; auf 73e476e mit derselben Probe je 2 Fehler (Fall ungleichmässig) |
| `--wagen` Desktop / Handy dpr 2,75 / quer dpr 2,75 | bestanden (alle Fälle 0–2 %, eines bis 10 %; Strahlen laufen 1,13–1,15 s aus; Aufprall: Glut 0,44–0,45, Schein ≤ 7,8 % je Bild, Antwort läuft 1,42–1,43 s aus; 6 × nichts vor «Weiter»; Wagen in Wagen ≤ 1,5 px) |
| `--ganz --grad leicht` Desktop (`--vorher desktop.json`) | bestanden; Prolog und Epilog 0,0 px |
| `--ganz --grad leicht --handy --dpr 2.75` (`--vorher handy.json`) | Prolog und Epilog 0,0 px, Dauern in den Grenzen; rot nur an zwei Lücken, je 52–53 ms nach einem Bild der Probe (Prolog: nach dem Bild von Satz 6, 356–414 ms, in drei Läufen; Finale: während Satz 1 auf Tippen wartet, 394–416 ms, das bekannte Muster, auf 73e476e im selben Lauf 317 ms). Nach der Regel Artefakte der Probe; ein eigenes Skript mit denselben Fingertipps und dem Bild vor Satz 6 (über das Menü und über `?szenen`, mit und ohne Aufzeichnung der Texte) zeigt auf beiden Ständen nur das Bild selbst (130–160 ms) |
| `--dorf` Desktop | bestanden (Angebot mit «Üben», Einstieg ins Dorf mit Halt und Fall) |
| `--grad leicht --welten 1 --finale leicht --handy --dpr 2.75` auf 73e476e (Vorher für die Texte) | Prolog: Satz 6 rückt 34 px, Epilog: letzter Satz rückt 63 px |
| `?szenen` (eigenes Skript): «Bergwald → Meer», «Finale» | nach dem Lösen 3 s nichts, erst «Weiter» startet die Strahlen; Konsole leer |

Bilder: als Folge (Szene je Bild angehalten) im Scratchpad der Sitzung
(`C:\Users\admin\AppData\Local\Temp\claude\C--workspace-Prisma\d92a00d2-eeb6-4bc8-b48f-435d3af059b7\scratchpad\u12\bilder\`):
Fall `desktop-fall-0 … 9.png`, Auslaufen
`desktop-auslaufen-0 … 4.png`, Aufprall `desktop-aufprall-0 … 7.png`; Probe `tests/output/geschichte/desktop-leicht-`
`epilog-ende.png`, `<format>-leicht-prolog-ende.png`, `<format>-wagen-finale-*.png`.

Offen / zur Abnahme:

- Fall: Das Licht sinkt im Bild jetzt nur noch ruhig vom Platz über dem Untertitel bis aufs Brett (Desktop 187 px,
  Handy hoch etwa 220 px, quer 95 px in 2,8 s); das Gefühl des Fallens kommt aus der Kamera, die gleichmässig aufs
  Brett schwenkt. Werte zum Abstimmen: `STORY_FLUG.fall` (`dauer`, `kamera` [Anlauf, Abbremsen]), `STORY_FLUG.anlauf`.
- Strahlen am Ende der Welten 1–5 (nicht im Finale) gehen weiter wie bisher in 0,9 s aus, während der Träger das Licht
  nimmt; auf Wunsch dort dasselbe Auslaufen (`story.auslaufen`).
- Aufprall: Werte `STORY_PULS.antwort` (`vorglut`, `glut`, `anstieg`, `aus`) und Dauer des Auslaufens im Finale
  `STORY_PULS.auslaufen`.
- Prolog: Der Satz des Angebots kommt 0,1 s später als bisher (erst nach dem vorigen Satz).
- Halt auch auf der Reise (Hinweis des Koordinators aus Review 11): Der Wortlaut des Nutzers nennt nur das Einfliegen in
  eine Welt; Ticket 11 hält auch am Ende der Reise an. Bleibt so, der Nutzer bestätigt es bei der Abnahme.
- Das Sprungbrett tippt «Weiter» nicht mehr selbst: Bei «Bergwald → Meer» usw. und «Finale» muss man nach dem Lösen
  selbst auf «Weiter zum …» bzw. «Hinaufschauen» tippen.
- Review (anderer Agent), dann Commit durch den Koordinator.

**06.11.2026, Review** (unabhängiger Agent, Arbeitskopie 0c25b4a + Ticket 12, nicht committet; mit dem ganzen Testsatz
der Tickets 11 und 12)

Gegen den Wortlaut geprüft, Code gelesen:

- Fall (`story.fall`, `storyRampe`, `kameraNach`): Licht im Bild gleich schnell, Kamera auf dem Grosskreis mit Anlauf,
  gleichmässig, sanftem Ankommen; Überspringen im Fall geht wie bisher über `land` (Blick aus `gazeDir`, `gaze` 1).
  Gemessen in allen fünf Formaten: Licht 0–2 % Abweichung, Kamera ohne zweiten Anstieg. Das Licht wandert im Bild nur
  wenig (0,6–1,4 px je Bild); das Fallen sieht man vor allem an der Kamera (Punkt für die Abnahme, wie der Umsetzer).
- Strahlen laufen aus (`uTail`, `auslaufen`): stetig, das Ende rückt mit weichem Stück zur Spitze, `aim` setzt `uTail`
  wieder auf 0 (auch beim Strahl der Antwort im nächsten Finale). Aufprall (`shock` mit `von`/`anstieg`, `pulse(anstieg)`):
  ohne Sprung beim Übergang von der Glut in die Welle. Bilder angesehen: Strahlen fliessen in den Stern, Glut unter der
  Spitze vor dem Aufprall.
- Epilog und Prolog (`say` mit `umbau`, `platzFuer`, `.sub.sofort`): richtig gedacht, aber **an eine feste Zeit
  gebunden** (Fund unten, behoben).
- Kapitelende: «Weiter zum …» startet Strahlen und Aufstieg in allen sechs Welten (`pruefeWartetAufWeiter`), das
  Sprungbrett löst nur noch.
- Ticket 11 unverändert: Halt bis zum Tippen (alle Halte still), Stern beim Erwachen an seinem Platz (0,0 px), Wagen im
  Menü nur einmal, Bühnenwagen rechts (Wagen in Wagen 0,6–1,3 px, Mitte Desktop 0,71).

**Fund und Korrektur** (`index.html`, `scene.say`): Der Umbau (Angebot bzw. Platz für «Zum Menü») lief 600 ms nach dem
Tippen, gleich lang wie das Ausblenden des alten Satzes. Das Ausblenden beginnt aber erst mit dem nächsten Bild: Kommt
das spät, schob der Umbau den noch halb sichtbaren Satz. Gesehen in `--quer --dpr 2.75` (Probe ohne Argumente):
Prolog-Satz 6 rückte **42 px** (die Probe macht vor dem Tippen ein Bild, danach fehlen oft 400 ms Bilder). Nachgestellt
mit eigenem Skript (Seite 200–400 ms belegt gleich nach `say`): vorher 34 px (hoch) / 42 px (quer), jetzt 0 px. Jetzt
wartet `say` auf das Ende der Transition des alten Satzes (`getAnimations().finished`, Rückfall nach 2,4 s). Auf dem
Poco ist ein spätes Bild beim Tippen gut möglich; das war genau der Sprung aus der Rückmeldung. Dazu zwei kleine
Absicherungen: Fällt der Umbau im Angebot weg (Bühne neu begonnen), bleibt die Wahl wie bis Ticket 12 offen, statt als
«Gleich los» zu gelten (`offer`); endet die letzte Fahrt des Epilogs vor dem Umbau, baut `playScene` gleich um, sonst
nähme der Umbau «Zum Menü» wieder weg.

Läufe (alle über `LEISE_VORRANG=12 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm; Logs im
Scratchpad `r12`). «Artefakt»: Lücke 36–54 ms nach einem Bild der Probe.

| Lauf | Ergebnis |
|---|---|
| Node: alle `tests/*.test.mjs` parallel, `golden.mjs` | grün (golden 847 Level) |
| `--fall` Desktop / hoch dpr 2,75 / quer dpr 2,75 / 360 × 640 / 320 × 568 | bestanden; Licht 1,18 / 1,37 / 0,59 / 1,06 / 0,96 px je Bild, Abweichung 0–2 % |
| `--wagen` in denselben fünf Formaten, hoch zweimal | bestanden (Kicker der Reise jetzt gefunden); Strahlen laufen 1,13 s aus, Aufprall Glut 0,45, Schein ≤ 7,8 % je Bild |
| `--finale leicht` Desktop / hoch (`--vorher`) / quer / 360 / 320 | Desktop, 320 bestanden; hoch, quer, 360 rot nur je an einem Artefakt (Finale bzw. Fortsetzen). Finale +3,67 / +3,40 s, Fortsetzen +0,14 / +0,23 |
| `--ganz` Desktop `--vorher` (zweimal, zweiter nach der Korrektur) | bestanden; Reisen +0,17 … +0,25, Einstieg +0,23/+0,24, Finale +3,70/+3,72, Prolog +0,40/+0,50, Epilog +0,05 |
| `--ganz --handy --dpr 2.75 --vorher` (dreimal) | 1. Lauf ganz grün; sonst rot nur an Artefakten (Prolog nach dem Bild von Satz 6 bzw. des Angebots, Epilog) und am Anfang des Prologs (siehe unten). Reisen −0,29 … +0,18, Finale +3,68 … +3,73. Die Lücken von Review 11 (Reise in die Wüste) kamen in keinem Lauf (auch nicht zweimal auf 0c25b4a) |
| `--ganz --quer --dpr 2.75` (zweimal) | rot nur an Artefakten und einmal 107 ms am Anfang des Prologs; Texte 0,0 px |
| Probe ohne Argumente: Desktop / hoch / 360 / 320 | bestanden (Arm Prolog 4: 44,5°) |
| Probe ohne Argumente quer | 1. Lauf: Satz 6 rückt 42 px (Fund oben); nach der Korrektur bestanden |
| `--dorf` Desktop (zweimal) / hoch / quer / 360 / 320 | alle Prüfungen grün; rot nur «Übung 8 wiederholen → Übung 9» 142–446 ms (bekannt seit Ticket 06) |
| `--menue` 5 Formate, Desktop dreimal, hoch und quer zweimal | alle Prüfungen grün; rot nur «Menü → Prolog (neuer Grad)» 213–431 ms, 50–70 ms nach Beginn (bekannt seit Review 08). Auf 0c25b4a mit derselben Probe 3 von 7 Läufen ebenda (178–428 ms), hier 7 von 9 |
| `--uebersicht` 5 Formate | alle Prüfungen grün; rot nur an Lücken beim Öffnen/Schliessen der Übersicht (107–449 ms). Auf 458145d und 0c25b4a dieselben Stellen (125–446 ms) |
| `buehne-messung messen` Prolog/Epilog, Desktop/`--handy` | p50 17,7 ms, p95 18,4–18,6, längste 24–36 ms, Konsole leer |
| `buehne-messung bilder r12` | Bilder aller Formate (`tests/output/buehne/r12/`) |
| `offline.mjs`, `--redirect` | grün (je 20 Prüfungen) |
| Vergleich 0c25b4a mit der neuen Probe, `--ganz --handy` (zweimal) | Prolog-Satz 6 rückt 34 px, letzter Satz des Epilogs 63 px (die Rückmeldungen, jetzt 0,0 px); Lücke nach dem Bild von Satz 6 auch dort (374/392 ms) |

Offene Lücke des Umsetzers (hoch, Prolog nach dem Bild von Satz 6): kommt auf 0c25b4a gleich (Artefakt der Probe). Neu
beobachtet, nicht von Ticket 12: Lücke 107–341 ms 50–90 ms nach dem Beginn des Prologs (auch in `--menue`), auf
0c25b4a ebenso, dort etwas seltener; beim Poco beobachten.

Zur Abnahme (zusätzlich zu den Punkten des Umsetzers): Das Licht fällt im Bild kaum (Desktop 187 px in 2,8 s); ob der
Fall so «fällt», entscheidet der Nutzer (`STORY_FLUG.fall`). Auf dem ersten Bild des Angebots steht «Im Dorf» schon
heller als Satz und Knöpfe (Bild `…-prolog-ende.png`; vielleicht nur das Bild der Probe), am Gerät ansehen.
