# Что сгенерировать сейчас

Файл создан скриптом `node art/art_todo.mjs` (24.10.2026, 10:28:48). Генерируй **только** картинки из этого списка — остальные уже готовы.

**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.

Стиль: Hand-painted 2D cartoon game art, clean bold outlines, soft cel shading, slightly chunky readable shapes; cozy post-apocalyptic mood of hope and everyday humor; base palette rust orange, concrete grey, faded olive and teal, warm accents (lamp yellow, fabric red, plant green) for restored and valuable things; soft warm light from the upper left; original designs, no gore, no weapons, no skulls
Референс: art/reference/style.png — прикладывай к каждой генерации
Правила: One asset per image. No text, letters, logos, watermark, signature, frame or collage. Transparent background except the building background and collection cards. Smooth (Lanczos) downscale to the final size.

Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:
`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.
Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).
Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).
После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.

Осталось: **4**

## zones/R14_broken.png — 2560×96

- Почему: новая картинка
- Что: A row of dead caged bulbs on a sagging cable along the ceiling. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 2560:96.

## zones/R14_fixed.png — 2560×96

- Почему: новая картинка
- Что: A row of caged bulbs glowing warm yellow on a tidy cable. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 2560:96.
- Приложи как основу для правки: public/sprites/zones/R14_broken.png

## zones/R18_fixed.png — 704×576

- Почему: новая картинка
- Что: The same ventilation unit working, fan spinning, ducts reattached, light breeze ribbons. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 704:576.
- Приложи как основу для правки: public/sprites/zones/R18_broken.png

## ui/cell_locked.png — 256×256

- Почему: переделать: нужна объёмная коробка в 3/4 на прозрачном фоне, а не плоская плитка вид сверху (решение пользователя 23.10.2026)
- Что: A closed cardboard box taped shut, drawn as a chunky VOLUMETRIC object in three-quarter view from slightly above: top face, front face and one side face visible, rounded soft edges, light beige cardboard, brown packing tape cross on the top, a couple of dusty cobweb strands at the bottom corners. Covers hidden board cells, sits on the board like an item.
- Кадр: One centered object, fills about 90% of the frame, transparent background, no ground shadow, no backdrop, no text.
