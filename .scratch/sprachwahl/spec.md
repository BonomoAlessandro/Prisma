# Spec: Sprachwahl

Status: umgesetzt (18.11.2026: Tickets 01–03 fertig und reviewt, `db4d746` auf `feature/sprachwahl` von `main`
08d3d80; offen sind der Test des Nutzers und der Merge nach `main`)

Offen aus den Reviews:
- `sprachliste.js` importiert `./ui.js` nur für die Ladereihenfolge, die der Kettentest in `tests/logic.test.mjs`
  verlangt. Sauberer wäre, es dort als Hilfe (`hilfen`) aufzunehmen wie `aufgabe.ts`. Dann lädt auch die Probeseite
  das Modul direkt.
- Die GPU-Referenzen `*-welt-4-*` (Vulkan) passen auf dieser Grafikkarte nicht mehr (Lavarisse unten links). Das
  stammt nicht aus diesem Vorhaben. Neu schreiben, wenn SwiftShader grün ist (CLAUDE.md, Prüfläufe).

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

- **Lage des Schalters** (Wunsch des Nutzers 18.11.2026): Auf dem Handy geht der Schalter oben rechts zwischen den
  nahen Texten unter. Ein Skizzenkatalog zeigte sieben Lagen (Ticket 03). Der Nutzer wählte die heutige: Der Schalter
  bleibt oben rechts, die Liste geht nach unten auf.

## Tickets

Erst 01, dann 02, weil beide `src/seite/oberflaeche/menue.js` ändern. Den Baustein der Liste gibt es schon während
Ticket 01, in einem eigenen Worktree. Nach jedem Ticket ein unabhängiges Review, dann der Commit.

- `issues/01-wechsel-ohne-neuladen.md`: Die Sprache wechselt im laufenden Spiel. Der Schalter bleibt dabei, wie er
  ist.
- `issues/03-lage-des-schalters.md`: Skizzenkatalog der Lage. Erledigt mit der Wahl «wie heute», ohne Umsetzung.
- `issues/02-liste-beim-antippen.md`: Der Schalter öffnet die Liste, nach unten.

Danach testet der Nutzer auf dem Desktop und auf dem Handy, dann folgt der Merge nach `main`.
