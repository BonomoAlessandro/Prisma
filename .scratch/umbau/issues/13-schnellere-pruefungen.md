# 13: Schnellere Prüfläufe

**Spec:** ../spec.md

**Status:** umgesetzt, wartet auf Review

**Blocked by:** 01, 02 (Review fertig, in `feature/umbau`)

**What to build:** Die Prüfungen nach jedem Schritt dauern zu lange (16.11.2026: drei Agenten standen stundenlang an der
Sperre von `tools/leise.sh`). Der Nutzer hat entschieden (16.11.2026), sie zu beschleunigen, **ohne weniger zu prüfen**:

- [x] Zuerst den Rest von Ticket 02: `tests/bildvergleich.mjs` holt das Spiel über `tools/spielserver.mjs` (siehe
      Ticket 02, «Für den Bildvergleich»), läuft so gegen `dist/` und ist dort grün (ohne `--write`).
- [x] `tools/leise.sh` kennt zwei Arten von Läufen:
      - **leicht** (`LEISE_ART=leicht`): Läufe ohne Messung von Zeiten (Bildvergleich, Golden, Node-Tests, `brett-probe`,
        `offline.mjs`, `screenshot`, Werkzeuge). Bis zu `LEISE_LEICHT_MAX` (Standard 4) gleichzeitig.
      - **allein** (Standard, wie heute): Läufe mit Bildzeiten oder Messungen (`leerlauf-probe`, `ruhetakt-probe`,
        `buehne-messung`, die Lückenmessung der `geschichte-probe`, `start-probe`, `spiegel-probe messen` …). Ein
        alleiniger Lauf startet erst, wenn kein leichter mehr läuft, und während er läuft, startet keiner.
      - Vorrang (`LEISE_VORRANG`), verwaiste Sperren, Priorität «Leerlauf» und `LEISE_CPU` bleiben wie heute; ein
        wartender alleiniger Lauf darf nicht endlos von leichten überholt werden.
      - Tabelle im README: welcher Lauf welche Art ist.
- [x] (`--jobs` umgesetzt, bringt hier nichts; das Ziel erreicht der GPU-Weg, siehe Comments) `tests/bildvergleich.mjs` läuft seine Abläufe und Grössen parallel (z. B. `--jobs n`, Standard sinnvoll für 12
      Kerne), mit demselben Ergebnis wie seriell; die Laufzeit messen und angeben (Ziel: um 10 min statt knapp 30).
- [ ] (fast ganz, siehe Comments) Prüfen: fünf parallele Läufe des Bildvergleichs grün; ein leichter Lauf neben einem anderen leichten ändert kein
      Ergebnis; ein alleiniger Lauf (z. B. `ruhetakt-probe`) wird nicht gestört (startet nie neben einem leichten).
- [x] Regel für die Agenten in `CLAUDE.md` bzw. README festhalten: Umsetzer lassen nur die schnellen Prüfungen laufen
      (Node-Tests, Golden, Bildvergleich, dazu die Proben, die ihr Ticket direkt betrifft); der Reviewer lässt den ganzen
      Satz einmal laufen, die Proben mit Zeitmessung nur er. Wackelt ein paralleler Lauf (Zeitüberschreitung, Flake),
      zurück zum alleinigen Lauf.
- [x] Bildvergleich bekommt eine vierte Grösse «poco» (Android-Kennung, Pixeldichte 2,75) mit `start`, `dorf` und
      `welt-1-2`, damit der Weg der echten Handys (Massstab `SEITE`, Pixelverhältnis 2) geprüft wird (Fund Review 01).
- [x] Regel für die Proben mit Bildtakt: Eine einzelne Lücke über 100 ms kommt auf diesem Rechner schon auf der Basis
      vor. Bei so einem Fehler die Probe wiederholen bzw. mit der Basis vergleichen; es zählt nur ein Fehler, der auf
      der Basis nicht kommt (Fund Review 01). In README bzw. `CLAUDE.md` festhalten.
- [x] Bildvergleich über die Grafikkarte (`GPU=1` oder `--gpu`), Entscheid des Nutzers 17.11.2026: eigene Referenzen
      (`tests/bildvergleich/referenz-gpu/`) und eigene Toleranz, wenn die GPU-Läufe untereinander stabil genug sind;
      Schärfe mit einer absichtlichen kleinen Änderung prüfen. Der Umsetzer nimmt den GPU-Weg, der Reviewer SwiftShader.
      Nach einem Treiberupdate die GPU-Referenzen erst neu schreiben, wenn SwiftShader grün bestätigt hat.

