# Baut die Blender-Szene „Strand bei Sonnenuntergang“ (Skybox beach, gemalt wie der Wald, PLAN 2.33). Über den
# Blender-MCP: wald_mcp.neu('beach') baut sie und speichert tools/blender/beach.blend; einzelne Teile neu mit
# wald_mcp.scene('beach').replace_…().
# Aufbau wie der frühere Strand des Spiels (PLAN 2.25): Das Brett schwebt über einer flachen, türkisen Lagune, der Strand
# liegt dahinter (Blender +y), links eine felsige Landzunge bis neben das Brett, nach vorn eine Kante ins tiefe Blau. Die
# Sonne steht tief (SUN_ELEV) über dem Meer rechts und spiegelt sich als Pfad im Wasser. Hinter dem Strand Dünen mit
# Gras, Palmen, Buschwald und grüne Hügel, in der Ferne bewachsene Berge im Dunst; rundum Haufenwolken, zur Sonne hin
# warm angestrahlt, im Schatten lavendelblau.
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Wasser bei z = −3, Panorama-Mittelpunkt (0, 0, 3).
# Was näher als R_NEAR am Brett steht (Palmen, Bäume, Büsche), liegt in der Sammlung „Spiel“: Die Panoramakamera sieht
# es nicht (nur seine Schatten), das Spiel zeichnet es selbst. Die Wolken liegen in der Sammlung „Volumen“ (nicht in
# Tiefe und Himmelsmaske); den Dunst rechnet jedes Material selbst (air, Luftperspektive ohne Rauschen).
import bpy, math, os, sys, time
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from wald_lib import Perlin, fbm, ridged, smoothstep
from wald_scene import make_mesh, NT

T0 = time.time()
def log(*a):
    print('[%6.1fs]' % (time.time() - T0), *a, flush=True)

WATER = -3.0
PANO_CENTER = (0.0, 0.0, 3.0)
SUN_ELEV = 7.0       # Grad über dem Horizont: tief, golden (bei 12° wirkte es wie später Nachmittag)
SUN = Vector((0.941 * math.cos(math.radians(SUN_ELEV)), -0.338 * math.cos(math.radians(SUN_ELEV)),
              math.sin(math.radians(SUN_ELEV)))).normalized()   # über dem Meer rechts (Spiel: +x, etwas nach vorn)
R_NEAR = 45.0        # näher zeichnet das Spiel selbst (Parallaxe: die Kamera steht bis ~25 neben dem Mittelpunkt)
B1, B2, B3, B4, B5, B6, B7, B8, B9 = (Perlin(s) for s in (101, 113, 127, 131, 137, 139, 149, 151, 157))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


def mesh(name, V, F, M=None, mats=(), smooth=True):
    """Netz aus Ecken und Flächen beliebiger Eckenzahl (make_mesh des Walds braucht gleich viele), M: Material je Fläche"""
    me = bpy.data.meshes.new(name)
    me.from_pydata(np.asarray(V, float).tolist(), [], [list(map(int, f)) for f in F])
    if M is not None:
        me.polygons.foreach_set('material_index', np.asarray(M, np.int32))
    for m in mats:
        me.materials.append(m)
    me.update()
    if smooth:
        me.shade_smooth()
    return me


def collection(name, exclude=False):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in sc().collection.children:
        sc().collection.children.link(c)
    for lc in bpy.context.view_layer.layer_collection.children:
        if lc.collection == c:
            lc.exclude = exclude
    return c


# ---------------------------------------------------------------- Gelände

# Kleine Insel: eine längliche Ellipse um (0, ISLE_C) mit den Halbachsen ISLE_A (quer) und ISLE_B (in die Tiefe). Der
# Strand vor dem Brett krümmt sich nach beiden Seiten weg und verschwindet gut 100 m seitlich hinter der Rundung (vom
# Brett aus bei rund ±80°); dahinter zwei Berge, teils bewaldet. Ringsum eine Lagune, gut REEF draussen ein Riff mit
# Brandung, dann das offene Meer bis zum Horizont.
ISLE_A, ISLE_B = 380.0, 200.0
ISLE_C = 10.5 + ISLE_B
HILLS = [(-75.0, 245.0, 82.0, 175.0), (170.0, 190.0, 50.0, 120.0)]   # Berge: x, y, Höhe, Radius
REEF = 140.0         # Riffdach: so weit vor dem Strand (je Stelle ±25 m)
SEA_FLOOR = -34.0    # tiefster Grund: auch flache Blicke treffen ihn (sonst endete das Meer 5° unter dem Horizont)
EXTENT = 30000.0     # Gelände und Wasser bis weit hinter den Horizont (in der Ferne nur noch Dunst)


class Ground:
    """Gelände an Punkten (ground): z, rock (Fels 0…1), veg (Bewuchs am Boden), grass, forest (Wald 0…1), s (Abstand
    zur Wasserlinie, > 0 an Land), reef (Riffdach 0…1), lagoon (Muster des Grunds 0…1)"""


def coast(x, y):
    """Abstand zur Wasserlinie der Insel (> 0 an Land): Ellipse, an den Seiten mit Buchten und Kaps, vor dem Brett
    die Bögen und die Bucht neben der Landzunge wie bisher"""
    dx = x / ISLE_A; dy = (y - ISLE_C) / ISLE_B
    ang = np.arctan2(dy, dx)
    side = 1 - np.exp(-(x / 110.0) ** 2)
    bump = side * (0.05 * np.sin(3 * ang + 0.7) + 0.035 * np.sin(5 * ang + 2.1) + 0.02 * np.sin(9 * ang + 4.0))
    r = np.hypot(dx, dy) + 1e-9
    s = (1 - r / (1 + bump)) / (np.hypot(dx / ISLE_A, dy / ISLE_B) / (r * (1 + bump)))
    s = s - 1.8 * np.sin(0.085 * x + 0.6) * np.exp(-(x / 70.0) ** 2) + 8 * np.exp(-((x + 22) / 7) ** 2)
    return s + fbm(B1, x * 0.05 + 3.3, y * 0.05 - 8.1, 3) * 2.0


def _hash4(cx, cy, seed):
    """vier Zufallszahlen 0 … 1 je ganzzahliger Zelle (cx, cy)"""
    v = ((cx * 73856093) ^ (cy * 19349663) ^ (seed * 83492791)) & 0x7fffffff
    out = []
    for k in range(4):
        v = (v * 1103515245 + 12345 + k * 2654435761) & 0x7fffffff
        out.append((v % 100003) / 100003.0)
    return out


def facets(x, y, cell, seed):
    """Bruchflächen des Felses: Zellen (Voronoi, Grösse cell), je Zelle eine schräge Ebene durch ihren Punkt; an den
    Zellgrenzen scharfe Grate, Kehlen und kleine Abbrüche – kantig statt rundlich. Höhe um 0,5"""
    gx = np.floor(x / cell).astype(np.int64); gy = np.floor(y / cell).astype(np.int64)
    best = np.full(x.shape, np.inf); h = np.zeros(x.shape)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            cx, cy = gx + dx, gy + dy
            r = _hash4(cx, cy, seed)
            px = (cx + 0.1 + 0.8 * r[0]) * cell; py = (cy + 0.1 + 0.8 * r[1]) * cell
            d2 = (x - px) ** 2 + (y - py) ** 2
            ang = r[2] * 2 * np.pi; sl = 0.3 + 0.6 * r[3]
            hp = 0.5 + 0.4 * (r[0] - 0.5) + sl * (np.cos(ang) * (x - px) + np.sin(ang) * (y - py)) / cell
            m = d2 < best
            best = np.where(m, d2, best); h = np.where(m, hp, h)
    return h


def ground(x, y):
    x = np.asarray(x, float); y = np.asarray(y, float)
    g = Ground()
    s = coast(x, y)
    d = np.maximum(-s, 0.0)
    # Grund: am Ufer rasch tiefer, dann eine Lagune (weiter draussen tiefer, mit Korallenköpfen), das Riffdach knapp
    # unter Wasser, dahinter der Abfall ins Tiefe. Tiefer als SEA_FLOOR nie.
    patch = 0.5 + 0.5 * fbm(B5, x / 35 + 3, y / 35 - 7, 3)
    reef_d = REEF + 25 * fbm(B3, x / 160 + 4, y / 160 - 2, 2)
    basin = -1.6 * (1 - np.exp(-d / 4)) - 0.09 * np.minimum(d, 25) - 2.0 * smoothstep(20, 70, d) * (0.55 + 0.45 * patch)
    heads = smoothstep(0.78, 0.88, 0.5 + 0.5 * fbm(B8, x * 0.07, y * 0.07, 2)) * smoothstep(30, 50, d) * (1 - smoothstep(reef_d - 25, reef_d - 8, d))
    basin = basin + heads * 2.2
    crest = np.exp(-((d - reef_d) / 9.0) ** 2)
    outer = smoothstep(reef_d, reef_d + 170, d)
    sea = (basin * (1 - crest) - 0.45 * crest) * (1 - outer) + SEA_FLOOR * outer
    # Land: Strand, Strandwall mit Dünen, flach ansteigendes Hinterland, die beiden Berge
    ls = np.maximum(s, 0.0)
    dune = 0.5 + 0.5 * fbm(B2, x * 0.09 + 31, y * 0.09 + 20, 3)
    land = (0.1 * np.minimum(ls, 6) + 0.9 * smoothstep(5, 10, ls) * (0.5 + dune)
            + 0.035 * np.minimum(np.maximum(ls - 12, 0), 110) * (0.6 + 0.4 * (0.5 + 0.5 * fbm(B3, x / 80, y / 80, 3))))
    hill = np.zeros_like(x)
    for hx, hy, hh, hr in HILLS:
        t = np.hypot(x - hx, (y - hy) * 1.15) / hr
        dome = np.clip(1 - t * t, 0, None) ** 2.2   # rundlich, zum Fuss hin flach auslaufend
        ridges = ridged(B4, (x - hx) / 60 + hx, (y - hy) / 60 + hy, 4)
        hill = np.maximum(hill, hh * dome * (0.75 + 0.4 * ridges))
    land = land + hill * smoothstep(4, 40, ls)
    h = np.where(s < 0, sea, land)
    h = h + fbm(B5, x * 0.3 + 9, y * 0.3 - 4, 2) * 0.09                     # sanfte Mulden
    # Strandsicheln: Die Brandung formt die Wasserlinie zu regelmässigen Bögen
    h = h + 0.035 * np.sin((x - 0.25 * y) * 0.9) * smoothstep(-2.5, 0, s) * (1 - smoothstep(3, 5.5, s))
    # Fels: Landzunge links und einzelne Blöcke in der Brandung (nicht neben dem Brett), dazu zwei Kaps, hinter denen
    # der Strand verschwindet
    point = np.exp(-((x + 22) / 6) ** 2) * smoothstep(-5, 2, s) * (1 - smoothstep(7, 13, s))
    for cx, cy, cr in ((-128.0, 22.0, 11.0), (131.0, 25.0, 9.0)):
        point = np.maximum(point, np.exp(-(np.hypot(x - cx, y - cy) / cr) ** 2) * smoothstep(-6, 1, s) * (1 - smoothstep(9, 16, s)))
    band = smoothstep(-6, -3, s) * (1 - smoothstep(2, 5, s)) * smoothstep(17, 24, np.hypot(x, y)) * (np.abs(x) < 120)
    crag = 0.5 + 0.5 * fbm(B6, x * 0.32 - 7, y * 0.32 + 13, 3)
    rough = 0.5 + 0.5 * fbm(B7, x * 0.9 - 2, y * 0.9 + 4, 2)
    blocks = np.sqrt(smoothstep(0.68, 0.8, 0.5 + 0.5 * fbm(B8, x * 0.42 + 50, y * 0.42 - 30, 2))) * band
    rock = point * (0.25 + 1.4 * smoothstep(0.3, 0.72, crag) + 0.35 * rough) + blocks * (0.3 + 0.8 * crag + 0.3 * rough)
    # Bruchflächen, am stärksten dort, wo der Fels ins Wasser geht (die Landzunge oben bleibt, wie sie ist)
    where = (point + blocks) > 1e-3
    if np.any(where):
        f = np.zeros_like(x)
        f[where] = facets(x[where], y[where], 1.5, 5) - 0.5 + 0.6 * (facets(x[where], y[where], 0.6, 11) - 0.5)
        rock = rock + (point + blocks) * (0.3 + 0.7 * smoothstep(5, -2, s)) * 0.4 * f
    g_rockzone = smoothstep(0.0, 0.1, rock)
    # Fels in Schichten: flache, leicht geneigte Absätze, steile Stufen dazwischen, Risse (glatt wirkte er wie
    # Sandhügel); zum Rand hin weich ins Gelände
    w = smoothstep(0.08, 0.45, rock)
    tilt = 0.035 * x - 0.02 * y + 0.25 * fbm(B6, x * 0.08, y * 0.08, 2)
    st = 0.38
    q = (rock + tilt) / st
    terr = (np.floor(q) + smoothstep(0.55, 0.9, q - np.floor(q))) * st - tilt
    crack = smoothstep(0.9, 0.97, 1 - np.abs(fbm(B7, x * 0.55 + 11, y * 0.55 - 3, 2)))
    g.z = WATER + h + rock + w * (terr - rock) - 0.22 * crack * w
    g.rock = smoothstep(0.1, 0.35, rock)
    g.rockzone = g_rockzone   # etwas weiter als der Fels: Geröll und Blöcke am Fuss
    g.s = s
    g.veg = smoothstep(8, 13, s) * (1 - g.rock * (1 - smoothstep(6, 12, s)))
    g.grass = smoothstep(4.5, 8, s) * smoothstep(0.35, 0.6, 0.5 + 0.5 * fbm(B9, x * 0.2, y * 0.2, 3))
    # Wald: an der Küste locker (Haine, dazwischen Lichtungen), an den Bergen unten und in den Mulden dicht, die
    # Kuppen offen (Gras und Fels)
    grove = smoothstep(0.38, 0.62, 0.5 + 0.5 * fbm(B2, x / 45 - 9, y / 45 + 5, 3))
    above = np.where(s > 0, hill, 0.0)
    slope_open = smoothstep(0.45, 0.75, above / np.maximum(max(hh for *_, hh, _ in HILLS), 1.0) + 0.25 * fbm(B9, x / 60, y / 60, 2))
    g.forest = smoothstep(10, 22, s) * (1 - g.rock) * np.where(above > 8, 0.85 * (1 - slope_open), 0.35 + 0.5 * grove)
    g.reef = crest * (s < 0)
    g.lagoon = patch
    g.hill = above
    return g


