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
