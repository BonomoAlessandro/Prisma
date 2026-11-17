// Testschnittstelle (Ticket 05 von .scratch/umbau/, aus Review 04): Proben lesen über Runtime.evaluate (und die Skripte
// tests/*.js, die tests/screenshot.mjs einschleust) Namen der Seite als globale Namen (game, camera, draw …). Seit
// Ticket 04 sind die Teile des Spiels Module; global sind nur noch die Namen, die ein Modul mit alsGlobal
// (src/seite/testschnittstelle.ts) zeigt. Dieser Test prüft, dass jeder Name der obersten Ebene eines Moduls unter
// src/, den eine Probe im Code der Seite nennt, in einer Liste von alsGlobal steht, damit die Liste nicht wieder still
// Lücken bekommt (in Review 04 fehlten sechs).
//
// Wie: Mit dem Parser von TypeScript die Namen der obersten Ebene aller Module (ohne .d.ts) und die Namen aus allen
// Aufrufen alsGlobal({ … }). Proben sind tests/*.js (ganz Code der Seite) und jede Datei unter tests/ und tools/, die
// Chrome steuert (Runtime.evaluate oder tools/chrome.mjs); in ihnen gilt jeder Text (String, Template) als Code der
// Seite. Gezählt werden freie Namen: nicht als Eigenschaft (a.name, { name: … }), nicht in diesem Code selbst
// deklariert (const, Parameter, Destrukturieren), dazu window.name. Reine Wortlisten ('forest,solar') und einzelne
// Wörter ('stone') sind Daten, kein Code, ausser ein Aufruf ev(…)/evaluate(…) wertet sie direkt aus
// (ev('RUHE_NACH_MS')). Läuft in Node ohne Browser (etwa 2 s): node tests/testschnittstelle.test.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { root } from '../tools/spielserver.mjs';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

const dateien = (ordner, passt) => readdirSync(join(root, ordner), { withFileTypes: true }).flatMap((e) => {
  const pfad = `${ordner}/${e.name}`;
  if (e.isDirectory()) return e.name === 'node_modules' || e.name === 'output' ? [] : dateien(pfad, passt);
  return passt(e.name) ? [pfad] : [];
}).sort();
const lies = (pfad) => readFileSync(join(root, pfad), 'utf8');
const parse = (pfad, text) => ts.createSourceFile(pfad, text, ts.ScriptTarget.Latest, true,
  pfad.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);

/** Namen der obersten Ebene je Modul und die Namen aus alsGlobal({ … }) (Getter wie Setzer). */
function seite(module) {
  const oben = new Map(), global = new Set();
  for (const [pfad, text] of Object.entries(module)) {
    const sf = parse(pfad, text);
    const binde = (b) => {
      if (ts.isIdentifier(b)) { if (!oben.has(b.text)) oben.set(b.text, pfad); return; }
      for (const e of b.elements) if (!ts.isOmittedExpression(e)) binde(e.name);
    };
    for (const s of sf.statements) {
      if ((ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s)) && s.name) binde(s.name);
      else if (ts.isVariableStatement(s)) for (const d of s.declarationList.declarations) binde(d.name);
      else if (ts.isExpressionStatement(s) && ts.isCallExpression(s.expression)
        && s.expression.expression.getText(sf) === 'alsGlobal') {
        for (const a of s.expression.arguments) {
          if (ts.isObjectLiteralExpression(a)) for (const p of a.properties) global.add(p.name.getText(sf));
        }
      }
    }
  }
  return { oben, global };
}

/** Freie Namen in einem Stück Code der Seite (siehe Kopf). */
function freieNamen(text, pfad = 'probe.js') {
  const deklariert = new Set(), genannt = [];
  const geh = (n) => {
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      if (ts.isPropertyAccessExpression(p) && p.name === n) {
        if (ts.isIdentifier(p.expression) && ['window', 'globalThis'].includes(p.expression.text)) genannt.push(n.text);
        return;
      }
      if ((ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p)
        || ts.isGetAccessor(p) || ts.isSetAccessor(p)) && p.name === n) return;
      if (ts.isBindingElement(p) && p.propertyName === n) return;
      if ((ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p)
        || ts.isBindingElement(p) || ts.isClassDeclaration(p)) && p.name === n) { deklariert.add(n.text); return; }
      genannt.push(n.text);
    }
    ts.forEachChild(n, geh);
  };
  geh(parse(pfad, text));
  return genannt.filter((n) => !deklariert.has(n));
}

