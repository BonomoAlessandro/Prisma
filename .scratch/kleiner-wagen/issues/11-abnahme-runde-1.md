# 11: Abnahme, Runde 1 (Rückmeldungen des Nutzers vom 06.11.)

**Spec:** ../spec.md

**Blocked by:** 09

**Status:** ready-for-agent

**What to build:** Die Rückmeldungen des Nutzers aus der Abnahme auf dem Poco (Stand 458145d). Wortlaut des Nutzers
jeweils in Anführung; danach, was das im Spiel heisst.

- [x] **Einflug in eine Welt, Licht wartet:** «beim einfliegen in die welt wäre es schöner, wenn das licht beim
      einfliegen stoppt, es nicht weitergeht, bis der benutzer klickt. so könnten wir auch sicherstellen, dass der
      benutzer genug zeit hat, den text zu lesen.» Beim Einstieg in eine Welt (auch ins Dorf) hält das Licht über
      dem Untertitel an und bleibt dort, bis der Spieler tippt, klickt oder eine Taste drückt; kein Zeitablauf.
- [x] **Danach gleichmässig aufs Brett:** «Wenn der Benutzer dann klickt, soll das licht gleichmässig mit der selben
      geschwindigkeit auf das brett fallen und nicht wie aktuell noch kurz abzubremsen.» Der Fall vom Halt bis aufs
      Brett mit gleichbleibender Geschwindigkeit, ohne Abbremsen am Ende (Ankunft auf dem Brett wie bisher).
- [x] **Kapitelende, Stern schon oben:** «Wenn eine welt abgeschlossen wird gibt es die lichtstrahlen in den himmel
      und auf einen stern, das ist gut, aber der stern soll beim getroffen werden schon weiter oben im bildschirm
      liegen. denn sobald es weitergeht, und der nächste text angezeigt wird, soll sich das bild nicht zuerst wieder
      verschieben müssen.» Der Blick beim Aufstieg so wählen, dass der Stern beim Erwachen schon dort steht, wo er
      für den folgenden Text (Reise, Leiste) stehen muss; kein Nachschieben des Bilds danach.
- [x] **Prolog, Wagen weiter rechts:** «das sternzeichen am himmel soll weiter rechts im bild sein, sodass noa nicht
      so steil in den himmel leuchten muss.» Auf der Bühne den Wagen (mit Polarstern) weiter nach rechts, in allen
      Formaten; Noas Arm und Strahl folgen (`erhoben()`). Wagen in Wagen (Ende Finale → erstes Bild Epilog, Ticket
      07) muss weiter stimmen.
- [x] **Finale, Strahlen gehen aus:** «im finale sollen die lichtstrahlen die den stern aktivieren wieder ausgehen
      sobald der stern aktiviert ist.»
- [x] **Finale, kein Blick zum Polarstern:** «ausserdem soll der fokus kurz bevor der polarstern seinen lichtstrahl
      auf das brett sendet nicht auf ihn gesetzt werden, sondern es soll einfach ein lichtstrahl von ihm gesendet
      werden.» Die Kamera schwenkt vor dem Strahl des Polarsterns nicht mehr zu ihm; der Strahl kommt aus dem
      aktuellen Bild.
- [x] **Menü nach dem Epilog, Wagen doppelt** (Nachtrag 06.11.): «Nach dem finale ist das ganze sternzeichen am
      himmel ersichtlich, dann kommt der übergang zum epilog und nach dem epilog landet man wieder im menü. Im menü ist
      dann der hintergrund entsprechend der aktuellen welt und da zuvor das sternzeichen komplett sichtbar wurde, sieht
      man es jetzt 2 mal im menü. 1 mal vom hintergrund und das andere mal als teil des menüs». Im Menü (und überall,
      wo die Sternkarte des Menüs den Wagen zeigt) darf der Wagen nur einmal zu sehen sein; der Wagen am Himmel des
      Hintergrunds dort nicht zusätzlich. Auch nach Neuladen mit fertigem Stand prüfen.
- [x] Probe nachführen (Warten auf Tippen beim Einstieg, Stand des Sterns nach dem Erwachen, Bühne), Dauer der
      Reisen und des Finales gegen `vorher/` neu einordnen (das Warten auf Tippen zählt nicht als Dauer).
- [ ] Alle betroffenen Tests grün; Review nach dem Ticket.

## Comments

**06.11.2026, Notiz des Umsetzers** (Hauptarbeitskopie auf 458145d; nicht committet)

