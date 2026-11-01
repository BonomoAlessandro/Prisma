# 16: Prolog-Bühne zeigt nie halb gerasterte Ebenen

**Spec:** ../spec.md

**Blocked by:** 07; nicht parallel zu 15 (beide in `createStoryScene`)

**Status:** ready-for-agent

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
