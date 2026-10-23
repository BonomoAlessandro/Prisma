# Baut die Blender-Szene „Vulkan mit Lava“ (Skybox volcano, gemalt wie der Strand, PLAN 1.2). Über den Blender-MCP:
# wald_mcp.neu('volcano') baut sie und speichert tools/blender/volcano.blend; einzelne Teile neu mit
# wald_mcp.scene('volcano').replace_…().
# Aufbau: Das Brett schwebt über einem Feld aus erkalteter, schwarzvioletter Lava (Schollen mit glühenden Rissen); rechts
# neben dem Brett fliesst ein Lavastrom vom Vulkan herab, vorn links liegt ein kleiner Lavasee. Hinten (Blender +y),
# etwas links, steht der grosse Vulkankegel mit glühendem Krater und Lavaströmen an den Flanken; aus dem Krater steigt
# eine Aschesäule, unten orange angestrahlt. Rundum dunkle, zackige Berge. Abenddämmerung: Die Sonne ist eben rechts
# untergegangen (glühender Horizont), oben ein tiefes Violett; dunkle Aschewolken treiben über den Himmel.
# Anime-Look wie beim Strand: klare Farbflächen (wenige, flächige Materialfarben), farbige statt schwarze Schatten,
# gesättigt; gemalt wird danach in anime.py (Stil „volcano“ in stile.py).
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Boden bei z ≈ −3.5, Panorama-Mittelpunkt
# (0, 0, 3). Wolken und Aschesäule liegen in der Sammlung „Volumen“ (nicht in Tiefe und Himmelsmaske). Nahe Objekte, die
# das Spiel selbst zeichnen müsste, gibt es (noch) nicht: keine Ebenen, export() schreibt nichts.
# Bausteine (Ringgitter, Wolkenform, Luftperspektive) kommen aus der Strand-Szene.
import bpy, math, os, sys, time, importlib.util
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from wald_lib import Perlin, fbm, ridged, smoothstep
from wald_scene import make_mesh, NT


def _strand():
    """Baumodul der Strand-Szene (ohne Aufbau): Ringgitter, Wolkenform, Knotengruppen"""
    name = 'szene_beach'
    if name not in sys.modules:
        spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'szenen', 'beach', 'szene.py'))
        mod = importlib.util.module_from_spec(spec)
        sys.modules[name] = mod
        spec.loader.exec_module(mod)
    return sys.modules[name]


S = _strand()
T0 = time.time()
def log(*a):
    print('[%6.1fs]' % (time.time() - T0), *a, flush=True)


FLOOR = -3.5          # Boden ums Brett
PANO_CENTER = (0.0, 0.0, 3.0)
SUN_ELEV = 2.0        # Grad: eben untergegangen ist sie noch nicht ganz – nur noch Streiflicht, der Horizont glüht
SUN_AZ = 72.0         # Grad von +y über +x: rechts, etwas nach hinten
SUN = Vector((math.sin(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_ELEV)),
              math.cos(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_ELEV)), math.sin(math.radians(SUN_ELEV)))).normalized()
EXTENT = 30000.0
# Vulkan: Mitte (x, y), Höhe des Kraterrands, Radius am Fuss, Radius des Kraters, Tiefe des Kraters
VOLCANO = (-700.0, 3000.0, 1800.0, 2500.0, 200.0, 120.0)
# Lavaströme an den Flanken: Richtung (Grad von +y über +x, vom Krater aus), Breite (m), wie weit hinab (Anteil)
FLANK_FLOWS = [(178.0, 70.0, 0.95), (205.0, 45.0, 0.7), (150.0, 40.0, 0.62), (240.0, 35.0, 0.5)]
# Lavastrom in der Ebene: Punkte (x, y) vom Fuss des Vulkans bis vorn ins Tal, Breite wächst nach vorn
RIVER = [(-430.0, 1050.0), (-240.0, 640.0), (-60.0, 330.0), (30.0, 150.0), (24.0, 60.0), (17.0, 12.0), (19.0, -30.0),
         (36.0, -90.0), (90.0, -210.0), (210.0, -420.0), (420.0, -800.0), (800.0, -1500.0)]
