# 03: Bestand umstellen

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** ready-for-agent

**What to build:** Die Würfel-Level, die die Regel nach dem Verschieben erfüllen (Zählung: 75), verschoben auf
7 × 7 × 5 und neu beurteilt im Spiel; die übrigen aus dem Spiel.

- [ ] Verschoben, Lösung unverändert (geprüft), neu beurteilt, Herkunft mit Vermerk der Verschiebung.
- [ ] Beide KI-Tester haben die behaltenen Level beurteilt (Läufe zu höchstens 25); von beiden abgelehnte entfernt.
- [ ] Reihenfolge und Grade neu geordnet; Tabelle der Spec nachgerechnet, falls sich Grade ändern.
- [ ] Golden-Referenz, alle Tests grün, gepusht; Review.

## Comments

**26.10.2026, Koordinator: Bestand umgestellt und beurteilt. Gemergt wird er zusammen mit Gruppe 1 (Ticket 04).**

- **Gesenkt:** 75 Level, je Grad 17 / 43 / 10 / 5, in den Quader 7 × 7 × 5 (`senke`).
  - Die Herkunft steht als „…, Stand …, gesenkt um N“ beim Level.
  - Name und Grad sind gleich geblieben, auch nach der Neubeurteilung. Darum muss die Tabelle der Spec nicht neu gerechnet werden.
  - Lösung: genau eine, die notierte (Test). Ebenen-Regel: erfüllt (neuer Test über alle Level im Spiel).
- **Entfernt:** 225 Level, Liste in `tests/output/quader/bestand-03.json`. Ihre Namen sind wieder frei.
- **Code:**
  - `WUERFEL = QUADER`.
  - `bestandNach`: von `BEHALTEN` aus in 9 Gruppen bis zum Bestand bei 300, danach wie in der Spec wuerfel-500 ab Gruppe 13. `GRUPPEN = 17`.
  - Die Verteilung rechnet jetzt ganzzahlig. Vorher kippten gleiche Reste bei Brüchen je nach Rundung, etwa 85 · 0,7 gegen 105 · 0,7.
- **Anker der KI-Tester:** Keiner der Anker aus W3 erfüllt die Regel.
  - **W4:** 8 Anker aus den 75 behaltenen Leveln: Wippe, Picknick, Zither, Gesims, Palmyra, Schlossanlage, Möbiusband, Banach-Tarski. Unter W4 liefen wuerfel-0-1 bis -3 mit den 67 übrigen Leveln, in Läufen zu 23, 22 und 22.
  - **W5:** Ein Anker zählt nicht als Urteil. W5 nimmt deshalb 8 andere Level, die unter W4 beurteilt wurden: Schneebesen, Zahnbürste, Tympanon, Mittelbau, Ninive, Fatehpur Sikri, Gauss, Ewige Wiederkehr. Unter W5 lief wuerfel-0-4 mit den 8 Ankern aus W4.
  - **Auftrag:** Ein KI-Tester bemerkte in wuerfel-0-2, dass der Auftrag (`brief-wuerfel.md`) noch „7 × 7 × 7, Ebene 6 oben“ nannte. Die Texte der Level waren richtig. Der Auftrag ist ab W5 korrigiert.
- **Urteile:** Alle 75 sind beurteilt, keines ist abgelehnt.
  - Je einmal „Füllteil“ von nur einem Tester, bei Atelier und Ikosaeder. Das zählt nicht als Ablehnung.
  - 28 eigene Korrekturen. Am Handy ist die Lesbarkeit oft nur 2: Mehrere Ebenen liegen übereinander. Das ist ein Hinweis für spätere Spieltests.
- **Offen bis Gruppe 1:** Im Bestand allein gibt es drei Häufungen: Seite 3 Mischziel 5-mal, Seite 5 Sammelstelle 6-mal, Seite 7 Sammelstelle 4-mal. Die neuen Level der Gruppe 1 kommen dazwischen, und die Wahl tauscht gegen offene Häufungen. Darum geht Ticket 03 zusammen mit Ticket 04 nach `feature/3d-wuerfel`.
- **Grenz-Duldung (Stockwerk):** Sie wird nach Gruppe 1 überprüft, denn Stockwerk steht nicht mehr auf Seite 6.
