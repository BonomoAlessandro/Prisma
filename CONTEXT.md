# PRISMA

Ein Lichtstrahl-Puzzle: Spiegel, Prismen, Filter und Kombinatoren lenken farbiges Licht von Quellen auf Ziele.
Dieses Glossar hält fest, wie wir über Level, ihre Beurteilung und den Ablauf des Spiels sprechen.

## Auf dem Feld

**Strahlregel**:
Wie Licht durchs Feld läuft und an Elementen umgelenkt, geteilt, gefiltert oder gemischt wird. Sie gilt in flachen
Leveln und Würfel-Leveln gleich.

**Flaches Level**:
Ein Level auf einem quadratischen Feld; alle Strahlen laufen in einer Ebene. Alle Level der Geschichte sind flach.
_Vermeiden_: 2D-Level

**Würfel-Level**:
Ein Level in einem Würfel aus mehreren Ebenen; Strahlen laufen auch zwischen den Ebenen. Alle liegen im Vorrat, ohne
Zugang im Spiel (ADR 0005).
_Vermeiden_: 3D-Level (dreidimensional dargestellt werden auch flache Level)

**Drehachse**:
Die feste Achse, um die sich ein Element dreht. In der Ebene senkrecht dazu wirkt es wie in einem flachen Level. In
flachen Leveln steht sie immer senkrecht.

**Strang**:
Der Weg eines Strahls von einer Quelle über Spiegel zu einem Ziel.

**Mischziel**:
Ein Ziel, dessen Farbe erst im Level gemischt wird, durch einen Kombinator oder durch mehrere Strahlen auf dem Ziel.
Ein weisses Ziel, das sein Weiss direkt aus einer weissen Quelle bekommt, ist keines.

## Noas Geschichte

**Geschichte**:
«Ein Lichtsignal an die Sterne», der einzige Ablauf des Spiels: Noa will aus einem Bergdorf dem Polarstern ein
Zeichen schicken, und der Spieler gibt das Licht Welt für Welt weiter. Sie ersetzt die Reihe (ADR 0005). Im Code
`story`.
_Vermeiden_: Storyline, Story-Modus, Signal (Namen aus der Zeit, als sie ein Prototyp neben der Reihe war)

**Grad**:
Kurz für Schwierigkeitsgrad. Der Spieler wählt ihn im Menü für einen ganzen Durchgang und wechselt ihn nur dort; jeder
Grad hat seine eigenen 60 Level und seinen eigenen Stand. Im Code `grad`.
_Vermeiden_: Schwierigkeit (das ist das Mass, aus dem der Grad folgt), Modus

**Menü**:
Was nach dem Startbildschirm kommt und wohin «Menü» (Knopf, Esc) im Spiel und «Zum Menü» nach dem Epilog führen: je
Grad eine Karte mit seinem Stand («Wüste · 23 / 60», «noch nicht begonnen», geschafft mit dem Polarstern), darüber
«Weiter» zum zuletzt gespielten, nicht geschafften Grad; gibt es keinen, fehlt «Weiter». Die Karte setzt einen
begonnenen Grad fort, öffnet bei einem geschafften die Übersicht und beginnt sonst einen Durchgang. «Von vorn» (mit
Rückfrage) löscht den Stand eines Grads, nicht seine Bestwerte. Kommt das Menü aus dem Spiel, wartet das Level
darunter; die Zeit im Menü zählt nicht.
_Vermeiden_: Wahl (das ist die Wahl der Level, siehe unten), Levelauswahl

**Durchgang**:
Einmal die Geschichte in einem Grad: Prolog, auf Wunsch «Im Dorf», die sechs Welten, Finale beim Polarstern, Epilog.
Seine 60 Level stehen in fester Reihenfolge (`STORY_LEVELS`); sein Stand (Platz, gelöste Level, gesehene Momente,
geschafft) gilt nur für seinen Grad (`progress`, `prisma.noa.<grad>`). Geschafft ist ein Grad, wenn sein Finale
gesehen ist, nicht schon mit 60 gelösten Leveln. Nach «Von vorn» beginnt ein neuer Durchgang, mit Prolog und
Einstiegen.
_Vermeiden_: Reise (für die 60 Level eines Grads in ihrer Reihenfolge; im Code `story.steps`)

