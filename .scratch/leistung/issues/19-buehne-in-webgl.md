# 19: Bühne der Geschichte in WebGL

**Spec:** ../spec.md · **ADR:** docs/adr/0007-buehne-der-geschichte-in-webgl.md

**Blocked by:** 18 (gemergt)

**Status:** ready-for-agent

**What to build:** Die Bühne der Noa-Szenen (Prolog, Kapitelszenen, Finale, Epilog) neu in WebGL, nach ADR 0007.

Vorgeschichte (Nutzer, 03.11.):
- `leistung-10`: «Glühwürmchen ruckeln noch ein wenig, erste Noa-Szene nicht ganz glatt, in anderen Szenen kleine
  Stellen nicht gleichmässig.»
- Am Computer (60 Hz) gleich, die Kamera wirkt «mal schneller, mal langsamer».
- `leistung-11` (sanftere Kurve, langsamere Glühwürmchen) brachte keinen grossen Unterschied.
- `leistung-12` (Untertitel, Satz und Strahl vorbereitet, weniger ausgelassene Bilder) ist «besser, aber noch nicht
  wie erwartet».
- Darauf der Entscheid für den Umbau.

Stufen:
1. Prolog in WebGL hinter `?buehne=gl`:
   - Ebenen als Texturen (Billboards) mit Detailstufen
   - Kamerafolge mit denselben Einstellungen und derselben Kurve
   - Lampe und Strahl
   - Glühwürmchen
   - Untertitel und Hinweise als DOM darüber
   - Tippen, Überspringen, Beschleunigen wie heute
   - gemessen Bild für Bild am Computer
   - gepusht, damit der Nutzer gegen die alte Bühne vergleicht
2. Nach dem Ja des Nutzers: Kapitelszenen, Finale und Epilog auf der neuen Bühne. Die neue Bühne wird Standard, die
   alte gibt es noch über `?buehne=dom`. Die Reisen laufen mit 60 Bildern/s.
3. Nach der Abnahme: die alte Bühne entfernen.

## Acceptance criteria

- [ ] In der eigenen Schleife ist während Fahrten und Flügen am Computer kein Bild ausgelassen. Gemessen wird über den
      ganzen Prolog, die Abstände bleiben unter 1,5 × 16,7 ms.
- [ ] Die Bahnen von Kamera und Glühwürmchen sind je Bild glatt: kein Sprung über die Kurve hinaus.
- [ ] Gleiches Bild wie heute: Ebenen, Farben, Licht, Schärfe beim Zoom. Vergleichsbilder liegen nebeneinander.
- [ ] Der Grafikspeicher der Ebenen auf dem Handy ist gemessen und begrenzt.
- [ ] `geschichte-probe` (Standard und `--quer`) ist grün, die übrigen Proben bleiben wie bisher.
- [ ] Der Nutzer nimmt den Prolog auf dem Poco und am Computer ab.

## Comments

**Plan Stufe 2 (03.11.):**
- Nur Prolog und Epilog nutzen die DOM-Bühne. Die Kapitelszenen, die Reisen und das Finale laufen schon in der
  3D-Szene des Spiels, für sie heisst Stufe 2 nur «mit 60 Bildern/s».
- Vorgabe für Stufe 1:
  - generisch je Folge, mit Spuren für Kamera, Arm, Strahl und Stern
  - dieselbe Schnittstelle wie `createStoryScene`
  - Wahl allein in `story.makeScene()` über `?buehne=`
  - Untertitel-DOM und SVG-Erzeugung geteilt
  - eigenes Canvas in `#story .scene` als Ersatz für `.world`, die CSS-Übergänge bleiben
  - `__prisma.buehne` mit `bilder()` und `speicher()` für die Proben
- Arbeitspakete nach Stufe 1:
  - WP-0: Schnittstelle und Schalter
  - danach parallel:
    - WP-A: Epilog-Akte `blink` und `answer`
    - WP-B: Übergänge Finale → Epilog und Epilog → Menü, `starAt`
    - WP-C: Reisen mit 60 Bildern/s, Zweig `leistung/19-reisen-60`
    - WP-E: Proben mit `--buehne`
  - WP-D nach WP-A: Drehen, Seitenmassstab, reduzierte Bewegung, verborgener Tab, Ruhe-Politik, Speicher auf dem Handy