## Comments

### Umsetzung (16./17.11.2026, Branch `ticket/umbau-13`)

**Gemacht** (je Schritt ein Commit):

1. **Bildvergleich gegen `dist/`** (`b07cef8`): `tests/bildvergleich.mjs` holt das Spiel über `spielServer()`. Erster
   ganzer Lauf: alle 66 Bilder grün (grösste Abweichung 3), rot nur wegen einer 404 in der Konsole: Chrome fragt auf
   `favicon.svg` (dort setzt der Test den Stand) von sich aus nach `/favicon.ico`. Der Spielserver antwortet darauf
   jetzt leer (204). Danach `--nur start` in allen Grössen grün. Referenzen unverändert, kein `--write` an ihnen.
2. **`leise.sh` mit zwei Arten** (`b19ae19`): `LEISE_ART=allein` (Vorgabe, Ablauf genau wie bisher) und `leicht` (bis
   `LEISE_LEICHT_MAX`, Vorgabe 4). Die leichten halten die bestehende Sperre `/tmp/prisma-leise.lock` **gemeinsam**:
   Der erste legt sie an (Datei `art`), jeder trägt sich als `leicht.<pid>` ein, in `pid` steht immer ein lebender
   von ihnen (Übergabe beim Austreten, atomar über `mv`), der letzte räumt sie weg. Darum wartet auch eine alte Kopie
   von `leise.sh` auf sie, ohne etwas von leichten Läufen zu wissen (ein alter Lauf zählt als alleiniger). Ein leichter
   Lauf lässt jedem wartenden alleinigen mit gleicher oder kleinerer Zahl `LEISE_VORRANG` den Vortritt, einen mit
   grösserer Zahl überholt er höchstens `LEISE_FRIST` Minuten (Vorgabe 10). Wartende leichte tragen sich nirgends ein,
   Marken anderer Läufe lesen sie nur. Verwaist ist eine Sperre erst, wenn auch kein leichter Lauf darin mehr lebt.
   `LEISE_SPERRE`/`LEISE_WARTE` biegen die Pfade um (für den Test). `tests/leise.test.mjs` (in `npm test`, 27
   Prüfungen, etwa 20 s, nur eigene Pfade): 6 leichte mit Höchstzahl 4 (genau 4 gleichzeitig), alleiniger nie neben
   leichten und nicht überholt, Vorrang und Frist, alleinige nacheinander nach Vorrang, verwaiste Sperren (tote
   Gruppe, toter Halter mit lebendem Mitglied: kein Übernehmen), falsche Argumente. Gegenproben: Mit absichtlich
   kaputter Höchstzahl, ohne Vortritt und mit altem Begriff «verwaist» wird er rot. Verträglichkeit mit der alten
   Kopie (alte `leise.sh` mit umgebogenen Pfaden, nur in eigenen Ordnern): alter alleiniger wartet auf zwei neue
   leichte, auch nach der Übergabe des Halters; neuer leichter wartet auf alten alleinigen. Tabelle der Arten im README.
3. **`--jobs`** (`d23df0b`): je Grösse und Ablauf ein Teilprozess (das Skript selbst mit `--teil`), alle vom Server des
   Hauptprozesses, die längsten zuerst. Dazu nötig für gleichzeitige Läufe: `spielServer()` baut je Prozess in einen
   eigenen Temp-Ordner statt nach `dist/` (ein Bau leert seinen Ordner, während ein anderer Lauf daraus liefert),
   ebenso `offline.mjs`; Chrome wählt seinen Port selbst (`--remote-debugging-port=0`, `DevToolsActivePort`; der
   Zufallsport 9300–9799 wäre bei vielen Chrome zusammengestossen), auch in `offline.mjs` (`d99702d`). Und zwei
   Stellen, an denen der Vergleich unter Last rot wurde (siehe Abweichungen): Die Bühne von Prolog und Epilog wird erst
   eingefroren, wenn ihre Tweens fertig sind und die Liste ihrer Texturen 4 s gleich bleibt.
