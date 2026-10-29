# 05: Menü mit den vier Graden

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Nach dem Startbildschirm das Menü nach Entscheid 8, 14, 19 und 25: vier Karten mit dem Stand je
Grad, «Weiter», «Von vorn», geschaffte Grade mit dem Polarstern. Dazu der Knopf «Menü» im Spiel und «Zum Menü» am Ende
des Epilogs. Die Gestalt wählt der Nutzer aus Vorschauen.

- [ ] **Haltepunkt:** zwei oder drei Varianten als Vorschau (Bilder für Desktop und Handy, hoch und quer), z. B. vier
      Karten nebeneinander, ein Stapel vor dem Nachthimmel, die Grade als Stationen auf dem Weg zum Stern. Der Nutzer
      wählt; erst dann wird gebaut.
- [ ] Karten: Grad, Stand («Wüste · 23 / 60», «noch nicht begonnen», geschafft mit dem Polarstern); begonnen →
      Fortsetzung, geschafft → Übersicht (Ticket 06; bis dahin Fortsetzung von vorn mit Rückfrage), neu → Durchgang.
- [ ] «Weiter» zum zuletzt gespielten, nicht geschafften Grad; fehlt, wenn es keinen gibt.
- [ ] «Von vorn» je begonnenem oder geschafftem Grad, mit Rückfrage; löscht nur den Stand dieses Grads.
- [ ] Knopf «Menü» im Spiel (unten rechts); der Stand bleibt. Am Ende des Epilogs «Zum Menü»; der geschaffte Grad ist
      markiert, der nächstschwerere hervorgehoben.
- [ ] Tastatur und Bildschirmleser bedienbar; Probe im Browser auf Desktop und Handy (hoch und quer).
- [ ] Alle Tests grün; Review nach dem Ticket.

## Comments

**Haltepunkt erledigt (29.10.2026):** Vorschauen in `.scratch/noa-geschichte/menue-vorschau/` (Karten, Fächer,
Lichtwege; je Desktop, Handy hoch und quer, Übersicht `bilder/uebersicht.png`). Der Nutzer wählt **Variante 3
«Lichtwege zum Polarstern»**: je Grad ein Lichtweg von Noas Lampe zum Polarstern, hell so weit, wie das Licht im Grad
gekommen ist, die sechs Welten als Punkte darauf, «Weiter» am Kopf des Lichts. Beim Bau die Ansicht Handy hoch
aufräumen (vier schmale Spalten, Gedränge am Stern). Hervorgehoben wird der nächstschwerere Grad nur direkt nach dem
Epilog (Entscheid 14); sonst führt «Weiter». Vorlage: `variante-lichtwege.html` mit `gemeinsam.css`/`gemeinsam.js`.

**Baustein vorgebaut (29.10.2026):** `.scratch/noa-geschichte/bausteine/menue/` (`menue.js`, `menue.css`,
`probe.html`, `LIESMICH.md` mit Schnittstelle und Einbau; Bilder mit `aufnahme.mjs` neu). Handy hoch: Grade als
Zeilen, Lampen gestaffelt links, Wege steigen auf und laufen im Fächer zum Stern; «Weiter» unten. Entscheide des
Koordinators zu den offenen Fragen des Bausteins: «23 / 60» zählt gelöste Level (Ticket 04 liefert die Zahl); ist der
nächstschwerere Grad schon geschafft, wird der nächste nicht geschaffte hervorgehoben, nach «sehr schwer» keiner; ein
Grad gilt ab dem Prolog als begonnen (`welt: 'dorf'`, «Dorf · 0 / 60»); hinter dem Menü schaut die Kamera in den
Himmel, damit das Brett nicht hinter den Wegen steht.
