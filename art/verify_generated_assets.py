"""Validate generated sprite slots and make review contact sheets (art/generated-previews/<group>.jpg).
Also renders every item at 48 px, the size it has on a phone board, to check that levels stay readable."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
sprite_root = root / 'public' / 'sprites'
assets = json.loads((root / 'art' / 'generation-prompts.json').read_text(encoding='utf-8'))['assets']
OPAQUE = ('shop/', 'cards/')

errors = []
found = []
for spec in assets:
    path = sprite_root / spec['file']
    if not path.exists():
        continue
    with Image.open(path) as im:
        if im.size != (spec['w'], spec['h']):
            errors.append(f'Wrong dimensions: {spec["file"]}: {im.size}, need {(spec["w"], spec["h"])}')
        alpha = im.convert('RGBA').getchannel('A').getextrema()
        opaque = spec['file'].startswith(OPAQUE)
        if opaque and alpha != (255, 255):
            errors.append(f'Unexpected transparency: {spec["file"]}')
        if not opaque and (alpha[0] != 0 or alpha[1] < 250):
            errors.append(f'No real transparency (white box?): {spec["file"]}: alpha {alpha}')
    found.append(spec)

previews = root / 'art' / 'generated-previews'
previews.mkdir(exist_ok=True)


def sheet(name, specs, thumb, label=True):
    if not specs:
        return
    columns = 6
    cw, ch = thumb[0] + 16, thumb[1] + (24 if label else 16)
    img = Image.new('RGB', (columns * cw, ((len(specs) + columns - 1) // columns) * ch), '#2a2622')
    draw = ImageDraw.Draw(img)
    for i, spec in enumerate(specs):
        with Image.open(sprite_root / spec['file']) as original:
            t = original.convert('RGBA')
            t.thumbnail(thumb, Image.Resampling.LANCZOS)
            x = (i % columns) * cw + (cw - t.width) // 2
            y = (i // columns) * ch + (thumb[1] - t.height) // 2 + 4
            img.paste(t, (x, y), t)
        if label:
            draw.text(((i % columns) * cw + 4, (i // columns) * ch + thumb[1] + 6), Path(spec['file']).stem, fill='white')
    img.save(previews / f'{name}.jpg', quality=92)


for group in dict.fromkeys(s['file'].split('/')[0] for s in found):
    sheet(group, [s for s in found if s['file'].startswith(group + '/')], (180, 180))
sheet('items-48px', [s for s in found if s['file'].startswith('items/')], (48, 48))

report = {'expected': len(assets), 'found': len(found), 'errors': errors}
(root / 'art' / 'generated-assets-report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps(report, indent=2, ensure_ascii=False))
