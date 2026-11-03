# 16: Prolog-Bühne zeigt nie halb gerasterte Ebenen

**Spec:** ../spec.md

**Blocked by:** 07; nicht parallel zu 15 (beide in `createStoryScene`)

**Status:** resolved; abgelöst durch Ticket 19 (Bühne in WebGL, 03.11.2026)

**What to build:** Kein Flackern in der Prolog-Bühne. Beobachtung des Nutzers im Handy-Durchlauf 2: «ein kurzes Flackern
des Bildes in der ersten Noa-Szene».

**Ursache (Diagnose in 07, wahrscheinlich, in der Emulation nicht sichtbar nachgestellt):** Fehlende Kacheln der
Bühnen-Ebenen, neu seit Ticket 04. Während einer Fahrt im Compositor zeigt Chrome ein Bild auch, wenn eine Ebene nach
neuer Skalierung (`--rs`) noch nicht fertig gerastert ist. Trace: 01c 0 Bilder mit fehlenden Kacheln im ganzen Prolog;
`c42423e` Handy ×4 gehäuft beim Öffnen der Bühne und in den Einstellungen 1–3, Desktop 4K bis 275 Bilder je
5-s-Fenster. Dazu Raster-Hänger im GPU-Prozess 25–43 ms (Quadro) beim Öffnen, nach dem Halt und in Fahrten – auf dem
Adreno länger; erklärt auch 98,8 ms bei 21,4 s auf dem Poco (gab es in 01c schon). Screencast jedes Bildes, Umbau,
schwarzes Bild, WebGL hinter der Bühne und `gehalten`/`buehneFrei` sind ausgeschlossen.

**Vorschlag:** Eine sichtbare Ebene nie neu rastern lassen: in einer unsichtbaren Kopie rastern und tauschen, oder die
Strichbreiten nicht je Ruhepunkt ändern (die Nachbesserung von 04 hält sie schon gestaffelt). Die gehaltene Bühne gleich
in der Skalierung der ersten Fahrt halten. Die Gewinne aus 04 (Fahrtende 17 ms) dürfen nicht verloren gehen.

- [ ] Trace Prolog (Handy-Emulation 4× und Desktop): 0 Bilder mit fehlenden Kacheln; kein Raster-Hänger über 16 ms in
      Fahrten und in den ersten 2 s nach dem Halt.
- [ ] Linienstärke und Schärfe bei normalem Abstand wie heute (Vergleich nebeneinander, auch Ende jeder Fahrt).
- [ ] Bleibt das Flackern auf dem Poco (Durchlauf 3), dort über `chrome://inspect` nachfilmen.
- [ ] Tests grün, Review, Commit auf `feature/leistung`.

## Comments

### 01.11.2026 – Umsetzung (Branch `leistung/16-15-buehne` ab `eb8105e`)

**Diagnose.** Prolog wie ein neuer Spieler (Startbildschirm, Menü, Leicht, 2,5 s Lesezeit je Bild), Trace mit
`PipelineReporter` je Bild (`has_missing_content`), `RasterTask.layerId` je Ebene (Ebenen über `LayerTree`) und
`DoEndRasterCHROMIUM` im GPU-Prozess. Dazu Versuchsfassungen, je eine Ursache weggenommen, und ein Labor mit einer
einzelnen Ebene (`scratchpad/16-15/labor/`). Ergebnis, was eine sichtbare Ebene neu rastern lässt:

1. **Jeder Commit während einer Fahrt.** Arm und Strahl (Tweens, Einstellungen 3/4/6, Epilog) und der Flug der
   Glühwürmchen (5/6) schrieben pro Bild ins DOM; jeder Commit liess Himmel, Berge, Rauch, Fenster neu rastern.
   Desktop 4K: Fahrten 3/4 107/322 Bilder mit fehlenden Kacheln, ohne Strahl und Arm 4/0.
2. **Eine neu angelegte Animation** auf einer Ebene, auch eine vorbereitete, die noch wartet (Labor: 18 Kacheln). Das
   geschah in jeder Pause (gestaffeltes Vorbereiten) und beim Start jeder Fahrt. Ein Sprung (`currentTime`) oder ein
   anderes Tempo lassen nichts neu rastern.
3. **Neue Strichbreite** `--rs` auf der sichtbaren Ebene (Staffelung nach dem Halt).
4. **Beginn und Ende des Einblendens** (Opacity-Transition auf `.world` und `#story`; Labor: 14 Kacheln, mit
   `will-change: opacity` keine).
5. Raster-Hänger: einzelne Kacheln mit den grossen Tannen- und Graspfaden (Hunderte Tannen in einem Pfad, jede Kachel
   rechnet den ganzen Pfad).

**Umbau** (`createStoryScene`, CSS der Bühne, `playScene`/`prewarmScene` übergeben die Folge):

