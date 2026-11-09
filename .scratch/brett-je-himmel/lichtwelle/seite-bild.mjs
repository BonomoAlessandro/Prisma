// Ein Blick auf die Seite vor dem Veröffentlichen: Desktop und Handy, je ein Bild der ganzen Seite
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const { startChrome, emulate, sleep } = await import(pathToFileURL(join(process.env.BASIS ?? join(here, '..', 'katalog-basis'), 'tools', 'chrome.mjs')).href);
const { send, logs, close } = await startChrome({ width: 1280, height: 900 });
for (const [name, w, h] of [['desktop', 1280, 900], ['handy', 400, 860]]) {
  await emulate(send, { width: w, height: h, dpr: 1 });
  await send('Page.navigate', { url: pathToFileURL(join(here, 'publish', 'index.html')).href });
  await sleep(2500);
  const m = await send('Runtime.evaluate', { expression: 'JSON.stringify({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth })', returnByValue: true });
  const { h: ph, w: pw } = JSON.parse(m.result.result.value);
  console.log(name, 'Seite', pw, '×', ph);
  const k = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(ph, 4200), scale: name === 'desktop' ? 0.6 : 0.8 } });
  writeFileSync(join(here, 'out', `seite-${name}.jpg`), Buffer.from(k.result.data, 'base64'));
}
console.log(logs.slice(0, 10).join('\n'));
await close();
