# Baut die Blender-Szene „Noas Dorf bei Nacht“ (Skybox village, Kapitel «Im Dorf» von Noas Geschichte): hinter Noas
# Haus übt Noa mit der Taschenlampe. Erster Wurf, gemalt wie Strand, Vulkan und Wüste.
# Über den Blender-MCP: wald_mcp.neu('village') baut sie und speichert tools/blender/village.blend; einzelne Teile neu
# mit wald_mcp.scene('village').replace_…().
# Vorbild ist die Bühne des Prologs (index.html createStoryScene): ein Bergdorf in einer klaren Nacht, tiefes Indigo,
# warme Fenster, Kirchturm, Laternen am Weg, Bergwald, verschneite Gipfel, Sterne (die Milchstrasse des Prologs nicht).
# Aufbau: Das Brett schwebt über der Wiese hinter Noas Haus, auf einer Terrasse am Berghang. Das Haus steht gut 20 m
# hinter dem Brett (+y) und kehrt ihm die Rückseite zu: Hintertür mit Lampe, Fenster mit Läden, Holzstapel, Bank, ein
# Zaun um den Garten, ein Hochbeet, Kühe im Garten ums Brett. Das Spiel zeichnet Haus, Zaun, Hochbeet, Kühe (im Netz des
# Hauses) und die drei Nachbarhäuser selbst (Sammlung „Spiel“, bakedMesh): Aus dem Mittelpunkt des Panoramas gesehen
# lägen sie schräg, ihre Kanten rissen auf. Das Panorama zeigt dahinter das Dorf am Hang (ab 95 m:
# näher hochragende Formen rissen im Netz der Tiefe auf, PANO.dMax 88 m), den Kirchturm, den Laternenweg, rechts und
# hinten den Waldrand, links Noas Hügel, über dem Tal die Gipfel mit Schnee.
# Licht: kein Mond am Himmel, aber kühles Mondlicht von hinten links (MOON), dazu das warme Licht der Fenster.
# Koordinaten: Blender (x, y, z) = Spiel (x, −z, y). Brett im Ursprung, Panorama-Mittelpunkt (0, 0, 3).
import bpy, math, os, sys, time, importlib.util
import numpy as np
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from wald_lib import Perlin, fbm, ridged, smoothstep
from wald_scene import NT, instancer, poisson_grid


def _strand():
    """Baumodul der Strand-Szene (ohne Aufbau): Knotengruppen, Luft, Sammlungen, Backen"""
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
FLOOR = -4.0           # Wiese unter dem Brett
TERRACE = 28.0         # so weit (m, in Richtung +y) bleibt die Terrasse eben, dann fällt der Hang zum Tal
R_FAR = 95.0           # nichts, was hochragt, näher am Brett im Panorama (Netz der Tiefe nur bis 88 m echt)
EXTENT = 30000.0
G1, G2, G3, G4, G5 = (Perlin(s) for s in (301, 307, 311, 313, 317))

MOON_ELEV, MOON_AZ = 28.0, -100.0    # Mondlicht (Grad): von links (Streiflicht auf den Graten), der Mond selbst steht hinter dem Berg
MOON = Vector((math.sin(math.radians(MOON_AZ)) * math.cos(math.radians(MOON_ELEV)),
               math.cos(math.radians(MOON_AZ)) * math.cos(math.radians(MOON_ELEV)),
               math.sin(math.radians(MOON_ELEV)))).normalized()


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


def _at(az, d):
    return np.array([math.sin(math.radians(az)) * d, math.cos(math.radians(az)) * d])


# ---------------------------------------------------------------- Gelände

# Profil quer zum Hang (y, Höhe über FLOOR): Terrasse, sanfter Hang hinab zum Dorf (man sieht über die Dächer), steiler
# zum Talgrund, drüben die Gipfel; hinter dem Brett (−y) steigt der Hang in den Bergwald und zu den Gipfeln.
PROFILE = [(-9000, 1500), (-5000, 1150), (-2600, 800), (-1400, 470), (-700, 200), (-320, 64), (-150, 16), (-70, 2),
           (-30, 0), (TERRACE, 0), (40, -1.5), (60, -5.5), (90, -11), (150, -17), (250, -25), (400, -36), (550, -50),
           (750, -95), (1000, -180), (1300, -250), (1700, -275), (2100, -250), (2800, -60), (3600, 230), (5000, 600),
           (7000, 930), (12000, 1350), (40000, 1500)]
# Der Hang ist hohl (erst steiler, dann flacher): vom Brett aus sieht man über die Kante auf die Dächer des Dorfs.
VALLEY_BEND = 8000.0   # das Tal biegt sich seitlich weg (y-Versatz x² / VALLEY_BEND): links und rechts steigt der Hang
HILL = (-150.0, -25.0, 26.0, 105.0)   # Noas Hügel links: Mitte x, y, Höhe, Halbmesser (Kuppe weiter als R_FAR)


def _profile(y):
    py, pz = np.array([p[0] for p in PROFILE], float), np.array([p[1] for p in PROFILE], float)
    sig = 6.0 + 0.07 * np.abs(y)
    k = np.array([-2, -1, 0, 1, 2], float); w = np.exp(-k ** 2 / 2); w /= w.sum()
    return sum(wi * np.interp(y + ki * sig, py, pz) for ki, wi in zip(k, w))


GARDEN = (0.0, 2.0, 24.0, 31.0)   # Garten mit Noas Haus: Mitte x, y, Halbachsen (m); darin liegt die Wiese genau auf
                                  # FLOOR (Haus, Bank, Holzstapel und Zaun stehen so auf dem Boden, nichts versinkt)


def garden_flat(x, y):
    gx, gy, ax, ay = GARDEN
    e = np.sqrt(((x - gx) / ax) ** 2 + ((y - gy) / ay) ** 2)
    return 1 - smoothstep(1.0, 1.5, e)


def height_raw(x, y):
    """Höhe (Blender z) ohne Abflachung um Häuser"""
    x = np.asarray(x, float); y = np.asarray(y, float)
    r = np.hypot(x, y)
    z = _profile(y - x * x / VALLEY_BEND)
    # Rippen und Rinnen am Hang: nah sehr sanft (das Dorf bleibt sichtbar), fern Gebirge
    near = smoothstep(55.0, 400.0, r)
    z = z + near * (fbm(G1, x / 420.0, y / 420.0, 4) * (2.5 + 0.004 * r + 0.035 * np.maximum(r - 600.0, 0)))
    # Gebirge: breite Stöcke mit Graten (ridged), wenige Spitzen; nah am Dorf flacher
    mount = smoothstep(1500.0, 4500.0, r)
    z = z + mount * (ridged(G2, x / 3600.0, y / 3600.0, 5) ** 1.7 * 980.0 - 200.0)   # schärfere Grate
    z = z + smoothstep(900.0, 3000.0, r) * np.maximum(fbm(G3, x / 1700.0 + 3, y / 1700.0, 3), 0) * 420.0
    flat = 1 - garden_flat(x, y)
    hx, hy, hh, hr = HILL
    z = z + flat * hh * np.exp(-((x - hx) ** 2 + (y - hy) ** 2) / (2 * (hr * 0.5) ** 2))
    # Terrasse: kleine Wellen der Wiese (nicht im Garten)
    z = z + flat * (1 - near) * fbm(G4, x / 22.0, y / 22.0, 2) * 0.35
    return FLOOR + z


def ring_grid(radii, nseg):
    """Ecken (x, y) auf Ringen um das Brett, Flächen dazwischen (Vierecke), dazu ein Fächer in der Mitte"""
    a = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
    R, A = np.meshgrid(radii, a, indexing='ij')
    X = (R * np.sin(A)).ravel(); Y = (R * np.cos(A)).ravel()
    nr = len(radii)
    i, j = np.meshgrid(np.arange(nr - 1), np.arange(nseg), indexing='ij')
    j1 = (j + 1) % nseg
    F = np.stack([i * nseg + j, i * nseg + j1, (i + 1) * nseg + j1, (i + 1) * nseg + j], -1).reshape(-1, 4)
    return X, Y, F


# Weg vom Hintertürchen im Zaun über die Wiese hinauf auf Noas Hügel, und um das Haus herum hinab ins Dorf
PATH_HILL = [(-3.4, 20.6), (-5.5, 16.0), (-10.0, 11.5), (-15.8, 8.5), (-26.0, 5.0), (-48.0, -2.0), (-80.0, -12.0),
             (-115.0, -22.0), (-148.0, -27.0)]
PATH_VILLAGE = [(4.8, 22.5), (9.5, 30.0), (14.0, 42.0), (22.0, 62.0), (34.0, 88.0), (52.0, 112.0), (62.0, 140.0),
                (60.0, 175.0), (70.0, 215.0), (100.0, 248.0), (140.0, 290.0), (160.0, 340.0)]
GARDEN_BED = (7.5, 11.0, 2.6, 1.6)    # Gemüsebeet: Mitte x, y, halbe Breite, halbe Tiefe (m)


def _dist_polyline(x, y, pts):
    P = np.array(pts, float)
    d = np.full(np.shape(x), 1e9)
    for (ax, ay), (bx, by) in zip(P[:-1], P[1:]):
        vx, vy = bx - ax, by - ay
        t = np.clip(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy), 0, 1)
        d = np.minimum(d, np.hypot(x - ax - t * vx, y - ay - t * vy))
    return d


def ground_attrs(x, y, z):
    """Bodenbedeckung je Ecke: path (Weg), bed (Beet), forest (Waldboden), rock (Fels), snow"""
    path = 1 - smoothstep(0.55, 1.15, np.minimum(_dist_polyline(x, y, PATH_HILL), _dist_polyline(x, y, PATH_VILLAGE))
                          * (1 + 0.004 * np.hypot(x, y)))
    bx, by, bw, bh = GARDEN_BED
    bed = (1 - smoothstep(-0.1, 0.15, np.abs(x - bx) - bw)) * (1 - smoothstep(-0.1, 0.15, np.abs(y - by) - bh))
    f = forest_mask(x, y)
    # Steilheit über die Differenz benachbarter Höhen (grob)
    e = 2.0 + 0.01 * np.hypot(x, y)
    gx = (height_raw(x + e, y) - height_raw(x - e, y)) / (2 * e)
    gy = (height_raw(x, y + e) - height_raw(x, y - e)) / (2 * e)
    slope = np.hypot(gx, gy)
    rock = smoothstep(0.75, 1.15, slope + 0.25 * fbm(G5, x / 140.0, y / 140.0, 3))
    snow_line = 640.0 + 160.0 * fbm(G5, x / 600.0 + 9, y / 600.0, 3)
    snow = smoothstep(snow_line - 60, snow_line + 60, z - FLOOR) * (1 - smoothstep(1.1, 1.6, slope))
    return {'path': path, 'bed': bed, 'forest': f * (1 - rock), 'rock': rock * (1 - snow), 'snow': snow}


NSEG = 1440   # Ecken je Ring


def terrain_mesh():
    radii = np.concatenate([np.linspace(0.0, 60.0, 121)[1:], np.geomspace(60.4, EXTENT, 520)])
    X, Y, F = ring_grid(radii, NSEG)
    X = np.concatenate([[0.0], X]); Y = np.concatenate([[0.0], Y]); F = F + 1
    fan = np.stack([np.zeros(NSEG, int), (np.arange(NSEG) + 1) % NSEG + 1, np.arange(NSEG) + 1], -1)   # nach oben
    Z = height(X, Y)
    me = bpy.data.meshes.new('Gelaende')
    V = np.stack([X, Y, Z], -1)
    me.vertices.add(len(V)); me.vertices.foreach_set('co', V.astype(np.float32).ravel())
    quads, tris = F, fan
    me.loops.add(quads.size + tris.size)
    me.loops.foreach_set('vertex_index', np.concatenate([tris.ravel(), quads.ravel()]).astype(np.int32))
    starts = np.concatenate([np.arange(0, tris.size, 3), tris.size + np.arange(0, quads.size, 4)]).astype(np.int32)
    me.polygons.add(len(starts)); me.polygons.foreach_set('loop_start', starts)
    me.update(calc_edges=True)
    me.shade_smooth()
    for k, v in ground_attrs(X, Y, Z).items():
        at = me.attributes.new(k, 'FLOAT', 'POINT'); at.data.foreach_set('value', v.astype(np.float32))
    return me


# ---------------------------------------------------------------- Häuser des Dorfs (Panorama)

def village_plan(seed=5):
    """Häuser am Hang: (x, y, Breite, Tiefe, Traufhöhe, Drehung, Holz 0/1, Anteil heller Fenster); dazu die Kirche.
    Alle weiter als R_FAR vom Brett, frei vom Weg, nicht zu dicht."""
    rng = np.random.default_rng(seed)
    out = []
    tries = 0
    while len(out) < 64 and tries < 40000:
        tries += 1
        if rng.random() < 0.65:   # Kern um die Kirche
            x, y = CHURCH[0] + rng.normal(0, 55), CHURCH[1] + rng.normal(0, 40)
        else:
            x, y = _at(rng.uniform(-78, 82), R_FAR + 4 + rng.gamma(2.0, 60.0))
        az, d = math.degrees(math.atan2(x, y)), math.hypot(x, y)
        if d > 480 or d < R_FAR + 4 or not -80 < az < 84:
            continue
        if _dist_polyline(np.array([x]), np.array([y]), PATH_VILLAGE)[0] < 7.5:
            continue
        if math.hypot(x - CHURCH[0], y - CHURCH[1]) < 26:
            continue
        w, dp = rng.uniform(8.0, 13.0), rng.uniform(7.0, 10.0)
        if any(math.hypot(x - o[0], y - o[1]) < 0.55 * (w + o[2]) + 2 for o in out):
            continue
        out.append((x, y, w, dp, rng.uniform(4.6, 7.0), math.radians(rng.normal(0, 12)), int(rng.random() < 0.55),
                    rng.uniform(0.5, 0.9)))
    return out


CHURCH = (40.0, 150.0)    # Kirche: Mitte des Schiffs; der Turm steht davor (Seite zum Brett)