- **Eine Animation je Ebene für die ganze Folge** (`folgeAnlegen`): vor jeder Fahrt ein Halt (`HALTEN`), dann die
  Fahrt. `moveTo` springt nur an den Beginn der Fahrt (`currentTime`), Tippen und Überspringen ändern das Tempo. Chrome
  rastert jede Ebene einmal je Folge, in der grössten Skalierung der Folge (bleibt beim Zoom scharf); beim Öffnen der
  gehaltenen Bühne wird nichts neu angelegt. Weg sind `vorbereiten`, `neueFahrt`, `ebeneAnlegen`.
- **Arm, Strahl, Blinken als Spuren** (`spur`): vorab berechnete Animationen nach der Zeit der Bühne (Tempo, Anhalten,
  Sprung der Zeit wie die übrigen). Die Tweens rechnen nur noch den Stand für die Logik. Der Strahl sitzt im Arm und
  wächst über `scale`: Kegel und Kern in der Form der vollen Länge, zwei Keile (je ein Dreieck mit Matrix) geben dem
  Hals die alte Breite; alles einfarbig und überlappend, den Verlauf gibt eine Maske, die mitskaliert. Genau dieselbe
  Form wie vorher (Prüfbilder unten), ohne Nähte.
- **Linien je zweimal** (`linie`): Grate, Dachkanten, Umriss von Noa als eigene Ebenen; die neue Breite bekommt die
  verborgene Kopie, die fast durchsichtig rastert und nach 200 ms (`LINIEN_MS`) die sichtbare ablöst, gestaffelt wie
  bisher. Beginnt vorher eine Fahrt, bleibt die alte Breite.
- `will-change: opacity` an `#story` und `.world`.
- Tannenreihen und Gras in Pfaden je 150 Masse (`pfade`), gleiche Form, gleiche Zufallsfolge.

**Messung** (echtes Chrome, Fenster, Quadro T2000, ohne `?perf`: der HUD des Messwerkzeugs ist selbst ein Commit pro
Aktualisierung). Bilder mit fehlenden Kacheln im Prolog (von allen) und Raster-Hänger > 16 ms in Fahrten, bis 2 s nach
dem Halt und beim Öffnen. Desktop = maximiert 4K (1536 × 729 CSS, Pixeldichte 2,5), Handy = Emulation 393 × 873,
2,75, CPU 4×. «16+15» = mit Ticket 15 (Flug der Glühwürmchen).

| Lauf | fehlende Kacheln | Raster-Hänger (max) |
|---|---|---|
| Desktop vorher | 1471 von 3635 | 2 (36,6 ms) |
| Desktop nach 16 | 409 von 3246 | 10 (153 ms) |
| Desktop nach 16+15 | **94 von 2870** | 1 (46,1 ms) |
| Handy ×4 vorher | 16 von 4525 | 4 (43,6 ms) |
| Handy ×4 nach 16 | **4 von 4443** | 4 (57,1 ms) |
| Handy ×4 nach 16+15 | 13 von 4940 | 5 (66,5 ms) |

Je Abschnitt Desktop (Fahrt/Ruhe 1–6, Angebot): vorher 17/9, 21/7, 107/14, 322/4, 368/64, 479/30, 29; nach 16+15
14/6, 17/4, 2/13, 7/3, 7/12, 7/2, 2. Der Lauf «Desktop nach 16» hat auffällig hohe Raster-Hänger (bis 153 ms, Ursache
nicht geklärt, andere Agenten rechneten gleichzeitig); Fahrten 5/6 (Flug, Ticket 15) dort 105/120, sonst 2–30 je
Abschnitt. Die Streuung zwischen Läufen ist gross (Zwischenstand ohne Linienkopien und Sprung: 260 bzw. 9).

**Nicht erreicht: 0 Bilder mit fehlenden Kacheln.** Was bleibt (Zuordnung über `RasterTask` in den 150 ms davor):
- Öffnen der Bühne (Desktop 14–16, Handy 2–4 Bilder): Himmel und ferne Berge rastern beim ersten Bild der Fahrt
  noch einmal ein Stück nach (Kacheln, die beim Halten mit Deckkraft 0,002 nicht vorgerastert waren); dazu der Raster-
  Hänger beim Öffnen (Handy 30–60 ms).
- Fahrt 2 (Desktop 17–27): Schwenk über neue Flächen in voller Skalierung (Kacheln ausserhalb des Vorrasterns).
- Ruhepunkte: einzelne Bilder beim Tausch der Linien und beim Laden des Himmels dahinter.
- Ein Tippen während einer Fahrt (Tempo) und der HUD mit `?perf` sind Commits; sie rastern nach dem Labor nichts neu,
  in der Messung ohne Tippen in Fahrten nicht geprüft.

**Aussehen:** `node tests/buehne-messung.mjs bilder` vorher (`eb8105e`) und nachher, an allen Ruhepunkten von Prolog
und Epilog in Desktop, Handy hoch und quer: höchstens 0,06 % der Pixel weichen um mehr als 24/255 ab (mittlere
Abweichung 0,02–0,21; Rauch und Funkeln), Bilder `tests/output/buehne/vergleich/` (lokal). Der wachsende Strahl
(Einstellung 4, sechs Stellen) nebeneinander gleich (`scratchpad/16-15/out/strahl-vorher/`, `…/strahl-neu/`). Schärfe
am Ruhepunkt: Compositor-Bild gleich scharf wie neu gerastert (Ruhepunkt 2 im Vergleich eher schärfer als vorher, die
Ebene ist jetzt in der grössten Skalierung der Folge gerastert).

