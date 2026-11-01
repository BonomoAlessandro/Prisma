# 07: Handy-Durchlauf 2 und Messrunde ganze App

**Spec:** ../spec.md

**Blocked by:** 02, 03, 04, 05, 06

**Status:** ready-for-agent

**What to build:** Ein Handy-Durchlauf auf dem Stand nach 02–06 und eine Messung der ganzen App, die festlegt, was dann
noch zu tun ist. Ergebnis sind neue Tickets (`08-…` usw.) in diesem Ordner, je Hotspot eines. Selbst gebaut wird in
diesem Ticket nichts.

- [ ] **Erster Schritt, Handy-Durchlauf 2:** Prüfen, dass 02–06 alle `resolved` sind. `APP_VERSION` nachführen, Tests
      grün, Stand auf `feature/leistung` pushen. Dann **«bereit für Handy-Durchlauf 2, bitte auf Render deployen»**
      unter `## Comments` vermerken und auf die Ergebniskarte des Nutzers vom Poco warten. Die folgenden Schritte
      beginnen erst, wenn sie eingetragen ist.
- [x] Referenzdurchlauf im echten Chrome mit Fenster und GPU auf dem Arbeitsrechner fahren, einmal ungedrosselt und
      einmal mit Handy-Emulation und 4× bzw. 6× Drosselung. Dazu die Ergebniskarte vom Poco auswerten.
- [x] Über den Referenzdurchlauf hinaus jeden Bereich einmal messen: alle sechs Welten bzw. Skyboxen (Wald, Strand,
      Wüste, Vulkan, Planeten, Sterne) samt Reise dorthin, Finale und Epilog, Menü, Übersicht, Feiern («celebration»,
      Regen), Ziehen der Kamera, Grössenänderung bzw. Drehen des Handys.
- [x] Für jeden Bereich über den Grenzwerten: Ursache mit dem Performance-Panel belegen (CPU oder GPU, Script, Paint,
      Upload, Shader), dann ein Ticket mit Messwerten, Ursache, Vorschlag ohne sichtbaren Qualitätsverlust,
      Abnahmekriterium und Blocked-by. Die Notizen in `spec.md` dabei prüfen und jeweils bestätigen, verwerfen oder in
      ein Ticket überführen: Bloom, Spiegelung, Pinsel, HD-Himmel bzw. Grafikspeicher, Panorama-Netz, Staub,
      `cullInstances`, Menü-Blur, Startbildschirm-CSS, erstes Zeichnen einer Skybox, «Spiel → Übersicht», Hall-Convolver.
- [x] Die 8-ms-Marge auf dem Poco gesondert bewerten: Wo liegt die Zeichenzeit pro Abschnitt, und was bringt sie am
      meisten darunter?
- [x] Safari-Risiken für iOS festhalten (Texturgrössen über 4096, Grafikspeicher pro Skybox, SVG-Filter), auch wenn
      iOS nicht geprüft wird. Wo billig vermeidbar, als Ticket aufnehmen.
- [x] Tabelle der neuen Tickets in `spec.md` nachführen. Als letztes Ticket die **Schlussabnahme** anlegen: alle Tests
      grün, Referenzdurchlauf auf dem Arbeitsrechner, `APP_VERSION` nachführen, Stand pushen, «bereit für
      Handy-Durchlauf 3 (Schluss), bitte auf Render deployen», Ergebniskarte vom Poco, README bzw. PLAN.md nachführen.
      Kein Merge, bis der Nutzer es sagt.

## Comments

**Erster Schritt, 01.11.2026:** 02–06 sind alle `resolved` und auf `feature/leistung` zusammengeführt (05 vorher,
dann 06 mit 02, 04, 03). `APP_VERSION = '2026-11-01 leistung-07'`. Tests auf dem zusammengeführten Stand: logic (2033),
golden, hall, beurteilung, generator, geschichte, offline, screenshot, start-probe, geschichte-probe (`--start`,
`--grad leicht --welten 2 --finale leicht`, `--handy`), leerlauf-probe, leistung-probe grün, keine Warnung
«Weckstelle fehlt».

Arbeitsrechner der Agenten (Quadro T2000, Fenster), vorher = 01c bzw. vor dem jeweiligen Ticket:
- Desktop: Karte `adaptiv 1.00, Umbauten 0` in allen Läufen; hinter Startbildschirm und Prolog 0 gezeichnete Bilder/s;
  Menü 10/s; Startknopf 3,8–4,4 s nach dem Laden (vorher 6,5–7,3 s), 2,9 s nach Beginn der Enthüllung; Seitenstart
  280–360 ms (vorher 880–940 ms); Kamerafahrten der Prolog-Bühne enden ohne Hänger.
- Handy-Emulation 4×: Absenkung `Umbauten 2` wie vorher (CPU-gebunden, Streuung `1.00`/`0.50` vorher wie nachher);
  massgebend ist das Poco.

