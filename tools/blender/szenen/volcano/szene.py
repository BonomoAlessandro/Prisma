# Baut die Blender-Szene „Im Vulkan“ im Comic-Stil (Skybox volcano, PLAN 1.2). Über den Blender-MCP:
# wald_mcp.neu('volcano') baut sie und speichert tools/blender/volcano.blend; einzelne Teile neu mit
# wald_mcp.scene('volcano').replace_…(); export() schreibt die Daten der Ebenen (Lavafälle, Felsen im See).
# Aufbau: Das Brett schwebt im Krater über einem leuchtenden Lavasee (Kern gelb, nach aussen orange, am Rand rot, in
# flachen Stufen; wenige dunkle Felsen mit hellen Ringen). Rundum steigt der Krater in grossen Terrassen aus Blöcken
# auf (kühl blau- bis violettgrau, Oberseiten dunkel, die unteren Kanten jeder Stufe orange angeleuchtet, ein paar
# gelbe Schwefelflecken, Konturlinien wie im Comic). Lavafälle stürzen über die Terrassen in den See, Dampfwolken in
# klaren Formen steigen auf; oben durch die Öffnung ein dunkelblauer Nachthimmel (Sterne zeichnet das Spiel).
# Alles leuchtet aus sich (Emission) mit Cel-Shading in 2–3 Stufen nach festen Lichtrichtungen statt gerendertem
# Licht: klare Grenzen, kein Rauschen, schnell. Konturen aus dem Unterschied zwischen Flächennormale und gerundeter
# Normale (Bevel). Gemalt wird danach in anime.py (Stil „volcano“ in stile.py).
# Das Spiel zeichnet bewegt: den See ums Brett (lavaPool, bis LAVA_GAME; Blender malt dort nur eine Grundfarbe), die
# Lavafälle (lavaFalls, Pfade aus export(); Blender malt sie still darunter) und Dampf (steamPlumes).
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Panorama-Mittelpunkt (0, 0, 3).
import bpy, math, os, sys, time, json, importlib.util
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from wald_lib import Perlin, fbm
from wald_scene import make_mesh, NT


def _strand():
    """Baumodul der Strand-Szene (ohne Aufbau): Ringgitter, Ikosphäre, Sammlungen"""
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
LAVA_GAME = 23.0      # bis hier zeichnet das Spiel den See (radius von lavaPool), voll deckend bis LAVA_GAME − FADE
FADE = 2.5
# Terrassen von unten nach oben: Radius der Wand (Mitte), Höhe der Stufe. Unten eng (der See füllt den Schlot), nach
# oben weiter: ein Trichter, oben die Öffnung zum Himmel
TERRACES = [(26.0, 13.0), (30.0, 15.0), (35.0, 17.0), (41.0, 19.0), (48.0, 21.0), (56.0, 23.0), (65.0, 25.0),
            (75.0, 26.0)]
BLOCKS = 9            # Blöcke je Terrasse (+ 2 je Stufe nach oben): grosse, klare Formen
JITTER = 2.6          # so weit springt ein Block vor oder zurück (m, nach oben mehr)
BATTER = 1.2          # die Wand neigt sich je Stufe so weit nach aussen
LEDGE = 4.0           # Absätze reichen so weit hinter die nächste Wand
SEED = 7
TOP = Vector((0.35, -0.45, 0.82)).normalized()   # Licht von oben (Mond durch die Öffnung), Hauptlicht fürs Spiel
LINE = (0.020, 0.020, 0.055)                       # Konturen
B1, B2, B3 = (Perlin(s) for s in (401, 409, 419))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


# ---------------------------------------------------------------- Terrassen

