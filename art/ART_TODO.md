# Что сгенерировать сейчас

Файл создан скриптом `node art/art_todo.mjs` (26.10.2026, 19:29:28). Генерируй **только** картинки из этого списка — остальные уже готовы.

**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.

Стиль: Hand-painted 2D cartoon game art, clean bold outlines, soft cel shading, slightly chunky readable shapes; cozy post-apocalyptic mood of hope and everyday humor; base palette rust orange, concrete grey, faded olive and teal, warm accents (lamp yellow, fabric red, plant green) for restored and valuable things; soft warm light from the upper left; original designs, no gore, no weapons, no skulls
Референс: art/reference/style.png — прикладывай к каждой генерации
Правила: One asset per image. No text, letters, logos, watermark, signature, frame or collage. Transparent background except the building background and collection cards. Smooth (Lanczos) downscale to the final size.

Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:
`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.
Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).
Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).
После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.

Осталось: **27**

## items/K01.png — 256×256

- Почему: новая картинка
- Что: A rolled white bandage with a red cross stripe and a small safety pin.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/K02.png — 256×256

- Почему: новая картинка
- Что: An amber glass iodine bottle with a dropper cap and a red cross label sticker (no text).
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/K03.png — 256×256

- Почему: новая картинка
- Что: A small white first-aid box with a bold red cross and a carry handle.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/K04.png — 256×256

- Почему: новая картинка
- Что: A red medical shoulder bag with a white cross patch, bulging with supplies.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/K05.png — 256×256

- Почему: новая картинка
- Что: A doctor's kit: an open red-and-white case with a stethoscope, bandages, bottles and syringes in neat slots.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## generators/G_MED.png — 256×256

- Почему: новая картинка
- Что: A medicine cabinet: a white metal wall cabinet with a red cross on the glass door, shelves of bandages, bottles and boxes. A source of medical supplies; larger and more furniture-like than regular items.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.

## generators/G_MED_1.png — 256×256

- Почему: новая картинка
- Что: Generator PART, level 1 of 6: not working yet, looks incomplete. A loose red-cross door handle and a hinge.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_MED.png

## generators/G_MED_2.png — 256×256

- Почему: новая картинка
- Что: Generator PART, level 2 of 6: not working yet, looks incomplete. A single white cabinet shelf with a cracked glass pane.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_MED.png

## generators/G_MED_3.png — 256×256

- Почему: новая картинка
- Что: Generator PART, level 3 of 6: not working yet, looks incomplete. An empty white medicine cabinet with an open glass door.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_MED.png

## generators/G_MED_5.png — 256×256

- Почему: новая картинка
- Что: Upgraded generator, level 5 of 6: clearly bigger and richer than level 4, same family and colors. A bigger double medicine cabinet full of supplies, a small sink beside it.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_MED.png

## generators/G_MED_6.png — 256×256

- Почему: новая картинка
- Что: Upgraded generator, level 6 of 6: clearly bigger and richer than level 4, same family and colors. A large medical station: two cabinets, a sink, a lamp and a stretcher folded at the side.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_MED.png

## portraits/VERA.png — 512×512

- Почему: новая картинка
- Что: Vera, a shelter doctor in her 40s, short dark hair with a grey streak, kind tired eyes, a patched white coat over a green sweater, a stethoscope around her neck, warm reassuring smile.
- Кадр: Waist-up, single character, facing slightly left, centered, head and hands fully inside the frame, transparent background, no text.

## shop/level2.webp — 1600×340

- Почему: новая картинка
- Что: The living level of the shelter as a cross-section strip directly below the technical level: three empty underground rooms side by side separated by concrete pillars (living rooms on the left, kitchen in the middle, medbay on the right), bare concrete walls with old tiles, pipes along the ceiling, dim warm light. Rooms must stay EMPTY: furniture and junk are separate sprites.
- Кадр: Wide cross-section strip, same style, colors and slightly elevated front view as the building background, continues it downward; fills the frame edge to edge, NOT transparent, no text, no people, no UI.
- Приложи как основу для правки: public/sprites/shop/building.webp

## zones/R19_broken.png — 288×576

- Почему: новая картинка
- Что: A staircase going down blocked by fallen boards and a toppled cabinet. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 288:576.

## zones/R19_fixed.png — 288×576

- Почему: новая картинка
- Что: A cleared staircase with a fresh handrail and a hanging lantern. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 288:576.
- Приложи как основу для правки: public/sprites/zones/R19_broken.png

## zones/C11_broken.png — 416×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of broken bunk bed frames, torn mattresses and springs. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:256.

## zones/R20_broken.png — 832×448

- Почему: новая картинка
- Что: Two broken bunk beds with torn mattresses and an empty locker. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 832:448.

## zones/R20_fixed.png — 832×448

- Почему: новая картинка
- Что: Two made bunk beds with blankets, a locker and a small warm lamp. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 832:448.
- Приложи как основу для правки: public/sprites/zones/R20_broken.png

## zones/R21_broken.png — 640×448

- Почему: новая картинка
- Что: A cold dirty stove with a broken hood and empty shelves. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 640:448.

## zones/R21_fixed.png — 640×448

- Почему: новая картинка
- Что: A working stove with a pot steaming, a clean hood and shelves with jars. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 640:448.
- Приложи как основу для правки: public/sprites/zones/R21_broken.png

## zones/C12_broken.png — 384×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of broken plates, dented pots and kitchen junk. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:256.

## zones/R22_broken.png — 576×448

- Почему: новая картинка
- Что: An empty medbay corner: a torn couch, a broken cabinet and a dead lamp. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 576:448.

## zones/R22_fixed.png — 576×448

- Почему: новая картинка
- Что: A tidy medbay corner: a clean couch, a cabinet with medicines and a bright lamp. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 576:448.
- Приложи как основу для правки: public/sprites/zones/R22_broken.png

## zones/C13_broken.png — 384×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of old wooden crates, empty boxes and broken bottles. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:256.

## zones/R23_broken.png — 416×288

- Почему: новая картинка
- Что: A long table with broken chairs and dust. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:288.

## zones/R23_fixed.png — 416×288

- Почему: новая картинка
- Что: A long table set with bowls, bread and a teapot, chairs around it. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:288.
- Приложи как основу для правки: public/sprites/zones/R23_broken.png

## characters/VERA.png — 320×640

- Почему: новая картинка
- Что: Vera, a shelter doctor in her 40s, short dark hair with a grey streak, kind tired eyes, a patched white coat over a green sweater, a stethoscope around her neck, practical boots, holding a small first-aid box.
- Кадр: Single character, full body standing, facing the viewer slightly turned left, centered, feet at the bottom of the frame, whole silhouette visible, transparent background, no ground shadow, no text. Same outfit and face as the portrait.
- Приложи как основу для правки: public/sprites/portraits/VERA.png
