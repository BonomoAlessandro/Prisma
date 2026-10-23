# Baut die Blender-Szene „Im Vulkan“ (Skybox volcano, PLAN 1.2), realistisch gerendert und danach gemalt wie der
# Strand. Über den Blender-MCP: wald_mcp.neu('volcano') baut sie und speichert tools/blender/volcano.blend; einzelne
# Teile neu mit wald_mcp.scene('volcano').replace_…(). Ohne MCP headless mit denselben Skripten (wald_mcp.run).
# Vorbilder: Nyiragongo (Lavasee aus dunkler Kruste mit glühenden Rissen, Dampfsäulen direkt aus dem See) und Erta Ale
# (Kraterwände aus waagrechten Lavaschichten mit Terrassen, grauschwarz, Rost- und Schwefelflecken).
# Aufbau: Das Brett schwebt im Schlot über dem Lavasee (LAVA_Z). Rundum fällt die Wand steil in den See: Schichten von
# einigen Metern, abwechselnd vor- und zurückspringend, dazwischen breitere Terrassen (BENCHES); oben ein unregelmässiger
# Rand, dahinter flach. Durch die Öffnung ein rauchiger Nachthimmel, unten vom Glühen angestrahlt. Dampfsäulen steigen
# aus dem See (Sammlung „Volumen“). Licht: die Lava von unten (Risse leuchten, dazu die Flächenlampe „Glut See“), kühl
# und schwach der Himmel von oben (Hauptlicht „Oben“).
# Den See bis LAVA_GAME zeichnet das Spiel selbst und bewegt (Ebene lavaPool: treibende Kruste, Risse, Blasen,
# Spritzer, Funken; Dampf: steamPlumes); Blender malt dort nur eine dunkle Grundfarbe (kleineres Bild, Budget).
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
FOOT = 27.0           # mittlerer Radius, an dem die Wand in den See fällt
LAVA_GAME = 23.0      # bis hier zeichnet das Spiel den See (radius von lavaPool), voll deckend bis LAVA_GAME − 2.5
SLOPE = 0.16          # die Wand weicht je Meter Höhe so weit zurück (gut 80°)
# Terrassen: Höhe über der Lava, Breite (m)
BENCHES = [(24.0, 5.0), (52.0, 7.0), (88.0, 9.0), (128.0, 11.0)]
RIM = 165.0           # Rand über der Lava (je Richtung ±20 m)
LAYER = 3.4           # mittlere Dicke einer Lavaschicht (m)
SEGMENTS = 1024       # Gitter der Wand rundum
TOP = Vector((-0.30, 0.35, 0.89)).normalized()   # kühles Licht von oben (Hauptlicht fürs Spiel)
B1, B2, B3, B4, B5 = (Perlin(s) for s in (503, 509, 521, 523, 541))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


def _hash(i, seed):
    """Zufall 0 … 1 je ganzer Zahl (Schicht, Abschnitt)"""
    v = (np.asarray(i, np.int64) * 73856093 ^ seed * 19349663) & 0x7fffffff
    v = (v * 1103515245 + 12345) & 0x7fffffff
    return (v % 100003) / 100003.0


# ---------------------------------------------------------------- Kraterwand

def rim_height(th):
    c, s = np.cos(th), np.sin(th)
    return RIM + 18 * fbm(B5, c * 1.6 + 3, s * 1.6 - 2, 3)


