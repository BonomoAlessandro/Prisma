# 12: Abnahme, Runde 2 (Rückmeldungen des Nutzers vom 06.11., Stand 73e476e)

**Spec:** ../spec.md

**Blocked by:** 11

**Status:** ready-for-agent

**What to build:** Zweite Runde der Rückmeldungen aus der Abnahme auf dem Poco (Zwischenstand 73e476e von Ticket 11).
Wortlaut des Nutzers jeweils in Anführung; danach, was das im Spiel heisst. Zum Prolog allgemein: «der sieht schon
besser aus»; zum Halt beim Einstieg: «das mit dem pausieren und dem weitermachen nach einem klick ist super».

- [ ] **Fall aufs Brett, Licht und Kamera im Einklang:** «Hier soll nur etwas noch verbessert werden und zwar die
      bewegung des lichts nach dem klick auf das brett. Die bewegung wirkt noch ungleichmässig, es wirkt als würde
      beschleunigt, verlangsamt und dann wieder beschleunigt. Beziehungsweise die bewegung des lichts und die
      kameraführung passen nicht schön zusammen.» Gemeint ist der Fall nach dem Tippen beim Halt (Einstieg, Dorf,
      Reise). Massgebend ist die Bewegung des Lichts **im Bild** (Bildschirm-Pixel je Bild), nicht nur entlang seines
      Wegs in der Welt: Die Kamera bewegt sich mit, darum kann ein in der Welt gleichmässiger Fall im Bild schwanken.
      Licht und Kamera so führen, dass das Licht im Bild gleichmässig fällt und die Kamera ruhig und stimmig folgt;
      messen (Geschwindigkeit im Bild über den ganzen Fall) und mit dem Stand 73e476e vergleichen.
- [ ] **Finale, Strahlen laufen aus:** «es ist gut, dass die lichtstrahlen wieder verschwinden nachdem der stern
      aktiviert wurde, aber sie sollten nicht so abrupt verschwinden, sondern auslaufen.» Die Strahlen, die den Stern
      aktivieren, weich ausblenden bzw. auslaufen lassen statt abrupt verschwinden.
- [ ] **Finale, Aufprall des Polarstern-Strahls:** «Der aufprall des lichts vom polarstern auf das brett sollte noch
      ein wenig schöner gemacht werden. Die animation sieht gut aus, aber der übergang von lichtstrahl zu brett wirkt
      noch hart.» Den Übergang vom Strahl aufs Brett weicher gestalten (z. B. Aufleuchten, Ausbreiten, Nachglühen am
      Brett), ohne die Animation selbst grundsätzlich zu ändern.
- [ ] **Epilog, letzter Text springt nicht:** «sobald der letzte text angezeigt wird "noa lacht und ..." wird er kurz
      nachdem er angezeigt wird nach oben verschoben, damit der menü button platz hat. Das ist nicht so schön. Der
      text sollte von anfang an so platziert sein, dass der menü button genügend platz hat und nichts mehr verschoben
      werden muss.»
- [ ] **Prolog, Wechsel zum letzten Text sauber:** «die texte verschwinden und werden wieder angezeigt nach jedem
      klick und das ist sehr sauber, ausser beim 2t letzten text zum letzten. Dort wirkt es kurz unschön, ich vermute,
      dass das ebenfalls mit den "üben" und "gleich los" button zusammenhängt.» Der Wechsel vom vorletzten zum
      letzten Prolog-Text soll so sauber wirken wie die übrigen (Ursache prüfen, vermutlich Platz für die Knöpfe
      «Üben» / «Gleich los»; Text von Anfang an richtig platzieren, nichts nachschieben).
- [ ] **Kapitelende, Strahlen erst nach «Weiter»** (Nachtrag 06.11.): «wenn das letzte level einer welt
      abgeschlossen wurde, sollen die lichtstrahlen etc erst kommen, wenn der benutzer auf den "weiter zur ..." Button
      geklickt hat». Nach dem letzten Level einer Welt (auch im Finale beim sechsten Stern, falls dort derselbe Ablauf)
      starten Strahlen, Aufstieg und Erwachen erst mit dem Klick auf «Weiter zur …», nicht schon beim Abschluss.
- [ ] Probe nachführen (Fall im Bild gleichmässig, Strahlen laufen aus, Text im Epilog und Prolog verschiebt sich
      nach dem Erscheinen nicht), Dauer gegen `vorher/` einordnen.
- [ ] Alle betroffenen Tests grün; Review nach dem Ticket.

## Comments
