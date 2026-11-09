# 03: Die neun Übungen

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** ready-for-agent

**What to build:** Alle 9 Übungen bekommen ihre Schritte nach der Tabelle in der Spec, auf dem Gerüst aus Ticket 02.

- [x] **Schritte** für jede Übung nach «Inhalte je Übung», höchstens drei, je ein Satz von etwa zwölf Wörtern, neutral
      im Du.
- [x] **Erstes Licht:** Das Ziel wird vor dem ersten Tippen erklärt, denn ein Tippen löst die Übung schon.
- [x] **Umweg:** drei Schritte: festen Spiegel antippen (Wackeln), Satz «Rund lässt sich drehen, eckig nicht», zurückdrehen.
- [x] **Schatten:** Spiegel längs zum Strahl und Prisma von der falschen Seite als zwei getrennte Schritte.
- [x] **Hinweise nebenbei:** Kamera (drehen und zoomen) in «Sperre», Neustart in «Brechung».
- [x] **Nicht zu früh lösbar:** Für jede Übung prüfen, ob die Lösung vor dem letzten Lernschritt möglich ist. «Umweg» lässt
      sich zum Beispiel ohne Zurückdrehen lösen. Wo nötig, die Schritte umordnen oder das Brett ändern.
- [x] **Geänderte Bretter:** Lösung bleibt eindeutig (Löser), `tests/golden.json` für genau diese Übungen neu, in der
      Spec vermerken, warum.
- [x] **Texte auf dem Handy:** alle Schritte im Hoch- und Querformat bei 360 px sichtbar und ohne Abschneiden.
- [x] Die alten Hinweissätze sind entfernt; `TUTORIAL_COUNT` bleibt 9. Die Tests und der Aufbau der Kopfzeile verlangen
      jetzt Schritte, `hint` gibt es für die Übungen nicht mehr.
- [x] **Dorf-Probe auf alle Schritte erweitern** (`tests/geschichte-probe.mjs`, `uebung()`): Sie löst heute per `loese()` an
      den Schritten vorbei und erwartet `#hud-sub .hinweis`. Sie spielt jeden Schritt jeder Übung, am Desktop und mit
      `--handy`, und folgt dem Textort aus dem Katalog.

## Hinweise

- Die Übungen stehen am Anfang von `LEVELS` in `index.html`.
- Ein geändertes Brett braucht einen Grund aus der Führung, Änderungen auf Vorrat gibt es nicht.

## Comments

