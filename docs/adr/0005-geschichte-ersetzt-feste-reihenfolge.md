# Die Geschichte ersetzt die feste Reihenfolge

Entschieden vom Nutzer am 29.10.2026 (Grilling; Spec und Tickets in `.scratch/noa-geschichte/`, PLAN.md 0), umgesetzt
ab Ticket 02 auf `feature/lichtsignal-prototyp`. Begriffe nach `CONTEXT.md`. Was nicht als Entscheid aus einem Ticket
markiert ist, hat der Nutzer entschieden.

## Kontext

Das Spiel war eine feste Reihe: das Tutorial, 500 flache Level nach Schwierigkeit geordnet (ADR 0001, 0002) und 300
Würfel-Level, wählbar in der Levelauswahl (Fläche und Würfel, Seiten zu 10); den Hintergrund schaltete der Spieler
selbst um. Daneben lief seit dem 28.10.2026 der Prototyp «Ein Lichtsignal an die Sterne» hinter `?signal`: Noa schickt
aus einem Bergdorf dem Polarstern ein Lichtzeichen, das Licht reist durch sechs Welten mit je eigener Skybox. Der
Nutzer wollte den Prototyp als Spiel, mit einer wählbaren Schwierigkeit statt einer langen Reihe (PLAN.md 0.1).

## Entscheid

- Die Geschichte ist der einzige Ablauf des Spiels; Reihe, Levelauswahl und `?signal` entfallen.
- Der Spieler wählt im Menü einen Grad. Er gilt für einen ganzen Durchgang, jeder Grad hat seinen eigenen Stand, und
  gewechselt wird nur über das Menü.
- Ein Durchgang: Prolog, auf Wunsch «Im Dorf» (das Tutorial), sechs Welten mit je genau 10 Leveln (Bergwald, Meer,
  Wüste, Vulkan, Planeten, Sterne), Finale, Epilog. Also 60 Level je Grad und 240 im Spiel, dazu das Tutorial.
- Die Wahl rechnet ein Werkzeug nachbaubar: kein abgelehntes Level (von den KI-Testern oder der Beurteilung), dann nach
  der Bewertung, aber die Vielfalt geht vor (dieselbe Haupt-Kernidee höchstens zweimal je 10 aufeinanderfolgende
  Level, auch über die Weltgrenzen; keine zwei Level zu ähnlich). Die Schwierigkeit steigt über die Welten und in der
  Welt, mit Vertauschungen um höchstens 2 Plätze.
- Nicht gewählte Level werden nicht gelöscht, sondern kommen in den Vorrat: eigene, committete Dateien ausserhalb von
  `index.html`, mit einem Werkzeug zum Zurückholen. Das gilt auch für alle Würfel-Level.
- Jedes Level der Geschichte bekommt einen Titel, der zu seiner Welt passt; der Name bleibt der Schlüssel.
- Die Übersicht des Grads ersetzt die Levelauswahl: gelöste Level wieder spielbar, das nächste ungelöste offen,
  spätere gesperrt, dazu die Bestwerte.
- Die Welt bestimmt den Hintergrund; Hintergrund-Knopf und Taste H entfallen.
- Kein Level lässt sich überspringen: Taste N und der Sprung in ein Kapitel (`?signal=<Kapitel>`) fallen ganz weg, auch
  in keinem Testmodus. Überspringen lassen sich nur der Prolog, die Einstiege in die Welten und «Im Dorf».
- Der bisherige Fortschritt wird nicht übernommen; die alten Schlüssel werden nicht mehr gelesen und nicht gelöscht.

Die genaue Gestalt von Menü, Übersicht und «Im Dorf» legen die Tickets 05–07 fest; hier steht nur die Sache.

## Folgen

- Es fallen weg: die Reihe als Ablauf, die Levelauswahl mit Fläche, Würfel und Seiten, Würfel-Level im Spiel, die Wahl
  des Hintergrunds, das Überspringen von Leveln. Werkzeuge und Tests, die nur die Reihe prüfen (Reihenfolge nach
  Formel, Seiten, Prüfliste), entfallen oder prüfen den Vorrat (Ticket 08).
