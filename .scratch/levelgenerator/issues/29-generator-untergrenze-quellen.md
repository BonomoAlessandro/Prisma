# 29: Generator: Untergrenze der Quellen

**What to build:** Ab „mittel“ hält jedes Level, das der Generator liefert, die Untergrenze der Quellen aus der
Vorgabe seines Grads ein (`quellen[0]` in `vorgaben.mjs`, heute 2 für „mittel“ bis „sehr schwer“). Oder es ist
begründet, warum die Untergrenze nur ein Startwert ist. Heute prüft der Generator bei den Quellen nur die Obergrenze
`quellen[1]`; Untergrenzen prüft er nur für drehbare Elemente und Ziele.

**Spec:** ../spec.md, Abschnitt „Generator“.

**Blocked by:** 28 (Generator: Kernideen ab „mittel“)

**Status:** resolved

- [x] Zuerst gemessen: Wie oft liefern die sieben Aufträge je Grad ab „mittel“ ein Level unter `quellen[0]`, aus je
      mindestens 500 Seeds? Und wie viele Quellen haben die Level im Spiel je Grad, gibt es also mittlere oder
      schwerere Level mit nur einer Quelle?
- [x] Der Entscheid ist begründet. Entweder hält der Generator die Untergrenze ein: Er verwirft mit eigenem Grund,
      etwa „zu wenige Quellen“, oder er ergänzt vorher eine Quelle. Oder `quellen[0]` ist nur der Startwert, und der
      Kommentar in `vorgaben.mjs` und die README sagen das.
- [x] Nichts anderes ändert sich: „leicht“ ist für alle sieben Aufträge bitgleich. Ab „mittel“ ergibt jeder Seed,
      dessen Level die Untergrenze schon einhält, dasselbe wie vorher, im Ergebnis und in der Zahl der
      Strahlverfolgungen, gemessen wie im Review von Ticket 28. So bleiben die Herkunftszeilen der Austausch-Level aus
      23–26 nachbaubar.
- [x] Die Schwellen aus Ticket 28 halten weiter: bei „mittel“ und „schwer“ je Kernidee mindestens 10 Level mit ihr als
      Haupt-Kernidee aus 200 Seeds; bei „sehr schwer“ fünf Kernideen mit je mindestens 3 aus 500 Seeds.
- [x] Der Generator-Test hält den Entscheid fest, am Beispiel `mittel-falle` mit Seed 278, mit Gegenprobe. Er bleibt
      unter etwa 90 s.
- [x] Das Ergebnis steht unter `## Comments`. Ändert sich für die Kandidaten von 24–26 etwas, steht dort ein Hinweis.

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

