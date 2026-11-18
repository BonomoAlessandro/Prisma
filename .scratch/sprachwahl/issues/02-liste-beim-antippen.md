# 02: Liste beim Antippen

**Spec:** ../spec.md

**Status:** ready-for-agent (nach Ticket 01; der Baustein wird schon parallel gebaut)

**Blocked by:** 01 (Ticket 03 ist erledigt: Der Schalter bleibt oben rechts, die Liste geht nach unten auf)

**What to build:** Heute zeigt der Schalter oben rechts im Menü den Globus und die aktuelle Sprache («DEUTSCH»). Ein
Klick wechselt direkt zur nächsten Sprache, ohne dass man sieht, welche das ist. Neu öffnet der Schalter eine kleine
Liste aller Sprachen, in der man wählt (vom Nutzer gewählt, siehe Spec):

```
        🌐 DE ▾
   ┌─────────────┐
   │ ✓ Deutsch   │
   │   English   │
   └─────────────┘
```

- [ ] **Schalter:** Globus, das Kürzel der aktuellen Sprache und ein kleines ▾ (als Zeichen im Strich der übrigen
      Zeichen des Menüs, kein Schriftzeichen), so zurückhaltend wie heute. Statt «DEUTSCH» steht nur noch «DE», statt
      «ENGLISH» nur «EN» (Wunsch des Nutzers 18.11.2026, damit der Schalter auf dem Handy weniger Platz braucht). Das
      Kürzel ist das der Sprachdatei in Grossbuchstaben. Das `aria-label` nennt weiter den vollen Namen. Antippen oder
      Klicken öffnet die Liste. Ist die Liste offen, schliesst ein erneutes Antippen sie wieder.
- [ ] **Liste:** alle Sprachen mit Datei (`VORHANDEN`, Deutsch zuerst), jede mit ihrem Namen in ihr selbst
      («Deutsch», «English»). Die aktuelle Sprache hat ein Häkchen. Antippen einer anderen Sprache wechselt sie (Ticket
      01, ohne Neuladen) und schliesst die Liste. Danach steht der Schalter in der neuen Sprache. Antippen der
      aktuellen Sprache schliesst die Liste nur.
- [ ] **Schliessen:** Klick oder Tippen ausserhalb, Esc (schliesst nur die Liste, nicht das Menü), erneutes Antippen
      des Schalters. Beim Ausblenden des Menüs schliesst sie ohne Animation. Eine offene Rückfrage «Von vorn» und die
      Liste sind nie gleichzeitig offen.
- [ ] **Tastatur und Bildschirmleser** nach dem Muster «Menu Button» (WAI-ARIA APG):
      - Der Schalter hat `aria-haspopup` und `aria-expanded`, die Liste und ihre Einträge passende Rollen, die aktuelle
        Sprache `aria-checked` bzw. `aria-current`.
      - Enter, Leertaste und Pfeil runter öffnen die Liste und setzen den Fokus auf die aktuelle Sprache. In der Liste
        gehen Pfeile, Pos1 und Ende. Enter und Leertaste wählen. Esc und Tab schliessen. Danach liegt der Fokus wieder
        auf dem Schalter.
      - Die Tastensteuerung des Menüs (Pfeile über Knopf und Reiter, `taste` in `menue.js`) gilt, solange die Liste zu
        ist, und greift nicht hinein, solange sie offen ist.
- [ ] **Gestalt** im Stil des Menüs: Schrift Jost, Farben und Linien der Sternkarte, eher wie die Rückfrage «Von vorn»
      als wie ein Systemmenü. Sanftes Ein- und Ausblenden. Mit `prefers-reduced-motion` ohne Bewegung.
- [ ] **Grössen:** Desktop, Handy hochkant, Handy quer, Poco (393 × 873, Pixeldichte 2,75) und 360 × 640, auch mit
      dem Massstab `SEITE`. Die Liste bleibt ganz im Bild, deckt keinen Teil des Menüs ab, der wichtig bleibt, und hat
      auf dem Handy Trefferflächen von mindestens etwa 44 px Höhe. Der Fokusrahmen erscheint wie im übrigen Menü erst
      nach einer Taste.
- [ ] **Nur eine Sprache:** kein ▾, keine Liste, ein Klick tut nichts.
- [ ] **Tests, gezielt und ohne grosse Läufe** (Entscheid des Nutzers 18.11.2026; die Änderung betrifft nur das
      Menü):
      - Eine Probe im Browser, ein Lauf: öffnen, wählen (Wechsel ohne Neuladen), aktuelle wählen, Esc, Klick
        ausserhalb, erneutes Antippen, Tastatur (Pfeile, Pos1, Ende, Enter, Tab), Fokus danach, Menü ausblenden mit
        offener Liste. Auf Desktop und Handy hochkant.
      - Node-Tests grün.
      - Referenzbilder des Menüs einmal nachführen (das ▾ am Schalter): nur der Ablauf mit dem
        Menü (`--nur welt-3-4 --write`, SwiftShader und `--gpu`). Nur die Bilder `menue` übernehmen, andere Bilder
        dieses Ablaufs, die sich durch Rauschen ändern, mit `git restore` zurücksetzen. Kein ganzer Bildvergleich,
        keine neue Ansicht.
- [ ] `appVersion` in `package.json` auf `2026-11-18 sprachwahl-2`.
- [ ] README und Kopfkommentar von `menue.js` (Beschreibung des Schalters), `CONTEXT.md`, falls dort der Schalter
      steht.

## Hinweise

- Der Schalter steht heute in `src/seite/oberflaeche/menue.js` (`.menue-sprache`, `ICONS.sprache`), der Stil in
  `src/stil/menue.css` (`.menue-sprache`, mit eigenen Regeln für Handy hochkant und quer).
- Vorbild für Ein- und Ausblenden, Fokus und Tasten ist die Rückfrage «Von vorn» (`oeffneFrage`, `schliesseFrage`,
  `taste`).
- Prüfläufe wie in Ticket 01 (siehe `CLAUDE.md`, Abschnitt Prüfläufe). Die Referenzbilder schreibt der Umsetzer erst,
  wenn alle übrigen Bilder grün sind, und nennt im Bericht, welche neu sind.
- Nicht committen. Der Koordinator committet nach dem Review.
