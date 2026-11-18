// Übersetzungsschicht (Ticket 07 von .scratch/umbau/): die Sprachdateien src/texte/<kürzel>.json, der Kern
// src/texte/uebersetzung.js und der Code der Oberfläche. Geprüft wird:
// - Jede Sprachdatei hat genau die Schlüssel von de.json, je Blatt dieselbe Art (Text oder Text je Gerät), und jeder
//   Platzhalter des deutschen Texts steht auch in der Übersetzung (und keiner mehr). de.json steht in der festen Form
//   (tools/texte.mjs), damit Werkzeuge einen Bereich neu schreiben können, ohne den Rest zu ändern.
// - Jeder Schlüssel, den der Code nennt (t('…'), data-t … in index.html, die Schritte der Übungen, NEBENBEI), steht in
//   de.json, und jeder Schlüssel von de.json wird genannt (Schlüssel aus Templates wie `welt.${id}` als Muster); die
//   Titel der Level sind genau die Level im Spiel.
// - Die Regeln der Führung je Sprache und Gerät: ein Schritt 3–18 Wörter und höchstens 105 Zeichen, ein oder zwei
//   Sätze, nur bekannte Platzhalter; ein Hinweis nebenbei höchstens 16 Wörter (bis Ticket 07 in tests/logic.test.mjs).
// - Kein Text, den der Spieler sieht, steht mehr fest im Code der Oberfläche (index.html, src/main.ts, src/seite/,
//   src/texte/sprache.js): Ein String (ohne Kommentare, ohne den Schlüssel in t(…)) gilt als Text für den Spieler, wenn
//   er ein Wort mit Umlaut oder ß enthält, ein grossgeschriebenes Wort der Texte einer Sprache oder zwei Wörter der
//   Texte einer Sprache hintereinander (seit Ticket 08 auch die englischen, etwa «Level solved»); in HTML zählen Text
//   und die Attribute aria-label, title, alt, placeholder. Ausgenommen sind Meldungen an die Konsole und Fehler
//   (console.…, new Error) und die bewussten Ausnahmen in AUSNAHMEN, je mit Grund.
// - Seit Ticket 08: en.json ohne deutsche Reste (kein Umlaut, kein Text gleich dem deutschen ausser Namen), die Texte der
//   Geschichte und der Führung ohne die Muster, die in PLAN 1a.2 «zu stark nach KI» wirkten (Gedankenstrich,
//   Doppelpunkt), je Sprache.
// - Der Kern: Nachschlagen, Rückfall auf Deutsch, Platzhalter, Texte je Gerät, die Wahl der Sprache.
// Läuft in Node ohne Browser (etwa 2 s): node tests/texte.test.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { root } from '../tools/spielserver.mjs';
import { alsText, kuerzel, sprachen, sprachText } from '../tools/texte.mjs';
import * as L from '../src/logik.js';
import {
  blaetter, istGeraeteText, nachschlagen, platzhalter, spracheWaehlen, titelVon, uebersetzer,
} from '../src/texte/uebersetzung.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

const SPRACHEN = sprachen(), DE = SPRACHEN.de, DE_BLAETTER = blaetter(DE);
const lies = (pfad) => readFileSync(join(root, pfad), 'utf8');
const dateien = (ordner) => readdirSync(join(root, ordner), { withFileTypes: true }).flatMap((e) =>
  (e.isDirectory() ? dateien(`${ordner}/${e.name}`) : /\.(js|ts)$/.test(e.name) && !e.name.endsWith('.d.ts')
    ? [`${ordner}/${e.name}`] : [])).sort();
