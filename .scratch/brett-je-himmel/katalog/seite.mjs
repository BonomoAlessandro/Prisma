// Baut die Vorschauseite des Skizzenkatalogs (Ticket 03) aus den Karten unten: node seite.mjs → index.html
// Bilder liegen in bilder/ (aus dem Spiel, Stand main 6f322ce, ?sky=beach, Brett zur Laufzeit eingesetzt).
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
  id: 'heute', datei: 'stein', name: 'Steinbrett', art: 'Heute',
  idee: 'Dunkler, fein geäderter Schiefer mit eingravierten Rasterlinien, einer hellen Einlegelinie, polierten dunklen Seiten und einer Metallkante. So sieht das Brett heute in allen Welten aus.',
  raster: 'Eingraviert, fein.', einlage: 'Helle, matte Linie knapp ausserhalb des Felds.', spiegelung: 'Ja, poliert.',
  welle: 'Ein heller Ring in der Mischfarbe der Ziele läuft von der Mitte bis über die Ecken.',
  hinweise: [], vorbilder: [],
};

const WP = (t) => `https://de.wikipedia.org/wiki/${t}`;
const EN = (t) => `https://en.wikipedia.org/wiki/${t}`;

const karten = [
  {
    id: 'sandbank', datei: 'sand', name: 'Sandbank', art: 'Andere Oberfläche',
    idee: 'Das Brett ist ein Stück Strand, das mitfliegt. Im Feld liegt feuchter, glatt gestrichener Sand, auf dem Rand trockene Rippeln, wie sie die Ebbe hinterlässt. Die Seiten zeigen geschichteten Sand wie eine abgestochene Sandburg.',
    raster: 'Mit dem Finger in den Sand gezogene Rillen, breiter und weicher als heute.',
    einlage: 'Eine Reihe heller und rosa Muschelsplitter.',
    spiegelung: 'Ja, aber matt: Nur wo der Sand nass ist, glänzt er und zeigt die Elemente verschwommen.',
    welle: 'Ein Saum aus Schaum läuft von der Mitte nach aussen, dahinter bleibt der Sand dunkel und nass wie nach einer auslaufenden Welle.',
    hinweise: [],
    vorbilder: [['Rippelmarke', WP('Rippelmarke')], ['Swash', EN('Swash')], ['Sandburg', WP('Sandburg')], ['Sorolla, Walk on the Beach', EN('Walk_on_the_Beach')]],
  },
  {
    id: 'floss', datei: 'floss', name: 'Treibholz-Floss', art: 'Andere Form: Bohlen',
    idee: 'Jede Reihe des Felds ist eine Bohle aus silbergrauem Treibholz, vorn und hinten liegen breitere Randbohlen mit Resten alter Bootsfarbe. Darunter halten drei Rundhölzer das Floss zusammen, mit Tau gezurrt. Die Bohlen sind ungleich lang, der Umriss franst aus.',
    raster: 'Die Reihen sind die Fugen zwischen den Bohlen, die Spalten sind eingebrannt.',
    einlage: 'Ein Tau, das ums Feld läuft.',
    spiegelung: 'Nein, Holz ist matt. Ihr Zeichnen könnte für dieses Brett entfallen.',
    welle: 'Die eingebrannten Linien glimmen wie Glut auf, wo der Ring vorbeizieht, und durch die Fugen fällt warmes Licht von unten.',
    hinweise: [
      ['blender', 'Bohlen, Rundhölzer und Tau lassen sich als einfache Körper berechnen (so in den Bildern). Krummes Treibholz mit Ästen bräuchte Formen aus Blender.'],
      ['kern', 'Ungleiche Bohlenenden und offene Fugen decken den Quader nicht ganz. Der Kernquader wäre nur das Feld mit den Randbohlen.'],
    ],
    vorbilder: [['Treibholz', WP('Treibholz')], ['Kon-Tiki', WP('Kon-Tiki')], ['Brandmalerei', WP('Brandmalerei')], ['Raft', EN('Raft_(video_game)')], ['Sea of Thieves', WP('Sea_of_Thieves')]],
  },
  {
    id: 'gezeitenfels', datei: 'fels', name: 'Gezeitenfels', art: 'Dinge auf dem Rand',
    idee: 'Eine Platte aus dem rosabraunen Fels der Bucht. Das Feld ist glatt gewaschen und glänzt nass. Auf dem Rand sitzen Seepocken, Napfschnecken und in zwei Ecken Miesmuscheln, ein Seestern liegt auf einer Ecke, über die Kante hängt Tang, unten an den Seiten liegt ein grünes Algenband.',
    raster: 'Eingraviert wie heute.',
    einlage: 'Eine helle Linie wie eine Salzkruste.',
    spiegelung: 'Ja, der nasse Fels glänzt.',
    welle: 'Ein Wasserfilm läuft über den Fels: vorn eine helle Kante, dahinter glänzt der Stein nass.',
    hinweise: [
      ['teile', 'Gut 1500 Seepocken, Muscheln und Schnecken als Instanzen, dazu Tangbänder. Auf dem Handy zu messen.'],
      ['blender', 'Seepocken und Muscheln gehen berechnet. Tang, der natürlich über die Kante fällt, gelänge mit Formen aus Blender besser.'],
    ],
    vorbilder: [['Gezeitenzone', WP('Gezeitenzone')], ['Seepocken', WP('Seepocken')], ['Miesmuschel', WP('Miesmuschel')], ['Meersalat', WP('Meersalat')], ['Andy Goldsworthy', WP('Andy_Goldsworthy')]],
  },
  {
    id: 'muschelkalk', datei: 'muschelkalk', name: 'Muschelkalk mit Perlmutt', art: 'Andere Oberfläche, eingelegt',
    idee: 'Heller Schalenkalk, wie ihn das Meer aus Muscheln zusammenbäckt. Im Feld ist er geschliffen und zeigt nur feine Bögen der Schalen, im Rand bleibt er rau, mit ganzen Herz- und Kammmuscheln. Rasterlinien und Einlegelinie sind Bänder aus Perlmutt, deren Farbe mit dem Blick kippt.',
    raster: 'Perlmuttlinien, gut doppelt so breit wie heute.',
    einlage: 'Ein breites Perlmuttband.',
    spiegelung: 'Schwach, geschliffener Stein. Die Perlmuttlinien glänzen.',
    welle: 'Ein Schimmer in den Farben des Perlmutts zieht über den Stein, die Perlmuttlinien blitzen nacheinander auf.',
    hinweise: [],
    vorbilder: [['Schillkalk', WP('Schillkalk')], ['Coquina', EN('Coquina')], ['Muschelkalk', WP('Muschelkalk')], ['Perlmutt', WP('Perlmutt')], ['Kammmuscheln', WP('Kammmuscheln')]],
  },
  {
    id: 'seeglas', datei: 'seeglas', name: 'Seeglas', art: 'Andere Oberfläche, durchscheinend',
    idee: 'Jedes der 49 Felder ist eine Fliese aus mattiertem Meerglas in Türkis, Grün und Weiss. Der Rand ist ein Mosaik aus Glaskieseln in Sand, darunter selten Bernstein und Kobalt. Die Seiten sind dickes, grünblaues Glas, durch das das Meer scheint.',
    raster: 'Die Fugen zwischen den Fliesen.',
    einlage: 'Eine Reihe kobaltblauer Splitter.',
    spiegelung: 'Schwach auf dem Glas.',
    welle: 'Fliese um Fliese leuchtet von innen auf, als fiele Sonne durchs Glas. Der Ring wird zu einer Treppe aus Feldern.',
    hinweise: [
      ['kern', 'Die durchscheinenden Seiten decken nicht. Der Himmel muss hinter dem Brett zeichnen, der Kernquader schrumpft auf die Oberseite.'],
      ['mehr', 'Hier ist Glas vorgetäuscht (leuchtende Farbe, halb durchsichtige Seiten). Echtes Glas mit Brechung wäre deutlich teurer.'],
    ],
    vorbilder: [['Meerglas', WP('Meerglas')], ['Kaustik', WP('Kaustik_(Optik)')], ['Trencadís', WP('Trencad%C3%ADs')], ['Mosaik', WP('Mosaik')], ['Abzû', WP('Abz%C3%BB')]],
  },
  {
    id: 'gezeitenbecken', datei: 'wasserrand', name: 'Gezeitenbecken', art: 'Übergang zum Wasser',
    idee: 'Das Feld ist heller Sandstein. Rundherum läuft im Rand eine flache Rinne mit klarem Wasser, mit Lichtnetz am Grund und Schaum an den Kanten, aussen hält eine schmale Felslippe das Wasser. Die Seiten sind nasser Fels mit Rinnsalen.',
    raster: 'Eingraviert wie heute.',
    einlage: 'Entfällt, die Wasserkante mit ihrem Schaum ersetzt sie.',
    spiegelung: 'Nur in der Rinne, dort stark. Das Feld ist matt.',
    welle: 'Licht läuft über den Stein. In der Rinne läuft ein Schwall mit Schaum rundum.',
    hinweise: [
      ['ausblick', 'Ausblick (Bild «Wasserfall»): Das Wasser fällt in Schleiern bis aufs Meer, 3 m tiefer. Das verbindet das Brett mit dem Grund und ist nicht Teil der Spec.'],
    ],
    extra: [['flach', 'Ausblick: Wasserfall bis aufs Meer', 'wasserrand-ausblick']],
    vorbilder: [['Gezeitentümpel', WP('Gezeitent%C3%BCmpel')], ['Infinity-Pool', WP('Infinity-Pool')], ['Kaustik', WP('Kaustik_(Optik)')], ['Bad North', EN('Bad_North')], ['Dorfromantik', WP('Dorfromantik')]],
  },
  {
    id: 'gemalt', datei: 'gemalt', name: 'Gemalt', art: 'Gemalter Look',
    idee: 'Das Brett in Farben und Malweise des Panoramas: warmer Sandstein in wenigen ruhigen Tönen, ein violetter Schatten zur Kante hin, eine helle Kante oben, die Linien mit dem Pinsel gezogen. Der Pinselfilter, der heute nur die nahen Pflanzen malt, malt in den Bildern das Brett mit.',
    raster: 'Gemalte Linien, leicht ungleich breit.',
    einlage: 'Eine helle, gemalte Linie.',
    spiegelung: 'Nein. Eine Spiegelung passt nicht zu gemalten Flächen.',
    welle: 'Ein breiter, warmer Lichtring, den der Pinsel mitmalt.',
    hinweise: [
      ['pinsel', 'Der Quader, der heute Brett und Elemente vor dem Pinsel schützt, muss weg oder enger um Elemente und Strahlen. Der Filter rechnet dann über das ganze Brett, auf dem Handy teuer. Elemente am Brett bekommen etwas Farbe ab.'],
    ],
    vorbilder: [['Kazuo Oga', EN('Kazuo_Oga')], ['Makoto Shinkai', WP('Makoto_Shinkai')], ['Kuwahara-Filter', EN('Kuwahara_filter')], ['The Wind Waker', WP('The_Legend_of_Zelda:_The_Wind_Waker')], ['Tchia', EN('Tchia')]],
  },
  {
    id: 'sandinsel', datei: 'insel', name: 'Schwebende Sandinsel', art: 'Andere Form: Scholle',
    idee: 'Das Brett ist eine kleine Insel, aus dem Strand gerissen: oben Sand, der Umriss rund und angefressen, auf dem Rand Strandhafer, Kiesel und Muscheln. Darunter hängt ein Zapfen aus Erde und dem Fels der Bucht, gut 2 m tief, mit Wurzeln.',
    raster: 'In den Sand gezogene Rillen, schmal.',
    einlage: 'Eine schmale, helle Linie.',
    spiegelung: 'Nein.',
    welle: 'Ein goldener Ring, in dem die Sandkörner aufglitzern.',
    hinweise: [
      ['blender', 'Umriss und Zapfen sind hier berechnet (verrauschte Ringe). Ruhiger und schöner würde der Zapfen aus Blender, mit Felsen wie die der Bucht. Er reicht 2,4 m unter die Oberseite (heute 0,41 m), bleibt aber im Umriss.'],
      ['kern', 'Der runde Umriss deckt die Ecken des Quaders nicht. Der Kernquader wird kleiner.'],
      ['teile', 'Strandhafer aus vielen Halmen, Wurzeln unter der Kante.'],
    ],
    vorbilder: [['Das Schloss im Himmel', WP('Das_Schloss_im_Himmel')], ['Zhangjiajie', WP('Zhangjiajie_National_Forest_Park')], ['Tears of the Kingdom', WP('The_Legend_of_Zelda:_Tears_of_the_Kingdom')], ['Sky: Children of the Light', EN('Sky:_Children_of_the_Light')], ['Strandhafer', WP('Strandhafer')]],
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
    <article class="karte${k.id === 'heute' ? ' heute' : ''}" id="${k.id}">
      <header class="kopf">
        ${nr ? `<span class="nr" aria-hidden="true">${nr}</span>` : ''}
        <div>
          <p class="art">${nr ? `Karte ${nr} · ` : ''}${esc(k.art)}</p>
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
        </dl>
        ${k.hinweise.length ? `<ul class="hinweise">
          ${k.hinweise.map(([h, t]) => `<li><span class="chip chip-${h}">${HINWEIS[h][0]}</span> ${t}</li>`).join('\n          ')}
        </ul>` : ''}
        ${k.vorbilder.length ? `<p class="vorbilder"><span class="label">Vorbilder</span> ${k.vorbilder.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>` : ''}
      </div>
    </article>`;
}

const html = W(`<title>Brett am Strand</title>
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
      <p class="eyebrow">Prisma · Ein Brett je Himmel · Skizzenkatalog</p>
      <h1>Brett am Strand</h1>
      <p class="lead">Acht Richtungen, wie das Brett das Material des Strands aufnehmen kann. Jedes Bild stammt aus dem
        Spiel: dasselbe Level am Strand, das neue Brett zur Laufzeit eingesetzt, nichts übermalt. Wähle zwei bis drei
        Karten, gern mit Änderungswünschen. Sie kommen als Richtungen ins Spiel (Ticket 04).</p>
    </div>
    <section class="grenzen" aria-labelledby="grenzen-titel">
      <h2 id="grenzen-titel">Bleibt in jeder Richtung gleich</h2>
      <ul>
        <li>Das 7×7-Feld: eben, <span class="mass">8,4 × 8,4 m</span>, an derselben Stelle.</li>
        <li>Form frei innerhalb von <span class="mass">9,8 × 9,8 m</span>; das Brett schwebt <span class="mass">3 m</span> über dem Wasser.</li>
        <li>Licht, Sockel, Drehteller und Prismenteller wie heute.</li>
        <li>Lichtwelle beim Lösen auf jedem Brett.</li>
        <li>Frei: Rasterlinien, Einlegelinie, Spiegelung.</li>
      </ul>
    </section>
  </header>

  <nav aria-label="Karten">
    <ul class="inhalt">
      <li><a href="#heute"><b>0</b> Heute</a></li>
      __INHALT__
    </ul>
  </nav>

  <ul class="legende" aria-label="Hinweise auf den Karten">
    __LEGENDE__
  </ul>

  __KARTEN__

  <p class="fuss">Bilder: Spiel im Stand <span class="mass">main 6f322ce</span>, <span class="mass">?sky=beach</span>,
    Desktop <span class="mass">1440 × 900</span>, Chrome mit Grafikkarte. Die Bretter sind zur Laufzeit gebaut
    (Texturen im Browser berechnet, Bewuchs als einfache Körper), sie zeigen die Richtung, nicht die fertige Gestaltung.
    Vorbilder mit je einem Satz: <span class="mass">.scratch/brett-je-himmel/vorbilder/index.md</span>. Die Skripte, die die
    Bretter im Spiel bauen (Texturen, Shader der Lichtwellen), liegen unter <span class="mass">katalog/bretter/</span>.</p>
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
  .replace('__LEGENDE__', Object.entries(HINWEIS).map(([k, [t, e]]) => `<li><span class="chip chip-${k}">${t}</span> <span>${e}</span></li>`).join('\n    '))
  .replace('__KARTEN__', [karte(heute, 0), ...karten.map((k, i) => karte(k, i + 1))].join('\n'));
writeFileSync(join(here, 'index.html'), out);
console.log('index.html geschrieben,', karten.length, 'Karten');