def _box(V, F, M, c, size, rot, z0, z1, mat):
    """Quader (Grundriss um c, Drehung rot um z) von z0 bis z1"""
    cx, cy = c; hw, hd = size[0] / 2, size[1] / 2
    ca, sa = math.cos(rot), math.sin(rot)
    base = len(V)
    for z in (z0, z1):
        for dx, dy in ((-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)):
            V.append((cx + dx * ca - dy * sa, cy + dx * sa + dy * ca, z))
    for f in ((0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (4, 5, 6, 7)):
        F.append(tuple(base + i for i in f)); M.append(mat)


def place(V, F, M, v, f, m, x, y, z0, rot):
    """Netz in eigenen Koordinaten (v, f, m) gedreht (rot, Bogenmass) und verschoben an (x, y, z0) anhängen"""
    ca, sa = math.cos(rot), math.sin(rot)
    b = len(V)
    V.extend([(x + px * ca - py * sa, y + px * sa + py * ca, z0 + pz) for px, py, pz in v])
    F.extend([tuple(i + b for i in fc) for fc in f]); M.extend(m)


CHURCH_ROT = math.radians(75.0)   # Längsachse des Schiffs: der Turm steht am Ende zum Brett hin
CHURCH_TOWER = (-12.2, 0.0)       # Turm in eigenen Koordinaten der Kirche
CHURCH_HEIGHT = 26.0              # Turm bis zum Gesims, darüber der Helm


def church_place():
    """Lage der Kirche: Mitte x, y, Boden z0 (höchster Punkt unter Schiff und Turm), Sockeltiefe, Turm in der Welt"""
    x, y = CHURCH
    ca, sa = math.cos(CHURCH_ROT), math.sin(CHURCH_ROT)
    pts = [(px, py) for px in (-15.0, -9.5, 0.0, 10.5) for py in (-6.0, 6.0)]
    cz = [_ground(x + px * ca - py * sa, y + px * sa + py * ca) for px, py in pts]
    tx, ty = CHURCH_TOWER
    return x, y, max(cz), max(cz) - min(cz) + 0.8, (x + tx * ca - ty * sa, y + tx * sa + ty * ca)


def church_local(socket):
    """Kirche in eigenen Koordinaten (Boden z = 0): Schiff mit Steinsockel, Gesims, hohen Spitzbogenfenstern (warm
    erleuchtet) und steilem Dach; Turm mit Eckquadern, Tür, Schlitzfenstern, Zifferblättern, Schallfenstern mit
    Lamellen, Gesims, achteckigem Helm und Kreuz. Materialien wie das Dorf (12 Kirche, 13 Helm, 14 Uhr, 15 Kreuz)."""
    V, F, M = [], [], []
    L, B, H = 20.0, 11.0, 9.0
    _box(V, F, M, (0.0, 0.0), (L, B), 0.0, -socket, H, 12)
    _box(V, F, M, (0.0, 0.0), (L + 0.3, B + 0.3), 0.0, -socket, 0.8, 8)
    _box(V, F, M, (0.0, 0.0), (L + 0.24, B + 0.24), 0.0, H - 0.3, H, 8)
    pitch = 42.0; tp = math.tan(math.radians(pitch))
    rise = tp * (B / 2 + 0.12)
    for sx in (-1, 1):
        xg = sx * (L / 2 + 0.12)
        _quad(V, F, M, [(xg, -B / 2 - 0.12, H), (xg, B / 2 + 0.12, H), (xg, 0.0, H + rise)], 12, (sx, 0, 0))
    ov, ovg, th = 0.7, 0.5, 0.25
    hw = L / 2 + 0.12 + ovg
    ze, zr = H - ov * tp, H + rise
    up = (math.sin(math.radians(pitch)), math.cos(math.radians(pitch)))
    for s_ in (-1, 1):
        ye = s_ * (B / 2 + 0.12 + ov)
        top = [(-hw, ye, ze + th), (hw, ye, ze + th), (hw, 0.0, zr + th), (-hw, 0.0, zr + th)]
        bot = [(-hw, ye, ze), (hw, ye, ze), (hw, 0.0, zr), (-hw, 0.0, zr)]
        _quad(V, F, M, top, 2, (0, s_ * up[0], up[1]))
        _quad(V, F, M, bot, 1, (0, -s_ * up[0], -up[1]))
        _quad(V, F, M, [bot[0], bot[1], top[1], top[0]], 1, (0, s_, 0))
        _quad(V, F, M, [bot[0], bot[3], top[3], top[0]], 1, (-1, 0, 0))
        _quad(V, F, M, [bot[1], bot[2], top[2], top[1]], 1, (1, 0, 0))
    # Spitzbogenfenster auf beiden Längsseiten, dazu ein Rundfenster im Giebel über dem Chor
    for s_ in (-1, 1):
        for xx in (-6.0, -1.5, 3.0, 7.5):
            yy = s_ * B / 2
            frame = [(xx - 0.85, yy + s_ * 0.02, 2.6), (xx + 0.85, yy + s_ * 0.02, 2.6), (xx + 0.85, yy + s_ * 0.02, 6.1),
                     (xx, yy + s_ * 0.02, 7.0), (xx - 0.85, yy + s_ * 0.02, 6.1)]
            glass = [(xx - 0.65, yy + s_ * 0.04, 2.8), (xx + 0.65, yy + s_ * 0.04, 2.8), (xx + 0.65, yy + s_ * 0.04, 6.0),
                     (xx, yy + s_ * 0.04, 6.75), (xx - 0.65, yy + s_ * 0.04, 6.0)]
            _quad(V, F, M, frame, 8, (0, s_, 0))
            _quad(V, F, M, glass, 3, (0, s_, 0))
            _quad(V, F, M, [(xx - 0.03, yy + s_ * 0.06, 2.8), (xx + 0.03, yy + s_ * 0.06, 2.8),
                            (xx + 0.03, yy + s_ * 0.06, 6.7), (xx - 0.03, yy + s_ * 0.06, 6.7)], 11, (0, s_, 0))
            for zq in (4.0, 5.2):
                _quad(V, F, M, [(xx - 0.65, yy + s_ * 0.06, zq - 0.03), (xx + 0.65, yy + s_ * 0.06, zq - 0.03),
                                (xx + 0.65, yy + s_ * 0.06, zq + 0.03), (xx - 0.65, yy + s_ * 0.06, zq + 0.03)], 11, (0, s_, 0))
    rose = [(L / 2 + 0.14, 1.0 * math.cos(a), H + 2.2 + 1.0 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 16, endpoint=False)]
    _quad(V, F, M, rose, 3, (1, 0, 0))
    # Turm
    T, TH = 5.4, CHURCH_HEIGHT
    tx, ty = CHURCH_TOWER
    _box(V, F, M, (tx, ty), (T, T), 0.0, -socket, TH, 12)
    _box(V, F, M, (tx, ty), (T + 0.3, T + 0.3), 0.0, -socket, 1.0, 8)
    for qx in (-1, 1):
        for qy in (-1, 1):
            _box(V, F, M, (tx + qx * (T / 2 - 0.2), ty + qy * (T / 2 - 0.2)), (0.46, 0.46), 0.0, 1.0, TH, 8)
    _box(V, F, M, (tx, ty), (T + 0.5, T + 0.5), 0.0, TH - 0.4, TH, 8)
    _box(V, F, M, (tx, ty), (T + 0.3, T + 0.3), 0.0, 15.6, 15.9, 8)    # Gurt unter der Uhr

    def side(fn):
        """fn(P, out) je Turmseite; P(a, z, off): Punkt auf der Seite (a entlang, off nach aussen)"""
        for out in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            if out[0]:
                P = lambda a, z, off, o=out: (tx + o[0] * (T / 2 + off), ty + a, z)
            else:
                P = lambda a, z, off, o=out: (tx + a, ty + o[1] * (T / 2 + off), z)
            fn(P, (out[0], out[1], 0))
    def openings(P, out):
        # Schallfenster mit Rahmen und Lamellen
        _quad(V, F, M, [P(-0.85, 20.3, 0.02), P(0.85, 20.3, 0.02), P(0.85, 23.2, 0.02), P(0.0, 23.9, 0.02),
                        P(-0.85, 23.2, 0.02)], 8, out)
        _quad(V, F, M, [P(-0.65, 20.5, 0.04), P(0.65, 20.5, 0.04), P(0.65, 23.1, 0.04), P(0.0, 23.65, 0.04),
                        P(-0.65, 23.1, 0.04)], 4, out)
        for zl in (21.0, 21.6, 22.2, 22.8):
            _quad(V, F, M, [P(-0.65, zl - 0.06, 0.06), P(0.65, zl - 0.06, 0.06), P(0.65, zl + 0.06, 0.06),
                            P(-0.65, zl + 0.06, 0.06)], 1, out)
        # Zifferblatt mit Zeigern
        ring = [P(1.0 * math.cos(a), 18.0 + 1.0 * math.sin(a), 0.03) for a in np.linspace(0, 2 * math.pi, 20, endpoint=False)]
        _quad(V, F, M, ring, 8, out)
        disc = [P(0.85 * math.cos(a), 18.0 + 0.85 * math.sin(a), 0.05) for a in np.linspace(0, 2 * math.pi, 20, endpoint=False)]
        _quad(V, F, M, disc, 14, out)
        _quad(V, F, M, [P(-0.04, 18.0, 0.07), P(0.04, 18.0, 0.07), P(0.04, 18.6, 0.07), P(-0.04, 18.6, 0.07)], 4, out)
        _quad(V, F, M, [P(0.0, 17.96, 0.07), P(0.45, 17.7, 0.07), P(0.48, 17.76, 0.07), P(0.0, 18.04, 0.07)], 4, out)
        # Schlitzfenster
        for zs in (7.0, 11.5):
            _quad(V, F, M, [P(-0.18, zs, 0.03), P(0.18, zs, 0.03), P(0.18, zs + 1.3, 0.03), P(-0.18, zs + 1.3, 0.03)], 4, out)
    side(openings)
    # Tür im Turm (zum Brett hin, −x), mit Steinrahmen und Stufe
    P = lambda a, z, off: (tx - T / 2 - off, ty + a, z)
    _quad(V, F, M, [P(-1.05, 0.0, 0.03), P(1.05, 0.0, 0.03), P(1.05, 2.9, 0.03), P(0.0, 3.8, 0.03), P(-1.05, 2.9, 0.03)], 8, (-1, 0, 0))
    _quad(V, F, M, [P(-0.8, 0.0, 0.05), P(0.8, 0.0, 0.05), P(0.8, 2.8, 0.05), P(0.0, 3.5, 0.05), P(-0.8, 2.8, 0.05)], 7, (-1, 0, 0))
    _box(V, F, M, (tx - T / 2 - 0.6, ty), (1.2, 2.6), 0.0, -0.5, 0.15, 8)
    # Achteckiger Helm und Kreuz
    R, HH = T / 2 + 0.2, 12.0
    base_ = [(tx + R * math.cos(a), ty + R * math.sin(a), TH) for a in np.linspace(0, 2 * math.pi, 8, endpoint=False) + math.pi / 8]
    apex = (tx, ty, TH + HH)
    for i in range(8):
        a_, b_ = base_[i], base_[(i + 1) % 8]
        mid = ((a_[0] + b_[0]) / 2 - tx, (a_[1] + b_[1]) / 2 - ty, 0.3)
        _quad(V, F, M, [a_, b_, apex], 13, mid)
    _beam(V, F, M, (tx, ty, TH + HH - 0.3), (tx, ty + 0.001, TH + HH + 1.7), 0.1, 0.1, 15)
    _beam(V, F, M, (tx, ty - 0.5, TH + HH + 1.1), (tx, ty + 0.5, TH + HH + 1.1), 0.1, 0.1, 15)
    return V, F, M


def village_mesh(seed=9):
    """Die Häuser des Dorfs, gebaut wie die Nachbarn (chalet), und die Kirche"""
    rng = np.random.default_rng(seed)
    V, F, M = [], [], []
    tone = []
    for (x, y, w, d, eave, rot, wood, lit) in village_plan():
        ca, sa = math.cos(rot), math.sin(rot)
        cz = [_ground(x + dx * ca - dy * sa, y + dx * sa + dy * ca) for dx in (-w / 2 - 1.5, w / 2 + 1.5)
              for dy in (-d / 2 - 1.5, d / 2 + 1.5)]
        z0 = max(cz)
        near = math.hypot(x, y) < 300.0
        v, f, m, _ = chalet(w, d, z0 - min(cz) + 0.6, eave, wood, lit, rng, pitch=rng.uniform(24, 32),
                            stone=rng.random() < 0.3, red=rng.random() < 0.4, balcony=wood and near and rng.random() < 0.55)
        n0 = len(V)
        place(V, F, M, v, f, m, x, y, z0, rot)
        tone.extend([rng.random()] * (len(V) - n0))
    x, y, z0, socket, _ = church_place()
    n0 = len(V)
    v, f, m = church_local(socket)
    place(V, F, M, v, f, m, x, y, z0, CHURCH_ROT)
    tone.extend([0.5] * (len(V) - n0))
    mats = [mat_plaster(), shared('Haus Holz', mat_wood), shared('Haus Dach', mat_roof_near),
            shared('Fenster hell', mat_window_lit), shared('Fenster dunkel', mat_window_dark),
            shared('Haus Laeden', mat_shutter), shared('Holzstapel', mat_logs), shared('Haus Tuer', mat_door),
            shared('Haus Stein', mat_stone), shared('Laeden rot', lambda: _principled('Laeden rot', (0.30, 0.05, 0.04))),
            shared('Geranien', mat_geranium), shared('Sprossen', lambda: _principled('Sprossen', (0.46, 0.44, 0.39))),
            mat_church(), mat_spire(), mat_clock(), mat_cross()]
    me = S.mesh('Dorf', V, F, M, mats=mats, smooth=False)
    at = me.attributes.new('tone', 'FLOAT', 'POINT'); at.data.foreach_set('value', np.array(tone, np.float32))
    log('Dorf', len(F), 'Flächen')
    return me


def lantern_points():
    """Laternen am Weg ins Dorf, erst ab R_FAR"""
    P = np.array(PATH_VILLAGE, float)
    seg = np.hypot(*np.diff(P, axis=0).T); s = np.concatenate([[0], np.cumsum(seg)])
    out = []
    for t in np.arange(0, s[-1], 24.0):
        i = min(np.searchsorted(s, t, 'right') - 1, len(seg) - 1)
        q = P[i] + (P[i + 1] - P[i]) * (t - s[i]) / seg[i]
        n = np.array([-(P[i + 1] - P[i])[1], (P[i + 1] - P[i])[0]]) / seg[i]
        q = q + n * 1.6
        if np.hypot(*q) > R_FAR:
            out.append((float(q[0]), float(q[1])))
    return out


# ---------------------------------------------------------------- Wald

def forest_mask(x, y):
    """1 im Wald: rechts und hinter dem Brett ab dem Waldrand, links hinter Noas Hügel, über dem Dorf erst weit draussen,
    am Gegenhang bis zur Baumgrenze; nicht im Dorf, nicht auf der Wiese, nicht auf Noas Hügel"""
    x = np.asarray(x, float); y = np.asarray(y, float)
    r = np.hypot(x, y)
    az = np.degrees(np.arctan2(x, y))
    n = fbm(G3, x / 90.0, y / 90.0, 3)
    edge = R_FAR + 12 + 30 * fbm(G4, x / 60.0 + 4, y / 60.0, 2)
    open_ = smoothstep(-95.0, -82.0, az) * (1 - smoothstep(70.0, 84.0, az))   # Sektor von Wiese und Dorf
    hx, hy, _, hr = HILL
    hill = np.exp(-((x - hx) ** 2 + (y - hy) ** 2) / (2 * (0.6 * hr) ** 2))
    near = smoothstep(edge - 4, edge + 4, r) * (1 - open_) * (1 - smoothstep(0.25, 0.55, hill))
    far = smoothstep(560.0, 700.0, r) * smoothstep(-0.2, 0.15, n) * open_
    m = np.maximum(near, far) * smoothstep(-0.45, -0.2, n)                     # Lichtungen
    hz = height_raw(x, y) - FLOOR
    tree_line = 470.0 + 80.0 * fbm(G5, x / 500.0, y / 500.0, 2)
    return np.clip(m, 0, 1) * (1 - smoothstep(tree_line - 80, tree_line, hz))


def fir_mesh(seed):
    """Tanne der Höhe 1 wie in der Bühne des Prologs: Stamm und vier Stufen aus Kegeln mit gezacktem Rand"""
    rng = np.random.default_rng(seed)
    V, F, M = [], [], []
    n = 14
    a = np.linspace(0, 2 * np.pi, n, endpoint=False) + rng.uniform(0, 1)
    # Stamm
    b = len(V)
    for z, r in ((-0.05, 0.035), (0.35, 0.02)):
        V.extend([(r * math.cos(t), r * math.sin(t), z) for t in a[::2]])
    k = n // 2
    for i in range(k):
        F.append((b + i, b + (i + 1) % k, b + k + (i + 1) % k, b + k + i)); M.append(0)
    tiers = [(0.10, 0.42, 0.30), (0.32, 0.62, 0.24), (0.52, 0.82, 0.17), (0.70, 1.00, 0.10)]
    w = rng.uniform(0.85, 1.1)
    for z0, z1, R in tiers:
        b = len(V)
        for t in a:
            rr = R * w * rng.uniform(0.78, 1.08)
            V.append((rr * math.cos(t), rr * math.sin(t), z0 + rng.uniform(-0.02, 0.025)))
        V.append((rng.normal(0, 0.01), rng.normal(0, 0.01), z1))
        for i in range(n):
            F.append((b + i, b + (i + 1) % n, b + n)); M.append(1)
        F.append(tuple(b + i for i in range(n))[::-1]); M.append(1)
    return S.mesh('fir%02d' % seed, V, F, M, smooth=False)


def tree_points(seed=13):
    rng = np.random.default_rng(seed)
    pos, scl, rot, var = [], [], [], []
    for r0, r1, g in ((R_FAR, 700.0, 4.6), (700.0, 2200.0, 9.0)):
        P = poisson_grid(rng, r1, g)
        r = np.hypot(P[:, 0], P[:, 1])
        P = P[(r >= r0) & (r < r1)]
        m = forest_mask(P[:, 0], P[:, 1])
        P = P[rng.random(len(P)) < m]
        z = height_raw(P[:, 0], P[:, 1])
        h = rng.uniform(13.0, 26.0, len(P)) * (1 if r0 < 500 else 1.25)
        pos.append(np.c_[P, z - 0.3]); scl.append(np.c_[h * rng.uniform(0.85, 1.15, len(P)), h * rng.uniform(0.85, 1.15, len(P)), h])
        rot.append(np.c_[rng.normal(0, 0.03, len(P)), rng.normal(0, 0.03, len(P)), rng.uniform(0, 6.3, len(P))])
        var.append(rng.integers(0, 6, len(P)))
    # einzelne Bäume im Dorf und am Rand der Wiese (weiter als R_FAR)
    pts = []
    while len(pts) < 70:
        az, d = rng.uniform(-100, 120), rng.uniform(R_FAR + 5, 420)
        x, y = _at(az, d)
        if _dist_polyline(np.array([x]), np.array([y]), PATH_VILLAGE)[0] > 5 and \
                all(math.hypot(x - h[0], y - h[1]) > 0.7 * h[2] + 3 for h in VILLAGE):
            pts.append((x, y))
    P = np.array(pts)
    z = height_raw(P[:, 0], P[:, 1])
    h = rng.uniform(9.0, 18.0, len(P))
    pos.append(np.c_[P, z - 0.3]); scl.append(np.c_[h, h, h]); rot.append(np.c_[np.zeros((len(P), 2)), rng.uniform(0, 6.3, len(P))])
    var.append(rng.integers(0, 6, len(P)))
    pos, scl, rot, var = (np.concatenate(a) for a in (pos, scl, rot, var))
    log('Tannen', len(pos))
    return pos, scl, rot, var


def build_trees():
    coll = S.collection('Tannenvorlagen', exclude=True)
    needles, bark = mat_needles(), mat_bark()
    for k in range(6):
        me = fir_mesh(100 + k)
        me.materials.append(bark); me.materials.append(needles)
        link('t%02d' % k, me, coll)
    pos, scl, rot, var = tree_points()
    me = bpy.data.meshes.new('Tannenpunkte')
    me.vertices.add(len(pos)); me.vertices.foreach_set('co', pos.astype(np.float32).ravel())
    for name, kind, arr in (('variant', 'INT', var.astype(np.int32)), ('rot', 'FLOAT_VECTOR', rot), ('scl', 'FLOAT_VECTOR', scl)):
        at = me.attributes.new(name, kind, 'POINT')
        at.data.foreach_set('vector' if kind == 'FLOAT_VECTOR' else 'value',
                            arr.astype(np.float32 if kind != 'INT' else np.int32).ravel())
    ob = link('Tannen', me)
    ob.modifiers.new('Verteilen', 'NODES').node_group = bpy.data.node_groups.get('Tannen verteilen') or instancer('Tannen verteilen', coll)


# ---------------------------------------------------------------- Noas Haus (das Spiel zeichnet es, bakedMesh)

HOUSE = (-3.0, 25.25)        # Mitte des Grundrisses
HOUSE_SIZE = (11.5, 8.5)     # Breite (x), Tiefe (y)
STONE_TOP = 2.9              # Steinsockel bis hier über FLOOR, darüber Holz bis EAVE
EAVE = 5.5
PITCH = 28.0
# Fenster der Rückseite (zum Brett): x-Mitte, Geschoss (0 unten, 1 oben), hell. Die Wand reicht von x = −8.75 bis 2.75
BACK_WINDOWS = [(-7.2, 0, True), (-1.7, 0, True), (-7.0, 1, True), (-4.4, 1, False), (-1.7, 1, True), (1.3, 1, False)]
DOOR_X = -4.5
WOODPILE = (1.25, 2.4)       # Holzstapel unter dem Vordach: Mitte x, Breite
# Zaun rund um den Garten, von Hausecke zu Hausecke (Eckpunkte; dazwischen Pfosten höchstens POST_GAP auseinander)
FENCE = [(-8.9, 21.2), (-12.6, 16.2), (-15.35, 9.6), (-16.1, 7.6), (-17.8, 0.0), (-17.4, -9.0), (-14.0, -17.0),
         (-7.0, -21.5), (2.0, -23.0), (11.0, -21.0), (16.5, -13.0), (18.6, -2.0), (17.8, 9.0), (13.5, 17.5),
         (7.5, 20.6), (3.0, 21.2)]
GATE = 2        # zwischen diesem Eckpunkt und dem nächsten das Gartentor (der Weg auf den Hügel geht hindurch)
POST_GAP = 2.4
WIN_LIGHT = (1.0, 0.58, 0.26)


def _quad(V, F, M, pts, mat, out=None):
    """Vieleck; mit out (Richtung nach aussen) so umlaufend, dass seine Normale dorthin zeigt (das Spiel zeichnet nur
    Vorderseiten)"""
    if out is not None:
        P = np.array(pts, float)
        n = np.cross(P[1] - P[0], P[2] - P[0])
        if np.dot(n, out) < 0:
            pts = list(pts)[::-1]
    b = len(V); V.extend(pts); F.append(tuple(range(b, b + len(pts)))); M.append(mat)


def house_mesh():
    """Noas Haus mit Fenstern, Läden, Tür, Lampe, Holzstapel und Bank als ein Netz (Materialien: 0 Stein, 1 Holz,
    2 Dach, 3 Fenster hell, 4 Fenster dunkel, 5 Läden, 6 Holzstapel, 7 Tür)"""
    V, F, M = [], [], []
    cx, cy = HOUSE; w, d = HOUSE_SIZE
    yb = cy - d / 2                          # Rückwand (zum Brett)
    z0 = FLOOR - 0.6
    _box(V, F, M, HOUSE, (w, d), 0.0, z0, FLOOR + STONE_TOP, 0)
    _box(V, F, M, HOUSE, (w + 0.3, d + 0.3), 0.0, FLOOR + STONE_TOP, FLOOR + EAVE, 1)
    rise = math.tan(math.radians(PITCH)) * (d / 2 + 0.15)
    # Giebel aus Holz
    for sx in (-1, 1):
        xg = cx + sx * (w / 2 + 0.15)
        _quad(V, F, M, [(xg, yb - 0.15, FLOOR + EAVE), (xg, cy + d / 2 + 0.15, FLOOR + EAVE), (xg, cy, FLOOR + EAVE + rise)],
              1, (sx, 0, 0))
    # Dach mit Stärke: Oberseite, Unterseite, Traufkante, Ortgang
    ov, ovg, th = 1.25, 0.95, 0.28
    hw = w / 2 + 0.15 + ovg
    ze = FLOOR + EAVE - ov * math.tan(math.radians(PITCH))
    zr = FLOOR + EAVE + rise
    up = (math.sin(math.radians(PITCH)), math.cos(math.radians(PITCH)))
    for s in (-1, 1):   # s = −1: Dachfläche zum Brett
        ye = cy + s * (d / 2 + 0.15 + ov)
        top = [(cx - hw, ye, ze + th), (cx + hw, ye, ze + th), (cx + hw, cy, zr + th), (cx - hw, cy, zr + th)]
        bot = [(cx - hw, ye, ze), (cx + hw, ye, ze), (cx + hw, cy, zr), (cx - hw, cy, zr)]
        _quad(V, F, M, top, 2, (0, s * up[0], up[1]))
        _quad(V, F, M, bot, 1, (0, -s * up[0], -up[1]))
        _quad(V, F, M, [bot[0], bot[1], top[1], top[0]], 1, (0, s, 0))
        _quad(V, F, M, [bot[0], bot[3], top[3], top[0]], 1, (-1, 0, 0))
        _quad(V, F, M, [bot[1], bot[2], top[2], top[1]], 1, (1, 0, 0))
    # Kamin mit Abdeckung, Gurt zwischen Stein und Holz, Pfettenköpfe unter dem Giebel
    _box(V, F, M, (cx + 2.6, cy + 1.2), (0.8, 0.8), 0.0, zr - 1.0, zr + 1.3, 0)
    _box(V, F, M, (cx + 2.6, cy + 1.2), (1.02, 1.02), 0.0, zr + 1.3, zr + 1.42, 2)
    _box(V, F, M, HOUSE, (w + 0.42, d + 0.42), 0.0, FLOOR + STONE_TOP - 0.1, FLOOR + STONE_TOP + 0.1, 1)
    tp = math.tan(math.radians(PITCH))
    for sx in (-1, 1):
        for k in (-0.62, 0.0, 0.62):
            yk = cy + k * (d / 2 + 0.15)
            zk = zr - abs(yk - cy) * tp - 0.22
            _beam(V, F, M, (cx + sx * (w / 2 + 0.1), yk, zk), (cx + sx * (hw - 0.08), yk, zk), 0.2, 0.22, 1)
    # Fenster mit Rahmen und Läden auf der Rückseite
    yf = yb - 0.16
    for x, fl, lit in BACK_WINDOWS:
        ww, wh = (0.9, 1.1) if fl == 0 else (0.8, 1.0)
        zb = FLOOR + (1.0 if fl == 0 else STONE_TOP + 0.8)
        _quad(V, F, M, [(x - ww / 2 - 0.08, yf + 0.01, zb - 0.08), (x + ww / 2 + 0.08, yf + 0.01, zb - 0.08),
                        (x + ww / 2 + 0.08, yf + 0.01, zb + wh + 0.08), (x - ww / 2 - 0.08, yf + 0.01, zb + wh + 0.08)], 1, (0, -1, 0))
        _quad(V, F, M, [(x - ww / 2, yf, zb), (x + ww / 2, yf, zb), (x + ww / 2, yf, zb + wh), (x - ww / 2, yf, zb + wh)],
              3 if lit else 4, (0, -1, 0))
        for s in (-1, 1):   # Läden aufgeklappt
            x0 = x + s * (ww / 2 + 0.1); x1 = x0 + s * ww * 0.55
            pts = [(x0, yf - 0.02, zb), (x1, yf - 0.02, zb), (x1, yf - 0.02, zb + wh), (x0, yf - 0.02, zb + wh)]
            _quad(V, F, M, pts, 5, (0, -1, 0))
        _box(V, F, M, (x, yf - 0.12), (ww + 0.3, 0.25), 0.0, zb - 0.16, zb - 0.06, 1)   # Fensterbank
        # Sprossen, unter den hellen Fenstern Geranien im Kasten
        _quad(V, F, M, [(x - 0.03, yf - 0.01, zb), (x + 0.03, yf - 0.01, zb), (x + 0.03, yf - 0.01, zb + wh),
                        (x - 0.03, yf - 0.01, zb + wh)], 8, (0, -1, 0))
        zm = zb + wh * 0.58
        _quad(V, F, M, [(x - ww / 2, yf - 0.01, zm - 0.03), (x + ww / 2, yf - 0.01, zm - 0.03),
                        (x + ww / 2, yf - 0.01, zm + 0.03), (x - ww / 2, yf - 0.01, zm + 0.03)], 8, (0, -1, 0))
        if lit:
            _beam(V, F, M, (x - ww / 2, yf - 0.13, zb + 0.03), (x + ww / 2, yf - 0.13, zb + 0.03), 0.22, 0.18, 1)
            _beam(V, F, M, (x - ww / 2 - 0.06, yf - 0.13, zb + 0.2), (x + ww / 2 + 0.06, yf - 0.13, zb + 0.2), 0.3, 0.22, 9)
    # Tür mit Rahmen, Stufe, Lampe
    _quad(V, F, M, [(DOOR_X - 0.62, yf + 0.01, FLOOR - 0.02), (DOOR_X + 0.62, yf + 0.01, FLOOR - 0.02),
                    (DOOR_X + 0.62, yf + 0.01, FLOOR + 2.24), (DOOR_X - 0.62, yf + 0.01, FLOOR + 2.24)], 1, (0, -1, 0))
    _quad(V, F, M, [(DOOR_X - 0.5, yf, FLOOR), (DOOR_X + 0.5, yf, FLOOR), (DOOR_X + 0.5, yf, FLOOR + 2.1),
                    (DOOR_X - 0.5, yf, FLOOR + 2.1)], 7, (0, -1, 0))
    _box(V, F, M, (DOOR_X, yb - 0.35), (1.6, 0.7), 0.0, FLOOR - 0.3, FLOOR + 0.15, 0)   # Stufe
    _box(V, F, M, (DOOR_X + 0.85, yb - 0.25), (0.22, 0.22), 0.0, FLOOR + 2.25, FLOOR + 2.55, 3)   # Lampe
    # Holzstapel unter dem Vordach, Bank unter dem Fenster
    _box(V, F, M, (WOODPILE[0], yb - 0.45), (WOODPILE[1], 0.8), 0.0, FLOOR - 0.1, FLOOR + 1.7, 6)
    _box(V, F, M, (-1.7, yb - 0.45), (1.7, 0.42), 0.0, FLOOR + 0.42, FLOOR + 0.5, 1)
    for bx in (-2.4, -1.0):
        _box(V, F, M, (bx, yb - 0.45), (0.1, 0.36), 0.0, FLOOR - 0.1, FLOOR + 0.42, 1)
    # Giebelseiten: je ein Fenster oben, das linke hell
    for s, lit in ((-1, True), (1, False)):
        xg = cx + s * (w / 2 + 0.17)
        zb = FLOOR + STONE_TOP + 0.8
        pts = [(xg, cy - 0.45, zb), (xg, cy + 0.45, zb), (xg, cy + 0.45, zb + 1.0), (xg, cy - 0.45, zb + 1.0)]
        _quad(V, F, M, pts, 3 if lit else 4, (s, 0, 0))
        pts = [(xg, cy - 0.35, zb + 2.3), (xg, cy + 0.35, zb + 2.3), (xg, cy + 0.35, zb + 2.9), (xg, cy - 0.35, zb + 2.9)]
        _quad(V, F, M, pts, 4, (s, 0, 0))
    garden_bed(V, F, M)
    fence_mesh(V, F, M)
    return V, F, M


def _blob(V, F, M, c, r, mat, rng, n=7, m=4, rough=0.16, flat=0.55):
    """Unregelmässiger Klumpen (Kugel mit Zacken, unten abgeflacht): Salat, Kohl, Laub, Blüten"""
    cx, cy, cz = c
    rings = []
    for i in range(1, m):
        th = math.pi * i / m
        ring = []
        for j in range(n):
            ph = 2 * math.pi * j / n + rng.uniform(-0.25, 0.25)
            k = 1 + rng.uniform(-rough, rough)
            zz = math.cos(th) * (1 if math.cos(th) > 0 else flat)
            ring.append((cx + r[0] * k * math.sin(th) * math.cos(ph), cy + r[1] * k * math.sin(th) * math.sin(ph),
                         cz + r[2] * k * zz))
        rings.append(ring)
    top, bot = (cx, cy, cz + r[2]), (cx, cy, cz - r[2] * flat)
    c3 = np.array(c, float)
    def face(pts):
        _quad(V, F, M, pts, mat, np.mean(np.array(pts, float), 0) - c3)
    for j in range(n):
        j1 = (j + 1) % n
        face([top, rings[0][j], rings[0][j1]])
        for i in range(m - 2):
            face([rings[i][j], rings[i + 1][j], rings[i + 1][j1], rings[i][j1]])
        face([rings[-1][j], bot, rings[-1][j1]])


def garden_bed(V, F, M, seed=23):
    """Hochbeet in Noas Garten: Rahmen aus Brettern, Erde, Reihen mit Salat, Kohl und Rüebli, Bohnenstangen mit Laub,
    Ringelblumen am Rand (Materialien 10 Erde, 11 Salat, 12 Kohl, 13 Laub, 14 Ringelblume)"""
    rng = np.random.default_rng(seed)
    bx, by, hw, hd = GARDEN_BED
    t, h = 0.06, 0.34
    for (px, py), size in (((bx, by - hd), (2 * hw + 2 * t, t)), ((bx, by + hd), (2 * hw + 2 * t, t)),
                           ((bx - hw, by), (t, 2 * hd)), ((bx + hw, by), (t, 2 * hd))):
        _box(V, F, M, (px, py), size, 0.0, FLOOR - 0.1, FLOOR + h, 1)
    for qx in (-1, 1):   # Eckpfosten
        for qy in (-1, 1):
            _box(V, F, M, (bx + qx * hw, by + qy * hd), (0.1, 0.1), 0.0, FLOOR - 0.1, FLOOR + h + 0.06, 1)
    soil = FLOOR + h - 0.06
    _box(V, F, M, (bx, by), (2 * hw - 0.02, 2 * hd - 0.02), 0.0, FLOOR - 0.1, soil, 10)
    rows = [by - hd + 0.4, by - hd + 1.15, by + hd - 1.15, by + hd - 0.42]
    x0, x1 = bx - hw + 0.3, bx + hw - 0.3
    for xx in np.arange(x0, x1 + 0.01, 0.42):          # Salat
        _blob(V, F, M, (xx + rng.uniform(-0.04, 0.04), rows[0], soil + 0.07), (0.17, 0.17, 0.11), 11, rng, rough=0.22)
    for xx in np.arange(x0 + 0.05, x1 + 0.01, 0.58):   # Kohl
        _blob(V, F, M, (xx, rows[1], soil + 0.12), (0.24, 0.24, 0.17), 12, rng, rough=0.12)
    for xx in np.arange(x0, x1 + 0.01, 0.22):          # Rüebli: feines Kraut
        _blob(V, F, M, (xx, rows[2] + rng.uniform(-0.05, 0.05), soil + 0.1), (0.07, 0.07, 0.15), 13, rng, n=5, m=3, rough=0.3)
    for xx in np.arange(x0 + 0.1, x1 + 0.01, 0.55):    # Bohnenstangen, Ranken mit vielen kleinen Blättern
        top = (xx + rng.uniform(-0.05, 0.05), rows[3] + rng.uniform(-0.05, 0.05), soil + 1.75)
        _beam(V, F, M, (xx, rows[3], soil - 0.05), top, 0.035, 0.035, 1)
        for k in range(11):
            q = rng.uniform(0.08, 0.95)
            a = rng.uniform(0, 2 * math.pi); r_ = rng.uniform(0.05, 0.13)
            sz = rng.uniform(0.07, 0.11) * (1.15 - 0.5 * q)
            _blob(V, F, M, (xx + (top[0] - xx) * q + r_ * math.cos(a), rows[3] + r_ * math.sin(a), soil + 1.7 * q),
                  (sz, sz, sz * 0.8), 13, rng, n=5, m=3, rough=0.35)
    for xx in np.arange(bx - hw + 0.15, bx + hw - 0.1, 0.22):   # Ringelblumen vor dem Beet: Blattbüschel, darüber Blüten
        px = xx + rng.uniform(-0.06, 0.06); py = by - hd - 0.2 + rng.uniform(-0.06, 0.06)
        _blob(V, F, M, (px, py, FLOOR + 0.05), (0.1, 0.1, 0.08), 13, rng, n=6, m=3, rough=0.3)
        for k in range(rng.integers(1, 3)):
            _blob(V, F, M, (px + rng.uniform(-0.06, 0.06), py + rng.uniform(-0.06, 0.06), FLOOR + rng.uniform(0.15, 0.24)),
                  (0.055, 0.055, 0.035), 14, rng, n=6, m=3, rough=0.2)


def _ground(x, y):
    return float(height_raw(np.array([x]), np.array([y]))[0])


def _beam(V, F, M, a, b, w, h, mat):
    """Balken von a nach b (3D, auch schräg), Querschnitt w (waagrecht) × h (senkrecht)"""
    a = np.array(a, float); b = np.array(b, float)
    d = b - a
    sv = np.cross(d, (0.0, 0.0, 1.0))
    sv = sv / np.linalg.norm(sv) if np.linalg.norm(sv) > 1e-6 * np.linalg.norm(d) else np.array((1.0, 0.0, 0.0))
    u = np.cross(sv, d / np.linalg.norm(d)); u = u / np.linalg.norm(u) * h / 2   # waagrecht liegend: nach oben
    sv = sv * w / 2
    c = [a - sv - u, a + sv - u, a + sv + u, a - sv + u, b - sv - u, b + sv - u, b + sv + u, b - sv + u]
    for idx, out in (((0, 1, 2, 3), -d), ((4, 5, 6, 7), d), ((0, 1, 5, 4), -u), ((3, 2, 6, 7), u), ((1, 2, 6, 5), sv),
                     ((0, 3, 7, 4), -sv)):
        _quad(V, F, M, [tuple(c[i]) for i in idx], mat, out)


def fence_mesh(V, F, M):
    """Zaun: Pfosten auf dem Boden (je Pfosten seine Höhe), zwei Latten, die dem Boden folgen; beim Tor zwei höhere
    Pfosten, drei Latten und eine Strebe (geschlossen)"""
    P = np.array(FENCE, float)
    posts = []   # (Lage, Torpfosten)
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]
        n = 1 if i == GATE else max(1, int(math.ceil(np.linalg.norm(b - a) / POST_GAP)))
        for k in range(n):
            posts.append((a + (b - a) * k / n, i == GATE or (i == GATE + 1 and k == 0)))
    posts.append((P[-1], False))
    for q, gate in posts:
        z = _ground(*q)
        _box(V, F, M, tuple(q), (0.17, 0.17) if gate else (0.13, 0.13), 0.0, z - 0.4, z + (1.3 if gate else 1.15), 1)
    for (q0, g0), (q1, g1) in zip(posts[:-1], posts[1:]):
        z0, z1 = _ground(*q0), _ground(*q1)
        if g0 and g1:   # Tor
            for hz in (0.3, 0.7, 1.1):
                _beam(V, F, M, (*q0, z0 + hz), (*q1, z1 + hz), 0.06, 0.11, 1)
            _beam(V, F, M, (*q0, z0 + 0.3), (*q1, z1 + 1.1), 0.05, 0.09, 1)
        else:
            for hz in (0.5, 0.95):
                _beam(V, F, M, (*q0, z0 + hz), (*q1, z1 + hz), 0.06, 0.09, 1)


