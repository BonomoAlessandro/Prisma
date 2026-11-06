# 05: Strand fertig

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Die gewählte Richtung wird für den Strand fertig gebaut, bis der Nutzer sie abnimmt. Dazu gehört der
Weg, wie zwei Bretter verschiedener Form ineinander übergehen. Diese Richtung ist das Muster für Wüste, Wald, Dorf und
Vulkan.

- [ ] **Ausarbeiten:** Die gewählte Richtung wird nach den Rückmeldungen des Nutzers ausgearbeitet. Mehrere Runden
      sind möglich, jede mit Bildern wie in Ticket 04.
- [ ] **Werte in die Brett-Angabe:**
      - Die Werte stehen in der Brett-Angabe des Strands (`skybox.json`, `board`).
      - Das Register wird über die Betriebsart aus Ticket 01 nachgeführt, die nur die Brett-Angabe überträgt.
      - Das Prüfwerkzeug kennt die erlaubten Werte der Art und lehnt ungültige ab. Ein Logiktest zeigt das an einem
        abgeänderten Eintrag.
- [ ] **Übergang zwischen Formen:** Festlegen und bauen, wie zwei Bretter verschiedener Form ineinander übergehen,
      zum Beispiel durch ein Auflösen oder ein Wachsen wie bei den Elementen.
      - Der Übergang dauert gleich lang wie der Himmel, und dazwischen steht kein Steinbrett.
      - Im Schnitt der Kernquader ist jedes Pixel gedeckt.
      - Geprüft wird auf der Reise vom Bergwald ans Meer und vom Meer in die Wüste, wo der Wald und die Wüste noch
        vorläufig das Steinbrett haben, und beim Wiederholen über die Weltgrenze, wo der Blick auf dem Brett bleibt.
- [ ] **Varianten entfernen:** Die nicht gewählten Varianten verschwinden aus dem Code. Der Schalter in der Adresse
      bleibt bis Ticket 10, weil die übrigen Himmel ihn noch brauchen.
- [ ] **Leistung:**
      - Die Bildzeit steigt gegenüber dem Steinbrett nicht messbar (Desktop und Handy-Ansicht).
      - Der Grafikspeicher bleibt etwa wie heute.
      - Gerechnet wird beim Laden, und beim Wechsel ruckelt nichts (Bildzeiten der Geschichte-Probe).
- [ ] **Abnahme:** Eine Vorschauseite zeigt die Bilder wie in Ticket 04, dazu die Lichtwelle und den Übergang als Bildfolge oder kurzes
      Video. Der Nutzer nimmt ab, erst dann wird committet.
- [ ] **Tests:** Logiktest für die Werte des Strands. Die Geschichte-Probe und die Offline-Probe zeigen das Brett des
      Strands am Meer.
- [ ] Alle Tests sind grün, und das Review nach dem Ticket ist gelaufen.

## Hinweise

- In der Geschichte schaut die Kamera auf Reise und Einstieg in den Himmel, wenn der Himmel wechselt. Beim Wiederholen
  über eine Weltgrenze bleibt sie auf dem Brett. Dort sieht man den Übergang voll.
