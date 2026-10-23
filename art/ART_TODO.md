# Что сгенерировать сейчас

Файл создан скриптом `node art/art_todo.mjs` (23.10.2026, 17:11:31). Генерируй **только** картинки из этого списка — остальные уже готовы.

**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.

Стиль: Hand-painted 2D cartoon game art, clean bold outlines, soft cel shading, slightly chunky readable shapes; cozy post-apocalyptic mood of hope and everyday humor; base palette rust orange, concrete grey, faded olive and teal, warm accents (lamp yellow, fabric red, plant green) for restored and valuable things; soft warm light from the upper left; original designs, no gore, no weapons, no skulls
Референс: art/reference/style.png — прикладывай к каждой генерации
Правила: One asset per image. No text, letters, logos, watermark, signature, frame or collage. Transparent background except the building background, collection cards and board tiles. Smooth (Lanczos) downscale to the final size.

Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:
`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.
Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).
Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).
После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.

Осталось: **1**

## ui/cell_locked.png — 256×256

- Почему: переделать: нужна объёмная коробка в 3/4 на прозрачном фоне, а не плоская плитка вид сверху (решение пользователя 23.10.2026)
- Что: A closed cardboard box taped shut, drawn as a chunky VOLUMETRIC object in three-quarter view from slightly above: top face, front face and one side face visible, rounded soft edges, light beige cardboard, brown packing tape cross on the top, a couple of dusty cobweb strands at the bottom corners. Covers hidden board cells, sits on the board like an item.
- Кадр: One centered object, fills about 90% of the frame, transparent background, no ground shadow, no backdrop, no text.
