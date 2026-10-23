# Pflanzenmodelle der Strand-Skybox (PLAN 2.33): Kokospalme, Laubbaum, Busch, Grasbüschel, Felsblock. Jedes Modell hat
# die Höhe 1 (Fuss im Ursprung, Blender-Achsen: z oben); die Instanzen skalieren es (Breite, Breite, Höhe). Blätter und
# Fiedern sind Geometrie (kleine Vielecke, keine Textur mit Alpha): So zeichnen Blender und das Spiel dasselbe, und
# Cycles braucht keine durchsichtigen Flächen.
# Rückgabe je Modell: dict V (Ecken), F (Flächen, Listen von Eckennummern), M (Material je Fläche), T (Ton je Ecke 0…1:
# Farbschwankung der Blätter, beim Stamm Ringe), P (Teile, die das Spiel kompakt speichert: [(Form, erste Ecke, …)],
# Form 'blatt' = Sechseck wie leaf(), 'fieder' = Streifen aus fünf Ecken, 'rohr' = tube() mit Ringen und Ecken je
# Ring). Material: 0 Stamm/Rinde, 1 Laub, 2 dürres Laub, 3 Frucht.
# detail: 1 wie im Panorama (auch das Spiel, seit PLAN 2.38), kleiner: weniger Fiedern und Blätter, gleiche Form.
import numpy as np

LEAF_FACES = [[0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5]]   # Blatt: Grund, Schulter, Schulter, Spitze, …
STRIP_FACES = [[0, 1, 2, 3], [3, 2, 4]]                       # Fieder, Halm: zwei am Grund, zwei in der Mitte, Spitze


class Builder:
    def __init__(self):
        self.V, self.F, self.M, self.T, self.P = [], [], [], [], []

    def add(self, verts, faces, mat, tone, form=None):
        o = len(self.V)
        if form:
            self.P.append((form, o) if isinstance(form, str) else (form[0], o, *form[1:]))
        self.V.extend(np.asarray(verts, float).tolist())
        self.F.extend([[i + o for i in f] for f in faces])
        self.M.extend([mat] * len(faces))
        self.T.extend(np.broadcast_to(np.asarray(tone, float), (len(verts),)).tolist())

    def tube(self, pts, radii, sides, mat, tone=0.5, rings=None):
        """Rohr entlang pts mit Radius je Punkt; rings: Ton je Punkt (Ringe am Palmstamm)"""
        pts = np.asarray(pts, float); n = len(pts)
        tan = np.gradient(pts, axis=0); tan /= np.linalg.norm(tan, axis=1)[:, None]
        ref = np.array([1.0, 0.0, 0.0]) if abs(tan[0][2]) > 0.9 else np.array([0.0, 0.0, 1.0])
        verts, tones = [], []
        a = np.arange(sides) * 2 * np.pi / sides
        u = None
        for i in range(n):
            # Querachse von Ring zu Ring mitgeführt (nur senkrecht zur neuen Richtung gestellt): Das Rohr verdreht sich
            # nicht. (Vorher drehte sich jeder Ring um 90°, die Stämme sahen gewunden aus wie Kordeln.)
            u = np.cross(tan[i], ref) if u is None else u - tan[i] * np.dot(tan[i], u)
            u /= np.linalg.norm(u) + 1e-12
            v = np.cross(tan[i], u)
            ring = pts[i] + radii[i] * (np.cos(a)[:, None] * u + np.sin(a)[:, None] * v)
            verts.extend(ring)
            tones.extend([tone if rings is None else rings[i]] * sides)
        faces = [[i * sides + k, i * sides + (k + 1) % sides, (i + 1) * sides + (k + 1) % sides, (i + 1) * sides + k]
                 for i in range(n - 1) for k in range(sides)]
        self.add(verts, faces, mat, tones, ('rohr', n, sides))

    def leaf(self, base, along, side, length, width, fold, mat, tone):
        """Blatt als Sechseck: Grund, zwei Schultern, Spitze; entlang der Mittelrippe leicht gefaltet (fold)"""
        n = np.cross(along, side)
        lift = n * width * fold
        p = [base, base + along * length * 0.3 + side * width * 0.5 + lift, base + along * length * 0.72 + side * width * 0.42 + lift,
             base + along * length, base + along * length * 0.72 - side * width * 0.42 + lift,
             base + along * length * 0.3 - side * width * 0.5 + lift]
        self.add(p, LEAF_FACES, mat, tone, 'blatt')

    def result(self):
        """Fuss bei z = 0 (was darunter hängt, zählt mit), Höhe 1"""
        V = np.array(self.V); V[:, 2] -= min(0.0, V[:, 2].min()); V /= V[:, 2].max()
        return {'V': V, 'F': self.F, 'M': np.array(self.M), 'T': np.array(self.T), 'P': self.P}