const parse = (pfad, text) => ts.createSourceFile(pfad, text, ts.ScriptTarget.Latest, true,
  pfad.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
/** Varianten eines Blatts: [Text] oder [touch, maus]. */
const varianten = (w) => (istGeraeteText(w) ? [w.touch, w.maus] : [w]);

console.log('Sprachdateien');
test('Es gibt de.json; jede Sprache nennt ihren Namen (sprache.name)', () => {
  assert.ok(kuerzel().includes('de'));
  for (const [k, texte] of Object.entries(SPRACHEN)) assert.equal(typeof nachschlagen(texte, 'sprache.name'), 'string', k);
});
test('Jedes Blatt ist ein Text oder ein Text je Gerät { touch, maus }', () => {
  for (const [k, texte] of Object.entries(SPRACHEN)) {
    for (const [s, w] of blaetter(texte)) assert.ok(typeof w === 'string' || istGeraeteText(w), `${k}: ${s}`);
  }
});
test('Jede Sprachdatei hat genau die Schlüssel von de.json, je Blatt dieselbe Art', () => {
  for (const [k, texte] of Object.entries(SPRACHEN)) {
    const b = blaetter(texte);
    assert.deepEqual([...b.keys()].filter((s) => !DE_BLAETTER.has(s)), [], `${k}: Schlüssel, die de.json nicht hat`);
    assert.deepEqual([...DE_BLAETTER.keys()].filter((s) => !b.has(s)), [], `${k}: fehlende Schlüssel`);
    for (const [s, w] of b) assert.equal(istGeraeteText(w), istGeraeteText(DE_BLAETTER.get(s)), `${k}: Art von ${s}`);
  }
});
test('Jeder Platzhalter des deutschen Texts steht auch in der Übersetzung, und keiner mehr', () => {
  for (const [k, texte] of Object.entries(SPRACHEN)) {
    for (const [s, w] of blaetter(texte)) {
      const de = DE_BLAETTER.get(s), soll = new Set(varianten(de).flatMap(platzhalter));
      for (const v of varianten(w)) assert.deepEqual(new Set(platzhalter(v)), soll, `${k}: ${s} «${v}»`);
    }
  }
});
test('Kein Text ist leer; Platzhalter sind Werte oder Wörter je Gerät (geraet)', () => {
  for (const [k, texte] of Object.entries(SPRACHEN)) {
    for (const [s, w] of blaetter(texte)) for (const v of varianten(w)) assert.ok(v.trim(), `${k}: ${s} leer`);
  }
  for (const s of Object.keys(DE.geraet)) assert.ok(istGeraeteText(DE.geraet[s]), `geraet.${s}`);
});
test('de.json steht in der festen Form (tools/texte.mjs, alsText)', () => {
  const text = sprachText('de');
  assert.equal(text, alsText(DE, text));
});

console.log('Schlüssel im Code');
/** Code der Oberfläche (Suche nach festen Texten) und alle Module (Schlüssel). */
const OBERFLAECHE = ['src/main.ts', 'src/texte/sprache.js', ...dateien('src/seite')];
const MODULE = dateien('src');
/** Schlüssel, die der Code nennt: fest (t('a.b')) und als Muster (t(`welt.${id}`), t(x ? 'a' : 'b') je Zweig). */
function genannteSchluessel() {
  const fest = new Set(), muster = [];
  const schluessel = (n, sf) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) fest.add(n.text);
    else if (ts.isTemplateExpression(n)) {
      const teile = [n.head.text, ...n.templateSpans.map((x) => x.literal.text)];
      muster.push(new RegExp(`^${teile.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^]*')}$`));
    } else if (ts.isConditionalExpression(n)) { schluessel(n.whenTrue, sf); schluessel(n.whenFalse, sf); }
    else if (ts.isParenthesizedExpression(n)) schluessel(n.expression, sf);
  };
  for (const pfad of MODULE) {
    const sf = parse(pfad, lies(pfad));
    const geh = (n) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 't' && n.arguments.length) {
        schluessel(n.arguments[0], sf);
      }
      ts.forEachChild(n, geh);
    };
    geh(sf);
  }
  for (const m of lies('index.html').matchAll(/\bdata-t(?:-[a-z-]+)?="([^"]+)"/g)) fest.add(m[1]);
  for (const l of L.LEVELS.filter((x) => x.tutorial)) for (const s of l.schritte) fest.add(s.text);
  for (const n of Object.values(L.NEBENBEI)) fest.add(n.text);
  return { fest, muster };
}
const { fest: FEST, muster: MUSTER } = genannteSchluessel();
test('Jeder Schlüssel, den der Code nennt, steht in de.json', () => {
  assert.ok(FEST.size > 100 && MUSTER.length > 5, `${FEST.size} feste Schlüssel, ${MUSTER.length} Muster`);
  assert.deepEqual([...FEST].filter((s) => nachschlagen(DE, s) === undefined), []);
  assert.deepEqual(MUSTER.filter((m) => ![...DE_BLAETTER.keys()].some((s) => m.test(s))).map(String), []);
});
test('Jeder Schlüssel von de.json wird genannt (Titel: genau die Level im Spiel; Wörter je Gerät: geraet)', () => {
  const ungenutzt = [...DE_BLAETTER.keys()].filter((s) => !s.startsWith('titel.') && !s.startsWith('geraet.')
    && !s.startsWith('sprache.') && !FEST.has(s) && !MUSTER.some((m) => m.test(s)));
  assert.deepEqual(ungenutzt, []);
  assert.deepEqual(Object.keys(DE.titel), L.LEVELS.map((l) => l.name));
  assert.ok(Object.values(DE.titel).every((x) => typeof x === 'string' && x.trim()), 'jeder Titel ein Text');
});

