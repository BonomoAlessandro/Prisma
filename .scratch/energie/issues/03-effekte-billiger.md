# 03: Effekte billiger, ohne sichtbaren Verlust

**Spec:** ../spec.md

**Status:** ready-for-agent

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