def ring_mesh(name, nseg, r0, r1, z_of=None):
    """Ringe um die Mitte (dichter nahe am Brett): Ecken X, Y und Vierecke; z_of(X, Y) -> Höhe (sonst Wasserspiegel)"""
    ratio = 1 + 2 * np.pi / nseg
    radii = r0 * ratio ** np.arange(int(np.log(r1 / r0) / np.log(ratio)) + 1)
    a = np.arange(nseg) * 2 * np.pi / nseg
    X = (radii[:, None] * np.cos(a)[None]).ravel(); Y = (radii[:, None] * np.sin(a)[None]).ravel()
    nr = len(radii)
    i = np.arange(nr - 1)[:, None]; j = np.arange(nseg)[None]; j1 = (j + 1) % nseg
    F = np.stack(np.broadcast_arrays(i * nseg + j, i * nseg + j1, (i + 1) * nseg + j1, (i + 1) * nseg + j), -1).reshape(-1, 4)
    return X, Y, F


def attrs(me, **arrays):
    for name, arr in arrays.items():
        at = me.attributes.new(name, 'FLOAT', 'POINT')
        at.data.foreach_set('value', np.asarray(arr, np.float32))


def terrain_mesh():
    """Gelände als Ringe um die Mitte; Attribute für das Material"""
    X, Y, F = ring_mesh('Gelaende', 1024, 1.5, EXTENT)
    g = ground(X, Y)
    me = make_mesh('Gelaende', np.stack([X, Y, g.z], -1), F)
    attrs(me, rock=g.rock, veg=g.veg, grass=g.grass, shore=g.s, forest=g.forest, reef=g.reef, lagoon=g.lagoon, hill=g.hill)
    log('Gelände', len(X), 'Ecken')
    return me


def water_mesh():
    """Wasserfläche als Ringe (fein genug für die Brandung am Riff); Attribut reef"""
    X, Y, F = ring_mesh('Wasser', 512, 1.0, EXTENT)
    g = ground(X, Y)
    me = make_mesh('Wasser', np.stack([X, Y, np.full_like(X, WATER)], -1), F, smooth=False)
    attrs(me, reef=g.reef, shore=g.s)
    log('Wasser', len(X), 'Ecken')
    return me


def shore_zones(t, col, z, coarse, fine):
    """Zonen einer Felsküste an der Wasserlinie, von oben: die schwarze Zone (Flechten und Blaualgen im Spritzwasser,
    oben fleckig auslaufend), Seepocken (hell gesprenkelt), Algen (dunkel olivgrün, bis unter Wasser). coarse, fine:
    Rauschen grob (welliger Rand) und fein (Flecken)"""
    top = t.math('ADD', z, t.math('MULTIPLY', t.math('SUBTRACT', coarse, 0.5), 1.0))
    black = t.math('MULTIPLY', t.maprange(top, WATER + 1.45, WATER + 1.05), t.maprange(z, WATER + 0.4, WATER + 0.6))
    col = t.mix(t.math('MULTIPLY', black, 0.85), col, (0.022, 0.024, 0.028, 1))
    barn = t.math('MULTIPLY', t.math('MULTIPLY', t.maprange(z, WATER + 0.15, WATER + 0.3), t.maprange(z, WATER + 0.75, WATER + 0.55)),
                  t.maprange(fine, 0.42, 0.6))
    col = t.mix(t.math('MULTIPLY', barn, 0.8), col, (0.30, 0.29, 0.26, 1))
    low = t.math('ADD', z, t.math('MULTIPLY', t.math('SUBTRACT', fine, 0.5), 0.3))
    return t.mix(t.maprange(low, WATER + 0.35, WATER + 0.1), col, (0.04, 0.065, 0.03, 1))


