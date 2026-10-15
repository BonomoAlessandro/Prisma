# Spiel, Löser und Tests nutzen eine einzige Strahlregel

Die Strahlregel steht in `index.html`; Löser, Generator, Bewertung und Tests benutzen sie mit (seit `a21ec1a`). Wird
sie für die Werkzeuge zu langsam, beschleunigen wir sie dort, ohne ihr Verhalten zu ändern, statt eine schnellere Kopie
für die Werkzeuge zu bauen. Das gilt auch für Würfel-Level: Der Würfel bekommt keinen eigenen Pfad, ein flaches Level
ist ein Würfel mit einer Ebene. Der Branch `feature/3d-wuerfel` wird so umgebaut, bevor er nach main kommt; der
Golden-Test belegt, dass die flachen Level gleich bleiben, und der flache Fall darf dadurch nicht langsamer werden.
„Gleich“ heisst dabei: dasselbe Verhalten (Treffer, Mischungen, Ereignisse, Zellen, Richtungen, Löser); Kommazahlen
wie Normalen und Endpunkte dürfen um höchstens 1e-9 abweichen, sonst blockierten Rundungsreste jeden Umbau.
Zwei Fassungen derselben Regel könnten unbemerkt auseinanderlaufen, und dann wäre ein Level laut Werkzeug lösbar, im
Spiel aber nicht, oder ein Element wirkte im Würfel anders als im flachen Level.