Gebaut (`index.html`, `tests/geschichte-probe.mjs`):

1. **Licht hält an** (`story.anhalten`, `STORY_FLUG.halt`): Am Ende des Flugs von Einstieg (`enter`, auch ins Dorf) und
   **Reise** (`travel`) hält das Licht über dem Untertitel an; erst dann erscheint «Tippen»/«Klicken» unter dem Text
   (`.caption.warte` bis dahin; in `.caption.mitte` ohne Höhe im Fluss, sonst rückten Text und Licht beim Erscheinen
   hinauf), und es geht erst weiter mit Tippen, Klick, Enter oder Leertaste, ohne Zeitablauf. **Entscheid:** Auch die
   Reise hält an; sie endet mit derselben Ankunft und demselben Untertitel wie der Einstieg, und der Grund des Nutzers
   (Zeit zum Lesen) gilt dort genauso. Tippen während des Flugs beschleunigt ihn wie bisher; ein Tippen in den ersten
   0,3 s des Halts zählt nicht (galt noch dem Flug, sonst rutschte man mit einem Doppeltipp durch). Gehaltenes Enter
   wirkt nicht (Tastenwiederholung, wie bisher überall). Im Einstieg beenden «Überspringen» und Esc auch den Halt
   (weiche Landung wie bisher); Reisen bleiben nicht überspringbar. Während des Halts behält das Licht seine Richtung
   von der Kamera aus (`haltAuf` in `update`): Die Kamera gleitet nach einem Levelwechsel noch nach, das Licht wanderte
   sonst 3–4 px in 3 s (Fund der Probe, behoben). Für Proben: `story.halt`.
2. **Gleichmässiger Fall** (`storyFall` statt `storyEase` in `fall`): 10 % des Wegs Anlauf (`STORY_FLUG.anlauf`, kein
   Ruck aus dem Stand), danach gleich schnell bis aufs Brett; Ankunft, Ausblenden und Herauswachsen an denselben
   Stellen des Wegs wie bisher. Gemessen (Probe, Weg je Sekunde nach 20–35 / 50–65 / 80–95 % der Zeit): höchstens
   ±4 % Unterschied, Fall 2,74–2,82 s. Folge: Das Level wächst gut 0,2 s später nach dem Tippen (die Mitte des Wegs
   wird später erreicht als mit dem eiligen Mittelteil von `storyEase`).
3. **Stern beim Erwachen schon an seinem Platz** (`ascend(stern, { ende })`, `blickAuf`, `captionVorab`, `lichtFuer`,
   `ankunft`): Der Blick des Aufstiegs kommt in der Richtung an, die der folgende Untertitel braucht; der Untertitel
   der Reise wird dafür vorab an einer verborgenen Kopie gemessen. `travel` senkt den Blick danach nicht mehr.
   Gemessen: Stern beim Erwachen waagrecht mittig und in der Mitte des freien Raums über dem Kicker (Desktop 0,225 der
   Höhe bei Kicker 0,45; hoch 0,219 / 0,437; quer 0,192 / 0,385), danach bis zum Abflug **0,0 px** verschoben, in allen
   fünf Welten und drei Formaten. Im Finale ebenso: Der Blick kommt gleich im Bild des ganzen Wagens von Satz 1 an
   (`wagenBlick` mit der vorab gemessenen Oberkante des Untertitels), danach 0,00° Drehung.
