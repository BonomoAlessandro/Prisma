# 01: Ruhe-Bildrate im Level

**Spec:** ../spec.md

**Status:** ready-for-human (umgesetzt und reviewt; wartet auf den Test des Nutzers auf dem Poco und den Akku-Vergleich)

**What to build:** Im Level zeichnet das Spiel heute stetig 60 Bilder/s, auch wenn der Spieler nur überlegt (ADR 0008).
Neu senkt es in **Ruhe** die Bildrate, etwa auf 30, und kehrt bei jeder Eingabe oder Animation **sofort** auf 60
zurück. Zunächst nur als Schalter `?ruhetakt=<n>` (z. B. 30 oder 20). Ohne den Schalter bleibt alles wie heute. Den
Standard entscheidet der Nutzer nach seinem Test auf dem Poco und einer Messung am Akku.

- [x] **Ruhe** heisst: im Level (`flow.state === 'play'`, nicht Menü/Übersicht/Geschichte/Bühne), seit mindestens etwa
      1,5 s keine Eingabe (pointerdown/move/up, Rad, Tasten, Touch), keine laufende Drehung, kein Wackeln, keine Feier,
      kein Herauswachsen oder Überblenden, keine Fahrt der Kamera nach einer Eingabe (Ziehen, Zoom, Nachlaufen), kein
      Strahl, der gerade wächst, kein Wechsel der Führung (`fuehrung.wechselt`, Lichtkegel, der aufwächst). Das Schweben
      der Kamera, das Fliessen der Strahlen und das Drehen der Ziele zählen **nicht** als Bewegung (das ist die Ruhe).
      Im Zweifel lieber 60: Lieber zu selten sparen als ein stufiges Bild bei etwas, das man anschaut.
- [x] **Sofort zurück:** Die erste Eingabe nach der Ruhe wird im nächsten Bildschirmbild mit 60 gezeichnet, nicht erst
      im nächsten 30er-Takt. Hover auf dem Desktop und der Druck auf ein Element zählen als Eingabe.
- [x] Gleichmässiger Takt wie heute über `frameRate.teiler` (jedes k-te Bildschirmbild, 120 Hz → 4, 60 Hz → 2).
- [x] Alle Animationen laufen zeitbasiert weiter (gleiches Tempo bei 30 wie bei 60). Prüfen, ob irgendwo je Bild statt
      je Zeit gerechnet wird.
- [x] Die adaptive Auflösung wertet 30er-Bilder nicht als zu langsam (`frameRate.gap`), und der Wechsel 30 ↔ 60 löst
      keine Umbauten aus.
- [x] Die Leistungsanzeige (Taste F, `?perf`) zeigt das Ziel mit dem Grund «Ruhe», das Messwerkzeug zählt richtig.
- [x] `?takt=30` bleibt, wie es ist. Die Geschichte bleibt immer bei 60 (Vorgabe des Nutzers). Menü und Übersicht
      bleiben bei 10, hinter der Bühne bei 30.
- [x] **Tests:** Logiktest der Entscheidung (fps, grund) mit und ohne Schalter. Eine Browser-Probe, Desktop und Handy:
      Mit `?ruhetakt=30` gezeichnete Bilder/s im ruhenden Level ≈ 30; nach einem Tippen aufs Brett ist der nächste
      Abstand ≈ ein Bildschirmbild und die Rate sofort 60. Bleibt etwas, das man anschaut, bei 60 (Drehung, Feier)?
      Ohne Schalter unverändert 60. Bestehende Proben und Golden bleiben grün.
- [x] `APP_VERSION` in `index.html` und `sw.js` gleich auf `2026-11-15 energie-1`.
- [x] README (Abschnitt Leistung, Bildrate) und `CONTEXT.md`, falls dort Begriffe dazu stehen: Ruhe-Bildrate.

## Hinweise

- `frameRate` in `index.html` (um `const frameRate`, `fps()`, `grund()`, `due`, `teiler`), `sceneLoop`
  (`wake`, `ambient`, `pending`), `adaptiveResolution.tick(gap)`, `perfHud`, `leistung` (Messwerkzeug).
  Eingaben wecken heute schon die Schleife (`sceneLoop.wake`). Das ist eine gute Stelle, um den Zeitpunkt der letzten
  Eingabe zu merken.
