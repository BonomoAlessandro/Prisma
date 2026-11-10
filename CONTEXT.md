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

**Brett**:
Das 7×7-Feld mit Oberfläche, Seiten und Kante, auf dem die Elemente stehen. Das Feld ist überall eben und gleich
gross; Rand, Dicke und Form hat jedes Brett für sich, innerhalb von 9,8 × 9,8 m (dem Umriss des Steinbretts). Es
schwebt in jeder Welt und folgt dem Himmel: Jeder Himmel aus Blender nennt sein festes Brett in seiner Beschreibung
(Brett-Angabe in `skybox.json`: Art und Werte); ohne Angabe gilt das Steinbrett. Die Bretter der Welten:
Gezeitenbecken am Strand (`tidePool`), Lehmterrasse in der Wüste (`clay`), Moospolster im Bergwald (`moss`), Hochbeet
im Dorf (`raisedBed`; nicht das Hochbeet in Noas Garten im Himmel des Dorfs) und Basaltsäulen am Vulkan (`basalt`).
Jedes hat seine eigene Lichtwelle beim Lösen. Drehteller, Sockel und der Teller des Prismas gehören nicht dazu, sie
sehen überall gleich aus. Im Code `boardTheme`, die Arten in `BOARD_TYPES`; an älteren Stellen heisst es noch Platte
(`PLATE`).
_Vermeiden_: Plattform, Steinplatte (für jedes Brett), Spielfeld (das ist nur das 7×7-Feld)

**Steinbrett**:
Das Brett aus dunklem, fein geädertem Schiefer mit eingravierten Rasterlinien, einer hellen Einlegelinie, polierten
Seiten und einer Metallkante, 9,8 × 9,8 m gross und 0,38 m dick, mit einem Rand von 0,7 m um das Feld. Es steht
unter der Milchstrasse und dem Sonnensystem und überall, wo ein Himmel kein eigenes Brett nennt. Im Code die Art
`stone`.
_Vermeiden_: Steinplatte, Plattform

**Weigerung**:
Ein festes Element auf eckigem Sockel (Quelle, Ziel, Filter, fester Spiegel, festes Prisma, fester Kombinator) wackelt
beim Antippen kurz, sein roter Rand blitzt auf. Ohne Text, ohne Zug; Strahlen und Speicherstand bleiben. Es gilt im
ganzen Spiel, nicht in Würfel-Leveln (dort Rahmen statt Sockel); Elemente ohne Sockel (Blocker) reagieren nicht.
Liegt ein drehbares Element im Toleranzbereich des Tippens, gewinnt immer das drehbare. Rund heisst drehbar, eckig
heisst fest. Im Code `weigern`, die Auswahl `pickTapped`.
_Vermeiden_: Fehlklick, Ablehnung

## Noas Geschichte

**Geschichte**:
«Ein Lichtsignal an die Sterne», der einzige Ablauf des Spiels: Noa will aus einem Bergdorf dem Polarstern ein
Zeichen schicken, und der Spieler gibt das Licht Welt für Welt weiter; jede Welt weckt dabei einen Stern des Kleinen
Wagens. Sie ersetzt die Reihe (ADR 0005). Im Code `story`.
_Vermeiden_: Storyline, Story-Modus, Signal (Namen aus der Zeit, als sie ein Prototyp neben der Reihe war)

**Grad**:
Kurz für Schwierigkeitsgrad. Der Spieler wählt ihn im Menü für einen ganzen Durchgang und wechselt ihn nur dort; jeder
Grad hat seine eigenen 60 Level und seinen eigenen Stand. Im Code `grad`.
_Vermeiden_: Schwierigkeit (das ist das Mass, aus dem der Grad folgt), Modus

