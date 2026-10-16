# Malt ein lineares Rendering im Stil eines Anime-Hintergrunds (Ghibli): Farbgebung, Pinselstriche (anisotroper
# Kuwahara-Filter des Kompositors), Leuchten. Entworfen wird das Bild, wie es im Spiel erscheint (nach ACES und sRGB);
# zurückgerechnet auf lineare Werte vor ACES, die das Spiel wie alles andere abbildet.
# Renderings aus der Anime-Szene (WALD_STIL=anime wald_scene.py / wald_export.py / wald_render.py) in out/anime/:
#   blender -b --factory-startup --python anime.py -- test  <name>          Spielansicht -> out/anime/<name>_anime.png
#   blender -b --factory-startup --python anime.py -- pano  <name> [ziel] [maske]   Equirect -> Vorschau, mit ziel
#     sky/anime/<ziel>.jpg; maske: Himmelsmaske aus wald_export.py mask (sonst aus der Tiefenkarte)
#   blender -b --factory-startup --python anime.py -- json <n>              sky/anime/sky.json (Tiefe vorher mit
#     WALD_STIL=anime wald_export.py depth 2048 und depthcode 1024: ohne die nahen Bäume, die das Spiel zeichnet)
#   (bands erwartet out/anime/mask_band_i.exr)
#   blender -b --factory-startup --python anime.py -- bands <n>             Streifen band_0 … -> sky/anime/band_i.jpg
# Über den Blender-MCP in der offenen Szene: wald_mcp.run('anime.py', 'test', '<name>') usw. (gemalt wird in einer
# eigenen, vorübergehenden Szene; die offene bleibt unberührt).
import bpy, sys, os
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from wald_lib import aces_game, srgb_encode
from wald_io import save_image, load_exr
from stile import stil

STIL = os.environ.get('WALD_STIL') or 'anime'   # Szene (stile.py): Wald 'anime', Strand 'beach'
S = stil(STIL)
OUT = os.path.join(HERE, 'out', STIL)
SKY = os.path.join(HERE, 'sky', STIL)
os.makedirs(OUT, exist_ok=True)
os.makedirs(SKY, exist_ok=True)
EXPOSURE = S['belichtung']
# hellster Szenenwert: Werte über 1 erfasst der Bloom des Spiels, ein Schleier läge über dem Brett. Szenen mit satten,
# warmen Lichtern setzen ihn unter TEX_MAX (stile.py spitze), sonst kappte TEX_MAX das Ende der Schulter hart
PEAK = S.get('spitze', 0.95)
# Obergrenze in der Textur: Satte, warme Töne (Sonne, ihr Spiegelbild) bräuchten zurückgerechnet in einzelnen Kanälen
# mehr als PEAK; dazu Spielraum für das Überschwingen des JPEG an Kanten (sonst 255, also 1.0)
TEX_MAX = 0.91
YMAX = float(aces_game(np.full(3, PEAK))[0])   # dieselbe Spitze als Anzeige-Wert (linear, vor sRGB)

_IN_M = np.array([[0.59719, 0.35458, 0.04823], [0.07600, 0.90834, 0.01566], [0.02840, 0.13383, 0.83777]])
_OUT_M = np.array([[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]])


