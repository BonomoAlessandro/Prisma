# PRISMA – Plan und offene Punkte

## 0. Als Nächstes: Schwierigkeit wählen, dann Noas Geschichte

Wunsch des Nutzers (28.10.2026), als Nächstes anzugehen. Grundlage ist der Prototyp «Ein Lichtsignal an die Sterne»
(Branch `feature/lichtsignal-prototyp`, Start mit `?signal`): Prolog im Bergdorf, sechs Welten mit je eigener Skybox
(Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne) und Reisen dazwischen, Finale beim Polarstern, Epilog bei Noa.
Entscheide aus dem Grilling vom 29.10.2026, Spec und Tickets: `.scratch/noa-geschichte/` (Tickets 02–09), Stand und
Übergabe in `STAND.md` dort. Begriffe in `CONTEXT.md` (Abschnitte «Noas Geschichte» und «Level der Geschichte»),
Entscheid in ADR 0005.

- **Stand 30.10.2026** (Branch `feature/lichtsignal-prototyp`, noch nicht auf main): Vorrat und Lader (02), Wahl der
  240 Level und Titel (03), die Geschichte je Grad im Spiel (04), Menü mit den vier Graden (05) und Übersicht mit
  Bestwerten und Wiederholen (06) sind gebaut und abgenommen. In Arbeit: Kapitel «Im Dorf» mit überspringbaren
  Einstiegen (07) und der Einbau der neuen sehr schweren Level statt der Platzhalter (09; die Wahl dafür liegt auf
  `feature/noa-09-wahl`). Danach Aufräumen und Abnahme (08); von 08 sind Begriffe und ADR geschrieben. Nach main erst,
  wenn der Nutzer es sagt.
- **Offen, nicht Teil der Spec:**
  - [ ] Eigene Skybox für «Im Dorf» (macht der Nutzer; vorerst die Milchstrasse, an einer Stelle austauschbar),
    vielleicht zusammen mit dem Dorf aus 1.2.
  - [ ] Würfel-Level als Teil 2 der Geschichte: Alle 300 liegen im Vorrat, ohne Zugang im Spiel, mit einem Befehl
    zurückzuholen (`tools/vorrat.mjs`); ob und wie sie wiederkommen, ist offen.
  - [ ] Zwischenszenen innerhalb einer Welt (vorerst bewusst keine, Entscheid 7 der Spec).

- [ ] **0.1 Neuer Spielablauf:** Keine feste Reihe von 500 Leveln mehr. Im Menü wählt der Spieler die Schwierigkeit
  (leicht, mittel, schwer, sehr schwer); danach spielt er Noas Geschichte mit genau 10 Leveln je Skybox, also
  60 Leveln je Schwierigkeit.
  - **Wahl der Level (Wunsch des Nutzers, 28.10.2026):** Je Welt und Grad kommen die 10 am besten bewerteten Level
    dazu (Urteil der KI-Tester, Spielwert), aber ohne Häufungen: Innerhalb einer Welt und über die Weltgrenzen hinweg
    dürfen keine Klumpen entstehen, in denen zu viele Level auf dieselbe Art gelöst werden (dieselbe Haupt-Kernidee,
    ähnliches Feld). Lässt sich beides nicht zugleich erfüllen, geht die Vielfalt vor; dann kommt das nächstbeste
    Level mit einer anderen Lösungsart.
  - **Steigende Schwierigkeit (Wunsch des Nutzers, 28.10.2026):** Neben der Bewertung zählt die Schwierigkeit. Innerhalb
    eines Grads steigt sie über die Geschichte: Die letzten leichten Level (bei den Sternen) sind schwerer als die
    ersten (im Bergwald), ebenso in jedem anderen Grad. Die Wahl verteilt die Level eines Grads darum über seinen
    ganzen Bereich der Schwierigkeit, und die Welten bekommen ihn der Reihe nach, von unten nach oben.
  - **Entschieden (29.10.2026, Spec):** Die Geschichte ist der einzige Ablauf; ein Grad je Durchgang mit eigenem
    Fortschritt; steigend auch innerhalb einer Welt (Vertauschungen höchstens 2 Plätze); Tutorial als Kapitel
    «Im Dorf» nach dem Prolog (Üben oder Gleich los); die Levelauswahl wird zur Übersicht des Grads mit Bestwerten;
    Prolog und Einstiege beim ersten Durchgang je Grad; Würfel-Level vorerst in den Vorrat.
  - **Entschieden (30.10.2026):** Die Bestwerte überleben «Von vorn»; die Reisen zwischen den Welten laufen ganz und
    sind nicht überspringbar (überspringbar bleiben Prolog, Angebot, «Im Dorf» und die Einstiege in die Welten).
