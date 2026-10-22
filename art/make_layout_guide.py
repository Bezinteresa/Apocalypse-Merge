"""Draw the building layout guide from src/content/shopLayout.json -> art/guides/building_layout.png.

Attach this picture to the ChatGPT request for shop/building.webp: rooms must sit exactly in the boxes,
repair spots (hatched) stay EMPTY because their objects are separate sprites (zones/<project>_<state>.png).
Run: python art/make_layout_guide.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
layout = json.loads((root / 'src' / 'content' / 'shopLayout.json').read_text(encoding='utf-8'))
W, H = layout['width'], layout['height']


def box(r):
    return (r['x'] * W / 100, r['y'] * H / 100, (r['x'] + r['w']) * W / 100, (r['y'] + r['h']) * H / 100)


img = Image.new('RGB', (W, H), '#cfd8dc')
d = ImageDraw.Draw(img)
d.rectangle((0, 0.2 * H, W, 0.64 * H), fill='#d7ccc8')  # ground floor band
d.rectangle((0, 0.64 * H, W, H), fill='#8d8d8d')  # underground
for room in layout['rooms']:
    fill = '#9e9e9e' if room.get('locked') else ('#c5e1a5' if room.get('outdoor') else '#ffe0b2')
    d.rectangle(box(room), fill=fill, outline='#3e2723', width=6)
    x0, y0, _, _ = box(room)
    label = room['name']['en'].replace('−', '-') + (' (LOCKED, show closed/dark)' if room.get('locked') else '') + (' (outdoor)' if room.get('outdoor') else '')
    d.text((x0 + 10, y0 + 8), label, fill='#3e2723')
for zone in layout['zones']:
    x0, y0, x1, y1 = box(zone)
    d.rectangle((x0, y0, x1, y1), outline='#d32f2f', width=4)
    step = 18
    for k in range(int(x0) - int(y1 - y0), int(x1), step):
        d.line((max(k, x0), y0 + max(0, x0 - k), min(k + (y1 - y0), x1), y0 + min(y1 - y0, x1 - k)), fill='#ef9a9a', width=2)
    d.text((x0 + 6, y0 + 6), f"{zone['project']} keep EMPTY", fill='#b71c1c')
for spot in layout['spots']:
    cx = spot['x'] * W / 100
    bottom = spot['bottom'] * H / 100
    top = bottom - spot['h'] * H / 100
    d.rectangle((cx - 0.4 * spot['h'] * H / 100, top, cx + 0.4 * spot['h'] * H / 100, bottom), outline='#1565c0', width=3)
    d.text((cx - 30, top + 6), f"{spot['visitor']} stands here", fill='#0d47a1')
d.text((20, 20), 'LAYOUT GUIDE (do not draw these lines, labels or colors): sky / facade above, ground floor in the middle, underground shelter below.', fill='#000')

out = root / 'art' / 'guides' / 'building_layout.png'
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out)
print(out)
