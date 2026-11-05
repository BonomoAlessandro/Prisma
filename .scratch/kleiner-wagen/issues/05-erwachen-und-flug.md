# 05: Erwachen, Flug am nächsten Stern vorbei, Einstiege, Töne

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Am Ende jeder Welt (1–5) steigen die Strahlen zum Stern dieser Welt, er erwacht, und der Träger
fliegt am nächsten schlafenden Stern vorbei in die nächste Welt; jeder Einstieg führt am Stern seiner Welt vorbei
(Entscheide 7, 16, 18, 19; Ablauf 3 und 5 der Spec).

- [x] **Aufstieg:** Der Lichtpunkt steht am Ort des Sterns dieser Welt; die Kamera schaut dorthin (beim Vulkan über
      die Kraterwand) statt in eine feste Höhe geradeaus.
- [x] **Erwachen**, sobald die Strahlen ankommen: Der Stern blitzt auf und bleibt hell, die Linie vom vorigen Stern
      zieht sich (mit Stern 4 auch die Linie 4 → 1, die Schale schliesst sich). Ab da zeigt der Wagen den neuen
      Stand.
- [x] **Ton:** je Stern ein leiser Glockenton im Hall wie die übrigen Töne, Stern 1 der tiefste, steigend bis
      Stern 6; ohne neue Klangdateien. Die Töne der Strahlen beim Aufstieg bleiben.
- [x] **Flug:** Der Träger nimmt das Licht beim geweckten Stern und fliegt zum nächsten, noch schlafenden; als das
      Licht vorbeizieht, zuckt dieser kurz auf und wird wieder blass. Dann sinkt das Licht aufs Feld der neuen Welt.
      Ersetzt den heutigen seitlichen Bogen. Laden, Schweben während des Ladens (höchstens 8 s), Überblenden und
      Landung bleiben geregelt wie heute; der Wagen bleibt beim Überblenden stehen.
- [x] **Einstieg in eine Welt** (nach dem Prolog, nach dem Dorf, beim Fortsetzen): Der Träger bringt das Licht am
      schlafenden Stern dieser Welt vorbei, der kurz aufzuckt. «Überspringen» lässt das Licht weiterhin ohne Schnitt
      landen. Der Einstieg ins Dorf bleibt ohne Träger und ohne Stern.
- [x] **Dauer:** jede Reise höchstens etwa 1 s länger als im Vorher-Lauf (Ticket 01); Einstiege nicht länger als
      heute. Tippen beschleunigt wie heute.
- [x] **Wiederholen:** kein Aufstieg, kein Erwachen; über eine Weltgrenze blendet nur der Hintergrund, der Wagen
      bleibt im Stand des Durchgangs.
- [x] Die Sprünge «Ende einer Welt» und «Einstieg in den Bergwald» im Sprungbrett zeigen die neuen Szenen im
      richtigen Stand.
- [x] Probe: Stand nach jedem Erwachen, Dauer jeder Reise gegen den Vorher-Lauf, Bildzeiten (Lücken über 100 ms sind
      Fehler), Bilder von Aufstieg, Erwachen und Vorbeiflug je Welt in Desktop, Handy hoch und quer.
- [x] Alle Tests grün; Review nach dem Ticket. (Rot nur einzelne Lücken über 100 ms, die nicht an derselben Stelle
      wiederkehren oder auch auf fd05c63 vorkommen, siehe Review.)

## Anhaltspunkte im Code

- `story.ascend` (Strahlen `beams`, Lichtpunkt `flare`, `aimGaze`), `story.travel` (Bogen, `carrier`, Laden
  `settled`, `skyTheme.quiet`, `blendSky`, `fall`), `story.enter` (Einstieg, `traeger`), `story.replayWorld`.
- Träger: `STORY_CARRIERS`, `story.makeCarrier`.
- Ton: `audio.hit(color, when, { octave, gain })` und der Hall des Audio-Moduls.

## Comments

