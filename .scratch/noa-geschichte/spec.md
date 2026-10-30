# Spec: Noas Geschichte als Spielablauf

Status: ready-for-agent

Begriffe nach `CONTEXT.md` (die neuen dieser Spec ergänzt Ticket 08). Baut auf dem Prototyp «Ein Lichtsignal an die
Sterne» auf (Branch `feature/lichtsignal-prototyp`, heute hinter `?signal`) und auf PLAN.md 0. Entscheide des Nutzers
aus dem Grilling vom 29.10.2026, dazu die Regeln der Wahl in PLAN.md 0.1 vom 28.10.2026.

## Ziel

- Noas Geschichte ist der **einzige Spielablauf**. Die feste Reihe von 500 Leveln entfällt.
- Der Spieler wählt im Menü einen **Grad** (leicht, mittel, schwer, sehr schwer) und spielt damit einen **Durchgang**:
  Prolog, auf Wunsch das Kapitel «Im Dorf» (Tutorial), dann **6 Welten mit je genau 10 Leveln**, Finale, Epilog.
- Je Grad gibt es **60 Level**, im Spiel also das Tutorial und **240 Level**. Alle übrigen flachen Level (rund 260) und
  alle 300 Würfel-Level kommen in einen **Vorrat**, versioniert und mit einem Befehl zurückzuholen.

## Entscheide des Nutzers (29.10.2026)

1. Die Geschichte ersetzt die 500er-Reihe ganz; `?signal` entfällt.
2. Ein Grad gilt für einen ganzen Durchgang. Jeder Grad hat einen eigenen Fortschritt; der Grad wechselt nur über
   das Menü, nie mitten in der Geschichte.
3. Das Tutorial wird das Kapitel «Im Dorf» zwischen Prolog und Bergwald. Hintergrund vorerst die Milchstrasse; eine
   eigene Skybox macht der Nutzer später.
4. Die Würfel-Level kommen in den Vorrat, ohne Zugang im Spiel, aber sofort zurückzuholen.
5. Die Schwierigkeit steigt über die Welten (in der ersten Welt die leichtesten des Grads, in der letzten die
   schwersten) und innerhalb einer Welt, mit kleinen Vertauschungen für die Vielfalt.
6. Die 240 Level bekommen Namen, die zu ihrer Welt passen. Der Koordinator wählt sie selbst, ohne Freigabe.
7. Momente der Geschichte gibt es nur beim Wechsel der Welt, keine Zwischenszenen innerhalb einer Welt.
8. Nach dem Startbildschirm ein Menü mit vier Karten (je Grad sein Stand) und «Weiter».
9. Die Levelauswahl wird zur Übersicht des Grads: Welten mit je 10 Kacheln, gelöste wieder spielbar, das nächste
   ungelöste offen, spätere gesperrt.
10. Prolog, Angebot des Tutorials und Einstiege in die Welten beim ersten Durchgang **je Grad**, immer überspringbar.
11. Der bisherige Fortschritt wird nicht übernommen.
12. Der Vorrat liegt in eigenen Dateien ausserhalb von `index.html`, ist **committet** und hat ein Werkzeug zum
    Zurückholen.
13. Die Namen wählt der Koordinator; die 9 Namen des Tutorials bleiben.
14. Nach dem Epilog zurück ins Menü; der Grad ist als geschafft markiert, der nächstschwerere hervorgehoben.
15. Gearbeitet wird auf `feature/lichtsignal-prototyp`. **Nach main wird erst gemergt, wenn der Nutzer es sagt.**
16. Wiederholen ohne Zwischenszenen; «Weiter» führt zum nächsten Level der Reihe, beim Weltwechsel blendet nur der
    Hintergrund.
17. Ein Knopf «Menü» im Spiel (unten rechts, wo heute der Hintergrund-Knopf sitzt); der Stand bleibt.
18. Nach dem Prolog wählt der Spieler «Üben» (Kapitel «Im Dorf») oder «Gleich los»; im Tutorial jederzeit
    «Überspringen».
19. Ein geschaffter Grad öffnet seine Übersicht; jeder begonnene oder geschaffte Grad hat «Von vorn» (mit Rückfrage,
    löscht nur diesen Grad).
