# 29: Generator: Untergrenze der Quellen

**What to build:** Ab „mittel“ hält jedes Level, das der Generator liefert, die Untergrenze der Quellen aus der
Vorgabe seines Grads ein (`quellen[0]` in `vorgaben.mjs`, heute 2 für „mittel“ bis „sehr schwer“). Oder es ist
begründet, warum die Untergrenze nur ein Startwert ist. Heute prüft der Generator bei den Quellen nur die Obergrenze
`quellen[1]`; Untergrenzen prüft er nur für drehbare Elemente und Ziele.

**Spec:** ../spec.md, Abschnitt „Generator“.

**Blocked by:** 28 (Generator: Kernideen ab „mittel“)

**Status:** ready-for-agent

- [ ] Zuerst gemessen: Wie oft liefern die sieben Aufträge je Grad ab „mittel“ ein Level unter `quellen[0]`, aus je
      mindestens 500 Seeds? Und wie viele Quellen haben die Level im Spiel je Grad, gibt es also mittlere oder
      schwerere Level mit nur einer Quelle?
- [ ] Der Entscheid ist begründet. Entweder hält der Generator die Untergrenze ein: Er verwirft mit eigenem Grund,
      etwa „zu wenige Quellen“, oder er ergänzt vorher eine Quelle. Oder `quellen[0]` ist nur der Startwert, und der
      Kommentar in `vorgaben.mjs` und die README sagen das.
- [ ] Nichts anderes ändert sich: „leicht“ ist für alle sieben Aufträge bitgleich. Ab „mittel“ ergibt jeder Seed,
      dessen Level die Untergrenze schon einhält, dasselbe wie vorher, im Ergebnis und in der Zahl der
      Strahlverfolgungen, gemessen wie im Review von Ticket 28. So bleiben die Herkunftszeilen der Austausch-Level aus
      23–26 nachbaubar.
- [ ] Die Schwellen aus Ticket 28 halten weiter: bei „mittel“ und „schwer“ je Kernidee mindestens 10 Level mit ihr als
      Haupt-Kernidee aus 200 Seeds; bei „sehr schwer“ fünf Kernideen mit je mindestens 3 aus 500 Seeds.
- [ ] Der Generator-Test hält den Entscheid fest, am Beispiel `mittel-falle` mit Seed 278, mit Gegenprobe. Er bleibt
      unter etwa 90 s.
- [ ] Das Ergebnis steht unter `## Comments`. Ändert sich für die Kandidaten von 24–26 etwas, steht dort ein Hinweis.

## Comments

**Anlass (18.10.2026):** Nebenbefund aus der Nachprüfung des Reviews von Ticket 28. Der Nutzer wollte dafür ein
eigenes kleines Ticket.
- `mittel-falle`, Seed 278, liefert ein Level mit einer einzigen Quelle (Schwierigkeit 43,3, Haupt-Kernidee Falle),
  auf `7bf6266` nachgeprüft. Gefunden in den Seeds 201–300; in den übrigen gemessenen Aufträgen und Bereichen ab
  „mittel“ hatte kein Level weniger als zwei Quellen. Laut Nachprüfung war das schon vor Ticket 28 so.
- Wo der Generator heute Grenzen prüft:
  - `quellen[1]`: beim Ergänzen einer neuen Quelle (`schritte.mjs`, `neueQuelle`), in „schwerer“ (`verfeinern.mjs`)
    und beim Andocken (`plan.andocken` in `index.mjs`).
  - `drehbar[0]` und `ziele[0]`: in `zuKlein` (`verfeinern.mjs`) und beim Wachsen in `generiere` (`index.mjs`).
  - `quellen[0]` nur beim Würfeln des Plans (`plan.quellen`) und in `maengel` (`vorgaben.mjs`).
- Der Kopf von `vorgaben.mjs` sagt: Ob der Grad stimmt, entscheidet am Ende allein die Beurteilung; die Vorgaben legen
  nur fest, wo der Generator anfängt. Die Obergrenze hat Ticket 28 (M2) trotzdem durchgesetzt, weil im Spiel kein
  mittleres Level mehr als drei Quellen hat.
- 24–26 sind nicht blockiert. Bis dieses Ticket erledigt ist, nehmen sie keine Kandidaten unter der Untergrenze.
- Messen über `tools/leise.sh` und `tools/bench.mjs generator`, nur bei gleichem `--jobs` vergleichen (Ticket 02). Auf
  einem Rechner mit `LEISE_MAX_CPU=65` gehen `LEISE_CPU=65` und `--jobs 7`.
