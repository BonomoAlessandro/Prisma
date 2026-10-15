# 08: Füllteil und Zerfall

**What to build:** Die Beurteilung meldet die Ausschlussgründe Füllteil und Zerfall, beide erst ab dem Grad „mittel“.
Leichte Level dürfen aus einfachen Strängen bestehen.

**Spec:** ../spec.md, Abschnitt „Beurteilung“, Tabelle der Ausschlussgründe.

**Blocked by:** 06 (Feldform und Beurteilung)

**Status:** ready-for-agent

- [ ] Ein Füllteil ist ein Strang mit einer Quelle, höchstens 3 Spiegeln und eigenem Ziel, bei dem gilt: Dreht man
      ausgehend von der Lösung irgendein drehbares Element des Strangs einzeln in eine andere Stellung, ändert sich das
      Licht nie, das fremde Strahlen an andere Ziele bringen.
- [ ] Ein Zerfall liegt vor bei mehr als einer Gruppe von Zielen, wenn die zweite Gruppe mindestens 3 drehbare Elemente
      hat. Ein gemeinsames Mischziel verbindet Gruppen.
- [ ] Den Grad liefert die Beurteilung. Bis zur Eichung (Tickets 12 und 15) lässt er sich von aussen vorgeben, mit den
      vorläufigen Graden nach heutigem Platz.
- [ ] Die Begründung nennt den Strang bzw. die Gruppen.
- [ ] Mini-Level testen diese Fälle:
      - ein Strang, den ein fremder Strahl kreuzt: kein Füllteil;
      - ein isolierter Strang in „leicht“: erlaubt;
      - derselbe Strang in „mittel“: Ausschluss;
      - ein Strang mit 4 Spiegeln: kein Füllteil;
      - zwei Gruppen mit gemeinsamem Mischziel: kein Zerfall;
      - eine zweite Gruppe mit 2 Elementen: kein Zerfall.
- [ ] Auf den 150 ergeben sich ab „mittel“ 6 Level mit Füllteil und 6 mit Zerfall, wie in der Neuzählung. Abweichungen
      sind begründet.
