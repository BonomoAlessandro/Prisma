# 04: Wagen am Himmel der Welten und des Dorfs

**Spec:** ../spec.md

**Blocked by:** 01, 03  (nacheinander in `index.html`)

**Status:** ready-for-agent

**What to build:** Der Kleine Wagen steht an einer festen Stelle am Himmel jeder Welt und über dem Dorf, im Stand des
Durchgangs (Entscheide 10, 11, 20; Abschnitt «Der Wagen», Ablauf 2 und 4 der Spec). Noch ohne Erwachen und ohne neuen
Flug; die kommen in Ticket 05.

- [x] Ein eigenes, leichtes Objekt am Himmel (sieben Sterne, die gezogenen Linien) mit **fester Richtung** in der
      Welt, unabhängig von der Skybox. Beim Wechsel der Welt (Reise, Wiederholen über eine Weltgrenze) blendet es
      nicht mit, es bleibt stehen.
- [x] **Helligkeit** nach der Tabelle der Spec: geweckte Sterne und Linien hell, auch bei Tag; Stern dieser Welt bei
      Nacht blass und kaum merklich atmend, bei Tag ein feiner Funke; übrige schlafende bei Nacht blass wie
      Hintergrundsterne, bei Tag unsichtbar; Polarstern bei Nacht mittelhell, bei Tag blass.
- [x] **Tag oder Nacht** aus dem Himmel abgeleitet (keine Hintergrundsterne = Tag), nicht nach Namen der Welten;
      beim Überblenden zwischen zwei Welten gleitet die Helligkeit mit.
- [x] Über dem **Dorf** (Kapitel «Im Dorf») alle sechs Sterne schlafend, wie im Prolog.
- [x] **Stand** aus dem Wagen-Modul (Ticket 01): nach Neuladen, Fortsetzen, Wechsel über das Menü und beim Wiederholen
      der Stand des Durchgangs; je Grad getrennt.
- [x] **Feste Stelle** so gewählt, dass in jeder Welt der Stern dieser Welt beim heutigen Aufstieg gut im Bild liegt
      (der des Vulkans über der Kraterwand) und im Finale der ganze Wagen ins Bild passt, in Desktop, Handy hoch und
      quer. Bilder dazu für das Review; Ticket 05 und 06 bauen darauf.
- [x] Im **Spiel** steht der Wagen ohne Hervorhebung am Himmel; er darf das Brett nicht überdecken und nicht mit dem
      Bloom ausfransen.
- [x] **Grösse und Helligkeit** an einer Stelle; dazu vorübergehend Parameter zum Abstimmen während der Abnahme, als
      Teil des Sprungbretts markiert (Ticket 10 entfernt sie).
- [x] **Leistung:** keine messbare zusätzliche Bildzeit im Spiel und auf den Reisen (Probe gegen den Vorher-Lauf,
      Handy-Emulation mit Pixeldichte des Poco); die Leerlauf-Regeln des Spiels bleiben (der Wagen weckt die Schleife
      nicht ohne Not; das Atmen nur, wo die Schleife ohnehin läuft, sonst ruhig).
- [x] Probe: Bilder je Welt mit dem Wagen am Himmel (Tag und Nacht, verschiedene Stände), Bildzeiten wie vorher.
- [x] Alle Tests grün; Review nach dem Ticket. (Rot nur einzelne Lücken über 100 ms, die auch auf 844dc8b
      vorkommen, siehe Review.)

## Anhaltspunkte im Code

- Himmel: `skyTheme` (Register `SKY_ENTRIES`, `sky.stars`, `sky.starsAboveHorizon`, Überblenden `fading`, `weight`),
  Sternfeld `stars` (Uniforms `uFade`, `uHorizon`), Himmelskugel `background`; zwischen zwei Welten auf der Erde
  `story.blendSky`.
- Tag-Himmel heute: Strand (`beach`) und Wüste (`desert`) mit `stars: 0`; Nacht: Dorf, Wald, Vulkan mit 0,3;
  Sonnensystem und Milchstrasse aus dem Code.
