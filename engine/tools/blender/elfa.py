# Elfa modellata in Blender: la stessa elfa di engine/src/characters/villager.js con più dettaglio.
#
# Pilastri che restano uguali (docs/oggetti.md › Umanoidi):
#  - marionetta a pezzi rigidi: ogni pezzo è figlio di un giunto vuoto con lo stesso nome e la stessa posizione
#    dell'elfa del motore (anca, busto, collo, testa, mantello, spallaS/D, gomitoS/D, cosciaS/D, ginocchioS/D),
#    niente pelle che si deforma; le clip villagerClips() funzionano senza modifiche;
#  - proporzioni di ELF (circa 1,9 m, anca a 1,0 m), guarda verso +z (nel motore), piedi a y = 0;
#  - forme morbide in un pezzo (il petto è nella sezione del busto), testa modellata con il volto dipinto,
#    capelli lunghi in un pezzo solo, orecchie a lama, diadema con gemma, corsetto allacciato, colletto alto,
#    spallacci a lamelle, maniche a campana, abito lungo, bracciali, stivali alti, mantello lungo;
#  - i materiali hanno solo un NOME (abito, gonna, mantello, calze, cuoio, cintura, metallo, bordo, pelle,
#    pelle_ombra, capelli, volto, gemma): colori, texture pixel-art e cel shading li rimette il motore
#    (characters/elfa3d.js), così restano le quattro palette e lo stile del gioco.
#
# Uso (Blender come modulo Python, `pip install bpy`):
#   python engine/tools/blender/elfa.py --out engine/assets/elfa.glb [--blend elfa.blend]
# oppure con Blender installato (anche su macOS):
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python engine/tools/blender/elfa.py -- --out engine/assets/elfa.glb
#
# Coordinate: tutto si scrive in coordinate "three" (x destra, y su, z avanti) e si converte in quelle di
# Blender (x, -z, y) quando si crea la mesh; l'esportatore glTF le riporta a y in alto.
import sys, math, argparse
import bpy
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--out', default='elfa.glb')
ap.add_argument('--blend', default=None)
args = ap.parse_args(argv)