**Menü**:
Was nach dem Startbildschirm kommt und wohin «Menü» (Knopf, Esc) im Spiel und «Zum Menü» nach dem Epilog führen: die
vier Grade als Reiter, je mit seinem Stand («Wüste · 23 / 60», «noch nicht begonnen», geschafft mit dem Polarstern).
Der gewählte Grad zeigt seinen Kleinen Wagen wie auf einer Sternkarte: die Namen der Welten an ihren Sternen, wache
Sterne hell, fehlende Linien gestrichelt, der Stern der Welt, in der das Licht ist, mit Ring; ist seit dem letzten
Zeigen ein Stern erwacht, blitzt er auf. Darunter sein Knopf: «Weiter» beim zuletzt gespielten, nicht geschafften Grad
(ihn wählt das Menü beim Öffnen), sonst «Fortsetzen», «Beginnen» oder bei einem geschafften «Übersicht». Ein Reiter
wählt nur; ausgeführt wird mit dem Knopf (oder Enter auf dem Reiter). «Von vorn» (mit Rückfrage) löscht den Stand des
gewählten Grads, nicht seine Bestwerte. Kommt das Menü aus dem Spiel, wartet das Level darunter; die Zeit im Menü
zählt nicht.
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
Grad hat sie genau 10 Level; die Schwierigkeit steigt von Welt zu Welt, und jede weckt ihren Stern des Kleinen
Wagens. Im Spiel und im Code heisst sie Kapitel («Kapitel 2 / 6», `STORY_CHAPTERS`), in den Werkzeugen Welt
(`WELTEN`). Abgrenzung: Die Welt bestimmt ihre Skybox, ist aber mehr als der Hintergrund; dieselbe Skybox kann an
mehreren Orten stehen. «Im Dorf» ist ein Kapitel der Geschichte, aber keine Welt und hat keine Nummer.
_Vermeiden_: Skybox, Hintergrund (für die Welt)

**Kleiner Wagen**:
Das Sternbild aus sieben Sternen, an der Spitze seiner Deichsel der Polarstern; der Grund, warum das Licht durch alle
sechs Welten muss. Die sechs übrigen Sterne schlafen, bis jede Welt ihren weckt, zuerst die Schale, dann die Deichsel
hinauf; der Polarstern wird nicht geweckt, er antwortet im Finale. Er hat überall dieselbe Form (die des
Ladezeichens: Polarstern oben links, Schale unten rechts) und steht an einer festen Stelle hoch am Himmel jeder Welt
und des Dorfs; wechselt die Welt, bleibt er stehen. Zu sehen ist er, wenn die Kamera hinaufschaut (Einstieg, Ende
einer Welt, Reise, Finale), nicht im Spiel und nicht hinter dem Menü (Entscheid des Nutzers). Wache Sterne und ihre
Linien leuchten hell, auch bei Tag (Meer, Wüste); schlafende sind bei Nacht blasse Punkte und bei Tag unsichtbar, nur
der Stern der Welt bleibt ein feiner Funke. Im Prolog schlafen alle sechs, in Prolog 4 zeichnen sich die Linien einmal
schwach ab; am Ende des Finales blendet der Wagen am Himmel in den über dem Dorf (Wagen in Wagen; die Kamera schaut
dafür weiter, damit er über die Berge der Bühne passt), und im Epilog leuchten alle sieben. Menü, Übersicht und die
Leiste unter dem Untertitel der Ankunft zeigen ihn im Stand des Grads. Im Code `wagen` (Form, Linien, Stand), am
Himmel der Welten `himmelsWagen`.
_Vermeiden_: Sternzeichen (das ist ein Zeichen des Tierkreises), Planeten (für seine Sterne; Planeten heisst eine Welt)

**Stern einer Welt**:
Der Stern des Kleinen Wagens, den eine Welt weckt: Bergwald Stern 1 (aussen an der Schale), Meer 2, Wüste 3, Vulkan 4
(wo die Deichsel ansetzt), Planeten 5, Sterne 6 (neben dem Polarstern). Solange er schläft, atmet er bei Nacht kaum
merklich und ist bei Tag ein feiner Funke. Der Einstieg in eine Welt und die Reise dorthin führen das Licht an ihm
vorbei, er zuckt kurz auf; am Ende der Welt steigen die Strahlen der Ziele zu ihm, und er erwacht. «Im Dorf» hat
keinen Stern.

