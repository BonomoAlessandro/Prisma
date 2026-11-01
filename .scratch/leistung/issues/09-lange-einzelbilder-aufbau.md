# 09: Keine langen Einzelbilder beim Aufbau des Himmels und bei der Ankunft im Level

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Auf der Reise in eine neue Welt, beim Einstieg und bei der Ankunft im Level hält kein Stück Arbeit
auf dem Hauptthread ein Bild über 33 ms an (Poco). Heute sind es einzelne Bilder von 50–100 ms. Optisch ändert sich
nichts: dieselben Ebenen, dieselben Fische, dasselbe Level, nur anders auf Bilder verteilt.

**Messwerte (07):**

- Poco, Handy-Durchlauf 2: Reise max 98,8 ms («FrameRequestCallback: Script 104 ms» bei 80,0 s, also ein Häppchen
  von `sliced`, das über `nextFrame` läuft) und 65,8 ms («FrameRequestCallback → frame: Script 60 ms»); Einstieg
  65,8 ms («→ frame: Script 72 ms» und 59 ms); Spiel und Spiel n. Reise je ein Bild 49,5 ms.
- T2000, Handy-Emulation 4× (Referenzdurchlauf): Reise max 333,6 ms (Script 314 ms), 200 ms (ohne Script, Grafikprozess);
  6×: Reise 340,7 ms, Einstieg 250,2 ms. Ungedrosselt Desktop: Feier im Wald 83 ms (Script 90 ms: Vorladen des Meers),
  Menü nach dem Laden in Meer/Wüste 50–67 ms (Script 53–76 ms).
- CPU-Profil der Reise Wald → Meer (Handy-Emulation 4×, `Profiler`; Poco etwa 3,4-mal schneller, abgeleitet aus der
  CPU-Zeit von `frame()`: Poco p95 9,4 ms, 4× 31,9 ms), längste zusammenhängende Stücke:

| Stück (4×) | Wo | Poco geschätzt |
|---|---|---|
| 312 ms | `build` → `compileParallel` → `issue` → `renderer.compile(scene)`: three erzeugt den Code aller Programme der ganzen Szene synchron (228 ms), dazu `skyUpload` → `initTexture` (48 ms) | ~90 ms |
| 172 ms | `frame` → `animate` → Fische `advance`: Einschwimmen über `WARM` = 5 s, 150 Schritte in einem Bild (`createFishSim`, `index.html` um 11671) | ~50 ms |
| 135 ms | `frame` → `story.update` → `enterLevel` → `loadLevel` (Elemente bauen, `makeSource`, `makeInteractive`) | ~40 ms |
| 133 ms | `sliced` → `fishField` (`dist` 49 ms, `relax` 21 ms) und `bakedMesh` → `bytes` (Base64, 57 ms) | ~40 ms |
| 90 ms | `sliced` → `paintedInstances` → `unpackModel` → `bytes` | ~25 ms |
| 86 ms | `sliced` → `waterSurface` → `waterGeometry` (58 ms in einem Schritt) | ~25 ms |

  Die Häppchen von `sliced` (6 ms) greifen nicht, wo ein einzelner Schritt nicht unterteilt ist. Die Reise gilt als
  ruhige Stelle (`ruhe.jetzt`: das Spiel selbst), der Aufbau läuft also mitten in der Fahrt, wenn «Weiter» früh
  getippt wird (Vorladen ab «Gelöst», `preloadNext`).
- Desktop und Handy-Emulation ungedrosselt: alle Bereiche flüssig (p95 ≤ 17,2 ms, Tabelle in 07); die langen Bilder
  treten dort nur vereinzelt auf. Ursache ist also CPU auf dem Hauptthread, nicht GPU.

**Vorschlag (ohne sichtbare Änderung):**

- [ ] `compileParallel` beim Aufbau einer Skybox: nur die neuen Teile anstossen (Szene mit allen übrigen Kindern in
      `skip`, die Lichter der Szene bleiben), und je Wurzel bzw. je etwa 10 Materialien ein Häppchen (yield). Prüfen,
      ob die Programme danach im Cache sind (kein Übersetzen im ersten Bild, `skyWarmDraw` misst das).
- [ ] Fische: Das Einschwimmen (5 s, 150 Schritte) in Häppchen von `sliced` während des Aufbaus vorrechnen, nicht im
      ersten Bild. Nach einer Pause (Himmel ausgeblendet, `t` springt) nicht neu einschwimmen, sondern vom letzten
      Stand weiterrechnen bzw. in Häppchen nachholen; die Plätze sind ohnehin zufällig, das fällt nicht auf.
- [ ] `fishField`, `bakedMesh`/`unpackModel` (Base64 dekodieren), `waterGeometry`: in kleinere Schritte teilen (yield
      in den Schleifen) oder in den Worker, der schon die Bilder dekodiert. Ziel: kein Schritt über 6 ms auf dem
      Desktop bzw. 15 ms bei 4×.
- [ ] `loadLevel` beim Abstieg ins Level: die Elemente über mehrere Bilder bauen (sie wachsen ohnehin nacheinander ein)
      oder schon während der Fahrt vorbereiten, solange der Blick im Himmel ist; das erste sichtbare Bild bleibt gleich.
- [ ] Erneut profilieren (Reise Wald → Meer und Meer → Wüste, Einstieg nach dem Prolog), Handy-Emulation 4×: kein
      zusammenhängendes Script-Stück über 60 ms (entspricht ~18 ms auf dem Poco), ungedrosselt keins über 20 ms.
- [ ] Referenzdurchlauf Desktop und Handy 4× vorher/nachher; Bilder der Reise und des Strands nebeneinander (gleich).
- [ ] Tests grün (`geschichte-probe` mit Reisen, `leistung-probe`, `golden`, Screenshots), Review, Commit.

**Abnahmekriterium:** Handy-Emulation 4×: Reise und Einstieg ohne Hänger über 100 ms und ohne Script-Stück über
60 ms; ungedrosselt in allen Reisen (Messprobe der Bereiche aus 07) kein Bild über 33 ms. Auf dem Poco
(Schlussabnahme): Reise und Einstieg max ≤ 33 ms bzw. höchstens ein ausgelassenes Bild. Fische, Wasser, Bäume und
Level sehen gleich aus.

**Nicht hier:** Das Bild von 98,8 ms im Prolog (bei 21,4 s, «ohne Script») ist Grafikprozess (Hochladen in der Pause
oder Rastern der Bühne); es gehört zur parallelen Klärung der Beobachtungen vom Poco (Glühwürmchen beim Einflug,
Flackern in der ersten Noa-Szene).

## Comments