def terrace_layout():
    """Je Terrasse: Unterkante z0, Oberkante z1 und die Blöcke [(Winkel von, bis, Radius unten)] (Winkel von +y über
    +x, Bogenmass). Fest aus SEED: Lavafälle und Felsen richten sich danach."""
    rng = np.random.default_rng(SEED)
    out = []
    z = LAVA_Z - 3.0
    for k, (r, h) in enumerate(TERRACES):
        n = BLOCKS + 2 * k
        cuts = np.sort((np.arange(n) + rng.uniform(-0.3, 0.3, n)) / n * 2 * np.pi + rng.uniform(0, 2 * np.pi))
        cuts = np.append(cuts, cuts[0] + 2 * np.pi)
        jit = JITTER * (1 + 0.2 * k)
        z1 = z + h + (3.0 if k == 0 else 0.0)
        # je Block eigene Oberkante: mal ein Sockel höher, mal eine Kerbe tiefer (oberste Stufe: gezackter Rand)
        tops = z1 + h * rng.choice([-0.3, -0.15, 0.0, 0.0, 0.12, 0.3], n) * (1.6 if k == len(TERRACES) - 1 else 1.0)
        blocks = [(cuts[j], cuts[j + 1], r + rng.uniform(-jit, jit), float(tops[j])) for j in range(n)]
        out.append((z, z1, blocks))
        z = z1
    return out


def block_at(layout, k, a):
    """Block von Terrasse k bei Winkel a: (von, bis, Radius unten, Oberkante)"""
    a = a % (2 * np.pi)
    for b in layout[k][2]:
        if b[0] <= a < b[1] or b[0] <= a + 2 * np.pi < b[1]:
            return b
    return layout[k][2][0]


def wall_radius(layout, k, a):
    """Radius der Wand von Terrasse k unten bei Winkel a"""
    return block_at(layout, k, a)[2]


def polar(a, r, z):
    return (r * math.sin(a), r * math.cos(a), z)


def terrace_mesh():
    """Stufen aus Blöcken: je Block eine senkrechte Wand (leicht nach aussen geneigt), seitlich Flächen zum Nachbarn,
    oben ein flacher Absatz bis hinter die nächste Wand. Flach schattiert: klare Facetten. Attribute: tier (Stufe),
    local (Höhe in der Stufe 0 … 1 an den Wänden, 2 an Absätzen und ihren Stufen), glow (Glut von unten je Block)."""
    layout = terrace_layout()
    V, F, tier, local, glow = [], [], [], [], []
    rng = np.random.default_rng(SEED + 3)
    g = 1.0
    def quad(ps, k, loc):
        i = len(V)
        V.extend(ps); tier.extend([k] * 4); local.extend(loc); glow.extend([g] * 4)
        F.append([i, i + 1, i + 2, i + 3])
    for k, (z0, z1, blocks) in enumerate(layout):
        r_next = TERRACES[k + 1][0] + JITTER * 3 + LEDGE if k + 1 < len(TERRACES) else 900.0
        zb = z0 - (0.0 if k == 0 else 0.35 * TERRACES[k][1])   # unter die tieferen Absätze der Stufe darunter
        for j, (a0, a1, r, top) in enumerate(blocks):
            g = rng.choice([0.35, 0.7, 1.0, 1.0, 1.4])   # Glut von unten je Block verschieden stark
            rt = r + BATTER
            lb = (zb - z0) / (top - z0)
            # Wand (zur Mitte hin sichtbar)
            quad([polar(a0, r, zb), polar(a1, r, zb), polar(a1, rt, top), polar(a0, rt, top)], k, [lb, lb, 1, 1])
            # Absatz
            quad([polar(a0, rt, top), polar(a1, rt, top), polar(a1, r_next, top), polar(a0, r_next, top)], k, [2, 2, 2, 2])
            # Seite zum nächsten Block: Stufe im Radius (Wand), Stufe in der Höhe (Absatz)
            _, _, rn, tn = blocks[(j + 1) % len(blocks)]
            hi = max(top, tn)
            if abs(rn - r) > 1e-3:
                quad([polar(a1, r, zb), polar(a1, rn, zb), polar(a1, rn + BATTER, hi), polar(a1, rt, hi)], k, [lb, lb, 1, 1])
            if abs(tn - top) > 1e-3:
                lo = min(top, tn)
                r0 = min(rt, rn + BATTER)
                quad([polar(a1, r0, lo), polar(a1, r_next, lo), polar(a1, r_next, hi), polar(a1, r0, hi)], k, [2] * 4)
    me = make_mesh('Terrassen', np.array(V), np.array(F), smooth=False)
    S.attrs(me, tier=np.array(tier, float), local=np.array(local, float), glow=np.array(glow, float))
    log('Terrassen', len(F), 'Flächen')
    return me, layout


