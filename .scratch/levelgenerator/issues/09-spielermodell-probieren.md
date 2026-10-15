# 09: Spielermodell und Probieren

**What to build:** Das Spielermodell aus den Reviews wird ein versionierter Teil der Beurteilung. Bisher liegt es
unversioniert in den Review-Ordnern der Pools. Es liefert die Grundlage für das Schliessen. Mit ihm meldet die
Beurteilung den Ausschlussgrund Probieren, in allen Graden.

**Spec:** ../spec.md, Abschnitte „Beurteilung“ (Spielermodell, Ausschlussgründe) und „Feldform“.

**Blocked by:** 04 (Löser schneller), 06 (Feldform und Beurteilung)

**Status:** ready-for-agent

- [ ] Das Spielermodell ist bei den Werkzeugen versioniert und benutzt nur die Feldform.
- [ ] Die Beurteilung liefert seine Teilwerte: die Horizonte (k2, kInf), die Ketten und die Fallunterscheidungen.
- [ ] Probieren liegt vor, wenn die weiten Fast-Lösungen mehr als 60 ‰ aller Strahlbilder der Suche ohne Abschneiden
      ausmachen, oder bei Raten: kInf > 4 oder Kette > 28, jeweils strikt grösser.
- [ ] Mini-Level vergleichen ein Level, das sich durch Schliessen lösen lässt, mit einem Level voller gleichwertiger
      Fast-Lösungen.
- [ ] Auf den 150 fällt kein Level wegen Probieren heraus:
      - Die Grenzfälle 135, 140, 148 und 149 bestehen.
      - Das heutige Maximum von 55,5 ‰ (74 Lichtnetz) wird nachgerechnet.
- [ ] Die Laufzeit der Beurteilung je Level ist gemessen und steht unter `## Comments`. Sie ist wichtig für den
      Generator.
