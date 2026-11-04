# Spec: Der Kleine Wagen (PLAN 0.4)

Status: ready-for-agent

Begriffe nach `CONTEXT.md` (Abschnitte «Noas Geschichte» und «Level der Geschichte»); die neuen Begriffe dieser Spec
(Kleiner Wagen, Stern einer Welt, Erwachen) kommen mit dem Doku-Ticket dazu. Grundlage ist der Entwurf in PLAN.md 0.4
vom 01.11.2026, entschieden im Grilling vom 04.11.2026. Gilt neben ADR 0005 (Geschichte ersetzt die feste Reihe),
ADR 0007 (Bühne von Prolog und Epilog in WebGL) und ADR 0008 (Spiel mit 60 Bildern/s).

## Problem

Noa will dem Polarstern ein Zeichen schicken, und der Spieler trägt das Licht durch sechs Welten. Die Geschichte sagt
aber nicht, warum das Licht diesen Umweg nehmen muss, statt direkt zum Polarstern zu gehen. Die Welten stehen
nebeneinander, ohne dass man sieht, was jede einzelne zum Ziel beiträgt: Am Ende einer Welt steigen die Strahlen zu
einem namenlosen Lichtpunkt am Himmel, ein Träger nimmt das Licht mit, und in der nächsten Welt geht es weiter. Der
Spieler sieht keinen Fortschritt am Himmel, der Prolog deutet nicht an, was kommt, und Menü und Übersicht zeigen den
Stand nur als Weg, nicht als etwas, das am Himmel entsteht.

## Lösung

Der **Kleine Wagen** wird der Grund für den Weg. Der Polarstern sitzt an der Spitze seiner Deichsel; die sechs
anderen Sterne schlafen. Jeder wacht über einen Ort der Welt und erwacht erst, wenn dort das Licht leuchtet: Jede der
sechs Welten weckt ihren Stern, der siebte ist der Polarstern.

- Schon im **Prolog** steht der Wagen am Himmel über dem Dorf: sechs blasse Punkte, nur der Polarstern hell.
- Der Wagen steht an einer **festen Stelle am Himmel** jeder Welt und über dem Dorf. Wechselt die Welt, bleibt er
  stehen; nur die Landschaft darunter blendet.
- Am Ende jeder Welt steigen die Strahlen zum **Stern dieser Welt**. Er **erwacht**, verbindet sich mit dem vorigen,
  ein Glockenton klingt, und der Träger fliegt am nächsten, noch schlafenden Stern vorbei in die nächste Welt.
- Im **Finale** erwacht der sechste Stern, ein Lichtpuls läuft durch den ganzen Wagen und über die Deichsel zum
  Polarstern, und der antwortet. Im **Epilog** leuchten über dem Dorf alle sieben Sterne.
- Die Texte von Prolog, Reisen, Finale und Epilog erzählen das. Menü, Übersicht und die Leiste unter dem Untertitel
  bekommen den Wagen nach einem Skizzenkatalog, aus dem der Nutzer wählt.

## Entscheide des Nutzers (04.11.2026)

1. Der Kleine Wagen ist der Grund für den Weg durch alle sechs Welten; jede Welt weckt einen der sechs schlafenden
   Sterne, der siebte ist der Polarstern.
2. Zum Paket gehören Texte, Prolog und Epilog, Wagen am Himmel und Erwachen auf den Reisen, Finale, Ton, Menü,
   Übersicht und die Leiste unter dem Untertitel. Nicht dazu: die Farben-Ebene, der neue Startbildschirm (PLAN 1.3).
3. Die Farben-Ebene (jede Welt gibt dem Licht ihre Farbe, das Finale als Mischziel) bleibt draussen, auch in einer
   leichten Fassung mit farbigen Sternen; die Sterne leuchten weiss. Die Idee bleibt in PLAN 0.4 stehen.
4. Eine Gestalt: die Form des Ladezeichens (Polarstern oben links an der Spitze der Deichsel, Schale unten rechts),
   an einer Stelle im Code; alle Orte nehmen sie von dort.
5. Reihenfolge des Erwachens: zuerst die Schale, dann die Deichsel hinauf (siehe «Der Wagen»).
6. Mit dem Stern des Vulkans wird auch die Linie zum Stern des Bergwalds gezogen: Die Schale ist dann geschlossen.
7. Der Lichtpunkt beim Aufstieg am Ende einer Welt ist der Stern dieser Welt. Er erwacht, sobald die Strahlen ihn
   erreichen, verbindet sich mit dem vorigen, dann fliegt der Träger los.
8. Prolog: sechs blasse Punkte ohne Linien, Polarstern hell; in der Einstellung, in der Noas Strahl verblasst,
   zeichnen sich die Linien einmal ganz schwach ab und verlöschen wieder.