Offen: Handy-Durchlauf 3 (Poco, ob das Flackern weg ist); 0 fehlende Kacheln beim Öffnen und in Fahrt 2 bräuchte ein
Vorrastern ausserhalb des Bildes (Chrome bietet dafür nichts; denkbar: die Bühne beim Halten kurz sichtbar über die
ganze erste Fahrt schwenken lassen).

**Das Flackern in der ersten Noa-Szene (Einstellung 2, «Jeden Abend steigt Noa …»), erklärt:** Die Kamera hält auf
Noa (Zoom 2, die nahen Ebenen Hügel und Noas Hügel füllen das Bild). 0,4–0,9 s nach dem Halt legte die Bühne Ebene für
Ebene die nächste Fahrt an und setzte die neue Strichbreite (`gestaffelt`, alle 90 ms eine Ebene). Beides liess Chrome
genau diese sichtbare Ebene neu rastern, und solange die neuen Kacheln fehlten, zeigte der Compositor die Ebene in
diesen Bildern lückenhaft: Für ein oder mehrere Bilder fehlt ein Stück Hügel oder Himmel, dahinter liegt die dunklere
Ebene bzw. der fast schwarze Grund. Das ist das kurze Flackern des ganzen Bildes. Im Trace vorher genau dort: Handy ×4
Bilder mit fehlenden Kacheln 0,56/0,67/0,77 s nach dem Halt von Einstellung 2 (Lauf `07-beob/handy4b`), Desktop 5–9
Bilder je Ruhepunkt 1–2, dazu Raster-Hänger 30–44 ms 0,9 s nach dem Halt. Auf dem Adreno dauert das Rastern länger,
also fehlt die Ebene länger. Dasselbe beim Start der nächsten Fahrt (die vorbereitete Animation begann, die Ebene
rasterte noch einmal). Nach dem Umbau legt die Bühne in der Folge keine Animation mehr an (Sprung statt neuer
Animation) und ändert keine Strichbreite einer sichtbaren Ebene (verborgene Kopie): Handy ×4 Ruhepunkt 2 ohne Bild mit
fehlenden Kacheln, Desktop 2–4 (Tausch der Linien und Laden des Himmels dahinter, kleine Flächen).

**Stellen aus Handy-Durchlauf 2b (Poco, Prolog-Beginn bei etwa 9–10 s):** 23,6 s ≈ Einstellung 2/3 (82 ms
«FrameRequestCallback: Script 86 ms»), 35,3 s ≈ Einstellung 4/5 (82 ms ohne Script, Raster-Hänger). In der Emulation
(Handy ×4, lange Aufgaben je Abschnitt, `scratchpad/16-15/poco.mjs`):

| Abschnitt | vorher | nach 16 | nach 16+15 |
|---|---|---|---|
| Fahrt 1: Raster > 16 ms | 2× (max 35,7) | 2× (51,2) | 2× (51,7) |
| Ruhe 1: Raster > 16 ms | 1× (43,6) | – | – |
| Ruhe 2: Script > 30 ms | 2× (233) | – | – |
| Fahrt 3: Raster > 16 ms | 1× (41,3) | 2× (57,1) | 3× (66,5) |
| Ruhe 3/4: Script > 30 ms | 3× (bis 47) | 3× (251) | 5× (bis 202) |
| Fahrt 5/6: Script > 30 ms | 1× (34) | – | 2× (470, 334) |

Das Script in den Ruhepunkten (bis 250 ms bei 4×) ist das Laden des Himmels in den Pausen (Ticket 03/09), nicht die
Bühne; es fällt in die Pause, nicht in eine Fahrt. Die Raster-Hänger beim Öffnen und am Start von Fahrt 3 bleiben (die
Bühne rastert dort Fläche, die beim Halten noch nicht gerastert war). Das Script in Fahrt 5/6 nach 16+15 ist das
Anlegen der Flüge (Ticket 15); dort behoben, siehe Ticket 15.

**Nachtrag:** `ruhen` (ausgeblendet) gibt die Animationen der Folge jetzt ganz frei (die Ebenen sind dann keine
eigenen Ebenen mehr, nichts tickt); `will-change` an `#story` nur, solange die Bühne zu sehen oder gehalten ist.

**Tests** (`leise.sh` 100 %): `node tests/logic.test.mjs` (2033), `node tests/golden.mjs`,
`tests/geschichte-probe.mjs --start`, `--grad leicht --welten 2 --finale leicht`, `--handy`, `--quer --grad leicht`,
`tests/leistung-probe.mjs --handy`, `tests/start-probe.mjs`, `tests/leerlauf-probe.mjs`: grün, keine Warnung
«Weckstelle fehlt». **Nicht grün: `--uebersicht --dorf`**, Prüfung «Spiel → Übersicht: keine Lücke über 100 ms»: drei
Läufe 133, 117, 184 ms (der letzte dazu «Wiederholen: Weiter über die Weltgrenze» 140 ms); derselbe Lauf auf `eb8105e`
dazwischen 100 ms (knapp an der Grenze). Die Bühne ist dort ausgeblendet; ob die Lücke von diesem Ticket kommt oder von
der Last paralleler Läufe (die Werte streuen stark), ist nicht geklärt. Bitte im Review prüfen.

