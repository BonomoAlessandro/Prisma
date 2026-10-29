# Übersicht des Grads – Baustein für Ticket 06

Die Übersicht eines Grads (Spec `../../spec.md`, Entscheide 9, 16, 19, 24; Ticket `../../issues/06-uebersicht.md`),
fertig zum Einsetzen in `index.html`. Sie ersetzt die bisherige Levelauswahl: je Welt eine Reihe mit Station, Name und
Summe der Bestzeiten, je Level eine Kachel mit Nummer, Titel, gelöst, Bestzeit und wenigsten Drehungen. Gestalt wie das
Menü «Lichtwege zum Polarstern»: Nachthimmel, Welten als Stationen, ein Lichtweg durch jede Reihe bis zum nächsten Level.

| Datei | Inhalt |
|---|---|
| `uebersicht.css` | Stil, alles unter `.ueb` mit Präfix `ueb-` (kollidiert nicht mit `index.html`) |
| `uebersicht.js` | `createUebersicht(…)`, Vanilla-JS, klassisches Skript wie das Spiel, keine Bibliotheken |
| `probe.html` | Testseite mit dem Himmel aus dem Spiel und vier Beispielständen |
| `aufnahme.mjs` | Bilder und Prüfungen in headless Chrome (nach `bilder/`, nicht versioniert) |

## Einsetzen in index.html

1. `uebersicht.css` in den `<style>`-Block (eigener Abschnitt «Übersicht», an Stelle von «Levelauswahl»). Die Datei
   braucht `--ink` und `--font` aus `:root` (mit Rückfall, falls sie fehlen).
2. An Stelle von `<div id="levels" …>` ein leeres `<div id="uebersicht"></div>`. Die Übersicht liegt mit `z-index: 6`
   wie die alte Levelauswahl: über Kopfzeile und Knöpfen, unter `#story` (7) und `#intro` (8).
3. `uebersicht.js` (ohne `'use strict'`, das Spiel hat es schon) in das Skript, nach `STORY_ICONS`, dann:

```js
const uebersicht = createUebersicht({
  root: $('uebersicht'),
  icons: STORY_ICONS,
  onPlay: ({ welt, level, wiederholen, eintrag }) => { uebersicht.hide(); /* Level starten, siehe unten */ },
  onClose: () => { uebersicht.hide(); /* Fokus zurück auf den Knopf, der sie geöffnet hat */ },
});
```

4. Wie bei der alten Levelauswahl (`ui.openLevels`/`closeLevels`) beim Öffnen `#controls`, `#solved` und `#hud` inert
   setzen und die Kopfzeile ausblenden (`body.levels-open #hud`), beim Schliessen zurück. Aus dem Menü (Ticket 05)
   das Menü ausblenden, solange die Übersicht offen ist: Ihr Hintergrund ist halb durchsichtig (Himmel bzw. Szene
   bleiben sichtbar), Schrift dahinter schiene durch.
5. Tasten: Die Übersicht fängt ihre Tasten (Pfeile, Pos1, Ende, Bild↑/↓, Escape, Tab) in der Capture-Phase ab und
   gibt sie nicht weiter. Der Tastenhandler des Spiels sollte trotzdem am Anfang `if (uebersicht.offen) return;`
   haben (sonst wirken R, N usw. aufs Brett darunter); wer M (Ton) offen lassen will, nimmt es davor.

## Schnittstelle

`createUebersicht({ root, icons, onPlay, onClose })` baut die Übersicht in `root` und gibt `{ show, hide, offen }`
zurück. `show(daten, wahl?)` zeichnet sie jedes Mal neu aus den Daten, blendet sie ein und setzt den Fokus;
`hide()` blendet aus; `offen` sagt, ob sie offen ist. Die Übersicht schliesst nie selbst: `onPlay` und `onClose`
melden nur, der Aufrufer ruft `hide()`.

### Daten