def mat_ground():
    """Sand (nass dunkler und glänzend), Gras auf dem Strandwall, Grün und Waldboden im Hinterland, offene Kuppen mit
    Gras und Fels, Fels; unter Wasser mit der Farbe des Wassers nach Tiefe (Rot zuerst geschluckt: türkis im Flachen,
    tiefblau draussen), in der Lagune Sandflecken, Seegras und Korallen"""
    m = bpy.data.materials.new('Boden'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled')
    def attr(name):
        nd = t.node('ShaderNodeAttribute'); nd.attribute_name = name
        return nd.outputs['Fac']
    geo = t.node('ShaderNodeNewGeometry')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Position'], sep.inputs[0])
    z = sep.outputs['Z']
    nrm = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nrm.inputs[0])
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.35, in_Detail=4.0); t.link(geo.outputs['Position'], n1.inputs['Vector'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=0.04, in_Detail=3.0); t.link(geo.outputs['Position'], n2.inputs['Vector'])
    shore, rock, veg, grass = attr('shore'), attr('rock'), attr('veg'), attr('grass')
    forest, lagoon, reef, hill = attr('forest'), attr('lagoon'), attr('reef'), attr('hill')
    sand = t.mix(t.maprange(n1.outputs['Fac'], 0.35, 0.65), (0.74, 0.62, 0.44, 1), (0.82, 0.71, 0.52, 1))
    wet = t.maprange(shore, 2.6, 1.2)
    col = t.mix(wet, sand, (0.47, 0.38, 0.27, 1))
    # im nassen Sand feine Spülrillen der letzten Wellen; darüber der Spülsaum: angeschwemmter Tang (olivbraun) in
    # einem lückenhaften Band; Muschelstückchen und Korallenbruch verstreut (helle Punkte)
    swl = t.math('SINE', t.math('ADD', t.math('MULTIPLY', shore, 7.0), t.math('MULTIPLY', n1.outputs['Fac'], 5.0)))
    lines = t.math('MULTIPLY', t.maprange(swl, 0.8, 1.0), t.math('MULTIPLY', t.maprange(shore, 0.3, 0.8), t.maprange(shore, 2.4, 1.6)))
    col = t.mix(t.math('MULTIPLY', lines, 0.5), col, t.vmath('MULTIPLY', col, (0.78, 0.76, 0.74)))
    wn = t.node('ShaderNodeTexNoise', in_Scale=1.3, in_Detail=4.0); t.link(geo.outputs['Position'], wn.inputs['Vector'])
    wline = t.math('ADD', 3.0, t.math('MULTIPLY', n2.outputs['Fac'], 0.8))
    wrack = t.math('MULTIPLY', t.maprange(t.math('ABSOLUTE', t.math('SUBTRACT', shore, wline)), 0.35, 0.08),
                   t.maprange(wn.outputs['Fac'], 0.53, 0.62))
    col = t.mix(t.math('MULTIPLY', wrack, t.math('SUBTRACT', 0.8, t.math('MULTIPLY', rock, 0.8))), col, (0.22, 0.18, 0.10, 1))
    sv = t.node('ShaderNodeTexVoronoi', in_Scale=7.0); t.link(geo.outputs['Position'], sv.inputs['Vector'])
    shells = t.math('MULTIPLY', t.maprange(sv.outputs['Distance'], 0.07, 0.035),
                    t.math('MULTIPLY', t.maprange(shore, 1.2, 2.0), t.maprange(shore, 9.0, 6.0)))
    col = t.mix(t.math('MULTIPLY', shells, t.math('SUBTRACT', 1.0, rock)), col, (0.86, 0.80, 0.72, 1))
    col = t.mix(t.math('MULTIPLY', grass, 0.85), col, t.mix(n1.outputs['Fac'], (0.36, 0.44, 0.15, 1), (0.50, 0.55, 0.22, 1)))
    # Wiese hinter dem Strand: Gras in Flecken (sattgrün, gelblich, trocken), dazwischen Sand
    n3 = t.node('ShaderNodeTexNoise', in_Scale=0.12, in_Detail=5.0, in_Roughness=0.65)
    t.link(geo.outputs['Position'], n3.inputs['Vector'])
    green = t.mix(t.maprange(n2.outputs['Fac'], 0.3, 0.7), (0.10, 0.20, 0.05, 1), (0.22, 0.30, 0.09, 1))
    green = t.mix(t.maprange(n3.outputs['Fac'], 0.55, 0.7), green, (0.30, 0.30, 0.12, 1))
    green = t.mix(t.math('MULTIPLY', t.maprange(n3.outputs['Fac'], 0.38, 0.28), t.maprange(shore, 22, 12)), green, (0.55, 0.47, 0.33, 1))
    col = t.mix(veg, col, green)
    # Waldboden: dunkel, Laub, Kraut und Wurzeln in Flecken
    floor = t.mix(t.maprange(n3.outputs['Fac'], 0.35, 0.65), (0.05, 0.07, 0.025, 1), (0.13, 0.12, 0.06, 1))
    floor = t.mix(t.maprange(n1.outputs['Fac'], 0.6, 0.7), floor, (0.20, 0.15, 0.08, 1))
    col = t.mix(t.math('MULTIPLY', forest, 1.0), col, floor)
    # Berge: offene Kuppen mit hellem, gelblichem Gras, an steilen Stellen Fels
    open_ = t.math('MULTIPLY', t.maprange(hill, 10, 40), t.math('SUBTRACT', 1.0, forest))
    col = t.mix(open_, col, t.mix(n1.outputs['Fac'], (0.34, 0.40, 0.14, 1), (0.48, 0.48, 0.20, 1)))
    steep = t.math('MULTIPLY', t.maprange(nrm.outputs['Z'], 0.62, 0.45), t.maprange(hill, 6, 20))
    col = t.mix(steep, col, t.mix(n1.outputs['Fac'], (0.18, 0.16, 0.14, 1), (0.30, 0.27, 0.23, 1)))
    # Fels: dunkler Basalt, die flachen Absätze oben heller (verwittert, warm), Stufen und Risse dunkel, unten nass mit
    # Algen – deutlich dunkler als der Sand, sonst lasen sich die Felsen im Abendlicht als Sandhügel
    up = t.maprange(nrm.outputs['Z'], 0.55, 0.92)
    rockc = t.mix(up, (0.095, 0.088, 0.085, 1), (0.21, 0.185, 0.16, 1))
    rockc = t.mix(t.math('MULTIPLY', t.maprange(n1.outputs['Fac'], 0.35, 0.7), 0.5), rockc, (0.13, 0.12, 0.115, 1))
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=0.9); vor.feature = 'DISTANCE_TO_EDGE'
    t.link(geo.outputs['Position'], vor.inputs['Vector'])
    rockc = t.mix(t.math('MULTIPLY', t.maprange(vor.outputs['Distance'], 0.05, 0.0), 0.85), rockc, (0.03, 0.03, 0.035, 1))
    # an der Wasserlinie die Zonen einer Felsküste
    nf = t.node('ShaderNodeTexNoise', in_Scale=4.0, in_Detail=3.0); t.link(geo.outputs['Position'], nf.inputs['Vector'])
    rockc = shore_zones(t, rockc, z, n1.outputs['Fac'], nf.outputs['Fac'])
    col = t.mix(rock, col, rockc)
    # unter Wasser: Grund der Lagune (heller Sand, Seegras, Korallen am Riff), Durchlässigkeit je Farbe nach Tiefe,
    # dazu Streulicht des Wassers
    depth = t.math('MAXIMUM', t.math('SUBTRACT', WATER, z), 0.0)
    absorb = t.node('ShaderNodeCombineXYZ')
    for k, ab in enumerate((0.95, 0.22, 0.14)):
        t.link(t.math('EXPONENT', t.math('MULTIPLY', depth, -ab)), absorb.inputs[k])
    n4 = t.node('ShaderNodeTexNoise', in_Scale=0.14, in_Detail=4.0, in_Roughness=0.6)   # kleine Seegrasflecken
    t.link(geo.outputs['Position'], n4.inputs['Vector'])
    weed = t.math('MULTIPLY', t.math('MAXIMUM', t.maprange(lagoon, 0.55, 0.68), t.maprange(n4.outputs['Fac'], 0.6, 0.68)),
                  t.maprange(depth, 1.0, 2.2))
    bed = t.mix(weed, col, t.mix(n1.outputs['Fac'], (0.10, 0.15, 0.07, 1), (0.16, 0.20, 0.09, 1)))
    coral = t.math('MAXIMUM', reef, t.math('MULTIPLY', t.maprange(lagoon, 0.25, 0.15), t.maprange(depth, 2.5, 3.5)))
    bed = t.mix(coral, bed, t.mix(n1.outputs['Fac'], (0.15, 0.14, 0.10, 1), (0.24, 0.22, 0.16, 1)))
    rip = t.node('ShaderNodeTexWave', in_Scale=0.45, in_Distortion=11.0, in_Detail=3.0, in_Detail__Scale=2.5)
    t.link(geo.outputs['Position'], rip.inputs['Vector'])
    bed = t.mix(t.math('MULTIPLY', t.maprange(rip.outputs['Fac'], 0.3, 0.9), t.math('MULTIPLY', t.maprange(depth, 0.1, 0.4), t.maprange(depth, 2.5, 1.0))),
                bed, t.vmath('MULTIPLY', bed, (1.25, 1.22, 1.15)))
    seen = t.vmath('MULTIPLY', bed, absorb.outputs[0])
    scat = t.mix(t.maprange(depth, 1.5, 14.0), (0.10, 0.62, 0.60, 1), (0.008, 0.10, 0.24, 1))
    murk = t.math('SUBTRACT', 1.0, t.math('EXPONENT', t.math('MULTIPLY', depth, -0.3)))
    under = t.mix(murk, seen, scat)
    final = t.mix(t.maprange(depth, 0.0, 0.03), col, under)
    t.link(final, bsdf.inputs['Base Color'])
    # das Wasser leuchtet aus sich (Streulicht des Himmels im Wasser; gemalt ist die Lagune immer hell)
    # Grundlicht: an Land die eigene Farbe, bläulich (unter den Kronen nie schwarz), im Wasser das Streulicht
    glow = t.math('MULTIPLY', t.maprange(depth, 0.0, 0.3), t.maprange(depth, 16.0, 4.0))
    t.link(t.mix(t.maprange(depth, 0.0, 0.3), t.vmath('MULTIPLY', col, (0.55, 0.65, 1.0)), scat), bsdf.inputs['Emission Color'])
    amb = t.math('MULTIPLY', t.maprange(depth, 0.3, 0.0), t.math('MULTIPLY', t.math('SUBTRACT', 1.0, t.math('MULTIPLY', rock, 0.35)), AMBIENT))
    t.link(t.math('ADD', t.math('MULTIPLY', glow, 0.2), amb), bsdf.inputs['Emission Strength'])   # Fels: mehr Form
    # nass glänzend: dicht an der Wasserlinie ein Film, der den Himmel spiegelt
    film = t.maprange(shore, 1.3, 0.25)
    rough = t.math('SUBTRACT', t.math('SUBTRACT', 0.9, t.math('MULTIPLY', wet, 0.3)), t.math('MULTIPLY', film, 0.52))
    # nasser Fels glänzt (Gischt, Wellen): unten nah am Wasser
    rough = t.math('SUBTRACT', rough, t.math('MULTIPLY', rock, t.maprange(z, WATER + 1.0, WATER + 0.2, 0.0, 0.55)))
    t.link(rough, bsdf.inputs['Roughness'])
    # Windrippel im trockenen Sand: im Streiflicht der tiefen Sonne je eine helle und eine dunkle Seite
    rp = t.node('ShaderNodeTexWave', in_Scale=4.5, in_Distortion=6.0, in_Detail=3.0)
    rp.bands_direction = 'Y'
    t.link(geo.outputs['Position'], rp.inputs['Vector'])
    dry = t.math('MULTIPLY', t.maprange(shore, 2.8, 4.0), t.math('MULTIPLY', t.math('SUBTRACT', 1.0, veg), t.math('SUBTRACT', 1.0, rock)))
    sb = t.node('ShaderNodeBump', in_Distance=0.02)
    t.link(rp.outputs['Fac'], sb.inputs['Height'])
    t.link(t.math('MULTIPLY', dry, 0.5), sb.inputs['Strength'])
    t.link(sb.outputs['Normal'], bsdf.inputs['Normal'])
    t.link(air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def mat_water():
    """Wasseroberfläche: durchsichtig (den Grund färbt mat_ground), spiegelt nach Fresnel; Dünung und feine Wellen
    fürs Glitzern, am Riff Brandung (Schaum)"""
    m = bpy.data.materials.new('Wasser'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    dist = t.vmath('DISTANCE', geo.outputs['Position'], PANO_CENTER)
    # feine Wellen (gestreckt quer zur Dünung) und lange Dünung
    n = t.node('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=6.0, in_Roughness=0.55)
    mp = t.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 2.6, 1.0)
    t.link(geo.outputs['Position'], mp.inputs['Vector']); t.link(mp.outputs[0], n.inputs['Vector'])
    sw = t.node('ShaderNodeTexWave', in_Scale=0.012, in_Distortion=3.0, in_Detail=2.0, in_Detail__Scale=1.5)
    sw.wave_profile = 'SIN'; sw.bands_direction = 'Y'
    t.link(geo.outputs['Position'], sw.inputs['Vector'])
    big = t.node('ShaderNodeTexNoise', in_Scale=0.035, in_Detail=4.0, in_Roughness=0.6)   # Wellenfelder in der Ferne
    bm = t.node('ShaderNodeMapping'); bm.inputs['Scale'].default_value = (1.0, 2.2, 1.0)
    t.link(geo.outputs['Position'], bm.inputs['Vector']); t.link(bm.outputs[0], big.inputs['Vector'])
    height = t.math('ADD', t.math('ADD', t.math('MULTIPLY', n.outputs['Fac'], 1.0), t.math('MULTIPLY', sw.outputs['Fac'], 1.6)),
                    t.math('MULTIPLY', big.outputs['Fac'], t.maprange(dist, 100.0, 1500.0, 0.0, 30.0)))
    bump = t.node('ShaderNodeBump', in_Distance=0.1)
    t.link(height, bump.inputs['Height'])
    t.link(t.maprange(dist, 40.0, 1500.0, 0.35, 0.05), bump.inputs['Strength'])
    gl = t.node('ShaderNodeBsdfGlossy')
    t.link(t.maprange(dist, 30.0, 1500.0, 0.16, 0.11), gl.inputs['Roughness'])   # gekräuselt: Spiegelbilder verschwimmen
    t.link(bump.outputs['Normal'], gl.inputs['Normal'])
    tr = t.node('ShaderNodeBsdfTransparent')
    fr = t.node('ShaderNodeFresnel', in_IOR=1.33); t.link(bump.outputs['Normal'], fr.inputs['Normal'])
    mix = t.node('ShaderNodeMixShader')
    # Spiegelung etwas schwächer als nach Fresnel: Die Farbe der Lagune soll auch im flachen Blick tragen
    t.link(t.math('MULTIPLY', fr.outputs[0], 0.75), mix.inputs[0]); t.link(tr.outputs[0], mix.inputs[1]); t.link(gl.outputs[0], mix.inputs[2])
    # Brandung am Riff: Schaum in Streifen parallel zum Riff, ausgefranst
    ra = t.node('ShaderNodeAttribute'); ra.attribute_name = 'reef'
    fn = t.node('ShaderNodeTexNoise', in_Scale=0.08, in_Detail=6.0, in_Roughness=0.65)
    t.link(geo.outputs['Position'], fn.inputs['Vector'])
    foam = t.math('MULTIPLY', t.maprange(ra.outputs['Fac'], 0.35, 0.85), t.maprange(fn.outputs['Fac'], 0.42, 0.6))
    fd = t.node('ShaderNodeBsdfDiffuse'); fd.inputs['Color'].default_value = (0.85, 0.86, 0.88, 1)
    mx2 = t.node('ShaderNodeMixShader')
    t.link(foam, mx2.inputs[0]); t.link(mix.outputs[0], mx2.inputs[1]); t.link(fd.outputs[0], mx2.inputs[2])
    # nahe am Brett zeichnet das Spiel die Oberfläche (Wellen, Brandung, Spiegelung): hier nur der Grund
    near = t.node('ShaderNodeMixShader', name='Spielwasser')
    t.link(t.maprange(dist, *WATER_GAME), near.inputs[0]); t.link(tr.outputs[0], near.inputs[1]); t.link(mx2.outputs[0], near.inputs[2])
    t.link(air(t, near.outputs[0]), out.inputs['Surface'])
    return m


def build_ground():
    me = terrain_mesh()
    me.materials.append(mat_ground())
    link('Gelaende', me)
    wm = water_mesh()
    wm.materials.append(mat_water())
    link('Wasser', wm)


# ---------------------------------------------------------------- Pflanzen und Felsen

def _pflanzen():
    """Modelle aus pflanzen.py (daneben), frisch geladen: Blender behält importierte Module sonst mit altem Stand"""
    import importlib
    if HERE not in sys.path:
        sys.path.insert(0, HERE)
    import pflanzen
    return importlib.reload(pflanzen)


# Vorlagen je Art in dieser Reihenfolge (Nummer der Vorlage = variant); das Spiel zeichnet die ersten vier Arten selbst,
# wenn sie näher als R_NEAR stehen (Gras und Felsen bleiben im Panorama: niedrig)
KINDS = {'palm': (0, 8), 'tree': (8, 14), 'tier': (14, 17), 'bush': (17, 21), 'grass': (21, 24), 'vine': (24, 27),
         'wood': (27, 30), 'nut': (30, 33), 'rock': (33, 39)}
GAME_KINDS = KINDS['bush'][1]   # Vorlagen 0 … GAME_KINDS − 1


def plant_models(detail=None):
    """Modelle in der Reihenfolge von KINDS (ohne Felsen): [(Art, Modell)]; detail je Art (sonst 1: Panorama)"""
    P = _pflanzen()
    d = lambda kind: (detail or {}).get(kind, 1.0)
    return ([('palm', P.palm(700 + k, d('palm'))) for k in range(8)]
            + [('tree', P.broadleaf(800 + k, d('tree'))) for k in range(6)]
            + [('tier', P.broadleaf(820 + k, d('tier'), tiers=True)) for k in range(3)]
            + [('bush', P.shrub(900 + k, d('bush'), round_leaves=k < 2)) for k in range(4)]
            + [('grass', P.grass(950 + k, d('grass'))) for k in range(3)]
            + [('vine', P.vine(960 + k, d('vine'))) for k in range(3)]
            + [('wood', P.driftwood(970 + k, d('wood'))) for k in range(3)]
            + [('nut', P.coconut(980 + k, d('nut'))) for k in range(3)])


def boulder(seed):
    """Felsblock mit Höhe 1: kantig – ein grobes Ikosaeder, mehrfach schräg abgeschnitten (Bruchflächen), unten flach"""
    import bmesh
    rng = np.random.default_rng(seed)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.5)
    s = (rng.uniform(1.0, 1.4), rng.uniform(0.8, 1.15), rng.uniform(0.6, 0.85))
    for v in bm.verts:
        v.co.x *= s[0]; v.co.y *= s[1]; v.co.z *= s[2]
    cuts = [Vector((0, 0, -1))] + [Vector(rng.normal(size=3) * (1, 1, 0.6)).normalized() for _ in range(14)]
    for i, nrm in enumerate(cuts):
        ext = max(abs(nrm.x) * s[0], abs(nrm.y) * s[1], abs(nrm.z) * s[2]) * 0.5
        off = ext * (0.35 if i == 0 else rng.uniform(0.45, 0.8))
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        res = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=nrm * off, plane_no=nrm, clear_outer=True)
        edges = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
        if edges:
            bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    V = np.array([v.co[:] for v in bm.verts]); F = [[v.index for v in f.verts] for f in bm.faces]
    bm.free()
    V[:, 2] -= V[:, 2].min(); V /= V[:, 2].max()
    return V, F, None