RIVER_W = 5.5         # halbe Breite neben dem Brett (m)
LAKE = (-62.0, -48.0, 17.0)   # Lavasee vorn links: x, y, Radius
B1, B2, B3, B4, B5, B6 = (Perlin(s) for s in (211, 223, 227, 229, 233, 239))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


def collection(name, exclude=False):
    return S.collection(name, exclude)


# ---------------------------------------------------------------- Gelände

class Ground:
    """Gelände an Punkten: z, lava (glühende Lava 0 … 1), crust (Schollen mit Rissen 0 … 1), ash (Aschehang 0 … 1),
    peak (Berge 0 … 1)"""


def _polyline_dist(x, y, pts):
    """Abstand zur Linie durch pts und Lage entlang (0 … 1)"""
    P = np.asarray(pts, float)
    best = np.full(np.shape(x), np.inf); along = np.zeros(np.shape(x))
    seg = np.hypot(*(P[1:] - P[:-1]).T); acc = np.concatenate([[0], np.cumsum(seg)]); total = acc[-1]
    for k in range(len(P) - 1):
        ax, ay = P[k]; bx, by = P[k + 1]
        dx, dy = bx - ax, by - ay
        t = np.clip(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1)
        d = np.hypot(x - ax - t * dx, y - ay - t * dy)
        m = d < best
        best = np.where(m, d, best); along = np.where(m, (acc[k] + t * seg[k]) / total, along)
    return best, along


def volcano(x, y):
    """Höhe des Kegels (über dem Boden), Lava an den Flanken, Ascheanteil"""
    vx, vy, vh, vr, cr, cd = VOLCANO
    dx, dy = x - vx, y - vy
    ang = np.degrees(np.arctan2(dx, dy))
    wob = 0.06 * fbm(B1, dx / 300, dy / 300, 3)
    d = np.hypot(dx, dy) / vr * (1 + wob)
    # konkave Flanken (Stratovulkan), der Fuss läuft flach aus; oben der Kraterrand, innen der Trichter
    cone = vh * np.clip(1 - d, 0, None) ** 1.9 / (1 - cr / vr) ** 1.9
    rim = cr / vr
    inner = np.clip(d / rim, 0, 1)
    cone = np.where(d < rim, vh - cd * (1 - inner ** 2), cone)
    # Rinnen in den Flanken (Erosion): Grate quer zur Fallrichtung
    gully = ridged(B2, np.cos(np.radians(ang)) * 6 + d * 2, np.sin(np.radians(ang)) * 6 - d * 2, 4)
    cone = cone * (1 + 0.07 * (gully - 0.5) * smoothstep(rim, rim * 2.5, d))
    lava = np.zeros_like(x)
    for a, w, reach in FLANK_FLOWS:
        da = (ang - a + 180) % 360 - 180
        meander = 3.5 * fbm(B3, d * 4 + a, a * 0.1, 2)
        dist_m = np.abs(np.radians(da + meander)) * np.hypot(dx, dy)
        lava = np.maximum(lava, smoothstep(w, w * 0.35, dist_m) * smoothstep(rim * 0.9, rim * 1.1, d)
                          * (1 - smoothstep(reach - 0.12, reach, d)))
    lava = np.maximum(lava, smoothstep(rim * 0.75, rim * 0.5, d))   # Kratersee
    cone = cone - 6.0 * lava * (d > rim)
    ash = smoothstep(0.95, 0.25, d)
    return cone, lava, ash


