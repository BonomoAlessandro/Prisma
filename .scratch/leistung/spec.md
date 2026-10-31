# Leistung: flüssig auf Desktop und Handy

**Status:** ready-for-agent

**Branch:** `feature/leistung` (von `main` abgezweigt). Merge nach `main` erst nach der Schlussabnahme, auf Ansage des
Nutzers.

## Problem

Die App braucht zu viel Leistung. Schon der Startbildschirm («Intro») und der Prolog ruckeln deutlich, sogar auf einer
RTX 3070 (1920 × 953, HUD im Prolog: 30 FPS, p95 34,9 ms; der HUD misst allerdings nur die WebGL-Bilder, nicht das, was
man sieht). Es gibt **kein Video**: Das Intro ist eine CSS/SVG-Animation, der Prolog eine bildschirmfüllende SVG-Szene.

Ursachen laut Untersuchung vom 31.10.2026 (Stellen in `index.html`):

1. **Unsichtbares wird gerendert.** Die ganze three.js-Pipeline läuft hinter dem deckenden Startbildschirm mit 60 fps
   weiter (`frameRate.busy()` um 19363: `flow.state !== 'play'` gilt als busy). Pro Bild: Szene plus Spiegelung (MSAA
   4×), HalfFloat-HDR, Bloom (Desktop: 64 Abtastungen pro Pixel im High-Pass), Final-Pass. Hinter dem Prolog
   (`story.covered`) läuft sie immer noch mit 30 fps, nie mit 0.
2. **Die Skybox lädt während der Enthüllung.** Die Wald-Skybox wird geladen: 6 MB base64 parsen, 4096er-JPEGs
   dekodieren, Mip-Ketten bauen, Uploads in 6-ms-Stücken. Dazu kommen bei `introCalm` (4,2 s) Shader-Kompilierung,
   Uploads, ein Aufwärm-Zeichnen und das Vorwärmen von Menü und Prolog (17632–17637). Alles kollidiert mit der sichtbaren
   Animation. Das erste Schreiben in eine grosse Textur hält den **Grafikprozess** 30–80 ms an (11778–11781). Das trifft
   auch CSS und SVG, deshalb hält `skyTheme.quiet` scharfes Bild und Streifen schon heute aus der Prolog-Fahrt heraus
   (18050–18054). «Klicken zum Starten» wartet auf `skyTheme.shown` (15803), obwohl der Himmel hinter dem deckenden
   Startbildschirm (`#intro`, 305) gar nicht zu sehen ist.
3. **Die Prolog-Schleife ist ungebremst.** `scene.frame()` (17538) läuft im Bildschirmtakt, also auch mit 144 Hz, und
   setzt pro Bild etwa 60 SVG-Attribute (Ebenen-Transforms, Glühwürmchen, Rauch, Strahl). Das SVG wird dadurch
   vermutlich jedes Mal neu gerastert. Dazu kommen Dutzende endlose CSS-Opacity-Animationen (367–368).
4. **Der erste Klick friert ein.** `audio.unlock()` (15097) baut einen 3,2 s langen Stereo-Hall (ConvolverNode) auf und
   blockiert die Seite 350–430 ms (PLAN.md:17).
5. **Grundlast im Ruhezustand:** nie unter 30 fps, 1600 Staubteilchen, Allokationen pro Bild (`cullInstances` 9618,
   `renderReflection` 19262), HD-Himmel auf jedem Desktop (etwa 260 MB Grafikspeicher), Menü mit `feGaussianBlur`.

## Ziele (Entscheide aus dem Grilling vom 31.10.2026)

- **Flüssig heisst:** p95 der sichtbaren Bildabstände ≤ 16,7 ms und kein Bild über 33 ms. Ausgenommen ist nur ein
  klar markiertes Laden hinter einer Überblendung. Weil die rAF-Zeitstempel bei 60 Hz um 16,6–16,8 ms schwanken, gilt
  für die Messung eine Toleranz von 10 %: p95 ≤ 18,3 ms. Gemeint ist, dass kein Display-Frame verpasst wird. Bei
  Bildschirmen über 60 Hz (das Poco hat 120 Hz) wird nicht häufiger gerendert, als die Animation braucht. Die Grenzen
  beziehen sich auf den 60-Hz-Takt der Animation.
- **Geräte:** Desktop wird auf dem Arbeitsrechner abgenommen, Android auf dem Xiaomi Poco F4 GT des Nutzers
  (Snapdragon 8 Gen 1). Weil das Poco ein Spitzengerät war, gilt dort eine **Marge: p95 der Zeichenzeit ≤ 8 ms** im
  Referenzdurchlauf. Was «Zeichenzeit» genau ist, legt Ticket 01 fest: GPU-Zeit, wenn messbar, sonst ein Ersatzmass.
  Damit kommen 3–4 Jahre alte Mittelklasse-Handys (Android und iOS) mit. iOS wird nicht geprüft. Bekannte
  Safari-Schwachstellen meiden wir trotzdem: sehr grosse Texturen, hoher Grafikspeicher, teure SVG-Filter. Dauerlast
  und Erwärmung sind kein Abnahmekriterium.