Worauf auf dem Poco achten (aus den Reviews): Absenkung im Spiel (`adaptiv`/`Umbauten`, Spiegel und Skybox scharf?);
Glühwürmchen in den Prolog-Pausen (dort lädt jetzt der Himmel); Hänger beim ersten Klick ins Menü bei wiederkehrenden
Spielern; der Abschnitt «Startbildschirm» enthält das Vorwärmen vor der Enthüllung.

Offene Punkte für die Messrunde: jeder Umbau der Auflösung zeigt ein schwarzes Bild (vorher schon); Start der 3.
Prolog-Fahrt 133 ms; Linien werden nach dem Halt gestaffelt dünner; gröbere Ladestücke des Himmels auf schwachen
Geräten; Wartezeit vor der Enthüllung auf dem Desktop 1,7–2,1 s für neue Spieler (bewusst, Ticket 03); gelegentlich
ausfallendes Bild in der offenen Übersicht (10/s); Spiegelung im Level nur jedes zweite Bild (Kandidat aus 06).

**bereit für Handy-Durchlauf 2, bitte auf Render deployen**

**Handy-Durchlauf 2, Poco F4 GT, 01.11.2026, vom Nutzer:**

```
PRISMA · Referenzdurchlauf (Spec .scratch/leistung/)
Version     2026-11-01 leistung-07
Zeit        1.11.2026, 08:14:18
Gerät       Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36
Modell      Android 13.0.0 21121210G
GPU         ANGLE (Qualcomm, Adreno (TM) 730, OpenGL ES 3.2)
Bildschirm  393×873, Fenster 392×739, Pixelverhältnis 2.75
Rendern     784×1478 (Pixelverhältnis 2.00, adaptiv 1.00, Umbauten 0), Handy
Takt        60 Hz (Median der Bildabstände 16.60 ms)
Zeichenzeit ERSATZMASS: frame() bis nach readPixels (1 px), jedes 10. Bild; der Abstand danach zählt nicht
ACHTUNG     Ersatzmass aktiv (keine GPU-Zeit): 240 Bildabstände mit readPixels nicht gezählt
Grenzen     p95 ≤ 18.3 ms, kein Bild > 33 ms; Zeichnen p95 ≤ 8 ms (Handy)

Abschnitt       Bilder    p95    max  >33 Zeichn   CPU gez/s
Seitenstart*         9  345.4  345.4    3      –  33.0     1
Startbildschirm    253   16.6   17.0    0      –     –     0
Menü               257   16.6   49.5    1   57.7   7.4    31
Prolog            2898   16.6   98.8    5   12.1   3.8     1
Einstieg           325   16.6   65.8    3   58.6   8.4    65
Spiel              822   16.6   49.5    2   33.0   9.4    66
Reise              699   16.6   98.8    2   31.1   7.4    66
Spiel n. Reise     326   16.7   49.4    1   45.8  11.4    38
Gesamt            5580   16.6   98.8   14   39.6            
* Laden: zählt nicht gegen die Grenzwerte. p95/max: sichtbare Bildabstände; Zeichn/CPU: p95 je
  gezeichnetem Bild (Zeichenzeit, CPU-Zeit von frame()); gez/s: gezeichnete WebGL-Bilder je Sekunde.

Flüssig:    nein (Menü, Prolog, Einstieg, Spiel, Reise, Spiel n. Reise)
Zeichnen ≤ 8 ms: nein (Menü, Prolog, Einstieg, Spiel, Reise, Spiel n. Reise)

Längste Bilder:
   345.4 ms  Seitenstart bei 0.2 s
   214.0 ms  Seitenstart bei 0.8 s
   114.6 ms  Seitenstart bei 0.6 s
    98.8 ms  Reise bei 80.0 s
    98.8 ms  Prolog bei 21.4 s
    65.8 ms  Einstieg bei 60.7 s
    65.8 ms  Reise bei 85.9 s
    49.5 ms  Prolog bei 50.4 s

Hänger des Hauptthreads (long-animation-frame):
     342 ms  Seitenstart bei 0.2 s: https://prisma-5d09.onrender.com/?perf=: Script 332 ms, Rendern 4 ms
     173 ms  Seitenstart bei 0.8 s: ohne Script, Rendern 2 ms
     120 ms  Seitenstart bei 0.6 s: FrameRequestCallback: Script 77 ms, Rendern 97 ms
     118 ms  Reise bei 80.0 s: FrameRequestCallback: Script 104 ms, Rendern 110 ms
     101 ms  Prolog bei 21.4 s: ohne Script, Rendern 4 ms
      87 ms  Einstieg bei 60.7 s: FrameRequestCallback → frame: Script 72 ms, Rendern 75 ms
      75 ms  Reise bei 85.9 s: FrameRequestCallback → frame: Script 60 ms, Rendern 61 ms
      72 ms  Einstieg bei 55.9 s: FrameRequestCallback → frame: Script 59 ms, Rendern 60 ms
```

