# Baut die Blender-Szene «Eishöhle» (Skybox icecave, Wunsch vom 11.11.2026, Skizze B), realistisch gerendert und
# danach gemalt wie die übrigen (Stil icecave in stile.py). Über den Blender-MCP: wald_mcp.neu('icecave') baut sie und
# speichert tools/blender/icecave.blend; einzelne Teile neu mit wald_mcp.scene('icecave').replace_cave().
# Vorbilder (Fotos aus Wikimedia Commons, Runde 2 nach «zu künstlich und gleichmässig»): die Eishöhlen im
# Breiðamerkurjökull und Falljökull (Island), unter dem Mendenhall (Alaska) und dem Nigardsbreen (Norwegen, mit
# Höhlensee). Was sie natürlich macht und hier nachgebaut ist:
#   - keine Kuppel, eine niedrige, unregelmässige Halle: längs weiter als quer, die Decke mal steil, mal flach bis auf
#     den Kies herab (ein dunkler Keil), grosse Beulen; ein Ausgang ins Tageslicht und ein dunkler Gang, der um die Ecke
#     tiefer in den Gletscher führt; in der Decke genau über dem Brett ein Schmelzwasserschacht (Mühle) als
#     Trichter, oben offen: Blickt die Kamera der Geschichte hinauf, sieht sie durch ihn den Himmel, und die Lichter
#     fliegen durch ihn ein und aus
#   - Mulden («Scallops») verschieden gross, längs der Halle gestreckt und schief wie Löffel (steil auf der Seite gegen
#     den Luftzug), zum Ausgang grösser; dazwischen glatte Stellen; nass und glänzend – hell sind nur ihre Kanten, wo sich
#     das Licht spiegelt
#   - Farbe nach dem Licht: am Ausgang und am Schacht hell türkis bis weiss, tief drinnen fast schwarzes Saphirblau;
#     Flecken aus weissem, blasigem Eis, dünne Stellen der Decke leuchten; unten schmutziges, graues Eis mit Steinen;
#     Asche- und Kieslagen schräg und gefaltet, mal dick, mal dünn, mal aussetzend
#   - am Boden Kies, runde Steine und Felsbrocken, ein Bach aus dem Gang in den See und einer hinaus; der See am Ufer
#     klar über dem Kies, in der Mitte tief und dunkel; wenige, grosse abgestürzte Eisblöcke; Zapfen nur am Ausgang,
#     am Schacht und an ein paar Rissen
# Aufbau: Das Brett schwebt 4 m über dem See (WATER). Wand am Boden um R_CAVE (längs ±R_LONG), Decke H_CAVE hoch, je
# Richtung eine eigene Superellipse (shape). Die Kamera des Spiels steht ganz herausgezoomt bis 45 m von der Mitte (dort
# gut 11 m über dem See; die Wand ist auf dieser Höhe mindestens 65 m weg) und höchstens 28 m hoch (skybox.json
# camera.top): Das Gewölbe senkt sich zur Wand hin, mit 32 m stiess sie 36 m von der Mitte hinein (kamera_abstand()).
# Licht: die Sonne draussen (Lampe «Sonne», im Spiel die Richtung des Hauptlichts) nur auf Berge und Ebene draussen
# (Light Linking: durch den Schacht fiele sonst ihr Fleck auf den See), eine Flächenlampe vor dem Ausgang für das
# Himmelslicht, dazu leuchtet dünnes Eis (Attribut thin). Kein Lichtstrahl (Wunsch des Nutzers vom 12.11.2026).
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
    """Baumodul der Strand-Szene (ohne Aufbau): Sammlungen, Felsblöcke, Verteiler"""
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
WATER = -4.0          # Seespiegel (das Brett 4 m darüber)
R_CAVE = 84.0         # mittlerer Radius der Wand am Boden
R_LONG = 0.12         # längs (y: Ausgang vorn) so viel weiter, quer so viel enger
H_CAVE = 42.0         # Höhe der Decke über dem See in der Mitte (je Richtung gut ±1 m, dazu die Beulen)
AXIS_Z = WATER + 12.0  # von hier aus zeigt «nach aussen» (Richtung der Beulen und Mulden)
STRETCH = 2.4         # Mulden längs der Halle (y) so viel länger: die Luft zieht zum Ausgang
# Gänge: Richtung (Grad, 0 = +y, + nach +x), halbe Breite und Höhe an der Wand (w0, h0) und am Ende (w1, h1), Länge
# hinter der Wand, Beginn vor der Wand (start < 0), seitlicher Bogen (m), Schiefe des Bogens; open: ins Freie
PASSAGES = [
    dict(name='Tunnel', deg=0.0, w0=24.0, h0=16.0, w1=21.0, h1=15.0, length=34.0, start=-10.0, bend=5.0, tilt=0.22,
         open=True),
    dict(name='Gang', deg=-140.0, w0=16.0, h0=13.0, w1=0.6, h1=0.4, length=72.0, start=-10.0, bend=-26.0, tilt=-0.1,
         open=False),
]
SUN_EL, SUN_AZ = 50.0, 20.0   # Sonne draussen (Richtung des Hauptlichts im Spiel)
SUN = Vector((math.sin(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_EL)),
              math.cos(math.radians(SUN_AZ)) * math.cos(math.radians(SUN_EL)), math.sin(math.radians(SUN_EL))))
HOLE_R = 9.0          # mittlerer Radius der Öffnung oben im Schacht (über dem Brett: von dort gut 14° gross)
FUNNEL = 7.0          # so hoch steigt die Decke im Trichter bis zur Öffnung
SEG = 3072            # Spalten der Halle rundum (gut 0,16 m an der Wand: die feinen Mulden bleiben rund)
ROWS = 480            # Zeilen vom Boden zum Scheitel
EXTENT = 4000.0
G = [Perlin(s) for s in range(901, 931)]


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


def ring(P, th, f, octaves=3):
    """Rauschen rundum ohne Naht, gut 6 · f Wellen je Umlauf"""
    return fbm(P, np.cos(th) * f + 3.7, np.sin(th) * f - 1.9, octaves)


def noise3(P, X, Y, Z, size, octaves=3):
    """Rauschen im Raum aus drei Ebenen (keine Naht, kein Knoten im Scheitel), um 0, etwa ±0,7"""
    return (fbm(P, X / size, Y / size + 11.3, octaves) + fbm(P, Y / size - 4.1, Z / size + 2.7, octaves)
            + fbm(P, Z / size + 7.9, X / size - 6.5, octaves)) / 1.6


# ---------------------------------------------------------------- Form der Halle

def wall_radius(th):
    """Radius der Wand am Boden je Richtung: längs weiter (Ellipse), Buchten und Vorsprünge"""
    return R_CAVE * (1 + R_LONG * np.cos(2 * th)) + 8.0 * ring(G[0], th, 0.8) + 3.5 * ring(G[1], th, 2.6)


def ceiling_height(th):
    return H_CAVE + 3.0 * ring(G[2], th, 1.1)


def shape(th):
    """Exponent der Superellipse je Richtung: klein = die Decke senkt sich flach bis auf den Boden (Keil), gross =
    steile Wand; wo ein Gang abgeht, mindestens 2,6 (sonst verdeckte die Wand seinen Bogen)"""
    s = 2.25 + 0.75 * ring(G[20], th, 0.6)
    for P in PASSAGES:
        dth = np.angle(np.exp(1j * (th - math.radians(P['deg']))))
        s = s + np.maximum(2.6 - s, 0) * np.exp(-(dth / 0.25) ** 2)
    return s


def shell(th, phi):
    """Punkt der Halle ohne Beulen und Mulden: Richtung th, Winkel phi (0 am See … π/2 im Scheitel; negativ unter dem
    See): Radius und Höhe"""
    e = 2.0 / shape(th)
    c = np.clip(np.cos(phi), 0, 1) ** e
    s = np.sign(phi) * np.abs(np.sin(phi)) ** e
    return wall_radius(th) * c, WATER + ceiling_height(th) * s


def ceiling_at(x, y):
    """Höhe der Decke über einem Punkt (ohne Beulen): umgekehrte Superellipse"""
    th = np.arctan2(x, y)
    S_ = shape(th)
    q = np.clip(np.hypot(x, y) / wall_radius(th), 0, 1)
    return WATER + ceiling_height(th) * (1 - q ** S_) ** (1 / S_)


HOLE = (0.0, 0.0, float(ceiling_at(np.array(0.0), np.array(0.0))))   # Schacht genau über dem Brett (Decke dort)


def hole_radius(ang):
    return HOLE_R * (1 + 0.28 * fbm(G[11], np.cos(ang) * 1.6 + 3.1, np.sin(ang) * 1.6 - 0.4, 3))


def funnel(V):
    """Hebung der Decke um den Schacht (0 … FUNNEL): ein Trichter wie eine Glocke, oben steil"""
    hx, hy, hz = HOLE
    dx, dy = V[:, 0] - hx, V[:, 1] - hy
    rh = hole_radius(np.arctan2(dy, dx))
    t = 1 - smoothstep(rh * 0.92, rh * 2.6, np.hypot(dx, dy))
    return FUNNEL * t ** 1.6 * smoothstep(hz - 14, hz - 4, V[:, 2])


# ---------------------------------------------------------------- Gänge

def frame(P):
    a = math.radians(P['deg'])
    return np.array([math.sin(a), math.cos(a)]), np.array([math.cos(a), -math.sin(a)])


def local(P, X, Y):
    """Lage zum Gang: entlang (von der Mitte der Halle) und quer"""
    d, n = frame(P)
    return X * d[0] + Y * d[1], X * n[0] + Y * n[1]


def passage_ends(P):
    R0 = float(wall_radius(np.array(math.radians(P['deg']))))
    return R0 + P['start'], R0 + P['length']


def section(P, a):
    """Querschnitt bei a (entlang): Mitte quer, Sohle, halbe Breite, Höhe; s 0 am Beginn … 1 am Ende"""
    a0, a1 = passage_ends(P)
    s = np.clip((a - a0) / (a1 - a0), 0, 1)
    k = s ** (1.5 if P['open'] else 2.2)
    w = P['w0'] + (P['w1'] - P['w0']) * k
    h = P['h0'] + (P['h1'] - P['h0']) * k
    return P['bend'] * np.sin(s * 1.9), WATER - 1.5, w, h, s


def in_passage(P, V, margin):
    a, c = local(P, V[:, 0], V[:, 1])
    cx, z0, w, h, s = section(P, a)
    return (((c - cx) / (w * margin)) ** 2 + (np.maximum(V[:, 2] - z0, 0) / (h * margin)) ** 2 < 1) & (a > 0)


def in_any_passage(V, margin):
    m = np.zeros(len(V), bool)
    for P in PASSAGES:
        m |= in_passage(P, V, margin)
    return m


def mouth(P, back=0.0):
    """Mitte des Gangs kurz vor seinem Ende (Weltkoordinaten, auf 40 % der Höhe)"""
    d, n = frame(P)
    a1 = passage_ends(P)[1] - back
    cx, z0, w, h, s = section(P, np.array(a1))
    xy = d * a1 + n * float(cx)
    return np.array([xy[0], xy[1], WATER + 0.4 * float(h)])


# ---------------------------------------------------------------- Eis: Dicke, Lagen, Mulden

def thinness(V):
    """Wie viel Tageslicht durchs Eis kommt (0 … 1): nahe am Ausgang und am Schacht, dünne Fenster in der Decke; zum
    dunklen Gang hin weniger"""
    X, Y, Z = V[:, 0], V[:, 1], V[:, 2]
    d_exit = np.linalg.norm(V - mouth(PASSAGES[0]), axis=-1)
    d_hole = np.linalg.norm(V - np.array([HOLE[0], HOLE[1], HOLE[2] + FUNNEL]), axis=-1)
    top = smoothstep(WATER + 20.0, WATER + 44.0, Z)
    blot = noise3(G[5], X, Y, Z, 30.0, 3)
    win = smoothstep(0.15, 0.55, noise3(G[21], X, Y, Z, 22.0, 3)) * smoothstep(WATER + 20.0, WATER + 36.0, Z)
    ga, _ = local(PASSAGES[1], X, Y)
    back = smoothstep(20.0, passage_ends(PASSAGES[1])[0] + 15.0, ga)
    # am Schacht nur sein Rand hell (er liegt über dem Brett: weiter gefasst brannte die ganze Decke weiss aus)
    t = 0.2 + 0.95 * np.exp(-d_exit / 42) + 0.55 * np.exp(-d_hole / 7) + 0.1 * top + 0.15 * win + 0.25 * blot - 0.15 * back
    return np.clip(t, 0, 1)


