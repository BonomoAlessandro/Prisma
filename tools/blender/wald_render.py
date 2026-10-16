# Rendert wald.blend. Aufruf:
#   blender -b wald.blend --python wald_render.py -- view <theta°> <phi-versatz> <breite> <höhe> <samples> <name> [belichtung]
#   blender -b wald.blend --python wald_render.py -- pano <breite> <höhe> <samples> <name> [lat_min lat_max lon_min lon_max] [belichtung]
# Schreibt <name>.exr (linear) und <name>.png (wie im Spiel: ACES + sRGB).
import bpy, math, sys, os, time
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from wald_lib import aces_game, srgb_encode
from wald_io import save_image, load_exr

argv = sys.argv[sys.argv.index('--') + 1:]
mode = argv[0]
sc = bpy.context.scene
sc.render.engine = 'CYCLES'

prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == 'OPTIX'
sc.cycles.device = 'GPU'
c = sc.cycles
c.use_adaptive_sampling = True
c.adaptive_threshold = 0.015
c.use_denoising = True
c.denoiser = 'OPENIMAGEDENOISE'
c.denoising_use_gpu = True
c.max_bounces = 8
c.diffuse_bounces = 2
c.glossy_bounces = 2
c.transmission_bounces = 2
from stile import stil
c.volume_bounces = stil(os.environ.get('WALD_STIL', '')).get('volumen', 2)   # dichte Wolken brauchen mehr
c.transparent_max_bounces = 4
c.sample_clamp_indirect = 4.0
c.use_light_tree = True
sc.render.film_transparent = False
sc.render.resolution_percentage = 100
sc.view_settings.view_transform = 'Standard'
sc.render.image_settings.file_format = 'OPEN_EXR'
sc.render.image_settings.color_depth = '16'
sc.render.image_settings.exr_codec = 'ZIP'

exposure = 1.0
if mode == 'view':
    theta = math.radians(float(argv[1])); phi = 0.86 + float(argv[2])
    w, h, spp, name = int(argv[3]), int(argv[4]), int(argv[5]), argv[6]
    if len(argv) > 7:
        exposure = float(argv[7])
    # wie updateCamera im Spiel (Querformat 16:10): Abstand 14.36, Blickpunkt 0.35 zur Kamera hin
    r, lead = 14.36, 0.35
    tx, tz = lead * math.sin(theta), lead * math.cos(theta)
    cx, cy, cz = tx + r * math.sin(phi) * math.sin(theta), r * math.cos(phi), tz + r * math.sin(phi) * math.cos(theta)
    cam = bpy.data.objects['Spielkamera']
    cam.location = (cx, -cz, cy)
    cam.rotation_euler = (Vector((tx, -tz, 0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
else:
    w, h, spp, name = int(argv[1]), int(argv[2]), int(argv[3]), argv[4]
    cam = bpy.data.objects['Panorama']
    cd = cam.data
    window = (cd.latitude_min, cd.latitude_max, cd.longitude_min, cd.longitude_max)   # danach zurück (offene Szene)
    if len(argv) > 8:
        cd.latitude_min, cd.latitude_max, cd.longitude_min, cd.longitude_max = (math.radians(float(v)) for v in argv[5:9])
        if len(argv) > 9:
            exposure = float(argv[9])
    elif len(argv) > 5:
        exposure = float(argv[5])
    sc.camera = cam

sc.render.resolution_x, sc.render.resolution_y = w, h
c.samples = spp
path = os.path.join(HERE, 'out', os.environ.get('WALD_STIL', ''), name + '.exr')
os.makedirs(os.path.dirname(path), exist_ok=True)
sc.render.filepath = path
t0 = time.time()
bpy.ops.render.render(write_still=True)
print('RENDERZEIT %.1f s' % (time.time() - t0), flush=True)

img = load_exr(path)[..., :3].astype(np.float64)
lum = img @ np.array([0.2126, 0.7152, 0.0722])
print('LUM Perzentile 5/25/50/75/95/99.9:', np.percentile(lum, [5, 25, 50, 75, 95, 99.9]).round(4))
disp = srgb_encode(aces_game(img * exposure))
save_image(disp, os.path.join(HERE, 'out', name + '.png'))
if mode != 'view':
    cd.latitude_min, cd.latitude_max, cd.longitude_min, cd.longitude_max = window
print('FERTIG', name)
