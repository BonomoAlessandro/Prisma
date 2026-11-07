# 13: Epilog, Noa leuchtet im gleichen Winkel wie im Prolog (Abnahme, Runde 3, 07.11.)

**Spec:** ../spec.md

**Blocked by:** 12

**Status:** ready-for-agent

**What to build:** Rückmeldung des Nutzers zum Stand 524432d auf dem Poco. Allgemein: «ich finde alles super, nur
etwas kleines ist mir aufgefallen.»

- [x] **Epilog, gleicher Winkel wie im Prolog:** «Im Prolog leuchtet noa nicht mehr so steil in den himmel, was gut
      ist, aber im epilog ist das noch nicht so. Im epilog sollte der gleiche winkel verwendet werden.» In Epilog 3
      (Noa leuchtet zum Polarstern) soll ihr Arm bzw. Strahl im selben Winkel stehen wie in Prolog 4, in allen Formaten
      (gemessen nach Ticket 11: Prolog 4 Desktop 44,5°, hoch 74,9°, quer 38,7°, 360 × 640 73,3°; Epilog 3 Desktop
      37,6°, hoch 93,1°, quer 29,2°). Der Strahl soll dabei weiter auf den Polarstern zeigen; dafür die Einstellung
      der Bühne in Epilog 3 (Lage von Noa, Kamera bzw. Wagen) so wählen, dass beides stimmt. Wagen in Wagen (Ende
      Finale → erstes Bild Epilog) darf sich nicht verschlechtern.
- [x] Probe/`buehne-messung` nachführen: Winkel in Prolog 4 und Epilog 3 je Format gleich (Toleranz festlegen und
      begründen), Strahl trifft den Polarstern.
- [x] Alle betroffenen Tests grün; Review nach dem Ticket.

## Comments

**07.11.2026, Notiz des Umsetzers** (Hauptarbeitskopie auf 524432d; nicht committet)

Gebaut (`index.html`, `tests/buehne-messung.mjs`, `tests/geschichte-probe.mjs`):

1. **Entscheid: Die Kamera von Epilog 3 wird gerechnet, nicht Noa und nicht der Wagen verschoben.** Noa steht in
   Prolog und Epilog am selben Ort (440, 592), der Wagen liegt, wo ihn das Finale am Ende zeigt (Wagen in Wagen), und
   beides soll so bleiben. Der Winkel hängt dann nur daran, wo Noa im Bild steht: Der ferne Himmel (p = 0,06) zieht
   beim Schwenken kaum mit, Noa (p = 1) voll. Darum fährt die Kamera in Epilog 3 nur **waagrecht** (Höhe und Zoom wie
   bisher), genau so weit, dass der Polarstern im Winkel von Prolog 4 über Noa steht (`winkelWie: 'reach'` an der
   Einstellung, `scene.winkelKamera`; der Abstand im Bild hängt linear an `c.x`, also geschlossen gelöst). Feste Werte
   in `cam`/`camP` hätten nur für ein Seitenverhältnis gestimmt (das Poco hat mit und ohne Adressleiste verschiedene
   Höhen); gerechnet stimmt es in jedem Format. Weil der Platz des Wagens (`wagenFeld`) auch von dieser Kamera abhängt,
   rechnet sie in wenigen Schritten (konvergiert sofort, p = 0,06), je Bildschirm einmal (Schlüssel Breite × Höhe ×
   Seitenverhältnis der Kamera), und das Ende des Finales nimmt dieselbe Kamera. `scene.winkel(c)` rechnet den Winkel
   (vorher in `erhoben`), `scene.orteAus` die Orte des Wagens (vorher in `wagenLegen`).
   Folge im Bild: hoch und auf kleinen Handys steht Noa in Epilog 3 weiter links (Lampe bei 9–10 % der Breite statt
   38 %, ganz zu sehen), auf dem Desktop und quer weiter rechts (31 % statt 23 %, quer 38 % statt 26 %), links kommen
   dort die Tannen des Vordergrunds ins Bild. Prolog 4 verschiebt sich um höchstens 0,2° (der Wagen liegt 1–2 px
   anders, weil sich sein Platz mit der Kamera von Epilog 3 leicht ändert).

   | Grad über der Waagrechten | Prolog 4 vorher → jetzt | Epilog 3 vorher → jetzt |
   |---|---|---|
   | Desktop 1440 × 900 | 44,5 → 44,6 | 37,6 → **44,6** |
   | hoch 390 × 844 | 74,9 → 74,8 | 93,1 → **74,8** |
   | Poco 393 × 873, dpr 2,75 | 75,1 → 75,0 | 93,1 → **75,0** |
   | quer 844 × 390 | 38,7 → 38,9 | 29,2 → **38,9** |
   | quer Poco 873 × 393, dpr 2,75 | 38,2 → 38,4 | 28,5 → **38,4** |
   | 360 × 640 | 73,3 → 73,1 | 92,9 → **73,1** |
   | 320 × 568 | 73,2 → 73,1 | 92,9 → **73,1** |

   Unterschied jetzt überall 0,00°; der Arm zeigt in beiden Einstellungen 0,0 px am Polarstern vorbei.
