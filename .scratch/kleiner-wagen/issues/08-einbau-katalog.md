# 08: Einbau der gewählten Varianten (Menü, Übersicht, Leiste)

**Spec:** ../spec.md

**Blocked by:** 02 (Wahl des Nutzers), 07  (nacheinander in `index.html`)

**Status:** ready-for-agent

**What to build:** Was der Nutzer im Skizzenkatalog (Ticket 02) gewählt hat, kommt ins Spiel: der Wagen im Menü, in
der Übersicht und in der Leiste unter dem Untertitel (Entscheid 9, 17). Was genau, steht in den Comments von
Ticket 02; ohne diese Wahl nicht beginnen.

- [ ] **Menü** nach der gewählten Variante; Stand je Grad aus dem Wagen-Modul. Braucht sie die Zahl der wachen
      Sterne, bekommt die Schnittstelle des Menüs dieses Feld; das Menü bleibt ohne Abhängigkeit vom übrigen Spiel.
      Bedienung, Fokus, «Weiter», «Von vorn» mit Rückfrage und Tastatur unverändert.
- [ ] **Übersicht** nach der gewählten Variante; Bestwerte, Sperren und Wiederholen unverändert.
- [ ] **Leiste unter dem Untertitel** nach der gewählten Variante (falls nicht «wie heute» gewählt).
- [ ] Der Moment, in dem ein Stern neu aufleuchtet, so wie im Katalog gewählt (etwa beim ersten Öffnen des Menüs nach
      einem Erwachen), falls Teil der Wahl.
- [ ] Desktop, Handy hoch und quer, kleine Handys (360 × 640, 320 × 568): nichts abgeschnitten, Ziele mindestens
      44 px.
- [ ] Leistung: Menü und Übersicht öffnen nicht langsamer als heute (Vorwärmen am Startbildschirm bleibt wirksam).
- [ ] Die Bausteine in `.scratch/noa-geschichte/bausteine/` nachziehen oder als überholt markieren (das Spiel ist
      massgebend).
- [ ] Probe: Abläufe für Menü und Übersicht grün, Stand des Wagens im Menü je Grad (nicht begonnen, mitten im
      Durchgang, geschafft), Bilder in allen Formaten.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `createMenu` (Schnittstelle `show(stand)`, `stand.grade[g] = { stand, welt, geloest }`), `story.menuStand`,
  `menu.vorwaermen`.
- `createUebersicht`; Leiste `story.fillPath` mit `STORY_STATIONS`.
- Probe: `tests/geschichte-probe.mjs --menue`, `--uebersicht`.

## Comments
