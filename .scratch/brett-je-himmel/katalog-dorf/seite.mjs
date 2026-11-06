// Baut die Vorschauseite «Dorfbretter» (8 völlig neue Richtungen für Noas Dorf bei Nacht): node seite.mjs → index.html
// Bilder liegen in bilder/ (aus dem Spiel, Stand main 504adbb, ?sky=village, Brett zur Laufzeit eingesetzt).
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const W = (s) => s; // Lesbarkeit der Vorlagen

/** Hinweise: Kürzel → [Etikett, Erklärung] */
const HINWEIS = {
  blender: ['Form aus Blender', 'Die Richtung braucht eine Form aus Blender oder wird damit deutlich schöner.'],
  ausblick: ['Ausblick, teurer', 'Geht über den Umriss von 9,8 × 9,8 m hinaus oder verbindet das Brett mit dem Grund. Nicht Teil der Spec.'],
  kern: ['Kernquader kleiner', 'Deckt den Quader des Bretts nicht ganz undurchsichtig. Der Himmel muss dahinter zeichnen (Kernquader, Ticket 01).'],
  pinsel: ['Pinsel aufs Brett', 'Der Pinselfilter der Pflanzen malt das Brett mit. Heute spart ihn ein Quader ums Brett aus.'],
  teile: ['Viele kleine Teile', 'Bewuchs oder Halme aus vielen kleinen Körpern. Auf dem Handy zu messen.'],
  mehr: ['Echt wäre teurer', 'Das Bild täuscht einen Stoff vor, der echt gerechnet mehr kosten würde.'],
};

const BILDER = [
  ['schraeg', 'Im Spiel'],
  ['oben', 'Aufsicht'],
  ['flach', 'Flacher Blick: Seiten und Kante'],
  ['welle', 'Lichtwelle beim Lösen'],
];

const heute = {
  id: 'heute', datei: 'stein', name: 'Steinbrett im Dorf', art: 'Heute', vergleich: true,
  idee: 'Das heutige Brett unter Noas Nachthimmel: dunkler Schiefer mit eingravierten Rasterlinien, heller Einlegelinie, polierten Seiten und Metallkante.',
  raster: 'Eingraviert, fein.', einlage: 'Helle, matte Linie knapp ausserhalb des Felds.', spiegelung: 'Ja, poliert.',
  welle: 'Ein heller Ring in der Mischfarbe der Ziele läuft von der Mitte bis über die Ecken.',
  hinweise: [], vorbilder: [],
};
const WP = (t) => `https://de.wikipedia.org/wiki/${t}`;
const EN = (t) => `https://en.wikipedia.org/wiki/${t}`;