def strata(V):
    """Lagen im Eis: ash (breite, weiche Aschebänder mit Schlieren, aussetzend, dazu feine Linien) und grit (Bänder aus
    Kies und Sand, ungleich dick, nur im unteren Teil der Wände), schräg geneigt (gut 11°) und gefaltet"""
    X, Y, Z = V[:, 0], V[:, 1], V[:, 2]
    fold = 6.0 * noise3(G[6], X, Y, Z, 70.0, 2) + 1.8 * noise3(G[22], X, Y, Z, 16.0, 2)
    L = Z + 0.20 * X - 0.08 * Y + fold
    dist = lambda period: (0.5 - np.abs(((L / period) % 1) - 0.5)) * period    # Abstand zur nächsten Lage (m)
    gap = smoothstep(0.0, 0.35, noise3(G[7], X, Y, Z, 18.0, 3))
    half = 0.3 + 1.0 * np.clip(noise3(G[23], X, Y, Z, 30.0, 2) + 0.3, 0, 1.2)
    streak = np.clip(0.4 + 0.9 * noise3(G[29], X / 4.0, Y / 4.0, L, 1.0, 2), 0, 1)   # Schlieren entlang der Lage
    wide = (1 - smoothstep(0.2 * half, half + 1.5, dist(13.0))) * gap * streak
    fine = (1 - smoothstep(0.04, 0.14, dist(3.1))) * smoothstep(0.0, 0.3, noise3(G[28], X, Y, Z, 18.0, 2))
    halfb = 0.35 + 0.7 * np.clip(noise3(G[24], X, Y, Z, 34.0, 2) + 0.3, 0, 1.2)
    band = (1 - smoothstep(halfb, halfb + 0.3, dist(23.0))) * smoothstep(-0.25, 0.1, noise3(G[27], X, Y, Z, 40.0, 2))
    band = band * smoothstep(WATER + 17.0, WATER + 9.0, Z)   # Schutt nur nahe dem Grund (oben wirkten die Bänder wie Kabel)
    return np.clip(0.6 * wide + 0.25 * fine, 0, 1), np.clip(band, 0, 1)


def basal(V):
    """Schmutziges Eis am Grund der Wände (0 … 1): grau, voller Steine; die Grenze wellt sich"""
    X, Y, Z = V[:, 0], V[:, 1], V[:, 2]
    n = noise3(G[25], X, Y, Z, 14.0, 3)
    return 1 - smoothstep(WATER + 3.0 + 3.0 * n, WATER + 7.5 + 4.0 * n, Z)


def _hash(c, seed, k):
    h = (c[..., 0] * 73856093) ^ (c[..., 1] * 19349663) ^ (c[..., 2] * 83492791) ^ (seed * 2654435761 + k * 97531)
    h = (h ^ (h >> 13)) * 1274126177
    return ((h ^ (h >> 16)) & 0xFFFFFF).astype(np.float64) / float(0x1000000)


def cells(Q, cell, seed, weight=0.32):
    """Zitterndes Gitter in 3D (Anteil der Zelle), jeder Punkt mit eigenem Gewicht (Abstand minus Gewicht: die Kanten
    zwischen den Mulden sind gebogen wie bei Fischschuppen, nicht gerade wie bei Waben, und die Mulden ungleich gross):
    gewichteter Abstand zum nächsten und zweitnächsten Punkt und der Weg vom nächsten her (für die Schiefe)"""
    f1 = np.empty(len(Q)); f2 = np.empty(len(Q)); off = np.empty((len(Q), 3))
    for a in range(0, len(Q), 100000):
        p = Q[a:a + 100000] / cell
        g = np.floor(p).astype(np.int64)
        b1 = np.full(len(p), np.inf); b2 = np.full(len(p), np.inf); o = np.zeros((len(p), 3))
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    c = g + np.array([dx, dy, dz])
                    q = c + np.stack([_hash(c, seed, k) for k in range(3)], -1) * 0.8 + 0.1
                    v = p - q
                    d = np.sqrt(np.sum(v * v, -1)) - _hash(c, seed, 7) * weight
                    nearer = d < b1
                    b2 = np.where(nearer, b1, np.minimum(b2, d))
                    o = np.where(nearer[:, None], v, o)
                    b1 = np.minimum(b1, d)
        f1[a:a + 100000] = b1; f2[a:a + 100000] = b2; off[a:a + 100000] = o
    return f1, f2, off


RIDGES, DEEP, CUPS = {}, {}, {}   # je Netz fürs Material: Nähe zu einer Kante zwischen zwei Mulden (0 … 1), Tiefe
# der Mulden an diesem Ort, Lage in der Mulde (0 an der Kante … 1 in der Mitte: dort ist das Eis dünner und leuchtet)
# Grössen der Mulden (m, quer; längs STRETCH mal länger), ihre Tiefe und Saat
SCALLOPS = [(1.6, 0.28, 3), (2.8, 0.55, 4), (4.6, 0.95, 5)]
FINE = (0.85, 0.12, 6)   # dazu überall feine Mulden (auch in den grossen), wo das Eis Mulden hat


def scallop(V, key):
    """Mulden nach aussen (vom Inneren gesehen Vertiefungen mit scharfen Kanten dazwischen) in drei Grössen, je Ort
    eine andere (zum Ausgang grösser), schief wie Löffel (gegen den Luftzug steil); dazwischen glatte Stellen. Die Tiefe
    folgt dem Abstand zur Kante (f2 − f1): an der Kante 0, zur Mitte flach auslaufend"""
    X, Y, Z = V[:, 0], V[:, 1], V[:, 2]
    out = V - np.array([0.0, 0.0, AXIS_Z])
    n = out / np.maximum(np.linalg.norm(out, axis=-1, keepdims=True), 1e-6)
    Q = V / np.array([1.0, STRETCH, 1.0])
    # Grösse je Ort: grossräumig und mit breiten Übergängen (eng gefasst wechselten die Muster zu abrupt)
    size = 0.5 + 0.6 * noise3(G[26], X, Y, Z, 40.0, 2) + 0.35 * np.exp(-np.linalg.norm(V - mouth(PASSAGES[0]), axis=-1) / 50)
    w_small = smoothstep(0.5, 0.15, size); w_big = smoothstep(0.5, 0.85, size)
    weights = [w_small, np.clip(1 - w_small - w_big, 0, 1), w_big]
    deep = 1.25 * smoothstep(-0.3, 0.45, noise3(G[19], X, Y, Z, 34.0, 2))
    disp = np.zeros(len(V)); ridge = np.zeros(len(V)); cup = np.zeros(len(V))
    for (cell, depth, seed), w in zip(SCALLOPS, weights):
        sub = np.nonzero(w > 0.01)[0]
        if not len(sub):
            continue
        f1, f2, off = cells(Q[sub], cell, seed)
        lean = off[:, 1] / np.maximum(np.linalg.norm(off, axis=-1), 1e-6)   # > 0: zum Ausgang hin von der Mitte
        e = (f2 - f1) * (1 - 0.35 * lean)
        prof = 1 - (1 - np.clip(e / 0.45, 0, 1)) ** 2
        disp[sub] += w[sub] * depth * prof
        cup[sub] += w[sub] * prof
        ridge[sub] = np.maximum(ridge[sub], w[sub] * smoothstep(0.10, 0.02, f2 - f1))
    f1, f2, off = cells(Q, FINE[0], FINE[2])
    disp += FINE[1] * (1 - (1 - np.clip((f2 - f1) / 0.45, 0, 1)) ** 2)
    ridge = np.maximum(ridge, 0.5 * smoothstep(0.10, 0.02, f2 - f1))
    RIDGES[key] = ridge * np.clip(deep, 0, 1)
    DEEP[key] = np.clip(deep, 0, 1)
    CUPS[key] = 0.5 + (cup - 0.5) * np.clip(deep, 0, 1)
    return V + n * (disp * deep)[:, None]


def ice_attrs(me, V, key, thin=None, **extra):
    ash, grit = strata(V)
    S.attrs(me, thin=thinness(V) if thin is None else thin, ash=ash, grit=grit, basal=basal(V),
            ridge=RIDGES[key], deep=DEEP[key], cup=CUPS[key], **extra)


CAVE = {}   # Ecken der Netze (für die Eiszapfen)


def cave_mesh():
    """Halle als Gitter (Richtung × Winkel), mit Beulen und Mulden, Trichter zum Schacht; Gänge und Öffnung ausgespart"""
    th = np.arange(SEG) * 2 * np.pi / SEG
    phi = np.concatenate([np.linspace(-0.09, 0.0, 12, endpoint=False), np.linspace(0, 1, ROWS) ** 1.15 * (np.pi / 2)])
    T, PH = np.meshgrid(th, phi)
    r, z = shell(T, PH)
    B = np.stack([r * np.sin(T), r * np.cos(T), z], -1).reshape(-1, 3)
    out = B - np.array([0.0, 0.0, AXIS_Z])
    n0 = out / np.maximum(np.linalg.norm(out, axis=-1, keepdims=True), 1e-6)
    lump = 3.5 * noise3(G[3], B[:, 0], B[:, 1], B[:, 2], 20.0, 3) + 1.3 * noise3(G[4], B[:, 0], B[:, 1], B[:, 2], 7.0, 2)
    V = scallop(B + n0 * lump[:, None], 'Kuppel')
    lift = funnel(V)
    V[:, 2] += lift
    nr, nc = PH.shape
    i = np.arange(nr - 1)[:, None] * nc; j = np.arange(nc)[None]
    a = i + j; b = i + (j + 1) % nc
    F = np.stack([a, a + nc, b + nc, b], -1).reshape(-1, 4)         # Normale nach aussen (Cycles: beide Seiten)
    ragged = 0.66 + 0.12 * np.clip(noise3(G[17], V[:, 0], V[:, 1], V[:, 2], 4.0, 3) + 0.5, 0, 1)   # nie über 0,78
    # Öffnung des Schachts: Ecken darin auf ihren ausgefransten Rand geschoben (die Zeilen des Netzes sind dort Ringe;
    # abgeschnitten gab ihr Rand Treppen), Flächen ganz darin fallen weg
    hole = lift > 0.985 * FUNNEL
    hx, hy, hz = HOLE
    ang = np.arctan2(V[hole, 1] - hy, V[hole, 0] - hx)
    rim_r = hole_radius(ang) * 0.95
    V[hole, 0] = hx + np.cos(ang) * rim_r; V[hole, 1] = hy + np.sin(ang) * rim_r
    cut = in_any_passage(V, ragged)
    F = F[~cut[F].any(1) & ~hole[F].all(1)]
    me = make_mesh('Kuppel', V, F)
    ice_attrs(me, V, 'Kuppel', rim=smoothstep(0.55, 0.95, lift / FUNNEL))
    CAVE['Kuppel'] = (V, lift)
    log('Halle', len(V), 'Ecken,', len(F), 'Flächen; Schacht bei', [round(v, 1) for v in HOLE])
    return me