9. Menü, Übersicht und Leiste kommen zuerst als Skizzenkatalog; der Nutzer wählt, bevor etwas ins Spiel kommt.
10. Am Himmel der Welten: geweckte Sterne und ihre Linien immer hell, auch bei Tag; schlafende nur bei Nacht als
    blasse Punkte (Tabelle unter «Der Wagen»). Der Wagen zeigt immer den Stand des Durchgangs.
11. Eine feste Stelle am Himmel für alle Welten; beim Wechsel der Welt bleibt der Wagen stehen, nur die Welt darunter
    blendet.
12. Finale: erst der sechste Stern, dann ein Puls durch den ganzen Wagen und zuletzt über die Deichsel zum Polarstern,
    der dann antwortet wie heute.
13. Texte von Prolog, Finale und Epilog nach dem Entwurf, in Prolog 6 bleibt «von Spiegel zu Spiegel».
14. Texte der Reisen nach dem Entwurf (Planeten angepasst an die geschlossene Schale), ohne die heutigen Nachsätze
    zum Spiel.
15. Epilog: sieben helle Sterne, die Linien glimmen schwach nach; aus dem Finale blendet der Wagen direkt in den Wagen
    über dem Dorf.
16. Je Stern ein leiser Glockenton, steigend von Stern zu Stern; im Finale alle sechs nacheinander, der Polarstern
    setzt den Schlusston.
17. Die Leiste unter dem Untertitel kommt in den Katalog; das Ladezeichen bleibt unverändert.
18. Der Flug einer Reise führt vom eben geweckten Stern am nächsten schlafenden vorbei, der kurz aufzuckt; jeder
    Einstieg in eine Welt führt am Stern seiner Welt vorbei.
19. Eine Reise wird höchstens etwa 1 s länger als heute, das Finale etwa 4 s; Prolog und Epilog bleiben gleich lang.
20. Über dem Dorf (Kapitel «Im Dorf») steht der Wagen wie im Prolog, alle sechs Sterne schlafend.
21. Katalog: eine Seite, auch als private Artifact-Seite fürs Handy; Menü 5–6 Varianten (das heutige als Vergleich),
    Übersicht 3, Leiste 3; umschaltbar nach Stand und Format; mit recherchierten Vorbildern.
22. Spec und Tickets in diesem Ordner, Branch `feature/kleiner-wagen`, Review nach jedem Ticket, der Katalog parallel
    von Anfang an.
23. Glossar: «Kleiner Wagen», «Stern einer Welt», «Erwachen»; «Sternbild» statt «Sternzeichen».
24. Zur Abnahme ein Sprungbrett zu jeder Szene (Knopf «Szenen» mit `?szenen`); nichts wird gespeichert; kein
    `?sterne=`, keine Aufnahmen.
25. Das Sprungbrett lebt nur auf dem Branch und wird vor dem Merge nach main ausgebaut. Zum Test auf dem Poco deployt
    der Nutzer den Feature-Branch selbst; dafür muss nichts nach main.
26. Teststellen: nur die bestehende Browser-Probe der Geschichte und die Messung der Bühne, beide erweitert; keine neue
    Schnittstelle (Bestätigung nach dem Grilling).

## Der Wagen

Sieben Sterne in der Form des Ladezeichens. Die Welten wecken sie in dieser Reihenfolge:

| Stern | Weckt ihn | Lage im Wagen |
|---|---|---|
| 1 | Bergwald | heller Stern aussen an der Schale |
| 2 | Meer | Schale, unten aussen |
| 3 | Wüste | Schale, unten innen |
| 4 | Vulkan | Schale, wo die Deichsel ansetzt |
| 5 | Planeten | Deichsel |
| 6 | Sterne (im Finale) | Deichsel, Nachbar des Polarsterns |
| 7 | Polarstern | Spitze der Deichsel; wird nicht geweckt, er antwortet |

**Linien:** Erwacht Stern k (k ≥ 2), zieht sich eine Linie von Stern k − 1 zu ihm. Mit Stern 4 zusätzlich die Linie
von 4 zu 1 (die Schale schliesst sich). Die Linie von 6 zum Polarstern zieht der Puls im Finale. Danach sind alle
sieben Linien des Ladezeichens gezogen.

**Stand:** Ein Stern ist wach, sobald das letzte Level seiner Welt im Durchgang gelöst ist; das bleibt bis «Von vorn».
Jeder Grad hat seinen eigenen Wagen, so wie seinen eigenen Durchgang. Neuladen, Fortsetzen, Wiederholen, Menü und
Übersicht zeigen diesen Stand; nur das Erwachen selbst (Aufstieg, Reise, Finale) ändert ihn sichtbar. Wer nach dem
letzten Level einer Welt neu lädt, sieht den Stern schon wach, ohne das Erwachen gesehen zu haben (in Kauf genommen).
Ein geschaffter Grad zeigt den ganzen Wagen wach, mit allen Linien.

**Helligkeit am Himmel der Welten und des Dorfs:**