**04.11.2026, Hinweis aus der Wahl des Nutzers (Ticket 02, Leiste C):** Der Untertitel bei der Ankunft in einer Welt
steht künftig senkrecht in der Mitte des Bildschirms (Einbau in Ticket 08). Der Lichtpunkt soll dabei in der Mitte des
freien Raums zwischen oberem Rand und Text stehen. Den Flug und den Blick der Kamera so anlegen, dass das
möglich ist.

**05.11.2026, Notiz des Umsetzers**

Gebaut (`index.html`, `tests/geschichte-probe.mjs`; Worktree `kw-05` auf dem Stand von Ticket 04 vor dessen Review):

- **Aufstieg:** `story.ascend(elevation, star, stern)`: Mit `stern` (Ende einer Welt, `chapterEnd`) steht der Lichtpunkt
  in der Richtung `himmelsWagen.richtung(k)` (72 Einheiten vor der Kamera, je Bild nachgeführt), die Kamera folgt den
  Strahlen dorthin; beim Vulkan über der Kraterwand. Das Finale (`ascend(0.5, true)`) ist unverändert (Ticket 06).
- **Erwachen** (`story.erwache(k)`, bei der Ankunft der Strahlen): `himmelsWagen.zeige` mit dem neuen Stand, Stern k
  blitzt auf (`glanz`, 1,6 s), die neuen Linien ziehen sich nacheinander vom vorigen Stern zu ihm (0,7 s je Linie, dann
  0,8 s Nachglanz; mit Stern 4 danach 4 → 1). Stern dieser Welt bleibt k, bis das Licht am nächsten vorbeizieht. Dafür
  bekam `himmelsWagen` zwei Felder, die die Tweens schreiben: `glanz` (je Stern und Linie, bei 1 Stern 0,95 hell und
  2,3 × so gross, Linie 0,6; `HIMMELSWAGEN.glanz`) und `anteil` (je Linie, Uniform `uAnteil` im Vertex-Shader).
- **Ton:** `audio.stern(k)`, Glocke im Hall (`wet` 0,9, Abklingen 3,6 s, Teiltöne 1/2/2,76/5,4, `gain` 0,05), 0,1 s nach
  dem Akkord der Strahlen; `STERN_HZ` = A4 H4 Cis5 E5 Fis5 A5 (Pentatonik der Zieltöne), Stern 1 der tiefste. Die Töne
  der Strahlen bleiben. Einen Schlusston des Polarsterns gibt es noch nicht (Ticket 06).
- **Flug** (`travel`): Der Träger nimmt das Licht beim geweckten Stern (1 s, dabei senkt sich der Blick, siehe
  `licht`); lädt die neue Welt noch, kreist das Licht in 1,2° um den Stern (höchstens 8 s, wie bisher geregelt). Dann
  ein Bogen von 6 s (`story.bogen`, quadratische Bézierkurve in Azimut/Höhe) durch einen Punkt 1° neben dem nächsten
  Stern (nach aussen vom Wagen, bei 32 % des Wegs; `story.vorbeiAn`), der dabei aufzuckt (`story.zucke`, 1,1 s, glanz
  bis 0,75) und ab da Stern dieser Welt ist (`himmelStand`), und weiter seitwärts (0,45 rad, in die Richtung des
  nächsten Sterns, damit es keine Kehre gibt) hinab auf die Höhe der neuen Welt (`up` + 0,1 wie bisher). Fall,
  Überblenden, `quiet`, `blendSky` wie bisher; der Wagen bleibt stehen. Ersetzt den seitlichen Bogen.
- **Einstieg** (`enter`): in eine Welt von der Seite (0,55 rad seitlich, 0,06 rad höher als ihr Stern) in einem Bogen
  am Stern dieser Welt vorbei (bei 45 % des Wegs, er zuckt auf), dann hinab vor die Kamera wie bisher; Dauer 3,4 s wie
  bisher. Ins Dorf unverändert (ohne Träger und Stern). «Überspringen» landet wie bisher (`land`).
