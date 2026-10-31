# 05: Hall vorab berechnen

**Spec:** ../spec.md

**Blocked by:** 01

**Status:** ready-for-agent

**What to build:** Der erste Klick friert die Seite nicht mehr ein, und der Ton klingt genau gleich wie heute.

Heute baut `audio.unlock()` (`index.html` um 15097) beim ersten `pointerdown` die Impulsantwort für den Hall: 3,2 s
Stereo, etwa 307 000 `Math.pow`-Aufrufe auf dem Hauptthread. Laut PLAN.md:17 blockiert das 350–430 ms. Der erste Klick
ist oft «Klicken zum Starten», also genau der Übergang in den Prolog.

- [x] Die Impulsantwort wird vorab berechnet, als rohe Float32Arrays unabhängig vom AudioContext. Das passiert in
      einem Worker oder in kleinen Stücken im Leerlauf, sobald der Startbildschirm ruhig ist. Beim Unlock wird nur noch
      der `AudioBuffer` aus den fertigen Daten gefüllt und an den Convolver gehängt. Die Abtastrate des Contexts
      beachten: Weicht sie von der Annahme ab, wird neu berechnet oder resampelt, ohne den Klang zu verändern.
- [x] Bitgleich bzw. hörbar gleich: Die Kurve bleibt dieselbe. Ein Test vergleicht die vorab berechneten Daten mit der
      bisherigen Berechnung, vor dem Umbau als Referenz festgehalten.
- [x] Klickt jemand, bevor die Vorabberechnung fertig ist, darf der Klick trotzdem nicht einfrieren. Dann startet der
      Ton ohne Hall, und der Hall wird weich dazugeblendet, sobald er bereit ist.
- [x] Prüfen, was sonst noch in `unlock()` und beim ersten Ton teuer ist (Glitzer-Timer, Knoten-Aufbau), und mitnehmen,
      was auffällt.
- [x] Laufende Kosten des Convolvers auf dem Audio-Thread notieren (Handy). Ändern nur in Ticket 07, falls die
      Messrunde ihn als Ursache zeigt.
- [x] Messen: längster Frame beim ersten Klick vorher und nachher, ungedrosselt und gedrosselt. Ziel: kein Bild über
      33 ms.
- [x] Tests grün, Review des Diffs, Commit auf `feature/leistung`. PLAN.md:17 nachführen.

## Comments

**Umsetzung (31.10.2026, Branch `leistung/05-hall` ab `963177d`).** Ticket 01 war noch nicht da; gemessen mit einer
eigenen Probe über `tools/chrome.mjs` (Headless-Chrome mit GPU, je Lauf ein frischer Chrome, `?noadapt`, Klick bzw.
Tippen auf «Klicken zum Starten» 1,5 s nach dem Erscheinen; rAF-Lücken, `long-animation-frame`, dazu die Dauer von
`new AudioContext`, `ConvolverNode.buffer` und `resume` über ein Skript vor dem Laden der Seite). Die Werte mit dem
Messwerkzeug aus Ticket 01 im echten Chrome nachholen.

Was am ersten Klick teuer war (vorher, Zerlegung von `unlock`):

| | Desktop 1440 × 900 | Handy-Emulation 390 × 844, Touch, CPU 4× |
|---|---|---|
| `new AudioContext()` | 65–90 ms, mit kaltem Audiogerät (erster Lauf nach einer Pause) 320–350 ms | 104–354 ms |
| Impulsantwort (`_impulse`, 307 200 `Math.pow`) | 12–16 ms | 85–102 ms |
| `ConvolverNode.buffer` setzen (FFT-Stufen bauen, `normalize` macht kaum etwas aus) | 21–28 ms | 136–183 ms |
| Knoten, Glitzer-Timer, `resume` | unter 1 ms | unter 1 ms |

Die Annahme des Tickets stimmte also nur zum kleineren Teil: Teurer als die Rechnung sind das Anlegen des Kontexts
(synchrone Anfrage an den Audiodienst) und der Puffer des Convolvers. Beides lässt sich nicht in Stücke teilen. Darum
geschieht beides jetzt **vorab, ohne Geste, solange der Startbildschirm still steht**:

