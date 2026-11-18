# 10: Android mit Capacitor, bereit für den Play Store

**Spec:** ../spec.md

**Status:** done (Review 18.11.2026 bestanden; Gerätetest durch den Nutzer offen)

**Blocked by:** 08, 09

**What to build:** Prisma als Android-App mit Capacitor (ADR 0012), aus demselben `dist/` wie die Browser-Fassung, und
so weit, dass sie in den Play Store hochgeladen werden kann (PLAN 4).

**Ziel (Nutzer, 16.11.2026):** Das Ziel dieses Tickets ist **nicht** der Eintrag im Play Store, sondern ein Spiel,
das **bereit** dafür ist: ein signiertes App Bundle und alles Material, das der Upload verlangt. Konto, Upload,
geschlossener Test und Veröffentlichung sind nicht Teil des Tickets.

Grob, wird im Grilling ausgearbeitet:

- [x] Capacitor einrichten, `dist/` in die App, Android-Projekt im Repo.
- [x] Speicherschicht für Android (falls `localStorage` in der WebView nicht reicht), Zurück-Taste, Hoch- und Querformat,
      Vollbild, Ton.
- [x] Android App Bundle (`.aab`) bauen und signieren. Signaturschlüssel sicher aufbewahren, ohne ihn keine Updates.
- [ ] Test auf echten Geräten, auch schwächeren (PLAN 4.7). Macht der Nutzer (Prüfliste unten); kein Emulator auf diesem Rechner.
- [x] Store-Material bereitlegen (Texte, Bilder, Pflichtangaben wie Datenschutz und Inhaltseinstufung), damit der
      Upload ohne weitere Arbeit am Spiel geht.
- Nicht in diesem Ticket: Konto in der Play Console, Upload, geschlossener Test mit 12 Testern über 14 Tage,
  Veröffentlichung (PLAN 4.8–4.11).

**Offen für das Grilling:** Paketname (z. B. `ch.….prisma`, danach nicht mehr änderbar), Mindestversion von Android,
Store-Texte auf Deutsch und Englisch, ob der Service Worker in der App abgeschaltet wird, Source-Maps in der App
weglassen (Review 04: 2,3 MB). Aus Review 05: Die Speicherschicht ist synchron; für Capacitor Preferences braucht es
einen Zwischenspeicher, der beim Start einmal geladen wird (oder `localStorage` in der WebView behalten).

## Comments

### Grilling (18.11.2026, Nutzer)

- **Paketname:** `ch.bonomo.prisma` (Nutzer), danach unveränderlich.
- **Mindestversion:** die Vorgabe von Capacitor (`minSdkVersion` der Vorlage), `targetSdk` so, wie Google Play es heute
  verlangt.
- **Signatur:** Play App Signing; wir erzeugen nur den Upload-Schlüssel. Er liegt auf diesem Rechner **ausserhalb des
  Repos** (nie in Git, auch nicht Passwörter; `.gitignore` sichert ab), Signieren über Umgebungsvariablen oder eine
  nicht eingecheckte `keystore.properties`. Am Ende Datei und Ort des Passworts dem Nutzer nennen; er sichert beides
  selbst (Passwortmanager/USB-Stick).
- **Werkzeuge:** JDK und Android SDK als Kommandozeilen-Werkzeuge installieren (winget bzw. die offiziellen
  cmdline-tools von Google), ohne Android Studio. Der Nutzer hat zugestimmt.
- **Entscheide ohne Nutzer (Claude):** in der App kein Service Worker (das Spiel liegt in der App); keine Source-Maps in
  der App; Spielstand bleibt in `localStorage` der WebView (die Speicherschicht ist synchron, kein Umbau auf
  Preferences), mit Prüfung, dass er über einen App-Neustart und ein App-Update erhalten bleibt.
- **Kontakt im Store:** `bonomo.alessandro@yahoo.de` (wie auf der Datenschutzseite). Datenschutz-Adresse:
  `https://bonomoalessandro.github.io/Prisma/datenschutz.html`.
- **Link zur Datenschutzseite im Spiel** (aus Ticket 09 offen): in diesem Ticket ins Menü, Deutsch und Englisch; dabei
  die Menü-Referenzbilder beider Sprachen nachführen.