### 01.11.2026 – Browser- und Optik-Review (`77e0e22`, mit Ticket 15)

Echtes Chrome mit Fenster und GPU (Quadro T2000), Prolog wie ein neuer Spieler mit Trace und Screencast jedes Bildes,
vorher `eb8105e`, nachher `77e0e22`, dazu `c9d5532` (nur 16). Skripte und Bilder im Scratchpad unter `rev1615/`
(`rev.mjs`, `kacheln.mjs`, `blatt.mjs`, `mem.mjs`, Bilder in `rev1615/out/`).

**Gross, blockiert: Auf dem Desktop fehlen ganze Ebenen über Sekunden.** Ab Fahrt 4–6 bis zum Tippen auf das
Angebot fehlen Bergflächen (nur die Gratlinie bleibt), Noas Hügel, Teile des Walds (mit harter senkrechter Kante),
der Polarstern und sogar die Knöpfe des Angebots; die Helligkeit springt von 24 auf 33. Dazu ein fast schwarzes Bild
am Start von Fahrt 6. Dreimal reproduziert (maximiert 4K und `buehne-messung bilder` 1440 × 900): `desktop-prolog-7`
33,8 % der Pixel anders, Ruhepunkte 4–6 im Screencast (`out/c-f6.png`, `c-f6c.png`, `blatt-nd-f6.png`, `c-desk2.png`,
`nachher/tests/output/buehne/vergleich/desktop-prolog-7.png`). Vorher nie. Auch `c9d5532` (nur 16) zeigt es
(`out/c-n16.png`). **Ursache: GPU-Speicher.** Die Belegung des Renderers (`GPUTask.used_bytes`) liegt nachher vom
Öffnen an an der Grenze von etwa 0,9 GB, vorher nur zeitweise. Mit `--force-gpu-mem-available-mb=8192` fehlt nichts
mehr, die Belegung steigt dann aber auf 1,85 GB (`out/c-deskmem.png`). Chrome lässt die Kacheln, die nicht mehr ins
Budget passen, einfach weg. Grund: Jede Ebene wird in der grössten Skalierung der ganzen Folge gerastert (eine
Animation je Folge), dazu kommen die Linienkopien. **`has_missing_content` sieht das nicht** (nur 67–106 Bilder, obwohl
die Ebenen sekundenlang fehlen); die Zählung der fehlenden Kacheln taugt allein nicht als Abnahme.
**Handy:** In der Emulation (Desktop-Budget) ist alles korrekt, aber die Belegung steigt von 414 MB (vorher) auf
725 MB (Handy ×4). Chrome auf Android hat ein kleineres Budget als der Desktop, also dasselbe Risiko auf dem Poco,
dort wohl schon früher im Prolog. Abhilfe (Vorschlag): die Rasterskala begrenzen, statt die ganze Folge in einer
Animation zu halten, z. B. eine Animation je Abschnitt ähnlicher Skalierung oder die Folge an den Zoomwechseln
teilen. Die riesigen Ebenen (19000 × 11000, 8000 × 6500 Masse) auf das zuschneiden, was die Kamera je zeigt. Das Budget
mit `used_bytes` im Trace prüfen (Ziel deutlich unter dem bisherigen Stand, auch auf dem Handy) und **jeden Ruhepunkt
im Screencast gegen vorher vergleichen**, nicht nur die fehlenden Kacheln zählen.

**Flackern in Einstellung 2 / fehlende Kacheln (sonst):** Handy ×4 vorher 25 Bilder mit fehlenden Kacheln, nachher 10:
je 1 Bild am Start der Fahrten 2–6, 5 beim Öffnen; in den Ruhepunkten keins mehr (vorher 12, auch in Ruhe 2). Im
Screencast ist keins davon zu sehen: kein Bild weicht von beiden Nachbarn ab, keine Helligkeitssprünge in Einstellung 2
(`out/blatt-n4-9.png`). Das Flackern in Einstellung 2 aus Durchlauf 2b ist nach Trace und Screencast behoben. Beim
Öffnen (Menü → Bühne) steht das Bild bei ×4 etwa 350 ms (vorher 200 ms), danach springt die Überblendung (Helligkeit
35 → 25, `out/blatt-n4-oeffnen.png`). Das ist ein Hänger, kein Flackern; für Spieler sichtbar, aber auch vorher schon da.
Abhilfe: die Bühne beim Halten einmal komplett rastern (kurz mit Deckkraft über die ganze erste Fahrt).