20. Kopfzeile: «Das Meer – Brandung», darunter «●●○○ Mittel · Kapitel 2 / 6 · Level 4 / 10» und die Bedienung.
21. Überspringen mit N und Sprung in ein Kapitel (`?signal=4`) fallen **ganz** weg, auch nicht in einem Testmodus.
22. Vor dem Bau des Menüs zwei oder drei Vorschauen (Desktop und Handy); der Nutzer wählt.
23. Spec und Tickets, je Ticket ein Review, dann Commit auf dem Branch. **Kein Push** ohne Auftrag.
24. Die Übersicht zeigt je Level die Bestzeit und die wenigsten Drehungen (je für sich), je Welt die Summe der
    Bestzeiten; eine neue Bestmarke meldet das Feld «Gelöst» kurz.
25. «Weiter» im Menü führt zum zuletzt gespielten, nicht geschafften Grad; gibt es keinen, fehlt der Knopf.
26. Die Welt bestimmt den Hintergrund; Hintergrund-Knopf und Taste H entfallen, `prisma.sky` wird nicht mehr gelesen.
27. (30.10.2026) «Von vorn» lässt die Bestwerte (Bestzeit, wenigste Drehungen) des Grads stehen; nur der Fortschritt
    beginnt neu.
28. (30.10.2026) Die Reisen zwischen den Welten laufen ganz und sind nicht überspringbar.

## Ablauf im Spiel

1. **Startbildschirm** wie heute («Klicken zum Starten» erst mit geladenem Hintergrund).
2. **Menü:** vier Karten (Grad, Stand wie «Wüste · 23 / 60» oder «noch nicht begonnen», geschafft mit dem Polarstern,
   «Von vorn»), darüber «Weiter» nach Entscheid 25. Eine Karte öffnet bei begonnenem Grad die Fortsetzung, bei
   geschafftem die Übersicht, sonst einen neuen Durchgang.
3. **Neuer Durchgang:** Prolog (Bühne), dann das Angebot «Üben» / «Gleich los». «Üben» spielt «Im Dorf» mit den
   9 Tutorial-Leveln (Hinweise wie heute, «Überspringen» jederzeit), danach geht das Licht in den Bergwald.
4. **Welten:** Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne, je 10 Level in steigender Schwierigkeit. Einstieg mit
   Träger und Untertitel beim ersten Betreten (je Grad), Reisen zwischen den Welten wie im Prototyp.
5. **Finale und Epilog** wie im Prototyp; am Ende «Zum Menü».
6. **Im Spiel:** Neustart, Ton, «Menü», «Übersicht» (statt Levelauswahl). Kein Hintergrund-Knopf.
7. **Wiederholen** (aus der Übersicht): ohne Zwischenszenen; «Weiter» zum nächsten Level der Reihe, beim nächsten noch
   ungelösten Level gilt wieder der normale Ablauf.

## Daten

- **Level im Spiel** (`index.html`): das Tutorial und die 240 Level der Geschichte, je mit Grad. Dazu ein Datenblock
  der Geschichte (je Grad die 6 Welten mit ihren 10 Leveln in Reihenfolge), aus dem Werkzeug geschrieben wie heute
  `LEVELS:BEGIN/END`. Die Kapitel der Geschichte (`STORY_CHAPTERS`) lesen daraus.
- **Namen:** Das Feld `name` bleibt der **stabile Schlüssel** jedes Levels (Werkzeuge, Protokoll der KI-Tester,
  Golden-Test, Eichung, Ähnlichkeit). Neu ist `titel`, der Anzeigename in der Welt; das Spiel zeigt `titel ?? name`.
  Die 15 neuen sehr schweren Level (`tools/geschichte/sehr-schwer-neu.json`) bekommen einen Schlüssel im bisherigen
  Stil aus dem Namensvorrat. Titel sind eindeutig über alle Titel und Namen in Spiel und Vorrat.
- **Vorrat** (`tools/vorrat/`, committet): die Leveldaten im Format von `LEVELS` (samt Herkunft im Kommentar, Grad,
  Lösung), getrennt nach Fläche und Würfel. Ein Werkzeug (`tools/vorrat.mjs`) legt Level ab, holt einzelne oder Gruppen
  zurück und listet den Inhalt.
- **Gemeinsamer Lader:** Werkzeuge und Tests, die alle Level brauchen (Eichung der Beurteilung, Ähnlichkeit,
  KI-Tester, Golden-Test, Würfelliste), lesen Spiel und Vorrat über einen Lader; wer nur das Spiel braucht, nur das
  Spiel. Kein Level geht verloren: Golden-Referenz, Protokoll und Urteile bleiben gültig.