def wall_radius(th, h):
    """Radius der Wand bei Winkel th (Bogenmass, von +y über +x) und Höhe h über der Lava. Nur grobe Formen rundum
    (keine feinen senkrechten Rippen); die Schichtung läuft waagrecht."""
    th = np.asarray(th, float); h = np.asarray(h, float)
    c, s = np.cos(th), np.sin(th)
    r = FOOT + 3.0 * fbm(B1, c * 1.3 + 7, s * 1.3 - 4, 3) + 1.2 * fbm(B2, c * 4.0, s * 4.0, 2)
    r = r + SLOPE * np.maximum(h, 0) - 0.4 * np.minimum(h, 0)
    for k, (hb, wb) in enumerate(BENCHES):   # Terrassen: auf kurzer Höhe weit zurück, je Richtung schmaler oder breiter
        width = wb * (0.55 + 0.9 * (0.5 + 0.5 * fbm(B3, c * 2.2 + k * 5, s * 2.2 - k * 3, 2)))
        r = r + width * smoothstep(hb - 0.6, hb + 1.4, h)
    # Schichten: jede springt ein Stück vor oder zurück, unten mit überhängender Kante; die Fugen leicht gewellt
    q = (h + 1.6 * fbm(B4, c * 3.0, s * 3.0, 2)) / LAYER
    layer = np.floor(q)
    f = q - layer
    off = (_hash(layer, 11) - 0.5) * 1.4
    # innerhalb der Schicht in Abschnitte (6 … 14 m) gebrochen, die ein wenig verschieden weit vorstehen
    arc = th * r
    seg = np.floor(arc / (6 + 8 * _hash(layer, 5)) + _hash(layer, 7) * 10)
    off = off + (_hash(seg * 131 + layer, 3) - 0.5) * 0.7
    lip = 0.35 * smoothstep(0.85, 1.0, f)   # Oberkante jeder Schicht steht als Lippe vor
    r = r - off * smoothstep(0.0, 0.08, f) * smoothstep(1.0, 0.92, f) - lip
    return r, layer


def wall_mesh():
    """Wand als Zylindergitter (Winkel × Höhe), oben zum Rand hin flach nach aussen. Attribute: layer (Zufall der
    Schicht 0 … 1), h (Höhe über der Lava)"""
    n = SEGMENTS
    th = np.arange(n) * 2 * np.pi / n
    # Zeilen: unten fein (die Lava leuchtet die Kanten an), oben gröber
    hs = np.concatenate([np.arange(-3.0, 30.0, 0.35), np.arange(30.0, RIM + 30.0, 0.7)])
    T, H = np.meshgrid(th, hs)
    rim = rim_height(T)
    Hc = np.minimum(H, rim)
    R, layer = wall_radius(T, Hc)
    # über dem Rand: flach nach aussen (Plateau)
    R = R + np.maximum(H - rim, 0) * 25.0
    X, Y = R * np.sin(T), R * np.cos(T)
    Z = LAVA_Z + Hc + 0.05 * np.maximum(H - rim, 0)
    rows = len(hs)
    i = np.arange(rows - 1)[:, None]; j = np.arange(n)[None]
    F = np.stack(np.broadcast_arrays(i * n + j, (i + 1) * n + j, (i + 1) * n + (j + 1) % n, i * n + (j + 1) % n), -1).reshape(-1, 4)
    me = make_mesh('Wand', np.stack([X.ravel(), Y.ravel(), Z.ravel()], -1), F, smooth=False)
    S.attrs(me, layer=_hash(layer.ravel().astype(np.int64), 23), h=Hc.ravel())
    log('Wand', len(X.ravel()), 'Ecken')
    return me


