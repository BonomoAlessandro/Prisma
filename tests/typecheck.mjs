// Typen prüfen (Ticket 04 von .scratch/umbau/): npm run typecheck, also tsc --noEmit für die Seite (tsconfig.json) und
// den Worker des Halls (tsconfig.worker.json). Teil von npm test (tests/alle.mjs).
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { root } from '../tools/spielserver.mjs';

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
let ok = true;
for (const p of ['tsconfig.json', 'tsconfig.worker.json']) {
  const r = spawnSync(process.execPath, [tsc, '--noEmit', '-p', join(root, p)], { stdio: 'inherit', cwd: root });
  console.log(`${r.status === 0 ? 'ok' : 'FEHLER'} tsc --noEmit -p ${p}`);
  ok &&= r.status === 0;
}
process.exit(ok ? 0 : 1);
