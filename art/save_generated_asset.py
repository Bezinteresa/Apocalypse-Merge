"""Copy a ChatGPT image into its game slot at the requested pixel size.

python art/save_generated_asset.py <source> <file> <width> <height> [--replace] [--trim]
  <file>     path inside public/sprites, e.g. items/T01.png or shop/shop_00.webp
  --replace  redo an existing picture (listed in ART_TODO.md)
  --trim     cut transparent margins first, then fit the object centered (keeps aspect ratio)
Hand-painted art: smooth Lanczos downscale. .webp slots (shop scenes, cards) are saved as opaque WebP.
"""
import json
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source, relative, width, height = sys.argv[1:5]
size = (int(width), int(height))
flags = sys.argv[5:]
destination = root / 'public' / 'sprites' / relative
destination.parent.mkdir(parents=True, exist_ok=True)
if destination.exists() and '--replace' not in flags:
    raise SystemExit(f'Refusing to replace existing asset: {destination} (add --replace to redo it)')

with Image.open(source) as original:
    if destination.suffix.lower() == '.webp':
        # Opaque scene: crop to the target aspect ratio from the center, then smooth downscale.
        img = original.convert('RGB')
        target = size[0] / size[1]
        if img.width / img.height > target:
            w = round(img.height * target)
            img = img.crop(((img.width - w) // 2, 0, (img.width - w) // 2 + w, img.height))
        else:
            h = round(img.width / target)
            img = img.crop((0, (img.height - h) // 2, img.width, (img.height - h) // 2 + h))
        result = img.resize(size, Image.Resampling.LANCZOS)
        result.save(destination, 'WEBP', quality=78, method=6)
        alpha = (255, 255)
    else:
        img = original.convert('RGBA')
        if '--trim' in flags:
            box = img.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
            if box:
                img = img.crop(box)
            scale = min(size[0] * 0.92 / img.width, size[1] * 0.92 / img.height)
            fitted = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.Resampling.LANCZOS)
            result = Image.new('RGBA', size)
            result.paste(fitted, ((size[0] - fitted.width) // 2, (size[1] - fitted.height) // 2))
        else:
            result = img.resize(size, Image.Resampling.LANCZOS)
        alpha = result.getchannel('A').getextrema()
        result.save(destination, optimize=True)
print(json.dumps({'file': relative, 'size': result.size, 'alpha_range': alpha}))