def _norm(v):
    v = np.asarray(v, float)
    return v / (np.linalg.norm(v) + 1e-12)


def palm(seed, detail=1.0):
    """Kokospalme: schlanker, gebogener Stamm (lehnt in +x) mit Ringen und verdicktem Fuss; Schopf aus Wedeln – oben
    jung und steil, unten alt, hängend, einzelne dürr; jeder Wedel ein gebogener Stiel mit Fiedern beidseits, die in
    einem V nach unten hängen; Kokosnüsse unter dem Schopf"""
    rng = np.random.default_rng(seed)
    b = Builder()
    bend = rng.uniform(0.10, 0.32)
    wig = rng.normal(0, 0.02, 2)
    def center(t):
        return np.array([bend * t ** 1.7 + wig[0] * np.sin(3 * t), wig[1] * np.sin(2.5 * t), t])
    n = 22
    ts = np.linspace(0, 0.97, n)
    rad = 0.016 * (1 - 0.3 * ts) + 0.014 * np.exp(-ts * 18)
    rings = ts / ts.max()   # Ton am Stamm = Lage entlang des Stamms: unten dunkler, oben heller; das Material zeichnet
                            # daraus die feinen Ringe (sie folgen so dem gebogenen Stamm, nicht der Höhe)
    b.tube([center(t) for t in ts] if detail >= 0.8 else [center(t) for t in ts[::2]], rad if detail >= 0.8 else rad[::2],
           7 if detail >= 0.8 else 5, 0, rings=rings if detail >= 0.8 else rings[::2])
    top = center(0.97)
    up = _norm(center(0.97) - center(0.9))
    nf = int(round(rng.integers(15, 20) * min(1.0, 0.45 + 0.55 * detail)))
    npin = max(10, int(34 * detail))
    for f in range(nf):
        age = (f + rng.random() * 0.5) / nf                      # 0 jung (oben), 1 alt (unten)
        dead = age > 0.86 and rng.random() < 0.6
        az = f * 2.39996 + rng.normal(0, 0.15)
        elev = (1.15 - 1.45 * age) + rng.normal(0, 0.08)
        if dead:
            elev = -1.25 + rng.normal(0, 0.15)
        L = 0.40 * rng.uniform(0.85, 1.08) * (0.8 if dead else 1.0)
        droop = (0.25 + 0.75 * age) * L * (0.35 if dead else 1.0)
        d0 = np.array([np.cos(elev) * np.cos(az), np.cos(elev) * np.sin(az), np.sin(elev)])
        base = top - up * 0.012
        def at(u):
            return base + d0 * L * u + np.array([0, 0, -droop * u * u])
        us = np.linspace(0, 1, 9)
        stalk = [at(u) for u in us]
        b.tube(stalk, np.linspace(0.0045, 0.0012, len(us)), 3, 2 if dead else 1, tone=0.3)
        tone_f = rng.uniform(0.2, 0.9)
        for k in range(npin):
            u = 0.14 + 0.84 * (k + rng.random() * 0.4) / npin
            p0 = at(u)
            tan = _norm(at(min(u + 0.02, 1)) - at(max(u - 0.02, 0)))
            side = _norm(np.cross(tan, [0, 0, 1.0]))
            if np.linalg.norm(side) < 0.5:
                side = np.array([1.0, 0, 0])
            upw = _norm(np.cross(side, tan))    # oben am Wedel
            ln = L * 0.27 * np.sin(np.pi * min(1.0, u * 1.02)) ** 0.55 * rng.uniform(0.85, 1.1)
            for sgn in (-1, 1):
                fold = 0.55 + 0.25 * age + rng.normal(0, 0.08)
                if dead:
                    fold = 1.1
                dirp = _norm(side * sgn * np.cos(fold) - upw * np.sin(fold) + tan * 0.35)
                # Fieder: schmaler Streifen in zwei Abschnitten, die Spitze hängt
                w = L * 0.012
                mid = p0 + dirp * ln * 0.55 + np.array([0, 0, -ln * 0.06])
                tip = p0 + dirp * ln + np.array([0, 0, -ln * (0.22 + 0.2 * age)])
                wv = _norm(np.cross(dirp, upw)) * w
                verts = [p0 - wv * 0.6, p0 + wv * 0.6, mid + wv, mid - wv, tip]
                b.add(verts, STRIP_FACES, 2 if dead else 1, (tone_f + rng.normal(0, 0.08)) * (1 - 0.3 * age), 'fieder')
    # Kokosnüsse
    for k in range(int(rng.integers(4, 9))):
        a = rng.uniform(0, 2 * np.pi)
        c = top + np.array([np.cos(a) * 0.022, np.sin(a) * 0.022, -0.03 - rng.random() * 0.025])
        r = 0.011
        ico = _ico()
        b.add(ico[0] * r + c, ico[1], 3, rng.random())
    return b.result()