console.log('Führung je Sprache (Regeln aus tests/logic.test.mjs, bis Ticket 07 nur Deutsch)');
const wort = (x) => x.split(/\s+/).filter(Boolean).length;
// seit 13.11.2026 (Wunsch des Nutzers, natürlichere Texte) ein oder zwei kurze Sätze statt genau einem
test('Schritte: je ein oder zwei kurze Sätze (3–18 Wörter, höchstens 105 Zeichen), auf beiden Geräten', () => {
  for (const [k, texte] of Object.entries(SPRACHEN)) {
    const t = uebersetzer(SPRACHEN, k);
    for (const l of L.LEVELS.filter((x) => x.tutorial)) {
      for (const s of l.schritte) {
        assert.ok(nachschlagen(texte, s.text) !== undefined, `${k}: ${s.text} fehlt`);
        for (const touch of [true, false]) {
          const x = t(s.text, { touch });
          assert.ok(wort(x) >= 3 && wort(x) <= 18 && x.length <= 105, `${k}, ${l.name}: «${x}» (${wort(x)} Wörter)`);
          assert.ok(/[.!?]$/.test(x) && (x.match(/[.!?] \S/g) ?? []).length <= 1, `${k}, ${l.name}: höchstens zwei Sätze «${x}»`);
          assert.equal(x.match(/[{}]/g), null, `${k}, ${l.name}: unbekannter Platzhalter «${x}»`);
        }
      }
    }
  }
});
test('Hinweise nebenbei: höchstens 16 Wörter, ohne Platzhalter, auf beiden Geräten', () => {
  for (const k of Object.keys(SPRACHEN)) {
    const t = uebersetzer(SPRACHEN, k);
    for (const [n, { text }] of Object.entries(L.NEBENBEI)) {
      for (const touch of [true, false]) {
        const x = t(text, { touch });
        assert.ok(x !== text && wort(x) <= 16 && !/[{}]/.test(x), `${k}, ${n}: «${x}»`);
      }
    }
  }
});

console.log('Keine festen Texte im Code der Oberfläche');
/**
 * Bewusste Ausnahmen: Datei → Texte, die stehen bleiben dürfen, mit Grund. Gilt je genau dieser Text in dieser Datei.
 */
