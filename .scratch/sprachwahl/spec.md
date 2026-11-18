# Spec: Sprachwahl

Status: in Arbeit (Branch `feature/sprachwahl` von `main` 08d3d80)

Wunsch des Nutzers (18.11.2026) zum Schalter der Sprache oben rechts im Menü (Ticket 07 und 08 von `.scratch/umbau/`):

1. Man sieht nur die aktuelle Sprache («🌐 DEUTSCH»). Ein Klick wechselt sofort zur anderen, ohne dass man vorher
   sieht, welche das ist.
2. Ein Wechsel lädt die Seite neu, und das Spiel beginnt wieder beim Startbildschirm. Der Nutzer fragt, ob das nötig
   ist. Er wünscht, dass das laufende Spiel einfach die neue Sprache übernimmt.

## Entscheide

- **Wechsel ohne Neuladen** (18.11.2026): Das laufende Spiel zeigt ab dem Wechsel alle Texte in der neuen Sprache. Es
  baut dafür weder Szene noch Himmel noch Brett neu, und man bleibt, wo man ist. Ticket 07 hatte das Neuladen gewählt,
  weil es einfacher war («sofort oder nach einem Neuladen, je nachdem, was einfacher ist»). Darum holen heute mehrere
  Module ihre Texte nur einmal beim Laden.
- **Liste beim Antippen** (vom Nutzer gewählt am 18.11.2026, aus drei Skizzen: «beide Sprachen nebeneinander»,
  «Liste beim Antippen», «Zielsprache zeigen»): Der Schalter zeigt den Globus, die aktuelle Sprache und ein ▾.
  Antippen öffnet eine kleine Liste aller Sprachen, je mit ihrem Namen in ihr selbst. Die aktuelle Sprache hat ein
  Häkchen. Ein Antippen einer anderen Sprache wechselt. Die Liste braucht zwei Schritte, passt aber auch für spätere
  weitere Sprachen.

```
Menü, oben rechts:

   🌐 DEUTSCH ▾
   ┌─────────────┐
   │ ✓ Deutsch   │
   │   English   │
   └─────────────┘
```

- **Bessere Lage des Schalters** (Wunsch des Nutzers 18.11.2026): Auf dem Handy geht der Schalter oben rechts
  zwischen den nahen Texten unter. Seine Lage wählt der Nutzer aus einem Skizzenkatalog (Ticket 03).

## Tickets

Die Umsetzungen nacheinander, weil alle `src/seite/oberflaeche/menue.js` ändern: 01, dann 03, dann 02. Die Liste
baut auf der gewählten Lage auf. Den Katalog von Ticket 03 gibt es schon während Ticket 01, er ändert keinen Code.
Nach jedem Ticket ein unabhängiges Review, dann der Commit.

- `issues/01-wechsel-ohne-neuladen.md`: Die Sprache wechselt im laufenden Spiel. Der Schalter bleibt dabei, wie er
  ist.
- `issues/03-lage-des-schalters.md`: Zuerst ein Skizzenkatalog der Lage, der Nutzer wählt, dann die Umsetzung.
- `issues/02-liste-beim-antippen.md`: Der Schalter öffnet die Liste, an der Lage aus Ticket 03.

Danach testet der Nutzer auf dem Desktop und auf dem Handy, dann folgt der Merge nach `main`.