- [ ] **0.2 Nicht mehr gebrauchte Level zur Seite legen:** Was in keiner Welt mehr vorkommt, nicht löschen, sondern in
  einen Vorrat verschieben, damit es später wieder verwendet werden kann (Leveldaten samt Herkunft und Urteil der
  KI-Tester). Die Tests, die heute Reihenfolge, Grade und Namen festhalten (`tests/levelliste.test.mjs`,
  `tests/golden.mjs`, `entfernteNamen`), an den neuen Ablauf anpassen.
  - Vorrat (`tools/vorrat/`, `tools/vorrat.mjs`) und Lader (`tools/lader.mjs`) stehen seit Ticket 02; 275 flache und
    alle 300 Würfel-Level liegen dort. Offen bis Ticket 08: Werkzeuge und Tests nur der Reihe entfernen oder auf den
    Vorrat umstellen.
- [ ] **0.3 Fehlende Level generieren:** Je Grad braucht es 60 Level. Heute gibt es in der Fläche 85 leichte,
  265 mittlere, 105 schwere und 45 sehr schwere; für «sehr schwer» fehlen also mindestens 15 (Generator und KI-Tester
  wie beim Ausbau auf 500).
  - [x] **Sehr schwer (29.10.2026):** 15 neue Level beurteilt und gewählt, noch nicht im Spiel, in
    `tools/geschichte/sehr-schwer-neu.json`; Herkunft und Wahl in `.scratch/noa-geschichte/issues/01-sehr-schwer-vorrat.md`.
    Mit den 45 im Spiel sind es 60 (je Haupt-Kernidee höchstens 12, dazu ein Lockvogel).
  - **Entschieden (29.10.2026, Spec):** Die 240 Level bekommen Titel, die zu ihrer Welt passen; der bisherige Name
    bleibt der Schlüssel für Werkzeuge und Protokoll.
  - In «sehr schwer» geht die Vielfalt mit den vorhandenen Leveln nicht ganz auf; dort stehen vorerst Platzhalter.
    Ticket 09 ersetzt sie durch neue Level (Wahl auf `feature/noa-09-wahl`: 23 neue statt 23 Platzhalter, ohne
    Verstoss; Einbau offen).

## 1. Aussehen

- [ ] **1.1 Plattformen passend zur Skybox:** Die Plattform nimmt das Material ihrer Umgebung auf, z. B. sandig am
  Strand. Gilt für jede Skybox, auch für die neuen aus 1.2.
- [~] **1.2 Neue Skyboxen:**
  - [x] Vulkan mit Lava (seit 26.10.2026 auf main; Storyline: Rot)
  - [x] Wüste (Storyline: Gelb; seit 28.10.2026): weiche Dünen im Anime-Stil, Windrippel nah am Brett, drei nahe Dünen
    als 3D-Netz im Spiel (bakedMesh mit Übergang in den Sand), eine kleine Oase und die Pyramiden von Giza. Lädt ihr
    Bild erst beim Wählen (`vorab: false`), weil die vorab gespeicherten Skyboxen sonst über 4,5 MB kämen; offen, ob
    das Budget steigen soll.
  - [ ] Eis oder Gletscher (Storyline: Cyan)
  - [ ] Blütental in der Dämmerung, z. B. Lavendel oder Kirschblüten (Storyline: Magenta)
  - [ ] Idyllisches Dorf, umgeben von Bergen (Storyline: Finale)

## 2. Würfel-Level (3D)