**Welt**:
Eine der sechs Stationen eines Durchgangs, in dieser Reihenfolge: Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne. Je
Grad hat sie genau 10 Level; die Schwierigkeit steigt von Welt zu Welt. Im Spiel und im Code heisst sie Kapitel
(«Kapitel 2 / 6», `STORY_CHAPTERS`), in den Werkzeugen Welt (`WELTEN`). Abgrenzung: Die Welt bestimmt ihre Skybox, ist
aber mehr als der Hintergrund; dieselbe Skybox kann an mehreren Orten stehen (die Milchstrasse vorerst auch
«Im Dorf»). «Im Dorf» ist ein Kapitel der Geschichte, aber keine Welt und hat keine Nummer.
_Vermeiden_: Skybox, Hintergrund (für die Welt)

**Im Dorf**:
Das Kapitel der Geschichte zwischen Prolog und Bergwald, in dem Noa mit der Taschenlampe übt: die 9 Übungen, das sind
die Level des Tutorials mit ihren Namen und Hinweisen (Kopfzeile «Im Dorf – Umweg», darunter der Grad, «Übung 2 / 9»
und statt der Bedienung der Hinweis der Übung). Nach «Üben» im Angebot kommt der Einstieg ins Dorf, dann die Übungen
der Reihe nach; nach der 9. meldet «Gelöst» «Das Dorf leuchtet» mit «In den Bergwald». Der Knopf «Dorf überspringen»
beendet das Kapitel jederzeit (nicht Esc: Das öffnet im Dorf wie in jedem Level das Menü). Gespielt oder übersprungen,
folgt ein Satz zum Ende («Jetzt weiss Noa, wie man Licht weitergibt …», wartet auf Tippen), dann bringen die
Glühwürmchen das Licht in den Bergwald wie nach «Gleich los». Es ist ein Kapitel, aber keine der sechs Welten: ohne
Nummer, sein Einstieg ohne Träger, und die Übungen zählen nicht zu den 60 Leveln des Grads (im Menü steht der Grad dort
auf «Dorf · 0 / 60»). Menü und Übersicht sind auch im Dorf erreichbar; Neuladen setzt an der Übung fort. Die Übersicht
zeigt das Dorf, sobald «Üben» gewählt ist; nach dem Überspringen sind alle Übungen frei, und eine Übung aus der
Übersicht führt nach der 9. zurück in die Übersicht. Hintergrund vorerst die Milchstrasse, bis der Nutzer eine eigene
Skybox macht (`STORY_DORF.sky`, die eine Stelle dafür). Im Code `STORY_DORF` (Texte, Himmel), `story.inDorf` und
`story.uebung` (die laufende Übung), im Stand `prisma.noa.<grad>.dorf` mit Platz und Ende (gespielt oder
übersprungen), nur nach «Üben».
_Vermeiden_: Tutorial (für das Kapitel; Tutorial heissen die 9 Level selbst, in den Werkzeugen und ausserhalb der
Geschichte), Welt (für das Dorf)

**Angebot**:
Die Frage nach dem Prolog, auf der Bühne: «Bevor die Glühwürmchen das Licht in den Wald tragen: Möchtest du zuerst mit
Noa im Dorf üben?» mit «Üben» (das Kapitel «Im Dorf») und «Gleich los» (Einstieg in den Bergwald); der Fokus steht auf
«Üben». Kommt einmal je Grad, auch nach dem Überspringen des Prologs, und nur, solange der Bergwald nicht gesehen ist.
Die Wahl gilt sofort (gesehen: `angebot`); Neuladen vor der Wahl bringt nur das Angebot wieder, ohne den Prolog. Es
hat kein eigenes Überspringen: «Gleich los» ist es. Im Code `story.offer`, Texte in `STORY_DORF.angebot`.

**Einstieg ins Dorf**:
Das Licht kommt nach «Üben» ins Dorf: ein Untertitel «Im Dorf · Erstes Licht» (Noa übt hinter dem Haus mit der
Taschenlampe), der Lichtpunkt fällt ohne Träger aufs Brett, und die erste Übung wächst. Danach ist der Moment `dorf`
gesehen; er kommt je Grad nur einmal. Überspringbar wie der Einstieg in eine Welt. Abgrenzung: kein Einstieg in eine
Welt, das Dorf ist keine.

**Überspringen**:
Eine Zwischenszene abkürzen, ohne Schnitt: den Prolog (sein Knopf auf der Bühne oder Esc; danach kommt das Angebot),
einen Einstieg in eine Welt oder ins Dorf («Überspringen» oder Esc; das Licht landet weich auf dem Brett) und das
Kapitel «Im Dorf» (nur der Knopf «Dorf überspringen»). Reisen und Finale laufen immer ganz (Entscheid des Nutzers), sie
lassen sich nur durch Tippen beschleunigen. Ein Level lässt sich nie überspringen (ADR 0005).
_Vermeiden_: Überspringen für Level (gibt es nicht), Abbrechen

