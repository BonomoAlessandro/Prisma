// Baut die Vorschauseite «Wüstenbretter» (zweite Runde, 8 völlig neue Richtungen): node seite.mjs → index.html
// Bilder liegen in bilder/ (aus dem Spiel, Stand main 6f322ce, ?sky=desert, Brett zur Laufzeit eingesetzt).
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
  id: 'heute', datei: 'stein', name: 'Steinbrett in der Wüste', art: 'Heute', vergleich: true,
  idee: 'Das heutige Brett unter dem Wüstenhimmel: dunkler Schiefer mit eingravierten Rasterlinien, heller Einlegelinie, polierten Seiten und Metallkante.',
  raster: 'Eingraviert, fein.', einlage: 'Helle, matte Linie knapp ausserhalb des Felds.', spiegelung: 'Ja, poliert.',
  welle: 'Ein heller Ring in der Mischfarbe der Ziele läuft von der Mitte bis über die Ecken.',
  hinweise: [], vorbilder: [],
};
const WP = (t) => `https://de.wikipedia.org/wiki/${t}`;
const EN = (t) => `https://en.wikipedia.org/wiki/${t}`;

const karten = [
  {
    id: 'teppich', datei: 'teppich', name: 'Fliegender Kelim', art: 'Andere Form: gewebt',
    idee: 'Das Brett ist ein dicker, gewebter Teppich, der über den Dünen schwebt. Das Feld ist ockerfarben mit Abrash, den leichten Farbwechseln handgefärbter Wolle. Im Rand laufen rote Bordüren mit Rauten und Zickzack, an zwei Seiten hängen Fransen.',
    raster: 'Eingewebte Linien in Indigo.',
    einlage: 'Entfällt, die innere Bordüre ersetzt sie.',
    spiegelung: 'Keine, Wolle spiegelt nicht.',
    welle: 'Die Goldfäden in den Rauten leuchten auf, wo der Ring vorbeizieht.',
    kosten: 'Alles berechnet, Fransen als einfache Körper. Der Teppich ist nur 4 cm dick, statt 38 cm wie heute.',
    hinweise: [['kern', 'Nur 4 cm dick: Der Himmel darf darunter nicht mehr ausgespart werden, der Kernquader wird flach.']],
    vorbilder: [['Kelim', WP('Kelim')], ['Fliegender Teppich', WP('Fliegender_Teppich')], ['Tausendundeine Nacht', WP('Tausendundeine_Nacht')], ['Sable', EN('Sable_(video_game)')]],
  },
  {
    id: 'lehm', datei: 'lehm', name: 'Lehmterrasse', art: 'Gebaut: Lehmarchitektur',
    idee: 'Das Brett ist das Dach eines Lehmbaus wie die Moschee von Djenné. Das Feld ist glatter Lehmputz, im Rand schauen Ziegel hervor, wo der Putz abgeplatzt ist. Unter einem Gesims steht eine eingezogene Lehmwand, aus der Balken aus Palmholz ragen. Auf den Ecken stehen Spitztürmchen mit einem Straussenei.',
    raster: 'Feine Rillen im Putz.',
    einlage: 'Eine helle Kalklinie.',
    spiegelung: 'Keine, Lehm ist matt.',
    welle: 'Warmes Abendlicht läuft in den Rillen des Rasters mit.',
    kosten: 'Alles berechnet, Balken und Türmchen als einfache Körper. Deckt das Feld wie heute.',
    hinweise: [['teile', 'Palmholzbalken rundum und vier Türmchen. Wenige, aber auf dem Handy zu messen.']],
    vorbilder: [['Grosse Moschee von Djenné', WP('Gro%C3%9Fe_Moschee_von_Djenn%C3%A9')], ['Aït-Ben-Haddou', WP('A%C3%AFt-Ben-Haddou')], ['Sudano-sahelische Architektur', EN('Sudano-Sahelian_architecture')], ['Lehmbau', WP('Lehmbau')]],
  },
  {
    id: 'geode', datei: 'geode', name: 'Geode', art: 'Andere Form: Kristall',
    idee: 'Das Brett ist eine aufgeschnittene Geode. Das Feld ist eine polierte Achatscheibe mit Bändern in Apricot, Lila und Weiss um die Mitte. Im Rand steht ein Kranz aus Spitzen von Amethyst und Quarz, die Seiten sind die raue, dunkle Aussenhaut.',
    raster: 'Fein eingeschliffen.',
    einlage: 'Eine dünne helle Linie, wo der Achat in die Kristalle übergeht.',
    spiegelung: 'Ja, die Scheibe ist poliert.',
    welle: 'Der Ring folgt den Bändern des Achats, jedes Band leuchtet kurz in seiner Farbe auf.',
    kosten: 'Achat berechnet, die Kristalle sind rund 2600 kleine Körper.',
    hinweise: [['teile', 'Rund 2600 Kristallspitzen. Auf dem Handy zu messen, eventuell weniger und grösser.']],
    vorbilder: [['Geode', WP('Geode')], ['Achat', WP('Achat')], ['Amethyst', WP('Amethyst')]],
  },
  {
    id: 'yardang', datei: 'yardang', name: 'Yardang', art: 'Andere Form: vom Wind geformt',
    idee: 'Das Brett ist ein Fels, den der Wind geformt hat. Der Umriss ist rund, die Oberseite glatt geschliffen, im Rand laufen Windrillen. Darunter hängt ein Kiel wie ein umgedrehter Bootsrumpf, die Flanken sind gerillt und gebändert wie bei «The Wave» in Arizona.',
    raster: 'Fein eingeritzt.',
    einlage: 'Eine helle Linie.',
    spiegelung: 'Kaum, der Fels ist matt geschliffen.',
    welle: 'Wie eine Böe: Der Ring ist in Windrichtung gestreckt und zieht Streifen aus Licht hinter sich her.',
    kosten: 'Alles berechnet, der Kiel ist ein Körper aus Ringen. Der runde Umriss deckt die Ecken des heutigen Quaders nicht.',
    hinweise: [['kern', 'Runder Umriss: Der Kernquader wird kleiner. Der Kiel ragt unter das heutige Brett, bleibt aber im Umriss.']],
    vorbilder: [['Yardang', WP('Yardang')], ['The Wave (Arizona)', EN('The_Wave_(Arizona)')], ['Journey', EN('Journey_(2012_video_game)')]],
  },
  {
    id: 'ruine', datei: 'ruine', name: 'Tempelboden', art: 'Gefunden: Bruchstück einer Ruine',
    idee: 'Das Brett ist ein Bruchstück aus einem Tempel, das die Wüste freigegeben hat. Das Feld ist polierter Kalkstein mit einem Raster aus eingelegtem Lapislazuli. Im Rand liegt die blaue Sternendecke mit goldenen Sternen wie in den Königsgräbern, halb im Sand. Eine Ecke ist abgebrochen, auf einer anderen liegt eine Säulentrommel.',
    raster: 'Bänder aus Lapislazuli mit Pyritflecken.',
    einlage: 'Gold.',
    spiegelung: 'Leicht, der Kalkstein ist poliert.',
    welle: 'Das Gold der Sterne und der Einlegelinie blitzt auf, wo der Ring vorbeizieht.',
    kosten: 'Alles berechnet, die Säulentrommel ist ein einfacher Körper. Die abgebrochene Ecke fehlt im Quader.',
    hinweise: [['kern', 'Abgebrochene Ecke: Der Kernquader wird dort kleiner.']],
    vorbilder: [['Dendera', WP('Dendera')], ['Tal der Könige', WP('Tal_der_K%C3%B6nige')], ['Lapislazuli', WP('Lapislazuli')], ['Prince of Persia: The Sands of Time', EN('Prince_of_Persia:_The_Sands_of_Time')]],
  },
  {
    id: 'playa', datei: 'playa', name: 'Playa', art: 'Material: getrocknete Salztonebene',
    idee: 'Das Brett ist ein Stück einer getrockneten Salztonebene wie das Deadvlei. Im Rand liegen grosse Schollen mit tiefen Trockenrissen und aufgebogenen hellen Kanten, im Feld nur feine Haarrisse. Drei Wandersteine wie auf der Racetrack Playa haben lange Spuren in den Rand gezogen.',
    raster: 'Feine, helle Linien.',
    einlage: 'Entfällt, die Schollen beginnen am Feld.',
    spiegelung: 'Keine, der Ton ist matt.',
    welle: 'Warmes Licht quillt aus den Rissen, wo der Ring vorbeizieht.',
    kosten: 'Alles berechnet, die drei Wandersteine sind einfache Körper. Deckt das Feld wie heute.',
    hinweise: [],
    vorbilder: [['Deadvlei', WP('Deadvlei')], ['Racetrack Playa', WP('Racetrack_Playa')], ['Wandernde Steine', EN('Sailing_stones')], ['Trockenriss', WP('Trockenriss')]],
  },
  {
    id: 'meteor', datei: 'meteor', name: 'Meteoreisen', art: 'Material: vom Himmel gefallen',
    idee: 'Das Brett ist eine geätzte Scheibe aus einem Eisenmeteoriten wie dem Gibeon aus Namibia. Im Feld liegt ruhig das Widmanstätten-Muster, der Rand ist Schmelzkruste mit Daumendellen und Rost. Es bleibt dunkel wie das heutige Brett und stammt aus dem Himmel, zu dem das Licht unterwegs ist.',
    raster: 'Fein, hell.',
    einlage: 'Ein blanker Streifen.',
    spiegelung: 'Ja, das geätzte Eisen glänzt.',
    welle: 'Eine Hitzefront, hinter der das Eisen in Anlauffarben steht: Strohgelb, Bronze, Violett, Blau.',
    kosten: 'Alles berechnet. Deckt das Feld wie heute.',
    hinweise: [],
    vorbilder: [['Gibeon (Meteorit)', WP('Gibeon_(Meteorit)')], ['Widmanstätten-Struktur', WP('Widmanst%C3%A4tten-Struktur')], ['Anlauffarbe', WP('Anlauffarbe')]],
  },
  {
    id: 'mandala', datei: 'mandala', name: 'Sandmandala', art: 'Gemalt: farbiger Sand',
    idee: 'Das Feld ist glatter, feiner Sand in den weichen Tönen der Dünen. Im Rand liegt ein Mandala aus farbigem Sand mit Bändern, Dreiecken und einem Tor in der Mitte jeder Seite. Die Seiten sind wie eine gemalte Düne von Apricot zu Rosa-Lila, oben mit einer dunklen Tuschelinie.',
    raster: 'Dünne Linien aus rosabraunem Sand, leicht gestreut.',
    einlage: 'Ein Band aus weissem Sand.',
    spiegelung: 'Keine.',
    welle: 'Die Farben des Mandalas leuchten im Ring auf, dahinter verweht es zu blassem Sand und kommt danach zurück.',
    kosten: 'Alles berechnet. Deckt das Feld wie heute.',
    hinweise: [],
    vorbilder: [['Sandmandala', EN('Sand_mandala')], ['Mandala', WP('Mandala')], ['Kolam', EN('Kolam')]],
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

const html = W(`<title>Wüstenbretter</title>
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
      <p class="eyebrow">Prisma · Ein Brett je Himmel · Wüste, zweite Runde</p>
      <h1>Wüstenbretter</h1>
      <p class="lead">Acht Richtungen, die nichts mit dem Strand zu tun haben: andere Formen (ein gewebter Teppich,
        eine aufgeschnittene Geode, ein vom Wind geformter Fels), gebaute und gefundene Bretter (ein Lehmdach, ein
        Tempelboden), andere Stoffe (Salzton, Meteoreisen) und ein gemaltes Sandmandala. Jedes Bild stammt aus dem Spiel,
        dasselbe Level, das Brett zur Laufzeit eingesetzt. Wähle eine Richtung, gern mit Änderungswünschen.</p>
    </div>
    <section class="grenzen" aria-labelledby="grenzen-titel">
      <h2 id="grenzen-titel">Bleibt in jeder Richtung gleich</h2>
      <ul>
        <li>Das 7×7-Feld: eben, <span class="mass">8,4 × 8,4 m</span>, an derselben Stelle.</li>
        <li>Form frei innerhalb von <span class="mass">9,8 × 9,8 m</span>; das Brett schwebt <span class="mass">4 m</span> über dem Sand.</li>
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

  <p class="fuss">Bilder: Spiel im Stand <span class="mass">main 6f322ce</span>, <span class="mass">?sky=desert</span>,
    Desktop <span class="mass">1440 × 900</span>, Chrome mit Grafikkarte. Die Bretter sind zur Laufzeit gebaut
    (Texturen im Browser berechnet, Bewuchs als einfache Körper), sie zeigen die Richtung, nicht die fertige Gestaltung.
    Die Skripte, die die Bretter im Spiel bauen, liegen unter <span class="mass">katalog-wueste/bretter/</span>. Die erste,
    verworfene Runde mit der Rinnen-Idee liegt unter <span class="mass">katalog-wueste-rinne/</span>.</p>
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