| | Nacht (Dorf, Bergwald, Vulkan, Planeten, Sterne) | Tag (Meer, Wüste) |
|---|---|---|
| Geweckte Sterne und ihre Linien | hell | hell, leuchten durch den Tag |
| Stern dieser Welt (schläft noch) | blass, atmet kaum merklich | feiner Funke |
| Übrige schlafende Sterne | blass wie Hintergrundsterne | unsichtbar |
| Polarstern | mittelhell | blass |

Tag ist, wo der Himmel einer Welt keine Hintergrundsterne zeigt; beim Überblenden zwischen zwei Welten gleitet die
Helligkeit des Wagens mit, sein Ort bleibt. Grösse und Helligkeit stimmt der Nutzer bei der Abnahme ab.

## Ablauf

1. **Prolog** (Bühne): Der Wagen steht in seiner Form um den Polarstern, die sechs Sterne blass wie die schwächsten
   Hintergrundsterne, ohne Funkeln, ohne Linien. In Einstellung 4 (Noas Strahl verblasst) zeichnen sich die Linien
   einmal für einen Atemzug ganz schwach ab und verlöschen. Gleich lang wie heute.
2. **Angebot** und **Im Dorf**: Am Himmel des Dorfs der Wagen wie im Prolog, alle sechs Sterne schlafend. Das Dorf
   hat keinen Stern; sein Einstieg bleibt ohne Träger.
3. **Einstieg in eine Welt** (nach dem Prolog, nach dem Dorf, beim Fortsetzen): Der Träger bringt das Licht am
   schlafenden Stern dieser Welt vorbei, der kurz aufzuckt, dann fällt es aufs Brett.
4. **Spiel:** Der Wagen steht am Himmel im Stand des Durchgangs, ohne Hervorhebung; man sieht ihn, wenn die Kamera
   dorthin schaut.
5. **Ende einer Welt** (Welten 1–5), nach «Gelöst» und «Weiter»:
   1. Die Strahlen der Ziele steigen zum schlafenden Stern dieser Welt; die Kamera schaut dorthin, wo er steht (beim
      Vulkan über die Kraterwand).
   2. Erreichen sie ihn, erwacht er: Er blitzt auf und bleibt hell, die Linie(n) nach «Der Wagen» ziehen sich, ein
      Glockenton klingt (Stern 1 der tiefste, Stern 6 der höchste).
   3. Der Träger nimmt das Licht und fliegt zum nächsten, noch schlafenden Stern; als das Licht vorbeizieht, zuckt er
      kurz auf und wird wieder blass. Darunter blendet die Welt in die nächste; der Wagen bleibt stehen.
   4. Das Licht sinkt aufs Feld der neuen Welt. Der Untertitel nennt wie heute Kapitel und Welt, mit dem neuen Text.
   Höchstens etwa 1 s länger als heute: Das Erwachen passt in den bestehenden Aufstieg, der Flug am nächsten Stern
   vorbei ersetzt den heutigen Bogen.
6. **Finale** (Ende der Welt Sterne):
   1. Die Strahlen steigen zum sechsten Stern; er erwacht.
   2. «Der letzte Stern erwacht. Der Kleine Wagen leuchtet, von einem Ende bis zum anderen.» Ein Lichtpuls läuft Stern
      für Stern durch den Wagen, in der Reihenfolge des Erwachens (1 bis 6), mit den sechs Tönen.
   3. «Über die Deichsel läuft das Licht bis zum Polarstern.» Der Puls springt die letzte Linie hinauf, der Polarstern
      flammt auf und setzt den Schlusston.
   4. «Er hat das Zeichen gesehen. Und er antwortet.» Danach wie heute: Sein Strahl fällt aufs Brett, der Aufprall
      klingt aus, der Blick geht hinauf, und es blendet ins Dorf, jetzt **Wagen in Wagen** statt Stern in Stern.
   Jeder Satz wartet wie heute auf Tippen. Etwa 4 s länger als heute. Das Finale bleibt nicht überspringbar.
7. **Epilog** (Bühne): Alle sieben Sterne hell, die Linien glimmen schwach nach. Gleich lang wie heute.
8. **Wiederholen:** ohne Aufstieg, Reise und Finale, also ohne Erwachen; der Wagen zeigt den Stand des Durchgangs.

## Texte

