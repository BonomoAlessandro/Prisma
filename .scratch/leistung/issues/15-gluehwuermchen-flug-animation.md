# 15: Flug der Glühwürmchen ohne Arbeit pro Bild

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Der Flug der Glühwürmchen in den Wald (Prolog, Einstellung 6, «… tragen das Licht in den Wald»)
läuft auf dem Poco ohne Stocken. Beobachtung des Nutzers im Handy-Durchlauf 2: Glühwürmchen «super, abgesehen von einem
kurzen Moment, als sie in den Wald flogen».

**Ursache (Diagnose in 07):** Der Flug läuft als JavaScript pro Bild. Seit Ticket 04 ist jedes Glühwürmchen ein eigener
Layer; das kostet pro Bild Style, Paint und Layerize. Handy-Emulation 4×: Hauptthread in Einstellung 6 je Bild p50 29 ms,
p95 53 ms, Layerize p50 6,3 ms (Einstellung 1: 14 / 28 ms ohne Layerize); beim Einparken Ausreisser bis 133 ms, passt
zu 49,5 ms bei 50,4 s auf dem Poco. Das Laden in den Pausen ist es nicht.

**Vorschlag:** Den Flug als vorab berechnete Web Animation abspielen, wie die Kamerafahrt in Ticket 04 (Compositor statt
Hauptthread). Optik gleich: dieselben Bahnen, dasselbe Leuchten, nebeneinander verglichen.

- [ ] Layerize p95 < 1 ms im Flug, kein Bildabstand über 50 ms (Handy-Emulation 4×).
- [ ] Poco: max ≤ 33 ms in Einstellung 6 (Handy-Durchlauf 3).
- [ ] Vergleich nebeneinander vorher/nachher: kein Unterschied bei normalem Abstand; reduzierte Bewegung, Überspringen,
      Tempo, Epilog weiter korrekt.
- [ ] Tests grün (`geschichte-probe` Desktop und `--handy`), Review, Commit auf `feature/leistung`.

## Comments

### 01.11.2026 – Umsetzung (Branch `leistung/16-15-buehne`, auf Ticket 16)

**Umbau** (`createStoryScene`, `zeichne`, `act`): Jedes Glühwürmchen schwingt immer als Animation um einen ruhigen Ort
(Waldrand, um die Lampe, im Wald: `RUHIG`). Fliegt es (oder wird es gleich), läuft sein Ort als **vorab berechnete Web
Animation** (`flugAnlegen`): Keyframes 30-mal pro Sekunde, je der Ort nach derselben Formel wie früher pro Bild
(`wurmOrt`), weniger das Schwingen, das weiterläuft; die Grösse ebenso, wenn sie sich ändert. Vor dem Abflug steht es
so an der Mitte des ruhigen Orts, also kein Umschalten beim Abflug. Die Animationen folgen der Zeit der Bühne (Tempo
beim Tippen und Überspringen, Anhalten beim Ausblenden, Sprung der Zeit). Angelegt werden sie in `act` («gather»,
«carry»), im selben Commit wie der Start der Fahrt. JavaScript stellt nur bei der Ankunft um (ein Zeitgeber,
`wurmZeit`), nie pro Bild und **nie während einer Kamerafahrt** (jeder Commit liess Chrome dort die bewegten Ebenen neu
rastern, Ticket 16): Kommt eines in einer Fahrt an, läuft sein Flug weiter (die Keyframes reichen 2 s über die Ankunft,
`NACHLAUF`, länger als jede Fahrt nach einer Ankunft), und `moveTo` stellt nach der Fahrt um.

**Messung** (wie Ticket 16: echtes Chrome, Fenster, Quadro, Handy-Emulation 393 × 873, 2,75, CPU 4×, ohne `?perf`).
Flug = 5 s ab Beginn der Fahrt (Sammeln in 5, Tragen in 6). «gezeigt» = Abstand der Bilder des Compositors
(`PipelineReporter`); «rAF» = Abstand der rAF-Schleife des Messskripts im Hauptthread.

| Handy ×4 | Layerize p50 / p95 | BeginMainFrame p50 / p95 | Bildabstand gezeigt max | rAF längster |
|---|---|---|---|---|
| vorher, Einstellung 1 | 0,00 / 0,20 ms | 15,1 / 31,0 ms | 133 ms (Öffnen) | 133 ms |
| vorher, Einstellung 5 (Sammeln) | 5,09 / 14,38 ms | 25,1 / 59,8 ms | 17,4 ms | 83 ms |
| vorher, Einstellung 6 (Tragen) | 6,08 / 14,64 ms | 32,5 / 55,3 ms | 17,4 ms | 67 ms |
| nur 16, Einstellung 5 | 9,01 / 23,07 ms | 43,0 / 77,5 ms | 17,4 ms | 117 ms |
| nur 16, Einstellung 6 | 10,85 / 20,85 ms | 45,3 / 80,6 ms | 17,7 ms | 117 ms |
| **nach 15**, Einstellung 1 | 0,01 / 0,41 ms | 24,4 / 46,2 ms | 150 ms (Öffnen) | 200 ms |
| **nach 15**, Einstellung 5 | 0,01 / 7,72 ms | 29,5 / 54,9 ms | **17,7 ms** | 83 ms |
| **nach 15**, Einstellung 6 | 0,01 / **0,38** ms | 27,8 / 50,1 ms | **17,4 ms** | 83 ms |