# ---------------------------------------------------------------- Kühe im Garten (im Netz von Noas Haus)

# Ein paar Kühe weiden im Garten rund ums Brett (Wunsch vom 10.11.2026: der Garten wirkte leer). Schweizer Rassen:
# Braunvieh (mausgrau-braun, dunkles Flotzmaul mit hellem Ring, helle Hörner mit dunkler Spitze) und Fleckvieh
# (rotbraun gefleckt, Kopf, Bauch und Beine weiss); die grossen tragen eine Glocke am Lederriemen. Rumpf, Hals und Kopf
# sind Metaballs (weich verschmolzen), Beine, Hörner, Ohren, Augen, Schwanz und Glocke eigene Formen. Die Kühe gehören
# zum Netz von Noas Haus und teilen sein Bild (ein eigenes sprengte die 300 MB Grafikspeicher des Dorfs), liegen darauf
# aber COW_TEXEL-mal dichter (Seitenlänge) als das Haus.
# Je Kuh: Ort x, y, Blickrichtung (Grad, 0 = +x, gegen den Uhrzeiger), Rasse, Haltung, Grösse, Zufall. Die Orte sind
# aus den Spielansichten gewählt (das Brett füllt das Bild fast): hinter dem Brett sieht man sie von oben und auf dem
# Handy, seitlich nah am Brett von oben und flach, vorne auf dem Handy
COWS = [(1.9, 10.6, 160.0, 'fleck', 'graze', 1.0, 1),
        (6.6, 3.6, 215.0, 'braun', 'stand', 1.0, 2),
        (-6.8, 3.4, 80.0, 'braun', 'lie', 1.0, 3),
        (1.4, -6.9, 190.0, 'fleck', 'graze', 0.96, 4),
        (3.6, -5.6, 205.0, 'fleck', 'calf', 0.62, 5)]