**Umgesetzt 18.10.2026.** Gearbeitet im Worktree `.claude/worktrees/agent-a35f2488d43def989` auf dem Branch
`ticket/29-untergrenze-quellen` (von `origin/feature/levelgenerator`, Stand `10e3041`). Rechner i7-9750H (12 logische
Kerne), Node 22.12.0. Alle Läufe über `leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65`, nacheinander, alle Messungen
mit 7 Prozessen. Gemessen wie im Review von Ticket 28: je Seed ein Hash des ganzen Ergebnisses von `generiere` (Level
samt Beurteilung, sonst Grund) und die Zahl der Strahlverfolgungen (`L.traceBeams`), dazu die Quellen des Levels.
Skripte im Scratchpad unter `t29\` (`arbeit.mjs` nach `review28\arbeit.mjs`, mit 7 Prozessen in Blöcken zu 25
Seeds; `auswerten.mjs`). „vorher“ ist eine Kopie von `10e3041`.

**Gemessen** (vorher, Seeds 1–500 je Auftrag; Level, davon mit 1 / 2 / 3 / 4 Quellen):

| Auftrag | mittel | schwer | sehr schwer |
|---|---|---|---|
| ohne Kernidee | 37: 0 / 22 / 15 | 99: 0 / 18 / 54 / 27 | 29: 0 / 3 / 15 / 11 |
| Mischziel | 279: 0 / 0 / 279 | 173: 0 / 0 / 44 / 129 | 40: 0 / 0 / 4 / 36 |
| Abschalten | 37: 0 / 4 / 33 | 41: 0 / 0 / 9 / 32 | 8: 0 / 0 / 2 / 6 |
| Farben abzählen | 127: 0 / 0 / 127 | 151: 0 / 0 / 5 / 146 | 21: 0 / 0 / 0 / 21 |
| Sammelstelle | 201: 0 / 27 / 174 | 171: 0 / 7 / 60 / 104 | 16: 0 / 0 / 3 / 13 |
| Falle | 76: **2** / 52 / 22 | 46: 0 / 15 / 23 / 8 | 6: 0 / 0 / 5 / 1 |
| Lockvogel | 263: 0 / 0 / 263 | 126: 0 / 0 / 88 / 38 | 0 |

- Unter `quellen[0]` liegen nur 2 von 1947 Leveln, beide von `mittel-falle`: Seed 278 (Schwierigkeit 43,3) und Seed
  412 (52,1), beide mit der Falle als Haupt-Kernidee. Also 2 von 500 Seeds dieses Auftrags, in den übrigen 20
  Aufträgen keines. Mit Ziel-Schwierigkeit (je Seeds 1–500): `mittel-falle` 43–50 1 von 45 (Seed 278),
  `mittel-mischziel` 50–58 0 von 194. Die Obergrenze hält jedes Level ein (Ticket 28, M2).
- Ursache (instrumentierte Kopie, `t29\warum.mjs`): Der Baustein Falle setzt eine Quelle mit Mischlicht, das Ergänzen
  eine zweite. Das Festigen nimmt sie wieder weg, weil ohne sie jedes Ziel dasselbe Licht bekommt (wirkungslos). Bei
  Seed 278 setzt danach auch „schwerer“ zweimal eine neue Quelle, und das Festigen nimmt sie jedes Mal wieder weg.
- **Level im Spiel** (150 nach dem Tutorial, Grad aus `index.html`; Quellen 1 / 2 / 3 / 4): leicht 31 Level mit 5 / 17
  / 9 / 0 (eine Quelle: Plätze 1, 5, 6, 7, 10), mittel 74 mit 0 / 34 / 40 / 0, schwer 32 mit 0 / 11 / 20 / 1, sehr
  schwer 13 mit 0 / 5 / 7 / 1. Kein Level ab „mittel“ hat nur eine Quelle.

**Entscheid: verwerfen**, mit dem Grund „zu wenige Quellen“, erst am fertigen Level (`index.mjs`: nach der vollen
Beurteilung, statt es zu liefern). Begründung:
- **Nicht nur Startwert:** Im Spiel hat kein Level ab „mittel“ eine einzige Quelle. Ein mittleres Ersatzlevel mit einer
  Quelle fiele also auf, auch den KI-Testern in 24. Das ist derselbe Grund, aus dem Ticket 28 (M2) die Obergrenze
  durchgesetzt hat.
- **Verwerfen statt Quelle ergänzen:** Verworfen werden 2 von 76 Leveln von `mittel-falle` (Seeds 1–500), sonst
  keines. Die Falle bleibt bei „mittel“ mit 31 Haupt-Leveln aus Seeds 1–200 weit über der Schwelle von 10 (Seeds 278
  und 412 liegen ausserhalb dieses Bereichs). Rechenzeit kostet das Verwerfen nicht: Diese Seeds rechneten schon bis
  zur vollen Beurteilung, und das Zählen der Quellen braucht keine Strahlverfolgung. Eine Quelle zu ergänzen wäre ein
  neuer Schritt des Verfeinerns: eine Quelle samt eigenem Strang, die einem Ziel Licht bringt (sonst nimmt das
  Festigen sie wieder weg, wie bei Seed 278 dreimal), dann neu festigen und beurteilen, und am Ende stünde ein anderes
  Level. Das wäre viel Code und Rechenzeit für höchstens 2 Level je 500 Seeds.
- **Warum am Ende:** Bis zum fertigen Level kann „schwerer“ noch Quellen setzen und das Festigen welche wegnehmen.
  Prüfte der Generator früher, etwa vor der Beurteilung, änderte er auch Seeds, deren Level am Ende genug Quellen hat
  oder die aus einem anderen Grund nichts liefern, und mit ihnen die Herkunftszeilen. Am Ende ändern sich nur die Seeds,
  deren Level unter der Untergrenze läge. In „leicht“ ist die Untergrenze 1, und ein Level ohne Quelle hätte keine
  Ziele. Dort greift die Prüfung also nie.

**Nichts anderes ändert sich** (vorher gegen nachher, je Seed Hash und Strahlverfolgungen, Seeds 1–500):
- **„leicht“:** die sieben Aufträge und dazu „leicht“ mit den Ziel-Schwierigkeiten 33–43 und 20–30: 4500 von 4500
  gleich.
- **ab „mittel“:** die 21 Aufträge und dazu `mittel-falle` 43–50 und `mittel-mischziel` 50–58: 11497 von 11500
  gleich. Anders sind genau die drei Ergebnisse unter der Untergrenze (`mittel-falle` Seeds 278 und 412, mit 43–50
  Seed 278): vorher ein Level mit einer Quelle, nachher „zu wenige Quellen“, mit gleich vielen Strahlverfolgungen (2729,
  2056, 2729). Die Summe der Strahlverfolgungen ist in jedem Auftrag gleich.

**Schwellen aus Ticket 28** (nachher, Haupt-Level; gleich wie vorher und wie in Ticket 28):
- mittel (Seeds 1–200): Mischziel 111, Abschalten 15, Farben abzählen 43, Sammelstelle 64, Falle 31, Lockvogel 85.
- schwer (Seeds 1–200): Mischziel 52, Abschalten 14, Farben abzählen 50, Sammelstelle 54, Falle 18, Lockvogel 24.
- sehr schwer (Seeds 1–500): Mischziel 26, Farben abzählen 14, Abschalten 7, Falle 6, Sammelstelle 5, Lockvogel 0. Fünf
  Kernideen haben also je mindestens 3.
- `mittel-falle` über Seeds 1–500: 74 statt 76 Level, alle mit der Falle als Haupt-Kernidee.

**Tests** (über `leise.sh`, Wanduhr), alle grün:

| Lauf | Ergebnis | Dauer |
|---|---|---:|
| `node tests/generator.test.mjs` | 30 Tests (578 Aufträge, 369 Level; Erzeugen 47,6 s) | 72 s |
| `node tests/golden.mjs` | ok | 2 s |
| `node tests/logic.test.mjs` | 548 Tests | 28 s |

- Neu im Generator-Test: Jedes gelieferte Level hat so viele Quellen, wie die Vorgabe seines Grads verlangt (beide
  Grenzen, alle Grade). Dazu `ZU_WENIGE_QUELLEN`: `mittel-falle` mit Seed 278 liefert kein Level, Grund „zu wenige
  Quellen“. Gegenprobe: Der feste Seed 3 desselben Auftrags liefert weiter ein Level mit mindestens zwei Quellen.
  Derselbe Test auf `10e3041` (Kopie) scheitert genau an diesen beiden Prüfungen („mittel mit Falle, Seed 278: 1
  Quellen, Vorgabe 2–3“), die übrigen 28 Tests laufen durch.
- Beurteilung, Levelliste und KI-Tester laufen ohne den Generator. Ihre Tests habe ich darum nicht neu laufen lassen.

**Hinweise:**
- Für 24 steht ein Hinweis dort: `mittel-falle` Seeds 278 und 412 liefern kein Level mehr, alle übrigen Seeds dasselbe.
  Für 25 und 26 ändert sich nichts: In Seeds 1–500 hatte kein Level von „schwer“ oder „sehr schwer“ weniger als zwei
  Quellen.
- Geändert (Commit `0fefff9`): `tools/generator/index.mjs` (Prüfung und Kopf), Kommentar in
  `tools/generator/vorgaben.mjs`, README („Vier Bedingungen“ und Generator-Test), `tests/generator.test.mjs`; dazu
  hier und in Ticket 24.

**Review 18.10.2026** (Reviewer-Agent, im selben Worktree, Stand `931fa08`; Skripte im Scratchpad unter
`review29\`). Alle Läufe über `leise.sh` mit `LEISE_MAX_CPU=65 LEISE_CPU=65`, Messungen mit 7 Prozessen.
- **Geprüft:** `git diff 10e3041 931fa08`, also die Prüfung und den Kopf in `index.mjs`, den Kommentar in
  `vorgaben.mjs`, README, Test und den Hinweis in 24.
  - Die Prüfung steht nur im Zweig `!fehlt`, nach der vollen Beurteilung, und ersetzt dort das Liefern. Jeder Seed, der
    vorher nichts lieferte oder ein Level mit mindestens `quellen[0]` Quellen, rechnet also genau wie vorher; `bau.art`
    ist ein Filter ohne Strahlverfolgung. Das Level stammt aus demselben Stand des Baus (`startstellung`), die Zahl der
    Quellen ist dieselbe.
  - Mit Ziel-Schwierigkeit läuft dieselbe Schleife, es gibt keinen eigenen Pfad. In „leicht“ ist die Untergrenze 1:
    Ohne Quelle hat kein Ziel Licht, das Festigen endet mit „keine Ziele“; die Prüfung greift dort nie.
  - Gründe: `bench.mjs` (die Abnahme gibt `c.fail` unverändert weiter) und `generiere.mjs` zählen sie als Text.
    „zu wenige Quellen“ ist ein eigener Grund, kein „Abnahme: …“, und gleicht keinem anderen.
- **Entscheid** tragfähig, mit Zahlen bestätigt. Instrumentierte Kopie von `931fa08` (`patche.mjs`, `instr.mjs`): je
  Durchgang des Verfeinerns die Quellen im Bau, Strahlverfolgungen und CPU-Zeit. Gemessen die 21 Aufträge ab „mittel“
  mit Seeds 1–100, `mittel-falle` und `mittel-falle` 43–50 mit Seeds 1–500, zusammen 3000 Seeds; je Seed gleich wie in
  der Messung des Entwicklers (`t29\nachher-ab.json`).
  - In 64 Fällen (Auftrag und Seed) liegt der Bau in einem Durchgang unter der Untergrenze, nur bei `mittel` (4) und
    `mittel-falle` (27, mit 43–50 33). Davon liefern 13 am Ende doch ein Level mit 2 oder 3 Quellen, weil „schwerer“
    eine Quelle nachsetzt. 3 ergeben „zu wenige Quellen“, die übrigen scheitern aus anderen Gründen. Eine frühere
    Prüfung änderte also Seeds, deren Level die Grenze einhält.
  - Sparen liesse sich ohnehin kaum etwas. Eine Prüfung ab dem ersten Durchgang unter der Grenze spart höchstens
    0,18 % der Strahlverfolgungen (0,29 % der CPU-Zeit). Eine Prüfung vor der vollen Beurteilung im letzten erlaubten
    Schritt spart nichts, der Fall kommt nicht vor. Die volle Beurteilung der verworfenen Seeds kostet 679 von 254 Mio.
    Strahlverfolgungen. „Am Ende“ kostet also nichts Nennenswertes.
  - „Quelle ergänzen“ und „nur Startwert“ sind sauber abgewogen. Eigene Zählung der Level im Spiel (Quellen 2 / 3 / 4):
    mittel 34 / 40 / 0, schwer 11 / 20 / 1, sehr schwer 5 / 7 / 1, keines ab „mittel“ mit einer Quelle; leicht hat 5
    mit einer.
- **Bitgleich**, eigene Stichprobe gegen `10e3041` (eigene Kopie über `git archive`; je Seed Hash des ganzen
  Ergebnisses und Strahlverfolgungen, `review29\arbeit.mjs`, `auswerten.mjs`):
  - „leicht“: die sieben Aufträge und beide Ziel-Schwierigkeiten, Seeds 501–1000: 4500 von 4500 gleich.
  - ab „mittel“: die 21 Aufträge mit Seeds 501–600, dazu `mittel-falle` 601–1500, `mittel-falle` 43–50 501–1000,
    `mittel-mischziel` 50–58 und `schwer-falle` 60–75 je 501–600: 3696 von 3700 gleich. Anders sind genau
    `mittel-falle`, Seeds 1123, 1179, 1422 und 1451: vorher ein Level mit einer Quelle, nachher „zu wenige Quellen“, mit
    gleich vielen Strahlverfolgungen. Nachher hält jedes der 625 Level beide Grenzen ein.
  - Die Basis des Entwicklers (`t29\basis`) hat `tools/` und `index.html` wie `10e3041`. Seine Auswertung ergibt die
    Zahlen oben.
- **Test:** Er prüft, was er soll. Gegenprobe: Der Generator-Test des Worktrees (mit den Änderungen unten) scheitert
  auf `10e3041` genau an den beiden Tests der Quellen, die übrigen 28 laufen durch.
- **Doku:** Kopf von `index.mjs`, `vorgaben.mjs`, README und der Hinweis in 24 stimmen. Lesbarkeit und Stil passen zum
  umgebenden Code.
- **Im Review behoben:**
  - `7ed610d`: Die Gegenprobe verlangt jetzt genau `quellen[0]` Quellen (Seed 3 hat 2), zeigt also, dass ein Level an
    der Grenze geliefert wird. Dazu der Randfall „leicht“: Level mit einer Quelle liefert er weiter. Kopf des Tests,
    `ZU_WENIGE_QUELLEN` und README nachgeführt. In `vorgaben.mjs` ist das Festigen ein Weg unter die Untergrenze
    („etwa“), nicht nachweislich der einzige.
  - `ce9c0cf`: Im Hinweis in 24 stehen die Seeds aus 501–1500 (1123, 1179, 1422, 1451).
- **Tests** über `leise.sh` (Wanduhr, nach `7ed610d`), alle grün:

  | Lauf | Ergebnis | Dauer |
  |---|---|---:|
  | golden | ok | 2 s |
  | logic | 548 Tests | 41 s |
  | generator | 30 Tests (369 Level, Erzeugen 87,9 s) | 116 s |
  | beurteilung | 177 Tests | 92 s |
  | levelliste | 37 Tests | 61 s |
  | ki-tester | 64 Tests | 1 s |
  | offline | bestanden | 87 s |

  Der Rechner war in diesem Lauf langsamer als beim Entwickler (logic 41 statt 28 s, offline 87 statt 70 s). Derselbe
  Generator-Test auf `10e3041` direkt danach brauchte 95 s (Erzeugen 56,5 s), bei gleicher Arbeit. Das Ticket fügt dem
  Test nur Seed 278 hinzu, der 2729 Strahlverfolgungen kostet. Die 116 s liegen also an der Last, nicht am Ticket; beim
  Entwickler waren es 72 s.
- **Offen:** nichts. Beim Merge mit 24 gibt es einen Konflikt am Ende von `24-austausch-mittel.md`, weil beide Branches
  dort anhängen. Beide Teile bleiben stehen.
- **Urteil:** Ticket 29 ist bereit zum Mergen.