4. **Grösse «poco»** (`a3b5f80`): 393 × 873, Pixeldichte 2,75, Android-Kennung, Touch; nur `start`, `dorf`,
   `welt-1-2`. Der Lauf prüft, dass `SEITE` greift (Klasse `seite`) und der Renderer Pixelverhältnis 2 hat. 11 **neue**
   Referenzen mit `--write --groesse poco` (2,7 MB, Bilder in Gerätepixeln 1081 × 2401); die 66 bestehenden blieben
   unberührt (git: nur neue Dateien). Laufzeit allein gut 6 min.
5. **Regeln** (`2e3b7a0`): README (Abschnitt Tests: Tabelle der Arten, Regeln für Umsetzer und Reviewer, Proben mit
   Bildtakt) und `CLAUDE.md` (Abschnitt «Prüfläufe»).

Nachträge: `fe2db43` (Geduld 3 × in jedem Lauf, Zeitrahmen 180 min), `87d7000` (Ausweg «fast ruhig», siehe unten).

**Laufzeiten des Bildvergleichs** (12 logische Kerne, `LEISE_CPU=100`; die drei alten Grössen, 66 Bilder):

| Lauf | Zeit | Ergebnis |
|---|---|---|
| nacheinander (`--jobs 1`) | 27 min 0 s | 66 grün (rot nur wegen der 404, behoben) |
| `--jobs 2` | 29 min 20 s | rot `handy-prolog` (Bühne zu früh eingefroren, behoben) |
| `--jobs 4` | 29 min 14 s | grün |
| `--jobs 6` | 19 min 41 s | rot: 3 Desktop-Abläufe Zeitüberschreitung (abgebrochen, darum kürzer), `quer-epilog` |

Mit «poco» (77 Bilder) allein 35 min 13 s.

Messung dazu: Ein einzelner Lauf lastet die Maschine schon zu 74 % im Mittel aus (oft 90–100 %), ein Desktop-Chrome
rechnet mit rund 4,5 Kernen. SwiftShader verteilt das Rendern selbst auf alle Kerne; die Arbeit ist rechengebunden
(Laden der Himmel Bild um Bild, Reise Wüste → Vulkan seriell 190 s, mit 4 Prozessen 728 s). Mehr Prozesse teilen nur
dieselben Kerne. **Das Ziel «um 10 min» ist mit parallelen Abläufen auf diesem Rechner nicht erreichbar**; `--jobs`
bleibt als Option, Vorgabe 1.

**Prüfung «parallel»** (über die neue `leise.sh`, alle `LEISE_VORRANG=2`; parallel arbeitete Ticket 03 mit seiner
alten Kopie und vielen alleinigen Läufen):

- Fünf ganze Bildvergleiche (`LEISE_LEICHT_MAX=5`). Wirklich gleichzeitig wurden es höchstens drei, denn 03 reihte
  ständig alleinige Läufe mit gleichem Vorrang ein, und ein leichter tritt dann nicht mehr ein (so gewollt):
  - `bv2` allein in der Gruppe: 35 min 13 s, 73 Bilder Abweichung 0, aber `poco-start` und `poco-dorf-uebung-2`
    «Ansicht wird nicht ruhig» → Ausweg `87d7000`.
  - `bv1` und `bv3` gleichzeitig (Stand vor `87d7000`): beide **grün**, 63 min 15 s bzw. 64 min 13 s; die 66 alten
    Bilder Abweichung 0, «poco» im Dorf höchstens 6 (17 von 2,6 Mio. Pixeln).
  - `bv4` und `bv5` gleichzeitig (mit `87d7000`), dazu `offline.mjs` als dritter leichter Lauf: beide **grün**,
    74 min 35 s bzw. 75 min 43 s; die 66 alten Bilder Abweichung 0, «poco» im Dorf höchstens 6; «fast ruhig» kam nicht
    vor.
  - Zusammen: 4 von 5 ganzen Läufen grün, der fünfte (`bv2`) rot nur an «nicht ruhig» bei poco (vor `87d7000`).
- Leichter neben leichtem ändert kein Ergebnis: siehe `bv1`/`bv3` (je pixelgleich), `bv4`/`bv5`.
- Alleiniger nicht gestört: `ruhetakt-probe` (Vorgabe, `GPU=1`) eingereiht, während `bv1`/`bv3` liefen; sie meldete
  «warte auf laufende leichte Läufe», lief von 1794897138 bis 1794897213 (Unix-Zeit), also nach dem Ende von `bv1`
  (…94165) und `bv3` (…94222), und `bv4`/`bv5` starteten erst danach (…97215, …97216), obwohl sie schon seit Stunden
  warteten. **OK** (Ruhe 28,5 Bilder/s bei 57).
