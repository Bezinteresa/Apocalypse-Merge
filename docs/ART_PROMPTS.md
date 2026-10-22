# Графика через ChatGPT — промты

Версия 1 · 22 октября 2026 года. Решение пользователя: изображения генерирует пользователь в ChatGPT, промты готовит агент. Механики проверены на условной графике; этот документ — задание на визуальный этап первой главы.

Промты написаны на английском: генераторы изображений точнее следуют английскому описанию. Пояснения — на русском.

## 1. Как работать

1. **Один чат на одну группу** (предметы, генераторы, портреты, магазин, коллекция). Так ChatGPT держит стиль внутри группы.
2. **Первым сообщением в каждом чате — блок стиля** из раздела 2. Затем по одному промту на картинку.
3. **Первую удачную картинку группы закрепляйте как образец:** прикладывайте её к следующим запросам с фразой `Match the exact art style, line weight, lighting and colors of the attached image.`
4. **Предметы одной цепочки делайте подряд** и прикладывайте предыдущий уровень: `Same item family as the attached image, next upgrade level.` Так рост уровня будет читаться.
5. **Магазин делайте правками одной картинки** (раздел 7): сначала разрушенный магазин, затем каждое восстановление — правка предыдущего результата.
6. Если вышел текст, рамка, тень на фоне или лишние предметы — попросите исправить: `Remove all text and the background, keep only the object on transparent background.`
7. Скачивайте PNG и сохраняйте под именами из таблиц ниже в папку `public/art/…`. Подключение в код агент сделает, когда появятся файлы; пока их нет, игра показывает текущие условные плашки.

## 2. Блок стиля — отправлять первым в каждом чате

```text
You are making game art for "Apocalypse Merge", a cozy post-apocalyptic merge-2 mobile game about restoring a small shop at a city crossroads.

Art style rules for every image in this chat:
- Hand-painted 2D cartoon style, clean bold outlines, soft cel shading, slightly chunky proportions, friendly and readable at small sizes.
- Mood: hope and everyday humor among ruins. Worn, rusty, patched and repaired, but never gory, scary or dark. No weapons, no blood, no skulls.
- Palette: rust orange, concrete grey, faded olive and teal as the base; warm accents (lamp yellow, fabric red, plant green) for restored and valuable things.
- Lighting: soft warm key light from the upper left, gentle ambient occlusion, no harsh black shadows.
- Objects are original designs for this game. No logos, no brand names, no readable text, no watermarks, no signatures.
- Unless I say otherwise: one centered object, 3/4 front view, fills about 80% of the frame, transparent background, no ground shadow, no frame, square 1024x1024 PNG.
Reply only with the image.
```

## 3. Техтребования и имена файлов

| Группа | Размер | Фон | Папка | Имена |
| --- | --- | --- | --- | --- |
| Предметы | 1024×1024 | прозрачный | `public/art/items/` | `T01.png` … `E06.png` (ID из каталога) |
| Генераторы | 1024×1024 | прозрачный | `public/art/generators/` | `G_TOOL.png`, `G_MATERIAL.png`, `G_PROVISION.png`, `G_ELECTRIC.png` |
| Портреты | 1024×1024 | прозрачный | `public/art/portraits/` | `LEV.png`, `NIKA.png`, `MARTA.png` |
| Магазин | 1536×1024 | непрозрачный | `public/art/shop/` | `shop_00.png` (разрушен), `shop_R01.png` … `shop_R08.png` |
| Сундуки | 1024×1024 | прозрачный | `public/art/chests/` | `CH_WORN.png`, `CH_TRADER.png`, `CH_ARCHIVE.png` |
| Карты коллекции | 1024×1536 | непрозрачный | `public/art/cards/` | `C_POSTCARD.png` … `C_POWER_SCHEME.png` |
| Иконки и поле | 1024×1024 | прозрачный | `public/art/ui/` | имена в разделе 9 |

Латиница в именах обязательна (требование площадок к архиву). Перед сборкой агент уменьшит картинки (предметы до 256×256, WebP), исходники в сборку не попадут.

## 4. Предметы — 22 штуки

Рост уровня должен читаться **силуэтом и количеством деталей**, а не только цветом: каждый следующий уровень крупнее, полнее, аккуратнее. Цветовой акцент цепочки сохраняется на всех уровнях.

### Цепочка T — инструменты (акцент: оранжевые рукояти)