const AUSNAHMEN = {
  'index.html': {
    // Name des Spiels (Marke, in jeder Sprache gleich)
    'Prisma': 'Name des Spiels', 'PRISMA': 'Name des Spiels',
  },
  'src/seite/oberflaeche/menue.js': { 'Prisma': 'Name des Spiels',
    // Adresse der Datenschutzerklärung (Link in der Android-App, Ticket 10), kein Text
    'https://bonomoalessandro.github.io/Prisma/datenschutz.html': 'Adresse' },
  // Grad als Kennung (Feld grad der Level, Schlüssel des Speicherstands), kein Text
  '*': { 'sehr schwer': 'Kennung des Grads' },
  // Was die Schleife noch bewegt (pending): Warnung des Sicherheitsnetzes an die Konsole, kein Text für den Spieler
  'src/seite/szene.js': {
    'Geschichte (Tween, Träger, Überblenden)': 'Warnung an die Konsole', 'Überspringen': 'dto.',
    'Überspringen (Pause)': 'dto.', 'Wagen am Himmel (Menü)': 'dto.', 'Drehen oder Puls': 'dto.', 'Himmel': 'dto.',
    'Häppchen': 'Protokoll der Arbeit', 'Programm noch nicht fertig': 'Protokoll der Arbeit',
  },
  // Messwerkzeug und Leistungsanzeige (?perf, Taste F): nur für Entwickler
  'src/seite/leistung.js': { '*': 'Messwerkzeug für Entwickler' },
  'src/seite/himmel/skybox.js': { 'aus dem Vorrat': 'Protokoll der Arbeit (arbeit.merke)' },
};
const erlaubt = (pfad, text) => {
  const a = AUSNAHMEN[pfad] ?? {};
  return Object.hasOwn(a, '*') || Object.hasOwn(a, text) || Object.hasOwn(AUSNAHMEN['*'], text);
};
/** Wörter der Texte aller Sprachen (ohne Titel und Platzhalter), für die Suche. */
const WOERTER = new Set(Object.values(SPRACHEN).flatMap((texte) => [...blaetter(texte)])
  .filter(([s]) => !s.startsWith('titel.')).flatMap(([, w]) => varianten(w))
  .flatMap((x) => x.replace(/\{[^{}]*\}/g, ' ').match(/[\p{L}]{3,}/gu) ?? []));
