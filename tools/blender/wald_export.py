# Rendert die Wald-Skybox für das Spiel. Erst rendern (lineare EXR nach out/), dann kodieren (nach sky/), dann
# packen (node tools/blender/pack.mjs -> backgrounds/). Aufrufe (aus tools/blender/, wald.blend von wald_scene.py):
#   blender -b wald.blend --python wald_export.py -- full  <breite> <samples>          ganzes Equirect (4096 64)
#   blender -b wald.blend --python wald_export.py -- band  <i> <n> <breite> <samples>  Streifen i von n (… 3 4096 48)
#   blender -b wald.blend --python wald_export.py -- depth <breite>                    Tiefe (2048)
#   blender -b --python wald_export.py -- encode <n> <jpeg-qualität> <tiefe-breite>     (3 90 1024)
#   blender -b --python wald_export.py -- depthcode <tiefe-breite>                      nur die Tiefe kodieren (anime)
#   blender -b wald.blend --python wald_export.py -- mask <name> full <breite> | mask <name> band <i> <n> <breite>
#     Himmelsmaske (1 = Gelände, Bäume; 0 = Himmel), für anime.py
# In der offenen Szene über den Blender-MCP: wald_mcp.start([('wald_export.py', 'full', 4096, 64), …]) – danach ist die
# Szene wieder wie vorher (Materialien, Welt, Kamera, Sichtbarkeit).
# Streifen: Breite +10° … −90° (der Blick der Spielkamera geht immer nach unten), Kachel i deckt u ∈ [i/n, (i+1)/n] des
# ganzen Bilds ab. Equirect wie Cycles: Mitte = Blender +Y (Spiel −Z), u = 0.5 + atan2(x, y)/2π, v = acos(z)/π.
# Die Bäume näher als R_NEAR („Baeume nah“) zeichnet das Spiel selbst: Für die Kamera sind sie ausgeblendet, Schatten
# werfen sie aber.
# Farben: lineare Szenenwerte × EXPOSURE, sRGB-kodiert (das Spiel macht ACES wie bei allem anderen).
# Blender beendet sich auch nach einem Fehler im Skript mit 0 – darum die Ausgabe auf «Error» prüfen.
import bpy, math, sys, os, time, json
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from wald_lib import aces_game, srgb_encode
from wald_io import save_image, load_exr

EXPOSURE = 5.5
LAT_TOP = 10.0
DEPTH_LOG = (0.5, 6000.0)
STIL = os.environ.get('WALD_STIL', '')   # anime: Renderings nach out/anime (gemalt wird danach in anime.py)
OUT = os.path.join(HERE, 'out', STIL)
SKY = os.path.join(HERE, 'sky', STIL)
os.makedirs(OUT, exist_ok=True)
os.makedirs(SKY, exist_ok=True)
sc = bpy.context.scene
_saved = []   # (Objekt, Eigenschaft, alter Wert): was ein Schritt an der Szene ändert, setzt restore() zurück


def setv(obj, attr, value):
    _saved.append((obj, attr, getattr(obj, attr)))
    setattr(obj, attr, value)


def restore():
    while _saved:
        obj, attr, value = _saved.pop()
        setattr(obj, attr, value)