| Stelle | Text |
|---|---|
| Prolog 2 | Jeden Abend steigt Noa auf den Hügel über den Dächern und sucht den Polarstern, ganz vorn an der Deichsel des Kleinen Wagens. |
| Prolog 4 | Doch der Strahl verblasst im Dunkeln. Die Sterne, die ihm den Weg zeigen sollten, schlafen – der Kleine Wagen ist fast unsichtbar. |
| Prolog 6 | Jeder Stern des Wagens wacht über einen Ort der Welt und erwacht erst, wenn dort Licht leuchtet. Trag Noas Licht von Spiegel zu Spiegel, von Ort zu Ort – Stern für Stern bis zum Polarstern. |
| Ankunft Bergwald | Die Glühwürmchen tragen Noas Licht tief in den Bergwald. Über den Wipfeln schläft der erste Stern des Wagens. |
| Ankunft Meer | Über dem Wald erwacht der erste Stern und weist zum Meer. Die Glühwürmchen tragen das Licht über die Hügel bis an den Strand. |
| Ankunft Wüste | Der zweite Stern erwacht und weist weit übers Wasser. Der Wind über den Wellen trägt das Licht bis an den Rand der Wüste. |
| Ankunft Vulkan | Über den Dünen funkelt der dritte Stern. Ein Wirbel aus Sand trägt das Licht dorthin, wo die Erde rot glüht. |
| Ankunft Planeten | Der vierte Stern erwacht, und die Schale des Wagens schliesst sich. Der Vulkan bricht aus und schleudert das Licht hinauf, höher als alle Wolken. |
| Ankunft Sterne | Fünf Sterne leuchten, nur einer schläft noch. Ein Komet trägt das Licht hinaus, dorthin, wo nur noch Sterne sind. |
| «Gelöst» bei den Sternen | Der Wagen ist wach |
| Finale | Der letzte Stern erwacht. Der Kleine Wagen leuchtet, von einem Ende bis zum anderen. / Über die Deichsel läuft das Licht bis zum Polarstern. / Er hat das Zeichen gesehen. Und er antwortet. |
| Epilog 3 | Noa lacht und blinkt mit der Taschenlampe zurück. Über dem Dorf leuchten jetzt sieben Sterne, und keiner schläft mehr. |

Unverändert bleiben Prolog 1, 3 und 5, Epilog 1 und 2, das Angebot, die Texte des Dorfs und die übrigen Meldungen
«Gelöst» («Der Wald leuchtet» …) samt ihren Knöpfen. Die Texte der Reisen gelten auch für den Einstieg in eine Welt
(wie heute derselbe Untertitel).

## Skizzenkatalog: Menü, Übersicht, Leiste

- Eine Seite im Ordner dieser Spec, zusätzlich als private Artifact-Seite, damit der Nutzer sie auf dem Handy sieht.
- **Menü:** 5–6 Varianten, das heutige Menü «Lichtwege zum Polarstern» als Vergleich. Ideen aus dem Grilling: die
  sechs Punkte jedes Lichtwegs werden die Sterne des Wagens; ein grosser Wagen hinter dem Polarstern zeigt den Grad,
  auf dem der Fokus liegt; jede Karte eines Grads trägt einen kleinen Wagen.
- **Übersicht:** 3 Varianten, etwa jede Welt mit ihrem Stern im Kopf, hell, sobald sie geschafft ist.
- **Leiste unter dem Untertitel:** 3 Varianten: die heutige (Dorf und sechs Welten mit Linien), ein kleiner Wagen,
  dessen Sterne die Welten sind, und eine Mischform.
- Je Variante umschaltbar: Stand (nicht begonnen, in der Wüste, geschafft), Format (Desktop, Handy hoch, Handy quer)
  und der Moment, in dem ein Stern neu aufleuchtet.
- Vorher eine kurze Recherche nach Vorbildern (Sternkarten, Fortschrittsanzeigen mit Sternbildern in Spielen), damit
  die Varianten wirklich verschieden sind.
- Der Katalog berührt `index.html` nicht. Eingebaut wird erst, was der Nutzer gewählt hat.

## Sprungbrett zur Abnahme (vorübergehend)

- Mit `?szenen` erscheint in einer Ecke ein Knopf «Szenen»; er öffnet eine Liste: Prolog, Einstieg ins Dorf, Einstieg
  in den Bergwald, Ende jeder Welt mit Erwachen und Reise (Bergwald → Meer, Meer → Wüste, Wüste → Vulkan, Vulkan →
  Planeten, Planeten → Sterne), Finale, Epilog. Bedienbar mit Maus, Finger und Tastatur.
- Jeder Sprung setzt den Wagen auf den Stand, den der Durchgang an dieser Stelle hätte (vor dem Vulkan zum Beispiel
  drei Sterne wach), und spielt die Szene von ihrem natürlichen Anfang. Danach geht es normal weiter; das folgende
  Level ist spielbar, der Wagen am Himmel zu sehen, das Sprungbrett bleibt erreichbar.
- Nichts wird gespeichert: Solange `?szenen` gilt, schreibt das Spiel weder Stand noch Bestwerte; nach dem Neuladen
  ohne Parameter ist alles wie vorher.
- Eine vorübergehende Ausnahme von ADR 0005 (kein Weg, ein Level zu überspringen): Es lebt nur auf dem Branch und
  wird im letzten Ticket vor dem Merge nach main ganz ausgebaut, samt allfälliger Parameter zum Abstimmen von Grösse
  und Helligkeit.

## User Stories

1. Als Spieler möchte ich schon im Prolog verstehen, dass Noas Licht nicht direkt zum Polarstern kommt, weil die
   Sterne des Wagens schlafen, damit ich weiss, wozu ich durch die Welten reise.
