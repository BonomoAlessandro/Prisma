// Baut die Vorschauseite «Vulkanbretter» (8 völlig neue Richtungen): node seite.mjs → index.html
// Bilder liegen in bilder/ (aus dem Spiel, Stand main 504adbb mit dem neuen Krater, ?sky=volcano, Brett zur Laufzeit
// eingesetzt; Skripte in bretter/).
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
  id: 'heute', datei: 'stein', name: 'Steinbrett am Vulkan', art: 'Heute', vergleich: true,
  idee: 'Das heutige Brett über dem Lavasee: dunkler Schiefer mit eingravierten Rasterlinien, heller Einlegelinie, polierten Seiten und Metallkante.',
  raster: 'Eingraviert, fein.', einlage: 'Helle, matte Linie knapp ausserhalb des Felds.', spiegelung: 'Ja, poliert.',
  welle: 'Ein heller Ring in der Mischfarbe der Ziele läuft von der Mitte bis über die Ecken.',
  hinweise: [], vorbilder: [],
};
const WP = (t) => `https://de.wikipedia.org/wiki/${t}`;
const EN = (t) => `https://en.wikipedia.org/wiki/${t}`;

const karten = [
  {
    id: 'obsidian', datei: 'obsidian', name: 'Geschlagener Obsidian', art: 'Material: Vulkanglas',
    idee: 'Das Brett ist ein Block aus Vulkanglas, geschlagen wie eine Klinge aus der Steinzeit. Das Feld ist schwarz poliert und spiegelt Strahlen und Elemente. Im Rand liegen muschelige Abschläge mit feinen Wellenlinien, der Umriss ist ausgebogt. Darunter hängt ein facettierter Kiel, dessen Flächen die Glut des Sees spiegeln. Die dünne Kante scheint rotbraun durch.',
    raster: 'Matt geätzte, graue Linien.',
    einlage: 'Eine matte, hellgraue Linie.',
    spiegelung: 'Ja, stark: schwarzes, poliertes Glas.',
    welle: 'Wo der Ring vorbeizieht, schiessen schwarze Glassplitter mit Regenbogenkanten aus dem Feld, und das Glas schimmert in den Farben von Regenbogenobsidian. Hinter dem Ring sinken die Splitter wieder ins Glas, der Schimmer verlischt, und das Feld ist wieder schwarz und spiegelglatt.',
    kosten: 'Alles berechnet, der Kiel ist ein Körper aus Ringen. Der ausgebogte Umriss deckt den heutigen Quader nicht ganz. Für die Welle rund 900 Splitter als Instanzen, in Ruhe unsichtbar.',
    hinweise: [['kern', 'Ausgebogter Umriss: Der Kernquader wird kleiner. Der Kiel hängt 1,6 m unter das Brett, bleibt aber im Umriss.']],
    vorbilder: [['Obsidian', WP('Obsidian')], ['Muscheliger Bruch', EN('Conchoidal_fracture')], ['Steinschlagen', EN('Knapping')], ['Tezcatlipoca, der «rauchende Spiegel»', WP('Tezcatlipoca')], ['Obsidian Cliff', EN('Obsidian_Cliff')]],
  },
  {
    id: 'basalt', datei: 'basalt', name: 'Basaltsäulen', art: 'Andere Form: Säulen',
    idee: 'Das Brett ist das Ende eines Bündels sechseckiger Basaltsäulen wie am Giant’s Causeway. Im Feld sind die Säulen eben abgeschliffen, man sieht nur ihre feinen Fugen. Im Rand stehen sie in Stufen, nach aussen tiefer, einzelne etwas höher. Unten hängen sie verschieden lang herab wie an der Decke der Fingalshöhle, und ihre Enden fangen das Licht der Lava.',
    raster: 'Feine, helle Linien über den Fugen.',
    einlage: 'Eine hellgraue Linie.',
    spiegelung: 'Leicht, der Basalt ist geschliffen.',
    welle: 'Im Ring heben sich Säulen des Felds eine Handbreit aus dem Boden, ihre Flanken glühen orange wie frisch erstarrter Basalt, und in den Fugen steigt Glut auf. Hinter dem Ring sinken die Säulen zurück, die Fugen verglimmen, und das Feld ist wieder eben.',
    kosten: 'Rund 940 Säulen als ein Körper mit Instanzen, das Muster im Feld ist berechnet. Für die Welle einige hundert Säulen mehr, in Ruhe unsichtbar.',
    hinweise: [['teile', 'Rund 940 Säulen (Instanzen, ein Zeichenaufruf). Auf dem Handy zu messen.'], ['kern', 'Stufiger Rand aus Sechsecken: Der Kernquader wird etwas kleiner.']],
    vorbilder: [['Giant’s Causeway', EN('Giant%27s_Causeway')], ['Fingalshöhle', WP('Fingalsh%C3%B6hle')], ['Säulenbasalt', WP('S%C3%A4ulenbasalt')], ['Svartifoss', EN('Svartifoss')], ['Devils Postpile', EN('Devils_Postpile_National_Monument')]],
  },
  {
    id: 'stricklava', datei: 'stricklava', name: 'Stricklava', art: 'Material: die Lava selbst',
    idee: 'Das Brett ist eine Scholle aus frisch erstarrter Pāhoehoe-Lava, wie sie auf einem Lavasee treibt. Das Feld ist glatte, glasige Haut mit silbrigem Schimmer. Im Rand legt sich die Lava in Stricke, Bögen quer zum Fluss, und zwischen den Bogengruppen glüht es noch. Der Umriss hat runde Zehen mit glühendem Saum, die Seiten sind Kruste, die unten in Glut übergeht.',
    raster: 'Feine Fugen, in denen es dunkelrot glimmt.',
    einlage: 'Eine silbrige Glaslinie.',
    spiegelung: 'Leicht, die glasige Haut glänzt.',
    welle: 'Wo der Ring vorbeizieht, bricht die Kruste auf: Glühende Lavablasen quellen hervor, Funken steigen auf, und Fugen und Risse flammen gelb. Hinter dem Ring erkalten die Blasen von Gelb über Dunkelrot zu Kruste und sinken ein, die Funken verglühen in der Luft.',
    kosten: 'Alles berechnet, die Seiten sind ein Körper aus Ringen. Für die Welle rund 900 Blasen und 700 Funken als Instanzen, in Ruhe unsichtbar.',
    hinweise: [['kern', 'Runder Umriss mit Zehen: Der Kernquader wird kleiner.']],
    vorbilder: [['Stricklava', WP('Stricklava')], ['Kīlauea', WP('K%C4%ABlauea')], ['Erta Ale', WP('Erta_Ale')], ['Halemaʻumaʻu', EN('Halema%CA%BBuma%CA%BBu')]],
  },
  {
    id: 'amboss', datei: 'amboss', name: 'Amboss des Vulkan', art: 'Gebaut: Werkzeug',
    idee: 'Das Brett ist die Bahn eines riesigen Ambosses, wie in der Schmiede des römischen Gottes Vulkan. Das Feld ist geschliffener Stahl mit feinen Schleifspuren. Im Rand liegen Hammerschläge, Zunder und etwas Rost, in einer Ecke Vierkant- und Rundloch. Darunter steht der Körper mit Taille und Füssen, auf dem Rand liegt ein glühender Stab.',
    raster: 'Anreisslinien, fein und blank.',
    einlage: 'Eine Linie aus Messing.',
    spiegelung: 'Ja, der Stahl ist geschliffen.',
    welle: 'Ein Hammerschlag: Ein weissglühender Ring läuft über die Bahn, aus ihm springen Funken hoch und nach aussen und verglühen im Flug von Gelbweiss zu Orange. Hinter dem Ring glüht der Stahl dunkelrot nach und kühlt wieder zu Grau ab.',
    kosten: 'Alles berechnet, Körper und Stab sind einfache Körper. Deckt den heutigen Quader wie heute. Für die Welle rund 1400 Funken als Instanzen, in Ruhe unsichtbar.',
    hinweise: [['ausblick', 'Ein echtes Horn ragte über den Umriss von 9,8 × 9,8 m hinaus, darum fehlt es hier.']],
    vorbilder: [['Amboss', WP('Amboss')], ['Velázquez: Apollo in der Schmiede des Vulkan', EN('Apollo_in_the_Forge_of_Vulcan')], ['Hephaistos', WP('Hephaistos')], ['Prinzessin Mononoke (Eisenhütte)', WP('Prinzessin_Mononoke')]],
  },
  {
    id: 'bims', datei: 'bims', name: 'Bimsfloss', art: 'Material: hell und leicht',
    idee: 'Das Brett ist ein Floss aus Bimsstein, dem Stein, der auf dem Wasser schwimmt. Es ist hell, leicht und porös: im Feld glatt geschliffen mit feinen Poren und Fasern, im Rand rau mit langgezogenen Blasen. Der Umriss ist rundlich, darunter liegt ein bauchiger Körper, den die Lava von unten warm anleuchtet.',
    raster: 'Feine, dunklere Rillen.',
    einlage: 'Eine dunkle Linie.',
    spiegelung: 'Keine, Bims ist matt.',
    welle: 'Aus den Poren steigen glühende Gasblasen, werden beim Steigen grösser und zerplatzen, und die Poren leuchten im Ring warm auf wie eine Laterne. Hinter dem Ring werden die Poren wieder dunkel, die letzten Blasen platzen über dem Brett.',
    kosten: 'Alles berechnet, der Körper ist ein Rumpf aus Ringen. Für die Welle rund 550 Blasen als Instanzen, in Ruhe unsichtbar.',
    hinweise: [['kern', 'Rundlicher Umriss: Der Kernquader wird kleiner.']],
    vorbilder: [['Bims', WP('Bims')], ['Bimssteinfloss', EN('Pumice_raft')], ['Lipari', WP('Lipari')], ['Laacher See', WP('Laacher_See')]],
  },
  {
    id: 'schwefel', datei: 'schwefel', name: 'Schwefelquelle', art: 'Farbe: Mineralien',
    idee: 'Das Brett ist ein Stück Dallol, des Vulkans in der Danakil-Senke. Das Feld ist eine blassgelbe Salzkruste mit feinen Polygonrücken. Im Rand liegen Sinterhügel in Rost, Ocker und Schwefelgelb mit hellen Terrassenkanten, in den Mulden Becken mit säuregrünem Wasser, dazu kleine Schwefelschlote. Die Seiten zeigen die bunten Schichten.',
    raster: 'Feine Linien in Ocker.',
    einlage: 'Ein Band aus Schwefelgelb.',
    spiegelung: 'Leicht, nur die Becken glänzen.',
    welle: 'Im Ring wachsen gelbe Schwefelkristalle aus der Kruste, und blaue Flammen züngeln an ihnen hoch wie nachts am Kawah Ijen; die Becken fangen das blaue Licht. Hinter dem Ring erlöschen die Flammen, die Kristalle zerfallen wieder, und die Becken werden grün.',
    kosten: 'Alles berechnet, die 13 Schlote sind einfache Körper. Deckt den heutigen Quader wie heute. Für die Welle rund 1100 Kristalle und 600 Flammen als Instanzen, in Ruhe unsichtbar.',
    hinweise: [],
    vorbilder: [['Dallol', WP('Dallol')], ['Kawah Ijen', WP('Kawah_Ijen')], ['Schwefel', WP('Schwefel')], ['Grand Prismatic Spring', EN('Grand_Prismatic_Spring')]],
  },
  {
    id: 'hoehlenstadt', datei: 'hoehlenstadt', name: 'Höhlenstadt', art: 'Bewohnt: in den Tuff gehauen',
    idee: 'Das Brett ist die Oberseite eines Tuffkegels, in den eine Stadt gehauen ist wie in Kappadokien, nur umgekehrt: Der Kegel hängt 3 m unter dem Brett, voller Fenster, Türen und Taubenlöcher, aus denen warmes Lampenlicht fällt. Oben ist der Tuff glatt mit Meisselspuren, in einer Ecke führt eine Treppe hinab, auf den Ecken stehen Feenkamine mit dunklem Hut.',
    raster: 'Gemeisselte Rillen.',
    einlage: 'Ein Band aus rotem Tuff.',
    spiegelung: 'Keine, Tuff ist matt.',
    welle: 'Wo der Ring vorbeizieht, steigen kleine Heissluftballone auf wie morgens über Göreme, und am Kegel geht Fenster für Fenster das Licht an. Hinter dem Ring treiben die Ballone höher und verblassen, die Fenster dimmen wieder auf ihr ruhiges Lampenlicht.',
    kosten: 'Alles berechnet, der Kegel ist ein Körper aus Ringen, Fenster und Türen sind gemalt. Die Feenkamine sind einfache Körper. Für die Welle 55 Ballone als Instanzen, in Ruhe unsichtbar.',
    hinweise: [['blender', 'Vertiefte Fenster, Balkone und Treppen am Kegel wären aus Blender deutlich schöner.']],
    vorbilder: [['Göreme', WP('G%C3%B6reme')], ['Kappadokien', WP('Kappadokien')], ['Derinkuyu', WP('Derinkuyu')], ['Uçhisar', WP('U%C3%A7hisar')], ['Das Schloss im Himmel', WP('Das_Schloss_im_Himmel')]],
  },
  {
    id: 'drachenhort', datei: 'drachenhort', name: 'Drachenhort', art: 'Märchen: Schatz eines Drachen',
    idee: 'Das Brett ist der Schatz eines Drachen, der es mit seinen Krallen festhält. Das Feld ist eine dunkle Bronzeplatte mit eingeprägten Drachenschuppen, im Rand liegen Haufen aus Goldmünzen. Die Seiten sind Schuppenhaut, und an jeder Ecke greifen drei Krallen von unten über die Kante.',
    raster: 'Goldene Linien.',
    einlage: 'Eine breite Goldlinie.',
    spiegelung: 'Ja, die Bronze glänzt.',
    welle: 'Wo der Ring vorbeizieht, springen Goldmünzen aus der Platte und drehen sich funkelnd in der Luft, die Ränder der Schuppen leuchten golden. Hinter dem Ring fallen die Münzen zurück und verschwinden im Hort, das Glühen der Schuppen klingt ab.',
    kosten: 'Platte, Schuppen und Krallen berechnet, die Münzen sind rund 2200 Instanzen. Für die Welle rund 1500 springende Münzen als Instanzen, in Ruhe unsichtbar.',
    hinweise: [['teile', 'Rund 2200 Münzen (Instanzen, ein Zeichenaufruf). Auf dem Handy zu messen.'], ['blender', 'Krallen und Pranken wären aus Blender deutlich schöner.'], ['kern', 'Die Platte ist nur 9,24 m breit, damit die Krallen im Umriss bleiben: Der Kernquader wird kleiner.']],
    vorbilder: [['Fafnir', WP('Fafnir')], ['Nibelungenhort', WP('Nibelungenhort')], ['Smaug', WP('Smaug')], ['Beowulf', WP('Beowulf')]],
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

const html = W(`<title>Vulkanbretter</title>
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
    --wasser: #241a17;    /* Rand um die Aufsicht, wie die Kruste des Lavasees ums Brett (beide Themen) */
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
      <p class="eyebrow">Prisma · Ein Brett je Himmel · Vulkan</p>
      <h1>Vulkanbretter</h1>
      <p class="lead">Acht Richtungen für das Brett über dem Lavasee am neuen Krater, bei Nacht und im Licht der Glut:
        Stoffe des Vulkans (Obsidian, Stricklava, Bims), andere Formen (Basaltsäulen, ein hängender Tuffkegel mit einer
        Stadt darin), etwas Gebautes (ein Amboss), die Farben der Schwefelquellen von Dallol und ein Drachenhort. Beim
        Lösen passiert auf jedem Brett etwas Eigenes, das vierte Bild jeder Karte zeigt es: Splitter, Säulen, Lavablasen,
        Funken, Gasblasen, Kristalle, Ballone oder Münzen. Jedes Bild stammt aus dem Spiel, dasselbe Level, das Brett zur
        Laufzeit eingesetzt. Wähle eine Richtung, gern mit Änderungswünschen.</p>
    </div>
    <section class="grenzen" aria-labelledby="grenzen-titel">
      <h2 id="grenzen-titel">Bleibt in jeder Richtung gleich</h2>
      <ul>
        <li>Das 7×7-Feld: eben, <span class="mass">8,4 × 8,4 m</span>, an derselben Stelle.</li>
        <li>Form frei innerhalb von <span class="mass">9,8 × 9,8 m</span>; das Brett schwebt rund <span class="mass">9 m</span> über dem Lavasee.</li>
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

  <p class="fuss">Bilder: Spiel im Stand <span class="mass">main 504adbb</span> (neuer Krater), <span class="mass">?sky=volcano</span>,
    Desktop <span class="mass">1440 × 900</span>, Chrome mit Grafikkarte. Die Bretter sind zur Laufzeit gebaut
    (Texturen im Browser berechnet, Säulen, Münzen und Kegel als einfache Körper), sie zeigen die Richtung, nicht die
    fertige Gestaltung. Glühende Farben bleiben unter der Bloom-Schwelle, nur die Lichtwelle darf aufleuchten. Die
    Skripte, die die Bretter im Spiel bauen, liegen unter <span class="mass">katalog-vulkan/bretter/</span>.</p>
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
