# Spec: Führung im Dorf

Status: needs-info (Art der Führung offen bis zur Wahl am Katalog, Ticket 01; Start nur auf Zeichen des Nutzers)

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
  Handy-Querformat lesbar.
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
  nennt Drehen und Zoomen in einem Satz; die erste Kamerageste beendet ihn.
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

## Nicht in diesem Vorhaben

- Tipps in den sechs Welten; falls sie fehlen, ein eigener Plan-Punkt.
- Führung für Menü, Übersicht und Ton.
- Änderungen an der Strahlregel, an den 240 Leveln der Geschichte oder an den Würfel-Leveln.
