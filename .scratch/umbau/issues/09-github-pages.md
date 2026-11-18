# 09: Browser-Fassung auf GitHub Pages

**Spec:** ../spec.md

**Status:** ready-for-agent (umgesetzt, wartet auf Review)

**Blocked by:** 08 (technisch genügt 02; auf Wunsch des Nutzers nach Meilenstein 1 vorziehbar)

**What to build:** Bei jedem Push auf `main` baut eine GitHub Action das Spiel und veröffentlicht `dist/` auf GitHub
Pages. Die Adresse `bonomoalessandro.github.io/Prisma/` ist danach fest (PLAN 4.1).

- [x] Workflow unter `.github/workflows/`: `npm ci`, Node-Tests, `npm run build`, Veröffentlichen auf GitHub Pages.
      Schwere Proben mit Chrome laufen dort nicht (zu langsam, ohne festes Rendern); sie bleiben lokal.
- [x] Spiel, Service Worker und Manifest laufen unter dem Unterpfad `/Prisma/` (`scope`, `start_url`, relative Pfade).
- [ ] *(offen, erst nach dem ersten Veröffentlichen; lokal unter /Prisma/ geprüft, siehe Umsetzung)* Installieren als Web-App und Offline-Spielen funktionieren auf der veröffentlichten Seite (Chrome am Desktop und
      auf Android, von Hand geprüft und unter «Comments» festgehalten).
- [x] Datenschutzerklärung als einfache Seite in derselben Veröffentlichung (PLAN 4.9: Fortschritt nur lokal, keine
      Abrufe bei fremden Servern). Text auf Deutsch und Englisch.
- [x] README: Adresse, wie veröffentlicht wird.
- [x] Aus Review 04: Der Service Worker wird seit Ticket 04 schon nach 0,15 s registriert (vorher nach rund 4 s), sein
      Vorab-Speichern läuft während des Seitenstarts mit. Erst registrieren, wenn `load` da ist **und** `main.ts` fertig
      geladen hat; mit `start-probe` vorher und nachher messen.
- [x] Aus Review 04: Source-Maps (2,3 MB) auf Pages bewusst entscheiden: behalten oder `hidden`.
- [ ] *(offen, Nutzer; Schritte unten)* Der Nutzer stellt in den Einstellungen des Repos GitHub Pages auf «GitHub Actions» um (falls der Agent das nicht
      mit `gh` kann, Schritt für Schritt beschreiben).

## Comments

### Umsetzung

Umsetzer, 18.11.2026, Branch `ticket/umbau-09` ab `85d0c74` (parallel zu Ticket 08). Nicht gepusht, nichts auf GitHub
geändert. Messungen mit `GPU=1`, frischer Chrome je Lauf; Basis = Build von `85d0c74`.

**Workflow** `.github/workflows/pages.yml` (Name «Pages»): nur `push` auf `main` und `workflow_dispatch`. Job
`bauen` (ubuntu-latest, Grenze 30 min): `actions/checkout@v7`, `actions/setup-node@v7` (Node 22, npm-Cache), `npm ci`,
`node tests/alle.mjs golden logic hall speicher testschnittstelle texte vorrat wuerfelliste ki-tester typecheck`,
`npm run build`, `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5` (`path: dist`). Job
`veroeffentlichen`: `actions/deploy-pages@v5`, Umgebung `github-pages`. Rechte `contents: read`, `pages: write`,
`id-token: write`; `concurrency: pages` ohne Abbrechen. Hauptversionen am 18.11.2026 auf den Release-Seiten
nachgesehen (checkout v7.0.1, setup-node v7.1.0, configure-pages v6.0.0, upload-pages-artifact v5.0.0, deploy-pages
v5.0.1). Auswahl der Tests nach den Laufzeiten von `npm test` auf der Basis (12 Kerne): `golden` 10 s, `logic` 80 s
(baut das Spiel und startet den Dev-Server, ohne Chrome), `hall`/`speicher`/`testschnittstelle`/`texte`/`typecheck` je
≤ 2 s, `vorrat` 10 s, `wuerfelliste` 27 s, `ki-tester` 8 s. **Nur lokal:** `geschichte` 739 s, `beurteilung` 113 s,
`levelliste` 89 s, `generator` 73 s (rechnen Level und Wahl auf allen Kernen, auf einem Runner mit 4 Kernen ein
Vielfaches; sie prüfen Leveldaten und Werkzeuge, nicht den Build) und `leise` (prüft die Sperre von `tools/leise.sh`
über `leise.ps1`, nur Windows). Kein Test der Auswahl braucht Chrome. Nachgestellt in einem Klon mit LF-Zeilenenden
(so checkt der Runner aus; `core.autocrlf=false`): `npm ci`, die Auswahl und `npm run build` grün (zusammen gut 4 min
neben anderen Läufen). Linux selbst (Gross-/Kleinschreibung, Pfadtrenner) konnte ich nicht prüfen (kein WSL, kein
Docker): Das zeigt erst der erste Lauf auf GitHub. Der Test «Pages: Workflow …» in `logic` hält Auslöser, Actions mit
fester Hauptversion, `npm ci`, Build, `path: dist` und die Testnamen (nur aus `tests/alle.mjs`, ohne `leise`) fest.