- Layerize: im Flug p50 0,01 ms. p95 in Einstellung 6 0,38 ms (erfüllt), in Einstellung 5 7,7 ms: Die 5 s dort
  enthalten das Ende der 4-s-Fahrt (Umstellen der angekommenen Glühwürmchen) und das Anlegen der Flüge am Start; ein
  Zwischenstand (Flüge im Bild danach angelegt, 8 s Nachlauf) hatte 0,20 / 0,20 ms. In Einstellung 5 also knapp nicht
  erfüllt; die Ausreisser vermutlich dort (nicht einzeln zugeordnet).
- Gezeigte Bilder im Flug: kein Abstand über 50 ms (max 17,7 ms): erfüllt. Die Glühwürmchen ziehen jetzt mit dem
  Compositor; vorher kam ihr Ort nur mit jedem Hauptbild (p50 25–33 ms, bis 83 ms), auch wenn die Bilder glatt kamen.
- Nicht erfüllt, wenn man den Hauptthread misst: Die rAF-Schleife des Messskripts hat im Flug Abstände bis 83 ms (wie
  vorher), BeginMainFrame liegt im Flug etwas über Einstellung 1 (29,5/27,8 gegen 24,4 ms). Diese Hauptbilder erzwingt
  die Messung; ohne sie läuft im Flug kein JavaScript pro Bild, das etwas zeigt (nur die Tweens von Arm und Kraft des
  Strahls rechnen ihren Stand, ohne DOM). Teuer ist die Stilberechnung der rund 90 laufenden Animationen je Hauptbild.
- Poco-Stelle 50,4 s / Durchlauf 2b 23,6 s («FrameRequestCallback: Script 86 ms»): In der Emulation gibt es nach
  15 in den Fahrten 5/6 keine Script-Aufgabe über 30 ms mehr (vorher 1× 34 ms; ein Zwischenstand mit 8 s Nachlauf und
  Anlegen im nächsten Bild hatte 470/334 ms, deshalb jetzt 2 s und Anlegen in `act`). Das Script in den Pausen (bis
  130 ms bei 4×, Ruhe 3/4) ist das Laden des Himmels (Ticket 03/09).
- Fehlende Kacheln in den Fahrten 5/6, Desktop 4K: nur 16 105/120, nach 15 2/0 (siehe Ticket 16). Handy ×4 ganzer
  Prolog nach 16+15: 12 Bilder, Desktop 111 (Lauf `x-neu5`).

**Aussehen:** Dieselbe Formel, als Keyframes 30-mal pro Sekunde (linear dazwischen; bei höchstens 115 px/s
Abweichung unter 0,1 px), das Schwingen über die Sinus-Kurve der Animation statt `Math.sin` (wie schon am Waldrand und
um die Lampe). Ruhepunkte im Vergleich vorher/nachher unverändert (Ticket 16). Reduzierte Bewegung (Fahrten 0 s,
Flug läuft im Ruhepunkt weiter, Bild `scratchpad/16-15/out/debug-wenig-r6.png`), Überspringen (Tempo 60) und Tempo 4
laufen über die Zeit der Bühne; `geschichte-probe` mit Prolog, Überspringen und Epilog grün.

Tests (`leise.sh` 100 %): `node tests/logic.test.mjs` (2033), `node tests/golden.mjs`, `tests/geschichte-probe.mjs
--start`, `--grad leicht --welten 2 --finale leicht`, `--handy`, `--quer --grad leicht`, `--uebersicht --dorf` (dieses Mal
grün, siehe Ticket 16), `tests/leistung-probe.mjs --handy`, `tests/start-probe.mjs`, `tests/leerlauf-probe.mjs`: alle grün,
keine Warnung «Weckstelle fehlt». Offen: Poco (Handy-Durchlauf 3, max ≤ 33 ms in Einstellung 6).

### 01.11.2026 – Browser-Review (`77e0e22`)

Echtes Chrome mit Fenster und GPU, Handy-Emulation ungedrosselt und ×4, Trace und Screencast jedes Bildes (Scratchpad
`rev1615/`, `flug2.mjs`). **Flug flüssig:** Handy ×1 Einstellung 6 gezeigte Bilder max 21,7 ms, Layerize p95 0,01 ms,
BeginMainFrame p50 2,2 ms; Handy ×4 Einstellung 5/6 Layerize p95 0,52 / 0,20 ms (vorher 17,1 / 15,9), gezeigt max
33,4 / 50,1 ms (vorher 18,7 / 33,3); der eine Abstand von 50 ms in 6 fällt in eine Folge langer Hauptbilder
(BeginMainFrame 34–63 ms, Stil der laufenden Animationen) bei P + 0,7 s. **Tempo** (Tippen 0,4 s nach dem Start von 5 und
6): erste Probe stark gestört (bis 327 ms), Wiederholung ruhig bis auf je eine Lücke von etwa 90 ms am Start der Fahrten
5 und 6 (vorher max 53 / 35 ms). Vermutlich das Anlegen der Flüge im Bild des Starts; auf dem Poco beobachten.
**Reduzierte Bewegung:** Schnitt in den Wald, die Glühwürmchen fliegen im Ruhepunkt ins Bild (`out/c-wenig.png`);
**Überspringen** während 6 setzt sie sofort an ihren Platz, das Angebot erscheint korrekt. **Epilog** ohne Auffälligkeiten
(keine Ausreisser im Screencast). Die Ebenen, die auf dem Desktop fehlen (siehe Ticket 16), kommen schon mit `c9d5532`,
nicht von diesem Ticket; der Flug selbst ist in Ordnung.
