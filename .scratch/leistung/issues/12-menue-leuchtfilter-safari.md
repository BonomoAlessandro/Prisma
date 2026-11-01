# 12: Leuchtfilter im Menü auf die Umgebung der Linien begrenzen (Safari)

**Spec:** ../spec.md

**Blocked by:** 07

**Status:** ready-for-agent

**What to build:** Der Leuchtfilter des Menüs (`feGaussianBlur` 2,4, `index.html` um 16719) rechnet nur noch dort, wo
Licht ist, nicht über die ganze Fläche des Menüs. Das Bild bleibt pixelgleich. Gedacht für Safari (iOS rechnet
SVG-Filter auf der CPU), wird aber in Chrome abgenommen.

**Befund (07):** Der Filter hat `filterUnits="userSpaceOnUse"` mit `x=0 y=0 width=W height=H`, also die ganze Fläche des
Menü-SVG, und hängt an jeder leuchtenden Linie (`menue-licht`, je Grad eine) und am Zeichen der aktuellen Welt. Je
gefiltertem Element entsteht so eine Fläche in Bildschirmgrösse, die in den 3,2 s des Wachsens (`stroke-dashoffset`)
in jedem Bild neu weichgezeichnet wird. In Chrome auf dem Poco unauffällig (Menü p95 16,6 ms, max 49,5 ms; der
Handy-Durchlauf zeigt keinen Hänger beim Öffnen), in Safari bekannt teuer. Grund für die ganze Fläche ist vermutlich,
dass `objectBoundingBox` bei waagrechten oder senkrechten Linien (Höhe bzw. Breite 0) gar nichts zeichnet.

**Vorschlag:**

- [ ] Je gefiltertem Element einen eigenen Filter mit `userSpaceOnUse` und dem Hüllrechteck seiner Punkte plus Rand
      (3 × stdDeviation + halbe Strichbreite, also etwa 9 px) statt der ganzen Fläche; oder ein gemeinsamer Filter je
      Grad, wenn das einfacher ist.
- [ ] Pixelvergleich: Menü Desktop und Handy (frisch, mit Stand, geschafft), nach dem Wachsen und mitten drin: gleich
      (höchstens Rundung an den Rändern, keine abgeschnittenen Säume).
- [ ] Messen (Chrome): Menü öffnen und Wachsen, Desktop und Handy 4×, max und Bilder über 33 ms vorher/nachher; darf
      nicht schlechter werden.
- [ ] Tests grün (`geschichte-probe --menue`, Screenshots), Review, Commit.

**Abnahmekriterium:** Menü pixelgleich (Vergleich wie oben), Chrome nicht langsamer; die gefilterte Fläche je Element
höchstens Hüllrechteck plus Rand.

**Gewinn und Risiko:** Gewinn nur in Safari zu erwarten (nicht geprüft, Spec), klein in Chrome; Risiko klein
(abgeschnittener Saum, sichtbar im Pixelvergleich). Niedriger Rang; kann entfallen, wenn die Zeit knapp ist.

## Comments
