# 10: Sprungbrett ausbauen

**Spec:** ../spec.md

**Blocked by:** 09, 11 und die Abnahme durch den Nutzer

**Status:** ready-for-agent

**What to build:** Nach der Abnahme verschwindet das Sprungbrett ganz, damit ADR 0005 im Spiel wieder ohne Ausnahme
gilt (Entscheid 25). Erst danach wird auf Wort des Nutzers nach main gemergt.

- [ ] Nicht beginnen, bevor der Nutzer die Szenen abgenommen hat (mit `?szenen` am Arbeitsrechner und über das Deploy
      des Feature-Branchs auf dem Poco) und Grösse und Helligkeit des Wagens festgelegt sind; seine Werte in den
      Comments festhalten und als feste Werte übernehmen.
- [ ] Entfernen: Knopf «Szenen», Liste, Parameter `?szenen`, das Abschalten des Speicherns, die Parameter zum
      Abstimmen von Grösse und Helligkeit, ihre Stile und Kommentare.
- [ ] Prüfen, dass nichts übrig ist: keine Spur davon im Code, `?szenen` bewirkt nichts, Stand und Bestwerte werden
      normal gespeichert.
- [ ] Der Parameter `?wagen=<faktor>` des Ladezeichens bleibt (er gehört nicht zum Sprungbrett).
- [ ] Alle Tests grün (Probe der Geschichte samt Wagen-Ablauf, Messung der Bühne, übrige Testreihen); Review nach dem
      Ticket.
- [ ] Danach: Merge nach main nur auf Wort des Nutzers, Push nur auf Auftrag.

## Comments
