# Personaggi modellati in Blender, a marionetta e a strati (corpo, intimo, abiti, accessori, capelli):
#   --modello elfa   l'elfa di engine/src/characters/villager.js rifatta con più dettaglio, con il suo abito completo
#   --modello wuxia  una donna (umana) da romanzo wuxia: figura a clessidra, chignon con i fiori, dudou di seta
# Il corpo, lo scheletro e il guardaroba sono in comune; misure, viso, orecchie, capelli e capi cambiano per modello.
#
# Pilastri (docs/oggetti.md › Umanoidi, Elfa modellata in Blender, Wuxia):
#  - marionetta a pezzi rigidi: ogni pezzo è figlio di un giunto vuoto con i nomi dell'elfa del motore
#    (anca, busto, collo, testa, mantello, spallaS/D, gomitoS/D, cosciaS/D, ginocchioS/D), niente pelle che si deforma;
#    le clip villagerClips() funzionano senza modifiche; le posizioni vengono dalle misure del modello (userData.misure);
#  - guarda verso +z (nel motore), piedi a y = 0; forme morbide in un pezzo, testa modellata con il volto dipinto;
#  - i materiali hanno solo un NOME (abito, pelle, capelli, seta…): colori, texture pixel-art e cel shading li rimette
#    il motore (characters/elfa3d.js, characters/wuxia3d.js), così restano le palette e lo stile del gioco.
#
# Uso (Blender come modulo Python, `pip install bpy`):
#   python engine/tools/blender/personaggi.py --modello elfa --out engine/assets/elfa.glb [--blend elfa.blend]
#   python engine/tools/blender/personaggi.py --modello wuxia --out engine/assets/wuxia.glb
# oppure con Blender installato (anche su macOS):
#   /Applications/Blender.app/Contents/MacOS/Blender --background --python engine/tools/blender/personaggi.py -- --modello wuxia --out engine/assets/wuxia.glb
#
# Coordinate: tutto si scrive in coordinate "three" (x destra, y su, z avanti) e si converte in quelle di
# Blender (x, -z, y) quando si crea la mesh; l'esportatore glTF le riporta a y in alto.
import sys, math, argparse
import bpy
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument('--modello', default='elfa', choices=['elfa', 'wuxia'])
ap.add_argument('--out', default=None)
ap.add_argument('--blend', default=None)
args = ap.parse_args(argv)
MOD = args.modello; ELF = MOD == 'elfa'; args.out = args.out or MOD + '.glb'