def passage_mesh(P):
    """Gang von vor der Wand bis zu seinem Ende: flacher Bogen im Querschnitt, schief, mit Beulen und Mulden; der
    dunkle Gang wird enger und schliesst sich hinter seinem Bogen"""
    d, nrm = frame(P)
    a0, a1 = passage_ends(P)
    A, PS = np.meshgrid(np.linspace(a0, a1, 270 if P['open'] else 390), np.linspace(-0.15, np.pi + 0.15, 630),
                        indexing='ij')
    cx, z0, w, h, s = section(P, A)
    sp = np.sin(PS)
    C = cx + w * np.cos(PS)
    Zl = z0 + h * (np.sign(sp) * np.abs(sp) ** 0.6 + P['tilt'] * np.cos(PS))
    B = np.stack([A * d[0] + C * nrm[0], A * d[1] + C * nrm[1], Zl], -1).reshape(-1, 3)
    rad = np.stack([np.cos(PS) * nrm[0], np.cos(PS) * nrm[1], sp], -1).reshape(-1, 3)
    lump = (3.0 * noise3(G[9], B[:, 0], B[:, 1], B[:, 2], 12.0, 3) + 0.8 * noise3(G[10], B[:, 0], B[:, 1], B[:, 2], 4.0, 2))
    lump *= np.clip(w.ravel() / 8.0, 0, 1)
    V = scallop(B + rad * lump[:, None], P['name'])
    nr, nc = A.shape
    i = np.arange(nr - 1)[:, None] * nc; j = np.arange(nc - 1)[None]
    a = i + j
    F = np.stack([a, a + 1, a + nc + 1, a + nc], -1).reshape(-1, 4)
    me = make_mesh(P['name'], V, F)
    t = thinness(V)
    t = np.maximum(t, 0.25 + 0.75 * s.ravel()) if P['open'] else t * (1 - s.ravel()) ** 2
    ice_attrs(me, V, P['name'], thin=t, rim=np.zeros(len(V)))
    CAVE[P['name']] = (V.reshape(nr, nc, 3), PS)
    log(P['name'], len(V), 'Ecken')
    return me


# ---------------------------------------------------------------- Boden, See

def lake_radius(th):
    return 0.56 * wall_radius(th) + 4.5 * ring(G[13], th, 2.2)


def channel(P, X, Y, width):
    """Bachbett entlang eines Gangs (0 … 1), mäandrierend, ab dem See bis ans Ende (und hinaus)"""
    a, c = local(P, X, Y)
    cx, z0, w, h, s = section(P, a)
    m = cx + 2.5 * np.sin(a / 11.0 + P['deg'])
    return smoothstep(width, width * 0.35, np.abs(c - m)) * smoothstep(20.0, 35.0, a)


DRY = 0.12   # so hoch über dem Wasser liegt nasser Kies (die Wassermaske zählt bis 0,05 m darüber als Wasser)


def floor_height(x, y):
    """Boden: See als Mulde (am Ufer seicht, in der Mitte gut 7 m tief), Ufer aus Kies, an der Wand ein Saum aus Schutt;
    Bäche aus dem Gang und durch den Tunnel; in den Gängen Kiesbänke, draussen eine Schotterebene mit Moränenwällen,
    Schneewehen und verflochtenen Rinnen. Ausserhalb des Sees sind Bäche und Rinnen nur nasser Kies knapp über dem
    Wasser: Offenes Wasser zeichnete das Spiel dort im flachen Blick durch den Ausgang treppig. Zurück: Höhe, Ufer
    (0 … 1), draussen (0 … 1)"""
    th = np.arctan2(x, y); r = np.hypot(x, y)
    rl, rw = lake_radius(th), wall_radius(th)
    bowl = WATER - 0.6 - 6.5 * np.clip(1 - r / rl, 0, 1) ** 1.3
    rough = 0.35 * fbm(G[14], x / 7, y / 7, 3) + 0.15 * fbm(G[27], x / 2.2, y / 2.2, 2)
    shore = WATER + 0.12 + 0.055 * np.maximum(r - rl, 0) + 3.0 * smoothstep(rw - 22, rw, r) ** 2 + rough
    k = smoothstep(rl - 2.5, rl + 2.5, r)
    h = bowl * (1 - k) + shore * k
    out = np.zeros_like(h)
    for P in PASSAGES:
        a, c = local(P, x, y)
        a0, a1 = passage_ends(P)
        cx, z0, w, hh, s = section(P, a)
        inner = smoothstep(a0 + 2.0, a0 + 14.0, a) * (np.abs(c - cx) < 1.3 * w)
        bank = WATER + 0.3 + 2.2 * np.clip((c - cx) / w, -1.3, 1.3) ** 2 + 0.5 * rough + (0.0 if P['open'] else 1.5 * s)
        h = h * (1 - inner) + inner * bank
        if P['open']:
            o = smoothstep(a1 - 6.0, a1 + 4.0, a) * (np.abs(c) < 600)
            braid = smoothstep(0.07, 0.025, np.abs(fbm(G[28], x / 45, y / 70, 3)))
            ridge = np.clip(1 - np.abs(fbm(G[16], x / 160, y / 260, 3)) * 3.5, 0, 1) ** 2      # Moränenwälle
            # Schneewehen; ab 170 m liegen die Ringe des Bodens zu weit auseinander dafür (dort nur Rauschen)
            drift = 0.25 * fbm(G[29], x / 9, y / 2.5, 3) * smoothstep(175.0, 150.0, r)
            # Moränenhügel weiter draussen: genau sie füllen den schmalen Blick durch den Ausgang (bis gut 4° hoch)
            hills = 24.0 * np.clip(fbm(G[18], x / 140, y / 140, 3) + 0.15, 0, None) ** 1.3 * smoothstep(a1 + 160, a1 + 480, a)
            plain = (WATER + 0.5 + 0.0035 * np.maximum(a - a1, 0) + 0.6 * fbm(G[15], x / 30, y / 30, 3)
                     + 3.5 * ridge * smoothstep(a1 + 30, a1 + 120, a) + drift)
            # Rinnen nur in der Ebene, die Hügel liegen darüber (zuvor schnitten sie bis 18 m tiefe Schluchten hinein)
            plain = plain * (1 - braid) + braid * (WATER + DRY) + hills
            h = h * (1 - o) + o * plain
            out = np.maximum(out, o)
    bed = WATER - 0.45 + (0.45 + DRY) * smoothstep(rl - 2.0, rl + 8.0, r)   # im See unter Wasser, danach nasser Kies
    for P, wd in ((PASSAGES[1], 2.6), (PASSAGES[0], 4.0)):
        ch = channel(P, x, y, wd)
        if P['open']:   # der Bach verläuft sich draussen in der Ebene (sonst eine Kerbe genau in der Blickachse)
            ch = ch * smoothstep(passage_ends(P)[1] + 160.0, passage_ends(P)[1] + 60.0, local(P, x, y)[0])
        h = h * (1 - ch) + ch * np.minimum(h, bed)
    return h, k, out


def floor_mesh():
    """Boden als Ringe um die Mitte, dort mit einem Fächer geschlossen (offen lag genau unter dem Brett ein Loch von
    0,5 m: im Spiel ein blauer Kreis). Zurück zwei Netze: Boden (Höhle) und Ebene (draussen vor dem Mundloch, für die
    Sonne)"""
    # bis 1000 m dichter (Moränenhügel im Blick durch den Ausgang, Geröll liegt auf dem Netz)
    R = np.concatenate([np.linspace(0.5, 170, 450), np.geomspace(170.5, 1000, 100), np.geomspace(1010, EXTENT, 30)])
    A = np.arange(1536) * 2 * np.pi / 1536
    X = R[:, None] * np.sin(A)[None]; Y = R[:, None] * np.cos(A)[None]
    Z, shore, out = floor_height(X, Y)
    z0, sh0, out0 = floor_height(np.zeros(1), np.zeros(1))
    V = np.concatenate([np.stack([X, Y, Z], -1).reshape(-1, 3), [[0.0, 0.0, float(z0[0])]]])
    shore = np.append(shore.ravel(), sh0); out = np.append(out.ravel(), out0)
    nr, nc = X.shape
    i = np.arange(nr - 1)[:, None] * nc; j = np.arange(nc)[None]
    a = i + j; b = i + (j + 1) % nc
    quads = np.stack([a, b, b + nc, a + nc], -1).reshape(-1, 4)
    fan = np.stack([np.full(nc, nr * nc), (np.arange(nc) + 1) % nc, np.arange(nc)], -1)
    outside = out[quads].min(1) > 0.5
    parts = []
    for name, blocks in (('Boden', [quads[~outside], fan]), ('Ebene', [quads[outside]])):
        used = np.unique(np.concatenate([q.ravel() for q in blocks]))
        remap = np.full(len(V), -1); remap[used] = np.arange(len(used))
        me = make_mesh(name, V[used], [remap[q] for q in blocks])
        S.attrs(me, shore=shore[used], snow=out[used])
        parts.append((name, me))
    return parts


# ---------------------------------------------------------------- Materialien

HAZE = (0.005, 0.026, 0.065)   # blauer Dunst im Inneren
HAZE_DIST = 340.0
HAZE_OUT = (0.10, 0.14, 0.20)  # draussen: heller Taghimmel
# Eis nach dem Licht, das durchkommt: fast schwarz … Saphir … Türkis … blass
ICE = [(0.0, (0.003, 0.010, 0.034)), (0.3, (0.010, 0.052, 0.19)), (0.6, (0.030, 0.21, 0.58)),
       (0.85, (0.19, 0.60, 0.90)), (1.0, (0.60, 0.87, 0.98))]
ICE_LIGHT = (0.42, 0.78, 0.97)
GLOW = 1.25          # Leuchten des dünnen Eises: Tageslicht, das durchs Eis kommt (12.11.: Eis heller)


def air(t, sh, haze=HAZE, dist=HAZE_DIST):
    """Luftperspektive: nach dem Weg ein Anteil Dunstfarbe (nur Kamera und Spiegelungen)"""
    lp = t.node('ShaderNodeLightPath')
    f = t.math('SUBTRACT', 1.0, t.math('EXPONENT', t.math('DIVIDE', lp.outputs['Ray Length'], -dist)))
    f = t.math('MULTIPLY', f, t.math('MAXIMUM', lp.outputs['Is Camera Ray'], lp.outputs['Is Glossy Ray']))
    em = t.node('ShaderNodeEmission', in_Strength=1.0); em.inputs['Color'].default_value = haze + (1,)
    mx = t.node('ShaderNodeMixShader')
    t.link(f, mx.inputs[0]); t.link(sh, mx.inputs[1]); t.link(em.outputs[0], mx.inputs[2])
    return mx.outputs[0]


def new_material(name):
    m = bpy.data.materials.get(name)
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name); m.use_nodes = True
    return m, NT(m.node_tree)


def attr(t, name):
    a = t.node('ShaderNodeAttribute'); a.attribute_name = name
    return a.outputs['Fac']


def noise(t, vec, scale, detail=3.0):
    n = t.node('ShaderNodeTexNoise', in_Scale=scale, in_Detail=detail); t.link(vec, n.inputs['Vector'])
    return n.outputs['Fac']


