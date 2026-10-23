# Baut die Blender-Szene „Im Vulkan“ (Skybox volcano, PLAN 1.2), realistisch gerendert und danach gemalt wie der
# Strand. Über den Blender-MCP: wald_mcp.neu('volcano') baut sie und speichert tools/blender/volcano.blend; einzelne
# Teile neu mit wald_mcp.scene('volcano').replace_…(). Ohne MCP headless mit denselben Skripten (wald_mcp.run).
# Vorbilder: Nyiragongo (Lavasee aus dunkler Kruste mit glühenden Rissen) und Erta Ale (Krater mit Absätzen,
# grauschwarzer Basalt, Rost- und Schwefelflecken).
# Aufbau: Das Brett schwebt im Schlot über dem Lavasee (LAVA_Z). Rundum steigt eine trichterförmige Böschung (GRADE,
# um 45°) mit Absätzen (BENCHES) bis zum Rand, dahinter flach; darauf tausende Felsblöcke wie am Strand (S.boulder,
# Material wie dort in Vulkanfarben), gestaut an den Kanten der Absätze und am Ufer, dazwischen Geröll. Durch die weite
# Öffnung ein rauchiger Nachthimmel; im Krater nur leichter Dunst (Luftperspektive), keine Dampfsäulen. Licht: die
# Lava von unten (Risse leuchten, dazu die Flächenlampe „Glut See“), kühl und schwach der Himmel von oben (Hauptlicht
# „Oben“).
# Das Spiel zeichnet selbst: den See bis LAVA_GAME, bewegt (lavaPool; Blender malt dort nur die Kruste), und ein
# Dutzend Felsbrocken am Ufer (bakedMesh, wie die nahen Felsen am Strand: gebackenes Licht, gemalt; Sammlung „Spiel“,
# für die Panoramakamera unsichtbar).
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Panorama-Mittelpunkt (0, 0, 3).
import bpy, math, os, sys, time, importlib.util
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from wald_lib import Perlin, fbm, smoothstep
from wald_scene import make_mesh, NT


def _strand():
    """Baumodul der Strand-Szene (ohne Aufbau): Ringgitter, Ikosphäre, Sammlungen, Knotengruppen, Luft"""
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
LAVA_Z = -9.0         # Lavasee (Spiel: level der Ebenen)
FOOT = 25.0           # mittlerer Radius, an dem die Böschung in den See taucht
LAVA_GAME = 22.0      # bis hier zeichnet das Spiel den See (radius von lavaPool), voll deckend bis LAVA_GAME − 2.5
GRADE = 1.0           # Neigung der Böschung (Höhe je Meter waagrecht: 45°)
# Absätze: so weit vom Fuss (m, waagrecht) beginnt einer, so breit ist er im Mittel
BENCHES = [(16.0, 7.0), (40.0, 9.0), (70.0, 11.0)]
RIM = 105.0           # Rand über der Lava (je Richtung ±12 m); dahinter flach
SEGMENTS = 1024       # Gitter der Böschung rundum
EXTENT = 700.0
TOP = Vector((-0.30, 0.35, 0.89)).normalized()   # kühles Licht von oben (Hauptlicht fürs Spiel)
B1, B2, B3, B4, B5 = (Perlin(s) for s in (503, 509, 521, 523, 541))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


# ---------------------------------------------------------------- Böschung

def foot_radius(th):
    """Fuss der Böschung je Richtung (Bogenmass, von +y über +x): Buchten und Vorsprünge"""
    c, s = np.cos(th), np.sin(th)
    return FOOT + 2.5 * fbm(B1, c * 1.3 + 7, s * 1.3 - 4, 3) + 1.0 * fbm(B2, c * 4.0, s * 4.0, 2)


