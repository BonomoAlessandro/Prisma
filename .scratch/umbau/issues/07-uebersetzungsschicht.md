# 07: Übersetzungsschicht, deutsche Texte, Sprachwahl

**Spec:** ../spec.md

**Status:** ready-for-agent (17.11.2026; startet auf dem Stand von 06, während 06 im Review ist)

**Blocked by:** 06

**What to build:** Alle Texte, die der Spieler sieht, kommen über eine Übersetzungsschicht aus einer JSON-Datei je
Sprache. In diesem Ticket gibt es nur Deutsch, das Spiel sieht genau gleich aus. Dazu kommt die Sprachwahl, damit
Ticket 08 nur noch eine Datei ergänzen muss. **Meilenstein 1** (erster Handytest, der nach 02 entfällt): Danach spielt der Nutzer auf dem Handy die deutsche
Fassung.

- [ ] Modul mit `t('schluessel', { werte })`. Platzhalter wie heute («{Tippe}», «{Drücke lang}» je Gerät) und Werte
      (z. B. «Übung {n} / {N}») gehen darüber. Fehlt ein Schlüssel in einer Sprache, gilt der deutsche Text.
- [ ] `src/texte/de.json` (oder ähnlich) mit allen Texten: Menüs, Kopfzeile, Einstellungen, Übersicht, Band und
      Schritte der Führung, Hinweise nebenbei, Prolog, Reisen, Finale, Epilog, Titel der Level, Seitentitel. Auch
      Texte in den Daten aus Ticket 06 werden zu Schlüsseln.
- [ ] Kein Text, den der Spieler sieht, steht mehr fest im Code. Ein Test sucht nach deutschen Wörtern im Code der
      Oberfläche, die nicht über `t()` laufen (mit Liste bewusster Ausnahmen).
- [ ] Test: Jede Sprachdatei hat genau die Schlüssel von `de.json`, und jeder Platzhalter im Deutschen steht auch in der
      Übersetzung. Die Regeln der Führung (höchstens 18 Wörter und 105 Zeichen je Schritt, 16 Wörter je Hinweis)
      gelten je Sprache.
- [ ] **Sprachwahl:** Beim ersten Start die Sprache des Geräts (`navigator.language`: Deutsch bei `de*`, sonst
      Englisch; solange es `en.json` noch nicht gibt, Deutsch). In den Einstellungen ein Schalter für die Sprache, über
      die Speicherschicht gespeichert. Ein Wechsel wirkt sofort oder nach einem Neuladen, je nachdem, was einfacher und
      sauber ist.
- [ ] `lang` des Dokuments folgt der Sprache.
- [ ] Bildvergleich (auf Deutsch), Golden, alle Tests und Proben grün; der neue Schalter in den Einstellungen bekommt ein
      neues Referenzbild (bewusste Änderung, unter «Comments» festhalten).
- [ ] Der Bildvergleich legt Deutsch fest (z. B. `--lang=de-CH`, `setLocaleOverride` oder `?lang=de`), weil
      Headless-Chrome sonst die Sprache des Rechners bzw. Englisch meldet (Fund Review 01).
- [ ] Begriff «Übersetzungsschicht» in `CONTEXT.md`.

## Comments
