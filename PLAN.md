# PRISMA – Plan und offene Punkte

## 1. Aussehen

- [ ] **1.1 Plattformen passend zur Skybox:** Die Plattform nimmt das Material ihrer Umgebung auf, z. B. sandig am
  Strand. Gilt für jede Skybox, auch für die neuen aus 1.2.
- [ ] **1.2 Neue Skyboxen:**
  - [ ] Vulkan mit Lava
  - [ ] Canyon
  - [ ] Wüste
  - [ ] Idyllisches Dorf, umgeben von Bergen
- [ ] **1.3 Lichtstrahlen:** Je nach Blickwinkel sehen die Strahlen noch immer wellenartig aus. Aussehen verbessern.
- [ ] **1.4 Prismen:** Aussehen anpassen, sodass besser ersichtlich ist, auf welcher Seite die Farben herauskommen.

## 2. Würfel-Level (3D)

- [ ] **2.1 Würfel-Level erstellen und ausbauen.** Der Prototyp liegt auf dem Branch `feature/3d-wuerfel` (Würfel
  5 × 5 × 5, Konzept und Stand in `3D-WUERFEL.md` auf dem Branch).

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
  handgebauten Leveln im 5×5×5-Würfel, um das Potenzial zu prüfen. Modell: feste Drehachse je Element, gleich viele
  Stellungen wie in 2D (Löser bleibt schnell). Alle Elemente direkt anklickbar (die Ebenenwahl ist wieder entfernt),
  freiere Kamera. **E** nach dem Ausprobieren: weiterverfolgen? Dann offen: Tutorial für die Achsen, Würfel-Level aus
  dem Generator (Ticket 22) von Hand und mit den KI-Testern prüfen, grössere Würfel (7×7×7) erst nach Spieltests,
  Leistung auf dem Handy.
  → Beurteilung und Generator im Würfel, eine Strahlregel für beide: Spec `.scratch/levelgenerator/spec.md`,
  Tickets 14, 22 und 27.
- [ ] Eventuell eine 3D-Karte für die Levelauswahl.

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