def ground(x, y):
    x = np.asarray(x, float); y = np.asarray(y, float)
    g = Ground()
    r = np.hypot(x, y)
    # Lavafeld: wellig, Schollen und Wülste (Pahoehoe), weiter draussen sanfte Hügel
    flow = 0.35 * fbm(B4, x * 0.12, y * 0.12, 3) + 0.15 * fbm(B5, x * 0.6, y * 0.6, 2)
    rolling = 14 * fbm(B5, x / 260 + 3, y / 260 - 2, 4) * smoothstep(60, 600, r)
    h = flow + rolling
    # Strom in der Ebene: eine Rinne mit leicht erhöhten Dämmen
    dr, along = _polyline_dist(x, y, RIVER)
    width = RIVER_W * (1 + 2.5 * along) * (1 + 0.25 * fbm(B6, x / 25, y / 25, 2))
    river = smoothstep(width, width * 0.55, dr)
    levee = np.exp(-((dr - width * 1.25) / (width * 0.4)) ** 2)
    h = h - 0.9 * river + 0.6 * levee
    # Lavasee
    lx, ly, lr = LAKE
    dl = np.hypot(x - lx, y - ly) * (1 + 0.15 * fbm(B6, x / 12, y / 12, 2))
    lake = smoothstep(lr, lr * 0.8, dl)
    h = h - 1.2 * lake + 0.8 * np.exp(-((dl - lr * 1.15) / 4) ** 2)
    # zackige Berge rundum (dunkle Silhouetten), zum Vulkan hin offen
    ang = np.arctan2(x, y)
    ring = smoothstep(2500, 5500, r) * (1 - smoothstep(14000, 20000, r))
    open_ = 1 - 0.85 * np.exp(-((np.degrees(ang) + 13) / 30) ** 2)
    peaks = ridged(B1, x / 1400, y / 1400, 5) ** 1.6 * 1300 * ring * open_
    g.peak = smoothstep(150, 700, peaks)
    cone, vlava, ash = volcano(x, y)
    h = h + np.maximum(cone, 0)
    g.z = FLOOR + h
    g.lava = np.maximum(np.maximum(river, lake), vlava)
    # Schollen mit glühenden Rissen: um Strom und See (frisch erkaltet), sonst nur hier und da
    g.crust = np.maximum(smoothstep(width * 2.6, width * 0.9, dr), smoothstep(lr * 1.8, lr * 1.0, dl))
    g.crust = np.maximum(g.crust, 0.35 * smoothstep(0.55, 0.75, 0.5 + 0.5 * fbm(B3, x / 40, y / 40, 3)) * smoothstep(400, 60, r))
    g.ash = np.maximum(ash, g.peak * 0.4)
    g.z = g.z + peaks
    return g


def terrain_mesh():
    X, Y, F = S.ring_mesh('Gelaende', 1024, 1.5, EXTENT)
    # Mitte unter dem Brett schliessen (am Strand deckt sie das Wasser): ein Fächer zum innersten Ring
    n = 1024
    X = np.concatenate([X, [0.0]]); Y = np.concatenate([Y, [0.0]])
    j = np.arange(n)
    fan = np.stack([np.full(n, len(X) - 1), (j + 1) % n, j], -1)
    g = ground(X, Y)
    me = make_mesh('Gelaende', np.stack([X, Y, g.z], -1), [F, fan])
    S.attrs(me, lava=g.lava, crust=g.crust, ash=g.ash, peak=g.peak)
    log('Gelände', len(X), 'Ecken')
    return me


LAVA_STRENGTH = 4.5   # Leuchten der Lava (die Belichtung der Szene ist auf das Dämmerlicht eingestellt)


def lava_color(t, pos, scale=1.0):
    """Farbe der Lava nach Hitze: Kruste dunkelrot, Ströme orange, die heissesten Adern gelb (klare Stufen wie gemalt)"""
    n = t.node('ShaderNodeTexNoise', in_Scale=0.08 / scale, in_Detail=3.0, in_Roughness=0.55); t.link(pos, n.inputs['Vector'])
    w = t.node('ShaderNodeTexWave', in_Scale=0.05 / scale, in_Distortion=6.0, in_Detail=2.0); t.link(pos, w.inputs['Vector'])
    heat = t.math('ADD', t.math('MULTIPLY', n.outputs['Fac'], 0.7), t.math('MULTIPLY', w.outputs['Fac'], 0.35))
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp; cr.interpolation = 'CONSTANT'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.55, 0.035, 0.01, 1)
    cr.elements[1].position = 0.42; cr.elements[1].color = (1.0, 0.22, 0.02, 1)
    e = cr.elements.new(0.62); e.color = (1.0, 0.48, 0.05, 1)
    e = cr.elements.new(0.78); e.color = (1.0, 0.78, 0.25, 1)
    t.link(heat, ramp.inputs['Fac'])
    return ramp.outputs['Color']