2. Als Spieler möchte ich im Prolog den Polarstern hell und den Wagen nur als blasse Punkte sehen, damit ich das Ziel
   und die schlafenden Sterne unterscheiden kann.
3. Als Spieler möchte ich, dass sich die Form des Wagens im Prolog einmal kurz andeutet, wenn der Text von ihm
   spricht, damit ich die Form später am Himmel wiedererkenne.
4. Als Spieler möchte ich im Prolog lesen, dass jeder Stern über einen Ort der Welt wacht, damit ich die Welten als
   Stationen auf dem Weg zum Polarstern verstehe.
5. Als Spieler möchte ich im Prolog weiter lesen, dass das Licht von Spiegel zu Spiegel weitergegeben wird, damit ich
   den Bezug zum Spiel behalte.
6. Als Spieler möchte ich beim Üben im Dorf denselben Wagen am Himmel sehen wie im Prolog, damit ich merke, dass es
   derselbe Ort und derselbe Himmel ist.
7. Als Spieler möchte ich beim Einstieg in den Bergwald sehen, wie das Licht am schlafenden ersten Stern vorbeizieht,
   damit ich weiss, welcher Stern hier geweckt werden soll.
8. Als Spieler möchte ich lesen, dass über den Wipfeln der erste Stern schläft, damit Bild und Text zusammenpassen.
9. Als Spieler möchte ich, dass am Ende einer Welt die Strahlen zum Stern dieser Welt aufsteigen, damit ich sehe, was
   meine gelösten Level bewirkt haben.
10. Als Spieler möchte ich, dass der Stern hörbar und sichtbar erwacht, damit sich das Ende einer Welt wie ein Erfolg
    anfühlt.
11. Als Spieler möchte ich, dass sich der neue Stern mit dem vorigen verbindet, damit ich den Wagen Stück für Stück
    wachsen sehe.
12. Als Spieler möchte ich, dass sich nach dem Vulkan die Schale des Wagens schliesst, damit ich einen Zwischenschritt
    erkenne, bevor es die Deichsel hinaufgeht.
13. Als Spieler möchte ich sehen, wie das Licht vom geweckten Stern zum nächsten schlafenden fliegt, damit ich weiss,
    welcher Stern als Nächstes dran ist.
14. Als Spieler möchte ich, dass der Wagen beim Wechsel der Welt am Himmel stehen bleibt, damit ich ihn als das
    erkenne, was alle Welten verbindet.
15. Als Spieler möchte ich auch am Taghimmel von Meer und Wüste die geweckten Sterne sehen, damit der Fortschritt
    nicht verschwindet, nur weil es Tag ist.
16. Als Spieler möchte ich am Taghimmel keine blassen Punkte sehen, die dort nicht hingehören, damit Meer und Wüste
    wie Tag aussehen.
17. Als Spieler möchte ich während des Spiels den Wagen am Himmel finden können, ohne dass er sich in den Vordergrund
    drängt, damit er mich beim Lösen nicht ablenkt.
18. Als Spieler möchte ich, dass die Ankunftstexte erzählen, welcher Stern eben erwacht ist und wohin er weist, damit
    die Reise einen Sinn hat.
19. Als Spieler möchte ich, dass die Reisen nicht spürbar länger werden, damit mich das Warten zwischen den Welten
    nicht ermüdet (sie lassen sich nicht überspringen).
20. Als Spieler möchte ich, dass nach Neuladen, Fortsetzen oder einem Wechsel über das Menü der Wagen so viele wache
    Sterne zeigt, wie ich geweckt habe, damit mein Fortschritt verlässlich ist.
21. Als Spieler möchte ich beim Wiederholen einer früheren Welt den Wagen im Stand meines Durchgangs sehen, damit das
    Wiederholen nichts zurücksetzt.
22. Als Spieler möchte ich, dass jeder Grad seinen eigenen Wagen hat, damit ein neuer Grad wieder bei schlafenden
    Sternen beginnt.
23. Als Spieler möchte ich, dass «Von vorn» die Sterne dieses Grads wieder schlafen lässt, damit der neue Durchgang
    von vorn erzählt.
24. Als Spieler möchte ich im Finale den letzten Stern erwachen und das Licht durch den ganzen Wagen laufen sehen,
    damit sich der lange Weg am Schluss zusammenfügt.
25. Als Spieler möchte ich im Finale die sechs Töne noch einmal der Reihe nach hören und den Polarstern den Schluss
    setzen, damit das Finale wie ein Abschluss klingt.
26. Als Spieler möchte ich, dass der Polarstern erst antwortet, nachdem das Licht über die Deichsel bei ihm angekommen
    ist, damit die Antwort verdient wirkt.
27. Als Spieler möchte ich, dass der leuchtende Wagen aus dem Finale ohne Sprung in den Himmel über dem Dorf
    übergeht, damit ich Noa unter demselben Himmel wiederfinde.
