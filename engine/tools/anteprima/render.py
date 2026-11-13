# Disegna i triangoli esportati da personaggio.mjs: viste frontale, di profilo e di tre quarti, con z-buffer e luce.
# Uso: python3 render.py out.png file1.json [file2.json ...]   (TOON=1: anteprima del cel shading di characters/toon.js)
import os
TOON = os.environ.get('TOON') == '1'
def sstep(a, b, x):
    t = min(max((x - a) / (b - a), 0.0), 1.0); return t * t * (3 - 2 * t)
import json, math, sys
import numpy as np
from PIL import Image
def render(tris, yaw, W=260, H=520, scale=None, cy=None):
    c, s = math.cos(yaw), math.sin(yaw); R = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    V = np.array([t[0] for t in tris]) @ R.T; C = np.array([t[1] for t in tris])
    ys = V[:, :, 1]; top, bot = ys.max(), ys.min(); sc = scale or (H * 0.9) / (top - bot); cyy = cy if cy is not None else H * 0.95 + bot * sc
    img = np.full((H, W, 3), 0.55 if TOON else 0.12); zb = np.full((H, W), -1e9); L = np.array([0.35, 0.55, 0.75]); L /= np.linalg.norm(L)
    for (a, b, d), col in zip(V, C):
        n = np.cross(b - a, d - a); nl = np.linalg.norm(n)
        if nl < 1e-12: continue
        n /= nl; sh = 0.3 + 0.7 * abs(n @ L)
        if TOON:
            if n[2] < 0: n = -n
            Lt = np.array([-0.5, 0.62, 0.6]); Lt /= np.linalg.norm(Lt); dd = n @ Lt; lit = sstep(-0.02, 0.07, dd)
            b0 = np.array(col, float); lum = b0 @ [0.299, 0.587, 0.114]; b0 = np.maximum(lum + (b0 - lum) * 1.18, 0)
            cc = b0 * np.array([0.66, 0.6, 0.78]) * (1 - lit) + b0 * lit + b0 * 0.1 * sstep(0.82, 0.9, dd); col = cc * 1.06 * 0.95; sh = 1.0
        P = [(W / 2 + p[0] * sc, cyy - p[1] * sc, p[2]) for p in (a, b, d)]
        xs = [p[0] for p in P]; yy = [p[1] for p in P]
        x0, x1 = max(0, int(min(xs))), min(W - 1, int(max(xs)) + 1); y0, y1 = max(0, int(min(yy))), min(H - 1, int(max(yy)) + 1)
        if x1 < x0 or y1 < y0: continue
        (ax, ay, az), (bx, by, bz), (dx, dy, dz) = P; den = (by - dy) * (ax - dx) + (dx - bx) * (ay - dy)
        if abs(den) < 1e-9: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        w1 = ((by - dy) * (gx - dx) + (dx - bx) * (gy - dy)) / den; w2 = ((dy - ay) * (gx - dx) + (ax - dx) * (gy - dy)) / den; w3 = 1 - w1 - w2
        m = (w1 >= 0) & (w2 >= 0) & (w3 >= 0); z = w1 * az + w2 * bz + w3 * dz
        sub = zb[y0:y1 + 1, x0:x1 + 1]; upd = m & (z > sub); sub[upd] = z[upd]
        img[y0:y1 + 1, x0:x1 + 1][upd] = np.clip(np.array(col) * sh, 0, 1)
    if TOON:  # contorno: salti di profondità e silhouette, circa come lo scafo invertito
        edge = np.zeros(zb.shape, bool); bg = zb < -1e8
        for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            z2 = np.roll(np.roll(zb, dy, 0), dx, 1); edge |= (~bg) & ((z2 < -1e8) | (z2 - zb > 0.04))
        img[edge] = [0x2b / 255, 0x1d / 255, 0x18 / 255]
    return Image.fromarray((img * 255).astype('uint8')), sc, cyy
out, files = sys.argv[1], sys.argv[2:]
data = [json.load(open(f)) for f in files]
# stessa scala per tutti, per confrontare le altezze
allv = np.array([p for d in data for t in d for p in t[0]]); top, bot = allv[:, 1].max(), allv[:, 1].min(); H = 520; sc = H * 0.9 / (top - bot); cy = H * 0.95 + bot * sc
views = [0.0, math.pi / 2, math.pi / 4 + math.pi * 0.0]
sheet = Image.new('RGB', (260 * len(views) * len(data) + 20 * (len(data) - 1), H), (30, 30, 30)); k = 0
for i, d in enumerate(data):
    for v in views:
        im, _, _ = render(d, v, scale=sc, cy=cy); sheet.paste(im, (k * 260 + i * 20, 0)); k += 1
sheet.save(out); print('salvato', out)