```js
uebersicht.show({
  grad: 'mittel',                       // Schlüssel wie in STORY_LEVELS ('sehr schwer' mit Leerzeichen)
                                        // oder { name: 'Mittel', punkte: 2 }
  welten: [                             // die 6 Welten in der Reihenfolge der Reise
    { name: 'Bergwald', icon: 'wald',   // icon: Schlüssel in icons (STORY_ICONS)
      level: [                          // die 10 Level der Welt in Reihenfolge
        { name: 'Enzian',               // stabiler Schlüssel (kommt in onPlay zurück, wird nicht gezeigt)
          titel: 'Fichtennadel',        // Anzeigename; ohne titel zeigt sie name
          geloest: true,
          bestzeit: 102,                // Sekunden (ganze oder mit Bruchteil), null: noch keine
          drehungen: 7 },               // wenigste Drehungen, null: noch keine
        …] },
    …],
  dorf: { level: [ … 9 Übungen … ] },   // nur, wenn «Im Dorf» gespielt wurde; sonst weglassen oder null
                                        // (name 'Im Dorf' und icon 'dorf' sind vorgegeben, überschreibbar)
  aktuell: { welt: 2, level: 3 },       // das laufende Level (aus dem Spiel geöffnet), sonst weglassen;
                                        // welt: Index in welten oder 'dorf'
}, { fokus: { welt: 0, level: 0 } });   // wahl (frei): diese Kachel fokussieren bzw. ihre Welt zeigen
```

Die Übersicht rechnet daraus:

- **Zustand je Level:** gelöst (wieder spielbar), **offen** (das erste ungelöste der Reise), **gesperrt** (jedes
  spätere ungelöste: sichtbar, nicht wählbar). Die sechs Welten sind eine Kette über alle Reihen; «Im Dorf» ist eine
  eigene Kette (nach «Überspringen» ist die nächste Übung offen, die übrigen gesperrt).
- **Je Welt:** gelöst / 10 und die Summe der Bestzeiten der gelösten Level (fehlt, solange keine da ist).
- **Kopf:** Grad als Punkte und Name, gelöste / 60; ist alles gelöst, «Geschafft» mit dem Polarstern und die Summe
  aller Bestzeiten.
- **Werte:** Zeit kurz wie im Feld «Gelöst» (`1:42`, ab einer Stunde `1:02:05`, angefangene Sekunden abgeschnitten),
  Drehungen als Zahl mit Zeichen; die Legende im Kopf erklärt beide Zeichen. Was keinen Bestwert hat, bleibt leer.
- **Fokus beim Öffnen:** `wahl.fokus`, sonst `aktuell`, sonst die offene Kachel, sonst die erste der ersten Welt.

### Ereignisse

- `onPlay({ welt, level, wiederholen, eintrag })`: eine gelöste oder offene Kachel gewählt (Klick, Tippen, Enter,
  Leertaste). `welt`: Index in `welten` oder `'dorf'`; `level`: Index in der Reihe (0–9); `wiederholen`: `true` bei
  einem gelösten Level (ohne Träger, Reise und Untertitel spielen, Entscheid 16), `false` bei der offenen Kachel
  (normaler Ablauf: Einstieg, Reisen, Finale); `eintrag`: das Level-Objekt aus den Daten (mit `name`).
- `onClose()`: Escape, «Schliessen» oder Klick auf den Hintergrund neben den Kacheln.
- Eine gesperrte Kachel meldet nichts nach aussen; die Übersicht sagt selbst kurz «Gesperrt – erst «Sandsturm»
  (Wüste 3) lösen» (auch für Bildschirmleser, `role="status"`).

## Darstellung

- **Desktop** (Fenster ab 1180 × 600 px, `data-modus="alle"`): alle Welten untereinander, je Reihe links Name,
  Stand und Station, rechts 10 Kacheln; «Im Dorf» als erste Reihe. Durch jede Reihe ein Lichtweg von der Station bis
  zur offenen Kachel (bei einer fertigen Welt ganz durch), danach fein gestrichelt. Auf niedrigen Bildschirmen (unter
  820 px, etwa ein Laptop mit 1536 × 730 bei 125 %) steht der Kopf in einer Zeile und «Schliessen» oben rechts, damit
  die Reihen Platz haben; unter 1360 px Breite wird die Spalte der Welten schmaler. Eine Reihe wird nie niedriger als
  ihr Inhalt; reicht die Höhe trotzdem nicht, scrollt die Liste, Kopf und «Schliessen» bleiben stehen.
