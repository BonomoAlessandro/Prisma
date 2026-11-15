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