| Файл | Промт |
| --- | --- |
| `T01.png` | `A single old flathead screwdriver with a chipped orange plastic handle wrapped in electrical tape, slightly rusty tip.` |
| `T02.png` | `A pair of worn combination pliers with orange rubber grips, one grip patched with tape, next to a small screwdriver — level 2 of the tool family, slightly bigger set than a single screwdriver.` |
| `T03.png` | `An adjustable wrench with an orange grip, cleaned up and oiled, with a small loop of wire tied to the handle. Sturdier and more valuable than pliers.` |
| `T04.png` | `A solid claw hammer with an orange-wrapped wooden handle, reinforced with metal bands, a couple of nails stuck in a leather strap around the handle.` |
| `T05.png` | `An open dented metal toolbox with orange trim, filled with a screwdriver, pliers, wrench and hammer neatly arranged. Clearly a complete tool set.` |
| `T06.png` | `A master repair kit: a large orange-and-steel rolling tool chest with drawers slightly open, tools neatly organized, a small brass plate without text and a warm glint — the best tool item.` |

### Цепочка M — материалы (акцент: сталь, серо-голубой металл)

| Файл | Промт |
| --- | --- |
| `M01.png` | `A small pile of scrap metal: a bent pipe piece, a rusty bracket and a few bolts.` |
| `M02.png` | `Prepared metal parts: several cleaned brackets and plates tied together with wire, stacked neatly. Less rust, more order than scrap.` |
| `M03.png` | `A stack of flat sheet metal panels with straightened edges, cool steel-blue tone, held by a strap.` |
| `M04.png` | `A reinforced metal frame: a welded rectangular steel frame with diagonal braces and fresh bolts, steel-blue with a few orange paint marks.` |
| `M05.png` | `A construction kit: a sturdy pallet with steel beams, sheet panels, a bucket of bolts and a coil of rope, all strapped together — the top materials item.` |

### Цепочка P — припасы (акцент: оливково-зелёная упаковка)

| Файл | Промт |
| --- | --- |
| `P01.png` | `A single dented tin can of food with a plain olive-green paper wrap without text.` |
| `P02.png` | `Two tin cans of food tied together with twine, olive-green wraps, one can slightly dented.` |
| `P03.png` | `A packed lunch: a cloth bundle tied with twine holding a can, a bread loaf and an apple, olive-green cloth.` |
| `P04.png` | `A field ration pack: a sturdy olive-green canvas pouch with straps, a flask clipped to it, a few sealed packets peeking out.` |
| `P05.png` | `An expedition supply crate: a wooden crate with olive-green canvas cover, cans, ration pouches, a water canister and dried herbs — the top provisions item.` |

### Цепочка E — электрика (акцент: жёлтые провода и детали)

| Файл | Промт |
| --- | --- |
| `E01.png` | `A short piece of electrical wire with yellow insulation and bare copper ends, slightly kinked.` |
| `E02.png` | `A neat coil of yellow electrical wire wrapped around a small wooden spool.` |
| `E03.png` | `A connector set: a small open tin box with assorted plugs, sockets and yellow connectors, a little roll of tape.` |
| `E04.png` | `A repair circuit board: a green circuit board with yellow wires soldered on, a couple of capacitors and a small blinking amber LED.` |
| `E05.png` | `A power unit: a boxy metal power supply with a yellow stripe, a cooling grill, a toggle switch and a short cable, softly glowing indicator.` |
| `E06.png` | `A control panel: a compact metal control panel with yellow switches, round dials and glowing amber lamps, cables neatly bundled — the top electrics item.` |

## 5. Генераторы — 4 штуки

Генератор стоит на поле постоянно, поэтому он должен отличаться от предметов: крупнее, «мебель», с намёком на то, что из него достают.

| Файл | Промт |
| --- | --- |
| `G_TOOL.png` | `A big old wooden workshop box with an orange painted lid propped open, screwdrivers and tool handles sticking out, a strap handle on the side. Looks like a source of tools. Slightly larger and more furniture-like than regular items.` |
| `G_MATERIAL.png` | `A rusty steel-blue cargo container cut down to a small crate size, door half open, pipes and metal sheets visible inside. A source of building materials.` |
| `G_PROVISION.png` | `A wooden supply crate with olive-green canvas tarp pulled back, tin cans and bread visible inside, a hand-painted green leaf mark without text. A source of food.` |
| `G_ELECTRIC.png` | `A small workbench with a yellow lamp, an old radio, coils of wire and circuit boards on it, a drawer half open with parts. A source of electrical parts.` |

