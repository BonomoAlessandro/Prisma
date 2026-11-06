// Baut die Vorschauseite «Waldbretter» (Ticket 07, 8 völlig neue Richtungen für den Bergwald): node seite.mjs → index.html
// Bilder liegen in bilder/ (aus dem Spiel, Stand main 504adbb, ?sky=forest, Brett zur Laufzeit eingesetzt).
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
  id: 'heute', datei: 'stein', name: 'Steinbrett im Bergwald', art: 'Heute', vergleich: true,
  idee: 'Das heutige Brett unter dem Waldhimmel: dunkler Schiefer mit eingravierten Rasterlinien, heller Einlegelinie, polierten Seiten und Metallkante.',
  raster: 'Eingraviert, fein.', einlage: 'Helle, matte Linie knapp ausserhalb des Felds.', spiegelung: 'Ja, poliert.',
  welle: 'Ein heller Ring in der Mischfarbe der Ziele läuft von der Mitte bis über die Ecken.',
  hinweise: [], vorbilder: [],
};
const WP = (t) => `https://de.wikipedia.org/wiki/${t}`;
const EN = (t) => `https://en.wikipedia.org/wiki/${t}`;

const karten = [
  {
    id: 'scheibe', datei: 'scheibe', name: 'Baumscheibe', art: 'Andere Form: gewachsen',
    idee: 'Das Brett ist eine Scheibe vom Stammfuss einer alten Lärche. Im Feld liegen die Jahresringe im rotbraunen Kernholz, um das Feld ein heller Splint, rundum die Borke. Der Umriss folgt den vier Wurzelanläufen, an den Seiten sitzt die tief gefurchte Borke, und von aussen laufen Trockenrisse ein.',
    raster: 'Brandlinien, dunkel.',
    einlage: 'Entfällt, der helle Splint rahmt das Feld.',
    spiegelung: 'Kaum, das Holz ist geölt.',
    welle: 'Läuft Ring für Ring durch das Holz und folgt dabei den Jahresringen statt einem Kreis. Das Spätholz leuchtet wie Harz.',
    kosten: 'Alles berechnet, die Borke ist eine Textur auf einem einzigen Körper. Die abgerundeten Ecken decken den heutigen Quader nicht ganz.',
    hinweise: [['kern', 'Abgerundeter Umriss: Der Kernquader wird an den Ecken kleiner.']],
    vorbilder: [['Jahresring', WP('Jahresring')], ['Europäische Lärche', WP('Europ%C3%A4ische_L%C3%A4rche')], ['Wurzelanlauf', WP('Wurzelanlauf')], ['Dendrochronologie', WP('Dendrochronologie')], ['General Sherman Tree', WP('General_Sherman_Tree')]],
  },
  {
    id: 'moos', datei: 'moos', name: 'Moospolster', art: 'Material: lebendig',
    idee: 'Das Brett ist ein Stück Waldboden, das sich gelöst hat. Das Feld ist kurzes, samtiges Moos wie im Moostempel von Kyoto, im Rand liegen dicke Polster mit leuchtenden Helmlingen, an den Ecken wächst Farn. Die Seiten sind die Erdscholle mit Steinen, darunter hängen Wurzeln.',
    raster: 'Linien aus hellem Silbermoos.',
    einlage: 'Entfällt, die Polster beginnen am Feld.',
    spiegelung: 'Keine.',
    welle: 'Wie beim Waldgott in «Prinzessin Mononoke»: Wo der Ring vorbeizieht, blühen kleine weisse Blumen auf und welken hinter ihm wieder, die Helmlinge leuchten auf.',
    kosten: 'Feld und Scholle berechnet. Polster, Pilze, Farn und Blumen sind rund 2100 kleine Körper in wenigen Gruppen, dazu 70 Wurzeln.',
    hinweise: [['teile', 'Rund 2100 Polster, Pilze, Farnwedel und Blumen. Auf dem Handy zu messen.'], ['mehr', 'Echter Moosflor aus vielen Schichten wäre weicher, aber teurer.']],
    vorbilder: [['Saihō-ji (Moostempel)', WP('Saih%C5%8D-ji')], ['Yakushima', WP('Yakushima')], ['Prinzessin Mononoke', WP('Prinzessin_Mononoke')], ['Foxfire (leuchtende Pilze)', EN('Foxfire')], ['Helmlinge', WP('Helmlinge')], ['Wald-Sauerklee', WP('Wald-Sauerklee')]],
  },
  {
    id: 'granit', datei: 'granit', name: 'Granitblock mit Flechten', art: 'Material: Stein der Berge',
    idee: 'Das Brett ist ein schwerer Block aus Alpengranit, oben gesägt und fein gestockt. Im Rand und an den Seiten liegt die raue Spaltfläche aus dem Steinbruch, eine Ecke ist abgeschlagen. Darauf wachsen Landkartenflechte, Gelbflechte und graue Blattflechten wie auf jedem Findling im Bergwald.',
    raster: 'Sägeschnitte, dunkel.',
    einlage: 'Ein polierter, dunklerer Streifen.',
    spiegelung: 'Leicht, im polierten Streifen etwas mehr.',
    welle: 'Der Glimmer im Granit funkelt auf, wo der Ring vorbeizieht, dahinter bleibt ein kühler Schimmer.',
    kosten: 'Alles berechnet, ein einziger Körper von 62 cm Dicke. Die ausgebrochenen Kanten decken den Quader nicht ganz.',
    hinweise: [['kern', 'Ausgebrochene Kanten und die abgeschlagene Ecke: Der Kernquader wird etwas kleiner.']],
    vorbilder: [['Granit', WP('Granit')], ['Findling', WP('Findling')], ['Landkartenflechte', WP('Landkartenflechte')], ['Gewöhnliche Gelbflechte', WP('Gew%C3%B6hnliche_Gelbflechte')], ['Glimmer', WP('Glimmergruppe')], ['Spaltkeile', EN('Plug_and_feather')]],
  },
  {
    id: 'kerbschnitt', datei: 'kerbschnitt', name: 'Kerbschnitt und Bauernmalerei', art: 'Gebaut: Handwerk aus der Alphütte',
    idee: 'Das Brett ist eine Tischplatte aus Arvenholz wie in einer Alphütte, jede Reihe eine Bohle mit dunklen Ästen. Der Rand ist dunkel blaugrün gemalt, mit Rosetten im Kerbschnitt (Sechsstern) und roten Tulpen dazwischen. An den Seiten läuft eine gemalte Ranke, die Kante ist eine rote Leiste.',
    raster: 'Kerben, dunkel.',
    einlage: 'Entfällt, rote und ockerfarbene Malerlinien rahmen das Feld.',
    spiegelung: 'Kaum, das Holz ist gewachst.',
    welle: 'Warmes Kerzenlicht, das sich in den Kerben des Rasters und in den Rosetten fängt.',
    kosten: 'Alles berechnet und gemalt, keine zusätzlichen Körper. Deckt das Feld wie heute.',
    hinweise: [],
    vorbilder: [['Kerbschnitt', WP('Kerbschnitt')], ['Chip carving', EN('Chip_carving')], ['Bauernmalerei', WP('Bauernmalerei')], ['Appenzeller Bauernmalerei', WP('Appenzeller_Bauernmalerei')], ['Arve (Zirbelkiefer)', WP('Zirbelkiefer')], ['Sechsstern', WP('Sechsstern')]],
  },
  {
    id: 'fliegenpilz', datei: 'fliegenpilz', name: 'Fliegenpilz', art: 'Andere Form: ein Pilz',
    idee: 'Das Brett ist der Hut eines riesigen Fliegenpilzes. Das Feld ist die blassere, orangerote Mitte des Huts, im Rand sitzen weisse Warzen auf Scharlachrot. Der Hutrand rollt sich nach unten ein, darunter liegen helle Lamellen, und ein weisser Stiel mit Manschette und Knolle reicht 3 m unter das Brett.',
    raster: 'Feine weisse Linien wie Reste der Hülle.',
    einlage: 'Weiss.',
    spiegelung: 'Leicht, die Huthaut glänzt feucht.',
    welle: 'Ein Hexenring: Der Ring leuchtet warm, Sporen steigen leuchtend in ihm auf, und die Warzen glimmen.',
    kosten: 'Hut berechnet, Hutrand und Stiel als einfache Körper, rund 500 Warzen und 2600 Sporen als Instanzen. Das Rot wäre im Spiel noch mit den roten Zielsockeln abzustimmen.',
    hinweise: [['kern', 'Abgerundeter Hut und eingerollter Rand: Der Kernquader wird kleiner. Der Stiel ragt unter das Brett, bleibt aber im Umriss.'], ['teile', 'Warzen und Sporen sind viele kleine Körper. Auf dem Handy zu messen.']],
    vorbilder: [['Fliegenpilz', WP('Fliegenpilz')], ['Hexenring', WP('Hexenring')], ['Alice im Wunderland', WP('Alice_im_Wunderland')], ['Fantasia (1940)', EN('Fantasia_(1940_film)')]],
  },
  {
    id: 'wurzeln', datei: 'wurzeln', name: 'Wurzelgeflecht', art: 'Gefunden: von Wurzeln umschlungen',
    idee: 'Das Brett ist ein alter Steinboden im Wald, den die Wurzeln eines Baums umschlungen haben wie in Ta Prohm. Jedes Feld ist eine eigene, verwitterte Steinplatte, in den Fugen laufen feine Wurzelhaare. Dunkle Wurzeln kriechen über den Rand aus Bruchsteinen, umfassen die Seiten und hängen unter dem Brett als Geflecht.',
    raster: 'Die Fugen zwischen den Platten.',
    einlage: 'Die Fuge zwischen Feld und Rand.',
    spiegelung: 'Kaum.',
    welle: 'Licht fliesst wie Saft durch die Wurzelhaare in den Fugen, das Raster leuchtet grün auf. Erreicht der Ring den Rand, glühen die Wurzeln mit, wie Nachrichten im Wurzelnetz des Waldes.',
    kosten: 'Steine berechnet, die Wurzeln sind rund 90 Röhren in einem Körper. An den Seiten reichen sie bis knapp an den Umriss.',
    hinweise: [['blender', 'Wurzeln mit Knorren und Rinde wären als Form aus Blender deutlich kräftiger als die berechneten Röhren.'], ['teile', 'Rund 90 Wurzeln mit vielen Dreiecken. Auf dem Handy zu messen.']],
    vorbilder: [['Ta Prohm', WP('Ta_Prohm')], ['Das Schloss im Himmel', WP('Das_Schloss_im_Himmel')], ['Jōmon-Sugi', WP('J%C5%8Dmon-Sugi')], ['Mykorrhiza', WP('Mykorrhiza')], ['Mycorrhizal network', EN('Mycorrhizal_network')]],
  },
  {
    id: 'laterne', datei: 'laterne', name: 'Papierlaterne', art: 'Licht: von innen leuchtend',
    idee: 'Das Brett ist eine flache Laterne aus Washi-Papier in einem Gitter aus dunklem Holz, die von innen warm leuchtet: eine Lichtinsel im nächtlichen Wald, zu der die Glühwürmchen passen. Das Raster sind die Holzstäbe, im Rand liegt das Kumiko-Muster Asanoha (Hanfblatt), die Seiten sind Papierwände zwischen Pfosten.',
    raster: 'Breite Holzstäbe, dunkel.',
    einlage: 'Ein schmaler Holzrahmen um das Feld.',
    spiegelung: 'Keine, Papier spiegelt nicht.',
    welle: 'Fach für Fach flammt das Licht auf, sobald der Ring die Mitte des Fachs erreicht.',
    kosten: 'Alles berechnet. Das Leuchten steckt im Material, es ist keine Lichtquelle. Deckt das Feld wie heute.',
    hinweise: [['mehr', 'Das Leuchten ist gemalt: Es erhellt weder die Elemente noch die Bäume. Echtes Licht aus dem Brett wäre teurer.']],
    vorbilder: [['Shōji', WP('Sh%C5%8Dji')], ['Andon', WP('Andon')], ['Kumiko', EN('Kumiko_(woodworking)')], ['Washi', WP('Washi')], ['Tōrō nagashi', WP('T%C5%8Dr%C5%8D_nagashi')]],
  },
  {
    id: 'scherenschnitt', datei: 'scherenschnitt', name: 'Scherenschnitt', art: 'Gemalt: Papierkunst aus den Bergen',
    idee: 'Das Brett ist ein grosser Scherenschnitt wie aus dem Pays-d’Enhaut. Das Feld ist helles Büttenpapier, im Rand stehen schwarz geschnittene Tannen, Hirsche und Herzen, gespiegelt wie gefaltetes Papier, in den Ecken Sonnenräder. Die Seiten sind ein Stapel Papier.',
    raster: 'Feine Bleistiftlinien.',
    einlage: 'Ein schwarzer Papierstreifen.',
    spiegelung: 'Keine.',
    welle: 'Gegenlicht: Wo der Ring vorbeizieht, scheint das Papier warm durch, die Rippung des Büttens tritt hervor, und hinter dem Ring erscheint das Wasserzeichen, ein grosser Hirschkopf.',
    kosten: 'Alles berechnet und gezeichnet. Deckt das Feld wie heute.',
    hinweise: [],
    vorbilder: [['Scherenschnitt', WP('Scherenschnitt')], ['Johann Jakob Hauswirth', WP('Johann_Jakob_Hauswirth')], ['Pays-d’Enhaut', WP('Pays-d%E2%80%99Enhaut')], ['Wasserzeichen', WP('Wasserzeichen')], ['Büttenpapier', WP('B%C3%BCttenpapier')], ['Lotte Reiniger', WP('Lotte_Reiniger')]],
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

const html = W(`<title>Waldbretter</title>
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
      <p class="eyebrow">Prisma · Ein Brett je Himmel · Bergwald</p>
      <h1>Waldbretter</h1>
      <p class="lead">Acht Richtungen für den Bergwald, die weder dem Gezeitenbecken noch der Lehmterrasse folgen:
        andere Formen (eine Baumscheibe, ein Fliegenpilz), Stoffe aus dem Wald (Moos, Granit mit Flechten), Gebautes und
        Gefundenes (eine Arvenplatte mit Kerbschnitt, ein Steinboden in Wurzeln), Licht (eine Papierlaterne) und
        Papierkunst (ein Scherenschnitt). Der Wald steht im Spiel im Mondlicht, die Farben sind darauf abgestimmt. Jedes
        Bild stammt aus dem Spiel, dasselbe Level, das Brett zur Laufzeit eingesetzt. Wähle eine Richtung, gern mit
        Änderungswünschen.</p>
    </div>
    <section class="grenzen" aria-labelledby="grenzen-titel">
      <h2 id="grenzen-titel">Bleibt in jeder Richtung gleich</h2>
      <ul>
        <li>Das 7×7-Feld: eben, <span class="mass">8,4 × 8,4 m</span>, an derselben Stelle.</li>
        <li>Form frei innerhalb von <span class="mass">9,8 × 9,8 m</span>; das Brett schwebt über den Wipfeln der Fichten.</li>
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

  <p class="fuss">Bilder: Spiel im Stand <span class="mass">main 504adbb</span>, <span class="mass">?sky=forest</span>,
    Desktop <span class="mass">1440 × 900</span>, Chrome mit Grafikkarte. Die Bretter sind zur Laufzeit gebaut
    (Texturen im Browser berechnet, Bewuchs und Wurzeln als einfache Körper), sie zeigen die Richtung, nicht die fertige
    Gestaltung. Die Skripte, die die Bretter im Spiel bauen, liegen unter <span class="mass">katalog-wald/bretter/</span>.</p>
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