- **Lichtpunkt über dem Untertitel** (Hinweis aus Ticket 02): `story.look(point, hoch)` richtet den Blick so, dass
  das Licht `hoch` × halbe Bildhöhe über der Mitte steht; auf Reise und Einstieg `STORY_FLUG.licht` = 0,3 (der
  Untertitel steht heute unten), im Fall gleitet es in die Mitte. Ticket 08 setzt den Wert für den senkrecht mittigen
  Untertitel (etwa 0,55).
- Alle Werte in `STORY_FLUG` (neben `STORY_CARRIERS`), Glanz in `HIMMELSWAGEN.glanz`, Töne in `STERN_HZ`.
- **Wiederholen** unverändert (kein Aufstieg, kein Erwachen); das Sprungbrett brauchte keine Änderung: «Wüste →
  Vulkan» und «Einstieg in den Bergwald» zeigen die neuen Szenen im richtigen Stand (Stand vor dem Erwachen 1, 2 wach,
  Stern 3 dieser Welt; dann 3 wach; nach dem Vorbeiflug Stern 4), von Hand mit `?szenen` geprüft (Bilder im
  Scratchpad).
- Probe `--wagen` (kein Sprungbrett): `himmelAufzeichnen` schreibt je Bild Stand, `glanz`, `anteil`, Winkel von Blick
  und Licht zu jedem Stern und jeden Glockenton auf. `pruefeErwachen` (Ende Welt 1–5: vorher schlafend, beim Erwachen
  Blick < 3° und Licht < 1° beim Stern, Aufblitzen, jede neue Linie von 0 bis 1, genau ein Ton k, Vorbeiflug < 2,5° am
  nächsten, Aufzucken, am Ende alles ruhig), `pruefeEinstieg` (Bergwald nach dem Prolog, Vulkan beim Fortsetzen:
  Stand unverändert, kein Ton, Licht nah am Stern, Aufzucken), `pruefeOhneErwachen` (Wiederholen über die Grenze ins
  Meer). Bilder `wagen-welt<n>-aufstieg|erwachen|vorbeiflug`, `wagen-einstieg-wald|vulkan-vorbeiflug`. Neu `--vorher
  <datei>`: vergleicht die Dauern (netto) mit dem Vorher-Lauf (Reisen +1,2 s, Einstiege +0,5 s, Finale +4,5 s). `ende`
  wartet mit `bis` zwei Bilder, bevor es das Log liest (sonst fehlte gelegentlich das erste Bild in `play`: «Ende der
  Zwischenszene nicht im Log» beim Einstieg in den Bergwald, einmal gesehen).

Geprüft (alle über `GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh …`, Chrome stumm):

- `--wagen` Desktop, `--wagen --handy --dpr 2.75`, `--wagen --quer --dpr 2.75`: bestanden, Konsole ohne Fehler.
- `--ganz --messwerte … --vorher vorher/desktop.json`: bestanden. Reisen netto 13,15–13,30 s gegen 13,15–13,29 s
  (−0,04 … +0,03 s), Einstieg Bergwald 7,59 gegen 7,56 s; keine Lücke über 100 ms (längste 55 ms im Prolog).
- `--ganz --handy --dpr 2.75 --vorher vorher/handy.json`: Reisen 13,13–13,32 s gegen 13,19–13,66 s (alle kürzer oder
  gleich), Einstieg Bergwald 7,56 gegen 7,65 s; Reisen und Einstieg ohne Lücke über 50 ms. Eine Lücke von 358 ms im
  Epilog (Bühne, nicht von diesem Ticket berührt; einmal, im Desktop-Lauf nicht).
- Finale in beiden Läufen 14,64–14,66 s gegen 14,00 s (+0,65 s); der Code des Finales ist unverändert, der Unterschied
  kommt aus einem früheren Ticket oder vom Rechner (siehe offen).