28. Als Spieler möchte ich im Epilog alle sieben Sterne hell sehen, damit ich weiss, dass keiner mehr schläft.
29. Als Spieler möchte ich im Epilog lesen, dass über dem Dorf sieben Sterne leuchten, damit der Text das Bild
    bestätigt.
30. Als Spieler möchte ich nach dem letzten Level der Sterne «Der Wagen ist wach» lesen, damit die Meldung zur
    Geschichte passt.
31. Als Spieler auf dem Handy (hoch und quer) möchte ich den ganzen Wagen im Bild sehen, wo er wichtig ist (Prolog,
    Finale, Epilog), damit mir auf dem kleinen Bildschirm nichts fehlt.
32. Als Spieler auf einem schwächeren Handy möchte ich, dass Reisen, Finale und Bühne so flüssig bleiben wie heute,
    damit der Wagen das Erlebnis nicht stört.
33. Als Spieler möchte ich im Menü sehen, wie weit der Wagen in jedem Grad erwacht ist, damit ich meinen Stand am
    Bild erkenne (Gestalt nach dem Katalog).
34. Als Spieler möchte ich in der Übersicht sehen, welche Welt welchen Stern geweckt hat, damit Level und Sterne
    zusammengehören (Gestalt nach dem Katalog).
35. Als Spieler möchte ich, dass die Leiste unter dem Untertitel denselben Weg zeigt wie der Wagen am Himmel, damit
    beides dieselbe Sprache spricht (Gestalt nach dem Katalog).
36. Als Spieler möchte ich, dass das Ladezeichen bleibt, wie es ist, damit Warten und Fortschritt nicht verwechselt
    werden.
37. Als Spieler möchte ich, dass der Wagen überall dieselbe Form hat (Ladezeichen, Bühne, Himmel, Menü), damit ich
    ihn überall wiedererkenne.
38. Als Nutzer möchte ich die Varianten für Menü, Übersicht und Leiste nebeneinander und in jedem Stand und Format
    sehen, damit ich wählen kann, ohne dass schon etwas eingebaut ist.
39. Als Nutzer möchte ich den Katalog auch auf dem Handy öffnen, damit ich die Varianten im echten Format beurteile.
40. Als Nutzer möchte ich mit `?szenen` direkt zu jeder Szene springen, damit ich jede ohne 60 Level abnehmen kann.
41. Als Nutzer möchte ich, dass jeder Sprung den Wagen im passenden Stand zeigt, damit ich jede Szene so sehe, wie
    ein Spieler sie erlebt.
42. Als Nutzer möchte ich, dass das Sprungbrett meinen Stand und meine Bestwerte nicht anrührt, damit ich danach
    normal weiterspielen kann.
43. Als Nutzer möchte ich das Sprungbrett auch auf dem Poco bedienen, über ein Deploy des Feature-Branchs, damit ich
    das Ergebnis auf meinem Handy abnehme.
44. Als Nutzer möchte ich, dass das Sprungbrett nach meiner Abnahme ganz verschwindet, bevor nach main gemergt wird,
    damit ADR 0005 im Spiel weiter gilt.
45. Als Nutzer möchte ich Grösse und Helligkeit des Wagens bei der Abnahme abstimmen können, damit er weder untergeht
    noch aufdringlich wirkt.
46. Als Nutzer möchte ich, dass die neuen Begriffe im Glossar stehen und die KI-Tester danach noch dasselbe urteilen,
    damit Doku und Werkzeuge zusammenpassen.
47. Als Nutzer möchte ich, dass nach jedem Ticket ein unabhängiger Reviewer prüft, damit Fehler nicht ins nächste
    Ticket wandern.
48. Als Entwickler möchte ich Form, Reihenfolge und Linien des Wagens an einer einzigen Stelle finden, damit eine
    Änderung überall gilt.

## Entscheide zur Umsetzung

- **Ein Modul für den Wagen:** Form (aus dem Ladezeichen übernommen), Reihenfolge des Erwachens, Linien samt
  Schliessen der Schale und die Ableitung des Stands aus dem Durchgang (welche Sterne wach, welche Linien gezogen,
  welcher Stern der nächste) stehen an einer Stelle. Ladezeichen, Himmel, Bühne, Finale, Menü, Übersicht und Leiste
  nehmen die Form von dort. Das Ladezeichen ändert dabei weder Aussehen noch Ablauf.
- **Kein neuer Speicherstand:** Der Stand des Wagens folgt aus dem Stand des Durchgangs (gelöste Level je Welt,
  geschafft); es kommen keine Felder dazu, und «Von vorn» braucht nichts Zusätzliches.
- **Name im Code:** `wagen`. Der bestehende Parameter `?wagen=<faktor>` des Ladezeichens bleibt und darf nicht mit
  neuen Namen verwechselt werden.
