# Vorbilder: Führung im Dorf

Ticket 01 der Spec «Führung im Dorf». Gesucht in Puzzlespielen und in Leitfäden zum Einstieg, wie sie Bedienung und
Regeln beibringen. Je Vorbild ein Link und ein Satz, welches Muster es dem Katalog gibt. Übernommen werden nur Muster,
kein Aussehen und keine Figuren. Die Buchstaben in Klammern nennen die Richtung im Katalog (`../katalog/`):

- A Leise Zeichen
- B Scheinwerfer
- C Vorzeigen
- D Schild am Element

## Spiele

- [Monument Valley](https://en.wikipedia.org/wiki/Monument_Valley_(video_game)): Text gibt es nur im ersten Level, sonst
  zeigt ein sanftes Pulsieren, was sich bewegen lässt, und der Spieler findet den Rest durch Antippen (A).
- [Baba Is You](https://en.wikipedia.org/wiki/Baba_Is_You): Die Level selbst sind die Lehre, jedes führt genau einen
  Gedanken ein, auf den das nächste baut, das Muster für «ein Gedanke je Übung» (alle).
- [The Witness](https://en.wikipedia.org/wiki/The_Witness_(2016_video_game)): Ohne ein Wort lernt man an kurzen Reihen
  von Tafeln, jede verschiebt das Verständnis ein wenig, Gelingen ist die einzige Rückmeldung (A, kein Tadel).
- [Threes!](https://en.wikipedia.org/wiki/Threes): Der Einstieg zeigt je Schritt einen kurzen Satz und lässt nur den
  einen Zug zu, der gerade gelernt wird, danach ist alles frei (B).
- [Candy Crush Saga](https://en.wikipedia.org/wiki/Candy_Crush_Saga): Die ersten Level dunkeln das Brett ab, lassen nur
  die beiden gemeinten Steine frei und eine Hand zeigt den Wisch vor, das Vorbild für den Scheinwerfer (B).
- [Cut the Rope](https://en.wikipedia.org/wiki/Cut_the_Rope): Gesten werden als Zeichnung auf dem Spielfeld vorgemacht,
  genau dort, wo man sie ausführen soll, und verschwinden nach dem ersten Erfolg (C).
- [Lara Croft Go](https://en.wikipedia.org/wiki/Lara_Croft_Go): Eine angedeutete Wischgeste auf dem Feld ersetzt jeden
  Text; ohne Eingabe erscheint sie nach einer Weile wieder (C, später Fingerzeig).
- [The Room: Old Sins](https://www.pocketgamer.com/articles/076612/r/): Hilfe ist zeitgesperrt, sie erscheint erst nach
  einer Weile Grübeln und beginnt mit einem kleinen Stups, das Muster für den späten Fingerzeig (alle).
- [Professor Layton](https://en.wikipedia.org/wiki/Professor_Layton): Hinweise kommen gestuft und nur auf Wunsch, nie
  wird ein Rätsel für den Spieler gelöst («Gelöst wird nie automatisch»).
- [Hitman Go](https://en.wikipedia.org/wiki/Hitman_Go): Die Regel steht als kurzes Schild an der Stelle des Bretts, an
  der sie gilt, nicht in einer Leiste am Rand (D).
- [Super Mario Bros.](https://en.wikipedia.org/wiki/World_1-1): Welt 1-1 lehrt, indem der erste Fehler harmlos ist und
  die Antwort der Welt (Wackeln, Abprallen) die Regel zeigt, das Vorbild fürs Wackeln des festen Spiegels (alle).
- [Portal](https://en.wikipedia.org/wiki/Portal_(video_game)): Ein neues Element erscheint zuerst allein und gefahrlos,
  erst danach zusammen mit anderen, so wie der feste Spiegel in «Umweg» zuerst für sich angetippt wird (alle).

## Leitfäden und Erfahrungen

- [Puzzledorf, Tutorial design reflections](https://www.gamedeveloper.com/blogs/tutorial-design-in-puzzledorf-reflections):
  Kaum ein junger Spieler las die Anleitung; zeigen statt erklären, erste Rätsel fast nicht verfehlbar, Bewegliches
  blinkt kurz auf (A, C).
- [Roblox, Onboarding techniques](https://create.roblox.com/docs/production/game-design/onboarding-techniques): Nennt
  Hinweise im Zusammenhang (sie kommen, wenn die Handlung fällig ist) und zeitgesteuerte Hinweise für Steckengebliebene,
  unsere beiden Auslöser «Handlung» und «15 Sekunden» (alle).
- [Material Design, Feature discovery](https://m1.material.io/growth-communications/feature-discovery.html): Ein runder
  Fleck um das gemeinte Bedienelement mit einem kurzen Satz daneben, die Form des Scheinwerfers und der Blase (B).
- [Wayline, The tyranny of forced tutorials](https://www.wayline.io/blog/tyranny-of-forced-tutorials): Erzwungene
  Abläufe nehmen dem Spieler das eigene Entdecken, die Gegenstimme zur strengen Führung (A, C, D).
- [Giant Bomb, Crappy tutorials in games](https://giantbomb.com/profile/warcat777/lists/crappy-tutorials-in-games/371188/):
  Wer nur Blinkendes antippt, lernt nichts, die Schwäche des Scheinwerfers (B, Nachteil).
- [Yu und Liu, Implicit guidance in game design](https://openaccess.cms-conferences.org/publications/book/978-1-7923-8988-7/article/978-1-7923-8988-7_119):
  Spieler mögen leise Führung lieber, ausdrückliche hilft bei verwickelten Regeln, für Geübte ändert beides wenig (A
  gegen B).
- [TV Tropes, Hint System](https://tvtropes.org/pmwiki/pmwiki.php/Main/HintSystem): Hinweise nach Zeit oder nach
  Fehlversuchen; wir nehmen die Zeit, weil Fehlversuche ohne Meldung bleiben (alle).

## Was übernommen wird

- **Die Welt antwortet:** Das feste Element wackelt, statt still zu bleiben (Mario, Puzzledorf).
- **Ein Gedanke je Schritt:** höchstens drei Schritte, je ein kurzer Satz (Baba Is You, Threes!).
- **Später Stups statt Lösung:** nach etwa 15 Sekunden das nächste Element zeigen, nie selbst lösen (The Room, Layton).
- **Zeigen am Ort:** Hervorhebung und Geste dort, wo gehandelt wird (Cut the Rope, Hitman Go).
- **Offen bleibt die Strenge:** frei wie Monument Valley oder geführt wie Candy Crush; das entscheidet der Katalog.