const KLEIN = new Set([...WOERTER].map((x) => x.toLowerCase()));
/** Sieht der Text aus wie Text für den Spieler, auf Deutsch oder in einer anderen Sprache? (siehe Kopf) */
function deutsch(text) {
  const w = text.match(/[\p{L}\p{N}_-]+/gu) ?? [];
  if (w.some((x) => /[äöüÄÖÜß]/.test(x))) return true;
  if (w.some((x) => /^\p{Lu}\p{Ll}{2,}$/u.test(x) && WOERTER.has(x))) return true;
  for (let i = 1; i < w.length; i++) if (KLEIN.has(w[i - 1].toLowerCase()) && KLEIN.has(w[i].toLowerCase())) return true;
  return false;
}
/** Sichtbare Teile von HTML: Text zwischen Tags und die Attribute, die man liest oder hört. */
const htmlTeile = (html) => [
  ...html.replace(/<(script|style)\b[^]*?<\/\1>/gi, '').replace(/<!--[^]*?-->/g, '').split(/<[^>]*>/),
  ...[...html.matchAll(/\s(?:aria-label|title|alt|placeholder|content)="([^"]*)"/g)].map((m) => m[1]),
].map((x) => x.trim()).filter(Boolean);
/** Code für die Grafikkarte (GLSL, auch Stücke davon mit Kommentaren): kein Text. */
const SHADER = /\b(?:void main|gl_\w+|uniform|varying|attribute|texture2D|vec[234])\b|#(?:include|define|if)\b/;
/** Aufrufe, deren Strings Protokoll für Entwickler sind: Konsole, Fehler, Protokoll der Arbeit, Symbole. */
const PROTOKOLL = /^(?:console\.\w+|Error|Symbol|arbeit\.\w+|sliced|freigabe\.add)$/;
/** Feste Texte im Code: [{ pfad, zeile, text }]. */
function festeTexte(pfad, text) {
  const funde = [], sf = parse(pfad, text);
  const geh = (n) => {
    if (ts.isCallExpression(n)) {
      const f = n.expression.getText(sf);
      if (PROTOKOLL.test(f)) return;
      if (f === 't' && n.arguments.length) { n.arguments.slice(1).forEach(geh); return; } // der Schlüssel
    }
    if (ts.isNewExpression(n) && /Error$/.test(n.expression.getText(sf))) return;
    // Name eines Stücks Arbeit (was) und Fehler eines Workers (err) gehen ins Protokoll
    if (ts.isPropertyAssignment(n) && ['was', 'err'].includes(n.name.getText(sf))) return;
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    let s = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) s = n.text;
    else if (ts.isTemplateExpression(n)) s = [n.head.text, ...n.templateSpans.map((x) => x.literal.text)].join(' ');
    if (s !== null && !SHADER.test(s)) {
      const teile = /<[a-z][^>]*>/i.test(s) ? htmlTeile(s) : [s];
      for (const x of teile) {
        if (deutsch(x) && !erlaubt(pfad, x.trim())) {
          funde.push({ pfad, zeile: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, text: x.trim() });
        }
      }
    }
    ts.forEachChild(n, geh);
  };
  geh(sf);
  return funde;
}
test('Die Suche findet deutsche Texte und lässt Kennungen, Klassen und Schlüssel stehen (Gegenprobe)', () => {
  const p = 'src/seite/probe.js';
  const code = [
    "a.textContent = 'Level gelöst';", "b.title = 'Weiter';", "c(`Ziele ${n} / ${m}`);",
    "d.innerHTML = `<button aria-label=\"Menü\">x</button><span>noch nicht begonnen</span>`;",
    "if (s === 'begonnen' || s === 'weiter') e.classList.add('menue-weiter');", "f(t('menue.aktion.weiter'));",
    "console.warn('Himmel fehlt');", "throw new Error('Grad unbekannt');", "g = 'sehr schwer';",
  ].join('\n');
  assert.deepEqual(festeTexte(p, code).map((f) => f.text),
    ['Level gelöst', 'Weiter', 'Ziele   /', 'noch nicht begonnen', 'Menü']);
});
test('Die Suche findet auch englische Texte (Gegenprobe, Ticket 08)', () => {
  assert.ok(SPRACHEN.en, 'en.json fehlt');
  const p = 'src/seite/probe.js';
  const code = [
    "a.textContent = 'Level solved';", "b.title = 'Restart level (R)';", "c.innerHTML = `<span>Tap to start</span>`;",
    "d.setAttribute('aria-label', 'Next world');", "if (k === 'next' || k === 'menu') e.classList.add('band-next');",
    "f(t('menue.aktion.weiter'));", "console.warn('Sky is missing');",
  ].join('\n');
  assert.deepEqual(festeTexte(p, code).map((f) => f.text),
    ['Level solved', 'Restart level (R)', 'Tap to start', 'Next world']);
});
test('Kein deutscher Text im Code der Oberfläche ausser über t() (index.html, src/main.ts, src/seite/, '
  + 'src/texte/sprache.js; mit Liste bewusster Ausnahmen)', () => {
  const funde = OBERFLAECHE.flatMap((p) => festeTexte(p, lies(p)));
  const html = lies('index.html').replace(/<script\b[^]*?<\/script>/gi, '');
  // index.html: Seitentitel und Beschreibung stehen für Suchmaschinen und ohne JavaScript auf Deutsch da, aber nur mit
  // ihrem Schlüssel und genau wie in de.json (unten); sonst nichts
  const kopf = html.replace(/<title data-t="seite\.titel">[^<]*<\/title>/, '')
    .replace(/<meta name="description" content="[^"]*" data-t-content="seite\.beschreibung">/, '');
  for (const x of htmlTeile(kopf)) if (deutsch(x) && !erlaubt('index.html', x)) funde.push({ pfad: 'index.html', text: x });
  assert.deepEqual(funde.map((f) => `${f.pfad}${f.zeile ? `:${f.zeile}` : ''} «${f.text}»`), []);
});
test('index.html: Seitentitel und Beschreibung wie in de.json; sonst kein Element mit Schlüssel hat Text', () => {
  const html = lies('index.html');
  assert.equal(html.match(/<title data-t="seite\.titel">([^<]*)<\/title>/)?.[1], DE.seite.titel);
  assert.equal(html.match(/<meta name="description" content="([^"]*)" data-t-content="seite\.beschreibung">/)?.[1],
    DE.seite.beschreibung);
  const mitText = [...html.matchAll(/<(\w+)[^>]*\sdata-t="([^"]+)"[^>]*>([^<]*)</g)]
    .filter((m) => m[1] !== 'title' && m[3].trim()).map((m) => m[2]);
  assert.deepEqual(mitText, []);
});