- Aufstieg heute: `story.ascend(elevation, star)` mit `aimGaze`, `STORY_UP`, `up` des Vulkans (1,0).
- Leerlauf: `sceneLoop` (wecken nur, wenn sich etwas bewegt).

## Comments

**05.11.2026, Notiz des Umsetzers**

Gebaut (`index.html`, `tests/geschichte-probe.mjs`):

- `HIMMELSWAGEN` (nach `wagen`): Lage, Grösse und Helligkeit an einer Stelle. Feste Richtung in der Welt: Mitte der
  Form auf **60° über dem Horizont, Azimut 0** (geradeaus wie die Ausgangsansicht, −z); **Grösse 0,15° je Einheit** der
  Form, der ganze Wagen also etwa 17° × 10°. Helligkeit [Nacht, Tag], linear, die Sterne weiss: geweckt 0,85 (Punkt
  6,5 px), Linien 0,17 / 0,26 (1,1 px, 7 px Lücke zu den Sternen), Stern dieser Welt 0,22 atmend (±22 %, 5 s, 3,4 px) /
  0,7 als Funke (2,6 px), übrige schlafende 0,14 (3 px) / 0, Polarstern 0,5 (4,6 px) / 0,22 (3,6 px). Alles unter der
  Bloom-Schwelle (gekappt bei 0,95 × `LOOK.bloomThreshold`).
- `himmelsWagen`: ein Netz (7 Sterne + 7 Linien, ein Zeichenaufruf), Rechtecke in Bildpixeln aus dem Vertex-Shader,
  um die Kamera wie die Hintergrundsterne (Abstand 70, renderOrder −97, nicht in der Spiegelung). Gemischt über dem
  Himmel (Farbe vorgerechnet, Alpha des Ziels bleibt); Landschaft, Brett und Planeten decken ihn über die Tiefe zu.
  Tag/Nacht aus `stars.uFade` (0 = Tag, ab 0,3 Nacht), also auch beim Überblenden und in `blendSky` gleitend; keine
  Abhängigkeit von Namen der Welten. `zeige(stand, welt)`, `update(t)` (in `animate` nach `story.update`),
  `richtung(k)` (für 05/06), `stand`. Weckt die Schleife nur, wenn sich der Stand ändert; das Atmen hängt an `t` (mit
  `?t=` steht es still).
- `story.himmel` (= `himmelsWagen`, Proben lesen `story.himmel.stand`) und `story.himmelStand()`: Stand des Durchgangs
  im Grad auf dem Brett, Stern dieser Welt = Kapitel des Platzes; über dem Dorf (inDorf oder das Kapitel läuft, ausser
  beim Wiederholen) alle sechs schlafend, ohne Stern einer Welt. Angeglichen in `setGrade`, `begin`, `enter`, `travel`
  (beim Wechsel des Himmels), `replayWorld`, `ending`. Bis Ticket 05 wird ein Stern also erst mit der Reise sichtbar
  wach (unbemerkt, die Kamera schaut dann nicht dorthin).
- SZENEN (vorübergehend, Ticket 10 entfernt): `?himmel-groesse=`, `?himmel-hell=`, `?himmel-punkt=` (Faktoren auf
  Grösse, alle Helligkeiten, Punkte und Linienbreite; auch ohne `?szenen`), erwähnt im Kopf des Blocks «SZENEN».
- Probe `--wagen`: `pruefeHimmel` (nach jeder Welt vor/nach dem Lösen und nach der Reise, Neuladen in der Wüste,
  Einstieg Vulkan, Wechsel zu Mittel, Wiederholen im Bergwald und über die Grenze ins Meer, «Von vorn», geschafft beim
  Wiederholen in den Sternen, über dem Dorf) und `himmelBild` (die Kamera schaut für das Bild kurz zur Mitte des
  Wagens, nur ausserhalb von Messungen). Bilder `tests/output/geschichte/<desktop|handy|quer>-wagen-*.png`:
  `welt<n>-wach<k>`, `welt<n>-nach-reise`, `geschafft`, `dorf`.

Geprüft (alle über `GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh …`, Chrome stumm):