- **Sonst** (`data-modus="seiten"`: Handy hoch und quer, Tablet, kleines Fenster): eine Welt je Seite. Oben die
  Stationen als Weg (fertige hell, die jetzige mit Hof, die gezeigte mit Punkt; antippen springt hin), darunter
  ‹ Welt › mit Stand. Kacheln hochkant 2 × 5, quer und auf dem Tablet 5 × 2; quer stehen Grad, Stationen und
  «Schliessen» in einer Zeile.
- **Blättern** wie in der bisherigen Levelauswahl: Pfeile, Stationen, Wischen **nur auf den Kacheln** (Finger und
  Stift, nicht die Maus) mit Bewegung: die Kacheln folgen dem Finger, die Nachbarwelt fährt herein, ab 50 px blättert
  es, sonst federt es zurück, am Anfang und Ende nur zögernd; senkrechtes Ziehen scrollt. Ein Klick gleich nach dem
  Wischen wählt keine Kachel. Bei reduzierter Bewegung ohne Fahrt.
- **Lange Titel:** passt ein Wort nicht in die Kachel, wird es kleiner gesetzt; passt es auch so nicht, wird es
  getrennt, vor einem Anlaut, mit dem ein deutsches Wort beginnen kann (Feuer-schlund, Asteroiden-gürtel; eigene
  einfache Regel, weil `hyphens: auto` nicht jeder Browser auf Deutsch kann). Bei 1440 px Breite betrifft das nur
  «Johanniswürmchen» und «Asteroidengürtel» (kleiner gesetzt), auf dem Handy keinen Titel.

## Bedienung und Bildschirmleser

- `role="dialog"`, `aria-modal`, benannt «Übersicht», beschrieben mit Grad und Fortschritt («Mittel, 22 von 60 Level
  gelöst»). Tab bleibt im Dialog.
- Jede Kachel ist ein Knopf mit vollem Namen: «Level 4, Wellenkamm, gelöst, Bestzeit 1 Minute 42 Sekunden,
  wenigste 7 Drehungen», «Level 3, Sandsturm, als Nächstes zu spielen», «Level 5, Hieroglyphe, gesperrt»
  (gesperrt zusätzlich `aria-disabled`, bleibt fokussierbar, damit man es hört). Das laufende Level hat
  `aria-current`. Jede Welt ist eine Gruppe mit Namen und Stand.
- Nur eine Kachel ist mit Tab erreichbar (die zuletzt fokussierte); **Pfeile** links/rechts gehen in der Reihenfolge
  der Reise weiter, auch über die Grenze der Welt (auf Seiten blättert es mit), hoch/runter eine Reihe (Desktop: in
  die Welt darüber/darunter), **Pos1/Ende** Anfang/Ende der Welt (mit Strg: der ganzen Reise), **Bild↑/↓** vorige/
  nächste Welt, **Enter/Leertaste** spielt, **Escape** schliesst. Auf den Stationen wechseln ←/→ die Station.
- Fokus sichtbar: 2 px weiss mit bläulichem Hof (stärker als sonst im Spiel, weil er auf dem Himmel stehen muss).
- Gesperrt ist nicht nur blasser, sondern gestrichelt und mit Schloss; offen hell mit Hof und «Weiter ›» («Üben ›»
  im Dorf); gelöst mit leuchtendem Punkt und den Werten.
- Beim Blättern sagt eine höfliche Live-Region die neue Welt an («Vulkan: 0 von 10 gelöst»).

## Speicherstand (Vorschlag)

Je Grad ein Schlüssel neben den übrigen aus Ticket 04, mit dem stabilen Schlüssel `name` jedes Levels (nicht dem
Titel), die Übungen des Dorfs eingeschlossen (sie gehören auch zum Grad):

```
prisma.noa.<grad>.bestwerte = {"Enzian":{"zeit":102,"drehungen":7},"Erstes Licht":{"zeit":14,"drehungen":1},…}
```

- `zeit`: ganze Sekunden (`Math.floor(flow.solveStats.seconds)`), so wie das Feld «Gelöst» und die Übersicht sie
  zeigen. So meldet das Spiel nie «Neue Bestzeit», wenn die Anzeige gleich bleibt.