- `offline.mjs`: neben `bv4`/`bv5` (drei leichte Läufe) waren alle 32 bis dahin geprüften Punkte ok, dann griff die
  Notbremse des ganzen Tests (30 min): nur zu langsam unter dreifacher Last. Nach der Regel allein wiederholt
  (17.11., im Lauf des GPU-Versuchs, aber nach den GPU-Läufen): **bestanden**, 36 Prüfungen, 11 min 42 s.

**Abweichungen und Funde:**

- **Ziel 10 min nicht erreicht** (siehe oben). Mögliche Hebel für später, alle ausserhalb dieses Tickets: weniger
  Bilder in SwiftShader während des Wartens (das Spiel zeichnet beim Laden der Himmel jedes Bild voll), oder Abläufe
  ohne Neuladen der Himmel. Beides ändert die Prüfung, darum nicht hier.
- **Zwei schwache Stellen des Bildvergleichs unter Last** gefunden und im Test behoben (nur im Test, das Spiel
  unverändert): (1) Prolog und Epilog wurden eingefroren, solange die Bühne noch rasterte bzw. Noas Arm und Lampe sich
  noch bewegten (`quer-epilog` mit 161 Pixeln um bis 36, `handy-prolog` mit 402 Pixeln um bis 10, gröbere Textur der
  vorderen Ebene). Jetzt wartet der Test auf leere `scene.tweens` und eine 4 s gleiche `scene.gl.liste()`; seriell
  danach alle 30 Bilder von `dorf` und `welt-5-6` in drei Grössen Abweichung 0. (2) Die festen Wartegrenzen (240 s)
  reichten neben anderen Chrome nicht; jetzt dreifach (nur Sicherheitsnetz).
- **«poco» wackelt im Kleinen:** Im Lichtstreifen quer durch den Titel des Startbildschirms wechselt ein Fleck (8 × 6
  Gerätepixel, höchstens 5 von 255) von Bild zu Bild zwischen zwei Zuständen; so wurden zwei Aufnahmen manchmal nie
  byte-gleich. Gegen die Referenz sind beide Zustände grün (21 Pixel, Grenze bei poco 260). Ausweg: Nach 7 Aufnahmen
  gilt eine Ansicht auch als ruhig, wenn die letzten zwei innerhalb der Toleranz des Vergleichs liegen; der Lauf meldet
  das («fast ruhig»). Ursache im Spiel nicht gesucht (nur mit Pixeldichte 2,75, vermutlich Raster des Compositors).
- **`offline.mjs`** war schon allein knapp (Review 02: Eishöhle 382 von 400 Versuchen); in meinem ersten Lauf (allein
  in der Gruppe) scheiterte er an «online desert bereit». Grenze je Himmel jetzt 1200 Versuche, ganzer Test 1800 s.
- **Vorrang zwischen gleichrangigen alleinigen** bleibt wie bisher ohne Reihenfolge: Hängt ein Agent alleinige Läufe
  direkt aneinander, gewinnt er das Rennen um die freie Sperre meist (meine `ruhetakt-probe` wartete so 1 h 50 min
  hinter 03). Nicht geändert, weil die alte Kopie dieselbe Regel hat.
- `brett-probe` steht laut Ticket bei den leichten, prüft aber auch Lücken unter 100 ms (`mechanik`, `reise`);
  gelassen, die Regel für Proben mit Bildtakt gilt auch für sie.
- Die Höchstzahl gilt je Lauf: Vier leichte mit `LEISE_CPU=50` können zusammen über 50 % der Maschine nehmen. Wo das
  stört, `LEISE_LEICHT_MAX=1` (README).
- `npm test` enthält jetzt `leise`.

### GPU-Weg (Auftrag vom 17.11.2026, Entscheid des Nutzers)

