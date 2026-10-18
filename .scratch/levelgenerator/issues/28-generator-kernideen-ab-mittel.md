# 28: Generator: Kernideen ab „mittel“

**What to build:** Ab „mittel“ liefert der Generator für jede der sechs Kernideen genug Level, in denen sie die
Haupt-Kernidee ist. Heute liefern ab „mittel“ fast nur Mischziel und Sammelstelle, Lockvogel gar nichts. Damit kann
der Austausch in den Tickets 24–26 die Regel „dieselbe Haupt-Kernidee höchstens zweimal je 10 Level“ erfüllen.

**Spec:** ../spec.md, Abschnitte „Generator“ und „Effizienz“; „Beurteilung“ (Haupt-Kernidee, Rangfolge); Glossar,
Abschnitt „Kernideen“.

**Blocked by:** 19 (Generator: alle Kernideen), 20 (Generator: Verfeinern)

**Status:** ready-for-agent

- [ ] Zuerst den Bedarf messen: Für die Plätze, die 24, 25 und 26 ersetzen, steht unter `## Comments`, welche
      Haupt-Kernideen die verbleibenden Level in jedem Abschnitt zu 10 Leveln schon haben und wie viele Ersatzlevel je
      Haupt-Kernidee höchstens dazukommen dürfen. Daraus folgt, welche Kernideen je Grad wirklich gebraucht werden.
- [ ] Die Bausteine lassen ab „mittel“ Platz zum Verfeinern (Quellen, offene Strahlen), oder „schwerer“ darf auch an
      Strängen der Kernidee wachsen, ohne die Kernidee zu zerstören, oder beides. Die Wahl ist begründet.
- [ ] Bei „mittel“ und „schwer“ liefert jede der sechs Kernideen aus 200 Seeds mindestens 10 Level, in denen die
      verlangte Kernidee die Haupt-Kernidee ist (nach der Rangfolge der Beurteilung). Erreicht eine Kernidee das nicht,
      ist gezeigt, warum das an der Kernidee selbst liegt, und der Bedarf aus dem ersten Punkt ist trotzdem gedeckt.
- [ ] Bei „sehr schwer“ liefern mindestens fünf Kernideen aus 500 Seeds je mindestens 3 Level mit ihr als
      Haupt-Kernidee, mindestens aber so viele, wie der Bedarf aus dem ersten Punkt verlangt.
- [ ] Nichts wird schlechter: „leicht“ ist für alle sieben Aufträge bitgleich, und Mischziel und Sammelstelle liefern ab
      „mittel“ je CPU-Stunde nicht weniger als heute (gleiches `--jobs`, gleiche Seeds, dieselbe Sitzung).
- [ ] Je Grad ab „mittel“ und je Kernidee gibt es einen Auftrag im Generator-Test; dazu je Grad ein fester Seed für
      mindestens die Kernideen, die der Bedarf verlangt. Der Generator-Test bleibt unter etwa 90 s.
- [ ] Die Ausbeute je Grad und Kernidee (Level, davon mit ihr als Haupt-Kernidee, Level je CPU-Stunde) steht unter
      `## Comments`, ebenso die Hinweise für 24–26.

## Comments

**Anlass (18.10.2026):** Frage aus dem Review von Ticket 20 nach dem Merge mit 19. Der Nutzer hat entschieden, dass
vor den Tickets 24–26 ein eigenes Ticket kommt.

**Hinweise aus den Tickets 19 und 20:**
- Probe nach dem Merge (Ticket 20, „Nach dem Merge mit 19“, Seeds 1–100, ein Prozess):

  | Kernidee | mittel | schwer |
  |---|---:|---:|
  | Mischziel aus zwei Quellen | 55 | 39 |
  | Sammelstelle | 43 | 36 |
  | Falle | 13 | 8 |
  | Abschalten | 3 | 4 |
  | Farben abzählen | 0 | 4 |
  | Lockvogel | 0 | 0 |

  Nachprüfung (Seeds 101–200): `mittel-sammelstelle` 37, `mittel-falle` 18, `mittel-abschalten` 1, Farben abzählen und
  Lockvogel 0; `schwer-falle` 10, `schwer-abzaehlen` 6, `schwer-lockvogel` 0. Bei „sehr schwer“ liefern Sammelstelle
  und Falle je nur 1 von 50 Seeds; praktisch nur das Mischziel liefert (139 von 2000).
- Warum es scheitert:
  - **Lockvogel:** Der Baustein braucht drei Quellen, und alle seine Strahlen enden an Zielen der Kernidee. „mittel“
    erlaubt höchstens 3 Quellen (`vorgaben.mjs`), also bleibt keine Quelle und kein offenes Ende. „schwerer“ öffnet nur
    Ziele ausserhalb der Kernidee (73 von 100: zu klein und kein Zuwachs).
  - **Farben abzählen:** fällt bei „mittel“ zu 77 % an einem Füllteil, bei dem „schwerer“ nichts mehr dazubringt. Der
    Ring belegt drei Quellen und reserviert viele Zellen.
  - **Abschalten:** meist „Kernidee wirkungslos“ oder ein Füllteil, auch nach „schwerer“.
  - **Falle:** meist nicht eindeutig oder nicht eingebaut.
- Mögliche Hebel, nicht vorgegeben:
  - Bausteine, die ab „mittel“ weniger Quellen belegen oder offene Strahlen übrig lassen.
  - Eine Vorgabe, die dem Baustein Quellen dazugibt (`maengel` in `vorgaben.mjs` prüft schon, dass die Vorgabe Platz
    für den Baustein hat).
  - Ein Schritt „schwerer“, der an Strängen der Kernidee wächst und danach prüft, ob sie noch nötig ist.
- **Haupt-Kernidee:** Die Beurteilung wählt sie nach der festen Rangfolge Falle, Abschalten, Farben abzählen,
  Sammelstelle, Lockvogel, Mischziel aus zwei Quellen (Spec, „Weitere Hinweise“). Das Mischziel steht zuletzt, ist
  also nur Haupt-Kernidee, wenn keine andere nötig ist. Ob der Auftrag „verlangte = Haupt-Kernidee“ erzwingen kann,
  ist Sache von 23–26 (Entscheid des Nutzers vom 17.10.2026, Ticket 23); hier wird es nur gezählt.
- **Messen:** `bench.mjs generator --generator neu --accept beurteilung` zählt je Grad und nötiger Kernidee. Nur
  Messungen mit gleichem `--jobs` vergleichen (Ticket 02: die Prozesszahl ändert die CPU-Zeit je Seed). Auf einem
  Rechner mit `LEISE_MAX_CPU=65` gehen `LEISE_CPU=65` und `--jobs 7`.
- Aus dem Review von Ticket 20 (Fund 2, in Ticket 21 notiert): Aussichtslose Versuche von „schwerer“ laufen noch
  durch die Eindeutigkeitssuche. Wird „schwerer“ hier ohnehin umgebaut, lässt sich das gleich mitnehmen.
