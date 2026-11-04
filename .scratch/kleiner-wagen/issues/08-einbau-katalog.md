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

**04.11.2026, Wahl des Nutzers (Ticket 02):**
- **Menü F** «Sternkarte mit Reitern»: ein grosser Wagen wie auf einer Sternkarte (Kreise um den Polarstern, Namen der
  Welten an ihren Sternen, Punktgrösse nach echter Helligkeit, noch fehlende Linien gestrichelt), die vier Grade als
  Reiter daneben (Handy hoch: oben als Segmente), darunter Stand, Knopf (Beginnen/Fortsetzen/Übersicht) und «Von vorn».
- **Übersicht C** «Sternhaufen»: um jeden Stern die zehn Level seiner Welt als kleine Sterne (gelöst hell, nächstes mit
  Ring, gesperrt blass), «Im Dorf» als eigener Haufen; Tippen auf einen Haufen zeigt seine Level als Liste mit
  Bestwerten. Auf dem Handy wird der ganze Haufen gewählt, nicht das einzelne Level.
- **Leiste C** «Zeichen im Wagen», mit Anpassung des Nutzers: Kicker und Untertitel **senkrecht in der Mitte** des
  Bildschirms; der Wagen mit den Zeichen der Welten bleibt **unten am Rand**, wo die Leiste heute steht (Nutzer: «Das
  Sternzeichen sollte noch immer wie am Anfang am unteren Rand bleiben»); das getragene Licht (Lichtpunkt) **deutlich
  weiter oben**, mit gut sichtbarem Abstand zum Text. Gilt für die Untertitel bei der Ankunft in einer Welt (die mit Leiste). Im Spiel
  heisst das auch: Während dieser Untertitel steht, bleibt der Lichtpunkt im oberen Teil des Bilds (Kamera bzw. Flug
  aus Ticket 05 entsprechend).
- Vorlage ist der Katalog (`katalog/katalog.html`, Varianten F, C, C); das Spiel ist massgebend für Bedienung,
  Tastatur, Fokus und Texte.