- **Qualität:** Erlaubt ist alles, was Spielern nicht auffällt. Massstab ist der Vergleich nebeneinander bei normalem
  Abstand auf dem jeweiligen Gerät. Unterschiede, die nur im Zoom zu sehen sind, sind in Ordnung.
- **Eine Fassung:** Es gibt keinen Grafikschalter und keine Qualitätsstufen. Interne Einstellungen pro Gerät
  (`QUALITY`, `IS_MOBILE`) sind erlaubt, wenn auf dem Gerät kein Unterschied auffällt. Die automatische Absenkung
  (`adaptiveResolution`) bleibt nur als Notbremse für schwache Geräte; auf Poco und Arbeitsrechner soll sie nicht
  greifen.
- **Startknopf:** «Klicken zum Starten» erscheint spätestens **3,9 s** nach Beginn der Enthüllung, heute frühestens
  nach 2,9 s. Auch die Wartezeit vor der Enthüllung bleibt kurz (Ticket 03).
- **So wenig Last wie möglich:** Was nicht zu sehen ist, wird nicht gerendert. Steht alles still, wird nichts
  gezeichnet. Läuft eine Animation, wird so selten wie möglich gezeichnet.

## Abnahme

- **Pro Ticket:** Vorher- und Nachher-Werte mit dem Messwerkzeug aus Ticket 01 im echten Chrome mit Fenster und GPU auf
  dem Arbeitsrechner, einmal ungedrosselt und einmal mit DevTools-Handy-Emulation und 4× CPU-Drosselung. Die Werte
  kommen unter `## Comments` ins Ticket. Headless-Läufe (`tools/chrome.mjs`) sichern nur gegen Rückschritte ab; ohne
  GPU rendern sie in Software und takten rAF virtuell. Ein Android-Emulator taugt nicht für Leistungsmessungen, weil er
  auf der GPU des PCs läuft.
- **Drei Handy-Durchläufe** durch den Nutzer auf dem Poco, über seinen Deploy auf Render: nach Ticket 01
  (Ausgangswert), als erster Schritt von Ticket 07 (wenn 02–06 alle erledigt sind) und am Schluss. Dafür wird der Stand
  auf `feature/leistung` committet und gepusht, und das Ticket bzw. der Schritt endet mit «bereit für Handy-Durchlauf,
  bitte auf Render deployen». Der Nutzer kopiert die Ergebniskarte ins Ticket.
- Wie im Projekt üblich: alle Tests grün, Review des Diffs vor jedem Commit.

## Tickets

| Nr. | Ticket | Blocked by |
|---|---|---|
| 01 | Messwerkzeug, Referenzdurchlauf, Ergebniskarte mit Version | – |
| 02 | Szene zeichnet nicht hinter deckenden Bildschirmen; Mechanismus für Ruhen und Aufwecken | 01 |
| 03 | Startknopf spätestens nach 3,9 s, Himmel lädt im Prolog | 02, 04 |
| 04 | Prolog-SVG flüssig | 01 |
| 05 | Hall vorab berechnen | 01 |
| 06 | Leerlauf auf 0 | 02 |
| 07 | Handy-Durchlauf 2, Messrunde ganze App, erzeugt weitere Tickets | 02, 03, 04, 05, 06 |

## Notizen für die Messrunde (Ticket 07), noch keine Tickets

Ob und wie diese Punkte angegangen werden, entscheiden die Zahlen vom Poco:

- Bloom: High-Pass-Shader (um 12794–12812) mit 8 × 8 = 64 Abtastungen auf dem Desktop (`bloomDiv` 2), 4 × 4 = 16 auf
  dem Handy (`bloomDiv` 1, dafür Pixelverhältnis 2), Upsampling über B-Splines.
- Spiegelung: zweites Rendern der Szene (`renderReflection` 19262), dazu `dimmed`-Array und `Color.clone()` pro Bild.
- Pinsel-Pass (Kuwahara, 8 Sektoren, nur Strand) in voller Auflösung.
- HD-Himmel auf dem Desktop (etwa 214–251 MB Grafikspeicher je Skybox), auch bei Onboard-Grafik mit geteiltem
  Speicher. Bänder 4096 × 3413 bzw. 3823 für Safari zu gross?
- Panorama-Netz mit 512 × 256 Segmenten, doppelseitig.
- 1600 Staubteilchen auf dem Desktop, 700 auf dem Handy (14012).
- `cullInstances` (9618) baut pro Bild und Mesh ein neues Array.
- Menü: `feGaussianBlur` 2,4 über das ganze Menü-SVG (16284), endloses Pulsieren.
- Startbildschirm, falls nach Ticket 03 noch nötig: Reveal per `clip-path` mit 60 px `text-shadow`, SVG-Fächer mit
  `feGaussianBlur` und `stroke-dashoffset`, Strahl mit `box-shadow`.
- Erstes Zeichnen einer frisch geladenen Skybox: 50–120 ms (Review Ticket 06 der Geschichte).
- «Spiel → Übersicht»: 87 ms (PLAN.md:18).
- Laufende Kosten des Hall-Convolvers auf dem Audio-Thread (aus Ticket 05).