COW_TEXEL = 4.0
HOUSE_UV = 0.0070   # Dichte von Noas Haus auf seinem Bild (UV je m; 14 Texel je m bei 2048), wie vor den Kühen
COW_RES = 0.05    # Auflösung der Metaballs (m) bei Grösse 1
K_MB = 0.575      # Metaball allein (Steifheit 2, Schwelle 0.6): die Fläche liegt bei 0.575 · Radius
# Farben sRGB (in cow_mesh linear umgerechnet)
COW_BRAUN = {'fell': (0.49, 0.40, 0.32), 'dunkel': (0.36, 0.29, 0.23), 'hell': (0.62, 0.54, 0.45),
             'ring': (0.86, 0.83, 0.75), 'nase': (0.15, 0.14, 0.15), 'bein': (0.29, 0.24, 0.20),
             'huf': (0.08, 0.07, 0.065), 'quaste': (0.13, 0.11, 0.10)}
COW_FLECK = {'rot': (0.52, 0.25, 0.11), 'weiss': (0.80, 0.78, 0.74), 'maul': (0.74, 0.57, 0.52),
             'huf': (0.55, 0.47, 0.36)}
COW_HORN = ((0.86, 0.81, 0.68), (0.80, 0.74, 0.60), (0.55, 0.47, 0.38), (0.12, 0.10, 0.09))
COW_EYE = (0.025, 0.022, 0.024)
COW_UDDER = (0.66, 0.52, 0.49)
COW_STRAP = (0.16, 0.09, 0.05)


def _rot(axis, deg):
    from mathutils import Matrix
    return np.array(Matrix.Rotation(math.radians(deg), 3, axis))


def _srgb_lin(c):
    c = np.asarray(c, float)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def cow_parts(pose, calf=False):
    """Teile einer Kuh in eigenen Koordinaten (x nach vorn, y nach links, z nach oben, Boden z = 0): Metaballs
    [(art, tag, …)] – ('E', tag, Mitte, Halbachsen, Drehung 3×3) oder ('C', tag, a, b, Radius) –, eigene Formen
    [(art, tag, …)] – ('T', tag, Punkte, Radien, Farben je Ring oder None) Röhre, ('S', tag, Mitte, Halbachsen, Drehung)
    Ellipsoid –, dazu der Kopf (Genick H, Drehung R: Kopf-x zum Maul, Kopf-z zur Stirn), der Hals (a, b) für Riemen und
    Glocke und dz (so viel tiefer liegt der Rumpf, liegend)."""
    I = np.eye(3)
    lie = pose == 'lie'
    dz = -0.50 if lie else 0.0
    mb = [('E', 'body', (0.00, 0, 1.00), (0.62, 0.30, 0.33), I),
          ('E', 'body', (0.40, 0, 1.02), (0.36, 0.29, 0.36), I),
          ('E', 'body', (-0.46, 0, 1.06), (0.38, 0.29, 0.30), I),
          ('E', 'belly', (-0.02, 0, 0.88), (0.50, 0.38 if lie else 0.31, 0.30 if lie else 0.26), I),
          ('E', 'body', (0.42, 0, 1.24), (0.24, 0.15, 0.12), I),                 # Widerrist
          ('E', 'body', (-0.48, 0.20, 1.27), (0.10, 0.08, 0.07), I),             # Hüfthöcker
          ('E', 'body', (-0.48, -0.20, 1.27), (0.10, 0.08, 0.07), I),
          ('E', 'body', (-0.80, 0, 1.17), (0.10, 0.17, 0.15), I)]                # Sitzbein, Schwanzansatz
    mb = [(k, t, (c[0], c[1], c[2] + dz), s, R) for k, t, c, s, R in mb]
    ex = []
    if lie:
        mb += [('E', 'thigh', (-0.45, 0.27, 0.40), (0.32, 0.15, 0.24), I),
               ('E', 'leg', (0.42, 0.15, 0.24), (0.12, 0.09, 0.12), I), ('E', 'leg', (0.42, -0.15, 0.24), (0.12, 0.09, 0.12), I)]
        ex += [('T', 'leg', [(0.40, 0.16, 0.22), (0.60, 0.19, 0.09), (0.36, 0.22, 0.055), (0.24, 0.22, 0.055)],
                [0.085, 0.07, 0.05, 0.05], None),
               ('T', 'hoof', [(0.25, 0.22, 0.055), (0.15, 0.22, 0.05)], [0.055, 0.066], None),
               ('T', 'leg', [(0.40, -0.16, 0.22), (0.64, -0.17, 0.09), (0.92, -0.16, 0.055), (1.02, -0.16, 0.055)],
                [0.085, 0.07, 0.05, 0.05], None),
               ('T', 'hoof', [(1.01, -0.16, 0.055), (1.11, -0.16, 0.05)], [0.055, 0.066], None),
               ('T', 'leg', [(-0.62, 0.30, 0.24), (-0.80, 0.33, 0.10), (-0.45, 0.42, 0.055), (-0.30, 0.43, 0.055)],
                [0.09, 0.065, 0.05, 0.05], None),
               ('T', 'hoof', [(-0.31, 0.43, 0.055), (-0.21, 0.44, 0.05)], [0.055, 0.066], None),
               ('T', 'tail', [(-0.83, 0, 0.66), (-0.90, -0.10, 0.42), (-0.84, -0.24, 0.12), (-0.62, -0.34, 0.05)],
                [0.045, 0.035, 0.03, 0.025], None),
               ('S', 'tuft', (-0.48, -0.37, 0.045), (0.12, 0.045, 0.035), _rot('Z', -12))]
        H, pitch, yaw = np.array((0.94, 0.0, 0.88)), 32.0, 18.0
        neck = [((0.50, 0, 0.58), (0.84, 0, 0.75), 0.21), ((0.78, 0, 0.74), (0.92, 0, 0.84), 0.16)]
    else:
        mb += [('E', 'leg', (0.44, s * 0.16, 0.64), (0.10, 0.085, 0.22), I) for s in (1, -1)]
        mb += [('E', 'thigh', (-0.56, s * 0.155, 0.82), (0.22, 0.12, 0.30), I) for s in (1, -1)]
        if not calf:
            mb.append(('E', 'udder', (-0.36, 0, 0.64), (0.17, 0.15, 0.10), I))
        step = 0.07 if pose == 'graze' else 0.0
        for s, dx in ((1, step), (-1, -step * 0.4)):
            fx = 0.44 + dx
            ex += [('T', 'leg', [(fx, s * 0.16, 0.66), (fx + 0.01, s * 0.16, 0.40), (fx + 0.02, s * 0.155, 0.13),
                                 (fx + 0.05, s * 0.155, 0.075)], [0.085, 0.068, 0.05, 0.052], None),
                   ('T', 'hoof', [(fx + 0.05, s * 0.155, 0.085), (fx + 0.08, s * 0.155, -0.01)], [0.055, 0.068], None)]
        for s, dx in ((1, -0.03), (-1, 0.05 if pose == 'graze' else 0.0)):
            hx = -0.58 + dx
            ex += [('T', 'leg', [(hx, s * 0.16, 0.72), (hx - 0.08, s * 0.16, 0.46), (hx - 0.03, s * 0.155, 0.13),
                                 (hx, s * 0.155, 0.075)], [0.09, 0.065, 0.05, 0.052], None),
                   ('T', 'hoof', [(hx, s * 0.155, 0.085), (hx + 0.03, s * 0.155, -0.01)], [0.055, 0.068], None)]
        sway = 0.06 if pose == 'graze' else -0.04
        ex += [('T', 'tail', [(-0.80, 0, 1.28), (-0.90, 0, 1.12), (-0.93, sway * 0.4, 0.85), (-0.92, sway, 0.58)],
                [0.04, 0.03, 0.022, 0.02], None),
               ('S', 'tuft', (-0.92, sway * 1.1, 0.48), (0.045, 0.045, 0.12), I)]
        if pose == 'graze':
            H, pitch, yaw = np.array((1.08, 0.0, 0.66)), 78.0, -8.0
            neck = [((0.55, 0, 1.05), (0.90, 0, 0.84), 0.21), ((0.84, 0, 0.88), (1.03, 0, 0.71), 0.16)]
        else:
            H, pitch, yaw = np.array((1.02, 0.0, 1.36)), 40.0, 22.0
            neck = [((0.55, 0, 1.08), (0.92, 0, 1.22), 0.21), ((0.80, 0, 1.18), (0.98, 0, 1.30), 0.16)]
    for a, b, r in neck:
        mb.append(('C', 'neck', a, b, r))
    mb.append(('E', 'dewlap', tuple(np.add(neck[0][0], neck[0][1]) / 2 + (0.08, 0, -0.20)), (0.15, 0.05, 0.16), I))
    R = _rot('Z', yaw) @ _rot('Y', pitch)
    hs = 1.2 if calf else 1.0   # Kalb: grösserer Kopf

    def head(p):
        return tuple(H + R @ (np.array(p, float) * hs))
    mb += [('E', 'head', head((0.0, 0, 0.0)), tuple(np.array((0.15, 0.135, 0.135)) * hs), R),
           ('C', 'head', head((0.04, 0, -0.02)), head((0.30, 0, -0.04)), 0.095 * hs),
           ('E', 'muzzle', head((0.37, 0, -0.045)), tuple(np.array((0.085, 0.115, 0.085)) * hs), R),
           ('E', 'head', head((0.17, 0, -0.11)), tuple(np.array((0.15, 0.07, 0.06)) * hs), R),
           ('E', 'head', head((-0.04, 0, 0.07)), tuple(np.array((0.08, 0.13, 0.06)) * hs), R)]
    mb += [('E', 'head', head((0.10, s * 0.065, -0.08)), tuple(np.array((0.10, 0.065, 0.085)) * hs), R) for s in (1, -1)]
    for s in (1, -1):
        # Ohren waagrecht zur Seite, flach quer zum Gesicht, die Spitzen hängen etwas
        ex.append(('S', 'ear', head((-0.01, s * 0.20, 0.0)), tuple(np.array((0.028, 0.11, 0.055)) * hs * (1.15 if calf else 1)),
                   R @ _rot('X', s * -15.0)))
        if not calf:
            ex.append(('T', 'horn', [head((-0.02, s * 0.10, 0.09)), head((0.0, s * 0.17, 0.14)), head((0.05, s * 0.21, 0.21)),
                                     head((0.11, s * 0.20, 0.25))], [0.032, 0.025, 0.017, 0.006], COW_HORN))
    if calf:   # kürzerer Rumpf: hinten gestaucht, Brust, Hals und Kopf rücken unverändert nach (stetig bei x = 0.5)
        kx = lambda p: (p[0] * 0.88 if p[0] < 0.5 else p[0] - 0.06, *p[1:])
        mb = [(k, t, kx(p), q, r) if k == 'E' else (k, t, kx(p), kx(q), r) for k, t, p, q, r in mb]   # E: Mitte; C: a, b
        ex = [(k, t, [kx(p) for p in a], *r) if k == 'T' else (k, t, kx(a), *r) for k, t, a, *r in ex]
        H = np.array(kx(H)); neck = [(kx(a), kx(b), r) for a, b, r in neck]
    return mb, ex, (H, R, hs), neck[0][:2], dz


