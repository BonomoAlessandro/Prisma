# 06: Finale mit Puls durch den Wagen

**Spec:** ../spec.md

**Blocked by:** 05

**Status:** ready-for-agent

**What to build:** Im Finale erwacht der sechste Stern, ein Lichtpuls läuft durch den ganzen Wagen und über die
Deichsel zum Polarstern, der dann antwortet wie heute (Entscheide 12, 16, 19; Ablauf 6 der Spec). Die Überblendung
Wagen in Wagen ins Dorf folgt in Ticket 07, weil sie die Bühne braucht; hier wird nur vorbereitet, dass der Wagen am
Ende richtig im Bild steht.

- [ ] Die Strahlen steigen zum **sechsten Stern** (nicht mehr direkt zum Polarstern); er erwacht mit seinem Ton.
- [ ] Satz 1 «Der letzte Stern erwacht. …»: Ein **Lichtpuls** läuft Stern für Stern durch den Wagen, in der
      Reihenfolge des Erwachens (1 bis 6), mit den sechs Tönen.
- [ ] Satz 2 «Über die Deichsel läuft das Licht bis zum Polarstern.»: Der Puls springt die Linie 6 → 7 hinauf, die
      Linie bleibt gezogen; der **Polarstern flammt auf** und setzt den Schlusston.
- [ ] Satz 3 «Er hat das Zeichen gesehen. Und er antwortet.», danach der heutige Ablauf: Sein Strahl fällt aufs
      Brett, der Aufprall klingt aus, der Blick geht hinauf, Überblendung ins Dorf (vorerst weiter Stern in Stern).
- [ ] Am Ende steht der Wagen im Bild so, wie die Bühne ihn zeigt (Polarstern oben links, Schale unten rechts), der
      ganze Wagen im Bild, in Desktop, Handy hoch und quer.
- [ ] Jeder Satz wartet wie heute auf Tippen; das Finale bleibt nicht überspringbar. Dauer etwa 4 s länger als im
      Vorher-Lauf (ohne die Wartezeit auf Tippen).
- [ ] Nach dem Finale ist der Grad geschafft, der Wagen ganz wach mit allen sieben Linien (Menü, Übersicht, Himmel
      beim Wiederholen).
- [ ] Neuladen mitten im Finale verhält sich wie heute (kein neuer Fehlerfall).
- [ ] Der Sprung «Finale» im Sprungbrett zeigt es im richtigen Stand.
- [ ] Probe: Ablauf und Stand nach dem Finale, Dauer gegen den Vorher-Lauf, Bildzeiten, Bilder von Puls, Polarstern
      und Endbild.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Anhaltspunkte im Code

- `story.finale` (`ascend(0.5, true)`, `STORY_FINALE`, `caption`, Antwort `this.answer`, Kamera hinab und hinauf),
  danach Epilog mit `scene.starAt` (wo der Polarstern der Bühne im Bild steht).
- `prewarmScene(STORY_EPILOG)` im Finale: Die Bühne wird vorgezeichnet, während die Kamera still steht.

## Comments