- **Wagen am Himmel:** ein eigenes, leichtes Objekt am Himmel mit fester Richtung in der Welt, unabhängig von der
  Skybox; es blendet beim Wechsel der Welt nicht mit. Seine Helligkeit je Zustand folgt der Tabelle unter «Der
  Wagen»; Tag oder Nacht leitet es aus dem Himmel ab (keine Hintergrundsterne = Tag) und gleitet beim Überblenden
  mit. Es zeichnet nur wenig (sieben Sterne, höchstens sieben Linien) und kostet auf dem Poco keine messbare Bildzeit.
- **Aufstieg:** Der Lichtpunkt, zu dem die Strahlen steigen, steht am Ort des Sterns der Welt; die Kamera schaut
  dorthin statt in eine feste Höhe geradeaus. Die feste Stelle des Wagens ist so gewählt, dass jeder Stern beim
  Aufstieg gut im Bild liegt, der des Vulkans über der Kraterwand, und dass im Finale der ganze Wagen ins Bild passt.
- **Reise:** Der Flug ersetzt den heutigen seitlichen Bogen durch einen Weg vom geweckten Stern am nächsten vorbei
  und hinab aufs neue Feld. Laden der neuen Welt, Schweben während des Ladens, Überblenden und Landung bleiben wie
  heute geregelt (die Reise wartet höchstens 8 s auf den Himmel, grosse Texturen erst nach der Landung).
- **Einstieg in eine Welt:** derselbe Weg am Stern der Welt vorbei; überspringbar wie heute, das Licht landet dann
  ohne Schnitt.
- **Finale:** Aufstieg zum sechsten Stern, Puls durch den Wagen mit den Tönen, Sprung zum Polarstern, dann der
  bestehende Ablauf der Antwort. Im Bild steht der Wagen am Ende so, wie die Bühne ihn zeigt (Polarstern oben links,
  Schale unten rechts), damit die Überblendung Wagen in Wagen ohne Sprung gelingt; die heutige Ausrichtung Stern in
  Stern (die Bühne weiss, wo ihr Polarstern im Bild steht) wird dazu auf den ganzen Wagen erweitert.
- **Bühne von Prolog und Epilog:** Der Wagen wird Teil des Himmels der Bühne, um ihren Polarstern, in derselben
  Form. Die Andeutung der Linien in Prolog 4 und das Nachglimmen im Epilog folgen den Regeln der Bühne (ADR 0007:
  gezeichnet so selten wie möglich, Kleines als eigene Animation, während einer Fahrt keine Änderung am Bild von
  aussen). Im Hochformat darf die Kamera von Prolog 4 leicht verschoben werden, damit der Wagen ins Bild passt. Prolog
  und Epilog bleiben gleich lang.
- **Ton:** ein leiser Glockenton je Stern, im Hall wie die übrigen Töne, Stern 1 der tiefste, steigend bis Stern 6;
  der Polarstern setzt im Finale einen Schlusston. Ohne neue Klangdateien.
- **Texte:** genau die Tabelle unter «Texte»; die Untertitel der Reisen ersetzen die heutigen ganz.
- **Menü, Übersicht, Leiste:** erst nach der Wahl des Nutzers aus dem Katalog. Braucht die gewählte Variante je Grad
  die Zahl der wachen Sterne, bekommt die Schnittstelle des Menüs dieses Feld aus dem Wagen-Modul; das Menü bleibt
  ohne Abhängigkeit vom übrigen Spiel.
- **Sprungbrett:** ein eigener, abgegrenzter Teil, der nur mit `?szenen` lebt, das Speichern von Stand und Bestwerten
  abschaltet und sich mit einem Schnitt wieder entfernen lässt. Parameter zum Abstimmen von Grösse und Helligkeit
  während der Abnahme gehören dazu und gehen mit ihm.
- **Doku:** `CONTEXT.md` bekommt «Kleiner Wagen» (das Sternbild; _Vermeiden_: Sternzeichen, Planeten), «Stern einer
  Welt» und «Erwachen»; die Einträge Reise, Einstieg in eine Welt, Träger und Prolog-nahe Stellen werden angepasst.
  PLAN 0.4 wird abgehakt, die Farben-Ebene bleibt dort als offene Idee.

## Entscheide zum Testen

- **Gute Tests** prüfen, was ein Spieler sieht und erlebt (Stand des Wagens, Texte der Untertitel, Ablauf, Dauer,
  Bildzeiten), nicht, wie es gebaut ist. Sie spielen wie ein Spieler über das Menü und lösen über die bestehende
  Testschnittstelle Drehung für Drehung; kein Test überspringt ein Level oder benutzt das Sprungbrett.