def _snap(V, target, center):
    """Ecke der Fläche V am nächsten bei target; dazu die Richtung von center (Achse innen) zu ihr"""
    i = np.argmin(np.linalg.norm(V - target, axis=1))
    n = V[i] - center
    return V[i], n / np.linalg.norm(n)


def _mb_field(mb, P):
    """Beitrag jedes Metaballs an den Punkten P (n × 3), wie Blender ihn rechnet ((1 − d²)³)"""
    out = np.zeros((len(mb), len(P)))
    for i, e in enumerate(mb):
        if e[0] == 'E':
            _, _, c, semi, R = e
            q = (P - np.array(c)) @ np.array(R) / (np.array(semi) / K_MB)
            d2 = (q * q).sum(1)
        else:
            _, _, a, b, r = e
            a, b = np.array(a, float), np.array(b, float)
            t = np.clip(((P - a) @ (b - a)) / ((b - a) @ (b - a)), 0, 1)
            d2 = (np.linalg.norm(P - (a + t[:, None] * (b - a)), axis=1) / (r / K_MB)) ** 2
        out[i] = np.where(d2 < 1, (1 - np.minimum(d2, 1)) ** 3, 0.0)
    return out


def _mb_mesh(name, mb, res):
    """Metaballs zu Ecken und Flächen (Koordinaten wie die Teile)"""
    from mathutils import Matrix
    data = bpy.data.metaballs.new(name)
    data.resolution = data.render_resolution = res
    data.threshold = 0.6
    for e in mb:
        if e[0] == 'E':
            _, _, c, semi, R = e
            el = data.elements.new(type='ELLIPSOID'); el.co = c; el.radius = 1.0
            el.size_x, el.size_y, el.size_z = (s / K_MB for s in semi)
            el.rotation = Matrix(np.asarray(R).tolist()).to_quaternion()
        else:
            _, _, a, b, r = e
            a, b = Vector(a), Vector(b)
            el = data.elements.new(type='CAPSULE'); el.co = (a + b) / 2; el.radius = r / K_MB
            el.size_x = (b - a).length / 2
            el.rotation = Vector((1, 0, 0)).rotation_difference(b - a)
    ob = bpy.data.objects.new(name, data)
    sc().collection.objects.link(ob)
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    V = np.empty(len(me.vertices) * 3); me.vertices.foreach_get('co', V)
    F = [tuple(p.vertices) for p in me.polygons]
    bpy.data.objects.remove(ob); bpy.data.metaballs.remove(data); bpy.data.meshes.remove(me)
    return V.reshape(-1, 3), F


def _tube(pts, radii, n=8):
    """Röhre durch pts mit Radien, beide Enden zu (Ecken, Flächen nach aussen, Ring je Punkt)"""
    P = np.array(pts, float)
    T = np.gradient(P, axis=0); T /= np.linalg.norm(T, axis=1)[:, None]
    ref = np.array((0, 0, 1.0)) if abs(T[0][2]) < 0.9 else np.array((1.0, 0, 0))
    u = np.cross(T[0], ref); u /= np.linalg.norm(u)
    V, F, rings = [], [], []
    for p, t, r in zip(P, T, radii):
        u = u - (u @ t) * t; u /= np.linalg.norm(u)   # mitgeführt, damit sich die Röhre nicht verdreht
        w = np.cross(t, u)
        rings.append(len(V))
        for k in range(n):
            a = 2 * math.pi * k / n
            V.append(p + r * (math.cos(a) * u + math.sin(a) * w))
    for i in range(len(P) - 1):
        a, b = rings[i], rings[i + 1]
        for k in range(n):
            k1 = (k + 1) % n
            F.append((a + k, a + k1, b + k1, b + k))
    for i, s in ((0, -1), (len(P) - 1, 1)):
        c = len(V); V.append(P[i] + s * T[i] * radii[i] * 0.35)
        for k in range(n):
            k1 = (k + 1) % n
            F.append((rings[i] + k1, rings[i] + k, c) if s < 0 else (rings[i] + k, rings[i] + k1, c))
    return np.array(V), F, [i for i in range(len(P)) for _ in range(n)] + [0, len(P) - 1]


def _ellipsoid(c, semi, R, seg=12, rings=7):
    """Ellipsoid um c mit Halbachsen semi, gedreht um R (Ecken, Flächen nach aussen; seg Ecken je Ring, rings Ringe)"""
    V = [(0, 0, -1.0)]
    for i in range(1, rings):
        th = math.pi * i / rings
        V += [(math.sin(th) * math.cos(2 * math.pi * k / seg), math.sin(th) * math.sin(2 * math.pi * k / seg), -math.cos(th))
              for k in range(seg)]
    V.append((0, 0, 1.0))
    F = [(0, 1 + (k + 1) % seg, 1 + k) for k in range(seg)]
    for i in range(rings - 2):
        a, b = 1 + i * seg, 1 + (i + 1) * seg
        F += [(a + k, a + (k + 1) % seg, b + (k + 1) % seg, b + k) for k in range(seg)]
    top, a = len(V) - 1, 1 + (rings - 2) * seg
    F += [(a + k, a + (k + 1) % seg, top) for k in range(seg)]
    V = np.array(V) * np.array(semi) @ np.array(R).T + np.array(c)
    return V, F


def cow_colors(breed, tag, P, head, seed, dz):
    """Farben (sRGB) je Ecke einer Kuh: tag je Ecke, P eigene Koordinaten, head (H, R, hs) für Maul und Augen, dz so
    viel tiefer liegt der Rumpf (liegend)"""
    H, R, hs = head
    L = (P - H) @ R / hs                  # Kopf-Koordinaten
    G = Perlin(700 + seed)
    n = fbm(G, P[:, 0] * 1.7 + 0.9 * np.sign(P[:, 1]), P[:, 2] * 1.7, 3)
    col = np.zeros((len(P), 3))
    is_ = lambda *t: np.isin(tag, t)
    if breed == 'braun':
        c = COW_BRAUN
        col[:] = c['fell']
        fore = smoothstep(0.1, 0.7, P[:, 0])                                     # Vorhand dunkler
        col = col + (np.array(c['dunkel']) - col) * (0.45 * fore)[:, None]
        m = is_('head', 'neck', 'ear')
        col[m] = c['dunkel']
        low = is_('belly', 'leg', 'thigh', 'body') & (P[:, 2] < 0.86 + dz)
        col[low] = col[low] + (np.array(c['hell']) - col[low]) * 0.5
        back = is_('body') & (np.abs(P[:, 1]) < 0.07)
        col[back] = col[back] + (np.array(c['hell']) - col[back]) * 0.6        # heller Aalstrich
        mz = is_('muzzle') | (is_('head') & (L[:, 0] > 0.27))
        col[mz] = np.where((L[mz, 0] > 0.38)[:, None], c['nase'], c['ring'])
        eye_ring = is_('head') & (np.hypot(L[:, 0] - 0.10, L[:, 2] - 0.01) < 0.06)
        col[eye_ring] = col[eye_ring] * 0.7 + np.array(c['hell']) * 0.3
        col[is_('leg') & (P[:, 2] < 0.45)] = c['bein']
        col[is_('hoof')] = c['huf']
        col[is_('tuft')] = c['quaste']
    else:
        c = COW_FLECK
        red, white = np.array(c['rot']), np.array(c['weiss'])
        patch = smoothstep(0.14, 0.30, n)                                          # weisse Flecken
        belly = smoothstep(0.92, 0.78, P[:, 2] - dz + 0.10 * fbm(G, P[:, 0] * 3.1, P[:, 1] * 3.1 + 5, 2))
        w = np.maximum(patch, belly)
        col[:] = red + (white - red) * w[:, None]
        col[is_('head', 'muzzle', 'dewlap')] = white
        eye_patch = is_('head') & (np.hypot(L[:, 0] - 0.08, L[:, 2]) < 0.075) & (L[:, 1] * (1 if seed % 2 else -1) > 0)
        col[eye_patch] = red                                                           # roter Fleck ums Auge
        col[is_('ear')] = red
        col[is_('muzzle') & (L[:, 0] > 0.33)] = c['maul']
        col[is_('leg', 'tuft')] = white
        col[is_('hoof')] = c['huf']
    col[is_('udder')] = COW_UDDER
    col[is_('eye')] = COW_EYE
    col[is_('strap')] = COW_STRAP
    return col


def cow_mesh(x, y, heading, breed, pose, size, seed):
    """Eine Kuh als Ecken (Welt), Flächen, Material je Fläche (0 Fell, 1 Glocke) und Farbe je Ecke (linear)"""
    calf = pose == 'calf'
    mb, ex, head, neck, dz = cow_parts('stand' if calf else pose, calf)
    V, F = _mb_mesh('Kuh%d' % seed, mb, COW_RES)
    names = np.array([e[1] for e in mb])
    tags = names[np.argmax(_mb_field(mb, V), 0)]
    parts = [(V, F, tags, None)]
    for e in ex:
        if e[0] == 'T':
            _, t, pts, radii, ring_cols = e
            v, f, ring = _tube(pts, radii, 8 if t != 'horn' else 6)
            rc = None if ring_cols is None else np.array(ring_cols)[np.array(ring)]
            parts.append((v, f, np.full(len(v), t), rc))
        else:
            _, t, c, semi, R = e
            v, f = _ellipsoid(c, semi, R)
            parts.append((v, f, np.full(len(v), t), None))
    H, R, hs = head
    for s in (1, -1):   # Augen: knapp in die Fläche des Kopfs gesetzt
        p, n = _snap(V[np.isin(tags, ('head',))], H + R @ (np.array((0.13, s * 0.11, -0.005)) * hs), H + R @ (np.array((0.13, 0, -0.03)) * hs))
        v, f = _ellipsoid(p - n * 0.019 * hs, (0.028 * hs,) * 3, R, 8, 5)
        parts.append((v, f, np.full(len(v), 'eye'), None))
    if not calf:   # Riemen um den Hals (an der Fläche entlang), darunter die Glocke
        a, b = np.array(neck[0], float), np.array(neck[1], float)
        s = a + (b - a) * 0.62
        ax = (b - a) / np.linalg.norm(b - a)
        u = np.cross(ax, (0, 1.0, 0)); u /= np.linalg.norm(u)
        if u[2] > 0:
            u = -u
        w = np.cross(ax, u)
        # nur der Hals samt Wamme: Beim Weiden reichte die Scheibe sonst bis in die Vorderbeine (Review)
        Q = V[np.isin(tags, ('neck', 'dewlap')) & (np.abs((V - s) @ ax) < 0.035)] - s
        ang = np.arctan2(Q @ w, Q @ u); rad = np.hypot(Q @ u, Q @ w)
        ts = np.linspace(0, 2 * math.pi, 25)
        near = [rad[np.abs((ang - t + math.pi) % (2 * math.pi) - math.pi) < 0.2] for t in ts]
        rr = np.array([q.max() if len(q) else np.nan for q in near])
        rr = np.where(np.isnan(rr), np.nanmedian(rr), rr)   # Richtung ohne Ecke des Halses: wie die übrigen
        rr = (np.roll(rr[:-1], 1) + 2 * rr[:-1] + np.roll(rr[:-1], -1)) / 4; rr = np.append(rr, rr[0])
        ring = [s + (r + 0.012) * (math.cos(t) * u + math.sin(t) * w) for t, r in zip(ts, rr)]
        v, f, _ = _tube(ring, [0.026] * len(ring), 6)
        parts.append((v, f, np.full(len(v), 'strap'), None))
        low = ring[0] + np.array((0, 0, -0.01))
        prof = [(0.0, 0.025), (-0.035, 0.035), (-0.06, 0.062), (-0.15, 0.078), (-0.235, 0.098), (-0.245, 0.09)]
        v, f, _ = _tube([low + (0, 0, h) for h, _ in prof], [r for _, r in prof], 12)
        parts.append((v, f, np.full(len(v), 'bell'), None))
    Vs, Fs, Ts, Cs, Ms, b = [], [], [], [], [], 0
    for v, f, t, rc in parts:
        Vs.append(v); Ts.append(t)
        Cs.append(rc if rc is not None else np.full((len(v), 3), np.nan))
        Fs += [tuple(i + b for i in face) for face in f]
        Ms += [1 if t[0] == 'bell' else 0] * len(f)
        b += len(v)
    P = np.concatenate(Vs); T = np.concatenate(Ts); C = np.concatenate(Cs)
    col = cow_colors(breed, T, P, head, seed, dz)
    col = np.where(np.isnan(C), col, C)
    Rz = _rot('Z', heading)
    W = (P * size) @ Rz.T + np.array((x, y, FLOOR - 0.01))
    return W, Fs, Ms, _srgb_lin(col)


def cows_mesh():
    V, F, M, C = [], [], [], []
    for cow in COWS:
        v, f, m, c = cow_mesh(*cow)
        b = len(V)
        V += [tuple(p) for p in v]; F += [tuple(i + b for i in face) for face in f]; M += m; C.append(c)
    return V, F, M, np.concatenate(C)


def mat_cow():
    """Fell der Kühe: Farbe je Ecke (Attribut fell)"""
    m = _principled('Kuh', (0.2, 0.15, 0.1), rough=0.8)
    t = m.node_tree; bs = t.nodes['Principled BSDF']
    a = t.nodes.new('ShaderNodeAttribute'); a.attribute_name = 'fell'; a.attribute_type = 'GEOMETRY'
    t.links.new(a.outputs['Color'], bs.inputs['Base Color'])
    return m