Der Nutzer: Grafik im Spiel «eigentlich ganz gut», bei den **Fischen nicht ganz sicher, ob sie ein wenig pixelig
waren**. Glühwürmchen «super», ausser **einem kurzen Moment, als sie in den Wald flogen**. **Kurzes Flackern des Bildes in
der ersten Noa-Szene.** Erster Klick ins Menü sauber.

Vergleich mit Durchlauf 1 (01c): Gesamt p95 49,3 → 16,6 ms, Bilder über 33 ms 334 → 14; Prolog p95 65,9 → 16,6, über
33 ms 320 → 5, gezeichnet 22/s → 1/s; Startbildschirm max 98,7 → 17,0, 0 gezeichnet; Seitenstart-Hänger 807 → 342 ms;
`adaptiv 1.00, Umbauten 0` gehalten. Offen: Zeichnen (Ersatzmass) p95 31–59 ms überall ausser Prolog, Marge 8 ms weit
verfehlt; Menü 31 gezeichnete Bilder/s statt 10; einzelne Bilder 50–100 ms in Prolog (21,4 s, «ohne Script»), Einstieg
und Reise.

**Messrunde, 01.11.2026** (Branch `leistung/07-messrunde` ab `c42423e`; Rechner der Agenten: Quadro T2000, 4K mit
250 %, Chrome 156, echtes Fenster, `leise.sh` mit 100 %; nicht der Arbeitsrechner der Spec, siehe Ticket 01). Messhilfen
nur im Scratchpad (`07-mess/`: Bereiche, GPU je Durchgang, Dauerlast, Weglassen, CPU-Profile und Traces), `index.html`
unverändert.

*Referenzdurchlauf* (`tests/leistung-probe.mjs --fenster`, `--fenster --handy --drossel 4` bzw. `6`), p95 / max / Bilder
über 33 ms; dazu Zeichnen = GPU-Zeit (Timer) p95 und gez/s, wo aufschlussreich:

| Abschnitt | Desktop | Handy 4× | Handy 6× | Poco (Durchlauf 2) |
|---|---|---|---|---|
| Seitenstart* (max) | 246 | 684 | 1552 | 345 |
| Startbildschirm | 17,1 / 184 / 1; 0 gez/s | 16,9 / 184 / 3 | 33,5 / 334 / 36 | 16,6 / 17 / 0 |
| Menü | 17,1 / 17,6 / 0; 7,8 ms; 36/s | 33,5 / 67 / 24; 16,5 ms; 28/s | 83,4 / 200 / 37 | 16,6 / 49,5 / 1; 31/s |
| Prolog | 17,1 / 83 / 4; 1/s | 17,4 / 83 / 103 | 50,1 / 184 / 674 | 16,6 / 98,8 / 5 |
| Einstieg | 17,1 / 33,4 / 1; 7,1 ms | 33,5 / 100 / 30 | 50,1 / 250 / 54 | 16,6 / 65,8 / 3 |
| Spiel | 17,1 / 59,6 / 3; 11,8 ms | 33,5 / 117 / 162; 23,5 ms | 66,8 / 150 / 308 | 16,6 / 49,5 / 2 |
| Reise | 17,1 / 33,1 / 1; 7,3 ms | 33,5 / 334 / 113 | 50,2 / 341 / 289 | 16,6 / 98,8 / 2 |
| Spiel n. Reise | 17,1 / 17,4 / 0; 11,4 ms | 33,4 / 50 / 43; 27,2 ms | 50,2 / 84 / 107 | 16,7 / 49,4 / 1 |
| adaptiv / Umbauten | 1,00 / 0 | 1,00 / 2 | 0,75 / 3 | 1,00 / 0 |

Die gedrosselten Läufe sind CPU-gebunden (CPU p95 von `frame()` 25–32 ms bei 4×, 33–56 ms bei 6×); ihre «GPU-Zeit»
enthält die Wartezeit auf langsam nachgelieferte Befehle und ist darum zu hoch. Die Absenkung bei 4×/6× ist die
bekannte Folge der Drosselung (Ticket 03); auf dem Poco greift sie nicht. Der Hänger von 184 ms im Startbildschirm
(Desktop und 4×) ist der Klick auf «Klicken zum Starten» (Script 6 ms, der Rest ausserhalb des Scripts); auf dem Poco
nicht vorhanden (max 17,0 ms, «erster Klick sauber»), also kein Ticket.

*Poco-Karte ausgewertet:* sichtbar flüssig in allen Abschnitten (p95 16,6–16,7 ms), Absenkung gehalten. Offen:
(1) Zeichenzeit (Ersatzmass) p95 31–59 ms gegen 8 ms; (2) Menü 31 gezeichnete Bilder/s; (3) einzelne Bilder 50–100 ms
in Prolog, Einstieg, Reise; (4) Seitenstart 342 ms Script. CPU-Zeit von `frame()` auf dem Poco p95 7–11 ms, etwa das
1,9-Fache des Desktops und ein Drittel der 4×-Emulation.