**Unterpfad `/Prisma/`.** Am Spiel war nichts nötig: `base: './'` bleibt (so läuft dieselbe Ausgabe unter `/`, unter
`/Prisma/`, in Capacitor und Electron; `base: '/Prisma/'` bräche alle lokalen Prüfungen unter `/`), Manifest
`scope: "./"`, `start_url: "index.html"`, `sw.js` neben der Seite (Bereich `/Prisma/`), alle Pfade in Seite, Stil und
Manifest relativ. Neu geprüft: `logic` «Pages: alle Pfade relativ …» (keine absoluten Pfade im Build und Manifest;
`sw.js` unter `https://bonomoalessandro.github.io/Prisma/sw.js` ausgeführt: Seite, `assets/` und Datenschutz kommen in
den Speicher, nichts ausserhalb von `/Prisma/`); `tests/offline.mjs --unterpfad` (Server wie Pages: `/Prisma` → 301
`/Prisma/`, ausserhalb 404; prüft jetzt in jedem Modus auch den Bereich von Service Worker und Manifest und die
Datenschutzerklärung offline). Installierbar unter `/Prisma/` (Chrome über CDP auf localhost, Einstieg über `/Prisma`
ohne Schrägstrich): `Page.getAppManifest` ohne Fehler, `Page.getInstallabilityErrors` leer, Controller
`…/Prisma/sw.js`, aufgelöst `id` `…/Prisma/prisma`, `start_url` `…/Prisma/index.html`, `scope` `…/Prisma/`, Konsole
ohne Fehler. `npm run preview -- --base /Prisma/` liefert Seite, `sw.js`, Manifest, Datenschutz, `vendor/` und
`backgrounds/` unter `/Prisma/` (in Git Bash nur mit `MSYS_NO_PATHCONV=1`, steht im README).

**Datenschutzerklärung** `datenschutz.html` (eine Seite, Deutsch `#de` und Englisch `#en`, ohne Skript, ohne fremde
Dateien, Stil inline, Systemschrift), vom Build unverändert nach `dist/` (`STATISCH` in `vite.config.mjs`) und in
`FILES` des Service Workers (offline lesbar). Inhalt: keine persönlichen Daten, kein Konto, keine Werbung, keine
Statistik, keine Cookies, keine Dritten; Fortschritt und Einstellungen (Ton, Sprache) nur im Local Storage des Geräts,
die Dateien des Spiels im Zwischenspeicher, löschbar mit den Websitedaten; keine Abrufe bei fremden Servern; GitHub
Pages als Hoster (Server-Protokolle mit IP, Verweis auf die Datenschutzerklärung von GitHub); Kinder; Kontakt
Alessandro Bonomo über das Repo. Im Code geprüft: keine `http(s)`-Adresse, die geladen wird (in `index.html`, `src/`,
Stil und Build nur Kommentare in three.js und der SVG-Namensraum), keine Schriften oder CDNs von aussen (Jost liegt
unter `assets/`), `fetch` nur auf eigene Dateien der Skyboxen, kein `sessionStorage`, `indexedDB`, `document.cookie`.
Test `logic` «Pages: Datenschutzerklärung …» (im Build gleich wie die Quelle, in `FILES`, beide Sprachen, kein Skript,
lädt nur `favicon.svg`). **Im Spiel nicht verlinkt** (bräuchte einen Text in `src/texte/*.json`, Ticket 08), siehe
offene Punkte.