- **Teststelle 1, die Browser-Probe der Geschichte** (Headless-Chrome mit Grafikkarte, Desktop, Handy hoch und quer,
  Pixeldichte des Poco), erweitert um einen Ablauf für den Wagen. Sie liest den Wagen über das Objekt der Geschichte,
  das die Testschnittstelle schon zeigt (keine neue Schnittstelle), und prüft:
  - nach jeder Welt die richtigen Sterne wach und die richtigen Linien gezogen, mit der Schale nach dem Vulkan;
  - nach Neuladen mitten in einer Welt, beim Fortsetzen und nach einem Wechsel über das Menü derselbe Stand;
  - beim Wiederholen einer früheren Welt kein Erwachen und der Stand des Durchgangs;
  - je Grad ein eigener Stand; nach «Von vorn» alle Sterne schlafend, die Bestwerte unberührt;
  - ein geschaffter Grad mit ganzem Wagen;
  - die Texte der Untertitel von Prolog, Einstiegen, Reisen, Finale und Epilog sowie «Der Wagen ist wach»;
  - die Dauer jeder Reise höchstens etwa 1 s und die des Finales etwa 4 s über der heutigen, gemessen gegen einen
    Vorher-Lauf auf dem Stand vor dem ersten Ticket;
  - Bildzeiten der Zwischenszenen wie heute (Lücken über 100 ms sind Fehler), keine Meldungen in der Konsole;
  - Bilder der wichtigen Momente für den Reviewer (Aufstieg, Erwachen, Vorbeiflug, Puls, Wagen in Wagen).
  Vorbild: die bestehenden Abläufe der Probe für den ganzen Durchgang, das Dorf und die Übersicht.
- **Teststelle 2, die Messung der Bühne** (Prolog und Epilog): Bildzeiten wie heute, Bilder an jedem Ruhepunkt in
  Desktop, Handy hoch und quer und auf dem kleinen Handy, darin der Wagen im Bild, in Prolog 4 die Andeutung, im
  Epilog die sieben Sterne. Vorbild: die bestehende Messung aus Ticket 04 der Leistung.
- **Sprungbrett:** keine bleibenden Tests. Der Reviewer benutzt es für Bildzeiten einzelner Szenen. Beim Ausbau prüft
  das Ticket, dass nichts davon übrig ist (kein Knopf, kein Parameter, kein Abschalten des Speicherns).
- **Doku-Ticket:** nach der Änderung an `CONTEXT.md` der Test der KI-Tester (ihr Fingerabdruck hängt an der Doku).
- Die übrigen Testreihen (Logik, Levelliste, Geschichte, Vorrat) bleiben grün; an den Leveln ändert sich nichts.

## Nicht Teil dieser Spec

- Die Farben-Ebene (jede Welt gibt dem Licht ihre Farbe, das Finale als Mischziel), auch nicht als farbige Sterne.
- Der neue Startbildschirm «Sternbild über Noas Dorf» (PLAN 1.3).
- Änderungen am Ladezeichen.
- Änderungen an Leveln, an ihrer Wahl oder ihren Titeln.
- Zwischenszenen innerhalb einer Welt; Überspringen von Reisen oder Finale.
- Ein Erwachen beim Wiederholen.
- Die Würfel-Level.

## Weitere Hinweise

**Tickets** (in `issues/`; alles in `index.html` nacheinander, nie zwei Agenten zugleich darin):

1. Gestalt und Stand des Wagens an einer Stelle, dazu das Sprungbrett; Vorher-Lauf der Probe als Massstab für die
   Dauern.
2. Skizzenkatalog für Menü, Übersicht und Leiste: **parallel von Anfang an**, nur im Ordner dieser Spec, nie
   `index.html`.
3. Texte.
4. Wagen am Himmel der Welten und des Dorfs (feste Stelle, Tag und Nacht, Stand).
5. Erwachen beim Aufstieg, Flug am nächsten Stern vorbei, Einstiege, Töne.
6. Finale mit Puls durch den Wagen.
7. Bühne von Prolog und Epilog, Überblendung Wagen in Wagen (braucht Finale und Bühne, darum hier).
8. Einbau der gewählten Varianten aus dem Katalog (wartet auf die Wahl des Nutzers in Ticket 2).
9. Doku (`CONTEXT.md`, PLAN) und Test der KI-Tester.
10. Ausbau des Sprungbretts, nach der Abnahme durch den Nutzer.

**Arbeitsweise:** Branch `feature/kleiner-wagen` von main. Nach jedem Ticket prüft ein unabhängiger Reviewer-Agent,
dann Commit auf dem Branch (ohne Hinweis auf Claude in der Nachricht), dann das nächste Ticket. Gepusht wird nur auf
Wort des Nutzers (auch für sein Deploy des Feature-Branchs); nach main gemergt erst nach seiner Abnahme und nach
Ticket 10. Kommen neue Dateien dazu, die das Spiel lädt, müssen sie in die Liste des Builds auf Render; geplant ist
keine.

**Rechnerlast:** Chrome und Node nur mit tiefer Priorität über das Werkzeug `leise` der Werkzeuge (LEISE_CPU=50), nie
zwei schwere Läufe parallel.

**Abnahme:** Der Nutzer springt mit `?szenen` zu jeder Szene, auf dem Arbeitsrechner und über ein Deploy des
Feature-Branchs auf dem Poco, und stimmt dabei Grösse und Helligkeit ab. Danach Ticket 10 und Merge auf sein Wort.