def slope_height(x, y):
    """Höhe der Böschung über der Lava (unter dem See negativ) und Lage auf ihr: u (m waagrecht vom Fuss), bench
    (0 … 1 auf einem Absatz), lip (0 … 1 an der Kante eines Absatzes, wo sich Blöcke stauen)"""
    x = np.asarray(x, float); y = np.asarray(y, float)
    th = np.arctan2(x, y); c, s = np.cos(th), np.sin(th)
    u = np.hypot(x, y) - foot_radius(th)
    h = GRADE * u
    bench = np.zeros_like(u); lip = np.zeros_like(u)
    start = 0.0
    for k, (u0, w0) in enumerate(BENCHES):   # auf dem Absatz steigt es kaum: von der Höhe ab dort die Breite abziehen
        w = w0 * (0.5 + 1.0 * (0.5 + 0.5 * fbm(B3, c * 2.0 + k * 5, s * 2.0 - k * 3, 2)))
        a = u0 + start
        on = np.clip(u - a, 0, w)
        h = h - GRADE * 0.88 * on
        bench = np.maximum(bench, ((u > a) & (u < a + w)).astype(float))
        lip = np.maximum(lip, np.exp(-((u - a) / 2.0) ** 2))
        start += w
    rim = RIM + 12 * fbm(B5, c * 1.6 + 3, s * 1.6 - 2, 3)
    h = np.where(h > rim, rim + (h - rim) * 0.05, h)   # dahinter flach
    h = h + 1.2 * fbm(B4, x * 0.08, y * 0.08, 3) * np.clip(u / 4, 0, 1)
    return h, u, bench * (u > 0), lip * (u > 0)


def slope_mesh():
    X, Y, F = S.ring_mesh('Boeschung', SEGMENTS, FOOT - 6.0, EXTENT)
    h, u, bench, lip = slope_height(X, Y)
    me = make_mesh('Boeschung', np.stack([X, Y, LAVA_Z + h], -1), F)
    S.attrs(me, h=h, bench=bench)
    log('Böschung', len(X), 'Ecken')
    return me


def mat_scree():
    """Geröll zwischen den Blöcken: dunkler Basalt, körnig, mit Rost- und Schwefelflecken; knapp über der Lava glüht es"""
    m = bpy.data.materials.new('Geroell'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.95)
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    a = t.node('ShaderNodeAttribute'); a.attribute_name = 'h'
    h = a.outputs['Fac']
    n1 = t.node('ShaderNodeTexNoise', in_Scale=1.6, in_Detail=6.0, in_Roughness=0.65); t.link(pos, n1.inputs['Vector'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=0.04, in_Detail=3.0); t.link(pos, n2.inputs['Vector'])
    col = t.mix(n1.outputs['Fac'], (0.030, 0.028, 0.030, 1), (0.090, 0.082, 0.078, 1))
    rust = t.maprange(n2.outputs['Fac'], 0.60, 0.68)
    col = t.mix(t.math('MULTIPLY', rust, 0.8), col, (0.16, 0.06, 0.03, 1))
    sulfur = t.math('MULTIPLY', t.maprange(n2.outputs['Fac'], 0.30, 0.25), t.maprange(h, 10.0, 25.0))
    col = t.mix(t.math('MULTIPLY', sulfur, 0.85), col, (0.45, 0.38, 0.09, 1))
    t.link(col, bsdf.inputs['Base Color'])
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=2.5); t.link(pos, vor.inputs['Vector'])
    bmp = t.node('ShaderNodeBump', in_Strength=0.8, in_Distance=0.15)
    t.link(t.math('ADD', vor.outputs['Distance'], t.math('MULTIPLY', n1.outputs['Fac'], 0.5)), bmp.inputs['Height'])
    t.link(bmp.outputs['Normal'], bsdf.inputs['Normal'])
    splash = t.math('MULTIPLY', t.maprange(h, 0.9, 0.1), t.maprange(n1.outputs['Fac'], 0.4, 0.6))
    t.link(t.mix(splash, (0.9, 0.10, 0.02, 1), (1.0, 0.30, 0.04, 1)), bsdf.inputs['Emission Color'])
    t.link(t.math('MULTIPLY', splash, 5.0), bsdf.inputs['Emission Strength'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


ROCK_AMBIENT = 0.10   # Grundlicht der Blöcke (Anteil der eigenen Farbe, bläulich): Schatten nie ganz schwarz


def mat_rock():
    """Felsblock wie am Strand (szenen/beach mat_rock), in Vulkanfarben: dunkler Basalt, nach oben gewandte Flächen
    heller, je Block anders getönt (tone), einzelne Risse; vereinzelt Rost und Schwefel. Das Kantenlicht kommt von der
    Lava (unten warm) und vom Himmel (oben kühl)."""
    m = bpy.data.materials.new('Fels'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    nrm = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nrm.inputs[0])
    tone = t.node('ShaderNodeAttribute'); tone.attribute_name = 'tone'
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.8, in_Detail=4.0); t.link(pos, n1.inputs['Vector'])
    nf = t.node('ShaderNodeTexNoise', in_Scale=4.0, in_Detail=3.0); t.link(pos, nf.inputs['Vector'])
    up = t.maprange(nrm.outputs['Z'], 0.3, 0.9)
    col = t.mix(up, (0.050, 0.046, 0.046, 1), (0.125, 0.112, 0.104, 1))
    col = t.mix(t.math('MULTIPLY', tone.outputs['Fac'], 0.5), col, (0.085, 0.070, 0.066, 1))
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=0.9); vor.feature = 'DISTANCE_TO_EDGE'
    t.link(pos, vor.inputs['Vector'])
    crack = t.math('MULTIPLY', t.maprange(vor.outputs['Distance'], 0.03, 0.0), t.maprange(n1.outputs['Fac'], 0.5, 0.62))
    col = t.mix(t.math('MULTIPLY', crack, 0.8), col, (0.02, 0.018, 0.02, 1))
    rust = t.math('MULTIPLY', t.math('GREATER_THAN', tone.outputs['Fac'], 0.82), t.maprange(nf.outputs['Fac'], 0.45, 0.6))
    col = t.mix(t.math('MULTIPLY', rust, 0.7), col, (0.17, 0.065, 0.03, 1))
    sulfur = t.math('MULTIPLY', t.maprange(nf.outputs['Fac'], 0.64, 0.7), up)
    col = t.mix(t.math('MULTIPLY', sulfur, 0.6), col, (0.42, 0.35, 0.08, 1))
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.85)
    t.link(col, bsdf.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (0.55, 0.65, 1.0)), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = ROCK_AMBIENT
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