*Jeder Bereich einmal* (eigene Probe `bereiche.mjs`: Stand vor dem letzten Level jeder Welt, Menü 8 s still, «Weiter»,
Level 8 s still, Kamera ziehen, 3× drehen, Übersicht auf/still/zu, Spiel → Menü → Spiel, Grösse ändern bzw. Handy
drehen, Lösen mit Feier, Reise in die nächste Welt, 8 s nach der Ankunft; zuletzt Finale, Epilog, «Zum Menü»; die
Messwerte des Messwerkzeugs je Phase zurückgesetzt). Desktop maximiert und Handy-Emulation ungedrosselt:

| Bereich | Desktop: p95 / max; GPU p95; gez/s | Handy-Emulation: p95 / max; GPU p95; gez/s |
|---|---|---|
| Menü still (6 Welten) | 17,1 / 17–68; 4–8 ms; 10–16/s | 17,1 / 17–24; 7–13 ms; 10–13/s |
| Level still (6 Welten) | 17,1 / 17,4; 10–12 ms; 30/s | 17,1–17,2 / 17,5; 14–18 ms; 30/s |
| Kamera ziehen, Drehen | 17,0 / 17,2; 6–9 ms; 57–60/s | 17,1 / 17,3; 9–12 ms; 57–60/s |
| Übersicht auf / still / zu | 17,1 / 50 (Wald, einmal) / 17 / 33; still 10/s | 17,1 / 17 / 17 / 17; still 10/s |
| Spiel → Menü → Spiel | 17,1 / 33 | 17,1 / 33 |
| Grösse ändern / Handy drehen | 17,1 / 33 (ein Hänger 51 ms ohne Script) | 17,1 / 17,3 |
| Feier (6 Welten) | 17,0 / 17–83 (Wald: Script 90 ms, Vorladen des Meers) | 17,1 / 17–35 |
| Reisen 1→2 … 5→6 | 17,1 / 17–33 | 17,1 / 17,4 |
| 8 s nach der Ankunft | 17,1 / 17–33 | 17,1–17,2 / 17,2 |
| Finale / Epilog / Epilog → Menü | 17,1 / 67 / 17 / 50 (ohne Script) | 17,1 / 83 / 50 / 50 (ohne Script) |

Ungedrosselt ist also überall p95 ≤ 17,2 ms; über 33 ms gehen nur einzelne Bilder an Übergängen. Die Welten
unterscheiden sich kaum (GPU im Level: Wüste am teuersten wegen des Netzes mit 525 825 Ecken). Konsole sauber, keine
Warnung «Weckstelle fehlt».

*Ursachen belegt* (CPU-Profile über `Profiler`, Traces über `Tracing`, Handy-Emulation 4×; Poco etwa 3,4-mal
schneller):

- **Lange Einzelbilder in Reise und Einstieg** sind Script auf dem Hauptthread: Aufbau des neuen Himmels während der
  Fahrt (`build` → `compileParallel` → `renderer.compile(scene)` 228 ms in einem Stück; Schritte von `sliced`, die
  sich nicht teilen: `waterGeometry` 58, `fishField` 60, Base64 von `bakedMesh` 57, `unpackModel` 41 ms), das
  Einschwimmen der Fische über 5 s in einem Bild (`advance`, 140 ms) und `loadLevel` im Bild des Abstiegs (93 ms).
  Das passt zu den Poco-Hängern «Script 104 ms» (Häppchen über `nextFrame`) und «→ frame: Script 60–72 ms». → **09**.
- **Seitenstart:** das Hauptscript als eine Aufgabe, 1376 ms bei 4× (≈ 332 ms Poco): `compileParallel` der Szene
  406, `buildEnvironment` × 2 (PMREM) 388, Elemente zum Vorwärmen 132, Sterne 126 ms. → **10**.
- **Menü 31 Bilder/s:** kein Fehler. Stichproben alle 250 ms: Während der Blick in den Himmel fährt (Tween, etwa
  1,8 s), zeichnet es 60/s, solange der Himmel nach dem Laden schärft bzw. die Streifen einblendet (`skyTheme.moving`,
  etwa 2 s) 30/s, danach 10/s. Der Abschnitt Menü des Referenzdurchlaufs ist kurz (Poco 257 Bilder ≈ 4,3 s) und
  besteht fast nur aus diesen Übergängen; der Desktop zeigt dort ebenso 36/s. Still gemessen überall 10/s. Die Karte
  bekommt eine Spalte «gez/s ruhig» (in **08**).
- **Prolog 98,8 ms** (Poco, «ohne Script, Rendern 4 ms»): Grafikprozess (Upload in der Pause bzw. Rastern der Bühne;
  Trace Desktop: `RendererRasterWorker` 54 ms im Grafikprozess). Gehört zur parallelen Klärung der Beobachtungen
  (Glühwürmchen beim Einflug, Flackern), hier kein Ticket.
