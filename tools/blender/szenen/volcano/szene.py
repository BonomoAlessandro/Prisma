# Baut die Blender-Szene „Im Vulkan“ (Skybox volcano, gemalt wie der Strand, PLAN 1.2). Über den Blender-MCP:
# wald_mcp.neu('volcano') baut sie und speichert tools/blender/volcano.blend; einzelne Teile neu mit
# wald_mcp.scene('volcano').replace_…().
# Aufbau: Das Brett schwebt im Schlot eines Vulkans über einem Lavasee (LAVA_Z, Radius um FOOT). Rundum ragen steile,
# zerklüftete Kraterwände auf (Pfeiler, Absätze in Schichten, oben ein gezackter Rand); durch die Öffnung sieht man
# einen glühend violetten, rauchigen Himmel. Dampfsäulen steigen an den Wänden auf (Sammlung „Volumen“). Licht: die
# Lava von unten (orange, Flächenlampe „Glut See“ dazu) und kühles violettes Licht von oben durch die Öffnung
# (Hauptlicht) – Wände mit violetten Schatten und orangem Glühen von unten.
# Den Lavasee bis LAVA_GAME zeichnet das Spiel selbst und bewegt (Ebene lavaPool in index.html: treibende Schollen,
# Blasen, Glut, Dampf); Blender malt dort dasselbe Muster still, so passt der Übergang am Rand.
# Anime-Look wie beim Strand: wenige, flächige Farben (die Lava in Stufen), farbige Schatten; gemalt wird danach in
# anime.py (Stil „volcano“ in stile.py).
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Panorama-Mittelpunkt (0, 0, 3).
# Bausteine (Ringgitter, Ballen zu Flächen, Luftperspektive) kommen aus der Strand-Szene.
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
    """Baumodul der Strand-Szene (ohne Aufbau): Ringgitter, Ikosphäre, Knotengruppen"""
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


PANO_CENTER = (0.0, 0.0, 3.0)
LAVA_Z = -9.0         # Lavasee (Spiel: level der Ebene lavaPool)
FOOT = 25.0           # Fuss der Kraterwand: nie näher am Brett (die Wand weicht je Richtung bis gut 7 m zurück)
LAVA_GAME = 22.0      # bis hier zeichnet das Spiel die Lava (radius der Ebene lavaPool), Blender dahinter
RIM = 175.0           # Höhe des Kraterrands über der Lava (je Richtung ±40 m, mit Scharten)
SPAN = 38.0           # waagrecht vom Fuss bis zum Rand: steile Wände (gut 75°)
STRATA = 11.0         # Höhe der Gesteinsschichten (Absätze in der Wand)
EXTENT = 700.0
# Muster der Lava, gleich wie in der Ebene lavaPool (skybox.json): Zellgrösse der Schollen (m), Breite der Fugen (Anteil)
CELL = 3.2
SEAM = 0.035
# Hauptlicht: kühl von oben durch die Öffnung
TOP_ELEV, TOP_AZ = 68.0, 120.0
TOP = Vector((math.sin(math.radians(TOP_AZ)) * math.cos(math.radians(TOP_ELEV)),
              math.cos(math.radians(TOP_AZ)) * math.cos(math.radians(TOP_ELEV)), math.sin(math.radians(TOP_ELEV)))).normalized()
B1, B2, B3, B4, B5, B6 = (Perlin(s) for s in (311, 313, 317, 331, 337, 347))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


# ---------------------------------------------------------------- Krater

class Ground:
    """Krater an Punkten: z, wall (Wand 0 … 1, 0 auf der Lava), u (Abstand zum Fuss der Wand, < 0 auf der Lava),
    ledge (flacher Absatz 0 … 1)"""


def foot_radius(th):
    """Fuss der Wand je Richtung (Bogenmass): Buchten und vorspringende Pfeiler, nie unter FOOT"""
    c, s = np.cos(th), np.sin(th)
    bays = 0.5 + 0.5 * fbm(B1, c * 2.2 + 4, s * 2.2 - 1, 3)
    piers = ridged(B2, c * 11 + 2, s * 11 + 5, 3)
    return FOOT + 4.5 * bays + 2.8 * (1 - piers)


