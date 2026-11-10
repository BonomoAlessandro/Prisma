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
- [ ] **Texte, die sagen, wie:** Jeder Schritt sagt nicht nur, was das Ziel ist, sondern auch, wie man dahin kommt.
      Vor allem «Erstes Licht» Schritt 1. Alle 23 Schritte aus der Sicht eines Spielers ohne Vorwissen durchgehen.
      Die Grenzen der Spec gelten weiter.
- [ ] **«Weiter» auf dem Handy:** an einer ruhigen, gleichbleibenden Stelle beim Satz, in jeder Länge des Satzes, im
      Hoch- und Querformat.
- [ ] Tests und Proben nachgeführt, `APP_VERSION` neu für den nächsten Poco-Test.

## Comments