def mat_ground():
    """Erkaltete Lava schwarzviolett (oben im Streiflicht warm), Schollen mit glühenden Rissen, Aschehänge graubraun,
    Berge blauviolett; glühende Lava leuchtet. Wenige, flächige Farben: gemalt wirken sie wie Farbflächen."""
    m = bpy.data.materials.new('Boden'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.85)
    def attr(name):
        nd = t.node('ShaderNodeAttribute'); nd.attribute_name = name
        return nd.outputs['Fac']
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    nrm = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nrm.inputs[0])
    lava, crust, ash, peak = attr('lava'), attr('crust'), attr('ash'), attr('peak')
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.25, in_Detail=3.0); t.link(pos, n1.inputs['Vector'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=0.006, in_Detail=3.0); t.link(pos, n2.inputs['Vector'])
    # Basalt: zwei Töne in Flecken (gemalt: Flächen statt Rauschen)
    flat_ = t.maprange(n1.outputs['Fac'], 0.48, 0.52)
    rock = t.mix(flat_, (0.050, 0.040, 0.055, 1), (0.075, 0.058, 0.070, 1))
    up = t.maprange(nrm.outputs['Z'], 0.7, 0.95)
    rock = t.mix(t.math('MULTIPLY', up, 0.6), rock, (0.11, 0.08, 0.085, 1))
    # Asche an den Hängen des Vulkans und der Berge: graubraun bis violettgrau
    ashc = t.mix(t.maprange(n2.outputs['Fac'], 0.45, 0.55), (0.16, 0.12, 0.12, 1), (0.21, 0.16, 0.15, 1))
    col = t.mix(ash, rock, ashc)
    peakc = t.mix(t.maprange(nrm.outputs['Z'], 0.5, 0.8), (0.07, 0.06, 0.11, 1), (0.13, 0.10, 0.15, 1))
    col = t.mix(peak, col, peakc)
    # Schollen: Voronoi-Kanten glühen (nur im Bereich crust), die Platten selbst etwas heller
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=0.22); vor.feature = 'DISTANCE_TO_EDGE'
    vm = t.node('ShaderNodeMapping'); vm.inputs['Scale'].default_value = (1.0, 1.0, 0.0)
    t.link(pos, vm.inputs['Vector']); t.link(vm.outputs[0], vor.inputs['Vector'])
    cn = t.node('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=2.0); t.link(pos, cn.inputs['Vector'])
    width = t.math('MULTIPLY', t.maprange(crust, 0.0, 1.0, 0.0, 0.022), t.maprange(cn.outputs['Fac'], 0.35, 0.65, 0.4, 1.3))
    crack = t.math('LESS_THAN', vor.outputs['Distance'], width)
    col = t.mix(t.math('MULTIPLY', crust, 0.5), col, (0.085, 0.055, 0.065, 1))
    hot = t.math('MAXIMUM', lava, t.math('MULTIPLY', crack, 0.35))
    lc = lava_color(t, pos)
    t.link(t.mix(lava, col, (0.3, 0.05, 0.02, 1)), bsdf.inputs['Base Color'])
    # Leuchten: Lava voll, Risse gedämpft (dunkleres Rot)
    emit = t.mix(lava, t.vmath('MULTIPLY', lc, (0.75, 0.35, 0.25)), lc)
    t.link(emit, bsdf.inputs['Emission Color'])
    t.link(t.math('MULTIPLY', hot, LAVA_STRENGTH), bsdf.inputs['Emission Strength'])
    # Lava glänzt leicht (Haut), Fels matt
    t.link(t.math('SUBTRACT', 0.88, t.math('MULTIPLY', lava, 0.4)), bsdf.inputs['Roughness'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_ground():
    me = terrain_mesh()
    me.materials.append(mat_ground())
    link('Gelaende', me)


# ---------------------------------------------------------------- Himmel, Sonne, Luft

SKY_GAIN = 0.16       # Himmel, wie ihn Kamera und Spiegelungen sehen (gegenüber den Lampen)
SKY_LIGHT = 0.5       # ... als Licht: Dämmerung, die Schatten bleiben violett statt schwarz
SUN_STRENGTH = 2.2
SUN_COLOR = (1.0, 0.36, 0.16)
AIR_DIST = 3200.0     # Luftperspektive: Asche in der Luft, dichter als am Meer
AIR_HEIGHT = 900.0


def sky_group():
    """Himmelsfarbe in eine Richtung (gemalt, ohne physikalischen Himmel): oben tiefes Indigo-Violett, darunter Magenta,
    am Horizont glühend – zur untergegangenen Sonne gelborange, zum Vulkan hin rot, sonst rosa; Gain: Anteil gegenüber
    den Lampen"""
    ng, t, gi, go = S._group('Himmelsfarbe', [('Richtung', 'NodeSocketVector'), ('Gain', 'NodeSocketFloat')],
                             [('Farbe', 'NodeSocketColor')])
    rs = t.node('ShaderNodeSeparateXYZ'); t.link(gi.outputs['Richtung'], rs.inputs[0])
    rc = t.node('ShaderNodeCombineXYZ')
    t.link(rs.outputs['X'], rc.inputs['X']); t.link(rs.outputs['Y'], rc.inputs['Y'])
    t.link(t.math('MAXIMUM', rs.outputs['Z'], 0.002), rc.inputs['Z'])
    d = t.vmath('NORMALIZE', rc.outputs[0])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(d, sep.inputs[0])
    z = sep.outputs['Z']
    dh = t.vmath('NORMALIZE', t.vmath('MULTIPLY', d, (1, 1, 0)))
    sh = Vector((SUN.x, SUN.y, 0)).normalized()
    vx, vy = VOLCANO[0], VOLCANO[1]
    vh = Vector((vx, vy, 0)).normalized()
    sun_side = t.math('POWER', t.math('ADD', 0.5, t.math('MULTIPLY', t.vmath('DOT_PRODUCT', dh, (sh.x, sh.y, 0)), 0.5)), 4.0)
    vol_side = t.math('POWER', t.math('ADD', 0.5, t.math('MULTIPLY', t.vmath('DOT_PRODUCT', dh, (vh.x, vh.y, 0)), 0.5)), 6.0)
    # Verlauf nach Höhe: Horizont → Magenta → Violett → Indigo (Stufen weich, aber klar abgesetzt)
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp; cr.interpolation = 'EASE'
    cr.elements[0].position = 0.0; cr.elements[0].color = (1.0, 0.42, 0.40, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.035, 0.03, 0.12, 1)
    e = cr.elements.new(0.10); e.color = (0.80, 0.22, 0.42, 1)
    e = cr.elements.new(0.30); e.color = (0.32, 0.09, 0.32, 1)
    e = cr.elements.new(0.62); e.color = (0.09, 0.05, 0.20, 1)
    t.link(t.math('POWER', z, 0.8), ramp.inputs['Fac'])
    col = ramp.outputs['Color']
    low = t.maprange(z, 0.22, 0.0)
    col = t.mix(t.math('MULTIPLY', low, sun_side), col, (1.6, 0.85, 0.35, 1))     # zur Sonne gelborange
    col = t.mix(t.math('MULTIPLY', t.maprange(z, 0.35, 0.0), vol_side), col, (1.3, 0.25, 0.08, 1))   # zum Vulkan rot
    sc_ = t.node('ShaderNodeVectorMath'); sc_.operation = 'SCALE'
    t.link(col, sc_.inputs[0]); t.link(t.math('MULTIPLY', gi.outputs['Gain'], 6.0), sc_.inputs['Scale'])
    t.link(sc_.outputs['Vector'], go.inputs['Farbe'])
    return ng


def world():
    w = bpy.data.worlds.new('Daemmerung'); sc().world = w; w.use_nodes = True
    for name in ('Himmelsfarbe', 'Luft'):
        if name in bpy.data.node_groups:
            bpy.data.node_groups.remove(bpy.data.node_groups[name])
    sky_group()
    S.WATER, S.AIR_DIST, S.AIR_HEIGHT, S.SKY_GAIN = FLOOR, AIR_DIST, AIR_HEIGHT, SKY_GAIN   # Luft wie hier
    S.air_group()
    t = NT(w.node_tree)
    out = t.node('ShaderNodeOutputWorld')
    bg = t.node('ShaderNodeBackground', in_Strength=1.0)
    t.link(bg.outputs[0], out.inputs[0])
    tc = t.node('ShaderNodeTexCoord')
    d = t.vmath('NORMALIZE', tc.outputs['Generated'])
    lp = t.node('ShaderNodeLightPath')
    seen = t.math('MAXIMUM', lp.outputs['Is Camera Ray'], lp.outputs['Is Glossy Ray'])
    gain = t.math('ADD', SKY_LIGHT, t.math('MULTIPLY', seen, SKY_GAIN - SKY_LIGHT))
    g = t.node('ShaderNodeGroup'); g.node_tree = bpy.data.node_groups['Himmelsfarbe']
    t.link(d, g.inputs['Richtung']); t.link(gain, g.inputs['Gain'])
    t.link(g.outputs['Farbe'], bg.inputs['Color'])
    return w


def sun_lamp():
    ld = bpy.data.lights.new('Sonne', 'SUN')
    ld.energy = SUN_STRENGTH
    ld.color = SUN_COLOR
    ld.angle = math.radians(1.5)
    ob = link('Sonne', ld)
    ob.rotation_euler = SUN.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    return ob


def glow_lamps():
    """Widerschein der Lava: Flächenlampen (die leuchtenden Flächen allein rauschten). Über dem Krater nach oben in die
    Aschesäule, über Strom und See nach unten auf den Boden ums Brett. Für die Kamera unsichtbar."""
    vx, vy, vh = VOLCANO[0], VOLCANO[1], VOLCANO[2]
    for name, loc, size, energy, up in (('Glut Krater', (vx, vy, FLOOR + vh + 40), 380.0, 4.0e6, True),
                                        ('Glut Strom', (24.0, 20.0, FLOOR + 4.0), 30.0, 6.0e3, False),
                                        ('Glut See', (LAKE[0], LAKE[1], FLOOR + 3.0), 30.0, 5.0e3, False)):
        ld = bpy.data.lights.new(name, 'AREA'); ld.shape = 'DISK'; ld.size = size
        ld.energy = energy; ld.color = (1.0, 0.32, 0.08)
        ob = link(name, ld)
        ob.location = loc
        ob.rotation_euler = (math.pi if up else 0.0, 0, 0)   # Flächenlampen leuchten entlang ihrer −Z
        ob.visible_camera = False


# ---------------------------------------------------------------- Aschesäule und Wolken

PLUME_DENS = 0.012
CLOUD_DENS = 0.02


def mat_ash():
    """Asche als Volumen: dunkel violettgrau; unten glüht sie orange (Widerschein der Lava, nach Höhe über dem Krater
    abnehmend). Wolken und die Spitze der Säule nehmen dazu die Farbe des Himmels an (himmel je Objekt)."""
    m = bpy.data.materials.new('Asche'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    vol = t.node('ShaderNodeVolumePrincipled', in_Anisotropy=0.3, in_Density=PLUME_DENS)
    dens = t.node('ShaderNodeAttribute'); dens.attribute_name = 'density'
    strength = t.node('ShaderNodeAttribute'); strength.attribute_type = 'OBJECT'; strength.attribute_name = 'dichte'
    t.link(strength.outputs['Fac'], vol.inputs['Density'])   # mal dem Gitter density (Density Attribute)
    vol.inputs['Color'].default_value = (0.13, 0.10, 0.14, 1)
    geo = t.node('ShaderNodeNewGeometry')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Position'], sep.inputs[0])
    top = FLOOR + VOLCANO[2]
    glow = t.math('EXPONENT', t.math('DIVIDE', t.math('MAXIMUM', t.math('SUBTRACT', sep.outputs['Z'], top), 0.0), -500.0))
    ga = t.node('ShaderNodeAttribute'); ga.attribute_type = 'OBJECT'; ga.attribute_name = 'glut'
    # Wolken: dazu die Farbe des Himmels in ihrer Richtung (Eigenschaft himmel je Objekt): violett statt schwarz,
    # wie gemalte Wolken in der Dämmerung
    ha = t.node('ShaderNodeAttribute'); ha.attribute_type = 'OBJECT'; ha.attribute_name = 'himmel'
    oi = t.node('ShaderNodeObjectInfo')
    d = t.vmath('ADD', t.vmath('NORMALIZE', t.vmath('MULTIPLY', oi.outputs['Location'], (1, 1, 0))), (0, 0, 0.35))
    g = t.node('ShaderNodeGroup'); g.node_tree = bpy.data.node_groups['Himmelsfarbe']
    t.link(d, g.inputs['Richtung']); g.inputs['Gain'].default_value = SKY_GAIN
    sky = t.vmath('MULTIPLY', g.outputs['Farbe'], t.vmath('MULTIPLY', (1, 1, 1), ha.outputs['Fac']))
    ember = t.vmath('MULTIPLY', (1.0, 0.30, 0.06), t.vmath('MULTIPLY', (1, 1, 1), t.math('MULTIPLY', glow, ga.outputs['Fac'])))
    t.link(t.vmath('ADD', sky, ember), vol.inputs['Emission Color'])
    t.link(t.math('MULTIPLY', dens.outputs['Fac'], strength.outputs['Fac']), vol.inputs['Emission Strength'])
    t.link(vol.outputs[0], out.inputs['Volume'])
    return m


def plume_lobes(rng, height, r0, r1):
    """Ballen der Aschesäule: Säule, nach oben breiter, oben ein Schirm, der mit dem Wind nach rechts treibt"""
    lobes = []
    n = 14
    for i in range(n):
        f = i / (n - 1)
        r = r0 + (r1 - r0) * f ** 1.4
        c = np.array([f ** 2 * height * 0.45 + rng.normal(0, r * 0.12), rng.normal(0, r * 0.1), f * height])
        for j in range(3):
            v = rng.normal(size=3); v /= np.linalg.norm(v)
            lobes.append((c + v * r * 0.45, np.full(3, r * rng.uniform(0.55, 0.75))))
        lobes.append((c, np.full(3, r * 0.7)))
    for j in range(16):   # Schirm
        a = rng.uniform(0, 2 * np.pi)
        rr = r1 * rng.uniform(0.4, 1.4)
        c = np.array([height * 0.5 + rr * np.cos(a) * 1.4 + r1 * 0.6, rr * np.sin(a) * 0.8, height * rng.uniform(0.92, 1.05)])
        lobes.append((c, np.array([r1 * 0.75, r1 * 0.6, r1 * 0.45]) * rng.uniform(0.7, 1.1)))
    return lobes


def blob_mesh(name, lobes, voxel):
    """Ballen (Ellipsoide) zu einer Fläche vereint (Voxel-Remesh), wie die Wolkenform am Strand"""
    V0, F0 = S._unit_sphere()
    V = np.concatenate([V0 * rad + c for c, rad in lobes])
    F = np.concatenate([F0 + k * len(V0) for k in range(len(lobes))])
    me = make_mesh(name + '_roh', V, F, smooth=False)
    tmp = link(name + '_roh', me)
    mod = tmp.modifiers.new('Vereinen', 'REMESH')
    mod.mode = 'VOXEL'; mod.voxel_size = voxel; mod.adaptivity = 0.0
    dg = bpy.context.evaluated_depsgraph_get()
    out = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
    out.name = name
    return out


def volume_from(name, form_me, coll, mat, loc, rot, width, dichte, glut, himmel):
    form = link(name.replace('Wolke', 'Wolkenform').replace('Asche', 'Ascheform'), form_me, coll)
    form.location, form.rotation_euler = loc, rot
    for vis in ('visible_camera', 'visible_shadow', 'visible_diffuse', 'visible_glossy', 'visible_transmission',
                'visible_volume_scatter'):
        setattr(form, vis, False)
    vd = bpy.data.volumes.new(name)
    vd.materials.append(mat)
    ob = link(name, vd, coll)
    ob.location, ob.rotation_euler = loc, rot
    ob['dichte'] = dichte; ob['glut'] = glut; ob['himmel'] = himmel
    mv = ob.modifiers.new('Form', 'MESH_TO_VOLUME')
    mv.object = form
    mv.resolution_mode = 'VOXEL_SIZE'; mv.voxel_size = width / 100.0
    mv.interior_band_width = width / 60.0
    mv.density = 1.0
    tex = bpy.data.textures.new(name + '_rand', 'CLOUDS')
    tex.cloud_type = 'COLOR'; tex.noise_scale = width * 0.05; tex.noise_depth = 3
    dp = ob.modifiers.new('Ausfransen', 'VOLUME_DISPLACE')
    dp.texture = tex; dp.texture_map_mode = 'LOCAL'
    dp.strength = width * 0.05
    dp.texture_mid_level = (0.5, 0.5, 0.5)
    return ob


# Aschewolken: (Richtung in Grad von +y über +x, Abstand, Höhe der Basis, Breite, Höhe) – lang gezogene Bänke, die vom
# Vulkan nach rechts treiben, dazu einige über den Bergen
CLOUDS = [(-6, 3600, 2300, 2600, 700), (18, 3900, 2500, 2300, 600), (40, 4200, 2200, 2100, 550),
          (75, 5200, 1400, 2400, 600), (120, 5600, 1500, 2000, 500), (200, 4800, 1700, 2600, 650),
          (250, 5400, 1500, 2200, 550), (300, 5000, 1600, 2000, 500), (-40, 4400, 1900, 1800, 500)]


def build_volumes():
    coll = collection('Volumen')
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    mat = mat_ash()
    rng = np.random.default_rng(41)
    vx, vy, vh = VOLCANO[0], VOLCANO[1], VOLCANO[2]
    height, r0, r1 = 2400.0, 150.0, 650.0
    plume = blob_mesh('Ascheform', plume_lobes(rng, height, r0, r1), r1 / 30.0)
    volume_from('Asche', plume, coll, mat, (vx, vy, FLOOR + vh - 60.0), (0, 0, math.radians(-15)), r1 * 2.0,
                PLUME_DENS, 2.0, 0.1)
    for k, (deg, dist, base, width, h) in enumerate(CLOUDS):
        a = math.radians(deg)
        width = width * 1.8
        me = S.cloud_mesh('Wolkenform_%02d' % k, rng, width, h * 2.2, mat)
        me.materials.clear()
        loc = (dist * math.sin(a), dist * math.cos(a), base)
        rot = (0, 0, -a + rng.normal(0, 0.2))
        ob = volume_from('Wolke_%02d' % k, me, coll, mat, loc, rot, width, CLOUD_DENS, 0.0,
                         0.6)
        ob.scale = (1.0, 0.8, 0.6)   # flach gedrückt: Bänke statt Türme
        bpy.data.objects[ob.name.replace('Wolke', 'Wolkenform')].scale = ob.scale
    log('Aschesäule und Wolken', len(CLOUDS) + 1)


def cameras():
    cd = bpy.data.cameras.new('Panorama'); cd.type = 'PANO'; cd.panorama_type = 'EQUIRECTANGULAR'
    cd.clip_start = 0.05; cd.clip_end = 60000
    pano = link('Panorama', cd); pano.location = PANO_CENTER; pano.rotation_euler = (math.pi / 2, 0, 0)
    gd = bpy.data.cameras.new('Spielkamera'); gd.sensor_fit = 'VERTICAL'; gd.angle_y = math.radians(32)
    gd.clip_start = 0.05; gd.clip_end = 60000
    link('Spielkamera', gd)
    sc().camera = pano


# ---------------------------------------------------------------- Aufbau und Ersetzen

def build():
    """Ganze Szene in die (leere) aktuelle Datei bauen"""
    sc().render.engine = 'CYCLES'
    world()
    build_ground()
    build_volumes()
    sun_lamp()
    glow_lamps()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def replace_ground():
    _remove(['Gelaende'])
    build_ground()


def replace_volumes():
    build_volumes()


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove(['Sonne', 'Glut Krater', 'Glut Strom', 'Glut See'])
    sun_lamp()
    glow_lamps()


def export(stil='volcano'):
    """Daten für die Ebenen des Spiels: noch keine (nur das Panorama). Eine alte ebenen.json entfernen."""
    path = os.path.join(ROOT, 'sky', stil, 'ebenen.json')
    if os.path.exists(path):
        os.remove(path)
    return {'ebenen': 0}
