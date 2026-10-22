# Что сгенерировать сейчас

Файл создан скриптом `node art/art_todo.mjs` (22.10.2026, 23:48:22). Генерируй **только** картинки из этого списка — остальные уже готовы.

**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.

Стиль: Hand-painted 2D cartoon game art, clean bold outlines, soft cel shading, slightly chunky readable shapes; cozy post-apocalyptic mood of hope and everyday humor; base palette rust orange, concrete grey, faded olive and teal, warm accents (lamp yellow, fabric red, plant green) for restored and valuable things; soft warm light from the upper left; original designs, no gore, no weapons, no skulls
Референс: art/reference/style.png — прикладывай к каждой генерации
Правила: One asset per image. No text, letters, logos, watermark, signature, frame or collage. Transparent background except the building background, collection cards and board tiles. Smooth (Lanczos) downscale to the final size.

Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:
`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.
Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).
Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).
После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.

Осталось: **32**

## zones/R02_broken.png — 384×304

- Почему: новая картинка
- Что: Smashed shop counter lying on its side. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:304.

## zones/R02_fixed.png — 384×304

- Почему: новая картинка
- Что: Restored shop counter patched with metal sheets, clean top with a small cash box. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:304.
- Приложи как основу для правки: public/sprites/zones/R02_broken.png

## zones/R03_broken.png — 192×656

- Почему: новая картинка
- Что: Tall empty broken wall shelf, planks hanging. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 192:656.

## zones/R03_fixed.png — 192×656

- Почему: новая картинка
- Что: Fixed tall wall shelf stocked with tin cans, jars and olive-green food packs. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 192:656.
- Приложи как основу для правки: public/sprites/zones/R03_broken.png

## zones/R04_broken.png — 448×624

- Почему: новая картинка
- Что: Fallen crates and a toppled rusty rack. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:624.

## zones/R04_fixed.png — 448×624

- Почему: новая картинка
- Что: Neat new metal racks with crates stacked in order. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:624.
- Приложи как основу для правки: public/sprites/zones/R04_broken.png

## zones/R05_broken.png — 448×416

- Почему: новая картинка
- Что: Dusty workbench buried under junk. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:416.

## zones/R05_fixed.png — 448×416

- Почему: новая картинка
- Что: Working mechanic's workbench with a vise, hanging tools and a small lamp. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:416.
- Приложи как основу для правки: public/sprites/zones/R05_broken.png

## zones/R06_broken.png — 1472×120

- Почему: новая картинка
- Что: A row of dead ceiling lamps hanging on loose wires. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 1472:120.

## zones/R06_fixed.png — 1472×120

- Почему: новая картинка
- Что: A row of ceiling lamps glowing warm yellow on tidy wires. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 1472:120.
- Приложи как основу для правки: public/sprites/zones/R06_broken.png

## zones/R07_broken.png — 384×624

- Почему: новая картинка
- Что: Empty dry rusty water tank stand. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:624.

## zones/R07_fixed.png — 384×624

- Почему: новая картинка
- Что: Clean blue water tank on a stand with a small pump and a tap with a bucket. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:624.
- Приложи как основу для правки: public/sprites/zones/R07_broken.png

## zones/R08_broken.png — 832×200

- Почему: новая картинка
- Что: Blank broken sign board hanging crooked above the entrance, no text. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 832:200.

## zones/R08_fixed.png — 832×200

- Почему: новая картинка
- Что: Repaired sign board lit with warm string lights, still no text. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 832:200.
- Приложи как основу для правки: public/sprites/zones/R08_broken.png

## chests/CH_WORN.png — 256×256

- Почему: новая картинка
- Что: A small worn wooden chest with rusty iron corners and a simple latch, slightly scuffed, a faint warm glow leaking from the lid gap. Modest reward look.
- Кадр: One centered closed chest, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no text.

## chests/CH_TRADER.png — 256×256

- Почему: новая картинка
- Что: A medium trader's chest: sturdy wood with teal painted panels, brass corners, leather straps and a padlock, a warmer glow from the lid gap. Clearly better than a worn chest.
- Кадр: One centered closed chest, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no text.

## chests/CH_ARCHIVE.png — 256×256

- Почему: новая картинка
- Что: A large archive chest: dark steel with riveted plates, a round dial lock, abstract old stamp marks, a bright golden glow from the seams. The most valuable chest.
- Кадр: One centered closed chest, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no text.

## cards/C_POSTCARD.webp — 512×768

- Почему: новая картинка
- Что: A faded pre-war holiday postcard showing a cheerful intact city skyline, slightly bent corner, lying on an old wooden table.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_TRAM_TICKET.webp — 512×768

- Почему: новая картинка
- Что: An old paper tram ticket with a punched hole, next to a small tram rail fragment and dust, warm nostalgic light.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_TIN_TOY.webp — 512×768

- Почему: новая картинка
- Что: A colorful wind-up tin toy robot with a small key in its back, a bit scratched, standing on a windowsill.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_SEEDS.webp — 512×768

- Почему: новая картинка
- Что: A small paper seed packet with a drawing of red tomatoes (no letters), a few seeds spilled next to a tiny sprout in a cup.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_METRO_MAP.webp — 512×768

- Почему: новая картинка
- Что: A folded old metro map with colored lines and circles (abstract, no letters), one station under a crossroads circled by hand in red pencil.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_RADIO.webp — 512×768

- Почему: новая картинка
- Что: A vintage tube radio receiver with a glowing dial, the needle pointing to an unmarked spot, faint radio waves as soft light rings.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_PHOTO_ALBUM.webp — 512×768

- Почему: новая картинка
- Что: An open family photo album with blurred vintage photos; the visible one shows a small corner shop with people at the counter, faces indistinct.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_ARCHIVE_KEY.webp — 512×768

- Почему: новая картинка
- Что: A heavy old brass service key on a ring with a blank cardboard tag, lying on a dusty blueprint, mysterious cool light.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## cards/C_POWER_SCHEME.webp — 512×768

- Почему: новая картинка
- Что: An old technical schematic of an electric power line on aged blue paper, the line going down underground into a hidden structure, glowing faintly golden as if alive. Epic, mysterious, hopeful.
- Кадр: Collection card illustration, portrait 2:3, NOT transparent, no text, no frame, no border; a nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background.

## ui/coin.png — 128×128

- Почему: новая картинка
- Что: A currency coin: a chunky brass bottle-cap-style coin with a simple star stamped on it, shiny.
- Кадр: Simple bold game icon, one centered object, fills about 85% of the frame, transparent background, no text.

## ui/energy.png — 128×128

- Почему: новая картинка
- Что: An energy icon: a small round battery with a glowing yellow lightning bolt on it.
- Кадр: Simple bold game icon, one centered object, fills about 85% of the frame, transparent background, no text.

## ui/token.png — 128×128

- Почему: новая картинка
- Что: An archive token: a round bronze disc with a punched keyhole shape in the middle.
- Кадр: Simple bold game icon, one centered object, fills about 85% of the frame, transparent background, no text.

## ui/cell.png — 128×128

- Почему: новая картинка
- Что: A clean light wooden floor plank tile with subtle texture and soft rounded corners, plain, low contrast.
- Кадр: Square game board tile seen straight from above, fills the whole frame edge to edge, NOT transparent, no text, no border shadow.

## ui/cell_locked.png — 128×128

- Почему: новая картинка
- Что: A closed cardboard box taped shut, slightly dusty with a few cobweb strands, seen from above, filling the whole tile. Covers hidden board cells.
- Кадр: Square game board tile seen straight from above, fills the whole frame edge to edge, NOT transparent, no text, no border shadow.

## ui/web.png — 256×256

- Почему: новая картинка
- Что: Dusty white cobweb overlay for a square game board tile: thin strands anchored in the corners and along the edges, the center mostly clear so an item underneath stays visible.
- Кадр: Overlay only: transparent background, semi-transparent white strands, no object, no frame, no text, fills the whole square.