_ICO = []


def _ico():
    if not _ICO:
        t = (1 + 5 ** 0.5) / 2
        V = np.array([[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
                      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]], float)
        V /= np.linalg.norm(V, axis=1)[:, None]
        F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6],
             [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10],
             [8, 6, 7], [9, 8, 1]]
        _ICO.extend([V, F])
    return _ICO


def _branches(rng, b, start, direction, length, radius, depth, ends, spread, up_bias, sides=5):
    """Ast mit Unterästen (rekursiv); die Enden (Ort, Richtung, Grösse) kommen nach ends. sides: Ecken der Äste
    (fürs Spiel weniger, die Zweige sind dort nur Striche)"""
    d = _norm(direction)
    n = 5 if sides > 3 else 3
    pts = [start + d * length * i / (n - 1) + np.array([0, 0, -0.04 * length * np.sin(np.pi * i / (n - 1))]) for i in range(n)]
    b.tube(pts, np.linspace(radius, radius * 0.6, n), sides if depth > 0 or sides <= 3 else 4, 0)
    end = pts[-1]
    if depth == 0:
        ends.append((end, d, length))
        return
    kids = int(rng.integers(2, 4))
    for k in range(kids):
        a = rng.uniform(0, 2 * np.pi)
        nd = _norm(d + spread * np.array([np.cos(a), np.sin(a), 0]) + np.array([0, 0, up_bias]) + rng.normal(0, 0.15, 3))
        _branches(rng, b, end, nd, length * rng.uniform(0.55, 0.75), radius * 0.6, depth - 1, ends, spread, up_bias, sides)
    ends.append((end, d, length * 0.6))


