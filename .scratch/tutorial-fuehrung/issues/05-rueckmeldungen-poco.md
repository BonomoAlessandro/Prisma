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

- [x] **Umriss räumlich:** Der gestrichelte Umriss liegt als Teil der Szene auf dem Brett. Wo er hinter einem Element
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

- 10.11., Teil «Umriss räumlich» (`feature/tutorial-05-umriss`), fertig: Der Umriss ist ein Ring in der Szene statt
  des SVG-Rings über dem Bild. `fuehrung.ringe` (je Element ein Mesh am Modell, `zeigeRinge`), `ringTeile`
  (`RingGeometry` als flaches Band, `ShaderMaterial` mit `UMRISS_VERTEX`/`UMRISS_FRAGMENT`), `ringeVorwaermen`,
  `ringeAb`/`ringeFrei`; Masse in `FUEHRUNG.ring`. Der Shader zeichnet nur den Strich in der Mitte des Bands und rechnet
  Breite, runde Strichenden und den dunklen Schatten über `dFdx`/`dFdy` in Pixel der Oberfläche um: 2 px, Striche 5:3,
  Schatten wie `drop-shadow` 3 px, Deckung 0,85, beim späten Fingerzeig 2,6 px, voll, schneller (0,55 statt 1,4 s je
  Strich). Tiefentest ohne Tiefe zu schreiben, 0,02 über dem Brett mit `polygonOffset`: Element und Nachbarn
  verdecken ihn, er versinkt nicht im Brett. Ohne Nebel, nicht in der Spiegelung (`LAYER_NO_REFLECT`), Farbe #ffd98a
  als Szenenwert vor ACES mit Helligkeit 0,8 (zeigt sich als rund #f4cf8a), unter der Bloom-Schwelle: kein Leuchten.
  Leistung: ausserhalb der Führung kein Objekt und keine Arbeit je Bild; in ihr je Bild nur `uPhase` (mit
  `prefers-reduced-motion` steht sie). Das Programm wird in `fuehrung.neu` übersetzt, während das Brett herauswächst
  (`compileParallel` mit einem unsichtbaren Ring kurz in der Szene); beim ersten Bild mit Umriss kein neues Programm
  (geprüft: das Material hat sein Programm schon in `flow` «in»). Geometrie und Material frei beim Lösen (`beenden`)
  und beim nächsten Brett (`neu`, dort erst nach dem Vorwärmen der neuen, so bleibt das Programm bei Neustart und
  Wechsel ohne Lösen). Die Hand bleibt SVG (`platziere`). Die Führung gibt es nur im Dorf (Himmel village, Hochbeet).
  Dorf-Probe: Umrisse über `__prismaDebug.fuehrung` (`UMRISSE`: gezeigte Ringe, die an ihrem Modell in der Szene
  hängen, Mitte im Bild, Zelle des Elements, stark; `UMRISSE_FREI`), je Schritt am richtigen Element, nach dem Lösen
  und im Bergwald nach «Überspringen» nichts mehr da. Tests: `logic` 2064, `geschichte` 35, `vorrat` 18 ok;
  `geschichte-probe --dorf` und `--dorf --handy` bestanden, Konsole ohne Fehler (Arbeit «Führung: Umriss» 0,9 bzw.
  0,7 ms selbst, keine Lücke über 50 ms). Bilder `umriss-*.png` in `%TEMP%\prisma-vorschau` (Erstes Licht, Umweg
  Schritt 2 mit drei Ringen aus der Ausgangsansicht, schräg, flach von hinten, stark; Desktop und 393 × 873; still).
