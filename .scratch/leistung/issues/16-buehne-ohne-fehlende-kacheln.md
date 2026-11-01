# 16: Prolog-Bühne zeigt nie halb gerasterte Ebenen

**Spec:** ../spec.md

**Blocked by:** 07; nicht parallel zu 15 (beide in `createStoryScene`)

**Status:** ready-for-agent

**What to build:** Kein Flackern in der Prolog-Bühne. Beobachtung des Nutzers im Handy-Durchlauf 2: «ein kurzes Flackern
des Bildes in der ersten Noa-Szene».

**Ursache (Diagnose in 07, wahrscheinlich, in der Emulation nicht sichtbar nachgestellt):** Fehlende Kacheln der
Bühnen-Ebenen, neu seit Ticket 04. Während einer Fahrt im Compositor zeigt Chrome ein Bild auch, wenn eine Ebene nach
neuer Skalierung (`--rs`) noch nicht fertig gerastert ist. Trace: 01c 0 Bilder mit fehlenden Kacheln im ganzen Prolog;
`c42423e` Handy ×4 gehäuft beim Öffnen der Bühne und in den Einstellungen 1–3, Desktop 4K bis 275 Bilder je
5-s-Fenster. Dazu Raster-Hänger im GPU-Prozess 25–43 ms (Quadro) beim Öffnen, nach dem Halt und in Fahrten – auf dem
Adreno länger; erklärt auch 98,8 ms bei 21,4 s auf dem Poco (gab es in 01c schon). Screencast jedes Bildes, Umbau,
schwarzes Bild, WebGL hinter der Bühne und `gehalten`/`buehneFrei` sind ausgeschlossen.

**Vorschlag:** Eine sichtbare Ebene nie neu rastern lassen: in einer unsichtbaren Kopie rastern und tauschen, oder die
Strichbreiten nicht je Ruhepunkt ändern (die Nachbesserung von 04 hält sie schon gestaffelt). Die gehaltene Bühne gleich
in der Skalierung der ersten Fahrt halten. Die Gewinne aus 04 (Fahrtende 17 ms) dürfen nicht verloren gehen.

- [ ] Trace Prolog (Handy-Emulation 4× und Desktop): 0 Bilder mit fehlenden Kacheln; kein Raster-Hänger über 16 ms in
      Fahrten und in den ersten 2 s nach dem Halt.
- [ ] Linienstärke und Schärfe bei normalem Abstand wie heute (Vergleich nebeneinander, auch Ende jeder Fahrt).
- [ ] Bleibt das Flackern auf dem Poco (Durchlauf 3), dort über `chrome://inspect` nachfilmen.
- [ ] Tests grün, Review, Commit auf `feature/leistung`.

## Comments