- `hallImpulse(rate, seconds, step)` (Generator, Bereich `HALL:BEGIN … HALL:END`) rechnet die Kurve als zwei
  Float32Arrays, unabhängig vom Kontext. `hallData(rate)` lässt sie in einem Worker rechnen (Blob wie beim Dekodieren
  der Skybox), gleich beim Laden auf Verdacht für 48 kHz; ohne Worker in Stücken von etwa 4 ms im Leerlauf. Je
  Abtastrate einmal; hat der Kontext eine andere Rate (etwa 44,1 kHz auf dem Mac), rechnet der Worker für diese neu,
  ohne Resampling, also genau wie früher.
- `audio.prepare()` legt beim ersten Bild den Kontext angehalten an (läuft er ohne Geste, wird er angehalten), baut die
  Knoten und hängt den Puffer an den Convolver. `audio._quiet` lässt das nur zu, solange `#intro` noch auf die
  Enthüllung wartet (noch ohne `.go`, die Animationen stehen), sonst erst nach `introCalm` im Leerlauf. In allen Läufen
  war beides 0,3–1,9 s vor der Enthüllung fertig.
- `unlock()` übernimmt den Kontext (`audio.ctx` bleibt das Zeichen «freigeschaltet») und weckt ihn in der Geste
  (`_sync` → `resume`, 0–1 ms); stumm bleibt er angehalten wie bisher nach `_sync`.
- Klick vor der Vorbereitung (etwa während der Enthüllung oder mit `?nointro` vor dem ersten Bild): Der Kontext entsteht
  dann im Klick (wie früher, unvermeidlich), der Hall nicht: `wet` startet bei 0 und blendet mit `setTargetAtTime`
  (Zeitkonstante 0,4 s) auf 0,55, sobald der Puffer hängt. Geprüft, indem die Probe den vorbereiteten Kontext verwirft
  und dann klickt: `wet` 0 → 0,20 → 0,36 → 0,45 → 0,50 → 0,54 in Schritten von 0,25 s.
- Ohne Geste angelegt, warnt Chrome im echten Fenster einmal in der Konsole («AudioContext was not allowed to start»);
  Headless blieb die Konsole still. Die Proben zählen Warnungen nicht als Fehler.

Bitgleich: Das Rauschen kommt nicht aus `Math.random`, sondern aus `mulberry32(5)`, die Kurve ist also bei jedem Laden
dieselbe und lässt sich exakt vergleichen. `tests/hall.test.mjs` hält SHA-256 und Stichproben der alten Berechnung
(`_impulse` aus `963177d` mit nachgebautem AudioBuffer, `getChannelData` als Float32Array) für 44,1, 48 und 96 kHz fest
und vergleicht die neue Rechnung damit, dazu andere Stückgrössen und den Quelltext für sich wie im Worker.
`copyToChannel` übernimmt die Float32-Werte unverändert; der Klang bleibt bitgleich.

Längster Frame beim ersten Klick («Klicken zum Starten»), je Lauf ein frischer Chrome:

| | vorher | nachher |
|---|---|---|
| Desktop, ungedrosselt | 90–125 ms, mit kaltem Audiogerät 350–367 ms | 19–36 ms (8 Läufe) |
| Handy-Emulation, CPU 4× | 424–606 ms | 54–125 ms (8 Läufe), davon Ton 0–1 ms |

Gedrosselt ist das Ziel von 33 ms nicht erreicht, aber der Rest gehört nicht zum Ton: `long-animation-frame` zeigt im
Klick-Bild kein Skript über 5 ms, es ist das Umschalten vom Startbildschirm in Menü bzw. Prolog (Stil, Layout,
Zeichnen; Tickets 03/04, sonst Messrunde 07). Vor der Enthüllung kommen die Kosten dazu (Desktop Kontext 73–149 ms und
Puffer 24–43 ms, gedrosselt 77–432 ms und 125–222 ms), in einer Phase, die ohnehin schon Lücken von 0,5–4,7 s hat
(Szene, Schrift). Ob sich der Beginn der Enthüllung dadurch verschiebt, war im Rauschen der Läufe nicht zu sehen
(gedrosselt `.go` vorher 4,6–5,8 s, nachher 4,9–7,1 s nach dem Laden, bei parallel laufenden Agenten); Ticket 03
sollte das mit dem Messwerkzeug nachprüfen.