def mat_wall():
    """Basalt grauschwarz, je Schicht etwas anders (manche rostrot, manche heller), Schwefel in Flecken; rau, mit Relief
    entlang der Schichten. Knapp über dem See glühende Spalten und Spritzer."""
    m = bpy.data.materials.new('Wand'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.9)
    def attr(nm):
        a = t.node('ShaderNodeAttribute'); a.attribute_name = nm
        return a.outputs['Fac']
    layer, h = attr('layer'), attr('h')
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    nz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nz.inputs[0])
    # Gestein, waagrecht gestreckt (Schichten)
    mp = t.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.6, 0.6, 2.2)
    t.link(pos, mp.inputs['Vector'])
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=8.0, in_Roughness=0.62); t.link(mp.outputs[0], n1.inputs['Vector'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=0.05, in_Detail=3.0); t.link(pos, n2.inputs['Vector'])
    base = t.mix(n1.outputs['Fac'], (0.034, 0.034, 0.040, 1), (0.10, 0.10, 0.11, 1))
    rust = t.math('MULTIPLY', t.math('GREATER_THAN', layer, 0.78), t.maprange(n2.outputs['Fac'], 0.42, 0.6))
    base = t.mix(rust, base, t.mix(n1.outputs['Fac'], (0.10, 0.035, 0.018, 1), (0.20, 0.08, 0.035, 1)))
    light = t.math('MULTIPLY', t.math('LESS_THAN', layer, 0.18), 0.6)
    base = t.mix(light, base, (0.13, 0.125, 0.12, 1))
    # Schwefel: wenige Flecken, vor allem auf den Absätzen und oben
    n3 = t.node('ShaderNodeTexNoise', in_Scale=0.035, in_Detail=4.0); t.link(pos, n3.inputs['Vector'])
    sulfur = t.math('MULTIPLY', t.maprange(n3.outputs['Fac'], 0.62, 0.7), t.maprange(h, 15.0, 40.0))
    sulfur = t.math('MULTIPLY', sulfur, t.maprange(nz.outputs['Z'], 0.2, 0.7, 0.4, 1.0))
    base = t.mix(sulfur, base, t.mix(n1.outputs['Fac'], (0.34, 0.27, 0.05, 1), (0.55, 0.47, 0.12, 1)))
    t.link(base, bsdf.inputs['Base Color'])
    # Relief: Blöcke und Kanten der Schichten
    bmp = t.node('ShaderNodeBump', in_Strength=0.6, in_Distance=0.4)
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=0.45); t.link(mp.outputs[0], vor.inputs['Vector'])
    t.link(t.math('ADD', n1.outputs['Fac'], t.math('MULTIPLY', vor.outputs['Distance'], 0.6)), bmp.inputs['Height'])
    t.link(bmp.outputs['Normal'], bsdf.inputs['Normal'])
    # knapp über der Lava: Spritzer und glühender Saum (keine Adern: die wirkten wie gezeichnet)
    splash = t.math('MULTIPLY', t.maprange(h, 1.2, 0.2), t.maprange(n1.outputs['Fac'], 0.4, 0.6))
    t.link(t.mix(splash, (1.0, 0.18, 0.03, 1), (1.0, 0.45, 0.08, 1)), bsdf.inputs['Emission Color'])
    t.link(t.math('MULTIPLY', splash, 6.0), bsdf.inputs['Emission Strength'])
    t.link(S.air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_wall():
    me = wall_mesh()
    me.materials.append(mat_wall())
    link('Wand', me)


# ---------------------------------------------------------------- Lavasee

CRACK_STRENGTH = 7.0
CRUST = (0.025, 0.020, 0.022)


def lake_mesh():
    """See als Scheibe bis unter die Wand; Attribut wall: Abstand zum Fuss der Wand (m, > 0 im See)"""
    r_max = FOOT + 6.0
    X, Y, F = S.ring_mesh('See', 1024, 0.3, r_max)
    X = np.concatenate([X, [0.0]]); Y = np.concatenate([Y, [0.0]])
    j = np.arange(1024)
    fan = np.stack([np.full(1024, len(X) - 1), (j + 1) % 1024, j], -1)
    r0, _ = wall_radius(np.arctan2(X, Y), np.zeros(len(X)))
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
    crack = t.math('MULTIPLY', crack, t.math('ADD', 0.15, t.math('MULTIPLY', open_, 0.85)))
    # Glutsaum an der Wand mit Spritzern
    sn = t.node('ShaderNodeTexNoise', in_Scale=0.6, in_Detail=3.0); t.link(pos, sn.inputs['Vector'])
    rim = t.math('MAXIMUM', t.maprange(wall, 1.4, 0.3), t.math('MULTIPLY', t.maprange(wall, 3.0, 1.2), t.maprange(sn.outputs['Fac'], 0.55, 0.68)))
    heat = t.math('MAXIMUM', crack, rim)
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.35, 0.03, 0.01, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (1.0, 0.62, 0.18, 1)
    e = cr.elements.new(0.45); e.color = (0.95, 0.20, 0.03, 1)
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
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.20, 0.11, 0.14, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.020, 0.028, 0.085, 1)
    for p, col in ((0.7, (0.22, 0.09, 0.17, 1)), (0.86, (0.08, 0.06, 0.20, 1))):
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


# ---------------------------------------------------------------- Dampf

STEAM_DENS = 0.22
STEAM_GLOW = (0.085, 0.082, 0.11)   # Grundhelligkeit des Dampfs