- **Finale → Epilog 67–84 ms, Epilog → Menü 50 ms** («ohne Script»): Grafikprozess beim Einblenden der Bühne; der
  Handy-Durchlauf misst das Finale nicht. In der Schlussabnahme beobachten (13).

*Ersatzmass bewertet:* Es bildet die Zeichenzeit **nicht** ab. Auf der T2000 im selben Bild verglichen
(Handy-Emulation, Level): Ersatzmass Median 11–18, p95 13–26 ms; GPU-Zeit (Timer) 5,8–8,5 ms; Dauerlast 3,3–5,5 ms
je Bild. Ersatzmass p95 = 3–6,6 × Dauerlast. Es enthält die CPU von `frame()`, den Weg zum Grafikprozess und alles,
was dort schon wartete (frühere Bilder, Uploads, Zusammensetzen der Seite). Auf dem Poco widerlegt es sich selbst:
60 gezeichnete Bilder/s mit p95 16,6 ms sind mit 31–59 ms GPU-Zeit je Bild nicht möglich. `fenceSync` ohne Warten
taugt nur als «fertig bis zum nächsten Bild ja/nein» (gemessen 6–20 ms, Auflösung eine Aufgabe). Besseres Mass:
**Dauerlast** (20 Bilder in einer Aufgabe zwischen zwei `readPixels`, Zeit je Bild); auf der T2000 trifft es die
GPU-Zeit (Timer) auf 0,1–1 ms, und durch **Weglassen** einzelner Durchgänge lässt es sich auf dem Poco selbst
zerlegen. → **08**.

*8-ms-Marge (Poco):* Mit dem Ersatzmass nicht zu beurteilen. Zeichenzeit pro Abschnitt laut Karte: Prolog 12,1 ms
(1 Bild/s, nichts wartete), Spiel 33, Reise 31, Spiel n. Reise 46, Einstieg 59, Menü 58 ms (mit Uploads). Mit dem
Verhältnis Ersatzmass/Dauerlast der T2000 (p95 3–6,6) zurückgerechnet liegt die Dauerlast des Poco grob bei 7–13 ms,
also um die Marge herum. Was am meisten bringt (T2000 mit den Einstellungen des Handys, Anteil an der Dauerlast):
**Spiegelung 40–60 %**, Bloom 20–30 %, Panorama-Netz 7–33 % (Wüste), Pinsel unter 5 %, Final unter 10 %. → **11**,
nach den Zahlen aus 08.

*Notizen der Spec:*

| Notiz | Urteil |
|---|---|
| Bloom (64/16 Abtastungen) | überführt in 11 (20–30 % der Zeichenzeit), Kandidat 2 |
| Spiegelung | überführt in 11, grösster Anteil (40–60 %); `dimmed`/`Color.clone()` in 06 erledigt; «nur jedes zweite Bild» nicht ohne Vergleich auf dem Poco |
| Pinsel (Strand) | verworfen: 0,15–0,2 ms |
| HD-Himmel, Grafikspeicher | verworfen für Chrome (nur Desktop; das Handy lädt nur den Grundteil mit 43–54 MB); Safari siehe unten |
| Panorama-Netz 512 × 256, doppelseitig | überführt in 11 für die Wüste (525 825 Ecken, bis 33 %); sonst 7–10 %, verworfen |
| Staub 1600/700 | verworfen: im Level ungedrosselt flüssig; bei Bedarf in 11 per Weglassen nachmessen |
| `cullInstances` | erledigt in 06 |
| Menü-Blur | Chrome: verworfen (Menü auf dem Poco p95 16,6 ms); Safari: Ticket 12 |
| Startbildschirm-CSS | verworfen: Poco Startbildschirm max 17,0 ms, 0 gezeichnet |
| Erstes Zeichnen einer Skybox 50–120 ms | überführt in 09 (Aufbau während der Fahrt, `compileParallel`, Fische) |
| «Spiel → Übersicht» 87 ms | verworfen: jetzt 17–50 ms (Desktop einmal 50, Handy-Emulation 17); in 13 beobachten |
| Hall-Convolver | verworfen: läuft auf dem Audio-Thread, in keinem Profil und auf keiner Karte sichtbar |
| Offene Punkte aus 02–06 | schwarzes Bild beim Umbau der Auflösung: entfällt, solange auf Poco und Desktop keine Absenkung greift; Start der 3. Prolog-Fahrt, Glühwürmchen in den Pausen: parallele Klärung; gröbere Ladestücke auf schwachen Geräten: 09; Spiegelung jedes zweite Bild: 11; ausfallendes Bild in der offenen Übersicht: nicht mehr gesehen (still 10/s, max 17,2–17,4 ms) |