- `sceneLoop.pending()` kennt schon vieles, was «es bewegt sich etwas» heisst (Tweens, Einblenden, Kamera). Verwende
  es, statt eine zweite Liste zu pflegen, wo es passt.
- Messen auf dem Poco macht der Koordinator. Du misst im Browser des Rechners.

## Notizen der Umsetzung (15.11.2026)

- Ruhe zusätzlich nicht, solange ein Himmel Bewegung zeigt, der das Auge folgt (`skyTheme.fluid`, wieder eingeführt:
  Fische am Strand, Glühwürmchen in Wald und Dorf, Funken am Vulkan, Planeten; Ticket 17 der Leistung). Mit dem
  Schalter ruht das Level darum nur in der Wüste und unter der Milchstrasse. `?ruhehimmel` zählt diese Himmel zum
  Vergleich als Ruhe (für die Messung am Akku).
- Ebenso keine Ruhe: Finger oder Taste unten, Hand der Führung, Lichtwelle samt Nachwirkung (`SHOCK_REST_S`). Eine
  Bewegung zählt wie eine Eingabe (danach noch 1,5 s voller Takt).
- `?ruhetakt` ab 20 (`MAX_DT`). ADR 0009. Probe `tests/ruhetakt-probe.mjs`.

## Comments

### Review (15.11.2026, unabhängiger Reviewer)

**Läufe** (Worktree `energie-01`, nach dem Fix unten): alle 9 `tests/*.test.mjs` grün (`generator.test.mjs` nur über
`leise.sh`, sonst verweigert er), `golden.mjs` grün (842 Level). `ruhetakt-probe.mjs` Desktop und `--handy` OK: Ruhe
30,0–30,1 Bilder/s bei 60 Hz, jede Lücke genau ein Bildschirmbild, Grund «Ruhe»; Tippen: erstes Bild im nächsten
Bildschirmbild (`warten` 0), danach 60, Ruhe wieder nach 1601/1617 ms; Drehen und Feier ohne ein Bild in Ruhe; ohne
Schalter stetig 60, Grund «Spiel»; Wald 60 mit «Himmel mit Bewegung». `leerlauf-probe.mjs` OK.
`geschichte-probe.mjs --dorf --handy` bestanden, keine Lücke über 50 ms, keine fehlende Weckstelle. Zusätzlich je
Himmel mit `?ruhetakt=30` geprüft (Probe von Hand, wieder gelöscht): `skyTheme.fluid` true in Dorf, Wald, Strand,
Vulkan, Planeten; false in Wüste, Milchstrasse und Eishöhle (nur `?sky=`), dort Ruhe mit Ziel 30. Würfel: In der Seite
sind derzeit keine Würfel-Level im Spiel (`LEVELS_3D` leer), `cubeView` hat ausser `glow` (Lichtwelle) keine eigene
Animation; keine Probe nötig.

**Richtigkeit:** Eingaben laufen alle über `sceneLoop.wake` (Capture auf `window`: pointerdown/move/up, wheel, keydown,
touchstart), also auch Band, Knöpfe, Menü, Kopfzeile samt Fokus mit Tab; Pinch und Halten zusätzlich über
`input.pointer`/`input.pinch`. `rege` setzt `skipped = Infinity`, das nächste rAF zeichnet. Was ohne Weckruf beginnt
(Hand nach 5 s, `loese`), fängt `bewegt` im nächsten rAF ab, weil es in Ruhe jedes rAF (auch die übersprungenen) fragt.
Strahl, Ziel, Überblenden, Levelwechsel (`flow` in/out), Feier samt Regen, Weigerung, Kamera, Lichtwelle (8 s) sind
in `pending` bzw. `bewegt`. DOM (Zahl der Drehungen, Band, Hinweise, Lichtkegel und Hand per CSS) und Ton hängen nicht
am Takt des WebGL-Bilds. Kein Fall gefunden, in dem es fälschlich ruht.

