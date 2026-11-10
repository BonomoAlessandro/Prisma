# 05: Rückmeldungen aus dem Poco-Test

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Die drei Punkte aus dem ersten Handy-Test des Nutzers (10.11.2026) einarbeiten.

Wortlaut des Nutzers:

> Die kreise um die drehbaren elemente sind gut, aber der kreis soll hinter dem element verschwinden können. Also
> aktuell haben wir die kreismarkierung die sich um drehbare elemente dreht und es kann sein, dass der kreis hinter
> einem element durchfährt. In einem solchen fall soll es wirken als wäre es ebenfalls 3dimensional.
> Die hilfe/anweisungstexte sind nicht immer ganz so gut. Im ersten level heisst es einfach, man solle das licht zum
> kristall bringen, aber wie soll das klappe ?
> Sonst ist es eigentlich ganz gut, nur auf dem handy ist der weiter button ein wenig komisch platziet teilweise

- [ ] **Umriss räumlich:** Der gestrichelte Umriss liegt als Teil der Szene auf dem Brett. Wo er hinter einem Element
      (dem markierten selbst oder einem Nachbarn) durchläuft, ist er verdeckt, wie ein Ring um das Element herum. Er
      bleibt gut sichtbar, wo er frei liegt, und geht mit Kamera und Zoom mit. Der späte Fingerzeig (kräftiger Umriss)
      bleibt erhalten.
- [x] **Texte, die sagen, wie:** Jeder Schritt sagt nicht nur, was das Ziel ist, sondern auch, wie man dahin kommt.
      Vor allem «Erstes Licht» Schritt 1. Alle 23 Schritte aus der Sicht eines Spielers ohne Vorwissen durchgehen.
      Die Grenzen der Spec gelten weiter.
- [x] **«Weiter» auf dem Handy:** an einer ruhigen, gleichbleibenden Stelle beim Satz, in jeder Länge des Satzes, im
      Hoch- und Querformat.
- [ ] Tests und Proben nachgeführt, `APP_VERSION` neu für den nächsten Poco-Test.

## Comments

