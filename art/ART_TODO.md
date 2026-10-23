# Что сгенерировать сейчас

Файл создан скриптом `node art/art_todo.mjs` (23.10.2026, 10:39:00). Генерируй **только** картинки из этого списка — остальные уже готовы.

**Порядок работы — в [art/README.md](README.md):** как собрать запрос, куда сохранить, как записать в `art/generation-log.json` и что закоммитить. Готовое исчезает из этого списка само, когда файл нужного размера лежит в `public/sprites/`.

Стиль: Hand-painted 2D cartoon game art, clean bold outlines, soft cel shading, slightly chunky readable shapes; cozy post-apocalyptic mood of hope and everyday humor; base palette rust orange, concrete grey, faded olive and teal, warm accents (lamp yellow, fabric red, plant green) for restored and valuable things; soft warm light from the upper left; original designs, no gore, no weapons, no skulls
Референс: art/reference/style.png — прикладывай к каждой генерации
Правила: One asset per image. No text, letters, logos, watermark, signature, frame or collage. Transparent background except the building background, collection cards and board tiles. Smooth (Lanczos) downscale to the final size.

Готовую картинку сохраняй в `public/sprites/<файл>` точно указанного размера:
`python art/save_generated_asset.py <исходник> <файл> <ширина> <высота> [--trim]` (`--trim` — для items/, generators/, chests/ и иконок; для переделки добавь `--replace`). Затем допиши запись в `art/generation-log.json`.
Потом сожми тяжёлые картинки: `python art/compress_sprites.py` (оригиналы останутся в art/originals).
Проверь всё разом: `python art/verify_generated_assets.py` (превью в art/generated-previews).
После этого снова запусти `node art/art_todo.mjs` — сделанное пропадёт из списка.

Осталось: **38**

## items/A01.png — 256×256

- Почему: новая картинка
- Что: A small rusty tin with car fasteners: bolts, nuts, washers and a spark plug, dark red paint chips on the tin.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/A02.png — 256×256

- Почему: новая картинка
- Что: A repair assembly: a cleaned car part bundle — a pulley, a short drive belt and a bracket tied together with wire, dark red accents.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/A03.png — 256×256

- Почему: новая картинка
- Что: A transmission unit: a compact metal gearbox with visible gears through an open cover, dark red painted housing, oily but restored.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/A04.png — 256×256

- Почему: новая картинка
- Что: An engine block: a small rebuilt car engine with dark red valve cover, hoses and a belt, sitting on a wooden pallet piece.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## items/A05.png — 256×256

- Почему: новая картинка
- Что: A vehicle repair kit: a big dark red metal crate with an engine part, wheel, belts and tools neatly packed — the top car parts item.
- Кадр: One centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no backdrop, no text.

## generators/G_AUTO.png — 256×256

- Почему: новая картинка
- Что: A tall garage parts rack: a dark red metal shelf unit with car parts, tyres, belts and boxes of bolts, a hanging work lamp. A source of car parts; larger and more furniture-like than regular items.
- Кадр: One centered object, 3/4 front view, fills about 85% of the frame, transparent background, no ground shadow, no floor or backdrop, no text.

## portraits/SAVVA.png — 512×512

- Почему: новая картинка
- Что: Savva, a weathered caravan driver in his 50s, short grey beard, flat cap, leather jacket with patches, driving goggles around his neck, a road map in his hand, calm friendly smile.
- Кадр: Waist-up, single character, facing slightly left, centered, head and hands fully inside the frame, transparent background, no text.

## shop/building.webp — 1600×1000