console.log('Englisch und Ton (Ticket 08)');
/** Texte, die sich vorlesen: die Geschichte (ohne Knöpfe und Titel) und die Führung. */
const ERZAEHLT = new RegExp('^(geschichte\\.(prolog|finale|epilog)\\.|geschichte\\.dorf\\.(angebot|einstieg|ende)$'
  + '|geschichte\\.kapitel\\.\\w+\\.reise$|fuehrung\\.(schritt|nebenbei)\\.)');
test('Geschichte und Führung ohne Gedankenstrich, Doppelpunkt und Strichpunkt (PLAN 1a.2), je Sprache', () => {
  for (const [k, texte] of Object.entries(SPRACHEN)) {
    const erzaehlt = [...blaetter(texte)].filter(([s]) => ERZAEHLT.test(s));
    assert.ok(erzaehlt.length >= 35, `${k}: nur ${erzaehlt.length} Texte`);
    for (const [s, w] of erzaehlt) for (const x of varianten(w)) assert.ok(!/[–—:;]| - /.test(x), `${k}: ${s} «${x}»`);
  }
});
test('en.json: kein deutscher Rest (Umlaut, ß, «», Text gleich dem deutschen ausser Namen und reinen Mustern)', () => {
  const en = SPRACHEN.en;
  assert.ok(en, 'en.json fehlt');
  // gleich wie im Deutschen dürfen sein: Muster ohne Wort und Wörter, die in beiden Sprachen gleich lauten; dazu die
  // Titel (Namen von Monden, Sternbildern, Gesteinen wie Io, Pegasus, Basalt)
  const GLEICH = new Set(['Level {n}', 'Tutorial {n} / {N} – {titel}', '{grad}: {stand}. {aktion}',
    '{aktion}: {grad}, {stand}', '{kapitel} – {titel}', '{grad} · {welt} {n} / {N}']);
  for (const [s, w] of blaetter(en)) {
    for (const [i, x] of varianten(w).entries()) {
      // die Namen der Platzhalter ({Drücke lang}) sind in jeder Sprache dieselben
      assert.ok(!/[äöüÄÖÜß«»]/.test(x.replace(/\{[^{}]*\}/g, '')), `en: ${s} «${x}»`);
      assert.ok(x !== varianten(DE_BLAETTER.get(s))[i] || GLEICH.has(x) || s.startsWith('titel.'),
        `en: ${s} wie im Deutschen «${x}»`);
    }
  }
  assert.equal(en.seite.titel, 'Prisma – Light Puzzle');
});
test('Manifest je Sprache: manifest-<kürzel>.webmanifest wie manifest.webmanifest bis auf Name, Beschreibung und lang '
  + '(aus der Sprachdatei); der Name auf dem Startbildschirm bleibt «Prisma»', () => {
  const de = JSON.parse(lies('manifest.webmanifest'));
  assert.equal(de.name, DE.seite.titel);
  assert.equal(de.description, DE.seite.beschreibung);
  assert.equal(de.lang, 'de');
  for (const [k, texte] of Object.entries(SPRACHEN)) {
    if (k === 'de') continue;
    const m = JSON.parse(lies(`manifest-${k}.webmanifest`));
    assert.deepEqual(m, { ...de, name: texte.seite.titel, description: texte.seite.beschreibung, lang: k }, k);
    assert.equal(m.short_name, 'Prisma');
  }
  assert.match(lies('src/texte/sprache.js'), /manifest-\$\{sprache\}\.webmanifest/);
});