def broadleaf(seed, detail=1.0, tiers=False):
    """Laubbaum der Küste: Stamm, der sich in drei bis fünf Äste teilt, diese wieder; an den Zweigen Büschel aus
    einzelnen Blättern, nach oben und aussen gewandt (eine lockere, unregelmässige Krone, durch die man Himmel sieht).
    tiers: Etagen waagrechter Äste (wie der Katappenbaum)"""
    rng = np.random.default_rng(seed)
    b = Builder()
    sides = 5 if detail >= 0.8 else 3
    h0 = rng.uniform(0.28, 0.4)
    lean = rng.normal(0, 0.05, 2)
    top = np.array([lean[0], lean[1], h0])
    b.tube([np.zeros(3), top * 0.5, top], [0.035, 0.028, 0.024], 7 if detail >= 0.8 else 5, 0)
    ends = []
    if tiers:
        for lvl in range(3):
            z0 = top + np.array([0, 0, 0.12 * lvl])
            for k in range(int(rng.integers(3, 5))):
                a = rng.uniform(0, 2 * np.pi)
                d = np.array([np.cos(a), np.sin(a), 0.25])
                _branches(rng, b, z0, d, (0.42 - 0.1 * lvl) * rng.uniform(0.8, 1.1), 0.014, 1, ends, 0.6, -0.05, sides)
        b.tube([top, top + np.array([0, 0, 0.36])], [0.02, 0.01], sides, 0)
    else:
        for k in range(int(rng.integers(3, 6))):
            a = k * 2 * np.pi / 5 + rng.normal(0, 0.4)
            d = np.array([np.cos(a) * 0.7, np.sin(a) * 0.7, 1.0])
            _branches(rng, b, top, d, rng.uniform(0.22, 0.32), 0.018, 2, ends, 0.75, 0.35, sides)
    nleaf = int(28 * detail) + 5
    for p, d, ln in ends:
        tone = rng.uniform(0.2, 0.9)
        cr = 0.08 + 0.25 * ln
        for k in range(nleaf):
            q = p + _norm(rng.normal(0, 1, 3) + d * 0.6 + np.array([0, 0, 0.5])) * cr * rng.random() ** 0.5
            along = _norm(rng.normal(0, 1, 3) + (q - p) * 4 + np.array([0, 0, 0.2]))
            side = _norm(np.cross(along, rng.normal(0, 1, 3)))
            size = rng.uniform(0.045, 0.065) * detail ** -0.4   # weniger Blätter: grösser, die Krone bleibt dicht
            b.leaf(q, along, side, size, size * 0.5, 0.25, 1, np.clip(tone + rng.normal(0, 0.12), 0, 1))
    return b.result()


def shrub(seed, detail=1.0, round_leaves=False):
    """Busch (Meertraube, Strandbeere): kurze Stämmchen vom Boden schräg nach aussen, an ihnen dichte Blattbüschel;
    breit und niedrig. round_leaves: runde, grosse Blätter (Meertraube)"""
    rng = np.random.default_rng(seed)
    b = Builder()
    ends = []
    for k in range(int(rng.integers(5, 8))):
        a = rng.uniform(0, 2 * np.pi)
        d = np.array([np.cos(a), np.sin(a), rng.uniform(0.6, 1.3)])
        _branches(rng, b, np.zeros(3), d, rng.uniform(0.35, 0.55), 0.03, 1, ends, 0.5, 0.3, 5 if detail >= 0.8 else 3)
    nleaf = int(16 * detail) + 4
    for p, d, ln in ends:
        tone = rng.uniform(0.3, 1.0)
        for k in range(nleaf):
            q = p + _norm(rng.normal(0, 1, 3) + np.array([0, 0, 0.6])) * 0.22 * rng.random() ** 0.5
            along = _norm(rng.normal(0, 1, 3) + np.array([0, 0, 0.8]))
            side = _norm(np.cross(along, rng.normal(0, 1, 3)))
            size = rng.uniform(0.11, 0.16) * (1.0 if round_leaves else 0.75) * detail ** -0.4
            b.leaf(q, along, side, size, size * (0.9 if round_leaves else 0.45), 0.2, 1, np.clip(tone + rng.normal(0, 0.1), 0, 1))
    return b.result()


