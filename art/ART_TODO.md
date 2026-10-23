# Что сгенерировать сейчас

Файл создан скриптом `node art/art_todo.mjs` (23.10.2026, 22:05:54). Генерируй **только** картинки из этого списка — остальные уже готовы.

**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.

Стиль: Hand-painted 2D cartoon game art, clean bold outlines, soft cel shading, slightly chunky readable shapes; cozy post-apocalyptic mood of hope and everyday humor; base palette rust orange, concrete grey, faded olive and teal, warm accents (lamp yellow, fabric red, plant green) for restored and valuable things; soft warm light from the upper left; original designs, no gore, no weapons, no skulls
Референс: art/reference/style.png — прикладывай к каждой генерации
Правила: One asset per image. No text, letters, logos, watermark, signature, frame or collage. Transparent background except the building background and collection cards. Smooth (Lanczos) downscale to the final size.

Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:
`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.
Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).
Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).
После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.

Осталось: **8**

## zones/C01_broken.png — 384×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of broken bricks, planks and torn cardboard. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:256.

## zones/C02_broken.png — 416×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of crushed boxes, rags and bent metal. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:256.

## zones/C03_broken.png — 416×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of scrap metal, old tyres and broken tools. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:256.

## zones/C04_broken.png — 384×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of trash bags, broken pallets and a rusty barrel. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:256.

## zones/C05_broken.png — 448×352

- Почему: новая картинка
- Что: A rubble pile to clear: a big pile of car junk: doors, bumpers, tyres and bricks. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:352.

## zones/C06_broken.png — 256×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of concrete chunks and twisted rebar. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 256:256.

## zones/C07_broken.png — 416×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of concrete slabs, a fallen beam and dust. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:256.

## ui/cell_locked.png — 256×256

- Почему: переделать: нужна объёмная коробка в 3/4 на прозрачном фоне, а не плоская плитка вид сверху (решение пользователя 23.10.2026)
- Что: A closed cardboard box taped shut, drawn as a chunky VOLUMETRIC object in three-quarter view from slightly above: top face, front face and one side face visible, rounded soft edges, light beige cardboard, brown packing tape cross on the top, a couple of dusty cobweb strands at the bottom corners. Covers hidden board cells, sits on the board like an item.
- Кадр: One centered object, fills about 90% of the frame, transparent background, no ground shadow, no backdrop, no text.