4. **Wagen weiter rechts** (`BUEHNENWAGEN.feld.lage` 0,8 und `breite` 0,6, `wagenEnde`, `story.seit`, `erhoben`):
   Wagen in Wagen bleibt der Massstab: Die Bühne legt ihren Wagen weiter dorthin, wo ihn das Finale zuletzt zeigt.
   Damit er dort rechts der Mitte und trotzdem **aufrecht** steht (seitlich der Mitte stünde er bei 60° Höhe schräg,
   Ticket 06), dreht sich die Kamera am Ende des Finales um ihre eigene Hochachse (`seit`, mit dem Blick hinauf
   eingeblendet, beim Übergang in den Epilog wieder 0). Den Horizont, der sich dabei neigt, sieht man dort nicht (Blick
   hoch in den Himmel der Sterne). **Entscheid «wie weit»:** `lage` 0,8 = 80 % des Wegs vom linken zum rechten Rand
   des freien Platzes (1,0 wäre bündig am rechten Rand mit 4 % Abstand: wirkte an die Kante gedrückt und gewänne nur
   4–5°). Im Hochformat füllte der Wagen 80 % der Breite und hatte keinen Platz nach rechts; `breite` 0,6 begrenzt ihn
   auf 60 % des Platzes (54 % der Bildbreite), damit er rechts stehen kann. Noas Arm zielt jetzt im Bild der
   Einstellung, in der sie leuchtet (Prolog 4 bzw. Epilog 3), mit der Parallaxe von Himmel und Hügel genau auf den
   Polarstern (vorher «wie bei Zoom 1»: auf dem Desktop knapp daneben, Punkt aus der Abnahmeliste von Ticket 07).

   | | Desktop | hoch (Poco) | quer | 360 × 640 |
   |---|---|---|---|---|
   | Noa leuchtet in Prolog 4 (Grad über der Waagrechten), vorher → jetzt | 58,3 → **44,5** | 85,9 → **74,9** | 53,6 → **38,7** | 81,9 → **73,3** |
   | Noa in Epilog 3 | 37,6 | 93,1 (Polarstern fast senkrecht über ihr) | 29,2 | – |
   | Mitte des Wagens am Ende des Finales (Anteil der Breite), vorher 0,50 | 0,71 | 0,58 | 0,73 | 0,58 |
   | Polarstern dort (Breite / Höhe) | 0,61 / 0,10 | 0,31 / 0,14 | 0,65 / 0,11 | 0,31 / 0,12 |
   | Breite des Wagens (vorher) | 20 % (18 %) | 54 % (80 %) | 15 % (11 %) | 53 % (66 %) |
   | Drehung `seit` am Ende | 19° | 3° | 33° | 3° |
   | Wagen in Wagen, grösste Abweichung (Grenze 4 px) | 1,5–1,9 px | 0,9–1,0 px | 0,5 px | – |

   (360 × 640 aus einem eigenen Skript mit derselben Rechnung, die übrigen aus der Probe.)
5. **Strahlen gehen aus** (`ascend(…, { aus: true })` im Finale): 0,8 s nach dem Erwachen des sechsten Sterns aus
   (gemessen 800–802 ms), vor dem Puls; `deichsel` blendet sie nicht mehr.
6. **Kein Schwenk zum Polarstern** (`antwortBlick`): Die Kamera bleibt im Bild des ganzen Wagens, bis die Spitze des
   Strahls halb unter die Mitte gefallen ist, und folgt ihr dann weich (die Spitze bleibt höchstens ¾ der halben
   Bildhöhe unter der Mitte), bis aufs Brett wie bisher. Gemessen: 0,00° Drehung, solange der Strahl im ersten Zehntel
   seines Wegs ist (vorher drehte die Kamera in den ersten 0,7 s zum Polarstern).
7. **Wagen im Menü nur einmal** (Nachtrag): Solange Menü oder Übersicht offen sind (beide zeigen den Wagen auf ihrer
   Sternkarte bzw. ihrem Himmel), blendet der Wagen am Himmel dahinter in 0,4 s aus (`himmelsWagen.blendet`, hält die
   Schleife dafür wach) und im Spiel wieder ein. Gilt in jedem Stand, nicht nur nach dem Finale. Geprüft nach dem
   Epilog («Zum Menü», drei Formate), nach Neuladen mit geschafftem Grad im Menü und in der Übersicht, und dass er im
   Spiel danach wieder da ist (`pruefeWagenEinmal`).

Probe (`tests/geschichte-probe.mjs`): `until` tippt bei einem Halt wie ein Spieler auf den Untertitel (`haltTippen`),
wo der Halt nicht eigens geprüft wird. `halt()` prüft ihn bei den Einstiegen (Bergwald, Sterne, Vulkan, Dorf, Bergwald
nach dem Dorf) und Reisen der Abläufe: Aufforderung zu sehen, Licht still (< 2 px nach 0,5–3,5 s) und in der Mitte des
freien Raums über dem Text (`pruefeLeiste`), dann Tippen. Neu `pruefeFall` (gleichmässig), in `pruefeErwachen` statt
«Blick < 3° beim Stern» der Stand über dem Untertitel der Reise und 0 Verschiebung danach, in `pruefeFinale` Blick
nach dem Erwachen, Strahlen aus, kein Schwenk vor der Antwort, Wagen rechts der Mitte; `pruefeArm` (Prolog 4 und
Epilog 3: Arm zielt auf den Polarstern, druckt den Winkel), `pruefeWagenEinmal`; im Dorf («Sehr schwer») den Einstieg
in den Bergwald **während des Halts** überspringen (`einstiegWeg`). Bilder neu: `desktop-leicht-einstieg-halt`,
`desktop-leicht-reise-2-halt`, `desktop-dorf-einstieg-halt`, `<format>-wagen-menue-geschafft`.