*Safari (iOS, nicht geprüft):* Texturen: Handy und iPad laden nur den Grundteil (4096 × 2048, Tiefe 1024 × 512,
Wassermaske 4096 × 228), nichts über 4096; die HD-Streifen (4096 × 3413/3823) nur auf dem Desktop (Mac-Safari), auch
dort nicht über 4096. Grafikspeicher je Skybox: Handy 43–54 MB (Register `gpuMB`), mit Render-Targets (HalfFloat
784 × 1478) und zwei Himmeln während der Überblendung grob 150 MB; Mac-Safari mit HD 214–242 MB je Skybox, beim
Überblenden zwei. SVG-Filter: Leuchten im Menü über die ganze Fläche des Menüs (in Safari auf der CPU) → **12**;
Fächer des Startbildschirms (`feGaussianBlur` 1,6, kleine Fläche) und `drop-shadow` am pulsierenden Punkt der Bühne:
klein, kein Ticket.

*Neue Tickets:* 08 Zeichenzeit ohne Halt (Dauerlast), 09 lange Einzelbilder beim Aufbau, 10 Seitenstart in Stücken,
11 Zeichenzeit unter die Marge, 12 Leuchtfilter im Menü (Safari), 13 Schlussabnahme. Empfohlene Reihenfolge: 08 und
09 parallel (verschiedene Stellen in `index.html`), 10 danach (berührt `compileParallel` wie 09), dann Handy-Durchlauf
2b mit 08 (Empfehlung, Entscheid Koordinator), 11 nach dessen Zahlen, 12 jederzeit, 13 zuletzt. Ticket 07 bleibt
offen, den Abschluss macht der Koordinator.

**Beobachtungen Handy-Durchlauf 2 (Diagnose, 01.11.2026, Branch `leistung/07-beobachtungen` ab `c42423e`):**

Gemessen im echten Chrome mit Fenster und GPU (Quadro T2000) in Handy-Emulation (393 × 873, DPR 2,75, Android-Kennung,
Touch), ungedrosselt und 4× gedrosselt, dazu auf dem Desktop maximiert. Vorher = 01c (`2455277`), nachher = `c42423e`.
`index.html` blieb unverändert. Ein Skript vor dem Laden protokolliert grosse WebGL-Uploads (`texStorage2D`,
`texSubImage2D` mit Zeit), gezeichnete WebGL-Bilder, rAF-Abstände über 25 ms, long-animation-frames und den Zustand
der Bühne (`stillBild`, `waitTap`, Fahrt, Klassen von `#story`). Dazu kommen ein Trace (GPU-Prozess,
`FrameSequenceTrackerV3` mit fehlenden Kacheln) und ein Screencast jedes Bildes. Je Bild werden Helligkeit, Änderung
und «anders als beide Nachbarn» gemessen. Gefahren wie ein neuer Spieler: Start, Menü, Leicht, dann der Prolog mit
2,5 s Lesezeit je Bild bis zum Angebot. «P» = Sekunden ab dem Öffnen der Bühne. Skripte und Bilder liegen im Scratchpad
des Agenten (`07-beob/`: `prolog.mjs`, `auswerten.mjs`, `gpu-stalls.mjs`, `checker.mjs`, `fenster.mjs`, `fische.mjs`,
`blatt.mjs`).

Zuordnung der Poco-Zeiten: Seitenstart, Startbildschirm (253 Bilder) und Menü (257) ergeben einen Prolog-Beginn bei
9–10 s. Damit liegt 21,4 s bei P ≈ 12, in Einstellung 2 «Jeden Abend steigt Noa …», der ersten mit Noa. 50,4 s liegt
bei P ≈ 41, am Ende von Einstellung 6 «Denn Licht lässt sich weitergeben …», wo die Glühwürmchen das Licht in den Wald
tragen. Die Lesezeit des Nutzers ist unbekannt, die Zuordnung stimmt also nur auf ±1 Einstellung.

Wichtig für die Karte: **«ohne Script» belegt nicht, dass der Grafikprozess hängt.** Im Trace dauern die gestaffelten
Schritte der Bühne (`setTimeout` → `stelle`/`ebeneAnlegen`) bei 4× als `TimerFire`/`FunctionCall` 30–70 ms. Der
long-animation-frame dazu meldet trotzdem `scripts: []`, weil Chrome die Timer des Modul-Skripts nicht zuordnet. Ein
Bild «ohne Script» kann also Script im Hauptthread sein oder Rastern im GPU-Prozess.