**Service Worker später registrieren (Review 04).** Gemessen mit einem eigenen Skript (frischer Chrome, echter `sw.js`,
Build unter `/Prisma/`, Zeiten ab Navigation; wahlweise eine geteilte Leitung von 10 Mbit/s im Server):

| Fassung | Registrierung | aktiv | `.go` | Knopf (`.ready`) |
|---|---|---|---|---|
| Basis, Desktop, 8 Läufe | 1,27 s (= `load`) | 1,99 s | 3,40 s | 6,31 s |
| nur «`load` und Ende von `main.ts`», 3 Läufe | 1,10 s (`load` 1,01 s) | 1,91 s | 3,50 s | 6,41 s |
| **neu** (`load` und Enthüllung vorbei), 8 Läufe | 7,06 s | 7,36 s | 2,86 s | 5,77 s |
| Basis, Desktop, 10 Mbit/s, 3 Läufe | 1,63 s | 10,40 s | 3,76 s | 6,66 s |
| neu, Desktop, 10 Mbit/s, 3 Läufe | 7,84 s | 14,09 s | 3,63 s | 6,54 s |
| Basis, Handy, 10 Mbit/s, 6 Läufe | 1,6 s | 9,4 s | 3,61 s | 6,51 s |
| neu, Handy, 10 Mbit/s, 6 Läufe | 7,9 s | 14,2 s | 3,78 s | 6,68 s |

(Desktop ungedrosselt: je 3 Läufe nacheinander, dann 5 abwechselnd Basis/neu; einzelne `.go` streuen 2,1–4,0 s.)
Befund: **Das Ende von `main.ts` kommt praktisch gleichzeitig mit `load`** (rund 1 s; `load` kam hier nicht nach
0,15 s wie im Review 04, sondern nach 0,9–1,7 s): Die wörtliche Vorgabe hätte nichts verschoben. Darum registriert die
Seite erst, wenn `load` da ist **und** `main.ts` die Teile geladen hat **und** die Enthüllung vorbei ist: `src/main.ts`
sendet nach dem Import der Teile auf `introCalm` (Ende der Enthüllung, `INTRO_REVEAL_MS` nach `.go`; mit `?nointro`
sofort; bei reduzierter Bewegung gleich nach `.go`) das Ereignis `prisma-ruhig`, das Skript im Kopf von `index.html`
wartet auf `load` und dieses. So läuft das Vorab-Speichern (13,6 MB) weder neben dem Seitenstart noch neben der
Enthüllung (bei der laut `ui.js` jedes ausgelassene Bild als Ruck sichtbar ist). Ergebnis: ungedrosselt `.go` und
Knopf im Mittel rund 0,5 s früher (im Streubereich, aber in beiden Reihen gleich gerichtet), mit 10 Mbit/s gleich
(±0,15 s, im Rauschen). Preis: offline bereit erst nach rund 7 s statt 2 s (mit 10 Mbit/s 14 statt 10 s); wer die
Seite beim ersten Besuch vorher schliesst, hat noch keinen Offline-Stand (beim nächsten Besuch dann schon). Gar nicht
registriert wird er nur, wenn das Modul nicht lädt (dann läuft auch das Spiel nicht, wie schon bei «Ende von
`main.ts`») oder `introCalm` nie kommt: `ui.start` setzt es immer (nach `vorwaermenVorStart().catch`;
`seitenstartAngestossen` kommt im `finally` des Seitenstarts), `?nointro` direkt. Test `logic` «Pages: Service Worker
erst nach load und nach der Enthüllung …» (Kopf wartet auf beide, keine alte Registrierung, `main.ts` genau so,
Ereignis am Ende des Bündels); `offline.mjs` (alle drei Modi grün) zeigt, dass er registriert und übernimmt.