**Erwachen**:
Ein Stern des Kleinen Wagens wird wach, am Ende seiner Welt nach «Gelöst» und «Weiter»: Die Strahlen der Ziele steigen
zu ihm, er blitzt auf und bleibt hell, die Linie vom vorigen Stern zieht sich (mit dem Vulkan auch die zum Bergwald:
die Schale schliesst sich), und ein Glockenton klingt, von Stern zu Stern höher. Der sechste erwacht im Finale; dann
läuft ein Lichtpuls mit allen sechs Tönen durch den Wagen und über die Deichsel zum Polarstern, der den Schlusston setzt
und antwortet. Wach ist ein Stern, sobald das letzte Level seiner Welt im Durchgang gelöst ist, bis «Von vorn»; jeder
Grad hat seinen eigenen Wagen, ein geschaffter zeigt alle sieben wach. Neuladen, Fortsetzen, Menü, Übersicht und
Wiederholen zeigen diesen Stand ohne Erwachen (im Menü blitzt ein seit dem letzten Zeigen erwachter Stern nur auf);
wer nach dem letzten Level einer Welt neu lädt, sieht den Stern schon wach. Der Stand folgt aus den gelösten Leveln,
ohne eigenes Feld im Speicherstand. Im Code `story.erwache`, der Stand `wagen.stand`.

**Im Dorf**:
Das Kapitel der Geschichte zwischen Prolog und Bergwald, in dem Noa mit der Taschenlampe übt: die 9 Übungen, das sind
die Level des Tutorials mit ihren Namen und Schritten (Kopfzeile «Im Dorf – Umweg», darunter Ziele und Grad, «Übung 2 / 9»
und der Satz des laufenden Schritts, siehe Führung; einen festen Hinweissatz je Übung gibt es seit der Führung nicht
mehr). Nach «Üben» im Angebot kommt der Einstieg ins Dorf, dann die Übungen
der Reihe nach; nach der 9. meldet «Gelöst» «Das Dorf leuchtet» mit «In den Bergwald». Der Knopf «Dorf überspringen»
beendet das Kapitel jederzeit (nicht Esc: Das öffnet im Dorf wie in jedem Level das Menü). Gespielt oder übersprungen,
folgt ein Satz zum Ende («Jetzt weiss Noa, wie man Licht weitergibt …», wartet auf Tippen), dann bringen die
Glühwürmchen das Licht in den Bergwald wie nach «Gleich los». Es ist ein Kapitel, aber keine der sechs Welten: ohne
Nummer, sein Einstieg ohne Träger, und die Übungen zählen nicht zu den 60 Leveln des Grads (im Menü steht der Grad dort
auf «Dorf · 0 / 60»). Menü und Übersicht sind auch im Dorf erreichbar; Neuladen setzt an der Übung fort. Die Übersicht
zeigt das Dorf, sobald «Üben» gewählt ist; nach dem Überspringen sind alle Übungen frei, und eine Übung aus der
Übersicht führt nach der 9. zurück in die Übersicht. Hintergrund ist Noas Dorf bei Nacht (Skybox `village`,
`STORY_DORF.sky`); an seinem Himmel steht der Kleine Wagen wie im Prolog, alle sechs Sterne schlafend. Im Code
`STORY_DORF` (Texte, Himmel), `story.inDorf` und `story.uebung` (die laufende Übung), im Stand
`prisma.noa.<grad>.dorf` mit Platz und Ende (gespielt oder übersprungen), nur nach «Üben».
_Vermeiden_: Tutorial (für das Kapitel; Tutorial heissen die 9 Level selbst, in den Werkzeugen und ausserhalb der
Geschichte), Welt (für das Dorf)