2. **Messung** (`buehne-messung.mjs bilder`): neue Ansicht `handy-320x568` (im Standardsatz), in Prolog 4 und Epilog 3
   der Winkel (unabhängig vom Spiel gerechnet wie `pruefeArm`), Arm gegen Richtung zum Polarstern, Polarstern im Bild,
   in Epilog 3 auch die Lampe im Bild; Werte nach `<ordner>/winkel.json`, Tabelle am Ende, sonst scheitert der Lauf
   (`pruefeWinkel`). Neues Bild `<ansicht>-epilog-3-strahl.png` beim dritten Blinken (der Strahl am hellsten).
   **Toleranz 0,5°** (`WINKEL_TOLERANZ`): wie für den Arm zum Polarstern; am Strahl unsichtbar (auf 300 px 2,6 px
   seitlich, weniger als der Hof des Polarsterns), die Rechnung trifft exakt (Rundung), jede echte Abweichung (vorher
   7–20°) fällt auf. In Prolog 4 liegt die Lampe hoch und quer knapp ausserhalb des Bilds (so seit Ticket 11, die Kamera
   schaut hinauf); das prüft die Messung darum nur in Epilog 3.
3. **Probe** (`pruefeArm`): In Epilog 3 (läuft mit `--finale`) zusätzlich gleicher Winkel wie Prolog 4 (Kamera von
   Prolog 4 gegen den Wagen, wie er liegt), Toleranz 0,5°.

