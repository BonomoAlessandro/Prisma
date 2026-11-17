# 09: Browser-Fassung auf GitHub Pages

**Spec:** ../spec.md

**Status:** needs-triage

**Blocked by:** 08 (technisch genügt 02; auf Wunsch des Nutzers nach Meilenstein 1 vorziehbar)

**What to build:** Bei jedem Push auf `main` baut eine GitHub Action das Spiel und veröffentlicht `dist/` auf GitHub
Pages. Die Adresse `bonomoalessandro.github.io/Prisma/` ist danach fest (PLAN 4.1).

- [ ] Workflow unter `.github/workflows/`: `npm ci`, Node-Tests, `npm run build`, Veröffentlichen auf GitHub Pages.
      Schwere Proben mit Chrome laufen dort nicht (zu langsam, ohne festes Rendern); sie bleiben lokal.
- [ ] Spiel, Service Worker und Manifest laufen unter dem Unterpfad `/Prisma/` (`scope`, `start_url`, relative Pfade).
- [ ] Installieren als Web-App und Offline-Spielen funktionieren auf der veröffentlichten Seite (Chrome am Desktop und
      auf Android, von Hand geprüft und unter «Comments» festgehalten).
- [ ] Datenschutzerklärung als einfache Seite in derselben Veröffentlichung (PLAN 4.9: Fortschritt nur lokal, keine
      Abrufe bei fremden Servern). Text auf Deutsch und Englisch.
- [ ] README: Adresse, wie veröffentlicht wird.
- [ ] Aus Review 04: Der Service Worker wird seit Ticket 04 schon nach 0,15 s registriert (vorher nach rund 4 s), sein
      Vorab-Speichern läuft während des Seitenstarts mit. Erst registrieren, wenn `load` da ist **und** `main.ts` fertig
      geladen hat; mit `start-probe` vorher und nachher messen.
- [ ] Aus Review 04: Source-Maps (2,3 MB) auf Pages bewusst entscheiden: behalten oder `hidden`.
- [ ] Der Nutzer stellt in den Einstellungen des Repos GitHub Pages auf «GitHub Actions» um (falls der Agent das nicht
      mit `gh` kann, Schritt für Schritt beschreiben).

## Comments