**Einstieg in eine Welt**:
Das Licht kommt zum ersten Mal je Grad in einer Welt an, ohne Reise davor (nach dem Prolog oder «Im Dorf», beim
Fortsetzen): Ein Träger bringt es, ein Untertitel nennt die Welt, dann fällt es aufs Brett. Kommt je Grad nur einmal
und lässt sich überspringen wie der Prolog; das Licht landet dann ohne Schnitt auf dem Brett. «Im Dorf» hat einen
eigenen Einstieg, ohne Träger. Abgrenzung: Die Reise lässt sich nicht überspringen. Ein Einstieg im Level ist ein
kurzer Strang, den ein anderer Strahl an einem seiner Spiegel trifft (siehe Füllteil).

**Reise**:
Der Übergang von einer Welt in die nächste: Die Strahlen der Ziele steigen zu einem Lichtpunkt auf, ein Träger nimmt
ihn mit, ein Untertitel sagt, wohin es geht. Sie läuft immer ganz und lässt sich nicht überspringen (Entscheid des
Nutzers), nur durch Tippen beschleunigen. Beim Wiederholen gibt es keine; dann blendet nur der Hintergrund. Im Code
`story.travel`.
_Vermeiden_: Reise für den Durchgang (die 60 Level eines Grads in ihrer Reihenfolge) und für den Einstieg in eine Welt

**Träger**:
Was das Licht auf der Reise in die nächste Welt trägt, je Welt eines: Glühwürmchen, Gischt, Sand, Glut, Komet.

**Übersicht**:
Die Level eines Grads nach Welten, dazu «Im Dorf», sobald es gespielt wurde: gelöste wieder spielbar (Wiederholen),
das nächste ungelöste offen, spätere gesperrt, je gelöstes Level die Bestwerte. Aus dem Spiel (Knopf «Übersicht»,
Taste L) wartet das Level darunter wie beim Menü; aus dem Menü öffnet sie die Karte eines geschafften Grads.
Abgrenzung: Das Menü zeigt die vier Grade mit ihrem Stand, die Übersicht die Level eines Grads.
_Vermeiden_: Levelauswahl (abgelöst, siehe unten)

**Wiederholen**:
Ein gelöstes Level aus der Übersicht noch einmal spielen. Es kommt ohne Einstieg, Reise und Finale; «Weiter» führt zum
nächsten Level, über eine Weltgrenze blendet nur der Hintergrund. Erst beim nächsten ungelösten Level gilt wieder der
normale Ablauf mit Reise und Finale. Der Platz im Durchgang bleibt; in einem geschafften Grad führt das letzte Level
zurück in die Übersicht, ebenso die 9. Übung im Dorf. Im Code `story.replay`.
_Vermeiden_: Neu starten (setzt das Level auf dem Brett zurück), Von vorn (löscht den Stand eines Grads)

**Bestwerte**:
Je Level die Bestzeit (in ganzen Sekunden) und die wenigsten Drehungen, je für sich über alle Lösungen, auch beim
Wiederholen. Die Übersicht zeigt sie bei gelösten Leveln, je Welt die Summe der Bestzeiten und bei einem geschafften
Grad die ganze Summe; verbessert eine Lösung einen schon vorhandenen Wert, meldet es das Feld «Gelöst» («Neue
Bestzeit», «Weniger Drehungen»). Sie liegen je Grad getrennt vom Stand (`prisma.noa.<grad>.bestwerte`) und überleben
«Von vorn» (Entscheid des Nutzers).
_Vermeiden_: Rekord, Highscore, Statistik

**Testschnittstelle**:
`window.__prismaDebug`, nur über die Konsole: Werkzeuge, Proben und die Bilder der KI-Tester steuern das Spiel damit.
Sie bietet keinen Weg, ein Level zu überspringen; auch Taste N und `?signal` gibt es nicht mehr (ADR 0005).

## Level der Geschichte

**Wahl**:
Welche 60 Level ein Grad bekommt und in welcher Reihenfolge, nachbaubar gerechnet (`tools/geschichte.mjs wahl`,
`tools/geschichte/wahl.json`): kein abgelehntes Level, Vielfalt vor Bewertung, die Schwierigkeit steigt über die
Welten und innerhalb einer Welt.
_Vermeiden_: Levelliste (das sind die Regeln der Reihe)