- **Store-Texte** (Kurz- und Langbeschreibung) schreibt Claude auf Deutsch und Englisch, Ton wie die Spieltexte; der
  Nutzer prüft sie. Antworten für Inhaltseinstufung und Datensicherheit als Vorlage bereitlegen.
- **Test auf dem Gerät:** Claude installiert nichts auf dem Poco (dort nur Chrome per CDP). Die App testet der Nutzer
  selbst auf seinem Handy; dafür eine Debug-APK/signierte APK und eine kurze Prüfliste bereitlegen. Im Emulator darf
  geprüft werden, falls er ohne Android Studio läuft.

### Umsetzung (18.11.2026, Umsetzer)

- **Werkzeuge** (ohne Android Studio, Pfade im README unter «Android-App»): JDK Temurin 21.0.13 als Zip von Adoptium
  (Prüfsumme der API geprüft) unter `C:\Users\admin\AppData\Local\Programs\Temurin\jdk-21.0.13+9`; die Installation
  per `winget` (Bereich Maschine) blieb an der Abfrage der Benutzerkontensteuerung hängen und wurde abgebrochen (falls
  noch ein Fenster «Möchten Sie zulassen …» offen ist: ablehnen). Android SDK unter
  `C:\Users\admin\AppData\Local\Android\Sdk`: `cmdline-tools` 23 (Zip von Google, SHA-1 geprüft), `platform-tools`,
  `platforms/android-36`, `build-tools/35.0.0` und `36.0.0`, `emulator`; Lizenzen angenommen. `JAVA_HOME` und
  `ANDROID_HOME` des Benutzers gesetzt.
- **Capacitor 8.6.2** (`@capacitor/core`, `/android`, `/cli`, dazu `@capacitor/app` 8.1.2), Versionen fest in
  `package.json`. `capacitor.config.json`: `ch.bonomo.prisma`, `webDir` `dist`, SystemBars (Leisten aus,
  `insetsHandling: native`: ab WebView 140 gelten `env(safe-area-inset-*)` mit `viewport-fit=cover`, davor polstert
  Capacitor die WebView). Projekt `android/` aus der Vorlage (minSdk 24, targetSdk/compileSdk 36, Gradle 8.14.3, AGP
  8.13.0); Beispieltests der Vorlage entfernt; nur die Sprachen `en` und `de` im Paket (`localeFilters`).
- **App-Build:** `npm run build:app` = `vite build --mode app` + `cap sync android`. Im Modus `app` (vite.config.mjs):
  keine Source-Maps, kein `sw.js`, keine Manifeste, `window.PRISMA_APP = true` vorn im Kopf; das Skript im Kopf von
  `index.html` bindet dann weder Manifest noch Service Worker ein. Die Browser-Fassung baut wie vorher (`npm run build`,
  ohne Capacitor; geprüft in `tests/app.test.mjs`).
- **Zurück-Taste:** `zurueckTaste()` in `src/seite/geschichte/geschichte.js`, wie Esc: Level/Dorf/Reise → Menü; Menü,
  das aus einem Level kam → zurück ins Level; Übersicht → zu; Rückfrage «Von vorn» → abbrechen; Prolog/Epilog →
  überspringen; Startbildschirm und Menü ohne Level dahinter → `App.exitApp()`. Nur im App-Build hängt sie an
  `backButton` (`import.meta.env.MODE === 'app'`; im Browser fällt der Teil samt `@capacitor/app` weg). Für Proben
  global über `alsGlobal`.
- **Vollbild, Drehen, Ton:** `MainActivity.java` blendet Status- und Navigationsleiste aus (Wischen holt sie kurz
  zurück) und wieder, wenn die App den Fokus zurückbekommt. Keine feste Ausrichtung (hoch und quer). Ton: Das Spiel
  pausiert schon bei `visibilitychange` (die WebView meldet das beim Wechsel in den Hintergrund); nicht geändert.
- **Spielstand:** bleibt im `localStorage` der WebView (Ursprung `https://localhost`, fest bei Capacitor). Er übersteht
  Neustart und Update (App-Daten bleiben bei einem Update, solange Paketname und Ursprung gleich sind); `allowBackup`
  der Vorlage bleibt an (Android sichert die App-Daten mit). Prüfen lässt sich das nur auf dem Gerät (Prüfliste).