**Gemacht** (`git log`: «Bildvergleich über die Grafikkarte»): `--gpu` oder `GPU=1` startet Chrome mit
`--use-angle=d3d11 --enable-gpu --force_high_performance_gpu` (neue Option `hochleistung` in `tools/chrome.mjs`, nur
der Bildvergleich nutzt sie). Referenzen in `tests/bildvergleich/referenz-gpu/` (77 JPEG, 8,4 MB), Ausgabe in
`tests/output/bildvergleich-gpu/`, eigene Toleranz `TOLERANZ_GPU`. Je Sitzung liest der Lauf
`WEBGL_debug_renderer_info` und bricht ab, wenn es nicht die NVIDIA ist (`PRISMA_GPU=<Muster>` für eine andere Karte).
Höchstens zwei GPU-Bildvergleiche zeichnen gleichzeitig (Plätze im Temp-Verzeichnis, verwaiste werden frei); in
`leise.sh` bleibt er «leicht», alleinige Läufe mit Zeitmessung warten ohnehin. Der Vergleich der JPEG rechnet weiter
in SwiftShader (ohne Einfluss). `referenz/` blieb unberührt.

**Welche Karte:** Ohne `--force_high_performance_gpu` nimmt headless Chrome die eingebaute **Intel UHD Graphics 630**
(`ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 …)`), mit dem Flag die **NVIDIA Quadro T2000**
(`ANGLE (NVIDIA, NVIDIA Quadro T2000 (0x00001FB8) Direct3D11 vs_5_0 ps_5_0, D3D11)`). Alle GPU-Läufe unten meldeten in
jeder Sitzung die NVIDIA.

**Läufe** (alle über `leise.sh`, leicht, ohne anderen leichten Lauf daneben; 77 Bilder in vier Grössen):

| Lauf | Zeit | gegen Lauf 1 |
|---|---|---|
| 1 (`--gpu --write`) | 7 min 48 s | schreibt `referenz-gpu/` |
| 2 | 7 min 45 s | 75 Bilder bitgleich; `desktop-welt-5-nach` höchstens 3 (0 Pixel darüber); `quer-welt-5-nach` 47 Pixel (0,014 %) um bis 6 |
| 3 | 7 min 45 s | genau wie Lauf 2 (dieselben Bilder, dieselben Zahlen) |
| 4 (mit `TOLERANZ_GPU`) | 7 min 44 s | wieder genau so; **grün** |

Die Abweichung liegt an wenigen Sternpunkten neben dem Saturn im gelösten Bild der Planeten (x 640–690, y 95–110 bei
844 × 390). Läufe 2–4 sind untereinander gleich, Lauf 1 (der erste nach dem Kaltstart der Karte) wich dort ab. In jedem
Lauf einmal «fast ruhig» bei `poco-welt-2-vor` (zwei Aufnahmen höchstens 1 auseinander). Zum Vergleich SwiftShader:
35 min für dieselben 77 Bilder, also gut viermal so lang.

**Toleranz:** `TOLERANZ_GPU` = Pixel über 3, Anteil 0,03 % (SwiftShader 0,01 %): Faktor 2 über dem gemessenen
Rauschen. Die Pixelschwelle bleibt 3, damit kleine Farbänderungen nicht verschwinden.

**Schärfe:** Vulkan-Brett (`tint` des Basalts in `backgrounds/skies.js`) 2 % heller wie im Review 01, Lauf
`--gpu --groesse handy --nur welt-3-4`: **rot** in `handy-welt-4-vor` (1,106 %, bis 13) und `handy-welt-4-nach`
(1,079 %, bis 11), also rund 37-mal über der Grenze; Wüste, Menü, Übersicht grün. Danach `git checkout`, `cmp` gegen
die Kopie von vorher: gleich, `git status` sauber. Nicht geprüft: eine Farbänderung von 2 % an den Spiegeln, die in
SwiftShader nur 0,032–0,123 % der Pixel traf (Ticket 01); sie läge auf der GPU teils nahe an 0,03 %. Für so feine
Änderungen bleibt SwiftShader die genaue Prüfung.

**Regeln** (README, Abschnitt Tests, und `CLAUDE.md`): Der Umsetzer nimmt den GPU-Weg, der Reviewer SwiftShader. Nach
einem Treiberupdate (oder neuem Chrome) die GPU-Referenzen erst mit `--gpu --write` neu schreiben, wenn SwiftShader grün
bestätigt hat.

**Offen:** Läuft der GPU-Weg neben einer Probe mit Zeitmessung auf der GPU, verfälscht er sie. Das verhindert die
Sperre (alleinige warten auf leichte), aber nur, solange alle über `leise.sh` laufen.
