# Baut die Blender-Szene „Im Vulkan“ (Skybox volcano, PLAN 1.2), realistisch gerendert und danach gemalt wie der
# Strand. Über den Blender-MCP: wald_mcp.neu('volcano') baut sie und speichert tools/blender/volcano.blend; einzelne
# Teile neu mit wald_mcp.scene('volcano').replace_…(). Ohne MCP headless mit denselben Skripten (wald_mcp.run).
# Vorbilder: Nyiragongo (Lavasee aus dunkler Kruste mit glühenden Rissen) und Masaya (steile, waagrecht geschichtete
# Kraterwände mit Absätzen und Überhängen, unten orange von der Lava angeleuchtet, oben kühl und heller verwittert);
# gemalt wie eine Anime-Landschaft: grosse, klar begrenzte Flächen, kühle Schatten gegen warmes Licht.
# Aufbau: Das Brett schwebt im Schlot über dem Lavasee (LAVA_Z). Am Ufer eine niedrige Schutthalde (TALUS), darüber
# die Wand in zwei Stufen mit einem schmalen Absatz (TIER1) bis zum Rand (RIM), dahinter flach. Im Grundriss besteht
# sie aus geraden Flächen (plan): Rippen und Buchten, dazu V-förmige Rinnen (GULLIES) mit Schuttkegeln darunter. In der
# Höhe liegen Bänke (strata) mit eigenem Grundriss und eigener Neigung übereinander, unten unterschnitten, oben
# abgeschrägt, darin dünne Lagen in eigener Farbe; auf den Bänken verkippte Felsflächen (facets), die an scharfen
# Graten aneinanderstossen. Auf Halde und Absatz Felsblöcke wie am Strand (S.boulder, Material wie dort in
# Vulkanfarben). Durch die Öffnung ein rauchiger Nachthimmel; im Krater nur leichter Dunst (Luftperspektive), keine
# Dampfsäulen. Licht: die Lava von unten (Risse leuchten, dazu die Flächenlampe „Glut See“ und die Punktlampe „Glut
# Mitte“, die die Wand von unten anleuchtet), kühl der Mond von oben (Hauptlicht „Oben“): jede Rippe hat so eine warme
# und eine kühle Seite.
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
FOOT = 25.0           # mittlerer Radius, an dem die Schutthalde in den See taucht
LAVA_GAME = 22.0      # bis hier zeichnet das Spiel den See (radius von lavaPool), voll deckend bis LAVA_GAME − 2.5
TALUS = 0.72          # Neigung der Schutthalde (Höhe je Meter waagrecht, um 36°)
TIER1 = 46.0          # Absatz zwischen den beiden Stufen der Wand (m über der Lava, je Richtung ±6 m)
RIM = 94.0            # Rand über der Lava (je Richtung ±12 m, an Rinnen tiefer); dahinter flach
LEAN = 0.14           # die Wand neigt sich nach hinten (m waagrecht je m Höhe)
R_REF = 40.0          # Bezugsradius für Längen entlang der Wand (Rippen, Rinnen, Felsflächen)
SEG = 2048            # Spalten des Gitters rundum
DH = 0.2              # Zeilenabstand der Wand (m), je Spalte gleich: Bänke und Lagen enden ohne Treppen
DIP = 3.0             # die Bänke wellen rundum um bis zu so viel (m); die Zeilen des Gitters wellen mit
EXTENT = 700.0
TOP = Vector((-0.45, 0.52, 0.72)).normalized()   # kühles Licht von oben (Hauptlicht fürs Spiel)
B1, B2 = Perlin(503), Perlin(509)
G2, G3, G4, G5, G6, G7, G8 = (Perlin(s) for s in (523, 541, 547, 557, 563, 569, 571))


def sc():
    return bpy.context.scene


def link(name, data, coll=None):
    ob = bpy.data.objects.new(name, data)
    (coll or sc().collection).objects.link(ob)
    return ob


# ---------------------------------------------------------------- Kraterwand

