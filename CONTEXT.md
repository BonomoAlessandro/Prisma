# PRISMA

Ein Lichtstrahl-Puzzle: Spiegel, Prismen, Filter und Kombinatoren lenken farbiges Licht von Quellen auf Ziele.
Dieses Glossar hält fest, wie wir über Level und ihre Beurteilung sprechen.

## Auf dem Feld

**Strahlregel**:
Wie Licht durchs Feld läuft und an Elementen umgelenkt, geteilt, gefiltert oder gemischt wird. Sie gilt in flachen
Leveln und Würfel-Leveln gleich.

**Flaches Level**:
Ein Level auf einem quadratischen Feld; alle Strahlen laufen in einer Ebene. Alle heutigen Level sind flach.
_Vermeiden_: 2D-Level

**Würfel-Level**:
Ein Level in einem Würfel aus mehreren Ebenen; Strahlen laufen auch zwischen den Ebenen.
_Vermeiden_: 3D-Level (dreidimensional dargestellt werden auch flache Level)

**Drehachse**:
Die feste Achse, um die sich ein Element dreht. In der Ebene senkrecht dazu wirkt es wie in einem flachen Level. In
flachen Leveln steht sie immer senkrecht.

**Strang**:
Der Weg eines Strahls von einer Quelle über Spiegel zu einem Ziel.

**Mischziel**:
Ein Ziel, dessen Farbe erst im Level gemischt wird, durch einen Kombinator oder durch mehrere Strahlen auf dem Ziel.
Ein weisses Ziel, das sein Weiss direkt aus einer weissen Quelle bekommt, ist keines.

## Beurteilung von Leveln

**Schwierigkeit**:
Wie viel Denkarbeit ein Level einem Spieler abverlangt. Bestimmt die Reihenfolge der Level.
_Vermeiden_: Wertung, Bewertung, Score

**Spielwert**:
Wie viel Spass ein Level macht, unabhängig von seiner Schwierigkeit. Entscheidet, ob ein Level ins Spiel kommt.
_Vermeiden_: Qualität, Bewertung, Wertung

**Schwierigkeitsgrad**:
Leicht, mittel, schwer oder sehr schwer; folgt über feste Schwellen aus der Schwierigkeit und sinkt entlang der
Reihenfolge nie. Jedes Level ausser dem Tutorial hat einen.
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