`start-probe` (headless, je 2 Läufe, Spiel unter `/Prisma/` über `PRISMA_SPIEL`; «leer» = leerer Service Worker wie
bei `spielServer`, «echt» = echter `sw.js`; alle «Start: in Ordnung»):

| Fall | «neu»: `.go` / Knopf / ganz | «weiter»: spielt nach |
|---|---|---|
| Basis leer | 0,80 / 3,71 / 9,47 s; 1,48 / 4,38 / – s | 6,39 / 6,09 s |
| neu leer | 1,26 / 4,17 / 9,96 s; 1,30 / 4,20 / 10,07 s | 6,02 / 6,12 s |
| Basis echt | 2,47 / 5,37 / 11,27 s; 1,34 / 4,25 / 10,18 s | 6,02 / 6,02 s |
| neu echt | 3,06 / 5,97 / 11,47 s; 2,36 / 5,26 / 10,50 s | 6,02 / 6,10 s |
| neu normal (eigener Bau unter `/`, 1 Lauf) | 1,39 / 4,30 / 10,24 s | 6,14 s |

Im Rauschen: `.go` streut je Fall bis 1,1 s, und bei «neu echt» kann der Service Worker die Enthüllung gar nicht
beeinflussen (er registriert erst danach). Längste Lücke im Startbildschirm mit echtem `sw.js`: Basis 177 und 124 ms
(bei 6,1 und 7,1 s, während des Vorab-Speicherns), neu 93 und 87 ms (bei 9,3 s, dorthin fällt jetzt das
Vorab-Speichern); mit leerem `sw.js` Basis 459/143 ms, neu ≤ 100 ms. Einzelne Lücken über 100 ms kommen schon auf der
Basis vor.

**Source-Maps: behalten** (`sourcemap: true`, Kommentar in `vite.config.mjs`). Gründe: Das Repo ist öffentlich, die
Maps zeigen nichts, was nicht schon dort steht; sie kosten keinen Spieler etwas (Chrome lädt sie nur bei offenem
DevTools, sie sind nicht in `FILES`, Test seit Ticket 04); mit ihnen zeigen Fehler und Haltepunkte auf der
veröffentlichten Seite (auch auf dem Handy über Remote-Debugging) auf die Module. Sie kosten nur Platz im Artefakt
(2,41 MB + 0,08 MB Worker; `dist/` 34,2 MB, weit unter der Grenze von Pages von 1 GB). `hidden` hätte nur Sinn mit
einem Dienst für Fehlerberichte, den es nicht gibt. Für die App (Ticket 10) neu entscheiden (dort weglassen).

**Prüfungen** (alle über `tools/leise.sh`, Messläufe allein, übrige leicht):
- Node-Tests der Auswahl (golden, logic mit 4 neuen Tests «Pages: …», hall, speicher, testschnittstelle, texte,
  vorrat, wuerfelliste, ki-tester, typecheck): grün. Die übrigen (`geschichte`, `levelliste`, `beurteilung`,
  `generator`, `leise`) auf der Basis grün; das Ticket ändert nichts, was sie lesen.
- `offline.mjs`, `offline.mjs --unterpfad`, `offline.mjs --unterpfad --redirect`: bestanden.
- Bildvergleich `--gpu` (ohne neue Referenzen): 73 von 77 grün; rot nur `desktop-welt-4-vor/-nach` und
  `quer-welt-4-vor/-nach` (Lava des Vulkans, bis 14,7 %), gelaufen neben drei anderen leichten Läufen. Allein
  wiederholt (`--jobs 1 --nur welt-3-4 --groesse desktop,quer`): alle 12 grün, grösste Abweichung 2. Ein Flake des
  parallelen Laufs; der Unterpfad ändert nichts am Bild (die Proben laufen weiter unter `/`).
