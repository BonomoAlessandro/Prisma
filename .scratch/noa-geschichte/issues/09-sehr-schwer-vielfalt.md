# 09: Neue sehr schwere Level statt der Platzhalter

**Spec:** ../spec.md

**Blocked by:** 08

**Status:** ready-for-agent

**What to build:** In «sehr schwer» geht die Vielfalt der Wahl nicht auf (Ticket 03, Entscheid des Nutzers vom
29.10.2026): Die 60 Level haben fast nur 5 Haupt-Kernideen zu je etwa 12, darum steht in vielen Fenstern von 10
aufeinanderfolgenden Leveln dieselbe Haupt-Kernidee drei- oder viermal. Diese Level sind Platzhalter. Ganz am Schluss
werden neue, passende sehr schwere Level generiert und ersetzen so viele Platzhalter, dass die Regel ganz aufgeht:
dieselbe Haupt-Kernidee höchstens zweimal je 10 aufeinanderfolgende Level, auch über Weltgrenzen, mit höchstens 3
Plätzen Abweichung vom Rang nach Schwierigkeit.

- [ ] Ausgangslage aus `tools/geschichte/wahl.json` (`grade["sehr schwer"].verstoesse`): welche Haupt-Kernideen an
      welchen Stellen zu oft stehen, welche fehlen; daraus der Bedarf an neuen Leveln je Haupt-Kernidee und Bereich
      der Schwierigkeit. Zuerst prüfen, was beurteilte, nicht abgelehnte Kandidaten aus Ticket 01 (Lauf `ausbau-noa-1`
      und frühere `ausbau-…`) schon decken; erst den Rest generieren.
- [ ] Generieren mit Haupt-Kernideen, die in «sehr schwer» selten sind (z. B. Lockvogel oder Ideen, die der
      Generator in anderen Graden kennt), im passenden Bereich der Schwierigkeit; über `tools/ausbau.mjs` wie in
      Ticket 01, nur über `tools/leise.sh` mit `LEISE_CPU=50`.
- [ ] Vorauswahl wie in Ticket 01 (Grad «sehr schwer», genau eine Lösung, keinem Level in Spiel und Vorrat zu
      ähnlich), dann ein Lauf der KI-Tester; nur nicht abgelehnte mit gutem Urteil kommen in Frage.
- [ ] Die Wahl (`tools/geschichte.mjs wahl`) nimmt die neuen Level in den Pool; die ersetzten Platzhalter gehen in
      den Vorrat (`tools/vorrat.mjs`). `verstoesse` ist leer, der Test erlaubt in «sehr schwer» keine Verstösse mehr.
- [ ] Titel: Die Plätze behalten ihre Titel; neue Level bekommen einen Schlüssel (`name`) im Stil der übrigen sehr
      schweren (Sternnamen), eindeutig über Spiel und Vorrat und nicht von der Liste entfernter Level.
- [ ] Speicherstand: Ersetzte Level im Fortschritt von «sehr schwer» behandeln (gelöst bleibt gelöst, wenn der Platz
      gleich bleibt, oder bewusst anders; im Ticket festhalten).
- [ ] Probe im Browser: ein Durchgang durch eine Welt von «sehr schwer» mit neuen Leveln.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Comments