Läufe (alle über `LEISE_VORRANG=13 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

| Lauf | Ergebnis |
|---|---|
| `buehne-messung bilder u13-vorher --seite <Stand 524432d>` (7 Ansichten) | rot wie erwartet: Unterschied 6,9–19,7° |
| `buehne-messung bilder u13` (desktop, handy, quer, 360 × 640, 320 × 568, handy-275, quer-275) | grün, Unterschied überall 0,00° |
| `buehne-messung bilder u13s --nur desktop,handy-275` (mit Bild des Strahls) | grün; Strahl läuft sichtbar in den Polarstern |
| Node `geschichte.test.mjs` | 35 bestanden |
| `--wagen` Desktop / `--handy --dpr 2.75` / `--quer --dpr 2.75` | bestanden; Wagen in Wagen 1,5 / 1,1 / 0,6 px (vorher 1,5 / 1,1 / 0,5; Grenze 4) |
| `--finale leicht` Desktop / `--handy --dpr 2.75` / `--quer --dpr 2.75` | bestanden; Epilog 3 44,6° / 74,8° / 38,9°, je gleich Prolog 4; keine Lücke über 100 ms |

Bilder: `tests/output/buehne/u13/<ansicht>-prolog-4.png` und `-epilog-3.png` (vorher `u13-vorher/`),
`tests/output/buehne/u13s/desktop-epilog-3-strahl.png`, `handy-275-epilog-3-strahl.png`;
`tests/output/geschichte/<desktop|handy-dpr275|quer-dpr275>-wagen-finale-endbild.png` / `-wagen-epilog-anfang.png`.
Angesehen: Prolog 4 und Epilog 3 je Format nebeneinander, gleiche Neigung; Ende Finale und Anfang Epilog decken sich.

Offen / zur Abnahme:

- Hoch steht Noa in Epilog 3 nahe am linken Rand (Lampe bei 8–10 % der Breite), ganz zu sehen; quer überdeckt der
  Untertitel wie vorher ihre Beine.
- Desktop und quer: Durch den Schwenk nach links stehen links grosse Tannen des Vordergrunds im Bild.
- Nicht gelaufen (Reviewer): Probe ohne Argumente (Prolog 4 in allen Graden), `--ganz`, `--menue`, `--dorf`,
  `offline`, übrige Node-Tests, `messen`.

**07.11.2026, Notiz des Reviews** (unabhängiger Reviewer; Umfang wie beim Review von Ticket 11 auf Wunsch des
Nutzers: Code und die Läufe dieses Tickets. **Der ganze Testsatz folgt im abschliessenden Review zusammen mit Ticket
10.**)

Urteil: **angenommen.** Der Wunsch des Nutzers ist erfüllt: In Epilog 3 leuchtet Noa in allen sieben gemessenen
Formaten im selben Winkel wie in Prolog 4 (Unterschied 0,00°), der Strahl läuft sichtbar in den Polarstern, Wagen in
Wagen nicht schlechter (1,4 / 1,0 / 0,5 px, Grenze 4).

Code (`index.html`: `scene.winkel`, `orteAus`, `winkelKamera`, `ziel`):

- Rechnung stimmt: Der waagrechte Abstand im Bild hängt linear an `c.x` (Faktor `s1 − p·s0`, bei p = 0,06 nie null),
  die Auflösung nach x ist richtig, auch über 90° (hoch: `atan2` und `dy / tan` passen im zweiten Quadranten).
  `scene.winkel` rechnet genau wie früher `erhoben` mit `wagenImBild` (nachgerechnet).
- Konvergenz: Die Rückkopplung über `wagenFeld` ist schwach (Himmel p = 0,06), die Schleife bricht unter 0,01 px ab,
  höchstens 6 Schritte. Die Rekursion `winkelKamera → wagenLage → wagenEnde → wagenFeld → ziel` endet, weil der Cache
  vor der Schleife gesetzt wird und dann den laufenden Schritt gibt. Gemessen trifft es exakt.
- Kosten: `ziel` läuft nicht je Bild (die Kamera kommt aus `folgeZeit`), `winkelKamera` rechnet je Bildschirm einmal
  (Schlüssel Breite × Höhe × Seitenverhältnis); bei Adressleiste ein/aus auf dem Poco also einmal neu (bis 6 ×
  `wagenEnde`, ein paar Projektionen). Keine neue Lücke: die 52–54 ms bei «veil» am Ende des Finales gab es schon in
  Ticket 11 und 12 (Desktop 54 ms).
- Drehung/Grösse in Epilog 3: `anpassen` legt die Folge neu an, die Kamera springt wie in jeder Einstellung; der Arm
  behält den Winkel vom Beginn der Einstellung (in Prolog 4 schon vorher so). Weil der Sollwinkel der von Prolog 4 im
  neuen Format ist und sich mit der Höhe kaum ändert (hoch 74,8–75,0°), bleibt das unsichtbar.
- Prolog 4 verschiebt sich höchstens 0,2° (Platz des Wagens hängt über `wagenFeld` an der neuen Kamera); das Ende
  des Finales nimmt dieselbe Kamera (Wagen in Wagen grün).

Tests: `pruefeWinkel` (buehne-messung) vergleicht Prolog und Epilog aus **zwei getrennt geladenen Seiten** und rechnet
den Ort von Noa im Bild selbst (nicht über `scene.winkel`/`winkelKamera`); den Polarstern nimmt es aus `starAt`, das
dieselben `wagenOrte` nutzt, die glBuehne zeichnet. Unabhängig genug; die Bilder `*-epilog-3-strahl.png` belegen den
Treffer zusätzlich im Bild. **Behoben im Review:** `armMessen` nahm die Kamera aus `scene.ziel`, also aus der Rechnung,
die geprüft wird; jetzt die Kamera, die die Bühne dort wirklich zeigt (`folgeZeit.kameras`), so fiele auch ein
veralteter Cache auf. `pruefeArm` der Probe vergleicht in der Epilog-Seite mit einer gedachten Kamera von Prolog 4
(eigene Rechnung des Winkels); das reicht als zweiter Blick.

Läufe (alle über `LEISE_VORRANG=13 GPU=1 LEISE_CPU=100 LEISE_MAX_CPU=100 sh tools/leise.sh`, Chrome stumm):

| Lauf | Ergebnis |
|---|---|
| Node `geschichte.test.mjs` | 35 bestanden |
| `buehne-messung bilder r13` (desktop, handy, quer, 360 × 640, 320 × 568, handy-275, quer-275), mit der Korrektur | grün; Prolog 4 = Epilog 3: 44,6 / 74,8 / 38,9 / 73,1 / 73,1 / 75,0 / 38,4°; Arm 0,0 px am Polarstern vorbei |
| `buehne-messung messen --epilog` Desktop / `--handy` | keine Lücke über 50 ms (längste 23 / 36 ms) |
| `--finale leicht` Desktop / `--handy --dpr 2.75` | bestanden; Epilog 3 44,6° / 74,8°, je gleich Prolog 4 |
| `--finale leicht --quer --dpr 2.75` | 1. Lauf rot: 288 ms im Einstieg (Fortsetzen), 54 ms nach dem Ende eines Bilds der Probe (Artefakt; den Einstieg berührt 13 nicht); 2. Lauf bestanden, 38,9° |
| `--wagen` Desktop / `--handy --dpr 2.75` / `--quer --dpr 2.75` | bestanden; Wagen in Wagen 1,4 / 1,0 / 0,5 px |
| Probe ohne Argumente Desktop / `--handy --dpr 2.75` | bestanden; Prolog 4 44,6° / 74,8° |

Angesehen (Prolog 4 neben Epilog 3 je Format, `tests/output/buehne/r13/`): gleiche Neigung, der Strahl trifft. Zur
Abnahme (Gestaltung, kein Fehler):

- Hoch steht Noa in Epilog 3 nahe am linken Rand (Lampe bei 8–10 % der Breite), ganz zu sehen; der Strahl geht schräg
  durchs Bild zum Polarstern, vom Dorf sind nur noch die Häuser rechts zu sehen, die Kirche nicht mehr. In Prolog 4
  hoch ist Noa sogar knapp abgeschnitten (Lampe bei −1 %), in Epilog 3 steht sie also besser.
- Desktop: links zwei, drei grosse Tannen des Vordergrunds; sie rahmen das Bild eher, als dass sie stören (Noa frei).
  Quer (873 × 393) sind sie deutlich dominanter: eine grosse schwarze Tanne nimmt das linke Fünftel ein, bis nahe an
  Noa; der Untertitel überdeckt wie vorher Noas Beine. Falls das stört: in Epilog 3 quer etwas näher zoomen (`cam.z`)
  oder die Tannen dort zurücknehmen – ein eigener Wunsch, nicht Teil dieses Tickets.