def setup_cycles():
    setv(sc.render, 'engine', 'CYCLES')   # sonst EEVEE: rendert die Panoramakamera als gewöhnliche 50-mm-Kamera
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == 'OPTIX'
    c = sc.cycles
    for attr, value in (('device', 'CPU' if os.environ.get('WALD_CPU') else 'GPU'), ('use_adaptive_sampling', True),
                        ('adaptive_threshold', 0.012), ('use_denoising', True), ('denoiser', 'OPENIMAGEDENOISE'),
                        ('denoising_use_gpu', True), ('max_bounces', 8), ('diffuse_bounces', 2), ('glossy_bounces', 2),
                        ('transmission_bounces', 2), ('volume_bounces', 2), ('transparent_max_bounces', 4),
                        ('sample_clamp_indirect', 4.0), ('samples', c.samples), ('pixel_filter_type', c.pixel_filter_type),
                        ('filter_width', c.filter_width)):
        setv(c, attr, value)
    r = sc.render
    for attr, value in (('resolution_percentage', 100), ('resolution_x', r.resolution_x), ('resolution_y', r.resolution_y),
                        ('filepath', r.filepath)):
        setv(r, attr, value)
    im = r.image_settings
    for attr, value in (('file_format', 'OPEN_EXR'), ('color_depth', '16'), ('exr_codec', 'ZIP')):
        setv(im, attr, value)
    setv(sc.view_settings, 'view_transform', 'Standard')   # neu gebaute Szenen stehen auf AgX
    setv(sc, 'camera', bpy.data.objects['Panorama'])
    cd = sc.camera.data
    for attr in ('longitude_min', 'longitude_max', 'latitude_min', 'latitude_max'):
        setv(cd, attr, getattr(cd, attr))
    # ganzes Equirect (Vorschauen aus wald_render.py können einen Ausschnitt eingestellt haben); Streifen setzen ihren
    # Ausschnitt danach selbst
    cd.longitude_min, cd.longitude_max = -math.pi, math.pi
    cd.latitude_min, cd.latitude_max = -math.pi / 2, math.pi / 2
    near = bpy.data.objects.get('Baeume nah')
    if near:
        setv(near, 'visible_camera', False)
    return c


def render(name, w, h):
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.filepath = os.path.join(OUT, name + '.exr')
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    print('RENDERZEIT', name, '%.1f s' % (time.time() - t0), flush=True)


