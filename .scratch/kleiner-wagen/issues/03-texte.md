# 03: Texte

**Spec:** ../spec.md

**Blocked by:** 01  (nacheinander in `index.html`)

**Status:** ready-for-agent

**What to build:** Die Texte der Geschichte erzählen vom Kleinen Wagen (Entscheide 13, 14; Abschnitt «Texte» der
Spec). Nur Texte; Bild und Ablauf ändern sich in diesem Ticket nicht.

- [ ] Prolog 2, 4 und 6 nach der Tabelle der Spec (in Prolog 6 «von Spiegel zu Spiegel, von Ort zu Ort»).
- [ ] Die Untertitel bei der Ankunft in den sechs Welten (Reise und Einstieg) nach der Tabelle; die heutigen
      Nachsätze zum Spiel («Lenke es zwischen den Bäumen hindurch» usw.) fallen ganz weg.
- [ ] Meldung «Gelöst» nach dem letzten Level der Sterne: «Der Wagen ist wach» statt «Ganz oben»; der Knopf bleibt.
- [ ] Finale: drei Sätze statt zwei, je mit Warten auf Tippen wie heute.
- [ ] Epilog 3 nach der Tabelle.
- [ ] Unverändert: Prolog 1, 3, 5, Epilog 1, 2, Angebot, Texte des Dorfs, übrige Meldungen «Gelöst» und ihre Knöpfe.
- [ ] Schreibung wie im Spiel: «ss» statt «ß», Anführungszeichen «», Gedankenstrich –.
- [ ] Untertitel auf kleinen Handys (360 × 640, 320 × 568) und quer: kein Text abgeschnitten, nicht mehr Zeilen als
      der längste heutige Untertitel (Bilder in der Probe).
- [ ] Probe: prüft die neuen Texte (Prolog über die Bühne, Untertitel der Einstiege und Reisen, Finale, Epilog);
      die Stelle, die heute «Ganz oben» erwartet, erwartet «Der Wagen ist wach».
- [ ] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `STORY_PROLOG`, `STORY_EPILOG`, `STORY_FINALE`, `STORY_CHAPTERS` (`travel`, `done`).
- Das Finale zeigt jeden Satz von `STORY_FINALE` mit `caption` (wartet auf Tippen).
- Probe: `tests/geschichte-probe.mjs` erwartet heute `'Ganz oben'` beim letzten Level im Wiederholen.

## Comments
