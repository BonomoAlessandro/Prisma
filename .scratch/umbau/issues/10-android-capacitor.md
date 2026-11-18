# 10: Android mit Capacitor, bereit für den Play Store

**Spec:** ../spec.md

**Status:** ready-for-agent (Grilling 18.11.2026)

**Blocked by:** 08, 09

**What to build:** Prisma als Android-App mit Capacitor (ADR 0012), aus demselben `dist/` wie die Browser-Fassung, und
so weit, dass sie in den Play Store hochgeladen werden kann (PLAN 4).

**Ziel (Nutzer, 16.11.2026):** Das Ziel dieses Tickets ist **nicht** der Eintrag im Play Store, sondern ein Spiel,
das **bereit** dafür ist: ein signiertes App Bundle und alles Material, das der Upload verlangt. Konto, Upload,
geschlossener Test und Veröffentlichung sind nicht Teil des Tickets.

Grob, wird im Grilling ausgearbeitet:

- [ ] Capacitor einrichten, `dist/` in die App, Android-Projekt im Repo.
- [ ] Speicherschicht für Android (falls `localStorage` in der WebView nicht reicht), Zurück-Taste, Hoch- und Querformat,
      Vollbild, Ton.
- [ ] Android App Bundle (`.aab`) bauen und signieren. Signaturschlüssel sicher aufbewahren, ohne ihn keine Updates.
- [ ] Test auf echten Geräten, auch schwächeren (PLAN 4.7).
- [ ] Store-Material bereitlegen (Texte, Bilder, Pflichtangaben wie Datenschutz und Inhaltseinstufung), damit der
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