Laufende Kosten des Convolvers (Notiz für Ticket 07): angenähert über `OfflineAudioContext` (60 s Rauschen durch den
Convolver mit der Stereo-Impulsantwort von 3,2 s bei 48 kHz, gegen dieselbe Kette ohne) etwa 47 ms Rechenzeit je
Sekunde Ton, also knapp 5 % eines Desktop-Kerns. Im Echtzeitbetrieb rechnet Chrome die langen Teile auf einem
Hintergrund-Thread, der Audio-Thread nur die kurzen. Weil das Glitzern alle 2,5–6,5 s einen Ton mit 3,5–5 s Abklingen
und 3,2 s Nachhall bringt, ist der Convolver praktisch immer aktiv. Auf dem Poco grob geschätzt 10–15 % eines Kerns;
messen in Ticket 07 per Remote-DevTools (Performance-Aufnahme, Audio-Threads). Nicht geändert.

**Review Code (31.10.2026).** Diff `963177d..64aa021` gelesen, `node tests/hall.test.mjs` (6) und
`node tests/logic.test.mjs` (2032) grün. Der Worker-/Leerlauf-Pfad ist sauber: CSP oder fehlender Worker (Ausnahme
im Konstruktor) und ein Fehler im Worker (`onerror` → `reject`) fallen beide auf die Stücke im Leerlauf zurück; der
Blob-Worker braucht kein Netz, also offline wie die Skybox. Abtastrate je Kontext, ohne Resampling. `_sync` und
`setMuted` sehen den vorbereiteten Kontext nicht (`ctx` bleibt bis zur Geste leer), `visibilitychange` weckt ihn also
nicht zu früh. `?nointro`: `#intro` bekommt nie `.go`, `_quiet` läuft sofort. Der Test liest die echte
`hallImpulse` aus `index.html`, keine Kopie. Autoplay: `resume` geschieht synchron in der Geste (`click` auf
`#intro` bzw. `pointerdown`/`keydown` mit `userActivation`); auf iOS ist erst der `click` nach `touchend` eine
Aktivierung, dort weckt also `ui.start` den Kontext, wie früher das Anlegen. Firefox zeigt in der Adresszeile das Symbol
«Autoplay blockiert», solange der Kontext ohne Geste steht; harmlos.

Selbst behoben (eigener Commit): `copyToChannel` → `getChannelData(ch).set(d)` (bitgleich; `copyToChannel` fehlt dem
`webkitAudioContext` von Safari vor 14.1, den der Code ausdrücklich unterstützt, dort wäre der Hall still geblieben);
PLAN.md an die Messwerte oben angeglichen (Desktop 19–36 statt 19–23 ms, Handy 54–125 statt 72–125 ms); überlange
Kommentarzeile in `tests/geschichte-probe.mjs` umbrochen.

Offen, mittel (nicht umgebaut):
- **Platzierung vor der Enthüllung.** `prepare` läuft beim ersten Bild, also in der Ladephase, in der `sceneReady`
  (erstes Bild der Szene) und die Schrift noch ausstehen. Kontext (gedrosselt bis 432 ms) und Puffer (bis 222 ms) sind
  lange Aufgaben auf dem Hauptthread und können `sceneReady` und damit `.go` direkt verschieben – genau das, was
  Ticket 03 verkürzen will. Erst nach `introCalm` wäre zu spät: «Klicken zum Starten» erscheint schon 2,9 s nach der
  Enthüllung, `introCalm` erst nach 4,2 s, ein früher Klick trüge dann wieder die alten Kosten. Vertretbar ist die
  heutige Platzierung, weil die Phase ohnehin Lücken von Sekunden hat und kein Bild der Enthüllung trifft. Vorschlag:
  Ticket 03 misst mit dem Werkzeug aus 01 `.go` mit und ohne `prepare` (etwa `?noaudio`-Schalter in der Probe); zeigt
  sich eine Verschiebung, `prepare` an `sceneReady` hängen (nach dem ersten Bild der Szene, vor `.go`) bzw. die Lücke
  zwischen `sceneReady` und Schrift nutzen, und `canStart` zusätzlich auf den fertigen Ton warten lassen (höchstens
  bis zur 15-s-Grenze), damit der Klick nie die Kosten trägt.
- **Klein, nur notiert:** Läuft der Kontext ohne Geste schon (`state === 'running'`) und kommt der Klick, bevor das
  `suspend()` aus `prepare` greift, sieht `_sync` noch «running» und weckt nicht; der Kontext bleibt bis zur nächsten
  Geste stumm (jede weitere `pointerdown` ruft `_sync`). Fenster von Millisekunden, darum nicht geändert. Die
  48-kHz-Daten bleiben bei 44,1-kHz-Kontext im Cache (1,2 MB); egal.