def _outline(t, radius=0.35):
    """Kontur 0/1: wo die gerundete Normale (Bevel) von der Flächennormale abweicht – an Kanten und Ecken"""
    geo = t.node('ShaderNodeNewGeometry')
    bev = t.node('ShaderNodeBevel', in_Radius=radius); bev.samples = 8
    d = t.vmath('DOT_PRODUCT', bev.outputs['Normal'], geo.outputs['Normal'])
    return t.math('LESS_THAN', d, 0.93)


def _emit(t, col, line=None):
    """Fläche leuchtet in col (Comic: kein gerendertes Licht), Konturen darüber"""
    if line is not None:
        col = t.mix(line, col, LINE + (1,))
    out = t.node('ShaderNodeOutputMaterial')
    em = t.node('ShaderNodeEmission', in_Strength=1.0)
    t.link(col, em.inputs['Color'])
    t.link(em.outputs[0], out.inputs['Surface'])


def mat_rock(name='Fels'):
    """Fels kühl blau- bis violettgrau in Stufen: Oberseiten dunkel, Wände zum Mondlicht hin heller, sonst Schatten;
    die unteren Kanten jeder Stufe orange angeleuchtet (von der Lava, nach oben schwächer), ein paar Schwefelflecken"""
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = NT(m.node_tree)
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    n = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], n.inputs[0])
    p = t.node('ShaderNodeSeparateXYZ'); t.link(pos, p.inputs[0])
    def attr(nm):
        a = t.node('ShaderNodeAttribute'); a.attribute_name = nm
        return a.outputs['Fac']
    local = attr('local')
    h = t.math('SUBTRACT', p.outputs['Z'], LAVA_Z)
    up = t.math('GREATER_THAN', n.outputs['Z'], 0.6)
    lit = t.math('GREATER_THAN', t.vmath('DOT_PRODUCT', geo.outputs['Normal'], tuple(TOP)), 0.32)
    col = t.mix(lit, (0.085, 0.095, 0.17, 1), (0.17, 0.19, 0.31, 1))           # Schatten, Licht
    col = t.mix(up, col, (0.055, 0.060, 0.105, 1))                              # Oberseiten dunkel
    # zur Mitte (zum See) gewandt?
    radial = t.vmath('NORMALIZE', t.vmath('MULTIPLY', pos, (1, 1, 0)))
    inward = t.math('GREATER_THAN', t.math('MULTIPLY', t.vmath('DOT_PRODUCT', geo.outputs['Normal'], radial), -1.0), 0.25)
    # Glut von unten: Band unten an jeder Wand, breiter je näher am See; zwei Stufen
    glow = attr('glow')
    band = t.math('ADD', 0.05, t.math('MULTIPLY', 0.5, t.math('EXPONENT', t.math('DIVIDE', h, -28.0))))
    band = t.math('MULTIPLY', band, glow)   # je Block anders (glow)
    low = t.math('MULTIPLY', t.math('MULTIPLY', t.math('LESS_THAN', local, band), inward), t.math('SUBTRACT', 1.0, up))
    hot = t.math('MULTIPLY', low, t.math('LESS_THAN', local, t.math('MULTIPLY', band, 0.4)))
    col = t.mix(low, col, (0.40, 0.09, 0.035, 1))
    col = t.mix(hot, col, (0.64, 0.27, 0.05, 1))
    # ganz unten, knapp über der Lava, alles warm
    col = t.mix(t.math('MULTIPLY', t.math('LESS_THAN', h, 2.2), t.math('SUBTRACT', 1.0, up)), col, (0.64, 0.27, 0.05, 1))
    # Schwefel: wenige gelbe Flecken auf den Absätzen
    nz = t.node('ShaderNodeTexNoise', in_Scale=0.06, in_Detail=1.0); t.link(pos, nz.inputs['Vector'])
    sulfur = t.math('MULTIPLY', t.math('GREATER_THAN', nz.outputs['Fac'], 0.68), up)
    col = t.mix(sulfur, col, (0.62, 0.58, 0.12, 1))
    _emit(t, col, _outline(t))
    return m