**Führung**:
Wie eine Übung im Dorf den Spieler durch ihre Schritte leitet (Richtung «Vorzeigen»): Der Satz des Schritts steht in
der Kopfzeile, wo früher der Hinweis stand, ein gestrichelter Umriss läuft um das Element, eine Hand zeigt die Geste
einmal vor. Frei: Alles reagiert wie immer, nichts wird gesperrt, Fehlversuche bleiben ohne Meldung, gelöst wird nie
von selbst; wird die Übung früher gelöst, gilt das sofort, und nichts bleibt stehen. Sie läuft jedes Mal ganz, nur im
Dorf; Neustart und Neuladen beginnen beim ersten Schritt, Menü und Übersicht behalten ihn. Ohne Speicherstand. Im Code
`fuehrung` (Anzeige, Uhr), die Daten `schritte` und `nebenbei` je Übung.
_Vermeiden_: Tutorial (für die Führung), Hilfe

**Schritt**:
Ein Teil der Führung: ein Satz im Du von etwa zwölf Wörtern (Platzhalter je Gerät wie «Tippe» / «Klicke») und das, was
ihn weiterschaltet: ein Element antippen (ein festes weigert sich dabei), ein Element drehen (auch nur zurück), der
Strahl trifft ein Element (auch eines, für das ein anderes, umrandetes Element zu drehen ist, und auch nur mit einer
bestimmten Farbe, etwa Magenta im Kombinator), oder bei einer Erklärung
der Knopf «Weiter» am Satz. Höchstens drei je Übung; der Satz bleibt stehen, bis der nächste kommt, nach dem letzten
bis zum Lösen. Im Code `schritte` (`SCHRITT_WEITER`, `schrittErfuellt`).
_Vermeiden_: Stufe, Hinweis (für einen Schritt)

**Hinweis nebenbei**:
Ein leiser Satz unter dem Schritt zu Kamera oder Neustart: Er wartet auf nichts, zählt nicht zu den Schritten,
verschwindet bei der ersten Benutzung (Kamerageste, Neustart) oder spätestens mit dem Lösen und kommt beim Neustart
derselben Übung nicht wieder. Im Code `NEBENBEI`.

**Später Fingerzeig**:
Nach 15 s ohne Fortschritt (neuer Schritt, ein Element in der Stellung der Lösung) zeigt die Führung noch einmal: Der
Umriss läuft schneller, die Hand zeigt die Geste wieder, «Weiter» stupst; nach den Schritten gilt das dem nächsten
Element ausserhalb der Lösung. Er löst nie. Die 15 s sind vorläufig, sie werden nach den Tests von Hand (Poco, eine
Person, die Prisma nicht kennt) festgelegt. Im Code `FUEHRUNG.fingerzeig`, `fingerzeigZiel`.

**Angebot**:
Die Frage nach dem Prolog, auf der Bühne: «Bevor die Glühwürmchen das Licht in den Wald tragen: Möchtest du zuerst mit
Noa im Dorf üben?» mit «Üben» (das Kapitel «Im Dorf») und «Gleich los» (Einstieg in den Bergwald); der Fokus steht auf
«Üben». Kommt einmal je Grad, auch nach dem Überspringen des Prologs, und nur, solange der Bergwald nicht gesehen ist.
Die Wahl gilt sofort (gesehen: `angebot`); Neuladen vor der Wahl bringt nur das Angebot wieder, ohne den Prolog. Es
hat kein eigenes Überspringen: «Gleich los» ist es. Im Code `story.offer`, Texte in `STORY_DORF.angebot`.

**Einstieg ins Dorf**:
Das Licht kommt nach «Üben» ins Dorf: ein Untertitel «Im Dorf · Erstes Licht» (Noa übt hinter dem Haus mit der
Taschenlampe) in der Mitte wie bei der Ankunft in einer Welt, die Leiste darunter mit allen Zeichen blass; der
Lichtpunkt fällt ohne Träger aufs Brett, und die erste Übung wächst. Danach ist der Moment `dorf`
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
Fortsetzen): Ein Träger bringt es am schlafenden Stern dieser Welt vorbei, der kurz aufzuckt, ein Untertitel nennt die
Welt (derselbe wie auf der Reise dorthin), dann fällt es aufs Brett. Kommt je Grad nur einmal und lässt sich
überspringen wie der Prolog; das Licht landet dann ohne Schnitt auf dem Brett. «Im Dorf» hat einen eigenen Einstieg,
ohne Träger und ohne Stern. Abgrenzung: Die Reise lässt sich nicht überspringen. Ein Einstieg im Level ist ein
kurzer Strang, den ein anderer Strahl an einem seiner Spiegel trifft (siehe Füllteil).