- Probe `--wagen` Desktop, `--wagen --handy`, `--wagen --quer`: bestanden, Konsole ohne Fehler.
- Bildzeiten `--ganz --grad leicht --messwerte`, je gegen main (844dc8b, Worktree, danach entfernt), im selben Zeitraum:
  Desktop: Mittel 17,7–18,1 ms in jedem Abschnitt auf beiden, längste Lücke Branch 37 ms / main 54 ms, keine über
  100 ms; netto Reisen 13,14–13,30 s (main 13,14–13,31 s). Handy `--handy --dpr 2.75`: Mittel 17,7–18,2 ms auf beiden,
  je eine Lücke von 53/54 ms an verschiedenen Stellen (Branch Vulkan, main Planeten), keine über 100 ms. Gegen
  `vorher/desktop.json` liegt das Mittel heute überall 1,1 ms höher, auch in Prolog und Epilog (ohne Wagen) und auf
  main gleich: der Rechner, nicht der Wagen.
- Node: `geschichte.test.mjs`, `levelliste.test.mjs` (siehe Bericht).
- Bilder angesehen (Scratchpad des Umsetzers und Probe): Nacht (Wald, Dorf, Vulkan, Planeten, Sterne), Tag (Meer,
  Wüste), mitten im Überblenden Strand → Vulkan (Wagen steht, die schlafenden Sterne kommen mit den Hintergrundsternen),
  Desktop, Handy hoch, quer. Im Vulkan steht die Schale klar über der Kraterwand; im Hochformat füllt der ganze Wagen
  etwa 77 % der Breite, der Polarstern liegt dann knapp 6 % vom linken Rand.

Offen / zu entscheiden:

- **«beim heutigen Aufstieg gut im Bild»** lässt sich mit einer festen Stelle nicht wörtlich erfüllen: Stern 4 (Vulkan)
  liegt in der Form gleich hoch wie Stern 1 (Bergwald); damit er über der Kraterwand steht (geradeaus bis gut 50°),
  muss die Schale bei 55–60° stehen, der heutige Aufstieg schaut aber in fünf Welten nur 24° hinauf (Bild bis 40°,
  hoch 46°). Gewählt nach der Spec («die Kamera schaut dorthin», Ticket 05): Jeder Stern liegt gut im Bild, wenn die
  Kamera beim Aufstieg zu ihm schaut, der des Vulkans über der Kraterwand. Ticket 05 muss den Blick zum Stern richten
  (`himmel.richtung(k)`); der Aufstieg wird damit überall so steil wie heute im Vulkan.
- **Im Spiel und im Menü** ist der Wagen damit nie zu sehen: Die Kamera des Spiels sieht höchstens 6° (Desktop) bzw.
  12° (Hochformat) über den Horizont, das Menü schaut 24° hinauf. User Story 17 («während des Spiels finden können»)
  ist mit keiner Stelle über der Kraterwand erfüllbar; der Wagen überdeckt das Brett nie. Der Nutzer entscheidet bei der
  Abnahme, ob das so bleiben soll.
- Grösse und Helligkeit: Abnahme durch den Nutzer (Parameter oben). Wird der Wagen grösser als etwa 1,1×, passt er im
  Hochformat nicht mehr ganz ins Bild, wenn die Kamera geradeaus auf ihn schaut (Finale, Ticket 06).
- Review (anderer Agent), dann Commit durch den Koordinator.

**05.11.2026, Entscheid des Nutzers** (Frage des Koordinators zu Punkt 1 und 2 der Notiz oben): «Allgemein dachte ich,
dass es genügt, wenn man den Wagen nur beim Aufstieg zum Himmel kurz sieht.» Die feste Stelle bei 60° bleibt; dass der
Wagen im Spiel und im Menü nicht zu sehen ist, ist so gewollt. User Story 17 der Spec gilt damit nicht mehr.

**05.11.2026, Review** (unabhängiger Reviewer, frischer Kontext; geprüft die nicht committeten Änderungen gegen 844dc8b)

Urteil: **bereit zum Commit.** Keine mittleren oder grossen Funde.