def build_terraces():
    me, layout = terrace_mesh()
    me.materials.append(mat_rock())
    link('Terrassen', me)
    return layout


# ---------------------------------------------------------------- See, Felsen, Lavafälle

# Felsen im See: Winkel (Grad), Abstand von der Mitte, Radius, Höhe über der Lava
ROCKS = [(20, 21.5, 1.6, 1.4), (-35, 20.0, 1.2, 1.0), (75, 22.5, 1.9, 1.8), (150, 21.0, 1.4, 1.1),
         (205, 22.0, 2.1, 1.6), (260, 19.5, 1.1, 0.9), (310, 22.5, 1.5, 1.3), (110, 17.5, 0.9, 0.7)]
LAVA = [(0.66, 0.46, 0.06), (0.64, 0.29, 0.03), (0.55, 0.13, 0.02), (0.36, 0.04, 0.015)]   # Kern, hell, orange, Rand
RING = (0.72, 0.62, 0.26)


def rock_xy():
    return [(d * math.sin(math.radians(a)), d * math.cos(math.radians(a)), r, h) for a, d, r, h in ROCKS]


def lake_mesh(layout):
    """See als Scheibe bis unter die unterste Wand; Attribute: wall (Abstand zur Wand, m), ring (Abstand zum nächsten
    Felsen minus seinem Radius, m)"""
    r_max = max(b[2] for b in layout[0][2]) + 2.0
    X, Y, F = S.ring_mesh('See', 720, 0.3, r_max)
    X = np.concatenate([X, [0.0]]); Y = np.concatenate([Y, [0.0]])
    j = np.arange(720)
    fan = np.stack([np.full(720, len(X) - 1), (j + 1) % 720, j], -1)
    a = np.arctan2(X, Y)
    wall = np.array([wall_radius(layout, 0, ai) for ai in a]) - np.hypot(X, Y)
    ring = np.full(len(X), 99.0)
    for rx, ry, rr, _ in rock_xy():
        ring = np.minimum(ring, np.hypot(X - rx, Y - ry) - rr)
    me = make_mesh('See', np.stack([X, Y, np.full(len(X), LAVA_Z)], -1), [F, fan])
    S.attrs(me, wall=wall, ring=ring)
    return me


def mat_lava():
    """Leuchtende Lava in flachen Stufen: Kern gelb, Flecken heller und orange (langsam fliessende Formen), zur Wand hin
    orange, dann rot; helle Ringe um die Felsen. Unter dem See des Spiels nur die Grundfarbe."""
    m = bpy.data.materials.new('Lava'); m.use_nodes = True
    t = NT(m.node_tree)
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    def attr(nm):
        a = t.node('ShaderNodeAttribute'); a.attribute_name = nm
        return a.outputs['Fac']
    wall, ring = attr('wall'), attr('ring')
    nz = t.node('ShaderNodeTexNoise', in_Scale=0.16, in_Detail=1.0, in_Distortion=0.6); t.link(pos, nz.inputs['Vector'])
    f = nz.outputs['Fac']
    col = t.mix(t.math('GREATER_THAN', f, 0.56), LAVA[1] + (1,), LAVA[0] + (1,))
    col = t.mix(t.math('LESS_THAN', f, 0.38), col, LAVA[2] + (1,))
    r = t.vmath('LENGTH', t.vmath('MULTIPLY', pos, (1, 1, 0)))
    col = t.mix(t.math('LESS_THAN', r, LAVA_GAME - FADE - 0.5), col, LAVA[1] + (1,))   # unter dem Spiel: Grundfarbe
    col = t.mix(t.math('LESS_THAN', wall, 3.2), col, LAVA[2] + (1,))
    col = t.mix(t.math('LESS_THAN', wall, 1.3), col, LAVA[3] + (1,))
    col = t.mix(t.math('LESS_THAN', ring, 0.9), col, RING + (1,))
    col = t.mix(t.math('LESS_THAN', ring, 0.25), col, LAVA[3] + (1,))
    _emit(t, col)
    return m