# Farben je Art und Material (Szenenwerte; Ton 0 … 1 mischt dunkel → hell): Stamm, Laub, dürres Laub, Frucht
PLANT_COLORS = {
    'palm': [((0.11, 0.09, 0.07), (0.24, 0.20, 0.15)), ((0.05, 0.11, 0.02), (0.19, 0.27, 0.05)),
             ((0.20, 0.13, 0.06), (0.34, 0.24, 0.11)), ((0.10, 0.13, 0.03), (0.22, 0.17, 0.06))],
    'tree': [((0.10, 0.08, 0.07), (0.17, 0.14, 0.11)), ((0.025, 0.07, 0.015), (0.10, 0.19, 0.035)),
             ((0.22, 0.12, 0.04), (0.35, 0.20, 0.06)), ((0.2, 0.15, 0.05), (0.3, 0.2, 0.08))],
    'bush': [((0.09, 0.07, 0.05), (0.15, 0.12, 0.09)), ((0.04, 0.10, 0.02), (0.15, 0.24, 0.05)),
             ((0.20, 0.14, 0.05), (0.30, 0.22, 0.08)), ((0.2, 0.1, 0.1), (0.3, 0.15, 0.1))],
    'grass': [((0.1, 0.1, 0.05), (0.2, 0.2, 0.1)), ((0.12, 0.15, 0.04), (0.33, 0.33, 0.12)),
              ((0.3, 0.25, 0.12), (0.4, 0.33, 0.16)), ((0.2, 0.2, 0.1), (0.3, 0.3, 0.1))],
}
PLANT_COLORS['vine'] = [((0.05, 0.08, 0.03), (0.09, 0.12, 0.05)), ((0.04, 0.10, 0.02), (0.13, 0.22, 0.05)),
                        ((0.2, 0.15, 0.05), (0.3, 0.2, 0.1)), ((0.3, 0.1, 0.2), (0.4, 0.15, 0.3))]
PLANT_COLORS['wood'] = [((0.30, 0.27, 0.24), (0.52, 0.48, 0.43)), ((0.3, 0.3, 0.3), (0.4, 0.4, 0.4)),
                        ((0.3, 0.3, 0.3), (0.4, 0.4, 0.4)), ((0.3, 0.3, 0.3), (0.4, 0.4, 0.4))]
PLANT_COLORS['nut'] = [((0.1, 0.08, 0.06), (0.2, 0.15, 0.1)), ((0.1, 0.1, 0.1), (0.2, 0.2, 0.2)),
                       ((0.1, 0.1, 0.1), (0.2, 0.2, 0.2)), ((0.13, 0.08, 0.04), (0.26, 0.17, 0.08))]
PLANT_COLORS['tier'] = PLANT_COLORS['tree']
PLANT_AMBIENT = 0.18   # Grundlicht der Pflanzen (Anteil der eigenen Farbe, bläulich): Schatten nie schwarz


def mat_plant(name, dark, light, rough=0.6, translucent=0.0, rings=False):
    """Pflanzenteil: Farbe nach dem Ton je Ecke (Attribut tone), etwas durchscheinend (Laub), Grundlicht; rings: feine
    Ringe entlang des Stamms (Palmstamm: dort ist der Ton die Lage entlang des Stamms)"""
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    tone = t.node('ShaderNodeAttribute'); tone.attribute_name = 'tone'
    col = t.mix(tone.outputs['Fac'], (*dark, 1), (*light, 1))
    if rings:   # (nach der Höhe der Vorlage liefen sie im gebogenen Teil schräg, der Stamm wirkte gedreht)
        ring = t.math('SINE', t.math('MULTIPLY', tone.outputs['Fac'], 2 * math.pi * 90))
        col = t.vmath('MULTIPLY', col, t.maprange(ring, -1.0, 1.0, 0.94, 1.02, 'LINEAR'))   # kaum sichtbar
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=rough)
    t.link(col, bsdf.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (0.55, 0.65, 1.0)), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = PLANT_AMBIENT
    sh = bsdf.outputs[0]
    if translucent:
        tl = t.node('ShaderNodeBsdfTranslucent'); t.link(col, tl.inputs['Color'])
        mx = t.node('ShaderNodeMixShader', in_0=translucent)
        t.link(sh, mx.inputs[1]); t.link(tl.outputs[0], mx.inputs[2]); sh = mx.outputs[0]
    t.link(air(t, sh), out.inputs['Surface'])
    return m