1. **Fische «ein wenig pixelig»: ein alter Mangel, nicht durch dieses Vorhaben.**
   - **Ursache:** Was unter Wasser schwimmt, zeichnet `waterSurface` vorher in ein eigenes Bild (`under.target`). Auf
     dem Handy ist es halb so gross wie das Bild und ohne MSAA (`size.multiplyScalar(IS_MOBILE ? 0.5 : 1)`,
     `samples: … !IS_MOBILE`, seit `7c78158` vom 15.10.). Auf dem Poco (Rendern 784 × 1478) sind das 392 × 739 Pixel,
     ein Texel deckt 2,75 × 2,75 Bildschirmpixel. An den Kanten der schmalen Fische entstehen Treppen, die
     Schwanzlinien zerfallen in Punkte.
   - **Beleg:** Strand mit `?t=12` und `zeige(0)` in der Handy-Emulation, gleiche Stelle. 01c und `c42423e` sind
     **pixelgleich** (mittlere und grösste Abweichung 0, im ganzen Bild und im Ausschnitt der Fische). Beide rendern mit
     786 × 1746, Pixelverhältnis 2 und `adaptiv 1`.
   - **Kandidaten aus dem Vorhaben scheiden aus:** Ticket 03 betrifft nur scharfes Bild und Streifen des Panoramas. Die
     Fische sind 3D, liegen über dem Grund und hängen nicht an der Vorschau. Ticket 06 ändert an `renderReflection` nur,
     dass die Spiegelung ohne Platte im Bild entfällt, und zeichnet nur im Menü mit 10/s. Im Spiel ohne Bewegung
     zeichnet die Szene wie vorher mit 30/s (`idleFps`; «Spiel n. Reise» 38 gez/s).
   - **Gegenprobe:** eine Kopie mit vollem `under.target` auf dem Handy. Die Kanten sind glatt, die Schwanzlinien
     durchgehend. Unterschiede gibt es nur im Ausschnitt der Fische (2,1 % der Pixel > 8), sonst ist das Bild gleich
     (0,06 %).
   - **Vorschlag:** `under.target` auf dem Handy in voller Grösse (oder 0,75), weiter ohne MSAA. Unter Wasser liegen
     nur die Fische, der Pass ist billig.
   - **Abnahme:**
     - Ausschnitt der Fische in der Handy-Emulation nebeneinander ohne Treppen (wie die Gegenprobe).
     - Zeichenzeit im Abschnitt «Spiel n. Reise» (Handy ×4, Ersatzmass) höchstens 0,5 ms über vorher.
     - Auf dem Poco sind die Fische bei normalem Abstand nicht pixelig, die Karte zeigt `adaptiv 1.00, Umbauten 0`.

2. **Glühwürmchen: kurzer Moment, als sie in den Wald flogen.**
   - **Ursache:** Die Flüge der Glühwürmchen laufen als JavaScript pro Bild (`zeichne` setzt den Ort jedes
     Glühwürmchens im Flug). Seit Ticket 04 ist jedes Glühwürmchen ein eigener kleiner Compositor-Layer. Jede Änderung
     kostet deshalb im Hauptthread Style, Paint und vor allem **Layerize** (`PaintArtifactCompositor::Update`).
   - **Messung:** Hauptthread pro Bild je Einstellung, Handy ×4:

     | Einstellung | `BeginMainFrame` p50 / p95 | Layerize p50 |
     |---|---|---|
     | 1 «Hoch oben in den Bergen …» | 13,7 / 28,0 ms | 0,0 ms |
     | 5 «Da blinkt es …» (Sammeln) | 24,5 / 49,3 ms | 5,1 ms |
     | **6 «Denn Licht …» (Tragen in den Wald)** | **29,1 / 52,8 ms** | **6,3 ms** (p95 14,2) |

     Nach dem Halt von Einstellung 6, solange die Glühwürmchen noch einparken, gibt es Ausreisser bis 133 ms.
     Ungedrosselt ist Layerize dort p50 0,7 ms und p95 1,7 ms, in den anderen Einstellungen 0. Die Bilder über 33 ms des
     4×-Laufs ballen sich in P 30–43 (Einstellungen 5 und 6). Dazu passt das Bild von 49,5 ms bei 50,4 s auf dem Poco.
   - **Seit wann:** In 01c war jedes Bild teuer und überall gleich (Einstellung 6 p50 39,3 ms, Layerize 8,8 ms). Seit
     Ticket 04 ist der Flug der Glühwürmchen die teuerste Stelle des Prologs, darum fällt er jetzt auf.
   - **Laden in den Pausen ist es nicht:** Die grossen Uploads (scharfes Bild 4096 × 2048, 16 Streifen) fallen in die
     Pausen nach den Einstellungen 1–3 (ungedrosselt bei P 8, ×4 bei P 15–20). Beim Sammeln und Tragen laufen keine
     Uploads mehr, und hinter der Bühne zeichnet WebGL in den Pausen 4–6 nichts.
   - **Vorschlag:** Den Flug der Glühwürmchen wie die Kamerafahrt als Web Animation vorab berechnen: Keyframes je
     Glühwürmchen für Sammeln und Tragen, nach der Zeit der Bühne mit `speed`. Dann laufen im Flug weder JavaScript noch
     Layerize pro Bild. Alternative: Im Flug alle Glühwürmchen in einem gemeinsamen Layer bewegen.
   - **Abnahme:**
     - Handy ×4, Einstellungen 5 und 6: `BeginMainFrame` p50 nicht über dem Wert von Einstellung 1, Layerize p95 unter
       1 ms, kein rAF-Abstand über 50 ms im Flug.
     - Bahnen nebeneinander gleich (Screencast).
     - Poco: Prolog max ≤ 33 ms in Einstellung 6.