def foot_radius(th):
    """Fuss der Schutthalde je Richtung (Bogenmass, von +y über +x): Buchten und Vorsprünge"""
    c, s = np.cos(th), np.sin(th)
    return FOOT + 2.5 * fbm(B1, c * 1.3 + 7, s * 1.3 - 4, 3) + 1.0 * fbm(B2, c * 4.0, s * 4.0, 2)


def ring(P, th, f, octaves=3):
    """Rauschen rundum ohne Naht, gut 6 · f Wellen je Umlauf"""
    return fbm(P, np.cos(th) * f + 3.7, np.sin(th) * f - 1.9, octaves)


def plan(rng, spacing, amp, alternate=False, irregular=0.0):
    """Grundriss aus geraden Flächen: Ecken entlang der Wand (m bei R_REF) im mittleren Abstand spacing, je Ecke ein
    Versatz nach aussen (m, Streuung amp; alternate: abwechselnd vor und zurück, also Rippen und Buchten). irregular:
    Streuung der Abstände (lognormal); dazu wechselt die Stärke entlang der Wand (ruhige und wilde Abschnitte), und die
    Folge vor/zurück bricht ab und zu ab. Für np.interp, mit je einer Ecke vor und nach der Naht"""
    Lu = 2 * np.pi * R_REF
    if irregular:
        gaps = spacing * np.clip(rng.lognormal(0.0, irregular, int(4 * Lu / spacing)), 0.25, 3.0)
        n = max(6, int(np.searchsorted(np.cumsum(gaps), Lu)))
        u = np.sort((np.cumsum(gaps[:n]) / gaps[:n].sum() * Lu + rng.uniform(0, Lu)) % Lu)
        ce = np.sort(rng.uniform(0, Lu, 6)); cv = rng.uniform(0.25, 1.6, 6)
        env = np.interp(u, np.concatenate([[ce[-1] - Lu], ce, [ce[0] + Lu]]), np.concatenate([[cv[-1]], cv, [cv[0]]]))
    else:
        n = max(6, int(Lu / spacing))
        u = np.sort(((np.arange(n) + rng.uniform(-0.3, 0.3, n)) * Lu / n + rng.uniform(0, Lu)) % Lu)
        env = np.ones(n)
    o = rng.normal(0, amp, n) * env
    if alternate:
        turn = rng.random(n) < (0.75 if irregular else 1.0)       # meist wechselt die Richtung, nicht immer
        sign = np.cumprod(np.where(turn, -1.0, 1.0))
        o = np.abs(o) * sign + rng.normal(0, 0.3 * amp, n) * env
    return np.concatenate([[u[-1] - Lu], u, [u[0] + Lu]]), np.concatenate([[o[-1]], o, [o[0]]])


def _gullies(seed=37, n=8):
    """Rinnen, unregelmässig verteilt (mindestens 14 m auseinander): Mitte (m entlang der Wand), halbe Breite links und
    rechts, Tiefe (m), Ansatz über der Halde (m; manche beginnen erst weit oben und haben kaum Schutt darunter), Grösse
    und Breite ihres Schuttkegels"""
    rng = np.random.default_rng(seed)
    Lu = 2 * np.pi * R_REF
    c = []
    while len(c) < n:
        x = rng.uniform(0, Lu)
        if all(abs((x - y + Lu / 2) % Lu - Lu / 2) > 14.0 for y in c):
            c.append(x)
    start = np.where(rng.random(n) < 0.35, rng.uniform(12.0, 35.0, n), 0.0)
    return dict(c=np.array(c), wl=rng.uniform(3.0, 12.0, n), wr=rng.uniform(3.0, 12.0, n), d=rng.uniform(3.0, 15.0, n),
                start=start, cone=rng.uniform(0.3, 1.5, n) * np.where(start > 0, 0.3, 1.0), spread=rng.uniform(1.6, 3.4, n))


PLAN = plan(np.random.default_rng(13), 15.0, 4.5, alternate=True, irregular=0.7)   # Rippen und Buchten der Wand
GULLIES = _gullies()


