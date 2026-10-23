# Baut die Blender-Szene „Wald bei Mondnacht“ und speichert sie als wald.blend.
# Aufruf: blender --background --factory-startup --python wald_scene.py
# Mit WALD_STIL=anime: dieselbe Szene für den gemalten Anime-Stil (hellere Nadeln mit Toon-Licht, Wolken, mehr Sterne)
# als wald_anime.blend; gemalt wird danach in anime.py.
# In der offenen Szene (Blender-MCP, siehe wald_mcp.py): replace_trees(), replace_ground(), replace_terrain(),
# replace_undergrowth() und replace_volumes() bauen Bäume, Boden, Gelände, Büsche und Felsen bzw. Nebel und Dunst mit
# den Werten unten neu, ohne den Rest anzufassen.
# Die Bäume näher als R_NEAR am Brett stehen im eigenen Objekt „Baeume nah“: Das Spiel zeichnet sie selbst
# (wald_spielbaum.py), im Panorama werfen sie nur Schatten (wald_export.py blendet sie für die Kamera aus).
import bpy, math, sys, os, time
import numpy as np
from mathutils import Vector, kdtree
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from wald_lib import terrain, terrain_slope, fog_top, spruce, fbm, smoothstep, N4, N5, N6, FOG
from wald_spielbaum import R_NEAR

T0 = time.time()
def log(*a):
    print('[%6.1fs]' % (time.time() - T0), *a, flush=True)

sc = bpy.context.scene
MOON = Vector((-0.8, -0.25, 0.5)).normalized()   # Spiel (-0.8, 0.5, 0.25)
PANO_CENTER = (0.0, 0.0, 3.0)
ANIME = os.environ.get('WALD_STIL') == 'anime'
# Wald: Rasterweite der Bäume nah (bis 150 m, detaillierte Modelle) und fern (bis 700 m); enger als etwa 1,8 m schliesst
# sich das Kronendach zu einer Fläche. Bestandskarte: unter STAND[0] steht nur noch jeder sechste Baum, über STAND[1]
# alle, dazwischen dünnt der Wald aus (lichte Stellen statt leerer Flächen).
TREE_GRID = (2.1, 2.6)
STAND = (-0.55, 0.15)
# Nebelmeer: Oberkante FOG_DROP unter FOG (das Gelände bleibt, wie es ist), Dichte im Kern; Dunst unten und oben
FOG_DROP = 5.0
FOG_TOP = FOG - FOG_DROP
FOG_CORE = 0.3
FOG_SOFT = 0.05   # Dichte im weichen Saum über der Oberkante
HAZE = (0.0015, 0.0002)
# Unterholz: junge Fichten und niedrige, breite Nadelbüsche (Wacholder) in Gruppen auf den Wiesen, Felsbrocken (an
# Hängen und auf Kuppen mehr); je Rasterweite und Radius
BUSH = (2.4, 420.0)
ROCK = (6.5, 520.0)
SNOW_Z = 230.0   # Schneegrenze im Gebirge (m)


# ---------------------------------------------------------------- Hilfen

def make_mesh(name, V, F, mat_idx=None, mats=(), smooth=True):
    """F: Flächen (n, k) oder eine Liste solcher Blöcke (etwa Vierecke und Dreiecke), in dieser Reihenfolge"""
    V = np.asarray(V, np.float32)
    blocks = [np.asarray(b, np.int32) for b in (F if isinstance(F, (list, tuple)) else [F])]
    size = sum(b.size for b in blocks)
    starts = np.concatenate([np.arange(0, b.size, b.shape[1]) + sum(c.size for c in blocks[:i])
                             for i, b in enumerate(blocks)]).astype(np.int32)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(V)); me.vertices.foreach_set('co', V.ravel())
    me.loops.add(size); me.loops.foreach_set('vertex_index', np.concatenate([b.ravel() for b in blocks]))
    me.polygons.add(len(starts)); me.polygons.foreach_set('loop_start', starts)
    if mat_idx is not None:
        me.polygons.foreach_set('material_index', np.asarray(mat_idx, np.int32))
    me.update(calc_edges=True)
    if smooth:
        me.shade_smooth()
    for m in mats:
        me.materials.append(m)
    return me


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc.collection).objects.link(ob)
    return ob


class NT:
    """Kurzschreibweise für Knotenbäume."""
    def __init__(self, tree):
        self.t = tree; self.n = tree.nodes; self.l = tree.links
        self.n.clear()

    def node(self, kind, **props):
        nd = self.n.new(kind)
        for k, v in props.items():
            if k.startswith('in_'):
                key = k[3:]
                key = int(key) if key.isdigit() else key.replace('__', ' ')
                nd.inputs[key].default_value = v
            else:
                setattr(nd, k, v)
        return nd

    def link(self, a, b):
        self.l.new(a, b)

    def math(self, op, a, b=None, clamp=False):
        nd = self.n.new('ShaderNodeMath'); nd.operation = op; nd.use_clamp = clamp
        for i, x in enumerate((a, b)):
            if x is None:
                continue
            if isinstance(x, (int, float)):
                nd.inputs[i].default_value = x
            else:
                self.l.new(x, nd.inputs[i])
        return nd.outputs[0]

    def vmath(self, op, a, b=None):
        nd = self.n.new('ShaderNodeVectorMath'); nd.operation = op
        for i, x in enumerate((a, b)):
            if x is None:
                continue
            if isinstance(x, (tuple, list)):
                nd.inputs[i].default_value = x
            else:
                self.l.new(x, nd.inputs[i])
        return nd.outputs['Value'] if op in ('DOT_PRODUCT', 'LENGTH', 'DISTANCE') else nd.outputs['Vector']

    def maprange(self, x, a, b, c=0.0, d=1.0, interp='SMOOTHSTEP'):
        nd = self.n.new('ShaderNodeMapRange'); nd.interpolation_type = interp; nd.clamp = True
        if isinstance(x, (int, float)):
            nd.inputs['Value'].default_value = x
        else:
            self.l.new(x, nd.inputs['Value'])
        nd.inputs['From Min'].default_value = a; nd.inputs['From Max'].default_value = b
        nd.inputs['To Min'].default_value = c; nd.inputs['To Max'].default_value = d
        return nd.outputs['Result']

    def mix(self, fac, a, b):
        nd = self.n.new('ShaderNodeMix'); nd.data_type = 'RGBA'; nd.clamp_factor = True
        for sock, x in ((nd.inputs[0], fac), (nd.inputs[6], a), (nd.inputs[7], b)):
            if isinstance(x, (tuple, list)):
                sock.default_value = x
            elif isinstance(x, (int, float)):
                sock.default_value = x
            else:
                self.l.new(x, sock)
        return nd.outputs[2]