**Optik (Ruhepunkte, Handy 1081 × 2401 je 0,1 s und 1,8 s nach dem Halt):** Linienstärke, Tausch der Linien (der Sprung
von alter auf neue Breite ist gleich wie vorher), Umriss von Noa, Grate, Tannen, Gras gleich (`out/c-noa2.png`,
`c-grat2.png`). Strahl bei normalem Abstand gleich (`out/c-strahl-h.png`); im Zoom ab 2× mit erhöhtem Kontrast leicht
treppige Kanten und ein stufiger Verlauf am Ende (`c-strahl-h3.png`, `c-strahl4.png`), bei normalem Abstand nicht zu
sehen. `buehne-messung bilder` (Handy, quer, Desktop): Ruhepunkte 1–5 ≤ 0,02 %, Ruhepunkt 6/7 Handy und quer
0,3–0,8 % (Glühwürmchen an anderer Stelle, weil das Einfrieren die Flüge nicht auf dieselbe Zeit stellt), Desktop 7
siehe oben.

**Referenzdurchlauf** `leistung-probe --fenster --handy --ersatzmass`, zwei Paare: Prolog > 33 ms vorher 22 / 17,
nachher 11 / 18; max vorher 83,9 / 89,9 ms, nachher 133,4 (beim Öffnen) / 183,4 ms (das zweite Paar lief neben meinen
Auswertungen, also unsicher). `adaptiv 1.00, Umbauten 0` in allen Läufen, keine Meldung «Weckstelle fehlt».

**Urteil: nicht bereit für Handy-Durchlauf 2c**, solange Ebenen wegen des GPU-Speichers fehlen können.

### 01.11.2026 – Review Code (Stand `77e0e22`, Fix `6beecda`)

Diff `eb8105e..77e0e22` gelesen, dazu eine Szenen-Probe (Headless, GPU): Tippen und Grössenänderung (quer → hoch →
quer) mitten in Fahrt 2, Tippen ≈ 900 ms nach dem Halt (während der Linien-Ablösung), Überspringen in Fahrt 3 vor dem
Klick der Lampe, Epilog mit «Zum Menü», Prolog dreimal hintereinander.

Behoben (`6beecda`):
- **Tempo nach Drehen in einer Fahrt:** `anpassen` legt die Folge neu an, `speed` setzte aber `laufend.anims` (die
  verworfenen Animationen). Nach einer Drehung mitten in der Fahrt lief das Tippen (4×) nur noch auf der Uhr: Probe auf
  `77e0e22` Folge 1×, Uhr 4×; die Fahrt galt als fertig, während die Kamera noch fuhr (Hinweis, Linien-Tausch und Laden
  mitten in der Bewegung). Jetzt setzt `speed` `this.folgeAnims`; Probe: Folge 4×, nach der Fahrt im Halt.
- **Überspringen vor dem Klick der Lampe:** Die Spuren von Kraft und Länge liefen bis zum Klick weiter, erst der Tween
  nahm sie zurück (bei Tempo 60 ein Bild Strahl möglich). `klickAt`: `speed ≥ 10` davor setzt beide sofort zurück.
- **Ausgeblendet mitten in einer Fahrt:** `ruhen` lässt die Folge dann stehen (`moving`), danach lief sie als
  Compositor-Animation weiter. Jetzt ruht `moveTo` am Ende, wenn die Bühne nicht mehr läuft.

Geprüft, in Ordnung: Linien – jedes Paar zeigt immer genau eine Linie, Tippen in der Ablösung lässt keine `bereit`
stehen; Drehen im Halt bleibt im Halt mit richtiger Kamera; nach Prolog und Epilog **0 laufende Animationen der Bühne**
(alle 75–78 pausiert, Folge 0, `will-change` an `#story` `auto`; die eine laufende CSS-Animation nach dem Epilog liegt
nicht in der Bühne); dreimal Prolog: immer 77 Animationen, kein Wachsen; keine Konsolenmeldung, keine Warnung
«Weckstelle fehlt». `ruheNachHalt` (400 + 5·90 + 200 ms) passt zum letzten Linien-Tausch, `stillAb`/Wecken wie bisher.
`will-change` an `.world`/`.linie` bleibt im DOM, ist aber unter dem ausgeblendeten `#story` (Deckkraft 0, ohne
`will-change`) nicht gezeichnet, ausserhalb des Modus `scene` `display: none`. Tannen- und Graspfade: gleiche Zufallsfolge,
deckende Füllung, also gleich; die Dachkanten liegen jetzt über allen Häusern, berühren aber kein Nachbarhaus.

Offen (gemeldet, nicht behoben, der Umbau der Folge kommt ohnehin):
- **`HALTEN` = 1e7 ms ist endlich:** Steht der Prolog länger als 2,8 h (Tab im Hintergrund über Nacht; die Zeit der
  Animationen läuft weiter), fährt die Kamera von selbst in die nächste Einstellung, der Satz bleibt; das nächste
  Tippen springt zurück. Beim Umbau: Halt unbegrenzt (pausieren ohne Neurastern, oder viel grösser, falls Chrome das
  genau genug rechnet).