def gully(th):
    """Rinnen an der Stelle th: Anteil der nächsten (0 … 1, V-förmig: die Seiten sind ebene Flächen), Tiefe (m) und
    Ansatz über der Halde (m) der tiefsten, Höhe des Schuttkegels darunter (0 … 1.5)"""
    G = GULLIES
    Lu = 2 * np.pi * R_REF
    du = (np.mod(th, 2 * np.pi)[..., None] * R_REF - G['c'] + Lu / 2) % Lu - Lu / 2
    w = np.where(du < 0, G['wl'], G['wr'])
    v = np.clip(1 - np.abs(du) / w, 0, 1)
    k = np.argmax(v * G['d'], -1)[..., None]
    cone = (np.clip(1 - np.abs(du) / (w * G['spread']), 0, 1) ** 1.5 * G['cone']).max(-1)
    return v.max(-1), np.take_along_axis(v * G['d'], k, -1)[..., 0], G['start'][k[..., 0]], cone


def columns(th):
    """Aufbau der Wand je Richtung th: Fuss rf (die Halde taucht in die Lava), Rinne g (0 … 1) mit Tiefe gd und Ansatz
    gs, Höhe der Halde ht (unter Rinnen Kegel, sonst je Gegend breite Fächer oder fast nichts), Fuss der Wand rc (Rippen
    und Buchten, dazu grosse Bögen), Absatz h1 und seine Breite w1, Rand h2"""
    rf = foot_radius(th)
    g, gd, gs, cone = gully(th)
    ht = np.maximum(1.0, 2.5 + 7.0 * cone + 4.0 * smoothstep(-0.3, 0.3, ring(G6, th, 1.3))
                    + 1.2 * ring(G2, th, 9.0, 2))
    bay = 5.0 * ring(G7, th, 0.45, 2)                # grosse Buchten und Vorsprünge
    rc = np.maximum(rf + ht / TALUS + np.interp(np.mod(th, 2 * np.pi) * R_REF, *PLAN) + bay, rf + 2.0)
    h1 = TIER1 + 6.0 * ring(G3, th, 1.5) - 4.0 * g
    w1 = np.clip(1.0 + 7.0 * (0.5 + 0.5 * ring(G4, th, 2.5)), 0.6, 9.0)
    h2 = RIM + 12.0 * ring(G5, th, 1.2) + 5.0 * ring(G5, th, 4.0, 2) - 16.0 * g
    return dict(rf=rf, g=g, gd=gd, gs=gs, ht=ht, rc=rc, h1=h1, w1=w1, h2=h2)


def wall_base(C, h, tier=1):
    """Radius der Wand ohne die Bänke in der Höhe h: vom Fuss rc nach hinten geneigt, in Rinnen ab ihrem Ansatz nach
    oben immer tiefer; die obere Stufe um die Breite des Absatzes weiter hinten"""
    h0 = C['ht'] + C['gs']
    r = C['rc'] + LEAN * (h - C['ht']) + C['gd'] * smoothstep(h0, h0 + 14.0, h)
    return r + C['w1'] if tier == 2 else r


def talus_height(r, x, y, C):
    """Höhe der Schutthalde über der Lava (unter dem See negativ), am Fuss der Wand ohne Höcker"""
    s = np.clip((r - C['rf'] + 4.0 / TALUS) / (C['rc'] - C['rf'] + 4.0 / TALUS), 0, 1)
    return C['ht'] * (r - C['rf']) / (C['rc'] - C['rf']) + 0.35 * fbm(G3, x * 0.18, y * 0.18, 3) * np.sin(np.pi * s)


# Grundfarben der Bänke (linear): unten dunkel und rotbraun, nach oben grauer und heller verwittert
PAL = {'basalt': (0.048, 0.043, 0.045), 'braun': (0.085, 0.064, 0.056), 'schlacke': (0.115, 0.050, 0.034),
       'asche': (0.150, 0.134, 0.124), 'hell': (0.255, 0.232, 0.212)}