TEMPLATES = 8


def build_templates():
    """Felsblöcke als Vorlagen (vom Rendern ausgeschlossen) wie am Strand: S.boulder (kantig, Bruchflächen), Kanten
    scharf, je Vorlage ein Ton. Die Namen tragen die Nummer (der Geometrieknoten sortiert nach Namen)."""
    coll = S.collection('Vulkanvorlagen', exclude=True)
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    mat = bpy.data.materials.get('Fels') or mat_rock()
    for k in range(TEMPLATES):
        V, F, _ = S.boulder(1200 + k)
        name = 'v%02d' % k
        me = S.mesh(name, V, F, mats=[mat])
        me.set_sharp_from_angle(angle=math.radians(25))
        S.attrs(me, tone=np.full(len(V), np.random.default_rng(k + 40).random()))
        link(name, me, coll)
    return coll


def boulder_points(n=11000, seed=71):
    """Blöcke auf der Böschung: dicht, gestaut an den Kanten der Absätze und am Seeufer, unten grösser. Zeilen (x, y, z
    Blender), Vorlage, Grösse (m), Drehung um z"""
    rng = np.random.default_rng(seed)
    pts = []
    while len(pts) < n:
        m = 4000
        r = np.sqrt(rng.uniform((FOOT - 2) ** 2, (FOOT + 150) ** 2, m))
        th = rng.uniform(0, 2 * np.pi, m)
        x, y = r * np.sin(th), r * np.cos(th)
        h, u, bench, lip = slope_height(x, y)
        keep = (u > -0.5) & (h < RIM + 4) & (rng.random(m) < 0.25 + 0.55 * lip + 0.35 * np.exp(-u / 6))
        for xi, yi, hi, ui, li in zip(x[keep], y[keep], h[keep], u[keep], lip[keep]):
            size = float(np.clip(rng.lognormal(0.0, 0.5) * (1.0 + 1.2 * np.exp(-ui / 15) + 0.6 * li), 0.4, 6.0))
            pts.append((xi, yi, LAVA_Z + hi - 0.3 * size, rng.integers(TEMPLATES), size, rng.uniform(0, 2 * np.pi)))
    return pts[:n]


def build_boulders():
    coll = build_templates()
    pts = boulder_points()
    pos = np.array([p[:3] for p in pts]); var = np.array([p[3] for p in pts])
    size = np.array([p[4] for p in pts]); rot = np.array([p[5] for p in pts])
    scl = np.stack([size * 1.4, size * 1.1, size * 0.8], -1)
    eul = np.stack([np.zeros(len(pts)), np.zeros(len(pts)), rot], -1)
    me = S.points('Bloecke', pos, var, scl, eul)
    ob = link('Bloecke', me)
    mod = ob.modifiers.new('Bloecke', 'NODES')
    mod.node_group = S.instancer('Bloecke verteilen', coll)
    log('Blöcke', len(pts))


