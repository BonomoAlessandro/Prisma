// Prüft die Android-App (Ticket 10 von .scratch/umbau/) ohne Android und ohne Browser (etwa 3 s): den Build der App
// (npm run build:app ohne cap sync, vite build --mode app, hier in einen eigenen Ordner) und das Android-Projekt.
// - Build der App: keine Source-Maps, kein sw.js, keine Manifeste; window.PRISMA_APP vor dem Skript, das Manifest und
//   Service Worker einbindet (beides dann aus); die Zurück-Taste über @capacitor/app im Spiel.
// - Browser-Fassung (npm run build) ohne Capacitor: der Teil der App fällt dort weg (import.meta.env.MODE).
// - Android: Paketname ch.bonomo.prisma, webDir dist, Version aus package.json, Signieren nur über keystore.properties
//   ausserhalb des Repos; kein Schlüssel, kein Passwort und keine Build-Ausgabe im Repo (git ls-files), .gitignore
//   schützt davor.
// - Store (store/index.html): Titel, Kurz- und Langbeschreibung, Versionshinweis je Sprache in den Grenzen von Google
//   Play (30, 80, 4000, 500 Zeichen), die Bilder der Seite und das Icon liegen da.
// Den Gerätetest (Start, Zurück-Taste, Drehen, Spielstand nach Neustart und Update) macht der Nutzer selbst (Prüfliste
// im Ticket). Aufruf: node tests/app.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { baue, root } from '../tools/spielserver.mjs';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ', name); }
  catch (e) { console.error('  FAIL', name, '\n      ', e.message); process.exitCode = 1; }
}
process.on('exit', () => console.log(`\n${passed} Tests bestanden.`));

/** Alle Dateien unter ordner (relativ, mit «/»). */
const dateien = (ordner, pfad = '') => readdirSync(join(ordner, pfad), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? dateien(ordner, `${pfad}${e.name}/`) : [`${pfad}${e.name}`]));
const lies = (pfad) => readFileSync(join(root, pfad), 'utf8');

const tmp = mkdtempSync(join(tmpdir(), 'prisma-app-'));
process.once('exit', () => rmSync(tmp, { recursive: true, force: true }));
const app = join(tmp, 'app'), web = join(tmp, 'web');
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const r = spawnSync(process.execPath, [vite, 'build', '--mode', 'app', '--outDir', app, '--emptyOutDir', '--logLevel', 'warn'],
  { cwd: root, encoding: 'utf8' });
if (r.status !== 0) { console.error(`Build der App gescheitert:\n${r.stdout}\n${r.stderr}`); process.exit(1); }
baue(web);
const imApp = dateien(app), imWeb = dateien(web);
const appHtml = readFileSync(join(app, 'index.html'), 'utf8');
const js = (ordner, liste) => liste.filter((f) => /^assets\/.*\.js$/.test(f)).map((f) => readFileSync(join(ordner, f), 'utf8')).join('\n');