PAL_NAMES = ('basalt', 'braun', 'schlacke', 'asche', 'hell')


def strata(seed=91):
    """Bänke von unten nach oben, je 5 … 16 m: eigener Grundriss aus geraden Flächen (zickzack um den der ganzen Wand),
    eigene Neigung (lean), unten unterschnitten, oben abgeschrägt (bevel); darin dünne Lagen (Unterkanten lz) mit
    kleinen Stufen und Farbe"""
    rng = np.random.default_rng(seed)
    out = []
    z = -10.0 - DH / 2                        # Grenzen immer zwischen zwei Zeilen des Gitters (Vielfache von DH)
    while z < RIM + 40.0:
        thick = round(rng.uniform(5.0, 16.0) / DH) * DH
        up = float(smoothstep(15.0, RIM, z + thick / 2))
        w = np.array((0.4 - 0.3 * up, 0.3, 0.25 - 0.15 * up, 0.1 + 0.25 * up, 0.02 + 0.3 * up)); w = w / w.sum()
        lz = [0.0]
        while lz[-1] < thick:
            lz.append(lz[-1] + max(1, round(rng.lognormal(0.0, 0.6) / DH)) * DH)
        lz = np.array(lz[:-1])
        nl = len(lz)
        base = np.array(PAL[PAL_NAMES[rng.choice(5, p=w)]])
        other = np.array([PAL[PAL_NAMES[i]] for i in rng.choice(5, nl, p=w)])
        col = np.where((rng.random(nl) < 0.08)[:, None], other, base[None]) * rng.uniform(0.94, 1.06, nl)[:, None]
        wild = 1.2 * rng.uniform(0.3, 1.6)            # wie stark diese Bank vor und zurück springt
        out.append(dict(z0=z, thick=thick, lean=rng.uniform(-0.12, 0.35), plan=plan(rng, 9.0, wild, True, 0.6),
                        bevel=rng.uniform(0.5, 1.5), lz=lz, step=rng.uniform(-0.3, 0.3, nl) * (rng.random(nl) < 0.35),
                        col=col))
        z += thick
    return out


FACET = (8.0, 3.2)    # grosse Felsflächen: mittlerer Abstand ihrer Mitten entlang der Wand und in der Höhe (m)
FINER = [((2.5, 1.2), 0.5)]   # kleinere Felsflächen darauf (Grösse, Anteil): Fels bricht in jeder Grösse
CONE = 0.3            # jede Fläche steigt von ihrer Mitte weg an (m je m): sie bleibt meist bei ihrer Mitte
_T = np.random.default_rng(77)
FACETS = dict(off=_T.normal(0, 0.5, 8192), tu=_T.uniform(-0.35, 0.35, 8192), th=_T.uniform(-0.3, 0.5, 8192),
              tone=_T.uniform(0.88, 1.12, 8192))


def _lattice(size, seed, nh=400):
    """Zitterndes Gitter rundum ohne Naht (Zeilen von −20 m an): Abstände, Anzahl, Lage der Mitten in den Zellen"""
    Lu = 2 * np.pi * R_REF
    nu = int(round(Lu / size[0]))
    rng = np.random.default_rng(seed)
    return Lu / nu, size[1], nu, nh, rng.uniform(0.1, 0.9, (nu, nh)), rng.uniform(0.1, 0.9, (nu, nh))


def _around(u, h, size, seed, reach=2):
    """Die Mitten um jede Stelle (bis reach Zellen weit): (Nummer der Zelle, Abstand du, dh in m)"""
    su, sh, nu, nh, JU, JH = _lattice(size, seed)
    i0 = np.floor(u / su).astype(int); j0 = np.floor((h + 20.0) / sh).astype(int)
    for di in range(-reach, reach + 1):
        for dj in range(-reach, reach + 1):
            i = (i0 + di) % nu; j = np.clip(j0 + dj, 0, nh - 1)
            yield i * nh + j, u - (i0 + di + JU[i, j]) * su, h - ((j + JH[i, j]) * sh - 20.0)