- 10.11.2026, **Texte und «Weiter»** (`feature/tutorial-05-texte`, Worktree `prisma-tutorial-05t`; der Umriss im Raum läuft
  getrennt). Alle 23 Schritte aus der Sicht eines Spielers ohne Vorwissen durchgegangen: Weiss er danach, was er tun
  soll und woran er merkt, dass es genug ist? Jeder Satz nennt jetzt Handlung und Ziel («… bis …»), Erklärungen sagen,
  wozu das Gesagte dient. Grenzen der Spec unverändert (höchstens drei Schritte, 11–14 Wörter, höchstens 84 Zeichen,
  ein Satz im Du, Platzhalter); Bretter, `weiter`, `richtung`, `trifft` und `farbe` unverändert, also auch «nicht zu
  früh» und die Abdrücke `UEBUNGEN_OHNE_TEXT`. Geändert ist `bei` an zwei Stellen.

  | # | Schritt | alt | neu |
  |---|---|---|---|
  | 1 | E | Bring das Licht zum Kristall, dann leuchtet er. | Bring das Licht zum Kristall: Es läuft geradeaus, bis ein Spiegel es umlenkt. (Umriss um Kristall **und Spiegel**) |
  | 1 | D | {Tippe} den Spiegel an, so dreht er sich. | {Tippe} den Spiegel an, so dreht er sich und lenkt das Licht zum Kristall. |
  | 2 | A | {Tippe} den Spiegel auf dem eckigen Sockel an. | {Tippe} den Spiegel auf dem eckigen Sockel an und schau, was passiert. |
  | 2 | E | Rund lässt sich drehen, eckig nicht. | unverändert (Satz des Nutzers) |
  | 2 | D | {Drücke lang} auf die runden Spiegel, so drehen sie zurück. | Die runden Spiegel sind zu weit gedreht: {Drücke lang} darauf, so drehen sie zurück. |
  | 3 | E | Der Block schluckt das Licht, hier kommt es nicht weiter. | Der Block schluckt das Licht, also braucht es einen Weg um ihn herum. |
  | 3 | S | {Tippe} den Spiegel, bis das Licht den nächsten Spiegel trifft. | {Tippe} den Spiegel, bis das Licht vom Block weg zum nächsten Spiegel läuft. |
  | 3 | D | {Tippe} die übrigen Spiegel, bis das Licht den Kristall erreicht. | {Tippe} die zwei markierten Spiegel, bis das Licht den Kristall erreicht. |
  | 4 | E | Das Prisma fächert weisses Licht in Rot, Grün und Blau auf. | unverändert |
  | 4 | D | {Tippe} das Prisma, bis jede Farbe ihren Kristall trifft. | {Tippe} das Prisma, bis jede Farbe den Kristall ihrer Farbe trifft. |
  | 5 | S | Längs zum Strahl lässt ein Spiegel das Licht verschwinden: {Drücke lang} auf ihn. | Längs zum Strahl schluckt der Spiegel das Licht: {Drücke lang}, bis es weiterläuft. |
  | 5 | E | Trifft Licht das Prisma auf der Seite seiner Farbpfeile, verschwindet es auch. | Auch das Prisma schluckt Licht, wenn es von der Seite seiner Farbpfeile kommt. |
  | 5 | D | {Tippe} das Prisma, bis seine Farbpfeile zu den Kristallen zeigen. | {Tippe} das Prisma, bis seine Farbpfeile vom Licht weg zu den Kristallen zeigen. |
  | 6 | E | Der Filter lässt nur seine Farbe durch: Gelb heisst Rot und Grün. | Der Filter lässt nur seine Farbe durch: Gelb heisst Rot und Grün, ohne Blau. |
  | 6 | D | {Tippe} Prisma und Spiegel: Das Prisma fächert nur auf, was ankommt. | {Tippe} Prisma und Spiegel, bis Rot und Grün die Kristalle ihrer Farbe treffen. |
  | 7 | E | Farbige Quellen senden nur ihre Farbe, hier Rot und Blau. | unverändert |
  | 7 | E | Der Ring am Kristall zeigt seine Grundfarben, falsche flackern darin. | Der Ring am Kristall zeigt, welche Grundfarben er braucht; falsche flackern darin. |
  | 7 | D | {Tippe} die Spiegel, bis jede Farbe ihren Kristall trifft. | {Tippe} die Spiegel, bis Rot und Blau die Kristalle ihrer Farbe treffen. |
  | 8 | E | Treffen Rot und Blau denselben Kristall, mischen sie sich zu Magenta. | Dieser Kristall braucht Magenta: Treffen ihn Rot und Blau, mischen sie sich dazu. |
  | 8 | D | {Tippe} beide Spiegel, bis Rot und Blau den Kristall treffen. | {Tippe} beide Spiegel, bis Rot und Blau zusammen den Kristall treffen. |
  | 9 | S | {Tippe} das Prisma, bis Rot und Blau den Kombinator treffen. | unverändert; Umriss jetzt an Prisma **und Kombinator** (die Hand bleibt am Prisma) |
  | 9 | E | Der Kombinator mischt alle Strahlen, die ihn treffen, und sendet sie weiter. | Der Kombinator mischt alles Licht, das ihn trifft, zu einem neuen Strahl. |
  | 9 | D | {Tippe} den Kombinator, bis sein Magenta den Kristall trifft. | unverändert |

  Gründe, kurz: «Erstes Licht» sagte nur das Ziel; jetzt Ziel und Weg (geradeaus, Spiegel lenkt um), und der Umriss
  zeigt beide Dinge, die der Satz nennt. «Umweg»: Der erste Satz gibt dem Antippen einen Zweck, der letzte sagt, warum
  zurück. «Sperre»: «nächsten Spiegel» war ohne Richtung, «übrigen» schloss den festen Spiegel ein. «Kristall ihrer
  Farbe» statt «ihren Kristall»: Woran man den richtigen erkennt (der Kristall leuchtet in seiner Farbe). «Schatten»:
  «schluckt» wie beim Block, und der erste Satz sagt, wann es genug ist. «Farbenlehre»: Der zweite Satz sagte, was das
  Prisma tut, aber nicht, wohin; «ohne Blau» im ersten trägt jetzt den Rest («fächert nur auf, was ankommt»).
  «Mischung»: Der erste Satz nennt den Kombinator, bevor er erklärt ist; der Umriss zeigt, welches Element gemeint ist.
  «sendet sie weiter» liess offen, dass ein Strahl herauskommt, den man drehen kann (dritter Schritt).
  Logiktest «Inhalte je Übung»: `bei` von «Erstes Licht» Schritt 1 ist jetzt Kristall und Spiegel; Dorf-Probe
  (`gefuehrt`) erwartet die neuen Sätze und zwei Umrisse.

  **«Weiter»:** Bilder vorher (`weiter-vorher-*`) zeigen auf dem Handy drei Lagen je nach Länge des Satzes: hinter
  einem kurzen Satz in derselben Zeile, allein in einer eigenen Zeile, wenn der Satz die Zeile füllt (Brechung,
  Poco), oder hinter dem umbrochenen zweiten Teil, oft einem einzelnen Wort («auf.», «sie weiter.»). Dazu machte der
  Knopf die Zeile, in der er stand, höher als die übrigen. Jetzt steht er nicht mehr im Fluss des Texts
  (`#hud .sub .hinweis.schritt` ein Flex-Kasten): am Desktop und quer rechts neben dem Satz, mittig zu seiner Höhe
  (am Desktop wie bisher, aber nie mehr umbrochen; quer passt jeder Satz jetzt in eine Zeile); auf dem Handy hochkant
  (bis 520 px breit, ab 700 px hoch, also Poco) in einer eigenen Zeile mittig unter dem Satz, immer an derselben
  waagrechten Stelle; auf kleinen Handys (unter 700 px hoch, 360 × 640) rechts neben einem Satzblock, der die übrige
  Breite füllt, weil eine eigene Zeile dort die Kopfzeile über den Rand des Bretts schob (Brechung: Hinweis nebenbei
  über dem Brett). Die Dorf-Probe prüft die Lage je Bildschirm (`fuehrungIn`: `lage` unter/rechts) und zählt die
  Zeilen über den Text (der Satz ist kein Inline-Kasten mehr).

  Bilder vorher und nachher je Erklärungsschritt (10 je Bildschirm: Poco 393 × 873 bei 2,75, 360 × 640, quer
  873 × 393 bei 2,75, Desktop 1440 × 900) unter `%TEMP%prisma-vorschauweiter-vorher-*` und `weiter-nachher-*`.
  Nachher: Poco «Weiter» immer bei x 157–236, eine oder zwei Zeilen darüber; 360 × 640 immer bei x 265–344, mittig
  zu zwei (einmal drei) Zeilen; quer jeder Satz einzeilig, «Weiter» auf derselben Höhe rechts daneben.

  Tests: `logic.test.mjs` 2064 ok, `vorrat.test.mjs` 18 ok, `golden.mjs` alle 847 Level ok. Dorf-Probe (je 29
  gespielte Schritte, Lage von «Weiter» geprüft): Desktop, `--handy` und `--handy --groesse 360x640` rot nur die
  bekannte Lücke «Sehr schwer: Übersicht → Übung 8 wiederholen» (404, 178, 176 ms); `--quer` bestanden. Zeilen je
  Satz: Desktop und quer alle einzeilig, Handy 7 × eine und 22 × zwei, 360 × 640 3 × eine, 25 × zwei, 1 × drei
  («Der Ring am Kristall …»). `APP_VERSION` unverändert (vierter Haken offen, kommt mit dem Umriss).