## Wahl der 240 Level

- **Pool je Grad:** alle flachen Level des Grads (heute im Spiel), für «sehr schwer» dazu die 15 aus
  `tools/geschichte/sehr-schwer-neu.json` (zusammen genau 60). Seit Ticket 09 (30.10.2026) kommen in «sehr schwer»
  die beurteilten Kandidaten aus `tools/geschichte/sehr-schwer-kandidaten.json` dazu; die Wahl nimmt 60 aus dem
  grösseren Pool (Entscheide im Ticket 09).
- **Regeln** (PLAN.md 0.1):
  - Beste Bewertung (Urteil der KI-Tester, Spielwert), kein von beiden abgelehntes Level.
  - **Vielfalt vor Bewertung:** dieselbe Haupt-Kernidee höchstens zweimal je 10 aufeinanderfolgende Level des Grads,
    auch über die Grenzen der Welten; keine zwei Level, die einander zu ähnlich sind (`tools/aehnlichkeit.mjs`,
    Grenze 0,5). Lässt sich beides nicht erfüllen, kommt das nächstbeste Level mit anderer Lösungsart.
  - **Schwierigkeit:** Die 60 verteilen sich über den ganzen Bereich des Grads. Nach Schwierigkeit geordnet bekommt
    Welt *w* die Ränge 10·*w* … 10·*w*+9; innerhalb einer Welt darf die Vielfalt Level um höchstens 2 Plätze
    vertauschen.
- **Entscheide des Nutzers (29.10.2026, nach dem Bericht zu Ticket 03):**
  - **Abgelehnt** ist ein Level, wenn die KI-Tester **oder** die Beurteilung es ablehnen: die KI-Tester, wenn in einem
    Urteil beide einen Begriff aus «Was Spass verdirbt» nennen, der beim Grad des Levels gilt; die Beurteilung mit
    einem Ausschlussgrund oder ab «mittel» mit einem Spielwert unter dem Mindest-Spielwert (60). Die 25 Level, die
    nur nach dem Urteil der KI-Tester im Spiel blieben (Spielwert unter 60), kommen nicht in die Geschichte. Ein
    fehlendes Urteil ist keine Ablehnung; die Bewertung stützt sich dann auf den Spielwert.
  - **«sehr schwer»:** Nur in diesem Grad darf ein Level bis zu 3 Plätze von seinem Platz nach Schwierigkeit (Rang
    1–60) abweichen, auch über eine Weltgrenze (Welt *w* hat dann nicht zwingend genau die Ränge 10·*w* … 10·*w*+9).
    Damit soll die Vielfalt ganz aufgehen; unter den Anordnungen, die das erfüllen, gilt die mit den kleinsten
    Verschiebungen. Geht es auch mit 3 Plätzen nicht ganz auf, wird nicht weiter gelockert, sondern gemeldet. Die
    übrigen Grade bleiben bei den Rängen je Welt und höchstens 2 Plätzen innerhalb der Welt; die verschobenen Grenzen
    der Abschnitte in «schwer» sind in Ordnung.
  - **«sehr schwer» vorerst mit Platzhaltern:** Auch mit 3 Plätzen geht die Vielfalt nicht ganz auf (die 60 Level
    haben fast nur 5 Haupt-Kernideen zu je etwa 12). Die Geschichte nimmt vorerst die vorhandenen Level in der
    Anordnung mit dem kleinsten Zuviel (`verstoesse` in `wahl.json`, vom Test genau so erlaubt). Vor dem Aufräumen und der Abnahme
    (Ticket 09) werden neue, passende sehr schwere Level generiert und ersetzen diese Platzhalter, bis die Vielfalt
    ganz aufgeht. **Erledigt mit Ticket 09 (30.10.2026):** 23 Platzhalter durch besser bewertete, beurteilte
    Kandidaten aus Ticket 01 ersetzt (nach Bewertung, Entscheid des Nutzers), 0 Verstösse; die ersetzten liegen im
    Vorrat.
- **Ergebnis:** ein Werkzeug rechnet die Wahl nachbaubar (gleiche Eingaben, gleiches Ergebnis) und schreibt sie mit
  Begründung je Level (Rang, Bewertung, Haupt-Kernidee, Schwierigkeit) nach `tools/geschichte/`; Tests prüfen alle
  Regeln.