## 6. Портреты — 3 персонажа

Для каждого нужен портрет по пояс. Сначала сделайте основной вариант, затем попросите ту же картинку с другой эмоцией: `Same character, same outfit and style, now smiling happily.` Имена файлов для эмоций: `LEV_happy.png` и т. п.

| Файл | Промт |
| --- | --- |
| `LEV.png` | `Waist-up portrait of Lev, a friendly young courier in his mid-20s, messy dark hair, light stubble, a long patched scarf, a canvas messenger bag across his chest, fingerless gloves, a warm confident grin. Facing slightly left, waving with one hand. Transparent background.` |
| `NIKA.png` | `Waist-up portrait of Nika, a kind young assistant of the local medic, about 20, short ginger hair with a green bandana, freckles, a light jacket with a hand-sewn armband (simple plus sign, no text), holding a clipboard. Gentle, caring smile. Facing slightly left. Transparent background.` |
| `MARTA.png` | `Waist-up portrait of Marta, an experienced mechanic in her mid-40s, grey-streaked hair in a bun, welding goggles pushed up on her forehead, oil-stained overalls with rolled sleeves, a wrench in her hand. Shrewd, amused expression. Facing slightly left. Transparent background.` |

## 7. Магазин — 9 состояний одной сцены

Делайте **правками одной картинки**: загрузите предыдущий результат и отправьте промт следующего шага. Ракурс, рамка кадра и расположение объектов не должны меняться между шагами — от этого зависит, заметит ли игрок изменения.

Первый промт (без блока «один объект» — это сцена):

```text
shop_00: A wide scene, 3:2 landscape, 1536x1024, NOT transparent. Fixed slightly isometric front view of a small ruined corner shop at a city crossroads after the apocalypse. Left part: the entrance blocked by a pile of rubble and broken boards. Center: a smashed shop counter lying on its side. Right wall: an empty broken shelf. Back: a doorway to a dark storeroom with fallen crates. Right back corner: a dusty workbench area covered with junk. Ceiling: dead lamps hanging on wires. Outside the front window on the right: an empty dry water tank stand. Above the entrance: a blank broken sign board with no text. Overcast cool light, dust, but the scene is cozy-looking and hopeful, not scary. Same art style as defined. No people. No text anywhere.
```

Затем по одному шагу, каждый раз прикладывая предыдущую картинку:

| Файл | Промт правки |
| --- | --- |
| `shop_R01.png` | `Edit the attached image. Keep everything identical except: the rubble at the entrance is cleared and the doorway is secured with fresh wooden beams and a simple door mat. Nothing else changes.` |
| `shop_R02.png` | `Edit the attached image. Keep everything identical except: the shop counter in the center is restored — upright, patched with metal sheets, clean top with a small cash box. Nothing else changes.` |
| `shop_R03.png` | `Edit the attached image. Keep everything identical except: the right wall shelf is fixed and stocked with tin cans, jars and food packs in olive-green wraps. Nothing else changes.` |
| `shop_R04.png` | `Edit the attached image. Keep everything identical except: the back storeroom is tidy — crates stacked neatly on new metal racks, visible through the doorway. Nothing else changes.` |
| `shop_R05.png` | `Edit the attached image. Keep everything identical except: the back right corner is now a working mechanic's workbench with a vise, hanging tools and a small lamp (still off). Nothing else changes.` |
| `shop_R06.png` | `Edit the attached image. Keep everything identical except: the electricity is back — ceiling lamps glow warm yellow, the workbench lamp is on, an old radio on the counter has a softly glowing dial. The overall light becomes warmer. Nothing else changes.` |
| `shop_R07.png` | `Edit the attached image. Keep everything identical except: outside the right window the water tank stand now holds a clean blue water tank with a small pump and a tap with a bucket under it. Nothing else changes.` |
| `shop_R08.png` | `Edit the attached image. Keep everything identical except: the sign board above the entrance is repaired and lit with warm string lights (still no text on it), potted plants by the door, and a few friendly silhouettes of customers outside the window. The scene feels alive and welcoming. Nothing else changes.` |

Если правка сдвинула ракурс или перерисовала всю сцену — повторите с фразой `Do not change the camera, composition or any other object.`