def mat_steam():
    """Dampf als Volumen: weiss-grau, streut das Licht der Lava von unten (rosa-orange) und des Himmels (oben grau-violett)"""
    m = bpy.data.materials.new('Dampf'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    vol = t.node('ShaderNodeVolumePrincipled', in_Anisotropy=0.35)
    vol.inputs['Color'].default_value = (0.86, 0.84, 0.88, 1)
    k = t.node('ShaderNodeAttribute'); k.attribute_type = 'OBJECT'; k.attribute_name = 'dichte'
    t.link(k.outputs['Fac'], vol.inputs['Density'])
    # Grundhelligkeit grau-violett (Streulicht des Himmels und der hellen Schwaden ringsum, gemalt): Im dichten Inneren
    # strebt die Helligkeit gegen diese Farbe, unten kommt das Licht der Lava dazu
    dens = t.node('ShaderNodeAttribute'); dens.attribute_name = 'density'
    vol.inputs['Emission Color'].default_value = STEAM_GLOW + (1,)
    t.link(t.math('MULTIPLY', dens.outputs['Fac'], k.outputs['Fac']), vol.inputs['Emission Strength'])
    t.link(vol.outputs[0], out.inputs['Volume'])
    return m


def column_lobes(rng, height, r0, r1, lean):
    """Ballen einer Dampfsäule: nach oben breiter und lockerer, leicht geneigt (lean: Versatz oben, x)"""
    lobes = []
    n = 16
    for i in range(n):
        f = i / (n - 1)
        r = r0 + (r1 - r0) * f ** 1.2
        c = np.array([lean * f ** 1.5 + rng.normal(0, r * 0.2), rng.normal(0, r * 0.2), f * height])
        for _ in range(3):
            v = rng.normal(size=3); v /= np.linalg.norm(v)
            lobes.append((c + v * r * 0.55, np.full(3, r * rng.uniform(0.45, 0.75))))
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


def volume_from(name, form_me, coll, mat, loc, rot, width, dichte):
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
    ob['dichte'] = dichte
    mv = ob.modifiers.new('Form', 'MESH_TO_VOLUME')
    mv.object = form
    mv.resolution_mode = 'VOXEL_SIZE'; mv.voxel_size = width / 70.0
    mv.interior_band_width = width / 25.0
    mv.density = 1.0
    tex = bpy.data.textures.new(name + ' Rand', 'CLOUDS')
    tex.cloud_type = 'COLOR'; tex.noise_scale = width * 0.12; tex.noise_depth = 3
    dp = ob.modifiers.new('Ausfransen', 'VOLUME_DISPLACE')
    dp.texture = tex; dp.texture_map_mode = 'LOCAL'
    dp.strength = width * 0.12
    dp.texture_mid_level = (0.5, 0.5, 0.5)
    return ob


# Dampfsäulen aus dem See: Winkel (Grad), Abstand von der Mitte, Höhe, Breite unten, oben. Die meisten vorn (+y): In
# der Standardansicht des Spiels liegt dort der obere Bildrand
STEAM = [(-10, 20.0, 48, 2.5, 7), (35, 18.5, 38, 2.0, 6), (80, 21.5, 52, 3.0, 8), (150, 20.0, 42, 2.5, 6.5),
         (215, 21.0, 55, 3.0, 8), (285, 19.5, 40, 2.2, 6), (-45, 22.5, 34, 2.0, 5)]


def build_volumes():
    coll = S.collection('Volumen')
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    mat = mat_steam()
    rng = np.random.default_rng(61)
    for k, (deg, d, h, r0, r1) in enumerate(STEAM):
        a = math.radians(deg)
        me = blob_mesh('Dampfform_%02d' % k, column_lobes(rng, h, r0, r1, -0.2 * h), r1 / 16.0)
        volume_from('Dampf_%02d' % k, me, coll, mat, (d * math.sin(a), d * math.cos(a), LAVA_Z - 1.0),
                    (0, 0, -a + math.pi / 2), r1 * 2, STEAM_DENS)
    log('Dampf', len(STEAM))


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
    build_wall()
    build_lake()
    build_volumes()
    lights()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def replace_crater():
    _remove(['Wand', 'See'])
    build_wall()
    build_lake()


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
    """Daten für die Ebenen des Spiels: keine (lavaPool und steamPlumes rechnen alles selbst). Eine alte ebenen.json
    entfernen."""
    path = os.path.join(ROOT, 'sky', stil, 'ebenen.json')
    if os.path.exists(path):
        os.remove(path)
    return {'ebenen': 0}
