# PRISMA

Ein 3D-Licht-Puzzle im Browser: Spiegel und Kristalle drehen, Licht lenken,
mit Prismen in Spektralfarben aufspalten und farbige Ziele treffen.

- **Starten:** Node 22.12 oder neuer, einmal `npm install` (Abhängigkeiten nur zum Entwickeln: Vite und TypeScript,
  Versionen fest in `package-lock.json`). Dann `npm run dev`: Dev-Server auf `http://localhost:5173/`, lädt bei einer
  Änderung neu. Three.js r147 (MIT) und die Schrift Jost (SIL OFL 1.1) liegen in `vendor/`, die Lizenztexte daneben.
- **Bauen:** `npm run build` legt das fertige Spiel nach `dist/` (nicht im Repo; etwa 2 s), mit relativen Pfaden
  (`base: './'`, läuft also auch in einem Unterordner wie `/Prisma/`). `npm run preview` liefert `dist/` über http
  (`http://localhost:4173/`), mit Service Worker wie später im Netz. Wie gebaut wird, steht im Kopf von
  `vite.config.mjs`: Vite bündelt die Module zu einer verkleinerten Datei unter `dist/assets/` (mit Source-Map, nicht
  im Speicher des Service Workers), den Stil zu einer zweiten; was `index.html` direkt lädt (three.js, das Register
  der Skyboxen), trägt `vite-ignore`; `vendor/`, `icons/`, `favicon.svg`, `manifest.webmanifest` und die Skyboxen
  des Registers kommen unverändert nach `dist/`, die Schrift mit Hash nach `dist/assets/`.
- **Aufbau des Codes (seit Ticket 04 des Umbaus):** `index.html` ist nur das Gerüst der Seite: Markup, zwei kleine
  Skripte im Kopf (Manifest und Service Worker; Massstab der Seite `SEITE`), three.js und das Register der Skyboxen
  als klassische Skripte, dann das Spiel als ES-Modul `src/main.ts`. Der Stil liegt in `src/stil/` (`index.css`
  bindet die Teile in ihrer Reihenfolge ein: `grund`, `oberflaeche`, `start`, `geschichte`, `menue`, `uebersicht`,
  `leistung`, `seite`). Das Spiel in `src/`:
  - `logik.js` (Strahlregel, Löser-Grundlagen, `LEVELS`, `LEVELS_3D` und `STORY_LEVELS` aus den Leveldaten; auch für
    Node), `daten/level.js` (die Level und die Reise der Geschichte als Daten, seit Ticket 06; siehe «Levels»),
    `zufall.js`, `hall.js`,
    `hall-worker.ts` (Worker des Halls); `himmelbild.js` (Farbbilder der Skyboxen dekodieren, `decode`) mit
    `himmelbild-worker.ts`, `brettdaten.js` (Texturen der Bretter rechnen, `BRETT_DATEN`) mit `brettdaten-worker.ts`
    (seit Ticket 05 eigene Module; bis dahin bekamen diese Worker den Text der Funktionen als Blob, und der Build
    durfte keine Namen kürzen). Ohne Worker rechnet die Seite mit denselben Funktionen im Hauptthread;
  - `speicher.ts`, die Speicherschicht (Ticket 05 des Umbaus): Aller Zugriff auf den Spielstand läuft über ihre kleine
    Schnittstelle `Speicher` (`lesen`, `schreiben`, `loeschen` je Schlüssel, Werte als Text; wirft nie). Die Umsetzung
    wählt die Plattform beim Start (`speicherFuerPlattform`), heute überall `localStorage`; später etwa eine Datei für
    Steam Cloud, ohne dass sich das Spiel ändert. Kein anderer Teil des Codes nennt `localStorage` (Test).
    `spielstand.js` legt Schlüssel und Format fest (unverändert seit Noas Geschichte): `progress` (Stand je Grad unter
    `prisma.noa.<grad>`, Bestwerte unter `prisma.noa.<grad>.bestwerte`, zuletzt gespielt unter `prisma.noa.zuletzt`)
    und `einstellungen` (Ton aus unter `prisma.muted`, seit Ticket 07 die gewählte Sprache unter `prisma.sprache`);
  - `texte/`, die Übersetzungsschicht (Ticket 07 des Umbaus): Jeder Text, den der Spieler sieht, steht in einer
    JSON-Datei je Sprache (`de.json`; eine neue Sprache ist nur eine neue Datei `<kürzel>.json`, das Spiel findet sie
    mit `import.meta.glob`). Der Code nennt Schlüssel: `t('menue.aktion.weiter')`, mit Werten
    `t('kopf.uebung', { n, N })` («Übung {n} / {N}»); ein Blatt kann je Gerät verschieden sein (`{ touch, maus }`,
    «Tippen»/«Klicken»), und die Platzhalter `{Tippe}` und `{Drücke lang}` holen die Befehlsform je Gerät aus dem
    Bereich `geraet`. Fehlt ein Schlüssel in einer Sprache, gilt der deutsche Text. Die Titel der Level stehen im
    Bereich `titel` unter ihrem Namen (`levelTitel`; ohne Eintrag, etwa ein Kandidat der KI-Tester, der Name), die
    Sätze der Führung unter `fuehrung` (die Leveldaten nennen nur den Schlüssel). Den Kern (Nachschlagen,
    Platzhalter, Wahl der Sprache) hat `uebersetzung.js`, auch für Node; `sprache.js` lädt die Dateien, wählt die
    Sprache (`?sprache=<kürzel>` zum Prüfen, sonst die im Menü gewählte, sonst die des Geräts: `de*` Deutsch, sonst
    Englisch, solange es `en.json` gibt), setzt `lang` des Dokuments und die festen Texte in `index.html`
    (`data-t`, `data-t-title`, `data-t-aria-label`, `data-t-content`). Der Schalter der Sprache steht oben rechts im
    Menü (das Spiel hat keine eigenen Einstellungen): Globus, der Name der Sprache (auf dem Handy, hochkant und quer, ihr
    Kürzel «DE») und ein ▾; er öffnet nach unten eine Liste aller Sprachen mit Datei, je mit ihrem Namen in ihr selbst,
    die aktuelle mit Häkchen (Ticket 02 von `.scratch/sprachwahl/`, `src/seite/oberflaeche/sprachliste.js`, «Menu
    Button» nach WAI-ARIA APG; Esc schliesst nur die Liste). Ein Wechsel speichert die Sprache und lädt die Seite seit
    Ticket 01 nicht mehr neu (`setzeSprache`, Kern `sprachSchicht` in `uebersetzung.js`): `t`,
    `levelTitel` und `sprache` (ein Live-Binding) folgen sofort der neuen Sprache; `sprache.js` stellt `lang`, die festen
    Texte (ausser denen mit Zustand, `data-zustand="text"` bzw. `="aria-label"`: ihr Besitzer setzt sie), Seitentitel,
    Beschreibung und Manifest um und meldet den Wechsel allen, die sich mit `beiSprachwechsel(fn)` gemeldet haben. Wer
    Texte ins Dokument geschrieben hat (Menü, Übersicht, Kopfzeile und «Gelöst», Band der Führung, Untertitel und Bühne
    der Geschichte, Spielfeld), schreibt sie dort mit seinem Zustand neu, auch verborgene; Texte in Daten (Kapitel,
    Prolog, Grade, Welten …) holen Getter erst beim Lesen. Szene, Himmel und Brett bleiben, wie sie sind.
    Werkzeuge lesen und schreiben die Dateien über `tools/texte.mjs` (feste Form);
  - `seite/` die Teile des Spiels, in der Reihenfolge, in der sie laden: `konfiguration.ts` (Fassung, Gerät,
    Schalter der Adresse, Qualität, Masse), `szene.js` (Renderer, Szene, Hauptschleife `sceneLoop`, Ruhe,
    Übersetzen der Programme), `texturen.js`, `himmel/` (`sterne.js` Umgebung und Sternenhimmel, `sonnensystem.js`,
    `skybox.js` Skyboxen aus Blender und `skyTheme`), `brett/brett.js` (Bretter je Himmel, Spiegelung),
    `bildschritte.js` (Licht, Bloom, Pinsel, letzter Schritt), `kamera.js`, `brett/elemente.js` (3D-Modelle der
    Elemente), `brett/feld.js` (`game`: Logik und Darstellung verbunden, Laden, Drehen, Würfel), `brett/strahlen.js`,
    `eingabe.js` (Maus, Finger, Mausrad), `ton.js`, `levelfluss.js` (Lösungsmoment, Übergänge, Fortschritt),
    `oberflaeche/dom.ts`, `fuehrung.js` (Führung im Dorf), `oberflaeche/` (`ui.js` Kopfzeile, Knöpfe, «Gelöst»,
    Startbildschirm; `sprachliste.js` Liste der Sprachen am Schalter im Menü; `menue.js`; `uebersicht.js`),
    `geschichte/` (`daten.js` Kapitel und Texte, `buehne.js` Bühne von Prolog und Epilog, `geschichte.js` Ablauf
    `story`), `aufloesung.js` (Grösse, Uhr, adaptive Auflösung, Spiegelung je Bild),
    `leistung.js` (Messwerkzeug, Leistungsanzeige `?perf`, Bildrate), `schleife.js` (Hauptschleife, Testschnittstelle
    `window.__prisma`/`__prismaDebug`, Seitenstart). Dazu `aufgabe.ts` (eine neue Aufgabe abwarten) und
    `testschnittstelle.ts`.
  Jeder Teil importiert zuerst den vorherigen, `src/main.ts` den letzten: So laufen sie beim Laden in derselben
  Reihenfolge wie früher die Skripte, und beim Laden ruft ein Teil nichts aus einem späteren auf (zur Laufzeit schon;
  zyklische Importe sind darum gewollt). `szene.js` und `kamera.js` warten zuerst auf eine neue Aufgabe (`await` auf
  oberster Ebene), wo bis Ticket 04 ein neues klassisches Skript begann (Seitenstart in Stücken, Ticket 10 der
  Leistung). Neue Abhängigkeiten zwischen den Teilen sind gewöhnliche `import`/`export`. Proben lesen über
  Runtime.evaluate einige Namen der Seite als globale Namen (`game`, `camera`, `draw` …); die zeigt jedes Modul am
  Schluss mit `alsGlobal` (`src/seite/testschnittstelle.ts`) als Eigenschaften von `window`, `draw` und
  `renderReflection` auch zum Ersetzen. Braucht eine Probe einen weiteren Namen, kommt er dort dazu;
  `tests/testschnittstelle.test.mjs` (seit Ticket 05) meldet jeden Namen der obersten Ebene, den eine Probe im Code
  der Seite nennt und `alsGlobal` nicht zeigt.
- **Module und TypeScript (seit den Tickets 03 und 04 des Umbaus):** `npm run typecheck` (`tsc --noEmit` für
  `tsconfig.json` und, mit WebWorker statt DOM, `tsconfig.worker.json`) prüft die Typen; es gehört zu `npm test`.
  Übersetzt (Typen entfernt) wird nur von Vite. Neue und herausgelöste Module dürfen TypeScript sein (`.ts`, import
  mit Endung `.ts`); der übrige Code ist JavaScript (`allowJs`, nicht geprüft: `checkJs` aus) und wird es Stück für
  Stück. TypeScript sind heute `src/main.ts`, die Worker `src/*-worker.ts`, `src/seite/konfiguration.ts`,
  `src/seite/oberflaeche/dom.ts`, `src/seite/aufgabe.ts`, `src/seite/testschnittstelle.ts` und `src/speicher.ts`; was
  die klassischen Skripte global bereitstellen (`THREE`), deklariert `src/globale.d.ts`. Tests und Werkzeuge
  importieren die Spiellogik, den Zufall und den Hall (`tools/solver.mjs` liefert die Logik als `L`;
  `src/package.json`: `"type": "module"`). Diese drei Module und die Leveldaten `src/daten/level.js` haben eine feste
  Form, damit Tests und Werkzeuge sie auch als Text ausführen können (etwa die Leveldaten mit weiteren Leveln,
  `tools/seitenmodule.mjs`): am Anfang (nach Kommentaren) nur `import { … } from './x.js';` (die Logik:
  `./daten/level.js`), am Schluss ein `export { … };` mit allen Namen der obersten Ebene. Tests, die Code der Seite
  als Text lesen, lesen `index.html` und alle Module zusammen (`spielQuelltext`). Die KI-Tester bauen das Spiel für
  Kandidaten mit anderen Leveldaten (`spielServer` mit `daten`, `PRISMA_LEVELDATEN` in `vite.config.mjs`; bis Ticket
  06 eine andere Spiellogik). Node 22.12 lädt TypeScript nicht ohne Weiteres:
  `node --experimental-strip-types` genügt (ohne Abhängigkeit, mit einer Warnung `ExperimentalWarning`), ebenso ein
  Lade-Haken über `module.register`, der für `.ts` das Format `module-typescript` meldet (ohne Schalter; danach
  `await import('…/x.ts')`; so `tools/ts-modul.mjs`, `tsModul('src/spielstand.js')`, seit Ticket 05). Ab Node 22.18
  entfernt Node Typen von selbst.
- **Auf dem Handy (gleiches WLAN):** `npm run build`, dann `npm run preview -- --host`; Vite nennt die Adresse im Netz
  (`Network: http://192.168.…:4173/`), diese im Browser des Handys öffnen. Der Rechner muss Verbindungen auf Port 4173
  zulassen (Windows-Firewall: beim ersten Mal «Zugriff zulassen» für Node). Über http ohne s gibt es dort keinen Service
  Worker (Browser verlangen https ausser auf `localhost`); offline spielbar ist erst die Fassung auf GitHub Pages.
- **Im Netz (GitHub Pages, Ticket 09 des Umbaus):** Die Browser-Fassung steht unter
  **`https://bonomoalessandro.github.io/Prisma/`** (fest, PLAN 4.1: der Fortschritt hängt an der Adresse), die
  Datenschutzerklärung (Deutsch und Englisch, `datenschutz.html`) unter
  `https://bonomoalessandro.github.io/Prisma/datenschutz.html`. Veröffentlicht wird von selbst: Jeder Push auf `main`
  startet den Workflow `.github/workflows/pages.yml` (von Hand auch unter Actions → «Pages» → «Run workflow»): `npm
  ci`, die schnellen Node-Tests ohne Chrome (`node tests/alle.mjs golden logic hall speicher testschnittstelle texte
  vorrat wuerfelliste ki-tester typecheck`; `geschichte`, `beurteilung`, `levelliste`, `generator` rechnen lange und
  laufen wie `leise` (nur unter Windows) nur lokal), `npm run build`, dann `dist/` mit den offiziellen Actions
  (`configure-pages`, `upload-pages-artifact`, `deploy-pages`) auf Pages. Scheitert ein Test oder der Build, bleibt der bisherige Stand online. Die Proben mit
  Chrome und der Bildvergleich laufen nur lokal. Im Repo muss unter Settings → Pages als «Source» «GitHub Actions»
  stehen. Für den Unterpfad `/Prisma/` braucht das Spiel nichts Eigenes: Alle Pfade sind relativ (`base: './'`,
  Manifest mit `scope: "./"` und `start_url: "index.html"`, `sw.js` neben der Seite, also mit dem Bereich `/Prisma/`);
  lokal läuft dieselbe Ausgabe weiter unter `/`. Unter einem Unterpfad lokal prüfen: `npm run build`, dann
  `npm run preview -- --base /Prisma/` (`http://localhost:4173/Prisma/`; in Git Bash mit `MSYS_NO_PATHCONV=1`
  davor, sonst macht die Shell aus `/Prisma/` einen Windows-Pfad), oder `node tests/offline.mjs --unterpfad`. Auf `bonomoalessandro.github.io` teilen
  sich alle Seiten des Kontos einen Ursprung (`localStorage`, Cache Storage); das Spiel nutzt nur Schlüssel `prisma.*`
  und Speicher `prisma-*`, sein Service Worker gilt nur unter `/Prisma/`. Die Source-Maps gehen mit auf Pages
  (Entscheid in Ticket 09).
- **Android-App (Ticket 10 des Umbaus, ADR 0012):** Capacitor 8.6.2 (`@capacitor/core`, `@capacitor/android`,
  `@capacitor/cli`, dazu `@capacitor/app` 8.1.2 für die Zurück-Taste), Paket `ch.bonomo.prisma` (fest), Projekt in
  `android/` (Konfiguration `capacitor.config.json`, `webDir` = `dist`). Mindestens Android 7 (`minSdkVersion` 24 der
  Vorlage), `targetSdk` und `compileSdk` 36 (Google Play verlangt seit 31.08.2026 für neue Apps 36).
  - **Werkzeuge** (ohne Android Studio, Stand 18.11.2026): JDK Temurin 21.0.13 (Zip von Adoptium) unter
    `C:\Users\admin\AppData\Local\Programs\Temurin\jdk-21.0.13+9`, Android SDK unter
    `C:\Users\admin\AppData\Local\Android\Sdk` (offizielle `cmdline-tools` 23 unter `cmdline-tools\latest`, dazu
    `platform-tools`, `platforms/android-36`, `build-tools/35.0.0` und `36.0.0`, `emulator`). Die Umgebungsvariablen
    `JAVA_HOME` und `ANDROID_HOME` des Benutzers zeigen dorthin. Pakete nachinstallieren: `sdkmanager.bat
    platforms/android-37` (Pfade mit `/`, nicht `;`: die Shell trennt sonst daran). Gradle 8.14.3 holt der Wrapper
    `android/gradlew` selbst.
  - **Bauen:** `npm run build:app` (`vite build --mode app`, dann `cap sync android`): dieselbe Ausgabe wie die
    Browser-Fassung nach `dist/`, aber ohne Source-Maps, ohne `sw.js` und ohne Manifeste, dafür `window.PRISMA_APP` im
    Kopf der Seite (kein Service Worker, kein Manifest) und `@capacitor/app` im Spiel; `cap sync` kopiert sie nach
    `android/app/src/main/assets/public/` (nicht im Repo). Dann `cd android && ./gradlew bundleRelease
    assembleRelease` (über `leise.sh` als leichten Lauf, erster Lauf gut 2 min, `./gradlew --stop` beendet den
    Daemon): die signierte `.aab` für den Store in `android/app/build/outputs/bundle/release/app-release.aab`, eine
    signierte, installierbare APK in `android/app/build/outputs/apk/release/app-release.apk`. Prüfen:
    `jarsigner -verify` (JDK) bzw. `apksigner verify --print-certs` (build-tools). Danach `npm run build`, wenn
    `dist/` wieder die Browser-Fassung sein soll.
  - **Version:** `android.versionCode` und `android.versionName` in `package.json` (Gradle liest sie dort). Vor jedem
    Upload `versionCode` um 1 erhöhen; der Store nimmt jede Nummer nur einmal. `appVersion` bleibt die Fassung des
    Spiels (Anzeige der Leistung).
  - **Signieren:** Play App Signing (Google signiert für die Geräte); hier nur der **Upload-Schlüssel**
    `C:\Users\admin\prisma-schluessel\prisma-upload.jks` (Alias `prisma-upload`), ausserhalb des Repos. Gradle liest
    `keystore.properties` daneben (Pfad sonst in `PRISMA_SCHLUESSEL`); fehlt sie, bleibt die Release-Fassung
    unsigniert. Das Passwort steht nur in den Dateien in diesem Ordner, nie im Repo; `.gitignore` schliesst Keystores,
    `keystore.properties`, `.aab` und `.apk` aus. Ordner sichern: ohne Schlüssel muss Google den Upload-Schlüssel
    zurücksetzen.
  - **In der App:** kein Service Worker (das Spiel liegt in der App), Spielstand im `localStorage` der WebView (bleibt
    über Neustart und Update; geht mit dem Deinstallieren). Vollbild (Leisten aus, Wischen holt sie kurz zurück;
    `MainActivity.java`), Hoch- und Querformat, Abstände zu Kamera-Loch und Rand über `env(safe-area-inset-*)`
    (SystemBars `insetsHandling: native`). Zurück-Taste wie Esc (`zurueckTaste` in
    `src/seite/geschichte/geschichte.js`): Level → Menü, Menü aus einem Level → zurück, Übersicht und Rückfrage zu,
    Prolog überspringen; auf dem Startbildschirm und im Menü ohne Level dahinter schliesst die App. Ton ruht im
    Hintergrund (`visibilitychange`). Der Link «Datenschutz» im Menü öffnet in der App die Seite auf GitHub Pages im
    Browser des Handys, in der Browser-Fassung die Seite daneben.
  - **Icons:** `node tools/app-icons.mjs` macht aus `icons/` das adaptive Icon und die Icons für Android 7
    (`android/app/src/main/res/mipmap-*`) und `store/icon-512.png`. Startbild: das Icon auf dem Grund des Spiels.
  - **Store:** alles für den Eintrag im Play Store in `store/` (Übersicht `store/index.html`: Texte, Bilder, Antworten
    für Inhaltseinstufung und Datensicherheit). Bilder: `tests/bildvergleich.mjs --gpu --store <ordner>` (gelöste
    Level dort mit einer Zeit wie beim Spielen statt 0:00), Feature-Grafik `tools/store-grafik.mjs` (JPEG: Google Play
    nimmt sie nicht mit Alphakanal), das Symbol als PNG mit 32 Bit.
  - **Emulator:** geht auf diesem Rechner nicht (kein Hypervisor: Hyper-V/WHPX aus, AEHD nicht installiert, beides
    braucht Adminrechte). Geprüft wird ohne Android mit `node tests/app.test.mjs` (Build und Projekt) und
    `tests/app-probe.mjs` (Build der App im Browser: kein Service Worker, Link, Zurück-Taste), auf dem Handy vom
    Nutzer (Prüfliste in `.scratch/umbau/issues/10-android-capacitor.md`).
- **Version:** `appVersion` in `package.json` ist die einzige Quelle; Dev-Server und Build setzen sie in `index.html`
  und `sw.js` ein (Platzhalter `__APP_VERSION__`). Mit jedem Stand für einen Handy-Durchlauf nachführen.
- **Offline:** Über http(s) ausgeliefert, speichert der Service Worker `sw.js` alle Dateien; danach läuft das Spiel
  auch ohne Verbindung. Die Listen `FILES` und `LAZY` entstehen beim Build aus `dist/` (nichts mehr von Hand
  eintragen): alles nach `FILES`, ausser `sw.js` und den Lizenztexten; Teile der Skyboxen ohne `precache` nach `LAZY`
  (gespeichert beim ersten Gebrauch). Ein Test prüft die Listen am Build. Registriert wird er erst, wenn `load` da
  ist **und** `src/main.ts` die Teile geladen hat und die Enthüllung vorbei ist (`introCalm`, ohne Intro sofort;
  Ereignis `prisma-ruhig`, Ticket 09 des Umbaus): So läuft sein Vorab-Speichern (gut 13 MB) nicht neben dem
  Seitenstart und der Enthüllung her. Die Datenschutzerklärung
  `datenschutz.html` kommt unverändert nach `dist/` und in den Speicher.
  Der Dev-Server registriert keinen Service Worker (`PRISMA_DEV`); einen alten, noch registrierten derselben Adresse
  meldet er ab. Wer `dist/` mit `npm run preview` auf `localhost` öffnet, hat danach dort einen Service Worker (er
  liefert das Spiel auch bei gestopptem Server): In den DevTools unter Application → Service Workers „Unregister“ oder
  „Bypass for network“.