test('Build der App: ohne Source-Maps, sw.js und Manifeste, sonst dieselben Dateien wie die Browser-Fassung', () => {
  assert.deepEqual(imApp.filter((f) => f.endsWith('.map') || /^sw\.js$|\.webmanifest$/.test(f)), []);
  const ohne = (l) => l.filter((f) => !f.startsWith('assets/') && !/\.map$|^sw\.js$|\.webmanifest$/.test(f)).sort();
  assert.deepEqual(ohne(imApp), ohne(imWeb));
  assert.ok(!/sourceMappingURL/.test(js(app, imApp)), 'Verweis auf eine Source-Map');
});
test('Build der App: PRISMA_APP vor dem Skript mit Manifest und Service Worker, das dann nichts einbindet', () => {
  const flag = appHtml.indexOf('window.PRISMA_APP = true'), reg = appHtml.indexOf('navigator.serviceWorker.register');
  assert.ok(flag > 0 && reg > flag, 'PRISMA_APP fehlt oder steht nach der Registrierung');
  assert.match(appHtml, /if \(\/\^https\?:\/\.test\(location\.protocol\) && !window\.PRISMA_APP\) \{/);
  assert.ok(!readFileSync(join(web, 'index.html'), 'utf8').includes('window.PRISMA_APP = true'), 'PRISMA_APP in der Browser-Fassung');
});
test('Zurück-Taste: in der App über @capacitor/app, in der Browser-Fassung kein Capacitor', () => {
  const a = js(app, imApp), w = js(web, imWeb);
  assert.ok(a.includes('backButton') && a.includes('exitApp'), 'App ohne Hörer auf backButton');
  assert.ok(/Capacitor/.test(a), '@capacitor/core fehlt in der App');
  assert.ok(!/backButton|exitApp|Capacitor/.test(w), 'Capacitor in der Browser-Fassung');
  assert.match(lies('src/seite/geschichte/geschichte.js'), /if \(import\.meta\.env\.MODE === 'app'\) \{\s*import\('@capacitor\/app'\)/);
});
test('Datenschutz im Menü: im Browser die Seite daneben, in der App die auf GitHub Pages', () => {
  const menue = lies('src/seite/oberflaeche/menue.js');
  assert.match(menue, /window\.PRISMA_APP \? 'https:\/\/bonomoalessandro\.github\.io\/Prisma\/datenschutz\.html' : 'datenschutz\.html'/);
  assert.ok(imApp.includes('datenschutz.html'), 'datenschutz.html fehlt in der App');
  for (const s of ['de', 'en']) assert.ok(JSON.parse(lies(`src/texte/${s}.json`)).menue.datenschutz, `Text fehlt (${s})`);
});

const konfig = JSON.parse(lies('capacitor.config.json'));
const paket = JSON.parse(lies('package.json'));
const gradle = lies('android/app/build.gradle');
test('Android: Paketname, webDir, Version aus package.json, targetSdk 36', () => {
  assert.equal(konfig.appId, 'ch.bonomo.prisma');
  assert.equal(konfig.webDir, 'dist');
  assert.match(gradle, /applicationId "ch\.bonomo\.prisma"/);
  assert.match(gradle, /versionCode paket\.android\.versionCode as int/);
  assert.match(gradle, /versionName paket\.android\.versionName as String/);
  assert.ok(Number.isInteger(paket.android?.versionCode) && paket.android.versionCode >= 1, 'android.versionCode in package.json');
  assert.equal(typeof paket.android?.versionName, 'string');
  assert.match(lies('android/variables.gradle'), /targetSdkVersion = 36\b/);
  assert.equal(paket.scripts['build:app'], 'vite build --mode app && cap sync android');
});
test('Android: Name je Sprache (values Englisch, values-de Deutsch), adaptives Icon, Vollbild', () => {
  for (const o of ['values', 'values-de']) assert.match(lies(`android/app/src/main/res/${o}/strings.xml`), /<string name="app_name">Prisma<\/string>/);
  assert.match(lies('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'), /@mipmap\/ic_launcher_foreground/);
  for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    for (const f of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
      assert.ok(existsSync(join(root, `android/app/src/main/res/mipmap-${d}/${f}.png`)), `${d}/${f}.png fehlt`);
    }
  }
  assert.match(lies('android/app/src/main/java/ch/bonomo/prisma/MainActivity.java'), /hide\(WindowInsetsCompat\.Type\.systemBars\(\)\)/);
  assert.equal(konfig.plugins?.SystemBars?.hidden, true);
});
test('Signieren: nur über keystore.properties ausserhalb; kein Schlüssel, kein Passwort, keine Ausgabe im Repo', () => {
  assert.match(gradle, /System\.getenv\('PRISMA_SCHLUESSEL'\)/);
  assert.match(gradle, /prisma-schluessel\/keystore\.properties/);
  assert.ok(!/storePassword\s+['"]/.test(gradle), 'Passwort im Gradle-Skript');
  const ignore = lies('.gitignore');
  for (const m of ['*.jks', '*.keystore', 'keystore.properties', '*.aab', '*.apk']) assert.ok(ignore.split(/\r?\n/).includes(m), `.gitignore ohne ${m}`);
  const imRepo = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).stdout.split('\n');
  assert.deepEqual(imRepo.filter((f) => /\.(jks|keystore|p12|pk8|aab|apk|apks)$|keystore\.properties$|^android\/app\/build\//.test(f)), []);
  const unter = (p) => existsSync(join(root, p)) && statSync(join(root, p)).isDirectory();
  if (unter('android/app/build')) {
    const geprueft = spawnSync('git', ['check-ignore', '-q', 'android/app/build/x'], { cwd: root });
    assert.equal(geprueft.status, 0, 'android/app/build nicht ignoriert');
  }
});
test('Store: Texte auf Deutsch und Englisch in den Grenzen von Google Play, Bilder und Icon da', () => {
  const seite = lies('store/index.html');
  const text = (id) => {
    const m = seite.match(new RegExp(`<pre id="${id}"[^>]*>([^<]*)</pre>`));
    assert.ok(m, `${id} fehlt`);
    return m[1].replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  };
  for (const s of ['de', 'en']) {
    for (const [feld, max] of [['titel', 30], ['kurz', 80], ['lang', 4000], ['neu', 500]]) {
      const n = [...text(`${s}-${feld}`)].length;
      assert.ok(n > 0 && n <= max, `${s}-${feld}: ${n} Zeichen (höchstens ${max})`);
    }
  }
  const bilder = [...seite.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(bilder.length >= 5, 'zu wenige Bilder');
  assert.deepEqual(bilder.filter((b) => !existsSync(join(root, 'store', b))), [], 'Bild fehlt');
  assert.ok(existsSync(join(root, 'store', 'icon-512.png')), 'store/icon-512.png fehlt');
});