**Bewertung**:
Die Rangfolge der Level für die Wahl: zuerst das Gefühl im Mittel der Urteile beider KI-Tester, dann der Anteil der
Urteile mit Aha-Moment, dann der Spielwert. Ohne Urteil wird sie aus dem Spielwert geschätzt. Abgrenzung: weder die
Schwierigkeit noch der Spielwert allein.

**Haupt-Kernidee**:
Unter den nötigen Kernideen eines Levels die, die dem Schliessen am meisten abverlangt, nach fester Rangfolge (Falle,
Abschalten, Farben abzählen, Sammelstelle, Lockvogel, Mischziel aus zwei Quellen). Ohne nötige Kernidee hat ein Level
keine. Nach ihr zählt die Vielfalt. (Hier und nicht unter «Was Spass macht»: Diesen Abschnitt lesen die KI-Tester, und
jede Änderung dort verlangt eine neue Version ihres Ablaufs, siehe `tools/ki-tester/protocol.mjs`.)

**Vielfalt**:
Die Regel der Wahl, die vor der Bewertung gilt: dieselbe Haupt-Kernidee höchstens zweimal je 10 aufeinanderfolgende
Level eines Grads, auch über die Grenzen der Welten, und keine zwei Level einander zu ähnlich.

**Name**:
Der stabile Schlüssel eines Levels (`name`), eindeutig über Spiel und Vorrat und nach dem Entfernen nie wieder
vergeben. Werkzeuge, Protokoll der KI-Tester, Golden-Test, Eichung und Stand erkennen ein Level daran.
_Vermeiden_: Name für das, was der Spieler in der Geschichte liest (das ist der Titel)

**Titel**:
Der Anzeigename eines Levels der Geschichte (`titel`): ein oder zwei Wörter, die zu seiner Welt passen, eindeutig über
alle Titel und Namen. Das Spiel zeigt den Titel, sonst den Namen (die Übungen im Dorf). Ein Titel gehört zum Platz in
der Welt: Ersetzt ein Level ein anderes, behält der Platz seinen Titel; ein Level im Vorrat hat keinen.

**Vorrat**:
Die Level, die nicht im Spiel stehen, aber jederzeit zurückkommen können: die nicht gewählten flachen Level und alle
Würfel-Level. Sie behalten Leveldaten und Herkunft, ihre Urteile bleiben gültig. Versioniert unter `tools/vorrat/`,
ablegen und zurückholen mit `tools/vorrat.mjs`; wer alle Level braucht, liest Spiel und Vorrat zusammen über den Lader
(`tools/lader.mjs`). Abgrenzung: Ein entferntes Level ist endgültig weg, sein Name gesperrt (`entfernteNamen`); seine
Leveldaten stehen nur noch als feste Kopie für die Eichung.
_Vermeiden_: Archiv, entfernt, gelöscht (für Level im Vorrat)

## Beurteilung von Leveln

**Schwierigkeit**:
Wie viel Denkarbeit ein Level einem Spieler abverlangt. Bestimmt die Reihenfolge der Level.
_Vermeiden_: Wertung, Bewertung, Score

**Spielwert**:
Wie viel Spass ein Level macht, unabhängig von seiner Schwierigkeit. Entscheidet, ob ein Level ins Spiel kommt.
_Vermeiden_: Qualität, Bewertung, Wertung

**Schwierigkeitsgrad**:
Leicht, mittel, schwer oder sehr schwer; folgt über feste Schwellen aus der Schwierigkeit und sinkt entlang der
Reihenfolge nie. Jedes Level ausser dem Tutorial hat einen. Kurz: Grad.
_Vermeiden_: Stufe, Markierung

**KI-Tester**:
Ein KI-Agent, der Level aus Spielersicht beurteilt, wo der Code wenig weiss (Aha-Moment, Lesbarkeit, Gefühl). Er
darf ein Level ablehnen oder um wenige Plätze verschieben; sonst entscheidet der Code.
_Vermeiden_: Tester (ohne Zusatz klingt es nach Menschen)

## Was Spass macht

**Kernidee**:
Die Einsicht, um die ein Level gebaut ist. Ein Level ab „mittel“ hat mindestens eine.
_Vermeiden_: Muster, Grundmuster (das ist die Anordnung auf dem Feld)

**Aha-Moment**:
Der Moment, in dem der Spieler die Kernidee findet und das Level damit knackt.

**Schliessen**:
Lösen durch Folgern, Schritt für Schritt, ohne blind zu drehen.