## 8. Коллекция — сундуки и карты

### Сундуки

| Файл | Промт |
| --- | --- |
| `CH_WORN.png` | `A small worn wooden chest with rusty iron corners and a simple latch, slightly scuffed, a faint warm glow leaking from the lid gap. Modest reward look.` |
| `CH_TRADER.png` | `A medium trader's chest: sturdy wood with teal painted panels, brass corners, leather straps and a padlock, a warmer glow from the lid gap. Clearly better than a worn chest.` |
| `CH_ARCHIVE.png` | `A large archive chest: dark steel with riveted plates, a round dial lock, old archive stamps as abstract shapes without text, a bright golden glow from the seams. The most valuable chest.` |

### Карты набора «Старый мир»

Формат карты: **1024×1536, вертикально, непрозрачный фон**, без текста и рамки — рамку редкости рисует игра. К каждому промту добавляйте в начало:

```text
Collection card illustration, portrait 2:3, 1024x1536, NOT transparent, no text, no frame, no border. A nostalgic still life of a pre-apocalypse object, softly lit, on a muted textured background. Same art style as defined.
```

| Файл | Редкость | Промт |
| --- | --- | --- |
| `C_POSTCARD.png` | обычная | `A faded pre-war holiday postcard showing a cheerful intact city skyline, slightly bent corner, lying on an old wooden table.` |
| `C_TRAM_TICKET.png` | обычная | `An old paper tram ticket with a punched hole, next to a small tram rail fragment and dust, warm nostalgic light.` |
| `C_TIN_TOY.png` | обычная | `A colorful wind-up tin toy robot with a small key in its back, a bit scratched, standing on a windowsill.` |
| `C_SEEDS.png` | обычная | `A small paper seed packet with a drawing of red tomatoes (no letters), a few seeds spilled next to a tiny sprout in a cup.` |
| `C_METRO_MAP.png` | редкая | `A folded old metro map with colored lines and circles (abstract, no letters), one station under a crossroads circled by hand in red pencil.` |
| `C_RADIO.png` | редкая | `A vintage tube radio receiver with a glowing dial, a needle pointing to an unmarked spot, faint radio waves drawn as soft light rings.` |
| `C_PHOTO_ALBUM.png` | редкая | `An open family photo album with blurred vintage photos, the visible one shows a small corner shop with people at the counter (faces indistinct).` |
| `C_ARCHIVE_KEY.png` | эпическая | `A heavy old brass service key on a ring with a blank cardboard tag, lying on a dusty blueprint, mysterious cool light.` |
| `C_POWER_SCHEME.png` | легендарная | `An old technical schematic of an electric power line drawn on aged blue paper, the line going down underground into a hidden structure, glowing faintly golden as if alive. Epic, mysterious, hopeful.` |

## 9. Иконки и поле

| Файл | Промт |
| --- | --- |
| `coin.png` | `A game currency icon: a single chunky bottle cap–style coin made of brass, with a simple star stamped on it, shiny.` |
| `energy.png` | `A game energy icon: a small round battery with a glowing yellow lightning bolt on it.` |
| `token.png` | `A game token icon: a small archive token, a round bronze disc with a punched keyhole shape in the middle.` |
| `cell_locked.png` | `A game board tile, square, top-down: a closed cardboard box taped shut, slightly dusty, filling the whole tile. Used for locked cells.` |
| `cell.png` | `A game board tile, square, top-down: a clean light wooden floor plank tile with subtle texture and soft rounded corners, filling the whole tile. Plain, low contrast.` |
| `bg_board.png` | `A seamless background, 1024x1024, NOT transparent: an old shop floor of worn wooden planks and a bit of concrete, low contrast, muted warm tones, no objects.` |

## 10. Проверка перед подключением

- Все 22 предмета различимы на картинке размером 48×48 пикселей: уменьшите и посмотрите на телефоне.
- Соседние уровни одной цепочки отличаются силуэтом, а не только оттенком (GAME_DESIGN, раздел 12).
- Нет текста, логотипов и узнаваемых брендов; персонажи не похожи на реальных людей и героев чужих игр.
- Магазин: на всех 9 состояниях совпадают ракурс и расположение зон; изменение каждого шага видно сразу.
- Права: проверьте условия использования изображений ChatGPT для коммерческой игры на дату публикации.