**Reise**:
Der Übergang von einer Welt in die nächste: Die Strahlen der Ziele steigen zum Stern dieser Welt auf, er erwacht; ein
Träger nimmt das Licht und fliegt am nächsten, noch schlafenden Stern vorbei, der kurz aufzuckt, hinab in die nächste
Welt. Der Kleine Wagen bleibt dabei stehen, nur die Welt darunter blendet über. Der Untertitel in der Mitte nennt
Kapitel und Welt und erzählt, welcher Stern erwacht ist und wohin er weist, das Licht steht darüber; die Leiste am
unteren Rand zeigt den Wagen mit den Zeichen der Welten, der eben geweckte Stern blitzt darin auf. Sie läuft immer
ganz und lässt sich nicht überspringen (Entscheid des Nutzers), nur durch Tippen beschleunigen. Beim Wiederholen gibt
es keine; dann blendet nur der Hintergrund. Nach den Sternen kommt statt einer Reise das Finale. Im Code
`story.travel`.
_Vermeiden_: Reise für den Durchgang (die 60 Level eines Grads in ihrer Reihenfolge) und für den Einstieg in eine Welt

**Träger**:
Was das Licht vom eben geweckten Stern in die nächste Welt trägt, je Welt eines: Glühwürmchen, Gischt, Sand, Glut,
Komet; die Sterne haben keinen, nach ihnen kommt das Finale. Beim Einstieg in eine Welt bringt es der Träger der Welt
davor, in den Bergwald die Glühwürmchen des Prologs.

**Übersicht**:
Die Level eines Grads als Himmel mit seinem Kleinen Wagen: um den Stern jeder Welt ihre 10 Level als kleine Sterne
(gelöst hell, das nächste ungelöste mit Ring, spätere blass), dazu «Im Dorf» als eigener Haufen, sobald es gespielt
wurde. Ein gewählter Haufen zeigt seine Level daneben (auf dem Handy hoch darunter) als Liste, eine Welt zur Zeit:
gelöste wieder spielbar (Wiederholen), das nächste ungelöste offen, spätere gesperrt, je gelöstes Level die
Bestwerte. Aus dem Spiel (Knopf «Übersicht», Taste L) wartet das Level darunter wie beim Menü; aus dem Menü öffnet sie
der Knopf «Übersicht» eines geschafften Grads.
Abgrenzung: Das Menü zeigt die vier Grade mit ihrem Stand, die Übersicht die Level eines Grads.
_Vermeiden_: Levelauswahl (abgelöst, siehe unten)

**Wiederholen**:
Ein gelöstes Level aus der Übersicht noch einmal spielen. Es kommt ohne Einstieg, Reise und Finale, also ohne
Erwachen; der Kleine Wagen zeigt den Stand des Durchgangs. «Weiter» führt zum nächsten Level, über eine Weltgrenze
blendet nur der Hintergrund. Erst beim nächsten ungelösten Level gilt wieder der normale Ablauf mit Reise und Finale.
Der Platz im Durchgang bleibt; in einem geschafften Grad führt das letzte Level zurück in die Übersicht, ebenso die 9.
Übung im Dorf. Im Code `story.replay`.
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
_Abgelöst_ als Ablauf durch die Geschichte (ADR 0005). Weiter die Folge aller flachen Level aus Spiel und Vorrat:
Referenz der KI-Tester, Platz im Vorrat und Ort, an dem neue Level ihren Grad bekommen (`ordne-level.mjs`,
Levelliste). Austausch, Seiten und der Bedarf je Gruppe sind weg (Ticket 08).

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