# ---------------------------------------------------------------- Materialien

def mat_terrain():
    m = bpy.data.materials.new('Waldboden'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.92)
    t.link(bs.outputs[0], out.inputs['Surface'])
    tc = t.node('ShaderNodeTexCoord')
    pos = tc.outputs['Object']
    geo = t.node('ShaderNodeNewGeometry')
    nz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nz.inputs[0])
    steep = t.maprange(nz.outputs['Z'], 0.86, 0.66)          # 1 = Fels
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.35, in_Detail=6.0, in_Roughness=0.6); t.link(pos, n1.inputs['Vector'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=2.2, in_Detail=8.0, in_Roughness=0.65); t.link(pos, n2.inputs['Vector'])
    moss = t.maprange(n1.outputs['Fac'], 0.42, 0.62)
    # Flecken aus Heidekraut und Beerensträuchern (dunkler) zwischen Gras und Moos
    n4 = t.node('ShaderNodeTexNoise', in_Scale=0.1, in_Detail=3.0, in_Roughness=0.55); t.link(pos, n4.inputs['Vector'])
    heath = t.maprange(n4.outputs['Fac'], 0.43, 0.55)
    if ANIME:   # lichter Wald: Wiese und Moos grün (nicht so hell, dass sie gemalt wie Schnee wirken), dazwischen Heide
        litter = t.mix(n2.outputs['Fac'], (0.015, 0.019, 0.011, 1), (0.026, 0.032, 0.016, 1))
        ground = t.mix(moss, litter, (0.018, 0.038, 0.017, 1))
        ground = t.mix(heath, ground, (0.008, 0.016, 0.011, 1))
        rockc = t.mix(n2.outputs['Fac'], (0.022, 0.026, 0.028, 1), (0.045, 0.048, 0.052, 1))   # dunkel: hell gemalt wirkte er wie Schnee
    else:
        litter = t.mix(n2.outputs['Fac'], (0.009, 0.008, 0.007, 1), (0.018, 0.015, 0.012, 1))
        ground = t.mix(moss, litter, (0.011, 0.018, 0.009, 1))
        ground = t.mix(heath, ground, (0.006, 0.010, 0.006, 1))
        rockc = t.mix(n2.outputs['Fac'], (0.05, 0.05, 0.048, 1), (0.10, 0.10, 0.095, 1))
    col = t.mix(steep, ground, rockc)
    # fern (über 650): geschlossenes Kronendach
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(pos, sep.inputs[0])
    rr = t.math('SQRT', t.math('ADD', t.math('MULTIPLY', sep.outputs['X'], sep.outputs['X']), t.math('MULTIPLY', sep.outputs['Y'], sep.outputs['Y'])))
    canopy = t.maprange(rr, 600, 720)
    # ferner Wald in Beständen mit Wiesen dazwischen, nur unter der Baumgrenze und nicht auf Fels
    n5 = t.node('ShaderNodeTexNoise', in_Scale=0.012, in_Detail=3.0); t.link(pos, n5.inputs['Vector'])
    canopy = t.math('MULTIPLY', canopy, t.maprange(n5.outputs['Fac'], 0.4, 0.56))
    canopy = t.math('MULTIPLY', canopy, t.maprange(sep.outputs['Z'], 170.0, 110.0))
    canopy = t.math('MULTIPLY', canopy, t.math('SUBTRACT', 1.0, steep))
    n3 = t.node('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=4.0); t.link(pos, n3.inputs['Vector'])
    canc = t.mix(n3.outputs['Fac'], (0.006, 0.010, 0.008, 1), (0.020, 0.028, 0.022, 1))
    col = t.mix(canopy, col, canc)
    # Schnee im Gebirge: über der (welligen) Schneegrenze, wo es nicht zu steil ist
    line = t.math('ADD', SNOW_Z, t.math('MULTIPLY', t.math('SUBTRACT', n5.outputs['Fac'], 0.5), 160.0))
    snow = t.maprange(t.math('SUBTRACT', sep.outputs['Z'], line), -12.0, 12.0)
    snow = t.math('MULTIPLY', snow, t.maprange(nz.outputs['Z'], 0.42, 0.62))
    col = t.mix(snow, col, (0.62, 0.66, 0.74, 1))
    t.link(col, bs.inputs['Base Color'])
    # Unebenheit
    bump = t.node('ShaderNodeBump', in_Strength=0.6, in_Distance=0.08)
    hsum = t.math('ADD', t.math('MULTIPLY', n2.outputs['Fac'], t.math('SUBTRACT', 1.0, snow)), t.math('MULTIPLY', n3.outputs['Fac'], canopy))
    t.link(hsum, bump.inputs['Height'])
    t.link(bump.outputs[0], bs.inputs['Normal'])
    return m


def mat_bark():
    m = bpy.data.materials.new('Rinde'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.85, in_Base__Color=(0.045, 0.036, 0.03, 1))
    t.link(bs.outputs[0], out.inputs['Surface'])
    return m


def mat_needles():
    m = bpy.data.materials.new('Nadeln'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.62)
    bs.inputs['Specular IOR Level'].default_value = 0.35
    bs.inputs['Sheen Weight'].default_value = 0.12
    bs.inputs['Sheen Roughness'].default_value = 0.4
    bs.inputs['Sheen Tint'].default_value = (0.35, 0.4, 0.45, 1)
    oi = t.node('ShaderNodeObjectInfo')
    k = 4.5 if ANIME else 1.0   # Anime: Nadeln heller, damit Licht und Schatten die Kronen formen
    c1 = t.mix(oi.outputs['Random'], (0.006 * k, 0.011 * k, 0.007 * k, 1), (0.009 * k, 0.012 * k, 0.012 * k, 1))   # fichtengrün … bläulich
    tc = t.node('ShaderNodeTexCoord')
    nz = t.node('ShaderNodeTexNoise', in_Scale=9.0, in_Detail=2.0); t.link(tc.outputs['Object'], nz.inputs['Vector'])
    col = t.mix(t.math('MULTIPLY', nz.outputs['Fac'], 0.6), c1, (0.012 * k, 0.015 * k, 0.009 * k, 1))
    t.link(col, bs.inputs['Base Color'])
    surf = bs.outputs[0]
    if ANIME:
        # harte Stufe zwischen Licht und Schatten wie gemalt; der Glanzrand (Sheen) gibt den Kronen helle Kanten
        bs.inputs['Sheen Weight'].default_value = 0.6
        bs.inputs['Sheen Tint'].default_value = (0.55, 0.8, 0.85, 1)
        toon = t.node('ShaderNodeBsdfToon', in_Size=0.55, in_Smooth=0.12)
        t.link(col, toon.inputs['Color'])
        mt = t.node('ShaderNodeMixShader', in_Fac=0.6)
        t.link(surf, mt.inputs[1]); t.link(toon.outputs[0], mt.inputs[2])
        surf = mt.outputs[0]
    tr = t.node('ShaderNodeBsdfTranslucent', in_Color=(0.012 * k, 0.025 * k, 0.01 * k, 1))
    mx = t.node('ShaderNodeMixShader', in_Fac=0.1)
    t.link(surf, mx.inputs[1]); t.link(tr.outputs[0], mx.inputs[2])
    t.link(mx.outputs[0], out.inputs['Surface'])
    return m


def mat_fog():
    """Nebelmeer: Dichte nach Höhe über einer wogenden Oberkante, mit Schlieren; darüber lockere Schwaden."""
    m = bpy.data.materials.new('Nebel'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    pv = t.node('ShaderNodeVolumePrincipled', in_Anisotropy=0.55)
    pv.inputs['Color'].default_value = (0.92, 0.95, 1.0, 1)
    t.link(pv.outputs[0], out.inputs['Volume'])
    tc = t.node('ShaderNodeTexCoord')
    pos = tc.outputs['Object']
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(pos, sep.inputs[0])
    # Wogen (2D) und Schlieren (in Windrichtung gestreckt)
    xy = t.node('ShaderNodeCombineXYZ'); t.link(sep.outputs['X'], xy.inputs['X']); t.link(sep.outputs['Y'], xy.inputs['Y'])
    w1 = t.node('ShaderNodeTexNoise', noise_dimensions='2D', in_Scale=1 / 30, in_Detail=4.0, in_Roughness=0.55)
    t.link(xy.outputs[0], w1.inputs['Vector'])
    mp = t.node('ShaderNodeMapping', vector_type='POINT')
    mp.inputs['Rotation'].default_value = (0, 0, -math.atan2(0.34, 0.94))
    mp.inputs['Scale'].default_value = (1 / 90, 1 / 16, 1)
    t.link(xy.outputs[0], mp.inputs['Vector'])
    w2 = t.node('ShaderNodeTexNoise', noise_dimensions='2D', in_Scale=1.0, in_Detail=3.0)
    t.link(mp.outputs[0], w2.inputs['Vector'])
    top = t.math('ADD', t.math('MULTIPLY', t.math('SUBTRACT', w1.outputs['Fac'], 0.5), 4.0),
                 t.math('MULTIPLY', t.math('SUBTRACT', w2.outputs['Fac'], 0.5), 2.4))
    top = t.math('ADD', top, FOG_TOP)
    dz = t.math('SUBTRACT', sep.outputs['Z'], top)          # über der Oberkante positiv
    soft = t.maprange(dz, 2.5, -1.0)                         # weicher Saum über der Oberkante
    core = t.maprange(dz, -0.5, -5.0)                        # darunter dicht: verdeckt den Boden
    # Schwaden: 3D-Rauschen über der Oberkante
    w3 = t.node('ShaderNodeTexNoise', in_Scale=1 / 7.0, in_Detail=3.0, in_Roughness=0.5)
    mp3 = t.node('ShaderNodeMapping'); mp3.inputs['Scale'].default_value = (0.5, 1.4, 1.8)
    mp3.inputs['Rotation'].default_value = (0, 0, -math.atan2(0.34, 0.94))
    t.link(pos, mp3.inputs['Vector']); t.link(mp3.outputs[0], w3.inputs['Vector'])
    wisp = t.math('MULTIPLY', t.maprange(w3.outputs['Fac'], 0.52, 0.72), t.maprange(dz, 7.0, 0.0))
    dens = t.math('ADD', t.math('ADD', t.math('MULTIPLY', soft, FOG_SOFT), t.math('MULTIPLY', core, FOG_CORE)), t.math('MULTIPLY', wisp, 0.03))
    t.link(dens, pv.inputs['Density'])
    return m


def mat_haze(name, density):
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    pv = t.node('ShaderNodeVolumePrincipled', in_Anisotropy=0.6, in_Density=density)
    pv.inputs['Color'].default_value = (0.9, 0.93, 1.0, 1)
    t.link(pv.outputs[0], out.inputs['Volume'])
    return m


# ---------------------------------------------------------------- Himmel und Mond

def world():
    w = bpy.data.worlds.new('Mondnacht'); sc.world = w; w.use_nodes = True
    t = NT(w.node_tree)
    out = t.node('ShaderNodeOutputWorld')
    bg = t.node('ShaderNodeBackground', in_Strength=1.0)
    t.link(bg.outputs[0], out.inputs[0])
    tc = t.node('ShaderNodeTexCoord')
    d = t.vmath('NORMALIZE', tc.outputs['Generated'])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(d, sep.inputs[0])
    dh = t.vmath('NORMALIZE', t.vmath('MULTIPLY', d, (1, 1, 0)))
    mh = Vector((MOON.x, MOON.y, 0)).normalized()
    to_moon = t.math('MAXIMUM', t.vmath('DOT_PRODUCT', dh, (mh.x, mh.y, 0)), 0.0)
    horizon = t.mix(t.math('POWER', to_moon, 4.0), (0.030, 0.036, 0.050, 1), (0.10, 0.105, 0.115, 1))
    up = t.maprange(sep.outputs['Z'], -0.02, 0.6)
    sky = t.mix(up, horizon, (0.0025, 0.0045, 0.012, 1))
    # Mond, Hof, Sterne – nur für Kamerastrahlen (nicht als Lichtquelle: der Mond leuchtet als Sonnenlampe)
    r = t.math('ARCCOSINE', t.math('MINIMUM', t.vmath('DOT_PRODUCT', d, tuple(MOON)), 1.0))
    R = 0.0095
    disk = t.maprange(r, R * 1.06, R * 0.94)
    halo = t.math('ADD',
                  t.math('MULTIPLY', t.math('POWER', 2.0, t.math('MULTIPLY', t.math('MAXIMUM', t.math('SUBTRACT', r, R), 0.0), -1 / (1.5 * R))), 0.10),
                  t.math('MULTIPLY', t.math('EXPONENT', t.math('MULTIPLY', r, -1 / 0.2)), 0.025))
    # Mondoberfläche: Maria als Flecken
    mn = t.node('ShaderNodeTexNoise', in_Scale=260.0, in_Detail=3.0); t.link(d, mn.inputs['Vector'])
    moonc = t.math('MULTIPLY', disk, t.math('ADD', 2.2, t.math('MULTIPLY', t.maprange(mn.outputs['Fac'], 0.45, 0.6), -0.7)))
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=520.0); t.link(d, vor.inputs['Vector'])
    sel = t.node('ShaderNodeSeparateColor'); t.link(vor.outputs['Color'], sel.inputs[0])
    star = t.math('MULTIPLY', t.maprange(vor.outputs['Distance'], 0.045, 0.0, 0, 1, 'LINEAR'),
                  t.math('GREATER_THAN', sel.outputs[0], 0.78 if ANIME else 0.9))
    star = t.math('MULTIPLY', t.math('MULTIPLY', star, star), t.math('MULTIPLY', t.maprange(sep.outputs['Z'], 0.05, 0.4), 0.0 if ANIME else 0.06))   # Anime: Sterne erst beim Malen
    if ANIME:
        # Wolken: lockere Bänke über dem Horizont, zum Mond hin hell angestrahlt, sonst dunkel blaugrau
        cn = t.node('ShaderNodeTexNoise', in_Scale=2.2, in_Detail=3.0, in_Roughness=0.5)
        mp = t.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 1.0, 3.2)
        t.link(d, mp.inputs['Vector']); t.link(mp.outputs[0], cn.inputs['Vector'])
        band = t.math('MULTIPLY', t.maprange(sep.outputs['Z'], 0.03, 0.16), t.maprange(sep.outputs['Z'], 0.75, 0.4))
        cloud = t.math('MULTIPLY', t.maprange(cn.outputs['Fac'], 0.5, 0.66), band)
        near = t.math('POWER', t.math('MAXIMUM', t.vmath('DOT_PRODUCT', d, tuple(MOON)), 0.0), 6.0)
        ccol = t.mix(near, (0.010, 0.014, 0.030, 1), (0.20, 0.21, 0.24, 1))
        sky = t.mix(cloud, sky, ccol)
        star = t.math('MULTIPLY', star, t.math('SUBTRACT', 1.0, cloud))
    extra = t.math('ADD', t.math('ADD', moonc, halo), star)
    lp = t.node('ShaderNodeLightPath')
    extra = t.math('MULTIPLY', extra, lp.outputs['Is Camera Ray'])
    tint = t.n.new('ShaderNodeVectorMath'); tint.operation = 'SCALE'
    tint.inputs[0].default_value = (0.82, 0.87, 1.0)
    t.link(extra, tint.inputs['Scale'])
    col = t.vmath('ADD', sky, tint.outputs['Vector'])
    t.link(col, bg.inputs['Color'])
    return w


def moon_lamp():
    ld = bpy.data.lights.new('Mond', 'SUN')
    ld.energy = 1.0
    ld.color = (0.80, 0.87, 1.0)
    ld.angle = math.radians(0.55)
    ob = link('Mond', ld)
    ob.rotation_euler = MOON.to_track_quat('Z', 'Y').to_euler()
    return ob


# ---------------------------------------------------------------- Gelände

def terrain_mesh():
    nseg = 1024
    ratio = 1 + 2 * np.pi / nseg
    r0, rmax = 1.5, 3300.0
    radii = r0 * ratio ** np.arange(int(np.log(rmax / r0) / np.log(ratio)) + 1)
    a = np.arange(nseg) * 2 * np.pi / nseg
    X = radii[:, None] * np.cos(a)[None]; Y = radii[:, None] * np.sin(a)[None]
    Z = terrain(X, Y)
    V = np.concatenate([[[0, 0, terrain(np.array(0.0), np.array(0.0))]], np.stack([X, Y, Z], -1).reshape(-1, 3)])
    nr = len(radii)
    i = np.arange(nr - 1)[:, None]; j = np.arange(nseg)[None]; j1 = (j + 1) % nseg
    F = np.stack(np.broadcast_arrays(1 + i * nseg + j, 1 + i * nseg + j1, 1 + (i + 1) * nseg + j1, 1 + (i + 1) * nseg + j), -1).reshape(-1, 4)
    # Mitte unter dem Brett (Radius r0) als Fächer um die Ecke 0: Herausgezoomt sieht man unter die Platte (PLAN 2.37)
    jj = np.arange(nseg)
    fan = np.stack([np.zeros(nseg, np.int64), 1 + (jj + 1) % nseg, 1 + jj], -1)
    log('Gelände', len(V), 'Ecken')
    return make_mesh('Gelaende', V, [F, fan])


def build_terrain(mat):
    me = terrain_mesh()
    me.materials.append(mat)
    return link('Gelaende', me)


# ---------------------------------------------------------------- Bäume

def build_tree_variants(bark, needles):
    coll = bpy.data.collections.new('Baumvorlagen')
    sc.collection.children.link(coll)
    names = []
    for k in range(10):
        lod = 'hi' if k < 7 else 'lo'
        parts = spruce(1000 + k, lod)
        V = np.concatenate([p[0] for p in parts]); off = np.cumsum([0] + [len(p[0]) for p in parts])
        F = np.concatenate([p[1] + off[i] for i, p in enumerate(parts)])
        M = np.concatenate([np.full(len(p[1]), p[2]) for p in parts])
        me = make_mesh('v%02d' % k, V, F, M, mats=[bark, needles])
        link('v%02d' % k, me, coll)
        log('Fichte', k, lod, len(F), 'Vierecke')
    # Vorlagen nicht selbst rendern
    for lc in bpy.context.view_layer.layer_collection.children:
        if lc.collection == coll:
            lc.exclude = True
    return coll


def poisson_grid(rng, half, g, dmin_f=0.62):
    """Je Zelle ein Kandidat, zu nahe Nachbarn verworfen (gibt eine unregelmässige, gleichmässige Verteilung)."""
    n = int(2 * half / g)
    ix, iy = np.meshgrid(np.arange(n), np.arange(n), indexing='ij')
    P = np.stack([(ix + rng.random((n, n))) * g - half, (iy + rng.random((n, n))) * g - half], -1)
    rank = rng.random((n, n))
    keep = np.ones((n, n), bool)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            Q = np.roll(np.roll(P, -dx, 0), -dy, 1); rq = np.roll(np.roll(rank, -dx, 0), -dy, 1)
            close = np.linalg.norm(P - Q, axis=-1) < g * dmin_f
            keep &= ~(close & (rq < rank))
    return P[keep]


def tree_points():
    """Standorte, Vorlage, Grösse und Drehung aller Bäume"""
    rng = np.random.default_rng(7)
    sets = []
    for (rmin, rmax, g, lods) in ((3.5, 150, TREE_GRID[0], range(0, 7)), (150, 700, TREE_GRID[1], range(7, 10))):
        P = poisson_grid(rng, rmax, g)
        r = np.hypot(P[:, 0], P[:, 1])
        P = P[(r >= rmin) & (r < rmax)]
        sets.append((P, np.array(list(lods))))
    pos = []; var = []; scl = []; rot = []
    for P, lods in sets:
        x, y = P[:, 0], P[:, 1]
        z = terrain(x, y)
        slope = terrain_slope(x, y)
        fogt = fog_top(x, y) - FOG_DROP
        stand = fbm(N4, x / 16 + 40, y / 16 - 13, 3)            # Bestände und Lichtungen
        ok = (z > fogt - 7.0) & (slope < 1.15) & (rng.random(len(x)) < 0.16 + 0.84 * smoothstep(STAND[0], STAND[1], stand))
        x, y, z, stand = x[ok], y[ok], z[ok], stand[ok]
        n = len(x)
        h = np.interp(0.5 * (stand + 0.5) + 0.5 * rng.random(n), [0, 1], [2.7, 4.8])
        young = rng.random(n) < 0.12
        h[young] *= rng.uniform(0.4, 0.7, young.sum())
        rr = np.hypot(x, y)
        h = np.minimum(h, -2.0 - z + 0.08 * np.maximum(rr - 25, 0))   # nahe am Brett bleiben die Spitzen unter dem Brett
        h = np.maximum(h, 0.8)
        wfac = rng.uniform(0.88, 1.12, n)
        pos.append(np.stack([x, y, z - 0.12], -1))
        var.append(rng.choice(lods, n))
        scl.append(np.stack([h * wfac, h * wfac, h], -1))
        rot.append(np.stack([rng.normal(0, 0.035, n), rng.normal(0, 0.035, n), rng.uniform(0, 2 * np.pi, n)], -1))
    pos = np.concatenate(pos); var = np.concatenate(var); scl = np.concatenate(scl); rot = np.concatenate(rot)
    log('Bäume', len(pos), 'davon nah', int((var < 7).sum()))
    return pos, var, scl, rot


def points_mesh(near):
    """Punktwolke der Bäume näher (near) bzw. weiter als R_NEAR; die Attribute liest der Geometrieknoten
    „Baeume verteilen“"""
    pos, var, scl, rot = tree_points()
    sel = (np.hypot(pos[:, 0], pos[:, 1]) < R_NEAR) == near
    pos, var, scl, rot = pos[sel], var[sel], scl[sel], rot[sel]
    me = bpy.data.meshes.new('Baumpunkte nah' if near else 'Baumpunkte')
    me.vertices.add(len(pos)); me.vertices.foreach_set('co', pos.astype(np.float32).ravel())
    for name, kind, arr in (('variant', 'INT', var.astype(np.int32)), ('rot', 'FLOAT_VECTOR', rot), ('scl', 'FLOAT_VECTOR', scl)):
        at = me.attributes.new(name, kind, 'POINT')
        at.data.foreach_set('vector' if kind == 'FLOAT_VECTOR' else 'value', arr.astype(np.float32 if kind != 'INT' else np.int32).ravel())
    return me


def scatter_trees(coll):
    ob = link('Baeume', points_mesh(False))
    ng = bpy.data.node_groups.new('Baeume verteilen', 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N = ng.nodes; L = ng.links
    gi = N.new('NodeGroupInput'); go = N.new('NodeGroupOutput')
    ci = N.new('GeometryNodeCollectionInfo'); ci.transform_space = 'ORIGINAL'
    ci.inputs['Collection'].default_value = coll
    ci.inputs['Separate Children'].default_value = True
    ci.inputs['Reset Children'].default_value = True
    iop = N.new('GeometryNodeInstanceOnPoints')
    iop.inputs['Pick Instance'].default_value = True
    def named(name, dt):
        nd = N.new('GeometryNodeInputNamedAttribute'); nd.data_type = dt; nd.inputs['Name'].default_value = name
        return nd.outputs['Attribute']
    e2r = N.new('FunctionNodeEulerToRotation')
    L.new(named('rot', 'FLOAT_VECTOR'), e2r.inputs[0])
    L.new(gi.outputs[0], iop.inputs['Points'])
    L.new(ci.outputs[0], iop.inputs['Instance'])
    L.new(named('variant', 'INT'), iop.inputs['Instance Index'])
    L.new(e2r.outputs[0], iop.inputs['Rotation'])
    L.new(named('scl', 'FLOAT_VECTOR'), iop.inputs['Scale'])
    L.new(iop.outputs[0], go.inputs[0])
    mod = ob.modifiers.new('Verteilen', 'NODES'); mod.node_group = ng
    near = link('Baeume nah', points_mesh(True))
    near.modifiers.new('Verteilen', 'NODES').node_group = ng
    return ob


# ---------------------------------------------------------------- Unterholz

def blob(seed, n_sub, rough, flat):
    """Unregelmässiger Klumpen (Ikosaeder, mehrfach unterteilt, radial verbeult), Fuss bei z = 0, Höhe 1, Breite ~1"""
    import bmesh
    rng = np.random.default_rng(seed)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=n_sub, radius=0.5)
    V = np.array([v.co[:] for v in bm.verts])
    F = [[v.index for v in f.verts] for f in bm.faces]
    bm.free()
    d = V / np.linalg.norm(V, axis=1)[:, None]
    bump = np.zeros(len(V))
    for k, amp in ((2.0, 1.0), (4.5, 0.5), (9.0, 0.25)):
        ax = rng.normal(size=(3, 3))
        bump += amp * np.sin(d @ ax[0] * k + rng.uniform(0, 6)) * np.cos(d @ ax[1] * k + rng.uniform(0, 6))
    V = d * 0.5 * (1 + rough * bump / 1.75)[:, None]
    V[:, 2] = np.maximum(V[:, 2] * flat, -0.08)                 # unten abgeflacht, etwas im Boden
    V[:, 2] -= V[:, 2].min()
    V /= max(V[:, 2].max(), 1e-6)
    return V, np.array(F)


def mat_rock():
    m = bpy.data.materials.new('Fels'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    k = 0.75 if ANIME else 1.0   # Anime: sonst gemalt hell wie Schneehaufen
    tc = t.node('ShaderNodeTexCoord')
    nz = t.node('ShaderNodeTexNoise', in_Scale=3.0, in_Detail=6.0, in_Roughness=0.6); t.link(tc.outputs['Object'], nz.inputs['Vector'])
    col = t.mix(nz.outputs['Fac'], (0.045 * k, 0.047 * k, 0.05 * k, 1), (0.10 * k, 0.10 * k, 0.105 * k, 1))
    # Moos oben auf den Steinen
    geo = t.node('ShaderNodeNewGeometry')
    up = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], up.inputs[0])
    moss = t.math('MULTIPLY', t.maprange(up.outputs['Z'], 0.55, 0.85), t.maprange(nz.outputs['Fac'], 0.45, 0.6))
    col = t.mix(moss, col, (0.02 * k, 0.04 * k, 0.02 * k, 1))
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.9)
    t.link(col, bs.inputs['Base Color'])
    bump = t.node('ShaderNodeBump', in_Strength=0.5, in_Distance=0.05)
    t.link(nz.outputs['Fac'], bump.inputs['Height']); t.link(bump.outputs[0], bs.inputs['Normal'])
    t.link(bs.outputs[0], out.inputs['Surface'])
    return m