def mat_ice_wall():
    """Eis der Wände: Farbe nach dem Licht (thin), türkise Zonen und weisses, blasiges Eis in Flecken; schwarze
    Aschelinien, graue Kiesbänder, unten schmutziges Eis mit Steinen; nass und glänzend, feine Mulden im Relief; dünnes
    Eis leuchtet, die Kanten der Mulden nur im Licht"""
    m, t = new_material('Eiswand')
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    thin, ashv, grit, bas = attr(t, 'thin'), attr(t, 'ash'), attr(t, 'grit'), attr(t, 'basal')
    ridge, deep, rim, cup = attr(t, 'ridge'), attr(t, 'deep'), attr(t, 'rim'), attr(t, 'cup')
    n1 = noise(t, pos, 0.05, 4.0)
    k = t.math('ADD', thin, t.math('MULTIPLY', t.math('SUBTRACT', n1, 0.5), 0.3))
    k = t.math('ADD', k, t.math('MULTIPLY', t.math('SUBTRACT', cup, 0.5), 0.08))
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position = ICE[0][0]; cr.elements[0].color = ICE[0][1] + (1,)
    cr.elements[1].position = ICE[-1][0]; cr.elements[1].color = ICE[-1][1] + (1,)
    for p, c in ICE[1:-1]:
        cr.elements.new(p).color = c + (1,)
    t.link(k, ramp.inputs['Fac'])
    lit = ramp.outputs['Color']
    # türkise Zonen: anderes, älteres Eis
    teal = t.vmath('MULTIPLY', lit, (0.6, 1.12, 0.82))
    col = t.mix(t.maprange(noise(t, pos, 0.012, 2.0), 0.45, 0.75, 0.0, 0.6), lit, teal)
    # weisses, blasiges Eis in Flecken (matt)
    white = t.math('MULTIPLY', t.maprange(noise(t, pos, 0.03, 3.0), 0.55, 0.75), t.math('SUBTRACT', 1.0, bas))
    col = t.mix(t.math('MULTIPLY', white, 0.75), col, (0.50, 0.66, 0.78, 1))
    # Blasen im klaren Eis: feine helle Punkte
    bub = t.node('ShaderNodeTexVoronoi', in_Scale=6.0); bub.feature = 'F1'; t.link(pos, bub.inputs['Vector'])
    col = t.mix(t.math('MULTIPLY', t.maprange(bub.outputs['Distance'], 0.08, 0.02), 0.12), col, (0.80, 0.92, 1.0, 1))
    # Steinchen in Kiesbändern und schmutzigem Eis
    st = t.node('ShaderNodeTexVoronoi', in_Scale=2.5); st.feature = 'F1'; t.link(pos, st.inputs['Vector'])
    stone = t.maprange(st.outputs['Distance'], 0.32, 0.22)
    gritc = t.mix(stone, (0.05, 0.053, 0.058, 1), (0.14, 0.135, 0.13, 1))
    col = t.mix(t.math('MULTIPLY', grit, 0.95), col, gritc)
    col = t.mix(t.math('MULTIPLY', ashv, 0.55), col, (0.02, 0.035, 0.07, 1))
    basc = t.mix(t.maprange(n1, 0.3, 0.7), (0.016, 0.020, 0.028, 1), (0.05, 0.058, 0.072, 1))
    basc = t.mix(t.math('MULTIPLY', stone, 0.8), basc, (0.11, 0.105, 0.10, 1))
    col = t.mix(bas, col, basc)
    # Schlieren: Lagen aus blasenreicherem und klarerem Eis, flach gestreckt; darin Züge feiner Blasen
    streak = noise(t, t.vmath('MULTIPLY', pos, (0.12, 0.12, 1.6)), 1.0, 4.0)
    col = t.vmath('MULTIPLY', col, t.maprange(streak, 0.3, 0.7, 0.82, 1.15))
    fb = t.node('ShaderNodeTexVoronoi', in_Scale=14.0); fb.feature = 'F1'; t.link(pos, fb.inputs['Vector'])
    train = t.math('MULTIPLY', t.maprange(fb.outputs['Distance'], 0.1, 0.03), t.maprange(streak, 0.58, 0.7))
    col = t.mix(t.math('MULTIPLY', train, 0.35), col, (0.85, 0.94, 1.0, 1))
    # nasse Rinnen: Schmelzwasser läuft die steilen Wände hinab (dunkler, spiegelnd)
    nz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nz.inputs[0])
    sz = t.node('ShaderNodeSeparateXYZ'); t.link(pos, sz.inputs[0])
    rn = noise(t, t.vmath('MULTIPLY', pos, (1.2, 1.2, 0.08)), 1.0, 3.0)
    runnel = t.math('MULTIPLY', t.maprange(t.math('ABSOLUTE', t.math('SUBTRACT', rn, 0.5)), 0.035, 0.01),
                    t.math('MULTIPLY', t.maprange(t.math('ABSOLUTE', nz.outputs['Z']), 0.6, 0.3),
                           t.maprange(sz.outputs['Z'], WATER + 26.0, WATER + 14.0)))
    col = t.vmath('MULTIPLY', col, t.math('SUBTRACT', 1.0, t.math('MULTIPLY', runnel, 0.3)))
    # Raureif an den Öffnungen: feine weisse Kristalle, vor allem auf den Kanten der Mulden
    fr = t.node('ShaderNodeTexVoronoi', in_Scale=25.0); fr.feature = 'F1'; t.link(pos, fr.inputs['Vector'])
    hoar = t.math('MULTIPLY', t.math('MULTIPLY', t.maprange(fr.outputs['Distance'], 0.18, 0.06), t.maprange(thin, 0.65, 0.95)),
                  t.math('ADD', 0.35, t.math('MULTIPLY', ridge, 0.65)))
    col = t.mix(t.math('MULTIPLY', hoar, 0.8), col, (0.88, 0.95, 1.0, 1))
    # Kanten der Mulden etwas heller (Reif, abgeschliffen), Reif um die Öffnung des Schachts
    col = t.mix(t.math('MULTIPLY', ridge, t.math('MULTIPLY', thin, 0.25)), col, ICE_LIGHT + (1,))
    col = t.mix(t.math('MULTIPLY', rim, 0.7), col, (0.85, 0.93, 1.0, 1))
    bs = t.node('ShaderNodeBsdfPrincipled')
    t.link(col, bs.inputs['Base Color'])
    matt = t.math('MAXIMUM', t.math('MAXIMUM', white, grit), t.math('MAXIMUM', rim, t.math('MULTIPLY', bas, 0.5)))
    matt = t.math('MAXIMUM', matt, hoar)
    rough = t.math('ADD', 0.035, t.math('MULTIPLY', matt, 0.4))
    t.link(t.math('MULTIPLY', rough, t.math('SUBTRACT', 1.0, t.math('MULTIPLY', runnel, 0.7))), bs.inputs['Roughness'])
    # Leuchten: nur wo Licht durchs Eis kommt, Schmutz und Asche dunkel; die Kanten der Mulden fangen es
    clean = t.math('MULTIPLY', t.math('SUBTRACT', 1.0, ashv), t.math('SUBTRACT', 1.0, t.math('MAXIMUM', grit, bas)))
    glow = t.math('MULTIPLY', t.math('POWER', thin, 1.2), clean)
    glow = t.math('MULTIPLY', glow, t.math('ADD', 0.8, t.math('MULTIPLY', cup, 0.4)))
    emis = t.vmath('MULTIPLY', lit, t.math('MULTIPLY', glow, GLOW))
    t.link(emis, bs.inputs['Emission Color']); bs.inputs['Emission Strength'].default_value = 1.0
    # feine Mulden im Relief (gestreckt wie die grossen), nur wo das Eis Mulden hat
    q = t.vmath('MULTIPLY', pos, (1.0, 1.0 / STRETCH, 1.0))
    v1 = t.node('ShaderNodeTexVoronoi', feature='SMOOTH_F1', in_Scale=1.4, in_Smoothness=0.6)
    v2 = t.node('ShaderNodeTexVoronoi', feature='SMOOTH_F1', in_Scale=0.7, in_Smoothness=0.6)
    t.link(q, v1.inputs['Vector']); t.link(q, v2.inputs['Vector'])
    h1 = t.math('SUBTRACT', 1.0, t.math('MULTIPLY', v1.outputs['Distance'], v1.outputs['Distance']))
    h2 = t.math('SUBTRACT', 1.0, t.math('MULTIPLY', v2.outputs['Distance'], v2.outputs['Distance']))
    hgt = t.mix(t.maprange(noise(t, pos, 0.06, 2.0), 0.4, 0.6), h1, h2)
    bmp = t.node('ShaderNodeBump', in_Distance=0.12)
    t.link(hgt, bmp.inputs['Height'])
    t.link(t.math('MULTIPLY', deep, 0.25), bmp.inputs['Strength'])
    t.link(bmp.outputs['Normal'], bs.inputs['Normal'])
    t.link(air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


def mat_ice_block(name='Eisblock', glow=0.18):
    """Abgestürztes Eis, jeder Block anders (Zufall je Instanz, tone je Vorlage): tiefblau, türkis oder milchig weiss;
    Bänder aus blasigem Eis, feine helle Risse, Schmutz in flachen Lagen, oben etwas Reif; an den Kanten heller (das
    Licht kommt durchs dünne Eis); nass glänzend, mit Mulden im Relief"""
    m, t = new_material(name)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    nz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nz.inputs[0])
    tone = attr(t, 'tone')
    tc = t.node('ShaderNodeTexCoord')
    info = t.node('ShaderNodeObjectInfo')
    rnd = info.outputs['Random']
    obj = t.vmath('ADD', tc.outputs['Object'], t.vmath('MULTIPLY', (17.0, 31.0, 7.0), rnd))   # je Instanz verschoben
    n = noise(t, obj, 1.5, 3.0)
    k = t.math('ADD', t.math('MULTIPLY', t.math('ADD', tone, rnd), 0.3), t.math('MULTIPLY', t.math('SUBTRACT', n, 0.5), 0.6))
    col = t.mix(k, (0.004, 0.025, 0.10, 1), (0.05, 0.26, 0.55, 1))
    teal = t.maprange(t.math('FRACT', t.math('MULTIPLY', rnd, 7.0)), 0.6, 0.85)                # manche türkis
    col = t.mix(t.math('MULTIPLY', teal, 0.7), col, (0.03, 0.30, 0.42, 1))
    milky = t.maprange(t.math('FRACT', t.math('MULTIPLY', rnd, 13.0)), 0.75, 0.95)             # manche milchig weiss
    col = t.mix(t.math('MULTIPLY', milky, 0.65), col, (0.42, 0.56, 0.68, 1))
    # Bänder aus blasigem Eis (flach geschichtet), feine helle Risse
    bands = t.maprange(noise(t, t.vmath('MULTIPLY', obj, (0.5, 0.5, 4.0)), 1.0, 3.0), 0.58, 0.68)
    col = t.mix(t.math('MULTIPLY', bands, 0.55), col, (0.50, 0.64, 0.76, 1))
    cn = t.node('ShaderNodeTexNoise', noise_dimensions='4D', in_Scale=1.2, in_Detail=5.0, in_Roughness=0.6)
    t.link(obj, cn.inputs['Vector']); t.link(rnd, cn.inputs['W'])
    crack = t.maprange(t.math('ABSOLUTE', t.math('SUBTRACT', cn.outputs['Fac'], 0.5)), 0.005, 0.0)   # fein: breit
    col = t.mix(t.math('MULTIPLY', crack, 0.3), col, (0.55, 0.72, 0.85, 1))                          # wirkte es wie Adern
    col = t.mix(t.math('MULTIPLY', t.maprange(nz.outputs['Z'], 0.85, 0.98), 0.12), col, (0.80, 0.90, 0.98, 1))
    # an den Kanten (streifend gesehen) heller: dort ist das Eis dünn
    lw = t.node('ShaderNodeLayerWeight', in_Blend=0.3)
    col = t.mix(t.math('MULTIPLY', lw.outputs['Facing'], 0.35), col, (0.35, 0.62, 0.85, 1))
    # Schmutz in flachen Lagen (runde Flecken sahen aus wie Augen)
    dirt = t.maprange(noise(t, t.vmath('MULTIPLY', obj, (0.6, 0.6, 5.0)), 1.0, 3.0), 0.6, 0.7)
    col = t.mix(t.math('MULTIPLY', dirt, 0.45), col, (0.03, 0.035, 0.04, 1))
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.05)
    sv = t.node('ShaderNodeTexVoronoi', feature='SMOOTH_F1', in_Scale=4.0, in_Smoothness=0.5)
    t.link(obj, sv.inputs['Vector'])
    bmp = t.node('ShaderNodeBump', in_Strength=0.35, in_Distance=0.05)
    t.link(t.math('SUBTRACT', 1.0, t.math('MULTIPLY', sv.outputs['Distance'], sv.outputs['Distance'])), bmp.inputs['Height'])
    t.link(bmp.outputs['Normal'], bs.inputs['Normal'])
    t.link(col, bs.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (glow, glow, glow)), bs.inputs['Emission Color'])
    bs.inputs['Emission Strength'].default_value = 1.0
    t.link(air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


def mat_floe():
    """Eisscholle: oben Schnee und Reif, weiss bis hellblau mit Wehen und grauen Schlieren, am Rand nasses blaues Eis"""
    m, t = new_material('Scholle')
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    top, snowy = attr(t, 'top'), attr(t, 'snowy')
    snow = t.mix(t.maprange(noise(t, pos, 0.6, 4.0), 0.35, 0.7), (0.55, 0.68, 0.80, 1), (0.82, 0.90, 0.97, 1))
    # blankes Eis, wo der Schnee weggeweht ist: je Scholle mehr oder weniger (snowy)
    level = t.math('ADD', 0.35, t.math('MULTIPLY', snowy, 0.3))
    bare = t.maprange(t.math('SUBTRACT', noise(t, pos, 0.35, 3.0), level), 0.0, 0.08)
    snow = t.mix(t.math('MULTIPLY', bare, 0.85), snow, (0.10, 0.34, 0.58, 1))
    streak = t.maprange(noise(t, t.vmath('MULTIPLY', pos, (0.4, 3.0, 1.0)), 1.0, 3.0), 0.62, 0.72)
    snow = t.mix(t.math('MULTIPLY', streak, 0.35), snow, (0.40, 0.48, 0.56, 1))
    ice = t.mix(t.maprange(noise(t, pos, 1.5, 3.0), 0.3, 0.7), (0.03, 0.20, 0.45, 1), (0.16, 0.52, 0.80, 1))
    col = t.mix(top, ice, snow)
    bs = t.node('ShaderNodeBsdfPrincipled')
    t.link(col, bs.inputs['Base Color'])
    t.link(t.math('ADD', 0.08, t.math('MULTIPLY', t.math('MULTIPLY', top, t.math('SUBTRACT', 1.0, bare)), 0.6)),
           bs.inputs['Roughness'])
    t.link(t.vmath('MULTIPLY', col, (0.12, 0.12, 0.12)), bs.inputs['Emission Color'])
    bs.inputs['Emission Strength'].default_value = 1.0
    bmp = t.node('ShaderNodeBump', in_Strength=0.3, in_Distance=0.05)
    t.link(noise(t, pos, 4.0, 4.0), bmp.inputs['Height'])
    t.link(bmp.outputs['Normal'], bs.inputs['Normal'])
    t.link(air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


def mat_icicle():
    """Zapfen: klares, helles Eis, glänzend, gegen das Licht leuchtend"""
    m, t = new_material('Zapfen')
    out = t.node('ShaderNodeOutputMaterial')
    lw = t.node('ShaderNodeLayerWeight', in_Blend=0.4)
    col = t.mix(lw.outputs['Facing'], (0.30, 0.62, 0.86, 1), (0.75, 0.90, 0.98, 1))
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.06)
    t.link(col, bs.inputs['Base Color'])
    t.link(t.vmath('MULTIPLY', col, (0.25, 0.25, 0.25)), bs.inputs['Emission Color'])
    bs.inputs['Emission Strength'].default_value = 1.0
    t.link(air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


def mat_rock():
    """Steine: Basalt, Granit und Gneis vom Gletscherbett, abgeschliffen, feucht glänzend; je Stein ein Ton"""
    m, t = new_material('Stein')
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    nz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nz.inputs[0])
    tone = attr(t, 'tone')
    base = t.mix(t.math('POWER', tone, 2.0), (0.026, 0.028, 0.032, 1), (0.16, 0.15, 0.14, 1))
    col = t.vmath('MULTIPLY', base, t.maprange(nz.outputs['Z'], 0.0, 0.9, 0.7, 1.15))
    col = t.vmath('MULTIPLY', col, t.maprange(noise(t, geo.outputs['Position'], 3.0, 3.0), 0.3, 0.7, 0.85, 1.12))
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.3)
    t.link(col, bs.inputs['Base Color'])
    t.link(air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


def mat_floor():
    """Boden: Kies in vielen Grautönen, Sandflecken, am Wasser nass und dunkel; draussen Schnee in Flecken"""
    m, t = new_material('Boden')
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(pos, sep.inputs[0])
    wet = t.maprange(sep.outputs['Z'], WATER + 0.7, WATER + 0.05)
    n1 = noise(t, pos, 0.12, 4.0)
    gr = t.node('ShaderNodeTexVoronoi', in_Scale=9.0); t.link(pos, gr.inputs['Vector'])
    grav = t.mix(t.maprange(n1, 0.35, 0.65), (0.04, 0.042, 0.047, 1), (0.12, 0.115, 0.11, 1))
    grav = t.vmath('MULTIPLY', grav, t.vmath('ADD', t.vmath('MULTIPLY', gr.outputs['Color'], (0.5, 0.5, 0.5)), (0.72, 0.72, 0.72)))
    sand = t.maprange(noise(t, pos, 0.05, 3.0), 0.56, 0.64)
    grav = t.mix(t.math('MULTIPLY', sand, 0.8), grav, (0.15, 0.145, 0.14, 1))
    grav = t.mix(wet, grav, (0.016, 0.018, 0.022, 1))
    # unter Wasser feiner Gletscherschlamm, grau-türkis: Seichtes schimmert so türkis, Tiefes bleibt dunkel (die
    # Spiegelung zeichnet das Spiel; ohne sie war der See sonst fast schwarz)
    silt = t.maprange(sep.outputs['Z'], WATER - 0.2, WATER - 0.8)
    grav = t.mix(t.math('MULTIPLY', silt, 0.85), grav, (0.07, 0.12, 0.13, 1))
    snow = t.math('MULTIPLY', attr(t, 'snow'), t.maprange(noise(t, pos, 0.04, 3.0), 0.36, 0.5))
    snow = t.math('MULTIPLY', snow, t.math('SUBTRACT', 1.0, wet))      # nasse Rinnen bleiben frei
    gn = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], gn.inputs[0])
    snow = t.math('MULTIPLY', snow, t.maprange(gn.outputs['Z'], 0.72, 0.88))   # steile Hänge der Hügel: Schutt
    col = t.mix(snow, grav, (0.80, 0.88, 0.96, 1))
    bs = t.node('ShaderNodeBsdfPrincipled')
    t.link(col, bs.inputs['Base Color'])
    # nass glänzend nur an der Wasserlinie; darunter matter Schlamm (der Grund spiegelte sonst durchs klare Wasser
    # die Öffnung des Schachts: eine dunkle Scheibe unter dem Brett)
    shine = t.math('MULTIPLY', wet, t.maprange(sep.outputs['Z'], WATER - 0.6, WATER - 0.1))
    t.link(t.math('SUBTRACT', 0.85, t.math('MULTIPLY', shine, 0.7)), bs.inputs['Roughness'])
    # Relief: Kies, feiner Grus, an der Wasserlinie Rippeln im Sand
    gf = t.node('ShaderNodeTexVoronoi', in_Scale=32.0); t.link(pos, gf.inputs['Vector'])
    wv = t.node('ShaderNodeTexWave', in_Scale=0.9, in_Distortion=6.0, in_Detail=3.0); t.link(pos, wv.inputs['Vector'])
    near_water = t.math('MULTIPLY', t.maprange(sep.outputs['Z'], WATER + 1.4, WATER + 0.2),
                        t.maprange(sep.outputs['Z'], WATER - 0.1, WATER + 0.05))
    hgt = t.math('ADD', t.math('ADD', gr.outputs['Distance'], t.math('MULTIPLY', gf.outputs['Distance'], 0.4)),
                 t.math('MULTIPLY', t.math('MULTIPLY', wv.outputs['Fac'], near_water), 0.6))
    bmp = t.node('ShaderNodeBump', in_Strength=0.5, in_Distance=0.05); t.link(hgt, bmp.inputs['Height'])
    t.link(bmp.outputs['Normal'], bs.inputs['Normal'])
    t.link(air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


def mat_lake():
    """See und Bäche, wie Blender sie malt: nur der Grund durchs klare Wasser (durchsichtig ohne Brechung, die Trübung
    im Wasserkörper färbt ihn nach der Tiefe), keine Spiegelung. Die Oberfläche mit der Spiegelung zeichnet das Spiel
    (Ebene waterSurface, calm) passend zur Kamera: eingebacken blieb das Bild des Eingangs im Wasser stehen, wenn sie
    sich bewegte. Wie am Strand liest das Spiel den Grund geradlinig aus dem Panorama"""
    m, t = new_material('See')
    out = t.node('ShaderNodeOutputMaterial')
    tr = t.node('ShaderNodeBsdfTransparent')
    t.link(tr.outputs[0], out.inputs['Surface'])
    vol = t.node('ShaderNodeVolumeAbsorption', in_Density=0.35)
    vol.inputs['Color'].default_value = (0.25, 0.55, 0.62, 1)
    t.link(vol.outputs[0], out.inputs['Volume'])
    return m


def mat_outside(name, base, rock=None, snowline=None):
    """draussen: Schnee oder Fels im Tageslicht, mit hellem Dunst"""
    m, t = new_material(name)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    nz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Normal'], nz.inputs[0])
    pz = t.node('ShaderNodeSeparateXYZ'); t.link(geo.outputs['Position'], pz.inputs[0])
    col = t.vmath('MULTIPLY', base, t.maprange(noise(t, geo.outputs['Position'], 0.01, 5.0), 0.3, 0.7, 0.88, 1.05))
    if rock:
        steep = t.maprange(nz.outputs['Z'], 0.8, 0.55)
        if snowline is not None:
            steep = t.math('MAXIMUM', steep, t.maprange(pz.outputs['Z'], snowline, snowline - 150.0))
        # Felsrippen und Schneerinnen, die Hänge hinab gestreckt (sonst durch den Ausgang eine flache graue Wand)
        rib = noise(t, t.vmath('MULTIPLY', geo.outputs['Position'], (1.0, 1.0, 0.2)), 0.012, 5.0)
        rib = t.math('MULTIPLY', t.maprange(rib, 0.5, 0.58), t.maprange(nz.outputs['Z'], 0.97, 0.8))
        steep = t.math('MAXIMUM', steep, rib)
        col = t.mix(steep, col, rock + (1,))
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.8)
    t.link(col, bs.inputs['Base Color'])
    t.link(air(t, bs.outputs[0], HAZE_OUT, 6000.0), out.inputs['Surface'])
    return m