**Dauern gegen `vorher/`, wie gemessen:** wie bisher netto = Uhr vom Klick bis zum Ende der Szene ohne die Bilder, in
denen ein Satz auf Tippen wartet (`story.waitTap` gesetzt; das gilt auch für den Halt, `anhalten` wartet über
`untilTap`), und ohne die Zeit, in der ein Bild der Probe die Seite anhält. Das Warten am Halt zählt also nicht.

| Abschnitt (netto, s) | Desktop | Handy dpr 2,75 | quer dpr 2,75 |
|---|---|---|---|
| Einstieg in die Sterne beim Fortsetzen, Vorher-Lauf → jetzt | 5,99 → 6,12–6,17 (+0,13 … +0,18) | 5,93 → 6,14–6,17 (+0,21 … +0,24) | – → 6,13–6,18 |
| Finale, Vorher-Lauf → jetzt | 14,00 → 17,69–17,72 (+3,69 … +3,72) | 14,31 → 17,65–17,70 (+3,34 … +3,39) | – → 17,68–17,71 |

Einordnung: Das Finale ist gleich lang wie vor diesem Ticket (Review 08: +3,67 / +3,38 s); Halt, Antwort ohne
Schwenk und früheres Ausgehen der Strahlen ändern seine Länge nicht. Einstiege +0,2 s gegen vor diesem Ticket (Review
08: −0,07 / +0,02 s), Ursache der gleichmässige Fall (Punkt 2), innerhalb der Grenze +0,5 s. Die Reisen hat dieses
Ticket nicht gemessen (`--ganz` macht der Reviewer); erwartet ebenso etwa +0,2 s (gleicher Fall), Grenze +1,2 s.

