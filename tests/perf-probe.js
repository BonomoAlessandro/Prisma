// Aufruf: node tests/screenshot.mjs perf 1280 800 200 "$(cat tests/perf-probe.js)"
// Wird in die Seite eingeschleust: misst die Renderzeit pro Frame
// mit verschiedenen abgeschalteten Stufen. Absolute Werte (Software-Rendering) sind
// bedeutungslos, die Verhältnisse zeigen aber, welche Stufe die Kosten verursacht.
(async () => {
  const d = window.__prismaDebug;
  const gl = d.renderer.getContext();
  const px = new Uint8Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const N = 6;
  const measure = () => {
    renderReflection(); composer.render(0.016); sync(); // Aufwärmen / Shader kompilieren
    const t0 = performance.now();
    for (let i = 0; i < N; i++) { renderReflection(); composer.render(0.016); }
    sync();
    return +((performance.now() - t0) / N).toFixed(1);
  };
  const out = {};
  const variant = (name, apply, revert) => { apply(); out[name] = measure(); revert(); };

  out.voll = measure();
  variant('ohneSpiegelung', () => { QUALITY.reflections = false; }, () => { QUALITY.reflections = true; });
  variant('schattenJedesFrame', () => { d.renderer.shadowMap.autoUpdate = true; }, () => { d.renderer.shadowMap.autoUpdate = false; });
  variant('ohneBloom', () => { d.bloomPass.enabled = false; }, () => { d.bloomPass.enabled = true; });
  variant('ohneStrahlen', () => { beamView.group.visible = false; }, () => { beamView.group.visible = true; });
  return JSON.stringify(out);
})()