- Installierbarkeit unter `/Prisma/` (CDP) und `npm run preview -- --base /Prisma/`: siehe oben.
- Für den Reviewer: Bildvergleich in SwiftShader, die übrigen Proben mit Zeitmessung, `npm test` ganz.

### Offene Punkte

- **Nach dem ersten Veröffentlichen** (Nutzer, oder ein Agent auf sein Go): auf
  `https://bonomoalessandro.github.io/Prisma/` am Desktop (Chrome) und auf Android (Chrome, Poco) installieren, nach der
  Enthüllung etwa 15 s warten, offline starten (Flugmodus), einen Himmel wechseln, `datenschutz.html` öffnen; unter
  «Comments» festhalten (offenes Häkchen oben).
- **Linux-Runner:** Erst der erste Lauf auf GitHub zeigt, ob die Auswahl der Tests unter Linux grün ist (lokal nur mit
  LF-Zeilenenden unter Windows nachgestellt). Wird er rot, bleibt der bisherige Stand online; zuerst die Meldung
  ansehen (Gross-/Kleinschreibung von Pfaden, `\` in Pfaden).
- **Datenschutzerklärung im Spiel verlinken:** braucht einen Text («Datenschutz» / «Privacy») in `src/texte/*.json`
  und einen Platz im Menü; gehört nach dem Merge von 08 und 09 in ein kleines Folgeticket (oder in Ticket 10, für das
  der Play Store die Adresse ohnehin verlangt). Für den Store genügt die Adresse.
- **Kontakt in der Datenschutzerklärung:** heute «über das Repo» (GitHub). Der Play Store verlangt im Store-Eintrag
  ohnehin eine E-Mail-Adresse; ob sie auch auf die Seite soll, entscheidet der Nutzer (PLAN 4.9).
- **Offline erst nach der Enthüllung** (Abwägung oben). Wer den Service Worker früher will: in `src/main.ts` statt
  `introCalm` das Ende des Seitenstarts nehmen.
- Gemeinsamer Ursprung `bonomoalessandro.github.io`: `localStorage` und Cache Storage teilen sich alle Seiten des
  Kontos; das Spiel nutzt nur `prisma.*` und `prisma-*` (im README vermerkt). Heute gibt es keine andere Seite mit
  diesen Präfixen.

### Schritte für den Nutzer

1. Review abwarten, dann Merge nach `main` und Push (auf dein Go).
2. Auf GitHub im Repo `bonomoalessandro/Prisma`: **Settings** → links **Pages** → unter «Build and deployment» bei
   **Source** «**GitHub Actions**» wählen (statt «Deploy from a branch»). Die Wahl gilt sofort. (Pages gratis nur für
   öffentliche Repos.) Am besten vor dem Push; sonst scheitert der erste Lauf bei «configure-pages» bzw.
   «deploy-pages» und muss danach von Hand neu gestartet werden (Actions → «Pages» → «Run workflow» → `main`).
3. Unter **Actions** den Lauf «Pages» ansehen (startet mit dem Push auf `main` von selbst). Beide Jobs («bauen»,
   «veroeffentlichen») müssen grün sein.
4. Die Adresse steht danach unter Settings → Pages und beim Job «veroeffentlichen»:
   `https://bonomoalessandro.github.io/Prisma/`. Prüfen: Spiel lädt; in Chrome am Desktop das Installieren-Symbol in
   der Adresszeile, auf Android «App installieren» im Menü; nach der Enthüllung kurz warten, dann im Flugmodus starten.
   `https://bonomoalessandro.github.io/Prisma/datenschutz.html` zeigt die Datenschutzerklärung (diese Adresse kommt
   später in den Play Store, PLAN 4.9).
5. Nichts weiter einzustellen: Die Umgebung «github-pages» legt GitHub beim ersten Lauf selbst an (nur `main` darf
   dorthin veröffentlichen).
