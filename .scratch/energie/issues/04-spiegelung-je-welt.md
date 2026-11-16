# 04: Spiegelung je Welt, Sparfassungen bereinigen

**Spec:** ../spec.md

**Status:** ready-for-human (vom Nutzer auf dem Poco getestet, 16.11.2026: alles gut; wartet auf den Merge nach `main`)

**What to build:** Entscheid des Nutzers nach dem Test auf dem Poco (15.11.2026, Stand `energie-3`):

- **Spiegelung des Bretts:** Auf den eigenen Welten, also allen ausser den beiden im All, braucht es keine Spiegelung
  auf dem Brett. Sie fällt dort **ganz weg**: Dorf, Bergwald, Meer/Strand, Wüste, Vulkan, auch die Eishöhle. In den
  beiden Welten im All (Planeten, Sterne/Milchstrasse) bleibt sie, aber in der kleineren Fassung (heute
  `?spar=spiegelklein`: 0,25 statt 0,35, ohne MSAA). Dort «wirkt die schwächere Spiegelung auch gut».
- **`aufloesung` (Pixelverhältnis 1,75) wird nicht übernommen.** Auf dem Poco «flackert» beim Prisma die linke untere
  Kante, wenn eine Spitze zur Kamera zeigt. Die Farne im Wald wirken weniger schön, und ihre Farbe ändert sich mit der
  Bewegung der Kamera leicht. Das könnte auch vorher schon so gewesen sein. Die Spiegel werden je nach Winkel etwas
  pixeliger, das fand er in Ordnung.
- `spiegel2` und `pinsel3` bringen mit der Ruhe-Bildrate fast nichts (Review Ticket 03).

Aufgaben:
- [x] Ohne Parameter: In den Welten ausser Planeten und Sterne rechnet das Spiel **keine** Spiegeltextur mehr. Weder
      `renderReflection` noch die Mipmaps dürfen laufen, sonst spart es keinen Strom. Das Brett zeigt keinen
      Spiegelanteil, also keine alte oder schwarze Textur und keinen hellen Fleck. Der Look des Bretts soll sonst
      gleich bleiben. Prüfe, ob der Spiegelanteil im Shader (`addBoardReflection`, `boardReflectGlsl`) beim Abschalten
      Helligkeit oder Fresnel verändert. Vergleiche dazu ein Bild «heute» mit «ohne», in allen Welten.
- [x] Planeten und Sterne: Spiegelung wie `spiegelklein` als Standard.
- [x] Beim **Überblenden** zwischen zwei Welten, etwa Sterne ↔ andere, kein Sprung und kein Aufblitzen. Wird die
      Spiegelung dabei ein- oder ausgeblendet, dann weich. Prüfe auch Übersicht und Menü (Blick im Himmel) und das
      Brett, das herauswächst.
- [x] Wo die Zuordnung «Welt hat Spiegelung» hingehört, entscheidest du, etwa in die Daten der Skybox oder in die
      Board-Themes (`boardTheme.mirrors`). Halte es einfach und dokumentiere es.
- [x] Schalter zum Vergleichen: `?spiegel=alle`, also Spiegelung überall wie bisher mit 0,35 und MSAA. Die
      `?spar=`-Fassungen `aufloesung`, `spiegel2`, `spiegelklein` und `pinsel3` werden entfernt, samt Code, Probe-Teilen
      und Doku. Sie bleiben in git. Ob `tests/spar-probe.mjs` als Messwerkzeug bleibt (Modus `messen` gegen
      `?spiegel=alle`), entscheidest du; toter Code soll nicht bleiben.
