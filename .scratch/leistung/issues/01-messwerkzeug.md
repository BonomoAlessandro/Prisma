# 01: Messwerkzeug, Referenzdurchlauf, Ergebniskarte mit Version

**Spec:** ../spec.md

**Blocked by:** –

**Status:** ready-for-agent

**What to build:** Ein Messwerkzeug, das misst, was man **sieht**, nicht nur die WebGL-Bilder. Ausserdem einen festen
Referenzdurchlauf, an dessen Ende eine Ergebniskarte steht, die sich ohne Kabel auf dem Handy ablesen und kopieren
lässt. Alle weiteren Tickets messen damit vorher und nachher.

Arbeit auf dem Branch `feature/leistung`: von `main` abzweigen, falls es ihn noch nicht gibt, sonst den gepushten Stand
holen.

Heute misst der HUD (`perfHud`, `index.html` um 19299, `?perf` oder Taste **F**) nur die Abstände der *gerenderten*
WebGL-Bilder in `frame()`. Ist die Bildrate gedrosselt (30 fps hinter dem Prolog), zeigt er 30 FPS, egal wie flüssig
CSS- und SVG-Animationen laufen. Ruckler im Startbildschirm und im Prolog sieht er nicht.

- [ ] **Sichtbare Bildabstände:** eine eigene, leichte rAF-Messschleife, die nur bei `?perf` läuft und unabhängig von
      `frameRate` und `frame()` ist. Ticket 02 lässt `frame()` ruhen, die Messung muss trotzdem weiterlaufen. Sie misst
      den Abstand aufeinanderfolgender Display-Frames, Grenzwerte wie in der Spec (p95 ≤ 18,3 ms inklusive Toleranz,
      kein Bild über 33 ms). Wo verfügbar, kommen `PerformanceObserver` für `long-animation-frame` und `longtask` dazu,
      um Hänger des Hauptthreads mit Ursache (Script-Quelle) zu sehen. Die Messung selbst darf das Ergebnis nicht
      merklich verfälschen: keine Allokationen pro Bild, Ringpuffer.
- [ ] **Zeichenzeit, eindeutig definiert:** Wo `EXT_disjoint_timer_query_webgl2` verfügbar ist, gilt die GPU-Zeit pro
      gerendertem Bild. Auf vielen Android-Geräten fehlt die Erweiterung. Dann gilt als Ersatzmass die Zeit von Beginn
      `frame()` bis nach einem `gl.finish()` (bzw. einem 1-Pixel-`readPixels`, falls `finish` nicht blockiert). Das
      läuft **nur während des Referenzdurchlaufs**, weil es die Pipeline anhält. Die Karte zeigt, welches Mass
      verwendet wurde. Die 8-ms-Marge der Spec bezieht sich auf diese Zeichenzeit. Zusätzlich wird die CPU-Zeit von
      `frame()` ausgewiesen.
- [ ] **Abschnitte:** Die Messung wird automatisch nach Abschnitten getrennt: Startbildschirm, Prolog, Spiel (erstes
      Level), Menü, Weltwechsel bzw. Reise. Laden hinter einer Überblendung wird als solches markiert und getrennt
      ausgewiesen. Es zählt nicht gegen die Grenzwerte, aber die Werte werden trotzdem gezeigt.
- [ ] **Referenzdurchlauf:** Im HUD gibt es einen Knopf «Referenzdurchlauf». Er setzt einen frischen Spielstand
      **ohne den echten zu löschen** (eigener Speicherschlüssel oder Sicherung und Rückspielen) und lädt die Seite neu.
      Danach klickt man normal durch: Startbildschirm → Prolog → erstes Level lösen → Menü. Weil man mit frischem Stand
      nicht schnell in eine andere Welt kommt, bietet der Durchlauf danach einen Knopf «Weiter zur Reise». Er springt
      über die vorhandene Debug- bzw. Testschnittstelle (`__prismaDebug`, `zeige()`, Übersicht) an das Ende der
      ersten Welt, sodass die Reise in die zweite Welt mit frisch geladener Skybox gemessen wird. Am Ende wird der echte
      Spielstand wiederhergestellt.
- [ ] **Ergebniskarte** am Ende, gut lesbar auf dem Handy. Sie zeigt pro Abschnitt p95, den schlimmsten Frame, die
      Zahl der Frames über 33 ms und die p95 der Zeichenzeit samt Mass. Dazu Gerät bzw. User-Agent, GPU, Bildschirm,
      Pixelverhältnis, Bildschirmtakt und die **Version** der laufenden Fassung. Ein Knopf «Kopieren» legt alles als
      Text in die Zwischenablage. Fallback ohne Clipboard-API: markierbares Textfeld.
- [ ] **Version sichtbar:** Es gibt keinen Build-Schritt. `sw.js` (Cache `prisma-v1`) lädt online zuerst vom Netz und
      antwortet nur aus dem Speicher, wenn das Netz länger als `NETWORK_WAIT` = 3 s braucht. Eine alte Fassung droht
      also vor allem, wenn Render kalt startet. Einführen: eine Versionskennung, die bei jedem Handy-Commit nachgeführt
      wird (z. B. `APP_VERSION` mit Datum und Ticketstand) und in HUD und Ergebniskarte erscheint. Ein Neuladen holt
      sicher die neue Fassung. Den Ablauf im README im Wurzelordner festhalten («Version prüfen, sonst neu laden»).
- [ ] **Testschnittstelle:** Die Ergebnisse sind auch per `window.__prisma` abrufbar. So können Headless-Tests
      (`tools/chrome.mjs`, `tests/*.mjs`) den Durchlauf als Regressionsprüfung fahren (Klicks per Script, `--handy`).
      Ihre Zeiten sind keine echten Messwerte, ohne GPU rendern sie in Software. Im README im Wurzelordner ist
      beschrieben, wie man den Durchlauf startet.
- [ ] **Ausgangswerte** im echten Chrome mit Fenster und GPU auf dem Arbeitsrechner erheben, einmal ungedrosselt und
      einmal mit DevTools-Handy-Emulation und 4× CPU-Drosselung, und unter `## Comments` eintragen. Fährt der Agent den
      Durchlauf selbst, dann über `tools/chrome.mjs` mit `GPU=1` und sichtbarem Fenster, falls das geht. Sonst ist das
      ein Schritt für den Nutzer am Arbeitsrechner, und das Ticket sagt das.
- [ ] Tests grün, Review des Diffs. Dann committen und auf `feature/leistung` pushen, Ticket mit **«bereit für
      Handy-Durchlauf 1 (Ausgangswert), bitte auf Render deployen»** abschliessen. Der Nutzer trägt die Ergebniskarte
      vom Poco nach.

## Comments