**Ohne Schalter:** `ruhe` kehrt sofort zurück, `fps`/`grund` liefern über `bildrate`/`bildrateGrund` dieselben Werte
in derselben Reihenfolge wie vorher (geprüft Fall für Fall), dazu je Weckruf ein `performance.now()`. Bitgleich im
Verhalten, Mehrarbeit vernachlässigbar.

**Takt und Messung:** Zeitbasiert überall, was in Ruhe läuft (Kamera mit `1 - 0.00002^dt`, Fische mit eigener
Schrittweite, Shader nach `uTime`). `adaptiveResolution`: Budget in Ruhe `k × vsync`, erstes Bild nach der Rückkehr
nicht gewertet, kein Umbau beim Wechsel. `leistung` zählt Bildschirmbilder, `perfHud` zeigt 30 «Ruhe». `?takt=30`
bleibt (ruhetakt 30 dort wirkungslos, 20 möglich), mit `?t=` ruht die Schleife wie bisher (nur nach 20 statt 10
rAF).

**Funde:**
- Klein, behoben (82d931a): `createPanoramaSky().fluid` allokierte je rAF eine Closure (`children.some`), obwohl
  `skyTheme.fluid` ausdrücklich ohne Allokation gebaut ist; jetzt eine Schleife.
- Klein, Vorschlag: Die Probe deckt Hover, Rad und Tasten nicht ab und prüft nicht, dass beim Wechsel 30 ↔ 60 kein
  Umbau der Auflösung kommt (`adaptiveResolution.changes` vorher/nachher). Kein Muss, der Code ist hier einfach.
- Kein mittlerer oder grosser Fund. `Status:` oben steht noch auf `ready-for-agent`; der Koordinator setzt ihn für
  den Test des Nutzers.

**fluid-Markierung:** vollständig für die Welten der Geschichte. Nicht markiert und zu Recht Ruhe: Nebel im Wald,
Wasser und Glitzern am Strand und in der Eishöhle, Staub, Sterne. Zu viel ist eher das Dorf: Die Glühwürmchen dort sind
wenige und langsam; ob sie mit 30 stufig wirken, kann nur der Poco zeigen (`?ruhehimmel`).

**Einschätzung Gewinn und Mittelweg:** Je Welt etwa 10 Level je Grad; ruhen kann das Level nur in Wüste und Sterne,
also in etwa einem Drittel der Spielzeit im Level und dort nur in den Pausen des Überlegens. Mit den Werten der Spec
(60 → 30 spart etwa 2 W von 3,6 W) bleibt im Mittel grob 10–15 % der Leistung im Level; mit `?ruhehimmel` wären es
etwa 35–45 %. Ein Mittelweg «nur die bewegte Ebene mit 60» geht in einem Canvas nicht: Jedes gezeigte Bild ist ein
ganzes Bild, die Kamera schwebt (alles bewegt sich etwas), und Bloom, Pinsel und letzter Schritt laufen über das ganze
Bild. Möglich wäre nur, die ruhige Szene samt Tiefe alle 33 ms in ein Ziel zu zeichnen und je Bild die bewegte Ebene
darüber plus die Bildschritte; das spart nur die Geometrie, nicht die Füllarbeit der Bildschritte, und für die Fische
(unter dem Wasser, im Wasser-Shader gebrochen) geht es gar nicht. Ein zweites durchsichtiges Canvas für die Teilchen
verlöre Bloom, Nebel und Verdeckung und kostet eine Ebene im Compositor. Beides gross und unsicher. Günstiger: auf dem
Poco mit `?ruhetakt=30&ruhehimmel` prüfen, welche Himmel stetig 30 in Ruhe vertragen (ADR 0006: der Strand mit
stetigen 30 lief «sauber»; das Ruckeln in Ticket 17 kam vom häufigen Wechsel), und `fluid` dann je Ebene entscheiden.

**Ergebnis:** bereit für den Test des Nutzers auf dem Poco (`?ruhetakt=30` in Wüste und Sterne, zum Vergleich
`&ruhehimmel` in Dorf, Wald, Meer, Vulkan, Planeten).
