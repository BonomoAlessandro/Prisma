# 06: Leerlauf auf 0

**Spec:** ../spec.md

**Blocked by:** 02

**Status:** ready-for-agent

**What to build:** Wenn sich im Spiel nichts sichtbar bewegt, wird nicht gezeichnet. Bewegt sich nur wenig, wird nur so
oft gezeichnet, wie die Bewegung braucht, und zwar so billig wie möglich. Optisch ändert sich nichts. Ziel ist, dass
Akku und Lüfter geschont werden.

Heute fällt `frameRate.due()` (`index.html` 19351–19405) nie unter 30 fps. Im Ruhezustand rendert die volle Pipeline
also 30-mal pro Sekunde: Szene, Spiegelung, Bloom, Final-Pass, Körnung.

Ticket 02 hat Logik und Zeichnen in `frame()` getrennt und den Mechanismus für Ruhen und Aufwecken (`wake()`) gebaut.
Dieses Ticket benutzt ihn für das sichtbare Spiel und baut keinen zweiten.

- [ ] **Bestandsaufnahme zuerst:** Was bewegt sich im Ruhezustand sichtbar, pro Skybox? Staubteilchen, Sterne,
      Funkeln, Himmel, Wasser, Körnung (`grain` im Final-Pass), Strahlen und Ziele, Partikel. Das Ergebnis mit Angabe
      «sichtbar ja/nein» kommt ins Ticket, bevor umgebaut wird.
- [ ] Bewegt sich nichts Sichtbares: 0 gezeichnete Bilder, und die Schleife ruht ganz, sofern keine Logik ansteht
      (siehe 02). Aufgeweckt wird sie über `wake()` durch Eingaben, Tweens, Kamerabewegung, Überblendungen, Ladeende
      einer Skybox, Grössenänderung, Rückkehr aus `visibilitychange` usw.
- [ ] Bewegt sich nur Ambient-Animation (z. B. Staub, Funkeln): den nötigen Takt bestimmen. Prüfen, ob dafür die ganze
      Pipeline nötig ist oder ob der unveränderte Teil zwischengespeichert werden kann, z. B. Szene ohne Staub einmal
      rendern und nur die bewegte Schicht neu. Das nur dort umsetzen, wo es messbar spart und gleich aussieht.
      Kornrauschen, das jedes Bild neu würfelt, gilt nicht als «muss weiterlaufen», wenn ein stehendes Korn nicht
      auffällt. Das mit Vergleich entscheiden und im Ticket begründen.
- [ ] Ist der Tab nicht sichtbar oder das Fenster minimiert, ruhen auch Audio-Timer (z. B. das Glitzern), soweit kein
      hörbarer Ton weiterlaufen soll. Die Bühne von Prolog und Epilog ruht nach Ticket 04 schon, wenn sie ausgeblendet
      ist. Hier nur prüfen, dass sie bei verstecktem Tab ebenfalls ruht.
- [ ] Kleine Dauerkosten pro Bild mitnehmen, wo sie ohnehin angefasst werden: neue Arrays pro Bild in `cullInstances`
      (9618), `dimmed`-Array und `Color.clone()` in `renderReflection` (19262).
- [ ] Messen: Ruhezustand im Level (ohne Eingabe) mit gezeichneten Bildern pro Sekunde und Zeichenzeit, vorher und
      nachher. Dazu ein Durchlauf mit Eingaben, damit nichts träge wirkt: Die erste Reaktion auf eine Eingabe kommt im
      nächsten Frame.
- [ ] Tests grün (Tests, die auf laufende Bilder warten, auf den neuen Takt umstellen), Review des Diffs, Commit auf
      `feature/leistung`.

## Comments