- **Datenschutz im Menü:** Link «Datenschutz»/«Privacy» (`menue.datenschutz`), unten links (Desktop, quer), hoch oben
  links gegenüber der Sprache, so leise wie diese. Im Browser `datenschutz.html` daneben (neuer Tab, auch offline), in
  der App die Seite auf GitHub Pages: Capacitor öffnet fremde Adressen im Browser des Handys. Die mitgelieferte Seite in
  der WebView hätte das Spiel ersetzt, und die Zurück-Taste fände dort nicht zurück (der Hörer gehört zur Seite des
  Spiels). Englisch springt zu `#en`. Menü-Referenzen beider Sprachen in `referenz/` und `referenz-gpu/` nachgeführt.
- **Icons und Startbild:** `tools/app-icons.mjs` macht aus `icons/` das adaptive Icon (Vordergrund: das Icon mit
  Schutzrand 82,5 von 108 dp, so deckt es die sichtbaren 72 dp, und sein sicherer Kreis liegt in den 66 dp), die Icons
  für Android 7 und `store/icon-512.png`. Startbild: ab Android 12 das Icon auf `#030308`, davor `drawable/splash.xml`
  (Grund und rundes Icon); das Fenster bleibt bis zum ersten Bild dunkel.
- **Signieren:** Upload-Schlüssel `C:\Users\admin\prisma-schluessel\prisma-upload.jks` (PKCS12, RSA 4096, Alias
  `prisma-upload`, gültig bis 2054, SHA-256 des Zertifikats
  `56:05:07:FD:62:EF:07:C2:DC:D3:5C:6E:89:1D:4D:A8:44:90:79:61:84:E5:86:BF:CE:4A:08:D3:BD:02:79:A2`), Passwort zufällig
  (24 Bytes) in `keystore.properties` und `PASSWORT.txt` im selben Ordner. `android/app/build.gradle` liest
  `keystore.properties` (oder den Pfad in `PRISMA_SCHLUESSEL`); `.gitignore` schliesst Keystores, `keystore.properties`,
  `.aab`, `.apk` aus; `tests/app.test.mjs` prüft, dass nichts davon im Repo liegt.
- **Version:** `android.versionCode` (1) und `android.versionName` («1.0») in `package.json`, Gradle liest sie; vor
  jedem Upload `versionCode` erhöhen. `appVersion` auf «2026-11-18 umbau-10».