def crater(x, y):
    x = np.asarray(x, float); y = np.asarray(y, float)
    g = Ground()
    r = np.hypot(x, y); th = np.arctan2(x, y)
    c, s = np.cos(th), np.sin(th)
    foot = foot_radius(th)
    # senkrechte Rippen und Säulen in der Wand (feiner als die Pfeiler am Fuss), nach oben stärker
    ribs = ridged(B3, c * 34 + 9, s * 34 - 3, 2)
    u = r - foot
    span = SPAN * (1 + 0.25 * fbm(B4, c * 3 + 1, s * 3 + 8, 2))
    rim = RIM + 30 * fbm(B5, c * 2.5 - 3, s * 2.5 + 2, 3) - 45 * smoothstep(0.62, 0.8, 0.5 + 0.5 * fbm(B6, c * 5, s * 5, 2))
    k = np.clip(u / span, 0, 1)
    wall = rim * k ** 0.8
    # Schichten: flache Absätze, dazwischen steile Stufen (gezeichnet wie Felsbänder)
    tilt = 2.5 * fbm(B4, c * 4 - 2, s * 4 + 6, 2)
    q = (wall + tilt) / STRATA
    terr = (np.floor(q) + smoothstep(0.3, 0.95, q - np.floor(q))) * STRATA - tilt
    g.ledge = (1 - smoothstep(0.0, 0.3, q - np.floor(q))) * smoothstep(1, 4, u) * (k < 0.98)
    wall = wall + 0.85 * (terr - wall)
    wall = wall + 4.0 * (ribs - 0.5) * smoothstep(0, 10, u) * (0.4 + k)
    # niedriger Saum aus erkalteter Lava am Fuss, in manchen Buchten etwas breiter
    shelf = 0.7 * smoothstep(-0.2, 0.6, u)
    # hinter dem Rand fällt der Berg nach aussen ab
    outer = np.maximum(u - span, 0) * 0.45
    z = np.where(u < 0, 0.0, shelf + wall - outer)
    z = z + 0.6 * fbm(B1, x * 0.35, y * 0.35, 2) * smoothstep(0, 3, u)
    g.z = LAVA_Z + z
    g.u = u
    g.wall = smoothstep(-0.1, 0.5, u)
    return g


def crater_mesh():
    X, Y, F = S.ring_mesh('Krater', 1024, 0.5, EXTENT)
    n = 1024
    X = np.concatenate([X, [0.0]]); Y = np.concatenate([Y, [0.0]])
    j = np.arange(n)
    fan = np.stack([np.full(n, len(X) - 1), (j + 1) % n, j], -1)   # Mitte unter dem Brett schliessen
    g = crater(X, Y)
    me = make_mesh('Krater', np.stack([X, Y, g.z], -1), [F, fan])
    S.attrs(me, wall=g.wall, foot=g.u, ledge=g.ledge)
    log('Krater', len(X), 'Ecken')
    return me


# Lava: Stufen nach Hitze (Fugen der Schollen), dieselben Farbtöne wie die Ebene lavaPool (dort Szenenwerte nach dem Malen)
LAVA_STRENGTH = 2.4
LAVA_STEPS = [(1.0, 0.80, 0.25), (1.0, 0.36, 0.03), (0.55, 0.05, 0.015)]   # Kern, Fuge, Saum (dunkelrot)
CRUST = [(0.035, 0.018, 0.035), (0.055, 0.025, 0.040)]                   # Schollen, zwei Töne


