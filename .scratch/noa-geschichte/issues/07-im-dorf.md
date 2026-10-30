# 07: Kapitel «Im Dorf»

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Das Tutorial als Kapitel der Geschichte (Entscheid 3, 10, 18): Nach dem Prolog fragt ein Untertitel
«Möchtest du zuerst mit Noa im Dorf üben?» mit «Üben» und «Gleich los». «Üben» spielt die 9 Tutorial-Level im Dorf,
danach bringen die Glühwürmchen das Licht in den Bergwald wie heute.

- [ ] Angebot nach dem Prolog, beim ersten Durchgang je Grad; ohne Vorgabe, der Spieler wählt.
- [ ] «Im Dorf»: die 9 Tutorial-Level mit ihren Hinweisen und Namen, Hintergrund vorerst die Milchstrasse (eine
      eigene Skybox macht der Nutzer später; der Hintergrund ist an einer Stelle austauschbar); Kopfzeile etwa
      «Im Dorf – Erstes Licht» und «Übung 1 / 9».
- [ ] «Überspringen» während des ganzen Kapitels; danach weiter zum Einstieg in den Bergwald.
- [ ] Einstiege in die Welten überspringbar (Entscheid 10, im Review von Ticket 04 als offen gefunden): heute lassen
      sie sich nur durch Tippen beschleunigen; ein «Überspringen» wie beim Prolog, das ohne Ruckeln ins Level führt.
- [ ] Ein kurzer Text der Geschichte zum Kapitel (Noa übt mit der Taschenlampe), im Stil der übrigen Untertitel.
- [ ] Die Übersicht (Ticket 06) zeigt «Im Dorf», wenn es gespielt wurde; das Kapitel zählt nicht zu den 60 Leveln.
- [ ] Probe im Browser: Üben, Gleich los, Überspringen mitten im Kapitel; Desktop und Handy.
- [ ] Alle Tests grün; Review nach dem Ticket.

## Comments

**Entwurf der Texte (Koordinator, 30.10.2026)** – im Ton von Prolog und Reise-Untertiteln, Noa ohne Pronomen:

- **Angebot nach dem Prolog** (Untertitel mit zwei Knöpfen): Kicker «Im Dorf», Text «Bevor die Glühwürmchen das
  Licht in den Wald tragen: Möchtest du zuerst mit Noa im Dorf üben?» – Knöpfe «Üben» und «Gleich los».
- **Einstieg ins Kapitel** (Kicker «Im Dorf · Erstes Licht»): «Hinter dem Haus übt Noa mit der Taschenlampe. Ein
  alter Spiegel, ein Stück buntes Glas – und das Licht geht genau dorthin, wo Noa es haben will.»
- **Ende des Kapitels**, auch nach «Überspringen», danach der Glühwürmchen-Flug in den Bergwald wie heute: «Jetzt
  weiss Noa, wie man Licht weitergibt. Am Waldrand blinken schon die Glühwürmchen.»
- Kopfzeile: «Im Dorf – <Name der Übung>», darunter «●○○○ Leicht · Übung 3 / 9» (Grad wie gewählt).