def undergrowth_points():
    """Büsche (Vorlagen 0–2) und Felsen (3–5): Standorte, Vorlage, Grösse, Drehung. Nicht im Nebel, nicht an den Bäumen."""
    rng = np.random.default_rng(11)
    tpos = tree_points()[0]
    kd = kdtree.KDTree(len(tpos))
    for i, p in enumerate(tpos):
        kd.insert((p[0], p[1], 0.0), i)
    kd.balance()
    out = []
    for kind, (g, rmax) in (('bush', BUSH), ('rock', ROCK)):
        P = poisson_grid(rng, rmax, g, 0.55)
        x, y = P[:, 0], P[:, 1]
        r = np.hypot(x, y)
        keep = (r > 3.0) & (r < rmax)
        x, y = x[keep], y[keep]
        z = terrain(x, y)
        slope = terrain_slope(x, y)
        fogt = fog_top(x, y) - FOG_DROP
        if kind == 'bush':   # in Gruppen, auf Wiesen; nicht in steilem Fels
            grp = fbm(N5, x / 14 - 9, y / 14 + 4, 3)
            ok = (z > fogt - 2) & (slope < 0.9) & (rng.random(len(x)) < 0.1 + 0.9 * smoothstep(-0.05, 0.3, grp))
        else:                # Felsen: an Hängen und Kuppen häufiger
            ok = (z > fogt - 4) & (rng.random(len(x)) < 0.25 + 0.75 * smoothstep(0.25, 0.8, slope))
        x, y, z = x[ok], y[ok], z[ok]
        near = np.array([kd.find((a, b, 0.0))[2] for a, b in zip(x, y)])
        ok = near > (1.0 if kind == 'bush' else 1.6)
        x, y, z = x[ok], y[ok], z[ok]
        n = len(x)
        if kind == 'bush':   # Vorlagen 0–2: einfache Fichten; jung (schlank) oder als breiter, niedriger Busch
            squat = rng.random(n) < 0.45
            h = np.where(squat, rng.uniform(0.35, 0.7, n), rng.uniform(0.5, 1.5, n))
            w = h * np.where(squat, rng.uniform(2.6, 3.6, n), rng.uniform(0.9, 1.15, n))
            var = rng.integers(0, 3, n); sink = 0.05
        else:
            h = rng.lognormal(-0.6, 0.55, n).clip(0.2, 2.6); w = h * rng.uniform(1.3, 2.2, n)
            var = rng.integers(3, 6, n); sink = 0.2 * h
        out.append((np.c_[x, y, z - sink], var, np.c_[w, w * rng.uniform(0.7, 1.0, n), h],
                    np.c_[np.zeros(n), np.zeros(n), rng.uniform(0, 2 * np.pi, n)]))
        log(kind, n)
    return [np.concatenate(a) for a in zip(*out)]