- 09.11.2026, **fertig** (`feature/tutorial-03-uebungen`, auf dem Gerüst `d6fe027`, dazu `feature/tutorial-fuehrung`
  c275be6 mit den Korrekturen aus dem Review des Gerüsts hereingeholt). Schritte je Übung (Text mit Platzhalter;
  E = Erklärung mit «Weiter», A = antippen, D = drehen, S = Strahl):

  | # | Übung | Schritte | nebenbei |
  |---|---|---|---|
  | 1 | Erstes Licht | E Kristall «Bring das Licht zum Kristall, dann leuchtet er.» · D Spiegel «{Tippe} den Spiegel an, so dreht er sich.» | – |
  | 2 | Umweg | A fester Spiegel «{Tippe} den Spiegel auf dem eckigen Sockel an.» · E alle drei Spiegel «Rund lässt sich drehen, eckig nicht.» · D zurück (3,5) «{Drücke lang} auf den markierten Spiegel, so dreht er zurück.» | – |
  | 3 | Sperre | E Block «Der Block schluckt das Licht, hier kommt es nicht weiter.» · S an (3,2), trifft (3,0) «{Tippe} den Spiegel, bis das Licht den nächsten Spiegel trifft.» · D (3,0)/(5,0) «{Tippe} die übrigen Spiegel, bis das Licht den Kristall erreicht.» | Kamera |
  | 4 | Brechung | E Prisma «Das Prisma fächert weisses Licht in Rot, Grün und Blau auf.» · D Prisma «{Tippe} das Prisma, bis jede Farbe ihren Kristall trifft.» | Neustart |
  | 5 | Schatten | S an Spiegel (3,5), trifft Prisma, Geste zurück «Längs zum Strahl lässt ein Spiegel das Licht verschwinden: {Drücke lang} auf ihn.» · E Prisma «Trifft Licht das Prisma auf der Seite seiner Farbpfeile, verschwindet es auch.» · D Prisma «{Tippe} das Prisma, bis seine Farbpfeile zu den Kristallen zeigen.» | – |
  | 6 | Farbenlehre | E Filter «Der Filter lässt nur seine Farbe durch: Gelb heisst Rot und Grün.» · D Prisma «{Tippe} das Prisma: Es fächert nur die Farben auf, die ankommen.» | – |
  | 7 | Farbiges Licht | E Quellen «Farbige Quellen senden nur ihre Farbe, hier Rot und Blau.» · E Ziele «Der Ring am Kristall zeigt seine Grundfarben, falsche flackern darin.» · D Spiegel «{Tippe} die Spiegel, bis jede Farbe ihren Kristall trifft.» | – |
  | 8 | Treffpunkt | E Ziel «Treffen Rot und Blau denselben Kristall, mischen sie sich zu Magenta.» · D Spiegel «{Tippe} beide Spiegel, bis Rot und Blau den Kristall treffen.» | – |
  | 9 | Mischung | D Prisma «{Tippe} das Prisma, bis Rot und Blau den Kombinator treffen.» · E Kombinator «Der Kombinator mischt alle Strahlen, die ihn treffen, und sendet sie weiter.» · D Kombinator «{Tippe} den Kombinator, bis sein Magenta den Kristall trifft.» | – |

  Neu im Gerüst: `trifft` an einem Strahl-Schritt (Umriss und Hand am Element `bei`, das zu drehen ist, weiter erst,
  wenn der Strahl `trifft` erreicht; `richtung` gibt dort nur die Geste). Sonst hätte in «Schatten» der Umriss am
  Prisma gelegen, während der Satz den Spiegel meint, oder eine Drehung in die falsche Stellung hätte weitergeschaltet.
  `hint` und `HINWEIS_PLATZHALTER` sind weg; ausserhalb der Führung zeigt eine Übung ihren ersten Schritt.
  Neustart-Text nebenbei: «Der Kreispfeil am Rand rechts …» statt «unten rechts» (auf dem Handy quer stehen die Knöpfe
  rechts in der Mitte). Der Satz zu «Farbenlehre» trägt den Rest des alten Brechung-Hinweises (das Prisma fächert nur
  auf, was ankommt), «Weiss + Rot bleibt Weiss» und die Tabelle der Mischfarben fallen weg.

  Bretter (Grund in der Spec, «Bretter und Anzahl»): **Umweg** vorderer Spiegel rot 1 → 4 (eine Stufe zu weit, Wahl des
  Nutzers), **Mischung** Prisma rot 6 → 7 (ein Tippen schickt Rot und Blau in den Kombinator, bevor er erklärt wird).
  Lösungen unverändert und eindeutig; `tests/golden.json` nur für diese zwei neu, ihr Abdruck in
  `UEBUNGEN_OHNE_TEXT` (`tests/vorrat.test.mjs`) ebenso. **Anzahl bleibt 9** (Spec).

  Zu früh lösbar (Breitensuche über Stellungen und Stand der Führung): wer folgt, löst keine Übung vor ihrem letzten
  Lernschritt (Logiktest). An den Schritten vorbei geht es in «Umweg» ohne den festen Spiegel (zurück, dann (5,1)),
  in «Schatten» (vier Drehungen am Prisma ohne Licht), in «Mischung» (Kombinator vor dem Prisma) und überall, wo
  «Weiter» nie getippt wird; das gilt sofort, wie die Spec es will.

  Tests: `logic.test.mjs` 2064 ok (neu: alle Übungen geführt, Inhalte je Übung, festes Element zum Antippen ohne
  drehbares Nachbarfeld, folgsam nicht zu früh gelöst, Strahl mit trifft), `golden.mjs` ok, `vorrat.test.mjs` 18 ok.
  Dorf-Probe (`schritteSpielen`: jeder Schritt jeder Übung mit Satz, «Weiter», Umrissen, Hand, Text ganz im Bild und
  frei von Knöpfen) Desktop, `--handy`, `--handy --groesse 360x640` und `--quer`: alle Schritte ok, rot nur die
  bekannte Lücke bei «Sehr schwer: Übersicht → Übung 8 wiederholen» (124–406 ms). Bei 360 × 640 höchstens zwei
  Zeilen je Satz. `--handy --groesse 640x360`: die Schritte ok, dazu rot, nicht von den Schritten (der Titel und die
  Bühne hängen nicht an ihnen, auf dem alten Stand nicht nachgemessen): «Überspringen» überdeckt den Titel langer
  Übungsnamen, die Leiste im Einstieg ins Dorf liegt nicht frei unter dem Text, eine
  Lücke von 392 ms beim Satz zum Ende → Bergwald.