/** Die Stücke Code der Seite in einer Probe: eine .js ganz, sonst jeder String und jedes Template. */
function seitenCode(pfad, text) {
  if (pfad.endsWith('.js')) return [text];
  const stuecke = [];
  const geh = (n) => {
    let teile = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) teile = [n.text];
    else if (ts.isTemplateExpression(n)) teile = [n.head.text, ...n.templateSpans.map((t) => t.literal.text)];
    if (teile) {
      const code = teile.join(' 0 '); // ${…} als Platzhalter
      // Wortliste oder einzelnes Wort: Daten, ausser direkt ausgewertet (ev('RUHE_NACH_MS'), { expression: 'x' })
      const p = n.parent, ausgewertet = (ts.isCallExpression(p) && /^(ev|evaluate)$/.test(p.expression.getText()))
        || (ts.isPropertyAssignment(p) && p.name.getText() === 'expression');
      if (ausgewertet || !/^[\w$,\s-]*$/.test(code)) stuecke.push(code);
    }
    ts.forEachChild(n, geh);
  };
  geh(parse(pfad, text));
  return stuecke;
}

/** Namen der obersten Ebene, die Proben nennen, aber alsGlobal nicht zeigt: [«name (modul) in probe»]. */
function luecken(module, proben) {
  const { oben, global } = seite(module), fehlt = new Map();
  for (const [pfad, text] of Object.entries(proben)) {
    for (const code of seitenCode(pfad, text)) {
      for (const n of freieNamen(code)) {
        if (oben.has(n) && !global.has(n)) fehlt.set(n, [...(fehlt.get(n) ?? []), pfad]);
      }
    }
  }
  return [...fehlt].sort().map(([n, p]) => `${n} (${oben.get(n)}) in ${[...new Set(p)].join(', ')}`);
}

const MODULE = Object.fromEntries(dateien('src', (n) => /\.(js|ts)$/.test(n) && !n.endsWith('.d.ts')).map((p) => [p, lies(p)]));
const PROBEN = Object.fromEntries([
  ...dateien('tests', (n) => n.endsWith('.js')),
  ...[...dateien('tests', (n) => n.endsWith('.mjs')), ...dateien('tools', (n) => n.endsWith('.mjs'))]
    .filter((p) => p !== 'tests/testschnittstelle.test.mjs' && /Runtime\.evaluate|chrome\.mjs/.test(lies(p))),
].map((p) => [p, lies(p)]));

test('Proben: tests/*.js und die Dateien, die Chrome steuern', () => {
  for (const p of ['tests/perf-probe.js', 'tests/geschichte-probe.mjs', 'tests/bildvergleich.mjs', 'tests/spiegel-probe.mjs',
    'tests/ruhetakt-probe.mjs', 'tests/screenshot.mjs', 'tools/ki-tester/shots.mjs']) assert.ok(p in PROBEN, p);
  const { oben, global } = seite(MODULE);
  assert.ok(oben.size > 400 && oben.has('game') && oben.has('progress'), `${oben.size} Namen der obersten Ebene`);
  for (const n of ['game', 'camera', 'draw', 'renderReflection', 'RUHE_NACH_MS', 'composer', 'wagen']) assert.ok(global.has(n), n);
});

test('Jeder Name der Seite, den eine Probe global liest, steht in alsGlobal', () => {
  assert.deepEqual(luecken(MODULE, PROBEN), []);
});

test('Gegenproben: fehlt ein Name in alsGlobal, fällt er auf; Eigenschaften, eigene Namen und Daten nicht', () => {
  const module = {
    'src/a.js': 'const game = {}, scene = 1;\nfunction draw() {}\nconst { camera } = x;\nalsGlobal({ game: () => game });',
  };
  assert.deepEqual(luecken(module, { 'tests/x-probe.mjs': 'ev(`game.levelIndex + scene`);' }),
    ['scene (src/a.js) in tests/x-probe.mjs']);
  assert.deepEqual(luecken(module, { 'tests/x-probe.mjs': 'ev(`${D}.camera.fov`); ev("window.draw()");' }),
    ['draw (src/a.js) in tests/x-probe.mjs'], 'window.draw ja, D.camera nein');
  assert.deepEqual(luecken(module, { 'tests/x.js': '// scene im Kommentar\nconst draw = 1; f(camera, draw);' }),
    ['camera (src/a.js) in tests/x.js'], 'eingeschleustes Skript: eigene Namen und Kommentare zählen nicht');
  assert.deepEqual(luecken(module, {
    'tests/x-probe.mjs': "const scene = 2; ev(`(() => { const { scene } = D; return { scene: scene.x }; })()`);"
      + " sky('scene'); wahl('draw,camera'); // camera",
  }), [], 'Node-Code, Destrukturieren in der Seite, Schlüssel, Daten');
  assert.deepEqual(luecken(module, { 'tests/x-probe.mjs': "await ev('scene'); send('Runtime.evaluate', { expression: 'draw' });" }),
    ['draw (src/a.js) in tests/x-probe.mjs', 'scene (src/a.js) in tests/x-probe.mjs'], 'ein Wort, direkt ausgewertet');
});
