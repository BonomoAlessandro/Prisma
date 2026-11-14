# Spec: Tutorial neu

Status: ready-for-agent

PLAN 1a.3 «Tutorial neu». Die Entscheide stammen aus dem Grilling vom 14.11.2026 und lösen Teile von PLAN 1a.1
(«Führung im Dorf», `.scratch/tutorial-fuehrung/spec.md`) ab. Was dort steht und hier nicht geändert wird, gilt weiter.
Die Begriffe folgen `CONTEXT.md`: Das Kapitel heisst «Im Dorf», seine Level sind die Übungen.

Gearbeitet wird auf dem Branch `feature/tutorial-neu`, abgezweigt von `main` (ec02954). Der Merge nach `main` kommt erst
am Ende und nur auf das Go des Nutzers. Die Tickets werden auf einem anderen Rechner umgesetzt; vorher `git pull`.

## Problem

Die Führung aus 1a.1 funktioniert, wirkt aber nicht professionell:

- Der Satz steht oben in der Kopfzeile, weit weg vom Geschehen, und wird übersehen.
- Gestrichelter Umriss und Hand wirken gebastelt, nicht wie aus einem Guss.
- Ein geschaffter Schritt hat keine Rückmeldung, der nächste springt hart herein.
- Alles bleibt frei: Wer etwas anderes dreht als das Markierte, steht vor einem Satz, der nicht mehr zum Brett passt.
- 9 Übungen sind zu viele für die Inhalte. «Schatten» zeigt mit seinen zwei Schritten nur Sonderfälle der Strahlregel.

## Massstab

Jemand ohne Vorwissen weiss in jedem Moment, was zu tun ist, schafft alle Übungen auf dem Handy ohne fremde Hilfe und
benutzt die Elemente danach im Bergwald richtig. Das Handy (hochkant und quer) ist der strengere Prüffall; am Desktop
muss alles ebenso gut funktionieren (Klick, Rechtsklick, Mausrad).

## Entschieden

### Rahmen (unverändert aus 1a.1)

- Die Führung gibt es **nur im Dorf** und sie läuft **jedes Mal vollständig**. «Gleich los» und «Dorf überspringen»
  bleiben wie heute.
- Die Schritte sind **neutrale Anweisungen im Du**, Noa kommt nur im Einstieg und im Satz zum Ende vor.
- Sätze: ein oder zwei kurze Sätze, höchstens 18 Wörter und 105 Zeichen; Hinweise nebenbei höchstens 16 Wörter.
  Platzhalter je Gerät wie heute («{Tippe}», «{Drücke lang}»).
- Das Wackeln fester Elemente mit Sockel gilt weiter im ganzen Spiel.
- Neustart beginnt beim ersten Schritt der Übung, Menü und Übersicht behalten ihn. Neuladen beginnt das Dorf neu bei
  Übung 1 (siehe «Kein Stand im Dorf»).

### Vier Übungen statt neun

Höchstens **4 Schritte** je Übung (bisher 3). Jede Übung bekommt ein **neues Brett**: eindeutig lösbar (Löser
`tools/solver.mjs`), klein genug, dass auf dem Handy quer nichts eng wird.

| # | Übung | Geführt wird |
|---|---|---|
| 1 | Erstes Licht | das Ziel; Tippen dreht; rund gegen eckig (der Spieler tippt den festen Spiegel an, er wackelt); Zurückdrehen mit langem Drücken |
| 2 | Brechung | Blöcke schlucken Licht; das Prisma fächert auf; nebenbei Kamera (drehen, zoomen) und Neustart |
| 3 | Farbenlehre | der Filter; farbige Quellen und der Ring am Ziel |
| 4 | Mischung | Mischen am Ziel; der Kombinator |

**Gestrichen** sind «Spiegel längs zum Strahl» und «Prisma von der falschen Seite» (bisher «Schatten») sowie die
Übungen Umweg, Sperre, Schatten, Farbiges Licht und Treffpunkt. Für die Sonderfälle kommt im Bergwald nichts dazu.

### Strikte Führung

- Bei einem Handlungsschritt **reagiert nur das markierte Element**. Jedes andere Element weigert sich wie ein festes
  (Wackeln, kein Zug, keine Drehung), auch drehbare.
- Bei einer Erklärung ist **das ganze Brett gesperrt**, bis «Weiter» getippt wird.
- **Frei bleiben immer:** Kamera, Knöpfe, Menü, Übersicht, Ton, Neustart und «Dorf überspringen».
- Damit entfällt der **späte Fingerzeig** (`FUEHRUNG.fingerzeig`). Gelöst wird weiter nie von selbst; der letzte
  Schritt führt zur Lösung. Die Prüfung, dass wer den Schritten folgt nicht vor dem letzten löst, bleibt (das markierte
  Element lässt sich auch unter der Sperre mehrmals drehen); «zu früh gelöst gilt sofort» bleibt als Sicherung.

