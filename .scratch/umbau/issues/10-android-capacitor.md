# 10: Android mit Capacitor, bereit für den Play Store

**Spec:** ../spec.md

**Status:** needs-triage (vor Beginn ein eigenes Grilling)

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
Store-Texte auf Deutsch und Englisch, ob der Service Worker in der App abgeschaltet wird.

## Comments
