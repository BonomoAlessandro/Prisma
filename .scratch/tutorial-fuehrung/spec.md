# Spec: Führung im Dorf

Status: ready-for-human (umgesetzt bis vor den manuellen Test, siehe «Schlussstand»; Wahl am Katalog: C «Vorzeigen»,
siehe Ticket 01)

PLAN 1a.1 «Tutorial überarbeiten». Die Entscheide stammen aus dem Grilling vom 09.11.2026. Die Begriffe folgen
`CONTEXT.md`: Das Kapitel heisst «Im Dorf», seine 9 Level sind die Übungen.

Gearbeitet wird auf dem Branch `feature/tutorial-fuehrung`, abgezweigt von `main` (700edfa). Der Merge nach `main` kommt
erst am Ende und nur auf das Go des Nutzers.

## Problem

Jede der 9 Übungen zeigt heute einen festen Satz unter der Kopfzeile. Nichts reagiert auf das, was der Spieler tut, und
was genau zu tun ist, muss er selbst herausfinden. Manche Sätze packen mehrere Gedanken zusammen: «Umweg» erklärt
drehbar, fest und Zurückdrehen auf einmal. Tippt der Spieler ein festes Element an, passiert gar nichts, als wäre der
Tipp nicht angekommen.

## Massstab

Jemand ohne Vorwissen schafft alle 9 Übungen auf dem Handy ohne fremde Hilfe und benutzt die Elemente danach im
Bergwald richtig. Das Handy ist der strengere Prüffall; am Desktop muss die Führung ebenso gut funktionieren (Tippen,
langes Drücken und zwei Finger gegen Klick, Rechtsklick und Mausrad).

## Entschieden

### Rahmen

- Die Führung gibt es **nur im Dorf**. Spieler mit «Gleich los» bekommen in den Welten keine Tipps.
- Sie läuft **jedes Mal vollständig**, wenn eine Übung gespielt wird, auch im nächsten Grad und aus der Übersicht. Es
  gibt keinen Stand für «schon gesehen». «Gleich los» und «Dorf überspringen» bleiben wie heute.
- Die 9 Übungen, ihre Namen und ihre Reihenfolge bleiben. **Die Anordnung auf einem Brett darf sich ändern**, wo es der
  Führung hilft, muss aber nicht.
- Eine Übung hat **höchstens drei geführte Schritte** mit je **einem Satz von etwa zwölf Wörtern**, auch im
  Handy-Querformat lesbar. Nachtrag 13.11.2026 (Wunsch des Nutzers bei der Überarbeitung der Spieltexte): ein oder zwei
  kurze Sätze, höchstens 18 Wörter und 105 Zeichen (Hinweise nebenbei höchstens 16 Wörter).
- Die Schritte sind **neutrale Anweisungen im Du** («Tippe den Spiegel an»). Noa kommt wie bisher nur im Einstieg und im
  Satz zum Ende vor.
- Die Schritte **ersetzen die heutigen Hinweissätze** vollständig. «Übung 2 / 9» bleibt. Es gibt keine dauerhafte
  Hinweiszeile mehr; der aktuelle Satz bleibt stehen, bis der nächste kommt.

### Inhalte je Übung

| # | Übung | Geführt wird |
|---|---|---|
| 1 | Erstes Licht | das Ziel; Tippen dreht |
| 2 | Umweg | rund gegen eckig, dann Zurückdrehen |
| 3 | Sperre | Blöcke schlucken Licht; nebenbei die Kamera (drehen und zoomen) |
| 4 | Brechung | das Prisma; nebenbei der Neustart |
| 5 | Schatten | Spiegel längs zum Strahl, dann Prisma von der falschen Seite, als zwei getrennte Schritte |
| 6 | Farbenlehre | der Filter |
| 7 | Farbiges Licht | farbige Quellen und der Ring am Ziel |
| 8 | Treffpunkt | Mischen am Ziel |
| 9 | Mischung | der Kombinator |

Menü, Übersicht und Ton werden nicht geführt: Sie sind als Knöpfe sichtbar und zum Lösen nicht nötig.

### Bretter und Anzahl (Ticket 03)

Der Nutzer liess frei, Bretter und sogar die Anzahl der Übungen zu ändern, wo es der Führung hilft. Geändert sind nur
Startstellungen in zwei Übungen; die Lösungen, die Elemente und ihre Lage bleiben, also auch die Eindeutigkeit (Löser).

