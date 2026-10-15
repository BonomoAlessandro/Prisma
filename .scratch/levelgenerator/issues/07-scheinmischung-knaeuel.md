# 07: Scheinmischung und Knäuel

**What to build:** Die Beurteilung meldet die Ausschlussgründe Scheinmischung und Knäuel, beide in allen
Schwierigkeitsgraden. Jede Meldung trägt den Glossarbegriff und eine Begründung.

**Spec:** ../spec.md, Abschnitt „Beurteilung“, Tabelle der Ausschlussgründe.

**Blocked by:** 06 (Feldform und Beurteilung)

**Status:** ready-for-agent

- [ ] Eine Scheinmischung liegt in drei Fällen vor:
      - (a) Ein Kombinator gibt einen Eingang unverändert aus oder hat nur einen beleuchteten Eingang.
      - (b) Eine Mischung läuft direkt in ein Prisma, das genau die eingehenden Strahlen wieder trennt. Gezählt wird
        nach Strahlen, nicht nach Quellen.
      - (c) Eine Mischung läuft in einen Filter, der nur einen Eingang durchlässt.

      Trägt nur eine Quelle die Mischung, ist das kein Ausschluss.
- [ ] Ein Knäuel liegt vor, wenn benachbarte drehbare Elemente den Wert 1,30 überschreiten oder der Anteil kurzer
      Strahlabschnitte 0,85 überschreitet. Der Anteil zählt nur bei Leveln mit mindestens 12 Abschnitten.
- [ ] Die Begründung nennt das Element und den Fall.
- [ ] Mini-Level decken jeden Fall ab, dazu diese Grenzfälle:
      - genau 1,30 besteht, 1,31 nicht;
      - 11 Abschnitte mit hohem Anteil kurzer Abschnitte bestehen;
      - eine Mischung, die über Spiegel ins Prisma läuft, also nicht direkt, besteht;
      - ein Prisma, das mehr zerlegt, als hineinkam, besteht;
      - der Fall Zenit fällt: drei einzelne Strahlen R, G und B, zwei davon aus derselben Quelle.
- [ ] Auf den 150 ergibt sich die Neuzählung:
      - 30 Level mit Scheinmischung (26 Kombinatoren im Fall a, 6 im Fall b, 1 im Fall c)
      - 3 Level mit Knäuel

      Abweichungen sind begründet.
