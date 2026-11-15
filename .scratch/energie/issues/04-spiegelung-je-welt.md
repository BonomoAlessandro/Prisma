# 04: Spiegelung je Welt, Sparfassungen bereinigen

**Spec:** ../spec.md

**Status:** ready-for-agent

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
- [ ] Ohne Parameter: In den Welten ausser Planeten und Sterne rechnet das Spiel **keine** Spiegeltextur mehr. Weder
      `renderReflection` noch die Mipmaps dürfen laufen, sonst spart es keinen Strom. Das Brett zeigt keinen
      Spiegelanteil, also keine alte oder schwarze Textur und keinen hellen Fleck. Der Look des Bretts soll sonst
      gleich bleiben. Prüfe, ob der Spiegelanteil im Shader (`addBoardReflection`, `boardReflectGlsl`) beim Abschalten
      Helligkeit oder Fresnel verändert. Vergleiche dazu ein Bild «heute» mit «ohne», in allen Welten.
- [ ] Planeten und Sterne: Spiegelung wie `spiegelklein` als Standard.
- [ ] Beim **Überblenden** zwischen zwei Welten, etwa Sterne ↔ andere, kein Sprung und kein Aufblitzen. Wird die
      Spiegelung dabei ein- oder ausgeblendet, dann weich. Prüfe auch Übersicht und Menü (Blick im Himmel) und das
      Brett, das herauswächst.
- [ ] Wo die Zuordnung «Welt hat Spiegelung» hingehört, entscheidest du, etwa in die Daten der Skybox oder in die
      Board-Themes (`boardTheme.mirrors`). Halte es einfach und dokumentiere es.
- [ ] Schalter zum Vergleichen: `?spiegel=alle`, also Spiegelung überall wie bisher mit 0,35 und MSAA. Die
      `?spar=`-Fassungen `aufloesung`, `spiegel2`, `spiegelklein` und `pinsel3` werden entfernt, samt Code, Probe-Teilen
      und Doku. Sie bleiben in git. Ob `tests/spar-probe.mjs` als Messwerkzeug bleibt (Modus `messen` gegen
      `?spiegel=alle`), entscheidest du; toter Code soll nicht bleiben.
- [ ] Vergleichsbilder Handy hoch (`MOBILE=1`, 393 × 852, DPR 2,75) «heute (energie-3)» gegen «neu», je Welt: Dorf,
      Wald, Strand, Wüste, Vulkan, Planeten, Sterne. Ablage `C:\Users\admin\AppData\Local\Temp\prisma-bilder-energie04\`.
      Selbst ansehen und ehrlich beschreiben.
- [ ] Gemessene GPU-Zeit je Bild vorher und nachher (Wald, Strand, Vulkan, Sterne), wie in Ticket 03.
- [ ] Tests: Logiktests, Golden, Dorf-Probe `--handy`, Probe für den Übergang zwischen den Welten (siehe
      `geschichte-probe`, Übersicht), Bildzeit beim Überblenden ohne neue Lücken.
- [ ] README Abschnitt Leistung und Grafik, ADR (neu 0010 oder Ergänzung zu einer bestehenden), `CONTEXT.md` falls nötig.
- [ ] `APP_VERSION` in `index.html` und `sw.js` gleich auf `2026-11-15 energie-4`.

## Hinweise

- `renderReflection`, `reflectionInView`, `reflector`, `QUALITY.reflections`, `QUALITY.reflectionScale`,
  `QUALITY.reflectionMsaa`, `boardTheme.mirrors`, `addBoardReflection`, Himmel `backgrounds/skies.js` (ids: village,
  forest, beach, desert, volcano, icecave; die Welten im All prozedural: Planeten, Milchstrasse/Sterne), `skyTheme`.
- Ticket 03 mit Messmethode und `tests/spar-probe.mjs` (`messen`, `bilder`, `pruefe`).