def rock_mesh(rng, r, h):
    """Kantiger Brocken: verformte Ikosphäre (wenige Flächen), unten flach im See"""
    V, F = S._unit_sphere(1)
    V = V * np.array([r, r, h]) * rng.uniform(0.8, 1.2, (len(V), 1))
    V[:, 2] = np.maximum(V[:, 2], -0.6)
    return make_mesh('Fels', V, F, smooth=False)


def build_lake(layout):
    me = lake_mesh(layout)
    me.materials.append(mat_lava())
    link('See', me)
    rng = np.random.default_rng(SEED + 1)
    mat = bpy.data.materials.get('Fels') or mat_rock()
    for i, (x, y, r, h) in enumerate(rock_xy()):
        rm = rock_mesh(rng, r, h)
        rm.materials.append(mat)
        ob = link('Fels_%02d' % i, rm)
        ob.location = (x, y, LAVA_Z)
        ob.rotation_euler = (0, 0, rng.uniform(0, 6.3))


# Lavafälle: Winkel (Grad), oberste Terrasse (Index), Breite (m). Die meisten nach vorn (+y): In der Standardansicht
# des Spiels liegt dort der obere Bildrand
FALLS = [(-18.0, 3, 5.0), (24.0, 2, 4.0), (62.0, 4, 5.5), (-70.0, 2, 3.6), (165.0, 3, 4.5)]


def fall_path(layout, a, top):
    """Weg eines Lavafalls über die Stufen: über die Kante, die Wand hinab, über den Absatz darunter zur nächsten Kante
    usw. bis in den See. Punkte (x, y, z) in Blender"""
    pts = []
    for k in range(top, -1, -1):
        _, _, r, z1 = block_at(layout, k, a)
        lip = r + BATTER - 0.4
        if k == top:
            pts.append(polar(a, lip + 2.0, z1 + 0.25))
        pts.append(polar(a, lip, z1 + 0.25))
        # im Bogen über die Kante, dann an der Wand hinab bis auf den Absatz darunter (oder in den See)
        pts.append(polar(a, lip - 1.2, z1 - 1.5))
        if k == 0:
            pts.append(polar(a, r - 1.0, LAVA_Z))
        else:
            _, _, rb, zb = block_at(layout, k - 1, a)
            pts.append(polar(a, r - 1.0, zb + 0.25))
            pts.append(polar(a, rb + BATTER + 0.3, zb + 0.25))
    if pts[-1][2] > LAVA_Z:
        pts.append(polar(a, wall_radius(layout, 0, a) - 2.0, LAVA_Z))
    return pts


def ribbon(name, pts, width):
    """Band entlang pts, quer zur Wand (waagrecht, senkrecht zur Richtung zur Mitte)"""
    V, F = [], []
    for i, p in enumerate(pts):
        a = math.atan2(p[0], p[1])
        side = np.array([math.cos(a), -math.sin(a), 0.0]) * width / 2
        inset = -np.array([math.sin(a), math.cos(a), 0.0]) * 0.3   # etwas vor die Wand
        c = np.array(p) + inset
        V += [c - side, c + side]
        if i:
            F.append([2 * i - 2, 2 * i - 1, 2 * i + 1, 2 * i])
    return make_mesh(name, np.array(V), np.array(F), smooth=False)


