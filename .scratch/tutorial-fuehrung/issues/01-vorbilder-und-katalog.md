# 01: Vorbilder und Katalog

**Spec:** ../spec.md

**Blocked by:** –

**Status:** done

**What to build:** Eine private Seite auf claude.ai mit drei bis vier deutlich verschiedenen Richtungen, wie die Führung
im Dorf aussehen und sich anfühlen kann. Der Nutzer wählt daraus eine, eventuell mit Änderungswünschen.

- [x] **Vorbilder:** Muster aus anderen Puzzlespielen sammeln, wie sie Bedienung und Regeln beibringen. Jedes Vorbild
      bekommt einen Link und einen Satz dazu. Übernommen werden nur Muster, kein Aussehen und keine Figuren. Ablage:
      `.scratch/tutorial-fuehrung/vorbilder/index.md`.
- [x] **Drei bis vier Richtungen**, die sich auf diesen Achsen unterscheiden:
      - wie streng geführt wird (nur das markierte Element reagiert oder alles bleibt frei),
      - wie hervorgehoben wird,
      - ob ein Finger oder eine Hand erscheint,
      - wo der Text steht.
- [x] **Jede Richtung ist klickbar** auf den Brettern von «Erstes Licht» und «Umweg», mit der echten Strahlregel und
      vereinfachter Grafik, für Handy und Desktop. Es geht um die Führung, nicht um die Grafik.
- [x] **Jede Richtung enthält** in «Umweg» die Folge aus Ticket 03: festen Spiegel antippen (Wackeln), Satz «Rund lässt
      sich drehen, eckig nicht», Zurückdrehen; dazu den späten Fingerzeig nach etwa 15 Sekunden und eine Antwort darauf,
      was einen Erklärungsschritt weiterschaltet (Spec, «Was weiterschaltet»).
- [x] **Grenzen aus der Spec:** höchstens drei Schritte je Übung, ein Satz von etwa zwölf Wörtern, neutral im Du, keine
      gesperrten Knöpfe.
- [x] **Ablage:** Quelle der Seite unter `.scratch/tutorial-fuehrung/katalog/`.
- [x] **Wahl des Nutzers** steht unter «Comments», ebenso die daraus folgenden Festlegungen für die Tickets 02 und 03.

## Hinweise

- `index.html` wird in diesem Ticket nicht geändert.
- Der Katalog darf die Strahlregel aus `index.html` übernehmen, damit die Bretter sich wie im Spiel verhalten.

## Comments

### 09.11.2026: Vorbilder und Katalog fertig

- Vorbilder: `vorbilder/index.md` (12 Spiele, 7 Leitfäden und Erfahrungen).
- Katalog: Quelle `katalog/vorlage.html`, Build `node seite.mjs` → `katalog/index.html` (Strahlregel und die Bretter
  von «Erstes Licht» und «Umweg» unverändert aus `index.html`, mit Probe der Lösungen). Vier Richtungen: A Leise
  Zeichen, B Scheinwerfer, C Vorzeigen, D Schild am Element. Empfehlung: C, Erklärung mit «Weiter» am Satz; für
  «Umweg» als Vorschlag eine Startstellung, in der Zurückdrehen der kurze Weg ist (Schalter am Brett).
- Geprüft in headless Chrome am Desktop (1280 × 900, Klick und Rechtsklick) und als Handy (390 × 844, Tippen und
  langes Drücken): in jeder Richtung die Folge von «Umweg» (fester Spiegel wackelt, Satz «Rund lässt sich drehen,
  eckig nicht», Zurückdrehen, Fingerzeig, Lösung) und «Erstes Licht» bis zur Lösung, ohne Fehler in der Konsole.
- Link: noch keiner. Die Werkzeuge für claude.ai-Seiten waren in dieser Sitzung nicht erreichbar; die Seite wird nach
  einem Neustart von Claude Code aus `katalog/index.html` veröffentlicht.
- Stand: wartet auf die Wahl des Nutzers.

### 09.11.2026: Wahl des Nutzers

**C «Vorzeigen»**, und «Umweg» startet mit dem vorderen Spiegel eine Stufe zu weit (Zurückdrehen ist der kurze Weg,
die Lösung bleibt dieselbe).

Festlegungen für die Tickets 02 und 03:
- **Strenge:** frei, alle Elemente reagieren wie immer; nichts wird gesperrt.
- **Hervorhebung:** ein gestrichelter Umriss läuft um das Element des Schritts.
- **Hand:** zeigt die Geste des Schritts einmal am Element vor (Tippen; langes Drücken mit wachsendem Ring bzw.
  Rechtsklick), danach nicht mehr. Der späte Fingerzeig nach etwa 15 s zeigt sie noch einmal.
- **Textort:** die Kopfzeile, wo heute der Hinweis steht. Zeigt sich auf dem Handy, dass der Blick dort nicht hinfindet,
  wird der Textort von D (Schild am Element) übernommen.
- **Erklärungen** schalten mit dem Knopf «Weiter» am Satz weiter, nie durch Zeit oder eine Drehung; beim späten
  Fingerzeig stupst der Knopf.
- **Umweg** (Ticket 03): Startstellung des vorderen Spiegels eine Stufe weiter, Lösung unverändert, Golden neu.