# ---------------------------------------------------------------- Aufbau der Teile

def build_cave():
    wall = mat_ice_wall()
    parts = [('Kuppel', cave_mesh())] + [(P['name'], passage_mesh(P)) for P in PASSAGES]
    for name, me in parts:
        me.materials.append(wall)
        link(name, me)
    floor = mat_floor()
    for name, me in floor_mesh():
        me.materials.append(floor)
        link(name, me)
    me = water_box()
    me.materials.append(mat_lake())
    link('See', me)
    me = floes_mesh()
    me.materials.append(mat_floe())
    link('Schollen', me)
    build_scatter()
    build_icicles()
    build_outside()


# Eisschollen, jede anders: Mitte (Blender x, y), mittlerer Radius (m), Saat, Streckung (Faktor, Richtung in Grad),
# Höhe über dem Wasser (m), Schnee (0 … 1), Presseisrücken (Richtung, Höhe in m), Neigung (Richtung, Grad). Neben der
# zweiten ein kleines Stück; keine unter dem Brett (Abstand zur Mitte minus Ausdehnung über 6 m). 13.11.2026 (Wunsch des
# Nutzers): keine geraden Bruchkanten mehr (sie wirkten abgeschnitten, vor allem bei den nahen), kein Körper unter
# Wasser, einige ragen höher heraus
FLOES = [
    dict(c=(-15.0, 26.0), r=6.5, seed=1, stretch=(1.45, 35), top=0.55, snow=0.75,
         ridge=(120, 0.3), tilt=(0, 0.0)),
    dict(c=(19.0, 33.0), r=4.6, seed=2, stretch=(1.1, 110), top=0.2, snow=0.3, ridge=None,
         tilt=(0, 0.0)),
    dict(c=(11.6, 30.5), r=1.4, seed=4, stretch=(1.35, 60), top=0.2, snow=0.25, ridge=None,
         tilt=(150, 2.5)),
    dict(c=(-31.0, -6.0), r=3.9, seed=3, stretch=(1.25, 160), top=0.7,
         snow=0.95, ridge=(40, 0.35), tilt=(300, 2.5)),
    # 12.11.2026: mehr Schollen, auch nah am Brett (12,7 … 18 m von der Mitte; unter ihm verdeckt es sie)
    dict(c=(-9.5, 9.0), r=2.3, seed=5, stretch=(1.3, 20), top=0.22, snow=0.6, ridge=None,
         tilt=(0, 0.0)),
    dict(c=(9.5, -8.5), r=1.9, seed=6, stretch=(1.5, 75), top=0.24, snow=0.35,
         ridge=None, tilt=(40, 2.0)),
    dict(c=(6.5, 14.5), r=2.6, seed=7, stretch=(1.15, 150), top=0.26, snow=0.85, ridge=None,
         tilt=(0, 0.0)),
    dict(c=(-14.0, -10.5), r=2.2, seed=8, stretch=(1.35, 110), top=0.45, snow=0.5,
         ridge=(60, 0.2), tilt=(0, 0.0)),
    dict(c=(25.0, 11.0), r=3.2, seed=9, stretch=(1.6, 45), top=0.5, snow=0.7,
         ridge=None, tilt=(200, 2.0)),
    dict(c=(-2.0, 39.0), r=3.0, seed=10, stretch=(1.2, 95), top=0.2, snow=0.4, ridge=None,
         tilt=(0, 0.0)),
    dict(c=(-26.0, 14.0), r=2.4, seed=11, stretch=(1.25, 0), top=0.6, snow=0.95, ridge=None,
         tilt=(120, 1.5)),
]
FLOE_RES = 192
ICE_FLAT = 0.6   # Höhe der ungeraden Eisvorlagen (flache Platten)


