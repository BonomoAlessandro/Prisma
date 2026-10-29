# Menü der Geschichte (Baustein für Ticket 05)

Variante 3 «Lichtwege zum Polarstern», vorgebaut für `index.html`: je Grad ein Lichtweg von Noas Lampe zum Polarstern,
hell so weit, wie das Licht im Grad gekommen ist, die sechs Welten als Punkte darauf. Vanilla-JS ohne Bibliotheken,
einziger globaler Name `createMenu`; alle Klassen beginnen mit `menue-`, die IDs im SVG mit `menue-<n>-`.

| Datei | Inhalt |
|---|---|
| `menue.js` | `createMenu` (in den Skriptblock von `index.html`, z. B. vor `ui`) |
| `menue.css` | Gestalt (in den `<style>`-Block, z. B. nach «Geschichte»); schon eingerückt wie dort |
| `probe.html` | Testseite mit dem Nachthimmel und Beispielständen |
| `aufnahme.mjs` | Bilder nach `bilder/` und Prüfung (Regeln, Tastatur, Rückfrage, Lage in vielen Grössen) |

## Einsetzen

```html
<div id="menue"></div>   <!-- z. B. nach #story; der Baustein füllt es selbst -->
```

```js
const menu = createMenu({
  root: $('menue'),
  icons: STORY_ICONS,          // optional: die Zeichen der Welten aus dem Spiel statt der Kopie im Baustein
  uebersicht: true,            // false bis Ticket 06: ein geschaffter Grad fragt «Von vorn» statt die Übersicht zu öffnen
  onAction({ aktion, grad }) { /* siehe unten */ },
});
menu.show(stand);              // nach dem Startbildschirm, nach «Menü» im Spiel, am Ende des Epilogs
await menu.hide();             // vor dem Spiel; erfüllt, wenn es ganz ausgeblendet ist
```

Im Tastatur-Handler des Spiels ganz vorn (nach dem Startbildschirm), damit R, N, Pfeile usw. das Feld darunter nicht
bedienen:

```js
if (menu.offen) { if (!menu.keydown(e) && e.code === 'KeyM') ui.toggleSound(); return; }
```

Solange das Menü offen ist, sollen Kopfzeile, Knöpfe und «Gelöst» ausgeblendet und `inert` sein (wie bei der
Levelauswahl heute). Das Menü liegt mit `z-index: var(--menue-z, 7)` über dem Spiel und unter dem Startbildschirm (8).
Es bringt einen leichten Schleier mit, der Himmel des Spiels bleibt dahinter sichtbar; die Kamera sollte dafür in den
Himmel schauen (wie in den Zwischenszenen, `story.aimGaze`), sonst steht das Brett hinter den Wegen.

## Daten: `stand`

```js
{
  grade: {
    leicht:        { stand: 'geschafft' },
    mittel:        { stand: 'begonnen', welt: 'wueste', geloest: 23 },
    schwer:        { stand: 'neu' },          // fehlt ein Grad, gilt er als neu
    'sehr schwer': { stand: 'neu' },
  },
  zuletzt: 'mittel',      // zuletzt gespielter Grad (prisma.noa.*) oder null
  hervorheben: false,     // true nur direkt nach dem Epilog
}
```

- Schlüssel der Grade wie das Feld `grad` in `LEVELS` (`GRAD_ANZEIGE`): `leicht`, `mittel`, `schwer`, `sehr schwer`.
- `stand`: `'neu'`, `'begonnen'` oder `'geschafft'`.
- `geloest`: gelöste Level des Durchgangs, 0 … 60. Zeigt «Wüste · 23 / 60» und wie weit das Licht reicht (23/60 des
  Wegs). Beim geschafften Grad gilt 60.
- `welt`: wo das Licht gerade ist: `'wald'`, `'meer'`, `'wueste'`, `'vulkan'`, `'planeten'`, `'sterne'` (wie
  `STORY_ICONS`) oder die Nummer 0 … 5; `'dorf'` vor der ersten Welt (Prolog, «Im Dorf»). Fehlt sie, folgt sie aus
  `geloest` (je 10 eine Welt).

## Regeln

- **Weiter** gibt es nur, wenn `zuletzt` ein begonnener Grad ist; es zeigt «Mittel · Wüste 23 / 60». Sonst fehlt der
  Knopf (alles neu, zuletzt geschafft, `zuletzt` leer).
- **Von vorn** bei jedem begonnenen und geschafften Grad; erst nach der Rückfrage im Baustein kommt `onAction`.
- **Geschafft:** Polarstern und «Geschafft», der Weg ganz hell; die Karte öffnet die Übersicht.
- **Hervorheben:** Mit `hervorheben: true` und geschafftem `zuletzt` (direkt nach dem Epilog) wird der nächstschwerere,
  noch nicht geschaffte Grad hervorgehoben (Ring um die Lampe, Weg bläulich, «als Nächstes empfohlen» für den
  Bildschirmleser) und bekommt den Fokus. Ist er schon geschafft, der nächste danach; nach «sehr schwer» keiner.
  Statt `true` geht auch der Schlüssel eines Grads. Ohne `hervorheben` führt «Weiter».
- **Fokus beim Öffnen:** «Weiter», sonst der hervorgehobene, sonst der zuletzt gespielte, sonst der erste begonnene,
  sonst «Leicht».

## Ereignisse: `onAction({ aktion, grad })`