Geprüft (alle über `LEISE_VORRANG=11 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

| Lauf (Stand am Ende, mit allen sieben Punkten) | Ergebnis |
|---|---|
| Node `geschichte`, `levelliste` (parallel) | grün (35 / 54) |
| `--wagen` Desktop / `--handy --dpr 2.75` / `--quer --dpr 2.75` | bestanden (alle Halte still, 0,0 px Verschiebung nach dem Erwachen, Fall gleichmässig, Strahlen aus nach 0,8 s, 0,00° Schwenk vor der Antwort, Wagen in Wagen ≤ 1,9 px, Wagen nur einmal hinter Menü und Übersicht) |
| `--finale leicht` Desktop / Handy dpr 2,75 (je `--vorher`) | bestanden; Dauern siehe oben; «Epilog → Menü» 19–20 ms |
| `--finale leicht --quer --dpr 2.75` | rot nur an einer Lücke im Finale (449 ms, 50 ms nach einem Bild der Probe, während Satz 1 auf Tippen wartet; das bekannte Muster aus Review 06); in den zwei Läufen davor grün bzw. nur «Epilog → Menü» (siehe unten) |
| Probe ohne Argumente (vier Grade) Desktop | bestanden (Prolog 4: Arm 44,5°, auf den Polarstern) |
| `--dorf` Desktop | alle Prüfungen grün (Halt im Dorf still, Überspringen im Halt); rot nur «Übung 8 wiederholen → Übung 9» 442 ms (bekannt seit Ticket 06); ein Lauf davor ganz grün |
| `--menue`, `--uebersicht` Desktop (wegen Punkt 7) | alle Prüfungen grün; rot nur an den bekannten Stellen aus Review 08: «Menü → Prolog (neuer Grad)» 196 ms, «Menü → Übersicht» 196 ms, «letztes Level → Übersicht» 142 ms |
| `buehne-messung.mjs messen` Prolog/Epilog, Desktop und `--handy` | p50 17,7 ms, p95 18,3–18,6 ms wie Review 07/08, Konsole leer; Epilog Handy einmal 144 ms in einer Fahrt, Wiederholung 52 ms (Review 07: 902b7fa 141 ms) |
| `buehne-messung.mjs bilder u11` | Bilder aller Formate, Arm auf dem Polarstern |
| `?szenen` (eigenes Skript, Desktop): Wüste → Vulkan, Bergwald, Dorf, Finale | Halt wartet (nach 3 s noch), weiter mit Klick, Enter; Esc überspringt im Dorf; Finale bis Epilog; nichts gespeichert; Konsole leer |

Zwischenfund und Korrektur: Mit dem ersten Bau von Punkt 7 lag beim Klick auf «Zum Menü» in Handy und quer je eine
Lücke von 414–430 ms (das Ausblenden weckte die Schleife unter der noch deckenden Bühne). Jetzt schaltet `afterEpilog`
den Wagen am Himmel gleich aus (`himmelsWagen.sofort`); danach 19–24 ms in drei Formaten. (Review 05 sah an dieser
Stelle auf fd05c63 auch schon 429/437 ms.)

Bilder (Auswahl): `tests/output/buehne/u11/<desktop|handy|quer|handy-360x640>-prolog-4.png`, `-epilog-1.png`,
`-epilog-3.png` (vorher: `tests/output/buehne/r07/…`); `tests/output/geschichte/<desktop|handy-dpr275|quer-dpr275>-`
`wagen-finale-endbild.png`, `-wagen-finale-ueberblendung.png`, `-wagen-epilog-anfang.png`, `-wagen-welt<n>-erwachen.png`,
`-wagen-menue-geschafft.png`, `-leicht-zum-menue.png`; `desktop-leicht-einstieg-halt.png`, `desktop-leicht-reise-2-halt.png`,
`desktop-dorf-einstieg-halt.png`.

Offen / zur Abnahme:

- Hochformat: Noa steht in Prolog 4 am linken Bildrand (Kamera unverändert) und leuchtet weiter steil (75° statt 86°);
  mehr ginge nur mit einem noch kleineren Wagen oder einer anderen Kamera von Prolog 4 (`camP`). Der Wagen am Ende
  des Finales und im Epilog ist hoch kleiner (54 % statt 80 % der Breite). In Epilog 3 steht der Polarstern hoch fast
  senkrecht über Noa (Arm gerade hinauf).
- Die seitliche Drehung der Kamera am Ende des Finales (quer 33°, Desktop 19°) beim Blick hinauf ansehen; der
  Sternenhimmel dreht dabei mit.
- «Klicken» steht wie der Kicker über hellen Bergen (Bergwald) schwach.
- Werte zum Abstimmen: `BUEHNENWAGEN.feld.lage` / `.breite`, `STORY_FLUG.halt` / `.anlauf`.
- Review (anderer Agent), dann Commit durch den Koordinator.

**06.11.2026, Review** (unabhängiger Agent, Stand 73e476e = 458145d + Ticket 11; gekürzt auf Wunsch des Nutzers)

Der ganze Testsatz ist **auf Wunsch des Nutzers in das Review von Ticket 12 verschoben** (Ticket 12 ändert dieselben
Stellen, dessen Review lässt alles auf dem gemeinsamen Stand laufen). Darum bleibt das letzte Häkchen offen.

Code geprüft, ohne Fund, der eine Änderung im Spiel verlangt:

- Halt (`anhalten`): Tippen, Klick, Enter und Leertaste lösen über `tap`/`waitTap`; gehaltene Tasten wirken nicht
  (`e.repeat` im Tastenhandler); ein Tippen in den ersten 0,3 s löst die Schleife nicht (galt dem Flug). Esc und
  «Überspringen» beenden im Einstieg auch den Halt (`e.halt`, dann `land`); Reisen sind nicht überspringbar, «Menü»
  und Übersicht wirken während Einstieg und Reise nicht (`running`). Kein Zeitablauf, kein `setTimeout`, keine neuen
  Listener (nur Promises; ein liegengebliebenes `untilTap` nach Esc ist ohne Folgen, `waitTap` wird geleert).
  Kleinigkeit: Ein Tippen in der Schonfrist spielt den Ton von `tap` (`audio.rotate`), ohne dass etwas geschieht.
- Fall (`storyFall`): stetig, 10 % Anlauf, danach linear; gemessen gleichmässig (±3 %).
- Stern beim Erwachen (`ascend` mit `ende`, `captionVorab`): Die verborgene Kopie misst auch bei ausgeblendeter
  Geschichte richtig (`#story.hidden` ist nur durchsichtig); Duplikat der SVG-`id` nur für die Messung.
- Bühne / `seit`: Die Drehung um die eigene Hochachse verschiebt den Himmel seitlich, der Wagen bleibt aufrecht;
  `seit` wird nur im Finale gesetzt und beim Übergang in den Epilog auf 0 gestellt (das Finale ist nicht
  unterbrechbar, das Sprungbrett ist dort verborgen). Wagen in Wagen stimmt (Bilder unten).
- Strahlen aus, kein Schwenk (`antwortBlick`): stetig, ohne Ruck; gemessen 0,00°.
- Wagen nur einmal (`himmelsWagen.blendet`/`sofort`): Eingaben wecken die Schleife, das Ausblenden läuft also auch
  aus der Ruhe. Nach Neuladen blendet er beim ersten Öffnen des Menüs in 0,4 s aus.
- `?szenen`: Sprünge nur ausserhalb von Zwischenszenen (`frei`), also nie mitten im Halt; der Sprung in den Epilog
  läuft ohne Finale mit `seit` 0.

Behoben im Review: `tests/geschichte-probe.mjs`, `pruefeErwachen`: Der Kicker der Reise wurde nur in den 2,2 s nach
dem Erwachen gesucht; hält dort ein Bild der Probe (`wagen-welt<n>-erwachen`) die Seite an, fehlt er (Handy:
«Kicker undefined» in Welt 3, Stern selbst richtig bei 0,219). Jetzt der erste Kicker nach dem Erwachen. Nicht neu
laufen gelassen (Läufe gestoppt), nur `node --check`.

Läufe (alle über `LEISE_VORRANG=11 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

| Lauf | Ergebnis |
|---|---|
| Node: alle `tests/*.test.mjs` parallel, `golden.mjs` | grün (logic 2036, beurteilung 206, levelliste 54, generator 31, ki-tester 84, vorrat 18, wuerfelliste 20, hall 6, geschichte 35; golden 847) |
| `--wagen` Desktop / quer dpr 2,75 | bestanden (Wagen in Wagen 1,5 / 0,5 px, Mitte des Wagens 0,71 / 0,73, Strahlen aus nach 795–799 ms, Schwenk 0,00°) |
| `--wagen --handy --dpr 2.75` | rot nur an der Prüfung des Kickers (Fehler der Probe, oben behoben); sonst alles grün (Wagen in Wagen 1,1 px, Mitte 0,575) |
| `--ganz` Desktop `--vorher` | bestanden; Einstieg +0,22, Reisen +0,18 … +0,24 (Grenze +1,2), Finale +3,67, Epilog −0,01, Neuladen +0,42 (wie Review 08) |
| `--ganz --handy --dpr 2.75 --vorher` | Dauern: Einstieg +0,14, Reisen −0,30 … +0,57, Finale +3,65; rot an zwei Lücken 229/206 ms zu Beginn der Reise in die Wüste (Himmel noch Meer, Untertitel steht); einmalig, nicht wiederholt (Läufe gestoppt), in quer und Desktop nicht |
| `--ganz --quer --dpr 2.75` | bestanden, keine Lücke über 50 ms |
| `--finale leicht` Desktop / Handy dpr 2,75 `--vorher` / quer dpr 2,75 | bestanden; Fortsetzen +0,16 / +0,22, Finale +3,68 / +3,34; Menü nach dem Epilog ohne Wagen am Himmel |
| `--menue` Desktop / Handy dpr 2,75 / quer dpr 2,75 | bestanden |

Nicht gelaufen (verschoben ins Review von Ticket 12): `--menue` 360 × 640 und 320 × 568, `--uebersicht`, `--dorf`,
Probe ohne Argumente, `buehne-messung` (messen, bilder), `offline`, sowie die Wiederholung von `--wagen --handy` und
`--ganz --handy`.

Bilder angesehen: Ende des Finales und erstes Bild des Epilogs in drei Formaten decken sich; Epilog 3 Desktop: Strahl
trifft den Polarstern; Menü nach dem Epilog und nach Neuladen nur ein Wagen. Zur Abnahme (zusätzlich zu den Punkten
des Umsetzers): Im Hochformat steht der Polarstern am Ende links der Bildmitte (0,31), in Epilog 3 leuchtet Noa leicht
über die Senkrechte hinaus (93°); dort gewinnt «weiter rechts» wenig. Auch die Reise hält an (Entscheid des Umsetzers,
Wortlaut des Nutzers nennt nur das Einfliegen in die Welt): vom Nutzer bestätigen lassen.
