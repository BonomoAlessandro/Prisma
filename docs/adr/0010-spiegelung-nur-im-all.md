# Das Brett spiegelt nur in den Welten im All

Umgesetzt am 15.11.2026 in Ticket 04 des Vorhabens «Energie auf dem Handy» (`.scratch/energie/`), nach dem Test des
Nutzers auf dem Poco (Stand energie-3). Ergänzt ADR 0009.

## Kontext

Die planare Spiegelung des Bretts zeichnet die Szene jedes Bild ein zweites Mal in eine Textur (mit Kantenglättung und
Mipmaps). Auf dem Poco machten Spiegelung, Bloom und Pinsel zusammen etwa ein Drittel des Stroms im Level aus; auf
einer Kachel-GPU kostet jeder eigene Durchgang zusätzlich Laden und Speichern des Ziels. Ticket 03 baute dafür
Sparfassungen als Schalter (`?spar=aufloesung,spiegelklein,spiegel2,pinsel3`). Der Nutzer entschied nach dem Test:
Auf den eigenen Welten braucht es keine Spiegelung auf dem Brett, im All wirkt die kleinere (`spiegelklein`) gut. Die
geringere Auflösung (`aufloesung`) liess Kanten flackern und wird nicht übernommen; `spiegel2` und `pinsel3` bringen
mit der Ruhe-Bildrate (ADR 0009) fast nichts.

## Entscheid

- Das Brett spiegelt nur unter den Himmeln im All (Sonnensystem, Milchstrasse). Dort ist die Spiegeltextur klein und
  ohne Kantenglättung: Handy 0,25 des Bilds, Desktop 0,22, kein MSAA.
- Unter allen anderen Himmeln (Dorf, Bergwald, Meer, Wüste, Vulkan, Eishöhle) rechnet das Spiel keine Spiegeltextur
  und keine Mipmaps, und die Bretter lesen die Textur nicht. Der Beitrag der Spiegelung kam im Shader nur hinzu; ohne
  ihn sieht das Brett gleich aus wie vorher, nur ohne Spiegelbild der Elemente und Strahlen.
- Die Zuordnung steht **am Himmel** (`spiegel: true` in den Einträgen aus dem Code, `spiegelHimmel`), nicht an der
  Art des Bretts: Das Steinbrett steht auch in der Eishöhle und im Rückfall. Das Register der Skyboxen aus Blender
  bleibt unberührt.
- Beim Überblenden zwischen einer Welt mit und einer ohne Spiegelung wandert der Anteil (`boardReflection`) weich in
  der Zeit des Überblendens; hält der Himmel, hält er mit; springt der Himmel, springt er mit.
- Schalter zum Vergleichen: `?spiegel=alle`, die Spiegelung in allen Welten wie bis energie-3 (Handy 0,35 mit MSAA 2,
  Desktop 0,3 mit MSAA 4). Die Schalter `?spar=` entfallen samt Code (in git bis energie-3).

## Folgen

- GPU-Zeit je Bild im Handy-Massstab auf der eingebauten Intel-Grafik (Level 212): Meer −0,8 ms (18,7 → 17,9),
  Vulkan −0,9 ms (28,5 → 27,6), Sterne −0,15 ms im Schritt der Spiegelung (0,69 → 0,54), Bergwald unverändert (dort
  spiegelte das Moos nie). Auf der Kachel-GPU des Handys fällt mit dem Durchgang mehr weg; messen lässt sich das nur
  am Akku.
- Basalt im Vulkan, Gezeitenbecken am Meer und Steinbrett in der Eishöhle zeigen kein Spiegelbild mehr. Die Fläche
  des Bretts wird dabei weder heller noch dunkler; es fehlen nur die Spiegelbilder unter Elementen und Strahlen.
- Proben und Messung: `tests/spiegel-probe.mjs` (`pruefe`, `messen`, `bilder`).