- **Gebaut:** `bundleRelease` und `assembleRelease`; `.aab` mit `jarsigner -verify` («JAR-Datei verifiziert»), APK mit
  `apksigner verify` (v2), beide mit dem Upload-Zertifikat. Paket `ch.bonomo.prisma`, Version 1.0 (1), minSdk 24,
  targetSdk 36, Sprachen en/de, je knapp 24 MB, ohne Source-Maps, `sw.js` und Manifeste. Kopien ausserhalb des Repos in
  `C:\Users\admin\prisma-app\`.
- **Store-Material** in `store/` (im Repo, damit es mit dem Spiel wandert): `store/index.html` (Übersicht: Texte zum
  Kopieren mit Zeichenzahl, Bilder, Angaben der Play Console, Datensicherheit, Inhaltseinstufung), je Sprache acht
  Bildschirmfotos 1080 × 1920 (`store/de/`, `store/en/`) und die Feature-Grafik 1024 × 500, `store/icon-512.png`.
  Bilder mit dem Bildvergleich (`--store`, neue Grössen «store» 432 × 768 mit Pixeldichte 2,5 wie ein Android-Handy und
  «grafik» 1024 × 500; laufen nur so), Feature-Grafik mit `tools/store-grafik.mjs`.
- **Emulator:** geht auf diesem Rechner nicht: `emulator -accel-check` meldet «Android Emulator hypervisor driver is
  not installed», Hyper-V und Windows Hypervisor Platform sind aus; beides bräuchte Adminrechte (und einen Neustart).
  Ohne Beschleunigung startet kein x86_64-Abbild. Nicht weiter verfolgt (Befund eindeutig). Stattdessen ohne Android
  geprüft: `tests/app.test.mjs` (Node, in `npm test` und im Workflow von Pages) und `tests/app-probe.mjs` (Build der App
  in Chrome als Handy: kein Manifest, kein Service Worker, Link auf Pages, die Schritte der Zurück-Taste, Konsole ohne
  Fehler).

### Prüfungen (Umsetzer)

Alle als leichte Läufe über `tools/leise.sh` (ausser wo vermerkt):

- `npm test`: alle grün nach zwei Korrekturen (Zeilenenden von `de.json`/`en.json`; die Adresse des Links als
  bewusste Ausnahme in `tests/logic.test.mjs` «lädt nichts von fremden Servern» und `tests/texte.test.mjs`), danach
  `logic`, `texte`, `geschichte`, `app` erneut: grün. Neu: `tests/app.test.mjs` (8 Tests, auch im Workflow von Pages).
- `tests/app-probe.mjs` (Build der App in Chrome als Handy): 10 Schritte grün.
- Bildvergleich `--gpu`, beide Sprachen, alle Grössen: GRÜN (154 Bilder, 16 min). Vorher die Menü-Referenzen
  nachgeführt: `--nur welt-3-4 --write` auf der GPU und in SwiftShader; behalten nur die 6 Menübilder je Ordner
  (`desktop`, `handy`, `quer`, je de/en), zwei durch GPU-Rauschen geänderte Bilder (`desktop-welt-3-*`)
  zurückgesetzt; in SwiftShader änderten sich nur die 6 Menübilder.
- `tests/offline.mjs` und `--unterpfad`: grün (38 Prüfungen je Lauf; als leichter Lauf neben dem Bildvergleich in SwiftShader zweimal Zeitüberschreitung nach 900 s, darum allein wiederholt).
- Gradle: `bundleRelease` und `assembleRelease` grün; `jarsigner -verify` und `apksigner verify` grün.

### Offene Punkte

- Gerätetest durch den Nutzer (Prüfliste unten), auch auf einem schwächeren Handy (PLAN 4.7).
- Ob die Leisten auf dem Gerät weg bleiben und das Kamera-Loch nichts verdeckt (die Seite nutzt
  `env(safe-area-inset-*)`), lässt sich ohne Gerät nicht prüfen.
- Ton beim Wechsel in den Hintergrund: verlässt sich auf `visibilitychange` der WebView; läuft auf dem Gerät Ton weiter,
  im App-Build zusätzlich auf `pause`/`resume` von `@capacitor/app` hören.
- `INTERNET` bleibt in der Berechtigungsliste (Vorgabe von Capacitor). Das Spiel lädt nichts aus dem Netz; ohne die
  Berechtigung wäre die Datensicherheit noch klarer, aber ungeprüft auf dem Gerät nicht entfernt.
- Zielgruppe: entschieden (Nutzer, 18.11.2026): auch Kinder unter 13; Altersgruppen und Prüfliste der Richtlinie für
  Familien in `store/index.html` (Review).
- `npm audit` meldet 4 hohe Funde in `picomatch` (über Vite), schon vor diesem Ticket; nur Entwicklung, nicht im Spiel.

### Für den Nutzer

- **Hochladen:** `C:\Users\admin\prisma-app\prisma-1.0-code1.aab` (dieselbe Datei wie
  `android/app/build/outputs/bundle/release/app-release.aab` im Worktree). Zum Ausprobieren auf dem Handy:
  `C:\Users\admin\prisma-app\prisma-1.0-code1.apk` (signiert; zum Installieren «Unbekannte Apps installieren» für den
  Dateimanager bzw. Browser erlauben).
- **Schlüssel sichern:** Ordner `C:\Users\admin\prisma-schluessel\` mit `prisma-upload.jks` (Schlüssel),
  `keystore.properties` und `PASSWORT.txt` (Passwort). Beides an einen sicheren Ort (Passwortmanager, USB-Stick). Ohne
  den Schlüssel kein Update, bis Google den Upload-Schlüssel zurücksetzt.
- **Prüfliste für das Handy** (APK installieren):
  1. Icon auf dem Startbildschirm in der Form des Launchers, Name «Prisma»; Startbild dunkel mit dem Icon, kein weisser
     Blitz.
  2. Start ohne Leisten (Vollbild); vom Rand wischen zeigt sie kurz, dann gehen sie wieder. Nichts unter dem
     Kamera-Loch.
  3. Startbildschirm, Menü, ein Level spielen; Ton an.
  4. Zurück-Taste (oder Wischgeste zurück): im Level → Menü; noch einmal → zurück ins Level; Übersicht (Raster-Knopf)
     → Zurück schliesst sie; im Menü direkt nach dem Start → App geht zu.
  5. Drehen: hoch und quer, im Menü und im Level.
  6. Home-Taste, während Ton läuft: Ton hört auf; zurück in die App: weiter wie vorher.
  7. Menü → «Datenschutz»: öffnet die Seite im Browser (Internet nötig); zurück in die App, das Spiel steht noch.
  8. App ganz schliessen (aus den letzten Apps wischen), neu öffnen: Spielstand da («Weiter» im Menü).
  9. Flugmodus an, App neu starten: läuft ganz.
  10. Update: später eine APK mit höherem `versionCode` darüber installieren: Spielstand bleibt.
  11. Sprache des Handys Englisch: Spiel auf Englisch, «Privacy» im Menü.
- **In der Play Console** (alles in `store/index.html`, die Datei im Browser öffnen): App anlegen (Name, Standardsprache
  Deutsch, Spiel, kostenlos), Play App Signing annehmen, `.aab` hochladen (zuerst in einen internen oder geschlossenen
  Test, PLAN 4.8), Store-Eintrag Deutsch und Englisch (Texte und Bilder), App-Symbol, Feature-Grafik, Kategorie Puzzle,
  Kontakt `bonomo.alessandro@yahoo.de`, Datenschutz-URL, Fragebogen Inhaltseinstufung, Datensicherheit («keine Daten
  erhoben oder geteilt»), Werbung «nein», Zielgruppe (Altersgruppen 6–8 bis 18+, Entscheid des Nutzers; Richtlinie für Familien, Prüfliste in `store/index.html`), App-Zugriff. Für ein neues privates Konto verlangt Google vor der
  Veröffentlichung einen geschlossenen Test mit 12 Testern über 14 Tage.

### Review (unabhängiger Reviewer, 18.11.2026)

**Ergebnis: bestanden**, nach kleinen Korrekturen am Store-Material (Commits `3df0ff2`, `0008141`).

**Geprüft und in Ordnung:**

- **Schlüssel:** Das Passwort (aus `PASSWORT.txt`, nicht ausgegeben) kommt weder im Diff noch in der Historie aller
  Refs noch im Worktree oder in `android/app/build` vor; kein Keystore, keine `keystore.properties`, keine `.aab`/`.apk`
  in Git; `.gitignore` deckt alles ab. Ohne Schlüssel (`PRISMA_SCHLUESSEL` auf einen fehlenden Pfad) baut Gradle mit
  der Warnung «… fehlt, die Release-Fassung bleibt unsigniert» weiter (`app-release-unsigned.apk`; das Bundle heisst
  dann trotzdem `app-release.aab`, Play lehnt ein unsigniertes aber klar ab); der Debug-Build geht.
- **Browser-Fassung:** Build der Basis und des Tickets verglichen: dieselben Dateien (ein Modul, drei Worker,
  Source-Maps, `sw.js`, Manifeste), statische Dateien ausser `index.html` byte-gleich, kein Capacitor im Spiel.
  Referenzen: nur die 6 Menübilder je Ordner geändert.
- **App-Build und Android-Projekt:** kein SW, keine Maps, keine Manifeste, `window.PRISMA_APP`; Paket
  `ch.bonomo.prisma`, minSdk 24 (Vorlage), targetSdk/compileSdk 36, nur `en`/`de`, Name je Sprache, adaptives Icon.
  `MainActivity`: nur `WindowInsetsControllerCompat` (keine veralteten Flags). Kamera-Loch: Ab Android 15 (Edge-to-Edge
  Pflicht, Ausschnitt-Modus «immer») reicht SystemBars (`insetsHandling: native`) die Abstände samt `displayCutout` an
  die Seite (`viewport-fit=cover`, `env(safe-area-inset-*)` in allen Stilen) bzw. polstert die WebView (WebView < 140);
  bis Android 14 legt das System das Fenster im Modus «default» nicht unter den Ausschnitt (schlimmstenfalls ein
  schwarzer Streifen). Sinnvoll so; auf dem Gerät bleibt es Punkt 2 der Prüfliste.
- **Zurück-Taste:** `zurueckTaste` folgt der Esc-Logik in allen Zuständen (Start, Menü mit/ohne Level, Rückfrage,
  Übersicht, Level, Dorf, Reise, Prolog/Epilog); `@capacitor/app` nur im App-Build.
- **Datenschutz-Link:** eigene Probe in Chrome, Deutsch und Englisch, Desktop 1280 × 800, Handy 390 × 844, quer
  844 × 390, 360 × 640, 640 × 360, Poco 393 × 873 (2,75): im Bild, trifft beim Tippen, kein Text darüber; Browser →
  `datenschutz.html` (`#en`), App → Pages (app-probe).