console.log('Kern (src/texte/uebersetzung.js)');
test('t: Text, Werte, Wörter je Gerät, Texte je Gerät; fehlt ein Schlüssel, gilt Deutsch, sonst der Schlüssel', () => {
  const sp = {
    de: { a: 'Übung {n} / {N}', b: '{Tippe} den Spiegel an.', c: { touch: 'Tippen', maus: 'Klicken' }, d: 'nur Deutsch',
      geraet: { Tippe: { touch: 'Tippe', maus: 'Klicke' }, 'Drücke lang': { touch: 'Drücke lang', maus: 'Rechtsklicke' } } },
    en: { a: 'Exercise {n} / {N}', b: '{Tippe} the mirror.', c: { touch: 'Tap', maus: 'Click' },
      geraet: { Tippe: { touch: 'Tap', maus: 'Click' }, 'Drücke lang': { touch: 'Press and hold', maus: 'Right-click' } } },
  };
  const de = uebersetzer(sp, 'de', true), en = uebersetzer(sp, 'en', false);
  assert.equal(de('a', { n: 2, N: 4 }), 'Übung 2 / 4');
  assert.equal(de('b'), 'Tippe den Spiegel an.');
  assert.equal(de('b', { touch: false }), 'Klicke den Spiegel an.');
  assert.equal(de('c'), 'Tippen');
  assert.equal(en('a', { n: 1, N: 3 }), 'Exercise 1 / 3');
  assert.equal(en('b'), 'Click the mirror.');
  assert.equal(en('c', { touch: true }), 'Tap');
  assert.equal(en('d'), 'nur Deutsch', 'fehlt: Deutsch');
  assert.equal(en('gibt.es.nicht'), 'gibt.es.nicht');
  assert.equal(uebersetzer(sp, 'fr')('a', { n: 1, N: 2 }), 'Übung 1 / 2', 'unbekannte Sprache: Deutsch');
  assert.equal(de('{x}'), '{x}');
  // die echten Wörter je Gerät
  const echt = uebersetzer(SPRACHEN, 'de');
  assert.equal(echt('fuehrung.schritt.erstesLicht.2', { touch: true }).split(' ')[0], 'Tippe');
  assert.equal(echt('fuehrung.schritt.erstesLicht.2', { touch: false }).split(' ')[0], 'Klicke');
  assert.match(echt('fuehrung.schritt.erstesLicht.4', { touch: true }), /Drücke lang auf/);
  assert.match(echt('fuehrung.schritt.erstesLicht.4', { touch: false }), /Rechtsklicke auf/);
});
test('Titel: aus dem Bereich titel, sonst Deutsch, sonst der Name', () => {
  const sp = { de: { titel: { 'Erstes Licht': 'Erstes Licht', a: 'Alpha' } }, en: { titel: { a: 'Alpha (en)' } } };
  assert.equal(titelVon(sp, 'en', 'a'), 'Alpha (en)');
  assert.equal(titelVon(sp, 'en', 'Erstes Licht'), 'Erstes Licht');
  assert.equal(titelVon(sp, 'de', 'Kandidat 3'), 'Kandidat 3');
  assert.equal(titelVon(SPRACHEN, 'de', L.LEVELS[L.TUTORIAL_COUNT].name), DE.titel[L.LEVELS[L.TUTORIAL_COUNT].name]);
});
test('Wahl der Sprache: gewünscht (?sprache=), gespeichert, sonst das Gerät (de* Deutsch, sonst Englisch, wenn es da ist)',
  () => {
    const nurDe = ['de'], beide = ['de', 'en'];
    assert.equal(spracheWaehlen({ geraet: 'de-CH', vorhanden: beide }), 'de');
    assert.equal(spracheWaehlen({ geraet: 'de', vorhanden: beide }), 'de');
    assert.equal(spracheWaehlen({ geraet: 'en-US', vorhanden: beide }), 'en');
    assert.equal(spracheWaehlen({ geraet: 'fr-FR', vorhanden: beide }), 'en');
    assert.equal(spracheWaehlen({ geraet: 'en-US', vorhanden: nurDe }), 'de', 'ohne en.json Deutsch');
    assert.equal(spracheWaehlen({ geraet: 'dk', vorhanden: beide }), 'en', 'nicht jedes d…');
    assert.equal(spracheWaehlen({ gespeichert: 'de', geraet: 'en-US', vorhanden: beide }), 'de');
    assert.equal(spracheWaehlen({ gespeichert: 'fr', geraet: 'de-AT', vorhanden: beide }), 'de', 'gespeichert, aber ohne Datei');
    assert.equal(spracheWaehlen({ gewuenscht: 'en', gespeichert: 'de', geraet: 'de', vorhanden: beide }), 'en');
    assert.equal(spracheWaehlen({ gewuenscht: 'xx', gespeichert: 'de', geraet: 'en', vorhanden: beide }), 'de');
  });