- `drehungen`: `flow.solveStats.turns`.
- Je für sich (Entscheid 24): Die Zeit gilt, wenn sie kleiner ist, die Drehungen, wenn es weniger sind, auch aus
  verschiedenen Läufen.
- Melden (Feld «Gelöst»): nur, wenn es schon einen Wert gab und der neue besser ist; beim ersten Lösen nicht.

```js
/** Bestwerte eines Levels nachführen; gibt zurück, was sich verbessert hat (für das Feld «Gelöst»). */
function merkeBestwerte(grad, name, { seconds, turns }) {
  const key = `prisma.noa.${grad}.bestwerte`, zeit = Math.floor(seconds);
  let alle = {};
  try { alle = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { /* leer */ }
  const alt = alle[name] ?? {};
  alle[name] = { zeit: Math.min(alt.zeit ?? Infinity, zeit), drehungen: Math.min(alt.drehungen ?? Infinity, turns) };
  try { localStorage.setItem(key, JSON.stringify(alle)); } catch { /* privates Fenster */ }
  return { neueBestzeit: alt.zeit !== undefined && zeit < alt.zeit, wenigerDrehungen: alt.drehungen !== undefined && turns < alt.drehungen };
}
```

Die Daten für `show()` setzt das Spiel aus `STORY_LEVELS[grad]`, den Titeln in `LEVELS`, den gelösten Leveln des
Grads (Ticket 04) und diesen Bestwerten zusammen; `dorf` nur, wenn der Spieler «Üben» gewählt hat.

## Probe und Bilder

`probe.html?stand=anfang|mitte|geschafft|dorf` (dazu `&welt=dorf|0…5`): Mittel mit 2 gelösten, Mittel wie im Menü
(Wüste 23 / 60), Leicht geschafft, Sehr schwer mit dem Dorf (6 von 9 Übungen, dann übersprungen; Übung 2 ohne
Bestwerte) und 7 im Bergwald, die achte «Johanniswürmchen» offen. Echte Titel aus `tools/geschichte/wahl.json`.
Geschlossen zeigt die Seite das letzte Ereignis. Hintergrund: `../../menue-vorschau/hintergrund-*.png` (fehlen sie,
dort `aufnahme.mjs himmel`).

```
LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/bausteine/uebersicht/aufnahme.mjs [desktop|hoch|quer]
LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/bausteine/uebersicht/aufnahme.mjs pruefen
```

Ohne Argument: je Stand Desktop 1440 × 900, Handy hoch 390 × 844 und quer 844 × 390 (Gerätepixel 2), dazu
`fokus-desktop` (Tastaturfokus), `dorf-dorf-hoch` (Seite «Im Dorf»), `wischen-hoch` (mitten im Wischen) und
`gesperrt-hoch` (Hinweis). Jede Aufnahme meldet Abgeschnittenes, zu breite Titel und die kleinste Kachel.
`pruefen`: Tastatur und Ereignisse Schritt für Schritt (Desktop und Handy), dazu Laptop 1280 × 720 und Tablet
1024 × 768.

## Offene Fragen

1. **Titel gesperrter Level** sind sichtbar (blass). Lieber verbergen (nur Nummer und Schloss), damit nichts vorweg
   verraten wird?
2. **«Im Dorf» nach «Überspringen»:** Die nächste Übung ist offen, die übrigen gesperrt (wie in den Welten). Oder
   sollen dann alle Übungen frei sein?
3. **Neue Bestmarke** nur melden, wenn es schon einen Wert gab (nicht beim ersten Lösen)?
4. **Taste zum Öffnen** im Spiel: L wie bisher die Levelauswahl?
5. **Zeichen für Drehungen:** ein Pfeil im Uhrzeigersinn, das Spiegelbild von «Level neu starten». Mit der Legende
   im Kopf eindeutig genug, oder ein anderes Zeichen?
6. **Summe aller Bestzeiten** steht nur im Kopf eines geschafften Grads; je Welt immer, sobald eine Bestzeit da ist
   (auch wenn die Welt noch nicht fertig ist).