- Es bleiben: die Strahlregel und die Darstellung der Würfel (ADR 0003), damit zurückgeholte Würfel-Level laufen;
  Beurteilung, Eichung, KI-Tester, Golden-Test und Generator (ADR 0001, 0002, 0004). Wer alle Level braucht, liest
  Spiel und Vorrat über den Lader; so geht kein Level und kein Urteil verloren. ADR 0001 eicht weiter an der festen
  Liste der heutigen Reihenfolge; dass die Level in der Reihenfolge der Formel stehen (Ergänzung vom 16.10.2026), gilt
  jetzt für die Reihe aus Spiel und Vorrat, nicht mehr für das Spiel.
- `LEVELS` in `index.html` behält die Folge der Reihe; die Reihenfolge der Geschichte steht in einem eigenen Datenblock
  (`STORY_LEVELS`, geschrieben aus `tools/geschichte/wahl.json`). So setzt der Lader die Reihe unverändert wieder
  zusammen, und die Regeln der Levelliste gelten ohne Sonderfall weiter (Entscheid aus Ticket 02 und 04). Die
  Geschichte ordnet nach der Schwierigkeit selbst; die Verschiebungen der KI-Tester (ADR 0002) wirken nur in der Reihe.
- Die 25 Level, die nur nach dem Urteil der KI-Tester im Spiel geblieben waren (Spielwert unter 60), kommen nicht in
  die Geschichte; ein fehlendes Urteil ist keine Ablehnung.
- In «sehr schwer» geht die Vielfalt nicht auf: Die 60 Level haben fast nur fünf Haupt-Kernideen zu je etwa 12. Nur
  dort darf ein Level darum bis 3 Plätze von seinem Rang abweichen, auch über eine Weltgrenze; weiter gelockert wird
  nicht. Weil es auch so nicht aufgeht, stehen dort vorerst Platzhalter in der Anordnung mit dem kleinsten Zuviel
  (`verstoesse` in `wahl.json`, vom Test genau so erlaubt). Ticket 09 ersetzt sie durch neue Level, bis die Vielfalt
  ganz aufgeht; die ersetzten kommen in den Vorrat.
- Die Würfel-Level haben vorerst keinen Zugang im Spiel; ob sie ein zweiter Teil der Geschichte werden, ist offen.
  «Im Dorf» hat vorerst die Milchstrasse als Hintergrund; eine eigene Skybox macht der Nutzer später.
- Der Stand liegt je Grad unter `prisma.noa.*`.

## Verworfen

- Die Geschichte als zweiter Ablauf neben der Reihe, wie im Prototyp hinter `?signal`: Sie ersetzt die Reihe ganz.
- Ein gemeinsamer Fortschritt über alle Grade oder ein Wechsel des Grads mitten in der Geschichte: ein Grad je
  Durchgang, mit eigenem Stand.
- Nicht gewählte Level löschen (PLAN.md 0.2) oder nur lokal aufheben: Der Vorrat ist committet.
- Würfel-Level mit eigenem Zugang im Spiel behalten: Sie liegen im Vorrat, mit einem Befehl zurückzuholen.
- Die Level umbenennen: Der Name bleibt der Schlüssel für Werkzeuge, Protokoll und Tests, der Titel kommt dazu. Titel
  nach dem Grad statt nach der Welt (offen seit Ticket 01): Sie passen zur Welt.
- `LEVELS` nach der Geschichte umordnen (Entscheid aus Ticket 02 und 04): Die Tests der Reihenfolge müssten dann auf
  eine feste Liste umgestellt werden.
- Zwischenszenen innerhalb einer Welt: Momente der Geschichte gibt es nur beim Wechsel der Welt.
- Überspringen in einem Testmodus behalten: Werkzeuge und Proben steuern über die Testschnittstelle (`__prismaDebug`).
- Den alten Fortschritt übernehmen.
- In «sehr schwer» weiter lockern: Auch mit 7 Plätzen ginge die Vielfalt nicht auf; neue Level statt weiterer
  Lockerung.