### Aussehen

- **Band unten:** ein festes Band am unteren Rand, immer an derselben Stelle. Darin der Satz des Schritts, Punkte für
  den Fortschritt der Übung (● ● ○ ○) und bei Erklärungen der Knopf «Weiter». Der Satz verschwindet aus der Kopfzeile;
  «Übung 2 / 4» bleibt dort. Lesbar auf dem Handy hoch und quer, nichts verdeckt Knöpfe.
- **Lichtkegel:** Die Szene wird leicht abgedunkelt, ein Lichtkegel liegt auf dem markierten Element (bei mehreren auf
  jedem). Er ersetzt den gestrichelten Umriss. Das Abdunkeln zeigt zugleich, dass der Rest gesperrt ist.
- **Hand:** die gezeichnete Zeigehand aus 1a.1 (Wahl B), **sofort** bei jedem Handlungsschritt. Sie zeigt die Geste
  (Tippen, langes Drücken) vor; die Wiederholung erst nach 15 s ohne Fortschritt (später Fingerzeig) fällt weg.
- **Hinweise nebenbei** (Kamera, Neustart) stehen als kleiner Zusatz über dem Band, zählen nicht zu den Punkten und
  verschwinden bei der ersten Benutzung oder spätestens mit dem Lösen.

### Rückmeldung je Schritt

Ist ein Schritt geschafft: ein kurzes Funkeln am Element, der Punkt im Band füllt sich, ein leiser Ton (nur bei Ton an).
Nach etwa **0,6 s** blendet der nächste Schritt weich ein (Satz, Lichtkegel, Hand), statt hart zu springen. Fehlversuche
bleiben ohne Tadel, die Weigerung ist die einzige Reaktion.

### Kein Stand im Dorf

Das Dorf ist nur das Tutorial und **merkt sich keinen Platz** (Entscheid des Nutzers, 14.11.2026). Wer das Dorf startet
(aus dem Angebot «Üben» oder nach dem Neuladen mitten im Dorf), beginnt **immer bei Übung 1**. Im Speicherstand
`prisma.noa.<grad>.dorf` bleibt nur, ob das Dorf beendet ist (`ende: 'gespielt'` oder `'uebersprungen'`), damit die
Geschichte danach im Bergwald weitergeht und die Übersicht die Reihe «Im Dorf» zeigt (nach «Überspringen» mit allen
Übungen frei); das Feld `platz` fällt weg. Innerhalb einer Sitzung behalten Menü und Übersicht die laufende Übung und
ihren Schritt. Einzelne Übungen aus der Übersicht wiederholen bleibt wie heute. Gelöste Übungen bleiben in der
Übersicht gelöst, auch nach dem Neuladen; wer dort die nächste offene wählt, spielt ab ihr weiter (Entscheid des
Nutzers, 14.11.2026: Die Übersicht wählt man bewusst).

Alte Spielstände: Ein laufendes Dorf (`ende: null`) beginnt damit von selbst wieder bei Übung 1. Ein beendetes oder
übersprungenes Dorf bleibt beendet, auch wenn sein alter `platz` (bis 8) nicht mehr gültig wäre; es darf deswegen nicht
als unlesbar gelöscht werden. Keine Umrechnung nach Inhalt, keine Kennung für die neue Zählung.

## Ablauf

1. Ticket 01: Gerüst und Aussehen, «Erstes Licht» neu. Danach Bilder; der Nutzer prüft auf dem Poco.
   **Ticket 02 startet erst nach seinem Okay.**
2. Ticket 02: Brechung, Farbenlehre, Mischung neu; die übrigen Übungen weg; kein Stand im Dorf.
3. Ticket 03: Schluss mit Prüfung und Doku.

Je Ticket ein Umsetzer, danach ein unabhängiges Review; Kleines behebt der Reviewer selbst.

## Prüfung

- Automatisch: Node-Tests und Golden, jeder Schritt am Desktop, auf dem Handy hoch (`--handy`), bei 360 × 640
  (`--handy --groesse 360x640`) und quer (`--quer`) mit `tests/geschichte-probe.mjs --dorf`.
- Von Hand: der Nutzer auf dem Poco und mindestens eine Person, die Prisma noch nie gesehen hat, auf dem Handy.

## Nicht in diesem Vorhaben

- Tipps in den sechs Welten.
- Führung für Menü, Übersicht und Ton.
- Änderungen an der Strahlregel, an den 240 Leveln der Geschichte oder an den Würfel-Leveln.