def build_slope():
    me = slope_mesh()
    me.materials.append(mat_scree())
    link('Boeschung', me)
    build_boulders()


# Felsbrocken am Seeufer nahe am Brett, die das Spiel selbst zeichnet (bakedMesh): Winkel (Grad), Abstand vom Fuss
# (m, negativ: im See), Grösse (m). Die meisten nach vorn (+y): In der Standardansicht liegt dort der obere Bildrand
RIM_ROCKS = [(-48, -1.2, 3.2), (-30, 0.5, 4.2), (-14, -0.8, 2.6), (2, 0.8, 3.8), (16, -1.5, 2.4), (31, 0.2, 4.6),
             (47, -0.6, 3.0), (64, 0.9, 3.6), (95, -1.0, 3.4), (140, 0.4, 4.0), (200, -0.8, 3.2), (250, 0.6, 3.8),
             (300, -1.2, 3.0)]


def build_rim_rocks():
    """Felsbrocken am Ufer als ein Netz (Sammlung Spiel: für die Kamera unsichtbar, Licht und Schatten bleiben im
    Panorama), mit UV-Karte (wie am Strand unwrap_near_rocks); für bake_rim_rocks"""
    import bmesh
    from mathutils import Euler, Matrix
    for n in ('Felsen nah',):
        if bpy.data.objects.get(n):
            bpy.data.objects.remove(bpy.data.objects[n])
    coll = bpy.data.collections['Vulkanvorlagen']
    rng = np.random.default_rng(83)
    bm = bmesh.new()
    tone = bm.verts.layers.float.new('tone')
    for deg, du, size in RIM_ROCKS:
        a = math.radians(deg)
        r = float(foot_radius(np.array(a))) + du
        v = int(rng.integers(TEMPLATES))
        tpl = coll.objects['v%02d' % v].data
        s_ = (size * 1.3, size * 1.0, size * 0.75)
        M = Matrix.Translation((r * math.sin(a), r * math.cos(a), LAVA_Z - 0.3 * size)) \
            @ Euler((0, 0, rng.uniform(0, 6.3)), 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((*s_, 1.0))
        n0 = len(bm.verts)
        bm.from_mesh(tpl)
        bm.verts.ensure_lookup_table()
        new = bm.verts[n0:]
        bmesh.ops.transform(bm, matrix=M, verts=new)
        t = float(rng.random())
        for vt in new:
            vt[tone] = t
    me = bpy.data.meshes.new('Felsen nah')
    bm.to_mesh(me)
    bm.free()
    me.materials.append(bpy.data.materials['Fels'])
    ob = link('Felsen nah', me, S.collection('Spiel'))
    ob.visible_camera = False
    S.unwrap_near_rocks(ob)
    log('Felsen nah', len(me.vertices), 'Ecken,', len(RIM_ROCKS), 'Brocken')


# ---------------------------------------------------------------- Lavasee

CRACK_STRENGTH = 7.0
CRUST = (0.025, 0.020, 0.022)


def lake_mesh():
    """See als Scheibe bis unter die Wand; Attribut wall: Abstand zum Fuss der Wand (m, > 0 im See)"""
    r_max = FOOT + 8.0
    X, Y, F = S.ring_mesh('See', 1024, 0.3, r_max)
    X = np.concatenate([X, [0.0]]); Y = np.concatenate([Y, [0.0]])
    j = np.arange(1024)
    fan = np.stack([np.full(1024, len(X) - 1), (j + 1) % 1024, j], -1)
    r0 = foot_radius(np.arctan2(X, Y))
    me = make_mesh('See', np.stack([X, Y, np.full(len(X), LAVA_Z)], -1), [F, fan])
    S.attrs(me, wall=r0 - np.hypot(X, Y))
    return me


def mat_lake():
    """Kruste dunkel, leicht glänzend; Risse unregelmässig (verzerrte Zellen in zwei Grössen), im Kern gelborange, aussen
    rot; am Fuss der Wand ein heller Glutsaum mit Spritzern. Unter dem See des Spiels nur die dunkle Kruste mit
    schwachem Glühen (dort zeichnet das Spiel)."""
    m = bpy.data.materials.new('Lava'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.45)
    bsdf.inputs['Base Color'].default_value = CRUST + (1,)
    a = t.node('ShaderNodeAttribute'); a.attribute_name = 'wall'
    wall = a.outputs['Fac']
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    # verzerrte Koordinaten: die Risse laufen unregelmässig statt in geraden Zellkanten
    warp = t.node('ShaderNodeTexNoise', in_Scale=0.12, in_Detail=3.0); t.link(pos, warp.inputs['Vector'])
    wp = t.vmath('ADD', pos, t.vmath('MULTIPLY', t.vmath('SUBTRACT', warp.outputs['Color'], (0.5, 0.5, 0.5)), (8.0, 8.0, 0.0)))
    big = t.node('ShaderNodeTexVoronoi', in_Scale=0.24); big.feature = 'DISTANCE_TO_EDGE'; t.link(wp, big.inputs['Vector'])
    small = t.node('ShaderNodeTexVoronoi', in_Scale=0.75); small.feature = 'DISTANCE_TO_EDGE'; t.link(wp, small.inputs['Vector'])
    gate = t.node('ShaderNodeTexNoise', in_Scale=0.3, in_Detail=2.0); t.link(pos, gate.inputs['Vector'])
    c1 = t.math('MULTIPLY', t.maprange(big.outputs['Distance'], 0.026, 0.0), t.maprange(gate.outputs['Fac'], 0.3, 0.6, 0.45, 1.0))
    c2 = t.math('MULTIPLY', t.maprange(small.outputs['Distance'], 0.03, 0.0), t.maprange(gate.outputs['Fac'], 0.5, 0.62))
    crack = t.math('MAXIMUM', c1, t.math('MULTIPLY', c2, 0.7))
    r = t.vmath('LENGTH', t.vmath('MULTIPLY', pos, (1, 1, 0)))
    open_ = t.maprange(r, LAVA_GAME - 3.2, LAVA_GAME - 2.4)   # unter dem Spiel nur schwach
    crack = t.math('MULTIPLY', crack, open_)   # unter dem Spiel nur die Kruste (kleineres Bild)
    # Glutsaum an der Wand mit Spritzern
    sn = t.node('ShaderNodeTexNoise', in_Scale=0.6, in_Detail=3.0); t.link(pos, sn.inputs['Vector'])
    rim = t.math('MAXIMUM', t.maprange(wall, 1.4, 0.3), t.math('MULTIPLY', t.maprange(wall, 3.0, 1.2), t.maprange(sn.outputs['Fac'], 0.55, 0.68)))
    heat = t.math('MAXIMUM', crack, rim)
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.32, 0.025, 0.008, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (1.0, 0.40, 0.06, 1)   # höchstens kräftiges Orange-Gelb
    e = cr.elements.new(0.5); e.color = (0.92, 0.15, 0.02, 1)
    t.link(heat, ramp.inputs['Fac'])
    t.link(ramp.outputs['Color'], bsdf.inputs['Emission Color'])
    t.link(t.math('MULTIPLY', t.math('POWER', heat, 0.8), CRACK_STRENGTH), bsdf.inputs['Emission Strength'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_lake():
    me = lake_mesh()
    me.materials.append(mat_lake())
    link('See', me)


# ---------------------------------------------------------------- Himmel, Licht, Luft

SKY_GAIN = 0.12
SKY_LIGHT = 0.6
AIR_DIST = 900.0      # Dunst im Schlot
AIR_HEIGHT = 300.0
GLOW_ENERGY = 1.1e4   # Widerschein der Lava (W): Flächenlampe knapp über dem See, nach oben
TOP_STRENGTH = 1.1
TOP_COLOR = (0.55, 0.62, 1.0)


def sky_group():
    """Himmelsfarbe: oben rauchiges Nachtblau bis Violett, zum Rand der Öffnung hin rötlich angestrahlt (Rauch über dem
    Glühen); unten (nur als Dunst der Luftperspektive) ein warmes Grau"""
    ng, t, gi, go = S._group('Himmelsfarbe', [('Richtung', 'NodeSocketVector'), ('Gain', 'NodeSocketFloat')],
                             [('Farbe', 'NodeSocketColor')])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(t.vmath('NORMALIZE', gi.outputs['Richtung']), sep.inputs[0])
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp; cr.interpolation = 'EASE'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.16, 0.08, 0.10, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.020, 0.028, 0.085, 1)
    for p, col in ((0.45, (0.12, 0.06, 0.16, 1)), (0.7, (0.05, 0.045, 0.15, 1))):
        e = cr.elements.new(p); e.color = col
    t.link(t.math('MAXIMUM', sep.outputs['Z'], 0.0), ramp.inputs['Fac'])
    n = t.node('ShaderNodeTexNoise', in_Scale=2.5, in_Detail=5.0); t.link(gi.outputs['Richtung'], n.inputs['Vector'])
    smoke = t.mix(t.math('MULTIPLY', t.maprange(n.outputs['Fac'], 0.45, 0.7), 0.6), ramp.outputs['Color'], (0.14, 0.10, 0.20, 1))
    scl = t.node('ShaderNodeVectorMath'); scl.operation = 'SCALE'
    t.link(smoke, scl.inputs[0]); t.link(t.math('MULTIPLY', gi.outputs['Gain'], 6.0), scl.inputs['Scale'])
    t.link(scl.outputs['Vector'], go.inputs['Farbe'])
    return ng


def world():
    w = bpy.data.worlds.new('Nacht'); sc().world = w; w.use_nodes = True
    sky_group()   # Gruppen werden neu gefüllt, nicht ersetzt: Materialien behalten ihre Verbindungen
    S.WATER, S.AIR_DIST, S.AIR_HEIGHT, S.SKY_GAIN = LAVA_Z, AIR_DIST, AIR_HEIGHT, SKY_GAIN
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
    ld.energy = TOP_STRENGTH; ld.color = TOP_COLOR; ld.angle = math.radians(8.0)
    ob = link('Oben', ld)
    ob.rotation_euler = TOP.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    ld = bpy.data.lights.new('Glut See', 'AREA'); ld.shape = 'DISK'; ld.size = 2 * FOOT
    ld.energy = GLOW_ENERGY; ld.color = (1.0, 0.36, 0.10)
    ob = link('Glut See', ld)
    ob.location = (0.0, 0.0, LAVA_Z + 0.4)
    ob.rotation_euler = (math.pi, 0, 0)   # Flächenlampen leuchten entlang ihrer −Z: hier nach oben
    ob.visible_camera = False
    ob.visible_glossy = False


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
    build_slope()
    build_rim_rocks()
    build_lake()
    lights()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def replace_crater():
    _remove(['Boeschung', 'Bloecke', 'Felsen nah', 'See'])
    build_slope()
    build_rim_rocks()
    build_lake()


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove(['Oben', 'Glut See'])
    lights()


# ---------------------------------------------------------------- Export fürs Spiel

ROCK_TEX = 1024   # Bild der Felsbrocken am Ufer (gebackenes Licht), Seitenlänge auf dem Desktop; das Handy die halbe


def bake_rim_rocks(stil='volcano', samples=512):
    """Licht der Felsbrocken am Ufer backen wie am Strand (szenen/beach bake_near_rocks): Cycles COMBINED mit den
    Einstellungen des Panoramas, dazu Grundfarbe und Normale, entrauscht (anime.denoise) -> Bild „Felsen Licht“"""
    import importlib
    os.environ['WALD_STIL'] = stil
    import wald_export, anime
    wx = importlib.reload(wald_export)
    anime = importlib.reload(anime)
    ob = bpy.data.objects['Felsen nah']
    imgs = {}
    for key in ('licht', 'farbe', 'normale'):
        name = 'Felsen ' + key
        if bpy.data.images.get(name):
            bpy.data.images.remove(bpy.data.images[name])
        imgs[key] = bpy.data.images.new(name, ROCK_TEX, ROCK_TEX, float_buffer=True)
    mat = ob.data.materials[0]
    node = mat.node_tree.nodes.new('ShaderNodeTexImage')
    mat.node_tree.nodes.active = node
    scene = sc()
    bk = scene.render.bake
    wx.setup_cycles()
    wx.setv(bk, 'target', 'IMAGE_TEXTURES')
    wx.setv(bk, 'margin', 8)
    wx.setv(bk, 'view_from', 'ACTIVE_CAMERA')
    for attr in ('use_pass_direct', 'use_pass_indirect', 'use_pass_color', 'normal_space'):
        wx.setv(bk, attr, getattr(bk, attr))
    # die Vorlagen (gleiches Material) und die Blöcke würden sonst mitgebacken bzw. verdecken nichts: nur ob ist aktiv
    try:
        for key, kind, spp in (('licht', 'COMBINED', samples), ('farbe', 'DIFFUSE', 16), ('normale', 'NORMAL', 4)):
            node.image = imgs[key]
            scene.cycles.samples = spp
            if kind == 'DIFFUSE':
                bk.use_pass_direct = bk.use_pass_indirect = False
                bk.use_pass_color = True
            bk.normal_space = 'OBJECT'
            with S.only(ob):
                bpy.ops.object.bake(type=kind)
    finally:
        wx.restore()
        mat.node_tree.nodes.remove(node)
    px = {k: np.array(im.pixels[:], np.float64).reshape(ROCK_TEX, ROCK_TEX, 4)[::-1, :, :3] for k, im in imgs.items()}
    clean = anime.denoise(px['licht'], px['farbe'], px['normale'] * 2 - 1)
    for im in imgs.values():
        bpy.data.images.remove(im)
    return clean


def rock_model(sky, lin, stil='volcano'):
    """Felsbrocken am Ufer fürs Spiel (bakedMesh, wie am Strand rock_model): Ecken in Spielkoordinaten (Int16, 1/256 m),
    UV (Uint16), Dreiecke, rock8 überall 255 (nur Fels); das gebackene Licht gemalt wie das Panorama als
    sky/<stil>/rocks_hd.jpg und halb so gross rocks.jpg"""
    import base64, importlib
    from wald_io import save_image
    os.environ['WALD_STIL'] = stil
    import anime
    anime = importlib.reload(anime)
    painted = anime.paint_texture(lin)
    save_image(painted, os.path.join(sky, 'rocks_hd.jpg'), 'JPEG', 86)
    h, w = painted.shape[:2]
    save_image(painted.reshape(h // 2, 2, w // 2, 2, 3).mean((1, 3)), os.path.join(sky, 'rocks.jpg'), 'JPEG', 86)
    me = bpy.data.objects['Felsen nah'].data
    me.calc_loop_triangles()
    loops = np.empty(len(me.loop_triangles) * 3, np.int64); me.loop_triangles.foreach_get('loops', loops)
    vi = np.empty(len(me.loops), np.int64); me.loops.foreach_get('vertex_index', vi)
    uv = np.empty(len(me.loops) * 2); me.uv_layers.active.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    co = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    quv = np.clip(np.round(uv * 65535), 0, 65535).astype(np.int64)
    key = (vi * 65536 + quv[:, 0]) * 65536 + quv[:, 1]
    uniq, first, inv = np.unique(key, return_index=True, return_inverse=True)
    tri = inv[loops]
    pos = co[vi[first]]
    game = np.c_[pos[:, 0], pos[:, 2], -pos[:, 1]]                  # Blender -> Spiel
    n = len(uniq)
    b = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    idx = {'idx16': b(tri.astype('<u2'))} if n <= 65536 else {'idx32': b(tri.astype('<u4'))}
    return {'n': n, 'scale': 256, 'pos16': b(np.clip(np.round(game * 256), -32767, 32767).astype('<i2')), **idx,
            'uv16': b(quv[first].astype('<u2')), 'rock8': b(np.full(n, 255, 'u1')), 'texture': 'file:rocks.jpg'}


def export(stil='volcano'):
    """sky/<stil>/ebenen.json für pack.mjs: die Felsbrocken am Ufer (bakedMesh, Bild rocks.jpg, im HD-Teil
    rocks_hd.jpg). lavaPool rechnet alles andere selbst."""
    import json
    sky = os.path.join(ROOT, 'sky', stil)
    os.makedirs(sky, exist_ok=True)
    rocks = rock_model(sky, bake_rim_rocks(stil), stil)
    data = {'rocks': rocks, 'hd': {'rocks': {'texture': 'file:rocks_hd.jpg'}}}
    with open(os.path.join(sky, 'ebenen.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, separators=(',', ':'))
    return {'felsen_ecken': rocks['n']}