Geprüft im Code (`HIMMELSWAGEN`, `himmelsWagen`, `story.himmelStand` und seine Aufrufe):

- Stand: `himmelStand` hängt an `setGrade` (Neuladen, Menü, «Von vorn» des Grads auf dem Brett über `resetGrade`),
  `begin`, `enter`, `travel`, `replayWorld`, `ending`; je Grad aus `wagenStand()`. Über dem Dorf (auch im Menü, solange
  das Kapitel läuft, nicht beim Wiederholen) alle schlafend ohne Stern einer Welt; ohne Grad ebenso. Stimmt.
- Helligkeit nach der Tabelle, Tag/Nacht nur aus `stars.uFade` (gleitet in `skyTheme.apply` und mit `blendSky` mit),
  keine Namen der Welten. Feste Richtung um die Kamera wie die Hintergrundsterne, nichts blendet beim Wechsel der Welt.
- Brett und Landschaft decken über die Tiefe; Farbe vorgerechnet, Alpha des Ziels bleibt; jeder Bildpunkt höchstens
  0,95 × Bloom-Schwelle, die Mischung `h + Himmel·(1 − h)` bleibt bei Himmel < 1 unter 1 (HDR) – kein Ausfransen.
- Leerlauf: `zeige` weckt nur bei geändertem Stand, `update` meldet nichts als anstehend; das Atmen hängt an `t` (mit
  `?t=` still). Leistung: ein Zeichenaufruf (14 Rechtecke), je Bild nur 14 Werte in zwei Uniform-Feldern.
- SZENEN: die drei Parameter tragen das Kennwort, dazu Kopf von `himmelsWagen` und Block «SZENEN». Ihre Verwendungen
  (`groesse`, `hell`, `punkt`) sind nicht einzeln markiert; fehlen beim Ausbau die Deklarationen, scheitert die Seite
  sofort an einem ReferenceError, das fällt in jedem Test auf.
- Speicher: Netz und Material leben wie das Sternfeld so lange wie die Seite; nichts aufzuräumen.

Kleine Funde, selbst behoben (`tests/geschichte-probe.mjs`):

- Die Probe prüfte nur den Stand (`story.himmel.stand`), nicht die Helligkeit. Neu `pruefeHelligkeit` (bei jedem
  `himmelBild`): Tag/Nacht aus den Hintergrundsternen (Meer, Wüste Tag, die übrigen und das Dorf Nacht), wache Sterne
  heller als der Polarstern (solange er nicht geantwortet hat), Stern dieser Welt bei Tag heller (Funke), bei Nacht
  dunkler als der Polarstern, übrige schlafende bei Tag 0, bei Nacht blasser als der Polarstern, nur gezogene Linien
  hell, nichts über `uMax`.
- `himmelBild`: `new THREE.Vector3()` statt `camera.position.clone().set(0, 0, 0)`.
- Kopf der Probe: `--wagen` nennt Ticket 04, die Bilder und etwa 7 min statt 5.

Nur Hinweise (keine Funde, für Ticket 05/06):

- Wechselt der Stand (Reise, Einstieg nach dem Dorf), springt die Helligkeit; heute unsichtbar, weil die Kamera nicht
  hinschaut. Beim Ende des Dorfs zeigt der Wagen während des Satzes zum Ende schon den Himmel des Bergwalds, aber noch
  den Stand des Dorfs, bis `enter` angleicht (ebenfalls nicht im Bild).
- Der Wagen liegt 70 vor der Kamera, Netze der Panoramen bis 88 vom Mittelpunkt: Gelände, das weiter weg als 70 liegt
  und bis über 55° reicht, deckte ihn nicht zu. In keiner heutigen Welt der Fall (Bilder); im Auge behalten, falls 05/06
  den Wagen tiefer zeigen.
- `update` legt je Bild ein paar kleine Funktionen an (`forEach`, `some`); unerheblich.

