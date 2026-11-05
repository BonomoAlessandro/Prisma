# 10: Schluss: Schalter weg, ganze Prüfung, Poco, Merge

**Spec:** ../spec.md

**Blocked by:** 09

**Status:** ready-for-agent

**What to build:** Jede Welt hat jetzt ein festes Brett. Der Schalter für die Varianten verschwindet. Danach folgen die
ganze Geschichte als Prüfung, die Messung über alle Welten, der Test des Nutzers auf dem Poco und am Ende der Merge nach
`main`, auf das Go des Nutzers.

- [ ] **Schalter entfernen:** Der Parameter in der Adresse für das Brett und aller Code für Varianten verschwinden. Kein
      Weg bleibt, ein Brett zu wählen, ausser über den Himmel (`?sky=` für Tests). Eine Suche im Code bestätigt das.
- [ ] **Feste Bretter:** Die fünf Blender-Himmel haben ihre festen Bretter, Milchstrasse und Sonnensystem das
      Steinbrett. Ein Logiktest prüft, dass keine der fünf Brett-Angaben mehr `stone` ist.
- [ ] **Ganze Geschichte:** Die Geschichte-Probe mit `--ganz` läuft auf dem Desktop und mit `--handy`, dazu `--dorf`,
      `--uebersicht` und `--menue`. Die Offline-Probe läuft, und alle Logiktests sind grün.
- [ ] **Leistung über alle Welten:** Das Messwerkzeug misst auf dem Desktop und in der Handy-Ansicht. Die Werte stehen
      im Ticket, verglichen mit dem Stand vor Ticket 01. Die Grenze für alles vorab Gespeicherte (4,5 MB) wird
      eingehalten.
- [ ] **main holen:** Der aktuelle `main` wird in den Branch geholt, zum Beispiel mit dem Kleinen Wagen vom anderen
      Rechner. Konflikte werden gelöst, und die Tests laufen danach noch einmal.
- [ ] **Poco:** Der Nutzer testet auf dem Poco F4 GT. Seine Rückmeldung steht unter «Comments», Befunde werden behoben.
- [ ] **Doku:**
      - PLAN 1.1 wird mit einer kurzen Zusammenfassung abgehakt.
      - Die Spec bekommt ihren Schlussstand.
      - Das Glossar wird geprüft: Stimmen «Brett» und «Steinbrett» noch?
- [ ] **Merge:** Der Merge nach `main` kommt erst auf das Go des Nutzers. Gepusht wird nur, wenn er es sagt.
- [ ] Das Review nach dem Ticket ist gelaufen.

## Hinweise

- **Render:** Neue Dateien ausserhalb von `backgrounds/` müssen in den Build-Befehl auf Render und in `sw.js`. Ein Test
  prüft `sw.js`.
- Der Krater-Branch und der Kleine Wagen können `main` bis dahin verändert haben. Vor dem Holen fetchen.
