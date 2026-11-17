// Prüft die Sperre von tools/leise.sh (Ticket 13 von .scratch/umbau/): leichte Läufe gleichzeitig bis
// LEISE_LEICHT_MAX, ein alleiniger nie neben einem anderen Lauf, Vorrang und Frist, verwaiste Sperren. Jeder Fall mit
// eigener Sperre und eigenem Warteordner (LEISE_SPERRE, LEISE_WARTE) im Temp-Verzeichnis, nie mit der echten unter /tmp;
// die Fälle laufen darum gleichzeitig (etwa 40 s). Die Läufe sind kurze sh-Befehle, die Beginn und Ende mit der Uhr in
// eine Datei schreiben; geprüft wird an diesen Zeiten. Nur unter Windows (leise.ps1).
// Aufruf: node tests/leise.test.mjs   (in tests/alle.mjs)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKRIPT = join(root, 'tools', 'leise.sh');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const posix = (p) => p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`);

let fehler = 0, pruefungen = 0;
const ok = (bed, text) => { pruefungen++; if (!bed) { fehler++; console.log(`  FEHLER ${text}`); } };

/** Ein Fall: eigene Sperre, eigener Warteordner, ein Protokoll; lauf() startet einen Lauf über leise.sh. */
function fall(name) {
  const dir = mkdtempSync(join(tmpdir(), `prisma-leise-test-${name}-`));
  const log = join(dir, 'log');
  writeFileSync(log, '');
  const env = { ...process.env, LEISE_SPERRE: posix(join(dir, 'lock')), LEISE_WARTE: posix(join(dir, 'warte')),
    LEISE_CPU: '20', LEISE_MAX_CPU: '50' };
  for (const k of ['LEISE_AKTIV', 'LEISE_ART', 'LEISE_VORRANG', 'LEISE_LEICHT_MAX', 'LEISE_FRIST']) delete env[k];
  const laeufe = [];
  /** art, vorrang, frist, max: die Umgebung des Laufs; s: so lange läuft der Befehl. */
  const lauf = (n, { art, vorrang, frist, max, s = 3 } = {}) => {
    const e = { ...env };
    if (art) e.LEISE_ART = art;
    if (vorrang !== undefined) e.LEISE_VORRANG = String(vorrang);
    if (frist !== undefined) e.LEISE_FRIST = String(frist);
    if (max !== undefined) e.LEISE_LEICHT_MAX = String(max);
    const befehl = `echo "start ${n} $(date +%s%3N)" >> '${posix(log)}'; sleep ${s}; `
      + `echo "ende ${n} $(date +%s%3N)" >> '${posix(log)}'`;
    const p = spawn('sh', [posix(SKRIPT), 'sh', '-c', befehl], { env: e, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.stdout.on('data', () => {});
    const fertig = new Promise((r) => p.on('exit', (code) => r({ code, err })));
    laeufe.push({ n, fertig });
    return fertig;
  };
  /** Zeiten je Lauf { n: { start, ende } } */
  const zeiten = () => {
    const z = {};
    for (const zeile of readFileSync(log, 'utf8').split('\n').filter(Boolean)) {
      const [was, n, t] = zeile.trim().split(' ');
      (z[n] ??= {})[was] = +t;
    }
    return z;
  };
  /** warten, bis Lauf n begonnen hat */
  const begonnen = async (n, sekunden = 30) => {
    for (let i = 0; i < sekunden * 10; i++) { if (zeiten()[n]?.start) return; await sleep(100); }
    throw new Error(`${name}: ${n} beginnt nicht`);
  };
  /** warten, bis ein Lauf in WARTE eingetragen ist (alleinige) */
  const wartet = async (sekunden = 30) => {
    for (let i = 0; i < sekunden * 10; i++) {
      if (existsSync(join(dir, 'warte')) && readdirSync(join(dir, 'warte')).length) return;
      await sleep(100);
    }
    throw new Error(`${name}: kein Wartender`);
  };
  const alle = async () => { const r = await Promise.all(laeufe.map((l) => l.fertig)); return r; };
  const aufgeraeumt = () => !existsSync(join(dir, 'lock')) && !existsSync(join(dir, 'lock.leicht'))
    && (!existsSync(join(dir, 'warte')) || readdirSync(join(dir, 'warte')).length === 0);
  return { name, dir, lauf, zeiten, begonnen, wartet, alle, aufgeraeumt, weg: () => rmSync(dir, { recursive: true, force: true }) };
}
/** höchste Zahl gleichzeitig laufender Läufe aus den Zeiten */
const gleichzeitig = (z, namen = Object.keys(z)) => {
  const ereignisse = namen.flatMap((n) => [[z[n].start, 1], [z[n].ende, -1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let jetzt = 0, max = 0;
  for (const [, d] of ereignisse) { jetzt += d; max = Math.max(max, jetzt); }
  return max;
};
/** a läuft nie neben einem der Läufe in andere */
const alleinIn = (z, a, andere) => andere.every((n) => z[n].ende <= z[a].start || z[a].ende <= z[n].start);

const FAELLE = {
  async 'leicht gleichzeitig bis LEISE_LEICHT_MAX'(f) {
    for (let i = 1; i <= 6; i++) f.lauf(`L${i}`, { art: 'leicht', max: 4, s: 4 });
    const r = await f.alle();
    ok(r.every((x) => x.code === 0), `${f.name}: alle Läufe mit 0 beendet (${r.map((x) => x.code)})`);
    const z = f.zeiten();
    ok(Object.keys(z).length === 6 && Object.values(z).every((x) => x.start && x.ende), `${f.name}: alle 6 gelaufen`);
    ok(gleichzeitig(z) === 4, `${f.name}: höchstens und auch wirklich 4 gleichzeitig (${gleichzeitig(z)})`);
    ok(f.aufgeraeumt(), `${f.name}: Sperre danach weg`);
  },
  async 'alleiniger nie neben leichten, wartet nicht endlos'(f) {
    f.lauf('L1', { art: 'leicht', s: 5 }); f.lauf('L2', { art: 'leicht', s: 5 });
    await f.begonnen('L1'); await f.begonnen('L2');
    f.lauf('A', { s: 2 }); // Vorrang 500 wie die leichten
    await f.wartet();
    await sleep(500);
    f.lauf('L3', { art: 'leicht', s: 2 }); // kommt nach A dran (gleicher Vorrang)
    const r = await f.alle();
    ok(r.every((x) => x.code === 0), `${f.name}: alle mit 0 beendet`);
    const z = f.zeiten();
    ok(alleinIn(z, 'A', ['L1', 'L2', 'L3']), `${f.name}: A allein (${JSON.stringify(z)})`);
    ok(z.L3.start >= z.A.ende, `${f.name}: L3 überholt den wartenden A nicht`);
    ok(f.aufgeraeumt(), `${f.name}: Sperre danach weg`);
  },
  async 'Vorrang überholt den alleinigen nur bis zur Frist'(f) {
    f.lauf('L1', { art: 'leicht', s: 6 });
    await f.begonnen('L1');
    f.lauf('A', { vorrang: 500, s: 2 });
    await f.wartet();
    f.lauf('L2', { art: 'leicht', vorrang: 2, frist: 10, s: 1 }); // kleinere Zahl, Frist nicht um: überholt
    await f.begonnen('L2', 15);
    await sleep(300);
    f.lauf('L3', { art: 'leicht', vorrang: 2, frist: 0, s: 1 }); // Frist um: wartet auf A
    const r = await f.alle();
    ok(r.every((x) => x.code === 0), `${f.name}: alle mit 0 beendet`);
    const z = f.zeiten();
    ok(z.L2.start < z.A.start, `${f.name}: L2 (Vorrang 2) überholt A (500)`);
    ok(z.L3.start >= z.A.ende, `${f.name}: L3 (Frist 0) wartet auf A`);
    ok(alleinIn(z, 'A', ['L1', 'L2', 'L3']), `${f.name}: A allein`);
    ok(f.aufgeraeumt(), `${f.name}: Sperre danach weg`);
  },
  async 'alleinige nacheinander, kleinere Zahl zuerst'(f) {
    f.lauf('A1', { s: 3 });
    await f.begonnen('A1');
    f.lauf('A2', { vorrang: 500, s: 1 });
    await f.wartet();
    await sleep(300);
    f.lauf('A3', { vorrang: 3, s: 1 });
    const r = await f.alle();
    ok(r.every((x) => x.code === 0), `${f.name}: alle mit 0 beendet`);
    const z = f.zeiten();
    ok(gleichzeitig(z) === 1, `${f.name}: nie zwei alleinige gleichzeitig`);
    ok(z.A3.start < z.A2.start, `${f.name}: A3 (Vorrang 3) vor A2 (500)`);
    ok(f.aufgeraeumt(), `${f.name}: Sperre danach weg`);
  },
  async 'verwaiste Sperren'(f) {
    // eine Gruppe, deren Halter und Mitglieder tot sind: ein leichter Lauf übernimmt sie
    const lock = join(f.dir, 'lock');
    mkdirSync(lock, { recursive: true });
    writeFileSync(join(lock, 'art'), 'leicht\n');
    writeFileSync(join(lock, 'pid'), '99999 1\n');
    writeFileSync(join(lock, 'leicht.99999'), '99999 1\n');
    const r1 = await f.lauf('L1', { art: 'leicht', s: 1 });
    ok(r1.code === 0 && f.zeiten().L1?.ende, `${f.name}: leichter Lauf übernimmt eine tote Gruppe`);
    ok(f.aufgeraeumt(), `${f.name}: danach weg`);
    // eine alleinige Sperre mit totem Halter: ein alleiniger übernimmt sie
    mkdirSync(lock, { recursive: true });
    writeFileSync(join(lock, 'pid'), '99999 1\n');
    const r2 = await f.lauf('A1', { s: 1 });
    ok(r2.code === 0 && f.zeiten().A1?.ende, `${f.name}: alleiniger übernimmt eine tote Sperre`);
    ok(f.aufgeraeumt(), `${f.name}: danach weg`);
    // der Halter der Gruppe ist tot, ein leichter Lauf darin lebt noch: nicht verwaist, der alleinige wartet
    f.lauf('L2', { art: 'leicht', s: 10 });
    await f.begonnen('L2');
    writeFileSync(join(lock, 'pid'), '99999 1\n');
    f.lauf('A2', { s: 1 });
    await sleep(3000); // A2 prüft die Sperre mit totem Halter mehrmals
    ok(!f.zeiten().A2, `${f.name}: alleiniger startet nicht neben dem lebenden leichten Lauf trotz totem Halter`);
    await f.lauf('L3', { art: 'leicht', vorrang: 1, s: 1 }); // tritt ein und setzt sich als Halter
    ok(!readFileSync(join(lock, 'pid'), 'utf8').startsWith('99999'), `${f.name}: der Halter lebt wieder`);
    await f.alle();
    const z = f.zeiten();
    ok(z.A2.start >= z.L2.ende, `${f.name}: alleiniger wartet auf den lebenden leichten Lauf`);
    ok(f.aufgeraeumt(), `${f.name}: am Ende weg`);
  },
  async 'Halter hart beendet, leichter lebt weiter'(f) {
    // Ticket 14: Der Halter der Gruppe stirbt hart (taskkill /F, keine Falle läuft); der zweite leichte Lauf trägt sich
    // binnen weniger Sekunden als Halter ein (so hält auch eine ältere Kopie, die nur pid kennt, die Gruppe nicht für
    // verwaist), und ein alleiniger startet erst nach ihm.
    const lock = join(f.dir, 'lock');
    const L1 = f.lauf('L1', { art: 'leicht', s: 15 });
    await f.begonnen('L1');
    const L2 = f.lauf('L2', { art: 'leicht', s: 12 });
    await f.begonnen('L2');
    const [pid1, wp1] = readFileSync(join(lock, 'pid'), 'utf8').trim().split(' ');
    const mitglieder = readdirSync(lock).filter((d) => d.startsWith('leicht.')).map((d) => d.slice(7));
    ok(mitglieder.length === 2 && mitglieder.includes(pid1), `${f.name}: zwei Mitglieder, Halter ist eines (${mitglieder})`);
    spawnSync('taskkill', ['/F', '/PID', wp1], { stdio: 'ignore', timeout: 30000 });
    const r1 = await L1;
    ok(r1.code !== 0, `${f.name}: Halter hart beendet (Rückgabe ${r1.code})`);
    let neu = pid1;
    for (let i = 0; i < 150 && neu === pid1; i++) {
      await sleep(100);
      try { neu = readFileSync(join(lock, 'pid'), 'utf8').trim().split(' ')[0]; } catch { /* gerade ersetzt */ }
    }
    ok(neu !== pid1 && mitglieder.includes(neu), `${f.name}: der lebende leichte Lauf ist binnen 15 s Halter (${neu})`);
    f.lauf('A', { s: 1 });
    const r = await Promise.all([L2, f.alle()]);
    ok(r[0].code === 0, `${f.name}: L2 mit 0 beendet`);
    const z = f.zeiten();
    ok(z.A?.start >= z.L2.ende, `${f.name}: alleiniger startet erst nach dem lebenden leichten Lauf`);
    ok(f.aufgeraeumt(), `${f.name}: Sperre danach weg`);
  },
  async 'Argumente'(f) {
    const r = await f.lauf('X', { art: 'schwer' });
    ok(r.code === 1 && /LEISE_ART/.test(r.err) && !f.zeiten().X, `${f.name}: unbekannte Art bricht ab`);
    const r2 = await f.lauf('Y', { art: 'leicht', max: 0 });
    ok(r2.code === 1 && /LEISE_LEICHT_MAX/.test(r2.err), `${f.name}: LEISE_LEICHT_MAX=0 bricht ab`);
  },
};

const t0 = Date.now();
const wahl = process.argv.slice(2);
await Promise.all(Object.entries(FAELLE).filter(([n]) => !wahl.length || wahl.some((w) => n.includes(w)))
  .map(async ([n, fn]) => {
    const f = fall(n.replace(/[^a-z]+/gi, '-').slice(0, 20));
    f.name = n;
    try { await fn(f); } catch (e) { fehler++; console.log(`  FEHLER ${n}: ${e.message}`); }
    finally { f.weg(); }
    console.log(`  fertig: ${n}`);
  }));
console.log(`leise.sh: ${pruefungen} Prüfungen, ${fehler} Fehler, ${Math.round((Date.now() - t0) / 1000)} s`);
process.exit(fehler ? 1 : 0);