- **Umweg:** Der vordere Spiegel (3,5) startet eine Stufe zu weit (rot 4 statt 1, Lösung 3), Wahl des Nutzers am
  Katalog: Einmal zurückdrehen ist der kurze Weg, der dritte Schritt («zurückdrehen») bringt ihn in die Lösung, statt
  dass Zurückdrehen nur erzählt wird. Vorher waren es zwei Drehungen in beide Richtungen, Zurückdrehen war nie nötig.
  In Ticket 04 startet auch der hintere Spiegel (5,1) eine Stufe zu weit (rot 2 statt 0, Lösung 1): Nach dem dritten
  Schritt blieb sonst eine Drehung an (5,1), von der kein Satz sprach und die kein Umriss zeigte, bis zum späten
  Fingerzeig; der Satz meinte zudem «den markierten Spiegel». Jetzt nennt der dritte Schritt beide runden Spiegel
  («{Drücke lang} auf die runden Spiegel, so drehen sie zurück.»), und jeder braucht genau ein Zurück.
- **Mischung:** Das Prisma (2,3) startet eine Stufe vor der Lösung (rot 7 statt 6). Der erste Schritt lässt das Prisma
  drehen, bis Rot und Blau den Kombinator treffen; aus rot 7 ist das ein Tippen, und wenn der nächste Schritt den
  Kombinator erklärt, mischt er schon zwei Farben zu Magenta. Aus rot 6 hätte das erste Tippen den Schritt
  weitergeschaltet, während der Kombinator nur Grün bekam.

**Die Anzahl bleibt 9.** Jeder Inhalt der Tabelle ist ein eigener Gedanke, und jede Übung hat dafür höchstens drei
Schritte. Zwei Übungen zusammenzulegen hiesse zwei Lehrinhalte auf einem Brett und in drei Sätzen: Das widerspricht
«je Übung ein Gedanke» und macht die Sätze dichter, gerade auf dem Handy. Dazu hängen `TUTORIAL_COUNT`, der
Speicherstand `prisma.noa.<grad>.dorf` (Platz), Übersicht, `tests/golden.json` und mehrere Tests an der 9; der Gewinn
wäre eine oder zwei Übungen weniger, ohne dass ein Inhalt leichter zu lernen würde.

**Nicht zu früh lösbar** (Prüfung mit der Strahlregel aus `index.html`, Breitensuche über alle Stellungen und den
Stand der Führung): Wer jedem Schritt mit der kürzesten Handlung folgt und Erklärungen mit «Weiter» bestätigt, löst
keine Übung vor ihrem letzten Lernschritt (Logiktest «wer jedem Schritt … folgt»). Früher lösen geht nur an den
Schritten vorbei: in «Umweg» ohne den festen Spiegel anzutippen (beide runden Spiegel je einmal zurück), in «Schatten» mit
vier Drehungen am Prisma, solange es noch kein Licht hat, in «Mischung» mit zwei Drehungen am Kombinator vor dem
Prisma; in den Übungen, die mit einer Erklärung beginnen, wenn «Weiter» nie getippt wird. Das bleibt erlaubt («gilt
sofort»); ein Brett, das es verhindert, gibt es nicht, weil alles frei drehbar bleibt.

### Rund und eckig

Der Wunsch des Nutzers: Der Spieler soll wissen, was die Plattform bedeutet. Rund heisst drehbar, eckig heisst fest. Das
Spiel hält sich schon daran: Alles Drehbare steht auf dem runden Teller, Quelle, Ziel, Filter und feste Spiegel, Prismen
und Kombinatoren auf dem eckigen Sockel.

- In «Umweg» tippt der Spieler **selbst den festen Spiegel an**, der sich sichtbar weigert (kurzes Wackeln, der rote Rand
  blitzt auf). Erst danach kommt der Satz «Rund lässt sich drehen, eckig nicht». Das gilt in jeder Richtung des Katalogs.
- Das **Wackeln gilt ohne Text im ganzen Spiel**, nicht nur im Dorf, für feste Elemente mit Sockel. Liegt ein drehbares
  Element nah daneben, gewinnt beim Antippen immer das drehbare, damit das Spielen nicht schlechter wird.

### Verhalten während der Führung

- **Kein Tadel:** Fehlversuche bleiben ohne Meldung. Nach etwa 15 Sekunden ohne Fortschritt wird das nächste
  Element hervorgehoben. Gelöst wird nie automatisch. Die Sekundenzahl wird beim Testen angepasst.
- **Zu früh gelöst:** Schritte und nötigenfalls das Brett sind so geordnet, dass die Lösung möglichst erst nach dem
  letzten Lernschritt möglich ist. Gelingt sie trotzdem früher, gilt sie sofort, die restlichen Schritte entfallen.
