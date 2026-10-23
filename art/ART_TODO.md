# Что сгенерировать сейчас

Файл создан скриптом `node art/art_todo.mjs` (23.10.2026, 23:47:47). Генерируй **только** картинки из этого списка — остальные уже готовы.

**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.

Стиль: Hand-painted 2D cartoon game art, clean bold outlines, soft cel shading, slightly chunky readable shapes; cozy post-apocalyptic mood of hope and everyday humor; base palette rust orange, concrete grey, faded olive and teal, warm accents (lamp yellow, fabric red, plant green) for restored and valuable things; soft warm light from the upper left; original designs, no gore, no weapons, no skulls
Референс: art/reference/style.png — прикладывай к каждой генерации
Правила: One asset per image. No text, letters, logos, watermark, signature, frame or collage. Transparent background except the building background and collection cards. Smooth (Lanczos) downscale to the final size.

Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:
`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.
Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).
Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).
После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.

Осталось: **34**

## items/F01.png — 256×256

- Почему: новая картинка
- Что: A short rusty pipe offcut with a threaded end, a blue paint stripe around it.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/F02.png — 256×256

- Почему: новая картинка
- Что: A pipe coupling: a chunky blue-painted metal sleeve joining two short pipe ends, two bolts.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/F03.png — 256×256

- Почему: новая картинка
- Что: A valve: a brass pipe valve with a round bright blue handwheel.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/F04.png — 256×256

- Почему: новая картинка
- Что: A water filter: a tall clear cylinder cartridge with a blue cap and white pleated filter inside.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/F05.png — 256×256

- Почему: новая картинка
- Что: A purifier unit: a compact blue metal box with two filter cartridges, a pressure gauge and a small tap.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## generators/G_PIPE.png — 256×256

- Почему: новая картинка
- Что: A pipe rack: a blue-grey metal rack stacked with pipes of different sizes, valves on hooks and a box of filters. A source of pipes and filters; larger and more furniture-like than regular items.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.

## generators/G_PIPE_1.png — 256×256

- Почему: новая картинка
- Что: Generator PART, level 1 of 6: not working yet, looks incomplete. A few loose pipe clamps and a bent bracket.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_PIPE.png

## generators/G_PIPE_2.png — 256×256

- Почему: новая картинка
- Что: Generator PART, level 2 of 6: not working yet, looks incomplete. A single blue-grey rack upright with one pipe hook.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_PIPE.png

## generators/G_PIPE_3.png — 256×256

- Почему: новая картинка
- Что: Generator PART, level 3 of 6: not working yet, looks incomplete. An empty blue-grey pipe rack frame.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_PIPE.png

## generators/G_PIPE_5.png — 256×256

- Почему: новая картинка
- Что: Upgraded generator, level 5 of 6: clearly bigger and richer than level 4, same family and colors. A bigger blue-grey pipe rack full of pipes, valves and filter boxes, a small hand pump on top.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_PIPE.png

## generators/G_PIPE_6.png — 256×256

- Почему: новая картинка
- Что: Upgraded generator, level 6 of 6: clearly bigger and richer than level 4, same family and colors. A large blue-grey plumbing station: pipe rack, filter cabinet and a pressure tank.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.
- Приложи как основу для правки: public/sprites/generators/G_PIPE.png

## portraits/TIKHON.png — 512×512

- Почему: новая картинка
- Что: Tikhon, a lean shelter engineer in his 60s, white stubble, round glasses, knitted cap, worn blue work overalls with many pockets, a headlamp on his forehead, a wrench in the chest pocket, tired but kind smile.
- Кадр: Waist-up, single character, facing slightly left, centered, head and hands fully inside the frame, transparent background, no text.

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

## zones/R14_broken.png — 2560×96

- Почему: новая картинка
- Что: A row of dead caged bulbs on a sagging cable along the ceiling. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 2560:96.

## zones/R14_fixed.png — 2560×96

- Почему: новая картинка
- Что: A row of caged bulbs glowing warm yellow on a tidy cable. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 2560:96.
- Приложи как основу для правки: public/sprites/zones/R14_broken.png

## zones/C08_broken.png — 448×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of a collapsed metal rack, cable reels and broken crates. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:256.

## zones/R15_broken.png — 448×480

- Почему: новая картинка
- Что: A dead rusty diesel backup generator with an open panel and loose wires. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:480.

## zones/R15_fixed.png — 448×480

- Почему: новая картинка
- Что: The same backup generator running, panel closed, green indicator lights, small exhaust pipe. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:480.
- Приложи как основу для правки: public/sprites/zones/R15_broken.png

## zones/R16_broken.png — 480×448

- Почему: новая картинка
- Что: A disassembled water pump station: two rusty pumps, disconnected pipes on the floor. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 480:448.

## zones/R16_fixed.png — 480×448

- Почему: новая картинка
- Что: An assembled pump station with two blue pumps, pipes connected, pressure gauges. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 480:448.
- Приложи как основу для правки: public/sprites/zones/R16_broken.png

## zones/C09_broken.png — 416×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of grey silt, sludge buckets and rotten boards. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:256.

## zones/R17_broken.png — 416×480

- Почему: новая картинка
- Что: Empty filter tanks with cracked glass and dry hoses. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:480.

## zones/R17_fixed.png — 416×480

- Почему: новая картинка
- Что: Tall filter tanks full of clear water, clean hoses and a shiny tap. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:480.
- Приложи как основу для правки: public/sprites/zones/R17_broken.png

## zones/C10_broken.png — 416×256

- Почему: новая картинка
- Что: A rubble pile to clear: a heap of torn air ducts, grilles and dust. Dusty and messy but not scary, reads clearly as junk to be removed.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, the heap rises from a wide flat base, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 416:256.

## zones/R18_broken.png — 704×576

- Почему: новая картинка
- Что: A huge rusty ventilation fan unit, blades jammed, ducts torn off. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 704:576.

## zones/R18_fixed.png — 704×576

- Почему: новая картинка
- Что: The same ventilation unit working, fan spinning, ducts reattached, light breeze ribbons. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 704:576.
- Приложи как основу для правки: public/sprites/zones/R18_broken.png

## characters/TIKHON.png — 320×640

- Почему: новая картинка
- Что: Tikhon, a lean shelter engineer in his 60s, white stubble, round glasses, knitted cap, worn blue work overalls with many pockets, a headlamp on his forehead, a wrench in the chest pocket, rubber boots, holding an old radio handset.
- Кадр: Single character, full body standing, facing the viewer slightly turned left, centered, feet at the bottom of the frame, whole silhouette visible, transparent background, no ground shadow, no text. Same outfit and face as the portrait.
- Приложи как основу для правки: public/sprites/portraits/TIKHON.png

## ui/cell_locked.png — 256×256

- Почему: переделать: нужна объёмная коробка в 3/4 на прозрачном фоне, а не плоская плитка вид сверху (решение пользователя 23.10.2026)
- Что: A closed cardboard box taped shut, drawn as a chunky VOLUMETRIC object in three-quarter view from slightly above: top face, front face and one side face visible, rounded soft edges, light beige cardboard, brown packing tape cross on the top, a couple of dusty cobweb strands at the bottom corners. Covers hidden board cells, sits on the board like an item.
- Кадр: One centered object, fills about 90% of the frame, transparent background, no ground shadow, no backdrop, no text.