def mat_rock():
    """Felsblock: dunkler Basalt wie der Fels des Geländes – nach oben gewandte Flächen heller (verwittert), je Block
    anders getönt, Risse; an der Wasserlinie die Zonen der Felsküste, oben auf den Blöcken vereinzelt gelbe Flechten;
    unten nass und glänzend"""
    m = bpy.data.materials.new('Fels'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Position'], sep.inputs[0])
    z = sep.outputs['Z']
    nrm = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nrm.inputs[0])
    tone = t.node('ShaderNodeAttribute'); tone.attribute_name = 'tone'
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.8, in_Detail=4.0); t.link(geo.outputs['Position'], n1.inputs['Vector'])
    nf = t.node('ShaderNodeTexNoise', in_Scale=4.0, in_Detail=3.0); t.link(geo.outputs['Position'], nf.inputs['Vector'])
    up = t.maprange(nrm.outputs['Z'], 0.3, 0.9)
    col = t.mix(up, (0.085, 0.08, 0.078, 1), (0.20, 0.177, 0.152, 1))
    col = t.mix(t.math('MULTIPLY', tone.outputs['Fac'], 0.5), col, (0.13, 0.115, 0.10, 1))
    # einzelne Risse (ein ganzes Netz wirkte wie ein Schildkrötenpanzer): Zellkanten nur, wo das Rauschen es zulässt
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=0.9); vor.feature = 'DISTANCE_TO_EDGE'
    t.link(geo.outputs['Position'], vor.inputs['Vector'])
    crack = t.math('MULTIPLY', t.maprange(vor.outputs['Distance'], 0.03, 0.0), t.maprange(n1.outputs['Fac'], 0.5, 0.62))
    col = t.mix(t.math('MULTIPLY', crack, 0.8), col, (0.03, 0.03, 0.035, 1))
    lichen = t.math('MULTIPLY', t.math('MULTIPLY', t.maprange(nf.outputs['Fac'], 0.6, 0.68), t.maprange(z, WATER + 1.8, WATER + 2.4)), up)
    col = t.mix(t.math('MULTIPLY', lichen, 0.7), col, (0.40, 0.31, 0.10, 1))
    col = shore_zones(t, col, z, n1.outputs['Fac'], nf.outputs['Fac'])
    rough = t.math('SUBTRACT', 0.85, t.maprange(z, WATER + 1.0, WATER + 0.2, 0.0, 0.5))
    bsdf = t.node('ShaderNodeBsdfPrincipled')
    t.link(col, bsdf.inputs['Base Color']); t.link(rough, bsdf.inputs['Roughness'])
    t.link(t.vmath('MULTIPLY', col, (0.55, 0.65, 1.0)), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = PLANT_AMBIENT
    t.link(air(t, bsdf.outputs[0]), out.inputs['Surface'])
    return m


def build_templates():
    """Vorlagen (vom Rendern ausgeschlossen), s00 … in der Reihenfolge von KINDS. Die Namen tragen die Nummer, weil der
    Geometrieknoten die Vorlagen nach Namen sortiert (variant = Nummer)."""
    coll = collection('Strandvorlagen', exclude=True)
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    mats = {}
    for kind, cols in PLANT_COLORS.items():
        if kind == 'tier':
            continue
        mats[kind] = [mat_plant('%s %d' % (kind, i), *c, rough=0.85 if i in (0, 3) else 0.55,
                                translucent=0.3 if i in (1, 2) else 0.0, rings=kind == 'palm' and i == 0)
                      for i, c in enumerate(cols)]
    mats['tier'] = mats['tree']
    rockm = mat_rock()
    def add(V, F, M, mlist, tone, sharp=None):
        name = 's%02d' % len(coll.objects)
        me = mesh(name, V, F, M, mats=mlist)
        if sharp:   # Bruchkanten scharf, die runden Reste glatt (weich schattiert wirkten die Blöcke wie Kissen)
            me.set_sharp_from_angle(angle=sharp)
        attrs(me, tone=tone)
        link(name, me, coll)
    for kind, md in plant_models():
        add(md['V'], md['F'], md['M'], mats[kind], md['T'])
    for k in range(6):
        V, F, _ = boulder(950 + k)
        add(V, F, None, [rockm], np.full(len(V), np.random.default_rng(k).random()), sharp=math.radians(25))
    return coll


def seaward(x, y):
    """Richtung zum Meer (Einheitsvektor) nach dem Gefälle des Abstands zur Wasserlinie"""
    gx = coast(x + 1.0, y) - coast(x - 1.0, y); gy = coast(x, y + 1.0) - coast(x, y - 1.0)
    l = np.hypot(gx, gy) + 1e-9
    return -gx / l, -gy / l


def plant_points():
    """Standorte: Palmenhaine am Strandwall (zum Meer geneigt), einzelne Palmen am Strand, ein lockerer Wald aus Palmen
    und Laubbäumen dahinter (Lichtungen dazwischen), an den Bergen unten und in den Mulden dichter Wald, die Kuppen
    offen mit einzelnen Bäumen; Büsche am Rand des Bewuchses und im Wald, Strandgras auf dem Wall, Felsblöcke an der
    Landzunge, an den Kaps und in der Brandung. -> pos, variant, scl (x, y, z), rot (Euler)"""
    rng = np.random.default_rng(23)
    out = []
    groves = lambda X, Y: smoothstep(0.1, 0.45, 0.5 + 0.5 * fbm(B2, X * 0.05 + 7, Y * 0.05 - 3, 2))
    band = lambda s, a, b, c, d: smoothstep(a, b, s) * (1 - smoothstep(c, d, s))
    def scatter(spacing, rmax, keep, kinds, height, width, center=(0.0, ISLE_C), sink=0.0, lean=None):
        n = int(2 * rmax / spacing)
        gr = (np.arange(n) - n / 2 + 0.5) * spacing
        X, Y = np.meshgrid(gr + center[0], gr + center[1])
        X = (X + rng.uniform(-0.45, 0.45, X.shape) * spacing).ravel()
        Y = (Y + rng.uniform(-0.45, 0.45, Y.shape) * spacing).ravel()
        ok = np.hypot(X - center[0], Y - center[1]) < rmax
        X, Y = X[ok], Y[ok]
        G = ground(X, Y)
        sel = keep(X, Y, G) > rng.random(len(X))
        X, Y = X[sel], Y[sel]
        for k, v in vars(G).items():
            setattr(G, k, v[sel])
        m = len(X)
        kind = rng.choice(list(kinds), m, p=list(kinds.values()))
        var = np.array([rng.integers(*KINDS[k]) for k in kind], dtype=np.int64)
        # nahe am Brett nur Vorlagen, die das Spiel als Modell hat (sonst passten die Schatten im Panorama nicht)
        near = np.hypot(X, Y) < R_NEAR + 2
        for k in set(kind[near]):
            if k in GAME_VARIANTS:
                sel_k = near & (kind == k)
                var[sel_k] = KINDS[k][0] + (var[sel_k] - KINDS[k][0]) % GAME_VARIANTS[k]
        h = rng.uniform(*height, m); w = h * rng.uniform(*width, m)
        rot = np.stack([rng.normal(0, 0.03, m), rng.normal(0, 0.03, m), rng.uniform(0, 2 * np.pi, m)], -1)
        if lean is not None:   # Palmen: zum Meer geneigt (die Vorlage biegt sich in +x)
            sx, sy = seaward(X, Y)
            rot[:, 2] = np.arctan2(sy, sx) + rng.normal(0, 0.45, m)
            rot[:, 0] = 0
            rot[:, 1] = lean(G.s) * rng.uniform(0.6, 1.2, m)
        out.append((np.stack([X, Y, G.z - sink * h], -1), var, np.stack([w, w, h], -1), rot))
        log('/'.join(kinds), m)
    # Palmen am Strandwall in Hainen, zum Meer geneigt (am Strand stärker)
    scatter(3.4, 430, lambda X, Y, G: band(G.s, 4.0, 6.0, 13, 18) * groves(X, Y) * (1 - G.rock) * 0.8,
            {'palm': 1.0}, (7.0, 13.0), (0.9, 1.15), lean=lambda s: 0.28 * (1 - smoothstep(6, 16, s)))
    scatter(10.0, 430, lambda X, Y, G: band(G.s, 1.8, 3.0, 4.5, 6.0) * (1 - G.rock) * 0.3,
            {'palm': 1.0}, (6.0, 11.0), (0.9, 1.1), lean=lambda s: 0.45 + 0 * s)
    # lockerer Wald dahinter: Palmen und Laubbäume, Lichtungen; an den Bergen dichter Laubwald, auf den Kuppen einzelne
    scatter(6.5, 430, lambda X, Y, G: G.forest * (G.hill < 10) * 0.75,
            {'palm': 0.45, 'tree': 0.35, 'tier': 0.2}, (7.0, 13.0), (0.9, 1.3), lean=lambda s: 0.06 + 0 * s)
    scatter(6.5, 430, lambda X, Y, G: G.forest * (G.hill >= 10) * 1.0,
            {'tree': 0.8, 'tier': 0.1, 'palm': 0.1}, (8.0, 15.0), (1.0, 1.4))
    scatter(15.0, 430, lambda X, Y, G: (G.hill > 10) * (1 - G.forest) * (1 - G.rock) * 0.35,
            {'tree': 1.0}, (4.0, 8.0), (1.0, 1.4))
    # Büsche: dicht am Rand des Bewuchses, locker im Wald
    # (nahe am Brett halb so dicht: das Spiel zeichnet sie dort selbst)
    scatter(2.0, 430, lambda X, Y, G: band(G.s, 7.0, 9.0, 18, 24) * (1 - G.rock) * np.where(np.hypot(X, Y) < R_NEAR + 5, 0.45, 0.95),
            {'bush': 1.0}, (1.0, 2.6), (1.2, 2.0), sink=0.05)
    scatter(4.0, 430, lambda X, Y, G: G.forest * 0.45 + G.veg * (1 - G.forest) * 0.12, {'bush': 1.0}, (0.8, 2.2), (1.2, 1.9), sink=0.05)
    # Strandgras auf dem Wall (nur vorne: weiter hinten löst das Bild es nicht auf)
    scatter(1.3, 170, lambda X, Y, G: (band(G.s, 4.5, 6.0, 11, 14) * G.grass * 0.7 + G.veg * 0.25) * (1 - G.rock),
            {'grass': 1.0}, (0.35, 0.8), (0.9, 1.4), center=(0.0, 60.0))
    # Strandwinden am oberen Strand, Treibholz am Spülsaum, Kokosnüsse unter den Palmen
    scatter(2.0, 260, lambda X, Y, G: band(G.s, 3.5, 5.5, 9, 12) * (1 - G.rock) * 0.55 * groves(X + 40, Y),
            {'vine': 1.0}, (0.12, 0.2), (0.8, 1.3), center=(0.0, 60.0))   # flaches Modell: rund 12 × so breit wie hoch
    scatter(26.0, 300, lambda X, Y, G: band(G.s, 1.8, 2.6, 4.5, 6.5) * (1 - G.rock) * 0.6,
            {'wood': 1.0}, (0.25, 0.45), (1.0, 1.0), center=(0.0, 60.0), sink=0.15)
    scatter(1.8, 200, lambda X, Y, G: band(G.s, 3.0, 4.5, 11, 16) * groves(X, Y) * 0.12 * (1 - G.rock),
            {'nut': 1.0}, (0.2, 0.26), (1.1, 1.3), center=(0.0, 60.0), sink=0.3)
    # Felsblöcke: auf dem Fels; am Fuss, wo er ins Wasser geht, grössere Blöcke halb im Wasser und Geröll
    scatter(1.6, 170, lambda X, Y, G: G.rock * 0.55, {'rock': 1.0}, (0.6, 2.2), (1.2, 2.0), center=(0.0, 30.0), sink=0.3)
    scatter(1.6, 170, lambda X, Y, G: G.rockzone * band(G.s, -5.0, -3.0, 1.0, 3.0) * 0.3, {'rock': 1.0}, (0.5, 1.6),
            (1.1, 1.7), center=(0.0, 30.0), sink=0.4)
    scatter(0.7, 170, lambda X, Y, G: G.rockzone * band(G.s, -3.5, -2.0, 2.0, 4.0) * 0.35, {'rock': 1.0}, (0.15, 0.45),
            (1.0, 1.6), center=(0.0, 30.0), sink=0.3)
    pos, var, scl, rot = (np.concatenate(a) for a in zip(*out))
    return pos, var, scl, rot


def instancer(name, coll):
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


def points(name, pos, var, scl, rot):
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(pos)); me.vertices.foreach_set('co', pos.astype(np.float32).ravel())
    for nm, kind, arr in (('variant', 'INT', var.astype(np.int32)), ('rot', 'FLOAT_VECTOR', rot), ('scl', 'FLOAT_VECTOR', scl)):
        at = me.attributes.new(nm, kind, 'POINT')
        at.data.foreach_set('vector' if kind == 'FLOAT_VECTOR' else 'value', arr.astype(np.float32 if kind != 'INT' else np.int32).ravel())
    return me


def near_mask(pos, var):
    """Was das Spiel selbst zeichnet: Palmen, Bäume und Büsche näher als R_NEAR (Gras und Felsen bleiben im Panorama)"""
    return (np.hypot(pos[:, 0], pos[:, 1]) < R_NEAR) & (var < GAME_KINDS)