def facets(u, h, k, size=FACET, seed=5):
    """Felsflächen: um jede Mitte des Gitters eine eigene, verkippte Ebene je Bank k; die Wand folgt der jeweils
    vordersten (Minimum des Versatzes nach aussen), so stossen die Flächen an scharfen Graten aneinander, ohne Fugen.
    Versatz (m nach aussen) und Schlüssel der Fläche (für die Farbe). Der Anstieg von der Mitte weg (CONE) hält jede
    Fläche bei ihrer Mitte: Gewänne eine Ebene von ausserhalb der geprüften Zellen, spränge die Wand an den Linien des
    Gitters."""
    F = FACETS
    o = np.full(u.shape, np.inf); key = np.zeros(u.shape, int)
    stretch = size[0] / size[1]
    for c, du, dh in _around(u, h, size, seed):
        q = (c * 7919 + k * 104729) % 8192
        v = F['off'][q] + F['tu'][q] * du + F['th'][q] * dh + CONE * np.hypot(du, dh * stretch)
        key = np.where(v < o, q, key); o = np.minimum(v, o)
    return o, key


def relief(th, h, L):
    """Versatz der Wand nach aussen (m) und Grundfarbe an den Stellen (th, h) aus den Bänken L: je Bank ihr Grundriss,
    ihre Neigung und Lagen; darauf Felsflächen in drei Grössen, an den Bänken abgeschnitten"""
    u = np.mod(th, 2 * np.pi) * R_REF
    k = np.clip(np.searchsorted([b['z0'] for b in L], h, 'right') - 1, 0, len(L) - 1)   # waagrecht, zwischen Zeilen
    o, key = facets(u, h, k)
    for n, (size, amp) in enumerate(FINER):
        o = o + amp * facets(u, h, k, size, 6 + n)[0]
    col = np.zeros(h.shape + (3,))
    for i, b in enumerate(L):
        m = k == i
        if not m.any():
            continue
        d = h[m] - b['z0']
        j = np.clip(np.searchsorted(b['lz'], d, 'right') - 1, 0, len(b['lz']) - 1)
        o[m] += (np.interp(u[m], *b['plan']) + b['lean'] * (d - 0.5 * b['thick']) + b['step'][j]
                 + 0.9 * (1 - smoothstep(0.0, 0.7, d))                 # unten unterschnitten
                 + b['bevel'] * smoothstep(b['thick'] - b['bevel'], b['thick'], d))   # oben abgeschrägt
        col[m] = b['col'][j] * FACETS['tone'][key[m]][:, None]
    return o, col


def scree_color(x, y, h):
    """Schutt: dunkler Basalt bis Braun, gefleckt, oben heller wie die verwitterten Schichten"""
    n = 0.5 + 0.5 * fbm(G4, x * 0.35, y * 0.35, 3)
    a, b = np.array(PAL['basalt']), np.array(PAL['braun'])
    col = a + np.clip(1.4 * n, 0, 1)[..., None] * (b - a)
    pale = smoothstep(30.0, RIM, h)[..., None]
    return col * (1 - pale) + np.array(PAL['asche']) * pale


ROWS = dict(halde=28, absatz=10, rand=6, weit=40)   # Zeilen ausserhalb der Wand


