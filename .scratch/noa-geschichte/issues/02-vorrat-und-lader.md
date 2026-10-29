# 02: Vorrat und gemeinsamer Lader

**Spec:** ../spec.md

**Blocked by:** –

**Status:** ready-for-agent

**What to build:** Die Grundlage, um Level aus dem Spiel zu nehmen, ohne sie zu verlieren: ein versionierter Vorrat
unter `tools/vorrat/` mit einem Werkzeug zum Ablegen und Zurückholen, und ein gemeinsamer Lader, über den Werkzeuge und
Tests Level aus Spiel und Vorrat finden. Das Spiel bleibt in diesem Ticket unverändert (der Vorrat ist noch leer bzw.
nur zur Probe gefüllt); erst Ticket 04 nimmt Level aus dem Spiel.

- [ ] Format des Vorrats: Leveldaten wie in `LEVELS`/`LEVELS_3D` (über `tools/leveldaten.mjs`, `levelCode`), samt
      Herkunft im Kommentar, Grad, Lösung und, falls vorhanden, `titel`; getrennt nach Fläche und Würfel. Lesbar wie die
      Blöcke in `index.html`, damit ein Diff zeigt, was sich ändert.
- [ ] `tools/vorrat.mjs`: `ablegen` (Level aus `index.html` in den Vorrat), `zurueckholen` (einzelne Level, eine
      Gruppe wie «alle Würfel» oder ein Grad), `liste`. Ablegen und Zurückholen sind verlustfrei: Hin und zurück ergibt
      byte-gleiche Leveldaten.
- [ ] Gemeinsamer Lader: Alle Stellen, die heute Level aus `index.html` lesen (u. a. `tools/levelliste.mjs`,
      `tools/ordne-level.mjs`, `tools/ordne-wuerfel.mjs`, `tools/wuerfelliste.mjs`, `tools/aehnlichkeit.mjs`,
      `tools/ki-tester/*`, `tools/leveldaten.mjs`, `tests/golden.mjs`, `tests/levelliste.test.mjs`,
      `tests/wuerfelliste.test.mjs`, `tests/beurteilung/*`), sind gefunden; wer alle Level braucht (Eichung, Ähnlichkeit,
      KI-Tester, Golden-Test, Würfelliste), liest Spiel und Vorrat über den Lader, wer nur das Spiel braucht, nur das
      Spiel.
- [ ] Probe (nicht committet): Werden 20 flache und 20 Würfel-Level abgelegt, bleiben Golden-Test, Beurteilung,
      KI-Tester und Würfelliste grün; zurückgeholt ist `index.html` wieder byte-gleich.
- [ ] Alle Tests grün mit unverändertem Spiel; Review nach dem Ticket.

## Comments