def build_plants():
    coll = build_templates()
    pos, var, scl, rot = plant_points()
    near = near_mask(pos, var)
    ng = instancer('Pflanzen verteilen', coll)
    far = link('Pflanzen', points('Pflanzenpunkte', pos[~near], var[~near], scl[~near], rot[~near]))
    far.modifiers.new('Verteilen', 'NODES').node_group = ng
    spiel = collection('Spiel')
    nob = link('Pflanzen nah', points('Pflanzenpunkte nah', pos[near], var[near], scl[near], rot[near]), spiel)
    nob.modifiers.new('Verteilen', 'NODES').node_group = ng
    nob.visible_camera = False   # das Spiel zeichnet sie; ihre Schatten bleiben im Panorama
    log('Pflanzen', int((~near).sum()), 'fern,', int(near.sum()), 'nah')


# ---------------------------------------------------------------- Himmel, Sonne, Wolken, Luft

SKY_GAIN = 0.15          # Himmel gegenüber der Sonnenlampe, wie ihn Kamera und Spiegelungen sehen
SKY_LIGHT = 0.35         # ... als Licht: hellt die langen Abendschatten auf (gemalte Schatten sind nie schwarz)
SUN_STRENGTH = 3.6
SUN_COLOR = (1.0, 0.56, 0.30)
AIR_DIST = 4200.0        # Luftperspektive: nach dieser Strecke knapp zwei Drittel Himmelsfarbe (auf Meereshöhe) …
AIR_HEIGHT = 600.0       # … darüber dünner (Gipfel und Wolken bleiben klarer)
AMBIENT = 0.35           # Grundlicht des Bodens (Anteil der eigenen Farbe)


def _group(name, inputs, outputs):
    """Knotengruppe (neu oder Inhalt ersetzt; die Anschlüsse bleiben, Materialien behalten ihre Verbindungen)"""
    ng = bpy.data.node_groups.get(name)
    if ng is None:
        ng = bpy.data.node_groups.new(name, 'ShaderNodeTree')
        for nm, kind in inputs:
            ng.interface.new_socket(nm, in_out='INPUT', socket_type=kind)
        for nm, kind in outputs:
            ng.interface.new_socket(nm, in_out='OUTPUT', socket_type=kind)
    t = NT(ng)
    return ng, t, t.node('NodeGroupInput'), t.node('NodeGroupOutput')


def sky_group():
    """Himmelsfarbe in eine Richtung (Gain: Anteil gegenüber der Sonnenlampe): physikalischer Himmel mit der tiefen
    Sonne, dazu gemalte Abendfarben – am Horizont rundum warm (zur Sonne hin orange, auf der Gegenseite rosa), oben ein
    tiefes, leicht violettes Blau, ein heller Hof um die Sonne"""
    ng, t, gi, go = _group('Himmelsfarbe', [('Richtung', 'NodeSocketVector'), ('Gain', 'NodeSocketFloat')],
                           [('Farbe', 'NodeSocketColor')])
    # unter dem Horizont die Farbe knapp darüber (Strahlen, die am Rand der Szene ins Leere gehen, und Licht von unten)
    rs = t.node('ShaderNodeSeparateXYZ'); t.link(gi.outputs['Richtung'], rs.inputs[0])
    rc = t.node('ShaderNodeCombineXYZ')
    t.link(rs.outputs['X'], rc.inputs['X']); t.link(rs.outputs['Y'], rc.inputs['Y'])
    t.link(t.math('MAXIMUM', rs.outputs['Z'], 0.002), rc.inputs['Z'])
    d = t.vmath('NORMALIZE', rc.outputs[0])
    sky = t.node('ShaderNodeTexSky')
    sky.sky_type = 'MULTIPLE_SCATTERING'
    sky.sun_disc = False
    sky.sun_elevation = math.asin(SUN.z)
    sky.sun_rotation = math.atan2(SUN.x, SUN.y)    # Drehung 0: Sonne in +y, positiv zu +x hin (am Bild geprüft)
    sky.altitude = 50.0
    sky.air_density = 1.0
    sky.aerosol_density = 2.0
    t.link(d, sky.inputs['Vector'])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(d, sep.inputs[0])
    z = sep.outputs['Z']
    dh = t.vmath('NORMALIZE', t.vmath('MULTIPLY', d, (1, 1, 0)))
    sh = Vector((SUN.x, SUN.y, 0)).normalized()
    side = t.math('ADD', 0.5, t.math('MULTIPLY', t.vmath('DOT_PRODUCT', dh, (sh.x, sh.y, 0)), 0.5))   # 1 zur Sonne
    toward = t.math('POWER', side, 3.0)
    top = t.mix(t.maprange(z, 0.08, 0.85), (1, 1, 1, 1), (0.80, 0.74, 1.0, 1))
    band = t.mix(toward, (1.0, 0.78, 0.84, 1), (1.0, 0.62, 0.40, 1))
    warm = t.mix(t.maprange(z, 0.30, 0.0), top, band)
    # Hof um die Sonne (als Faktor: der physikalische Himmel ist dort schon hell)
    ang = t.math('ARCCOSINE', t.math('MINIMUM', t.vmath('DOT_PRODUCT', d, tuple(SUN)), 1.0))
    halo = t.math('ADD', t.math('MULTIPLY', t.math('EXPONENT', t.math('DIVIDE', ang, -0.035)), 0.9),
                  t.math('MULTIPLY', t.math('EXPONENT', t.math('DIVIDE', ang, -0.16)), 0.18))
    hv = t.node('ShaderNodeCombineXYZ')
    for k in range(3):
        t.link(halo, hv.inputs[k])
    glow = t.vmath('ADD', (1, 1, 1), t.vmath('MULTIPLY', (1.0, 0.80, 0.55), hv.outputs[0]))
    col = t.vmath('MULTIPLY', t.vmath('MULTIPLY', sky.outputs['Color'], warm), glow)
    sc_ = t.node('ShaderNodeVectorMath'); sc_.operation = 'SCALE'
    t.link(col, sc_.inputs[0]); t.link(gi.outputs['Gain'], sc_.inputs['Scale'])
    t.link(sc_.outputs['Vector'], go.inputs['Farbe'])
    return ng


def air_group():
    """Luftperspektive für Kamera und Spiegelungen: nach Weg und Höhe ein Anteil Himmelsfarbe (des Horizonts in
    Blickrichtung, bei Gipfeln des Himmels dahinter). Ersetzt den Dunst als Volumen (der rauschte, im Himmel fleckig)."""
    if 'Himmelsfarbe' not in bpy.data.node_groups:
        sky_group()
    ng, t, gi, go = _group('Luft', [('Shader', 'NodeSocketShader')], [('Shader', 'NodeSocketShader')])
    lp = t.node('ShaderNodeLightPath')
    geo = t.node('ShaderNodeNewGeometry')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Position'], sep.inputs[0])
    dens = t.math('EXPONENT', t.math('DIVIDE', t.math('MAXIMUM', t.math('SUBTRACT', sep.outputs['Z'], WATER), 0.0), -AIR_HEIGHT))
    tau = t.math('MULTIPLY', t.math('DIVIDE', lp.outputs['Ray Length'], AIR_DIST), dens)
    f = t.math('SUBTRACT', 1.0, t.math('EXPONENT', t.math('MULTIPLY', tau, -1.0)))
    f = t.math('MULTIPLY', f, t.math('MAXIMUM', lp.outputs['Is Camera Ray'], lp.outputs['Is Glossy Ray']))
    view = t.vmath('MULTIPLY', geo.outputs['Incoming'], (-1, -1, -1))
    vs = t.node('ShaderNodeSeparateXYZ'); t.link(view, vs.inputs[0])
    vc = t.node('ShaderNodeCombineXYZ')
    t.link(vs.outputs['X'], vc.inputs['X']); t.link(vs.outputs['Y'], vc.inputs['Y'])
    t.link(t.math('MAXIMUM', vs.outputs['Z'], 0.02), vc.inputs['Z'])
    g = t.node('ShaderNodeGroup'); g.node_tree = bpy.data.node_groups['Himmelsfarbe']
    t.link(vc.outputs[0], g.inputs['Richtung']); g.inputs['Gain'].default_value = SKY_GAIN
    em = t.node('ShaderNodeEmission', in_Strength=1.0); t.link(g.outputs['Farbe'], em.inputs['Color'])
    mx = t.node('ShaderNodeMixShader')
    t.link(f, mx.inputs[0]); t.link(gi.outputs['Shader'], mx.inputs[1]); t.link(em.outputs[0], mx.inputs[2])
    t.link(mx.outputs[0], go.inputs['Shader'])
    return ng


def air(t, sh):
    """Shader sh mit Luftperspektive (Gruppe „Luft“)"""
    g = t.node('ShaderNodeGroup'); g.node_tree = bpy.data.node_groups.get('Luft') or air_group()
    t.link(sh, g.inputs[0])
    return g.outputs[0]


def world():
    w = bpy.data.worlds.new('Abend'); sc().world = w; w.use_nodes = True
    sky_group(); air_group()
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
    # Sonnenscheibe nur für Kamerastrahlen (als Licht wirkt die Sonnenlampe)
    r = t.math('ARCCOSINE', t.math('MINIMUM', t.vmath('DOT_PRODUCT', d, tuple(SUN)), 1.0))
    R = 0.0095
    disk = t.math('MULTIPLY', t.maprange(r, R * 1.08, R * 0.92), lp.outputs['Is Camera Ray'])
    sun = t.node('ShaderNodeVectorMath'); sun.operation = 'SCALE'
    sun.inputs[0].default_value = (40.0, 26.0, 13.0)
    t.link(disk, sun.inputs['Scale'])
    t.link(t.vmath('ADD', g.outputs['Farbe'], sun.outputs['Vector']), bg.inputs['Color'])
    return w


def sun_lamp():
    ld = bpy.data.lights.new('Sonne', 'SUN')
    ld.energy = SUN_STRENGTH
    ld.color = SUN_COLOR
    ld.angle = math.radians(0.6)
    ob = link('Sonne', ld)
    ob.rotation_euler = SUN.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    return ob


# Haufenwolken: (Richtung in Grad von +y über +x, Abstand, Höhe der Basis, Breite, Höhe). Meer vorn bei 180°, die
# Sonne bei rund 110°, das Land hinten bei 0°: grosse Türme über dem Meer, eine Bank zur Sonne hin, einige über dem
# Land; dazu kleine, ferne am Horizont
CLOUDS = [(180, 2300, 420, 2200, 1900), (222, 2600, 450, 1900, 1500), (140, 2500, 430, 2000, 1600),
          (104, 3000, 480, 1500, 1000), (258, 2400, 460, 1700, 1300), (-55, 2700, 550, 1900, 1300),
          (14, 3000, 650, 2100, 1400), (64, 2800, 600, 1700, 1200), (198, 1700, 400, 900, 700),
          (160, 1800, 430, 850, 650)]
FAR_CLOUDS = 26          # kleine Haufen weit draussen, rundum knapp über dem Horizont
CLOUD_ALBEDO = (0.62, 0.60, 0.63, 1)   # nicht zu hell: im Sonnenlicht bliebe sonst nur Weiss (der Pinsel entsättigt Spitzen)


