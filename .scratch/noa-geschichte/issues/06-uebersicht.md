# 06: Übersicht mit Bestwerten, Wiederholen

**Spec:** ../spec.md

**Blocked by:** 04

**Status:** ready-for-agent

**What to build:** Die Übersicht des Grads ersetzt die Levelauswahl (Entscheid 9, 16, 24): die Welten des Durchgangs
mit je 10 Kacheln, dazu «Im Dorf», wenn es gespielt wurde. Gelöste Level lassen sich ohne Zwischenszenen wiederholen;
jede Kachel zeigt Bestzeit und wenigste Drehungen.

- [ ] Je Welt eine Reihe mit Name der Welt, ihrem Zeichen (Station) und der Summe der Bestzeiten; je Kachel Nummer,
      Titel, gelöst, Bestzeit, wenigste Drehungen. Das nächste ungelöste Level ist offen, spätere sind gesperrt.
- [ ] Speicherstand: je Level Bestzeit und wenigste Drehungen, je für sich (`prisma.noa.*`, je Grad).
- [ ] Wiederholen: ohne Träger, Reise und Untertitel; «Weiter» zum nächsten Level der Reihe; beim Wechsel der Welt
      blendet nur der Hintergrund; beim nächsten noch ungelösten Level gilt wieder der normale Ablauf (Einstieg,
      Reisen, Finale).
- [ ] Feld «Gelöst»: eine neue Bestmarke kurz melden («Neue Bestzeit», «Weniger Drehungen»).
- [ ] Aus dem Menü öffnet ein geschaffter Grad seine Übersicht (Ticket 05 anpassen).
- [ ] Wischen und Blättern wie in der bisherigen Levelauswahl, wo es passt; Probe im Browser auf Desktop und Handy (hoch
      und quer).
- [ ] Alle Tests grün; Review nach dem Ticket.

## Comments

**Baustein vorgebaut (29.10.2026):** `.scratch/noa-geschichte/bausteine/uebersicht/` (`uebersicht.js`,
`uebersicht.css`, `probe.html`, `LIESMICH.md` mit Schnittstelle, Speicherstand-Vorschlag
`prisma.noa.<grad>.bestwerte` und `merkeBestwerte`; Bilder mit `aufnahme.mjs` neu). Desktop: alle Welten
untereinander mit Lichtweg je Reihe; Handy/Tablet: eine Welt je Seite, Stationen oben, Wischen nur auf den Kacheln.
Entscheide des Koordinators zu den offenen Fragen: Titel gesperrter Level bleiben blass sichtbar; nach «Überspringen»
im Dorf sind alle Übungen frei; eine neue Bestmarke wird erst gemeldet, wenn es schon einen Wert gab; die Taste L
öffnet die Übersicht wie bisher die Levelauswahl; Zeichen für Drehungen mit Legende genügt; die Gesamtsumme steht nur
bei einem geschafften Grad. Kleinigkeit für den Einbau: Trennung «Asteroiden-gürtel» statt «Asteroidengür-tel».