- `--dorf` Desktop (Einstiege überspringen, ins Dorf, nach dem Dorf in den Bergwald): bestanden.
- Node: `geschichte.test.mjs`, `levelliste.test.mjs`, `hall.test.mjs` grün.
- Bilder angesehen: Aufstieg, Erwachen (Linie 3 → 4 und 4 → 1 im Zug, Vulkan), Vorbeiflug (Schale geschlossen, Stern 5
  zuckt unter dem Licht; Meer bei Tag), Einstieg Vulkan, in Desktop, Handy hoch und quer.

Offen:

- Finale +0,65 s gegen den Vorher-Lauf bei unverändertem Code: Ticket 06 sollte gegen main nachmessen.
- Quer steht das Licht mit 0,3 knapp über der Kopfzeile des Untertitels; Ticket 08 stimmt `STORY_FLUG.licht` je
  Format ab.
- Im Hochformat ist beim Erwachen nur ein Teil des Wagens im Bild (der Blick geht zum Stern, nicht zur Mitte des
  Wagens); so verlangt es die Spec («die Kamera schaut dorthin»).
- Review (anderer Agent), dann Commit durch den Koordinator.

**05.11.2026, Review** (unabhängiger Reviewer, frischer Kontext; geprüft die nicht committeten Änderungen gegen fd05c63,
vom Koordinator aus dem Worktree `kw-05` übertragen)

Urteil: **bereit zum Commit.** Keine mittleren oder grossen Funde.

Geprüft im Code (`STORY_FLUG`, `STERN_HZ`, `audio.stern`, `HIMMELSWAGEN.glanz`, `himmelsWagen.glanz/anteil`, `story.ascend`,
`erwache`, `zucke`, `travel`, `enter`, `fall`, `look`, `winkel`, `vorbeiAn`, `bogen`):

- Aufstieg: mit `stern` steht der Lichtpunkt in `himmelsWagen.richtung(k)`, die Kamera folgt den Strahlen genau dorthin;
  das Finale (`ascend(0.5, true)`) ist unverändert. Erwachen bei der Ankunft der Strahlen: neuer Stand über `zeige`,
  Aufblitzen, die neuen Linien nacheinander (mit Stern 4 danach 4 → 1), Glockenton 0,1 s nach dem Akkord.
- Ton: `_bell` im Hall (`wet` 0,9), A4 … A5 steigend, ohne Klangdatei; die Töne der Strahlen bleiben.
- Flug: Aufnahme beim geweckten Stern, Kreisen während des Ladens (höchstens 8 s), Bogen 6 s am nächsten Stern vorbei
  (Aufzucken, ab da Stern dieser Welt), Überblenden, `quiet`, `blendSky` und Fall wie bisher; der Wagen bleibt stehen.
  Dauern von Aufstieg (1,3 s), Abflug (1 s), Bogen (6 s) und Einstieg (3,4 s) wie vorher, darum netto gleich lang.
- Einstieg: in eine Welt am Stern vorbei, ins Dorf unverändert (`c = −1`, kein Stern); «Überspringen» bricht nur die
  markierten Tweens ab, das Aufzucken (ohne Marke) klingt aus, `land` dreht ohne Schnitt vom jetzigen Blick aufs Brett.
- Wiederholen: kein Aufruf von `ascend`/`erwache`; das Sprungbrett läuft über den natürlichen Weg (`begin`, `loese`,
  `ui.advance` → `chapterEnd`) und zeigt die neuen Szenen ohne eigene Änderung.
- Leerlauf: alles Bewegte hängt an Tweens der Geschichte (wecken die Schleife), sonst nichts Neues, das weckt; nach den
  Tweens stehen `glanz` 0 und `anteil` 1 (die Probe prüft es am Ende jeder Reise). Leistung: nur Uniforms, ein
  Zeichenaufruf wie bisher; je Bild zwei kleine Felder in `bogen` (unerheblich). Aufräumen: nichts Bleibendes.