- Nach dem Überspringen setzt `offer` `stillAb = now`, obwohl die Linien noch ~1 s getauscht werden (gab es schon vorher).
- `frame` ruft während Tweens weiter jedes Bild `zeichne` (16 × `JSON.stringify`, keine DOM-Änderung); unnötig, klein.

**`--uebersicht --dorf` (Frage aus der Umsetzung):** nicht von diesem Ticket. Je zweimal abwechselnd: `77e0e22`
«Spiel → Übersicht» 133 / 117 ms, `eb8105e` 117 / 134 ms; beide scheitern dort und je einmal bei einem anderen Übergang
(Schliessen 117 ms bzw. Weltgrenze 100 ms). Die Grenze ist auf diesem Rechner schon vorher knapp.

Tests auf `6beecda`: `logic.test` (2033), `golden`, `geschichte-probe --grad leicht --welten 2 --finale leicht`: grün,
ohne Warnung «Weckstelle fehlt». `--handy` und `--quer` nicht mehr gefahren (Umbau der Folge kommt).

### 01.11.2026 – Speicher der Grafik begrenzt (Fund aus dem Optik-Review)

**Ursache bestätigt und zerlegt** (echtes Chrome, Fenster, Quadro; Desktop maximiert 4K, Handy-Emulation ×4; ohne
`?perf`). `used_bytes` (Belegung des Renderers im GPU-Prozess) einmal mit dem normalen Budget (Desktop etwa 900 MB, dort
liegt auch vorher die Belegung) und einmal mit `--force-gpu-mem-available-mb=8192`, damit der eigentliche Bedarf zu
sehen ist. Drei Treiber:
1. **Eine Animation für die ganze Folge** hielt jede nahe Ebene im ganzen Prolog in Zoom 2,2.
2. **Die Keile des Strahls** (Dreieck 100 × 100 mit Matrix bis 8,6×): Chrome rasterte jeden Keil in der grössten
   Skalierung der Matrix, rund 860 × 860 Masse je Keil in voller Auflösung; zusammen mehrere 100 MB, ab Einstellung 3.
   Dazu die **Maske** des Strahls über eine Box von 1564 × 300 Massen (Chrome rastert eine Maske ganz).
3. **Die Linien** als eigene Ebenen mit geteiltem Bild darüber («oben»): rund 200–280 MB Bedarf (Desktop).

**Änderungen:**
- **Abschnitte statt einer Animation je Folge** (`abschnitteFuer`, `abschnittAnlegen`, `abschnittWechseln`): je Ebene
  eine Animation für eine Reihe von Fahrten ähnlicher Skalierung; ein Abschnitt wächst nur, solange an keinem seiner
  Ruhepunkte mehr als 1,15 × das gerastert wird, was dort ohnehin nötig ist (Ruhepunkt oder nächste Fahrt, also wie
  vorher). Gewechselt wird nur in Ruhepunkten, gestaffelt mit den Linien. Prolog: Himmel, ferne Berge in einem
  Abschnitt, die nahen Ebenen wechseln nach Fahrt 1, 3 und 4 – **nicht in der Noa-Szene (Ruhepunkt 2)**.
- **Keil in voller Länge** (Dreieck STRAHL_L × 100, Matrix längs 1): Rasterfläche ein Achtel. **Maske** nur so gross wie
  der Strahl (Länge STRAHL_L, der Verlauf reicht per `mask-size` darüber hinaus; Höhe für den Hals ab s = 0,25).
- **Linien unter dem Bild** (Grate von Bergen, Bergwald, Dorfhügel): die Linien-Ebene liegt unter dem einen Bild der Ebene,
  doppelt breit, die Fläche deckt die untere Hälfte, also bleibt dieselbe Linie über der Kante sichtbar, Bäume darüber
  wie vorher. Kein zweites Bild «oben» mehr; nur Noas Hügel (Bäume dahinter, Rand davor) bleibt geteilt.
- Aus dem Code-Review: Halt unbegrenzt (`haltWachen`: alle `HALTEN / 3` zurück an den Anfang des Halts, ein Sprung
  rastert nichts neu); `frame` ruft `zeichne` nicht mehr pro Bild; `offer` setzt `stillAb` erst nach dem Tausch der Linien.

**Messung `used_bytes`, Bedarf (Budget 8 GB), MB:**

| Lauf | max | Einstellung 2 | 4 | 5 | 6 |
|---|---|---|---|---|---|
| Desktop vorher (`eb8105e`) | 1681 | 723 | 1116–1681 (Fahrt) | 829 | 1041 |
| Desktop 77e0e22 (Review) | 1850 | | | | |
| Desktop Abschnitte (`x-neu7`) | 1591 | 1131 | 1012 | 1459 | 1591 |
| Desktop jetzt (`x-neu9`) | **1089** | 1063 | 1062 | 1048 | – |
| Handy ×4 vorher | 417 | 412 | 334 | 409 | – |
| Handy ×4 jetzt | **522** | 507 | 444 | 469 | – |