- [~] **2.1 Würfel-Level erstellen und ausbauen.** Seit 27.10.2026 Quader 7 × 7 × 5 (vorher 7 × 7 × 7, bis 23. Oktober
  5 × 5 × 5), Konzept in `3D-WUERFEL.md`; Specs und Tickets in `.scratch/wuerfel-500/` und `.scratch/wuerfel-7x7x5/`.
  - **Stand 27.10.2026: 300 Würfel-Level im Quader 7 × 7 × 5**, vom Nutzer abgenommen und am 27.10. nach main gemergt:
    51 leicht, 159 mittel, 63 schwer, 27 sehr schwer (17 / 53 / 21 / 9 %). Jedes geht in der Lösung über mindestens
    3 Ebenen und steht am Boden, hat genau eine Lösung, besteht die Beurteilung, hat ab „mittel“ eine nötige Kernidee,
    ist keinem anderen zu ähnlich und von beiden KI-Testern beurteilt; Herkunft (Auftrag, Seed, Stand, „gesenkt um N“)
    nachbaubar.
  - **Dauerregel des Nutzers (26.10.2026), gilt immer, ausser er sagt etwas anderes:** Grundfläche 7 × 7, Höhe 5;
    die Lösung trifft Elemente auf mindestens 3 Ebenen; das unterste Element steht am Boden (`ebenenVerletzt` in
    `tools/wuerfelliste.mjs`, Test über alle Level im Spiel).
  - Umbau (Tickets 01–12 der Spec `wuerfel-7x7x5`): 75 der alten 300 gesenkt und behalten, 225 entfernt (Namen nie
    wieder vergeben, `entfernteNamen`), 9 Gruppen neu. Unterwegs neu im Code: Höhe der Würfel-Level (`height`),
    Ebenen-Regel, Pool umrechnen, Korrektur der KI-Tester im Würfel aus dem Lauf und nach Zielplatz.
  - Häufungsregel im Würfel wie im Ausbau (höchstens 2 je Seite, ab „mittel“ 3), ohne Duldung. Gegen Häufungen
    wurden 15 Level des Umbaus wieder entfernt; im oberen Bereich von „leicht“ und „mittel“ häufen sich Sammelstelle
    und Mischziel, eigene Pools mit Ziel-Schwierigkeit (`pool-2-*-oben`) helfen dort.
  - [ ] Weiter bis 500 (Tickets 14–21 der Spec `wuerfel-500`, in 7 × 7 × 5), erst auf Anweisung.
    - Für jede Gruppe wird es schwerer, Häufungen zu vermeiden; mit Ziel-Pools je Bereich rechnen.
    - Namen: Vorrat in `tests/output/wuerfel/namen-vorrat.json` (nicht versioniert), streng prüfen (Teilwort,
      Wortende, Nachbarn im Spiel).
  - [ ] **E** Offen: Bekommt das erste Würfel-Level den Achsen-Hinweis, den früher Aufzug hatte?
  - [ ] Leistung auf dem Handy und Spieltests mit Menschen.
- [ ] **2.2 Strahl auf der Plattform blocken:** Strahlt ein Strahl auf die Plattform (im Würfel ein Strahl nach unten),
  wird er dort geblockt und leuchtet nicht durch.

## 3. Später (nächste Version, nicht jetzt)

- [ ] Neue Mechaniken, z. B. verschiebbare Elemente, Strahlteiler (halbdurchlässiger Spiegel), Portale, Schalter:
  - **Schalter (Lichtsensor):** Trifft Licht den Schalter, bewegt sich automatisch ein anderes Element (verschieben,
    evtl. auch drehen oder Blocker öffnen). Eröffnet neue Levelideen: Reihenfolge der Schritte zählt, ein Strahl bahnt
    einem anderen den Weg. Offen: dauerhaft auslösen oder nur solange Licht darauf fällt; Darstellung der Verbindung
    Schalter → Element; Löser und Generator müssen Zustände mit Schaltern durchspielen.
  - **Linsen, konvex und konkav** (Idee des Nutzers, 9. Oktober): Die Sammellinse bündelt Strahlen, die
    Zerstreuungslinse fächert einen Strahl auf. Offen ist, wie das im Raster wirkt: Durch eine Linse in einer
    einzelnen Zelle läuft der Strahl immer mittig und würde nicht abgelenkt. Denkbar: Die Linse ist drei Zellen breit.
    Die Sammellinse lenkt dann die Strahlen in den äusseren Zellen um 45° zur Mitte, und im Brennpunkt mischen sich
    ihre Farben. Die Zerstreuungslinse macht aus einem Strahl drei (geradeaus und ±45°), in der gleichen Farbe.
    Abgrenzen vom Prisma, das schon einen Strahl in drei teilt (dort nach Farben).
- [~] **Würfel-Level in 3D** (Wunsch des Nutzers, 11. Oktober; Branch `feature/3d-wuerfel`): Prototyp mit zwei
  handgebauten Leveln im 7×7×7-Würfel (bis 23. Oktober 5×5×5), um das Potenzial zu prüfen. Modell: feste Drehachse
  je Element, gleich viele Stellungen wie in 2D (Löser bleibt schnell). Alle Elemente direkt anklickbar (die
  Ebenenwahl ist wieder entfernt), freiere Kamera. **E** nach dem Ausprobieren: weiterverfolgen? Dann offen: Tutorial
  für die Achsen, Würfel-Level aus dem Generator (Ticket 22) von Hand und mit den KI-Testern prüfen, Grösse (5 oder 7)
  nach Spieltests festlegen, Leistung auf dem Handy.
  → Beurteilung und Generator im Würfel, eine Strahlregel für beide: Spec `.scratch/levelgenerator/spec.md`,
  Tickets 14, 22 und 27.
- [ ] Eventuell eine 3D-Karte für die Levelauswahl.
- [~] **Storyline** (Idee des Nutzers, 26. Oktober): Vielleicht eine Art Geschichte, die die Level verbindet, am
  ehesten etwas, das mit Licht zu tun hat. Seit 28. Oktober als Prototyp «Ein Lichtsignal an die Sterne» (Branch
  `feature/lichtsignal-prototyp`, `?signal`); wie es weitergeht, steht unter 0.

## 4. Google Play Store