- **Zusammenspiel mit `pruefeHelligkeit` (Review 04):** passt. `uMax` kappt im Fragment-Shader jeden Bildpunkt
  (`min(vHell · a, uMax)`), auch das Aufblitzen (`glanz.hell` 0,95 = `uMax` bei HDR); `pruefeHelligkeit` läuft nur in
  `himmelBild`, also nach der Reise, wenn `glanz` wieder 0 ist (von `pruefeErwachen` vorher geprüft). Eine Linie mit
  `anteil` 0 hat Helligkeit, ist aber zu kurz und wird im Vertex-Shader verworfen; nicht gezogene Linien bleiben 0
  (`basis && …`). In allen drei `--wagen`-Läufen grün. Ohne HDR (Schwelle 0,8) wäre `glanz.hell` über `uMax`, der Shader
  kappt es; die Prüfung liefe dort nur bei `glanz` 0.

Kleine Funde, selbst behoben (`tests/geschichte-probe.mjs`):

- Laufzeit von `--wagen` stand im Kopf mit etwa 7 min (Auflösung des Konflikts) und bei `wagenAblauf` mit etwa 9 min;
  gemessen 4 min (Desktop, Handy, quer je 4:00–4:05): beide auf «etwa 4 min».

Hinweise (keine Funde, für Ticket 08):

- Quer (844 × 390) liegt beim Vorbeiflug die Schale des Wagens auf der Kopfzeile des Untertitels
  (`quer-dpr275-wagen-welt5-vorbeiflug.png`: «Kapitel 6 · Die Sterne» läuft durch die Schale). Mit dem senkrecht
  mittigen Untertitel aus Ticket 08 neu abstimmen (`STORY_FLUG.licht` je Format), wie der Umsetzer schon schreibt.

Offene Punkte des Umsetzers, eingeordnet:

- **Finale +0,65 s:** kommt aus Ticket 03. Das Finale hat seit 844dc8b drei Sätze statt zwei (`STORY_FINALE`,
  `for (const line of STORY_FINALE) await this.caption(line)`); jeder Satz kostet ausser dem Warten aufs Tippen sein Ein-
  und Ausblenden. Auf fd05c63 misst die Probe dasselbe (Desktop 14,65 s, Handy dpr 2,75 14,63 s, quer 14,66 s gegen
  14,00 s vorher). Kein Fund für dieses Ticket; Ticket 06 misst gegen den Vorher-Lauf mit diesem Wissen.
- **Lücke im Epilog bei `--ganz --handy --dpr 2.75`:** wiederholt sich (Branch 415 ms, fd05c63 377 ms, Review 04 372 ms
  bzw. 844dc8b 444 ms), immer etwa 2,8 s nach Beginn des Epilogs in der Bühne, ebenso eine im Prolog (Branch 447,
  fd05c63 282 ms). Bühne, von diesem Ticket nicht berührt: kein Fund hier, aber ein Kandidat für Ticket 07 (Bühne).