Mit normalem Budget liegt die Belegung auf dem Desktop vorher wie jetzt am Budget (max 910 / 912 MB); Handy ×4 jetzt max
520 MB (vorher 416, 77e0e22 725).

**Bild (Screencast, jeder Ruhepunkt 1,8 s nach dem Halt und das Angebot, vorher gegen jetzt; Anteil Pixel > 24/255
anders):** Desktop 0,24 / 0,01 / 0,03 / 0,06 / 0,90 / 0,63 / 0,77 %, Handy ×4 0,08 / 0,02 / 0,03 / 0,04 / 0,71 / 1,04 /
1,08 % (der Rest sind Glühwürmchen an anderer Stelle). Kein Bild weicht in der Helligkeit von beiden Nachbarn ab (alle
Bilder des Prologs, Desktop 2720, Handy 2782). Zwischenstände zum Vergleich: mit Abschnitten, aber alten Keilen fehlten
auf dem Desktop in Ruhepunkt 5 Bergflächen und Wald (15 % anders), dazu ein Bild ohne Hügel und Untertitel am Start von
Fahrt 6. `buehne-messung bilder` Desktop und Handy, Prolog und Epilog: höchstens 0,88 % (Ruhepunkte 6/7, Glühwürmchen).
Bilder: `scratchpad/16-15/out/ruhe-desk9/`, `ruhe-handy9/`, `tests/output/buehne/vergleich/` (lokal).

**Flackern Einstellung 2:** Handy ×4 kein Bild mit fehlenden Kacheln in Ruhepunkt 2 (jetzt 24 im ganzen Prolog, fast alle
am Start von Fahrten); kein Abschnittswechsel in Ruhepunkt 2.

**Offen:** Handy ×4 braucht etwa 25 % mehr als vorher (522 gegen 417 MB). Der Rest steckt in den eigenen Ebenen (Linien,
Strahl, geteilter Dorfhügel); weiter senken ginge nur mit weniger Ebenen. Desktop 4K bleibt wie vorher am Budget. Das
Stehen von etwa 350 ms beim Öffnen (×4) ist nicht angegangen.

**Tests:** logic (2033), golden, `geschichte-probe --start`, `--grad leicht --welten 2 --finale leicht`, `--handy`,
`--quer --grad leicht`, `leistung-probe --handy`, `start-probe`, `leerlauf-probe` grün, keine Warnung «Weckstelle fehlt».
`geschichte-probe --uebersicht --dorf` scheitert unter der Last der parallelen Läufe an Lücken in Spiel ↔ Übersicht
(jetzt 2 Fehler, längste 150 ms); derselbe Lauf direkt danach auf `dabcd1a` ohne diese Änderung scheitert gleich
(3 Fehler, längste 367 ms), also nicht von der Bühne.

### 02.11.2026 – Handy: Speicher der Grafik auf den Stand vorher

Auftrag (Koordinator): Handy ×4 höchstens etwa 450 MB (vorher 417 + 8 %), Messung auch mit einem Budget wie auf dem
Gerät (`--force-gpu-mem-available-mb=512`), im Screencast keine fehlende Ebene; Ruhepunkt 2 ohne Wechsel, Linien bei
normalem Abstand gleich scharf.

**Wo der Speicher lag** (Handy ×4, Schnappschuss des Compositors je Ruhepunkt mit `disabled-by-default-cc.debug`,
Speicher-Dump mit memory-infra, und Varianten): Ohne alle Linien-Ebenen liegt die Bühne auf dem Stand vorher (416 MB);
der Mehrbedarf steckte also ganz in den Linien:
- Die **verborgene Kopie** jeder Linie (`opacity: 0`, `will-change: opacity`) hielt Chrome mit im Speicher: etwa 60 MB.
- Jede **sichtbare Linie** kostet Kacheln längs der ganzen Linie (Chrome rastert alles Animierte dieser Bühne in 1 CSS-Pixel
  je Mass, auf dem Handy 2,5 Pixel je Mass; ein Grat über 3200 Masse sind so 8000 Pixel): am meisten der Grat der fernen
  Berge (13,5 MB Kacheln, der höchste Streifen), dann Bergwald, Dorfhügel, Noas Hügel.
- Noas Hügel war um seine Linie **geteilt** (Bäume davor, Zaun, Noa als eigenes Bild über der Linie): zwei weitere Ebenen
  (etwa 8 MB).
- Versucht und verworfen: die Linien in halber Dichte (SVG halb so gross, per transform wieder ganz) – Chrome malt die
  Skalierung ins Bild der Ebene ein, die Dichte bleibt (auch mit eigenem Knoten, translateZ).

**Änderungen:**
- Die verborgene Kopie einer Linie gibt es nur noch für den Tausch (`.linie.aus { display: none }`, mit `bereit` da).
- Die Grate der fernen Berge und des Bergwalds liegen wieder im Bild ihrer Ebene (wie vor Ticket 16), mit fester Breite
  aus Zoom 1 (`.fest`, `stelle`): Diese Ebenen zoomen im Prolog höchstens um 1,26 und 1,5, der Strich wird dort so viel
  breiter; bei Zoom 1 ist er wie vorher. Kein Tausch, keine eigene Ebene.
