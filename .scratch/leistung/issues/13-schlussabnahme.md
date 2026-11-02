# 13: Schlussabnahme (Handy-Durchlauf 3)

**Spec:** ../spec.md

**Blocked by:** 08, 09, 10, 11, 12, 14, 15, 16, 17
(Fische pixelig?, Glühwürmchen beim Einflug in den Wald, Flackern in der ersten Noa-Szene, Fische ruckeln)

**Status:** ready-for-agent

**What to build:** Der Abschluss des Vorhabens Leistung: alles geprüft, der Stand auf dem Poco gemessen, die Doku
nachgeführt. Gebaut wird nichts Neues.

- [ ] Alle Tickets 08–12 (und die nachgetragenen) sind `resolved` oder `wontfix` mit Begründung.
- [ ] Alle Tests grün: `logic`, `golden`, `hall`, `beurteilung`, `generator`, `geschichte`, `offline`, `screenshot`,
      `start-probe`, `geschichte-probe` (`--start`, `--grad leicht --welten 2 --finale leicht`, `--handy`, `--ganz`),
      `leerlauf-probe`, `leistung-probe` (headless Desktop und `--handy`, `--ersatzmass`); keine Warnung «Weckstelle
      fehlt».
- [ ] Referenzdurchlauf im echten Chrome-Fenster auf dem Arbeitsrechner, ungedrosselt und mit Handy-Emulation 4× (und
      6× zur Information), dazu die Messprobe aller Bereiche aus 07 (alle sechs Welten, Reisen, Finale, Epilog, Menü,
      Übersicht, Feier, Kamera ziehen, Grösse/Drehen). Werte unter `## Comments`, Vergleich mit 07.
- [ ] `APP_VERSION` nachführen (`index.html` und `sw.js`), Stand auf `feature/leistung` pushen, unter `## Comments`
      **«bereit für Handy-Durchlauf 3 (Schluss), bitte auf Render deployen»**.
- [ ] Ergebniskarte vom Poco (Nutzer). Abnahme laut Spec: p95 ≤ 18,3 ms und kein Bild über 33 ms ausser markiertem
      Laden; Zeichnen (Dauerlast, 08) ≤ 8 ms; `adaptiv 1.00, Umbauten 0`; Spiegel und Skybox scharf (Nutzer).
      Dazu im Blick: Seitenstart (10), Reise und Einstieg (09), Menü «gez/s ruhig» 10.
      Nutzer achtet auf: Fische glatt **und ruhig** (14, 17 – 17 wird erst damit `resolved`), kein Flackern in der
      ersten Noa-Szene (16), Glühwürmchen beim Einflug in den Wald (15), auf der Karte kein «stetige 60 aus».
- [ ] Zeichnen am Strand (11): reicht es auf dem Poco nicht auf 8 ms, dem Nutzer Variante A (kleiner sichtbarer
      Abstrich: Bloom ab Viertelauflösung, Wasser in halber Auflösung, Pinsel bzw. Spiegel-MSAA auf dem Handy aus;
      Liste in Ticket 11, zweite Runde) gegen Variante B (stetige 30 im Level) mit Bildern nebeneinander vorlegen.
- [ ] Bekannte Lücken vom Arbeitsrechner prüfen und je als eigenes Ticket oder `wontfix` festhalten:
      `geschichte-probe --uebersicht --dorf` scheitert an «Spiel → Übersicht» > 100 ms (schon vor 08–17);
      Menü aus dem Spiel öffnen: Hänger 200–250 ms «ohne Script», vorher wie nachher (Befund Ticket 12).
- [ ] README (Messwerkzeug, Dauerlast-Mass) und PLAN.md nachführen; Tabelle der Tickets in `spec.md` mit dem Endstand.
- [ ] **Kein Merge nach `main`**, bis der Nutzer es sagt.

## Comments
