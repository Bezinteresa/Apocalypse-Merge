"""Иконка и обложки для Яндекс Игр из графики игры (не скриншоты).

Запуск из корня проекта: python Store/yandex/make_images.py
Результат — рядом со скриптом: icon_512x512.png, cover_800x470_ru.png, cover_800x470_en.png,
showcase_1560x520_ru.png, showcase_1560x520_en.png.
Название «Apocalypse Merge» одинаково на обоих языках; переводится только строка под ним.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SPR = ROOT / 'public' / 'sprites'
TITLE_FONT = 'C:/Windows/Fonts/impact.ttf'
TAG_FONT = 'C:/Windows/Fonts/seguibl.ttf'  # Segoe UI Black, есть кириллица

TITLE = 'APOCALYPSE MERGE'
TAGLINE = {
    'ru': 'Объединяй находки — восстанавливай магазин',
    'en': 'Merge your finds — rebuild the shop',
}


def sprite(rel: str, height: int) -> Image.Image:
    im = Image.open(SPR / rel).convert('RGBA')
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.Resampling.LANCZOS)


def background(w: int, h: int, box: tuple[float, float, float, float]) -> Image.Image:
    """box — часть building.webp (доли: left, top, right, bottom), затем обрезка по центру до w×h."""
    src = Image.open(SPR / 'shop' / 'building.webp').convert('RGB')
    src = src.crop((round(box[0] * src.width), round(box[1] * src.height), round(box[2] * src.width), round(box[3] * src.height)))
    s = max(w / src.width, h / src.height)
    src = src.resize((round(src.width * s), round(src.height * s)), Image.Resampling.LANCZOS)
    x, y = (src.width - w) // 2, (src.height - h) // 2
    return src.crop((x, y, x + w, y + h)).convert('RGBA')


def shade(img: Image.Image, top: float = 0.0, bottom: float = 0.0, top_span: float = 0.35, bottom_span: float = 0.35) -> Image.Image:
    """Затемнение сверху и снизу градиентом, чтобы читалась надпись и выделялись персонажи."""
    w, h = img.size
    layer = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(layer)
    for y in range(h):
        a = 0.0
        if y < h * top_span:
            a = max(a, top * (1 - y / (h * top_span)))
        if y > h * (1 - bottom_span):
            a = max(a, bottom * (y - h * (1 - bottom_span)) / (h * bottom_span))
        d.line([(0, y), (w, y)], fill=(16, 10, 4, int(255 * a)))
    return Image.alpha_composite(img, layer)


def place(img: Image.Image, spr: Image.Image, cx: int, bottom: int, shadow: bool = True) -> None:
    """Ставит спрайт центром по x и низом на bottom, с мягкой тенью под ногами."""
    x, y = cx - spr.width // 2, bottom - spr.height
    if shadow:
        sh = Image.new('RGBA', img.size)
        ImageDraw.Draw(sh).ellipse((cx - spr.width * 0.42, bottom - spr.height * 0.035, cx + spr.width * 0.42, bottom + spr.height * 0.03), fill=(0, 0, 0, 140))
        img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(max(2, spr.height // 60))))
    img.alpha_composite(spr, (x, y))


def text_center(img: Image.Image, text: str, font_path: str, size: int, cy: int, max_w: float, fill, stroke_fill, stroke_ratio: float) -> None:
    d = ImageDraw.Draw(img)
    while d.textlength(text, font=ImageFont.truetype(font_path, size)) > max_w:
        size -= 1
    f = ImageFont.truetype(font_path, size)
    sw = max(2, round(size * stroke_ratio))
    l, t, r, b = d.textbbox((0, 0), text, font=f, stroke_width=sw)
    d.text(((img.width - (r - l)) / 2 - l, cy - (b - t) / 2 - t), text, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke_fill)


def title_block(img: Image.Image, lang: str | None, title_size: int, title_cy: int, tag_size: int, tag_cy: int) -> None:
    w = img.width
    text_center(img, TITLE, TITLE_FONT, title_size, title_cy, w * 0.9, (255, 212, 84), (52, 26, 8), 0.09)
    if lang:
        text_center(img, TAGLINE[lang], TAG_FONT, tag_size, tag_cy, w * 0.9, (255, 244, 224), (36, 20, 8), 0.14)


def icon() -> Image.Image:
    img = background(512, 512, (0.3, 0.12, 0.72, 0.82))
    img = shade(img, bottom=0.55, bottom_span=0.5)
    place(img, sprite('characters/LEV.png', 600), 330, 640)
    place(img, sprite('generators/G_TOOL.png', 250), 175, 500)
    return img


def cover(lang: str) -> Image.Image:
    w, h = 800, 470
    img = background(w, h, (0.0, 0.04, 1.0, 0.98))
    img = shade(img, top=0.75, bottom=0.55, top_span=0.42, bottom_span=0.4)
    place(img, sprite('characters/LEV.png', 330), 112, h - 6)
    place(img, sprite('characters/MARTA.png', 320), w - 112, h - 6)
    place(img, sprite('generators/G_TOOL.png', 112), 290, h - 26)
    place(img, sprite('generators/G_ELECTRIC.png', 118), 405, h - 20)
    place(img, sprite('generators/G_PROVISION.png', 104), 518, h - 28)
    title_block(img, lang, 78, 62, 26, 122)
    return img


def showcase(lang: str) -> Image.Image:
    w, h = 1560, 520
    img = background(w, h, (0.0, 0.08, 1.0, 0.86))
    img = shade(img, top=0.7, bottom=0.6, top_span=0.45, bottom_span=0.4)
    for rel, cx, ht in (
        ('characters/LEV.png', 150, 370),
        ('characters/NIKA.png', 330, 345),
        ('characters/SAVVA.png', 1230, 365),
        ('characters/MARTA.png', 1410, 355),
    ):
        place(img, sprite(rel, ht), cx, h - 8)
    for rel, cx, ht in (
        ('generators/G_TOOL.png', 560, 140),
        ('generators/G_MATERIAL.png', 700, 135),
        ('generators/G_ELECTRIC.png', 850, 140),
        ('generators/G_AUTO.png', 1000, 145),
    ):
        place(img, sprite(rel, ht), cx, h - 26)
    title_block(img, lang, 104, 92, 34, 172)
    return img


if __name__ == '__main__':
    icon().convert('RGB').save(OUT / 'icon_512x512.png')
    for lang in ('ru', 'en'):
        cover(lang).convert('RGB').save(OUT / f'cover_800x470_{lang}.png')
        showcase(lang).convert('RGB').save(OUT / f'showcase_1560x520_{lang}.png')
    print('ok')