def floe_outline(f):
    """Umriss einer Scholle (Blender x, y, rund FLOE_RES Punkte): ausgefranst, gestreckt"""
    P = G[(f['seed'] * 7) % len(G)]
    A = np.linspace(0, 2 * np.pi, FLOE_RES, endpoint=False)
    rr = f['r'] * (1 + 0.24 * fbm(P, np.cos(A) * 1.3 + f['seed'], np.sin(A) * 1.3, 4)
                   + 0.12 * fbm(P, np.cos(A) * 5.0 - f['seed'], np.sin(A) * 5.0, 3)
                   + 0.04 * fbm(P, np.cos(A) * 16.0, np.sin(A) * 16.0 + f['seed'], 2))
    pts = np.stack([rr * np.sin(A), rr * np.cos(A)], -1)
    k, deg = f['stretch']
    d = np.array([math.sin(math.radians(deg)), math.cos(math.radians(deg))]); e = np.array([d[1], -d[0]])
    pts = np.outer(pts @ d * k, d) + np.outer(pts @ e / math.sqrt(k), e)
    return pts + np.array(f['c'])


def floes_mesh():
    """Schollen mit ausgefranstem Rand: Oberseite mit Schneewehen (bei manchen ein Presseisrücken, manche
    leicht geneigt), Rand abgerundet und angeschlagen, unten flach knapp unter Wasser; je Scholle eigene Höhe. Attribute top (1
    auf der Oberseite, 0 am Rand und darunter) und snowy (wie verschneit)"""
    Vs, Fs, tops, snows, n0 = [], [], [], [], 0
    for f in FLOES:
        P = G[(f['seed'] * 11 + 3) % len(G)]
        edge = floe_outline(f) - np.array(f['c'])
        top = f['top']
        # nur knapp unter die Wasserlinie (ein Körper darunter schimmerte im Spielwasser als Schlieren)
        q = np.concatenate([np.linspace(0.0, 0.92, 12), [0.97, 1.0, 1.0, 0.9]])
        z = np.concatenate([np.full(12, top), [top * 0.8, top * 0.3, -0.12, -0.12]])
        tp = np.concatenate([np.ones(12), [0.6, 0.2, 0.0, 0.0]])
        X = f['c'][0] + q[:, None] * edge[None, :, 0]
        Y = f['c'][1] + q[:, None] * edge[None, :, 1]
        upper = tp[:, None] > 0.9
        Z = WATER + z[:, None] + (0.15 * fbm(P, X / 2.0, Y / 2.0, 4) + 0.04 * fbm(P, X / 0.6, Y / 0.6, 2)) * upper
        Z = Z + 0.05 * fbm(P, X * 1.7, Y * 1.7, 3) * (~upper & (tp[:, None] > 0.1))   # angeschlagener Rand
        if f['ridge']:
            deg, hgt = f['ridge']
            n = np.array([math.cos(math.radians(deg)), -math.sin(math.radians(deg))])
            dist = (X - f['c'][0]) * n[0] + (Y - f['c'][1]) * n[1]
            Z = Z + hgt * np.exp(-(dist / 0.7) ** 2) * (0.55 + 0.45 * fbm(P, X / 0.8, Y / 0.8, 3) * 2) * upper
        deg, tilt = f['tilt']
        if tilt:
            d = np.array([math.sin(math.radians(deg)), math.cos(math.radians(deg))])
            Z = Z + math.tan(math.radians(tilt)) * ((X - f['c'][0]) * d[0] + (Y - f['c'][1]) * d[1])
            Z[-2:] = WATER - 0.12   # Unterseite flach knapp unter Wasser, auch bei geneigten (nichts tiefer)
        V = np.stack([X, Y, Z], -1).reshape(-1, 3)
        nr, nc = X.shape
        i = np.arange(nr - 1)[:, None] * nc; j = np.arange(nc)[None]
        a = i + j; b = i + (j + 1) % nc
        Vs.append(V); Fs.append(np.stack([a, b, b + nc, a + nc], -1).reshape(-1, 4) + n0)
        tops.append(np.repeat(tp, nc)); snows.append(np.full(len(V), f['snow'])); n0 += len(V)
    me = make_mesh('Schollen', np.concatenate(Vs), np.concatenate(Fs))
    S.attrs(me, top=np.concatenate(tops), snowy=np.concatenate(snows))
    log('Eisschollen', len(FLOES))
    return me


def water_box(half=1500.0, depth=30.0):
    """Wasser als geschlossener Körper (für die Trübung im Volumen): oben der Seespiegel"""
    x = np.array([-half, half, half, -half] * 2); y = np.array([-half, -half, half, half] * 2)
    z = np.array([WATER] * 4 + [WATER - depth] * 4)
    F = np.array([[0, 1, 2, 3], [7, 6, 5, 4], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]])
    return make_mesh('See', np.stack([x, y, z], -1), F, smooth=False)


TEMPLATES = 16


def pebble(seed):
    """Rund geschliffener Stein mit Höhe 1: eine verbeulte, flache Kugel"""
    import bmesh
    rng = np.random.default_rng(seed)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=3, radius=0.5)
    V = np.array([v.co[:] for v in bm.verts]); F = [[v.index for v in f.verts] for f in bm.faces]
    bm.free()
    k = 1 + 0.10 * np.sin(V @ rng.normal(size=3) * 4 + rng.uniform(0, 6)) + 0.06 * np.sin(V @ rng.normal(size=3) * 7)
    V = V * k[:, None] * np.array([rng.uniform(1.0, 1.6), rng.uniform(0.8, 1.2), rng.uniform(0.45, 0.8)])
    V[:, 2] -= V[:, 2].min(); V /= V[:, 2].max()
    return V, F