## Namen der Welten

- Je Welt 40 Titel (4 Grade × 10), ein oder zwei deutsche Wörter, die zur Welt passen (Bergwald: Wald, Moos,
  Glühwürmchen; Meer: Wellen, Küste; Wüste: Sand, Oase, Pyramiden; Vulkan: Glut, Lava; Planeten: Monde, Ringe,
  Umlaufbahnen; Sterne: Sternbilder, Nebel). Schweizer Schreibweise («ss»), keine Doppel, keine Namen aus dem Vorrat
  oder der Liste entfernter Level.

## Speicherstand

- Neue Schlüssel unter `prisma.noa.*`, **je Grad**: Platz in der Reise, gelöste Level, gesehene Momente (Prolog,
  Angebot des Tutorials, Einstiege), Tutorial gespielt oder übersprungen, geschafft; je Level Bestzeit und wenigste
  Drehungen. Dazu der zuletzt gespielte Grad.
- Alte Schlüssel (`prisma.solvedLevels`, `prisma.current`, `prisma.sky`, `prisma.signal`, `prisma.signal.seen`) werden
  nicht mehr gelesen und nicht gelöscht.

## Was wegfällt

- Die feste Reihe von 500 Leveln, die Levelauswahl mit Fläche/Würfel und Seiten, Würfel-Level im Spiel.
- `?signal` (die Geschichte ist das Spiel), Überspringen mit N, `?signal=<Kapitel>`.
- Hintergrund-Knopf, Taste H, die Wahl des Hintergrunds.

## Tests

- **Bleiben gültig** (über den Lader auch für den Vorrat): Strahlregel, Golden-Test, Beurteilung und Eichung,
  KI-Tester, Generator, Würfelliste (Daten im Vorrat).
- **Neu oder umgebaut:**
  - Levelliste der Geschichte: 4 × 60, je Welt 10, Grad stimmt, Schwierigkeit steigt über die Welten und innerhalb
    (Vertauschungen höchstens 2 Plätze), Vielfalt nach den Regeln, genau eine Lösung, Titel eindeutig.
  - Vorrat: jedes Level des Spiels vor dem Umbau steht danach im Spiel oder im Vorrat, mit unveränderten Leveldaten;
    Zurückholen und Ablegen sind verlustfrei.
  - Ablauf im Spiel: Proben im Browser (Desktop und Handy) für Menü, Durchgang, Übersicht, Wiederholen, Tutorial.
- Die heutigen Tests der 500er-Reihe (Reihenfolge nach Formel, Seiten, Prüfliste) entfallen oder prüfen den Vorrat.

## Tickets

| Nr. | Ticket | Blockiert durch |
|---|---|---|
| 01 | Sehr schwere Level für 60 (erledigt) | – |
| 02 | Vorrat und gemeinsamer Lader | – |
| 03 | Wahl der 240 Level und Titel der Welten | 02 |
| 04 | Die Geschichte je Grad im Spiel | 03 |
| 05 | Menü mit den vier Graden | 04 |
| 06 | Übersicht mit Bestwerten, Wiederholen | 04 |
| 07 | Kapitel «Im Dorf» | 04 |
| 09 | Neue sehr schwere Level statt der Platzhalter | 04 (Zeitpunkt bestimmt der Nutzer) |
| 08 | Aufräumen, Begriffe, Abnahme | 05, 06, 07, 09 |

## Reviews und Commits

- Nach jedem Ticket prüft ein unabhängiger Reviewer (Code, Tests über `tools/leise.sh`, Kriterien des Tickets).
  Kleinigkeiten behebt er selbst, Grundsätzliches geht zurück. Danach ein Commit je Ticket auf dem Branch.
- **Kein Push** ohne Auftrag des Nutzers, **kein Merge nach main**, bis der Nutzer es sagt.

## Rechnerlast

Wie bisher nur über `tools/leise.sh` mit `LEISE_CPU=50`, nie mehrere schwere Läufe zugleich.

## Nicht Teil dieser Spec

- Die eigene Skybox für «Im Dorf» (macht der Nutzer) und die übrigen Skyboxen aus PLAN.md 1.2.
- Zwischenszenen innerhalb einer Welt.
- Die Würfel-Level als «Teil 2» der Geschichte.
- Der Merge nach main und das Deployment auf Render.
