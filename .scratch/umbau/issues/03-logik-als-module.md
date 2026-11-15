# 03: Spiellogik und markierte Bereiche als Module

**Spec:** ../spec.md

**Status:** needs-triage

**Blocked by:** 02

**What to build:** Die Bereiche, die Tests und Werkzeuge heute als Text aus `index.html` schneiden, werden echte Module
unter `src/`. Tests und Werkzeuge importieren sie, statt `indexOf('/* …:BEGIN')` und `new Function(…)` zu benutzen.
Das Spiel verhält sich und sieht genau gleich aus.

- [ ] `LOGIC` (Strahlregel und Logik) als Modul, dazu `HALL` (Impulsantwort des Halls, läuft auch im Worker). Die
      neuen Module sind TypeScript, sofern das ohne Verhaltensänderung geht. Sonst vorerst JavaScript.
- [ ] `index.html` bzw. das Hauptskript importiert die Module. Der Worker für den Hall lädt sein Modul, statt Quelltext
      zu bekommen.
- [ ] `tests/logic.test.mjs`, `tests/golden.mjs`, `tests/hall.test.mjs`, `tests/vorrat.test.mjs`,
      `tests/ki-tester.test.mjs`, `tests/levelliste.test.mjs`, `tools/solver.mjs` und `tools/lader.mjs` importieren die
      Module (die übrigen Tests und Werkzeuge laden die Logik heute über `tools/solver.mjs`). Ein kleiner Weg dafür,
      dass Node die TypeScript-Module laden kann (z. B. über `tsx` oder Vite), steht im README.
- [ ] `LEVELS`, `WUERFEL` und `GESCHICHTE` bleiben in diesem Ticket markierte Bereiche (Ticket 06 macht Datendateien
      daraus). Sie liegen heute innerhalb von `LOGIC`; wandern sie mit ins Modul, schreiben `tools/ordne-level.mjs`,
      `tools/ordne-wuerfel.mjs`, `tools/geschichte.mjs`, `tools/leveldaten.mjs` und `tools/vorrat.mjs` dorthin.
- [ ] `tests/hall.test.mjs` bleibt bitgleich mit den Prüfsummen aus dem Stand `963177d`.
- [ ] Golden (auch `--voll`, weil der Löser betroffen ist), Bildvergleich, alle Tests und Proben grün.

## Hinweise

- Die Bereiche finden: `grep -n ':BEGIN' index.html`.
- Golden muss gegen die **bestehende** Referenz grün bleiben, ohne `--write`.

## Comments