- [x] Vergleichsbilder Handy hoch (`MOBILE=1`, 393 × 852, DPR 2,75) «heute (energie-3)» gegen «neu», je Welt: Dorf,
      Wald, Strand, Wüste, Vulkan, Planeten, Sterne. Ablage `C:\Users\admin\AppData\Local\Temp\prisma-bilder-energie04\`.
      Selbst ansehen und ehrlich beschreiben.
- [x] Gemessene GPU-Zeit je Bild vorher und nachher (Wald, Strand, Vulkan, Sterne), wie in Ticket 03.
- [x] Tests: Logiktests, Golden, Dorf-Probe `--handy`, Probe für den Übergang zwischen den Welten (siehe
      `geschichte-probe`, Übersicht), Bildzeit beim Überblenden ohne neue Lücken.
- [x] README Abschnitt Leistung und Grafik, ADR (neu 0010 oder Ergänzung zu einer bestehenden), `CONTEXT.md` falls nötig.
- [x] `APP_VERSION` in `index.html` und `sw.js` gleich auf `2026-11-15 energie-4`.

## Hinweise

- `renderReflection`, `reflectionInView`, `reflector`, `QUALITY.reflections`, `QUALITY.reflectionScale`,
  `QUALITY.reflectionMsaa`, `boardTheme.mirrors`, `addBoardReflection`, Himmel `backgrounds/skies.js` (ids: village,
  forest, beach, desert, volcano, icecave; die Welten im All prozedural: Planeten, Milchstrasse/Sterne), `skyTheme`.
- Ticket 03 mit Messmethode und `tests/spar-probe.mjs` (`messen`, `bilder`, `pruefe`).

## Notizen der Umsetzung (15.11.2026)

**Zuordnung am Himmel.** `spiegel: true` steht in den beiden Einträgen aus dem Code in `SKY_ENTRIES` (`milky`, `solar`);
`spiegelHimmel(id)` fragt sie ab (mit `?spiegel=alle` immer ja, ohne HDR nie). Am Brett ginge es nicht: Das Steinbrett
steht unter Planeten und Sternen, aber auch in der Eishöhle und im Rückfall. Das Register aus Blender (`skies.js`, vom
Packer geschrieben) bleibt unberührt. ADR 0010.

**Anteil der Spiegelung** (`boardReflection`): ein Uniform `uReflStrength` für alle Bretter statt eines festen je
Material. `follow(dt)` je Bild in `skyTheme.update`: Blendet der Himmel über und hält nicht, wandert der Anteil linear in
`skyTheme.fadeTime` (0,9 s) zum Ziel des gewählten Himmels, im Shader weich (smoothstep); hält der Himmel, bleibt er;
steht der Himmel oder springt er (`set` ohne Überblenden), gilt gleich das Ziel. Bei Anteil 0 bricht `renderReflection`
vorne ab (kein Spiegelbild, keine Mipmaps, kein `limitReflectionMips`), und `boardReflectGlsl` liest die Textur nur unter
`if (uReflStrength > 0.0)` (Bedingung für alle Pixel gleich). Der Beitrag kam im Shader immer nur hinzu
(`gl_FragColor.rgb += refl * fresnel * gloss * …`); Fresnel und Glanz wirken auf nichts anderes. Ohne ihn bleibt das Brett
also genau so, wie es ohne Spiegelbild aussah: keine alte oder schwarze Textur, kein Fleck.

**Grösse:** `QUALITY.reflectionScale` Handy 0,25, Desktop 0,22, `reflectionMsaa` 0 (wie `spiegelklein`); mit
`?spiegel=alle` 0,35/0,3 mit MSAA 2/4 wie bis energie-3.

**Entfernt:** `SPAR`, `SPAR_NAMEN`, `QUALITY_HEUTE`, `sparQualitaet`, `sparAnwenden`, `spiegelTakt` samt Listener, die
Doku dazu. `tests/spar-probe.mjs` heisst jetzt `tests/spiegel-probe.mjs` mit `pruefe` (neu: Himmel nacheinander, ohne
Schalter und mit `?spiegel=alle`), `messen` (`heute`, `alle` als Laufzeitfassung, `ohneSpiegel`, `ohneBloom`,
`ohnePinsel`; ohne die Zerlegung und die Auflösungen) und `bilder` (vorher gegen neu, `--vorher <html>`). Die
Laufzeitfassung `alle` der Messung prüft `pruefe` gegen das Laden mit `?spiegel=alle` (gleiche Textur, Anteil 1).

**Vergleichsbilder** (`spiegel-probe bilder --vorher index-energie3.html`, Kopie von d732d27, Level 212 «Sandviper»,
`?t=12`, Handy hoch) in `C:\Users\admin\AppData\Local\Temp\prisma-bilder-energie04\`: je Welt `<welt>-vorher.png`,
`<welt>-neu.png`, `-ausschnitt` (Mitte des Bretts, etwa 2,75-fach) und `-vergleich` (vorher | neu | Unterschied ×8),
Zahlen in `vergleich-1.json` (Dorf bis Wüste) und `vergleich.json` (Vulkan bis Sterne). «hell»: mittlere Änderung der
Helligkeit neu − vorher, von 255.

| Welt | Pixel mit Abweichung (ganz / Ausschnitt) | hell ganz / Ausschnitt | was man sieht |
|---|---|---|---|
| Wald, Strand, Wüste | 0 / 0 | 0 / 0 | pixelgleich |
| Dorf | 0,3 % / 1,9 % | −0,01 / −0,10 | nur Kern des leuchtenden Ziels und Rand einer Quelle, Brett gleich |
| Vulkan | 0,3 % / 0,7 % | −0,04 / −0,11 | schwache Spiegelbilder unter den Elementen fehlen |
| Eishöhle | 1,3 % / 3,8 % | −0,24 / −0,70 | Spiegelbilder unter Elementen und Strahlen fehlen |
| Planeten, Sterne | 0,8 % / 1,8 % | 0,00 / +0,10 | Spiegelbild etwas weicher (kleinere Textur ohne MSAA) |

Was ich sehe:
- **Wald, Wüste, Dorf:** Lehm, Moos und Beet spiegelten nie, nichts ändert sich. Im Dorf weicht nur der Kern des
  leuchtenden Ziels samt Hof und der Rand einer Quelle ab, nicht das Brett. Das ist Rauschen zwischen zwei Läufen: Derselbe
  Stand zweimal aufgenommen weicht im Dorf an derselben Stelle ab (Ausschnitt 6,8 % der Pixel). Dieses Rauschen am Ziel
  steckt auch in den Zahlen der anderen Welten.
- **Strand:** pixelgleich. Das Gezeitenbecken rechnete die Spiegelung bisher jedes Bild, man sah sie in diesem Blick aber
  gar nicht. Hier fällt reine Arbeit weg.
- **Vulkan:** Auf dem Basalt fehlen die schwachen hellen Spiegelbilder unter den Kanten von Spiegeln und Prismen; man
  sieht es nur im Unterschied ×8, nebeneinander kaum.
- **Eishöhle** (Steinbrett, polierter Stein): Hier sieht man es am ehesten. Unter den Elementen fehlen die weichen hellen
  Spiegelbilder ihrer Unterseiten, unter den Quellen die kurzen gespiegelten Strahlen, und an der hinteren Kante die
  gespiegelte Lichtlinie. Die Fläche des Bretts selbst ist gleich hell und gleichmässig; kein Fleck, keine dunkle
  Stelle, die Rasterlinien gleich. Die Elemente «stehen» etwas weniger auf einem glänzenden Boden.
- **Planeten, Sterne:** Spiegelung wie bisher, nur weicher an den Kanten der Spiegelbilder (kleinere Textur ohne MSAA),
  nebeneinander nicht zu unterscheiden.

**GPU-Zeit je Bild** (`spiegel-probe messen --handy --fassungen heute,alle`, eingebaute Intel UHD 630, 786 × 1704,
4 Runden, Stösse ohne Pause, Level 212; «vorher» ist die Laufzeitfassung wie `?spiegel=alle`, also energie-3):

| | Wald | Strand | Vulkan | Sterne |
|---|---|---|---|---|
| ganzes Bild vorher | 12,54 ±0,09 | 18,69 ±0,16 | 28,54 ±0,14 | 13,60 ±0,10 |
| ganzes Bild neu | 12,60 ±0,03 | 17,90 ±0,11 | 27,64 ±0,18 | 13,48 ±0,22 |
| Schritt Spiegelung vorher → neu | 0 → 0 | 0,75 → 0 | 0,92 → 0 | 0,69 → 0,54 |
| Spiegeltextur vorher → neu | – | 275 × 596 MSAA 2 → keine | ebenso | 275 × 596 MSAA 2 → 197 × 426 |

Am Strand und im Vulkan also −0,8 bzw. −0,9 ms (−4 %, −3 %), in den Sternen −0,15 ms im Schritt (im ganzen Bild im
Rauschen), im Wald nichts (das Moos spiegelte nie). Dass die Bretter die Textur nicht mehr lesen, sieht man im Schritt
der Szene auf dieser Grafik nicht (Strand 13,78 → 13,75). Auf dem Poco fällt mit dem Durchgang (Laden/Speichern des
Ziels, MSAA-Auflösen, Mipmaps) mehr weg; messen lässt sich das nur am Akku.

**Läufe** (alle mit leise.sh, Vorrang 4):
- alle `tests/*.test.mjs` grün (logic, beurteilung, generator, geschichte, hall, ki-tester, levelliste, vorrat,
  wuerfelliste), `golden.mjs` grün (842 Level).
- `spiegel-probe pruefe` Desktop und `--handy` OK: ohne Schalter Spiegelbilder nur unter Planeten und Sternen (jedes
  Bild), sonst keines, im Menü keines. Beim Überblenden Vulkan → Planeten, Strand → Planeten, Sterne → Eishöhle,
  Eishöhle → Sterne, Sterne → Strand wandert der Anteil in 34–51 Schritten, grösster Schritt je Bild 0,03–0,06 (erlaubt
  0,085), nie beim Halten, ohne Umkehr, kein Spiegelbild bei Anteil 0; Planeten ↔ Sterne bleibt 1. Mit `?spiegel=alle`
  rechnet jedes Brett mit Spiegelfläche (Strand, Vulkan, Eishöhle, All), 275 × 596 mit MSAA 2 (Handy) bzw. 432 × 270 mit
  MSAA 4 (Desktop). Längste Lücke beim Überblenden 78 ms (Strand → Wüste, Laden des Himmels), sonst unter 70 ms.
- `geschichte-probe --uebersicht` (Desktop) und `--dorf --handy` bestanden, Konsole ohne Fehler, keine Lücke über
  100 ms in den gemessenen Übergängen («Übersicht → Übung 3 wiederholen → Übung 4» 17 ms).
- `brett-probe --nur formen`: «Brett: in Ordnung» (Übergänge aller Arten ohne Sprung).

**Offen:** Auf dem Poco ansehen, ob die Eishöhle ohne Spiegelbilder auf dem polierten Stein gefällt (dort sieht man es am
ehesten; in der Geschichte kommt sie nicht vor). Die Ersparnis am Akku messen (auf der Kachel-GPU wohl mehr als die
0,8–0,9 ms hier).

## Comments

### Review (15.11.2026, unabhängiger Reviewer)

**Läufe** (Stand a9ff80d plus Review-Commit e0cf984, alle über `leise.sh`, Vorrang 4):
- alle `tests/*.test.mjs` grün (generator über `leise.sh`), `golden.mjs` grün (842 Level).
- `spiegel-probe pruefe` Desktop und `--handy` OK, auch mit der neuen Prüfung (siehe unten).
- `ruhetakt-probe` OK, `leerlauf-probe` OK, `geschichte-probe --dorf --quer` bestanden, Konsole ohne Fehler.
- `geschichte-probe --uebersicht` rot, dreimal auf diesem Stand und zweimal auf d732d27 (temporärer Worktree), jedes Mal
  mit einer einzelnen Lücke von 120–230 ms, wechselnd bei «Spiel → Übersicht», «letztes Level → Übersicht» (bei gaze 1,
  der Blick ist schon im Himmel), «Übersicht → Spiel (Schliessen)» oder «Menü → Übersicht». Das gab es also schon vorher,
  es kommt nicht aus diesem Ticket (die Notiz oben «bestanden» war ein glücklicher Lauf). Gehört zur bekannten Liste.

**Geprüft und in Ordnung:**
- Alle Punkte des Auftrags erfüllt. Zuordnung am Himmel (`spiegel: true` bei `milky`, `solar`) ist einfach und begründet
  (Steinbrett auch in Eishöhle und Rückfall).
- Anteil 0: `renderReflection` bricht vor allem ab (kein `onBeforeRender`, keine Mipmaps, kein MSAA-Auflösen,
  `limitReflectionMips` nicht). Der Shader liest die Textur nur unter `if (uReflStrength > 0.0)`; die Bedingung ist für
  alle Pixel gleich, also kein Problem mit Ableitungen bei `texture2D` mit Bias. Der Sampler bleibt gebunden (three bindet
  ihn je Material), das kostet nichts Messbares. Der Block war vorher schon eigener Gültigkeitsbereich `{ … }`, ausserhalb
  hängt nichts daran: Helligkeit und Fresnel des Bretts ändern sich nicht (Bilder bestätigen: Wald, Strand, Wüste
  pixelgleich).
- Speicher: three legt das Ziel erst beim ersten Rendern an. Wer nie im All war, hat keine Spiegeltextur. Wer aus dem All
  kommt, behält die kleine Textur (197 × 426 HalfFloat mit Mipmaps samt Tiefe/Stencil, gut 1 MB) bis zum nächsten
  `setSize`. Lohnt kein Freigeben (Neuanlegen kostete beim Zurück ins All ein Stocken).
- Überblenden: `skyTheme.update` (darin `boardReflection.follow`) läuft in `animate` vor `draw`, und `draw` ruft
  `renderReflection` vor der Szene. Im ersten Bild mit Anteil über 0 ist das Spiegelbild also schon neu gerechnet, bevor
  ein Brett es liest; eine alte Textur aus dem letzten Besuch im All sieht man nie. Beim Ausblenden rechnet es bis zum
  letzten Bild über 0. Umkehr mitten im Überblenden wandert linear weiter, ohne Sprung. Halten hält.
- Menü und Übersicht (Platte nicht im Bild): keine Spiegelung, wie bisher. Rückfall ohne HDR: `spiegelHimmel` nie, Anteil
  0 wie vorher. `?sky=`: `setSky` setzt den Himmel, `follow` folgt ihm. Brett, das herauswächst, und Bretter ohne
  Spiegelfläche: `boardTheme.mirrors` unverändert.
- Bilder angesehen (Eishöhle, Vulkan, Planeten Ausschnitt, Strand ganz): stimmen mit der Beschreibung oben. In der
  Eishöhle fehlen die hellen Spiegelbilder unter Spiegel und Prisma und die gespiegelten Strahlen sichtbar, die Fläche
  bleibt gleich; im Vulkan nur im Unterschied ×8; Planeten weicher an den Kanten der Spiegelbilder.
- `?spar` restlos weg: kein `SPAR`, `sparQualitaet`, `sparAnwenden`, `spiegelTakt`, `spar-probe` mehr in Code, Proben,
  README, CONTEXT (nur noch der Satz «sind entfallen» im README und die Tickets). `APP_VERSION` gleich in `index.html` und
  `sw.js`.

**Selbst behoben (klein):** e0cf984 `spiegel-probe pruefe` prüfte beim Überblenden nur «kein Spiegelbild bei Anteil 0»,
nicht die Gegenrichtung. Neu zählt sie Bilder mit Anteil über 0, Platte im Bild und einer Spiegelfläche, aber ohne
neues Spiegelbild (das Brett läse eine alte Textur). Desktop und Handy: 0.

**Hinweis, nicht nötig:** Ohne MSAA fällt im All `__ignoreDepthValues` weg (gilt nur beim Auflösen), Tiefe und Stencil
des Spiegelziels werden auf einer Kachel-GPU also gespeichert. Bei 197 × 426 vernachlässigbar; wer es will, müsste in
`reflector.onBeforeRender` vor dem Zurücksetzen des Ziels `invalidateFramebuffer` aufrufen (wie `discardDepth`).

**Ergebnis:** keine mittleren oder grossen Funde. Bereit für den Test des Nutzers (offen wie oben: Eishöhle auf dem Poco
ansehen, Akku messen).

### Akkuvergleich auf dem Poco (16.11.2026)

Strand (`?nointro&sky=beach`, Level 4 «Wasserfarbe»), Kamera schwebt, keine Eingabe, automatische Helligkeit aus
(Helligkeit evtl. anders als am 15.11.). Vorlauf 15 min bis unter 99 %, dann A/B/A/B je 15 min. A wie `main`
(`?ruhetakt=aus&spiegel=alle`), B energie-4 ohne Parameter. Strom aus dem Ladezähler zwischen erster und letzter Stufe.

| Fassung | Bilder/s | Strom | Akku | Temperatur |
|---|---|---|---|---|
| A wie main | 60,8 | 1171 mA | 94 → 75 % | 28,0 → 34,6 °C |
| B energie-4 | 30,4 | 521 mA | 75 → 66 % | 34,6 → 31,3 °C |
| A wie main | 60,7 | 1150 mA | 65 → 47 % | 31,1 → 36,5 °C |
| B energie-4 | 30,4 | 632 mA | 46 → 36 % | 36,6 → 33,9 °C |

**Ergebnis:** B braucht etwa halb so viel Strom wie A (Mittel 577 gegen 1160 mA, −50 %), auch im Akkustand (9–10 %
gegen 18–19 % je 15 min). Mit A wird das Handy wärmer, mit B kühlt es ab. Die absoluten Werte liegen höher als am 15.11.
(Bergwald, andere Helligkeit); verglichen wird nur innerhalb dieses Laufs.