def mat_fall():
    """Lavafall still (das Spiel lässt ihn fliessen): Mitte gelb, aussen orange, Rand rot"""
    m = bpy.data.materials.new('Lavafall'); m.use_nodes = True
    t = NT(m.node_tree)
    uv = t.node('ShaderNodeUVMap')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(uv.outputs['UV'], sep.inputs[0])
    v = t.math('ABSOLUTE', t.math('SUBTRACT', t.math('MULTIPLY', sep.outputs['Y'], 2.0), 1.0))
    col = t.mix(t.math('GREATER_THAN', v, 0.35), LAVA[0] + (1,), LAVA[1] + (1,))
    col = t.mix(t.math('GREATER_THAN', v, 0.72), col, LAVA[3] + (1,))
    _emit(t, col)
    return m


def build_falls(layout):
    mat = mat_fall()
    for i, (deg, top, w) in enumerate(FALLS):
        me = ribbon('Lavafall_%02d' % i, fall_path(layout, math.radians(deg), top), w)
        uvl = me.uv_layers.new()
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uvl.data[li].uv = (vi // 2, vi % 2)
        me.materials.append(mat)
        link('Lavafall_%02d' % i, me)


# ---------------------------------------------------------------- Dampf, Himmel

# Dampfwolken: Winkel (Grad), Abstand, Höhe der Basis über der Lava, Grösse
CLOUDS = [(5, 22.0, 0.0, 6.0), (95, 22.5, 2.0, 5.0), (190, 22.0, 0.0, 6.5), (280, 21.5, 1.0, 5.0),
          (40, 50.0, 70.0, 10.0), (230, 55.0, 85.0, 11.0), (140, 60.0, 110.0, 12.0), (320, 62.0, 120.0, 10.0)]


def cloud_lobes(rng, size):
    """Ballen einer Dampfwolke: eine Säule aus wenigen grossen, nach oben grösseren Kugeln"""
    lobes = []
    z, x = 0.0, 0.0
    for i in range(4):   # schlanker Stiel, leicht geschwungen
        r = size * (0.35 + 0.1 * i)
        x += rng.normal(0, size * 0.25)
        lobes.append((np.array([x, 0.0, z + r]), np.array([r, r, r * 1.25])))
        z += r * 1.7
    cap = size * 1.1   # breiter Kopf aus wenigen grossen Ballen
    for j in range(5):
        a = j / 5 * 2 * np.pi + rng.uniform(-0.3, 0.3)
        c = np.array([x + np.cos(a) * cap * 0.7, np.sin(a) * cap * 0.5, z + cap * rng.uniform(0.3, 0.7)])
        lobes.append((c, np.full(3, cap * rng.uniform(0.55, 0.75))))
    lobes.append((np.array([x, 0.0, z + cap * 0.9]), np.full(3, cap * 0.8)))
    return lobes


def mat_steam():
    """Dampf weiss bis rosa in drei Stufen nach dem Licht von oben, unten orange-rosa angestrahlt, mit Kontur"""
    m = bpy.data.materials.new('Dampf'); m.use_nodes = True
    t = NT(m.node_tree)
    geo = t.node('ShaderNodeNewGeometry')
    p = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Position'], p.inputs[0])
    n = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], n.inputs[0])
    d = t.vmath('DOT_PRODUCT', geo.outputs['Normal'], tuple(TOP))
    col = t.mix(t.math('GREATER_THAN', d, -0.1), (0.44, 0.40, 0.62, 1), (0.82, 0.62, 0.76, 1))
    col = t.mix(t.math('GREATER_THAN', d, 0.5), col, (0.97, 0.90, 0.94, 1))
    below = t.math('MULTIPLY', t.math('LESS_THAN', n.outputs['Z'], -0.25),
                   t.math('LESS_THAN', t.math('SUBTRACT', p.outputs['Z'], LAVA_Z), 14.0))
    col = t.mix(below, col, (1.0, 0.55, 0.38, 1))
    _emit(t, col, _outline(t, 0.25))
    return m


