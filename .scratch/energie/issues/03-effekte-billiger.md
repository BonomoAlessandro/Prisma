# 03: Effekte billiger, ohne sichtbaren Verlust

**Spec:** ../spec.md

**Status:** done (Schalter gemessen und vom Nutzer beurteilt; `?spar` in Ticket 04 durch die Spiegelung je Welt ersetzt)

**What to build:** Spiegelung des Bodens, Bloom und Pinsel machten im Level auf dem Poco zusammen etwa ein Drittel
des Stroms aus (Spec, Messung am Morgen: ≈ 3,6 W gegen ≈ 2,2 W ohne die drei). Der Nutzer will sparen, **ohne dass
die Ansicht schlechter wird**. Deshalb kommt jede Sparfassung zuerst nur als Schalter. Der Nutzer beurteilt sie an
Vergleichsbildern und auf dem Poco, erst danach wird eine Standard (eigenes Ticket).

Zuerst **messen, was jeder Effekt kostet**, in Ersatzgrössen auf dem Rechner (GPU-Zeit mit
`EXT_disjoint_timer_query_webgl2` im Headless-Chrome mit GPU, `leistung`): Spiegelung, Bloom, Pinsel, letzter
Schritt (`finalPass`), Himmel, Auflösung. Hilfreich sind Laufzeitschalter, wie sie der Koordinator auf dem Poco
benutzt hat: `__prismaDebug.bloomPass.enabled`, `brushPass.enabled`, `QUALITY.reflections`.

Kandidaten. Wähle die mit dem besten Verhältnis von Ersparnis zu Sichtbarkeit; es müssen nicht alle sein:
- **Spiegelung seltener:** Die Spiegeltextur nur jedes zweite Bild neu rechnen, besonders in Ruhe. Der Spiegel ist
  weich und gedämpft, ein Bild Verzug sieht man kaum. Bei Kamera-Bewegung genau prüfen.
- **Spiegelung kleiner:** `QUALITY.reflectionScale` auf dem Handy 0,35 → etwa 0,25, MSAA der Spiegelung 2 → 0.
- **Bloom billiger:** Weniger Stufen (mips), ab halber oder Viertelauflösung.
- **Pinsel** (`QUALITY.brush`): gröber oder in Ruhe seltener.
- **Auflösung in Ruhe:** Heute Pixelverhältnis 2 auf dem Poco (2,75 nativ). Prüfe, ob etwa 1,75 bis 1,8 sichtbar ist.
  Vorsicht: Text und Kanten müssen scharf bleiben.