3. **Kurzes Flackern des ganzen Bildes in der ersten Noa-Szene.**
   - **Im Screencast nicht nachgestellt:** Kein Bild weicht von beiden Nachbarn ab, kein Helligkeitssprung, weder Handy
     ungedrosselt (2614 Bilder) noch Handy ×4 (2652) noch Desktop (2735). Die Überblendung Menü → Bühne verläuft stetig
     (Helligkeit 32 → 18 → 21, siehe Kontaktbogen).
   - **Ausgeschlossen:** Kein Umbau (`adaptiv 1`), also kein schwarzes Bild. WebGL zeichnet hinter der gedeckten Bühne
     nur in den Pausen (10–21 Aufrufe) und ist dabei verdeckt. `gehalten` und `buehneFrei` blenden sauber aus 0 ein.
   - **Wahrscheinlichste Ursache: fehlende Kacheln der Bühnen-Ebenen** («checkerboarding»). Seit Ticket 04 fahren die
     sechs grossen Ebenen als Transform-Animation im Compositor. Während einer solchen Animation zeigt Chrome ein Bild
     auch dann, wenn eine Ebene nach einer neuen Skalierung noch nicht fertig gerastert ist. Neu skaliert wird beim
     Start einer Fahrt und beim gestaffelten Neurastern mit neuen Strichbreiten `--rs` nach dem Halt. An diesen Stellen
     fehlt die Ebene für ein oder mehrere Bilder.
   - **Beleg aus dem Trace** (`FrameSequenceTrackerV3`, Feld `checkerboarded`):
     - 01c, Handy ×4: **0 Bilder mit fehlenden Kacheln** im ganzen Prolog.
     - `c42423e`, Handy ×4: gehäuft beim Öffnen der Bühne (P 0,03–0,8: 9, 3, 3 und 3 Bilder), in den Einstellungen 1–3
       je 1–4 Bilder pro Fenster.
     - `c42423e`, Desktop 4K: in jeder Fahrt und Pause, 19–24 Bilder je 5-s-Fenster in den Einstellungen 1–2, bis 275 in
       den Einstellungen 5–6.
   - **Raster-Hänger im GPU-Prozess** (`RasterDecoderImpl::DoEndRasterCHROMIUM`): 25–36 ms beim Öffnen der Bühne,
     25–31 ms beim gestaffelten Neurastern 0,8–0,9 s nach dem Halt von Einstellung 1, bis 43 ms in den Fahrten der
     Einstellungen 2–3. Gemessen ist das auf dem Quadro. Das Adreno 730 rastert die gleiche Pixelzahl (DPR 2,75)
     deutlich langsamer.
   - **Folgerung für das Poco:** Dort fehlt öfter und länger eine ganze Ebene (Himmel, Berge, Hügel). Vor dem fast
     schwarzen Hintergrund der Bühne (`#020208`) sieht das wie ein Flackern des ganzen Bildes aus. Der Raster-Hänger
     erklärt auch das Bild von 98,8 ms bei 21,4 s (Einstellung 2, «ohne Script, Rendern 4 ms»: der Hauptthread wartet
     auf das Bild).
   - **Seit wann:** Die Hänger beim Öffnen der Bühne gab es schon in 01c (27–47 ms). Die fehlenden Kacheln sind neu durch
     Ticket 04. Auf dem Desktop sieht man sie im Screencast nicht, weil sie dort im dunklen Himmel liegen.
   - **Vorschlag ohne Qualitätsverlust:** Solange eine Ebene sichtbar fährt oder steht, nie ihre Rasterskala ändern
     und sie nicht neu zeichnen lassen. Dafür gibt es zwei Wege:
     - Das Neurastern (nächste Fahrt vorbereiten, Strichbreiten des Ruhepunkts) in einer unsichtbaren Kopie der Ebene
       erledigen und erst tauschen, wenn sie gerastert ist (zwei Bilder später).
     - Die Strichbreiten nicht je Ruhepunkt ändern, sondern in der Rasterskala der Fahrt festhalten. Dann wird nach dem
       Halt nichts neu gerastert.

     Beim Öffnen der Bühne die gehaltene Ebene genau in der Skalierung der ersten Fahrt halten. Heute rastert sie beim
     Öffnen 25–47 ms nach.
   - **Abnahme:**
     - Trace des Prologs (Handy ×4 und Desktop): `checkerboarded` = 0 in allen `FrameSequenceTrackerV3`-Fenstern.
     - Kein `DoEndRasterCHROMIUM` über 16 ms während einer Fahrt oder in den ersten 2 s nach dem Halt.
     - Screencast weiterhin ohne Ausreisser.
     - Poco: kein Flackern in den Einstellungen 1–2, Prolog max ≤ 33 ms.
     - Bleibt das Flackern auf dem Poco danach bestehen: dort über `chrome://inspect` mit Screencast nachfilmen (in der
       Emulation nicht nachstellbar).