Testläufe (alle unter `GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, jeder Lauf mit eigener Sperre,
Chrome stumm, 05.11. 10:06–15:13; Vergleich auf fd05c63 in einem Worktree im Scratchpad, danach entfernt):

| Lauf | Ergebnis |
|---|---|
| Node: beurteilung, geschichte, hall, ki-tester, levelliste, logic, vorrat, wuerfelliste, golden; generator allein | alle grün |
| `offline.mjs`, `offline.mjs --redirect` | grün |
| Probe ohne Argumente (vier Grade) | grün |
| `--wagen`, `--wagen --handy --dpr 2.75`, `--wagen --quer --dpr 2.75` | grün (Erwachen, Vorbeiflug, Einstiege, Wiederholen, Helligkeit) |
| `--finale leicht`, `--handy --grad leicht` | grün |
| `--ganz --messwerte … --vorher vorher/desktop.json` | grün |
| `--ganz --handy --dpr 2.75 --messwerte … --vorher vorher/handy.json` | rot nur an Lücken: Prolog 447 ms, Epilog 415 ms; fd05c63 ebenso (282 ms, 377 ms) |
| `--ganz --quer` (dreimal, fd05c63 dreimal) | 1. Lauf Reise Vulkan 448 ms und Planeten 343 ms (je kurz nach einem Bild der Probe, Himmel lädt), in Lauf 2 und 3 nicht mehr; fd05c63 Lauf 2: Reise Planeten 391 ms, Sterne 339 ms. Dazu wechselnd Prolog (232–469 ms, fd05c63 339 ms), Neuladen Wüste 106–107 ms (fd05c63 106 ms), Epilog → Menü (nur fd05c63, 429/437 ms) |
| `--dorf` (zweimal, fd05c63 einmal) | 1. Lauf rot an einer Lücke (Übersicht → Übung 8 wiederholen, 459 ms beim Laden des Dorfhimmels), im 2. Lauf grün (54 ms); fd05c63 grün |
| `--menue` | rot nur an Lücken: Spiel → Menü 162 ms, Menü → Spiel anderer Grad 287 ms (wie Review 04 auf 844dc8b) |
| `--uebersicht` | rot nur an Lücken: Spiel → Übersicht 124, Übersicht → Spiel 304, Menü → Übersicht 283, Übersicht → Menü 324 ms (wie Review 04 auf 844dc8b) |

Keine Meldung in der Konsole in keinem Lauf. Keine Lücke über 100 ms kehrt an derselben Stelle wieder, ohne auch auf
fd05c63 (bzw. im Review 04 auf 844dc8b) vorzukommen: kein Fund.

Bildzeiten (Mittel) und Dauern netto, Branch / fd05c63 / Vorher-Lauf (`vorher/`, Ticket 01):

| Abschnitt | Desktop | Handy dpr 2,75 (vorher: dpr 2) | quer (Lauf 2 / fd05c63 Lauf 1) |
|---|---|---|---|
| Prolog bis zum Angebot | 17,8 / 17,8 / 16,7 ms; 28,04 / 27,96 / 28,09 s | 18,0 / 18,0 / 17,0 ms; 27,99 / 28,13 / 28,05 s | 28,03 / 28,11 s |
| Einstieg Bergwald | 17,8 / 17,9 / 16,7; 7,56 / 7,55 / 7,56 s | 17,7 / 17,8 / 17,2; 7,55 / 7,55 / 7,65 s | 7,57 / 7,57 s |
| Reise Meer | 13,14 / 13,14 / 13,15 s | 13,15 / 13,14 / 13,24 s | 13,15 / 13,14 s |
| Reise Wüste | 13,16 / 13,14 / 13,19 s | 13,15 / 13,16 / 13,19 s | 13,15 / 13,15 s |
| Reise Vulkan | 13,31 / 13,31 / 13,28 s | 13,33 / 13,30 / 13,39 s | 13,32 / 13,29 s |
| Reise Planeten | 13,17 / 13,17 / 13,18 s | 13,15 / 13,15 / 13,66 s | 13,17 / 13,16 s |
| Reise Sterne | 13,28 / 13,33 / 13,29 s | 13,29 / 13,28 / 13,35 s | 13,30 / 13,30 s |
| Finale | 14,64 / 14,65 / 14,00 s | 14,65 / 14,63 / 14,01 s | 14,66 / 14,66 s |
| Epilog bis «Zum Menü» | 13,87 / 13,86 / 13,85 s | 13,72 / 13,78 / 13,59 s | 13,75 / 13,77 s |

Reisen und Einstiege gleich lang wie auf fd05c63 und im Vorher-Lauf (Abweichung höchstens ±0,05 s, Handy alle kürzer);
das Mittel der Bildzeiten auf beiden Ständen gleich (das Plus von gut 1 ms gegen `vorher/` hat schon Review 04 dem
Rechner zugeordnet). Bilder angesehen: Aufstieg, Erwachen (Meer bei Tag mit der Linie 1 → 2 im Zug, Vulkan mit 4 → 1),
Vorbeiflug (Planeten, Wüste → Vulkan im Hochformat, Sterne quer), Einstieg Bergwald.