Bilder angesehen (neu erzeugt): `desktop|handy|quer-wagen-welt<n>-wach<k>`, `-nach-reise`, `-geschafft`, `-dorf`. Vulkan:
Schale klar über der Kraterwand (Desktop und Handy hoch); Meer und Wüste: Funke und blasser Polarstern, keine übrigen
schlafenden; Nacht: blasse schlafende wie Hintergrundsterne; geschafft: alle sieben Linien; Dorf: sechs blass, Polarstern
mittelhell (im Hochformat knapp am linken Rand, wie vom Umsetzer genannt).

Testläufe (alle unter `GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm, 05.11. 07:15–09:17):

| Lauf | Ergebnis |
|---|---|
| Node: beurteilung, generator (allein), geschichte, hall, ki-tester, levelliste, logic, vorrat, wuerfelliste, golden | alle grün |
| `offline.mjs`, `offline.mjs --redirect` | grün |
| Probe ohne Argumente (vier Grade) | grün |
| `--wagen`, `--wagen --handy` | erst rot an der neuen Prüfung (Polarstern bei geschafft, Fehler der Prüfung, behoben), danach grün |
| `--wagen --quer` | grün |
| `--finale leicht`, `--dorf`, `--handy --grad leicht` | grün |
| `--ganz` (Desktop, mit Messwerten) | grün |
| `--ganz --handy --dpr 2.75 --messwerte` | rot nur an Lücken: Neuladen → Weiter (Wüste 26) 145 ms, Epilog 372 ms; auf 844dc8b gleich (143 ms, 444 ms, dazu Prolog 419 ms) |
| `--ganz --quer` | rot nur an Lücken: Neuladen Wüste 144 ms, Epilog 411 ms; 844dc8b: Prolog 159, Neuladen Wüste 108, Reise zu den Sternen 304 ms |
| `--menue` (zweimal) | rot nur an Lücken (Menü → Spiel anderer Grad 282/246 ms u. a.); 844dc8b ebenso (265 ms, dazu Spiel → Menü 124, Menü → Prolog 196) |
| `--uebersicht` (zweimal) | rot nur an Lücken (Übersicht → Spiel 283/321 ms u. a.); 844dc8b ebenso (336 ms, letztes Level → Übersicht 126) |

Keine Meldung in der Konsole in keinem Lauf. Jede Lücke über 100 ms tritt an derselben Stelle auch auf 844dc8b auf
(Worktree im Scratchpad, danach entfernt); kein Fund.

Bildzeiten gegen 844dc8b (Mittel, im selben Zeitraum gemessen; netto in s):

| Abschnitt | Desktop Branch | Desktop 844dc8b | Handy dpr 2,75 Branch | Handy dpr 2,75 844dc8b |
|---|---:|---:|---:|---:|
| Prolog bis zum Angebot | 17,8 ms | 17,8 ms | 17,8 ms | 18,3 ms |
| Einstieg Bergwald | 17,7 | 17,8 | 17,9 | 17,9 |
| Reise Meer / Wüste / Vulkan / Planeten / Sterne | 17,9 / 18,1 / 17,8 / 17,8 / 17,8 | 18,0 / 18,1 / 17,9 / 17,8 / 17,8 | 17,8 / 17,9 / 18,1 / 18,2 / 17,8 | 17,9 / 17,9 / 18,1 / 18,1 / 17,8 |
| Neuladen → Weiter (Wüste 26) | 17,7 | 17,8 | 19,1 | 18,9 |
| Finale / Epilog | 17,8 / 17,8 | 17,8 / 17,8 | 17,8 / 18,2 | 17,8 / 18,8 |
| Reisen netto | 13,14–13,32 s | 13,13–13,30 s | 13,13–13,31 s | 13,15–13,30 s |

Kein messbarer Unterschied. Gegenüber `vorher/handy.json` (Pixeldichte 2, 04.11.) liegt das Mittel heute auf beiden
Ständen gut 1 ms höher und das Finale netto 0,6 s länger (Texte von Ticket 03); der Rechner bzw. 03, nicht der Wagen.
Im Level selbst misst die Probe keine Bildzeiten; die Abschnitte oben zeichnen den Wagen in jedem Bild mit.