**Farblogik**:
Mischen, Filtern oder Zerlegen von Farben ist für die Lösung nötig.

**Zusammenspiel**:
Strahlen kreuzen sich, ein Element wird mehrfach getroffen oder von mehreren Quellen genutzt.

## Kernideen

**Mischziel aus zwei Quellen**:
Ein Ziel, dessen Farbe nur entsteht, wenn sich Strahlen aus zwei verschiedenen Quellen darauf treffen.

**Abschalten**:
Ein Ziel bekommt Licht in der Farbe des Ziels und leuchtet schon, doch die Lösung verlangt, dieses Licht wegzunehmen.
Abgrenzung: Die Falle bringt dasselbe Licht auf einem anderen Weg ans Ziel, das Abschalten nimmt es dem Ziel weg.

**Farben abzählen**:
Aus den Zielfarben folgern, welche Grundfarbe von welcher Quelle wohin muss.

**Sammelstelle**:
Ein Prisma, das Licht aus mehreren Richtungen sammelt und neu verteilt.

**Falle**:
Eine naheliegende Stellung eines Prismas oder Spiegels, die in die Irre führt.
Abgrenzung: Die Falle bringt dasselbe Licht auf einem anderen Weg ans Ziel, das Abschalten nimmt es dem Ziel weg.

**Lockvogel**:
Ein festes Teil abseits der Lösung, das beim Probieren Licht bekommt.

## Was Spass verdirbt

Jeder dieser Punkte schliesst ein Level aus dem Spiel aus.

**Probieren**:
Lösen durch Drehen, bis es passt, weil es viele Fast-Lösungen gibt und Folgern nicht weiterhilft.

**Füllteil**:
Ein kurzer Strang (eine Quelle, höchstens drei Spiegel, eigenes Ziel), dessen Stellungen für keinen anderen Strahl
eine Rolle spielen. Gilt erst ab „mittel“; ein leichtes Level darf aus solchen Strängen bestehen.
_Vermeiden_: Füllteil für einen kurzen Strang, den ein anderer Strahl an einem seiner Spiegel trifft (das ist ein
Einstieg)

**Scheinmischung**:
Eine Mischung, die nichts bewirkt: Ein Kombinator gibt einen seiner Eingänge unverändert weiter, eine Mischung läuft
in ein Prisma, das genau ihre Eingänge wieder trennt, oder in einen Filter, der nur einen Eingang durchlässt. Sieht
nach Farblogik aus, ist aber keine. Gilt in allen Schwierigkeitsgraden.

**Zerfall**:
Das Level besteht aus unabhängigen Teilrätseln, die sich einzeln lösen lassen. Ein gemeinsames Mischziel verbindet
zwei Teile. Gilt erst ab „mittel“.

**Knäuel**:
So viele Elemente so dicht beieinander, dass das Feld unübersichtlich wird.

## Abgelöst

Begriffe aus älteren Specs, Tickets und Kommentaren, die den Ablauf des Spiels nicht mehr beschreiben.

**Reihe** (500er-Reihe):
Bis zum 29.10.2026 der Ablauf des Spiels: das Tutorial und alle flachen Level in einer festen Folge nach
Schwierigkeit, zuletzt 500, daneben die Würfel-Level in einer eigenen Folge.
_Abgelöst_ als Ablauf durch die Geschichte (ADR 0005). Werkzeuge und Tests (Levelliste, KI-Tester, Golden-Test)
rechnen weiter mit ihr, als ganzer Folge aus Spiel und Vorrat.

**Levelauswahl**:
Die Wahl eines Levels der Reihe, nach Fläche und Würfel getrennt, in Seiten zu 10.
_Abgelöst_ durch die Übersicht (ADR 0005).

**Hintergrund wählen**:
Der Spieler schaltete die Skybox selbst um (Knopf, Taste H).
_Abgelöst_: Die Welt bestimmt den Hintergrund (ADR 0005).

**Platzhalter** (Level der Geschichte):
Bis zum 30.10.2026 ein Level in «sehr schwer», das nur vorläufig in der Geschichte stand, weil dort die Vielfalt mit den
vorhandenen Leveln nicht aufging.
_Abgelöst_ mit Ticket 09: Besser bewertete, beurteilte Level ersetzen alle 23, die Vielfalt geht ganz auf; die
ersetzten liegen im Vorrat (ADR 0005). Im Code der Skyboxen heissen weiterhin die Farben Platzhalter, die stehen,
solange ein Bild lädt.
