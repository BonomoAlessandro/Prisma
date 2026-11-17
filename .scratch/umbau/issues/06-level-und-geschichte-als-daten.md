# 06: Level und Geschichte als Datendateien

**Spec:** ../spec.md

**Status:** ready-for-agent (17.11.2026; startet auf dem Stand von 05, während 05 im Review ist)

**Blocked by:** 05

**What to build:** Level (`LEVELS` mit den Übungen im Dorf, die Würfel-Level `LEVELS_3D` zwischen den Markern
`WUERFEL`, dazu der Vorrat in `tools/vorrat/`) und die Reise der Geschichte (`GESCHICHTE`, `STORY_LEVELS`) liegen
nicht mehr im Code, sondern in eigenen Datendateien. Die Werkzeuge, die heute zwischen den
Markern in `index.html` schreiben, schreiben in diese Dateien. Spiel und Level bleiben genau gleich.

- [ ] Ein Format für die Level festlegen (JSON oder ein Daten-Modul), das die heutigen Kommentare zur Lösung erhält
      oder sie in ein Feld übernimmt. Die Wahl unter «Comments» begründen.
- [ ] Das Spiel lädt die Daten beim Build mit. Kein Nachladen über das Netz, das Spiel bleibt offline spielbar.
- [ ] `tools/ordne-level.mjs`, `tools/ordne-wuerfel.mjs`, `tools/geschichte.mjs`, `tools/leveldaten.mjs`,
      `tools/levelliste.mjs`, `tools/vorrat.mjs`, `tools/lader.mjs` und alle anderen Werkzeuge, die die Marker
      benutzen, lesen und schreiben die neuen Dateien. Die Marker verschwinden aus dem Code.
- [ ] Die Texte bleiben in diesem Ticket noch Deutsch im Datensatz. Ticket 07 macht Schlüssel daraus.
- [ ] Golden gegen die bestehende Referenz grün (Vergleich je Level nach Namen), `tests/geschichte.test.mjs`,
      `tests/levelliste.test.mjs`, `tests/wuerfelliste.test.mjs`, `tests/vorrat.test.mjs`, Bildvergleich
      und alle Proben grün.
- [ ] README: wo die Level liegen und wie man ein Level ändert.

## Comments