def cloud_lobes(rng, width, height):
    """Ballen einer Haufenwolke [(Mittelpunkt, Radien x y z)], Objektkoordinaten: Basis bei z = 0, Breite in x, Tiefe in y.
    Ein Kern aus grossen Ballen, in der Mitte am höchsten; darauf Quellungen, jede Stufe kleiner, nach oben und aussen –
    so entsteht der „Blumenkohl“ (die Metaballs vorher verschmolzen zu glatten Kugeln)."""
    lobes = []
    n0 = 6
    level = []
    for i in range(n0):
        u = (i / (n0 - 1) - 0.5) * width * 0.7 + rng.normal(0, width * 0.03)
        top = max(0.0, 1 - abs(2 * u / width) ** 1.5)
        r = width * rng.uniform(0.12, 0.16) * (0.65 + 0.35 * top)
        z = r * 0.55 + (height - 2 * r) * 0.55 * top * rng.uniform(0.75, 1.0)
        c = np.array([u, rng.normal(0, width * 0.05), z])
        level.append(len(lobes))
        lobes.append((c, r))
        zz = z - r * 1.1   # Säule bis zur Basis: sonst klaffte unter hohen Türmen eine Lücke über der flachen Basis
        while zz > r * 0.3:
            lobes.append((c + np.array([rng.normal(0, r * 0.15), rng.normal(0, r * 0.15), zz - z]), r * rng.uniform(0.95, 1.1)))
            zz -= r * 1.1
    base = []
    for i in range(7):   # breite, flache Basis (Ellipsoide: unten eine glatte Fläche statt hängender Kugeln)
        u = (i / 6 - 0.5) * width * 0.68 + rng.normal(0, width * 0.02)
        rb = width * rng.uniform(0.11, 0.15)
        base.append((np.array([u, rng.normal(0, width * 0.05), rb * 0.15]), np.array([rb, rb * 0.8, rb * 0.5])))
    for scale, per in ((0.55, 5), (0.5, 3), (0.48, 2)):
        new = []
        for k in level:
            c, r = lobes[k]
            for j in range(per):
                v = rng.normal(size=3); v[2] = abs(v[2]) + 0.25
                v /= np.linalg.norm(v)
                outw = np.array([c[0], 1.6 * c[1], 0.0])
                v = v + 0.35 * outw / (np.linalg.norm(outw) + 1e-6)
                v /= np.linalg.norm(v)
                rr = r * scale * rng.uniform(0.75, 1.15)
                new.append(len(lobes))
                lobes.append((c + v * (r - 0.3 * rr), rr))
        level = new
    return [(c, np.array([r, r * 0.9, r * 0.92])) for c, r in lobes] + base


_SPHERES = {}


def _unit_sphere(sub=3):
    """Ikosphäre mit Radius 1 (Ecken, Dreiecke), einmal gebaut (bmesh je Ballen war langsam: 10 s je Wolke)"""
    if sub in _SPHERES:
        return _SPHERES[sub]
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    V = np.array([v.co[:] for v in bm.verts]); F = np.array([[v.index for v in f.verts] for f in bm.faces])
    bm.free()
    _SPHERES[sub] = (V, F)
    return V, F


def cloud_mesh(name, rng, width, height, mat):
    """Wolke als Fläche: Ballen (Ikosphären) vereint (Voxel-Remesh), unten flach geschnitten, leicht verbeult"""
    V0, F0 = _unit_sphere()
    lobes = cloud_lobes(rng, width, height)
    V = np.concatenate([V0 * rad + c for c, rad in lobes])
    F = np.concatenate([F0 + k * len(V0) for k in range(len(lobes))])
    me = make_mesh(name + '_roh', V, F, smooth=False)
    tmp = link(name + '_roh', me)
    mod = tmp.modifiers.new('Vereinen', 'REMESH')
    mod.mode = 'VOXEL'; mod.voxel_size = width / 190.0; mod.adaptivity = 0.0
    dg = bpy.context.evaluated_depsgraph_get()
    out = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
    n = len(out.vertices)
    co = np.empty(n * 3); out.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
    nr = np.empty(n * 3); out.vertices.foreach_get('normal', nr); nr = nr.reshape(-1, 3)
    # verbeult: feine Quellungen, die die Ballen nicht ganz rund lassen
    P = Perlin(int(rng.integers(1, 10_000)))
    s = 9.0 / width
    bump = fbm(P, co[:, 0] * s + co[:, 2] * s * 0.7, co[:, 1] * s - co[:, 2] * s * 0.5, 3)
    co = co + nr * (bump * width * 0.012)[:, None]
    co[:, 2] = np.maximum(co[:, 2], 0.0)       # flache Basis
    out.vertices.foreach_set('co', co.ravel())
    out.update()
    out.shade_smooth()
    out.materials.clear(); out.materials.append(mat)
    out.name = name
    return out


CLOUD_DENS = 0.03    # je m im Inneren: dicht wie echte Haufenwolken, nur die ausgefransten Ränder scheinen durch