- **Kamera und Neustart** sind Hinweise nebenbei. Sie warten auf keine Handlung, verschwinden bei Benutzung oder
  spätestens mit dem Lösen und zählen nicht zu den drei Schritten.
  Ein Hinweis nebenbei, der einmal benutzt wurde, kommt beim Neustart derselben Übung nicht wieder. Der Kamera-Hinweis
  nennt Drehen und Zoomen in einem Satz (seit 13.11.2026 in zwei kurzen); die erste Kamerageste beendet ihn.
  Nachtrag 13.11.2026: Alle Schrittsätze und Hinweise sind neu und natürlicher formuliert; die Sätze, die diese Spec
  zitiert («Rund lässt sich drehen, eckig nicht» …), zeigen den Stand von damals, gültig ist `index.html`.
- **Was weiterschaltet:** Ein Schritt wartet auf eine Handlung (ein bestimmtes Element antippen oder drehen) oder darauf,
  dass der Strahl ein Element trifft. Reine Erklärungen (etwa «Rund lässt sich drehen, eckig nicht») schalten nicht von
  selbst nach einer Handlung; ob sie auf ein Tippen oder eine kurze Zeit warten, folgt aus der Wahl am Katalog.
- **Unterbrechungen:** Neuladen und Neustart beginnen wieder beim ersten Schritt derselben Übung. Menü und Übersicht
  behalten den aktuellen Schritt. Kein neuer Speicherstand, Knöpfe und «Dorf überspringen» sind nie gesperrt.

## Offen, wird am Katalog entschieden

- wie streng geführt wird (nur das markierte Element reagiert oder alles bleibt frei),
- wie hervorgehoben wird,
- ob ein Finger oder eine Hand erscheint,
- wo der Text steht.

## Geplanter Ablauf

1. Ticket 01: Vorbilder und Katalog, der Nutzer wählt. **Start nur auf sein Zeichen.**
2. Ticket 02: Grundgerüst für die Schritte und das Wackeln der festen Elemente.
3. Ticket 03: Die 9 Übungen.
4. Ticket 04: Schluss mit Prüfung und Doku.

## Prüfung

- Automatisch: Node-Tests, dazu jeder Schritt am Desktop und auf dem Handy mit `tests/geschichte-probe.mjs --dorf`.
- Von Hand: der Nutzer auf dem Poco und mindestens eine Person, die Prisma noch nie gesehen hat, auf dem Handy.

## Schlussstand (10.11.2026, vor dem manuellen Test)

Umgesetzt in der Richtung C «Vorzeigen» auf `feature/tutorial-fuehrung` (Tickets 01–04). Alle 9 Übungen sind geführt,
mit 23 Schritten (je 2 oder 3), Hinweisen nebenbei in «Sperre» (Kamera) und «Brechung» (Neustart), dem späten
Fingerzeig und der Weigerung fester Elemente im ganzen Spiel. Geänderte Startstellungen: «Umweg» (beide runden Spiegel
eine Stufe zu weit) und «Mischung» (Prisma eine Stufe vor der Lösung); Lösungen und Eindeutigkeit unverändert, die
Anzahl bleibt 9. Ticket 04 brachte dazu das Feld `farbe` an Strahl-Schritten («Mischung» wartet auf Magenta im
Kombinator) und letzte Schritte, die alles nennen, was noch zu drehen ist («Umweg», «Farbenlehre»).

Automatisch geprüft (Zahlen in Ticket 04): Node-Tests und Golden grün; jeder Schritt jeder Übung am Desktop, auf dem
Handy hoch, bei 360 × 640 und quer; Neuladen, Neustart, Menü, Übersicht und «Dorf überspringen» mitten in der Führung;
Wackeln in einer Welt mit festem Spiegel neben einem drehbaren auf dem Handy. Rot nur Bildlücken, die auf `e426554`
ebenso vorkommen. `APP_VERSION` `2026-11-10 tutorial-fuehrung`.

Offen: der Poco-Test des Nutzers und der Test mit mindestens einer Person, die Prisma nicht kennt (Beobachtungsfragen
in Ticket 04). **Die 15 s des späten Fingerzeigs sind vorläufig** und werden nach diesen Tests festgelegt. Danach PLAN
1a.1 abhaken; der Merge nach `main` nur auf das Go des Nutzers.

## Nicht in diesem Vorhaben

- Tipps in den sechs Welten; falls sie fehlen, ein eigener Plan-Punkt.
- Führung für Menü, Übersicht und Ton.
- Änderungen an der Strahlregel, an den 240 Leveln der Geschichte oder an den Würfel-Leveln.