PI, TAU = math.pi, 2 * math.pi
sin, cos, exp, sqrt = math.sin, math.cos, math.exp, math.sqrt
def sm(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def tb(p): return (p[0], -p[2], p[1])                       # three → Blender
def V(*a): return Vector(a)

# misure: partono da ELF di villager.js, con le gambe più lunghe e il busto più corto (richiesta dell'autore):
# coscia 0,47 → 0,50, gamba 0,37 → 0,40, anca 1,00 → 1,06, busto 0,50 → 0,46. Finiscono nel modello (userData.misure del nodo
# "elfa"), così il motore e la prova di fumo usano le stesse.
# Confronto con una foto di riferimento (modella in piedi, di fronte, di tre quarti e di schiena), in frazioni dell'altezza:
# ginocchio, vita, bacino e seno erano già giusti; spalle più strette (da 0,20 a 0,165 dal centro) e più basse, collo più lungo
# (0,05 → 0,07), braccia più lunghe (0,30 → 0,34 e 0,27 → 0,32: il gomito arriva alla vita, le dita a metà coscia),
# vita meno stretta (0,11 → 0,125) e cassa toracica un po' più stretta (0,172 → 0,16).
S = dict(hip=1.06, thigh=0.5, shin=0.4, W=0.84, chest=0.16, waist=0.125, hips=0.21, torso=0.46, shoulder=0.165, shoulderDrop=0.05, upper=0.34,
         fore=0.32, skirt=0.5, flare=1.38, neck=0.07, head=0.94, armW=0.8, legW=0.86, bust=1)
# il busto si disegna alto T0 = 0,5, il braccio lungo 0,30 e l'avambraccio 0,27 (le misure dei pezzi sono pensate così):
# build() li allunga o accorcia in altezza (KT, KU, KF); gli spallacci restano come sono
T0 = 0.5; KT = S['torso'] / T0; KU = S['upper'] / 0.3; KF = S['fore'] / 0.27
def scala_y(joint_name, name):
    if joint_name == 'busto': return KT
    if 'spallacc' in name: return 1.0
    if joint_name.startswith('spalla'): return KU
    if joint_name.startswith('gomito'): return KF
    return 1.0
W, hs, aw, lw = S['W'], S['head'], S['armW'], S['legW']

# ---------------------------------------------------------------- scena, materiali, giunti
bpy.ops.wm.read_factory_settings(use_empty=True)
COLL = bpy.context.scene.collection
# colori solo per vedere il modello in Blender o in Godot (palette verde); nel gioco li sostituisce il motore
PREVIEW = {
    'abito': 0x3e5a46, 'gonna': 0x3e5a46, 'mantello': 0x2e4436, 'calze': 0x3a3430, 'cuoio': 0x5a4632, 'cintura': 0x2e2218,
    'metallo': 0xc8c8c0, 'bordo': 0xc8a050, 'pelle': 0xecd6c4, 'pelle_ombra': 0xc2afa0, 'capelli': 0xe8dcb0, 'volto': 0xecd6c4,
    'gemma': 0x6ac8b0, 'lino': 0xd6cab0,
}
MATS = {}
def mat(name):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); h = PREVIEW[name]
    m.diffuse_color = (((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255, 1)
    try:
        m.use_nodes = True; b = m.node_tree.nodes.get('Principled BSDF')
        b.inputs['Base Color'].default_value = m.diffuse_color; b.inputs['Roughness'].default_value = 0.8
        if name in ('metallo', 'bordo'): b.inputs['Metallic'].default_value = 0.85; b.inputs['Roughness'].default_value = 0.35
    except Exception: pass
    MATS[name] = m; return m

J = {}
def joint(name, parent, pos):
    o = bpy.data.objects.new(name, None); o.empty_display_size = 0.04; COLL.objects.link(o)
    if parent: o.parent = J[parent]
    o.location = tb(pos); J[name] = o; return o

joint('elfa', None, (0, 0, 0)); J['elfa']['misure'] = {k: float(v) for k, v in S.items()}
joint('anca', 'elfa', (0, S['hip'], 0))
joint('busto', 'anca', (0, 0.05, 0))
joint('mantello', 'busto', (0, S['torso'], -0.04))
joint('collo', 'busto', (0, S['torso'] - 0.005, 0))
joint('testa', 'collo', (0, S['neck'], 0))
for s in (1, -1):
    L = 'S' if s > 0 else 'D'
    joint('spalla' + L, 'busto', (s * S['shoulder'], S['torso'] - S['shoulderDrop'], 0))
    joint('gomito' + L, 'spalla' + L, (0, -S['upper'], 0))
    joint('coscia' + L, 'anca', (s * (0.088 + 0.02) * W, -0.06, 0))
    joint('ginocchio' + L, 'coscia' + L, (0, -S['thigh'], 0))

# ---------------------------------------------------------------- geometria (in coordinate three)
class Part:
    """vertici, facce, uv per angolo di faccia, materiale e liscio/piatto per faccia"""
    def __init__(s): s.v, s.f, s.uv, s.m, s.flat = [], [], [], [], []
    def add(s, g, mat=None):
        b = len(s.v); s.v += g.v; s.f += [[i + b for i in f] for f in g.f]; s.uv += g.uv
        s.m += [mat or m for m in g.m] if mat else g.m; s.flat += g.flat; return s
    def face(s, f, uv, m, flat=False): s.f.append(f); s.uv.append(uv); s.m.append(m); s.flat.append(flat)
    def xform(s, M):
        s.v = [tuple(M @ Vector(p)) for p in s.v]; return s
    def bvh(s): return BVHTree.FromPolygons([Vector(p) for p in s.v], s.f)

def cr(p0, p1, p2, p3, f):
    f2, f3 = f * f, f * f * f
    return tuple(0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f2 + (-a + 3 * b - 3 * c + d) * f3) for a, b, c, d in zip(p0, p1, p2, p3))

def sec_point(s, a, R, axis):
    sx, cy = sin(a * TAU), cos(a * TAU); b = 1.0
    for a0, amt, sg in s.get('bumps', ()):
        d = a - a0; d -= round(d); b += amt * exp(-(d / sg) ** 2)
    x = math.copysign(abs(sx) ** R, sx) * s['w'] * b + s.get('ox', 0)
    u = math.copysign(abs(cy) ** R, cy) * s['h'] * b + s.get('oy', 0)
    return (x, -s['t'], u) if axis == 'y' else (x, u, s['t'])

def loft(secs, N=32, R=0.9, axis='y', step=0.02, caps=(True, True), uvrep=(3.0, 0.55), deform=None, mat='abito', matf=None, arc=None):
    """come loft() di characters/loft.js, ma con le sezioni raccordate (Catmull-Rom) e molte più righe.
    sezioni: {t, w, h, oy, ox, bumps}; deform(p, a, t) → p; matf(a, t) → nome del materiale della faccia;
    arc=(a0, a1): solo uno spicchio della sezione (in giri), aperto e senza tappi"""
    ring = [arc[0] + (arc[1] - arc[0]) * i / N for i in range(N + 1)] if arc else [i / N for i in range(N)]
    M = len(ring); K = len(secs); keys = [[sec_point(s, a, R, axis) for a in ring] for s in secs]
    rows, ts = [], []
    for j in range(K - 1):
        n = max(1, round(abs(secs[j + 1]['t'] - secs[j]['t']) / step))
        for q in range(n):
            f = q / n; P0, P1, P2, P3 = keys[max(j - 1, 0)], keys[j], keys[j + 1], keys[min(j + 2, K - 1)]
            rows.append([cr(P0[i], P1[i], P2[i], P3[i], f) for i in range(M)]); ts.append(secs[j]['t'] + (secs[j + 1]['t'] - secs[j]['t']) * f)
    rows.append(keys[-1]); ts.append(secs[-1]['t'])
    if deform: rows = [[deform(p, ring[i], ts[r]) for i, p in enumerate(row)] for r, row in enumerate(rows)]
    g = Part(); g.v = [p for row in rows for p in row]; nr, t0 = len(rows), secs[0]['t']
    rev = secs[-1]['t'] < secs[0]['t']; U, vr = uvrep; span = (arc[1] - arc[0]) if arc else 1.0
    vv = lambda r: abs(ts[r] - t0) / vr
    for r in range(nr - 1):
        for i in range(N):
            i2 = i + 1 if arc else (i + 1) % N
            a, b, c, d = r * M + i, r * M + i2, (r + 1) * M + i, (r + 1) * M + i2
            u0, u1 = i / N * U * span, (i + 1) / N * U * span
            f, uv = [a, c, d, b], [(u0, vv(r)), (u0, vv(r + 1)), (u1, vv(r + 1)), (u1, vv(r))]
            if rev: f, uv = f[::-1], uv[::-1]
            am = (ring[i] + (ring[i2] if arc else ring[i] + 1 / N)) / 2
            g.face(f, uv, matf(am, (ts[r] + ts[r + 1]) / 2) if matf else mat)
    for r, start in ((0, True), (nr - 1, False)):
        if arc or not caps[0 if start else 1]: continue
        row = rows[r]; c = tuple(sum(p[k] for p in row) / N for k in range(3)); ci = len(g.v); g.v.append(c)
        for i in range(N):
            a, b = r * N + i, r * N + (i + 1) % N; fl = start != rev
            g.face([ci, a, b] if fl else [ci, b, a], [(0.5, 0.5)] * 3, matf(0.5, ts[r]) if matf else mat)
    return g

def box(c, size, M=None, mat='cuoio'):
    """parallelepipedo (da smussare con il modificatore Bevel di Blender)"""
    sx, sy, sz = (v / 2 for v in size); g = Part()
    g.v = [(c[0] + x * sx, c[1] + y * sy, c[2] + z * sz) for x, y, z in ((-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1))]
    for f in ([0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]): g.face(f, [(0, 0), (1, 0), (1, 1), (0, 1)], mat)
    if M: g.xform(M)
    return g

def taper(t0, t1, w0, h0, w1, h1, bulge=0, n=6, oy0=0, oy1=0):
    out = []
    for k in range(n):
        f = k / (n - 1); b = 1 + bulge * sin(PI * f); e = 0.82 if f in (0, 1) else 1
        out.append(dict(t=t0 + (t1 - t0) * f, w=(w0 + (w1 - w0) * f) * b * e, h=(h0 + (h1 - h0) * f) * b * e, oy=oy0 + (oy1 - oy0) * f))
    return out

def frames(path, closed, up=None):
    n = len(path); T = []
    for k in range(n):
        a = path[k - 1] if (k > 0 or closed) else path[k]; b = path[(k + 1) % n] if (k < n - 1 or closed) else path[k]
        T.append((Vector(b) - Vector(a)).normalized())
    if up: N = [(Vector(u) - Vector(u).dot(t) * t).normalized() for u, t in zip(up, T)]
    else:
        ref = Vector((0, 1, 0)) if abs(T[0].y) < 0.9 else Vector((1, 0, 0)); N = [(ref - ref.dot(T[0]) * T[0]).normalized()]
        for k in range(1, n): v = N[-1] - N[-1].dot(T[k]) * T[k]; N.append(v.normalized())
    return T, N

def tube(path, r, n=6, closed=False, mat='bordo', caps=True, up=None, rx=None):
    """tubo lungo un percorso (lacci, profili, anelli); r può essere una funzione di k/(len-1); rx: sezione ellittica"""
    T, N = frames(path, closed, up); g = Part(); m = len(path)
    for k in range(m):
        B = T[k].cross(N[k]); rr = r(k / max(1, m - 1)) if callable(r) else r
        for i in range(n):
            a = i / n * TAU; g.v.append(tuple(Vector(path[k]) + rr * (cos(a) * N[k] * (rx or 1) + sin(a) * B)))
    seg = m if closed else m - 1; L = 0
    for k in range(seg):
        k2 = (k + 1) % m; dl = (Vector(path[k2]) - Vector(path[k])).length
        for i in range(n):
            a, b, c, d = k * n + i, k * n + (i + 1) % n, k2 * n + i, k2 * n + (i + 1) % n
            g.face([a, b, d, c], [(i / n, L / 0.05), ((i + 1) / n, L / 0.05), ((i + 1) / n, (L + dl) / 0.05), (i / n, (L + dl) / 0.05)], mat)
        L += dl
    if caps and not closed:
        for k, start in ((0, True), (m - 1, False)):
            ci = len(g.v); g.v.append(tuple(path[k]))
            for i in range(n):
                a, b = k * n + i, k * n + (i + 1) % n
                g.face([ci, b, a] if start else [ci, a, b], [(0.5, 0.5)] * 3, mat)
    return g

def ellipsoid(c, r, n=10, mat='metallo', flat=False):
    g = Part(); rows = max(3, n // 2)
    g.v.append((c[0], c[1] + r[1], c[2]))
    for j in range(1, rows):
        th = j / rows * PI
        for i in range(n):
            ph = i / n * TAU; g.v.append((c[0] + r[0] * sin(th) * sin(ph), c[1] + r[1] * cos(th), c[2] + r[2] * sin(th) * cos(ph)))
    g.v.append((c[0], c[1] - r[1], c[2])); bot = len(g.v) - 1
    for i in range(n):
        g.face([0, 1 + i, 1 + (i + 1) % n], [(0.5, 1)] * 3, mat, flat)
    for j in range(rows - 2):
        for i in range(n):
            a, b = 1 + j * n + i, 1 + j * n + (i + 1) % n; g.face([a, a + n, b + n, b], [(i / n, j / rows), (i / n, (j + 1) / rows), ((i + 1) / n, (j + 1) / rows), ((i + 1) / n, j / rows)], mat, flat)
    base = 1 + (rows - 2) * n
    for i in range(n):
        g.face([bot, base + (i + 1) % n, base + i], [(0.5, 0)] * 3, mat, flat)
    return g

def gem(c, r, mat='gemma'):
    """gemma tagliata: ottaedro con la tavola (otto facce piatte e una corona)"""
    g = Part(); x, y, z = c; rx, ry, rz = r
    g.v = [(x, y + ry, z), (x + rx, y, z), (x, y, z + rz), (x - rx, y, z), (x, y, z - rz * 0.4), (x, y - ry, z)]
    for a, b in ((1, 2), (2, 3), (3, 4), (4, 1)):
        g.face([0, b, a], [(0.5, 1), (1, 0.5), (0, 0.5)], mat, True); g.face([5, a, b], [(0.5, 0), (0, 0.5), (1, 0.5)], mat, True)
    return g

def sphere_grid(Wn, Hn, theta_len, fn, mat):
    """sfera con la stessa parametrizzazione di THREE.SphereGeometry (uv comprese): fn(x, y, z) → punto finale"""
    g = Part(); full = theta_len >= PI - 1e-6; rows = []
    for iy in range(Hn + 1):
        th = iy / Hn * theta_len
        if iy == 0 or (full and iy == Hn):
            g.v.append(fn(0.0, cos(th), 0.0)); rows.append([len(g.v) - 1] * Wn); continue
        r = []
        for ix in range(Wn):
            ph = ix / Wn * TAU; r.append(len(g.v)); g.v.append(fn(-cos(ph) * sin(th), cos(th), sin(ph) * sin(th)))
        rows.append(r)
    for iy in range(Hn):
        for ix in range(Wn):
            a, b, c, d = rows[iy][(ix + 1) % Wn], rows[iy][ix], rows[iy + 1][ix], rows[iy + 1][(ix + 1) % Wn]
            ua, ub = (ix + 1) / Wn, ix / Wn; va, vb = 1 - iy / Hn, 1 - (iy + 1) / Hn
            if iy == 0: g.face([a, c, d], [((ix + 0.5) / Wn, va), (ub, vb), (ua, vb)], mat)
            elif full and iy == Hn - 1: g.face([a, b, c], [(ua, va), (ub, va), ((ix + 0.5) / Wn, vb)], mat)
            else: g.face([a, b, c, d], [(ua, va), (ub, va), (ub, vb), (ua, vb)], mat)
    return g

def rot(x=0, y=0, z=0):
    """come Euler(x, y, z, 'XYZ') di three: R = Rx · Ry · Rz"""
    return Matrix.Rotation(x, 4, 'X') @ Matrix.Rotation(y, 4, 'Y') @ Matrix.Rotation(z, 4, 'Z')
def tr(x, y, z): return Matrix.Translation((x, y, z))
def sc(x, y, z): return Matrix.Diagonal((x, y, z, 1))

def probe(bvh, origin, direction, off=0.0):
    """punto della superficie colpito dal raggio, spostato di off verso l'esterno"""
    d = Vector(direction).normalized(); hit = bvh.ray_cast(Vector(origin), d)
    if hit[0] is None: return None
    return hit[0] - d * off

# ---------------------------------------------------------------- oggetti di Blender
def build(name, joint_name, g, mods=(), sharp=None, extras=None, tags=None):
    ky = scala_y(joint_name, name); vs = [(p[0], p[1] * ky, p[2]) for p in g.v] if ky != 1.0 else g.v   # busto più corto, braccia più lunghe
    if ky != 1.0 and name.endswith('_mano'): vs = [(p[0], p[1] - (ky - 1) * 0.262, p[2]) for p in g.v]   # la mano non si allunga: scende con il polso
    me = bpy.data.meshes.new(name); me.from_pydata([tb(p) for p in vs], [], g.f)
    uvl = me.uv_layers.new(name='UVMap')
    for p in me.polygons:
        for k, li in enumerate(p.loop_indices): uvl.data[li].uv = g.uv[p.index][k]
    names = []
    for m in g.m:
        if m not in names: names.append(m)
    for n in names: me.materials.append(mat(n))
    for p in me.polygons: p.material_index = names.index(g.m[p.index])
    me.shade_smooth()
    for p in me.polygons:
        if g.flat[p.index]: p.use_smooth = False
    if sharp: me.set_sharp_from_angle(angle=sharp)
    me.validate(clean_customdata=False); me.update()
    ob = bpy.data.objects.new(name, me); COLL.objects.link(ob); ob.parent = J[joint_name]
    for k, v in {**(CUR if tags is None else tags), **(extras or {})}.items(): ob[k] = v   # proprietà → "extras" del glTF → userData nel motore
    for kind, opts in mods:
        md = ob.modifiers.new(kind.lower(), kind)
        for k, v in opts.items(): setattr(md, k, v)
    return ob

# ---------------------------------------------------------------- strati
# Ogni oggetto porta nel glTF (extras → userData nel motore) le etichette del guardaroba:
#   strato: corpo | intimo | abiti | accessori | capelli
#   pezzo:  il capo (abito, corsetto, stivali, diadema…); per il corpo è "corpo"
#   regione: la parte del corpo che l'oggetto occupa (busto, braccio, coscia, gamba, piede…), sul corpo e sull'intimo
#   nasconde: le regioni che il capo copre del tutto: negli strati più bassi si nascondono (niente pelle che buca la stoffa)
#   richiede: il capo su cui si appoggia (il borsello pende dalla cintura, la spilla sta sul colletto dell'abito)
# Il corpo è liscio come un manichino (nessun dettaglio anatomico): l'intimo è il primo strato.
CUR = {}
def pezzo(strato, nome, nasconde=(), richiede=None):
    CUR.clear(); CUR.update(strato=strato, pezzo=nome)
    if nasconde: CUR['nasconde'] = ','.join(nasconde)
    if richiede: CUR['richiede'] = richiede
def corpo(): pezzo('corpo', 'corpo')
ABITO = dict(nasconde=('busto', 'braccio', 'bacino'))
def shrink(secs, d): return [dict(s, w=s['w'] - d, h=s['h'] - d) for s in secs]

# dettagli piccoli (lacci, occhielli, profili, gemme, fibbie): un oggetto per giunto e per capo, SENZA contorno del cel
# shading (userData.noOutline): con il contorno a spessore costante sullo schermo, da lontano diventerebbero macchie scure.
DET = {}
def D(j):
    k = (j, CUR['pezzo'])
    if k not in DET: DET[k] = (Part(), dict(CUR))
    return DET[k][0]

# ================================================================= TESTA
def shape_head(x, y, z, elf=True, inflate=0.0):
    """porting di shapeHead() di villager.js (sfera unitaria → testa; z avanti, y alto), con il viso dell'elfa più
    armonioso: ovale che si affina verso un mento piccolo, metà bassa del viso più lunga, profilo meno appiattito"""
    f0 = max(0.0, min(1.0, (z - 0.05) / 0.75)); F = f0 * f0 * (3 - 2 * f0)
    if y < 0:
        k = (-y) ** (1.6 if elf else 1.25); x *= 1 - (0.48 if elf else 0.28) * k             # nell'elfa le guance restano piene, si affina il mento
        if z < 0.2: z = z * (1 - 0.35 * k)
        if elf: y *= 1.1
    if z < 0: z *= 1.03 + 0.05 * max(0.0, y)
    x *= 1 - 0.08 * exp(-((y - 0.3) / 0.2) ** 2) * (1 - abs(z))
    if z > 0.3: t = z - 0.3; z = 0.3 + t * (1 - (0.4 if elf else 0.6) * min(1.0, t / 0.45))
    if y < -0.1: z += 0.06 * min(1.0, (-y - 0.1) / 0.4) * F
    if not inflate:
        z += 0.09 * exp(-((y - 0.22) / 0.08) ** 2) * exp(-1.5 * (x / 0.6) ** 2) * F
        for sd in (-1, 1): z -= 0.1 * exp(-((x - sd * 0.3) / 0.15) ** 2 - ((y - 0.07) / 0.1) ** 2) * F
        z += 0.05 * exp(-((abs(x) - 0.4) / 0.13) ** 2 - ((y + (0.0 if elf else 0.06)) / 0.11) ** 2) * F
        z -= (0.012 if elf else 0.035) * exp(-((abs(x) - 0.38) / 0.12) ** 2 - ((y + 0.36) / 0.14) ** 2) * F        # guance (nell'elfa appena)
        nb = exp(-(x / (0.07 if elf else 0.09)) ** 2); n = 0.0 if (y > 0.14 or y < -0.32) else (0.14 - y) / 0.44
        if y < -0.22: n *= max(0.0, (y + 0.32) / 0.1)
        z += (0.17 if elf else 0.22) * n * nb * F
        z += 0.04 * exp(-((abs(x) - 0.12) / 0.05) ** 2 - ((y + 0.25) / 0.05) ** 2) * F
        z += 0.04 * exp(-(x / 0.22) ** 2 - ((y + 0.43) / 0.05) ** 2) * F + 0.035 * exp(-(x / 0.18) ** 2 - ((y + 0.54) / 0.05) ** 2) * F
        z -= 0.02 * exp(-(x / 0.2) ** 2 - ((y + 0.64) / 0.05) ** 2) * F
        z += (0.075 if elf else 0.08) * exp(-(x / 0.22) ** 2 - ((y + 0.86) / 0.11) ** 2) * F
    k = 1 + inflate; return (x * k, y * k, z * k)

def tri(v):
    """onda a punta: 1 al centro di ogni periodo, 0 ai bordi (per ciocche e orli a foglia)"""
    f = v - math.floor(v); return 1 - 2 * abs(f - 0.5)

def bang_drop(x):
    """frangia a ciocche: quanto scende l'attaccatura sulla fronte; punte asimmetriche, fra una punta e l'altra si vede la fronte"""
    d = 0.0
    for xc, depth, wd in ((-0.44, 0.2, 0.14), (-0.21, 0.34, 0.16), (0.02, 0.27, 0.14), (0.24, 0.32, 0.15), (0.46, 0.17, 0.13)):
        q = 1 - abs(x - xc) / wd
        if q > 0: d = max(d, depth * q ** 1.3)
    return d

def hair_point(x, y, z):
    """porting di hairGeometry(true) con più dettaglio, sempre in un pezzo solo: frangia a ciocche appuntite,
    due ciocche che incorniciano il viso davanti alle orecchie, punte a ciuffi dietro, ciocche fini"""
    psi = math.degrees(math.atan2(z, abs(x)))                                          # 0 di lato, 90 davanti
    lock = exp(-((psi - 37) / 6.5) ** 2) * sm(0.42, 0.15, y) * sm(-0.2, 0.15, z)          # ciocche davanti alle orecchie
    face = sm(0.12, 0.42, z) * sm(0.54 - bang_drop(x), 0.49 - bang_drop(x), y + 0.12 * x * x)
    ear = sm(0.6, 0.85, abs(x)) * sm(0.25, -0.05, y) * sm(-0.35, 0.05, z)
    chin = sm(-0.4, -0.7, y) * sm(-0.35, 0.05, z)
    keep = sm(0.25, 0.6, lock)
    k = 1 - 0.45 * max(face, ear * 0.3, chin * 0.65) * (1 - keep); x, y, z = x * k, y * k, z * k
    x, y, z = shape_head(x, y, z, True, 0.075)
    phi = math.atan2(z, -x); top = sm(0.2, 0.95, y); r = math.hypot(x, z) or 1
    strands = 0.035 * sin(phi * 22 + sin(phi * 5) * 1.5) * (1 - top * 0.7) + 0.02 * sin(phi * 9 + y * 3)
    strands += 0.01 * sin(phi * 33 + sin(phi * 13) * 2.2) * (1 - top * 0.85)             # ciocche più fini
    puff = 0.07 * top + 0.03 * sm(0.4, 0.9, y) * sin(phi * 3 + 1)                         # più volume sulla calotta
    nx, nz = x / r, z / r; out = strands + puff
    if z > 0.2 and 0.05 < y < 0.6: out += 0.03 * sm(0.6, 0.2, y)                         # la frangia si stacca un poco dalla fronte
    back = sm(0.35, -0.6, z); side = sm(0.6, 0.95, abs(x)) * sm(0.3, -0.3, z) * 0.6; w = max(back, side)
    below = sm(0.15, -0.95, y)
    tips = 0.86 + 0.24 * tri(phi * 9 / TAU) ** 2.2 + 0.05 * sin(phi * 5)                   # punte a ciuffi
    y -= 3.9 * tips * below * below * w
    out += 0.18 * below * w + 0.04 * sin(phi * 26) * below * w
    z -= 0.32 * below * w
    if lock > 0.02:                                                                    # le ciocche del viso scendono fino al colletto, a punta
        lb = sm(0.15, -0.75, y); y -= 1.05 * lock ** 3 * lb * lb
        out += 0.16 * lock * lb; z += 0.06 * lock * lb
    return (x + nx * out, y, z + nz * out)

HS = (0.093 * hs, 0.13 * hs, 0.118 * hs); HY = 0.125 * hs                              # un po' più stretta e alta dell'elfa del motore
def head_xf(p): return (p[0] * HS[0], p[1] * HS[1] + HY, p[2] * HS[2] + 0.005)

corpo()
head = sphere_grid(48, 36, PI, lambda x, y, z: head_xf(shape_head(x, y, z)), 'volto')
build('testa_volto', 'testa', head, extras={'regione': 'testa'})
pezzo('capelli', 'capelli')
hair = sphere_grid(72, 60, PI * 0.98, lambda x, y, z: head_xf(hair_point(x, y, z)), 'capelli')
build('testa_capelli', 'testa', hair)
headParts = Part().add(head).add(hair); HB = headParts.bvh()

corpo()                                             # orecchie a lama: profilo a foglia, incavo sul davanti più scuro, punta che piega un poco all'indietro
ears = Part()
for s in (1, -1):
    def ear_w(f): return 0.024 * (1 - f) ** 0.85 * (0.75 + 0.25 * sin(PI * min(1.0, f * 2))) + 0.0005
    secs = [dict(t=f * 0.168, w=ear_w(f), h=0.009 - 0.006 * f) for f in [0, 0.06, 0.15, 0.27, 0.4, 0.53, 0.66, 0.78, 0.88, 0.95, 1.0]]
    def ear_def(p, a, t, s=s):
        f = t / 0.168; x, y, z = p; w = ear_w(f)
        g = (0.009 - 0.006 * f) * 0.75 * sm(0.04, 0.16, f) * sm(0.9, 0.6, f)
        if z > 0: z -= g * exp(-(x / (0.62 * w)) ** 2) * min(1.0, z / ((0.009 - 0.006 * f) * 0.5))
        return (x, y, z - 0.014 * f * f)
    e = loft(secs, N=14, axis='y', step=0.01, caps=(True, False), deform=ear_def, mat='pelle',
             matf=lambda a, t: 'pelle_ombra' if (abs(((a + 0.5) % 1) - 0.5) < 0.17 and 0.08 < t / 0.168 < 0.86) else 'pelle')
    e.v = [(x, -y, z) for x, y, z in e.v]; e.f = [f[::-1] for f in e.f]; e.uv = [u[::-1] for u in e.uv]   # la lama sale verso +y
    e.xform(tr(s * 0.092 * hs, 0.115 * hs, -0.005) @ rot(-0.55, s * 0.35, -s * 1.15)); ears.add(e)
build('testa_orecchie', 'testa', ears, extras={'regione': 'orecchie'})

pezzo('accessori', 'orecchini')                     # orecchini: anello e goccia
for s in (1, -1):
    c = Vector((s * 0.097 * hs, 0.083 * hs, 0.0))
    D('testa').add(tube([tuple(c + Vector((0.0075 * sin(a / 16 * TAU) * 0.35, -0.0075 * cos(a / 16 * TAU), 0.0075 * sin(a / 16 * TAU)))) for a in range(16)], 0.0016, 6, True, 'metallo'))
    D('testa').add(gem(tuple(c + Vector((0, -0.017, 0))), (0.0035, 0.006, 0.0035)))

# diadema: nastro d'argento appoggiato su capelli e fronte, scende a punta sulla fronte con la gemma; foglie ai lati
pezzo('accessori', 'diadema', richiede='capelli')
ang = PI / 2 + 0.17; RM = tr(0, 0.205 * hs, -0.004) @ rot(ang); C0 = RM @ Vector((0, 0, 0)); UPd = (rot(ang) @ Vector((0, 0, -1, 0))).to_3d().normalized()
band, ups, front = [], [], None
for k in range(72):
    th = k / 72 * TAU; R0 = 0.104 * hs
    p = RM @ Vector((R0 * cos(th), 1.17 * R0 * sin(th), 0)); dth = (th - PI / 2 + PI) % TAU - PI
    p.y -= 0.011 * exp(-(dth / 0.3) ** 2)
    d = Vector((p.x - C0.x, 0.0, p.z - C0.z)).normalized()
    q = probe(HB, p + d * 0.08, -d, 0.0024) or p
    band.append(tuple(q)); ups.append(tuple(UPd))
    if k == 18: front = (q, d)
D('testa').add(tube(band, 0.0017, 8, True, 'metallo', up=ups, rx=2.6))
fq, fd = front
D('testa').add(tube([tuple(fq + fd * 0.004 + Vector((0.0085 * cos(a / 14 * TAU), 0.0115 * sin(a / 14 * TAU), 0))) for a in range(14)], 0.0018, 5, True, 'metallo'))
D('testa').add(gem(tuple(fq + fd * 0.0055), (0.0075, 0.0105, 0.0055)))
for s in (1, -1):                                   # foglioline e gemme piccole ai lati
    k = 18 - s * 7; q = Vector(band[k]); dd = Vector((q.x - C0.x, 0, q.z - C0.z)).normalized()
    D('testa').add(gem(tuple(q + dd * 0.003), (0.003, 0.0042, 0.0025)))
    for j, (dy, ax) in enumerate(((0.012, 0.35), (0.008, 0.9))):
        base = Vector(band[18 - s * (3 + j * 2)]); lf = []
        for a in range(10):
            f = a / 9; lf.append(tuple(base + Vector((s * f * 0.006 * ax, f * dy + 0.002, 0)) + dd * 0.001))
        D('testa').add(tube(lf, lambda f: 0.0028 * sin(PI * min(1, f * 1.1)) + 0.0004, 5, False, 'metallo', rx=0.45))

corpo()
build('collo_pelle', 'collo', loft(taper(0.0, -S['neck'] - 0.03, 0.045, 0.048, 0.043, 0.046, 0, 3), N=28, mat='pelle'), extras={'regione': 'collo'})

# ================================================================= BUSTO
ch = S['chest'] * W
def bp(k): return [(0.085, 0.25 * k, 0.062), (-0.085, 0.25 * k, 0.062)]
torso_secs = [
    dict(t=0.02, w=S['waist'] * W, h=0.102 * W), dict(t=-0.08, w=S['waist'] * W * 0.98, h=0.098 * W, oy=-0.006),
    dict(t=-0.18, w=(S['waist'] + S['chest']) / 2 * W, h=0.11 * W, oy=0.002),
    dict(t=-0.24, w=ch * 0.97, h=0.116 * W, oy=0.008, bumps=bp(0.15)), dict(t=-0.28, w=ch, h=0.12 * W, oy=0.012, bumps=bp(0.75)),
    dict(t=-0.315, w=ch * 1.02, h=0.124 * W, oy=0.016, bumps=bp(1)), dict(t=-0.35, w=ch * 1.03, h=0.126 * W, oy=0.018, bumps=bp(0.8)),
    dict(t=-0.39, w=ch * 1.03, h=0.122 * W, oy=0.012, bumps=bp(0.35)),
    dict(t=-0.425, w=0.13, h=0.1, oy=-0.004),                                                 # sotto le ascelle
    # spalle morbide e basse: dal braccio al collo la linea scende piano (trapezio), più piena dietro; il collo resta lungo
    dict(t=-0.445, w=0.132, h=0.092, oy=-0.008), dict(t=-0.462, w=0.118, h=0.084, oy=-0.011), dict(t=-0.478, w=0.095, h=0.074, oy=-0.012),
    dict(t=-0.492, w=0.072, h=0.062, oy=-0.01), dict(t=-0.505, w=0.056, h=0.05, oy=-0.008), dict(t=-0.512, w=0.048, h=0.044, oy=-0.006)]
corpo()                                             # il busto nudo ha le sezioni dell'abito 4 mm più dentro
body_secs = shrink(torso_secs, 0.004)
build('busto_corpo', 'busto', loft(body_secs, N=40, step=0.024, mat='pelle'), extras={'regione': 'busto'})
pezzo('intimo', 'fascia')                           # fascia di lino sul petto
build('busto_fascia', 'busto', loft(shrink([s for s in torso_secs if -0.4 <= s['t'] <= -0.23], 0.0015), N=40, step=0.02, caps=(False, False), mat='lino'), extras={'regione': 'busto'})

pezzo('abiti', 'abito', **ABITO)
torso = loft(torso_secs, N=40, step=0.024, mat='abito')
build('busto_abito', 'busto', torso)
TB = torso.bvh()
for s in (1, -1):                                   # corpetto: doppio profilo ricamato a V dalle spalle alla punta del corsetto
    for inset in (0.0, 0.009):
        line = []
        for k in range(18):
            f = k / 17; q = probe(TB, (s * (0.088 * (1 - f) ** 1.15 + 0.003 - inset * (1 - f)), 0.458 - 0.212 * f - inset * 0.6 * (1 - f), 0.4), (0, 0, -1), 0.0016)
            if q: line.append(tuple(q))
        D('busto').add(tube(line, 0.0015, 4, False, 'bordo'))

# corsetto di cuoio: stecche in rilievo, canale per i lacci sul davanti, profili dorati in alto e in basso
pezzo('abiti', 'corsetto')
bon = [(0.0, -0.05, 0.012)] + [(sd * a0, 0.035, 0.007) for sd in (1, -1) for a0 in (0.1, 0.19, 0.3)] + [(0.5, 0.03, 0.007)]
cor_secs = [dict(t=0.0, w=S['waist'] * W + 0.008, h=0.106 * W + 0.006, bumps=bon), dict(t=-0.1, w=S['waist'] * W * 0.98 + 0.008, h=0.1 * W + 0.006, oy=-0.004, bumps=bon),
            dict(t=-0.2, w=(S['waist'] + S['chest']) / 2 * W + 0.008, h=0.112 * W + 0.006, bumps=bon),
            dict(t=-0.245, w=ch * 0.97 + 0.006, h=0.116 * W + 0.006, oy=0.008, bumps=bp(0.2) + bon)]
corset = loft(cor_secs, N=48, step=0.02, mat='cuoio')
CB = corset.bvh(); bust = Part().add(corset)
def ring_on(bv, y, n=64, off=0.0015, cz=0.0):
    pts = []
    for i in range(n):
        a = i / n * TAU; d = Vector((sin(a), 0, cos(a)))
        q = probe(bv, Vector((0, y, cz)) + d * 0.4, -d, off); pts.append(tuple(q))
    return pts
D('busto').add(tube(ring_on(CB, 0.243, 48), 0.0026, 4, True, 'bordo'))
eyel = []                                           # lacci: occhielli e laccio incrociato nel canale davanti, con un fiocco in alto
for k in range(5):
    y = 0.078 + k * 0.038
    for sd in (-1, 1):
        q = probe(CB, (sd * 0.016, y, 0.4), (0, 0, -1), 0.0008); eyel.append(q)
        D('busto').add(tube([tuple(q + Vector((0.0032 * cos(a / 10 * TAU), 0.0032 * sin(a / 10 * TAU), 0.0006))) for a in range(10)], 0.0011, 4, True, 'metallo'))
for k in range(4):
    L0, R0, L1, R1 = eyel[2 * k], eyel[2 * k + 1], eyel[2 * k + 2], eyel[2 * k + 3]
    for a, b in ((L0, R1), (R0, L1)):
        mid = (a + b) / 2 + Vector((0, 0, 0.0035)); D('busto').add(tube([tuple(a + Vector((0, 0, 0.0015))), tuple(mid), tuple(b + Vector((0, 0, 0.0015)))], 0.0016, 5, False, 'bordo'))
D('busto').add(tube([tuple(eyel[0] + Vector((0, 0, 0.0015))), tuple((eyel[0] + eyel[1]) / 2 + Vector((0, -0.002, 0.003))), tuple(eyel[1] + Vector((0, 0, 0.0015)))], 0.0016, 5, False, 'bordo'))
top = (eyel[-1] + eyel[-2]) / 2 + Vector((0, 0.004, 0.004))
for sd in (-1, 1):
    D('busto').add(tube([tuple(top + Vector((sd * 0.012 * sin(a / 12 * PI) * (1.2 - a / 12), 0.006 * sin(a / 12 * TAU), 0.002 * sin(a / 12 * PI)))) for a in range(13)], 0.0015, 5, False, 'bordo'))
    D('busto').add(tube([tuple(top), tuple(top + Vector((sd * 0.006, -0.018, 0.003))), tuple(top + Vector((sd * 0.009, -0.034, 0.002)))], 0.0014, 5, False, 'bordo'))
build('busto_corsetto', 'busto', bust)

# cintura con fibbia a cornice e puntale
pezzo('abiti', 'cintura')
belt = loft(taper(-0.005, -0.06, S['waist'] * W + 0.014, 0.106 * W + 0.014, S['waist'] * W + 0.014, 0.104 * W + 0.014, 0, 2), N=64, mat='cintura')
BB = belt.bvh(); bz = probe(BB, (0, 0.0325, 0.4), (0, 0, -1)).z
fr = []
for k in range(24):
    a = k / 24 * TAU; cx, cy = cos(a), sin(a); px = math.copysign(abs(cx) ** 0.35, cx) * 0.021; py = math.copysign(abs(cy) ** 0.35, cy) * 0.02
    fr.append((px, 0.0325 + py, bz + 0.004))
D('busto').add(tube(fr, 0.0034, 6, True, 'metallo'))
D('busto').add(tube([(-0.019, 0.0325, bz + 0.005), (0.004, 0.0325, bz + 0.0065)], 0.0018, 5, False, 'metallo'))
D('busto').add(loft(taper(0, 0.03, 0.006, 0.0025, 0.006, 0.0025, 0, 2), N=8, axis='z', R=0.35, mat='cintura').xform(tr(0.015, 0.0325, bz + 0.001) @ rot(0, PI / 2, 0)))
build('busto_cintura', 'busto', belt)

# ================================================================= ANCA: bacino nudo, culotte, baschina, gonna in due metà
hipW = S['hips'] * W
glutei = lambda k: [(0.5 - 0.09, 0.07 * k, 0.07), (0.5 + 0.09, 0.07 * k, 0.07)]
pelvis_secs = [dict(t=-0.065, w=S['waist'] * W - 0.003, h=0.102 * W - 0.003), dict(t=-0.01, w=(S['waist'] + S['hips']) / 2 * W - 0.012, h=0.115 * W - 0.008),
               dict(t=0.04, w=hipW - 0.02, h=0.13 * W - 0.014, oy=-0.006, bumps=glutei(1)), dict(t=0.085, w=hipW - 0.026, h=0.11 * W, oy=-0.01, bumps=glutei(1.1)),
               dict(t=0.12, w=0.1, h=0.068, oy=-0.008, bumps=glutei(0.5)), dict(t=0.145, w=0.045, h=0.035, oy=-0.004)]   # le cosce disegnano la linea dei fianchi
corpo()                                             # bacino liscio come un manichino; le cosce vi entrano dai giunti delle anche
build('anca_corpo', 'anca', loft(pelvis_secs, N=40, step=0.02, mat='pelle'), extras={'regione': 'bacino'})
pezzo('intimo', 'culotte')
cul = [dict(t=-0.035, w=0.106 + 0.002, h=0.0858 + 0.002)] + [dict(s, w=s['w'] + 0.002, h=s['h'] + 0.002) for s in pelvis_secs[1:]]
build('anca_culotte', 'anca', loft(cul, N=40, step=0.02, caps=(False, True), mat='lino'), extras={'regione': 'bacino'})

# La gonna sotto i fianchi è divisa in due metà appese ai giunti cosciaS/D: camminando seguono la gamba invece di farsi
# bucare dal ginocchio (con un pezzo rigido sull'anca succedeva). L'attacco è coperto dalla baschina, che resta sull'anca.
pezzo('abiti', 'abito', **ABITO)
def fold(a): return sin(TAU * 9 * a + 0.7 * sin(TAU * 3 * a))
FOLD = 0.095
def skirt_def(p, a, t, off=0.0):
    x, y, z = p; A = FOLD * sm(0.06, 0.5, t); k = 1 + A * fold(a) + off / max(0.05, math.hypot(x, z))
    return (x * k, y + 0.009 * fold(a) * sm(0.44, 0.5, t), z * k)
skirt_secs = [dict(t=-0.01, w=(S['waist'] + S['hips']) / 2 * W, h=0.115 * W), dict(t=0.05, w=hipW, h=0.13 * W, oy=-0.008),
              dict(t=S['skirt'] * 0.55, w=hipW * (1 + (S['flare'] - 1) * 0.6), h=0.14 * W * (1 + (S['flare'] - 1) * 0.6)),
              dict(t=S['skirt'], w=hipW * S['flare'], h=0.15 * W * S['flare'])]
def skirt_wh(t):
    f = (t - S['skirt'] * 0.55) / (S['skirt'] * 0.45); k0, k1 = 1 + (S['flare'] - 1) * 0.6, S['flare']
    return hipW * (k0 + (k1 - k0) * f), 0.14 * W * k0 + (0.15 * W * k1 - 0.14 * W * k0) * f
def band_on(t0, t1, off, arc):
    secs = [dict(t=t, w=skirt_wh(t)[0], h=skirt_wh(t)[1]) for t in (t0, t1)]
    return loft(secs, N=32, step=0.03, arc=arc, deform=lambda p, a, t: skirt_def(p, a, t, off), mat='bordo')
for s in (1, -1):
    L = 'S' if s > 0 else 'D'; arc = (0.0, 0.5) if s > 0 else (0.5, 1.0); toJ = tr(-s * (0.088 + 0.02) * W, 0.06, 0)
    half = loft(skirt_secs, N=32, step=0.03, arc=arc, deform=skirt_def, mat='gonna').xform(toJ)
    build('coscia' + L + '_gonna', 'coscia' + L, half, mods=[('SOLIDIFY', dict(thickness=0.004, offset=-1.0))])
    D('coscia' + L).add(band_on(S['skirt'] - 0.042, S['skirt'] + 0.002, 0.0045, arc).xform(toJ))
    D('coscia' + L).add(band_on(S['skirt'] - 0.072, S['skirt'] - 0.062, 0.003, arc).xform(toJ))
def pep_def(p, a, t, off=0.0):
    """baschina a otto linguette appuntite (motivo a foglia, come il risvolto degli stivali); la piega esce al centro di ogni linguetta"""
    x, y, z = p; w = tri(a * 8 + 0.5); k = 1 + 0.05 * sm(0.03, 0.15, t) * (2 * w - 1) + off / max(0.05, math.hypot(x, z))
    return (x * k, y - 0.034 * w ** 1.6 * sm(0.1, 0.155, t), z * k)
pep_secs = [dict(t=-0.065, w=S['waist'] * W + 0.006, h=0.105 * W + 0.006), dict(t=-0.01, w=(S['waist'] + S['hips']) / 2 * W + 0.01, h=0.115 * W + 0.01),
            dict(t=0.06, w=hipW + 0.016, h=0.13 * W + 0.014, oy=-0.006), dict(t=0.155, w=hipW * 1.16 + 0.02, h=0.14 * W * 1.12 + 0.018, oy=-0.004)]
pep = loft(pep_secs, N=64, step=0.024, caps=(True, False), deform=pep_def, mat='mantello')
PB = pep.bvh()
build('anca_baschina', 'anca', pep, mods=[('SOLIDIFY', dict(thickness=0.003, offset=-1.0))])
hem = [pep_def(sec_point(pep_secs[-1], i / 64, 0.9, 'y'), i / 64, 0.155, 0.0014) for i in range(64)]
D('anca').add(tube(hem, 0.003, 4, True, 'bordo'))

# borsello appeso alla cintura sul fianco sinistro (+x): cuscinetto di cuoio smussato in Blender (Bevel), patta, bottone, passanti
pezzo('accessori', 'borsello', richiede='cintura')
dirp = Vector((sin(0.13 * TAU), 0, cos(0.13 * TAU)))
pc = probe(PB, Vector((0, 0.046, 0)) + dirp * 0.4, -dirp) + dirp * 0.017            # coordinate dell'anca: la patta arriva sulla cintura
PM = tr(*pc) @ rot(0, math.atan2(dirp.x, dirp.z), 0); lat = PM.to_3x3() @ Vector((1, 0, 0))
pouch = box((0, 0, 0), (0.062, 0.07, 0.03), PM, 'cuoio').add(box((0, 0.019, 0.016), (0.066, 0.036, 0.008), PM @ rot(-0.12, 0, 0), 'cintura'))
build('anca_borsello', 'anca', pouch, mods=[('BEVEL', dict(width=0.006, segments=3, limit_method='NONE'))])
D('anca').add(ellipsoid(tuple(PM @ Vector((0, 0.004, 0.022))), (0.0045, 0.0045, 0.003), 10, 'metallo'))
bpt = probe(BB, Vector((0, 0.025, 0)) + dirp * 0.4, -dirp, 0.002) + Vector((0, 0.05, 0))
for sd in (-1, 1):                                   # passanti: strisce di cuoio piatte che dal retro del borsello salgono sulla cintura
    a0 = PM @ Vector((sd * 0.02, 0.02, -0.013)); a1 = bpt + lat * sd * 0.02 + Vector((0, 0.008, 0))
    D('anca').add(tube([tuple(a0), tuple(a1)], 0.0045, 4, False, 'cintura', rx=0.3))

# ================================================================= COLLETTO (abito), SPILLA, MANTELLO
pezzo('abiti', 'abito', **ABITO)
col = Part().add(loft([dict(t=-T0 + 0.006, w=0.072, h=0.068), dict(t=-T0 - 0.02, w=0.061, h=0.058), dict(t=-T0 - 0.048, w=0.064, h=0.061)], N=32, step=0.012, caps=(True, False), mat='abito'))
D('busto').add(tube([(0.0648 * sin(a / 32 * TAU), T0 + 0.048, 0.0618 * cos(a / 32 * TAU)) for a in range(32)], 0.0022, 4, True, 'bordo'))
build('busto_colletto', 'busto', col)
pezzo('accessori', 'spilla', richiede='abito')     # spilla con la gemma sul davanti del colletto
cq = probe(col.bvh(), (0, T0 + 0.024, 0.4), (0, 0, -1), 0.003)
D('busto').add(tube([tuple(cq + Vector((0.0072 * cos(a / 12 * TAU), 0.0085 * sin(a / 12 * TAU), 0))) for a in range(12)], 0.0019, 5, True, 'metallo'))
D('busto').add(gem(tuple(cq + Vector((0, 0, 0.0018))), (0.0052, 0.0066, 0.0038)))

pezzo('abiti', 'mantello')
def cape_pt(u, s):
    th = (0.55 + 0.9 * u) * PI; L = 1.15
    rx = 0.11 + 0.07 * sm(0, 0.13, s) + 0.08 * s; rz = 0.1 + 0.05 * sm(0, 0.13, s) + 0.05 * s     # spalle più strette
    k = 1 + 0.11 * s ** 1.2 * sin(TAU * 3.5 * u + 0.6 * sin(TAU * 1.5 * u)) * sm(0.0, 0.08, u) * sm(1.0, 0.92, u)
    y = -s * L - 0.065 * s ** 8 * tri(u * 5) ** 1.5                                  # orlo a cinque punte
    return (rx * sin(th) * k, y, rz * cos(th) * k)
cape = Part(); NU, NS = 30, 22
for j in range(NS + 1):
    for i in range(NU + 1): cape.v.append(cape_pt(i / NU, j / NS))
for j in range(NS):
    for i in range(NU):
        a, b, c, d = j * (NU + 1) + i, j * (NU + 1) + i + 1, (j + 1) * (NU + 1) + i, (j + 1) * (NU + 1) + i + 1
        cape.face([a, b, d, c], [(i / NU * 3, 1 - j / NS * 2), ((i + 1) / NU * 3, 1 - j / NS * 2), ((i + 1) / NU * 3, 1 - (j + 1) / NS * 2), (i / NU * 3, 1 - (j + 1) / NS * 2)], 'mantello')
build('mantello_telo', 'mantello', cape, mods=[('SOLIDIFY', dict(thickness=0.006, offset=0.0))])
CPB = cape.bvh(); lc_y, lh, lw2 = -0.5, 0.26, 0.075   # foglia elfica ricamata in oro al centro della schiena
def on_cape(x, y): q = probe(CPB, (x, y, -0.6), (0, 0, 1), 0.0045); return tuple(q) if q else None
leaf = [on_cape(sd * lw2 * sin(PI * f) ** 0.8 * (1 - 0.25 * f), lc_y + lh / 2 - lh * f) for sd in (1, -1) for f in ([k / 20 for k in range(21)] if sd > 0 else [1 - k / 20 for k in range(1, 20)])]
D('mantello').add(tube([p for p in leaf if p], 0.0026, 4, True, 'bordo'))
D('mantello').add(tube([p for p in [on_cape(0, lc_y + lh / 2 - lh * k / 16) for k in range(17)] + [on_cape(0, lc_y - lh / 2 - 0.05)] if p], 0.0024, 4, False, 'bordo'))
for k in range(1, 5):
    y0 = lc_y + lh / 2 - lh * (0.15 + 0.17 * k)
    for sd in (1, -1):
        vein = [on_cape(sd * lw2 * 0.8 * sin(PI * (0.15 + 0.17 * k)) ** 0.8 * f, y0 + 0.035 * f) for f in (0, 0.33, 0.66, 0.9)]
        D('mantello').add(tube([p for p in vein if p], 0.0018, 4, False, 'bordo'))
D('mantello').add(tube([cape_pt(i / NU, 1.0) for i in range(NU + 1)], 0.0045, 4, False, 'bordo'))
for u in (0.0, 1.0): D('mantello').add(tube([cape_pt(u, j / NS) for j in range(NS + 1)], 0.003, 4, False, 'bordo'))
for u, sd in ((0.0, 1), (1.0, -1)):                 # fermagli d'argento in cima al mantello
    q = Vector(cape_pt(u, 0.035)); D('mantello').add(ellipsoid(tuple(q), (0.011, 0.011, 0.011), 12, 'metallo')); D('mantello').add(gem(tuple(q + Vector((sd * 0.008, 0.0, 0.006))), (0.004, 0.005, 0.004)))

# ================================================================= BRACCIA
for s in (1, -1):
    L = 'S' if s > 0 else 'D'
    # braccio: la spalla tonda fa parte dello stesso pezzo (niente sfera appoggiata)
    arm_secs = [dict(t=-0.018, w=0.014, h=0.014), dict(t=-0.01, w=0.044 * aw, h=0.046 * aw), dict(t=0.004, w=0.06 * aw, h=0.062 * aw),   # cupola bassa: continua la linea della spalla
                 dict(t=0.02, w=0.06 * aw, h=0.064 * aw, oy=0.003),
                dict(t=0.1, w=0.056 * aw, h=0.066 * aw, oy=0.008), dict(t=S['upper'] * 0.8, w=0.05 * aw, h=0.054 * aw), dict(t=S['upper'] + 0.02, w=0.047 * aw, h=0.05 * aw)]
    corpo()
    build('spalla' + L + '_corpo', 'spalla' + L, loft(shrink(arm_secs, 0.004), N=24, step=0.025, mat='pelle'), extras={'regione': 'braccio'})
    pezzo('abiti', 'abito', **ABITO)
    arm = loft(arm_secs, N=24, step=0.025, mat='abito')
    build('spalla' + L + '_abito', 'spalla' + L, arm)
    pezzo('accessori', 'bracciali_alti', richiede='abito')
    AB = arm.bvh()
    for yy in (-0.163, -0.176): D('spalla' + L).add(tube(ring_on(AB, yy, 24, 0.0014), 0.0018, 4, True, 'bordo'))   # bracciale alto, doppio cerchio
    pezzo('abiti', 'spallacci')                     # spallaccio: tre lamelle d'argento bordate d'oro, con i ribattini
    pl = Part()
    for k in range(3):
        r0 = 0.076 - 0.009 * k; M = tr(s * (0.004 + 0.004 * k), 0.016 - 0.03 * k, 0) @ rot(0, 0, -s * (0.2 + 0.17 * k)) @ sc(1, 0.5, 1.1)
        dome = sphere_grid(20, 6, PI * 0.47, lambda x, y, z, r0=r0: (x * r0, y * r0, z * r0), 'metallo'); dome.xform(M); pl.add(dome)
        rim = [tuple(M @ Vector((r0 * -cos(i / 28 * TAU) * sin(PI * 0.47), r0 * cos(PI * 0.47), r0 * sin(i / 28 * TAU) * sin(PI * 0.47)))) for i in range(28)]
        D('spalla' + L).add(tube(rim, 0.0024, 4, True, 'bordo'))
        for ph in ((PI if s > 0 else 0.0) + d for d in (-0.35 * PI, 0.35 * PI)):
            q = M @ Vector((r0 * 1.04 * -cos(ph) * sin(0.33 * PI), r0 * 1.04 * cos(0.33 * PI), r0 * 1.04 * sin(ph) * sin(0.33 * PI))); D('spalla' + L).add(ellipsoid(tuple(q), (0.0028, 0.0028, 0.0028), 8, 'bordo'))
    build('spalla' + L + '_spallaccio', 'spalla' + L, pl, mods=[('SOLIDIFY', dict(thickness=0.0035, offset=-1.0))])

    # avambraccio nudo e mano semplice (scelta dell'autore) ma fine: palmo stretto, dita unite appena piegate verso il palmo
    # con i solchi accennati, pollice piccolo appoggiato lungo l'indice
    corpo()
    build('gomito' + L + '_corpo', 'gomito' + L, loft([dict(t=-0.03, w=0.033, h=0.035), dict(t=0.06, w=0.036, h=0.039, oy=0.003), dict(t=0.16, w=0.029, h=0.031),
                                                       dict(t=0.24, w=0.023, h=0.025), dict(t=0.266, w=0.021, h=0.023)], N=20, step=0.025, mat='pelle'), extras={'regione': 'avambraccio'})
    def hand_def(p, a, t, s=s):
        x, y, z = p; f = sm(0.322, 0.34, t)
        g = sum(exp(-((z - zk) / 0.003) ** 2) for zk in (-0.012, 0.0, 0.012)) * 0.1 * f
        curl = 0.013 * sm(0.3, 0.372, t) ** 1.5
        return (x * (1 - g) - s * curl, y, z)
    hand = loft([dict(t=0.258, w=0.0175, h=0.021), dict(t=0.272, w=0.0162, h=0.026), dict(t=0.295, w=0.0152, h=0.032, oy=0.001), dict(t=0.318, w=0.0142, h=0.0325, oy=0.002),
                 dict(t=0.338, w=0.0122, h=0.029, oy=0.003), dict(t=0.356, w=0.0102, h=0.024, oy=0.004), dict(t=0.368, w=0.007, h=0.016, oy=0.005), dict(t=0.374, w=0.003, h=0.007, oy=0.005)],
                N=20, step=0.007, deform=hand_def, mat='pelle')
    th = loft(taper(0, 0.04, 0.0072, 0.0082, 0.005, 0.0056, 0.08, 5), N=12, step=0.007, mat='pelle')
    th.xform(tr(-s * 0.006, -0.283, 0.026) @ rot(-0.3, 0, -s * 0.14)); hand.add(th)
    build('gomito' + L + '_mano', 'gomito' + L, hand, extras={'regione': 'mano'})

    pezzo('abiti', 'abito', **ABITO)                 # manica dell'abito e manica a campana con le pieghe e l'orlo a punte che scende dietro
    build('gomito' + L + '_abito', 'gomito' + L, loft([dict(t=-0.03, w=0.048 * aw, h=0.05 * aw), dict(t=0.06, w=0.052 * aw, h=0.054 * aw, oy=0.004), dict(t=0.13, w=0.045 * aw, h=0.047 * aw)], N=24, step=0.02, mat='abito'))
    def sleeve_pt(u, v):
        a = u * TAU; back = 0.5 - 0.5 * cos(a)            # 0 davanti, 1 dietro
        t = 0.075 + v * (0.12 + 0.065 * back ** 1.5) + 0.02 * v ** 3 * tri(u * 6) ** 1.5; r = 0.037 + 0.034 * v ** 1.4
        r *= 1 + 0.12 * v * sin(7 * a + 0.5 * sin(2 * a))
        return (r * sin(a), -t, r * cos(a))
    slv = Part(); NU2, NV2 = 36, 9
    for j in range(NV2 + 1):
        for i in range(NU2): slv.v.append(sleeve_pt(i / NU2, j / NV2))
    for j in range(NV2):
        for i in range(NU2):
            a, b, c, d = j * NU2 + i, j * NU2 + (i + 1) % NU2, (j + 1) * NU2 + i, (j + 1) * NU2 + (i + 1) % NU2
            slv.face([a, c, d, b], [(i / NU2 * 3, j / NV2), (i / NU2 * 3, (j + 1) / NV2), ((i + 1) / NU2 * 3, (j + 1) / NV2), ((i + 1) / NU2 * 3, j / NV2)], 'abito')
    build('gomito' + L + '_manica', 'gomito' + L, slv, mods=[('SOLIDIFY', dict(thickness=0.003, offset=1.0))])
    D('gomito' + L).add(tube([sleeve_pt(i / NU2, 1.0) for i in range(NU2)], 0.0032, 4, True, 'bordo'))

    pezzo('abiti', 'bracciali')                     # bracciale di cuoio allacciato sull'esterno
    br = loft([dict(t=0.165, w=0.037, h=0.039), dict(t=0.21, w=0.034, h=0.036), dict(t=0.262, w=0.03, h=0.032)], N=24, step=0.016, mat='cuoio')
    BR = br.bvh()
    for tt in (0.17, 0.257): D('gomito' + L).add(tube(ring_on(BR, -tt, 24, 0.001), 0.0022, 4, True, 'cintura'))
    for k in range(3):
        y0, y1 = -(0.18 + k * 0.024), -(0.18 + (k + 1) * 0.024)
        for x0, x1 in ((-0.008, 0.008), (0.008, -0.008)):
            a = probe(BR, (s * 0.4, y0, x0), (-s, 0, 0), 0.0012); b = probe(BR, (s * 0.4, y1, x1), (-s, 0, 0), 0.0012)
            if a and b: D('gomito' + L).add(tube([tuple(a), tuple((a + b) / 2 + Vector((s * 0.0015, 0, 0))), tuple(b)], 0.0013, 4, False, 'bordo'))
    build('gomito' + L + '_bracciale', 'gomito' + L, br)

# ================================================================= GAMBE: cosce, gambe e piedi nudi, calze, stivali
fy = -S['shin'] - (S['hip'] - (0.06 + S['thigh'] + S['shin'])) + 0.05; g0 = -(S['hip'] - 0.06 - S['thigh']) - fy   # centro del piede e suolo rispetto al ginocchio
for s in (1, -1):
    L = 'S' if s > 0 else 'D'
    thigh_secs = [dict(t=-0.078, w=0.03, h=0.03), dict(t=-0.068, w=0.062 * lw, h=0.064 * lw), dict(t=-0.05, w=(0.074 + 0.012) * lw, h=0.08 * lw),   # cima a cupola: niente gradino sui fianchi
                  dict(t=0.1, w=(0.074 + 0.006) * lw, h=0.084 * lw, oy=0.01), dict(t=S['thigh'] * 0.62, w=0.064 * lw, h=0.07 * lw, oy=0.006),
                  dict(t=S['thigh'] * 0.9, w=0.056 * lw, h=0.06 * lw), dict(t=S['thigh'] + 0.02, w=0.054 * lw, h=0.058 * lw)]
    shin_secs = [dict(t=-0.03, w=0.052 * lw, h=0.058 * lw), dict(t=0.0, w=0.053 * lw, h=0.062 * lw, bumps=[(0.0, 0.18, 0.1)]), dict(t=0.1, w=0.054 * lw, h=0.066 * lw, oy=-0.012),
                 dict(t=S['shin'] * 0.6, w=0.045 * lw, h=0.05 * lw), dict(t=S['shin'] * 0.89, w=0.031, h=0.035, oy=-0.004), dict(t=S['shin'] + 0.022, w=0.029, h=0.033, oy=-0.004)]
    corpo()
    build('coscia' + L + '_corpo', 'coscia' + L, loft(shrink(thigh_secs, 0.003), N=24, step=0.03, mat='pelle'), extras={'regione': 'coscia'})
    build('ginocchio' + L + '_corpo', 'ginocchio' + L, loft(shrink(shin_secs, 0.003), N=24, step=0.025, mat='pelle'), extras={'regione': 'gamba'})
    # piede nudo: tallone, arco, pianta e dita accennate (solchi); l'alluce verso l'interno, le dita esterne più corte
    fs = [(-0.065, 0.019, 0.02), (-0.05, 0.026, 0.032), (-0.025, 0.029, 0.044), (0.02, 0.032, 0.038), (0.07, 0.036, 0.025), (0.115, 0.038, 0.016),
          (0.145, 0.034, 0.012), (0.163, 0.026, 0.009), (0.171, 0.01, 0.005)]
    fsec = [dict(t=t, w=w, h=h, oy=g0 + h + 0.001, ox=-s * 0.005 * sm(0.07, 0.17, t)) for t, w, h in fs]
    def toe_def(p, a, t, s=s):
        x, y, z = p; up = max(0.0, cos(a * TAU)); f = sm(0.128, 0.15, t)
        toes = [xk - s * 0.005 for xk in (-0.02, -0.008, 0.003, 0.013, 0.022)]          # cinque dita: solchi sopra e punte tonde davanti
        y -= 0.004 * up * f * sum(exp(-((x - (a_ + b_) / 2) / 0.0024) ** 2) for a_, b_ in zip(toes, toes[1:]))
        z -= 0.008 * sm(0.14, 0.17, t) * (1 - max(exp(-((x - xk) / 0.0055) ** 2) for xk in toes))
        return (x, y, z - 0.02 * sm(0.11, 0.17, t) * max(0.0, s * x) / 0.04)
    foot = loft(fsec, N=28, axis='z', R=0.75, step=0.008, deform=toe_def, mat='pelle'); foot.xform(tr(0, fy, 0.03))
    build('ginocchio' + L + '_piede', 'ginocchio' + L, foot, extras={'regione': 'piede'})

    pezzo('intimo', 'calze', nasconde=('coscia', 'gamba'))
    build('coscia' + L + '_calze', 'coscia' + L, loft(thigh_secs, N=24, step=0.03, mat='calze'), extras={'regione': 'coscia'})
    build('ginocchio' + L + '_calze', 'ginocchio' + L, loft(shin_secs, N=24, step=0.025, mat='calze'), extras={'regione': 'gamba'})

    pezzo('abiti', 'stivali', nasconde=('gamba', 'piede'))
    sh = Part()
    boot = loft([dict(t=0.035, w=0.062 * lw, h=0.068 * lw), dict(t=0.12, w=0.058 * lw, h=0.07 * lw, oy=-0.008), dict(t=0.22, w=0.052 * lw, h=0.06 * lw, oy=-0.006),
                 dict(t=S['shin'] * 0.84, w=0.044 * lw, h=0.05 * lw, oy=-0.002), dict(t=S['shin'] + 0.02, w=0.048 * lw, h=0.054 * lw)], N=28, step=0.025, mat='cuoio')
    KB = boot.bvh(); sh.add(boot)
    def cuff_def(p, a, t):                          # risvolto con la punta sul davanti e il profilo dorato
        d = (a + 0.5) % 1 - 0.5; dip = 0.034 * exp(-(d / 0.07) ** 2) * sm(0.02, 0.07, t)
        return (p[0], p[1] - dip, p[2])
    sh.add(loft([dict(t=-0.008, w=0.066 * lw, h=0.072 * lw), dict(t=0.02, w=0.071 * lw, h=0.077 * lw), dict(t=0.07, w=0.07 * lw, h=0.076 * lw)], N=32, step=0.02, caps=(True, False), deform=cuff_def, mat='cuoio'))
    ring = [cuff_def(sec_point(dict(t=0.07, w=0.07 * lw + 0.0012, h=0.076 * lw + 0.0012), i / 32, 0.9, 'y'), i / 32, 0.07) for i in range(32)]
    D('ginocchio' + L).add(tube(ring, 0.0022, 4, True, 'bordo'))
    eye = []                                        # lacci incrociati davanti, con gli occhielli
    for k in range(6):
        y = -(0.13 + k * 0.035)
        for sd in (-1, 1): q = probe(KB, (sd * 0.012, y, 0.4), (0, 0, -1), 0.0008); eye.append(q); D('ginocchio' + L).add(ellipsoid(tuple(q), (0.0022, 0.0022, 0.0012), 6, 'metallo'))
    for k in range(5):
        L0, R0, L1, R1 = eye[2 * k], eye[2 * k + 1], eye[2 * k + 2], eye[2 * k + 3]
        for a, b in ((L0, R1), (R0, L1)): D('ginocchio' + L).add(tube([tuple(a), tuple((a + b) / 2 + Vector((0, 0, 0.003))), tuple(b)], 0.0015, 4, False, 'bordo'))
    seam = [tuple(probe(KB, (s * 0.4, -t, 0.0), (-s, 0, 0), 0.0006)) for t in [0.08 + k * 0.02 for k in range(15)]]   # cucitura sul fianco esterno
    D('ginocchio' + L).add(tube(seam, 0.0011, 4, False, 'cintura'))
    bs = [dict(t=-0.078, w=0.03, h=0.028), dict(t=-0.06, w=0.044, h=0.044), dict(t=-0.02, w=0.05, h=0.05), dict(t=0.04, w=0.05, h=0.043), dict(t=0.1, w=0.046, h=0.032),
          dict(t=0.15, w=0.036, h=0.024), dict(t=0.19, w=0.02, h=0.016), dict(t=0.212, w=0.004, h=0.006)]   # piede a punta, suola e tacco
    for d in bs: d['oy'] = g0 + 0.013 + d['h'] * 0.98
    sh.add(loft(bs, N=20, axis='z', step=0.022, mat='cuoio').xform(tr(0, fy, 0.03)))
    so = [dict(t=d['t'] - 0.004 if i == 0 else d['t'], w=d['w'] * 1.08 + 0.003, h=0.0065, oy=g0 + 0.0065 + 0.0035) for i, d in enumerate(bs[:-1])] + [dict(t=0.217, w=0.003, h=0.004, oy=g0 + 0.01)]
    sh.add(loft(so, N=16, axis='z', R=0.3, step=0.03, mat='cintura').xform(tr(0, fy, 0.03)))
    sh.add(loft([dict(t=-0.082, w=0.032, h=0.009, oy=g0 + 0.009), dict(t=-0.06, w=0.042, h=0.009, oy=g0 + 0.009), dict(t=-0.02, w=0.044, h=0.009, oy=g0 + 0.009)], N=24, axis='z', R=0.3, step=0.01, mat='cintura').xform(tr(0, fy, 0.03)))
    build('ginocchio' + L + '_stivale', 'ginocchio' + L, sh)

for (j, pz), (g, tags) in DET.items(): build(j + '_' + pz + '_dettagli', j, g, tags=tags, extras={'noOutline': 1})

# ---------------------------------------------------------------- esporta
nfaces = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print('oggetti', len([o for o in bpy.data.objects if o.type == 'MESH']), 'facce', nfaces)
if args.blend: bpy.ops.wm.save_as_mainfile(filepath=args.blend)
bpy.ops.export_scene.gltf(filepath=args.out, export_format='GLB', export_apply=True, export_yup=True, export_animations=False,
                          export_texcoords=True, export_normals=True, export_materials='EXPORT', export_image_format='NONE', export_extras=True)
print('scritto', args.out)