def ice_lump(seed):
    """Abgestürzter Eisblock mit Höhe 1: ein Felsblock des Strands, unterteilt und geglättet (abgeschmolzene Kanten),
    leicht verbeult"""
    import bmesh
    V, F, _ = S.boulder(seed)
    rng = np.random.default_rng(seed + 7)
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in V]
    for f in F:
        try:
            bm.faces.new([vs[i] for i in f])
        except ValueError:
            pass
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=3, use_grid_fill=True)
    melted = seed % 2 == 1          # abgeschmolzen (rund) oder frisch gebrochen (Kanten bleiben)
    for _ in range(3 if melted else 1):
        bmesh.ops.smooth_vert(bm, verts=bm.verts[:], factor=0.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    V = np.array([v.co[:] for v in bm.verts]); F = [[v.index for v in f.verts] for f in bm.faces]
    bm.free()
    # Relief: Beulen und kleine Mulden vom Abschmelzen, feine Narben
    c = V.mean(0); out = V - c
    out /= np.maximum(np.linalg.norm(out, axis=-1, keepdims=True), 1e-6)
    P = G[seed % len(G)]
    bump = 0.05 * fbm(P, V[:, 0] * 2.5 + V[:, 2], V[:, 1] * 2.5 - V[:, 2], 3) + 0.015 * fbm(P, V[:, 0] * 9, V[:, 1] * 9 + V[:, 2] * 5, 2)
    V = V + out * bump[:, None] * (1.0 if melted else 0.5)
    V[:, 2] -= V[:, 2].min(); V /= V[:, 2].max()
    return V, F


def templates(name, mat, seed, kind='kantig', flat=None):
    """Vorlagen: kantig (Felsblöcke des Strands), rund (Kiesel) oder eis (abgeschmolzene Blöcke); 'gemischt': jede
    dritte kantig"""
    coll = S.collection(name, exclude=True)
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    for k in range(TEMPLATES):
        sharp = kind == 'kantig' or (kind == 'gemischt' and k % 3 == 0)
        V, F = ice_lump(seed + k) if kind == 'eis' else S.boulder(seed + k)[:2] if sharp else pebble(seed + k)
        if flat is not None and k % 2:
            V = V * np.array([1.2, 1.1, flat])
        nm = '%s%02d' % (name[:1].lower(), k)
        me = S.mesh(nm, V, F, mats=[mat])
        if sharp:
            me.set_sharp_from_angle(angle=math.radians(25))
        S.attrs(me, tone=np.full(len(V), np.random.default_rng(seed + k).random()))
        link(nm, me, coll)
    return coll


# grosse abgestürzte Eisblöcke: Richtung (Grad), Anteil des Wandradius, Grösse (m)
BIG_BLOCKS = [(55, 0.83, 10.0), (70, 0.9, 6.5), (148, 0.78, 8.0), (188, 0.62, 7.5), (250, 0.86, 12.0),
              (300, 0.66, 5.5), (322, 0.88, 7.0),
              (22, 0.8, 4.5), (36, 0.68, 3.5), (96, 0.8, 5.0), (122, 0.86, 6.0), (166, 0.7, 4.0), (198, 0.86, 5.5),
              (276, 0.8, 6.5), (288, 0.9, 4.0), (342, 0.74, 4.5)]


def shore_xy(rng, n, inner, outer, power):
    """Punkte auf dem Ufer: zwischen Seerand + inner und Wand − outer, zum Wasser dichter (power > 1)"""
    th = rng.uniform(0, 2 * np.pi, n)
    rl, rw = lake_radius(th), wall_radius(th)
    r = rl + inner + rng.random(n) ** power * (rw - rl - inner - outer)
    return r * np.sin(th), r * np.cos(th)


def scatter_points(seed=31):
    """Eis: wenige grosse Blöcke mit Trümmern darum, kleine Stücke am Ufer, einige im Seichten. Steine: Kiesel zum Wasser
    hin dicht, Geröll und Felsbrocken zur Wand hin; an den Bächen mehr"""
    rng = np.random.default_rng(seed)
    out = {}
    free = lambda x, y, z, m: ~in_any_passage(np.stack([x, y, z], -1), m)
    P, Sz = [], []
    for deg, q, size in BIG_BLOCKS:
        th = math.radians(deg)
        r = float(wall_radius(np.array(th))) * q
        cx, cy = r * math.sin(th), r * math.cos(th)
        P.append([cx, cy, float(floor_height(np.array(cx), np.array(cy))[0]) - 0.3 * size]); Sz.append(size)
        m = 16
        a = rng.uniform(0, 2 * np.pi, m); d = size * rng.uniform(0.7, 1.8, m)
        x, y = cx + d * np.cos(a), cy + d * np.sin(a)
        s = size * np.clip(rng.lognormal(-1.8, 0.6, m), 0.04, 0.35)
        z, _, _ = floor_height(x, y)
        P += np.stack([x, y, z - 0.3 * s], -1).tolist(); Sz += s.tolist()
    x, y = shore_xy(rng, 220, 1.0, 6.0, 0.8)              # überall am Ufer verstreut
    s = np.clip(rng.lognormal(-0.5, 0.55, 220), 0.25, 2.2)
    z, _, _ = floor_height(x, y)
    P += np.stack([x, y, z - 0.3 * s], -1).tolist(); Sz += s.tolist()
    x, y = shore_xy(rng, 60, -3.0, 40.0, 1.0)              # im seichten Wasser, halb untergetaucht
    s = np.clip(rng.lognormal(-0.5, 0.45, 60), 0.4, 1.6)
    z, _, _ = floor_height(x, y)
    P += np.stack([x, y, np.maximum(z, WATER - 0.6 * s) - 0.2 * s], -1).tolist(); Sz += s.tolist()
    x, y = shore_xy(rng, 300, -0.5, 4.0, 1.4)            # kleine Eisstücke, vom Wasser angespült
    s = np.clip(rng.lognormal(-1.8, 0.5, 300), 0.08, 0.4)
    z, _, _ = floor_height(x, y)
    P += np.stack([x, y, z - 0.3 * s], -1).tolist(); Sz += s.tolist()
    P, Sz = np.array(P), np.array(Sz)
    keep = free(P[:, 0], P[:, 1], np.full(len(P), WATER), 1.05)
    out['ice'] = (P[keep], Sz[keep])
    # Kiesel, dazu feiner Grus an der Wasserlinie
    x, y = shore_xy(rng, 60000, -1.5, 2.0, 1.6)
    s = np.clip(rng.lognormal(-2.3, 0.55, len(x)), 0.03, 0.35)
    xg, yg = shore_xy(rng, 25000, -1.0, 2.0, 3.0)
    x, y = np.concatenate([x, xg]), np.concatenate([y, yg])
    s = np.concatenate([s, np.clip(rng.lognormal(-3.2, 0.4, len(xg)), 0.02, 0.08)])
    z, _, _ = floor_height(x, y)
    out['pebble'] = (np.stack([x, y, z - 0.3 * s], -1), s)
    # Geröll und Felsbrocken; an den Bächen mehr (auch in den Gängen)
    x1, y1 = shore_xy(rng, 9000, -0.5, 2.0, 1.0)
    s1 = np.clip(rng.lognormal(-0.9, 0.6, len(x1)), 0.15, 1.2)
    x2, y2 = shore_xy(rng, 400, 3.0, 4.0, 0.5)
    s2 = np.clip(rng.lognormal(0.2, 0.45, len(x2)), 0.8, 3.2)
    xs, ys, ss = [x1, x2], [y1, y2], [s1, s2]
    for Pg in PASSAGES:
        d, nrm = frame(Pg)
        a0, a1 = passage_ends(Pg)
        a = rng.uniform(lake_radius(np.array(math.radians(Pg['deg']))) - 4, a1 - (2 if Pg['open'] else 25), 1500)
        cx, z0, w, h, sec = section(Pg, a)
        c = cx + rng.normal(0, 0.45, len(a)) * w
        xs.append(a * d[0] + c * nrm[0]); ys.append(a * d[1] + c * nrm[1])
        ss.append(np.clip(rng.lognormal(-1.4, 0.7, len(a)), 0.06, 1.0))
    x, y, s = np.concatenate(xs), np.concatenate(ys), np.concatenate(ss)
    z, _, _ = floor_height(x, y)
    keep = (z > WATER - 0.6 * s) | (rng.random(len(z)) < 0.25)
    out['rock'] = (np.stack([x, y, z - 0.3 * s], -1)[keep], s[keep])
    # draussen vor dem Mundloch Moränengeröll, im Blick durch den Ausgang (ein Kegel), zur Ferne hin grösser
    Pg = PASSAGES[0]; d, nrm = frame(Pg); a0, a1 = passage_ends(Pg)
    m = 2600
    a = a1 + 4 + 750 * rng.random(m) ** 1.8
    c = (rng.random(m) * 2 - 1) * (25 + (a - a1) * 0.45)
    x, y = a * d[0] + c * nrm[0], a * d[1] + c * nrm[1]
    s = np.clip(rng.lognormal(-0.6, 0.6, m) * (1 + (a - a1) / 150), 0.2, 6.0)
    z, _, _ = floor_height(x, y)
    out['moraine'] = (np.stack([x, y, z - 0.3 * s], -1), s)
    # Steine, die im schmutzigen Eis unten an der Wand stecken (halb herausgeschmolzen)
    V, lift = CAVE['Kuppel']
    zf, _, _ = floor_height(V[:, 0], V[:, 1])
    base = np.nonzero((basal(V) > 0.5) & (V[:, 2] > zf + 0.3) & (V[:, 2] < zf + 6.0) & ~in_any_passage(V, 1.1))[0]
    pick = rng.choice(base, 160, replace=False)
    s = np.clip(rng.lognormal(-0.4, 0.55, 160), 0.3, 2.2)
    outw = V[pick] * np.array([1.0, 1.0, 0.0])
    outw /= np.maximum(np.linalg.norm(outw, axis=-1, keepdims=True), 1e-6)
    out['wall'] = (V[pick] + outw * 0.35 * s[:, None] - np.array([0, 0, 0.5]) * s[:, None], s)
    return out


def build_scatter():
    ice = templates('Eisvorlagen', mat_ice_block(), 3100, 'eis', flat=ICE_FLAT)
    rock = templates('Steinvorlagen', mat_rock(), 3200, 'gemischt')
    pebbles = templates('Kieselvorlagen', bpy.data.materials['Stein'], 3300, 'rund')
    pts = scatter_points()
    rng = np.random.default_rng(5)
    for name, key, coll in (('Eisbloecke', 'ice', ice), ('Steine', 'rock', rock), ('Kiesel', 'pebble', pebbles),
                            ('Wandsteine', 'wall', rock), ('Moraene', 'moraine', rock)):
        pos, s = pts[key]
        m = len(pos)
        scl = s[:, None] * np.stack([rng.uniform(1.0, 1.6, m), rng.uniform(0.8, 1.3, m), rng.uniform(0.5, 1.0, m)], -1)
        rot = np.stack([rng.normal(0, 0.3, m), rng.normal(0, 0.3, m), rng.uniform(0, 2 * np.pi, m)], -1)
        var = rng.integers(TEMPLATES, size=m)
        if key == 'ice':   # kein Eis ganz unter Wasser (13.11.2026: Wunsch des Nutzers); ungerade Vorlagen 0,6 hoch
            up = pos[:, 2] + np.where(var % 2 == 1, ICE_FLAT, 1.0) * scl[:, 2] > WATER + 0.1
            pos, scl, rot, var = pos[up], scl[up], rot[up], var[up]
        me = S.points(name, pos, var, scl, rot)
        ob = link(name, me)
        ob.modifiers.new(name, 'NODES').node_group = S.instancer(name + ' verteilen', coll)
        log(name, len(pos))


def icicle_points(seed=37):
    """Eiszapfen an echten Ecken der Netze: am Bogen des Mundlochs (aussen, wo es tropft), am Beginn des Tunnels, in
    der Öffnung des Schachts und in Reihen an sieben Rissen der Decke; unter den Rissen Eis-Stalagmiten auf dem Kies.
    Zurück: Zapfen (Orte, Längen), Stalagmiten (Orte, Höhen)"""
    rng = np.random.default_rng(seed)
    P, L = [], []
    V, PS = CAVE['Tunnel']
    for row, n, ln in ((V.shape[0] - 4, 170, (0.5, 0.7)), (int(V.shape[0] * 0.2), 40, (0.2, 0.5))):
        cols = np.nonzero((PS[row] > 0.35) & (PS[row] < np.pi - 0.35))[0]
        pick = rng.choice(cols, n)
        P.append(V[row + rng.integers(-2, 3, n), pick] + np.array([0, 0, 0.3]))
        L.append(np.clip(rng.lognormal(*ln, n), 0.3, 7.0))
    V, lift = CAVE['Kuppel']
    shaft = np.nonzero((lift > FUNNEL * 0.6) & (lift < FUNNEL * 0.9))[0]
    pick = rng.choice(shaft, 70, replace=False)
    P.append(V[pick] + np.array([0, 0, 0.3])); L.append(np.clip(rng.lognormal(0.3, 0.5, 70), 0.4, 3.5))
    roof = np.nonzero((V[:, 2] > WATER + 24) & (lift < 0.1) & ~in_any_passage(V, 1.1))[0]
    drips = []
    for c in rng.choice(roof, 7, replace=False):       # je ein Riss: Zapfen in einer Reihe
        u = np.array([math.cos(rng.uniform(0, np.pi)), 0.0, 0.0]); u[1] = math.sqrt(1 - u[0] ** 2)
        d = V[roof] - V[c]
        along = d @ u
        near = roof[(np.abs(along) < 6) & (np.linalg.norm(d - np.outer(along, u), axis=-1) < 0.8)]
        pick = rng.choice(near, min(14, len(near)), replace=False)
        P.append(V[pick] + np.array([0, 0, 0.3])); L.append(np.clip(rng.lognormal(0.0, 0.5, len(pick)), 0.3, 2.5))
        drips.append(V[pick[:5], :2] + rng.normal(0, 0.8, (len(pick[:5]), 2)))
    xy = np.concatenate(drips)
    zf, _, _ = floor_height(xy[:, 0], xy[:, 1])
    dry = zf > WATER + 0.05
    sp = np.column_stack([xy[dry], zf[dry] - 0.05])
    return (np.concatenate(P), np.concatenate(L)), (sp, np.clip(rng.lognormal(-0.8, 0.5, len(sp)), 0.2, 1.2))


def build_icicles():
    """Eiszapfen als Instanzen einer Vorlage (Drehkörper, Spitze unten), dieselbe umgedreht für die Stalagmiten"""
    coll = S.collection('Zapfenvorlage', exclude=True)
    for ob in list(coll.objects):
        bpy.data.objects.remove(ob)
    t = np.linspace(0, 1, 14)
    prof = (1 - t) ** 1.6 * (1 + 0.15 * np.sin(t * 25))
    a = np.linspace(0, 2 * np.pi, 10, endpoint=False)
    V = np.stack([np.outer(prof, np.cos(a)), np.outer(prof, np.sin(a)), np.repeat(-t[:, None], 10, 1)], -1).reshape(-1, 3)
    i = np.arange(len(t) - 1)[:, None] * 10; j = np.arange(10)[None]
    F = np.stack([i + j, i + (j + 1) % 10, i + 10 + (j + 1) % 10, i + 10 + j], -1).reshape(-1, 4)
    me = make_mesh('z00', V, F)
    me.materials.append(mat_icicle())
    link('z00', me, coll)
    (P, L), (SP, SH) = icicle_points()
    rng = np.random.default_rng(8)
    for name, pos, ln, flip, thick in (('Zapfen', P, L, 0.0, (0.08, 0.14)),
                                       ('Stalagmiten', SP, SH, math.pi, (0.25, 0.4))):
        w = ln * rng.uniform(*thick, len(ln))
        scl = np.stack([w, w, ln], -1)
        rot = np.stack([flip + rng.normal(0, 0.05, len(pos)), rng.normal(0, 0.05, len(pos)),
                        rng.uniform(0, 2 * np.pi, len(pos))], -1)
        me = S.points(name, pos, np.zeros(len(pos), int), scl, rot)
        ob = link(name, me)
        ob.modifiers.new(name, 'NODES').node_group = S.instancer(name + ' verteilen', coll)
        log(name, len(pos))


def build_outside():
    """draussen vor dem Mundloch: Berge am Horizont (die Schotterebene ist Teil des Bodens)"""
    R = np.geomspace(1500, 6000, 50)
    A = np.linspace(0, 2 * np.pi, 1024, endpoint=False)
    X = R[:, None] * np.sin(A)[None]; Y = R[:, None] * np.cos(A)[None]
    ridge = 1 - np.abs(fbm(G[16], X / 2200, Y / 2200, 5) * 2.0)
    Z = WATER + 900 * np.clip(ridge, 0, None) ** 1.7 * smoothstep(1500, 2200, R)[:, None]
    nr, nc = X.shape
    i = np.arange(nr - 1)[:, None] * nc; j = np.arange(nc)[None]
    a = i + j; b = i + (j + 1) % nc
    F = np.stack([a, b, b + nc, a + nc], -1).reshape(-1, 4)
    me = make_mesh('Berge', np.stack([X, Y, Z], -1).reshape(-1, 3), F)
    # Fels sehr dunkel: draussen ist alles hell belichtet (die Höhle braucht es), ein mittleres Grau wurde fast weiss
    me.materials.append(mat_outside('Berge', (0.86, 0.9, 0.95), (0.022, 0.024, 0.03), WATER + 600))
    link('Berge', me)


# ---------------------------------------------------------------- Himmel, Licht

SKY_GAIN = 0.12      # Himmel gegenüber der Sonnenlampe (wie die Wüste)
SUN_STRENGTH = 3.6
SUN_COLOR = (1.0, 0.96, 0.90)
TUNNEL_LIGHT = 5.0e5  # Himmelslicht durch den Tunnel (W, Flächenlampe am Mundloch, nach innen)


def world():
    w = bpy.data.worlds.new('Tag'); sc().world = w; w.use_nodes = True
    t = NT(w.node_tree)
    out = t.node('ShaderNodeOutputWorld')
    bg = t.node('ShaderNodeBackground', in_Strength=SKY_GAIN)
    tc = t.node('ShaderNodeTexCoord')
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(t.vmath('NORMALIZE', tc.outputs['Generated']), sep.inputs[0])
    cz = t.node('ShaderNodeCombineXYZ')
    t.link(sep.outputs['X'], cz.inputs['X']); t.link(sep.outputs['Y'], cz.inputs['Y'])
    t.link(t.math('MAXIMUM', sep.outputs['Z'], 0.003), cz.inputs['Z'])
    sky = t.node('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'; sky.sun_disc = False
    sky.sun_elevation = math.radians(SUN_EL); sky.sun_rotation = math.atan2(SUN.x, SUN.y)
    sky.altitude = 800.0; sky.air_density = 0.9; sky.aerosol_density = 0.6
    t.link(t.vmath('NORMALIZE', cz.outputs[0]), sky.inputs['Vector'])
    t.link(sky.outputs['Color'], bg.inputs['Color'])
    t.link(bg.outputs[0], out.inputs[0])
    return w


def lights():
    ld = bpy.data.lights.new('Sonne', 'SUN')
    ld.energy = SUN_STRENGTH; ld.color = SUN_COLOR; ld.angle = math.radians(1.5)
    ob = link('Sonne', ld)
    ob.rotation_euler = SUN.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    # nur draussen (Light Linking): durch den Schacht über dem Brett fiele sonst ihr Fleck in die Höhle
    coll = bpy.data.collections.get('Sonnenlicht') or bpy.data.collections.new('Sonnenlicht')
    for name in ('Ebene', 'Berge', 'Moraene'):
        if bpy.data.objects[name].name not in coll.objects:
            coll.objects.link(bpy.data.objects[name])
    ob.light_linking.receiver_collection = coll
    # Flächenlampe für das Himmelslicht knapp vor dem Mundloch und grösser als es: Es schneidet ihre Form zu (im See
    # spiegelt sich die Öffnung, nicht der Rand einer Lampe)
    P = PASSAGES[0]
    d, _ = frame(P)
    cx, z0, w, h, s = section(P, np.array(passage_ends(P)[1]))
    ld = bpy.data.lights.new('Himmel Tunnel', 'AREA'); ld.shape = 'RECTANGLE'
    ld.size = float(w) * 2.6; ld.size_y = float(h) * 1.8; ld.energy = TUNNEL_LIGHT; ld.color = (0.80, 0.90, 1.0)
    ob = link('Himmel Tunnel', ld)
    m = mouth(P, -3.0)
    ob.location = (m[0], m[1], float(z0) + float(h) * 0.5)
    ob.rotation_euler = Vector((-d[0], -d[1], 0.0)).to_track_quat('-Z', 'Y').to_euler()   # leuchtet in die Halle
    ob.visible_camera = False   # spiegelt sich aber im nassen Eis: helle Sicheln auf den Kanten der Mulden


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
    build_cave()
    lights()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


PARTS = ['Kuppel', 'Tunnel', 'Gang', 'Boden', 'Ebene', 'See', 'Schollen', 'Eisbloecke', 'Steine', 'Kiesel',
         'Wandsteine', 'Moraene', 'Zapfen', 'Stalagmiten', 'Berge', 'Sonne', 'Himmel Tunnel']
OLD_PARTS = ['Schacht', 'Saeulen', 'Lichtstrahl', 'Himmel Loch', 'Brett Spiegel', 'Treibeis']   # aus früheren Runden


def replace_cave():
    """Alles neu ausser den Kameras und dem Himmel"""
    _remove(PARTS + OLD_PARTS)
    bpy.data.orphans_purge(do_recursive=True)    # sonst bleiben alte Netze und das Rendern wird langsam
    for ld in [l for l in bpy.data.lights if l.users == 0]:
        bpy.data.lights.remove(ld)
    build_cave()
    lights()


def kamera_abstand(top, r=45.6, lift=4.2, cell=1.0):
    """Kleinster Abstand der Kamera zum Gewölbe über ihr (m) entlang ihrer ganzen Bahn: Handy im Würfel ganz
    herausgezoomt (r: Abstand zum Blickpunkt, lift: seine Höhe; Desktop und 2D liegen tiefer), alle Richtungen, Neigung
    0,22 … 1,42 (cameraStop in index.html mit camera.top). Aus den Ecken der Halle in der offenen Szene: je Zelle von
    cell m die tiefste Ecke über 8 m, im Umkreis von 2 Zellen. Zurück: Abstand und wo (Spiel: phi, theta, Höhe)"""
    me = bpy.data.objects['Kuppel'].data
    V = np.empty(len(me.vertices) * 3, np.float32)
    me.vertices.foreach_get('co', V)
    V = V.reshape(-1, 3)
    V = V[V[:, 2] > 8.0]
    ix = np.floor(V[:, 0] / cell).astype(int); iy = np.floor(V[:, 1] / cell).astype(int)
    ox, oy = ix.min(), iy.min()
    grid = np.full((ix.max() - ox + 1, iy.max() - oy + 1), np.inf)
    np.minimum.at(grid, (ix - ox, iy - oy), V[:, 2])
    env = grid.copy()
    for dx in range(-2, 3):
        for dy in range(-2, 3):
            env = np.minimum(env, np.roll(np.roll(grid, dx, 0), dy, 1))
    T, P = np.meshgrid(np.radians(np.arange(0, 360, 2.0)), np.linspace(0.22, 1.42, 61))
    k = np.minimum(1.0, np.maximum(top - lift, 0.1 * r) / np.maximum(r * np.cos(P), 1e-6))
    gx, gz, gy = r * k * np.sin(P) * np.sin(T), r * k * np.sin(P) * np.cos(T), lift + r * k * np.cos(P)
    i = np.clip(np.floor(gx / cell).astype(int) - ox, 0, env.shape[0] - 1)
    j = np.clip(np.floor(-gz / cell).astype(int) - oy, 0, env.shape[1] - 1)
    gap = env[i, j] - gy                                  # Blender (x, y, z) = Spiel (x, −z, y)
    w = np.unravel_index(np.argmin(gap), gap.shape)
    return round(float(gap.min()), 2), dict(phi=round(float(P[w]), 2), theta=round(math.degrees(T[w])), hoehe=round(float(gy[w]), 1))


# Wasserkarte ums Brett: Zellen je Seite, halbe Breite (m; 0,5 m je Zelle). Ab 12 m vor ihrem Rand nimmt das Spiel
# offenes Wasser an (Strand: das Meer); der See (bis 54 m) muss samt Ufer davor liegen (Review: mit 64 lag es darin)
WATER_MAP = (320, 80.0)
WATER_FADE = (74.0, 79.0)     # ohne gl_FragDepth (WebGL1) zeichnet das Spiel das Wasser nur bis hier
SHORE_RANGE = (-64.0, 64.0)   # Abstand zur Wasserlinie (m, > 0 an Land)


def water_map():
    """Karten fürs Wasser im Spiel wie am Strand (szenen/beach/szene.py water_map; Zeile 0: Spiel-z = −extent, Spalte
    0: x = −extent), je 16 Bit in zwei Kanälen (hoch, tief): erste R/G Wassertiefe (−3 … 13 m; an Land negativ), B
    «Fels»: was aus dem Wasser ragt (Schollen, Eis, Steine und Kiesel im Seichten) – dort zieht die Tiefenregel das
    Panorama vor das Wasser des Spiels; zweite R/G Abstand zur Wasserlinie (grob: zum Rand des Sees), B 0 (keine nahen
    Felsgruppen). Eisblöcke, Steine und Kiesel aus den Punktwolken der offenen Szene"""
    n, ext = WATER_MAP
    c = (np.arange(n) + 0.5) / n * 2 * ext - ext
    GX, GZ = np.meshgrid(c, c)                                   # Spalte x, Zeile z (Spiel)
    BX, BY = GX, -GZ                                             # Blender
    z, _, _ = floor_height(BX, BY)
    depth = WATER - z
    shore = np.hypot(BX, BY) - lake_radius(np.arctan2(BX, BY))
    rock = np.zeros((n, n))
    for f in FLOES:                                              # Schollen: Punkt im Umriss (Windungszahl)
        poly = floe_outline(f)
        lo, hi = poly.min(0) - 1.0, poly.max(0) + 1.0            # nur im Rechteck um sie (Speicher)
        box = (BX >= lo[0]) & (BX <= hi[0]) & (BY >= lo[1]) & (BY <= hi[1])
        pts = np.stack([BX[box], BY[box]], -1)
        a = poly - pts[:, None]; b = np.roll(poly, -1, 0) - pts[:, None]
        ang = np.arctan2(a[..., 0] * b[..., 1] - a[..., 1] * b[..., 0], (a * b).sum(-1)).sum(1)
        rock[box] = np.maximum(rock[box], np.abs(ang) > np.pi)
    cell = 2 * ext / n
    # was aus dem Wasser ragt: Eis, Steine und Kiesel, deren Grund unter Wasser liegt und deren Oberkante darüber; Radius
    # aus der Vorlage (grösster Abstand einer Ecke von ihrer Achse) mal Streckung
    for name, coll in (('Eisbloecke', 'Eisvorlagen'), ('Steine', 'Steinvorlagen'),
                       ('Kiesel', 'Kieselvorlagen')):
        reach = []
        for k in range(TEMPLATES):
            tm = bpy.data.collections[coll].objects['%s%02d' % (coll[:1].lower(), k)].data
            tv = np.empty(len(tm.vertices) * 3, np.float32); tm.vertices.foreach_get('co', tv)
            reach.append(np.hypot(tv[0::3], tv[1::3]).max())
        me = bpy.data.objects[name].data
        P = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', P); P = P.reshape(-1, 3)
        sc_ = np.empty(len(me.vertices) * 3, np.float32); me.attributes['scl'].data.foreach_get('vector', sc_)
        sc_ = sc_.reshape(-1, 3)
        var = np.empty(len(me.vertices), np.int32); me.attributes['variant'].data.foreach_get('value', var)
        rad = np.maximum(np.array(reach)[var] * sc_[:, :2].max(1), cell * 0.6)
        zf, _, _ = floor_height(P[:, 0], P[:, 1])
        wet = (zf < WATER + 0.05) & (P[:, 2] + sc_[:, 2] > WATER)
        for (px, py, _), r in zip(P[wet], rad[wet]):
            j0, i0 = (px + ext) / cell - 0.5, (-py + ext) / cell - 0.5    # Spalte (x), Zeile (Spiel z = −y)
            k = int(math.ceil(r / cell)) + 1
            jj, ii = np.meshgrid(np.arange(int(j0) - k, int(j0) + k + 2), np.arange(int(i0) - k, int(i0) + k + 2))
            ok = (jj >= 0) & (jj < n) & (ii >= 0) & (ii < n) & (np.hypot(jj - j0, ii - i0) * cell <= r + cell * 0.5)
            rock[ii[ok], jj[ok]] = 1.0
    def bits(v):
        q = np.round(np.clip(v, 0, 1) * 65535).astype(np.int64)
        return (q >> 8) / 255.0, (q & 255) / 255.0
    dh, dl = bits((depth + 3) / 16)
    sh, sl = bits((shore - SHORE_RANGE[0]) / (SHORE_RANGE[1] - SHORE_RANGE[0]))
    return np.stack([dh, dl, rock], -1), np.stack([sh, sl, np.zeros((n, n))], -1)


def export(stil='icecave'):
    """sky/<stil>/ebenen.json für pack.mjs: die Karten fürs Wasser (Ebene waterSurface, calm)"""
    import json
    from wald_io import save_image
    sky = os.path.join(ROOT, 'sky', stil)
    os.makedirs(sky, exist_ok=True)
    main, shore = water_map()
    save_image(main, os.path.join(sky, 'water.png'))
    save_image(shore, os.path.join(sky, 'water_shore.png'))
    n, ext = WATER_MAP
    data = {'water': {'map': 'file:water.png', 'shore': 'file:water_shore.png', 'size': n, 'extent': ext,
                      'level': WATER, 'depthRange': [-3, 13], 'shoreRange': list(SHORE_RANGE), 'fade': list(WATER_FADE)}}
    with open(os.path.join(sky, 'ebenen.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, separators=(',', ':'))
    return {'wasser': n, 'fels': int(main[..., 2].sum())}