const karten = [
  {
    id: 'laube', datei: 'laube', name: 'Laube', art: 'Gebaut: Holzboden am Chalet',
    idee: 'Das Brett ist der Holzboden der Laube an einem Chalet wie Noas Haus. Breite Lärchendielen, je drei auf ein Feld, enden an den Feldgrenzen und sind dort genagelt. Im Rand liegt ein Rahmen aus Brettern auf Gehrung. Darunter hängt die Brüstung aus ausgesägten Brettern mit Herzen und Tulpen, aussen stehen Kisten mit roten Geranien wie unter Noas Fenstern.',
    raster: 'Die breiteren Fugen, wo die Dielen enden und wo jede dritte Diele anstösst.',
    einlage: 'Entfällt, eine hellere Abschlussleiste rahmt das Feld.',
    spiegelung: 'Keine, das Holz ist roh.',
    welle: 'Warmes Lampenlicht der Stube scheint von unten durch die Fugen, das ganze Raster leuchtet auf.',
    kosten: 'Alles berechnet. Die Brüstung ist eine Textur mit ausgesägten Löchern, Balkenköpfe und Kisten sind einfache Körper.',
    hinweise: [['kern', 'Der Boden ist nur 6 cm dick, darunter sieht man durch die Brüstung. Der Kernquader wird flach.'], ['teile', 'Rund 1300 Blätter und Blüten in acht Geranienkisten.'], ['blender', 'Die Geranien sind Kugeln. Kleine Blattformen aus Blender wären schöner.']],
    vorbilder: [['Chalet', WP('Chalet')], ['Balkon', WP('Balkon')], ['Europäische Lärche', WP('Europ%C3%A4ische_L%C3%A4rche')], ['Laubsäge', WP('Laubs%C3%A4ge')], ['Pelargonien', WP('Pelargonien')], ['Heidi (Anime)', WP('Heidi_(Anime)')]],
  },
  {
    id: 'quilt', datei: 'quilt', name: 'Flickendecke', art: 'Andere Form: Stoff',
    idee: 'Das Brett ist Noas Quilt, über einen Kasten gelegt. Die 49 Flicken liegen in Rauten-Ringen um die Mitte wie beim Muster «Sunshine and Shadow», in verblichenen Farben und mit leisen Mustern: uni, Streublümchen, Vichy, Streifen. Jeder Flicken ist gesteppt. Eine weinrote Borte rahmt das Feld, die breite Aussenborte trägt ein gestepptes Kordelmuster. Der Stoff fällt in Falten über die Seiten, an den Ecken tiefer.',
    raster: 'Die Nähte, mit hellem Zierstich.',
    einlage: 'Entfällt, die schmale weinrote Borte ersetzt sie.',
    spiegelung: 'Keine, Stoff spiegelt nicht.',
    welle: 'Wie die Taschenlampe unter der Decke: Die Flicken leuchten von unten in ihrer eigenen Farbe durch.',
    kosten: 'Alles berechnet, der Fall des Stoffs ist ein Körper aus Ringen. Das Feld bleibt eben, das Steppen ist nur schattiert.',
    hinweise: [['kern', 'Runde Ecken und ein offener Fall über einem kleineren Kasten: Der Kernquader wird etwas kleiner.']],
    vorbilder: [['Quilt', WP('Quilt')], ['Patchwork', WP('Patchwork')], ['Quilts of Gee’s Bend', EN('Quilts_of_Gee%27s_Bend')], ['Kirby’s Epic Yarn', EN('Kirby%27s_Epic_Yarn')]],
  },
  {
    id: 'platz', datei: 'platz', name: 'Dorfplatz nach dem Regen', art: 'Gebaut: Pflaster',
    idee: 'Das Brett ist ein Stück Dorfplatz, frisch vom Regen. Das Feld sind 49 Granitplatten, eine je Feld. Im Rand liegt Kopfsteinpflaster, aussen ein Randstein, die Seiten sind Bruchsteinmauer. Alles ist nass und spiegelt, in Senken stehen Pfützen. Hinten rechts steht eine Laterne, hinten links ein Brunnentrog mit Wasser.',
    raster: 'Die nassen Fugen zwischen den Platten.',
    einlage: 'Eine Zeile heller Läufersteine.',
    spiegelung: 'Stark, die Steine sind nass, Pfützen spiegeln fast wie Glas.',
    welle: 'Ein Glanz wie Laternenlicht läuft über die nassen Steine und bleibt in Pfützen und Fugen stehen.',
    kosten: 'Alles berechnet, Laterne und Brunnen sind einfache Körper. Die Laterne ist 3,2 m hoch, in der Spielansicht steht ihr Kopf über dem Bildrand.',
    hinweise: [['mehr', 'Die Laterne leuchtet nur selbst. Ihr Schein auf dem Pflaster ist gemalt und noch schwach; ein echtes Licht würde auch die Elemente anders beleuchten.']],
    vorbilder: [['Kopfsteinpflaster', WP('Kopfsteinpflaster')], ['Granit', WP('Granit')], ['Gaslaterne', WP('Gaslaterne')], ['Dorfbrunnen', WP('Dorfbrunnen')], ['Caféterrasse am Abend', WP('Caf%C3%A9terrasse_am_Abend')]],
  },
  {
    id: 'hochbeet', datei: 'hochbeet', name: 'Hochbeet', art: 'Garten: Erde und Kräuter',
    idee: 'Das Brett ist das Hochbeet aus Noas Garten. Im Feld liegt frisch gerechte, dunkle Erde, darüber sind Pflanzschnüre zwischen Holzpflöcken gespannt. Im Rand wachsen Kräuter: Schnittlauch mit lila Blüten, Thymian, Ringelblumen und Salat. Die Seiten sind Lärchenbohlen, oben liegt ein Abdeckbrett.',
    raster: 'Helle Pflanzschnüre mit kleinem Schatten.',
    einlage: 'Eine Reihe heller Kiesel.',
    spiegelung: 'Keine, Erde ist matt.',
    welle: 'Glühwürmchen steigen aus Erde und Kräutern auf, wo der Ring vorbeizieht, und schweben nach.',
    kosten: 'Erde und Schnüre berechnet; Kräuter und Pflöcke sind einfache Körper, die Glühwürmchen 420 Punkte. Das Abdeckbrett liegt 8 cm über der Erde.',
    hinweise: [['teile', 'Rund 1800 Halme, Blätter und Blüten. Auf dem Handy zu messen, eventuell gröber.'], ['blender', 'Kräuter und Blüten wären mit kleinen Formen aus Blender deutlich schöner.']],
    vorbilder: [['Hochbeet', WP('Hochbeet')], ['Bauerngarten', WP('Bauerngarten')], ['Schnittlauch', WP('Schnittlauch')], ['Ringelblumen', WP('Ringelblumen')], ['Leuchtkäfer', WP('Leuchtk%C3%A4fer')], ['Stardew Valley', EN('Stardew_Valley')]],
  },
  {
    id: 'glas', datei: 'glas', name: 'Buntes Glas', art: 'Kunst: Bleiglasfenster',
    idee: 'Das Brett ist ein Bleiglasfenster der Kirche, flach gelegt und von unten erleuchtet, wie das «Stück buntes Glas», mit dem Noa übt. Im Feld liegen 49 Scheiben aus blassem Kathedralglas mit Schlieren und Blasen, eine je Feld. Im Rand läuft eine Borte aus Antikglas in Rubinrot und Kobaltblau mit aufgemalten Ranken, in den Ecken je ein Vierpass. Ein schmaler Eisenrahmen hält das Fenster, das nur 12 cm dick ist.',
    raster: 'Die Bleiruten, mit Lötstellen an den Kreuzungen.',
    einlage: 'Eine doppelte Bleirute mit einem Bernsteinstreifen.',
    spiegelung: 'Ja, das Glas glänzt.',
    welle: 'Wie Sonne, die durch ein Kirchenfenster bricht: Die Gläser flammen in ihrer Farbe auf und glimmen nach.',
    kosten: 'Alles berechnet. Das Leuchten ist eine Leuchtkarte, kein echtes Licht. Das Feld ist heller als heute, die Strahlen heben sich etwas weniger ab.',
    hinweise: [['kern', 'Nur 12 cm dick: Der Kernquader wird flach.'], ['mehr', 'Echtes Glas mit Durchsicht und Brechung wäre deutlich teurer.']],
    vorbilder: [['Bleiverglasung', WP('Bleiverglasung')], ['Kirchenfenster', WP('Kirchenfenster')], ['Fraumünster (Chagall-Fenster)', WP('Fraum%C3%BCnster')], ['Antikglas', WP('Antikglas')], ['Grisaille', WP('Grisaille')], ['Vierpass', WP('Vierpass')]],
  },
  {
    id: 'laterne', datei: 'laterne', name: 'Himmelslaterne', art: 'Andere Form: Papier und Licht',
    idee: 'Das Brett ist der Deckel einer grossen Papierlaterne, die Noas Zeichen zu den Sternen trägt. Oben liegt warmes, von innen durchleuchtetes Papier, zur Mitte heller. Im Rand steht ein Scherenschnitt in Schwarz: Tannen, Häuser, Kühe und Herzen, in den Ecken ein Herz mit Lebensbaum. Die Seiten laufen nach unten zusammen und leuchten, mit dem Scherenschnitt des Dorfs samt Kirche und Noa mit der Lampe.',
    raster: 'Die Schatten der Bambusrippen im Papier.',
    einlage: 'Eine schwarze Spitzenborte.',
    spiegelung: 'Keine.',
    welle: 'Die Flamme lodert auf: Vom Ring aus glüht das Papier heller, der Scherenschnitt bleibt schwarz, die ganze Laterne leuchtet nach.',
    kosten: 'Alles berechnet, die Seiten sind ein Pyramidenstumpf mit Textur, 1,5 m hoch. Das Leuchten ist eine Leuchtkarte, kein echtes Licht.',
    hinweise: [['kern', 'Die Seiten laufen nach unten zusammen: Der Kernquader wird kleiner.']],
    vorbilder: [['Himmelslaterne', WP('Himmelslaterne')], ['Scherenschnitt', WP('Scherenschnitt')], ['Johann Jakob Hauswirth', WP('Johann_Jakob_Hauswirth')], ['Pays-d’Enhaut', WP('Pays-d%E2%80%99Enhaut')], ['Räbeliechtli', WP('R%C3%A4beliechtli')], ['Lotte Reiniger', WP('Lotte_Reiniger')]],
  },
  {
    id: 'ofen', datei: 'ofen', name: 'Kachelofen', art: 'Gebaut: Stube',
    idee: 'Das Brett ist die Sitzfläche eines Kachelofens in der Stube. Im Feld liegen 49 grün glasierte Blattkacheln, eine je Feld, mit gekehltem Rahmen. Die Glasur läuft in Spuren, sammelt sich dunkel in den Kehlen und wird auf den Graten hell. Im Rand liegt die Ofenbank aus Arvenholz. Die Seiten sind kleine Kacheln über einem dunklen Sockel.',
    raster: 'Die Fugen aus grauem Ofenkitt, dazu der Rahmen jeder Kachel.',
    einlage: 'Eine Reihe schmaler, gewölbter Gesimskacheln.',
    spiegelung: 'Ja, die Glasur glänzt.',
    welle: 'Die Kacheln werden heiss: In der Kehle jeder Kachel glimmt Glut auf, die Glasur wird warm.',
    kosten: 'Alles berechnet. Der Ofen ist 72 cm tief und deckt das Feld wie heute.',
    hinweise: [],
    vorbilder: [['Kachelofen', WP('Kachelofen')], ['Ofenkachel', WP('Ofenkachel')], ['Hafner', WP('Hafner')], ['Craquelé', WP('Craquel%C3%A9')], ['Stube', WP('Stube')], ['Zirbelkiefer (Arve)', WP('Zirbelkiefer')]],
  },
  {
    id: 'spielbrett', datei: 'spielbrett', name: 'Altes Spielbrett', art: 'Gefunden: Spieltruhe',
    idee: 'Das Brett ist der Deckel einer alten Spieltruhe. Im Feld liegen Intarsien: 49 Felder abwechselnd aus hellem Ahorn und dunklem Nussbaum, die Maserung quer zueinander. Im Rand liegen eine Kordeleinlage, Sterne in den Ecken und in der Mitte jeder Seite ein Mühlespiel mit ein paar Steinen. Schellack glänzt. Die Seiten der Truhe sind grün bemalt, mit Tulpen, Ranken und Rosetten wie in der Bauernmalerei, dazu Messingecken.',
    raster: 'Entsteht aus dem Wechsel der Hölzer, mit feiner dunkler Fuge. Kräftiger als heute, die Felder treten stark hervor.',
    einlage: 'Eine helle Ahornader.',
    spiegelung: 'Ja, der Schellack glänzt.',
    welle: 'Ein Kerzenschein gleitet über den Schellack, die hellen Felder glimmen warm nach.',
    kosten: 'Alles berechnet. Deckt das Feld wie heute.',
    hinweise: [],
    vorbilder: [['Intarsie', WP('Intarsie')], ['Mühle (Spiel)', WP('M%C3%BChle_(Spiel)')], ['Bauernmalerei', WP('Bauernmalerei')], ['Schellack', WP('Schellack')], ['Truhe', WP('Truhe')]],
  },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function bild(datei, ansicht, text, name, haupt) {
  const src = `bilder/${datei}-${ansicht}.jpg`;
  if (!existsSync(join(here, src))) throw new Error('Bild fehlt: ' + src);
  const alt = `${name}: ${text}`;
  return `<figure class="${haupt ? 'haupt' : 'neben'} ${ansicht}">
          <button type="button" class="zoom" data-src="${src}" data-text="${esc(alt)}" aria-label="${esc(alt)} gross zeigen">
            <img src="${src}" alt="${esc(alt)}" ${haupt ? '' : 'loading="lazy" '}width="${ansicht === 'oben' ? 620 : 1080}" height="${ansicht === 'oben' ? 620 : 675}">
          </button>
          <figcaption>${esc(text)}</figcaption>
        </figure>`;
}

function karte(k, nr) {
  const views = [...BILDER, ...(k.extra ?? [])];
  const [first, ...rest] = views;
  return `
    <article class="karte${k.vergleich ? ' heute' : ''}" id="${k.id}">
      <header class="kopf">
        ${nr ? `<span class="nr" aria-hidden="true">${nr}</span>` : ''}
        <div>
          <p class="art">${nr ? `Variante ${nr} · ` : ''}${esc(k.art)}</p>
          <h2>${esc(k.name)}</h2>
        </div>
      </header>
      <div class="bilder">
        ${bild(k.datei, first[0], first[1], k.name, true)}
        <div class="streifen">
          ${rest.map(([a, t, d]) => bild(d ?? k.datei, a, t, k.name, false)).join('\n          ')}
        </div>
      </div>
      <div class="text">
        <p class="idee">${k.idee}</p>
        <dl class="behaelt">
          <div><dt>Raster</dt><dd>${k.raster}</dd></div>
          <div><dt>Einlegelinie</dt><dd>${k.einlage}</dd></div>
          <div><dt>Spiegelung</dt><dd>${k.spiegelung}</dd></div>
          <div class="welle"><dt>Lichtwelle</dt><dd>${k.welle}</dd></div>
          ${k.kosten ? `<div><dt>Kosten</dt><dd>${k.kosten}</dd></div>` : ''}
        </dl>
        ${k.hinweise.length ? `<ul class="hinweise">
          ${k.hinweise.map(([h, t]) => `<li><span class="chip chip-${h}">${HINWEIS[h][0]}</span> ${t}</li>`).join('\n          ')}
        </ul>` : ''}
        ${k.vorbilder.length ? `<p class="vorbilder"><span class="label">Vorbilder</span> ${k.vorbilder.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>` : ''}
      </div>
    </article>`;
}

const html = W(`<title>Dorfbretter</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  /* Musterbuch: je Richtung ein Musterblatt, links das Spielbild mit drei Nebenansichten, rechts Idee und Folgen */
  :root {
    --bg: #edf2f0;        /* Meeresdunst */
    --blatt: #f9fbfa;     /* Musterblatt */
    --ink: #13292b;       /* tiefes Wasser */
    --leise: #4f6567;
    --linie: #c9d7d3;
    --meer: #137a75;      /* Akzent: Türkis der Bucht */
    --sand: #a5612f;      /* Hinweise */
    --sand-grund: #f3e2d2;
    --meer-grund: #d8ece9;
    --wasser: #2b7c78;    /* Rand um die Aufsicht, wie das Meer ums Brett (beide Themen) */
    --f-titel: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
    --f-text: "Instrument Sans", "Segoe UI", system-ui, sans-serif;
    --f-mass: "IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace;
    --s0: 0.8125rem; --s1: 0.9375rem; --s2: 1.0625rem; --s3: 1.375rem; --s4: 2rem; --s5: clamp(2.2rem, 5vw, 3.4rem);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #0d1819; --blatt: #132224; --ink: #e2ecea; --leise: #9fb3b1; --linie: #284140;
      --meer: #52c3b9; --sand: #e3a36d; --sand-grund: #3a2a1e; --meer-grund: #173634; color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --bg: #0d1819; --blatt: #132224; --ink: #e2ecea; --leise: #9fb3b1; --linie: #284140;
    --meer: #52c3b9; --sand: #e3a36d; --sand-grund: #3a2a1e; --meer-grund: #173634; color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body {
    background: var(--bg); color: var(--ink); font: 400 var(--s1)/1.55 var(--f-text);
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
    padding-block: 0 4rem;
  }
  .seite { max-width: 1240px; margin: 0 auto; display: grid; gap: 2.5rem; }
  a { color: var(--meer); text-underline-offset: 0.18em; }
  a:focus-visible, button:focus-visible { outline: 3px solid var(--meer); outline-offset: 3px; border-radius: 4px; }
  .mass { font-family: var(--f-mass); font-size: 0.92em; font-variant-numeric: tabular-nums; }

  /* Kopf */
  .einstieg { padding-top: 3rem; display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); align-items: end; }
  .einstieg h1 { font: 700 var(--s5)/1.02 var(--f-titel); letter-spacing: -0.02em; margin: 0.3rem 0 0; text-wrap: balance; }
  .eyebrow { font: 500 var(--s0)/1.3 var(--f-mass); letter-spacing: 0.08em; text-transform: uppercase; color: var(--meer); margin: 0; }
  .einstieg p.lead { font-size: var(--s2); max-width: 62ch; margin: 0.9rem 0 0; }
  .grenzen { margin: 0; padding: 1rem 1.1rem; border: 1px solid var(--linie); border-radius: 10px; background: var(--blatt); font-size: var(--s0); }
  .grenzen h2 { font: 600 var(--s0)/1.3 var(--f-mass); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.5rem; color: var(--leise); }
  .grenzen ul { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.25rem; }
  .legende { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr)); gap: 0.75rem 1.75rem; font-size: var(--s0); color: var(--leise); margin: 0; padding: 0; list-style: none; }
  .legende li { display: grid; grid-template-columns: 9.5rem minmax(0, 1fr); gap: 0.6rem; align-items: baseline; }
  .legende .chip { justify-self: start; }
  .inhalt { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .inhalt a { display: inline-flex; gap: 0.4rem; align-items: baseline; padding: 0.3rem 0.7rem; border: 1px solid var(--linie); border-radius: 999px; text-decoration: none; color: var(--ink); background: var(--blatt); font-size: var(--s0); }
  .inhalt a b { font-family: var(--f-mass); font-weight: 500; color: var(--meer); }
  .inhalt a:hover { border-color: var(--meer); }

  /* Karten */
  .karte { background: var(--blatt); border: 1px solid var(--linie); border-radius: 14px; padding: clamp(1rem, 2.5vw, 1.75rem);
    display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); grid-template-areas: "kopf kopf" "bilder text"; gap: 1.1rem 1.75rem; scroll-margin-top: 1rem; }
  .karte.heute { background: transparent; border-style: dashed; }
  .kopf { grid-area: kopf; display: flex; gap: 1rem; align-items: center; }
  .nr { font: 700 2.6rem/1 var(--f-titel); color: var(--meer); min-width: 1.4ch; text-align: center; }
  .art { margin: 0; font: 500 var(--s0)/1.3 var(--f-mass); letter-spacing: 0.06em; text-transform: uppercase; color: var(--leise); }
  .kopf h2 { margin: 0.15rem 0 0; font: 700 var(--s4)/1.1 var(--f-titel); letter-spacing: -0.01em; text-wrap: balance; }
  .bilder { grid-area: bilder; display: grid; gap: 0.6rem; min-width: 0; }
  .streifen { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.6rem; }
  figure { margin: 0; display: grid; gap: 0.3rem; min-width: 0; }
  figcaption { font-size: var(--s0); color: var(--leise); }
  .zoom { all: unset; cursor: zoom-in; display: block; border-radius: 8px; overflow: hidden; background: var(--linie); }
  .zoom img { display: block; width: 100%; height: auto; aspect-ratio: 16 / 10; object-fit: cover; transition: transform 0.25s ease; }
  .neben .zoom img { aspect-ratio: 16 / 10; }
  .oben .zoom img { object-fit: contain; background: var(--wasser); }
  .zoom:hover img { transform: scale(1.02); }
  .text { grid-area: text; display: grid; gap: 1rem; align-content: start; min-width: 0; }
  .idee { margin: 0; font-size: var(--s2); }
  .behaelt { margin: 0; display: grid; gap: 0.55rem; }
  .behaelt div { display: grid; grid-template-columns: 7.5rem minmax(0, 1fr); gap: 0.75rem; padding-top: 0.55rem; border-top: 1px solid var(--linie); }
  .behaelt dt { font: 500 var(--s0)/1.5 var(--f-mass); text-transform: uppercase; letter-spacing: 0.06em; color: var(--leise); }
  .behaelt dd { margin: 0; }
  .behaelt .welle dt { color: var(--meer); }
  .hinweise { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; font-size: var(--s1); }
  .chip { display: inline-block; font: 500 0.75rem/1.2 var(--f-mass); letter-spacing: 0.03em; padding: 0.2rem 0.5rem; border-radius: 5px;
    color: var(--sand); background: var(--sand-grund); white-space: nowrap; }
  .chip-pinsel, .chip-teile, .chip-mehr { color: var(--meer); background: var(--meer-grund); }
  .vorbilder { margin: 0; font-size: var(--s0); line-height: 1.7; }
  .label { font: 500 var(--s0)/1 var(--f-mass); text-transform: uppercase; letter-spacing: 0.06em; color: var(--leise); margin-right: 0.35rem; }
  .fuss { font-size: var(--s0); color: var(--leise); max-width: 75ch; }

  /* Grossansicht */
  dialog { border: 0; padding: 0; background: transparent; max-width: min(96vw, 1440px); max-height: 96vh; }
  dialog::backdrop { background: rgb(5 14 15 / 0.82); }
  dialog figure { gap: 0.5rem; }
  dialog img { max-width: 100%; max-height: 86vh; width: auto; height: auto; border-radius: 8px; display: block; margin: 0 auto; }
  dialog figcaption { color: #e2ecea; text-align: center; }
  dialog .zu { position: absolute; top: 0.5rem; right: 0.5rem; font: 600 var(--s1)/1 var(--f-text); background: rgb(13 24 25 / 0.75); color: #e2ecea;
    border: 1px solid rgb(226 236 234 / 0.3); border-radius: 999px; padding: 0.45rem 0.8rem; cursor: pointer; }

  @media (max-width: 860px) {
    .einstieg { grid-template-columns: minmax(0, 1fr); padding-top: 2rem; }
    .karte { grid-template-columns: minmax(0, 1fr); grid-template-areas: "kopf" "bilder" "text"; }
    .behaelt div { grid-template-columns: minmax(0, 1fr); gap: 0.15rem; }
  }
  @media (prefers-reduced-motion: reduce) { .zoom img { transition: none; } .zoom:hover img { transform: none; } }
</style>

<div class="seite">
  <header class="einstieg">
    <div>
      <p class="eyebrow">Prisma · Ein Brett je Himmel · Noas Dorf bei Nacht</p>
      <h1>Dorfbretter</h1>
      <p class="lead">Acht Richtungen aus Noas Welt, die weder dem Gezeitenbecken noch der Lehmterrasse ähneln:
        gebaut (der Holzboden einer Laube, ein Dorfplatz nach dem Regen, ein Kachelofen), aus Noas Sachen (ein Quilt,
        ein Hochbeet, eine alte Spieltruhe) und aus Licht (ein Kirchenfenster, eine Himmelslaterne). Im Dorf sehen neue
        Spieler das Brett zum ersten Mal, achte deshalb besonders auf die Lesbarkeit. Jedes Bild stammt aus dem Spiel,
        dasselbe Level, das Brett zur Laufzeit eingesetzt. Wähle eine Richtung, gern mit Änderungswünschen.</p>
    </div>
    <section class="grenzen" aria-labelledby="grenzen-titel">
      <h2 id="grenzen-titel">Bleibt in jeder Richtung gleich</h2>
      <ul>
        <li>Das 7×7-Feld: eben, <span class="mass">8,4 × 8,4 m</span>, an derselben Stelle.</li>
        <li>Form frei innerhalb von <span class="mass">9,8 × 9,8 m</span>; das Brett schwebt <span class="mass">4 m</span> über dem Grund.</li>
        <li>Licht, Sockel, Drehteller und Prismenteller wie heute.</li>
        <li>Lichtwelle beim Lösen auf jedem Brett.</li>
      </ul>
    </section>
  </header>

  <nav aria-label="Karten">
    <ul class="inhalt">
      <li><a href="#heute"><b>·</b> Heute</a></li>
      __INHALT__
    </ul>
  </nav>

  <ul class="legende" aria-label="Hinweise auf den Karten">
    __LEGENDE__
  </ul>

  __KARTEN__

  <p class="fuss">Bilder: Spiel im Stand <span class="mass">main 504adbb</span>, <span class="mass">?sky=village</span>,
    Desktop <span class="mass">1440 × 900</span>, Chrome mit Grafikkarte. Die Bretter sind zur Laufzeit gebaut
    (Texturen im Browser berechnet, Pflanzen und Beiwerk als einfache Körper), sie zeigen die Richtung, nicht die fertige
    Gestaltung. Licht, Sockel und Teller sind wie heute; was leuchtet, leuchtet aus sich selbst. Die Skripte, die die
    Bretter im Spiel bauen, liegen unter <span class="mass">katalog-dorf/bretter/</span>, die Vorbilder unter
    <span class="mass">vorbilder/dorf.md</span>.</p>
</div>

<dialog id="gross" aria-label="Bild gross">
  <figure>
    <img id="gross-bild" alt="">
    <figcaption id="gross-text"></figcaption>
  </figure>
  <button type="button" class="zu" id="gross-zu">Schliessen</button>
</dialog>

<script>
  const dlg = document.getElementById('gross'), img = document.getElementById('gross-bild'), txt = document.getElementById('gross-text');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.zoom');
    if (b) {
      img.src = b.dataset.src; img.alt = b.dataset.text; txt.textContent = b.dataset.text;
      if (typeof dlg.showModal === 'function') dlg.showModal(); else window.open(b.dataset.src, '_blank');
      return;
    }
    if (e.target === dlg || e.target.id === 'gross-zu') dlg.close();
  });
</script>
`);

const out = html
  .replace('__INHALT__', karten.map((k, i) => `<li><a href="#${k.id}"><b>${i + 1}</b> ${esc(k.name)}</a></li>`).join('\n      '))
  .replace('__LEGENDE__', Object.entries(HINWEIS).filter(([k]) => karten.some((c) => c.hinweise.some(([h]) => h === k))).map(([k, [t, e]]) => `<li><span class="chip chip-${k}">${t}</span> <span>${e}</span></li>`).join('\n    '))
  .replace('__KARTEN__', [karte(heute, 0), ...karten.map((k, i) => karte(k, i + 1))].join('\n'));
writeFileSync(join(here, 'index.html'), out);
console.log('index.html geschrieben,', karten.length, 'Varianten');
