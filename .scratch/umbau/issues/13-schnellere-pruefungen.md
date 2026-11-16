# 13: Schnellere Prüfläufe

**Spec:** ../spec.md

**Status:** ready-for-agent (nach dem Review von 01 und 02)

**Blocked by:** 01, 02 (Review fertig, in `feature/umbau`)

**What to build:** Die Prüfungen nach jedem Schritt dauern zu lange (16.11.2026: drei Agenten standen stundenlang an der
Sperre von `tools/leise.sh`). Der Nutzer hat entschieden (16.11.2026), sie zu beschleunigen, **ohne weniger zu prüfen**:

- [ ] `tools/leise.sh` kennt zwei Arten von Läufen:
      - **leicht** (`LEISE_ART=leicht`): Läufe ohne Messung von Zeiten (Bildvergleich, Golden, Node-Tests, `brett-probe`,
        `offline.mjs`, `screenshot`, Werkzeuge). Bis zu `LEISE_LEICHT_MAX` (Standard 4) gleichzeitig.
      - **allein** (Standard, wie heute): Läufe mit Bildzeiten oder Messungen (`leerlauf-probe`, `ruhetakt-probe`,
        `buehne-messung`, die Lückenmessung der `geschichte-probe`, `start-probe`, `spiegel-probe messen` …). Ein
        alleiniger Lauf startet erst, wenn kein leichter mehr läuft, und während er läuft, startet keiner.
      - Vorrang (`LEISE_VORRANG`), verwaiste Sperren, Priorität «Leerlauf» und `LEISE_CPU` bleiben wie heute; ein
        wartender alleiniger Lauf darf nicht endlos von leichten überholt werden.
      - Tabelle im README: welcher Lauf welche Art ist.
- [ ] `tests/bildvergleich.mjs` läuft seine Abläufe und Grössen parallel (z. B. `--jobs n`, Standard sinnvoll für 12
      Kerne), mit demselben Ergebnis wie seriell; die Laufzeit messen und angeben (Ziel: um 10 min statt knapp 30).
- [ ] Prüfen: fünf parallele Läufe des Bildvergleichs grün; ein leichter Lauf neben einem anderen leichten ändert kein
      Ergebnis; ein alleiniger Lauf (z. B. `ruhetakt-probe`) wird nicht gestört (startet nie neben einem leichten).
- [ ] Regel für die Agenten in `CLAUDE.md` bzw. README festhalten: Umsetzer lassen nur die schnellen Prüfungen laufen
      (Node-Tests, Golden, Bildvergleich, dazu die Proben, die ihr Ticket direkt betrifft); der Reviewer lässt den ganzen
      Satz einmal laufen, die Proben mit Zeitmessung nur er. Wackelt ein paralleler Lauf (Zeitüberschreitung, Flake),
      zurück zum alleinigen Lauf.

## Comments