def mat_cloud():
    """Wolke als Volumen: weiss, nach vorn streuend (zur Sonne hin leuchtende Ränder); Dichte aus dem Gitter density.
    Ferne Wolken im Dunst (Eigenschaft dunst je Objekt, 0 … 1): weniger eigenes Licht, dafür die Farbe des Horizonts in
    ihrer Richtung – so viel, wie eine Fläche dort an Luftperspektive bekäme (die Gruppe Luft gilt nur für Flächen)"""
    m = bpy.data.materials.new('Wolke'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    vol = t.node('ShaderNodeVolumePrincipled', in_Anisotropy=0.5, in_Density=CLOUD_DENS)
    dens = t.node('ShaderNodeAttribute'); dens.attribute_name = 'density'
    haze = t.node('ShaderNodeAttribute'); haze.attribute_type = 'OBJECT'; haze.attribute_name = 'dunst'
    keep = t.math('SUBTRACT', 1.0, haze.outputs['Fac'])
    t.link(t.vmath('MULTIPLY', (0.95, 0.95, 0.97), keep), vol.inputs['Color'])
    oi = t.node('ShaderNodeObjectInfo')
    d = t.vmath('ADD', t.vmath('MULTIPLY', t.vmath('NORMALIZE', t.vmath('MULTIPLY', oi.outputs['Location'], (1, 1, 0))), (1, 1, 0)), (0, 0, 0.03))
    g = t.node('ShaderNodeGroup'); g.node_tree = bpy.data.node_groups.get('Himmelsfarbe') or sky_group()
    t.link(d, g.inputs['Richtung']); g.inputs['Gain'].default_value = SKY_GAIN
    t.link(g.outputs['Farbe'], vol.inputs['Emission Color'])
    t.link(t.math('MULTIPLY', t.math('MULTIPLY', haze.outputs['Fac'], dens.outputs['Fac']), CLOUD_DENS), vol.inputs['Emission Strength'])
    t.link(vol.outputs[0], out.inputs['Volume'])
    return m


def build_clouds(coll):
    """Haufenwolken als Volumen (Sammlung „Volumen“: nicht in Tiefe und Himmelsmaske): die Ballenform (cloud_mesh,
    unsichtbar) wird zu einem Dichtegitter mit weichem Rand (Mesh to Volume) und von Wolkenrauschen verdrängt (Volume
    Displace) – so fransen die Ränder aus wie bei echten Haufenwolken, statt glatt wie Watte zu sein"""
    mat = mat_cloud()
    rng = np.random.default_rng(31)
    far = []
    for k in range(FAR_CLOUDS):
        deg = k * 360.0 / FAR_CLOUDS + rng.uniform(-6, 6)
        dist = rng.uniform(4500, 6500)
        w = rng.uniform(450, 900)
        far.append((deg, dist, rng.uniform(300, 420), w, w * rng.uniform(0.5, 0.8)))
    for k, (deg, dist, base, width, height) in enumerate(CLOUDS + far):
        a = math.radians(deg)
        loc, rot = (dist * math.sin(a), dist * math.cos(a), base), (0, 0, -a + rng.normal(0, 0.15))
        me = cloud_mesh('Wolkenform_%02d' % k, rng, width, height, mat)
        form = link('Wolkenform_%02d' % k, me, coll)
        form.location, form.rotation_euler = loc, rot
        for vis in ('visible_camera', 'visible_shadow', 'visible_diffuse', 'visible_glossy', 'visible_transmission',
                    'visible_volume_scatter'):
            setattr(form, vis, False)
        vd = bpy.data.volumes.new('Wolke_%02d' % k)
        vd.materials.append(mat)
        ob = link('Wolke_%02d' % k, vd, coll)
        ob.location, ob.rotation_euler = loc, rot
        ob['dunst'] = 1 - math.exp(-dist / AIR_DIST * math.exp(-(base + height * 0.4) / AIR_HEIGHT))
        mv = ob.modifiers.new('Form', 'MESH_TO_VOLUME')
        mv.object = form
        mv.resolution_mode = 'VOXEL_SIZE'; mv.voxel_size = width / 110.0
        mv.interior_band_width = width / 80.0
        mv.density = 1.0
        # Rauschen in Farbe: jeder Kanal verschiebt in eine Richtung (grau verschöbe alles nur entlang der Diagonale)
        tex = bpy.data.textures.new('Wolkenrand_%02d' % k, 'CLOUDS')
        tex.cloud_type = 'COLOR'; tex.noise_scale = width * 0.045; tex.noise_depth = 4
        dp = ob.modifiers.new('Ausfransen', 'VOLUME_DISPLACE')
        dp.texture = tex; dp.texture_map_mode = 'LOCAL'
        dp.strength = width * 0.045
        dp.texture_mid_level = (0.5, 0.5, 0.5)
    log('Wolken', len(CLOUDS) + len(far))


def build_volumes():
    coll = collection('Volumen')
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    build_clouds(coll)


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
    build_ground()
    build_plants()
    build_volumes()
    world()
    sun_lamp()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def replace_ground():
    _remove(['Gelaende', 'Wasser'])
    build_ground()


def replace_plants():
    _remove(['Pflanzen', 'Pflanzen nah'])
    for ng in [g for g in bpy.data.node_groups if g.name.startswith('Pflanzen verteilen')]:
        bpy.data.node_groups.remove(ng)
    build_plants()


def replace_volumes():
    build_volumes()


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove(['Sonne'])
    sun_lamp()


# ---------------------------------------------------------------- Export fürs Spiel

WATER_MAP = (256, 96.0)   # Wasserkarte ums Brett: Zellen je Seite, halbe Breite (m; 0,75 m je Zelle, 16 Bit reichen dafür)
WATER_GAME = (70.0, 95.0) # die Wasseroberfläche zeichnet bis hier das Spiel (Wellen), Blender erst dahinter (Übergang)
SHORE_RANGE = (-128.0, 32.0)   # Abstand zur Wasserlinie in der Karte (16 Bit: die Phase der Wellen hängt daran)


GAME_DETAIL = {'palm': 0.4, 'tree': 0.3, 'tier': 0.3, 'bush': 0.15}  # Spielmodelle: weniger Fiedern und Blätter
GAME_VARIANTS = {'palm': 4, 'tree': 3, 'tier': 1, 'bush': 2}            # ... und nur so viele Vorlagen je Art


def game_index():
    """Nummer des Spielmodells je Vorlage (−1: keins); die nahen Pflanzen nehmen nur Vorlagen mit Spielmodell"""
    idx, k = np.full(KINDS['rock'][1], -1), 0
    for kind, n in GAME_VARIANTS.items():
        lo = KINDS[kind][0]
        idx[lo:lo + n] = np.arange(k, k + n); k += n
    return idx


def pack_model(co, col, tri):
    """Modell kompakt (Base64): Ecken als Int16 (1/8192 m der Vorlage), Farben Uint8 (Wurzel: die dunklen Töne genauer),
    Dreiecke Uint16. Die Normalen rechnet das Spiel aus den Dreiecken (die Ecken eines Blatts gehören nur ihm)."""
    import base64
    if len(co) > 65536:  # sonst liefen die Indizes still über (verwürfelte Dreiecke im Spiel)
        raise ValueError(f'pack_model: {len(co)} Ecken, Uint16-Indizes reichen für höchstens 65536')
    b = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    return {'n': len(co), 'pos16': b(np.clip(np.round(co * 8192), -32767, 32767).astype('<i2')),
            'col8': b(np.clip(np.round(np.sqrt(np.clip(col, 0, 1)) * 255), 0, 255).astype('u1')),
            'idx16': b(tri.astype('<u2'))}


def game_models():
    """Modelle fürs Spiel (GAME_VARIANTS je Art in der Reihenfolge von KINDS; weniger Fiedern und Blätter als im
    Panorama, gleiche Form): Spielkoordinaten (x, z, −y), Fuss im Ursprung, Höhe 1; kompakt (pack_model)"""
    models = []
    full = plant_models(GAME_DETAIL)
    for kind, count in GAME_VARIANTS.items():
        lo = KINDS[kind][0]
        for _, md in full[lo:lo + count]:
            me = mesh('tmp', md['V'], md['F'], md['M'], smooth=True)
            me.calc_loop_triangles()
            n = len(me.vertices)
            co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
            tri = np.empty(len(me.loop_triangles) * 3, np.int64); me.loop_triangles.foreach_get('vertices', tri)
            bpy.data.meshes.remove(me)
            vm = np.zeros(n, np.int64)
            for f, m in zip(md['F'], md['M']):
                vm[f] = m
            cols = np.array(PLANT_COLORS[kind])                       # Material, dunkel/hell, rgb
            col = cols[vm, 0] + (cols[vm, 1] - cols[vm, 0]) * md['T'][:, None]
            g = lambda a: np.c_[a[:, 0], a[:, 2], -a[:, 1]]          # Blender -> Spiel (eine Drehung: Umlauf bleibt)
            models.append(pack_model(g(co), col, tri))
    return models


def sun_visibility(p, occ_pos, occ_r):
    """Anteil Sonne an den Punkten p (K, 3): Strahl zur Sonne gegen das Gelände (abgetastet) und gegen Kugeln (Kronen
    der Pflanzen in der Nähe)"""
    sun = np.array(SUN)
    lit = np.ones(len(p))
    for t in np.geomspace(0.3, 300, 120):
        q = p + t * sun
        lit = np.where(ground(q[:, 0], q[:, 1]).z > q[:, 2] + 0.03, 0.0, lit)
    for i0 in range(0, len(p), 256):
        P = p[i0:i0 + 256, None, :]
        d = occ_pos[None] - P                                    # zum Mittelpunkt der Kugel
        along = d @ sun
        miss2 = (d ** 2).sum(-1) - along ** 2
        hit = (along > 0.2) & (miss2 < occ_r[None] ** 2)
        lit[i0:i0 + 256] *= ~hit.any(1)
    return lit


def near_plants(pts=None):
    """Pflanzen, die das Spiel zeichnet: [x, y, z, Höhe, Breite, Drehung, Modell, Sonne unten, oben, Helligkeit]
    (Spielkoordinaten des Fusses); Sonne je Mittel aus drei Punkten am Stamm bzw. in der Krone"""
    pos, var, scl, rot = pts or plant_points()
    near = near_mask(pos, var)
    # Schattenwerfer: Kronen aller Pflanzen bis etwas ausserhalb (Palmen oben, Bäume und Büsche in der Mitte)
    occ = np.hypot(pos[:, 0], pos[:, 1]) < R_NEAR + 60
    palm_ = var < KINDS['tree'][0]
    cz = np.where(palm_, 0.95, 0.65) * scl[:, 2]
    occ_pos = (pos + np.c_[np.zeros((len(pos), 2)), cz])[occ]
    occ_r = (np.where(palm_, 0.3, 0.3) * scl[:, 0])[occ]   # kleiner als die Hülle: Kronen sind lückig
    p, v, s, r = pos[near], var[near], scl[near], rot[near]
    sun = np.array(SUN); sh = sun[:2] / np.linalg.norm(sun[:2])
    light = []
    for fs in ((0.1, 0.2, 0.3), (0.75, 0.85, 0.95)):
        pts = np.concatenate([p + np.c_[np.zeros((len(p), 2)), f * s[:, 2]] for f in fs])
        # aus der eigenen Krone heraus zur Sonne hin
        pts[:, :2] += 0.45 * np.tile(s[:, 0], len(fs))[:, None] * sh
        light.append(sun_visibility(pts, occ_pos, occ_r).reshape(3, -1).mean(0))
    rng = np.random.default_rng(5)
    shade = rng.uniform(0.85, 1.0, len(p))
    game = np.c_[p[:, 0], p[:, 2], -p[:, 1]]
    gi = game_index()
    return [[round(float(g[0]), 3), round(float(g[1]), 3), round(float(g[2]), 3), round(float(si[2]), 3),
             round(float(si[0]), 3), round(float(ri[2]), 3), int(gi[vi]), round(float(lo), 2), round(float(hi), 2),
             round(float(sd), 2)]
            for g, si, ri, vi, lo, hi, sd in zip(game, s, r, v, light[0], light[1], shade)]


def rock_tops(x, y, pts):
    """Oberseite der Felsblöcke an den Punkten x, y (Blender; nan: keiner), aus den Vorlagen und Standorten"""
    from mathutils import Euler, Vector
    from mathutils.bvhtree import BVHTree
    pos, var, scl, rot = pts
    lo, hi = KINDS['rock']
    tpl = [boulder(950 + k)[:2] for k in range(hi - lo)]
    pad = scl[:, 0] * 1.2 + 1.0
    use = ((var >= lo) & (var < hi) & (pos[:, 0] > x.min() - pad) & (pos[:, 0] < x.max() + pad)
           & (pos[:, 1] > y.min() - pad) & (pos[:, 1] < y.max() + pad))
    verts, polys = [], []
    for p, v, s_, r in zip(pos[use], var[use], scl[use], rot[use]):
        Vt, Ft = tpl[v - lo]
        M = np.array(Euler(r.tolist(), 'XYZ').to_matrix())
        W = (np.asarray(Vt) * s_) @ M.T + p
        polys += [[i + len(verts) for i in f] for f in Ft]
        verts += W.tolist()
    top = np.full(x.shape, np.nan)
    if not polys:
        return top
    bvh = BVHTree.FromPolygons(verts, polys)
    down = Vector((0.0, 0.0, -1.0))
    for i, (a, b) in enumerate(zip(x.ravel(), y.ravel())):
        hit = bvh.ray_cast(Vector((a, b, WATER + 30.0)), down)
        if hit[0] is not None:
            top.flat[i] = hit[0].z
    return top


def water_map(pts=None):
    """Karten ums Brett fürs Wasser im Spiel (Zeile 0: Spiel-z = −extent, Spalte 0: x = −extent), je 16 Bit in zwei
    Kanälen (hoch, tief): erste R/G Wassertiefe (−3 … 13 m; an Land negativ: Höhe über dem Wasser – fein genug, dass
    die Wasserlinie des Auflaufens keine Stufen bekommt), B Fels; zweite R/G Abstand zur Wasserlinie (SHORE_RANGE,
    > 0 an Land: die Phase der Wellen hängt daran)"""
    n, ext = WATER_MAP
    c = (np.arange(n) + 0.5) / n * 2 * ext - ext
    GX, GZ = np.meshgrid(c, c)                                   # Spalte x, Zeile z (Spiel)
    g = ground(GX, -GZ)
    depth = WATER - g.z
    rock = np.clip(g.rock, 0, 1)
    # Felsblöcke: je Zelle 3 × 3 Proben, die Tiefe gemittelt (über dem Wasser höchstens 0,75 m gezählt: die Linie, wo
    # das Wasser endet, liegt dann eher etwas im Block als davor), dazu ein Ring Fels um die Blöcke (Schaum)
    cell = 2 * ext / n
    off = (np.arange(3) - 1) * cell / 3
    sx = (GX[..., None, None] + off[None, None, :, None]) + 0 * off[None, None, None, :]
    sy = (-GZ[..., None, None] - off[None, None, None, :]) + 0 * off[None, None, :, None]
    top = rock_tops(sx, sy, pts or plant_points())
    hit = ~np.isnan(top)
    d0 = depth[..., None, None]
    sub = np.where(hit, np.minimum(np.clip(WATER - np.fmax(top, g.z[..., None, None]), -0.75, None), d0), d0)
    depth = sub.mean((2, 3))
    cover = hit.mean((2, 3))
    for _ in range(2):   # erweitern und weich: ein Ring um die Blöcke
        pad = np.pad(cover, 1, mode='edge')
        cover = np.max([pad[i:i + n, j:j + n] for i in range(3) for j in range(3)], 0) * 0.5 + cover * 0.5
    rock = np.maximum(rock, np.clip(cover * 1.5, 0, 1))
    def bits(v):
        q = np.round(np.clip(v, 0, 1) * 65535).astype(np.int64)
        return (q >> 8) / 255.0, (q & 255) / 255.0
    dh, dl = bits((depth + 3) / 16)
    sh, sl = bits((g.s - SHORE_RANGE[0]) / (SHORE_RANGE[1] - SHORE_RANGE[0]))
    return np.stack([dh, dl, np.round(rock * 255) / 255], -1), np.stack([sh, sl, np.zeros_like(sh)], -1)


def export(stil='beach'):
    """sky/<stil>/ebenen.json (Pflanzen nah: Modelle und Standorte; Wasser: Karte als water.png) für pack.mjs"""
    import json
    from wald_io import save_image
    sky = os.path.join(ROOT, 'sky', stil)
    os.makedirs(sky, exist_ok=True)
    pts = plant_points()
    main, shore = water_map(pts)
    save_image(main, os.path.join(sky, 'water.png'))
    save_image(shore, os.path.join(sky, 'water_shore.png'))
    n, ext = WATER_MAP
    plants = near_plants(pts)
    data = {'flora': {'models': game_models(), 'instances': plants},
            'water': {'map': 'file:water.png', 'shore': 'file:water_shore.png', 'size': n, 'extent': ext,
                      'level': WATER, 'depthRange': [-3, 13], 'shoreRange': list(SHORE_RANGE), 'fade': list(WATER_GAME)}}
    with open(os.path.join(sky, 'ebenen.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, separators=(',', ':'))
    return {'pflanzen': len(plants), 'ecken': [m['n'] for m in data['flora']['models']],
            'dreiecke': [len(m['idx16']) * 3 // 4 // 6 for m in data['flora']['models']]}