- Der Grat von Noas Hügel liegt unter dem einen Bild der Ebene (doppelt so breit, die Fläche deckt die untere Hälfte, wie
  beim Dorfhügel): kein geteiltes Bild mehr. Hinter den Stämmen der hinteren Tannen am Waldrand ist er nun verdeckt
  (vorher lief er über ihren Fuss).
- Getauscht wird eine Linie nur, wenn ihre Breite sonst um mehr als 10 % abwiche (`LINIEN_TOLERANZ`): im Prolog nicht mehr
  in Ruhepunkt 1 (nahe Ebenen) und 6.

**Messung auf dem gemergten Stand** (`6d776e1`: feature/leistung `eb0043f` mit 09, 10, 11b, 12 gemergt; «vorher» ist
`eb0043f` ohne diesen Branch). `used_bytes` in MB, je Ruhepunkt der Wert im Halt, Handy ×4:

| Lauf | R0 | R1 | R2 | R3 | R4 | R5 | Angebot | max |
|---|---|---|---|---|---|---|---|---|
| vorher (`eb0043f`), Budget 8 GB | 431 | 412 | 374 | 336 | 406 | 380 | 403 | 431 |
| Stand `2e78cf5` (`x-neu9`), 8 GB | 456 | 507 | 441 | 444 | 469 | 449 | 522 | 522 |
| jetzt, 8 GB | 415 | 455 | 403 | 387 | 425 | 405 | 479 | 479 |
| jetzt, Budget 512 MB | 410 | 453 | 406 | 389 | 424 | 410 | 472 | 472 |

Die Ruhepunkte liegen damit vorher +0 bis +50 MB (Ziel etwa 450: R1 455, sonst ≤ 425). **Nicht erreicht ist das Ziel
beim Angebot** (479 gegen 403). Über 8 s nach dem Angebot gemessen bleibt es (472 gegen 402), kein kurzer Ausschlag. Die
Kacheln der Bühne sind dort nur 14 MB mehr als vorher, die Render-Flächen im GPU-Prozess 17 MB; auch ohne alle Linien
springt die Belegung beim Angebot um etwa 50 MB (vorher +10 bis +23). Vermutung, nicht belegt: Der Wald lädt hinter der
Bühne jetzt erst nach dem Tausch der Linien (`ruheNachHalt`) und so zum grösseren Teil beim Angebot.
Desktop (Fenster 1536 × 729, normales Budget): jetzt 898, vorher 921 MB.

**Budget 512 MB, Screencast** (jeder Ruhepunkt 1,8 s nach dem Halt und das Angebot, vorher gegen jetzt, Anteil Pixel
> 24/255 anders): Handy ×4 0,03 / 0,01 / 0,00 / 0,01 / 0,75 / 0,86 / 0,97 %, keine fehlende Ebene, der Rest sind
Glühwürmchen an anderer Stelle; 8 Bilder mit fehlenden Kacheln im ganzen Prolog (vorher 23), keines in Ruhepunkt 2; keine
Ausreisser der Helligkeit (2707 Bilder). Desktop (normales Budget): 0,11 / 0,00 / 0,01 / 0,04 / 0,78 / 1,48 / 1,66 %
(Glühwürmchen), 180 Bilder mit fehlenden Kacheln (vorher 1208). Bilder: `scratchpad/16-15/out/ruhe-merge-512/`,
`ruhe-merge-desk/` (lokal).

**Flackern Einstellung 2:** kein Abschnittswechsel und kein Tausch in Ruhepunkt 2, kein Bild mit fehlenden Kacheln dort
(alle Läufe Handy ×4, mit 8 GB und mit 512 MB).

**Tests** (gemergt): logic (2036), golden, `geschichte-probe --start`, `--grad leicht --welten 2 --finale leicht`,
`--handy`, `--quer --grad leicht`, `leistung-probe --handy`, `start-probe`, `leerlauf-probe` grün, keine Warnung
«Weckstelle fehlt». `--uebersicht --dorf` scheitert wie zuvor (auch auf `dabcd1a`) an Lücken in Menü/Spiel ↔ Übersicht
unter der Last der parallelen Läufe.

**Offen:** Angebot +76 MB gegen vorher (siehe oben). Nicht angegangen: das Stehen beim Öffnen und die Teilung von
`createStoryScene` im Seitenstart.

**Abschluss (Koordination):** Angenommen. Massgebend ist, dass auch mit 512 MB Budget keine Ebene fehlt und Einstellung 2
ohne fehlende Kacheln bleibt; beides erfüllt. Die +76 MB beim Angebot bleiben als Beobachtung für Handy-Durchlauf 3
(Ticket 13): Flackert dort nichts, ist es erledigt.

**Abgelöst (03.11.2026):** Seit `leistung-14` zeichnet die Bühne in WebGL (Ticket 19, ADR 0007); die Abschnitte und Linien der DOM-Bühne gibt es nur
noch bis zum Aufräumen (`leistung-16`) hinter `?buehne=dom`.
