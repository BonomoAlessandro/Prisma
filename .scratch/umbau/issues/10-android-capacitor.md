# 10: Android mit Capacitor und Play Store

**Spec:** ../spec.md

**Status:** needs-triage (vor Beginn ein eigenes Grilling)

**Blocked by:** 08, 09

**What to build:** Prisma als Android-App mit Capacitor (ADR 0012), aus demselben `dist/` wie die Browser-Fassung, und
der Weg bis zum Eintrag im Play Store (PLAN 4).

Grob, wird im Grilling ausgearbeitet:

- [ ] Capacitor einrichten, `dist/` in die App, Android-Projekt im Repo.
- [ ] Speicherschicht für Android (falls `localStorage` in der WebView nicht reicht), Zurück-Taste, Hoch- und Querformat,
      Vollbild, Ton.
- [ ] Android App Bundle (`.aab`) bauen und signieren. Signaturschlüssel sicher aufbewahren, ohne ihn keine Updates.
- [ ] Test auf echten Geräten, auch schwächeren (PLAN 4.7).
- [ ] Konto, Pflichtangaben, Store-Material, geschlossener Test mit 12 Testern über 14 Tage (PLAN 4.8–4.11).

**Offen für das Grilling:** Paketname (z. B. `ch.….prisma`, danach nicht mehr änderbar), Mindestversion von Android,
Store-Texte auf Deutsch und Englisch, wer die 12 Tester sind, ob der Service Worker in der App abgeschaltet wird.

## Comments