- Почему: переделать: Глава 2 (гараж): гараж нарисован закрытой ролетой во всю стену, а теперь ворота — отдельный спрайт zones/R09. Нарисовать гараж открытым пустым помещением (бетонный пол, стены, без ролеты, машины, ямы и подъёмника) и оставить пустым левый верх убежища под люк R13 — по обновлённой разметке art/guides/building_layout.png. Остальное здание сохранить как есть: приложить текущий shop/building.webp как образец.
- Что: Cross-section front view of a small two-level post-apocalyptic corner shop building at a city crossroads, like a dollhouse with the front wall removed. Top: grey sky and the facade roof line with an empty sign bracket above the entrance. Ground floor, left to right: an open empty garage bay with a concrete floor and bare walls (no shutter, no vehicle — those are separate sprites); a storeroom with bare concrete walls; the main shop floor with patched wallpaper, an entrance doorway on its left side; a workshop corner with pegboard wall; an outdoor yard with cracked asphalt and a fence. Below ground: a dark underground shelter level, barely visible and mysterious; its top-left corner stays empty for the service hatch sprite. Rooms are EMPTY: no furniture, no counter, no shelves, no racks, no workbench, no lamps, no water tank, no sign — those are separate sprites. No people.
- Кадр: Wide 16:10 scene, NOT transparent. Follow the attached layout guide exactly: walls, floors and room borders where the guide boxes are; hatched red areas must stay empty background; do not draw the guide lines, labels or colors. Also attach art/reference/shop_mood.webp as the mood reference: same materials, palette and light, but as a cross-section of the whole building.
- Приложи как основу для правки: art/guides/building_layout.png

## zones/R09_broken.png — 448×240

- Почему: новая картинка
- Что: A rusty garage roller shutter jammed half-open, bent slats hanging down. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:240.

## zones/R09_fixed.png — 448×240

- Почему: новая картинка
- Что: A repaired garage roller shutter rolled up neatly under the ceiling. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 448:240.
- Приложи как основу для правки: public/sprites/zones/R09_broken.png

## zones/R10_broken.png — 384×96

- Почему: новая картинка
- Что: An inspection pit in the floor filled with rubble and broken boards. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:96.

## zones/R10_fixed.png — 384×96

- Почему: новая картинка
- Что: A clean inspection pit with a steel rim and a small ladder. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:96.
- Приложи как основу для правки: public/sprites/zones/R10_broken.png

## zones/R11_broken.png — 144×544

- Почему: новая картинка
- Что: A toppled rusty two-post car lift, one post leaning. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 144:544.

## zones/R11_fixed.png — 144×544

- Почему: новая картинка
- Что: An upright two-post car lift, freshly painted, arms folded. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 144:544.
- Приложи как основу для правки: public/sprites/zones/R11_broken.png

## zones/R12_broken.png — 320×400

- Почему: новая картинка
- Что: A small caravan van with a flat tyre, open hood and missing headlight, side view facing right. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 320:400.

## zones/R12_fixed.png — 320×400

- Почему: новая картинка
- Что: The same small caravan van repaired, headlights on, roof rack with tied cargo, side view facing right. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 320:400.
- Приложи как основу для правки: public/sprites/zones/R12_broken.png

## zones/R13_broken.png — 384×200

- Почему: новая картинка
- Что: A heavy floor hatch buried under concrete debris and a fallen beam. Worn, dusty, clearly broken or missing, but not scary.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:200.

## zones/R13_fixed.png — 384×200

- Почему: новая картинка
- Что: An open heavy service hatch with a ladder going down and warm light below. Clearly repaired and useful, slightly warmer colors than the broken version, same size and position.
- Кадр: One isolated object for a building cross-section scene, seen from the same slightly elevated front view as the building, fills the frame edge to edge horizontally, base at the bottom of the frame, transparent background, no wall, no floor, no backdrop, no people, no text. Aspect ratio 384:200.
- Приложи как основу для правки: public/sprites/zones/R13_broken.png

## characters/SAVVA.png — 320×640

- Почему: новая картинка
- Что: Savva, a weathered caravan driver in his 50s, short grey beard, flat cap, leather jacket with patches, driving goggles around his neck, cargo trousers, heavy boots, a road map in his hand.
- Кадр: Single character, full body standing, facing the viewer slightly turned left, centered, feet at the bottom of the frame, whole silhouette visible, transparent background, no ground shadow, no text. Same outfit and face as the portrait.
- Приложи как основу для правки: public/sprites/portraits/SAVVA.png

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

## ui/finger.png — 128×128

- Почему: новая картинка
- Что: A cartoon hand with the index finger pointing straight UP, sleeve cuff at the bottom, friendly tutorial pointer for a mobile game, slightly worn work-glove look matching the post-apocalyptic style.
- Кадр: Single hand, fingertip at the top center of the frame, fills about 85% of the frame, transparent background, no text, no shadow on the ground.