def flat(color=None):
    """Nur Flächen ohne Nebel und Dunst, alle mit einem leuchtenden Ersatzmaterial (Position oder Weiss) vor Schwarz"""
    for name in ('Nebel', 'Dunst unten', 'Dunst oben'):
        setv(bpy.data.objects[name], 'hide_render', True)
    m = bpy.data.materials.new('Position' if color is None else 'Weiss'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new('ShaderNodeEmission')
    if color is None:   # jede Fläche leuchtet in ihrer Weltposition
        nt.links.new(nt.nodes.new('ShaderNodeNewGeometry').outputs['Position'], em.inputs['Color'])
    else:
        em.inputs['Color'].default_value = color
    nt.links.new(em.outputs[0], nt.nodes.new('ShaderNodeOutputMaterial').inputs['Surface'])
    setv(bpy.context.view_layer, 'material_override', m)
    wt = bpy.data.worlds.new('schwarz'); wt.use_nodes = True
    wt.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
    setv(sc, 'world', wt)
    return m, wt


def band_camera(i, n):
    span = 360.0 / n
    cd = sc.camera.data
    cd.longitude_min, cd.longitude_max = math.radians(-180.0 + span * i), math.radians(-180.0 + span * (i + 1))
    cd.latitude_min, cd.latitude_max = math.radians(-90.0), math.radians(LAT_TOP)
    return span


def encode_color(name, quality):
    img = load_exr(os.path.join(OUT, name + '.exr'))[..., :3].astype(np.float64) * EXPOSURE
    save_image(srgb_encode(img), os.path.join(SKY, name + '.jpg'), 'JPEG', quality)
    save_image(srgb_encode(aces_game(img)), os.path.join(OUT, name + '_vorschau.png'))   # so wie im Spiel


def encode_depth(width, center):
    """Abstand vom Panorama-Mittelpunkt, 16 Bit log in R (oben) und G (unten); 65535 = nichts getroffen (Himmel).
    Verkleinert über den Mittelwert der Log-Abstände der Treffer je Block."""
    P = load_exr(os.path.join(OUT, 'depth.exr'))[..., :3].astype(np.float64)
    hit = ~np.all(np.abs(P) < 1e-6, axis=-1)
    ld = np.log(np.maximum(np.linalg.norm(P - center, axis=-1), DEPTH_LOG[0]))
    f = P.shape[1] // width
    h, w = P.shape[0] // f, P.shape[1] // f
    cnt = hit[:h * f, :w * f].reshape(h, f, w, f).sum((1, 3))
    s = np.where(hit, ld, 0)[:h * f, :w * f].reshape(h, f, w, f).sum((1, 3))
    a, b = np.log(DEPTH_LOG[0]), np.log(DEPTH_LOG[1])
    q = np.round(np.clip((s / np.maximum(cnt, 1) - a) / (b - a), 0, 1) * 65534).astype(np.int64)
    q[cnt == 0] = 65535
    save_image(np.stack([(q >> 8) / 255.0, (q & 255) / 255.0, np.zeros(q.shape)], -1), os.path.join(SKY, 'depth.png'))


def depth_center():
    with open(os.path.join(OUT, 'depth_center.json')) as fh:
        return np.array(json.load(fh))


def main(argv):
    what = argv[0]
    temp = []   # Ersatzmaterial und -welt, nach dem Zurücksetzen gelöscht
    try:
        if what == 'full':
            c = setup_cycles()
            c.samples = int(argv[2])
            w = int(argv[1])
            render('full', w, w // 2)
        elif what == 'band':
            c = setup_cycles()
            i, n, w = int(argv[1]), int(argv[2]), int(argv[3])
            c.samples = int(argv[4])
            span = band_camera(i, n)
            render('band_%d' % i, w, int(round(w * (LAT_TOP + 90.0) / span)))
        elif what == 'depth':
            c = setup_cycles()
            temp = flat()
            # ein Abtastwert je Pixel, ohne Filter (sonst Mischwerte an Kanten)
            c.samples = 1; c.use_denoising = False; c.use_adaptive_sampling = False
            c.pixel_filter_type = 'BOX'; c.filter_width = 0.01
            sc.render.image_settings.color_depth = '32'
            w = int(argv[1])
            render('depth', w, w // 2)
            with open(os.path.join(OUT, 'depth_center.json'), 'w') as fh:
                json.dump(list(sc.camera.location), fh)
        elif what == 'mask':
            c = setup_cycles()
            temp = flat((1, 1, 1, 1))
            c.samples = 8; c.use_denoising = False; c.use_adaptive_sampling = False
            c.max_bounces = 0
            name, kind = argv[1], argv[2]
            if kind == 'band':
                i, n, w = int(argv[3]), int(argv[4]), int(argv[5])
                span = band_camera(i, n)
                render(name, w, int(round(w * (LAT_TOP + 90.0) / span)))
            else:
                w = int(argv[3])
                render(name, w, w // 2)
        elif what == 'depthcode':
            encode_depth(int(argv[1]), depth_center())
            print('KODIERT', os.path.join(SKY, 'depth.png'))
        elif what == 'encode':
            n, quality, depth_w = int(argv[1]), int(argv[2]), int(argv[3])
            for name in ['full'] + ['band_%d' % i for i in range(n)]:
                encode_color(name, quality)
            center = depth_center()
            encode_depth(depth_w, center)
            vt = (90.0 - LAT_TOP) / 180.0
            data = {'center': [center[0] + 0.0, center[2] + 0.0, 0.0 - center[1]],   # Blender (x, y, z) -> Spiel (x, z, −y)
                    'full': 'full.jpg', 'depth': 'depth.png', 'depthLog': list(DEPTH_LOG),
                    'bands': [{'file': 'band_%d.jpg' % i, 'u': [i / n, (i + 1) / n], 'v': [vt, 1.0]} for i in range(n)]}
            with open(os.path.join(SKY, 'sky.json'), 'w', encoding='utf-8') as fh:
                json.dump(data, fh, indent=2)
            print('KODIERT', sorted(os.listdir(SKY)))
        else:
            raise ValueError('unbekannter Schritt: %s' % what)
    finally:
        restore()
        if temp:
            bpy.data.materials.remove(temp[0])
            bpy.data.worlds.remove(temp[1])


if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:])