def mat_crater():
    """Lavasee: dunkle Schollen mit glühenden Fugen (Stufen), am Fuss der Wand ein heisser Saum. Wand: dunkles
    Violett, Absätze heller (Licht von oben), unten glühende Adern und Spritzer; Leuchten nur in Stufen."""
    m = bpy.data.materials.new('Krater'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.85)
    def attr(name):
        nd = t.node('ShaderNodeAttribute'); nd.attribute_name = name
        return nd.outputs['Fac']
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    nz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nz.inputs[0])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(pos, sep.inputs[0])
    height = t.math('SUBTRACT', sep.outputs['Z'], LAVA_Z)
    wall, foot, ledge = attr('wall'), attr('foot'), attr('ledge')
    # --- Lava: Voronoi-Schollen (Zelle CELL), Fugen in drei Stufen
    vm = t.node('ShaderNodeMapping'); vm.inputs['Scale'].default_value = (1 / CELL, 1 / CELL, 0.0)
    t.link(pos, vm.inputs['Vector'])
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=1.0); vor.feature = 'DISTANCE_TO_EDGE'
    t.link(vm.outputs[0], vor.inputs['Vector'])
    cellc = t.node('ShaderNodeTexVoronoi', in_Scale=1.0); t.link(vm.outputs[0], cellc.inputs['Vector'])   # Farbe je Zelle
    # Unter der Lava des Spiels (lavaPool bis LAVA_GAME, voll deckend bis LAVA_GAME − 3) nur eine flache Grundfarbe:
    # Dort zeichnet das Spiel, und das ganze Bild (vorab gespeichert) bleibt so viel kleiner
    reach = t.math('LESS_THAN', t.vmath('LENGTH', t.vmath('MULTIPLY', pos, (1, 1, 0))), LAVA_GAME - 3.5)
    open_ = t.math('SUBTRACT', 1.0, reach)
    e = vor.outputs['Distance']
    core = t.math('MULTIPLY', t.math('LESS_THAN', e, SEAM * 0.4), open_)
    seam = t.math('MULTIPLY', t.math('LESS_THAN', e, SEAM), open_)
    rim = t.math('MULTIPLY', t.math('LESS_THAN', e, SEAM * 1.8), open_)
    cs = t.node('ShaderNodeSeparateColor'); t.link(cellc.outputs['Color'], cs.inputs[0])
    crust = t.mix(t.math('GREATER_THAN', cs.outputs[0], 0.5), CRUST[0] + (1,), CRUST[1] + (1,))
    crust = t.mix(reach, crust, tuple(0.5 * (a + b) for a, b in zip(*CRUST)) + (1,))
    # heisser Saum am Fuss der Wand (Lava brandet an), 0 … 1,6 m
    hot_edge = t.math('GREATER_THAN', foot, -1.6)
    lc = t.mix(rim, (0, 0, 0, 1), LAVA_STEPS[2] + (1,))
    lc = t.mix(seam, lc, LAVA_STEPS[1] + (1,))
    lc = t.mix(core, lc, LAVA_STEPS[0] + (1,))
    lc = t.mix(hot_edge, lc, LAVA_STEPS[1] + (1,))
    lc = t.mix(t.math('GREATER_THAN', foot, -0.6), lc, LAVA_STEPS[0] + (1,))
    lava_emit = t.math('MAXIMUM', rim, hot_edge)
    # --- Wand: zwei Töne nach Schicht, Absätze heller (Licht von oben), Bänder dunkler
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.05, in_Detail=2.0); t.link(pos, n1.inputs['Vector'])
    band = t.math('GREATER_THAN', t.math('FRACT', t.math('DIVIDE', t.math('ADD', height, t.math('MULTIPLY', n1.outputs['Fac'], 6.0)), STRATA * 2)), 0.5)
    rock = t.mix(band, (0.060, 0.040, 0.075, 1), (0.085, 0.055, 0.090, 1))
    up = t.math('GREATER_THAN', nz.outputs['Z'], 0.72)
    rock = t.mix(t.math('MAXIMUM', up, ledge), rock, (0.17, 0.12, 0.17, 1))
    # unten glühende Adern (Voronoi-Kanten senkrecht gestreckt), zur Höhe hin seltener; ein glühender Spritzsaum knapp
    # über der Lava
    am = t.node('ShaderNodeMapping'); am.inputs['Scale'].default_value = (0.12, 0.12, 0.05)
    t.link(pos, am.inputs['Vector'])
    av = t.node('ShaderNodeTexVoronoi', in_Scale=1.0); av.feature = 'DISTANCE_TO_EDGE'; t.link(am.outputs[0], av.inputs['Vector'])
    vein_w = t.math('MULTIPLY', t.maprange(height, 1.0, 22.0, 0.018, 0.0), wall)
    vein = t.math('LESS_THAN', av.outputs['Distance'], vein_w)
    splash = t.math('MULTIPLY', t.math('LESS_THAN', height, 1.4), wall)
    wall_emit = t.math('MAXIMUM', t.math('MULTIPLY', vein, 0.35), splash)
    wall_glow = t.mix(splash, LAVA_STEPS[2] + (1,), LAVA_STEPS[1] + (1,))
    # --- zusammen
    t.link(t.mix(wall, crust, rock), bsdf.inputs['Base Color'])
    t.link(t.mix(wall, lc, wall_glow), bsdf.inputs['Emission Color'])
    emit = t.math('ADD', t.math('MULTIPLY', t.math('SUBTRACT', 1.0, wall), lava_emit), t.math('MULTIPLY', wall, wall_emit))
    t.link(t.math('MULTIPLY', emit, LAVA_STRENGTH), bsdf.inputs['Emission Strength'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_crater():
    me = crater_mesh()
    me.materials.append(mat_crater())
    link('Krater', me)


# ---------------------------------------------------------------- Himmel, Licht, Luft

SKY_GAIN = 0.16
SKY_LIGHT = 0.5
TOP_STRENGTH = 2.0
TOP_COLOR = (0.55, 0.45, 1.0)
AIR_DIST = 900.0      # Rauch im Krater: ferne Wände etwas violett verschleiert
AIR_HEIGHT = 400.0
GLOW_ENERGY = 9.0e3   # Widerschein der Lava (W), Flächenlampe knapp über dem See, nach oben


def sky_group():
    """Himmelsfarbe in eine Richtung (gemalt): durch die Öffnung sieht man nur steil nach oben – dort tiefes Indigo,
    zum Rand hin Violett und Magenta, ganz unten ein orangerotes Glühen (Rauch, von der Lava angestrahlt)"""
    ng, t, gi, go = S._group('Himmelsfarbe', [('Richtung', 'NodeSocketVector'), ('Gain', 'NodeSocketFloat')],
                             [('Farbe', 'NodeSocketColor')])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(t.vmath('NORMALIZE', gi.outputs['Richtung']), sep.inputs[0])
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp; cr.interpolation = 'EASE'
    cr.elements[0].position = 0.0; cr.elements[0].color = (1.2, 0.30, 0.10, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.05, 0.03, 0.16, 1)
    for p, col in ((0.55, (0.95, 0.22, 0.35, 1)), (0.75, (0.48, 0.12, 0.45, 1)), (0.9, (0.16, 0.07, 0.32, 1))):
        e = cr.elements.new(p); e.color = col
    t.link(t.math('MAXIMUM', sep.outputs['Z'], 0.0), ramp.inputs['Fac'])
    scl = t.node('ShaderNodeVectorMath'); scl.operation = 'SCALE'
    t.link(ramp.outputs['Color'], scl.inputs[0]); t.link(t.math('MULTIPLY', gi.outputs['Gain'], 6.0), scl.inputs['Scale'])
    t.link(scl.outputs['Vector'], go.inputs['Farbe'])
    return ng


def world():
    w = bpy.data.worlds.new('Krater'); sc().world = w; w.use_nodes = True
    sky_group()   # Gruppen werden neu gefüllt, nicht ersetzt: Materialien behalten ihre Verbindungen
    S.WATER, S.AIR_DIST, S.AIR_HEIGHT, S.SKY_GAIN = LAVA_Z, AIR_DIST, AIR_HEIGHT, SKY_GAIN   # Luft wie hier
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


def lights():
    ld = bpy.data.lights.new('Oben', 'SUN')
    ld.energy = TOP_STRENGTH; ld.color = TOP_COLOR; ld.angle = math.radians(3.0)
    ob = link('Oben', ld)
    ob.rotation_euler = TOP.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    ld = bpy.data.lights.new('Glut See', 'AREA'); ld.shape = 'DISK'; ld.size = 2 * FOOT
    ld.energy = GLOW_ENERGY; ld.color = (1.0, 0.30, 0.07)
    ob = link('Glut See', ld)
    ob.location = (0.0, 0.0, LAVA_Z + 0.6)
    ob.rotation_euler = (math.pi, 0, 0)   # Flächenlampen leuchten entlang ihrer −Z: hier nach oben
    ob.visible_camera = False
    ob.visible_glossy = False


# ---------------------------------------------------------------- Dampf und Rauch

STEAM_DENS = 0.03


def mat_steam():
    """Dampf als Volumen: hell violettgrau, unten orange angestrahlt (Leuchten nach Höhe über der Lava, je Objekt glut)"""
    m = bpy.data.materials.new('Dampf'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    vol = t.node('ShaderNodeVolumePrincipled', in_Anisotropy=0.2)
    dens = t.node('ShaderNodeAttribute'); dens.attribute_name = 'density'
    k = t.node('ShaderNodeAttribute'); k.attribute_type = 'OBJECT'; k.attribute_name = 'dichte'
    t.link(k.outputs['Fac'], vol.inputs['Density'])
    vol.inputs['Color'].default_value = (0.30, 0.24, 0.36, 1)
    geo = t.node('ShaderNodeNewGeometry')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Position'], sep.inputs[0])
    glow = t.math('EXPONENT', t.math('DIVIDE', t.math('MAXIMUM', t.math('SUBTRACT', sep.outputs['Z'], LAVA_Z), 0.0), -35.0))
    ga = t.node('ShaderNodeAttribute'); ga.attribute_type = 'OBJECT'; ga.attribute_name = 'glut'
    vol.inputs['Emission Color'].default_value = (1.0, 0.32, 0.08, 1)
    t.link(t.math('MULTIPLY', t.math('MULTIPLY', glow, ga.outputs['Fac']), t.math('MULTIPLY', dens.outputs['Fac'], k.outputs['Fac'])),
           vol.inputs['Emission Strength'])
    t.link(vol.outputs[0], out.inputs['Volume'])
    return m


def column_lobes(rng, height, r0, r1, lean):
    """Ballen einer Dampfsäule: nach oben breiter, leicht zur Mitte geneigt (lean: Versatz oben, x)"""
    lobes = []
    n = 12
    for i in range(n):
        f = i / (n - 1)
        r = r0 + (r1 - r0) * f
        c = np.array([lean * f ** 1.5 + rng.normal(0, r * 0.15), rng.normal(0, r * 0.15), f * height])
        for j in range(2):
            v = rng.normal(size=3); v /= np.linalg.norm(v)
            lobes.append((c + v * r * 0.5, np.full(3, r * rng.uniform(0.5, 0.8))))
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


def volume_from(name, form_me, coll, mat, loc, rot, width, dichte, glut):
    """Volumen aus einer Form (unsichtbar), mit weichem, ausgefranstem Rand wie die Wolken am Strand"""
    form = link(name + ' Form', form_me, coll)
    form.location, form.rotation_euler = loc, rot
    for vis in ('visible_camera', 'visible_shadow', 'visible_diffuse', 'visible_glossy', 'visible_transmission',
                'visible_volume_scatter'):
        setattr(form, vis, False)
    vd = bpy.data.volumes.new(name)
    vd.materials.append(mat)
    ob = link(name, vd, coll)
    ob.location, ob.rotation_euler = loc, rot
    ob['dichte'] = dichte; ob['glut'] = glut
    mv = ob.modifiers.new('Form', 'MESH_TO_VOLUME')
    mv.object = form
    mv.resolution_mode = 'VOXEL_SIZE'; mv.voxel_size = width / 90.0
    mv.interior_band_width = width / 40.0
    mv.density = 1.0
    tex = bpy.data.textures.new(name + ' Rand', 'CLOUDS')
    tex.cloud_type = 'COLOR'; tex.noise_scale = width * 0.08; tex.noise_depth = 3
    dp = ob.modifiers.new('Ausfransen', 'VOLUME_DISPLACE')
    dp.texture = tex; dp.texture_map_mode = 'LOCAL'
    dp.strength = width * 0.08
    dp.texture_mid_level = (0.5, 0.5, 0.5)
    return ob


# Dampfsäulen an der Wand: Richtung (Grad von +y über +x), Höhe, Breite unten, oben
STEAM = [(15, 120, 5, 16), (80, 90, 4, 13), (140, 140, 6, 18), (205, 100, 4, 14), (262, 130, 5, 17), (320, 85, 4, 12)]
# Rauch über der Öffnung: Richtung, Abstand von der Mitte, Höhe der Basis, Breite
SMOKE = [(30, 60, 175, 120), (150, 40, 190, 140), (260, 70, 170, 110)]


def build_volumes():
    coll = S.collection('Volumen')
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    mat = mat_steam()
    rng = np.random.default_rng(53)
    for k, (deg, h, r0, r1) in enumerate(STEAM):
        a = math.radians(deg)
        d = foot_radius(np.array(a)) + 1.5
        me = blob_mesh('Dampfform_%02d' % k, column_lobes(rng, h, r0, r1, -0.15 * h), r1 / 18.0)
        volume_from('Dampf_%02d' % k, me, coll, mat, (float(d * math.sin(a)), float(d * math.cos(a)), LAVA_Z - 1.0),
                    (0, 0, -a + math.pi / 2), r1 * 2, STEAM_DENS, 0.5)
    for k, (deg, dist, base, w) in enumerate(SMOKE):
        a = math.radians(deg)
        me = blob_mesh('Rauchform_%02d' % k, column_lobes(rng, w * 0.5, w * 0.35, w * 0.45, w * 0.6), w / 25.0)
        ob = volume_from('Rauch_%02d' % k, me, coll, mat, (dist * math.sin(a), dist * math.cos(a), LAVA_Z + base),
                         (0, 0, -a), w, STEAM_DENS * 0.4, 0.0)
        ob['glut'] = 0.0
    log('Dampf und Rauch', len(STEAM) + len(SMOKE))


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
    build_crater()
    build_volumes()
    lights()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def replace_crater():
    _remove(['Krater'])
    build_crater()


def replace_volumes():
    build_volumes()


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove(['Oben', 'Glut See'])
    lights()


def export(stil='volcano'):
    """Daten für die Ebenen des Spiels: keine (lavaPool rechnet alles selbst). Eine alte ebenen.json entfernen."""
    path = os.path.join(ROOT, 'sky', stil, 'ebenen.json')
    if os.path.exists(path):
        os.remove(path)
    return {'ebenen': 0}