def build_undergrowth_templates():
    coll = bpy.data.collections.get('Bodenvorlagen') or bpy.data.collections.new('Bodenvorlagen')
    if coll.name not in sc.collection.children:
        sc.collection.children.link(coll)
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    rock = mat_rock()
    for k in range(3):   # Büsche und junge Fichten: die einfachen Fichten v07–v09 (gleiche Netze wie im Wald)
        coll.objects.link(bpy.data.objects.new('u%02d' % k, bpy.data.objects['v%02d' % (7 + k)].data))
    for k in range(3, 6):
        V, F = blob(500 + k, 3, 0.22, 0.6)
        me = bpy.data.meshes.new('u%02d' % k)
        me.from_pydata(V.tolist(), [], F.tolist())
        me.update(); me.shade_smooth()
        me.materials.append(rock)
        coll.objects.link(bpy.data.objects.new('u%02d' % k, me))
    for lc in bpy.context.view_layer.layer_collection.children:
        if lc.collection == coll:
            lc.exclude = True
    return coll


def instancer(name, coll):
    """Geometrieknoten: auf jeden Punkt eine Vorlage aus coll (Attribute variant, rot, scl)"""
    ng = bpy.data.node_groups.new(name, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    N = ng.nodes; L = ng.links
    gi = N.new('NodeGroupInput'); go = N.new('NodeGroupOutput')
    ci = N.new('GeometryNodeCollectionInfo'); ci.transform_space = 'ORIGINAL'
    ci.inputs['Collection'].default_value = coll
    ci.inputs['Separate Children'].default_value = True
    ci.inputs['Reset Children'].default_value = True
    iop = N.new('GeometryNodeInstanceOnPoints')
    iop.inputs['Pick Instance'].default_value = True
    def named(nm, dt):
        nd = N.new('GeometryNodeInputNamedAttribute'); nd.data_type = dt; nd.inputs['Name'].default_value = nm
        return nd.outputs['Attribute']
    e2r = N.new('FunctionNodeEulerToRotation')
    L.new(named('rot', 'FLOAT_VECTOR'), e2r.inputs[0])
    L.new(gi.outputs[0], iop.inputs['Points'])
    L.new(ci.outputs[0], iop.inputs['Instance'])
    L.new(named('variant', 'INT'), iop.inputs['Instance Index'])
    L.new(e2r.outputs[0], iop.inputs['Rotation'])
    L.new(named('scl', 'FLOAT_VECTOR'), iop.inputs['Scale'])
    L.new(iop.outputs[0], go.inputs[0])
    return ng


def undergrowth_mesh():
    pos, var, scl, rot = undergrowth_points()
    me = bpy.data.meshes.new('Unterholzpunkte')
    me.vertices.add(len(pos)); me.vertices.foreach_set('co', pos.astype(np.float32).ravel())
    for name, kind, arr in (('variant', 'INT', var.astype(np.int32)), ('rot', 'FLOAT_VECTOR', rot), ('scl', 'FLOAT_VECTOR', scl)):
        at = me.attributes.new(name, kind, 'POINT')
        at.data.foreach_set('vector' if kind == 'FLOAT_VECTOR' else 'value', arr.astype(np.float32 if kind != 'INT' else np.int32).ravel())
    return me


def replace_undergrowth():
    """Büsche und Felsen in der offenen Szene (neu) anlegen"""
    coll = build_undergrowth_templates()
    ob = bpy.data.objects.get('Unterholz')
    if ob is None:
        ob = link('Unterholz', undergrowth_mesh())
    else:
        old = ob.data; ob.data = undergrowth_mesh(); bpy.data.meshes.remove(old)
    ob.modifiers.clear()
    ng = bpy.data.node_groups.get('Unterholz verteilen') or instancer('Unterholz verteilen', coll)
    ob.modifiers.new('Verteilen', 'NODES').node_group = ng
    return len(ob.data.vertices)


def replace_terrain():
    """Gelände und Boden in der offenen Szene neu bauen"""
    ob = bpy.data.objects['Gelaende']
    old = ob.data
    me = terrain_mesh()
    me.materials.append(mat_terrain())
    ob.data = me
    for m in old.materials:
        if m and m.users <= 1:
            bpy.data.materials.remove(m)
    bpy.data.meshes.remove(old)
    me.materials[0].name = 'Waldboden'


# ---------------------------------------------------------------- Nebel und Dunst

def cylinder(name, radius, z0, z1, seg=96):
    a = np.arange(seg) * 2 * np.pi / seg
    ring = np.stack([radius * np.cos(a), radius * np.sin(a)], -1)
    V = np.concatenate([np.c_[ring, np.full(seg, z0)], np.c_[ring, np.full(seg, z1)]])
    j = np.arange(seg); j1 = (j + 1) % seg
    faces = [list(f) for f in np.stack([j, j1, seg + j1, seg + j], -1).tolist()]
    faces.append(list(range(seg - 1, -1, -1)))          # Boden (nach unten)
    faces.append(list(range(seg, 2 * seg)))             # Deckel (nach oben)
    me = bpy.data.meshes.new(name)
    me.from_pydata(V.tolist(), [], faces)
    me.update()
    return me


def volumes():
    """(Name, Netz, Material) von Nebel und Dunst"""
    return (('Nebel', cylinder('Nebel', 3300, -70, FOG_TOP + 8), mat_fog()),
            ('Dunst unten', cylinder('Dunst unten', 3400, -80, 0), mat_haze('Dunst unten', HAZE[0])),
            ('Dunst oben', cylinder('Dunst oben', 3400, -0.4, 400), mat_haze('Dunst oben', HAZE[1])))


def build_volumes():
    for name, me, mat in volumes():
        me.materials.append(mat)
        link(name, me)


def replace_trees():
    """Bäume in der offenen Szene neu verteilen (legt „Baeume nah“ an, falls es fehlt)"""
    far = bpy.data.objects['Baeume']
    if 'Baeume nah' not in bpy.data.objects:
        near = link('Baeume nah', bpy.data.meshes.new('Baumpunkte nah'))
        near.modifiers.new('Verteilen', 'NODES').node_group = far.modifiers['Verteilen'].node_group
    n = {}
    for ob, is_near in ((far, False), (bpy.data.objects['Baeume nah'], True)):
        old = ob.data
        ob.data = points_mesh(is_near)
        bpy.data.meshes.remove(old)
        n[ob.name] = len(ob.data.vertices)
    return n


def replace_ground():
    """Material des Geländes in der offenen Szene neu bauen"""
    me = bpy.data.objects['Gelaende'].data
    old = me.materials[0]
    me.materials[0] = mat = mat_terrain()
    bpy.data.materials.remove(old)
    mat.name = 'Waldboden'


def replace_volumes():
    """Nebel und Dunst in der offenen Szene neu bauen"""
    for name, me, mat in volumes():
        ob = bpy.data.objects[name]
        old = ob.data
        me.materials.append(mat)
        ob.data = me
        for m in old.materials:
            if m and m.users <= 1:
                bpy.data.materials.remove(m)
        bpy.data.meshes.remove(old)
        me.name = mat.name = name


# ---------------------------------------------------------------- Kameras

def cameras():
    cd = bpy.data.cameras.new('Panorama'); cd.type = 'PANO'; cd.panorama_type = 'EQUIRECTANGULAR'
    cd.clip_start = 0.05; cd.clip_end = 10000
    pano = link('Panorama', cd); pano.location = PANO_CENTER; pano.rotation_euler = (math.pi / 2, 0, 0)
    gd = bpy.data.cameras.new('Spielkamera'); gd.sensor_fit = 'VERTICAL'; gd.angle_y = math.radians(32)
    gd.clip_start = 0.05; gd.clip_end = 10000
    game = link('Spielkamera', gd)
    sc.camera = pano
    return pano, game


# ---------------------------------------------------------------- Aufbau

def build():
    """Ganze Szene in die (leere) aktuelle Datei bauen"""
    global sc
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    bark, needles = mat_bark(), mat_needles()
    build_terrain(mat_terrain())
    coll = build_tree_variants(bark, needles)
    scatter_trees(coll)
    ob = link('Unterholz', undergrowth_mesh())
    ob.modifiers.new('Verteilen', 'NODES').node_group = instancer('Unterholz verteilen', build_undergrowth_templates())
    build_volumes()
    world()
    moon_lamp()
    cameras()


if __name__ == '__main__':
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    path = os.path.join(HERE, 'wald_anime.blend' if ANIME else 'wald.blend')
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
    log('gespeichert', path)