Für jede gewählte Sparfassung:
- [ ] Schalter `?spar=<name>[,<name>…]` (Liste), ohne Parameter alles wie heute.
- [ ] Vergleichsbilder **Handy hoch** (Massstab des Poco: 393 × 852, DPR 2,75, `MOBILE=1`), heute gegen Sparfassung,
      dieselbe Stelle und Zeit (`?t=`), in mindestens drei Welten (Bergwald, Strand, Vulkan; für die Spiegelung ein
      Level mit gut sichtbarem Spiegel). Zusätzlich je ein Ausschnitt in doppelter Grösse. Ablage
      `C:\Users\admin\AppData\Local\Temp\prisma-bilder-energie03\`. Sieh sie dir selbst an und beschreibe ehrlich, was
      man sieht.
- [ ] Gemessene Ersparnis (GPU-Zeit je Bild) je Fassung, in einer Tabelle im Ticket.
- [ ] Nichts darf flackern oder springen (Spiegelung seltener: beim Drehen, beim Ziehen der Kamera, beim Überblenden).
- [ ] Tests: Golden und Logiktests grün, Probe, die die Schalter einmal durchläuft (keine Konsolenfehler).
- [ ] `APP_VERSION` erst beim Zusammenführen (Koordinator).

## Hinweise

- Rendering in `index.html`: `draw`, `renderReflection`, `reflector`, `QUALITY`, `createBrushPass`, `UnrealBloomPass`,
  `FinalShader`, `composer`, `adaptiveResolution`. README Abschnitt Leistung, ADR 0006–0009.
- Ticket 02 (Ruhe-Bildrate als Standard) läuft parallel in einem anderen Worktree und ändert `frameRate`. Bleib dort
  weg, damit sich die Änderungen nicht überlagern.

## Notizen der Umsetzung (15.11.2026)

**Messung.** `tests/spar-probe.mjs messen` misst je Schritt von `draw` die GPU-Zeit mit einer eigenen Abfrage
(`EXT_disjoint_timer_query_webgl2`). Headless läuft das auf der **eingebauten Intel UHD 630** des Rechners, nicht auf der
Quadro. Für die Zahlen ist das eher günstig: Sie ist einer Handy-Grafik ähnlicher. Im Takt von 60 schwankten die Zahlen
stark, und eine kleinere Auflösung wurde sogar «teurer», weil die Grafik bei weniger Arbeit ihren Takt senkt. Darum
misst die Probe Stösse von 30 Bildern ohne Pause, in 3 Runden im Wechsel aller Fassungen. Die Spanne über die Runden
liegt meist unter ±0,1 ms, im Wald einmal bei ±1 ms. Zwei Läufe: Lauf 1 mit Level 40 («Bimsstein», wenige Strahlen),
Lauf 2 mit Level 212 («Sandviper», vier Quellen). Handy-Massstab: 393 × 852, Pixeldichte 2,75, Android-Kennung, also
Bild 786 × 1704 bei Pixelverhältnis 2. Desktop: 1440 × 900.

**Was jeder Effekt heute kostet** (GPU ms je Bild, Lauf 2, in Klammern Lauf 1; Desktop nur Lauf 1):

| | Wald Handy | Strand Handy | Vulkan Handy | Wald Desktop | Strand Desktop | Vulkan Desktop |
|---|---|---|---|---|---|---|
| ganzes Bild | 12,8 (11,7) | 18,4 (17,4) | 28,2 (27,4) | 14,1 | 19,6 | 20,1 |
| Spiegelung | – (kein Spiegel) | 0,68 (0,41) | 0,91 (0,63) | – | 0,42 | 0,66 |
| Szene samt Schatten | 9,6 (8,6) | 13,6 (12,8) | 24,3 (23,8) | 10,8 | 12,2 | 16,1 |
| davon Himmel | ≈ 2,3 | ≈ 8 (Wasser 5,8, Panorama 2,4) | ≈ 19–21 | | | |
| Pinsel | – | 0,60 (0,61) | – | – | 1,10 | – |
| Bloom (eigener Schritt) | 1,42 (1,32) | 1,81 (1,87) | 1,33 (1,32) | 1,28 | 3,89 | 1,33 |
| letzter Schritt (davon Bloom) | 1,72 (0,6) | 1,68 (0,6) | 1,68 (0,6) | 1,97 (0,85) | 1,98 (0,85) | 2,01 (0,9) |
| ohne Bloom gespart | 2,3 (1,9) | 2,4 (2,5) | 1,9 (2,0) | 2,2 | 4,5 | 1,7 |

Die leere Szene (alle Kinder aus) kostet noch 2,8 ms: Löschen und Auflösen des HalfFloat-Ziels. «Himmel» stammt aus
der Zerlegung je Kind der Szene (`zerlege`, `zerlege5`). Auflösung (Wald Handy, Lauf ohne Pause):
Pixelverhältnis 2 → 11,4 ms, 1,75 → 9,3, 1,5 → 7,4, 1 → 4,4.

**Folgerung.** Auf dieser Grafik kosten Spiegelung (0,4–0,9 ms), Pinsel (0,6 ms) und Bloom (2–2,5 ms) zusammen nur etwa
15–20 % des Bilds. Am meisten kosten der Himmel (Vulkan, Strand) und die Auflösung. Auf dem Poco hatte das Abschalten
der drei Effekte etwa 40 % gespart (Spec). Eine Kachel-GPU zahlt je eigenem Durchgang Laden und Speichern des Ziels;
Bloom hat 13 Durchgänge, die Spiegelung einen samt MSAA-Auflösung und Mipmaps. Diesen Anteil bildet die Intel-Grafik
kaum ab. Die kleinen Fassungen können auf dem Poco also mehr bringen als hier. Messen lässt sich das nur am Akku.

**Gebaute Sparfassungen** (`?spar=<name>[,…]`, `?spar=alle`; ohne Schalter bitgleich wie heute). Die Ersparnis gilt
für das ganze Bild auf dem Handy, Lauf 2 (Lauf 1):

| Schalter | Was | Strand | Vulkan | Wald | Sichtbar? |
|---|---|---|---|---|---|
| `aufloesung` | Handy Pixelverhältnis 1,75 statt 2 | −3,3 ms, −18 % (−3,3) | −5,7 ms, −20 % (−5,7) | −2,7 ms, −21 % (−2,3) | ein wenig, siehe unten |
| `spiegel2` | Spiegeltextur in Ruhe nur jedes 2. Bild | −0,34 (−0,21) | −0,45 (−0,30) | – | nein (Probe: nie beim Drehen/Ziehen) |
| `spiegelklein` | Spiegel 0,25 statt 0,35, ohne MSAA | −0,12 (−0,10) | −0,14 (−0,08) | – | nein (≤ 0,1 % der Pixel, ±0,02/255) |
| `pinsel3` | Pinsel 3 × 3 statt 2 × 2 | −0,07 (−0,08) | – | – | nein; Desktop −0,23 ms (nicht im Bild geprüft) |

Verworfen: **`bloomhalb`**, also Bloom auf dem Handy ab halber Auflösung wie am Desktop. Gemessen kostete der Bloom
4,1 statt 1,8 ms und wurde damit teurer. Der Hochpass liest dann 8 × 8 statt 4 × 4 Punkte je Bloom-Pixel und streut
weiter. Den Schalter habe ich wieder entfernt. Weniger Bloom-Stufen habe ich nicht gebaut: Der Hof um die Strahlen würde
kleiner, das sähe man.

**Vergleichsbilder** (`spar-probe.mjs bilder`, `?t=12`, Level 212, Handy hoch) in
`C:\Users\admin\AppData\Local\Temp\prisma-bilder-energie03\`: `<welt>-heute.png`, `<welt>-<spar>.png`, je
`-ausschnitt` (Mitte des Bretts, doppelte Grösse) und `-vergleich` (heute | Spar | Unterschied ×8), Zahlen in
`vergleich.json`. Was ich sehe:
- `aufloesung`: In Originalgrösse sehe ich keinen Unterschied. Im doppelt vergrösserten Ausschnitt sind die
  Rasterlinien des Bretts und die Umrisse der Elemente etwas weicher, und dünne helle Linien wirken leicht matter. Im
  Unterschied sieht man nur Kanten. Pixel mit Abweichung: Wald 8 %, Strand 4 %, Vulkan 10 %; im Mittel 1,2–1,6 von 255.
  Text, Kopfzeile und Knöpfe sind DOM und bleiben scharf. Ob man das auf dem Poco sieht, muss der Nutzer dort prüfen.
- `spiegelklein`: Am Strand gibt es keinen messbaren Unterschied: Der Sand spiegelt kaum, die Spiegelung wird gerechnet,
  aber man sieht sie fast nicht. Im Vulkan weichen 0,1 % der Pixel ab, im Mittel 0,02 von 255. Unsichtbar.
- `pinsel3`: Hochkant malt der Pinsel am Strand nur die Farnspitzen am oberen Rand; Unterschied 0,09 % der Pixel.
  Unsichtbar, spart aber auch fast nichts.
- `spiegel2`: Im stehenden Bild gibt es keinen Unterschied. Die Probe `pruefe` zeigt: In Ruhe fällt genau jedes zweite
  Spiegelbild aus (53 von 106), nie zwei in Folge. Beim Drehen fällt keines aus, beim Ziehen eines von 187, und das vor
  dem ersten Touch-Ereignis. Während einer Fahrt der Kamera, beim Überblenden, mit `?takt=30` und in der Ruhe-Bildrate
  wird jedes Bild gezeichnet. Die Matrix der Textur bleibt die des letzten Spiegelbilds. Das Spiegelbild hängt also
  höchstens ein Bild nach, wenn die Kamera schwebt, und verrutscht dabei nicht. Flackern habe ich nicht gesehen und
  nicht gemessen. Auf dem Poco sollte es trotzdem jemand ansehen.

**Empfehlung für den Test auf dem Poco:** `?spar=aufloesung` als einziger grosser Hebel, rund 20 % der Grafikzeit;
anschauen, ob das Brett weicher wirkt. Dazu `?spar=spiegel2,spiegelklein`: unsichtbar, am Rechner nur 1–2 %, auf der
Kachel-GPU vielleicht mehr. `pinsel3` lohnt kaum.

**Offen:** Der Himmel ist der grösste Posten, Vulkan ≈ 20 ms und Strand ≈ 8 ms von 28 bzw. 18. Das liegt ausserhalb der
Kandidaten dieses Tickets und wäre ein eigenes Ticket (Lava, Wasser).

## Comments

### Review (15.11.2026, unabhängiger Reviewer)

**Läufe** (Stand 1b45ac0 plus Review-Commit): alle `tests/*.test.mjs` grün (`generator.test.mjs` über `leise.sh`),
`node tests/golden.mjs` grün (842 Level). `spar-probe pruefe` Desktop und `--handy` OK. `spar-probe messen --handy`
einmal (unten). `leerlauf-probe` OK (Reaktion: erstes Bild immer im nächsten Bildschirmbild),
`geschichte-probe --dorf --handy` bestanden, ohne FEHLER und ohne Lücke über 100 ms.

**Ohne Schalter bitgleich.** Eigener Vergleich 90d44f0 gegen diesen Stand, ohne `?spar`, Level 212, `?t=12`, Wald,
Strand und Vulkan, Desktop und Handy: Bildschirmfotos SHA-1-gleich, dazu je Bild gleich viele Draw-Calls und Dreiecke,
gleiche Spiegeltextur (Grösse, MSAA) und gleiches Pixelverhältnis. Mehrarbeit je Bild ohne Schalter: nur der Aufruf
`spiegelTakt.auslassen` (bricht an `SPAR.spiegel2` ab) und zwei Zuweisungen, vernachlässigbar.

**Messung** (meine, Handy, Lauf wie Lauf 2 des Umsetzers, Level 212, 4 Runden), GPU ms je Bild:

| | Wald | Strand | Vulkan |
|---|---|---|---|
| heute ganzes Bild (Umsetzer) | 12,57 ±0,03 (12,8) | 18,87 ±0,63 (18,4) | 28,72 ±0,26 (28,2) |
| `aufloesung` | −2,27, −18 % (−2,7) | −3,46, −18 % (−3,3) | −5,95, −21 % (−5,7) |
| `spiegel2`, Schritt Spiegel | – | 0,74 → 0,35 (−0,34) | 0,93 → 0,46 (−0,45) |
| `spiegelklein`, Schritt Spiegel | – | 0,74 → 0,59 (−0,12) | 0,93 → 0,78 (−0,14) |
| `pinsel3`, Schritt Pinsel | – | 0,64 → 0,57 (−0,07) | – |
| ohne Bloom | −1,94 | −1,51 | −1,88 |

Die Zahlen des Umsetzers treffen zu. Methode (Stösse ohne Pause, Runden im Wechsel, Median je Runde, Spanne) ist gut.
Einschränkung: Die Ersparnis von `spiegel2`, `spiegelklein` und `pinsel3` ist die Differenz des einzelnen Schritts. Im
ganzen Bild geht sie am Strand im Rauschen unter (Spanne ±0,6–0,9 ms, vom Wasser des Himmels). Die Tabelle des
Umsetzers schreibt sie als Ersparnis «für das ganze Bild». Das ist rechnerisch richtig, gemessen aber nur am Schritt.

**Vergleichsbilder** angesehen (Vulkan, Strand, Wald, Ausschnitt). Das Urteil stimmt: Mit `aufloesung` sind im
vergrösserten Ausschnitt die Rasterlinien und die Kanten der Elemente etwas weicher und treppiger, dünne helle Linien
etwas matter. Im Unterschiedsbild leuchten nur Kanten. In Originalgrösse auf dem Rechner sehe ich es nicht. Ehrlich
beschrieben. Einziger Nachtrag: Der Ausschnitt ist nicht doppelt, sondern etwa 2,75-fach in Gerätepixeln vergrössert
(Clip in Seitenpixeln mal `SEITE`), also eher strenger als nötig. `spiegelklein` und `pinsel3` sind im Bild unsichtbar,
am Desktop aber nicht im Bild geprüft (dort MSAA der Spiegelung 4 → 0 und Pinsel 2 × 2 statt voll).

**`aufloesung`** wirkt korrekt mit dem Rest: `adaptiveResolution.min` rechnet relativ zu `QUALITY.pixelRatio`, die
absolute Untergrenze (1 Bildpunkt je CSS-Pixel) bleibt. `SEITE` und die Grösse des Canvas hängen nicht am
Pixelverhältnis (`seiteBreite`, `renderer.setSize`). Treffer (`pickElement`) rechnen in CSS-Pixeln über
`getBoundingClientRect`. Band, Lichtkegel und Hand der Führung sind DOM/SVG und bleiben scharf. Shader mit
`uPixelRatio` lesen den Wert beim Laden oder je Bild, beim Laden stimmt also alles. Nur `sparAnwenden` zur Laufzeit
(nur Proben) lässt die beim Bau gesetzten `uPixelRatio` stehen. Für Punktgrössen in Messungen ist das unerheblich.

**`spiegel2`** ist korrekt: Ausgelassen wird nur mit gültiger Textur, gleichem Spiegel, ohne Finger, Taste oder Zwei
Finger, ohne irgendetwas aus `sceneLoop.pending` (Drehen, Hover, Ziele, Kamera nach Ziehen und Zoom samt Rad, Feier,
Feld beim Levelwechsel, Überblenden von Himmel und Brett über `skyTheme.busy`/`boardTheme.busy`, wachsende Strahlen)
und nur im vollen Takt. Die `textureMatrix` bleibt die des letzten Spiegelbilds, das Spiegelbild hängt also in der
Welt fest und ist höchstens ein Bild alt. Neu angelegte Textur (`setSize` → `dispose`) und Platte ausser Bild setzen
`gueltig` zurück. Nie zwei Auslassungen in Folge. Probe: beim Drehen 0, beim Ziehen höchstens 1 (vor dem ersten Touch).

**Fund, mittel: `spiegel2` wirkt mit Ticket 02 fast nie.** Ticket 02 ist inzwischen in `feature/energie` (844a674),
das ruhende Level zeichnet nun 30 Bilder/s. `spiegelTakt.auslassen` (index.html, `frameRate.gap < 20`) lässt nur im
vollen Takt aus. Ausgelassen wird damit nur noch in den 1,5 s nach einer Eingabe, wenn nichts ansteht, und im Menü,
solange der Blick nicht im Himmel steht. Die gemessenen −0,34/−0,45 ms gelten nur mit `?ruhetakt=aus`. In einem
Probe-Merge (02 + 03, temporärer Worktree) fiel `spar-probe pruefe` mit 10 FEHLER durch: zu wenige Bilder in Ruhe, und
`spiegel2` liess 0 von 56 aus. Behoben in der Probe (siehe unten). Am Spiel selbst ändert sich nichts, der Zusammenbau
geht ohne Konflikt (`git merge-tree`: sauber). Ticket 03 liest weder `skyTheme.fluid` noch `ruheFps`/`RUHE_FPS`, nur
`frameRate.gap`.
Vorschlag: `spiegel2` nicht mehr für den Poco-Test empfehlen, oder nur zusammen mit `?ruhetakt=aus`, und vor einem
Standard-Ticket streichen. Auslassen auch bei 30 (Spiegel mit 15/s) würde ich nicht bauen: Beim Schweben der Kamera
hinge das Spiegelbild dann 33–67 ms nach, das ist eher sichtbar. Die Empfehlung oben («`?spar=spiegel2,spiegelklein`»)
sollte darum heissen: `?spar=aufloesung` und `?spar=spiegelklein`, jeweils gegen ohne.

**Selbst behoben** (Commit «fix(energie): spar-probe unabhängig von der Ruhe-Bildrate, toter Code weg (Review Energie
03)»): `pruefe` und `messen` laden mit `?ruhetakt=aus`, dazu ein Fall `?spar=spiegel2&ruhetakt=30&ruhehimmel`, der
prüft, dass in der Ruhe-Bildrate nie ausgelassen wird. Auf diesem Stand und im Probe-Merge mit 02 grün. Toter Code
entfernt (`NUR_LADEN`, `messeWeltNurHeute`, ungenutztes `url`). README: Vorgabe `--runden 4` statt 3, `--level`.

**Offen:** `APP_VERSION` beim Zusammenführen (Koordinator). Ob `aufloesung` auf dem Poco sichtbar ist, entscheidet der
Nutzer. Der Himmel (Vulkan ≈ 20 ms, Strand ≈ 8 ms) bleibt der grösste Posten, eigenes Ticket.

**Urteil:** bereit für den Test des Nutzers auf dem Poco, mit `?spar=aufloesung` und `?spar=spiegelklein` (jeweils
gegen ohne). `spiegel2` nur mit `?ruhetakt=aus` vergleichbar.

### Test des Nutzers auf dem Poco (15.11.2026, energie-3)

- `aufloesung`: Beim Prisma «flackert» die linke untere Kante, wenn eine Spitze zur Kamera zeigt; die Farne im Wald wirken
  weniger schön, ihre Farbe ändert sich mit der Kamera leicht (evtl. schon vorher); Spiegel je nach Winkel etwas
  pixeliger (ok). **Nicht übernommen.**
- Spiegelung: Auf den eigenen Welten (alle ausser den beiden im All) kann die Spiegelung auf dem Brett ganz weg; im All
  wirkt die schwächere (`spiegelklein`) gut. → Ticket 04.