- **AAB/APK** neu gebaut (nach der Ergänzung der Datenschutzseite): APK v2-signiert, Zertifikat SHA-256
  `56:05:07:FD:…:79:A2` = Upload-Schlüssel, AAB «JAR-Datei verifiziert» mit demselben Zertifikat;
  `ch.bonomo.prisma` 1.0 (1), minSdk 24, targetSdk 36; je knapp 24 MB; keine Source-Maps, kein `sw.js`, keine
  Manifeste. Der Build ist reproduzierbar (vor der Änderung bitgleiche AAB). `C:\Users\admin\prisma-app\` hat die neuen
  Dateien.
- **INTERNET:** bleibt. Nötig ist sie wohl nicht (das Spiel kommt über den lokalen Server von Capacitor, der Link öffnet
  den Browser per Intent), aber ob jede WebView ohne sie lädt, lässt sich ohne Gerät nicht sicher sagen. Sie ist eine
  normale Berechtigung, ändert an Datensicherheit und Familienrichtlinie nichts.

**Behoben (klein, vom Reviewer):**

- Feature-Grafik war PNG **mit Alphakanal**: Google Play nimmt sie nur als JPEG oder 24-Bit-PNG. Jetzt
  `store/*/feature-grafik.jpg` (gleiches Bild), `tools/store-grafik.mjs` schreibt JPEG.
- App-Symbol `store/icon-512.png` war 24 Bit, verlangt ist PNG mit 32 Bit: `tools/app-icons.mjs` zeichnet es übers Canvas
  (die mipmaps bleiben bitgleich).
- Bildschirmfotos «Meer» und «Vulkan» (gelöst) zeigten **«0:00» als Zeit** (Spur der Probe, `loese` dreht sofort):
  `bildvergleich.mjs --store` setzt den Beginn zurück (0:53 bzw. 1:19), beide Sprachen neu aufgenommen (übrige Bilder
  bitgleich zur neuen Aufnahme).
- Englische Beschreibung: «four grades» → «four difficulty settings» (so heisst es im Spiel), «No timer» → «No time
  pressure» (das Spiel zeigt die Zeit).
- **Zielgruppe mit Kindern** (Entscheid des Nutzers während des Reviews): `store/index.html` mit Altersgruppen 6–8,
  9–12, 13–15, 16–17, 18+ (ohne «5 und jünger»: das Spiel braucht Lesen und wird schnell zum Denksport) und Prüfliste
  der Richtlinie für Familien mit Befund (keine Werbung, keine SDKs mit Datenerhebung, keine Kennungen, Datenschutz
  mit Kindern, keine Käufe, kein Chat, Inhalt IARC 3+, der Link zur eigenen Datenschutzerklärung im Browser ist
  zulässig, keine Elternschranke nötig). `datenschutz.html`: Abschnitt «Kinder»/«Children» ergänzt.

**Läufe** (leicht über `leise.sh`, keine Messläufe): `npm test` ganz grün (16 Teile); nach den Änderungen `logic`,
`texte`, `app` erneut grün; `golden --voll` grün (842 Level); Bildvergleich SwiftShader beide Sprachen GRÜN (154 Bilder,
98 min); `offline.mjs` und `--unterpfad` bestanden; `app-probe.mjs` 10 Schritte grün; Gradle `clean bundleRelease
assembleRelease assembleDebug` und ohne Schlüssel grün.

**Für den Nutzer vor dem Upload:** Schlüsselordner sichern; die geänderte `datenschutz.html` muss auf Pages sein
(Merge nach `main`), bevor die Adresse in der Play Console eingetragen wird; Gerätetest nach der Prüfliste; Store-Texte
gegenlesen; in der Play Console die Altersgruppen wie in `store/index.html`.