def mat_bell():
    m = _principled('Glocke', (0.62, 0.42, 0.14), rough=0.35)
    m.node_tree.nodes['Principled BSDF'].inputs['Metallic'].default_value = 0.85
    return m


def build_house():
    for n in ('Noas Haus', 'Fensterlicht'):
        for ob in [o for o in bpy.data.objects if o.name.startswith(n)]:
            bpy.data.objects.remove(ob)
    V, F, M = house_mesh()
    mats = [shared('Haus Stein', mat_stone), shared('Haus Holz', mat_wood), shared('Haus Dach', mat_roof_near),
            shared('Fenster hell', mat_window_lit), shared('Fenster dunkel', mat_window_dark),
            shared('Haus Laeden', mat_shutter), shared('Holzstapel', mat_logs), shared('Haus Tuer', mat_door),
            shared('Sprossen', lambda: _principled('Sprossen', (0.46, 0.44, 0.39))), shared('Geranien', mat_geranium),
            shared('Erde', lambda: _principled('Erde', (0.045, 0.032, 0.022))),
            shared('Salat', lambda: _principled('Salat', (0.12, 0.24, 0.06))),
            shared('Kohl', lambda: _principled('Kohl', (0.07, 0.15, 0.12))),
            shared('Laub', lambda: _principled('Laub', (0.04, 0.10, 0.03))),
            shared('Ringelblume', lambda: _principled('Ringelblume', (0.65, 0.26, 0.02)))]
    # Kühe im Garten im selben Netz (eigene Materialien dahinter, Farbe je Ecke im Attribut fell, glatt schattiert)
    nv, nf, nm = len(V), len(F), len(mats)
    cv, cf, cm, cc = cows_mesh()
    V = V + cv; F = F + [tuple(i + nv for i in f) for f in cf]; M = M + [m + nm for m in cm]
    mats += [shared('Kuh', mat_cow), shared('Glocke', mat_bell)]
    me = S.mesh('Noas Haus', V, F, M, mats=mats, smooth=False)
    fell = np.ones((len(V), 4)); fell[nv:, :3] = cc
    me.color_attributes.new('fell', 'FLOAT_COLOR', 'POINT').data.foreach_set('color', fell.astype(np.float32).ravel())
    me.polygons.foreach_set('use_smooth', np.arange(len(F)) >= nf)
    ob = link('Noas Haus', me, S.collection('Spiel'))
    ob.visible_camera = False
    with S.only(ob):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.quads_convert_to_tris()
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.01, area_weight=0.0, scale_to_bounds=True)
        # Das Haus behält die Dichte von vorher (HOUSE_UV; so ist es gemalt abgenommen), die Kühe stehen näher am Brett:
        # ihre Inseln COW_TEXEL-mal grösser. Danach alle neu gepackt, ohne die Grösse zu ändern
        import bmesh
        bm = bmesh.from_edit_mesh(me); uvl = bm.loops.layers.uv.active

        def uv_area(f):
            p = [lp[uvl].uv for lp in f.loops]
            return abs(sum(p[i].x * p[i - 1].y - p[i - 1].x * p[i].y for i in range(len(p)))) / 2
        r = np.median([uv_area(f) / f.calc_area() for f in bm.faces if f.material_index < nm and f.calc_area() > 0.01])
        k = HOUSE_UV / math.sqrt(r)
        for f in bm.faces:
            for lp in f.loops:
                lp[uvl].uv *= k * (COW_TEXEL if f.material_index >= nm else 1.0)
        bmesh.update_edit_mesh(me)
        ts = bpy.context.scene.tool_settings; sync = ts.use_uv_select_sync; ts.use_uv_select_sync = True
        try:
            bpy.ops.uv.pack_islands(rotate=True, scale=False, margin_method='FRACTION', margin=0.004, shape_method='CONCAVE')
        finally:
            ts.use_uv_select_sync = sync
        bpy.ops.object.mode_set(mode='OBJECT')
    # Licht aus den Fenstern auf die Wiese (Flächenlampen knapp davor, nach −y)
    cx, cy = HOUSE; yb = cy - HOUSE_SIZE[1] / 2 - 0.5
    for i, (x, fl, lit) in enumerate(BACK_WINDOWS):
        if not lit:
            continue
        ld = bpy.data.lights.new('Fensterlicht %d' % i, 'AREA'); ld.shape = 'RECTANGLE'
        ld.size, ld.size_y = 0.9, 1.1
        ld.energy = WINDOW_POWER * (1.0 if fl == 0 else 0.7); ld.color = WIN_LIGHT
        lo = link('Fensterlicht %d' % i, ld)
        lo.location = (x, yb, FLOOR + (1.55 if fl == 0 else STONE_TOP + 1.3))
        lo.rotation_euler = Vector((0, 1, 0)).to_track_quat('Z', 'Y').to_euler()
        lo.visible_camera = False; lo.visible_glossy = False
    ld = bpy.data.lights.new('Fensterlicht Tuer', 'POINT'); ld.shadow_soft_size = 0.15
    ld.energy = DOOR_POWER; ld.color = (1.0, 0.66, 0.36)
    lo = link('Fensterlicht Tuer', ld)
    lo.location = (DOOR_X + 0.85, cy - HOUSE_SIZE[1] / 2 - 0.45, FLOOR + 2.35)
    log('Noas Haus', len(me.polygons), 'Flächen')


# ---------------------------------------------------------------- Nachbarhäuser (das Spiel zeichnet sie, bakedMesh)

# Näher als R_FAR stehen sie nicht im Panorama (ihre Kanten rissen auf), sondern als 3D-Modelle im Spiel wie Noas Haus:
# Mitte x, y, Breite, Tiefe, Traufhöhe, Drehung (Grad), Holz oben, Anteil heller Fenster, Sockel aus Stein, rote Läden,
# Balkon
NEIGHBORS = [(28.0, 44.0, 10.0, 8.0, 5.4, 8.0, True, 0.55, False, True, True),
             (-30.0, 52.0, 9.0, 7.5, 5.0, -12.0, True, 0.5, True, False, True),
             (46.0, 74.0, 11.0, 8.5, 5.8, 15.0, False, 0.6, False, False, False)]
NEIGHBOR_WINDOW_POWER = 34.0   # Flächenlampe vor einem hellen Fenster eines Nachbarn (W), zum Brett hin
NEIGHBOR_LAMP_POWER = 14.0     # Lampe an der Haustür


def chalet(w, d, socket, eave, wood, lit, rng, pitch=27.0, stone=False, red=False, balcony=False):
    """Haus in eigenen Koordinaten, so detailliert wie Noas Haus: Grundriss um 0, Boden am höchsten Punkt bei z = 0,
    Sockel bis −socket; Sockel aus Putz oder Stein, darüber Holz (Strickbau) mit Gurt, Satteldach mit Pfettenköpfen,
    Kamin mit Abdeckung, Fenster mit Rahmen, Sprossen, Läden, Simsen und Blumenkästen, Dachfenster im Giebel, Tür mit
    Stufe und Lampe, Bank, Holzstapel, auf Wunsch ein Balkon mit Brüstung und Geranien. Die Vorderseite zeigt nach −y.
    Materialien: 0 Putz, 1 Holz, 2 Dach, 3 Fenster hell, 4 dunkel, 5 Läden grün, 6 Holzstapel, 7 Tür, 8 Stein,
    9 Läden rot, 10 Geranien, 11 Sprossen. Liefert dazu die Lichter [(x, y, z, nx, ny, art)]."""
    V, F, M, lights = [], [], [], []
    base = 8 if stone else 0
    st = 2.7 if wood else eave
    _box(V, F, M, (0.0, 0.0), (w, d), 0.0, -socket, st, base)
    if wood:
        _box(V, F, M, (0.0, 0.0), (w + 0.3, d + 0.3), 0.0, st, eave, 1)
        _box(V, F, M, (0.0, 0.0), (w + 0.42, d + 0.42), 0.0, st - 0.1, st + 0.1, 1)   # Gurt
    rise = math.tan(math.radians(pitch)) * (d / 2 + 0.15)
    for sx in (-1, 1):
        xg = sx * (w / 2 + 0.15)
        _quad(V, F, M, [(xg, -d / 2 - 0.15, eave), (xg, d / 2 + 0.15, eave), (xg, 0.0, eave + rise)], 1 if wood else base,
              (sx, 0, 0))
    ov, ovg, th = 1.1, 0.9, 0.22
    hw = w / 2 + 0.15 + ovg
    ze, zr = eave - ov * math.tan(math.radians(pitch)), eave + rise
    up = (math.sin(math.radians(pitch)), math.cos(math.radians(pitch)))
    for s in (-1, 1):
        ye = s * (d / 2 + 0.15 + ov)
        top = [(-hw, ye, ze + th), (hw, ye, ze + th), (hw, 0.0, zr + th), (-hw, 0.0, zr + th)]
        bot = [(-hw, ye, ze), (hw, ye, ze), (hw, 0.0, zr), (-hw, 0.0, zr)]
        _quad(V, F, M, top, 2, (0, s * up[0], up[1]))
        _quad(V, F, M, bot, 1, (0, -s * up[0], -up[1]))
        _quad(V, F, M, [bot[0], bot[1], top[1], top[0]], 1, (0, s, 0))
        _quad(V, F, M, [bot[0], bot[3], top[3], top[0]], 1, (-1, 0, 0))
        _quad(V, F, M, [bot[1], bot[2], top[2], top[1]], 1, (1, 0, 0))
    # Pfettenköpfe: Balken unter dem Dach, die an den Giebeln herausschauen
    tp = math.tan(math.radians(pitch))
    for sx in (-1, 1):
        for k in (-0.62, 0.0, 0.62):
            yk = k * (d / 2 + 0.15)
            zk = zr - abs(yk) * tp - 0.2
            _beam(V, F, M, (sx * (w / 2 + 0.1), yk, zk), (sx * (hw - 0.08), yk, zk), 0.18, 0.2, 1)
    # Kamin mit Abdeckung
    kx = rng.uniform(-0.3, 0.3) * w
    _box(V, F, M, (kx, d * 0.2), (0.7, 0.7), 0.0, zr - 1.6, zr + 1.0, base)
    _box(V, F, M, (kx, d * 0.2), (0.92, 0.92), 0.0, zr + 1.0, zr + 1.12, 2)

    def P(a, z, off, along_x, pos):
        return (a, pos + off, z) if along_x else (pos + off, a, z)

    def window(t, z0, along_x, pos, out, ww=0.8, wh=1.0, flowers=False, shutters=True, attic=False):
        sg = out[0] + out[1]
        Q = lambda a, z, off: P(a, z, sg * off, along_x, pos)
        _quad(V, F, M, [Q(t - ww / 2 - 0.09, z0 - 0.09, 0.02), Q(t + ww / 2 + 0.09, z0 - 0.09, 0.02),
                        Q(t + ww / 2 + 0.09, z0 + wh + 0.09, 0.02), Q(t - ww / 2 - 0.09, z0 + wh + 0.09, 0.02)], 1, out)
        on = rng.random() < (lit * (0.6 if attic else 1.0))
        _quad(V, F, M, [Q(t - ww / 2, z0, 0.04), Q(t + ww / 2, z0, 0.04), Q(t + ww / 2, z0 + wh, 0.04),
                        Q(t - ww / 2, z0 + wh, 0.04)], 3 if on else 4, out)
        if on and out == (0, -1, 0) and not attic:
            lights.append((t, pos - 0.3, z0 + wh / 2, 0.0, -1.0, 'fenster'))
        # Sprossen (Kreuz)
        _quad(V, F, M, [Q(t - 0.025, z0, 0.06), Q(t + 0.025, z0, 0.06), Q(t + 0.025, z0 + wh, 0.06),
                        Q(t - 0.025, z0 + wh, 0.06)], 11, out)
        zm = z0 + wh * 0.58
        _quad(V, F, M, [Q(t - ww / 2, zm - 0.025, 0.06), Q(t + ww / 2, zm - 0.025, 0.06), Q(t + ww / 2, zm + 0.025, 0.06),
                        Q(t - ww / 2, zm + 0.025, 0.06)], 11, out)
        if shutters:
            for sd in (-1, 1):
                x0 = t + sd * (ww / 2 + 0.11); x1 = x0 + sd * ww * 0.55
                _quad(V, F, M, [Q(x0, z0, 0.07), Q(x1, z0, 0.07), Q(x1, z0 + wh, 0.07), Q(x0, z0 + wh, 0.07)],
                      9 if red else 5, out)
        # Sims, darauf vielleicht ein Blumenkasten
        _beam(V, F, M, Q(t - ww / 2 - 0.14, z0 - 0.12, 0.11), Q(t + ww / 2 + 0.14, z0 - 0.12, 0.11), 0.22, 0.06, 1)
        if flowers:
            _beam(V, F, M, Q(t - ww / 2, z0 - 0.0, 0.16), Q(t + ww / 2, z0 - 0.0, 0.16), 0.2, 0.18, 1)
            _beam(V, F, M, Q(t - ww / 2 - 0.06, z0 + 0.17, 0.17), Q(t + ww / 2 + 0.06, z0 + 0.17, 0.17), 0.3, 0.22, 10)

    upper = st + 0.7 if wood else 3.6
    wall_up = (d + 0.3) / 2 if wood else d / 2
    door_x, bench_x, pile_x = -w * 0.15, -w * 0.38, w * 0.32
    n = max(3, int(w / 2.3))
    for s in (-1, 1):
        for i in range(n):
            t = (i + 0.5) / n * w - w / 2
            front = s < 0
            blocked = front and (abs(t - door_x) < 1.0 or abs(t - pile_x) < 1.4)
            if not blocked and rng.random() < 0.9:
                window(t, 1.0, True, s * d / 2, (0, s, 0), flowers=front and rng.random() < 0.6)
            if rng.random() < 0.9:
                window(t, upper, True, s * wall_up, (0, s, 0), flowers=front and not balcony and rng.random() < 0.7)
    for s in (-1, 1):
        wall_x = (w + 0.3) / 2 if wood else w / 2
        for t in (-d / 4, d / 4):
            window(t, 1.0, False, s * w / 2, (s, 0, 0))
            window(t, upper, False, s * wall_x, (s, 0, 0), flowers=rng.random() < 0.4)
        window(0.0, eave + rise * 0.3, False, s * (w / 2 + 0.15), (s, 0, 0), ww=0.55, wh=0.65, shutters=False, attic=True)
    # Tür mit Rahmen, Stufe und Lampe
    yd = -d / 2
    _quad(V, F, M, [(door_x - 0.62, yd - 0.02, -0.02), (door_x + 0.62, yd - 0.02, -0.02), (door_x + 0.62, yd - 0.02, 2.28),
                    (door_x - 0.62, yd - 0.02, 2.28)], 1, (0, -1, 0))
    _quad(V, F, M, [(door_x - 0.5, yd - 0.04, 0.0), (door_x + 0.5, yd - 0.04, 0.0), (door_x + 0.5, yd - 0.04, 2.15),
                    (door_x - 0.5, yd - 0.04, 2.15)], 7, (0, -1, 0))
    _box(V, F, M, (door_x, yd - 0.35), (1.6, 0.7), 0.0, -0.35, 0.14, 8)
    _box(V, F, M, (door_x + 0.8, yd - 0.12), (0.2, 0.2), 0.0, 2.25, 2.55, 3)
    lights.append((door_x + 0.8, yd - 0.35, 2.4, 0.0, -1.0, 'lampe'))
    # Bank und Holzstapel
    _box(V, F, M, (bench_x, yd - 0.4), (1.6, 0.4), 0.0, 0.42, 0.5, 1)
    for bx in (bench_x - 0.65, bench_x + 0.65):
        _box(V, F, M, (bx, yd - 0.4), (0.1, 0.34), 0.0, -0.1, 0.42, 1)
    _box(V, F, M, (pile_x, yd - 0.45), (2.2, 0.8), 0.0, -0.2, 1.6, 6)
    # Balkon im oberen Geschoss: Boden, Brüstung aus Brettern, Konsolen, Geranien obenauf
    if balcony and wood:
        bw, bd = 0.72 * w, 1.25
        yo = -wall_up - bd
        _box(V, F, M, (0.0, -wall_up - bd / 2), (bw, bd), 0.0, st + 0.02, st + 0.14, 1)
        _box(V, F, M, (0.0, yo + 0.06), (bw, 0.04), 0.0, st + 0.14, st + 1.0, 7)        # Rückwand, dunkel
        nb = int(bw / 0.17)
        for i in range(nb):                                                               # Bretter mit Spalt
            bx = -bw / 2 + (i + 0.5) * bw / nb
            _quad(V, F, M, [(bx - 0.06, yo + 0.03, st + 0.16), (bx + 0.06, yo + 0.03, st + 0.16),
                            (bx + 0.06, yo + 0.03, st + 0.98), (bx - 0.06, yo + 0.03, st + 0.98)], 1, (0, -1, 0))
        for sx in (-1, 1):
            _box(V, F, M, (sx * (bw / 2 - 0.03), -wall_up - bd / 2), (0.06, bd), 0.0, st + 0.14, st + 1.0, 1)
            _beam(V, F, M, (sx * 0.3 * bw, -wall_up - 0.05, st - 0.9), (sx * 0.3 * bw, yo + 0.15, st + 0.02), 0.12, 0.14, 1)
        _beam(V, F, M, (-bw / 2 - 0.03, yo + 0.06, st + 1.04), (bw / 2 + 0.03, yo + 0.06, st + 1.04), 0.14, 0.08, 1)   # Handlauf
        _beam(V, F, M, (-bw / 2 + 0.12, yo + 0.06, st + 1.2), (bw / 2 - 0.12, yo + 0.06, st + 1.2), 0.3, 0.24, 10)
    return V, F, M, lights