def grass(seed, detail=1.0):
    """Grasbüschel (Strandgras): schmale, gebogene Halme aus einem Punkt, aussen flacher"""
    rng = np.random.default_rng(seed)
    b = Builder()
    for k in range(int(28 * detail) + 6):
        a = rng.uniform(0, 2 * np.pi)
        tilt = rng.uniform(0.1, 0.9)
        L = rng.uniform(0.6, 1.0)
        d = np.array([np.cos(a) * np.sin(tilt), np.sin(a) * np.sin(tilt), np.cos(tilt)])
        side = _norm(np.cross(d, [0, 0, 1.0]) + 1e-6)
        w = 0.025
        base = np.array([np.cos(a), np.sin(a), 0]) * rng.uniform(0, 0.08)
        mid = base + d * L * 0.55
        tip = base + d * L + np.array([np.cos(a), np.sin(a), 0]) * L * tilt * 0.4 - np.array([0, 0, L * tilt * 0.35])
        b.add([base - side * w, base + side * w, mid + side * w * 0.7, mid - side * w * 0.7, tip], [[0, 1, 2, 3], [3, 2, 4]],
              1, rng.uniform(0.0, 1.0))
    return b.result()


def vine(seed, detail=1.0):
    """Strandwinde (Ipomoea): Ranken, die flach über den Sand kriechen, mit zweilappigen Blättern an kurzen Stielen;
    flach (die Instanz macht sie gut einen Meter breit und eine Handbreit hoch)"""
    rng = np.random.default_rng(seed)
    b = Builder()
    for k in range(int(rng.integers(4, 7))):
        a = rng.uniform(0, 2 * np.pi)
        L = rng.uniform(2.0, 3.5)
        pts = []
        for i in range(10):
            u = i / 9
            a2 = a + 0.4 * np.sin(u * 4 + k)
            pts.append(np.array([np.cos(a2) * L * u, np.sin(a2) * L * u, 0.02]))
        b.tube(pts, np.full(10, 0.012), 3, 0)
        for i in range(1, int(10 * detail) + 3):
            p = pts[min(9, int(i * 9 / (int(10 * detail) + 2)))]
            along = _norm(np.array([rng.normal(), rng.normal(), 1.2]))
            side = _norm(np.cross(along, rng.normal(0, 1, 3)))
            size = rng.uniform(0.18, 0.26)
            b.leaf(p + rng.normal(0, 0.05, 3) * [1, 1, 0], along, side, size, size * 1.1, 0.35, 1, rng.uniform(0.2, 1.0))
    return b.result()


def driftwood(seed, detail=1.0):
    """Treibholz: ein gebogener, entrindeter Stamm mit Wurzelstock und zwei, drei abgebrochenen Ästen, liegend (Länge
    etwa zehnmal die Dicke; die Instanz gibt Dicke und Länge)"""
    rng = np.random.default_rng(seed)
    b = Builder()
    L = rng.uniform(8, 12)
    n = 10
    pts = [np.array([L * i / (n - 1), 0.3 * np.sin(i * 0.7 + seed), 0.5]) for i in range(n)]
    b.tube(pts, np.linspace(0.5, 0.3, n), 8, 0, tone=rng.uniform(0.3, 0.8))
    for k in range(int(rng.integers(3, 6))):   # Wurzelstock
        a = rng.uniform(0, 2 * np.pi)
        d = np.array([-0.6, np.cos(a), np.sin(a) * 0.6 + 0.3])
        b.tube([pts[0], pts[0] + d * rng.uniform(1.2, 2.0)], [0.25, 0.06], 5, 0, tone=0.6)
    for k in range(int(rng.integers(2, 4))):   # Aststümpfe
        p = pts[int(rng.integers(3, n - 1))]
        d = _norm(np.array([rng.uniform(0.2, 0.8), rng.choice([-1, 1]), rng.uniform(0.0, 0.6)]))
        b.tube([p, p + d * rng.uniform(1.0, 2.2)], [0.16, 0.05], 5, 0, tone=0.6)
    return b.result()


def coconut(seed, detail=1.0):
    """Kokosnuss am Boden (mit Faserhülle, etwas länglich)"""
    rng = np.random.default_rng(seed)
    b = Builder()
    V, F = _ico()
    V = V * np.array([1.0, 0.85, 0.8]) + rng.normal(0, 0.04, V.shape)
    b.add(V, F, 3, rng.uniform(0.2, 0.8))
    return b.result()
