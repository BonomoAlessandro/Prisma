# Kontrolle: Höhenkarte von oben (Norden = +Y oben), Nebel blau, Brett als Rechteck.
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from wald_lib import terrain, fog_top, FOG
from wald_io import save_image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT, exist_ok=True)
for name, half, n in (('hm_near', 160, 800), ('hm_far', 2400, 800)):
    t0 = time.time()
    xs = np.linspace(-half, half, n)
    X, Y = np.meshgrid(xs, xs[::-1])
    Z = terrain(X, Y)
    F = fog_top(X, Y)
    # Schummerung: Licht vom Mond (Westsüdwest)
    gy, gx = np.gradient(Z, xs[1] - xs[0])
    gy = -gy
    nrm = np.stack([-gx, -gy, np.ones_like(Z)], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    L = np.array([-0.8, -0.25, 0.5]); L /= np.linalg.norm(L)
    shade = np.clip(nrm @ L, 0, 1)
    h = np.clip((Z + 50) / 120, 0, 1)
    rgb = np.stack([0.25 + 0.6 * h, 0.35 + 0.5 * h, 0.2 + 0.3 * h], -1) * (0.35 + 0.65 * shade[..., None])
    fog = Z < F
    rgb[fog] = rgb[fog] * 0.35 + np.array([0.55, 0.62, 0.8]) * 0.65
    if half < 500:
        b = np.abs(X) < 4.9
        b &= np.abs(Y) < 4.9
        rgb[b] = rgb[b] * 0.4 + 0.6
    save_image(rgb, os.path.join(OUT, name + '.png'))
    above = (~fog).mean()
    print(name, 'min', Z.min().round(1), 'max', Z.max().round(1), 'über Nebel', round(above, 2), 'Zeit', round(time.time() - t0, 1))