- **Über file://:** Ein Doppelklick auf `index.html` geht nicht mehr: Das Spiel sind ES-Module (seit Ticket 04 des
  Umbaus; seit Ticket 03 stand in der Quelle statt der Spiellogik eine Marke). Proben und Tests laufen über http gegen
  `dist/`.
- **Spezifikation:** siehe [SPEC.md](SPEC.md).
- **Würfel-Level (3D-Prototyp):** Vorgehen, Modell und offene Punkte in [3D-WUERFEL.md](3D-WUERFEL.md).
- **Plan und offene Punkte:** siehe [PLAN.md](PLAN.md) – was noch umgesetzt werden soll, Entscheidungen, Erledigtes.
- **Icon:** `favicon.svg` (Prisma mit Farbfächer), PNG-Varianten in `icons/` (iOS 180 px, Android 192/512 px),
  dazu `icon-maskable-*.png` für Android, das Icons selbst rund oder eckig zuschneidet (`node tools/icons.mjs` erzeugt
  sie aus `favicon.svg`: ohne Ecke, Inhalt verkleinert in die Schutzzone).
- **Name und Manifest:** Im Store und beim Installieren heisst das Spiel „Prisma – Licht-Puzzle“, auf dem
  Startbildschirm „Prisma“. `manifest.webmanifest` (feste `id` „prisma“, nicht mehr ändern) wird nur über http(s)
  eingebunden, über file:// blockiert es der Browser.