def srgb_decode(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def aces_inverse(d):
    """Anzeige (linear, 0…~1) -> Szenenwert vor ACES (wie aces_game mit Belichtung 1)."""
    y = np.clip(d @ np.linalg.inv(_OUT_M).T, 0.0, 1.0)
    # y = (x² + 0.0245786 x − 0.000090537) / (0.983729 x² + 0.4329510 x + 0.238081)  ->  quadratisch in x
    a = 1 - 0.983729 * y
    b = 0.0245786 - 0.4329510 * y
    c = -0.000090537 - 0.238081 * y
    x = (-b + np.sqrt(np.maximum(b * b - 4 * a * c, 0))) / (2 * np.maximum(a, 1e-4))
    return np.maximum(x @ np.linalg.inv(_IN_M).T, 0) * 0.6


def gamut(disp, ymax=YMAX):
    """Anzeige-Farben ins darstellbare Feld der ACES-Kurve holen: zu satte oder zu helle Farben Richtung ihrer Helligkeit
    entsättigen (statt einen Kanal abzuschneiden – dann kippte Hellblau ins Türkis). ymax: hellste Anzeige (PEAK)."""
    lin = srgb_decode(disp)
    lum = (lin @ np.array([0.2126, 0.7152, 0.0722]))[..., None]
    inv = np.linalg.inv(_OUT_M).T
    best = np.zeros(lin.shape[:2])
    for s in np.linspace(1, 0, 21)[::-1]:                     # grösste Sättigung, die passt
        y = (lum + s * (lin - lum)) @ inv
        ok = np.all((y >= 0) & (y <= ymax), -1)
        best = np.where(ok, s, best)
    lum = np.minimum(lum, ymax * 0.98)
    return srgb_encode(lum + best[..., None] * (np.minimum(lin, 1) - lum))


def shoulder(disp, knee=None):
    """Helles weich unter die Spitze drücken, nach dem hellsten Kanal (wie gamut() ihn prüft): Der helle Nebel wird
    dunkler, bleibt aber hellblau – sonst entsättigte gamut() ihn zu Grauweiss. knee: Anteil der Spitze, ab dem die
    Kurve einsetzt (Szene: stile.py knie, sonst 0.6)."""
    knee = S.get('knie', 0.6) if knee is None else knee
    lin = srgb_decode(disp)
    m = np.max(lin @ np.linalg.inv(_OUT_M).T, -1)
    k, top = knee * YMAX, 0.97 * YMAX
    soft = np.where(m > k, k + (top - k) * (1 - np.exp(-(m - k) / (top - k))), m)
    return srgb_encode(lin * (soft / np.maximum(m, 1e-6))[..., None])


def kuwahara(img, size, uniformity=4, sharpness=0.8, eccentricity=1.0, chunk=4096):
    """Anisotroper Kuwahara-Filter des Blender-Kompositors (Pinselstriche entlang der Kanten). Breite Bilder in
    überlappenden Stücken (am Stück stürzte Blender bei 12 288 Pixeln Breite ab)."""
    w = img.shape[1]
    if w > chunk + 512:
        m = 8 * size
        out = np.empty_like(img)
        for x0 in range(0, w, chunk):
            a0, a1 = max(0, x0 - m), min(w, x0 + chunk + m)
            part = kuwahara(img[:, a0:a1], size, uniformity, sharpness, eccentricity, chunk)
            out[:, x0:min(w, x0 + chunk)] = part[:, x0 - a0:x0 - a0 + min(chunk, w - x0)]
        return out
    h, w, _ = img.shape
    tmp_in = os.path.join(OUT, '_kuw_in.exr'); tmp_out = os.path.join(OUT, '_kuw_out.exr')
    im = bpy.data.images.new('kuw_in', w, h, alpha=True, float_buffer=True)
    im.colorspace_settings.name = 'Non-Color'
    px = np.ones((h, w, 4), np.float32); px[..., :3] = img[::-1]
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = tmp_in; im.file_format = 'OPEN_EXR'; im.save()
    bpy.data.images.remove(im)
    sc = bpy.data.scenes.new('kuwahara')   # eigene Szene: die offene (z. B. über den Blender-MCP) bleibt, wie sie ist
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = w, h, 100
    sc.render.use_compositing = True
    sc.view_settings.view_transform = 'Standard'
    sc.render.image_settings.file_format = 'OPEN_EXR'
    sc.render.image_settings.color_depth = '32'
    ng = bpy.data.node_groups.new('anime', 'CompositorNodeTree')
    ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    src = ng.nodes.new('CompositorNodeImage')
    src.image = bpy.data.images.load(tmp_in, check_existing=False)
    src.image.colorspace_settings.name = 'Non-Color'
    k = ng.nodes.new('CompositorNodeKuwahara')
    k.inputs['Type'].default_value = 'Anisotropic'
    k.inputs['Size'].default_value = size
    k.inputs['Uniformity'].default_value = uniformity
    k.inputs['Sharpness'].default_value = sharpness
    k.inputs['Eccentricity'].default_value = eccentricity
    k.inputs['High Precision'].default_value = True
    out = ng.nodes.new('NodeGroupOutput')
    ng.links.new(src.outputs['Image'], k.inputs['Image'])
    ng.links.new(k.outputs['Image'], out.inputs[0])
    sc.compositing_node_group = ng
    sc.render.filepath = tmp_out
    bpy.ops.render.render(write_still=True, scene=sc.name)
    res = load_exr(tmp_out)[..., :3].astype(np.float64)
    bpy.data.images.remove(src.image)
    bpy.data.node_groups.remove(ng)
    bpy.data.scenes.remove(sc)
    return res


def blur(img, sigma):
    """Gauss über eine verkleinerte Fassung (schnell, für das Leuchten)."""
    f = max(1, int(sigma // 2))
    h, w = img.shape[:2]
    small = img[:h - h % f, :w - w % f].reshape(h // f, f, w // f, f, -1).mean((1, 3))
    s = sigma / f
    r = int(3 * s) + 1
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * s * s)); k /= k.sum()
    for axis in (0, 1):
        pad = [(0, 0)] * 3; pad[axis] = (r, r)
        p = np.pad(small, pad, mode='wrap' if axis == 1 else 'edge')
        small = sum(k[i] * np.take(p, np.arange(i, i + small.shape[axis]), axis=axis) for i in range(2 * r + 1))
    big = np.repeat(np.repeat(small, f, 0), f, 1)
    return np.pad(big, ((0, h - big.shape[0]), (0, w - big.shape[1]), (0, 0)), mode='edge')


def smoothstep_np(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


STAR_COUNT = 5000
MOON_B = np.array([-0.8, -0.25, 0.5]) / np.linalg.norm([-0.8, -0.25, 0.5])   # wie in wald_scene.py
SKY_STOPS = [   # Himmel nach Höhe über dem Horizont (0 … 1 = sin der Höhe)
    (0.00, (0.560, 0.670, 0.800)),
    (0.05, (0.330, 0.450, 0.630)),
    (0.16, (0.170, 0.270, 0.480)),
    (0.38, (0.085, 0.150, 0.340)),
    (0.70, (0.045, 0.085, 0.230)),
    (1.00, (0.030, 0.055, 0.170)),
]


def anime_sky(uu, vv, px_per_deg, stars):
    """Gemalter Nachthimmel: Verlauf, Mond als klare Scheibe mit weichem Hof, Wolkenbänder, Sterne (Anzeige-Farben)."""
    from wald_lib import Perlin, fbm
    lon = (uu - 0.5) * 2 * np.pi; lat = np.pi / 2 - vv * np.pi
    d = np.stack([np.cos(lat) * np.sin(lon), np.cos(lat) * np.cos(lon), np.sin(lat)], -1)
    col = gradient_map(np.clip(np.sin(lat), 0, 1), SKY_STOPS)
    ang = np.arccos(np.clip(d @ MOON_B, -1, 1))
    # Wolken: lockere Bänke tief am Himmel, zum Mond hin hell angestrahlt
    n = fbm(Perlin(91), d[..., 0] * 2.2 / np.maximum(np.cos(lat), 0.2), d[..., 1] * 2.2 / np.maximum(np.cos(lat), 0.2) + lat * 9, 4)
    band = smoothstep_np(0.03, 0.12, lat) * (1 - smoothstep_np(0.35, 0.6, lat))
    cloud = smoothstep_np(0.05, 0.3, n) * band
    lit = np.exp(-ang / 0.5)
    ccol = (np.array([0.10, 0.16, 0.30]) * (1 - lit[..., None]) + np.array([0.62, 0.68, 0.78]) * lit[..., None])
    rim = smoothstep_np(0.05, 0.12, n) * (1 - smoothstep_np(0.12, 0.3, n)) * band * lit * 0.5
    col = col * (1 - cloud[..., None]) + ccol * cloud[..., None] + rim[..., None] * np.array([0.7, 0.75, 0.8])
    # Hof und Mond
    halo = np.exp(-ang / 0.09) * 0.55 + np.exp(-ang / 0.3) * 0.22
    col = 1 - (1 - col) * (1 - halo[..., None] * np.array([0.78, 0.84, 0.9]))
    R = 0.016
    disk = np.clip((R - ang) * np.degrees(1) * px_per_deg + 0.5, 0, 1)
    maria = fbm(Perlin(17), d[..., 0] * 120, d[..., 1] * 120 + d[..., 2] * 60, 3)
    mcol = np.array([0.98, 0.97, 0.90]) - smoothstep_np(0.0, 0.3, maria)[..., None] * np.array([0.10, 0.10, 0.08])
    col = col * (1 - disk[..., None]) + mcol * disk[..., None]
    star = stars * (1 - cloud) * (1 - smoothstep_np(0.02, 0.0, ang - 0.05))
    return np.clip(col + star[..., None] * (1 - col) * np.array([0.92, 0.96, 1.0]), 0, 1)


def blend_sky(disp, uu, vv, px_per_deg, mask, stars):
    """Himmel (Maske 0) durch den gemalten ersetzen; nahe am Horizont bleibt der Dunst aus dem Rendering"""
    lat = np.pi / 2 - vv * np.pi
    w = (1 - mask) * smoothstep_np(np.radians(0.3), np.radians(4.0), lat)
    return gamut(shoulder(disp * (1 - w[..., None]) + anime_sky(uu, vv, px_per_deg, stars) * w[..., None]))


def star_layer(u, v, px_per_deg, sky):
    """Sterne als klare Punkte (wie gemalt, nicht vom Pinsel verwischt): feste Zufallsrichtungen über dem Horizont,
    dunkel bis hell (wenige helle), ein Hauch Farbe. u, v: Equirect-Lage der Bildpunkte (Raster), sky: Himmel ja/nein."""
    rng = np.random.default_rng(11)
    z = rng.uniform(0.02, 1.0, STAR_COUNT) ** 0.8          # über dem Horizont, zum Horizont hin etwas dichter
    a = rng.uniform(-np.pi, np.pi, STAR_COUNT)
    b = np.minimum(rng.pareto(2.2, STAR_COUNT) * 0.18 + 0.12, 1.0)
    su, sv = 0.5 + a / (2 * np.pi), np.arccos(z) / np.pi
    h, w = u.shape
    u0, v0 = u[0, 0], v[0, 0]
    du, dv = (u[0, -1] - u0) / max(w - 1, 1), (v[-1, 0] - v0) / max(h - 1, 1)
    x = (su - u0) / du; y = (sv - v0) / dv
    inside = (x > -2) & (x < w + 1) & (y > -2) & (y < h + 1)
    x, y, b = x[inside], y[inside], b[inside]
    lay = np.zeros((h, w))
    r = 0.45 * max(px_per_deg / 30.0, 0.5)                  # Punktgrösse in Pixeln
    xi, yi = np.round(x).astype(int), np.round(y).astype(int)
    for ox in range(-2, 3):
        for oy in range(-2, 3):
            px, py = xi + ox, yi + oy
            ok = (px >= 0) & (px < w) & (py >= 0) & (py < h)
            g = b * np.exp(-((px - x) ** 2 + (py - y) ** 2) / (2 * r * r))
            np.add.at(lay, (py[ok], px[ok]), g[ok])
    return np.clip(lay, 0, 1) * sky


def gradient_map(t, stops):
    """t 0…1 -> Farbe aus Stützstellen [(t, (r, g, b)), …] (Anzeige-Farben)."""
    ts = np.array([s[0] for s in stops]); cs = np.array([s[1] for s in stops])
    return np.stack([np.interp(t, ts, cs[:, i]) for i in range(3)], -1)


def paint_field(seed=5, w=2048, h=1024):
    """Unregelmässige Farbschwankung wie bei Gouache: Rauschen auf dem ganzen Equirect (rundum nahtlos), Mittel 0."""
    rng = np.random.default_rng(seed)
    f = np.zeros((h, w, 1))
    for sigma, amp in ((7.0, 0.45), (22.0, 0.6)):
        f += amp * blur(rng.standard_normal((h, w, 1)), sigma) * sigma ** 0.5
    return (f / f.std())[..., 0]


def sample(field, u, v):
    """field (Equirect) bilinear an u, v (0…1)"""
    h, w = field.shape
    x = u * w - 0.5; y = np.clip(v * h - 0.5, 0, h - 1)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = x - x0; fy = y - y0
    x0 %= w; x1 = (x0 + 1) % w; y1 = np.minimum(y0 + 1, h - 1)
    return (field[y0, x0] * (1 - fx) + field[y0, x1] * fx) * (1 - fy) + (field[y1, x0] * (1 - fx) + field[y1, x1] * fx) * fy


def stylize(lin, px_per_deg, noise, wrap=False, stars=None):
    """lineares Rendering (× EXPOSURE) -> Anzeige-Bild (sRGB-kodiert) im Anime-Stil. noise: Farbschwankung je Pixel.
    wrap: Bild reicht rundum (360°), die Ränder gehen ineinander über."""
    disp = srgb_encode(aces_game(blur(lin, 0.7)))           # so sähe es heute im Spiel aus (Renderrauschen geglättet)
    lum = disp @ np.array([0.2126, 0.7152, 0.0722])
    if S.get('stops'):
        t = np.clip(lum / 0.78, 0, 1) ** 0.62                   # Dunkles gespreizt: Anime-Nächte bleiben lesbar
        pal = gradient_map(t, S['stops'])
        # eigene Farbe der Szene behalten (grünliche Bäume, Mondhof), verstärkt
        col = pal + (disp - lum[..., None]) * (1.6 * smoothstep_np(0.06, 0.3, lum) * (1 - smoothstep_np(0.4, 0.7, lum)))[..., None]  # nicht im Dunkeln (Rauschen), nicht im hellen Nebel
    else:
        # Farben der Szene, satter; in die Schatten mischt sich eine Farbe (gemalte Schatten sind nie schwarz)
        col = lum[..., None] + (disp - lum[..., None]) * S['saettigung']
        col = col + (1 - smoothstep_np(0.0, 0.45, lum))[..., None] * np.array(S['schatten'])
        if 'licht' in S:   # Abendlicht: helle Töne wärmer
            col = col * (1 + smoothstep_np(0.35, 0.85, lum)[..., None] * (np.array(S['licht']) - 1))
    # Pinselstriche (rundum: mit Rand aus der Gegenseite, sonst entstünde an der Naht eine Kante)
    size = max(2, int(round(px_per_deg * 0.28)))
    m = 4 * size if wrap else 0
    padded = np.concatenate([col[:, -m:], col, col[:, :m]], 1) if m else col
    col = kuwahara(np.clip(padded, 0, 1), size=size)
    if m:
        col = col[:, m:-m]
    # gemalte Flächen sind nie ganz gleichmässig (Stärke je Szene: stile.py rauschen; im gerenderten Himmel fleckig)
    col = col * (1 + S.get('rauschen', 0.02) * noise[..., None])
    # Leuchten: Nebel und Mond strahlen weich in die Umgebung
    l2 = col @ np.array([0.2126, 0.7152, 0.0722])
    bright = np.clip((l2 - 0.62) / 0.3, 0, 1)[..., None] * col
    glow = blur(bright, px_per_deg * 1.2) * 0.35 + blur(bright, px_per_deg * 4.0) * 0.2
    col = 1 - (1 - col) * (1 - glow * np.array(S['glut']))  # „Screen“
    if stars is not None:
        col = col + stars[..., None] * (1 - col) * np.array([0.92, 0.96, 1.0])
    return gamut(shoulder(np.clip(col, 0, 1)))


def sky_mask():
    """Himmel (nichts getroffen) aus der Tiefenkarte der realistischen Fassung (gleiches Gelände), als Equirect 0/1"""
    d = load_exr(os.path.join(HERE, 'sky', 'depth.png'))
    code = np.round(d[..., 0] * 255) * 256 + np.round(d[..., 1] * 255)
    return (code == 65535).astype(np.float64)


def to_texture(disp):
    """Anzeige-Bild -> was die Textur speichert: Szenenwert vor ACES, sRGB-kodiert"""
    return srgb_encode(np.clip(aces_inverse(srgb_decode(disp)), 0, TEX_MAX))


def in_game(disp):
    """Anzeige-Bild -> wie es aus der Textur im Spiel erscheint (Prüfbild)"""
    return srgb_encode(aces_game(np.clip(aces_inverse(srgb_decode(disp)), 0, TEX_MAX)))


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:]
    field = paint_field()
    if argv[0] == 'test':
        # Vorschau aus Sicht der Spielkamera (aus wald_render.py)
        name = argv[1]
        lin = load_exr(os.path.join(OUT, name + '.exr'))[..., :3].astype(np.float64) * EXPOSURE
        h, w = lin.shape[:2]
        ppd = h / 32.0   # Spielkamera: 32° Sichtfeld senkrecht
        yy, xx = np.mgrid[0:h, 0:w]
        disp = stylize(lin, ppd, sample(field, xx / (8 * w), yy / (4 * h)))
        game = in_game(disp)
        save_image(game, os.path.join(OUT, name + '_anime.png'))
        print('ANIME', name, 'Abweichung Rückrechnung', np.abs(game - disp).mean().round(4))
    elif argv[0] == 'pano':
        # ganzes Equirect (Vorschau oder full): out/<name>.exr -> sky/<ziel>.jpg und out/<name>_anime.png
        src = argv[1]; dst = argv[2] if len(argv) > 2 else None
        lin = load_exr(os.path.join(OUT, src + '.exr'))[..., :3].astype(np.float64) * EXPOSURE
        h, w = lin.shape[:2]
        v, u = np.mgrid[0:h, 0:w]
        uu, vv = (u + 0.5) / w, (v + 0.5) / h
        disp = stylize(lin, w / 360.0, sample(field, uu, vv), wrap=True)
        if S['himmel'] == 'mondnacht':
            stars = star_layer(uu, vv, w / 360.0, 1.0)
            mask = load_exr(os.path.join(OUT, argv[3] + '.exr'))[..., 0] if len(argv) > 3 else 1 - sample(sky_mask(), uu, vv)
            disp = blend_sky(disp, uu, vv, w / 360.0, np.clip(mask, 0, 1), stars)
        save_image(in_game(disp), os.path.join(OUT, src + '_anime.png'))
        if dst:
            save_image(to_texture(disp), os.path.join(SKY, dst + '.jpg'), 'JPEG', 90)
        print('ANIME', src)
    elif argv[0] == 'json':
        # Beschreibung für pack.mjs: Mittelpunkt und Hauptlicht vom Rendern der Tiefe (WALD_STIL=anime wald_export.py
        # depth), Streifen, hellster Wert und Farbringe aus den fertigen Bildern
        import json
        from wald_export import DEPTH_LOG, LAT_TOP, depth_center, light_dir, measure_sky
        n = int(argv[1]); vt = (90.0 - LAT_TOP) / 180.0
        c = depth_center(OUT)
        data = {'center': [c[0] + 0.0, c[2] + 0.0, 0.0 - c[1]],   # Blender (x, y, z) -> Spiel (x, z, −y)
                'full': 'full.jpg', 'depth': 'depth.png', 'depthLog': list(DEPTH_LOG),
                'bands': [{'file': 'band_%d.jpg' % i, 'u': [i / n, (i + 1) / n], 'v': [vt, 1.0]} for i in range(n)],
                'light': {'dir': light_dir(OUT)}}
        data.update(measure_sky(SKY, data['full'], [b['file'] for b in data['bands']]))
        with open(os.path.join(SKY, 'sky.json'), 'w', encoding='utf-8') as fh:
            json.dump(data, fh, indent=2)
        print('ANIME json', 'Spitze', data['peak'])
    elif argv[0] == 'bands':
        # Streifen band_0 … band_{n-1} zusammen (rundum nahtlos) -> sky/band_i.jpg
        from wald_export import LAT_TOP
        n = int(argv[1]); vt = (90.0 - LAT_TOP) / 180.0
        tiles = [load_exr(os.path.join(OUT, 'band_%d.exr' % i))[..., :3].astype(np.float32) for i in range(n)]
        lin = np.concatenate(tiles, 1).astype(np.float64) * EXPOSURE
        del tiles
        h, w = lin.shape[:2]
        v, u = np.mgrid[0:h, 0:w]
        uu, vv = (u + 0.5) / w, vt + (v + 0.5) / h * (1 - vt)
        disp = stylize(lin, w / 360.0, sample(field, uu, vv), wrap=True)
        if S['himmel'] == 'mondnacht':
            stars = star_layer(uu, vv, w / 360.0, 1.0)
            mask = np.concatenate([load_exr(os.path.join(OUT, 'mask_band_%d.exr' % i))[..., 0] for i in range(n)], 1)
            disp = blend_sky(disp, uu, vv, w / 360.0, np.clip(mask, 0, 1), stars)
        del lin
        tw = w // n
        for i in range(n):
            part = disp[:, i * tw:(i + 1) * tw]
            save_image(to_texture(part), os.path.join(SKY, 'band_%d.jpg' % i), 'JPEG', 90)
            save_image(in_game(part), os.path.join(OUT, 'band_%d_anime.png' % i))
        print('ANIME Streifen', n)