def neighbors_mesh(seed=17):
    """Alle Nachbarhäuser als ein Netz; dazu ihre Lichter in Weltkoordinaten [(Lage, Richtung nach aussen, art)]"""
    rng = np.random.default_rng(seed)
    V, F, M, L = [], [], [], []
    for (x, y, w, d, eave, rot, wood, lit, stone, red, balcony) in NEIGHBORS:
        a = math.radians(rot); ca, sa = math.cos(a), math.sin(a)
        cz = [_ground(x + dx * ca - dy * sa, y + dx * sa + dy * ca) for dx in (-w / 2 - 1.5, w / 2 + 1.5)
              for dy in (-d / 2 - 1.5, d / 2 + 1.5)]
        z0 = max(cz)
        v, f, m, lights = chalet(w, d, z0 - min(cz) + 0.6, eave, wood, lit, rng, stone=stone, red=red, balcony=balcony)
        b = len(V)
        V.extend([(x + px * ca - py * sa, y + px * sa + py * ca, z0 + pz) for px, py, pz in v])
        F.extend([tuple(i + b for i in fc) for fc in f]); M.extend(m)
        for lx, ly, lz, nx, ny, art in lights:
            L.append(((x + lx * ca - ly * sa, y + lx * sa + ly * ca, z0 + lz), (nx * ca - ny * sa, nx * sa + ny * ca, 0.0), art))
    return V, F, M, L


def build_neighbors():
    for ob in [o for o in bpy.data.objects if o.name == 'Nachbarn' or o.name.startswith('Nachbarlicht')]:
        bpy.data.objects.remove(ob)
    V, F, M, L = neighbors_mesh()
    mats = [shared('Nachbar Putz', mat_plaster_near), shared('Haus Holz', mat_wood), shared('Haus Dach', mat_roof_near),
            shared('Fenster hell', mat_window_lit), shared('Fenster dunkel', mat_window_dark), shared('Haus Laeden', mat_shutter),
            shared('Holzstapel', mat_logs), shared('Haus Tuer', mat_door), shared('Haus Stein', mat_stone),
            shared('Laeden rot', lambda: _principled('Laeden rot', (0.30, 0.05, 0.04))), shared('Geranien', mat_geranium),
            shared('Sprossen', lambda: _principled('Sprossen', (0.46, 0.44, 0.39)))]
    me = S.mesh('Nachbarn', V, F, M, mats=mats, smooth=False)
    ob = link('Nachbarn', me, S.collection('Spiel'))
    ob.visible_camera = False
    with S.only(ob):
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.quads_convert_to_tris()
        bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.006, area_weight=0.0, scale_to_bounds=True)
        bpy.ops.object.mode_set(mode='OBJECT')
    # Licht aus den hellen Fenstern und der Türlampen auf die Wiese
    for i, (pos, out, art) in enumerate(L):
        if art == 'fenster':
            ld = bpy.data.lights.new('Nachbarlicht %d' % i, 'AREA'); ld.shape = 'RECTANGLE'
            ld.size, ld.size_y = 0.8, 1.0
            ld.energy = NEIGHBOR_WINDOW_POWER
        else:
            ld = bpy.data.lights.new('Nachbarlicht %d' % i, 'POINT'); ld.shadow_soft_size = 0.15
            ld.energy = NEIGHBOR_LAMP_POWER
        ld.color = WIN_LIGHT if art == 'fenster' else (1.0, 0.66, 0.36)
        lo = link('Nachbarlicht %d' % i, ld)
        lo.location = pos
        lo.rotation_euler = Vector((-out[0], -out[1], 0.0)).to_track_quat('Z', 'Y').to_euler()
        lo.visible_camera = False; lo.visible_glossy = False
    log('Nachbarn', len(me.polygons), 'Flächen,', len(L), 'Lichter')


# ---------------------------------------------------------------- Materialien

def shared(name, make):
    """Material, das mehrere Netze nutzen (Fenster im Dorf, an Noas Haus und den Nachbarn): das vorhandene, sonst neu.
    _principled ersetzt ein gleichnamiges Material, die Netze, die es schon trugen, verlören es sonst."""
    return bpy.data.materials.get(name) or make()


def _principled(name, color, rough=0.85, attr=None, var=0.0, emit=None):
    m = bpy.data.materials.get(name)
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    if emit is not None:
        em = t.node('ShaderNodeEmission', in_Strength=emit)
        em.inputs['Color'].default_value = (*color, 1)
        t.link(S.air(t, em.outputs[0]), out.inputs['Surface'])
        return m
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=rough)
    col = (*color, 1)
    if attr:
        a = t.node('ShaderNodeAttribute', attribute_name=attr, attribute_type='GEOMETRY')
        c = t.mix(t.math('MULTIPLY', a.outputs['Fac'], var), col, tuple(min(1, v * 1.6) for v in color) + (1,))
        t.link(c, bs.inputs['Base Color'])
    else:
        bs.inputs['Base Color'].default_value = col
    t.link(S.air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


def mat_plaster():
    return _principled('Dorf Putz', (0.30, 0.29, 0.27), attr='tone', var=0.5)


def mat_church():
    m = _principled('Kirche', (0.55, 0.53, 0.50))
    t = m.node_tree; bs = t.nodes['Principled BSDF']
    nt = NT.__new__(NT); nt.t = t; nt.n = t.nodes; nt.l = t.links
    n1 = nt.node('ShaderNodeTexNoise', in_Scale=0.5, in_Detail=5.0)
    nt.link(nt.node('ShaderNodeTexCoord').outputs['Object'], n1.inputs['Vector'])
    nt.link(nt.mix(nt.maprange(n1.outputs['Fac'], 0.35, 0.65), (0.46, 0.44, 0.41, 1), (0.58, 0.56, 0.52, 1)), bs.inputs['Base Color'])
    return m


def mat_spire():
    return _principled('Kirchturm Helm', (0.05, 0.11, 0.09))   # Kupfer mit Patina


def mat_clock():
    return _principled('Uhr', (0.62, 0.60, 0.52))


def mat_cross():
    return _principled('Kreuz', (0.55, 0.42, 0.14), rough=0.4)


def mat_plaster_near():
    """Putz der Nachbarhäuser: leicht fleckig wie gekalkt, nah am Boden etwas dunkler"""
    m = _principled('Nachbar Putz', (0.31, 0.30, 0.28))
    t = m.node_tree; bs = t.nodes['Principled BSDF']
    nt = NT.__new__(NT); nt.t = t; nt.n = t.nodes; nt.l = t.links
    tc = nt.node('ShaderNodeTexCoord')
    n1 = nt.node('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=6.0, in_Roughness=0.65)
    nt.link(tc.outputs['Object'], n1.inputs['Vector'])
    c = nt.mix(nt.maprange(n1.outputs['Fac'], 0.3, 0.7), (0.25, 0.24, 0.22, 1), (0.36, 0.35, 0.32, 1))
    nt.link(c, bs.inputs['Base Color'])
    return m


def mat_geranium():
    """Geranien im Blumenkasten: rote Blüten in grünem Laub"""
    m = _principled('Geranien', (0.04, 0.09, 0.035))
    t = m.node_tree; bs = t.nodes['Principled BSDF']
    nt = NT.__new__(NT); nt.t = t; nt.n = t.nodes; nt.l = t.links
    tc = nt.node('ShaderNodeTexCoord')
    vo = nt.node('ShaderNodeTexVoronoi', in_Scale=11.0, in_Randomness=1.0)
    nt.link(tc.outputs['Object'], vo.inputs['Vector'])
    c = nt.mix(nt.maprange(vo.outputs['Distance'], 0.46, 0.34), (0.035, 0.085, 0.03, 1), (0.75, 0.05, 0.06, 1))
    nt.link(c, bs.inputs['Base Color'])
    return m


def mat_window_lit():
    return _principled('Fenster hell', WIN_LIGHT, emit=WINDOW_EMIT)


def mat_window_dark():
    return _principled('Fenster dunkel', (0.012, 0.014, 0.025), rough=0.2)


def mat_stone():
    m = _principled('Haus Stein', (0.38, 0.37, 0.35))
    t = m.node_tree
    bs = t.nodes['Principled BSDF']
    nt = NT.__new__(NT); nt.t = t; nt.n = t.nodes; nt.l = t.links
    tc = nt.node('ShaderNodeTexCoord')
    mp = nt.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 1.0, 1.6)   # Steine eher breit
    nt.link(tc.outputs['Object'], mp.inputs['Vector'])
    vo = nt.node('ShaderNodeTexVoronoi', in_Scale=3.2); vo.feature = 'DISTANCE_TO_EDGE'
    nt.link(mp.outputs['Vector'], vo.inputs['Vector'])
    vc = nt.node('ShaderNodeTexVoronoi', in_Scale=3.2); nt.link(mp.outputs['Vector'], vc.inputs['Vector'])
    stone = nt.mix(nt.maprange(vc.outputs['Color'], 0.2, 0.8), (0.34, 0.33, 0.31, 1), (0.46, 0.45, 0.42, 1))
    c = nt.mix(nt.maprange(vo.outputs['Distance'], 0.015, 0.05), (0.15, 0.145, 0.14, 1), stone)
    nt.link(c, bs.inputs['Base Color'])
    return m


def _wood(name, color, scale=(1.0, 1.0, 40.0)):
    m = _principled(name, color)
    t = m.node_tree; bs = t.nodes['Principled BSDF']
    nt = NT.__new__(NT); nt.t = t; nt.n = t.nodes; nt.l = t.links
    tc = nt.node('ShaderNodeTexCoord')
    mp = nt.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = scale
    nt.link(tc.outputs['Object'], mp.inputs['Vector'])
    n = nt.node('ShaderNodeTexNoise', in_Scale=1.0, in_Detail=3.0)
    nt.link(mp.outputs['Vector'], n.inputs['Vector'])
    c = nt.mix(nt.maprange(n.outputs['Fac'], 0.35, 0.65), tuple(v * 0.6 for v in color) + (1,), tuple(v * 1.25 for v in color) + (1,))
    nt.link(c, bs.inputs['Base Color'])
    return m


def mat_wood():
    return _wood('Haus Holz', (0.16, 0.085, 0.045))


def mat_roof_near():
    return _wood('Haus Dach', (0.07, 0.07, 0.08), scale=(30.0, 1.0, 1.0))


def mat_shutter():
    return _principled('Haus Laeden', (0.07, 0.16, 0.09))


def mat_door():
    return _wood('Haus Tuer', (0.11, 0.06, 0.035))


def mat_logs():
    m = _principled('Holzstapel', (0.30, 0.20, 0.11))
    t = m.node_tree; bs = t.nodes['Principled BSDF']
    nt = NT.__new__(NT); nt.t = t; nt.n = t.nodes; nt.l = t.links
    tc = nt.node('ShaderNodeTexCoord')
    mp = nt.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 0.0, 1.0)
    nt.link(tc.outputs['Object'], mp.inputs['Vector'])
    vo = nt.node('ShaderNodeTexVoronoi', in_Scale=6.5, in_Randomness=0.35)
    nt.link(mp.outputs['Vector'], vo.inputs['Vector'])
    end = nt.mix(nt.maprange(vo.outputs['Color'], 0.2, 0.8), (0.30, 0.20, 0.11, 1), (0.42, 0.30, 0.17, 1))
    c = nt.mix(nt.maprange(vo.outputs['Distance'], 0.33, 0.37), end, (0.10, 0.065, 0.04, 1))      # Rinde
    c = nt.mix(nt.maprange(vo.outputs['Distance'], 0.41, 0.45), c, (0.025, 0.02, 0.015, 1))      # Lücken
    nt.link(c, bs.inputs['Base Color'])
    return m


def mat_needles():
    return _principled('Nadeln', (0.020, 0.042, 0.032), rough=0.9)


def mat_bark():
    return _principled('Rinde', (0.05, 0.035, 0.025))