- **Tests:**
  - `npm test` (`tests/alle.mjs`) lässt alle Node-Tests ohne Browser nacheinander laufen, jeden bis zum Ende, mit einer
    Übersicht am Schluss (mehrere Minuten, nur über `leise.sh`: `LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh
    timeout -k 30 3600 npm test`); `node tests/alle.mjs logic golden` nur diese. `npm run test:bild` ist der
    Bildvergleich (Ticket 01 des Umbaus).
  - **Art der Läufe unter `leise.sh`** (Ticket 13 des Umbaus; siehe `leise.sh` unter Werkzeuge). Leichte Läufe messen
    keine Zeiten und laufen bis zu vier gleichzeitig: `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh
    tools/leise.sh …`. Alleinige (Vorgabe, ohne `LEISE_ART`) laufen nie neben einem anderen Lauf.

    | Art | Läufe |
    |---|---|
    | leicht | `npm test` und jeder Node-Test einzeln (`golden`, `logic`, `geschichte`, `generator` …), `bildvergleich.mjs`, `offline.mjs`, `screenshot.mjs`, `spiegel-probe.mjs bilder`, `buehne-messung.mjs bilder`, `sprachwechsel-probe.mjs`, Werkzeuge (`generiere.mjs`, `ordne-level.mjs`, `geschichte.mjs`, KI-Tester `prepare.mjs` und `shots.mjs` …) |
    | allein | `leerlauf-probe.mjs`, `ruhetakt-probe.mjs`, `start-probe.mjs`, `buehne-messung.mjs` (messen), `spiegel-probe.mjs` (`pruefe`, `messen`), `geschichte-probe.mjs` (misst in jedem Ablauf die Lücken im Bildtakt), `brett-probe.mjs` (scheitert an Lücken über 100 ms auf der Grafikkarte, `mechanik` und `reise`), `tools/bench.mjs`, alles mit `--fenster` |

    **Regeln für die Agenten** (Nutzer, 16. und 17.11.2026): Umsetzer lassen nur die schnellen Prüfungen laufen, als
    leichte Läufe: Node-Tests (`npm test` oder die betroffenen), Golden, den Bildvergleich **auf der Grafikkarte**
    (`--gpu`, etwa 8 min), dazu die Proben, die ihr Ticket direkt betrifft. Der Reviewer lässt den ganzen Satz einmal
    laufen, den Bildvergleich in **SwiftShader** (ohne `--gpu`, die genaue Prüfung, etwa 35 min); die Proben mit
    Zeitmessung (alleinige) nur er. Wackelt ein paralleler Lauf (Zeitüberschreitung, Flake), ihn als alleinigen
    wiederholen (ohne `LEISE_ART`, beim Bildvergleich dazu `--jobs 1`), bevor man einen Fehler meldet. Nach einem
    Treiberupdate der Grafikkarte (oder einer neuen Fassung von Chrome) kann der GPU-Weg überall rot werden: dann zuerst
    den Bildvergleich in SwiftShader laufen lassen, und erst wenn er grün ist, die GPU-Referenzen mit `--gpu --write`
    neu schreiben.
    **Proben mit Bildtakt** (`geschichte-probe`, `brett-probe`, `leerlauf-probe`, `ruhetakt-probe`, `start-probe`):
    Eine einzelne Lücke über 100 ms kommt auf diesem Rechner schon auf der Basis vor (Review Ticket 01 des Umbaus:
    `geschichte-probe --dorf` in 2 von 3 Läufen auf dem alten Stand). Scheitert eine solche Probe an einer Lücke, sie
    wiederholen bzw. gleich oft auf der Basis laufen lassen (Stand vor dem Ticket, etwa in einem `git worktree`); es
    zählt nur ein Fehler, der auf der Basis nicht kommt.
  - **Proben im Browser** öffnen das Spiel über http aus `dist/` (seit Ticket 02 des Umbaus, nicht mehr über file://).
    Die Adresse steht an einer Stelle, `tools/spielserver.mjs`: `spielServer()` baut das Spiel frisch (seit Ticket 13
    je Prozess in einen eigenen Ordner im Temp-Verzeichnis, nicht nach `dist/`, damit gleichzeitige leichte Läufe
    einander den Build nicht wegräumen; danach gelöscht) und liefert es über einen kleinen Server auf `127.0.0.1`
    (freier Port), mit einem leeren Service Worker statt `sw.js` (wie früher über file:// ohne Vorab-Speichern) und
    einer leeren Antwort auf `/favicon.ico` (Chrome fragt danach; eine 404 stünde als Fehler in der Konsole).
    `tools/chrome.mjs` lässt Chrome seinen Port selbst wählen (`--remote-debugging-port=0`), damit viele gleichzeitige
    Chrome nie zusammenstossen, und meldet Deutsch als Sprache des Geräts (`--lang=de`, Option `sprache`; seit Ticket
    07 des Umbaus wählt das Spiel danach seine Sprache, Headless-Chrome meldete sonst die des Rechners). Der
    Bildvergleich prüft, dass er das deutsche Spiel sieht (`navigator.language`, `lang` des Dokuments).
    `PRISMA_OHNE_BAU=1` nimmt das vorhandene `dist/`, `PRISMA_SPIEL=<url>` eine laufende Adresse (etwa den Dev-Server). `--seite`/`--vorher` der Messproben liefern eine Kopie einer früheren
    `index.html` ungebaut aus ihrem Ordner (eine Fassung ab Ticket 03 braucht den Build). Bei `npm test` prüft
    `tests/typecheck.mjs` auch die Typen (`npm run typecheck`). Spiellogik und Hall
    importieren die Tests als Module aus `src/`; die Level und die Reise stehen seit Ticket 06 in den Leveldaten
    `src/daten/level.js` (bis dahin als markierte Bereiche `LEVELS`, `WUERFEL` und `GESCHICHTE` in `src/logik.js`), und
    dorthin schreiben die Werkzeuge (`ordne-level.mjs`, `ordne-wuerfel.mjs`, `geschichte.mjs`, `vorrat.mjs`).
  - `node tests/logic.test.mjs` prüft die Strahllogik, im Block „Würfel (dim: 3)“ auch die Würfel-Level. Was er aus der
    Seite liest, liest er aus `index.html` und allen Modulen (`spielQuelltext`). Im Block „Module“ prüft er das Gerüst
    `index.html` (nur ein Modul, keine grossen Skripte), die Reihenfolge der Teile unter `src/seite/` und die Form von
    Logik, Zufall und Hall (der `export`-Block nennt alle Namen der obersten Ebene). Im Block „Offline“ baut er das
    Spiel einmal in einen eigenen Ordner und prüft den Build (Listen von `sw.js`, statische Dateien Byte für Byte,
    `index.html` bis auf `vite-ignore`, Stil und Spiel unter `assets/` gleich wie die Quelle, der Stil enthält genau
    die Teile aus `src/stil/`, das Spiel ist verkleinert (auch Namen), mit Version, den drei Workern als eigene
    Dateien (kein Worker aus einem Blob) und Source-Map auf die Module, der gebaute Worker des Halls rechnet
    bitgleich) und den Dev-Server (Version, Module einzeln, Worker übersetzt, kein Service Worker, `vendor/` und
    `backgrounds/` roh); braucht `npm install`.
  - `node tests/golden.mjs` vergleicht die Strahlbilder aller flachen Level (Start- und Lösungsstellung) mit
    `tests/golden.json`, dazu den Löser für eine Stichprobe aus Spiel und Vorrat: das Tutorial, je Grad der Geschichte
    jedes 10. Level (das erste jeder Welt), jedes 10. flache Level des Vorrats und jedes 10. Würfel-Level (seit Ticket
    08 von Noas Geschichte nicht mehr nach dem Platz in der Reihe): das Verhalten exakt, Kommazahlen auf 1e-9 genau
    (etwa 2 s). Die Referenz hält die Löserdaten aller Level fest, die Stichprobe passt also auch nach einem Umordnen.
    Verglichen wird je Level nach Namen, gleich auf welchem Platz es steht; er meldet, wie viele Level an einem anderen
    Platz stehen als in der Referenz. `--voll` vergleicht den Löser für alle 159 Level (etwa 25 s), vor und nach
    Änderungen am Löser. `--schnell` vergleicht nur die Strahlbilder, ohne Löser (etwa 1 s), für Zwischenschritte eines
    Umbaus. Nach mehreren Schritten, am Schluss und immer, wenn der Löser berührt ist, läuft er ohne `--schnell`.
    `--write` schreibt die Referenz neu, aber nur bei einer bewussten Änderung des Verhaltens oder wenn Level dazukommen
    oder wegfallen; ein Umbau der Strahlregel oder des Lösers muss gegen die bestehende Referenz grün bleiben. Bis
    Ticket 21 hielt die Referenz für 24 Level auch die alte Wertung (`score`) fest, und diese Einträge bildeten die
    Stichprobe.
  - `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 5400 node
    tests/bildvergleich.mjs [--gpu] [--write] [--groesse desktop,handy,quer,poco]
    [--nur start,dorf,welt-1-2,welt-3-4,welt-5-6] [--sprache de,en] [--jobs n]` ist der Bildvergleich des Umbaus (`.scratch/umbau/`, Ticket 01; etwa 35 min allein: gemessen 27–33 min
    für die drei ersten Grössen unter `leise.sh` mit 100 %, davon Desktop 16–20 min, Handy hochkant und quer je 5–7 min,
    dazu «poco» gut 6 min; neben anderen leichten Läufen entsprechend länger; mit `--groesse` und `--nur` kürzer). Er
    nimmt eine feste Liste von Ansichten in Headless-Chrome auf und vergleicht sie mit den Referenzbildern in
    `tests/bildvergleich/referenz/` (77 JPEG, 8,5 MB). `--jobs n` lässt die Abläufe je Grösse in n eigenen Prozessen
    laufen (Ticket 13); auf diesem Rechner bringt das nichts, denn SwiftShader rechnet schon in einem Chrome auf allen
    Kernen (nacheinander 27 min, mit 2 Prozessen 29 min, mit 4 Prozessen 29 min, mit 6 Zeitüberschreitungen), Vorgabe
    darum 1. **`--gpu`** (oder `GPU=1`; Entscheid des Nutzers 17.11.2026, Ticket 13) zeichnet auf der Grafikkarte statt
    in SwiftShader: alle 77 Bilder in knapp 8 min, mit eigenen Referenzen in `tests/bildvergleich/referenz-gpu/`, eigener
    Toleranz (`TOLERANZ_GPU`, 0,03 % statt 0,01 %; zwischen GPU-Läufen weichen nur Sternpunkte im Bild der Planeten um
    bis 6 ab) und Ausgabe nach `tests/output/bildvergleich-gpu/`. Headless nimmt Chrome sonst die eingebaute Intel UHD
    630; der Bildvergleich startet es mit `--force_high_performance_gpu` (`tools/chrome.mjs`, Option `hochleistung`)
    und bricht ab, wenn `WEBGL_debug_renderer_info` nicht die NVIDIA meldet (andere Karte: `PRISMA_GPU=<Muster>`).
    Höchstens zwei GPU-Bildvergleiche zeichnen gleichzeitig (Plätze `prisma-bildvergleich-gpu-<n>` im Temp-Verzeichnis),
    ein dritter wartet. Der GPU-Weg ist der schnelle für Umsetzer; die genaue Prüfung bleibt SwiftShader (Regeln oben).
    Ansichten: Startbildschirm, Menü mit den vier Graden, Übersicht, jede Welt der Geschichte mit ihrem
    Himmel je in einem Level vor und nach dem Lösen, die vier Übungen im Dorf mit Band, Lichtkegel und Hand, Prolog,
    Reise (Bergwald → Meer) und Epilog; jedes Element steht mindestens einmal im Bild. Seit Ticket 08 alles auch auf
    Englisch (Chrome mit `--lang=en-US`): Bilder `en-<grösse>-<ansicht>.jpg` mit eigenen Referenzen in beiden
    Ordnern, die deutschen bleiben, wie sie sind; ohne `--sprache` beide Sprachen (doppelte Laufzeit),
    `--sprache de` bzw. `--sprache en` nur eine. Je in drei Grössen: Desktop
    1280 × 800, Handy hochkant 390 × 844 und Handy quer 844 × 390 (Pixeldichte 1); dazu «poco» wie das Poco F4 GT
    (393 × 873, Pixeldichte 2,75, Android-Kennung, nur `start`, `dorf` und `welt-1-2`): Nur so laufen der Massstab der
    Seite (`SEITE`) und das Pixelverhältnis 2 des Renderers wie auf den echten Handys (der Lauf prüft beides; Fund
    Review Ticket 01, Referenzen seit Ticket 13). Gleiche Bilder bei jedem Lauf:
    `?t=12` (Zeit steht, Zufall fest, dazu `phasenZufall`), `?noadapt`, SwiftShader; was bei stehender Zeit nie fertig
    oder still würde (Strahlen, Feier, CSS-Animationen, Uhr der Bühne, Hand im Dorf, Glühwürmchen der Reise), hält die
    Prüfung nur in der Seite fest. Die Bühne von Prolog und Epilog friert sie erst ein, wenn ihre Bewegungen fertig und
    ihre Texturen ganz gerastert sind (sonst unter Last rot, Ticket 13). Aufgenommen wird eine Ansicht, wenn zwei
    Aufnahmen gleich sind; nur bei «poco» gilt sie nach 7 Aufnahmen auch als ruhig, wenn die letzten zwei innerhalb der
    Toleranz liegen (ein Fleck im Lichtstreifen des Titels wechselt dort von Bild zu Bild). Diese Fälle meldet der Lauf
    («fast ruhig») und zählt sie in der Übersicht am Schluss (Ticket 14). Verglichen wird JPEG mit JPEG je Pixel: rot, wenn mehr als 0,01 % der Pixel in einem
    Farbkanal um mehr als 3 abweichen (`TOLERANZ`; ausgenommen nur ein Rechteck im Wasser von Handy quer, Meer 1, das
    das Spiel nicht in jedem Lauf gleich zeichnet, `AUSNAHMEN`); bei Rot liegen Bild, Referenz und Differenzbild unter
    `tests/output/bildvergleich/`. Ab Ticket 02 muss er nach jedem Schritt des Umbaus grün sein. `--write` schreibt die
    Referenzen neu, aber nur bei einer bewussten Änderung des Aussehens (im Umbau nie; auch nach einer neuen Fassung von
    Chrome, wenn der Vergleich davon rot wird, und dann begründet). `--diag` gibt
    je Bild den Zustand aus (Kamera, Uhren, Ziele), wenn zwei Läufe voneinander abweichen. Das Spiel kommt seit den Tickets
    03 und 13 des Umbaus aus `dist/` über http (`tools/spielserver.mjs`, wie die Proben); die Referenzen stammen noch aus der
    `index.html` über file:// und gelten unverändert (erster Lauf gegen `dist/`: alle 66 Bilder grün, grösste
    Abweichung 3).
  - `node tests/hall.test.mjs` prüft die Impulsantwort des Halls (`hallImpulse` im Modul `src/hall.js`; Ticket 05 von
    `.scratch/leistung/`): Für 44,1, 48 und 96 kHz ist sie bitgleich mit der alten Berechnung beim ersten Klick
    (Prüfsumme und Stichproben aus dem Stand `963177d`; das Rauschen kommt aus `mulberry32` mit festem Samen),
    unabhängig von der Stückgrösse, auch als Text ausgeführt, und die Seite importiert das Modul (unter 1 s).
  - `node tests/speicher.test.mjs` prüft die Speicherschicht (Ticket 05 des Umbaus; wenige Sekunden): Kein Teil des
    Spiels ausser `src/speicher.ts` nennt `localStorage` oder `sessionStorage` (`index.html`, `sw.js`, alle Module,
    auch Kommentare; mit Gegenprobe); die Umsetzung für `localStorage` legt jeden Text unverändert unter seinem
    Schlüssel ab; ein Spielstand von heute (Fortschritt in drei Graden samt Dorf, Bestwerte, zuletzt gespielt, Ton aus,
    alte und fremde Schlüssel) wird ohne Umrechnung gelesen und, unverändert gespeichert, Byte für Byte gleich
    geschrieben; scheitert der Speicher (gesperrt, voll, gar keiner), wirft nichts, und das Spiel beginnt von vorn.
    Module in TypeScript lädt er wie `levelliste.test.mjs` über `tools/ts-modul.mjs` (`tsModul`, ein Lade-Haken für
    `.ts`, nötig bis Node 22.18).
  - `node tests/testschnittstelle.test.mjs` prüft die Testschnittstelle (Ticket 05 des Umbaus, aus Review 04; etwa
    2 s): Jeder Name der obersten Ebene eines Moduls unter `src/`, den eine Probe im Code der Seite nennt, steht in
    einer Liste `alsGlobal`. Proben sind `tests/*.js` (ganz Code der Seite) und jede Datei unter `tests/` und `tools/`,
    die Chrome steuert; dort gilt jeder String und jedes Template als Code der Seite. Mit dem Parser von TypeScript
    gezählt werden freie Namen (nicht als Eigenschaft, nicht im Code selbst deklariert, dazu `window.name`);
    Wortlisten und einzelne Wörter sind Daten, ausser `ev('…')` wertet sie aus. Mit Gegenproben; der Stand vor
    Review 04 fällt mit allen sechs fehlenden Namen auf.
  - `node tests/texte.test.mjs` prüft die Übersetzungsschicht (Ticket 07 des Umbaus; etwa 3 s): Jede Sprachdatei hat
    genau die Schlüssel von `de.json` (je Blatt dieselbe Art, Text oder Text je Gerät), jeder Platzhalter des
    deutschen Texts steht auch in der Übersetzung; jeder Schlüssel, den der Code nennt (auch Muster wie
    `` `welt.${id}` ``, `data-t` in `index.html`, die Schritte der Übungen, `NEBENBEI`), steht in `de.json`, und jeder
    dort wird genannt; die Titel sind genau die Level im Spiel. Die Regeln der Führung je Sprache und Gerät (bis
    Ticket 07 in `logic.test.mjs`): ein Schritt 3–18 Wörter, höchstens 105 Zeichen, ein oder zwei Sätze, ein Hinweis
    nebenbei höchstens 16 Wörter. Kein deutscher Text im Code der Oberfläche (`index.html`, `src/main.ts`,
    `src/seite/`, `src/texte/sprache.js`) ausser über `t()`: ein String mit Umlaut, einem grossgeschriebenen Wort der
    deutschen Texte oder zwei Wörtern daraus hintereinander, in HTML Text und gelesene Attribute; ohne Kommentare,
    Shader, Konsole, Fehler und Protokoll der Arbeit, mit einer Liste bewusster Ausnahmen (`AUSNAHMEN`, je mit Grund).
    Seit Ticket 08 zählen dafür die Wörter aller Sprachen (auch englischer Text fällt auf), `en.json` hat keine
    deutschen Reste, Geschichte und Führung sind je Sprache ohne Gedankenstrich und Doppelpunkt (PLAN 1a.2), und jede
    Sprache ausser Deutsch hat ihr Manifest `manifest-<kürzel>.webmanifest` (gleich bis auf Name, Beschreibung,
    `lang`).
    Dazu der Kern (Rückfall auf Deutsch, Platzhalter, Wahl der Sprache) und seit Ticket 01 von `.scratch/sprachwahl/`
    der Wechsel ohne Neuladen (`sprachSchicht`: Übersetzer und Titel folgen der neuen Sprache, die Abonnenten hören
    davon in ihrer Reihenfolge, auch wenn einer wirft; gleiche oder unbekannte Sprache tut nichts).
  - `node tests/beurteilung.test.mjs` prüft die Beurteilung (unter `leise.sh` etwa 40 s, auf einem Thread 90–130 s je
    nach Last): den Einstieg, die Feldform und je Regel eine Datei in `tests/beurteilung/` (einzeln aufrufbar, eine neue
    Datei läuft ohne Eintrag mit). Jede Regel wird an kleinen, von Hand gebauten Leveln geprüft und an den 150 heutigen
    Leveln mit den Zahlen der Neuzählung aus der Spec. `helfer.mjs` baut die Mini-Level (Elemente in Lösungsstellung)
    und beurteilt einmal je Lauf die 150 in der heutigen Reihenfolge (die feste Namensliste aus Ticket 15, Massstab
    der Eichung; `platz` ist der heutige Platz), mit dem Grad aus den Leveldaten, ohne und mit den teuren
    Regeln (`heutigeLevel({ teuer: true })`), und die 42 Kandidaten der Eichmenge des Spielwerts
    (`eichmengeBeurteilt()`). Das ist der grösste Teil der Arbeit, auf einem Thread rund 3 s, 32 s und 45 s. Der
    Einstieg beurteilt es darum vorab in einem Durchgang auf vier Threads (`await vorausBeurteilen()`, mit
    `tools/beurteilung/parallel.mjs`); die Testfälle bleiben synchron und finden es im Cache. `BEURTEILUNG_THREADS=1`
    rechnet ohne Worker, mit denselben Ergebnissen. Eine teure Datei allein beurteilt ihre Teile ebenso vorab (etwa
    `await vorausBeurteilen(['teuer'])`, über den Einstieg ohne Wirkung), die übrigen auf einem Thread. Scheitert der
    Vorab-Durchgang, ist das ein roter Testfall. Danach laufen die Testdateien auf einem Thread (rund 11 s, vor allem
    Probieren, Schwierigkeit und Schliessen an ihren Testleveln).
  - `node tests/levelliste.test.mjs` prüft die Levelliste (Spec, Nahtstelle 3; unter `leise.sh` etwa 25 s): Jedes Level
    nach dem Tutorial hat einen Grad, der nie sinkt und den Schwellen folgt; die Anzeige bildet die Grade auf 1–4
    Punkte und Text ab (die Seiten der Levelauswahl gibt es seit Ticket 04 nicht mehr); die Reihenfolge ist die der
    Formel, und jede Abweichung davon ist im Protokoll der KI-Tester oder durch die Häufungsregel begründet (Ticket 16,
    dazu beide Regeln an erfundenen Fällen); kein von den KI-Testern korrigiertes Level steht mehr als 5 Plätze von seinem
    Platz davor, weder nach den Korrekturen noch am Ende (Ticket 24, mit Gegenproben an erfundenen Korrekturen, die
    einander schieben); die Prüfliste stimmt und ist erledigt, jedes Level darauf hat ein zählendes
    Urteil, und sein Entscheid bleibt fest, auch wenn ein Austausch die Formel verschiebt (Ticket 26, mit Gegenproben an
    erfundenen Verschiebungen); das Mittel der Schwierigkeit je 10 Level fällt um höchstens 1 Punkt; dieselbe
    Haupt-Kernidee höchstens zweimal je 10 Level, ohne die Duldungsliste; Ausschluss, fehlende Kernidee, zu tiefer
    Spielwert und Ablehnung durch beide KI-Tester nur bei Leveln auf der Duldungsliste, die nur kürzer wird (einmal, in
    Ticket 16, wuchs die ursprüngliche Liste um begründete Ergänzungen); nach dem Austausch eines Grads stehen aus ihm
    nur noch Level der Gruppe „behalten nach Urteil der KI-Tester“ darauf, die nie wächst und deren Level die Regel
    `stark` im Protokoll erfüllen (Tickets 24 und 25, mit Gegenproben an erfundenen Urteilen; seit Ticket 25 nennt die
    Liste genau diese Level, 27 in „mittel“ und 4 in „schwer“); eindeutige Namen, keiner aus der
    Liste entfernter Namen; jeder Name der heutigen Reihenfolge steht im Spiel oder auf dieser Liste (umbenannt wird
    nichts), 150 Level nach dem Tutorial und dazu die des Ausbaus; kein Filter gibt in der Lösung eine fremde Farbe ab (etwa Cyan durch einen
    Gelbfilter als Grün, mit Gegenprobe); genau eine Lösung; der Speicherstand von Noas Geschichte je Grad unter
    `prisma.noa.*` (gelöste Level nach Namen, unlesbar oder fremd von vorn, weitere Felder bleiben, die alten Schlüssel
    liest das Spiel nicht mehr; Ticket 04, statt des alten Fortschritts), dazu die Bestwerte je Level unter
    `prisma.noa.<grad>.bestwerte` (Bestzeit und wenigste Drehungen je für sich, gemeldet nur eine Verbesserung eines
    vorhandenen Werts, Kaputtes fällt weg, «Von vorn» lässt sie stehen; Ticket 06). Zum Austausch (Tickets
    23–26): Jedes neue Level steht nach der Formel und hat ein zählendes Urteil der KI-Tester (Lauf `ersatz-…`), das es
    nicht ablehnt; jedes entfernte Level hat seinen Namen auf der Liste und seine Leveldaten in der festen Kopie für die
    Eichung; die Regel für neue Level an einem erfundenen Fall; `levelCode` ergibt jedes Level wieder, der Abdruck hängt
    nur an den Leveldaten. Zum Ausbau auf 500 Level: Die Level des Ausbaus stehen in `levelliste.json`, jedes mit
    zählendem Urteil (Lauf `ausbau-…`), Herkunft im Kommentar und Grad nach der Schwelle, keines einem anderen Level zu
    ähnlich; `fuegeEin` und die ganze Regel mit einem Level des Ausbaus an erfundenen Fällen; die Plätze der Regeln für
    den Bestand zählen unter dem Bestand. Er ersetzt die früheren Tests zu Markierung, gehärteten Leveln, Härte-Abnahme und
    Auswahlliste in `tests/logic.test.mjs`, seit Ticket 21 auch die der Namen (`NAMES` in `profiles.mjs`) und der
    fremden Filterfarbe (`oddFilters` in `quality.mjs`). Seit Noas Geschichte prüft er die Reihe aus Spiel und Vorrat,
    nicht den Ablauf des Spiels (ADR 0005); mit Ticket 08 sind der Test des Bedarfs je Gruppe (`ausbau.mjs bedarf`) und
    der Austausch (`ordne-level.mjs --austausch`) weggefallen, die Level von damals prüft er weiter.
  - `node tests/wuerfelliste.test.mjs` prüft die Würfel-Level (`.scratch/wuerfel-500/`; über `leise.sh`): Reihenfolge
    und Grade wie `tools/ordne-wuerfel.mjs` sie rechnet, keine Regel verletzt (im Würfel gibt es keine Duldungsliste),
    genau eine Lösung, keinem anderen Würfel-Level zu ähnlich, Namen eindeutig über flache und Würfel-Level, je Level
    ein Urteil der KI-Tester (`wuerfel-…`) und die Herkunft im Kommentar, kein Hinweis; dazu die Bausteine an
    erfundenen Fällen (Verteilung der Grade nach der Tabelle der Spec, Korrektur der KI-Tester, Ähnlichkeit über die 48
    Symmetrien des Würfels, Leveldaten als Text).
  - `node tests/generator.test.mjs` prüft den Generator (Spec, Nahtstelle 4; nur über `leise.sh`, denn der Generator
    prüft den Deckel; etwa 1 min): feste Seeds für „leicht“ ohne Kernidee und mit jeder der sechs Kernideen (je 50,
    dazu je Kernidee ein fester Seed, der ein Level mit ihr liefert), für „leicht“ mit den Ziel-Schwierigkeiten 33–43
    und 20–30 und für die Grade ab „mittel“ ohne Kernidee und mit Mischziel aus zwei Quellen (12–30 Seeds); ab
    „mittel“ hat jedes Level eine nötige Kernidee, mit Ziel-Schwierigkeit liegt es darin. Ab „mittel“ gibt es je Grad
    und Kernidee einen Auftrag mit einem festen Seed, der ein Level mit ihr als Haupt-Kernidee liefert (Ticket 28; in
    „sehr schwer“ ausser dem Lockvogel). Jedes Level hat so viele Quellen, wie die Vorgabe seines Grads verlangt;
    „mittel“ mit Falle, Seed 278 verwirft er mit „zu wenige Quellen“, der feste Seed desselben Auftrags liefert mit
    genau zwei, „leicht“ weiter auch mit einer (Ticket 29). Auf dem Würfel-Branch (Ticket 22) laufen dazu fünf
    Aufträge im Würfel 4 × 4 × 4 („leicht“ ohne Kernidee, mit Mischziel, Abschalten und Sammelstelle, „mittel“ mit
    Mischziel) durch alle Prüfungen, und die Würfel-Level nutzen den Raum (Licht zwischen den Ebenen, drehbare
    Elemente mit waagrechter Drehachse).
    Derselbe Auftrag ergibt dasselbe Level, auch nach anderen Aufträgen; jedes gelieferte Level hat genau eine Lösung,
    besteht die Beurteilung (neu beurteilt und gleich der mitgegebenen), hat den verlangten Grad und die verlangte
    Kernidee nötig, Leveldaten wie in LEVELS und eine Startstellung mit genug Klicks. Kein Filter, dessen Strahl schon
    seine Farbe hat, kein fester Spiegel und kein Blocker, der weder für die Lösung zählt noch als Lockvogel wirkt;
    eine Gegenprobe an einem handgebauten Level zeigt, dass die Prüfung solche Elemente findet. Dazu: Der Quelltext
    des Generators kennt keine Koordinaten und Richtungen, mit `LEISE_CPU` über 50 bricht er ab (mit
    `LEISE_MAX_CPU=65` erst über 65), und unbekannte Aufträge weist er ab.
  - `node tests/ki-tester.test.mjs [protokoll]` prüft den Ablauf der KI-Tester: Schema der Antworten, Zusammenführen
    (Ablehnen nur gemeinsam, Korrektur höchstens 5 Plätze und nie über eine Gradgrenze, Anker), Referenz und Grade in
    der Reihenfolge im Spiel, Feld als Text, Auftrag und Fingerabdruck der Eingaben und das versionierte Protokoll
    `tools/ki-tester/protocol.jsonl` (jeder Eintrag nach der Referenz seiner Version), dazu Gegenproben mit
    verfälschten Kopien, die mit der erwarteten Meldung rot werden. Mit dem Pfad einer eigenen verfälschten Kopie wird
    er rot. Dazu Kandidaten ohne Platz im Spiel: die Seite mit den Kandidaten für die Bilder und `prepare.mjs
    --kandidaten` (Name, Referenz, Feld als Text, Abweisung bei falschem Grad; ohne Bilder).
  - `node tests/vorrat.test.mjs` prüft den Vorrat und den gemeinsamen Lader (`.scratch/noa-geschichte/`, Ticket 02;
    wenige Sekunden, auf Kopien der Texte im Speicher): Ablegen und Zurückholen sind verlustfrei (`src/daten/level.js` und
    Vorrat byte-gleich, auch in Teilen, in anderer Gruppierung und Reihenfolge, über mehrere Schritte, für alle Level
    und mit CRLF), die Folge nach dem Zurückholen, das Format (Block wie im Spiel, Platz, Titel), Auswahl und Fehler;
    dazu der Lader auf dem Stand der Dateien (jedes Level genau einmal, wie nach dem Zurückholen aller) und seit dem
    Umbau zu Noas Geschichte (Ticket 04): Jedes Level von vorher steht im Spiel oder im Vorrat, mit unveränderten
    Leveldaten (`tests/vor-dem-umbau.json`: je Name ein Abdruck, aus `index.html` im Stand `fc22df1`), dazu nur die 15
    neuen sehr schweren aus Ticket 04 und die 23 Kandidaten mit Schlüssel aus Ticket 09, alle Würfel-Level im Vorrat;
    mit Gegenproben. Seit Ticket 08 dazu `inGanzerFolge` (wie `ordne-level.mjs` und `ordne-wuerfel.mjs` in Spiel und
    Vorrat schreiben): ohne Änderung byte-gleich, neu geordnet die ganze Folge wie geordnet, ein neues Level an seinem
    Platz im Vorrat (ohne Level seiner Art im Vorrat im Spiel).
  - `node tests/geschichte.test.mjs` prüft die Wahl der 240 Level für Noas Geschichte (`.scratch/noa-geschichte/`,
    Ticket 03; nur über `leise.sh`, etwa 5 min: Beurteilung des Pools, die Wahl neu samt Suche in «sehr schwer»
    und der Löser): `tools/geschichte/wahl.json` ist nachbaubar (neu gerechnet byte-gleich), 4 × 60 Level, je Welt 10
    auf den Plätzen 1–10, der Grad aus den Leveldaten, Welt *w* mit den Rängen 10·*w* … 10·*w*+9 nach Schwierigkeit,
    höchstens 2 Plätze vertauscht, jede Welt in ihrem Abschnitt des Pools (in «sehr schwer» statt dessen höchstens
    3 Plätze vom Rang im Grad, auch über die Weltgrenze, Entscheid des Nutzers vom 29.10.2026), dieselbe Haupt-Kernidee
    höchstens zweimal je 10 aufeinanderfolgende Level auch über die Weltgrenzen, in allen Graden ohne Verstoss, keine
    zwei zu ähnlich, kein abgelehntes, genau eine Lösung, die Titel aus `titel.json` (eindeutig über Titel und Namen,
    Regeln der Spec) und die Schlüssel der 15 neuen sehr schweren Level (seit Ticket 04 je einmal im Spiel, mit
    denselben Leveldaten). Seit Ticket 09: «sehr schwer» wählt 60 aus mehr (Spiel, Vorrat und die beurteilten
    Kandidaten aus `tools/geschichte/sehr-schwer-kandidaten.json`), die am besten bewerteten gehen nicht auf, die
    gewählten schon, Summe der Ränge in der Bewertung nicht schlechter als die Analyse; «leicht», «mittel» und «schwer»
    unverändert (Prüfsumme); die Schlüssel der gewählten Kandidaten eindeutig in jeder Schreibung, Kandidaten nur mit
    gutem Urteil; `ausbauListe` für `ordne-level.mjs --ausbau`. Dazu Gegenproben an erfundenen Änderungen und Pools
    (auch zur Regel der 3 Plätze über die Weltgrenze, gegen alle Anordnungen eines kleinen Falls zur kleinsten
    Verschiebung und gegen alle Mengen kleiner Fälle zur Suche über den ganzen Grad). Die Wahl im Spiel (Ticket 04):
    das Spiel (`src/daten/level.js`) hat das Tutorial und genau die 240 mit dem Titel aus `wahl.json`, in der
    Reihenfolge der Reihe, keine Würfel-Level; der Datenblock der Geschichte (`REISE`, in der Spiellogik
    `STORY_LEVELS`) ist die Reise aus `wahl.json`;
    `geschichte.mjs spiel` ändert danach nichts und bringt an Kopien der Texte ein Level der Wahl aus dem Vorrat zurück
    und ein anderes hin (ohne Titel), byte-gleich.
  - `GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/geschichte-probe.mjs [--handy | --quer]
    [--grad leicht,mittel,…] [--welten 2 | --ganz] [--finale <grad>] [--menue] [--start] [--uebersicht] [--dorf] [--dorf-raender]
    [--groesse 360x640] [--sprache en]` spielt Noas
    Geschichte in Headless-Chrome über das Menü (Tickets 04 bis 07; etwa 3 min je Grad; der Zeitrahmen läuft erst, wenn `leise.sh`
    die Sperre hat): je Grad ein Durchgang durch die ersten Welten (Karte im Menü, Prolog, Einstieg, je 10 Level,
    Reise), danach Neuladen und «Weiter» am selben Platz ohne Einstieg; `--finale` das Finale ab der letzten Welt bis
    «Zum Menü», dann ohne Neuladen ins Menü (geschafft, der nächstschwerere hervorgehoben, «Weiter» zu einem anderen
    begonnenen Grad) und in den hervorgehobenen Grad; `--menue` das Menü im Ablauf (Stand je Grad, «Weiter», «Menü» im
    Spiel und zurück ins selbe Level, Esc, Wechsel in einen Grad in einer anderen Welt, «Von vorn» mit Rückfrage, ein
    neuer Grad aus dem Spiel heraus), auf dem Desktop dazu ein gehaltenes Enter am Startbildschirm (`--start` allein);
    `--uebersicht` die Übersicht und das Wiederholen (etwa 4 min: aus dem Spiel mit Knopf und L und zurück ins selbe
    Level, Tasten darunter, Wiederholen in einer anderen Welt ohne Zwischenszene, «Neue Bestzeit · Weniger
    Drehungen», «Weiter» über eine Weltgrenze, wo nur der Himmel blendet, zurück in den normalen Ablauf beim ersten
    ungelösten Level, aus dem Menü die Übersicht eines geschafften Grads bis zum letzten Level und «Zur Übersicht»,
    «Von vorn» lässt die Bestwerte stehen; auf dem Handy Wischen, Stationen und Pfeile; auf dem Desktop dazu die Reise
    nach dem Wiederholen); `--dorf` das Kapitel «Im Dorf» (Ticket 07, seit PLAN 1a.3 mit den 4 Übungen, etwa 6 min:
    Angebot nach dem Prolog mit Fokus auf «Üben», Einstieg ins Dorf, Übungen mit Kopfzeile und Führung (jeder Schritt
    jeder Übung wie ein Spieler: Satz und Punkte im Band, «Weiter», Lichtkegel und Abdunkeln, Hand, Sperre der übrigen
    Elemente, Text ganz im Bild, das Band verdeckt weder Knöpfe noch Elemente; in «Erstes Licht» Neustart, Hinweise
    nebenbei und Menü), mitten in der Führung von «Farbenlehre» Neuladen: «Weiter» beginnt bei Übung 1 (kein Stand im
    Dorf), Menü und Übersicht behalten Übung und Schritt, die offene Übung aus der Übersicht läuft im Ablauf weiter,
    «Überspringen» mitten in einer Übung (danach bleibt von der Führung nichts stehen) und beim Herauswachsen, «Gleich
    los», alle 4 Übungen bis zum Bergwald, Wiederholen einer Übung aus der Übersicht, Einstiege übersprungen im Flug, im
    Fall und gleich zu Beginn: genau ein Level wächst, kein leeres Brett, Tempo des Einstiegs, Drehung der Kamera je
    Bild); `--dorf-raender` Randfälle des Dorfs (etwa 6 min: Wiederholen im laufenden Kapitel, Bergwald 1 aus der
    Übersicht mitten im Dorf, Neuladen im Einstieg, «Dorf überspringen» beim Versinken, Einstieg überspringen, während er
    aufs Versinken wartet, ein altes gespieltes Dorf mit `platz` 8 bleibt beendet, mitten in der Führung in einen
    anderen Grad und zurück zu Übung 1, «Dorf überspringen» im Wechsel zwischen zwei Schritten). Nach dem Prolog wählen
    die übrigen Abläufe «Gleich los».
    `--ganz` (Abnahme Ticket 08; etwa 7 min je Grad, Zeitrahmen 14 min je Grad): der ganze Durchgang je Grad in einer
    Sitzung vom Menü bis zum Epilog und zurück ins Menü, mit Neuladen mitten in der Wüste und den Bildzeiten jeder
    Zwischenszene (Prolog, Einstieg, fünf Reisen, Finale, Epilog). `--handy` 390 × 844 (mit `--groesse` ein anderes
    Handy, etwa 360x640), `--quer` 844 × 390, beide mit Touch (`Input.dispatchTouchEvent`),
    sonst 1440 × 900 mit der Maus. `--sprache en` (Ticket 08): Chrome meldet Englisch, die erwarteten Texte kommen aus
    `en.json` (ohne: Deutsch). Gelöst wird über die Testschnittstelle (`__prismaDebug.loese`), einen Stand setzt
    die Probe in `localStorage`. Sie prüft Kopfzeile, Speicherstand, Menü und Konsole, dass das Menü nach der Wahl
    sofort ausblendet und die Kamera im Himmel bleibt, bis die Welt bereit ist (kein leeres Brett), misst die
    Bildzeiten der Übergänge (Lücken über 100 ms sind Fehler) und legt Bilder nach `tests/output/geschichte/`
    (`<bildschirm>-<name>.png`, `«sehr schwer»` als `sehr-schwer`).
  - `LEISE_ART=leicht LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node
    tests/sprachwechsel-probe.mjs [--gpu] [--handy] [--von en] [--bilder] [--nur start,menue,liste,dorf,reise]` prüft
    den Wechsel der Sprache ohne Neuladen und die Liste am Schalter (Tickets 01 und 02 von `.scratch/sprachwahl/`; kurz
    und gezielt statt eines Bildvergleichs, Entscheid des Nutzers 18.11.2026; auf der GPU knapp 3 min, Desktop
    1280 × 800, mit `--handy` Handy hochkant 390 × 844 mit Touch, ein leichter Lauf). Das Spiel lädt auf Deutsch (mit
    `--von en` auf Englisch) und wechselt dann hin und her: auf dem Startbildschirm (Adresse ohne `?sprache=`,
    gespeichert, Neuladen mit und ohne Parameter), im Menü wie ein Spieler mit Schalter und Liste hin und zurück (Fokus
    bleibt auf dem Schalter, Reiter und Karte bleiben, Ansage für den Bildschirmleser in der neuen Sprache) und mit
    offener Rückfrage, dann in Prolog, Angebot, Einstieg ins Dorf, Übung 1 mit Band, Menü aus der Übung und zurück,
    «Gelöst», Übersicht, «Gelöst» am Ende des Bergwalds, Reise ans Meer und Epilog. Nach jedem Wechsel steht kein Text
    im Dokument mehr in der alten Sprache, auch kein verborgener (Text, `aria-label`, `title`, `alt`, `placeholder`,
    `content`, `document.title`; gesucht als ganzes Wort: jedes Stück eines Blatts der alten Sprachdatei, das in der
    neuen anders lautet, bis zum nächsten Platzhalter; mit Gegenprobe vor dem Wechsel; ausgenommen Elemente mit eigenem
    `lang`, die Namen in der Liste); kein Neuladen, dasselbe Brett, derselbe Himmel, keine Ladeanzeige, `lang`,
    Manifest, Konsole leer. Der Ablauf `liste` prüft die Liste im Menü aus einem Level: Schalter (Desktop der volle
    Name, Handy das Kürzel, ▾, `aria-label` mit Name und Kürzel), Öffnen (Fokus auf der aktuellen, Häkchen, Lage im
    Bild unter dem Schalter, auf dem Handy Einträge ab 44 px), Antippen ausserhalb (darunter löst nichts aus), erneutes
    Antippen, die aktuelle wählen, Esc (schliesst nur die Liste, mit Gegenprobe), Tastatur (Enter, Pfeile, Pos1, Ende,
    Tab, ein Wechsel mit Enter), einen Wechsel mit dem Zeiger, «Von vorn» und das Ausblenden des Menüs bei offener
    Liste. `--bilder`: Aufnahmen der offenen Liste nach `tests/output/sprachwechsel/`.
  - Golden-Test, Strahlregel, Beurteilung samt Eichung, Levelliste, Würfelliste und KI-Tester lesen die Level aus Spiel
    und Vorrat über den Lader (`tools/lader.mjs`), die Anzeige der Grade und die Proben im Browser nur das Spiel.
  - Proben im Browser mit Messwerten (`start-probe`, `leerlauf-probe`, Messwerkzeug mit `?perf`): Headless ist das
    nur eine Regressionsprüfung (ohne GPU in Software, rAF virtuell getaktet). `--fenster` öffnet ein echtes,
    maximiertes Chrome-Fenster auf der Grafikkarte (`tools/chrome.mjs`, Option `fenster`; nicht verdecken): so
    entstehen Messwerte, ungedrosselt und mit `--handy --drossel 4` (393 × 873, Pixeldichte 2,75, Touch, CPU 4×
    langsamer) wie in der Spec verlangt.
  - `GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/start-probe.mjs [--fenster] [--handy]
    [--drossel 4] [--laeufe 2] [--nur neu|weiter] [--seite datei]` misst den Start (Ticket 03 der Leistung), je Lauf
    ein frischer Chrome mit `?perf`: frischer Stand (Zeit bis zur Enthüllung, bis «Klicken zum Starten» und bis der
    Himmel steht, längste Lücken im Startbildschirm) und Stand mitten in der ersten Welt («Weiter» im Menü ohne Prolog:
    Abschnitte des Messwerkzeugs mit dem markierten Laden, Zeit bis Himmel und Level). Ergebnis nach
    `tests/output/leistung/start-*.json`; `--seite` misst eine andere Fassung (Vorher-Werte).
  - `GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/leerlauf-probe.mjs [--fenster] [--handy]
    [--drossel 4] [--sky forest] [--seite <index.html>] [--still]` misst den Leerlauf (Ticket 06 der Leistung, etwa
    1 min): Menü ohne Eingabe, erstes Level ohne Eingabe («Ruhe»), dann Hover, Drehen und Ziehen («Eingabe»); je
    Abschnitt gezeichnete Bilder je Sekunde, Zeichenzeit (p95, Mittel, GPU-ms je Sekunde), und je Eingabe, ob das
    erste Bild im nächsten Bildschirmbild kommt (Prüfung). `--still` (Seite mit `?t=12`) prüft, dass die stehende
    Szene nichts mehr zeichnet; `--seite` misst eine andere Fassung (etwa den Stand vorher als Kopie). Daten unter
    `tests/output/leistung/leerlauf-*.json`.
  - `GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/ruhetakt-probe.mjs [--handy]
    [--fenster] [--seite datei] [--nur ruhe,aus,wald]` prüft die Ruhe-Bildrate (Tickets 01 und 02 der Energie, etwa
    2 min): `ruhe` (Wüste ohne Parameter): im ruhenden Level die Hälfte der Bildschirmbilder gezeichnet, Grund «Ruhe»;
    nach einem Tippen aufs leere Brett das erste Bild im nächsten Bildschirmbild, danach jedes, nach etwa 1,5 s wieder
    Ruhe; Drehen und Lösen mit Feier (`__prismaDebug.loese`) im vollen Takt; die Auflösung sinkt dabei nicht. `aus`
    (`?ruhetakt=60`): stetig voller Takt, Grund «Spiel (Ruhe aus)». `wald` (ohne Parameter): auch mit den
    Glühwürmchen Ruhe. Gemessen in der Seite über rAF und `draw` (auch headless brauchbar); Ergebnis nach
    `tests/output/energie/ruhetakt-*.json`.
  - `node tests/app.test.mjs` prüft die Android-App ohne Android (Ticket 10 des Umbaus; etwa 3 s, in `npm test`): Build
    der App (ohne Source-Maps, `sw.js`, Manifeste; `PRISMA_APP`; Zurück-Taste nur dort), Browser-Fassung ohne Capacitor,
    Paketname, Version, Signieren ausserhalb des Repos (kein Schlüssel und keine `.aab`/`.apk` in Git), Store-Texte in
    den Grenzen von Google Play. `LEISE_ART=leicht … node tests/app-probe.mjs [--gpu]` (leicht, etwa 2 min) öffnet den
    Build der App in Chrome als Handy: kein Manifest, kein Service Worker, «Datenschutz» auf GitHub Pages, die Schritte
    der Zurück-Taste (`zurueckTaste`), Konsole ohne Fehler.
  - `node tests/offline.mjs` prüft den Offline-Betrieb am frisch gebauten `dist/` mit dessen `sw.js` (`--redirect`:
    Server leitet index.html weiter; `--unterpfad`: das Spiel unter `/Prisma/` wie auf GitHub Pages; startet
    Headless-Chrome, also wie die Screenshots nur über `leise.sh`; Chrome mit `--lang=de`, damit das Ergebnis nicht
    von der Sprache des Rechners abhängt). Er prüft auch den Bereich von Service Worker und Manifest (der Ordner der
    Seite) und die Datenschutzerklärung offline.
  - `GPU=1 LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/spiegel-probe.mjs
    [pruefe|messen|bilder] [--handy] [--welten forest,beach,…] [--runden 4] [--level 212] [--fassungen …]
    [--vorher datei] [--ordner pfad]` (Tickets 03 und 04 der Energie, je etwa 3 min): `pruefe` (Vorgabe) wechselt in
    einer Seite die Himmel nacheinander mit Überblenden (Dorf, Wald, Strand, Wüste, Vulkan, Planeten, Sterne, Eishöhle,
    zurück zu den Sternen, Strand, Planeten), ohne Schalter und mit `?spiegel=alle`: Die Spiegeltextur rechnet genau unter
    den Himmeln, die spiegeln (und nur auf Brettern mit Spiegelfläche), der Anteil der Spiegelung ändert sich je Bild
    höchstens so viel wie das weiche Überblenden, nie beim Halten und ohne Umkehr, kein Spiegelbild bei Anteil 0, im Menü
    (Blick im Himmel) keines, Grösse und Kantenglättung der Textur, keine Konsolenfehler. `messen` misst die GPU-Zeit je
    Schritt von `draw` (Spiegelung, Szene, Pinsel, Bloom, letzter Schritt) mit einer eigenen Abfrage über
    `EXT_disjoint_timer_query_webgl2`, je Fassung (`heute`, `alle` wie `?spiegel=alle`, `ohneSpiegel`, `ohneBloom`,
    `ohnePinsel`) in Runden im Wechsel, als Stösse von 30 Bildern ohne Pause (die eingebaute Grafik taktet im Takt von 60
    sonst herunter). Headless läuft das auf der eingebauten Intel-Grafik. Ergebnis nach
    `tests/output/energie/spiegel-<bildschirm>.json`. `bilder` legt Vergleichsbilder (Handy hoch, `?t=12`) vorher gegen
    neu samt Ausschnitt der Mitte des Bretts, nebeneinander mit dem Unterschied ×8 und der mittleren Änderung der
    Helligkeit, nach `--ordner`; vorher ist `--vorher` (Kopie einer früheren `index.html` im Wurzelordner) oder
    `?spiegel=alle`.
  - `GPU=1 LEISE_CPU=50 sh tools/leise.sh timeout -k 30 900 node tests/brett-probe.mjs [--nur mechanik|netz|menue|reise|formen]`
    prüft das Brett je Himmel (Spec `.scratch/brett-je-himmel/`, Ticket 02; etwa 3 min) über `__prisma.brett()`, ohne
    Bilder zu vergleichen. `mechanik` legt nur in der Seite eigene Arten an (ein Steinbrett, dessen Berechnen die Probe
    freigibt, und eines, das scheitert): Halten, bis das Brett bereit ist, Überblenden gleichzeitig und gleich lang wie
    der Himmel, nie ein drittes Brett im Bild, Vorladen, Freigeben (Handy sofort, Desktop nach der Frist), Steinbrett
    als Notfall (Berechnen gescheitert; nach 8 s ohne früheres Brett), Lücken unter 100 ms. `netz`: Handy, Netz und
    CPU gedrosselt, über den Startbildschirm und «Weiter» in die Wüste: Der Kleine Wagen wartet, bis Himmel und Brett
    bereit sind. `menue`: Unter dem Menü zählt die Frist des Notfalls nicht (dort lädt kein Brett), nach 10 s ohne
    bereites Brett also kein Steinbrett als Notfall und keine Warnung. `reise`: vom Ende des Bergwalds ans Meer, ohne
    Vorladen: Das Gezeitenbecken lädt erst auf der Reise, der Blick senkt sich auf das bereite Brett, Lücken unter 100 ms.
    `formen` (Ticket 05): Übergang zwischen allen Arten des Registers, jede geordnete Paarung einmal, flach und
    herausgezoomt, dazu zwei umgelenkte Übergänge. Je Bild zeichnet die Probe nur die Bretter in ein kleines Bild:
    Im Kernquader, hinter dem der Himmel nichts zeichnet, deckt jedes Pixel ein Brett, und kein Teil erscheint oder
    verschwindet auf einmal (Anteil der geänderten Pixel je Bild, auch ins letzte).
  - `LEISE_MAX_CPU=100 LEISE_CPU=100 sh tools/leise.sh timeout -k 30 900 node tests/buehne-messung.mjs [messen]
    [--fenster] [--handy] [--drossel 4] [--ohne-webgl] [--epilog] [--seite datei] [--name x]` misst die Bühne von
    Prolog und Epilog (Ticket 04 der Leistung, bis das Messwerkzeug aus Ticket 01 da ist): Chrome mit GPU (`--fenster`:
    sichtbar statt headless), Bildabstände über `requestAnimationFrame` getrennt nach Kamerafahrt und Warten auf
    Tippen, dazu ein Trace über das DevTools-Protokoll, ausgewertet nach Script, Style, Layout, Paint, Raster, GPU
    (ms je Sekunde); `--handy` 393 × 873 mit Pixeldichte 2,75 und Touch, `--drossel` CPU-Drosselung, `--ohne-webgl`
    ohne die 3D-Szene hinter der Bühne, `--seite` eine andere Fassung der Seite im selben Ordner (Vorher-Werte).
    Ergebnis nach `tests/output/buehne/messung-<name>.json`. `… bilder <ordner> [--nur desktop,handy,quer,
    handy-360x640]` legt an jedem Ruhepunkt von Prolog und Epilog ein eingefrorenes Bild nach
    `tests/output/buehne/<ordner>/`, `node tests/buehne-messung.mjs vergleich <vorher> <nachher>` vergleicht zwei solche
    Ordner (Anteil abweichender Pixel, Bilder nebeneinander nach `tests/output/buehne/vergleich/`).
  - `node tests/screenshot.mjs` rendert Screenshots per Headless-Chrome nach `tests/output/`.
  - `node tests/screenshot.mjs perf 1280 800 200 "$(cat tests/perf-probe.js)"` vergleicht die Kosten der Renderstufen.
  - `node tests/screenshot.mjs interaction 1440 900 800 "$(cat tests/interaction-probe.js)"` simuliert Klick,
    Rechtsklick, Ziehen und Hover.
  - `node tests/screenshot.mjs cube-click 1440 900 500 "$(cat tests/cube-click-probe.js)"` klickt im Würfel-Level
    „Zahnbürste“ jedes drehbare Element an und meldet, welches sich gedreht hat. `tests/cube-probe.js` stellt ein
    Würfel-Level für Screenshots ein (Aufruf im Kopf der Datei und in [3D-WUERFEL.md](3D-WUERFEL.md)). Seit Ticket 04
    liegen die Würfel-Level im Vorrat: vorher zurückholen (`tools/vorrat.mjs`); die Proben zeigen Level über die
    Testschnittstelle (`__prismaDebug.zeige(index)`, ausserhalb der Geschichte), die Probe der Bedienung das erste
    Tutorial-Level.
- **Steuerung:** Klick/Tap dreht ein Element um 45°, Rechtsklick oder langes Drücken zurück, Ziehen dreht die Kamera rund ums Feld.
  Schaltflächen unten rechts: Level neu starten, Ton an/aus, Übersicht (nur in einem Level der Geschichte), Menü.
  Tasten: R neu starten, M Ton, Esc Menü (im Menü, das aus dem Spiel kam, zurück), L Übersicht (in der Übersicht
  schliesst L sie wieder), Enter weiter (nach dem Lösen), F Leistungsanzeige; im Menü Tab, Pfeile, Pos1/Ende und
  Enter, mit Finger oder Stift Wischen über Karte, Reiter und Stand zum Nachbargrad; in der Übersicht Pfeile (auch
  über die Grenze einer Welt), Pos1/Ende (mit Strg: der ganze Grad), Bild↑/↓, Tab, Enter und Esc; in den
  Zwischenszenen Enter oder Leertaste weiter, Esc überspringt den Prolog. Level und Hintergrund wählt die Geschichte
  (Entscheide 21 und 26 der Spec `.scratch/noa-geschichte/`): Der Hintergrund-Knopf und die Tasten N, P und H sind
  mit Ticket 04 weggefallen, die Levelauswahl ersetzt die Übersicht (Ticket 06).
- **Würfel-Level (Prototyp, Branch `feature/3d-wuerfel`):** Level in einem 7×7×7-Würfel (`LEVELS_3D`, `dim: 3`), seit
  Noas Geschichte (Ticket 04) alle im Vorrat (`tools/vorrat/wuerfel.js`, zurückzuholen mit `tools/vorrat.mjs`). Jedes
  Element dreht um eine feste Achse in einem Ring (Achszapfen zeigen sie) und wirkt in der Ebene senkrecht dazu wie im
  2D-Feld; Spiegel mit waagrechter Achse lenken Licht zwischen die Ebenen.
  Derselbe Durchlauf der Strahlregel wie für die flachen Level (`tracePass`, ADR 0003): Ein flaches Level ist ein Würfel
  mit einer Ebene. Nur das Brett hat eine eigene Fassung (`createBoard3`, mit y und Drehachse); die flachen Level
  bleiben bitgleich (`tests/golden.mjs`).
  Die Kamera lässt sich im Würfel viel stärker neigen. Beurteilung (Ticket 14) und Generator (Ticket 22) kennen den
  Würfel über die Würfel-Feldform (`tools/beurteilung/feldform-wuerfel.mjs`); Würfel-Level aus dem Generator kommen
  nicht ins Spiel.
- **Ablauf:** Noas Geschichte «Ein Lichtsignal an die Sterne» ist das Spiel (Spec `.scratch/noa-geschichte/`,
  Tickets 04 und 05): Startbildschirm (Klick startet und schaltet den Ton frei), dann das Menü «Lichtwege zum
  Polarstern» (`createMenu`): je Grad sein Stand («Wüste · 23 / 60», «noch nicht begonnen», geschafft mit dem
  Polarstern), «Weiter» zum zuletzt gespielten unter den begonnenen, nicht geschafften Graden, «Von vorn» mit
  Rückfrage (löscht nur den Stand dieses Grads, seine Bestwerte bleiben), ein geschaffter Grad öffnet seine Übersicht;
  hinter dem Menü schaut die Kamera in den Himmel. Je Grad ein Durchgang: Prolog
  im Dorf, dann 6 Welten (Bergwald, Meer, Wüste, Vulkan, Planeten, Sterne) zu je 10 Leveln, beim ersten Betreten einer
  Welt ein Einstieg, zwischen den Welten die Reise des Lichts, nach der letzten Welt Finale und Epilog, am Ende «Zum
  Menü» (ohne Neuladen; der geschaffte Grad markiert, der nächstschwerere hervorgehoben). Im Spiel führt «Menü» (Esc)
  ins Menü, der Stand bleibt. Prolog und Einstiege kommen je Grad nur beim ersten Mal; der Prolog lässt sich
  überspringen. Die Übersicht des Grads (Ticket 06, `createUebersicht`; im Spiel «Übersicht» oder L, Blick in den
  Himmel wie beim Menü) zeigt je Welt 10 Kacheln (gelöst mit Bestzeit und wenigsten Drehungen, das nächste ungelöste
  offen, spätere gesperrt) und die Summe der Bestzeiten; auf dem Desktop alle Welten untereinander, auf Handy und
  Tablet eine je Seite (Stationen, Pfeile, Wischen über die Kacheln). Ein gelöstes Level läuft dort als Wiederholen:
  ohne Einstieg, Reise und Untertitel, «Weiter» zum nächsten Level der Reihe, beim Wechsel der Welt blendet nur der
  Himmel; beim nächsten ungelösten Level gilt wieder der normale Ablauf, nach dem letzten eines geschafften Grads
  kommt die Übersicht. Der Platz im Speicherstand fällt dabei nie zurück, und das Wiederholen eines geschafften Grads
  ändert den zuletzt gespielten Grad nicht. Eine neue Bestmarke meldet das Feld «Gelöst» («Neue Bestzeit», «Weniger
  Drehungen»), aber nur, wenn es schon einen Wert gab. Die Level je Grad und Welt stehen im Datenblock
  `STORY_LEVELS` (`REISE` in `src/daten/level.js`, geschrieben von `tools/geschichte.mjs spiel`). Speicherstand je Grad unter
  `prisma.noa.<grad>` (`sehr schwer` als `sehr-schwer`; Platz in der Reise, gelöste Level nach Namen, gesehene
  Momente, geschafft, `gespielt`: Zeit des letzten Speicherns für «Weiter»), die Bestwerte je Level unter
  `prisma.noa.<grad>.bestwerte` (Zeit in ganzen Sekunden, überleben «Von vorn», Entscheid 27) und der zuletzt
  gewählte Grad unter `prisma.noa.zuletzt`; Neuladen setzt dort fort. Die alten Schlüssel (`prisma.solvedLevels`,
  `prisma.current`, `prisma.sky`, `prisma.signal`, `prisma.signal.seen`) liest das Spiel nicht mehr. Das Tutorial
  steht im Spiel, kommt im Ablauf aber erst mit dem Kapitel «Im Dorf» (Ticket 07).
  **Ladezeichen** (`ladeZeichen`, `#lade`): Wartet die Geschichte auf den Himmel einer Welt (Einstieg nach «Üben»,
  «Weiter» in eine Welt, deren Himmel noch fehlt, «Gleich los», solange der Wald lädt), zeichnet sich nach 0,4 s der
  Kleine Wagen Stern für Stern, etwas über der Mitte, über der Bühne oben im Himmel (auf dem Handy rund 135 px breit, auf grossen Bildschirmen bis
  2,2-mal so gross, `?wagen=<faktor>` setzt die Grösse fest zum Ausprobieren); steht der Himmel, blendet er aus. Unter Menü und Übersicht nicht,
  und nicht, solange ein Satz auf Tippen wartet (am Ende des Dorfs lädt der Wald schon, während man liest).
  Nur Deckkraft und Transform in CSS, damit er auch läuft, während das Laden den Hauptthread anhält. Gewählt aus dem
  Prototyp mit sechs Varianten (Branch `prototyp/ladeindikator`, `.scratch/ladeindikator/prototyp.html`).
  Kopfzeile: «Das Meer – Sandbank» (Welt und Titel des Levels, `levelTitel`), darunter in einer Zeile die
  Ziele, die schon in ihrer Farbe leuchten, und der Grad («Ziele 1 / 3 · ●○○○ Leicht»; Kapitel, Level und Bedienung
  stehen seit dem 09.11.2026 nicht mehr da). Der Ring am Ziel hat einen festen Platz je Grundfarbe
  (Rot links, Grün rechts, Blau vorne) und zeigt, aus welchen die gesuchte Farbe besteht. Kommt eine gebrauchte
  Grundfarbe an, wird ihr Bogen heller; kommt eine an, die das Ziel nicht braucht, flackert sie in ihrem leeren
  Platz. Beim Lösen leuchten die Ziele nacheinander auf, ein Akkord erklingt, eine Lichtwelle läuft über die
  Platte und es regnen Funken; danach "Level gelöst" mit Weiter-Button. Ton komplett per Web Audio erzeugt.
  `?nointro` überspringt den Startbildschirm (nutzen die Screenshot-Tests; `INTRO=1` zeigt ihn), `?sky=<id>` zeigt
  einen Hintergrund statt dem der Welt (Tests). Testschnittstelle für Werkzeuge und Proben (`__prismaDebug`, das Spiel
  ruft sie nie auf): `zeige(index)` zeigt ein Level ausserhalb der Geschichte (ohne Speicherstand), `loese()` löst das
  laufende Level Drehung für Drehung, `menu` ist das Menü (`story.choose(grad)` wählt einen Grad, solange es offen
  ist), `uebersicht` die Übersicht (Daten aus `story.overviewData(grad)`), `settle(s)` spult mit `?t=` vor.
- **Leistung:** Fast die ganze Last ist das Rendern (Szene, in den Welten im All dazu ihr Spiegelbild, Bloom); die
  Logik kostet unter 0,1 ms pro Bild. Darum rendert das Spiel nur so oft wie nötig (`frameRate`): im Level, im Menü
  und in den Szenen der Geschichte im WebGL-Bild (Aufstieg, Reise, Einstieg, Finale) 60 Bilder/s (ADR 0008;
  `?takt=30` zum Vergleich wie unter ADR 0006: das Spiel stetig 30, die Geschichte 60), im ruhenden Level 30
  (Ruhe-Bildrate, unten), mit dem Blick im Himmel (Menü, Übersicht) 10, hinter der einblendenden Bühne 30. Gerendert wird jedes k-te Bildschirmbild, damit der Takt gleichmässig bleibt
  (`frameRate.teiler`; 144 Hz → 72).
  **Ruhe-Bildrate** (Spec `.scratch/energie/`, Tickets 01 und 02; ADR 0009; Standard seit Ticket 02): Das Level zeichnet
  in **Ruhe** nur 30 Bilder/s (`RUHE_FPS`, `frameRate.ruhe`, Entscheidung in `ruhtJetzt`, `bildrate` im Logikblock),
  in jeder Welt. Auf dem Poco spart das im Level 30–35 % Strom, stufig wirkte in keiner Welt etwas. Schalter zum
  Vergleichen: `?ruhetakt=<n>` (ab 20, unter dem Takt des Spiels) wählt einen anderen Wert, `?ruhetakt=aus` oder
  `?ruhetakt=60` schaltet sie aus (stetig 60 wie unter ADR 0008). Ruhe heisst: im Level (`flow.state` `play`, weder Menü, Übersicht noch Bühne),
  seit 1,5 s (`RUHE_NACH_MS`) keine Eingabe und kein Anstoss (`sceneLoop.wake`, also Drücken, Ziehen, Hover, Rad,
  Tasten, Touch, jeder Weckruf) und nichts, was man anschaut, bewegt sich (`frameRate.bewegt`): kein Finger oder keine
  Taste unten, nichts aus `sceneLoop.pending` (Drehen, Puls, Wackeln, Hover, aufleuchtende Ziele, wachsende Strahlen,
  Feier, Herauswachsen, Überblenden, Kamera nach Ziehen und Zoom), kein Wechsel der Führung und keine Hand, keine
  Lichtwelle samt Nachwirkung. Eine Bewegung zählt wie eine Eingabe, danach also noch 1,5 s voller Takt. Das Schweben
  der Kamera, das Fliessen der Strahlen, das Drehen der Ziele und die Himmel samt Fischen, Glühwürmchen, Funken und
  Planeten sind Ruhe (bis Ticket 01 hielten diese Himmel den vollen Takt, `skyTheme.fluid`; das entfiel mit Ticket 02). Bei jeder Eingabe zeichnet das nächste Bildschirmbild sofort
  wieder mit vollem Takt (`frameRate.rege`, `zurueck`; die adaptive Auflösung wertet den längeren Abstand davor nicht).
  Die Geschichte bleibt bei 60, Menü und Übersicht bei 10, hinter der Bühne 30; mit `?takt=30` zeichnet das Spiel ohnehin
  stetig 30. Alle Animationen rechnen nach der
  Zeit (`MAX_DT` 0,05 s, darum ab 20). Liegt die Szene ganz verdeckt (Startbildschirm, eingeblendete Bühne von Prolog und Epilog),
  wird sie nicht gezeichnet (`sceneLoop`): Nur die Logik läuft, solange etwas ansteht (Tweens, Einblenden des Himmels,
  Kamera), dann ruht die Hauptschleife ohne rAF, bis `sceneLoop.wake()` sie weckt; vor dem Ruhen ein Bild zum
  Aufwärmen. Sichtbar ruht sie ebenso, sobald sich nichts mehr bewegt (`sceneLoop.ambient()`/`pending()`): Weil im
  Spiel die Umgebung immer lebt (Kamera schwebt, Strahlen fliessen, Ziele drehen sich, Himmel), passiert das nur mit
  `?t=` (Zeit steht: Bilder der Tests und KI-Tester; dort weckt `settle` bzw. `sceneLoop.wake(true)` für neue Bilder).
  Liegt die Platte nicht im Bild (Menü, Übersicht: Blick im Himmel), entfällt die Spiegelung. Eingaben (auch
  `pointermove`), Drehen, Puls, Hover, Feier wecken. `__prisma.frames` zählt gezeichnete Bilder, `__prisma.ticks` Schritte der Logik (darauf warten die
  Proben), `__prisma.ruht()` und `__prisma.verdeckt()` zeigen den Zustand.
  **Ruhige Stellen** (`ruhe`, Ticket 03 der Leistung): Was Hauptthread oder Grafikprozess länger anhält (Shader und
  Uploads einer Skybox, ihr erstes Zeichnen, Vorwärmen von Menü, Bühne und Übersicht, Ton), läuft nur, wenn nichts
  Sichtbares animiert: vor und nach der Enthüllung des Startbildschirms, im Prolog beim Warten auf Tippen und beim
  Angebot, hinter der Überblendung nach «Weiter» (`ruhe.lade`, im Messwerkzeug als Laden markiert) und im Spiel; nicht
  während der Enthüllung, im Menü und während einer Fahrt der Bühne (Generatoren melden das mit `yield RUHIG`).
  «Klicken zum Starten» kommt am Ende der Enthüllung (2,9 s) und wartet nicht auf den Himmel.
  Dazu passt die Auflösung sich an, wenn Bilder zu lange dauern (`adaptiveResolution`, Budget je nach Bildrate).
  **Bühne der Geschichte** (Prolog und Epilog; Ticket 19 der Leistung, ADR 0007): eine eigene WebGL-Leinwand in
  `#story .scene` mit eigenem Kontext und eigener rAF-Schleife, die jedes Bildschirmbild zeichnet (bei 60 Hz 60 Bilder/s). Die SVG-Ebenen werden im Ruhepunkt
  vor einer Fahrt in Kacheln zu Texturen gerastert (je Abschnitt der Folge in der grössten Skalierung, dazu scharfe
  Stufen für die Ruhepunkte; auf dem Poco höchstens etwa 116 MB). Kamera, Arm, Strahl (Shader mit weichem Rand),
  Glühwürmchen, Rauch, Fenster und Sterne rechnet jedes Bild aus der Zeit. Untertitel, Hinweise und Knöpfe bleiben DOM
  darüber. `__prisma.buehne` liefert Bildabstände (`bilder()`) und Grafikspeicher (`speicher()`) für die Proben.
  **Seitenmassstab** (`SEITE`, Ticket 18): Auf Android-Chromium mit Pixeldichte über 2 rastert die Seite mit Massstab 2
  (Meta-Viewport), `body { zoom }` hält Schrift und Knöpfe gleich gross. Das spart Kachelspeicher; auf dem Poco brach
  der Compositor sonst Bilder ab. Neue Stellen, die mit `clientX`, `getBoundingClientRect`, `innerWidth` oder vw/vh
  Oberfläche bauen, müssen `SEITE` kennen.
  **Diagnose-Schalter** `?diag=a,b` (zum Messen auf dem Handy, je Schalter eine Ursache weg): `seite275` (ohne
  Seitenmassstab), `ohnevorbereitung` (kein Laden hinter der Bühne), `ruhepunkte` (Laden in jedem Ruhepunkt, auch vor
  den Flügen der Glühwürmchen), `ohneleuchten`, `ohnestrahl`.
  **Spiegelung je Welt** (Spec `.scratch/energie/`, Ticket 04; ADR 0010): Das Brett spiegelt nur unter den beiden
  Himmeln im All (Planeten und Sterne, `spiegel: true` in ihren Einträgen in `SKY_ENTRIES`, `spiegelHimmel`), dort mit
  kleiner Spiegeltextur ohne Kantenglättung (`QUALITY.reflectionScale` Handy 0,25, Desktop 0,22, `reflectionMsaa` 0).
  In allen anderen Welten rechnet `renderReflection` nichts, weder Spiegelbild noch Mipmaps, und die Bretter lesen die
  Textur nicht (`uReflStrength` 0); sonst sehen sie gleich aus. Die Zuordnung hängt am Himmel, nicht am Brett: Das
  Steinbrett steht auch in der Eishöhle und spiegelt dort nicht. Beim Überblenden des Himmels wandert der Anteil der
  Spiegelung (`boardReflection`) in derselben Zeit weich zum neuen, solange der Himmel nicht hält. Schalter zum
  Vergleichen: `?spiegel=alle` spiegelt in allen Welten wie bis energie-3 (Handy 0,35 mit MSAA 2, Desktop 0,3 mit
  MSAA 4). Die Sparfassungen `?spar=` aus Ticket 03 (`aufloesung`, `spiegelklein`, `spiegel2`, `pinsel3`) sind
  entfallen (in git bis energie-3); gemessene Kosten je Effekt in den Tickets 03 und 04.
  **Leistungsanzeige** (Taste F oder `?perf`; `perfHud` in `index.html`, ADR 0008): oben die effektive Bildrate (wie
  viele Bilder in der letzten Sekunde wirklich gezeichnet wurden, vom Spiel oder von der Bühne von Prolog und Epilog)
  und das Ziel mit dem Grund (60 im Spiel, im Menü und in der Geschichte, 30 und «Ruhe» im ruhenden Level, mit
  `?ruhetakt=aus` «Spiel (Ruhe aus)», 10 mit dem Blick im Himmel, 30 hinter der einblendenden Bühne, auf der Bühne
  der Bildschirmtakt, 0, wenn die Schleife ruht; auf dem Startbildschirm «–», er ist eine Animation des Browsers).
  Darunter Bildschirmtakt, p95 der Abstände der gezeichneten Bilder, Auflösung samt adaptiver Absenkung und **Version**;
  auf schmalem Bildschirm knapp oben links.
  **Messwerkzeug** (Spec `.scratch/leistung/`, Ticket 01; `leistung` in `index.html`): Mit `?perf` (oder Taste F) misst
  eine eigene rAF-Schleife die sichtbaren Bildabstände, auch wenn die Szene nicht rendert, getrennt nach Abschnitten
  (Startbildschirm, Prolog, Menü, Einstieg, Spiel, Reise usw.; Laden hinter einer Überblendung markiert der Code mit
  `leistung.markiere('laden')` bzw. `leistung.waehrend('laden', promise)`, es zählt nicht gegen die Grenzwerte). Dazu
  Hänger des Hauptthreads mit Ursache (`long-animation-frame`), die CPU-Zeit von `frame()` und die Zeichenzeit als
  GPU-Zeit über `EXT_disjoint_timer_query_webgl2` (ohne die Erweiterung, etwa auf dem Poco, leer). Grenzwerte: p95
  der Bildabstände ≤ 18,3 ms, kein Bild über 33 ms, Zeichenzeit p95 ≤ 8 ms (Poco). Die Proben lesen die Werte über
  `window.__prisma.leistung.daten()`. Den Referenzdurchlauf mit Ergebniskarte und Dauerlast (Tickets 01 und 08) gibt
  es seit ADR 0008 nicht mehr (in git bis zum Commit davor, samt `tests/leistung-probe.mjs`).
  **Version prüfen, sonst neu laden:** `APP_VERSION` (Datum und Ticketstand) steht gleich in `index.html` und `sw.js`
  (ein Test prüft das) und wird mit jedem Stand für einen Handy-Durchlauf nachgeführt. Die Leistungsanzeige (Taste F)
  zeigt sie. Steht dort nach dem Deploy noch die alte (Render startete kalt, und der Service Worker antwortete nach 3 s
  aus dem Speicher), die Seite einmal neu laden: Der Speicher ist inzwischen nachgeführt, und die geänderte `sw.js`
  installiert sich neu.
- **Skyboxen aus Blender** (`tools/blender/`, nur für die Entwicklung, braucht Blender 5.2 mit GPU): Hintergründe, die
  in Blender als Panorama entstehen; im Spiel zeichnet sie ein allgemeines Modul (`createPanoramaSky`, Abschnitt SKYBOX
  in `index.html`) aus ihrem Manifest. Register `backgrounds/skies.js`, Daten in `backgrounds/<id>/` (Stand im
  Dateinamen); beides schreibt `node tools/blender/pack.mjs <id>` aus `tools/blender/szenen/<id>/skybox.json` (Name,
  Reihenfolge, Sterne, Farben, Ebenen, Brett) und der Ausgabe der Pipeline. `tools/sky-schema.mjs` prüft das Register (beim
  Packen und in den Tests), `sw.js` liest seine Listen daraus. Was das Spiel zu einem Panorama selbst zeichnet (nahe
  Objekte, Nebellagen, Leuchtpunkte, bewegtes Wasser), sind Ebenentypen mit Parametern (`SKY_LAYERS`). Pinsel: Jede
  Ebene mit `"brush": true` bekommt Pinselstriche wie das gemalte Panorama (anisotroper Kuwahara-Filter wie `anime.py`,
  `createBrushPass`); die Einstellungen stehen im Feld `brush` der Skybox (`size` Radius in Grad wie
  `px_per_deg * 0.28`, `uniformity`, `sharpness`, `eccentricity` wie der Knoten im Kompositor, `mobile` Stufe auf dem
  Handy), Standard aus. **Kamera:** Das Feld `camera.stops` der Skybox sind Grenzen `[dx, dz, weit]`: In der waagrechten
  Richtung (dx, dz) steht die Kamera höchstens `weit` m von der Mitte des Bretts, sonst rückt sie auf ihrem Strahl heran
  und das Sichtfeld wird so viel weiter, dass das Brett auf der Höhe seiner Mitte gleich gross bleibt (`cameraStop`;
  Strand: nicht hinter die Palmen); beim Wechsel der Welt gleitet der Halt mit dem Überblenden. `camera.top` ist ebenso
  eine Decke: Die Kamera steht höchstens so viele m über der Platte (Eishöhle: unter dem Gewölbe, das sich zur Wand hin senkt; geprüft entlang der ganzen Bahn mit `kamera_abstand()` der Szene). **Brett je Himmel** (Spec `.scratch/brett-je-himmel/`): Das Feld `board` in `skybox.json` nennt
  das Brett der Skybox, `{ "type": <Art>, …Werte }`; ohne Angabe, unter Milchstrasse und Sonnensystem steht das
  Steinbrett (Art `stone`). Die Arten stehen in der Zeile `const BOARD_TYPES = { … }` in `index.html` (`boardTheme`
  baut, teilt und zeigt die Bretter, je Art mit ihrem Kernquader: dahinter zeichnet der Himmel nichts), ihre Werte
  prüft `tools/sky-schema.mjs` (`BOARD_PARAMS`). `node tools/blender/pack.mjs --brett [<id> …]` überträgt nur die
  Brett-Angaben ins Register (ohne id alle), ohne die Teile neu zu packen und ohne die Rohdaten aus Blender; nachgeführt
  werden Register und `SKIES` in `sw.js`. `__prisma.brett()` meldet `{ himmel, art, bereit }`: den Himmel, dessen
  Brett zu sehen ist, dessen Art und ob es berechnet und hochgeladen ist. `backgrounds/`
  muss samt Unterordnern mit ausgeliefert werden. Konzept und weitere Schritte: PLAN 2.32. Belichtung und Malstil je
  Szene stehen in `tools/blender/stile.py` (Name = `WALD_STIL` = Ordner `out/<stil>`, `sky/<stil>`).
- **Wald** (`forest`, erste Skybox): `wald_scene.py` baut die Szene (Gelände, Fichten, Nebel, Mond) als `wald.blend`,
  `wald_render.py` rendert Vorschauen aus Sicht der Spielkamera, `wald_export.py` das Panorama, die Streifen und die
  Tiefe (Aufrufe in seinem Kopf). Eingebaut ist die Anime-Fassung: dieselben Skripte mit `WALD_STIL=anime`, danach
  malt `anime.py` die Renderings (Aufrufe in seinem Kopf) und schreibt `sky/anime/sky.json` (mit Hauptlicht, hellstem
  Wert und Farbringen für den Platzhalter beim Laden). Die Fichten nahe am Brett zeichnet das Spiel selbst (im
  Panorama lägen sie schräg): Modelle und Standorte erzeugt `wald_spielbaum.py` (`sky/<stil>/trees.json`).
  Gearbeitet wird über den Blender-MCP in der offenen Szene: `wald_mcp.py` führt die Skripte dort aus, lange Schritte
  (Rendern, Malen) nach dem Aufruf mit Protokoll in `out/<stil>/mcp.log`. Szene, Renderings und Zwischenbilder
  (`*.blend`, `out/`, `sky/`) sind nicht im Repo, die Skripte erzeugen sie neu: `wald_mcp.neu('anime')` baut
  `wald_anime.blend` (rund 20 s, gleich wie die Szene der eingecheckten Bilder), `wald_mcp.skybox()` rendert und malt
  alles (rund 30 min mit einer RTX A2000), danach `node tools/blender/pack.mjs forest`. Einrichten auf einem neuen
  Rechner: Blender 5.2 mit dem MCP von Blender Lab (projects.blender.org/lab/blender_mcp, Releases): `mcp-<version>.zip`
  in Blender als Erweiterung installieren und Blender mit `--online-mode` starten (die Brücke startet nur mit
  Online-Zugriff), `blender-<version>.mcpb` (ein Zip) entpacken und in Claude Code eintragen:
  `claude mcp add -s user blender -- uv run --directory <entpackter Ordner> blender-mcp`.
- **Strand** (`beach`, PLAN 2.33): Szene in `tools/blender/szenen/beach/szene.py`; über den MCP
  `wald_mcp.neu('beach')` (baut `beach.blend`, rund 5 s), `wald_mcp.skybox('beach')` (rendert, malt und exportiert
  Pflanzen und Wasserkarte nach `sky/beach/ebenen.json`, rund 25 min), danach `node tools/blender/pack.mjs beach`.
  Nur die nahen Pflanzen neu (Modelle, Eigenschatten, Lichtsonde, rund 3 min): `wald_mcp.scene('beach').export_flora()`,
  danach packen. Die Pflanzen zeichnet das Spiel beleuchtet und gemalt wie Blender (Ebene `paintedInstances`, PLAN 2.38).
  Nur Lage und Felsanteil der nahen Felsen neu, ohne Backen: `export_rock_shape()` (passt nur zu einem Panorama mit
  demselben `rock_drawn`, PLAN 1.4).
- **Vulkan** (`volcano`, PLAN 1.2, 1.7): Das Brett schwebt über einem Lavasee in einem Trichter aus Sand wie dem
  Gaskrater Darvaza («Door to Hell»), der See wie am Nyiragongo. Das Ufer liegt um 38 m von der Mitte (die Lava
  zeichnet das Spiel bis 29 m), von dort steigt eine flache Böschung (15° unten bis 23° oben) zu einer niedrigen,
  bröckelnden Abbruchkante mit hellen Lagen; der Rand steht 11 … 23 m über der Lava, dahinter flache Wüste mit dunklen
  Sträuchern. Auch ganz herausgezoomt und flach geneigt bleibt die Kamera über der Böschung, selbst beim Würfel auf dem
  Handy hochkant (bis 64 m von der Mitte). Auf der Böschung Rutschungen, Rinnen, Rieselzungen, Rippel, aufgerissene
  Lehmkruste, Lehmbrocken (Schuttsaum, Haufen, Gruppen) und Kies, dazu 130 Feuernester: Ihren Schein, den Russ und
  die glimmenden Risse malt das Panorama, die Flammen und Funken zeichnet das Spiel bewegt (Ebene `fireNests`, Daten
  `fires` aus dem Export der Szene). Licht: Es ist Nacht, das Hauptlicht sind Lava und Feuer; der Himmel ist bis zum
  Rand fast schwarz (ein warmer Schein über dem Rand wirkte wie ein Licht hinter dem Krater). Die Sterne zeichnet das
  Spiel ab 14° über dem Horizont (`sky.starsFrom`): Sie liegen 70 m um die Kamera, der Rand ist weiter weg. Szene in
  `tools/blender/szenen/volcano/szene.py` (in Cycles gerendert, gemalt mit dem Stil `volcano` in `stile.py` wie der
  Strand, satt, mit feineren Pinselstrichen `pinsel`). `wald_mcp.neu('volcano')`, `wald_mcp.skybox('volcano')` (ohne
  MCP auch headless mit denselben Skripten über `wald_mcp.run`), danach `node tools/blender/pack.mjs volcano`.
  Bewegt zeichnet das Spiel den See ums Brett (`lavaPool`: treibende Krustenplatten mit glühenden Rissen, die sich
  öffnen und schliessen; Gasblasen wölben die Kruste auf, reissen, Lava spritzt hoch und kühlt ab; Funken); Blender
  malt dort nur die Kruste. Ein Dutzend Felsbrocken im See vor dem Ufer zeichnet das Spiel wie die nahen Felsen am
  Strand (`bakedMesh`, Licht gebacken und gemalt, `export()` der Szene).
- **Eishöhle** (`icecave`, PLAN 1.8): Das Brett schwebt 4 m über einem See in einer Gletscherhöhle nach Fotos echter
  Höhlen: eine längliche, unregelmässige Halle (Wand 72 … 96 m von der Mitte, Decke über dem Brett mindestens 35,6 m
  hoch, je Richtung eine eigene Superellipse), geradeaus ein Ausgang ins Tageslicht, schräg hinten ein dunkler Gang mit
  Bach, genau über dem Brett ein Schmelzwasserschacht als Trichter, oben offen (blickt die Kamera der Geschichte
  hinauf, sieht sie durch ihn den Himmel); auf dem See elf Eisschollen, jede anders, auch nah am Brett (ausgefranst,
  ohne gerade Bruchkanten, nichts unter Wasser; kein Eis liegt ganz unter Wasser). Das Eis hat
  Mulden in vier Grössen (gewichtetes Voronoi: gebogene Kanten, gestreckt zum Ausgang hin, dazwischen glatte Stellen),
  Farbe nach dem Licht (Attribut `thin`), Schlieren, Raureif, nasse Rinnen; Kies- und Aschelagen liegen nur unten.
  Szene `tools/blender/szenen/icecave/szene.py`, gemalt mit dem Stil `icecave` in `stile.py` (Belichtung 2,8, feine
  Striche `pinsel` 0.12, mehr Abtastwerte `proben`, Streifen bis 22°: höher sprengte das Budget von 300 MB).
  `wald_mcp.neu('icecave')`, `wald_mcp.skybox('icecave')` (rund 50 min), danach `node tools/blender/pack.mjs icecave`.
  Licht: Die Sonne (Richtung des Hauptlichts im Spiel) bescheint per Light Linking nur Berge und Ebene draussen
  (durch den Schacht fiele sonst ihr Fleck in die Höhle), eine Flächenlampe vor dem Ausgang bringt das Himmelslicht.
  Fallen: Flächenlampen spiegeln sich im See mit ihrer Form (die am Ausgang steht darum grösser als das Mundloch
  davor); Light Linking nimmt in Cycles dem ganzen Pfad das Licht, nicht nur dem ausgeschlossenen Objekt. Unter dem
  Brett, das 4 m über dem See schwebt, sieht man flach hindurch auf den Grund des Panoramas: Der Boden ist dort mit einem
  Fächer geschlossen (offen zeigte er einen blauen Kreis). Den See zeichnet das Spiel (Ebene `waterSurface` mit `calm`:
  ruhig, ohne Brandung und Schaum, Spiegelung des Panoramas passend zur Kamera); Blender malt dort nur den Grund durchs
  Wasser und exportiert wie der Strand die Wasserkarte (`water_map`, mit Schollen und Eis im Wasser als «Fels») und
  die Wassermaske (Stil `wasser`, hier bis 70° unter den Horizont: `maske`; Eis unter Wasser zeichnete die Brechung
  als Schlieren, darum reichen die Schollen nur knapp unter die Wasserlinie; damit Schollen nicht als Geisterbilder im
  Wasser stehen, gilt bei `calm` Grund hinter Eis oder Fels der Wasserkarte als verdeckt, siehe `groundShift`).
  Ausserhalb des Sees liegen Bäche und Rinnen knapp über
  dem Wasser (sonst zeichnet das Spiel dort im flachen Blick offenes Wasser in Streifen); draussen vor dem Ausgang
  Moränenhügel und -geröll, die das schmale Fenster vom Brett aus füllen. Die Kamera hält unter der Decke (`camera.top` 28: mindestens 2,6 m Luft entlang der ganzen Bahn,
  `wald_mcp.scene('icecave').kamera_abstand(28)`; mit 32 stiess sie am Handy im Würfel ins Gewölbe). Einzige Ebene ist
  das Wasser; das Steinbrett bleibt vorerst.
- **Level-Werkzeuge** (`tools/`, nur für die Entwicklung): Wie Level beurteilt und erzeugt werden, bestimmen nur die
  Beurteilung (`tools/beurteilung/`) und der Generator (`tools/generator/`, Kommandozeile `generiere.mjs`); beide
  unten. Seit Ticket 21 sind die alten Werkzeuge mit eigenen Formeln entfernt (im Verlauf bis `6e98bb1`): der
  Generator nach Profilen (`generate.mjs`, `profiles.mjs`: Grössenstufe × Mischung), das Härten (`harden.mjs`), die
  Pools (`pools.mjs`), das Kuratieren (`curate.mjs`) samt Auswahlliste (`selection.jsonl`) und handgebauten Kandidaten
  (`candidates.jsonl`), der Ja/Nein-Filter (`quality.mjs`) und die alte Wertung (`metrics` mit `score` und der
  Zählung `mixed`). Kandidaten liefert der Generator, Reihenfolge und Grade `ordne-level.mjs`. Mit Ticket 08 von Noas
  Geschichte sind die Werkzeuge weggefallen, die nur der Reihe als Ablauf des Spiels dienten (im Verlauf bis
  `944b038`): der Austausch (`ordne-level.mjs --austausch`: ein Level ersetzen und das alte entfernen; heute liegt ein
  Level, das nicht in die Geschichte kommt, im Vorrat) und die Wahl einer Gruppe des Ausbaus auf 500 Level nach dem
  Bedarf der Reihe (`ausbau.mjs wahl` und `bedarf`). Die Reihe selbst bleibt als Folge aller flachen Level aus Spiel
  und Vorrat (ADR 0005): Referenz der KI-Tester, Platz im Vorrat, Massstab der Grade, und neue Level bekommen in ihr
  ihren Platz und Grad.
  `solver.mjs` folgt den Strahlen und probiert nur Elemente durch, die Licht bekommen (schneidet ab, sobald ein Ziel
  falsches Licht erhält; die Verfolgung macht nach jeder gesetzten Stellung dort weiter, wo sie angehalten hat), und
  zählt Lösungen, Suchknoten, Blätter, Fast-Lösungen und Rateschritte; `clicksTo` zählt die Klicks bis zu einer Lösung.
  Ist nur die Eindeutigkeit gefragt, hält `solve(level, { unique: true })` bei der zweiten Lösung an;
  `show.mjs` zeigt Level als Textfeld, Start und Lösung, mit Grad, drehbaren Elementen, Zielen und Klicks und, wo sie
  vorliegt, der Beurteilung: die JSON-Zeilen von `generiere.mjs` mit Schwierigkeit, Spielwert und Kernideen
  (`… generiere.mjs leicht --anzahl 3 | node tools/show.mjs`), ein Level aus dem Spiel mit `--level <platz|name>`
  (Platz in LEVELS ab 1, das Tutorial mitgezählt). `--beurteilen` beurteilt Level ohne mitgegebene Beurteilung (alle
  Regeln, mit ihrem Grad; je Level bis einige Sekunden) und nennt dazu die Ausschlussgründe;
  `ordne-level.mjs [--ausbau datei] [--schreiben] [--json datei]` (über `leise.sh`, etwa 40 s) ordnet die flachen Level
  der Reihe aus Spiel und Vorrat nach der Schwierigkeit der Beurteilung und legt ihren Grad fest (Ticket 15, damals die
  150 Level im Spiel). Gerechnet wird von der heutigen Reihenfolge aus (`beurteilung/heutige-reihenfolge.json`);
  Verschiebungen bis 10 Plätze werden übernommen, weiter wandernde Level bleiben an ihrem Platz und stehen auf der
  Prüfliste der KI-Tester. Mit den zählenden Urteilen der KI-Tester (Ablauf 2, Läufe `pruefung-…`; Ticket 16) kommt ein
  Level der Prüfliste nur auf den Platz der Formel, wenn beide zustimmen: Der Platz der Formel liegt für beide in ihrem
  Bereich der Einordnung oder näher daran als der alte Platz. Sonst bleibt es. Dieser Entscheid bleibt fest, auch wenn
  neue Level die Formel verschieben: An dem Platz der Formel beim Entscheid, den `levelliste.json` festhält
  (`prueflisteFormel`, Ticket 26), misst sich, ob das Level auf der Prüfliste steht, und mit ihm rechnet die Zustimmung;
  ein Level, das erst später darüber kommt, braucht ein Urteil, und sein Platz der Formel kommt dazu (`festePlaetze`).
  Von dort, wo es steht, gilt die eigene Korrektur der KI-Tester nach der Regel von `merge` (höchstens 5 Plätze, nie
  über eine Gradgrenze; am alten Platz das Ergebnis aus dem Protokoll, am Platz der Formel dieselbe Regel mit dem Grad
  dort). Lehnen beide ab, wird es nicht korrigiert und kommt auf die Duldungsliste (Grund `abgelehnt`). Häuft sich
  danach dieselbe Haupt-Kernidee auf einer Seite (mehr als zweimal ohne die Duldungsliste), rückt ein Level im eigenen
  Grad um höchstens 3 Plätze: zuerst eines der betroffenen, sonst ein anderes derselben oder einer Nachbarseite, eines
  der Duldungsliste vor einem anderen; dann der kürzeste Zug, der spätere Platz, nach hinten. Kein Zug schafft eine neue
  Häufung oder bricht Grad, Mittel je 10 Level oder die Korrekturen der KI-Tester: Kein korrigiertes Level steht mehr
  als 5 Plätze von seinem Platz davor, weder nach den Korrekturen (die einander schieben, wenn sie nahe beieinander
  liegen) noch am Ende (`zuWeitKorrigiert`, Ticket 24). Der Bericht zeigt Prüfliste samt Entscheid je Level, die Züge
  der Häufungsregel, Schwellen und ihre Herleitung, die Duldungsliste nach Grund und Grad samt neuen Leveln darauf und
  die Regeln der Levelliste, darunter jedes korrigierte Level, das zu weit steht (Platz davor, nach den Korrekturen, am
  Ende). `--schreiben` trägt Reihenfolge und Grad in Spiel und Vorrat ein (seit Ticket 08 von Noas Geschichte über
  `inGanzerFolge` in `vorrat.mjs`: die Level im Spiel in `FLACH` in `src/daten/level.js`, die übrigen im Vorrat an ihrem
  Platz; was im Spiel steht, bleibt im Spiel, was im Vorrat liegt, im Vorrat, vorher zurückholen muss man nichts) und
  Duldungsliste, Prüfliste und `prueflisteErledigt` in `tools/levelliste.json`; die ursprüngliche Duldungsliste, die
  entfernten Namen, `prueflisteFormel` und die Gruppe `behalten` (Ticket 24, nur ohne Level, die es nicht mehr gibt)
  bleiben, wie sie sind, nur einmal, in Ticket 16, wuchs die ursprüngliche Liste um begründete Ergänzungen (`ergaenzt`:
  Level, die beide KI-Tester ablehnen, und Level, die durch ihr Urteil in einen Grad kommen, in dem sie eine Regel
  verletzen). Bleibt eine Häufung offen oder steht ein korrigiertes Level zu weit, schreibt es nicht, auch mit
  `--ausbau`. Ein zweiter Lauf ändert nichts. Die Regeln (Reihenfolge, Urteile der KI-Tester, Häufungsregel, Grade
  entlang der Reihenfolge, Gründe der Duldung, Toleranzen) stehen in `levelliste.mjs`, gemeinsam für Skript und Test.
  Austausch (Tickets 23–26, mit Ticket 08 von Noas Geschichte weggefallen): Ein neues Level ersetzte ein altes; es hat
  keinen heutigen Platz, wandert also nicht und steht nach der Formel, die KI-Tester beurteilten es in einem Lauf
  `ersatz-…` unter dem Namen „Kandidat <Abdruck>“ (`leveldaten.mjs`), von dort gilt ihre Korrektur wie am Platz der
  Formel. Die ersetzten stehen mit ihrem Namen auf `entfernteNamen` und mit ihren Leveldaten als feste Kopie für die
  Eichung in `beurteilung/entfernte-level.json` (so bleiben die 150 der heutigen Reihenfolge der Massstab, ADR 0001).
  Ausbau (`.scratch/500-level/`, einst auf 500 Level in Gruppen zu 35, seit Noas Geschichte neue Level für sie): Die
  Level vor dem Ausbau sind der Bestand und stehen untereinander genau wie ohne ihn; die Level des Ausbaus (`ausbau` in
  `levelliste.json`) fügt `levelliste.mjs` (`fuegeEin`) nach der Formel dazu, ihr Grad folgt der Schwelle, beurteilt
  werden sie in Läufen `ausbau-…`. `--ausbau datei` (eine JSON-Liste oder eine JSON-Zeile je Eintrag `{ level, name,
  auftrag, seed, schwierigkeit }`, die Leveldaten etwa von `generiere.mjs`, `schwierigkeit` die Ziel-Schwierigkeit
  `[von, bis]` des Auftrags) rechnet mit den Kandidaten: Platz, Grad, Haupt-Kernidee und Regeln je Kandidat; `--json`
  liefert die ganze Reihenfolge als Vorschau für `prepare.mjs --kandidaten`; `--schreiben` setzt sie mit ihren Namen
  und der Herkunft im Kommentar ein (Auftrag, Seed, Ziel-Schwierigkeit, mit der `generiere.mjs <auftrag> --seed S
  --anzahl 1 --schwierigkeit VON,BIS` es nachbaut; nur mit einem zählenden Urteil ohne Ablehnung; eine Freigabe der
  Namen durch den Nutzer braucht es nicht), und zwar in den Vorrat, solange dort flache Level liegen (in die Geschichte
  bringt sie `geschichte.mjs spiel`, siehe «Wahl für Noas Geschichte»);
  `ausbau.mjs pool <auftrag …> --aus datei [--seed S] [--seeds M] [--jobs N] [--schwierigkeit VON,BIS] [--wuerfel]`
  sammelt Kandidaten des Generators parallel (über `leise.sh`), mit `--wuerfel` im Würfel 7 × 7 × 5 (bis Ticket 08
  wählte `ausbau.mjs wahl` daraus eine Gruppe nach dem Bedarf der Reihe, `bedarf` zeigte ihn; heute wählt der
  Koordinator die Kandidaten für den Lauf der KI-Tester und `geschichte.mjs wahl` die für die Geschichte);
  Würfel-Level (`.scratch/wuerfel-500/`): `wuerfel.mjs wahl <gruppe> --pool datei[,…] --aus datei [--behalte datei]
  [--ohne name,…]` wählt die neuen einer Gruppe (Bedarf je Grad nach der Spec, gegen Häufungen der Haupt-Kernidee),
  `wuerfel.mjs bedarf` zeigt Bestand und Bedarf; `ordne-wuerfel.mjs [--kandidaten datei] [--json datei]
  [--schreiben]` ordnet die Würfel-Level nach den Regeln in `wuerfelliste.mjs` (eine eigene Reihenfolge ohne Bestand,
  Grade nach der Schwelle, Korrekturen der KI-Tester aus Läufen `wuerfel-…`) und schreibt sie in Spiel und Vorrat
  (`WUERFEL` in `src/daten/level.js`, `tools/vorrat/wuerfel.js`; neue in den Vorrat, solange
  dort Würfel-Level liegen);
  `aehnlichkeit.mjs` misst, wie ähnlich zwei Level aufgebaut sind (Elemente mit Art, Farbe und Zelle, das Höchste über
  die acht Symmetrien des Felds, im Würfel über seine 48 mit der Drehachse von Spiegel, Prisma und Kombinator); ab 0,5
  ist ein neues Level zu ähnlich (ohne Argument: die ähnlichsten Paare in Spiel und Vorrat;
  heute drei Fast-Doppel aus dem Austausch, Dreiklang – Delta, Karussell – Rundflug und Fokus – Türkis);
  `bench.mjs <generator|trace|solver …> [gruppe …] [--seeds N] [--jobs N] [--unique] [--save datei] [--compare datei]`
  misst die Effizienz in CPU-Zeit, nicht mit der Wanduhr (der Deckel von `leise.sh` verzerrt sie): angenommene Level
  je CPU-Stunde je Gruppe mit festen Seeds, die mittlere Zeit je Aufruf der Strahlregel auf zufälligen Stellungen
  aller Level und die Zeit des Lösers über alle Level, dazu über die Level mit Blockern ohne diese (sie haben dann
  mehrere Lösungen). `--unique` misst den Löser im Modus unique: Auf den eindeutigen Leveln sucht er gleich weit, ohne
  Blocker hält er bei der zweiten Lösung an. Die Gruppen sind die Aufträge des Generators wie `leicht` und
  `leicht-mischziel`, die Abnahme ist die Beurteilung (`--generator neu --accept beurteilung`, Standard und seit Ticket
  21 einzige Wahl): genau eine Lösung und die Beurteilung bestanden, mit dem Grad nach der Schwierigkeit; die Messung
  zählt auch je Grad und je Grad und nötiger Kernidee, je Grad und Haupt-Kernidee (Ticket 28) und nennt die Quartile
  der Schwierigkeit. Der Generator gibt
  seine Beurteilung mit, die Abnahme beurteilt seine Level darum nicht ein zweites Mal. Ohne Gruppe bricht es ab und
  nennt die Aufträge (alle 28 zusammen kosteten ab „mittel“ viele CPU-Stunden); `--seeds` ist ohne Angabe 2000, der
  Umfang der Messung in Ticket 20 (bis Ticket 21 60 000 je Profil). Die Ausgangszahlen
  stehen in `tools/bench-baseline.json` (der alte Generator nach Profilen mit seiner eigenen Abnahme, bis Ticket 21
  `--generator alt --accept alt`). `--save` fügt einzeln gemessene Gruppen einer Datei hinzu, wenn Generator, Abnahme,
  Seeds, `--jobs` und Rechner gleich sind. `--compare` zeigt den Gewinn je Gruppe, je Grad und gesamt und meldet
  andere angenommene Level (Fingerabdruck), eine andere Knotenzahl des Lösers und andere Strahlbilder. Über einen
  Generatorwechsel (gegen eine gespeicherte Messung des alten Generators) vergleicht es je Auftrag mit den Leveln
  desselben Grads und derselben nötigen Kernidee des alten, über alle Profile und im besten Profil; einen Faktor gibt
  es nur bei derselben Abnahme mit Grad. Die Prüfsumme der Strahlbilder erfasst Art, Farbe und Element der Ereignisse,
  Treffer, Mischungen, „gelöst“ und die auf 1e-6 gerundeten Endpunkte, aber keine Normalen und Längen; das Verhalten
  sichert weiterhin der Golden-Test. Die CPU-Zeit hängt von
  der Zahl der Prozesse und von der übrigen Last auf dem Rechner ab (beobachtet 20 bis 50 %): Verglichen wird nur mit
  gleichem `--jobs`, am besten vorher und nachher in derselben Sitzung (alter Stand etwa in einem `git worktree`).
  Das Skript läuft nur mit tiefster Priorität und bricht bei einem höheren Deckel ab: den Generator mit
  `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator <gruppe …> [--seeds N]`, Strahlregel und Löser über
  `leise.sh` mit 20 %;
  `leise.sh <befehl …>` (mit `leise.ps1`, nur unter Windows) startet einen Befehl samt allen Unterprozessen in einem
  Job-Objekt mit harter CPU-Obergrenze und Priorität „Leerlauf“, damit der Rechner bedienbar bleibt. Vorgabe sind 20 %
  der ganzen Maschine; der Generator und die Vorbereitung der KI-Tester (`prepare.mjs`, Screenshots) dürfen
  `LEISE_CPU=50`, mehr nimmt `leise.sh` ohne `LEISE_MAX_CPU` nicht an. Die Grenze gilt je Lauf: Leichte Läufe (unten)
  laufen bis zu vier gleichzeitig, jeder mit seiner Grenze; wo das zu viel ist, `LEISE_LEICHT_MAX=1` (dann wie bis
  Ticket 13 des Umbaus alles nacheinander). Ein Rechner, auf dem mehr erlaubt ist,
  hebt die Obergrenze lokal mit der Umgebungsvariablen `LEISE_MAX_CPU` an (Standard 50; nicht versioniert, etwa in
  `.claude/settings.local.json` unter `env`, das gitignored ist), etwa `LEISE_MAX_CPU=65 LEISE_CPU=65 sh tools/leise.sh
  …`. Dieselbe Grenze prüfen Generator, Messskript und Screenshots (`tools/deckel.mjs`). Alle schweren Läufe (Tests,
  Messungen, Screenshots, Generator) laufen darüber, auch aus parallel arbeitenden Worktrees, über eine Sperre
  (`/tmp/prisma-leise.lock`) mit zwei Arten von Läufen (Ticket 13 des Umbaus; welcher Lauf welche Art ist: Tabelle im
  Abschnitt Tests): **allein** (Vorgabe, Läufe mit Bildzeiten oder Messungen) startet erst, wenn kein anderer Lauf mehr
  läuft, und solange er läuft, startet keiner („leise: warte auf laufenden Lauf“); **leicht** (`LEISE_ART=leicht`)
  laufen bis zu `LEISE_LEICHT_MAX` (Vorgabe 4) gleichzeitig und halten die Sperre gemeinsam (der letzte räumt sie weg),
  so wartet auch eine ältere Kopie von `leise.sh` auf sie. Warten mehrere alleinige, geht die kleinere Zahl
  `LEISE_VORRANG` vor (Nummer des Tickets, ohne Angabe 500). Ein leichter Lauf lässt jedem wartenden alleinigen mit
  gleicher oder kleinerer Zahl den Vortritt; einen mit grösserer Zahl, der schon vor ihm wartete, überholt er höchstens
  `LEISE_FRIST` Minuten (Vorgabe 10) lang, danach lässt ihn jeder leichte vor. Ein wartender leichter Lauf trägt sich
  in die Warteschlange ein (`<vorrang>.leicht.<pid>`, Ticket 14), so lässt ihm jeder alleinige mit grösserer Zahl den
  Vortritt, auch eine Kette alleiniger Läufe eines anderen Agenten; solange er selbst einen alleinigen vorlässt, nimmt
  er den Eintrag zurück (sonst warteten beide aufeinander). Stirbt der Halter einer Gruppe hart (`taskkill /F`), trägt
  sich binnen 5 s ein anderer lebender leichter Lauf als Halter ein (Wache je leichtem Lauf). Ein Aufruf innerhalb eines
  Laufs läuft direkt, eine verwaiste Sperre (Halter tot und kein lebender leichter Lauf darin, oder über eine Minute
  ohne pid-Datei) wird übernommen, unter der Sperre der Gruppe (`<sperre>.leicht`). `node tests/leise.test.mjs` prüft
  das mit eigenen Pfaden (`LEISE_SPERRE`, `LEISE_WARTE`), nie an der echten Sperre;
  `chrome.mjs` steuert Headless-Chrome über das DevTools-Protokoll (für `tests/screenshot.mjs` und die KI-Tester;
  mit `fenster` sichtbar, für Messungen im echten Bildschirmtakt; `on` hört auf Ereignisse wie die eines Traces).
- **Beurteilung** (`tools/beurteilung/`, nur für die Entwicklung; ADR 0002, Spec „Beurteilung“ und „Feldform“): ein
  Modul mit einem Einstieg, `beurteile(level, { grad, teuer })` aus `index.mjs`. Es liefert Schwierigkeit, Spielwert,
  die Teilwerte zum Schliessen, Kernideen samt Haupt-Kernidee, Mischziele und Ausschlussgründe (je mit Glossarbegriff
  und Begründung).
  `offen` nennt die Teile, die noch keine Regel berechnet. `grad` gibt den Schwierigkeitsgrad vor, bis die Beurteilung
  ihn selbst bestimmt (Tickets 12 und 15). `teuer: false` lässt die Regeln weg, die lange rechnen; sie stehen dann in
  `offen`. `zwischenstand` (eine Map) hält fest, was die Regeln einmal je Beurteilung rechnen; eine zweite Beurteilung
  desselben Levels mit demselben Grad und derselben Map rechnet es nicht nach. So kostet eine Vorprüfung mit
  `teuer: false` die volle Beurteilung danach nichts (Generator, Ticket 18). Für ein anderes oder inzwischen
  verändertes Level oder einen anderen Grad wirft sie.
  - **Feldform** (`feldform.mjs`): Zellen, Nachbarn, Richtungen, Drehachse und mögliche Stellungen eines Elements und
    was es in einer Stellung mit einem Strahl macht (`spiegeln`, `brechen`, `ausgang`, aus der Strahlregel), dazu die
    Drehungen eines Levels um die Drehachse (`drehungen`, Ticket 12). Für den Generator (Ticket 18) liefert sie die
    Leveldaten eines Elements in einer Zelle (`element`) und die Angaben des Felds (`rahmen`, im Feld 7 × 7 keine),
    dazu die Drehachsen, die ein Element haben kann (`drehachsen`, im flachen Feld nur y; `element` nimmt eine davon
    als `drehachse`, Ticket 22). Nur sie kennt Koordinaten und die acht Richtungen; eine Zelle ist ein Schlüssel wie in
    der Lösung („x,z“). Die Nachbarn stehen je Feldform in einer Tabelle, und `feldformVon` legt die flache Feldform je
    Grösse nur einmal an (eingefroren, alle Beurteilungen teilen sie): Das Spielermodell fragt die Nachbarn in jeder
    Beurteilung zehntausendfach ab. Auf main gibt es nur die flache Feldform, eine weitere (Würfel) kommt in
    `feldformVon` dazu.
    Auf dem Würfel-Branch ist das die Würfel-Feldform (`feldform-wuerfel.mjs`, Ticket 14) für Level mit `dim: 3`:
    Zellen „x,y,z“, 18 Richtungen, Drehachse je Element; für den Generator (Ticket 22) auch `element` und `rahmen`
    (`{ dim: 3, size }`), die drei Drehachsen und die Nachbarn aus einer Tabelle, je Grösse eine eingefrorene.
  - **Regeln:** Jede liegt in einer eigenen Datei: `mischziele.mjs`, `schliessen.mjs`, je Ausschlussgrund eine in
    `ausschluesse/`, je Kernidee eine in `kernideen/`, dazu `schwierigkeit.mjs` und `spielwert.mjs`. Sie steht mit
    einer Zeile in `regeln.mjs`, unter der Kommentarzeile ihres Tickets. Wie eine Regel aussieht, steht im Kopf von
    `index.mjs`. Was mehrere Regeln brauchen (Strahlbilder der Lösungsstellung in `loesungsstellung.mjs`, das
    Spielermodell in `spielermodell.mjs`, die Suche ohne Abschneiden in `suche.mjs`), rechnet `ctx.merke` einmal je
    Beurteilung.
  - **Mischziele:** Gemessen in der Lösungsstellung. Ein Ziel mit Mischfarbe ist ein Mischziel, wenn es ohne die
    mischenden Kombinatoren (dort Blocker, bis keiner mehr mischt) keinen Strahl bekommt, der seine Farbe schon hat; so
    zählen Weiss aus einer weissen Quelle und Gelb aus einem Gelbfilter nicht. Es ist aus zwei Quellen, wenn mindestens
    zwei Quellen je allein Licht darauf bringen (die übrigen schlucken dabei als Blocker). Das ist noch nicht die
    Kernidee „Mischziel aus zwei Quellen“ (Ticket 10). Die alte Zählung `mixed` in `metrics` (Ziele mit Mischfarbe, 129
    statt 71 Level) ist mit der alten Wertung in Ticket 21 entfallen.
  - **Scheinmischung und Knäuel** (`ausschluesse/`, alle Grade, in der Lösungsstellung): Scheinmischung je Kombinator
    mit Licht in den Fällen a–c der Spec; wohin seine Mischung läuft, zeigt ein Strahlbild, in dem nur sie leuchtet.
    Knäuel über die Nachbarn der Feldform: benachbarte drehbare Elemente und kurze Strahlabschnitte (`abschnitt`),
    beide Werte auf zwei Stellen gerundet wie in der Neuzählung.
  - **Füllteil und Zerfall** (`ausschluesse/`, Ticket 08) gelten erst ab „mittel“; ohne vorgegebenen Grad wie ab
    „mittel“, und die Begründung sagt es. Ein Füllteil ist ein Strang über höchstens 3 Spiegel, bei dem keine Stellung
    seiner Spiegel das Licht fremder Strahlen auf anderen Zielen ändert. Für den Zerfall hängen Ziele über gemeinsame
    drehbare Elemente (an ihrer Stelle ein Blocker) und gemeinsame Mischziele zu Gruppen zusammen.
  - **Spielermodell, Schliessen und Probieren** (Ticket 09): Das Spielermodell aus den Reviews folgert vorwärts und
    rückwärts, mit Horizont 2 und mit vollem Überblick, und braucht bei Stillstand eine Fallunterscheidung. Die
    drehbaren Elemente geht es in der Reihenfolge der Zellen durch, damit die Reihenfolge in den Leveldaten nichts
    ändert. Der Teil `schliessen` liefert k2, kInf, die längste Kette und die Fallunterscheidungen, dazu die weiten
    Fast-Lösungen der Suche ohne Abschneiden (mindestens 3 Elemente anders als in der Lösung). Probieren gilt in allen
    Graden: mehr als 60 ‰ weite Fast-Lösungen, oder Raten mit kInf > 6 oder Kette > 38. Beide Regeln sind teuer; die
    Suche braucht auf den 150 rund 25 s (140 Urknall bis 3,6 s), das Spielermodell gut 1 s.
  - **Kernideen Mischziel aus zwei Quellen, Abschalten, Farben abzählen** (je eine Datei in `kernideen/`): Jede zählt nur,
    wenn die Lösung von ihr abhängt. Die Prüfung „nötig“ in `noetig.mjs` (auch für Ticket 11) nimmt der Lösung den
    Beitrag der Kernidee weg (`gegenprobe`, `wegZu`) und fragt mit einer Suche des Lösers je Quelle, was jede Quelle
    allein in irgendeiner Stellung erreicht (`allein`). Jeder Fund nennt in der Begründung Ziel, Quellen und Licht. Die
    drei Regeln brauchen auf den 150 zusammen rund 3–4 s, vor allem für die Suchen je Quelle und die Wege der
    Zwischenstände.
  - **Kernideen Sammelstelle, Falle, Lockvogel und die Haupt-Kernidee** (Ticket 11; je eine Datei in `kernideen/`,
    dazu `haupt-kernidee.mjs`), wieder nur, wenn die Lösung von ihnen abhängt:
    - Sammelstelle: Aus mindestens zwei Richtungen fällt Licht in ein Prisma, und ohne den Zulauf aus einer davon
      verliert ein Ziel seine Farbe, für mindestens zwei Richtungen. Die Wegnahme `ohneZulauf` in `noetig.mjs` setzt an
      die Stelle des Prismas einen Blocker und bricht das Licht der übrigen Richtungen selbst weiter (`refractInPrism`).
      Ohne Wegnahme muss sie die Lösung wiedergeben; das prüft die Regel an jedem Prisma (ADR 0003).
    - Falle: ein naheliegender Zwischenstand wie beim Abschalten, bei dem ein Spiegel oder Prisma in der Lösung anders
      steht. Bringt die Lösung dasselbe Licht derselben Quelle auf anderem Weg hin, ist es eine Falle, nimmt sie es dem
      Ziel weg, Abschalten; beides zugleich gilt nie. Nötig ist sie, wenn eine weite Fast-Lösung sie enthält (Holzweg)
      und das Spielermodell mit Horizont 2 sie nicht auf den ersten Blick widerlegt (`aufDenErstenBlick`).
    - Lockvogel: ein festes Teil abseits der Lösung, das in mindestens 10 % der Strahlbilder der Suche ohne Abschneiden
      Licht bekommt (wie früher in `quality.mjs`, jetzt auch Filter). Nötig ist er, wenn er auch in die Irre führt (in
      mindestens 10 % der Holzwege Licht, mindestens in einem) und das Level ohne ihn (ein weisser Filter an seiner
      Stelle) eine zweite Lösung hätte. Ein Blocker, der nur eine zweite Lösung verhindert, zählt also nicht. Die Suche
      zählt dafür das Licht auf den festen Teilen mit (`licht`, je Fast-Lösung `feste`).
    - Haupt-Kernidee (Teil `hauptKernidee`, Begriff „Kernidee“): unter den nötigen die, die dem Schliessen am meisten
      abverlangt, nach der festen Rangfolge Falle, Abschalten, Farben abzählen, Sammelstelle, Lockvogel, Mischziel aus
      zwei Quellen; ohne nötige Kernidee ist `begriff` null. Begründung der Rangfolge im Kopf der Datei.
    - Falle, Lockvogel und Haupt-Kernidee sind teuer. Der Lockvogel braucht auf den 150 rund 5 s für die Suchen nach
      einer zweiten Lösung, die übrigen Regeln zusammen unter 0,1 s.
  - **Schwierigkeit** (Ticket 12, `schwierigkeit.mjs`, ADR 0001): Der Wert ist die Summe von vier Teilwerten, je mit
    seinem Anteil am Wert und den Messwerten (Gewicht mal Messwert).
    - Denkarbeit, die Summe aus Spielermodell, Farblogik und Kernideen:
      - Spielermodell: Rückschlüsse (drehbare Elemente, die es rückwärts vom Ziel her entscheidet), Fallunterscheidungen
        (k2 + kInf), längste Kette und Stillstand (Horizont 2 steckt). Gemittelt über die vier Drehungen des Levels um
        die Drehachse (`drehungen` der Feldform, `spielermodellJeDrehung`), denn die feste Reihenfolge der Zellen ist
        willkürlich; gedreht ist es dasselbe Rätsel und hat dieselbe Schwierigkeit.
      - Farblogik: die Farboperationen der Lösung, je Mischziel, nötigem Filter (an seiner Stelle ein weisser Filter)
        und nötigem Prisma, das Licht aus mindestens zwei Grundfarben bricht.
      - Kernideen: die Zahl der nötigen Kernideen.
    - Zusammenspiel: derselbe Teilwert wie im Spielwert (`zusammenspiel` aus `spielwert.mjs`).
    - Weglänge: die Zahl der geraden Strahlabschnitte in der Lösungsstellung, also der Schritte, die der Spieler
      verfolgt.
    - Grösse: höchstens 10 Punkte, voll ab 12 drehbaren Elementen.
    - Grenzen (`GRENZEN`, beim Eichen eingehalten): Die Weglänge trägt im Mittel höchstens ein Viertel und bei keinem
      Level mehr als ein Drittel, die Denkarbeit im Mittel mindestens die Hälfte. Auf den 150 tragen im Mittel die
      Denkarbeit 56,9 %, das Zusammenspiel 7,0 %, die Weglänge 25,0 % und die Grösse 11,1 %.
    - Die Gewichte stehen in `schwierigkeit-gewichte.json`.
      `sh tools/leise.sh node tools/eiche-schwierigkeit.mjs [--bericht]` stellt sie an den Leveln der geraden Plätze
      der heutigen Reihenfolge ein (feste Namensliste `heutige-reihenfolge.json` seit Ticket 15, denn im Spiel stehen
      die Level jetzt in der Reihenfolge der Formel) und schreibt die Datei neu: nichtnegative kleinste Quadrate;
      hielte sie die Grenzen nicht ein, wird das Gewicht der Weglänge festgehalten und so gross gewählt, wie die
      Grenzen erlauben. Es zeigt die Anteile und beide Masse je Bereich; `--bericht` dazu grösste Abweichungen und die
      Rangkorrelation mit dem Spielwert (den Vergleich mit der alten Wertung gibt es seit Ticket 21 nur noch in ADR
      0001). Eichen und Prüfen stehen in `schwierigkeit-eichung.mjs`, gemeinsam für Skript und Test.
    - Abnahme (Spec, ADR 0001), gekreuzt: an den geraden Plätzen eichen und die ungeraden vorhersagen, dann umgekehrt;
      Rangkorrelation über alle mindestens 0,85, je 30er-Bereich über alle 30 Level mindestens 0,3, auf zwei Stellen
      gerundet wie beim Knäuel. Erreicht: über alle 0,93, je Bereich knapp in 91–120 (0,296, gerundet 0,30). Der Test
      zeigt auch das bisherige Mass, die 15 nicht geeichten Level je Bereich.
    - Teuer, weil sie alle Kernideen braucht; das Spielermodell auf den drei weiteren Drehungen kostet auf den 150
      zusammen rund 3 s.
  - **Schwierigkeitsgrad** (Ticket 15, `grad.mjs`): `gradVon(wert)` nach festen Schwellen `SCHWELLEN` auf der
    Schwierigkeit: mittel ab 43, schwer ab 58,5, sehr schwer ab 87. Je die Mitte der breitesten Lücke zwischen zwei
    Leveln höchstens 5 Plätze von der vorläufigen Grenze (30 / 70 / 40 / 10), auf halbe Punkte gerundet. Kein Teil von
    `beurteile`; wie der Grad entlang der Reihenfolge gilt, regelt `tools/levelliste.mjs`.
  - **Spielwert** (Ticket 13, `spielwert.mjs`): `{ wert, teilwerte }`, der Wert von 0 bis 100 aus vier Teilwerten von 0
    bis 1 mit den Gewichten Schliessen 34, Kernidee 33, Farblogik 17 und Zusammenspiel 16.
    - Schliessen: Anteil, den das Spielermodell mit Horizont 2 folgert, × (1 − kInf / 7) × (1 − weite Fast-Lösungen in
      ‰ / 60), beides an den Schwellen von Probieren gemessen.
    - Kernidee: Die erste nötige Kernidee bringt 0,8, jede weitere 30 % des Rests.
    - Farblogik: Anteil der Ziele, die ein Mischziel sind oder Licht einer Quelle bekommen, deren Farbe ein Filter oder
      ein Prisma beschneiden muss.
    - Zusammenspiel: Stellen je drehbares Element, höchstens 1. Stellen sind Elemente, die mehrere Strahlen nutzen,
      gemeinsame Mischziele und Kreuzungen; dafür liefert die Feldform `durchlauf`.
    - Unter `MINDEST_SPIELWERT` (60) kommt ein Level ab „mittel“ nicht ins Spiel. Schliessen mit einer nötigen
      Kernidee ergibt ohne Bonus 60,4.
    - **Eichung** an der Eichmenge (`spielwert-eichmenge.mjs`): Gefühl der KI-Tester aus dem Protokoll und der
      Spieler-Tester aus den Reviews 4 und 6 (`spass-reviews.json`, samt Leveldaten aus den Pools übernommen).
      `sh tools/leise.sh node tools/eiche-spielwert.mjs` (etwa 35 s) berichtet die Brücken, die
      Rangkorrelation mit Kreuzprüfung, das Gefühl unter und über möglichen Schwellen und die Level der 150 unter dem
      Mindest-Spielwert. Begründung der Werte in Ticket 13.
    - Teuer, weil Schliessen und die Kernideen es sind.
  - **Auf mehreren Threads** (`parallel.mjs`): `await beurteileAlle([{ level, opts }, …])` beurteilt viele Level wie
    `beurteile(level, opts)` auf `worker_threads` und gibt die Beurteilungen in der Reihenfolge der Aufträge zurück,
    bitgleich zum Lauf auf einem Thread. Vorgabe 4 Threads, so viel lässt der Deckel von `leise.sh`;
    `BEURTEILUNG_THREADS` übersteuert, 1 heisst ohne Worker. Jeder Thread holt sich das nächste Level, sobald er frei
    ist. Level und Beurteilungen sind reine Daten und kommen per structured clone unverändert über die Thread-Grenze.
    Genutzt vom Test der Beurteilung und von den Messskripten `eiche-spielwert.mjs` und `eiche-schwierigkeit.mjs`.
- **Generator** (`tools/generator/`, nur für die Entwicklung; ADR 0004, Spec „Generator“ und „Effizienz“; Tickets
  18–20): ein Einstieg, `generiere({ grad, kernidee, seed, feldform, schwierigkeit })` aus `index.mjs`. Ein Auftrag
  ergibt `{ level, beurteilung }` mit Leveldaten wie in LEVELS (ohne Namen, mit `grad`, in der Startstellung) und ihrer
  Beurteilung, oder `{ level: null, grund }`. Derselbe Auftrag ergibt dasselbe Level. Er kennt alle vier Grade
  (Ticket 20), je ohne Kernidee und mit jeder der sechs Kernideen (`angebot()`, Ticket 19); ein anderer Auftrag wirft.
  `schwierigkeit` ist wahlweise eine Ziel-Schwierigkeit `[von, bis]` (beide eingeschlossen), die den Grad
  überschneidet; wirksam ist der Teil im Grad. Ohne sie gilt der ganze Grad.
  - **Ablauf** (für alle Grade gleich): Der Baustein der Kernidee (`bausteine/`, je Kernidee einer) baut sie gezielt
    in ein leeres Feld (`bau.mjs`); das Ergänzen setzt Quellen, drehbare Elemente am Ende der Strahlen, Filter, feste
    Spiegel und Ziele an die Strahlenden bis zur Grösse, die die Vorgabe des Grads würfelt (`vorgaben.mjs`, ersetzt die
    Profile); das Festigen (`schritte.mjs`) färbt die Ziele, nimmt Elemente ohne Licht weg, stellt die Eindeutigkeit mit
    höchstens zwei Reparaturen her (Blocker oder fester Spiegel; die Suche im Modus unique) und nimmt wirkungslose
    Elemente weg. Dann kommt eine Startstellung mit genug Klicks (sonst eine neue, statt zu verwerfen). Zuletzt die
    Beurteilung, zuerst günstig ohne die teuren Regeln, dann voll, über denselben Zwischenstand. Stimmen Grad oder
    Ziel-Schwierigkeit nicht, oder findet die Vorprüfung Füllteil oder Zerfall, macht ein Schritt des Verfeinerns
    (`verfeinern.mjs`) das Level leichter (ein drehbares Element weniger) oder schwerer (eines mehr, möglichst auf einer
    Kreuzung zweier Strahlen, das verbindet Stränge), höchstens `schritte`-mal je Grad, und es wird neu beurteilt. Ab
    „mittel“ setzt schon das Ergänzen einen Teil der Elemente auf solche Kreuzungen, und ein zu kleiner Bau wächst mit
    „schwerer“, bevor er verworfen wird.
  - **Kernideen ab „mittel“** (Ticket 28): Ein Strang der Kernidee darf kein Füllteil und nicht abgetrennt sein, ihre
    Ziele darf „schwerer“ aber nicht öffnen. Darum bauen Abschalten, Farben abzählen und Lockvogel ihre Stränge dort
    verbunden (siehe Bausteine), und „schwerer“ dockt Stränge dieser Bausteine an (`andocken.mjs`; beim Lockvogel
    findet es am Ring nichts dazu): fremdes Licht auf einen Spiegel des Strangs oder ein Prisma vor seine Quelle, die
    übrigen Grundfarben gehen zur Seite. Neue Quellen des Andockens, bei Farben abzählen und Lockvogel auch die des
    Ergänzens, teilen keine Grundfarbe mit den Zielen der Kernidee; auch das Andocken setzt nicht mehr Quellen, als der
    Grad erlaubt. Ein Versuch von „schwerer“ ohne ein drehbares Element mehr endet ab „mittel“ vor dem Festigen.
    „leicht“ bleibt bitgleich.
  - **Vier Bedingungen** für jedes gelieferte Level: genau eine Lösung, kein Grund der Levelliste (`levelliste.mjs`:
    kein Ausschlussgrund, ab „mittel“ eine nötige Kernidee und der Mindest-Spielwert), der verlangte Grad nach
    `grad.mjs` und die verlangte Kernidee nötig. Dazu hält es die Quellen der Vorgabe seines Grads ein, wie die Level
    im Spiel (ab „mittel“ 2–3 bzw. 2–4): Mehr setzt der Generator nicht (Ticket 28), und ein fertiges Level mit zu
    wenigen verwirft er mit „zu wenige Quellen“ (Ticket 29; das Festigen kann eine Quelle als wirkungslos wegnehmen).
  - **Keine wirkungslosen Elemente** (Regel des Generators, kein Ausschlussgrund): Jeder Filter nimmt einem Strahl der
    Lösung Farbe, gibt keine fremde Farbe ab und zählt für die Lösung; jede Quelle bringt einem Ziel Licht; jedes Ziel
    hängt von einem drehbaren Element ab; jeder feste Spiegel und Blocker zählt für die Lösung (ohne ihn bekäme ein Ziel
    anderes Licht, oder es gäbe eine zweite Lösung). Ausgenommen sind die Lockvögel ihres Bausteins (feste Teile der
    Kernidee ohne Licht in der Lösung): Sie prüft die volle Beurteilung mit dem Licht der Suche ohne Abschneiden.
  - **Bausteine** (`bausteine/`, Ticket 19; gemeinsame Hilfen in `wege.mjs`): Mischziel (zwei Quellen auf ein Ziel),
    Abschalten (ein Spiegel lenkt eine Quelle auf kurzem Weg aufs Ziel, die Lösung bringt dessen Farbe über zwei Spiegel
    aus einer zweiten), Farben abzählen (Ring aus vier Spiegeln, zwei Quellen derselben Grundfarbe erreichen jeden
    Ausgang, eine dritte von aussen), Sammelstelle (ein Prisma bricht zwei Zuläufe zu je einem eigenen Ziel), Falle
    (ein Prisma bricht eine Grundfarbe direkt aufs Ziel, die Lösung bringt sie über einen Spiegel; eine übrige
    Grundfarbe führt in der Falle über zwei Spiegel in den Holzweg) und Lockvogel (Ringtausch dreier Quellen, ein fester
    Spiegel oder Blocker verstellt ihn). Ab „mittel“ (Ticket 28): Beim Abschalten bekommt A immer ein eigenes Ziel,
    wo es geht über einen zweiten Spiegel, an den fremdes Licht andockt; Farben abzählen ist ein Weichenring (drei
    Quellen an drei Ecken, eine in einer Mischung mit der Grundfarbe); beim Lockvogel steht vor jedem Spiegel des Rings
    ein Prisma.
  - **Nur über die Feldform:** Zellen, Nachbarn, Richtungen, Stellungen und die Wirkung der Elemente kommen aus der
    Feldform des Auftrags, neue Elemente aus `feldform.element`, Quellen aus `feldform.quelleStatt`. Drehbare
    Elemente und feste Spiegel des Ergänzens bekommen eine der Drehachsen der Feldform (`feldform.drehachsen`,
    `bau.varianten`, Ticket 22): Gewählt wird unter allen Drehachsen und Stellungen, die das Licht sinnvoll
    weitergeben. Eine Quelle bekommt die erste Drehachse, mit der sie in die verlangte Richtung leuchtet. Im flachen
    Feld gibt es nur y, dort bleibt alles wie vorher; im Würfel lenkt ein Element mit waagrechter Achse Licht zwischen
    die Ebenen. Die Bausteine der Kernideen setzen ihre Spiegel und Prismen mit der ersten Drehachse. Der Test sucht im
    Quelltext nach Koordinaten (auch y), Drehachsen (`axis` der Leveldaten, Namen wie `'x'`) und Richtungen.
  - **Gedeckelt:** `generiere` bricht ab, wenn der Prozess nicht mit tiefster Priorität läuft oder `LEISE_CPU` über 50
    liegt (über `LEISE_MAX_CPU`, wo gesetzt). Aufruf:
    `LEISE_CPU=50 sh tools/leise.sh node tools/generiere.mjs <auftrag> [--anzahl N] [--seed S] [--seeds M]` (Aufträge
    `<grad>` oder `<grad>-<kernidee>` für die Grade `leicht`, `mittel`, `schwer`, `"sehr schwer"` und die Kernideen
    `mischziel`, `abschalten`, `abzaehlen`, `sammelstelle`, `falle`, `lockvogel`, etwa `mittel-abschalten`; ohne
    Auftrag nennt es alle) schreibt je Level eine JSON-Zeile `{ seed, level, schwierigkeit, spielwert, kernideen,
    hauptKernidee }` auf stdout und die Gründe der Seeds ohne Level auf stderr; mit `| node tools/show.mjs` als
    Textfeld. `--schwierigkeit VON,BIS` gibt dem Auftrag eine Ziel-Schwierigkeit, etwa für eine Lücke beim Austausch
    (Ticket 23). Messen: `LEISE_CPU=50 sh tools/leise.sh node tools/bench.mjs generator <auftrag …> [--seeds N]` (etwa
    `mittel mittel-mischziel`, ohne Angabe 2000 Seeds je Auftrag; ohne Auftrag nennt es alle).
  - **Erweitern:** Eine weitere Kernidee ist ein Baustein in `bausteine/` mit einer Zeile in `bausteine/index.mjs`
    (Glossarbegriff, was er mindestens setzt, `baue`), ein weiterer Grad eine Vorgabe in `vorgaben.mjs`. Ob eine
    Kernidee nötig ist, entscheidet immer die Beurteilung.
- **KI-Tester** (`tools/ki-tester/`, nur für die Entwicklung; ADR 0002, Spec „KI-Tester“): Zwei KI-Tester beurteilen
  Level aus Spielersicht, jeder als eigener KI-Agent. Das Repo bereitet ihre Eingaben vor und führt ihre Antworten
  zusammen; es ruft selbst keine KI auf. Ablauf 2 (Ticket 16) rechnet mit den Plätzen der Reihenfolge im Spiel und
  den Graden der Leveldaten; ein Platz bei `prepare.mjs` ist also ein Platz im Spiel. Ablauf 1 rechnete mit den
  Plätzen der heutigen Reihenfolge vor Ticket 15 (feste Namensliste `tools/beurteilung/heutige-reihenfolge.json`) und
  den vorläufigen Graden.
  - **Vorbereiten:**
    `LEISE_CPU=50 sh tools/leise.sh node tools/ki-tester/prepare.mjs <lauf> [platz …] [--kandidaten datei] [--anker]
    [--ohne-bilder] [--ohne-zwischenspeicher]`. Die Level heissen L1, L2 … (feste Mischung, der Platz bleibt
    verborgen), die Anker A1–A8 (`anchors.json`, je zwei pro Grad mit Begründung). `--anker` lässt auch die Anker
    beurteilen (Probelauf). `--kandidaten` nimmt neue Level ohne Platz in der Reihe auf (Ausbau, Läufe `ausbau-…`, mit
    der Vorschau aus `ordne-level.mjs --ausbau … --json`; einst Austausch, Läufe `ersatz-…`): eine JSON-Liste
    `{ formel, level }`; ohne Vorschau ist die Referenz der Platz nach der Formel mit dem Grad dort, im Protokoll heisst
    ein Kandidat „Kandidat <Abdruck>“, und seine Bilder kommen von einer Seite mit den Kandidaten am Ende
    von `LEVELS` (ihre Leveldaten in `<lauf>/seite/level.js`, ausserhalb von `eingabe/`; `shots.mjs` zeigt sie über
    `tools/spielserver.mjs`, alle Bilder kommen über http aus `dist/`).
    Die Bilder der Anker kommen aus einem Zwischenspeicher (`tests/output/ki-tester/anker-bilder/`), solange sich nichts
    geändert hat, was sie beeinflusst: Fingerabdruck des Ablaufs, `index.html`, `src/`, `vendor/`, `backgrounds/`,
    `shots.mjs`, `chrome.mjs`, der Chrome selbst, Leveldaten, Platz und Kennung des Ankers. `--ohne-zwischenspeicher`
    nimmt sie neu auf. Unter `tests/output/ki-tester/<lauf>/` entstehen:
    - `eingabe/`: das Feld als Text je Level (`field.mjs`: Raster, Elemente, Licht der Startstellung, ohne Lösung, Name
      und Markierung), Screenshots der Startstellung auf Desktop und Handy (`shots.mjs`) und das Schema der Antwort;
    - `antwort-A/` und `antwort-B/`: je KI-Tester ein eigener, leerer Ordner für seine `urteile.json`;
    - `auftrag-A.md`, `auftrag-B.md` (aus `brief.md`) und `lauf.json` für `merge.mjs` (Namen, Referenz je Level,
      Plätze der Anker, Reihenfolgen, Version, Fingerabdruck, Modell und Agent-Typ). Sie liegen ausserhalb der Ordner,
      die die KI-Tester lesen und schreiben.
  - **Beurteilen:** Der Koordinator startet je KI-Tester einen eigenen KI-Agenten mit frischem Kontext: Agent-Typ
    `general-purpose`, Modell `claude-opus-5-5` (so in `lauf.json`), als Prompt nur der Inhalt von `auftrag-A.md`
    bzw. `auftrag-B.md`. Keiner sieht Auftrag oder Antwort des anderen, und sie beurteilen in verschiedener Reihenfolge
    (A gemischt, B umgekehrt). Ein KI-Tester liest nur `eingabe/` und schreibt nur seine `antwort-A/urteile.json` bzw.
    `antwort-B/urteile.json`: eine Liste von Urteilen nach `answer.schema.json` (Aha-Moment, Lesbarkeit auf Desktop
    und Handy, Gefühl 1–5, Einordnung zwischen den Ankern, Ablehnung als Liste von Begriffen aus „Was Spass verdirbt“,
    Begründung).
  - **Zusammenführen:** `node tools/ki-tester/merge.mjs <lauf> [--trocken]` prüft beide Antworten und hängt je Level
    einen Eintrag an `protocol.jsonl` an: Datum, Version des Ablaufs, Modell und Agent-Typ, beide Einzelurteile samt
    ihren Listen der Ablehnung, Ergebnis und Begründung. Danach `node tests/ki-tester.test.mjs`. Die Regeln stehen in
    `protocol.mjs`:
    - **Ablehnen:** Die KI-Tester nennen jeden zutreffenden Begriff, unabhängig vom Grad. Abgelehnt ist ein Level, wenn
      beide mindestens einen Begriff nennen, der beim Grad der Referenz gilt (Füllteil und Zerfall erst ab „mittel“).
      Ein abgelehntes Level wird nicht verschoben.
    - **Bereich einer Einordnung:** zwischen zwei Ankern, beim Anker selbst und seinen Nachbarn, vor A1 oder nach A8.
      Liegt der Platz des Levels ausserhalb, will der KI-Tester bis an den nächsten Rand des Bereichs.
    - **Verschieben:** nur, wenn beide in dieselbe Richtung wollen: um den kleineren Wunsch, höchstens 5 Plätze und nie
      über eine Gradgrenze.
    - **Anker** sind eine feste Auswahl, keine festen Plätze (Spec, User Story 43: „je zwei feste Anker pro
      Schwierigkeitsgrad“). Fest ist, welche Level die Anker sind, damit „schwerer als A3“ für beide KI-Tester und
      in jedem Lauf dasselbe Level meint. Ein Anker wird durch sein eigenes Urteil nie verschoben. Andere Level dürfen an ihm vorbei; er rückt dann um einen Platz und bleibt in
      seinem Grad. Feste Plätze hiessen, dass ein Level vor einem Anker bleiben muss, obwohl beide KI-Tester es
      schwerer finden. Die Bereiche eines Laufs rechnen mit den Plätzen der Anker aus `lauf.json`.
    - **Probeläufe** (`probelauf-…`) zeigen nur den Ablauf; ihre Korrekturen gelten in Ticket 15/16 nicht.
  - **Referenz** (Ablauf 2): der Platz in der Reihenfolge im Spiel und der Grad aus den Leveldaten (`grad`). Die
    Grenzen eines Grads gibt die Reihenfolge vor (seit Ticket 16 leicht 1–31, mittel 32–105, schwer 106–137, sehr
    schwer 138–150); sie verschieben sich mit jeder Verschiebung. `prepare.mjs` hält je Level die Referenz und die
    Plätze der Anker in `lauf.json` fest, und `merge.mjs` rechnet mit ihnen. Für ein Level der Prüfliste ist das sein
    alter Platz; ob es auf den Platz der Formel kommt, entscheidet `ordne-level.mjs` aus den zählenden Einträgen (Regel
    in `levelliste.mjs`, siehe dort; nur Läufe `pruefung-…` zählen). Die Anker werden über den Namen gefunden; der Test
    prüft, dass jeder in seinem Grad am richtigen Ende bleibt: im äussersten Drittel, oder zwischen ihm und dem Ende
    taugt kein Level als Anker (kein Ausschlussgrund, nicht auf der Prüfliste).
  - **Version und Fingerabdruck:** `VERSION`, `FINGERPRINT` und `VERSIONS` in `protocol.mjs`; die Version steht in
    jedem Eintrag. Der Fingerabdruck umfasst alles, was die KI-Tester sehen: die Aufträge aus `brief.md` samt den Zeilen
    der Listen, `anchors.json`, das Schema, das Glossar und das Feld als Text der Anker samt ihren Leveldaten (ohne
    Name, Titel und Grad, die sie nicht sehen; den Titel bringt Noas Geschichte, Ticket 04), nicht aber die Bilder.
    Ändert sich davon etwas oder die Regel, kommt eine neue Version: Test, `prepare.mjs` und `merge.mjs` melden einen anderen Fingerabdruck, und `merge.mjs` nimmt nur Läufe der aktuellen Version mit ihrem
    Fingerabdruck an. Einträge älterer Versionen bleiben gültig; der Test prüft jeden nach der Referenz seiner Version
    (Ablauf 1: 43 Einträge, heutige Reihenfolge und vorläufige Grade).
  - **Screenshots:** `shots.mjs` lädt je Level die Seite mit `?t=12` neu, spult Herauswachsen und Aufleuchten mit
    `__prismaDebug.settle` vor (nur für Tests, das Spiel ruft es nie auf) und nimmt erst auf, wenn zwei Aufnahmen nach
    weiterem Vorspulen byte-gleich sind. Das dauert 26,6 s je Aufnahme (ein Level auf einem Bildschirm) statt 150 s;
    die Bilder sind byte-gleich mit denen nach 150 s Warten.
    `sh tools/leise.sh node tools/ki-tester/shots.mjs <ordner> <platz …>` nimmt Level (Platz im Spiel) mit der
    Kopfzeile eines Levels ausserhalb der Geschichte auf. Seit Ticket 04 zeigt es jedes Level nach dem Neuladen über die
    Testschnittstelle (`__prismaDebug.zeige`) vor der Milchstrasse (`?sky=milky`), wie zuvor ohne Speicherstand.
- **Vorrat und Lader** (`.scratch/noa-geschichte/`, Ticket 02; nur für die Entwicklung): Level, die nicht im Spiel
  stehen, liegen versioniert in `tools/vorrat/` (`flach.js`, `wuerfel.js`): je Level sein Block aus den Leveldaten
  `src/daten/level.js` Zeile für Zeile (Lösung und Herkunft im Kommentar, Name, Grad, Elemente,
  Lösung), darüber `// Platz im Spiel: nach „<Name>“`, das Level unmittelbar davor in der ganzen Folge aus Spiel und
  Vorrat. Die Level stehen dort zwischen `const VORRAT_FLACH = [` (bzw. `VORRAT_WUERFEL`) und `];`.
  `node tools/vorrat.mjs ablegen <name …> [--flach] [--wuerfel] [--grad <grad>] [--datei <datei>]` nimmt Level aus
  `src/daten/level.js` (das Tutorial bleibt), `zurueckholen` mit denselben Angaben oder `--alle` setzt sie an ihren
  Platz zurück, `liste` zeigt den Vorrat je Art und Grad; hin und zurück ist `src/daten/level.js` byte-gleich. Der
  gemeinsame Lader (`tools/lader.mjs`) liefert `ALLE` (`LEVELS`, `TUTORIAL_COUNT`, `LEVELS_3D` wie nach dem Zurückholen
  aller, die Level im Spiel als dieselben Objekte wie in `solver.mjs`), `VORRAT`, `ort(name)` und `alleText()`
  (`src/daten/level.js` mit allen Leveln). Wer alle Level braucht, liest über ihn; `ordne-level.mjs` und `ordne-wuerfel.mjs` rechnen mit ihm und
  schreiben seit Ticket 08 in Spiel und Vorrat (`inGanzerFolge` in `vorrat.mjs`: alle Level der Art zurückholen, ordnen,
  die vorher abgelegten und neue wieder ablegen; ohne Level der Art im Vorrat bleiben neue im Spiel). Seit Ticket 04
  liegen dort die flachen Level ausserhalb von Noas Geschichte (seit Ticket 09 298) und alle 300 Würfel-Level.
- **Wahl für Noas Geschichte** (`.scratch/noa-geschichte/`, Ticket 03; nur für die Entwicklung):
  `LEISE_CPU=50 sh tools/leise.sh node tools/geschichte.mjs wahl [--trocken]` wählt je Grad die 60 Level der
  Geschichte aus den flachen Leveln des Grads (Spiel und Vorrat, für «sehr schwer» dazu die 15 aus
  `tools/geschichte/sehr-schwer-neu.json` und seit Ticket 09 die beurteilten Kandidaten aus
  `tools/geschichte/sehr-schwer-kandidaten.json`) und verteilt sie auf die 6 Welten zu je 10 (etwa 75 s): ohne
  abgelehnte (beide KI-Tester, Ausschlussgrund, ab «mittel» unter dem Mindest-Spielwert, Kandidaten ohne gutes
  Urteil), nach der Bewertung (Gefühl und Aha der KI-Tester, dann Spielwert; ohne Urteil aus dem Spielwert geschätzt),
  die Vielfalt vor der Bewertung, je Welt ein Sechstel des Pools nach Schwierigkeit (in «sehr schwer» über den ganzen
  Grad: die 60 mit der kleinsten Summe der Ränge in der Bewertung, die sich mit höchstens 3 Plätzen vom Rang, auch über
  die Weltgrenze, ohne Verstoss anordnen lassen; Suche mit Strahl und Nachbessern). Regeln, Entscheide und
  Abweichungen im Kopf des Werkzeugs; das Ergebnis mit Begründung je Level in `tools/geschichte/wahl.json`. Wählt es
  einen Kandidaten ohne Schlüssel, bricht es ab, bis der Kandidat in `sehr-schwer-kandidaten.json` einen Sternnamen
  hat (eindeutig in jeder Schreibung); `node tools/geschichte.mjs ausbau <datei>` schreibt die gewählten Kandidaten,
  die noch nicht in Spiel oder Vorrat stehen, für `ordne-level.mjs --ausbau`. Die Titel stehen von Hand in
  `tools/geschichte/titel.json` (je Welt und Grad 10 in der Reihenfolge der Plätze); nach einer Änderung ordnet `node tools/geschichte.mjs titel` sie
  neu zu und prüft sie. `node tools/geschichte.mjs spiel [--trocken]` bringt `wahl.json` ins Spiel (Ticket 04):
  In `src/daten/level.js` stehen danach das Tutorial und genau die 240 Level (ihre Titel seit Ticket 07 des Umbaus in
  `src/texte/de.json`, Bereich `titel`, zuerst die Übungen, dann in der Reihenfolge von `FLACH`), in der Reihenfolge der
  Reihe (nicht umgeordnet, damit der Lader sie unverändert zusammensetzt); die übrigen flachen und alle Würfel-Level
  legt es in den Vorrat, Level der Wahl im Vorrat holt es zurück, und in `REISE` schreibt es den Datenblock der Reise
  (je Grad 6 Welten mit den Schlüsseln ihrer 10 Level). Ein zweiter Lauf ändert nichts.
  Neue Level kommen vorher über `ordne-level.mjs --ausbau` in die Reihe (so die 15 neuen sehr schweren in Ticket 04 und
  die 23 aus Ticket 09, damals mit allen flachen Leveln im Spiel, also erst `vorrat.mjs zurueckholen --flach`; seit
  Ticket 08 schreibt `ordne-level.mjs` in Spiel und Vorrat). Ein Ausbau sehr schwerer Level läuft heute so:
  Kandidaten mit `ausbau.mjs pool`, Vorschau mit `ordne-level.mjs --ausbau <datei> --json <vorschau>`, Lauf der
  KI-Tester (`prepare.mjs ausbau-… --kandidaten <vorschau>`, `merge.mjs`), die guten mit Schlüssel in
  `tools/geschichte/sehr-schwer-kandidaten.json`, `geschichte.mjs wahl`, `geschichte.mjs ausbau <datei>`,
  `ordne-level.mjs --ausbau <datei> --schreiben` (die neuen in den Vorrat), `tests/golden.mjs --write` (nur die neuen
  dazu), `geschichte.mjs spiel`.
- **Wo die Level liegen** (seit Ticket 06 des Umbaus): in der Datendatei `src/daten/level.js`, einem JavaScript-Modul
  nur mit Daten (kein JSON, damit jedes Level seine Kommentare zu Lösung und Herkunft behält). Darin `UEBUNGEN` (die
  Übungen im Dorf, von Hand), `FLACH` (die Level der Reihe im Spiel), `WUERFEL` (die Würfel-Level im Spiel, heute
  leer) und `REISE` (die Reise der Geschichte: je Grad 6 Welten mit den Namen ihrer 10 Level). Die Spiellogik
  `src/logik.js` setzt daraus `LEVELS` (`UEBUNGEN`, dann `FLACH`), `LEVELS_3D` und `STORY_LEVELS` zusammen; Vite
  bündelt die Datei beim Build ins Spiel (kein Nachladen, offline spielbar). Die übrigen Level liegen im Vorrat
  (`tools/vorrat/`, siehe «Vorrat und Lader»). Die Werkzeuge schreiben je in einen Bereich: die Zeilen zwischen
  `const FLACH = [` und der nächsten Zeile `];` (ebenso `WUERFEL`, und `REISE` bis `};`); darin steht jedes Level als
  Block von `  {` bis `  },`, sonst nichts.
  **Ein Level ändern:** Ein Level im Spiel direkt in seinem Block in `src/daten/level.js` ändern (liegt es im Vorrat,
  zuerst `node tools/vorrat.mjs zurueckholen <name>` oder den Block in `tools/vorrat/` ändern), die Lösung im
  Kommentar und in `solution` nachführen, dann `node tests/golden.mjs` (zeigt die Änderung; ist sie gewollt, mit
  `--write` die Referenz neu schreiben), `node tests/logic.test.mjs` (Lösung stimmt und ist eindeutig) und die Tests
  der Levelliste. Reihenfolge und Grad nicht von Hand ändern: Das schreibt `tools/ordne-level.mjs --schreiben` (bzw.
  `ordne-wuerfel.mjs`), welche Level in die Geschichte kommen und ihre Titel `tools/geschichte.mjs spiel`. Den Namen
  nie ändern (Schlüssel des Speicherstands). Die Übungen im Dorf schreibt kein Werkzeug; sie ändert man von Hand.
- **Levels:** in `LEVELS` (Spiellogik, Daten in `src/daten/level.js`): zuerst das Tutorial (`tutorial: true`; seit PLAN 1a.3 «Tutorial neu» 4 Level
  mit je höchstens vier geführten Schritten `schritte` mit je einem oder zwei kurzen Sätzen im Band unten, Lichtkegel
  und Hand am Element, strikt: nur das markierte Element reagiert; dazu Hinweise nebenbei `nebenbei` zu Kamera und
  Neustart in «Brechung»; geführt nur im Dorf, siehe «Führung» in `CONTEXT.md`. Erstes Licht: Ziel, Spiegel, rund
  gegen eckig, Zurückdrehen; Brechung: Block und Prisma; Farbenlehre: Filter, farbige Lampe, Ring am Kristall;
  Mischung: Mischen am Kristall und Kombinator), danach seit Ticket 04
  (Noas Geschichte) genau die 240 Level der Geschichte (ihr Titel in der Übersetzungsschicht, die Reise in
  `STORY_LEVELS`), in der
  Reihenfolge der Reihe; die übrigen der 538 flachen Level (500, die 15 neuen sehr schweren aus Ticket 01 und die 23
  aus Ticket 09, über `ordne-level.mjs --ausbau` in die Reihe eingefügt) liegen im Vorrat. Die Reihe: 150 Level, seit
  Ticket 15 nach der Schwierigkeit der Beurteilung geordnet (`tools/ordne-level.mjs`): Ohne die KI-Tester wandert kein
  Level mehr als 10 Plätze. Über die 51 Level, die nach der Formel weiter wandern würden (Prüfliste in
  `tools/levelliste.json`), haben in Ticket 16 die KI-Tester geurteilt: 28 stehen nach der Formel, die übrigen an
  ihrem alten Platz, dazu ihre Korrekturen und zwei Züge der Häufungsregel. In Ticket 23 kamen für die 6 leichten
  Level mit Ausschlussgrund 6 neue aus dem Generator (Sammellinse, Strahlteiler, Amethyst, Fackellauf, Fernlicht,
  Blitz; je mit Herkunft im Kommentar), nach der Formel eingeordnet und von den KI-Testern geprüft (Lauf
  `ersatz-leicht-1`); die ersetzten stehen nur noch als feste Kopie für die Eichung in
  `tools/beurteilung/entfernte-level.json`. Ebenso kamen 8 neue sehr schwere Level in Ticket 26 (Lauf
  `ersatz-sehr-schwer-1`) und 30 neue mittlere in Ticket 24 (Läufe `ersatz-mittel-1` bis `-5`): für die 13 mit
  Ausschlussgrund oder Ablehnung und für 17 ohne erkannte Kernidee, die die KI-Tester schwach beurteilten, dazu 15 neue
  schwere in Ticket 25 (Läufe `ersatz-schwer-1` und `-2`): für die 13 mit Ausschlussgrund, Lichthof und Sternwarte.
  27 mittlere und 4 schwere Level, die nur wegen Kernidee oder Spielwert auf der Duldungsliste stehen, bleiben nach
  ihrem Urteil (Gruppe `behalten` in `tools/levelliste.json`); seit Ticket 25 stehen nur noch sie auf der Liste, alle
  vier Grade sind ausgetauscht. Die frühere Reihenfolge entstand so: Die Level 121–150 (aus `harden.mjs`)
  waren alle schwerer als die ersten 120. 70 der ersten 120 sind
  mittelschwere Level, nachträglich einsortiert: zuerst 20 zwischen die damaligen Level 16 und 68 (Review zweier
  Tester in `tools/pools/mittel/review/`), dann 50 zwischen die damaligen Level 40 und 69 (vor Ticket 15 die Plätze
  40–119; Review von drei Testern aus Spielersicht und einem Spielermodell in `tools/pools/mittel2/review/`; beides
  nicht versioniert); die Namen wandern mit ihren Leveln, umbenannt wurde nichts. Jede Lösung steht als Kommentar und
  im Feld `solution`. Jedes Level nach dem Tutorial trägt seinen Grad im Feld `grad` (leicht 1–31, mittel 32–105,
  schwer 106–137, sehr schwer 138–150). Das Spiel zeigt ihn (Ticket 17, `GRAD_ANZEIGE`) als Punkte von leicht ●○○○
  bis sehr schwer ●●●● mit dem Text dazu: in Noas Geschichte in der Unterzeile der Kopfzeile und auf den Karten des
  Menüs, bei einem Level ausserhalb der Geschichte (Testschnittstelle) hinter dem Namen (auf dem Handy
  hochkant in einer eigenen Zeile darunter). Das Tutorial hat keinen Grad. Eigene Farben haben die Grade nicht, weil
  Rot, Grün und Blau Lichtfarben sind: Volle und leere Punkte unterscheiden sich in der Form, und Screenreader lesen den
  Grad als Text. Die Punkte sind gezeichnet (CSS), nicht aus der Schrift. Die Levelauswahl (Seiten zu 10, Fläche und
  Würfel) ist mit Ticket 04 weggefallen; an ihrer Stelle steht seit Ticket 06 die Übersicht des Grads.
  Wichtig: Der Levelname (`name`) ist der stabile Schlüssel jedes Levels (Speicherstand, Werkzeuge, Protokoll der
  KI-Tester, Golden-Test); angezeigt wird der Titel aus der Übersetzungsschicht, ohne Titel der Name (`levelTitel`).
  Gelöste Level speichert das Spiel nach Namen (geprüft in
  `tests/levelliste.test.mjs`). Die Namen der 150 wurden einst der Position nach vergeben (bis Ticket 21 in
  `tools/profiles.mjs`; als feste Liste in `tools/beurteilung/heutige-reihenfolge.json`) – nach dem Veröffentlichen
  nicht mehr umbenennen. Entfernte Namen kommen auf die Liste in `tools/levelliste.json` und werden nie wieder
  vergeben; jeder Name der festen Liste steht im Spiel oder auf dieser Liste (geprüft in `tests/levelliste.test.mjs`).
  Die Tests probieren alle Stellungen durch und prüfen, dass jede Lösung stimmt und eindeutig ist.