PI, TAU = math.pi, 2 * math.pi
sin, cos, exp, sqrt = math.sin, math.cos, math.exp, math.sqrt
def sm(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def tb(p): return (p[0], -p[2], p[1])                       # three → Blender
def V(*a): return Vector(a)

# misure (metri). ELFA: parte da ELF di villager.js, con le gambe più lunghe e il busto più corto (richiesta dell'autore) e
# confrontata con una foto di riferimento (modella in piedi): spalle più strette e basse, collo e braccia più lunghi, vita meno
# stretta. WUXIA: da una foto di riferimento di una donna adulta (di fronte, di profilo, di schiena), con i tratti femminili
# accentuati un poco: fianchi larghi quanto le spalle (disegnati dalle cosce piene), vita sottile, seno e glutei più pieni,
# gambe lunghe (cavallo a circa metà altezza, ginocchio a 0,29); circa 1,72 m.
# seno, glutei: quanto sporgono (rigonfiamenti del loft); collo_r: raggio del collo; cosce: quanto sono piene in alto
# (i fianchi li disegnano le cosce: con le cosce piene la figura diventa a clessidra senza toccare le ginocchia);
# glutei_k: quanto sporgono i glutei nelle sezioni del bacino dall'alto in basso (t -0,01, 0,04, 0,085, 0,12, 0,145): pieni
# già in alto, il punto più pieno a metà, il fondo che si arrotonda; glutei_a/_s: dove (giri dal centro della schiena) e quanto
# larghi; lombi_k: quanto la curva delle reni entra nelle prime due sezioni del bacino; inclina: di quanto ogni sezione va
# indietro (per la lordosi, il bacino inclinato); anca_w: larghezza del bacino per sezione (t -0,01, 0,015, 0,04, 0,085, 0,12):
# il fianco più largo in basso, all'altezza del cavallo; cosce_k: quanto sono larghe le cosce in cima (cupola stretta: niente
# spigolo sui fianchi) e più giù; cosce_cima: la cima della coscia sezione per sezione (t, larghezza, profondità, avanti), dentro il
# bacino fino al punto più largo del fianco; fondi_cosce: sotto quel punto il lato esterno del gluteo entra nella coscia; brasiliana: l'intimo di sotto è una brasiliana di seta invece della culotte; lordosi: quanto rientrano le reni (curva della schiena); schiena: solco della colonna e scapole. Finiscono nel modello (userData.misure del
# nodo radice), così il motore e la prova di fumo usano le stesse.
MISURE = {
    'elfa': dict(hip=1.06, thigh=0.5, shin=0.4, W=0.84, chest=0.16, waist=0.125, hips=0.21, torso=0.46, shoulder=0.165, shoulderDrop=0.05,
                 upper=0.34, fore=0.32, skirt=0.5, flare=1.38, neck=0.07, head=0.94, armW=0.8, legW=0.86, bust=1, seno=0.25, glutei=0.07, collo_r=0.045, cosce=1.0),
    'wuxia': dict(hip=1.16, thigh=0.51, shin=0.49, W=0.9, chest=0.156, waist=0.112, hips=0.228, torso=0.28, shoulder=0.163, shoulderDrop=0.045,
                  upper=0.29, fore=0.25, skirt=0.45, flare=1.3, neck=0.06, head=0.88, armW=0.78, legW=0.96, bust=1, seno=0.36, seno_largo=0.5, glutei=0.3, glutei_k=(0.6, 1.15, 1.2, 0.85, 0.35), glutei_a=0.095, glutei_s=0.066, glutei_solco=0.07, anca_mezzo=1.0, lombi_k=(0.5, 0.0),
                  anca_w=(0.13, 0.158, 0.176, 0.188, 0.11), cosce_k=(0.6, 0.75, 1.06, 1.0),
                  inclina=(-0.012, -0.035, -0.04, -0.03, -0.01), lordosi=0.22, reni=(-0.05, 0.085, 0.045), cifosi=0.04, collo_indietro=0.018, testa_avanti=0.008, schiena=1.0, anca_raccordo=0.014, brasiliana=1.0, glutei_scolpiti=1.0, glutei_sporgenza=0.45, solco_sale=0.022, fondi_cosce=1.0, cosce_cima=((-0.068, 0.034, 0.035, -0.005), (-0.05, 0.046, 0.05, -0.01), (-0.02, 0.066, 0.06, -0.012), (0.01, 0.08, 0.07, -0.008)), collo_r=0.04, cosce=1.13, sgambato=1.0, vita_culotte=0.005, vita_culotte_dietro=-0.035),
}
S = MISURE[MOD]
# viso: l'elfa ha l'ovale lungo che si affina in un mento piccolo; wuxia un viso più tondo e morbido, guance piene, naso piccolo
VISO = {
    'elfa': dict(mascella=0.48, esp=1.6, basso=1.1, piatto=0.4, guance=0.012, zigomi=0.0, naso=0.17, nasoW=0.07, mento=0.075, HS=(0.093, 0.13, 0.118)),
    'wuxia': dict(mascella=0.4, esp=1.5, basso=1.05, piatto=0.42, guance=0.0, zigomi=0.02, naso=0.12, nasoW=0.065, mento=0.06, HS=(0.098, 0.126, 0.118)),
}
F = VISO[MOD]
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
KS = S['shoulder'] / 0.165                                       # le spalle del busto seguono i giunti delle spalle

# ---------------------------------------------------------------- scena, materiali, giunti
bpy.ops.wm.read_factory_settings(use_empty=True)
COLL = bpy.context.scene.collection
# colori solo per vedere il modello in Blender o in Godot (palette verde); nel gioco li sostituisce il motore
PREVIEW = {
    'abito': 0x3e5a46, 'gonna': 0x3e5a46, 'mantello': 0x2e4436, 'calze': 0x3a3430, 'cuoio': 0x5a4632, 'cintura': 0x2e2218,
    'metallo': 0xc8c8c0, 'bordo': 0xc8a050, 'pelle': 0xecd6c4, 'pelle_ombra': 0xc2afa0, 'capelli': 0xe8dcb0, 'volto': 0xecd6c4,
    'gemma': 0x6ac8b0, 'lino': 0xd6cab0, 'seta': 0xa82a2a, 'petalo': 0xf2ead8,
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

joint(MOD, None, (0, 0, 0)); num = lambda v: [num(x) for x in v] if isinstance(v, (tuple, list)) else float(v)   # anche tabelle (tuple di tuple)
J[MOD]['misure'] = {k: num(v) for k, v in S.items()}
joint('anca', MOD, (0, S['hip'], 0))
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
    dz = {'testa': S.get('testa_avanti', 0.0), 'collo': -S.get('collo_indietro', 0.0)}.get(joint_name, 0.0)
    if dz: vs = [(p[0], p[1], p[2] + dz) for p in vs]      # mascella libera: collo un poco indietro, testa un poco avanti (il perno resta sul collo)
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
def shape_head(x, y, z, inflate=0.0):
    """porting di shapeHead() di villager.js (sfera unitaria → testa; z avanti, y alto) con i parametri del viso F:
    mascella che si stringe verso il mento, metà bassa del viso, profilo più o meno appiattito, zigomi, guance, naso, mento"""
    f0 = max(0.0, min(1.0, (z - 0.05) / 0.75)); Fw = f0 * f0 * (3 - 2 * f0)
    if y < 0:
        k = (-y) ** F['esp']; x *= 1 - F['mascella'] * k
        if z < 0.2: z = z * (1 - 0.35 * k)
        y *= F['basso']
    if z < 0: z *= 1.03 + 0.05 * max(0.0, y)
    x *= 1 - 0.08 * exp(-((y - 0.3) / 0.2) ** 2) * (1 - abs(z))
    if z > 0.3: t = z - 0.3; z = 0.3 + t * (1 - F['piatto'] * min(1.0, t / 0.45))
    if y < -0.1: z += 0.06 * min(1.0, (-y - 0.1) / 0.4) * Fw
    if not inflate:
        z += 0.09 * exp(-((y - 0.22) / 0.08) ** 2) * exp(-1.5 * (x / 0.6) ** 2) * Fw
        for sd in (-1, 1): z -= 0.1 * exp(-((x - sd * 0.3) / 0.15) ** 2 - ((y - 0.07) / 0.1) ** 2) * Fw
        z += (0.05 + F['zigomi']) * exp(-((abs(x) - 0.4) / 0.13) ** 2 - (y / 0.11) ** 2) * Fw
        z -= F['guance'] * exp(-((abs(x) - 0.38) / 0.12) ** 2 - ((y + 0.36) / 0.14) ** 2) * Fw
        nb = exp(-(x / F['nasoW']) ** 2); n = 0.0 if (y > 0.14 or y < -0.32) else (0.14 - y) / 0.44
        if y < -0.22: n *= max(0.0, (y + 0.32) / 0.1)
        z += F['naso'] * n * nb * Fw
        z += 0.04 * exp(-((abs(x) - 0.12) / 0.05) ** 2 - ((y + 0.25) / 0.05) ** 2) * Fw
        z += 0.04 * exp(-(x / 0.22) ** 2 - ((y + 0.43) / 0.05) ** 2) * Fw + 0.035 * exp(-(x / 0.18) ** 2 - ((y + 0.54) / 0.05) ** 2) * Fw
        z -= 0.02 * exp(-(x / 0.2) ** 2 - ((y + 0.64) / 0.05) ** 2) * Fw
        z += F['mento'] * exp(-(x / 0.22) ** 2 - ((y + 0.86) / 0.11) ** 2) * Fw
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
    x, y, z = shape_head(x, y, z, 0.075)
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

HS = tuple(v * hs for v in F['HS']); HY = 0.125 * hs                                  # l'elfa: un po' più stretta e alta dell'elfa del motore
def head_xf(p): return (p[0] * HS[0], p[1] * HS[1] + HY, p[2] * HS[2] + 0.005)

def hair_wuxia(x, y, z):
    """capelli raccolti di wuxia (un pezzo solo, con gli chignon): frangia dritta e leggera fino alle sopracciglia, due ciocche
    sottili davanti alle orecchie fino al mento, nuca scoperta perché i capelli sono tirati in alto, scriminatura dietro"""
    psi = math.degrees(math.atan2(z, abs(x)))
    lock = exp(-((psi - 34) / 3.2) ** 2) * sm(0.35, 0.1, y) * sm(-0.2, 0.15, z) * sm(-0.62, -0.4, y)   # ciocche sottili, fino alla mascella
    fr = 0.29 - 0.035 * tri(x * 8 + 0.5) ** 2                                   # frangia: linea dritta con punte leggere
    face = sm(0.12, 0.42, z) * sm(fr + 0.04, fr, y + 0.1 * x * x)
    ear = sm(0.6, 0.85, abs(x)) * sm(0.25, -0.05, y) * sm(-0.35, 0.05, z)
    chin = sm(-0.4, -0.7, y) * sm(-0.35, 0.05, z)
    nape = sm(-0.58, -0.78, y) * sm(0.35, -0.05, z)                             # nuca scoperta sotto l'attaccatura
    side = sm(0.12, -0.12, y) * sm(-0.42, -0.12, z)                             # raccolti: sotto le orecchie i lati della testa restano scoperti
    keep = sm(0.45, 0.8, lock)
    k = 1 - 0.45 * max(face, ear, chin * 0.65, nape, side) * (1 - keep); x, y, z = x * k, y * k, z * k
    x, y, z = shape_head(x, y, z, 0.06)
    phi = math.atan2(z, -x); top = sm(0.2, 0.95, y); r = math.hypot(x, z) or 1; nx, nz = x / r, z / r
    out = 0.018 * sin(phi * 26 + sin(phi * 4) * 1.2) * (1 - top * 0.6) + 0.025 * top  # ciocche tirate verso l'alto
    if z < 0: out -= 0.035 * exp(-(x / 0.05) ** 2) * sm(0.95, 0.3, y) * sm(0.0, -0.3, z)   # scriminatura dietro, fino alla nuca
    if z > 0.2 and 0.0 < y < 0.6: out += 0.03 * sm(0.55, 0.25, y)                       # la frangia si stacca un poco dalla fronte
    out += 0.035 * sm(0.2, -0.4, z) * sm(-0.7, 0.1, y)                                  # volume dietro, raccolto verso gli chignon
    if lock > 0.02:
        lb = sm(0.15, -0.8, y); y -= 0.3 * lock ** 3 * lb * lb; out += 0.04 * lock * lb; z += 0.03 * lock * lb   # ciuffi fino alla mascella
    return (x + nx * out, y, z + nz * out)

def chignon(hair):
    """due chignon in cima ai lati della testa, avvolti a spirale: si aggiungono ai capelli (stesso pezzo). Restituisce centri e raggi"""
    buns = []
    for s in (1, -1):
        d = Vector((s * 0.53, 0.82, -0.22)).normalized(); c = Vector(head_xf(tuple(d * 1.12))); R = 0.03 * hs / 0.88
        def bun_pt(x, y, z, c=c, R=R):
            th = math.acos(max(-1.0, min(1.0, y))); ph = math.atan2(z, x)
            k = 1 + 0.07 * sin(4 * ph + 7 * th) * sin(th)                       # ciocche avvolte a spirale
            return (c.x + x * R * k * 1.05, c.y + y * R * k * 0.92, c.z + z * R * k)
        hair.add(sphere_grid(28, 18, PI, bun_pt, 'capelli')); buns.append((c, R, s))
    return buns

def fiori(buns):
    """fermagli: un fiore a cinque petali sul davanti di ogni chignon e uno spillone d'oro che lo attraversa"""
    pezzo('accessori', 'fermagli', richiede='capelli')
    for c, R, s in buns:
        n = Vector((s * 0.55, -0.15, 0.82)).normalized(); P = c + n * R * 0.98
        u = n.cross(Vector((0, 1, 0))).normalized(); w = n.cross(u)
        for k in range(5):
            a = k / 5 * TAU + 0.3; dr = u * cos(a) + w * sin(a); q = P + dr * 0.0065 + n * 0.0012; e3 = dr.cross(n)
            M = Matrix(((dr.x, n.x, e3.x, q.x), (dr.y, n.y, e3.y, q.y), (dr.z, n.z, e3.z, q.z), (0, 0, 0, 1)))
            D('testa').add(ellipsoid((0, 0, 0), (0.0068, 0.0016, 0.0042), 10, 'petalo').xform(M))
        D('testa').add(ellipsoid(tuple(P + n * 0.003), (0.0025, 0.0025, 0.0025), 8, 'bordo'))
        a0 = c + Vector((-s * 0.034, 0.012, -0.012)); a1 = c + Vector((s * 0.03, -0.01, 0.008))       # spillone
        D('testa').add(tube([tuple(a0), tuple(a1)], 0.0013, 5, False, 'metallo'))
        D('testa').add(ellipsoid(tuple(a0), (0.0026, 0.0026, 0.0026), 8, 'gemma'))

corpo()
head = sphere_grid(48, 36, PI, lambda x, y, z: head_xf(shape_head(x, y, z)), 'volto')
build('testa_volto', 'testa', head, extras={'regione': 'testa'})
pezzo('capelli', 'capelli')
hair = sphere_grid(72, 60, PI * 0.98, lambda x, y, z: head_xf((hair_point if ELF else hair_wuxia)(x, y, z)), 'capelli')
if not ELF: BUNS = chignon(hair)
build('testa_capelli', 'testa', hair)
headParts = Part().add(head).add(hair); HB = headParts.bvh()

corpo()                                             # orecchie a lama: profilo a foglia, incavo sul davanti più scuro, punta che piega un poco all'indietro
ears = Part()
if ELF:
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
else:                                               # orecchie umane: piccola conchiglia ovale con l'incavo più scuro, quasi coperta dai capelli
    for s in (1, -1):
        def ear_def(p, a, t, s=s):
            x, y, z = p; f = t / 0.056
            if s * x > 0: x -= s * 0.0028 * exp(-(z / 0.0085) ** 2) * sm(0.1, 0.3, f) * sm(0.95, 0.7, f)
            return (x, y, z)
        secs = [dict(t=f * 0.056, w=0.0045 + 0.001 * sin(PI * f), h=h) for f, h in ((0, 0.006), (0.08, 0.011), (0.25, 0.0155), (0.5, 0.015), (0.72, 0.012), (0.88, 0.009), (1, 0.004))]
        e = loft(secs, N=14, axis='y', step=0.006, deform=ear_def, mat='pelle',
                 matf=lambda a, t, s=s: 'pelle_ombra' if (abs(((a - (0.25 if s > 0 else 0.75) + 0.5) % 1) - 0.5) < 0.16 and 0.12 < t / 0.056 < 0.8) else 'pelle')
        e.xform(tr(s * HS[0] * 0.97, HY + 0.026, -0.012) @ rot(0.12, -s * 0.28, 0)); ears.add(e)
build('testa_orecchie', 'testa', ears, extras={'regione': 'orecchie'})
if not ELF: fiori(BUNS)

if ELF:
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
cr_ = S['collo_r']
build('collo_pelle', 'collo', loft(taper(0.0, -S['neck'] - 0.03, cr_, cr_ * 1.067, cr_ * 0.956, cr_ * 1.02, 0, 3), N=28, mat='pelle'), extras={'regione': 'collo'})

# ================================================================= BUSTO
ch = S['chest'] * W
def bp(k):
    """seno: due rigonfiamenti nella sezione del busto; con seno_largo una parte va in un rigonfiamento più largo e morbido (forma tonda)"""
    fl = S.get('seno_largo', 0.0); a = S['seno'] * k
    return [(sd * 0.085, a * (1 - fl), 0.062) for sd in (1, -1)] + ([(sd * 0.09, a * fl, 0.1) for sd in (1, -1)] if fl else [])
torso_secs = [
    dict(t=0.02, w=S['waist'] * W, h=0.102 * W), dict(t=-0.08, w=S['waist'] * W * 0.98, h=0.098 * W, oy=-0.006),
    dict(t=-0.18, w=(S['waist'] + S['chest']) / 2 * W, h=0.11 * W, oy=0.002),
    dict(t=-0.24, w=ch * 0.97, h=0.116 * W, oy=0.008, bumps=bp(0.15)), dict(t=-0.28, w=ch, h=0.12 * W, oy=0.012, bumps=bp(0.75)),
    dict(t=-0.315, w=ch * 1.02, h=0.124 * W, oy=0.016, bumps=bp(1)), dict(t=-0.35, w=ch * 1.03, h=0.126 * W, oy=0.018, bumps=bp(0.8)),
    dict(t=-0.39, w=ch * 1.03, h=0.122 * W, oy=0.012, bumps=bp(0.35)),
    dict(t=-0.425, w=0.13 * KS, h=0.1, oy=-0.004),                                                 # sotto le ascelle
    # spalle morbide e basse: dal braccio al collo la linea scende piano (trapezio), più piena dietro; il collo resta lungo
    dict(t=-0.445, w=0.132 * KS, h=0.092, oy=-0.008), dict(t=-0.462, w=0.118 * KS, h=0.084, oy=-0.011), dict(t=-0.478, w=0.095 * KS, h=0.074, oy=-0.012),
    dict(t=-0.492, w=0.072 * KS, h=0.062, oy=-0.01), dict(t=-0.505, w=0.056, h=0.05, oy=-0.008), dict(t=-0.512, w=0.048, h=0.044, oy=-0.006)]
# La curva delle reni (lordosi) si misura in METRI dal giunto del busto (tb, positivo in giù): la stessa funzione serve al busto
# (tb = t * KT) e al bacino (tb = t + 0,05), così le due parti coincidono alla giuntura anche se il busto si accorcia.
# reni = (centro, ampiezza in altezza, quanto va avanti la vita): una curva lunga e morbida, non una strozzatura sopra il bacino.
RC, RW, RA = S.get('reni', (-0.07, 0.09, 0.05))
def lordosi_m(tb):
    """rigonfiamento negativo dietro (le reni rientrano), in metri"""
    L = S.get('lordosi', 0.0); return [(0.5, -L * exp(-((tb - RC) / RW) ** 2), 0.13)] if L else []
def lordosi_oy(tb):
    """con la curva la vita va un poco avanti"""
    return RA * S.get('lordosi', 0.0) * exp(-((tb - RC) / (RW * 1.1)) ** 2)
def dorso(t):
    """schiena (t del busto, in unità del busto disegnato): solco della colonna, scapole appena in rilievo, dorso arrotondato (cifosi)"""
    B, C = S.get('schiena', 0.0), S.get('cifosi', 0.0); out = []
    if B and t > -0.44: out.append((0.5, -0.035 * B, 0.018))
    if B: out += [(0.5 + sd * 0.1, 0.05 * B * exp(-((t + 0.38) / 0.05) ** 2), 0.05) for sd in (1, -1)]
    if C: out.append((0.5, C * exp(-((t + 0.31) / 0.1) ** 2), 0.17))
    return out
if S.get('lordosi') or S.get('schiena'):
    for s_ in torso_secs:
        s_['bumps'] = s_.get('bumps', []) + dorso(s_['t']) + lordosi_m(s_['t'] * KT)
        s_['oy'] = s_.get('oy', 0.0) + lordosi_oy(s_['t'] * KT)
if S.get('glutei_scolpiti'):                          # il fondo del busto rientra nel bacino scolpito: alla vita nessun bordo che sporge
    torso_secs[0] = dict(torso_secs[0], w=torso_secs[0]['w'] - 0.008, h=torso_secs[0]['h'] - 0.008)
CI = S.get('collo_indietro', 0.0)                    # la base del collo (trapezio) va indietro con il collo: mascella libera davanti
if CI:
    for s_ in torso_secs: s_['oy'] = s_.get('oy', 0.0) - CI * sm(0.44, 0.505, -s_['t'])

def inviluppo(xs, zs):
    """la stoffa tesa non entra negli incavi: per ogni punto, il massimo fra i segmenti tesi sopra di lui (inviluppo superiore)"""
    out = list(zs); n = len(xs)
    for i in range(n):
        for a in range(i + 1):
            for b in range(i, n):
                if b == a: continue
                f = (xs[i] - xs[a]) / (xs[b] - xs[a]); out[i] = max(out[i], zs[a] + (zs[b] - zs[a]) * f)
    return out

def dudou(bv):
    """dudou: pannello di seta sul davanti, teso sopra il seno (non entra nella scollatura) e con la punta in basso sul ventre;
    profilo dorato, un fiore ricamato al centro, lacci al collo e in vita annodati dietro"""
    pezzo('intimo', 'dudou')
    NU, NV, ytop, ybot = 18, 16, 0.405, 0.07
    hw = lambda v: 0.105 * (1 - 0.96 * sm(0.3, 1.0, v))
    xs, ys, zg = [], [], []
    for j in range(NV + 1):
        v = j / NV; y = ytop - (ytop - ybot) * v; ys.append(y); row_x, row_z = [], []
        for i in range(NU + 1):
            x = (i / NU * 2 - 1) * hw(v); q = probe(bv, (x, y, 0.4), (0, 0, -1)); row_x.append(x); row_z.append(q.z if q else 0.0)
        xs.append(row_x); zg.append(inviluppo(row_x, row_z))
    for i in range(NU + 1):                            # anche dall'alto in basso: la stoffa scende dal seno al ventre senza rientrare
        col = inviluppo(ys[::-1], [zg[j][i] for j in range(NV, -1, -1)])[::-1]
        for j in range(NV + 1): zg[j][i] = col[j]
    g = Part(); idx = lambda j, i: j * (NU + 1) + i
    for j in range(NV + 1):
        for i in range(NU + 1): g.v.append((xs[j][i], ys[j], zg[j][i] + 0.003))
    for j in range(NV):
        for i in range(NU):
            g.face([idx(j, i), idx(j + 1, i), idx(j + 1, i + 1), idx(j, i + 1)], [(i / NU, 1 - j / NV), (i / NU, 1 - (j + 1) / NV), ((i + 1) / NU, 1 - (j + 1) / NV), ((i + 1) / NU, 1 - j / NV)], 'seta')
    build('busto_dudou', 'busto', g, mods=[('SOLIDIFY', dict(thickness=0.0018, offset=-1.0))], extras={'regione': 'busto'})
    edge = [g.v[idx(0, i)] for i in range(NU + 1)] + [g.v[idx(j, NU)] for j in range(1, NV + 1)] + [g.v[idx(j, 0)] for j in range(NV - 1, 0, -1)]
    D('busto').add(tube([(x, y, z + 0.0012) for x, y, z in edge], 0.0018, 4, True, 'bordo'))
    DB = g.bvh(); c0 = Vector((0, 0.235, 0))                                      # fiore ricamato in oro
    def on(x, y): q = probe(DB, (x, y, 0.4), (0, 0, -1), 0.0009); return tuple(q) if q else None
    for k in range(5):
        a = k / 5 * TAU + PI / 2; dx, dy = cos(a), sin(a)
        loop = [on(dx * (0.011 + 0.008 * cos(b / 10 * TAU)) - dy * 0.005 * sin(b / 10 * TAU), c0.y + dy * (0.011 + 0.008 * cos(b / 10 * TAU)) + dx * 0.005 * sin(b / 10 * TAU)) for b in range(10)]
        D('busto').add(tube([p for p in loop if p], 0.001, 4, True, 'bordo'))
    D('busto').add(ellipsoid(on(0, c0.y), (0.0028, 0.0028, 0.0012), 8, 'bordo'))
    for s in (1, -1):                                  # lacci: dagli angoli in alto attorno al collo, dai fianchi attorno alla vita
        for (x0, y0), (y1, f_up) in (((s * hw(0), ytop), (0.5, 0.35)), ((s * hw(0.62), ytop - (ytop - ybot) * 0.62), (0.19, 0.0))):
            ph0 = math.atan2(x0, 0.12) / TAU; path = []
            for k in range(13):
                f = k / 12; ph = ph0 + (s * 0.5 - ph0) * sm(f_up, 1.0, f); y = y0 + (y1 - y0) * sm(0.0, max(f_up, 0.3), f)
                d = Vector((sin(ph * TAU), 0, cos(ph * TAU))); q = probe(bv, Vector((0, y, 0)) + d * 0.4, -d, 0.0025)
                if q: path.append(tuple(q))
            D('busto').add(tube(path, 0.0019, 4, False, 'seta'))
        D('busto').add(ellipsoid(tuple(probe(bv, (0, 0.19, -0.4), (0, 0, 1), 0.004)), (0.006, 0.004, 0.003), 8, 'seta'))

corpo()                                             # il busto nudo ha le sezioni dell'abito 4 mm più dentro
body_secs = shrink(torso_secs, 0.004)
body_torso = loft(body_secs, N=40, step=0.024, mat='pelle'); BTB = body_torso.bvh()
build('busto_corpo', 'busto', body_torso, extras={'regione': 'busto'})
if not ELF: dudou(BTB)
if ELF:
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

def cosce_secs():
    """sezioni della coscia (t dal giunto dell'anca in giù); servono anche al bacino per fondersi nella coscia"""
    KC = S['cosce']; KC2 = 1 + (KC - 1) * 0.45; CK = S.get('cosce_k', (1, 1, 1, 1))
    cima = ([dict(t=c[0], w=c[1], h=c[2], oy=c[3] if len(c) > 3 else 0.0) for c in S['cosce_cima']] if S.get('cosce_cima') else   # cima disegnata sezione per sezione
            [dict(t=-0.068, w=0.062 * lw * KC * CK[0], h=0.064 * lw * KC * CK[0]), dict(t=-0.05, w=(0.074 + 0.012) * lw * KC * CK[1], h=0.08 * lw * KC * CK[1])])   # cima a cupola: niente gradino sui fianchi
    return [dict(t=-0.078, w=0.03, h=0.03), *cima,
            dict(t=0.1, w=(0.074 + 0.006) * lw * KC * CK[2], h=0.084 * lw * KC, oy=0.01), dict(t=S['thigh'] * 0.62, w=0.064 * lw * KC2 * CK[3], h=0.07 * lw * KC2, oy=0.006),
            dict(t=S['thigh'] * 0.9, w=0.056 * lw, h=0.06 * lw), dict(t=S['thigh'] + 0.02, w=0.054 * lw, h=0.058 * lw)]

# ================================================================= ANCA: bacino nudo, culotte, baschina, gonna in due metà
hipW = S['hips'] * W
GK, GA, GS = S.get('glutei_k', (0, 1, 1.1, 0.5, 0)), S.get('glutei_a', 0.075), S.get('glutei_s', 0.06)
AW = S.get('anca_w')
LK, IN, LO = S.get('lombi_k', (1, 1)), S.get('inclina', (0, -0.03, -0.04, -0.03, 0)), S.get('lordosi', 0.0)
glutei = lambda k: ([(0.5 - GA, S['glutei'] * k, GS), (0.5 + GA, S['glutei'] * k, GS)] + ([(0.5, -S['glutei_solco'] * k, 0.02)] if S.get('glutei_solco') else [])) if k else []   # due volumi tondi, solco al centro
lombi = lambda t, k: [(a_, m_ * k, s_) for a_, m_, s_ in lordosi_m(t + 0.05)] if LO and k else []   # le reni entrano nel bacino (t del busto = t + 0,05)
avanti = lambda t: lordosi_oy(t + 0.05) if LO else 0.0                                   # la vita va avanti come nel busto: la linea continua senza tacca
pelvis_secs = [dict(t=-0.065, w=S['waist'] * W - 0.003, h=0.102 * W - 0.003, oy=avanti(-0.065), bumps=lombi(-0.065, LK[0])),
               dict(t=-0.01, w=AW[0] if AW else (S['waist'] + S['hips']) / 2 * W - 0.012 - S.get('anca_raccordo', 0.0), h=0.115 * W - 0.008, oy=avanti(-0.01) + IN[0] * LO, bumps=lombi(-0.01, LK[1]) + glutei(GK[0])),
               *([dict(t=0.015, w=AW[1] if AW else (S['waist'] + S['hips']) / 2 * W * 0.45 + (hipW - 0.02) * 0.55 + 0.004, h=0.122 * W - 0.01, oy=-0.004 + (IN[0] + IN[1]) / 2 * LO,
                      bumps=glutei((GK[0] + GK[1]) / 2))] if S.get('anca_mezzo') else []),   # sezione in mezzo: il fianco si arrotonda senza spigolo
               dict(t=0.04, w=AW[2] if AW else hipW - 0.02, h=0.13 * W - 0.014, oy=-0.006 + IN[1] * LO, bumps=glutei(GK[1])), dict(t=0.085, w=AW[3] if AW else hipW - 0.026, h=0.11 * W, oy=-0.01 + IN[2] * LO, bumps=glutei(GK[2])),
               dict(t=0.12, w=AW[4] if AW else 0.1, h=0.068, oy=-0.008 + IN[3] * LO, bumps=glutei(GK[3])), dict(t=0.145, w=0.045, h=0.035, oy=-0.004 + IN[4] * LO, bumps=glutei(GK[4]))]   # con la curva il bacino si inclina: i glutei vanno indietro   # le cosce disegnano la linea dei fianchi
if S.get('glutei_scolpiti'):
    # Glutei scolpiti su una foto di riferimento (vista di schiena e di tre quarti): attacco alto con il gradino sotto le reni,
    # due volumi quasi sferici con il punto più sporgente nella metà alta, solco netto, incavo appena accennato fra fianco e
    # gluteo, fondo che si arrotonda e sporge sopra la coscia (il bacino scende un poco più giù del cavallo, dietro le cosce)
    # e piega quasi orizzontale: i due volumi restano centrati sopra le cosce dall'alto fino in fondo (glutei sodi; se si
    # avvicinano al centro andando in basso sembrano cadenti).
    # Per ogni sezione: t, larghezza, profondità, centro avanti/indietro, distanza fra i due volumi (giri), quanto sporge il
    # gluteo dietro il centro dell'anca (zb, metri: com'erano scolpiti, poi scalati da glutei_sporgenza), larghezza dei volumi, solco,
    # incavo sul lato.
    def gl_sec(t, w, h, oy, off, zb, sg, solco, incavo):
        b = (zb + oy) / (0.809 * h) if zb else 1.0; amt = max(0.0, b - 1) * S.get('glutei_sporgenza', 1.0)   # quanto sporgono (1 = come scolpiti)
        bumps = [(0.5 - off, amt, sg), (0.5 + off, amt, sg)] if amt else []
        if solco: bumps.append((0.5, -solco, 0.02))
        if incavo: bumps += [(0.5 + sd * 0.2, -incavo, 0.035) for sd in (1, -1)]
        return dict(t=t, w=w, h=h, oy=oy, bumps=bumps)
    def sez_busto(t, d):
        """la sezione del busto all'altezza t del bacino (interpolata), stretta di d: la cima del bacino nasce dentro il busto, senza gradino"""
        tT = (t + 0.05) / KT; k = max(i for i in range(len(torso_secs) - 1) if torso_secs[i]['t'] >= tT) if tT <= torso_secs[0]['t'] else 0
        a_, b_ = torso_secs[k], torso_secs[k + 1]; f = max(0.0, min(1.0, (tT - a_['t']) / (b_['t'] - a_['t'])))
        ip = lambda q: a_.get(q, 0.0) + (b_.get(q, 0.0) - a_.get(q, 0.0)) * f
        return dict(t=t, w=ip('w') - d, h=ip('h') - d, oy=ip('oy'), bumps=dorso(tT) + lordosi_m(t + 0.05))
    pelvis_secs = [sez_busto(-0.065, 0.009),
                   gl_sec(-0.03, 0.112, 0.088, 0.004, 0.09, 0.098, 0.065, 0.02, 0.0),
                   gl_sec(0.0, 0.134, 0.096, -0.006, 0.09, 0.128, 0.062, 0.05, 0.015),
                   gl_sec(0.035, 0.158, 0.1, -0.012, 0.09, 0.143, 0.06, 0.07, 0.02),
                   gl_sec(0.07, 0.166, 0.098, -0.016, 0.09, 0.148, 0.06, 0.08, 0.015),
                   gl_sec(0.105, 0.158, 0.092, -0.02, 0.09, 0.145, 0.06, 0.08, 0.0),
                   gl_sec(0.135, 0.14, 0.082, -0.024, 0.092, 0.134, 0.06, 0.1, 0.0),
                   gl_sec(0.158, 0.122, 0.07, -0.028, 0.094, 0.116, 0.058, 0.14, 0.0),
                   gl_sec(0.172, 0.1, 0.056, -0.032, 0.095, 0.088, 0.056, 0.2, 0.0),
                   dict(t=0.18, w=0.075, h=0.04, oy=-0.036, bumps=[(0.5, -0.3, 0.03)])]   # fondo piatto: la piega sotto i glutei resta orizzontale; il solco si apre in fondo
corpo()                                             # bacino liscio come un manichino; le cosce vi entrano dai giunti delle anche
NP = 64 if S.get('glutei_scolpiti') else 40           # più vertici per giro: il solco fra i glutei è più stretto di 1/40 di giro
CS_ = shrink(cosce_secs(), 0.003); XC_ = (0.088 + 0.02) * W     # la coscia nuda e il suo centro (giunto), per la fusione
def su_coscia(p, keep):
    """porta il punto p (sistema dell'anca, a riposo) sulla superficie della coscia del suo lato, a keep del raggio (1 = sulla pelle,
    più di 1 = appena fuori, meno di 1 = dentro), lungo la direzione dal centro della coscia"""
    tt = -p[1] - 0.06; k = max(0, min(len(CS_) - 2, max(i for i in range(len(CS_)) if CS_[i]['t'] <= tt) if tt >= CS_[0]['t'] else 0))
    s0, s1 = CS_[k], CS_[k + 1]; f = max(0.0, min(1.0, (tt - s0['t']) / (s1['t'] - s0['t'])))
    w, h = (s0[q] + (s1[q] - s0[q]) * f for q in ('w', 'h')); oy = s0.get('oy', 0) + (s1.get('oy', 0) - s0.get('oy', 0)) * f
    cx = math.copysign(XC_, p[0]); dx, dz = p[0] - cx, p[2] - oy; e = 2 / 0.9
    rho = max(1e-6, (abs(dx / w) ** e + abs(dz / h) ** e) ** (1 / e))
    return (cx + dx * keep / rho, p[1], oy + dz * keep / rho)
def gl_def(p, a, t, fuori=0.0):
    """in fondo il solco sale un poco: ogni piega sotto il gluteo è orizzontale e all'interno si alza verso il solco (due volumi,
    non un blocco). Lato esterno: dal punto più largo del fianco in giù il bacino aderisce alla coscia, appena fuori, e scendendo
    ci rientra piano; il gluteo vi si raccorda dal suo centro verso il fianco. Così il fianco passa nella coscia con una linea sola
    e la piega sotto il gluteo sfuma verso l'esterno invece di finire a punta sul contorno. fuori: di quanto resta fuori un capo"""
    d = a - 0.5; d -= round(d); k = S.get('solco_sale', 0.0) * exp(-(d / 0.035) ** 2) * sm(0.12, 0.18, t)
    q = (p[0], p[1] + k, p[2]); fu = S.get('fondi_cosce', 0.0) * sm(0.03, 0.09, t) * sm(0.08, 0.16, abs(d)) * (1 - sm(0.26, 0.33, abs(d)))
    if fu <= 0: return q
    r = su_coscia(q, 1.01 + fuori - 0.13 * sm(0.07, 0.16, t)); return tuple(q[i] + (r[i] - q[i]) * fu for i in range(3))
build('anca_corpo', 'anca', loft(pelvis_secs, N=NP, step=0.02, mat='pelle', deform=gl_def), extras={'regione': 'bacino'})
BRAS = S.get('brasiliana', 0.0)
pezzo('intimo', 'brasiliana' if BRAS else 'culotte')
tc = S.get('vita_culotte', -0.035)                    # dove comincia la culotte (più in basso = vita bassa)
tcd = S.get('vita_culotte_dietro', tc)                # dietro il bordo può salire (brasiliana: in cima ai glutei)
t_start = lambda a: tcd + (tc0 - tcd) * ((1 + cos(a * TAU)) / 2) ** 1.5
tc0, tc = tc, min(tc, tcd)
i_ = max(k for k in range(len(pelvis_secs) - 1) if pelvis_secs[k]['t'] <= tc); p0_, p1_ = pelvis_secs[i_], pelvis_secs[i_ + 1]; f_ = (tc - p0_['t']) / (p1_['t'] - p0_['t'])
cul = [dict(t=tc, w=p0_['w'] + (p1_['w'] - p0_['w']) * f_ + 0.002, h=p0_['h'] + (p1_['h'] - p0_['h']) * f_ + 0.002)] + [dict(s, w=s['w'] + 0.002, h=s['h'] + 0.002) for s in pelvis_secs[i_ + 1:] if s['t'] <= 0.15]   # l'intimo arriva al cavallo
culotte = loft(cul, N=NP, step=0.012 if BRAS else 0.02, caps=(False, True), mat='seta' if BRAS else 'lino', deform=lambda p, a, t: gl_def(p, a, t, 0.025))
EDGE_ = []
if S.get('sgambato'):                                # taglio alto: ai fianchi il bordo sale seguendo la piega delle gambe
    N_ = NP; rows_ = (len(culotte.v) - 1) // N_
    for i in range(N_):
        a = i / N_; ts_ = t_start(a); side = abs(sin(a * TAU)) ** 1.2; t_end = 0.145 - (0.145 - (ts_ + 0.03)) * S['sgambato'] * side
        if BRAS and cos(a * TAU) < 0:                    # brasiliana: dietro copre solo la parte centrale e alta dei glutei, con un taglio a V
            db = abs(((a - 0.5) + 0.5) % 1 - 0.5); t_end = min(t_end, 0.145 - (0.145 - (ts_ + 0.015)) * min(1.0, db / 0.17) ** 1.1)
        col_ = [culotte.v[r * N_ + i] for r in range(rows_)]; tv_ = [-v[1] for v in col_]
        lerp_ = lambda r, t: tuple(col_[r][k] + (col_[r + 1][k] - col_[r][k]) * (t - tv_[r]) / ((tv_[r + 1] - tv_[r]) or 1) for k in range(3))
        keep = max([r for r in range(rows_) if tv_[r] <= t_end] or [0])
        pb = lerp_(keep, t_end) if keep + 1 < rows_ else col_[keep]          # il bordo cade dove deve, fra due file (niente gradini)
        for r in range(keep + 1, rows_): culotte.v[r * N_ + i] = pb
        if BRAS:
            r0_ = min([r for r in range(rows_) if tv_[r] >= ts_ - 1e-6] or [0])   # bordo in vita inclinato
            pt = lerp_(r0_ - 1, ts_) if r0_ > 0 else col_[0]
            for r in range(r0_): culotte.v[r * N_ + i] = pt
            EDGE_.append(pb)
build('anca_brasiliana' if BRAS else 'anca_culotte', 'anca', culotte, extras={'regione': 'bacino'})
if BRAS:                                             # profili dorati sul bordo in vita e sulle sgambature, come il dudou
    D('anca').add(tube([culotte.v[i] for i in range(NP)], 0.0016, 4, True, 'bordo'))
    D('anca').add(tube(EDGE_, 0.0016, 4, True, 'bordo'))

if ELF:
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

if ELF:
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
    if ELF:
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

    if ELF:
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
    thigh_secs = cosce_secs()
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

    if ELF:
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