| `aktion` | wann | was das Spiel tut |
|---|---|---|
| `'weiter'` | Knopf «Weiter» (`grad` = `zuletzt`) | `menu.hide()`, Fortsetzung des Grads |
| `'fortsetzen'` | Karte eines begonnenen Grads | `menu.hide()`, Fortsetzung |
| `'beginnen'` | Karte eines neuen Grads | `menu.hide()`, neuer Durchgang (Prolog …) |
| `'uebersicht'` | Karte eines geschafften Grads | `menu.hide()`, Übersicht (Ticket 06) |
| `'vonvorn'` | «Von vorn» und Rückfrage bestätigt | Stand nur dieses Grads löschen, dann `menu.show(neuerStand)` |

Nach jeder Aktion ausser `'vonvorn'` nimmt das Menü bis zum nächsten `show()` keine weitere an (kein Doppelklick).
Nach `'vonvorn'` bleibt es offen; ruft das Spiel darin `show()` mit dem neuen Stand, bleibt der Fokus beim Grad, und der
Bildschirmleser hört «Mittel: Stand gelöscht.».

## Bedienung

- **Tastatur:** Tab in der Reihenfolge «Weiter», je Grad Karte und «Von vorn». Pfeile (auf und ab, links und rechts)
  springen zwischen «Weiter» und den Karten, Pos1/Ende zum ersten und letzten. Enter/Leertaste lösen aus. In der
  Rückfrage: Fokus zuerst auf «Abbrechen», Tab und Pfeile wechseln zwischen den zwei Knöpfen, Escape oder Klick daneben
  schliesst sie, der Fokus geht zurück auf «Von vorn».
- **Fokusrahmen:** weiss mit Hof, nur nach Tastatur (nach Klick oder Finger nicht, auch wenn das Menü den Fokus setzt).
- **Bildschirmleser:** Das Menü ist ein Dialog «Menü», die Grade eine Liste. Jede Karte sagt Grad, Stand und Aktion
  («Mittel: begonnen, Wüste, 23 von 60 Leveln gelöst. Fortsetzen»), «Weiter» sein Ziel, «Von vorn» den Grad
  («Mittel von vorn beginnen»); die Wege, Punkte und Sterne sind ausgeblendet (`aria-hidden`). Die Rückfrage ist ein
  `alertdialog` mit Titel und Text, das Menü dahinter `inert`.
- **Bewegung:** Ein- und Ausblenden wie die übrigen Ebenen des Spiels (0,8 s); beim Öffnen wächst das Licht von der
  Lampe zu seinem Kopf, die Punkte gehen an, wenn es sie erreicht. Mit `prefers-reduced-motion` steht alles gleich da
  (nur die Überblendung bleibt), auch der Puls um den hervorgehobenen Grad ruht.

## Anordnung

- **Desktop und Handy quer:** Lampen links untereinander, die Beschriftung rechtsbündig davor, der Stern rechts oben;
  «Weiter» unter dem Kopf des Lichts mit feiner Linie dorthin, nie über der Beschriftung oder dem Rand. Die Zeichen der
  Welten stehen neben dem Weg von «Weiter» (sonst des hervorgehobenen Grads; ist alles neu, des leichten).
- **Handy hoch** (`max-width: 600px` und hochkant): die Grade als Zeilen unten, «Weiter» ganz unten in Reichweite des
  Daumens. Die Lampen stehen gestaffelt am linken Rand (Leicht innen, Sehr schwer aussen); jeder Weg steigt senkrecht
  auf, biegt über den Zeilen ab (je schwerer, desto höher) und läuft im Fächer zum Stern rechts oben. So kreuzt kein Weg
  eine Beschriftung oder einen anderen Weg, der schwerste Weg ist der längste, und am Stern kommen die vier Wege aus
  verschiedenen Richtungen an. Die Zeichen der Welten sitzen hier auf dem Weg.
- Die Wege rechnet `menue.js` bei jeder Grössenänderung neu (ResizeObserver, `resize`, nach dem Laden der Schrift).

## Probe und Bilder

`probe.html?stand=neu|mitte|leicht|epilog|alle|bunt|dorf` (Vorgabe `leicht`), dazu `&start` (erst «Klicken zum
Starten»), `&ohne-uebersicht`, `&aufnahme` (ohne Leiste). Die Seite spielt die Aktionen nach: «Von vorn» setzt den Grad
zurück, die übrigen blenden das Menü aus, «Zum Menü» bringt es wieder. Der Himmel kommt aus
`../../menue-vorschau/hintergrund-*.png` (nicht versioniert; `menue-vorschau/aufnahme.mjs himmel` macht ihn neu).

```sh
LEISE_CPU=50 sh tools/leise.sh node .scratch/noa-geschichte/bausteine/menue/aufnahme.mjs [alles|bilder|pruefen] [desktop|hoch|quer]
```

Ein Format oder mehrere mit Komma (`hoch,quer`). Zeitrahmen: jede Anfrage an Chrome höchstens 20 s, der ganze Lauf
höchstens 12 min; dann schliesst das Skript Chrome und bricht mit Fehler ab, statt die Sperre von `leise.sh` zu halten.
Auf dem Handy wird getippt (`Input.dispatchTouchEvent`): Mit der Touch-Emulation aus `tools/chrome.mjs` kommt
`Input.dispatchMouseEvent` nie zurück. Die Bilder in `bilder/` sind nicht versioniert (`.gitignore`).