def wall_mesh():
    """Kraterwand als ein Gitter: je Richtung ein Profil von unter der Lava über Halde, untere Stufe, Absatz, obere
    Stufe und Rand bis weit hinaus. Attribute h (m über der Lava), cliff (1 an der Wand), albedo (Grundfarbe)"""
    th = np.arange(SEG) * 2 * np.pi / SEG
    C = columns(th)
    L = strata()
    sn, cs = np.sin(th), np.cos(th)
    R, H, K, A = [], [], [], []

    def flat(r, h):   # Halde, Absatz, Rand: ohne Schichten
        R.append(r); H.append(h); K.append(np.zeros_like(r)); A.append(scree_color(r * sn, r * cs, h))

    dip = DIP * ring(G8, th, 0.6, 2)                  # die Bänke wellen sanft rundum

    def tier(h0, h1, which):   # Zeilen auf festen Höhen über der Welle dip; ausserhalb der Stufe auf deren Enden gelegt
        rows = np.arange(np.floor((h0 - dip).min() / DH), np.ceil((h1 - dip).max() / DH) + 1)[:, None] * DH
        h = np.clip(rows + dip, h0, h1)
        o, col = relief(np.broadcast_to(th, h.shape), h - dip, L)
        r = wall_base(C, h, which) + o * smoothstep(h0, h0 + 1.2, h)   # die Bänke treten aus der Halde hervor
        R.append(r); H.append(h); K.append(np.ones_like(r)); A.append(col)

    s = np.linspace(0, 1, ROWS['halde'], endpoint=False)[:, None]
    r = C['rf'] - 4.0 / TALUS + s * (C['rc'] - C['rf'] + 4.0 / TALUS)
    flat(r, talus_height(r, r * sn, r * cs, C))
    tier(C['ht'], C['h1'], 1)
    o1, _ = relief(th, C['h1'] - dip, L)
    r0 = wall_base(C, C['h1'], 1) + o1                  # Kante der unteren Stufe
    h1b = C['h1'] + 0.15 * C['w1']
    r1 = wall_base(C, h1b, 2)                           # Fuss der oberen Stufe
    s = np.linspace(0, 1, ROWS['absatz'], endpoint=False)[:, None]
    r = r0 + s * (r1 - r0)
    flat(r, C['h1'] + s * (h1b - C['h1']) + 0.2 * fbm(G5, r * sn * 0.3, r * cs * 0.3, 2) * np.sin(np.pi * s))
    tier(h1b, C['h2'], 2)
    r2 = wall_base(C, C['h2'], 2)                       # Kante oben ohne den letzten Vorsprung: der Rand rundet ab
    s = np.linspace(0, 1, ROWS['rand'], endpoint=False)[:, None]
    flat(r2 + 4.0 * s, C['h2'] + 0.8 * np.sin(0.5 * np.pi * s))
    s = np.linspace(0, 1, ROWS['weit'])[:, None]
    r = (r2 + 4.0) * ((EXTENT / (r2 + 4.0)) ** s)
    flat(r, C['h2'] + 0.8 + 0.03 * (r - r2 - 4.0) + 3.0 * fbm(G6, r * sn * 0.01, r * cs * 0.01, 3) * smoothstep(0, 40, r - r2))
    R = np.concatenate(R); H = np.concatenate(H); K = np.concatenate(K); A = np.concatenate(A)
    nr = len(R)
    V = np.stack([R * sn, R * cs, LAVA_Z + H], -1).reshape(-1, 3)
    i = np.arange(nr - 1)[:, None] * SEG; j = np.arange(SEG)[None]
    a = i + j; b = i + (j + 1) % SEG
    F = np.stack([a, b, b + SEG, a + SEG], -1).reshape(-1, 4)   # Normale zur Mitte hin bzw. nach oben
    P = V.reshape(nr, SEG, 3)
    same = np.all(np.abs(P[1:] - P[:-1]) < 1e-6, -1)           # Zeile fällt auf die vorige (Enden der Stufen)
    F = F[~(same & np.roll(same, -1, 1)).ravel()]               # Flächen ohne Inhalt weg
    me = make_mesh('Kraterwand', V, F)
    me.set_sharp_from_angle(angle=math.radians(25))   # Flächen der Bänke glatt, ihre Kanten scharf
    S.attrs(me, h=H.ravel(), cliff=K.ravel())
    ca = me.color_attributes.new('albedo', 'FLOAT_COLOR', 'POINT')
    ca.data.foreach_set('color', np.concatenate([A.reshape(-1, 3), np.ones((A.size // 3, 1))], 1).astype(np.float32).ravel())
    log('Kraterwand', len(V), 'Ecken,', len(L), 'Bänke')
    return me


def mat_wall():
    """Grundfarbe aus dem Gitter (albedo: Bänke, Lagen, Felsflächen, Schutt), gefleckt; an der Wand (cliff 1) leicht
    rau, der Schutt (cliff 0) körnig, knapp über der Lava glüht er; Schatten nie ganz schwarz (bläuliches Grundlicht wie
    bei den Blöcken)"""
    m = bpy.data.materials.new('Wand'); m.use_nodes = True
    t = NT(m.node_tree)
    out = t.node('ShaderNodeOutputMaterial')
    bsdf = t.node('ShaderNodeBsdfPrincipled', in_Roughness=0.92)
    geo = t.node('ShaderNodeNewGeometry')
    pos = geo.outputs['Position']
    alb = t.node('ShaderNodeAttribute'); alb.attribute_name = 'albedo'
    ah = t.node('ShaderNodeAttribute'); ah.attribute_name = 'h'
    ac = t.node('ShaderNodeAttribute'); ac.attribute_name = 'cliff'
    h, cliff = ah.outputs['Fac'], ac.outputs['Fac']
    n1 = t.node('ShaderNodeTexNoise', in_Scale=0.4, in_Detail=2.0); t.link(pos, n1.inputs['Vector'])
    mottle = t.node('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=3.0); t.link(pos, mottle.inputs['Vector'])
    tone = t.math('MULTIPLY', t.maprange(n1.outputs['Fac'], 0.35, 0.65, 0.9, 1.1),
                  t.maprange(mottle.outputs['Fac'], 0.3, 0.7, 0.88, 1.1))
    col = t.vmath('MULTIPLY', alb.outputs['Color'], tone)
    t.link(col, bsdf.inputs['Base Color'])
    vor = t.node('ShaderNodeTexVoronoi', in_Scale=3.0); t.link(pos, vor.inputs['Vector'])
    rough = t.node('ShaderNodeTexNoise', in_Scale=1.2, in_Detail=6.0); t.link(pos, rough.inputs['Vector'])
    wall_h = t.math('MULTIPLY', rough.outputs['Fac'], 0.3)
    bmp = t.node('ShaderNodeBump', in_Distance=0.1)
    t.link(t.math('SUBTRACT', 0.8, t.math('MULTIPLY', cliff, 0.3)), bmp.inputs['Strength'])
    t.link(t.mix(cliff, vor.outputs['Distance'], wall_h), bmp.inputs['Height'])
    t.link(bmp.outputs['Normal'], bsdf.inputs['Normal'])
    n2 = t.node('ShaderNodeTexNoise', in_Scale=1.6, in_Detail=4.0); t.link(pos, n2.inputs['Vector'])
    splash = t.math('MULTIPLY', t.maprange(h, 0.9, 0.1), t.maprange(n2.outputs['Fac'], 0.4, 0.6))
    glow = t.vmath('MULTIPLY', t.mix(splash, (0.9, 0.10, 0.02, 1), (1.0, 0.30, 0.04, 1)), t.math('MULTIPLY', splash, 5.0))
    amb = t.vmath('MULTIPLY', col, (0.55 * ROCK_AMBIENT, 0.65 * ROCK_AMBIENT, ROCK_AMBIENT))
    t.link(t.vmath('ADD', glow, amb), bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1.0
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


TEMPLATES = 16


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


def boulder_points(n_talus=8000, n_base=1500, n_giant=30, n_bench=900, seed=71):
    """Blöcke auf der Schutthalde: in Gruppen (Dichte nach einem Rauschfeld), je Gegend grob (Bergsturz) oder fein, am
    Fuss grösser (grosse Blöcke rollen weiter), oben am Fuss der Wand frisch abgebrochene, dazu einzelne Riesenblöcke;
    auf dem Absatz kleinere. Lage (x, y, z Blender), Vorlage, Grösse je Achse (m), Drehung (Euler, leicht gekippt)"""
    rng = np.random.default_rng(seed)
    n = n_talus + n_base + n_giant
    th = rng.uniform(0, 2 * np.pi, n)
    C = columns(th)
    s = np.concatenate([rng.random(n_talus) ** 1.3, rng.uniform(0.82, 1.0, n_base), rng.uniform(0.0, 0.5, n_giant)])
    r = C['rf'] - 0.5 + s * (C['rc'] - C['rf'] - 0.1)
    x, y = r * np.sin(th), r * np.cos(th)
    dens = 0.5 + 0.5 * fbm(G3, x * 0.07 + 11.0, y * 0.07 - 5.0, 3)
    keep = rng.random(n) < np.clip(1.6 * dens - 0.2, 0.05, 1.0)
    keep[n - n_giant:] = True
    grain = 0.55 + 1.1 * smoothstep(-0.3, 0.4, fbm(G4, x * 0.05 - 7.0, y * 0.05 + 3.0, 2))   # grob oder fein
    size = np.clip(rng.lognormal(0.0, 0.55, n) * grain * (0.7 + 1.5 * (1 - s)), 0.3, 4.0)
    size[n - n_giant:] = rng.uniform(3.5, 7.0, n_giant)
    z = LAVA_Z + talus_height(r, x, y, C) - 0.3 * size
    tb = rng.uniform(0, 2 * np.pi, n_bench)
    Cb = columns(tb)
    rb = wall_base(Cb, Cb['h1'], 1)
    rr = rb + 0.6 + rng.random(n_bench) * (Cb['w1'] - 0.9)
    sb = np.clip(rng.lognormal(0.0, 0.5, n_bench) * 0.8, 0.3, 2.5)
    zb = LAVA_Z + Cb['h1'] + 0.15 * (rr - rb) - 0.3 * sb
    on = Cb['w1'] > 1.5
    pos = np.concatenate([np.stack([x, y, z], -1)[keep], np.stack([rr * np.sin(tb), rr * np.cos(tb), zb], -1)[on]])
    size = np.concatenate([size[keep], sb[on]])
    m = len(pos)
    scl = size[:, None] * np.stack([rng.uniform(1.0, 1.7, m), rng.uniform(0.8, 1.3, m), rng.uniform(0.5, 1.0, m)], -1)
    rot = np.stack([rng.normal(0, 0.25, m), rng.normal(0, 0.25, m), rng.uniform(0, 2 * np.pi, m)], -1)
    return pos, rng.integers(TEMPLATES, size=m), scl, rot


def build_boulders():
    coll = build_templates()
    pos, var, scl, rot = boulder_points()
    me = S.points('Bloecke', pos, var, scl, rot)
    ob = link('Bloecke', me)
    mod = ob.modifiers.new('Bloecke', 'NODES')
    mod.node_group = S.instancer('Bloecke verteilen', coll)
    log('Blöcke', len(pos))


def build_wall():
    me = wall_mesh()
    me.materials.append(mat_wall())
    link('Kraterwand', me)
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
GLOW_CORE = 6e4       # Glühen aus dem See (W): Punktlampe über der Mitte, leuchtet die Wand von unten an
TOP_STRENGTH = 3.0
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
    ld = bpy.data.lights.new('Glut Mitte', 'POINT'); ld.shadow_soft_size = 10.0
    ld.energy = GLOW_CORE; ld.color = (1.0, 0.36, 0.10)
    ob = link('Glut Mitte', ld)
    ob.location = (0.0, 0.0, LAVA_Z + 2.0)
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
    build_wall()
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
    _remove(['Kraterwand', 'Bloecke', 'Felsen nah', 'See'])
    build_wall()
    build_rim_rocks()
    build_lake()


def replace_world():
    old = sc().world
    world()
    if old:
        bpy.data.worlds.remove(old)
    _remove(['Oben', 'Glut See', 'Glut Mitte'])
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