def mat_ground():
    """Wiese, Weg, Beet, Waldboden, Fels und Schnee nach den Attributen des Geländes; Blumen nah am Haus"""
    m = bpy.data.materials.get('Boden')
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new('Boden'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bs = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.95)
    A = lambda n: t.node('ShaderNodeAttribute', attribute_name=n, attribute_type='GEOMETRY').outputs['Fac']
    geo = t.node('ShaderNodeNewGeometry')
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.08, in_Detail=4.0); t.link(geo.outputs['Position'], n1.inputs['Vector'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=1.3, in_Detail=2.0); t.link(geo.outputs['Position'], n2.inputs['Vector'])
    grass = t.mix(t.maprange(n1.outputs['Fac'], 0.32, 0.70), (0.026, 0.052, 0.026, 1), (0.072, 0.108, 0.044, 1))
    grass = t.mix(t.math('MULTIPLY', t.maprange(n2.outputs['Fac'], 0.4, 0.7), 0.35), grass, (0.09, 0.11, 0.05, 1))
    n3 = t.node('ShaderNodeTexNoise', in_Scale=0.35, in_Detail=2.0); t.link(geo.outputs['Position'], n3.inputs['Vector'])
    # Blumen: kleine helle Tupfer nah am Haus und am Zaun
    vo = t.node('ShaderNodeTexVoronoi', in_Scale=3.0); t.link(geo.outputs['Position'], vo.inputs['Vector'])
    near = t.maprange(t.vmath('LENGTH', geo.outputs['Position']), 34.0, 22.0)
    dots = t.math('MULTIPLY', t.math('MULTIPLY', t.maprange(vo.outputs['Distance'], 0.09, 0.05), near),
                  t.maprange(n3.outputs['Fac'], 0.56, 0.66))   # Blumen nur in Gruppen
    flower = t.mix(t.maprange(vo.outputs['Color'], 0.3, 0.7), (0.30, 0.26, 0.42, 1), (0.42, 0.38, 0.18, 1))
    col = t.mix(dots, grass, flower)
    col = t.mix(A('forest'), col, (0.020, 0.026, 0.018, 1))
    col = t.mix(A('path'), col, (0.16, 0.13, 0.09, 1))
    bed = (0.034, 0.030, 0.024, 1)   # Erde unter dem Hochbeet (das Spiel zeichnet das Beet selbst)
    col = t.mix(A('bed'), col, bed)
    rock = t.mix(t.maprange(n2.outputs['Fac'], 0.3, 0.7), (0.030, 0.030, 0.040, 1), (0.070, 0.070, 0.085, 1))
    col = t.mix(A('rock'), col, rock)
    col = t.mix(A('snow'), col, (0.85, 0.88, 0.95, 1))
    t.link(col, bs.inputs['Base Color'])
    t.link(S.air(t, bs.outputs[0]), out.inputs['Surface'])
    return m


# ---------------------------------------------------------------- Himmel, Licht, Kameras

SKY_GAIN = 1.0            # Himmel, wie ihn Kamera und Spiegelungen sehen (gemalt wird er danach ohnehin neu)
SKY_LIGHT = 2.7           # ... als Licht: aufgehellte, blaue Schatten (Nacht in einem Anime-Hintergrund ist nie schwarz)
MOON_STRENGTH = 0.32
MOON_COLOR = (0.62, 0.72, 1.0)
WINDOW_EMIT = 2.2         # Leuchtdichte der hellen Fenster (vor der Belichtung des Stils, stile.py)
WINDOW_POWER = 55.0       # Flächenlampe vor einem hellen Fenster von Noas Haus (W)
DOOR_POWER = 18.0
LANTERN_POWER = 30.0
AIR_DIST = 22000.0        # Luftperspektive: die fernen Berge gehen leicht ins Violett des Horizonts über
AIR_HEIGHT = 1400.0


def sky_group():
    """Himmelsfarbe: Nachtblau, zum Horizont heller und violetter (wie die Bühne des Prologs), lineare Werte"""
    ng, t, gi, go = S._group('Himmelsfarbe', [('Richtung', 'NodeSocketVector'), ('Gain', 'NodeSocketFloat')],
                             [('Farbe', 'NodeSocketColor')])
    sep = t.node('ShaderNodeSeparateXYZ'); t.link(t.vmath('NORMALIZE', gi.outputs['Richtung']), sep.inputs[0])
    ramp = t.node('ShaderNodeValToRGB')
    cr = ramp.color_ramp; cr.interpolation = 'EASE'
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.034, 0.030, 0.085, 1)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.0015, 0.0022, 0.009, 1)
    for p, col in ((0.06, (0.018, 0.018, 0.058, 1)), (0.25, (0.006, 0.0075, 0.026, 1))):
        e = cr.elements.new(p); e.color = col
    t.link(t.math('MAXIMUM', sep.outputs['Z'], 0.0), ramp.inputs['Fac'])
    scl = t.node('ShaderNodeVectorMath'); scl.operation = 'SCALE'
    t.link(ramp.outputs['Color'], scl.inputs[0]); t.link(gi.outputs['Gain'], scl.inputs['Scale'])
    t.link(scl.outputs['Vector'], go.inputs['Farbe'])
    return ng


def world():
    w = bpy.data.worlds.new('Nacht'); sc().world = w; w.use_nodes = True
    sky_group()
    S.WATER, S.AIR_DIST, S.AIR_HEIGHT, S.SKY_GAIN = FLOOR - 280.0, AIR_DIST, AIR_HEIGHT, SKY_GAIN
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


MIST = (1100.0, 9000.0, -120.0)  # Nebelband: von, bis (m vom Brett), Höhe über FLOOR; liegt im Tal, deutlich unter der
                                 # Augenhöhe (sonst sähe man die Fläche von der Kante als Strich)
MIST_COLOR = (0.050, 0.052, 0.120)
MIST_ALPHA = 0.42


def build_mist():
    """Nebel als durchscheinende Fläche (Sammlung Volumen: fehlt in Tiefe und Himmelsmaske). Wo das Gelände höher
    liegt, steckt sie im Berg; sichtbar bleibt sie als Band über dem Tal am Fuss der Gipfel."""
    r0, r1, hz = MIST
    X, Y, F = ring_grid(np.geomspace(r0, r1, 40), 720)
    V = np.stack([X, Y, np.full(len(X), FLOOR + hz)], -1)
    me = S.mesh('Nebel', V, F, smooth=False)
    m = bpy.data.materials.get('Nebel')
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new('Nebel'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    geo = t.node('ShaderNodeNewGeometry')
    mp = t.node('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 2.2, 1.0)
    t.link(geo.outputs['Position'], mp.inputs['Vector'])
    n = t.node('ShaderNodeTexNoise', in_Scale=0.0016, in_Detail=4.0, in_Roughness=0.55)
    t.link(mp.outputs['Vector'], n.inputs['Vector'])
    r = t.vmath('LENGTH', geo.outputs['Position'])
    edge = t.math('MULTIPLY', t.maprange(r, r0, r0 + 900.0), t.maprange(r, r1, r1 - 3000.0))
    a = t.math('MULTIPLY', t.math('MULTIPLY', t.maprange(n.outputs['Fac'], 0.38, 0.66), edge), MIST_ALPHA)
    em = t.node('ShaderNodeEmission', in_Strength=1.0); em.inputs['Color'].default_value = (*MIST_COLOR, 1)
    tr = t.node('ShaderNodeBsdfTransparent')
    mx = t.node('ShaderNodeMixShader')
    t.link(a, mx.inputs[0]); t.link(tr.outputs[0], mx.inputs[1]); t.link(em.outputs[0], mx.inputs[2])
    t.link(mx.outputs[0], out.inputs['Surface'])
    me.materials.append(m)
    ob = link('Nebel', me, S.collection('Volumen'))
    ob.visible_shadow = False
    return ob


def lights():
    ld = bpy.data.lights.new('Mond', 'SUN')
    ld.energy = MOON_STRENGTH; ld.color = MOON_COLOR; ld.angle = math.radians(3.0)
    ob = link('Mond', ld)
    ob.rotation_euler = MOON.to_track_quat('Z', 'Y').to_euler()
    ob['hauptlicht'] = True
    # Laternen am Weg ins Dorf: leuchtende Kugel auf einem Pfosten, dazu eine Punktlampe
    lm = _principled('Laterne', (1.0, 0.75, 0.45), emit=4.0)
    post = _principled('Pfosten', (0.03, 0.03, 0.035))
    V, F, M = [], [], []
    for i, (x, y) in enumerate(lantern_points()):
        z = float(height_raw(np.array([x]), np.array([y]))[0])
        _box(V, F, M, (x, y), (0.14, 0.14), 0.0, z - 0.3, z + 2.6, 1)
        _box(V, F, M, (x, y), (0.42, 0.42), 0.0, z + 2.6, z + 3.1, 0)
        ld = bpy.data.lights.new('Laternenlicht %d' % i, 'POINT'); ld.energy = LANTERN_POWER
        ld.color = (1.0, 0.7, 0.4); ld.shadow_soft_size = 0.3
        lo = link('Laternenlicht %d' % i, ld); lo.location = (x, y, z + 2.85)
        lo.visible_camera = False
    link('Laternen', S.mesh('Laternen', V, F, M, mats=[lm, post], smooth=False))
    # Kirchturm warm angestrahlt
    _, _, zg, _, (twx, twy) = church_place()
    to_board = Vector((-twx, -twy, 0.0)).normalized()
    side_ = Vector((-to_board.y, to_board.x, 0.0))
    for k, sd in enumerate((-1, 1)):
        ld = bpy.data.lights.new('Kirchenlicht %d' % k, 'SPOT'); ld.energy = 1500.0; ld.spot_size = math.radians(30)
        ld.color = (1.0, 0.82, 0.6); ld.shadow_soft_size = 0.5
        lo = link('Kirchenlicht %d' % k, ld)
        lo.location = Vector((twx, twy, zg + 1.0)) + to_board * 24.0 + side_ * (9.0 * sd)
        target = Vector((twx, twy, zg + 16.0))
        lo.rotation_euler = (lo.location - target).to_track_quat('Z', 'Y').to_euler()
        lo.visible_camera = False


def cameras():
    cd = bpy.data.cameras.new('Panorama'); cd.type = 'PANO'; cd.panorama_type = 'EQUIRECTANGULAR'
    cd.clip_start = 0.05; cd.clip_end = 60000
    pano = link('Panorama', cd); pano.location = PANO_CENTER; pano.rotation_euler = (math.pi / 2, 0, 0)
    gd = bpy.data.cameras.new('Spielkamera'); gd.sensor_fit = 'VERTICAL'; gd.angle_y = math.radians(32)
    gd.clip_start = 0.05; gd.clip_end = 60000
    gc = link('Spielkamera', gd)
    gc.location = (0.0, -13.6, 11.8)     # Ausgangsansicht des Spiels (Abstand 18, 0.86 rad von der Senkrechten)
    gc.rotation_euler = (math.radians(49.3), 0, 0)
    sc().camera = pano


# ---------------------------------------------------------------- Aufbau und Ersetzen

VILLAGE = village_plan()


def height(x, y):
    """Höhe mit ebenen Plätzen um die Häuser des Dorfs (sie stehen im Hang, ihr Sockel steckt im Boden)"""
    return height_raw(x, y)


def build_ground():
    me = terrain_mesh()
    me.materials.append(mat_ground())
    link('Gelaende', me)


def build():
    """Ganze Szene in die (leere) aktuelle Datei bauen"""
    sc().render.engine = 'CYCLES'
    world()
    build_ground()
    link('Dorf', village_mesh())
    build_trees()
    build_house()
    build_neighbors()
    build_mist()
    lights()
    cameras()


def _remove(names):
    for n in names:
        ob = bpy.data.objects.get(n)
        if ob:
            bpy.data.objects.remove(ob)


def _remove_prefix(prefixes):
    for ob in [o for o in bpy.data.objects if o.name.startswith(tuple(prefixes))]:
        bpy.data.objects.remove(ob)


def replace_ground():
    _remove(['Gelaende'])
    build_ground()
    bpy.data.orphans_purge(do_recursive=True)


def replace_village():
    global VILLAGE
    VILLAGE = village_plan()
    _remove(['Dorf', 'Tannen'])
    link('Dorf', village_mesh())
    build_trees()
    bpy.data.orphans_purge(do_recursive=True)


def replace_house():
    build_house()
    build_neighbors()
    bpy.data.orphans_purge(do_recursive=True)


def replace_lights():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove_prefix(['Mond', 'Laterne', 'Kirchenlicht'])
    lights()
    bpy.data.orphans_purge(do_recursive=True)


# ---------------------------------------------------------------- Export fürs Spiel

HOUSE_TEX = 2048   # Bild von Noas Haus (gebackenes Licht), Seitenlänge auf dem Desktop; das Handy die halbe
NEIGHBOR_TEX = 1536   # Bild der Nachbarhäuser (mehr Einzelheiten als Noas Haus, weiter weg; 2048 sprengte das Budget
                      # von 300 MB Grafikspeicher)


def bake_mesh(obname, tex, stil='village', samples=256):
    """Licht von Noas Haus backen wie die Felsen am Vulkan (bake_rim_rocks): Cycles COMBINED (mit den hellen Fenstern)
    mit den Einstellungen des Panoramas, dazu Grundfarbe und Normale, entrauscht (anime.denoise)"""
    import importlib
    os.environ['WALD_STIL'] = stil
    import wald_export, anime
    wx = importlib.reload(wald_export)
    anime = importlib.reload(anime)
    ob = bpy.data.objects[obname]
    imgs = {}
    for key in ('licht', 'farbe', 'normale'):
        name = obname + ' ' + key
        if bpy.data.images.get(name):
            bpy.data.images.remove(bpy.data.images[name])
        imgs[key] = bpy.data.images.new(name, tex, tex, float_buffer=True)
    nodes = []
    for mat in ob.data.materials:
        nd = mat.node_tree.nodes.new('ShaderNodeTexImage')
        mat.node_tree.nodes.active = nd
        nodes.append((mat, nd))
    scene = sc()
    bk = scene.render.bake
    wx.setup_cycles()
    wx.setv(bk, 'target', 'IMAGE_TEXTURES')
    wx.setv(bk, 'margin', 6)
    wx.setv(bk, 'view_from', 'ACTIVE_CAMERA')
    for attr in ('use_pass_direct', 'use_pass_indirect', 'use_pass_color', 'normal_space'):
        wx.setv(bk, attr, getattr(bk, attr))
    try:
        for key, kind, spp in (('licht', 'COMBINED', samples), ('farbe', 'DIFFUSE', 16), ('normale', 'NORMAL', 4)):
            for _, nd in nodes:
                nd.image = imgs[key]
            scene.cycles.samples = spp
            if kind == 'DIFFUSE':
                bk.use_pass_direct = bk.use_pass_indirect = False
                bk.use_pass_color = True
            bk.normal_space = 'OBJECT'
            with S.only(ob):
                bpy.ops.object.bake(type=kind)
    finally:
        wx.restore()
        for mat, nd in nodes:
            mat.node_tree.nodes.remove(nd)
    px = {k: np.array(im.pixels[:], np.float64).reshape(tex, tex, 4)[::-1, :, :3] for k, im in imgs.items()}
    clean = anime.denoise(px['licht'], px['farbe'], px['normale'] * 2 - 1)
    for im in imgs.values():
        bpy.data.images.remove(im)
    return clean


def mesh_model(sky, lin, obname, base, stil='village'):
    """Noas Haus fürs Spiel (bakedMesh wie die Felsen am Vulkan): Ecken in Spielkoordinaten (Int16, 1/256 m), UV,
    Dreiecke, rock8 überall 255; das gebackene Licht gemalt wie das Panorama als house_hd.jpg und halb so gross
    house.jpg"""
    import base64, importlib
    from wald_io import save_image
    os.environ['WALD_STIL'] = stil
    import anime
    anime = importlib.reload(anime)
    painted = anime.paint_texture(lin, size=2)
    save_image(painted, os.path.join(sky, base + '_hd.jpg'), 'JPEG', 86)
    h, w = painted.shape[:2]
    save_image(painted.reshape(h // 2, 2, w // 2, 2, 3).mean((1, 3)), os.path.join(sky, base + '.jpg'), 'JPEG', 86)
    me = bpy.data.objects[obname].data
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
            'uv16': b(quv[first].astype('<u2')), 'rock8': b(np.full(n, 255, 'u1')), 'texture': 'file:%s.jpg' % base}


def glow_spots(seed=21, n=90):
    """Plätze für Glühwürmchen (glowParticles): am Zaun, am Rand der Wiese und vor dem Haus, in Spielkoordinaten wie
    die Instanzen der Bäume ([x, y, z, …], y = Boden)"""
    rng = np.random.default_rng(seed)
    out = []
    P = np.array(FENCE)
    for _ in range(n):
        k = rng.random()
        if k < 0.5:
            i = rng.integers(len(P) - 1); t = rng.random()
            x, y = P[i] + (P[i + 1] - P[i]) * t + rng.normal(0, 1.2, 2)
        elif k < 0.75:
            x, y = rng.uniform(-10, 8), rng.uniform(15, 20)
        else:
            a = rng.uniform(math.radians(40), math.radians(140)); d = rng.uniform(14, 26)
            x, y = d * math.sin(a), d * math.cos(a)
        z = float(height_raw(np.array([x]), np.array([y]))[0])
        out.append([round(x, 2), round(z, 2), round(-y, 2)])
    return out


def export(stil='village'):
    """sky/<stil>/ebenen.json für pack.mjs: Noas Haus mit Zaun (bakedMesh, Bild house.jpg, im HD-Teil house_hd.jpg)
    und die Plätze der Glühwürmchen"""
    import json
    sky = os.path.join(ROOT, 'sky', stil)
    os.makedirs(sky, exist_ok=True)
    house = mesh_model(sky, bake_mesh('Noas Haus', HOUSE_TEX, stil), 'Noas Haus', 'house', stil)
    near = mesh_model(sky, bake_mesh('Nachbarn', NEIGHBOR_TEX, stil), 'Nachbarn', 'neighbors', stil)
    data = {'house': house, 'neighbors': near, 'glow': {'instances': glow_spots()},
            'hd': {'house': {'texture': 'file:house_hd.jpg'}, 'neighbors': {'texture': 'file:neighbors_hd.jpg'}}}
    with open(os.path.join(sky, 'ebenen.json'), 'w', encoding='utf-8') as fh:
        json.dump(data, fh, separators=(',', ':'))
    return {'haus_ecken': house['n'], 'nachbarn_ecken': near['n']}
