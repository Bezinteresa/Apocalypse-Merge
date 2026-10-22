"""Shrink game sprites: big PNGs become 256-colour palette PNGs (with transparency), same size in pixels.
Originals are kept in art/originals/<same path>. Run: python art/compress_sprites.py [limit_kb]  (default 40 KB).
WebP scenes are already compressed by save_generated_asset.py and are skipped."""
import os
import shutil
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
sprites = root / 'public' / 'sprites'
originals = root / 'art' / 'originals'
limit = int(sys.argv[1]) * 1024 if len(sys.argv) > 1 else 40 * 1024

saved = 0
for path in sorted(sprites.rglob('*.png')):
    size = path.stat().st_size
    if size <= limit:
        continue
    with Image.open(path) as im:
        if im.mode == 'P':
            continue  # already a palette image
        rel = path.relative_to(sprites)
        backup = originals / rel
        if not backup.exists():
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, backup)
        # Hand-painted gradients: light dithering hides palette banding.
        small = im.convert('RGBA').quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    tmp = path.with_suffix('.tmp.png')
    small.save(tmp, optimize=True)
    new = tmp.stat().st_size
    if new < size:
        os.replace(tmp, path)
        saved += size - new
        print(f'{rel}: {size // 1024} KB -> {new // 1024} KB')
    else:
        tmp.unlink()
print(f'saved {saved // 1024} KB')