Weg: Prisma bleibt eine Web-App und wird als Trusted Web Activity (TWA) in eine Android-Hülle verpackt (Bubblewrap oder
PWABuilder) – das Spiel selbst wird nicht umgeschrieben. Reihenfolge: zuerst 4.1–4.4 (lohnt sich auch ohne Store),
dann 4.5–4.7, parallel 4.8–4.10, zuletzt der Test 4.11. Die Regeln (Testerzahl, verlangte Android-Version) vor dem
Start in der aktuellen Play-Console-Hilfe nachsehen.

**Im Projekt**
- [ ] **4.1 Feste Adresse mit HTTPS**, z. B. GitHub Pages (Repo liegt schon auf GitHub) oder eigene Domain.
  Vor dem geschlossenen Test (4.11) endgültig entscheiden: Spielfortschritt (localStorage), Manifest-`id` und Asset
  Links hängen an der Adresse, ein späterer Wechsel kostet die Spieler ihren Fortschritt. Bei GitHub Pages als
  Projektseite (`…github.io/Prisma/`) muss `assetlinks.json` (4.5) im Repo `BonomoAlessandro.github.io` liegen.
- [x] **4.2 Offline-Fähigkeit:** Service Worker (`sw.js`), der Spiel, Icons, Bibliotheken und Schrift
  zwischenspeichert. Online kommt die Seite frisch vom Server (nach 3 s Wartezeit aus dem Speicher), offline aus
  dem Speicher; `vendor/` direkt aus dem Speicher; alle anderen Anfragen gehen vorbei. Nur über http(s) (über
  file:// gibt es keine Service Worker).
  `tests/logic.test.mjs` prüft die Dateiliste, `tests/offline.mjs` lädt das Spiel, stoppt den Server und lädt neu.
- [x] **4.3 Abhängigkeiten lokal ausliefern:** Three.js r147 samt 7 Zusatzmodulen in `vendor/three-0.147.0/` (aus dem
  npm-Paket, Prüfsumme der Registry geprüft, byte-gleich mit den bisherigen CDN-Dateien), die Schrift „Jost“ in
  `vendor/jost/` (nur der lateinische Zeichensatz, variable Schrift für alle Stärken). Lizenzen liegen bei
  (MIT, SIL OFL). Kein Abruf bei fremden Servern mehr.
- [x] **4.4 Manifest ergänzen:** Name „Prisma – Licht-Puzzle“ (Startbildschirm „Prisma“; „Prisma“ allein ist im Store
  durch eine Foto-App besetzt), feste `id` „prisma“ (nicht mehr ändern, sonst gilt die installierte Web-App als neue;
  die Play-App erkennt man an Paketname und Signaturschlüssel), `scope`, Sprache,
  Beschreibung, Kategorie. Android-Icons mit Schutzrand (`icons/icon-maskable-192/512.png`, erzeugt mit
  `tools/icons.mjs`: ohne Ecke, Prisma auf 85 % verkleinert, Strahl und Spektrum bis zum Rand). Seitentitel
  angepasst. Speicherschlüssel des Fortschritts unverändert. Chrome meldet keine Manifest-Fehler, installierbar.
- [ ] **4.5 Digital Asset Links:** `/.well-known/assetlinks.json` auf der Website, sonst zeigt die App eine
  Browser-Adressleiste.
- [ ] **4.6 Android App Bundle (.aab) bauen und signieren** (Bubblewrap). Signaturschlüssel sicher aufbewahren – ohne
  ihn keine Updates.
- [ ] **4.7 Test auf echten Android-Geräten:** Leistung auf schwächeren Handys, Zurück-Taste, Hoch-/Querformat, Ton.

**Konto und Store-Eintrag**
- [ ] **4.8 Google-Play-Entwicklerkonto:** einmalig 25 USD, Identitätsprüfung.
- [ ] **4.9 Pflichtangaben:** Datenschutzerklärung als Webseite (Fortschritt nur lokal; seit 4.3 keine Abrufe bei
  fremden Servern mehr), Formular „Datensicherheit“, Altersfreigabe-Fragebogen, Zielgruppe.
- [ ] **4.10 Store-Material:** Icon 512 × 512 (vorhanden), Titelgrafik 1024 × 500, mindestens 2 Screenshots,
  Kurzbeschreibung (80 Zeichen), lange Beschreibung.
- [ ] **4.11 Geschlossener Test:** Neue private Konten brauchen mindestens 12 Tester über 14 Tage, bevor die App
  öffentlich erscheinen darf – zeitlich der längste Schritt.

## 5. Steam

- [ ] **5.1 Prisma irgendwann auch auf Steam veröffentlichen.** Als Web-App braucht Prisma dafür eine Desktop-Hülle
  (z. B. Electron oder Tauri). Weg und Schritte sind noch offen; Regeln und Gebühr (Steam Direct) vor dem Start
  nachsehen.