def build_steam():
    coll = S.collection('Dampf')
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    mat = mat_steam()
    rng = np.random.default_rng(SEED + 2)
    V0, F0 = S._unit_sphere(3)
    for k, (deg, dist, base, size) in enumerate(CLOUDS):
        lobes = cloud_lobes(rng, size)
        V = np.concatenate([V0 * rad + c for c, rad in lobes])
        F = np.concatenate([F0 + i * len(V0) for i in range(len(lobes))])
        me = make_mesh('Dampf_%02d' % k, V, F, smooth=True)
        tmp = link('Dampf_%02d_roh' % k, me, coll)
        mod = tmp.modifiers.new('Vereinen', 'REMESH'); mod.mode = 'VOXEL'; mod.voxel_size = size / 14
        dg = bpy.context.evaluated_depsgraph_get()
        out = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
        bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
        out.shade_smooth()
        out.materials.append(mat)
        ob = link('Dampf_%02d' % k, out, coll)
        a = math.radians(deg)
        ob.location = (dist * math.sin(a), dist * math.cos(a), LAVA_Z + base)
    log('Dampf', len(CLOUDS))


def world():
    """Nachthimmel durch die Öffnung: oben tiefes Dunkelblau, zum Rand hin etwas heller (kühler Gegenpol zur Lava)"""
    w = bpy.data.worlds.new('Nacht'); sc().world = w; w.use_nodes = True
    t = NT(w.node_tree)
    out = t.node('ShaderNodeOutputWorld')
    bg = t.node('ShaderNodeBackground', in_Strength=1.0)
    t.link(bg.outputs[0], out.inputs[0])
    tc = t.node('ShaderNodeTexCoord')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(t.vmath('NORMALIZE', tc.outputs['Generated']), sep.inputs[0])
    col = t.mix(t.math('GREATER_THAN', sep.outputs['Z'], 0.93), (0.035, 0.06, 0.17, 1), (0.012, 0.022, 0.08, 1))
    t.link(col, bg.inputs['Color'])
    return w


def lights():
    """Hauptlicht fürs Spiel (Richtung TOP); gerendert wird nur Emission, die Lampe beleuchtet nichts"""
    ld = bpy.data.lights.new('Oben', 'SUN'); ld.energy = 0.0
    ob = link('Oben', ld)
    ob.rotation_euler = TOP.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True


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
    layout = build_terraces()
    build_lake(layout)
    build_falls(layout)
    build_steam()
    lights()
    cameras()


def _remove(prefixes):
    for ob in list(bpy.data.objects):
        if ob.name.startswith(tuple(prefixes)):
            bpy.data.objects.remove(ob)


def replace_crater():
    _remove(['Terrassen', 'See', 'Fels_', 'Lavafall_'])
    for mt in [m for m in bpy.data.materials if m.name.startswith(('Fels', 'Lava'))]:
        bpy.data.materials.remove(mt)
    layout = build_terraces()
    build_lake(layout)
    build_falls(layout)


def replace_steam():
    build_steam()


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)


# ---------------------------------------------------------------- Export fürs Spiel

def game(p):
    """Blender (x, y, z) -> Spiel (x, y, z) = (x, z, −y), gerundet"""
    return [round(p[0], 2), round(p[2], 2), round(-p[1], 2)]


def export(stil='volcano'):
    """sky/<stil>/ebenen.json für pack.mjs: Lavafälle (Pfade und Breiten, Spielkoordinaten) und Felsen im See (x, z,
    Radius) für lavaFalls und lavaPool"""
    layout = terrace_layout()
    falls = [{'path': [game(p) for p in fall_path(layout, math.radians(deg), top)], 'width': w} for deg, top, w in FALLS]
    rocks = [[round(x, 2), round(-y, 2), round(r, 2)] for x, y, r, _ in rock_xy()]
    data = {'falls': {'falls': falls}, 'lake': {'rocks': rocks}}
    sky = os.path.join(ROOT, 'sky', stil)
    os.makedirs(sky, exist_ok=True)
    with open(os.path.join(sky, 'ebenen.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, separators=(',', ':'))
    return {'lavafaelle': len(falls), 'felsen': len(rocks)}
